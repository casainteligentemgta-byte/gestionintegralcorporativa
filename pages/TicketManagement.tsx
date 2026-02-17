
import React, { useState, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';

interface TicketManagementProps {
    onNavigate: (view: any, data?: any) => void;
}

const TicketManagement: React.FC<TicketManagementProps> = ({ onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form States
    const [providers, setProviders] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);

    // Manual Form State
    const [manualForm, setManualForm] = useState({
        providerId: '',
        providerName: '',
        providerRif: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        orden_compra: '',
        guia_remision: '',
        guia_archivo_url: '',
        placa_vehiculo: '',
        fecha_recepcion: new Date().toISOString(),
        totalNeto: 0,
        archivo_pdf_url: '',
        items: [{
            material_id: '',
            nombre_material: '',
            cantidad: 0,
            cantidad_recibida: 0,
            precio: 0,
            conformidad_calidad: 'CONFORME',
            observaciones: ''
        }]
    });

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [showOthersInput, setShowOthersInput] = useState(false);
    const [tempItemName, setTempItemName] = useState('');
    const [tempSelectedItem, setTempSelectedItem] = useState<any>(null);

    // Categories Configuration
    const subCategories: Record<string, { id: string; label: string }[]> = {
        MATERIALES: [
            { id: 'ACEROS', label: 'Aceros / Cabillas' },
            { id: 'AGREGADOS', label: 'Agregados (Arena/Piedra)' },
            { id: 'CEMENTO', label: 'Cementos y Yesos' },
            { id: 'BLOQUES', label: 'Bloques y Ladrillos' },
            { id: 'TUBERIA_PVC_AGUAS_NEGRAS', label: 'Tubería PVC Aguas Negras' },
            { id: 'TUBERIA_PVC_AGUAS_BLANCAS', label: 'Tubería PVC Aguas Blancas' },
            { id: 'TUBERIA_PVC_ELECTRICIDAD', label: 'Tubería PVC Electricidad' },
            { id: 'TUBERIA_HG', label: 'Tubería Hierro Galv. (HG)' },
            { id: 'TUBERIA_TERMOFUSION', label: 'Tubería Termofusión' },
            { id: 'CONEXIONES_PVC', label: 'Conexiones PVC / HG' },
            { id: 'ELECTRICIDAD_CABLES', label: 'Electricidad - Cables' },
            { id: 'ELECTRICIDAD_ILUMINACION', label: 'Electricidad - Iluminación' },
            { id: 'ELECTRICIDAD_MECANISMOS', label: 'Electricidad - Tomacorrientes/Int.' },
            { id: 'PINTURAS', label: 'Pinturas y Solventes' },
            { id: 'IMPERMEABILIZACION', label: 'Impermeabilización' },
            { id: 'CERAMICAS', label: 'Cerámicas y Porcelanatos' },
            { id: 'BAÑOS', label: 'Piezas Sanitarias y Grifería' },
            { id: 'CARPINTERIA', label: 'Madera y Carpintería' },
            { id: 'HERRERIA', label: 'Perfiles y Herrería' }
        ],
        MAQUINARIA: [
            { id: 'PESADA', label: 'Maquinaria Pesada' },
            { id: 'LIVIANA', label: 'Maquinaria Liviana' },
            { id: 'VEHICULOS', label: 'Vehículos de Obra' },
            { id: 'HERRAMIENTAS_MANUALES', label: 'Herramientas Manuales' },
            { id: 'HERRAMIENTAS_ELECTRICAS', label: 'Herramientas Eléctricas' },
            { id: 'REPUESTOS', label: 'Repuestos y Partes' }
        ],
        COMBUSTIBLES: [
            { id: 'DIESEL', label: 'Diesel / Gasoil' },
            { id: 'GASOLINA', label: 'Gasolina' },
            { id: 'ACEITES', label: 'Aceites y Lubricantes' },
            { id: 'ADITIVOS', label: 'Aditivos y Refrigerantes' }
        ],
        EPP: [
            { id: 'CASCOS', label: 'Protección de Cabeza' },
            { id: 'GUANTES', label: 'Protección de Manos' },
            { id: 'BOTAS', label: 'Calzados de Seguridad' },
            { id: 'LENTES', label: 'Protección Visual' },
            { id: 'AUDITIVA', label: 'Protección Auditiva' },
            { id: 'RESPIRATORIA', label: 'Protección Respiratoria' },
            { id: 'ALTURA', label: 'Trabajo en Altura' },
            { id: 'UNIFORMES', label: 'Ropa de Trabajo' },
            { id: 'SEÑALIZACION', label: 'Señalización' }
        ]
    };

    const itemTypes: Record<string, { id: string; label: string }[]> = {
        ACEROS: [
            { id: 'CABILLA_3_8', label: 'Cabilla 3/8"' },
            { id: 'CABILLA_1_2', label: 'Cabilla 1/2"' },
            { id: 'MALLA_TRUCSON', label: 'Malla Trucson' },
            { id: 'ALAMBRE_DULCE', label: 'Alambre Dulce' },
            { id: 'CLAVOS', label: 'Clavos' }
        ],
        AGREGADOS: [
            { id: 'ARENA_LAVADA', label: 'Arena Lavada' },
            { id: 'PIEDRA_PICADA', label: 'Piedra Picada' },
            { id: 'POLVILLO', label: 'Polvillo' }
        ],
        CEMENTO: [
            { id: 'CEMENTO_GRIS', label: 'Cemento Gris' },
            { id: 'CEMENTO_BLANCO', label: 'Cemento Blanco' },
            { id: 'PEGO', label: 'Pego' },
            { id: 'YESO', label: 'Yeso' }
        ],
        BLOQUES: [
            { id: 'BLOQUE_ARCILLA_10', label: 'Bloque Arcilla 10cm' },
            { id: 'BLOQUE_ARCILLA_15', label: 'Bloque Arcilla 15cm' },
            { id: 'BLOQUE_CEMENTO_10', label: 'Bloque Cemento 10cm' },
            { id: 'BLOQUE_CEMENTO_15', label: 'Bloque Cemento 15cm' }
        ]
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [provData, invData] = await Promise.all([
                dataService.getProviders(),
                dataService.getInventory()
            ]);
            setProviders(provData);
            setInventory(invData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const cleanName = file.name.replace(/[^a-z0-9.]/gi, '_');
            const fileName = `procurement/${Date.now()}_${cleanName}`;
            const publicUrl = await dataService.uploadFile('documents', fileName, file);
            setManualForm(prev => ({ ...prev, archivo_pdf_url: publicUrl }));
            return publicUrl;
        } catch (error: any) {
            alert("Error al subir archivo: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleManualSubmit = async () => {
        console.log('🚀 Iniciando registro de factura...');
        setIsProcessing(true);
        try {
            let finalProviderId = manualForm.providerId;
            let rif = manualForm.providerRif;
            let nombre = manualForm.providerName;

            // Validar Proveedor
            if (!finalProviderId) {
                const existing = providers.find(p => p.rif.toUpperCase() === rif.toUpperCase() || p.nombre.toUpperCase() === nombre.toUpperCase());
                if (existing) {
                    finalProviderId = existing.id;
                    rif = existing.rif;
                    nombre = existing.nombre;
                } else if (rif && nombre) {
                    const newProv = await dataService.createProvider({ nombre, rif });
                    finalProviderId = newProv.id;
                }
            }

            if (!rif || !nombre) throw new Error("Debe ingresar Nombre y RIF del proveedor");

            const totalCalculated = manualForm.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);

            // Filter out empty items
            const validItems = manualForm.items.filter(item => item.nombre_material && item.nombre_material.trim() !== '');

            if (validItems.length === 0) {
                alert("Debe agregar al menos un ítem a la factura.");
                setIsProcessing(false);
                return;
            }

            // Procesar Materiales
            const processedItems = await Promise.all(validItems.map(async (item) => {
                let mid = item.material_id;
                if (!mid && item.nombre_material) {
                    const existing = inventory.find(m => m.nombre.toUpperCase() === item.nombre_material.toUpperCase());
                    if (existing) {
                        mid = existing.id;
                    } else {
                        const newMaterial = await dataService.createMaterial({
                            nombre: item.nombre_material.toUpperCase(),
                            unidad_medida: 'UND',
                            stock_disponible: 0,
                            valor_unitario_promedio: item.precio
                        });
                        mid = newMaterial.id;
                    }
                }
                return { material_id: mid, cantidad: item.cantidad, precio: item.precio };
            }));

            await dataService.processIAPurchase({
                rif_proveedor: rif,
                nombre_proveedor: nombre,
                numero_factura: manualForm.invoiceNumber,
                total_neto: totalCalculated,
                archivo_pdf_url: manualForm.archivo_pdf_url,
                orden_compra: manualForm.orden_compra,
                guia_remision: manualForm.guia_remision,
                guia_archivo_url: manualForm.guia_archivo_url,
                placa_vehiculo: manualForm.placa_vehiculo,
                items: processedItems.map((pi, idx) => ({
                    ...pi,
                    cantidad_recibida: validItems[idx].cantidad_recibida,
                    conformidad_calidad: validItems[idx].conformidad_calidad,
                    observaciones: validItems[idx].observaciones || ''
                }))
            });

            alert("Factura registrada exitosamente.");
            onNavigate('INVENTORY_DASHBOARD');

        } catch (error: any) {
            console.error('Error al registrar factura:', error);
            alert("Error al registrar factura: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 md:space-y-10 max-w-5xl mx-auto pb-32">

            {/* Header: Back & Title */}
            <div className="flex items-center justify-between mb-8 pt-2">
                <button
                    type="button"
                    onClick={() => onNavigate('INVENTORY_DASHBOARD')}
                    className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                >
                    <span className="material-symbols-outlined text-stone-400">arrow_back_ios_new</span>
                </button>
                <div className="text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-stone-500 mb-1">Módulo Administrativo</p>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Registro de Factura</h2>
                </div>
                <button type="button" className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
                    <span className="material-symbols-outlined text-stone-400">more_horiz</span>
                </button>
            </div>


            {/* SECTION: DATOS DEL DOCUMENTO */}
            <div className="mb-8 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-blue-500 text-lg">description</span>
                    <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">Datos del Documento</h3>
                </div>

                <div className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-1">Número de Factura</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-3.5 text-stone-500 font-bold group-focus-within:text-blue-500 transition-colors">#</span>
                            <input
                                type="text"
                                placeholder="F-000123"
                                value={manualForm.invoiceNumber}
                                onChange={e => setManualForm({ ...manualForm, invoiceNumber: e.target.value.toUpperCase() })}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-10 pr-4 text-white font-bold uppercase placeholder:text-stone-600 focus:outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all font-mono"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-1">Fecha de Emisión</label>
                        <div className="relative group">
                            <span className="absolute left-4 top-3.5 material-symbols-outlined text-lg text-stone-500 group-focus-within:text-blue-500 transition-colors">calendar_today</span>
                            <input
                                type="date"
                                value={manualForm.invoiceDate ? manualForm.invoiceDate.split('T')[0] : ''}
                                onChange={e => setManualForm({ ...manualForm, invoiceDate: e.target.value })}
                                className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold uppercase placeholder:text-stone-600 focus:outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all font-mono"
                            />
                        </div>
                    </div>

                    {/* Link de Foto */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-1">Comprobante Digital</label>
                        <label className={`cursor-pointer w-full border border-dashed rounded-2xl py-3 px-4 flex items-center justify-center gap-3 transition-all ${manualForm.archivo_pdf_url ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                            <span className={`material-symbols-outlined ${manualForm.archivo_pdf_url ? 'text-emerald-500' : 'text-stone-500'}`}>
                                {manualForm.archivo_pdf_url ? 'check_circle' : 'photo_camera'}
                            </span>
                            <span className={`text-[10px] font-black uppercase tracking-widest ${manualForm.archivo_pdf_url ? 'text-emerald-400' : 'text-stone-500'}`}>
                                {manualForm.archivo_pdf_url ? 'Archivo Cargado' : 'Subir Foto'}
                            </span>
                            <input type="file" className="hidden" onChange={async (e) => { const url = await handleFileUpload(e); if (url) setManualForm(p => ({ ...p, archivo_pdf_url: url })); }} accept="image/*,application/pdf" />
                        </label>
                    </div>
                </div>
            </div>

            {/* SECTION: DATOS DEL VENDEDOR */}
            <div className="mb-10 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                <div className="flex items-center gap-2 mb-2">
                    <span className="material-symbols-outlined text-blue-500 text-lg">storefront</span>
                    <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">Datos del Vendedor</h3>
                </div>

                <div className="bg-stone-900/80 rounded-3xl p-6 border border-white/5 space-y-5 shadow-xl">
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Nombre / Razón Social</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-3.5 w-6 h-6 rounded bg-stone-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm text-stone-400">person</span>
                            </div>
                            <input
                                list="providers-list"
                                type="text"
                                placeholder="Distribuidora Global C.A."
                                value={manualForm.providerName}
                                onChange={e => {
                                    const name = e.target.value.toUpperCase();
                                    const matchedProv = providers.find(p => p.nombre.toUpperCase() === name);
                                    setManualForm({
                                        ...manualForm,
                                        providerName: name,
                                        providerRif: matchedProv ? matchedProv.rif : manualForm.providerRif,
                                        providerId: matchedProv ? matchedProv.id : ''
                                    });
                                }}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold uppercase placeholder:text-stone-700 focus:outline-none focus:border-blue-500/50 transition-all"
                            />
                            <datalist id="providers-list">
                                {providers.map(p => <option key={p.id} value={p.nombre}>{p.rif}</option>)}
                            </datalist>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">RIF del Vendedor</label>
                        <div className="relative group">
                            <div className="absolute left-4 top-3.5 w-6 h-6 rounded bg-stone-800 flex items-center justify-center">
                                <span className="material-symbols-outlined text-sm text-stone-400">badge</span>
                            </div>
                            <input
                                type="text"
                                placeholder="J-12345678-9"
                                value={manualForm.providerRif}
                                onChange={e => setManualForm({ ...manualForm, providerRif: e.target.value.toUpperCase() })}
                                className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold uppercase placeholder:text-stone-700 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* SECTION: SELECCIÓN DE MATERIALES */}
            <div className="mb-10 animate-in slide-in-from-bottom-4 duration-500 delay-150">
                <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-blue-500 text-lg">category</span>
                    <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">Catálogo de Materiales</h3>
                </div>

                {/* Categories Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    {[
                        { id: 'MATERIALES', label: 'Materiales', icon: 'Construction', color: 'blue' },
                        { id: 'MAQUINARIA', label: 'Maquinaria', icon: 'engineering', color: 'amber' },
                        { id: 'COMBUSTIBLES', label: 'Combustible', icon: 'ev_station', color: 'rose' },
                        { id: 'EPP', label: 'EPP', icon: 'safety_check', color: 'emerald' }
                    ].map(cat => (
                        <button
                            type="button"
                            key={cat.id}
                            onClick={() => {
                                setSelectedCategory(cat.id);
                                setSelectedSubCategory(null);
                                setTempSelectedItem(null);
                                setTempItemName('');
                                setShowOthersInput(false);
                            }}
                            className={`
                                relative overflow-hidden group flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all duration-300
                                ${selectedCategory === cat.id
                                    ? (cat.color === 'blue' ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500' :
                                        cat.color === 'amber' ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500' :
                                            cat.color === 'rose' ? 'bg-rose-500/10 border-rose-500 ring-1 ring-rose-500' :
                                                'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500')
                                    : 'bg-stone-900/40 border-white/5 hover:bg-white/5 hover:border-white/20'
                                }
                            `}
                        >
                            <div className={`
                                w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-300
                                ${cat.color === 'blue' ? 'text-blue-500' : ''}
                                ${cat.color === 'amber' ? 'text-amber-500' : ''}
                                ${cat.color === 'rose' ? 'text-rose-500' : ''}
                                ${cat.color === 'emerald' ? 'text-emerald-500' : ''}
                            `}>
                                <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                            </div>
                            <span className={`text-[9px] font-black uppercase tracking-wide text-center px-1 leading-tight transition-colors ${selectedCategory === cat.id ? 'text-white' : 'text-stone-400 group-hover:text-white'}`}>
                                {cat.label}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Manual Input / Search */}
                <div className="bg-stone-900/40 rounded-2xl p-2 border border-white/5 mb-4">
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={tempItemName}
                            onChange={(e) => {
                                setTempItemName(e.target.value.toUpperCase());
                                if (!showOthersInput) setShowOthersInput(true);
                            }}
                            placeholder="Buscar o escribir nombre del artículo..."
                            className="flex-1 bg-transparent border-none px-4 py-3 text-white text-sm focus:ring-0 placeholder:text-stone-600 font-bold uppercase transition-all"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    const val = tempItemName.trim();
                                    if (val) {
                                        setManualForm({
                                            ...manualForm,
                                            items: [...manualForm.items, {
                                                material_id: tempSelectedItem?.id || '',
                                                nombre_material: val,
                                                cantidad: 1,
                                                cantidad_recibida: 1,
                                                precio: tempSelectedItem?.valor_unitario_promedio || 0,
                                                conformidad_calidad: 'CONFORME',
                                                observaciones: ''
                                            }]
                                        });
                                        setTempItemName('');
                                        setTempSelectedItem(null);
                                    }
                                }
                            }}
                        />
                        <button
                            type="button"
                            disabled={!tempItemName.trim()}
                            onClick={() => {
                                const val = tempItemName.trim();
                                if (val) {
                                    setManualForm({
                                        ...manualForm,
                                        items: [...manualForm.items, {
                                            material_id: tempSelectedItem?.id || '',
                                            nombre_material: val,
                                            cantidad: 1,
                                            cantidad_recibida: 1,
                                            precio: tempSelectedItem?.valor_unitario_promedio || 0,
                                            conformidad_calidad: 'CONFORME',
                                            observaciones: ''
                                        }]
                                    });
                                    setTempItemName('');
                                    setTempSelectedItem(null);
                                }
                            }}
                            className="bg-primary text-black px-6 rounded-xl font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 m-1"
                        >
                            <span className="material-symbols-outlined">add</span>
                        </button>
                    </div>
                </div>

                {/* Inventory List (Conditional) */}
                {selectedCategory && (
                    <div className="bg-stone-900/40 rounded-2xl p-4 border border-white/5 animate-in fade-in zoom-in-95 duration-300">
                        {/* Subcategories */}
                        {subCategories[selectedCategory] && (
                            <div className="mb-4 animate-in slide-in-from-top-2 fade-in duration-300 space-y-3">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setSelectedSubCategory(null); setSelectedType(null); }}
                                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all ${!selectedSubCategory ? 'bg-white text-black border-white' : 'bg-black/20 text-stone-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                    >
                                        Todo
                                    </button>
                                    {subCategories[selectedCategory].map((sub) => (
                                        <button
                                            key={sub.id}
                                            type="button"
                                            onClick={() => { setSelectedSubCategory(selectedSubCategory === sub.id ? null : sub.id); setSelectedType(null); }}
                                            className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all text-center leading-tight ${selectedSubCategory === sub.id ? 'bg-white text-black border-white' : 'bg-black/20 text-stone-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                        >
                                            {sub.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Types */}
                                {selectedSubCategory && itemTypes[selectedSubCategory] && (
                                    <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-primary/20 animate-in slide-in-from-left-2 fade-in duration-300">
                                        {itemTypes[selectedSubCategory].map((type) => (
                                            <button
                                                key={type.id}
                                                type="button"
                                                onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
                                                className={`px-3 py-1.5 rounded-md text-[8px] font-bold uppercase tracking-wide border transition-all text-center ${selectedType === type.id ? 'bg-primary text-black border-primary' : 'bg-black/40 text-stone-500 border-white/5 hover:bg-primary/20 hover:text-primary'}`}
                                            >
                                                {type.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Items Grid */}
                        <div className="mt-2 animate-in fade-in duration-300">
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                {inventory
                                    .filter(i => {
                                        if (i.categoria !== selectedCategory) return false;
                                        if (selectedSubCategory && i.subfamily_id !== selectedSubCategory && i.specs_data?.subcategoria !== selectedSubCategory) return false;
                                        if (selectedType && i.specs_data?.tipo !== selectedType && !i.nombre.toUpperCase().includes(selectedType.replace(/_/g, ' '))) return false;
                                        return true;
                                    })
                                    .map(item => (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => {
                                                // Populate Inputs
                                                setTempSelectedItem(item);
                                                setTempItemName(item.nombre);
                                                setShowOthersInput(true);
                                            }}
                                            className={`
                                                flex flex-col items-start gap-2 p-3 rounded-xl border transition-all group text-left h-full relative
                                                ${tempSelectedItem?.id === item.id ? 'bg-primary/20 border-primary ring-1 ring-primary' : 'bg-white/5 border-white/5 hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.02]'}
                                            `}
                                        >
                                            <div className={`absolute top-2 right-2 transition-opacity ${tempSelectedItem?.id === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <span className={`material-symbols-outlined text-sm ${tempSelectedItem?.id === item.id ? 'text-primary' : 'text-stone-400'}`}>
                                                    {tempSelectedItem?.id === item.id ? 'check_circle' : 'radio_button_unchecked'}
                                                </span>
                                            </div>
                                            <div className="w-full aspect-square rounded-lg bg-black/20 overflow-hidden mb-1 flex items-center justify-center">
                                                {item.url_foto ? (
                                                    <img src={item.url_foto} alt={item.nombre} className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="material-symbols-outlined text-stone-600 text-2xl group-hover:text-primary/50 transition-colors">image</span>
                                                )}
                                            </div>
                                            <div>
                                                <p className={`text-[9px] font-black uppercase leading-tight line-clamp-2 transition-colors ${tempSelectedItem?.id === item.id ? 'text-primary' : 'text-stone-200 group-hover:text-primary'}`}>{item.nombre}</p>
                                                <p className="text-[7px] text-stone-500 font-bold uppercase mt-1">{item.unidad_medida}</p>
                                            </div>
                                        </button>
                                    ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* SECTION: DETALLE DE ITEMS */}
            <div className="mb-8 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500 text-lg">list_alt</span>
                        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">Detalle de Ítems</h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => setManualForm({
                            ...manualForm,
                            items: [...manualForm.items, { material_id: '', nombre_material: '', cantidad: 0, cantidad_recibida: 0, precio: 0, conformidad_calidad: 'CONFORME', observaciones: '' }]
                        })}
                        className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
                    >
                        <span className="material-symbols-outlined text-base">add_circle</span>
                        Añadir Ítem
                    </button>
                </div>

                <div className="space-y-4">
                    {manualForm.items.map((item, index) => (
                        <div key={index} className="bg-stone-900/30 rounded-[1.5rem] p-5 border border-white/5 relative group hover:bg-stone-900/50 transition-colors">

                            {/* Description Input */}
                            <div className="mb-4 space-y-2">
                                <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">Descripción</label>
                                <input // Main Description Input
                                    type="text"
                                    value={item.nombre_material}
                                    onChange={e => {
                                        const updated = [...manualForm.items];
                                        updated[index].nombre_material = e.target.value.toUpperCase();
                                        setManualForm({ ...manualForm, items: updated });
                                    }}
                                    placeholder="Descripción del material..."
                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3 px-4 text-white font-bold uppercase placeholder:text-stone-700 focus:outline-none focus:border-blue-500/50 transition-all text-sm"
                                />
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                                {/* Qty */}
                                <div className="col-span-4 space-y-2">
                                    <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">Cant.</label>
                                    <input
                                        type="number"
                                        value={item.cantidad || ''}
                                        onChange={e => {
                                            const val = Number(e.target.value);
                                            const updated = [...manualForm.items];
                                            updated[index].cantidad = val;
                                            updated[index].cantidad_recibida = val;
                                            setManualForm({ ...manualForm, items: updated });
                                        }}
                                        className="w-full bg-white text-black border-none rounded-xl h-12 text-center text-lg font-black focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-stone-300"
                                        placeholder="0"
                                    />
                                </div>

                                {/* Price */}
                                <div className="col-span-6 space-y-2">
                                    <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">Precio Unit.</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-3 text-stone-400 font-bold text-sm">$</span>
                                        <input
                                            type="number"
                                            value={item.precio || ''}
                                            onChange={e => {
                                                const val = Number(e.target.value);
                                                const updated = [...manualForm.items];
                                                updated[index].precio = val;
                                                setManualForm({ ...manualForm, items: updated });
                                            }}
                                            className="w-full bg-white text-black border-none rounded-xl h-12 pl-6 pr-3 text-right text-lg font-black focus:ring-2 focus:ring-blue-500 transition-all placeholder:text-stone-300"
                                            placeholder="0.00"
                                        />
                                    </div>
                                </div>

                                {/* Delete - Bottom Right aligned with inputs */}
                                <div className="col-span-2 flex items-end justify-center pb-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const updated = manualForm.items.filter((_, i) => i !== index);
                                            setManualForm({ ...manualForm, items: updated });
                                        }}
                                        className="text-stone-600 hover:text-red-500 transition-colors p-2"
                                    >
                                        <span className="material-symbols-outlined text-2xl">delete</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Placeholder / New Item Hint */}
                    <button
                        type="button"
                        onClick={() => setManualForm({
                            ...manualForm,
                            items: [...manualForm.items, { material_id: '', nombre_material: '', cantidad: 0, cantidad_recibida: 0, precio: 0, conformidad_calidad: 'CONFORME', observaciones: '' }]
                        })}
                        className="w-full bg-white/5 border-2 border-dashed border-white/5 rounded-2xl h-16 flex items-center justify-between px-6 group hover:bg-white/10 hover:border-white/10 transition-all"
                    >
                        <span className="text-stone-500 font-bold uppercase tracking-wider text-sm group-hover:text-stone-300">Nuevo ítem...</span>
                        <div className="w-12 h-8 rounded-lg bg-stone-800/50 flex items-center justify-center text-stone-600 font-black text-xs">0</div>
                    </button>
                </div>
            </div>

            {/* Sticky Footer for Totals and Save */}
            <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black via-black/90 to-transparent pt-12 pb-6">
                <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl p-6 md:p-8 max-w-xl mx-auto animate-in slide-in-from-bottom duration-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none"></div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex justify-between items-center text-stone-400">
                            <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                            <span className="font-mono text-sm font-bold">$ {manualForm.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-stone-400">
                            <span className="text-[10px] font-black uppercase tracking-widest">IVA (16%)</span>
                            <span className="font-mono text-sm font-bold">$ {(manualForm.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0) * 0.16).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between items-center text-white pt-2 border-t border-white/5 mb-4">
                            <span className="text-sm font-black uppercase tracking-tighter">Total Factura</span>
                            <span className="font-black text-2xl text-blue-500">$ {(manualForm.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0) * 1.16).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        </div>

                        <button
                            type="button"
                            onClick={handleManualSubmit}
                            className="w-full bg-blue-600 hover:bg-blue-500 text-white h-14 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
                        >
                            <span className="material-symbols-outlined">save</span>
                            Guardar Factura
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TicketManagement;
