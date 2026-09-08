export type PlanType = '1_week' | '2_weeks' | '1_month' | '2_months' | '3_months' | '5_months';

// Un alumno: una fila por persona, sin importar cuántas veces se matricule.
export interface Alumno {
  id: string;
  firstName: string;
  lastName: string;
  dni: string;
  phone: string;
}

// Una matrícula: cada inscripción/pago que hace un alumno.
export interface Matricula {
  id: string;
  alumnoId: string;
  plan: PlanType;
  startDate: string;
  endDate: string;
}

// Un alumno junto con los datos de su matrícula más reciente (para la vista de Alumnos).
export interface AlumnoConEstado extends Alumno {
  lastMatriculaId: string | null;
  lastPlan: PlanType | null;
  lastStartDate: string | null;
  lastEndDate: string | null;
}

// Una matrícula junto con los datos del alumno al que pertenece (para la vista de Matrículas).
export interface MatriculaConAlumno extends Matricula {
  firstName: string;
  lastName: string;
  dni: string;
}

export const PLAN_DETAILS: Record<PlanType, { label: string; price: number; durationDays?: number; durationMonths?: number }> = {
  '1_week': { label: '1 Semana', price: 70, durationDays: 7 },
  '2_weeks': { label: '2 Semanas', price: 120, durationDays: 14 },
  '1_month': { label: '1 Mes', price: 150, durationMonths: 1 },
  '2_months': { label: '2 Meses', price: 260, durationMonths: 2 },
  '3_months': { label: '3 Meses', price: 360, durationMonths: 3 },
  '5_months': { label: '5 Meses', price: 500, durationMonths: 5 },
};
