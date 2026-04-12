import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Edit2, Trash2, MessageCircle, LogOut, Users, CalendarClock, Loader2, Filter } from 'lucide-react';
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
    // Ordenamos por created_at descendente para que los últimos matriculados salgan primero
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

  const handleSaveMember = async (memberData: Omit<Member, 'id'>) => {
    const dbData = {
      first_name: memberData.firstName,
      last_name: memberData.lastName,
      dni: memberData.dni,
      phone: memberData.phone,
      plan: memberData.plan,
      start_date: memberData.startDate,
      end_date: memberData.endDate,
    };

    if (editingMember) {
      await supabase.from('members').update(dbData).eq('id', editingMember.id);
    } else {
      await supabase.from('members').insert([dbData]);
    }
    fetchMembers();
    setIsModalOpen(false);
  };

  const filteredMembers = members.filter(member => {
    const fullName = `${member.firstName} ${member.lastName} ${member.dni}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase());
    
    if (filter === 'nextMonth') {
      const days = getDaysRemaining(member.endDate);
      // Filtro: Vence en el próximo mes (0 a 30 días)
      return matchesSearch && days >= 0 && days <= 30;
    }
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* CABECERA PRINCIPAL */}
      <header className="border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-xl sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="bg-white p-1.5 rounded-lg">
              <Users className="text-black size-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">ALUMNOS MATRICULADOS</h1>
              <p className="text-xs text-zinc-500 uppercase tracking-widest">Forza Club Gym</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { setEditingMember(null); setIsModalOpen(true); }}
              className="bg-white text-black px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-zinc-200 transition-all shadow-lg"
            >
              <Plus size={20}/> Registrar Nuevo
            </button>
            <button onClick={onLogout} className="p-2.5 text-zinc-500 hover:text-white transition"><LogOut size={20}/></button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        {/* BARRA DE FILTROS Y BÚSQUEDA */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="flex gap-2 bg-zinc-900/50 p-1 rounded-2xl border border-zinc-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'all' ? 'bg-zinc-100 text-black shadow-md' : 'text-zinc-500 hover:text-white'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setFilter('nextMonth')}
              className={`px-6 py-2 rounded-xl text-sm font-semibold transition-all ${filter === 'nextMonth' ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-white'}`}
            >
              Vence en 1 mes
            </button>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18}/>
            <input 
              type="text" 
              placeholder="Buscar por nombre o DNI..." 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3 focus:ring-2 focus:ring-white/20 outline-none transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* LISTA DE ALUMNOS */}
        <div className="bg-zinc-900/30 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs uppercase tracking-wider">
                  <th className="px-6 py-5 font-semibold">Alumno / DNI</th>
                  <th className="px-6 py-5 font-semibold">Plan</th>
                  <th className="px-6 py-5 font-semibold">Matrícula / Vencimiento</th>
                  <th className="px-6 py-5 font-semibold">Días Restantes</th>
                  <th className="px-6 py-5 font-semibold text-right">Gestión</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-20 text-center"><Loader2 className="animate-spin inline mr-3 text-zinc-500"/> Cargando base de datos...</td></tr>
                ) : filteredMembers.length === 0 ? (
                  <tr><td colSpan={5} className="py-20 text-center text-zinc-500">No hay alumnos que coincidan con la búsqueda.</td></tr>
                ) : (
                  filteredMembers.map(member => {
                    const days = getDaysRemaining(member.endDate);
                    return (
                      <tr key={member.id} className="group hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-5">
                          <div className="font-bold text-white">{member.firstName} {member.lastName}</div>
                          <div className="text-xs text-zinc-500 font-mono mt-0.5">{member.dni}</div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="bg-zinc-800 text-zinc-300 px-3 py-1 rounded-full text-xs font-bold border border-zinc-700">
                            {PLAN_DETAILS[member.plan]?.label}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="text-sm text-zinc-300 italic">{member.startDate}</div>
                          <div className="text-sm text-white font-semibold">{member.endDate}</div>
                        </td>
                        <td className="px-6 py-5">
                          {days < 0 ? (
                            <span className="text-red-500 font-bold text-sm">Vencido</span>
                          ) : (
                            <span className={`text-sm font-bold ${days <= 30 ? 'text-blue-400' : 'text-emerald-400'}`}>
                              {days} días
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-right flex justify-end gap-2">
                          <a href={generateWhatsAppLink(member)} target="_blank" className="p-2.5 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"><MessageCircle size={18}/></a>
                          <button onClick={() => { setEditingMember(member); setIsModalOpen(true); }} className="p-2.5 bg-zinc-800 text-zinc-400 rounded-xl hover:bg-zinc-700 hover:text-white transition-all"><Edit2 size={18}/></button>
                        </td>
                      </tr>
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
        onClose={() => setIsModalOpen(false)} 
        onSave={handleSaveMember} 
        initialData={editingMember} 
      />
    </div>
  );
}