# 📧 SOLUCIÓN RÁPIDA: Notificaciones con Gmail

## ⚡ CONFIGURACIÓN RÁPIDA (15 minutos)

Si prefieres una solución más rápida sin configurar Resend, puedes usar directamente Gmail SMTP.

---

## 📋 PASOS

### PASO 1: Desactivar Confirmación de Email en Supabase

1. **Ir a:** https://app.supabase.com/project/iwrowjywohgwvtvdubhp/auth/settings
2. **Buscar:** "Email Auth" section
3. **Desactivar:** "Confirm email" toggle ❌
4. **Click:** Save

**✅ Resultado:** Los usuarios ya pueden registrarse sin confirmar email.

---

### PASO 2: Generar App Password de Gmail

1. **Ir a:** https://myaccount.google.com/apppasswords
2. **Login con:** casainteligentemgta@gmail.com
3. **Crear App Password:**
   - Nombre: "KORE Notifications"
   - Click "Create"
4. **Copiar el password** (16 caracteres, sin espacios)

**Ejemplo:** `abcd efgh ijkl mnop` → Copiar como `abcdefghijklmnop`

---

### PASO 3: Ejecutar Script SQL

1. **Ir a:** Supabase Dashboard → SQL Editor
2. **Copiar contenido de:** `supabase_email_notifications.sql`
3. **Ejecutar**

---

### PASO 4: Crear Edge Function Simplificada con Gmail

Voy a crear una versión que usa Gmail directamente:

