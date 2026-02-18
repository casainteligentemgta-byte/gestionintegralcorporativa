import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { Project } from '../types';
import { SPECIALTIES } from '../constants';
import * as XLSX from 'xlsx';



interface WorkersProps {
  project?: Project | any;
  type?: 'OBRERO' | 'EMPLEADO' | 'PENDING_REVIEW' | null;
  onNavigate: (view: any, data?: any) => void;
}

const Workers: React.FC<WorkersProps> = ({ project, type, onNavigate }) => {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterCargo, setFilterCargo] = useState('');
  const [filterAgeRange, setFilterAgeRange] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState(project?.id || '');
  const [projectsList, setProjectsList] = useState<any[]>([]);
  const [showRecruitmentLink, setShowRecruitmentLink] = useState(false);
  const [selectedWorkers, setSelectedWorkers] = useState<Set<string>>(new Set());
  const [userRole, setUserRole] = useState<string | null>(null);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      let query = supabase.from('workers').select('*');

      if (filterProject) {
        query = query.eq('current_project_id', filterProject);
      }

      if (type) {
        // Assuming there is a field for type or we can infer it
      }

      const { data, error } = await query.order('first_name');

      if (error) throw error;
      setWorkers(data || []);
      setPendingCount(data?.filter((w: any) => w.status === 'PENDING_REVIEW').length || 0);
    } catch (error: any) {
      console.error('Error fetching workers:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSelection = (id: string) => {
    const next = new Set(selectedWorkers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedWorkers(next);
  };

  const toggleSelectAll = () => {
    if (selectedWorkers.size === filteredWorkers.length) {
      setSelectedWorkers(new Set());
    } else {
      setSelectedWorkers(new Set(filteredWorkers.map(w => w.id)));
    }
  };

  const handleShareWorkers = async () => {
    const toShare = selectedWorkers.size > 0
      ? workers.filter(w => selectedWorkers.has(w.id))
      : filteredWorkers;

    let message = `*NOMINA PERSONAL - ${project?.name || 'DIMAQUINAS'}*\n\n`;
    toShare.forEach(w => {
      message += `• *${w.first_name} ${w.first_surname}* | CI: ${w.id_number} | ${w.specialty || 'Sin Cargo'}\n`;
    });

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Nómina Personal', text: message });
      } catch (err) { console.error(err); }
    } else {
      await navigator.clipboard.writeText(message);
      alert('Nómina copiada al portapapeles');
    }
  };

  const handleDeleteWorker = async (id: string, name: string) => {
    if (confirm(`¿Eliminar permanentemente a ${name}? Esta acción no se puede deshacer.`)) {
      try {
        const { error } = await supabase.from('workers').delete().eq('id', id);
        if (error) throw error;
        await fetchWorkers();
      } catch (error) {
        console.error(error);
        alert('Error al eliminar registro');
      }
    }
  };

  const handleDeleteSelectedWorkers = async () => {
    if (selectedWorkers.size === 0) return;
    if (confirm(`¿Eliminar permanentemente los ${selectedWorkers.size} trabajadores seleccionados?`)) {
      try {
        setLoading(true);
        const { error } = await supabase.from('workers').delete().in('id', Array.from(selectedWorkers));
        if (error) throw error;
        setSelectedWorkers(new Set());
        await fetchWorkers();
        alert('Registros eliminados correctamente');
      } catch (error) {
        console.error(error);
        alert('Error en eliminación masiva');
      } finally {
        setLoading(false);
      }
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
    if (type === 'PENDING_REVIEW') {
      setFilterStatus('PENDING_REVIEW');
      setShowFilters(false);
    }
    fetchWorkers();
    fetchProjects();
    fetchUserRole();
  }, [filterProject, type]);

  const handleExportExcel = () => {
    const dataToExport = filteredWorkers.map(w => ({
      'Nombres': `${w.first_name || w.firstName} ${w.second_name || w.secondName || ''}`,
      'Apellidos': `${w.first_surname || w.firstSurname} ${w.second_surname || w.secondSurname || ''}`,
      'Cédula': `${w.id_type}-${w.id_number || w.idNumber}`,
      'Cargo': w.specialty,
      'Estatus': w.status,
      'Teléfono': w.cell_phone || w.cellPhone,
      'Dirección': w.address,
      'Proyecto': projectsList.find(p => p.id === w.current_project_id)?.name || 'Sin Asignar',
      'IVSS': w.ivss ? 'Sí' : 'No'
    }));

    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Nómina");
    XLSX.writeFile(wb, `Nomina_Personal_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const fetchUserRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      setUserRole(data?.role?.toUpperCase() || null);
    }
  };

  const filteredWorkers = useMemo(() => {
    return workers.filter(worker => {
      const searchLower = searchTerm.toLowerCase().trim();
      const keywords = searchLower ? searchLower.split(/\s+/) : [];

      const firstName = (worker.first_name || worker.firstName || '').toLowerCase();
      const firstSurname = (worker.first_surname || worker.firstSurname || '').toLowerCase();
      const idNumber = (worker.id_number || worker.idNumber || '').toLowerCase();
      const specialty = (worker.specialty || '').toLowerCase();
      const address = (worker.address || '').toLowerCase();
      const age = worker.age || 0;
      const status = worker.status || 'ACTIVE';

      // Multi-keyword search: Each keyword must match at least one field
      const searchMatch = keywords.every(keyword =>
        firstName.includes(keyword) ||
        firstSurname.includes(keyword) ||
        idNumber.includes(keyword) ||
        specialty.includes(keyword) ||
        address.includes(keyword)
      );

      const cargoMatch = !filterCargo || worker.specialty === filterCargo;
      const statusMatch = !filterStatus || status === filterStatus;

      return searchMatch && cargoMatch && statusMatch;
    });
  }, [workers, searchTerm, filterCargo, filterStatus]);


  const clearFilters = () => {
    setFilterCargo('');
    setFilterAgeRange('');
    setFilterStatus('');
    setFilterProject(project?.id || '');
    setSearchTerm('');
    setSelectedWorkers(new Set());
  };

  const hasActiveFilters = filterCargo || filterAgeRange || filterStatus || (filterProject && !project?.id) || searchTerm;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="pt-12 pb-6 px-6 sticky top-0 z-40 bg-stone-950/80 backdrop-blur-lg border-b border-white/5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate(project ? 'PROJECTS' : 'DASHBOARD')}
              className="text-slate-400 p-1 hover:text-white transition-colors"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-primary leading-none mb-1">
                {type === 'PENDING_REVIEW' ? 'POSTULACIONES' : 'NÓMINA OPERATIVA'}
              </p>
              <h1 className="text-xl font-black tracking-tighter text-white leading-tight">
                {type === 'PENDING_REVIEW' ? 'PENDIENTES DE REVISIÓN' : 'DIMAQUINAS, c.a'}
              </h1>
              {selectedWorkers.size > 0 && (
                <p className="text-[9px] font-black uppercase text-amber-500 mt-1">{selectedWorkers.size} Seleccionado(s)</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {selectedWorkers.size > 0 && (
              <button
                onClick={handleDeleteSelectedWorkers}
                className="w-8 h-8 rounded-full flex items-center justify-center apple-button border border-red-500/20 bg-red-500/10 text-red-500 transition-all hover:bg-red-500/20 animate-in fade-in zoom-in"
                title="Eliminar Seleccionados"
              >
                <span className="material-symbols-outlined text-lg leading-none">delete_sweep</span>
              </button>
            )}
            <button
              onClick={handleExportExcel}
              className="w-8 h-8 rounded-full flex items-center justify-center apple-button border border-white/10 bg-white/5 text-emerald-400 transition-all hover:bg-emerald-500/10 hover:border-emerald-500/30"
              title="Exportar a Excel"
            >
              <span className="material-symbols-outlined text-lg leading-none">table_view</span>
            </button>
            <button
              onClick={handleShareWorkers}
              className="w-8 h-8 rounded-full flex items-center justify-center apple-button border border-white/10 bg-white/5 text-slate-400 transition-all hover:text-primary hover:border-primary/30"
              title="Compartir"
            >
              <span className="material-symbols-outlined text-lg leading-none">share</span>
            </button>
            <div className="relative">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`w-8 h-8 rounded-full flex items-center justify-center apple-button border transition-all ${showFilters ? 'bg-primary border-primary text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                title="Filtros"
              >
                <span className="material-symbols-outlined text-lg leading-none">tune</span>
              </button>
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </div>
            {project && (
              <button
                onClick={() => setShowRecruitmentLink(!showRecruitmentLink)}
                className={`w-10 h-10 rounded-full flex items-center justify-center apple-button border transition-all ${showRecruitmentLink ? 'bg-amber-500 border-amber-500 text-white' : 'bg-amber-500/10 border-amber-500/30 text-amber-500'}`}
                title="Link de Reclutamiento"
              >
                <span className="material-symbols-outlined text-xl leading-none">qr_code_2</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('WORKER_FORM', { project_id: project?.id })}
              className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center apple-button shadow-lg shadow-primary/20"
              title="Registrar Trabajador"
            >
              <span className="material-symbols-outlined text-xl leading-none">person_add</span>
            </button>
          </div>
        </div>

        {/* Switcher Personal */}
        {type !== 'PENDING_REVIEW' && (
          <div className="flex p-0.5 bg-white/5 rounded-xl border border-white/10 w-44 mb-4">
            <button
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-primary text-black shadow-lg shadow-primary/20"
            >
              Obreros
            </button>
            <button
              onClick={() => onNavigate('EMPLOYEES', project)}
              className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-stone-500 hover:text-white transition-all"
            >
              Empleados
            </button>
          </div>
        )}

        {showRecruitmentLink && project && (
          <div className="mb-6 animate-in zoom-in-95 duration-300">
            <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/?recruit_proj=${project.id}&recruit_comp=${project.company_id || ''}`)}`}
                  alt="QR Code"
                  className="w-12 h-12"
                />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Link de Auto-Registro</h3>
                <p className="text-[10px] text-stone-500 leading-relaxed max-w-[200px]">
                  Envía este enlace a los obreros para que llenen su planilla desde su celular.
                </p>
              </div>
              <div className="flex gap-2 w-full mt-2">
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/?recruit_proj=${project.id}&recruit_comp=${project.company_id || ''}`;
                    navigator.clipboard.writeText(url);
                    alert('¡Link copiado al portapapeles!');
                  }}
                  className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20"
                >
                  Copiar Link
                </button>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/?recruit_proj=${project.id}&recruit_comp=${project.company_id || ''}`;
                    if (navigator.share) {
                      navigator.share({
                        title: `Registro de Personal - ${project.name}`,
                        text: 'Llene su planilla de ingreso aquí:',
                        url: url
                      });
                    }
                  }}
                  className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center"
                >
                  <span className="material-symbols-outlined text-amber-500">share</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {showFilters && (
          <div className="mb-6 space-y-4 animate-in slide-in-from-top duration-300">
            <div className="grid grid-cols-1 gap-4 bg-white/5 p-5 rounded-[2rem] border border-white/10">
              {type !== 'PENDING_REVIEW' && (
                <>
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
                    <label className="text-[10px] text-slate-500 uppercase font-black tracking-widest px-1">Estatus</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full glass-input rounded-xl px-4 py-2.5 text-xs bg-stone-900 border-white/5"
                    >
                      <option value="">Todos los estatus</option>
                      <option value="PENDING_REVIEW">⚠️ Pendiente de Revisión</option>
                      <option value="ACTIVE">Activos</option>
                      <option value="PENDING">En Proceso</option>
                      <option value="INACTIVE">Inactivos</option>
                    </select>
                  </div>
                </>
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
            placeholder={`Busca por nombre, CI, cargo o dirección...`}
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
            const secondName = worker.second_name || worker.secondName || '';
            const firstSurname = worker.first_surname || worker.firstSurname || '';
            const secondSurname = worker.second_surname || worker.secondSurname || '';
            const fullName = `${firstName} ${secondName} ${firstSurname} ${secondSurname}`.replace(/\s+/g, ' ').trim();
            const idNumber = worker.id_number || worker.idNumber || '';
            const specialty = worker.specialty || '';
            const age = worker.age || 0;
            const photo = worker.photo || `https://ui-avatars.com/api/?name=${firstName}+${firstSurname}&background=random&color=fff&size=200`;
            const isSelected = selectedWorkers.has(worker.id);

            return (
              <div
                key={worker.id}
                onClick={() => {
                  if ((worker.status || '').toUpperCase() === 'PENDING_REVIEW' || (worker.status || '').toUpperCase() === 'PENDING') {
                    onNavigate('HIRING_REVIEW', worker);
                  }
                }}
                className={`glass-card rounded-apple p-4 flex items-center gap-4 transition-all relative ${((worker.status || '').toUpperCase() === 'PENDING_REVIEW' || (worker.status || '').toUpperCase() === 'PENDING') ? 'cursor-pointer hover:bg-white/[0.03] active:scale-[0.98]' : ''} ${isSelected ? 'bg-primary/10 border-primary/30' : ''}`}
              >
                <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelection(worker.id)}
                    className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                  />
                </div>
                <div className="relative shrink-0 ml-4">
                  <img
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-lg"
                    alt={firstName}
                    src={photo}
                  />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-stone-950 rounded-full shadow-sm ${worker.status === 'ACTIVE' ? 'bg-green-500' : worker.status === 'PENDING' ? 'bg-amber-500 animate-pulse' : 'bg-slate-500'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-white truncate text-sm">{fullName}</h3>
                      {(worker.status === 'PENDING' || worker.status === 'PENDING_REVIEW') && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onNavigate('HIRING_REVIEW', worker);
                          }}
                          className="text-[6.5px] font-black bg-amber-500 hover:bg-amber-600 text-white px-2 py-1 rounded-md uppercase tracking-wider transition-all active:scale-90 shadow-lg shadow-amber-500/20 flex items-center gap-1 whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-[9px]">notification_important</span>
                          En Revisión
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black truncate max-w-[150px]">{specialty || 'SIN CARGO'}</span>
                    <span className="text-slate-700 font-bold">|</span>
                    <span className="text-[10px] text-slate-500 font-mono">{idNumber}</span>
                    <span className="text-slate-700 font-bold">|</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{age} años</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2" onClick={(e) => e.stopPropagation()}>
                    {/* Botón de Revisión removido por solicitud del usuario para usar flujo integrado */}
                    <button
                      onClick={() => onNavigate('WORKER_DIGITAL_SHEET', worker)}
                      className="flex items-center justify-center gap-1 py-1 px-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">inventory</span>
                      Perfil
                    </button>
                    <button
                      onClick={() => onNavigate('WORKER_FORM', worker)}
                      className="flex items-center justify-center gap-1 py-1 px-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">edit</span>
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteWorker(worker.id, `${firstName} ${firstSurname}`)}
                      className="flex items-center justify-center gap-1 py-1 px-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">delete</span>
                      Borrar
                    </button>
                    <button
                      onClick={() => handleShareWorkers()}
                      className="flex items-center justify-center gap-1 py-1 px-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[12px]">share</span>
                      Enviar
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
