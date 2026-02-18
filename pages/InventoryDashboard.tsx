
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { InventarioItem, Notificacion, MovimientoObra } from '../types';

interface InventoryDashboardProps {
    onNavigate: (view: any, data?: any) => void;
    highlight?: string | null;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ onNavigate, highlight }) => {
    const [items, setItems] = useState<InventarioItem[]>([]);
    const [notifications, setNotifications] = useState<Notificacion[]>([]);
    const [movements, setMovements] = useState<MovimientoObra[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [quarantineCount, setQuarantineCount] = useState(0);
    const [recentPurchases, setRecentPurchases] = useState<any[]>([]);

    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

    const subCategories: Record<string, { id: string; label: string }[]> = {
        MATERIALES: [
            { id: 'ACEROS', label: 'Aceros' },
            { id: 'AGREGADOS', label: 'Agregados' },
            { id: 'CEMENTOS', label: 'Cementos' },
            { id: 'TUBERIAS', label: 'Tuberías' },
            { id: 'CONSUMIBLES', label: 'Consumibles' }
        ],
        MAQUINARIA: [
            { id: 'PESADA', label: 'Maq. Pesada' },
            { id: 'LIVIANA', label: 'Maq. Liviana' },
            { id: 'VEHICULOS', label: 'Vehículos' },
            { id: 'HERRAMIENTAS', label: 'Herramientas' }
        ],
        COMBUSTIBLES: [
            { id: 'DIESEL', label: 'Diesel' },
            { id: 'GASOLINA', label: 'Gasolina' },
            { id: 'ACEITES', label: 'Aceites' },
            { id: 'GRASAS', label: 'Grasas' }
        ],
        EPP: [
            { id: 'CABEZA', label: 'Prot. Cabeza' },
            { id: 'MANOS', label: 'Prot. Manos' },
            { id: 'PIES', label: 'Calzado' },
            { id: 'ALTURA', label: 'Trabajo Altura' },
            { id: 'RESPIRATORIA', label: 'Respiratoria' }
        ]
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [inventoryData, notifData, movementData, pendingInspections, purchasesData] = await Promise.all([
                dataService.getInventory(),
                dataService.getNotifications('Compras'),
                dataService.getMovements(),
                dataService.getPendingInspections(),
                dataService.getPurchases()
            ]);
            setItems(Array.isArray(inventoryData) ? inventoryData : []);
            setNotifications(Array.isArray(notifData) ? notifData : []);
            setMovements(Array.isArray(movementData) ? movementData as any : []);
            setQuarantineCount(Array.isArray(pendingInspections) ? pendingInspections.length : 0);
            setRecentPurchases(Array.isArray(purchasesData) ? purchasesData.slice(0, 5) : []);
        } catch (error) {
            console.error('Error loading dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (id: string) => {
        const next = new Set(selectedItems);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedItems(next);
    };

    const toggleSelectAll = () => {
        if (selectedItems.size === items.length) {
            setSelectedItems(new Set());
        } else {
            setSelectedItems(new Set(items.map(i => i.id)));
        }
    };

    const handleShare = async () => {
        const itemsToShare = selectedItems.size > 0
            ? items.filter(i => selectedItems.has(i.id))
            : items;

        const date = new Date().toLocaleDateString();
        let message = `*REPORTE DE INVENTARIO - ${date}*\n\n`;

        itemsToShare.forEach(item => {
            message += `• *${item.nombre}*: ${item.stock_disponible} ${item.unidad_medida} (${item.categoria})\n`;
        });

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Inventario - Reporte',
                    text: message
                });
            } catch (err) {
                console.error('Error sharing:', err);
            }
        } else {
            await navigator.clipboard.writeText(message);
            alert('Reporte copiado al portapapeles');
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (confirm(`¿Estás seguro de que deseas eliminar el material "${name}"? Esta acción no se puede deshacer.`)) {
            try {
                setLoading(true);
                await dataService.deleteInventoryItem(id);
                await loadData();
            } catch (error) {
                console.error('Error deleting item:', error);
                alert('Ocurrió un error al eliminar el material.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleDeleteSelected = async () => {
        if (selectedItems.size === 0) return;

        if (confirm(`¿Estás seguro de que deseas eliminar los ${selectedItems.size} materiales seleccionados? Esta acción no se puede deshacer.`)) {
            try {
                setLoading(true);
                await Promise.all(Array.from(selectedItems).map((id: string) => dataService.deleteInventoryItem(id)));
                setSelectedItems(new Set());
                await loadData();
                alert('Materiales eliminados correctamente.');
            } catch (error) {
                console.error('Error deleting selected items:', error);
                alert('Ocurrió un error al eliminar algunos materiales.');
            } finally {
                setLoading(false);
            }
        }
    };

    const totalValue = items.reduce((acc, item) => acc + (item.stock_disponible * item.valor_unitario_promedio), 0);
    const lowStockItems = items.filter(item => item.stock_disponible <= item.punto_reorden);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 animate-in fade-in duration-700">
            <header className="space-y-6">
                <div className="text-center">
                    <h1 className="text-4xl font-black tracking-[0.1em] text-white uppercase">Inventario</h1>
                    <h2 className="text-[10px] text-primary font-black uppercase tracking-[0.3em] mt-2 opacity-80">Ingresos de la Mercancía</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto">
                    {/* 101 Entrada por Compra */}
                    <div className={`group relative bg-white/[0.03] border border-white/10 rounded-3xl p-4 transition-all hover:bg-white/[0.05] hover:border-blue-500/30 ${highlight && highlight !== 'PURCHASE' ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                        <div className="flex flex-col items-center justify-center gap-3 mb-4 text-center h-[100px]">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                <span className="material-symbols-outlined text-2xl">receipt_long</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">Ingresar</p>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-tight">Mercancía (101)</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => onNavigate('PURCHASE_MANAGEMENT')}
                                className="h-9 rounded-xl bg-blue-500 text-white text-[8px] font-black uppercase tracking-wider hover:scale-[1.02] transition-all flex flex-col items-center justify-center leading-none px-2"
                            >
                                <span>Ingresar</span>
                                <span className="text-[6px] opacity-80 mt-0.5">Mercancía</span>
                            </button>
                            <button
                                onClick={() => onNavigate('MOVEMENT_HISTORY')}
                                className="h-9 rounded-xl bg-white/5 border border-white/10 text-stone-400 text-[8px] font-black uppercase tracking-wider hover:text-white transition-all"
                            >
                                Historial
                            </button>
                        </div>
                    </div>

                    {/* 311 Entrada por Transferencia */}
                    <div className={`group relative bg-white/[0.03] border border-white/10 rounded-3xl p-4 transition-all hover:bg-white/[0.05] hover:border-blue-500/30 ${highlight === 'PURCHASE' ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                        <div className="flex flex-col items-center justify-center gap-3 mb-4 text-center h-[100px]">
                            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500 shrink-0">
                                <span className="material-symbols-outlined text-2xl">local_shipping</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">Ingresar</p>
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest leading-tight">Traspaso (311)</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => onNavigate('INCOMING_MERCHANDISE', { tab: 'TRANSFER' })}
                                className="h-9 rounded-xl bg-blue-500 text-white text-[8px] font-black uppercase tracking-wider hover:scale-[1.02] transition-all"
                            >
                                Registrar
                            </button>
                            <button
                                onClick={() => onNavigate('MOVEMENT_HISTORY')}
                                className="h-9 rounded-xl bg-white/5 border border-white/10 text-stone-400 text-[8px] font-black uppercase tracking-wider hover:text-white transition-all"
                            >
                                Historial
                            </button>
                        </div>
                    </div>

                    {/* 501 Entrada por Sobrante */}
                    <div className={`group relative bg-white/[0.03] border border-white/10 rounded-3xl p-4 transition-all hover:bg-white/[0.05] hover:border-amber-500/30 ${highlight === 'PURCHASE' ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                        <div className="flex flex-col items-center justify-center gap-3 mb-4 text-center h-[100px]">
                            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                                <span className="material-symbols-outlined text-2xl">inventory_2</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">Ingresar</p>
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest leading-tight">Sobrante (501)</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => onNavigate('INCOMING_MERCHANDISE', { tab: 'AUDIT' })}
                                className="h-9 rounded-xl bg-amber-500 text-white text-[8px] font-black uppercase tracking-wider hover:scale-[1.02] transition-all"
                            >
                                Registrar
                            </button>
                            <button
                                onClick={() => onNavigate('MOVEMENT_HISTORY')}
                                className="h-9 rounded-xl bg-white/5 border border-white/10 text-stone-400 text-[8px] font-black uppercase tracking-wider hover:text-white transition-all"
                            >
                                Historial
                            </button>
                        </div>
                    </div>

                    {/* 601 Reingreso (Devolución) */}
                    <div className={`group relative bg-white/[0.03] border border-white/10 rounded-3xl p-4 transition-all hover:bg-white/[0.05] hover:border-emerald-500/30 ${highlight === 'PURCHASE' ? 'opacity-30 grayscale pointer-events-none' : ''}`}>
                        <div className="flex flex-col items-center justify-center gap-3 mb-4 text-center h-[100px]">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shrink-0">
                                <span className="material-symbols-outlined text-2xl">settings_backup_restore</span>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-tight">Ingresar</p>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest leading-tight">Devolución (601)</p>
                            </div>
                        </div>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={() => onNavigate('INCOMING_MERCHANDISE', { tab: 'RETURN' })}
                                className="h-9 rounded-xl bg-emerald-500 text-white text-[8px] font-black uppercase tracking-wider hover:scale-[1.02] transition-all"
                            >
                                Registrar
                            </button>
                            <button
                                onClick={() => onNavigate('MOVEMENT_HISTORY')}
                                className="h-9 rounded-xl bg-white/5 border border-white/10 text-stone-400 text-[8px] font-black uppercase tracking-wider hover:text-white transition-all"
                            >
                                Historial
                            </button>
                        </div>
                    </div>
                </div>

                {/* TÉCNICO: SELECCIÓN DE CATEGORÍA POR INGRESO AVANZADO */}
                <div className={`max-w-2xl mx-auto space-y-3 transition-all duration-500 ${highlight === 'PURCHASE' ? 'scale-105' : ''}`}>
                    <p className={`text-[9px] font-black uppercase tracking-widest text-center transition-colors ${highlight === 'PURCHASE' ? 'text-primary animate-pulse' : 'text-stone-500'}`}>
                        {highlight === 'PURCHASE' ? 'Continúa seleccionando la categoría:' : 'Ingreso Técnico por Categoría'}
                    </p>
                    <div className={`flex gap-2 p-1 rounded-2xl transition-all ${highlight === 'PURCHASE' ? 'bg-primary/5 ring-1 ring-primary/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : ''}`}>
                        {[
                            { id: 'MATERIALES', label: 'Materiales', icon: 'Construction', color: 'blue' },
                            { id: 'MAQUINARIA', label: 'Maquinaria', icon: 'engineering', color: 'amber' },
                            { id: 'COMBUSTIBLES', label: 'Combustible', icon: 'ev_station', color: 'rose' },
                            { id: 'EPP', label: 'EPP', icon: 'safety_check', color: 'emerald' }
                        ].map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                                className={`flex-1 flex flex-col md:flex-row items-center gap-1 md:gap-2 justify-center py-3 rounded-xl border transition-all group relative overflow-hidden
                                    ${cat.color === 'blue' ? 'bg-blue-500/5 border-blue-500/10 hover:border-blue-500/50 hover:bg-blue-500/10' : ''}
                                    ${cat.color === 'amber' ? 'bg-amber-500/5 border-amber-500/10 hover:border-amber-500/50 hover:bg-amber-500/10' : ''}
                                    ${cat.color === 'rose' ? 'bg-rose-500/5 border-rose-500/10 hover:border-rose-500/50 hover:bg-rose-500/10' : ''}
                                    ${cat.color === 'emerald' ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/50 hover:bg-emerald-500/10' : ''}
                                    ${selectedCategory === cat.id ? 'ring-2 ring-offset-2 ring-offset-stone-950 scale-105 z-10' : 'opacity-80 hover:opacity-100'}
                                    ${selectedCategory === cat.id && cat.color === 'blue' ? 'ring-blue-500 border-blue-500 bg-blue-500/20' : ''}
                                    ${selectedCategory === cat.id && cat.color === 'amber' ? 'ring-amber-500 border-amber-500 bg-amber-500/20' : ''}
                                    ${selectedCategory === cat.id && cat.color === 'rose' ? 'ring-rose-500 border-rose-500 bg-rose-500/20' : ''}
                                    ${selectedCategory === cat.id && cat.color === 'emerald' ? 'ring-emerald-500 border-emerald-500 bg-emerald-500/20' : ''}
                                `}
                            >
                                <span className={`material-symbols-outlined text-base md:text-lg mb-0.5 md:mb-0 transition-colors
                                    ${cat.color === 'blue' ? 'text-blue-500/60 group-hover:text-blue-400' : ''}
                                    ${cat.color === 'amber' ? 'text-amber-500/60 group-hover:text-amber-400' : ''}
                                    ${cat.color === 'rose' ? 'text-rose-500/60 group-hover:text-rose-400' : ''}
                                    ${cat.color === 'emerald' ? 'text-emerald-500/60 group-hover:text-emerald-400' : ''}
                                    ${selectedCategory === cat.id ? '!text-white' : ''}
                                `}>{cat.icon}</span>
                                <span className={`text-[7px] md:text-[8px] font-black uppercase tracking-wider transition-colors
                                    ${cat.color === 'blue' ? 'text-blue-500/80 group-hover:text-blue-100' : ''}
                                    ${cat.color === 'amber' ? 'text-amber-500/80 group-hover:text-amber-100' : ''}
                                    ${cat.color === 'rose' ? 'text-rose-500/80 group-hover:text-rose-100' : ''}
                                    ${cat.color === 'emerald' ? 'text-emerald-500/80 group-hover:text-emerald-100' : ''}
                                    ${selectedCategory === cat.id ? '!text-white' : ''}
                                `}>{cat.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* SUB-CATEGORIAS EXPANDIBLES */}
                    {selectedCategory && (
                        <div className="animate-in slide-in-from-top-2 fade-in duration-300 pt-2">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white/5 rounded-2xl p-3 border border-white/5">
                                {subCategories[selectedCategory]?.map((sub) => (
                                    <button
                                        key={sub.id}
                                        onClick={() => onNavigate('ADVANCED_STOCK_ENTRY', { category: selectedCategory, subCategory: sub.id })}
                                        className="h-10 rounded-lg bg-stone-800 hover:bg-white/10 border border-white/5 hover:border-white/20 text-stone-400 hover:text-white transition-all text-[8px] font-black uppercase tracking-wider flex items-center justify-center text-center px-1"
                                    >
                                        {sub.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* ALMACEN BUTTON */}
                <div className="max-w-2xl mx-auto mb-3">
                    <button
                        onClick={() => onNavigate('WAREHOUSE_MANAGEMENT')}
                        className="w-full group flex items-center justify-center gap-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                        <span className="material-symbols-outlined text-xl text-stone-400 group-hover:text-white transition-colors">warehouse</span>
                        <div className="flex flex-col items-start">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Gestión de Almacén</span>
                            <span className="text-[7px] font-bold uppercase text-stone-500 group-hover:text-stone-400">Control de Existencias y Ubicaciones</span>
                        </div>
                    </button>
                </div>



                {quarantineCount > 0 && (
                    <div className="max-w-2xl mx-auto">
                        <button
                            onClick={() => onNavigate('QUALITY_GATE')}
                            className="bg-amber-500/10 border border-amber-500/30 w-full p-4 rounded-3xl flex items-center justify-between group hover:bg-amber-500/20 transition-all animate-pulse"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-2xl bg-amber-500 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-black font-black">gpp_maybe</span>
                                </div>
                                <div className="text-left">
                                    <p className="text-amber-500 font-black text-[10px] uppercase tracking-widest leading-none mb-1">Fase de Cuarentena (Staging)</p>
                                    <p className="text-white font-bold text-[12px] uppercase">Hay {quarantineCount} lotes en [EN_CALIDAD]</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-amber-500 font-black text-[8px] uppercase tracking-tighter">Iniciar Inspección</span>
                                <span className="material-symbols-outlined text-amber-500 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                            </div>
                        </button>
                    </div>
                )}
            </header>

            <div className="flex flex-col gap-10">
                {/* Inventory List - Now Full Width */}
                <div className="space-y-4 w-full">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xs font-black text-stone-500 uppercase tracking-[0.2em]">Existencias Recientes</h3>
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 transition-all">
                                <button
                                    onClick={handleShare}
                                    disabled={items.length === 0}
                                    className="text-[8px] font-black bg-white/5 text-stone-400 px-3 py-1.5 rounded-lg uppercase tracking-tighter hover:bg-white/10 transition-all border border-white/5 disabled:opacity-30 flex items-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-xs">share</span>
                                    Compartir {selectedItems.size > 0 ? `(${selectedItems.size})` : ''}
                                </button>
                                {selectedItems.size > 0 && (
                                    <>
                                        <button
                                            onClick={() => setSelectedItems(new Set())}
                                            className="text-[8px] font-black bg-white/5 text-stone-500 px-3 py-1.5 rounded-lg uppercase tracking-tighter hover:bg-white/10 transition-all border border-white/5"
                                        >
                                            Limpiar
                                        </button>
                                        <button
                                            onClick={handleDeleteSelected}
                                            className="text-[8px] font-black bg-red-500/10 text-red-500 px-3 py-1.5 rounded-lg uppercase tracking-tighter hover:bg-red-500/20 transition-all border border-red-500/20 flex items-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-xs">delete</span>
                                            Eliminar
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <button
                            onClick={() => onNavigate('MOVEMENT_HISTORY')}
                            className="text-primary text-[10px] font-black uppercase tracking-widest hover:underline"
                        >
                            Ver Historial Completo
                        </button>
                    </div>

                    <div className="glass-card rounded-premium overflow-hidden border border-white/5">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="px-4 py-3 text-[9px] font-black text-stone-500 uppercase tracking-widest text-center w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.size === items.length && items.length > 0}
                                            onChange={toggleSelectAll}
                                            className="w-3 h-3 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-[9px] font-black text-stone-500 uppercase tracking-widest">Material / Ubicación</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-stone-500 uppercase tracking-widest text-center">Última Compra (Fecha / Factura)</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-stone-500 uppercase tracking-widest text-center">Proveedor</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-stone-500 uppercase tracking-widest text-right">Stock</th>
                                    <th className="px-4 py-3 text-[9px] font-black text-stone-500 uppercase tracking-widest text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {items.slice(0, 10).map((item: any) => (
                                    <tr key={item.id} className={`hover:bg-white/[0.03] transition-colors group ${selectedItems.has(item.id) ? 'bg-primary/5' : ''}`}>
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                checked={selectedItems.has(item.id)}
                                                onChange={() => toggleSelection(item.id)}
                                                className="w-3 h-3 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-white/5 overflow-hidden flex items-center justify-center border border-white/10 shadow-inner">
                                                    {item.url_foto ? (
                                                        <img src={item.url_foto} className="w-full h-full object-cover" alt="" />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-stone-600 text-sm">inventory_2</span>
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-stone-100">{item.nombre}</p>
                                                    <p className="text-[9px] text-primary font-black uppercase tracking-tighter">Loc: {item.ubicacion || 'ALMACEN-GRAL'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex flex-col gap-0.5 items-center">
                                                <span className="text-[9px] font-black text-stone-300 uppercase tracking-widest">
                                                    {item.last_purchase_date ? new Date(item.last_purchase_date).toLocaleDateString() : '-'}
                                                </span>
                                                <span className="text-[8px] font-bold text-stone-500 uppercase tracking-tighter bg-white/5 px-2 py-0.5 rounded">
                                                    FAC: {item.last_invoice_number || '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <p className="text-[10px] font-black text-white/70 uppercase truncate max-w-[120px] mx-auto">
                                                {item.last_supplier_name || '-'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex flex-col items-end">
                                                <p className="text-sm font-black text-white tabular-nums leading-none">{item.stock_disponible}</p>
                                                <p className="text-[8px] font-bold text-stone-500 uppercase mt-1">{item.unidad_medida}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    onClick={() => onNavigate('MATERIAL_FORM', item)}
                                                    className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 hover:text-primary hover:border-primary/30 transition-all"
                                                    title="Editar Material"
                                                >
                                                    <span className="material-symbols-outlined text-[10px]">edit</span>
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item.id, item.nombre)}
                                                    className="w-6 h-6 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-stone-400 hover:text-red-500 hover:border-red-500/30 transition-all"
                                                    title="Eliminar Material"
                                                >
                                                    <span className="material-symbols-outlined text-[10px]">delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {notifications.length === 0 && (
                        <div className="flex justify-start px-2">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 opacity-40">
                                <span className="material-symbols-outlined text-emerald-500 text-base">check_circle</span>
                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-500/60">Stock Equilibrado</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notifications / Alerts - Now Below Table */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-stone-500 uppercase tracking-[0.2em] px-2">Alertas de Compras</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notifications.length > 0 ? (
                            notifications.map(notif => (
                                <div key={notif.id} className="glass-card rounded-2xl p-5 border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all">
                                    <div className="flex gap-4">
                                        <div className="bg-red-500/10 p-2.5 rounded-xl h-fit border border-red-500/20">
                                            <span className="material-symbols-outlined text-red-500 text-xl font-black">warning</span>
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-white mb-1 uppercase tracking-tight">{notif.titulo}</p>
                                            <p className="text-[10px] text-stone-500 leading-relaxed line-clamp-2 font-medium">{notif.mensaje}</p>
                                            <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
                                                <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">RRHH / Compras</span>
                                                <button className="text-primary text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors">Gestionar</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full flex flex-col items-center justify-center p-10 text-center opacity-10 border border-dashed border-white/10 rounded-3xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Sin Alertas Pendientes</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* HISTORIAL RECIENTE DE CARGA */}
                <div className="space-y-4 pt-8">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black text-stone-500 uppercase tracking-[0.2em]">Historial de Mercancía Cargada (Reciente)</h3>
                        <button onClick={() => onNavigate('PURCHASE_MANAGEMENT')} className="text-[10px] font-black text-primary uppercase tracking-widest hover:text-white transition-colors flex items-center gap-2">
                            Ver Todo
                            <span className="material-symbols-outlined text-sm">arrow_forward</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                        {recentPurchases.length > 0 ? (
                            recentPurchases.map(purchase => (
                                <div key={purchase.id} className="glass-card rounded-[2rem] p-4 border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <span className="material-symbols-outlined text-xl">receipt</span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase leading-none mb-1">{purchase.Proveedores?.nombre}</p>
                                            <div className="flex items-center gap-2 text-[9px] text-stone-500 font-bold uppercase tracking-widest">
                                                <span>FAC: {purchase.numero_factura}</span>
                                                <span>•</span>
                                                <span>{new Date(purchase.fecha).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right flex items-center gap-6">
                                        <div>
                                            <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest leading-none mb-1">Monto Total</p>
                                            <p className="text-white font-black text-sm tabular-nums">${purchase.total_neto.toLocaleString()}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                            <span className="material-symbols-outlined text-stone-400 text-sm">chevron_right</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 flex flex-col items-center justify-center opacity-20 border border-dashed border-white/10 rounded-[2.5rem]">
                                <span className="material-symbols-outlined text-4xl mb-2">history</span>
                                <p className="text-[10px] font-black uppercase tracking-widest">Sin registros recientes</p>
                            </div>
                        )}
                    </div>
                </div>
            </div >
        </div >
    );
};

export default InventoryDashboard;
