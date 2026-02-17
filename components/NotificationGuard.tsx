
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const NotificationGuard: React.FC = () => {
    const [alert, setAlert] = useState<{ id: string, titulo: string, mensaje: string } | null>(null);

    useEffect(() => {
        // Suscribirse a cambios en tiempo real en la tabla de notificaciones
        const channel = supabase
            .channel('realtime_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notificaciones'
                },
                (payload) => {
                    const newNotif = payload.new as any;
                    // Si es una alerta de seguridad, mostramos el "Push"
                    if (newNotif.titulo.includes('ALERTA DE SEGURIDAD') || newNotif.modulo === 'Seguridad') {
                        setAlert(newNotif);

                        // Sonido de alerta (opcional, pero mejora la experiencia de "Push")
                        // En web a veces está bloqueado sin interacción previa.

                        // Auto-cerrar después de 8 segundos
                        setTimeout(() => {
                            setAlert(prev => prev?.id === newNotif.id ? null : prev);
                        }, 8000);
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (!alert) return null;

    return (
        <div className="fixed top-12 left-4 right-4 z-[9999] animate-in slide-in-from-top duration-500">
            <div className="bg-red-600 rounded-2xl p-4 shadow-2xl shadow-red-900/40 border border-white/20 flex gap-4 items-start">
                <div className="bg-white/20 p-2 rounded-xl">
                    <span className="material-symbols-outlined text-white">gavel</span>
                </div>
                <div className="flex-1">
                    <h4 className="text-white font-black text-xs uppercase tracking-widest">{alert.titulo}</h4>
                    <p className="text-white/90 text-[11px] font-medium leading-relaxed mt-1">{alert.mensaje}</p>
                    <button
                        onClick={() => setAlert(null)}
                        className="mt-3 text-[9px] font-black uppercase tracking-tighter text-white/60 bg-black/20 px-3 py-1.5 rounded-lg border border-white/10"
                    >
                        Entendido, Supervisando...
                    </button>
                </div>
                <button onClick={() => setAlert(null)} className="text-white/40">
                    <span className="material-symbols-outlined text-sm">close</span>
                </button>
            </div>
        </div>
    );
};

export default NotificationGuard;
