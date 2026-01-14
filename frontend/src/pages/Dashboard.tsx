// // import { useEffect, useState } from "react";
// // import api from "../api/axiosClient";
// // import Nav from "../components/Nav";

// // type Me = { id: string; email: string };

// // export default function Dashboard() {
// //     const [me, setMe] = useState<Me | null>(null);

// //     useEffect(() => {
// //         (async () => {
// //             try {
// //                 const res = await api.get<Me>("/me");
// //                 setMe(res.data);
// //             } catch {
// //                 localStorage.removeItem("token");
// //                 window.location.href = "/login";
// //             }
// //         })();
// //     }, []);

// //     function logout() {
// //         localStorage.removeItem("token");
// //         window.location.href = "/login";
// //     }

// //     if (!me) return <div className="p-6">Loading...</div>;

// //     return (
// //         <div className="min-h-screen bg-gray-50">
// //             <Nav />
// //             <main className="max-w-5xl mx-auto p-4">
// //                 <div className="bg-white rounded-lg shadow p-4">
// //                     <p className="text-gray-600">Welcome! Transactions & Budgets coming next.</p>
// //                 </div>
// //             </main>
// //         </div>
// //     );

// // }
// import { useEffect, useState } from "react";
// import api from "../api/axiosClient";
// import Nav from "../components/Nav";
// import { isThisMonth } from "../utils/date";
// import { toDollars } from "../utils/money";

// type Me = { id: string; email: string };
// type Txn = { id: string; amountCents: number; postedAt: string; description: string };

// export default function Dashboard() {
//   const [me, setMe] = useState<Me | null>(null);
//   const [txns, setTxns] = useState<Txn[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     (async () => {
//       try {
//         const [meRes, txRes] = await Promise.all([
//           api.get<Me>("/me"),
//           api.get<Txn[]>("/transactions"),
//         ]);
//         setMe(meRes.data);
//         setTxns(txRes.data);
//       } catch {
//         localStorage.removeItem("token");
//         window.location.href = "/login";
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   if (!me || loading) return <div className="p-6">Loading...</div>;

//   // compute simple monthly stats from transactions
//   const thisMonth = txns.filter((t) => isThisMonth(t.postedAt));
//   const income = thisMonth.filter(t => t.amountCents > 0).reduce((s,t)=>s+t.amountCents, 0);
//   const expense = thisMonth.filter(t => t.amountCents < 0).reduce((s,t)=>s+t.amountCents, 0); // negative
//   const net = income + expense; // expense is negative

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Nav />

//       <main className="max-w-5xl mx-auto p-4">
//         {/* summary cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
//           <div className="bg-white rounded-lg shadow p-4">
//             <p className="text-gray-500 text-sm">Income (this month)</p>
//             <p className="text-2xl font-bold text-green-700">${toDollars(income)}</p>
//           </div>
//           <div className="bg-white rounded-lg shadow p-4">
//             <p className="text-gray-500 text-sm">Expenses (this month)</p>
//             <p className="text-2xl font-bold text-red-600">${toDollars(Math.abs(expense))}</p>
//           </div>
//           <div className={`bg-white rounded-lg shadow p-4`}>
//             <p className="text-gray-500 text-sm">Net (this month)</p>
//             <p className={`text-2xl font-bold ${net >= 0 ? "text-green-700" : "text-red-600"}`}>
//               ${toDollars(Math.abs(net))}{net < 0 ? " deficit" : ""}
//             </p>
//           </div>
//         </div>

//         {/* welcome card */}
//         <div className="bg-white rounded-lg shadow p-4">
//           <p className="text-gray-600">
//             Welcome, <span className="font-medium">{me.email}</span>. 
//             We’ll add Budgets and AI insights next.
//           </p>
//         </div>
//       </main>
//     </div>
//   );
// }
// import { useEffect, useState } from "react";
// import api from "../api/axiosClient";
// import Nav from "../components/Nav";
// import { isThisMonth } from "../utils/date";
// import { toDollars } from "../utils/money";
// import { getMonthlyBillsSummary } from "../api/bills";


// type Me = { id: string; email: string };
// type Txn = { id: string; amountCents: number; postedAt: string; description: string };
// type Settings = { monthlyIncomeCents: number | null };

