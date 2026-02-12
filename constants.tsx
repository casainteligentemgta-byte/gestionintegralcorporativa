
import React from 'react';

export const MOCK_COMPANIES = [
  { 
    id: '1', 
    name: 'Constructora Horizonte', 
    rif: 'J-40822314-1', 
    address: 'Av. Francisco de Miranda, Edif. Parque Cristal, Caracas', 
    phone: '+58 212 555 1234', 
    email: 'contacto@horizonte.com',
    logo: 'https://picsum.photos/seed/horizonte/200/200',
    documentation: ['Registro_Mercantil.pdf', 'RIF_Actualizado.pdf'],
    representative: {
      fullName: 'Andrés Mendoza',
      idNumber: 'V-15.432.987',
      age: '42',
      civilStatus: 'Casado',
      position: 'Director General',
      nationality: 'Venezolana'
    }
  },
  { 
    id: '2', 
    name: 'Global Tech S.A.', 
    rif: 'J-29834125-1', 
    address: 'Zona Industrial Valencia, Carabobo', 
    phone: '+58 241 555 4321', 
    email: 'info@globaltech.com',
    logo: 'https://picsum.photos/seed/globaltech/200/200',
    documentation: ['Acta_Constitutiva.pdf'],
    representative: {
      fullName: 'Beatriz Colmenares',
      idNumber: 'V-18.765.432',
      age: '35',
      civilStatus: 'Soltera',
      position: 'Gerente Legal',
      nationality: 'Venezolana'
    }
  },
  { 
    id: '3', 
    name: 'Inversiones Altamira', 
    rif: 'J-31002938-2', 
    address: 'Calle Las Industrias, Maracay, Aragua', 
    phone: '+58 243 555 0000', 
    email: 'admin@altamira.com',
    logo: 'https://picsum.photos/seed/altamira/200/200',
    documentation: [],
    representative: {
      fullName: 'Ricardo Pérez',
      idNumber: 'V-12.000.111',
      age: '50',
      civilStatus: 'Divorciado',
      position: 'Presidente',
      nationality: 'Venezolana'
    }
  },
];

export const MOCK_PROJECTS = [
  { id: '1', name: 'Torre Residencial Sky', owner: 'Inmobiliaria Global S.A.', location: 'Polanco, CDMX', image: 'https://picsum.photos/seed/sky/400/300', status: 'ACTIVE' },
  { id: '2', name: 'Complejo Industrial KORE', owner: 'Delta Group', location: 'Monterrey, NL', image: 'https://picsum.photos/seed/industrial/400/300', status: 'ACTIVE' },
  { id: '3', name: 'Puente Bicentenario', owner: 'Gobierno Estatal', location: 'Querétaro, QRO', image: 'https://picsum.photos/seed/bridge/400/300', status: 'PENDING' },
];

export const MOCK_WORKERS = [
  { id: '1', firstName: 'Juan', firstSurname: 'Pérez', specialty: 'SOLDADOR DE 1ra.', idNumber: 'V-12.345.678', status: 'ACTIVE', age: 28, photo: 'https://picsum.photos/seed/juan/100/100' },
  { id: '2', firstName: 'Carlos', firstSurname: 'Mendoza', specialty: 'MAESTRO DE OBRA de 1ra.', idNumber: 'V-14.890.123', status: 'ACTIVE', age: 52, photo: 'https://picsum.photos/seed/carlos/100/100' },
  { id: '3', firstName: 'Miguel', firstSurname: 'Silva', specialty: 'ELECTRICISTA DE 2da.', idNumber: 'V-18.223.445', status: 'PENDING', age: 24, photo: 'https://picsum.photos/seed/miguel/100/100' },
  { id: '4', firstName: 'Jose', firstSurname: 'García', specialty: 'OBRERO DE 1era.', idNumber: 'V-15.112.334', status: 'ACTIVE', age: 33, photo: 'https://picsum.photos/seed/jose/100/100' },
  { id: '5', firstName: 'Pedro', firstSurname: 'Infante', specialty: 'CHOFER DE GANDOLA DE 1ra. (TODO TON.)', idNumber: 'V-10.445.667', status: 'ACTIVE', age: 48, photo: 'https://picsum.photos/seed/pedro/100/100' },
];
