import React, { useEffect, useState } from "react";
import { Trash2, ShieldCheck, User2, Search, Filter, Phone } from "lucide-react";
import Navbar from "../components/Navbar";
import { api, API, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";

const ROLE_BADGE = {
  admin: { txt: "Admin", cls: "bg-terracotta text-white" },
  nounou: { txt: "Nounou", cls: "bg-sage text-white" },
  parent: { txt: "Particulier", cls: "bg-accent text-gray-900" },
};

export default function AdminUsers() {
  const { user, loading: authLoading } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ role: "all", search: "" });

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      if (filters.role && filters.role !== "all") params.role = filters.role;
      if (filters.search) params.search = filters.search;
      const { data } = await api.get("/admin/users", { params });
      setUsers(data.users || []);
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading) return null;
  if (!user || user.role !== "admin") {
    return (
      <div className="bg-paper min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 py-20 text-center">
          <h1 className="font-display text-2xl text-gray-900 mb-3">Accès réservé</h1>
        </div>
      </div>
    );
  }

  const remove = async (u) => {
    if (!window.confirm(`Supprimer définitivement le compte de ${u.first_name} ${u.last_name} (${u.phone}) ? Toutes ses données seront effacées.`)) return;
    try {
      await api.delete(`/admin/users/${u.id}`);
      toast.success("Compte supprimé");
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    }
  };

  const photoSrc = (p) => (p && p.startsWith("http") ? p : p ? `${API}/files/${p}` : null);

  return (
    <div className="bg-paper min-h-screen">
      <Navbar />
      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-10 fade-in">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 bg-orange-50 text-terracotta px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3.5 h-3.5" /> Admin
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-gray-900">Gestion des utilisateurs</h1>
          <p className="text-gray-600">Liste de tous les comptes inscrits. Vous pouvez supprimer n'importe quel profil.</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-warm mb-5 grid sm:grid-cols-12 gap-3">
          <div className="sm:col-span-7">
            <Label className="text-xs font-semibold mb-1 block">Recherche</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                data-testid="users-search"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Nom ou téléphone"
                className="pl-9 h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="sm:col-span-3">
            <Label className="text-xs font-semibold mb-1 block">Rôle</Label>
            <Select value={filters.role} onValueChange={(v) => setFilters({ ...filters, role: v })}>
              <SelectTrigger data-testid="users-role" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="nounou">Nounou</SelectItem>
                <SelectItem value="parent">Particulier</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2 flex items-end">
            <Button
              onClick={load}
              data-testid="users-apply"
              className="w-full h-11 rounded-full bg-terracotta hover:bg-[#C55B3A] text-white"
            >
              <Filter className="w-4 h-4 mr-1.5" /> Filtrer
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-warm overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-gray-500">Chargement...</div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center" data-testid="users-empty">
              <p className="font-display text-xl text-gray-900 mb-2">Aucun utilisateur</p>
            </div>
          ) : (
            <div className="divide-y divide-warm" data-testid="users-list">
              {users.map((u) => {
                const role = ROLE_BADGE[u.role] || ROLE_BADGE.parent;
                return (
                  <div
                    key={u.id}
                    data-testid={`user-row-${u.id}`}
                    className="p-4 sm:p-5 flex items-center gap-4 hover:bg-orange-50/40 transition"
                  >
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-orange-50 flex items-center justify-center shrink-0">
                      {u.photo_url ? (
                        <img src={photoSrc(u.photo_url)} alt={u.first_name} className="w-full h-full object-cover" />
                      ) : (
                        <User2 className="w-5 h-5 text-terracotta" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">
                          {u.first_name} {u.last_name}
                        </span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${role.cls}`}>
                          {role.txt}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-sm text-gray-600 mt-0.5">
                        <Phone className="w-3.5 h-3.5" /> {u.phone}
                      </div>
                      <div className="text-xs text-gray-400">
                        Inscrit : {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      </div>
                    </div>
                    <Button
                      data-testid={`user-delete-${u.id}`}
                      onClick={() => remove(u)}
                      disabled={u.id === user.id || u.role === "admin"}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-50 rounded-full disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4 mr-1" /> Supprimer
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
