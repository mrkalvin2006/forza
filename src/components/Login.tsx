// src/components/Login.tsx
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Dumbbell, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabase'; // IMPORTANTE: Importamos la conexión

// URL de imagen de fondo
const BACKGROUND_IMAGE_URL = 'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=2070&auto=format&fit=crop';

const ForzaClubGymLogo = () => (
  <div className="flex flex-col items-center gap-2">
    <div className="bg-white/5 p-4 rounded-full backdrop-blur-sm border border-white/10 shadow-inner">
      <Dumbbell className="size-12 text-white" strokeWidth={1} />
    </div>
    <div className="text-center">
      <h1 className="text-4xl font-extrabold text-white leading-tight tracking-tighter">
        FORZA CLUB GYM
      </h1>
      <p className="text-sm font-medium text-zinc-300">Sistema de Gestión</p>
    </div>
  </div>
);

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Estado de carga

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    try {
      // CONSULTA A SUPABASE: Buscamos el usuario y contraseña exactos
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();

      if (dbError || !data) {
        // Si no hay datos o hay error, las credenciales están mal
        setError(true);
      } else {
        // ¡Éxito! Iniciamos sesión
        onLogin();
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center bg-black bg-cover bg-center antialiased"
      style={{ backgroundImage: `url(${BACKGROUND_IMAGE_URL})` }}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md bg-white/10 p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(31,38,135,0.37)] backdrop-blur-lg border border-white/20"
      >
        <div className="flex flex-col items-center gap-10">
          
          <ForzaClubGymLogo />

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
            
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300" htmlFor="username">
                Usuario
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="size-5 text-zinc-400" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Usuario"
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-800/80 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition"
                  required
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-zinc-300" htmlFor="password">
                Contraseña
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="size-5 text-zinc-400" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-800/80 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white transition"
                  required
                />
              </div>
            </div>

            {/* MENSAJE DE ERROR */}
            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-red-400 text-sm text-center font-medium"
              >
                Usuario o contraseña incorrectos
              </motion.p>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-3 py-4 bg-white text-black rounded-xl font-semibold text-base shadow-lg hover:bg-zinc-100 transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-5 animate-spin" />
                  Verificando...
                </>
              ) : (
                <>
                  Ingresar
                  <ArrowRight className="size-5" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;