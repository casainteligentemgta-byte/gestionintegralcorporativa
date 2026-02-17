
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

type MaterialCategory = 'MATERIALES' | 'MAQUINARIA' | 'COMBUSTIBLES' | 'EPP';

interface AdvancedStockEntryProps {
    onNavigate: (view: any) => void;
    selectedCategory: MaterialCategory;
}

const AdvancedStockEntry: React.FC<AdvancedStockEntryProps> = ({ onNavigate, selectedCategory }) => {
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [vencimientoAlerta, setVencimientoAlerta] = useState<string | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        // BLOQUE A: Logística
        orden_compra_id: '',
        guia_remision: '',
        factura_proveedor: '',
        transportista_nombre: '',
        vehiculo_placa: '',
        almacen_id: '',

        // BLOQUE B: Atributos Dinámicos
        specs: {} as any,

        // BLOQUE C: Evidencia
        observaciones: '',
        foto_guia: null as File | null,
        fotos_estado: [] as File[]
    });

    // Configuración de campos por categoría (Entregable 2)
    const categoryConfig = {
        MATERIALES: [
            { id: 'lote', label: 'Lote de Fabricación', type: 'text', required: true, placeholder: 'Ej. LOT-2024-X1' },
            { id: 'f_vencimiento', label: 'Fecha de Vencimiento', type: 'date', required: false },
            { id: 'ubicacion_fisica', label: 'Ubicación Física (Bincard)', type: 'select', options: ['A-01', 'A-02', 'B-01', 'EXTERIOR'], required: true },
            { id: 'estado_envase', label: 'Estado del Envase', type: 'radio', options: ['Intacto', 'Dañado', 'Abierto'], required: true }
        ],
        MAQUINARIA: [
            { id: 'horometro', label: 'Horómetro de Llegada', type: 'number', required: true, step: '0.01' },
            { id: 'serie_vin', label: 'Serie / Chasis (VIN)', type: 'text', required: true },
            { id: 'cod_patrimonial', label: 'Código Patrimonial', type: 'text', required: true },
            { id: 'modalidad', label: 'Modalidad de Propiedad', type: 'select', options: ['PROPIO', 'ALQUILADO'], required: true }
        ],
        COMBUSTIBLES: [
            { id: 'volumen', label: 'Volumen Recepcionado', type: 'number', required: true },
            { id: 'unidad', label: 'Unidad de Medida', type: 'select', options: ['Galones', 'Litros'], required: true },
            { id: 'check_msds', label: '¿Se recibió Hoja de Seguridad (MSDS)?', type: 'checkbox', required: true },
            { id: 'tanque_destino', label: 'Tanque de Almacenamiento', type: 'select', options: ['T-01 (Principal)', 'T-02 (Aux)'], required: true }
        ],
        EPP: [
            { id: 'talla', label: 'Talla', type: 'select', options: ['S', 'M', 'L', 'XL', '2XL', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'], required: true },
            { id: 'norma', label: 'Norma de Certificación', type: 'text', required: true, placeholder: 'Ej. ANSI Z87.1 / ISO 9001' }
        ]
    };

    // Lógica de Validación (Entregable 3)
    const validateEntryData = (data: any) => {
        let newErrors: Record<string, string> = {};

        // Regla 1: Bloque A
        if (!data.guia_remision) newErrors.guia_remision = 'La Guía de Remisión es obligatoria para el control interno.';
        if (!data.vehiculo_placa) newErrors.vehiculo_placa = 'La placa es obligatoria para trazabilidad de acceso.';
        if (!data.almacen_id) newErrors.almacen_id = 'Debe seleccionar un almacén de destino.';

        // Regla 2: Integridad de Activos (Maquinaria)
        if (selectedCategory === 'MAQUINARIA') {
            if (!data.specs.horometro) newErrors.horometro = 'El horómetro es crítico para el plan de mantenimiento.';
            if (!data.specs.serie_vin) newErrors.serie_vin = 'El VIN/Serie es obligatorio para el registro patrimonial.';
        }

        // Regla 3: Seguridad Industrial (Combustibles)
        if (selectedCategory === 'COMBUSTIBLES') {
            if (!data.specs.check_msds) newErrors.check_msds = 'BLOQUEO: Protocolo de seguridad exige hoja MSDS física.';
        }

        // Regla 4: Evidencias
        if (!data.foto_guia) newErrors.foto_guia = 'Debe adjuntar foto de la Guía de Remisión firmada.';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle Fecha Vencimiento Alerta
    useEffect(() => {
        if (formData.specs.f_vencimiento) {
            const vent = new Date(formData.specs.f_vencimiento);
            const today = new Date();
            const diff = Math.ceil((vent.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            if (diff > 0 && diff < 30) {
                setVencimientoAlerta(`⚠️ ALERTA: Material próximo a vencer en ${diff} días. Priorizar rotación.`);
            } else {
                setVencimientoAlerta(null);
            }
        }
    }, [formData.specs.f_vencimiento]);

    const handleAction = () => {
        if (validateEntryData(formData)) {
            setLoading(true);
            setTimeout(() => {
                alert("INGRESO EXITOSO: El material ha sido internado en el sistema SAP KORE.");
                onNavigate('INVENTORY_DASHBOARD');
            }, 1000);
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-8 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <header className="flex justify-between items-end border-b border-primary/20 pb-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Nota de Entrada - Registro Técnico</span>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">Detalle de Ingreso</h1>
                    <p className="text-stone-500 text-[10px] font-bold uppercase mt-2 tracking-widest">Procedimiento de Almacén N° 01 • Categoría: <span className="text-white">{selectedCategory}</span></p>
                </div>
                <button
                    onClick={() => onNavigate('INVENTORY_DASHBOARD')}
                    className="h-10 px-6 rounded-apple bg-white/5 border border-white/10 text-stone-400 text-[10px] font-bold uppercase hover:bg-white/10 transition-all"
                >
                    Cancelar
                </button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div className="space-y-10">
                    {/* BLOQUE A: CABECERA LOGÍSTICA */}
                    <section className="space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                                <span className="material-symbols-outlined text-primary text-sm">local_shipping</span>
                            </div>
                            <h2 className="text-white font-black text-xs uppercase tracking-widest">Bloque A: Gestión de Transporte</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Orden de Compra ID</label>
                                <input
                                    type="text"
                                    placeholder="OC-0000X"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-primary/50 transition-all font-mono"
                                    onChange={(e) => setFormData({ ...formData, orden_compra_id: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Guía de Remisión*</label>
                                <input
                                    type="text"
                                    placeholder="001-000XXX"
                                    className={`w-full bg-white/5 border ${errors.guia_remision ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-primary/50 transition-all font-mono`}
                                    onChange={(e) => setFormData({ ...formData, guia_remision: e.target.value })}
                                />
                                {errors.guia_remision && <p className="text-[8px] text-red-500 font-bold uppercase mt-1">{errors.guia_remision}</p>}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1 text-xs">
                                <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Nombre del Transportista</label>
                                <input
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-primary/50"
                                    onChange={(e) => setFormData({ ...formData, transportista_nombre: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Vehículo (Placa)*</label>
                                <input
                                    type="text"
                                    placeholder="AAA-000"
                                    className={`w-full bg-white/5 border ${errors.vehiculo_placa ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-primary/50 font-mono`}
                                    onChange={(e) => setFormData({ ...formData, vehiculo_placa: e.target.value })}
                                />
                                {errors.vehiculo_placa && <p className="text-[8px] text-red-500 font-bold uppercase mt-1">{errors.vehiculo_placa}</p>}
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Almacén de Internamiento*</label>
                            <select
                                className={`w-full bg-white/5 border ${errors.almacen_id ? 'border-red-500' : 'border-white/10'} rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-primary/50`}
                                onChange={(e) => setFormData({ ...formData, almacen_id: e.target.value })}
                            >
                                <option value="">Seleccione Bodega...</option>
                                <option value="W-01">Almacén Central (Santiago)</option>
                                <option value="O-02">Obra: Edificio KORE - Nivel 0</option>
                                <option value="Y-00">Patio de Maquinaria</option>
                            </select>
                            {errors.almacen_id && <p className="text-[8px] text-red-500 font-bold uppercase mt-1">{errors.almacen_id}</p>}
                        </div>
                    </section>
                </div>

                <div className="space-y-10">
                    {/* BLOQUE B: ATRIBUTOS DINÁMICOS */}
                    <section className="glass-card p-6 rounded-premium border-primary/20 bg-primary/[0.02]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-black text-sm">inventory_2</span>
                            </div>
                            <div>
                                <h2 className="text-white font-black text-xs uppercase tracking-widest">Bloque B: Especificaciones Técnicas</h2>
                                <p className="text-[8px] text-primary font-bold uppercase tracking-[0.2em]">Criterios de Calidad SAP MM</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {categoryConfig[selectedCategory].map((field) => (
                                <div key={field.id} className="space-y-2">
                                    <label className="text-[9px] font-black text-stone-500 uppercase flex justify-between">
                                        {field.label} {field.required && <span className="text-primary">*</span>}
                                    </label>

                                    {field.type === 'select' ? (
                                        <select
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-primary/50"
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                specs: { ...formData.specs, [field.id]: e.target.value }
                                            })}
                                        >
                                            <option value="">Seleccionar...</option>
                                            {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : field.type === 'radio' ? (
                                        <div className="flex gap-4">
                                            {field.options?.map(opt => (
                                                <label key={opt} className="flex items-center gap-2 cursor-pointer group">
                                                    <input
                                                        type="radio"
                                                        name={field.id}
                                                        className="hidden"
                                                        onChange={() => setFormData({
                                                            ...formData,
                                                            specs: { ...formData.specs, [field.id]: opt }
                                                        })}
                                                    />
                                                    <div className={`w-4 h-4 rounded-full border-2 border-white/20 flex items-center justify-center transition-all ${formData.specs[field.id] === opt ? 'border-primary bg-primary' : 'group-hover:border-white/40'}`}>
                                                        {formData.specs[field.id] === opt && <div className="w-1.5 h-1.5 bg-black rounded-full" />}
                                                    </div>
                                                    <span className="text-[10px] text-stone-400 group-hover:text-white transition-colors">{opt}</span>
                                                </label>
                                            ))}
                                        </div>
                                    ) : field.type === 'checkbox' ? (
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="hidden"
                                                onChange={(e) => setFormData({
                                                    ...formData,
                                                    specs: { ...formData.specs, [field.id]: e.target.checked }
                                                })}
                                            />
                                            <div className={`w-5 h-5 rounded border-2 border-white/10 flex items-center justify-center transition-all ${formData.specs[field.id] ? 'bg-primary border-primary' : 'bg-white/5'}`}>
                                                {formData.specs[field.id] && <span className="material-symbols-outlined text-black font-black text-sm">check</span>}
                                            </div>
                                            <span className="text-[10px] text-stone-400 group-hover:text-white">{field.label}</span>
                                        </label>
                                    ) : (
                                        <input
                                            type={field.type}
                                            step={field.step}
                                            placeholder={field.placeholder}
                                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-primary/50 font-mono"
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                specs: { ...formData.specs, [field.id]: e.target.value }
                                            })}
                                        />
                                    )}
                                    {errors[field.id] && <p className="text-[8px] text-red-500 font-bold uppercase">{errors[field.id]}</p>}
                                </div>
                            ))}

                            {vencimientoAlerta && (
                                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
                                    <p className="text-[10px] font-black text-amber-500 italic">{vencimientoAlerta}</p>
                                </div>
                            )}

                            {/* Lógica Condicional Maquinaria: Modalidad */}
                            {selectedCategory === 'MAQUINARIA' && formData.specs.modalidad && (
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-4 animate-in slide-in-from-top duration-300">
                                    {formData.specs.modalidad === 'ALQUILADO' ? (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-stone-500 uppercase">Tarifa Hora (USD)</label>
                                                <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-stone-500 uppercase">Adjuntar Contrato</label>
                                                <button className="w-full bg-white/5 border border-dashed border-white/20 rounded-lg py-2 text-[9px] text-stone-400">EXAMINAR...</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-stone-500 uppercase">Vida Útil (Años)</label>
                                                <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
                                            </div>
                                            <div className="space-y-1">
                                                <label className="text-[8px] font-black text-stone-500 uppercase">Valor Residual (%)</label>
                                                <input type="number" className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-xs font-mono" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>

            {/* BLOQUE C: PIE DE PÁGINA Y EVIDENCIA */}
            <section className="space-y-6 pt-10 border-t border-white/5">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-stone-800 flex items-center justify-center">
                        <span className="material-symbols-outlined text-stone-400 text-sm">attachment</span>
                    </div>
                    <h2 className="text-white font-black text-xs uppercase tracking-widest">Bloque C: Sustento de Evidencia</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Mermas u Observaciones</label>
                        <textarea
                            rows={4}
                            placeholder="Indique si hay piezas faltantes, daños estructurales o discrepancias de cantidad..."
                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-4 text-white text-xs outline-none focus:border-stone-500 transition-all resize-none italic"
                            onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Foto Guía Remisión*</label>
                            <label className={`flex flex-col items-center justify-center h-40 border-2 border-dashed ${errors.foto_guia ? 'border-red-500' : 'border-white/10'} bg-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group`}>
                                <span className={`material-symbols-outlined text-2xl transition-all ${formData.foto_guia ? 'text-primary' : 'text-stone-600 group-hover:text-stone-400'}`}>
                                    {formData.foto_guia ? 'task_alt' : 'photo_camera'}
                                </span>
                                <span className="text-[8px] font-black text-stone-500 uppercase mt-2">{formData.foto_guia ? 'Foto Cargada' : 'Capturar Guía'}</span>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => setFormData({ ...formData, foto_guia: e.target.files?.[0] || null })}
                                />
                            </label>
                            {errors.foto_guia && <p className="text-[8px] text-red-500 font-bold uppercase text-center">{errors.foto_guia}</p>}
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Estado Material</label>
                            <label className="flex flex-col items-center justify-center h-40 border-2 border-dashed border-white/10 bg-white/5 rounded-2xl cursor-pointer hover:bg-white/[0.08] transition-all group">
                                <span className="material-symbols-outlined text-2xl text-stone-600 group-hover:text-stone-400 transition-all">add_a_photo</span>
                                <span className="text-[8px] font-black text-stone-500 uppercase mt-2">Carga Multinivel</span>
                                <input
                                    type="file"
                                    multiple
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const files = Array.from(e.target.files || []);
                                        setFormData({ ...formData, fotos_estado: [...formData.fotos_estado, ...files] });
                                    }}
                                />
                            </label>
                            {formData.fotos_estado.length > 0 && (
                                <p className="text-[8px] font-black text-primary uppercase text-center">{formData.fotos_estado.length} Archivos Adjuntos</p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-10">
                    <button
                        onClick={handleAction}
                        disabled={loading}
                        className={`h-16 px-12 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] transition-all flex items-center gap-4 ${loading ? 'bg-stone-800 text-stone-500 cursor-wait' : 'bg-primary text-black hover:scale-105 active:scale-95 shadow-xl shadow-primary/20'}`}
                    >
                        {loading ? 'Procesando Internamiento...' : (
                            <>
                                <span>Confirmar Ingreso e Internar</span>
                                <span className="material-symbols-outlined text-xl">send</span>
                            </>
                        )}
                    </button>
                </div>
            </section>
        </div>
    );
};

export default AdvancedStockEntry;
