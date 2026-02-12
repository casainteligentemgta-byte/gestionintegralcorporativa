
import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { Project } from '../types';

const SPECIALTIES = [
  "OBRERO DE 1era.", "VIGILANTE", "AYUDANTE", "AUXILIAR DE DEPOSITO", "CHOFER DE 4ta.",
  "OPERADOR DE MARTILLO PERFORADOR", "AYUDANTE DE OPERADORES", "AYUDANTE DE MECANICO DIESEL",
  "AYUDANTE DE TOPOGRAFO", "RASTRILLERO", "ESPESORISTA", "PALERO ASFALTICO", "CAPORAL",
  "ALBAÑIL DE 2da.", "CARPINTERO DE 2da.", "CABILLERO DE 2da.", "PLOMERO DE 2da.",
  "ELECTRICISTA DE 2da.", "GRANITERO DE 2da.", "PINTOR DE 2da.", "IMPERMEABILIZADOR DE 2da.",
  "GÜINCHERO", "MAQUINISTA DE CONCRETO DE 2da.", "OPERADOR DE PLANTA FIJA DE 2da.",
  "CHOFER DE 3ra. (HASTA 3 TONS)", "OPERADOR DE EQUIPO PERFORADOR", "OPERADOR DE EQUIPO LIVIANO",
  "ENGRASADOR", "CAUCHERO", "MECÁNICO DE GASOLINA DE 2da.", "SOLDADOR DE 3ra.",
  "LATONERO DE 2da.", "INSTALADOR ELECTRICOMECANICO DE 2da.", "OPERADOR EQUIPO DE SANDBLASTING",
  "MAQUINISTA DE CONCRETO de 1ra.", "OPERADOR DE PLANTA FIJA DE 1ra.", "CHOFER DE 2da. (DE 3 A 8 TONS)",
  "OPERADOR DE PALA HASTA 1YARDA CUB.", "MECANICO DE GASOLINA DE 1ra.", "SOLDADOR DE 2da.",
  "OPERADOR DE PAVIMENTADORA", "ALBAÑIL DE 1ra.", "CARPINTERO DE 1ra.", "CABILLERO DE 1ra.",
  "PLOMERO DE 1ra.", "ELECTRICISTA DE 1ra.", "GRANITERO DE 1ra.", "PINTOR DE 1ra.",
  "IMPERMEABILIZADOR DE 1ra.", "CHOFER DE 1ra. (DE 8 A 15 TONS)", "OPERADOR DE EQUIPO PESADO DE 2da.",
  "TRACTORISTA DE 2da.", "OPERADOR DE MOTOTRAILLA DE 2da.", "OPERADOR DE MOTONIVELADORA DE 2da.",
  "OPERADOR DE GRUA (GRUERO) DE 2da.", "MECANICO EQUIPO PESADO DE 2da.", "OPERADOR MAQUINAS-HERRAMIENTAS 2da.",
  "SOLDADOR DE 1ra.", "TUBERO FABRICADOR", "MONTADOR", "LATONERO DE 1ra.",
  "INSTALADOR ELECTRICOMECANICO DE 1ra.", "LINIERO DE 1ra.", "ALBAÑIL REFRACTARIO",
  "DEPOSITARIO", "DUCTERO", "ARMADOR METALICO", "MAESTRO CARPINTERO DE 2da.",
  "CHOFER DE CAMIÓN MAS DE 15 TONS.", "CHOFER DE GANDOLA DE 2da. (DE 15-40T)",
  "CHOFER DE CAMIÓN MEZCLADOR", "OPERADOR DE PALA MAS 1YARDA CUB. DE 2da.", "PROYECTADOR DE CONCRETO",
  "CHOFER DE VOLTEO DE 30 O MAS TONELADAS", "MAESTRO ALBAÑIL", "MAESTRO CARPINTERO DE 1ra.",
  "MAESTRO CABILLERO", "MAESTRO PLOMERO DE 1ra.", "MAESTRO ELECTRICISTA", "MAESTRO GRANITERO",
  "MAESTRO PINTOR", "MAESTRO IMPERMEABILIZADOR", "MAESTRO DE OBRA DE 2da.",
  "CHOFER DE GANDOLA DE 1ra. (TODO TON.)", "DINAMITERO", "CAPORAL DE EQUIPO",
  "MAESTRO DE OBRAS ELECTROMECANICAS", "ALINEADOR DE GRUA (REGGE)", "MINERO", "MAESTRO DE VOLADURAS",
  "OPERADOR DE EQUIPO PESADO de 1ra.", "TRACTORISTA DE 1ra.", "OPERADOR DE MOTOTRAILLA DE 1ra.",
  "OPERADOR DE PALA MAS 1YARDA CUB. DE 1ra.", "OPERADOR DE MOTONIVELADORA DE 1ra.",
  "OPERADOR DE GRÚA (GRUERO) DE 1ra.", "MECÁNICO EQUIPO PESADO DE 1ra.", "OPERADOR MÁQUINAS-HERRAMIENTAS 1ra.",
  "OPERADOR DE PLANTA", "OPERADOR DE ALIVA", "MAESTRO DE OBRA de 1ra.", "MAESTRO MECÁNICO"
];

