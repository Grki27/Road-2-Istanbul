import { readFile } from "node:fs/promises";
import path from "node:path";

export type RoutePoint = {
  x: number;
  y: number;
};

export async function getRouteSvgPoints() {
  try {
    const filePath = path.join(process.cwd(), "public", "assets", "ruta.gpx");
    const gpx = await readFile(filePath, "utf8");
    const matches = Array.from(
      gpx.matchAll(/<trkpt lat="(-?\d+(?:\.\d+)?)" lon="(-?\d+(?:\.\d+)?)"/g)
    );

    const rawPoints = matches.map((match) => ({
      lat: Number(match[1]),
      lon: Number(match[2])
    }));

    if (!rawPoints.length) {
      return "";
    }

    const sampled = rawPoints.filter((_, index) => index % Math.ceil(rawPoints.length / 900) === 0);
    const lats = sampled.map((point) => point.lat);
    const lons = sampled.map((point) => point.lon);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);
    const width = 1000;
    const height = 480;
    const padding = 44;

    return sampled
      .map((point) => {
        const x =
          padding +
          ((point.lon - minLon) / Math.max(maxLon - minLon, 0.0001)) * (width - padding * 2);
        const y =
          padding +
          (1 - (point.lat - minLat) / Math.max(maxLat - minLat, 0.0001)) *
            (height - padding * 2);

        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
  } catch {
    return "";
  }
}
