"use client";

import { type PointerEvent, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Eraser, Palette, PenLine, Plus, RotateCcw, Send, X } from "lucide-react";
import { moderateSubmittedWallNoteAction, moveWallNoteAction, submitWallNoteAction } from "@app/public-actions";
import { SectionHeader } from "@/components/SectionHeader";
import type { DrawingData, DrawingPoint, DrawingStroke, StickyNote } from "@/types";

type DragState = {
  id: string;
  pointerId: number;
  offsetXPercent: number;
  offsetYPercent: number;
};

const boardClamp = {
  minX: 2,
  maxX: 82,
  minY: 8,
  maxY: 78
};

const noteColors = ["#ffe08a", "#c8f3d4", "#ffd0df", "#d6edff", "#f8c98d"];
const penColors = [
  { label: "Crna", value: "#111111" },
  { label: "Crvena", value: "#d33a2c" },
  { label: "Plava", value: "#1f65d6" },
  { label: "Zelena", value: "#2f8a4b" },
  { label: "Zuta", value: "#f0b429" },
  { label: "Ljubicasta", value: "#7c3aed" }
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function wordCount(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function createEmptyDrawingData(): DrawingData {
  return {
    width: 360,
    height: 450,
    strokes: []
  };
}

function drawingToDataUrl(drawingData?: DrawingData) {
  if (!drawingData || !drawingData.strokes.length) return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = drawingData.width;
  canvas.height = drawingData.height;
  const context = canvas.getContext("2d");
  if (!context) return undefined;

  context.fillStyle = "#fff8ea";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = 7;

  drawingData.strokes.forEach((stroke) => {
    if (!stroke.points.length) return;
    context.beginPath();
    context.strokeStyle = stroke.color || "#111111";
    const [firstPoint, ...restPoints] = stroke.points;
    context.moveTo(firstPoint.x * drawingData.width, firstPoint.y * drawingData.height);
    restPoints.forEach((point) => {
      context.lineTo(point.x * drawingData.width, point.y * drawingData.height);
    });
    context.stroke();
  });

  return canvas.toDataURL("image/png");
}

function drawingPoints(stroke: DrawingStroke, drawingData: DrawingData) {
  return stroke.points
    .map((point) => `${point.x * drawingData.width},${point.y * drawingData.height}`)
    .join(" ");
}

function DrawingStrokes({
  drawingData,
  activeStroke
}: {
  drawingData?: DrawingData;
  activeStroke?: DrawingStroke | null;
}) {
  const data = drawingData ?? createEmptyDrawingData();
  const strokes = activeStroke ? [...data.strokes, activeStroke] : data.strokes;

  if (!strokes.length) return null;

  return (
    <>
      {strokes.map((stroke, index) => (
        <polyline
          fill="none"
          key={index}
          points={drawingPoints(stroke, data)}
          stroke={stroke.color || "#111111"}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={7}
        />
      ))}
    </>
  );
}

function DrawingLayer({
  drawingData,
  activeStroke,
  className = ""
}: {
  drawingData?: DrawingData;
  activeStroke?: DrawingStroke | null;
  className?: string;
}) {
  const data = drawingData ?? createEmptyDrawingData();

  if (!drawingData?.strokes.length && !activeStroke) return null;

  return (
    <svg className={className} viewBox={`0 0 ${data.width} ${data.height}`} aria-hidden="true">
      <DrawingStrokes drawingData={drawingData} activeStroke={activeStroke} />
    </svg>
  );
}

export function WallOfSupport({ notes }: { notes: StickyNote[] }) {
  const router = useRouter();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef<SVGSVGElement | null>(null);
  const nextComposerColorIndexRef = useRef(0);
  const knownNoteIdsRef = useRef(new Set(notes.map((note) => note.id)));
  const topLayerRef = useRef(100);
  const [isOpen, setIsOpen] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [message, setMessage] = useState("");
  const [drawingData, setDrawingData] = useState<DrawingData | undefined>();
  const [activeStroke, setActiveStroke] = useState<DrawingStroke | null>(null);
  const [drawingMode, setDrawingMode] = useState(false);
  const [composerNoteColor, setComposerNoteColor] = useState(noteColors[0]);
  const [selectedPenColor, setSelectedPenColor] = useState<(typeof penColors)[number]["value"]>("#111111");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [result, setResult] = useState<{ status?: "approved" | "pending" | "rejected"; message: string } | null>(null);
  const [positions, setPositions] = useState(() => new Map(notes.map((note) => [note.id, {
    xPosition: note.xPosition,
    yPosition: note.yPosition
  }])));
  const [frontLayers, setFrontLayers] = useState<Map<string, number>>(() => new Map());
  const [drag, setDrag] = useState<DragState | null>(null);
  const [isPending, startTransition] = useTransition();
  const visibleNotes = useMemo(() => notes, [notes]);
  const currentWordCount = wordCount(message);

  useEffect(() => {
    const liveIds = new Set(notes.map((note) => note.id));
    const addedIds = notes
      .map((note) => note.id)
      .filter((id) => !knownNoteIdsRef.current.has(id));

    setPositions(new Map(notes.map((note) => [note.id, {
      xPosition: note.xPosition,
      yPosition: note.yPosition
    }])));

    setFrontLayers((currentLayers) => {
      const nextLayers = new Map(currentLayers);
      for (const id of nextLayers.keys()) {
        if (!liveIds.has(id)) nextLayers.delete(id);
      }
      for (const id of addedIds) {
        topLayerRef.current += 1;
        nextLayers.set(id, topLayerRef.current);
      }

      return nextLayers;
    });
    knownNoteIdsRef.current = liveIds;
  }, [notes]);

  function resetComposer() {
    setAuthorName("");
    setMessage("");
    setDrawingData(undefined);
    setActiveStroke(null);
    setDrawingMode(false);
    setPaletteOpen(false);
  }

  function openComposer() {
    const nextColorIndex = (notes.length + nextComposerColorIndexRef.current) % noteColors.length;
    nextComposerColorIndexRef.current += 1;
    resetComposer();
    setResult(null);
    setComposerNoteColor(noteColors[nextColorIndex]);
    setIsOpen(true);
  }

  function pointInBoard(clientX: number, clientY: number) {
    const rect = boardRef.current?.getBoundingClientRect();
    if (!rect) return { xPosition: 0, yPosition: 0 };

    return {
      xPosition: ((clientX - rect.left) / rect.width) * 100,
      yPosition: ((clientY - rect.top) / rect.height) * 100
    };
  }

  function startDrag(event: PointerEvent<HTMLElement>, note: StickyNote) {
    if (!boardRef.current) return;
    const current = positions.get(note.id) ?? note;
    const point = pointInBoard(event.clientX, event.clientY);
    const nextLayer = topLayerRef.current + 1;
    topLayerRef.current = nextLayer;
    setFrontLayers((currentLayers) => new Map(currentLayers).set(note.id, nextLayer));
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      id: note.id,
      pointerId: event.pointerId,
      offsetXPercent: point.xPosition - current.xPosition,
      offsetYPercent: point.yPosition - current.yPosition
    });
  }

  function moveDrag(event: PointerEvent<HTMLElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const point = pointInBoard(event.clientX, event.clientY);
    const next = {
      xPosition: clamp(point.xPosition - drag.offsetXPercent, boardClamp.minX, boardClamp.maxX),
      yPosition: clamp(point.yPosition - drag.offsetYPercent, boardClamp.minY, boardClamp.maxY)
    };
    setPositions((current) => new Map(current).set(drag.id, next));
  }

  function endDrag(event: PointerEvent<HTMLElement>) {
    if (!drag || drag.pointerId !== event.pointerId) return;
    const next = positions.get(drag.id);
    setDrag(null);
    if (!next) return;

    startTransition(async () => {
      await moveWallNoteAction({
        id: drag.id,
        xPosition: next.xPosition,
        yPosition: next.yPosition
      });
    });
  }

  function drawingPoint(event: PointerEvent<SVGSVGElement>): DrawingPoint {
    const rect = drawingRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };

    return {
      x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
      y: clamp((event.clientY - rect.top) / rect.height, 0, 1)
    };
  }

  function startDrawing(event: PointerEvent<SVGSVGElement>) {
    if (!drawingMode) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setActiveStroke({
      color: selectedPenColor,
      points: [drawingPoint(event)]
    });
  }

  function moveDrawing(event: PointerEvent<SVGSVGElement>) {
    if (!activeStroke || !drawingMode) return;
    event.preventDefault();
    const nextPoint = drawingPoint(event);
    setActiveStroke((current) => current
      ? {
          ...current,
          points: [...current.points, nextPoint]
        }
      : current);
  }

  function endDrawing() {
    if (!activeStroke) return;
    const data = drawingData ?? createEmptyDrawingData();
    setDrawingData({
      ...data,
      strokes: [...data.strokes, activeStroke].slice(-40)
    });
    setActiveStroke(null);
  }

  function undoDrawing() {
    const data = drawingData ?? createEmptyDrawingData();
    const nextStrokes = data.strokes.slice(0, -1);
    setDrawingData(nextStrokes.length ? { ...data, strokes: nextStrokes } : undefined);
    setActiveStroke(null);
  }

  function clearDrawing() {
    setDrawingData(undefined);
    setActiveStroke(null);
  }

  function submit() {
    setResult(null);
    startTransition(async () => {
      const actionResult = await submitWallNoteAction({
        authorName,
        message,
        noteColor: composerNoteColor,
        drawingData,
        drawingDataUrl: drawingToDataUrl(drawingData)
      });
      setResult({ status: actionResult.status, message: actionResult.message });

      if (actionResult.ok && actionResult.status === "approved" && actionResult.id) {
        resetComposer();
        router.refresh();

        const moderationResult = await moderateSubmittedWallNoteAction({
          id: actionResult.id,
          drawingDataUrl: drawingToDataUrl(drawingData)
        });
        setResult({ status: moderationResult.status, message: moderationResult.message });
        if (moderationResult.status === "rejected") {
          router.refresh();
        }
      }
    });
  }

  return (
    <section id="podrska" className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          eyebrow="Zid podrske"
          title="Ostavi nam poruku podrške."
          text="Sticky notes žive 24 sata - kao Instagram storyji. Dodaj poruku, nacrtaj nešto ako te ponese i zalijepi je na pano."
        />
        <div ref={boardRef} className="relative isolate min-h-[620px] overflow-hidden rounded-[2rem] bg-cork bg-[length:18px_18px,auto] p-4 shadow-paper md:min-h-[650px] md:p-8">
          <button
            className="absolute right-5 top-5 z-30 inline-flex items-center gap-2 rounded-full bg-paper px-5 py-3 font-black text-ink shadow-pin transition hover:-translate-y-0.5"
            onClick={openComposer}
            type="button"
          >
            <Plus size={18} />
            Dodaj poruku
          </button>
          <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(90deg,rgba(47,36,27,.2)_1px,transparent_1px),linear-gradient(rgba(47,36,27,.2)_1px,transparent_1px)] [background-size:44px_44px]" />
          {visibleNotes.map((note, index) => {
            const position = positions.get(note.id) ?? note;
            const frontLayer = frontLayers.get(note.id);

            return (
              <article
                aria-label={`Sticky note od ${note.authorName}`}
                className="absolute aspect-[4/5] w-44 cursor-grab touch-none overflow-hidden rounded-sm p-5 shadow-pin active:cursor-grabbing md:w-56"
                key={note.id}
                onPointerCancel={endDrag}
                onPointerDown={(event) => startDrag(event, note)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                style={{
                  left: `${position.xPosition}%`,
                  top: `${position.yPosition}%`,
                  transform: `rotate(${note.rotation}deg)`,
                  backgroundColor: note.noteColor,
                  zIndex: frontLayer ?? 5 + index
                }}
              >
                <span className="absolute left-1/2 top-2 h-4 w-4 -translate-x-1/2 rounded-full bg-clay shadow-inner" />
                <div className="relative z-10">
                  <p className="mt-8 font-display text-lg font-black md:text-xl">{note.authorName}</p>
                  <p className="mt-4 whitespace-pre-wrap text-sm font-bold leading-6 text-ink/82 md:text-base md:leading-7">{note.message}</p>
                </div>
                <DrawingLayer drawingData={note.drawingData} className="pointer-events-none absolute inset-0 h-full w-full" />
              </article>
            );
          })}
          {!visibleNotes.length ? (
            <div className="absolute inset-x-5 top-32 rounded-2xl bg-paper/95 p-6 text-center shadow-pin md:inset-x-auto md:left-8 md:w-96">
              <p className="font-display text-2xl font-black">Pano ceka prvu poruku.</p>
              <p className="mt-2 font-bold text-coffee/70">Ostavi kratki sticky note za cestu.</p>
            </div>
          ) : null}
        </div>
      </div>

      {isOpen ? (
        <div className="fixed inset-0 z-[9999] flex items-end bg-ink/55 px-3 pb-3 pt-10 backdrop-blur-sm sm:items-center sm:justify-center sm:p-5">
          <div aria-modal="true" className="max-h-[92vh] w-full max-w-xl overflow-hidden rounded-[2rem] bg-paper shadow-paper" role="dialog">
            <div className="flex items-start justify-between gap-4 border-b border-coffee/10 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-clay">Zid podrske</p>
                <h3 className="mt-1 font-display text-2xl font-black">Novi sticky note</h3>
              </div>
              <button aria-label="Zatvori" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-ink text-paper" onClick={() => setIsOpen(false)} type="button">
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[calc(92vh-6rem)] overflow-y-auto p-5">
              <div className="mx-auto max-w-sm">
                <div
                  className="relative aspect-[4/5] overflow-hidden rounded-sm p-5 shadow-pin"
                  style={{ backgroundColor: composerNoteColor }}
                >
                  <span className="absolute left-1/2 top-2 z-20 h-4 w-4 -translate-x-1/2 rounded-full bg-clay shadow-inner" />
                  <input
                    aria-label="Ime za sticky note"
                    className="relative z-10 mt-8 w-full border-0 bg-transparent font-display text-2xl font-black text-ink outline-none placeholder:text-ink/35"
                    maxLength={24}
                    onChange={(event) => setAuthorName(event.target.value)}
                    placeholder="Tvoje ime"
                    value={authorName}
                  />
                  <textarea
                    aria-label="Poruka za sticky note"
                    className="relative z-10 mt-4 h-36 w-full resize-none border-0 bg-transparent text-lg font-bold leading-7 text-ink/85 outline-none placeholder:text-ink/35"
                    maxLength={240}
                    onChange={(event) => setMessage(event.target.value)}
                    placeholder="Kratka poruka za cestu..."
                    value={message}
                  />
                  <svg
                    ref={drawingRef}
                    className={`absolute inset-0 h-full w-full ${drawingMode ? "z-30 touch-none cursor-crosshair" : "pointer-events-none"}`}
                    onPointerCancel={endDrawing}
                    onPointerDown={startDrawing}
                    onPointerLeave={endDrawing}
                    onPointerMove={moveDrawing}
                    onPointerUp={endDrawing}
                    viewBox={`0 0 ${createEmptyDrawingData().width} ${createEmptyDrawingData().height}`}
                  >
                    <DrawingStrokes drawingData={drawingData} activeStroke={activeStroke} />
                  </svg>
                </div>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <button
                    aria-label="Ukljuci crtanje"
                    className={`grid h-11 w-11 place-items-center rounded-full shadow-pin ${drawingMode ? "bg-ink text-paper" : "bg-white text-ink"}`}
                    onClick={() => setDrawingMode((current) => !current)}
                    type="button"
                  >
                    <PenLine size={19} />
                  </button>
                  <button
                    aria-label="Izaberi boju kemijske"
                    className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-pin"
                    onClick={() => setPaletteOpen((current) => !current)}
                    type="button"
                  >
                    <Palette size={19} />
                  </button>
                  <button type="button" onClick={undoDrawing} disabled={!drawingData?.strokes.length} className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-pin disabled:opacity-35" aria-label="Undo zadnji potez"><RotateCcw size={18} /></button>
                  <button type="button" onClick={clearDrawing} disabled={!drawingData?.strokes.length && !activeStroke} className="grid h-11 w-11 place-items-center rounded-full bg-white text-ink shadow-pin disabled:opacity-35" aria-label="Obrisi crtez"><Eraser size={18} /></button>
                </div>
                {paletteOpen ? (
                  <div className="mt-3 flex justify-center">
                    <div className="flex items-center gap-2 rounded-full bg-paper/95 p-3 shadow-paper">
                      {penColors.map((color) => (
                        <button
                          aria-label={`Boja: ${color.label}`}
                          className={`h-9 w-9 rounded-full border-2 shadow-sm transition ${selectedPenColor === color.value ? "border-ink ring-2 ring-ink/20" : "border-white/90 hover:border-ink/35"}`}
                          key={color.value}
                          onClick={() => {
                            setSelectedPenColor(color.value);
                            setPaletteOpen(false);
                            setDrawingMode(true);
                          }}
                          style={{ backgroundColor: color.value }}
                          type="button"
                        />
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-coffee/65">
                <span>{authorName.length}/24 znakova ime</span>
                <span className={currentWordCount > 20 ? "text-red-800" : ""}>{currentWordCount}/20 rijeci</span>
              </div>
              {result ? (
                <div className={`mt-3 rounded-2xl px-4 py-3 text-sm font-black ${
                  result.status === "approved"
                    ? "bg-lime-100 text-lime-950"
                    : result.status === "pending"
                      ? "bg-sand text-ink"
                      : "bg-red-100 text-red-950"
                }`}>
                  {result.message}
                </div>
              ) : null}
              <button
                className="mt-4 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 font-black text-paper disabled:opacity-55"
                disabled={isPending || !authorName.trim() || !message.trim() || currentWordCount > 20}
                onClick={submit}
                type="button"
              >
                <Send size={18} />
                {isPending ? "Saljem..." : "Zalijepi sticky note"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
