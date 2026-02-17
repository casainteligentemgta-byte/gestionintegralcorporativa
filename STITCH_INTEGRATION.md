# 🛡️ STITCH GUARDIAN-AI: HUB DE INTEGRACIÓN (SECURITY AUDIT)

Este documento sirve como el **Handshake Técnico** para vincular al Agente Stitch (Sentinel) con el núcleo de datos de Antigravity.

## 🔗 Endpoint de Datos (PostgREST)
Para realizar consultas directas sin pasar por el frontend:

- **URL de Lectura (Vista Optimizada):** 
  `https://iwrowjywohgwvtvdubhp.supabase.co/rest/v1/Vista_Auditoria_Guardian`
- **Headers Obligatorios:**
  - `apikey`: `sb_publishable_TUE9ngkesc7vm-LV6bShqg_Fuo0ONFp`
  - `Authorization`: `Bearer sb_publishable_TUE9ngkesc7vm-LV6bShqg_Fuo0ONFp`

## 🧠 Lógica de Consulta para Stitch (Sentinel)

Stitch debe utilizar estas consultas para supervisar la salud del sistema:

1. **Detección de Anomalías Críticas (Severidad CRITICAL):**
   `GET /Vista_Auditoria_Guardian?nivel_severidad=eq.CRITICAL`
2. **Monitoreo de Movimientos de Inventario:**
   `GET /Vista_Auditoria_Guardian?modulo_afectado=eq.Inventario`
3. **Auditoría de Contratos IA Generados:**
   `GET /Vista_Auditoria_Guardian?modulo_afectado=eq.Legal`

## 🧩 Integración Programática (JavaScript/TypeScript)

Si Stitch actúa dentro del entorno del ERP, puede usar el `dataService`:

```typescript
import { dataService } from './services/dataService';

// Stitch llamando al log de auditoría
const logs = await dataService.getAuditLogs(50); 
console.log("Stitch Sentinel reportando:", logs);
```

---
*Configurado por Antigravity - System Architect & Cybersecurity Engineer*
