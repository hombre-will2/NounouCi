import React, { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import Navbar from "../components/Navbar";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

export default function NotificationsPage() {
  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/notifications");
      setNotifs(data.notifications || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      load();
    } catch (e) {
      /* ignore */
    }
  };

  const markAll = async () => {
    try {
      await api.put("/notifications/read-all");
      toast.success("Toutes les notifications ont été marquées comme lues");
      load();
    } catch (e) {
      /* ignore */
    }
  };

  return (
    <div className="bg-paper min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 fade-in">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl sm:text-4xl text-gray-900">Notifications</h1>
          {notifs.some((n) => !n.read) && (
            <Button data-testid="notif-mark-all" variant="outline" onClick={markAll} className="rounded-full">
              <Check className="w-4 h-4 mr-1" /> Tout marquer lu
            </Button>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : notifs.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-warm" data-testid="notif-empty">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-display text-xl text-gray-900 mb-2">Aucune notification</p>
            <p className="text-gray-600">Vous serez prévenu(e) à chaque mise en relation.</p>
          </div>
        ) : (
          <div className="space-y-2" data-testid="notif-list">
            {notifs.map((n) => (
              <div
                key={n.id}
                data-testid={`notif-${n.id}`}
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  n.read ? "bg-white border-warm" : "bg-orange-50 border-orange-200"
                }`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${n.read ? "bg-gray-100" : "bg-terracotta/15"}`}>
                  <Bell className={`w-4 h-4 ${n.read ? "text-gray-400" : "text-terracotta"}`} />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 text-sm">{n.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString("fr-FR")}</p>
                </div>
                {!n.read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    data-testid={`notif-read-${n.id}`}
                    onClick={() => markRead(n.id)}
                    className="text-terracotta hover:bg-orange-100 rounded-full"
                  >
                    <Check className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
