"use client";

import { useEffect, useRef } from "react";
import { LocateFixed, Route } from "lucide-react";
import type L from "leaflet";

const currentLocation = {
  lat: 42.6507,
  lng: 18.0944,
  title: "Marin i Marko",
  text: "Preview live lokacije. Kad dođe admin panel, ovo se mijenja zadnjim GPS updateom."
};

const demoPins = [
  {
    lat: 41.9981,
    lng: 21.4254,
    emoji: "🌍",
    title: "Skopje checkpoint",
    text: "Primjer event pina za granice, hranu, kvarove i dobre priče s ceste."
  },
  {
    lat: 41.0082,
    lng: 28.9784,
    emoji: "🏁",
    title: "Istanbul cilj",
    text: "Kraj planirane rute i veliki razlog za baklavu."
  }
];

function parseGpx(gpx: string) {
  const doc = new DOMParser().parseFromString(gpx, "application/xml");
  return Array.from(doc.querySelectorAll("trkpt"))
    .map((point) => {
      const lat = Number(point.getAttribute("lat"));
      const lng = Number(point.getAttribute("lon"));

      return Number.isFinite(lat) && Number.isFinite(lng) ? ([lat, lng] as [number, number]) : null;
    })
    .filter((point): point is [number, number] => Boolean(point));
}

function getClosestRouteIndex(route: [number, number][], location: { lat: number; lng: number }) {
  return route.reduce(
    (closest, point, index) => {
      const latDistance = point[0] - location.lat;
      const lngDistance = point[1] - location.lng;
      const distance = latDistance * latDistance + lngDistance * lngDistance;

      return distance < closest.distance ? { distance, index } : closest;
    },
    { distance: Number.POSITIVE_INFINITY, index: 0 }
  ).index;
}

export function MapPreview() {
  const mapElementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const routeBoundsRef = useRef<L.LatLngBounds | null>(null);

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
        const gpx = await response.text();
        const route = parseGpx(gpx);

        if (route.length) {
          const currentRouteIndex = getClosestRouteIndex(route, currentLocation);
          const completedRoute = route.slice(0, currentRouteIndex + 1);
          const remainingRoute = route.slice(currentRouteIndex);

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
            .polyline(remainingRoute.length > 1 ? remainingRoute : route, {
              color: "#d9824b",
              weight: 6,
              opacity: 0.96,
              lineCap: "round",
              lineJoin: "round"
            })
            .addTo(map);

          routeBoundsRef.current = routeGlow.getBounds();
          map.fitBounds(routeBoundsRef.current, { padding: [34, 34] });
        }
      } catch {
        // Public fallback is simply the interactive base map; real error states come with data wiring.
      }

      const teamIcon = leaflet.divIcon({
        className: "team-location-marker",
        html: `
          <div class="team-location-pulse">
            <img src="/assets/team-current-location.jpg" alt="Marin i Marko" />
          </div>
        `,
        iconSize: [70, 70],
        iconAnchor: [35, 35],
        popupAnchor: [0, -35]
      });

      leaflet
        .marker([currentLocation.lat, currentLocation.lng], { icon: teamIcon })
        .addTo(map)
        .bindPopup(`<strong>${currentLocation.title}</strong><br>${currentLocation.text}`);

      demoPins.forEach((pin) => {
        const icon = leaflet.divIcon({
          className: "emoji-map-marker",
          html: `<span>${pin.emoji}</span>`,
          iconSize: [46, 46],
          iconAnchor: [23, 23],
          popupAnchor: [0, -25]
        });

        leaflet
          .marker([pin.lat, pin.lng], { icon })
          .addTo(map)
          .bindPopup(`<strong>${pin.title}</strong><br>${pin.text}`);
      });

      cleanup = () => {
        map.remove();
        mapRef.current = null;
        routeBoundsRef.current = null;
      };
    }

    bootMap();

    return () => {
      alive = false;
      cleanup?.();
    };
  }, []);

  function fitRoute() {
    if (mapRef.current && routeBoundsRef.current) {
      mapRef.current.fitBounds(routeBoundsRef.current, { padding: [34, 34] });
    }
  }

  function goToCurrentLocation() {
    mapRef.current?.setView([currentLocation.lat, currentLocation.lng], 11, {
      animate: true
    });
  }

  return (
    <section id="karta" className="px-5 py-20">
      <div className="mx-auto max-w-7xl">
        <div className="mb-7 max-w-4xl">
          <p className="text-xs font-black uppercase tracking-[0.26em] text-clay">Live karta</p>
          <h2 className="mt-3 font-display text-4xl font-black md:text-6xl">
            Putujte s nama kroz interaktivnu kartu
          </h2>
        </div>

        <div className="overflow-hidden rounded-[2rem] border-[10px] border-paper bg-sea shadow-paper">
          <div className="relative h-[72vh] min-h-[560px]">
            <div ref={mapElementRef} className="absolute inset-0 z-0" />
            <div className="absolute right-4 top-4 z-[450] flex flex-col gap-2 sm:flex-row">
              <button
                onClick={fitRoute}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-black text-paper shadow-pin ring-2 ring-paper/80 transition hover:-translate-y-0.5"
                type="button"
              >
                <Route size={18} />
                Prikaži cijelu rutu
              </button>
              <button
                onClick={goToCurrentLocation}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-sunset px-5 py-3 text-sm font-black text-ink shadow-pin ring-2 ring-paper/80 transition hover:-translate-y-0.5"
                type="button"
              >
                <LocateFixed size={18} />
                Zadnja lokacija
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
