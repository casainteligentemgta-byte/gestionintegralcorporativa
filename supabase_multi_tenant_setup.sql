-- ============================================================================
-- SISTEMA MULTI-TENANT - CONFIGURACIÓN COMPLETA
-- ============================================================================
-- Este script implementa aislamiento completo de datos por compañía
-- Cada usuario solo verá los datos de SU compañía
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear tabla de compañías
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rif TEXT UNIQUE,
  email TEXT,
  phone TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Venezuela',
  logo_url TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled')),
  subscription_plan TEXT DEFAULT 'basic' CHECK (subscription_plan IN ('basic', 'professional', 'enterprise')),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_companies_rif ON public.companies(rif);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(subscription_status);

-- ============================================================================
-- PASO 2: Actualizar tabla profiles para incluir company_id
-- ============================================================================

-- Agregar columna company_id si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'company_id'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Agregar columna is_company_owner si no existe
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'is_company_owner'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_company_owner BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Crear índice
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_id);

-- ============================================================================
-- PASO 3: Agregar company_id a TODAS las tablas existentes
-- ============================================================================

-- Lista de tablas que necesitan company_id
DO $$ 
DECLARE
  table_name TEXT;
  tables_to_update TEXT[] := ARRAY[
    'Facturas_Compras',
    'inventory_master',
    'inventory_movements',
    'Empresas',
    'Obreros',
    'purchase_orders',
    'suppliers'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_update
  LOOP
    -- Verificar si la tabla existe
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      -- Agregar company_id si no existe
      IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = table_name 
        AND column_name = 'company_id'
      ) THEN
        EXECUTE format('ALTER TABLE public.%I ADD COLUMN company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE', table_name);
        EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_company ON public.%I(company_id)', table_name, table_name);
        RAISE NOTICE 'Added company_id to %', table_name;
      END IF;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PASO 4: Función para verificar si es super admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT email = 'casainteligentemgta@gmail.com'
    FROM public.profiles 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASO 5: Función para obtener company_id del usuario actual
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_company_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT company_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASO 5: Función para verificar si usuario es dueño de compañía
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_company_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT is_company_owner 
    FROM public.profiles 
    WHERE user_id = auth.uid()
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASO 6: Trigger para auto-asignar company_id en inserts
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_company_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Si no se especificó company_id, usar el del usuario actual
  IF NEW.company_id IS NULL THEN
    NEW.company_id := public.get_user_company_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar trigger a todas las tablas relevantes
