
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { SPECIALTIES } from '../constants';

interface HiringReviewProps {
    worker: any;
    onNavigate: (view: any, data?: any) => void;
}

const HiringReview: React.FC<HiringReviewProps> = ({ worker, onNavigate }) => {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string | null>(null);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    const [workerData, setWorkerData] = useState({
        ...worker,
        status: worker.status || 'PENDING_REVIEW',
        hiring_data_json: {
            cargo: worker.hiring_data_json?.cargo || worker.specialty || '',
            salario: worker.hiring_data_json?.salario || 0,
            monto_cestaticket: worker.hiring_data_json?.monto_cestaticket || 0,
            fecha_ingreso: worker.hiring_data_json?.fecha_ingreso || new Date().toISOString().split('T')[0],
            tipo_contrato: worker.hiring_data_json?.tipo_contrato || 'TIEMPO_DETERMINADO',
            proyecto_id: worker.current_project_id || worker.hiring_data_json?.proyecto_id || '',
            forma_pago: worker.hiring_data_json?.forma_pago || 'TRANSFERENCIA',
            lugar_pago: worker.hiring_data_json?.lugar_pago || 'EN OBRA',
            jornada_trabajo: worker.hiring_data_json?.jornada_trabajo || 'DIURNA',
            lugar_prestacion_servicio: worker.hiring_data_json?.lugar_prestacion_servicio || '',
            objeto_contrato: worker.hiring_data_json?.objeto_contrato || 'SERVICIOS DE CONSTRUCCIÓN',
            numero_contrato: worker.hiring_data_json?.numero_contrato || '',
            fecha_contrato: worker.hiring_data_json?.fecha_contrato || new Date().toISOString().split('T')[0],
        },
        sizes_json: worker.sizes_json || { shirt: '', pants: '', boots: '' },
        medical_json: worker.medical_json || { bloodType: 'O+' }
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            // Fetch projects
            const { data: projData } = await supabase.from('projects').select('id, name');
            setProjects(projData || []);

            // Fetch user role and email
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email || null);
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('user_id', user.id)
                    .single();
                setUserRole(profile?.role || null);
            }
        };
        fetchInitialData();
    }, []);

    const isAuthorizedToChangeCargo =
        ['admin', 'gerente', 'rrhh', 'super_admin'].includes((userRole || '').toLowerCase()) ||
        userEmail === 'casainteligentemgta@gmail.com';

    const handleUpdateField = (section: string, field: string, value: any) => {
        if (section === 'root') {
            setWorkerData(prev => ({ ...prev, [field]: value }));
        } else if (section === 'hiring') {
            setWorkerData(prev => ({
                ...prev,
                hiring_data_json: { ...prev.hiring_data_json, [field]: value }
            }));
        } else if (section === 'sizes') {
            setWorkerData(prev => ({
                ...prev,
                sizes_json: { ...prev.sizes_json, [field]: value }
            }));
        } else if (section === 'medical') {
            setWorkerData(prev => ({
                ...prev,
                medical_json: { ...prev.medical_json, [field]: value }
            }));
        }
    };

    const generateNextContract = async () => {
        if (!workerData.hiring_data_json.proyecto_id) return alert('Seleccione un proyecto primero');
        const { count } = await supabase.from('workers').select('*', { count: 'exact', head: true }).eq('current_project_id', workerData.hiring_data_json.proyecto_id);
        const proj = projects.find(p => p.id === workerData.hiring_data_json.proyecto_id);
        const prefix = proj?.name?.substring(0, 3).toUpperCase() || 'CTR';
        const num = (count || 0) + 1;
        const year = new Date().getFullYear();
        handleUpdateField('hiring', 'numero_contrato', `${prefix}-${year}-${num.toString().padStart(4, '0')}`);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('workers').update({
                status: workerData.status === 'PENDING_REVIEW' ? 'ACTIVE' : workerData.status,
                current_project_id: workerData.hiring_data_json.proyecto_id,
                specialty: workerData.hiring_data_json.cargo,
                hiring_data_json: workerData.hiring_data_json,
                sizes_json: workerData.sizes_json,
                medical_json: workerData.medical_json,
                email: workerData.email || worker.email,
                cell_phone: workerData.cell_phone || worker.cell_phone
            }).eq('id', worker.id);
            if (error) throw error;
            alert('¡Expediente actualizado!');
            onNavigate('WORKERS');
        } catch (err: any) {
            alert(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-stone-950 p-4 md:p-8 pb-32">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <header className="flex items-center gap-6 mb-12">
                    <button onClick={() => onNavigate('WORKERS')} className="w-12 h-12 rounded-2xl glass-card flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 shrink-0">
                        <span className="material-symbols-outlined text-stone-400">arrow_back</span>
                    </button>
                    <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Onboarding Station</span>
                        <h1 className="text-3xl font-black text-white uppercase tracking-tighter">Formalización</h1>
                    </div>
                </header>

                <form onSubmit={handleSave} className="space-y-8">
                    {/* Worker Identity Card */}
                    <div className="glass-card rounded-[2.5rem] p-8 border-white/5 bg-white/[0.01] flex flex-col items-center text-center">
                        <img
                            src={workerData.photo || `https://ui-avatars.com/api/?name=${workerData.first_name}+${workerData.first_surname}&background=random`}
                            className="w-32 h-32 rounded-3xl border-4 border-stone-900 object-cover shadow-2xl mb-4"
                            alt="Worker"
                        />
                        <h2 className="text-xl font-black text-white uppercase">{workerData.first_name} {workerData.first_surname}</h2>
                        <p className="text-[10px] font-mono text-stone-500 uppercase tracking-widest">{workerData.id_type}-{workerData.id_number}</p>
                    </div>

                    {/* Main Form Fields - All Stacked Vertically */}
                    <div className="glass-card rounded-[2.5rem] p-8 md:p-10 border-white/5 bg-white/[0.01] shadow-2xl space-y-8">
                        <SectionHeader icon="gavel" title="Datos Contractuales" />

                        <div className="space-y-6">
                            <FormGroup label="Obra / Proyecto Destino">
                                <select required value={workerData.hiring_data_json.proyecto_id} onChange={e => handleUpdateField('hiring', 'proyecto_id', e.target.value)} className="glass-input !h-14 font-black text-primary">
                                    <option value="">Seleccione el Proyecto</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </FormGroup>

                            <FormGroup label="Cargo u Oficio">
                                <select
                                    disabled={!isAuthorizedToChangeCargo}
                                    value={workerData.hiring_data_json.cargo}
                                    onChange={e => handleUpdateField('hiring', 'cargo', e.target.value)}
                                    className={`glass-input !h-14 uppercase font-bold ${!isAuthorizedToChangeCargo ? 'opacity-50 cursor-not-allowed' : 'border-primary/30'}`}
                                >
                                    <option value="">Seleccione Cargo...</option>
                                    {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                                {!isAuthorizedToChangeCargo && <p className="text-[8px] text-amber-500/70 mt-1 uppercase font-bold italic">* Solo administradores pueden modificar el cargo en esta fase</p>}
                            </FormGroup>

                            <FormGroup label="Salario Básico ($)">
                                <input required type="number" step="0.01" value={workerData.hiring_data_json.salario} onChange={e => handleUpdateField('hiring', 'salario', parseFloat(e.target.value))} className="glass-input !h-14 text-emerald-400 font-black text-xl" />
                            </FormGroup>

                            <FormGroup label="Fecha Firma">
                                <input type="date" value={workerData.hiring_data_json.fecha_contrato} onChange={e => handleUpdateField('hiring', 'fecha_contrato', e.target.value)} className="glass-input !h-14 font-mono" />
                            </FormGroup>

                            <FormGroup label="Fecha Ingreso">
                                <input required type="date" value={workerData.hiring_data_json.fecha_ingreso} onChange={e => handleUpdateField('hiring', 'fecha_ingreso', e.target.value)} className="glass-input !h-14 font-mono shadow-inner border border-primary/20" />
                            </FormGroup>

                            <FormGroup label="Forma de Pago">
                                <select value={workerData.hiring_data_json.forma_pago} onChange={e => handleUpdateField('hiring', 'forma_pago', e.target.value)} className="glass-input !h-14">
                                    <option value="TRANSFERENCIA">Transferencia</option>
                                    <option value="EFECTIVO">Efectivo</option>
                                </select>
                            </FormGroup>

                            <FormGroup label="Lugar de Pago">
                                <input value={workerData.hiring_data_json.lugar_pago} onChange={e => handleUpdateField('hiring', 'lugar_pago', e.target.value)} className="glass-input !h-14 uppercase" placeholder="Ej: En Obra, Oficina Central..." />
                            </FormGroup>

                            <FormGroup label="Lugar de Prestación del Servicio">
                                <input value={workerData.hiring_data_json.lugar_prestacion_servicio} onChange={e => handleUpdateField('hiring', 'lugar_prestacion_servicio', e.target.value)} className="glass-input !h-14 uppercase" placeholder="Dirección de la Obra..." />
                            </FormGroup>

                            <FormGroup label="Jornada">
                                <select value={workerData.hiring_data_json.jornada_trabajo} onChange={e => handleUpdateField('hiring', 'jornada_trabajo', e.target.value)} className="glass-input !h-14 uppercase">
                                    <option value="DIURNA">Diurna</option>
                                    <option value="MIXTA">Mixta</option>
                                    <option value="NOCTURNA">Nocturna</option>
                                </select>
                            </FormGroup>

                            <FormGroup label="Tipo de Contrato">
                                <select value={workerData.hiring_data_json.tipo_contrato} onChange={e => handleUpdateField('hiring', 'tipo_contrato', e.target.value)} className="glass-input !h-14">
                                    <option value="TIEMPO_DETERMINADO">Tiempo Determinado</option>
                                    <option value="TIEMPO_INDETERMINADO">Tiempo Indeterminado</option>
                                    <option value="OBRA_DETERMINADA">Obra Determinada</option>
                                </select>
                            </FormGroup>

                            <FormGroup label="Objeto del Contrato">
                                <textarea value={workerData.hiring_data_json.objeto_contrato} onChange={e => handleUpdateField('hiring', 'objeto_contrato', e.target.value)} className="glass-input min-h-[100px] py-4" placeholder="Definición de las labores..." />
                            </FormGroup>

                            <div className="space-y-1.5 pt-4 border-t border-white/5">
                                <label className="text-[10px] text-slate-500 uppercase font-black px-1 tracking-widest">Nro de Contrato</label>
                                <div className="flex gap-2">
                                    <input required value={workerData.hiring_data_json.numero_contrato} onChange={e => handleUpdateField('hiring', 'numero_contrato', e.target.value)} className="flex-1 glass-input !h-14 font-mono uppercase" />
                                    <button type="button" onClick={generateNextContract} className="w-14 h-14 bg-primary text-black rounded-2xl flex items-center justify-center hover:scale-105 transition-all">
                                        <span className="material-symbols-outlined">auto_fix</span>
                                    </button>
                                </div>
                            </div>

                            <FormGroup label="Estatus Postulación">
                                <select value={workerData.status} onChange={e => handleUpdateField('root', 'status', e.target.value)} className="glass-input !h-14 font-black tracking-widest uppercase border-amber-500/20 bg-amber-500/5">
                                    <option value="PENDING_REVIEW">En Revisión</option>
                                    <option value="ACTIVE">Activo / Aprobado</option>
                                    <option value="REJECTED">Rechazado</option>
                                </select>
                            </FormGroup>
                        </div>
                    </div>



                    {/* Final Action Buttons */}
                    <div className="flex flex-col gap-4 pt-6">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-16 bg-primary text-black font-black uppercase tracking-[0.3em] text-[10px] rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all active:scale-95 flex items-center justify-center gap-3"
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></div>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">how_to_reg</span>
                                    Finalizar Registro
                                </>
                            )}
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => onNavigate('WORKERS')}
                            className="w-full h-14 bg-white/5 text-stone-400 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/5 hover:bg-white/10 transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const SectionHeader = ({ icon, title }: { icon: string, title: string }) => (
    <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <span className="material-symbols-outlined text-xl">{icon}</span>
        </div>
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-white">
            {title}
        </h3>
    </div>
);

const FormGroup = ({ label, children }: { label: string, children: React.ReactNode }) => (
    <div className="space-y-1.5 flex flex-col">
        <label className="text-[9px] font-bold text-slate-500 uppercase tracking-[0.1em] ml-1">{label}</label>
        {children}
    </div>
);

export default HiringReview;
