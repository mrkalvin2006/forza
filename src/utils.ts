// src/utils.ts
import { PlanType, PLAN_DETAILS } from './types';

// LIMPIADOR EXTREMO: Repara datos corruptos de la base de datos
function extractDate(val: any): string {
  if (!val) return "";
  const str = String(val);
  // Busca forzosamente el patrón YYYY-MM-DD ignorando comas, arrays o letras T/Z
  const match = str.match(/\d{4}-\d{2}-\d{2}/);
  return match ? match : "";
}

export function formatDate(dateString: any): string {
  const cleanDate = extractDate(dateString);
  if (!cleanDate) return "Sin fecha";
  
  const [year, month, day] = cleanDate.split("-");
  return `${day}-${month}-${year}`;
}

export function formatFriendlyDate(dateString: any): string {
  const cleanDate = extractDate(dateString);
  if (!cleanDate) return "Sin fecha";
  
  const [year, month, day] = cleanDate.split("-");
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"
  ];
  const monthName = months[parseInt(month, 10) - 1];
  return `${day} ${monthName}-${year}`;
}

export function calculateEndDate(startDateStr: any, plan: PlanType): string {
  const cleanStr = extractDate(startDateStr);
  if (!cleanStr) return "";
  
  const [year, month, day] = cleanStr.split("-").map(Number);
  const date = new Date(year, month - 1, day); // Usamos hora local, libre de bugs UTC
  
  const details = PLAN_DETAILS[plan];
  if (details?.durationDays) {
    date.setDate(date.getDate() + details.durationDays);
  } else if (details?.durationMonths) {
    date.setMonth(date.getMonth() + details.durationMonths);
  }

  const outYear = date.getFullYear();
  const outMonth = String(date.getMonth() + 1).padStart(2, '0');
  const outDay = String(date.getDate()).padStart(2, '0');
  
  return `${outYear}-${outMonth}-${outDay}`;
}

export function generateWhatsAppLink(member: { firstName: string; lastName: string; phone: string; startDate: string; endDate: string }) {
  const rawPhone = member.phone ? String(member.phone) : '';
  const phone = rawPhone.replace(/\D/g, '');
  
  const start = formatDate(member.startDate);
  const end = formatDate(member.endDate);

  const message = `¡Hola *${member.firstName} ${member.lastName}*! 🏋️‍♂️\n\nQueremos agradecerte por ser parte de *Forza Club*.\n\nTe recordamos los detalles de tu membresía:\n📅 *Fecha de inicio:* ${start}\n⏳ *Fecha de vencimiento:* ${end}\n\n¡Sigue dando lo mejor en tus entrenamientos! 💪`;
  
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function getDaysRemaining(endDateStr: any): number {
  const cleanDate = extractDate(endDateStr);
  if (!cleanDate) return 0;
  
  const [year, month, day] = cleanDate.split("-").map(Number);
  const endDate = new Date(year, month - 1, day);
  endDate.setHours(0, 0, 0, 0);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const diffTime = endDate.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}