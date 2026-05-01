import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Users, Filter, Clock } from "lucide-react";
import Navbar from "../components/Navbar";
import { api, API } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { CITIES, ABIDJAN_QUARTIERS, CARE_TYPES, SCHEDULES } from "../lib/constants";

export default function SearchParents() {
  const { user, loading: authLoading } = useAuth();
  const [filters, setFilters] = useState({
    search: "",
    city: "all",
    quartier: "all",
    care_type: "all",
    schedule: "all",
    min_budget: "",
  });
  const [parents, setParents] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== "all" && v != null) params[k] = v;
      });
      const { data } = await api.get("/parents", { params });
      setParents(data.parents || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "nounou") load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  if (authLoading) return null;
  if (!user || user.role !== "nounou") {
    return (
      <div className="bg-paper min-h-screen">
        <Navbar />
        <div className="max-w-2xl mx-auto px-5 py-20 text-center">
          <h1 className="font-display text-2xl text-gray-900 mb-3">Espace réservé aux nounous</h1>
          <p className="text-gray-600">Cette page liste les familles à la recherche d'une nounou.</p>
        </div>
      </div>
    );
  }

  const apply = (e) => { e.preventDefault(); load(); };
  const reset = () => {
    setFilters({ search: "", city: "all", quartier: "all", care_type: "all", schedule: "all", min_budget: "" });
    setTimeout(load, 0);
  };
  const isAbidjan = filters.city === "Abidjan";

  return (
    <div className="bg-paper min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 fade-in">
        <h1 data-testid="parents-title" className="font-display text-3xl sm:text-4xl text-gray-900 mb-2">
          Familles à la recherche
        </h1>
        <p className="text-gray-600 mb-6">Découvrez les particuliers qui cherchent une nounou et envoyez votre candidature.</p>

        <form
          onSubmit={apply}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-warm mb-6 grid lg:grid-cols-12 gap-3"
        >
          <div className="lg:col-span-3">
            <Label className="text-xs font-semibold mb-1 block">Recherche</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                data-testid="parents-search"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Nom, mot-clé"
                className="pl-9 h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <Label className="text-xs font-semibold mb-1 block">Ville</Label>
            <Select value={filters.city} onValueChange={(v) => setFilters({ ...filters, city: v, quartier: "all" })}>
              <SelectTrigger data-testid="parents-city" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {CITIES.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Label className="text-xs font-semibold mb-1 block">Quartier</Label>
            {isAbidjan ? (
              <Select value={filters.quartier} onValueChange={(v) => setFilters({ ...filters, quartier: v })}>
                <SelectTrigger data-testid="parents-quartier" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {ABIDJAN_QUARTIERS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                data-testid="parents-quartier-input"
                value={filters.quartier === "all" ? "" : filters.quartier}
                onChange={(e) => setFilters({ ...filters, quartier: e.target.value || "all" })}
                placeholder="Tous"
                className="h-11 rounded-xl"
              />
            )}
          </div>
          <div className="lg:col-span-2">
            <Label className="text-xs font-semibold mb-1 block">Type de garde</Label>
            <Select value={filters.care_type} onValueChange={(v) => setFilters({ ...filters, care_type: v })}>
              <SelectTrigger data-testid="parents-care" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {CARE_TYPES.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-2">
            <Label className="text-xs font-semibold mb-1 block">Horaires</Label>
            <Select value={filters.schedule} onValueChange={(v) => setFilters({ ...filters, schedule: v })}>
              <SelectTrigger data-testid="parents-schedule" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {SCHEDULES.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-1">
            <Label className="text-xs font-semibold mb-1 block">Budget min</Label>
            <Input
              type="number"
              step={500}
              data-testid="parents-budget"
              value={filters.min_budget}
              onChange={(e) => setFilters({ ...filters, min_budget: e.target.value })}
              placeholder="FCFA"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="lg:col-span-12 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={reset} data-testid="parents-reset" className="rounded-full">Réinitialiser</Button>
            <Button type="submit" data-testid="parents-apply" className="rounded-full bg-terracotta hover:bg-[#C55B3A] text-white px-6">
              <Filter className="w-4 h-4 mr-1.5" /> Filtrer
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Chargement...</div>
        ) : parents.length === 0 ? (
          <div data-testid="parents-empty" className="bg-white rounded-3xl p-16 text-center border border-warm">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-display text-xl text-gray-900 mb-2">Aucune famille trouvée</p>
            <p className="text-gray-600">Essayez d'élargir vos filtres ou changez de ville.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="parents-results">
            {parents.map((p) => (
              <Link
                key={p.user_id}
                to={`/familles/${p.user_id}`}
                data-testid={`parent-card-${p.user_id}`}
                className="bg-white rounded-3xl border border-warm card-hover overflow-hidden flex flex-col"
              >
                <div className="relative h-44 bg-gray-100 flex items-center justify-center">
                  {p.photo_url ? (
                    <img
                      src={p.photo_url.startsWith("http") ? p.photo_url : `${API}/files/${p.photo_url}`}
                      alt={p.first_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-4xl font-display text-gray-300">
                      {p.first_name?.[0] || "?"}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-terracotta shadow">
                    {p.budget_max} FCFA/h max
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-2 flex-1">
                  <div className="font-display text-xl text-gray-900">
                    Famille {p.last_name?.[0]}.
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-terracotta" />
                    {p.quartier ? `${p.quartier}, ` : ""}{p.city}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Users className="w-3.5 h-3.5 text-sage" />
                    {p.children_count} enfant(s) · {p.care_type}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Clock className="w-3.5 h-3.5 text-accent" />
                    {p.schedule}
                  </div>
                  {p.needs_description && <p className="text-xs text-gray-500 line-clamp-2 mt-1">{p.needs_description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
