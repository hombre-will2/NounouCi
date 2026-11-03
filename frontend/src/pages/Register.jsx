import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Users, Heart, Eye, EyeOff } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { formatApiErrorDetail } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import Logo from "../components/Logo";

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [role, setRole] = useState("parent");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = "Prénom requis";
    if (!form.last_name.trim()) errs.last_name = "Nom requis";
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
      const user = await register({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
        role,
      });
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
    <div className="min-h-screen bg-warm-paper flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-warm fade-in">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <Logo size={44} />
        </Link>
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-1.5 text-center">Créer un compte</h1>
        <p className="text-gray-600 text-center mb-6 text-sm">Rejoignez la communauté NounouCI</p>

        {error && (
          <div data-testid="register-error" className="text-sm text-red-600 bg-red-50 border border-red-200 p-3.5 rounded-2xl mb-5">
            {error}
          </div>
        )}

        <div className="mb-6">
          <Label className="text-sm font-semibold mb-2 block text-gray-800">Je suis</Label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              data-testid="register-role-parent"
              onClick={() => setRole("parent")}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                role === "parent"
                  ? "border-terracotta bg-orange-50/80 shadow-sm"
                  : "border-gray-200 bg-white hover:border-terracotta/40"
              }`}
            >
              <Users className="w-6 h-6 text-terracotta mb-2" />
              <div className="font-bold text-gray-900 text-sm">Un particulier</div>
              <div className="text-xs text-gray-500 mt-1">Je cherche une nounou</div>
            </button>
            <button
              type="button"
              data-testid="register-role-nounou"
              onClick={() => setRole("nounou")}
              className={`p-4 rounded-2xl border-2 transition-all text-left ${
                role === "nounou"
                  ? "border-terracotta bg-orange-50/80 shadow-sm"
                  : "border-gray-200 bg-white hover:border-terracotta/40"
              }`}
            >
              <Heart className="w-6 h-6 text-terracotta mb-2" />
              <div className="font-bold text-gray-900 text-sm">Une nounou</div>
              <div className="text-xs text-gray-500 mt-1">Je propose mes services</div>
            </button>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4" autoComplete="off">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="first_name" className="text-sm font-semibold mb-1.5 block text-gray-800">Prénom</Label>
              <Input
                id="first_name"
                data-testid="register-firstname-input"
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                className="h-11 rounded-xl border-gray-200"
                autoComplete="off"
              />
              {fieldErrors.first_name && <p className="text-xs text-red-600 mt-1">{fieldErrors.first_name}</p>}
            </div>
            <div>
              <Label htmlFor="last_name" className="text-sm font-semibold mb-1.5 block text-gray-800">Nom</Label>
              <Input
                id="last_name"
                data-testid="register-lastname-input"
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                className="h-11 rounded-xl border-gray-200"
                autoComplete="off"
              />
              {fieldErrors.last_name && <p className="text-xs text-red-600 mt-1">{fieldErrors.last_name}</p>}
            </div>
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-semibold mb-1.5 block text-gray-800">Téléphone</Label>
            <Input
              id="phone"
              data-testid="register-phone-input"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="h-11 rounded-xl border-gray-200"
              autoComplete="off"
            />
            {fieldErrors.phone && <p className="text-xs text-red-600 mt-1">{fieldErrors.phone}</p>}
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-semibold mb-1.5 block text-gray-800">Email (optionnel)</Label>
            <Input
              id="email"
              type="email"
              data-testid="register-email-input"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="h-11 rounded-xl border-gray-200"
              autoComplete="off"
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-sm font-semibold mb-1.5 block text-gray-800">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                data-testid="register-password-input"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="h-11 rounded-xl border-gray-200 pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
            {fieldErrors.password && <p className="text-xs text-red-600 mt-1">{fieldErrors.password}</p>}
          </div>

          <Button
            type="submit"
            data-testid="register-submit-btn"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-terracotta hover:bg-[#C55B3A] text-white font-semibold text-base mt-2"
          >
            {loading ? "Création..." : "Créer un compte"}
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
