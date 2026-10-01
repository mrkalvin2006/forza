// src/App.tsx
import { useState } from 'react';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import { UserRole } from './types';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('admin');

  const handleLoginSuccess = (role: UserRole) => {
    setUserRole(role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('admin');
  };

  return (
    <main className="min-h-screen bg-black">
      {!isAuthenticated ? (
        <Login onLogin={handleLoginSuccess} />
      ) : (
        <Dashboard onLogout={handleLogout} userRole={userRole} />
      )}
    </main>
  );
}

export default App;
