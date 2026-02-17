
import React, { useState, useEffect } from 'react';
import { dataService } from '../services/dataService';
import { supabase } from '../services/supabase';

interface CompanyDossierProps {
    company: any;
    onNavigate: (view: any) => void;
}

const CompanyDossier: React.FC<CompanyDossierProps> = ({ company, onNavigate }) => {
    const [documents, setDocuments] = useState<any[]>(company.documentation || []);
    const [uploading, setUploading] = useState(false);
    const [newDocTitle, setNewDocTitle] = useState('');
    const [isAddingOther, setIsAddingOther] = useState(false);

    // Initial Doc Types
    const docTypes = [
        { id: 'rif', label: 'R.I.F. Vigente', icon: 'badge' },
        { id: 'acta', label: 'Acta Constitutiva / Asamblea', icon: 'gavel' },
        { id: 'rnc', label: 'Registro Nacional de Contratistas (RNC)', icon: 'history_edu' },
        { id: 'solvencia_ivss', label: 'Solvencia IVSS', icon: 'verified' },
        { id: 'solvencia_inces', label: 'Solvencia INCES', icon: 'verified' }
    ];

    const handleUpload = async (file: File, label: string) => {
        setUploading(true);
        try {
            const filePath = `expedientes/${company.id}/${Date.now()}-${file.name}`;
            const publicUrl = await dataService.uploadFile('inventory-assets', filePath, file);

            // AUTO-EXTRACT DATE LOGIC (Placeholder for AI)
            // For now, setting default expiration to 1 year from now
            const defaultExpiration = new Date();
            defaultExpiration.setFullYear(defaultExpiration.getFullYear() + 1);
            const expirationDate = defaultExpiration.toISOString().split('T')[0];

            const newDoc = {
                name: label,
                url: publicUrl,
                date: new Date().toISOString(),
                expiration: expirationDate
            };

            const updatedDocs = [...documents, newDoc];

            // Update company in database
            const { error } = await supabase
                .from('companies')
                .update({ documentation: updatedDocs })
                .eq('id', company.id);

            if (error) throw error;

            setDocuments(updatedDocs);
            setNewDocTitle('');
            setIsAddingOther(false);
            alert('Documento guardado exitosamente. Fecha de vencimiento estimada asignada.');
        } catch (error: any) {
            console.error('Upload error:', error);
            alert('Error al subir documento: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (indexToDelete: number) => {
        if (!window.confirm('¿Estás seguro de eliminar este documento?')) return;

        const updatedDocs = documents.filter((_, index) => index !== indexToDelete);

        try {
            const { error } = await supabase
                .from('companies')
                .update({ documentation: updatedDocs })
                .eq('id', company.id);

            if (error) throw error;
            setDocuments(updatedDocs);
        } catch (error: any) {
            alert('Error al eliminar: ' + error.message);
        }
    };

    const handleDateChange = async (index: number, newDate: string) => {
        const updatedDocs = [...documents];
        updatedDocs[index].expiration = newDate;
        setDocuments(updatedDocs);

        // Debounced save or save on blur could be better, but saving directly for simplicity
        try {
            await supabase
                .from('companies')
                .update({ documentation: updatedDocs })
                .eq('id', company.id);
        } catch (error) {
            console.error('Error updating date:', error);
        }
    };

    return (
        <div className="min-h-screen bg-stone-950 p-6 space-y-8 animate-in slide-in-from-right duration-500">
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onNavigate('COMPANIES')}
                        className="h-10 w-10 flex items-center justify-center rounded-apple bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-stone-400">arrow_back</span>
                    </button>
                    <div>
                        <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em] mb-1">Expediente Legal</p>
                        <h1 className="text-2xl font-black text-white tracking-tighter">{company.name}</h1>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Upload Section */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest px-2 mb-4">Carga de Documentos</h3>
                        <div className="space-y-3">
                            {docTypes.map(doc => (
                                <div key={doc.id} className="relative group">
                                    <div className="glass-card rounded-2xl p-4 border-white/5 bg-white/[0.01] flex items-center justify-between hover:bg-white/[0.03] transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500">
                                                <span className="material-symbols-outlined text-xl">{doc.icon}</span>
                                            </div>
                                            <div>
                                                <p className="text-xs font-bold text-stone-200">{doc.label}</p>
                                                <p className="text-[9px] text-stone-500 font-medium uppercase tracking-wider mt-0.5">Requerido</p>
                                            </div>
                                        </div>
                                        <label className="cursor-pointer h-9 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-stone-300 text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all">
                                            <span className="material-symbols-outlined text-base">upload_file</span>
                                            <span className="group-hover:text-white">Cargar</span>
                                            <input
                                                type="file"
                                                className="hidden"
                                                accept=".pdf,.png,.jpg,.jpeg"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) handleUpload(file, doc.label);
                                                }}
                                            />
                                        </label>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Dynamic Document Adder */}
                    <div className="pt-6 border-t border-white/5">
                        {!isAddingOther ? (
                            <button
                                onClick={() => setIsAddingOther(true)}
                                className="w-full h-12 rounded-2xl border border-dashed border-white/10 flex items-center justify-center gap-2 text-stone-400 hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all group"
                            >
                                <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">add_circle</span>
                                <span className="text-[10px] font-black uppercase tracking-widest">Agregar otro documento</span>
                            </button>
                        ) : (
                            <div className="glass-card rounded-2xl p-4 border-primary/20 bg-primary/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-primary uppercase tracking-widest ml-1">Título del Documento</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Solvencia Laboral, Contrato, etc."
                                        className="w-full bg-stone-900 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:ring-1 focus:ring-primary/50 placeholder:text-white/20"
                                        value={newDocTitle}
                                        onChange={(e) => setNewDocTitle(e.target.value)}
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <label className="flex-1 cursor-pointer h-10 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20">
                                        <span className="material-symbols-outlined text-lg">upload</span>
                                        Subir Archivo
                                        <input
                                            type="file"
                                            className="hidden"
                                            disabled={!newDocTitle.trim()}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file && newDocTitle.trim()) handleUpload(file, newDocTitle);
                                            }}
                                        />
                                    </label>
                                    <button
                                        onClick={() => {
                                            setIsAddingOther(false);
                                            setNewDocTitle('');
                                        }}
                                        className="h-10 px-4 bg-white/5 text-stone-400 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 hover:text-white transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Archive / List Section */}
                <div>
                    <h3 className="text-xs font-bold text-stone-500 uppercase tracking-widest px-2 mb-4">Expediente Digital</h3>
                    <div className="space-y-3">
                        {documents.length > 0 ? (
                            documents.map((doc, index) => (
                                <div key={index} className="glass-card rounded-2xl p-4 border-white/5 bg-white/[0.01] group hover:bg-white/[0.02] transition-colors relative">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-500 mt-1">
                                                <span className="material-symbols-outlined text-xl">description</span>
                                            </div>
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-stone-200 leading-tight">{doc.name}</p>
                                                <p className="text-[10px] text-stone-500 font-mono">Cargado: {new Date(doc.date).toLocaleDateString()}</p>

                                                {/* Expiration Date Field */}
                                                <div className="flex items-center gap-2 mt-2">
                                                    <span className="text-[9px] font-bold text-stone-500 uppercase tracking-wider">Vence:</span>
                                                    <input
                                                        type="date"
                                                        value={doc.expiration || ''}
                                                        onChange={(e) => handleDateChange(index, e.target.value)}
                                                        className="bg-transparent text-[10px] text-stone-300 font-mono border border-white/10 rounded px-2 py-0.5 focus:border-primary/50 outline-none w-28"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2">
                                            <a
                                                href={doc.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 text-stone-400 hover:bg-blue-500 hover:text-white hover:scale-110 transition-all"
                                                title="Ver Documento"
                                            >
                                                <span className="material-symbols-outlined text-lg">visibility</span>
                                            </a>
                                            <button
                                                onClick={() => handleDelete(index)}
                                                className="h-8 w-8 flex items-center justify-center rounded-lg bg-white/5 text-stone-400 hover:bg-red-500 hover:text-white hover:scale-110 transition-all"
                                                title="Eliminar Documento"
                                            >
                                                <span className="material-symbols-outlined text-lg">delete</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="glass-card rounded-2xl border-dashed border-white/10 p-12 flex flex-col items-center justify-center text-center opacity-30">
                                <span className="material-symbols-outlined text-5xl mb-4">folder_off</span>
                                <p className="text-[10px] font-bold uppercase tracking-widest">Sin documentos registrados</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {uploading && (
                <div className="fixed inset-0 z-50 bg-stone-950/80 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
                    <div className="flex flex-col items-center gap-6">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-primary/30 rounded-full animate-spin"></div>
                            <div className="w-16 h-16 border-4 border-t-primary rounded-full animate-spin absolute inset-0"></div>
                        </div>
                        <div className="text-center space-y-2">
                            <p className="text-sm font-black text-white uppercase tracking-[0.2em]">Procesando Archivo</p>
                            <p className="text-[10px] text-stone-400 font-medium">Extrayendo metadatos...</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDossier;
