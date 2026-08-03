import { ImageResponse } from "next/og";
import { SITE } from "@/lib/constants";

export const runtime = "edge";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// TODO: replace this generated OG card with a real branded image (or a real
// product photo collage) once you have final photography.
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #FDEEF2 0%, #F3EEFC 50%, #EDF7FC 100%)",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ fontSize: 88, marginBottom: 12 }}>🎀✨</div>
        <div style={{ fontSize: 72, fontWeight: 700, color: "#5B4B4F" }}>{SITE.name}</div>
        <div style={{ fontSize: 32, color: "#8A7377", marginTop: 16 }}>{SITE.tagline}</div>
      </div>
    ),
    { ...size }
  );
}