// export default function Dashboard() {
//   const [me, setMe] = useState<Me | null>(null);
//   const [txns, setTxns] = useState<Txn[]>([]);
//   const [settings, setSettings] = useState<Settings>({ monthlyIncomeCents: null });
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     (async () => {
//       try {
//         const [meRes, txRes, stRes] = await Promise.all([
//           api.get<Me>("/me"),
//           api.get<Txn[]>("/transactions"),
//           api.get<Settings>("/settings"),
//         ]);
//         setMe(meRes.data);
//         setTxns(txRes.data);
//         setSettings(stRes.data);
//       } catch {
//         localStorage.removeItem("token");
//         window.location.href = "/login";
//       } finally {
//         setLoading(false);
//       }
//     })();
//   }, []);

//   if (!me || loading) return <div className="p-6">Loading...</div>;

//   // this month stats
//   const thisMonth = txns.filter((t) => isThisMonth(t.postedAt));
//   const income = thisMonth.filter((t) => t.amountCents > 0).reduce((s, t) => s + t.amountCents, 0);
//   const expense = thisMonth.filter((t) => t.amountCents < 0).reduce((s, t) => s + t.amountCents, 0); // negative
//   const net = income + expense;

//   // planned vs actual income
//   const plannedIncome = settings.monthlyIncomeCents ?? 0;
//   const actualIncome = income;
//   const pctIncome =  plannedIncome
//   ? Math.min(100, Math.round((Math.abs(expense) / plannedIncome) * 100))
//   : 0;

//   // left to spend = planned income - expenses (absolute)
//   const spentAbs = Math.abs(expense);
//   const leftToSpend = plannedIncome - spentAbs;

//   async function setMonthlyIncome() {
//     const defaultVal = settings.monthlyIncomeCents ? (settings.monthlyIncomeCents / 100).toString() : "";
//     const input = prompt("Enter your monthly income in dollars (e.g., 2500):", defaultVal);
//     if (!input) return;
//     const num = Number(input);
//     if (!Number.isFinite(num) || num < 0) {
//       alert("Please enter a valid non-negative number.");
//       return;
//     }
//     try {
//       const res = await api.post<Settings>("/settings", { monthlyIncome: num });
//       setSettings(res.data);
//     } catch (e: any) {
//       alert(e?.response?.data?.error ?? "Failed to save income");
//     }
//   }

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Nav />

//       <main className="max-w-5xl mx-auto p-4">
//         {/* summary cards */}
//         <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
//           <div className="bg-white rounded-lg shadow p-4">
//             <p className="text-gray-500 text-sm">Income (this month)</p>
//             <p className="text-2xl font-bold text-green-700">${toDollars(income)}</p>
//           </div>
//           <div className="bg-white rounded-lg shadow p-4">
//             <p className="text-gray-500 text-sm">Expenses (this month)</p>
//             <p className="text-2xl font-bold text-red-600">${toDollars(Math.abs(expense))}</p>
//           </div>
//           <div className="bg-white rounded-lg shadow p-4">
//             <p className="text-gray-500 text-sm">Net (this month)</p>
//             <p className={`text-2xl font-bold ${net >= 0 ? "text-green-700" : "text-red-600"}`}>
//               ${toDollars(Math.abs(net))}{net < 0 ? " deficit" : ""}
//             </p>
//           </div>

//           {/* Left to spend */}
//           <div className="bg-white rounded-lg shadow p-4">
//             <div className="flex items-center justify-between">
//               <p className="text-gray-500 text-sm">Left to spend (this month)</p>
//               <button
//                 onClick={setMonthlyIncome}
//                 className="text-xs bg-gray-200 hover:bg-gray-300 rounded px-2 py-1"
//               >
//                 Set income
//               </button>
//             </div>
//             <p className={`text-2xl font-bold ${leftToSpend >= 0 ? "text-green-700" : "text-red-600"}`}>
//               ${toDollars(Math.abs(leftToSpend))}{leftToSpend < 0 ? " over" : ""}
//             </p>
//             <p className="text-xs text-gray-500 mt-1">
//               Planned: ${toDollars(plannedIncome)} · Spent so far: ${toDollars(spentAbs)}
//             </p>
//           </div>
//         </div>

//         {/* Planned vs Actual income bar */}
//         <div className="bg-white rounded-lg shadow p-4 mb-6">
//           <div className="flex items-center justify-between">
//             <p className="text-gray-600">Planned vs Actual Income (this month)</p>
//             <span className="text-sm text-gray-500">
//               Planned: ${toDollars(plannedIncome)} · Actual: ${toDollars(actualIncome)}
//             </span>
//           </div>
//           <div className="w-full bg-gray-200 rounded h-2 mt-2">
//             <div className="h-2 rounded bg-blue-600" style={{ width: `${pctIncome}%` }} />
//           </div>
//           <div className="text-xs text-gray-500 mt-1">{pctIncome}% of plan</div>
//         </div>

//         {/* welcome/info */}
//         <div className="bg-white rounded-lg shadow p-4">
//           <p className="text-gray-600">
//             Welcome, <span className="font-medium">{me.email}</span>. Set your planned income to see accurate goals.
//           </p>
//           {!settings.monthlyIncomeCents && (
//             <div className="mt-3">
//               <button
//                 onClick={setMonthlyIncome}
//                 className="bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700"
//               >
//                 Set your monthly income
//               </button>
//             </div>
//           )}
//         </div>
//       </main>
//     </div>
//   );
// }
import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import Nav from "../components/Nav";
import { isThisMonth } from "../utils/date";
import { toDollars } from "../utils/money";
import { getMonthlyBillsSummary } from "../api/bills";

type Me = { id: string; email: string };
type Txn = { id: string; amountCents: number; postedAt: string; description: string };
type Settings = { monthlyIncomeCents: number | null };

export default function Dashboard() {
  const [me, setMe] = useState<Me | null>(null);
  const [txns, setTxns] = useState<Txn[]>([]);
  const [settings, setSettings] = useState<Settings>({ monthlyIncomeCents: null });
  const [loading, setLoading] = useState(true);

  // 🟦 Added state for bills summary
  const [billSummary, setBillSummary] = useState<{ monthlyTotal: number; count: number } | null>(
    null
  );

  useEffect(() => {
    (async () => {
      try {
        const [meRes, txRes, stRes, billSum] = await Promise.all([
          api.get<Me>("/me"),
          api.get<Txn[]>("/transactions"),
          api.get<Settings>("/settings"),
          getMonthlyBillsSummary(), // ⬅️ NEW
        ]);

        setMe(meRes.data);
        setTxns(txRes.data);
        setSettings(stRes.data);
        setBillSummary(billSum); // ⬅️ NEW
      } catch {
        localStorage.removeItem("token");
        window.location.href = "/login";
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (!me || loading) return <div className="p-6">Loading...</div>;

  // this month stats
  const thisMonth = txns.filter((t) => isThisMonth(t.postedAt));
  const income = thisMonth
    .filter((t) => t.amountCents > 0)
    .reduce((s, t) => s + t.amountCents, 0);
  const expense = thisMonth
    .filter((t) => t.amountCents < 0)
    .reduce((s, t) => s + t.amountCents, 0); // negative
  const net = income + expense;

  // planned vs actual income
  const plannedIncome = settings.monthlyIncomeCents ?? 0;
  const actualIncome = income;
  const pctIncome = plannedIncome
    ? Math.min(100, Math.round((Math.abs(expense) / plannedIncome) * 100))
    : 0;

  // left to spend
  const spentAbs = Math.abs(expense);
  const leftToSpend = plannedIncome - spentAbs;

  async function setMonthlyIncome() {
    const defaultVal = settings.monthlyIncomeCents
      ? (settings.monthlyIncomeCents / 100).toString()
      : "";
    const input = prompt("Enter your monthly income in dollars (e.g., 2500):", defaultVal);
    if (!input) return;
    const num = Number(input);
    if (!Number.isFinite(num) || num < 0) {
      alert("Please enter a valid non-negative number.");
      return;
    }
    try {
      const res = await api.post<Settings>("/settings", { monthlyIncome: num });
      setSettings(res.data);
    } catch (e: any) {
      alert(e?.response?.data?.error ?? "Failed to save income");
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <main className="max-w-5xl mx-auto p-4">
        {/* summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Income (this month)</p>
            <p className="text-2xl font-bold text-green-700">${toDollars(income)}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Expenses (this month)</p>
            <p className="text-2xl font-bold text-red-600">${toDollars(Math.abs(expense))}</p>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-gray-500 text-sm">Net (this month)</p>
            <p className={`text-2xl font-bold ${net >= 0 ? "text-green-700" : "text-red-600"}`}>
              ${toDollars(Math.abs(net))}{net < 0 ? " deficit" : ""}
            </p>
          </div>

          {/* Left to spend */}
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <p className="text-gray-500 text-sm">Left to spend (this month)</p>
              <button
                onClick={setMonthlyIncome}
                className="text-xs bg-gray-200 hover:bg-gray-300 rounded px-2 py-1"
              >
                Set income
              </button>
            </div>
            <p
              className={`text-2xl font-bold ${
                leftToSpend >= 0 ? "text-green-700" : "text-red-600"
              }`}
            >
              ${toDollars(Math.abs(leftToSpend))}{leftToSpend < 0 ? " over" : ""}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Planned: ${toDollars(plannedIncome)} · Spent so far: ${toDollars(spentAbs)}
            </p>
          </div>
        </div>

        {/* 🟦 NEW Monthly Bills Summary */}
        {billSummary && (
          <div className="bg-white rounded-lg shadow p-4 mb-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-700">Monthly Bills Summary</h3>
            <p className="text-xl font-bold mt-2">
              Total Bills Cost: ${toDollars(billSummary.monthlyTotal * 100)}
            </p>
            <p className="text-gray-600 text-sm">Total Bills: {billSummary.count}</p>
          </div>
        )}

        {/* Planned vs Actual income bar */}
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Planned vs Actual Income (this month)</p>
            <span className="text-sm text-gray-500">
              Planned: ${toDollars(plannedIncome)} · Actual: ${toDollars(actualIncome)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded h-2 mt-2">
            <div className="h-2 rounded bg-blue-600" style={{ width: `${pctIncome}%` }} />
          </div>
          <div className="text-xs text-gray-500 mt-1">{pctIncome}% of plan</div>
        </div>

        {/* welcome/info */}
        <div className="bg-white rounded-lg shadow p-4">
          <p className="text-gray-600">
            Welcome, <span className="font-medium">{me.email}</span>. Set your planned income to see
            accurate goals.
          </p>
          {!settings.monthlyIncomeCents && (
            <div className="mt-3">
              <button
                onClick={setMonthlyIncome}
                className="bg-blue-600 text-white rounded px-3 py-2 hover:bg-blue-700"
              >
                Set your monthly income
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
