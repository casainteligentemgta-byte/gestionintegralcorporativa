-- ============================================================================
-- TABLA DE EMPLEADOS - SISTEMA COMPLETO DE CONTRATACIÓN
-- ============================================================================
-- Formulario completo de contrato laboral según normativa venezolana
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear tabla de empleados con TODOS los campos
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.empleados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- I. IDENTIFICACIÓN DEL EMPLEADO
  numero_contrato TEXT UNIQUE,
  foto_url TEXT,
  foto_cedula_url TEXT,
  primer_nombre TEXT NOT NULL,
  segundo_nombre TEXT,
  primer_apellido TEXT NOT NULL,
  segundo_apellido TEXT,
  cedula_identidad TEXT NOT NULL,
  edad INTEGER,
  estado_civil TEXT CHECK (estado_civil IN ('soltero', 'casado', 'divorciado', 'viudo', 'concubinato')),
  
  -- II. IDENTIFICACIÓN DEL PATRONO (se obtiene de la tabla companies)
  -- Estos campos se llenan automáticamente desde la compañía
  
  -- III. DATOS DE CONTRATACIÓN
  fecha_ingreso DATE DEFAULT CURRENT_DATE,
  cargo_desempenar TEXT,
  salario_basico DECIMAL(12,2),
  forma_pago TEXT CHECK (forma_pago IN ('efectivo', 'transferencia', 'cheque', 'nomina')),
  lugar_pago TEXT,
  jornada_trabajo TEXT CHECK (jornada_trabajo IN ('diurna', 'nocturna', 'mixta', 'por_turnos')),
  objeto_contrato TEXT,
  
  -- IV. DATOS PERSONALES DEL EMPLEADO
  lugar_nacimiento TEXT,
  pais_nacimiento TEXT DEFAULT 'Venezuela',
  fecha_nacimiento DATE,
  nacionalidad TEXT DEFAULT 'Venezolana',
  celular TEXT,
  telefono_habitacion TEXT,
  email TEXT,
  direccion_domicilio TEXT,
  inscripcion_ivss TEXT,
  es_zurdo BOOLEAN DEFAULT FALSE,
  
  -- Instrucción y Capacitación
  instruccion_primaria TEXT,
  instruccion_secundaria TEXT,
  instruccion_tecnica TEXT,
  instruccion_superior TEXT,
  profesion_oficio_actual TEXT,
  
  -- V. ANTECEDENTES MÉDICOS
  examen_medico_previo BOOLEAN DEFAULT FALSE,
  examen_efectuado_por TEXT,
  tipo_sangre TEXT CHECK (tipo_sangre IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  enfermedades_padecidas TEXT,
  incapacidades_fisicas TEXT,
  
  -- VI. PESO Y MEDIDAS
  peso DECIMAL(5,2),
  estatura DECIMAL(4,2),
  talla_camisa TEXT,
  talla_pantalon TEXT,
  talla_bragas TEXT,
  medida_botas TEXT,
  observaciones_medidas TEXT,
  
  -- VII. FAMILIARES DEPENDIENTES (JSON array)
  dependientes JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"nombre": "...", "apellido": "...", "parentesco": "...", "fecha_nacimiento": "..."}]
  
  -- VIII. DATOS DE TRABAJOS PREVIOS (JSON array)
  experiencias_previas JSONB DEFAULT '[]'::jsonb,
  -- Formato: [{"empresa": "...", "lugar": "...", "cargo": "...", "duracion": "...", "fecha_retiro": "...", "motivo_retiro": "..."}]
  
  -- IX. FIRMAS Y DOCUMENTOS
  firma_trabajador_url TEXT,
  huella_trabajador_url TEXT,
  firma_representante_url TEXT,
  sello_representante_url TEXT,
  fecha_expedicion DATE DEFAULT CURRENT_DATE,
  lugar_expedicion TEXT,
  
  -- QR Code
  qr_code TEXT UNIQUE,
  qr_url TEXT,
  
  -- Estado
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'terminated')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_empleados_company ON public.empleados(company_id);
CREATE INDEX IF NOT EXISTS idx_empleados_cedula ON public.empleados(cedula_identidad);
CREATE INDEX IF NOT EXISTS idx_empleados_email ON public.empleados(email);
CREATE INDEX IF NOT EXISTS idx_empleados_numero_contrato ON public.empleados(numero_contrato);
CREATE INDEX IF NOT EXISTS idx_empleados_qr ON public.empleados(qr_code);
CREATE INDEX IF NOT EXISTS idx_empleados_status ON public.empleados(status);

-- ============================================================================
-- PASO 2: Trigger para actualizar updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_empleados_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_empleados_timestamp ON public.empleados;
CREATE TRIGGER update_empleados_timestamp
  BEFORE UPDATE ON public.empleados
  FOR EACH ROW
  EXECUTE FUNCTION public.update_empleados_updated_at();

-- ============================================================================
-- PASO 3: Trigger para auto-asignar company_id
-- ============================================================================

