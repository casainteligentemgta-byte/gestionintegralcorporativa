
import React, { useState } from 'react';
import { supabase } from '../services/supabase';

interface PasswordRecoveryProps {
    onNavigate: (view: any) => void;
}

const PasswordRecovery: React.FC<PasswordRecoveryProps> = ({ onNavigate }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }
        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        setError('');
        setMessage('');

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setMessage('Contraseña actualizada correctamente. Redirigiendo al dashboard...');
            setTimeout(() => {
                onNavigate('DASHBOARD');
            }, 2000);
        } catch (err: any) {
            console.error('Error updating password:', err);
            setError(err.message || 'Error al actualizar la contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-stone-950 text-white relative overflow-hidden">
            {/* Background Blobs */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="w-full max-w-md bg-stone-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 relative z-10 shadow-2xl">
                <div className="flex flex-col items-center mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary text-2xl">lock_reset</span>
                    </div>
                    <h2 className="text-2xl font-bold">Restablecer Contraseña</h2>
                    <p className="text-stone-400 text-sm text-center mt-2">Ingresa tu nueva contraseña para recuperar el acceso a tu cuenta.</p>
                </div>

                {message && (
                    <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-xl text-sm font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">check_circle</span>
                        {message}
                    </div>
                )}

                {error && (
                    <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
                        <span className="material-symbols-outlined text-lg">error</span>
                        {error}
                    </div>
                )}

                <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Nueva Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-stone-950/50 border border-white/10 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-500 uppercase tracking-wider ml-1">Confirmar Contraseña</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-stone-950/50 border border-white/10 text-white focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed mt-2 flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">save</span>
                                Actualizar Contraseña
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default PasswordRecovery;
