import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// TODO: replace this generated icon with a real logo-based favicon once
// your brand mark is finalized (drop a favicon.ico / icon.png into /app).
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#D291BC",
          borderRadius: 8,
          fontSize: 20,
        }}
      >
        🎀
      </div>
    ),
    { ...size }
  );
}
