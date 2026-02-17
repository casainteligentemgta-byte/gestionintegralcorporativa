
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

interface MaterialRequestFormProps {
    onNavigate: (view: any) => void;
}

const MaterialRequestForm: React.FC<MaterialRequestFormProps> = ({ onNavigate }) => {
    const [projects, setProjects] = useState<any[]>([]);
    const [budgetItems, setBudgetItems] = useState<any[]>([]);
    const [workers, setWorkers] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);

    // Form States
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [selectedPhaseId, setSelectedPhaseId] = useState('');
    const [selectedWorkerId, setSelectedWorkerId] = useState('');
    const [requestType, setRequestType] = useState<'CONSUMO' | 'ASIGNACION_ACTIVO' | 'EPP'>('CONSUMO');
    const [cart, setCart] = useState<{ material_id: string, nombre: string, cantidad: number, stock: number, unit: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadInitialData();
    }, []);

    const loadInitialData = async () => {
        try {
            const [pData, wData, iData] = await Promise.all([
                dataService.getProjects(),
                dataService.getWorkers(),
                dataService.getInventory()
            ]);
            setProjects(pData);
            setWorkers(wData);
            setInventory(iData);
        } catch (error) {
            console.error('Error loading data:', error);
        }
    };

    const handleProjectChange = async (projectId: string) => {
        setSelectedProjectId(projectId);
        setSelectedPhaseId('');
        try {
            const bData = await dataService.getBudgetItems(projectId);
            setBudgetItems(bData);
        } catch (error) {
            console.error('Error loading budget items:', error);
        }
    };

    const addToCart = (materialId: string) => {
        const item = inventory.find(i => i.id === materialId);
        if (!item) return;

        if (cart.find(c => c.material_id === materialId)) return;

        setCart([...cart, {
            material_id: item.id,
            nombre: item.nombre,
            cantidad: 1,
            stock: item.stock_disponible,
            unit: item.unidad_medida
        }]);
    };

    const updateQty = (materialId: string, qty: number) => {
        setCart(cart.map(c =>
            c.material_id === materialId
                ? { ...c, cantidad: Math.min(qty, c.stock) }
                : c
        ));
    };

    const removeItem = (materialId: string) => {
        setCart(cart.filter(c => c.material_id !== materialId));
    };

    const handleSubmit = async () => {
        if (!selectedProjectId || (requestType !== 'EPP' && !selectedPhaseId)) {
            alert("Por favor complete los campos obligatorios (Obra y Partida).");
            return;
        }
        if (cart.length === 0) {
            alert("El carrito está vacío.");
            return;
        }

        setLoading(true);
        try {
            const pecosaNumber = `PECOSA-${Date.now().toString().slice(-6)}`;
            await dataService.createMaterialRequest({
                pecosa_number: pecosaNumber,
                project_id: selectedProjectId,
                phase_id: selectedPhaseId || null,
                requester_id: selectedWorkerId || null,
                request_type: requestType === 'EPP' ? 'CONSUMO' : requestType,
                status: 'PENDIENTE'
            }, cart.map(item => ({
                ...item,
                cantidad: item.cantidad,
                budget_item_id: selectedPhaseId // Imputar partida a cada ítem
            })));

            alert(`Solicitud ${pecosaNumber} generada y enviada a revisión por Residencia.`);
            onNavigate('INVENTORY_DASHBOARD');
        } catch (error: any) {
            alert("Error al generar PECOSA: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 space-y-10 animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-1">Outbound & Goods Issue</p>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Solicitud de Materiales</h1>
                    <p className="text-stone-500 text-[10px] font-bold uppercase mt-2 tracking-widest leading-none">Generación de Comprobante de Salida (Formato PECOSA)</p>
                </div>
                <button onClick={() => onNavigate('INVENTORY_DASHBOARD')} className="h-10 px-6 rounded-apple bg-white/5 border border-white/10 text-stone-400 text-[10px] font-bold uppercase transition-all hover:bg-white/10">Cancelar</button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* CONFIGURACIÓN DE SALIDA */}
                <div className="space-y-6">
                    <section className="glass-card p-6 rounded-premium border-primary/20 bg-primary/[0.02] space-y-6">
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                                <span className="material-symbols-outlined text-black text-sm">assignment_turned_in</span>
                            </div>
                            <h2 className="text-white font-black text-xs uppercase tracking-widest">Bloque A: Imputación</h2>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Tipo de Salida</label>
                                <div className="flex bg-white/5 p-1 rounded-xl gap-1">
                                    {(['CONSUMO', 'ASIGNACION_ACTIVO', 'EPP'] as const).map(t => (
                                        <button
                                            key={t}
                                            onClick={() => {
                                                setRequestType(t);
                                                if (t === 'EPP') setSelectedPhaseId('');
                                            }}
                                            className={`flex-1 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${requestType === t ? 'bg-primary text-black' : 'text-stone-500 hover:text-white'}`}
                                        >
                                            {t === 'ASIGNACION_ACTIVO' ? 'Equipos' : t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Obra / Proyecto*</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-primary/50"
                                    value={selectedProjectId}
                                    onChange={(e) => handleProjectChange(e.target.value)}
                                >
                                    <option value="">Seleccione Obra...</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>

                            {requestType !== 'EPP' && (
                                <div className="space-y-1 animate-in slide-in-from-top-2">
                                    <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Partida Presupuestaria (A.P.U.)*</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-primary/50"
                                        value={selectedPhaseId}
                                        onChange={(e) => setSelectedPhaseId(e.target.value)}
                                        disabled={!selectedProjectId}
                                    >
                                        <option value="">Seleccione Partida...</option>
                                        {budgetItems.map(bi => <option key={bi.id} value={bi.id}>[{bi.code}] {bi.name}</option>)}
                                    </select>
                                </div>
                            )}

                            <div className="space-y-1">
                                <label className="text-[10px] font-black text-stone-500 uppercase ml-1">Solicitante (Maestro/Especialista)</label>
                                <select
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-xs outline-none focus:border-primary/50"
                                    value={selectedWorkerId}
                                    onChange={(e) => setSelectedWorkerId(e.target.value)}
                                >
                                    <option value="">Seleccione Persona...</option>
                                    {workers.map(w => <option key={w.id} value={w.id}>{w.first_name} {w.first_surname}</option>)}
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="glass-card p-6 rounded-premium border-white/5 bg-white/[0.01] space-y-4">
                        <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-stone-500 text-sm">search</span>
                            <h2 className="text-stone-500 font-bold text-[10px] uppercase tracking-widest">Catálogo de Almacén</h2>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar material..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-[10px] outline-none"
                        />
                        <div className="space-y-1 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {inventory.filter(i => i.stock_disponible > 0).map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => addToCart(item.id)}
                                    className="w-full flex justify-between items-center p-3 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all text-left group"
                                >
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-white uppercase group-hover:text-primary transition-colors">{item.nombre}</span>
                                        <span className="text-[8px] text-stone-500 font-mono">STOCK: {item.stock_disponible} {item.unidad_medida}</span>
                                    </div>
                                    <span className="material-symbols-outlined text-stone-700 text-sm group-hover:text-primary">add_circle</span>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>

                {/* CARRITO DE DESPACHO INTERNO */}
                <div className="lg:col-span-2 space-y-6">
                    <section className="glass-card rounded-premium border-white/5 bg-white/[0.01] overflow-hidden min-h-[400px] flex flex-col">
                        <div className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-emerald-500 text-sm">shopping_basket</span>
                                </div>
                                <h2 className="text-white font-black text-xs uppercase tracking-widest">Bloque B: Carrito de Despacho</h2>
                            </div>
                            <span className="text-[10px] font-black text-stone-500 uppercase tracking-widest">{cart.length} ÍTEMS SELECCIONADOS</span>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {cart.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-20 opacity-20">
                                    <span className="material-symbols-outlined text-6xl mb-4">inventory_2</span>
                                    <p className="text-[10px] font-black uppercase tracking-widest">El carrito de despacho está vacío</p>
                                </div>
                            ) : (
                                <table className="w-full text-left">
                                    <thead className="bg-white/5 text-[9px] font-black text-stone-500 uppercase tracking-widest border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-4">Descripción del Recurso</th>
                                            <th className="px-6 py-4 text-center">Unidad</th>
                                            <th className="px-6 py-4 text-center">Stock Disp.</th>
                                            <th className="px-6 py-4 text-center">Cant. Solicitada</th>
                                            <th className="px-6 py-4 text-right"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {cart.map(item => (
                                            <tr key={item.material_id} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-6 py-4">
                                                    <span className="text-xs font-bold text-white uppercase">{item.nombre}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-[9px] text-stone-500 font-black uppercase tracking-tighter">{item.unit}</span>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="text-[10px] text-emerald-500 font-mono font-bold">{item.stock}</span>
                                                </td>
                                                <td className="px-6 py-4 flex justify-center">
                                                    <div className="flex items-center bg-white/5 rounded-lg border border-white/10 overflow-hidden">
                                                        <input
                                                            type="number"
                                                            value={item.cantidad}
                                                            onChange={(e) => updateQty(item.material_id, parseFloat(e.target.value))}
                                                            className="w-16 bg-transparent text-center text-xs font-bold text-white outline-none py-2"
                                                        />
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => removeItem(item.material_id)} className="text-stone-600 hover:text-red-500 transition-colors">
                                                        <span className="material-symbols-outlined text-sm">delete</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="p-8 border-t border-white/5 bg-white/[0.02] flex justify-between items-center">
                            <div className="flex flex-col">
                                <span className="text-[9px] font-black text-stone-500 uppercase tracking-widest">Validación de Control</span>
                                <p className="text-[10px] text-white/60 max-w-sm italic">
                                    "Esta solicitud será validada contra el presupuesto de la partida seleccionada. Un exceso puede requerir aprobación de Gerencia."
                                </p>
                            </div>
                            <button
                                onClick={handleSubmit}
                                disabled={loading || cart.length === 0}
                                className={`h-14 px-10 rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all flex items-center gap-4 ${loading ? 'bg-stone-800 text-stone-500' : 'bg-primary text-black hover:scale-105 shadow-lg shadow-primary/20'}`}
                            >
                                {loading ? 'Enviando PECOSA...' : (
                                    <>
                                        <span>Generar Solicitud de Salida</span>
                                        <span className="material-symbols-outlined text-lg">local_mall</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export default MaterialRequestForm;
