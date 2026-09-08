export type PlanType = '1_week' | '2_weeks' | '1_month' | '2_months' | '3_months' | '5_months';

// Un alumno: una fila por persona, sin importar cuántas veces se matricule.
export interface Alumno {
  id: string;
  firstName: string;
  lastName: string | null;
  dni: string | null;
  phone: string | null;
}

// Una matrícula: cada inscripción/pago que hace un alumno.
export interface Matricula {
  id: string;
  alumnoId: string;
  plan: PlanType;
  startDate: string;
  endDate: string;
  amount: number;
}

// Un alumno junto con los datos de su matrícula más reciente (para la vista de Alumnos).
export interface AlumnoConEstado extends Alumno {
  lastMatriculaId: string | null;
  lastPlan: PlanType | null;
  lastStartDate: string | null;
  lastEndDate: string | null;
  lastAmount: number | null;
}

// Una matrícula junto con los datos del alumno al que pertenece (para la vista de Matrículas).
export interface MatriculaConAlumno extends Matricula {
  firstName: string;
  lastName: string | null;
  dni: string | null;
}

export const PLAN_DETAILS: Record<PlanType, { label: string; price: number; durationDays?: number; durationMonths?: number }> = {
  '1_week': { label: '1 Semana', price: 90, durationDays: 7 },
  '2_weeks': { label: '2 Semanas', price: 140, durationDays: 14 },
  '1_month': { label: '1 Mes', price: 180, durationMonths: 1 },
  '2_months': { label: '2 Meses', price: 300, durationMonths: 2 },
  '3_months': { label: '3 Meses', price: 400, durationMonths: 3 },
  '5_months': { label: '5 Meses', price: 570, durationMonths: 5 },
};
