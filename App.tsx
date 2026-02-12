
import React, { useState, useEffect } from 'react';
import { AppView, Worker, Company, Project } from './types';
import Layout from '@/components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workers from './pages/Workers';
import WorkerProfile from './pages/WorkerProfile';
import WorkerIDCard from './pages/WorkerIDCard';
import Companies from './pages/Companies';
import CompanyForm from './pages/CompanyForm';
import Projects from './pages/Projects';
import ProjectForm from './pages/ProjectForm';
import WorkerForm from './pages/WorkerForm';
import RequisitionDetail from './pages/RequisitionDetail';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LOGIN');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null);
  const [workerContext, setWorkerContext] = useState<'OBRERO' | 'EMPLEADO' | null>(null);

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setView('DASHBOARD');
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session) {
        setView('DASHBOARD');
      } else {
        setView('LOGIN');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (newView: AppView, data?: any, context?: any) => {
    // Reset context-specific states
    if (newView !== 'WORKERS') setWorkerContext(null);

    if (newView === 'WORKER_PROFILE' || newView === 'WORKER_CARNET' || newView === 'WORKER_FORM') {
      setSelectedWorker(data || null);
    }

    if (newView === 'COMPANY_FORM') {
      setSelectedCompany(data || null);
    }

    if (newView === 'PROJECT_FORM') {
      setSelectedProject(data || null);
    }

    if (newView === 'WORKERS') {
      setSelectedProject(data || null);
      if (context) setWorkerContext(context);
    }

    if (newView === 'REQUISITION_DETAIL') {
      setSelectedRequisitionId(data || null);
    }

    setView(newView);
  };

  const handleLogin = () => {
    setView('DASHBOARD');
  };

  const renderView = () => {
    switch (view) {
      case 'LOGIN':
        return <Login onLogin={handleLogin} />;
      case 'DASHBOARD':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'COMPANIES':
        return <Companies onNavigate={handleNavigate} />;
      case 'COMPANY_FORM':
        return <CompanyForm key={selectedCompany?.id || 'new-company'} company={selectedCompany} onNavigate={handleNavigate} />;
      case 'PROJECTS':
        return <Projects onNavigate={handleNavigate} />;
      case 'PROJECT_FORM':
        return <ProjectForm key={selectedProject?.id || 'new-project'} project={selectedProject} onNavigate={handleNavigate} />;
      case 'WORKERS':
        return (
          <Workers
            key={`${selectedProject?.id || 'all'}-${workerContext}`}
            project={selectedProject}
            type={workerContext}
            onNavigate={handleNavigate}
          />
        );
      case 'WORKER_FORM':
        return <WorkerForm key={selectedWorker?.id || 'new-worker'} worker={selectedWorker} onNavigate={handleNavigate} />;
      case 'WORKER_PROFILE':
        return selectedWorker ? (
          <WorkerProfile key={selectedWorker.id} worker={selectedWorker} onNavigate={handleNavigate} />
        ) : (
          <Workers onNavigate={handleNavigate} />
        );
      case 'WORKER_CARNET':
        return selectedWorker ? (
          <WorkerIDCard key={`carnet-${selectedWorker.id}`} worker={selectedWorker} onNavigate={handleNavigate} />
        ) : (
          <Workers onNavigate={handleNavigate} />
        );
      case 'REQUISITION_DETAIL':
        return <RequisitionDetail requisitionId={selectedRequisitionId || undefined} onNavigate={handleNavigate} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-full p-12 text-center opacity-50">
            <span className="material-symbols-outlined text-6xl mb-4">construction</span>
            <h2 className="text-xl font-bold uppercase tracking-widest">Vista en construcción</h2>
            <button
              onClick={() => setView('DASHBOARD')}
              className="mt-6 text-primary font-bold uppercase tracking-widest text-xs"
            >
              Volver al inicio
            </button>
          </div>
        );
    }
  };

  return (
    <Layout currentView={view} onNavigate={handleNavigate}>
      {renderView()}
    </Layout>
  );
};

export default App;
