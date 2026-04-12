// src/App.tsx
import { useState, useEffect } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { supabase } from './supabase'; // Asegúrate de tener tu archivo supabase.ts listo

function App() {
  // Estado para saber si el usuario está autenticado
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Verificamos si hay una sesión activa al cargar la app
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    }
    checkSession();

    // Escuchamos cambios en la autenticación (login/logout)
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    // Limpiamos el listener al desmontar el componente
    return () => {
      authListener.subscription.unsubscribe();
    }
  }, []);

  // Función para manejar el cierre de sesión
  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
  };

  // Mientras verificamos la sesión, podemos mostrar una pantalla de carga sutil
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-500">
        Cargando Forza Club...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 antialiased">
      {/* Renderizado Condicional Único:
         Si NO está autenticado, muestra SOLO el Login.
         Si SÍ está autenticado, muestra SOLO el Dashboard.
      */}
      {!isAuthenticated ? (
        // Pasamos la función onLogin vacía porque Supabase maneja el estado internamente
        <Login onLogin={() => {}} /> 
      ) : (
        <Dashboard onLogout={handleLogout} />
      )}
    </main>
  );
}

export default App;