# 🔐 SISTEMA DE AUTORIZACIÓN MANUAL - GUÍA DE IMPLEMENTACIÓN

## 📋 RESUMEN

Este sistema implementa autorización manual basada en estados de cuenta, requiriendo que un administrador active cada nueva cuenta antes de que el usuario pueda acceder a la aplicación.

---

## 🎯 CARACTERÍSTICAS IMPLEMENTADAS

### ✅ 1. Tabla de Perfiles con Estados
- **Tabla:** `profiles` vinculada a `auth.users`
- **Campos clave:**
  - `status`: `pending` | `active` | `suspended` | `rejected`
  - `role`: `admin` | `gerente` | `manager` | `supervisor` | `almacenero` | `viewer` | `obrero`
  - `activated_at`: Fecha de activación
  - `activated_by`: Usuario que activó la cuenta

### ✅ 2. Creación Automática de Perfiles
- **Trigger:** Se crea automáticamente un perfil cuando un usuario se registra
- **Estado inicial:** `pending`
- **Rol inicial:** `viewer`

### ✅ 3. AuthGuard Component
- Verifica el estado de la cuenta en cada carga
- Muestra pantallas específicas según el estado:
  - **Pending:** Mensaje de cuenta pendiente con contacto a soporte
  - **Active:** Acceso normal a la aplicación
  - **Suspended:** Mensaje de cuenta suspendida
  - **Rejected:** Mensaje de solicitud rechazada

### ✅ 4. Página de Administración de Usuarios
- Vista de todos los usuarios con filtros por estado
- Activación de usuarios pendientes con asignación de rol
- Suspensión/reactivación de usuarios
- Rechazo de solicitudes

### ✅ 5. RLS Policies Actualizadas
- Solo usuarios con `status = 'active'` pueden acceder a datos
- Función helper `is_user_active()` para verificar estado
- Políticas aplicadas a todas las tablas críticas

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### PASO 1: Ejecutar Script SQL en Supabase

1. **Abrir Supabase Dashboard** → SQL Editor
2. **Copiar el contenido de:** `supabase_profiles_setup.sql`
3. **IMPORTANTE:** Antes de ejecutar, actualizar la línea 242:
   ```sql
   admin_email TEXT := 'admin@kore.com';  -- CAMBIAR POR TU EMAIL
   ```
4. **Ejecutar el script completo**
5. **Verificar la creación:**
   ```sql
   -- Verificar tabla profiles
   SELECT * FROM profiles;
   
   -- Verificar RLS habilitado
   SELECT tablename, rowsecurity 
   FROM pg_tables 
   WHERE tablename = 'profiles';
   ```

### PASO 2: Crear Tu Primer Usuario Admin

**Opción A: Si ya tienes una cuenta en Supabase Auth:**
1. Actualiza el email en el script SQL (línea 242)
2. Re-ejecuta solo la sección STEP 11 del script
3. Tu cuenta será automáticamente activada como admin

**Opción B: Crear nueva cuenta admin:**
1. Ve a Supabase Dashboard → Authentication → Users
2. Click "Add user" → "Create new user"
3. Ingresa email y contraseña
4. Actualiza el email en el script SQL
5. Re-ejecuta STEP 11
6. Tu cuenta estará activa como admin

### PASO 3: Verificar Integración en la Aplicación

El código ya está integrado:
- ✅ `AuthGuard` envuelve toda la aplicación en `App.tsx`
- ✅ `UserManagement` página agregada
- ✅ Tipo `USER_MANAGEMENT` agregado a `types.ts`

### PASO 4: Agregar Acceso a User Management en el Dashboard

Necesitas agregar un botón en tu Dashboard para acceder a la gestión de usuarios:

```typescript
// En tu Dashboard.tsx o Settings.tsx
<button
  onClick={() => onNavigate('USER_MANAGEMENT')}
  className="..."
>
  <span className="material-symbols-outlined">manage_accounts</span>
  Gestión de Usuarios
</button>
```

