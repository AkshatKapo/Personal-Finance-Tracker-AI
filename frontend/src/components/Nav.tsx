// import { Link, useLocation } from "react-router-dom";

// export default function Nav() {
//   const { pathname } = useLocation();
//   const Tab = ({ to, label }: { to: string; label: string }) => (
//     <Link
//       to={to}
//       className={`px-3 py-2 rounded ${pathname === to ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}
//     >
//       {label}
//     </Link>
    
//   );


//   return (
//     <header className="bg-white shadow">
//       <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
//         <div className="font-semibold">Finance Tracker</div>
//         <nav className="flex gap-2">
//           <Tab to="/dashboard" label="Dashboard" />
//           <Tab to="/transactions" label="Transactions" />
//           <Tab to="/budgets" label="Budgets" />
//         </nav>
//       </div>
//     </header>
//   );
// }
import { Link, useLocation } from "react-router-dom";

export default function Nav() {
  const { pathname } = useLocation();

  const Tab = ({ to, label }: { to: string; label: string }) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded ${
        pathname === to ? "bg-blue-600 text-white" : "hover:bg-gray-200"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="bg-white shadow">
      <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold">Finance Tracker</div>

        <nav className="flex gap-2">
          <Tab to="/dashboard" label="Dashboard" />
          <Tab to="/transactions" label="Transactions" />
          <Tab to="/budgets" label="Budgets" />

          {/* ✅ Add Insights here */}
          <Tab to="/insights" label="Insights" />
          <Tab to="/notifications" label="Notifications" />

          <Tab to="/bills" label="Bills" />

        </nav>
      </div>
    </header>
  );
}
