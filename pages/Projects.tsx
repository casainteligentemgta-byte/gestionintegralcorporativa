
import React, { useEffect, useState } from 'react';
import { Project } from '../types';
import { supabase } from '../services/supabase';

interface ProjectsProps {
  onNavigate: (view: any, data?: any, context?: any) => void;
}

const Projects: React.FC<ProjectsProps> = ({ onNavigate }) => {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error: any) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getStatusBadge = (status: string | any) => {
    switch (status) {
      case 'STOPPED':
        return <div className="absolute top-4 right-4 bg-red-500/90 backdrop-blur-md text-white text-[8px] font-black px-2.5 py-1 rounded-lg shadow-lg border border-white/10 uppercase tracking-widest">Paralizada</div>;
      case 'PENDING':
        return <div className="absolute top-4 right-4 bg-amber-500/90 backdrop-blur-md text-white text-[8px] font-black px-2.5 py-1 rounded-lg shadow-lg border border-white/10 uppercase tracking-widest">En Espera</div>;
      case 'FINISHED':
        return <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur-md text-white text-[8px] font-black px-2.5 py-1 rounded-lg shadow-lg border border-white/10 uppercase tracking-widest">Finalizada</div>;
      default:
        return <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-md text-white text-[8px] font-black px-2.5 py-1 rounded-lg shadow-lg border border-white/10 uppercase tracking-widest">Activa</div>;
    }
  };

  const filteredProjects = projects.filter(project =>
    project.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.owner?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="pt-12 pb-6 px-6 sticky top-0 z-20 bg-stone-950/80 backdrop-blur-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Obras</h1>
          <button
            onClick={() => onNavigate('PROJECT_FORM', null)}
            className="bg-primary hover:bg-primary/90 text-white p-2 rounded-full flex items-center justify-center apple-button shadow-lg shadow-primary/20"
            title="Agregar Obra"
          >
            <span className="material-symbols-outlined text-2xl leading-none">add</span>
          </button>
        </div>

        <div className="relative group px-1">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">search</span>
          <input
            className="w-full glass-input rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/50"
            placeholder="Buscar obra por nombre o cliente..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-1 px-4 space-y-4 pb-24 mt-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cargando obras...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4">construction</span>
            <p className="text-sm font-medium uppercase tracking-widest">No hay obras registradas</p>
            <button
              onClick={() => onNavigate('PROJECT_FORM', null)}
              className="mt-4 text-primary text-xs font-bold uppercase tracking-widest"
            >
              Registrar la primera
            </button>
          </div>
        ) : (
          filteredProjects.map((project: any) => (
            <div key={project.id} className="glass-card rounded-apple overflow-hidden transition-transform active:scale-[0.98]">
              <div className="relative">
                {project.image ? (
                  <img
                    src={project.image}
                    alt={project.name}
                    className="w-full h-44 object-cover opacity-80"
                  />
                ) : (
                  <div className="w-full h-44 bg-white/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-4xl text-white/10">construction</span>
                  </div>
                )}
                {getStatusBadge(project.status)}
              </div>
              <div className="p-5 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">{project.name}</h3>
                    <p className="text-[10px] text-slate-500 uppercase font-black tracking-[0.15em] mt-1">{project.owner || 'Sin cliente'}</p>
                  </div>
                  <button
                    onClick={() => onNavigate('PROJECT_FORM', project)}
                    className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-xl">edit_note</span>
                  </button>
                </div>

                <div className="flex items-center gap-2 text-slate-400 pb-2">
                  <span className="material-symbols-outlined text-sm">location_on</span>
                  <span className="text-[10px] font-medium truncate">{project.address || 'Sin ubicación'}</span>
                </div>

                <div className="pt-2 flex flex-col gap-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onNavigate('WORKERS', project, 'OBRERO')}
                      className="flex-1 py-3.5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl apple-button flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">engineering</span>
                      Obreros
                    </button>
                    <button
                      onClick={() => onNavigate('WORKERS', project, 'EMPLEADO')}
                      className="flex-1 py-3.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl apple-button flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">badge</span>
                      Empleados
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default Projects;