---

## 🔄 FLUJO DE USUARIO

### Para Nuevos Usuarios:

1. **Usuario se registra** → Cuenta creada con `status = 'pending'`
2. **Usuario intenta acceder** → AuthGuard detecta `status = 'pending'`
3. **Se muestra pantalla de "Cuenta Pendiente"** con:
   - Mensaje explicativo
   - Información de la cuenta
   - Botón para contactar soporte
   - Opción de cerrar sesión
4. **Admin activa la cuenta** → `status = 'active'`, rol asignado
5. **Usuario recarga la página** → Acceso completo a la aplicación

### Para Administradores:

1. **Navegar a User Management** (agregar botón en Dashboard)
2. **Ver lista de usuarios pendientes**
3. **Click en "Gestionar"** para un usuario
4. **Seleccionar rol** (viewer, obrero, almacenero, supervisor, manager, gerente, admin)
5. **Click "Activar Usuario"**
6. **Usuario puede acceder inmediatamente**

---

## 🛡️ SEGURIDAD IMPLEMENTADA

### RLS Policies

Todas las tablas ahora verifican que el usuario esté activo:

```sql
-- Ejemplo: Facturas_Compras
CREATE POLICY "Active users can view purchases"
ON "Facturas_Compras"
FOR SELECT
TO authenticated
USING (
  public.is_user_active(auth.uid())  -- ✅ Verifica status = 'active'
  AND (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.role IN ('admin', 'gerente', 'manager')
    )
  )
);
```

### Función Helper

```sql
CREATE FUNCTION public.is_user_active(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = check_user_id
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Función de Activación Segura

```sql
CREATE FUNCTION public.activate_user(
  target_user_id UUID,
  assign_role TEXT DEFAULT 'viewer'
)
-- Solo admins activos pueden activar usuarios
-- Valida roles permitidos
-- Registra quién activó y cuándo
```

---

## 📝 CONFIGURACIÓN ADICIONAL

### Actualizar Email de Soporte

En `components/AuthGuard.tsx`, actualiza el email de contacto:

```typescript
<a
  href="mailto:soporte@kore.com?subject=Activación de Cuenta - KORE"
  // ↑ Cambiar por tu email de soporte real
```

### Personalizar Mensajes

Puedes personalizar los mensajes en `AuthGuard.tsx`:
- Mensaje de cuenta pendiente (línea ~120)
- Mensaje de cuenta suspendida (línea ~180)
- Mensaje de cuenta rechazada (línea ~220)

### Configurar Notificaciones (Opcional)

Para notificar a admins cuando hay nuevos usuarios pendientes, puedes:

1. **Crear un Edge Function** que se ejecute periódicamente
2. **Consultar usuarios pendientes:**
   ```sql
   SELECT * FROM pending_users WHERE hours_pending > 24;
   ```
3. **Enviar email a admins** con la lista

---

## 🧪 TESTING

### Test 1: Registro de Nuevo Usuario

1. Crear nueva cuenta en la aplicación
2. Verificar que aparece pantalla "Cuenta Pendiente"
3. Verificar en Supabase que el perfil tiene `status = 'pending'`

### Test 2: Activación de Usuario

1. Login como admin
2. Ir a User Management
3. Activar un usuario pendiente con rol "viewer"
4. Verificar que el usuario puede acceder

### Test 3: Suspensión de Usuario

1. Como admin, suspender un usuario activo
2. El usuario debe ver pantalla de "Cuenta Suspendida"
3. No puede acceder a ningún dato

### Test 4: RLS Enforcement

1. Como usuario no activo, intentar acceder a datos vía API:
   ```javascript
   const { data } = await supabase.from('Facturas_Compras').select('*');
   ```
2. Debe retornar array vacío o error de permisos

---

## 🔧 TROUBLESHOOTING

### Problema: "Tu perfil está siendo creado"

**Causa:** El trigger no se ejecutó o hay un error en la función
**Solución:**
```sql
-- Verificar que el trigger existe
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';

