// src/components/Login.tsx
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
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
      {/* SUPERPOSICIÓN MODERNA CON MÁS BRILLO Y PATRÓN SUTIL
         bg-black/10 es translúcido, dejando ver la imagen de fondo.
         Un patrón de puntos sutil añade textura sin oscurecer.
      */}
      <div className="absolute inset-0 bg-black/10 z-0">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDQwIDQwIj48ZyBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiM5QzlDOTkiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTAgMGg0MHY0MEgwVjB6bTIwIDIwaDIwdjIwSDIWMjB6TTAgMjBoMjB2MjBIMFYyMHoyMCAwaDIwdjIwSDIwVjB6Ii8+PC9nPjwvZz48L3N2Zz4=')] opacity-20" />
      </div>

      {/* TARJETA DE LOGIN CON EFECTO VIDRIO NEGRO (Negro Glassmorphism)
         El panel de login ahora es más translúcido (bg-black/40) y desenfocado (backdrop-blur-2xl).
         Sombra sutil para darle profundidad.
         border-zinc-800/50 es un borde sutil pero moderno.
      */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md p-12 bg-black/40 border border-zinc-800/50 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.6)] backdrop-blur-2xl"
      >
        <div className="flex flex-col items-center gap-12">
          
          {/* --- LOGO FORZA CLUB GYM GRANDADO Y CON EFECTO --- */}
          <div className="w-full flex items-center justify-center relative">
            {/* Efecto de foco sutil detrás del logo */}
            <div className="absolute inset-0 bg-white/5 rounded-full blur-xl scale-125" />
            <img 
              src={ForzaLogo} 
              alt="Logo Forza Club Gym" 
              className="max-h-32 w-auto object-contain relative z-10" // Tamaño aumentado a max-h-32
            />
          </div>

          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-8">
            
            {/* Campo Usuario */}
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-medium text-zinc-300" htmlFor="username">
                Usuario
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-white">
                  <User className="size-5 text-zinc-500" />
                </div>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-950/70 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white transition group-focus-within:border-white"
                  required
                />
              </div>
            </div>

            {/* Campo Contraseña */}
            <div className="flex flex-col gap-2.5">
              <label className="text-sm font-medium text-zinc-300" htmlFor="password">
                Contraseña
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors group-focus-within:text-white">
                  <Lock className="size-5 text-zinc-500" />
                </div>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-4 py-4 bg-zinc-950/70 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-white transition group-focus-within:border-white"
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

            {/* BOTÓN INGRESAR CON ESTADO DE CARGA Y EFECTO MODERNO */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="w-full mt-4 flex items-center justify-center gap-3 py-4 bg-white text-black rounded-xl font-bold text-base shadow-lg hover:bg-zinc-100 transition duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
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