import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { InventarioItem } from '../types';

interface StockMovementSAPProps {
    onNavigate: (view: any) => void;
    initialCode?: '101' | '311' | '501' | '601';
}

const StockMovementSAP: React.FC<StockMovementSAPProps> = ({ onNavigate, initialCode }) => {
    const [inventory, setInventory] = useState<InventarioItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);

    // Form State matching the UI
    const [mode, setMode] = useState<'SALIDA' | 'ENTRADA'>('SALIDA'); // Salida (Envío) vs Entrada (Recepción)
    const [originWarehouse, setOriginWarehouse] = useState('W-01');
    const [destinationWarehouse, setDestinationWarehouse] = useState('O-02');

    // Multi-item State
    const [items, setItems] = useState([{ materialId: '', quantity: '', unit: 'UNID' }]);
    const [observations, setObservations] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const data = await dataService.getInventory();
            setInventory(data);
        } catch (error) {
            console.error('Error loading inventory:', error);
        } finally {
            setLoading(false);
        }
    };

    // Warehouses (Hardcoded for now based on context)
    const warehouses = [
        { id: 'W-01', name: 'Almacén Central (Santiago)' },
        { id: 'O-02', name: 'Sucursal Oriente' },
        { id: 'O-03', name: 'Obra: Edificio KORE' },
        { id: 'Y-00', name: 'Patio de Maquinaria' }
    ];

    const handleSubmit = async () => {
        const validItems = items.filter(i => i.materialId && i.quantity && parseFloat(i.quantity) > 0);

        if (validItems.length === 0) {
            alert("Por favor agregue al menos un material con cantidad válida.");
            return;
        }

        setProcessing(true);
        try {
            await dataService.createMaterialDocument({
                clase_movimiento: '311', // Transfer
                referencia_externa: `TRF-${Date.now().toString().slice(-6)}`,
                observaciones: `${mode}: ${observations}`,
                items: validItems.map(i => ({
                    material_id: i.materialId,
                    cantidad: parseFloat(i.quantity),
                    importe_total: 0 // Optional logic
                }))
            });
            alert('Movimiento registrado con éxito.');
            onNavigate('INVENTORY_DASHBOARD');
        } catch (error: any) {
            console.error(error);
            alert("Error al registrar movimiento: " + error.message);
        } finally {
            setProcessing(false);
        }
    };


    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#0a0a0a]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white p-6 font-sans flex items-center justify-center">
            <div className="w-full max-w-md space-y-6">

                {/* Header */}
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Traspaso de Mercancía</h1>
                    <p className="text-sm text-gray-500">KORE ERP • Gestión de Inventario</p>
                </div>

                {/* Mode Toggle */}
                <div className="bg-[#1a1a1a] p-1 rounded-2xl flex border border-white/5">
                    <button
                        onClick={() => setMode('SALIDA')}
                        className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${mode === 'SALIDA' ? 'bg-[#0055cc] text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        Salida (Envío)
                    </button>
                    <button
                        onClick={() => setMode('ENTRADA')}
                        className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${mode === 'ENTRADA' ? 'bg-[#0055cc] text-white shadow-lg shadow-blue-900/20' : 'text-gray-400 hover:text-white'}`}
                    >
                        Entrada (Recepción)
                    </button>
                </div>

                {/* Warehouse Selection */}
                <div className="bg-[#121212] rounded-3xl border border-white/5 overflow-hidden">
                    {/* Origin */}
                    <div className="p-5 border-b border-white/5 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-white/5 text-blue-500">
                                <span className="material-symbols-outlined">warehouse</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">DESDE (ORIGEN)</p>
                                <select
                                    value={originWarehouse}
                                    onChange={(e) => setOriginWarehouse(e.target.value)}
                                    className="bg-transparent text-white font-semibold text-base outline-none cursor-pointer w-full appearance-none pr-8"
                                >
                                    {warehouses.map(w => <option key={w.id} value={w.id} className="bg-[#121212]">{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-600">expand_more</span>
                    </div>

                    {/* Destination */}
                    <div className="p-5 flex items-center justify-between group cursor-pointer hover:bg-white/[0.02] transition-colors">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-[#1a1a1a] flex items-center justify-center border border-white/5 text-blue-500">
                                <span className="material-symbols-outlined">location_on</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-0.5">HACIA (DESTINO)</p>
                                <select
                                    value={destinationWarehouse}
                                    onChange={(e) => setDestinationWarehouse(e.target.value)}
                                    className="bg-transparent text-white font-semibold text-base outline-none cursor-pointer w-full appearance-none pr-8"
                                >
                                    {warehouses.map(w => <option key={w.id} value={w.id} className="bg-[#121212]">{w.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <span className="material-symbols-outlined text-gray-600">expand_more</span>
                    </div>
                </div>

                {/* Items List */}
                <div className="space-y-6">
                    {items.map((item, index) => {
                        const selectedMaterial = inventory.find(i => i.id === item.materialId);
                        const commonUnits = ['UNID', 'M', 'KG', 'G', 'L', 'SACO', 'CAJA', 'ROLLO', 'M3', 'M2'];

                        return (
                            <div key={index} className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                {/* Material Selection */}
                                <div className="bg-[#121212] rounded-3xl p-5 border border-white/5 space-y-4 relative group">
                                    {items.length > 1 && (
                                        <button
                                            onClick={() => setItems(items.filter((_, i) => i !== index))}
                                            className="absolute top-4 right-4 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <span className="material-symbols-outlined">delete</span>
                                        </button>
                                    )}

                                    <div className="flex justify-between items-start">
                                        <div className="w-full mr-4">
                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-2">MATERIAL {index + 1}</label>
                                            <select
                                                value={item.materialId}
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[index].materialId = e.target.value;
                                                    const m = inventory.find(i => i.id === e.target.value);
                                                    if (m) newItems[index].unit = m.unidad_medida;
                                                    setItems(newItems);
                                                }}
                                                className="w-full bg-transparent text-white font-bold text-xl outline-none appearance-none cursor-pointer truncate"
                                            >
                                                <option value="" className="bg-[#121212]">Seleccionar Material...</option>
                                                {inventory.map(invItem => (
                                                    <option key={invItem.id} value={invItem.id} className="bg-[#121212]">{invItem.nombre}</option>
                                                ))}
                                            </select>
                                            <span className="material-symbols-outlined text-gray-600 absolute right-16 mt-1 pointer-events-none">expand_more</span>
                                        </div>
                                    </div>

                                    {selectedMaterial && (
                                        <div className="inline-flex items-center gap-2 bg-[#0d1f12] px-3 py-1.5 rounded-lg border border-green-900/30">
                                            <span className="text-[10px] text-gray-400">Stock Actual:</span>
                                            <span className="text-xs font-bold text-[#00ff66]">{selectedMaterial.stock_disponible} {selectedMaterial.unidad_medida}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Quantity & Unit */}
                                <div className="flex gap-4">
                                    <div className="flex-1 bg-[#121212] rounded-3xl p-5 border border-white/5 space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">CANTIDAD</label>
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onChange={(e) => {
                                                const newItems = [...items];
                                                newItems[index].quantity = e.target.value;
                                                setItems(newItems);
                                            }}
                                            placeholder="0.00"
                                            className="w-full bg-transparent text-4xl font-bold text-white outline-none placeholder:text-gray-700"
                                        />
                                    </div>
                                    <div className="w-1/3 bg-[#121212] rounded-3xl p-5 border border-white/5 flex flex-col justify-center gap-1 relative group bg-white/[0.02]">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">UNIDAD</label>
                                        <div className="flex items-center justify-between">
                                            <select
                                                value={item.unit}
                                                onChange={(e) => {
                                                    const newItems = [...items];
                                                    newItems[index].unit = e.target.value;
                                                    setItems(newItems);
                                                }}
                                                className="w-full bg-transparent text-xl font-bold text-white outline-none appearance-none cursor-pointer"
                                            >
                                                {commonUnits.map(u => <option key={u} value={u} className="bg-[#121212]">{u}</option>)}
                                            </select>
                                            <span className="material-symbols-outlined text-gray-600 text-sm absolute right-4 pointer-events-none">expand_more</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Add Material Button */}
                <button
                    onClick={() => setItems([...items, { materialId: '', quantity: '', unit: 'UNID' }])}
                    className="w-full py-4 rounded-2xl border border-dashed border-white/20 text-blue-400 hover:text-white hover:border-blue-500/50 hover:bg-blue-500/10 transition-all flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest group"
                >
                    <span className="material-symbols-outlined group-hover:scale-110 transition-transform">add_circle</span>
                    Agregar Otro Material
                </button>

                {/* Observations */}
                <div className="bg-[#121212] rounded-3xl p-5 border border-white/5 space-y-2 h-32">
                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">OBSERVACIONES DEL TRASLADO</label>
                    <textarea
                        value={observations}
                        onChange={(e) => setObservations(e.target.value)}
                        placeholder="Añadir nota global para el movimiento..."
                        className="w-full h-full bg-transparent text-sm text-white resize-none outline-none placeholder:text-gray-700 font-medium"
                    />
                </div>

                {/* Action Button */}
                <button
                    onClick={handleSubmit}
                    disabled={processing}
                    className="w-full bg-[#0047ab] hover:bg-[#003da0] text-white h-16 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 shadow-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {processing ? 'Procesando...' : `Registrar ${items.length} Movimiento(s)`}
                    {!processing && <span className="material-symbols-outlined">arrow_circle_right</span>}
                </button>
            </div>
        </div>
    );
};

export default StockMovementSAP;
