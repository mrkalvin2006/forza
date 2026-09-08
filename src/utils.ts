// src/utils.ts
import { PlanType, PLAN_DETAILS } from './types';

// LIMPIEZA ABSOLUTA SIN ENCADENAMIENTOS
export function cleanDate(val: any): string {
  if (!val) return "";
  
  // 1. Convertir a texto de forma segura
  let str = "";
  if (Array.isArray(val)) {
    str = String(val);
  } else {
    str = String(val);
  }
  
  // 2. Extraer solo la fecha sin encadenar métodos
  let datePart = str;
  if (datePart.includes('T')) {
    datePart = datePart.split('T');
  }
  if (datePart.includes(' ')) {
    datePart = datePart.split(' ');
  }
  
  return datePart.trim();
}

export function formatDate(dateString: any): string {
  const clean = cleanDate(dateString);
  if (!clean || !clean.includes('-')) return "---";
  
  const parts = clean.split("-");
  if (parts.length !== 3) return "---";
  
  return `${parts}-${parts}-${parts}`;
}

export function formatFriendlyDate(dateString: any): string {
  const clean = cleanDate(dateString);
  if (!clean || !clean.includes('-')) return "---";
  
  const parts = clean.split("-");
  if (parts.length !== 3) return "---";
  
  const [year, month, day] = parts;
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = months[monthIndex] || month;
  
  return `${day} ${monthName}-${year}`;
}

export function calculateEndDate(startDateStr: any, plan: PlanType): string {
  const clean = cleanDate(startDateStr);
  if (!clean) return "";

  try {
    const parts = clean.split("-");
    if (parts.length !== 3) return clean;

    const [year, month, day] = parts.map(Number);
    const date = new Date(year, month - 1, day);
    
    const details = PLAN_DETAILS[plan];
    if (details) {
      if (details.durationDays) date.setDate(date.getDate() + Number(details.durationDays));
      if (details.durationMonths) date.setMonth(date.getMonth() + Number(details.durationMonths));
    }

    const outYear = date.getFullYear();
    const outMonth = String(date.getMonth() + 1).padStart(2, '0');
    const outDay = String(date.getDate()).padStart(2, '0');

    return `${outYear}-${outMonth}-${outDay}`;
  } catch (e) {
    return clean;
  }
}

export function generateWhatsAppLink(member: any) {
  if (!member) return "";
  const phone = member.phone ? String(member.phone).replace(/\D/g, '') : '';
  const start = formatFriendlyDate(member.startDate);
  const end = formatFriendlyDate(member.endDate);

  const message = `¡Hola *${member.firstName || ''} ${member.lastName || ''}*! 🏋️‍♂️\n\nQueremos agradecerte por ser parte de *Forza Club*.\n\nTe recordamos los detalles de tu membresía:\n📅 *Fecha de inicio:* ${start}\n⏳ *Fecha de vencimiento:* ${end}\n\n¡Sigue dando lo mejor en tus entrenamientos! 💪`;
  
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function getDaysRemaining(endDateStr: any): number {
  const clean = cleanDate(endDateStr);
  if (!clean || !clean.includes('-')) return 0;

  try {
    const parts = clean.split("-");
    if (parts.length !== 3) return 0;

    const [year, month, day] = parts.map(Number);
    const endDate = new Date(year, month - 1, day);
    endDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch(e) {
    return 0;
  }
}
// --- Utilidades de Flujo de Caja (agrupar montos por día / semana / mes) ---

const MONTHS_ES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];

export function getTodayString(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// Devuelve la fecha (YYYY-MM-DD) del lunes de la semana a la que pertenece dateStr.
export function getWeekStart(dateStr: string): string {
  const clean = cleanDate(dateStr);
  const parts = clean.split('-');
  if (parts.length !== 3) return clean;
  const [y, m, d] = parts.map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export function getWeekLabel(weekStartStr: string): string {
  const parts = weekStartStr.split('-');
  if (parts.length !== 3) return weekStartStr;
  const [y, m, d] = parts.map(Number);
  const start = new Date(y, m - 1, d);
  const end = new Date(y, m - 1, d + 6);
  const mesInicio = MONTHS_ES[start.getMonth()];
  const mesFin = MONTHS_ES[end.getMonth()];
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} - ${end.getDate()} ${mesInicio}`;
  }
  return `${start.getDate()} ${mesInicio} - ${end.getDate()} ${mesFin}`;
}

export function getMonthLabel(monthKey: string): string {
  const parts = monthKey.split('-');
  if (parts.length !== 2) return monthKey;
  const [y, m] = parts.map(Number);
  return `${MONTHS_ES[m - 1]} ${y}`;
}
