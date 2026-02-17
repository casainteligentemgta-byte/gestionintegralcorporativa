
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

interface JobCostReportProps {
    onNavigate: (view: any) => void;
}

const JobCostReport: React.FC<JobCostReportProps> = ({ onNavigate }) => {
    const [projects, setProjects] = useState<any[]>([]);
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [reportData, setReportData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const data = await dataService.getProjects();
            setProjects(data);
            if (data.length > 0) {
                setSelectedProjectId(data[0].id);
                loadReport(data[0].id);
            }
        } catch (error) {
            console.error('Error loading projects:', error);
        }
    };

    const loadReport = async (projectId: string) => {
        setLoading(true);
        try {
            const data = await dataService.getJobCostReport(projectId);
            setReportData(data);
        } catch (error) {
            console.error('Error loading report:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleProjectChange = (projectId: string) => {
        setSelectedProjectId(projectId);
        loadReport(projectId);
    };

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-10 animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b border-white/10 pb-8">
                <div>
                    <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-1">Financial Control & Analytics</p>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Sábana de Costos (Real vs Budget)</h1>
                    <p className="text-stone-500 text-[10px] font-bold uppercase mt-2 tracking-widest leading-none">Monitoreo de Consumo por Partida Presupuestaria</p>
                </div>
                <div className="flex items-center gap-4">
                    <select
                        className="h-10 bg-white/5 border border-white/10 rounded-apple px-4 text-white text-[10px] font-bold uppercase outline-none focus:border-primary/50"
                        value={selectedProjectId}
                        onChange={(e) => handleProjectChange(e.target.value)}
                    >
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button onClick={() => onNavigate('INVENTORY_DASHBOARD')} className="h-10 px-6 rounded-apple bg-white/5 border border-white/10 text-stone-400 text-[10px] font-bold uppercase transition-all hover:bg-white/10">Cerrar</button>
                </div>
            </header>

            {loading ? (
                <div className="flex flex-col items-center justify-center p-20 space-y-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
                    <p className="text-[10px] font-black text-stone-500 uppercase animate-pulse">Cruzando Kardex con Presupuesto...</p>
                </div>
            ) : (
                <div className="glass-card rounded-[2.5rem] border-white/5 bg-white/[0.01] overflow-hidden shadow-2xl">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-[9px] font-black text-stone-500 uppercase tracking-widest border-b border-white/5">
                            <tr>
                                <th className="px-8 py-6">Partida Presupuestaria</th>
                                <th className="px-8 py-6 text-right">Costo Teórico (Exp.)</th>
                                <th className="px-8 py-6 text-right">Costo Real (Consumo)</th>
                                <th className="px-8 py-6 text-right">Utilidad / Desvío</th>
                                <th className="px-8 py-6 text-center">Estado de Eficiencia</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {reportData.map((row, i) => (
                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-black text-white uppercase group-hover:text-primary transition-colors">{row.partida}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right text-stone-400 font-mono font-bold">
                                        ${row.costoTeorico.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-6 text-right text-white font-mono font-black">
                                        ${row.costoReal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className={`px-8 py-6 text-right font-mono font-black ${row.diferencia >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                        {row.diferencia >= 0 ? '+' : ''}${row.diferencia.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${row.estado === 'EFICIENTE' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                                            <span className="material-symbols-outlined text-sm font-black">{row.estado === 'EFICIENTE' ? 'trending_up' : 'trending_down'}</span>
                                            <span className="text-[8px] font-black uppercase tracking-tighter">{row.estado}</span>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-white/[0.03] border-t border-white/10">
                            <tr>
                                <td className="px-8 py-6 text-[10px] font-black text-stone-500 uppercase tracking-widest">Totales de Análisis</td>
                                <td className="px-8 py-6 text-right text-stone-400 font-mono font-bold">
                                    ${reportData.reduce((acc, r) => acc + r.costoTeorico, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-8 py-6 text-right text-white font-mono font-black border-l border-white/5">
                                    ${reportData.reduce((acc, r) => acc + r.costoReal, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td className={`px-8 py-6 text-right font-mono font-black border-l border-white/5 ${reportData.reduce((acc, r) => acc + r.diferencia, 0) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    ${reportData.reduce((acc, r) => acc + r.diferencia, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                                </td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="glass-card p-6 rounded-3xl border-emerald-500/20 bg-emerald-500/[0.02]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-black font-black">savings</span>
                        </div>
                        <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Ahorro Generado</h3>
                    </div>
                    <p className="text-2xl font-black text-white font-mono">${reportData.filter(r => r.diferencia > 0).reduce((acc, r) => acc + r.diferencia, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[8px] text-emerald-500 font-bold uppercase mt-1">Eficiencia en gestión de recursos</p>
                </div>

                <div className="glass-card p-6 rounded-3xl border-red-500/20 bg-red-500/[0.02]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-red-500 flex items-center justify-center">
                            <span className="material-symbols-outlined text-black font-black">emergency_home</span>
                        </div>
                        <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Exceso de Costos</h3>
                    </div>
                    <p className="text-2xl font-black text-white font-mono">${Math.abs(reportData.filter(r => r.diferencia < 0).reduce((acc, r) => acc + r.diferencia, 0)).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                    <p className="text-[8px] text-red-500 font-bold uppercase mt-1">Desviaciones críticas detectadas</p>
                </div>

                <div className="glass-card p-6 rounded-3xl border-primary/20 bg-primary/[0.02]">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 rounded-2xl bg-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-black font-black">query_stats</span>
                        </div>
                        <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Indice de Utilidad</h3>
                    </div>
                    {(() => {
                        const totalBudget = reportData.reduce((acc, r) => acc + r.costoTeorico, 0);
                        const totalReal = reportData.reduce((acc, r) => acc + r.costoReal, 0);
                        const margin = totalBudget > 0 ? ((totalBudget - totalReal) / totalBudget * 100).toFixed(1) : '0.0';
                        return (
                            <>
                                <p className="text-2xl font-black text-white font-mono">{margin}%</p>
                                <p className="text-[8px] text-primary font-bold uppercase mt-1">Margen operativo actual</p>
                            </>
                        );
                    })()}
                </div>
            </div>
        </div>
    );
};

export default JobCostReport;
