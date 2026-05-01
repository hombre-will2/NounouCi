# Nounou Connect CI - PRD

## Original Problem Statement
Plateforme web dynamique en Côte d'Ivoire qui enregistre et gère les coordonnées des nounous et des particuliers recherchant une nounou. Auth téléphone, données protégées, interface fluide, recherche/filtrage par quartier, notifications de matching.

## Architecture
- **Backend**: FastAPI + MongoDB + JWT auth (cookies httpOnly + Authorization Bearer fallback)
- **Frontend**: React 19 + react-router-dom + Tailwind + Shadcn UI
- **Design**: Palette Terracotta (#D96C4A) + Sage Green (#4A7C59) + Warm Sand (#E6B953), fonts Nunito + Work Sans
- **Auth**: Phone number (+225...) + password (bcrypt) + JWT 7 jours

## User Personas
1. **Particulier (parent)** : famille ivoirienne cherchant une nounou pour ses enfants
2. **Nounou** : femme expérimentée proposant ses services de garde à Abidjan

## Core Requirements (static)
- Inscription/connexion par téléphone + mot de passe
- Profils différenciés nounou (âge, exp, quartier, dispo, tarif, langues, types de garde) et parent (besoins, horaires, budget)
- Recherche/filtrage de nounous par quartier d'Abidjan, expérience, dispo, tarif, type de garde
- Système de mise en relation (demande -> accepté/décliné)
- Téléphone caché tant que la demande n'est pas acceptée
- Notifications in-app pour chaque interaction
- Validation temps réel des champs
- CRUD complet (mise à jour, suppression)

## What's Been Implemented (2026-02)
- ✅ Backend complet (auth, profiles, search, matches, notifications, stats) — 45/45 tests pytest passés
- ✅ Auth téléphone+JWT (httpOnly cookie + Bearer header fallback)
- ✅ Page d'accueil (hero + bento + CTA)
- ✅ Inscription/connexion avec sélecteur de rôle visuel
- ✅ Tableau de bord par rôle avec stats rapides
- ✅ Formulaires d'édition de profil nounou & particulier (validation + suppression)
- ✅ Page de recherche avec 6 filtres simultanés
- ✅ Page de détail nounou avec dialog d'envoi de demande
- ✅ Page mes demandes (accepter/décliner pour nounou)
- ✅ Page notifications (mark read / mark all)
- ✅ Quartiers d'Abidjan : Cocody, Yopougon, Plateau, Marcory, Treichville, Adjamé, Abobo, Koumassi, Port-Bouët, Bingerville, Riviera, Angré, II Plateaux, Attécoubé, Anyama, Songon
- ✅ Langues locales : Français, Dioula, Baoulé, Bété, Anglais, Sénoufo, Agni
- ✅ CORS sécurisé (origin explicite + regex preview)

## P1 Backlog
- Photo upload réel (object storage) au lieu d'URLs proposées
- SMS OTP / vérification téléphone (Twilio)
- Notifications email (Resend)
- Système d'avis/notes après une mise en relation
- Pagination sur /api/nannies (200 max actuellement)
- Brute-force lockout sur /auth/login

## P2 Backlog
- Multilingue (i18n FR + Dioula/Baoulé)
- Chat in-app entre parent et nounou après accepted
- Carte Google Maps des nounous par quartier
- Paiement intégré (Wave / Orange Money / MoonPay)
- Application mobile

## Next Tasks
1. Photo upload avec object storage (intégration)
2. Vérification téléphone par SMS OTP
3. Système d'avis/notes
