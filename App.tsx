
import React, { useState, useEffect } from 'react';
import { AppView, Worker, Company, Project } from './types';
import Layout from '@/components/Layout';
import AuthGuard from '@/components/AuthGuard';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Workers from '@/pages/Workers';
import WorkerProfile from '@/pages/WorkerProfile';
import WorkerIDCard from '@/pages/WorkerIDCard';
import Companies from '@/pages/Companies';
import CompanyForm from '@/pages/CompanyForm';
import CompanyDossier from '@/pages/CompanyDossier';
import Projects from '@/pages/Projects';
import ProjectForm from '@/pages/ProjectForm';
import WorkerForm from '@/pages/WorkerForm';
import RequisitionDetail from '@/pages/RequisitionDetail';
import InventoryDashboard from '@/pages/InventoryDashboard';
import InventoryMovementHub from '@/pages/InventoryMovementHub';
import MaterialForm from '@/pages/MaterialForm';
import TicketManagement from '@/pages/TicketManagement';
import MovementHistory from '@/pages/MovementHistory';
import RequisitionForm from '@/pages/RequisitionForm';
import RecruitmentForm from '@/pages/RecruitmentForm';
import WorkerDigitalSheet from '@/pages/WorkerDigitalSheet';
import GuardianConsole from '@/pages/GuardianConsole';
import PurchaseManagement from '@/pages/PurchaseManagement';
import StockMovementSAP from '@/pages/StockMovementSAP';
import QualityGate from '@/pages/QualityGate';
import TechnicalReport from '@/pages/TechnicalReport';
import AdvancedStockEntry from '@/pages/AdvancedStockEntry';
import MaterialRequestForm from '@/pages/MaterialRequestForm';
import WarehouseDispatchPanel from '@/pages/WarehouseDispatchPanel';
import StockTaking from '@/pages/StockTaking';
import AuditDashboard from '@/pages/AuditDashboard';
import InventoryValuationReport from '@/pages/InventoryValuationReport';
import HiringReview from '@/pages/HiringReview';
import JobCostReport from '@/pages/JobCostReport';
import Settings from '@/pages/Settings';
import PasswordRecovery from '@/pages/PasswordRecovery';
import IncomingMerchandise from '@/pages/IncomingMerchandise';
import PurchaseReports from '@/pages/PurchaseReports';
import AccountingDashboard from '@/pages/AccountingDashboard';
import UserManagement from '@/pages/UserManagement';
import Employees from '@/pages/Employees';
import AgentCenter from '@/pages/AgentCenter';
import EmployeePostulationForm from '@/pages/EmployeePostulationForm';
import { supabase } from './services/supabase';

