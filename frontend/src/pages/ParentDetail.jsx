import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { MapPin, Users, Phone, Heart, ArrowLeft, Clock, Wallet } from "lucide-react";
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

export default function ParentDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [parent, setParent] = useState(null);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get(`/parents/${id}`)
      .then(({ data }) => setParent(data.parent))
      .catch((e) => setError(formatApiErrorDetail(e?.response?.data?.detail)));
  }, [id]);

  const sendRequest = async () => {
    setLoading(true);
    try {
      await api.post("/matches", { parent_id: id, message });
      toast.success("Demande envoyée à la famille !");
      setOpen(false);
      navigate("/matches");
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  };

  if (error) {
    return (
      <div className="bg-paper min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-5 py-20 text-center">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }
  if (!parent) {
    return (
      <div className="bg-paper min-h-screen">
        <Navbar />
        <div className="max-w-3xl mx-auto px-5 py-20 text-center text-gray-500">Chargement...</div>
      </div>
    );
  }

  const photoSrc = (p) => (p && p.startsWith("http") ? p : p ? `${API}/files/${p}` : null);
  const canRequest = user?.role === "nounou" && user?.id !== parent.user_id;

  return (
    <div className="bg-paper min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 fade-in">
        <Link to="/familles" className="inline-flex items-center text-gray-600 hover:text-terracotta text-sm mb-5">
          <ArrowLeft className="w-4 h-4 mr-1" /> Retour aux familles
        </Link>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl overflow-hidden border border-warm">
              <div className="aspect-square bg-gray-100">
                {parent.photo_url ? (
                  <img src={photoSrc(parent.photo_url)} alt={parent.first_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-6xl font-display text-gray-300">
                    {parent.first_name?.[0]}
                  </div>
                )}
              </div>
              <div className="p-5">
                <div className="font-display text-2xl text-gray-900 mb-1">
                  Famille {parent.last_name}
                </div>
                <div className="text-sm text-gray-600">{parent.first_name}</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-warm">
              <h1 className="font-display text-3xl text-gray-900 mb-4">Besoins de la famille</h1>
              <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-6">
                {parent.needs_description || "Aucune description fournie."}
              </p>

              <div className="grid sm:grid-cols-2 gap-4 pt-6 border-t border-warm">
                <Info icon={<MapPin className="w-4 h-4 text-terracotta" />} label="Localisation" value={`${parent.quartier ? parent.quartier + ", " : ""}${parent.city}`} />
                <Info icon={<Users className="w-4 h-4 text-sage" />} label="Enfants" value={`${parent.children_count} enfant(s)`} />
                <Info icon={<Clock className="w-4 h-4 text-accent" />} label="Horaires" value={parent.schedule} />
                <Info label="Type de garde" value={parent.care_type} />
                <Info icon={<Wallet className="w-4 h-4 text-terracotta" />} label="Budget mensuel max" value={`${parent.budget_max?.toLocaleString("fr-FR")} FCFA`} />
                {parent.phone && <Info icon={<Phone className="w-4 h-4 text-sage" />} label="Téléphone" value={parent.phone} />}
                {parent.address && <Info icon={<MapPin className="w-4 h-4" />} label="Adresse" value={parent.address} />}
              </div>

              {parent.children_photos?.length > 0 && (
                <div className="mt-6 pt-6 border-t border-warm">
                  <div className="text-xs uppercase tracking-wide text-gray-500 mb-3">Enfants à garder</div>
                  <div className="flex flex-wrap gap-3">
                    {parent.children_photos.map((p, i) => (
                      <img
                        key={i}
                        src={photoSrc(p)}
                        alt={`enfant ${i + 1}`}
                        data-testid={`parent-child-photo-${i}`}
                        className="w-24 h-24 rounded-2xl object-cover border border-warm"
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {canRequest && (
              <div className="bg-gradient-to-br from-sage to-[#3d664a] rounded-3xl p-6 sm:p-8 text-white">
                <Heart className="w-8 h-8 mb-3" fill="white" />
                <h3 className="font-display text-2xl mb-2">Cette famille vous intéresse ?</h3>
                <p className="opacity-95 mb-5">Envoyez votre candidature. La famille pourra accepter ou décliner.</p>
                <Button
                  data-testid="parent-request-btn"
                  onClick={() => setOpen(true)}
                  className="bg-white text-sage hover:bg-orange-50 rounded-full px-6"
                >
                  Postuler à cette famille
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-display">Postuler auprès de la famille</DialogTitle>
            <DialogDescription>
              Présentez-vous brièvement et expliquez pourquoi votre profil correspond à leurs besoins.
            </DialogDescription>
          </DialogHeader>
          <AdSlot placement="pre_contact" variant="card" />
          <Textarea
            data-testid="parent-match-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={5}
            placeholder="Bonjour, je suis nounou avec X années d'expérience à Cocody, disponible aux horaires que vous proposez..."
            className="rounded-xl"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} className="rounded-full">Annuler</Button>
            <Button
              data-testid="parent-match-send"
              onClick={sendRequest}
              disabled={loading}
              className="bg-sage hover:bg-[#3d664a] text-white rounded-full"
            >
              {loading ? "Envoi..." : "Envoyer ma candidature"}
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
