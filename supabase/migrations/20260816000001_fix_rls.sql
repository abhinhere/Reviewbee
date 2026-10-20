-- Fix Row Level Security (RLS) policies for user self-provisioning and inserts

-- 1. Organizations: Allow authenticated users to insert an organization
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizations' AND policyname = 'Authenticated users can create organizations'
    ) THEN
        CREATE POLICY "Authenticated users can create organizations" 
        ON public.organizations FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
    END IF;
END $$;

-- 2. Profiles: Allow authenticated users to insert their own profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Users can insert own profile'
    ) THEN
        CREATE POLICY "Users can insert own profile" 
        ON public.profiles FOR INSERT 
        TO authenticated 
        WITH CHECK (auth.uid() = id);
    END IF;
END $$;

-- 3. Settings: Allow authenticated users to insert settings for their organization
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'settings' AND policyname = 'Authenticated users can insert settings'
    ) THEN
        CREATE POLICY "Authenticated users can insert settings" 
        ON public.settings FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
    END IF;
END $$;

-- 4. Subscriptions: Allow authenticated users to insert initial subscription
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'subscriptions' AND policyname = 'Authenticated users can insert subscriptions'
    ) THEN
        CREATE POLICY "Authenticated users can insert subscriptions" 
        ON public.subscriptions FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
    END IF;
END $$;

-- 5. Branches: Allow authenticated owners to insert branches
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'branches' AND policyname = 'Authenticated users can insert branches'
    ) THEN
        CREATE POLICY "Authenticated users can insert branches" 
        ON public.branches FOR INSERT 
        TO authenticated 
        WITH CHECK (true);
    END IF;
END $$;
