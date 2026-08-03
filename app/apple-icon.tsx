import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

// TODO: replace with a real logo-based apple-touch-icon once branding is final.
export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #F9D8E0, #E3D9F7)",
          borderRadius: 40,
          fontSize: 96,
        }}
      >
        🎀
      </div>
    ),
    { ...size }
  );
}
