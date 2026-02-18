
import React from 'react';

interface Employee {
    id: string;
    primer_nombre: string;
    segundo_nombre?: string | null;
    primer_apellido: string;
    segundo_apellido?: string | null;
    cedula_identidad: string;
    foto?: string | null;
    status: string;
    created_at: string;
    cargo_desempenar?: string | null;
    email?: string | null;
    celular?: string | null;
    edad?: number | null;
    estado_civil?: string | null;
    fecha_ingreso?: string | null;
    salario_basico?: number | null;
    forma_pago?: string | null;
    lugar_pago?: string | null;
    jornada_trabajo?: string | null;
    objeto_contrato?: string | null;
    lugar_nacimiento?: string | null;
    pais_nacimiento?: string | null;
    fecha_nacimiento?: string | null;
    nacionalidad?: string | null;
    telefono_habitacion?: string | null;
    direccion_domicilio?: string | null;
    inscripcion_ivss?: string | null;
    es_zurdo?: boolean | null;
    instruccion_primaria?: string | null;
    instruccion_secundaria?: string | null;
    instruccion_tecnica?: string | null;
    instruccion_superior?: string | null;
    profesion_oficio_actual?: string | null;
    examen_medico_previo?: boolean | null;
    examen_efectuado_por?: string | null;
    tipo_sangre?: string | null;
    enfermedades_padecidas?: string | null;
    incapacidades_fisicas?: string | null;
    peso?: number | null;
    estatura?: number | null;
    talla_camisa?: string | null;
    talla_pantalon?: string | null;
    talla_bragas?: string | null;
    medida_botas?: string | null;
    observaciones_medidas?: string | null;
    dependientes?: any[];
    experiencias_previas?: any[];
}

interface EmployeeDigitalSheetProps {
    employee: Employee;
    onBack: () => void;
}

