// src/utils.ts
import { PlanType, PLAN_DETAILS } from './types';

// EXTRAE LA FECHA DE FORMA DIRECTA Y SEGURA
export function getSafeDateString(val: any): string {
    if (!val) return "";
    const str = String(val);
    
    const matchYMD = str.match(/(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (matchYMD) return `${matchYMD}-${matchYMD.padStart(2, '0')}-${matchYMD.padStart(2, '0')}`;
    
    const matchDMY = str.match(/(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (matchDMY) return `${matchDMY}-${matchDMY.padStart(2, '0')}-${matchDMY.padStart(2, '0')}`;
    
    return "";
}

export function formatDate(dateString: any): string {
    const clean = getSafeDateString(dateString);
    if (!clean) return "---";
    const [y, m, d] = clean.split("-");
    return `${d}-${m}-${y}`;
}

export function formatFriendlyDate(dateString: any): string {
    const clean = getSafeDateString(dateString);
    if (!clean) return "---";
    const [y, m, d] = clean.split("-");
    const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
    return `${d} ${months[parseInt(m, 10) - 1] || m}-${y}`;
}

export function calculateEndDate(startDateStr: any, planStr: any): string {
    let clean = getSafeDateString(startDateStr);
    
    // Si no hay fecha de inicio, forzamos la de hoy
    if (!clean) {
        const now = new Date();
        clean = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
    }

    try {
        const [y, m, d] = clean.split("-").map(Number);
        const date = new Date(y, m - 1, d);

        // Buscamos el plan.
        const details = PLAN_DETAILS[planStr as PlanType];
        
        // EL SEGURO DEFINITIVO: Si el plan no existe o está mal escrito, suma 1 mes por defecto.
        const addDays = details?.durationDays ? Number(details.durationDays) : 0;
        const addMonths = details?.durationMonths ? Number(details.durationMonths) : (!details && !addDays ? 1 : 0);

        if (addDays) date.setDate(date.getDate() + addDays);
        if (addMonths) date.setMonth(date.getMonth() + addMonths);

        const outY = date.getFullYear();
        const outM = String(date.getMonth() + 1).padStart(2, '0');
        const outD = String(date.getDate()).padStart(2, '0');

        return `${outY}-${outM}-${outD}`;
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
    const clean = getSafeDateString(endDateStr);
    if (!clean) return 0;

    const [y, m, d] = clean.split("-").map(Number);
    const endDate = new Date(y, m - 1, d);
    endDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const diff = endDate.getTime() - today.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}