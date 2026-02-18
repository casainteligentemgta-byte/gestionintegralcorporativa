
export type AppView =
  | 'LOGIN'
  | 'DASHBOARD'
  | 'COMPANIES'
  | 'COMPANY_FORM'
  | 'COMPANY_DOSSIER'
  | 'PROJECTS'
  | 'PROJECT_FORM'
  | 'WORKERS'
  | 'WORKER_FORM'
  | 'WORKER_PROFILE'
  | 'WORKER_CARNET'
  | 'WORKER_DIGITAL_SHEET'
  | 'REQUISITION_DETAIL'
  | 'REQUISITION_FORM'
  | 'RECRUITMENT_FORM'
  | 'INVENTORY_DASHBOARD'
  | 'MATERIAL_FORM'
  | 'TICKET_MANAGEMENT'
  | 'PURCHASE_MANAGEMENT'
  | 'QUALITY_GATE'
  | 'TECHNICAL_REPORT'
  | 'ADVANCED_STOCK_ENTRY'
  | 'MATERIAL_REQUEST_FORM'
  | 'WAREHOUSE_DISPATCH_PANEL'
  | 'STOCKTAKING'
  | 'AUDIT_DASHBOARD'
  | 'INVENTORY_VALUATION_REPORT'
  | 'STOCK_MOVEMENT_SAP'
  | 'HIRING_REVIEW'
  | 'MOVEMENT_HISTORY'
  | 'CONTROL_PANEL'
  | 'GUARDIAN_CONSOLE'
  | 'INVENTORY_MOVEMENT_HUB'
  | 'JOB_COST_REPORT'
  | 'SETTINGS'
  | 'PASSWORD_RECOVERY'
  | 'INCOMING_MERCHANDISE'
  | 'PURCHASE_REPORTS'
  | 'ACCOUNTING_DASHBOARD'
  | 'USER_MANAGEMENT'
  | 'EMPLOYEES'
  | 'AGENT_CENTER'
  | 'EMPLOYEE_POSTULATION'
  | 'ACCOUNTS_PAYABLE'
  | 'BILLING_REVENUE'
  | 'TREASURY_BANKING'
  | 'FIXED_ASSETS'
  | 'COST_ACCOUNTING'
  | 'TAX_COMPLIANCE'
  | 'FINANCIAL_REPORTING';

export enum ItemType {
  TYPE_ROH = 'TYPE_ROH', // Materiales de Construcción
  TYPE_FUEL = 'TYPE_FUEL', // Combustibles y Lubricantes
  TYPE_EPP = 'TYPE_EPP'   // Seguridad Industrial
}

export interface InventoryMaster {
  id: string;
  code_sap: string;
  name: string;
  description: string;
  item_type: ItemType;
  unit_measure: string;
  weighted_average_cost: number;
  min_stock: number;
  max_stock: number;
  batch_number?: string;
  expiration_date?: string;
  is_flammable: boolean;
  safety_sheet_url?: string;
  size?: string;
  renewal_days?: number;
  certification?: string;
  created_at?: string;
}

export enum AssetStatus {
  AVAILABLE = 'AVAILABLE',
  IN_USE = 'IN_USE',
  MAINTENANCE = 'MAINTENANCE',
  DAMAGED = 'DAMAGED'
}

export interface HeavyMachinery {
  id: string;
  plate_number: string;
  name: string;
  hour_meter: number;
  last_maintenance_hour: number;
  fuel_tank_capacity?: number;
  purchase_value: number;
  residual_value: number;
  useful_life_years: number;
  depreciation_method: string;
  ownership_type: 'OWNED' | 'RENTED';
  rental_hourly_rate: number;
}

export interface SmallTool {
  id: string;
  serial_number: string;
  name: string;
  status: AssetStatus;
  assigned_employee_id?: string;
  last_calibration?: string;
}

export interface InventoryMovement {
  id: string;
  timestamp: string;
  movement_type: '101_COMPRA' | '311_TRANSFERENCIA' | '501_SOBRANTE' | '601_REINGRESO' | 'OUT_CONSUMPTION' | 'FUEL_DISPENSE';
  item_id: string;
  quantity: number;
  cost_center?: string;
  responsible_person_id: string;
  location_id: string;
  asset_id?: string;
  reference_doc_id?: string;
  remarks?: string;
}

