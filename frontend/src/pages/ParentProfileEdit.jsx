import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Trash2 } from "lucide-react";
import Navbar from "../components/Navbar";
import ImageUpload from "../components/ImageUpload";
import MultiImageUpload from "../components/MultiImageUpload";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import { ABIDJAN_QUARTIERS, CITIES, CARE_TYPES, SCHEDULES } from "../lib/constants";

export default function ParentProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    quartier: "Cocody",
    city: "Abidjan",
    address: "",
    children_count: 1,
    needs_description: "",
    schedule: "Journée (8h-18h)",
    care_type: "Bébé (0-2 ans)",
    budget_max: 80000,
    photo_url: "",
    children_photos: [],
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || user.role !== "parent") {
      navigate("/dashboard");
      return;
    }
    api.get("/profile/parent/me").then(({ data }) => {
      if (data.profile) setForm((f) => ({ ...f, ...data.profile }));
    });
  }, [user, navigate]);

  const validate = () => {
    const e = {};
    if (!form.photo_url) e.photo_url = "Une photo de vous est requise pour valider votre profil";
    if (!form.children_photos?.length) e.children_photos = "Au moins une photo d'enfant est requise";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error("Merci de compléter les champs obligatoires");
      return;
    }
    setLoading(true);
    try {
      await api.put("/profile/parent", form);
      toast.success("Profil enregistré");
      navigate("/dashboard");
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer votre profil ? Cette action est irréversible.")) return;
    try {
      await api.delete("/profile/parent/me");
      toast.success("Profil supprimé");
      navigate("/dashboard");
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    }
  };

  const isAbidjan = form.city === "Abidjan";

  return (
    <div className="bg-paper min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 fade-in">
        <h1 className="font-display text-3xl sm:text-4xl text-gray-900 mb-2">Mes besoins de garde</h1>
        <p className="text-gray-600 mb-8">
          Détaillez vos attentes et téléversez votre photo + celle de vos enfants pour valider votre profil.
        </p>

        <form onSubmit={submit} className="bg-white rounded-3xl p-6 sm:p-8 border border-warm space-y-6">
          <div className="grid sm:grid-cols-2 gap-6">
            <div>
              <ImageUpload
                value={form.photo_url}
                onChange={(p) => setForm({ ...form, photo_url: p || "" })}
                label="Votre photo *"
                roundedFull
                size="lg"
                testId="parent-photo"
              />
              {errors.photo_url && <p className="text-xs text-red-600 mt-1">{errors.photo_url}</p>}
            </div>
            <div>
              <MultiImageUpload
                value={form.children_photos}
                onChange={(arr) => setForm({ ...form, children_photos: arr })}
                label="Photos de votre/vos enfant(s) *"
                max={5}
                testId="parent-children"
              />
              {errors.children_photos && <p className="text-xs text-red-600 mt-1">{errors.children_photos}</p>}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Ville</Label>
              <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v, quartier: v === "Abidjan" ? "Cocody" : "" })}>
                <SelectTrigger data-testid="parent-city-trigger" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CITIES.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">
                {isAbidjan ? "Quartier" : "Quartier / Zone (optionnel)"}
              </Label>
              {isAbidjan ? (
                <Select value={form.quartier} onValueChange={(v) => setForm({ ...form, quartier: v })}>
                  <SelectTrigger data-testid="parent-quartier-trigger" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ABIDJAN_QUARTIERS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  data-testid="parent-quartier-input"
                  value={form.quartier}
                  onChange={(e) => setForm({ ...form, quartier: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="Ex: Centre-ville"
                />
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Adresse (optionnelle, partagée seulement après acceptation)</Label>
            <Input
              data-testid="parent-address"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="h-11 rounded-xl"
              placeholder="Rue, repère"
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Nombre d'enfants</Label>
              <Input
                type="number"
                data-testid="parent-children-count"
                value={form.children_count}
                onChange={(e) => setForm({ ...form, children_count: Number(e.target.value) })}
                className="h-11 rounded-xl"
              />
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Type de garde</Label>
              <Select value={form.care_type} onValueChange={(v) => setForm({ ...form, care_type: v })}>
                <SelectTrigger data-testid="parent-care-trigger" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CARE_TYPES.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Horaires</Label>
              <Select value={form.schedule} onValueChange={(v) => setForm({ ...form, schedule: v })}>
                <SelectTrigger data-testid="parent-schedule-trigger" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {SCHEDULES.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Budget mensuel maximum (FCFA)</Label>
            <Input
              type="number"
              step={5000}
              data-testid="parent-budget"
              value={form.budget_max}
              onChange={(e) => setForm({ ...form, budget_max: Number(e.target.value) })}
              className="h-11 rounded-xl"
            />
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Besoins spécifiques</Label>
            <Textarea
              data-testid="parent-needs"
              value={form.needs_description}
              onChange={(e) => setForm({ ...form, needs_description: e.target.value })}
              rows={4}
              className="rounded-xl"
              placeholder="Ex: bébé de 8 mois, allergique aux arachides, besoin d'une nounou parlant français et baoulé..."
            />
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-warm">
            <Button
              type="submit"
              data-testid="parent-save-btn"
              disabled={loading}
              className="bg-terracotta hover:bg-[#C55B3A] text-white rounded-full px-6 h-11"
            >
              <Save className="w-4 h-4 mr-2" /> {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button
              type="button"
              data-testid="parent-delete-btn"
              variant="outline"
              onClick={handleDelete}
              className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" /> Supprimer mon profil
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
