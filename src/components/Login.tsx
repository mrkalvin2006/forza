import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabase';
import ForzaLogo from '../assets/logo-forza.png';
import GymBackground from '../assets/gym-background.png';

export default function Login({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verificación básica antes de llamar a la red
    if (!username || !password) return;

    setIsLoading(true);
    setError(false);

    try {
      // 1. Verificar si las variables de Supabase existen
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        throw new Error("Faltan las variables de entorno (URL o KEY) de Supabase");
      }

      // 2. Consulta a la base de datos
      const { data, error: dbError } = await supabase
        .from('users')
        .select('username, password')
        .eq('username', username.trim())
        .eq('password', password.trim())
        .maybeSingle();

      if (dbError) throw dbError;

      if (!data) {
        setError(true);
        console.log("Credenciales no encontradas en la tabla users");
      } else {
        console.log("Login exitoso");
        onLogin();
      }
    } catch (err: any) {
      console.error("Error detallado:", err);
      alert(`ERROR: ${err.message || "No se pudo conectar con Supabase"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black"
         style={{ backgroundImage: `url(${GymBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      
      <motion.div 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-10 bg-black/80 backdrop-blur-2xl border border-zinc-800 rounded-[2.5rem] shadow-2xl"
      >
        <div className="flex flex-col items-center gap-8">
          <img src={ForzaLogo} alt="Logo" className="max-h-28 w-auto drop-shadow-2xl" />
          
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase ml-1 tracking-[0.2em]">Acceso Administrativo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 py-4 text-white outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700"
                  placeholder="Usuario" 
                  required 
                />
              </div>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 py-4 text-white outline-none focus:border-zinc-500 transition-all placeholder:text-zinc-700"
                placeholder="Contraseña" 
                required 
              />
            </div>

            {error && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-500 text-center text-xs font-bold bg-red-500/10 py-2 rounded-lg">
                Usuario o contraseña incorrectos
              </motion.p>
            )}

            <button 
              disabled={isLoading} 
              type="submit"
              className="w-full bg-white text-black py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50 active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="animate-spin" size={20} /> : <>INGRESAR <ArrowRight size={18} /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}