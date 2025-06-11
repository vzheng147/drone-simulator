import { useState } from "react";
import { DroneMap } from "./map/DroneMap";
import ImageAnalyzer from "./map/ImageAnalyzer";
import "./map/DroneMap.css";

export default function App() {
  const [coords, setCoords] = useState<[number, number][]>([]);
  const [time, setTime] = useState("");

  return (
    <div className="coverage-container">
      {/* Map side */}
      <DroneMap
        onBoxFinished={(c, t) => {
          setCoords(c);
          setTime(t);
        }}
      />

      {/* Info / analyzer side */}
      <div className="info-panel">
        <ImageAnalyzer />

        {coords.length > 0 && (
          <>
            <h3>Box Coordinates</h3>
            <ul>
              {coords.map((pt, i) => (
                <li key={i}>{`Lng: ${pt[0].toFixed(5)}, Lat: ${pt[1].toFixed(
                  5
                )}`}</li>
              ))}
            </ul>
            <h3>Time (2 drones): {time}</h3>
          </>
        )}
      </div>
    </div>
  );
}
