
import { supabase } from './supabase';
import { Company, Project, Worker, InventarioItem, MovimientoObra, Notificacion } from '../types';

export const dataService = {
    // Inventory
    // --- MAESTRO DE RECURSOS SAP (JERARQUÍA) ---
    async getFamilies() {
        const { data, error } = await supabase.from('resource_families').select('*').order('name');
        if (error) throw error;
        return data;
    },
    async getSubfamilies(familyId: string) {
        const { data, error } = await supabase.from('resource_subfamilies').select('*').eq('family_id', familyId).order('name');
        if (error) throw error;
        return data;
    },

    // AI SMART PROCUREMENT METHODS
    async getPurchaseProposals() {
        const { data, error } = await supabase
            .from('Propuestas_Compra')
            .select('*, Inventario_Global(*)')
            .order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },

    async createPurchaseProposal(proposal: any) {
        const { data, error } = await supabase
            .from('Propuestas_Compra')
            .insert(proposal)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async updateProposalStatus(id: string, status: 'PENDIENTE' | 'CONVERTIDO' | 'RECHAZADO') {
        const { error } = await supabase
            .from('Propuestas_Compra')
            .update({ estado: status, updated_at: new Date().toISOString() })
            .eq('id', id);
        if (error) throw error;
        return { success: true };
    },

    async createNotification(notif: { titulo: string; mensaje: string; modulo: string }) {
        const { data, error } = await supabase
            .from('notificaciones')
            .insert(notif)
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    // OUTBOUND & CONSUMPTION (SAP PS Style)
    async getProjectPhases(projectId: string) {
        const { data, error } = await supabase
            .from('project_phases')
            .select('*')
            .eq('project_id', projectId)
            .order('code');
        if (error) throw error;
        return data;
    },

    // --- BUDGET & COST CONTROL (THE BRIDGE) ---
    async getBudgetItems(projectId: string) {
        const { data, error } = await supabase
            .from('budget_items')
            .select('*')
            .eq('project_id', projectId)
            .order('code');
        if (error) throw error;
        return data;
    },

    /**
     * LÓGICA DE ALERTAS DE DESVIACIÓN (Variance Logic)
     * Verifica si el pedido supera el presupuesto antes de despachar
     */
    async checkBudgetLimits(requestId: string) {
        const { data: items, error } = await supabase
            .from('material_request_items')
            .select(`
                *,
                Inventario_Global(nombre, valor_unitario_promedio),
                budget_items(*)
            `)
            .eq('request_id', requestId);

        if (error) throw error;

        const alerts: string[] = [];

        for (const item of items) {
            if (!item.budget_item_id) continue;

            const budget = item.budget_items as any;
            const material = item.Inventario_Global as any;

            // 1. Obtener consumo acumulado real (SQL Function)
            const { data: stats } = await supabase.rpc('get_accumulated_consumption_by_budget_item', {
                p_budget_item_id: item.budget_item_id
            });

            const accumulatedQty = stats.accumulated_quantity || 0;
            const projectedQty = accumulatedQty + item.quantity_requested;

            // Alerta de Cantidad (Desperdicio) - 5% Tolerancia
            if (projectedQty > budget.budgeted_quantity * 1.05) {
                alerts.push(`⚠️ SOBRECOSTO POR CANTIDAD [${budget.code}]: Se está consumiendo más material del calculado. Presupuesto: ${budget.budgeted_quantity}, Proyectado: ${projectedQty.toFixed(2)} ${budget.unit_measure}`);
            }

            // Alerta de Precio (Compra Ineficiente)
            if (Number(material.valor_unitario_promedio) > Number(budget.budgeted_unit_price)) {
                alerts.push(`🚨 DESVIACIÓN DE PRECIO [${material.nombre}]: El material se compró más caro ($${Number(material.valor_unitario_promedio).toFixed(2)}) que en el presupuesto venta ($${Number(budget.budgeted_unit_price).toFixed(2)}).`);
            }
        }

        return alerts;
    },

    /**
     * REPORTE SÁBANA DE COSTOS (Job Cost Report)
     */
    async getJobCostReport(projectId: string) {
        const { data: budgetItems, error } = await supabase
            .from('budget_items')
            .select('*')
            .eq('project_id', projectId)
            .order('code');

        if (error) throw error;

        const report = await Promise.all(budgetItems.map(async (item) => {
            const { data: stats } = await supabase.rpc('get_accumulated_consumption_by_budget_item', {
                p_budget_item_id: item.id
            });

            const costoTeorico = item.budgeted_quantity * item.budgeted_unit_price;
            const costoReal = stats.accumulated_cost || 0;
            const diferencia = costoTeorico - costoReal;

            return {
                partida: `${item.code} ${item.name}`,
                costoTeorico,
                costoReal,
                diferencia,
                estado: diferencia < 0 ? 'SOBRECOSTO' : 'EFICIENTE'
            };
        }));

        return report;
    },

    async createMaterialRequest(request: any, items: any[]) {
        // 1. Crear Cabecera PECOSA
        const { data: head, error: headError } = await supabase
            .from('Material_Requests')
            .insert(request)
            .select()
            .single();
        if (headError) throw headError;

        // 2. Crear Detalle
        const detailItems = items.map(item => ({
            request_id: head.id,
            material_id: item.material_id,
            quantity_requested: item.cantidad,
            budget_item_id: item.budget_item_id // Nuevo: Vínculo a presupuesto
        }));

        const { error: detailError } = await supabase
            .from('Material_Request_Items')
            .insert(detailItems);
        if (detailError) throw detailError;

        return head;
    },

    async getMaterialRequests(projectId?: string) {
        let query = supabase
            .from('Material_Requests')
            .select(`
                *,
                projects(name),
                Project_Phases(name, code),
                workers(first_name, first_surname),
                Material_Request_Items(*, Inventario_Global(*))
            `)
            .order('created_at', { ascending: false });

        if (projectId) query = query.eq('project_id', projectId);

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async updateRequestStatus(requestId: string, status: string, signatureUrl?: string) {
        const { error } = await supabase
            .from('Material_Requests')
            .update({
                status,
                signature_url: signatureUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);
        if (error) throw error;
        return { success: true };
    },

    async dispatchMaterialRequest(requestId: string, items: any[], warehousemanId: string, signatureUrl: string) {
        // 1. Actualizar Cabecera
        const { error: headErr } = await supabase
            .from('Material_Requests')
            .update({
                status: 'DESPACHADA',
                warehouseman_id: warehousemanId,
                signature_url: signatureUrl,
                updated_at: new Date().toISOString()
            })
            .eq('id', requestId);

        if (headErr) throw headErr;

        // 2. Generar Documento de Material Oficial (Clase 201 - Salida para consumo)
        await this.createMaterialDocument({
            clase_movimiento: '201',
            referencia_externa: `PECOSA-${requestId.slice(0, 5)}`,
            observaciones: 'Despacho de almacén por solicitud electrónica',
            items: items.map(item => ({
                material_id: item.material_id,
                cantidad: -item.quantity_requested,
                importe_total: 0,
                budget_item_id: item.budget_item_id // Nuevo: Trazabilidad en Kardex
            }))
        });

        // 3. Actualizar Stock Real en Inventario_Global
        for (const item of items) {
            const { data: invItem } = await supabase
                .from('Inventario_Global')
                .select('stock_disponible')
                .eq('id', item.material_id)
                .single();

            if (invItem) {
                const newStock = invItem.stock_disponible - item.quantity_requested;
                await supabase
                    .from('Inventario_Global')
                    .update({ stock_disponible: newStock })
                    .eq('id', item.material_id);
            }
        }

        return { success: true };
    },

    // AUDIT & CLOSING (Feedback Loop)
    async submitAuditCount(materialId: string, countedQty: number) {
        const { data: item } = await supabase.from('Inventario_Global').select('stock_disponible').eq('id', materialId).single();
        const systemQty = item?.stock_disponible || 0;

        const status = countedQty === systemQty ? 'CONCILIADO' : 'CONFLICTO';

        const { data, error } = await supabase
            .from('Inventory_Audits')
            .insert({
                material_id: materialId,
                counted_qty: countedQty,
                system_qty_snapshot: systemQty,
                status
            })
            .select()
            .single();
        if (error) throw error;
        return data;
    },

    async processAdjustment(adj: { material_id: string; audit_id?: string; type: 'SHRINKAGE' | 'SURPLUS'; qty: number; reason: string }) {
        // 1. Registrar Ajuste
        const { data: adjustment, error: adjError } = await supabase
            .from('Inventory_Adjustments')
            .insert({
                material_id: adj.material_id,
                audit_id: adj.audit_id,
                adjustment_type: adj.type,
                quantity: adj.qty,
                reason: adj.reason,
                status: 'APROBADO'
            })
            .select()
            .single();
        if (adjError) throw adjError;

        // 2. Afectar Stock Real
        const factor = adj.type === 'SHRINKAGE' ? -1 : 1;
        const { data: invItem } = await supabase.from('Inventario_Global').select('stock_disponible').eq('id', adj.material_id).single();
        const newStock = (invItem?.stock_disponible || 0) + (adj.qty * factor);

        await supabase.from('Inventario_Global').update({ stock_disponible: newStock }).eq('id', adj.material_id);

        return adjustment;
    },

    async checkReplenishmentNeeds() {
        const { data: items } = await supabase
            .from('Inventario_Global')
            .select('*');

        const needs = items?.filter(i => i.stock_disponible <= i.punto_reorden) || [];

        for (const item of needs) {
            const qtyToOrder = (item.stock_maximo || item.punto_reorden * 2) - item.stock_disponible;
            await this.createNotification({
                titulo: '📦 SUGERENCIA REAPROVISIONAMIENTO',
                mensaje: `Stock crítico en ${item.nombre}. Sugerido pedir ${qtyToOrder} ${item.unidad_medida}.`,
                modulo: 'Compras'
            });
        }
        return needs.length;
    },

    async runMonthlyDepreciation() {
        const { data: machinery } = await supabase
            .from('Inventario_Global')
            .select('*')
            .eq('categoria', 'MAQUINARIA'); // Asumiendo campo categoria

        if (!machinery) return [];

        for (const asset of machinery) {
            if (asset.valor_libros_actual && asset.vida_util_meses > 0) {
                const depMonth = (asset.valor_unitario_promedio - (asset.valor_residual || 0)) / asset.vida_util_meses;
                const newBookValue = Math.max(0, asset.valor_libros_actual - depMonth);

                await supabase.from('Inventario_Global')
                    .update({
                        valor_libros_actual: newBookValue,
                        fecha_ultima_depreciacion: new Date().toISOString()
                    })
                    .eq('id', asset.id);
            }
        }
        return machinery;
    },
    // Inventory (Maestro de Materiales SAP)
    /* Updated to fetch latest purchase details for display in dashboard */
    async getInventory() {
        const { data, error } = await supabase
            .from('Inventario_Global')
            .select(`
                *,
                resource_subfamilies(*),
                Detalle_Compra (
                    created_at,
                    compra:Facturas_Compras (
                        numero_factura,
                        fecha
                    )
                )
            `)
            .order('nombre');

        if (error) throw error;

        // Process to extract the latest purchase info
        const enrichedData = data?.map((item: any) => {
            const purchases = item.Detalle_Compra || [];
            // Sort by date descending
            purchases.sort((a: any, b: any) => {
                const dateA = new Date(a.compra?.fecha || a.created_at || 0).getTime();
                const dateB = new Date(b.compra?.fecha || b.created_at || 0).getTime();
                return dateB - dateA;
            });

            const lastPurchase = purchases[0];

            return {
                ...item,
                last_purchase_date: lastPurchase?.compra?.fecha || null,
                last_invoice_number: lastPurchase?.compra?.numero_factura || 'N/A'
            };
        });

        return enrichedData as any[];
    },
    async createMaterial(material: Partial<InventarioItem>) {
        const { data, error } = await supabase.from('Inventario_Global').insert(material).select().single();
        if (error) throw error;
        return data as InventarioItem;
    },
    async updateInventoryItem(id: string, item: Partial<InventarioItem>) {
        const { data, error } = await supabase.from('Inventario_Global').update(item).eq('id', id).select().single();
        if (error) throw error;
        return data as InventarioItem;
    },
    async deleteInventoryItem(id: string) {
        const { error } = await supabase.from('Inventario_Global').delete().eq('id', id);
        if (error) throw error;
        return true;
    },

    // Movements
    async getMovements() {
        const { data, error } = await supabase
            .from('Movimientos_Obras')
            .select('*, Inventario_Global(*), projects(*)')
            .order('fecha_registro', { ascending: false });
        if (error) throw error;
        return data;
    },
    async createMovement(movement: Partial<MovimientoObra>) {
        const { data, error } = await supabase.from('Movimientos_Obras').insert(movement).select().single();
        if (error) throw error;
        return data as MovimientoObra;
    },
    async approveMovement(id: string) {
        const { error } = await supabase.rpc('aprobar_movimiento', { movimiento_uuid: id });
        if (error) throw error;
        return true;
    },

    // Procurement
    async getPurchases() {
        const { data, error } = await supabase
            .from('Facturas_Compras')
            .select('*, Proveedores(*), Detalle_Compra(*, Inventario_Global(*))')
            .order('fecha', { ascending: false });
        if (error) throw error;
        return data;
    },
    async updatePurchase(id: string, updates: { estado_pago?: 'PAGADA' | 'POR_PAGAR' | 'POR_REVISAR'; fecha_pago?: string | null }) {
        // Validate and sanitize input - only allow specific fields
        const allowedFields: Array<keyof typeof updates> = ['estado_pago', 'fecha_pago'];
        const sanitized: Partial<typeof updates> = {};

        for (const key of Object.keys(updates)) {
            if (allowedFields.includes(key as keyof typeof updates)) {
                (sanitized as any)[key] = (updates as any)[key];
            }
        }

        // Validate estado_pago values
        if (sanitized.estado_pago && !['PAGADA', 'POR_PAGAR', 'POR_REVISAR'].includes(sanitized.estado_pago)) {
            throw new Error('Invalid payment status');
        }

        const { data, error } = await supabase
            .from('Facturas_Compras')
            .update(sanitized)
            .eq('id', id)
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async getProviders() {
        const { data, error } = await supabase.from('Proveedores').select('*').order('nombre');
        if (error) throw error;
        return data;
    },
    async createProvider(provider: { nombre: string; rif: string }) {
        const { data, error } = await supabase
            .from('Proveedores')
            .upsert(provider, { onConflict: 'rif' })
            .select()
            .single();
        if (error) throw error;
        return data;
    },
    async getPurchaseOrderByNumber(orderNumber: string) {
        const { data, error } = await supabase
            .from('Purchase_Orders')
            .select('*, Proveedores(*), Detalle_Purchase_Order(*, Inventario_Global(*))')
            .eq('numero_orden', orderNumber)
            .single();
        if (error) return null;
        return data;
    },

    async processIAPurchase(payload: {
        rif_proveedor: string;
        nombre_proveedor: string;
        numero_factura: string;
        total_neto: number;
        archivo_pdf_url?: string;
        orden_compra?: string;
        guia_remision?: string;
        guia_archivo_url?: string;
        placa_vehiculo?: string;
        items: Array<{ material_id: string; cantidad: number; precio: number; cantidad_recibida?: number; conformidad_calidad?: string; observaciones?: string }>;
    }) {
        const { data: userData } = await supabase.auth.getUser();

        console.log('🔍 DEBUG - processIAPurchase payload:', JSON.stringify(payload, null, 2));

        // 1. Registrar Factura (Contabilidad/Proveedores)
        const { data: facturaId, error: fError } = await supabase.rpc('procesar_factura_ia', {
            p_rif_proveedor: payload.rif_proveedor,
            p_nombre_proveedor: payload.nombre_proveedor,
            p_numero_factura: payload.numero_factura,
            p_total_neto: payload.total_neto,
            p_items: payload.items
        });
        if (fError) {
            console.error('Error RPC procesar_factura_ia:', fError);
            throw fError;
        }

        // 2. Registrar Movimiento de Material SAP (Clase 101 - Entrada de Mercancía)
        try {
            await this.createMaterialDocument({
                clase_movimiento: '101',
                referencia_externa: payload.numero_factura,
                observaciones: `Entrada por Compra - Factura: ${payload.numero_factura}`,
                items: payload.items.map(item => ({
                    material_id: item.material_id,
                    cantidad: item.cantidad,
                    importe_total: item.cantidad * item.precio
                }))
            });
        } catch (sapError) {
            console.error('Error creando documento material SAP (No fatal):', sapError);
        }

        // 3. Vincular evidencia y auditor + Datos de Recepción Advanced
        const updatePayload: any = {
            archivo_pdf_url: payload.archivo_pdf_url,
            orden_compra: payload.orden_compra,
            guia_remision: payload.guia_remision,
            guia_archivo_url: payload.guia_archivo_url,
            placa_vehiculo: payload.placa_vehiculo
        };

        if (userData?.user) {
            updatePayload.usuario_id = userData.user.id;
        }

        try {
            const { error: uError } = await supabase.from('Facturas_Compras')
                .update(updatePayload)
                .eq('id', facturaId);
            if (uError) console.error('Error actualizando campos adicionales factura:', uError);
        } catch (updError) {
            console.error('Error en update Facturas_Compras (Posible falta de columnas):', updError);
        }

        // 4. Actualizar Detalle con Validación de Recepción
        for (const item of payload.items) {
            if (item.cantidad_recibida !== undefined || item.conformidad_calidad) {
                try {
                    const { error: dError } = await supabase.from('Detalle_Compra')
                        .update({
                            cantidad_recibida: item.cantidad_recibida ?? item.cantidad,
                            conformidad_calidad: item.conformidad_calidad || 'CONFORME',
                            observaciones: item.observaciones || ''
                        })
                        .eq('factura_id', facturaId)
                        .eq('material_id', item.material_id);
                    if (dError) console.error('Error actualizando detalle_compra:', dError);
                } catch (detError) {
                    console.error('Error en update Detalle_Compra:', detError);
                }
            }
        }

        return facturaId;
    },

    // --- WORKFLOW DE RECEPCIÓN AVANZADA ---

    /**
     * FASE 1 & 2: Obtener inspecciones pendientes (Staging/Cuarentena)
     */
    async getPendingInspections() {
        const { data, error } = await supabase
            .from('Inspecciones_Calidad')
            .select('*, Inventario_Global(*)')
            .eq('estado', 'PENDIENTE');
        if (error) throw error;
        return data;
    },

    /**
     * FASE 3 & 4: Conformidad (Three-Way Match) e Internamiento
     * Mueve de Cuarentena a Disponible y crea Cuenta por Pagar
     */
    async processInternment(payload: {
        inspectionId: string;
        materialId: string;
        qtyApproved: number;
        location: string; // Estante/Pasillo
        remarks?: string;
        resultPdfUrl?: string;
    }) {
        const { data: userData } = await supabase.auth.getUser();

        // 1. Actualizar Inspección
        const { error: inspError } = await supabase
            .from('Inspecciones_Calidad')
            .update({
                estado: 'APROBADO',
                url_pdf_resultado: payload.resultPdfUrl,
                inspeccionado_por: userData.user?.id,
                observaciones: payload.remarks
            })
            .eq('id', payload.inspectionId);

        if (inspError) throw inspError;

        // 2. Mover de Cuarentena a Disponible (Regla SAP)
        const { error: stockError } = await supabase.rpc('internar_material_calidad', {
            p_material_id: payload.materialId,
            p_cantidad: payload.qtyApproved,
            p_ubicacion: payload.location
        });

        if (stockError) throw stockError;

        return { success: true };
    },

    /**
     * RECHAZO DE MATERIAL
     * Elimina de cuarentena sin pasar a disponible
     */
    async rejectInspection(payload: {
        inspectionId: string;
        materialId: string;
        qty: number;
        reason: string;
    }) {
        // 1. Marcar Inspección como Rechazada
        const { error: inspError } = await supabase
            .from('Inspecciones_Calidad')
            .update({
                estado: 'RECHAZADO',
                observaciones: payload.reason
            })
            .eq('id', payload.inspectionId);

        if (inspError) throw inspError;

        // 2. Ejecutar RPC de Rechazo
        const { error: stockError } = await supabase.rpc('rechazar_material_calidad', {
            p_material_id: payload.materialId,
            p_cantidad: payload.qty,
            p_motivo: payload.reason
        });

        if (stockError) throw stockError;

        return { success: true };
    },

    /**
     * MÉTODO DE CONCORDANCIA (Three-Way Match)
     * Cruza Orden de Compra vs Guía vs Conteo
     */
    async getThreeWayMatchReport(facturaId: string) {
        const { data, error } = await supabase
            .from('Facturas_Compras')
            .select(`
                *,
                Proveedores(*),
                Detalle_Compra(
                    *,
                    Inventario_Global(*)
                )
            `)
            .eq('id', facturaId)
            .single();

        if (error) throw error;
        return data;
    },

    // Security & Audit (For Guardian-AI / Stitch)
    async getAuditLogs(limit = 100) {
        const { data, error } = await supabase
            .from('Vista_Auditoria_Guardian')
            .select('*')
            .limit(limit);
        if (error) throw error;
        return data;
    },

    // Notifications (Modulo de Compras)
    async getNotifications(modulo?: string) {
        let query = supabase.from('notificaciones').select('*').order('created_at', { ascending: false });
        if (modulo) query = query.eq('modulo', modulo);
        const { data, error } = await query;
        if (error) throw error;
        return data as Notificacion[];
    },

    // Companies
    async getCompanies() {
        const { data, error } = await supabase.from('companies').select('*');
        if (error) throw error;
        return data;
    },
    async createCompany(company: Partial<Company>) {
        const { data, error } = await supabase.from('companies').insert(company).select().single();
        if (error) throw error;
        return data;
    },

    // Projects
    async getProjects() {
        const { data, error } = await supabase.from('projects').select('*');
        if (error) throw error;
        return data;
    },
    async createProject(project: Partial<Project>) {
        const { data, error } = await supabase.from('projects').insert(project).select().single();
        if (error) throw error;
        return data;
    },
    // Workers
    async getWorkers() {
        const { data, error } = await supabase.from('workers').select('*');
        if (error) throw error;
        return data;
    },

    // Employees
    async getEmployees() {
        const { data, error } = await supabase.from('empleados').select('*');
        if (error) throw error;
        return data;
    },


    // SAP MM Module - Material Movements
    async createMaterialDocument(doc: {
        clase_movimiento: '101' | '501' | '201' | '311'; // 311 Added for Transfer
        referencia_externa?: string;
        observaciones?: string;
        items: Array<{ material_id: string; cantidad: number; importe_total: number }>;
    }) {
        const { data: userData } = await supabase.auth.getUser();

        // 1. Crear Cabezal
        const { data: docHeader, error: headerError } = await supabase
            .from('Documentos_Material')
            .insert({
                clase_movimiento: doc.clase_movimiento,
                referencia_externa: doc.referencia_externa,
                observaciones: doc.observaciones,
                responsable_id: userData.user?.id
            })
            .select()
            .single();

        if (headerError) throw headerError;

        // 2. Crear Posiciones
        const positions = doc.items.map(item => ({
            documento_id: docHeader.id,
            material_id: item.material_id,
            cantidad: item.cantidad,
            importe_total: item.importe_total
        }));

        console.log('🔍 DEBUG - Positions to insert:', JSON.stringify(positions, null, 2));

        const { error: posError } = await supabase
            .from('Posiciones_Documento')
            .insert(positions);

        if (posError) {
            console.error('❌ ERROR inserting positions:', posError);
            throw posError;
        }

        // 3. Registrar en inventory_movements para el Kardex
        const movements = doc.items.map(item => ({
            movement_type: doc.clase_movimiento === '101' ? 'IN_101' : (doc.clase_movimiento === '201' ? 'OUT_CONSUMPTION' : 'MANUAL_ENTRY'),
            item_id: item.material_id,
            quantity: item.cantidad,
            budget_item_id: (item as any).budget_item_id, // Pasar ID de partida si viene
            remarks: doc.observaciones
        }));

        await supabase.from('inventory_movements').insert(movements);

        return docHeader;
    },



    async analyzeInvoiceAI(imageUrl: string) {
        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
        console.log("Gemini API Key Status:", apiKey ? "Configurada (Inicia con " + apiKey.substring(0, 4) + ")" : "NO CONFIGURADA");

        if (!apiKey) throw new Error("GEMINI_API_KEY no configurada en .env.local (VITE_GEMINI_API_KEY)");

        // Fetch file and convert to base64
        const fileRes = await fetch(imageUrl);
        const blob = await fileRes.blob();
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve, reject) => {
            reader.onloadend = () => {
                const base64String = reader.result as string;
                resolve(base64String.split(',')[1]);
            };
            reader.onerror = reject;
        });
        reader.readAsDataURL(blob);
        const base64 = await base64Promise;
        const mimeType = blob.type || "image/jpeg";

        const prompt = `Analiza esta factura y devuelve los datos en JSON:
        {
          "proveedor_nombre": "string",
          "proveedor_rif": "string",
          "numero_factura": "string",
          "total_neto": number,
          "items": [{"nombre": "string", "cantidad": number, "precio_unitario": number}]
        }
        Solo devuelve el JSON, sin markdown.`;

        // Usar gemini-1.5-flash (versión estable)
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: mimeType === 'application/pdf' ? 'application/pdf' : 'image/jpeg', data: base64 } }
                    ]
                }]
            })
        });

        if (!geminiRes.ok) {
            const errData = await geminiRes.json();
            console.error("Gemini API Error Detail:", errData);
            throw new Error(errData.error?.message || "Error en la red neuronal");
        }

        const result = await geminiRes.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "";

        // Búsqueda robusta de JSON en la respuesta
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            console.error("No se encontró JSON en la respuesta:", text);
            throw new Error("El Agente no pudo generar los datos estructurados. Intenta con una imagen más clara.");
        }

        try {
            return JSON.parse(jsonMatch[0]);
        } catch (e) {
            console.error("Error parseando JSON extraído:", jsonMatch[0]);
            throw new Error("Error de formato en la respuesta de la IA.");
        }
    },

    async verifyIdentityAI(selfieUrl: string, idPhotoUrl: string) {
        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("VITE_GEMINI_API_KEY no configurada");

        // Helper to convert URL to base64
        const toBase64 = async (url: string) => {
            const res = await fetch(url);
            const blob = await res.blob();
            return new Promise<{ data: string, mimeType: string }>((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = (reader.result as string).split(',')[1];
                    resolve({ data: base64, mimeType: blob.type || "image/jpeg" });
                };
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        };

        const [selfie, idPhoto] = await Promise.all([toBase64(selfieUrl), toBase64(idPhotoUrl)]);

        const prompt = `Actúa como un experto en seguridad biométrica. Compara estas dos imágenes:
        1. Una selfie/foto de perfil del trabajador.
        2. Una foto de su documento de identidad (Cédula).
        
        Determina si se trata de la misma persona. Devuelve un JSON estrictamente con este formato:
        {
          "isSamePerson": boolean,
          "confidenceScore": number (0 a 100),
          "analysis": "Breve explicación del resultado en español"
        }`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: selfie.mimeType, data: selfie.data } },
                        { inline_data: { mime_type: idPhoto.mimeType, data: idPhoto.data } }
                    ]
                }]
            })
        });

        if (!geminiRes.ok) throw new Error("Error en verificación biométrica");

        const result = await geminiRes.json();
        let text = result.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        return JSON.parse(text);
    },

    async getAgentAnalysis(agentRole: string, systemData: any, userPrompt?: string) {
        const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
        if (!apiKey) throw new Error("VITE_GEMINI_API_KEY no configurada");

        const prompt = `Actúa como el Agente AI "${agentRole}" dentro de un ERP corporativo de construcción y logística. 
        
        DATOS ACTUALES DEL SISTEMA:
        ${JSON.stringify(systemData, null, 2)}
        
        ${userPrompt ? `PREGUNTA DEL USUARIO: ${userPrompt}` : 'Realiza un informe de auditoría o resumen operativo según tu rol.'}
        
        FORMATO DEL REPORTE:
        Usa Markdown. Sé profesional, directo y enfocado en la eficiencia operativa. No uses introducciones genéricas como "Aquí tienes tu reporte". Empieza directamente con el contenido.`;

        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

        const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        });

        if (!geminiRes.ok) throw new Error("Error en comunicación con la Red Neuronal");

        const result = await geminiRes.json();
        return result.candidates?.[0]?.content?.parts?.[0]?.text || "No se pudo generar el análisis.";
    },

    async getAIMappings() {
        const { data, error } = await supabase.from('AI_Material_Mappings').select('*');
        if (error) throw error;
        return data as any[];
    },

    async saveAIMapping(text_factura: string, material_id: string) {
        const { data: userData } = await supabase.auth.getUser();
        const { error } = await supabase
            .from('AI_Material_Mappings')
            .upsert({
                text_factura,
                material_id,
                usuario_id: userData.user?.id,
                last_used_at: new Date().toISOString()
            }, { onConflict: 'text_factura' });
        if (error) throw error;
        return true;
    },

    // SAP MM/PM CORE MODULE (Advanced Inventory)

    /**
     * MÉTODO A: Entrada de Almacén (Goods Receipt)
     * Regla SAP: Recalcula PMP y valida respaldo documental
     */
    async processGoodsReceipt(payload: {
        itemId: string;
        qtyReceived: number;
        unitPrice: number;
        referenceDocId?: string;
        locationId: string;
        isDamaged?: boolean;
        initialHourMeter?: number;
    }) {
        // SECURITY: Removed admin key bypass. All entries must have valid reference documents.
        // For manual entries, implement via Supabase Edge Function with role verification.

        // 1. Validación de Respaldo Documental (REQUIRED)
        if (!payload.referenceDocId) {
            throw new Error("RECHAZO: No se permiten ingresos sin OC o Nota de Transferencia. Contacte a su supervisor para autorizaciones especiales.");
        }

        const { data: item, error: fetchError } = await supabase
            .from('inventory_master')
            .select('*')
            .eq('id', payload.itemId)
            .single();

        if (fetchError) throw fetchError;

        // 2. Regla SAP: Recalcular Costo Promedio Ponderado (PMP)
        const currentStock = await this.getItemStock(payload.itemId);
        const newTotalStock = currentStock + payload.qtyReceived;
        const currentWAC = Number(item.weighted_average_cost) || 0;

        const newWAC = ((currentStock * currentWAC) + (payload.qtyReceived * payload.unitPrice)) / newTotalStock;

        // 3. Actualizar Maestro de Materiales
        const { error: updateError } = await supabase
            .from('inventory_master')
            .update({
                weighted_average_cost: newWAC,
                updated_at: new Date().toISOString()
            })
            .eq('id', payload.itemId);

        if (updateError) throw updateError;

        // 4. Registrar Movimiento
        const { data: userData } = await supabase.auth.getUser();

        const { error: movError } = await supabase
            .from('inventory_movements')
            .insert({
                movement_type: 'IN_PURCHASE',
                item_id: payload.itemId,
                quantity: payload.qtyReceived,
                location_id: payload.locationId,
                reference_doc_id: payload.referenceDocId,
                responsible_person_id: userData.user?.id,
                remarks: payload.isDamaged ? "INGRESO EN CUARENTENA - ITEM DAÑADO" : "Ingreso por Compra"
            });

        if (movError) throw movError;

        return { success: true, newWAC };
    },

    /**
     * MÉTODO B: Despacho de Combustible
     * Requisito: Exige ID de activo pesado y calcula rendimiento
     */
    async dispenseFuel(payload: {
        machineId: string;
        itemId: string; // El combustible de inventory_master
        gallonsDispensed: number;
        currentHourMeter: number;
        locationId: string;
    }) {
        const { data: machine, error: mError } = await supabase
            .from('asset_heavy_machinery')
            .select('*')
            .eq('id', payload.machineId)
            .single();

        if (mError) throw mError;

        // Cálculo de Rendimiento KPI
        const hoursOperated = payload.currentHourMeter - (machine.hour_meter || 0);
        const performanceRate = hoursOperated / payload.gallonsDispensed;

        // Registrar Movimiento de Combustible
        const { data: userData } = await supabase.auth.getUser();

        const { error: movError } = await supabase
            .from('inventory_movements')
            .insert({
                movement_type: 'FUEL_DISPENSE',
                item_id: payload.itemId,
                quantity: payload.gallonsDispensed,
                asset_id: payload.machineId,
                location_id: payload.locationId,
                responsible_person_id: userData.user?.id,
                remarks: `Tanqueo Máquina: ${machine.plate_number} | Rendimiento: ${performanceRate.toFixed(2)} Hrs/Gal`
            });

        if (movError) throw movError;

        // Actualizar Horómetro de la Máquina
        await supabase
            .from('asset_heavy_machinery')
            .update({ hour_meter: payload.currentHourMeter })
            .eq('id', payload.machineId);

        return { success: true, performanceRate };
    },

    /**
     * MÉTODO C: Cierre Mensual - Depreciación de Activos
     */
    async calculateAssetDepreciation() {
        const { data: machinery, error } = await supabase
            .from('asset_heavy_machinery')
            .select('*')
            .eq('ownership_type', 'OWNED');

        if (error) throw error;

        return machinery.map(m => {
            const monthlyDepreciation = (m.purchase_value - m.residual_value) / (m.useful_life_years * 12);
            return {
                id: m.id,
                plate: m.plate_number,
                monthlyCost: monthlyDepreciation
            };
        });
    },

    /**
     * MÉTODO D: Validación de Seguridad (Safety Storage)
     * Regla: No mezclar combustibles con oxidantes (Oxígeno)
     */
    async validateSafetyStorage(itemId: string, locationId: string) {
        const { data: newItem } = await supabase.from('inventory_master').select('item_type, name').eq('id', itemId).single();
        const { data: existingMovements } = await supabase
            .from('inventory_movements')
            .select('inventory_master(name, item_type)')
            .eq('location_id', locationId);

        if (newItem?.item_type === 'TYPE_FUEL') {
            const hasOxidants = existingMovements?.some(m =>
                (m.inventory_master as any).name.toUpperCase().includes('OXIGENO')
            );
            if (hasOxidants) {
                throw new Error("Riesgo de Seguridad Industrial: No se puede almacenar combustible junto a cilindros de oxígeno.");
            }
        }
        return true;
    },

    async getItemStock(itemId: string) {
        const { data } = await supabase
            .from('inventory_movements')
            .select('quantity, movement_type')
            .eq('item_id', itemId);

        if (!data) return 0;

        return data.reduce((acc, mov) => {
            const isEntry = mov.movement_type === 'IN_PURCHASE' || mov.movement_type === 'IN_TRANSFER';
            return isEntry ? acc + mov.quantity : acc - mov.quantity;
        }, 0);
    },

    // Storage
    async uploadFile(bucket: string, path: string, file: File) {
        const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
            upsert: true
        });
        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(data.path);
        return publicUrl;
    }
};
