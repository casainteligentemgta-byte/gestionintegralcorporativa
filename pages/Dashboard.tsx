
import React, { useEffect, useState } from 'react';
import { dataService } from '../services/dataService';

interface DashboardProps {
  onNavigate: (view: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    companies: 0,
    projects: 0,
    workers: 0,
    employees: 0,
    inventory: 0,
    pendingWorkers: 0
  });
  const [loading, setLoading] = useState(true);
  const [matriz, setMatriz] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [companies, projects, workers, employees, inventory] = await Promise.all([
          dataService.getCompanies(),
          dataService.getProjects(),
          dataService.getWorkers(),
          dataService.getEmployees(),
          dataService.getInventory()
        ]);
        setStats({
          companies: companies.length,
          projects: projects.length,
          workers: workers.length,
          employees: employees.length,
          inventory: inventory.length,
          pendingWorkers: workers.filter((w: any) => w.status === 'PENDING_REVIEW').length
        });
        if (companies.length > 0) {
          setMatriz(companies[0]);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleMatrizProfile = () => {
    onNavigate('COMPANY_FORM', matriz);
  };

  return (
    <div className="p-4 space-y-4 animate-in fade-in duration-500 max-h-screen overflow-hidden">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Dashboard</h1>
        </div>
        <button
          onClick={handleMatrizProfile}
          className="relative group active:scale-95 transition-transform"
        >
          <img
            alt="Profile"
            className="w-10 h-10 rounded-full border border-white/10 group-hover:border-primary/50 transition-colors"
            src={matriz?.logo || "https://picsum.photos/seed/legal/100/100"}
          />
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-stone-950 rounded-full group-hover:scale-110 transition-transform"></div>
        </button>
      </header>

      {/* Alerta de Postulaciones Pendientes */}
      {!loading && stats.pendingWorkers > 0 && (
        <button
          onClick={() => onNavigate('WORKERS', null, 'PENDING_REVIEW')}
          className="w-full bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center border border-amber-500/30">
              <span className="material-symbols-outlined text-amber-500 text-2xl">pending_actions</span>
            </div>
            <div className="text-left">
              <h4 className="text-amber-500 font-black text-xs uppercase tracking-widest">Postulaciones Pendientes</h4>
              <p className="text-stone-400 text-[10px] font-medium leading-tight">Hay {stats.pendingWorkers} prospecto(s) esperando revisión de RRHH.</p>
            </div>
          </div>
          <span className="material-symbols-outlined text-amber-500/50 group-hover:translate-x-1 transition-transform">chevron_right</span>
        </button>
      )}

      <div className="grid grid-cols-2 gap-3 pb-8">
        {/* Empresas - Row 1 Left */}
        <button
          onClick={() => onNavigate('COMPANIES')}
          className="glass-card rounded-apple p-3 flex flex-col justify-between h-28 apple-button text-left bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20"
        >
          <div className="bg-purple-500/10 p-1.5 rounded-lg border border-purple-500/20 w-fit">
            <span className="material-symbols-outlined text-purple-500 text-lg">corporate_fare</span>
          </div>
          <div className="w-full">
            <h4 className="text-[13px] font-black tracking-tighter uppercase leading-none w-full flex justify-between items-end">
              <span>Empresas</span>
              <span className="text-sm opacity-60 tabular-nums">{loading ? '...' : stats.companies}</span>
            </h4>
          </div>
        </button>

        {/* PERSONAL - Row 1 Right */}
        {/* PERSONAL - Row 1 Right - SPLIT CONTAINER */}
        <div className="glass-card rounded-apple p-2 flex flex-col justify-between h-28 bg-gradient-to-br from-emerald-500/10 to-transparent border border-emerald-500/20">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20 w-fit shrink-0">
              <span className="material-symbols-outlined text-emerald-500 text-lg">groups</span>
            </div>
            <h4 className="text-[11px] font-black tracking-tighter uppercase leading-none text-white">Personal</h4>
          </div>

          <div className="flex flex-col gap-1 mt-0.5">
            <button
              onClick={() => onNavigate('EMPLOYEES')}
              className="flex justify-between items-center px-1.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-1 border-l-2 border-purple-500 pl-1">
                <span className="text-[7.5px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white">Empleados</span>
              </div>
              <span className="font-mono text-[9px] font-bold text-white">{loading ? '..' : stats.employees}</span>
            </button>
            <button
              onClick={() => onNavigate('WORKERS')}
              className="flex justify-between items-center px-1.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/5 transition-all active:scale-95 group"
            >
              <div className="flex items-center gap-1 border-l-2 border-emerald-500 pl-1">
                <span className="text-[7.5px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-white">Obreros</span>
              </div>
              <span className="font-mono text-[9px] font-bold text-white">{loading ? '..' : stats.workers}</span>
            </button>
          </div>
        </div>

        {/* Inventario - Row 2 Left */}
        <button
          onClick={() => onNavigate('INVENTORY_MOVEMENT_HUB')}
          className="glass-card rounded-apple p-3 flex flex-col justify-between h-28 apple-button text-left bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20"
        >
          <div className="bg-blue-500/10 p-1.5 rounded-lg border border-blue-500/20 w-fit">
            <span className="material-symbols-outlined text-blue-500 text-lg">inventory_2</span>
          </div>
          <div className="w-full">
            <h4 className="text-[13px] font-black tracking-tighter uppercase leading-none w-full flex justify-between items-end">
              <span>Inventario</span>
              <span className="text-sm opacity-60 tabular-nums">{loading ? '...' : stats.inventory}</span>
            </h4>
          </div>
        </button>

        {/* Obras - Row 2 Right */}
        <button
          onClick={() => onNavigate('PROJECTS')}
          className="glass-card rounded-apple p-3 flex flex-col justify-between h-28 apple-button text-left bg-gradient-to-br from-amber-500/10 to-transparent border border-amber-500/20"
        >
          <div className="bg-amber-500/10 p-1.5 rounded-lg border border-amber-500/20 w-fit">
            <span className="material-symbols-outlined text-amber-500 text-lg">architecture</span>
          </div>
          <div className="w-full">
            <h4 className="text-[13px] font-black tracking-tighter uppercase leading-none w-full flex justify-between items-end">
              <span>Obras</span>
              <span className="text-sm opacity-60 tabular-nums">{loading ? '...' : stats.projects}</span>
            </h4>
          </div>
        </button>

        {/* CONTABILIDAD - Row 3 Left */}
        <button
          onClick={() => onNavigate('ACCOUNTING_DASHBOARD')}
          className="glass-card rounded-apple p-3 flex flex-col justify-between h-28 apple-button text-left bg-gradient-to-br from-rose-500/10 to-transparent border border-rose-500/20"
        >
          <div className="bg-rose-500/10 p-1.5 rounded-lg border border-rose-500/20 w-fit">
            <span className="material-symbols-outlined text-rose-500 text-lg">account_balance_wallet</span>
          </div>
          <div className="w-full">
            <h4 className="text-[13px] font-black tracking-tighter uppercase leading-none w-full flex justify-between items-end">
              <span>Finanzas</span>
              <span className="text-[8px] opacity-60 font-black uppercase tracking-tighter">CXP</span>
            </h4>
          </div>
        </button>

        {/* IA AGENTES - Row 3 Right */}
        <button
          onClick={() => onNavigate('AGENT_CENTER')}
          className="glass-card rounded-apple p-3 flex flex-col justify-between h-28 apple-button text-left bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border border-emerald-500/20"
        >
          <div className="bg-emerald-500/10 p-1.5 rounded-lg border border-emerald-500/20 w-fit">
            <span className="material-symbols-outlined text-emerald-500 text-lg animate-pulse">neurology</span>
          </div>
          <div className="w-full">
            <h4 className="text-[13px] font-black tracking-tighter uppercase leading-none w-full flex justify-between items-end">
              <span>IA Agentes</span>
              <span className="text-[8px] opacity-60 font-black uppercase tracking-tighter">Live</span>
            </h4>
          </div>
        </button>

        {/* Purchase Reports - Full Width Bottom */}
        <button
          onClick={() => onNavigate('PURCHASE_REPORTS')}
          className="col-span-2 glass-card rounded-apple p-4 flex flex-row justify-between items-center apple-button text-left bg-emerald-500/5 hover:bg-emerald-500/10 border-emerald-500/20 mt-2"
        >
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20">
              <span className="material-symbols-outlined text-emerald-500 text-xl">receipt_long</span>
            </div>
            <div>
              <p className="text-[9px] font-black tracking-widest uppercase text-emerald-500 mb-0.5">Reportes Financieros</p>
              <h4 className="text-xl font-black tracking-tighter text-white">Historial de Compras</h4>
            </div>
          </div>
          <span className="material-symbols-outlined text-emerald-500/50 text-lg">arrow_forward_ios</span>
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
