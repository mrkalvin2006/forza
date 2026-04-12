// src/components/MemberModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CalendarDays, UserSquare2, ChevronsUpDown, ShieldAlert, PhoneForwarded } from 'lucide-react';
import { Member, PlanType, PLAN_DETAILS } from '../types';
import { calculateEndDate } from '../utils';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id'>) => void;
  initialData?: Member | null;
  allMembersNames?: string[]; // Array de nombres completos para 'predictivo'
}

export default function MemberModal({ isOpen, onClose, onSave, initialData, allMembersNames = [] }: MemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    plan: '1_month' as PlanType,
    startDate: new Date().toISOString().split('T'),
  });

  const [computedEndDate, setComputedEndDate] = useState('');

  useEffect(() => {
    if (initialData) {
      setFormData({
        firstName: initialData.firstName,
        lastName: initialData.lastName,
        dni: initialData.dni,
        phone: initialData.phone,
        plan: initialData.plan,
        startDate: initialData.startDate,
      });
    } else {
      setFormData({
        firstName: '',
        lastName: '',
        dni: '',
        phone: '',
        plan: '1_month',
        startDate: new Date().toISOString().split('T'),
      });
    }
  }, [initialData, isOpen]);

  useEffect(() => {
    const end = calculateEndDate(formData.startDate, formData.plan);
    setComputedEndDate(end);
  }, [formData.startDate, formData.plan]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, endDate: computedEndDate });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 30 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full max-w-lg bg-black/70 border border-zinc-800 rounded-[2.5rem] shadow-2xl overflow-hidden backdrop-blur-2xl"
        >
          {/* DESTELLO DORADO SUTIL EN LA PARTE SUPERIOR */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-1 bg-yellow-500 rounded-full blur-md opacity-50" />

          <div className="flex justify-between items-center p-8 border-b border-zinc-800/50">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <UserSquare2 className="text-yellow-500" size={24} />
              {initialData ? 'Actualizar Miembro VIP' : 'Nueva Matrícula VIP'}
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800/50 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            
            {/* SECCIÓN DATOS PERSONALES */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-yellow-500 pl-3">
                <h3 className="text-sm font-black text-yellow-500 uppercase tracking-widest">Datos Personales</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nombres</label>
                  <input
                    required
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:border-yellow-500/50 transition-all outline-none"
                    placeholder="Ej. Juan"
                  />
                </div>
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Apellidos</label>
                  <input
                    required
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:border-yellow-500/50 transition-all outline-none"
                    placeholder="Ej. Pérez"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">DNI</label>
                  <div className="absolute left-4 top-10 text-zinc-600">Nº</div>
                  <input
                    required
                    type="text"
                    pattern="[0-9]{8}" // DNI de 8 dígitos
                    maxLength={8}
                    value={formData.dni}
                    onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                    className="w-full pl-10 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:border-yellow-500/50 transition-all outline-none font-mono"
                    placeholder="8 dígitos"
                  />
                </div>
                <div className="space-y-1.5 relative">
                  <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Celular</label>
                  <PhoneForwarded className="absolute left-4 top-9.5 text-zinc-600" size={16} />
                  <input
                    required
                    type="tel"
                    pattern="[0-9]{9}" // Celular de 9 dígitos
                    maxLength={9}
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full pl-11 pr-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:border-yellow-500/50 transition-all outline-none"
                    placeholder="Ej. 987..."
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN PLAN Y FECHAS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest">Plan y Fechas</h3>
              </div>

              <div className="space-y-1.5 relative">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Plan Seleccionado</label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value as PlanType })}
                  className="w-full px-4 py-3.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white focus:border-emerald-500/50 transition-all outline-none appearance-none cursor-pointer"
                >
                  {Object.entries(PLAN_DETAILS).map(([key, details]) => (
                    <option key={key} value={key} className="bg-zinc-900">
                      {details.label} → S/{details.price}
                    </option>
                  ))}
                </select>
                <ChevronsUpDown className="absolute right-4 top-9.5 text-zinc-600 pointer-events-none" size={18} />
              </div>

              <div className="grid grid-cols-2 gap-4 bg-zinc-950/70 p-5 rounded-2xl border border-zinc-800/50">
                <div className="space-y-1.5 relative group">
                  <label className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays size={14} /> Fecha de Inicio
                  </label>
                  {/* INPUT DATE AMIGABLE: Abre calendario nativo */}
                  <input
                    required
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full bg-transparent text-white font-bold outline-none text-sm cursor-pointer"
                  />
                </div>
                <div className="space-y-1.5 border-l border-zinc-800 pl-4 relative">
                  <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Finalización (Auto)</label>
                  <div className="text-zinc-300 font-black text-sm py-0.5 tracking-tighter">
                    {computedEndDate}
                  </div>
                  <CalendarDays size={14} className="absolute right-0 top-0.5 text-zinc-800" />
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="submit"
                className="w-full py-4.5 bg-white text-black font-black uppercase text-sm rounded-2xl hover:bg-yellow-500 hover:text-white transition-all shadow-[0_0_30px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(234,179,8,0.3)] active:scale-95 flex items-center justify-center gap-3"
              >
                <UserSquare2 size={20} />
                {initialData ? 'Actualizar Miembro' : 'Confirmar Matrícula VIP'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 text-zinc-500 hover:text-zinc-300 transition-colors text-xs font-bold uppercase tracking-widest"
              >
                Cancelar
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}