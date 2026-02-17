
import React, { useState } from 'react';
import { Project } from '../types';
import { supabase } from '../services/supabase';
import { dataService } from '../services/dataService';

interface ProjectFormProps {
  project?: Project | any;
  onNavigate: (view: any) => void;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ project, onNavigate }) => {
  const [isLocating, setIsLocating] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: project?.name || '',
    owner: project?.owner || '',
    contractNo: project?.contractNo || project?.contract_no || '',
    description: project?.description || '',
    location: project?.location?.address || project?.address || '',
    lat: project?.location?.lat || project?.lat || null,
    lng: project?.location?.lng || project?.lng || null,
    image: project?.image || '',
    status: project?.status || 'ACTIVE',
    ownerPhone: project?.phone || '',
    ownerEmail: project?.email || ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRecordLocation = () => {
    if (!navigator.geolocation) {
      alert("La geolocalización no es compatible con este navegador.");
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        const geoString = `https://www.google.com/maps?q=${latitude},${longitude}`;
        setFormData(prev => ({
          ...prev,
          lat: latitude,
          lng: longitude,
          location: `Coordenadas: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}\n${geoString}`
        }));
        setIsLocating(false);
      },
      (error) => {
        console.error("Error capturing location:", error);
        let msg = "No se pudo obtener la ubicación.";
        if (error.code === 1) msg = "Permiso denegado. Por favor, aprueba los permisos de GPS en la barra de direcciones de tu navegador.";
        if (error.code === 2) msg = "Posición no disponible. Verifique su conexión y señal GPS.";
        if (error.code === 3) msg = "Tiempo de espera agotado.";
        alert(msg);
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  const handleShareLocation = async () => {
    if (!formData.lat || !formData.lng) {
      alert("Primero debe grabar la ubicación de la obra.");
      return;
    }

    const shareData = {
      title: `Ubicación de Obra: ${formData.name}`,
      text: `Ubicación del proyecto ${formData.name} en ${formData.owner}`,
      url: `https://www.google.com/maps?q=${formData.lat},${formData.lng}`
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        window.open(shareData.url, '_blank');
      }
    } catch (err) {
      console.error("Error sharing:", err);
    }
  };

  const handleSubmit = async () => {
    if (!formData.name) {
      alert('El nombre de la obra es obligatorio');
      return;
    }

    setLoading(true);
    try {
      const projectData = {
        name: formData.name,
        owner: formData.owner,
        contract_no: formData.contractNo,
        description: formData.description,
        address: formData.location,
        lat: formData.lat,
        lng: formData.lng,
        image: formData.image,
        status: formData.status,
        phone: formData.ownerPhone,
        email: formData.ownerEmail,
      };

      let error;
      if (project?.id) {
        const { error: updateError } = await supabase
          .from('projects')
          .update(projectData)
          .eq('id', project.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('projects')
          .insert([projectData]);
        error = insertError;
      }

      if (error) throw error;
      onNavigate('PROJECTS');
    } catch (error: any) {
      console.error('Error saving project:', error);
      alert('Error al guardar el proyecto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!project?.id) return;

    if (window.confirm('¿Estás seguro de que deseas eliminar esta obra? Esta acción no se puede deshacer.')) {
      setLoading(true);
      try {
        const { error } = await supabase
          .from('projects')
          .delete()
          .eq('id', project.id);

        if (error) throw error;
        onNavigate('PROJECTS');
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
        <button onClick={() => onNavigate('PROJECTS')} className="text-slate-400 p-1 hover:text-white transition-colors">
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 className="text-2xl font-bold tracking-tight">
          {project ? 'Plantilla de Obra' : 'Nueva Obra'}
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

        {/* Project Basic Info */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">construction</span>
            Identificación de la Obra
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Nombre de la Obra</label>
              <input
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm"
                placeholder="Ej. Torre KORE Residencial"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Dueño / Cliente</label>
              <input
                name="owner"
                value={formData.owner}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm"
                placeholder="Nombre de la empresa cliente"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Móvil del Propietario</label>
                <input
                  name="ownerPhone"
                  value={formData.ownerPhone}
                  onChange={handleChange}
                  className="w-full glass-input rounded-xl px-4 py-3.5 text-sm"
                  placeholder="Ej. +58 412..."
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Email</label>
                <input
                  name="ownerEmail"
                  value={formData.ownerEmail}
                  onChange={handleChange}
                  className="w-full glass-input rounded-xl px-4 py-3.5 text-sm"
                  placeholder="propietario@email.com"
                  type="email"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Nº de Contrato</label>
                <input
                  name="contractNo"
                  value={formData.contractNo}
                  onChange={handleChange}
                  className="w-full glass-input rounded-xl px-4 py-3.5 text-sm font-mono"
                  placeholder="CT-2024-XXX"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Estado de Obra</label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full glass-input rounded-xl px-4 py-3.5 text-sm bg-stone-900"
                >
                  <option value="ACTIVE">Activa</option>
                  <option value="PENDING">En Espera</option>
                  <option value="STOPPED">Paralizada</option>
                  <option value="FINISHED">Finalizada</option>
                </select>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section */}
        <section className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">location_on</span>
              Ubicación Geográfica
            </h3>
            <div className="flex gap-2">
              <button
                onClick={handleRecordLocation}
                disabled={isLocating}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${isLocating ? 'bg-slate-800 border-slate-700 text-slate-500' : 'bg-primary/10 border-primary/30 text-primary hover:bg-primary/20'}`}
              >
                <span className={`material-symbols-outlined text-[14px] ${isLocating ? 'animate-spin' : ''}`}>
                  {isLocating ? 'sync' : 'my_location'}
                </span>
                {isLocating ? 'Capturando...' : 'Grabar Punto GPS'}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <textarea
                name="location"
                value={formData.location}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm min-h-[100px] resize-none pr-12"
                placeholder="Dirección o punto de Google Maps..."
              />
              {formData.lat && formData.lng && (
                <div className="absolute right-3 top-3 flex flex-col gap-2">
                  <a
                    href={`https://www.google.com/maps?q=${formData.lat},${formData.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary hover:bg-primary/30 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">map</span>
                  </a>
                </div>
              )}
            </div>

            <button
              onClick={handleShareLocation}
              type="button"
              className="w-full py-3 border border-white/10 rounded-xl flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:bg-white/5 transition-colors"
            >
              <span className="material-symbols-outlined text-base">share</span>
              Compartir Ubicación de Obra
            </button>
          </div>
        </section>

        {/* Description & Details */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">description</span>
            Detalles Técnicos
          </h3>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-500 uppercase font-bold px-1">Breve Descripción</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                className="w-full glass-input rounded-xl px-4 py-3.5 text-sm min-h-[100px] resize-none"
                placeholder="Alcance del proyecto..."
              />
            </div>
          </div>
        </section>

        {/* Media */}
        <section className="space-y-4">
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">image</span>
            Imagen Referencial
          </h3>
          <div className="space-y-1.5">
            <div className="w-full h-48 rounded-2xl glass-card border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer">
              {formData.image ? (
                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <span className="material-symbols-outlined text-slate-600 text-4xl">add_a_photo</span>
                  <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Subir Imagen de Obra</p>
                </div>
              )}
              <input
                type="file"
                className="absolute inset-0 opacity-0 cursor-pointer"
                accept="image/*"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setLoading(true);
                    try {
                      const filePath = `proyectos/${Date.now()}-${file.name}`;
                      const publicUrl = await dataService.uploadFile('inventory-assets', filePath, file);
                      setFormData(prev => ({ ...prev, image: publicUrl }));
                    } catch (error: any) {
                      console.error('Project image upload error:', error);
                      alert('Error al subir imagen: ' + error.message);
                    } finally {
                      setLoading(false);
                    }
                  }
                }}
              />
            </div>
          </div>
        </section>

        <div className="pt-8 px-4 space-y-4">
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-primary text-white font-black py-4.5 rounded-2xl shadow-2xl shadow-primary/30 apple-button uppercase tracking-[0.2em] text-[11px] disabled:opacity-50"
          >
            {project ? 'Guardar Cambios' : 'Registrar Proyecto'}
          </button>

          {project && (
            <button
              onClick={handleDelete}
              disabled={loading}
              className="w-full bg-red-500/10 text-red-500 border border-red-500/20 font-black py-4.5 rounded-2xl apple-button uppercase tracking-[0.2em] text-[11px] hover:bg-red-500 hover:text-white transition-all duration-300 disabled:opacity-50"
            >
              Eliminar Obra
            </button>
          )}
        </div>
      </main>
    </div>
  );
};

export default ProjectForm;
