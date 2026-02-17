# 🏢 SISTEMA MULTI-TENANT - GUÍA DE IMPLEMENTACIÓN

## 🎯 ¿QUÉ SE HA IMPLEMENTADO?

Un sistema completo de **Multi-Tenant (Multi-Inquilino)** donde:

✅ Cada usuario registra su propia compañía
✅ Los datos están completamente aislados por compañía
✅ Cada usuario solo ve los datos de SU compañía
✅ `casainteligentemgta@gmail.com` es el **Super Admin** que ve TODO

---

## 📋 FLUJO DEL USUARIO

### 1. Usuario Nuevo se Registra
```
1. Usuario va a /login
2. Click en "Crear cuenta"
3. Ingresa email y password
4. Se crea cuenta en auth.users
5. Se crea perfil en profiles (sin company_id)
```

### 2. Primer Login - Setup de Compañía
```
1. Usuario hace login
2. AuthGuard detecta que no tiene company_id
3. Muestra pantalla "CompanySetup"
4. Usuario llena datos de su compañía:
   - Nombre de la compañía *
   - RIF
   - Email corporativo
   - Teléfono
   - Dirección
   - Ciudad
5. Click en "Comenzar a Usar KORE"
6. Se crea registro en tabla `companies`
7. Se actualiza `profiles.company_id` con la nueva compañía
8. Se marca `profiles.is_company_owner = true`
9. Se activa automáticamente: `profiles.status = 'active'`
10. Usuario entra a la aplicación
```

### 3. Uso Normal
```
- Usuario crea facturas → Automáticamente tienen su company_id
- Usuario crea inventario → Automáticamente tiene su company_id
- Usuario solo ve SUS datos (RLS filtra por company_id)
- Otros usuarios NO ven estos datos
```

---

## 👑 SUPER ADMIN (casainteligentemgta@gmail.com)

El Super Admin tiene privilegios especiales:

✅ **Ve TODAS las compañías** (no solo la suya)
✅ **Ve TODOS los datos** de todas las compañías
✅ **Puede gestionar suscripciones**
✅ **Puede activar/suspender usuarios**
✅ **Puede crear compañías para otros usuarios**

### Cómo funciona:
- La función `is_super_admin()` verifica si el email es `casainteligentemgta@gmail.com`
- Todas las RLS policies incluyen: `public.is_super_admin() OR ...`
- Si es super admin, se salta las restricciones de company_id

---

## 🗄️ ESTRUCTURA DE BASE DE DATOS

### Tabla: `companies`
```sql
id                  UUID PRIMARY KEY
name                TEXT NOT NULL
rif                 TEXT UNIQUE
email               TEXT
phone               TEXT
address             TEXT
city                TEXT
country             TEXT DEFAULT 'Venezuela'
logo_url            TEXT
subscription_status TEXT DEFAULT 'trial'
subscription_plan   TEXT DEFAULT 'basic'
trial_ends_at       TIMESTAMPTZ DEFAULT (NOW() + 30 days)
created_at          TIMESTAMPTZ
updated_at          TIMESTAMPTZ
```

### Tabla: `profiles` (actualizada)
```sql
...campos existentes...
company_id          UUID REFERENCES companies(id)
is_company_owner    BOOLEAN DEFAULT FALSE
```

### Tablas con `company_id` agregado:
- ✅ `Facturas_Compras`
- ✅ `inventory_master`
- ✅ `inventory_movements`
- ✅ `Empresas`
- ✅ `Obreros`
- ✅ `purchase_orders`
- ✅ `suppliers`

---

## 🔐 ROW LEVEL SECURITY (RLS)

Cada tabla tiene 4 policies:

### 1. SELECT (Ver datos)
```sql
public.is_super_admin() OR company_id = public.get_user_company_id()
```
- Super admin ve TODO
- Usuarios normales solo ven su compañía

### 2. INSERT (Crear datos)
```sql
public.is_super_admin() OR company_id = public.get_user_company_id()
```
- Super admin puede insertar en cualquier compañía
- Usuarios solo en su compañía

### 3. UPDATE (Actualizar datos)
```sql
USING: public.is_super_admin() OR company_id = public.get_user_company_id()
WITH CHECK: public.is_super_admin() OR company_id = public.get_user_company_id()
```

### 4. DELETE (Eliminar datos)
```sql
public.is_super_admin() OR company_id = public.get_user_company_id()
```

---

## 🚀 PASOS DE IMPLEMENTACIÓN

### PASO 1: Ejecutar Script SQL

1. **Ir a Supabase Dashboard → SQL Editor**
   ```
   https://app.supabase.com/project/iwrowjywohgwvtvdubhp/sql/new
   ```

2. **Abrir el archivo:**
   ```
   supabase_multi_tenant_setup.sql
   ```

3. **Copiar TODO el contenido**

4. **Pegar en SQL Editor**

5. **Click en RUN**

6. **Verificar que dice "Success"**

### PASO 2: Verificar Implementación

Ejecuta estos queries para verificar:

```sql
-- Ver tabla companies
SELECT * FROM companies;

-- Ver si profiles tiene company_id
SELECT user_id, email, company_id, is_company_owner 
FROM profiles 
LIMIT 5;

-- Ver funciones creadas
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('is_super_admin', 'get_user_company_id', 'create_company_and_assign');

-- Ver RLS policies
SELECT tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename;
```

### PASO 3: Probar el Flujo

1. **Cerrar sesión** de tu usuario actual

2. **Registrar nuevo usuario de prueba:**
   - Email: `test@empresa1.com`
   - Password: `Test123!`

3. **Hacer login con ese usuario**

