// src/App.tsx
import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';

function App() {
  // Este es el interruptor: false = Login, true = Dashboard
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Esta función se ejecuta cuando el Login tiene éxito
  const handleLoginSuccess = () => {
    console.log("Cambiando a Dashboard...");
    setIsAuthenticated(true);
  };

  // Esta función limpia el estado para volver al Login
  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  return (
    <main className="min-h-screen bg-black">
      {/* LÓGICA DE INTERRUPTOR */}
      {!isAuthenticated ? (
        // Le pasamos la función al prop 'onLogin' que espera tu Login.tsx
        <Login onLogin={handleLoginSuccess} />
      ) : (
        // Cuando sea true, se borra el Login y aparece el Dashboard
        <Dashboard onLogout={handleLogout} />
      )}
    </main>
  );
}

export default App;