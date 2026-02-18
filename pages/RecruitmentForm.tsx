
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import { dataService } from '../services/dataService';
import { COUNTRIES, NATIONALITIES, SPECIALTIES } from '../constants';

interface RecruitmentFormProps {
    context: { projectId: string; companyId: string; type: 'WORKER' | 'EMPLOYEE' } | null;
    onNavigate: (view: any) => void;
}

const SectionHeader = ({ icon, title, color = "text-primary" }: { icon: string, title: string, color?: string }) => (
    <div className="flex items-center gap-3 mb-6 pt-4 border-t border-white/5 first:border-0 first:pt-0">
        <div className={`w-8 h-8 rounded-lg ${color.replace('text-', 'bg-')}/10 flex items-center justify-center`}>
            <span className={`material-symbols-outlined ${color} text-sm`}>{icon}</span>
        </div>
        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-white/70">{title}</h3>
    </div>
);

const KoreDateInput = ({ label, value, onChange, required }: { label: string, value: string, onChange: (v: string) => void, required?: boolean }) => {
    return (
        <div className="space-y-1.5 w-full">
            <label className="text-[10px] text-stone-500 uppercase font-bold px-1">{label} {required && '*'}</label>
            <input
                type="date"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm font-mono appearance-none bg-stone-900 border-white/5 text-stone-200"
                required={required}
            />
        </div>
    );
};

const FormInput = ({ label, name, value, onChange, placeholder, type = "text", mono = false, required = false }: any) => (
    <div className="space-y-1.5 w-full">
        <label className="text-[10px] text-stone-500 uppercase font-bold px-1">{label} {required && '*'}</label>
        <input
            type={type}
            name={name}
            value={value}
            onChange={onChange}
            required={required}
            className={`w-full glass-input rounded-xl px-4 py-3.5 text-sm ${mono ? 'font-mono' : ''} bg-stone-900 border-white/5`}
            placeholder={placeholder}
        />
    </div>
);

