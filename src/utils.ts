// src/utils.ts
import { PlanType, PLAN_DETAILS } from './types';

// EXTRACTOR DEFINITIVO: Extrae YYYY-MM-DD de objetos, arrays, fechas nativas o textos rotos.
export function normalizeDate(val: any): string {
  try {
    if (!val) return "";
    // Convierte CUALQUIER tipo de dato extraño de la base de datos a un texto plano
    const str = typeof val === 'string' ? val : JSON.stringify(val);
    
    // Busca a la fuerza el patrón de fecha: 4 números, guion/barra, 2 números, guion/barra, 2 números
    const match = str.match(/(\d{4})[-/](\d{2})[-/](\d{2})/);
    if (match) {
      return `${match}-${match}-${match}`; // Devuelve siempre YYYY-MM-DD limpio
    }
    return ""; 
  } catch (e) {
    return "";
  }
}

export function formatDate(dateString: any): string {
  const clean = normalizeDate(dateString);
  if (!clean) return "---"; // Si no hay fecha o está corrupta, muestra rayas

  const [year, month, day] = clean.split("-");
  return `${day}-${month}-${year}`;
}

export function formatFriendlyDate(dateString: any): string {
  const clean = normalizeDate(dateString);
  if (!clean) return "---"; // Si el cálculo falló, muestra rayas

  const [year, month, day] = clean.split("-");
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  
  const monthIndex = parseInt(month, 10) - 1;
  const monthName = months[monthIndex] || month; // Por si el mes es inválido
  
  return `${day} ${monthName}-${year}`;
}

export function calculateEndDate(startDateStr: any, plan: PlanType): string {
  const clean = normalizeDate(startDateStr);
  if (!clean) return "";

  try {
    const [year, month, day] = clean.split("-").map(Number);
    // Usamos new Date(año, mes, día) que respeta la zona horaria local perfectamente
    const date = new Date(year, month - 1, day);
    const details = PLAN_DETAILS[plan];

    if (details) {
      if (details.durationDays) {
        date.setDate(date.getDate() + details.durationDays);
      } else if (details.durationMonths) {
        date.setMonth(date.getMonth() + details.durationMonths);
      }
    }

    const outYear = date.getFullYear();
    const outMonth = String(date.getMonth() + 1).padStart(2, '0');
    const outDay = String(date.getDate()).padStart(2, '0');

    return `${outYear}-${outMonth}-${outDay}`;
  } catch (e) {
    return "";
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
  const clean = normalizeDate(endDateStr);
  if (!clean) return 0;

  try {
    const [year, month, day] = clean.split("-").map(Number);
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