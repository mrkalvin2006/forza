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
  const [savedData, setSavedData] = useState<{ phone: string; startDate: string; endDate: string; firstName: string } | null>(null);
  // Sugerencias de nombre
  const [nameSuggestions, setNameSuggestions] = useState<{ id: string; firstName: string; lastName: string | null; phone: string | null; dni: string | null }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSavedData(null);
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
      // Si tiene celular, guardamos los datos para mostrar el botón de WhatsApp
      if (formData.phone.trim()) {
        setSavedData({ phone: formData.phone.trim(), startDate: formData.startDate, endDate: computedEndDate, firstName: formData.firstName });
      } else {
        onClose();
      }
    } catch (err) {
      console.error('Error guardando matrícula:', err);
      alert('No se pudo guardar la matrícula. Revisa los datos e intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen && !savedData) return null;

  // Pantalla de éxito con botón de WhatsApp
  if (savedData) {
    const msg = `Hola ${savedData.firstName}! 👋 Te recordamos que tu plan en *Forza Gym Club* inició el *${formatFriendlyDate(savedData.startDate)}* y finaliza el *${formatFriendlyDate(savedData.endDate)}*.\n\nAtt. ForzaGymClub\n_Cada día es un nuevo comienzo!_ ¡Te esperamos! 💪`;
    const waUrl = `https://wa.me/51${savedData.phone.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`;
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div initial={{opacity:0,scale:0.9,y:20}} animate={{opacity:1,scale:1,y:0}}
          className="w-full max-w-sm bg-black/90 border border-zinc-800 rounded-[2.5rem] p-8 shadow-2xl backdrop-blur-2xl text-center space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-black text-white uppercase">¡Matrícula registrada!</h2>
            <p className="text-sm text-zinc-400">¿Deseas enviar un mensaje de confirmación a <strong className="text-white">{savedData.firstName}</strong>?</p>
          </div>
          <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-4 text-left text-xs text-zinc-400 leading-relaxed">
            Hola {savedData.firstName}! 👋 Tu plan inició el <span className="text-white">{formatFriendlyDate(savedData.startDate)}</span> y finaliza el <span className="text-white">{formatFriendlyDate(savedData.endDate)}</span>.{' '}
            Att. ForzaGymClub — ¡Cada día es un nuevo comienzo! 💪
          </div>
          <div className="flex flex-col gap-3">
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="w-full py-4 bg-[#25D366] text-white font-black uppercase text-sm rounded-2xl hover:bg-[#20BA5A] transition-all flex items-center justify-center gap-2 active:scale-95">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              Enviar por WhatsApp
            </a>
            <button onClick={() => { setSavedData(null); onClose(); }}
              className="w-full py-3 text-zinc-500 hover:text-white text-xs font-bold uppercase bg-zinc-800/50 rounded-xl transition-all">
              Omitir y cerrar
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

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
