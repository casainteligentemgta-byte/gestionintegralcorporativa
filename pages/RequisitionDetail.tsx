
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { ProjectMovement, InventoryItem, Project } from '../types';

interface RequisitionDetailProps {
    onNavigate: (view: any, data?: any) => void;
    requisitionId?: string;
}

const RequisitionDetail: React.FC<RequisitionDetailProps> = ({ onNavigate, requisitionId }) => {
    const [movement, setMovement] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [transferCost, setTransferCost] = useState<number>(0);

    useEffect(() => {
        if (requisitionId) {
            fetchMovement();
        }
    }, [requisitionId]);

    const fetchMovement = async () => {
        try {
            const { data, error } = await supabase
                .from('project_movements')
                .select(`
          *,
          project:projects(*),
          material:inventory_global(*)
        `)
                .eq('id', requisitionId)
                .single();

            if (error) throw error;
            setMovement(data);
            setTransferCost(data.transfer_cost || 0);
        } catch (error) {
            console.error('Error fetching movement:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateTransferCost = async () => {
        try {
            const { error } = await supabase
                .from('project_movements')
                .update({ transfer_cost: transferCost })
                .eq('id', requisitionId);

            if (error) throw error;
            alert('Costo de flete actualizado');
        } catch (error: any) {
            alert('Error updating cost: ' + error.message);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    if (!movement) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-stone-950 p-6 text-center">
                <span className="material-symbols-outlined text-stone-500 text-6xl mb-4">inventory_2</span>
                <h2 className="text-white text-xl font-bold">No se encontró el requerimiento</h2>
                <button
                    onClick={() => onNavigate('PROJECTS')}
                    className="mt-6 text-primary font-bold"
                >
                    Volver a Proyectos
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-md mx-auto min-h-screen flex flex-col relative overflow-hidden bg-stone-950 font-display text-stone-100">
            {/* Header Status Bar */}
            <div className="bg-primary/10 border-b border-primary/20 py-2 px-4 flex items-center justify-center sticky top-0 z-50 backdrop-blur-md">
                <span className={`flex h-2 w-2 rounded-full mr-2 ${movement.status === 'Pendiente' ? 'bg-primary animate-pulse' : 'bg-green-500'}`}></span>
                <span className="text-[10px] font-bold tracking-widest text-primary uppercase">
                    {movement.status === 'Pendiente' ? 'Pendiente de Aprobación' : movement.status}
                </span>
            </div>

            <header className="flex items-center justify-between px-6 py-4">
                <button onClick={() => onNavigate('PROJECTS')} className="text-stone-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">arrow_back_ios</span>
                </button>
                <h1 className="text-lg font-semibold tracking-tight">Detalle de Vale</h1>
                <button className="text-stone-400 hover:text-primary transition-colors">
                    <span className="material-symbols-outlined">more_horiz</span>
                </button>
            </header>

            <main className="flex-1 px-6 pb-28 space-y-6 overflow-y-auto">
                <div className="glass-card rounded-2xl overflow-hidden relative shadow-2xl bg-white/5 backdrop-blur-xl border border-white/10">
                    <div className="p-6 border-b border-white/5 bg-gradient-to-br from-white/5 to-transparent">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <p className="text-stone-400 text-[10px] font-medium uppercase tracking-widest">Folio Requisición</p>
                                <h2 className="text-3xl font-bold text-primary tracking-tighter">#RQ-{movement.id.substring(0, 8).toUpperCase()}</h2>
                            </div>
                            <div className="h-12 w-12 rounded-full border-2 border-primary/30 p-0.5 overflow-hidden">
                                <div className="w-full h-full bg-primary/20 flex items-center justify-center rounded-full">
                                    <span className="material-symbols-outlined text-primary">person</span>
                                </div>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold">Residente Encargado</p>
                            <p className="text-xs text-stone-500">ID Obra: {movement.project_id.substring(0, 6)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-white/5">
                        <div className="p-5 bg-stone-900/40">
                            <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">Material</p>
                            <p className="text-sm font-medium">{movement.material?.material_name}</p>
                            <p className="text-xs text-stone-400 mt-1 italic">{movement.material?.unit_measure}</p>
                        </div>
                        <div className="p-5 bg-stone-900/40">
                            <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">Cantidad Requested</p>
                            <p className="text-sm font-medium">{movement.quantity_dispatched} {movement.material?.unit_measure}</p>
                            <p className="text-xs text-stone-400 mt-1">Stock Actual: {movement.material?.current_stock}</p>
                        </div>
                        <div className="col-span-2 p-5 bg-stone-900/40 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">Obra de Destino</p>
                                <p className="text-sm font-medium flex items-center">
                                    <span className="material-symbols-outlined text-primary text-sm mr-1">location_on</span>
                                    {movement.project?.name}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[10px] text-stone-500 uppercase tracking-wider mb-1">Prioridad</p>
                                <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">ALTA</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-5 py-3 bg-stone-900/20 border-t border-white/5">
                        <p className="text-[9px] text-stone-500 flex items-center italic">
                            <span className="material-symbols-outlined text-[10px] mr-1">lock</span>
                            Costos de materiales visibles solo para personal autorizado.
                        </p>
                    </div>

                    <div className="p-5 bg-stone-900/60 border-t border-white/5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined">local_shipping</span>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold">Logística Terrestre</p>
                                    <p className="text-[10px] text-stone-500">Monto del flete (Editable)</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end">
                                <div className="relative">
                                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-400 text-xs">$</span>
                                    <input
                                        className="w-24 bg-stone-800/50 border border-white/10 rounded-lg py-1 pl-5 pr-2 text-right text-sm font-bold text-stone-100 focus:outline-none focus:ring-1 focus:ring-primary transition-all"
                                        type="number"
                                        value={transferCost}
                                        onChange={(e) => setTransferCost(parseFloat(e.target.value))}
                                        onBlur={handleUpdateTransferCost}
                                    />
                                </div>
                                <p className="text-[10px] text-stone-500 mt-1">USD</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-2 pt-2">
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest mb-6">Estado del Proceso</h3>
                    <div className="space-y-0 relative before:content-[''] before:absolute before:left-3 before:top-3 before:bottom-3 before:w-px before:bg-stone-800">
                        <div className="flex items-start mb-6 relative">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-green-500/20 text-green-500 border border-green-500/30 z-10">
                                <span className="material-symbols-outlined text-sm">check</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-semibold">Solicitud Generada</p>
                                <p className="text-xs text-stone-500">{new Date(movement.registration_date).toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-start mb-6 relative">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary border border-primary/50 z-10 relative">
                                <div className="absolute inset-0 rounded-full bg-primary/30 animate-ping"></div>
                                <span className="material-symbols-outlined text-sm">engineering</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-semibold text-primary">Validación Técnica</p>
                                <p className="text-xs text-stone-400 italic">En revisión por Ing. de Obra</p>
                            </div>
                        </div>

                        <div className="flex items-start relative">
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-800 text-stone-600 border border-stone-700 z-10">
                                <span className="material-symbols-outlined text-sm">assignment_turned_in</span>
                            </div>
                            <div className="ml-4">
                                <p className="text-sm font-semibold text-stone-600">Autorización Administrativa</p>
                                <p className="text-xs text-stone-700">Esperando validación de costos</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-stone-900/50 border border-stone-800 p-4 rounded-xl flex items-start space-x-3">
                    <span className="material-symbols-outlined text-stone-500 text-lg">info</span>
                    <p className="text-xs text-stone-400 leading-relaxed">
                        Su solicitud ha sido enviada al <span className="text-stone-200 font-medium">Residente de Obra</span> para su confirmación final. Recibirá una notificación en cuanto se actualice el estatus.
                    </p>
                </div>
            </main>

            <div className="fixed bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-stone-950 via-stone-950/95 to-transparent space-y-3 z-50">
                <button className="w-full bg-primary hover:bg-primary/90 text-stone-950 font-bold py-4 rounded-2xl flex items-center justify-center transition-all shadow-lg shadow-primary/10 apple-button">
                    <span className="material-symbols-outlined mr-2">ios_share</span>
                    Compartir Ticket
                </button>
                <button className="w-full bg-transparent border border-red-900/30 text-red-500/80 font-medium py-3 rounded-2xl flex items-center justify-center hover:bg-red-500/5 transition-all">
                    <span className="material-symbols-outlined text-sm mr-2">close</span>
                    Cancelar Solicitud
                </button>
                <div className="h-1.5 w-32 bg-stone-800 rounded-full mx-auto mt-2"></div>
            </div>
        </div>
    );
};

export default RequisitionDetail;

