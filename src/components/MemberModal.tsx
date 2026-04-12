// src/components/MemberModal.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Calendar } from 'lucide-react';
import { Member, PlanType, PLAN_DETAILS } from '../types';
import { calculateEndDate } from '../utils';

interface MemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: Omit<Member, 'id'>) => void;
  initialData?: Member | null;
}

export default function MemberModal({ isOpen, onClose, onSave, initialData }: MemberModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    dni: '',
    phone: '',
    plan: '1_month' as PlanType,
    startDate: new Date().toISOString().split('T'),
  });

  // Estado para la fecha de fin calculada visualmente
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

  // Efecto para recalcular la fecha de fin cada vez que cambie el inicio o el plan
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
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2rem] shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center p-8 border-b border-zinc-800/50">
            <h2 className="text-xl font-black text-white uppercase tracking-tighter">
              {initialData ? 'Editar Miembro' : 'Nueva Matrícula'}
            </h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors p-2 hover:bg-zinc-800 rounded-full">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Nombres</label>
                <input
                  required
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-zinc-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Apellidos</label>
                <input
                  required
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-zinc-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">DNI</label>
                <input
                  required
                  type="text"
                  value={formData.dni}
                  onChange={(e) => setFormData({ ...formData, dni: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-zinc-500 transition-all outline-none"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Celular</label>
                <input
                  required
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-zinc-500 transition-all outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1">Plan Seleccionado</label>
              <select
                value={formData.plan}
                onChange={(e) => setFormData({ ...formData, plan: e.target.value as PlanType })}
                className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white focus:border-zinc-500 transition-all outline-none appearance-none"
              >
                {Object.entries(PLAN_DETAILS).map(([key, details]) => (
                  <option key={key} value={key}>
                    {details.label} - S/{details.price}
                  </option>
                ))}
              </select>
            </div>

            {/* SECCIÓN DE FECHAS CON CÁLCULO AUTOMÁTICO */}
            <div className="grid grid-cols-2 gap-4 bg-zinc-950/50 p-4 rounded-2xl border border-zinc-800/50">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Inicio
                </label>
                <input
                  required
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full bg-transparent text-white font-bold outline-none text-sm"
                />
              </div>
              <div className="space-y-1.5 border-l border-zinc-800 pl-4">
                <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Finalización</label>
                <div className="text-zinc-400 font-bold text-sm py-0.5">
                  {computedEndDate}
                </div>
                <input type="hidden" value={computedEndDate} />
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-3">
              <button
                type="submit"
                className="w-full py-4 bg-white text-black font-black uppercase text-sm rounded-2xl hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95"
              >
                {initialData ? 'Actualizar Datos' : 'Confirmar Matrícula'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest"
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