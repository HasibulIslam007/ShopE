"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "grid", placeItems: "center", minHeight: "100vh", margin: 0 }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "2rem", fontWeight: 800 }}>Something went wrong.</h1>
          <p style={{ color: "#666", marginTop: "0.5rem" }}>An unexpected error occurred. Please try again.</p>
          <button
            onClick={reset}
            style={{ marginTop: "1.5rem", padding: "0.75rem 1.5rem", borderRadius: "999px", background: "#111", color: "#fff", fontWeight: 700, cursor: "pointer" }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
