// src/components/Dashboard.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, MessageCircle, LogOut, Users, AlertTriangle, ShieldCheck, History, Wallet, CalendarRange } from 'lucide-react';
import { AlumnoConEstado, MatriculaConAlumno, PLAN_DETAILS } from '../types';
import { generateWhatsAppLink, getDaysRemaining, formatFriendlyDate, getTodayString, getWeekStart, getWeekLabel, getMonthLabel } from '../utils';
import MemberModal from './MemberModal';
import { supabase } from '../supabase';

import ForzaLogo from '../assets/logo-forza.png';
import GymBackground from '../assets/gym-background.png';

export default function Dashboard({ onLogout }: { onLogout: () => void }) {
  const [alumnos, setAlumnos] = useState<AlumnoConEstado[]>([]);
  const [matriculas, setMatriculas] = useState<MatriculaConAlumno[]>([]);
  const [view, setView] = useState<'alumnos' | 'matriculas' | 'caja'>('alumnos');
  const [cajaPeriod, setCajaPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'nextMonth' | 'expired'>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [preselectedAlumno, setPreselectedAlumno] = useState<AlumnoConEstado | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteAlumno, setDeleteAlumno] = useState<AlumnoConEstado | null>(null);
  const [deleteMatricula, setDeleteMatricula] = useState<MatriculaConAlumno | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [{ data: alumnosData }, { data: matriculasData }] = await Promise.all([
      supabase.from('alumnos').select('*').order('created_at', { ascending: false }),
      supabase.from('matriculas').select('*').order('start_date', { ascending: false }),
    ]);

    const rawAlumnos = alumnosData || [];
    const rawMatriculas = matriculasData || [];

    const alumnosMapped: AlumnoConEstado[] = rawAlumnos.map((a: any) => {
      const suyas = rawMatriculas.filter((m: any) => m.alumno_id === a.id);
      const ultima = suyas.sort((x: any, y: any) => (x.end_date < y.end_date ? 1 : -1))[0];
      return {
        id: a.id,
        firstName: a.first_name,
        lastName: a.last_name,
        dni: a.dni,
        phone: a.phone,
        lastMatriculaId: ultima ? ultima.id : null,
        lastPlan: ultima ? ultima.plan : null,
        lastStartDate: ultima ? ultima.start_date : null,
        lastEndDate: ultima ? ultima.end_date : null,
        lastAmount: ultima ? ultima.amount : null,
      };
    });

    const alumnosById = new Map(rawAlumnos.map((a: any) => [a.id, a]));
    const matriculasMapped: MatriculaConAlumno[] = rawMatriculas.map((m: any) => {
      const a: any = alumnosById.get(m.alumno_id) || {};
      return {
        id: m.id,
        alumnoId: m.alumno_id,
        plan: m.plan,
        startDate: m.start_date,
        endDate: m.end_date,
        amount: m.amount,
        observation: m.observation || null,
        firstName: a.first_name || '(eliminado)',
        lastName: a.last_name || '',
        dni: a.dni || '',
      };
    });

    setAlumnos(alumnosMapped);
    setMatriculas(matriculasMapped);
    setIsLoading(false);
  };

  const openNewMatricula = (alumno?: AlumnoConEstado) => {
    setPreselectedAlumno(alumno || null);
    setIsModalOpen(true);
  };

  const confirmDeleteAlumno = async () => {
    if (deleteAlumno) {
      await supabase.from('alumnos').delete().eq('id', deleteAlumno.id);
      setDeleteAlumno(null);
      fetchData();
    }
  };

  const confirmDeleteMatricula = async () => {
    if (deleteMatricula) {
      await supabase.from('matriculas').delete().eq('id', deleteMatricula.id);
      setDeleteMatricula(null);
      fetchData();
    }
  };

  const stats = {
    total: alumnos.length,
    active: alumnos.filter((a) => a.lastEndDate && getDaysRemaining(a.lastEndDate) >= 0).length,
    expired: alumnos.filter((a) => !a.lastEndDate || getDaysRemaining(a.lastEndDate) < 0).length,
    // Punto 9: total recaudado solo del mes actual
    totalRecaudado: matriculas
      .filter((m) => m.startDate.slice(0, 7) === getTodayString().slice(0, 7))
      .reduce((sum, m) => sum + (Number(m.amount) || 0), 0),
  };

  // --- Flujo de Caja ---
  const todayStr = getTodayString();
  const weekStartToday = getWeekStart(todayStr);
  const monthKeyToday = todayStr.slice(0, 7);

  const cajaHoy = matriculas.filter((m) => m.startDate === todayStr).reduce((s, m) => s + Number(m.amount || 0), 0);
  const cajaSemana = matriculas.filter((m) => getWeekStart(m.startDate) === weekStartToday).reduce((s, m) => s + Number(m.amount || 0), 0);
  const cajaMes = matriculas.filter((m) => m.startDate.slice(0, 7) === monthKeyToday).reduce((s, m) => s + Number(m.amount || 0), 0);

  // Punto 2: caja en orden de fecha más reciente primero (ya está por .sort desc)
  const cajaGroups = (() => {
    const map = new Map<string, { total: number; count: number }>();
    matriculas.forEach((m) => {
      const key = cajaPeriod === 'daily'
        ? m.startDate
        : cajaPeriod === 'weekly'
          ? getWeekStart(m.startDate)
          : m.startDate.slice(0, 7);
      const cur = map.get(key) || { total: 0, count: 0 };
      cur.total += Number(m.amount || 0);
      cur.count += 1;
      map.set(key, cur);
    });
    // Punto 2: más reciente primero tanto en diario como mensual
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  })();

  const cajaLabel = (key: string) => (cajaPeriod === 'daily' ? formatFriendlyDate(key) : cajaPeriod === 'weekly' ? getWeekLabel(key) : getMonthLabel(key));

  // Punto 8: lista de matrículas del mes actual
  const matriculasMesActual = matriculas.filter((m) => m.startDate.slice(0, 7) === monthKeyToday);

  const filteredAlumnos = alumnos.filter((a) => {
    const q = `${a.firstName} ${a.lastName || ''} ${a.phone || ''} ${a.dni || ''}`.toLowerCase();
    if (!q.includes(searchTerm.toLowerCase())) return false;
    const days = a.lastEndDate ? getDaysRemaining(a.lastEndDate) : -Infinity;
    if (filter === 'nextMonth') return days >= 0 && days <= 30;
    if (filter === 'expired') return days < 0;
    return true;
  });

  // Punto 1: matrículas ordenadas de más reciente a más antigua (ya vienen así del fetch)
  const filteredMatriculas = matriculas.filter((m) => {
    const q = `${m.firstName} ${m.lastName || ''} ${m.dni || ''}`.toLowerCase();
    return q.includes(searchTerm.toLowerCase());
  });

  return (
    <div
      className="min-h-screen bg-black text-zinc-100 font-sans pb-10 relative overflow-hidden bg-cover bg-center"
      style={{ backgroundImage: `url(${GymBackground})` }}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-0" />

      <header className="border-b border-zinc-800/60 bg-black/70 backdrop-blur-2xl sticky top-0 z-40 relative shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[linear-gradient(90deg,transparent_0%,#EAB308_50%,transparent_100%)] opacity-30" />

        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4 relative">
            <img src={ForzaLogo} alt="Logo Forza" className="max-h-14 w-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
            <div className="relative">
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-12 bg-yellow-500/5 rounded-full blur-xl scale-110" />
              <h1 className="text-xl font-black tracking-tighter uppercase relative z-10 text-white flex items-center gap-3">
                <Users className="text-yellow-500" size={24} />
                {view === 'alumnos' ? 'Registro de Alumnos' : view === 'matriculas' ? 'Registro de Matrículas' : 'Flujo de Caja'}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-5 relative z-10">
            <button
              onClick={() => openNewMatricula()}
              className="bg-white text-black px-6 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-yellow-500 hover:text-white transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] active:scale-95 text-xs uppercase tracking-widest"
            >
              <Plus size={18} /> Nueva Matrícula
            </button>
            <button onClick={onLogout} className="group p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded-full transition-all flex items-center gap-2">
              <LogOut size={20} />
              <span className="text-xs font-bold uppercase tracking-widest group-hover:block hidden transition-all">Salir</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6 relative z-10">
        {/* SELECTOR DE VISTA: Alumnos / Matrículas */}
        <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)] mb-8 w-fit">
          <button onClick={() => setView('alumnos')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all flex items-center gap-2 ${view === 'alumnos' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
            <Users size={14} /> Alumnos
          </button>
          <button onClick={() => setView('matriculas')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all flex items-center gap-2 ${view === 'matriculas' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
            <History size={14} /> Matrículas
          </button>
          <button onClick={() => setView('caja')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all flex items-center gap-2 ${view === 'caja' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
            <Wallet size={14} /> Caja
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-3xl backdrop-blur-sm shadow-inner relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-zinc-800 rounded-2xl text-zinc-400"><Users size={24} /></div>
              <div>
                <p className="text-xs font-black text-yellow-500 uppercase tracking-widest">Total Alumnos</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : stats.total}</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-3xl backdrop-blur-sm shadow-inner relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-500"><ShieldCheck size={24} /></div>
              <div>
                <p className="text-xs font-black text-yellow-500 uppercase tracking-widest">Activos</p>
                <p className="text-2xl font-bold text-emerald-400">{isLoading ? '...' : stats.active}</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-3xl backdrop-blur-sm shadow-inner relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-red-500/10 rounded-2xl text-red-500"><AlertTriangle size={24} /></div>
              <div>
                <p className="text-xs font-black text-yellow-500 uppercase tracking-widest">No Renovaron</p>
                <p className="text-2xl font-bold text-red-400">{isLoading ? '...' : stats.expired}</p>
              </div>
            </div>
          </div>
          <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-3xl backdrop-blur-sm shadow-inner relative overflow-hidden">
            <div className="flex items-center gap-4 relative z-10">
              <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500"><Wallet size={24} /></div>
              <div>
                <p className="text-xs font-black text-yellow-500 uppercase tracking-widest">Total Recaudado</p>
                <p className="text-2xl font-bold">{isLoading ? '...' : `S/ ${stats.totalRecaudado.toFixed(2)}`}</p>
                <p className="text-[10px] text-zinc-600 mt-1">Este mes</p>
              </div>
            </div>
          </div>
        </div>

        {view !== 'caja' && (
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          {view === 'alumnos' && (
            <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 shadow-[inset_0_2px_10px_rgba(0,0,0,0.2)]">
              <button onClick={() => setFilter('all')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${filter === 'all' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Todos</button>
              <button onClick={() => setFilter('nextMonth')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${filter === 'nextMonth' ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-white'}`}>Vence en 1 mes</button>
              <button onClick={() => setFilter('expired')} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${filter === 'expired' ? 'bg-red-600 text-white' : 'text-zinc-500 hover:text-white'}`}>No renovaron</button>
            </div>
          )}
          <div className="relative w-full md:w-96 group ml-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={18} />
            <input
              type="text" placeholder="Buscar por nombre o celular..."
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-12 pr-4 py-3.5 focus:border-zinc-500 transition-all outline-none font-medium placeholder:text-zinc-700"
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        )}

        {view === 'caja' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-3xl backdrop-blur-sm">
                <p className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-2">Hoy</p>
                <p className="text-3xl font-bold">S/ {cajaHoy.toFixed(2)}</p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-3xl backdrop-blur-sm">
                <p className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-2">Esta Semana</p>
                <p className="text-3xl font-bold">S/ {cajaSemana.toFixed(2)}</p>
              </div>
              <div className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-3xl backdrop-blur-sm">
                <p className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-2">Este Mes</p>
                <p className="text-3xl font-bold">S/ {cajaMes.toFixed(2)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-widest">
                <CalendarRange size={16} className="text-yellow-500" /> Historial por período
              </div>
              <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
                <button onClick={() => setCajaPeriod('daily')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${cajaPeriod === 'daily' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Diario</button>
                <button onClick={() => setCajaPeriod('weekly')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${cajaPeriod === 'weekly' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Semanal</button>
                <button onClick={() => setCajaPeriod('monthly')} className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all ${cajaPeriod === 'monthly' ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>Mensual</button>
              </div>
            </div>

            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-800/50">
                    <th className="px-8 py-6">Período</th>
                    <th className="px-8 py-6">Matrículas</th>
                    <th className="px-8 py-6 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {isLoading ? (
                    <tr><td colSpan={3} className="py-20 text-center text-zinc-600 font-bold uppercase animate-pulse">Sincronizando base de datos...</td></tr>
                  ) : cajaGroups.length === 0 ? (
                    <tr><td colSpan={3} className="py-20 text-center text-zinc-600 font-bold uppercase">Sin matrículas registradas</td></tr>
                  ) : cajaGroups.map(([key, { total, count }]) => (
                    <tr key={key} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-8 py-6 font-bold text-white capitalize">{cajaLabel(key)}</td>
                      <td className="px-8 py-6 text-zinc-400">{count}</td>
                      <td className="px-8 py-6 text-right text-yellow-500 font-black">S/ {total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

          {/* Punto 8: Lista de matrículas del mes actual, dentro de la vista caja */}
          {view === 'caja' && (
          <div className="mt-8 space-y-4">
            <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-widest">
              <History size={16} className="text-yellow-500" /> Matrículas de este mes ({matriculasMesActual.length})
            </div>
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-800/50">
                    <th className="px-6 py-5">Alumno</th>
                    <th className="px-6 py-5">Plan</th>
                    <th className="px-6 py-5">Inicio</th>
                    <th className="px-6 py-5">Fin</th>
                    <th className="px-6 py-5 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {matriculasMesActual.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-zinc-600 font-bold uppercase text-xs">Sin matrículas este mes</td></tr>
                  ) : matriculasMesActual.map((m) => (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4 font-bold text-white text-sm">{m.firstName} {m.lastName || ''}</td>
                      <td className="px-6 py-4"><span className="bg-zinc-800 px-2 py-1 rounded-lg text-[10px] font-black uppercase border border-zinc-700">{PLAN_DETAILS[m.plan]?.label}</span></td>
                      <td className="px-6 py-4 text-xs text-zinc-400">{formatFriendlyDate(m.startDate)}</td>
                      <td className="px-6 py-4 text-xs text-white font-bold">{formatFriendlyDate(m.endDate)}</td>
                      <td className="px-6 py-4 text-right text-yellow-500 font-black text-sm">S/ {Number(m.amount || 0).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          )}

        {view !== 'caja' && (

        <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] overflow-hidden backdrop-blur-md shadow-[0_10px_40px_rgba(0,0,0,0.2)] relative">
          <div className="overflow-x-auto scrollbar-hide">
            {view === 'alumnos' ? (
              <table className="w-full text-left border-collapse relative z-10">
                <thead>
                  <tr className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-800/50">
                    <th className="px-8 py-6">Alumno</th>
                    <th className="px-8 py-6">Último Plan</th>
                    <th className="px-8 py-6">Matrícula y Fin</th>
                    <th className="px-8 py-6 text-center">Estado</th>
                    <th className="px-8 py-6 text-right">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {isLoading ? (
                    <tr><td colSpan={5} className="py-20 text-center text-zinc-600 font-bold uppercase animate-pulse">Sincronizando base de datos...</td></tr>
                  ) : filteredAlumnos.length === 0 ? (
                    <tr><td colSpan={5} className="py-20 text-center text-zinc-600 font-bold uppercase">Sin resultados</td></tr>
                  ) : filteredAlumnos.map((a) => {
                    const days = a.lastEndDate ? getDaysRemaining(a.lastEndDate) : null;
                    return (
                      <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-8 py-6 font-bold text-white">{a.firstName} {a.lastName} {a.phone && <p className="text-[10px] text-zinc-600 font-mono mt-1">{a.phone}</p>}</td>
                        <td className="px-8 py-6">{a.lastPlan ? <span className="bg-zinc-800 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-zinc-700">{PLAN_DETAILS[a.lastPlan]?.label}</span> : <span className="text-zinc-600 text-xs">Sin matrícula</span>}</td>
                        <td className="px-8 py-6 text-sm">
                          {a.lastStartDate ? <><span className="text-zinc-500">{a.lastStartDate}</span> <span className="text-white font-bold ml-2">→ {a.lastEndDate}</span></> : <span className="text-zinc-600">—</span>}
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-center">
                            {days === null ? (
                              <span className="bg-zinc-800 text-zinc-500 px-3 py-1 rounded-full text-[10px] font-black">Sin matrícula</span>
                            ) : days < 0 ? (
                              <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-[10px] font-black">No renovó</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                <div className={`size-2 rounded-full shadow-[0_0_8px] ${days <= 7 ? 'bg-amber-500 animate-pulse shadow-amber-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
                                <span className={`text-xs font-black ${days <= 7 ? 'text-amber-500' : 'text-emerald-400'}`}>{days} días</span>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right relative">
                          <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                            <a href={generateWhatsAppLink({ firstName: a.firstName, lastName: a.lastName, phone: a.phone, startDate: a.lastStartDate, endDate: a.lastEndDate })} target="_blank" className="p-2.5 text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all"><MessageCircle size={18} /></a>
                            <button onClick={() => openNewMatricula(a)} title="Nueva matrícula" className="p-2.5 text-zinc-400 hover:bg-zinc-800 rounded-xl transition-all"><Plus size={18} /></button>
                            <button onClick={() => setDeleteAlumno(a)} title="Eliminar alumno" className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left border-collapse relative z-10">
                <thead>
                  <tr className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em] border-b border-zinc-800/50">
                    <th className="px-8 py-6">Alumno</th>
                    <th className="px-8 py-6">Plan</th>
                    <th className="px-8 py-6">Inicio</th>
                    <th className="px-8 py-6">Fin</th>
                    <th className="px-8 py-6">Monto</th>
                    <th className="px-8 py-6">Obs.</th>
                    <th className="px-8 py-6 text-right">Gestión</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/30">
                  {isLoading ? (
                    <tr><td colSpan={6} className="py-20 text-center text-zinc-600 font-bold uppercase animate-pulse">Sincronizando base de datos...</td></tr>
                  ) : filteredMatriculas.length === 0 ? (
                    <tr><td colSpan={6} className="py-20 text-center text-zinc-600 font-bold uppercase">Sin resultados</td></tr>
                  ) : filteredMatriculas.map((m) => (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                      <td className="px-8 py-6 font-bold text-white">{m.firstName} {m.lastName}</td>
                      <td className="px-8 py-6"><span className="bg-zinc-800 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-zinc-700">{PLAN_DETAILS[m.plan]?.label}</span></td>
                      <td className="px-8 py-6 text-sm text-zinc-400">{formatFriendlyDate(m.startDate)}</td>
                      <td className="px-8 py-6 text-sm text-white font-bold">{formatFriendlyDate(m.endDate)}</td>
                      <td className="px-8 py-6 text-sm text-yellow-500 font-black">S/ {Number(m.amount || 0).toFixed(2)}</td>
                      <td className="px-8 py-6 text-xs text-zinc-500 max-w-[140px] truncate" title={m.observation || ''}>{m.observation || '—'}</td>
                      <td className="px-8 py-6 text-right relative">
                        <div className="flex justify-end gap-3 opacity-40 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setDeleteMatricula(m)} title="Eliminar matrícula" className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        )}
      </main>

      <MemberModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setPreselectedAlumno(null); }}
        onSaved={fetchData}
        preselectedAlumno={preselectedAlumno}
      />

      <AnimatePresence>
        {deleteAlumno && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl" >
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20"><AlertTriangle size={36} /></div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">¿Eliminar alumno?</h2>
                  <p className="text-sm text-zinc-400 mt-2">Se eliminará a <strong className="text-white">{deleteAlumno.firstName} {deleteAlumno.lastName}</strong> y todo su historial de matrículas. Esta acción no se puede deshacer.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                  <button onClick={() => setDeleteAlumno(null)} className="w-full py-3 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-zinc-800/50 rounded-xl">No, Cancelar</button>
                  <button onClick={confirmDeleteAlumno} className="w-full py-3 bg-red-500 text-white font-black uppercase text-xs rounded-xl hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95 flex items-center justify-center gap-2">
                    <Trash2 size={16} />Sí, Eliminar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {deleteMatricula && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{ opacity: 0, scale: 0.9, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 30 }}
              className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl backdrop-blur-xl" >
              <div className="flex flex-col items-center gap-6 text-center">
                <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20"><AlertTriangle size={36} /></div>
                <div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tighter">¿Eliminar matrícula?</h2>
                  <p className="text-sm text-zinc-400 mt-2">Se eliminará esta matrícula de <strong className="text-white">{deleteMatricula.firstName} {deleteMatricula.lastName}</strong>. El alumno seguirá en el registro.</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                  <button onClick={() => setDeleteMatricula(null)} className="w-full py-3 text-zinc-500 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest bg-zinc-800/50 rounded-xl">No, Cancelar</button>
                  <button onClick={confirmDeleteMatricula} className="w-full py-3 bg-red-500 text-white font-black uppercase text-xs rounded-xl hover:bg-red-600 transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] active:scale-95 flex items-center justify-center gap-2">
                    <Trash2 size={16} />Sí, Eliminar
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
