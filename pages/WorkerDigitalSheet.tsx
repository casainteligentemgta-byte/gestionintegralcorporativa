
import React from 'react';

interface WorkerDigitalSheetProps {
    worker: any;
    onNavigate: (view: any) => void;
}

const WorkerDigitalSheet: React.FC<WorkerDigitalSheetProps> = ({ worker, onNavigate }) => {
    if (!worker) return null;

    const printSheet = () => {
        window.print();
    };

    // Helper for names
    const fullName = `${worker.first_name || ''} ${worker.second_name || ''} ${worker.first_surname || ''} ${worker.second_surname || ''}`.replace(/\s+/g, ' ').trim();
    const idNumber = `${worker.id_type || (worker.id_number?.startsWith('E') ? 'E' : 'V')}-${(worker.id_number || '').replace(/^[VE]-/, '')}`;

    const calculateAge = (birthday: string) => {
        if (!birthday) return '---';
        const ageDifMs = Date.now() - new Date(birthday).getTime();
        const ageDate = new Date(ageDifMs);
        return Math.abs(ageDate.getUTCFullYear() - 1970).toString();
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '---';
        try {
            return new Date(dateStr).toLocaleDateString('es-VE');
        } catch {
            return dateStr;
        }
    };

    const getVal = (obj: any, section: string, key: string, defaultValue: string = '---') => {
        if (!obj) return defaultValue;
        // Direct field
        if (obj[key] !== undefined) return obj[key] || defaultValue;
        // JSON field
        const jsonPath = section + '_json';
        if (obj[jsonPath] && obj[jsonPath][key] !== undefined) {
            return obj[jsonPath][key] || defaultValue;
        }
        return defaultValue;
    };

    const SectionTitle = ({ number, title }: { number: string, title: string }) => (
        <div className="flex items-center gap-2 border-b border-stone-800 pb-0.5 mb-1.5 mt-3 print:mt-4">
            <span className="text-[8px] font-black bg-stone-900 text-white px-1.5 py-0.5 rounded-sm">{number}</span>
            <h3 className="text-[8px] font-black uppercase tracking-tight text-stone-900">{title}</h3>
        </div>
    );

    const Field = ({ label, value, mono = false, colSpan = "1" }: { label: string, value: any, mono?: boolean, colSpan?: string }) => (
        <div className={`flex flex-col col-span-${colSpan}`}>
            <p className="text-[5.5px] text-stone-500 uppercase font-black leading-tight mb-0.5">{label}</p>
            <p className={`text-[7.5px] font-bold text-stone-900 border-b border-stone-100 min-h-[10px] flex items-end pb-0.5 ${mono ? 'font-mono' : ''}`}>
                {value || '---'}
            </p>
        </div>
    );

    return (
        <div className="min-h-screen bg-stone-950 font-sans text-stone-100 flex flex-col items-center overflow-x-hidden print:bg-white print:text-black print:p-0">
            <header className="fixed top-0 left-0 right-0 z-50 bg-stone-950/80 backdrop-blur-xl border-b border-white/5 print:hidden">
                <div className="h-8"></div>
                <div className="px-4 py-3 flex items-center justify-between">
                    <button onClick={() => onNavigate('WORKERS')} className="flex items-center text-stone-400">
                        <span className="material-symbols-outlined text-2xl leading-none">chevron_left</span>
                        <span className="text-xs font-medium">Volver</span>
                    </button>
                    <h1 className="text-[11px] font-black tracking-[0.2em] uppercase opacity-70">EXPEDIENTE DIGITAL A4</h1>
                    <button className="text-stone-400" onClick={printSheet}>
                        <span className="material-symbols-outlined text-2xl leading-none">print</span>
                    </button>
                </div>
            </header>

            <main className="mt-20 pb-64 flex flex-col items-center gap-8 print:mt-0 print:pb-0 print:gap-0 w-full px-4 overflow-x-hidden">
                <div className="flex flex-col items-center gap-12 w-full max-w-full overflow-x-auto pb-32">

                    {/* PAGINA 1 */}
                    <div className="bg-white text-stone-950 w-full max-w-[190mm] min-h-[296mm] shadow-2xl flex flex-col px-[15mm] pt-[15mm] pb-[25mm] relative print:shadow-none print:m-0 print:w-[210mm] print:h-[297mm] print:break-after-page overflow-hidden shrink-0 mx-auto">

                        <div className="flex flex-col mb-6 gap-4 border-b-2 border-stone-900 pb-4">
                            <h1 className="text-xl font-black tracking-tight text-blue-900 uppercase leading-none text-center w-full border-b border-stone-100 pb-3">PLANILLA DE EMPLEO (OBREROS)</h1>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-4">
                                    <div className="w-24 h-28 bg-stone-50 border border-stone-200 rounded-sm flex items-center justify-center relative overflow-hidden grayscale shrink-0">
                                        {worker.photo ? <img src={worker.photo} className="w-full h-full object-cover" /> : <span className="material-symbols-outlined text-4xl text-stone-200">person</span>}
                                    </div>
                                    <div className="flex flex-col">
                                        <p className="text-[7px] text-stone-400 font-mono font-bold uppercase tracking-widest">FOR-RRHH-KORE-001</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-6 shrink-0">
                                    <div className="text-right">
                                        <p className="text-[8px] font-black text-blue-900 uppercase tracking-tight">Nº CONTRATO</p>
                                        <p className="text-[14px] font-mono font-black text-stone-950 uppercase">{getVal(worker, 'hiring', 'numero_contrato')}</p>
                                    </div>
                                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=KORE-${idNumber}`} className="w-14 h-14 grayscale contrast-125" />
                                </div>
                            </div>
                        </div>

                        <SectionTitle number="I" title="Identificación del Trabajador" />
                        <div className="grid grid-cols-4 gap-x-4 gap-y-2 mb-3">
                            <Field label="Primer nombre" value={worker.first_name} />
                            <Field label="Segundo nombre" value={worker.second_name} />
                            <Field label="Primer apellido" value={worker.first_surname} />
                            <Field label="Segundo apellido" value={worker.second_surname} />
                            <Field label="Cédula" value={idNumber} mono />
                            <Field label="Edad" value={`${calculateAge(worker.dob)} AÑOS`} />
                            <Field label="Estado civil" value={worker.civil_status} />
                            <Field label="Nacionalidad" value={worker.nationality || 'VENEZOLANA'} />
                        </div>

                        <SectionTitle number="II" title="Datos del Patrono y Obra" />
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-3">
                            <Field label="Nombre Empresa" value="DIMAQUINAS, c.a" colSpan="2" />
                            <Field label="RIF" value="J-40833210-4" />
                            <Field label="Nombre de la Obra" value={worker.projects?.name} colSpan="2" />
                            <Field label="Descripción de Obra" value={worker.projects?.description} />
                        </div>

                        <SectionTitle number="III" title="Datos de la Contratación" />
                        <div className="grid grid-cols-4 gap-x-4 gap-y-2 mb-3">
                            <Field label="Cargo / Oficio" value={getVal(worker, 'hiring', 'cargo')} />
                            <Field label="F. Firma" value={formatDate(getVal(worker, 'hiring', 'fecha_contrato'))} />
                            <Field label="F. Ingreso" value={formatDate(getVal(worker, 'hiring', 'fecha_ingreso'))} mono />
                            <Field label="Salario" value={`$${getVal(worker, 'hiring', 'salario')}`} />
                            <Field label="Forma de Pago" value={getVal(worker, 'hiring', 'forma_pago')} />
                            <Field label="Lugar de Pago" value={getVal(worker, 'hiring', 'lugar_pago')} />
                            <Field label="Jornada" value={getVal(worker, 'hiring', 'jornada_trabajo')} />
                            <Field label="Oficio Tabulador" value={getVal(worker, 'hiring', 'numero_oficio_tabulador')} />
                            <Field label="Lugar Servicio" value={getVal(worker, 'hiring', 'lugar_prestacion_servicio')} colSpan="2" />
                            <Field label="Objeto" value={getVal(worker, 'hiring', 'objeto_contrato')} colSpan="2" />
                        </div>

                        <SectionTitle number="IV" title="Datos Personales" />
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-3">
                            <Field label="Celular" value={worker.cell_phone} mono />
                            <Field label="Lugar Nacimiento" value={worker.birth_place} />
                            <Field label="Correo" value={worker.email} />
                            <Field label="Dirección Habitativa" value={worker.address} colSpan="3" />
                        </div>

                        <div className="mt-auto pt-4 flex justify-between items-end border-t border-stone-100">
                            <p className="text-[6px] font-black text-stone-400 uppercase tracking-widest">PÁGINA 1/2 • RRHH DIGITAL</p>
                            <p className="text-[6px] font-mono text-stone-400">UUID: {worker.id?.substring(0, 8)}</p>
                        </div>
                    </div>

                    {/* PAGINA 2 */}
                    <div className="bg-white text-stone-950 w-full max-w-[190mm] min-h-[296mm] shadow-2xl flex flex-col px-[15mm] pt-[15mm] pb-[25mm] relative print:shadow-none print:m-0 print:w-[210mm] print:h-[297mm] overflow-hidden shrink-0 mx-auto">

                        <SectionTitle number="V" title="Antecedentes e Instrucción" />
                        <div className="grid grid-cols-3 gap-x-4 gap-y-2 mb-3">
                            <Field label="Antecedentes" value={getVal(worker, 'criminal_records', 'hasRecords') ? 'CON ANTECEDENTES' : 'SIN ANTECEDENTES'} />
                            <Field label="Primaria" value={getVal(worker, 'education', 'primary')} />
                            <Field label="Secundaria" value={getVal(worker, 'education', 'secondary')} />
                            <Field label="Técnica" value={getVal(worker, 'education', 'technical')} />
                            <Field label="Superior" value={getVal(worker, 'education', 'superior')} />
                            <Field label="Oficio Actual" value={getVal(worker, 'education', 'currentProfession')} />
                        </div>

                        <SectionTitle number="VI" title="Médicos y Dotación" />
                        <div className="grid grid-cols-4 gap-x-4 gap-y-2 mb-3">
                            <Field label="Tipo Sangre" value={getVal(worker, 'medical', 'bloodType')} />
                            <Field label="Alergias / Enf." value={getVal(worker, 'medical', 'diseases')} colSpan="3" />
                            <Field label="Camisa" value={getVal(worker, 'sizes', 'shirt')} />
                            <Field label="Pantalón" value={getVal(worker, 'sizes', 'pants')} />
                            <Field label="Botas" value={getVal(worker, 'sizes', 'boots')} />
                        </div>

                        <SectionTitle number="VII" title="Carga Familiar" />
                        <div className="border border-stone-100 rounded mb-3">
                            <table className="w-full text-left text-[6.5px]">
                                <thead className="bg-stone-50 border-b border-stone-200">
                                    <tr>
                                        <th className="px-2 py-1 font-black">Nombre Completo</th>
                                        <th className="px-2 py-1 font-black">Parentesco</th>
                                        <th className="px-2 py-1 font-black">F. Nac</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(worker.dependents || []).map((d: any, i: number) => (
                                        <tr key={i} className="border-b border-stone-50">
                                            <td className="px-2 py-1 uppercase">{d.fullName}</td>
                                            <td className="px-2 py-1 uppercase">{d.relationship}</td>
                                            <td className="px-2 py-1">{formatDate(d.dob)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <SectionTitle number="VIII" title="Experiencia Laboral" />
                        <div className="space-y-2 mb-3">
                            {(worker.experience || []).map((exp: any, i: number) => (
                                <div key={i} className="p-2 border border-stone-100 rounded grid grid-cols-3 gap-2">
                                    <Field label="Empresa" value={exp.company} />
                                    <Field label="Cargo" value={exp.position} />
                                    <Field label="Duración" value={exp.duration} />
                                </div>
                            ))}
                        </div>

                        <SectionTitle number="IX" title="Firmas y Validación" />
                        <div className="mt-8 grid grid-cols-3 gap-12 h-24 items-end px-10">
                            <div className="flex flex-col items-center">
                                <div className="w-full border-t border-stone-900 pt-1 text-center font-black text-[6px] uppercase tracking-tighter">Trabajador</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-full border-t border-stone-900 pt-1 text-center font-black text-[6px] uppercase tracking-tighter">Patrono</div>
                            </div>
                            <div className="flex flex-col items-center">
                                <div className="w-full border-t border-stone-900 pt-1 text-center font-black text-[6px] uppercase tracking-tighter">RRHH</div>
                            </div>
                        </div>

                        <div className="mt-auto pt-4 flex justify-between items-center text-stone-300 border-t border-stone-50">
                            <p className="text-[6px] font-black uppercase tracking-widest">PÁGINA 2/2 • QR VALIDADOR ACTIVO</p>
                            <p className="text-[6px] font-bold uppercase">{new Date().toLocaleDateString('es-VE')}</p>
                        </div>
                    </div>
                </div>
            </main>

            <footer className="fixed bottom-0 left-0 right-0 bg-stone-950/90 backdrop-blur-2xl border-t border-white/10 p-6 z-50 print:hidden flex justify-center">
                <button onClick={printSheet} className="max-w-md w-full bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl active:scale-[0.97] transition-all">
                    <span className="material-symbols-outlined">print</span>
                    <span className="uppercase text-sm">Imprimir Planilla A4</span>
                </button>
            </footer>
        </div>
    );
};

export default WorkerDigitalSheet;
