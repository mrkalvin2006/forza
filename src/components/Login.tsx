// src/components/Login.tsx
import React, { useState } from 'react';
import { Lock, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabase';
import ForzaLogo from '../assets/logo-forza.png';
import GymBackground from '../assets/gym-background.png';

// Usuario fijo: la app siempre inicia sesión como este usuario administrativo.
const FIXED_USERNAME = 'admin';

export default function Login({ onLogin }: { onLogin: () => void }) {
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
        .eq('username', FIXED_USERNAME)
        .eq('password', password.trim())
        .maybeSingle();

      if (dbError) throw dbError;
      if (!data) {
        setError(true);
      } else {
        onLogin();
      }
    } catch (err) {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black"
         style={{ backgroundImage: `url(${GymBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]" />
      
      {/* CONTENEDOR DE LUZ DORADA PERIMETRAL */}
      <div className="relative p-[3px] rounded-[2.6rem] overflow-hidden flex items-center justify-center">
        {/* LUZ DORADA RECORRIENDO EL BORDE */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          style={{ width: '210%', height: '210%', position: 'absolute' }}
          className="z-0 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_150deg,#EAB308_180deg,transparent_210deg,transparent_360deg)]"
        />

        {/* VENTANA DE LOGIN NEGRO GLASS */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }} 
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 w-full max-w-md p-10 bg-black/90 backdrop-blur-3xl rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.8)]"
        >
          <div className="flex flex-col items-center gap-10">
            {/* LOGO */}
            <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="relative">
              <div className="absolute inset-0 bg-yellow-500/10 blur-[40px] rounded-full scale-150" />
              <img 
                src={ForzaLogo} 
                alt="Logo Forza" 
                className="max-h-40 w-auto drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] relative z-10" 
              />
            </motion.div>

            {/* BOTÓN / TARJETA DE USUARIO FIJO (no editable) */}
            <div className="w-full flex flex-col items-center gap-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-[0.3em] self-start">Gestión Administrativa</label>
              <div className="w-full flex items-center gap-3 bg-zinc-900/80 border border-yellow-500/30 rounded-2xl px-4 py-4">
                <div className="w-9 h-9 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <ShieldCheck className="text-yellow-500" size={18} />
                </div>
                <span className="text-white font-bold tracking-wide">Administrador</span>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6 -mt-4">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-yellow-500 transition-colors" size={20} />
                <input 
                  type="password" 
                  autoFocus
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl pl-12 py-4 text-white outline-none focus:border-yellow-500/50 transition-all font-medium"
                  placeholder="Contraseña" 
                  required 
                />
              </div>

              {error && (
                <p className="text-yellow-500 text-center text-xs font-bold bg-yellow-500/10 py-2 rounded-xl border border-yellow-500/20">
                  Acceso denegado. Revisa tus datos.
                </p>
              )}

              <button 
                disabled={isLoading} 
                type="submit"
                className="w-full mt-2 bg-white text-black py-4 rounded-2xl font-black text-base flex items-center justify-center gap-2 hover:bg-yellow-500 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" size={24} /> : <>INGRESAR AL SISTEMA <ArrowRight size={20} /></>}
              </button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
