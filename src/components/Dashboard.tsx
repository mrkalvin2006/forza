import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Edit2, Trash2, MessageCircle, LogOut, Users, AlertCircle, CalendarClock } from 'lucide-react';
import { Member, PLAN_DETAILS } from '../types';
import { generateWhatsAppLink, getDaysRemaining } from '../utils';
import MemberModal from './MemberModal';

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | '7days' | '30days'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('forza_members');
    if (saved) {
      setMembers(JSON.parse(saved));
    }
  }, []);

  // Save to localStorage when members change
  useEffect(() => {
    localStorage.setItem('forza_members', JSON.stringify(members));
  }, [members]);

  const handleSaveMember = (memberData: Omit<Member, 'id'>) => {
    if (editingMember) {
      setMembers(members.map(m => m.id === editingMember.id ? { ...memberData, id: m.id } : m));
    } else {
      const newMember = { ...memberData, id: crypto.randomUUID() };
      setMembers([...members, newMember]);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de eliminar este registro?')) {
      setMembers(members.filter(m => m.id !== id));
    }
  };

  const filteredMembers = members.filter(member => {
    const matchesSearch = 
      member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.dni.includes(searchTerm);

    const daysRemaining = getDaysRemaining(member.endDate);
    
    let matchesFilter = true;
    if (filter === '7days') matchesFilter = daysRemaining >= 0 && daysRemaining <= 7;
    if (filter === '30days') matchesFilter = daysRemaining >= 0 && daysRemaining <= 30;

    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: members.length,
    active: members.filter(m => getDaysRemaining(m.endDate) >= 0).length,
    expiringSoon: members.filter(m => {
      const days = getDaysRemaining(m.endDate);
      return days >= 0 && days <= 7;
    }).length
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 to-black text-zinc-100 font-sans">
      {/* Header */}
      <header className="border-b border-zinc-800/50 bg-zinc-900/30 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-100 rounded-lg flex items-center justify-center">
              <span className="text-zinc-900 font-bold text-xl leading-none">F</span>
            </div>
            <h1 className="text-xl font-bold tracking-widest">FORZA CLUB</h1>
          </div>
          <button 
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Salir
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-xl text-blue-400"><Users className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-zinc-400">Total Registrados</p>
                <p className="text-2xl font-semibold">{stats.total}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400"><CalendarClock className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-zinc-400">Miembros Activos</p>
                <p className="text-2xl font-semibold">{stats.active}</p>
              </div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-400"><AlertCircle className="w-6 h-6" /></div>
              <div>
                <p className="text-sm text-zinc-400">Por Vencer (7 días)</p>
                <p className="text-2xl font-semibold">{stats.expiringSoon}</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === 'all' ? 'bg-zinc-100 text-zinc-900' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 border border-zinc-800/50'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('7days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === '7days' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/50' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 border border-zinc-800/50'}`}
            >
              Vencen en 7 días
            </button>
            <button
              onClick={() => setFilter('30days')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${filter === '30days' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50' : 'bg-zinc-900/50 text-zinc-400 hover:bg-zinc-800 border border-zinc-800/50'}`}
            >
              Vencen en 30 días
            </button>
          </div>

          <div className="flex gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Buscar por nombre o DNI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-zinc-900/50 border border-zinc-800/50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-700 transition-all"
              />
            </div>
            <button
              onClick={() => {
                setEditingMember(null);
                setIsModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-sm font-medium transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)]"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Nueva Matrícula</span>
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-zinc-900/50 text-zinc-400 border-b border-zinc-800/50">
                <tr>
                  <th className="px-6 py-4 font-medium">Miembro</th>
                  <th className="px-6 py-4 font-medium">DNI</th>
                  <th className="px-6 py-4 font-medium">Celular</th>
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium">Fechas</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                      No se encontraron registros.
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((member) => {
                    const daysRemaining = getDaysRemaining(member.endDate);
                    const isExpired = daysRemaining < 0;
                    const isExpiringSoon = daysRemaining >= 0 && daysRemaining <= 7;

                    return (
                      <motion.tr 
                        key={member.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-zinc-800/20 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-zinc-200">{member.firstName} {member.lastName}</div>
                        </td>
                        <td className="px-6 py-4 text-zinc-400">{member.dni}</td>
                        <td className="px-6 py-4 text-zinc-400">{member.phone}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-800 text-zinc-300">
                            {PLAN_DETAILS[member.plan].label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-zinc-300">{member.startDate}</div>
                          <div className="text-zinc-500 text-xs">hasta {member.endDate}</div>
                        </td>
                        <td className="px-6 py-4">
                          {isExpired ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                              Vencido
                            </span>
                          ) : isExpiringSoon ? (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Quedan {daysRemaining} días
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Activo
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={generateWhatsAppLink(member)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                              title="Enviar recordatorio por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => {
                                setEditingMember(member);
                                setIsModalOpen(true);
                              }}
                              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(member.id)}
                              className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <MemberModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        initialData={editingMember}
      />
    </div>
  );
}
