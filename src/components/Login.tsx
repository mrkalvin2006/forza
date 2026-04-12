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
    setIsLoading(true);
    setError(false);

    try {
      // Usamos maybeSingle para evitar que la query lance una excepción si no hay resultados
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username.trim())
        .eq('password', password.trim())
        .maybeSingle();

      if (dbError) throw dbError; // Si hay error de conexión o tabla, va al catch

      if (!data) {
        // Usuario o contraseña no encontrados
        setError(true);
      } else {
        // Éxito
        onLogin();
      }
    } catch (err) {
      console.error("Error de autenticación:", err);
      // Si falla la conexión o no existe la tabla, mostramos el error y liberamos el botón
      setError(true);
    } finally {
      // El finally se ejecuta SIEMPRE (haya éxito o error), deteniendo el loading
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black"
         style={{ backgroundImage: `url(${GymBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 w-full max-w-md p-10 bg-black/70 backdrop-blur-2xl border border-zinc-800 rounded-[2.5rem] shadow-2xl"
      >
        <div className="flex flex-col items-center gap-8">
          <img src={ForzaLogo} alt="Logo Forza" className="max-h-32 w-auto drop-shadow-2xl" />
          
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Acceso Administrativo</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={18} />
                <input 
                  type="text" 
                  value={username} 
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 py-4 text-white outline-none focus:border-zinc-500 transition-all"
                  placeholder="Usuario" 
                  required 
                />
              </div>
            </div>

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-white transition-colors" size={18} />
              <input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 py-4 text-white outline-none focus:border-zinc-500 transition-all"
                placeholder="Contraseña" 
                required 
              />
            </div>

            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="text-red-500 text-center text-sm font-bold bg-red-500/10 py-2 rounded-xl border border-red-500/20"
              >
                Credenciales inválidas
              </motion.p>
            )}

            <button 
              disabled={isLoading} 
              type="submit"
              className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" />
              ) : (
                <>INGRESAR <ArrowRight size={20} /></>
              )}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}