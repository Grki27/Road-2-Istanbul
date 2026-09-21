"use client";

import Image, { type ImageProps } from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type PhotoGalleryProps = {
  images: string[];
  title: string;
  className?: string;
  fallback?: string;
  priority?: boolean;
};

type GalleryImageProps = Pick<ImageProps, "alt" | "fill" | "priority" | "sizes"> & {
  className?: string;
  fallback: string;
  src: string;
};

function GalleryImage({
  alt,
  className = "",
  fallback,
  fill,
  priority,
  sizes,
  src
}: GalleryImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const imageSrc = failed ? fallback : src;

  useEffect(() => {
    setLoaded(false);
    setFailed(false);
  }, [src]);

  return (
    <>
      <span
        aria-hidden="true"
        className={`gallery-image-placeholder absolute inset-0 transition-opacity duration-300 ${loaded ? "opacity-0" : "opacity-100"}`}
      />
      <Image
        alt={alt}
        className={`${className} transition-opacity duration-300 ${loaded ? "opacity-100" : "opacity-0"}`}
        fill={fill}
        onError={() => {
          if (failed) {
            setLoaded(true);
            return;
          }
          setFailed(true);
        }}
        onLoad={() => setLoaded(true)}
        priority={priority}
        sizes={sizes}
        src={imageSrc}
      />
    </>
  );
}

export function PhotoGallery({
  images,
  title,
  className = "",
  fallback = "/assets/journey-support-1.jpg",
  priority = false
}: PhotoGalleryProps) {
  const galleryImages = useMemo(() => {
    const cleanImages = images.filter(Boolean);
    return cleanImages.length ? cleanImages : [fallback];
  }, [fallback, images]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const hasMultipleImages = galleryImages.length > 1;
  const visibleImages = galleryImages.slice(0, 4);

  useEffect(() => {
    if (activeIndex === null) return;

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") {
        setActiveIndex((current) => current === null ? current : (current - 1 + galleryImages.length) % galleryImages.length);
      }
      if (event.key === "ArrowRight") {
        setActiveIndex((current) => current === null ? current : (current + 1) % galleryImages.length);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeIndex, galleryImages.length]);

  function move(direction: -1 | 1) {
    setActiveIndex((current) => current === null ? current : (current + direction + galleryImages.length) % galleryImages.length);
  }

  if (!hasMultipleImages) {
    return (
      <button
        aria-label={`Otvori fotografiju: ${title}`}
        className={`group relative block overflow-hidden ${className}`}
        onClick={() => setActiveIndex(0)}
        type="button"
      >
        <GalleryImage
          alt={title}
          className="object-cover transition duration-300 group-hover:scale-[1.03]"
          fallback={fallback}
          fill
          priority={priority}
          sizes="(max-width: 768px) 100vw, 50vw"
          src={galleryImages[0]}
        />
      </button>
    );
  }

  return (
    <>
      <div className={`grid overflow-hidden ${galleryImages.length === 2 ? "grid-cols-2" : "grid-cols-2 grid-rows-2"} ${className}`}>
        {visibleImages.map((imageUrl, index) => (
          <button
            aria-label={`Otvori fotografiju ${index + 1} od ${galleryImages.length}: ${title}`}
            className={`group relative min-h-0 overflow-hidden border-0 bg-transparent p-0 ${
              galleryImages.length === 3 && index === 0 ? "row-span-2" : ""
            } ${galleryImages.length === 2 ? "h-full" : ""}`}
            key={`${imageUrl}-${index}`}
            onClick={() => setActiveIndex(index)}
            type="button"
          >
            <GalleryImage
              alt={`${title}, fotografija ${index + 1}`}
              className="object-cover transition duration-300 group-hover:scale-[1.04]"
              fallback={fallback}
              fill
              priority={priority && index === 0}
              sizes="(max-width: 768px) 50vw, 33vw"
              src={imageUrl}
            />
            {index === visibleImages.length - 1 && galleryImages.length > visibleImages.length ? (
              <span className="absolute inset-0 grid place-items-center bg-ink/62 font-display text-3xl font-black text-paper">
                +{galleryImages.length - visibleImages.length}
              </span>
            ) : null}
          </button>
        ))}
      </div>

      {activeIndex !== null ? (
        <div
          aria-label={`Galerija: ${title}`}
          aria-modal="true"
          className="fixed inset-0 z-[110] flex flex-col bg-ink/95 text-paper"
          role="dialog"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-black sm:text-2xl">{title}</p>
              <p className="text-sm font-bold text-paper/70">{activeIndex + 1} / {galleryImages.length}</p>
            </div>
            <button
              aria-label="Zatvori galeriju"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-paper text-ink"
              onClick={() => setActiveIndex(null)}
              type="button"
            >
              <X size={22} />
            </button>
          </div>
          <div className="relative min-h-0 flex-1">
            <GalleryImage
              alt={`${title}, fotografija ${activeIndex + 1}`}
              className="object-contain"
              fallback={fallback}
              fill
              priority
              sizes="100vw"
              src={galleryImages[activeIndex]}
            />
          </div>
          {galleryImages.length > 1 ? (
            <div className="flex items-center justify-center gap-4 px-4 py-5">
              <button
                aria-label="Prethodna fotografija"
                className="grid h-12 w-12 place-items-center rounded-full bg-paper text-ink"
                onClick={() => move(-1)}
                type="button"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                aria-label="Sljedeca fotografija"
                className="grid h-12 w-12 place-items-center rounded-full bg-paper text-ink"
                onClick={() => move(1)}
                type="button"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
