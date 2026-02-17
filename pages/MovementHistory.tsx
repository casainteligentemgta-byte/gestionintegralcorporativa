
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

interface MovementHistoryProps {
    onNavigate: (view: any) => void;
}

const MovementHistory: React.FC<MovementHistoryProps> = ({ onNavigate }) => {
    const [movements, setMovements] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMovements();
    }, []);

    const fetchMovements = async () => {
        try {
            const data = await dataService.getMovements();
            setMovements(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APROBADO': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'RECHAZADO': return 'text-red-500 bg-red-500/10 border-red-500/20';
            default: return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
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
        <div className="p-6 space-y-8 animate-in fade-in duration-700">
            <header className="flex items-center justify-between">
                <div>
                    <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Auditoría KORE</p>
                    <h1 className="text-3xl font-black text-white tracking-tighter">Historial de Movimientos</h1>
                </div>
                <button
                    onClick={() => onNavigate('INVENTORY_DASHBOARD')}
                    className="h-10 px-4 rounded-apple bg-white/5 border border-white/10 text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                    Volver
                </button>
            </header>

            <div className="glass-card rounded-premium overflow-hidden border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-white/[0.02]">
                                <th className="px-6 py-4 text-[9px] font-bold text-stone-500 uppercase tracking-widest">Fecha</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-stone-500 uppercase tracking-widest">Material</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-stone-500 uppercase tracking-widest">Tipo</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-stone-500 uppercase tracking-widest">Cantidad</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-stone-500 uppercase tracking-widest">Destino</th>
                                <th className="px-6 py-4 text-[9px] font-bold text-stone-500 uppercase tracking-widest">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {movements.map((m) => (
                                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                                    <td className="px-6 py-4 text-[11px] text-stone-400">
                                        {new Date(m.fecha_registro).toLocaleDateString()}
                                        <br />
                                        <span className="text-[9px] opacity-40">{new Date(m.fecha_registro).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <p className="text-xs font-bold text-stone-200">{m.Inventario_Global?.nombre}</p>
                                        <p className="text-[9px] text-stone-500 uppercase tracking-tighter">{m.Inventario_Global?.categoria}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${m.tipo_movimiento === 'ENTRADA' ? 'text-blue-400 border-blue-400/20 bg-blue-400/5' : 'text-orange-400 border-orange-400/20 bg-orange-400/5'}`}>
                                            {m.tipo_movimiento}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-xs font-bold text-stone-300">
                                        {m.cantidad} {m.Inventario_Global?.unidad_medida}
                                    </td>
                                    <td className="px-6 py-4 text-[11px] text-stone-400">
                                        {m.projects?.name || '---'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-[9px] font-black px-2 py-1 rounded-full border uppercase tracking-tighter ${getStatusColor(m.estado)}`}>
                                            {m.estado}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MovementHistory;
