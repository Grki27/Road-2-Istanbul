"use client";

import { useEffect, useState } from "react";

export function ExpandableText({
  text,
  className,
  collapsedClassName = "line-clamp-3",
  threshold = 170,
  expandEventId
}: {
  text: string;
  className?: string;
  collapsedClassName?: string;
  threshold?: number;
  expandEventId?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const canExpand = text.trim().length > threshold;

  useEffect(() => {
    if (!expandEventId) return;

    function expandFromMap(event: Event) {
      const recapId = (event as CustomEvent<{ recapId?: string }>).detail?.recapId;
      if (recapId === expandEventId) {
        setExpanded(true);
      }
    }

    window.addEventListener("expand-recap-text", expandFromMap);
    return () => window.removeEventListener("expand-recap-text", expandFromMap);
  }, [expandEventId]);

  return (
    <div>
      <p className={`whitespace-pre-line ${className ?? ""} ${canExpand && !expanded ? collapsedClassName : ""}`}>
        {text}
      </p>
      {canExpand ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="mt-2 text-sm font-black text-clay underline decoration-clay/35 underline-offset-4"
        >
          {expanded ? "Prikaži manje" : "Pročitaj više"}
        </button>
      ) : null}
    </div>
  );
}
