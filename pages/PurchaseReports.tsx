
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

interface PurchaseReportsProps {
    onNavigate: (view: any) => void;
}

const PurchaseReports: React.FC<PurchaseReportsProps> = ({ onNavigate }) => {
    const [loading, setLoading] = useState(true);
    const [reportItems, setReportItems] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [selectAll, setSelectAll] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const purchases = await dataService.getPurchases();

            // Flatten the purchases into individual line items
            const flatList: any[] = [];

            console.log('Purchase Reports Data:', purchases);

            purchases.forEach(purchase => {
                const headerData = {
                    date: purchase.fecha,
                    invoiceNumber: purchase.numero_factura,
                    providerName: purchase.Proveedores?.nombre || 'Proveedor Desconocido',
                    providerRif: purchase.Proveedores?.rif || '',
                    pdfUrl: purchase.archivo_pdf_url,
                    obsHeader: purchase.observaciones,
                    purchaseId: purchase.id
                };

                if (purchase.Detalle_Compra && purchase.Detalle_Compra.length > 0) {
                    purchase.Detalle_Compra.forEach((item: any) => {
                        const qty = item.cantidad ?? item.cantidad_comprada ?? 0;
                        const price = item.precio ?? item.precio_unitario ?? 0;

                        flatList.push({
                            id: item.id,
                            ...headerData,
                            itemName: item.Inventario_Global?.nombre || item.nombre_material || 'Ítem sin nombre',
                            itemUnit: item.Inventario_Global?.unidad_medida || item.unidad_medida || 'UNID',
                            quantity: qty,
                            price: price,
                            subtotal: qty * price
                        });
                    });
                } else {
                    // Invoice without items? Should technically not happen if filtered correctly, but good to handle
                    // or just ignore. Let's ignore empty invoices in the item report.
                }
            });

            // Sort by Date Descending
            flatList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            setReportItems(flatList);

        } catch (error) {
            console.error('Error loading purchase report:', error);
        } finally {
            setLoading(false);
        }
    };

    const getWeeklyTotal = () => {
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return reportItems
            .filter(item => new Date(item.date) >= weekAgo)
            .reduce((acc, item) => acc + item.subtotal, 0);
    };

    const getMonthlyTotal = () => {
        const now = new Date();
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return reportItems
            .filter(item => new Date(item.date) >= monthAgo)
            .reduce((acc, item) => acc + item.subtotal, 0);
    };

    const getTotalAllTime = () => {
        return reportItems.reduce((acc, item) => acc + item.subtotal, 0);
    };

    const handleSelectItem = (itemId: string) => {
        const newSelected = new Set(selectedItems);
        if (newSelected.has(itemId)) {
            newSelected.delete(itemId);
        } else {
            newSelected.add(itemId);
        }
        setSelectedItems(newSelected);
        setSelectAll(newSelected.size === getFilteredItems().length);
    };

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedItems(new Set());
            setSelectAll(false);
        } else {
            const allIds = new Set(getFilteredItems().map((item, idx) => `${item.id}-${idx}`));
            setSelectedItems(allIds);
            setSelectAll(true);
        }
    };

    const getFilteredItems = () => {
        return reportItems.filter(item => {
            const searchLower = searchQuery.toLowerCase();
            const matchesSearch = (
                item.itemName?.toLowerCase().includes(searchLower) ||
                item.providerName?.toLowerCase().includes(searchLower) ||
                item.invoiceNumber?.toLowerCase().includes(searchLower)
            );

            if (!matchesSearch) return false;

            if (startDate || endDate) {
                const itemDate = new Date(item.date);
                if (startDate && itemDate < new Date(startDate)) return false;
                if (endDate && itemDate > new Date(endDate)) return false;
            }

            return true;
        });
    };

    const exportToExcel = () => {
        const itemsToExport = getFilteredItems().filter((item, idx) =>
            selectedItems.has(`${item.id}-${idx}`)
        );

        if (itemsToExport.length === 0) {
            alert('Por favor seleccione al menos un ítem para exportar');
            return;
        }

        // Create CSV content with all invoice data
        const headers = [
            'Fecha',
            'N° Factura',
            'Proveedor',
            'RIF',
            'Material',
            'Cantidad Pedida',
            'Cantidad Recibida',
            'Unidad',
            'Precio Unitario',
            'Subtotal',
            'Conformidad Calidad',
            'Observaciones',
            'URL PDF'
        ];
        const csvContent = [
            headers.join(','),
            ...itemsToExport.map(item => [
                new Date(item.date).toLocaleDateString(),
                item.invoiceNumber,
                `"${item.providerName}"`,
                item.providerRif,
                `"${item.itemName}"`,
                item.quantity,
                item.receivedQuantity || item.quantity,
                item.itemUnit,
                item.price.toFixed(2),
                item.subtotal.toFixed(2),
                item.conformidad || 'N/A',
                `"${item.observations || ''}"`,
                item.pdfUrl || ''
            ].join(','))
        ].join('\n');

        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `compras_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-6 space-y-6 md:space-y-10 max-w-7xl mx-auto pb-32 animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-emerald-500">tactic</span>
                        <p className="text-emerald-500 font-black text-[9px] uppercase tracking-[0.3em]">Reportes Financieros</p>
                    </div>
                    <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                        Historial Detallado de Compras
                    </h1>
                    <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest leading-none mt-2">
                        Desglose ítem por ítem de todas las facturas registradas
                    </p>
                </div>

                <button
                    onClick={() => onNavigate('DASHBOARD')}
                    className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-stone-400 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2 w-fit"
                >
                    <span className="material-symbols-outlined text-sm">arrow_back</span>
                    Volver al Dashboard
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-stone-900/40 border border-white/5 rounded-[2rem] overflow-hidden backdrop-blur-sm shadow-2xl">
                <div className="p-4 border-b border-white/5">
                    {/* Title Row */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2">
                            <h3 className="text-[10px] font-black text-white uppercase tracking-wider whitespace-nowrap">Movimientos de Compra</h3>
                            <div className="bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <span className="text-emerald-400 text-[8px] font-black uppercase tracking-wider">{getFilteredItems().length} Reg.</span>
                            </div>
                            {selectedItems.size > 0 && (
                                <div className="bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                                    <span className="text-blue-400 text-[8px] font-black uppercase tracking-wider">{selectedItems.size} Sel.</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls Row */}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* Date Filters */}
                        <div className="flex items-center gap-1">
                            <label className="text-[7px] font-bold text-stone-500 uppercase">Desde:</label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="bg-black/20 border border-white/10 rounded px-1 py-0.5 text-[8px] text-white focus:outline-none focus:border-emerald-500/50 transition-all w-24"
                            />
                        </div>
                        <div className="flex items-center gap-1">
                            <label className="text-[7px] font-bold text-stone-500 uppercase">Hasta:</label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="bg-black/20 border border-white/10 rounded px-1 py-0.5 text-[8px] text-white focus:outline-none focus:border-emerald-500/50 transition-all w-24"
                            />
                        </div>

                        {/* Share Button with Dropdown */}
                        <div className="relative group">
                            <button
                                className="px-2 py-1 bg-blue-600 hover:bg-blue-500 rounded text-[7px] font-black text-white uppercase tracking-wide transition-all flex items-center gap-1"
                            >
                                <span className="material-symbols-outlined text-[10px]">share</span>
                                Compartir
                            </button>
                            <div className="hidden group-hover:block absolute top-full left-0 mt-1 bg-stone-900 border border-white/10 rounded-lg shadow-xl z-10 min-w-[140px]">
                                {/* Excel Export */}
                                <button
                                    onClick={exportToExcel}
                                    disabled={selectedItems.size === 0}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed text-[8px] font-bold text-white transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-xs text-emerald-400">download</span>
                                    Exportar Excel
                                </button>
                                {/* WhatsApp */}
                                <a
                                    href={`https://wa.me/?text=${encodeURIComponent('Reporte de Compras - ' + window.location.href)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-[8px] font-bold text-white transition-colors"
                                >
                                    <span className="material-symbols-outlined text-xs text-green-400">chat</span>
                                    WhatsApp
                                </a>
                                {/* Email */}
                                <button
                                    onClick={() => {
                                        const subject = 'Reporte de Compras';
                                        const body = `Revisa el reporte de compras: ${window.location.href}`;
                                        window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 text-[8px] font-bold text-white transition-colors text-left"
                                >
                                    <span className="material-symbols-outlined text-xs text-blue-400">mail</span>
                                    Correo
                                </button>
                            </div>
                        </div>

                        {/* Search Input */}
                        <div className="relative flex-1 min-w-[100px] max-w-[180px]">
                            <span className="material-symbols-outlined absolute left-1.5 top-1/2 -translate-y-1/2 text-stone-500 text-[10px]">search</span>
                            <input
                                type="text"
                                placeholder="Buscar..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded py-1 pl-6 pr-2 text-[8px] text-white placeholder:text-stone-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-black/20 border-b border-white/5">
                                <th className="p-1 w-8">
                                    <input
                                        type="checkbox"
                                        checked={selectAll}
                                        onChange={handleSelectAll}
                                        className="w-3 h-3 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                                    />
                                </th>
                                <th className="p-1 text-[7px] font-black text-stone-500 uppercase tracking-wider whitespace-nowrap">Fecha</th>
                                <th className="p-1 text-[7px] font-black text-stone-500 uppercase tracking-wider whitespace-nowrap">N° Fact.</th>
                                <th className="p-1 text-[7px] font-black text-stone-500 uppercase tracking-wider whitespace-nowrap">Proveedor</th>
                                <th className="p-1 text-[7px] font-black text-stone-500 uppercase tracking-wider">Material</th>
                                <th className="p-1 text-[7px] font-black text-stone-500 uppercase tracking-wider text-center">Cant.</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {getFilteredItems().length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-stone-500 text-xs font-bold uppercase tracking-widest">
                                        No se encontraron registros que coincidan con la búsqueda
                                    </td>
                                </tr>
                            ) : (
                                getFilteredItems().map((item, index) => {
                                    const itemKey = `${item.id}-${index}`;
                                    return (
                                        <tr key={itemKey} className="group hover:bg-white/[0.02] transition-colors">
                                            <td className="p-1" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={selectedItems.has(itemKey)}
                                                    onChange={() => handleSelectItem(itemKey)}
                                                    className="w-3 h-3 rounded border-white/20 bg-white/5 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                                                />
                                            </td>
                                            <td className="p-1 whitespace-nowrap cursor-pointer" onClick={() => setSelectedInvoice(item.invoiceNumber)}>
                                                <span className="font-mono text-[8px] font-bold text-stone-400 bg-white/5 px-1 py-0.5 rounded">
                                                    {new Date(item.date).toLocaleDateString('es', { day: '2-digit', month: '2-digit' })}
                                                </span>
                                            </td>
                                            <td className="p-1 whitespace-nowrap cursor-pointer" onClick={() => setSelectedInvoice(item.invoiceNumber)}>
                                                <span className="font-mono text-[8px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors">
                                                    {item.invoiceNumber}
                                                </span>
                                            </td>
                                            <td className="p-1 cursor-pointer" onClick={() => setSelectedInvoice(item.invoiceNumber)}>
                                                <span className="text-[8px] font-bold text-stone-400 leading-tight truncate block max-w-[120px]">
                                                    {item.providerName}
                                                </span>
                                            </td>
                                            <td className="p-1 cursor-pointer" onClick={() => setSelectedInvoice(item.invoiceNumber)}>
                                                <span className="text-[8px] font-bold text-stone-200 leading-tight group-hover:text-emerald-400 transition-colors truncate block">
                                                    {item.itemName}
                                                </span>
                                            </td>
                                            <td className="p-1 text-center whitespace-nowrap cursor-pointer" onClick={() => setSelectedInvoice(item.invoiceNumber)}>
                                                <span className="text-[8px] font-bold text-white bg-white/5 px-1 py-0.5 rounded">
                                                    {item.quantity}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-stone-900/50 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Comprado Esta Semana</p>
                    <h2 className="text-3xl font-black text-white tracking-tighter">
                        $ {getWeeklyTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h2>
                </div>
                <div className="bg-stone-900/50 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Comprado Este Mes</p>
                    <h2 className="text-3xl font-black text-white tracking-tighter">
                        $ {getMonthlyTotal().toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h2>
                </div>
                <div className="bg-stone-900/50 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center text-center">
                    <p className="text-[9px] font-black text-stone-500 uppercase tracking-widest mb-1">Total Comprado</p>
                    <h2 className="text-3xl font-black text-white tracking-tighter">
                        $ {reportItems.reduce((acc, item) => acc + item.subtotal, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h2>
                </div>
            </div>
            {/* Modal de Detalle de Factura */}
            {selectedInvoice && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        {(() => {
                            const details = reportItems.filter(i => i.invoiceNumber === selectedInvoice);
                            const header = details[0];
                            if (!header) return null;

                            return (
                                <>
                                    {/* Header Modal */}
                                    <div className="p-6 border-b border-white/10 bg-white/[0.02] flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-3 mb-2">
                                                <span className="bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                                                    Factura #{header.invoiceNumber}
                                                </span>
                                                <span className="text-stone-500 text-xs font-bold">
                                                    {new Date(header.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                                </span>
                                            </div>
                                            <h2 className="text-2xl font-black text-white">{header.providerName}</h2>
                                            <p className="text-stone-500 text-xs font-mono">{header.providerRif}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {header.pdfUrl && (
                                                <a
                                                    href={header.pdfUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-4 py-2 bg-stone-900 border border-white/10 rounded-xl text-xs font-bold text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                                                >
                                                    <span className="material-symbols-outlined text-sm">picture_as_pdf</span>
                                                    Ver Original
                                                </a>
                                            )}
                                            <button
                                                onClick={() => setSelectedInvoice(null)}
                                                className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/10 flex items-center justify-center text-stone-400 hover:text-white transition-colors"
                                            >
                                                <span className="material-symbols-outlined">close</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Content Items */}
                                    <div className="flex-1 overflow-y-auto p-6">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="border-b border-white/5 text-[9px] font-black text-stone-500 uppercase tracking-widest">
                                                    <th className="pb-4 text-left">Descripción del Ítem</th>
                                                    <th className="pb-4 text-center w-24">Cantidad</th>
                                                    <th className="pb-4 text-right w-32">Precio Unit.</th>
                                                    <th className="pb-4 text-right w-32">Subtotal</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-white/5">
                                                {details.map((item, idx) => (
                                                    <tr key={idx} className="group hover:bg-white/[0.02]">
                                                        <td className="py-4">
                                                            <span className="text-sm font-bold text-white block">{item.itemName}</span>
                                                        </td>
                                                        <td className="py-4 text-center">
                                                            <span className="text-xs font-bold text-stone-300 bg-white/5 px-2 py-1 rounded-lg">
                                                                {item.quantity} {item.itemUnit}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <span className="font-mono text-xs text-stone-400">
                                                                $ {item.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </td>
                                                        <td className="py-4 text-right">
                                                            <span className="font-mono text-xs font-bold text-emerald-400">
                                                                $ {item.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot>
                                                <tr className="border-t border-white/10">
                                                    <td colSpan={3} className="pt-6 text-right text-xs font-black text-stone-400 uppercase tracking-widest">Total Factura</td>
                                                    <td className="pt-6 text-right">
                                                        <span className="font-mono text-lg font-black text-emerald-400">
                                                            $ {details.reduce((acc, i) => acc + i.subtotal, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </td>
                                                </tr>
                                            </tfoot>
                                        </table>

                                        {header.obsHeader && (
                                            <div className="mt-8 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                                                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-2">Observaciones</h4>
                                                <p className="text-xs text-amber-200/80">{header.obsHeader}</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PurchaseReports;
