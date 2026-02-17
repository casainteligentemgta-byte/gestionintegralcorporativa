
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { InventarioItem, Project } from '../types';

// --- Shared Types & Interfaces ---

interface TransportData {
    driverName: string;
    plateNumber: string;
    transportCompany: string;
}

interface TransferItem {
    materialId: string;
    code: string;
    description: string;
    sentQty: number;
    receivedQty: number;
    condition: 'NUEVO' | 'USADO' | 'REPARACION';
    photoUrl?: string; // Required for USED machinery
    shrinkageObservation?: string; // Required if received < sent
}

interface AuditData {
    inventoryId: string;
    rootCause: 'DOC_NO_REGISTRADO' | 'ENTREGA_MAYOR' | 'SUSTITUTO';
    techReportUrl: string; // PDF
}

interface ReturnItem {
    materialId: string;
    name: string;
    originalExitQty: number;
    returnQty: number;
    destination: 'MAIN_STOCK' | 'RECOVERY_STOCK';
}

// --- Component ---

interface IncomingMerchandiseProps {
    onNavigate: (view: any) => void;
    initialTab?: 'TRANSFER' | 'AUDIT' | 'RETURN';
}

const IncomingMerchandise: React.FC<IncomingMerchandiseProps> = ({ onNavigate, initialTab = 'TRANSFER' }) => {
    const [activeTab, setActiveTab] = useState<'TRANSFER' | 'AUDIT' | 'RETURN'>(initialTab);
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<Project[]>([]);
    const [inventory, setInventory] = useState<InventarioItem[]>([]);

    // --- State: TRANSFER ---
    const [transferOrigin, setTransferOrigin] = useState('');
    const [transferDocRef, setTransferDocRef] = useState('');
    const [transportData, setTransportData] = useState<TransportData>({ driverName: '', plateNumber: '', transportCompany: '' });
    const [transferItems, setTransferItems] = useState<TransferItem[]>([]);

    // --- State: AUDIT ---
    const [auditData, setAuditData] = useState<AuditData>({ inventoryId: '', rootCause: 'DOC_NO_REGISTRADO', techReportUrl: '' });
    const [auditItem, setAuditItem] = useState<{ materialId: string; quantity: number }>({ materialId: '', quantity: 0 });

    // --- State: RETURN ---
    const [returnPecosaId, setReturnPecosaId] = useState('');
    const [returnedBy, setReturnedBy] = useState('');
    const [returnReason, setReturnReason] = useState('FIN_JORNADA');
    const [returnItems, setReturnItems] = useState<ReturnItem[]>([]);


    // --- Load Data ---
    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const [projs, inv] = await Promise.all([
                    dataService.getProjects(),
                    dataService.getInventory()
                ]);
                setProjects(projs);
                setInventory(inv);

                // MOCK: Init transfer items for demo
                setTransferItems([
                    { materialId: inv[0]?.id || '1', code: 'MAT-001', description: inv[0]?.nombre || 'Cemento', sentQty: 100, receivedQty: 100, condition: 'NUEVO' }
                ]);

            } catch (err) {
                console.error("Error loading data", err);
            }
        };
        loadInitialData();
    }, []);

    // --- Business Logic / Validations ---

    const validateTransfer = () => {
        // 1. Data Integrity
        if (!transferOrigin || !transferDocRef || !transportData.plateNumber) {
            alert("Faltan datos obligatorios (Origen, Doc Ref, Placa Vehículo).");
            return false;
        }

        // 2. Shrinkage & Photo Validation
        for (const item of transferItems) {
            if (item.receivedQty < item.sentQty && !item.shrinkageObservation) {
                alert(`Alerta de Merma: El ítem ${item.code} tiene menor recepción que envío. Debe justificar la merma.`);
                return false;
            }
            // Check for Machinery (Simulated category check)
            const isMachinery = item.description.toLowerCase().includes('maquina') || item.description.toLowerCase().includes('equipo');
            if (isMachinery && item.condition === 'USADO' && !item.photoUrl) {
                alert(`Protocolo de Activo Fijo: El equipo usado ${item.code} requiere evidencia fotográfica obligatoria.`);
                return false;
            }
        }
        return true;
    };

    const validateAudit = () => {
        if (!auditData.inventoryId || !auditData.techReportUrl) {
            alert("Debe vincular un Inventario Físico y adjuntar el Informe Técnico (Resolución).");
            return false;
        }
        if (!auditItem.materialId || auditItem.quantity <= 0) {
            alert("Debe indicar el material y una cantidad positiva.");
            return false;
        }
        return true;
    };

    const validateReturn = () => {
        if (!returnPecosaId || !returnedBy) return false;

        let hasItems = false;
        for (const item of returnItems) {
            if (item.returnQty > 0) {
                hasItems = true;
                if (item.returnQty > item.originalExitQty) {
                    alert(`Error de Tope: La devolución del item ${item.name} excede la salida original.`);
                    return false;
                }
            }
        }

        if (!hasItems) {
            alert("Debe devolver al menos una unidad.");
            return false;
        }
        return true;
    };

    // --- Submit Handlers ---

    const handleSubmitTransfer = async () => {
        if (!validateTransfer()) return;
        setLoading(true);
        try {
            // Check if merma exists to trigger notification
            const hasShrinkage = transferItems.some(i => i.receivedQty < i.sentQty);

            const payload = {
                type: 'TRANSFER_IN',
                origin_project_id: transferOrigin,
                reference_doc: transferDocRef,
                transport: transportData,
                items: transferItems.map(i => ({
                    ...i,
                    // Inherit Cost Rule: Backend will lookup average cost from Origin Project
                    cost_source: 'ORIGIN_PROJECT_AVG'
                })),
                trigger_logistics_alert: hasShrinkage
            };

            console.log("Submitting Transfer:", payload);
            await new Promise(r => setTimeout(r, 1000)); // Mock API
            alert("Ingreso por Traspaso registrado correctamente.");
            if (hasShrinkage) alert("NOTA: Se ha enviado una notificación automática al Jefe de Logística por la merma detectada.");
            onNavigate('INVENTORY_DASHBOARD');
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitAudit = async () => {
        if (!validateAudit()) return;
        setLoading(true);
        try {
            const payload = {
                type: 'AUDIT_SURPLUS',
                inventory_id: auditData.inventoryId,
                root_cause: auditData.rootCause,
                tech_report_url: auditData.techReportUrl,
                item: {
                    material_id: auditItem.materialId,
                    qty: auditItem.quantity,
                    // Valuation Rule: Backend uses Weighted Avg Cost logic
                    valuation_method: 'SYSTEM_WAC'
                }
            };

            console.log("Submitting Audit:", payload);
            await new Promise(r => setTimeout(r, 1000));
            alert("Sobrante legalizado correctamente. Stock actualizado.");
            onNavigate('INVENTORY_DASHBOARD');
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitReturn = async () => {
        if (!validateReturn()) return;
        setLoading(true);
        try {
            const validReturns = returnItems.filter(i => i.returnQty > 0);
            const payload = {
                type: 'RETURN_IN',
                pecosa_id: returnPecosaId,
                returned_by: returnedBy,
                reason: returnReason,
                items: validReturns,
                // Accounting Rule: Negative transaction to Cost Center
                accounting_action: 'REVERSE_COST_CENTER_CHARGE'
            };

            await new Promise(r => setTimeout(r, 1000));
            alert(`Devolución procesada. \n\nALERTA CONTABLE: Se ha acreditado el costo a la partida presupuestaria vinculada.`);
            onNavigate('INVENTORY_DASHBOARD');
        } catch (e: any) {
            alert(e.message);
        } finally {
            setLoading(false);
        }
    };

    // --- Mock Helpers ---
    const handleSimulateLoadPecosa = () => {
        // Mock loading items from a PECOSA ID
        if (!returnPecosaId) return;
        setReturnItems([
            { materialId: '1', name: 'Cemento Portland Tipo I', originalExitQty: 50, returnQty: 0, destination: 'MAIN_STOCK' },
            { materialId: '2', name: 'Acero Corrugado 1/2"', originalExitQty: 200, returnQty: 0, destination: 'RECOVERY_STOCK' }
        ]);
        alert("Ítems de PECOSA cargados.");
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white font-sans p-6 md:p-12">
            <div className="max-w-6xl mx-auto space-y-8">

                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Ingreso de Mercancía</h1>
                        <p className="text-gray-400 text-sm mt-1">Gestión de entradas internas, auditoría y devoluciones de campo.</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-[#1a1a1a] p-1 rounded-xl border border-white/10">
                        {(['TRANSFER', 'AUDIT', 'RETURN'] as const).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 text-sm font-bold rounded-lg transition-all ${activeTab === tab
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                {tab === 'TRANSFER' && 'POR TRASPASO'}
                                {tab === 'AUDIT' && 'POR SOBRANTE'}
                                {tab === 'RETURN' && 'DEVOLUCIONES'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* --- 1. TRANSFER FORM --- */}
                {activeTab === 'TRANSFER' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        <div className="bg-[#121212] p-6 rounded-3xl border border-white/5 space-y-4">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Datos de Origen</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1">PROYECTO / ALMACÉN ORIGEN</label>
                                    <select
                                        value={transferOrigin}
                                        onChange={(e) => setTransferOrigin(e.target.value)}
                                        className="w-full bg-[#1a1a1a] border-none rounded-xl p-3 text-white focus:ring-1 focus:ring-blue-500 outline-none text-xl font-medium"
                                    >
                                        <option value="">Seleccione Origen...</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1">DOC. REFERENCIA (GUÍA / CARGO)</label>
                                    <input
                                        type="text"
                                        value={transferDocRef}
                                        onChange={(e) => setTransferDocRef(e.target.value)}
                                        placeholder="Ej: GR-2024-001"
                                        className="w-full bg-[#1a1a1a] rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* B. Transport Section */}
                        <div className="bg-[#121212] p-6 rounded-3xl border border-white/5 space-y-4">
                            <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Custodia y Transporte</h3>
                            <div className="grid grid-cols-1 gap-6">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1">NOMBRE CONDUCTOR</label>
                                    <input
                                        type="text"
                                        value={transportData.driverName}
                                        onChange={(e) => setTransportData({ ...transportData, driverName: e.target.value })}
                                        className="w-full bg-[#1a1a1a] rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-purple-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1 text-red-400">PLACA VEHÍCULO (*)</label>
                                    <input
                                        type="text"
                                        value={transportData.plateNumber}
                                        onChange={(e) => setTransportData({ ...transportData, plateNumber: e.target.value })}
                                        className="w-full bg-[#1a1a1a] rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-purple-500"
                                        placeholder="XXX-000"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* C. Materials Grid */}
                        <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden">
                            <div className="bg-[#1a1a1a] px-6 py-4 flex justify-between items-center border-b border-white/5">
                                <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest">Detalle de Recepción</h3>
                                <button onClick={() => alert("Función para importar desde PDF no implementada en demo")} className="text-xs text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">upload_file</span> IMPORTAR DESDE GUÍA
                                </button>
                            </div>
                            <table className="w-full text-left text-[11px] text-gray-400 border-collapse">
                                <thead className="bg-white/[0.02] text-[10px] uppercase font-bold text-gray-500">
                                    <tr>
                                        <th className="p-2 border-b border-white/5">Código</th>
                                        <th className="p-2 border-b border-white/5">Descripción</th>
                                        <th className="p-2 border-b border-white/5 text-center">Cant. Enviada</th>
                                        <th className="p-2 border-b border-white/5 text-center">Cant. Recibida</th>
                                        <th className="p-2 border-b border-white/5">Estado</th>
                                        <th className="p-2 border-b border-white/5">Validación</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {transferItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.01] transition-colors">
                                            <td className="p-2 font-mono text-[10px]">{item.code}</td>
                                            <td className="p-2 text-white font-medium">{item.description}</td>
                                            <td className="p-2 text-center">{item.sentQty}</td>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="number"
                                                    value={item.receivedQty}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        const newItems = [...transferItems];
                                                        newItems[idx].receivedQty = val;
                                                        setTransferItems(newItems);
                                                    }}
                                                    className={`w-16 bg-[#0a0a0a] rounded-lg p-1 text-center text-white font-bold outline-none border text-[11px] ${item.receivedQty < item.sentQty ? 'border-red-500/50 text-red-200' : 'border-white/10'}`}
                                                />
                                            </td>
                                            <td className="p-2">
                                                <select
                                                    value={item.condition}
                                                    onChange={(e) => {
                                                        const newItems = [...transferItems];
                                                        newItems[idx].condition = e.target.value as any;
                                                        setTransferItems(newItems);
                                                    }}
                                                    className="bg-[#0a0a0a] rounded-lg p-1 text-[10px] border border-white/10 outline-none text-white w-full"
                                                >
                                                    <option value="NUEVO">NUEVO</option>
                                                    <option value="USADO">USADO</option>
                                                    <option value="REPARACION">REPARACIÓN</option>
                                                </select>
                                            </td>
                                            <td className="p-2">
                                                {item.receivedQty < item.sentQty && (
                                                    <input
                                                        type="text"
                                                        placeholder="Justificar Merma..."
                                                        value={item.shrinkageObservation || ''}
                                                        onChange={(e) => {
                                                            const newItems = [...transferItems];
                                                            newItems[idx].shrinkageObservation = e.target.value;
                                                            setTransferItems(newItems);
                                                        }}
                                                        className="w-full bg-red-900/10 border border-red-500/30 rounded-lg p-1 text-[10px] text-red-200 placeholder:text-red-500/50 outline-none mb-1"
                                                    />
                                                )}
                                                {item.condition !== 'NUEVO' && (
                                                    <div className="flex items-center gap-1">
                                                        <button
                                                            onClick={() => {
                                                                const url = prompt("Pegar URL de foto:");
                                                                if (url) {
                                                                    const newItems = [...transferItems];
                                                                    newItems[idx].photoUrl = url;
                                                                    setTransferItems(newItems);
                                                                }
                                                            }}
                                                            className={`text-[9px] px-2 py-1 rounded border w-full ${item.photoUrl ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'}`}
                                                        >
                                                            {item.photoUrl ? 'Foto Adjunta ✓' : 'Subir Foto'}
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end p-4">
                            <button onClick={handleSubmitTransfer} className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-8 rounded-2xl shadow-lg shadow-blue-900/20 active:scale-95 transition-all">
                                Procesar Recepción
                            </button>
                        </div>
                    </div>
                )}

                {/* --- 2. AUDIT FORM --- */}
                {activeTab === 'AUDIT' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
                        {/* Audit Header */}
                        <div className="bg-[#121212] p-6 rounded-3xl border border-warning-500/20 shadow-lg shadow-orange-900/10 space-y-6">
                            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                <span className="material-symbols-outlined text-orange-400 text-3xl">policy</span>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Legalización de Sobrante</h3>
                                    <p className="text-xs text-orange-400 font-mono uppercase tracking-widest">Solo Auditoría / Residente</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1">INVENTARIO FÍSICO (CONTEO)</label>
                                    <select
                                        value={auditData.inventoryId}
                                        onChange={(e) => setAuditData({ ...auditData, inventoryId: e.target.value })}
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white outline-none"
                                    >
                                        <option value="">Seleccionar Conteo...</option>
                                        <option value="INV-2024-001">INV-2024-001 (Cierre Mensual)</option>
                                        <option value="INV-2024-002">INV-2024-002 (Cierre Trimestral)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1">CAUSA RAÍZ (*)</label>
                                    <select
                                        value={auditData.rootCause}
                                        onChange={(e) => setAuditData({ ...auditData, rootCause: e.target.value as any })}
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white outline-none"
                                    >
                                        <option value="DOC_NO_REGISTRADO">1. Documento fuente no registrado</option>
                                        <option value="ENTREGA_MAYOR">2. Entrega mayor a la autorizada</option>
                                        <option value="SUSTITUTO">3. Entrega de bien sustituto</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1">INFORME TÉCNICO (RESOLUCIÓN)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            placeholder="URL del PDF de Resolución..."
                                            value={auditData.techReportUrl}
                                            onChange={(e) => setAuditData({ ...auditData, techReportUrl: e.target.value })}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-xs text-white outline-none"
                                        />
                                        <button className="bg-white/10 hover:bg-white/20 p-3 rounded-xl">
                                            <span className="material-symbols-outlined text-white">upload_file</span>
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-600 mt-1">* Obligatorio según Directiva de Almacenes.</p>
                                </div>
                            </div>
                        </div>

                        {/* Item and Valuation */}
                        <div className="bg-[#121212] p-6 rounded-3xl border border-white/5 space-y-6">
                            <h3 className="text-sm font-bold text-gray-300 uppercase tracking-widest border-b border-white/5 pb-2">Detalle y Valorización</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs text-gray-500 font-bold block mb-1">MATERIAL DETECTADO</label>
                                    <select
                                        value={auditItem.materialId}
                                        onChange={(e) => setAuditItem({ ...auditItem, materialId: e.target.value })}
                                        className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white outline-none"
                                    >
                                        <option value="">Seleccionar Material...</option>
                                        {inventory.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold block mb-1">CANTIDAD SOBRANTE</label>
                                        <input
                                            type="number"
                                            value={auditItem.quantity}
                                            onChange={(e) => setAuditItem({ ...auditItem, quantity: parseFloat(e.target.value) })}
                                            className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-white font-mono text-xl outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-gray-500 font-bold block mb-1">COSTO SUGERIDO</label>
                                        <div className="w-full bg-[#1a1a1a] border border-white/10 rounded-xl p-3 text-gray-400 font-mono text-xl flex justify-between items-center">
                                            <span>$ --.--</span>
                                            <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded">AUTO</span>
                                        </div>
                                        <p className="text-[9px] text-gray-600 mt-1">Calculado por CPP (Promedio Ponderado)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4">
                                <button onClick={handleSubmitAudit} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-orange-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                                    <span className="material-symbols-outlined">gavel</span>
                                    LEGALIZAR INGRESO
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- 3. RETURN FORM --- */}
                {activeTab === 'RETURN' && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                        {/* Controls */}
                        <div className="bg-[#121212] p-6 rounded-3xl border border-white/5 grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="text-xs text-gray-500 font-bold block mb-1">VINCULAR VALE DE SALIDA (PECOSA)</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="ID PECOSA..."
                                        value={returnPecosaId}
                                        onChange={(e) => setReturnPecosaId(e.target.value)}
                                        className="w-full bg-[#1a1a1a] rounded-xl p-3 text-white outline-none focus:ring-1 focus:ring-green-500"
                                    />
                                    <button onClick={handleSimulateLoadPecosa} className="bg-[#1a1a1a] border border-white/10 hover:bg-white/10 p-3 rounded-xl">
                                        <span className="material-symbols-outlined text-white">search</span>
                                    </button>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold block mb-1">DEVUELTO POR</label>
                                <select
                                    value={returnedBy}
                                    onChange={(e) => setReturnedBy(e.target.value)}
                                    className="w-full bg-[#1a1a1a] rounded-xl p-3 text-white outline-none"
                                >
                                    <option value="">Seleccionar Personal...</option>
                                    <option value="CAP_001">Juan Pérez (Capataz)</option>
                                    <option value="ING_002">Ing. María (Residente)</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-gray-500 font-bold block mb-1">MOTIVO DE DEVOLUCIÓN</label>
                                <select
                                    value={returnReason}
                                    onChange={(e) => setReturnReason(e.target.value)}
                                    className="w-full bg-[#1a1a1a] rounded-xl p-3 text-white outline-none"
                                >
                                    <option value="EXCESO">1. Exceso (No utilizado)</option>
                                    <option value="CAMBIO_DISENO">2. Cambio de Diseño</option>
                                    <option value="MATERIAL_ERRADO">3. Material Errado</option>
                                    <option value="FIN_JORNADA">4. Fin de Jornada</option>
                                </select>
                            </div>
                        </div>

                        {/* Grid */}
                        <div className="bg-[#121212] border border-white/5 rounded-3xl overflow-hidden">
                            <table className="w-full text-left text-[11px] text-gray-400">
                                <thead className="bg-white/[0.02] text-[10px] uppercase font-bold text-gray-500">
                                    <tr>
                                        <th className="p-2">Material</th>
                                        <th className="p-2 text-center">Salida Original</th>
                                        <th className="p-2 text-center">Cant. a Devolver</th>
                                        <th className="p-2 text-center">Destino Físico</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {returnItems.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-white/[0.01]">
                                            <td className="p-2 font-medium text-white">{item.name}</td>
                                            <td className="p-2 text-center font-mono">{item.originalExitQty}</td>
                                            <td className="p-2 text-center">
                                                <input
                                                    type="number"
                                                    value={item.returnQty}
                                                    onChange={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        const newItems = [...returnItems];
                                                        newItems[idx].returnQty = val;
                                                        setReturnItems(newItems);
                                                    }}
                                                    className="w-20 bg-[#0a0a0a] rounded-lg p-1 text-center text-green-400 font-bold outline-none border border-white/10 focus:border-green-500 text-[11px]"
                                                />
                                            </td>
                                            <td className="p-2 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <label className={`cursor-pointer px-2 py-1 rounded-lg text-[10px] font-bold border ${item.destination === 'MAIN_STOCK' ? 'bg-green-500/20 border-green-500 text-green-400' : 'border-white/10 opacity-50'}`}>
                                                        <input
                                                            type="radio"
                                                            name={`dest-${idx}`}
                                                            className="hidden"
                                                            checked={item.destination === 'MAIN_STOCK'}
                                                            onChange={() => {
                                                                const newItems = [...returnItems];
                                                                newItems[idx].destination = 'MAIN_STOCK';
                                                                setReturnItems(newItems);
                                                            }}
                                                        />
                                                        Stock Principal
                                                    </label>
                                                    <label className={`cursor-pointer px-2 py-1 rounded-lg text-[10px] font-bold border ${item.destination === 'RECOVERY_STOCK' ? 'bg-yellow-500/20 border-yellow-500 text-yellow-400' : 'border-white/10 opacity-50'}`}>
                                                        <input
                                                            type="radio"
                                                            name={`dest-${idx}`}
                                                            className="hidden"
                                                            checked={item.destination === 'RECOVERY_STOCK'}
                                                            onChange={() => {
                                                                const newItems = [...returnItems];
                                                                newItems[idx].destination = 'RECOVERY_STOCK';
                                                                setReturnItems(newItems);
                                                            }}
                                                        />
                                                        Zona Recuperación
                                                    </label>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {returnItems.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="text-center py-8 text-gray-600 italic">Busque un vale de salida (PECOSA) para iniciar la devolución.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {returnItems.length > 0 && (
                            <div className="bg-green-900/10 border border-green-500/20 p-4 rounded-xl flex items-start gap-3">
                                <span className="material-symbols-outlined text-green-400">account_balance_wallet</span>
                                <div>
                                    <h4 className="text-sm font-bold text-green-400">Nota de Contabilidad:</h4>
                                    <p className="text-xs text-green-200/70 mt-1">
                                        Al confirmar este ingreso, se ejecutará una <strong className="text-white">reversión de costos</strong> en la partida presupuestaria del vale original (PECOSA {returnPecosaId}).
                                        El costo regresará al inventario y se deducirá del gasto corriente de la obra.
                                    </p>
                                </div>
                                <button onClick={handleSubmitReturn} className="ml-auto bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-xl shadow-lg shadow-green-900/20">
                                    Confirmar Devolución
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IncomingMerchandise;
