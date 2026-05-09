import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 192, height: 192 };
export const contentType = "image/png";

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
          background: "#0a0a0a",
          color: "#fafafa",
          fontSize: 96,
          fontWeight: 800,
          letterSpacing: -4,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        TG
      </div>
    ),
    { ...size },
  );
}
