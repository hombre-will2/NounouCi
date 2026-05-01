import React, { useEffect, useState } from "react";
import { api, API } from "../lib/api";
import { X } from "lucide-react";

// Affiche les pubs actives pour un placement donné. Banner sur landing, modal pour pre_contact.
export default function AdSlot({ placement = "home", variant = "banner", onClose }) {
  const [ads, setAds] = useState([]);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    api.get("/ads/active", { params: { placement } })
      .then(({ data }) => setAds(data.ads || []))
      .catch(() => setAds([]));
  }, [placement]);

  if (dismissed || !ads.length) return null;
  const ad = ads[0];
  const src = ad.image_url?.startsWith("http") ? ad.image_url : `${API}/files/${ad.image_url}`;
  const handleClose = () => {
    setDismissed(true);
    if (onClose) onClose();
  };

  if (variant === "banner") {
    return (
      <a
        href={ad.link_url || "#"}
        target={ad.link_url ? "_blank" : "_self"}
        rel="noopener noreferrer"
        data-testid={`ad-${placement}`}
        className="block relative rounded-3xl overflow-hidden border border-warm shadow-sm group"
      >
        <div className="relative bg-orange-50">
          <img src={src} alt={ad.title} className="w-full h-44 sm:h-56 object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent" />
          <div className="absolute bottom-0 left-0 p-5 sm:p-7">
            <span className="inline-block bg-accent text-gray-900 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2">Sponsorisé</span>
            <h3 className="font-display text-2xl sm:text-3xl text-white max-w-xl">{ad.title}</h3>
          </div>
        </div>
      </a>
    );
  }

  // pre_contact variant: full card inside a modal context
  return (
    <div
      data-testid={`ad-${placement}`}
      className="relative rounded-2xl overflow-hidden border border-warm bg-orange-50/40 mb-4"
    >
      <a
        href={ad.link_url || "#"}
        target={ad.link_url ? "_blank" : "_self"}
        rel="noopener noreferrer"
        className="block"
      >
        <img src={src} alt={ad.title} className="w-full h-32 object-cover" />
        <div className="p-3">
          <span className="inline-block bg-accent text-gray-900 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1">Sponsorisé</span>
          <p className="text-sm font-semibold text-gray-900">{ad.title}</p>
        </div>
      </a>
      <button
        type="button"
        onClick={handleClose}
        data-testid={`ad-close-${placement}`}
        className="absolute top-2 right-2 bg-white/90 rounded-full p-1 shadow hover:bg-white"
      >
        <X className="w-3.5 h-3.5 text-gray-700" />
      </button>
    </div>
  );
}
