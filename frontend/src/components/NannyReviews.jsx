import React, { useEffect, useState } from "react";
import { Edit3, Trash2, MessageSquare } from "lucide-react";
import { api, formatApiErrorDetail } from "../lib/api";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import StarRating from "./StarRating";
import { toast } from "sonner";

// Section affichée sur le profil public d'une nounou.
// - Affiche la note moyenne + le nombre d'avis
// - Liste les avis triés par date
// - Si l'utilisateur connecté est un parent avec match accepted, propose le formulaire d'avis
// - L'admin peut supprimer n'importe quel avis ; le parent peut modifier/supprimer le sien
export default function NannyReviews({ nannyId, hasAcceptedMatch }) {
  const { user } = useAuth();
  const [data, setData] = useState({ reviews: [], avg_rating: 0, review_count: 0 });
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/reviews", { params: { nanny_id: nannyId } });
      setData(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (nannyId) load(); }, [nannyId]); // eslint-disable-line

  const myReview = data.reviews.find((r) => r.parent_id === user?.id);
  const canReview = user?.role === "parent" && hasAcceptedMatch;

  const startEdit = (r) => {
    setEditingId(r.id);
    setRating(r.rating);
    setComment(r.comment || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setRating(0);
    setComment("");
  };

  const submit = async () => {
    if (rating < 1) {
      toast.error("Cliquez sur les étoiles pour noter");
      return;
    }
    setSubmitting(true);
    try {
      if (editingId) {
        await api.put(`/reviews/${editingId}`, { rating, comment });
        toast.success("Avis modifié");
      } else {
        await api.post("/reviews", { nanny_id: nannyId, rating, comment });
        toast.success("Merci pour votre avis !");
      }
      cancelEdit();
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (r) => {
    if (!window.confirm("Supprimer cet avis ?")) return;
    try {
      await api.delete(`/reviews/${r.id}`);
      toast.success("Avis supprimé");
      load();
    } catch (e) {
      toast.error(formatApiErrorDetail(e?.response?.data?.detail));
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-warm">
      <div className="flex items-center gap-2 mb-3">
        <MessageSquare className="w-5 h-5 text-accent" />
        <h2 className="font-display text-2xl text-gray-900">Avis des familles</h2>
      </div>

      {/* Résumé */}
      <div className="flex items-center gap-4 mb-5 pb-5 border-b border-warm" data-testid="reviews-summary">
        <StarRating value={data.avg_rating} readOnly size={26} testId="reviews-avg-stars" />
        <div>
          <div className="font-display text-2xl text-gray-900">
            {data.avg_rating > 0 ? data.avg_rating.toFixed(1) : "—"}
            <span className="text-sm text-gray-500 font-normal"> / 5</span>
          </div>
          <div className="text-xs text-gray-600">
            {data.review_count} avis{data.review_count > 1 ? "" : ""}
          </div>
        </div>
      </div>

      {/* Formulaire d'avis */}
      {user && canReview && (!myReview || editingId) && (
        <div className="bg-orange-50/60 border border-warm rounded-2xl p-4 mb-5" data-testid="review-form">
          <p className="text-sm font-semibold text-gray-900 mb-2">
            {editingId ? "Modifier votre avis" : "Laissez votre avis"}
          </p>
          <div className="mb-3">
            <StarRating value={rating} onChange={setRating} size={28} testId="review-form-stars" />
          </div>
          <Textarea
            data-testid="review-form-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Partagez votre expérience (optionnel)"
            rows={3}
            className="rounded-xl mb-3"
          />
          <div className="flex gap-2">
            <Button
              data-testid="review-form-submit"
              onClick={submit}
              disabled={submitting}
              className="bg-terracotta hover:bg-[#C55B3A] text-white rounded-full"
              size="sm"
            >
              {submitting ? "Envoi..." : editingId ? "Enregistrer" : "Publier l'avis"}
            </Button>
            {editingId && (
              <Button onClick={cancelEdit} variant="outline" className="rounded-full" size="sm">
                Annuler
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Mon avis si déjà publié et non en édition */}
      {user && myReview && !editingId && (
        <div className="bg-green-50/50 border border-sage/30 rounded-2xl p-4 mb-5" data-testid="my-review">
          <div className="flex items-center justify-between mb-1">
            <div className="text-xs font-bold text-sage uppercase tracking-wider">Votre avis</div>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => startEdit(myReview)} data-testid="my-review-edit" className="h-7 px-2 text-sage">
                <Edit3 className="w-3.5 h-3.5" />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(myReview)} data-testid="my-review-delete" className="h-7 px-2 text-red-600">
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <StarRating value={myReview.rating} readOnly size={18} testId="my-review-stars" />
          {myReview.comment && <p className="text-sm text-gray-700 mt-2">{myReview.comment}</p>}
        </div>
      )}

      {/* Hint si parent sans match accepté */}
      {user?.role === "parent" && !hasAcceptedMatch && !myReview && (
        <div className="text-xs text-gray-500 italic bg-orange-50/40 rounded-xl p-3 mb-5">
          Vous pourrez laisser un avis après une mise en relation acceptée avec cette nounou.
        </div>
      )}

      {/* Liste des avis */}
      {loading ? (
        <div className="text-center py-6 text-gray-500 text-sm">Chargement...</div>
      ) : data.reviews.length === 0 ? (
        <div data-testid="reviews-empty" className="text-sm text-gray-500 italic text-center py-6">
          Aucun avis pour le moment. Soyez la première famille à donner votre avis !
        </div>
      ) : (
        <div className="space-y-4" data-testid="reviews-list">
          {data.reviews.filter((r) => r.parent_id !== user?.id).map((r) => (
            <div key={r.id} data-testid={`review-${r.id}`} className="border-b border-warm pb-4 last:border-0">
              <div className="flex items-center justify-between flex-wrap gap-2 mb-1">
                <span className="font-semibold text-gray-900">{r.parent_name}</span>
                <span className="text-xs text-gray-500">
                  {new Date(r.created_at).toLocaleDateString("fr-FR")}
                </span>
              </div>
              <StarRating value={r.rating} readOnly size={16} testId={`review-${r.id}-stars`} />
              {r.comment && <p className="text-sm text-gray-700 mt-2 leading-relaxed">{r.comment}</p>}
              {user?.role === "admin" && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => remove(r)}
                  data-testid={`review-admin-delete-${r.id}`}
                  className="text-red-600 hover:bg-red-50 mt-2 h-7"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Supprimer (admin)
                </Button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
