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
- ✅ Backend complet — **113/113 tests pytest passés (100 %)**
- ✅ Auth téléphone+JWT (httpOnly cookie + Bearer header fallback)
- ✅ **Logo customisé** (image bébé sur fond terracotta) sur tout le site
- ✅ Page d'accueil avec mention "Toute la Côte d'Ivoire · Ouvert à toutes les religions"
- ✅ Landing intelligente : redirection auto vers `/dashboard` (ou `/admin/ads` pour admin) si connecté
- ✅ Inscription/connexion par téléphone, sélecteur de rôle visuel
- ✅ Tableau de bord par rôle avec stats rapides + photo
- ✅ Upload de photos via Object Storage Emergent (POST /api/upload, GET /api/files/{path})
- ✅ Profil nounou : photo personnelle obligatoire
- ✅ Profil particulier : photo perso + 1 à 5 photos d'enfants
- ✅ **39 villes de Côte d'Ivoire** ; quartier obligatoire pour Abidjan, libre/optionnel ailleurs
- ✅ Recherche nounous + recherche familles (réservée nounous), filtres multiples
- ✅ Matching bidirectionnel parent ↔ nounou avec notifications croisées
- ✅ Téléphone visible uniquement après acceptation mutuelle
- ✅ **Tarif mensuel (FCFA/mois)** au lieu d'horaire (Côte d'Ivoire)
- ✅ **Système de publicités** : 2 placements (`home` bannière + `pre_contact` modale)
- ✅ **Panneau Admin** (`/admin/ads`) : CRUD complet sur les pubs (création, modification, activer/désactiver, supprimer) avec upload d'image
- ✅ Compte admin seedé au démarrage : **+2250100000000 / Admin1234**
- ✅ 12 langues locales (Français, Dioula, Baoulé, Bété, Anglais, Sénoufo, Agni, Attié, Guéré, Yacouba, Mahou, Lobi)
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