const EmployeeDigitalSheet: React.FC<EmployeeDigitalSheetProps> = ({ employee, onBack }) => {
    if (!employee) return null;

    const printSheet = () => {
        window.print();
    };

    const fullName = `${employee.primer_nombre || ''} ${employee.segundo_nombre || ''} ${employee.primer_apellido || ''} ${employee.segundo_apellido || ''}`.replace(/\s+/g, ' ').trim();

    const formatDate = (dateStr?: string | null) => {
        if (!dateStr) return '---';
        try {
            return new Date(dateStr).toLocaleDateString('es-VE');
        } catch {
            return dateStr;
        }
    };

    const SectionTitle = ({ number, title }: { number: string, title: string }) => (
        <div className="flex items-center gap-2 border-b border-stone-800 pb-0.5 mb-2 mt-4 print:mt-6">
            <span className="text-[9px] font-black bg-purple-900 text-white px-2 py-0.5 rounded-sm">{number}</span>
            <h3 className="text-[9px] font-black uppercase tracking-tight text-purple-950">{title}</h3>
        </div>
    );

    const Field = ({ label, value, mono = false, colSpan = "1" }: { label: string, value: any, mono?: boolean, colSpan?: string }) => (
        <div className={`flex flex-col col-span-${colSpan} border-b border-stone-100 pb-1`}>
            <p className="text-[6px] text-stone-500 uppercase font-black leading-tight mb-0.5">{label}</p>
            <p className={`text-[8.5px] font-bold text-stone-900 min-h-[12px] flex items-end ${mono ? 'font-mono' : ''}`}>
                {value || '---'}
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-950 font-sans text-stone-100 flex flex-col items-center overflow-x-hidden print:bg-white print:text-black print:p-0">
            {/* Header Flotante */}
            <header className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-xl border-b border-white/5 print:hidden">
                <div className="px-6 py-4 flex items-center justify-between max-w-5xl mx-auto">
                    <button onClick={onBack} className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors">
                        <span className="material-symbols-outlined">arrow_back</span>
                        <span className="text-xs font-black uppercase tracking-widest">Volver</span>
                    </button>
                    <h1 className="text-[12px] font-black tracking-[0.3em] uppercase text-purple-400">Expediente Administrativo</h1>
                    <button onClick={printSheet} className="flex items-center gap-2 text-stone-400 hover:text-primary transition-colors">
                        <span className="material-symbols-outlined">print</span>
                        <span className="text-xs font-black uppercase tracking-widest">Imprimir</span>
                    </button>
                </div>
            </header>

            <main className="mt-24 pb-32 flex flex-col items-center gap-12 w-full px-4 print:mt-0 print:pb-0 print:px-0">
                {/* PÁGINA 1 */}
                <div className="bg-white text-stone-950 w-full max-w-[210mm] min-h-[297mm] shadow-2xl flex flex-col px-[20mm] py-[20mm] relative print:shadow-none print:m-0 print:w-[210mm] print:h-[297mm] print:break-after-page overflow-hidden shrink-0 mx-auto">

                    {/* Header Planilla */}
                    <div className="flex flex-col mb-6 gap-4 border-b border-purple-900 pb-4">
                        <div className="flex justify-between items-start">
                            <div className="flex flex-col gap-0.5">
                                <h1 className="text-lg font-black tracking-tight text-purple-900 uppercase leading-none">REGISTRO INTEGRAL</h1>
                                <p className="text-[8px] font-black text-stone-400 uppercase tracking-[0.1em]">Personal Administrativo y Gerencial</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[6px] font-black text-stone-400 uppercase">Documento</p>
                                <p className="text-[7.5px] font-mono font-bold">FOR-RRHH-ADM-001</p>
                            </div>
                        </div>

                        <div className="flex justify-between items-end">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-24 bg-stone-50 border border-stone-100 rounded-lg flex items-center justify-center relative overflow-hidden grayscale shrink-0">
                                    {employee.foto ?
                                        <img src={employee.foto} className="w-full h-full object-cover" /> :
                                        <span className="material-symbols-outlined text-4xl text-stone-200">person</span>
                                    }
                                </div>
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-[7px] font-black text-purple-900 uppercase">Estatus del Registro</p>
                                    <h2 className="text-lg font-black text-stone-900 leading-tight translate-y-[-1px]">{fullName}</h2>
                                    <div className="flex gap-2 mt-1">
                                        <div className="bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
                                            <p className="text-[5px] font-black text-stone-400 uppercase">CI</p>
                                            <p className="text-[9px] font-mono font-black text-stone-900">{employee.cedula_identidad}</p>
                                        </div>
                                        <div className="bg-stone-50 px-2 py-0.5 rounded border border-stone-100">
                                            <p className="text-[5px] font-black text-stone-400 uppercase">SISTEMA</p>
                                            <p className="text-[9px] font-mono font-black text-stone-900">{employee.id?.substring(0, 8).toUpperCase()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=EMP-${employee.cedula_identidad}`} className="w-14 h-14 grayscale contrast-125" />
                                <p className="text-[6px] font-black text-stone-400 uppercase">Validación Digital</p>
                            </div>
                        </div>
                    </div>

                    <SectionTitle number="I" title="Información Personal y de Contacto" />
                    <div className="grid grid-cols-4 gap-x-6 gap-y-3 mb-6">
                        <Field label="Nacionalidad" value={employee.nacionalidad} />
                        <Field label="Estado Civil" value={employee.estado_civil} />
                        <Field label="Fecha Nacimiento" value={formatDate(employee.fecha_nacimiento)} />
                        <Field label="Edad" value={employee.edad ? `${employee.edad} Años` : '---'} />
                        <Field label="Lugar de Nacimiento" value={employee.lugar_nacimiento} colSpan="2" />
                        <Field label="País" value={employee.pais_nacimiento} />
                        <Field label="Lateralidad" value={employee.es_zurdo ? 'ZURDO' : 'DIESTRO'} />
                        <Field label="Celular" value={employee.celular} mono colSpan="2" />
                        <Field label="Teléfono Hab." value={employee.telefono_habitacion} mono colSpan="2" />
                        <Field label="Correo Electrónico" value={employee.email} colSpan="2" />
                        <Field label="Inscripción IVSS" value={employee.inscripcion_ivss} colSpan="2" />
                        <Field label="Dirección de Domicilio" value={employee.direccion_domicilio} colSpan="4" />
                    </div>

                    <SectionTitle number="II" title="Datos de la Contratación Actual" />
                    <div className="grid grid-cols-4 gap-x-6 gap-y-3 mb-6">
                        <Field label="Cargo / Posición" value={employee.cargo_desempenar} colSpan="2" />
                        <Field label="Fecha de Ingreso" value={formatDate(employee.fecha_ingreso)} mono />
                        <Field label="Salario Básico" value={employee.salario_basico ? `$${employee.salario_basico}` : '---'} />
                        <Field label="Forma de Pago" value={employee.forma_pago} />
                        <Field label="Lugar de Pago" value={employee.lugar_pago} />
                        <Field label="Jornada Laboral" value={employee.jornada_trabajo} />
                        <Field label="Tipo Trabajador" value="ADMINISTRATIVO" />
                        <Field label="Objeto del Contrato" value={employee.objeto_contrato} colSpan="4" />
                    </div>

                    <SectionTitle number="III" title="Perfil Académico y Profesional" />
                    <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-4">
                        <Field label="Educación Primaria" value={employee.instruccion_primaria} />
                        <Field label="Educación Secundaria" value={employee.instruccion_secundaria} />
                        <Field label="Técnica / Especialización" value={employee.instruccion_tecnica} />
                        <Field label="Educación Superior / Título" value={employee.instruccion_superior} />
                        <Field label="Profesión u Oficio Actual" value={employee.profesion_oficio_actual} colSpan="2" />
                    </div>

                    <div className="mt-auto pt-6 flex justify-between items-end border-t border-stone-200">
                        <p className="text-[7px] font-black text-purple-900 uppercase tracking-widest">Página 1/2 • Gestión Corporativa Integral</p>
                        <p className="text-[7px] font-mono text-stone-400">Generado el: {new Date().toLocaleDateString('es-VE')}</p>
                    </div>
                </div>

                {/* PÁGINA 2 */}
                <div className="bg-white text-stone-950 w-full max-w-[210mm] min-h-[297mm] shadow-2xl flex flex-col px-[20mm] py-[20mm] relative print:shadow-none print:m-0 print:w-[210mm] print:h-[297mm] overflow-hidden shrink-0 mx-auto">

                    <SectionTitle number="IV" title="Información Médica y Biométricas" />
                    <div className="grid grid-cols-4 gap-x-6 gap-y-3 mb-8">
                        <Field label="Tipo de Sangre" value={employee.tipo_sangre} />
                        <Field label="Peso (Kg)" value={employee.peso} />
                        <Field label="Estatura (cm)" value={employee.estatura} />
                        <Field label="Examen Médico Realizado" value={employee.examen_medico_previo ? 'SÍ' : 'NO'} />
                        <Field label="Talla Camisa" value={employee.talla_camisa} />
                        <Field label="Talla Pantalón" value={employee.talla_pantalon} />
                        <Field label="Talla Bragas/Otros" value={employee.talla_bragas} />
                        <Field label="Medida Calzado" value={employee.medida_botas} />
                        <Field label="Enfermedades Padecidas" value={employee.enfermedades_padecidas} colSpan="2" />
                        <Field label="Incapacidades Físicas" value={employee.incapacidades_fisicas} colSpan="2" />
                        <Field label="Observaciones Medidas" value={employee.observaciones_medidas} colSpan="4" />
                    </div>

                    <SectionTitle number="V" title="Grupo Familiar Dependiente" />
                    <div className="border border-stone-100 rounded-xl overflow-hidden mb-8">
                        <table className="w-full text-left text-[8px]">
                            <thead className="bg-purple-900 text-white font-black uppercase tracking-widest text-[7px]">
                                <tr>
                                    <th className="px-4 py-2">Nombre y Apellido</th>
                                    <th className="px-4 py-2">Parentesco</th>
                                    <th className="px-4 py-2 text-center">Fecha Nacimiento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {employee.dependientes && employee.dependientes.length > 0 ? (
                                    employee.dependientes.map((d: any, i: number) => (
                                        <tr key={i} className="border-b border-stone-50">
                                            <td className="px-4 py-2 font-bold uppercase">{d.nombre}</td>
                                            <td className="px-4 py-2 text-stone-600 uppercase">{d.parentesco}</td>
                                            <td className="px-4 py-2 text-center font-mono">{formatDate(d.fecha_nacimiento)}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={3} className="px-4 py-4 text-center text-stone-400 italic">No se registraron familiares dependientes</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    <SectionTitle number="VI" title="Historial y Experiencia Laboral" />
                    <div className="space-y-3 mb-8">
                        {employee.experiencias_previas && employee.experiencias_previas.length > 0 ? (
                            employee.experiencias_previas.map((exp: any, i: number) => (
                                <div key={i} className="p-4 bg-stone-50 border border-stone-100 rounded-xl grid grid-cols-3 gap-4">
                                    <Field label="Empresa / Institución" value={exp.empresa} colSpan="1" />
                                    <Field label="Cargo Desempeñado" value={exp.cargo} />
                                    <Field label="Tiempo de Permanencia" value={exp.duracion} />
                                </div>
                            ))
                        ) : (
                            <div className="p-4 border border-stone-100 rounded-xl text-center text-stone-400 italic text-[8px]">
                                No se registró experiencia laboral previa
                            </div>
                        )}
                    </div>

                    <SectionTitle number="VII" title="Protocolo de Firmas y Consentimiento" />
                    <p className="text-[7px] text-stone-400 leading-relaxed mb-12">
                        Declaro bajo juramento que los datos suministrados en este formulario son ciertos y veraces. Autorizo a la empresa a verificar cualquier información aquí contenida.
                        Este documento digital tiene validez legal una vez sea procesado y refrendado por el departamento de Recursos Humanos.
                    </p>

                    <div className="mt-8 grid grid-cols-3 gap-20 h-28 items-end px-12">
                        <div className="flex flex-col items-center">
                            <div className="w-full border-t-2 border-stone-900 pt-2 text-center font-black text-[7px] uppercase tracking-tighter text-stone-900">El Empleado</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-full border-t-2 border-stone-900 pt-2 text-center font-black text-[7px] uppercase tracking-tighter text-stone-900">Representante Legal</div>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-full border-t-2 border-stone-900 pt-2 text-center font-black text-[7px] uppercase tracking-tighter text-stone-900">Gerencia RRHH</div>
                        </div>
                    </div>

                    <div className="mt-auto pt-6 flex justify-between items-center text-stone-300 border-t border-stone-50">
                        <p className="text-[7px] font-black uppercase tracking-widest">Fin de Expediente • Gestión Corporativa Integral</p>
                        <p className="text-[7px] font-bold uppercase text-purple-200">VERIFICACIÓN QR DISPONIBLE</p>
                    </div>
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 bg-stone-950/90 backdrop-blur-2xl border-t border-white/10 p-6 z-50 print:hidden flex justify-center">
                <button onClick={printSheet} className="max-w-md w-full bg-purple-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl active:scale-[0.97] transition-all hover:bg-purple-500">
                    <span className="material-symbols-outlined">print</span>
                    <span className="uppercase text-sm tracking-widest">Imprimir Expediente Administrativo</span>
                </button>
            </footer>
        </div>
    );
};

export default EmployeeDigitalSheet;
