import React, { useRef, useState } from "react";
import { Camera, X, Loader2, Image as ImageIcon, Video, Film } from "lucide-react";
import { api, API, formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";

// value: storage path (string) or undefined
// onChange(path: string|null, mediaType: 'image'|'video') called on upload/remove
// allowVideo: accept video files too
// roundedFull: true for circular avatars
export default function MediaUpload({
  value,
  onChange,
  label = "Photo",
  roundedFull = false,
  testId = "media-upload",
  size = "md", // sm | md | lg
  allowVideo = false,
  mediaType: initialMediaType = "image",
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [mediaType, setMediaType] = useState(initialMediaType);

  React.useEffect(() => {
    setMediaType(initialMediaType);
  }, [initialMediaType]);

  const sizes = {
    sm: "w-24 h-24",
    md: "w-32 h-32",
    lg: "w-44 h-44",
  };

  const previewUrl = value
    ? value.startsWith("http")
      ? value
      : `${API}/files/${value}`
    : null;

  const accept = allowVideo
    ? "image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
    : "image/jpeg,image/png,image/webp";

  const handleSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isImage = ["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type);
    const isVideo = ["video/mp4", "video/webm", "video/quicktime"].includes(file.type);
    if (!isImage && !(allowVideo && isVideo)) {
      toast.error(allowVideo ? "Format invalide (image ou vidéo)" : "Format invalide (JPEG, PNG ou WebP)");
      return;
    }
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error(`Fichier trop volumineux (max ${isVideo ? "50" : "5"} Mo)`);
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      const newType = data.media_type || (isVideo ? "video" : "image");
      setMediaType(newType);
      onChange(data.path, newType);
      toast.success(isVideo ? "Vidéo téléversée" : "Photo téléversée");
    } catch (err) {
      toast.error(formatApiErrorDetail(err?.response?.data?.detail) || "Échec du téléversement");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = () => {
    onChange(null, "image");
  };

  return (
    <div className="flex flex-col items-start gap-2">
      {label && <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</span>}
      <div
        className={`relative ${sizes[size]} ${roundedFull ? "rounded-full" : "rounded-2xl"} overflow-hidden border-2 border-dashed border-warm bg-orange-50/40 group`}
      >
        {previewUrl ? (
          <>
            {mediaType === "video" ? (
              <video
                src={previewUrl}
                muted
                loop
                autoPlay
                playsInline
                data-testid={`${testId}-preview`}
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={previewUrl}
                alt="Aperçu"
                data-testid={`${testId}-preview`}
                className="w-full h-full object-cover"
              />
            )}
            {mediaType === "video" && (
              <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                <Film className="w-3 h-3" /> VIDÉO
              </span>
            )}
            <button
              type="button"
              onClick={remove}
              data-testid={`${testId}-remove`}
              className="absolute top-1 right-1 bg-white/90 hover:bg-red-50 rounded-full p-1 shadow"
            >
              <X className="w-4 h-4 text-red-600" />
            </button>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
            {allowVideo ? <Video className="w-7 h-7 mb-1" /> : <ImageIcon className="w-7 h-7 mb-1" />}
            <span className="text-[11px] text-center px-2">Aucun média</span>
          </div>
        )}
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-terracotta animate-spin" />
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        data-testid={`${testId}-btn`}
        disabled={loading}
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-terracotta hover:text-[#C55B3A] transition"
      >
        <Camera className="w-4 h-4" /> {previewUrl ? "Changer" : allowVideo ? "Téléverser image / vidéo" : "Téléverser"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleSelect}
        data-testid={`${testId}-input`}
        className="hidden"
      />
    </div>
  );
}