DROP TRIGGER IF EXISTS set_empleados_company_id ON public.empleados;
CREATE TRIGGER set_empleados_company_id
  BEFORE INSERT ON public.empleados
  FOR EACH ROW
  EXECUTE FUNCTION public.set_company_id();

-- ============================================================================
-- PASO 4: Función para generar número de contrato y QR code
-- ============================================================================

CREATE OR REPLACE FUNCTION public.generate_employee_contract_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INTEGER;
  company_prefix TEXT;
BEGIN
  -- Generar número de contrato si no existe
  IF NEW.numero_contrato IS NULL THEN
    -- Obtener prefijo de la compañía (primeras 3 letras del RIF o nombre)
    SELECT COALESCE(SUBSTRING(rif, 1, 3), SUBSTRING(name, 1, 3))
    INTO company_prefix
    FROM companies
    WHERE id = NEW.company_id;
    
    -- Contar empleados existentes de esta compañía
    SELECT COUNT(*) + 1
    INTO next_number
    FROM empleados
    WHERE company_id = NEW.company_id;
    
    -- Formato: PREFIJO-AÑO-NÚMERO (ej: ABC-2026-001)
    NEW.numero_contrato := UPPER(company_prefix) || '-' || 
                          EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || 
                          LPAD(next_number::TEXT, 4, '0');
  END IF;
  
  -- Generar código QR único
  IF NEW.qr_code IS NULL THEN
    NEW.qr_code := 'EMP-' || UPPER(SUBSTRING(NEW.id::TEXT, 1, 8));
  END IF;
  
  -- Generar URL del QR
  IF NEW.qr_url IS NULL THEN
    NEW.qr_url := 'https://gestionintegralcorporativa.netlify.app/empleado/' || NEW.qr_code;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS generate_employee_contract_trigger ON public.empleados;
CREATE TRIGGER generate_employee_contract_trigger
  BEFORE INSERT ON public.empleados
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_employee_contract_number();

-- ============================================================================
-- PASO 5: RLS Policies para empleados
-- ============================================================================

ALTER TABLE public.empleados ENABLE ROW LEVEL SECURITY;

-- Policy: SELECT
DROP POLICY IF EXISTS "Users can view their company employees" ON public.empleados;
CREATE POLICY "Users can view their company employees"
ON public.empleados FOR SELECT TO authenticated
USING (public.is_super_admin() OR company_id = public.get_user_company_id());

-- Policy: INSERT
DROP POLICY IF EXISTS "Users can insert employees in their company" ON public.empleados;
CREATE POLICY "Users can insert employees in their company"
ON public.empleados FOR INSERT TO authenticated
WITH CHECK (public.is_super_admin() OR company_id = public.get_user_company_id());

-- Policy: UPDATE
DROP POLICY IF EXISTS "Users can update their company employees" ON public.empleados;
CREATE POLICY "Users can update their company employees"
ON public.empleados FOR UPDATE TO authenticated
USING (public.is_super_admin() OR company_id = public.get_user_company_id())
WITH CHECK (public.is_super_admin() OR company_id = public.get_user_company_id());

-- Policy: DELETE
DROP POLICY IF EXISTS "Users can delete their company employees" ON public.empleados;
CREATE POLICY "Users can delete their company employees"
ON public.empleados FOR DELETE TO authenticated
USING (public.is_super_admin() OR company_id = public.get_user_company_id());

-- ============================================================================
-- PASO 6: Vista para información completa de empleados
-- ============================================================================

CREATE OR REPLACE VIEW public.empleados_completo AS
SELECT 
  e.id,
  e.company_id,
  c.name as empresa_nombre,
  c.rif as empresa_rif,
  e.numero_contrato,
  e.primer_nombre || ' ' || COALESCE(e.segundo_nombre || ' ', '') || 
    e.primer_apellido || ' ' || COALESCE(e.segundo_apellido, '') as nombre_completo,
  e.cedula_identidad,
  e.edad,
  e.estado_civil,
  e.cargo_desempenar,
  e.salario_basico,
  e.fecha_ingreso,
  e.email,
  e.celular,
  e.qr_code,
  e.qr_url,
  e.status,
  EXTRACT(YEAR FROM AGE(CURRENT_DATE, e.fecha_ingreso)) as anos_servicio,
  e.created_at
FROM public.empleados e
LEFT JOIN public.companies c ON e.company_id = c.id;

GRANT SELECT ON public.empleados_completo TO authenticated;

-- ============================================================================
-- VERIFICACIÓN
-- ============================================================================

SELECT 'Tabla empleados creada exitosamente con todos los campos!' as status;

-- Ver estructura completa
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'empleados'
ORDER BY ordinal_position;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 
-- ✅ Formulario completo de contrato laboral venezolano
-- ✅ Número de contrato auto-generado (PREFIJO-AÑO-NÚMERO)
-- ✅ QR code único para cada empleado
-- ✅ Campos JSONB para dependientes y experiencias (flexible)
-- ✅ Todos los campos de identificación, médicos, medidas, etc.
-- ✅ RLS policies para multi-tenant
-- ✅ Triggers automáticos
--
-- ============================================================================
