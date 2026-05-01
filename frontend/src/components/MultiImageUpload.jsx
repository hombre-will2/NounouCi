import React, { useRef, useState } from "react";
import { Camera, X, Loader2, Plus } from "lucide-react";
import { api, API, formatApiErrorDetail } from "../lib/api";
import { toast } from "sonner";

// value: array of storage paths
// onChange(newArray): called on add/remove
export default function MultiImageUpload({
  value = [],
  onChange,
  label = "Photos",
  max = 5,
  testId = "multi-upload",
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    if (value.length + files.length > max) {
      toast.error(`Maximum ${max} photos`);
      return;
    }
    setLoading(true);
    try {
      const newPaths = [];
      for (const file of files) {
        if (!["image/jpeg", "image/png", "image/webp", "image/jpg"].includes(file.type)) {
          toast.error(`Format invalide pour ${file.name}`);
          continue;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} trop volumineux`);
          continue;
        }
        const formData = new FormData();
        formData.append("file", file);
        const { data } = await api.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        newPaths.push(data.path);
      }
      if (newPaths.length) {
        onChange([...value, ...newPaths]);
        toast.success(`${newPaths.length} photo(s) ajoutée(s)`);
      }
    } catch (err) {
      toast.error(formatApiErrorDetail(err?.response?.data?.detail) || "Échec du téléversement");
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const removeAt = (idx) => {
    onChange(value.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold">{label}</span>
          <span className="text-xs text-gray-500">{value.length}/{max}</span>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {value.map((path, i) => (
          <div key={path + i} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-warm">
            <img
              src={path.startsWith("http") ? path : `${API}/files/${path}`}
              alt={`photo ${i + 1}`}
              className="w-full h-full object-cover"
              data-testid={`${testId}-img-${i}`}
            />
            <button
              type="button"
              onClick={() => removeAt(i)}
              data-testid={`${testId}-remove-${i}`}
              className="absolute top-1 right-1 bg-white/90 hover:bg-red-50 rounded-full p-1 shadow"
            >
              <X className="w-3.5 h-3.5 text-red-600" />
            </button>
          </div>
        ))}

        {value.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            data-testid={`${testId}-add`}
            disabled={loading}
            className="w-24 h-24 rounded-2xl border-2 border-dashed border-warm bg-orange-50/40 hover:border-terracotta hover:bg-orange-50 flex flex-col items-center justify-center text-gray-500"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-terracotta" />
            ) : (
              <>
                <Plus className="w-6 h-6 mb-1 text-terracotta" />
                <span className="text-[11px]">Ajouter</span>
              </>
            )}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        onChange={handleSelect}
        className="hidden"
        data-testid={`${testId}-input`}
      />
    </div>
  );
}
