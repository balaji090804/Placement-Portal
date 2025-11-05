// Lightweight client helper to record performance events
export async function recordPerformanceEvent(email, type, meta = {}) {
  if (!email) return;
  try {
    await fetch("http://localhost:8080/api/performance/event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, type, meta }),
    });
  } catch (e) {
    // Avoid blocking UX on telemetry failures
    console.warn("recordPerformanceEvent failed", e);
  }
}
