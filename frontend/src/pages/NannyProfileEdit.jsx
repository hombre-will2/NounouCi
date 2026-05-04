import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Save, Trash2, Plus, Briefcase } from "lucide-react";
import Navbar from "../components/Navbar";
import ImageUpload from "../components/ImageUpload";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { ABIDJAN_QUARTIERS, CITIES, AVAILABILITIES, CARE_TYPES, LANGUAGES_LIST } from "../lib/constants";

export default function NannyProfileEdit() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    age: 25,
    experience_years: 0,
    quartier: "Cocody",
    city: "Abidjan",
    availability: "Temps plein",
    hourly_rate: 50000,
    bio: "",
    photo_url: "",
    languages: ["Français"],
    childcare_types: [],
    previous_experiences: [],
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!user || user.role !== "nounou") {
      navigate("/dashboard");
      return;
    }
    api.get("/profile/nanny/me").then(({ data }) => {
      if (data.profile) setForm((f) => ({ ...f, ...data.profile }));
    });
  }, [user, navigate]);

  const validate = () => {
    const e = {};
    if (form.age < 18) e.age = "Min. 18 ans";
    if (form.experience_years < 0) e.experience_years = "Doit être positif";
    if (form.hourly_rate < 0) e.hourly_rate = "Doit être positif";
    if (form.bio.length > 1000) e.bio = "Max. 1000 caractères";
    if (!form.photo_url) e.photo_url = "Une photo de vous est obligatoire pour valider votre profil";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    if (!validate()) {
      toast.error("Merci de compléter les champs requis");
      return;
    }
    setLoading(true);
    try {
      await api.put("/profile/nanny", form);
      toast.success("Profil enregistré");
      navigate("/dashboard");
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Supprimer votre profil nounou ? Cette action est irréversible.")) return;
    try {
      await api.delete("/profile/nanny/me");
      toast.success("Profil supprimé");
      navigate("/dashboard");
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    }
  };

  const toggle = (key, value) => {
    setForm((f) => {
      const list = f[key] || [];
      return list.includes(value)
        ? { ...f, [key]: list.filter((x) => x !== value) }
        : { ...f, [key]: [...list, value] };
    });
  };

  const addExperience = () => {
    setForm((f) => ({
      ...f,
      previous_experiences: [
        ...(f.previous_experiences || []),
        { family_name: "", household_phone: "", start_date: "", end_date: "", description: "", children_count: 1 },
      ],
    }));
  };

  const updateExperience = (idx, field, value) => {
    setForm((f) => {
      const list = [...(f.previous_experiences || [])];
      list[idx] = { ...list[idx], [field]: value };
      return { ...f, previous_experiences: list };
    });
  };

  const removeExperience = (idx) => {
    setForm((f) => ({
      ...f,
      previous_experiences: (f.previous_experiences || []).filter((_, i) => i !== idx),
    }));
  };

  const isAbidjan = form.city === "Abidjan";

  return (
    <div className="bg-paper min-h-screen">
      <Navbar />
      <div className="max-w-3xl mx-auto px-5 sm:px-8 py-10 fade-in">
        <h1 className="font-display text-3xl sm:text-4xl text-gray-900 mb-2">Mon profil nounou</h1>
        <p className="text-gray-600 mb-8">
          Renseignez vos informations et téléversez une photo de vous pour valider votre profil et être visible auprès des familles.
        </p>

        <form onSubmit={submit} className="bg-white rounded-3xl p-6 sm:p-8 border border-warm space-y-5">
          <div>
            <ImageUpload
              value={form.photo_url}
              onChange={(p) => setForm({ ...form, photo_url: p || "" })}
              label="Votre photo de profil *"
              roundedFull
              size="lg"
              testId="nanny-photo"
            />
            {errors.photo_url && <p className="text-xs text-red-600 mt-1">{errors.photo_url}</p>}
          </div>

          <div className="grid sm:grid-cols-3 gap-3">
            <FieldNumber label="Âge" value={form.age} onChange={(v) => setForm({ ...form, age: v })} error={errors.age} testId="nanny-age" />
            <FieldNumber label="Années d'expérience" value={form.experience_years} onChange={(v) => setForm({ ...form, experience_years: v })} error={errors.experience_years} testId="nanny-exp" />
            <FieldNumber label="Tarif mensuel (FCFA)" value={form.hourly_rate} onChange={(v) => setForm({ ...form, hourly_rate: v })} error={errors.hourly_rate} testId="nanny-rate" step={5000} />
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-sm font-semibold mb-1.5 block">Ville</Label>
              <Select value={form.city} onValueChange={(v) => setForm({ ...form, city: v, quartier: v === "Abidjan" ? "Cocody" : "" })}>
                <SelectTrigger data-testid="nanny-city-trigger" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
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
                  <SelectTrigger data-testid="nanny-quartier-trigger" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ABIDJAN_QUARTIERS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  data-testid="nanny-quartier-input"
                  value={form.quartier}
                  onChange={(e) => setForm({ ...form, quartier: e.target.value })}
                  className="h-11 rounded-xl"
                  placeholder="Ex: Centre-ville"
                />
              )}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Disponibilité</Label>
            <Select value={form.availability} onValueChange={(v) => setForm({ ...form, availability: v })}>
              <SelectTrigger data-testid="nanny-avail-trigger" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                {AVAILABILITIES.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-1.5 block">Bio / Présentation</Label>
            <Textarea
              data-testid="nanny-bio"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              className="rounded-xl"
              placeholder="Parlez de vous, de votre passion pour les enfants, de votre approche..."
            />
            <p className="text-xs text-gray-500 mt-1">{form.bio.length}/1000</p>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Types de garde</Label>
            <div className="grid sm:grid-cols-2 gap-2">
              {CARE_TYPES.map((c) => (
                <label key={c} className="flex items-center gap-2 p-3 rounded-xl border border-warm hover:border-terracotta/40 cursor-pointer">
                  <Checkbox
                    data-testid={`nanny-care-${c}`}
                    checked={form.childcare_types.includes(c)}
                    onCheckedChange={() => toggle("childcare_types", c)}
                  />
                  <span className="text-sm">{c}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-sm font-semibold mb-2 block">Langues parlées</Label>
            <div className="grid sm:grid-cols-3 gap-2">
              {LANGUAGES_LIST.map((c) => (
                <label key={c} className="flex items-center gap-2 p-2 rounded-xl border border-warm hover:border-sage/40 cursor-pointer">
                  <Checkbox
                    data-testid={`nanny-lang-${c}`}
                    checked={form.languages.includes(c)}
                    onCheckedChange={() => toggle("languages", c)}
                  />
                  <span className="text-sm">{c}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Expériences précédentes (CV) */}
          <div className="pt-2">
            <div className="flex items-center justify-between mb-3">
              <div>
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-sage" /> Mes expériences précédentes
                </Label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Ajoutez les foyers où vous avez travaillé. Les particuliers verront ces références avant de vous contacter.
                </p>
              </div>
              <Button
                type="button"
                onClick={addExperience}
                data-testid="nanny-add-exp"
                size="sm"
                variant="outline"
                className="rounded-full border-sage text-sage hover:bg-green-50"
              >
                <Plus className="w-4 h-4 mr-1" /> Ajouter
              </Button>
            </div>

            {(form.previous_experiences || []).length === 0 ? (
              <div className="text-sm text-gray-500 bg-orange-50/50 border border-warm rounded-xl p-4 text-center">
                Aucune expérience ajoutée. Cliquez sur "Ajouter" pour renseigner vos précédents employeurs.
              </div>
            ) : (
              <div className="space-y-3">
                {(form.previous_experiences || []).map((exp, idx) => (
                  <div
                    key={idx}
                    data-testid={`nanny-exp-${idx}`}
                    className="bg-orange-50/40 border border-warm rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-sage uppercase tracking-wider">Expérience #{idx + 1}</span>
                      <Button
                        type="button"
                        onClick={() => removeExperience(idx)}
                        data-testid={`nanny-exp-remove-${idx}`}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50 rounded-full h-8 w-8 p-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-2">
                      <Input
                        data-testid={`nanny-exp-family-${idx}`}
                        value={exp.family_name || ""}
                        onChange={(e) => updateExperience(idx, "family_name", e.target.value)}
                        placeholder="Nom du foyer (ex: Famille Konan)"
                        className="h-10 rounded-xl"
                      />
                      <Input
                        data-testid={`nanny-exp-phone-${idx}`}
                        value={exp.household_phone || ""}
                        onChange={(e) => updateExperience(idx, "household_phone", e.target.value)}
                        placeholder="Téléphone du foyer (référence)"
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <div className="grid sm:grid-cols-3 gap-2">
                      <Input
                        data-testid={`nanny-exp-start-${idx}`}
                        value={exp.start_date || ""}
                        onChange={(e) => updateExperience(idx, "start_date", e.target.value)}
                        placeholder="Début (ex: Jan 2022)"
                        className="h-10 rounded-xl"
                      />
                      <Input
                        data-testid={`nanny-exp-end-${idx}`}
                        value={exp.end_date || ""}
                        onChange={(e) => updateExperience(idx, "end_date", e.target.value)}
                        placeholder="Fin (ex: Déc 2023, En cours)"
                        className="h-10 rounded-xl"
                      />
                      <Input
                        type="number"
                        data-testid={`nanny-exp-children-${idx}`}
                        value={exp.children_count ?? ""}
                        onChange={(e) => updateExperience(idx, "children_count", e.target.value === "" ? null : Number(e.target.value))}
                        placeholder="Nb enfants"
                        className="h-10 rounded-xl"
                      />
                    </div>
                    <Textarea
                      data-testid={`nanny-exp-desc-${idx}`}
                      value={exp.description || ""}
                      onChange={(e) => updateExperience(idx, "description", e.target.value)}
                      placeholder="Résumé du poste (âge des enfants, tâches, points forts...)"
                      rows={2}
                      className="rounded-xl"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-3 pt-4 border-t border-warm">
            <Button
              type="submit"
              data-testid="nanny-save-btn"
              disabled={loading}
              className="bg-terracotta hover:bg-[#C55B3A] text-white rounded-full px-6 h-11"
            >
              <Save className="w-4 h-4 mr-2" /> {loading ? "Enregistrement..." : "Enregistrer"}
            </Button>
            <Button
              type="button"
              data-testid="nanny-delete-btn"
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

function FieldNumber({ label, value, onChange, error, testId, step = 1 }) {
  return (
    <div>
      <Label className="text-sm font-semibold mb-1.5 block">{label}</Label>
      <Input
        type="number"
        data-testid={testId}
        value={value}
        step={step}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-11 rounded-xl"
      />
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  );
}
