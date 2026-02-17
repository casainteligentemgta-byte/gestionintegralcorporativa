import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabase';
import QRCode from 'qrcode';

interface Employee {
    id: string;
    numero_contrato: string;
    primer_nombre: string;
    segundo_nombre?: string;
    primer_apellido: string;
    segundo_apellido?: string;
    cedula_identidad: string;
    cargo_desempenar?: string;
    email?: string;
    celular?: string;
    status: string;
    qr_code: string;
    qr_url: string;
    created_at: string;
}

interface EmployeesProps {
    onNavigate: (view: string) => void;
}

const Employees: React.FC<EmployeesProps> = ({ onNavigate }) => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('empleados')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setEmployees(data || []);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredEmployees = employees.filter(emp => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${emp.primer_nombre} ${emp.segundo_nombre || ''} ${emp.primer_apellido} ${emp.segundo_apellido || ''}`.toLowerCase();
        return (
            fullName.includes(searchLower) ||
            emp.cedula_identidad.toLowerCase().includes(searchLower) ||
            emp.numero_contrato?.toLowerCase().includes(searchLower) ||
            emp.cargo_desempenar?.toLowerCase().includes(searchLower)
        );
    });

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

    if (showForm) {
        return <EmployeeForm onBack={() => { setShowForm(false); fetchEmployees(); }} />;
    }

    return (
        <div className="p-6 space-y-6 animate-in slide-in-from-bottom duration-500">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => onNavigate('DASHBOARD')}
                        className="h-10 w-10 flex items-center justify-center rounded-apple bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                        <span className="material-symbols-outlined text-stone-400">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-white uppercase tracking-widest">
                            Gestión de Empleados
                        </h1>
                        <p className="text-xs text-stone-500 mt-1">
                            {employees.length} empleado{employees.length !== 1 ? 's' : ''} registrado{employees.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="h-10 px-6 bg-primary text-black font-bold rounded-apple flex items-center gap-2 hover:scale-105 transition-transform"
                >
                    <span className="material-symbols-outlined text-lg">add</span>
                    Nuevo Empleado
                </button>
            </header>

            {/* Search Bar */}
            <div className="glass-card rounded-apple p-4 border border-white/5">
                <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-stone-500">
                        search
                    </span>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, cédula, contrato o cargo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full h-12 pl-12 pr-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-stone-500 focus:outline-none focus:border-primary/50 transition-colors"
                    />
                </div>
            </div>

            {/* Employee List */}
            {loading ? (
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEmployees.map((employee) => (
                        <EmployeeCard
                            key={employee.id}
                            employee={employee}
                            onEdit={() => {/* TODO: Implement edit */ }}
                            onDelete={async () => {
                                if (confirm('¿Estás seguro de eliminar este empleado?')) {
                                    await supabase.from('empleados').delete().eq('id', employee.id);
                                    fetchEmployees();
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

// Employee Card Component
const EmployeeCard: React.FC<{
    employee: Employee;
    onEdit: () => void;
    onDelete: () => void;
}> = ({ employee, onEdit, onDelete }) => {
    const [qrDataUrl, setQrDataUrl] = useState<string>('');
    const [showQR, setShowQR] = useState(false);

    useEffect(() => {
        if (employee.qr_url) {
            QRCode.toDataURL(employee.qr_url, { width: 200, margin: 1 })
                .then(setQrDataUrl)
                .catch(console.error);
        }
    }, [employee.qr_url]);

    const fullName = `${employee.primer_nombre} ${employee.segundo_nombre || ''} ${employee.primer_apellido} ${employee.segundo_apellido || ''}`.trim();

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

    return (
        <div className="glass-card rounded-apple p-6 border border-white/5 hover:border-primary/20 transition-all group">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="material-symbols-outlined text-primary text-2xl">badge</span>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">{fullName}</h3>
                        <p className="text-xs text-stone-500">{employee.numero_contrato}</p>
                    </div>
                </div>
                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase border ${getStatusColor(employee.status)}`}>
                    {getStatusText(employee.status)}
                </span>
            </div>

            <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-xs">
                    <span className="material-symbols-outlined text-stone-600 text-sm">badge</span>
                    <span className="text-stone-400">{employee.cedula_identidad}</span>
                </div>
                {employee.cargo_desempenar && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-stone-600 text-sm">work</span>
                        <span className="text-stone-400">{employee.cargo_desempenar}</span>
                    </div>
                )}
                {employee.email && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-stone-600 text-sm">email</span>
                        <span className="text-stone-400">{employee.email}</span>
                    </div>
                )}
                {employee.celular && (
                    <div className="flex items-center gap-2 text-xs">
                        <span className="material-symbols-outlined text-stone-600 text-sm">phone</span>
                        <span className="text-stone-400">{employee.celular}</span>
                    </div>
                )}
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setShowQR(!showQR)}
                    className="flex-1 h-9 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">qr_code</span>
                    QR
                </button>
                <button
                    onClick={onEdit}
                    className="flex-1 h-9 bg-white/5 hover:bg-white/10 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">edit</span>
                    Editar
                </button>
                <button
                    onClick={onDelete}
                    className="h-9 w-9 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center transition-colors"
                >
                    <span className="material-symbols-outlined text-sm">delete</span>
                </button>
            </div>

            {showQR && qrDataUrl && (
                <div className="mt-4 p-4 bg-white rounded-xl">
                    <img src={qrDataUrl} alt="QR Code" className="w-full" />
                    <p className="text-center text-xs text-stone-600 mt-2 font-mono">{employee.qr_code}</p>
                </div>
            )}
        </div>
    );
};

