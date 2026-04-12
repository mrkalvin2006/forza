// src/utils.ts
import { PlanType, PLAN_DETAILS } from './types';

/**
 * Convierte una fecha de YYYY-MM-DD a DD-MM-YYYY (A prueba de errores)
 */
export function formatDate(dateString: any): string {
  if (!dateString || typeof dateString !== 'string') return "Sin fecha";
  try {
    const cleanDate = dateString.split('T'); // Previene errores si viene con hora
    const [year, month, day] = cleanDate.split("-");
    return `${day}-${month}-${year}`;
  } catch (error) {
    return "Error de fecha";
  }
}

/**
 * Convierte una fecha a formato amigable: 03 marzo-2026 (A prueba de errores)
 */
export function formatFriendlyDate(dateString: any): string {
  if (!dateString || typeof dateString !== 'string') return "Sin fecha";
  try {
    const cleanDate = dateString.split('T'); // Previene errores si viene con hora
    const [year, month, day] = cleanDate.split("-");
    const months = [
      "enero", "febrero", "marzo", "abril", "mayo", "junio",
      "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
    ];
    const monthName = months[parseInt(month) - 1];
    return `${day} ${monthName}-${year}`;
  } catch (error) {
    return "Error de fecha";
  }
}

export function calculateEndDate(startDateStr: string, plan: PlanType): string {
  if (!startDateStr) return new Date().toISOString().split('T');
  
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
  // Aseguramos que phone sea un string antes de hacer replace
  const rawPhone = member.phone ? String(member.phone) : '';
  const phone = rawPhone.replace(/\D/g, '');
  
  const start = formatDate(member.startDate);
  const end = formatDate(member.endDate);

  const message = `¡Hola *${member.firstName} ${member.lastName}*! 🏋️‍♂️\n\nQueremos agradecerte por ser parte de *Forza Club*.\n\nTe recordamos los detalles de tu membresía:\n📅 *Fecha de inicio:* ${start}\n⏳ *Fecha de vencimiento:* ${end}\n\n¡Sigue dando lo mejor en tus entrenamientos! 💪`;
  
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function getDaysRemaining(endDateStr: any): number {
  if (!endDateStr || typeof endDateStr !== 'string') return 0;
  
  const cleanDate = endDateStr.split('T');
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const endDate = new Date(cleanDate);
  endDate.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}