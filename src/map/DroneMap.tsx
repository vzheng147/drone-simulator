import { useEffect, useRef, useState } from "react";
import mapboxgl, { NavigationControl } from "mapbox-gl";
import MapboxGeocoder from "@mapbox/mapbox-gl-geocoder";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import turfArea from "@turf/area";
import "mapbox-gl/dist/mapbox-gl.css";
import "@mapbox/mapbox-gl-geocoder/dist/mapbox-gl-geocoder.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
import "./DroneMap.css";

mapboxgl.accessToken =
  "pk.eyJ1IjoidnpoZW5nMTQ3IiwiYSI6ImNtYnJkdzZweDA2MjcybHB1c2ljNzI1ZWIifQ.OTtSUd-aiA2Z9Ts3sBu_aw";

const MAP_STYLES: Record<string, string> = {
  Streets: "mapbox://styles/mapbox/streets-v11",
  Satellite: "mapbox://styles/mapbox/satellite-v9",
};

const DRONE_SPEED = 10; // m/s
const SWATH_WIDTH = 20; // m

export function DroneMap({
  onBoxFinished,
}: {
  onBoxFinished: (coords: [number, number][], timeMin: string) => void;
}) {
  const mapDiv = useRef<HTMLDivElement>(null);
  const drawRef = useRef<MapboxDraw>();
  const [map, setMap] = useState<mapboxgl.Map | null>(null);
  const [styleUrl, setStyleUrl] = useState(MAP_STYLES.Streets);

  // init
  useEffect(() => {
    if (!mapDiv.current) return;

    const m = new mapboxgl.Map({
      container: mapDiv.current,
      style: styleUrl,
      center: [-74.006, 40.7128],
      zoom: 14,
    });

    m.addControl(new NavigationControl(), "top-right");
    m.addControl(
      new MapboxGeocoder({ accessToken: mapboxgl.accessToken, mapboxgl }),
      "top-left"
    );

    const draw = new MapboxDraw({ displayControlsDefault: false });
    drawRef.current = draw;
    m.addControl(draw);

    m.on("draw.create", (e) => {
      const poly = e.features[0];
      const coords = (poly.geometry as any).coordinates[0] as [
        number,
        number
      ][];
      const area = turfArea(poly as any); // m²
      const totalDist = area / SWATH_WIDTH; // m
      const oneDroneSec = totalDist / DRONE_SPEED; // s
      const twoDroneMin = (oneDroneSec / 2 / 60).toFixed(1);
      onBoxFinished(coords, twoDroneMin);
    });

    setMap(m);
    return () => m.remove();
  }, []);

  // swap style
  useEffect(() => {
    if (map) map.setStyle(styleUrl);
  }, [styleUrl, map]);

  return (
    <div className="map-wrapper">
      <button
        className="draw-button"
        onClick={() => drawRef.current?.changeMode("draw_rectangle")}
      >
        Draw Area
      </button>

      <select
        className="style-switcher"
        value={styleUrl}
        onChange={(e) => setStyleUrl(e.target.value)}
      >
        {Object.entries(MAP_STYLES).map(([lab, url]) => (
          <option key={url} value={url}>
            {lab}
          </option>
        ))}
      </select>

      <div ref={mapDiv} className="map-container" />
    </div>
  );
}
