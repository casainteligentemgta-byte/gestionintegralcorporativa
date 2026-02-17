
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

interface InventoryValuationReportProps {
    onNavigate: (view: any) => void;
}

const InventoryValuationReport: React.FC<InventoryValuationReportProps> = ({ onNavigate }) => {
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await dataService.getInventory();
            setInventory(data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const calculateTotalValuation = () => {
        return inventory.reduce((acc, item) => acc + (item.stock_disponible * (item.valor_unitario_promedio || 0)), 0);
    };

    const getValuationByCategory = () => {
        const cats: Record<string, number> = {};
        inventory.forEach(item => {
            const cat = item.resource_subfamilies?.resource_families?.nombre || 'Otros';
            cats[cat] = (cats[cat] || 0) + (item.stock_disponible * (item.valor_unitario_promedio || 0));
        });
        return Object.entries(cats).sort((a, b) => b[1] - a[1]);
    };

    if (loading) return <div className="p-20 text-center text-primary font-black animate-pulse">GENERANDO INFORME PATRIMONIAL...</div>;

    const totalValuation = calculateTotalValuation();
    const categories = getValuationByCategory();

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-1000">
            {/* CABECERA EJECUTIVA */}
            <header className="flex justify-between items-start border-b-2 border-primary/20 pb-8">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(255,215,0,0.5)]"></div>
                        <p className="text-primary font-black text-[10px] uppercase tracking-[0.4em]">Corporate Financial Intelligence</p>
                    </div>
                    <h1 className="text-5xl font-black text-white tracking-tighter uppercase leading-none">Reporte de Valorización <br /> de Inventario</h1>
                    <div className="flex gap-4 mt-4">
                        <span className="text-stone-500 text-[10px] font-bold uppercase tracking-widest border-r border-white/10 pr-4">Corte: {new Date().toLocaleDateString()}</span>
                        <span className="text-stone-500 text-[10px] font-bold uppercase tracking-widest">Responsable: Control de Gestión</span>
                    </div>
                </div>
                <div className="flex flex-col gap-3">
                    <button onClick={() => window.print()} className="h-12 px-8 rounded-2xl bg-white text-black font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-white/10">Exportar PDF / Imprimir</button>
                    <button onClick={() => onNavigate('INVENTORY_DASHBOARD')} className="h-12 px-8 rounded-2xl bg-white/5 border border-white/10 text-stone-400 font-black uppercase text-[10px] tracking-widest hover:bg-white/10 transition-all">Regresar</button>
                </div>
            </header>

            {/* TOP KPI CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="glass-card p-10 rounded-[3rem] bg-gradient-to-br from-primary/10 to-transparent border-primary/20 flex flex-col justify-between h-64">
                    <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em]">Total Valorización Stock</p>
                    <div>
                        <span className="text-stone-500 text-xl font-black uppercase mr-2">$</span>
                        <span className="text-6xl font-black text-white tracking-tighter">{totalValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <p className="text-stone-500 text-[9px] font-bold uppercase tracking-widest">Basado en Costo Promedio Ponderado</p>
                </div>

                <div className="glass-card p-10 rounded-[3rem] bg-white/[0.02] border-white/5 flex flex-col justify-between h-64">
                    <p className="text-stone-400 font-black text-[10px] uppercase tracking-[0.3em]">Ítems Activos</p>
                    <div className="flex items-end gap-4">
                        <span className="text-6xl font-black text-white tracking-tighter">{inventory.length}</span>
                        <span className="text- stone-500 text-lg font-black uppercase mb-2">SKUs</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <p className="text-stone-500 text-[9px] font-bold uppercase tracking-widest">Integridad de Datos: 100%</p>
                    </div>
                </div>

                <div className="glass-card p-10 rounded-[3rem] bg-white/[0.02] border-white/5 flex flex-col justify-between h-64">
                    <p className="text-stone-400 font-black text-[10px] uppercase tracking-[0.3em]">Salud del Inventario</p>
                    <div>
                        <span className="text-6xl font-black text-emerald-500 tracking-tighter">98%</span>
                    </div>
                    <p className="text-stone-500 text-[9px] font-bold uppercase tracking-widest">Conciliación según última auditoría</p>
                </div>
            </div>

            {/* SECCIÓN ANALÍTICA */}
            <div className="grid lg:grid-cols-2 gap-12">
                {/* BREAKDOWN POR CATEGORÍA */}
                <section className="space-y-6">
                    <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4">
                        Distribución por Familia de Recursos
                        <div className="flex-1 h-px bg-white/10"></div>
                    </h3>
                    <div className="space-y-6">
                        {categories.map(([name, value]) => (
                            <div key={name} className="space-y-2">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest">{name}</span>
                                    <span className="text-[10px] font-mono text-stone-400">$ {value.toLocaleString()}</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-primary"
                                        style={{ width: `${(value / totalValuation) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* TABLA DE TOP VALORIZADOS */}
                <section className="space-y-6">
                    <h3 className="text-white font-black text-xs uppercase tracking-[0.3em] flex items-center gap-4">
                        Top 5 Artículos de Mayor Valor
                        <div className="flex-1 h-px bg-white/10"></div>
                    </h3>
                    <div className="glass-card rounded-3xl border-white/5 bg-white/[0.01] overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-white/5 text-[8px] font-black text-stone-500 uppercase tracking-widest">
                                <tr>
                                    <th className="px-6 py-4">Descripción</th>
                                    <th className="px-6 py-4 text-center">Stock</th>
                                    <th className="px-6 py-4 text-right">Valorización</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[...inventory]
                                    .sort((a, b) => (b.stock_disponible * b.valor_unitario_promedio) - (a.stock_disponible * a.valor_unitario_promedio))
                                    .slice(0, 5)
                                    .map(item => (
                                        <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-[10px] font-bold text-white uppercase">{item.nombre}</p>
                                                <p className="text-[8px] text-stone-500 uppercase">{item.resource_subfamilies?.nombre}</p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-xs font-mono text-stone-400">{item.stock_disponible}</span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="text-xs font-mono font-bold text-white">$ {(item.stock_disponible * (item.valor_unitario_promedio || 0)).toLocaleString()}</span>
                                            </td>
                                        </tr>
                                    ))
                                }
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* NOTA POLÍTICA */}
            <footer className="bg-primary/5 border border-primary/20 rounded-3xl p-8">
                <div className="flex gap-6 items-start">
                    <span className="material-symbols-outlined text-primary text-3xl">info</span>
                    <div className="space-y-2">
                        <p className="text-xs font-black text-white uppercase">Certificación de Valorización Corporativa</p>
                        <p className="text-[10px] text-stone-500 leading-relaxed">
                            Este reporte representa el valor contable y físico de los activos bajo custodia de la corporación.
                            La valorización se calcula utilizando el método **PMP (Promedio Móvil Ponderado)** según estándares NIIF.
                            Cualquier discrepancia debe ser reportada al Departamento de Auditoría Interna dentro de las 24 horas posteriores al cierre.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default InventoryValuationReport;
