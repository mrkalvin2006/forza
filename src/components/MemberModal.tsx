// src/components/MemberModal.tsx
// Modal para crear una Nueva Matrícula: busca al alumno por celular (o lo crea si no existe)
// y luego registra la matrícula (plan + fechas) asociada a ese alumno.
// Único dato obligatorio del alumno: el nombre. Apellido y celular son opcionales.
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CalendarDays, UserSquare2, ChevronsUpDown, PhoneForwarded, CheckCircle2 } from 'lucide-react';
import { PlanType, PLAN_DETAILS } from '../types';
import { calculateEndDate, formatFriendlyDate, getTodayString } from '../utils';
import { supabase } from '../supabase';

const initialPlan = Object.keys(PLAN_DETAILS)[0] as PlanType;

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  // Si se abre desde la fila de un alumno existente ("Nueva matrícula para este alumno"),
  // se pasa su id y datos para precargar el formulario y saltar la búsqueda por celular.
  // Opcionalmente trae el último plan/monto usados, para sugerir una renovación rápida.
  preselectedAlumno?: {
    id: string;
    firstName: string;
    lastName: string | null;
    phone: string | null;
    lastPlan?: PlanType | null;
    lastAmount?: number | null;
  } | null;
}

export default function MemberModal({ isOpen, onClose, onSaved, preselectedAlumno }: MemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    plan: initialPlan,
    startDate: getTodayString(),
    amount: PLAN_DETAILS[initialPlan].price,
  });
  const [amountTouched, setAmountTouched] = useState(false);
  const [computedEndDate, setComputedEndDate] = useState('');
  const [foundAlumnoId, setFoundAlumnoId] = useState<string | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAmountTouched(false);
    if (preselectedAlumno) {
      const plan = preselectedAlumno.lastPlan || initialPlan;
      setFormData({
        firstName: preselectedAlumno.firstName,
        lastName: preselectedAlumno.lastName || '',
        phone: preselectedAlumno.phone || '',
        plan,
        startDate: getTodayString(),
        amount: preselectedAlumno.lastAmount ?? PLAN_DETAILS[plan].price,
      });
      setFoundAlumnoId(preselectedAlumno.id);
    } else {
      setFormData({ firstName: '', lastName: '', phone: '', plan: initialPlan, startDate: getTodayString(), amount: PLAN_DETAILS[initialPlan].price });
      setFoundAlumnoId(null);
    }
  }, [isOpen, preselectedAlumno]);

  // Si el usuario no ha tocado el monto a mano, lo sugerimos automáticamente al cambiar de plan.
  useEffect(() => {
    if (!amountTouched) {
      setFormData((prev) => ({ ...prev, amount: PLAN_DETAILS[prev.plan].price }));
    }
  }, [formData.plan]);

  useEffect(() => {
    const end = calculateEndDate(formData.startDate, formData.plan);
    setComputedEndDate(end);
  }, [formData.startDate, formData.plan]);

  // Al salir del campo Celular (y si no venimos de un alumno preseleccionado), buscamos si ya existe.
  const handlePhoneBlur = async () => {
    if (preselectedAlumno) return;
    const phone = formData.phone.trim();
    if (!phone) {
      setFoundAlumnoId(null);
      return;
    }
    setCheckingPhone(true);
    const { data } = await supabase.from('alumnos').select('*').eq('phone', phone).maybeSingle();
    setCheckingPhone(false);
    if (data) {
      setFoundAlumnoId(data.id);
      setFormData((prev) => ({ ...prev, firstName: data.first_name, lastName: data.last_name || '' }));
    } else {
      setFoundAlumnoId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let alumnoId = foundAlumnoId;

      if (!alumnoId) {
        // Crear alumno nuevo (solo el nombre es obligatorio)
        const { data: newAlumno, error: alumnoError } = await supabase
          .from('alumnos')
          .insert([{
            first_name: formData.firstName,
            last_name: formData.lastName.trim() || null,
            phone: formData.phone.trim() || null,
          }])
          .select()
          .single();
        if (alumnoError) throw alumnoError;
        alumnoId = newAlumno.id;
      }

      const { error: matriculaError } = await supabase.from('matriculas').insert([
        { alumno_id: alumnoId, plan: formData.plan, start_date: formData.startDate, end_date: computedEndDate, amount: formData.amount },
      ]);
      if (matriculaError) throw matriculaError;

      onSaved();
      onClose();
    } catch (err) {
      console.error('Error guardando matrícula:', err);
      alert('No se pudo guardar la matrícula. Revisa los datos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          className="relative w-full max-w-lg bg-black/70 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-2xl"
        >
          <div className="flex justify-between items-center p-8 border-b border-zinc-800/50">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <UserSquare2 className="text-yellow-500" size={24} />
              Nueva Matrícula
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-yellow-500 pl-3">
                <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest">Datos del Alumno</h3>
              </div>

              <div>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  disabled={!!foundAlumnoId}
                  className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none disabled:opacity-60"
                  placeholder="Nombre *"
                />
              </div>
              <div>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={!!foundAlumnoId}
                  className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none disabled:opacity-60"
                  placeholder="Apellido (opcional)"
                />
              </div>
              <div>
                <div className="relative">
                  <PhoneForwarded className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                  <input
                    type="tel"
                    maxLength={9}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    onBlur={handlePhoneBlur}
                    disabled={!!preselectedAlumno}
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none disabled:opacity-60"
                    placeholder="Celular (opcional)"
                  />
                </div>
                {checkingPhone && <p className="text-xs text-zinc-500 mt-1 ml-1">Buscando...</p>}
                {foundAlumnoId && !preselectedAlumno && (
                  <p className="text-xs text-emerald-400 mt-1 ml-1 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Alumno existente encontrado — se agregará una nueva matrícula
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest">Plan y Fechas</h3>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">1. Fecha de Inicio</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                  <input required type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:border-emerald-500/50 transition-all outline-none cursor-pointer [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">2. Plan Seleccionado</label>
                <div className="relative">
                  <select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value as PlanType })} className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:border-yellow-500/50 transition-all outline-none appearance-none cursor-pointer font-bold">
                    {Object.entries(PLAN_DETAILS).map(([key, details]) => (
                      <option key={key} value={key}>{details.label} — S/{details.price}</option>
                    ))}
                  </select>
                  <ChevronsUpDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">3. Monto Cobrado (S/) — editable para tarifas especiales</label>
                <input
                  required
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => { setAmountTouched(true); setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 }); }}
                  className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-yellow-500/50 transition-all font-bold"
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">4. Finalización (Automático)</label>
                <div className="w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 font-black flex justify-between items-center opacity-70">
                  <span>{formatFriendlyDate(computedEndDate)}</span>
                  <CalendarDays size={18} className="text-zinc-700" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving} className="w-full py-4.5 bg-white text-black font-black uppercase text-sm rounded-2xl hover:bg-yellow-500 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">
              <UserSquare2 size={20} />
              {saving ? 'Guardando...' : 'Confirmar Matrícula'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
