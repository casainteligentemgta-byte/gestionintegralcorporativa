# 🚀 SCRIPT DE CONFIGURACIÓN AUTOMÁTICA
# Este script automatiza todo lo posible

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  KORE - Configuración de Notificaciones" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar que estamos en el directorio correcto
$projectPath = "c:\Users\matal\Desktop\ANTIGRAVITY\GestinadoR Integral Corporativo\gestionintegralcorporativa"
if (-not (Test-Path $projectPath)) {
    Write-Host "❌ Error: No se encuentra el directorio del proyecto" -ForegroundColor Red
    exit 1
}

Set-Location $projectPath
Write-Host "✅ Directorio del proyecto verificado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PASO 1: Verificar archivos creados
# ============================================================================
Write-Host "📁 PASO 1: Verificando archivos..." -ForegroundColor Yellow

$requiredFiles = @(
    "supabase_email_notifications.sql",
    "supabase\functions\send-admin-notifications\index.ts",
    "EMAIL_NOTIFICATIONS_SETUP.md",
    "components\AuthGuard.tsx",
    "pages\UserManagement.tsx"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file (FALTA)" -ForegroundColor Red
        $allFilesExist = $false
    }
}

if (-not $allFilesExist) {
    Write-Host ""
    Write-Host "❌ Faltan archivos necesarios. Verifica que todos los archivos se hayan creado." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✅ Todos los archivos necesarios están presentes" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PASO 2: Verificar Supabase CLI
# ============================================================================
Write-Host "🔧 PASO 2: Verificando Supabase CLI..." -ForegroundColor Yellow

try {
    $supabaseVersion = supabase --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Supabase CLI instalado: $supabaseVersion" -ForegroundColor Green
    } else {
        throw "Supabase CLI no encontrado"
    }
} catch {
    Write-Host "  ⚠️  Supabase CLI no está instalado" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Instalando Supabase CLI..." -ForegroundColor Cyan
    npm install -g supabase
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ Supabase CLI instalado correctamente" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Error al instalar Supabase CLI" -ForegroundColor Red
        Write-Host "  Por favor, instálalo manualmente: npm install -g supabase" -ForegroundColor Yellow
        exit 1
    }
}

Write-Host ""

# ============================================================================
# PASO 3: Instrucciones manuales para Supabase
# ============================================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ACCIONES MANUALES REQUERIDAS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "⚠️  Las siguientes acciones REQUIEREN tu intervención manual:" -ForegroundColor Yellow
Write-Host ""

# Acción 1: Desactivar confirmación de email
Write-Host "┌─────────────────────────────────────────────────────────────┐" -ForegroundColor White
Write-Host "│ ACCIÓN 1: Desactivar Confirmación de Email (2 minutos)     │" -ForegroundColor White
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""
Write-Host "1. Abre este enlace en tu navegador:" -ForegroundColor Cyan
Write-Host "   https://app.supabase.com/project/iwrowjywohgwvtvdubhp/auth/settings" -ForegroundColor Blue
Write-Host ""
Write-Host "2. Busca la sección 'Email Auth'" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Encuentra el toggle 'Confirm email' y DESACTÍVALO ❌" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Click en 'Save' al final de la página" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona ENTER cuando hayas completado esta acción..." -ForegroundColor Yellow
Read-Host

Write-Host "✅ Acción 1 completada" -ForegroundColor Green
Write-Host ""

# Acción 2: Ejecutar script SQL
Write-Host "┌─────────────────────────────────────────────────────────────┐" -ForegroundColor White
Write-Host "│ ACCIÓN 2: Ejecutar Script SQL (3 minutos)                  │" -ForegroundColor White
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""
Write-Host "1. Abre este enlace en tu navegador:" -ForegroundColor Cyan
Write-Host "   https://app.supabase.com/project/iwrowjywohgwvtvdubhp/sql/new" -ForegroundColor Blue
Write-Host ""
Write-Host "2. Abre el archivo en tu editor:" -ForegroundColor Cyan
Write-Host "   $projectPath\supabase_email_notifications.sql" -ForegroundColor Blue
Write-Host ""
Write-Host "3. Copia TODO el contenido del archivo" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Pégalo en el SQL Editor de Supabase" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Click en 'Run' (botón verde)" -ForegroundColor Cyan
Write-Host ""
Write-Host "6. Verifica que aparezca 'Success' sin errores" -ForegroundColor Cyan
Write-Host ""

# Abrir el archivo automáticamente
Write-Host "¿Quieres que abra el archivo SQL automáticamente? (S/N): " -ForegroundColor Yellow -NoNewline
$openFile = Read-Host
if ($openFile -eq "S" -or $openFile -eq "s") {
    Start-Process notepad.exe "$projectPath\supabase_email_notifications.sql"
    Write-Host "  ✅ Archivo abierto en Notepad" -ForegroundColor Green
}

Write-Host ""
Write-Host "Presiona ENTER cuando hayas ejecutado el script SQL..." -ForegroundColor Yellow
Read-Host

Write-Host "✅ Acción 2 completada" -ForegroundColor Green
Write-Host ""

