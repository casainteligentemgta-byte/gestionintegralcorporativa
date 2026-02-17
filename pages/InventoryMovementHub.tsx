
import React from 'react';

interface InventoryMovementHubProps {
    onNavigate: (view: any, data?: any) => void;
}

const InventoryMovementHub: React.FC<InventoryMovementHubProps> = ({ onNavigate }) => {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 animate-in fade-in duration-700">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 w-full max-w-6xl">
                {/* COMPRA 101 */}
                <button
                    onClick={() => onNavigate('PURCHASE_MANAGEMENT')}
                    className="group relative aspect-square bg-white/[0.03] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/[0.08] hover:border-blue-500/50 hover:scale-[1.05] shadow-2xl"
                >
                    <div className="w-16 h-16 rounded-3xl bg-blue-500/10 flex items-center justify-center group-hover:bg-blue-500 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] transition-all duration-500">
                        <span className="material-symbols-outlined text-4xl text-blue-500 group-hover:text-black transition-colors font-black">receipt_long</span>
                    </div>
                    <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:tracking-[0.15em] transition-all">Compra 101</span>
                </button>

                {/* TRANSF. 311 */}
                <button
                    onClick={() => onNavigate('STOCK_MOVEMENT_SAP', { code: '311' })}
                    className="group relative aspect-square bg-white/[0.03] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/[0.08] hover:border-blue-400/50 hover:scale-[1.05] shadow-2xl"
                >
                    <div className="w-16 h-16 rounded-3xl bg-blue-400/10 flex items-center justify-center group-hover:bg-blue-400 group-hover:shadow-[0_0_30px_rgba(96,165,250,0.5)] transition-all duration-500">
                        <span className="material-symbols-outlined text-4xl text-blue-400 group-hover:text-black transition-colors font-black">local_shipping</span>
                    </div>
                    <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:tracking-[0.15em] transition-all">Transf. 311</span>
                </button>

                {/* SOBRANTE 501 */}
                <button
                    onClick={() => onNavigate('STOCK_MOVEMENT_SAP', { code: '501' })}
                    className="group relative aspect-square bg-white/[0.03] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/[0.08] hover:border-amber-500/50 hover:scale-[1.05] shadow-2xl"
                >
                    <div className="w-16 h-16 rounded-3xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all duration-500">
                        <span className="material-symbols-outlined text-4xl text-amber-500 group-hover:text-black transition-colors font-black">inventory_2</span>
                    </div>
                    <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:tracking-[0.15em] transition-all">Sobrante 501</span>
                </button>

                {/* REINGRESO 601 */}
                <button
                    onClick={() => onNavigate('STOCK_MOVEMENT_SAP', { code: '601' })}
                    className="group relative aspect-square bg-white/[0.03] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all hover:bg-white/[0.08] hover:border-emerald-500/50 hover:scale-[1.05] shadow-2xl"
                >
                    <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500 group-hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all duration-500">
                        <span className="material-symbols-outlined text-4xl text-emerald-500 group-hover:text-black transition-colors font-black">history</span>
                    </div>
                    <span className="text-[11px] font-black text-white uppercase tracking-widest group-hover:tracking-[0.15em] transition-all">Reingreso 601</span>
                </button>
            </div>
        </div>
    );
};

export default InventoryMovementHub;
