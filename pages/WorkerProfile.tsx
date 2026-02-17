
import React, { useEffect } from 'react';
import { Worker } from '../types';

interface WorkerProfileProps {
   worker: Worker | any;
   onNavigate: (view: any, data?: any) => void;
}

const WorkerProfile: React.FC<WorkerProfileProps> = ({ worker, onNavigate }) => {

   const calculateAge = (birthday: string) => {
      if (!birthday) return null;
      const ageDifMs = Date.now() - new Date(birthday).getTime();
      if (ageDifMs < 0) return null;
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
   };

   // Efecto legal: Abrir diálogo de impresión automáticamente al cargar la planilla premium
   useEffect(() => {
      const timer = setTimeout(() => {
         window.print();
      }, 1000);
      return () => clearTimeout(timer);
   }, []);

   const DataLabel = ({ children }: { children?: React.ReactNode }) => (
      <span className="text-[7px] text-[#4b5563] uppercase font-bold tracking-wider mb-0.5 block leading-none">
         {children}
      </span>
   );

   // Fix: Added className to DataValue component props and merged it with default classes to support custom styling
   const DataValue = ({ children, mono = false, className = "" }: { children?: React.ReactNode, mono?: boolean, className?: string }) => (
      <p className={`text-[10px] font-bold text-black leading-tight uppercase ${mono ? 'font-mono' : ''} ${className}`}>
         {children || '---'}
      </p>
   );

   const Checkbox = ({ label, checked }: { label: string, checked: boolean }) => (
      <div className="flex items-center gap-1.5">
         <div className="w-3 h-3 border border-stone-300 flex items-center justify-center text-[8px] font-black text-[#0047AB] bg-white">
            {checked ? 'X' : ''}
         </div>
         <span className="text-[8px] font-bold text-[#4b5563] uppercase">{label}</span>
      </div>
   );

   const SectionHeader = ({ title, number }: { title: string, number: string }) => (
      <div className="flex items-center gap-2 mb-3 mt-5 first:mt-0">
         <div className="w-5 h-5 bg-[#0047AB] flex items-center justify-center shrink-0">
            <span className="text-white text-[10px] font-black">{number}</span>
         </div>
         <h4 className="text-[9px] font-black uppercase tracking-[0.1em] text-[#0047AB]">
            {title}
         </h4>
      </div>
   );

   return (
      <div className="min-h-screen bg-[#0a0a0f] flex flex-col items-center selection:bg-[#0047AB]/20">
         {/* Navigator Bar (Hidden in Print) */}
         <header className="fixed top-0 left-0 right-0 z-[100] bg-[#0a0a0f]/90 backdrop-blur-xl border-b border-white/5 py-4 px-6 flex justify-between items-center no-print max-w-3xl mx-auto rounded-b-3xl shadow-2xl">
            <div className="flex items-center gap-4">
               <button
                  onClick={() => onNavigate('WORKERS')}
                  className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all active:scale-90"
               >
                  <span className="material-symbols-outlined text-xl">arrow_back_ios_new</span>
               </button>
               <div>
                  <h1 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Expediente Premium</h1>
                  <p className="text-[10px] text-[#0047AB] font-mono opacity-80 uppercase tracking-widest font-bold">Registro: {worker.idNumber}</p>
               </div>
            </div>
         </header>

         {/* Main Document Foliage */}
         <main className="pt-28 pb-64 px-4 w-full max-w-4xl flex flex-col items-center gap-16 animate-in fade-in slide-in-from-bottom-12 duration-1000">

            {/* HOJA I: Frente del Expediente */}
            <div className="sheet-a4 bg-white shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col print:m-0 print:shadow-none print:w-full overflow-hidden break-after-page min-h-[1100px] w-full max-w-[800px] relative border border-white/10">

               {/* Header Institucional */}
               <div className="p-10 border-b border-stone-200 bg-slate-50 flex justify-between items-start">
                  <div className="flex gap-6 items-center">
                     <div className="w-16 h-16 bg-[#0047AB] flex items-center justify-center text-white rounded-lg shadow-lg">
                        <span className="material-symbols-outlined text-4xl font-light">foundation</span>
                     </div>
                     <div>
                        <h2 className="text-xl font-bold tracking-tighter text-black uppercase leading-none">PLANILLA DE EMPLEO (OBREROS)</h2>
                        <p className="text-[10px] text-[#4b5563] mt-1 font-medium tracking-wide">Expediente Técnico-Legal de Contratación • {worker.employerName || "DIMAQUINAS, c.a"}</p>
                        <div className="mt-3 flex gap-3">
                           <span className="text-[8px] font-black bg-black text-white px-2 py-0.5 tracking-widest uppercase">Certificado ISO-9001</span>
                           <span className="text-[8px] font-black border border-black px-2 py-0.5 tracking-widest uppercase">Folio Original</span>
                        </div>
                     </div>
                  </div>
                  <div className="text-right flex flex-col items-end">
                     <p className="text-[9px] font-black text-black">KORE ERP v2.5</p>
                     <div className="w-16 h-16 mt-2 border border-stone-200 p-1 bg-white">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=KORE-${worker.idNumber}`} alt="QR" className="w-full h-full grayscale" />
                     </div>
                  </div>
               </div>

               <div className="p-12 flex-1 flex flex-col">

                  {/* I. Identificación */}
                  <SectionHeader number="I" title="Identificación del Trabajador" />
                  <div className="grid grid-cols-[140px_1fr] gap-10 border border-stone-200 p-8 mb-6">
                     <div className="space-y-4">
                        <div className="aspect-[3/4] bg-stone-100 border border-stone-200 p-1 grayscale">
                           <img src={worker.photo} className="w-full h-full object-cover" alt="Perfil" />
                        </div>
                        <div className="h-6 flex items-center justify-center border-t border-stone-200 pt-2">
                           <p className="text-[8px] font-black text-[#0047AB] uppercase">Estado: Activo</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                        <div><DataLabel>Primer Nombre</DataLabel><DataValue>{worker.firstName}</DataValue></div>
                        <div><DataLabel>Segundo Nombre</DataLabel><DataValue>{worker.secondName}</DataValue></div>
                        <div><DataLabel>Primer Apellido</DataLabel><DataValue>{worker.firstSurname}</DataValue></div>
                        <div><DataLabel>Segundo Apellido</DataLabel><DataValue>{worker.secondSurname}</DataValue></div>
                        <div className="border-t border-stone-100 pt-3"><DataLabel>Cédula de Identidad</DataLabel><DataValue mono>{worker.idNumber}</DataValue></div>
                        <div className="border-t border-stone-100 pt-3 flex gap-4">
                           <div><DataLabel>Fecha de Nacimiento</DataLabel><DataValue mono>{worker.dob}</DataValue></div>
                           <div><DataLabel>Edad</DataLabel><DataValue mono>{calculateAge(worker.dob) || '---'} AÑOS</DataValue></div>
                        </div>
                        <div className="col-span-2"><DataLabel>Lugar / País de Nacimiento</DataLabel><DataValue>{worker.birthPlace}, {worker.birthCountry}</DataValue></div>
                     </div>
                  </div>

                  {/* IV. Datos Contratación */}
                  <SectionHeader number="IV" title="Datos de la Contratación" />
                  <div className="border border-stone-200 grid grid-cols-3 divide-x divide-stone-200 mb-6">
                     <div className="p-5">
                        <DataLabel>Cargo u Oficio</DataLabel>
                        <DataValue className="text-[#0047AB]">{worker.specialty}</DataValue>
                     </div>
                     <div className="p-5">
                        <DataLabel>Fecha Ingreso</DataLabel>
                        <DataValue mono>12/05/2024</DataValue>
                     </div>
                     <div className="p-5">
                        <DataLabel>Nro. Tabulador</DataLabel>
                        <DataValue mono>TAB-084-C</DataValue>
                     </div>
                     <div className="col-span-2 p-5 border-t border-stone-200">
                        <DataLabel>Salario Básico Diario</DataLabel>
                        <DataValue>Bs. 1.250,00 (Mil Doscientos Cincuenta con 00/100)</DataValue>
                     </div>
                     <div className="p-5 border-t border-stone-200">
                        <DataLabel>Forma de Pago</DataLabel>
                        <DataValue>Transferencia</DataValue>
                     </div>
                  </div>

                  {/* V. Datos Personales */}
                  <SectionHeader number="V" title="Datos Personales y Sociales" />
                  <div className="border border-stone-200 p-8 grid grid-cols-3 gap-y-6">
                     <div className="col-span-3"><DataLabel>Dirección / Domicilio de Habitación</DataLabel><DataValue>{worker.address}</DataValue></div>
                     <div><DataLabel>Teléfono Celular</DataLabel><DataValue mono>{worker.cellPhone}</DataValue></div>
                     <div><DataLabel>Teléfono Habitación</DataLabel><DataValue mono>{worker.homePhone}</DataValue></div>
                     <div><DataLabel>Correo Electrónico</DataLabel><DataValue className="lowercase">{worker.email}</DataValue></div>
                     <div className="col-span-3 border-t border-stone-100 pt-6 flex gap-10">
                        <Checkbox label="Inscripción IVSS" checked={worker.ivss} />
                        <Checkbox label="Lateralidad Zurda" checked={worker.leftHanded} />
                        <Checkbox label="Siniestralidad Previa" checked={false} />
                        <Checkbox label="Posee Cargas" checked={worker.dependents?.length > 0} />
                     </div>
                  </div>
               </div>

               <div className="mt-auto px-12 py-6 border-t border-stone-100 flex justify-between items-center text-[#4b5563]">
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em]">Folio I: Datos de Ingreso Administrativo</p>
                  <p className="text-[10px] font-mono font-black">PÁGINA 01 / 02</p>
               </div>
            </div>

            {/* HOJA II: Reverso y Anexos */}
            <div className="sheet-a4 bg-white shadow-[0_50px_100px_rgba(0,0,0,0.8)] flex flex-col print:m-0 print:shadow-none print:w-full overflow-hidden min-h-[1100px] w-full max-w-[800px] relative border border-white/10">

               <div className="p-10 border-b border-stone-200 bg-slate-50 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-[#0047AB] flex items-center justify-center text-white rounded">
                        <span className="material-symbols-outlined text-2xl">folder_shared</span>
                     </div>
                     <h3 className="text-sm font-black uppercase tracking-widest text-black">Anexos Técnico-Legales</h3>
                  </div>
                  <p className="text-[9px] font-mono text-[#4b5563] uppercase tracking-widest font-bold">ID: {worker.idNumber}</p>
               </div>

               <div className="p-12 flex-1">

                  {/* VI & VII */}
                  <div className="grid grid-cols-2 gap-10">
                     <div className="space-y-1">
                        <SectionHeader number="VI" title="Antecedentes Penales" />
                        <div className="border border-stone-200 p-6 space-y-4">
                           <Checkbox label="¿Posee Antecedentes?" checked={worker.criminalRecords?.hasRecords} />
                           <div><DataLabel>Expedido por</DataLabel><DataValue>{worker.criminalRecords?.issuedBy || 'Ministerio de Interior'}</DataValue></div>
                           <div><DataLabel>Fecha Expedición</DataLabel><DataValue mono>{worker.criminalRecords?.date}</DataValue></div>
                        </div>
                     </div>
                     <div className="space-y-1">
                        <SectionHeader number="VII" title="Instrucción Académica" />
                        <div className="border border-stone-200 p-6 space-y-4">
                           <div><DataLabel>Nivel Educativo</DataLabel><DataValue>{worker.education?.secondary || 'Bachiller'}</DataValue></div>
                           <div><DataLabel>Profesión Actual</DataLabel><DataValue>{worker.education?.currentProfession || worker.specialty}</DataValue></div>
                           <Checkbox label="Sabe Leer / Escribir" checked={worker.education?.canRead} />
                        </div>
                     </div>
                  </div>

                  {/* VIII. Actividad Gremial */}
                  <SectionHeader number="VIII" title="Actividad Gremial o Sindical" />
                  <div className="border border-stone-200 p-6 grid grid-cols-2 gap-6">
                     <div><DataLabel>Sindicato / Federación</DataLabel><DataValue>{worker.union?.federation || 'FETRACONSTRUCCIÓN'}</DataValue></div>
                     <div><DataLabel>Cargo que ejerce</DataLabel><DataValue>{worker.union?.position || 'Miembro de Base'}</DataValue></div>
                  </div>

                  {/* XI. Familiares */}
                  <SectionHeader number="XI" title="Cargas Familiares Dependientes" />
                  <div className="border border-stone-200 overflow-hidden">
                     <table className="w-full text-left border-collapse">
                        <thead>
                           <tr className="bg-slate-50 border-b border-stone-200">
                              <th className="px-6 py-2 text-[8px] font-black uppercase text-[#4b5563]">Parentesco</th>
                              <th className="px-6 py-2 text-[8px] font-black uppercase text-[#4b5563]">Nombres y Apellidos</th>
                              <th className="px-6 py-2 text-[8px] font-black uppercase text-[#4b5563]">F. Nacimiento</th>
                           </tr>
                        </thead>
                        <tbody>
                           {(worker.dependents?.length > 0 ? worker.dependents : [1, 2]).map((d: any, i: number) => (
                              <tr key={i} className="border-b border-stone-100 last:border-none">
                                 <td className="px-6 py-3 text-[9px] font-bold text-[#4b5563] uppercase">{d.relationship || '---'}</td>
                                 <td className="px-6 py-3 text-[9px] font-bold text-black">{d.fullName || '---'}</td>
                                 <td className="px-6 py-3 text-[9px] font-mono text-[#4b5563]">{d.dob || '---'}</td>
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>

                  {/* XIII. Firmas */}
                  <SectionHeader number="XIII" title="Firmas y Huellas de Validación" />
                  <div className="border-2 border-stone-200 bg-slate-50 p-8 space-y-8 mt-4">
                     <p className="text-[7px] font-bold text-[#4b5563] italic leading-tight uppercase text-center mb-8">
                        DECLARO BAJO FE DE JURAMENTO QUE LOS DATOS AQUÍ SUMINISTRADOS SON CIERTOS Y AUTORIZO A LA EMPRESA A LA VERIFICACIÓN DE LOS MISMOS.
                     </p>
                     <div className="flex justify-between items-end gap-10 h-32">
                        <div className="flex-1 flex flex-col items-center">
                           <div className="w-16 h-20 border border-stone-300 border-dashed rounded flex flex-col items-center justify-center bg-white mb-2">
                              <span className="material-symbols-outlined text-stone-200 text-3xl">fingerprint</span>
                           </div>
                           <div className="w-full border-t border-stone-400 pt-2 text-center">
                              <p className="text-[7px] font-black uppercase text-black">Huella Dactilar Pulgar</p>
                           </div>
                        </div>
                        <div className="flex-[2] flex flex-col items-center">
                           <div className="w-full border-t border-stone-400 pt-2 text-center">
                              <p className="text-[7px] font-black uppercase text-black">Firma del Trabajador</p>
                           </div>
                        </div>
                        <div className="flex-[2] flex flex-col items-center">
                           <div className="w-full border-t border-stone-400 pt-2 text-center">
                              <p className="text-[7px] font-black uppercase text-black">Firma y Sello Patrono</p>
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* XIV. Anexo Cédula */}
                  <SectionHeader number="XIV" title="Anexo: Documentación de Identidad" />
                  <div className="border-2 border-stone-200 p-10 flex flex-col items-center gap-6 bg-slate-50 relative overflow-hidden">
                     <div className="absolute inset-0 opacity-[0.02] pointer-events-none flex items-center justify-center">
                        <span className="text-[140px] font-black text-black uppercase -rotate-12">COPIA CERTIFICADA</span>
                     </div>
                     <div className="grid grid-cols-2 gap-10 w-full max-w-2xl relative z-10">
                        <div className="aspect-[1.6/1] border-2 border-stone-300 border-dashed rounded-2xl flex flex-col items-center justify-center bg-white shadow-inner">
                           {worker.idPhoto ? (
                              <img src={worker.idPhoto} className="w-full h-full object-contain" alt="Cédula Frontal" />
                           ) : (
                              <>
                                 <span className="material-symbols-outlined text-stone-200 text-6xl mb-2">badge</span>
                                 <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Anverso Cédula</p>
                              </>
                           )}
                        </div>
                        <div className="aspect-[1.6/1] border-2 border-stone-300 border-dashed rounded-2xl flex flex-col items-center justify-center bg-white shadow-inner">
                           <span className="material-symbols-outlined text-stone-200 text-6xl mb-2">badge</span>
                           <p className="text-[8px] font-black text-stone-400 uppercase tracking-widest">Reverso Cédula</p>
                        </div>
                     </div>
                     <p className="text-[8px] font-black text-[#4b5563] uppercase tracking-widest text-center mt-2 opacity-60">
                        DOCUMENTO ARCHIVADO EN EL EXPEDIENTE FÍSICO NRO: {worker.idNumber}
                     </p>
                  </div>
               </div>

               <div className="mt-auto px-12 py-6 border-t border-stone-100 flex justify-between items-center text-[#4b5563] bg-white">
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em]">Folio II: Anexos y Validación Técnico-Legal</p>
                  <p className="text-[10px] font-mono font-black">PÁGINA 02 / 02</p>
               </div>
            </div>
         </main>

         {/* FIXED ACTION FOOTER (iOS STYLE) */}
         <footer className="fixed bottom-0 left-0 right-0 p-8 z-[150] no-print pointer-events-none">
            <div className="max-w-md mx-auto flex flex-col gap-3 pointer-events-auto">
               <button
                  onClick={() => window.print()}
                  className="w-full h-16 bg-[#0047AB] text-white rounded-2xl apple-button shadow-2xl shadow-[#0047AB]/40 flex items-center justify-center gap-4 font-black text-[13px] uppercase tracking-[0.2em]"
               >
                  <span className="material-symbols-outlined text-2xl">print</span>
                  Imprimir Planilla Completa
               </button>
               <button
                  className="w-full h-14 bg-white/5 backdrop-blur-3xl border border-white/10 text-white rounded-2xl apple-button flex items-center justify-center gap-4 font-black text-[11px] uppercase tracking-[0.2em] hover:bg-white/10 transition-colors"
               >
                  <span className="material-symbols-outlined text-[#0047AB] text-xl">picture_as_pdf</span>
                  Descargar PDF Técnico
               </button>
            </div>
         </footer>

         <style>{`
        @media print {
          @page {
            size: letter;
            margin: 0;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .sheet-a4 {
            width: 100% !important;
            max-width: none !important;
            box-shadow: none !important;
            margin: 0 !important;
            border: none !important;
            padding: 0 !important;
          }
          .break-after-page {
            page-break-after: always;
            break-after: page;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
            width: 100% !important;
            gap: 0 !important;
          }
          header, footer, button, .no-print {
            display: none !important;
          }
          #root > div {
            background: white !important;
          }
          .sheet-a4 {
            min-height: 100vh !important;
          }
        }
      `}</style>
      </div>
   );
};

export default WorkerProfile;
