# 📧 CONFIGURACIÓN DE NOTIFICACIONES POR EMAIL

## 🎯 OBJETIVO

Configurar el sistema para que:
1. ✅ Los usuarios puedan registrarse SIN confirmar email
2. ✅ Se envíe un email a `casainteligentemgta@gmail.com` cuando un nuevo usuario se registre
3. ✅ El admin pueda activar usuarios desde el panel

---

## 📋 PASOS DE CONFIGURACIÓN

### PASO 1: Desactivar Confirmación de Email en Supabase ⚠️ **CRÍTICO**

1. **Ir a Supabase Dashboard**
   - URL: https://app.supabase.com/project/[tu-proyecto-id]

2. **Navegar a Authentication → Settings**
   - Click en el menú lateral: **Authentication**
   - Click en: **Settings**

3. **Desactivar "Confirm email"**
   - Buscar la sección: **Email Auth**
   - Encontrar el toggle: **"Confirm email"**
   - **DESACTIVAR** este toggle ❌
   - Click en **Save** al final de la página

**Resultado:** Los usuarios ahora pueden registrarse y acceder inmediatamente sin confirmar email.

---

### PASO 2: Ejecutar Script SQL para Notificaciones

1. **Ir a Supabase Dashboard → SQL Editor**

2. **Copiar y pegar el contenido de:** `supabase_email_notifications.sql`

3. **Ejecutar el script**

4. **Verificar que se crearon:**
   ```sql
   -- Verificar tabla de notificaciones
   SELECT * FROM admin_notifications;
   
   -- Verificar trigger
   SELECT tgname FROM pg_trigger WHERE tgname = 'on_new_user_notify_admin';
   ```

---

### PASO 3: Configurar Resend para Envío de Emails

**¿Por qué Resend?**
- ✅ Gratis hasta 3,000 emails/mes
- ✅ Fácil de configurar
- ✅ API simple
- ✅ Mejor deliverability que Gmail SMTP

#### 3.1. Crear Cuenta en Resend

1. **Ir a:** https://resend.com/signup
2. **Registrarse** con tu email
3. **Verificar** tu email

#### 3.2. Obtener API Key

1. **Ir a:** https://resend.com/api-keys
2. **Click en:** "Create API Key"
3. **Nombre:** "KORE Notifications"
4. **Permisos:** "Sending access"
5. **Copiar la API Key** (solo se muestra una vez)

#### 3.3. Configurar API Key en Supabase

1. **Ir a Supabase Dashboard → Project Settings → Edge Functions**
2. **Secrets → Add new secret**
3. **Agregar:**
   ```
   Name: RESEND_API_KEY
   Value: [tu-api-key-de-resend]
   ```
4. **Save**

---

### PASO 4: Desplegar Edge Function

#### 4.1. Instalar Supabase CLI (si no lo tienes)

```bash
# Windows (PowerShell)
npm install -g supabase

# Verificar instalación
supabase --version
```

#### 4.2. Inicializar Supabase en tu proyecto

```bash
# En la raíz de tu proyecto
cd "c:\Users\matal\Desktop\ANTIGRAVITY\GestinadoR Integral Corporativo\gestionintegralcorporativa"

# Login a Supabase
supabase login

# Link a tu proyecto
supabase link --project-ref iwrowjywohgwvtvdubhp
```

#### 4.3. Desplegar la Edge Function

```bash
# Desplegar la función
supabase functions deploy send-admin-notifications

# Verificar que se desplegó
supabase functions list
```

#### 4.4. Configurar Variables de Entorno

```bash
# Configurar RESEND_API_KEY
supabase secrets set RESEND_API_KEY=tu-api-key-aqui

# Configurar URL del dashboard (opcional)
supabase secrets set DASHBOARD_URL=https://gestionintegralcorporativa.netlify.app

# Ver secretos configurados
supabase secrets list
```

---

### PASO 5: Configurar Webhook o Cron Job

Tienes dos opciones para ejecutar la Edge Function:

#### **Opción A: Webhook (Recomendado - Instantáneo)**

1. **Ir a Supabase Dashboard → Database → Webhooks**
2. **Create a new webhook**
3. **Configurar:**
   ```
   Name: notify-admin-new-user
   Table: auth.users
   Events: INSERT
   Type: HTTP Request
   Method: POST
   URL: https://iwrowjywohgwvtvdubhp.supabase.co/functions/v1/send-admin-notifications
   HTTP Headers:
     Authorization: Bearer [tu-anon-key]
   ```
4. **Save**

**Resultado:** Cada vez que un usuario se registre, se enviará el email inmediatamente.

#### **Opción B: Cron Job (Cada X minutos)**

1. **Ir a Supabase Dashboard → Database → Cron Jobs**
2. **Create a new cron job**
3. **Configurar:**
   ```
   Name: send-pending-notifications
   Schedule: */5 * * * * (cada 5 minutos)
   SQL:
   SELECT net.http_post(
     url := 'https://iwrowjywohgwvtvdubhp.supabase.co/functions/v1/send-admin-notifications',
     headers := '{"Authorization": "Bearer [tu-anon-key]"}'::jsonb
   );
   ```
4. **Save**

**Resultado:** Cada 5 minutos, se verificarán notificaciones pendientes y se enviarán.

---

### PASO 6: Probar el Sistema

#### 6.1. Crear Usuario de Prueba

1. **Ir a tu aplicación**
2. **Registrar nuevo usuario:**
   - Email: `test@example.com`
   - Password: `Test123!`
   - Nombre: `Usuario de Prueba`

