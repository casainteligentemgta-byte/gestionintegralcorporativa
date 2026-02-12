
import React from 'react';
import { AppView } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  title?: string;
}

const Layout: React.FC<LayoutProps> = ({ children, currentView, onNavigate, title }) => {
  if (currentView === 'LOGIN') return <>{children}</>;

  const NavItem = ({ view, icon, label }: { view: AppView, icon: string, label: string }) => {
    const isActive = currentView === view || (view === 'DASHBOARD' && currentView === 'CONTROL_PANEL');
    return (
      <button 
        onClick={() => onNavigate(view)}
        className={`flex flex-col items-center gap-1 transition-colors ${isActive ? 'text-primary' : 'text-slate-500'}`}
      >
        <span className="material-symbols-outlined text-2xl leading-none">{icon}</span>
        <span className="text-[10px] font-medium">{label}</span>
      </button>
    );
  };

  return (
    <div className="max-w-md mx-auto min-h-screen bg-stone-950 flex flex-col relative overflow-hidden">
      {/* iOS Status Bar Mock */}
      <div className="h-10 w-full flex justify-between items-center px-8 shrink-0 bg-stone-950/80 backdrop-blur-md sticky top-0 z-[60] no-print">
        <span className="text-xs font-semibold"></span>
        <div className="flex gap-1.5 items-center">
          {/* Icons removed as per request */}
        </div>
      </div>

      <main className="flex-1 pb-24 overflow-y-auto overflow-x-hidden">
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 glass-card border-t border-white/5 flex items-start justify-around px-6 pt-3 z-[100] max-w-md mx-auto no-print">
        <NavItem view="DASHBOARD" icon="grid_view" label="Inicio" />
        <NavItem view="COMPANIES" icon="business" label="Empresas" />
        <NavItem view="PROJECTS" icon="architecture" label="Obras" />
        <NavItem view="WORKERS" icon="groups" label="Nómina" />
        <NavItem view="WORKER_FORM" icon="settings" label="Ajustes" />
        {/* Home Indicator */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full"></div>
      </nav>
    </div>
  );
};

export default Layout;
