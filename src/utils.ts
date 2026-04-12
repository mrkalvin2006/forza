// src/utils.ts
import { PlanType, PLAN_DETAILS } from './types';

// ARMADURA: Transforma cualquier dato corrupto (arrays, nulos) en texto seguro
function safeString(val: any): string {
  if (!val) return "";
  // Si Supabase guardó un Array por error, extraemos solo la fecha (el primer valor)
  if (Array.isArray(val)) return String(val);
  return String(val);
}

export function formatDate(dateString: any): string {
  try {
    const safe = safeString(dateString);
    const clean = safe.split('T');
    const [year, month, day] = clean.split("-");
    if (!year || !month || !day) return "Sin fecha";
    return `${day}-${month}-${year}`;
  } catch (error) {
    return "Error";
  }
}

export function formatFriendlyDate(dateString: any): string {
  try {
    const safe = safeString(dateString);
    const clean = safe.split('T');
    const [year, month, day] = clean.split("-");
    if (!year || !month || !day) return "Sin fecha";
    
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    const monthName = months[parseInt(month, 10) - 1];
    return `${day} ${monthName}-${year}`;
  } catch (error) {
    return "Error";
  }
}

export function calculateEndDate(startDateStr: any, plan: PlanType): string {
  try {
    const safe = safeString(startDateStr);
    const clean = safe.split('T');
    if (!clean) return "";
    
    // Forzamos la lectura de la fecha para evitar desfases de zona horaria
    const [year, month, day] = clean.split("-").map(Number);
    const date = new Date(year, month - 1, day);
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
  } catch (error) {
    return "";
  }
}

export function generateWhatsAppLink(member: { firstName: string; lastName: string; phone: string; startDate: string; endDate: string }) {
  const phone = safeString(member.phone).replace(/\D/g, '');
  const start = formatFriendlyDate(member.startDate);
  const end = formatFriendlyDate(member.endDate);

  const message = `¡Hola *${member.firstName} ${member.lastName}*! 🏋️‍♂️\n\nQueremos agradecerte por ser parte de *Forza Club*.\n\nTe recordamos los detalles de tu membresía:\n📅 *Fecha de inicio:* ${start}\n⏳ *Fecha de vencimiento:* ${end}\n\n¡Sigue dando lo mejor en tus entrenamientos! 💪`;
  
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

export function getDaysRemaining(endDateStr: any): number {
  try {
    const safe = safeString(endDateStr);
    const cleanDate = safe.split('T');
    if (!cleanDate) return 0;
    
    const [year, month, day] = cleanDate.split("-").map(Number);
    const endDate = new Date(year, month - 1, day);
    endDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const diffTime = endDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch (error) {
    return 0;
  }
}