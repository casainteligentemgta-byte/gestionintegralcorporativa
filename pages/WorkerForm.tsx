
import React, { useState } from 'react';
import { dataService } from '../services/dataService';
import { Worker, Dependent, WorkExperience } from '../types';
import { supabase } from '../services/supabase';
import { COUNTRIES, NATIONALITIES, SPECIALTIES } from '../constants';



const SectionHeader = ({ icon, title, color = "text-primary" }: { icon: string, title: string, color?: string }) => (
  <h3 className={`text-xs font-black uppercase tracking-[0.2em] ${color} flex items-center gap-2 mb-4`}>
    <span className="material-symbols-outlined text-sm">{icon}</span>
    {title}
  </h3>
);

const FormInput = ({ label, name, value, onChange, placeholder, type = "text", mono = false }: any) => (
  <div className="space-y-1.5 w-full">
    <label className="text-[10px] text-slate-500 uppercase font-bold px-1">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`w-full glass-input rounded-xl px-4 py-3.5 text-sm ${mono ? 'font-mono' : ''}`}
      placeholder={placeholder}
    />
  </div>
);

const KoreDateInput = ({ label, value, onChange, required }: { label: string, value: string, onChange: (v: string) => void, required?: boolean }) => {
  return (
    <div className="space-y-1.5 w-full">
      <label className="text-[10px] text-slate-500 uppercase font-bold px-1">{label} {required && '*'}</label>
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

interface WorkerFormProps {
  worker?: Worker | any;
  onNavigate: (view: any, data?: any) => void;
}

const WorkerForm: React.FC<WorkerFormProps> = ({ worker, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    firstName: worker?.first_name || worker?.firstName || '',
    secondName: worker?.second_name || worker?.secondName || '',
    firstSurname: worker?.first_surname || worker?.firstSurname || '',
    secondSurname: worker?.second_surname || worker?.secondSurname || '',
    idType: worker?.id_type || ((worker?.id_number || worker?.idNumber || '').startsWith('E') ? 'E' : 'V'),
    idNumber: worker?.id_number || ((worker?.id_number || worker?.idNumber || '').replace(/^[VE]-/, '')),
    civilStatus: worker?.civil_status || worker?.civilStatus || '',
    birthPlace: worker?.birth_place || worker?.birthPlace || '',
    birthCountry: worker?.birth_country || worker?.birthCountry || 'Venezuela',
    dob: worker?.dob || '',
    nationality: worker?.nationality || 'Venezolano/a',
    cellPhone: worker?.cell_phone || worker?.cellPhone || '',
    homePhone: worker?.home_phone || worker?.homePhone || '',
    email: worker?.email || '',
    address: worker?.address || '',
    ivss: worker?.ivss || false,
    leftHanded: worker?.left_handed || worker?.leftHanded || false,
    specialty: worker?.specialty || '',
    status: worker?.status || 'PENDING',
    photo: worker?.photo || '',
    idPhoto: worker?.id_photo || worker?.idPhoto || '',
    project_id: worker?.current_project_id || worker?.project_id || null,
    criminalRecords: worker?.criminal_records_json || worker?.criminal_records || worker?.criminalRecords || { hasRecords: false, issuedBy: '', place: '', date: '' },
    education: worker?.education_json || worker?.education || { canRead: true, primary: '', secondary: '', technical: '', superior: '', currentProfession: '' },
    union: worker?.union_json || worker?.union || { federation: '', position: '' },
    medical: worker?.medical_json || worker?.medical || { hasExam: false, performedBy: '', bloodType: '', diseases: '', incapacities: '' },
    sizes: worker?.sizes_json || worker?.sizes || { weight: '', stature: '', shirt: '', pants: '', overalls: '', boots: '', observations: '' },
    dependents: worker?.dependents || [],
    experience: worker?.experience || []
  });

  const handleInputChange = (path: string, value: any) => {
    const keys = path.split('.');
    if (keys.length === 1) {
      setFormData({ ...formData, [path]: value });
    } else {
      setFormData({
        ...formData,
        [keys[0]]: { ...formData[keys[0]], [keys[1]]: value }
      });
    }
  };

  const addDependent = () => {
    if (formData.dependents.length < 5) {
      setFormData({
        ...formData,
        dependents: [...formData.dependents, { fullName: '', relationship: '', dob: '' }]
      });
    }
  };

  const addExperience = () => {
    if (formData.experience.length < 2) {
      setFormData({
        ...formData,
        experience: [...formData.experience, { company: '', location: '', position: '', duration: '', departureDate: '', reason: '' }]
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.idNumber) {
      alert('Nombre y Cédula son obligatorios');
      return;
    }

    setLoading(true);
    try {
      const workerData = {
        first_name: formData.firstName,
        second_name: formData.secondName,
        first_surname: formData.firstSurname,
        second_surname: formData.secondSurname,
        id_type: formData.idType,
        id_number: formData.idNumber,
        civil_status: formData.civilStatus,
        birth_place: formData.birthPlace,
        birth_country: formData.birthCountry,
        dob: formData.dob || null,
        nationality: formData.nationality,
        cell_phone: formData.cellPhone,
        home_phone: formData.homePhone,
        email: formData.email,
        address: formData.address,
        ivss: formData.ivss,
        left_handed: formData.leftHanded,
        specialty: formData.specialty,
        status: formData.status,
        photo: formData.photo,
        id_photo: formData.idPhoto,
        current_project_id: formData.project_id,
        criminal_records_json: formData.criminalRecords,
        education_json: formData.education,
        union_json: formData.union,
        medical_json: formData.medical,
        sizes_json: formData.sizes,
        // Relations handled separately or via JSONB as per schema
      };

      let error;
      if (worker?.id) {
        const { error: updateError } = await supabase
          .from('workers')
          .update(workerData)
          .eq('id', worker.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('workers')
          .insert([workerData]);
        error = insertError;
      }

      if (error) throw error;

      // Si el trabajador está pendiente, al guardar vamos a la revisión de contratación
      if (formData.status === 'PENDING' || formData.status === 'PENDING_REVIEW') {
        onNavigate('HIRING_REVIEW', { ...worker, ...workerData, id: worker?.id || null });
      } else {
        onNavigate('WORKERS', { id: formData.project_id });
      }
    } catch (error: any) {
      console.error('Error saving worker:', error);
      alert('Error al guardar el trabajador: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-950 pb-32">
      <header className="pt-12 pb-6 px-6 sticky top-0 z-50 bg-stone-950/80 backdrop-blur-lg flex items-center gap-4 border-b border-white/5">
        <button onClick={() => onNavigate('WORKERS')} className="text-slate-400 p-1 hover:text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold tracking-tight text-emerald-400 uppercase">Registro de Obreros (Construcción)</h1>
      </header>

      <main className="flex-1 p-6 space-y-10 max-w-lg mx-auto w-full relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 z-[60] bg-stone-950/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white/10 p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-widest text-white">Registrando...</p>
            </div>
          </div>
        )}

        {/* I. Identificación del Trabajador */}
        <section className="glass-card rounded-[2rem] p-6 space-y-6">
          <SectionHeader icon="badge" title="I. Identificación del Trabajador" />

          <div className="flex flex-col gap-4">
            <div
              onClick={() => document.getElementById('upload-photo')?.click()}
              className="w-full h-80 rounded-2xl glass-card border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden hover:border-primary/50 transition-all cursor-pointer group"
            >
              {formData.photo ? (
                <img src={formData.photo} alt="Perfil" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center bg-white w-full h-full justify-center">
                  <span className="material-symbols-outlined text-stone-300 text-3xl">face</span>
                  <p className="text-[6px] uppercase font-black tracking-widest text-stone-400 mt-1">Fondo Blanco</p>
                </div>
              )}
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="material-symbols-outlined text-white">add_a_photo</span>
              </div>
              <input
                id="upload-photo"
                type="file"
                className="hidden"
                accept="image/*"
                capture="user"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLoading(true);
                    try {
                      const path = `personal/${Date.now()}-${file.name}`;
                      const url = await dataService.uploadFile('inventory-assets', path, file);
                      handleInputChange('photo', url);
                    } catch (error) {
                      console.error('Photo upload error:', error);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
              />
            </div>
            <div
              onClick={() => document.getElementById('upload-id')?.click()}
              className="w-full h-40 rounded-2xl glass-card border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden hover:border-primary/50 transition-all cursor-pointer group"
            >
              {formData.idPhoto ? (
                <img src={formData.idPhoto} alt="Cédula" className="w-full h-full object-cover" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-slate-600 text-3xl mb-1">style</span>
                  <p className="text-[8px] uppercase font-black tracking-widest text-slate-500">Foto Cédula</p>
                </>
              )}
              <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <span className="material-symbols-outlined text-white">add_a_photo</span>
              </div>
              <input
                id="upload-id"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLoading(true);
                    try {
                      const path = `cedulas/${Date.now()}-${file.name}`;
                      const url = await dataService.uploadFile('inventory-assets', path, file);
                      handleInputChange('idPhoto', url);
                    } catch (error) {
                      console.error('ID Photo upload error:', error);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="space-y-6">
            <FormInput label="Primer Nombre" value={formData.firstName} onChange={(v: string) => handleInputChange('firstName', v)} />
            <FormInput label="Segundo Nombre" value={formData.secondName} onChange={(v: string) => handleInputChange('secondName', v)} />
          </div>
          <div className="space-y-6">
            <FormInput label="Primer Apellido" value={formData.firstSurname} onChange={(v: string) => handleInputChange('firstSurname', v)} />
            <FormInput label="Segundo Apellido" value={formData.secondSurname} onChange={(v: string) => handleInputChange('secondSurname', v)} />
          </div>
          <div className="space-y-6">
            <div className="space-y-1.5 w-full">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Cédula de Identidad</label>
              <div className="flex gap-2">
                <select
                  value={formData.idType}
                  onChange={(e) => handleInputChange('idType', e.target.value)}
                  className="w-20 glass-input rounded-xl px-2 py-3.5 text-sm font-black bg-stone-900 border-white/5"
                >
                  <option value="V">V-</option>
                  <option value="E">E-</option>
                </select>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => handleInputChange('idNumber', e.target.value)}
                  className="flex-1 glass-input rounded-xl px-4 py-3.5 text-sm font-mono"
                  placeholder="00000000"
                />
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5 w-full">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Estado Civil</label>
              <select
                value={formData.civilStatus}
                onChange={(e) => handleInputChange('civilStatus', e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5"
              >
                <option value="">Seleccione...</option>
                <option value="Soltero">Soltero/a</option>
                <option value="Casado">Casado/a</option>
                <option value="Divorciado">Divorciado/a</option>
                <option value="Viudo">Viudo/a</option>
              </select>
            </div>
            <KoreDateInput label="Fecha de Nac." value={formData.dob} onChange={(v: string) => handleInputChange('dob', v)} />
          </div>

          <div className="space-y-6">
            <FormInput label="Lugar de Nacimiento" value={formData.birthPlace} onChange={(v: string) => handleInputChange('birthPlace', v)} />
            <div className="space-y-1.5 flex-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">País de Nacimiento</label>
              <select
                value={formData.birthCountry}
                onChange={(e) => handleInputChange('birthCountry', e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5"
              >
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5 flex-1">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Nacionalidad</label>
              <select
                value={formData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5"
              >
                {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <FormInput label="Celular" type="tel" value={formData.cellPhone} onChange={(v: string) => handleInputChange('cellPhone', v)} />
          </div>

          <div className="space-y-6">
            <FormInput label="Tel. Habitación" type="tel" value={formData.homePhone} onChange={(v: string) => handleInputChange('homePhone', v)} />
            <FormInput label="Correo Electrónico" type="email" value={formData.email} onChange={(v: string) => handleInputChange('email', v)} />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Dirección/Domicilio Completo</label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-3.5 text-sm min-h-[80px] resize-none"
              placeholder="Calle, Sector, Ciudad, Estado..."
            />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Inscripción IVSS</label>
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => handleInputChange('ivss', val)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${formData.ivss === val ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}
                  >
                    {val ? 'SÍ' : 'NO'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Zurdo</label>
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => handleInputChange('leftHanded', val)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${formData.leftHanded === val ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}
                  >
                    {val ? 'SÍ' : 'NO'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* II. Datos de Contratación */}
        <section className="glass-card rounded-[2rem] p-6 space-y-4">
          <SectionHeader icon="work" title="Datos de la Contratación" />
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Cargo u oficio a desempeñar</label>
            <select
              value={formData.specialty}
              onChange={(e) => handleInputChange('specialty', e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/10"
            >
              <option value="">Seleccione cargo...</option>
              {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </section>

        {/* III. Antecedentes Penales */}
        <section className="glass-card rounded-[2rem] p-6 space-y-4">
          <SectionHeader icon="security" title="Certificado de Antecedentes Penales" color="text-amber-500" />
          <div className="flex gap-4 mb-4">
            <div className="flex-1 space-y-2">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">¿Posee antecedentes?</label>
              <div className="flex gap-2">
                {[true, false].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => handleInputChange('criminalRecords.hasRecords', val)}
                    className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${formData.criminalRecords.hasRecords === val ? 'bg-amber-500/20 border-amber-500 text-amber-500' : 'bg-white/5 border-white/10 text-slate-500'}`}
                  >
                    {val ? 'SÍ' : 'NO'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <FormInput label="Expedido por" value={formData.criminalRecords.issuedBy} onChange={(v: string) => handleInputChange('criminalRecords.issuedBy', v)} placeholder="Ej. Ministerio de Relaciones Interiores" />
          <FormInput label="Lugar" value={formData.criminalRecords.place} onChange={(v: string) => handleInputChange('criminalRecords.place', v)} />
          <KoreDateInput label="Fecha Expedición" value={formData.criminalRecords.date} onChange={(v: string) => handleInputChange('criminalRecords.date', v)} />
        </section>

        {/* IV. Instrucción y Capacitación */}
        <section className="glass-card rounded-[2rem] p-6 space-y-4">
          <SectionHeader icon="school" title="Instrucción y Capacitación" color="text-emerald-500" />
          <div className="space-y-2 mb-4">
            <label className="text-[10px] text-slate-500 uppercase font-bold px-1">¿Sabe leer?</label>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => handleInputChange('education.canRead', val)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${formData.education.canRead === val ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' : 'bg-white/5 border-white/10 text-slate-500'}`}
                >
                  {val ? 'SÍ' : 'NO'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-6">
            <FormInput label="Primaria" value={formData.education.primary} onChange={(v: string) => handleInputChange('education.primary', v)} placeholder="Escuela/Estado" />
            <FormInput label="Secundaria" value={formData.education.secondary} onChange={(v: string) => handleInputChange('education.secondary', v)} />
          </div>
          <div className="space-y-6">
            <FormInput label="Técnica" value={formData.education.technical} onChange={(v: string) => handleInputChange('education.technical', v)} />
            <FormInput label="Superior" value={formData.education.superior} onChange={(v: string) => handleInputChange('education.superior', v)} />
          </div>
          <FormInput label="Profesión u oficio actual" value={formData.education.currentProfession} onChange={(v: string) => handleInputChange('education.currentProfession', v)} />
        </section>

        {/* V. Actividad Gremial */}
        <section className="glass-card rounded-[2rem] p-6 space-y-4">
          <SectionHeader icon="groups_3" title="Actividad Gremial o Sindical" color="text-cyan-500" />
          <FormInput label="Federación / Sindicato / Gremio" value={formData.union.federation} onChange={(v: string) => handleInputChange('union.federation', v)} />
          <FormInput label="Cargo que ejerce" value={formData.union.position} onChange={(v: string) => handleInputChange('union.position', v)} />
        </section>

        {/* VI. Antecedentes Médicos */}
        <section className="glass-card rounded-[2rem] p-6 space-y-4">
          <SectionHeader icon="medical_services" title="Antecedentes Médicos" color="text-rose-500" />
          <div className="space-y-2 mb-4">
            <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Examen médico previo</label>
            <div className="flex gap-2">
              {[true, false].map((val) => (
                <button
                  key={String(val)}
                  onClick={() => handleInputChange('medical.hasExam', val)}
                  className={`flex-1 py-2.5 rounded-xl text-[10px] font-bold border transition-all ${formData.medical.hasExam === val ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-white/5 border-white/10 text-slate-500'}`}
                >
                  {val ? 'SÍ' : 'NO'}
                </button>
              ))}
            </div>
          </div>
          <FormInput label="Efectuado por" value={formData.medical.performedBy} onChange={(v: string) => handleInputChange('medical.performedBy', v)} />
          <div className="space-y-1.5">
            <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Tipo de Sangre</label>
            <select
              value={formData.medical.bloodType}
              onChange={(e) => handleInputChange('medical.bloodType', e.target.value)}
              className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900 border-white/5"
            >
              <option value="">Seleccione...</option>
              {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <FormInput label="Enfermedades padecidas" value={formData.medical.diseases} onChange={(v: string) => handleInputChange('medical.diseases', v)} />
          <FormInput label="Incapacidades físicas o funcionales" value={formData.medical.incapacities} onChange={(v: string) => handleInputChange('medical.incapacities', v)} />
        </section>

        {/* VII. Peso y Medidas */}
        <section className="glass-card rounded-[2rem] p-6 space-y-4">
          <SectionHeader icon="straighten" title="Peso y Medidas (Dotación)" color="text-indigo-400" />
          <div className="space-y-6">
            <FormInput label="Peso (Kg)" value={formData.sizes.weight} onChange={(v: string) => handleInputChange('sizes.weight', v)} />
            <FormInput label="Estatura (cm)" value={formData.sizes.stature} onChange={(v: string) => handleInputChange('sizes.stature', v)} />
          </div>
          <div className="space-y-4">
            <FormInput label="Camisa" value={formData.sizes.shirt} onChange={(v: string) => handleInputChange('sizes.shirt', v)} placeholder="S, M, L..." />
            <FormInput label="Pantalón" value={formData.sizes.pants} onChange={(v: string) => handleInputChange('sizes.pants', v)} />
            <FormInput label="Bragas" value={formData.sizes.overalls} onChange={(v: string) => handleInputChange('sizes.overalls', v)} />
          </div>
          <FormInput label="Medida Botas" value={formData.sizes.boots} onChange={(v: string) => handleInputChange('sizes.boots', v)} />
          <FormInput label="Observaciones peso/medidas" value={formData.sizes.observations} onChange={(v: string) => handleInputChange('sizes.observations', v)} />
        </section>

        {/* VIII. Familiares Dependientes */}
        <section className="glass-card rounded-[2rem] p-6 space-y-6">
          <div className="flex justify-between items-center">
            <SectionHeader icon="family_restroom" title="Familiares Dependientes" color="text-pink-500" />
            <button
              onClick={addDependent}
              disabled={formData.dependents.length >= 5}
              className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-500 flex items-center justify-center disabled:opacity-20"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>

          <div className="space-y-4">
            {formData.dependents.map((dep: any, index: number) => (
              <div key={index} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                <p className="text-[8px] font-black uppercase text-pink-500/50">Dependiente {index + 1}</p>
                <input
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs"
                  placeholder="Nombres y Apellidos"
                  value={dep.fullName}
                  onChange={(e) => {
                    const newDeps = [...formData.dependents];
                    newDeps[index].fullName = e.target.value;
                    handleInputChange('dependents', newDeps);
                  }}
                />
                <div className="space-y-4">
                  <input
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs"
                    placeholder="Parentesco"
                    value={dep.relationship}
                    onChange={(e) => {
                      const newDeps = [...formData.dependents];
                      newDeps[index].relationship = e.target.value;
                      handleInputChange('dependents', newDeps);
                    }}
                  />
                  <KoreDateInput
                    label="F. Nacimiento"
                    value={dep.dob}
                    onChange={(v) => {
                      const newDeps = [...formData.dependents];
                      newDeps[index].dob = v;
                      handleInputChange('dependents', newDeps);
                    }}
                  />
                </div>
              </div>
            ))}
            {formData.dependents.length === 0 && (
              <p className="text-[10px] text-slate-500 text-center italic">Sin dependientes registrados.</p>
            )}
          </div>
        </section>

        {/* IX. Trabajos Previos */}
        <section className="glass-card rounded-[2rem] p-6 space-y-6">
          <div className="flex justify-between items-center">
            <SectionHeader icon="history" title="Datos de Trabajos Previos" color="text-slate-400" />
            <button
              onClick={addExperience}
              disabled={formData.experience.length >= 2}
              className="w-8 h-8 rounded-full bg-white/10 text-slate-400 flex items-center justify-center disabled:opacity-20"
            >
              <span className="material-symbols-outlined text-sm">add</span>
            </button>
          </div>

          <div className="space-y-6">
            {formData.experience.map((exp: any, index: number) => (
              <div key={index} className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-4">
                <p className="text-[8px] font-black uppercase text-slate-500">Experiencia {index + 1}</p>
                <div className="space-y-4">
                  <input
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs"
                    placeholder="Empresa o Patrono"
                    value={exp.company}
                    onChange={(e) => {
                      const newExp = [...formData.experience];
                      newExp[index].company = e.target.value;
                      handleInputChange('experience', newExp);
                    }}
                  />
                  <input
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs"
                    placeholder="Lugar"
                    value={exp.location}
                    onChange={(e) => {
                      const newExp = [...formData.experience];
                      newExp[index].location = e.target.value;
                      handleInputChange('experience', newExp);
                    }}
                  />
                </div>
                <div className="space-y-4">
                  <input
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs"
                    placeholder="Oficio o cargo"
                    value={exp.position}
                    onChange={(e) => {
                      const newExp = [...formData.experience];
                      newExp[index].position = e.target.value;
                      handleInputChange('experience', newExp);
                    }}
                  />
                  <input
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs"
                    placeholder="Duración"
                    value={exp.duration}
                    onChange={(e) => {
                      const newExp = [...formData.experience];
                      newExp[index].duration = e.target.value;
                      handleInputChange('experience', newExp);
                    }}
                  />
                </div>
                <div className="space-y-6">
                  <div className="space-y-1">
                    <KoreDateInput
                      label="Fecha Retiro"
                      value={exp.departureDate}
                      onChange={(v) => {
                        const newExp = [...formData.experience];
                        newExp[index].departureDate = v;
                        handleInputChange('experience', newExp);
                      }}
                    />
                  </div>
                  <input
                    className="w-full glass-input rounded-xl px-4 py-3.5 text-sm"
                    placeholder="Motivo del retiro"
                    value={exp.reason}
                    onChange={(e) => {
                      const newExp = [...formData.experience];
                      newExp[index].reason = e.target.value;
                      handleInputChange('experience', newExp);
                    }}
                  />
                </div>
              </div>
            ))}
            {formData.experience.length === 0 && (
              <p className="text-[10px] text-slate-500 text-center italic">Sin registros previos.</p>
            )}
          </div>
        </section>

        <div className="pt-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-primary/30 apple-button uppercase tracking-[0.2em] text-[11px] flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <span className="material-symbols-outlined">
              {formData.status === 'PENDING' || formData.status === 'PENDING_REVIEW' ? 'fact_check' : 'how_to_reg'}
            </span>
            {formData.status === 'PENDING' || formData.status === 'PENDING_REVIEW'
              ? 'Verificar Planilla y Continuar Alta'
              : worker?.id ? 'Guardar Cambios' : 'Finalizar y Guardar Registro'}
          </button>
        </div>
      </main>
    </div>
  );
};

export default WorkerForm;