#### 6.2. Verificar Notificación en Base de Datos

```sql
-- Ver notificaciones pendientes
SELECT * FROM admin_notifications WHERE sent = false;
```

#### 6.3. Ejecutar Edge Function Manualmente (para probar)

```bash
# Desde terminal
curl -X POST \
  'https://iwrowjywohgwvtvdubhp.supabase.co/functions/v1/send-admin-notifications' \
  -H 'Authorization: Bearer [tu-anon-key]'
```

O desde Supabase Dashboard:
1. **Edge Functions → send-admin-notifications**
2. **Click "Invoke"**

#### 6.4. Verificar Email

1. **Revisar inbox de:** `casainteligentemgta@gmail.com`
2. **Deberías recibir un email con:**
   - Asunto: "🔔 Nuevo Usuario Registrado - Requiere Activación"
   - Información del usuario
   - Botón para ir al panel de administración

---

## 🎨 PERSONALIZACIÓN DEL EMAIL

### Cambiar el Email de Destino

En `supabase_email_notifications.sql`, línea 23:
```sql
admin_email TEXT := 'tu-nuevo-email@ejemplo.com';
```

En `supabase/functions/send-admin-notifications/index.ts`, línea 60:
```typescript
to: ['tu-nuevo-email@ejemplo.com'],
```

### Cambiar el Remitente (Requiere Dominio Verificado)

1. **Verificar dominio en Resend:**
   - Ir a: https://resend.com/domains
   - Agregar tu dominio
   - Configurar DNS records

2. **Actualizar en Edge Function:**
   ```typescript
   from: 'KORE System <notificaciones@tudominio.com>',
   ```

### Personalizar el Diseño del Email

Editar la función `generateEmailHTML()` en el Edge Function.

---

## 🔍 TROUBLESHOOTING

### Problema: No llega el email

**Verificar:**

1. **API Key configurada:**
   ```bash
   supabase secrets list
   ```

2. **Notificación creada en BD:**
   ```sql
   SELECT * FROM admin_notifications ORDER BY created_at DESC LIMIT 5;
   ```

3. **Edge Function desplegada:**
   ```bash
   supabase functions list
   ```

4. **Logs de Edge Function:**
   - Ir a: Supabase Dashboard → Edge Functions → send-admin-notifications → Logs

5. **Ejecutar manualmente:**
   ```bash
   curl -X POST 'https://iwrowjywohgwvtvdubhp.supabase.co/functions/v1/send-admin-notifications' \
     -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
   ```

### Problema: Email va a spam

**Soluciones:**

1. **Usar dominio verificado** en Resend (no `onboarding@resend.dev`)
2. **Configurar SPF, DKIM, DMARC** en tu dominio
3. **Agregar `casainteligentemgta@gmail.com` a contactos**

### Problema: Usuario no puede registrarse

**Verificar:**

1. **Confirmación de email desactivada:**
   - Supabase Dashboard → Authentication → Settings
   - "Confirm email" debe estar **OFF** ❌

2. **Trigger de perfil funcionando:**
   ```sql
   SELECT * FROM profiles ORDER BY created_at DESC LIMIT 5;
   ```

---

## 📊 MONITOREO

### Ver Estadísticas de Notificaciones

```sql
-- Total de notificaciones
SELECT 
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE sent = true) as enviadas,
  COUNT(*) FILTER (WHERE sent = false) as pendientes
FROM admin_notifications;

-- Notificaciones por día
SELECT 
  DATE(created_at) as fecha,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE sent = true) as enviadas
FROM admin_notifications
GROUP BY DATE(created_at)
ORDER BY fecha DESC;
```

### Ver Logs de Resend

1. **Ir a:** https://resend.com/emails
2. **Ver todos los emails enviados**
3. **Click en un email para ver detalles**

---

## 💰 COSTOS

### Resend (Recomendado)
- ✅ **Gratis:** 3,000 emails/mes
- ✅ **$20/mes:** 50,000 emails/mes
- ✅ **Sin límite de destinatarios**

### Alternativas

#### SendGrid
- ✅ **Gratis:** 100 emails/día
- ❌ Requiere verificación de dominio

#### Mailgun
- ✅ **Gratis:** 5,000 emails/mes (primeros 3 meses)
- ❌ Requiere tarjeta de crédito

---

## ✅ CHECKLIST FINAL

- [ ] Confirmación de email desactivada en Supabase
- [ ] Script SQL ejecutado (`supabase_email_notifications.sql`)
- [ ] Cuenta de Resend creada
- [ ] API Key de Resend obtenida
- [ ] API Key configurada en Supabase Secrets
- [ ] Supabase CLI instalado
- [ ] Edge Function desplegada
- [ ] Webhook o Cron Job configurado
- [ ] Email de destino actualizado
- [ ] Sistema probado con usuario de prueba
- [ ] Email recibido en casainteligentemgta@gmail.com

---

## 🎉 RESULTADO FINAL

Cuando un usuario se registre:

1. ✅ **Usuario puede acceder inmediatamente** (sin confirmar email)
2. ✅ **Se crea perfil con status='pending'**
3. ✅ **AuthGuard muestra pantalla "Cuenta Pendiente"**
4. ✅ **Se crea notificación en `admin_notifications`**
5. ✅ **Edge Function envía email a `casainteligentemgta@gmail.com`**
6. ✅ **Admin recibe email con información del usuario**
7. ✅ **Admin puede activar desde User Management**

---

**¿Necesitas ayuda con algún paso específico?** 🚀
