import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Phone, Lock } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { formatApiErrorDetail } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { toast } from "sonner";
import Logo from "../components/Logo";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const u = await login(phone, password);
      toast.success("Connexion réussie");
      if (u.role === "admin") navigate("/admin/ads");
      else navigate("/dashboard");
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
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 sm:p-10 border border-warm fade-in">
        <Link to="/" className="flex items-center gap-2 justify-center mb-6">
          <Logo size={44} />
        </Link>
        <h1 className="font-display text-3xl text-gray-900 mb-2 text-center">Bon retour !</h1>
        <p className="text-gray-600 text-center mb-8">Connectez-vous à votre compte</p>

        <form onSubmit={submit} className="space-y-5">
          <div>
            <Label htmlFor="phone" className="text-sm font-semibold mb-1.5 block">Numéro de téléphone</Label>
            <div className="relative">
              <Phone className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="phone"
                data-testid="login-phone-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+225 07 00 00 00 00"
                className="pl-10 h-12 rounded-xl"
                required
              />
            </div>
          </div>
          <div>
            <Label htmlFor="password" className="text-sm font-semibold mb-1.5 block">Mot de passe</Label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                data-testid="login-password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="pl-10 h-12 rounded-xl"
                required
              />
            </div>
          </div>

          {error && (
            <div data-testid="login-error" className="text-sm text-red-600 bg-red-50 p-3 rounded-xl">
              {error}
            </div>
          )}

          <Button
            type="submit"
            data-testid="login-submit-btn"
            disabled={loading}
            className="w-full h-12 rounded-xl bg-terracotta hover:bg-[#C55B3A] text-white font-semibold"
          >
            {loading ? "Connexion..." : "Se connecter"}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Pas encore de compte ?{" "}
          <Link to="/register" data-testid="login-register-link" className="text-terracotta font-semibold hover:underline">
            Inscrivez-vous
          </Link>
        </p>
      </div>
    </div>
  );
}
