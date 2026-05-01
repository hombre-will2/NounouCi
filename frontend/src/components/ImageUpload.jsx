import React, { useRef, useState } from "react";
import { Camera, X, Loader2, Image as ImageIcon } from "lucide-react";
import { api, API, formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";

// value: storage path (string) or undefined
// onChange(path: string|null) called on upload/remove
// roundedFull: true for circular avatars
export default function ImageUpload({
  value,
  onChange,
  label = "Photo",
  roundedFull = false,
  testId = "image-upload",
  size = "md", // sm | md | lg
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

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

  const handleSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
      toast.error("Format invalide (JPEG, PNG ou WebP)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Fichier trop volumineux (max 5 Mo)");
      return;
    }
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.path);
      toast.success("Photo téléversée");
    } catch (err) {
      toast.error(formatApiErrorDetail(err?.response?.data?.detail) || "Échec du téléversement");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const remove = () => {
    onChange(null);
  };

  return (
    <div className="flex flex-col items-start gap-2">
      {label && <span className="text-xs uppercase tracking-wide text-gray-500 font-semibold">{label}</span>}
      <div
        className={`relative ${sizes[size]} ${roundedFull ? "rounded-full" : "rounded-2xl"} overflow-hidden border-2 border-dashed border-warm bg-orange-50/40 group`}
      >
        {previewUrl ? (
          <>
            <img
              src={previewUrl}
              alt="Aperçu"
              data-testid={`${testId}-preview`}
              className="w-full h-full object-cover"
            />
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
            <ImageIcon className="w-7 h-7 mb-1" />
            <span className="text-[11px] text-center px-2">Aucune photo</span>
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
        <Camera className="w-4 h-4" /> {previewUrl ? "Changer la photo" : "Téléverser"}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSelect}
        data-testid={`${testId}-input`}
        className="hidden"
      />
    </div>
  );
}
