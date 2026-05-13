import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bell, LogOut, User2, Menu, X, ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../lib/api";
import { Button } from "./ui/button";
import Logo from "./Logo";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    if (!user) {
      setUnread(0);
      return;
    }
    const load = async () => {
      try {
        const { data } = await api.get("/notifications");
        if (active) setUnread(data.unread || 0);
      } catch (e) {
        /* ignore */
      }
    };
    load();
    const t = setInterval(load, 25000);
    return () => {
      active = false;
      clearInterval(t);
    };
  }, [user, location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const NavLink = ({ to, children, testId }) => (
    <Link
      to={to}
      data-testid={testId}
      onClick={() => setOpen(false)}
      className="text-sm font-medium text-gray-700 hover:text-terracotta transition-colors px-3 py-2 rounded-lg hover:bg-orange-50"
    >
      {children}
    </Link>
  );

  return (
    <nav className="glass-nav sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" data-testid="navbar-logo" className="flex items-center gap-2 group">
            <Logo size={36} />
          </Link>

          <div className="hidden md:flex items-center gap-1">
            <NavLink to="/" testId="nav-home">Accueil</NavLink>
            {(!user || user.role === "parent") && (
              <NavLink to="/search" testId="nav-search">Trouver une nounou</NavLink>
            )}
            {user?.role === "nounou" && (
              <NavLink to="/familles" testId="nav-parents">Familles à la recherche</NavLink>
            )}
            {user?.role === "admin" && (
              <>
                <NavLink to="/admin/ads" testId="nav-admin">Admin · Pubs</NavLink>
                <NavLink to="/admin/users" testId="nav-admin-users">Admin · Utilisateurs</NavLink>
              </>
            )}
            {user && (
              <>
                <NavLink to="/dashboard" testId="nav-dashboard">Tableau de bord</NavLink>
                <NavLink to="/matches" testId="nav-matches">Mes demandes</NavLink>
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            {user ? (
              <>
                <Link
                  to="/notifications"
                  data-testid="nav-notifications"
                  className="relative p-2 rounded-full hover:bg-orange-50 text-gray-700"
                >
                  <Bell className="w-5 h-5" />
                  {unread > 0 && (
                    <span
                      data-testid="nav-notif-badge"
                      className="absolute -top-0.5 -right-0.5 bg-terracotta text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1"
                    >
                      {unread}
                    </span>
                  )}
                </Link>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50">
                  {user.role === "admin" ? (
                    <ShieldCheck className="w-4 h-4 text-terracotta" />
                  ) : (
                    <User2 className="w-4 h-4 text-terracotta" />
                  )}
                  <span className="text-sm font-medium text-gray-800">
                    {user.first_name}
                  </span>
                </div>
                <Button
                  data-testid="nav-logout"
                  onClick={handleLogout}
                  variant="ghost"
                  size="sm"
                  className="text-gray-700 hover:text-terracotta"
                >
                  <LogOut className="w-4 h-4 mr-1" /> Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" data-testid="nav-login">
                  <Button variant="ghost" className="text-gray-800">Connexion</Button>
                </Link>
                <Link to="/register" data-testid="nav-register">
                  <Button className="bg-terracotta hover:bg-[#C55B3A] text-white rounded-full px-5">
                    S'inscrire
                  </Button>
                </Link>
              </>
            )}
          </div>

          <button
            onClick={() => setOpen((v) => !v)}
            data-testid="nav-mobile-toggle"
            className="md:hidden p-2"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <div className="md:hidden pb-4 flex flex-col gap-1 border-t pt-3">
            <NavLink to="/" testId="nav-home-m">Accueil</NavLink>
            {(!user || user.role === "parent") && (
              <NavLink to="/search" testId="nav-search-m">Trouver une nounou</NavLink>
            )}
            {user?.role === "nounou" && (
              <NavLink to="/familles" testId="nav-parents-m">Familles à la recherche</NavLink>
            )}
            {user ? (
              <>
                <NavLink to="/dashboard" testId="nav-dashboard-m">Tableau de bord</NavLink>
                <NavLink to="/matches" testId="nav-matches-m">Mes demandes</NavLink>
                <NavLink to="/notifications" testId="nav-notifications-m">Notifications ({unread})</NavLink>
                <Button onClick={handleLogout} variant="ghost" data-testid="nav-logout-m" className="justify-start">
                  <LogOut className="w-4 h-4 mr-2" /> Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/login" data-testid="nav-login-m"><Button variant="ghost" className="w-full justify-start">Connexion</Button></Link>
                <Link to="/register" data-testid="nav-register-m"><Button className="w-full bg-terracotta hover:bg-[#C55B3A] text-white">S'inscrire</Button></Link>
              </>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
