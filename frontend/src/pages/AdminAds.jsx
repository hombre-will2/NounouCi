import React, { useEffect, useState } from "react";
import { Plus, Trash2, Power, PowerOff, Edit3, ShieldCheck, Film, Users } from "lucide-react";
import Navbar from "../components/Navbar";
import MediaUpload from "../components/MediaUpload";
import { Link } from "react-router-dom";
import { api, API, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "../components/ui/dialog";
import { toast } from "sonner";

const PLACEMENT_LABEL = {
  home: "Page d'accueil (bannière)",
  pre_contact: "Avant un contact (modale)",
};

export default function AdminAds() {
  const { user, loading: authLoading } = useAuth();
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    title: "",
    image_url: "",
    link_url: "",
    placement: "home",
    active: true,
    media_type: "image",
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/ads");
      setAds(data.ads || []);
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user]);

  if (authLoading) return null;
  if (!user || user.role !== "admin") {
    return (
      <div className="bg-paper min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 py-20 text-center">
          <h1 className="font-display text-2xl text-gray-900 mb-3">Accès réservé</h1>
          <p className="text-gray-600">Cette page est réservée à l'administrateur.</p>
        </div>
      </div>
    );
  }

  const openCreate = () => {
    setEditing(null);
    setForm({ title: "", image_url: "", link_url: "", placement: "home", active: true, media_type: "image" });
    setOpen(true);
  };

  const openEdit = (ad) => {
    setEditing(ad);
    setForm({
      title: ad.title,
      image_url: ad.image_url,
      link_url: ad.link_url || "",
      placement: ad.placement,
      active: ad.active,
      media_type: ad.media_type || "image",
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.title || !form.image_url) {
      toast.error("Titre et image obligatoires");
      return;
    }
    try {
      if (editing) {
        await api.put(`/ads/${editing.id}`, form);
        toast.success("Pub mise à jour");
      } else {
        await api.post("/ads", form);
        toast.success("Pub créée");
      }
      setOpen(false);
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    }
  };

  const toggleActive = async (ad) => {
    try {
      await api.put(`/ads/${ad.id}`, { active: !ad.active });
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    }
  };

  const remove = async (ad) => {
    if (!window.confirm(`Supprimer la pub "${ad.title}" ?`)) return;
    try {
      await api.delete(`/ads/${ad.id}`);
      toast.success("Pub supprimée");
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
        <div className="flex items-center justify-between flex-wrap gap-3 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 bg-orange-50 text-terracotta px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Admin
            </div>
            <h1 className="font-display text-3xl sm:text-4xl text-gray-900">Gestion des publicités</h1>
            <p className="text-gray-600">Créez, activez ou supprimez les pubs affichées sur la plateforme.</p>
          </div>
          <Button onClick={openCreate} data-testid="ads-create-btn" className="bg-terracotta hover:bg-[#C55B3A] text-white rounded-full px-5">
            <Plus className="w-4 h-4 mr-1.5" /> Nouvelle pub
          </Button>
        </div>

        <div className="flex gap-2 mb-6">
          <Link to="/admin/ads" data-testid="admin-tab-ads">
            <Button variant="default" className="rounded-full bg-terracotta hover:bg-[#C55B3A] text-white">
              <Film className="w-4 h-4 mr-1.5" /> Publicités
            </Button>
          </Link>
          <Link to="/admin/users" data-testid="admin-tab-users">
            <Button variant="outline" className="rounded-full">
              <Users className="w-4 h-4 mr-1.5" /> Utilisateurs
            </Button>
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Chargement...</div>
        ) : ads.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-warm" data-testid="ads-empty">
            <p className="font-display text-xl text-gray-900 mb-2">Aucune publicité</p>
            <p className="text-gray-600">Cliquez sur "Nouvelle pub" pour commencer.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="ads-list">
            {ads.map((ad) => (
              <div key={ad.id} data-testid={`ad-row-${ad.id}`} className="bg-white rounded-2xl border border-warm overflow-hidden">
                <div className="relative h-36 bg-gray-100">
                  {ad.image_url && (ad.media_type === "video" ? (
                    <video src={photoSrc(ad.image_url)} muted loop autoPlay playsInline className="w-full h-full object-cover" />
                  ) : (
                    <img src={photoSrc(ad.image_url)} alt={ad.title} className="w-full h-full object-cover" />
                  ))}
                  {ad.media_type === "video" && (
                    <span className="absolute bottom-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded font-bold flex items-center gap-1">
                      <Film className="w-3 h-3" /> VIDÉO
                    </span>
                  )}
                  <span className={`absolute top-2 right-2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${ad.active ? "bg-sage text-white" : "bg-gray-300 text-gray-700"}`}>
                    {ad.active ? "Actif" : "Inactif"}
                  </span>
                </div>
                <div className="p-4">
                  <div className="text-xs text-sage font-semibold uppercase tracking-wide mb-1">
                    {PLACEMENT_LABEL[ad.placement] || ad.placement}
                  </div>
                  <p className="font-semibold text-gray-900 line-clamp-1">{ad.title}</p>
                  {ad.link_url && <p className="text-xs text-gray-500 truncate mt-1">{ad.link_url}</p>}
                  <div className="flex gap-1.5 mt-3">
                    <Button size="sm" variant="outline" data-testid={`ad-edit-${ad.id}`} onClick={() => openEdit(ad)} className="rounded-full">
                      <Edit3 className="w-3.5 h-3.5 mr-1" /> Modifier
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      data-testid={`ad-toggle-${ad.id}`}
                      onClick={() => toggleActive(ad)}
                      className="rounded-full"
                    >
                      {ad.active ? <PowerOff className="w-3.5 h-3.5" /> : <Power className="w-3.5 h-3.5" />}
                    </Button>
                    <Button size="sm" variant="ghost" data-testid={`ad-delete-${ad.id}`} onClick={() => remove(ad)} className="text-red-600 hover:bg-red-50 rounded-full">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="rounded-2xl max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display">{editing ? "Modifier la pub" : "Nouvelle pub"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Titre</Label>
                <Input
                  data-testid="ad-form-title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="Ex: Promo crèche Cocody -30%"
                />
              </div>
              <MediaUpload
                value={form.image_url}
                onChange={(p, mt) => setForm({ ...form, image_url: p || "", media_type: mt || "image" })}
                label="Image ou vidéo *"
                size="lg"
                allowVideo={true}
                mediaType={form.media_type}
                testId="ad-form-image"
              />
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Lien (URL externe, optionnel)</Label>
                <Input
                  data-testid="ad-form-link"
                  value={form.link_url}
                  onChange={(e) => setForm({ ...form, link_url: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="https://..."
                />
              </div>
              <div>
                <Label className="text-sm font-semibold mb-1.5 block">Placement</Label>
                <Select value={form.placement} onValueChange={(v) => setForm({ ...form, placement: v })}>
                  <SelectTrigger data-testid="ad-form-placement" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="home">Page d'accueil (bannière)</SelectItem>
                    <SelectItem value="pre_contact">Avant un contact (modale)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <label className="flex items-center gap-2 p-3 rounded-xl border border-warm cursor-pointer">
                <input
                  type="checkbox"
                  data-testid="ad-form-active"
                  checked={form.active}
                  onChange={(e) => setForm({ ...form, active: e.target.checked })}
                  className="w-4 h-4 accent-terracotta"
                />
                <span className="text-sm font-medium">Publicité active</span>
              </label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Annuler</Button>
              <Button data-testid="ad-form-submit" onClick={submit} className="bg-terracotta hover:bg-[#C55B3A] text-white rounded-full">
                {editing ? "Enregistrer" : "Créer la pub"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