DO $$ 
DECLARE
  table_name TEXT;
  tables_with_trigger TEXT[] := ARRAY[
    'Facturas_Compras',
    'inventory_master',
    'inventory_movements',
    'Empresas',
    'Obreros',
    'purchase_orders',
    'suppliers'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_with_trigger
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS set_company_id_trigger ON public.%I', table_name);
      EXECUTE format('CREATE TRIGGER set_company_id_trigger BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_company_id()', table_name);
      RAISE NOTICE 'Created trigger for %', table_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PASO 7: RLS Policies - Aislamiento por Compañía (con Super Admin bypass)
-- ============================================================================

-- Habilitar RLS en tabla companies
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Policy: Super admin ve TODAS las compañías, usuarios normales solo la suya
DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company"
ON public.companies
FOR SELECT
TO authenticated
USING (
  public.is_super_admin() OR 
  id = public.get_user_company_id()
);

-- Policy: Super admin puede actualizar cualquier compañía, dueños solo la suya
DROP POLICY IF EXISTS "Company owners can update their company" ON public.companies;
CREATE POLICY "Company owners can update their company"
ON public.companies
FOR UPDATE
TO authenticated
USING (
  public.is_super_admin() OR 
  (id = public.get_user_company_id() AND public.is_company_owner())
)
WITH CHECK (
  public.is_super_admin() OR 
  (id = public.get_user_company_id() AND public.is_company_owner())
);

-- Policy: Super admin puede crear compañías para otros usuarios
DROP POLICY IF EXISTS "Super admin can create companies" ON public.companies;
CREATE POLICY "Super admin can create companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin());

-- ============================================================================
-- PASO 8: Aplicar RLS a todas las tablas con company_id
-- ============================================================================

DO $$ 
DECLARE
  table_name TEXT;
  tables_with_rls TEXT[] := ARRAY[
    'Facturas_Compras',
    'inventory_master',
    'inventory_movements',
    'Empresas',
    'Obreros',
    'purchase_orders',
    'suppliers'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_with_rls
  LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = table_name
    ) THEN
      -- Habilitar RLS
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      
      -- Policy: SELECT - Super admin ve TODO, usuarios normales solo su compañía
      EXECUTE format('DROP POLICY IF EXISTS "Users can view their company data" ON public.%I', table_name);
      EXECUTE format('CREATE POLICY "Users can view their company data" ON public.%I FOR SELECT TO authenticated USING (public.is_super_admin() OR company_id = public.get_user_company_id())', table_name);
      
      -- Policy: INSERT - Super admin puede insertar en cualquier compañía, usuarios solo en la suya
      EXECUTE format('DROP POLICY IF EXISTS "Users can insert in their company" ON public.%I', table_name);
      EXECUTE format('CREATE POLICY "Users can insert in their company" ON public.%I FOR INSERT TO authenticated WITH CHECK (public.is_super_admin() OR company_id = public.get_user_company_id())', table_name);
      
      -- Policy: UPDATE - Super admin puede actualizar TODO, usuarios solo su compañía
      EXECUTE format('DROP POLICY IF EXISTS "Users can update their company data" ON public.%I', table_name);
      EXECUTE format('CREATE POLICY "Users can update their company data" ON public.%I FOR UPDATE TO authenticated USING (public.is_super_admin() OR company_id = public.get_user_company_id()) WITH CHECK (public.is_super_admin() OR company_id = public.get_user_company_id())', table_name);
      
      -- Policy: DELETE - Super admin puede eliminar TODO, usuarios solo su compañía
      EXECUTE format('DROP POLICY IF EXISTS "Users can delete their company data" ON public.%I', table_name);
      EXECUTE format('CREATE POLICY "Users can delete their company data" ON public.%I FOR DELETE TO authenticated USING (public.is_super_admin() OR company_id = public.get_user_company_id())', table_name);
      
      RAISE NOTICE 'Applied RLS policies with super admin bypass to %', table_name;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- PASO 9: Función para crear compañía y asignar al usuario
-- ============================================================================

CREATE OR REPLACE FUNCTION public.create_company_and_assign(
  company_name TEXT,
  company_rif TEXT DEFAULT NULL,
  company_email TEXT DEFAULT NULL,
  company_phone TEXT DEFAULT NULL,
  company_address TEXT DEFAULT NULL,
  company_city TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  new_company_id UUID;
  current_user_id UUID;
BEGIN
  -- Obtener ID del usuario actual
  current_user_id := auth.uid();
  
  -- Verificar que el usuario no tenga ya una compañía
  IF EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE user_id = current_user_id 
    AND company_id IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'User already has a company assigned';
  END IF;
  
  -- Crear la compañía
  INSERT INTO public.companies (
    name,
    rif,
    email,
    phone,
    address,
    city
  ) VALUES (
    company_name,
    company_rif,
    company_email,
    company_phone,
    company_address,
    company_city
  )
  RETURNING id INTO new_company_id;
  
  -- Asignar compañía al usuario y marcarlo como dueño
  UPDATE public.profiles
  SET 
    company_id = new_company_id,
    is_company_owner = TRUE,
    status = 'active',
    updated_at = NOW()
  WHERE user_id = current_user_id;
  
  RETURN new_company_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASO 10: Vista para información de compañía del usuario
-- ============================================================================

CREATE OR REPLACE VIEW public.user_company_info AS
SELECT 
  p.user_id,
  p.email,
  p.full_name,
  p.role,
  p.status,
  p.is_company_owner,
  c.id as company_id,
  c.name as company_name,
  c.rif as company_rif,
  c.email as company_email,
  c.phone as company_phone,
  c.address as company_address,
  c.city as company_city,
  c.subscription_status,
  c.subscription_plan,
  c.trial_ends_at,
  c.created_at as company_created_at
FROM public.profiles p
LEFT JOIN public.companies c ON p.company_id = c.id
WHERE p.user_id = auth.uid();

-- Grant access
GRANT SELECT ON public.user_company_info TO authenticated;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 'Multi-tenant setup completed successfully!' as status;

-- Ver estructura de companies
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'companies'
ORDER BY ordinal_position;

-- Ver si profiles tiene company_id
SELECT 
  column_name, 
  data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'profiles'
AND column_name IN ('company_id', 'is_company_owner');

-- ============================================================================
-- NOTAS IMPORTANTES:
-- ============================================================================
-- 
-- ✅ Cada usuario debe crear su compañía al primer login
-- ✅ Los datos existentes NO tienen company_id (serán NULL hasta asignar)
-- ✅ Nuevos registros automáticamente tendrán el company_id del usuario
-- ✅ RLS asegura que cada usuario solo vea datos de SU compañía
-- ✅ El dueño de la compañía puede invitar más usuarios (feature futura)
--
-- PRÓXIMOS PASOS:
-- 1. Crear pantalla de "Setup Inicial" para registrar compañía
-- 2. Actualizar AuthGuard para verificar si usuario tiene compañía
-- 3. Si no tiene compañía, mostrar pantalla de setup
-- 4. Una vez creada, permitir acceso normal
--
-- ============================================================================