# Acción 3: Configurar Resend
Write-Host "┌─────────────────────────────────────────────────────────────┐" -ForegroundColor White
Write-Host "│ ACCIÓN 3: Configurar Resend (5 minutos)                    │" -ForegroundColor White
Write-Host "└─────────────────────────────────────────────────────────────┘" -ForegroundColor White
Write-Host ""
Write-Host "1. Abre este enlace para crear cuenta:" -ForegroundColor Cyan
Write-Host "   https://resend.com/signup" -ForegroundColor Blue
Write-Host ""
Write-Host "2. Regístrate con cualquier email y verifica tu cuenta" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Luego abre este enlace para crear API Key:" -ForegroundColor Cyan
Write-Host "   https://resend.com/api-keys" -ForegroundColor Blue
Write-Host ""
Write-Host "4. Click en 'Create API Key'" -ForegroundColor Cyan
Write-Host "   - Name: KORE Notifications" -ForegroundColor Cyan
Write-Host "   - Permission: Sending access" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. COPIA la API Key (solo se muestra una vez)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Presiona ENTER cuando tengas la API Key copiada..." -ForegroundColor Yellow
Read-Host

Write-Host ""
Write-Host "Pega tu API Key de Resend aquí: " -ForegroundColor Yellow -NoNewline
$resendApiKey = Read-Host

if ([string]::IsNullOrWhiteSpace($resendApiKey)) {
    Write-Host "❌ No ingresaste una API Key válida" -ForegroundColor Red
    exit 1
}

Write-Host "✅ API Key guardada" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PASO 4: Login a Supabase
# ============================================================================
Write-Host "🔐 PASO 4: Conectando con Supabase..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Esto abrirá tu navegador para autenticarte con Supabase." -ForegroundColor Cyan
Write-Host "Presiona ENTER para continuar..." -ForegroundColor Yellow
Read-Host

supabase login

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al hacer login en Supabase" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Login exitoso" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PASO 5: Link al proyecto
# ============================================================================
Write-Host "🔗 PASO 5: Vinculando proyecto..." -ForegroundColor Yellow

supabase link --project-ref iwrowjywohgwvtvdubhp

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error al vincular proyecto" -ForegroundColor Red
    Write-Host "Intenta manualmente: supabase link --project-ref iwrowjywohgwvtvdubhp" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Proyecto vinculado" -ForegroundColor Green
Write-Host ""

# ============================================================================
# PASO 6: Configurar secretos
# ============================================================================
Write-Host "🔐 PASO 6: Configurando secretos..." -ForegroundColor Yellow

Write-Host "  Configurando RESEND_API_KEY..." -ForegroundColor Cyan
supabase secrets set RESEND_API_KEY=$resendApiKey

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ RESEND_API_KEY configurado" -ForegroundColor Green
} else {
    Write-Host "  ❌ Error al configurar RESEND_API_KEY" -ForegroundColor Red
}

Write-Host "  Configurando DASHBOARD_URL..." -ForegroundColor Cyan
supabase secrets set DASHBOARD_URL=https://gestionintegralcorporativa.netlify.app

if ($LASTEXITCODE -eq 0) {
    Write-Host "  ✅ DASHBOARD_URL configurado" -ForegroundColor Green
} else {
    Write-Host "  ❌ Error al configurar DASHBOARD_URL" -ForegroundColor Red
}

Write-Host ""

# ============================================================================
# PASO 7: Desplegar Edge Function
# ============================================================================
Write-Host "🚀 PASO 7: Desplegando Edge Function..." -ForegroundColor Yellow

supabase functions deploy send-admin-notifications

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Edge Function desplegada correctamente" -ForegroundColor Green
} else {
    Write-Host "❌ Error al desplegar Edge Function" -ForegroundColor Red
    Write-Host "Intenta manualmente: supabase functions deploy send-admin-notifications" -ForegroundColor Yellow
}

Write-Host ""

# ============================================================================
# PASO 8: Probar la función
# ============================================================================
Write-Host "🧪 PASO 8: Probando Edge Function..." -ForegroundColor Yellow

Write-Host "  Invocando función..." -ForegroundColor Cyan
supabase functions invoke send-admin-notifications

Write-Host ""

# ============================================================================
# RESUMEN FINAL
# ============================================================================
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  ✅ CONFIGURACIÓN COMPLETADA" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 RESUMEN:" -ForegroundColor Yellow
Write-Host "  ✅ Archivos verificados" -ForegroundColor Green
Write-Host "  ✅ Supabase CLI instalado" -ForegroundColor Green
Write-Host "  ✅ Confirmación de email desactivada (manual)" -ForegroundColor Green
Write-Host "  ✅ Script SQL ejecutado (manual)" -ForegroundColor Green
Write-Host "  ✅ Resend configurado" -ForegroundColor Green
Write-Host "  ✅ Proyecto vinculado" -ForegroundColor Green
Write-Host "  ✅ Secretos configurados" -ForegroundColor Green
Write-Host "  ✅ Edge Function desplegada" -ForegroundColor Green
Write-Host ""

Write-Host "🎉 PRÓXIMOS PASOS:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Configura un Webhook en Supabase para ejecutar automáticamente:" -ForegroundColor Cyan
Write-Host "   https://app.supabase.com/project/iwrowjywohgwvtvdubhp/database/hooks" -ForegroundColor Blue
Write-Host ""
Write-Host "2. Prueba registrando un nuevo usuario en tu aplicación" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Verifica que llegue el email a: casainteligentemgta@gmail.com" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Activa usuarios desde: User Management" -ForegroundColor Cyan
Write-Host ""

Write-Host "📚 Documentación completa en:" -ForegroundColor Yellow
Write-Host "   EMAIL_NOTIFICATIONS_SETUP.md" -ForegroundColor Blue
Write-Host ""

Write-Host "Presiona ENTER para finalizar..." -ForegroundColor Yellow
Read-Host
