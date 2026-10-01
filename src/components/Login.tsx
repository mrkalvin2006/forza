// src/components/Login.tsx
import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '../supabase';
import { UserRole } from '../types';
import ForzaLogo from '../assets/logo-forza.png';
import GymBackground from '../assets/gym-background.png';

type LoginMode = 'admin' | 'asesor';

function AsesorIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {/* Person silhouette */}
      <circle cx="10" cy="7" r="3.5" />
      <path d="M3 21v-1a7 7 0 0 1 12.93-3" />
      {/* Star badge — top right */}
      <polygon
        points="19,2 20.09,5.26 23.5,5.27 20.9,7.14 21.82,10.5 19,8.77 16.18,10.5 17.1,7.14 14.5,5.27 17.91,5.26"
        fill="currentColor"
        stroke="currentColor"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Login({ onLogin }: { onLogin: (role: UserRole) => void }) {
  const [mode, setMode] = useState<LoginMode>('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    try {
      const { data, error: dbError } = await supabase
        .from('forza_users')
        .select('*')
        .eq('username', mode)
        .eq('password', password.trim())
        .maybeSingle();

      if (dbError) throw dbError;
      if (!data) {
        setError(true);
      } else {
        onLogin(data.role as UserRole);
      }
    } catch (err) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black"
      style={{ backgroundImage: `url(${GymBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />

      {/* CONTENEDOR DE LUZ PERIMETRAL */}
      <div className="relative p-[3px] rounded-[2.6rem] overflow-hidden flex items-center justify-center">
        {/* LUZ RECORRIENDO EL BORDE — cambia de color según el modo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
          style={{ width: '210%', height: '210%', position: 'absolute' }}
          className={`z-0 transition-none ${
            mode === 'admin'
              ? 'bg-[conic-gradient(from_0deg,transparent_0deg,transparent_150deg,#EAB308_180deg,transparent_210deg,transparent_360deg)]'
              : 'bg-[conic-gradient(from_0deg,transparent_0deg,transparent_150deg,#3B82F6_180deg,transparent_210deg,transparent_360deg)]'
          }`}
        />

        {/* VENTANA DE LOGIN */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md p-10 bg-black/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        >
          <div className="flex flex-col items-center gap-8">
            {/* LOGO */}
            <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="relative">
              <div
                className={`absolute inset-0 blur-[40px] rounded-full scale-150 transition-colors duration-500 ${
                  mode === 'admin' ? 'bg-yellow-500/10' : 'bg-blue-500/10'
                }`}
              />
              <img
                src={ForzaLogo}
                alt="Logo Forza"
                className="max-h-40 w-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10"
              />
            </motion.div>

            {/* SELECTOR DE ROL */}
            <div className="w-full flex flex-col gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-[0.3em]">
                Ingresar como
              </label>

              <div className="grid grid-cols-2 gap-3">
                {/* ADMIN */}
                <button
                  type="button"
                  onClick={() => { setMode('admin'); setPassword(''); setError(false); }}
                  className={`relative flex flex-col items-center gap-2.5 px-4 py-5 rounded-2xl border font-bold text-sm transition-all overflow-hidden ${
                    mode === 'admin'
                      ? 'bg-yellow-500/15 border-yellow-500 text-yellow-400'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {mode === 'admin' && (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(234,179,8,0.1),transparent_70%)]" />
                  )}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center relative z-10 transition-colors ${
                      mode === 'admin' ? 'bg-yellow-500/20' : 'bg-zinc-800'
                    }`}
                  >
                    <ShieldCheck size={22} className={mode === 'admin' ? 'text-yellow-400' : 'text-zinc-500'} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest relative z-10">Admin</span>
                  {mode === 'admin' && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-yellow-400 shadow-[0_0_8px_rgba(234,179,8,0.9)]" />
                  )}
                </button>

                {/* ASESOR */}
                <button
                  type="button"
                  onClick={() => { setMode('asesor'); setPassword(''); setError(false); }}
                  className={`relative flex flex-col items-center gap-2.5 px-4 py-5 rounded-2xl border font-bold text-sm transition-all overflow-hidden ${
                    mode === 'asesor'
                      ? 'bg-blue-500/15 border-blue-500 text-blue-400'
                      : 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300'
                  }`}
                >
                  {mode === 'asesor' && (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.1),transparent_70%)]" />
                  )}
                  <div
                    className={`w-11 h-11 rounded-xl flex items-center justify-center relative z-10 transition-colors ${
                      mode === 'asesor' ? 'bg-blue-500/20' : 'bg-zinc-800'
                    }`}
                  >
                    <AsesorIcon size={22} />
                  </div>
                  <span className="text-[11px] font-black uppercase tracking-widest relative z-10">Asesor</span>
                  {mode === 'asesor' && (
                    <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.9)]" />
                  )}
                </button>
              </div>

              {/* BADGE DESCRIPTIVO */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={mode}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.18 }}
                  className={`text-[10px] font-semibold px-3 py-1.5 rounded-xl mt-1 ${
                    mode === 'admin'
                      ? 'bg-yellow-500/10 text-yellow-500/80 border border-yellow-500/20'
                      : 'bg-blue-500/10 text-blue-400/80 border border-blue-500/20'
                  }`}
                >
                  {mode === 'admin'
                    ? '🔐 Acceso completo · Alumnos, Matrículas, Caja'
                    : '🎯 Acceso limitado · Solo registrar matrículas y sesiones'}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* FORMULARIO */}
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
              <div className="relative group">
                <Lock
                  className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${
                    mode === 'admin'
                      ? 'text-zinc-600 group-focus-within:text-yellow-500'
                      : 'text-zinc-600 group-focus-within:text-blue-400'
                  }`}
                  size={20}
                />
                <input
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-12 py-4 text-white outline-none transition-all font-medium ${
                    mode === 'admin' ? 'focus:border-yellow-500/50' : 'focus:border-blue-500/50'
                  }`}
                  placeholder="Contraseña"
                  required
                />
              </div>

              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-red-400 text-center text-xs font-bold bg-red-500/10 py-2 rounded-xl border border-red-500/20"
                  >
                    Acceso denegado. Revisa tu contraseña.
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                disabled={isLoading}
                type="submit"
                className={`w-full py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${
                  mode === 'admin'
                    ? 'bg-white text-black hover:bg-yellow-500 hover:text-white shadow-[0_0_20px_rgba(255,255,255,0.1)]'
                    : 'bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="animate-spin" size={24} />
                ) : (
                  <>
                    {mode === 'admin' ? 'INGRESAR AL SISTEMA' : 'ENTRAR COMO ASESOR'}
                    <ArrowRight size={20} />
                  </>
                )}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
