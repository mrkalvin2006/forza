// src/components/Dashboard.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Plus, Trash2, LogOut, Users, AlertTriangle, ShieldCheck, History, Wallet, Pencil, X, Zap, UserCog } from 'lucide-react';
import { AlumnoConEstado, MatriculaConAlumno, SesionLibre, PLAN_DETAILS, PlanType, UserRole } from '../types';
import { getDaysRemaining, formatFriendlyDate, getTodayString, getMonthLabel } from '../utils';
import MemberModal from './MemberModal';
import SesionModal from './SesionModal';
import { supabase } from '../supabase';
import ForzaLogo from '../assets/logo-forza.png';
import GymBackground from '../assets/gym-background.png';

// Semáforo: verde >20d, naranja ≤20d, rojo ≤5d, gris vencido
function DaysBadge({ days }: { days: number | null }) {
  if (days === null) return <span className="text-[10px] text-zinc-600 font-black">Sin matrícula</span>;
  if (days < 0)  return <span className="px-3 py-1 rounded-full text-[10px] font-black bg-zinc-800 text-zinc-500 border border-zinc-700">Vencido</span>;
  const color = days <= 5 ? 'bg-red-500/10 text-red-400 border-red-500/30 shadow-red-500/20'
              : days <= 20 ? 'bg-orange-500/10 text-orange-400 border-orange-500/30 shadow-orange-500/20'
              : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/20';
  const dot = days <= 5 ? 'bg-red-500 shadow-red-500/60' : days <= 20 ? 'bg-orange-400 shadow-orange-400/60' : 'bg-emerald-400 shadow-emerald-400/60';
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black border ${color} shadow-[0_0_10px]`}>
      <span className={`size-1.5 rounded-full ${dot} shadow-[0_0_6px] ${days <= 5 ? 'animate-pulse' : ''}`} />
      {days}d
    </span>
  );
}

interface DashboardProps {
  onLogout: () => void;
  userRole: UserRole;
}

export default function Dashboard({ onLogout, userRole }: DashboardProps) {
  const isAdmin  = userRole === 'admin';
  const isAsesor = userRole === 'asesor';

  const [alumnos, setAlumnos]       = useState<AlumnoConEstado[]>([]);
  const [matriculas, setMatriculas] = useState<MatriculaConAlumno[]>([]);
  const [sesiones, setSesiones]     = useState<SesionLibre[]>([]);
  const [view, setView]             = useState<'alumnos' | 'matriculas' | 'caja'>('alumnos');
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter]         = useState<'all' | 'nextMonth' | 'expired'>('all');
  const [isModalOpen, setIsModalOpen]       = useState(false);
  const [isSesionModalOpen, setIsSesionModalOpen] = useState(false);
  const [preselectedAlumno, setPreselectedAlumno] = useState<AlumnoConEstado | null>(null);
  const [isLoading, setIsLoading]   = useState(true);

  // Estado modales: eliminar
  const [deleteAlumno,    setDeleteAlumno]    = useState<AlumnoConEstado | null>(null);
  const [deleteMatricula, setDeleteMatricula] = useState<MatriculaConAlumno | null>(null);

  // Estado modal: editar alumno
  const [editAlumno, setEditAlumno] = useState<AlumnoConEstado | null>(null);
  const [editAlumnoForm, setEditAlumnoForm] = useState<{ firstName: string; lastName: string; phone: string; dni: string } | null>(null);

  // Estado modal: editar matrícula
  const [editMatricula, setEditMatricula] = useState<MatriculaConAlumno | null>(null);
  const [editMatriculaForm, setEditMatriculaForm] = useState<{ plan: string; startDate: string; endDate: string; amount: string; observation: string } | null>(null);

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [{ data: ad }, { data: md }, { data: sd }] = await Promise.all([
      supabase.from('alumnos').select('*').order('created_at', { ascending: false }),
      supabase.from('matriculas').select('*').order('start_date', { ascending: false }),
      supabase.from('sesiones_libres').select('*').order('session_date', { ascending: false }),
    ]);
    const rawA = ad || [], rawM = md || [], rawS = sd || [];

    const alumnosMapped: AlumnoConEstado[] = rawA.map((a: any) => {
      const suyas = rawM.filter((m: any) => m.alumno_id === a.id);
      const ult   = suyas.sort((x: any, y: any) => (x.end_date < y.end_date ? 1 : -1))[0];
      return { id: a.id, firstName: a.first_name, lastName: a.last_name, dni: a.dni, phone: a.phone,
               lastMatriculaId: ult?.id || null, lastPlan: ult?.plan || null,
               lastStartDate: ult?.start_date || null, lastEndDate: ult?.end_date || null, lastAmount: ult?.amount || null };
    });
    const aById = new Map(rawA.map((a: any) => [a.id, a]));
    const matriculasMapped: MatriculaConAlumno[] = rawM.map((m: any) => {
      const a: any = aById.get(m.alumno_id) || {};
      return { id: m.id, alumnoId: m.alumno_id, plan: m.plan, startDate: m.start_date, endDate: m.end_date,
               amount: m.amount, observation: m.observation || null,
               firstName: a.first_name || '(eliminado)', lastName: a.last_name || null, dni: a.dni || null };
    });
    const sesionesMapped: SesionLibre[] = rawS.map((s: any) => ({
      id: s.id, description: s.description, amount: s.amount,
      sessionDate: s.session_date, createdAt: s.created_at,
    }));

    setAlumnos(alumnosMapped);
    setMatriculas(matriculasMapped);
    setSesiones(sesionesMapped);
    setIsLoading(false);
  };

  // ── Acciones Alumno ─────────────────────────────────
  const openEditAlumno = (a: AlumnoConEstado) => {
    setEditAlumno(a);
    setEditAlumnoForm({ firstName: a.firstName, lastName: a.lastName || '', phone: a.phone || '', dni: a.dni || '' });
  };
  const saveEditAlumno = async () => {
    if (!editAlumno || !editAlumnoForm) return;
    await supabase.from('alumnos').update({
      first_name: editAlumnoForm.firstName,
      last_name: editAlumnoForm.lastName.trim() || null,
      phone: editAlumnoForm.phone.trim() || null,
      dni: editAlumnoForm.dni.trim() || null,
    }).eq('id', editAlumno.id);
    setEditAlumno(null); setEditAlumnoForm(null); fetchData();
  };
  const confirmDeleteAlumno = async () => {
    if (!deleteAlumno) return;
    await supabase.from('alumnos').delete().eq('id', deleteAlumno.id);
    setDeleteAlumno(null); fetchData();
  };

  // ── Acciones Matrícula ──────────────────────────────
  const openEditMatricula = (m: MatriculaConAlumno) => {
    setEditMatricula(m);
    setEditMatriculaForm({ plan: m.plan, startDate: m.startDate, endDate: m.endDate, amount: String(m.amount || ''), observation: m.observation || '' });
  };
  const saveEditMatricula = async () => {
    if (!editMatricula || !editMatriculaForm) return;
    await supabase.from('matriculas').update({
      plan: editMatriculaForm.plan,
      start_date: editMatriculaForm.startDate,
      end_date: editMatriculaForm.endDate,
      amount: parseFloat(editMatriculaForm.amount) || 0,
      observation: editMatriculaForm.observation.trim() || null,
    }).eq('id', editMatricula.id);
    setEditMatricula(null); setEditMatriculaForm(null); fetchData();
  };
  const confirmDeleteMatricula = async () => {
    if (!deleteMatricula) return;
    await supabase.from('matriculas').delete().eq('id', deleteMatricula.id);
    setDeleteMatricula(null); fetchData();
  };

  // ── Estadísticas ─────────────────────────────────────
  const todayStr      = getTodayString();
  const monthKeyToday = todayStr.slice(0, 7);

  const stats = {
    total:   alumnos.length,
    active:  alumnos.filter((a) => a.lastEndDate && getDaysRemaining(a.lastEndDate) >= 0).length,
    expired: alumnos.filter((a) => !a.lastEndDate || getDaysRemaining(a.lastEndDate) < 0).length,
    totalRecaudado: matriculas.filter((m) => m.startDate.slice(0, 7) === monthKeyToday).reduce((s, m) => s + (Number(m.amount) || 0), 0)
                  + sesiones.filter((s) => s.sessionDate.slice(0, 7) === monthKeyToday).reduce((acc, s) => acc + (Number(s.amount) || 0), 0),
  };

  // Caja: incluye matrículas + sesiones libres
  const cajaHoy = matriculas.filter((m) => m.startDate === todayStr).reduce((s, m) => s + Number(m.amount || 0), 0)
                + sesiones.filter((s) => s.sessionDate === todayStr).reduce((acc, s) => acc + Number(s.amount || 0), 0);
  const cajaSemana = (() => {
    const [y,mo,d] = todayStr.split('-').map(Number);
    const today = new Date(y, mo-1, d);
    const dow = today.getDay();
    const mon = new Date(today); mon.setDate(today.getDate() + (dow === 0 ? -6 : 1 - dow));
    const sat = new Date(mon);   sat.setDate(mon.getDate() + 5);
    const matSum = matriculas.filter((m) => { const md = new Date(m.startDate); return md >= mon && md <= sat; }).reduce((s,m)=>s+Number(m.amount||0),0);
    const sesSum = sesiones.filter((s)   => { const sd = new Date(s.sessionDate); return sd >= mon && sd <= sat; }).reduce((acc,s)=>acc+Number(s.amount||0),0);
    return matSum + sesSum;
  })();
  const cajaMes = matriculas.filter((m) => m.startDate.slice(0,7) === monthKeyToday).reduce((s,m)=>s+Number(m.amount||0),0)
                + sesiones.filter((s) => s.sessionDate.slice(0,7) === monthKeyToday).reduce((acc,s)=>acc+Number(s.amount||0),0);

  // Historial mensual unificado
  const cajaHistorial = (() => {
    const map = new Map<string,{totalMat:number;countMat:number;totalSes:number;countSes:number}>();
    matriculas.forEach((m) => {
      const k = m.startDate.slice(0,7);
      const cur = map.get(k) || {totalMat:0,countMat:0,totalSes:0,countSes:0};
      cur.totalMat += Number(m.amount||0); cur.countMat++;
      map.set(k,cur);
    });
    sesiones.forEach((s) => {
      const k = s.sessionDate.slice(0,7);
      const cur = map.get(k) || {totalMat:0,countMat:0,totalSes:0,countSes:0};
      cur.totalSes += Number(s.amount||0); cur.countSes++;
      map.set(k,cur);
    });
    return Array.from(map.entries()).sort((a,b) => b[0].localeCompare(a[0]));
  })();

  const matriculasMesActual = matriculas.filter((m) => m.startDate.slice(0,7) === monthKeyToday);
  const sesionesMesActual   = sesiones.filter((s) => s.sessionDate.slice(0,7) === monthKeyToday);

  // ── Filtros de lista ─────────────────────────────────
  const filteredAlumnos = alumnos.filter((a) => {
    const q = `${a.firstName} ${a.lastName||''} ${a.phone||''} ${a.dni||''}`.toLowerCase();
    if (!q.includes(searchTerm.toLowerCase())) return false;
    const days = a.lastEndDate ? getDaysRemaining(a.lastEndDate) : -Infinity;
    if (filter === 'nextMonth') return days >= 0 && days <= 30;
    if (filter === 'expired')   return days < 0;
    return true;
  });
  const filteredMatriculas = matriculas.filter((m) => {
    const q = `${m.firstName} ${m.lastName||''} ${m.dni||''}`.toLowerCase();
    return q.includes(searchTerm.toLowerCase());
  });

  // ── Helpers ──────────────────────────────────────────
  const inputCls = "w-full px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-yellow-500/50 transition-all";
  const labelCls = "text-[10px] font-black text-zinc-500 uppercase tracking-widest ml-1";

  // Tabs disponibles según rol
  const availableTabs = isAdmin
    ? (['alumnos','matriculas','caja'] as const)
    : (['alumnos','matriculas'] as const);

  return (
    <div className="min-h-screen bg-black text-zinc-100 font-sans pb-10 relative overflow-hidden bg-cover bg-center"
         style={{ backgroundImage: `url(${GymBackground})` }}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-0" />

      {/* HEADER */}
      <header className="border-b border-zinc-800/60 bg-black/70 backdrop-blur-2xl sticky top-0 z-40 relative shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
        <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-[linear-gradient(90deg,transparent_0%,#EAB308_50%,transparent_100%)] opacity-30" />
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <img src={ForzaLogo} alt="Logo" className="max-h-14 w-auto drop-shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
            <div className="flex flex-col">
              <h1 className="text-xl font-black tracking-tighter uppercase text-white flex items-center gap-2">
                <Users className="text-yellow-500" size={22} />
                {view === 'alumnos' ? 'Alumnos' : view === 'matriculas' ? 'Matrículas' : 'Flujo de Caja'}
              </h1>
              {/* Badge de rol */}
              <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full w-fit mt-0.5 ${
                isAdmin ? 'bg-yellow-500/20 text-yellow-500' : 'bg-blue-500/20 text-blue-400'
              }`}>
                {isAdmin ? '🔐 Administrador' : '🎯 Asesor'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Botón Sesión Libre - siempre visible */}
            <button onClick={() => setIsSesionModalOpen(true)}
              className="bg-purple-600 text-white px-5 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-purple-500 transition-all text-xs uppercase tracking-widest active:scale-95">
              <Zap size={16} /> Sesión Libre
            </button>
            {/* Botón Nueva Matrícula - siempre visible */}
            <button onClick={() => { setPreselectedAlumno(null); setIsModalOpen(true); }}
              className="bg-white text-black px-5 py-2.5 rounded-xl font-black flex items-center gap-2 hover:bg-yellow-500 hover:text-white transition-all text-xs uppercase tracking-widest active:scale-95">
              <Plus size={16} /> Nueva Matrícula
            </button>
            <button onClick={onLogout} className="p-2.5 text-zinc-500 hover:text-white hover:bg-zinc-800/50 rounded-full transition-all">
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* PANEL DE ASESOR - vista restringida */}
      {isAsesor && (
        <div className="max-w-7xl mx-auto px-6 pt-6 relative z-10">
          <div className="flex items-start gap-4 bg-blue-500/10 border border-blue-500/30 rounded-2xl p-5">
            <UserCog className="text-blue-400 mt-0.5 shrink-0" size={22} />
            <div>
              <p className="text-blue-400 font-black text-sm">Modo Asesor</p>
              <p className="text-blue-400/70 text-xs mt-0.5">Puedes registrar matrículas y sesiones libres. El kardex general, caja e ingresos son visibles solo para el administrador.</p>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto p-6 relative z-10 space-y-8">
        {/* TABS */}
        <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800 w-fit">
          {availableTabs.map((v) => (
            <button key={v} onClick={() => { setView(v as any); setSearchTerm(''); setFilter('all'); }}
              className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-tighter transition-all flex items-center gap-2
                ${view === v ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'}`}>
              {v === 'alumnos' ? <><Users size={14}/>Alumnos</> : v === 'matriculas' ? <><History size={14}/>Matrículas</> : <><Wallet size={14}/>Caja</>}
            </button>
          ))}
        </div>

        {/* STATS - solo admin */}
        {isAdmin && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label:'Total Alumnos',    val: stats.total,   icon:<Users size={22}/>,        cls:'text-zinc-400',   bg:'bg-zinc-800' },
              { label:'Activos',          val: stats.active,  icon:<ShieldCheck size={22}/>,  cls:'text-emerald-500',bg:'bg-emerald-500/10' },
              { label:'No Renovaron',     val: stats.expired, icon:<AlertTriangle size={22}/>,cls:'text-red-400',    bg:'bg-red-500/10' },
              { label:'Recaudado (mes)',   val:`S/ ${stats.totalRecaudado.toFixed(2)}`, icon:<Wallet size={22}/>, cls:'text-yellow-500', bg:'bg-yellow-500/10' },
            ].map((s) => (
              <div key={s.label} className="bg-zinc-900/40 border border-zinc-800/60 p-5 rounded-3xl backdrop-blur-sm">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 ${s.bg} rounded-xl ${s.cls}`}>{s.icon}</div>
                  <div>
                    <p className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">{s.label}</p>
                    <p className="text-2xl font-bold">{isLoading ? '…' : s.val}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* VISTA: ALUMNOS                                */}
        {/* ══════════════════════════════════════════════ */}
        {view === 'alumnos' && (
          <div className="space-y-4">
            {/* Asesor: solo puede ver el buscador básico (no filtros avanzados) */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              {isAdmin && (
                <div className="flex gap-2 bg-zinc-900/80 p-1.5 rounded-2xl border border-zinc-800">
                  {[['all','Todos'],['nextMonth','Vence en 1 mes'],['expired','No renovaron']].map(([val,lbl]) => (
                    <button key={val} onClick={() => setFilter(val as any)}
                      className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-tighter transition-all
                        ${filter===val ? (val==='expired'?'bg-red-600 text-white':val==='nextMonth'?'bg-blue-600 text-white':'bg-white text-black') : 'text-zinc-500 hover:text-white'}`}>
                      {lbl}
                    </button>
                  ))}
                </div>
              )}
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={16} />
                <input type="text" placeholder="Buscar por nombre, DNI, cel..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3 focus:border-zinc-500 transition-all outline-none text-sm placeholder:text-zinc-700"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-yellow-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/50">
                      <th className="px-6 py-5">Alumno</th>
                      <th className="px-6 py-5">Plan</th>
                      <th className="px-6 py-5">Matrícula y Fin</th>
                      <th className="px-6 py-5 text-center">Días</th>
                      {/* Asesor no gestiona alumnos directamente */}
                      {isAdmin && <th className="px-6 py-5 text-right">Gestión</th>}
                      {isAsesor && <th className="px-6 py-5 text-right">Renovar</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {isLoading ? (
                      <tr><td colSpan={isAdmin ? 5 : 5} className="py-16 text-center text-zinc-600 text-sm animate-pulse">Cargando...</td></tr>
                    ) : filteredAlumnos.length === 0 ? (
                      <tr><td colSpan={5} className="py-16 text-center text-zinc-600 text-sm">Sin resultados</td></tr>
                    ) : filteredAlumnos.map((a) => {
                      const days = a.lastEndDate ? getDaysRemaining(a.lastEndDate) : null;
                      return (
                        <tr key={a.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-5">
                            <p className="font-bold text-white">{a.firstName} {a.lastName||''}</p>
                            <p className="text-[10px] text-zinc-600 mt-0.5">{a.dni||''} {a.phone ? `· ${a.phone}` : ''}</p>
                          </td>
                          <td className="px-6 py-5">
                            {a.lastPlan
                              ? <span className="bg-zinc-800 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-zinc-700">{PLAN_DETAILS[a.lastPlan]?.label}</span>
                              : <span className="text-zinc-600 text-xs">—</span>}
                          </td>
                          <td className="px-6 py-5 text-sm">
                            {a.lastStartDate
                              ? <><span className="text-zinc-500">{a.lastStartDate}</span><span className="text-white font-bold ml-2">→ {a.lastEndDate}</span></>
                              : <span className="text-zinc-600">—</span>}
                          </td>
                          <td className="px-6 py-5 text-center"><DaysBadge days={days} /></td>
                          {isAdmin && (
                            <td className="px-6 py-5 text-right">
                              <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => openEditAlumno(a)} title="Editar alumno"
                                  className="p-2.5 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"><Pencil size={16} /></button>
                                <button onClick={() => setDeleteAlumno(a)} title="Eliminar alumno"
                                  className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                              </div>
                            </td>
                          )}
                          {isAsesor && (
                            <td className="px-6 py-5 text-right">
                              <button
                                onClick={() => { setPreselectedAlumno(a); setIsModalOpen(true); }}
                                className="p-2.5 text-yellow-400 hover:bg-yellow-500/10 rounded-xl transition-all opacity-40 group-hover:opacity-100"
                                title="Registrar nueva matrícula">
                                <Plus size={16} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* VISTA: MATRÍCULAS                             */}
        {/* ══════════════════════════════════════════════ */}
        {view === 'matriculas' && (
          <div className="space-y-4">
            <div className="flex justify-end">
              <div className="relative w-full md:w-80 group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-white transition-colors" size={16} />
                <input type="text" placeholder="Buscar por nombre o DNI..."
                  className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl pl-11 pr-4 py-3 focus:border-zinc-500 transition-all outline-none text-sm placeholder:text-zinc-700"
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
            </div>
            <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-yellow-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/50">
                      <th className="px-6 py-5">Alumno</th>
                      <th className="px-6 py-5">Plan</th>
                      <th className="px-6 py-5">Inicio → Fin</th>
                      <th className="px-6 py-5">Monto</th>
                      <th className="px-6 py-5">Observación</th>
                      {isAdmin && <th className="px-6 py-5 text-right">Gestión</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {isLoading ? (
                      <tr><td colSpan={isAdmin ? 6 : 5} className="py-16 text-center text-zinc-600 text-sm animate-pulse">Cargando...</td></tr>
                    ) : filteredMatriculas.length === 0 ? (
                      <tr><td colSpan={isAdmin ? 6 : 5} className="py-16 text-center text-zinc-600 text-sm">Sin resultados</td></tr>
                    ) : filteredMatriculas.map((m) => (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="px-6 py-5">
                          <p className="font-bold text-white">{m.firstName} {m.lastName||''}</p>
                          {m.dni && <p className="text-[10px] text-zinc-600 mt-0.5">{m.dni}</p>}
                        </td>
                        <td className="px-6 py-5">
                          <span className="bg-zinc-800 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase border border-zinc-700">{PLAN_DETAILS[m.plan]?.label}</span>
                        </td>
                        <td className="px-6 py-5 text-sm">
                          <span className="text-zinc-500">{m.startDate}</span>
                          <span className="text-white font-bold ml-2">→ {m.endDate}</span>
                        </td>
                        <td className="px-6 py-5 text-yellow-500 font-black text-sm">S/ {Number(m.amount||0).toFixed(2)}</td>
                        <td className="px-6 py-5 text-xs text-zinc-500 max-w-[140px] truncate" title={m.observation||''}>{m.observation||'—'}</td>
                        {isAdmin && (
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openEditMatricula(m)} title="Editar matrícula"
                                className="p-2.5 text-blue-400 hover:bg-blue-500/10 rounded-xl transition-all"><Pencil size={16} /></button>
                              <button onClick={() => setDeleteMatricula(m)} title="Eliminar matrícula"
                                className="p-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════ */}
        {/* VISTA: CAJA — solo admin                      */}
        {/* ══════════════════════════════════════════════ */}
        {view === 'caja' && isAdmin && (
          <div className="space-y-8">
            {/* Resumen rápido */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[['Hoy',cajaHoy],['Esta Semana',cajaSemana],['Este Mes',cajaMes]].map(([lbl,val]) => (
                <div key={lbl as string} className="bg-zinc-900/40 border border-zinc-800/60 p-6 rounded-3xl backdrop-blur-sm">
                  <p className="text-xs font-black text-yellow-500 uppercase tracking-widest mb-1">{lbl as string}</p>
                  <p className="text-3xl font-bold">S/ {(val as number).toFixed(2)}</p>
                </div>
              ))}
            </div>

            {/* Historial mensual */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-widest">
                <Wallet size={14} className="text-yellow-500" /> Historial Mensual
              </div>
              <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-yellow-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/50">
                      <th className="px-8 py-5">Período</th>
                      <th className="px-8 py-5">Matrículas</th>
                      <th className="px-8 py-5">Sesiones</th>
                      <th className="px-8 py-5 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {isLoading ? (
                      <tr><td colSpan={4} className="py-16 text-center text-zinc-600 text-sm animate-pulse">Cargando...</td></tr>
                    ) : cajaHistorial.length === 0 ? (
                      <tr><td colSpan={4} className="py-16 text-center text-zinc-600 text-sm">Sin ingresos aún</td></tr>
                    ) : cajaHistorial.map(([key,{totalMat,countMat,totalSes,countSes}]) => (
                      <tr key={key} className={`hover:bg-white/[0.02] transition-colors ${key===monthKeyToday?'bg-yellow-500/5':''}`}>
                        <td className="px-8 py-5 font-bold text-white flex items-center gap-2 capitalize">
                          {getMonthLabel(key)}
                          {key===monthKeyToday && <span className="text-[9px] bg-yellow-500 text-black font-black px-2 py-0.5 rounded-full">Actual</span>}
                        </td>
                        <td className="px-8 py-5 text-zinc-400 text-sm">{countMat} <span className="text-zinc-600 text-xs">(S/ {totalMat.toFixed(2)})</span></td>
                        <td className="px-8 py-5 text-purple-400 text-sm">{countSes} <span className="text-zinc-600 text-xs">(S/ {totalSes.toFixed(2)})</span></td>
                        <td className="px-8 py-5 text-right text-yellow-500 font-black">S/ {(totalMat+totalSes).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Matrículas del mes actual */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-widest">
                <History size={14} className="text-yellow-500" /> Matrículas de este mes ({matriculasMesActual.length})
              </div>
              <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-yellow-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/50">
                      <th className="px-6 py-4">Alumno</th>
                      <th className="px-6 py-4">Plan</th>
                      <th className="px-6 py-4">Inicio → Fin</th>
                      <th className="px-6 py-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {matriculasMesActual.length === 0 ? (
                      <tr><td colSpan={4} className="py-10 text-center text-zinc-600 text-xs">Sin matrículas este mes</td></tr>
                    ) : matriculasMesActual.map((m) => (
                      <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-bold text-white text-sm">{m.firstName} {m.lastName||''}</td>
                        <td className="px-6 py-4"><span className="bg-zinc-800 px-2 py-1 rounded-lg text-[10px] font-black uppercase border border-zinc-700">{PLAN_DETAILS[m.plan]?.label}</span></td>
                        <td className="px-6 py-4 text-xs text-zinc-400">{m.startDate} <span className="text-white font-bold">→ {m.endDate}</span></td>
                        <td className="px-6 py-4 text-right text-yellow-500 font-black text-sm">S/ {Number(m.amount||0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Sesiones Libres del mes actual */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-zinc-400 text-xs font-black uppercase tracking-widest">
                <Zap size={14} className="text-purple-500" /> Sesiones Libres este mes ({sesionesMesActual.length})
              </div>
              <div className="bg-zinc-900/20 border border-zinc-800 rounded-[2rem] overflow-hidden backdrop-blur-md">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-yellow-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/50">
                      <th className="px-6 py-4">Descripción</th>
                      <th className="px-6 py-4">Fecha</th>
                      <th className="px-6 py-4 text-right">Monto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/30">
                    {sesionesMesActual.length === 0 ? (
                      <tr><td colSpan={3} className="py-10 text-center text-zinc-600 text-xs">Sin sesiones libres este mes</td></tr>
                    ) : sesionesMesActual.map((s) => (
                      <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4 font-bold text-purple-300 text-sm flex items-center gap-2"><Zap size={14} className="text-purple-500" />{s.description}</td>
                        <td className="px-6 py-4 text-xs text-zinc-400">{s.sessionDate}</td>
                        <td className="px-6 py-4 text-right text-purple-400 font-black text-sm">S/ {Number(s.amount||0).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: NUEVA MATRÍCULA */}
      <MemberModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setPreselectedAlumno(null); }}
        onSaved={fetchData}
        preselectedAlumno={preselectedAlumno}
      />

      {/* MODAL: SESIÓN LIBRE */}
      <AnimatePresence>
        {isSesionModalOpen && (
          <SesionModal
            onClose={() => setIsSesionModalOpen(false)}
            onSaved={fetchData}
          />
        )}
      </AnimatePresence>

      {/* MODAL: EDITAR ALUMNO */}
      <AnimatePresence>
        {editAlumno && editAlumnoForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{opacity:0,scale:0.95,y:30}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:30}}
              className="w-full max-w-md bg-black/90 border border-zinc-800 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl overflow-hidden">
              <div className="flex justify-between items-center p-7 border-b border-zinc-800/50">
                <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                  <Pencil className="text-blue-400" size={20}/> Editar Alumno
                </h2>
                <button onClick={() => { setEditAlumno(null); setEditAlumnoForm(null); }} className="text-zinc-500 hover:text-white p-2 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-7 space-y-4">
                <div className="flex items-center gap-2 border-l-4 border-yellow-500 pl-3 mb-2">
                  <span className="text-xs font-black text-yellow-500 uppercase tracking-widest">Datos personales del alumno</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className={labelCls}>Nombre *</label>
                    <input className={inputCls} value={editAlumnoForm.firstName} onChange={(e) => setEditAlumnoForm({...editAlumnoForm, firstName:e.target.value})} /></div>
                  <div className="space-y-1"><label className={labelCls}>Apellido</label>
                    <input className={inputCls} value={editAlumnoForm.lastName} onChange={(e) => setEditAlumnoForm({...editAlumnoForm, lastName:e.target.value})} /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className={labelCls}>Celular</label>
                    <input className={inputCls} maxLength={9} value={editAlumnoForm.phone} onChange={(e) => setEditAlumnoForm({...editAlumnoForm, phone:e.target.value})} /></div>
                  <div className="space-y-1"><label className={labelCls}>DNI</label>
                    <input className={inputCls} maxLength={8} value={editAlumnoForm.dni} onChange={(e) => setEditAlumnoForm({...editAlumnoForm, dni:e.target.value})} /></div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setEditAlumno(null); setEditAlumnoForm(null); }}
                    className="w-full py-3 text-zinc-500 hover:text-white text-xs font-bold uppercase bg-zinc-800/50 rounded-xl transition-all">Cancelar</button>
                  <button onClick={saveEditAlumno}
                    className="w-full py-3 bg-blue-500 text-white font-black text-xs uppercase rounded-xl hover:bg-blue-400 transition-all flex items-center justify-center gap-2 active:scale-95">
                    <Pencil size={14}/> Guardar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: EDITAR MATRÍCULA */}
      <AnimatePresence>
        {editMatricula && editMatriculaForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{opacity:0,scale:0.95,y:30}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.95,y:30}}
              className="w-full max-w-md bg-black/90 border border-zinc-800 rounded-[2.5rem] shadow-2xl backdrop-blur-2xl overflow-hidden">
              <div className="flex justify-between items-center p-7 border-b border-zinc-800/50">
                <h2 className="text-lg font-black text-white uppercase tracking-tighter flex items-center gap-3">
                  <Pencil className="text-emerald-400" size={20}/> Editar Matrícula
                </h2>
                <button onClick={() => { setEditMatricula(null); setEditMatriculaForm(null); }} className="text-zinc-500 hover:text-white p-2 rounded-full"><X size={20}/></button>
              </div>
              <div className="p-7 space-y-4">
                <div className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3 mb-2">
                  <span className="text-xs font-black text-emerald-500 uppercase tracking-widest">Datos de la matrícula</span>
                </div>
                <p className="text-sm text-zinc-400">Alumno: <span className="text-white font-bold">{editMatricula.firstName} {editMatricula.lastName||''}</span></p>
                <div className="space-y-1"><label className={labelCls}>Plan</label>
                  <select className={`${inputCls} appearance-none font-bold`} value={editMatriculaForm.plan} onChange={(e) => setEditMatriculaForm({...editMatriculaForm, plan:e.target.value})}>
                    {Object.entries(PLAN_DETAILS).map(([k,d]) => <option key={k} value={k}>{d.label} — S/{d.price}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1"><label className={labelCls}>Fecha Inicio</label>
                    <input type="date" className={`${inputCls} [color-scheme:dark]`} value={editMatriculaForm.startDate} onChange={(e) => setEditMatriculaForm({...editMatriculaForm, startDate:e.target.value})} /></div>
                  <div className="space-y-1"><label className={labelCls}>Fecha Fin</label>
                    <input type="date" className={`${inputCls} [color-scheme:dark]`} value={editMatriculaForm.endDate} onChange={(e) => setEditMatriculaForm({...editMatriculaForm, endDate:e.target.value})} /></div>
                </div>
                <div className="space-y-1"><label className={labelCls}>Monto S/</label>
                  <input type="number" min="0" step="0.01" className={`${inputCls} font-bold`} value={editMatriculaForm.amount} onChange={(e) => setEditMatriculaForm({...editMatriculaForm, amount:e.target.value})} /></div>
                <div className="space-y-1"><label className={labelCls}>Observación</label>
                  <textarea rows={2} className={`${inputCls} resize-none`} value={editMatriculaForm.observation} onChange={(e) => setEditMatriculaForm({...editMatriculaForm, observation:e.target.value})} placeholder="Descuento, motivo... (opcional)" /></div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => { setEditMatricula(null); setEditMatriculaForm(null); }}
                    className="w-full py-3 text-zinc-500 hover:text-white text-xs font-bold uppercase bg-zinc-800/50 rounded-xl transition-all">Cancelar</button>
                  <button onClick={saveEditMatricula}
                    className="w-full py-3 bg-emerald-500 text-white font-black text-xs uppercase rounded-xl hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 active:scale-95">
                    <Pencil size={14}/> Guardar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ELIMINAR ALUMNO */}
      <AnimatePresence>
        {deleteAlumno && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{opacity:0,scale:0.9,y:30}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9,y:30}}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl">
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20"><AlertTriangle size={32}/></div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase">¿Eliminar alumno?</h2>
                  <p className="text-sm text-zinc-400 mt-2">Se eliminará a <strong className="text-white">{deleteAlumno.firstName} {deleteAlumno.lastName||''}</strong> y todo su historial de matrículas.</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setDeleteAlumno(null)} className="w-full py-3 text-zinc-500 bg-zinc-800/50 rounded-xl text-xs font-bold uppercase">Cancelar</button>
                  <button onClick={confirmDeleteAlumno} className="w-full py-3 bg-red-500 text-white font-black text-xs uppercase rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                    <Trash2 size={14}/> Eliminar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL: ELIMINAR MATRÍCULA */}
      <AnimatePresence>
        {deleteMatricula && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div initial={{opacity:0,scale:0.9,y:30}} animate={{opacity:1,scale:1,y:0}} exit={{opacity:0,scale:0.9,y:30}}
              className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-[2rem] p-8 shadow-2xl">
              <div className="flex flex-col items-center gap-5 text-center">
                <div className="p-4 bg-red-500/10 rounded-2xl text-red-500 border border-red-500/20"><AlertTriangle size={32}/></div>
                <div>
                  <h2 className="text-lg font-black text-white uppercase">¿Eliminar matrícula?</h2>
                  <p className="text-sm text-zinc-400 mt-2">Se eliminará la matrícula de <strong className="text-white">{deleteMatricula.firstName}</strong>. El alumno seguirá en el registro.</p>
                </div>
                <div className="flex gap-3 w-full">
                  <button onClick={() => setDeleteMatricula(null)} className="w-full py-3 text-zinc-500 bg-zinc-800/50 rounded-xl text-xs font-bold uppercase">Cancelar</button>
                  <button onClick={confirmDeleteMatricula} className="w-full py-3 bg-red-500 text-white font-black text-xs uppercase rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                    <Trash2 size={14}/> Eliminar</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
