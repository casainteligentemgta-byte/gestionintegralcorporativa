
import React from 'react';
import { Worker } from '../types';

interface WorkerIDCardProps {
  worker: Worker | any;
  onNavigate: (view: any) => void;
}

const WorkerIDCard: React.FC<WorkerIDCardProps> = ({ worker, onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col items-center bg-stone-950 text-white">
      <nav className="w-full max-w-md px-6 py-4 flex items-center justify-between mb-8 no-print">
        <button onClick={() => onNavigate('WORKER_PROFILE')} className="flex items-center gap-2 text-stone-400">
          <span className="material-symbols-outlined text-2xl">chevron_left</span>
          <span className="text-lg font-semibold tracking-tight">Identificación</span>
        </button>
        <div className="px-3 py-1 bg-stone-900 rounded-full border border-stone-800">
          <span className="text-[10px] font-bold text-primary tracking-widest uppercase">ID EMPRESA</span>
        </div>
      </nav>

      <main className="flex flex-col gap-8 items-center px-4 w-full">
        {/* Front side */}
        <div className="w-[320px] h-[500px] bg-stone-900 rounded-[2.5rem] relative overflow-hidden shadow-2xl border border-stone-800 shrink-0">
          <div className="h-32 bg-primary flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none">
              <svg height="100%" preserveAspectRatio="none" viewBox="0 0 100 100" width="100%">
                <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white"></path>
              </svg>
            </div>
            <div className="z-10 flex flex-col items-center">
              <span className="text-xl font-black tracking-tighter text-white uppercase">EMPRESA PATRONAL</span>
              <span className="text-[8px] tracking-[0.3em] font-bold uppercase opacity-80">Soluciones Integrales</span>
            </div>
          </div>
          
          <div className="flex-grow flex flex-col items-center -mt-12 px-8 z-20">
            <div className="w-32 h-32 rounded-full border-4 border-stone-900 bg-stone-800 overflow-hidden shadow-2xl mb-6">
              <img 
                alt="Trabajador" 
                className="w-full h-full object-cover grayscale" 
                src={worker.photo || "https://picsum.photos/seed/worker/200/200"} 
              />
            </div>
            <div className="text-center w-full">
              <h2 className="text-2xl font-bold mb-1 tracking-tight uppercase">{worker.firstName} {worker.firstSurname}</h2>
              <p className="text-primary font-bold text-sm uppercase tracking-widest mb-6">{worker.specialty}</p>
              
              <div className="flex flex-col items-center pt-6 border-t border-stone-800/50">
                <span className="text-[10px] text-stone-500 uppercase font-bold block mb-1">Cédula de Identidad</span>
                <span className="text-base font-medium tracking-wider font-mono">{worker.idNumber}</span>
              </div>
            </div>
          </div>
          
          <div className="p-6 flex justify-center items-center opacity-30">
            <span className="material-symbols-outlined text-2xl">contactless</span>
          </div>
        </div>

        {/* Back side */}
        <div className="w-[320px] h-[500px] bg-stone-900 rounded-[2.5rem] relative overflow-hidden shadow-2xl border border-stone-800 shrink-0">
           <div className="p-8 flex flex-col items-center h-full">
            <div className="text-center mb-8">
              <h3 className="text-[10px] font-bold text-stone-500 uppercase tracking-[0.2em] mb-4">Validación Digital</h3>
              <div className="bg-white p-3 rounded-2xl">
                <img 
                  alt="QR Validation" 
                  className="w-32 h-32" 
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=KORE-VERIFIED" 
                />
              </div>
            </div>
            
            <div className="w-full space-y-4 flex-grow">
              <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                <span className="text-[10px] text-stone-500 uppercase font-bold block mb-1">Contacto de Emergencia</span>
                <p className="text-sm font-semibold">Carmen Ruiz (Madre)</p>
                <p className="text-xs text-stone-400">+58 412-5550192</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block mb-1">Sangre</span>
                  <p className="text-lg font-bold text-red-500">O+</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <span className="text-[10px] text-stone-500 uppercase font-bold block mb-1">Vence</span>
                  <p className="text-xs font-semibold">DIC 2025</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <p className="text-[9px] text-stone-600 leading-relaxed max-w-[200px]">
                Este documento es propiedad de la empresa. En caso de extravío, por favor devolver a las oficinas administrativas.
              </p>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-stone-950/80 backdrop-blur-xl border-t border-stone-800 z-50 max-w-md mx-auto no-print">
        <button 
          onClick={() => window.print()}
          className="w-full bg-primary hover:bg-blue-600 active:scale-95 transition-all text-white font-bold py-4 rounded-2xl shadow-2xl flex items-center justify-center gap-3"
        >
          <span className="material-symbols-outlined">print</span>
          <span className="text-sm uppercase tracking-widest">Imprimir Carnet</span>
        </button>
      </div>

      <div className="mt-8 text-stone-600 text-[10px] uppercase font-bold tracking-widest text-center px-10 mb-32 no-print">
        Carnet de Identificación de Obra <br/> Estética Premium Apple
      </div>
    </div>
  );
};

export default WorkerIDCard;
