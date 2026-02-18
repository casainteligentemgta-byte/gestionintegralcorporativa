
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
            <div key={project.id} className="glass-card rounded-premium overflow-hidden transition-transform active:scale-[0.98] border-white/5 bg-white/[0.01]">
              <div
                className="relative h-60 flex flex-col justify-end p-6 group"
                style={project.image ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(10,10,15,0) 0%, rgba(10,10,15,1) 100%), url("${project.image}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              >
                {!project.image && (
                  <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-white/5">construction</span>
                  </div>
                )}

                {getStatusBadge(project.status)}

                <div className="relative z-10 flex justify-between items-end">
                  <div className="space-y-1">
                    <h3 className="font-black text-white text-2xl tracking-tighter leading-none">{project.name}</h3>
                    <p className="text-primary font-bold text-[9px] uppercase tracking-[0.2em]">{project.owner || 'Proyecto Interno'}</p>
                    <div className="flex items-center gap-1.5 text-stone-400 mt-2">
                      <span className="material-symbols-outlined text-xs">location_on</span>
                      <span className="text-[10px] font-medium truncate max-w-[200px]">{project.address || 'Ubicación no definida'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onNavigate('PROJECT_FORM', project)}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-110"
                  >
                    <span className="material-symbols-outlined text-xl">edit_note</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2">
                <button
                  onClick={() => onNavigate('WORKERS', project)}
                  className="flex-1 py-3.5 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl apple-button flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">engineering</span>
                  Obreros
                </button>
                <button
                  onClick={() => onNavigate('EMPLOYEES', project)}
                  className="flex-1 py-3.5 bg-white/5 border border-white/10 text-slate-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl apple-button flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">badge</span>
                  Empleados
                </button>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default Projects;
