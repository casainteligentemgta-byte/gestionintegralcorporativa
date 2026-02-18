
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { dataService } from '../services/dataService';

interface EmployeePostulationFormProps {
    context: { projectId: string; companyId: string } | null;
    onNavigate: (view: any) => void;
}

const SectionHeader = ({ icon, title, color = "text-purple-500" }: { icon: string, title: string, color?: string }) => (
    <div className="flex items-center gap-3 mb-6 pt-4 border-t border-white/5 first:border-0 first:pt-0">
        <div className={`w-8 h-8 rounded-lg ${color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
            <span className={`material-symbols-outlined ${color} text-sm`}>{icon}</span>
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">{title}</h3>
    </div>
);

const FormInput = ({ label, value, onChange, placeholder, type = "text", mono = false, required = false }: any) => (
    <div className="space-y-1.5 w-full">
        <label className="text-[10px] text-stone-500 uppercase font-bold px-1">{label} {required && '*'}</label>
        <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className={`w-full glass-input rounded-xl px-4 py-3.5 text-sm ${mono ? 'font-mono' : ''} bg-stone-900 border-white/5`}
            placeholder={placeholder}
        />
    </div>
);

const EmployeePostulationForm: React.FC<EmployeePostulationFormProps> = ({ context, onNavigate }) => {
    const [loading, setLoading] = useState(false);
    const [loadingProject, setLoadingProject] = useState(true);
    const [success, setSuccess] = useState(false);
    const [projectInfo, setProjectInfo] = useState<any>(null);
    const [activeTab, setActiveTab] = useState(0);

    const [catalogPositions, setCatalogPositions] = useState<string[]>([]);
    const [catalogProfessions, setCatalogProfessions] = useState<string[]>([]);
    const [isCustomCargo, setIsCustomCargo] = useState(false);
    const [isCustomProfession, setIsCustomProfession] = useState(false);

    const [formData, setFormData] = useState({
        primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
        cedula_tipo: 'V', cedula_identidad: '', edad: '', estado_civil: 'soltero',
        lugar_nacimiento: '', pais_nacimiento: 'Venezuela', fecha_nacimiento: '',
        nacionalidad: 'Venezolana', celular: '', telefono_habitacion: '',
        email: '', direccion_domicilio: '', inscripcion_ivss: '', es_zurdo: false,
        instruccion_primaria: '', instruccion_secundaria: '', instruccion_tecnica: '',
        instruccion_superior: '', profesion_oficio_actual: '',
        examen_medico_previo: false, examen_efectuado_por: '', tipo_sangre: 'O+',
        enfermedades_padecidas: '', incapacidades_fisicas: '',
        peso: '', estatura: '', talla_camisa: '', talla_pantalon: '',
        talla_bragas: '', medida_botas: '', observaciones_medidas: '',
        cargo_desempenar: ''
    });

    const [dependientes, setDependientes] = useState<any[]>([]);
    const [experiencias, setExperiencias] = useState<any[]>([]);

    useEffect(() => {
        if (context?.projectId) {
            fetchProjectInfo();
        } else {
            setLoadingProject(false);
        }
        fetchCatalogs();
    }, [context]);

    const fetchCatalogs = async () => {
        try {
            const [posRes, profRes] = await Promise.all([
                supabase.from('catalog_positions').select('name').order('name'),
                supabase.from('catalog_professions').select('name').order('name')
            ]);
            if (posRes.data) setCatalogPositions(posRes.data.map(p => p.name));
            if (profRes.data) setCatalogProfessions(profRes.data.map(p => p.name));
        } catch (error) {
            console.error('Error fetching catalogs:', error);
        }
    };

    const handleDateChange = (date: string) => {
        if (!date) return;
        const birthDate = new Date(date);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        setFormData(prev => ({ ...prev, fecha_nacimiento: date, edad: age.toString() }));
    };

    const fetchProjectInfo = async () => {
        try {
            const { data, error } = await supabase
                .from('projects')
                .select('name, owner')
                .eq('id', context?.projectId)
                .single();
            if (data) setProjectInfo(data);
        } catch (error) {
            console.error('Error fetching project info:', error);
        } finally {
            setLoadingProject(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Learning logic: If new cargo/profession, add to catalogs
            if (isCustomCargo && formData.cargo_desempenar) {
                await supabase.from('catalog_positions').insert({ name: formData.cargo_desempenar }).select();
            }
            if (isCustomProfession && formData.profesion_oficio_actual) {
                await supabase.from('catalog_professions').insert({ name: formData.profesion_oficio_actual }).select();
            }

            // Sanitize numeric fields: convert empty strings to null
            const sanitizedData = {
                ...formData,
                peso: formData.peso === '' ? null : parseFloat(formData.peso),
                estatura: formData.estatura === '' ? null : parseFloat(formData.estatura),
                edad: formData.edad === '' ? null : parseInt(formData.edad),
            };

            const { error } = await supabase.from('empleados').insert([{
                ...sanitizedData,
                dependientes,
                experiencias_previas: experiencias,
                status: 'pending_review',
                project_id: context?.projectId || null,
                company_id: context?.companyId || null
            }]);

            if (error) throw error;
            setSuccess(true);
        } catch (error: any) {
            console.error('Error submitting form:', error);
            alert('Error al enviar la planilla: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-8 text-center">
                <div className="w-24 h-24 bg-purple-500/20 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-purple-500 text-5xl">verified</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter mb-4">¡Planilla Recibida!</h1>
                <p className="text-stone-400 text-sm max-w-xs leading-relaxed">
                    Tus datos administrativos han sido registrados para la obra {projectInfo?.name || 'seleccionada'}.
                    Nuestro equipo revisará tu perfil a la brevedad.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-12 text-purple-400 font-black uppercase tracking-widest text-[10px] bg-purple-500/10 px-8 py-4 rounded-xl border border-purple-500/20"
                >
                    Finalizar
                </button>
            </div>
        );
    }

    const tabs = [
        { label: 'Básico', icon: 'person' },
        { label: 'Personal', icon: 'home' },
        { label: 'Salud', icon: 'medical_services' },
        { label: 'Experiencia', icon: 'groups' }
    ];

    return (
        <div className="min-h-screen bg-stone-950 text-stone-200 font-sans">
            {/* Header */}
            <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-stone-900 flex items-center justify-center opacity-20">
                    <span className="material-symbols-outlined text-[10rem]">badge</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 to-transparent"></div>
                <div className="absolute bottom-10 left-6 right-6">
                    <p className="text-purple-500 font-black text-[10px] uppercase tracking-[0.3em] mb-2">Captación Administrativa</p>
                    <h1 className="text-3xl font-black text-white tracking-tighter leading-none">
                        {loadingProject ? 'Cargando...' : (projectInfo?.name || projectInfo?.owner || 'Kore ERP')}
                    </h1>
                </div>
            </div>

            <main className="px-6 pb-24 -mt-6 relative z-10 max-w-2xl mx-auto">
                <div className="flex gap-1.5 mb-6 overflow-x-auto no-scrollbar py-2">
                    {tabs.map((tab, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveTab(i)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border whitespace-nowrap ${activeTab === i
                                ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/20'
                                : 'bg-white/5 border-white/5 text-stone-500'}`}
                        >
                            <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="glass-card rounded-[2.5rem] p-6 lg:p-10 border-white/5 bg-white/[0.02] shadow-2xl">

                        {activeTab === 0 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <SectionHeader icon="id_card" title="I. Identificación" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="Primer Nombre" value={formData.primer_nombre} onChange={(v: any) => setFormData({ ...formData, primer_nombre: v })} required />
                                    <FormInput label="Segundo Nombre" value={formData.segundo_nombre} onChange={(v: any) => setFormData({ ...formData, segundo_nombre: v })} />
                                    <FormInput label="Primer Apellido" value={formData.primer_apellido} onChange={(v: any) => setFormData({ ...formData, primer_apellido: v })} required />
                                    <FormInput label="Segundo Apellido" value={formData.segundo_apellido} onChange={(v: any) => setFormData({ ...formData, segundo_apellido: v })} />
                                </div>
                                <div className="space-y-6">
                                    <div className="space-y-1.5 w-full">
                                        <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Cédula de Identidad *</label>
                                        <div className="flex gap-2">
                                            <select
                                                value={formData.cedula_tipo}
                                                onChange={(e) => setFormData({ ...formData, cedula_tipo: e.target.value })}
                                                className="w-20 glass-input rounded-xl px-2 py-3.5 text-sm bg-stone-900 border-white/5 font-black text-center"
                                            >
                                                <option value="V">V</option>
                                                <option value="E">E</option>
                                            </select>
                                            <input
                                                type="text"
                                                value={formData.cedula_identidad}
                                                onChange={(e) => setFormData({ ...formData, cedula_identidad: e.target.value })}
                                                required
                                                className="flex-1 glass-input rounded-xl px-4 py-3.5 text-sm font-mono bg-stone-900 border-white/5"
                                                placeholder="Ej: 12345678"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-1.5 w-full">
                                            <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Fecha Nacimiento *</label>
                                            <input
                                                type="date"
                                                required
                                                value={formData.fecha_nacimiento}
                                                onChange={(e) => handleDateChange(e.target.value)}
                                                className="w-full glass-input rounded-xl px-2 py-3.5 text-xs bg-stone-900 border-white/5 font-mono"
                                            />
                                        </div>
                                        <div className="space-y-1.5 w-full">
                                            <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Edad</label>
                                            <input
                                                type="number"
                                                readOnly
                                                value={formData.edad}
                                                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-800/50 border-white/5 text-purple-400 font-black cursor-not-allowed"
                                                placeholder="--"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Cargo al que aspira *</label>
                                        {!isCustomCargo ? (
                                            <select
                                                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5"
                                                value={formData.cargo_desempenar}
                                                onChange={(e) => {
                                                    if (e.target.value === 'OTRO') {
                                                        setIsCustomCargo(true);
                                                        setFormData({ ...formData, cargo_desempenar: '' });
                                                    } else {
                                                        setFormData({ ...formData, cargo_desempenar: e.target.value });
                                                    }
                                                }}
                                                required
                                            >
                                                <option value="">Seleccione un cargo...</option>
                                                {catalogPositions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                <option value="OTRO">+ Agregar nuevo cargo...</option>
                                            </select>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5 border-purple-500/30"
                                                    placeholder="Escriba el nuevo cargo..."
                                                    value={formData.cargo_desempenar}
                                                    onChange={(e) => setFormData({ ...formData, cargo_desempenar: e.target.value })}
                                                    autoFocus
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsCustomCargo(false); setFormData({ ...formData, cargo_desempenar: '' }); }}
                                                    className="px-4 rounded-xl bg-white/5 text-[9px] font-bold uppercase tracking-widest text-stone-500"
                                                >
                                                    Lista
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Estado Civil</label>
                                        <select value={formData.estado_civil} onChange={(e) => setFormData({ ...formData, estado_civil: e.target.value })} className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5">
                                            <option value="soltero">Soltero/a</option>
                                            <option value="casado">Casado/a</option>
                                            <option value="divorciado">Divorciado/a</option>
                                            <option value="viudo">Viudo/a</option>
                                            <option value="concubinato">Concubinato</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Nacionalidad</label>
                                        <input className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5" value={formData.nacionalidad} onChange={(e) => setFormData({ ...formData, nacionalidad: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 1 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <SectionHeader icon="contact_page" title="II. Datos Personales" />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormInput label="Celular" type="tel" value={formData.celular} onChange={(v: any) => setFormData({ ...formData, celular: v })} required mono />
                                    <FormInput label="Correo Electrónico" type="email" value={formData.email} onChange={(v: any) => setFormData({ ...formData, email: v })} required />
                                </div>
                                <FormInput label="Dirección de Domicilio" value={formData.direccion_domicilio} onChange={(v: any) => setFormData({ ...formData, direccion_domicilio: v })} />

                                <SectionHeader icon="school" title="Nivel de Instrucción" color="text-emerald-400" />
                                <div className="grid grid-cols-1 gap-4">
                                    <FormInput label="Educación Superior / Título" placeholder="Ej: Especialización en Gerencia..." value={formData.instruccion_superior} onChange={(v: any) => setFormData({ ...formData, instruccion_superior: v })} />
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Profesión u Oficio Actual *</label>
                                        {!isCustomProfession ? (
                                            <select
                                                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5"
                                                value={formData.profesion_oficio_actual}
                                                onChange={(e) => {
                                                    if (e.target.value === 'OTRO') {
                                                        setIsCustomProfession(true);
                                                        setFormData({ ...formData, profesion_oficio_actual: '' });
                                                    } else {
                                                        setFormData({ ...formData, profesion_oficio_actual: e.target.value });
                                                    }
                                                }}
                                                required
                                            >
                                                <option value="">Seleccione su profesión...</option>
                                                {catalogProfessions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                <option value="OTRO">+ Agregar nueva profesión...</option>
                                            </select>
                                        ) : (
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5 border-purple-500/30"
                                                    placeholder="Escriba su profesión..."
                                                    value={formData.profesion_oficio_actual}
                                                    onChange={(e) => setFormData({ ...formData, profesion_oficio_actual: e.target.value })}
                                                    autoFocus
                                                    required
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => { setIsCustomProfession(false); setFormData({ ...formData, profesion_oficio_actual: '' }); }}
                                                    className="px-4 rounded-xl bg-white/5 text-[9px] font-bold uppercase tracking-widest text-stone-500"
                                                >
                                                    Lista
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 2 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <SectionHeader icon="medical_information" title="III. Datos de Salud" color="text-rose-400" />
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Tipo Sangre</label>
                                        <select value={formData.tipo_sangre} onChange={(e) => setFormData({ ...formData, tipo_sangre: e.target.value })} className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5">
                                            {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <FormInput label="Peso (Kg)" value={formData.peso} onChange={(v: any) => setFormData({ ...formData, peso: v })} mono />
                                    <FormInput label="Estatura (cm)" value={formData.estatura} onChange={(v: any) => setFormData({ ...formData, estatura: v })} mono />
                                </div>
                                <FormInput label="Enfermedades Padecidas" value={formData.enfermedades_padecidas} onChange={(v: any) => setFormData({ ...formData, enfermedades_padecidas: v })} />
                                <FormInput label="Incapacidades Físicas" value={formData.incapacidades_fisicas} onChange={(v: any) => setFormData({ ...formData, incapacidades_fisicas: v })} />

                                <SectionHeader icon="straighten" title="Tallas y Medidas" color="text-blue-400" />
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <FormInput label="Camisa" value={formData.talla_camisa} onChange={(v: any) => setFormData({ ...formData, talla_camisa: v })} />
                                    <FormInput label="Pantalón" value={formData.talla_pantalon} onChange={(v: any) => setFormData({ ...formData, talla_pantalon: v })} />
                                    <FormInput label="Calzado" value={formData.medida_botas} onChange={(v: any) => setFormData({ ...formData, medida_botas: v })} />
                                    <FormInput label="Braga" value={formData.talla_bragas} onChange={(v: any) => setFormData({ ...formData, talla_bragas: v })} />
                                </div>
                            </div>
                        )}

                        {activeTab === 3 && (
                            <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                                <SectionHeader icon="work_history" title="IV. Experiencia y Familia" color="text-amber-400" />

                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50">Experiencia Laboral (Últimas 2)</h4>
                                        <button type="button" onClick={() => setExperiencias([...experiencias, { empresa: '', cargo: '', duracion: '' }])} disabled={experiencias.length >= 2} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center disabled:opacity-20">
                                            <span className="material-symbols-outlined text-sm">add</span>
                                        </button>
                                    </div>
                                    {experiencias.map((exp, i) => (
                                        <div key={i} className="space-y-3 p-4 bg-stone-900/50 rounded-2xl border border-white/5">
                                            <input placeholder="Empresa" className="w-full bg-transparent border-b border-white/10 py-2 text-sm outline-none focus:border-purple-500" value={exp.empresa} onChange={e => {
                                                const ne = [...experiencias]; ne[i].empresa = e.target.value; setExperiencias(ne);
                                            }} />
                                            <div className="flex gap-4">
                                                <input placeholder="Cargo" className="flex-1 bg-transparent border-b border-white/10 py-2 text-sm outline-none focus:border-purple-500" value={exp.cargo} onChange={e => {
                                                    const ne = [...experiencias]; ne[i].cargo = e.target.value; setExperiencias(ne);
                                                }} />
                                                <input placeholder="Duración" className="w-24 bg-transparent border-b border-white/10 py-2 text-sm outline-none focus:border-purple-500" value={exp.duracion} onChange={e => {
                                                    const ne = [...experiencias]; ne[i].duracion = e.target.value; setExperiencias(ne);
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-white/50">Cargas Familiares</h4>
                                        <button type="button" onClick={() => setDependientes([...dependientes, { nombre: '', parentesco: '', fecha_nacimiento: '' }])} disabled={dependientes.length >= 5} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center disabled:opacity-20">
                                            <span className="material-symbols-outlined text-sm">add</span>
                                        </button>
                                    </div>
                                    {dependientes.map((d, i) => (
                                        <div key={i} className="space-y-3 p-4 bg-stone-900/50 rounded-2xl border border-white/5">
                                            <input placeholder="Nombre Completo" className="w-full bg-transparent border-b border-white/10 py-2 text-sm outline-none focus:border-purple-500" value={d.nombre} onChange={e => {
                                                const nd = [...dependientes]; nd[i].nombre = e.target.value; setDependientes(nd);
                                            }} />
                                            <div className="flex gap-4">
                                                <input placeholder="Parentesco" className="flex-1 bg-transparent border-b border-white/10 py-2 text-sm outline-none focus:border-purple-500" value={d.parentesco} onChange={e => {
                                                    const nd = [...dependientes]; nd[i].parentesco = e.target.value; setDependientes(nd);
                                                }} />
                                                <input type="date" className="w-32 bg-transparent border-b border-white/10 py-2 text-xs outline-none focus:border-purple-500" value={d.fecha_nacimiento} onChange={e => {
                                                    const nd = [...dependientes]; nd[i].fecha_nacimiento = e.target.value; setDependientes(nd);
                                                }} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mt-10 flex flex-col gap-4">
                            {activeTab < tabs.length - 1 ? (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab(activeTab + 1)}
                                    className="w-full bg-stone-100 text-stone-900 h-16 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 hover:bg-white transition-all active:scale-95"
                                >
                                    Siguiente Paso
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-purple-600 text-white h-20 rounded-3xl font-black uppercase tracking-[0.2em] text-[12px] shadow-2xl shadow-purple-600/30 flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-50"
                                >
                                    {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-symbols-outlined">send</span>Finalizar y Enviar Datos</>}
                                </button>
                            )}

                            {activeTab > 0 && (
                                <button
                                    type="button"
                                    onClick={() => setActiveTab(activeTab - 1)}
                                    className="w-full h-12 text-stone-500 font-bold uppercase tracking-widest text-[9px] hover:text-white transition-colors"
                                >
                                    Volver al paso anterior
                                </button>
                            )}
                        </div>
                    </div>

                    <p className="text-center text-[9px] text-stone-600 uppercase font-black tracking-[0.2em] leading-relaxed px-10">
                        La información aquí suministrada será validada por el departamento de recursos humanos.
                    </p>
                </form>
            </main>
        </div>
    );
};

export default EmployeePostulationForm;
