import { useState } from "react";
import api from "../api/axiosClient";
import Nav from "../components/Nav";

export default function Insights() {
  const [insights, setInsights] = useState("");
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"weekly" | "monthly">("weekly");

  async function loadInsights(type: "weekly" | "monthly") {
    setLoading(true);
    setInsights("");
    setSummary({});
    setMode(type);

    try {
      const res = await api.get(`/api/ai/insights/${type}`);
      setInsights(res.data.insights);
      setSummary(res.data.summary);
    } catch (err) {
      console.error(err);
      alert("Failed to load insights.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-xl font-semibold mb-6">AI Financial Insights</h1>

        {/* Buttons */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => loadInsights("weekly")}
            className={`px-4 py-2 rounded ${
              mode === "weekly" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Weekly
          </button>

          <button
            onClick={() => loadInsights("monthly")}
            className={`px-4 py-2 rounded ${
              mode === "monthly" ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Loading */}
        {loading && <div>Loading insights...</div>}

        {/* Summary */}
        {!loading && Object.keys(summary).length > 0 && (
          <div className="bg-white p-4 rounded shadow mb-4">
            <h2 className="font-semibold text-lg mb-2">Spending Summary</h2>
            {Object.entries(summary).map(([cat, cents]) => (
              <p key={cat}>
                <strong>{cat}:</strong> ${(cents / 100).toFixed(2)}
              </p>
            ))}
          </div>
        )}

        {/* AI Insight */}
        {!loading && insights && (
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold text-lg mb-2">AI Insight</h2>
            <p className="text-gray-700 whitespace-pre-line">{insights}</p>
          </div>
        )}
      </main>
    </div>
  );
}
