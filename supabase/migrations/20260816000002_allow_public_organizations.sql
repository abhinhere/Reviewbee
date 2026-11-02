-- Allow public visitors (unauthenticated customers scanning QR code) to view organizations by slug
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'organizations' AND policyname = 'Public can view organizations'
    ) THEN
        CREATE POLICY "Public can view organizations" 
        ON public.organizations FOR SELECT 
        USING (true);
    END IF;
END $$;

