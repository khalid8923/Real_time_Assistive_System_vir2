"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#111827",
          color: "#f3f4f6",
          padding: "20px",
        }}
      >
        <div
          style={{
            maxWidth: "480px",
            textAlign: "center",
            padding: "40px 24px",
            borderRadius: "24px",
            border: "1px solid rgba(255,255,255,0.1)",
            background: "#1f2937",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              margin: "0 auto 24px",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(255,86,86,0.15)",
              border: "2px solid rgba(255,86,86,0.3)",
              fontSize: "40px",
            }}
          >
            ⚠️
          </div>
          <h1
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "12px",
            }}
          >
            التطبيق وقع بالكامل
          </h1>
          <p
            style={{
              fontSize: "14px",
              color: "rgba(243,244,246,0.6)",
              marginBottom: "24px",
              lineHeight: 1.6,
            }}
          >
            حصلت مشكلة خطيرة. جرّب تعيد تحميل الصفحة.
          </p>
          {error.digest && (
            <p
              style={{
                fontSize: "10px",
                color: "rgba(243,244,246,0.4)",
                marginBottom: "24px",
                fontFamily: "monospace",
              }}
            >
              Reference: {error.digest}
            </p>
          )}
          <button
            type="button"
            onClick={reset}
            style={{
              padding: "12px 32px",
              borderRadius: "12px",
              border: "none",
              background: "linear-gradient(135deg, #8470ff, #67bfff)",
              color: "white",
              fontSize: "14px",
              fontWeight: "bold",
              cursor: "pointer",
            }}
          >
            إعادة التحميل
          </button>
        </div>
      </body>
    </html>
  );
}