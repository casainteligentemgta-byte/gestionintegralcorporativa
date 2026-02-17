
import React, { useState, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';

interface WarehouseDispatchPanelProps {
    onNavigate: (view: any) => void;
}

const WarehouseDispatchPanel: React.FC<WarehouseDispatchPanelProps> = ({ onNavigate }) => {
    const [requests, setRequests] = useState<any[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
    const [budgetAlerts, setBudgetAlerts] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDispatching, setIsDispatching] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        try {
            const data = await dataService.getMaterialRequests();
            // Cargar con relaciones profundas para ver partidas
            setRequests(data.filter((r: any) => r.status === 'PENDIENTE' || r.status === 'APROBADA'));
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectRequest = async (req: any) => {
        setSelectedRequest(req);
        setBudgetAlerts([]);
        try {
            const alerts = await dataService.checkBudgetLimits(req.id);
            setBudgetAlerts(alerts);
        } catch (error) {
            console.error('Error checking budget:', error);
        }
    };

    // Lógica de Firma Digital
    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx?.beginPath();
        }
    };

    const draw = (e: any) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = (e.clientX || e.touches?.[0].clientX) - rect.left;
        const y = (e.clientY || e.touches?.[0].clientY) - rect.top;

        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#FFFFFF';

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearSignature = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (canvas && ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
    };

    const handleDispatch = async () => {
        if (!selectedRequest) return;

        setIsDispatching(true);
        try {
            const canvas = canvasRef.current;
            const signatureUrl = canvas ? canvas.toDataURL() : 'DEFAULT_SIGNATURE';

            await dataService.dispatchMaterialRequest(
                selectedRequest.id,
                selectedRequest.Material_Request_Items,
                'WAREHOUSE_MGR_01', // Mock user
                signatureUrl
            );

            alert(`PECOSA ${selectedRequest.pecosa_number} Despachada Exitosamente. Inventario actualizado.`);
            setSelectedRequest(null);
            await loadRequests();
        } catch (error: any) {
            alert("Error en despacho: " + error.message);
        } finally {
            setIsDispatching(false);
        }
    };

    if (loading) return <div className="flex items-center justify-center min-h-screen bg-stone-950"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div></div>;

    return (
        <div className="max-w-7xl mx-auto p-6 space-y-8 animate-in fade-in duration-700">
            <header className="flex justify-between items-end border-b border-white/10 pb-6">
                <div>
                    <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] mb-1">Centro de Distribución y Entrega</p>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase">Panel de Despacho Almacén</h1>
                    <p className="text-stone-500 text-[10px] font-bold uppercase mt-2 tracking-widest">Validación de PECOSAS y Firma de Cargo</p>
                </div>
                <button onClick={() => onNavigate('INVENTORY_DASHBOARD')} className="h-10 px-6 rounded-apple bg-white/5 border border-white/10 text-stone-400 text-[10px] font-bold uppercase hover:bg-white/10">Volver al Stock</button>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* LISTA DE PEDIDOS */}
                <div className="lg:col-span-4 space-y-4">
                    <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-widest px-2">Pedidos Pendientes de Entrega</h3>
                    <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                        {requests.length === 0 ? (
                            <div className="p-10 text-center opacity-30 border-2 border-dashed border-white/10 rounded-3xl">
                                <p className="text-[10px] font-black uppercase">Sin solicitudes pendientes</p>
                            </div>
                        ) : (
                            requests.map(req => (
                                <button
                                    key={req.id}
                                    onClick={() => handleSelectRequest(req)}
                                    className={`w-full p-5 rounded-2xl border transition-all text-left flex flex-col gap-2 ${selectedRequest?.id === req.id ? 'bg-primary/10 border-primary' : 'bg-white/5 border-white/5 hover:border-white/20'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <span className="text-[11px] font-black text-white uppercase">{req.pecosa_number}</span>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${req.status === 'APROBADA' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-amber-500/20 text-amber-500'}`}>
                                            {req.status}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-stone-400 font-bold uppercase tracking-tight">
                                        {req.Project_Phases?.name || (req.Material_Request_Items?.[0]?.budget_items?.name) || 'SIN PARTIDA'}
                                    </p>
                                    <div className="flex items-center gap-2 mt-2">
                                        <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center text-[9px] text-white font-bold">{req.workers?.first_name[0]}</div>
                                        <span className="text-[9px] text-stone-500 font-black uppercase">{req.workers?.first_name} {req.workers?.first_surname}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* DETALLE Y DESPACHO */}
                <div className="lg:col-span-8">
                    {selectedRequest ? (
                        <div className="glass-card rounded-[2.5rem] border-white/5 bg-white/[0.01] overflow-hidden flex flex-col min-h-[600px] animate-in slide-in-from-right-4 duration-500">
                            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                                <div>
                                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter">{selectedRequest.pecosa_number}</h2>
                                    <p className="text-[9px] text-primary font-black uppercase tracking-[0.2em]">{selectedRequest.projects?.name}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-stone-500 text-[9px] font-black uppercase">Fecha Solicitud</p>
                                    <p className="text-white text-[11px] font-mono">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex-1 p-8 overflow-y-auto">
                                <table className="w-full text-left">
                                    <thead className="text-[9px] font-black text-stone-500 uppercase tracking-widest border-b border-white/5">
                                        <tr>
                                            <th className="pb-4">Material / Recurso</th>
                                            <th className="pb-4 text-center">UM</th>
                                            <th className="pb-4 text-right">Cantidad Solicitada</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {selectedRequest.Material_Request_Items.map((item: any) => (
                                            <tr key={item.id}>
                                                <td className="py-4">
                                                    <p className="text-[11px] font-bold text-white uppercase">{item.Inventario_Global?.nombre}</p>
                                                    <p className="text-[8px] text-stone-500 font-mono">ID: {item.material_id.slice(0, 8)}</p>
                                                </td>
                                                <td className="py-4 text-center">
                                                    <span className="text-[9px] text-stone-500 font-black uppercase tracking-tighter">{item.Inventario_Global?.unidad_medida}</span>
                                                </td>
                                                <td className="py-4 text-right">
                                                    <span className="text-sm font-black text-primary font-mono">{item.quantity_requested}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* ALERTAS DE DESVIACIÓN PRESUPUESTARIA */}
                                {budgetAlerts.length > 0 && (
                                    <div className="mt-8 p-6 rounded-3xl bg-red-500/10 border border-red-500/30 space-y-3 animate-pulse">
                                        <div className="flex items-center gap-3 text-red-500">
                                            <span className="material-symbols-outlined font-black">warning</span>
                                            <h4 className="text-[10px] font-black uppercase tracking-widest">Alerta de Desvío de Costos (Inventory vs Budget)</h4>
                                        </div>
                                        <div className="space-y-2">
                                            {budgetAlerts.map((alert, i) => (
                                                <p key={i} className="text-white text-[10px] font-bold leading-relaxed">
                                                    {alert}
                                                </p>
                                            ))}
                                        </div>
                                        <p className="text-[8px] text-red-500/70 font-black uppercase mt-4">
                                            ESTO AFECTARÁ LA RENTABILIDAD DEL PROYECTO. NOTIFICAR A RESIDENCIA.
                                        </p>
                                    </div>
                                )}

                                {/* ZONA DE FIRMA */}
                                <div className="mt-10 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Firma Digital del Receptor (Cargo de Recepción)</h3>
                                        <button onClick={clearSignature} className="text-[8px] font-black text-primary uppercase underline">Limpiar</button>
                                    </div>
                                    <div className="relative border-2 border-white/10 rounded-3xl bg-black/40 h-40 overflow-hidden cursor-crosshair group hover:border-primary/30 transition-all">
                                        <canvas
                                            ref={canvasRef}
                                            width={800}
                                            height={160}
                                            onMouseDown={startDrawing}
                                            onMouseUp={stopDrawing}
                                            onMouseMove={draw}
                                            onTouchStart={startDrawing}
                                            onTouchEnd={stopDrawing}
                                            onTouchMove={draw}
                                            className="w-full h-full"
                                        />
                                        <div className="absolute inset-x-0 bottom-4 text-center opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity">
                                            <p className="text-[8px] text-white font-black uppercase tracking-widest">Firmar Aquí para Confirmar Recepción de Bienes</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-white/5 bg-white/[0.03] flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-stone-500">lock</span>
                                    </div>
                                    <p className="text-[9px] text-stone-500 max-w-xs italic leading-tight">
                                        "Al presionar Confirmar, se descontará automáticamente el stock del inventario y se generará el documento de movimiento SAP de salida."
                                    </p>
                                </div>
                                <button
                                    onClick={handleDispatch}
                                    disabled={isDispatching}
                                    className={`h-16 px-12 rounded-2xl font-black uppercase text-[12px] tracking-[0.2em] transition-all flex items-center gap-4 ${isDispatching ? 'bg-stone-800 text-stone-500' : 'bg-primary text-black hover:scale-105 shadow-xl shadow-primary/20'}`}
                                >
                                    {isDispatching ? 'Procesando Stock...' : (
                                        <>
                                            <span>Confirmar Entrega y Despachar</span>
                                            <span className="material-symbols-outlined text-xl">verified</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center p-20 opacity-20 border-2 border-dashed border-white/5 rounded-[2.5rem]">
                            <span className="material-symbols-outlined text-8xl mb-4">fact_check</span>
                            <p className="text-sm font-black uppercase tracking-[0.3em]">Seleccione una Solicitud PECOSA</p>
                            <p className="text-[10px] font-bold uppercase mt-2">Para iniciar el proceso de verificación y firma</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default WarehouseDispatchPanel;
