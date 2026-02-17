/**
 * Strict type definitions for data validation and security
 */

/**
 * Allowed payment statuses
 */
export type PaymentStatus = 'PAGADA' | 'POR_PAGAR';

/**
 * Allowed purchase update fields - prevents injection of unauthorized fields
 */
export interface PurchaseUpdate {
    estado_pago?: PaymentStatus;
    fecha_pago?: string | null;
}

/**
 * Allowed material request statuses
 */
export type MaterialRequestStatus =
    | 'PENDIENTE'
    | 'APROBADA'
    | 'RECHAZADA'
    | 'DESPACHADA'
    | 'COMPLETADA';

/**
 * Allowed inventory movement types
 */
export type InventoryMovementType =
    | 'IN_PURCHASE'
    | 'OUT_CONSUMPTION'
    | 'TRANSFER'
    | 'ADJUSTMENT'
    | 'RETURN';

/**
 * User roles for access control
 */
export type UserRole =
    | 'admin'
    | 'gerente'
    | 'manager'
    | 'supervisor'
    | 'almacenero'
    | 'viewer'
    | 'obrero';

/**
 * Validate that an object only contains allowed fields
 * @param obj - Object to validate
 * @param allowedFields - Array of allowed field names
 * @returns Sanitized object with only allowed fields
 */
export function sanitizeObject<T extends Record<string, any>>(
    obj: T,
    allowedFields: (keyof T)[]
): Partial<T> {
    return Object.keys(obj)
        .filter(key => allowedFields.includes(key as keyof T))
        .reduce((sanitized, key) => {
            sanitized[key as keyof T] = obj[key as keyof T];
            return sanitized;
        }, {} as Partial<T>);
}