const RecruitmentForm: React.FC<RecruitmentFormProps> = ({ context, onNavigate }) => {
    const [loading, setLoading] = useState(false);
    const [loadingProject, setLoadingProject] = useState(true);
    const [verifying, setVerifying] = useState(false);
    const [success, setSuccess] = useState(false);
    const [projectInfo, setProjectInfo] = useState<any>(null);
    const [formData, setFormData] = useState({
        // Identity
        idType: 'V', idNumber: '', firstName: '', secondName: '', firstSurname: '', secondSurname: '',
        dob: '', civilStatus: '', birthPlace: '', birthCountry: 'Venezuela', nationality: 'Venezolano/a',
        email: '', cellPhone: '', homePhone: '', address: '', ivss: false, leftHanded: false,
        photo: '', idPhoto: '', specialty: '',

        // Complex Sections (Matches WorkerForm/DB JSONB)
        criminalRecords: { hasRecords: false, issuedBy: '', place: '', date: '' },
        education: { canRead: true, primary: '', secondary: '', technical: '', superior: '', currentProfession: '' },
        union: { federation: '', position: '' },
        medical: { hasExam: false, performedBy: '', bloodType: '', diseases: '', incapacities: '' },
        sizes: { weight: '', stature: '', shirt: '', pants: '', overalls: '', boots: '', observations: '' },
        dependents: [] as any[],
        experience: [] as any[]
    });

    useEffect(() => {
        if (context?.projectId) {
            console.log("📍 Recruitment Context Detected:", context);
            fetchProjectInfo();
        } else {
            setLoadingProject(false);
        }
    }, [context]);

    const fetchProjectInfo = async () => {
        if (!context?.projectId) {
            setLoadingProject(false);
            return;
        }

        try {
            setLoadingProject(true);
            console.log("🔍 Fetching Project ID:", context.projectId);

            const { data, error } = await supabase
                .from('projects')
                .select('name, owner')
                .eq('id', context.projectId)
                .single();

            if (error) {
                console.error('❌ Supabase Error:', error);
                throw error;
            }

            if (data) {
                console.log("✅ Project Found:", data);
                setProjectInfo(data);
            } else {
                console.warn("⚠️ No project found with ID:", context.projectId);
            }
        } catch (error: any) {
            console.error('❌ Error in fetchProjectInfo:', error.message);
        } finally {
            setLoadingProject(false);
        }
    };

    const handleNestedChange = (path: string, value: any) => {
        const keys = path.split('.');
        if (keys.length === 1) {
            setFormData(prev => ({ ...prev, [path]: value }));
        } else {
            setFormData(prev => ({
                ...prev,
                [keys[0]]: { ...(prev as any)[keys[0]], [keys[1]]: value }
            }));
        }
    };

    const addDependent = () => {
        if (formData.dependents.length < 5) {
            setFormData(prev => ({
                ...prev,
                dependents: [...prev.dependents, { fullName: '', relationship: '', dob: '' }]
            }));
        }
    };

    const addExperience = () => {
        if (formData.experience.length < 2) {
            setFormData(prev => ({
                ...prev,
                experience: [...prev.experience, { company: '', location: '', position: '', duration: '', departureDate: '', reason: '' }]
            }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validaciones estrictas
        if (!formData.idNumber || !formData.firstName || !formData.firstSurname || !formData.dob) {
            alert('Por favor complete los campos obligatorios de identificación (*)');
            return;
        }

        /* Fotos opcionales por solicitud de quitar seguridad */
        /*
        if (!formData.photo) {
            alert('Es obligatorio subir su Foto de Perfil (Selfie) con fondo blanco.');
            const el = document.getElementById('photo-input');
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (!formData.idPhoto) {
            alert('Es obligatorio subir la foto de su Cédula de Identidad.');
            const el = document.getElementById('id-photo-input');
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }
        */

        // --- VERIFICACIÓN DESACTIVADA POR SOLICITUD ---
        /* 
        setVerifying(true);
        try {
            const verification = await dataService.verifyIdentityAI(formData.photo, formData.idPhoto);
            // ... logic removed
        } catch (error) {
            console.error('Face verification failed:', error);
        } finally {
            setVerifying(false);
        }
        */
        // ----------------------------------------------

        setLoading(true);
        try {
            const workerData = {
                first_name: formData.firstName,
                second_name: formData.secondName,
                first_surname: formData.firstSurname,
                second_surname: formData.secondSurname,
                id_type: formData.idType,
                id_number: formData.idNumber,
                dob: formData.dob || null,
                civil_status: formData.civilStatus,
                birth_place: formData.birthPlace,
                birth_country: formData.birthCountry,
                nationality: formData.nationality,
                cell_phone: formData.cellPhone,
                home_phone: formData.homePhone,
                email: formData.email,
                address: formData.address,
                ivss: formData.ivss,
                left_handed: formData.leftHanded,
                specialty: formData.specialty,
                photo: formData.photo || null,
                id_photo: formData.idPhoto || null,
                current_project_id: context?.projectId || null,
                status: 'PENDING_REVIEW',
                criminal_records_json: formData.criminalRecords,
                education_json: formData.education,
                union_json: formData.union,
                medical_json: formData.medical,
                sizes_json: formData.sizes,
                dependents: formData.dependents,
                experience: formData.experience,
                worker_type: context?.type || 'WORKER'
            };

            console.log("🚀 Submitting Final Worker Data:", workerData);

            const { error } = await supabase.from('workers').insert([workerData]);

            if (error) {
                if (error.code === '23505') {
                    throw new Error('Esta cédula de identidad ya se encuentra registrada en nuestro sistema.');
                }
                throw error;
            }

            setSuccess(true);
        } catch (error: any) {
            console.error('Error submitting recruitment form:', error);
            const errorMsg = error.message || 'Error desconocido';
            const errorCode = error.code ? ` (Hash: ${error.code})` : '';
            alert(`❌ ERROR AL GUARDAR: ${errorMsg}${errorCode}\n\nPor favor, contacte a RRHH si el problema persiste.`);
        } finally {
            setLoading(false);
        }
    };

    // Helper para extraer nombre de empresa (usamos owner que es el cliente/constructora)
    const getCompanyName = () => {
        return projectInfo?.owner || 'Postulación de Empleo';
    };

    if (success) {
        return (
            <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-700">
                <div className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                    <span className="material-symbols-outlined text-primary text-5xl">done_all</span>
                </div>
                <h1 className="text-3xl font-black text-white tracking-tighter mb-4">¡Solicitud Enviada!</h1>
                <p className="text-stone-400 text-sm max-w-xs leading-relaxed">
                    Tus datos han sido registrados en el sistema de {projectInfo?.name || 'la obra'}.
                    El departamento de RRHH evaluará tu perfil y se pondrá en contacto contigo pronto.
                </p>
                <button
                    onClick={() => window.location.href = '/'}
                    className="mt-12 text-primary font-black uppercase tracking-widest text-[10px] bg-primary/10 px-8 py-4 rounded-xl border border-primary/20"
                >
                    Finalizar
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-stone-950 text-stone-200">
            {/* Visual AI Verification Overlay */}
            {verifying && (
                <div className="fixed inset-0 z-[100] bg-stone-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-in fade-in duration-500">
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-primary/20 animate-ping absolute inset-0"></div>
                        <div className="w-32 h-32 rounded-full border-2 border-primary/50 flex items-center justify-center relative bg-stone-900 shadow-2xl shadow-primary/20">
                            <span className="material-symbols-outlined text-primary text-5xl animate-pulse">security</span>
                        </div>
                    </div>
                    <div className="mt-12 text-center space-y-4 max-w-xs">
                        <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Stitch Guardian</h2>
                        <div className="h-1 bg-white/5 w-48 mx-auto rounded-full overflow-hidden">
                            <div className="h-full bg-primary w-1/2 animate-[shimmer_2s_infinite]"></div>
                        </div>
                        <p className="text-primary font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Verificando Identidad Biométrica...</p>
                        <p className="text-stone-500 text-[10px] leading-relaxed">Analizando similitud facial entre la selfie y el documento de identidad del trabajador.</p>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-stone-900 flex items-center justify-center opacity-30">
                    <span className="material-symbols-outlined text-9xl">engineering</span>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 to-transparent"></div>
                <div className="absolute bottom-10 left-6 right-6">
                    <p className="text-primary font-black text-[10px] uppercase tracking-widest mb-1">
                        {loadingProject ? 'Cargando Entidad...' : getCompanyName()}
                    </p>
                    <h1 className="text-3xl font-black text-white tracking-tighter leading-none">
                        {loadingProject ? 'Cargando Obra...' : (projectInfo?.name || 'Nueva Obra')}
                    </h1>
                    <p className="text-[10px] font-bold text-stone-500 uppercase mt-2 tracking-widest">
                        {context?.type === 'EMPLOYEE' ? 'POSTULACIÓN: PERSONAL ADMINISTRATIVO' : 'POSTULACIÓN: PERSONAL OPERATIVO'}
                    </p>
                </div>
            </div>

            <div className="px-4 pb-24 -mt-4 relative z-10 max-w-2xl mx-auto">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="glass-card rounded-[2.5rem] p-6 md:p-10 border-white/5 bg-white/[0.02] shadow-2xl space-y-10">

                        <div className="space-y-1 text-center mb-4">
                            <h2 className="text-2xl font-black text-white tracking-tighter">
                                {context?.type === 'EMPLOYEE' ? 'Ficha de Ingreso Administrativo' : 'Ficha de Ingreso Operativo'}
                            </h2>
                            <p className="text-[10px] text-stone-500 uppercase font-black tracking-widest">Todos los campos son obligatorios bajo declaración jurada</p>
                        </div>

                        {/* I. IDENTIFICACIÓN Y DATOS PERSONALES */}
                        <div className="space-y-6">
                            <SectionHeader icon="person" title={context?.type === 'EMPLOYEE' ? "I. Identificación del Empleado" : "I. Identificación del Trabajador"} />

                            <div className="flex flex-col gap-4 mb-4">
                                <div onClick={() => document.getElementById('photo-input')?.click()} className="h-64 glass-card border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/[0.01]">
                                    {formData.photo ? <img src={formData.photo} className="w-full h-full object-cover" /> : <><span className="material-symbols-outlined text-stone-500 text-3xl">add_a_photo</span><p className="text-[8px] uppercase font-bold text-stone-500 mt-2">Foto Perfil (Selfie)</p></>}
                                </div>
                                <div onClick={() => document.getElementById('id-photo-input')?.click()} className="h-40 glass-card border-dashed border-white/20 rounded-2xl flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white/[0.01]">
                                    {formData.idPhoto ? <img src={formData.idPhoto} className="w-full h-full object-cover" /> : <><span className="material-symbols-outlined text-stone-500 text-3xl">badge</span><p className="text-[8px] uppercase font-bold text-stone-500 mt-2">Foto Cédula / Documento</p></>}
                                </div>
                                <input id="photo-input" type="file" hidden onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setLoading(true);
                                        const url = await dataService.uploadFile('inventory-assets', `postulantes/p-${Date.now()}`, file);
                                        setFormData(prev => ({ ...prev, photo: url }));
                                        setLoading(false);
                                    }
                                }} />
                                <input id="id-photo-input" type="file" hidden onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setLoading(true);
                                        const url = await dataService.uploadFile('inventory-assets', `postulantes/id-${Date.now()}`, file);
                                        setFormData(prev => ({ ...prev, idPhoto: url }));
                                        setLoading(false);
                                    }
                                }} />
                            </div>

                            <div className="space-y-6">
                                <FormInput label="Primer Nombre" value={formData.firstName} onChange={(e: any) => handleNestedChange('firstName', e.target.value)} required />
                                <FormInput label="Segundo Nombre" value={formData.secondName} onChange={(e: any) => handleNestedChange('secondName', e.target.value)} />
                                <FormInput label="Primer Apellido" value={formData.firstSurname} onChange={(e: any) => handleNestedChange('firstSurname', e.target.value)} required />
                                <FormInput label="Segundo Apellido" value={formData.secondSurname} onChange={(e: any) => handleNestedChange('secondSurname', e.target.value)} />
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1.5 w-full">
                                    <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Cédula de Identidad Trabajador*</label>
                                    <div className="flex gap-2">
                                        <select value={formData.idType} onChange={(e) => setFormData({ ...formData, idType: e.target.value })} className="w-20 glass-input rounded-xl bg-stone-900 border-white/5 text-xs font-black">
                                            <option value="V">V-</option><option value="E">E-</option>
                                        </select>
                                        <input type="text" value={formData.idNumber} onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })} className="flex-1 glass-input rounded-xl px-4 py-3.5 text-sm font-mono bg-stone-900 border-white/5" placeholder="Número de cédula" required />
                                    </div>
                                </div>
                                <div className="space-y-1.5 w-full">
                                    <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Estado Civil</label>
                                    <select value={formData.civilStatus} onChange={(e) => setFormData({ ...formData, civilStatus: e.target.value })} className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5">
                                        <option value="">Seleccione estado civil...</option><option value="Soltero">Soltero/a</option><option value="Casado">Casado/a</option><option value="Divorciado">Divorciado/a</option><option value="Viudo">Viudo/a</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <KoreDateInput label="Fecha Nac. *" value={formData.dob} onChange={(v) => handleNestedChange('dob', v)} required />
                                <FormInput label="Lugar de Nacimiento" value={formData.birthPlace} onChange={(e: any) => handleNestedChange('birthPlace', e.target.value)} />
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1.5 w-full">
                                    <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Nacionalidad</label>
                                    <select value={formData.nationality} onChange={(e) => setFormData({ ...formData, nationality: e.target.value })} className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5">
                                        {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                                    </select>
                                </div>
                                <FormInput label="Celular" value={formData.cellPhone} onChange={(e: any) => handleNestedChange('cellPhone', e.target.value)} placeholder="0412-1234567" mono />
                            </div>

                            <div className="space-y-6">
                                <FormInput label="Tel. Habitación" value={formData.homePhone} onChange={(e: any) => handleNestedChange('homePhone', e.target.value)} placeholder="0212-1234567" mono />
                                <FormInput label="Correo Electrónico" value={formData.email} onChange={(e: any) => handleNestedChange('email', e.target.value)} type="email" placeholder="juan@correo.com" />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Dirección / Domicilio</label>
                                <textarea value={formData.address} onChange={(e) => handleNestedChange('address', e.target.value)} className="w-full glass-input rounded-xl px-4 py-3.5 text-sm min-h-[80px] bg-stone-900 border-white/5 resize-none" placeholder="Av, Calle, Casa..." />
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Inscripción IVSS</label>
                                    <div className="flex gap-2">
                                        {[true, false].map(v => (
                                            <button key={String(v)} type="button" onClick={() => setFormData({ ...formData, ivss: v })} className={`flex-1 py-3 rounded-xl text-[10px] font-black border transition-all ${formData.ivss === v ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-stone-500'}`}>
                                                {v ? 'SÍ' : 'NO'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] text-stone-500 uppercase font-bold px-1">¿Zurdo?</label>
                                    <div className="flex gap-2">
                                        {[true, false].map(v => (
                                            <button key={String(v)} type="button" onClick={() => setFormData({ ...formData, leftHanded: v })} className={`flex-1 py-3 rounded-xl text-[10px] font-black border transition-all ${formData.leftHanded === v ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-stone-500'}`}>
                                                {v ? 'SÍ' : 'NO'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* DATOS DE LA CONTRATACIÓN */}
                        <div className="space-y-6">
                            <SectionHeader icon="work" title="Datos de la Contratación" color="text-amber-500" />
                            <div className="space-y-1.5 w-full">
                                <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Cargo u oficio a desempeñar *</label>
                                <select
                                    value={formData.specialty}
                                    onChange={(e) => handleNestedChange('specialty', e.target.value)}
                                    className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5"
                                    required
                                >
                                    <option value="">Seleccione el cargo...</option>
                                    {SPECIALTIES.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* ANTECEDENTES PENALES */}
                        <div className="space-y-6">
                            <SectionHeader icon="security" title="Certificado de Antecedentes Penales" color="text-red-500" />
                            <div className="space-y-1.5 mb-4">
                                <label className="text-[10px] text-stone-500 uppercase font-bold px-1">¿Posee Antecedentes?</label>
                                <div className="flex gap-2 w-48">
                                    {[true, false].map(v => (
                                        <button key={String(v)} type="button" onClick={() => handleNestedChange('criminalRecords.hasRecords', v)} className={`flex-1 py-3 rounded-xl text-[10px] font-black border transition-all ${formData.criminalRecords.hasRecords === v ? 'bg-red-500/20 border-red-500 text-red-500' : 'bg-white/5 border-white/10 text-stone-500'}`}>
                                            {v ? 'SÍ' : 'NO'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <FormInput label="Expedido por" value={formData.criminalRecords.issuedBy} onChange={(e: any) => handleNestedChange('criminalRecords.issuedBy', e.target.value)} placeholder="MIJP" />
                                <FormInput label="Lugar" value={formData.criminalRecords.place} onChange={(e: any) => handleNestedChange('criminalRecords.place', e.target.value)} />
                                <KoreDateInput label="Fecha Expedición" value={formData.criminalRecords.date} onChange={(v) => handleNestedChange('criminalRecords.date', v)} />
                            </div>
                        </div>

                        {/* INSTRUCCIÓN Y CAPACITACIÓN */}
                        <div className="space-y-6">
                            <SectionHeader icon="school" title="Instrucción y Capacitación" color="text-emerald-500" />
                            <div className="space-y-1.5 mb-4 w-48">
                                <label className="text-[10px] text-stone-500 uppercase font-bold px-1">¿Sabe leer?</label>
                                <div className="flex gap-2">
                                    {[true, false].map(v => (
                                        <button key={String(v)} type="button" onClick={() => handleNestedChange('education.canRead', v)} className={`flex-1 py-3 rounded-xl text-[10px] font-black border transition-all ${formData.education.canRead === v ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-white/5 border-white/10 text-stone-500'}`}>
                                            {v ? 'SÍ' : 'NO'}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-6">
                                <FormInput label="Primaria" value={formData.education.primary} onChange={(e: any) => handleNestedChange('education.primary', e.target.value)} />
                                <FormInput label="Secundaria" value={formData.education.secondary} onChange={(e: any) => handleNestedChange('education.secondary', e.target.value)} />
                                <FormInput label="Técnica" value={formData.education.technical} onChange={(e: any) => handleNestedChange('education.technical', e.target.value)} />
                                <FormInput label="Superior" value={formData.education.superior} onChange={(e: any) => handleNestedChange('education.superior', e.target.value)} />
                            </div>
                            <FormInput label="Profesión u oficio actual" value={formData.education.currentProfession} onChange={(e: any) => handleNestedChange('education.currentProfession', e.target.value)} />
                        </div>

                        {/* ACTIVIDAD GREMIAL */}
                        <div className="space-y-6">
                            <SectionHeader icon="groups" title="Actividad Gremial o Sindical" color="text-cyan-500" />
                            <div className="space-y-6">
                                <FormInput label="Federación / Sindicato" value={formData.union.federation} onChange={(e: any) => handleNestedChange('union.federation', e.target.value)} />
                                <FormInput label="Cargo que ejerce" value={formData.union.position} onChange={(e: any) => handleNestedChange('union.position', e.target.value)} />
                            </div>
                        </div>

                        {/* ANTECEDENTES MÉDICOS */}
                        <div className="space-y-6">
                            <SectionHeader icon="medical_services" title="Antecedentes Médicos" color="text-rose-500" />
                            <div className="space-y-6">
                                <div className="space-y-1.5 flex-1">
                                    <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Examen Médico Previo</label>
                                    <div className="flex gap-2">
                                        {[true, false].map(v => (
                                            <button key={String(v)} type="button" onClick={() => handleNestedChange('medical.hasExam', v)} className={`flex-1 py-3 rounded-xl text-[10px] font-black border transition-all ${formData.medical.hasExam === v ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-white/5 border-white/10 text-stone-500'}`}>
                                                {v ? 'SÍ' : 'NO'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1.5 flex-1">
                                    <label className="text-[10px] text-stone-500 uppercase font-bold px-1">Tipo de Sangre</label>
                                    <select value={formData.medical.bloodType} onChange={(e) => handleNestedChange('medical.bloodType', e.target.value)} className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5">
                                        <option value="">Seleccione...</option>
                                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </div>
                            </div>
                            <FormInput label="Efectuado por" value={formData.medical.performedBy} onChange={(e: any) => handleNestedChange('medical.performedBy', e.target.value)} />
                            <div className="space-y-6">
                                <FormInput label="Enfermedades padecidas" value={formData.medical.diseases} onChange={(e: any) => handleNestedChange('medical.diseases', e.target.value)} />
                                <FormInput label="Incapacidades físicas" value={formData.medical.incapacities} onChange={(e: any) => handleNestedChange('medical.incapacities', e.target.value)} />
                            </div>
                        </div>

                        {/* PESO Y MEDIDAS */}
                        <div className="space-y-6">
                            <SectionHeader icon="straighten" title="Peso y Medidas" color="text-indigo-400" />
                            <div className="space-y-6">
                                <FormInput label="Peso (Kg)" value={formData.sizes.weight} onChange={(e: any) => handleNestedChange('sizes.weight', e.target.value)} mono />
                                <FormInput label="Estatura (cm)" value={formData.sizes.stature} onChange={(e: any) => handleNestedChange('sizes.stature', e.target.value)} mono />
                                <FormInput label="Talla Camisa" value={formData.sizes.shirt} onChange={(e: any) => handleNestedChange('sizes.shirt', e.target.value)} placeholder="S, M, L..." />
                                <FormInput label="Talla Pantalón" value={formData.sizes.pants} onChange={(e: any) => handleNestedChange('sizes.pants', e.target.value)} placeholder="32" />
                                <FormInput label="Talla Bragas" value={formData.sizes.overalls} onChange={(e: any) => handleNestedChange('sizes.overalls', e.target.value)} />
                                <FormInput label="Medida Botas" value={formData.sizes.boots} onChange={(e: any) => handleNestedChange('sizes.boots', e.target.value)} placeholder="42" />
                            </div>
                            <FormInput label="Observaciones Peso/Medidas" value={formData.sizes.observations} onChange={(e: any) => handleNestedChange('sizes.observations', e.target.value)} />
                        </div>

                        {/* FAMILIARES DEPENDIENTES */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-3xl border border-white/5">
                                <SectionHeader icon="family_restroom" title="Familiares Dependientes" color="text-pink-500" />
                                <button type="button" onClick={addDependent} disabled={formData.dependents.length >= 5} className="w-10 h-10 rounded-xl bg-pink-500/20 text-pink-500 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all">
                                    <span className="material-symbols-outlined text-sm font-black">add</span>
                                </button>
                            </div>
                            <div className="space-y-4">
                                {formData.dependents.map((dep, idx) => (
                                    <div key={idx} className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 space-y-4 animate-in slide-in-from-right-4 duration-300">
                                        <p className="text-[9px] font-black uppercase text-pink-500/50">Familiar # {idx + 1}</p>
                                        <FormInput label="Nombres y Apellidos" value={dep.fullName} onChange={(e: any) => {
                                            const newDep = [...formData.dependents]; newDep[idx].fullName = e.target.value; setFormData({ ...formData, dependents: newDep });
                                        }} />
                                        <div className="space-y-4">
                                            <FormInput label="Parentesco" value={dep.relationship} onChange={(e: any) => {
                                                const newDep = [...formData.dependents]; newDep[idx].relationship = e.target.value; setFormData({ ...formData, dependents: newDep });
                                            }} />
                                            <KoreDateInput label="Fecha Nac." value={dep.dob} onChange={(v) => {
                                                const newDep = [...formData.dependents]; newDep[idx].dob = v; setFormData({ ...formData, dependents: newDep });
                                            }} />
                                        </div>
                                    </div>
                                ))}
                                {formData.dependents.length === 0 && <p className="text-[10px] text-stone-600 text-center italic py-4">Sin familiares dependientes registrados.</p>}
                            </div>
                        </div>

                        {/* TRABAJOS PREVIOS */}
                        <div className="space-y-6">
                            <div className="flex justify-between items-center bg-white/[0.03] p-4 rounded-3xl border border-white/5">
                                <SectionHeader icon="history" title="V. Trabajos Previos" color="text-slate-400" />
                                <button type="button" onClick={addExperience} disabled={formData.experience.length >= 2} className="w-10 h-10 rounded-xl bg-slate-500/20 text-slate-400 flex items-center justify-center disabled:opacity-20 active:scale-90 transition-all">
                                    <span className="material-symbols-outlined text-sm font-black">add</span>
                                </button>
                            </div>
                            <div className="space-y-6">
                                {formData.experience.map((exp, idx) => (
                                    <div key={idx} className="p-6 rounded-3xl bg-white/[0.01] border border-white/5 space-y-4 animate-in slide-in-from-right-4 duration-300">
                                        <p className="text-[9px] font-black uppercase text-slate-500/50">Experiencia Laboral {idx + 1}</p>
                                        <div className="space-y-4">
                                            <FormInput label="Empresa o Patrono" value={exp.company} onChange={(e: any) => {
                                                const newExp = [...formData.experience]; newExp[idx].company = e.target.value; setFormData({ ...formData, experience: newExp });
                                            }} />
                                            <FormInput label="Lugar" value={exp.location} onChange={(e: any) => {
                                                const newExp = [...formData.experience]; newExp[idx].location = e.target.value; setFormData({ ...formData, experience: newExp });
                                            }} />
                                        </div>
                                        <div className="space-y-4">
                                            <FormInput label="Oficio o Cargo" value={exp.position} onChange={(e: any) => {
                                                const newExp = [...formData.experience]; newExp[idx].position = e.target.value; setFormData({ ...formData, experience: newExp });
                                            }} />
                                            <FormInput label="Duración (Ej: 2 años)" value={exp.duration} onChange={(e: any) => {
                                                const newExp = [...formData.experience]; newExp[idx].duration = e.target.value; setFormData({ ...formData, experience: newExp });
                                            }} />
                                            <KoreDateInput label="Fecha Retiro" value={exp.departureDate} onChange={(v) => {
                                                const newExp = [...formData.experience]; newExp[idx].departureDate = v; setFormData({ ...formData, experience: newExp });
                                            }} />
                                        </div>
                                        <FormInput label="Motivo del retiro" value={exp.reason} onChange={(e: any) => {
                                            const newExp = [...formData.experience]; newExp[idx].reason = e.target.value; setFormData({ ...formData, experience: newExp });
                                        }} />
                                    </div>
                                ))}
                                {formData.experience.length === 0 && <p className="text-[10px] text-stone-600 text-center italic py-4">Sin registros previos.</p>}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-primary text-white h-20 rounded-3xl font-black uppercase tracking-[0.25em] text-[12px] shadow-2xl shadow-primary/40 flex items-center justify-center gap-4 active:scale-[0.97] transition-all disabled:opacity-50"
                        >
                            {loading ? <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><span className="material-symbols-outlined">send_and_archive</span>Finalizar y Enviar Postulación</>}
                        </button>
                    </div>

                    <p className="text-center text-[10px] text-stone-600 uppercase font-black tracking-widest leading-relaxed px-10">
                        Certifico que la información suministrada es verdadera. Al hacer clic en "Enviar", autorizo el uso de estos datos para el proceso de selección de personal.
                    </p>
                </form>
            </div>
        </div>
    );
};

export default RecruitmentForm;
