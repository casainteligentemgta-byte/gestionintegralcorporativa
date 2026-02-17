// ============================================================================
// SUPABASE EDGE FUNCTION: Enviar Notificaciones de Nuevos Usuarios
// ============================================================================
// Este Edge Function envía emails a casainteligentemgta@gmail.com cuando
// hay nuevos usuarios registrados pendientes de activación
// ============================================================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Configuración de SMTP (usando Gmail)
const SMTP_CONFIG = {
    host: 'smtp.gmail.com',
    port: 587,
    username: Deno.env.get('GMAIL_USER') || 'casainteligentemgta@gmail.com',
    password: Deno.env.get('GMAIL_APP_PASSWORD') || '', // App Password de Gmail
    from: 'KORE System <casainteligentemgta@gmail.com>',
    to: 'casainteligentemgta@gmail.com'
}

serve(async (req) => {
    try {
        // Crear cliente de Supabase con service role
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        )

        // Obtener notificaciones pendientes
        const { data: notifications, error: fetchError } = await supabaseClient
            .from('admin_notifications')
            .select('*')
            .eq('sent', false)
            .order('created_at', { ascending: true })
            .limit(10) // Procesar máximo 10 a la vez

        if (fetchError) {
            throw new Error(`Error fetching notifications: ${fetchError.message}`)
        }

        if (!notifications || notifications.length === 0) {
            return new Response(
                JSON.stringify({ message: 'No pending notifications' }),
                {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' }
                }
            )
        }

        console.log(`Processing ${notifications.length} notifications...`)

        // Enviar email por cada notificación
        const results = []
        for (const notification of notifications) {
            try {
                // Enviar email usando API de Resend (alternativa a SMTP)
                const emailSent = await sendEmailViaResend(notification)

                if (emailSent) {
                    // Marcar como enviada
                    await supabaseClient
                        .from('admin_notifications')
                        .update({
                            sent: true,
                            sent_at: new Date().toISOString()
                        })
                        .eq('id', notification.id)

                    results.push({
                        id: notification.id,
                        status: 'sent',
                        email: notification.user_email
                    })
                } else {
                    results.push({
                        id: notification.id,
                        status: 'failed',
                        email: notification.user_email
                    })
                }
            } catch (error) {
                console.error(`Error sending notification ${notification.id}:`, error)
                results.push({
                    id: notification.id,
                    status: 'error',
                    email: notification.user_email,
                    error: error.message
                })
            }
        }

        return new Response(
            JSON.stringify({
                message: `Processed ${notifications.length} notifications`,
                results
            }),
            {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            }
        )

    } catch (error) {
        console.error('Edge Function Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            }
        )
    }
})

// ============================================================================
// Función para enviar email usando Resend API
// ============================================================================
async function sendEmailViaResend(notification: any): Promise<boolean> {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

    if (!RESEND_API_KEY) {
        console.error('RESEND_API_KEY not configured')
        return false
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                from: 'KORE System <onboarding@resend.dev>', // Cambiar cuando configures dominio
                to: ['casainteligentemgta@gmail.com'],
                subject: '🔔 Nuevo Usuario Registrado - Requiere Activación',
                html: generateEmailHTML(notification)
            })
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('Resend API Error:', error)
            return false
        }

        const result = await response.json()
        console.log('Email sent successfully:', result)
        return true

    } catch (error) {
        console.error('Error sending email via Resend:', error)
        return false
    }
}

// ============================================================================
// Generar HTML del email
// ============================================================================
function generateEmailHTML(notification: any): string {
    const dashboardUrl = Deno.env.get('DASHBOARD_URL') || 'https://tu-app.netlify.app'

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nuevo Usuario Registrado</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color: #1a1a1a; border-radius: 16px; overflow: hidden; border: 1px solid #2a2a2a;">
              
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 40px 30px; text-align: center;">
                  <h1 style="margin: 0; color: #000000; font-size: 28px; font-weight: 800; letter-spacing: -0.5px;">
                    🔔 Nuevo Usuario Registrado
                  </h1>
                  <p style="margin: 10px 0 0; color: #000000; opacity: 0.8; font-size: 14px; font-weight: 600;">
                    KORE Management Platform
                  </p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px;">
                  <p style="margin: 0 0 24px; color: #ffffff; font-size: 16px; line-height: 1.6;">
                    Un nuevo usuario se ha registrado en la plataforma y está esperando activación:
                  </p>
                  
                  <!-- User Info Card -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; border-radius: 12px; border: 1px solid #2a2a2a; margin-bottom: 24px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table width="100%" cellpadding="8" cellspacing="0">
                          <tr>
                            <td style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600;">
                              Nombre
                            </td>
                            <td style="color: #ffffff; font-size: 14px; font-weight: 500; text-align: right;">
                              ${notification.user_name || 'No especificado'}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; padding-top: 8px;">
                              Email
                            </td>
                            <td style="color: #10b981; font-size: 14px; font-weight: 600; text-align: right; padding-top: 8px;">
                              ${notification.user_email}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; padding-top: 8px;">
                              Fecha de Registro
                            </td>
                            <td style="color: #ffffff; font-size: 14px; font-weight: 500; text-align: right; padding-top: 8px;">
                              ${new Date(notification.created_at).toLocaleString('es-ES', {
        dateStyle: 'medium',
        timeStyle: 'short'
    })}
                            </td>
                          </tr>
                          <tr>
                            <td style="color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; padding-top: 8px;">
                              Estado
                            </td>
                            <td style="text-align: right; padding-top: 8px;">
                              <span style="display: inline-block; background-color: #f59e0b; color: #000000; padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px;">
                                Pendiente
                              </span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- Info Box -->
                  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #10b981; background-image: linear-gradient(135deg, #10b981 0%, #059669 100%); border-radius: 12px; margin-bottom: 32px;">
                    <tr>
                      <td style="padding: 20px;">
                        <table width="100%" cellpadding="0" cellspacing="0">
                          <tr>
                            <td width="40" valign="top">
                              <div style="width: 32px; height: 32px; background-color: rgba(0,0,0,0.2); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 20px;">
                                ℹ️
                              </div>
                            </td>
                            <td style="padding-left: 12px;">
                              <p style="margin: 0; color: #000000; font-size: 13px; font-weight: 600; line-height: 1.5;">
                                <strong>Acción Requerida:</strong><br>
                                Este usuario necesita ser activado manualmente antes de poder acceder a la plataforma. 
                                Inicia sesión en el panel de administración para revisar y activar esta cuenta.
                              </p>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <!-- CTA Button -->
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td align="center">
                        <a href="${dashboardUrl}" 
                           style="display: inline-block; background-color: #10b981; color: #000000; text-decoration: none; padding: 16px 32px; border-radius: 12px; font-size: 15px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                          🔓 Ir al Panel de Administración
                        </a>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #0a0a0a; padding: 24px 40px; border-top: 1px solid #2a2a2a;">
                  <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center; line-height: 1.6;">
                    Este es un email automático del sistema KORE Management Platform.<br>
                    No respondas a este email.
                  </p>
                </td>
              </tr>
              
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `
}
