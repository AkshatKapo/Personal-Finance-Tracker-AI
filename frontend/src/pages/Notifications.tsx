import { useEffect, useState } from "react";
import api from "../api/axiosClient";
import Nav from "../components/Nav";

type Notification = {
  id: string;
  message: string;
  createdAt: string;
  read: boolean;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const res = await api.get("/notifications");
      setItems(res.data);
    } catch (e) {
      console.error(e);
      alert("Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Nav />

      <main className="max-w-4xl mx-auto p-4">
        <h1 className="text-xl font-semibold mb-4">Notifications</h1>

        {loading ? (
          <div>Loading...</div>
        ) : items.length === 0 ? (
          <div>No notifications yet.</div>
        ) : (
          <div className="space-y-3">
            {items.map((n) => (
              <div
                key={n.id}
                className="bg-white p-4 rounded shadow border border-gray-200"
              >
                <p className="text-gray-800">{n.message}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(n.createdAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
