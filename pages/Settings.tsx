
import React from 'react';
import { supabase } from '../services/supabase';

interface SettingsProps {
    onNavigate: (view: any) => void;
}

const Settings: React.FC<SettingsProps> = ({ onNavigate }) => {
    return (
        <div className="p-6 space-y-8 animate-in slide-in-from-bottom duration-500">
            <header className="flex items-center justify-between">
                <button
                    onClick={() => onNavigate('DASHBOARD')}
                    className="h-10 w-10 flex items-center justify-center rounded-apple bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-stone-400">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold tracking-tight text-white uppercase tracking-widest">Ajustes del Sistema</h1>
                <div className="w-10"></div>
            </header>

            <div className="space-y-6">
                <section className="glass-card rounded-apple p-6 border border-white/5">
                    <h2 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-6">Configuración de la Matriz</h2>
                    <div className="space-y-4">
                        <button
                            onClick={() => onNavigate('COMPANIES')}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                                    <span className="material-symbols-outlined">business</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Gestión de Empresas</p>
                                    <p className="text-[10px] text-stone-500">Administrar RIF, logos y direcciones</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-stone-600 group-hover:text-white transition-colors">chevron_right</span>
                        </button>

                        <button className="w-full flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-all group opacity-50 cursor-not-allowed">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-500">
                                    <span className="material-symbols-outlined">security</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Roles y Permisos</p>
                                    <p className="text-[10px] text-stone-500">Control de acceso de usuarios</p>
                                </div>
                            </div>
                            <span className="material-symbols-outlined text-stone-600">lock</span>
                        </button>
                    </div>
                </section>

                <section className="glass-card rounded-apple p-6 border border-white/5">
                    <h2 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-6">Soporte y Sistema</h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-white/5 text-stone-400">
                                    <span className="material-symbols-outlined">database</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Estado de Base de Datos</p>
                                    <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-tighter">Sincronizado con Supabase</p>
                                </div>
                            </div>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="p-2 rounded-lg bg-white/5 text-stone-400">
                                    <span className="material-symbols-outlined">info</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-sm font-bold text-white">Versión del Sistema</p>
                                    <p className="text-[10px] text-stone-500 font-mono">v1.2.4-industrial-premium</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <button
                    onClick={async () => {
                        try {
                            await supabase.auth.signOut();
                            onNavigate('LOGIN');
                        } catch (error) {
                            console.error('Error signing out:', error);
                            window.location.href = '/';
                        }
                    }}
                    className="w-full flex items-center justify-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500/20 transition-all font-black uppercase text-[10px] tracking-widest"
                >
                    <span className="material-symbols-outlined text-sm">logout</span>
                    Cerrar Sesión
                </button>
            </div>
        </div>
    );
};

export default Settings;
