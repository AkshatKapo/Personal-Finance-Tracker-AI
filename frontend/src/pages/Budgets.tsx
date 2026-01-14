// src/pages/Budgets.tsx
import { useEffect, useMemo, useState } from "react";
import api from "../api/axiosClient";
import Nav from "../components/Nav";

type Budget = {
  id: string;
  category: string;
  capCents: number;
};

type ProgressRow = {
  id: string;           // budget id
  category: string;
  capCents: number;
  spentCents: number;   // this month's spend in that category (expenses only)
};

const dollars = (cents: number) => (cents / 100).toFixed(2);

export default function Budgets() {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [progress, setProgress] = useState<ProgressRow[]>([]);
  const [loading, setLoading] = useState(true);

  // form
  const [category, setCategory] = useState("");
  const [cap, setCap] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [b, p] = await Promise.all([
        api.get<Budget[]>("/budgets"),
        api.get<ProgressRow[]>("/budgets/progress"),
      ]);
      setBudgets(b.data);
      setProgress(p.data);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveBudget() {
    const cat = category.trim();
    const num = Number(cap);
    if (!cat) return alert("Category required");
    if (!Number.isFinite(num) || num < 0) return alert("Cap must be a non-negative number");
    await api.post("/budgets", { category: cat, cap: num });
    setCategory("");
    setCap("");
    await load();
  }

  async function removeBudget(id: string) {
    if (!confirm("Delete this budget?")) return;
    await api.delete(`/budgets/${id}`);
    await load();
  }

  // quick lookup for spent by category
  const spentByCategory = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of progress) m.set(r.category, r.spentCents);
    return m;
  }, [progress]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-5xl mx-auto p-4">
        {/* Add / Update form */}
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h2 className="text-lg font-semibold mb-3">Add / Update Budget</h2>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
            <input
              className="border rounded p-2"
              placeholder="Category (e.g., Groceries)"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <input
              className="border rounded p-2"
              placeholder="Monthly cap (e.g., 250)"
              value={cap}
              onChange={(e) => setCap(e.target.value)}
            />
            <button
              onClick={saveBudget}
              className="bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700"
            >
              Save
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Tip: saving the same category again will update its cap.
          </p>
        </div>

        {/* List + progress */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Budgets</h2>
          </div>

          {loading ? (
            <div className="p-4">Loading...</div>
          ) : budgets.length === 0 ? (
            <div className="p-4 text-gray-600">No budgets yet. Add one above.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">Category</th>
                  <th className="p-3">Cap</th>
                  <th className="p-3">Spent (this month)</th>
                  <th className="p-3">Progress</th>
                  <th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {budgets.map((b) => {
                  const spent = spentByCategory.get(b.category) ?? 0;
                  const pct = b.capCents > 0 ? Math.min(100, Math.round((spent / b.capCents) * 100)) : 0;
                  const barColor =
                    pct >= 100 ? "bg-red-600" : pct >= 80 ? "bg-yellow-500" : "bg-green-600";

                  return (
                    <tr key={b.id} className="border-t">
                      <td className="p-3">{b.category}</td>
                      <td className="p-3">${dollars(b.capCents)}</td>
                      <td className="p-3">${dollars(spent)}</td>
                      <td className="p-3">
                        <div className="w-full bg-gray-200 rounded h-2">
                          <div className={`h-2 rounded ${barColor}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="text-xs text-gray-500 mt-1">{pct}%</div>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => removeBudget(b.id)}
                          className="text-sm bg-gray-200 hover:bg-gray-300 rounded px-2 py-1"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
