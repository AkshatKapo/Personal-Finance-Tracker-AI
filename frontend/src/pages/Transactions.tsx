import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import Nav from "../components/Nav";
import { aiCategorize } from "../api/ai";

type Txn = {
  id: string;
  description: string;
  amountCents: number;
  postedAt: string;
  category?: string | null; // NEW
};

export default function Transactions() {
  const [items, setItems] = useState<Txn[]>([]);
  const [loading, setLoading] = useState(true);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");     // dollars, e.g. "5.25"
  const [category, setCategory] = useState(""); // NEW
  const [isExpense, setIsExpense] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await api.get<Txn[]>("/transactions");
      setItems(
        res.data.sort(
          (a, b) =>
            new Date(b.postedAt).getTime() - new Date(a.postedAt).getTime()
        )
      );
    } catch {
      localStorage.removeItem("token");
      window.location.href = "/login";
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addTxn() {
    if (!description.trim()) return alert("Description required");
    const num = Number(amount);
    if (!Number.isFinite(num)) return alert("Amount must be a number (e.g., 5.25)");

    try {
      const res =await api.post("/transactions", {
        description,
        amount: isExpense ? -num : num,
        category: category.trim() || undefined, // NEW
      });
      if(res.data.alert){
        alert(res.data.alert)
      }
      
      setDescription("");
      setAmount("");
      setCategory(""); // NEW
      load();
    } catch {
      alert("Failed to add transaction");
    }
  }
  async function handleAICategory() {
    if (!description.trim()) {
      alert("Please enter a description");
      return;
    }

    try {
      const result = await aiCategorize(description);
      setCategory(result); // auto-fill category field
    } catch (err) {
      console.error(err);
      alert("AI failed — check backend");
    }
  }


  async function removeTxn(id: string) {
    if (!confirm("Delete this transaction?")) return;
    try {
      await api.delete(`/transactions/${id}`);
      setItems(prev => prev.filter(t => t.id !== id)); // optimistic update
    } catch {
      alert("Failed to delete");
    }
  }


  const fmt = (c: number) => (c / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />
      <main className="max-w-5xl mx-auto p-4">
        {/* Add form */}
        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 mb-4">
          <input
            className="border rounded p-2 col-span-2"
            placeholder="Description (e.g., Coffee)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <input
            className="border rounded p-2"
            placeholder="Amount (e.g., 5.25)"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <input
            className="border rounded p-2"
            placeholder="Category (e.g., Groceries)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
          <button
            onClick={handleAICategory}
            className="bg-purple-600 text-white rounded px-3 py-2 hover:bg-purple-700"
          >
            AI Categorize
          </button>


          {/* income/expense toggle */}
          <select
            className="border rounded p-2"
            value={isExpense ? "expense" : "income"}
            onChange={(e) => setIsExpense(e.target.value === "expense")}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>

          <button
            onClick={addTxn}
            className="bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700"
          >
            Add
          </button>
        </div>

        {/* List */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Recent Transactions</h2>
          </div>
          {loading ? (
            <div className="p-4">Loading...</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-gray-600">No transactions yet.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-100 text-left">
                <tr>
                  <th className="p-3">Description</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Amount</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Actions</th> 
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={t.id} className="border-t">
                    <td className="p-3">{t.description}</td>
                    <td className="p-3">{t.category ?? "—"}</td>
                    <td
                      className={`p-3 ${t.amountCents < 0 ? "text-red-600" : "text-green-700"
                        }`}
                    >
                      {t.amountCents < 0 ? "-" : "+"}${fmt(Math.abs(t.amountCents))}
                    </td>
                    <td className="p-3">{new Date(t.postedAt).toLocaleString()}</td>
                    <td className="p-3">
                      <button
                        onClick={() => removeTxn(t.id)} // 🔹 calls delete function
                        className="text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

          )}
        </div>
      </main>
    </div>
  );
}
