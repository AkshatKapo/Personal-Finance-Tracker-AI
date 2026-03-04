import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import Nav from "../components/Nav";

export default function Insights() {
  // AI-generated insight text (paragraph-style)
  const [insights, setInsights] = useState("");

  // Category → amount map (in cents)
  const [summary, setSummary] = useState<Record<string, number>>({});

  // Loading state for API calls
  const [loading, setLoading] = useState(false);

  // Tracks whether user is viewing weekly or monthly insights
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");


  const [stockReadiness, setStockReadiness] = useState<string[]>([]);

  /**
   * 🔥 NEW: Auto-load weekly insights on page load
   * Without this, the page was empty until a button was clicked
   */
  useEffect(() => {
    loadInsights("weekly");
  }, []);

  /**
   * Fetch AI insights from backend
   * @param type "weekly" | "monthly"
   */
  async function loadInsights(type: "weekly" | "monthly") {
    // Show loading state
    setLoading(true);

    // Update selected mode (weekly/monthly)
    setMode(type);

    try {
      // Call backend API
      const res = await api.get(`/api/ai/insights/${type}`);

      /**
       * ✅ Defensive assignments
       * If backend returns null/undefined, UI won't crash
       */
      setInsights(res.data.insights ?? "");
      setSummary(res.data.summary ?? {});
      setStockReadiness(res.data.stockReadiness ?? []);
    } catch (err) {
      console.error(err);
      alert("Failed to load insights.");
    } finally {
      // Stop loading spinner
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-xl font-semibold mb-6">
          AI Financial Insights
        </h1>

        {/* Mode Switch Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => loadInsights("weekly")}
            className={`px-4 py-2 rounded ${mode === "weekly"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
              }`}
          >
            Weekly
          </button>

          <button
            onClick={() => loadInsights("monthly")}
            className={`px-4 py-2 rounded ${mode === "monthly"
              ? "bg-blue-600 text-white"
              : "bg-gray-200"
              }`}
          >
            Monthly
          </button>
        </div>

        {/* 🔄 Loading State */}
        {loading ? (
          <div>Loading insights...</div>
        ) : (
          <>
            {/* 💰 Spending Summary */}
            {Object.keys(summary).length > 0 && (
              <div className="bg-white p-4 rounded shadow mb-4">
                <h2 className="font-semibold text-lg mb-2">
                  Spending Summary
                </h2>

                {Object.entries(summary).map(([cat, cents]) => (
                  <p key={cat}>
                    <strong>{cat}:</strong>{" "}
                    ${(cents / 100).toFixed(2)}
                  </p>
                ))}
              </div>
            )}

            {/* 🤖 AI Insight Text */}
            {/* 🤖 AI Insight Text */}
            {insights && (
              <div className="bg-white p-4 rounded shadow">
                <h2 className="font-semibold text-lg mb-2">
                  AI Insights
                </h2>

                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {insights.split("\n").map((line, i) => (
                    <li key={i}>
                      {line.replace(/^•\s*/, "")}
                    </li>
                  ))}
                </ul>
              </div>
            )}{/* 📈 Investing Readiness */}
            {stockReadiness.length > 0 && (
              <div className="bg-white p-4 rounded shadow mt-4">
                <h2 className="font-semibold text-lg mb-2">
                  📈 Investing Readiness
                </h2>

                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {stockReadiness.map((line, i) => (
                    <li key={i}>{line.replace(/^•\s*/, "")}</li>
                  ))}
                </ul>
              </div>
            )}

          </>
        )}
      </main>
    </div>
  );
}
