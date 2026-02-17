# 🚀 GUÍA PASO A PASO - CONFIGURACIÓN COMPLETA

Sigue estos pasos EN ORDEN. Cada paso toma solo unos minutos.

---

## ✅ PASO 1: Desactivar Confirmación de Email (2 minutos)

### Acción:
1. **Abre este enlace en tu navegador:**
   ```
   https://app.supabase.com/project/iwrowjywohgwvtvdubhp/auth/settings
   ```

2. **Busca la sección:** "Email Auth"

3. **Encuentra el toggle:** "Confirm email"

4. **DESACTÍVALO** (debe quedar en OFF/gris)

5. **Scroll hasta abajo y click en:** "Save"

### ¿Qué logra esto?
✅ Los usuarios ya pueden registrarse sin confirmar email
✅ Verán la pantalla "Cuenta Pendiente" pero podrán acceder

---

## ✅ PASO 2: Ejecutar Script SQL (3 minutos)

### Acción:
1. **Abre este enlace en tu navegador:**
   ```
   https://app.supabase.com/project/iwrowjywohgwvtvdubhp/sql/new
   ```

2. **Abre el archivo en tu computadora:**
   ```
   c:\Users\matal\Desktop\ANTIGRAVITY\GestinadoR Integral Corporativo\gestionintegralcorporativa\supabase_email_notifications.sql
   ```
   
   Puedes abrirlo con:
   - Click derecho → Abrir con → Notepad
   - O cualquier editor de texto

3. **Selecciona TODO el contenido** (Ctrl+A)

4. **Cópialo** (Ctrl+C)

5. **Pégalo en el SQL Editor de Supabase** (Ctrl+V)

6. **Click en el botón verde "Run"** (esquina inferior derecha)

7. **Verifica que aparezca:** "Success" sin errores

### ¿Qué logra esto?
✅ Crea tabla `admin_notifications`
✅ Crea trigger automático cuando un usuario se registra
✅ Crea funciones helper para el sistema

---

## ✅ PASO 3: Crear Cuenta en Resend (5 minutos)

### Acción:
1. **Abre este enlace:**
   ```
   https://resend.com/signup
   ```

2. **Regístrate con cualquier email** (puede ser casainteligentemgta@gmail.com)

3. **Verifica tu email** (revisa tu inbox y click en el link)

4. **Una vez dentro, ve a:**
   ```
   https://resend.com/api-keys
   ```

5. **Click en:** "Create API Key"

6. **Configura:**
   - Name: `KORE Notifications`
   - Permission: `Sending access`

7. **Click:** "Create"

8. **COPIA la API Key** (se muestra solo una vez)
   - Ejemplo: `re_123abc456def789ghi`
   - Guárdala en un lugar seguro (la necesitarás en el siguiente paso)

### ¿Qué logra esto?
✅ Cuenta gratuita para enviar hasta 3,000 emails/mes
✅ API Key para que el sistema envíe emails

---

## ✅ PASO 4: Instalar Supabase CLI (2 minutos)

### Acción:
1. **Abre PowerShell o CMD**

2. **Ejecuta este comando:**
   ```bash
   npm install -g supabase
   ```

3. **Espera a que termine la instalación**

4. **Verifica que se instaló:**
   ```bash
   supabase --version
   ```
   
   Debe mostrar algo como: `1.x.x`

### ¿Qué logra esto?
✅ Herramienta para desplegar Edge Functions

---

## ✅ PASO 5: Login a Supabase (1 minuto)

### Acción:
1. **En PowerShell/CMD, ejecuta:**
   ```bash
   supabase login
   ```

2. **Se abrirá tu navegador automáticamente**

3. **Click en:** "Authorize"

4. **Vuelve a la terminal** - debe decir "Logged in"

### ¿Qué logra esto?
✅ Conecta tu terminal con tu cuenta de Supabase

---

## ✅ PASO 6: Vincular Proyecto (1 minuto)

### Acción:
1. **Navega a tu proyecto en la terminal:**
   ```bash
   cd "c:\Users\matal\Desktop\ANTIGRAVITY\GestinadoR Integral Corporativo\gestionintegralcorporativa"
   ```

2. **Vincula el proyecto:**
   ```bash
   supabase link --project-ref iwrowjywohgwvtvdubhp
   ```

3. **Si te pide password de base de datos:**
   - Ve a: https://app.supabase.com/project/iwrowjywohgwvtvdubhp/settings/database
   - Copia el "Database password"
   - Pégalo en la terminal

### ¿Qué logra esto?
✅ Conecta tu proyecto local con Supabase

---

## ✅ PASO 7: Configurar Secretos (2 minutos)

