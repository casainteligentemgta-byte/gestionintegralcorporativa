@echo off
chcp 65001 >nul
echo ========================================
echo   KORE - Configuracion de Notificaciones
echo ========================================
echo.

cd /d "c:\Users\matal\Desktop\ANTIGRAVITY\GestinadoR Integral Corporativo\gestionintegralcorporativa"

echo Verificando archivos necesarios...
echo.

if exist "supabase_email_notifications.sql" (
    echo [OK] supabase_email_notifications.sql
) else (
    echo [ERROR] Falta supabase_email_notifications.sql
    pause
    exit /b 1
)

if exist "supabase\functions\send-admin-notifications\index.ts" (
    echo [OK] Edge Function
) else (
    echo [ERROR] Falta Edge Function
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ACCIONES MANUALES REQUERIDAS
echo ========================================
echo.
echo IMPORTANTE: Necesitas completar 3 acciones manuales
echo.
echo.
echo ┌─────────────────────────────────────────────────────┐
echo │ ACCION 1: Desactivar Confirmacion de Email         │
echo └─────────────────────────────────────────────────────┘
echo.
echo 1. Abre este enlace:
echo    https://app.supabase.com/project/iwrowjywohgwvtvdubhp/auth/settings
echo.
echo 2. Busca "Email Auth" y desactiva "Confirm email"
echo.
echo 3. Click en Save
echo.
echo Presiona cualquier tecla cuando hayas completado esto...
pause >nul

echo.
echo [OK] Accion 1 completada
echo.
echo.
echo ┌─────────────────────────────────────────────────────┐
echo │ ACCION 2: Ejecutar Script SQL                      │
echo └─────────────────────────────────────────────────────┘
echo.
echo 1. Abre este enlace:
echo    https://app.supabase.com/project/iwrowjywohgwvtvdubhp/sql/new
echo.
echo 2. Abre el archivo: supabase_email_notifications.sql
echo.
echo 3. Copia TODO el contenido y pegalo en Supabase SQL Editor
echo.
echo 4. Click en Run
echo.
echo ¿Abrir el archivo SQL ahora? (S/N):
set /p openFile=
if /i "%openFile%"=="S" (
    notepad supabase_email_notifications.sql
)

echo.
echo Presiona cualquier tecla cuando hayas ejecutado el SQL...
pause >nul

echo.
echo [OK] Accion 2 completada
echo.
echo.
echo ┌─────────────────────────────────────────────────────┐
echo │ ACCION 3: Configurar Resend                        │
echo └─────────────────────────────────────────────────────┘
echo.
echo 1. Crea cuenta en: https://resend.com/signup
echo.
echo 2. Verifica tu email
echo.
echo 3. Ve a: https://resend.com/api-keys
echo.
echo 4. Crea una API Key llamada "KORE Notifications"
echo.
echo 5. COPIA la API Key
echo.
echo Presiona cualquier tecla cuando tengas la API Key...
pause >nul

echo.
echo Ingresa tu API Key de Resend:
set /p RESEND_KEY=

echo.
echo ========================================
echo   Configurando Supabase CLI
echo ========================================
echo.

echo Verificando Supabase CLI...
supabase --version >nul 2>&1
if errorlevel 1 (
    echo Instalando Supabase CLI...
    call npm install -g supabase
)

echo.
echo Iniciando sesion en Supabase...
echo (Se abrira tu navegador)
echo.
pause
call supabase login

echo.
echo Vinculando proyecto...
call supabase link --project-ref iwrowjywohgwvtvdubhp

echo.
echo Configurando secretos...
call supabase secrets set RESEND_API_KEY=%RESEND_KEY%
call supabase secrets set DASHBOARD_URL=https://gestionintegralcorporativa.netlify.app

echo.
echo Desplegando Edge Function...
call supabase functions deploy send-admin-notifications

echo.
echo ========================================
echo   CONFIGURACION COMPLETADA
echo ========================================
echo.
echo Proximos pasos:
echo.
echo 1. Prueba registrando un nuevo usuario
echo 2. Verifica el email en casainteligentemgta@gmail.com
echo 3. Activa usuarios desde User Management
echo.
echo Documentacion completa: EMAIL_NOTIFICATIONS_SETUP.md
echo.
pause
