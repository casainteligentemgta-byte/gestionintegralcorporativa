
import React from 'react';

interface DashboardProps {
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  return (
    <div className="p-6 space-y-8">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        </div>
        <div className="relative">
          <img 
            alt="Profile" 
            className="w-12 h-12 rounded-full border border-white/10" 
            src="https://picsum.photos/seed/legal/100/100" 
          />
          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-stone-950 rounded-full"></div>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4">
        {/* Main Bento Card */}
        <button 
          onClick={() => onNavigate('COMPANIES')}
          className="col-span-2 glass-card rounded-apple p-6 relative overflow-hidden bg-gradient-to-br from-primary/10 via-transparent to-transparent apple-button text-left"
        >
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-primary/20 blur-3xl rounded-full"></div>
          <div className="flex flex-col justify-between h-full space-y-8">
            <div className="flex justify-between items-start">
              <div className="bg-primary/20 p-3 rounded-lg border border-primary/30">
                <span className="material-symbols-outlined text-primary text-3xl">corporate_fare</span>
              </div>
              <span className="material-symbols-outlined text-slate-500">arrow_forward_ios</span>
            </div>
            <div>
              <p className="text-slate-400 text-sm font-medium">Empresas Registradas</p>
              <h3 className="text-5xl font-extrabold mt-1">24</h3>
            </div>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('PROJECTS')}
          className="glass-card rounded-apple p-5 flex flex-col justify-between aspect-square apple-button text-left"
        >
          <div className="bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 w-fit">
            <span className="material-symbols-outlined text-amber-500 text-2xl">architecture</span>
          </div>
          <div>
            <h4 className="text-3xl font-bold">12</h4>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-bold">Obras Activas</p>
          </div>
        </button>

        <button 
          onClick={() => onNavigate('WORKERS')}
          className="glass-card rounded-apple p-5 flex flex-col justify-between aspect-square apple-button text-left"
        >
          <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 w-fit">
            <span className="material-symbols-outlined text-emerald-500 text-2xl">groups</span>
          </div>
          <div>
            <h4 className="text-3xl font-bold">45</h4>
            <p className="text-slate-500 text-xs mt-1 uppercase tracking-wider font-bold">Obreros</p>
          </div>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500 px-1">Actividad Reciente</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card rounded-xl p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-slate-400 text-lg">edit_note</span>
              </div>
              <div>
                <p className="text-xs font-bold">Actualización de Contrato</p>
                <p className="text-[10px] text-slate-500">Juan Pérez - Maestro de Obra • Hace 2 horas</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
