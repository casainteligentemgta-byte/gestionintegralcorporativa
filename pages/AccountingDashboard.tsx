
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabase';

interface AccountingDashboardProps {
    onNavigate: (view: any) => void;
}

const AccountingDashboard: React.FC<AccountingDashboardProps> = ({ onNavigate }) => {
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [userRole, setUserRole] = useState<string>('');
    const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
    const [selectedPurchases, setSelectedPurchases] = useState<Set<string>>(new Set());
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Get user role
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data: profile } = await supabase
                        .from('user_profiles')
                        .select('role')
                        .eq('user_id', user.id)
                        .single();
                    setUserRole(profile?.role || 'viewer');
                }

                // Get purchases
                const data = await dataService.getPurchases();
                setPurchases(data || []);
            } catch (error) {
                console.error('Error loading accounting data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const canEditStatus = () => {
        return ['admin', 'manager', 'gerente'].includes(userRole.toLowerCase());
    };

    const togglePaymentStatus = async (purchaseId: string, currentStatus: string) => {
        if (!canEditStatus()) {
            alert('No tienes permisos para cambiar el estado de pago');
            return;
        }

        setUpdatingStatus(purchaseId);
        try {
            // Ciclo: POR_REVISAR (Red) -> POR_PAGAR (Yellow) -> PAGADA (Green)
            let newStatus: 'PAGADA' | 'POR_PAGAR' | 'POR_REVISAR';

            if (currentStatus === 'POR_REVISAR') {
                newStatus = 'POR_PAGAR';
            } else if (currentStatus === 'POR_PAGAR') {
                newStatus = 'PAGADA';
            } else {
                newStatus = 'POR_REVISAR';
            }

            await dataService.updatePurchase(purchaseId, {
                estado_pago: newStatus,
                fecha_pago: newStatus === 'PAGADA' ? new Date().toISOString() : null
            });

            // Update local state
            setPurchases(purchases.map(p =>
                p.id === purchaseId
                    ? { ...p, estado_pago: newStatus, fecha_pago: newStatus === 'PAGADA' ? new Date().toISOString() : null }
                    : p
            ));
        } catch (error) {
            console.error('Error updating payment status:', error);
            alert('Error al actualizar el estado de pago');
        } finally {
            setUpdatingStatus(null);
        }
    };

    const handleSelectPurchase = (id: string) => {
        const newSelected = new Set(selectedPurchases);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedPurchases(newSelected);
        setSelectAll(newSelected.size === purchases.length && purchases.length > 0);
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedPurchases(new Set());
            setSelectAll(false);
        } else {
            const allIds = new Set(purchases.map(p => p.id));
            setSelectedPurchases(allIds);
            setSelectAll(true);
        }
    };

    const exportToExcel = () => {
        const toExport = purchases.filter(p => selectedPurchases.has(p.id));
        if (toExport.length === 0) {
            alert('Selecciona al menos una factura para exportar');
            return;
        }

        const headers = ['Fecha', 'Factura', 'Proveedor', 'RIF', 'Monto', 'Estado', 'Fecha Pago'];
        const rows = toExport.map(p => [
            new Date(p.fecha).toLocaleDateString(),
            p.numero_factura,
            p.Proveedores?.nombre || '',
            p.Proveedores?.rif || '',
            p.total_neto.toFixed(2),
            p.estado_pago,
            p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString() : 'N/A'
        ]);

        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Cuentas_Pagar_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    const shareWhatsApp = () => {
        const toExport = purchases.filter(p => selectedPurchases.has(p.id));
        if (toExport.length === 0) {
            alert('Selecciona facturas para compartir');
            return;
        }

        let text = '*RESUMEN CUENTAS POR PAGAR*\n\n';
        toExport.forEach(p => {
            text += `• *${p.numero_factura}* | ${p.Proveedores?.nombre}\nMonto: $${p.total_neto.toLocaleString()} | Est: ${p.estado_pago}\n\n`;
        });

        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
    };

    const shareEmail = () => {
        const toExport = purchases.filter(p => selectedPurchases.has(p.id));
        if (toExport.length === 0) return;

        const subject = 'Reporte Cuentas por Pagar';
        let body = 'Detalle de Facturas Pendientes:\n\n';
        toExport.forEach(p => {
            body += `${p.numero_factura} - ${p.Proveedores?.nombre}: $${p.total_neto.toLocaleString()} (${p.estado_pago})\n`;
        });

        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };

    return (
        <div className="min-h-screen bg-black p-4 pb-32 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-widest">Contabilidad</h2>
                    <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest mt-1">Gestión Financiera</p>
                </div>
            </div>

            {/* Menu Grid */}
            <div className="grid grid-cols-2 gap-4 mb-8">
                <button
                    onClick={() => alert("Módulo en desarrollo: Cuentas por Cobrar")}
                    className="glass-card p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-emerald-500/10 to-transparent hover:from-emerald-500/20 transition-all group flex flex-col items-center justify-center gap-4 aspect-square"
                >
                    <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-emerald-500/20">
                        <span className="material-symbols-outlined text-3xl text-emerald-500">account_balance_wallet</span>
                    </div>
                    <div className="text-center">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Cuentas por Cobrar</h3>
                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">Facturación a Clientes</p>
                    </div>
                </button>

                <button
                    onClick={() => onNavigate('PURCHASE_MANAGEMENT')}
                    className="glass-card p-6 rounded-[2rem] border border-white/5 bg-gradient-to-br from-blue-500/10 to-transparent hover:from-blue-500/20 transition-all group flex flex-col items-center justify-center gap-4 aspect-square"
                >
                    <div className="w-16 h-16 rounded-2xl bg-blue-500/20 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg shadow-blue-500/20">
                        <span className="material-symbols-outlined text-3xl text-blue-500">receipt_long</span>
                    </div>
                    <div className="text-center">
                        <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">Ingresar Factura</h3>
                        <p className="text-[9px] font-bold text-stone-500 uppercase tracking-wide">Nueva Cuenta por Pagar</p>
                    </div>
                </button>
            </div>

            {/* Accounts Payable Table */}
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 mb-2">
                    <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-blue-500">payments</span>
                        <h3 className="text-xs font-black text-white uppercase tracking-widest">Cuentas por Pagar (Facturas Cargadas)</h3>
                        {!canEditStatus() && (
                            <span className="text-[8px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                                Solo lectura
                            </span>
                        )}
                    </div>

                    {/* SHARE BUTTONS */}
                    <div className="relative group">
                        <button
                            className="h-8 px-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-blue-500/20 transition-all"
                        >
                            <span className="material-symbols-outlined text-sm">share</span>
                            Compartir
                            {selectedPurchases.size > 0 && (
                                <span className="bg-blue-500 text-white px-1.5 rounded-full text-[8px]">{selectedPurchases.size}</span>
                            )}
                        </button>
                        <div className="hidden group-hover:block absolute top-full right-0 mt-1 bg-stone-900 border border-white/10 rounded-2xl shadow-2xl z-20 min-w-[150px] overflow-hidden">
                            <button
                                onClick={exportToExcel}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-[9px] font-black text-white uppercase tracking-widest transition-colors text-left border-b border-white/5"
                            >
                                <span className="material-symbols-outlined text-base text-emerald-400">table_view</span>
                                Excel (CSV)
                            </button>
                            <button
                                onClick={shareWhatsApp}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-[9px] font-black text-white uppercase tracking-widest transition-colors text-left border-b border-white/5"
                            >
                                <span className="material-symbols-outlined text-base text-green-400">chat</span>
                                WhatsApp
                            </button>
                            <button
                                onClick={shareEmail}
                                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-[9px] font-black text-white uppercase tracking-widest transition-colors text-left"
                            >
                                <span className="material-symbols-outlined text-base text-blue-400">mail</span>
                                Correo
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-white/5 border-b border-white/5">
                                <th className="p-3 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                    />
                                </th>
                                <th className="p-3 text-[8px] font-black text-stone-500 uppercase tracking-wider text-center">Fecha</th>
                                <th className="p-3 text-[8px] font-black text-stone-500 uppercase tracking-wider text-center">N° Factura</th>
                                <th className="p-3 text-[8px] font-black text-stone-500 uppercase tracking-wider">Proveedor</th>
                                <th className="p-3 text-[8px] font-black text-stone-500 uppercase tracking-wider text-right">Monto</th>
                                <th className="p-3 text-[8px] font-black text-stone-500 uppercase tracking-wider text-center">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-xs text-stone-500 uppercase tracking-widest">Cargando...</td>
                                </tr>
                            ) : purchases.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-xs text-stone-500 uppercase tracking-widest">No hay cuentas por pagar registradas</td>
                                </tr>
                            ) : (
                                purchases.map((purchase) => {
                                    const isPaid = purchase.estado_pago === 'PAGADA';
                                    const isUpdating = updatingStatus === purchase.id;

                                    return (
                                        <tr key={purchase.id} className={`group hover:bg-white/[0.04] transition-colors ${selectedPurchases.has(purchase.id) ? 'bg-blue-500/[0.03]' : ''}`}>
                                            <td className="p-3 text-center">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedPurchases.has(purchase.id)}
                                                    onChange={() => handleSelectPurchase(purchase.id)}
                                                    className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-blue-500 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="font-mono text-[9px] text-stone-400">
                                                    {new Date(purchase.fecha).toLocaleDateString('es', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className="font-mono text-[9px] font-bold text-emerald-400">{purchase.numero_factura}</span>
                                            </td>
                                            <td className="p-3">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-stone-200">{purchase.Proveedores?.nombre || 'Desconocido'}</span>
                                                    <span className="text-[7px] text-stone-500 font-mono">{purchase.Proveedores?.rif}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-right">
                                                <span className="font-mono text-[10px] font-black text-white">
                                                    $ {purchase.total_neto.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                </span>
                                            </td>
                                            <td className="p-3 text-center">
                                                {canEditStatus() ? (
                                                    <button
                                                        onClick={() => togglePaymentStatus(purchase.id, purchase.estado_pago || 'POR_REVISAR')}
                                                        disabled={isUpdating}
                                                        className={`text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-tighter transition-all whitespace-nowrap min-w-[70px] ${purchase.estado_pago === 'PAGADA'
                                                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                                                            : purchase.estado_pago === 'POR_PAGAR'
                                                                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30'
                                                                : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                                                            } ${isUpdating ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
                                                    >
                                                        {isUpdating ? 'Wait...' :
                                                            purchase.estado_pago === 'PAGADA' ? '✓ Pagado' :
                                                                purchase.estado_pago === 'POR_PAGAR' ? '⌛ Por Pagar' :
                                                                    '✖ Por Revisar'}
                                                    </button>
                                                ) : (
                                                    <span className={`text-[7px] font-black px-2 py-1 rounded-md uppercase tracking-tighter whitespace-nowrap ${purchase.estado_pago === 'PAGADA'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                        : purchase.estado_pago === 'POR_PAGAR'
                                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                                                        }`}>
                                                        {purchase.estado_pago === 'PAGADA' ? '✓ Pagado' :
                                                            purchase.estado_pago === 'POR_PAGAR' ? '⌛ Por Pagar' :
                                                                '✖ Por Revisar'}
                                                    </span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AccountingDashboard;
