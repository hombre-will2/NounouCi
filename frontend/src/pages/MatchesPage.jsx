import React, { useEffect, useState } from "react";
import { ClipboardList, Phone, Check, X, Trash2, User2 } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../contexts/AuthContext";
import { api, API, formatApiErrorDetail } from "../lib/api";
import { Button } from "../components/ui/button";
import { toast } from "sonner";

const STATUS_LABEL = {
  pending: { txt: "En attente", cls: "bg-yellow-100 text-yellow-800" },
  accepted: { txt: "Acceptée", cls: "bg-green-100 text-sage" },
  declined: { txt: "Déclinée", cls: "bg-red-100 text-red-700" },
};

export default function MatchesPage() {
  const { user } = useAuth();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/matches");
      setMatches(data.matches || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const update = async (id, status) => {
    try {
      await api.put(`/matches/${id}`, { status });
      toast.success(status === "accepted" ? "Demande acceptée" : "Demande déclinée");
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Supprimer cette demande ?")) return;
    try {
      await api.delete(`/matches/${id}`);
      toast.success("Demande supprimée");
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    }
  };

  const isNanny = user?.role === "nounou";
  const photoSrc = (p) => (p && p.startsWith("http") ? p : p ? `${API}/files/${p}` : null);

  return (
    <div className="bg-paper min-h-screen">
      <Navbar />
      <div className="max-w-5xl mx-auto px-5 sm:px-8 py-10 fade-in">
        <h1 className="font-display text-3xl sm:text-4xl text-gray-900 mb-2">Mes demandes</h1>
        <p className="text-gray-600 mb-8">Suivez l'état de vos mises en relation et répondez aux demandes reçues.</p>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Chargement...</div>
        ) : matches.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-warm" data-testid="matches-empty">
            <ClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="font-display text-xl text-gray-900 mb-2">Aucune demande</p>
            <p className="text-gray-600">{isNanny ? "Aucune mise en relation pour le moment." : "Vous n'avez pas encore envoyé de demande."}</p>
          </div>
        ) : (
          <div className="space-y-4" data-testid="matches-list">
            {matches.map((m) => {
              const st = STATUS_LABEL[m.status] || STATUS_LABEL.pending;
              const initiatedBy = m.initiated_by || "parent";
              // Identifier la cible et l'expéditeur du point de vue de l'utilisateur
              const otherName = isNanny ? m.parent_name : m.nanny_name;
              const otherPhoto = isNanny ? m.parent_photo_url : m.nanny_photo_url;
              const otherPhone = m.status === "accepted"
                ? (isNanny ? m.parent_phone : m.nanny_phone)
                : null;
              // L'utilisateur peut-il accepter/décliner ?
              // Recipient = celui qui n'a PAS initié
              const isRecipient = (initiatedBy === "parent" && isNanny) || (initiatedBy === "nounou" && !isNanny);
              const canAct = isRecipient && m.status === "pending";
              const directionLabel = initiatedBy === "parent"
                ? (isNanny ? "Demande reçue de la famille" : "Vous avez contacté la nounou")
                : (isNanny ? "Vous avez postulé" : "Candidature reçue d'une nounou");

              return (
                <div
                  key={m.id}
                  data-testid={`match-card-${m.id}`}
                  className="bg-white rounded-2xl p-5 sm:p-6 border border-warm flex flex-col sm:flex-row sm:items-start gap-4"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-orange-50 flex items-center justify-center shrink-0">
                    {otherPhoto ? (
                      <img src={photoSrc(otherPhoto)} alt={otherName} className="w-full h-full object-cover" />
                    ) : (
                      <User2 className="w-6 h-6 text-terracotta" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1 flex-wrap">
                      <h3 className="font-display text-lg text-gray-900">{otherName}</h3>
                      <span className={`px-3 py-0.5 rounded-full text-xs font-semibold ${st.cls}`}>
                        {st.txt}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mb-2">{directionLabel}</div>
                    {m.message && <p className="text-gray-700 text-sm mb-2">"{m.message}"</p>}
                    {otherPhone && (
                      <div className="flex items-center gap-2 text-sm text-sage font-semibold mt-2">
                        <Phone className="w-4 h-4" /> {otherPhone}
                      </div>
                    )}
                    <div className="text-xs text-gray-400 mt-2">
                      {new Date(m.created_at).toLocaleString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {canAct && (
                      <>
                        <Button
                          size="sm"
                          data-testid={`match-accept-${m.id}`}
                          onClick={() => update(m.id, "accepted")}
                          className="bg-sage hover:bg-[#3d664a] text-white rounded-full"
                        >
                          <Check className="w-4 h-4 mr-1" /> Accepter
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`match-decline-${m.id}`}
                          onClick={() => update(m.id, "declined")}
                          className="rounded-full"
                        >
                          <X className="w-4 h-4 mr-1" /> Décliner
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      data-testid={`match-delete-${m.id}`}
                      onClick={() => remove(m.id)}
                      className="text-red-600 hover:bg-red-50 rounded-full"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
