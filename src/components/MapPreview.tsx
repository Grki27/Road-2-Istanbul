"use client";

import { useEffect, useRef, useState } from "react";
import { Flag, LocateFixed, Route } from "lucide-react";
import type L from "leaflet";
import type { CurrentLocation, DailyRecap, MapEvent } from "@/types";

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
  shell.append(
    createTextElement("span", `Dan ${recap.dayNumber}`, "map-popup-kicker"),
    createTextElement("strong", recap.title, "map-popup-title"),
    createTextElement(
      "p",
      `${recap.startLocation} → ${recap.endLocation}`,
      "map-popup-route"
    ),
    createTextElement(
      "p",
      `${recap.country} · ${recap.distanceKm} km · ukupno ${recap.totalDistanceKm} km`,
      "map-popup-meta"
    )
  );

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

  const location = [event.locationName, event.country].filter(Boolean).join(", ");
  if (location) {
    shell.append(createTextElement("p", location, "map-popup-route"));
  }

  if (event.description) {
    shell.append(createTextElement("p", event.description, "map-popup-copy"));
  }

  if (event.images[0]) {
    const image = document.createElement("img");
    image.src = event.images[0];
    image.alt = event.title;
    image.className = "map-popup-image";
    shell.append(image);
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
  const latestRecap = recaps.at(-1);

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
              color: "#5c3b25",
              dashArray: "2 12",
              weight: 5,
              opacity: 0.42,
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
          .marker([currentLocation.latitude, currentLocation.longitude], { icon: teamIcon })
          .addTo(map)
          .bindPopup(createCurrentLocationPopup(currentLocation, isPreview));
      }

      recaps.forEach((recap) => {
        if (recap.latitude === undefined || recap.longitude === undefined) {
          return;
        }

        const recapIcon = leaflet.divIcon({
          className: "recap-map-marker",
          html: `<span>${recap.dayNumber}</span>`,
          iconSize: [44, 52],
          iconAnchor: [22, 48],
          popupAnchor: [0, -45]
        });

        const marker = leaflet
          .marker([recap.latitude, recap.longitude], { icon: recapIcon })
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
          .marker([event.latitude, event.longitude], { icon: eventIcon })
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

      cleanup = () => {
        window.removeEventListener("focus-map-recap", focusRecap);
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

  return (
    <section id="karta" className="scroll-mt-4 px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-clay">Live karta</p>
          <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">
            Putujte s nama kroz interaktivnu kartu
          </h2>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-coffee/80">
            Narančasta linija je ono što je ostalo, a prošli dio rute postaje prozirniji i iscrtkan nakon svakog GPS updatea.
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
  );
}
