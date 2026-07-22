"use client";

import Image from "next/image";
import { type PointerEvent, useEffect, useRef, useState } from "react";

type Point = {
  x: number;
  y: number;
};

type TrailPoint = Point & {
  createdAt: number;
};

type BicyclePhase =
  | "moving"
  | "puncturing"
  | "punctured"
  | "breaking"
  | "broken"
  | "exiting"
  | "gone";

type Bounds = {
  maxX: number;
  maxY: number;
  spriteWidth: number;
  spriteHeight: number;
  visible: boolean;
};

const TRAIL_LIFETIME_MS = 2500;
const MIN_TOP = 72;
const MIN_SPEED = 48;
const MAX_SPEED = 98;
const MAX_ACCELERATION = 78;
const PUNCTURE_DURATION_MS = 680;
const BREAK_DURATION_MS = 560;
const BROKEN_HOLD_MS = 1500;
const EXIT_DURATION_MS = 650;
const DRAG_THRESHOLD_PX = 7;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * Math.max(max - min, 0);
}

function vectorLength(point: Point) {
  return Math.hypot(point.x, point.y);
}

function limitVector(point: Point, maximum: number) {
  const length = vectorLength(point);
  if (length <= maximum || length === 0) return point;
  const scale = maximum / length;
  return { x: point.x * scale, y: point.y * scale };
}

function phaseImage(phase: BicyclePhase) {
  if (phase === "moving") return "/assets/bicycle-moving.png";
  if (phase === "puncturing" || phase === "punctured") return "/assets/bicycle-flat.png";
  return "/assets/bicycle-broken.png";
}

