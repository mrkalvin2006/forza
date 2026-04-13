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