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

    const { data, error: dbError } = await supabase
      .from('users')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password.trim())
      .single();

    if (dbError || !data) {
      setError(true);
      setIsLoading(false);
    } else {
      onLogin(); // Esto cambia el estado en App.tsx para mostrar el Dashboard
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black"
         style={{ backgroundImage: `url(${GymBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div className="absolute inset-0 bg-black/20" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-md p-10 bg-black/60 backdrop-blur-2xl border border-zinc-800 rounded-[2.5rem] shadow-2xl"
      >
        <div className="flex flex-col items-center gap-8">
          <img src={ForzaLogo} alt="Logo" className="max-h-32 w-auto" />
          
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1">Acceso Administrativo</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                <input type="text" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 py-4 text-white outline-none focus:border-zinc-600 transition-all"
                  placeholder="Usuario" required />
              </div>
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 py-4 text-white outline-none focus:border-zinc-600 transition-all"
                placeholder="Contraseña" required />
            </div>

            {error && <p className="text-red-500 text-center text-sm font-bold">Credenciales inválidas</p>}

            <button disabled={isLoading} type="submit"
              className="w-full bg-white text-black py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all">
              {isLoading ? <Loader2 className="animate-spin" /> : <>INGRESAR <ArrowRight /></>}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}