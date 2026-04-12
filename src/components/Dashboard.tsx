import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Edit2, MessageCircle, LogOut, Users, AlertCircle, CalendarClock, Loader2 } from 'lucide-react';
import { Member, PLAN_DETAILS } from '../types';
import { generateWhatsAppLink, getDaysRemaining } from '../utils';
import MemberModal from './MemberModal';
import { supabase } from '../supabase';

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'nextMonth'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('members')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setMembers(data.map(row => ({
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        dni: row.dni,
        phone: row.phone,
        plan: row.plan as any,
        startDate: row.start_date,
        endDate: row.end_date,
      })));
    }
    setIsLoading(false);
  };

  // --- LOGICA DE ESTADISTICAS ---
  const stats = {
    total: members.length,
    active: members.filter(m => getDaysRemaining(m.endDate) >= 0).length,
    expiringSoon: members.filter(m => {
      const days = getDaysRemaining(m.endDate);
      return days >= 0 && days <= 30;
    }).length
  };

  const filteredMembers = members.filter(member => {
    const fullName = `${member.firstName} ${member.lastName} ${member.dni}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    if (filter === 'nextMonth') {
      const days = getDaysRemaining(member.endDate);
      return matchesSearch && days >= 0 && days <= 30;
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans pb-10">
      {/* CABECERA */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-lg">
              <Users className="text-black size-6" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">ALUMNOS MATRICULADOS</h1>
          </div>
          
          <div className="flex items-center gap-4">
            {/* BOTÓN CON EFECTO GLOW SUTIL */}
            <button 
              onClick={() => { setEditingMember(null); setIsModalOpen(true); }}
              className="bg-white text-black px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] hover:shadow-[0_0_25px_rgba(255,255,255,0.3)] active:scale-95"
            >
              <Plus size={20}/> Registrar Nuevo
            </button>
            <button onClick={onLogout} className="p-2.5 text-zinc-500 hover:text-white transition"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        
        {/* SECCIÓN DE STATS (Tarjetas Rápidas) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-zinc-800 rounded-2xl text-zinc-400"><Users size={24}/></div>
              <div>
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Total Alumnos</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><CalendarClock size={24}/></div>
              <div>
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Activos</p>
                <p className="text-2xl font-bold text-emerald-400">{isLoading ? '...' : stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800 p-6 rounded-3xl backdrop-blur-sm">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><AlertCircle size={24}/></div>
              <div>
                <p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Vence en 1 Mes</p>
                <p className="text-2xl font-bold text-blue-400">{isLoading ? '...' : stats.expiringSoon}</p>
              </div>
            </div>
          </div>
        </div>

        {/* BUSCADOR Y FILTRO */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shadow-inner">
            <button onClick={() => setFilter('all')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${filter === 'all' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Todos</button>
            <button onClick={() => setFilter('nextMonth')} className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${filter === 'nextMonth' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Vence en 1 mes</button>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={18}/>
            <input 
              type="text" placeholder="Buscar por nombre o DNI..." 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 focus:border-zinc-500 outline-none transition-all"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLA CON SEMÁFORO */}
        <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-800/50">
                  <th className="px-8 py-6">Alumno</th>
                  <th className="px-8 py-6">Plan / Inversión</th>
                  <th className="px-8 py-6">Matrícula y Fin</th>
                  <th className="px-8 py-6 text-center">Estado</th>
                  <th className="px-8 py-6 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-20 text-center text-zinc-600 font-bold uppercase tracking-widest animate-pulse">Sincronizando...</td></tr>
                ) : filteredMembers.map(member => {
                  const days = getDaysRemaining(member.endDate);
                  return (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 font-bold text-white">{member.firstName} {member.lastName} <p className="text-[10px] text-zinc-600 font-mono mt-1">{member.dni}</p></td>
                      <td className="px-8 py-6"><span className="bg-zinc-800 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-zinc-700">{PLAN_DETAILS[member.plan]?.label}</span></td>
                      <td className="px-8 py-6 text-sm"><span className="text-zinc-500">{member.startDate}</span> <span className="text-white font-bold ml-2">→ {member.endDate}</span></td>
                      
                      {/* SEMÁFORO VISUAL */}
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          {days < 0 ? (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black uppercase">Vencido</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className={`size-2 rounded-full shadow-[0_0_8px] ${days <= 7 ? 'bg-amber-500 shadow-amber-500/50 animate-pulse' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
                              <span className={`text-xs font-black ${days <= 7 ? 'text-amber-500' : 'text-emerald-400'}`}>{days} días</span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-8 py-6 text-right">
                        <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                          <a href={generateWhatsAppLink(member)} target="_blank" className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"><MessageCircle size={20}/></a>
                          <button onClick={() => { setEditingMember(member); setIsModalOpen(true); }} className="p-2 text-zinc-400 hover:bg-zinc-800 rounded-xl transition-all"><Edit2 size={20}/></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <MemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={() => {}} initialData={editingMember} />
    </div>
  );
}