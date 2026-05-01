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
- ✅ Backend complet (auth, profiles, search, matches, notifications, stats) — 78/78 tests pytest passés
- ✅ Auth téléphone+JWT (httpOnly cookie + Bearer header fallback)
- ✅ Page d'accueil (hero + bento + CTA) avec mention "Toute la Côte d'Ivoire · Ouvert à toutes les religions"
- ✅ **Landing intelligente** : redirection auto vers /dashboard si connecté
- ✅ Inscription/connexion avec sélecteur de rôle visuel
- ✅ Tableau de bord par rôle avec stats rapides + photo de profil
- ✅ **Upload de photos via Object Storage Emergent** (POST /api/upload, GET /api/files/{path})
- ✅ Profil nounou : photo personnelle obligatoire (téléversement réel)
- ✅ Profil particulier : photo personnelle + 1 à 5 photos d'enfants à garder (toutes obligatoires)
- ✅ **Couverture nationale** : 39 villes de Côte d'Ivoire (Abidjan, Bouaké, Yamoussoukro, Daloa, San-Pédro, Korhogo, etc.) ; quartier obligatoire pour Abidjan, libre/optionnel ailleurs
- ✅ Page de recherche nounous avec 7 filtres (ville, quartier, dispo, type, exp, tarif, recherche)
- ✅ **Page "Familles à la recherche" pour nounous** avec filtres (ville, quartier, type, horaires, budget)
- ✅ **Matching bidirectionnel** : parent → nounou OU nounou → parent
- ✅ Téléphone visible uniquement après acceptation mutuelle (côté parent ET côté nounou)
- ✅ Page mes demandes avec photos + libellé direction (initié par moi / reçu)
- ✅ Notifications croisées (création + accept/decline)
- ✅ Langues locales : Français, Dioula, Baoulé, Bété, Anglais, Sénoufo, Agni, Attié, Guéré, Yacouba, Mahou, Lobi
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
