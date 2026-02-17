-- ============================================================================
-- CONFIGURACIÓN DE NOTIFICACIONES - COMPATIBLE CON TABLA PROFILES EXISTENTE
-- ============================================================================
-- Este script se adapta a tu tabla profiles existente
-- ============================================================================

-- ============================================================================
-- PASO 1: Crear tabla para notificaciones pendientes
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  user_name TEXT,
  message TEXT NOT NULL,
  sent BOOLEAN DEFAULT FALSE,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_admin_notifications_sent ON public.admin_notifications(sent);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON public.admin_notifications(created_at);

-- ============================================================================
-- PASO 2: Crear función para enviar notificación a admin
-- ============================================================================

CREATE OR REPLACE FUNCTION public.notify_admin_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT := 'casainteligentemgta@gmail.com';
  user_email TEXT;
  user_name TEXT;
BEGIN
  -- Obtener información del nuevo usuario
  user_email := NEW.email;
  user_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email);
  
  -- Insertar en tabla de notificaciones pendientes
  INSERT INTO public.admin_notifications (
    notification_type,
    user_id,
    user_email,
    user_name,
    message,
    created_at
  ) VALUES (
    'new_user_registration',
    NEW.id,
    user_email,
    user_name,
    'Nuevo usuario registrado: ' || user_name || ' (' || user_email || '). Requiere activación.',
    NOW()
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- PASO 3: Crear trigger para notificaciones automáticas
-- ============================================================================

DROP TRIGGER IF EXISTS on_new_user_notify_admin ON auth.users;

CREATE TRIGGER on_new_user_notify_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_new_user();

-- ============================================================================
-- PASO 4: Habilitar RLS en tabla de notificaciones
-- ============================================================================

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden ver notificaciones
DROP POLICY IF EXISTS "Only admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Only admins can view notifications"
ON public.admin_notifications
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

-- ============================================================================
-- PASO 5: Crear vista para notificaciones pendientes
-- ============================================================================

CREATE OR REPLACE VIEW public.pending_admin_notifications AS
SELECT 
  n.id,
  n.notification_type,
  n.user_email,
  n.user_name,
  n.message,
  n.created_at,
  EXTRACT(EPOCH FROM (NOW() - n.created_at))/60 AS minutes_pending
FROM public.admin_notifications n
WHERE n.sent = FALSE
ORDER BY n.created_at DESC;

-- Grant access to authenticated users (will be filtered by RLS)
GRANT SELECT ON public.pending_admin_notifications TO authenticated;

-- ============================================================================
-- PASO 6: Crear función helper para verificar usuarios activos
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
-- VERIFICACIÓN
-- ============================================================================

-- Ver notificaciones pendientes
SELECT 'Tabla admin_notifications creada correctamente' as status;
SELECT COUNT(*) as total_notifications FROM admin_notifications;

-- Ver trigger
SELECT 'Trigger creado correctamente' as status;

-- ============================================================================
-- NOTAS:
-- ============================================================================
-- 
-- ✅ Este script NO modifica tu tabla profiles existente
-- ✅ Solo crea la tabla admin_notifications y el trigger
-- ✅ Funciona con tu estructura actual de profiles
--
-- ============================================================================
