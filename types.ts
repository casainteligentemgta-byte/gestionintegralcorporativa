
export type AppView =
  | 'LOGIN'
  | 'DASHBOARD'
  | 'COMPANIES'
  | 'COMPANY_FORM'
  | 'PROJECTS'
  | 'PROJECT_FORM'
  | 'WORKERS'
  | 'WORKER_FORM'
  | 'WORKER_PROFILE'
  | 'WORKER_CARNET'
  | 'REQUISITION_DETAIL'
  | 'CONTROL_PANEL';

export interface InventoryItem {
  id: string;
  material_name: string;
  unit_measure: string;
  current_stock: number;
  min_stock_alert: number;
  unit_price: number;
}

export interface ProjectMovement {
  id: string;
  project_id: string;
  material_id: string;
  quantity_dispatched: number;
  requires_transfer: boolean;
  transfer_cost: number;
  status: 'Pendiente' | 'Despachado' | 'Recibido';
  registration_date: string;
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
  status: 'ACTIVE' | 'PENDING' | 'INACTIVE';

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
