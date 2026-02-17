
import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { InventarioItem } from '../types';

interface MaterialFormProps {
    onNavigate: (view: any) => void;
    material?: InventarioItem;
}

const MaterialForm: React.FC<MaterialFormProps> = ({ onNavigate, material }) => {
    const [families, setFamilies] = useState<any[]>([]);
    const [subfamilies, setSubfamilies] = useState<any[]>([]);
    const [selectedFamilyId, setSelectedFamilyId] = useState<string>('');
    const [selectedSubfamilyId, setSelectedSubfamilyId] = useState<string>(material?.subfamily_id || '');

    const [formData, setFormData] = useState<Partial<InventarioItem>>(
        material || {
            nombre: '',
            descripcion: '',
            stock_disponible: 0,
            stock_bloqueado: 0,
            unidad_medida: 'unidades',
            valor_unitario_promedio: 0,
            punto_reorden: 5,
            categoria: 'Construcción',
            subfamily_id: '',
            specs_data: {},
            ubicacion: '',
            url_foto: ''
        }
    );

    const [loading, setLoading] = useState(false);

    // SECURITY NOTE: Admin bypass functionality has been removed for security reasons.
    // If manual entry without PO is required, implement via Supabase Edge Function
    // with proper role verification from user_profiles table.

    React.useEffect(() => {
        loadFamilies();
    }, []);

    const loadFamilies = async () => {
        const data = await dataService.getFamilies();
        setFamilies(data);
    };

    const handleFamilyChange = async (familyId: string) => {
        setSelectedFamilyId(familyId);
        const data = await dataService.getSubfamilies(familyId);
        setSubfamilies(data);
        const family = families.find(f => f.id === familyId);
        if (family) {
            setFormData({ ...formData, categoria: family.name });
        }
    };

    const handleSubfamilyChange = (id: string) => {
        setSelectedSubfamilyId(id);
        const sub = subfamilies.find(s => s.id === id);
        setFormData({ ...formData, subfamily_id: id, specs_data: {} });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (material?.id) {
                await dataService.updateInventoryItem(material.id, formData);
            } else {
                await dataService.createMaterial(formData);
            }
            onNavigate('INVENTORY_DASHBOARD');
        } catch (error) {
            console.error('Error saving material:', error);
            alert('Error guardando material');
        } finally {
            setLoading(false);
        }
    };

    const renderDynamicFields = () => {
        const sub = subfamilies.find(s => s.id === selectedSubfamilyId);
        if (!sub || !sub.specs_config) return null;

        return sub.specs_config.map((spec: any) => (
            <div key={spec.key} className="space-y-2">
                <label className="text-[10px] font-bold text-primary uppercase tracking-widest ml-1">{spec.label}</label>
                {spec.type === 'select' ? (
                    <select
                        required={spec.required}
                        className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-white outline-none"
                        value={formData.specs_data?.[spec.key] || ''}
                        onChange={e => setFormData({
                            ...formData,
                            specs_data: { ...formData.specs_data, [spec.key]: e.target.value }
                        })}
                    >
                        <option value="">Seleccione...</option>
                        {spec.options.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                ) : (
                    <input
                        type={spec.type}
                        required={spec.required}
                        className="w-full bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 text-sm text-white outline-none"
                        value={formData.specs_data?.[spec.key] || ''}
                        onChange={e => setFormData({
                            ...formData,
                            specs_data: { ...formData.specs_data, [spec.key]: e.target.value }
                        })}
                        placeholder={spec.label}
                    />
                )}
            </div>
        ));
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in slide-in-from-bottom duration-500">
            <header className="flex items-center justify-between">
                <button
                    onClick={() => onNavigate('INVENTORY_DASHBOARD')}
                    className="h-10 w-10 flex items-center justify-center rounded-apple bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                    <span className="material-symbols-outlined text-stone-400">arrow_back</span>
                </button>
                <div className="text-center">
                    <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Maestro de Recursos KORE</p>
                    <h1 className="text-2xl font-black tracking-tighter text-white uppercase">
                        {material ? 'Editar Recurso SAP' : 'Nuevo Alta de Item'}
                    </h1>
                </div>
                <div className="w-10"></div>
            </header>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                    <div className="glass-card rounded-premium p-8 space-y-6 border-white/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Jerarquía en Cascada */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Familia (Nivel 1)</label>
                                <select
                                    required
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                                    value={selectedFamilyId}
                                    onChange={e => handleFamilyChange(e.target.value)}
                                >
                                    <option value="">Seleccione Familia...</option>
                                    {families.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Sub-Familia (Nivel 2)</label>
                                <select
                                    required
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none"
                                    value={selectedSubfamilyId}
                                    onChange={e => handleSubfamilyChange(e.target.value)}
                                    disabled={!selectedFamilyId}
                                >
                                    <option value="">Seleccione Sub-Familia...</option>
                                    {subfamilies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Nombre del Recurso</label>
                                <input
                                    required
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none font-bold"
                                    value={formData.nombre}
                                    onChange={e => setFormData({ ...formData, nombre: e.target.value.toUpperCase() })}
                                    placeholder="Nombre oficial SAP..."
                                />
                            </div>

                            {/* Campos Dinámicos */}
                            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-white/5">
                                {renderDynamicFields()}
                            </div>

                            <div className="col-span-1 md:col-span-2 space-y-2">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Descripción Técnica / Observaciones</label>
                                <textarea
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none min-h-[80px]"
                                    value={formData.descripcion}
                                    onChange={e => setFormData({ ...formData, descripcion: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Stock Disponible</label>
                                <input
                                    type="number"
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    value={formData.stock_disponible}
                                    onChange={e => setFormData({ ...formData, stock_disponible: parseFloat(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Unidad de Medida</label>
                                <input
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                    value={formData.unidad_medida}
                                    onChange={e => setFormData({ ...formData, unidad_medida: e.target.value })}
                                    placeholder="m2, kg, sacos..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Costo Promedio (USD)</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500 font-bold">$</span>
                                    <input
                                        type="number"
                                        step="0.01"
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-xl pl-8 pr-4 py-3 text-sm text-white focus:ring-2 focus:ring-primary/50 outline-none transition-all"
                                        value={formData.valor_unitario_promedio}
                                        onChange={e => setFormData({ ...formData, valor_unitario_promedio: parseFloat(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-stone-500 uppercase tracking-widest ml-1">Punto de Reorden (Alerta)</label>
                                <input
                                    type="number"
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3 text-sm text-amber-500 focus:ring-2 focus:ring-amber-500/50 outline-none transition-all font-bold"
                                    value={formData.punto_reorden}
                                    onChange={e => setFormData({ ...formData, punto_reorden: parseFloat(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="pt-4">
                            <div
                                onClick={() => document.getElementById('file-upload')?.click()}
                                className="border-2 border-dashed border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center space-y-3 bg-white/[0.01] hover:bg-white/[0.02] transition-all cursor-pointer group relative overflow-hidden"
                            >
                                {formData.url_foto ? (
                                    <img src={formData.url_foto} className="absolute inset-0 w-full h-full object-cover opacity-40" alt="Vista previa" />
                                ) : null}

                                <div className="relative z-10 flex flex-col items-center">
                                    <span className="material-symbols-outlined text-4xl text-stone-600 group-hover:text-primary transition-colors">
                                        {loading ? 'sync' : 'photo_camera'}
                                    </span>
                                    <p className="text-xs font-bold text-stone-300 uppercase tracking-widest mt-2">
                                        {formData.url_foto ? 'Cambiar Foto' : 'Capturar o Subir Foto'}
                                    </p>
                                    <p className="text-[10px] text-stone-600 uppercase mt-1">Soporta Cámara y Galería</p>
                                </div>

                                <input
                                    id="file-upload"
                                    type="file"
                                    accept="image/*"
                                    capture="environment"
                                    className="hidden"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            try {
                                                setLoading(true);
                                                const fileExt = file.name.split('.').pop();
                                                const fileName = `${Math.random()}.${fileExt}`;
                                                const filePath = `materiales/${fileName}`;

                                                const publicUrl = await dataService.uploadFile('inventory-assets', filePath, file);
                                                setFormData({ ...formData, url_foto: publicUrl });
                                            } catch (error) {
                                                console.error('Upload error:', error);
                                                alert('Error al subir la imagen. Verifica que el bucket "inventory-assets" exista.');
                                            } finally {
                                                setLoading(false);
                                            }
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Acción y Control */}
                <div className="space-y-6">
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary text-black h-14 rounded-premium text-xs font-black uppercase tracking-widest shadow-2xl shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3"
                    >
                        {loading ? (
                            <div className="h-5 w-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                        ) : (
                            <>
                                <span className="material-symbols-outlined">save</span>
                                Confirmar Registro
                            </>
                        )}
                    </button>

                    {/* SECURITY: Admin bypass removed - implement via Edge Function if needed */}
                    <div className="glass-card rounded-2xl p-6 border-white/5 bg-white/[0.02] space-y-3">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-stone-500">info</span>
                            <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-widest">Nota de Seguridad</h3>
                        </div>
                        <p className="text-[9px] text-stone-500 font-medium leading-relaxed">
                            Los ingresos manuales sin OC requieren autorización administrativa. Contacte a su supervisor.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default MaterialForm;
