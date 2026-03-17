export type MaintenanceType = 'BATERIA' | 'PNEU' | 'REVISAO';

export interface MaintenanceLog {
  id: string;
  vehicle_id: string;
  type: MaintenanceType;
  performed_date: string;
  odometer_km: number;
  cost: number;
  notes: string | null;
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
  BATERIA: 'Bateria',
  PNEU: 'Pneu',
  REVISAO: 'Revisão',
};

export const MAINTENANCE_TYPE_ICONS: Record<MaintenanceType, string> = {
  BATERIA: '🔋',
  PNEU: '🛞',
  REVISAO: '🔧',
};
