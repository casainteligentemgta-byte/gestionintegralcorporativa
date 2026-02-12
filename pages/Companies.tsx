
import React, { useEffect, useState } from 'react';
import { supabase } from '../services/supabase';

interface CompaniesProps {
  onNavigate: (view: any, data?: any) => void;
}

const Companies: React.FC<CompaniesProps> = ({ onNavigate }) => {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('companies')
        .select('*')
        .order('name');

      if (error) throw error;
      setCompanies(data || []);
    } catch (error: any) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(company =>
    company.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.rif?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="pt-12 pb-6 px-6 sticky top-0 z-20 bg-stone-950/80 backdrop-blur-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Empresas</h1>
          <button
            onClick={() => onNavigate('COMPANY_FORM')}
            className="bg-primary hover:bg-primary/90 text-white p-2 rounded-full flex items-center justify-center apple-button"
          >
            <span className="material-symbols-outlined text-2xl leading-none">add</span>
          </button>
        </div>

        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">search</span>
          <input
            className="w-full glass-input rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-primary/50"
            placeholder="Buscar empresa por RIF o nombre..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </header>

      <main className="flex-1 px-4 space-y-4 pb-12">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-50">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Cargando empresas...</p>
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30">
            <span className="material-symbols-outlined text-6xl mb-4">business</span>
            <p className="text-sm font-medium uppercase tracking-widest">No hay empresas registradas</p>
            <button
              onClick={() => onNavigate('COMPANY_FORM')}
              className="mt-4 text-primary text-xs font-bold uppercase tracking-widest"
            >
              Registrar la primera
            </button>
          </div>
        ) : (
          filteredCompanies.map((company: any) => (
            <div key={company.id} className="glass-card rounded-apple p-5 flex flex-col gap-4 transition-transform active:scale-[0.98]">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 overflow-hidden flex items-center justify-center border border-primary/20">
                    {company.logo ? (
                      <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-symbols-outlined text-primary text-2xl">business</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg leading-tight">{company.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5 tracking-wider uppercase">{company.rif}</p>
                  </div>
                </div>
                <button
                  onClick={() => onNavigate('COMPANY_FORM', company)}
                  className="text-slate-500 hover:text-white transition-colors p-1"
                >
                  <span className="material-symbols-outlined">edit_note</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                  <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Ubicación</span>
                  <p className="text-[10px] text-slate-300 truncate">{company.address || 'Sin dirección'}</p>
                </div>
                <div className="bg-white/[0.02] rounded-xl p-3 border border-white/5">
                  <span className="text-[8px] text-slate-500 uppercase font-bold block mb-1">Contacto</span>
                  <p className="text-[10px] text-slate-300 truncate">{company.phone || 'Sin teléfono'}</p>
                </div>
              </div>

              <button
                onClick={() => onNavigate('PROJECTS')}
                className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-white text-[10px] font-bold uppercase tracking-[0.2em] rounded-xl border border-white/5 transition-colors apple-button"
              >
                Gestionar Proyectos
              </button>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default Companies;
