import { useEffect, useState } from "react";

const FALLBACK_URL = "https://autoworx-system.vercel.app";

export default function Custom404() {
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Build the full fallback URL preserving the original path
    const destination =
      FALLBACK_URL + (window.location.pathname || "") + (window.location.search || "");

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
      {/* Logo / Icon */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: 16,
          background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 36,
          boxShadow: "0 0 40px rgba(139,92,246,0.4)",
        }}
      >
        🔧
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
        Error 404 — Page Not Found
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
        This page doesn&apos;t exist here
      </h1>

      {/* Subtitle */}
      <p style={{ color: "#94a3b8", fontSize: "1rem", maxWidth: 400, margin: 0 }}>
        You&apos;re being redirected to our main system automatically.
      </p>

      {/* Countdown spinner */}
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
          stroke="#3b82f6"
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
          color: "#3b82f6",
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