### Acción:
1. **Configura la API Key de Resend** (usa la que copiaste en PASO 3):
   ```bash
   supabase secrets set RESEND_API_KEY=tu-api-key-aqui
   ```
   
   Reemplaza `tu-api-key-aqui` con tu API Key real

2. **Configura la URL del dashboard:**
   ```bash
   supabase secrets set DASHBOARD_URL=https://gestionintegralcorporativa.netlify.app
   ```

3. **Verifica que se guardaron:**
   ```bash
   supabase secrets list
   ```

### ¿Qué logra esto?
✅ Guarda las credenciales de forma segura en Supabase

---

## ✅ PASO 8: Desplegar Edge Function (2 minutos)

### Acción:
1. **Asegúrate de estar en el directorio del proyecto:**
   ```bash
   cd "c:\Users\matal\Desktop\ANTIGRAVITY\GestinadoR Integral Corporativo\gestionintegralcorporativa"
   ```

2. **Despliega la función:**
   ```bash
   supabase functions deploy send-admin-notifications
   ```

3. **Espera a que termine** - debe decir "Deployed successfully"

### ¿Qué logra esto?
✅ Sube la función que enviará los emails a Supabase

---

## ✅ PASO 9: Probar la Función (1 minuto)

### Acción:
1. **Ejecuta la función manualmente para probar:**
   ```bash
   supabase functions invoke send-admin-notifications
   ```

2. **Debe responder:**
   ```json
   {
     "message": "No pending notifications"
   }
   ```
   
   Esto es normal porque aún no hay usuarios registrados

### ¿Qué logra esto?
✅ Verifica que la función está funcionando

---

## ✅ PASO 10: Configurar Webhook (OPCIONAL - 3 minutos)

Para que los emails se envíen AUTOMÁTICAMENTE cuando alguien se registre:

### Acción:
1. **Ve a:**
   ```
   https://app.supabase.com/project/iwrowjywohgwvtvdubhp/database/hooks
   ```

2. **Click en:** "Create a new hook"

3. **Configura:**
   - Name: `notify-admin-new-user`
   - Table: `auth.users`
   - Events: Marca solo `INSERT`
   - Type: `HTTP Request`
   - Method: `POST`
   - URL: `https://iwrowjywohgwvtvdubhp.supabase.co/functions/v1/send-admin-notifications`
   - HTTP Headers:
     ```
     Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cm93anl3b2hnd3Z0dmR1YmhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY3MjA4NzcsImV4cCI6MjA1MjI5Njg3N30.gkIQRhxqfTdBWHEJqWQQnqQQqQQqQQqQQqQQqQQqQQQ
     ```
     (Reemplaza con tu ANON_KEY de .env.local)

4. **Click:** "Create webhook"

### ¿Qué logra esto?
✅ Emails se envían AUTOMÁTICAMENTE al registrarse un usuario
✅ No necesitas ejecutar nada manualmente

---

## 🎉 ¡LISTO! PRUEBA EL SISTEMA

### Prueba Final:
1. **Registra un nuevo usuario en tu aplicación**
   - Email: test@example.com
   - Password: Test123!

2. **Verifica que:**
   - ✅ El usuario puede acceder (sin confirmar email)
   - ✅ Ve la pantalla "Cuenta Pendiente"
   - ✅ Recibes un email en casainteligentemgta@gmail.com

3. **Activa el usuario:**
   - Login como admin
   - Ve a User Management
   - Activa el usuario de prueba

4. **Verifica que:**
   - ✅ El usuario ahora tiene acceso completo

---

## 📊 RESUMEN DE COMANDOS

Si necesitas ejecutar todo de una vez, aquí están todos los comandos:

```bash
# 1. Instalar CLI
npm install -g supabase

# 2. Login
supabase login

# 3. Ir al proyecto
cd "c:\Users\matal\Desktop\ANTIGRAVITY\GestinadoR Integral Corporativo\gestionintegralcorporativa"

# 4. Vincular
supabase link --project-ref iwrowjywohgwvtvdubhp

# 5. Configurar secretos (reemplaza con tus valores)
supabase secrets set RESEND_API_KEY=tu-api-key-aqui
supabase secrets set DASHBOARD_URL=https://gestionintegralcorporativa.netlify.app

# 6. Desplegar
supabase functions deploy send-admin-notifications

# 7. Probar
supabase functions invoke send-admin-notifications
```

---

## 🆘 AYUDA

Si algo no funciona:

1. **Revisa los logs:**
   ```
   https://app.supabase.com/project/iwrowjywohgwvtvdubhp/functions/send-admin-notifications/logs
   ```

2. **Verifica secretos:**
   ```bash
   supabase secrets list
   ```

3. **Verifica que el SQL se ejecutó:**
   ```sql
   SELECT * FROM admin_notifications;
   ```

---

**¡Éxito! 🎉**
