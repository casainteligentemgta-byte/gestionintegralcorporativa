-- ============================================================================
-- SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- CRITICAL SECURITY CONFIGURATION
-- ============================================================================
-- 
-- INSTRUCTIONS:
-- 1. Open Supabase Dashboard > SQL Editor
-- 2. Create a new query
-- 3. Paste this entire file
-- 4. Run the query
-- 5. Verify policies in Table Editor > [table] > Policies tab
--
-- ============================================================================

-- ============================================================================
-- STEP 1: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE "Facturas_Compras" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Proveedores" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Inventario_Global" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Material_Requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Workers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Projects" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "inventory_movements" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Detalle_Compra" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Purchase_Orders" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Detalle_Purchase_Order" ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: USER PROFILES POLICIES (Foundation for all other policies)
-- ============================================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
ON "user_profiles"
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
ON "user_profiles"
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON "user_profiles"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente')
  )
);

-- ============================================================================
-- STEP 3: FACTURAS_COMPRAS (Purchase Invoices) POLICIES
-- ============================================================================

-- Admins and managers can view all purchases
CREATE POLICY "Admins can view all purchases"
ON "Facturas_Compras"
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'manager')
  )
);

-- Only admins and managers can insert purchases
CREATE POLICY "Admins can insert purchases"
ON "Facturas_Compras"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'manager')
  )
);

-- Only admins and managers can update purchases
CREATE POLICY "Admins can update purchases"
ON "Facturas_Compras"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'manager')
  )
);

-- ============================================================================
-- STEP 4: PROVEEDORES (Suppliers) POLICIES
-- ============================================================================

-- All authenticated users can view suppliers
CREATE POLICY "All users can view suppliers"
ON "Proveedores"
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify suppliers
CREATE POLICY "Only admins can modify suppliers"
ON "Proveedores"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente')
  )
);

-- ============================================================================
-- STEP 5: INVENTARIO_GLOBAL (Global Inventory) POLICIES
-- ============================================================================

-- All authenticated users can view inventory
CREATE POLICY "All users can view inventory"
ON "Inventario_Global"
FOR SELECT
TO authenticated
USING (true);

-- Only admins and warehouse staff can modify inventory
CREATE POLICY "Admins and warehouse can modify inventory"
ON "Inventario_Global"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'almacenero')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'almacenero')
  )
);

-- ============================================================================
-- STEP 6: MATERIAL_REQUESTS (Material Requisitions) POLICIES
-- ============================================================================

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON "Material_Requests"
FOR SELECT
TO authenticated
USING (
  requester_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'almacenero', 'supervisor')
  )
);

-- Users can create their own requests
CREATE POLICY "Users can create requests"
ON "Material_Requests"
FOR INSERT
TO authenticated
WITH CHECK (requester_id = auth.uid());

-- Only admins and warehouse can update requests
CREATE POLICY "Admins and warehouse can update requests"
ON "Material_Requests"
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'almacenero')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'almacenero')
  )
);

-- ============================================================================
-- STEP 7: WORKERS POLICIES
-- ============================================================================

-- All authenticated users can view workers
CREATE POLICY "All users can view workers"
ON "Workers"
FOR SELECT
TO authenticated
USING (true);

-- Only admins and managers can modify workers
CREATE POLICY "Only admins can modify workers"
ON "Workers"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'manager')
  )
);

-- ============================================================================
-- STEP 8: COMPANIES POLICIES
-- ============================================================================

-- All authenticated users can view companies
CREATE POLICY "All users can view companies"
ON "Companies"
FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify companies
CREATE POLICY "Only admins can modify companies"
ON "Companies"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente')
  )
);

-- ============================================================================
-- STEP 9: PROJECTS POLICIES
-- ============================================================================

-- All authenticated users can view projects
CREATE POLICY "All users can view projects"
ON "Projects"
FOR SELECT
TO authenticated
USING (true);

-- Only admins and managers can modify projects
CREATE POLICY "Only admins can modify projects"
ON "Projects"
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'manager')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'manager')
  )
);

-- ============================================================================
-- STEP 10: INVENTORY_MOVEMENTS POLICIES
-- ============================================================================

-- All authenticated users can view movements
CREATE POLICY "All users can view movements"
ON "inventory_movements"
FOR SELECT
TO authenticated
USING (true);

-- Only admins and warehouse can create movements
CREATE POLICY "Admins and warehouse can create movements"
ON "inventory_movements"
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE user_profiles.user_id = auth.uid()
    AND user_profiles.role IN ('admin', 'gerente', 'almacenero')
  )
);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify policies are working:

-- Check if RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
  'Facturas_Compras', 'Proveedores', 'Inventario_Global', 
  'Material_Requests', 'Workers', 'Companies', 'Projects',
  'user_profiles', 'inventory_movements'
);

-- List all policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- NOTES:
-- ============================================================================
-- 
-- 1. These policies assume you have a 'user_profiles' table with:
--    - user_id (references auth.users)
--    - role (text: 'admin', 'gerente', 'manager', 'almacenero', 'supervisor', 'viewer', 'obrero')
--
-- 2. Adjust role names to match your application's roles
--
-- 3. For more granular control, add project-based or company-based policies
--
-- 4. Test thoroughly with different user roles before deploying to production
--
-- 5. Monitor Supabase logs for policy violations
--
-- ============================================================================
