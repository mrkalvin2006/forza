// src/components/Dashboard.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Edit2, Trash2, MessageCircle, LogOut, Users, CalendarClock, Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { Member, PLAN_DETAILS } from '../types';
import { generateWhatsAppLink, getDaysRemaining } from '../utils';
import MemberModal from './MemberModal';
import { supabase } from '../supabase';

// --- IMPORTACIÓN DE ASSETS PARA EL NUEVO DISEÑO ---
import ForzaLogo from '../assets/logo-forza.png'; // Tu logo VIP
import GymBackground from '../assets/gym-background.png'; // Tu imagen moderna de gimnasio

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'nextMonth'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean, member: Member | null }>({ isOpen: false, member: null });

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

  const handleSaveMember = async (memberData: Omit<Member, 'id'>) => {
    const dbData = { first_name: memberData.firstName, last_name: memberData.lastName, dni: memberData.dni, phone: memberData.phone, plan: memberData.plan, start_date: memberData.startDate, end_date: memberData.endDate };
    if (editingMember) {
      await supabase.from('members').update(dbData).eq('id', editingMember.id);
    } else {
      await supabase.from('members').insert([dbData]);
    }
    fetchMembers();
    setIsModalOpen(false);
  };

  const requestDelete = (member: Member) => setDeleteConfirmation({ isOpen: true, member });
  const cancelDelete = () => setDeleteConfirmation({ isOpen: false, member: null });
  const confirmDelete = async () => {
    if (deleteConfirmation.member) {
      await supabase.from('members').delete().eq('id', deleteConfirmation.member.id);
      setMembers(members.filter(m => m.id !== deleteConfirmation.member!.id));
    }
    setDeleteConfirmation({ isOpen: false, member: null });
  };

  // --- LÓGICA DE STATS (NO TOCAR) ---
  const stats = {
    total: members.length,
    active: members.filter(m => getDaysRemaining(m.endDate) >= 0).length,
    expiringSoon: members.filter(m => { const days = getDaysRemaining(m.endDate); return days >= 0 && days <= 30; }).length
  };

  // --- LÓGICA DE FILTROS (NO TOCAR) ---
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
    // CONTENEDOR PRINCIPAL CON EL FONDO DEL LOGIN (VIP Gym)
    <div 
      className="min-h-screen bg-black text-zinc-100 font-sans pb-10 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${GymBackground})` }}
    >
      {/* Superposición negra translúcida (VIP Glass) */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-0" />

      {/* CABECERA VIP CON LOGO Y EFECTOS */}
      <header className="border-b border-zinc-800/60 bg-black/70 backdrop-blur-2xl sticky top-0 z-40 relative shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        {/* Destello dorado sutil en la parte inferior de la cabecera */}
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[linear-gradient(90deg,transparent_0%,#EAB308_50%,transparent_100%)] opacity-30" />
        
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4 relative">
            {/* LOGO DE FORZA CLUB GYM */}
            <img src={ForzaLogo} alt="Logo Forza" className="max-h-14 w-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
            
            {/* EFECTO DE LUZ DORADA SUTIL RECORRIENDO EL TÍTULO */}
            <div className="relative">
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-12 bg-yellow-500/5 rounded-full blur-xl scale-110" />
              <h1 className="text-xl font-black tracking-tighter uppercase relative z-10 text-white flex items-center gap-3">
                <Users className="text-yellow-500" size={24} />
                Gestión VIP de Alumnos
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            {/* BOTÓN CON EFECTO GLOW SUTIL (NO TOCAR FUNCIONALIDAD) */}
            <button 
              onClick={() => { setEditingMember(null); setIsModalOpen(true); }}
              className="bg-white text-black px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-yellow-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 text-xs uppercase tracking-widest"
            >
              <Plus size={18}/> Nueva Matrícula
            </button>
            
            {/* SALIR CON EFECTO HOVER VIP */}
            <button onClick={onLogout} className="group p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded-full transition-all flex items-center gap-2">
              <LogOut size={20}/>
              <span className="text-xs font-bold uppercase tracking-widest group-hover:block hidden transition-all">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 relative z-10">
        
        {/* STATS (NO TOCAR) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-3xl backdrop-blur-sm shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-8 translate-x-8 blur-3xl"/>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-zinc-800 rounded-2xl text-zinc-400"><Users size={24}/></div>
              <div><p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Total VIPs</p><p className="text-2xl font-bold">{isLoading ? '...' : stats.total}</p></div>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-3xl backdrop-blur-sm shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -translate-y-8 translate-x-8 blur-3xl"/>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500">< ShieldCheck size={24}/></div>
              <div><p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Suscripciones Activas</p><p className="text-2xl font-bold text-emerald-400">{isLoading ? '...' : stats.active}</p></div>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-3xl backdrop-blur-sm shadow-inner relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full -translate-y-8 translate-x-8 blur-3xl"/>
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"><AlertTriangle size={24}/></div>
              <div><p className="text-xs font-black text-zinc-500 uppercase tracking-widest">Renovación Pendiente</p><p className="text-2xl font-bold text-blue-400">{isLoading ? '...' : stats.expiringSoon}</p></div>
            </div>
          </div>
        </div>

        {/* BUSCADOR Y FILTRO VIP */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
            <button onClick={() => setFilter('all')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${filter === 'all' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Todos</button>
            <button onClick={() => setFilter('nextMonth')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${filter === 'nextMonth' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Vence en 1 mes</button>
          </div>
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={18}/>
            <input 
              type="text" placeholder="Buscar por nombre o DNI..." 
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 focus:border-zinc-500 transition-all outline-none font-medium placeholder:text-zinc-700"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* TABLA CON EFECTOS VIP Y SEMÁFORO (NO TOCAR FUNCIONALIDAD) */}
        <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.2)]">
          <div className="overflow-x-auto relative">
            
            {/* Destello dorado sutil recorriendo el borde de la tabla (efecto VIP) */}
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }} style={{ width: '200%', height: '200%' }} className="absolute -inset-1/2 z-0 opacity-10 bg-[conic-gradient(from_0deg,transparent_0deg,transparent_150deg,#EAB308_180deg,transparent_210deg,transparent_360deg)]" />

            <table className="w-full text-left border-collapse relative z-10">
              <thead>
                <tr className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-800/50">
                  <th className="px-8 py-6">Alumno / DNI</th>
                  <th className="px-8 py-6">Plan / Inversión</th>
                  <th className="px-8 py-6">Matrícula y Fin</th>
                  <th className="px-8 py-6 text-center">Estado</th>
                  <th className="px-8 py-6 text-right">Gestión VIP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {isLoading ? (
                  <tr><td colSpan={5} className="py-20 text-center text-zinc-600 font-bold uppercase animate-pulse">Sincronizando base de datos...</td></tr>
                ) : filteredMembers.map(member => {
                  const days = getDaysRemaining(member.endDate);
                  return (
                    <tr key={member.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 font-bold text-white">{member.firstName} {member.lastName} <p className="text-[10px] text-zinc-600 font-mono mt-1">{member.dni}</p></td>
                      <td className="px-8 py-6"><span className="bg-zinc-800 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-zinc-700">{PLAN_DETAILS[member.plan]?.label}</span></td>
                      <td className="px-8 py-6 text-sm"><span className="text-zinc-500">{member.startDate}</span> <span className="text-white font-bold ml-2">→ {member.endDate}</span></td>
                      <td className="px-8 py-6">
                        <div className="flex justify-center">
                          {days < 0 ? (
                            <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black">Suscripción Vencida</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {/* Efecto de luz dorada pulsante para los que están por vencer */}
                              <div className={`size-2 rounded-full shadow-[0_0_8px] ${days <= 7 ? 'bg-amber-500 animate-pulse shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
                              <span className={`text-xs font-black ${days <= 7 ? 'text-amber-500' : 'text-emerald-400'}`}>{days} días</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-6 text-right relative">
                        <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                          <a href={generateWhatsAppLink(member)} target="_blank" className="p-2.5 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"><MessageCircle size={18}/></a>
                          <button onClick={() => { setEditingMember(member); setIsModalOpen(true); }} className="p-2.5 text-zinc-400 hover:bg-zinc-800 rounded-xl transition-all"><Edit2 size={18}/></button>
                          <button onClick={() => requestDelete(member)} className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18}/></button>
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

      <MemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveMember} initialData={editingMember} />

      {/* CONFIRMACIÓN DE ELIMINACIÓN CON ESTILO VIP (NO TOCAR FUNCIONALIDAD) */}
      <AnimatePresence>
        {deleteConfirmation.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl" >
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20"><AlertTriangle size={36} /></div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">¿Eliminar registro VIP?</h2>
                  <p className="text-sm text-zinc-400 mt-2">Estás a punto de eliminar la matrícula de <strong className="text-white">{deleteConfirmation.member?.firstName} {deleteConfirmation.member?.lastName}</strong>. Esta acción no se puede deshacer.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                  <button onClick={cancelDelete} className="w-full py-3 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-zinc-800/50 rounded-xl">No, Cancelar</button>
                  <button onClick={confirmDelete} className="w-full py-3 bg-red-500 text-white font-black uppercase text-xs rounded-xl hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95 flex items-center justify-center gap-2">
                    <Trash2 size={16}/>Sí, Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}