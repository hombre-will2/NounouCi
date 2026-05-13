import React, { useEffect, useState, useRef } from "react";
import { api, API } from "../lib/api";
import { X, Volume2, VolumeX } from "lucide-react";

// Affiche les pubs actives pour un placement donné. Banner sur landing, modal pour pre_contact.
export default function AdSlot({ placement = "home", variant = "banner", onClose }) {
  const [ads, setAds] = useState([]);
  const [dismissed, setDismissed] = useState(false);
  const [muted, setMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    api.get("/ads/active", { params: { placement } })
      .then(({ data }) => setAds(data.ads || []))
      .catch(() => setAds([]));
  }, [placement]);

  if (dismissed || !ads.length) return null;
  const ad = ads[0];
  const src = ad.image_url?.startsWith("http") ? ad.image_url : `${API}/files/${ad.image_url}`;
  const isVideo = ad.media_type === "video";

  const handleClose = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    setDismissed(true);
    if (onClose) onClose();
  };

  const toggleSound = (e) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setMuted(videoRef.current.muted);
      if (!videoRef.current.muted) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  const Media = ({ className }) => (
    isVideo ? (
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted={muted}
        playsInline
        controls={false}
        data-testid={`ad-video-${placement}`}
        className={className}
      />
    ) : (
      <img src={src} alt={ad.title} className={className} />
    )
  );

  if (variant === "banner") {
    return (
      <div data-testid={`ad-${placement}`} className="block relative rounded-3xl overflow-hidden border border-warm shadow-sm group">
        <a
          href={ad.link_url || "#"}
          target={ad.link_url ? "_blank" : "_self"}
          rel="noopener noreferrer"
          className="block"
        >
          <div className="relative bg-orange-50">
            <Media className="w-full h-60 sm:h-80 object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/15 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 p-5 sm:p-8 pointer-events-none">
              <span className="inline-block bg-accent text-gray-900 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md mb-2">Sponsorisé</span>
              <h3 className="font-display text-2xl sm:text-4xl text-white max-w-xl">{ad.title}</h3>
            </div>
          </div>
        </a>
        {isVideo && (
          <button
            type="button"
            onClick={toggleSound}
            data-testid={`ad-sound-${placement}`}
            className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 shadow z-10"
            aria-label={muted ? "Activer le son" : "Couper le son"}
          >
            {muted ? <VolumeX className="w-4 h-4 text-gray-700" /> : <Volume2 className="w-4 h-4 text-terracotta" />}
          </button>
        )}
      </div>
    );
  }

  // pre_contact variant: large card inside a modal context
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
        <Media className="w-full h-44 sm:h-52 object-cover" />
        <div className="p-3">
          <span className="inline-block bg-accent text-gray-900 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mb-1">Sponsorisé</span>
          <p className="text-sm font-semibold text-gray-900">{ad.title}</p>
        </div>
      </a>
      <div className="absolute top-2 right-2 flex gap-1.5">
        {isVideo && (
          <button
            type="button"
            onClick={toggleSound}
            data-testid={`ad-sound-${placement}`}
            className="bg-white/90 hover:bg-white rounded-full p-1.5 shadow"
            aria-label={muted ? "Activer le son" : "Couper le son"}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-gray-700" /> : <Volume2 className="w-3.5 h-3.5 text-terracotta" />}
          </button>
        )}
        <button
          type="button"
          onClick={handleClose}
          data-testid={`ad-close-${placement}`}
          className="bg-white/90 rounded-full p-1.5 shadow hover:bg-white"
        >
          <X className="w-3.5 h-3.5 text-gray-700" />
        </button>
      </div>
    </div>
  );
}
