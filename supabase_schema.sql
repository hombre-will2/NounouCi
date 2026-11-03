-- ==========================================
-- SCHÉMA BASE DE DONNÉES SUPABASE - NOUNOUCI
-- Copiez et collez ce script dans l'Éditeur SQL de Supabase (SQL Editor)
-- ==========================================

-- 1. Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Table Utilisateurs (users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phone VARCHAR(30) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('nounou', 'parent', 'admin')),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index sur le numéro de téléphone
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);

-- 3. Table Profils Nounous (nanny_profiles)
CREATE TABLE IF NOT EXISTS public.nanny_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    age INT CHECK (age >= 18 AND age <= 80),
    experience_years INT DEFAULT 0,
    quartier VARCHAR(100) NOT NULL,
    city VARCHAR(100) DEFAULT 'Abidjan',
    availability VARCHAR(100) DEFAULT 'Temps plein',
    hourly_rate INT DEFAULT 0,
    bio TEXT DEFAULT '',
    photo_url TEXT,
    languages TEXT[] DEFAULT '{}',
    childcare_types TEXT[] DEFAULT '{}',
    previous_experiences JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_nanny_user UNIQUE (user_id)
);

-- Index sur le quartier et la ville
CREATE INDEX IF NOT EXISTS idx_nanny_quartier ON public.nanny_profiles(quartier);

-- 4. Table Profils Familles / Parents (parent_profiles)
CREATE TABLE IF NOT EXISTS public.parent_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    quartier VARCHAR(100) NOT NULL,
    city VARCHAR(100) DEFAULT 'Abidjan',
    address TEXT DEFAULT '',
    children_count INT DEFAULT 1,
    needs_description TEXT DEFAULT '',
    schedule VARCHAR(100) DEFAULT 'Journée',
    care_type VARCHAR(100) DEFAULT 'Garde régulière',
    budget_max INT DEFAULT 0,
    photo_url TEXT,
    children_photos TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT uk_parent_user UNIQUE (user_id)
);

-- Index sur le quartier des parents
CREATE INDEX IF NOT EXISTS idx_parent_quartier ON public.parent_profiles(quartier);

-- 5. Table Demandes / Mises en relation (matches)
CREATE TABLE IF NOT EXISTS public.matches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nanny_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    initiator_role VARCHAR(20) NOT NULL CHECK (initiator_role IN ('nounou', 'parent')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    message TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Table Publicités (ads)
CREATE TABLE IF NOT EXISTS public.ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(150) NOT NULL,
    image_url TEXT NOT NULL,
    link_url TEXT DEFAULT '',
    placement VARCHAR(50) NOT NULL DEFAULT 'home',
    media_type VARCHAR(20) DEFAULT 'image',
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table Avis & Notes (reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nanny_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT DEFAULT '',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Activer les règles RLS (Row Level Security) pour la sécurité Supabase
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nanny_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Politiques de lecture publique (Lecture libre pour recherche)
CREATE POLICY "Lecture publique des profils nounous" ON public.nanny_profiles FOR SELECT USING (true);
CREATE POLICY "Lecture publique des utilisateurs" ON public.users FOR SELECT USING (true);
CREATE POLICY "Lecture publique des pubs" ON public.ads FOR SELECT USING (true);
CREATE POLICY "Lecture publique des avis" ON public.reviews FOR SELECT USING (true);

-- Politiques d'écriture pour utilisateurs authentifiés
CREATE POLICY "Accès complet utilisateurs" ON public.users FOR ALL USING (true);
CREATE POLICY "Accès complet nanny_profiles" ON public.nanny_profiles FOR ALL USING (true);
CREATE POLICY "Accès complet parent_profiles" ON public.parent_profiles FOR ALL USING (true);
CREATE POLICY "Accès complet matches" ON public.matches FOR ALL USING (true);
CREATE POLICY "Accès complet ads" ON public.ads FOR ALL USING (true);
CREATE POLICY "Accès complet reviews" ON public.reviews FOR ALL USING (true);

-- Insertion de l'utilisateur Administrateur par défaut
INSERT INTO public.users (phone, password_hash, role, first_name, last_name)
VALUES ('0700000000', '$2b$12$eImiTXuWVxfM37uY4JANjO5E/8vGzK7Z701.3O9o0W7i/5O3.8/2G', 'admin', 'Admin', 'NounouCI')
ON CONFLICT (phone) DO NOTHING;
