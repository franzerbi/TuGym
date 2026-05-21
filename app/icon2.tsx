import { ImageResponse } from "next/og";

export const dynamic = "force-static";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon2() {
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
          fontSize: 205,
          fontWeight: 800,
          letterSpacing: -9,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        TG
      </div>
    ),
    { ...size },
  );
}
