import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, MapPin, Briefcase, Star, Filter } from "lucide-react";
import Navbar from "../components/Navbar";
import { api, API } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "../components/ui/select";
import { CITIES, ABIDJAN_QUARTIERS, AVAILABILITIES, CARE_TYPES } from "../lib/constants";

export default function SearchNannies() {
  const [filters, setFilters] = useState({
    search: "",
    city: "all",
    quartier: "all",
    availability: "all",
    care_type: "all",
    min_experience: "",
    max_rate: "",
  });
  const [nannies, setNannies] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const params = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "" && v !== "all" && v != null) params[k] = v;
      });
      const { data } = await api.get("/nannies", { params });
      setNannies(data.nannies || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const apply = (e) => { e.preventDefault(); load(); };
  const reset = () => {
    setFilters({ search: "", city: "all", quartier: "all", availability: "all", care_type: "all", min_experience: "", max_rate: "" });
    setTimeout(load, 0);
  };
  const isAbidjan = filters.city === "Abidjan";

  const photoSrc = (p) => (p && p.startsWith("http") ? p : p ? `${API}/files/${p}` : null);

  return (
    <div className="bg-paper min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 fade-in">
        <h1 data-testid="search-title" className="font-display text-3xl sm:text-4xl text-gray-900 mb-2">
          Trouver une nounou
        </h1>
        <p className="text-gray-600 mb-6">Filtrez par ville (toute la Côte d'Ivoire), quartier, expérience, disponibilité.</p>

        <form
          onSubmit={apply}
          className="bg-white rounded-3xl p-5 sm:p-6 border border-warm mb-6 grid lg:grid-cols-12 gap-3"
        >
          <div className="lg:col-span-3">
            <Label className="text-xs font-semibold mb-1 block">Recherche</Label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                data-testid="search-input"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                placeholder="Nom ou mot-clé"
                className="pl-9 h-11 rounded-xl"
              />
            </div>
          </div>
          <div className="lg:col-span-2">
            <Label className="text-xs font-semibold mb-1 block">Ville</Label>
            <Select value={filters.city} onValueChange={(v) => setFilters({ ...filters, city: v, quartier: "all" })}>
              <SelectTrigger data-testid="search-city" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
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
                <SelectTrigger data-testid="search-quartier" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {ABIDJAN_QUARTIERS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                </SelectContent>
              </Select>
            ) : (
              <Input
                data-testid="search-quartier-input"
                value={filters.quartier === "all" ? "" : filters.quartier}
                onChange={(e) => setFilters({ ...filters, quartier: e.target.value || "all" })}
                placeholder="Tous"
                className="h-11 rounded-xl"
              />
            )}
          </div>
          <div className="lg:col-span-2">
            <Label className="text-xs font-semibold mb-1 block">Dispo.</Label>
            <Select value={filters.availability} onValueChange={(v) => setFilters({ ...filters, availability: v })}>
              <SelectTrigger data-testid="search-availability" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {AVAILABILITIES.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-1">
            <Label className="text-xs font-semibold mb-1 block">Type</Label>
            <Select value={filters.care_type} onValueChange={(v) => setFilters({ ...filters, care_type: v })}>
              <SelectTrigger data-testid="search-care" className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {CARE_TYPES.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="lg:col-span-1">
            <Label className="text-xs font-semibold mb-1 block">Exp. min</Label>
            <Input
              type="number"
              data-testid="search-min-exp"
              value={filters.min_experience}
              onChange={(e) => setFilters({ ...filters, min_experience: e.target.value })}
              placeholder="0"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="lg:col-span-1">
            <Label className="text-xs font-semibold mb-1 block">Tarif max</Label>
            <Input
              type="number"
              step={5000}
              data-testid="search-max-rate"
              value={filters.max_rate}
              onChange={(e) => setFilters({ ...filters, max_rate: e.target.value })}
              placeholder="FCFA/mois"
              className="h-11 rounded-xl"
            />
          </div>
          <div className="lg:col-span-12 flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={reset} data-testid="search-reset" className="rounded-full">
              Réinitialiser
            </Button>
            <Button type="submit" data-testid="search-apply" className="rounded-full bg-terracotta hover:bg-[#C55B3A] text-white px-6">
              <Filter className="w-4 h-4 mr-1.5" /> Filtrer
            </Button>
          </div>
        </form>

        {loading ? (
          <div className="text-center py-20 text-gray-500">Chargement...</div>
        ) : nannies.length === 0 ? (
          <div data-testid="search-empty" className="bg-white rounded-3xl p-16 text-center border border-warm">
            <Search className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-display text-xl text-gray-900 mb-2">Aucune nounou trouvée</p>
            <p className="text-gray-600">Essayez d'élargir vos filtres ou changez de ville.</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="search-results">
            {nannies.map((n) => (
              <Link
                key={n.user_id}
                to={`/nounous/${n.user_id}`}
                data-testid={`nanny-card-${n.user_id}`}
                className="bg-white rounded-3xl border border-warm card-hover overflow-hidden flex flex-col"
              >
                <div className="relative h-44 bg-gray-100">
                  {n.photo_url ? (
                    <img src={photoSrc(n.photo_url)} alt={n.first_name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-4xl font-display text-gray-300">
                      {n.first_name?.[0] || "?"}
                    </div>
                  )}
                  <div className="absolute top-3 right-3 bg-white px-3 py-1 rounded-full text-sm font-bold text-terracotta shadow">
                    {n.hourly_rate?.toLocaleString("fr-FR")} FCFA/mois
                  </div>
                </div>
                <div className="p-5 flex flex-col gap-2 flex-1">
                  <div className="font-display text-xl text-gray-900">
                    {n.first_name} {n.last_name?.[0]}.
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-terracotta" />
                    {n.quartier ? `${n.quartier}, ` : ""}{n.city}
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Briefcase className="w-3.5 h-3.5 text-sage" />
                    {n.experience_years} an(s) d'expérience
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-gray-600">
                    <Star className="w-3.5 h-3.5 text-accent" />
                    {n.availability}
                  </div>
                  {n.bio && <p className="text-xs text-gray-500 line-clamp-2 mt-1">{n.bio}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