4. **Deberías ver la pantalla "Bienvenido a KORE"**

5. **Llenar datos de la compañía:**
   - Nombre: "Empresa de Prueba 1"
   - RIF: "J-12345678-9"
   - etc.

6. **Click en "Comenzar a Usar KORE"**

7. **Deberías entrar a la aplicación**

8. **Crear una factura de prueba**

9. **Cerrar sesión**

10. **Registrar OTRO usuario:**
    - Email: `test@empresa2.com`
    - Password: `Test123!`

11. **Hacer login**

12. **Crear SU compañía** (diferente)

13. **Verificar que NO ve la factura del usuario anterior** ✅

---

## 🔍 TROUBLESHOOTING

### Problema: "User already has a company assigned"

**Causa:** Intentas crear compañía pero ya tienes una asignada

**Solución:**
```sql
-- Ver tu company_id actual
SELECT company_id FROM profiles WHERE email = 'tu-email@ejemplo.com';

-- Si necesitas resetear (solo para testing)
UPDATE profiles SET company_id = NULL, is_company_owner = FALSE 
WHERE email = 'tu-email@ejemplo.com';
```

### Problema: No veo ningún dato

**Causa:** Tus datos existentes no tienen `company_id`

**Solución:**
```sql
-- Asignar company_id a datos existentes
UPDATE Facturas_Compras 
SET company_id = (SELECT company_id FROM profiles WHERE email = 'tu-email@ejemplo.com')
WHERE company_id IS NULL;

-- Repetir para cada tabla
UPDATE inventory_master SET company_id = ...
UPDATE Empresas SET company_id = ...
-- etc.
```

### Problema: Super admin no ve todas las compañías

**Causa:** El email no coincide exactamente

**Solución:**
```sql
-- Verificar email exacto
SELECT email FROM profiles WHERE user_id = auth.uid();

-- Debe ser exactamente: casainteligentemgta@gmail.com
```

---

## 📊 QUERIES ÚTILES

### Ver todas las compañías (como super admin)
```sql
SELECT 
  c.id,
  c.name,
  c.rif,
  c.subscription_status,
  c.trial_ends_at,
  COUNT(p.user_id) as total_users
FROM companies c
LEFT JOIN profiles p ON p.company_id = c.id
GROUP BY c.id
ORDER BY c.created_at DESC;
```

### Ver usuarios por compañía
```sql
SELECT 
  c.name as company_name,
  p.email,
  p.full_name,
  p.role,
  p.status,
  p.is_company_owner
FROM profiles p
JOIN companies c ON p.company_id = c.id
ORDER BY c.name, p.is_company_owner DESC;
```

### Ver datos por compañía
```sql
SELECT 
  c.name as company_name,
  COUNT(DISTINCT f.id) as total_facturas,
  COUNT(DISTINCT i.id) as total_items_inventario,
  COUNT(DISTINCT o.id) as total_obreros
FROM companies c
LEFT JOIN Facturas_Compras f ON f.company_id = c.id
LEFT JOIN inventory_master i ON i.company_id = c.id
LEFT JOIN Obreros o ON o.company_id = c.id
GROUP BY c.id, c.name
ORDER BY c.name;
```

---

## 🎨 PERSONALIZACIÓN

### Cambiar período de prueba

En `supabase_multi_tenant_setup.sql`, línea 16:
```sql
trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
```

Cambiar `30 days` por el período deseado.

### Agregar más campos a companies

```sql
ALTER TABLE companies ADD COLUMN industry TEXT;
ALTER TABLE companies ADD COLUMN employee_count INTEGER;
ALTER TABLE companies ADD COLUMN website TEXT;
```

### Agregar company_id a nuevas tablas

```sql
-- Para cualquier tabla nueva
ALTER TABLE mi_nueva_tabla ADD COLUMN company_id UUID REFERENCES companies(id);
CREATE INDEX idx_mi_nueva_tabla_company ON mi_nueva_tabla(company_id);

-- Agregar trigger
CREATE TRIGGER set_company_id_trigger 
BEFORE INSERT ON mi_nueva_tabla 
FOR EACH ROW 
EXECUTE FUNCTION set_company_id();

-- Agregar RLS
ALTER TABLE mi_nueva_tabla ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their company data" ON mi_nueva_tabla
FOR SELECT TO authenticated
USING (public.is_super_admin() OR company_id = public.get_user_company_id());

-- Repetir para INSERT, UPDATE, DELETE
```

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

- [ ] Script SQL ejecutado sin errores
- [ ] Tabla `companies` creada
- [ ] Columna `company_id` agregada a `profiles`
- [ ] Columna `company_id` agregada a todas las tablas relevantes
- [ ] Funciones `is_super_admin()` y `get_user_company_id()` creadas
- [ ] RLS policies aplicadas a todas las tablas
- [ ] Componente `CompanySetup.tsx` creado
- [ ] `AuthGuard.tsx` actualizado
- [ ] Probado con 2 usuarios diferentes
- [ ] Verificado aislamiento de datos
- [ ] Super admin puede ver todo

---

## 🎉 RESULTADO FINAL

### Usuario Normal:
```
1. Se registra
2. Crea su compañía
3. Solo ve SUS datos
4. Otros usuarios NO ven sus datos
5. Período de prueba de 30 días
```

### Super Admin (casainteligentemgta@gmail.com):
```
1. Ve TODAS las compañías
2. Ve TODOS los datos
3. Puede gestionar suscripciones
4. Puede activar/suspender usuarios
5. Acceso total a la plataforma
```

---

**¿Listo para implementar?** 🚀

Sigue los pasos en orden y avísame si encuentras algún problema.
