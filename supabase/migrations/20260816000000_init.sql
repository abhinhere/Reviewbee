-- Supabase Database Schema for ReviewBee

-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    logo_url TEXT,
    primary_color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Profiles (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('super_admin', 'owner', 'manager', 'staff')),
    full_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Branches
CREATE TABLE IF NOT EXISTS public.branches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    google_place_id TEXT,
    google_review_url TEXT NOT NULL,
    primary_color TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(organization_id, slug)
);

-- 4. Settings (AI settings and localized language defaults)
CREATE TABLE IF NOT EXISTS public.settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    ai_writing_tone TEXT NOT NULL DEFAULT 'friendly' CHECK (ai_writing_tone IN ('friendly', 'professional', 'luxury', 'simple')),
    ai_review_length TEXT NOT NULL DEFAULT 'medium' CHECK (ai_review_length IN ('short', 'medium', 'long')),
    enabled_languages TEXT[] NOT NULL DEFAULT ARRAY['en'],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Question Sets
CREATE TABLE IF NOT EXISTS public.question_sets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('restaurant', 'salon', 'retail', 'clinic', 'hotel', 'gym', 'education', 'custom')),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Review Questions
CREATE TABLE IF NOT EXISTS public.review_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_set_id UUID NOT NULL REFERENCES public.question_sets(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    question_text JSONB NOT NULL, -- Format: {"en": "...", "ml": "...", "hi": "...", "ar": "..."}
    question_type TEXT NOT NULL CHECK (question_type IN ('star_rating', 'single_choice', 'multiple_choice', 'text_input', 'emoji_selection')),
    options JSONB, -- List of options with translations if applicable
    is_required BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Review Sessions (captures active customer interactions in the wizard)
CREATE TABLE IF NOT EXISTS public.review_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    language TEXT NOT NULL DEFAULT 'en',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    answers JSONB DEFAULT '{}'::jsonb, -- Format: { question_id: answer_value }
    device_info JSONB DEFAULT '{}'::jsonb,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Generated Reviews
CREATE TABLE IF NOT EXISTS public.generated_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_session_id UUID REFERENCES public.review_sessions(id) ON DELETE SET NULL,
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    original_text TEXT NOT NULL,
    edited_text TEXT NOT NULL,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    language TEXT NOT NULL DEFAULT 'en',
    is_copied BOOLEAN NOT NULL DEFAULT false,
    is_redirected BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. Analytics
CREATE TABLE IF NOT EXISTS public.analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN ('qr_scan', 'session_start', 'review_generated', 'visit_google_review', 'copy_review')),
    device_type TEXT NOT NULL DEFAULT 'mobile',
    browser TEXT,
    language TEXT DEFAULT 'en',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    plan_name TEXT NOT NULL DEFAULT 'free' CHECK (plan_name IN ('free', 'starter', 'professional', 'enterprise')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'unpaid', 'past_due')),
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now() + interval '30 days') NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. Audit Logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create automatic profiles handler on Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
    new_org_id UUID;
    org_slug TEXT;
BEGIN
    -- Only create organization for owners/admins, not general customers
    -- Create standard organization slug from name or user email username
    org_slug := 'org-' || substring(md5(random()::text) from 1 for 8);
    
    INSERT INTO public.organizations (name, slug)
    VALUES (COALESCE(new.raw_user_meta_data->>'organization_name', 'My Business'), org_slug)
    RETURNING id INTO new_org_id;

    INSERT INTO public.profiles (id, organization_id, role, full_name)
    VALUES (
        new.id,
        new_org_id,
        COALESCE(new.raw_user_meta_data->>'role', 'owner'),
        COALESCE(new.raw_user_meta_data->>'full_name', 'Business Owner')
    );

    -- Create default setting
    INSERT INTO public.settings (organization_id, enabled_languages)
    VALUES (new_org_id, ARRAY['en', 'ml', 'hi', 'ar']);

    -- Create default subscription
    INSERT INTO public.subscriptions (organization_id, plan_name, status)
    VALUES (new_org_id, 'free', 'active');

    -- Create a default branch
    INSERT INTO public.branches (organization_id, name, slug, google_review_url, google_place_id)
    VALUES (
        new_org_id, 
        'Main Branch', 
        'main', 
        'https://search.google.com/local/writereview?placeid=ChIJN1t_tDeuEmsRUsoyG83tdY4', 
        'ChIJN1t_tDeuEmsRUsoyG83tdY4'
    );

    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for auth.users creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for updated_at fields
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = now();
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON public.organizations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_branches_updated_at BEFORE UPDATE ON public.branches FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON public.settings FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_question_sets_updated_at BEFORE UPDATE ON public.question_sets FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_review_questions_updated_at BEFORE UPDATE ON public.review_questions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles: owners can select/update their profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Organizations: users can view/update their own organization
CREATE POLICY "Users can view own organization" ON public.organizations FOR SELECT 
USING (id IN (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()));
CREATE POLICY "Users can update own organization" ON public.organizations FOR UPDATE 
USING (id IN (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()));

-- Branches: users can view/modify branches under their organization, public can view
CREATE POLICY "Public can view branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Owners can modify branches" ON public.branches FOR ALL 
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()));

-- Settings: public can view settings (needed for language list), owners can modify
CREATE POLICY "Public can view settings" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Owners can modify settings" ON public.settings FOR ALL 
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()));

-- Question Sets and Questions: public can view, owners can modify
CREATE POLICY "Public can view question sets" ON public.question_sets FOR SELECT USING (true);
CREATE POLICY "Owners can modify question sets" ON public.question_sets FOR ALL 
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()));

CREATE POLICY "Public can view questions" ON public.review_questions FOR SELECT USING (true);
CREATE POLICY "Owners can modify questions" ON public.review_questions FOR ALL 
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()));

-- Sessions: public can insert and update their session
CREATE POLICY "Public can create/update sessions" ON public.review_sessions FOR ALL USING (true);

-- Generated Reviews: public can insert and update their review drafts
CREATE POLICY "Public can create/update generated reviews" ON public.generated_reviews FOR ALL USING (true);

-- Analytics: public can insert, owners can read
CREATE POLICY "Public can insert analytics" ON public.analytics FOR INSERT WITH CHECK (true);
CREATE POLICY "Owners can view analytics" ON public.analytics FOR SELECT 
USING (branch_id IN (
    SELECT b.id FROM public.branches b 
    JOIN public.profiles p ON b.organization_id = p.organization_id 
    WHERE p.id = auth.uid()
));

-- Subscriptions: owners can read their subscriptions
CREATE POLICY "Owners can view subscriptions" ON public.subscriptions FOR SELECT 
USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE profiles.id = auth.uid()));