interface WorkersProps {
  project?: Project | any;
  type?: 'OBRERO' | 'EMPLEADO' | null;
  onNavigate: (view: any, data?: any) => void;
}

const Workers: React.FC<WorkersProps> = ({ project, type, onNavigate }) => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCargo, setFilterCargo] = useState('');
  const [filterAgeRange, setFilterAgeRange] = useState('');
  const [filterProject, setFilterProject] = useState(project?.id || '');
  const [projectsList, setProjectsList] = useState<any[]>([]);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('workers').select('*');

      if (filterProject) {
        query = query.eq('project_id', filterProject);
      }

      if (type) {
        // Assuming there is a field for type or we can infer it
        // For now, if we have a type, we could filter by category if it exists
      }

      const { data, error } = await query.order('first_name');

      if (error) throw error;
      setWorkers(data || []);
    } catch (error: any) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    try {
      const { data } = await supabase.from('projects').select('id, name');
      setProjectsList(data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  useEffect(() => {
    fetchWorkers();
    fetchProjects();
  }, [filterProject, type]);

  const filteredWorkers = useMemo(() => {
    return workers.filter(worker => {
      const searchLower = searchTerm.toLowerCase();
      // Map database snake_case to frontend camelCase if necessary or use snake_case
      const firstName = worker.first_name || worker.firstName || '';
      const firstSurname = worker.first_surname || worker.firstSurname || '';
      const idNumber = worker.id_number || worker.idNumber || '';
      const specialty = worker.specialty || '';
      const age = worker.age || 0;

      const searchMatch = !searchTerm ||
        firstName.toLowerCase().includes(searchLower) ||
        firstSurname.toLowerCase().includes(searchLower) ||
        idNumber.includes(searchTerm);

      const cargoMatch = !filterCargo || specialty === filterCargo;

      let ageMatch = true;
      if (filterAgeRange === '18-25') ageMatch = age >= 18 && age <= 25;
      else if (filterAgeRange === '26-45') ageMatch = age >= 26 && age <= 45;
      else if (filterAgeRange === '46+') ageMatch = age >= 46;

      return searchMatch && cargoMatch && ageMatch;
    });
  }, [workers, searchTerm, filterCargo, filterAgeRange]);

  const getTitle = () => {
    if (project) return type === 'EMPLEADO' ? `Empleados - ${project.name}` : `Obreros - ${project.name}`;
    return 'Padrón Electoral de Trabajadores';
  };

  const clearFilters = () => {
    setFilterCargo('');
    setFilterAgeRange('');
    setFilterProject(project?.id || '');
    setSearchTerm('');
  };

  const hasActiveFilters = filterCargo || filterAgeRange || (filterProject && !project?.id) || searchTerm;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="pt-12 pb-6 px-6 sticky top-0 z-40 bg-stone-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(project ? 'PROJECTS' : 'DASHBOARD')}
              className="text-slate-400 p-1 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="text-2xl font-bold tracking-tight">
              {getTitle()}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-full flex items-center justify-center apple-button border transition-all ${showFilters ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
            >
              <span className="material-symbols-outlined text-xl leading-none">tune</span>
            </button>
            <button
              onClick={() => onNavigate('WORKER_FORM', { project_id: project?.id })}
              className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center apple-button shadow-lg shadow-primary/20"
              title="Registrar Trabajador"
            >
              <span className="material-symbols-outlined text-xl leading-none">person_add</span>
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mb-6 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 gap-4 bg-white/5 p-5 rounded-[2rem] border border-white/10">
              {!project && (
                <div className="space-y-1.5">
                  <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-1">Obra / Proyecto</label>
                  <select
                    value={filterProject}
                    onChange={(e) => setFilterProject(e.target.value)}
                    className="w-full glass-input rounded-xl px-4 py-2.5 text-xs bg-stone-900 border-white/5"
                  >
                    <option value="">Todas las obras</option>
                    {projectsList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-1">Cargo u Oficio</label>
                <select
                  value={filterCargo}
                  onChange={(e) => setFilterCargo(e.target.value)}
                  className="w-full glass-input rounded-xl px-4 py-2.5 text-xs bg-stone-900 border-white/5"
                >
                  <option value="">Todos los cargos</option>
                  {SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-1">Rango Etario</label>
                <div className="flex gap-2">
                  {['', '18-25', '26-45', '46+'].map(range => (
                    <button
                      key={range}
                      onClick={() => setFilterAgeRange(range)}
                      className={`flex-1 py-2 rounded-lg text-[9px] font-bold uppercase border transition-all ${filterAgeRange === range ? 'bg-primary/20 border-primary text-primary' : 'bg-white/5 border-white/10 text-slate-500'}`}
                    >
                      {range || 'Todos'}
                    </button>
                  ))}
                </div>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:text-white transition-colors"
                >
                  Limpiar Filtros
                </button>
              )}
            </div>
          </div>
        )}

        <div className="relative group px-1">
          <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-slate-500">search</span>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full glass-input rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/50"
            placeholder={`Filtrar por nombre o CI...`}
            type="text"
          />
        </div>

        <div className="flex justify-between items-center mt-4 px-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
            {loading ? 'Consultando...' : `Mostrando ${filteredWorkers.length} registros`}
          </p>
          {hasActiveFilters && <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>}
        </div>
      </header>

      <main className="flex-1 px-4 space-y-4 pb-32 mt-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Accediendo a la nómina...</p>
          </div>
        ) : filteredWorkers.length > 0 ? (
          filteredWorkers.map(worker => {
            const firstName = worker.first_name || worker.firstName || '';
            const firstSurname = worker.first_surname || worker.firstSurname || '';
            const idNumber = worker.id_number || worker.idNumber || '';
            const specialty = worker.specialty || '';
            const age = worker.age || 0;
            const photo = worker.photo || `https://ui-avatars.com/api/?name=${firstName}+${firstSurname}&background=random&color=fff&size=200`;

            return (
              <div key={worker.id} className="glass-card rounded-apple p-4 flex items-center gap-4 transition-transform active:scale-[0.98]">
                <div className="relative shrink-0">
                  <img
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-lg"
                    alt={firstName}
                    src={photo}
                  />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-stone-950 rounded-full shadow-sm ${worker.status === 'ACTIVE' ? 'bg-green-500' : 'bg-amber-500'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white truncate text-base">{firstName} {firstSurname}</h3>
                      {(worker.status === 'ACTIVE' || !worker.status) && <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>}
                    </div>
                    <span className="text-[10px] font-bold text-slate-500 px-2 py-0.5 bg-white/5 rounded-md border border-white/5">{age} años</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black truncate max-w-[150px]">{specialty || 'SIN CARGO'}</span>
                    <span className="text-slate-700 font-bold">|</span>
                    <span className="text-[10px] text-slate-500 font-mono">{idNumber}</span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => onNavigate('WORKER_PROFILE', worker)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-primary/10 text-primary border border-primary/20 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      Expediente
                    </button>
                    <button
                      onClick={() => onNavigate('WORKER_CARNET', worker)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white/5 text-slate-400 border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">badge</span>
                      Carnet
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center p-16 text-center opacity-40">
            <span className="material-symbols-outlined text-7xl mb-4 text-slate-700">person_off</span>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-500">No hay personal registrado</p>
            <button
              onClick={() => onNavigate('WORKER_FORM', { project_id: project?.id })}
              className="mt-4 text-primary font-black uppercase text-[10px] tracking-widest"
            >
              Registrar Nuevo Ingreso
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Workers;
