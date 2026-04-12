// src/utils.ts
import { PlanType, PLAN_DETAILS } from './types';

/**
 * Convierte una fecha de YYYY-MM-DD a DD-MM-YYYY (Numérico estándar)
 */
export function formatDate(dateString: string): string {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${day}-${month}-${year}`;
}

/**
 * Convierte una fecha a formato amigable: 03 marzo-2026
 */
export function formatFriendlyDate(dateString: string): string {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const monthName = months[parseInt(month) - 1];
  return `${day} ${monthName}-${year}`;
}

export function calculateEndDate(startDateStr: string, plan: PlanType): string {
  const date = new Date(startDateStr);
  const details = PLAN_DETAILS[plan];

  if (details.durationDays) {
    date.setDate(date.getDate() + details.durationDays);
  } else if (details.durationMonths) {
    date.setMonth(date.getMonth() + details.durationMonths);
  }

  // CORRECCIÓN DEFINITIVA: Añadimos para que devuelva solo YYYY-MM-DD
  return date.toISOString().split('T');
}

export function generateWhatsAppLink(member: { firstName: string; lastName: string; phone: string; startDate: string; endDate: string }) {
  const phone = member.phone.replace(/\D/g, '');
  
  // Usamos formatDate para que el mensaje de WA sea claro y profesional
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