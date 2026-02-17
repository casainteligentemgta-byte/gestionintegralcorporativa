import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import CompanySetup from './CompanySetup';

interface UserProfile {
    id: string;
    user_id: string;
    email: string;
    full_name: string | null;
    role: string;
    status: 'pending' | 'active' | 'suspended' | 'rejected';
    company_id: string | null;
    is_company_owner: boolean;
    created_at: string;
    activated_at: string | null;
}

interface AuthGuardProps {
    children: React.ReactNode;
    onNavigate?: (view: string) => void;
}

/**
 * AuthGuard Component
 * Verifies user authentication and account status before allowing access
 * 
 * Flow:
 * 1. Check if user is authenticated
 * 2. Fetch user profile from profiles table
 * 3. Check if status is 'active'
 * 4. If pending/suspended/rejected, show appropriate message
 * 5. If active, render children
 */
const AuthGuard: React.FC<AuthGuardProps> = ({ children, onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        checkUserStatus();

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                await checkUserStatus();
            } else if (event === 'SIGNED_OUT') {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkUserStatus = async () => {
        try {
            setLoading(true);
            setError(null);

            // Get current user
            const { data: { user }, error: userError } = await supabase.auth.getUser();

            if (userError || !user) {
                setProfile(null);
                setLoading(false);
                return;
            }

            // Fetch user profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile:', profileError);

                // If profile doesn't exist, it might be creating
                if (profileError.code === 'PGRST116') {
                    setError('Tu perfil está siendo creado. Por favor, espera unos segundos y recarga la página.');
                } else {
                    setError('Error al cargar tu perfil. Por favor, contacta a soporte.');
                }
                setLoading(false);
                return;
            }

            setProfile(profileData);
            setLoading(false);
        } catch (err) {
            console.error('Unexpected error:', err);
            setError('Error inesperado. Por favor, intenta nuevamente.');
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        if (onNavigate) {
            onNavigate('LOGIN');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
                    <p className="text-white/60 text-sm font-medium">Verificando tu cuenta...</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
                <div className="max-w-md w-full glass-card rounded-premium p-8 text-center space-y-6 border-red-500/20">
                    <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                        <span className="material-symbols-outlined text-red-500 text-4xl">error</span>
                    </div>
                    <div className="space-y-2">
                        <h2 className="text-xl font-bold text-white">Error de Perfil</h2>
                        <p className="text-white/60 text-sm">{error}</p>
                    </div>
                    <button
                        onClick={handleSignOut}
                        className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                    >
                        Cerrar Sesión
                    </button>
                </div>
            </div>
        );
    }

    // No profile (not authenticated)
    if (!profile) {
        return <>{children}</>;
    }

    // Check if user needs to setup company (first time login)
    if (!profile.company_id && profile.email !== 'casainteligentemgta@gmail.com') {
        return <CompanySetup onComplete={checkUserStatus} />;
    }

    // Account status checks
    switch (profile.status) {
        case 'pending':
            return (
                <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
                    <div className="max-w-md w-full glass-card rounded-premium p-8 text-center space-y-6 border-amber-500/20">
                        <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-amber-500 text-5xl">schedule</span>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-white">Cuenta Pendiente de Activación</h2>
                            <p className="text-white/60 text-sm leading-relaxed">
                                Tu cuenta ha sido creada exitosamente, pero aún no ha sido activada por un administrador.
                            </p>
                        </div>

                        <div className="bg-white/5 rounded-xl p-4 space-y-2 text-left">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-white/40 uppercase tracking-wider">Email</span>
                                <span className="text-white font-medium">{profile.email}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-white/40 uppercase tracking-wider">Estado</span>
                                <span className="px-3 py-1 bg-amber-500/20 text-amber-500 rounded-full text-xs font-bold uppercase">
                                    Pendiente
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-white/40 uppercase tracking-wider">Registrado</span>
                                <span className="text-white/60">{new Date(profile.created_at).toLocaleDateString('es-ES')}</span>
                            </div>
                        </div>

                        <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 space-y-2">
                            <div className="flex items-start gap-3">
                                <span className="material-symbols-outlined text-primary text-xl mt-0.5">info</span>
                                <div className="text-left space-y-1">
                                    <h3 className="text-primary font-bold text-sm">Próximos Pasos</h3>
                                    <p className="text-white/60 text-xs leading-relaxed">
                                        Para activar tu cuenta, por favor contacta a soporte para completar el proceso de pago y verificación.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <a
                                href="mailto:soporte@kore.com?subject=Activación de Cuenta - KORE"
                                className="block w-full h-12 bg-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                            >
                                <span className="material-symbols-outlined">email</span>
                                Contactar Soporte
                            </a>

                            <button
                                onClick={handleSignOut}
                                className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                            >
                                Cerrar Sesión
                            </button>
                        </div>

                        <p className="text-white/30 text-xs">
                            Recibirás un email cuando tu cuenta sea activada
                        </p>
                    </div>
                </div>
            );

        case 'suspended':
            return (
                <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
                    <div className="max-w-md w-full glass-card rounded-premium p-8 text-center space-y-6 border-orange-500/20">
                        <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-orange-500 text-5xl">block</span>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-white">Cuenta Suspendida</h2>
                            <p className="text-white/60 text-sm leading-relaxed">
                                Tu cuenta ha sido suspendida temporalmente. Por favor, contacta a soporte para más información.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <a
                                href="mailto:soporte@kore.com?subject=Cuenta Suspendida - KORE"
                                className="block w-full h-12 bg-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                            >
                                <span className="material-symbols-outlined">email</span>
                                Contactar Soporte
                            </a>

                            <button
                                onClick={handleSignOut}
                                className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            );

        case 'rejected':
            return (
                <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
                    <div className="max-w-md w-full glass-card rounded-premium p-8 text-center space-y-6 border-red-500/20">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                            <span className="material-symbols-outlined text-red-500 text-5xl">cancel</span>
                        </div>

                        <div className="space-y-3">
                            <h2 className="text-2xl font-bold text-white">Solicitud Rechazada</h2>
                            <p className="text-white/60 text-sm leading-relaxed">
                                Tu solicitud de cuenta no ha sido aprobada. Si crees que esto es un error, por favor contacta a soporte.
                            </p>
                        </div>

                        <div className="space-y-3">
                            <a
                                href="mailto:soporte@kore.com?subject=Solicitud Rechazada - KORE"
                                className="block w-full h-12 bg-primary text-black font-bold rounded-xl flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                            >
                                <span className="material-symbols-outlined">email</span>
                                Contactar Soporte
                            </a>

                            <button
                                onClick={handleSignOut}
                                className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            );

        case 'active':
            // User is active, render children
            return <>{children}</>;

        default:
            return (
                <div className="min-h-screen bg-stone-950 flex items-center justify-center p-8">
                    <div className="max-w-md w-full glass-card rounded-premium p-8 text-center space-y-6">
                        <span className="material-symbols-outlined text-white/20 text-6xl">help</span>
                        <p className="text-white/60">Estado de cuenta desconocido</p>
                        <button
                            onClick={handleSignOut}
                            className="w-full h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-colors"
                        >
                            Cerrar Sesión
                        </button>
                    </div>
                </div>
            );
    }
};

export default AuthGuard;
