// src/utils.ts
import { PlanType, PLAN_DETAILS } from './types';

// LIMPIADOR UNIVERSAL Y BLINDADO
export function normalizeDate(val: any): string {
  if (!val) return "";
  
  try {
    let str = "";
    if (val instanceof Date) {
      str = val.toISOString();
    } else if (Array.isArray(val)) {
      str = String(val);
    } else if (typeof val === 'object') {
      str = JSON.stringify(val);
    } else {
      str = String(val);
    }

    // Quitamos espacios extra que puedan confundir al sistema
    str = str.trim();

    // CASO 1: Formato YYYY-MM-DD (El más seguro)
    const matchYMD = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (matchYMD) return `${matchYMD}-${matchYMD.padStart(2, '0')}-${matchYMD.padStart(2, '0')}`;

    // CASO 2: Formato DD/MM/YYYY (Por si el navegador lo envía así)
    const matchDMY = str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (matchDMY) return `${matchDMY}-${matchDMY.padStart(2, '0')}-${matchDMY.padStart(2, '0')}`;

    return "";
  } catch (e) {
    return "";
  }
}

export function formatDate(dateString: any): string {
  const clean = normalizeDate(dateString);
  if (!clean) return "---";
  
  const [year, month, day] = clean.split("-");
  return `${day}-${month}-${year}`;
}

export function formatFriendlyDate(dateString: any): string {
  const clean = normalizeDate(dateString);
  if (!clean) return "---";
  
  const [year, month, day] = clean.split("-");
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  const monthName = months[parseInt(month, 10) - 1] || month;
  
  return `${day} ${monthName}-${year}`;
}

export function calculateEndDate(startDateStr: any, plan: PlanType): string {
  let clean = normalizeDate(startDateStr);
  
  // SEGURO ANTI-CRASH: Si no hay fecha válida, usamos la de HOY por defecto.
  // Esto evita que Supabase lance el Error 400.
  if (!clean) {
    const d = new Date();
    clean = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  try {
    const [year, month, day] = clean.split("-").map(Number);
    const date = new Date(year, month - 1, day); // Usamos hora local, 100% seguro
    const details = PLAN_DETAILS[plan];

    if (details) {
      if (details.durationDays) {
        date.setDate(date.getDate() + Number(details.durationDays));
      } 
      if (details.durationMonths) {
        date.setMonth(date.getMonth() + Number(details.durationMonths));
      }
    }

    const outYear = date.getFullYear();
    const outMonth = String(date.getMonth() + 1).padStart(2, '0');
    const outDay = String(date.getDate()).padStart(2, '0');

    if (isNaN(outYear)) return clean; // Si la matemática falla, devolvemos la de inicio

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