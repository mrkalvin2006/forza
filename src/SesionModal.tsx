// src/components/SesionModal.tsx
import React, { useState } from 'react';
import { X, Zap, DollarSign, Loader2, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { getTodayString } from '../utils';

interface SesionModalProps {
  onClose: () => void;
  onSaved: () => void;
}

export default function SesionModal({ onClose, onSaved }: SesionModalProps) {
  const [description, setDescription] = useState('SESIÓN LIBRE');
  const [amount, setAmount] = useState('');
  const [sessionDate, setSessionDate] = useState(getTodayString());
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setError('Ingresa un monto válido.');
      return;
    }
    setIsSaving(true);
    setError('');

    try {
      const { error: dbError } = await supabase
        .from('sesiones_libres')
        .insert({
          description: description.trim() || 'SESIÓN LIBRE',
          amount: Number(amount),
          session_date: sessionDate,
        });

      if (dbError) throw dbError;

      setSaved(true);
      setTimeout(() => {
        onSaved();
        onClose();
      }, 1200);
    } catch (err: any) {
      setError(err.message || 'Error al guardar la sesión.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-7 pt-7 pb-5 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/20 flex items-center justify-center">
              <Zap className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-white font-black text-lg leading-tight">Sesión Libre</h2>
              <p className="text-zinc-500 text-xs">Registro de ingreso puntual</p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-600 hover:text-white transition-colors p-1">
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSave} className="px-7 py-6 flex flex-col gap-5">
          {/* Descripción */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Descripción</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white font-semibold outline-none focus:border-purple-500/50 transition-all"
              placeholder="SESIÓN LIBRE"
            />
          </div>

          {/* Fecha */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Fecha</label>
            <input
              type="date"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-2xl px-4 py-3.5 text-white font-semibold outline-none focus:border-purple-500/50 transition-all"
            />
          </div>

          {/* Monto */}
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Monto (S/)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="number"
                min="0"
                step="0.50"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl pl-10 pr-4 py-3.5 text-white font-black text-xl outline-none focus:border-purple-500/50 transition-all"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {error && (
            <p className="text-red-400 text-xs font-bold bg-red-500/10 py-2 px-3 rounded-xl border border-red-500/20">
              {error}
            </p>
          )}

          {/* Botones */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3.5 rounded-2xl border border-zinc-800 text-zinc-400 font-bold text-sm hover:bg-zinc-900 transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || saved}
              className="flex-1 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-60"
            >
              <AnimatePresence mode="wait">
                {saved ? (
                  <motion.span key="ok" initial={{ scale: 0 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                    <CheckCircle2 size={18} /> ¡Guardado!
                  </motion.span>
                ) : isSaving ? (
                  <motion.span key="loading" className="flex items-center gap-2">
                    <Loader2 className="animate-spin" size={18} /> Guardando...
                  </motion.span>
                ) : (
                  <motion.span key="idle" className="flex items-center gap-2">
                    <Zap size={18} /> Registrar Sesión
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
