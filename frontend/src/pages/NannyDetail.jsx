import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, Briefcase, Phone, Globe2, Heart, ArrowLeft, Calendar, Users } from "lucide-react";
import Navbar from "../components/Navbar";
import { api, API, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "../components/ui/dialog";
import { toast } from "sonner";
import AdSlot from "../components/AdSlot";
import StarRating from "../components/StarRating";
import NannyReviews from "../components/NannyReviews";

export default function NannyDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [nanny, setNanny] = useState(null);
  const [hasAcceptedMatch, setHasAcceptedMatch] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      api.get(`/nannies`).then(({ data }) => {
        const found = (data.nannies || []).find((n) => n.user_id === id);
        setNanny(found || null);
      });
    } else {
      api.get(`/nannies/${id}`)
        .then(({ data }) => setNanny(data.nanny))
        .catch((e) => setError(formatApiErrorDetail(e?.response?.data?.detail)));
      // Check accepted match
      if (user.role === "parent") {
        api.get("/matches").then(({ data }) => {
          const accepted = (data.matches || []).some(
            (m) => m.nanny_id === id && m.status === "accepted"
          );
          setHasAcceptedMatch(accepted);
        }).catch(() => {});
      }
    }
  }, [id, user]);

  const sendRequest = async () => {
    setLoading(true);
    try {
      await api.post("/matches", { nanny_id: id, message });
      toast.success("Demande envoyée à la nounou !");
      setOpen(false);
      navigate("/matches");
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  if (!nanny) {
    return (
      <div className="bg-paper min-h-screen">
        <Navbar />
        <div className="max-w-4xl mx-auto px-5 py-20 text-center">
          <p className="text-gray-600">{error || "Chargement..."}</p>
        </div>
      </div>
    );
  }

  const isOwn = user?.id === nanny.user_id;
  const canRequest = user?.role === "parent";
  const photoSrc = (p) => (p && p.startsWith("http") ? p : p ? `${API}/files/${p}` : null);

  return (
    <div className="bg-paper min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 fade-in">
        <Link to="/search" className="inline-flex items-center text-gray-600 hover:text-terracotta text-sm mb-5">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour à la recherche
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl overflow-hidden border border-warm">
              <div className="aspect-square bg-gray-100">
                {nanny.photo_url ? (
                  <img src={photoSrc(nanny.photo_url)} alt={nanny.first_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-display text-gray-300">
                    {nanny.first_name?.[0]}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="font-display text-2xl text-gray-900 mb-1">
                  {nanny.first_name} {nanny.last_name}
                </div>
                <div className="text-sm text-gray-600 mb-2">{nanny.age} ans</div>
                {(nanny.review_count || 0) > 0 && (
                  <div className="flex items-center gap-2 mb-2" data-testid="nanny-rating-summary">
                    <StarRating value={nanny.avg_rating || 0} readOnly size={16} testId="nanny-rating-stars" />
                    <span className="text-sm font-bold text-gray-700">{(nanny.avg_rating || 0).toFixed(1)}</span>
                    <span className="text-xs text-gray-500">({nanny.review_count} avis)</span>
                  </div>
                )}
                <div className="text-3xl font-display text-terracotta mb-1">{nanny.hourly_rate?.toLocaleString("fr-FR")} <span className="text-sm font-normal text-gray-600">FCFA/mois</span></div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-warm">
              <h1 data-testid="nanny-detail-title" className="font-display text-3xl text-gray-900 mb-4">À propos</h1>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                {nanny.bio || "Aucune description fournie."}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6 pt-6 border-t border-warm">
                <Info icon={<MapPin className="w-4 h-4 text-terracotta" />} label="Localisation" value={`${nanny.quartier ? nanny.quartier + ", " : ""}${nanny.city}`} />
                <Info icon={<Briefcase className="w-4 h-4 text-sage" />} label="Expérience" value={`${nanny.experience_years} an(s)`} />
                <Info label="Disponibilité" value={nanny.availability} />
                {nanny.phone && <Info icon={<Phone className="w-4 h-4 text-sage" />} label="Téléphone" value={nanny.phone} />}
              </div>

              {nanny.languages?.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2 flex items-center gap-1.5">
                    <Globe2 className="w-3.5 h-3.5" /> Langues parlées
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {nanny.languages.map((l) => (
                      <span key={l} className="px-3 py-1 rounded-full bg-green-50 text-sage text-sm font-medium border border-sage/20">
                        {l}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {nanny.childcare_types?.length > 0 && (
                <div className="mt-5">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Types de garde</div>
                  <div className="flex flex-wrap gap-2">
                    {nanny.childcare_types.map((c) => (
                      <span key={c} className="px-3 py-1 rounded-full bg-orange-50 text-terracotta text-sm font-medium border border-terracotta/20">
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* CV - Expériences précédentes */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-warm">
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-sage" />
                <h2 className="font-display text-2xl text-gray-900">Expériences professionnelles</h2>
              </div>
              <p className="text-xs text-gray-500 mb-5">
                Référez-vous aux foyers ci-dessous avant de prendre votre décision.
                Vous pouvez les contacter pour obtenir un retour direct sur le travail de {nanny.first_name}.
              </p>

              {!nanny.previous_experiences?.length ? (
                <div data-testid="nanny-cv-empty" className="text-sm text-gray-500 italic bg-orange-50/40 rounded-xl p-4 text-center">
                  Cette nounou n'a pas encore renseigné ses expériences précédentes.
                </div>
              ) : (
                <div className="space-y-4" data-testid="nanny-cv-list">
                  {nanny.previous_experiences.map((exp, i) => (
                    <div
                      key={i}
                      data-testid={`nanny-cv-${i}`}
                      className="relative pl-6 border-l-2 border-sage/30 pb-4 last:pb-0"
                    >
                      <span className="absolute left-[-7px] top-1 w-3 h-3 rounded-full bg-sage" />
                      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-1">
                        <h3 className="font-display text-lg text-gray-900">
                          {exp.family_name || "Foyer privé"}
                        </h3>
                        {(exp.start_date || exp.end_date) && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {exp.start_date}{exp.start_date && exp.end_date ? " — " : ""}{exp.end_date}
                          </span>
                        )}
                      </div>
                      {exp.children_count != null && (
                        <div className="text-xs text-gray-600 flex items-center gap-1 mb-1.5">
                          <Users className="w-3 h-3 text-sage" />
                          {exp.children_count} enfant(s)
                        </div>
                      )}
                      {exp.description && (
                        <p className="text-sm text-gray-700 leading-relaxed mb-2">{exp.description}</p>
                      )}
                      {exp.household_phone && (
                        <div className="inline-flex items-center gap-1.5 text-sm text-sage font-semibold bg-green-50 px-3 py-1 rounded-full border border-sage/20">
                          <Phone className="w-3.5 h-3.5" />
                          <a
                            href={`tel:${exp.household_phone}`}
                            data-testid={`nanny-cv-phone-${i}`}
                            className="hover:underline"
                          >
                            {exp.household_phone}
                          </a>
                          <span className="text-[10px] uppercase tracking-wider text-gray-500 ml-1">référence</span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Avis 5 étoiles */}
            <NannyReviews nannyId={nanny.user_id} hasAcceptedMatch={hasAcceptedMatch} />

            {!isOwn && (
              <div className="bg-gradient-to-br from-terracotta to-[#E6B953] rounded-3xl p-6 sm:p-8 text-white">
                <Heart className="w-8 h-8 mb-3" fill="white" />
                <h3 className="font-display text-2xl mb-2">Cette nounou vous intéresse ?</h3>
                <p className="opacity-95 mb-5">Envoyez-lui une demande de mise en relation. Elle pourra accepter ou décliner.</p>
                {!user ? (
                  <Link to="/login" data-testid="nanny-login-cta">
                    <Button className="bg-white text-terracotta hover:bg-orange-50 rounded-full px-6">Se connecter pour contacter</Button>
                  </Link>
                ) : canRequest ? (
                  <Button
                    data-testid="nanny-request-btn"
                    onClick={() => setOpen(true)}
                    className="bg-white text-terracotta hover:bg-orange-50 rounded-full px-6"
                  >
                    Envoyer une demande
                  </Button>
                ) : (
                  <p className="text-sm opacity-90">Seuls les particuliers peuvent envoyer des demandes.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Envoyer une demande</DialogTitle>
            <DialogDescription>
              Présentez-vous brièvement et expliquez vos besoins à {nanny.first_name}.
            </DialogDescription>
          </DialogHeader>
          <AdSlot placement="pre_contact" variant="card" />
          <Textarea
            data-testid="match-message-input"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Bonjour, nous sommes une famille de Cocody, à la recherche d'une garde pour notre fils de 18 mois..."
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Annuler</Button>
            <Button
              data-testid="match-send-btn"
              onClick={sendRequest}
              disabled={loading}
              className="bg-terracotta hover:bg-[#C55B3A] text-white rounded-full"
            >
              {loading ? "Envoi..." : "Envoyer la demande"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Info({ icon, label, value }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wide text-gray-500 mb-0.5">
        {icon}{label}
      </div>
      <div className="text-gray-900 font-medium">{value || "—"}</div>
    </div>
  );
}
