import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, Search, Shield, Star, MapPin, Users, CheckCircle2, ArrowRight } from "lucide-react";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { api } from "../lib/api";

export default function Landing() {
  const [stats, setStats] = useState({ nannies: 0, parents: 0, matches: 0 });

  useEffect(() => {
    api.get("/stats").then(({ data }) => setStats(data)).catch(() => {});
  }, []);

  return (
    <div className="bg-warm-paper min-h-screen">
      <Navbar />

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 pt-12 pb-20 fade-in">
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-7">
            <div className="inline-flex items-center gap-2 bg-orange-50 text-terracotta px-4 py-1.5 rounded-full text-sm font-semibold mb-6 border border-orange-100">
              <MapPin className="w-4 h-4" /> Côte d'Ivoire · Abidjan
            </div>
            <h1
              data-testid="landing-hero-title"
              className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[1.05] text-gray-900 mb-6"
            >
              La <span className="text-terracotta">nounou de confiance</span>
              <br />pour vos enfants, près de chez vous.
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mb-8 leading-relaxed">
              Plateforme ivoirienne qui met en relation familles et nounous expérimentées.
              Inscrivez-vous gratuitement, trouvez la perle rare dans votre quartier.
            </p>

            <div className="flex flex-wrap gap-3 mb-10">
              <Link to="/search" data-testid="hero-cta-search">
                <Button size="lg" className="bg-terracotta hover:bg-[#C55B3A] text-white rounded-full px-8 h-14 text-base font-semibold">
                  <Search className="w-5 h-5 mr-2" /> Trouver une nounou
                </Button>
              </Link>
              <Link to="/register" data-testid="hero-cta-register">
                <Button size="lg" variant="outline" className="rounded-full px-8 h-14 text-base font-semibold border-2 border-sage text-sage hover:bg-sage hover:text-white">
                  Je suis nounou <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              {[
                ["Profils vérifiés", Shield],
                ["Avis & expériences", Star],
                ["Quartiers d'Abidjan", MapPin],
              ].map(([label, Icon]) => (
                <div key={label} className="flex items-center gap-2 text-sm text-gray-700">
                  <Icon className="w-4 h-4 text-sage" /> {label}
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-3xl overflow-hidden border-4 border-white shadow-2xl shadow-orange-100">
              <img
                src="https://images.unsplash.com/photo-1666888735928-68814027acbb?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHwxfHxibGFjayUyMHdvbWFuJTIwbmFubnklMjBwbGF5aW5nJTIwd2l0aCUyMGNoaWxkfGVufDB8fHx8MTc3NzY2NTgzNXww&ixlib=rb-4.1.0&q=85"
                alt="Nounou avec un enfant"
                className="w-full h-[480px] object-cover"
              />
            </div>
            <div className="absolute -bottom-5 -left-5 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-sage/15 flex items-center justify-center">
                  <Users className="w-6 h-6 text-sage" />
                </div>
                <div>
                  <div className="font-display text-2xl text-gray-900" data-testid="hero-stat-nannies">{stats.nannies || 0}+</div>
                  <div className="text-xs text-gray-500">Nounous inscrites</div>
                </div>
              </div>
            </div>
            <div className="absolute -top-5 -right-5 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-terracotta" />
                </div>
                <div>
                  <div className="font-display text-2xl text-gray-900" data-testid="hero-stat-matches">{stats.matches || 0}</div>
                  <div className="text-xs text-gray-500">Mises en relation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="text-center mb-14">
          <div className="text-sm font-bold text-sage uppercase tracking-widest mb-3">Comment ça marche</div>
          <h2 className="font-display text-3xl sm:text-4xl text-gray-900">Simple. Sécurisé. Local.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { n: "01", t: "Créez votre compte", d: "Inscription rapide avec votre numéro de téléphone. Choisissez votre profil : nounou ou particulier." },
            { n: "02", t: "Complétez votre profil", d: "Renseignez votre quartier, vos disponibilités, votre expérience ou vos besoins spécifiques." },
            { n: "03", t: "Mise en relation", d: "Recherchez, filtrez par quartier d'Abidjan et envoyez une demande. Soyez notifié dès qu'on vous répond." },
          ].map((s, i) => (
            <div
              key={s.n}
              data-testid={`process-card-${i}`}
              className="bg-white rounded-3xl p-8 border border-warm card-hover"
            >
              <div className="font-display text-5xl text-terracotta/20 mb-3">{s.n}</div>
              <h3 className="font-display text-xl text-gray-900 mb-2">{s.t}</h3>
              <p className="text-gray-600 leading-relaxed">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features bento */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-16">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 bg-sage text-white rounded-3xl p-10 relative overflow-hidden">
            <h3 className="font-display text-3xl mb-4 max-w-md">Recherche par quartier d'Abidjan</h3>
            <p className="opacity-90 mb-6 max-w-md">Cocody, Yopougon, Marcory, Plateau, Treichville… Trouvez quelqu'un proche de chez vous pour faciliter le quotidien.</p>
            <Link to="/search" data-testid="feature-search-link">
              <Button className="bg-white text-sage hover:bg-orange-50 rounded-full">Lancer une recherche</Button>
            </Link>
            <MapPin className="absolute -right-6 -bottom-6 w-48 h-48 text-white/10" />
          </div>
          <div className="bg-accent rounded-3xl p-10 text-gray-900">
            <Shield className="w-10 h-10 mb-3" />
            <h3 className="font-display text-2xl mb-2">Données protégées</h3>
            <p>Mots de passe chiffrés, numéros visibles uniquement après acceptation mutuelle.</p>
          </div>
          <div className="bg-white rounded-3xl p-10 border border-warm">
            <Star className="w-10 h-10 text-terracotta mb-3" />
            <h3 className="font-display text-2xl mb-2 text-gray-900">Profils détaillés</h3>
            <p className="text-gray-600">Expérience, langues parlées, type de garde, tarif horaire en FCFA.</p>
          </div>
          <div className="md:col-span-2 bg-white rounded-3xl p-10 border border-warm flex flex-col md:flex-row items-center gap-6">
            <img
              src="https://images.unsplash.com/photo-1577897113176-6888367369bf?crop=entropy&cs=srgb&fm=jpg&ixid=M3w3NDQ2Mzl8MHwxfHNlYXJjaHwyfHxhZnJpY2FuJTIwZmFtaWx5JTIwc21pbGluZ3xlbnwwfHx8fDE3Nzc2NjU4MzR8MA&ixlib=rb-4.1.0&q=85"
              alt="Famille"
              className="w-full md:w-56 h-48 object-cover rounded-2xl"
            />
            <div>
              <h3 className="font-display text-2xl mb-2 text-gray-900">Pour les familles ivoiriennes</h3>
              <p className="text-gray-600 mb-4">Publiez vos besoins (horaires, type de garde, budget) et recevez des candidatures pertinentes près de chez vous.</p>
              <Link to="/register" data-testid="feature-family-cta">
                <Button className="bg-terracotta hover:bg-[#C55B3A] text-white rounded-full">Créer un compte famille</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-7xl mx-auto px-5 sm:px-8 py-20">
        <div className="rounded-3xl gradient-terracotta p-10 sm:p-16 text-white text-center relative overflow-hidden">
          <h2 className="font-display text-3xl sm:text-5xl mb-4 relative z-10">Rejoignez la communauté NounouCI</h2>
          <p className="text-lg opacity-95 max-w-2xl mx-auto mb-8 relative z-10">
            Inscrivez-vous gratuitement et faites partie de la première plateforme dédiée à la garde d'enfants en Côte d'Ivoire.
          </p>
          <div className="flex flex-wrap justify-center gap-3 relative z-10">
            <Link to="/register" data-testid="cta-register-final">
              <Button size="lg" className="bg-white text-terracotta hover:bg-orange-50 rounded-full px-8 h-14 font-semibold">S'inscrire gratuitement</Button>
            </Link>
            <Link to="/search" data-testid="cta-search-final">
              <Button size="lg" variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-terracotta rounded-full px-8 h-14 font-semibold bg-transparent">
                Explorer les profils
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-warm mt-10 py-8 text-center text-sm text-gray-500">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-terracotta" fill="currentColor" />
          <span className="font-display font-bold text-gray-700">NounouCI</span>
        </div>
        <p>Plateforme de mise en relation nounous & familles · Côte d'Ivoire</p>
      </footer>
    </div>
  );
}
