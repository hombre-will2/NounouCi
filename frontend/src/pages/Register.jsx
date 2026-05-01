import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Phone, Lock, User2, Baby, HomeIcon } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { formatApiErrorDetail } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState("parent");
  const [form, setForm] = useState({
    phone: "",
    password: "",
    first_name: "",
    last_name: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (form.first_name.trim().length < 2) errs.first_name = "Prénom requis";
    if (form.last_name.trim().length < 2) errs.last_name = "Nom requis";
    if (!/^\+?\d{8,15}$/.test(form.phone.replace(/[\s-]/g, ""))) errs.phone = "Numéro invalide";
    if (form.password.length < 6) errs.password = "Min. 6 caractères";
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await register({ ...form, role });
      toast.success(`Bienvenue ${user.first_name} !`);
      navigate(role === "nounou" ? "/profile/nanny" : "/profile/parent");
    } catch (e) {
      const msg = formatApiErrorDetail(e?.response?.data?.detail) || e.message;
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-warm-paper flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-warm fade-in">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <div className="w-11 h-11 rounded-xl gradient-terracotta flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" fill="white" />
          </div>
          <span className="font-display text-2xl">Nounou<span className="text-terracotta">CI</span></span>
        </Link>
        <h1 className="font-display text-3xl text-gray-900 mb-2 text-center">Créer un compte</h1>
        <p className="text-gray-600 text-center mb-6">Rejoignez la communauté</p>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <button
            type="button"
            data-testid="register-role-parent"
            onClick={() => setRole("parent")}
            className={`p-4 rounded-2xl border-2 transition-all text-left ${
              role === "parent"
                ? "border-terracotta bg-orange-50 shadow-md"
                : "border-warm bg-white hover:border-terracotta/40"
            }`}
          >
            <HomeIcon className="w-6 h-6 text-terracotta mb-2" />
            <div className="font-bold text-gray-900">Particulier</div>
            <div className="text-xs text-gray-600 mt-1">Je cherche une nounou</div>
          </button>
          <button
            type="button"
            data-testid="register-role-nounou"
            onClick={() => setRole("nounou")}
            className={`p-4 rounded-2xl border-2 transition-all text-left ${
              role === "nounou"
                ? "border-sage bg-green-50 shadow-md"
                : "border-warm bg-white hover:border-sage/40"
            }`}
          >
            <Baby className="w-6 h-6 text-sage mb-2" />
            <div className="font-bold text-gray-900">Nounou</div>
            <div className="text-xs text-gray-600 mt-1">Je propose mes services</div>
          </button>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name" className="text-sm font-semibold mb-1.5 block">Prénom</Label>
              <Input
                id="first_name"
                data-testid="register-firstname-input"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="h-11 rounded-xl"
                placeholder="Aïcha"
              />
              {fieldErrors.first_name && <p className="text-xs text-red-600 mt-1">{fieldErrors.first_name}</p>}
            </div>
            <div>
              <Label htmlFor="last_name" className="text-sm font-semibold mb-1.5 block">Nom</Label>
              <Input
                id="last_name"
                data-testid="register-lastname-input"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="h-11 rounded-xl"
                placeholder="Koffi"
              />
              {fieldErrors.last_name && <p className="text-xs text-red-600 mt-1">{fieldErrors.last_name}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-semibold mb-1.5 block">Numéro de téléphone</Label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="phone"
                data-testid="register-phone-input"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="pl-10 h-11 rounded-xl"
                placeholder="+225 07 00 00 00 00"
              />
            </div>
            {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-semibold mb-1.5 block">Mot de passe</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                data-testid="register-password-input"
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="pl-10 h-11 rounded-xl"
                placeholder="6 caractères min."
              />
            </div>
            {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
          </div>

          {error && (
            <div data-testid="register-error" className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">
              {error}
            </div>
          )}

          <Button
            type="submit"
            data-testid="register-submit-btn"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-terracotta hover:bg-[#C55B3A] text-white font-semibold"
          >
            {loading ? "Création..." : "Créer mon compte"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Déjà un compte ?{" "}
          <Link to="/login" data-testid="register-login-link" className="text-terracotta font-semibold hover:underline">
            Connectez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
