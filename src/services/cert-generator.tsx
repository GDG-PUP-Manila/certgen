import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs/promises";
import path from "node:path";

export async function generateCertificate(data: {
  displayName: string;
  topOffset?: string;
}) {
  // Load font
  const fontPath = path.resolve("./public/fonts/GoogleSans-Bold.ttf");
  const fontData = await fs.readFile(fontPath);

  // We only render the text here. By NOT rendering the background image inside Satori,
  // we can output a purely transparent PNG. This allows us to scale it to an insane 4000px (4K)
  // resolution without the file size exploding, yielding razor-sharp text on the final PDF.
  const svg = await satori(
    <div
      style={{
        height: "100%",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-start",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: data.topOffset ?? "290px", // Align precisely above the black line in the original 1000x707 math
          left: "0",
          width: "100%",
          display: "flex",
          justifyContent: "center",
          fontSize: "50px", 
          color: "#1e293b", 
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        {data.displayName}
      </div>
    </div>,
    {
      width: 1000, 
      height: 707, // Fixed to A4 Landscape aspect ratio math
      fonts: [
        {
          name: "Google Sans",
          data: fontData,
          weight: 700,
          style: "normal",
        },
      ],
    },
  );

  const resvg = new Resvg(svg, {
    background: "rgba(255, 255, 255, 0)", // Crucial: Transparent!
    fitTo: { mode: "width", value: 3000 }, // 3x scale. Razor sharp text. Very low file size because it's mostly transparent.
  });

  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return pngBuffer;
}
