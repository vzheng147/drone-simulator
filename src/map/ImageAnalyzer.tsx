import { useState, useRef, useEffect, ChangeEvent } from "react";
type Type = "rgb" | "vegetation" | "ndwi";

export default function ImageAnalyzer() {
  const [mode, setMode] = useState<Type>("rgb");
  const [src, setSrc] = useState<string | null>(null);
  const originalRef = useRef<HTMLCanvasElement>(null);
  const processedRef = useRef<HTMLCanvasElement>(null);

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = () => setSrc(reader.result as string);
    reader.readAsDataURL(e.target.files[0]);
  }

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.src = src;
    img.onload = () => {
      const w = img.width,
        h = img.height;
      const o = originalRef.current!.getContext("2d")!;
      const p = processedRef.current!.getContext("2d")!;
      [originalRef, processedRef].forEach((r) => {
        r.current!.width = w;
        r.current!.height = h;
      });
      o.drawImage(img, 0, 0);

      const d = o.getImageData(0, 0, w, h).data;
      const out = new Uint8ClampedArray(d.length);

      for (let i = 0; i < d.length; i += 4) {
        const R = d[i],
          G = d[i + 1],
          B = d[i + 2];
        let val: number;
        if (mode === "rgb") {
          out.set([R, G, B, 255], i);
          continue;
        }
        if (mode === "vegetation") {
          val = (G - R) / (G + R - B + 1e-3);
        } else {
          val = (G - B) / (G + B + 1e-3);
        } // ndwi proxy
        const gray = ((val + 1) / 2) * 255;
        out.set([gray, gray, gray, 255], i);
      }
      p.putImageData(new ImageData(out, w, h), 0, 0);
    };
  }, [src, mode]);

  return (
    <div>
      <h3>Image Analyzer</h3>
      <input type="file" accept="image/*" onChange={onFile} />
      <select
        value={mode}
        onChange={(e) => setMode(e.target.value as Type)}
        style={{ marginLeft: 6 }}
      >
        <option value="rgb">RGB</option>
        <option value="vegetation">VARI</option>
        <option value="ndwi">NDWI</option>
      </select>

      {src && (
        <div style={{ display: "flex", gap: "1rem", marginTop: "1rem" }}>
          <canvas ref={originalRef} style={{ maxWidth: "100%" }} />
          <canvas ref={processedRef} style={{ maxWidth: "100%" }} />
        </div>
      )}
    </div>
  );
}
