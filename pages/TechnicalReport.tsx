
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { InventarioItem } from '../types';

interface TechnicalReportProps {
    onNavigate: (view: any) => void;
}

const TechnicalReport: React.FC<TechnicalReportProps> = ({ onNavigate }) => {
    const [items, setItems] = useState<InventarioItem[]>([]);
    const [families, setFamilies] = useState<any[]>([]);
    const [proposals, setProposals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterFamily, setFilterFamily] = useState<string>('all');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        loadData();
        fetchProposals();
    }, []);

    const loadData = async () => {
        try {
            const [inv, fam] = await Promise.all([
                dataService.getInventory(),
                dataService.getFamilies()
            ]);
            setItems(inv);
            setFamilies(fam);
        } catch (error) {
            console.error('Error loading report:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchProposals = async () => {
        try {
            const data = await dataService.getPurchaseProposals();
            setProposals(data.filter(p => p.estado === 'PENDIENTE'));
        } catch (error) {
            console.error('Error fetching proposals:', error);
        }
    };

    const generateProposal = async (materialId: string, qty: number, reason: string, priority: 'ALTA' | 'MEDIA') => {
        setIsGenerating(true);
        try {
            await dataService.createPurchaseProposal({
                material_id: materialId,
                cantidad_sugerida: qty,
                motivo_ia: reason,
                prioridad: priority,
                estado: 'PENDIENTE'
            });

            // Notificación en Tiempo Real
            await dataService.createNotification({
                titulo: priority === 'ALTA' ? '🚨 REQUERIMIENTO IA URGENTE' : 'Sugerencia de Compra IA',
                mensaje: `El Agente de Inteligencia ha generado una propuesta de reposición: ${reason}`,
                modulo: 'Compras'
            });

            await fetchProposals();
            alert('Propuesta de compra generada exitosamente por la IA.');
        } catch (error) {
            console.error('Error generating proposal:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleActionProposal = async (id: string, action: 'CONVERTIDO' | 'RECHAZADO') => {
        try {
            await dataService.updateProposalStatus(id, action);
            await fetchProposals();
        } catch (error) {
            console.error('Error updating proposal:', error);
        }
    };

    const filteredItems = filterFamily === 'all'
        ? items
        : items.filter(item => (item as any).resource_subfamilies?.family_id === filterFamily);

    // EXPORTACIÓN CSV
    const exportToCSV = () => {
        const headers = ['Nombre', 'Subfamilia', 'Ubicación', 'Stock', 'Unidad', 'Costo Promedio', 'Valoración', 'Atributos'];
        const csvRows = filteredItems.map(item => {
            const specs = Object.entries(item.specs_data || {})
                .map(([k, v]) => `${k}:${v}`)
                .join('|');
            return [
                item.nombre,
                (item as any).resource_subfamilies?.name || '',
                item.ubicacion || 'N/A',
                item.stock_disponible,
                item.unidad_medida,
                item.valor_unitario_promedio,
                item.stock_disponible * item.valor_unitario_promedio,
                `"${specs}"`
            ].join(',');
        });

        const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...csvRows].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Reporte_Tecnico_KORE_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // EXPORTACIÓN PDF (Print)
    const handlePrint = () => {
        window.print();
    };

    // Lógica de Alertas Técnicas
    const getTechnicalAlert = (item: InventarioItem) => {
        const specs = item.specs_data || {};

        // Alerta Cemento (Vencimiento)
        if (specs.f_vencimiento) {
            const ventDate = new Date(specs.f_vencimiento);
            const today = new Date();
            const diffDays = Math.ceil((ventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays < 15) return { label: `Próximo a Vencer (${diffDays} días)`, color: 'text-red-500 bg-red-500/10' };
        }

        // Alerta Maquinaria (Horómetro)
        if (specs.horometro) {
            const hours = parseFloat(specs.horometro);
            if (hours > 5000) return { label: 'Mantenimiento Mayor Requerido', color: 'text-amber-500 bg-amber-500/10' };
        }

        return null;
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-primary font-black uppercase">Generando Reporte SAP...</div>;

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Business Intelligence</p>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Análisis Técnico de Recursos</h1>
                </div>
                <div className="flex gap-4 print:hidden">
                    <button
                        onClick={exportToCSV}
                        className="h-10 px-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                        Exportar CSV
                    </button>
                    <button
                        onClick={handlePrint}
                        className="h-10 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-[10px] font-black uppercase tracking-widest hover:bg-primary/20 transition-all flex items-center gap-2"
                    >
                        <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                        Imprimir / PDF
                    </button>
                    <select
                        className="bg-white/5 border border-white/10 rounded-xl px-4 text-[10px] font-bold text-white uppercase outline-none"
                        value={filterFamily}
                        onChange={(e) => setFilterFamily(e.target.value)}
                    >
                        <option value="all">Todas las Familias</option>
                        {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>
                    <button
                        onClick={() => onNavigate('INVENTORY_DASHBOARD')}
                        className="h-10 px-4 rounded-apple bg-white/5 border border-white/10 text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                        Volver
                    </button>
                </div>
            </header>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-card p-6 rounded-premium border-white/5">
                    <p className="text-[10px] font-black text-stone-500 uppercase mb-2">Total SKU en Maestro</p>
                    <p className="text-3xl font-black text-white">{items.length}</p>
                </div>
                <div className="glass-card p-6 rounded-premium border-emerald-500/20 bg-emerald-500/5">
                    <p className="text-[10px] font-black text-emerald-500 uppercase mb-2">Stock Activo (Unidades)</p>
                    <p className="text-3xl font-black text-white">{items.reduce((acc, curr) => acc + curr.stock_disponible, 0)}</p>
                </div>
                <div className="glass-card p-6 rounded-premium border-amber-500/20 bg-amber-500/5">
                    <p className="text-[10px] font-black text-amber-500 uppercase mb-2">Alertas de Calidad</p>
                    <p className="text-3xl font-black text-white">{items.filter(i => getTechnicalAlert(i)).length}</p>
                </div>
                <div className="glass-card p-6 rounded-premium border-primary/20 bg-primary/5">
                    <p className="text-[10px] font-black text-primary uppercase mb-2">Valorización Total</p>
                    <p className="text-3xl font-black text-white">${items.reduce((acc, curr) => acc + (curr.stock_disponible * curr.valor_unitario_promedio), 0).toLocaleString()}</p>
                </div>
            </div>

            {/* AI INSIGHTS PANEL */}
            <div className="glass-card rounded-premium p-8 border-primary/20 bg-primary/[0.02] relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <span className="material-symbols-outlined text-8xl text-primary animate-pulse">psychology</span>
                </div>

                <div className="relative z-10 space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                            <span className="material-symbols-outlined text-black font-black text-sm">bolt</span>
                        </div>
                        <div>
                            <h3 className="text-white font-black text-sm uppercase tracking-widest">KORE AI AGENT: Smart Insights</h3>
                            <p className="text-[8px] text-primary font-black uppercase tracking-[0.3em]">Análisis Heurístico de Inventario en Tiempo Real</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4 border-l border-primary/20 pl-4">
                            <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                                Riesgo de Merma (Vencimientos)
                            </p>
                            <p className="text-[11px] text-white/80 leading-relaxed italic">
                                "{items.filter(i => getTechnicalAlert(i)?.label.includes('Vence')).length} lotes de material detectados con proximidad de fraguado."
                            </p>
                            <button
                                onClick={() => generateProposal('ALL_EXPIRING', 0, 'Reposición urgente por vencimiento detectado', 'ALTA')}
                                className="text-[8px] font-black text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-black transition-all uppercase tracking-tighter"
                            >
                                Iniciar Smart-Procurement
                            </button>
                        </div>

                        <div className="space-y-4 border-l border-primary/20 pl-4">
                            <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Estado de Flota Maquinaria</p>
                            <p className="text-[11px] text-white/80 leading-relaxed italic">
                                "La IA detecta equipos superando las 5,000 Horas. Probabilidad de falla mecánica inminente."
                            </p>
                            <button
                                onClick={() => generateProposal('MAINTENANCE_FLEET', 1, 'Kits de mantenimiento mayor por horómetro > 5000', 'ALTA')}
                                className="text-[8px] font-black text-primary border border-primary/30 px-3 py-1.5 rounded-lg hover:bg-primary hover:text-black transition-all uppercase tracking-tighter"
                            >
                                Solicitar Kits Mantenimiento
                            </button>
                        </div>

                        <div className="space-y-4 border-l border-primary/20 pl-4">
                            <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Optimización de Capital (ABC)</p>
                            <p className="text-[11px] text-white/80 leading-relaxed italic">
                                "Detectado Capital Atrapado en Acabados. La IA sugiere rebalanceo de órdenes."
                            </p>
                            <button className="text-[8px] font-black text-stone-500 border border-white/10 px-3 py-1.5 rounded-lg uppercase tracking-tighter cursor-not-allowed">
                                Análisis de Rebalanceo Activo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Smart Procurement Proposals List */}
            {proposals.length > 0 && (
                <div className="space-y-4 animate-in slide-in-from-left duration-500">
                    <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-primary text-sm">shopping_cart_checkout</span>
                        <h3 className="text-white font-black text-[10px] uppercase tracking-widest">Propuestas de Compra IA Pendientes</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {proposals.map(prop => (
                            <div key={prop.id} className="glass-card p-4 rounded-xl border-primary/10 bg-white/[0.01] flex flex-col justify-between">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-start">
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${prop.prioridad === 'ALTA' ? 'bg-red-500/20 text-red-500' : 'bg-primary/20 text-primary'}`}>
                                            Prioridad {prop.prioridad}
                                        </span>
                                        <span className="text-[8px] text-stone-600 font-mono">{new Date(prop.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-white font-bold text-xs uppercase">{prop.Inventario_Global?.nombre || 'REPOSICIÓN GENERAL'}</p>
                                    <p className="text-[10px] text-stone-400 italic leading-relaxed">"{prop.motivo_ia}"</p>
                                </div>
                                <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                                    <button
                                        onClick={() => handleActionProposal(prop.id, 'CONVERTIDO')}
                                        className="flex-1 bg-primary/20 hover:bg-primary text-primary hover:text-black py-2 rounded-lg text-[9px] font-black uppercase transition-all"
                                    >
                                        Aprobar Requerimiento
                                    </button>
                                    <button
                                        onClick={() => handleActionProposal(prop.id, 'RECHAZADO')}
                                        className="px-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white py-2 rounded-lg text-[9px] font-black uppercase transition-all"
                                    >
                                        <span className="material-symbols-outlined text-sm">close</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="glass-card rounded-premium overflow-hidden border-white/5">
                <table className="w-full text-left">
                    <thead className="bg-white/5 border-b border-white/10 text-[10px] font-black text-stone-500 uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Recurso / Especificación</th>
                            <th className="px-6 py-4">Ubicación</th>
                            <th className="px-6 py-4">Stock Actual</th>
                            <th className="px-6 py-4">Atributos Críticos</th>
                            <th className="px-6 py-4 text-right">Estatus AI</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {filteredItems.map(item => {
                            const alert = getTechnicalAlert(item);
                            return (
                                <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-white font-bold text-xs uppercase">{item.nombre}</span>
                                            <span className="text-[9px] text-stone-500 uppercase font-bold">{(item as any).resource_subfamilies?.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-stone-400 text-[10px] font-mono">{item.ubicacion || 'NO ASIGNADA'}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-white font-black">{item.stock_disponible} <span className="text-[9px] text-stone-500">{item.unidad_medida}</span></span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2 flex-wrap">
                                            {Object.entries(item.specs_data || {}).map(([key, value]) => (
                                                <span key={key} className="text-[8px] font-black bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-stone-400 uppercase">
                                                    {key}: {value}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {alert ? (
                                            <div className="flex flex-col items-end gap-2">
                                                <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase ${alert.color}`}>
                                                    {alert.label}
                                                </span>
                                                <button
                                                    onClick={() => generateProposal(item.id, item.punto_reorden * 2, `Reponer por alerta: ${alert.label}`, 'ALTA')}
                                                    className="text-[7px] font-black text-primary uppercase underline hover:opacity-70 transition-opacity"
                                                >
                                                    Proponer Compra IA
                                                </button>
                                            </div>
                                        ) : (
                                            <span className="text-[8px] font-black text-emerald-500 uppercase">Óptimo</span>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TechnicalReport;
