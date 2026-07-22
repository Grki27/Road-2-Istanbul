"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Point = {
  x: number;
  y: number;
};

type TrailPoint = Point & {
  createdAt: number;
};

type MotionSegment = {
  start: Point;
  control: Point;
  end: Point;
  startedAt: number;
  duration: number;
};

const TRAIL_LIFETIME_MS = 2500;
const MIN_TOP = 72;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function randomBetween(min: number, max: number) {
  return min + Math.random() * Math.max(max - min, 0);
}

function quadraticPoint(segment: MotionSegment, progress: number) {
  const inverse = 1 - progress;

  return {
    x:
      inverse * inverse * segment.start.x +
      2 * inverse * progress * segment.control.x +
      progress * progress * segment.end.x,
    y:
      inverse * inverse * segment.start.y +
      2 * inverse * progress * segment.control.y +
      progress * progress * segment.end.y
  };
}

function quadraticDirection(segment: MotionSegment, progress: number) {
  return {
    x:
      2 * (1 - progress) * (segment.control.x - segment.start.x) +
      2 * progress * (segment.end.x - segment.control.x),
    y:
      2 * (1 - progress) * (segment.control.y - segment.start.y) +
      2 * progress * (segment.end.y - segment.control.y)
  };
}

export function WanderingBicycle() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const positionRef = useRef<HTMLDivElement | null>(null);
  const directionRef = useRef<HTMLDivElement | null>(null);
  const puncturedRef = useRef(false);
  const [isPunctured, setIsPunctured] = useState(false);
  const [isInRegion, setIsInRegion] = useState(false);

  useEffect(() => {
    const flatFrame = new window.Image();
    flatFrame.src = "/assets/bicycle-flat.png";
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
    let current: Point = { x: 24, y: 140 };
    let segment: MotionSegment | null = null;
    let animationFrame = 0;
    let lastTrailAt = 0;
    let lastRegionState = false;
    let facing = 1;

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

    function createSegment(now: number, maxX: number, maxY: number): MotionSegment {
      let end = current;

      for (let attempt = 0; attempt < 5; attempt += 1) {
        const candidate = {
          x: randomBetween(12, maxX),
          y: randomBetween(MIN_TOP, maxY)
        };
        const distance = Math.hypot(candidate.x - current.x, candidate.y - current.y);
        end = candidate;
        if (distance > 110) break;
      }

      const deltaX = end.x - current.x;
      const deltaY = end.y - current.y;
      const distance = Math.max(Math.hypot(deltaX, deltaY), 1);
      const curve = randomBetween(-0.42, 0.42) * Math.min(distance, 300);
      const control = {
        x: clamp((current.x + end.x) / 2 + (-deltaY / distance) * curve, 12, maxX),
        y: clamp((current.y + end.y) / 2 + (deltaX / distance) * curve, MIN_TOP, maxY)
      };

      return {
        start: { ...current },
        control,
        end,
        startedAt: now,
        duration: clamp(distance / randomBetween(0.075, 0.12), 2800, 6500)
      };
    }

    function drawTrail(now: number, visible: boolean) {
      activeContext.clearRect(0, 0, window.innerWidth, window.innerHeight);

      if (!visible) {
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
      const bounds = getBounds();

      if (bounds.visible !== lastRegionState) {
        lastRegionState = bounds.visible;
        setIsInRegion(bounds.visible);
      }

      activePositionElement.style.opacity = bounds.visible ? "1" : "0";
      activePositionElement.style.pointerEvents = bounds.visible ? "auto" : "none";

      if (bounds.visible) {
        current.x = clamp(current.x, 12, bounds.maxX);
        current.y = clamp(current.y, MIN_TOP, bounds.maxY);

        if (!puncturedRef.current && !reducedMotion) {
          if (!segment || now >= segment.startedAt + segment.duration) {
            segment = createSegment(now, bounds.maxX, bounds.maxY);
          }

          const progress = clamp((now - segment.startedAt) / segment.duration, 0, 1);
          current = quadraticPoint(segment, progress);
          current.x = clamp(current.x, 12, bounds.maxX);
          current.y = clamp(current.y, MIN_TOP, bounds.maxY);

          const direction = quadraticDirection(segment, progress);
          if (Math.abs(direction.x) > 0.1) facing = direction.x < 0 ? -1 : 1;
          const angle = clamp(
            Math.atan2(direction.y, Math.max(Math.abs(direction.x), 1)) * (180 / Math.PI),
            -18,
            18
          );
          activeDirectionElement.style.transform = `scaleX(${facing}) rotate(${angle}deg)`;

          if (now - lastTrailAt >= 90) {
            trail.push({
              x: current.x + bounds.spriteWidth / 2,
              y: current.y + bounds.spriteHeight * 0.64,
              createdAt: now
            });
            lastTrailAt = now;
          }
        } else if (reducedMotion && !puncturedRef.current) {
          current.x = bounds.maxX;
          current.y = Math.min(120, bounds.maxY);
        }

        activePositionElement.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      }

      drawTrail(now, bounds.visible);
      animationFrame = window.requestAnimationFrame(animate);
    }

    animationFrame = window.requestAnimationFrame(animate);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      activeContext.clearRect(0, 0, activeCanvas.width, activeCanvas.height);
    };
  }, []);

  function punctureTire() {
    if (puncturedRef.current) return;
    puncturedRef.current = true;
    setIsPunctured(true);
  }

  return (
    <div aria-hidden={!isInRegion} className="fixed inset-0 z-[70] pointer-events-none">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div
        ref={positionRef}
        className="absolute left-0 top-0 aspect-[3/2] w-20 opacity-0 transition-opacity duration-300 sm:w-24"
      >
        <div ref={directionRef} className="h-full w-full will-change-transform">
          <button
            aria-label={isPunctured ? "Bicikla s probušenom gumom" : "Probuši gumu bicikle"}
            className={`relative block h-full w-full touch-manipulation appearance-none border-0 bg-transparent p-0 ${
              isPunctured ? "bicycle-punctured cursor-default" : "cursor-pointer"
            }`}
            disabled={isPunctured || !isInRegion}
            onClick={punctureTire}
            type="button"
          >
            <Image
              alt=""
              className="pointer-events-none select-none object-contain"
              draggable={false}
              fill
              sizes="(max-width: 639px) 80px, 96px"
              src={isPunctured ? "/assets/bicycle-flat.png" : "/assets/bicycle-moving.png"}
            />
            {isPunctured ? <span aria-hidden="true" className="bicycle-puncture-burst" /> : null}
          </button>
        </div>
      </div>
      <span className="sr-only" aria-live="polite">
        {isPunctured ? "Guma na bicikli je probušena." : ""}
      </span>
    </div>
  );
}
