
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
            <div key={company.id} className="glass-card rounded-premium overflow-hidden transition-transform active:scale-[0.98] border-white/5 bg-white/[0.01]">
              <div
                className="relative h-40 sm:h-48 flex flex-col justify-end p-6 group"
                style={company.cover_image ? {
                  backgroundImage: `linear-gradient(to bottom, rgba(10,10,15,0) 0%, rgba(10,10,15,1) 100%), url("${company.cover_image}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                } : {}}
              >
                {!company.cover_image && (
                  <div className="absolute inset-0 bg-primary/5 flex items-center justify-center">
                    <span className="material-symbols-outlined text-6xl text-white/5">corporate_fare</span>
                  </div>
                )}

                {/* Overlay Gradient for Text Readability if no image, or extra if image exists */}
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />

                <div className="relative z-10 flex justify-between items-end gap-4">
                  <div className="flex items-end gap-4">
                    {/* Logo Overlay */}
                    <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-2xl flex items-center justify-center overflow-hidden shrink-0">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-symbols-outlined text-white/50 text-3xl">business</span>
                      )}
                    </div>

                    <div className="space-y-1 mb-1">
                      <h3 className="font-black text-white text-xl sm:text-2xl tracking-tighter leading-none">{company.name}</h3>
                      <p className="text-primary font-bold text-[10px] uppercase tracking-[0.2em]">{company.rif || 'Sin RIF'}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onNavigate('COMPANY_FORM', company)}
                    className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-all hover:scale-110 shrink-0 mb-1"
                  >
                    <span className="material-symbols-outlined text-xl">edit_note</span>
                  </button>
                </div>
              </div>

              <div className="p-4 bg-white/[0.02] border-t border-white/5 space-y-4">
                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Address Section */}
                  <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">location_on</span>
                      Dirección
                    </span>
                    <p className="text-[10px] text-stone-300 font-medium leading-relaxed line-clamp-2">
                      {company.address || 'Sin dirección registrada'}
                    </p>
                  </div>

                  {/* Contact Section */}
                  <div className="bg-white/[0.03] rounded-xl p-3 border border-white/5 flex flex-col gap-1">
                    <span className="text-[8px] font-black text-stone-500 uppercase tracking-widest flex items-center gap-1">
                      <span className="material-symbols-outlined text-[10px]">contact_phone</span>
                      Contacto
                    </span>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5 text-stone-300">
                        <span className="material-symbols-outlined text-[10px] text-stone-500">smartphone</span>
                        <span className="text-[10px] font-mono tracking-wider">
                          {company.representative_whatsapp || company.representative?.whatsapp || 'N/A'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-stone-300">
                        <span className="material-symbols-outlined text-[10px] text-stone-500">mail</span>
                        <span className="text-[10px] truncate" title={company.representative_email || company.representative?.email}>
                          {company.representative_email || company.representative?.email || 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => onNavigate('PROJECTS')}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-white/5 transition-colors apple-button flex items-center justify-center gap-2 group"
                  >
                    <span className="material-symbols-outlined text-sm text-stone-400 group-hover:text-white transition-colors">architecture</span>
                    Gestión Obras
                  </button>
                  <button
                    onClick={() => onNavigate('COMPANY_DOSSIER', company)}
                    className="flex-1 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 hover:text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl border border-blue-500/20 transition-colors apple-button flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">folder_open</span>
                    Archivo Legal
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default Companies;
