
import React, { useState } from 'react';
import { dataService } from '../services/dataService';

interface Agent {
    id: string;
    name: string;
    role: string;
    description: string;
    icon: string;
    color: string;
    status: 'IDLE' | 'ANALYZING' | 'REPORTING';
    lastActive: string;
}

const AgentCenter: React.FC<{ onNavigate: (view: any) => void }> = ({ onNavigate }) => {
    const [agents] = useState<Agent[]>([
        {
            id: 'stitch',
            name: 'Stitch',
            role: 'Auditor de Compras',
            description: 'Especialista en detección de anomalías de precios y conciliación de facturas.',
            icon: 'analytics',
            color: 'text-emerald-400',
            status: 'IDLE',
            lastActive: 'Hace 5 min'
        },
        {
            id: 'guardian',
            name: 'Guardian-AI',
            role: 'Control de Acceso',
            description: 'Supervisa el flujo de personal y cumplimiento de seguridad laboral.',
            icon: 'security',
            color: 'text-blue-400',
            status: 'IDLE',
            lastActive: 'Hace 2 min'
        },
        {
            id: 'midas',
            name: 'Midas',
            role: 'Controlador Financiero',
            description: 'Analiza el flujo de caja y proyecciones de pagos a proveedores.',
            icon: 'payments',
            color: 'text-amber-400',
            status: 'IDLE',
            lastActive: 'Hace 1 hora'
        },
        {
            id: 'themis',
            name: 'Themis',
            role: 'Control Legal y Nómina',
            description: 'Supervisa la vigencia de recaudos legales y realiza cálculos de prestaciones.',
            icon: 'gavel',
            color: 'text-purple-400',
            status: 'IDLE',
            lastActive: 'Ahora'
        },
        {
            id: 'hermes',
            name: 'Hermes',
            role: 'Enlace WhatsApp',
            description: 'Puente de comunicación para recibir reportes y alertas en tu móvil.',
            icon: 'chat',
            color: 'text-green-400',
            status: 'IDLE',
            lastActive: 'Activo'
        }
    ]);

    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(agents[0]);
    const [auditReport, setAuditReport] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [extractedInvoice, setExtractedInvoice] = useState<any>(null);
    const [extractedLegalDoc, setExtractedLegalDoc] = useState<any>(null);

    const generateStitchReport = async () => {
        setIsAnalyzing(true);
        try {
            const [purchases, inventory, workers, employees] = await Promise.all([
                dataService.getPurchases(),
                dataService.getInventory(),
                dataService.getWorkers(),
                dataService.getEmployees()
            ]);

            const systemData = {
                conteo_compras: purchases.length,
                compras_recientes: purchases.slice(0, 15).map(p => ({
                    proveedor: (p as any).Proveedores?.nombre || 'Desconocido',
                    monto: (p as any).total_neto,
                    estado: (p as any).estado_pago,
                    factura: (p as any).numero_factura,
                    fecha: (p as any).fecha_emision
                })),
                inventario_resumen: inventory.slice(0, 10).map(i => ({
                    item: i.nombre,
                    stock: i.stock_disponible,
                    valor: i.valor_unitario_promedio
                })),
                personal: {
                    obreros: workers.length,
                    empleados: employees.length
                }
            };

            const report = await dataService.getAgentAnalysis(
                "Stitch - Auditor de Compras",
                systemData,
                "Realiza una auditoría exhaustiva. Busca inconsistencias en facturas, evalúa el estado de cuentas por pagar y verifica la rotación de materiales. Dame 3 puntos críticos."
            );

            setAuditReport(report);
            setExtractedInvoice(null);
        } catch (error) {
            console.error('Error in AI analysis:', error);
            setAuditReport("### ⚠️ Error de Conexión\nNo pude contactar con la Red Neuronal de Stitch.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const generateMidasReport = async () => {
        setIsAnalyzing(true);
        try {
            const [purchases, projects] = await Promise.all([
                dataService.getPurchases(),
                dataService.getProjects()
            ]);

            const totalDeuda = purchases
                .filter(p => (p as any).estado_pago === 'POR_PAGAR')
                .reduce((acc, p) => acc + (p as any).total_neto, 0);

            const systemData = {
                indicadores_financieros: {
                    cuentas_por_pagar_total: totalDeuda,
                    proyectos_activos: projects.filter(p => p.status === 'ACTIVE').length,
                    deuda_por_proveedor: purchases.reduce((acc: any, p: any) => {
                        const prov = p.Proveedores?.nombre || 'Otros';
                        if (p.estado_pago === 'POR_PAGAR') {
                            acc[prov] = (acc[prov] || 0) + p.total_neto;
                        }
                        return acc;
                    }, {})
                }
            };

            const report = await dataService.getAgentAnalysis(
                "Midas - Controlador Financiero",
                systemData,
                "Analiza la liquidez de la empresa basada en la deuda acumulada de compras vs la cantidad de proyectos activos. Genera una proyección de flujo de caja para el próximo mes y advierte sobre excesos de deuda con proveedores específicos."
            );

            setAuditReport(report);
            setExtractedInvoice(null);
        } catch (error) {
            console.error('Error in Midas analysis:', error);
            setAuditReport("### ⚠️ Error de Sistema\nMidas no pudo acceder a las bóvedas financieras en este momento.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const generateThemisReport = async () => {
        setIsAnalyzing(true);
        try {
            const [workers, companies] = await Promise.all([
                dataService.getWorkers(),
                dataService.getCompanies()
            ]);

            const systemData = {
                personal: workers.map(w => ({
                    nombre: `${w.first_name} ${w.first_surname}`,
                    rol: w.specialty,
                    estado: w.status,
                    recaudos_completos: !!(w.photo && w.id_photo),
                    hiring_info: w.hiring_data_json
                })),
                empresas: companies.map(c => ({
                    nombre: c.name,
                    rif: c.rif,
                    documentacion: c.documentation
                }))
            };

            const report = await dataService.getAgentAnalysis(
                "Themis - Control Legal y Nómina",
                systemData,
                "Analiza el cumplimiento legal de la documentación de trabajadores y empresas. Identifica quiénes tienen recaudos pendientes (como fotos de ID o RIF) y sugiere pasos para regularizar su estatus legal. Menciona que próximamente estarás habilitado para cálculos de nómina, prestaciones y liquidaciones."
            );

            setAuditReport(report);
            setExtractedInvoice(null);
        } catch (error) {
            console.error('Error in Themis analysis:', error);
            setAuditReport("### ⚠️ Error de Protocolo\nThemis no pudo validar las actas legales en este momento.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const generateHermesReport = async () => {
        setIsAnalyzing(true);
        try {
            const report = "### 📱 Enlace de Comunicación Activo\n\nHola, soy **Hermes**. Mi función es servir de puente entre la inteligencia del ERP y tu WhatsApp.\n\n**¿Cómo puedo ayudarte hoy?**\n1. Enviar resumen de compras del día.\n2. Notificar alertas de seguridad (Guardian).\n3. Consultar estatus legal (Themis).\n\nPuedes iniciar una sesión de chat directo conmigo para recibir reportes automáticos.";
            setAuditReport(report);
            setExtractedInvoice(null);
        } catch (error) {
            console.error('Error in Hermes analysis:', error);
            setAuditReport("### ⚠️ Error de Conexión\nHermes no pudo establecer el puente de mensajería.");
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleWhatsAppRedirect = () => {
        const message = `Hola Hermes, necesito un resumen del estatus actual del ERP.`;
        window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    };

    const handleInvoiceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        setAuditReport(null);
        setExtractedInvoice(null);

        try {
            // En un entorno real, primero subiríamos el archivo a Supabase Storage
            // Para esta demo rápida, usamos una URL temporal (Blob) 
            const imageUrl = URL.createObjectURL(file);

            // Llamamos al método de extracción IA que ya existe en dataService
            const data = await dataService.analyzeInvoiceAI(imageUrl);
            setExtractedInvoice(data);
        } catch (error: any) {
            console.error('OCR Error:', error);
            alert(`Stitch no pudo leer el archivo: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleLegalUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsAnalyzing(true);
        setAuditReport(null);
        setExtractedLegalDoc(null);
        setExtractedInvoice(null);

        try {
            const fileUrl = URL.createObjectURL(file);
            const data = await dataService.analyzeLegalDocument(fileUrl);
            setExtractedLegalDoc(data);
        } catch (error: any) {
            console.error('Legal Analysis Error:', error);
            alert(`Themis no pudo leer el documento: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleSaveInvoice = async () => {
        if (!extractedInvoice) return;
        setIsAnalyzing(true);
        try {
            // Nota: material_id se deja como pendiente para el flujo de conciliación
            await dataService.processIAPurchase({
                rif_proveedor: extractedInvoice.proveedor_rif,
                nombre_proveedor: extractedInvoice.proveedor_nombre,
                numero_factura: extractedInvoice.numero_factura,
                total_neto: extractedInvoice.total_neto,
                items: extractedInvoice.items.map((item: any) => ({
                    material_id: null,
                    cantidad: item.cantidad,
                    precio: item.precio_unitario
                }))
            });
            alert('¡Factura grabada con éxito en el sistema!');
            setExtractedInvoice(null);
        } catch (error: any) {
            console.error('Save Error:', error);
            alert(`Error al grabar: ${error.message || 'Error desconocido'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleAgentAction = () => {
        if (!selectedAgent) return;
        if (selectedAgent.id === 'stitch') generateStitchReport();
        else if (selectedAgent.id === 'midas') generateMidasReport();
        else if (selectedAgent.id === 'themis') generateThemisReport();
        else if (selectedAgent.id === 'hermes') generateHermesReport();
    };

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-4xl mx-auto pb-32 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-emerald-500 animate-pulse">neurology</span>
                        <p className="text-emerald-500 font-black text-[10px] uppercase tracking-[0.4em]">Neural Network Interface</p>
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase leading-none">
                        Central de <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-500">Agentes AI</span>
                    </h1>
                </div>

                <button
                    onClick={() => onNavigate('DASHBOARD')}
                    className="h-12 px-6 rounded-2xl bg-white/5 border border-white/10 text-stone-400 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest flex items-center gap-3 w-fit"
                >
                    <span className="material-symbols-outlined text-sm">grid_view</span>
                    Dashboard
                </button>
            </div>

            {/* List of Agents */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] ml-2">Directorios de Inteligencia</h3>
                <div className="flex flex-col gap-3">
                    {agents.map(agent => (
                        <button
                            key={agent.id}
                            onClick={() => {
                                setSelectedAgent(agent);
                                setAuditReport(null);
                                setExtractedInvoice(null);
                            }}
                            className={`p-5 rounded-3xl border transition-all text-left flex items-center justify-between group ${selectedAgent?.id === agent.id ? 'bg-emerald-500/10 border-emerald-500/40 shadow-xl shadow-emerald-500/5' : 'bg-stone-900/40 border-white/5 hover:border-white/10 hover:bg-white/5'}`}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl bg-stone-950 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform ${agent.color}`}>
                                    <span className="material-symbols-outlined text-2xl">{agent.icon}</span>
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-white uppercase tracking-tight">{agent.name}</h4>
                                    <p className="text-[10px] font-bold text-stone-500 uppercase mt-0.5">{agent.role}</p>
                                </div>
                            </div>
                            {selectedAgent?.id === agent.id && (
                                <span className="material-symbols-outlined text-emerald-500 animate-pulse mr-2">check_circle</span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Agent Workspace */}
            <div className="space-y-6">
                {selectedAgent ? (
                    <div className="bg-stone-900/40 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl flex flex-col min-h-[500px]">
                        {/* Header Context */}
                        <div className="p-8 border-b border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
                            <div className="flex flex-col md:flex-row md:items-center gap-6">
                                <div className={`w-20 h-20 rounded-3xl bg-stone-950 flex items-center justify-center border border-white/10 ${selectedAgent.color} shadow-2xl`}>
                                    <span className="material-symbols-outlined text-5xl">{selectedAgent.icon}</span>
                                </div>
                                <div className="space-y-1">
                                    <h2 className="text-3xl font-black text-white tracking-tighter uppercase">{selectedAgent.name} Context</h2>
                                    <p className="text-stone-400 font-bold text-sm tracking-wide max-w-2xl">{selectedAgent.description}</p>
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="p-8 flex-1">
                            {extractedLegalDoc ? (
                                <div className="bg-purple-500/5 border border-purple-500/20 rounded-3xl p-8 space-y-6 animate-in zoom-in-95">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-purple-400">gavel</span>
                                            <span className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em]">Análisis Legal Completo</span>
                                        </div>
                                        <span className={`text-[10px] font-black px-3 py-1 rounded-full ${extractedLegalDoc.recomendacion?.includes('Rechazar') || extractedLegalDoc.recomendacion?.includes('Riesgo') ? 'bg-red-500 text-white' : 'bg-emerald-500 text-black'}`}>
                                            {extractedLegalDoc.recomendacion || 'Revisión Completada'}
                                        </span>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">Tipo de Documento</p>
                                            <p className="text-2xl font-black text-white uppercase">{extractedLegalDoc.tipo_documento}</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div>
                                                <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-2">Partes Involucradas</p>
                                                <ul className="list-disc list-inside text-stone-300 text-xs space-y-1">
                                                    {extractedLegalDoc.partes_involucradas?.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                                </ul>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-2">Riesgos Identificados</p>
                                                <ul className="space-y-2">
                                                    {extractedLegalDoc.riesgos_identificados?.map((r: string, i: number) => (
                                                        <li key={i} className="text-red-400 text-xs font-bold flex items-start gap-2">
                                                            <span className="material-symbols-outlined text-[14px] mt-0.5">warning</span>
                                                            <span>{r}</span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        </div>

                                        <div className="bg-white/5 p-6 rounded-2xl border border-white/5">
                                            <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest mb-3">Cláusulas Críticas</p>
                                            <div className="space-y-3">
                                                {extractedLegalDoc.clausulas_criticas?.map((c: string, i: number) => (
                                                    <div key={i} className="flex gap-3">
                                                        <div className="w-1 h-full min-h-[1rem] bg-emerald-500/50 rounded-full"></div>
                                                        <p className="text-stone-300 text-xs leading-relaxed">{c}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4 border-t border-white/5">
                                        <button onClick={() => setExtractedLegalDoc(null)} className="flex-1 h-12 bg-white text-black rounded-2xl font-black uppercase text-[10px] hover:bg-purple-400 transition-colors">
                                            Cerrar Análisis
                                        </button>
                                    </div>
                                </div>
                            ) : extractedInvoice ? (
                                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-3xl p-8 space-y-6 animate-in zoom-in-95">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-emerald-400">document_scanner</span>
                                            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Extracción IA Completa</span>
                                        </div>
                                        <span className="text-[10px] font-black text-white px-3 py-1 bg-emerald-500 rounded-full">Listo para procesar</span>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div>
                                                <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">Proveedor</p>
                                                <p className="text-xl font-black text-white uppercase">{extractedInvoice.proveedor_nombre}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">RIF / ID</p>
                                                <p className="text-sm font-bold text-stone-300">{extractedInvoice.proveedor_rif}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">Número de Factura</p>
                                                <p className="text-sm font-bold text-stone-300"># {extractedInvoice.numero_factura || 'No detectado'}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-stone-500 uppercase tracking-widest mb-1">Fecha de Emisión</p>
                                                <p className="text-sm font-bold text-stone-300">{extractedInvoice.fecha_emision || 'No detectada'}</p>
                                            </div>
                                        </div>
                                        <div className="bg-black/20 p-6 rounded-2xl border border-white/5 flex flex-col justify-center text-center">
                                            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2">Total Neto Detectado</p>
                                            <p className="text-4xl font-black text-white tracking-tighter">${extractedInvoice.total_neto?.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="border-t border-white/5 pt-6 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <p className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Detalle de Productos ({extractedInvoice.items?.length || 0})</p>
                                            <span className="text-[9px] font-bold text-emerald-500/60 uppercase">Extracción NotebookLM</span>
                                        </div>
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                            {extractedInvoice.items && extractedInvoice.items.length > 0 ? (
                                                extractedInvoice.items.map((item: any, idx: number) => (
                                                    <div key={idx} className="flex justify-between items-center p-4 bg-white/[0.03] rounded-2xl border border-white/5 hover:bg-white/[0.06] transition-all group">
                                                        <div className="flex flex-col">
                                                            <span className="text-[11px] text-white font-black uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{item.nombre}</span>
                                                            <span className="text-[9px] text-stone-500 font-bold">P. Unitario: ${item.precio_unitario?.toLocaleString()}</span>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-sm text-white font-black">{item.cantidad}</span>
                                                            <p className="text-[9px] text-stone-500 font-bold uppercase">Cant.</p>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="py-8 text-center border-2 border-dashed border-white/5 rounded-3xl">
                                                    <p className="text-stone-500 text-[10px] font-black uppercase">No se detectaron items individuales</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={handleSaveInvoice}
                                            disabled={isAnalyzing}
                                            className="flex-1 h-12 bg-white text-black font-black uppercase text-[10px] rounded-2xl hover:bg-emerald-400 transition-colors disabled:opacity-50"
                                        >
                                            {isAnalyzing ? 'Grabando...' : 'Guardar en Sistema'}
                                        </button>
                                        <button onClick={() => setExtractedInvoice(null)} className="px-6 h-12 bg-white/5 border border-white/10 text-stone-400 rounded-2xl font-black uppercase text-[10px]">Cancelar</button>
                                    </div>
                                </div>
                            ) : auditReport ? (
                                <div className="bg-stone-950/50 border border-white/5 rounded-3xl p-8 space-y-6 animate-in slide-in-from-bottom-4">
                                    <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                                        <span className="material-symbols-outlined text-emerald-400">psychology</span>
                                        <span className="text-[10px] font-black text-stone-400 uppercase tracking-[0.3em]">IA Informe Generado</span>
                                    </div>
                                    <div className="prose prose-invert max-w-none prose-sm">
                                        <div className="text-stone-300 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                                            {auditReport}
                                        </div>
                                    </div>

                                    {selectedAgent.id === 'hermes' && (
                                        <button
                                            onClick={handleWhatsAppRedirect}
                                            className="w-full h-14 bg-green-500 hover:bg-green-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 transition-all animate-in zoom-in-95"
                                        >
                                            <span className="material-symbols-outlined">chat</span>
                                            Abrir Chat Directo con Hermes
                                        </button>
                                    )}
                                </div>
                            ) : isAnalyzing ? (
                                <div className="flex flex-col items-center justify-center py-20 space-y-8">
                                    <div className="relative">
                                        <div className="w-24 h-24 border-b-4 border-emerald-500/40 rounded-full animate-spin"></div>
                                        <div className="w-24 h-24 border-t-4 border-blue-500/40 rounded-full animate-spin absolute inset-0 rotate-45"></div>
                                        <span className="material-symbols-outlined absolute inset-0 flex items-center justify-center text-5xl text-emerald-500 animate-pulse">neurology</span>
                                    </div>
                                    <p className="text-white font-black text-xs uppercase tracking-[0.5em] animate-pulse">Sincronizando con Agente {selectedAgent.name}...</p>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-24 text-center opacity-30 select-none">
                                    <span className="material-symbols-outlined text-7xl text-stone-700 mb-6">dynamic_form</span>
                                    <h4 className="text-stone-500 font-black text-xs uppercase tracking-widest">Consola de Agente</h4>
                                    <p className="text-stone-600 text-[9px] font-bold uppercase mt-2">Listo para recibir órdenes analíticas</p>
                                </div>
                            )}
                        </div>

                        {/* Action Bar */}
                        <div className="p-8 border-t border-white/5 bg-black/20 space-y-4">
                            {/* Primary Action Button */}
                            <button
                                disabled={isAnalyzing}
                                onClick={handleAgentAction}
                                className={`w-full h-16 rounded-3xl font-black uppercase tracking-[0.2em] text-[11px] transition-all flex items-center justify-center gap-4 shadow-2xl active:scale-[0.98] ${selectedAgent.id === 'midas' ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/20' : selectedAgent.id === 'themis' ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/20' : selectedAgent.id === 'hermes' ? 'bg-green-500 hover:bg-green-400 text-white shadow-green-500/20' : 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-emerald-500/20'}`}
                            >
                                <span className="material-symbols-outlined text-xl">bolt</span>
                                {selectedAgent.id === 'stitch' ? 'Auditoría de Compras (Stitch)' : selectedAgent.id === 'midas' ? 'Análisis Financiero (Midas)' : selectedAgent.id === 'themis' ? 'Auditoría Legal (Themis)' : 'Enlace WhatsApp (Hermes)'}
                            </button>

                            {/* Secondary Tool: OCR Scanner & Legal Analysis */}
                            <div className="flex items-center gap-4">
                                <label className="flex-1 group cursor-pointer">
                                    <input
                                        type="file"
                                        accept={selectedAgent.id === 'themis' ? "application/pdf,image/*" : "image/*"}
                                        className="hidden"
                                        onChange={selectedAgent.id === 'themis' ? handleLegalUpload : handleInvoiceUpload}
                                        disabled={isAnalyzing}
                                    />
                                    <div className="h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 text-stone-400 group-hover:bg-white/10 group-hover:text-white transition-all">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white">
                                            <span className="material-symbols-outlined text-sm">auto_stories</span>
                                        </div>
                                        <div className="flex flex-col items-start -space-y-0.5">
                                            <span className="text-[8px] font-black uppercase tracking-widest text-stone-500">Motor de Análisis</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-white">
                                                {selectedAgent.id === 'themis' ? 'NotebookLM (Legal)' : 'NotebookLM (Facturación)'}
                                            </span>
                                        </div>
                                    </div>
                                </label>
                                <button className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl text-stone-400 hover:bg-white/10 transition-all flex items-center justify-center relative group">
                                    <span className="material-symbols-outlined group-hover:animate-spin">settings</span>
                                    <div className="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>


            {/* Bottom Insight Bar */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-white/5 p-6 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-emerald-500/20 transition-colors"></div>
                <div className="flex items-center gap-4 relative z-10">
                    <div className="bg-white/5 p-3 rounded-2xl border border-white/10">
                        <span className="material-symbols-outlined text-white animate-pulse">insights</span>
                    </div>
                    <div>
                        <h5 className="text-white font-black text-xs uppercase tracking-widest">Global Insight</h5>
                        <p className="text-stone-400 text-[10px] font-bold uppercase tracking-tight mt-0.5">El Agente Stitch ha detectado que el cumplimiento de auditoría ha mejorado un 18.2% esta semana.</p>
                    </div>
                </div>
                <button className="relative z-10 h-10 px-6 bg-white/10 hover:bg-white/15 rounded-xl text-[9px] font-black text-white uppercase tracking-widest transition-all border border-white/10">
                    Estadísticas Globales
                </button>
            </div>
        </div>
    );
};

export default AgentCenter;