-- Crear perfil manualmente si es necesario
INSERT INTO profiles (user_id, email, full_name, role, status)
VALUES (
  'user-uuid-here',
  'user@email.com',
  'User Name',
  'viewer',
  'pending'
);
```

### Problema: Admin no puede activar usuarios

**Causa:** El admin no tiene `status = 'active'` o `role != 'admin'`
**Solución:**
```sql
-- Verificar estado del admin
SELECT * FROM profiles WHERE email = 'admin@kore.com';

-- Activar manualmente si es necesario
UPDATE profiles 
SET status = 'active', role = 'admin', activated_at = NOW()
WHERE email = 'admin@kore.com';
```

### Problema: Usuario activo no puede ver datos

**Causa:** RLS policies no aplicadas correctamente
**Solución:**
```sql
-- Verificar que is_user_active() funciona
SELECT public.is_user_active('user-uuid-here');

-- Debe retornar true para usuarios activos

-- Verificar políticas
SELECT * FROM pg_policies WHERE tablename = 'Facturas_Compras';
```

---

## 📊 QUERIES ÚTILES

### Ver todos los usuarios pendientes
```sql
SELECT * FROM pending_users;
```

### Ver estadísticas de usuarios
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/3600) as avg_hours_pending
FROM profiles
GROUP BY status;
```

### Activar usuario manualmente (como admin)
```sql
SELECT activate_user('user-uuid-here', 'viewer');
```

### Ver historial de activaciones
```sql
SELECT 
  p.email,
  p.status,
  p.role,
  p.activated_at,
  a.email as activated_by_email
FROM profiles p
LEFT JOIN auth.users a ON p.activated_by = a.id
WHERE p.activated_at IS NOT NULL
ORDER BY p.activated_at DESC;
```

---

## 🎨 PERSONALIZACIÓN DE UI

### Cambiar Colores de Estado

En `UserManagement.tsx` y `AuthGuard.tsx`:

```typescript
const styles = {
  pending: 'bg-amber-500/20 text-amber-500',    // Pendiente
  active: 'bg-green-500/20 text-green-500',     // Activo
  suspended: 'bg-orange-500/20 text-orange-500', // Suspendido
  rejected: 'bg-red-500/20 text-red-500'        // Rechazado
};
```

### Agregar Campos Adicionales

Si necesitas más información en los perfiles:

1. **Agregar columna en Supabase:**
   ```sql
   ALTER TABLE profiles ADD COLUMN phone TEXT;
   ```

2. **Actualizar interfaz TypeScript:**
   ```typescript
   interface UserProfile {
     // ... campos existentes
     phone?: string;
   }
   ```

3. **Mostrar en UI de gestión**

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Script SQL ejecutado en Supabase
- [ ] Email de admin actualizado en script
- [ ] Primer usuario admin creado y activado
- [ ] AuthGuard funcionando (probar con nuevo usuario)
- [ ] Botón de User Management agregado al Dashboard
- [ ] Email de soporte actualizado en AuthGuard
- [ ] RLS policies verificadas
- [ ] Función `is_user_active()` funcionando
- [ ] Función `activate_user()` funcionando
- [ ] Probado flujo completo: registro → activación → acceso

---

## 🆘 SOPORTE

Si encuentras problemas:

1. **Verificar logs de Supabase:** Dashboard → Logs
2. **Verificar consola del navegador:** Errores de JavaScript
3. **Verificar RLS:** Intentar queries directas en SQL Editor
4. **Revisar permisos:** Verificar que el admin tiene los permisos correctos

---

**¡Sistema de autorización manual implementado exitosamente!** 🎉

Todos los nuevos usuarios ahora requerirán activación manual antes de poder acceder a la aplicación.
