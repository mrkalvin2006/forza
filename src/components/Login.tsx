// src/components/Login.tsx
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Dumbbell, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../supabase'; // Asegúrate de tener tu archivo supabase.ts listo

// --- IMPORTACIÓN DE TUS ASSETS REALES ---
// Asegúrate de que estos archivos existan en src/assets/
import ForzaLogo from '../assets/logo-forza.png'; // Tu logo de Forza Club Gym
import GymBackground from '../assets/gym-background.png'; // Tu imagen moderna de gimnasio

interface LoginProps {
  // Esta función ya no es necesaria con Supabase auth listener, pero la mantenemos para compatibilidad
  onLogin: () => void; 
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Estado para mostrar carga

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(false);

    try {
      // CONSULTA REAL A SUPABASE: Verifica usuario y contraseña en la tabla 'users'
      // Nota: En un sistema real, usaríamos supabase.auth.signInWithPassword para hash seguro.
      const { data, error: dbError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single(); // Esperamos un único resultado

      if (dbError || !data) {
        // Credenciales incorrectas o error en la base de datos
        setError(true);
      } else {
        // ¡Éxito! Supabase auth listener en App.tsx detectará el cambio automáticamente
        //onLogin(); // Ya no es necesario llamarlo aquí
      }
    } catch (err) {
      console.error("Error completo en login:", err);
      setError(true);
    } finally {
      setIsLoading(false); // Apagamos el estado de carga
    }
  };

  return (
    // CONTENEDOR PRINCIPAL CON TU IMAGEN DE FONDO
    <div 
      className="min-h-screen flex items-center justify-center antialiased relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${GymBackground})` }}
    >
      {/* SUPERPOSICIÓN MODERNA CON MÁS BRILLO (Menor opacidad y menor blur)
         bg-black/40 es más brillante que bg-black/60.
         backdrop-blur-[2px] es un desenfoque sutil que deja ver la imagen.
      */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] z-0" />

      {/* TARJETA DE LOGIN CON EFECTO VIDRIO (Glassmorphism)
         El panel de login ahora encima de la superposición (z-10)
         bg-white/10 es translúcido.
         backdrop-blur-xl es un desenfoque fuerte detrás del panel.
         border-white/20 es un borde brillante sutil.
      */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md p-10 bg-white/10 border border-white/20 rounded-3xl shadow-[0_8px_32px_0_rgba(255,255,255,0.1)] backdrop-blur-xl"
      >
        <div className="flex flex-col items-center gap-10">
          
          {/* Logo Forza Club Gym */}
          <div className="w-full flex items-center justify-center">
            <img 
              src={ForzaLogo} 
              alt="Logo Forza Club Gym" 
              className="max-h-24 w-auto object-contain" 
            />
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-6">
            
            {/* Campo Usuario */}
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
                  placeholder="admin"
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-950/70 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition"
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña */}
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
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-950/70 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 transition"
                  required
                />
              </div>
            </div>

            {/* MENSAJE DE ERROR SUTIL */}
            {error && (
              <motion.p 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-red-400 text-sm text-center font-medium"
              >
                Credenciales incorrectas. Intenta de nuevo.
              </motion.p>
            )}

            {/* BOTÓN INGRESAR CON ESTADO DE CARGA */}
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