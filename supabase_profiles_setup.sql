-- ============================================================================
-- USER PROFILES TABLE WITH MANUAL AUTHORIZATION
-- ============================================================================
-- This script creates a user profiles table with status-based authorization
-- Execute this in Supabase Dashboard > SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: Create profiles table
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'viewer',
  status TEXT NOT NULL DEFAULT 'pending',
  company_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  activated_at TIMESTAMPTZ,
  activated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  
  -- Ensure one profile per user
  UNIQUE(user_id),
  
  -- Ensure valid status values
  CONSTRAINT valid_status CHECK (status IN ('pending', 'active', 'suspended', 'rejected')),
  
  -- Ensure valid role values
  CONSTRAINT valid_role CHECK (role IN ('admin', 'gerente', 'manager', 'supervisor', 'almacenero', 'viewer', 'obrero'))
);

-- ============================================================================
-- STEP 2: Create indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON public.profiles(status);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================================================
-- STEP 3: Create function to auto-create profile on user signup
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name, role, status)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'viewer',  -- Default role
    'pending'  -- Default status - requires manual activation
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Create trigger to auto-create profile
-- ============================================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- STEP 5: Enable Row Level Security
-- ============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 6: Create RLS Policies for profiles table
-- ============================================================================

-- Users can view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own profile (except status and role)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (
  user_id = auth.uid() 
  AND status = (SELECT status FROM public.profiles WHERE user_id = auth.uid())
  AND role = (SELECT role FROM public.profiles WHERE user_id = auth.uid())
);

-- Admins can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'gerente')
    AND profiles.status = 'active'
  )
);

-- Admins can update any profile (including status and role)
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'gerente')
    AND profiles.status = 'active'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'gerente')
    AND profiles.status = 'active'
  )
);

-- ============================================================================
-- STEP 7: Create helper function to check if user is active
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_user_active(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = check_user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 8: Update existing RLS policies to check active status
-- ============================================================================

-- Example: Update Facturas_Compras policies to require active status
DROP POLICY IF EXISTS "Active users can view purchases" ON public."Facturas_Compras";
CREATE POLICY "Active users can view purchases"
ON public."Facturas_Compras"
FOR SELECT
TO authenticated
USING (
  public.is_user_active(auth.uid())
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'gerente', 'manager')
    )
  )
);

DROP POLICY IF EXISTS "Active admins can modify purchases" ON public."Facturas_Compras";
CREATE POLICY "Active admins can modify purchases"
ON public."Facturas_Compras"
FOR ALL
TO authenticated
USING (
  public.is_user_active(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'gerente', 'manager')
  )
)
WITH CHECK (
  public.is_user_active(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('admin', 'gerente', 'manager')
  )
);

-- ============================================================================
-- STEP 9: Create admin view for pending users
-- ============================================================================

CREATE OR REPLACE VIEW public.pending_users AS
SELECT 
  p.id,
  p.user_id,
  p.email,
  p.full_name,
  p.created_at,
  p.notes,
  EXTRACT(EPOCH FROM (NOW() - p.created_at))/3600 AS hours_pending
FROM public.profiles p
WHERE p.status = 'pending'
ORDER BY p.created_at DESC;

-- Grant access to authenticated users (will be filtered by RLS)
GRANT SELECT ON public.pending_users TO authenticated;

-- ============================================================================
-- STEP 10: Create function to activate user (admin only)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.activate_user(
  target_user_id UUID,
  assign_role TEXT DEFAULT 'viewer'
)
RETURNS BOOLEAN AS $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Get the current user ID
  admin_user_id := auth.uid();
  
  -- Check if current user is admin and active
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = admin_user_id
    AND role IN ('admin', 'gerente')
    AND status = 'active'
  ) THEN
    RAISE EXCEPTION 'Only active admins can activate users';
  END IF;
  
  -- Validate role
  IF assign_role NOT IN ('admin', 'gerente', 'manager', 'supervisor', 'almacenero', 'viewer', 'obrero') THEN
    RAISE EXCEPTION 'Invalid role: %', assign_role;
  END IF;
  
  -- Activate the user
  UPDATE public.profiles
  SET 
    status = 'active',
    role = assign_role,
    activated_at = NOW(),
    activated_by = admin_user_id,
    updated_at = NOW()
  WHERE user_id = target_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 11: Create initial admin user (IMPORTANT!)
-- ============================================================================
-- Replace 'your-email@example.com' with your actual admin email
-- This user will be automatically activated

DO $$
DECLARE
  admin_email TEXT := 'admin@kore.com';  -- CHANGE THIS!
  admin_user_id UUID;
BEGIN
  -- Find the user ID for the admin email
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email
  LIMIT 1;
  
  IF admin_user_id IS NOT NULL THEN
    -- Update or insert admin profile
    INSERT INTO public.profiles (user_id, email, full_name, role, status, activated_at)
    VALUES (
      admin_user_id,
      admin_email,
      'System Administrator',
      'admin',
      'active',
      NOW()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      role = 'admin',
      status = 'active',
      activated_at = COALESCE(profiles.activated_at, NOW()),
      updated_at = NOW();
    
    RAISE NOTICE 'Admin user activated: %', admin_email;
  ELSE
    RAISE NOTICE 'Admin user not found. Please create user with email: %', admin_email;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check if profiles table was created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM public.profiles) as profile_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename = 'profiles';

-- View all profiles
SELECT 
  id,
  email,
  full_name,
  role,
  status,
  created_at,
  activated_at
FROM public.profiles
ORDER BY created_at DESC;

-- View pending users
SELECT * FROM public.pending_users;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 
-- 1. After running this script, create your first admin user in Supabase Auth
-- 2. Update the admin email in STEP 11 and re-run that section
-- 3. All new users will have status='pending' by default
-- 4. Admins can activate users using the activate_user() function
-- 5. Only 'active' users can access application data
--
-- ============================================================================
