
import React, { useState } from 'react';
import { supabase } from '../services/supabase';
import { getSafeRedirectUrl } from '../utils/security';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    // Critical check for environment variables
    if (!import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      alert('❌ ERROR DE CONFIGURACIÓN: Las llaves de Supabase no se han detectado en este despliegue. Por favor, ve a Netlify y realiza un "Clear cache and deploy site" desde la pestaña Deploys.');
      return;
    }

    if (isSignUp && password.length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (isSignUp && !username) {
      alert('Por favor, ingresa un nombre de usuario.');
      return;
    }

    setLoading(true);
    try {
      if (isSignUp) {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: getSafeRedirectUrl(),
            data: {
              full_name: username,
              username: username
            }
          }
        });
        if (error) throw error;

        if (data.user && data.session) {
          onLogin();
        } else {
          alert('Registro iniciado. Por favor, revisa tu correo electrónico para confirmar tu cuenta.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        onLogin();
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let msg = error.message;
      if (msg.includes('Email signups are disabled')) {
        msg = 'El registro por email está desactivado en Supabase. Actívalo en Auth > Providers > Email.';
      } else if (msg.includes('Invalid login credentials')) {
        msg = 'Correo o contraseña incorrectos.';
      }
      alert('Error: ' + msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: getSafeRedirectUrl()
        }
      });
      if (error) throw error;
    } catch (error) {
      console.error('Error logging in with Google:', error);
      alert('Error al iniciar sesión con Google.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      alert('Por favor ingresa tu correo electrónico.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getSafeRedirectUrl(),
      });
      if (error) throw error;
      alert('Se ha enviado un enlace de recuperación a tu correo electrónico.');
      setShowForgotPassword(false);
    } catch (error: any) {
      console.error('Reset password error:', error);
      alert('Error al enviar el correo de recuperación: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 relative overflow-hidden bg-stone-950">
      {/* Background Blobs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
      </div>

      <main className="relative z-10 w-full max-w-[360px] flex flex-col items-center">
        <div className="mb-8">
          <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center border border-white/10 backdrop-blur-xl">
            <span className="material-symbols-outlined text-primary text-4xl font-light">foundation</span>
          </div>
        </div>

        <div className="text-center mb-12">
          <h1 className="text-5xl font-extrabold tracking-tighter text-white mb-3 uppercase">
            {showForgotPassword ? 'Recuperar' : isSignUp ? 'Registro' : 'Bienvenidos'}
          </h1>
          <p className="text-white/60 text-[15px] font-medium tracking-wide">
            {showForgotPassword ? 'Ingresa tu correo para restablecer tu contraseña' : isSignUp ? 'Crea tu cuenta de acceso' : 'KORE tu gestionador integral'}
          </p>
        </div>

        {showForgotPassword ? (
          <form className="w-full space-y-4" onSubmit={handleResetPassword}>
            <div className="space-y-3">
              <input
                className="w-full h-14 px-6 rounded-premium glass-input text-white placeholder:text-white/30 text-[16px]"
                placeholder="Correo Electrónico"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-14 bg-primary text-white font-semibold rounded-premium apple-button shadow-2xl shadow-primary/40 mt-2 flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                'Enviar Enlace'
              )}
            </button>

            <button
              type="button"
              onClick={() => setShowForgotPassword(false)}
              className="w-full h-14 text-white/60 font-medium rounded-premium hover:text-white transition-colors mt-2"
            >
              Volver al inicio de sesión
            </button>
          </form>
        ) : (
          <>
            <form className="w-full space-y-4" onSubmit={handleAuth}>
              <div className="space-y-3">
                {isSignUp && (
                  <input
                    className="w-full h-14 px-6 rounded-premium glass-input text-white placeholder:text-white/30 text-[16px] animate-in slide-in-from-top-2 duration-300"
                    placeholder="Nombre de Usuario / Alias"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                )}
                <input
                  className="w-full h-14 px-6 rounded-premium glass-input text-white placeholder:text-white/30 text-[16px]"
                  placeholder={isSignUp ? "Correo Electrónico" : "Usuario o Correo"}
                  type="text"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
                <div className="relative">
                  <input
                    className="w-full h-14 px-6 pr-14 rounded-premium glass-input text-white placeholder:text-white/30 text-[16px]"
                    placeholder="Contraseña"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {!isSignUp && (
                <div className="flex justify-end px-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    className="text-[13px] text-white/40 hover:text-white transition-colors"
                  >
                    ¿Olvidé mi contraseña?
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-14 bg-primary text-white font-semibold rounded-premium apple-button shadow-2xl shadow-primary/40 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : (
                  isSignUp ? 'Crear Cuenta' : 'Entrar'
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-[13px] text-primary font-bold hover:text-white transition-colors"
              >
                {isSignUp ? '¿Ya tienes cuenta? Inicia Sesión' : '¿No tienes cuenta? Regístrate'}
              </button>
            </div>

            <div className="w-full flex items-center gap-4 my-10">
              <div className="h-[0.5px] flex-1 bg-white/10"></div>
              <span className="text-[11px] uppercase tracking-widest text-white/30 font-bold">O continuar con</span>
              <div className="h-[0.5px] flex-1 bg-white/10"></div>
            </div>

            <button
              onClick={handleGoogleLogin}
              type="button"
              className="w-full h-14 rounded-premium glass-input flex items-center justify-center gap-3 apple-button"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              <span className="text-white/80 font-medium text-[15px]">Google</span>
            </button>
          </>
        )}

        <footer className="mt-8 pb-8 flex flex-col items-center gap-4">
          <div className="flex gap-8">
            <button className="text-white/20 text-[12px] hover:text-white transition-colors">Soporte</button>
            <button className="text-white/20 text-[12px] hover:text-white transition-colors">Privacidad</button>
          </div>
          <p className="text-[10px] text-white/10 uppercase tracking-[0.2em]">KORE Management Platform</p>
        </footer>
      </main>
    </div>
  );
};

export default Login;
