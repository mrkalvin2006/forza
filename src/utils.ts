// src/utils.ts
import { PlanType, PLAN_DETAILS } from './types';

/**
 * Convierte una fecha de YYYY-MM-DD a DD-MM-YYYY para mostrar al usuario
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

export function calculateEndDate(startDateStr: string, plan: PlanType): string {
  const date = new Date(startDateStr);
  const details = PLAN_DETAILS[plan];

  if (details.durationDays) {
    date.setDate(date.getDate() + details.durationDays);
  } else if (details.durationMonths) {
    date.setMonth(date.getMonth() + details.durationMonths);
  }

  return date.toISOString().split('T');
}

export function generateWhatsAppLink(member: { firstName: string; lastName: string; phone: string; startDate: string; endDate: string }) {
  const phone = member.phone.replace(/\D/g, '');
  
  // Usamos formatDate aquí también para que el mensaje de WA sea amigable
  const start = formatDate(member.startDate);
  const end = formatDate(member.endDate);

  const message = `¡Hola *${member.firstName} ${member.lastName}*! 🏋️‍♂️\n\nQueremos agradecerte por ser parte de *Forza Club*.\n\nTe recordamos los detalles de tu membresía:\n📅 *Fecha de inicio:* ${start}\n⏳ *Fecha de vencimiento:* ${end}\n\n¡Sigue dando lo mejor en tus entrenamientos! 💪`;
  
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function getDaysRemaining(endDateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endDate = new Date(endDateStr);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}