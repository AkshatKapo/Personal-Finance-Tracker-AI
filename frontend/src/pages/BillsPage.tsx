import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import { useNavigate } from "react-router-dom";

type Bill = {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: string;
};

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<{ monthlyTotal: number; count: number } | null>(null);
  const navigate = useNavigate();

  // Fetch all bills
  const fetchBills = async () => {
    try {
      const res = await api.get("/bills");
      setBills(res.data);
    } catch (error) {
      console.log("Error fetching bills:", error);
    }
  };

  // Fetch monthly summary
  const fetchSummary = async () => {
    try {
      const res = await api.get("/bills/summary");
      setSummary(res.data);
    } catch (error) {
      console.log("Error fetching bill summary:", error);
    }
  };

  useEffect(() => {
    fetchBills();
    fetchSummary();
  }, []);

  return (
    <div className="p-6 max-w-[600px] mx-auto">
      <h1 className="text-3xl font-bold mb-4">Your Bills</h1>

      {/* Monthly Summary Box */}
      {summary && (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded mb-6 shadow-sm">
          <h2 className="text-xl font-semibold text-blue-900">Monthly Bills Summary</h2>
          <p className="text-lg mt-2">
            <span className="font-semibold">Total Monthly Cost:</span> ${summary.monthlyTotal}
          </p>
          <p className="text-gray-700 text-sm">Total Bills: {summary.count}</p>
        </div>
      )}

      <button
        onClick={() => navigate("/bills/add")}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        + Add Bill
      </button>

      <div className="flex flex-col gap-4">
        {bills.map((bill: Bill) => (
          <div
            key={bill.id}
            className="bg-gray-100 shadow p-4 rounded-lg border border-gray-200"
          >
            <h2 className="text-xl font-semibold">{bill.name}</h2>

            <p className="text-gray-600 mt-1">
              Amount: <span className="font-medium">${bill.amount}</span>
            </p>

            <p className="text-gray-600 mt-1">
              Due:{" "}
              <span className="font-medium">
                {new Date(bill.dueDate).toLocaleString()}
              </span>
            </p>

            <p className="text-gray-600 mt-1">
              Frequency:{" "}
              <span className="font-medium">{bill.frequency}</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
