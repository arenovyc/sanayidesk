import { ImageResponse } from "next/og";

export const alt = "SanayiDesk — Oto sanayi iş takibi";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 64,
          background: "#0A0A0A",
          color: "#FAFAFA",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: "#F59E0B",
            }}
          />
          <div style={{ fontSize: 36, fontWeight: 600, letterSpacing: -1 }}>
            SanayiDesk
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div
            style={{
              fontSize: 64,
              fontWeight: 600,
              letterSpacing: -2,
              lineHeight: 1.1,
              maxWidth: 900,
            }}
          >
            Oto sanayi dükkanın için iş takibi
          </div>
          <div style={{ fontSize: 28, color: "#A3A3A3", maxWidth: 800 }}>
            Plaka kabul, usta PIN, tahsilat, stok ve gün sonu — tek uygulamada.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