// Full Employee Form Component
const EmployeeForm: React.FC<{ onBack: () => void }> = ({ onBack }) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await supabase.from('empleados').insert([{
                ...formData,
                dependientes,
                experiencias_previas: experiencias,
                status: 'active'
            }]);

            if (error) throw error;
            alert('¡Empleado registrado con éxito!');
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
                    <h1 className="text-xl font-black text-white uppercase tracking-widest">Nuevo Empleado</h1>
                    <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Contrato Integral Corporativo</p>
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
                    <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-6 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <div className="grid grid-cols-2 gap-4">
                                <FormGroup label="Edad">
                                    <input type="number" className="apple-input" value={formData.edad} onChange={e => setFormData({ ...formData, edad: e.target.value })} />
                                </FormGroup>
                                <FormGroup label="Estado Civil">
                                    <select className="apple-input" value={formData.estado_civil} onChange={e => setFormData({ ...formData, estado_civil: e.target.value })}>
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
                    <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-6 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                <select className="apple-input" value={formData.forma_pago} onChange={e => setFormData({ ...formData, forma_pago: e.target.value })}>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="nomina">Nómina Bancaria</option>
                                </select>
                            </FormGroup>
                            <FormGroup label="Jornada de Trabajo">
                                <select className="apple-input" value={formData.jornada_trabajo} onChange={e => setFormData({ ...formData, jornada_trabajo: e.target.value })}>
                                    <option value="diurna">Diurna</option>
                                    <option value="nocturna">Nocturna</option>
                                    <option value="mixta">Mixta</option>
                                </select>
                            </FormGroup>
                            <FormGroup label="Lugar de Pago">
                                <input className="apple-input" value={formData.lugar_pago} onChange={e => setFormData({ ...formData, lugar_pago: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Objeto del Contrato" colSpan="2">
                                <textarea className="apple-input min-h-[100px] py-3" value={formData.objeto_contrato} onChange={e => setFormData({ ...formData, objeto_contrato: e.target.value })} />
                            </FormGroup>
                        </div>
                    </div>
                )}

                {/* TAB: PERSONAL */}
                {activeTab === 'PERSONAL' && (
                    <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-6 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormGroup label="País de Nacimiento">
                                <input className="apple-input" value={formData.pais_nacimiento} onChange={e => setFormData({ ...formData, pais_nacimiento: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Lugar de Nacimiento">
                                <input className="apple-input" value={formData.lugar_nacimiento} onChange={e => setFormData({ ...formData, lugar_nacimiento: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Celular">
                                <input type="tel" className="apple-input" value={formData.celular} onChange={e => setFormData({ ...formData, celular: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Email">
                                <input type="email" className="apple-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Dirección / Domicilio" colSpan="2">
                                <textarea className="apple-input min-h-[80px] py-3" value={formData.direccion_domicilio} onChange={e => setFormData({ ...formData, direccion_domicilio: e.target.value })} />
                            </FormGroup>
                            <div className="md:col-span-2 grid grid-cols-2 gap-4 bg-white/5 p-4 rounded-2xl">
                                <FormGroup label="Instrucción Primaria">
                                    <input className="apple-input text-[10px]" value={formData.instruccion_primaria} onChange={e => setFormData({ ...formData, instruccion_primaria: e.target.value })} />
                                </FormGroup>
                                <FormGroup label="Instrucción Secundaria">
                                    <input className="apple-input text-[10px]" value={formData.instruccion_secundaria} onChange={e => setFormData({ ...formData, instruccion_secundaria: e.target.value })} />
                                </FormGroup>
                                <FormGroup label="Superior">
                                    <input className="apple-input text-[10px]" value={formData.instruccion_superior} onChange={e => setFormData({ ...formData, instruccion_superior: e.target.value })} />
                                </FormGroup>
                                <FormGroup label="Oficio Actual">
                                    <input className="apple-input text-[10px]" value={formData.profesion_oficio_actual} onChange={e => setFormData({ ...formData, profesion_oficio_actual: e.target.value })} />
                                </FormGroup>
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB: MÉDICO */}
                {activeTab === 'MEDICO' && (
                    <div className="glass-card p-8 rounded-[2rem] border-white/5 space-y-6 animate-in slide-in-from-right-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <FormGroup label="Tipo de Sangre">
                                <select className="apple-input" value={formData.tipo_sangre} onChange={e => setFormData({ ...formData, tipo_sangre: e.target.value })}>
                                    {['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                            </FormGroup>
                            <FormGroup label="Peso (Kg)">
                                <input type="number" className="apple-input" value={formData.peso} onChange={e => setFormData({ ...formData, peso: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Estatura (cm)">
                                <input type="number" className="apple-input" value={formData.estatura} onChange={e => setFormData({ ...formData, estatura: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Talla Camisa">
                                <input className="apple-input" value={formData.talla_camisa} onChange={e => setFormData({ ...formData, talla_camisa: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Talla Pantalón">
                                <input className="apple-input" value={formData.talla_pantalon} onChange={e => setFormData({ ...formData, talla_pantalon: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Botas">
                                <input className="apple-input" value={formData.medida_botas} onChange={e => setFormData({ ...formData, medida_botas: e.target.value })} />
                            </FormGroup>
                            <FormGroup label="Enfermedades Padecidas" colSpan="3">
                                <textarea className="apple-input min-h-[60px] py-3" value={formData.enfermedades_padecidas} onChange={e => setFormData({ ...formData, enfermedades_padecidas: e.target.value })} />
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
const FormGroup: React.FC<{ label: string; children: React.ReactNode; required?: boolean; colSpan?: string }> = ({ label, children, required, colSpan }) => (
    <div className={`space-y-1.5 flex flex-col ${colSpan === '2' ? 'md:col-span-2' : colSpan === '3' ? 'md:col-span-3' : ''}`}>
        <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest ml-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);


export default Employees;
