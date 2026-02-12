
import React, { useState } from 'react';
import { Company } from '../types';
import { supabase } from '../services/supabase';

interface CompanyFormProps {
  company?: Company | any;
  onNavigate: (view: any) => void;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ company, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: company?.name || '',
    rif: company?.rif || '',
    address: company?.address || '',
    phone: company?.phone || '',
    email: company?.email || '',
    representativeFullName: company?.representative?.fullName || company?.representative_name || '',
    representativeId: company?.representative?.idNumber || company?.representative_id || '',
    representativeAge: company?.representative?.age || company?.representative_age || '',
    representativeCivilStatus: company?.representative?.civilStatus || company?.representative_civil_status || '',
    representativePosition: company?.representative?.position || company?.representative_position || '',
    representativeNationality: company?.representative?.nationality || company?.representative_nationality || '',
    logo: company?.logo || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      alert('El nombre de la empresa es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const companyData = {
        name: formData.name,
        rif: formData.rif,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        representative_name: formData.representativeFullName,
        representative_id: formData.representativeId,
        representative_age: formData.representativeAge,
        representative_civil_status: formData.representativeCivilStatus,
        representative_position: formData.representativePosition,
        representative_nationality: formData.representativeNationality,
        logo: formData.logo,
      };

      let error;
      if (company?.id) {
        // Update
        const { error: updateError } = await supabase
          .from('companies')
          .update(companyData)
          .eq('id', company.id);
        error = updateError;
      } else {
        // Insert
        const { error: insertError } = await supabase
          .from('companies')
          .insert([companyData]);
        error = insertError;
      }

      if (error) throw error;

      onNavigate('COMPANIES');
    } catch (error: any) {
      console.error('Error saving company:', error);
      alert('Error al guardar la empresa: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!company?.id) return;

    if (window.confirm('¿Estás seguro de que deseas eliminar esta empresa? Esta acción no se puede deshacer.')) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('companies')
          .delete()
          .eq('id', company.id);

        if (error) throw error;
        onNavigate('COMPANIES');
      } catch (error: any) {
        alert('Error al eliminar: ' + error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-stone-950 pb-32">
      <header className="pt-12 pb-6 px-6 sticky top-0 z-20 bg-stone-950/80 backdrop-blur-lg flex items-center gap-4 border-b border-white/5">
        <button onClick={() => onNavigate('COMPANIES')} className="text-slate-400 p-1 hover:text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold tracking-tight">
          {company ? 'Editar Empresa' : 'Registro de Empresa'}
        </h1>
      </header>

      <main className="flex-1 p-6 space-y-8 max-w-lg mx-auto w-full relative">
        {/* Loading Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 bg-stone-950/50 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white/10 p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-4">
              <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold uppercase tracking-widest">Procesando...</p>
            </div>
          </div>
        )}

        {/* Company Identification */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">corporate_fare</span>
            Datos de la Empresa
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Nombre o Denominación</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm"
                placeholder="Nombre legal completo"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">R.I.F</label>
              <input
                name="rif"
                value={formData.rif}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm font-mono"
                placeholder="J-00000000-0"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Dirección / Domicilio</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm min-h-[100px] resize-none"
                placeholder="Ubicación fiscal completa..."
              />
            </div>
          </div>
        </section>

        {/* Representative Section */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">person</span>
            Representante del Patrono
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Nombre y Apellido</label>
              <input
                name="representativeFullName"
                value={formData.representativeFullName}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm"
                placeholder="Representante Legal"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold px-1">C.I</label>
                <input
                  name="representativeId"
                  value={formData.representativeId}
                  onChange={handleChange}
                  className="w-full glass-input rounded-xl px-4 py-3.5 text-sm font-mono"
                  placeholder="V-00.000.000"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Edad</label>
                <input
                  name="representativeAge"
                  value={formData.representativeAge}
                  onChange={handleChange}
                  type="number"
                  className="w-full glass-input rounded-xl px-4 py-3.5 text-sm"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Estado Civil</label>
                <select
                  name="representativeCivilStatus"
                  value={formData.representativeCivilStatus}
                  onChange={handleChange}
                  className="w-full glass-input rounded-xl px-4 py-3.5 text-sm appearance-none bg-stone-900"
                >
                  <option value="">Seleccione...</option>
                  <option value="Soltero/a">Soltero/a</option>
                  <option value="Casado/a">Casado/a</option>
                  <option value="Divorciado/a">Divorciado/a</option>
                  <option value="Viudo/a">Viudo/a</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Nacionalidad</label>
                <input
                  name="representativeNationality"
                  value={formData.representativeNationality}
                  onChange={handleChange}
                  className="w-full glass-input rounded-xl px-4 py-3.5 text-sm"
                  placeholder="Ej. Venezolana"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Cargo</label>
              <input
                name="representativePosition"
                value={formData.representativePosition}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm"
                placeholder="Ej. Director General"
              />
            </div>
          </div>
        </section>

        {/* Media & Docs */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">attach_file</span>
            Logo y Documentación
          </h3>
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Logo de la Empresa</label>
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-2xl glass-card border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
                  {formData.logo ? (
                    <img src={formData.logo} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-slate-600 text-3xl">add_photo_alternate</span>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
                <div className="flex-1 text-[11px] text-slate-500">
                  Suba una imagen en formato PNG o JPG (Máx. 2MB).
                </div>
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Documentación</label>
              <div className="glass-card border-dashed border-white/20 rounded-2xl p-6 flex flex-col items-center justify-center gap-3 group hover:border-primary/50 transition-colors cursor-pointer relative">
                <span className="material-symbols-outlined text-4xl text-slate-600 group-hover:text-primary transition-colors">cloud_upload</span>
                <div className="text-center">
                  <p className="text-sm font-bold text-slate-300">Arrastre archivos aquí</p>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Acta Constitutiva, RIF, Solvencias</p>
                </div>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" multiple />
              </div>
            </div>
          </div>
        </section>

        <div className="pt-8 px-4 space-y-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary text-white font-black py-4.5 rounded-2xl shadow-2xl shadow-primary/30 apple-button uppercase tracking-[0.2em] text-[11px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {company ? 'Actualizar Registro' : 'Finalizar Registro'}
          </button>

          {company && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="w-full bg-red-500/10 text-red-500 border border-red-500/20 font-black py-4.5 rounded-2xl apple-button uppercase tracking-[0.2em] text-[11px] hover:bg-red-500 hover:text-white transition-all duration-300 disabled:opacity-50"
            >
              Eliminar Empresa
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default CompanyForm;
