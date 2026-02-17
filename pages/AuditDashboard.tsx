
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

interface AuditDashboardProps {
    onNavigate: (view: any) => void;
}

const AuditDashboard: React.FC<AuditDashboardProps> = ({ onNavigate }) => {
    const [conflicts, setConflicts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState<string | null>(null);

    useEffect(() => {
        loadConflicts();
    }, []);

    const loadConflicts = async () => {
        try {
            const { data, error } = await (dataService as any).supabase
                .from('Inventory_Audits')
                .select('*, Inventario_Global(*)')
                .eq('status', 'CONFLICTO');
            setConflicts(data || []);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyAdjustment = async (audit: any, reaction: 'SHRINKAGE' | 'SURPLUS') => {
        const diff = Math.abs(audit.counted_qty - audit.system_qty_snapshot);
        const reason = prompt("Ingrese el motivo del ajuste (Robo, Error de Digitación, Merma Natural, etc.):");

        if (!reason) return;

        setIsProcessing(audit.id);
        try {
            await dataService.processAdjustment({
                material_id: audit.material_id,
                audit_id: audit.id,
                type: reaction,
                qty: diff,
                reason: reason
            });

            // Mark audit as adjusted
            await (dataService as any).supabase
                .from('Inventory_Audits')
                .update({ status: 'AJUSTADO' })
                .eq('id', audit.id);

            alert("Ajuste aplicado correctamente. Kardex actualizado.");
            await loadConflicts();
        } catch (error: any) {
            alert("Error al aplicar ajuste: " + error.message);
        } finally {
            setIsProcessing(null);
        }
    };

    const runDepreciation = async () => {
        if (!confirm("¿Desea ejecutar la depreciación mensual para toda la maquinaria? Este proceso es irreversible.")) return;
        setLoading(true);
        try {
            await dataService.runMonthlyDepreciation();
            alert("Depreciación ejecutada. Valores de libros actualizados.");
        } catch (error: any) {
            alert("Error en depreciación: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const runReplenishment = async () => {
        setLoading(true);
        try {
            const count = await dataService.checkReplenishmentNeeds();
            alert(`Motor ejecutado. Se han generado ${count} alertas de reabastecimiento.`);
        } catch (error: any) {
            alert("Error en motor: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-10 text-center text-stone-500 font-bold animate-pulse">Analizando inconsistencias de inventario...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-10 animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase italic">Control & Auditoría</h1>
                    <p className="text-stone-500 text-[10px] font-bold uppercase mt-2 tracking-widest flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        Monitoreo de Consistencia de Stock y Activos
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={runReplenishment}
                        className="h-10 px-6 rounded-apple bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase hover:bg-amber-500/20 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">refresh</span> Ejecutar Reaprovisionamiento
                    </button>
                    <button
                        onClick={runDepreciation}
                        className="h-10 px-6 rounded-apple bg-white/5 border border-white/10 text-stone-400 text-[9px] font-black uppercase hover:bg-white/10 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-sm">precision_manufacturing</span> Cierre Depreciación Mes
                    </button>
                    <button onClick={() => onNavigate('INVENTORY_DASHBOARD')} className="h-10 px-6 rounded-apple bg-white/5 border border-white/10 text-stone-400 text-[9px] font-black uppercase">Salir</button>
                </div>
            </header>

            <div className="grid lg:grid-cols-1 gap-6">
                <section className="glass-card rounded-[2.5rem] bg-white/[0.01] border-white/5 overflow-hidden">
                    <div className="p-6 border-b border-white/5 bg-white/[0.02] flex items-center justify-between">
                        <h2 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-3">
                            <span className="material-symbols-outlined text-red-500">warning</span>
                            Inconsistencias Detectadas (Conflictos de Conteo)
                        </h2>
                        <span className="text-[10px] font-black text-stone-600 uppercase bg-white/5 px-3 py-1 rounded-full">{conflicts.length} ÍTEMS EN CONFLICTO</span>
                    </div>

                    <div className="overflow-x-auto">
                        {conflicts.length === 0 ? (
                            <div className="p-20 text-center opacity-20">
                                <span className="material-symbols-outlined text-6xl mb-4">gpp_good</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">Sin conflictos pendientes. Inventario conciliado.</p>
                            </div>
                        ) : (
                            <table className="w-full text-left">
                                <thead className="text-[9px] font-black text-stone-500 uppercase tracking-widest bg-white/[0.03]">
                                    <tr>
                                        <th className="px-6 py-4">Ficha Técnica</th>
                                        <th className="px-6 py-4 text-center">En Sistema</th>
                                        <th className="px-6 py-4 text-center">Contado Físico</th>
                                        <th className="px-6 py-4 text-center">Desviación</th>
                                        <th className="px-6 py-4 text-right">Acción Correctiva</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {conflicts.map(audit => {
                                        const diff = audit.counted_qty - audit.system_qty_snapshot;
                                        return (
                                            <tr key={audit.id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <p className="text-xs font-bold text-white uppercase">{audit.Inventario_Global?.nombre}</p>
                                                    <p className="text-[8px] text-stone-500 font-mono tracking-tighter">AUDIT_ID: {audit.id.slice(0, 8)}</p>
                                                </td>
                                                <td className="px-6 py-4 text-center font-mono text-xs text-stone-400">{audit.system_qty_snapshot}</td>
                                                <td className="px-6 py-4 text-center font-mono text-xs text-white font-black">{audit.counted_qty}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full ${diff < 0 ? 'bg-red-500/20 text-red-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                                        {diff > 0 ? '+' : ''}{diff} {audit.Inventario_Global?.unidad_medida}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => handleApplyAdjustment(audit, diff < 0 ? 'SHRINKAGE' : 'SURPLUS')}
                                                            disabled={isProcessing === audit.id}
                                                            className="px-4 py-2 rounded-xl bg-primary text-black text-[9px] font-black uppercase hover:scale-105 transition-all shadow-lg shadow-primary/20"
                                                        >
                                                            Aplicar Ajuste
                                                        </button>
                                                        <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase hover:bg-white/10">Recontar</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        )}
                    </div>
                </section>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="glass-card p-8 rounded-premium bg-emerald-500/[0.02] border-emerald-500/10 space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-emerald-500">health_and_safety</span>
                            <h3 className="text-white font-black text-xs uppercase tracking-widest">Estado de Salud del Stock</h3>
                        </div>
                        <p className="text-[10px] text-stone-500 leading-relaxed uppercase font-bold">
                            Nivel de coincidencia global: <span className="text-emerald-500 text-sm ml-2">98.4%</span>
                        </p>
                        <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                            <div className="bg-emerald-500 h-full w-[98.4%]"></div>
                        </div>
                    </div>

                    <div className="glass-card p-8 rounded-premium bg-primary/[0.02] border-primary/10 space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary">account_balance_wallet</span>
                            <h3 className="text-white font-black text-xs uppercase tracking-widest">Valorización de Activos</h3>
                        </div>
                        <p className="text-[10px] text-stone-500 leading-relaxed uppercase font-bold">
                            Próximo cierre de depreciación sugerido: <span className="text-primary text-sm ml-2">01/MAR/2026</span>
                        </p>
                        <button className="text-[9px] text-primary font-black uppercase underline hover:opacity-70">Descargar Reporte de Libros (PDF)</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuditDashboard;
