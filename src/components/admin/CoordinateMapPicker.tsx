"use client";

import { useEffect, useRef } from "react";
import type L from "leaflet";

const DEFAULT_CENTER: [number, number] = [42.6507, 18.0944];

export function CoordinateMapPicker({
  latitude,
  longitude,
  onPick
}: {
  latitude: string;
  longitude: string;
  onPick: (latitude: number, longitude: number) => void;
}) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const initialLatitudeRef = useRef(latitude);
  const initialLongitudeRef = useRef(longitude);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    onPickRef.current = onPick;
  }, [onPick]);

  useEffect(() => {
    let alive = true;
    let cleanup: (() => void) | undefined;

    async function boot() {
      const leaflet = await import("leaflet");
      if (!alive || !elementRef.current || mapRef.current) return;

      const parsedLat = Number(initialLatitudeRef.current);
      const parsedLng = Number(initialLongitudeRef.current);
      const hasPoint = Number.isFinite(parsedLat) && Number.isFinite(parsedLng);
      const center: [number, number] = hasPoint ? [parsedLat, parsedLng] : DEFAULT_CENTER;
      const map = leaflet
        .map(elementRef.current, {
          zoomControl: true,
          scrollWheelZoom: true
        })
        .setView(center, hasPoint ? 12 : 7);

      mapRef.current = map;

      leaflet
        .tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          maxZoom: 19,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        })
        .addTo(map);

      const pickerIcon = leaflet.divIcon({
        className: "admin-coordinate-marker",
        html: "<span></span>",
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      if (hasPoint) {
        markerRef.current = leaflet.marker(center, { icon: pickerIcon }).addTo(map);
      }

      map.on("click", (event: L.LeafletMouseEvent) => {
        const nextLat = Number(event.latlng.lat.toFixed(7));
        const nextLng = Number(event.latlng.lng.toFixed(7));
        onPickRef.current(nextLat, nextLng);
      });

      window.setTimeout(() => map.invalidateSize(), 120);

      cleanup = () => {
        map.remove();
        mapRef.current = null;
        markerRef.current = null;
      };
    }

    boot();

    return () => {
      alive = false;
      cleanup?.();
    };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const parsedLat = Number(latitude);
    const parsedLng = Number(longitude);
    if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) return;

    import("leaflet").then((leaflet) => {
      const position: [number, number] = [parsedLat, parsedLng];
      const pickerIcon = leaflet.divIcon({
        className: "admin-coordinate-marker",
        html: "<span></span>",
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      if (!markerRef.current) {
        markerRef.current = leaflet.marker(position, { icon: pickerIcon }).addTo(map);
      } else {
        markerRef.current.setLatLng(position);
      }

      map.setView(position, Math.max(map.getZoom(), 11), { animate: true });
    });
  }, [latitude, longitude]);

  return (
    <div className="mt-4">
      <div
        ref={elementRef}
        className="h-72 overflow-hidden rounded-2xl border border-coffee/10 bg-sea"
        aria-label="Klikni na karti za odabir koordinata"
      />
      <p className="mt-2 text-xs font-bold text-coffee/55">
        Klikni na kartu i koordinate će se automatski upisati.
      </p>
    </div>
  );
}
