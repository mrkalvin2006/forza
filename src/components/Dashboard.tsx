// src/components/Login.tsx
import React, { useState } from 'react';
import { User, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

// IMPORTA TUS IMÁGENES AQUÍ. Asegúrate de que los archivos existan en esa ruta.
import ForzaLogo from '../assets/logo-forza.png'; 
import GymBackground from '../assets/gym-background.png'; // La imagen moderna de gimnasio

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin();
  };

  return (
    // CONTENEDOR PRINCIPAL CON LA IMAGEN DE FONDO
    <div 
      className="min-h-screen flex items-center justify-center antialiased relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${GymBackground})` }} // Inserción de la imagen de fondo
    >
      {/* SUPERPOSICIÓN MODERNA CON DESENFOQUE (BLUR) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0" />

      {/* TARJETA DE LOGIN CON EFECTO GLASSMORPHISM */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 w-full max-w-md p-10 bg-zinc-950/50 border border-zinc-800 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-lg"
      >
        <div className="flex flex-col items-center gap-10">
          
          {/* Logo con interacción sutil */}
          <motion.div 
            whileHover={{ scale: 1.05 }} 
            className="w-full flex items-center justify-center"
          >
            <img 
              src={ForzaLogo} 
              alt="Logo Forza Club Gym" 
              className="max-h-24 w-auto object-contain" 
            />
          </motion.div>

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
                  placeholder="admin"
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-800/80 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition"
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
                  className="w-full pl-12 pr-4 py-3.5 bg-zinc-800/80 border border-zinc-700/50 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-white focus:border-white transition"
                  required
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full mt-2 flex items-center justify-center gap-3 py-4 bg-white text-black rounded-xl font-semibold text-base shadow-lg hover:bg-zinc-100 transition duration-300"
            >
              Ingresar
              <ArrowRight className="size-5" />
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;