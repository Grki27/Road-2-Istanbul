"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Flag, LocateFixed, Route, X } from "lucide-react";
import type L from "leaflet";
import type { CurrentLocation, DailyRecap, MapEvent } from "@/types";
import { formatCountry, formatKilometerRange } from "@/lib/trip-format";

type MapPreviewProps = {
  currentLocation?: CurrentLocation;
  recaps: DailyRecap[];
  mapEvents: MapEvent[];
  isPreview: boolean;
  hasDataError: boolean;
};

type FocusRecapDetail = {
  recapId: string;
};

type GalleryDetail = {
  images: string[];
  title: string;
  index: number;
};

function parseGpx(gpx: string) {
  const doc = new DOMParser().parseFromString(gpx, "application/xml");

  if (doc.querySelector("parsererror")) {
    return [];
  }

  return Array.from(doc.querySelectorAll("trkpt"))
    .map((point) => {
      const lat = Number(point.getAttribute("lat"));
      const lng = Number(point.getAttribute("lon"));

      return Number.isFinite(lat) && Number.isFinite(lng) ? ([lat, lng] as [number, number]) : null;
    })
    .filter((point): point is [number, number] => Boolean(point));
}

function getClosestRouteIndex(route: [number, number][], location: CurrentLocation) {
  return route.reduce(
    (closest, point, index) => {
      const latDistance = point[0] - location.latitude;
      const lngDistance = point[1] - location.longitude;
      const distance = latDistance * latDistance + lngDistance * lngDistance;

      return distance < closest.distance ? { distance, index } : closest;
    },
    { distance: Number.POSITIVE_INFINITY, index: 0 }
  ).index;
}

function createTextElement(tag: "p" | "strong" | "span", text: string, className?: string) {
  const element = document.createElement(tag);
  element.textContent = text;

  if (className) {
    element.className = className;
  }

  return element;
}

function createPopupShell() {
  const shell = document.createElement("div");
  shell.className = "map-popup";
  return shell;
}

function createRecapPopup(recap: DailyRecap) {
  const shell = createPopupShell();
  const stats = document.createElement("div");
  stats.className = "map-popup-stats";

  [
    formatCountry(recap.country),
    `${recap.distanceKm} km danas`,
    `${recap.totalDistanceKm} km ukupno`
  ].forEach((item) => {
    const stat = document.createElement("span");
    stat.className = "map-popup-stat";
    stat.textContent = item;
    stats.append(stat);
  });

  shell.append(
    createTextElement("span", `Dan ${recap.dayNumber}`, "map-popup-kicker"),
    createTextElement("strong", recap.title, "map-popup-title"),
    createTextElement(
      "p",
      formatKilometerRange(recap.startLocation, recap.endLocation),
      "map-popup-route"
    ),
    stats
  );

  if (recap.specialMilestoneType) {
    shell.append(createTextElement("p", `★ ${recap.specialMilestoneType}`, "map-popup-milestone"));
  }

  if (recap.shortText) {
    shell.append(createTextElement("p", recap.shortText, "map-popup-copy"));
  }

  const focusLink = document.createElement("a");
  focusLink.href = `#recap-${recap.id}`;
  focusLink.className = "map-popup-link";
  focusLink.textContent = "Pronađi u dnevniku";
  shell.append(focusLink);

  return shell;
}

function createEventPopup(event: MapEvent) {
  const shell = createPopupShell();
  shell.append(
    createTextElement("span", event.emoji, "map-popup-emoji"),
    createTextElement("strong", event.title, "map-popup-title")
  );

  const location = [event.locationName, event.country ? formatCountry(event.country) : undefined].filter(Boolean).join(", ");
  if (location) {
    shell.append(createTextElement("p", location, "map-popup-route"));
  }

  if (event.description) {
    shell.append(createTextElement("p", event.description, "map-popup-copy"));
  }

  if (event.images.length) {
    const collage = document.createElement("div");
    const visibleImages = event.images.slice(0, 4);
    collage.className = `map-popup-collage map-popup-collage-${Math.min(visibleImages.length, 4)}`;

    visibleImages.forEach((imageUrl, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "map-popup-collage-item";
      button.setAttribute("aria-label", `Otvori fotografiju ${index + 1} od ${event.images.length}`);

      const image = document.createElement("img");
      image.src = imageUrl;
      image.alt = `${event.title}, fotografija ${index + 1}`;
      button.append(image);

      if (index === visibleImages.length - 1 && event.images.length > visibleImages.length) {
        const more = document.createElement("span");
        more.className = "map-popup-collage-more";
        more.textContent = `+${event.images.length - visibleImages.length}`;
        button.append(more);
      }

      button.addEventListener("click", () => {
        window.dispatchEvent(new CustomEvent<GalleryDetail>("open-map-gallery", {
          detail: { images: event.images, title: event.title, index }
        }));
      });
      collage.append(button);
    });

    shell.append(collage);
  }

  return shell;
}

