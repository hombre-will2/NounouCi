import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, UserCircle, ClipboardList, Bell, Edit3, Phone, MapPin, Briefcase } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { api, API } from "../lib/api";
import { Button } from "../components/ui/button";

export default function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [matches, setMatches] = useState([]);
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    const path = user.role === "nounou" ? "/profile/nanny/me" : "/profile/parent/me";
    api.get(path).then(({ data }) => setProfile(data.profile)).catch(() => {});
    api.get("/matches").then(({ data }) => setMatches(data.matches || [])).catch(() => {});
    api.get("/notifications").then(({ data }) => setUnread(data.unread || 0)).catch(() => {});
  }, [user]);

  if (!user) return null;
  const isNanny = user.role === "nounou";
  const photoSrc = (p) => (p && p.startsWith("http") ? p : p ? `${API}/files/${p}` : null);

  const pendingCount = matches.filter((m) => m.status === "pending").length;
  const acceptedCount = matches.filter((m) => m.status === "accepted").length;

  return (
    <div className="bg-paper min-h-screen">
      <Navbar />
      <div className="max-w-7xl mx-auto px-5 sm:px-8 py-10 fade-in">
        <div className="mb-8">
          <p className="text-sm font-bold text-sage uppercase tracking-wider mb-2">
            {isNanny ? "Espace Nounou" : "Espace Particulier"}
          </p>
          <h1 data-testid="dashboard-title" className="font-display text-4xl text-gray-900">
            Bonjour, <span className="text-terracotta">{user.first_name}</span> !
          </h1>
          <p className="text-gray-600 mt-2">
            {isNanny
              ? "Gérez votre profil et répondez aux demandes des familles."
              : "Trouvez la nounou idéale et suivez vos demandes."}
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-warm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-terracotta" />
              </div>
              <span className="text-3xl font-display text-gray-900" data-testid="stat-pending">{pendingCount}</span>
            </div>
            <p className="text-sm text-gray-600">{isNanny ? "Demandes en attente" : "Demandes envoyées"}</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-warm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-sage" />
              </div>
              <span className="text-3xl font-display text-gray-900" data-testid="stat-accepted">{acceptedCount}</span>
            </div>
            <p className="text-sm text-gray-600">Mises en relation actives</p>
          </div>
          <div className="bg-white rounded-2xl p-6 border border-warm">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center">
                <Bell className="w-5 h-5 text-yellow-700" />
              </div>
              <span className="text-3xl font-display text-gray-900" data-testid="stat-unread">{unread}</span>
            </div>
            <p className="text-sm text-gray-600">Notifications non lues</p>
          </div>
        </div>

        {/* Profile card */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2 bg-white rounded-3xl p-8 border border-warm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-2xl text-gray-900">Mon profil</h2>
              <Link to={isNanny ? "/profile/nanny" : "/profile/parent"} data-testid="dashboard-edit-profile">
                <Button variant="outline" size="sm" className="rounded-full border-terracotta text-terracotta hover:bg-orange-50">
                  <Edit3 className="w-4 h-4 mr-1" /> Modifier
                </Button>
              </Link>
            </div>

            {!profile ? (
              <div className="text-center py-10">
                <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">Votre profil n'est pas encore complété.</p>
                <Link to={isNanny ? "/profile/nanny" : "/profile/parent"}>
                  <Button data-testid="dashboard-complete-profile" className="bg-terracotta hover:bg-[#C55B3A] text-white rounded-full">
                    Compléter mon profil
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid sm:grid-cols-[auto_1fr] gap-5 items-start">
                {profile.photo_url && (
                  <img
                    src={photoSrc(profile.photo_url)}
                    alt={profile.first_name}
                    data-testid="dashboard-profile-photo"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-warm"
                  />
                )}
                <div className="grid sm:grid-cols-2 gap-4 flex-1">
                <InfoRow icon={<UserCircle className="w-4 h-4" />} label="Nom complet" value={`${profile.first_name} ${profile.last_name}`} />
                <InfoRow icon={<Phone className="w-4 h-4" />} label="Téléphone" value={profile.phone} />
                <InfoRow icon={<MapPin className="w-4 h-4" />} label="Localisation" value={`${profile.quartier ? profile.quartier + ", " : ""}${profile.city}`} />
                {isNanny ? (
                  <>
                    <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Expérience" value={`${profile.experience_years} an(s)`} />
                    <InfoRow label="Disponibilité" value={profile.availability} />
                    <InfoRow label="Tarif mensuel" value={`${profile.hourly_rate?.toLocaleString("fr-FR")} FCFA`} />
                  </>
                ) : (
                  <>
                    <InfoRow label="Type de garde" value={profile.care_type} />
                    <InfoRow label="Horaires" value={profile.schedule} />
                    <InfoRow label="Budget mensuel max." value={`${profile.budget_max?.toLocaleString("fr-FR")} FCFA`} />
                  </>
                )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {!isNanny && (
              <Link to="/search" data-testid="dashboard-search-cta" className="block">
                <div className="bg-terracotta text-white rounded-3xl p-6 hover:bg-[#C55B3A] transition-colors">
                  <Search className="w-8 h-8 mb-3" />
                  <h3 className="font-display text-xl mb-1">Trouver une nounou</h3>
                  <p className="text-sm opacity-90">Filtrez par ville, quartier, expérience, budget.</p>
                </div>
              </Link>
            )}
            {isNanny && (
              <Link to="/familles" data-testid="dashboard-parents-cta" className="block">
                <div className="bg-terracotta text-white rounded-3xl p-6 hover:bg-[#C55B3A] transition-colors">
                  <Search className="w-8 h-8 mb-3" />
                  <h3 className="font-display text-xl mb-1">Familles à la recherche</h3>
                  <p className="text-sm opacity-90">Découvrez les particuliers et postulez auprès d'eux.</p>
                </div>
              </Link>
            )}
            <Link to="/matches" data-testid="dashboard-matches-cta" className="block">
              <div className="bg-sage text-white rounded-3xl p-6 hover:bg-[#3d664a] transition-colors">
                <ClipboardList className="w-8 h-8 mb-3" />
                <h3 className="font-display text-xl mb-1">Mes demandes</h3>
                <p className="text-sm opacity-90">Suivez l'historique de vos mises en relation.</p>
              </div>
            </Link>
            <Link to="/notifications" data-testid="dashboard-notif-cta" className="block">
              <div className="bg-accent text-gray-900 rounded-3xl p-6 hover:opacity-95 transition-opacity">
                <Bell className="w-8 h-8 mb-3" />
                <h3 className="font-display text-xl mb-1">Notifications {unread > 0 && `(${unread})`}</h3>
                <p className="text-sm opacity-80">Restez informé(e) des correspondances.</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 mb-0.5">
        {icon}{label}
      </div>
      <div className="text-gray-900 font-medium">{value || "—"}</div>
    </div>
  );
}