export function WanderingBicycle() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const positionRef = useRef<HTMLDivElement | null>(null);
  const directionRef = useRef<HTMLDivElement | null>(null);
  const phaseRef = useRef<BicyclePhase>("moving");
  const timersRef = useRef<number[]>([]);
  const positionValueRef = useRef<Point>({ x: 24, y: 140 });
  const velocityRef = useRef<Point>({ x: 72, y: 18 });
  const boundsRef = useRef<Bounds | null>(null);
  const dragRef = useRef({
    active: false,
    pointerId: -1,
    pointerStart: { x: 0, y: 0 },
    offset: { x: 0, y: 0 },
    moved: false,
    hiddenByMap: false,
    lastPoint: { x: 0, y: 0 },
    lastTime: 0
  });
  const suppressNextClickRef = useRef(false);
  const [phase, setPhase] = useState<BicyclePhase>("moving");
  const [isInRegion, setIsInRegion] = useState(false);

  function changePhase(nextPhase: BicyclePhase) {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }

  function schedule(callback: () => void, delay: number) {
    const timer = window.setTimeout(callback, delay);
    timersRef.current.push(timer);
  }

  useEffect(() => {
    const preloadSources = ["/assets/bicycle-flat.png", "/assets/bicycle-broken.png"];
    preloadSources.forEach((source) => {
      const image = new window.Image();
      image.src = source;
    });

    const timers = timersRef.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const positionElement = positionRef.current;
    const directionElement = directionRef.current;

    if (!canvas || !positionElement || !directionElement) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    const activeCanvas = canvas;
    const activeContext = context;
    const activePositionElement = positionElement;
    const activeDirectionElement = directionElement;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const trail: TrailPoint[] = [];

    const position = positionValueRef.current;
    let steering: Point = { x: 0, y: 0 };
    let target: Point = { x: window.innerWidth * 0.7, y: window.innerHeight * 0.35 };
    let targetSpeed = 76;
    let nextTargetAt = 0;
    let animationFrame = 0;
    let previousFrameAt = 0;
    let lastTrailAt = 0;
    let lastRegionState = false;
    let facing = 1;
    let visualAngle = 0;

    function resizeCanvas() {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.round(window.innerWidth * pixelRatio);
      const height = Math.round(window.innerHeight * pixelRatio);

      if (activeCanvas.width !== width || activeCanvas.height !== height) {
        activeCanvas.width = width;
        activeCanvas.height = height;
        activeContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      }
    }

    function getBounds() {
      const title = document.getElementById("live-map-title");
      const titleTop = title?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
      const spriteWidth = activePositionElement.offsetWidth || 96;
      const spriteHeight = activePositionElement.offsetHeight || 64;
      const maxX = Math.max(12, window.innerWidth - spriteWidth - 12);
      const maxY = Math.min(
        window.innerHeight - spriteHeight - 16,
        titleTop - spriteHeight - 16
      );

      return {
        maxX,
        maxY,
        spriteWidth,
        spriteHeight,
        visible: titleTop > MIN_TOP + spriteHeight && maxY >= MIN_TOP
      };
    }

    function chooseTarget(now: number, maxX: number, maxY: number) {
      const horizontalPadding = Math.min(64, Math.max((maxX - 12) * 0.18, 18));
      const verticalPadding = Math.min(72, Math.max((maxY - MIN_TOP) * 0.18, 18));
      let candidate = target;

      for (let attempt = 0; attempt < 6; attempt += 1) {
        candidate = {
          x: randomBetween(12 + horizontalPadding, Math.max(12 + horizontalPadding, maxX - horizontalPadding)),
          y: randomBetween(MIN_TOP + verticalPadding, Math.max(MIN_TOP + verticalPadding, maxY - verticalPadding))
        };
        if (Math.hypot(candidate.x - position.x, candidate.y - position.y) > 120) break;
      }

      target = candidate;
      targetSpeed = randomBetween(62, MAX_SPEED);
      nextTargetAt = now + randomBetween(2800, 5200);
    }

    function boundaryAvoidance(maxX: number, maxY: number) {
      const marginX = Math.min(110, Math.max((maxX - 12) * 0.28, 48));
      const marginY = Math.min(100, Math.max((maxY - MIN_TOP) * 0.3, 42));
      const force: Point = { x: 0, y: 0 };
      const leftDistance = position.x - 12;
      const rightDistance = maxX - position.x;
      const topDistance = position.y - MIN_TOP;
      const bottomDistance = maxY - position.y;

      if (leftDistance < marginX) force.x += Math.pow(1 - leftDistance / marginX, 2) * MAX_SPEED * 1.8;
      if (rightDistance < marginX) force.x -= Math.pow(1 - rightDistance / marginX, 2) * MAX_SPEED * 1.8;
      if (topDistance < marginY) force.y += Math.pow(1 - topDistance / marginY, 2) * MAX_SPEED * 1.8;
      if (bottomDistance < marginY) force.y -= Math.pow(1 - bottomDistance / marginY, 2) * MAX_SPEED * 1.8;

      return force;
    }

    function updateMotion(now: number, deltaSeconds: number, maxX: number, maxY: number) {
      let velocity = velocityRef.current;
      const distanceToTarget = Math.hypot(target.x - position.x, target.y - position.y);
      if (
        now >= nextTargetAt ||
        distanceToTarget < 86 ||
        target.x > maxX ||
        target.y > maxY
      ) {
        chooseTarget(now, maxX, maxY);
      }

      const targetDelta = { x: target.x - position.x, y: target.y - position.y };
      const targetDistance = Math.max(vectorLength(targetDelta), 1);
      const avoidance = boundaryAvoidance(maxX, maxY);
      const desiredVelocity = limitVector({
        x: (targetDelta.x / targetDistance) * targetSpeed + avoidance.x,
        y: (targetDelta.y / targetDistance) * targetSpeed + avoidance.y
      }, MAX_SPEED);
      const requestedSteering = limitVector({
        x: desiredVelocity.x - velocity.x,
        y: desiredVelocity.y - velocity.y
      }, MAX_ACCELERATION);
      const steeringBlend = 1 - Math.exp(-deltaSeconds * 2.6);

      steering.x += (requestedSteering.x - steering.x) * steeringBlend;
      steering.y += (requestedSteering.y - steering.y) * steeringBlend;
      steering = limitVector(steering, MAX_ACCELERATION);

      velocity.x += steering.x * deltaSeconds;
      velocity.y += steering.y * deltaSeconds;

      const speed = vectorLength(velocity);
      if (speed > MAX_SPEED) {
        velocity = limitVector(velocity, MAX_SPEED);
      } else if (speed < MIN_SPEED && speed > 0) {
        const scale = MIN_SPEED / speed;
        velocity.x *= scale;
        velocity.y *= scale;
      }
      velocityRef.current = velocity;

      position.x += velocity.x * deltaSeconds;
      position.y += velocity.y * deltaSeconds;

      if (position.x < 12 || position.x > maxX) {
        position.x = clamp(position.x, 12, maxX);
        velocityRef.current.x *= 0.45;
      }
      if (position.y < MIN_TOP || position.y > maxY) {
        position.y = clamp(position.y, MIN_TOP, maxY);
        velocityRef.current.y *= 0.45;
      }

      if (Math.abs(velocityRef.current.x) > 22) facing = velocityRef.current.x < 0 ? -1 : 1;
      const targetAngle = clamp(
        Math.atan2(velocityRef.current.y, Math.max(Math.abs(velocityRef.current.x), 1)) * (180 / Math.PI),
        -18,
        18
      );
      const angleBlend = 1 - Math.exp(-deltaSeconds * 5);
      visualAngle += (targetAngle - visualAngle) * angleBlend;
      activeDirectionElement.style.transform = `scaleX(${facing}) rotate(${visualAngle}deg)`;
    }

    function drawTrail(now: number, clearImmediately: boolean) {
      activeContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (clearImmediately) {
        trail.length = 0;
        return;
      }

      while (trail.length && now - trail[0].createdAt > TRAIL_LIFETIME_MS) {
        trail.shift();
      }

      for (const point of trail) {
        const life = 1 - (now - point.createdAt) / TRAIL_LIFETIME_MS;
        activeContext.beginPath();
        activeContext.fillStyle = `rgba(217, 130, 75, ${Math.max(life, 0) * 0.48})`;
        activeContext.arc(point.x, point.y, 2.6 * Math.max(life, 0.35), 0, Math.PI * 2);
        activeContext.fill();
      }
    }

    function animate(now: number) {
      resizeCanvas();
      const currentPhase = phaseRef.current;

      if (currentPhase === "moving") {
        const bounds = getBounds();
        const drag = dragRef.current;
        boundsRef.current = bounds;

        if ((bounds.visible && !drag.hiddenByMap) !== lastRegionState) {
          lastRegionState = bounds.visible && !drag.hiddenByMap;
          setIsInRegion(lastRegionState);
        }

        activePositionElement.style.opacity = bounds.visible && !drag.hiddenByMap ? "1" : "0";
        activePositionElement.style.pointerEvents = bounds.visible && !drag.hiddenByMap ? "auto" : "none";

        if (bounds.visible && !drag.hiddenByMap) {
          if (previousFrameAt === 0) {
            position.x = clamp(position.x, 12, bounds.maxX);
            position.y = clamp(position.y, MIN_TOP, bounds.maxY);
            chooseTarget(now, bounds.maxX, bounds.maxY);
          }

          const deltaSeconds = previousFrameAt === 0
            ? 0
            : clamp((now - previousFrameAt) / 1000, 0, 0.05);

          if (drag.active) {
            visualAngle += (0 - visualAngle) * (1 - Math.exp(-deltaSeconds * 8));
            activeDirectionElement.style.transform = `scaleX(${facing}) rotate(${visualAngle}deg)`;
          } else if (!reducedMotion && deltaSeconds > 0) {
            updateMotion(now, deltaSeconds, bounds.maxX, bounds.maxY);

            if (now - lastTrailAt >= 90) {
              trail.push({
                x: position.x + bounds.spriteWidth / 2,
                y: position.y + bounds.spriteHeight * 0.64,
                createdAt: now
              });
              lastTrailAt = now;
            }
          } else if (reducedMotion) {
            position.x = bounds.maxX;
            position.y = Math.min(120, bounds.maxY);
          }

          activePositionElement.style.transform = `translate3d(${position.x}px, ${position.y}px, 0)`;
          previousFrameAt = now;
        } else {
          previousFrameAt = 0;
        }

        drawTrail(now, !bounds.visible || drag.hiddenByMap);
      } else if (currentPhase === "gone") {
        drawTrail(now, true);
      } else {
        drawTrail(now, false);
      }

      animationFrame = window.requestAnimationFrame(animate);
    }

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      activeContext.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    };
  }, []);

  function pinToPage() {
    const positionElement = positionRef.current;
    if (!positionElement) return;

    const rect = positionElement.getBoundingClientRect();
    const documentX = rect.left + window.scrollX;
    const documentY = rect.top + window.scrollY;

    positionElement.style.position = "absolute";
    positionElement.style.transform = `translate3d(${documentX}px, ${documentY}px, 0)`;
    positionElement.style.opacity = "1";
    positionElement.style.pointerEvents = "auto";
  }

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (phaseRef.current !== "moving" || !isInRegion) return;

    const positionElement = positionRef.current;
    if (!positionElement) return;

    const rect = positionElement.getBoundingClientRect();
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      pointerStart: { x: event.clientX, y: event.clientY },
      offset: { x: event.clientX - rect.left, y: event.clientY - rect.top },
      moved: false,
      hiddenByMap: false,
      lastPoint: { x: event.clientX, y: event.clientY },
      lastTime: performance.now()
    };

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId || phaseRef.current !== "moving") return;

    event.preventDefault();

    const bounds = boundsRef.current;
    if (!bounds) return;

    const now = performance.now();
    const deltaMs = Math.max(now - drag.lastTime, 1);
    const rawX = event.clientX - drag.offset.x;
    const rawY = event.clientY - drag.offset.y;
    const nextX = clamp(rawX, 12, bounds.maxX);
    const nextY = rawY;
    const movement = Math.hypot(
      event.clientX - drag.pointerStart.x,
      event.clientY - drag.pointerStart.y
    );

    if (movement >= DRAG_THRESHOLD_PX) drag.moved = true;

    const liveMapTop = document.getElementById("live-map-title")?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
    const pointerCrossedMap = event.clientY >= liveMapTop - 8;

    if (pointerCrossedMap || nextY > bounds.maxY || nextY < MIN_TOP - bounds.spriteHeight) {
      drag.hiddenByMap = true;
      drag.moved = true;
      suppressNextClickRef.current = true;
      positionValueRef.current.x = nextX;
      positionValueRef.current.y = clamp(nextY, MIN_TOP, bounds.maxY);
      return;
    }

    positionValueRef.current.x = nextX;
    positionValueRef.current.y = clamp(nextY, MIN_TOP, bounds.maxY);

    const releaseVelocity = limitVector({
      x: ((event.clientX - drag.lastPoint.x) / deltaMs) * 1000,
      y: ((event.clientY - drag.lastPoint.y) / deltaMs) * 1000
    }, MAX_SPEED);
    if (vectorLength(releaseVelocity) > 8) {
      velocityRef.current = releaseVelocity;
    }

    drag.lastPoint = { x: event.clientX, y: event.clientY };
    drag.lastTime = now;
  }

  function handlePointerUp(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    if (drag.moved || drag.hiddenByMap) {
      suppressNextClickRef.current = true;
    }

    drag.active = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // The browser may already release capture on touch cancellation.
    }
  }

  function handlePointerCancel(event: PointerEvent<HTMLButtonElement>) {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) return;

    suppressNextClickRef.current = drag.moved || drag.hiddenByMap;
    drag.active = false;
  }

  function handleBicycleClick() {
    if (suppressNextClickRef.current) {
      suppressNextClickRef.current = false;
      return;
    }

    if (phaseRef.current === "moving") {
      pinToPage();
      changePhase("puncturing");
      schedule(() => changePhase("punctured"), PUNCTURE_DURATION_MS);
      return;
    }

    if (phaseRef.current === "punctured") {
      changePhase("breaking");
      schedule(() => changePhase("broken"), BREAK_DURATION_MS);
      schedule(() => changePhase("exiting"), BREAK_DURATION_MS + BROKEN_HOLD_MS);
      schedule(() => changePhase("gone"), BREAK_DURATION_MS + BROKEN_HOLD_MS + EXIT_DURATION_MS);
    }
  }

  const canClick = (phase === "moving" && isInRegion) || phase === "punctured";
  const isHidden = phase === "gone" || (phase === "moving" && !isInRegion);
  const buttonAnimation = phase === "puncturing"
    ? "bicycle-puncturing"
    : phase === "exiting"
      ? "bicycle-exiting"
      : "";
  const ariaLabel = phase === "moving"
    ? "Probusi gumu bicikle"
    : phase === "punctured"
      ? "Rastavi probusenu biciklu"
      : phase === "gone"
        ? "Bicikla je nestala"
        : "Bicikla se mijenja";

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-[70] h-full w-full" />
      <div
        aria-hidden={isHidden}
        data-bicycle-phase={phase}
        ref={positionRef}
        className={`fixed left-0 top-0 z-[71] aspect-[3/2] w-20 transition-opacity duration-300 sm:w-24 ${
          phase === "gone" ? "invisible" : ""
        }`}
      >
        <div ref={directionRef} className="h-full w-full will-change-transform">
          <button
            aria-label={ariaLabel}
            className={`relative block h-full w-full touch-none appearance-none border-0 bg-transparent p-0 ${buttonAnimation} ${
              canClick ? "cursor-grab active:cursor-grabbing" : "cursor-default"
            }`}
            disabled={!canClick}
            onClick={handleBicycleClick}
            onPointerCancel={handlePointerCancel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            type="button"
          >
            {phase === "breaking" ? (
              <>
                <span className="bicycle-break-source absolute inset-0">
                  <Image alt="" className="pointer-events-none select-none object-contain" draggable={false} fill sizes="96px" src="/assets/bicycle-flat.png" />
                </span>
                <span className="bicycle-break-result absolute inset-0">
                  <Image alt="" className="pointer-events-none select-none object-contain" draggable={false} fill sizes="96px" src="/assets/bicycle-broken.png" />
                </span>
                <span aria-hidden="true" className="bicycle-break-burst" />
              </>
            ) : (
              <Image
                alt=""
                className="pointer-events-none select-none object-contain"
                draggable={false}
                fill
                sizes="(max-width: 639px) 80px, 96px"
                src={phaseImage(phase)}
              />
            )}
            {phase === "puncturing" ? <span aria-hidden="true" className="bicycle-puncture-burst" /> : null}
          </button>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {phase === "punctured"
          ? "Guma na bicikli je probusena. Klikni je ponovno da se raspadne."
          : phase === "broken"
            ? "Bicikla se raspala."
            : phase === "gone"
              ? "Raspadnuta bicikla je nestala."
              : ""}
      </span>
    </>
  );
}
