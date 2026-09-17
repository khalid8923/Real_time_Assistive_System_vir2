import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "CaptionBridge — ترجمة فورية للطلاب الصم";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #101826 0%, #1a1a2e 50%, #2b2344 100%)",
          fontFamily: "sans-serif",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "-150px",
            right: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(168, 85, 247, 0.3) 0%, transparent 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "-150px",
            left: "-150px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(99, 102, 241, 0.3) 0%, transparent 70%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "6px",
              width: "80px",
              height: "80px",
              justifyContent: "center",
              paddingLeft: "16px",
              borderRadius: "16px",
              background: "linear-gradient(135deg, #6366f1, #a855f7)",
              border: "2px solid rgba(255,255,255,0.2)",
            }}
          >
            <div style={{ width: "48px", height: "6px", background: "white", borderRadius: "3px" }} />
            <div style={{ width: "30px", height: "6px", background: "white", borderRadius: "3px" }} />
          </div>
          <div
            style={{
              fontSize: "56px",
              fontWeight: "bold",
              color: "white",
              letterSpacing: "-1px",
            }}
          >
            CaptionBridge
          </div>
        </div>

        <div
          style={{
            fontSize: "40px",
            fontWeight: "bold",
            color: "white",
            textAlign: "center",
            marginBottom: "24px",
            direction: "rtl",
          }}
        >
          جسر التواصل للطلاب الصم
        </div>

        <div
          style={{
            fontSize: "24px",
            color: "rgba(255,255,255,0.7)",
            textAlign: "center",
            maxWidth: "900px",
            direction: "rtl",
            lineHeight: 1.5,
          }}
        >
          ترجمة فورية، خريطة ذهنية، معجم مصطلحات، وملخص ذكي — كل ده في الوقت الفعلي
        </div>

        <div
          style={{
            display: "flex",
            gap: "16px",
            marginTop: "60px",
          }}
        >
          {["ترجمة فورية", "ذكاء اصطناعي", "للطلاب الصم"].map((tag) => (
            <div
              key={tag}
              style={{
                padding: "10px 24px",
                borderRadius: "100px",
                background: "rgba(255,255,255,0.1)",
                border: "1px solid rgba(255,255,255,0.2)",
                color: "white",
                fontSize: "20px",
                direction: "rtl",
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}