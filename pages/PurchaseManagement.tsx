
import React, { useState, useEffect, useRef } from 'react';
import { dataService } from '../services/dataService';

interface PurchaseManagementProps {
    onNavigate: (view: any, data?: any) => void;
    initialMode?: PurchaseMode;
}

type PurchaseMode = 'HISTORY' | 'CREATE' | 'EDIT' | 'REVIEW_AI';
type CreateMethod = 'IA' | 'MANUAL';

const PurchaseManagement: React.FC<PurchaseManagementProps> = ({ onNavigate, initialMode }) => {
    const [mode, setMode] = useState<PurchaseMode>(initialMode || 'HISTORY');
    const [createMethod, setCreateMethod] = useState<CreateMethod>('IA');
    const [purchases, setPurchases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Form States
    const [providers, setProviders] = useState<any[]>([]);
    const [inventory, setInventory] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [aiStep, setAiStep] = useState<1 | 2>(1);
    const [aiAnalysis, setAiAnalysis] = useState<any>({
        proveedor_nombre: '',
        proveedor_rif: '',
        numero_factura: '',
        fecha_emision: '',
        total_neto: 0,
        archivo_pdf_url: '',
        mappedItems: [],
        orden_compra: '',
        guia_remision: '',
        guia_archivo_url: '',
        placa_vehiculo: '',
        fecha_recepcion: new Date().toISOString()
    });
    const [manualForm, setManualForm] = useState({
        providerId: '',
        providerName: '',
        providerRif: '',
        invoiceNumber: '',
        invoiceDate: new Date().toISOString().split('T')[0],
        orden_compra: '',
        guia_remision: '',
        guia_archivo_url: '',
        placa_vehiculo: '',
        fecha_recepcion: new Date().toISOString(),
        totalNeto: 0,
        archivo_pdf_url: '',
        items: [{
            material_id: '',
            nombre_material: '',
            cantidad: 0,
            cantidad_recibida: 0,
            conformidad_calidad: 'CONFORME',
            observaciones: ''
        }]
    });
    const [manualStep, setManualStep] = useState<1 | 2>(1);
    const [historyViewMode, setHistoryViewMode] = useState<'INVOICES' | 'ITEMS'>('INVOICES');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [showOthersInput, setShowOthersInput] = useState(false);
    const [tempItemName, setTempItemName] = useState('');
    const [tempSelectedItem, setTempSelectedItem] = useState<any>(null);

    // New States for Custom Classifications
    const [customSubCategory, setCustomSubCategory] = useState('');
    const [customType, setCustomType] = useState('');

    const subCategories: Record<string, { id: string; label: string }[]> = {
        MATERIALES: [
            { id: 'ACEROS', label: 'Aceros / Cabillas' },
            { id: 'AGREGADOS', label: 'Agregados (Arena/Piedra)' },
            { id: 'CEMENTO', label: 'Cementos y Yesos' },
            { id: 'BLOQUES', label: 'Bloques y Ladrillos' },
            { id: 'TUBERIA_PVC_AGUAS_NEGRAS', label: 'Tubería PVC Aguas Negras' },
            { id: 'TUBERIA_PVC_AGUAS_BLANCAS', label: 'Tubería PVC Aguas Blancas' },
            { id: 'TUBERIA_PVC_ELECTRICIDAD', label: 'Tubería PVC Electricidad' },
            { id: 'TUBERIA_HG', label: 'Tubería Hierro Galv. (HG)' },
            { id: 'TUBERIA_TERMOFUSION', label: 'Tubería Termofusión' },
            { id: 'CONEXIONES_PVC', label: 'Conexiones PVC / HG' },
            { id: 'ELECTRICIDAD_CABLES', label: 'Electricidad - Cables' },
            { id: 'ELECTRICIDAD_ILUMINACION', label: 'Electricidad - Iluminación' },
            { id: 'ELECTRICIDAD_MECANISMOS', label: 'Electricidad - Tomacorrientes/Int.' },
            { id: 'PINTURAS', label: 'Pinturas y Solventes' },
            { id: 'IMPERMEABILIZACION', label: 'Impermeabilización' },
            { id: 'CERAMICAS', label: 'Cerámicas y Porcelanatos' },
            { id: 'BAÑOS', label: 'Piezas Sanitarias y Grifería' },
            { id: 'CARPINTERIA', label: 'Madera y Carpintería' },
            { id: 'HERRERIA', label: 'Perfiles y Herrería' }
        ],
        MAQUINARIA: [
            { id: 'PESADA', label: 'Maquinaria Pesada' },
            { id: 'LIVIANA', label: 'Maquinaria Liviana' },
            { id: 'VEHICULOS', label: 'Vehículos de Obra' },
            { id: 'HERRAMIENTAS_MANUALES', label: 'Herramientas Manuales' },
            { id: 'HERRAMIENTAS_ELECTRICAS', label: 'Herramientas Eléctricas' },
            { id: 'REPUESTOS', label: 'Repuestos y Partes' }
        ],
        COMBUSTIBLES: [
            { id: 'DIESEL', label: 'Diesel / Gasoil' },
            { id: 'GASOLINA', label: 'Gasolina' },
            { id: 'ACEITES', label: 'Aceites y Lubricantes' },
            { id: 'ADITIVOS', label: 'Aditivos y Refrigerantes' }
        ],
        EPP: [
            { id: 'CASCOS', label: 'Protección de Cabeza (Cascos)' },
            { id: 'GUANTES', label: 'Protección de Manos (Guantes)' },
            { id: 'BOTAS', label: 'Calzados de Seguridad' },
            { id: 'LENTES', label: 'Protección Visual (Lentes)' },
            { id: 'AUDITIVA', label: 'Protección Auditiva' },
            { id: 'RESPIRATORIA', label: 'Protección Respiratoria' },
            { id: 'ALTURA', label: 'Trabajo en Altura (Arneses)' },
            { id: 'UNIFORMES', label: 'Ropa de Trabajo y Uniformes' },
            { id: 'SEÑALIZACION', label: 'Señalización y Conos' }
        ]
    };

    // 3rd Level: Specific Types for each Subcategory (EXHAUSTIVE LIST)
    const itemTypes: Record<string, { id: string; label: string }[]> = {
        // --- MATERIALES ---
        ACEROS: [
            { id: 'CABILLA_3_8', label: 'Cabilla 3/8" (Num 3)' },
            { id: 'CABILLA_1_2', label: 'Cabilla 1/2" (Num 4)' },
            { id: 'CABILLA_5_8', label: 'Cabilla 5/8" (Num 5)' },
            { id: 'CABILLA_3_4', label: 'Cabilla 3/4" (Num 6)' },
            { id: 'CABILLA_1', label: 'Cabilla 1" (Num 8)' },
            { id: 'MALLA_TRUCSON_4X4', label: 'Malla Trucson 4x4' },
            { id: 'MALLA_TRUCSON_6X6', label: 'Malla Trucson 6x6' },
            { id: 'ALAMBRE_DULCE_18', label: 'Alambre Dulce Cal. 18' },
            { id: 'CLAVOS_ACERO', label: 'Clavos de Acero (Cajas)' },
            { id: 'CLAVOS_MADERA', label: 'Clavos de Madera (Kilos)' }
        ],
        AGREGADOS: [
            { id: 'ARENA_LAVADA', label: 'Arena Lavada (M3)' },
            { id: 'ARENA_CERNER', label: 'Arena de Cerner/Amarilla (M3)' },
            { id: 'PIEDRA_PICADA_1', label: 'Piedra Picada Nº 1 (M3)' },
            { id: 'PIEDRA_PICADA_1_2', label: 'Piedrita Nº 1/2 (M3)' },
            { id: 'POLVILLO', label: 'Polvillo (M3)' },
            { id: 'GRANZON', label: 'Granzón (M3)' },
            { id: 'TIERRA_RELLENO', label: 'Tierra de Relleno (M3)' },
            { id: 'TIERRA_NEGRA', label: 'Tierra Negra (M3)' }
        ],
        CEMENTO: [
            { id: 'CEMENTO_GRIS_TIPO_1', label: 'Cemento Gris Tipo I (Saco 42.5Kg)' },
            { id: 'CEMENTO_BLANCO', label: 'Cemento Blanco (Saco 20Kg)' },
            { id: 'YESO', label: 'Yeso (Saco)' },
            { id: 'ESTUCO', label: 'Estuco (Saco)' },
            { id: 'PEGO_GRIS', label: 'Pego Gris (Saco)' },
            { id: 'PEGO_BLANCO', label: 'Pego Blanco (Saco)' },
            { id: 'CAL', label: 'Cal en Pasta/Polvo' }
        ],
        BLOQUES: [
            { id: 'BLOQUE_ARCILLA_10', label: 'Bloque Arcilla 10cm' },
            { id: 'BLOQUE_ARCILLA_15', label: 'Bloque Arcilla 15cm' },
            { id: 'BLOQUE_CEMENTO_10', label: 'Bloque Cemento 10cm' },
            { id: 'BLOQUE_CEMENTO_15', label: 'Bloque Cemento 15cm' },
            { id: 'LADRILLO_MACIZO', label: 'Ladrillo Macizo' },
            { id: 'TABELON_6', label: 'Tabelón 6cm' },
            { id: 'TABELON_8', label: 'Tabelón 8cm' },
            { id: 'U_BLOQUE', label: 'Bloques en U' }
        ],
        TUBERIA_PVC_AGUAS_NEGRAS: [
            { id: 'TUBO_PVC_AN_2', label: 'Tubo AN 2" (3mts)' },
            { id: 'TUBO_PVC_AN_3', label: 'Tubo AN 3" (3mts)' },
            { id: 'TUBO_PVC_AN_4', label: 'Tubo AN 4" (3mts)' },
            { id: 'TUBO_PVC_AN_6', label: 'Tubo AN 6" (3mts)' },
            { id: 'TUBO_PVC_AN_8', label: 'Tubo AN 8" (3mts)' }
        ],
        TUBERIA_PVC_AGUAS_BLANCAS: [
            { id: 'TUBO_PVC_AB_1_2', label: 'Tubo AB 1/2" (3mts)' },
            { id: 'TUBO_PVC_AB_3_4', label: 'Tubo AB 3/4" (3mts)' },
            { id: 'TUBO_PVC_AB_1', label: 'Tubo AB 1" (3mts)' },
            { id: 'TUBO_PVC_AB_1_1_2', label: 'Tubo AB 1½" (3mts)' },
            { id: 'TUBO_PVC_AB_2', label: 'Tubo AB 2" (3mts)' }
        ],
        TUBERIA_PVC_ELECTRICIDAD: [
            { id: 'TUBO_ELEC_1_2', label: 'Tubo Elec. 1/2" (3mts)' },
            { id: 'TUBO_ELEC_3_4', label: 'Tubo Elec. 3/4" (3mts)' },
            { id: 'TUBO_ELEC_1', label: 'Tubo Elec. 1" (3mts)' },
            { id: 'TUBO_ELEC_1_1_2', label: 'Tubo Elec. 1½" (3mts)' },
            { id: 'TUBO_ELEC_2', label: 'Tubo Elec. 2" (3mts)' },
            { id: 'CAJETIN_METAL_2X4', label: 'Cajetín Metal 2x4' },
            { id: 'CAJETIN_METAL_4X4', label: 'Cajetín Metal 4x4' },
            { id: 'CAJETIN_OCTOGONAL', label: 'Cajetín Octogonal' }
        ],
        TUBERIA_HG: [
            { id: 'TUBO_HG_1_2', label: 'Tubo ISO HG 1/2"' },
            { id: 'TUBO_HG_3_4', label: 'Tubo ISO HG 3/4"' },
            { id: 'TUBO_HG_1', label: 'Tubo ISO HG 1"' },
            { id: 'TUBO_HG_2', label: 'Tubo ISO HG 2"' },
            { id: 'TUBO_HG_3', label: 'Tubo ISO HG 3"' },
            { id: 'TUBO_HG_4', label: 'Tubo ISO HG 4"' }
        ],
        TUBERIA_TERMOFUSION: [
            { id: 'TUBO_TF_20MM', label: 'Tubo TF 20mm (1/2")' },
            { id: 'TUBO_TF_25MM', label: 'Tubo TF 25mm (3/4")' },
            { id: 'TUBO_TF_32MM', label: 'Tubo TF 32mm (1")' },
            { id: 'TUBO_TF_40MM', label: 'Tubo TF 40mm (1¼")' },
            { id: 'TUBO_TF_50MM', label: 'Tubo TF 50mm (1½")' },
            { id: 'TUBO_TF_63MM', label: 'Tubo TF 63mm (2")' }
        ],
        CONEXIONES_PVC: [
            { id: 'CODO_90', label: 'Codo 90º' },
            { id: 'CODO_45', label: 'Codo 45º' },
            { id: 'TEE', label: 'Tee' },
            { id: 'YEE', label: 'Yee' },
            { id: 'ADAPTADOR_MACHO', label: 'Adaptador Macho' },
            { id: 'ADAPTADOR_HEMBRA', label: 'Adaptador Hembra' },
            { id: 'UNION', label: 'Unión' },
            { id: 'SIFON', label: 'Sifón' },
            { id: 'ANILLO', label: 'Anillo' }
        ],
        ELECTRICIDAD_CABLES: [
            { id: 'CABLE_THW_18', label: 'Cable THW #18' },
            { id: 'CABLE_THW_16', label: 'Cable THW #16' },
            { id: 'CABLE_THW_14', label: 'Cable THW #14' },
            { id: 'CABLE_THW_12', label: 'Cable THW #12' },
            { id: 'CABLE_THW_10', label: 'Cable THW #10' },
            { id: 'CABLE_THW_8', label: 'Cable THW #8' },
            { id: 'CABLE_THW_6', label: 'Cable THW #6' },
            { id: 'CABLE_THW_4', label: 'Cable THW #4' },
            { id: 'CABLE_THW_2', label: 'Cable THW #2' },
            { id: 'CABLE_TTU_1_0', label: 'Cable TTU 1/0' },
            { id: 'CABLE_TTU_2_0', label: 'Cable TTU 2/0' },
            { id: 'CABLE_TTU_4_0', label: 'Cable TTU 4/0' }
        ],
        ELECTRICIDAD_ILUMINACION: [
            { id: 'BOMBILLO_LED', label: 'Bombillo LED E27' },
            { id: 'PANEL_LED_EMPOTRAR', label: 'Panel LED Empotrar' },
            { id: 'PANEL_LED_SOBREPONER', label: 'Panel LED Sobreponer' },
            { id: 'REFLECTOR_LED', label: 'Reflector LED' },
            { id: 'CINTA_LED', label: 'Cinta LED' }
        ],
        ELECTRICIDAD_MECANISMOS: [
            { id: 'TOMACORRIENTE_DOBLE', label: 'Tomacorriente Doble' },
            { id: 'INTERRUPTOR_SENCILLO', label: 'Interruptor Sencillo' },
            { id: 'INTERRUPTOR_DOBLE', label: 'Interruptor Doble' },
            { id: 'INTERRUPTOR_TRIPLE', label: 'Interruptor Triple' },
            { id: 'TOMACORRIENTE_GFCI', label: 'Tomacorriente GFCI' },
            { id: 'BREAKER_1X20', label: 'Breaker 1x20A' },
            { id: 'BREAKER_2X40', label: 'Breaker 2x40A' }
        ],
        PINTURAS: [
            { id: 'PINTURA_CAUCHO_A', label: 'Pintura Caucho Clase A' },
            { id: 'PINTURA_CAUCHO_B', label: 'Pintura Caucho Clase B' },
            { id: 'PINTURA_ESMALTE', label: 'Pintura Esmalte' },
            { id: 'FONDO_HERRERIA', label: 'Fondo Herrería' },
            { id: 'PASTA_PROFESIONAL', label: 'Pasta Profesional' },
            { id: 'THINNER', label: 'Thinner / Solvente' },
            { id: 'BROCHA_2', label: 'Brocha 2"' },
            { id: 'RODILLO_ANTIGOTA', label: 'Rodillo Antigota' }
        ],
        IMPERMEABILIZACION: [
            { id: 'MANTO_ASFALTICO_3MM', label: 'Manto Asfáltico 3mm' },
            { id: 'MANTO_ASFALTICO_4MM', label: 'Manto Asfáltico 4mm' },
            { id: 'PRIMER', label: 'Primer' },
            { id: 'PINTURA_ALUMINIZADA', label: 'Pintura Aluminizada' },
            { id: 'CEMENTO_PLASTICO', label: 'Cemento Plástico' }
        ],
        HERRERIA: [
            { id: 'TUBO_ESTRUCTURAL_100X100', label: 'Tubo Estruct. 100x100' },
            { id: 'TUBO_ESTRUCTURAL_80X40', label: 'Tubo Estruct. 80x40' },
            { id: 'ANGULO_HIERRO', label: 'Ángulo Hierro' },
            { id: 'PLETINA', label: 'Pletina' },
            { id: 'ELECTRODOS_6013', label: 'Electrodos 6013' },
            { id: 'DISCO_CORTE', label: 'Disco de Corte' },
            { id: 'DISCO_DESBASTE', label: 'Disco de Desbaste' }
        ],

        // --- EPP ---
        GUANTES: [
            { id: 'GUANTE_CARNAZA_CORTO', label: 'Carnaza Corto' },
            { id: 'GUANTE_CARNAZA_LARGO', label: 'Carnaza Largo/Soldador' },
            { id: 'GUANTE_TELA_PUNTOS', label: 'Tela con Puntos PVC' },
            { id: 'GUANTE_NITRILO', label: 'Nitrilo' },
            { id: 'GUANTE_LATEX', label: 'Látex Industrial' },
            { id: 'GUANTE_DIELECTRICO', label: 'Dieléctrico' }
        ],
        CASCOS: [
            { id: 'CASCO_SEGURIDAD', label: 'Casco de Seguridad' },
            { id: 'BARBIQUEJO', label: 'Barbiquejo' }
        ],
        BOTAS: [
            { id: 'BOTAS_SEGURIDAD_CUERO', label: 'Botas Cuero Punta Acero' },
            { id: 'BOTAS_SEGURIDAD_DIELECTRICAS', label: 'Botas Dieléctricas' },
            { id: 'BOTAS_GOMA', label: 'Botas de Goma (Lluvia/Concreto)' }
        ],
        LENTES: [
            { id: 'LENTES_CLAROS', label: 'Lentes Claros' },
            { id: 'LENTES_OSCUROS', label: 'Lentes Oscuros' },
            { id: 'CARETA_SOLDAR', label: 'Careta de Soldar' },
            { id: 'CARETA_ESMERILAR', label: 'Careta de Esmerilar (Facial)' }
        ],

        // --- COMBUSTIBLES ---
        ACEITES: [
            { id: 'ACEITE_15W40_DIESEL', label: '15W40 Diesel' },
            { id: 'ACEITE_20W50_GASOLINA', label: '20W50 Gasolina' },
            { id: 'ACEITE_HIDRAULICO_68', label: 'Hidráulico 68' },
            { id: 'ACEITE_TRANSMISION_80W90', label: 'Transmisión 80W90' },
            { id: 'GRASA_CHASIS', label: 'Grasa Chasis' },
            { id: 'GRASA_RODAMIENTOS', label: 'Grasa Rodamientos' }
        ]
    };

    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [pData, provData, invData] = await Promise.all([
                dataService.getPurchases(),
                dataService.getProviders(),
                dataService.getInventory()
            ]);
            setPurchases(pData);
            setProviders(provData);
            setInventory(invData);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            const cleanName = file.name.replace(/[^a-z0-9.]/gi, '_');
            const fileName = `procurement/${Date.now()}_${cleanName}`;
            const publicUrl = await dataService.uploadFile('documents', fileName, file);
            setManualForm(prev => ({ ...prev, archivo_pdf_url: publicUrl }));
            return publicUrl;
        } catch (error: any) {
            alert("Error al subir archivo: " + error.message);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleIAFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsProcessing(true);
        try {
            // 1. Subir a Storage con nombre limpio
            const cleanName = file.name.replace(/[^a-z0-9.]/gi, '_');
            const fileName = `ai_analysis/${Date.now()}_${cleanName}`;
            const publicUrl = await dataService.uploadFile('documents', fileName, file);

            // 2. Analizar con Gemini
            const analysis = await dataService.analyzeInvoiceAI(publicUrl);

            // 3. Obtener Mapas de Memoria IA
            const mappings = await dataService.getAIMappings();

            // 4. Preparar estado de revisión con Auto-Mapping
            setAiAnalysis({
                ...analysis,
                archivo_pdf_url: publicUrl,
                mappedItems: analysis.items.map((item: any) => {
                    const match = mappings.find(m => m.text_factura.toLowerCase() === item.nombre.toLowerCase());
                    const matchedInv = match ? inventory.find(inv => inv.id === match.material_id) : null;
                    return {
                        ...item,
                        material_id: match ? match.material_id : '',
                        nombre_material: matchedInv ? matchedInv.nombre : '',
                        is_auto_mapped: !!match
                    };
                })
            });

            setMode('REVIEW_AI');
        } catch (error: any) {
            alert("Error en el Análisis IA: " + error.message);
            console.error(error);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleConfirmAI = async () => {
        if (aiStep === 1) {
            // Validar que todos los materiales estén mapeados
            const unmapped = aiAnalysis.mappedItems.some((it: any) => !it.material_id && !it.nombre_material);
            if (unmapped) {
                alert("Por favor, asocie todos los ítems detectados con materiales del inventario.");
                return;
            }
            setAiStep(2);
            return;
        }

        try {
            console.log('🚀 Iniciando handleConfirmAI...');
            setIsProcessing(true);

            // Validación previa
            if (!aiAnalysis.mappedItems || aiAnalysis.mappedItems.length === 0) {
                alert("No hay ítems para procesar.");
                setIsProcessing(false);
                return;
            }

            // 1. Asegurar que los materiales existan (Crear nuevos si es necesario)
            const processedItems = await Promise.all(aiAnalysis.mappedItems.map(async (item: any) => {
                let mid = item.material_id;
                if (!mid && item.nombre_material) {
                    const existing = inventory.find(m => m.nombre.toUpperCase() === item.nombre_material.toUpperCase());
                    if (existing) {
                        mid = existing.id;
                    } else {
                        const newMaterial = await dataService.createMaterial({
                            nombre: item.nombre_material.toUpperCase(),
                            unidad_medida: 'UND',
                            stock_disponible: 0,
                            valor_unitario_promedio: item.precio_unitario
                        });
                        mid = newMaterial.id;
                    }
                }
                return {
                    ...item,
                    material_id: mid
                };
            }));

            // 2. Aprender mapeos para el futuro
            await Promise.all(processedItems.map((item: any) =>
                item.material_id ? dataService.saveAIMapping(item.nombre, item.material_id) : Promise.resolve()
            ));

            // 3. Pre-populate Manual Form with AI Data for Review
            setManualForm({
                providerId: null, // Let the manual form logic handle provider creation/selection via logic
                providerName: aiAnalysis.proveedor_nombre || '',
                providerRif: aiAnalysis.proveedor_rif || '',
                invoiceNumber: aiAnalysis.numero_factura || '',
                orden_compra: aiAnalysis.orden_compra || '',
                guia_remision: aiAnalysis.guia_remision || '',
                guia_archivo_url: aiAnalysis.guia_archivo_url || '',
                placa_vehiculo: aiAnalysis.placa_vehiculo || '',
                archivo_pdf_url: aiAnalysis.archivo_pdf_url || '',
                fecha_recepcion: new Date().toISOString(),
                totalNeto: aiAnalysis.total_neto || 0,
                items: processedItems.map((pi: any) => ({
                    material_id: pi.material_id || '',
                    nombre_material: pi.nombre_material || pi.descripcion || '', // Fallback to description if mapped name is missing
                    cantidad: pi.cantidad || 0,
                    cantidad_recibida: pi.cantidad_recibida ?? pi.cantidad, // Default to invoice qty
                    precio: pi.precio_unitario || 0,
                    conformidad_calidad: pi.conformidad_calidad || 'CONFORME',
                    observaciones: pi.observaciones || ''
                }))
            });

            // Switch to Manual Mode for user validation
            setCreateMethod('MANUAL');
            setMode('CREATE');
            setIsProcessing(false);
            setAiStep(0); // Reset AI step to clear the AI modal

        } catch (error: any) {
            console.error('Error al preparar validación manual:', error);
            alert("⚠️ ERROR TÉCNICO AL PREPARAR DATOS:\n\n" + (error.message || "Error desconocido"));
            setIsProcessing(false);
        }
    };

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🚀 Iniciando handleManualSubmit...');
        setIsProcessing(true);
        try {
            let finalProviderId = manualForm.providerId;
            let rif = manualForm.providerRif;
            let nombre = manualForm.providerName;

            // Memoria de Proveedores: Si no hay ID, buscar o crear
            if (!finalProviderId) {
                const existing = providers.find(p => p.rif.toUpperCase() === rif.toUpperCase() || p.nombre.toUpperCase() === nombre.toUpperCase());
                if (existing) {
                    finalProviderId = existing.id;
                    rif = existing.rif;
                    nombre = existing.nombre;
                } else if (rif && nombre) {
                    // Es un proveedor nuevo, guardarlo para el futuro
                    const newProv = await dataService.createProvider({ nombre, rif });
                    finalProviderId = newProv.id;
                }
            }

            if (!rif || !nombre) throw new Error("Debe ingresar Nombre y RIF del proveedor");

            // Validar que no exista ya una factura con este número para este proveedor
            const facturaExistente = purchases.find(p =>
                p.Proveedores?.rif?.toUpperCase() === rif.toUpperCase() &&
                p.numero_factura?.toUpperCase() === manualForm.invoiceNumber.toUpperCase()
            );

            if (facturaExistente) {
                const confirmar = window.confirm(
                    `⚠️ ADVERTENCIA: Ya existe una factura con el número "${manualForm.invoiceNumber}" para el proveedor con RIF "${rif}".\n\n` +
                    `Fecha de registro: ${new Date(facturaExistente.fecha).toLocaleDateString()}\n` +
                    `Total: $${facturaExistente.total_neto}\n\n` +
                    `¿Deseas continuar de todas formas? (No recomendado)`
                );

                if (!confirmar) {
                    setIsProcessing(false);
                    return;
                }
            }

            const totalCalculated = manualForm.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);

            // Filter out empty items
            const validItems = manualForm.items.filter(item => item.nombre_material && item.nombre_material.trim() !== '');

            if (validItems.length === 0) {
                alert("Debe agregar al menos un ítem a la factura.");
                setIsProcessing(false);
                return;
            }

            // Memoria de Materiales
            const processedItems = await Promise.all(validItems.map(async (item) => {
                let mid = item.material_id;
                if (!mid && item.nombre_material) {
                    const existing = inventory.find(m => m.nombre.toUpperCase() === item.nombre_material.toUpperCase());
                    if (existing) {
                        mid = existing.id;
                    } else {
                        // Crear material nuevo "sobre la marcha"
                        // Include classification data if available
                        const classificationData: any = {};
                        if (item.classification) {
                            classificationData.categoria = item.classification.category;
                            classificationData.specs_data = {
                                subcategoria: item.classification.subCategory,
                                tipo: item.classification.type,
                                origen: 'CREACION_MANUAL_COMPRA'
                            };
                        }

                        const newMaterial = await dataService.createMaterial({
                            nombre: item.nombre_material.toUpperCase(),
                            unidad_medida: 'UND', // Default
                            stock_disponible: 0,
                            valor_unitario_promedio: item.precio,
                            ...classificationData
                        });
                        mid = newMaterial.id;
                    }
                }
                return { material_id: mid, cantidad: item.cantidad, precio: item.precio };
            }));

            if (mode === 'EDIT' && editingId) {
                await dataService.updatePurchase(editingId, {
                    fecha: new Date(manualForm.invoiceDate).toISOString(),
                    proveedor_id: finalProviderId || null,
                    numero_factura: manualForm.invoiceNumber,
                    total_neto: totalCalculated,
                    archivo_pdf_url: manualForm.archivo_pdf_url,
                    orden_compra: manualForm.orden_compra,
                    guia_remision: manualForm.guia_remision,
                    guia_archivo_url: manualForm.guia_archivo_url,
                    placa_vehiculo: manualForm.placa_vehiculo
                });
                alert("Factura actualizada.");
            } else {
                await dataService.processIAPurchase({
                    rif_proveedor: rif,
                    nombre_proveedor: nombre,
                    numero_factura: manualForm.invoiceNumber,
                    // fecha removed - auto handled
                    total_neto: totalCalculated,
                    archivo_pdf_url: manualForm.archivo_pdf_url,
                    orden_compra: manualForm.orden_compra,
                    guia_remision: manualForm.guia_remision,
                    guia_archivo_url: manualForm.guia_archivo_url,
                    placa_vehiculo: manualForm.placa_vehiculo,
                    items: processedItems.map((pi, idx) => ({
                        ...pi,
                        cantidad_recibida: validItems[idx].cantidad_recibida,
                        conformidad_calidad: validItems[idx].conformidad_calidad,
                        observaciones: validItems[idx].observaciones || ''
                    }))
                });
                alert("Mercancia Ingresada con Exito");
            }

            onNavigate('INVENTORY_DASHBOARD', { highlight: 'PURCHASE' });
            setMode('HISTORY');
            loadData();
        } catch (error: any) {
            console.error('Error al procesar compra manual:', error);
            const errorMsg = error.message || "Error desconocido";
            if (errorMsg.includes('Ya existe una factura')) {
                alert("⚠️ FACTURA DUPLICADA\n\n" + errorMsg + "\n\nPor favor, verifica el número de factura e intenta nuevamente.");
            } else {
                alert("⚠️ ERROR TÉCNICO AL INGRESAR:\n\n" + errorMsg + "\n\nPor favor, contacta a soporte si el problema persiste.");
            }
        } finally {
            setIsProcessing(false);
        }
    };

    const handleEdit = (purchase: any) => {
        setEditingId(purchase.id);
        setManualForm({
            providerId: purchase.proveedor_id,
            providerName: purchase.Proveedores?.nombre || '',
            providerRif: purchase.Proveedores?.rif || '',
            invoiceNumber: purchase.numero_factura,
            totalNeto: purchase.total_neto,
            archivo_pdf_url: purchase.archivo_pdf_url || '',
            orden_compra: purchase.orden_compra || '',
            guia_remision: purchase.guia_remision || '',
            guia_archivo_url: purchase.guia_archivo_url || '',
            placa_vehiculo: purchase.placa_vehiculo || '',
            fecha_recepcion: purchase.fecha || new Date().toISOString(),
            items: purchase.Detalle_Compra.map((d: any) => ({
                material_id: d.material_id,
                nombre_material: d.Inventario_Global?.nombre || '',
                cantidad: d.cantidad_comprada,
                cantidad_recibida: d.cantidad_recibida || d.cantidad_comprada,
                precio: d.precio_unitario,
                conformidad_calidad: d.conformidad_calidad || 'CONFORME',
                observaciones: d.observaciones || ''
            }))
        });
        setMode('EDIT');
        setCreateMethod('MANUAL');
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-stone-950">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
            </div>
        );
    }


    return (
        <div className="p-4 md:p-6 space-y-6 md:space-y-10 max-w-5xl mx-auto pb-32">
            {/* Hidden Input for Global IA Trigger */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleIAFileUpload}
                accept="image/*,application/pdf"
            />

            <header className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <p className="text-primary font-black text-[9px] uppercase tracking-[0.3em] mb-1">Procurement & Inventory Analytics</p>
                        <h1 className="text-4xl font-black text-white tracking-tighter uppercase leading-none">
                            {mode === 'CREATE' && createMethod === 'MANUAL' ? 'Ingreso Manual de Inventario' : 'Ingreso de Mercancía'}
                        </h1>
                        <p className="text-stone-500 text-[10px] font-bold uppercase tracking-widest leading-none mt-2">Captura Inteligente y Registro de Abastecimiento</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {mode !== 'HISTORY' && (
                            <button
                                onClick={() => { setMode('HISTORY'); setEditingId(null); }}
                                className="h-10 px-4 rounded-xl bg-white/5 border border-white/10 text-stone-400 hover:text-white transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
                            >
                                <span className="material-symbols-outlined text-sm">arrow_back</span>
                                Volver al Historial
                            </button>
                        )}
                        <button
                            onClick={() => onNavigate('INVENTORY_DASHBOARD')}
                            className="w-10 h-10 flex items-center justify-center rounded-2xl bg-white/5 text-stone-500 hover:text-white transition-all border border-white/5"
                        >
                            <span className="material-symbols-outlined text-xl">close</span>
                        </button>
                    </div>
                </div>

                {mode === 'HISTORY' && (
                    <div className="space-y-4">
                        {/* Main Entry Buttons (Stacked Vertical) */}
                        <div className="flex flex-col gap-4 max-w-xl mx-auto">
                            <button
                                onClick={() => {
                                    setMode('CREATE');
                                    setCreateMethod('MANUAL');
                                    setEditingId(null);
                                    setManualForm({
                                        providerId: '',
                                        providerName: '',
                                        providerRif: '',
                                        invoiceNumber: '',
                                        orden_compra: '',
                                        guia_remision: '',
                                        guia_archivo_url: '',
                                        placa_vehiculo: '',
                                        fecha_recepcion: new Date().toISOString(),
                                        totalNeto: 0,
                                        archivo_pdf_url: '',
                                        items: [{ material_id: '', nombre_material: '', cantidad: 0, cantidad_recibida: 0, precio: 0, conformidad_calidad: 'CONFORME' }]
                                    });
                                }}
                                className="group relative h-14 rounded-2xl border transition-all flex items-center px-6 overflow-hidden bg-white/[0.03] border-white/5 hover:border-blue-500/40 hover:bg-blue-500/[0.02]"
                            >
                                <div className="flex items-center gap-4 z-10 text-left">
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-all bg-white/5 text-blue-500 group-hover:scale-110">
                                        <span className="material-symbols-outlined text-xl font-black">edit_note</span>
                                    </div>
                                    <div className="leading-none">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white leading-tight">Ingresar</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 leading-tight">Mercancía</p>
                                    </div>
                                </div>
                                <div className="absolute -top-4 -right-4 p-4 opacity-5 group-hover:opacity-10 transition-all duration-500 group-hover:scale-125">
                                    <span className="material-symbols-outlined text-6xl">assignment</span>
                                </div>
                            </button>

                            <button
                                onClick={() => {
                                    setMode('CREATE');
                                    setCreateMethod('IA');
                                    setEditingId(null);
                                    fileInputRef.current?.click();
                                }}
                                className={`group relative h-44 rounded-[2.5rem] border transition-all flex items-center px-10 overflow-hidden bg-primary/[0.03] border-primary/10 hover:border-primary/50 hover:bg-primary/[0.05]`}
                            >
                                <div className="flex items-center gap-8 z-10">
                                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 bg-primary/10 text-primary group-hover:scale-110 group-hover:bg-primary group-hover:text-black`}>
                                        <span className="material-symbols-outlined text-5xl font-black">photo_camera</span>
                                    </div>
                                    <div className="text-left">
                                        <h3 className={`text-2xl font-black uppercase tracking-tighter leading-none mb-1 text-stone-200 group-hover:text-primary transition-colors`}>Escaneo de Facturas & Análisis IA</h3>
                                        <p className="text-[10px] font-black text-stone-500 uppercase tracking-[0.2em] opacity-80 group-hover:opacity-100 transition-opacity">Procesamiento Inteligente de Documentos</p>
                                    </div>
                                </div>
                                <div className="absolute -top-10 -right-10 p-4 opacity-5 group-hover:opacity-10 transition-all duration-700 group-hover:scale-150 rotate-12">
                                    <span className="material-symbols-outlined text-[180px]">psychology</span>
                                </div>
                            </button>
                        </div>
                    </div>
                )}
            </header>

            {mode === 'HISTORY' && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="material-symbols-outlined text-blue-500">
                                {historyViewMode === 'INVOICES' ? 'receipt_long' : 'list_alt'}
                            </span>
                            <h3 className="text-sm font-black text-stone-400 uppercase tracking-widest">
                                {historyViewMode === 'INVOICES' ? 'Facturas Recientes' : 'Productos Cargados'}
                            </h3>
                        </div>

                        {/* Toggle Button */}
                        <div className="flex bg-stone-900 rounded-lg p-1 border border-white/5">
                            <button
                                onClick={() => setHistoryViewMode('INVOICES')}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${historyViewMode === 'INVOICES'
                                    ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                    : 'text-stone-500 hover:text-white'
                                    }`}
                            >
                                Facturas
                            </button>
                            <button
                                onClick={() => setHistoryViewMode('ITEMS')}
                                className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${historyViewMode === 'ITEMS'
                                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                    : 'text-stone-500 hover:text-white'
                                    }`}
                            >
                                Productos
                            </button>
                        </div>
                    </div>

                    {historyViewMode === 'INVOICES' ? (
                        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
                            {/* ... Invoice Table (unchanged) ... */}
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/5">
                                        <th className="p-4 text-[10px] font-black text-stone-500 uppercase tracking-widest text-center">Fecha</th>
                                        <th className="p-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">N° Factura</th>
                                        <th className="p-4 text-[10px] font-black text-stone-500 uppercase tracking-widest">Proveedor</th>
                                        <th className="p-4 text-[10px] font-black text-stone-500 uppercase tracking-widest text-center">Ítems</th>
                                        <th className="p-4 text-[10px] font-black text-stone-500 uppercase tracking-widest text-right">Total Neto</th>
                                        <th className="p-4 text-[10px] font-black text-stone-500 uppercase tracking-widest text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {purchases.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-stone-500 text-xs uppercase tracking-widest">
                                                No hay facturas registradas
                                            </td>
                                        </tr>
                                    ) : (
                                        purchases.map(purchase => (
                                            <tr key={purchase.id} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4 text-center">
                                                    <span className="font-mono text-xs text-stone-400 bg-white/5 px-2 py-1 rounded-lg">
                                                        {new Date(purchase.fecha).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="font-mono text-xs font-bold text-white">{purchase.numero_factura}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-bold text-stone-200">{purchase.Proveedores?.nombre || 'Proveedor Desconocido'}</span>
                                                        <span className="text-[9px] text-stone-500 font-mono">{purchase.Proveedores?.rif}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-xs font-bold text-stone-400 bg-white/5 px-2 py-1 rounded-full">
                                                        {purchase.Detalle_Compra?.length || 0}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="text-sm font-black text-emerald-400 font-mono">
                                                        $ {purchase.total_neto.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {purchase.archivo_pdf_url && (
                                                            <a
                                                                href={purchase.archivo_pdf_url}
                                                                target="_blank"
                                                                rel="noreferrer"
                                                                title="Ver Documento"
                                                                className="w-8 h-8 flex items-center justify-center rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white transition-all"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                                            </a>
                                                        )}
                                                        <button
                                                            onClick={() => handleEdit(purchase)}
                                                            title="Editar Factura"
                                                            className="w-8 h-8 flex items-center justify-center rounded-lg bg-stone-800 text-stone-400 hover:bg-stone-700 hover:text-white transition-all"
                                                        >
                                                            <span className="material-symbols-outlined text-sm">edit</span>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-white/5 border-b border-white/5">
                                        <th className="p-4 text-[9px] font-black text-stone-500 uppercase tracking-widest whitespace-nowrap">Fecha</th>
                                        <th className="p-4 text-[9px] font-black text-stone-500 uppercase tracking-widest">Descripción del Ítem</th>
                                        <th className="p-4 text-[9px] font-black text-stone-500 uppercase tracking-widest text-center">Cant.</th>
                                        <th className="p-4 text-[9px] font-black text-stone-500 uppercase tracking-widest text-right">Precio</th>
                                        <th className="p-4 text-[9px] font-black text-stone-500 uppercase tracking-widest text-right">Subtotal</th>
                                        <th className="p-4 text-[9px] font-black text-stone-500 uppercase tracking-widest text-center">Factura</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {purchases.flatMap(p =>
                                        (p.Detalle_Compra || []).map(item => ({
                                            ...item,
                                            fecha: p.fecha,
                                            factura: p.numero_factura,
                                            pdf: p.archivo_pdf_url
                                        }))
                                    ).sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                                        .map((item, idx) => (
                                            <tr key={`${item.id}-${idx}`} className="group hover:bg-white/[0.02] transition-colors">
                                                <td className="p-4 whitespace-nowrap">
                                                    <span className="font-mono text-[10px] font-bold text-stone-400 bg-white/5 px-2 py-1 rounded">
                                                        {new Date(item.fecha).toLocaleDateString()}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-[11px] font-bold text-stone-200 leading-tight block">
                                                        {item.Inventario_Global?.nombre || 'Ítem sin nombre'}
                                                    </span>
                                                    <span className="text-[8px] font-black text-stone-500 uppercase tracking-wider">
                                                        {item.Inventario_Global?.unidad_medida || 'UNID'}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="text-[10px] font-bold text-white bg-white/5 px-2 py-1 rounded-full">
                                                        {item.cantidad_comprada}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-mono text-[10px] font-bold text-stone-400">
                                                        $ {item.precio_unitario?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-right">
                                                    <span className="font-mono text-[11px] font-black text-emerald-400">
                                                        $ {(item.cantidad_comprada * item.precio_unitario).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                    </span>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <div className="flex flex-col items-center">
                                                        <span className="text-[9px] font-bold text-stone-500">{item.factura}</span>
                                                        {item.pdf && (
                                                            <a href={item.pdf} target="_blank" rel="noreferrer" className="text-blue-500 hover:text-blue-400">
                                                                <span className="material-symbols-outlined text-sm">visibility</span>
                                                            </a>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    {purchases.flatMap(p => p.Detalle_Compra || []).length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-stone-500 text-xs uppercase tracking-widest">
                                                No hay productos cargados
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )
            }

            {
                mode === 'CREATE' && (
                    <div className="space-y-8">
                        {createMethod === 'IA' ? (
                            <div className="max-w-xl mx-auto space-y-4">
                                {/* AI SCANNER BUTTON - REPLACED PLACEHOLDER */}
                                <div className="bg-gradient-to-r from-blue-500/10 to-indigo-500/10 border border-blue-500/20 rounded-2xl p-8 flex flex-col items-center justify-center gap-6 relative overflow-hidden group text-center">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                        <span className="material-symbols-outlined text-9xl">document_scanner</span>
                                    </div>

                                    <div className="z-10 w-full flex flex-col items-center">
                                        <div className="w-20 h-20 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0 mb-4 animate-bounce-slow">
                                            <span className="material-symbols-outlined text-blue-400 text-4xl">center_focus_weak</span>
                                        </div>
                                        <div>
                                            <h4 className="text-blue-400 font-black uppercase tracking-widest text-lg mb-2">Fotografiar Factura</h4>
                                            <p className="text-stone-400 text-xs leading-tight max-w-sm mx-auto mb-6">El sistema procesará la imagen para extraer automáticamente: Vendedor, RIF, Ítems, Precios y Totales.</p>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => document.getElementById('ai-invoice-scanner-main')?.click()}
                                            className="px-8 py-4 rounded-xl bg-blue-500 hover:bg-blue-400 text-white text-xs font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20 flex items-center gap-3 z-10 scale-100 hover:scale-105"
                                        >
                                            <span className="material-symbols-outlined text-xl">camera_alt</span>
                                            Escanear y Extraer Datos
                                        </button>
                                        <input
                                            id="ai-invoice-scanner-main"
                                            type="file"
                                            accept="image/*,application/pdf"
                                            className="hidden"
                                            onChange={(e) => {
                                                if (e.target.files?.[0]) {
                                                    // Placeholder for AI Extraction Integration
                                                    setIsProcessing(true);
                                                    setTimeout(() => {
                                                        setIsProcessing(false);
                                                        alert("Análisis Completado (Simulación).\nDatos extraídos con éxito.");
                                                    }, 2000);
                                                }
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-xl mx-auto pb-48 animate-in fade-in duration-500 min-h-screen">
                                {/* Header: Back & Title */}
                                <div className="flex items-center justify-between mb-8 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setMode('HISTORY')}
                                        className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-stone-400">arrow_back_ios_new</span>
                                    </button>
                                    <h2 className="text-lg font-black text-white uppercase tracking-widest">Registro de Factura</h2>
                                    <button type="button" className="w-10 h-10 rounded-full hover:bg-white/5 flex items-center justify-center transition-colors">
                                        <span className="material-symbols-outlined text-stone-400">more_horiz</span>
                                    </button>
                                </div>


                                {/* SECTION: DATOS DEL DOCUMENTO */}
                                <div className="mb-8 space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-blue-500 text-lg">description</span>
                                        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">Datos del Documento</h3>
                                    </div>

                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-1">Número de Factura</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-3.5 text-stone-500 font-bold group-focus-within:text-blue-500 transition-colors">#</span>
                                                <input
                                                    type="text"
                                                    placeholder="F-000123"
                                                    value={manualForm.invoiceNumber}
                                                    onChange={e => setManualForm({ ...manualForm, invoiceNumber: e.target.value.toUpperCase() })}
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-10 pr-4 text-white font-bold uppercase placeholder:text-stone-600 focus:outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all font-mono"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-1">Fecha de Emisión</label>
                                            <div className="relative group">
                                                <span className="absolute left-4 top-3.5 material-symbols-outlined text-lg text-stone-500 group-focus-within:text-blue-500 transition-colors">calendar_today</span>
                                                <input
                                                    type="date"
                                                    value={manualForm.invoiceDate ? manualForm.invoiceDate.split('T')[0] : ''}
                                                    onChange={e => setManualForm({ ...manualForm, invoiceDate: e.target.value })}
                                                    className="w-full bg-white/5 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold uppercase placeholder:text-stone-600 focus:outline-none focus:bg-white/10 focus:border-blue-500/50 transition-all font-mono"
                                                />
                                            </div>
                                        </div>

                                        {/* Link de Foto (Optional wrapper) */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider ml-1">Comprobante Digital</label>
                                            <label className={`cursor-pointer w-full border border-dashed rounded-2xl py-3 px-4 flex items-center justify-center gap-3 transition-all ${manualForm.archivo_pdf_url ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}>
                                                <span className={`material-symbols-outlined ${manualForm.archivo_pdf_url ? 'text-emerald-500' : 'text-stone-500'}`}>
                                                    {manualForm.archivo_pdf_url ? 'check_circle' : 'photo_camera'}
                                                </span>
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${manualForm.archivo_pdf_url ? 'text-emerald-400' : 'text-stone-500'}`}>
                                                    {manualForm.archivo_pdf_url ? 'Archivo Cargado' : 'Subir Foto'}
                                                </span>
                                                <input type="file" className="hidden" onChange={async (e) => { const url = await handleFileUpload(e); if (url) setManualForm(p => ({ ...p, archivo_pdf_url: url })); }} accept="image/*,application/pdf" />
                                            </label>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: DATOS DEL VENDEDOR */}
                                <div className="mb-10 animate-in slide-in-from-bottom-4 duration-500 delay-100">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className="material-symbols-outlined text-blue-500 text-lg">storefront</span>
                                        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">Datos del Vendedor</h3>
                                    </div>

                                    <div className="bg-stone-900/80 rounded-3xl p-6 border border-white/5 space-y-5 shadow-xl">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">Nombre / Razón Social</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-3.5 w-6 h-6 rounded bg-stone-800 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-sm text-stone-400">person</span>
                                                </div>
                                                <input
                                                    list="providers-list"
                                                    type="text"
                                                    placeholder="Distribuidora Global C.A."
                                                    value={manualForm.providerName}
                                                    onChange={e => {
                                                        const name = e.target.value.toUpperCase();
                                                        const matchedProv = providers.find(p => p.nombre.toUpperCase() === name);
                                                        setManualForm({
                                                            ...manualForm,
                                                            providerName: name,
                                                            providerRif: matchedProv ? matchedProv.rif : manualForm.providerRif,
                                                            providerId: matchedProv ? matchedProv.id : ''
                                                        });
                                                    }}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold uppercase placeholder:text-stone-700 focus:outline-none focus:border-blue-500/50 transition-all"
                                                />
                                                <datalist id="providers-list">
                                                    {providers.map(p => <option key={p.id} value={p.nombre}>{p.rif}</option>)}
                                                </datalist>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider ml-1">RIF del Vendedor</label>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-3.5 w-6 h-6 rounded bg-stone-800 flex items-center justify-center">
                                                    <span className="material-symbols-outlined text-sm text-stone-400">badge</span>
                                                </div>
                                                <input
                                                    type="text"
                                                    placeholder="J-12345678-9"
                                                    value={manualForm.providerRif}
                                                    onChange={e => setManualForm({ ...manualForm, providerRif: e.target.value.toUpperCase() })}
                                                    className="w-full bg-black/40 border border-white/5 rounded-2xl py-3.5 pl-12 pr-4 text-white font-bold uppercase placeholder:text-stone-700 focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* SECTION: SELECCIÓN DE MATERIALES */}
                                <div className="mb-10 animate-in slide-in-from-bottom-4 duration-500 delay-150">
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="material-symbols-outlined text-blue-500 text-lg">category</span>
                                        <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">Catálogo de Materiales</h3>
                                    </div>

                                    {/* Categories Grid */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                                        {[
                                            { id: 'MATERIALES', label: 'Materiales', icon: 'Construction', color: 'blue' },
                                            { id: 'MAQUINARIA', label: 'Maquinaria', icon: 'engineering', color: 'amber' },
                                            { id: 'COMBUSTIBLES', label: 'Combustible', icon: 'ev_station', color: 'rose' },
                                            { id: 'EPP', label: 'EPP', icon: 'safety_check', color: 'emerald' }
                                        ].map(cat => (
                                            <button
                                                type="button"
                                                key={cat.id}
                                                onClick={() => {
                                                    setSelectedCategory(cat.id);
                                                    setSelectedSubCategory(null);
                                                    setTempSelectedItem(null);
                                                    setTempItemName('');
                                                    setShowOthersInput(false);
                                                }}
                                                className={`
                                                relative overflow-hidden group flex flex-col items-center justify-center gap-2 py-4 rounded-2xl border transition-all duration-300
                                                ${selectedCategory === cat.id
                                                        ? (cat.color === 'blue' ? 'bg-blue-500/10 border-blue-500 ring-1 ring-blue-500' :
                                                            cat.color === 'amber' ? 'bg-amber-500/10 border-amber-500 ring-1 ring-amber-500' :
                                                                cat.color === 'rose' ? 'bg-rose-500/10 border-rose-500 ring-1 ring-rose-500' :
                                                                    'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500')
                                                        : 'bg-stone-900/40 border-white/5 hover:bg-white/5 hover:border-white/20'
                                                    }
                                            `}
                                            >
                                                <div className={`
                                                w-8 h-8 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 duration-300
                                                ${cat.color === 'blue' ? 'text-blue-500' : ''}
                                                ${cat.color === 'amber' ? 'text-amber-500' : ''}
                                                ${cat.color === 'rose' ? 'text-rose-500' : ''}
                                                ${cat.color === 'emerald' ? 'text-emerald-500' : ''}
                                            `}>
                                                    <span className="material-symbols-outlined text-xl">{cat.icon}</span>
                                                </div>
                                                <span className={`text-[9px] font-black uppercase tracking-wide text-center px-1 leading-tight transition-colors ${selectedCategory === cat.id ? 'text-white' : 'text-stone-400 group-hover:text-white'}`}>
                                                    {cat.label}
                                                </span>
                                            </button>
                                        ))}
                                    </div>

                                    {/* Manual Input / Search */}
                                    <div className="bg-stone-900/40 rounded-2xl p-2 border border-white/5 mb-4">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={tempItemName}
                                                onChange={(e) => {
                                                    setTempItemName(e.target.value.toUpperCase());
                                                    if (!showOthersInput) setShowOthersInput(true);
                                                }}
                                                placeholder="Buscar o escribir nombre del artículo..."
                                                className="flex-1 bg-transparent border-none px-4 py-3 text-white text-sm focus:ring-0 placeholder:text-stone-600 font-bold uppercase transition-all"
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        const val = tempItemName.trim();
                                                        if (val) {
                                                            const classification = {
                                                                category: selectedCategory || 'SIN_CATEGORIA',
                                                                subCategory: selectedSubCategory === 'OTRO' ? customSubCategory : selectedSubCategory,
                                                                type: selectedType === 'OTRO' ? customType : selectedType
                                                            };

                                                            setManualForm({
                                                                ...manualForm,
                                                                items: [...manualForm.items, {
                                                                    material_id: tempSelectedItem?.id || '',
                                                                    nombre_material: val,
                                                                    cantidad: 1,
                                                                    cantidad_recibida: 1,
                                                                    precio: tempSelectedItem?.valor_unitario_promedio || 0,
                                                                    conformidad_calidad: 'CONFORME',
                                                                    observaciones: '',
                                                                    classification: classification
                                                                } as any]
                                                            });
                                                            setTempItemName('');
                                                            setTempSelectedItem(null);
                                                            setCustomSubCategory('');
                                                            setCustomType('');
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                type="button"
                                                disabled={!tempItemName.trim()}
                                                onClick={() => {
                                                    const val = tempItemName.trim();
                                                    if (val) {
                                                        const classification = {
                                                            category: selectedCategory || 'SIN_CATEGORIA',
                                                            subCategory: selectedSubCategory === 'OTRO' ? customSubCategory : selectedSubCategory,
                                                            type: selectedType === 'OTRO' ? customType : selectedType
                                                        };

                                                        setManualForm({
                                                            ...manualForm,
                                                            items: [...manualForm.items, {
                                                                material_id: tempSelectedItem?.id || '',
                                                                nombre_material: val,
                                                                cantidad: 1,
                                                                cantidad_recibida: 1,
                                                                precio: tempSelectedItem?.valor_unitario_promedio || 0,
                                                                conformidad_calidad: 'CONFORME',
                                                                observaciones: '',
                                                                classification: classification
                                                            } as any]
                                                        });
                                                        setTempItemName('');
                                                        setTempSelectedItem(null);
                                                        setCustomSubCategory('');
                                                        setCustomType('');
                                                    }
                                                }}
                                                className="bg-primary text-black px-6 rounded-xl font-black uppercase tracking-widest hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 m-1"
                                            >
                                                <span className="material-symbols-outlined">add</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Inventory List (Conditional) */}
                                    {selectedCategory && (
                                        <div className="bg-stone-900/40 rounded-2xl p-4 border border-white/5 animate-in fade-in zoom-in-95 duration-300">
                                            {/* Subcategories */}
                                            <div className="mb-4 animate-in slide-in-from-top-2 fade-in duration-300 space-y-3">
                                                <div className="flex flex-wrap gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedSubCategory(null); setSelectedType(null); }}
                                                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all ${!selectedSubCategory ? 'bg-white text-black border-white' : 'bg-black/20 text-stone-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                                    >
                                                        Todo
                                                    </button>
                                                    {subCategories[selectedCategory]?.map((sub) => (
                                                        <button
                                                            key={sub.id}
                                                            type="button"
                                                            onClick={() => { setSelectedSubCategory(selectedSubCategory === sub.id ? null : sub.id); setSelectedType(null); }}
                                                            className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all text-center leading-tight ${selectedSubCategory === sub.id ? 'bg-white text-black border-white' : 'bg-black/20 text-stone-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                                        >
                                                            {sub.label}
                                                        </button>
                                                    ))}
                                                    {/* Botón OTRO para Subcategoría */}
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedSubCategory('OTRO'); setSelectedType(null); }}
                                                        className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase tracking-wide border transition-all text-center leading-tight ${selectedSubCategory === 'OTRO' ? 'bg-amber-500 text-black border-amber-500' : 'bg-black/20 text-stone-400 border-white/5 hover:bg-white/10 hover:text-white'}`}
                                                    >
                                                        + OTRO
                                                    </button>
                                                </div>

                                                {/* Input para Nueva Subcategoría */}
                                                {selectedSubCategory === 'OTRO' && (
                                                    <div className="animate-in slide-in-from-left-2 fade-in duration-300">
                                                        <input
                                                            type="text"
                                                            placeholder="Nombre de Nueva Subcategoría..."
                                                            value={customSubCategory}
                                                            onChange={(e) => setCustomSubCategory(e.target.value.toUpperCase())}
                                                            className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-xs text-white uppercase font-bold focus:border-amber-500 outline-none placeholder:text-amber-500/50"
                                                        />
                                                    </div>
                                                )}

                                                {/* Types */}
                                                {(selectedSubCategory && selectedSubCategory !== 'OTRO' && itemTypes[selectedSubCategory]) ? (
                                                    <div className="flex flex-wrap gap-2 pl-4 border-l-2 border-primary/20 animate-in slide-in-from-left-2 fade-in duration-300">
                                                        {itemTypes[selectedSubCategory].map((type) => (
                                                            <button
                                                                key={type.id}
                                                                type="button"
                                                                onClick={() => setSelectedType(selectedType === type.id ? null : type.id)}
                                                                className={`px-3 py-1.5 rounded-md text-[8px] font-bold uppercase tracking-wide border transition-all text-center ${selectedType === type.id ? 'bg-primary text-black border-primary' : 'bg-black/40 text-stone-500 border-white/5 hover:bg-primary/20 hover:text-primary'}`}
                                                            >
                                                                {type.label}
                                                            </button>
                                                        ))}
                                                        {/* Botón OTRO para Tipo */}
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedType('OTRO')}
                                                            className={`px-3 py-1.5 rounded-md text-[8px] font-bold uppercase tracking-wide border transition-all text-center ${selectedType === 'OTRO' ? 'bg-amber-500 text-black border-amber-500' : 'bg-black/40 text-stone-500 border-white/5 hover:bg-amber-500/20 hover:text-amber-500'}`}
                                                        >
                                                            + OTRO
                                                        </button>
                                                    </div>
                                                ) : null}

                                                {/* Input para Nuevo Tipo */}
                                                {selectedType === 'OTRO' && (
                                                    <div className="pl-4 border-l-2 border-amber-500/20 animate-in slide-in-from-left-2 fade-in duration-300 mt-2">
                                                        <input
                                                            type="text"
                                                            placeholder="Nombre de Nuevo Tipo/Clasificación..."
                                                            value={customType}
                                                            onChange={(e) => setCustomType(e.target.value.toUpperCase())}
                                                            className="w-full bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-2 text-xs text-white uppercase font-bold focus:border-amber-500 outline-none placeholder:text-amber-500/50"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Items Grid */}
                                            <div className="mt-2 animate-in fade-in duration-300">
                                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
                                                    {inventory
                                                        .filter(i => {
                                                            if (i.categoria !== selectedCategory) return false;
                                                            if (selectedSubCategory && selectedSubCategory !== 'OTRO' && i.subfamily_id !== selectedSubCategory && i.specs_data?.subcategoria !== selectedSubCategory) return false;
                                                            if (selectedType && selectedType !== 'OTRO' && i.specs_data?.tipo !== selectedType && !i.nombre.toUpperCase().includes(selectedType.replace(/_/g, ' '))) return false;
                                                            return true;
                                                        })
                                                        .map(item => (
                                                            <button
                                                                key={item.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    setManualForm({
                                                                        ...manualForm,
                                                                        items: [...manualForm.items, {
                                                                            material_id: item.id,
                                                                            nombre_material: item.nombre,
                                                                            cantidad: 1,
                                                                            cantidad_recibida: 1,
                                                                            precio: item.valor_unitario_promedio || 0,
                                                                            conformidad_calidad: 'CONFORME',
                                                                            observaciones: ''
                                                                        }]
                                                                    });
                                                                    setTempSelectedItem(null);
                                                                    setTempItemName('');
                                                                }}
                                                                className={`
                                                                flex flex-col items-start gap-2 p-3 rounded-xl border transition-all group text-left h-full relative
                                                                ${tempSelectedItem?.id === item.id ? 'bg-primary/20 border-primary ring-1 ring-primary' : 'bg-white/5 border-white/5 hover:bg-primary/10 hover:border-primary/50 hover:scale-[1.02]'}
                                                            `}
                                                            >
                                                                <div className={`absolute top-2 right-2 transition-opacity ${tempSelectedItem?.id === item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                                    <span className={`material-symbols-outlined text-sm ${tempSelectedItem?.id === item.id ? 'text-primary' : 'text-stone-400'}`}>
                                                                        {tempSelectedItem?.id === item.id ? 'check_circle' : 'radio_button_unchecked'}
                                                                    </span>
                                                                </div>
                                                                <div className="w-full aspect-square rounded-lg bg-black/20 overflow-hidden mb-1 flex items-center justify-center">
                                                                    {item.url_foto ? (
                                                                        <img src={item.url_foto} alt={item.nombre} className="w-full h-full object-cover" />
                                                                    ) : (
                                                                        <span className="material-symbols-outlined text-stone-600 text-2xl group-hover:text-primary/50 transition-colors">image</span>
                                                                    )}
                                                                </div>
                                                                <div>
                                                                    <p className={`text-[9px] font-black uppercase leading-tight line-clamp-2 transition-colors ${tempSelectedItem?.id === item.id ? 'text-primary' : 'text-stone-200 group-hover:text-primary'}`}>{item.nombre}</p>
                                                                    <p className="text-[7px] text-stone-500 font-bold uppercase mt-1">{item.unidad_medida}</p>
                                                                </div>
                                                            </button>
                                                        ))}

                                                    {/* Add New Item Button via Text Input context */}
                                                    {selectedSubCategory === 'OTRO' || selectedType === 'OTRO' ? (
                                                        <div className="col-span-full p-4 bg-amber-500/5 border border-dashed border-amber-500/30 rounded-xl flex flex-col items-center justify-center text-center">
                                                            <span className="material-symbols-outlined text-amber-500 mb-2">auto_awesome</span>
                                                            <p className="text-[10px] text-stone-400 font-bold uppercase">
                                                                Escribe el nombre del material arriba para agregarlo a esta nueva clasificación.
                                                                <br />
                                                                <span className="text-amber-500">Se guardará automáticamente en el inventario.</span>
                                                            </p>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* SECTION: DETALLE DE ITEMS */}
                                <div className="mb-8 animate-in slide-in-from-bottom-4 duration-500 delay-200">
                                    <div className="flex items-center justify-between mb-4 px-1">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-blue-500 text-lg">list_alt</span>
                                            <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest">Detalle de Ítems</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setManualForm({
                                                ...manualForm,
                                                items: [...manualForm.items, { material_id: '', nombre_material: '', cantidad: 0, cantidad_recibida: 0, precio: 0, conformidad_calidad: 'CONFORME', observaciones: '' }]
                                            })}
                                            className="text-[10px] font-black text-blue-500 hover:text-blue-400 uppercase tracking-widest flex items-center gap-1 transition-colors bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20"
                                        >
                                            <span className="material-symbols-outlined text-base">add_circle</span>
                                            Añadir Ítem
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="overflow-hidden rounded-2xl border border-white/5 bg-white/[0.02] shadow-xl">
                                            <table className="w-full text-left border-collapse">
                                                <thead>
                                                    <tr className="bg-white/5 border-b border-white/5">
                                                        <th className="p-2 text-[8px] font-black text-stone-500 uppercase tracking-widest w-1/2">Descripción</th>
                                                        <th className="p-2 text-[8px] font-black text-stone-500 uppercase tracking-widest text-center w-24">Cant.</th>
                                                        <th className="p-2 text-[8px] font-black text-stone-500 uppercase tracking-widest text-right w-32">Precio Unit.</th>
                                                        <th className="p-2 text-[8px] font-black text-stone-500 uppercase tracking-widest text-right w-32">Subtotal</th>
                                                        <th className="p-2 w-16"></th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5">
                                                    {manualForm.items.map((item, index) => (
                                                        <tr key={index} className="group hover:bg-white/[0.02] transition-colors">
                                                            <td className="p-1">
                                                                <input
                                                                    type="text"
                                                                    value={item.nombre_material}
                                                                    onChange={e => {
                                                                        const updated = [...manualForm.items];
                                                                        updated[index].nombre_material = e.target.value.toUpperCase();
                                                                        setManualForm({ ...manualForm, items: updated });
                                                                    }}
                                                                    placeholder="DESCRIPCIÓN DEL MATERIAL..."
                                                                    className="w-full bg-transparent border-none p-1 text-stone-100 font-bold uppercase placeholder:text-stone-700 focus:ring-0 text-[9px]"
                                                                />
                                                            </td>
                                                            <td className="p-1">
                                                                <input
                                                                    type="number"
                                                                    value={item.cantidad || ''}
                                                                    onChange={e => {
                                                                        const val = Number(e.target.value);
                                                                        const updated = [...manualForm.items];
                                                                        updated[index].cantidad = val;
                                                                        updated[index].cantidad_recibida = val;
                                                                        setManualForm({ ...manualForm, items: updated });
                                                                    }}
                                                                    className="w-full bg-white/5 rounded-lg border-none text-center h-6 text-white font-bold focus:ring-1 focus:ring-blue-500 text-[9px] appearance-none pr-4"
                                                                    placeholder="0"
                                                                />
                                                            </td>
                                                            <td className="p-1">
                                                                <input
                                                                    type="number"
                                                                    value={item.precio || ''}
                                                                    onChange={e => {
                                                                        const val = Number(e.target.value);
                                                                        const updated = [...manualForm.items];
                                                                        updated[index].precio = val;
                                                                        setManualForm({ ...manualForm, items: updated });
                                                                    }}
                                                                    className="w-full bg-white/5 rounded-lg border-none text-right h-6 text-white font-bold focus:ring-1 focus:ring-blue-500 text-[9px]"
                                                                    placeholder="0.00"
                                                                />
                                                            </td>
                                                            <td className="p-1 text-right">
                                                                <span className="font-mono text-[9px] font-bold text-emerald-400">
                                                                    $ {(item.cantidad * item.precio).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                                </span>
                                                            </td>
                                                            <td className="p-1 text-center">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const updated = manualForm.items.filter((_, i) => i !== index);
                                                                        setManualForm({ ...manualForm, items: updated });
                                                                    }}
                                                                    className="w-6 h-6 rounded-lg hover:bg-red-500/10 text-stone-600 hover:text-red-500 flex items-center justify-center transition-all"
                                                                >
                                                                    <span className="material-symbols-outlined text-sm">delete</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {/* Add Row Button Row */}
                                                    <tr>
                                                        <td colSpan={5} className="p-2">
                                                            <button
                                                                type="button"
                                                                onClick={() => setManualForm({
                                                                    ...manualForm,
                                                                    items: [...manualForm.items, { material_id: '', nombre_material: '', cantidad: 0, cantidad_recibida: 0, precio: 0, conformidad_calidad: 'CONFORME', observaciones: '' }]
                                                                })}
                                                                className="w-full h-10 border border-dashed border-white/10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase tracking-widest text-stone-500 hover:text-blue-500 hover:border-blue-500/30 hover:bg-blue-500/5 transition-all gap-2"
                                                            >
                                                                <span className="material-symbols-outlined text-sm">add</span>
                                                                Agregar Fila
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Sticky Footer for Totals and Save */}
                                <div className="mt-8 pt-6 pb-6 w-full bg-gradient-to-t from-black via-black/90 to-transparent">
                                    <div className="bg-[#0a0a0a] border border-white/10 rounded-[2rem] shadow-2xl p-6 md:p-8 max-w-xl mx-auto animate-in slide-in-from-bottom duration-500 relative overflow-hidden">
                                        <div className="absolute inset-0 bg-blue-500/5 blur-3xl pointer-events-none"></div>
                                        <div className="relative z-10 space-y-4">
                                            <div className="flex justify-between items-center text-stone-400">
                                                <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                                                <span className="font-mono text-sm font-bold">$ {manualForm.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-stone-400">
                                                <span className="text-[10px] font-black uppercase tracking-widest">IVA (16%)</span>
                                                <span className="font-mono text-sm font-bold">$ {(manualForm.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0) * 0.16).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-white pt-2 border-t border-white/5 mb-4">
                                                <span className="text-sm font-black uppercase tracking-tighter">Total Factura</span>
                                                <span className="font-black text-2xl text-blue-500">$ {(manualForm.items.reduce((acc, item) => acc + (item.cantidad * item.precio), 0) * 1.16).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleManualSubmit}
                                                className="w-full bg-blue-600 hover:bg-blue-500 text-white h-14 rounded-xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-3 shadow-lg shadow-blue-600/20 transition-all hover:scale-[1.02]"
                                            >
                                                <span className="material-symbols-outlined">save</span>
                                                Guardar Factura
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        )}
                    </div >
                )
            }


            {
                mode === 'REVIEW_AI' && aiAnalysis && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                        {/* Stepper Header */}
                        <div className="flex items-center justify-between glass-card p-6 rounded-[2rem] border border-white/5 mx-auto max-w-4xl">
                            <div className="flex items-center gap-6">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${aiStep === 1 ? 'bg-primary text-black scale-110 shadow-lg shadow-primary/20' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                    {aiStep > 1 ? <span className="material-symbols-outlined text-sm">check</span> : '1'}
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black uppercase text-stone-500 tracking-widest leading-none mb-1">Paso 1</h3>
                                    <p className="text-white font-bold text-xs">Mapeo de Materiales</p>
                                </div>
                            </div>
                            <div className="h-px bg-white/5 flex-1 mx-8" />
                            <div className="flex items-center gap-6">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black transition-all ${aiStep === 2 ? 'bg-primary text-black scale-110 shadow-lg shadow-primary/20' : 'bg-white/5 text-stone-600'}`}>
                                    2
                                </div>
                                <div>
                                    <h3 className="text-[10px] font-black uppercase text-stone-500 tracking-widest leading-none mb-1">Paso 2</h3>
                                    <p className={`font-bold text-xs ${aiStep === 2 ? 'text-white' : 'text-stone-600'}`}>Recepción Logística</p>
                                </div>
                            </div>
                        </div>

                        {aiStep === 1 ? (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <div className="glass-card rounded-[2rem] p-8 space-y-6 border border-white/5">
                                    <h3 className="text-xs font-black text-stone-500 uppercase tracking-widest mb-6 border-b border-white/5 pb-4 text-center">Documento Escaneado</h3>
                                    <div className="grid grid-cols-1 gap-6">
                                        <div className="bg-white/[0.02] p-6 rounded-3xl border border-white/5">
                                            <label className="text-[8px] font-black text-stone-600 uppercase mb-1 block">Proveedor</label>
                                            <p className="text-white font-bold text-lg leading-tight">{aiAnalysis.proveedor_nombre}</p>
                                            <p className="text-primary text-[10px] font-black">{aiAnalysis.proveedor_rif}</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                <label className="text-[8px] font-black text-stone-600 uppercase mb-1 block">Factura Nº</label>
                                                <p className="text-white font-bold">{aiAnalysis.numero_factura}</p>
                                            </div>
                                            <div className="bg-white/[0.02] p-4 rounded-2xl border border-white/5">
                                                <label className="text-[8px] font-black text-stone-600 uppercase mb-1 block">Total Total</label>
                                                <p className="text-white font-bold text-xl tracking-tighter">${aiAnalysis.total_neto?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                        <div className="aspect-video rounded-[2rem] overflow-hidden border border-white/10 relative p-1 bg-white/5">
                                            <img src={aiAnalysis.archivo_pdf_url} className="w-full h-full object-cover rounded-[1.8rem]" />
                                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                <a href={aiAnalysis.archivo_pdf_url} target="_blank" rel="noreferrer" className="text-black text-[10px] font-black uppercase flex items-center gap-2 bg-primary px-6 py-3 rounded-full shadow-2xl">
                                                    <span className="material-symbols-outlined text-sm">zoom_in</span> Ver Completa
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="glass-card rounded-[2rem] p-8 space-y-6 border border-white/5">
                                    <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                                        <div className="flex items-center gap-3">
                                            <span className="material-symbols-outlined text-primary">memory</span>
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">Asociación IA</h3>
                                        </div>
                                        <span className="text-[9px] text-stone-500 font-bold uppercase">{aiAnalysis.mappedItems.length} Ítems Detectados</span>
                                    </div>
                                    <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                        {aiAnalysis.mappedItems.map((item: any, idx: number) => (
                                            <div key={idx} className={`p-5 rounded-3xl border transition-all ${item.is_auto_mapped ? 'bg-primary/5 border-primary/20' : 'bg-white/[0.02] border-white/5'}`}>
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <p className="text-stone-500 text-[9px] font-black uppercase tracking-tighter mb-1">Detectado en Factura</p>
                                                        <p className="text-white text-[11px] font-bold tracking-tight pr-4">"{item.nombre}"</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-stone-500 text-[9px] font-black uppercase tracking-tighter mb-1">Cant.</p>
                                                        <p className="text-primary font-black">{item.cantidad}</p>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <input
                                                        list={`ai-material-list-${idx}`}
                                                        required
                                                        placeholder="Asociar con Material del Inventario..."
                                                        value={item.nombre_material}
                                                        onChange={e => {
                                                            const val = e.target.value.toUpperCase();
                                                            const matched = inventory.find(m => m.nombre.toUpperCase() === val);
                                                            const nm = [...aiAnalysis.mappedItems];
                                                            nm[idx] = {
                                                                ...nm[idx],
                                                                nombre_material: val,
                                                                material_id: matched ? matched.id : ''
                                                            };
                                                            setAiAnalysis({ ...aiAnalysis, mappedItems: nm });
                                                        }}
                                                        className={`w-full bg-stone-950/50 border-white/10 rounded-xl h-11 text-white text-[11px] px-10 uppercase transition-all ${!item.material_id ? 'border-amber-500/30' : 'focus:border-primary/50'}`}
                                                    />
                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-600 text-lg">category</span>
                                                    {!item.material_id && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500 animate-pulse text-[8px] font-black uppercase">Pendiente</span>}
                                                </div>
                                                <datalist id={`ai-material-list-${idx}`}>
                                                    {inventory.map(m => <option key={m.id} value={m.nombre} />)}
                                                </datalist>
                                            </div>
                                        ))}
                                    </div>
                                    <button
                                        onClick={handleConfirmAI}
                                        className="w-full bg-primary text-black h-14 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all mt-4 flex items-center justify-center gap-3"
                                    >
                                        Siguiente: Datos de Recepción
                                        <span className="material-symbols-outlined text-base">arrow_forward</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="max-w-6xl mx-auto space-y-8 pb-10">
                                <div className="glass-card rounded-[2.5rem] p-8 md:p-12 space-y-10 border border-white/5 bg-stone-900/40 animate-in slide-in-from-bottom duration-500">
                                    {/* Cabecera de Recepción */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-primary text-sm">local_shipping</span>
                                            </div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">A. Cabecera (Control de Recepción)</h3>
                                        </div>

                                        <div className="max-w-xl mx-auto space-y-6">
                                            {/* OC Buscador */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Orden de Compra (Buscador)</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        placeholder="S-10023..."
                                                        value={aiAnalysis.orden_compra}
                                                        onChange={async (e) => {
                                                            const oc = e.target.value.toUpperCase();
                                                            setAiAnalysis({ ...aiAnalysis, orden_compra: oc });
                                                            if (oc.length >= 4) {
                                                                const data = await dataService.getPurchaseOrderByNumber(oc);
                                                                if (data) {
                                                                    alert(`OC ${oc} vinculada. Sistema listo para validación.`);
                                                                }
                                                            }
                                                        }}
                                                        className="w-full bg-white/5 border-white/10 rounded-xl h-11 text-white text-[11px] px-10 uppercase transition-all focus:border-primary/50"
                                                    />
                                                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 text-lg">search</span>
                                                </div>
                                            </div>

                                            {/* Documento Digital (Soporte IA) */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Soporte Digital Escaneado (Factura)</label>
                                                <div className="w-full h-16 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center px-4 gap-4">
                                                    <span className="material-symbols-outlined text-blue-500">description</span>
                                                    <div className="flex-1">
                                                        <p className="text-[9px] font-black text-white uppercase tracking-widest">Documento IDIA_{aiAnalysis.numero_factura || 'REF'}</p>
                                                        <p className="text-[8px] text-stone-500 uppercase">Analizado por Motor IA</p>
                                                    </div>
                                                    <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                                                </div>
                                            </div>

                                            {/* Factura (Validación) */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Número de Factura / Boleta</label>
                                                <input
                                                    type="text"
                                                    placeholder="Nº Factura"
                                                    value={aiAnalysis.numero_factura}
                                                    onChange={e => setAiAnalysis({ ...aiAnalysis, numero_factura: e.target.value.toUpperCase() })}
                                                    className="w-full bg-blue-500/10 border-blue-500/20 rounded-xl h-11 text-blue-400 font-bold text-[11px] px-4 uppercase"
                                                />
                                            </div>

                                            {/* Guía de Remisión */}
                                            <div className="space-y-4 pt-4 border-t border-white/5">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Nº Guía de Remisión</label>
                                                    <input
                                                        type="text"
                                                        placeholder="Nº de Guía Físico"
                                                        value={aiAnalysis.guia_remision}
                                                        onChange={e => setAiAnalysis({ ...aiAnalysis, guia_remision: e.target.value.toUpperCase() })}
                                                        className="w-full bg-white/5 border-white/10 rounded-xl h-11 text-white text-[11px] px-4 uppercase transition-all focus:border-primary/50"
                                                    />
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Foto de la Guía de Remisión (Opcional)</label>
                                                    <label className="cursor-pointer bg-white/5 border border-dashed border-white/20 rounded-xl h-20 flex flex-col items-center justify-center hover:bg-white/10 transition-all group">
                                                        {aiAnalysis.guia_archivo_url ? (
                                                            <div className="flex items-center gap-3 text-emerald-500">
                                                                <span className="material-symbols-outlined text-2xl">check_circle</span>
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Guía Capturada ✅</span>
                                                            </div>
                                                        ) : (
                                                            <>
                                                                <span className="material-symbols-outlined text-stone-500 text-2xl mb-1 group-hover:scale-110 transition-transform">photo_camera</span>
                                                                <span className="text-stone-500 text-[9px] font-black uppercase tracking-widest">Tomar Foto de Guía</span>
                                                            </>
                                                        )}
                                                        <input type="file" className="hidden" onChange={async (e) => { const url = await handleFileUpload(e); if (url) setAiAnalysis(p => ({ ...p, guia_archivo_url: url })); }} accept="image/*,application/pdf" />
                                                    </label>
                                                </div>
                                            </div>

                                            {/* Placa Vehículo */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Placa del Vehículo (Opcional)</label>
                                                <input
                                                    type="text"
                                                    placeholder="ABC-123"
                                                    value={aiAnalysis.placa_vehiculo}
                                                    onChange={e => setAiAnalysis({ ...aiAnalysis, placa_vehiculo: e.target.value.toUpperCase() })}
                                                    className="w-full bg-white/5 border-white/10 rounded-xl h-11 text-white text-[11px] px-4 uppercase transition-all focus:border-primary/50"
                                                />
                                            </div>

                                            {/* Fecha/Hora */}
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-stone-500 uppercase tracking-widest">Fecha y Hora de Recepción</label>
                                                <div className="w-full bg-white/[0.02] border border-white/5 rounded-xl h-11 flex items-center px-4 text-stone-400 text-[10px] font-mono leading-none">
                                                    {new Date(aiAnalysis.fecha_recepcion).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Detalle de Validación lograda por IA */}
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                                            <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                                                <span className="material-symbols-outlined text-blue-500 text-sm">inventory</span>
                                            </div>
                                            <h3 className="text-xs font-black text-white uppercase tracking-widest">B. Detalle (Validación de Ítems)</h3>
                                        </div>

                                        <div className="space-y-4 max-w-2xl mx-auto">
                                            {aiAnalysis.mappedItems.map((item: any, idx: number) => (
                                                <div key={idx} className="bg-white/[0.03] rounded-[2rem] p-6 border border-white/10 space-y-5 animate-in slide-in-from-bottom duration-300">
                                                    {/* 1. Descripción del Material */}
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="space-y-1">
                                                            <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest px-1">Material Detectado e Identificado</label>
                                                            <p className="text-[12px] font-black text-white uppercase leading-tight px-1">{item.nombre_material || 'Sin Material'}</p>
                                                            <p className="text-[9px] text-primary font-black uppercase tracking-widest px-1 mt-1">Costo Unit: ${item.precio_unitario || 0}</p>
                                                        </div>
                                                    </div>

                                                    {/* 2. Cantidades (Grid Interno) */}
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="space-y-2 text-center">
                                                            <label className="text-[8px] font-black text-stone-600 uppercase tracking-widest">Cant. Facturada</label>
                                                            <div className="h-12 flex items-center justify-center bg-white/5 border border-white/10 rounded-xl text-white font-black text-sm">
                                                                {item.cantidad}
                                                            </div>
                                                        </div>
                                                        <div className="space-y-2 text-center">
                                                            <label className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Cant. Recibida</label>
                                                            <input
                                                                type="number"
                                                                value={item.cantidad_recibida ?? item.cantidad}
                                                                onChange={e => {
                                                                    const nm = [...aiAnalysis.mappedItems];
                                                                    nm[idx].cantidad_recibida = parseFloat(e.target.value);
                                                                    setAiAnalysis({ ...aiAnalysis, mappedItems: nm });
                                                                }}
                                                                className="w-full bg-blue-500/10 border-blue-500/20 rounded-xl h-12 text-blue-400 font-black text-center text-sm focus:border-blue-500"
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* 3. Estado de Calidad */}
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-stone-500 uppercase tracking-widest px-1">Estado de Calidad</label>
                                                        <select
                                                            value={item.conformidad_calidad || 'CONFORME'}
                                                            onChange={e => {
                                                                const nm = [...aiAnalysis.mappedItems];
                                                                nm[idx].conformidad_calidad = e.target.value;
                                                                setAiAnalysis({ ...aiAnalysis, mappedItems: nm });
                                                            }}
                                                            className={`w-full h-12 rounded-2xl text-[10px] font-black uppercase px-4 border-white/10 transition-all ${item.conformidad_calidad === 'CONFORME' || !item.conformidad_calidad ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : item.conformidad_calidad === 'RECHAZADO' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}
                                                        >
                                                            <option value="CONFORME">CONFORME ✅</option>
                                                            <option value="OBSERVADO">OBSERVADO ⚠️</option>
                                                            <option value="RECHAZADO">RECHAZADO ❌</option>
                                                        </select>
                                                    </div>

                                                    {item.conformidad_calidad !== 'CONFORME' && (
                                                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                                            <label className="text-[9px] font-black text-amber-500 uppercase tracking-widest px-1">Detalles de la Observación / Rechazo</label>
                                                            <textarea
                                                                required
                                                                placeholder="Describe el motivo o detalle de la observación..."
                                                                value={item.observaciones}
                                                                onChange={e => {
                                                                    const nm = [...aiAnalysis.mappedItems];
                                                                    nm[idx].observaciones = e.target.value;
                                                                    setAiAnalysis({ ...aiAnalysis, mappedItems: nm });
                                                                }}
                                                                className="w-full bg-amber-500/5 border-amber-500/20 rounded-xl p-4 text-white text-[11px] min-h-[80px] focus:border-amber-500/50 outline-none"
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/5">
                                        <div className="text-center md:text-left">
                                            <p className="text-stone-500 text-[9px] font-black uppercase tracking-widest mb-1 leading-none">Total Recepción Validada ($)</p>
                                            <h2 className="text-white font-black text-2xl tracking-tighter leading-none">
                                                ${aiAnalysis.mappedItems.reduce((a: any, b: any) => a + ((b.cantidad_recibida ?? b.cantidad) * (b.precio_unitario || 0)), 0).toLocaleString()}
                                            </h2>
                                        </div>
                                        <div className="flex gap-3 w-full md:w-auto">
                                            <button onClick={() => setAiStep(1)} className="h-9 px-5 rounded-xl text-[9px] font-black uppercase tracking-widest text-stone-500 hover:text-white transition-all border border-white/5 bg-white/[0.02]">Atrás</button>
                                            <button
                                                onClick={handleConfirmAI}
                                                disabled={isProcessing}
                                                className="flex-1 md:flex-none bg-blue-600 text-white h-11 px-6 rounded-2xl text-[10px] font-black uppercase tracking-[0.1em] shadow-lg shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex flex-col items-center justify-center leading-none"
                                            >
                                                {isProcessing ? 'Procesando...' : (
                                                    <>
                                                        <span>INGRESAR</span>
                                                        <span className="text-[8px] opacity-80 mt-0.5">MERCANCÍA</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )
            }
        </div >
    )
}


export default PurchaseManagement;
