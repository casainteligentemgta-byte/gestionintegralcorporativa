
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { dataService } from '../services/dataService';

interface GuardianConsoleProps {
    onNavigate: (view: any) => void;
}

const GuardianConsole: React.FC<GuardianConsoleProps> = ({ onNavigate }) => {
    const [logs, setLogs] = useState<any[]>([]);
    const [stats, setStats] = useState({
        accessAttempts: 1240, // Simulado según diseño
        logicErrors: 0,
        contractsCount: 0,
        latency: 12
    });
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        fetchData();

        // Suscripción en tiempo real para nuevos logs
        const channel = supabase
            .channel('guardian_terminal')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'Logs_Seguridad' },
                (payload) => {
                    setLogs(prev => [payload.new, ...prev.slice(0, 49)]);
                    updateStats();
                }
            )
            .subscribe();

        return () => {
            clearInterval(timer);
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const auditLogs = await dataService.getAuditLogs(50);
            setLogs(auditLogs);
            await updateStats();
        } catch (error) {
            console.error("Error fetching guardian data:", error);
        } finally {
            setLoading(false);
        }
    };

    const updateStats = async () => {
        // Contar contratos generados hoy
        const { count: contracts } = await supabase
            .from('Contratos_IA')
            .select('*', { count: 'exact', head: true })
            .gte('created_at', new Date().toISOString().split('T')[0]);

        // Contar errores críticos/errores
        const { count: errors } = await supabase
            .from('Logs_Seguridad')
            .select('*', { count: 'exact', head: true })
            .in('nivel_severidad', ['ERROR', 'CRITICAL']);

        setStats(prev => ({
            ...prev,
            contractsCount: contracts || 0,
            logicErrors: errors || 0
        }));
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString('es-VE', { hour12: false });
    };

    const getLogColor = (severity: string) => {
        switch (severity) {
            case 'CRITICAL': return 'text-red-500 font-black';
            case 'ERROR': return 'text-red-400';
            case 'WARNING': return 'text-yellow-500';
            default: return 'text-blue-400';
        }
    };

    return (
        <div className="bg-stone-950 min-h-screen text-slate-200 antialiased font-sans pb-32">
            {/* Header Section */}
            <header className="px-6 pt-8 pb-4 flex flex-col items-center gap-4 sticky top-0 z-20 bg-stone-950/80 backdrop-blur-md border-b border-white/5">
                <div className="flex items-center justify-between w-full mb-2">
                    <button onClick={() => onNavigate('DASHBOARD')} className="material-symbols-outlined text-primary text-3xl">shield_person</button>
                    <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Modo Security</p>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-slate-600 font-medium mt-0.5">Caja Negra</p>
                    </div>
                </div>
                <div className="w-full flex flex-col items-center gap-3">
                    <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 pulse-glow">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                        <span className="text-[11px] font-bold tracking-widest text-emerald-400 uppercase">Sistema: Operativo</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <span className="text-4xl font-mono font-medium tracking-tighter text-white">{formatTime(currentTime)}</span>
                        <span className="text-[11px] text-primary/80 font-medium tracking-widest mt-1 uppercase">Uptime: 99.9%</span>
                    </div>
                </div>
            </header>

            {/* Metrics Grid (Bento Style) */}
            <main className="px-4 py-4 space-y-6">
                <div className="grid grid-cols-2 gap-3">
                    {/* Access Attempts */}
                    <div className="glass-card rounded-xl p-4 flex flex-col justify-between min-h-[140px] relative overflow-hidden group">
                        <div className="z-10">
                            <p className="text-xs text-slate-400 font-medium font-bold uppercase tracking-tighter">Intentos Acceso</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.accessAttempts.toLocaleString()}</p>
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-12 opacity-40 group-hover:opacity-60 transition-opacity">
                            <svg className="w-full h-full" viewBox="0 0 100 30">
                                <path d="M0 25 Q 10 15, 20 20 T 40 10 T 60 18 T 80 5 T 100 15" fill="none" stroke="#0048ad" strokeWidth="2"></path>
                            </svg>
                        </div>
                        <span className="material-symbols-outlined absolute top-3 right-3 text-primary/30 text-xl font-bold uppercase tracking-tighter">login</span>
                    </div>

                    {/* Logic Errors / Health */}
                    <div className="glass-card rounded-xl p-4 flex flex-col gap-3 min-h-[140px]">
                        <div>
                            <p className="text-xs text-slate-400 font-medium font-bold uppercase tracking-tighter">Errores Lógica</p>
                            <p className={`text-2xl font-bold mt-1 ${stats.logicErrors > 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                                {stats.logicErrors} <span className="text-[10px] font-normal text-slate-500 ml-1">Detectados</span>
                            </p>
                        </div>
                        <div className="space-y-2 mt-auto">
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-bold uppercase tracking-tighter">DB Health</span>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                                <span className="text-slate-400 font-bold uppercase tracking-tighter">Stock Sync</span>
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
                            </div>
                        </div>
                    </div>

                    {/* Generated Contracts */}
                    <div className="glass-card rounded-xl p-4 flex flex-col justify-between min-h-[140px]">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs text-slate-400 font-medium font-bold uppercase tracking-tighter">Legal-Bot</p>
                                <p className="text-2xl font-bold text-white mt-1">{stats.contractsCount}</p>
                            </div>
                            <span className="material-symbols-outlined text-primary text-xl font-bold uppercase tracking-tighter">gavel</span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">Contratos Generados (Hoy)</p>
                    </div>

                    {/* API Latency */}
                    <div className="glass-card rounded-xl p-4 flex flex-col justify-between min-h-[140px]">
                        <div>
                            <p className="text-xs text-slate-400 font-medium font-bold uppercase tracking-tighter">Latencia API</p>
                            <p className="text-2xl font-bold text-white mt-1">{stats.latency}<span className="text-sm font-light text-slate-400 ml-0.5 font-bold uppercase tracking-tighter">ms</span></p>
                        </div>
                        <div className="relative pt-2">
                            <div className="h-1 w-full bg-stone-800 rounded-full overflow-hidden">
                                <div className="h-full bg-primary w-[15%] shadow-[0_0_8px_#0048ad]"></div>
                            </div>
                            <div className="flex justify-between mt-1 text-[8px] text-slate-600 font-bold uppercase">
                                <span>Rápido</span>
                                <span>Crítico</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Terminal Section */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Log del Sistema (Terminal)</span>
                        <span className="text-[10px] font-mono text-primary animate-pulse font-bold uppercase tracking-tighter">REC ●</span>
                    </div>
                    <div className="bg-black/60 border border-white/5 rounded-lg p-4 font-mono text-[11px] leading-relaxed h-64 overflow-y-auto terminal-scroll">
                        {loading ? (
                            <p className="text-slate-500 animate-pulse">CARGANDO SECUENCIAS DE SEGURIDAD...</p>
                        ) : logs.length === 0 ? (
                            <p className="text-slate-600">_ SISTEMA EN ESPERA - SIN EVENTOS REGISTRADOS</p>
                        ) : (
                            logs.map((log, i) => (
                                <p key={log.id || i} className={`${getLogColor(log.nivel_severidad)} opacity-90 mb-1`}>
                                    <span className="text-slate-600">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span> {log.nivel_severidad}: {log.accion} - {log.descripcion_tecnica}
                                </p>
                            ))
                        )}
                        <p className="text-slate-500 animate-pulse">_ ESPERANDO ENTRADA...</p>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2 pb-6">
                    <button className="flex flex-col items-center justify-center gap-2 glass-card p-3 rounded-lg hover:bg-white/5 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-primary text-xl font-bold uppercase tracking-tighter">cleaning_services</span>
                        <span className="text-[10px] font-bold uppercase text-slate-300">Caché</span>
                    </button>
                    <button onClick={fetchData} className="flex flex-col items-center justify-center gap-2 glass-card p-3 rounded-lg hover:bg-white/5 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-primary text-xl font-bold uppercase tracking-tighter">fact_check</span>
                        <span className="text-[10px] font-bold uppercase text-slate-300 text-center">Auditar</span>
                    </button>
                    <button className="flex flex-col items-center justify-center gap-2 glass-card p-3 rounded-lg hover:bg-white/5 active:scale-95 transition-all">
                        <span className="material-symbols-outlined text-primary text-xl font-bold uppercase tracking-tighter">picture_as_pdf</span>
                        <span className="text-[10px] font-bold uppercase text-slate-300 text-center">Reporte</span>
                    </button>
                </div>
            </main>
        </div>
    );
};

export default GuardianConsole;
