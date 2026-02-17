
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { InventarioItem, Project } from '../types';

interface RequisitionFormProps {
    onNavigate: (view: any) => void;
}

const RequisitionForm: React.FC<RequisitionFormProps> = ({ onNavigate }) => {
    const [materials, setMaterials] = useState<InventarioItem[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        id_material: '',
        cantidad: 0,
        obra_destino: '',
        justificacion: '',
    });

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [matData, projData] = await Promise.all([
                dataService.getInventory(),
                dataService.getProjects()
            ]);
            setMaterials(matData);
            setProjects(projData);
        } catch (error) {
            console.error('Error loading form data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.id_material || !formData.obra_destino || formData.cantidad <= 0) {
            alert('Por favor completa todos los campos obligatorios.');
            return;
        }

        setSubmitting(true);
        try {
            await dataService.createMovement({
                ...formData,
                tipo_movimiento: 'SALIDA',
                estado: 'PENDIENTE'
            } as any);
            alert('Vale de salida generado. Pendiente de aprobación administrativa.');
            onNavigate('INVENTORY_DASHBOARD');
        } catch (error) {
            console.error('Error creating requisition:', error);
            alert('Error al generar la solicitud');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    const selectedMaterial = materials.find(m => m.id === formData.id_material);

    return (
        <div className="max-w-2xl mx-auto p-6 space-y-8 animate-in slide-in-from-right duration-500">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-secondary font-bold text-[10px] uppercase tracking-widest mb-1">Operaciones de Campo</p>
                    <h1 className="text-2xl font-black text-white tracking-tighter">Vale de Salida (Requisición)</h1>
                </div>
                <button
                    onClick={() => onNavigate('INVENTORY_DASHBOARD')}
                    className="text-stone-500 hover:text-white transition-colors"
                >
                    <span className="material-symbols-outlined">close</span>
                </button>
            </header>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="glass-card rounded-premium p-8 space-y-8 border-white/5 bg-white/[0.01]">
                    {/* Material Selection */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Seleccionar Material del Almacén</label>
                        <div className="flex flex-col gap-4">
                            <select
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer font-bold"
                                value={formData.id_material}
                                onChange={e => setFormData({ ...formData, id_material: e.target.value })}
                            >
                                <option value="">--- Seleccione Material a Retirar ---</option>
                                {materials.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre} • Stock: {m.stock_disponible} {m.unidad_medida}</option>
                                ))}
                            </select>

                            {selectedMaterial && (
                                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-300">
                                    <div className="flex flex-col gap-1">
                                        <p className="text-[10px] text-primary font-black uppercase tracking-[0.15em]">Disponibilidad en Almacén</p>
                                        <h2 className="text-4xl font-black text-white tracking-tighter">
                                            {selectedMaterial.stock_disponible}
                                            <span className="text-base text-stone-500 ml-2 font-black uppercase">{selectedMaterial.unidad_medida}</span>
                                        </h2>
                                    </div>
                                    <div className="text-right flex flex-col gap-1">
                                        <p className="text-[10px] text-stone-500 font-black uppercase tracking-[0.15em]">Costo de Referencia</p>
                                        <p className="text-xl font-black text-stone-100 tabular-nums">${selectedMaterial.valor_unitario_promedio}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-8">
                        {/* Destination Project - Full Width */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Obra / Proyecto de Destino</label>
                            <select
                                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all appearance-none cursor-pointer font-bold"
                                value={formData.obra_destino}
                                onChange={e => setFormData({ ...formData, obra_destino: e.target.value })}
                            >
                                <option value="">--- Seleccione Obra Receptora ---</option>
                                {projects.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Quantity */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-1">Cantidad a Retirar</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-5 py-4 text-lg font-black text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    value={formData.cantidad}
                                    onChange={e => setFormData({ ...formData, cantidad: parseFloat(e.target.value) })}
                                />
                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-xs text-stone-500 font-black uppercase tracking-widest">
                                    {selectedMaterial?.unidad_medida || 'Unidades'}
                                </span>
                            </div>
                        </div>
                    </div>



                    {/* Justification */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Justificación del Requerimiento</label>
                        <textarea
                            className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all min-h-[80px]"
                            value={formData.justificacion}
                            onChange={e => setFormData({ ...formData, justificacion: e.target.value })}
                            placeholder="Ej: Material necesario para fundaciones de Torre A etapa 2..."
                        />
                    </div>

                    {/* Photo Capture for Proof */}
                    <div className="space-y-4 pt-4 border-t border-white/5">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Evidencia de Solicitud (Foto)</label>
                        <div
                            onClick={() => document.getElementById('req-photo')?.click()}
                            className="w-full h-32 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center bg-white/[0.01] hover:bg-white/[0.02] transition-all cursor-pointer relative overflow-hidden group"
                        >
                            {(formData as any).url_foto ? (
                                <img src={(formData as any).url_foto} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Evidencia" />
                            ) : null}

                            <div className="relative z-10 flex flex-col items-center">
                                <span className="material-symbols-outlined text-3xl text-stone-600 group-hover:text-emerald-500 transition-colors">add_a_photo</span>
                                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mt-2">Tomar Foto de Remisión / Material</p>
                            </div>

                            <input
                                id="req-photo"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                className="hidden"
                                onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        try {
                                            setSubmitting(true);
                                            const filePath = `requisiciones/${Date.now()}-${file.name}`;
                                            const publicUrl = await dataService.uploadFile('inventory-assets', filePath, file);
                                            setFormData({ ...formData, url_foto: publicUrl } as any);
                                        } catch (error) {
                                            console.error('Upload error:', error);
                                            alert('Error al subir la evidencia');
                                        } finally {
                                            setSubmitting(false);
                                        }
                                    }
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="w-full bg-emerald-600 text-white h-14 rounded-premium text-xs font-black uppercase tracking-widest shadow-2xl shadow-emerald-500/10 hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
                    >
                        {submitting ? (
                            <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">send</span>
                                Enviar Solicitud a Revisión
                            </>
                        )}
                    </button>
                    <p className="text-center text-[9px] text-stone-600 mt-4 uppercase font-medium tracking-widest">
                        Toda salida de almacén debe ser validada por el administrador central.
                    </p>
                </div>
            </form>
        </div>
    );
};

export default RequisitionForm;