const App: React.FC = () => {
  const [view, setView] = useState<AppView>('LOGIN');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedMaterialCategory, setSelectedMaterialCategory] = useState<'MATERIALES' | 'MAQUINARIA' | 'COMBUSTIBLES' | 'EPP'>('MATERIALES');
  const [selectedRequisitionId, setSelectedRequisitionId] = useState<string | null>(null);
  const [workerContext, setWorkerContext] = useState<'OBRERO' | 'EMPLEADO' | 'PENDING_REVIEW' | null>(null);
  const [recruitmentData, setRecruitmentData] = useState<{ projectId: string, companyId: string, type: 'WORKER' | 'EMPLOYEE' } | null>(null);
  const [selectedMovementCode, setSelectedMovementCode] = useState<'101' | '311' | '501' | '601' | null>(null);

  const [inventoryHighlight, setInventoryHighlight] = useState<string | null>(null);
  const [incomingTab, setIncomingTab] = useState<'TRANSFER' | 'AUDIT' | 'RETURN'>('TRANSFER');

  useEffect(() => {
    // Check for recruitmen URL
    const urlParams = new URLSearchParams(window.location.search);
    const recruitProj = urlParams.get('recruit_proj');
    const recruitComp = urlParams.get('recruit_comp');

    if (recruitProj) {
      const type = (urlParams.get('recruit_type') as 'WORKER' | 'EMPLOYEE') || 'WORKER';
      setRecruitmentData({
        projectId: recruitProj,
        companyId: recruitComp || '',
        type
      });
      setView(type === 'EMPLOYEE' ? 'EMPLOYEE_POSTULATION' : 'RECRUITMENT_FORM');
      return;
    }

    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setView('DASHBOARD');
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setView('PASSWORD_RECOVERY');
      } else if (session) {
        setView('DASHBOARD');
      } else if (event === 'SIGNED_OUT') {
        setView('LOGIN');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleNavigate = (newView: AppView, data?: any, context?: any) => {
    // 1. Primero establecer los datos necesarios
    if (newView === 'INCOMING_MERCHANDISE') {
      setIncomingTab(data?.tab || 'TRANSFER');
    }
    // 1. Primero establecer los datos necesarios
    if (newView === 'WORKER_PROFILE' || newView === 'WORKER_CARNET' || newView === 'WORKER_FORM' || newView === 'WORKER_DIGITAL_SHEET' || newView === 'HIRING_REVIEW') {
      setSelectedWorker(data || null);
    }

    if (newView === 'COMPANY_FORM' || newView === 'COMPANY_DOSSIER') {
      setSelectedCompany(data || null);
    }

    if (newView === 'PROJECT_FORM') {
      setSelectedProject(data || null);
    }

    if (newView === 'WORKERS' || newView === 'EMPLOYEES') {
      setSelectedProject(data || null);
      if (context) setWorkerContext(context);
    }

    if (newView === 'INVENTORY_DASHBOARD') {
      // Manage highlight state
      if (data && data.highlight) {
        setInventoryHighlight(data.highlight);
      } else {
        setInventoryHighlight(null);
      }
    }

    if (newView === 'REQUISITION_DETAIL') {
      setSelectedRequisitionId(data || null);
    }

    if (newView === 'STOCK_MOVEMENT_SAP') {
      setSelectedMovementCode(data?.code || null);
    }
    if (newView === 'ADVANCED_STOCK_ENTRY' && data?.category) {
      setSelectedMaterialCategory(data.category);
    }

    // 2. Limpiar contextos si navegamos fuera de trabajadores
    if (newView !== 'WORKERS' && newView !== 'WORKER_FORM' && newView !== 'HIRING_REVIEW') {
      setWorkerContext(null);
    }

    // 3. Cambiar la vista al final para asegurar que los estados anteriores ya se enviaron a procesar
    setView(newView);
    window.scrollTo(0, 0);
  };

  const handleLogin = () => {
    setView('DASHBOARD');
  };

  const renderView = () => {
    const isSupabaseConfigured = import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      console.warn("⚠️ ADVERTENCIA: Credenciales de Supabase no detectadas. La base de datos no funcionará hasta que se configuren VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY.");
    }

    switch (view) {
      case 'LOGIN':
        return <Login onLogin={handleLogin} />;
      case 'DASHBOARD':
        return <Dashboard onNavigate={handleNavigate} />;
      case 'COMPANIES':
        return <Companies onNavigate={handleNavigate} />;
      case 'COMPANY_FORM':
        return <CompanyForm key={selectedCompany?.id || 'new-company'} company={selectedCompany} onNavigate={handleNavigate} />;
      case 'COMPANY_DOSSIER':
        return <CompanyDossier key={selectedCompany?.id || 'dossier'} company={selectedCompany} onNavigate={handleNavigate} />;
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
        return (
          <WorkerForm
            key={selectedWorker?.id ? `edit-${selectedWorker.id}` : 'new-worker'}
            worker={selectedWorker}
            onNavigate={handleNavigate}
          />
        );
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
      case 'WORKER_DIGITAL_SHEET':
        return selectedWorker ? (
          <WorkerDigitalSheet key={`sheet-${selectedWorker.id}`} worker={selectedWorker} onNavigate={handleNavigate} />
        ) : (
          <Workers onNavigate={handleNavigate} />
        );
      case 'REQUISITION_DETAIL':
        return <RequisitionDetail requisitionId={selectedRequisitionId || undefined} onNavigate={handleNavigate} />;
      case 'INVENTORY_DASHBOARD':
        return <InventoryDashboard onNavigate={handleNavigate} highlight={inventoryHighlight} />;
      case 'INVENTORY_MOVEMENT_HUB':
        return <InventoryMovementHub onNavigate={handleNavigate} />;
      case 'MATERIAL_FORM':
        return <MaterialForm onNavigate={handleNavigate} />;
      case 'TICKET_MANAGEMENT':
        return <TicketManagement onNavigate={handleNavigate} />;
      case 'REQUISITION_FORM':
        return <RequisitionForm onNavigate={handleNavigate} />;
      case 'MOVEMENT_HISTORY':
        return <MovementHistory onNavigate={handleNavigate} />;
      case 'RECRUITMENT_FORM':
        return <RecruitmentForm context={recruitmentData} onNavigate={handleNavigate} />;
      case 'EMPLOYEE_POSTULATION':
        return <EmployeePostulationForm context={recruitmentData} onNavigate={handleNavigate} />;
      case 'HIRING_REVIEW':
        return selectedWorker ? (
          <HiringReview key={`review-${selectedWorker.id}`} worker={selectedWorker} onNavigate={handleNavigate} />
        ) : (
          <Workers onNavigate={handleNavigate} />
        );
      case 'PURCHASE_MANAGEMENT':
        return <PurchaseManagement onNavigate={handleNavigate} initialMode={recruitmentData?.projectId === 'CREATE_MANUAL' ? 'CREATE' : undefined} />;
      case 'QUALITY_GATE':
        return <QualityGate onNavigate={handleNavigate} />;
      case 'TECHNICAL_REPORT':
        return <TechnicalReport onNavigate={handleNavigate} />;
      case 'ADVANCED_STOCK_ENTRY':
        return <AdvancedStockEntry onNavigate={handleNavigate} selectedCategory={selectedMaterialCategory} />;
      case 'MATERIAL_REQUEST_FORM':
        return <MaterialRequestForm onNavigate={handleNavigate} />;
      case 'WAREHOUSE_DISPATCH_PANEL':
        return <WarehouseDispatchPanel onNavigate={handleNavigate} />;
      case 'STOCKTAKING':
        return <StockTaking onNavigate={handleNavigate} />;
      case 'AUDIT_DASHBOARD':
        return <AuditDashboard onNavigate={handleNavigate} />;
      case 'INVENTORY_VALUATION_REPORT':
        return <InventoryValuationReport onNavigate={handleNavigate} />;
      case 'STOCK_MOVEMENT_SAP':
        return <StockMovementSAP initialCode={selectedMovementCode || undefined} onNavigate={handleNavigate} />;
      case 'INCOMING_MERCHANDISE':
        return <IncomingMerchandise onNavigate={handleNavigate} initialTab={incomingTab} />;
      case 'JOB_COST_REPORT':
        return <JobCostReport onNavigate={handleNavigate} />;
      case 'GUARDIAN_CONSOLE':
        return <GuardianConsole onNavigate={handleNavigate} />;
      case 'PASSWORD_RECOVERY':
        return <PasswordRecovery onNavigate={handleNavigate} />;
      case 'PURCHASE_REPORTS':
        return <PurchaseReports onNavigate={handleNavigate} />;
      case 'ACCOUNTING_DASHBOARD':
        return <AccountingDashboard onNavigate={handleNavigate} />;
      case 'USER_MANAGEMENT':
        return <UserManagement onNavigate={handleNavigate} />;
      case 'EMPLOYEES':
        return <Employees key={selectedProject?.id || 'corporate'} project={selectedProject} onNavigate={handleNavigate} />;
      case 'AGENT_CENTER':
        return <AgentCenter onNavigate={handleNavigate} />;
      case 'SETTINGS':
        return <Settings onNavigate={handleNavigate} />;
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
    // AuthGuard temporalmente desactivado - ejecutar supabase_multi_tenant_setup.sql primero
    // <AuthGuard onNavigate={handleNavigate}>
    <Layout currentView={view} onNavigate={handleNavigate}>
      {renderView()}
    </Layout>
    // </AuthGuard>
  );
};

export default App;
