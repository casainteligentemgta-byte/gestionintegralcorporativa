import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import { dataService } from '../services/dataService';
import QRCode from 'qrcode';
import * as XLSX from 'xlsx';
import EmployeeDigitalSheet from './EmployeeDigitalSheet';

interface Employee {
    id: string;
    numero_contrato: string;
    primer_nombre: string;
    segundo_nombre?: string | null;
    primer_apellido: string;
    segundo_apellido?: string | null;
    cedula_identidad: string;
    cargo_desempenar?: string | null;
    email?: string | null;
    celular?: string | null;
    status: string;
    qr_code: string;
    qr_url: string;
    edad?: number | string | null;
    foto?: string | null;
    created_at: string;
}

interface RecruitmentFormProps {
    context: { projectId: string; companyId: string; type: 'WORKER' | 'EMPLOYEE' } | null;
    onNavigate: (view: any) => void;
}
interface EmployeesProps {
    project?: any;
    onNavigate: (view: string, data?: any) => void;
}

const Employees: React.FC<EmployeesProps> = ({ project, onNavigate }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [companyName, setCompanyName] = useState<string>('Cargando empresa...');
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployees, setSelectedEmployees] = useState<Set<string>>(new Set());
    const [showFilters, setShowFilters] = useState(false);
    const [showRecruitmentLink, setShowRecruitmentLink] = useState(false);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterPosition, setFilterPosition] = useState('');

    useEffect(() => {
        const initData = async () => {
            await Promise.all([fetchEmployees(), fetchCompany()]);
        };
        initData();
    }, []);

    const fetchCompany = async () => {
        try {
            const companies = await dataService.getCompanies();
            if (companies && companies.length > 0) {
                setCompanyName(companies[0].name);
            } else {
                setCompanyName('Sin Empresa Asignada');
            }
        } catch (error) {
            console.error('Error fetching company:', error);
            setCompanyName('Error al cargar empresa');
        }
    };

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            console.log("🔍 Fetching employees for project:", project?.id || 'all');
            const data = await dataService.getEmployees(project?.id);
            console.log("✅ Employees received:", data?.length, data);
            setEmployees(data || []);
        } catch (error) {
            console.error('❌ Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        try {
            const searchLower = (searchTerm || '').toLowerCase().trim();
            if (!searchLower) return true;

            const firstName = (emp.primer_nombre || '').toLowerCase();
            const secondName = (emp.segundo_nombre || '').toLowerCase();
            const firstSurname = (emp.primer_apellido || '').toLowerCase();
            const secondSurname = (emp.segundo_apellido || '').toLowerCase();
            const cedula = (emp.cedula_identidad || '').toLowerCase();
            const contrato = (emp.numero_contrato || '').toLowerCase();
            const cargo = (emp.cargo_desempenar || '').toLowerCase();

            const fullName = `${firstName} ${secondName} ${firstSurname} ${secondSurname}`.trim();

            const searchMatch = (
                fullName.includes(searchLower) ||
                cedula.includes(searchLower) ||
                contrato.includes(searchLower) ||
                cargo.includes(searchLower)
            );

            const statusMatch = !filterStatus || emp.status === filterStatus;
            const positionMatch = !filterPosition || emp.cargo_desempenar === filterPosition;

            return searchMatch && statusMatch && positionMatch;
        } catch (e) {
            console.error("Error filtering employee:", emp, e);
            return false;
        }
    });

    const positions = useMemo(() => {
        const p = new Set(employees.map(e => e.cargo_desempenar).filter(Boolean));
        return Array.from(p) as string[];
    }, [employees]);

    const hasActiveFilters = filterStatus || filterPosition;

    const clearFilters = () => {
        setFilterStatus('');
        setFilterPosition('');
        setShowFilters(false);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30';
            case 'inactive': return 'bg-stone-500/20 text-stone-400 border-stone-500/30';
            case 'suspended': return 'bg-amber-500/20 text-amber-500 border-amber-500/30';
            case 'terminated': return 'bg-red-500/20 text-red-500 border-red-500/30';
            default: return 'bg-white/5 text-white/60 border-white/10';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'active': return 'Activo';
            case 'inactive': return 'Inactivo';
            case 'suspended': return 'Suspendido';
            case 'terminated': return 'Terminado';
            default: return status;
        }
    };

    const handleExportExcel = () => {
        const toExport = selectedEmployees.size > 0
            ? employees.filter(e => selectedEmployees.has(e.id))
            : filteredEmployees;

        const dataToExport = toExport.map(e => ({
            'Contrato': e.numero_contrato,
            'Nombre': `${e.primer_nombre} ${e.segundo_nombre || ''}`.trim(),
            'Apellido': `${e.primer_apellido} ${e.segundo_apellido || ''}`.trim(),
            'Cédula': e.cedula_identidad,
            'Cargo': e.cargo_desempenar || 'N/A',
            'Email': e.email || 'N/A',
            'Celular': e.celular || 'N/A',
            'Status': getStatusText(e.status)
        }));

        const ws = XLSX.utils.json_to_sheet(dataToExport);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Nómina_Administrativa");
        XLSX.writeFile(wb, `Nomina_Administrativa_${new Date().toISOString().split('T')[0]}.xlsx`);
    };

    const handleShareEmployees = async () => {
        const toShare = selectedEmployees.size > 0
            ? employees.filter(e => selectedEmployees.has(e.id))
            : filteredEmployees;

        let message = `*NÓMINA ADMINISTRATIVA - ${project ? project.name : companyName}*\n\n`;
        toShare.forEach(e => {
            message += `• *${e.primer_nombre} ${e.primer_apellido}* | CI: ${e.cedula_identidad} | ${e.cargo_desempenar || 'Sin Cargo'}\n`;
        });

        if (navigator.share) {
            try {
                await navigator.share({ title: 'Nómina Administrativa', text: message });
            } catch (err) { console.error(err); }
        } else {
            await navigator.clipboard.writeText(message);
            alert('Nómina copiada al portapapeles');
        }
    };

    const handleDeleteSelectedEmployees = async () => {
        if (!confirm(`¿Eliminar ${selectedEmployees.size} registros seleccionados?`)) return;

        try {
            setLoading(true);
            const { error } = await supabase
                .from('empleados')
                .delete()
                .in('id', Array.from(selectedEmployees));

            if (error) throw error;
            setSelectedEmployees(new Set());
            await fetchEmployees();
        } catch (error) {
            console.error('Error deleting employees:', error);
            alert('Error al eliminar registros');
        } finally {
            setLoading(false);
        }
    };

    if (showForm || editingEmployee) {
        return (
            <EmployeeForm
                project={project}
                initialData={editingEmployee}
                onBack={() => {
                    setShowForm(false);
                    setEditingEmployee(null);
                    fetchEmployees();
                }}
            />
        );
    }

    if (viewingEmployee) {
        return (
            <EmployeeDigitalSheet
                employee={viewingEmployee as any}
                onBack={() => setViewingEmployee(null)}
            />
        );
    }

    return (
        <div className="p-6 space-y-6 animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <header className="flex flex-col gap-6 mb-2">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => onNavigate(project ? 'PROJECTS' : 'DASHBOARD')}
                            className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                        >
                            <span className="material-symbols-outlined text-stone-400 font-black">arrow_back</span>
                        </button>
                        <div>
                            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-0.5">NÓMINA ADMINISTRATIVA</p>
                            <h1 className="text-xl font-black text-white uppercase tracking-tight leading-none">
                                {project ? project.name : companyName}
                            </h1>
                            <p className="text-[8px] font-bold text-stone-500 mt-1 uppercase">Total Registros: {employees.length}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        {selectedEmployees.size > 0 && (
                            <button
                                onClick={handleDeleteSelectedEmployees}
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
                            onClick={handleShareEmployees}
                            className="w-8 h-8 rounded-full flex items-center justify-center apple-button border border-white/10 bg-white/5 text-slate-400 transition-all hover:text-purple-400 hover:border-purple-400/30"
                            title="Compartir"
                        >
                            <span className="material-symbols-outlined text-lg leading-none">share</span>
                        </button>
                        <div className="relative">
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center apple-button border transition-all ${showFilters ? 'bg-purple-500 border-purple-500 text-white' : 'bg-white/5 border-white/10 text-slate-400'}`}
                                title="Filtros"
                            >
                                <span className="material-symbols-outlined text-lg leading-none">tune</span>
                            </button>
                            {hasActiveFilters && (
                                <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full border-2 border-stone-950"></span>
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
                            onClick={() => setShowForm(true)}
                            className="w-10 h-10 bg-purple-500 text-white rounded-full flex items-center justify-center apple-button shadow-lg shadow-purple-500/20"
                            title="Registrar Empleado"
                        >
                            <span className="material-symbols-outlined text-xl leading-none">person_add</span>
                        </button>
                    </div>
                </div>

                {/* Switcher Personal */}
                <div className="flex p-0.5 bg-white/5 rounded-xl border border-white/10 w-44 mb-4">
                    <button
                        onClick={() => onNavigate('WORKERS', project)}
                        className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest text-stone-500 hover:text-white transition-all"
                    >
                        Obreros
                    </button>
                    <button
                        className="flex-1 flex items-center justify-center gap-1 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-primary text-black shadow-lg shadow-primary/20"
                    >
                        Empleados
                    </button>
                </div>

                {project && showRecruitmentLink && (
                    <div className="mb-6 animate-in zoom-in-95 duration-300">
                        <div className="bg-amber-500/10 border border-amber-500/20 p-6 rounded-[2rem] flex flex-col items-center text-center gap-4">
                            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-xl">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`${window.location.origin}/?recruit_proj=${project.id}&recruit_comp=${project.company_id || ''}&recruit_type=EMPLOYEE`)}`}
                                    alt="QR Code"
                                    className="w-12 h-12"
                                />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-sm font-black text-amber-500 uppercase tracking-widest">Link de Auto-Registro - Administrativo</h3>
                                <p className="text-[10px] text-stone-500 leading-relaxed max-w-[200px]">
                                    Envía este enlace para que los empleados administrativos llenen su planilla.
                                </p>
                            </div>
                            <div className="flex gap-2 w-full mt-2">
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/?recruit_proj=${project.id}&recruit_comp=${project.company_id || ''}&recruit_type=EMPLOYEE`;
                                        navigator.clipboard.writeText(url);
                                        alert('¡Link copiado al portapapeles!');
                                    }}
                                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20"
                                >
                                    Copiar Link
                                </button>
                                <button
                                    onClick={() => {
                                        const url = `${window.location.origin}/?recruit_proj=${project.id}&recruit_comp=${project.company_id || ''}&recruit_type=EMPLOYEE`;
                                        if (navigator.share) {
                                            navigator.share({
                                                title: `Registro de Empleado - ${project.name}`,
                                                text: 'Llene su planilla de ingreso administrativo aquí:',
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

                {/* Filter Panel */}
                {showFilters && (
                    <div className="glass-card rounded-2xl p-4 border border-purple-500/20 animate-in slide-in-from-top duration-300">
                        <div className="flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400">Filtros Avanzados</h3>
                                <button onClick={clearFilters} className="text-[9px] font-bold text-stone-500 hover:text-white uppercase transition-colors">Limpiar</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-stone-500 uppercase ml-1">Estatus</label>
                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] font-bold text-white focus:outline-none focus:border-purple-500/50"
                                    >
                                        <option value="">Todos los Estatus</option>
                                        <option value="active">Activo</option>
                                        <option value="inactive">Inactivo</option>
                                        <option value="suspended">Suspendido</option>
                                        <option value="terminated">Terminado</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[9px] font-bold text-stone-500 uppercase ml-1">Cargo / Posición</label>
                                    <select
                                        value={filterPosition}
                                        onChange={(e) => setFilterPosition(e.target.value)}
                                        className="w-full h-10 bg-white/5 border border-white/10 rounded-xl px-3 text-[10px] font-bold text-white focus:outline-none focus:border-purple-500/50"
                                    >
                                        <option value="">Todos los Cargos</option>
                                        {positions.map(p => (
                                            <option key={p} value={p}>{p}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </header>

            {/* Search Bar */}
            <div className="glass-card rounded-apple p-4 border border-white/5">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Busca por nombre, CI, cargo o dirección..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
            </div>

            {/* Employee List */}
            {
                loading ? (
                    <div className="flex items-center justify-center py-20">
                        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    </div>
                ) : filteredEmployees.length === 0 ? (
                    <div className="glass-card rounded-apple p-12 text-center border border-white/5">
                        <span className="material-symbols-outlined text-6xl text-stone-700 mb-4">badge</span>
                        <h3 className="text-lg font-bold text-white mb-2">
                            {searchTerm ? 'No se encontraron empleados' : 'No hay empleados registrados'}
                        </h3>
                        <p className="text-sm text-stone-500 mb-6">
                            {searchTerm ? 'Intenta con otros términos de búsqueda' : 'Comienza agregando tu primer empleado'}
                        </p>
                        {!searchTerm && (
                            <button
                                onClick={() => setShowForm(true)}
                                className="h-12 px-6 bg-primary text-black font-bold rounded-xl hover:scale-105 transition-transform"
                            >
                                Agregar Primer Empleado
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-3">
                        {filteredEmployees.map((employee) => (
                            <EmployeeCard
                                key={employee.id}
                                employee={employee}
                                isSelected={selectedEmployees.has(employee.id)}
                                onToggleSelection={() => {
                                    const next = new Set(selectedEmployees);
                                    if (next.has(employee.id)) next.delete(employee.id);
                                    else next.add(employee.id);
                                    setSelectedEmployees(next);
                                }}
                                onEdit={() => setEditingEmployee(employee)}
                                onView={() => setViewingEmployee(employee)}
                                onDelete={async () => {
                                    if (confirm('¿Estás seguro de eliminar este empleado?')) {
                                        try {
                                            setLoading(true);
                                            const { error } = await supabase.from('empleados').delete().eq('id', employee.id);
                                            if (error) throw error;
                                            await fetchEmployees();
                                        } catch (err: any) {
                                            alert('Error al eliminar: ' + err.message);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }
                                }}
                            />
                        ))}
                    </div>
                )
            }

        </div >
    );
};

// Employee Card Component
const EmployeeCard: React.FC<{
    employee: Employee;
    isSelected: boolean;
    onToggleSelection: () => void;
    onEdit: () => void;
    onView: () => void;
    onDelete: () => void;
}> = ({ employee, isSelected, onToggleSelection, onEdit, onView, onDelete }) => {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        if (employee.qr_url) {
            QRCode.toDataURL(employee.qr_url, { width: 200, margin: 1 })
                .then(setQrDataUrl)
                .catch(console.error);
        }
    }, [employee.qr_url]);

    const fullName = `${employee.primer_nombre} ${employee.segundo_nombre || ''} ${employee.primer_apellido} ${employee.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();
    const photo = employee.foto || `https://ui-avatars.com/api/?name=${employee.primer_nombre}+${employee.primer_apellido}&background=random&color=fff&size=200`;

    return (
        <div className="group relative">
            <div className={`glass-card rounded-apple p-4 flex items-center gap-4 transition-all relative ${isSelected ? 'bg-primary/10 border-primary/30' : 'border-white/5 hover:border-primary/20'}`}>
                <div className="absolute top-3 left-3 z-10" onClick={(e) => e.stopPropagation()}>
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={onToggleSelection}
                        className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50"
                    />
                </div>

                <div className="relative shrink-0 ml-4">
                    <img
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-primary/20 shadow-lg"
                        alt={employee.primer_nombre}
                        src={photo}
                    />
                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-stone-950 rounded-full shadow-sm ${employee.status === 'active' ? 'bg-green-500' : 'bg-slate-500'}`}></div>
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-white truncate text-sm">{fullName}</h3>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black truncate max-w-[150px]">{employee.cargo_desempenar || 'SIN CARGO'}</span>
                        <span className="text-slate-700 font-bold">|</span>
                        <span className="text-[10px] text-slate-500 font-mono">{employee.cedula_identidad}</span>
                        <span className="text-slate-700 font-bold">|</span>
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{employee.edad || '--'} años</span>
                    </div>

                    <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
                        <button
                            onClick={() => setShowQR(!showQR)}
                            className="flex items-center justify-center gap-1 py-1 px-2 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-indigo-500/20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[12px]">qr_code</span>
                            Identidad
                        </button>
                        <button
                            onClick={onView}
                            className="flex items-center justify-center gap-1 py-1 px-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[12px]">visibility</span>
                            Ver
                        </button>
                        <button
                            onClick={onEdit}
                            className="flex items-center justify-center gap-1 py-1 px-2 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[12px]">edit</span>
                            Editar
                        </button>
                        <button
                            onClick={onDelete}
                            className="flex items-center justify-center gap-1 py-1 px-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[12px]">delete</span>
                            Borrar
                        </button>
                        <button
                            onClick={() => {/* TODO: Implement share */ }}
                            className="flex items-center justify-center gap-1 py-1 px-2 bg-blue-500/10 text-blue-500 border border-blue-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-blue-500/20 transition-colors"
                        >
                            <span className="material-symbols-outlined text-[12px]">share</span>
                            Enviar
                        </button>
                    </div>
                </div>
            </div>

            {/* Expansión de QR */}
            {showQR && qrDataUrl && (
                <div className="p-4 bg-white rounded-2xl flex items-center justify-center gap-6 animate-in slide-in-from-top-2 duration-300 mx-4 border-x border-b border-white/10 shadow-2xl relative z-10 -mt-2">
                    <img src={qrDataUrl} alt="QR Code" className="w-16 h-16" />
                    <div className="flex flex-col">
                        <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest mb-1">Acceso Digital</p>
                        <p className="text-lg font-black text-stone-900 font-mono">{employee.qr_code}</p>
                        <p className="text-[9px] text-stone-500 italic">ID Contrato: {employee.numero_contrato}</p>
                    </div>
                    <button
                        onClick={() => setShowQR(false)}
                        className="absolute top-2 right-2 text-stone-300 hover:text-stone-900"
                    >
                        <span className="material-symbols-outlined text-sm">close</span>
                    </button>
                </div>
            )}
        </div>
    );
};

// Full Employee Form Component
const EmployeeForm: React.FC<{ onBack: () => void; project?: any; context?: RecruitmentFormProps['context']; initialData?: Employee | null }> = ({ onBack, project, context, initialData }) => {
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('BASICO');
    const [formData, setFormData] = useState({
        // I. IDENTIFICACIÓN
        primer_nombre: '', segundo_nombre: '', primer_apellido: '', segundo_apellido: '',
        cedula_identidad: '', edad: '', estado_civil: 'soltero',

        // III. CONTRATACIÓN
        fecha_ingreso: new Date().toISOString().split('T')[0],
        cargo_desempenar: '', salario_basico: '', forma_pago: 'transferencia',
        lugar_pago: '', jornada_trabajo: 'diurna', objeto_contrato: '',

        // IV. PERSONALES
        lugar_nacimiento: '', pais_nacimiento: 'Venezuela', fecha_nacimiento: '',
        nacionalidad: 'Venezolana', celular: '', telefono_habitacion: '',
        email: '', direccion_domicilio: '', inscripcion_ivss: '', es_zurdo: false,
        instruccion_primaria: '', instruccion_secundaria: '', instruccion_tecnica: '',
        instruccion_superior: '', profesion_oficio_actual: '',

        // V. MÉDICOS
        examen_medico_previo: false, examen_efectuado_por: '', tipo_sangre: 'O+',
        enfermedades_padecidas: '', incapacidades_fisicas: '',

        // VI. PESO Y MEDIDAS
        peso: '', estatura: '', talla_camisa: '', talla_pantalon: '',
        talla_bragas: '', medida_botas: '', observaciones_medidas: '',
    });

    const [dependientes, setDependientes] = useState<any[]>([]);
    const [experiencias, setExperiencias] = useState<any[]>([]);

    useEffect(() => {
        if (initialData) {
            // Fetch the full employee record if only partial data is in initialData
            const fetchFullEmployee = async () => {
                const { data, error } = await supabase.from('empleados').select('*').eq('id', initialData.id).single();
                if (data) {
                    setFormData({
                        primer_nombre: data.primer_nombre || '',
                        segundo_nombre: data.segundo_nombre || '',
                        primer_apellido: data.primer_apellido || '',
                        segundo_apellido: data.segundo_apellido || '',
                        cedula_identidad: data.cedula_identidad || '',
                        edad: data.edad?.toString() || '',
                        estado_civil: data.estado_civil || 'soltero',
                        fecha_ingreso: data.fecha_ingreso || new Date().toISOString().split('T')[0],
                        cargo_desempenar: data.cargo_desempenar || '',
                        salario_basico: data.salario_basico?.toString() || '',
                        forma_pago: data.forma_pago || 'transferencia',
                        lugar_pago: data.lugar_pago || '',
                        jornada_trabajo: data.jornada_trabajo || 'diurna',
                        objeto_contrato: data.objeto_contrato || '',
                        lugar_nacimiento: data.lugar_nacimiento || '',
                        pais_nacimiento: data.pais_nacimiento || 'Venezuela',
                        fecha_nacimiento: data.fecha_nacimiento || '',
                        nacionalidad: data.nacionalidad || 'Venezolana',
                        celular: data.celular || '',
                        telefono_habitacion: data.telefono_habitacion || '',
                        email: data.email || '',
                        direccion_domicilio: data.direccion_domicilio || '',
                        inscripcion_ivss: data.inscripcion_ivss || '',
                        es_zurdo: !!data.es_zurdo,
                        instruccion_primaria: data.instruccion_primaria || '',
                        instruccion_secundaria: data.instruccion_secundaria || '',
                        instruccion_tecnica: data.instruccion_tecnica || '',
                        instruccion_superior: data.instruccion_superior || '',
                        profesion_oficio_actual: data.profesion_oficio_actual || '',
                        examen_medico_previo: !!data.examen_medico_previo,
                        examen_efectuado_por: data.examen_efectuado_por || '',
                        tipo_sangre: data.tipo_sangre || 'O+',
                        enfermedades_padecidas: data.enfermedades_padecidas || '',
                        incapacidades_fisicas: data.incapacidades_fisicas || '',
                        peso: data.peso?.toString() || '',
                        estatura: data.estatura?.toString() || '',
                        talla_camisa: data.talla_camisa || '',
                        talla_pantalon: data.talla_pantalon || '',
                        talla_bragas: data.talla_bragas || '',
                        medida_botas: data.medida_botas || '',
                        observaciones_medidas: data.observaciones_medidas || '',
                    });
                    setDependientes(data.dependientes || []);
                    setExperiencias(data.experiencias_previas || []);
                }
            };
            fetchFullEmployee();
        }
    }, [initialData]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const dataToSave = {
                ...formData,
                dependientes,
                experiencias_previas: experiencias,
                status: initialData ? initialData.status : 'active',
                project_id: project?.id || null,
                worker_type: context?.type || 'EMPLOYEE',
                peso: formData.peso === '' ? null : parseFloat(formData.peso),
                estatura: formData.estatura === '' ? null : parseFloat(formData.estatura),
                edad: formData.edad === '' ? null : parseInt(formData.edad),
            };

            const { error } = initialData
                ? await supabase.from('empleados').update(dataToSave).eq('id', initialData.id)
                : await supabase.from('empleados').insert([dataToSave]);

            if (error) throw error;
            alert(initialData ? '¡Empleado actualizado!' : '¡Empleado registrado con éxito!');
            onBack();
        } catch (err: any) {
            console.error(err);
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const tabs = [
        { id: 'BASICO', label: 'Identificación', icon: 'person' },
        { id: 'CONTRATO', label: 'Contratación', icon: 'description' },
        { id: 'PERSONAL', label: 'Personales', icon: 'home' },
        { id: 'MEDICO', label: 'Médico/Medidas', icon: 'medical_services' },
        { id: 'FAMILIA', label: 'Familia/Exp', icon: 'groups' }
    ];

    return (
        <div className="p-6 pb-32 animate-in fade-in duration-500">
            <header className="flex items-center gap-4 mb-8">
                <button onClick={onBack} className="h-10 w-10 flex items-center justify-center rounded-apple bg-white/5 border border-white/10 text-stone-400">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-xl font-black text-purple-400 uppercase tracking-widest">Datos del Empleado Administrativo</h1>
                    <p className="text-[10px] text-stone-500 font-bold uppercase tracking-widest">Registro de Personal de Oficina y Gerencia</p>
                </div>
            </header>

            {/* Tabs Navigation */}
            <nav className="flex gap-2 overflow-x-auto pb-4 mb-6 no-scrollbar">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${activeTab === tab.id
                            ? 'bg-primary text-black border-primary'
                            : 'bg-white/5 text-stone-500 border-white/10'
                            }`}
                    >
                        <span className="material-symbols-outlined text-sm">{tab.icon}</span>
                        {tab.label}
                    </button>
                ))}
            </nav>

            <form onSubmit={handleSubmit} className="space-y-6 max-w-4xl mx-auto">
                {/* TAB: BÁSICO */}
                {activeTab === 'BASICO' && (
                    <div className="glass-card p-6 md:p-10 rounded-[2.5rem] border-white/5 space-y-8 animate-in slide-in-from-right-4">
                        <div className="flex flex-col gap-6">
                            <FormGroup label="Primer Nombre" required>
                                <input required className="apple-input" value={formData.primer_nombre} onChange={e => setFormData({ ...formData, primer_nombre: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Segundo Nombre">
                                <input className="apple-input" value={formData.segundo_nombre} onChange={e => setFormData({ ...formData, segundo_nombre: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Primer Apellido" required>
                                <input required className="apple-input" value={formData.primer_apellido} onChange={e => setFormData({ ...formData, primer_apellido: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Segundo Apellido">
                                <input className="apple-input" value={formData.segundo_apellido} onChange={e => setFormData({ ...formData, segundo_apellido: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Cédula de Identidad" required>
                                <input required className="apple-input font-mono" value={formData.cedula_identidad} onChange={e => setFormData({ ...formData, cedula_identidad: e.target.value })} />
                            </FormGroup>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormGroup label="Edad">
                                    <input type="number" className="apple-input" value={formData.edad} onChange={e => setFormData({ ...formData, edad: e.target.value })} />
                                </FormGroup>
                                <FormGroup label="Estado Civil">
                                    <select className="apple-input px-4" value={formData.estado_civil} onChange={e => setFormData({ ...formData, estado_civil: e.target.value })}>
                                        <option value="soltero">Soltero/a</option>
                                        <option value="casado">Casado/a</option>
                                        <option value="divorciado">Divorciado/a</option>
                                        <option value="viudo">Viudo/a</option>
                                        <option value="concubinato">Concubinato</option>
                                    </select>
                                </FormGroup>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: CONTRATO */}
                {activeTab === 'CONTRATO' && (
                    <div className="glass-card p-6 md:p-10 rounded-[2.5rem] border-white/5 space-y-8 animate-in slide-in-from-right-4">
                        <div className="flex flex-col gap-6">
                            <FormGroup label="Fecha de Ingreso">
                                <input type="date" className="apple-input font-mono" value={formData.fecha_ingreso} onChange={e => setFormData({ ...formData, fecha_ingreso: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Cargo a Desempeñar">
                                <input className="apple-input" value={formData.cargo_desempenar} onChange={e => setFormData({ ...formData, cargo_desempenar: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Salario Básico ($)">
                                <input type="number" className="apple-input text-primary font-bold" value={formData.salario_basico} onChange={e => setFormData({ ...formData, salario_basico: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Forma de Pago">
                                <select className="apple-input px-4" value={formData.forma_pago} onChange={e => setFormData({ ...formData, forma_pago: e.target.value })}>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="nomina">Nómina Bancaria</option>
                                </select>
                            </FormGroup>
                            <FormGroup label="Jornada de Trabajo">
                                <select className="apple-input px-4" value={formData.jornada_trabajo} onChange={e => setFormData({ ...formData, jornada_trabajo: e.target.value })}>
                                    <option value="diurna">Diurna</option>
                                    <option value="nocturna">Nocturna</option>
                                    <option value="mixta">Mixta</option>
                                </select>
                            </FormGroup>
                            <FormGroup label="Lugar de Pago">
                                <input className="apple-input" value={formData.lugar_pago} onChange={e => setFormData({ ...formData, lugar_pago: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Objeto del Contrato">
                                <textarea className="apple-input min-h-[120px] py-4" value={formData.objeto_contrato} onChange={e => setFormData({ ...formData, objeto_contrato: e.target.value })} />
                            </FormGroup>
                        </div>
                    </div>
                )}

                {/* TAB: PERSONAL */}
                {activeTab === 'PERSONAL' && (
                    <div className="glass-card p-6 md:p-10 rounded-[2.5rem] border-white/5 space-y-8 animate-in slide-in-from-right-4">
                        <div className="flex flex-col gap-6">
                            <FormGroup label="País de Nacimiento">
                                <input className="apple-input" value={formData.pais_nacimiento} onChange={e => setFormData({ ...formData, pais_nacimiento: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Lugar de Nacimiento">
                                <input className="apple-input" value={formData.lugar_nacimiento} onChange={e => setFormData({ ...formData, lugar_nacimiento: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Celular">
                                <input type="tel" className="apple-input font-mono" value={formData.celular} onChange={e => setFormData({ ...formData, celular: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Email">
                                <input type="email" className="apple-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Dirección / Domicilio">
                                <textarea className="apple-input min-h-[100px] py-4" value={formData.direccion_domicilio} onChange={e => setFormData({ ...formData, direccion_domicilio: e.target.value })} />
                            </FormGroup>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white/5 p-6 rounded-[2rem] border border-white/5 mt-4">
                                <FormGroup label="Instrucción Primaria">
                                    <input className="apple-input text-xs" value={formData.instruccion_primaria} onChange={e => setFormData({ ...formData, instruccion_primaria: e.target.value })} />
                                </FormGroup>
                                <FormGroup label="Instrucción Secundaria">
                                    <input className="apple-input text-xs" value={formData.instruccion_secundaria} onChange={e => setFormData({ ...formData, instruccion_secundaria: e.target.value })} />
                                </FormGroup>
                                <FormGroup label="Título / Superior">
                                    <input className="apple-input text-xs" value={formData.instruccion_superior} onChange={e => setFormData({ ...formData, instruccion_superior: e.target.value })} />
                                </FormGroup>
                                <FormGroup label="Oficio Actual">
                                    <input className="apple-input text-xs" value={formData.profesion_oficio_actual} onChange={e => setFormData({ ...formData, profesion_oficio_actual: e.target.value })} />
                                </FormGroup>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: MÉDICO */}
                {activeTab === 'MEDICO' && (
                    <div className="glass-card p-6 md:p-10 rounded-[2.5rem] border-white/5 space-y-8 animate-in slide-in-from-right-4">
                        <div className="flex flex-col gap-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormGroup label="Tipo de Sangre">
                                    <select className="apple-input px-4" value={formData.tipo_sangre} onChange={e => setFormData({ ...formData, tipo_sangre: e.target.value })}>
                                        {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                                    </select>
                                </FormGroup>
                                <FormGroup label="Peso (Kg)">
                                    <input type="number" className="apple-input" value={formData.peso} onChange={e => setFormData({ ...formData, peso: e.target.value })} />
                                </FormGroup>
                                <FormGroup label="Estatura (cm)">
                                    <input type="number" className="apple-input" value={formData.estatura} onChange={e => setFormData({ ...formData, estatura: e.target.value })} />
                                </FormGroup>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormGroup label="Talla Camisa">
                                    <input className="apple-input" value={formData.talla_camisa} onChange={e => setFormData({ ...formData, talla_camisa: e.target.value })} />
                                </FormGroup>
                                <FormGroup label="Talla Pantalón">
                                    <input className="apple-input" value={formData.talla_pantalon} onChange={e => setFormData({ ...formData, talla_pantalon: e.target.value })} />
                                </FormGroup>
                            </div>
                            <FormGroup label="Enfermedades Padecidas">
                                <textarea className="apple-input min-h-[80px] py-4" value={formData.enfermedades_padecidas} onChange={e => setFormData({ ...formData, enfermedades_padecidas: e.target.value })} />
                            </FormGroup>
                        </div>
                    </div>
                )}

                {/* TAB: FAMILIA */}
                {activeTab === 'FAMILIA' && (
                    <div className="space-y-6 animate-in slide-in-from-right-4">
                        <div className="glass-card p-8 rounded-[2rem] border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Familiares Dependientes</h3>
                                <button type="button" onClick={() => setDependientes([...dependientes, { nombre: '', parentesco: '', fecha_nacimiento: '' }])} className="h-8 px-4 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[10px] font-black uppercase">
                                    Añadir
                                </button>
                            </div>
                            <div className="space-y-4">
                                {dependientes.map((d, i) => (
                                    <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <input placeholder="Nombre Completo" className="apple-input text-xs" value={d.nombre} onChange={e => {
                                            const nd = [...dependientes]; nd[i].nombre = e.target.value; setDependientes(nd);
                                        }} />
                                        <input placeholder="Parentesco" className="apple-input text-xs" value={d.parentesco} onChange={e => {
                                            const nd = [...dependientes]; nd[i].parentesco = e.target.value; setDependientes(nd);
                                        }} />
                                        <input type="date" className="apple-input text-xs" value={d.fecha_nacimiento} onChange={e => {
                                            const nd = [...dependientes]; nd[i].fecha_nacimiento = e.target.value; setDependientes(nd);
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="glass-card p-8 rounded-[2rem] border-white/5">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-sm font-black text-white uppercase tracking-widest">Experiencia Laboral</h3>
                                <button type="button" onClick={() => setExperiencias([...experiencias, { empresa: '', cargo: '', duracion: '' }])} className="h-8 px-4 bg-primary/20 text-primary border border-primary/30 rounded-lg text-[10px] font-black uppercase">
                                    Añadir
                                </button>
                            </div>
                            <div className="space-y-4">
                                {experiencias.map((exp, i) => (
                                    <div key={i} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <input placeholder="Empresa" className="apple-input text-xs" value={exp.empresa} onChange={e => {
                                            const ne = [...experiencias]; ne[i].empresa = e.target.value; setExperiencias(ne);
                                        }} />
                                        <input placeholder="Cargo" className="apple-input text-xs" value={exp.cargo} onChange={e => {
                                            const ne = [...experiencias]; ne[i].cargo = e.target.value; setExperiencias(ne);
                                        }} />
                                        <input placeholder="Duración" className="apple-input text-xs" value={exp.duracion} onChange={e => {
                                            const ne = [...experiencias]; ne[i].duracion = e.target.value; setExperiencias(ne);
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                <div className="flex gap-4 pt-10">
                    <button
                        type="button"
                        onClick={onBack}
                        className="flex-1 h-14 rounded-2xl border border-white/10 text-stone-500 font-black uppercase tracking-widest text-xs hover:bg-white/5 transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex-[2] h-14 rounded-2xl bg-primary text-black font-black uppercase tracking-widest text-xs shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Guardando...' : 'Guardar Empleado'}
                    </button>
                </div>
            </form>
        </div>
    );
};

// UI Components
const FormGroup: React.FC<{ label: string; children: React.ReactNode; required?: boolean; colSpan?: string }> = ({ label, children, required }) => (
    <div className={`space-y-2.5 flex flex-col w-full`}>
        <label className="text-[11px] font-black text-stone-400 uppercase tracking-[0.15em] ml-1 mb-0.5">
            {label} {required && <span className="text-purple-500">*</span>}
        </label>
        <div className="w-full">
            {children}
        </div>
    </div>
);


export default Employees;
