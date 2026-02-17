
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

interface StockTakingProps {
    onNavigate: (view: any) => void;
}

const StockTaking: React.FC<StockTakingProps> = ({ onNavigate }) => {
    const [inventory, setInventory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [counts, setCounts] = useState<Record<string, number>>({});
    const [isSubmitting, setIsSubmitting] = useState<string | null>(null);

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

    const handleCountSubmit = async (materialId: string) => {
        const qty = counts[materialId];
        if (qty === undefined || qty < 0) {
            alert("Por favor ingrese una cantidad válida.");
            return;
        }

        setIsSubmitting(materialId);
        try {
            const result = await dataService.submitAuditCount(materialId, qty);
            if (result.status === 'CONFLICTO') {
                alert("⚠️ DIFERENCIA DETECTADA: La cantidad contada no coincide con el sistema. Se ha marcado para revisión.");
            } else {
                alert("✅ CONCILIADO: Inventario conforme.");
            }
            // Refresh local state to show it's done or remove it
            setInventory(inventory.filter(i => i.id !== materialId));
        } catch (error: any) {
            alert("Error al registrar auditoría: " + error.message);
        } finally {
            setIsSubmitting(null);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-stone-950 text-white">Cargando Maestro de Inventario...</div>;

    return (
        <div className="max-w-xl mx-auto p-4 space-y-6 animate-in fade-in zoom-in-95 duration-500">
            <header className="space-y-1">
                <p className="text-secondary font-black text-[9px] uppercase tracking-widest text-center">Protocolo de Control Físico</p>
                <h1 className="text-3xl font-black text-white text-center uppercase tracking-tighter">Conteo Ciego</h1>
                <p className="text-stone-500 text-[9px] font-bold text-center uppercase tracking-widest italic leading-none">
                    "La cantidad del sistema está oculta para garantizar una auditoría imparcial."
                </p>
            </header>

            <div className="space-y-4">
                {inventory.length === 0 ? (
                    <div className="p-10 text-center glass-card opacity-40">
                        <p className="text-xs font-black uppercase text-white">Todo el inventario ha sido auditado</p>
                    </div>
                ) : (
                    inventory.map(item => (
                        <div key={item.id} className="glass-card p-5 rounded-3xl border-white/5 bg-white/[0.02] flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h2 className="text-sm font-black text-white uppercase">{item.nombre}</h2>
                                    <p className="text-[9px] text-stone-500 font-bold uppercase tracking-widest">{item.resource_subfamilies?.nombre || 'General'}</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-[9px] font-black text-primary px-2 py-1 bg-primary/10 rounded-lg">{item.unidad_medida}</span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-stone-600 uppercase">Ubicación</p>
                                    <p className="text-[10px] text-white font-bold">{item.ubicacion_almacen || 'Sin Asignar'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[8px] font-black text-stone-600 uppercase">Lote / Serie</p>
                                    <p className="text-[10px] text-white font-bold opacity-60">**********</p>
                                </div>
                            </div>

                            <div className="flex gap-3 mt-2">
                                <input
                                    type="number"
                                    placeholder="Ingrese Cant. Contada"
                                    className="flex-1 bg-black/40 border border-white/10 rounded-2xl py-3 px-4 text-white text-sm font-black outline-none focus:border-primary/50 text-center"
                                    value={counts[item.id] || ''}
                                    onChange={(e) => setCounts({ ...counts, [item.id]: parseFloat(e.target.value) })}
                                />
                                <button
                                    onClick={() => handleCountSubmit(item.id)}
                                    disabled={isSubmitting === item.id}
                                    className={`px-6 rounded-2xl font-black uppercase text-[10px] transition-all ${isSubmitting === item.id ? 'bg-stone-800 text-stone-600' : 'bg-white text-black hover:scale-105'}`}
                                >
                                    {isSubmitting === item.id ? 'Validando...' : 'Validar'}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <footer className="pt-10 border-t border-white/10 text-center">
                <button
                    onClick={() => onNavigate('INVENTORY_DASHBOARD')}
                    className="text-[10px] font-black text-stone-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                    Finalizar y Volver al Dashboard
                </button>
            </footer>
        </div>
    );
};

export default StockTaking;
