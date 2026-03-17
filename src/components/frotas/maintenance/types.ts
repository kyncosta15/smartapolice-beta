export type MaintenanceType =
  | 'REVISAO'
  | 'REVISAO_COMPLETA'
  | 'PREVENTIVA'
  | 'CORRETIVA'
  | 'TROCA_OLEO'
  | 'TROCA_PNEUS'
  | 'TROCA_FREIOS'
  | 'TROCA_FILTROS'
  | 'TROCA_BATERIA'
  | 'BATERIA'
  | 'PNEU'
  | 'OUTRA';

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  type: MaintenanceType;
  performed_date: string;
  odometer_km: number;
  cost: number;
  notes: string | null;
  realizada: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaintenanceRule {
  id: string;
  vehicle_id: string;
  type: MaintenanceType;
  due_every_km: number | null;
  due_every_months: number | null;
  alert_before_km: number | null;
  alert_before_days: number | null;
  created_at: string;
}

export type MaintenanceStatus = 'OK' | 'ATENCAO' | 'VENCIDO';

export interface MaintenanceStatusInfo {
  type: MaintenanceType;
  lastDate: string | null;
  lastKm: number | null;
  nextDueKm: number | null;
  remainingKm: number | null;
  nextDueDate: string | null;
  remainingDays: number | null;
  status: MaintenanceStatus;
  hasRule: boolean;
}

export const MAINTENANCE_TYPE_LABELS: Record<MaintenanceType, string> = {
  REVISAO: 'Revisão Básica',
  REVISAO_COMPLETA: 'Revisão Completa',
  PREVENTIVA: 'Preventiva',
  CORRETIVA: 'Corretiva',
  TROCA_OLEO: 'Troca de Óleo',
  TROCA_PNEUS: 'Troca de Pneus',
  TROCA_FREIOS: 'Troca de Freios',
  TROCA_FILTROS: 'Troca de Filtros',
  TROCA_BATERIA: 'Troca de Bateria',
  BATERIA: 'Bateria',
  PNEU: 'Pneu',
  OUTRA: 'Outra',
};

export const MAINTENANCE_TYPE_ICONS: Record<MaintenanceType, string> = {
  REVISAO: '🔧',
  REVISAO_COMPLETA: '🔧',
  PREVENTIVA: '🛡️',
  CORRETIVA: '🔨',
  TROCA_OLEO: '🛢️',
  TROCA_PNEUS: '🛞',
  TROCA_FREIOS: '🛑',
  TROCA_FILTROS: '🌀',
  TROCA_BATERIA: '🔋',
  BATERIA: '🔋',
  PNEU: '🛞',
  OUTRA: '📋',
};

// Groups for status cards (main categories)
export const STATUS_CARD_TYPES: MaintenanceType[] = ['REVISAO', 'PNEU', 'BATERIA'];

// All types for filter chips
export const ALL_MAINTENANCE_TYPES: MaintenanceType[] = [
  'REVISAO', 'REVISAO_COMPLETA', 'PREVENTIVA', 'CORRETIVA',
  'TROCA_OLEO', 'TROCA_PNEUS', 'TROCA_FREIOS', 'TROCA_FILTROS',
  'TROCA_BATERIA', 'BATERIA', 'PNEU', 'OUTRA',
];
