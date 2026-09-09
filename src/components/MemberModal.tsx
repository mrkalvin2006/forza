// src/components/MemberModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CalendarDays, UserSquare2, ChevronsUpDown, PhoneForwarded, CheckCircle2, FileText, Hash } from 'lucide-react';
import { PlanType, PLAN_DETAILS } from '../types';
import { calculateEndDate, formatFriendlyDate, getTodayString } from '../utils';
import { supabase } from '../supabase';

const initialPlan = Object.keys(PLAN_DETAILS)[0] as PlanType;

interface PreselectedAlumno {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  dni: string | null;
  lastPlan?: PlanType | null;
  lastAmount?: number | null;
}

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  // Punto 5: si viene preseleccionado, abre en modo "editar matrícula" NO añadir
  preselectedAlumno?: PreselectedAlumno | null;
}

const emptyForm = () => ({
  firstName: '',
  lastName: '',
  dni: '',
  phone: '',
  plan: initialPlan as PlanType,
  startDate: getTodayString(),
  amount: PLAN_DETAILS[initialPlan].price,
  observation: '',
});

export default function MemberModal({ isOpen, onClose, onSaved, preselectedAlumno }: MemberModalProps) {
  const [formData, setFormData] = useState(emptyForm());
  const [amountTouched, setAmountTouched] = useState(false);
  const [computedEndDate, setComputedEndDate] = useState('');
  const [foundAlumnoId, setFoundAlumnoId] = useState<string | null>(null);
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [saving, setSaving] = useState(false);
  // Sugerencias de nombre
  const [nameSuggestions, setNameSuggestions] = useState<{ id: string; firstName: string; lastName: string | null; phone: string | null; dni: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setAmountTouched(false);
    if (preselectedAlumno) {
      const plan = preselectedAlumno.lastPlan || initialPlan;
      setFormData({
        firstName: preselectedAlumno.firstName,
        lastName: preselectedAlumno.lastName || '',
        dni: preselectedAlumno.dni || '',
        phone: preselectedAlumno.phone || '',
        plan,
        startDate: getTodayString(),
        amount: preselectedAlumno.lastAmount ?? PLAN_DETAILS[plan].price,
        observation: '',
      });
      setFoundAlumnoId(preselectedAlumno.id);
    } else {
      setFormData(emptyForm());
      setFoundAlumnoId(null);
    }
  }, [isOpen, preselectedAlumno]);

  // Auto-sugiere precio del plan si el usuario no tocó el monto
  useEffect(() => {
    if (!amountTouched) {
      setFormData((prev) => ({ ...prev, amount: PLAN_DETAILS[prev.plan].price }));
    }
  }, [formData.plan]);

  useEffect(() => {
    setComputedEndDate(calculateEndDate(formData.startDate, formData.plan));
  }, [formData.startDate, formData.plan]);

  // Busca sugerencias de alumno por nombre (mínimo 2 caracteres)
  const handleNameChange = async (val: string) => {
    setFormData((prev) => ({ ...prev, firstName: val }));
    if (preselectedAlumno || foundAlumnoId) return;
    if (val.trim().length < 2) { setNameSuggestions([]); setShowSuggestions(false); return; }
    const { data } = await supabase
      .from('alumnos')
      .select('id, first_name, last_name, phone, dni')
      .ilike('first_name', `%${val.trim()}%`)
      .limit(6);
    if (data && data.length > 0) {
      setNameSuggestions(data.map((d: any) => ({ id: d.id, firstName: d.first_name, lastName: d.last_name, phone: d.phone, dni: d.dni })));
      setShowSuggestions(true);
    } else {
      setNameSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Al seleccionar una sugerencia, precarga todos los datos del alumno
  const selectSuggestion = (s: typeof nameSuggestions[0]) => {
    setFoundAlumnoId(s.id);
    setFormData((prev) => ({ ...prev, firstName: s.firstName, lastName: s.lastName || '', phone: s.phone || '', dni: s.dni || '' }));
    setNameSuggestions([]);
    setShowSuggestions(false);
  };

  // Busca alumno existente por celular al salir del campo
  const handlePhoneBlur = async () => {
    if (preselectedAlumno) return;
    const phone = formData.phone.trim();
    if (!phone) { setFoundAlumnoId(null); return; }
    setCheckingPhone(true);
    const { data } = await supabase.from('alumnos').select('*').eq('phone', phone).maybeSingle();
    setCheckingPhone(false);
    if (data) {
      setFoundAlumnoId(data.id);
      setFormData((prev) => ({ ...prev, firstName: data.first_name, lastName: data.last_name || '', dni: data.dni || '' }));
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
        const { data: newAlumno, error } = await supabase
          .from('alumnos')
          .insert([{
            first_name: formData.firstName,
            last_name: formData.lastName.trim() || null,
            dni: formData.dni.trim() || null,
            phone: formData.phone.trim() || null,
          }])
          .select().single();
        if (error) throw error;
        alumnoId = newAlumno.id;
      }

      const { error: mErr } = await supabase.from('matriculas').insert([{
        alumno_id: alumnoId,
        plan: formData.plan,
        start_date: formData.startDate,
        end_date: computedEndDate,
        amount: formData.amount,
        observation: formData.observation.trim() || null,
      }]);
      if (mErr) throw mErr;

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
          className="relative w-full max-w-lg bg-black/70 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="flex justify-between items-center p-8 border-b border-zinc-800/50 sticky top-0 bg-black/80 backdrop-blur-xl z-10">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <UserSquare2 className="text-yellow-500" size={24} />
              {preselectedAlumno ? 'Nueva Matrícula' : 'Registrar Matrícula'}
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* DATOS DEL ALUMNO */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-yellow-500 pl-3">
                <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest">Datos del Alumno</h3>
              </div>

              {/* Nombre (obligatorio) */}
              <div className="relative">
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  onFocus={() => nameSuggestions.length > 0 && setShowSuggestions(true)}
                  disabled={!!foundAlumnoId}
                  className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none disabled:opacity-60 focus:border-yellow-500/50 transition-all"
                  placeholder="Nombre *"
                  autoComplete="off"
                />
                {/* Dropdown de sugerencias */}
                {showSuggestions && nameSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-zinc-900 border border-zinc-700 rounded-xl overflow-hidden shadow-2xl">
                    {nameSuggestions.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onMouseDown={() => selectSuggestion(s)}
                        className="w-full px-4 py-3 text-left hover:bg-zinc-800 transition-colors flex items-center justify-between gap-2 border-b border-zinc-800/50 last:border-0"
                      >
                        <span className="text-white font-bold text-sm">{s.firstName} {s.lastName || ''}</span>
                        <span className="text-zinc-500 text-xs">{s.phone || s.dni || ''}</span>
                      </button>
                    ))}
                  </div>
                )}
                {foundAlumnoId && !preselectedAlumno && (
                  <p className="text-xs text-emerald-400 mt-1 ml-1 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Alumno encontrado — se agregará matrícula nueva
                  </p>
                )}
              </div>

              {/* Apellido (opcional) */}
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={!!foundAlumnoId}
                className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none disabled:opacity-60 focus:border-yellow-500/50 transition-all"
                placeholder="Apellido (opcional)"
              />

              {/* DNI — Punto 7: de vuelta, opcional */}
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                <input
                  type="text"
                  maxLength={8}
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  disabled={!!foundAlumnoId}
                  className="w-full pl-11 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none disabled:opacity-60 focus:border-yellow-500/50 transition-all"
                  placeholder="DNI (opcional)"
                />
              </div>

              {/* Celular (opcional, búsqueda) */}
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
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none disabled:opacity-60 focus:border-yellow-500/50 transition-all"
                    placeholder="Celular (opcional)"
                  />
                </div>
                {checkingPhone && <p className="text-xs text-zinc-500 mt-1 ml-1">Buscando...</p>}
              </div>
            </div>

            {/* PLAN Y FECHAS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest">Plan y Fechas</h3>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">1. Fecha de Inicio</label>
                <div className="relative">
                  <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
                  <input required type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full pl-12 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:border-emerald-500/50 transition-all outline-none cursor-pointer [color-scheme:dark]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">2. Plan</label>
                <div className="relative">
                  <select value={formData.plan} onChange={(e) => setFormData({ ...formData, plan: e.target.value as PlanType })}
                    className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:border-yellow-500/50 transition-all outline-none appearance-none cursor-pointer font-bold">
                    {Object.entries(PLAN_DETAILS).map(([key, d]) => (
                      <option key={key} value={key}>{d.label} — S/{d.price}</option>
                    ))}
                  </select>
                  <ChevronsUpDown className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" size={18} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">3. Monto Cobrado S/ — editable para descuentos</label>
                <input required type="number" min="0" step="0.01" value={formData.amount}
                  onChange={(e) => { setAmountTouched(true); setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 }); }}
                  className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-yellow-500/50 transition-all font-bold"
                  placeholder="0.00" />
              </div>

              {/* Punto 3: Observación / motivo de descuento */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">4. Observación (descuento, motivo, etc.)</label>
                <div className="relative">
                  <FileText className="absolute left-4 top-4 text-zinc-600" size={16} />
                  <textarea
                    value={formData.observation}
                    onChange={(e) => setFormData({ ...formData, observation: e.target.value })}
                    rows={2}
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-yellow-500/50 transition-all resize-none"
                    placeholder="Ej: Descuento familiar, promo lanzamiento... (opcional)"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">5. Finalización (Automático)</label>
                <div className="w-full px-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-400 font-black flex justify-between items-center opacity-70">
                  <span>{formatFriendlyDate(computedEndDate)}</span>
                  <CalendarDays size={18} className="text-zinc-700" />
                </div>
              </div>
            </div>

            <button type="submit" disabled={saving}
              className="w-full py-4 bg-white text-black font-black uppercase text-sm rounded-2xl hover:bg-yellow-500 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50">
              <UserSquare2 size={20} />
              {saving ? 'Guardando...' : 'Confirmar Matrícula'}
            </button>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