function createCurrentLocationPopup(location: CurrentLocation, isPreview: boolean) {
  const shell = createPopupShell();
  shell.append(
    createTextElement(
      "span",
      isPreview ? "Preview lokacija" : "Zadnja live lokacija",
      "map-popup-kicker"
    ),
    createTextElement("strong", "Marin i Marko", "map-popup-title")
  );

  if (location.note) {
    shell.append(createTextElement("p", location.note, "map-popup-copy"));
  }

  shell.append(
    createTextElement(
      "p",
      `Ažurirano ${new Intl.DateTimeFormat("hr-HR", {
        dateStyle: "medium",
        timeStyle: "short"
      }).format(new Date(location.createdAt))}`,
      "map-popup-meta"
    )
  );

  return shell;
}

export function MapPreview({
  currentLocation,
  recaps,
  mapEvents,
  isPreview,
  hasDataError
}: MapPreviewProps) {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeBoundsRef = useRef<L.LatLngBounds | null>(null);
  const recapMarkersRef = useRef<Map<string, L.Marker>>(new Map());
  const [routeState, setRouteState] = useState<"loading" | "ready" | "error">("loading");
  const [gallery, setGallery] = useState<GalleryDetail | null>(null);
  const latestRecap = recaps.at(-1);

  useEffect(() => {
    if (!gallery) return;

    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") setGallery(null);
      if (event.key === "ArrowLeft") {
        setGallery((current) => current ? { ...current, index: (current.index - 1 + current.images.length) % current.images.length } : null);
      }
      if (event.key === "ArrowRight") {
        setGallery((current) => current ? { ...current, index: (current.index + 1) % current.images.length } : null);
      }
    }

    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [gallery]);

  useEffect(() => {
    let alive = true;
    let cleanup: (() => void) | undefined;

    async function bootMap() {
      const leaflet = await import("leaflet");

      if (!alive || !mapElementRef.current || mapRef.current) {
        return;
      }

      const map = leaflet
        .map(mapElementRef.current, {
          zoomControl: false,
          scrollWheelZoom: true,
          minZoom: 5
        })
        .setView([41.7, 22.7], 6);

      mapRef.current = map;
      leaflet.control.zoom({ position: "bottomright" }).addTo(map);

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        })
        .addTo(map);

      try {
        const response = await fetch("/assets/ruta.gpx");
        if (!response.ok) {
          throw new Error(`GPX request failed with ${response.status}`);
        }

        const route = parseGpx(await response.text());
        if (route.length < 2) {
          throw new Error("GPX route has no usable points.");
        }

        const currentRouteIndex = currentLocation
          ? getClosestRouteIndex(route, currentLocation)
          : 0;
        const completedRoute = currentLocation ? route.slice(0, currentRouteIndex + 1) : [];
        const remainingRoute = currentLocation ? route.slice(currentRouteIndex) : route;

        const routeGlow = leaflet.polyline(route, {
          color: "#fff8ea",
          weight: 12,
          opacity: 0.42,
          lineCap: "round",
          lineJoin: "round"
        });
        routeGlow.addTo(map);

        if (completedRoute.length > 1) {
          leaflet
            .polyline(completedRoute, {
              color: "#fff8ea",
              weight: 12,
              opacity: 0.82,
              lineCap: "round",
              lineJoin: "round"
            })
            .addTo(map);

          leaflet
            .polyline(completedRoute, {
              color: "#315f67",
              dashArray: "10 9",
              weight: 7,
              opacity: 0.96,
              lineCap: "round",
              lineJoin: "round"
            })
            .addTo(map);
        }

        leaflet
          .polyline(remainingRoute, {
            color: "#d9824b",
            weight: 6,
            opacity: 0.96,
            lineCap: "round",
            lineJoin: "round"
          })
          .addTo(map);

        routeBoundsRef.current = routeGlow.getBounds();
        map.fitBounds(routeBoundsRef.current, { padding: [34, 34] });
        if (alive) {
          setRouteState("ready");
        }
      } catch (error) {
        console.error("GPX route failed to load:", error);
        if (alive) {
          setRouteState("error");
        }
      }

      if (currentLocation) {
        const teamIcon = leaflet.divIcon({
          className: "team-location-marker",
          html: `
            <div class="team-location-pulse">
              <img src="/assets/team-current-location.jpg" alt="" />
            </div>
          `,
          iconSize: [70, 70],
          iconAnchor: [35, 35],
          popupAnchor: [0, -35]
        });

        leaflet
          .marker([currentLocation.latitude, currentLocation.longitude], { icon: teamIcon, zIndexOffset: 700 })
          .addTo(map)
          .bindPopup(createCurrentLocationPopup(currentLocation, isPreview));
      }

      recaps.forEach((recap) => {
        if (recap.latitude === undefined || recap.longitude === undefined) {
          return;
        }
        const recapLatitude = recap.latitude;
        const recapLongitude = recap.longitude;

        const recapIcon = leaflet.divIcon({
          className: "recap-map-marker",
          html: `<span>${recap.dayNumber}</span>`,
          iconSize: [44, 52],
          iconAnchor: [22, 48],
          popupAnchor: [0, -45]
        });

        const marker = leaflet
          .marker([recapLatitude, recapLongitude], { icon: recapIcon, zIndexOffset: 900 })
          .addTo(map)
          .bindPopup(createRecapPopup(recap), { maxWidth: 310 });

        recapMarkersRef.current.set(recap.id, marker);
      });

      mapEvents.forEach((event) => {
        const emojiNode = document.createElement("span");
        emojiNode.textContent = event.emoji;

        const eventIcon = leaflet.divIcon({
          className: "emoji-map-marker",
          html: emojiNode.outerHTML,
          iconSize: [46, 46],
          iconAnchor: [23, 23],
          popupAnchor: [0, -25]
        });

        leaflet
          .marker([event.latitude, event.longitude], { icon: eventIcon, zIndexOffset: 850 })
          .addTo(map)
          .bindPopup(createEventPopup(event), { maxWidth: 310 });
      });

      const focusRecap = (event: Event) => {
        const recapId = (event as CustomEvent<FocusRecapDetail>).detail?.recapId;
        const marker = recapMarkersRef.current.get(recapId);

        if (marker) {
          map.setView(marker.getLatLng(), 11, { animate: true });
          marker.openPopup();
        }
      };

      window.addEventListener("focus-map-recap", focusRecap);
      const openGallery = (event: Event) => {
        setGallery((event as CustomEvent<GalleryDetail>).detail);
      };
      window.addEventListener("open-map-gallery", openGallery);

      cleanup = () => {
        window.removeEventListener("focus-map-recap", focusRecap);
        window.removeEventListener("open-map-gallery", openGallery);
        map.remove();
        mapRef.current = null;
        routeBoundsRef.current = null;
        recapMarkersRef.current.clear();
      };
    }

    bootMap();

    return () => {
      alive = false;
      cleanup?.();
    };
  }, [currentLocation, hasDataError, isPreview, mapEvents, recaps]);

  function fitRoute() {
    if (mapRef.current && routeBoundsRef.current) {
      mapRef.current.fitBounds(routeBoundsRef.current, { padding: [34, 34] });
    }
  }

  function goToCurrentLocation() {
    if (currentLocation) {
      mapRef.current?.setView([currentLocation.latitude, currentLocation.longitude], 11, {
        animate: true
      });
    }
  }

  function goToLatestRecap() {
    if (!latestRecap) {
      return;
    }

    const marker = recapMarkersRef.current.get(latestRecap.id);
    if (marker) {
      mapRef.current?.setView(marker.getLatLng(), 11, { animate: true });
      marker.openPopup();
    }
  }

  function moveGallery(direction: -1 | 1) {
    setGallery((current) => current
      ? { ...current, index: (current.index + direction + current.images.length) % current.images.length }
      : null);
  }

  return (
    <>
    <section id="karta" className="scroll-mt-4 px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-clay">Live karta</p>
          <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">
            Putujte s nama kroz interaktivnu kartu
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-coffee/80">
            Narančasta linija je ono što je ostalo, a tamna iscrtana linija jasno pokazuje dio koji smo već prošli.
          </p>
        </div>

        <div className="overflow-hidden rounded-[2rem] border-[10px] border-paper bg-sea shadow-paper">
          <div className="relative h-[72vh] min-h-[540px]">
            <div
              ref={mapElementRef}
              className="absolute inset-0 z-0"
              aria-label="Interaktivna karta puta od Dubrovnika do Istanbula"
            />

            <div className="absolute left-4 top-4 z-[450] flex max-w-[calc(100%-2rem)] flex-wrap gap-2">
              {isPreview ? (
                <span className="rounded-full bg-paper px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-clay shadow-pin">
                  Preview podaci
                </span>
              ) : null}
              {hasDataError ? (
                <span className="rounded-full bg-red-700 px-4 py-2 text-xs font-black text-white shadow-pin">
                  Live podaci trenutno nisu dostupni
                </span>
              ) : null}
              {routeState === "error" ? (
                <span className="rounded-full bg-red-700 px-4 py-2 text-xs font-black text-white shadow-pin">
                  Ruta se trenutno ne može učitati
                </span>
              ) : null}
            </div>

            <div className="absolute bottom-4 left-4 right-16 z-[450] flex flex-wrap gap-2 sm:bottom-auto sm:left-auto sm:right-4 sm:top-4 sm:max-w-[70%] sm:justify-end">
              <button
                onClick={fitRoute}
                disabled={routeState !== "ready"}
                className="map-control-button bg-ink text-paper disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                <Route size={18} />
                Prikaži cijelu rutu
              </button>
              <button
                onClick={goToCurrentLocation}
                disabled={!currentLocation}
                className="map-control-button bg-sunset text-ink disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                <LocateFixed size={18} />
                Zadnja lokacija
              </button>
              <button
                onClick={goToLatestRecap}
                disabled={!latestRecap}
                className="map-control-button bg-clay text-paper disabled:cursor-not-allowed disabled:opacity-50"
                type="button"
              >
                <Flag size={18} />
                Zadnji update
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
    {gallery ? (
      <div
        className="fixed inset-0 z-[2000] grid place-items-center bg-ink/[0.94] p-3 backdrop-blur-sm sm:p-8"
        role="dialog"
        aria-modal="true"
        aria-label={`Galerija: ${gallery.title}`}
        onClick={() => setGallery(null)}
      >
        <div className="relative h-full max-h-[900px] w-full max-w-6xl" onClick={(event) => event.stopPropagation()}>
          <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between gap-3 text-paper">
            <div className="min-w-0">
              <p className="truncate font-display text-xl font-black sm:text-2xl">{gallery.title}</p>
              <p className="text-sm font-bold text-paper/70">{gallery.index + 1} / {gallery.images.length}</p>
            </div>
            <button type="button" onClick={() => setGallery(null)} className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-paper text-ink" aria-label="Zatvori galeriju"><X size={22} /></button>
          </div>
          <div className="absolute inset-x-0 bottom-0 top-16">
            <Image src={gallery.images[gallery.index]} alt={`${gallery.title}, fotografija ${gallery.index + 1}`} fill className="object-contain" sizes="100vw" priority unoptimized />
          </div>
          {gallery.images.length > 1 ? (
            <>
              <button type="button" onClick={() => moveGallery(-1)} className="absolute left-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink shadow-pin sm:left-5" aria-label="Prethodna fotografija"><ArrowLeft size={22} /></button>
              <button type="button" onClick={() => moveGallery(1)} className="absolute right-2 top-1/2 z-10 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full bg-paper text-ink shadow-pin sm:right-5" aria-label="Sljedeća fotografija"><ArrowRight size={22} /></button>
            </>
          ) : null}
        </div>
      </div>
    ) : null}
    </>
  );
}
