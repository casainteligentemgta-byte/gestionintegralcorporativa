
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';

interface QualityGateProps {
    onNavigate: (view: any) => void;
}

const QualityGate: React.FC<QualityGateProps> = ({ onNavigate }) => {
    const [inspections, setInspections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    // Form para liberación
    const [selectedInspection, setSelectedInspection] = useState<any | null>(null);
    const [decision, setDecision] = useState<'GOOD' | 'DETAILS' | 'REJECTED'>('GOOD');
    const [useStorage, setUseStorage] = useState(false);
    const [aisle, setAisle] = useState('');
    const [shelf, setShelf] = useState('');
    const [level, setLevel] = useState('');
    const [remarks, setRemarks] = useState('');
    const [pdfFile, setPdfFile] = useState<File | null>(null);

    useEffect(() => {
        fetchInspections();
    }, []);

    const fetchInspections = async () => {
        try {
            const data = await dataService.getPendingInspections();
            setInspections(data);
        } catch (error) {
            console.error('Error fetching quality gate:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedInspection) return;

        if (decision === 'REJECTED') {
            handleReject();
            return;
        }

        // Regla: Si se usa almacenaje, los datos son obligatorios
        if (useStorage && (!aisle || !shelf || !level)) {
            alert('Debes indicar Pasillo, Estante y Peldaño para asignar ubicación.');
            return;
        }

        // Regla: Observación obligatoria si hay detalles
        if (decision === 'DETAILS' && !remarks) {
            alert('Por favor describe los detalles encontrados en las observaciones.');
            return;
        }

        // Regla: Bloqueo si requiere calidad y no hay "PDF"
        if (selectedInspection.Inventario_Global?.requiere_calidad && !pdfFile && !selectedInspection.url_pdf_resultado) {
            alert('BLOQUEO TÉCNICO: Este material requiere carga de Certificado/Prueba Técnica (PDF) para su liberación.');
            return;
        }

        setProcessingId(selectedInspection.id);
        try {
            const finalLocation = useStorage ? `PASILLO ${aisle} | ESTANTE ${shelf} | PELDAÑO ${level}` : 'ÁREA GENERAL';
            const finalRemarks = decision === 'DETAILS' ? `[CON DETALLES] ${remarks}` : remarks;

            await dataService.processInternment({
                inspectionId: selectedInspection.id,
                materialId: selectedInspection.material_id,
                qtyApproved: selectedInspection.conteo_fisico,
                location: finalLocation,
                remarks: finalRemarks,
                resultPdfUrl: pdfFile ? 'simulated_url_to_pdf' : undefined
            });
            resetForm();
            fetchInspections();
        } catch (error) {
            console.error('Error releasing material:', error);
            alert('Error en el internamiento');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async () => {
        if (!remarks) {
            alert('Por favor describe el motivo del rechazo en las observaciones.');
            return;
        }

        if (!confirm('¿Estás seguro de RECHAZAR y DEVOLVER este material? Esta acción restará el stock de cuarentena.')) return;

        setProcessingId(selectedInspection.id);
        try {
            await dataService.rejectInspection({
                inspectionId: selectedInspection.id,
                materialId: selectedInspection.material_id,
                qty: selectedInspection.conteo_fisico,
                reason: `[RECHAZADO] ${remarks}`
            });
            resetForm();
            fetchInspections();
        } catch (error) {
            console.error('Error rejecting material:', error);
            alert('Error en el proceso de rechazo');
        } finally {
            setProcessingId(null);
        }
    };

    const resetForm = () => {
        setSelectedInspection(null);
        setDecision('GOOD');
        setUseStorage(false);
        setAisle('');
        setShelf('');
        setLevel('');
        setRemarks('');
        setPdfFile(null);
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
                    <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Módulo de Calidad</p>
                    <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Cuarentena & Staging</h1>
                </div>
                <button
                    onClick={() => onNavigate('INVENTORY_DASHBOARD')}
                    className="h-10 px-4 rounded-apple bg-white/5 border border-white/10 text-stone-400 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-colors"
                >
                    Volver
                </button>
            </header>

            <div className="max-w-2xl mx-auto space-y-12">
                {/* Formulario de Internamiento - AHORA ARRIBA PARA ACCIÓN RÁPIDA */}
                <div className="space-y-4">
                    <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest px-2">Decision de Calidad</h3>
                    {selectedInspection ? (
                        <form onSubmit={handleFormSubmit} className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-white/[0.01] shadow-2xl space-y-8 animate-in zoom-in-95 duration-300">
                            {/* Resumen del Item Seleccionado */}
                            <div className="flex items-center gap-5 p-5 rounded-3xl bg-primary/5 border border-primary/10">
                                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                    <span className="material-symbols-outlined text-2xl">inventory_2</span>
                                </div>
                                <div className="flex-1">
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Auditando entrada:</p>
                                    <h4 className="text-white font-black text-lg uppercase leading-tight">{selectedInspection.Inventario_Global?.nombre}</h4>
                                    <p className="text-[10px] text-stone-500 font-mono uppercase mt-0.5">Lote: {selectedInspection.id.slice(0, 8)} • Cant: {selectedInspection.conteo_fisico} {selectedInspection.Inventario_Global?.unidad_medida}</p>
                                </div>
                            </div>

                            {/* DECISION DE CALIDAD - CUADRO DE ESTADOS */}
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">Resultado de Inspección</label>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setDecision('GOOD')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${decision === 'GOOD' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-white/5 border-white/5 text-stone-500 hover:bg-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined mb-1">check_circle</span>
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Buen Estado</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDecision('DETAILS')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${decision === 'DETAILS' ? 'bg-amber-500/20 border-amber-500 text-amber-400' : 'bg-white/5 border-white/5 text-stone-500 hover:bg-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined mb-1">warning</span>
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Con Detalles</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setDecision('REJECTED')}
                                        className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all ${decision === 'REJECTED' ? 'bg-red-500/20 border-red-500 text-red-400' : 'bg-white/5 border-white/5 text-stone-500 hover:bg-white/10'}`}
                                    >
                                        <span className="material-symbols-outlined mb-1">cancel</span>
                                        <span className="text-[9px] font-black uppercase tracking-tighter">Devuelto</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Selector de Almacenaje - Solo si no es rechazado */}
                                {decision !== 'REJECTED' && (
                                    <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${useStorage ? 'bg-primary/20 text-primary' : 'bg-white/5 text-stone-500'}`}>
                                                <span className="material-symbols-outlined text-xl">shelves</span>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white uppercase tracking-widest">Asignar Ubicación</p>
                                                <p className="text-[8px] text-stone-500 uppercase font-bold">Definir estante y peldaño</p>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setUseStorage(!useStorage)}
                                            className={`w-12 h-6 rounded-full transition-all relative ${useStorage ? 'bg-primary' : 'bg-white/10'}`}
                                        >
                                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${useStorage ? 'right-1' : 'left-1'}`}></div>
                                        </button>
                                    </div>
                                )}

                                {useStorage && decision !== 'REJECTED' && (
                                    <div className="space-y-6 p-6 rounded-[2rem] bg-stone-900/50 border border-primary/10 animate-in slide-in-from-top-4 duration-300">
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">Pasillo / Sector</label>
                                                <input
                                                    type="text"
                                                    placeholder="A, B, SUR..."
                                                    value={aisle}
                                                    onChange={(e) => setAisle(e.target.value.toUpperCase())}
                                                    className="w-full glass-input !h-12 font-black px-4"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">Estante #</label>
                                                    <input
                                                        type="text"
                                                        placeholder="01"
                                                        value={shelf}
                                                        onChange={(e) => setShelf(e.target.value)}
                                                        className="w-full glass-input !h-12 font-black px-4"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest ml-1">Peldaño (Letra)</label>
                                                    <input
                                                        type="text"
                                                        placeholder="A, B, C..."
                                                        value={level}
                                                        onChange={(e) => setLevel(e.target.value.toUpperCase())}
                                                        className="w-full glass-input !h-12 font-black px-4"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">
                                        Observaciones {(decision === 'DETAILS' || decision === 'REJECTED') ? '*' : ''}
                                    </label>
                                    <textarea
                                        required={decision === 'DETAILS' || decision === 'REJECTED'}
                                        rows={3}
                                        placeholder={decision === 'REJECTED' ? "Indicar motivo obligatorio de la devolución..." : "Estado del empaque, probetas, incidencias..."}
                                        value={remarks}
                                        onChange={(e) => setRemarks(e.target.value)}
                                        className={`w-full glass-input p-6 text-[11px] min-h-[100px] ${(decision === 'DETAILS' || decision === 'REJECTED') && !remarks ? 'border-amber-500/30' : ''}`}
                                    />
                                </div>

                                {decision !== 'REJECTED' && selectedInspection.Inventario_Global?.requiere_calidad && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-primary uppercase tracking-widest ml-1 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[12px]">upload_file</span> Certificado de Calidad (PDF)
                                        </label>
                                        <div
                                            onClick={() => document.getElementById('quality-pdf')?.click()}
                                            className={`border-2 border-dashed rounded-[1.5rem] p-6 text-center cursor-pointer transition-all ${pdfFile ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-primary/20 hover:border-primary/40 bg-white/[0.02]'}`}
                                        >
                                            <span className="material-symbols-outlined text-primary mb-2 text-3xl">add_circle</span>
                                            <p className="text-[10px] font-black text-stone-400 uppercase tracking-tight">{pdfFile ? pdfFile.name : 'Vincular Resultado de Laboratorio'}</p>
                                            <input
                                                id="quality-pdf"
                                                type="file"
                                                className="hidden"
                                                accept="application/pdf"
                                                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-4 pt-4 border-t border-white/5">
                                <button
                                    type="submit"
                                    disabled={processingId !== null}
                                    className={`w-full font-black h-16 rounded-2xl text-[11px] uppercase tracking-[0.2em] shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 ${decision === 'REJECTED'
                                            ? 'bg-red-500 text-white shadow-red-500/20 hover:bg-red-600'
                                            : decision === 'DETAILS'
                                                ? 'bg-amber-500 text-black shadow-amber-500/20 hover:bg-amber-600'
                                                : 'bg-primary text-black shadow-primary/20 hover:scale-[1.01]'
                                        }`}
                                >
                                    {processingId ? (
                                        <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                                    ) : (
                                        <>
                                            <span className="material-symbols-outlined">
                                                {decision === 'REJECTED' ? 'assignment_return' : 'how_to_reg'}
                                            </span>
                                            {decision === 'REJECTED' ? 'Confirmar Devolución' : decision === 'DETAILS' ? 'Liberar con Detalles' : 'Liberar e Ingresar'}
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="glass-card rounded-[2.5rem] p-16 text-center border-white/5 bg-white/[0.01] flex flex-col items-center justify-center opacity-60">
                            <div className="w-20 h-20 rounded-full bg-stone-900 border border-white/5 flex items-center justify-center mb-6">
                                <span className="material-symbols-outlined text-4xl text-stone-700">touch_app</span>
                            </div>
                            <h4 className="text-white font-black uppercase tracking-widest text-xs mb-2">Selección de Auditoría</h4>
                            <p className="text-stone-600 text-[10px] font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">Selecciona un lote del listado inferior para procesar su entrada</p>
                        </div>
                    )}
                </div>

                {/* Lista de Inspecciones - AHORA ABAJO */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest text-primary">Staging (Cuarentena)</h3>
                        <span className="text-[9px] font-black text-stone-600 uppercase bg-white/5 px-2 py-1 rounded-full">{inspections.length} LOTES</span>
                    </div>
                    {inspections.length === 0 ? (
                        <div className="glass-card rounded-[2.5rem] p-16 text-center border-dashed border-white/10 text-stone-600 bg-white/[0.01]">
                            No hay materiales en revisión.
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {inspections.map((insp) => (
                                <div
                                    key={insp.id}
                                    onClick={() => {
                                        setSelectedInspection(insp);
                                        window.scrollTo({ top: 0, behavior: 'smooth' });
                                    }}
                                    className={`glass-card rounded-3xl p-6 border transition-all cursor-pointer hover:bg-white/[0.03] active:scale-[0.98] ${selectedInspection?.id === insp.id ? 'border-primary bg-primary/5 shadow-2xl shadow-primary/10' : 'border-white/5 bg-white/[0.01]'}`}
                                >
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center ${selectedInspection?.id === insp.id ? 'bg-primary/20 border-primary/30 text-primary' : 'bg-white/5 border-white/10 text-stone-500'}`}>
                                                <span className="material-symbols-outlined">inventory_2</span>
                                            </div>
                                            <div>
                                                <h4 className="text-white font-black text-sm uppercase leading-tight">{insp.Inventario_Global?.nombre}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-[10px] text-stone-500 uppercase font-bold">Cant: {insp.conteo_fisico} {insp.Inventario_Global?.unidad_medida}</p>
                                                    {insp.Inventario_Global?.requiere_calidad && (
                                                        <span className="text-[7px] font-black bg-primary/20 text-primary border border-primary/20 px-1.5 py-0.5 rounded uppercase flex items-center gap-1">
                                                            <span className="material-symbols-outlined text-[8px]">science</span> REQ. CALIDAD
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-[8px] font-black bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-1 rounded uppercase">Cuarentena</span>
                                            <p className="text-[9px] text-stone-600 font-mono mt-1">{new Date(insp.created_at).toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default QualityGate;