export interface InventarioItem {
  id: string;
  nombre: string;
  descripcion: string;
  stock_disponible: number;
  stock_bloqueado: number;
  unidad_medida: string;
  valor_unitario_promedio: number;
  punto_reorden: number;
  categoria: string;
  subfamily_id?: string;
  specs_data?: Record<string, any>;
  url_foto: string;
  ubicacion: string;
}

export interface MovimientoObra {
  id: string;
  id_material: string;
  cantidad: number;
  obra_destino: string;
  tipo_movimiento: 'ENTRADA' | 'SALIDA' | 'AJUSTE';
  id_usuario: string;
  estado: 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';
  justificacion: string;
  costo_transporte: number;
  url_foto?: string;
  fecha_registro: string;
}

export interface Notificacion {
  id: string;
  titulo: string;
  mensaje: string;
  modulo: string;
  leido: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  rif: string;
  address: string;
  phone: string;
  email: string;
  logo?: string;
  documentation?: string[];
  representative: {
    fullName: string;
    idNumber: string;
    age: string;
    civilStatus: string;
    position: string;
    nationality: string;
    email?: string;
    whatsapp?: string;
  };
}

export interface Project {
  id: string;
  name: string;
  owner: string;
  contractNo: string;
  date?: string;
  description: string;
  phone?: string;
  email?: string;
  status: 'ACTIVE' | 'PENDING' | 'STOPPED' | 'FINISHED';
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  image?: string;
}

export interface Dependent {
  fullName: string;
  relationship: string;
  dob: string;
}

export interface WorkExperience {
  company: string;
  location: string;
  position: string;
  duration: string;
  departureDate: string;
  reason: string;
}

export interface Worker {
  id: string;
  idType: string;
  idNumber: string;
  firstName: string;
  secondName: string;
  firstSurname: string;
  secondSurname: string;
  dob: string;
  age: string;
  civilStatus: string;
  birthPlace: string;
  birthCountry: string;
  nationality: string;
  cellPhone: string;
  homePhone: string;
  email: string;
  address: string;
  ivss: boolean;
  leftHanded: boolean;
  photo?: string;
  idPhoto?: string;
  specialty: string;
  status: 'ACTIVE' | 'PENDING' | 'PENDING_REVIEW' | 'INACTIVE';
  hiring_data_json?: {
    // Campos completados por el reclutador
    cargo: string;
    salario: number;
    fecha_ingreso: string;
    tipo_contrato: 'TIEMPO_DETERMINADO' | 'TIEMPO_INDETERMINADO';
    centro_costo: string;
    numero_contrato: string;
    fecha_contrato: string;
    forma_pago: string; // Ej: "Transferencia bancaria", "Efectivo"
    lugar_pago: string; // Ej: "Oficina principal", "En obra"
    jornada_trabajo: 'DIURNA' | 'NOCTURNA' | 'MIXTA';
    lugar_prestacion_servicio: string; // Ubicación de la obra
    objeto_contrato: string; // Descripción del objeto del contrato
    numero_oficio_tabulador: string; // Número según tabulador de gaceta oficial
  };

  criminalRecords: {
    hasRecords: boolean;
    issuedBy: string;
    place: string;
    date: string;
  };

  education: {
    canRead: boolean;
    primary: string;
    secondary: string;
    technical: string;
    superior: string;
    currentProfession: string;
  };

  union: {
    federation: string;
    position: string;
  };

  medical: {
    hasExam: boolean;
    performedBy: string;
    bloodType: string;
    diseases: string;
    incapacities: string;
  };

  sizes: {
    weight: string;
    stature: string;
    shirt: string;
    pants: string;
    overalls: string;
    boots: string;
    observations: string;
  };

  dependents: Dependent[];
  experience: WorkExperience[];

  banking: {
    bank: string;
    accountType: string;
    accountNumber: string;
  };
}
