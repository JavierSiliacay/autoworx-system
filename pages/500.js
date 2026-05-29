import { useEffect, useState } from "react";

const FALLBACK_URL = "https://autoworx-system.vercel.app";

export default function Custom500() {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const destination = FALLBACK_URL;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          window.location.href = destination;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#0f172a",
        color: "#f1f5f9",
        fontFamily: "'Inter', 'Segoe UI', sans-serif",
        gap: "1.5rem",
        textAlign: "center",
        padding: "2rem",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          background: "linear-gradient(135deg, #ef4444, #f97316)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          boxShadow: "0 0 40px rgba(239,68,68,0.35)",
        }}
      >
        ⚠️
      </div>

      {/* Status code */}
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "#64748b",
        }}
      >
        Error 500 — Internal Server Error
      </p>

      {/* Headline */}
      <h1
        style={{
          fontSize: "clamp(1.8rem, 5vw, 2.8rem)",
          fontWeight: 900,
          margin: 0,
          lineHeight: 1.2,
          background: "linear-gradient(to right, #f1f5f9, #94a3b8)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        Something went wrong on our end
      </h1>

      {/* Subtitle */}
      <p style={{ color: "#94a3b8", fontSize: "1rem", maxWidth: 420, margin: 0 }}>
        Don&apos;t worry — you&apos;re being redirected to our backup system automatically.
      </p>

      {/* Countdown pill */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: 99,
          padding: "0.6rem 1.4rem",
        }}
      >
        {/* Spinner */}
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#f97316"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ animation: "spin 1s linear infinite" }}
        >
          <line x1="12" y1="2" x2="12" y2="6" />
          <line x1="12" y1="18" x2="12" y2="22" />
          <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
          <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
          <line x1="2" y1="12" x2="6" y2="12" />
          <line x1="18" y1="12" x2="22" y2="12" />
          <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
          <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
        </svg>
        <span style={{ fontSize: "0.9rem", color: "#cbd5e1" }}>
          Redirecting in <strong style={{ color: "#f1f5f9" }}>{countdown}s</strong>
        </span>
      </div>

      {/* Manual link */}
      <a
        href={FALLBACK_URL}
        style={{
          color: "#f97316",
          fontSize: "0.85rem",
          textDecoration: "underline",
          textUnderlineOffset: 3,
        }}
      >
        Click here if you are not redirected
      </a>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
