import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard, Store, Package, MessageSquare, Users, Flag, Bell,
  TrendingUp, AlertTriangle, CheckCircle, XCircle, Search, Trash2,
  EyeOff, Eye, ArrowLeft, ChevronRight, Zap, BarChart2, Settings,
  Megaphone, Image, Sparkles, RefreshCw, MapPin, Clock, Star,
  ShieldAlert, ShieldCheck, Mail, Ban, RotateCcw, Edit3, X,
  LogOut, Activity, ToggleLeft, ToggleRight, FlaskConical, Globe,
  UserX, UserCheck, UserMinus, Menu, ChevronDown, PieChart, Filter, Home,
  CreditCard, CalendarDays, Info, Headphones, Send, Reply, MessageCircle, Paperclip,
} from 'lucide-react';

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',       label: 'Resumen',        Icon: LayoutDashboard },
  { id: 'estadisticas',   label: 'Estadísticas',   Icon: BarChart2 },
  { id: 'tiendas',        label: 'Tiendas',        Icon: Store },
  { id: 'productos',      label: 'Productos',      Icon: Package },
  { id: 'demandas',       label: 'Demandas',       Icon: MessageSquare },
  { id: 'usuarios',       label: 'Usuarios',       Icon: Users },
  { id: 'reportes',       label: 'Reportes',       Icon: Flag },
  { id: 'modulos',        label: 'Módulos',        Icon: ToggleRight },
  { id: 'tools',          label: 'Herramientas',   Icon: Settings },
  { id: 'soporte',        label: 'Soporte',        Icon: Headphones },
];

// ─── Feature flags (modules from BASE ESTRATEGICA) ────────────────────────────
const DEFAULT_MODULES = [
  { id: 'mapa',        label: 'Mapa interactivo',     desc: 'Mapa de tiendas y servicios con filtros',        icon: MapPin,        enabled: true,  beta: false, cityLimited: false },
  { id: 'demandas',    label: 'Demandas',             desc: 'Usuarios publican lo que buscan comprar',        icon: MessageSquare, enabled: true,  beta: false, cityLimited: false },
  { id: 'ofertas',     label: 'Ofertas / Catálogo',   desc: 'Tiendas publican productos y precios',           icon: Package,       enabled: true,  beta: false, cityLimited: false },
  { id: 'mensajes',    label: 'Mensajes directos',    desc: 'Chat entre usuarios y tiendas',                  icon: MessageSquare, enabled: true,  beta: false, cityLimited: false },
  { id: 'oportunidades', label: 'Oportunidades',      desc: 'Tiendas ven demandas que coinciden con su rubro',icon: TrendingUp,    enabled: true,  beta: true,  cityLimited: false },
  { id: 'servicios',   label: 'Servicios',            desc: 'Módulo de prestadores de servicios',             icon: Zap,           enabled: false, beta: true,  cityLimited: false },
  { id: 'eventos',     label: 'Eventos locales',      desc: 'Publicación de eventos en la ciudad',            icon: Bell,          enabled: false, beta: true,  cityLimited: false },
  { id: 'suscripciones', label: 'Suscripciones MP',  desc: 'Planes de pago para tiendas vía MercadoPago',    icon: Star,          enabled: true,  beta: false, cityLimited: false },
  { id: 'invitaciones', label: 'Sistema de invites', desc: 'Acceso por invitación para nuevas tiendas',       icon: Mail,          enabled: true,  beta: false, cityLimited: false },
  { id: 'tiendapublica', label: 'Tienda pública',    desc: 'Microsite público por tienda (sin login)',        icon: Globe,         enabled: true,  beta: true,  cityLimited: false },
  { id: 'banners',     label: 'Banners promocionales', desc: 'Banners en el feed home configurables',         icon: Image,         enabled: false, beta: false, cityLimited: false },
  { id: 'push',        label: 'Notificaciones push',  desc: 'Campañas push a usuarios segmentados',           icon: Bell,          enabled: false, beta: false, cityLimited: false },
];

// ─── Mock users ───────────────────────────────────────────────────────────────
const MOCK_USERS = [
  {
    uid: 'u1', nombre: 'María González', email: 'maria@gmail.com', rol: 'usuario',
    tieneTienda: false, suspendido: false, fechaAlta: '2026-05-14',
    ultimaActividad: 'hace 2h', reportesRecibidos: 0, demandasPublicadas: 3,
    productosPublicados: 0, ciudad: 'Rosario', bio: 'Compradora frecuente de tecnología.',
    suscripcion: null,
    activityLog: [
      { tipo: 'demanda',  desc: 'Publicó demanda "Busco auriculares inalámbricos"', fecha: 'hace 2h' },
      { tipo: 'demanda',  desc: 'Publicó demanda "Necesito servicio de plomería"',  fecha: 'hace 1d' },
      { tipo: 'registro', desc: 'Se registró en LOKAL',                             fecha: '2026-05-14' },
    ],
  },
  {
    uid: 'u2', nombre: 'Carlos Medina', email: 'carlos@hotmail.com', rol: 'usuario',
    tieneTienda: true, suspendido: false, fechaAlta: '2026-05-07',
    ultimaActividad: 'hace 20 min', reportesRecibidos: 1, demandasPublicadas: 0,
    productosPublicados: 8, ciudad: 'Rosario', bio: 'Dueño de TecnoStore, especialista en electrónica.',
    suscripcion: { plan: 'Pro', estado: 'activa', desde: '2026-05-07' },
    activityLog: [
      { tipo: 'producto', desc: 'Agregó producto "Notebook Lenovo IdeaPad"',   fecha: 'hace 20 min' },
      { tipo: 'producto', desc: 'Modificó precio de "Monitor Samsung 24\""',   fecha: 'hace 3h' },
      { tipo: 'tienda',   desc: 'Creó tienda "TecnoStore"',                    fecha: '2026-05-07' },
      { tipo: 'registro', desc: 'Se registró en LOKAL',                        fecha: '2026-05-07' },
    ],
  },
  {
    uid: 'u3', nombre: 'Lucía Ferreira', email: 'lucia@gmail.com', rol: 'usuario',
    tieneTienda: false, suspendido: true, fechaAlta: '2026-05-03',
    ultimaActividad: 'hace 5d', reportesRecibidos: 2, demandasPublicadas: 1,
    productosPublicados: 0, ciudad: 'Buenos Aires', bio: null,
    suscripcion: null,
    activityLog: [
      { tipo: 'reporte',  desc: 'Recibió reporte por contenido inapropiado',   fecha: 'hace 5d' },
      { tipo: 'demanda',  desc: 'Publicó demanda "Busco laptop gamer barata"', fecha: 'hace 6d' },
      { tipo: 'reporte',  desc: 'Recibió reporte por spam',                    fecha: 'hace 1sem' },
      { tipo: 'registro', desc: 'Se registró en LOKAL',                        fecha: '2026-05-03' },
    ],
  },
  {
    uid: 'u4', nombre: 'Admin Local', email: 'admin@lokal.ar', rol: 'admin',
    tieneTienda: false, suspendido: false, fechaAlta: '2026-03-01',
    ultimaActividad: 'ahora', reportesRecibidos: 0, demandasPublicadas: 0,
    productosPublicados: 0, ciudad: 'Rosario', bio: null,
    suscripcion: null,
    activityLog: [
      { tipo: 'admin', desc: 'Suspendió tienda "Ferretería El Progreso"',  fecha: 'hace 1d' },
      { tipo: 'admin', desc: 'Activó módulo "Oportunidades"',              fecha: 'hace 3d' },
      { tipo: 'registro', desc: 'Cuenta admin creada',                     fecha: '2026-03-01' },
    ],
  },
  {
    uid: 'u5', nombre: 'Juan Herrera', email: 'juanhe@gmail.com', rol: 'usuario',
    tieneTienda: true, suspendido: false, fechaAlta: '2026-05-12',
    ultimaActividad: 'hace 1h', reportesRecibidos: 0, demandasPublicadas: 0,
    productosPublicados: 4, ciudad: 'Córdoba', bio: 'Moda local, ropa y accesorios.',
    suscripcion: { plan: 'Básico', estado: 'activa', desde: '2026-05-12' },
    activityLog: [
      { tipo: 'producto', desc: 'Publicó 4 productos nuevos en "Moda & Estilo"', fecha: 'hace 1h' },
      { tipo: 'tienda',   desc: 'Creó tienda "Moda & Estilo"',                   fecha: '2026-05-12' },
      { tipo: 'registro', desc: 'Se registró en LOKAL',                          fecha: '2026-05-12' },
    ],
  },
];

// ─── Mocks ────────────────────────────────────────────────────────────────────
const MOCK_REPORTS = [
  { id: 'r1', tipo: 'tienda',   refId: 1,    refNombre: 'TecnoStore',             motivo: 'Información incorrecta', desc: 'El horario publicado no es el real',                   fecha: 'hace 2h',  estado: 'pendiente', autorNombre: 'María González', autorUid: 'u1', adminRespuesta: null },
  { id: 'r2', tipo: 'producto', refId: null, refNombre: 'iPhone 14 - 128GB',      motivo: 'Precio engañoso',        desc: 'El precio mostrado no coincide con el real al comprar', fecha: 'hace 4h',  estado: 'pendiente', autorNombre: 'Juan Herrera',   autorUid: 'u5', adminRespuesta: null },
  { id: 'r3', tipo: 'tienda',   refId: 3,    refNombre: 'Ferretería El Progreso', motivo: 'Tienda cerrada',         desc: 'La tienda ya no existe en esa dirección',              fecha: 'hace 1d',  estado: 'revisado',  autorNombre: 'Carlos Medina',  autorUid: 'u2', adminRespuesta: 'Gracias por el reporte. Revisamos la tienda y la dimos de baja. Tu reporte ayudó a mantener la calidad del directorio.' },
  { id: 'r4', tipo: 'demanda',  refId: null, refNombre: 'Busco laptop gamer',     motivo: 'Contenido inapropiado', desc: 'Solicitud con contenido fuera de contexto',            fecha: 'hace 2d',  estado: 'revisado',  autorNombre: 'Lucía Ferreira', autorUid: 'u3', adminRespuesta: null },
];

// ─── Mock soporte (chats iniciados por usuarios/tiendas) ──────────────────────
const MOCK_SUPPORT_CHATS = [
  {
    id: 's1', autorNombre: 'Carlos Medina', autorUid: 'u2', autorRol: 'tienda',
    asunto: 'Problema con mi suscripción', estado: 'abierto', fecha: 'hace 1h',
    mensajes: [
      { de: 'usuario', texto: 'Hola, hice el pago pero mi plan todavía figura como inactivo. ¿Pueden revisarlo?', fecha: 'hace 1h' },
    ],
  },
  {
    id: 's2', autorNombre: 'María González', autorUid: 'u1', autorRol: 'usuario',
    asunto: '¿Cómo publico una demanda?', estado: 'cerrado', fecha: 'hace 2d',
    mensajes: [
      { de: 'usuario', texto: '¿Cómo hago para publicar lo que estoy buscando?', fecha: 'hace 2d' },
      { de: 'admin',   texto: 'Hola María! Podés ir a la sección Buscar > Nueva demanda, completar el formulario y listo. ¡Cualquier duda estamos acá!', fecha: 'hace 2d' },
    ],
  },
  {
    id: 's3', autorNombre: 'Juan Herrera', autorUid: 'u5', autorRol: 'tienda',
    asunto: 'No puedo subir fotos a mis productos', estado: 'abierto', fecha: 'hace 3h',
    mensajes: [
      { de: 'usuario', texto: 'Cuando intento subir fotos a mis productos me da error. Uso Android.', fecha: 'hace 3h' },
    ],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function kpi(value, label, Icon, color, sub) { return { value, label, Icon, color, sub }; }

function generateInsights(tiendas, ofertas, demandas, suspended) {
  const activeTiendas  = tiendas.filter(t => !suspended.stores.has(t.id));
  const activeOfertas  = ofertas.filter(o => !suspended.products.has(o.id) && o.activa !== false);
  const avgRating = activeTiendas.filter(t => t.rating).reduce((s, t) => s + t.rating, 0) / (activeTiendas.filter(t => t.rating).length || 1);
  const topStore  = [...activeTiendas].sort((a, b) => (b.totalReseñas || 0) - (a.totalReseñas || 0))[0];
  const pending   = MOCK_REPORTS.filter(r => r.estado === 'pendiente').length;
  const insights  = [];
  if (pending > 0) insights.push({ tipo: 'warning', titulo: `${pending} reportes sin revisar`, desc: `Hay ${pending} reportes de usuarios pendientes de revisión.`, accion: 'reportes' });
  if (activeTiendas.length < 5) insights.push({ tipo: 'info', titulo: 'Pocas tiendas activas', desc: `Solo hay ${activeTiendas.length} tiendas activas. Invitá más comercios.`, accion: 'tiendas' });
  else insights.push({ tipo: 'ok', titulo: `${activeTiendas.length} tiendas activas`, desc: `La red funciona bien. ${activeTiendas.filter(t => t.horarios).length} con horarios.`, accion: 'tiendas' });
  if (avgRating >= 4.5) insights.push({ tipo: 'ok', titulo: `Calidad alta — ★ ${avgRating.toFixed(1)}`, desc: `${topStore?.nombre} lidera con ${topStore?.totalReseñas} reseñas.`, accion: null });
  if (activeOfertas.length === 0) insights.push({ tipo: 'warning', titulo: 'Sin productos publicados', desc: 'Ninguna tienda tiene productos activos.', accion: 'productos' });
  else insights.push({ tipo: 'ok', titulo: `${activeOfertas.length} productos visibles`, desc: `Catálogo activo. Los productos con foto tienen 3× más clics.`, accion: 'productos' });
  if (demandas.length > 0) {
    const sinR = demandas.filter(d => !d.respuestas || d.respuestas === 0).length;
    if (sinR > demandas.length * 0.5) insights.push({ tipo: 'warning', titulo: `${sinR} demandas sin respuesta`, desc: 'Más del 50% no tienen respuesta de tiendas.', accion: 'demandas' });
  }
  return insights;
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function KpiCard({ value, label, Icon, color, sub, isDark }) {
  return (
    <div className={`rounded-2xl p-4 ${isDark ? 'bg-[#111827]' : 'bg-white'} shadow-sm`}>
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-2 ${color}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-2xl font-black text-slate-900 dark:text-white">{value}</p>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{label}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function InsightCard({ insight, onTabChange, isDark }) {
  const colors = {
    ok:      { bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-500', Icon: CheckCircle },
    warning: { bg: isDark ? 'bg-amber-500/10 border-amber-500/20'    : 'bg-amber-50 border-amber-200',     icon: 'text-amber-500',   Icon: AlertTriangle },
    info:    { bg: isDark ? 'bg-blue-500/10 border-blue-500/20'      : 'bg-blue-50 border-blue-200',       icon: 'text-blue-500',    Icon: Activity },
  };
  const c = colors[insight.tipo] || colors.info;
  return (
    <div className={`rounded-2xl p-4 border ${c.bg} flex gap-3`}>
      <c.Icon className={`w-5 h-5 shrink-0 mt-0.5 ${c.icon}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-slate-900 dark:text-white mb-0.5">{insight.titulo}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{insight.desc}</p>
        {insight.accion && (
          <button onClick={() => onTabChange(insight.accion)} className="mt-2 text-xs font-bold text-primary flex items-center gap-1 hover:underline">
            Ver detalle <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ suspended }) {
  return suspended
    ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center gap-1"><Ban className="w-2.5 h-2.5" />Suspendido</span>
    : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1"><CheckCircle className="w-2.5 h-2.5" />Activo</span>;
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function AdminDashboard({
  firebaseUser, tiendas = [], ofertas = [], demandas = [],
  isDark, onBack, onGoMarketplace, suspended, onSuspend, onDelete, onRestore,
  onDemoModeChange,
}) {
  const [activeTab,     setActiveTab]     = useState('overview');
  const [searchQ,       setSearchQ]       = useState('');
  const [confirmAction, setConfirmAction] = useState(null);
  const [demoMode,      setDemoMode]      = useState(() => localStorage.getItem('lokal_demo_mode') === 'true');
  useEffect(() => {
    fetch('/.netlify/functions/site-config')
      .then(r => r.ok ? r.json() : null)
      .then(cfg => {
        if (cfg?.demoMode !== undefined) {
          setDemoMode(cfg.demoMode);
          localStorage.setItem('lokal_demo_mode', String(cfg.demoMode));
        }
      }).catch(() => {});
  }, []);
  const [reports,       setReports]       = useState(() => demoMode ? MOCK_REPORTS       : []);
  const [users,         setUsers]         = useState(() => demoMode ? MOCK_USERS         : []);
  const [modules,       setModules]       = useState(DEFAULT_MODULES);
  const [sidebarOpen,   setSidebarOpen]   = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [statFilter,    setStatFilter]    = useState('general');
  const [statDrilldown, setStatDrilldown] = useState(null);
  const [collapsed,     setCollapsed]     = useState({ tiendas: true, productos: true, demandas: true, usuarios: true });
  const [supportTab,      setSupportTab]      = useState('todos');
  const [selectedUser,    setSelectedUser]    = useState(null);
  const [userPanelView,   setUserPanelView]   = useState('main');
  const [chatDraft,       setChatDraft]       = useState('');
  const [chatAttachments, setChatAttachments] = useState([]);
  const [chatSent,        setChatSent]        = useState(false);
  const [supportChats,      setSupportChats]      = useState(() => demoMode ? MOCK_SUPPORT_CHATS : []);
  const [selectedChat,      setSelectedChat]      = useState(null);
  const [supportReply,      setSupportReply]      = useState('');
  const [supportAttachOpen, setSupportAttachOpen] = useState(false);
  const [supportAttachments,setSupportAttachments]= useState([]); // ['reporte'|'actividad'|'suscripcion'|'tienda']
  const [reportReplies,     setReportReplies]     = useState({});
  const [reportReplyOpen,   setReportReplyOpen]   = useState({});
  const [attachModal,       setAttachModal]       = useState(null); // { type: 'reporte'|'actividad'|'suscripcion'|'tienda'|'producto', uid }
  const [expandedAttach,    setExpandedAttach]    = useState({});
  const supportChatEndRef = React.useRef(null);

  const [userPanelFromChat, setUserPanelFromChat] = useState(false);
  const toggleDemoMode = async (val) => {
    const next = val ?? !demoMode;
    localStorage.setItem('lokal_demo_mode', String(next));
    setDemoMode(next);
    if (typeof onDemoModeChange === 'function') onDemoModeChange(next);
    setReports(next ? MOCK_REPORTS : []);
    setUsers(next ? MOCK_USERS : []);
    setSupportChats(next ? MOCK_SUPPORT_CHATS : []);
    setSelectedChat(null);
    closeUserPanel();
    try {
      const token = await window._getFirebaseToken?.();
      await fetch('/.netlify/functions/site-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ demoMode: next }),
      });
    } catch { /* silencioso */ }
  };

  const openUserPanel  = (u, view = 'main', fromChat = false) => { setSelectedUser(u); setUserPanelView(view); setChatDraft(''); setChatAttachments([]); setChatSent(false); setUserPanelFromChat(fromChat); };
  const closeUserPanel = () => { setSelectedUser(null); setUserPanelView('main'); setUserPanelFromChat(false); };

  const sendReportReply = (rId) => {
    const text = reportReplies[rId]?.trim();
    if (!text) return;
    setReports(prev => prev.map(r => r.id === rId ? { ...r, estado: 'revisado', adminRespuesta: text } : r));
    setReportReplies(prev => ({ ...prev, [rId]: '' }));
    setReportReplyOpen(prev => ({ ...prev, [rId]: false }));
  };

  const sendSupportReply = (chatId, keepOpen = false) => {
    if (!supportReply.trim() && supportAttachments.length === 0) return;
    const newMsg = { de: 'admin', texto: supportReply.trim(), fecha: 'ahora', adjuntos: supportAttachments.length ? [...supportAttachments] : undefined };
    const updater = c => c.id === chatId
      ? { ...c, estado: keepOpen ? 'abierto' : 'cerrado', mensajes: [...c.mensajes, newMsg] }
      : c;
    setSupportChats(prev => prev.map(updater));
    setSelectedChat(prev => prev?.id === chatId ? updater(prev) : prev);
    setSupportReply(''); setSupportAttachments([]); setSupportAttachOpen(false);
  };

  const openSupportFromUser = (uid) => {
    const chat = supportChats.find(c => c.autorUid === uid);
    if (chat) { setActiveTab('soporte'); setSelectedChat(chat); }
    else setActiveTab('soporte');
  };

  const activeTiendas    = tiendas.filter(t => !suspended.stores.has(t.id));
  const activeOfertas    = ofertas.filter(o => !suspended.products.has(o.id) && o.activa !== false);
  const pendingReports   = reports.filter(r => r.estado === 'pendiente').length;
  const openSupportCount = supportChats.filter(c => c.estado === 'abierto').length;

  const kpis = [
    kpi(tiendas.length,       'Tiendas',   Store,         'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600', `${suspended.stores.size} suspendidas`),
    kpi(ofertas.length,       'Productos', Package,       'bg-blue-100 dark:bg-blue-500/15 text-blue-600',          `${suspended.products.size} suspendidos`),
    kpi(demandas.length,      'Demandas',  MessageSquare, 'bg-violet-100 dark:bg-violet-500/15 text-violet-600',    `${demandas.filter(d=>d.respuestas>0).length} con respuesta`),
    kpi(pendingReports,       'Reportes',  Flag,          pendingReports > 0 ? 'bg-rose-100 dark:bg-rose-500/15 text-rose-600' : 'bg-slate-100 dark:bg-white/8 text-slate-500', 'pendientes'),
    kpi(users.length,         'Usuarios',  Users,         'bg-sky-100 dark:bg-sky-500/15 text-sky-600',             `${users.filter(u=>u.suspendido).length} suspendidos`),
    kpi(modules.filter(m=>m.enabled).length, 'Módulos activos', ToggleRight, 'bg-primary/10 text-primary', `de ${modules.length} disponibles`),
  ];

  const platformInsights = useMemo(() => generateInsights(tiendas, ofertas, demandas, suspended), [tiendas, ofertas, demandas, suspended]);
  const toggleCollapse = (key) => setCollapsed(c => ({ ...c, [key]: !c[key] }));

  // Normalize primero — quita acentos para que "modulo" encuentre "Módulos"
  const norm = s => s?.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '') || '';
  const nq = norm(searchQ);
  const q = searchQ.toLowerCase();

  // Filtros de contenido por tab
  const filteredTiendas  = tiendas.filter(t  => !nq || norm(t.nombre).includes(nq) || norm(t.rubro).includes(nq));
  const filteredOfertas  = ofertas.filter(o  => !nq || norm(o.titulo).includes(nq) || norm(o.tiendaNombre).includes(nq));
  const filteredDemandas = demandas.filter(d => !nq || norm(d.titulo).includes(nq));
  const filteredReports  = reports.filter(r  => !nq || norm(r.refNombre).includes(nq) || norm(r.motivo).includes(nq));
  const filteredUsers    = users.filter(u    => !nq || norm(u.nombre).includes(nq) || norm(u.email).includes(nq));
  const filteredModules  = modules.filter(m  => !nq || norm(m.label).includes(nq) || norm(m.desc).includes(nq));

  const TOOLS_LIST = [
    { title: 'Banners promocionales', desc: 'Crear y gestionar banners en el feed del home',              Icon: Image },
    { title: 'Campañas push',         desc: 'Enviar notificaciones push a usuarios o segmentos',          Icon: Bell },
    { title: 'Modal de inicio',       desc: 'Configurar el modal que aparece al abrir la app',            Icon: Megaphone },
    { title: 'Secciones especiales',  desc: 'Crear secciones destacadas con curaduría manual',            Icon: Zap },
    { title: 'Gestión de invitaciones', desc: 'Generar y revocar links de invitación para nuevas tiendas', Icon: Mail },
    { title: 'Exportar datos',        desc: 'Exportar tiendas, productos y demandas a CSV',               Icon: BarChart2 },
  ];

  const [focusedItem, setFocusedItem] = useState(null);
  useEffect(() => { if (selectedUser && userPanelFromChat) closeUserPanel(); }, [activeTab]);

  useEffect(() => {
    if (!focusedItem) return;
    const el = document.getElementById(`${focusedItem.tab === 'tiendas' ? 'tienda' : focusedItem.tab === 'usuarios' ? 'user' : focusedItem.tab === 'productos' ? 'prod' : 'dem'}-${focusedItem.id}`);
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
  }, [focusedItem]);

  const globalResults = nq ? [
    // ── Secciones ──
    ...TABS.filter(t => norm(t.label).includes(nq)).map(t => ({
      type: 'tab', id: `tab-${t.id}`, label: t.label, sub: 'Sección', Icon: t.Icon,
      action: () => { setActiveTab(t.id); setSearchQ(''); setFocusedItem(null); },
    })),
    // ── Módulos individuales ──
    ...modules.filter(m => norm(m.label).includes(nq) || norm(m.desc).includes(nq)).map(m => ({
      type: 'module', id: `mod-${m.id}`, label: m.label,
      sub: m.enabled ? 'Módulo · Activo' : 'Módulo · Inactivo',
      Icon: m.icon, enabled: m.enabled,
      action: () => { setActiveTab('modulos'); setSearchQ(''); setFocusedItem({ tab: 'modulos', id: m.id }); },
    })),
    // ── Herramientas ──
    ...TOOLS_LIST.filter(t => norm(t.title).includes(nq) || norm(t.desc).includes(nq)).map((t, i) => ({
      type: 'tool', id: `tool-${i}`, label: t.title, sub: 'Herramienta · Próximamente', Icon: t.Icon,
      action: () => { setActiveTab('tools'); setSearchQ(''); },
    })),
    // ── Tiendas ──
    ...tiendas.filter(t => norm(t.nombre).includes(nq) || norm(t.rubro).includes(nq)).slice(0, 4).map(t => ({
      type: 'tienda', id: `tienda-${t.id}`, label: t.nombre,
      sub: `Tienda · ${t.rubro || 'Sin rubro'} · ${suspended.stores.has(t.id) ? 'Suspendida' : 'Activa'}`,
      Icon: Store, suspended: suspended.stores.has(t.id), refId: t.id,
      action: () => { setActiveTab('tiendas'); setSearchQ(''); setFocusedItem({ tab: 'tiendas', id: t.id }); },
      quickActions: [
        suspended.stores.has(t.id)
          ? { label: 'Activar',    Icon: RotateCcw, color: 'text-emerald-600', fn: () => { confirm(`Activar "${t.nombre}"?`, () => onRestore('store', t.id)); setSearchQ(''); } }
          : { label: 'Suspender', Icon: EyeOff,    color: 'text-amber-600',   fn: () => { confirm(`Suspender "${t.nombre}"?`, () => onSuspend('store', t.id)); setSearchQ(''); } },
        { label: 'Eliminar', Icon: Trash2, color: 'text-rose-600', fn: () => { confirm(`Eliminar "${t.nombre}"?`, () => onDelete('store', t.id)); setSearchQ(''); } },
      ],
    })),
    // ── Usuarios ──
    ...users.filter(u => norm(u.nombre).includes(nq) || norm(u.email).includes(nq)).slice(0, 3).map(u => ({
      type: 'usuario', id: `user-${u.uid}`, label: u.nombre,
      sub: `Usuario · ${u.email} · ${u.suspendido ? 'Suspendido' : 'Activo'}`,
      Icon: Users, suspended: u.suspendido, refId: u.uid,
      action: () => { setActiveTab('usuarios'); setSearchQ(''); setFocusedItem({ tab: 'usuarios', id: u.uid }); openUserPanel(u); },
      quickActions: u.rol !== 'admin' ? [
        u.suspendido
          ? { label: 'Activar',    Icon: UserCheck,  color: 'text-emerald-600', fn: () => { confirm(`Reactivar a "${u.nombre}"?`, () => restoreUser(u.uid)); setSearchQ(''); } }
          : { label: 'Suspender', Icon: UserMinus,  color: 'text-amber-600',   fn: () => { confirm(`Suspender a "${u.nombre}"?`, () => suspendUser(u.uid)); setSearchQ(''); } },
        { label: 'Eliminar', Icon: UserX, color: 'text-rose-600', fn: () => { confirm(`Eliminar cuenta de "${u.nombre}"?`, () => deleteUser(u.uid)); setSearchQ(''); } },
      ] : [],
    })),
    // ── Productos ──
    ...ofertas.filter(o => norm(o.titulo).includes(nq) || norm(o.tiendaNombre).includes(nq)).slice(0, 3).map(o => ({
      type: 'producto', id: `prod-${o.id}`, label: o.titulo || 'Producto sin título',
      sub: `Producto · ${o.tiendaNombre || '—'} · ${suspended.products.has(o.id) ? 'Suspendido' : 'Activo'}`,
      Icon: Package, suspended: suspended.products.has(o.id), refId: o.id,
      action: () => { setActiveTab('productos'); setSearchQ(''); setFocusedItem({ tab: 'productos', id: o.id }); },
      quickActions: [
        suspended.products.has(o.id)
          ? { label: 'Activar',    Icon: RotateCcw, color: 'text-emerald-600', fn: () => { confirm('Activar este producto?', () => onRestore('product', o.id)); setSearchQ(''); } }
          : { label: 'Suspender', Icon: EyeOff,    color: 'text-amber-600',   fn: () => { confirm('Suspender este producto?', () => onSuspend('product', o.id)); setSearchQ(''); } },
        { label: 'Eliminar', Icon: Trash2, color: 'text-rose-600', fn: () => { confirm('Eliminar este producto?', () => onDelete('product', o.id)); setSearchQ(''); } },
      ],
    })),
    // ── Demandas ──
    ...demandas.filter(d => norm(d.titulo).includes(nq)).slice(0, 2).map(d => ({
      type: 'demanda', id: `dem-${d.id}`, label: d.titulo,
      sub: `Demanda · ${d.respuestas || 0} respuestas · ${suspended.demands.has(d.id) ? 'Suspendida' : 'Activa'}`,
      Icon: MessageSquare, suspended: suspended.demands.has(d.id), refId: d.id,
      action: () => { setActiveTab('demandas'); setSearchQ(''); setFocusedItem({ tab: 'demandas', id: d.id }); },
      quickActions: [
        suspended.demands.has(d.id)
          ? { label: 'Activar',    Icon: RotateCcw, color: 'text-emerald-600', fn: () => { confirm('Activar esta demanda?', () => onRestore('demand', d.id)); setSearchQ(''); } }
          : { label: 'Suspender', Icon: EyeOff,    color: 'text-amber-600',   fn: () => { confirm('Suspender esta demanda?', () => onSuspend('demand', d.id)); setSearchQ(''); } },
        { label: 'Eliminar', Icon: Trash2, color: 'text-rose-600', fn: () => { confirm('Eliminar esta demanda?', () => onDelete('demand', d.id)); setSearchQ(''); } },
      ],
    })),
  ] : [];

  const confirm = (label, fn) => setConfirmAction({ label, onConfirm: fn });
  const markReportReviewed = (id) => setReports(prev => prev.map(r => r.id === id ? { ...r, estado: 'revisado' } : r));
  const toggleModule   = (id, key) => setModules(prev => prev.map(m => m.id === id ? { ...m, [key]: !m[key] } : m));
  const suspendUser    = (uid) => setUsers(prev => prev.map(u => u.uid === uid ? { ...u, suspendido: true }  : u));
  const restoreUser    = (uid) => setUsers(prev => prev.map(u => u.uid === uid ? { ...u, suspendido: false } : u));
  const deleteUser     = (uid) => setUsers(prev => prev.filter(u => u.uid !== uid));

  const bg   = isDark ? 'bg-[#0a0d16]' : 'bg-[#f7f8fa]';
  const card = isDark ? 'bg-[#111827]'  : 'bg-white';
  const bdr  = isDark ? 'border-white/8' : 'border-slate-200';

  const showSearch = !['overview', 'estadisticas', 'soporte'].includes(activeTab);

  function NavItem({ tab }) {
    const active = activeTab === tab.id;
    return (
      <button
        key={tab.id}
        onClick={() => { setActiveTab(tab.id); setSidebarOpen(false); }}
        className={`w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-bold transition-colors ${
          active ? 'bg-primary text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8'
        }`}
      >
        <tab.Icon className="w-4 h-4 shrink-0" />
        <span>{tab.label}</span>
        {tab.id === 'reportes' && pendingReports > 0 && (
          <span className="ml-auto text-[10px] font-black bg-rose-500 text-white rounded-full px-1.5 py-0.5">{pendingReports}</span>
        )}
      </button>
    );
  }

  // ── Attach metadata + inline card (usados en soporte ChatView y mobile overlay) ──
  const ATTACH_META_MAP = {
    reporte:    { label: 'Reportes',    Icon: Flag,       color: 'text-rose-500',    bg: 'bg-rose-100 dark:bg-rose-500/15',       header: 'bg-rose-50 dark:bg-rose-500/10'       },
    actividad:  { label: 'Historial',   Icon: Activity,   color: 'text-amber-500',   bg: 'bg-amber-100 dark:bg-amber-500/15',     header: 'bg-amber-50 dark:bg-amber-500/10'     },
    suscripcion:{ label: 'Suscripción', Icon: CreditCard, color: 'text-primary',     bg: 'bg-primary/10',                         header: 'bg-primary/8'                         },
    tienda:     { label: 'Tienda',      Icon: Store,      color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15', header: 'bg-emerald-50 dark:bg-emerald-500/10' },
    producto:   { label: 'Productos',   Icon: Package,    color: 'text-blue-500',    bg: 'bg-blue-100 dark:bg-blue-500/15',       header: 'bg-blue-50 dark:bg-blue-500/10'       },
  };
  const ALL_ATTACH_OPTS = Object.entries(ATTACH_META_MAP).map(([id, m]) => ({ id, ...m }));
  const PREVIEW_COUNT = 2;

  const AttachCard = ({ aId, uid, msgKey }) => {
    const u = users.find(x => x.uid === uid);
    const meta = ATTACH_META_MAP[aId]; if (!meta) return null;
    const expandKey = `${msgKey}_${aId}`;
    const isExpanded = !!expandedAttach[expandKey];
    const toggle = e => { e.stopPropagation(); setExpandedAttach(p => ({ ...p, [expandKey]: !p[expandKey] })); };
    const uTienda = u?.tieneTienda ? tiendas.find(t => t.nombre) : null;
    const uReportes = reports.filter(r => r.autorUid === uid);
    const uProductos = uTienda ? ofertas.filter(o => o.tiendaId === uTienda.id || o.tiendaNombre === uTienda.nombre) : [];
    const logEntries = u?.activityLog || [];
    const logColor = { registro: 'text-emerald-500', tienda: 'text-emerald-500', producto: 'text-blue-500', demanda: 'text-violet-500', reporte: 'text-rose-500', admin: 'text-amber-500' };

    const rows = (() => {
      if (aId === 'reporte') return uReportes.map(r => (
        <div key={r.id} className="flex items-start gap-2 py-1.5">
          <span className={`shrink-0 text-[9px] font-black px-1.5 py-0.5 rounded-full mt-0.5 ${r.estado === 'pendiente' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'}`}>{r.estado}</span>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">{r.motivo}</p>
            <p className="text-[10px] text-slate-400">{r.tipo} · {r.fecha}</p>
          </div>
        </div>
      ));
      if (aId === 'actividad') return logEntries.map((entry, i) => (
        <div key={i} className="flex items-start gap-2 py-1.5">
          <Activity className={`w-3 h-3 shrink-0 mt-0.5 ${logColor[entry.tipo] || 'text-slate-400'}`} />
          <div>
            <p className="text-xs text-slate-900 dark:text-white leading-tight">{entry.desc}</p>
            <p className="text-[10px] text-slate-400">{entry.fecha}</p>
          </div>
        </div>
      ));
      if (aId === 'producto') return uProductos.map(p => (
        <div key={p.id} className="flex items-center gap-2 py-1.5">
          <Package className="w-3 h-3 text-blue-400 shrink-0" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{p.nombre}</p>
            <p className="text-[10px] text-slate-400">${p.precio?.toLocaleString?.() ?? p.precio}</p>
          </div>
        </div>
      ));
      return [];
    })();

    const isList = ['reporte','actividad','producto'].includes(aId);
    const shown = isList ? (isExpanded ? rows : rows.slice(0, PREVIEW_COUNT)) : rows;
    const hasMore = isList && rows.length > PREVIEW_COUNT;

    const scalarContent = (() => {
      if (aId === 'suscripcion') {
        const s = u?.suscripcion;
        if (!s) return <p className="text-[11px] text-slate-400 py-2">Sin suscripción activa</p>;
        return (
          <div className="py-2 space-y-1">
            <p className="text-sm font-black text-slate-900 dark:text-white">{s.plan}</p>
            <div className="flex items-center gap-2">
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${s.estado === 'activa' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600'}`}>{s.estado}</span>
              <span className="text-[10px] text-slate-400">desde {s.desde}</span>
            </div>
            {s.monto && <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-300">{s.monto} / mes</p>}
          </div>
        );
      }
      if (aId === 'tienda') {
        if (!uTienda) return <p className="text-[11px] text-slate-400 py-2">Sin tienda registrada</p>;
        return (
          <div className="py-2 space-y-0.5">
            <p className="text-sm font-black text-slate-900 dark:text-white">{uTienda.nombre}</p>
            <p className="text-[10px] text-slate-400">{uTienda.categoria}</p>
            {uTienda.direccion && <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{uTienda.direccion}</p>}
            <span className={`inline-block text-[9px] font-black px-2 py-0.5 rounded-full mt-0.5 ${uTienda.activa !== false ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-slate-100 dark:bg-white/10 text-slate-400'}`}>
              {uTienda.activa !== false ? 'Activa' : 'Inactiva'}
            </span>
          </div>
        );
      }
      return null;
    })();

    return (
      <div className={`w-full max-w-[240px] rounded-2xl overflow-hidden border ${bdr} text-left`}>
        <button onClick={() => setAttachModal({ type: aId, uid })}
          className={`w-full flex items-center gap-2 px-3 py-2 ${meta.header} hover:opacity-90 transition-opacity`}>
          <meta.Icon className={`w-3.5 h-3.5 shrink-0 ${meta.color}`} />
          <span className={`text-[11px] font-black flex-1 text-left ${meta.color}`}>{meta.label}</span>
          <ChevronRight className={`w-3 h-3 ${meta.color} opacity-50`} />
        </button>
        <div className={`px-3 pb-1 ${card}`}>
          {scalarContent}
          {shown}
          {hasMore && (
            <button onClick={toggle}
              className="flex items-center gap-1 text-[10px] font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 py-1.5 w-full">
              <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
              {isExpanded ? 'Ver menos' : `Ver ${rows.length - PREVIEW_COUNT} más`}
            </button>
          )}
          {!scalarContent && rows.length === 0 && (
            <p className="text-[10px] text-slate-400 py-2">Sin datos</p>
          )}
        </div>
      </div>
    );
  };

  // Bottom nav tabs (mobile) — 4 principales + Más
  const BOTTOM_TABS = [
    TABS.find(t => t.id === 'overview'),
    TABS.find(t => t.id === 'tiendas'),
    TABS.find(t => t.id === 'estadisticas'), // centro — botón destacado
    TABS.find(t => t.id === 'usuarios'),
  ];

  return (
    <div className={`h-full flex flex-col overflow-hidden ${bg}`}>

      {/* ── Header ── */}
      <div className={`sticky top-0 z-40 ${card} border-b ${bdr}`}>
        <div className="px-4 lg:px-6 h-14 flex items-center gap-3">

          {/* Logo admin */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-7 h-7 rounded-lg bg-rose-500 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-slate-900 dark:text-white text-base leading-none">Admin</span>
          </div>

          {/* Global search */}
          <div className="flex-1 relative max-w-md mx-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
              placeholder="Buscar tiendas, usuarios, módulos..."
              className={`w-full pl-9 pr-4 h-9 rounded-xl text-sm border ${bdr} ${card} text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary`}
            />
            {searchQ && globalResults.length > 0 && (
              <div className={`absolute top-full mt-1 left-0 right-0 ${card} border ${bdr} rounded-xl shadow-xl z-10 overflow-hidden max-h-[420px] overflow-y-auto`}>
                {/* Agrupar por tipo */}
                {['tab','module','tool','tienda','usuario','producto','demanda'].map(tipo => {
                  const grupo = globalResults.filter(r => r.type === tipo);
                  if (!grupo.length) return null;
                  const labels = { tab:'Secciones', module:'Módulos', tool:'Herramientas', tienda:'Tiendas', usuario:'Usuarios', producto:'Productos', demanda:'Demandas' };
                  return (
                    <div key={tipo}>
                      <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 px-3 pt-2 pb-1">{labels[tipo]}</p>
                      {grupo.map(r => (
                        <div key={r.id} className="flex items-center gap-2 px-3 py-2 hover:bg-slate-50 dark:hover:bg-white/8 group">
                          {/* Ícono */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            tipo === 'module' ? (r.enabled ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-white/8 text-slate-400')
                            : tipo === 'tool' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600'
                            : tipo === 'tienda' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600'
                            : tipo === 'usuario' ? 'bg-sky-100 dark:bg-sky-500/15 text-sky-600'
                            : tipo === 'producto' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-600'
                            : tipo === 'demanda' ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-600'
                            : 'bg-slate-100 dark:bg-white/8 text-slate-500'
                          }`}>
                            <r.Icon className="w-3.5 h-3.5" />
                          </div>
                          {/* Texto — clickeable para navegar */}
                          <button onClick={r.action} className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{r.label}</p>
                            <p className="text-[10px] text-slate-400 truncate">{r.sub}</p>
                          </button>
                          {/* Badge módulo */}
                          {tipo === 'module' && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${r.enabled ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600' : 'bg-slate-100 dark:bg-white/8 text-slate-400'}`}>
                              {r.enabled ? 'ON' : 'OFF'}
                            </span>
                          )}
                          {/* Quick actions para items de contenido */}
                          {r.quickActions?.length > 0 && (
                            <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                              {r.quickActions.map((qa, qi) => (
                                <button key={qi} onClick={e => { e.stopPropagation(); qa.fn(); }}
                                  title={qa.label}
                                  className={`w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/8 ${qa.color}`}>
                                  <qa.Icon className="w-3 h-3" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
                {globalResults.length === 0 && (
                  <p className="text-xs text-slate-400 px-3 py-3">Sin resultados para "{searchQ}"</p>
                )}
              </div>
            )}
          </div>

          {/* Ir al marketplace */}
          {(onGoMarketplace || onBack) && (
            <>
              <button
                onClick={onGoMarketplace || onBack}
                title="Ir al marketplace"
                className="lg:hidden w-9 h-9 rounded-xl bg-sky-100 dark:bg-sky-500/15 text-sky-600 flex items-center justify-center shrink-0 hover:opacity-80 transition-opacity">
                <Home className="w-4 h-4" />
              </button>
              <button
                onClick={onGoMarketplace || onBack}
                className="hidden lg:flex items-center gap-1.5 h-8 px-3 rounded-xl bg-sky-100 dark:bg-sky-500/15 text-sky-600 text-xs font-bold shrink-0 hover:opacity-80 transition-opacity">
                <Home className="w-3.5 h-3.5" />Marketplace
              </button>
            </>
          )}

          {/* Email — desktop only */}
          <span className="hidden lg:block text-xs text-slate-400 truncate max-w-[160px]">{firebaseUser?.email}</span>
        </div>
      </div>

      {/* ── Desktop tab bar (debajo del header) ── */}
      <div className={`hidden lg:block sticky top-14 z-30 ${card} border-b ${bdr}`}>
        <div className="flex items-center justify-center gap-1 overflow-x-auto no-scrollbar h-11 px-4">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`shrink-0 flex items-center gap-1.5 px-3 h-7 rounded-lg text-xs font-bold transition-colors ${active ? 'bg-primary text-white' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8'}`}>
                <tab.Icon className="w-3.5 h-3.5" />
                {tab.label}
                {tab.id === 'reportes' && pendingReports > 0 && (
                  <span className="ml-0.5 text-[9px] font-black bg-rose-500 text-white rounded-full px-1.5 py-0.5">{pendingReports}</span>
                )}
                {tab.id === 'soporte' && openSupportCount > 0 && (
                  <span className="ml-0.5 text-[9px] font-black bg-sky-500 text-white rounded-full px-1.5 py-0.5">{openSupportCount}</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Mobile "Más" bottom sheet ── */}
        {moreSheetOpen && (
          <div className="lg:hidden fixed inset-0 bottom-20 z-[4400] flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMoreSheetOpen(false)} />
            <div className={`relative ${card} rounded-t-3xl px-4 pt-3 pb-4 shadow-2xl max-h-[70vh] overflow-y-auto`} style={{ animation: 'sheet-up .22s ease' }}>
              <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-white/15 mx-auto mb-4" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1 mb-2">Admin</p>
              <div className="space-y-1">
                {TABS.map(tab => {
                  const active = activeTab === tab.id;
                  return (
                    <button key={tab.id}
                      onClick={() => { setActiveTab(tab.id); setMoreSheetOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 h-11 rounded-2xl text-sm font-bold transition-colors ${active ? 'bg-primary/10 text-primary' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8'}`}>
                      <tab.Icon className="w-4 h-4 shrink-0" />
                      {tab.label}
                      {tab.id === 'reportes' && pendingReports > 0 && (
                        <span className="ml-auto text-[10px] font-black bg-rose-500 text-white rounded-full px-1.5 py-0.5">{pendingReports}</span>
                      )}
                      {tab.id === 'soporte' && openSupportCount > 0 && (
                        <span className="ml-auto text-[10px] font-black bg-sky-500 text-white rounded-full px-1.5 py-0.5">{openSupportCount}</span>
                      )}
                    </button>
                  );
                })}
              </div>
              {(onGoMarketplace || onBack) && (
                <>
                  <div className={`my-3 border-t ${bdr}`} />
                  <button
                    onClick={() => { setMoreSheetOpen(false); (onGoMarketplace || onBack)(); }}
                    className="w-full flex items-center gap-3 px-3 h-11 rounded-2xl text-sm font-bold text-sky-600 hover:bg-sky-50 dark:hover:bg-sky-500/10 transition-colors">
                    <Home className="w-4 h-4 shrink-0" />
                    Ir al marketplace
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ── Main content ── */}
        <main className={activeTab === 'soporte'
          ? 'flex-1 min-w-0 flex flex-col lg:flex-row overflow-hidden'
          : 'flex-1 min-w-0 overflow-y-auto px-4 lg:px-8 py-6 space-y-6 max-w-5xl mx-auto w-full'}>

            {/* Per-tab search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={searchQ} onChange={e => setSearchQ(e.target.value)}
                placeholder={`Filtrar ${TABS.find(t => t.id === activeTab)?.label.toLowerCase()}...`}
                className={`w-full pl-9 pr-4 h-10 rounded-2xl text-sm border ${bdr} ${card} text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary`}
              />
            </div>
          )}

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* KPI cards — solo en resumen */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {kpis.map((k, i) => <KpiCard key={i} {...k} isDark={isDark} />)}
              </div>
              <h2 className="font-black text-lg text-slate-900 dark:text-white">Resumen general</h2>
              <div className="grid lg:grid-cols-2 gap-3">
                <div className={`${card} rounded-2xl p-5`}>
                  <p className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Activity className="w-4 h-4 text-primary" />Actividad reciente</p>
                  {[
                    { icon: Store,         color: 'text-emerald-500', text: 'TecnoStore actualizó su catálogo',           time: 'hace 12 min' },
                    { icon: MessageSquare, color: 'text-violet-500',  text: 'Nueva demanda: "Busco auriculares..."',      time: 'hace 34 min' },
                    { icon: Flag,          color: 'text-rose-500',    text: 'Reporte recibido en Farmacia del Centro',    time: 'hace 2h' },
                    { icon: Package,       color: 'text-blue-500',    text: 'Nuevo producto en Moda & Estilo',            time: 'hace 3h' },
                    { icon: Store,         color: 'text-emerald-500', text: 'Panadería La Espiga se unió a la red',       time: 'hace 1d' },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-start gap-3 py-2.5 ${i < 4 ? `border-b ${bdr}` : ''}`}>
                      <item.icon className={`w-4 h-4 mt-0.5 shrink-0 ${item.color}`} />
                      <p className="text-xs text-slate-600 dark:text-slate-300 flex-1">{item.text}</p>
                      <span className="text-[10px] text-slate-400 shrink-0">{item.time}</span>
                    </div>
                  ))}
                </div>
                <div className={`${card} rounded-2xl p-5`}>
                  <p className="font-bold text-sm text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500" />Top tiendas por rating</p>
                  {[...tiendas].filter(t => t.rating).sort((a, b) => b.rating - a.rating).slice(0, 5).map((t, i) => (
                    <div key={t.id} className={`flex items-center gap-3 py-2.5 ${i < 4 ? `border-b ${bdr}` : ''}`}>
                      <span className="text-xs font-black text-slate-400 w-4">#{i + 1}</span>
                      <div className="w-7 h-7 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/8 shrink-0">
                        {t.logo ? <img src={t.logo} className="w-full h-full object-cover" alt="" /> : <Store className="w-4 h-4 m-auto text-slate-400 mt-1.5" />}
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">{t.nombre}</p>
                      <span className="text-xs font-bold text-amber-500">★ {t.rating}</span>
                      <StatusBadge suspended={suspended.stores.has(t.id)} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ESTADÍSTICAS ── */}
          {activeTab === 'estadisticas' && (() => {
            const totalTiendas        = tiendas.length;
            const tiendasActivas      = activeTiendas.length;
            const tiendasConRating    = tiendas.filter(t => t.rating);
            const avgRatingNum        = tiendasConRating.length ? tiendasConRating.reduce((s,t)=>s+t.rating,0)/tiendasConRating.length : 0;
            const avgRating           = avgRatingNum ? avgRatingNum.toFixed(1) : '—';
            const tiendasConHorario   = tiendas.filter(t => t.horarios).length;
            const rubros              = tiendas.reduce((acc,t)=>{ const r=t.rubro||'Sin rubro'; acc[r]=(acc[r]||0)+1; return acc; }, {});
            const totalProductos      = ofertas.length;
            const productosActivos    = activeOfertas.length;
            const productosConFoto    = ofertas.filter(o=>o.galeria?.[0]||o.fotos?.[0]).length;
            const precioPromedio      = ofertas.filter(o=>o.precio).length ? Math.round(ofertas.filter(o=>o.precio).reduce((s,o)=>s+Number(o.precio),0)/ofertas.filter(o=>o.precio).length) : 0;
            const totalDemandas       = demandas.length;
            const demandasConResp     = demandas.filter(d=>d.respuestas>0).length;
            const tasaRespuesta       = totalDemandas ? Math.round((demandasConResp/totalDemandas)*100) : 0;
            const totalUsuarios       = users.length;
            const usuariosSuspendidos = users.filter(u=>u.suspendido).length;
            const usuariosConTienda   = users.filter(u=>u.tieneTienda).length;

            // ── IA contextual por filtro ───────────────────────────────────
            function buildAiInsights(filter, drilldown) {
              if (drilldown?.type === 'rubro') {
                const rt = tiendas.filter(t=>(t.rubro||'Sin rubro')===drilldown.value);
                const ra = rt.filter(t=>!suspended.stores.has(t.id)).length;
                const rr = rt.filter(t=>t.rating);
                const avg = rr.length ? (rr.reduce((s,t)=>s+t.rating,0)/rr.length).toFixed(1) : null;
                const ins = [];
                if (ra < rt.length) ins.push({ tipo:'warning', titulo:`${rt.length-ra} tiendas suspendidas en ${drilldown.value}`, desc:`${Math.round(((rt.length-ra)/rt.length)*100)}% de las tiendas de este rubro están suspendidas. Puede afectar la percepción del rubro ante los usuarios.` });
                else ins.push({ tipo:'ok', titulo:`Todas las tiendas de ${drilldown.value} están activas`, desc:`${rt.length} tiendas activas. El rubro está bien representado en el catálogo.` });
                if (avg) ins.push({ tipo: Number(avg)>=4?'ok':'warning', titulo:`Rating promedio ★ ${avg} en ${drilldown.value}`, desc: Number(avg)>=4 ? 'El rubro tiene buena reputación. Impulsá el rubro destacando las tiendas top.' : 'Rating por debajo de 4. Considerá contactar a las tiendas de este rubro para mejorar la experiencia.' });
                if (rt.length === 1) ins.push({ tipo:'info', titulo:`Solo 1 tienda en ${drilldown.value}`, desc:'Rubro con poca cobertura. Podría ser una oportunidad para invitar más comercios del sector.' });
                return ins;
              }
              if (drilldown?.type === 'tienda') {
                const t = tiendas.find(t=>t.id===drilldown.value);
                if (!t) return [];
                const prods = ofertas.filter(o=>o.tiendaId===t.id||o.tiendaNombre===t.nombre);
                const conFoto = prods.filter(o=>o.galeria?.[0]||o.fotos?.[0]).length;
                const ins = [];
                if (suspended.stores.has(t.id)) ins.push({ tipo:'warning', titulo:`${t.nombre} está suspendida`, desc:'La tienda no es visible para los usuarios. Revisá si el motivo de suspensión fue resuelto.' });
                if (prods.length === 0) ins.push({ tipo:'warning', titulo:'Sin productos publicados', desc:`${t.nombre} no tiene productos en el catálogo. Los usuarios que la encuentren no verán oferta.` });
                else if (conFoto < prods.length) ins.push({ tipo:'info', titulo:`${prods.length-conFoto} productos sin foto`, desc:'Los productos con foto tienen hasta 3× más clics. Notificá a la tienda para que suba imágenes.' });
                if (t.rating && t.rating >= 4.5) ins.push({ tipo:'ok', titulo:`Tienda top — ★ ${t.rating}`, desc:'Excelente reputación. Es candidata para destacar en secciones especiales o banners.' });
                if (!t.horarios) ins.push({ tipo:'info', titulo:'Sin horarios cargados', desc:'Los usuarios no pueden saber cuándo está abierta. Sugerí que complete esa sección del perfil.' });
                return ins;
              }
              // por filtro de sección
              const map = {
                general: [
                  // fusión: insights de plataforma (generateInsights) + contextuales
                  ...platformInsights,
                ],
                tiendas: [
                  tiendasConHorario < totalTiendas * 0.5 ? { tipo:'warning', titulo:`${totalTiendas-tiendasConHorario} tiendas sin horarios`, desc:'Más de la mitad de las tiendas no tienen horarios cargados. Los usuarios no saben cuándo están abiertas.' } : { tipo:'ok', titulo:'La mayoría tiene horarios cargados', desc:'Los usuarios pueden planificar sus visitas.' },
                  avgRatingNum > 0 && avgRatingNum < 3.5 ? { tipo:'warning', titulo:`Rating promedio bajo (★ ${avgRating})`, desc:'El ecosistema tiene problemas de reputación. Revisá tiendas con ratings bajos y evaluá suspenderlas.' } : avgRatingNum >= 4 ? { tipo:'ok', titulo:`Excelente rating promedio ★ ${avgRating}`, desc:'El ecosistema tiene buena reputación general.' } : { tipo:'info', titulo:'Pocas tiendas tienen reseñas', desc:'Impulsá las reseñas para tener métricas de calidad más representativas.' },
                  Object.keys(rubros).length > 5 ? { tipo:'ok', titulo:`${Object.keys(rubros).length} rubros representados`, desc:'La diversidad de rubros enriquece el catálogo y cubre más búsquedas de los usuarios.' } : { tipo:'info', titulo:'Pocos rubros distintos', desc:'El catálogo está concentrado en pocos rubros. Invitá comercios de sectores no representados.' },
                ],
                productos: [
                  productosConFoto < totalProductos * 0.5 ? { tipo:'warning', titulo:`${totalProductos-productosConFoto} productos sin foto`, desc:'Impacta directamente en la tasa de clics. Considerá una campaña de mejora de catálogo.' } : { tipo:'ok', titulo:'Mayoría de productos con foto', desc:'Buen nivel de calidad visual del catálogo.' },
                  productosActivos < totalProductos * 0.8 ? { tipo:'info', titulo:`${totalProductos-productosActivos} productos inactivos`, desc:'Productos que no son visibles al público. Verificá si fueron ocultados por sus dueños o suspendidos por admin.' } : { tipo:'ok', titulo:'Casi todos los productos están activos', desc:'El catálogo público está completo y actualizado.' },
                  precioPromedio > 0 ? { tipo:'info', titulo:`Precio promedio: $${precioPromedio.toLocaleString()}`, desc:'Útil para entender el segmento de mercado predominante en la plataforma.' } : { tipo:'info', titulo:'Muchos productos sin precio cargado', desc:'Sin precio los usuarios no pueden comparar. Incentivá a las tiendas a completar este dato.' },
                ],
                demandas: [
                  tasaRespuesta < 30 ? { tipo:'warning', titulo:`Tasa de respuesta crítica: ${tasaRespuesta}%`, desc:'Menos de 1 de cada 3 demandas recibe respuesta. Los usuarios se van sin encontrar lo que buscan.' } : tasaRespuesta < 60 ? { tipo:'info', titulo:`Tasa de respuesta: ${tasaRespuesta}%`, desc:'Margen de mejora. Notificá a tiendas cuando hay demandas nuevas en su rubro.' } : { tipo:'ok', titulo:`Alta tasa de respuesta: ${tasaRespuesta}%`, desc:'Las tiendas están respondiendo activamente. El circuito oferta-demanda funciona.' },
                  totalDemandas > 0 ? { tipo:'info', titulo:`${totalDemandas} demandas en total`, desc:'Cada demanda sin respuesta es una venta que no se concretó. El módulo de Oportunidades puede mejorar esto.' } : { tipo:'warning', titulo:'Sin demandas publicadas', desc:'Los usuarios no están usando el módulo de demandas. Considerá onboarding o push para activarlo.' },
                ],
                usuarios: [
                  usuariosConTienda / (totalUsuarios||1) > 0.5 ? { tipo:'info', titulo:'Mayoría son dueños de tienda', desc:'La plataforma está orientada a comercios. Para crecer en consumidores, el módulo de demandas y mapa son clave.' } : { tipo:'ok', titulo:'Buena proporción consumidores/comercios', desc:'El ecosistema tiene base de consumidores activa además de tiendas.' },
                  usuariosSuspendidos > 0 ? { tipo:'warning', titulo:`${usuariosSuspendidos} usuario${usuariosSuspendidos>1?'s':''} suspendido${usuariosSuspendidos>1?'s':''}`, desc:'Revisá si los motivos de suspensión siguen vigentes para considerarles reactivación.' } : { tipo:'ok', titulo:'Sin usuarios suspendidos', desc:'La comunidad está en regla.' },
                ],
              };
              return map[filter] || [];
            }

            // ── Componentes internos ───────────────────────────────────────
            function StatRow({ label, value, sub, bar, barColor='bg-primary', onClick }) {
              return (
                <div onClick={onClick} className={`flex items-center gap-3 py-2.5 ${onClick?'cursor-pointer hover:bg-slate-50 dark:hover:bg-white/4 rounded-xl px-2 -mx-2':''}`}>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">{label}</p>
                    {sub && <p className="text-[10px] text-slate-400">{sub}</p>}
                    {bar !== undefined && (
                      <div className="mt-1 h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${barColor}`} style={{ width:`${Math.min(bar,100)}%` }} />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <p className="text-sm font-black text-slate-900 dark:text-white">{value}</p>
                    {onClick && <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                  </div>
                </div>
              );
            }

            function AiPanel({ insights }) {
              if (!insights.length) return null;
              return (
                <div className="rounded-2xl border border-violet-200 dark:border-violet-500/20 bg-violet-50 dark:bg-violet-500/5 p-4 space-y-3">
                  <p className="text-xs font-bold text-violet-600 dark:text-violet-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />Análisis IA — {statDrilldown ? (statDrilldown.type==='rubro'?`Rubro: ${statDrilldown.value}`:tiendas.find(t=>t.id===statDrilldown.value)?.nombre||'Tienda') : STAT_FILTERS.find(f=>f.id===statFilter)?.label}
                  </p>
                  {insights.map((ins, i) => {
                    const colors = {
                      ok:      { border:'border-emerald-200 dark:border-emerald-500/20', icon:'text-emerald-500', Icon:CheckCircle },
                      warning: { border:'border-amber-200 dark:border-amber-500/20',     icon:'text-amber-500',   Icon:AlertTriangle },
                      info:    { border:'border-blue-200 dark:border-blue-500/20',        icon:'text-blue-500',    Icon:Activity },
                    };
                    const c = colors[ins.tipo]||colors.info;
                    return (
                      <div key={i} className={`flex gap-2.5 p-3 rounded-xl border bg-white dark:bg-white/5 ${c.border}`}>
                        <c.Icon className={`w-4 h-4 shrink-0 mt-0.5 ${c.icon}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-900 dark:text-white mb-0.5">{ins.titulo}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">{ins.desc}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            }

            const STAT_FILTERS = [
              { id:'general',   label:'General' },
              { id:'tiendas',   label:'Tiendas' },
              { id:'productos', label:'Productos' },
              { id:'demandas',  label:'Demandas' },
              { id:'usuarios',  label:'Usuarios' },
            ];

            const aiInsights = buildAiInsights(statFilter, statDrilldown);

            // ── Drill-down: rubro ──────────────────────────────────────────
            if (statDrilldown?.type === 'rubro') {
              const rubroTiendas = tiendas.filter(t=>(t.rubro||'Sin rubro')===statDrilldown.value);
              return (
                <div className="space-y-4">
                  <button onClick={()=>setStatDrilldown(null)} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">
                    <ArrowLeft className="w-3.5 h-3.5" />Volver a Tiendas
                  </button>
                  <div>
                    <h3 className="font-black text-base text-slate-900 dark:text-white">{statDrilldown.value}</h3>
                    <p className="text-xs text-slate-400">{rubroTiendas.length} tiendas en este rubro</p>
                  </div>
                  <AiPanel insights={aiInsights} />
                  <div className={`${card} rounded-2xl p-5 space-y-0 divide-y ${bdr}`}>
                    {rubroTiendas.map(t=>(
                      <div key={t.id} onClick={()=>setStatDrilldown({type:'tienda',value:t.id})} className="flex items-center gap-3 py-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/4 rounded-xl px-2 -mx-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100 dark:bg-white/8 shrink-0">
                          {t.logo?<img src={t.logo} className="w-full h-full object-cover" alt="" />:<Store className="w-4 h-4 m-auto mt-2 text-slate-400"/>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.nombre}</p>
                          <p className="text-xs text-slate-400">{t.ciudad}</p>
                        </div>
                        {t.rating && <span className="text-xs font-bold text-amber-500">★ {t.rating}</span>}
                        <StatusBadge suspended={suspended.stores.has(t.id)} />
                        <ChevronRight className="w-4 h-4 text-slate-300" />
                      </div>
                    ))}
                  </div>
                </div>
              );
            }

            // ── Drill-down: tienda ─────────────────────────────────────────
            if (statDrilldown?.type === 'tienda') {
              const t = tiendas.find(t=>t.id===statDrilldown.value);
              const prods = ofertas.filter(o=>o.tiendaId===t?.id||o.tiendaNombre===t?.nombre);
              const conFoto = prods.filter(o=>o.galeria?.[0]||o.fotos?.[0]).length;
              const pp = prods.filter(o=>o.precio).length ? Math.round(prods.filter(o=>o.precio).reduce((s,o)=>s+Number(o.precio),0)/prods.filter(o=>o.precio).length) : 0;
              return (
                <div className="space-y-4">
                  <button onClick={()=>setStatDrilldown({type:'rubro',value:t?.rubro||'Sin rubro'})} className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-200">
                    <ArrowLeft className="w-3.5 h-3.5" />Volver a {t?.rubro||'Sin rubro'}
                  </button>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/8 shrink-0">
                      {t?.logo?<img src={t.logo} className="w-full h-full object-cover" alt="" />:<Store className="w-6 h-6 m-auto mt-3 text-slate-400"/>}
                    </div>
                    <div>
                      <h3 className="font-black text-base text-slate-900 dark:text-white">{t?.nombre}</h3>
                      <p className="text-xs text-slate-400">{t?.rubro} · {t?.ciudad}</p>
                    </div>
                  </div>
                  <AiPanel insights={aiInsights} />
                  <div className={`${card} rounded-2xl p-5`}>
                    <p className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Perfil</p>
                    <div className={`divide-y ${bdr}`}>
                      <StatRow label="Estado"             value={suspended.stores.has(t?.id)?'Suspendida':'Activa'} />
                      <StatRow label="Rating"             value={t?.rating?`★ ${t.rating}`:'Sin reseñas'} />
                      <StatRow label="Horarios cargados"  value={t?.horarios?'Sí':'No'} />
                      <StatRow label="Teléfono"           value={t?.telefono||'—'} />
                    </div>
                    <p className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-4 mb-3">Catálogo</p>
                    <div className={`divide-y ${bdr}`}>
                      <StatRow label="Productos publicados" value={prods.length} />
                      <StatRow label="Con foto"              value={conFoto}      bar={prods.length?(conFoto/prods.length)*100:0} barColor="bg-emerald-400" />
                      <StatRow label="Sin foto"              value={prods.length-conFoto} bar={prods.length?((prods.length-conFoto)/prods.length)*100:0} barColor="bg-amber-400" />
                      <StatRow label="Precio promedio"       value={pp?`$${pp.toLocaleString()}`:'—'} />
                    </div>
                  </div>
                </div>
              );
            }

            // ── CollapsibleSection helper ─────────────────────────────────
            function Section({ id, Icon, iconColor, title, sub, badge, children }) {
              const isOpen = !collapsed[id];
              return (
                <div className={`${card} rounded-2xl overflow-hidden`}>
                  <button onClick={() => toggleCollapse(id)}
                    className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-slate-50 dark:hover:bg-white/4 transition-colors">
                    <Icon className={`w-4 h-4 shrink-0 ${iconColor}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{title}</p>
                      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
                    </div>
                    {badge && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-white/8 text-slate-500 shrink-0">{badge}</span>}
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && <div className="px-5 pb-5 pt-0 border-t border-slate-100 dark:border-white/6">{children}</div>}
                </div>
              );
            }

            // ── Vista normal por filtro ────────────────────────────────────
            return (
              <div className="space-y-4">
                {/* Filter pills */}
                <div className="flex gap-2 flex-wrap">
                  {STAT_FILTERS.map(f => (
                    <button key={f.id} onClick={()=>{ setStatFilter(f.id); setStatDrilldown(null); }}
                      className={`h-8 px-4 rounded-xl text-xs font-bold transition-colors ${statFilter===f.id?'bg-primary text-white':`${card} border ${bdr} text-slate-500 dark:text-slate-400`}`}>
                      {f.label}
                    </button>
                  ))}
                </div>

                {/* IA panel — contextual al filtro activo */}
                <AiPanel insights={aiInsights} />

                {/* General KPIs */}
                {statFilter === 'general' && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {[
                      { label:'Total tiendas',   value:totalTiendas,   color:'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600', Icon:Store },
                      { label:'Tiendas activas', value:tiendasActivas, color:'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600', Icon:ShieldCheck },
                      { label:'Productos',       value:totalProductos, color:'bg-blue-100 dark:bg-blue-500/15 text-blue-600',          Icon:Package },
                      { label:'Demandas',        value:totalDemandas,  color:'bg-violet-100 dark:bg-violet-500/15 text-violet-600',    Icon:MessageSquare },
                      { label:'Usuarios',        value:totalUsuarios,  color:'bg-sky-100 dark:bg-sky-500/15 text-sky-600',             Icon:Users },
                      { label:'Rating promedio', value:`★ ${avgRating}`, color:'bg-amber-100 dark:bg-amber-500/15 text-amber-600',    Icon:Star },
                    ].map((k,i) => <KpiCard key={i} {...k} isDark={isDark} />)}
                  </div>
                )}

                {/* Tiendas — colapsable */}
                {(statFilter === 'tiendas' || statFilter === 'general') && (
                  <Section id="tiendas" Icon={Store} iconColor="text-emerald-500" title="Tiendas"
                    sub="Estado y composición de la red" badge={`${totalTiendas} total`}>
                    <div className={`divide-y ${bdr} mt-3`}>
                      <StatRow label="Activas"         value={tiendasActivas}        bar={totalTiendas?(tiendasActivas/totalTiendas)*100:0}          barColor="bg-emerald-500" sub={`${Math.round((tiendasActivas/totalTiendas||0)*100)}%`} />
                      <StatRow label="Suspendidas"     value={suspended.stores.size} bar={totalTiendas?(suspended.stores.size/totalTiendas)*100:0}  barColor="bg-rose-400" />
                      <StatRow label="Con horarios"    value={tiendasConHorario}     bar={totalTiendas?(tiendasConHorario/totalTiendas)*100:0}       barColor="bg-blue-400" sub="perfil completo" />
                      <StatRow label="Con reseñas"     value={tiendasConRating.length} />
                      <StatRow label="Rating promedio" value={`★ ${avgRating}`} />
                    </div>
                    <p className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-4 mb-3">Rubros — clic para ver detalle</p>
                    {Object.entries(rubros).sort((a,b)=>b[1]-a[1]).map(([rubro,count])=>(
                      <div key={rubro} onClick={()=>setStatDrilldown({type:'rubro',value:rubro})}
                        className="flex items-center gap-3 mb-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/4 rounded-xl px-2 py-1.5 -mx-2 group">
                        <p className="text-xs text-slate-600 dark:text-slate-300 w-36 truncate group-hover:text-primary transition-colors">{rubro}</p>
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{width:`${(count/totalTiendas)*100}%`}}/>
                        </div>
                        <span className="text-xs font-bold text-slate-500 w-5 text-right">{count}</span>
                        <ChevronRight className="w-3 h-3 text-slate-300 group-hover:text-primary transition-colors"/>
                      </div>
                    ))}
                    {statFilter === 'tiendas' && (
                      <>
                        <p className="font-bold text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-4 mb-3">Top 5 por rating</p>
                        {[...tiendas].filter(t=>t.rating).sort((a,b)=>b.rating-a.rating).slice(0,5).map((t,i)=>(
                          <div key={t.id} onClick={()=>setStatDrilldown({type:'tienda',value:t.id})}
                            className={`flex items-center gap-3 py-2.5 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/4 rounded-xl px-2 -mx-2 ${i<4?`border-b ${bdr}`:''}`}>
                            <span className="text-xs font-black text-slate-400 w-4">#{i+1}</span>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex-1 truncate">{t.nombre}</p>
                            <span className="text-xs text-slate-400">{t.rubro}</span>
                            <span className="text-xs font-bold text-amber-500">★ {t.rating}</span>
                            <ChevronRight className="w-3 h-3 text-slate-300"/>
                          </div>
                        ))}
                      </>
                    )}
                  </Section>
                )}

                {/* Productos — colapsable */}
                {(statFilter === 'productos' || statFilter === 'general') && (
                  <Section id="productos" Icon={Package} iconColor="text-blue-500" title="Productos"
                    sub="Calidad y cobertura del catálogo" badge={`${totalProductos} total`}>
                    <div className={`divide-y ${bdr} mt-3`}>
                      <StatRow label="Activos (visibles)"  value={productosActivos}              bar={totalProductos?(productosActivos/totalProductos)*100:0}             barColor="bg-blue-500"    sub={`${Math.round((productosActivos/totalProductos||0)*100)}%`} />
                      <StatRow label="Con foto"            value={productosConFoto}              bar={totalProductos?(productosConFoto/totalProductos)*100:0}              barColor="bg-emerald-400" sub="mayor tasa de clic" />
                      <StatRow label="Sin foto"            value={totalProductos-productosConFoto} bar={totalProductos?((totalProductos-productosConFoto)/totalProductos)*100:0} barColor="bg-amber-400" sub="oportunidad de mejora" />
                      <StatRow label="Precio promedio"     value={precioPromedio?`$${precioPromedio.toLocaleString()}`:'—'} />
                    </div>
                  </Section>
                )}

                {/* Demandas — colapsable */}
                {(statFilter === 'demandas' || statFilter === 'general') && (
                  <Section id="demandas" Icon={MessageSquare} iconColor="text-violet-500" title="Demandas"
                    sub="Engagement oferta-demanda" badge={`${tasaRespuesta}% resp.`}>
                    <div className={`divide-y ${bdr} mt-3`}>
                      <StatRow label="Total publicadas"  value={totalDemandas} />
                      <StatRow label="Con respuesta"     value={demandasConResp}              bar={tasaRespuesta}                                                        barColor="bg-violet-500" sub={`tasa ${tasaRespuesta}%`} />
                      <StatRow label="Sin respuesta"     value={totalDemandas-demandasConResp} bar={totalDemandas?((totalDemandas-demandasConResp)/totalDemandas)*100:0} barColor="bg-rose-400"   sub="venta no concretada" />
                    </div>
                  </Section>
                )}

                {/* Usuarios — colapsable */}
                {(statFilter === 'usuarios' || statFilter === 'general') && (
                  <Section id="usuarios" Icon={Users} iconColor="text-sky-500" title="Usuarios"
                    sub="Composición de la base de usuarios" badge={`${totalUsuarios} total`}>
                    <div className={`divide-y ${bdr} mt-3`}>
                      <StatRow label="Con tienda"        value={usuariosConTienda}              bar={totalUsuarios?(usuariosConTienda/totalUsuarios)*100:0}               barColor="bg-emerald-500" sub="dueños de comercio" />
                      <StatRow label="Solo consumidores" value={totalUsuarios-usuariosConTienda} bar={totalUsuarios?((totalUsuarios-usuariosConTienda)/totalUsuarios)*100:0} barColor="bg-sky-400"  sub="clientes finales" />
                      <StatRow label="Suspendidos"       value={usuariosSuspendidos}            bar={totalUsuarios?(usuariosSuspendidos/totalUsuarios)*100:0}             barColor="bg-rose-400" />
                    </div>
                  </Section>
                )}
              </div>
            );
          })()}

          {/* ── TIENDAS ── */}
          {activeTab === 'tiendas' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">{filteredTiendas.length} tiendas</p>
              {filteredTiendas.map(t => (
                <div key={t.id} id={`tienda-${t.id}`} className={`${card} rounded-2xl p-4 flex items-center gap-3 ${suspended.stores.has(t.id) ? 'opacity-60' : ''} ${focusedItem?.id === t.id ? 'ring-2 ring-primary' : ''}`}>
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/8 shrink-0">
                    {t.logo ? <img src={t.logo} className="w-full h-full object-cover" alt="" /> : <Store className="w-5 h-5 m-auto mt-2.5 text-slate-400" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{t.nombre}</p>
                      <StatusBadge suspended={suspended.stores.has(t.id)} />
                    </div>
                    <p className="text-xs text-slate-400 truncate">{t.rubro} · {t.ciudad}</p>
                  </div>
                  {t.rating && <span className="text-xs font-bold text-amber-500 shrink-0">★ {t.rating}</span>}
                  <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                    {suspended.stores.has(t.id)
                      ? <button onClick={() => confirm(`Activar "${t.nombre}"?`, () => onRestore('store', t.id))} className="h-8 px-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1"><RotateCcw className="w-3 h-3" />Activar</button>
                      : <button onClick={() => confirm(`Suspender "${t.nombre}"?`, () => onSuspend('store', t.id))} className="h-8 px-3 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1"><EyeOff className="w-3 h-3" />Suspender</button>
                    }
                    <button onClick={() => confirm(`Eliminar "${t.nombre}" permanentemente?`, () => onDelete('store', t.id))} className="h-8 px-3 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" />Eliminar</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PRODUCTOS ── */}
          {activeTab === 'productos' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">{filteredOfertas.length} productos</p>
              {filteredOfertas.map(o => {
                const img = o.galeria?.[0] || o.fotos?.[0];
                return (
                  <div key={o.id} id={`prod-${o.id}`} className={`${card} rounded-2xl p-4 flex items-center gap-3 ${suspended.products.has(o.id) ? 'opacity-60' : ''} ${focusedItem?.id === o.id ? 'ring-2 ring-primary' : ''}`}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/8 shrink-0">
                      {img ? <img src={img} className="w-full h-full object-cover" alt="" /> : <Package className="w-5 h-5 m-auto mt-2.5 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{o.titulo}</p>
                        <StatusBadge suspended={suspended.products.has(o.id)} />
                      </div>
                      <p className="text-xs text-slate-400 truncate">{o.tiendaNombre} · {o.tiendaCiudad}</p>
                      {o.precio && <p className="text-xs font-bold text-primary">${Number(o.precio).toLocaleString()}</p>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {suspended.products.has(o.id)
                        ? <button onClick={() => confirm('Activar este producto?', () => onRestore('product', o.id))} className="h-8 px-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1"><RotateCcw className="w-3 h-3" />Activar</button>
                        : <button onClick={() => confirm('Suspender este producto?', () => onSuspend('product', o.id))} className="h-8 px-3 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1"><EyeOff className="w-3 h-3" />Suspender</button>
                      }
                      <button onClick={() => confirm('Eliminar este producto permanentemente?', () => onDelete('product', o.id))} className="h-8 px-3 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" />Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── DEMANDAS ── */}
          {activeTab === 'demandas' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">{filteredDemandas.length} demandas</p>
              {filteredDemandas.map(d => {
                const foto = d.fotos?.[0] || d.foto;
                return (
                  <div key={d.id} id={`dem-${d.id}`} className={`${card} rounded-2xl p-4 flex items-center gap-3 ${suspended.demands.has(d.id) ? 'opacity-60' : ''} ${focusedItem?.id === d.id ? 'ring-2 ring-primary' : ''}`}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/8 shrink-0">
                      {foto ? <img src={foto} className="w-full h-full object-cover" alt="" /> : <MessageSquare className="w-5 h-5 m-auto mt-2.5 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{d.titulo}</p>
                        <StatusBadge suspended={suspended.demands.has(d.id)} />
                      </div>
                      <p className="text-xs text-slate-400 truncate">{d.tiempoCreado} · {d.respuestas || 0} respuestas</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {suspended.demands.has(d.id)
                        ? <button onClick={() => confirm('Activar esta demanda?', () => onRestore('demand', d.id))} className="h-8 px-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1"><RotateCcw className="w-3 h-3" />Activar</button>
                        : <button onClick={() => confirm('Suspender esta demanda?', () => onSuspend('demand', d.id))} className="h-8 px-3 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1"><EyeOff className="w-3 h-3" />Suspender</button>
                      }
                      <button onClick={() => confirm('Eliminar esta demanda?', () => onDelete('demand', d.id))} className="h-8 px-3 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" />Eliminar</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── USUARIOS ── */}
          {activeTab === 'usuarios' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">{filteredUsers.length} usuarios · {users.filter(u => u.suspendido).length} suspendidos</p>
              {filteredUsers.map(u => (
                <div key={u.uid} id={`user-${u.uid}`} className={`${card} rounded-2xl p-4 ${u.suspendido ? 'opacity-60' : ''} ${focusedItem?.id === u.uid ? 'ring-2 ring-primary' : ''}`}>
                  {/* Fila principal — clickeable para abrir detalle */}
                  <button onClick={() => openUserPanel(u)} className="w-full flex items-center gap-3 text-left">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-sm font-black text-primary">{u.nombre[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{u.nombre}</p>
                        {u.rol === 'admin' && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center gap-1">
                            <ShieldAlert className="w-2.5 h-2.5" />Admin
                          </span>
                        )}
                        {u.tieneTienda && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                            <Store className="w-2.5 h-2.5" />Tienda
                          </span>
                        )}
                        <StatusBadge suspended={u.suspendido} />
                      </div>
                      <p className="text-xs text-slate-400 truncate">{u.email} · Alta {u.fechaAlta}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                  </button>
                  {/* Acciones rápidas (solo no-admin) */}
                  {u.rol !== 'admin' && (
                    <div className={`flex gap-2 mt-3 pt-3 border-t ${bdr} flex-wrap`}>
                      {u.suspendido
                        ? <button onClick={() => confirm(`Reactivar a "${u.nombre}"?`, () => restoreUser(u.uid))} className="h-8 px-3 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-1"><UserCheck className="w-3 h-3" />Activar</button>
                        : <button onClick={() => confirm(`Suspender a "${u.nombre}"?`, () => suspendUser(u.uid))} className="h-8 px-3 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center gap-1"><UserMinus className="w-3 h-3" />Suspender</button>
                      }
                      <button onClick={() => openUserPanel(u, 'chat')} className="h-8 px-3 rounded-xl bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center gap-1"><Mail className="w-3 h-3" />Mensaje</button>
                      <button onClick={() => confirm(`Eliminar cuenta de "${u.nombre}"? Se desvinculará su correo y se eliminará de la base de datos de Lokal.`, () => deleteUser(u.uid))} className="h-8 px-3 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center gap-1"><UserX className="w-3 h-3" />Eliminar</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── REPORTES ── */}
          {activeTab === 'reportes' && (
            <div className="space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">{filteredReports.length} reportes · {pendingReports} pendientes</p>
              {filteredReports.map(r => (
                <div key={r.id} className={`${card} rounded-2xl p-4 ${r.estado === 'revisado' ? 'opacity-60' : ''}`}>
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${r.estado === 'pendiente' ? 'bg-rose-100 dark:bg-rose-500/15' : 'bg-slate-100 dark:bg-white/8'}`}>
                      <Flag className={`w-4 h-4 ${r.estado === 'pendiente' ? 'text-rose-500' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${r.tipo === 'tienda' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : r.tipo === 'producto' ? 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400' : 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400'}`}>{r.tipo}</span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.refNombre}</p>
                        <span className="text-xs text-slate-400 ml-auto shrink-0">{r.fecha}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-0.5">{r.motivo}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{r.desc}</p>
                    </div>
                  </div>
                  {/* Autor del reporte */}
                  {r.autorNombre && (
                    <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1">
                      <Users className="w-2.5 h-2.5" />Reportado por {r.autorNombre}
                    </p>
                  )}
                  {/* Respuesta admin existente */}
                  {r.adminRespuesta && (
                    <div className={`mt-3 p-3 rounded-xl ${isDark ? 'bg-emerald-500/8 border border-emerald-500/20' : 'bg-emerald-50 border border-emerald-200'}`}>
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1"><ShieldAlert className="w-2.5 h-2.5" />Respuesta admin</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300">{r.adminRespuesta}</p>
                    </div>
                  )}
                  {/* Composer de respuesta (inline) */}
                  {reportReplyOpen[r.id] && (
                    <div className={`mt-3 pt-3 border-t ${bdr} space-y-2`}>
                      <textarea
                        value={reportReplies[r.id] || ''}
                        onChange={e => setReportReplies(prev => ({ ...prev, [r.id]: e.target.value }))}
                        placeholder="Escribí tu respuesta al usuario que reportó..."
                        rows={3}
                        className={`w-full rounded-xl px-3 py-2 text-xs border ${bdr} ${card} text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
                      />
                      <div className="flex gap-2">
                        <button onClick={() => setReportReplyOpen(prev => ({ ...prev, [r.id]: false }))}
                          className="h-8 px-3 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-500 text-xs font-bold">Cancelar</button>
                        <button onClick={() => sendReportReply(r.id)}
                          disabled={!reportReplies[r.id]?.trim()}
                          className="flex-1 h-8 rounded-xl bg-primary text-white text-xs font-bold flex items-center justify-center gap-1 disabled:opacity-40">
                          <Send className="w-3 h-3" />Enviar respuesta y cerrar
                        </button>
                      </div>
                    </div>
                  )}
                  {r.estado === 'pendiente' && !reportReplyOpen[r.id] && (
                    <div className={`flex gap-2 mt-3 pt-3 border-t ${bdr}`}>
                      <button onClick={() => markReportReviewed(r.id)} className="flex-1 h-8 rounded-xl bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 text-xs font-bold">Marcar revisado</button>
                      <button onClick={() => setReportReplyOpen(prev => ({ ...prev, [r.id]: true }))}
                        className="flex-1 h-8 rounded-xl bg-sky-100 dark:bg-sky-500/15 text-sky-600 dark:text-sky-400 text-xs font-bold flex items-center justify-center gap-1">
                        <Reply className="w-3 h-3" />Responder
                      </button>
                      {r.tipo === 'tienda' && r.refId && (
                        <button onClick={() => confirm(`Suspender "${r.refNombre}"?`, () => { onSuspend('store', r.refId); markReportReviewed(r.id); })} className="flex-1 h-8 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center gap-1"><EyeOff className="w-3 h-3" />Suspender</button>
                      )}
                      <button onClick={() => confirm('Eliminar contenido reportado?', () => markReportReviewed(r.id))} className="flex-1 h-8 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1"><Trash2 className="w-3 h-3" />Eliminar</button>
                    </div>
                  )}
                  {r.estado === 'revisado' && !r.adminRespuesta && (
                    <button onClick={() => setReportReplyOpen(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
                      className={`mt-2 h-7 px-3 rounded-lg ${isDark ? 'bg-white/4' : 'bg-slate-50'} text-slate-400 text-[10px] font-bold flex items-center gap-1`}>
                      <Reply className="w-2.5 h-2.5" />Agregar respuesta tardía
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── MÓDULOS (Feature flags) ── */}
          {activeTab === 'modulos' && (
            <div className="space-y-4">
              <div>
                <h2 className="font-black text-lg text-slate-900 dark:text-white">Módulos del ecosistema</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Activá, pausá o marcá como beta cada módulo de la plataforma.</p>
              </div>
              <div className="space-y-3">
                {filteredModules.map(m => (
                  <div key={m.id} className={`${card} rounded-2xl p-4 flex items-center gap-4 ${!m.enabled ? 'opacity-60' : ''}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${m.enabled ? 'bg-primary/10' : 'bg-slate-100 dark:bg-white/8'}`}>
                      <m.icon className={`w-5 h-5 ${m.enabled ? 'text-primary' : 'text-slate-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{m.label}</p>
                        {m.beta && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 dark:bg-violet-500/15 text-violet-600 dark:text-violet-400 flex items-center gap-1">
                            <FlaskConical className="w-2.5 h-2.5" />Beta
                          </span>
                        )}
                        {m.cityLimited && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center gap-1">
                            <MapPin className="w-2.5 h-2.5" />Ciudad limitada
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400">{m.desc}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => toggleModule(m.id, 'beta')}
                        title="Marcar como beta"
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${m.beta ? 'bg-violet-100 dark:bg-violet-500/15 text-violet-600' : 'bg-slate-100 dark:bg-white/8 text-slate-400 hover:text-violet-500'}`}>
                        <FlaskConical className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => confirm(`${m.enabled ? 'Desactivar' : 'Activar'} módulo "${m.label}"?`, () => toggleModule(m.id, 'enabled'))}
                        className={`flex items-center gap-1.5 h-8 px-3 rounded-xl text-xs font-bold transition-colors ${m.enabled ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400' : 'bg-slate-100 dark:bg-white/8 text-slate-500'}`}>
                        {m.enabled ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        {m.enabled ? 'Activo' : 'Inactivo'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── HERRAMIENTAS ── */}
          {activeTab === 'tools' && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">Herramientas operativas de la plataforma</p>

              {/* Demo mode toggle */}
              <div className={`${card} rounded-2xl p-4 flex items-center gap-4 border-2 ${demoMode ? 'border-amber-400/50 dark:border-amber-500/40' : `border-transparent ${bdr}`}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${demoMode ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600' : 'bg-slate-100 dark:bg-white/8 text-slate-400'}`}>
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Datos de demo</p>
                    {demoMode && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/15 text-amber-600">Activo</span>}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">Muestra usuarios, reportes y chats de prueba. Desactivar antes de lanzar al público.</p>
                </div>
                <button onClick={() => toggleDemoMode()}
                  className={`shrink-0 w-12 h-6 rounded-full transition-colors relative ${demoMode ? 'bg-amber-400' : 'bg-slate-200 dark:bg-white/12'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${demoMode ? 'left-[26px]' : 'left-0.5'}`} />
                </button>
              </div>

              {[
                { Icon: Image,    color: 'bg-blue-100 dark:bg-blue-500/15 text-blue-600',       title: 'Banners promocionales',  desc: 'Crear y gestionar banners en el feed del home',              badge: 'Próximamente' },
                { Icon: Bell,     color: 'bg-violet-100 dark:bg-violet-500/15 text-violet-600', title: 'Campañas push',          desc: 'Enviar notificaciones push a usuarios o segmentos',          badge: 'Próximamente' },
                { Icon: Megaphone,color: 'bg-amber-100 dark:bg-amber-500/15 text-amber-600',   title: 'Modal de inicio',        desc: 'Configurar el modal que aparece al abrir la app',            badge: 'Próximamente' },
                { Icon: Zap,      color: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600', title: 'Secciones especiales', desc: 'Crear secciones destacadas con curaduría manual',          badge: 'Próximamente' },
                { Icon: Mail,     color: 'bg-rose-100 dark:bg-rose-500/15 text-rose-600',       title: 'Gestión de invitaciones', desc: 'Generar y revocar links de invitación para nuevas tiendas', badge: 'Próximamente' },
                { Icon: BarChart2,color: 'bg-primary/10 text-primary',                          title: 'Exportar datos',         desc: 'Exportar tiendas, productos y demandas a CSV',               badge: 'Próximamente' },
              ].map((tool, i) => (
                <div key={i} className={`${card} rounded-2xl p-4 flex items-center gap-4 opacity-75`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tool.color}`}>
                    <tool.Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{tool.title}</p>
                    <p className="text-xs text-slate-400 leading-relaxed">{tool.desc}</p>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-white/8 text-slate-500 shrink-0">{tool.badge}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── SOPORTE ── */}
          {activeTab === 'soporte' && (() => {
            const tabs = [
              { id: 'todos',    label: 'Todos',    count: supportChats.length },
              { id: 'abiertos', label: 'Abiertos', count: supportChats.filter(c => c.estado === 'abierto').length },
              { id: 'cerrados', label: 'Cerrados', count: supportChats.filter(c => c.estado === 'cerrado').length },
              { id: 'tiendas',  label: 'Tiendas',  count: supportChats.filter(c => c.autorRol === 'tienda').length },
              { id: 'usuarios', label: 'Usuarios', count: supportChats.filter(c => c.autorRol === 'usuario').length },
            ];
            const byTab = supportTab === 'abiertos' ? supportChats.filter(c => c.estado === 'abierto')
                       : supportTab === 'cerrados' ? supportChats.filter(c => c.estado === 'cerrado')
                       : supportTab === 'tiendas'  ? supportChats.filter(c => c.autorRol === 'tienda')
                       : supportTab === 'usuarios' ? supportChats.filter(c => c.autorRol === 'usuario')
                       : supportChats;
            const filtered = searchQ.trim()
              ? byTab.filter(c => c.autorNombre.toLowerCase().includes(searchQ.toLowerCase()) || c.asunto.toLowerCase().includes(searchQ.toLowerCase()))
              : byTab;

            // Componente reutilizable de lista — se usa en mobile y en panel izq. desktop
            const ChatList = () => (
              <div className="flex flex-col h-full">
                {/* Título + buscador */}
                <div className="px-3 pt-4 pb-2 shrink-0 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-black text-base text-slate-900 dark:text-white">Soporte</h2>
                    <span className="text-xs text-slate-400">{filtered.length} conv.</span>
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    <input
                      value={searchQ} onChange={e => setSearchQ(e.target.value)}
                      placeholder="Buscar conversación..."
                      className={`w-full pl-8 pr-3 h-8 rounded-xl text-xs border ${bdr} ${isDark ? 'bg-white/6' : 'bg-slate-50'} text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary`}
                    />
                  </div>
                </div>
                {/* Tabs */}
                <div className="grid grid-cols-5 gap-1 px-3 pb-3 shrink-0">
                  {tabs.map(t => (
                    <button key={t.id} onClick={() => setSupportTab(t.id)}
                      className={`flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${
                        supportTab === t.id ? 'bg-primary text-white' : `${card} border ${bdr} text-slate-500 dark:text-slate-400`
                      }`}>
                      <span>{t.label}</span>
                      {t.count > 0 && (
                        <span className={`text-[9px] font-black px-1 rounded-md leading-4 ${supportTab === t.id ? 'bg-white/25 text-white' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>
                          {t.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
                {/* Lista */}
                <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
                  {filtered.length === 0 && (
                    <div className="flex flex-col items-center py-16 gap-3 text-slate-400">
                      <Headphones className="w-10 h-10 opacity-20" />
                      <p className="text-sm font-semibold">Sin conversaciones</p>
                    </div>
                  )}
                  {filtered.map(c => {
                    const isClosed = c.estado === 'cerrado';
                    const lastMsg = c.mensajes[c.mensajes.length - 1];
                    const isActive = selectedChat?.id === c.id;
                    return (
                      <button key={c.id}
                        onClick={() => { setSelectedChat(c); setSupportReply(''); setSupportAttachments([]); setSupportAttachOpen(false); }}
                        className={`w-full flex items-start gap-3 rounded-2xl px-3 py-3.5 text-left transition-all ${
                          isActive   ? 'bg-primary/10 dark:bg-primary/15 ring-1 ring-primary/30'
                          : isClosed ? `${isDark ? 'bg-white/3' : 'bg-slate-50'} opacity-60 hover:opacity-90`
                                     : `${card} hover:${isDark ? 'bg-white/8' : 'bg-slate-50'}`
                        }`}>
                        {/* Avatar */}
                        <div className="relative shrink-0 mt-0.5">
                          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base ${isClosed ? 'bg-slate-100 dark:bg-white/8 text-slate-400' : 'bg-gradient-to-br from-primary/30 to-primary/10 text-primary'}`}>
                            {c.autorNombre[0]}
                          </div>
                          {/* Indicador estado */}
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 ${isDark ? 'border-[#111827]' : 'border-white'} ${isClosed ? 'bg-slate-300 dark:bg-slate-600' : 'bg-emerald-400'}`} />
                        </div>
                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className={`text-sm truncate ${isClosed ? 'font-medium text-slate-500' : 'font-bold text-slate-900 dark:text-white'}`}>{c.autorNombre}</p>
                            <p className="text-[10px] text-slate-400 shrink-0">{c.fecha}</p>
                          </div>
                          {/* Rol badge + asunto */}
                          <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${c.autorRol === 'tienda' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600' : 'bg-sky-100 dark:bg-sky-500/15 text-sky-600'}`}>
                              {c.autorRol === 'tienda' ? '🏪 Tienda' : '👤 Usuario'}
                            </span>
                            <p className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 truncate">{c.asunto}</p>
                          </div>
                          <p className="text-[11px] text-slate-400 truncate">{lastMsg?.texto || '—'}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );

            // Componente reutilizable del chat (usado en el overlay mobile y en el panel derecho desktop)
            const ChatView = ({ chat }) => {
              const isClosed = chat.estado === 'cerrado';
              return (
                <div className="flex flex-col h-full">
                  {/* Header del chat */}
                  <div className={`${card} border-b ${bdr} flex items-center gap-3 px-4 h-14 shrink-0`}>
                    <button onClick={() => setSelectedChat(null)}
                      className="lg:hidden w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0 text-slate-500">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0 font-black text-primary">
                      {chat.autorNombre[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 dark:text-white truncate">{chat.autorNombre}</p>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-slate-300 dark:bg-slate-600' : 'bg-emerald-400'}`} />
                        <p className="text-xs text-slate-400">{isClosed ? 'Cerrado' : chat.asunto}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => { const s = isClosed ? 'abierto' : 'cerrado'; setSupportChats(p => p.map(c => c.id === chat.id ? { ...c, estado: s } : c)); setSelectedChat(p => p ? { ...p, estado: s } : p); }}
                      title={isClosed ? 'Reabrir' : 'Cerrar'}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isClosed ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600' : 'bg-slate-100 dark:bg-white/8 text-slate-400 hover:text-slate-600'}`}>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                    <button onClick={() => { const u = users.find(u => u.uid === chat.autorUid); if (u) openUserPanel(u, 'main', true); }}
                      className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                      <Users className="w-4 h-4" />
                    </button>
                  </div>
                  {/* Mensajes */}
                  <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                    <div className="flex justify-center mb-2">
                      <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${isDark ? 'bg-white/8 text-slate-400' : 'bg-white text-slate-400 shadow-sm'}`}>{chat.asunto}</span>
                    </div>
                    {chat.mensajes.map((m, i) => (
                      <div key={i} className={`flex flex-col gap-2 ${m.de === 'admin' ? 'items-end' : 'items-start'}`}>
                        {m.adjuntos?.length > 0 && (
                          <div className={`flex flex-col gap-2 w-full max-w-[80%] ${m.de === 'admin' ? 'items-end ml-auto' : 'items-start'}`}>
                            {m.adjuntos.map(aId => (
                              <AttachCard key={aId} aId={aId} uid={chat.autorUid} msgKey={`dv_${i}`} />
                            ))}
                          </div>
                        )}
                        {m.texto && (
                          <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${m.de === 'admin' ? 'bg-primary text-white rounded-tr-sm' : `${isDark ? 'bg-white/10' : 'bg-white shadow-sm'} text-slate-900 dark:text-white rounded-tl-sm`}`}>
                            <p className="text-sm leading-relaxed">{m.texto}</p>
                            <p className={`text-[10px] mt-1 ${m.de === 'admin' ? 'text-white/60' : 'text-slate-400'}`}>{m.fecha}</p>
                          </div>
                        )}
                      </div>
                    ))}
                    <div ref={supportChatEndRef} />
                  </div>
                  {/* Composer */}
                  {!isClosed ? (
                    <div className={`${card} border-t ${bdr} shrink-0`}>
                      {supportAttachOpen && (
                        <div className={`border-b ${bdr} px-4 py-3`}>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Adjuntar contexto</p>
                          <div className="grid grid-cols-2 gap-2">
                            {ALL_ATTACH_OPTS.map(opt => {
                              const isOn = supportAttachments.includes(opt.id);
                              return (
                                <button key={opt.id}
                                  onClick={() => setSupportAttachments(prev => isOn ? prev.filter(a => a !== opt.id) : [...prev, opt.id])}
                                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors ${isOn ? `border-transparent ${opt.bg}` : `border-slate-200 dark:border-white/10 ${isDark ? 'bg-white/4' : 'bg-slate-50'}`}`}>
                                  <opt.Icon className={`w-4 h-4 shrink-0 ${isOn ? opt.color : 'text-slate-400'}`} />
                                  <span className={`text-xs font-bold leading-tight ${isOn ? opt.color : 'text-slate-600 dark:text-slate-300'}`}>{opt.label}</span>
                                </button>
                              );
                            })}
                          </div>
                          {supportAttachments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {supportAttachments.map(aId => {
                                const meta = ATTACH_META_MAP[aId]; if (!meta) return null;
                                return (
                                  <button key={aId} onClick={() => setSupportAttachments(p => p.filter(a => a !== aId))}
                                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${meta.bg} ${meta.color}`}>
                                    <meta.Icon className="w-2.5 h-2.5" />{meta.label}<X className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex items-end gap-2 px-3 py-3">
                        <div className="relative shrink-0">
                          <button onClick={() => setSupportAttachOpen(v => !v)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${supportAttachOpen || supportAttachments.length > 0 ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-white/8 text-slate-400 hover:text-slate-600'}`}>
                            <Paperclip className="w-4 h-4" />
                          </button>
                          {supportAttachments.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center pointer-events-none">{supportAttachments.length}</span>
                          )}
                        </div>
                        <textarea
                          value={supportReply}
                          onChange={e => setSupportReply(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSupportReply(chat.id, true); } }}
                          placeholder="Escribí tu respuesta..."
                          rows={1}
                          style={{ maxHeight: '120px', overflowY: 'auto' }}
                          className={`flex-1 rounded-2xl px-4 py-2.5 text-sm border ${bdr} ${isDark ? 'bg-white/6' : 'bg-slate-50'} text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
                        />
                        <button disabled={!supportReply.trim() && supportAttachments.length === 0}
                          onClick={() => sendSupportReply(chat.id, true)}
                          className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 text-white disabled:opacity-40">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                      {(supportReply.trim() || supportAttachments.length > 0) && (
                        <button onClick={() => sendSupportReply(chat.id, false)}
                          className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pb-3">
                          Enviar y cerrar conversación
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className={`${card} border-t ${bdr} px-4 py-3 text-center shrink-0`}>
                      <p className="text-xs text-slate-400">Conversación cerrada ·
                        <button onClick={() => { setSupportChats(p => p.map(c => c.id === chat.id ? { ...c, estado: 'abierto' } : c)); setSelectedChat(p => p ? { ...p, estado: 'abierto' } : p); }}
                          className="ml-1 text-primary font-bold hover:underline">Reabrir</button>
                      </p>
                    </div>
                  )}
                </div>
              );
            };

            // ── Panel de datos de usuario — columna inline en el split desktop ──
            const UserPanel = () => {
              if (!selectedUser) return null;
              const u = selectedUser;
              const logIcons = {
                registro: { Icon: UserCheck,     color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15' },
                tienda:   { Icon: Store,         color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15' },
                producto: { Icon: Package,       color: 'text-blue-500',    bg: 'bg-blue-100 dark:bg-blue-500/15' },
                demanda:  { Icon: MessageSquare, color: 'text-violet-500',  bg: 'bg-violet-100 dark:bg-violet-500/15' },
                reporte:  { Icon: Flag,          color: 'text-rose-500',    bg: 'bg-rose-100 dark:bg-rose-500/15' },
                admin:    { Icon: ShieldAlert,   color: 'text-amber-500',   bg: 'bg-amber-100 dark:bg-amber-500/15' },
              };
              const uTienda    = tiendas.find(t => t.nombre && u.tieneTienda && t.id);
              const uProductos = ofertas.filter(o => uTienda && (o.tiendaId === uTienda.id || o.tiendaNombre === uTienda.nombre));
              const uDemandas  = demandas.filter(d => d.usuarioId === u.uid || d.autorEmail === u.email);
              const uReportes  = reports.filter(r => r.refId && uTienda && String(r.refId) === String(uTienda?.id));
              const isSubView  = userPanelView !== 'main';
              const viewTitles = { main: null, demandas: 'Demandas', productos: 'Productos', reportes: 'Reportes', tienda: 'Tienda', suscripcion: 'Suscripción', chat: 'Mensaje admin' };

              return (
                <div className={`flex flex-col h-full overflow-hidden ${card}`}>
                  {/* Header */}
                  <div className={`flex items-center gap-3 px-4 h-14 border-b ${bdr} shrink-0`}>
                    {isSubView
                      ? <button onClick={() => setUserPanelView('main')}
                          className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white shrink-0">
                          <ArrowLeft className="w-4 h-4" />
                        </button>
                      : <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                          <span className="text-sm font-black text-primary">{u.nombre[0]}</span>
                        </div>
                    }
                    <div className="flex-1 min-w-0">
                      {isSubView
                        ? <><p className="text-sm font-black text-slate-900 dark:text-white">{viewTitles[userPanelView]}</p>
                            <p className="text-xs text-slate-400 truncate">{u.nombre}</p></>
                        : <><p className="text-sm font-black text-slate-900 dark:text-white truncate">{u.nombre}</p>
                            <p className="text-[10px] text-slate-400 truncate">{u.email}</p></>
                      }
                    </div>
                    <button onClick={closeUserPanel}
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white shrink-0">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Body — scrollable */}
                  <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

                    {/* Sub-views */}
                    {userPanelView === 'tienda' && (() => {
                      if (!uTienda) return <p className="text-sm text-slate-400 py-8 text-center">Sin tienda registrada</p>;
                      return (
                        <div className={`rounded-2xl border ${bdr} overflow-hidden`}>
                          <div className="px-4 py-3 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 flex items-center justify-center shrink-0">
                              <Store className="w-4 h-4 text-emerald-600" />
                            </div>
                            <div>
                              <p className="font-black text-sm text-slate-900 dark:text-white">{uTienda.nombre}</p>
                              <p className="text-[10px] text-slate-400">{uTienda.categoria}</p>
                            </div>
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            {[['Dirección', uTienda.direccion], ['Teléfono', uTienda.telefono], ['Horario', uTienda.horario]].filter(([,v]) => v).map(([k,v]) => (
                              <div key={k} className="flex justify-between text-xs gap-3"><span className="text-slate-400">{k}</span><span className="font-semibold text-slate-900 dark:text-white text-right">{v}</span></div>
                            ))}
                            <div className="flex justify-between text-xs">
                              <span className="text-slate-400">Estado</span>
                              <span className={`font-black px-2 py-0.5 rounded-full text-[10px] ${uTienda.activa !== false ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600' : 'bg-slate-100 dark:bg-white/8 text-slate-400'}`}>
                                {uTienda.activa !== false ? 'Activa' : 'Inactiva'}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}

                    {userPanelView === 'productos' && (() => {
                      if (!uProductos.length) return <p className="text-sm text-slate-400 py-8 text-center">Sin productos publicados</p>;
                      return <div className="space-y-2">{uProductos.map(p => (
                        <div key={p.id} className={`flex items-center gap-3 p-3 rounded-xl border ${bdr} ${card}`}>
                          <Package className="w-4 h-4 text-blue-400 shrink-0" />
                          <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{p.nombre}</p>
                          <p className="text-[10px] text-slate-400">${p.precio?.toLocaleString?.() ?? p.precio}</p></div>
                        </div>
                      ))}</div>;
                    })()}

                    {userPanelView === 'demandas' && (() => {
                      if (!uDemandas.length) return <p className="text-sm text-slate-400 py-8 text-center">Sin demandas</p>;
                      return <div className="space-y-2">{uDemandas.map(d => (
                        <div key={d.id} className={`p-3 rounded-xl border ${bdr} ${card}`}>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white">{d.titulo}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{d.categoria} · {d.fecha}</p>
                        </div>
                      ))}</div>;
                    })()}

                    {userPanelView === 'reportes' && (() => {
                      if (!uReportes.length) return <p className="text-sm text-slate-400 py-8 text-center">Sin reportes</p>;
                      return <div className="space-y-2">{uReportes.map(r => (
                        <div key={r.id} className={`p-3 rounded-xl border ${bdr} ${card}`}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <p className="text-xs font-semibold text-slate-900 dark:text-white">{r.motivo}</p>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${r.estado === 'pendiente' ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600'}`}>{r.estado}</span>
                          </div>
                          <p className="text-[10px] text-slate-400">{r.tipo} · {r.fecha}</p>
                        </div>
                      ))}</div>;
                    })()}

                    {userPanelView === 'suscripcion' && (() => {
                      const s = u.suscripcion;
                      if (!s) return <p className="text-sm text-slate-400 py-8 text-center">Sin suscripción activa</p>;
                      return (
                        <div className={`rounded-2xl border ${bdr} overflow-hidden`}>
                          <div className="px-4 py-3 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0"><CreditCard className="w-4 h-4 text-primary" /></div>
                            <div><p className="font-black text-sm text-slate-900 dark:text-white">{s.plan}</p>
                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${s.estado === 'activa' ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600'}`}>{s.estado}</span></div>
                          </div>
                          <div className="px-4 py-3 space-y-2">
                            {[['Activa desde', s.desde], ['Monto', s.monto ? `${s.monto} / mes` : null]].filter(([,v]) => v).map(([k,v]) => (
                              <div key={k} className="flex justify-between text-xs"><span className="text-slate-400">{k}</span><span className="font-semibold text-slate-900 dark:text-white">{v}</span></div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Vista principal */}
                    {userPanelView === 'main' && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          {[
                            { label: 'Demandas',  value: u.demandasPublicadas,        Icon: MessageSquare, color: 'text-violet-500 bg-violet-100 dark:bg-violet-500/15',   view: 'demandas',   clickable: u.demandasPublicadas > 0 },
                            { label: 'Productos', value: u.productosPublicados ?? 0,  Icon: Package,       color: 'text-blue-500 bg-blue-100 dark:bg-blue-500/15',          view: 'productos',  clickable: (u.productosPublicados ?? 0) > 0 },
                            { label: 'Reportes',  value: u.reportesRecibidos,          Icon: Flag,          color: u.reportesRecibidos > 0 ? 'text-rose-500 bg-rose-100 dark:bg-rose-500/15' : 'text-slate-400 bg-slate-100 dark:bg-white/8', view: 'reportes', clickable: u.reportesRecibidos > 0 },
                            { label: 'Tienda',    value: u.tieneTienda ? 'Ver' : '—', Icon: Store,         color: u.tieneTienda ? 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/15' : 'text-slate-400 bg-slate-100 dark:bg-white/8', view: 'tienda', clickable: u.tieneTienda },
                          ].map((s, i) => (
                            <button key={i} disabled={!s.clickable} onClick={() => s.clickable && setUserPanelView(s.view)}
                              className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl p-3 flex items-center gap-2 text-left ${s.clickable ? 'hover:bg-slate-100 dark:hover:bg-white/8' : 'cursor-default'} transition-colors`}>
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}><s.Icon className="w-3.5 h-3.5" /></div>
                              <div><p className="text-sm font-black text-slate-900 dark:text-white">{s.value}</p><p className="text-[10px] text-slate-400">{s.label}</p></div>
                              {s.clickable && <ChevronRight className="w-3 h-3 text-slate-300 ml-auto" />}
                            </button>
                          ))}
                        </div>
                        <div className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl divide-y ${bdr}`}>
                          {[
                            { label: 'Rol',              value: u.rol,             Icon: ShieldCheck  },
                            { label: 'Ciudad',           value: u.ciudad || '—',   Icon: MapPin       },
                            { label: 'Alta',             value: u.fechaAlta,       Icon: CalendarDays },
                            { label: 'Última actividad', value: u.ultimaActividad, Icon: Clock        },
                          ].map((row, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                              <row.Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">{row.label}</p>
                              <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{row.value}</p>
                            </div>
                          ))}
                          <button onClick={() => u.suscripcion && setUserPanelView('suscripcion')} disabled={!u.suscripcion}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-left ${u.suscripcion ? 'hover:bg-slate-50 dark:hover:bg-white/4' : ''} transition-colors`}>
                            <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">Suscripción</p>
                            <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">
                              {u.suscripcion ? `${u.suscripcion.plan} · ${u.suscripcion.estado}` : 'Sin plan'}
                            </p>
                            {u.suscripcion && <ChevronRight className="w-3 h-3 text-slate-300 shrink-0" />}
                          </button>
                        </div>
                        {u.bio && (
                          <div className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl px-4 py-3`}>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Bio</p>
                            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{u.bio}</p>
                          </div>
                        )}
                        <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Historial</p>
                          {u.activityLog.map((entry, i) => {
                            const li = logIcons[entry.tipo] || logIcons.admin;
                            return (
                              <div key={i} className="flex items-start gap-3">
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${li.bg}`}><li.Icon className={`w-3 h-3 ${li.color}`} /></div>
                                <div className="flex-1 min-w-0"><p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{entry.desc}</p><p className="text-[10px] text-slate-400">{entry.fecha}</p></div>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Footer */}
                  {userPanelView === 'main' && u.rol !== 'admin' && (
                    <div className={`px-4 py-[0.85rem] border-t ${bdr} shrink-0 flex gap-2`}>
                      {u.suspendido
                        ? <button onClick={() => confirm(`Reactivar a "${u.nombre}"?`, () => { restoreUser(u.uid); setSelectedUser(s => s ? { ...s, suspendido: false } : s); })}
                            className="flex-1 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 text-xs font-bold flex items-center justify-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5" />Activar
                          </button>
                        : <button onClick={() => confirm(`Suspender a "${u.nombre}"?`, () => { suspendUser(u.uid); setSelectedUser(s => s ? { ...s, suspendido: true } : s); })}
                            className="flex-1 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 text-xs font-bold flex items-center justify-center gap-1.5">
                            <UserMinus className="w-3.5 h-3.5" />Suspender
                          </button>
                      }
                      <button onClick={() => confirm(`Eliminar cuenta de "${u.nombre}"?`, () => { deleteUser(u.uid); closeUserPanel(); })}
                        className="flex-1 h-9 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5">
                        <UserX className="w-3.5 h-3.5" />Eliminar
                      </button>
                    </div>
                  )}
                </div>
              );
            };

            // ── Mobile: lista o chat (full-screen via overlay se maneja fuera) ──
            // ── Desktop: split panel ──
            return (
              <>
                {/* Desktop split panel — card tratada igual que el panel de usuario */}
                <div className={`hidden lg:flex flex-1 overflow-hidden m-3 rounded-2xl border ${bdr} shadow-sm`}>
                  {/* Panel izquierdo — lista, ancho fijo generoso */}
                  <div className={`w-96 shrink-0 ${card} border-r ${bdr} flex flex-col overflow-hidden rounded-l-2xl`}>
                    {ChatList()}
                  </div>
                  {/* Panel central — chat o estado vacío */}
                  <div className={`flex-1 flex flex-col overflow-hidden ${!(selectedUser && userPanelFromChat) ? 'rounded-r-2xl' : ''}`}>
                    {selectedChat
                      ? ChatView({ chat: selectedChat })
                      : (
                        <div className={`flex flex-col items-center justify-center h-full gap-4 ${!(selectedUser && userPanelFromChat) ? 'rounded-r-2xl' : ''} ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
                          <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center">
                            <Headphones className="w-8 h-8 text-primary opacity-60" />
                          </div>
                          <div className="text-center">
                            <p className="font-black text-slate-900 dark:text-white mb-1">Bandeja de soporte</p>
                            <p className="text-sm text-slate-400 max-w-xs">Seleccioná una conversación para ver el hilo completo y responder.</p>
                          </div>
                          {supportChats.filter(c => c.estado === 'abierto').length > 0 && (
                            <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-sky-100 dark:bg-sky-500/15 text-sky-600 text-sm font-bold">
                              <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
                              {supportChats.filter(c => c.estado === 'abierto').length} conversación{supportChats.filter(c => c.estado === 'abierto').length > 1 ? 'es' : ''} abierta{supportChats.filter(c => c.estado === 'abierto').length > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      )
                    }
                  </div>
                  {/* Panel derecho — datos de usuario (columna real del flex) */}
                  {selectedUser && userPanelFromChat && (
                    <div className={`w-80 shrink-0 border-l ${bdr} flex flex-col overflow-hidden rounded-r-2xl`}>
                      {UserPanel()}
                    </div>
                  )}
                </div>

                {/* Mobile: solo la lista (el chat abierto se muestra en el overlay externo) */}
                <div className="lg:hidden flex-1 overflow-y-auto px-4 py-4">
                  {ChatList()}
                </div>
              </>
            );
          })()}

          {/* bottom padding for mobile nav — solo en tabs sin split-panel */}
          {activeTab !== 'soporte' && <div className="h-6" />}
        </main>
      </div>

      {/* ── Mobile bottom nav ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-[4500] bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/8">
        <div className="flex items-end px-1 pt-2 pb-3 max-w-md mx-auto">
          {BOTTOM_TABS.map((tab, i) => {
            const active = activeTab === tab.id;
            const isCenter = i === 2;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className="flex-1 flex flex-col items-center gap-1"
                style={isCenter ? { marginTop: '-14px' } : {}}>
                <div className={`flex items-center justify-center rounded-2xl transition-colors ${
                  isCenter
                    ? `w-14 h-14 ${active ? 'bg-sky-500' : 'bg-sky-400'}`
                    : `w-10 h-10 rounded-xl ${active ? 'bg-slate-900 dark:bg-sky-500/15' : 'bg-slate-100 dark:bg-white/5'}`
                }`}
                  style={isCenter ? { boxShadow: '0 4px 18px rgba(14,165,233,0.45)' } : {}}>
                  <tab.Icon className={`w-5 h-5 ${
                    isCenter ? 'text-white' : active ? 'text-white dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'
                  }`} />
                </div>
                <span className={`text-[10px] font-semibold ${active ? 'text-slate-900 dark:text-sky-400' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
          {/* Más */}
          {(() => {
            const masActive = moreSheetOpen || !BOTTOM_TABS.find(t => t.id === activeTab);
            return (
              <button onClick={() => setMoreSheetOpen(v => !v)} className="flex-1 flex flex-col items-center gap-1">
                <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${masActive ? 'bg-slate-900 dark:bg-sky-500/15' : 'bg-slate-100 dark:bg-white/5'}`}>
                  <Menu className={`w-5 h-5 ${masActive ? 'text-white dark:text-sky-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  {pendingReports > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 flex items-center justify-center text-[9px] font-bold text-white">
                      {pendingReports > 9 ? '9+' : pendingReports}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-semibold ${masActive ? 'text-slate-900 dark:text-sky-400' : 'text-slate-500'}`}>Más</span>
              </button>
            );
          })()}
        </div>
      </div>

      {/* ── Support chat overlay (full-screen, mobile only) ── */}
      {selectedChat && activeTab === 'soporte' && (() => {
        const chat = selectedChat;
        const isClosed = chat.estado === 'cerrado';

        // reutiliza ATTACH_META_MAP y ALL_ATTACH_OPTS definidos en el bloque soporte

        return (
          <div className="lg:hidden fixed inset-0 z-[4700] flex flex-col" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
            {/* Header */}
            <div className={`${card} border-b ${bdr} flex items-center gap-3 px-4 h-14 shrink-0`}>
              <button onClick={() => { setSelectedChat(null); setSupportReply(''); setSupportAttachments([]); setSupportAttachOpen(false); }}
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0 text-slate-500 hover:text-slate-800 dark:hover:text-white">
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                <span className="font-black text-primary">{chat.autorNombre[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-900 dark:text-white truncate">{chat.autorNombre}</p>
                <div className="flex items-center gap-1.5">
                  <div className={`w-1.5 h-1.5 rounded-full ${isClosed ? 'bg-slate-300 dark:bg-slate-600' : 'bg-emerald-400'}`} />
                  <p className="text-xs text-slate-400 font-medium">{isClosed ? 'Cerrado' : chat.asunto}</p>
                </div>
              </div>
              {/* Toggle abierto/cerrado */}
              <button
                onClick={() => { const s = isClosed ? 'abierto' : 'cerrado'; setSupportChats(p => p.map(c => c.id === chat.id ? { ...c, estado: s } : c)); setSelectedChat(p => p ? { ...p, estado: s } : p); }}
                title={isClosed ? 'Reabrir conversación' : 'Cerrar conversación'}
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${isClosed ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600' : 'bg-slate-100 dark:bg-white/8 text-slate-400 hover:text-slate-600'}`}>
                <CheckCircle className="w-4 h-4" />
              </button>
              {/* Ir al perfil del usuario */}
              <button
                onClick={() => { const u = users.find(u => u.uid === chat.autorUid); if (u) openUserPanel(u, 'main', true); }}
                title="Ver perfil del usuario"
                className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <Users className="w-4 h-4" />
              </button>
            </div>

            {/* Mensajes */}
            <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
              {/* Asunto / contexto */}
              <div className={`flex justify-center`}>
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${isDark ? 'bg-white/8 text-slate-400' : 'bg-white text-slate-400 shadow-sm'}`}>
                  {chat.asunto}
                </span>
              </div>

              {chat.mensajes.map((m, i) => (
                <div key={i} className={`flex flex-col gap-1 ${m.de === 'admin' ? 'items-end' : 'items-start'}`}>
                  {/* Adjuntos como tarjetas inline */}
                  {m.adjuntos?.length > 0 && (
                    <div className={`flex flex-col gap-2 w-full max-w-[80%] ${m.de === 'admin' ? 'items-end ml-auto' : 'items-start'}`}>
                      {m.adjuntos.map(aId => (
                        <AttachCard key={aId} aId={aId} uid={chat.autorUid} msgKey={`ov_${i}`} />
                      ))}
                    </div>
                  )}
                  {/* Burbuja de texto */}
                  {m.texto && (
                    <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      m.de === 'admin'
                        ? 'bg-primary text-white rounded-tr-sm'
                        : `${isDark ? 'bg-white/10' : 'bg-white shadow-sm'} text-slate-900 dark:text-white rounded-tl-sm`
                    }`}>
                      <p className="text-sm leading-relaxed">{m.texto}</p>
                      <p className={`text-[10px] mt-1 ${m.de === 'admin' ? 'text-white/60' : 'text-slate-400'}`}>{m.fecha}</p>
                    </div>
                  )}
                  {!m.texto && m.adjuntos?.length > 0 && (
                    <p className={`text-[10px] ${m.de === 'admin' ? 'text-primary/60' : 'text-slate-400'}`}>{m.fecha}</p>
                  )}
                </div>
              ))}
              <div ref={supportChatEndRef} />
            </div>

            {/* Composer */}
            {!isClosed && (
              <div className={`${card} border-t ${bdr} shrink-0`} style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}>
                {/* Panel de adjuntos — se despliega arriba */}
                {supportAttachOpen && (
                  <div className={`border-b ${bdr} px-4 py-3`}>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Adjuntar contexto</p>
                    <div className="grid grid-cols-2 gap-2">
                      {ALL_ATTACH_OPTS.map(opt => {
                        const isOn = supportAttachments.includes(opt.id);
                        return (
                          <button key={opt.id}
                            onClick={() => setSupportAttachments(prev => isOn ? prev.filter(a => a !== opt.id) : [...prev, opt.id])}
                            className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                              isOn ? `border-transparent ${opt.bg}` : `border-slate-200 dark:border-white/10 ${isDark ? 'bg-white/4' : 'bg-slate-50'}`
                            }`}>
                            <opt.Icon className={`w-4 h-4 shrink-0 ${isOn ? opt.color : 'text-slate-400'}`} />
                            <span className={`text-xs font-bold leading-tight ${isOn ? opt.color : 'text-slate-600 dark:text-slate-300'}`}>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                    {supportAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {supportAttachments.map(aId => {
                          const meta = ATTACH_META_MAP[aId]; if (!meta) return null;
                          return (
                            <button key={aId} onClick={() => setSupportAttachments(p => p.filter(a => a !== aId))}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold ${meta.bg} ${meta.color}`}>
                              <meta.Icon className="w-2.5 h-2.5" />{meta.label}<X className="w-2.5 h-2.5 ml-0.5 opacity-60" />
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
                {/* Input row */}
                <div className="flex items-end gap-2 px-3 py-3">
                  <button onClick={() => setSupportAttachOpen(v => !v)}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${supportAttachOpen || supportAttachments.length > 0 ? 'bg-primary/10 text-primary' : 'bg-slate-100 dark:bg-white/8 text-slate-400 hover:text-slate-600'}`}>
                    <Paperclip className="w-4 h-4" />
                    {supportAttachments.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-white text-[9px] font-bold flex items-center justify-center">{supportAttachments.length}</span>
                    )}
                  </button>
                  <textarea
                    value={supportReply}
                    onChange={e => setSupportReply(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSupportReply(chat.id, true); } }}
                    placeholder="Escribí tu respuesta..."
                    rows={1}
                    style={{ maxHeight: '120px', overflowY: 'auto' }}
                    className={`flex-1 rounded-2xl px-4 py-2.5 text-sm border ${bdr} ${isDark ? 'bg-white/6' : 'bg-slate-50'} text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
                  />
                  <button
                    disabled={!supportReply.trim() && supportAttachments.length === 0}
                    onClick={() => sendSupportReply(chat.id, true)}
                    className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0 text-white disabled:opacity-40 transition-opacity">
                    <Send className="w-4 h-4" />
                  </button>
                </div>
                {/* Cerrar conversación */}
                {(supportReply.trim() || supportAttachments.length > 0) && (
                  <button onClick={() => sendSupportReply(chat.id, false)}
                    className="w-full text-center text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 pb-2">
                    Enviar y cerrar conversación
                  </button>
                )}
              </div>
            )}
            {isClosed && (
              <div className={`${card} border-t ${bdr} px-4 py-3 text-center shrink-0`}>
                <p className="text-xs text-slate-400">Conversación cerrada ·
                  <button onClick={() => { setSupportChats(p => p.map(c => c.id === chat.id ? { ...c, estado: 'abierto' } : c)); setSelectedChat(p => p ? { ...p, estado: 'abierto' } : p); }}
                    className="ml-1 text-primary font-bold hover:underline">Reabrir</button>
                </p>
              </div>
            )}
          </div>
        );
      })()}

      {/* ── User detail panel ── */}
      {selectedUser && (() => {
        const u = selectedUser;

        // íconos para el log
        const logIcons = {
          registro: { Icon: UserCheck,     color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15' },
          tienda:   { Icon: Store,         color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15' },
          producto: { Icon: Package,       color: 'text-blue-500',    bg: 'bg-blue-100 dark:bg-blue-500/15' },
          demanda:  { Icon: MessageSquare, color: 'text-violet-500',  bg: 'bg-violet-100 dark:bg-violet-500/15' },
          reporte:  { Icon: Flag,          color: 'text-rose-500',    bg: 'bg-rose-100 dark:bg-rose-500/15' },
          admin:    { Icon: ShieldAlert,   color: 'text-amber-500',   bg: 'bg-amber-100 dark:bg-amber-500/15' },
        };

        // datos relacionados al usuario
        const uTienda      = tiendas.find(t => t.nombre && u.tieneTienda && t.id);
        const uProductos   = ofertas.filter(o => uTienda && (o.tiendaId === uTienda.id || o.tiendaNombre === uTienda.nombre));
        const uDemandas    = demandas.filter(d => d.usuarioId === u.uid || d.autorEmail === u.email);
        const uReportes    = reports.filter(r => r.refId && uTienda && String(r.refId) === String(uTienda.id));

        // mock historial de pagos (en producción vendría de MP)
        const paymentHistory = u.suscripcion ? [
          { id: 'p3', fecha: '2026-05-07', monto: 1490, estado: 'aprobado', plan: u.suscripcion.plan, metodo: 'Tarjeta Visa ****4521' },
          { id: 'p2', fecha: '2026-04-07', monto: 1490, estado: 'aprobado', plan: u.suscripcion.plan, metodo: 'Tarjeta Visa ****4521' },
          { id: 'p1', fecha: '2026-03-07', monto: 990,  estado: 'aprobado', plan: 'Básico',           metodo: 'Tarjeta Visa ****4521' },
        ] : [];

        // vistas
        const viewTitles = {
          main:       null,
          demandas:   'Demandas publicadas',
          productos:  'Productos publicados',
          reportes:   'Reportes recibidos',
          tienda:     'Tienda asociada',
          suscripcion:'Historial de pagos',
          chat:       'Mensaje admin',
        };

        // sub-vista: tienda
        const renderTiendaView = () => {
          if (!uTienda) return (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <Store className="w-10 h-10 opacity-30" />
              <p className="text-sm font-semibold">Sin tienda asociada</p>
            </div>
          );
          const conFoto = uProductos.filter(o => o.galeria?.[0] || o.fotos?.[0]).length;
          return (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/8 shrink-0">
                  {uTienda.logo ? <img src={uTienda.logo} className="w-full h-full object-cover" alt="" /> : <Store className="w-7 h-7 m-auto mt-4.5 text-slate-400" />}
                </div>
                <div>
                  <p className="font-black text-base text-slate-900 dark:text-white">{uTienda.nombre}</p>
                  <p className="text-xs text-slate-400">{uTienda.rubro} · {uTienda.ciudad}</p>
                  {uTienda.rating && <p className="text-xs font-bold text-amber-500 mt-0.5">★ {uTienda.rating}</p>}
                </div>
              </div>
              <div className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl divide-y ${bdr}`}>
                {[
                  { label: 'Estado',    value: suspended.stores.has(uTienda.id) ? 'Suspendida' : 'Activa', Icon: ShieldCheck },
                  { label: 'Productos', value: uProductos.length,                                           Icon: Package },
                  { label: 'Con foto',  value: `${conFoto} / ${uProductos.length}`,                        Icon: Image },
                  { label: 'Teléfono', value: uTienda.telefono || '—',                                     Icon: Bell },
                  { label: 'Horarios',  value: uTienda.horarios ? 'Cargados' : 'Sin horario',              Icon: Clock },
                ].map((row, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3">
                    <row.Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">{row.label}</p>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{row.value}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                {suspended.stores.has(uTienda.id)
                  ? <button onClick={() => confirm(`Activar "${uTienda.nombre}"?`, () => onRestore('store', uTienda.id))}
                      className="flex-1 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 text-xs font-bold flex items-center justify-center gap-1.5">
                      <RotateCcw className="w-3.5 h-3.5" />Activar tienda
                    </button>
                  : <button onClick={() => confirm(`Suspender "${uTienda.nombre}"?`, () => onSuspend('store', uTienda.id))}
                      className="flex-1 h-9 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 text-xs font-bold flex items-center justify-center gap-1.5">
                      <EyeOff className="w-3.5 h-3.5" />Suspender tienda
                    </button>
                }
                <button onClick={() => confirm(`Eliminar tienda "${uTienda.nombre}"?`, () => onDelete('store', uTienda.id))}
                  className="flex-1 h-9 rounded-xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5">
                  <Trash2 className="w-3.5 h-3.5" />Eliminar tienda
                </button>
              </div>
            </div>
          );
        };

        // sub-vista: demandas
        const renderDemandasView = () => uDemandas.length === 0
          ? <div className="flex flex-col items-center py-12 gap-2 text-slate-400"><MessageSquare className="w-10 h-10 opacity-30" /><p className="text-sm font-semibold">Sin demandas publicadas</p></div>
          : <div className="space-y-3">
              {uDemandas.map(d => (
                <div key={d.id} className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl p-4`}>
                  <div className="flex items-start gap-2 mb-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex-1 leading-snug">{d.titulo}</p>
                    <StatusBadge suspended={suspended.demands?.has(d.id)} />
                  </div>
                  <p className="text-[10px] text-slate-400">{d.tiempoCreado} · {d.respuestas || 0} respuestas</p>
                  <div className="flex gap-1.5 mt-3">
                    {suspended.demands?.has(d.id)
                      ? <button onClick={() => confirm('Activar demanda?', () => onRestore('demand', d.id))} className="h-7 px-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 text-[10px] font-bold flex items-center gap-1"><RotateCcw className="w-3 h-3" />Activar</button>
                      : <button onClick={() => confirm('Suspender demanda?', () => onSuspend('demand', d.id))} className="h-7 px-2.5 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-600 text-[10px] font-bold flex items-center gap-1"><EyeOff className="w-3 h-3" />Suspender</button>
                    }
                    <button onClick={() => confirm('Eliminar esta demanda?', () => onDelete('demand', d.id))} className="h-7 px-2.5 rounded-lg bg-rose-100 dark:bg-rose-500/15 text-rose-600 text-[10px] font-bold flex items-center gap-1"><Trash2 className="w-3 h-3" />Eliminar</button>
                  </div>
                </div>
              ))}
            </div>;

        // sub-vista: productos
        const renderProductosView = () => uProductos.length === 0
          ? <div className="flex flex-col items-center py-12 gap-2 text-slate-400"><Package className="w-10 h-10 opacity-30" /><p className="text-sm font-semibold">Sin productos publicados</p></div>
          : <div className="space-y-3">
              {uProductos.map(o => {
                const img = o.galeria?.[0] || o.fotos?.[0];
                return (
                  <div key={o.id} className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl p-3 flex items-center gap-3`}>
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/8 shrink-0">
                      {img ? <img src={img} className="w-full h-full object-cover" alt="" /> : <Package className="w-5 h-5 m-auto mt-2.5 text-slate-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{o.titulo}</p>
                      {o.precio && <p className="text-[10px] font-bold text-primary">${Number(o.precio).toLocaleString()}</p>}
                    </div>
                    <StatusBadge suspended={suspended.products.has(o.id)} />
                    <div className="flex gap-1 shrink-0">
                      {suspended.products.has(o.id)
                        ? <button onClick={() => confirm('Activar producto?', () => onRestore('product', o.id))} className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 flex items-center justify-center"><RotateCcw className="w-3 h-3" /></button>
                        : <button onClick={() => confirm('Suspender producto?', () => onSuspend('product', o.id))} className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-500/15 text-amber-600 flex items-center justify-center"><EyeOff className="w-3 h-3" /></button>
                      }
                      <button onClick={() => confirm('Eliminar producto?', () => onDelete('product', o.id))} className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-500/15 text-rose-600 flex items-center justify-center"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                );
              })}
            </div>;

        // sub-vista: reportes recibidos
        const renderReportesView = () => uReportes.length === 0
          ? <div className="flex flex-col items-center py-12 gap-2 text-slate-400"><Flag className="w-10 h-10 opacity-30" /><p className="text-sm font-semibold">Sin reportes recibidos</p></div>
          : <div className="space-y-3">
              {uReportes.map(r => (
                <div key={r.id} className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl p-4`}>
                  <div className="flex items-start gap-2 mb-1">
                    <Flag className={`w-3.5 h-3.5 mt-0.5 ${r.estado === 'pendiente' ? 'text-rose-500' : 'text-slate-400'} shrink-0`} />
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex-1">{r.motivo}</p>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${r.estado === 'pendiente' ? 'bg-rose-100 dark:bg-rose-500/15 text-rose-600' : 'bg-slate-100 dark:bg-white/8 text-slate-400'}`}>{r.estado}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-5 leading-relaxed">{r.desc} · {r.fecha}</p>
                  {r.estado === 'pendiente' && (
                    <button onClick={() => markReportReviewed(r.id)} className="mt-2 ml-5 h-6 px-2.5 rounded-lg bg-slate-100 dark:bg-white/8 text-slate-500 text-[10px] font-bold">Marcar revisado</button>
                  )}
                </div>
              ))}
            </div>;

        // sub-vista: historial de pagos
        const renderSuscripcionView = () => !u.suscripcion
          ? <div className="flex flex-col items-center py-12 gap-2 text-slate-400"><CreditCard className="w-10 h-10 opacity-30" /><p className="text-sm font-semibold">Sin suscripción</p></div>
          : (
            <div className="space-y-4">
              <div className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl p-4`}>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Plan actual</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900 dark:text-white">{u.suscripcion.plan}</p>
                    <p className="text-xs text-slate-400 capitalize">{u.suscripcion.estado} · desde {u.suscripcion.desde}</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Movimientos</p>
              <div className="space-y-2">
                {paymentHistory.map(p => (
                  <div key={p.id} className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl px-4 py-3 flex items-center gap-3`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${p.estado === 'aprobado' ? 'bg-emerald-100 dark:bg-emerald-500/15' : 'bg-rose-100 dark:bg-rose-500/15'}`}>
                      {p.estado === 'aprobado'
                        ? <CheckCircle className="w-4 h-4 text-emerald-500" />
                        : <XCircle className="w-4 h-4 text-rose-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{p.plan}</p>
                      <p className="text-[10px] text-slate-400">{p.metodo} · {p.fecha}</p>
                    </div>
                    <p className={`text-sm font-black shrink-0 ${p.estado === 'aprobado' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                      ${p.monto.toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          );

        // sub-vista: chat admin
        const renderChatView = () => {
          const ATTACH_OPTIONS = [
            { id: 'reporte',    label: 'Reportes',    Icon: Flag,       desc: `${uReportes.length} reportes` },
            { id: 'actividad',  label: 'Historial',   Icon: Activity,   desc: `${u.activityLog.length} eventos` },
            { id: 'suscripcion',label: 'Suscripción', Icon: CreditCard, desc: u.suscripcion ? u.suscripcion.plan : 'Sin plan' },
            { id: 'tienda',     label: 'Tienda',      Icon: Store,      desc: uTienda?.nombre || 'Sin tienda' },
            { id: 'producto',   label: 'Productos',   Icon: Package,    desc: `${uProductos.length} productos` },
          ];
          return (
            <div className="space-y-4">
              <div className={`${isDark ? 'bg-amber-500/8' : 'bg-amber-50'} rounded-2xl px-4 py-3 flex items-start gap-2`}>
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                  Mensaje oficial como administrador de LOKAL. El usuario verá que proviene del equipo admin.
                </p>
              </div>
              <textarea
                value={chatDraft}
                onChange={e => setChatDraft(e.target.value)}
                placeholder={`Escribí tu mensaje para ${u.nombre}...`}
                rows={4}
                className={`w-full rounded-2xl px-4 py-3 text-sm border ${bdr} ${card} text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary resize-none`}
              />
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Adjuntos contextuales</p>
                <div className="grid grid-cols-2 gap-2">
                  {ATTACH_OPTIONS.map(opt => {
                    const isOn = chatAttachments.includes(opt.id);
                    return (
                      <button key={opt.id}
                        onClick={() => setChatAttachments(prev => isOn ? prev.filter(a => a !== opt.id) : [...prev, opt.id])}
                        className={`rounded-2xl p-3 text-left flex items-start gap-2 border transition-colors ${
                          isOn
                            ? 'border-primary bg-primary/8 dark:bg-primary/15'
                            : `border-transparent ${isDark ? 'bg-white/4' : 'bg-slate-50'}`
                        }`}>
                        <opt.Icon className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isOn ? 'text-primary' : 'text-slate-400'}`} />
                        <div>
                          <p className={`text-[10px] font-bold leading-tight ${isOn ? 'text-primary' : 'text-slate-700 dark:text-slate-200'}`}>{opt.label}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5">{opt.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
              {chatAttachments.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {chatAttachments.map(a => {
                    const opt = ATTACH_OPTIONS.find(o => o.id === a);
                    return (
                      <span key={a} className="flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full bg-primary/10 text-primary">
                        <opt.Icon className="w-3 h-3" />{opt.label}
                        <button onClick={() => setChatAttachments(prev => prev.filter(x => x !== a))} className="ml-0.5 hover:text-rose-500 transition-colors">×</button>
                      </span>
                    );
                  })}
                </div>
              )}
              <button
                disabled={!chatDraft.trim()}
                onClick={() => {
                  if (!chatDraft.trim()) return;
                  const existing = supportChats.find(c => c.autorUid === u.uid);
                  const newMsg = { de: 'admin', texto: chatDraft.trim(), fecha: 'ahora', adjuntos: chatAttachments.length ? [...chatAttachments] : undefined };
                  if (existing) {
                    const updated = { ...existing, estado: 'abierto', mensajes: [...existing.mensajes, newMsg] };
                    setSupportChats(prev => prev.map(c => c.id === existing.id ? updated : c));
                    closeUserPanel();
                    setActiveTab('soporte');
                    setSelectedChat(updated);
                  } else {
                    const newChat = {
                      id: `s${Date.now()}`, autorNombre: u.nombre, autorUid: u.uid,
                      autorRol: u.tieneTienda ? 'tienda' : 'usuario',
                      asunto: 'Mensaje del admin', estado: 'abierto', fecha: 'ahora',
                      mensajes: [newMsg],
                    };
                    setSupportChats(prev => [newChat, ...prev]);
                    closeUserPanel();
                    setActiveTab('soporte');
                    setSelectedChat(newChat);
                  }
                  setChatDraft(''); setChatAttachments([]);
                }}
                className="w-full h-11 rounded-2xl bg-primary text-white text-sm font-bold disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity">
                <Mail className="w-4 h-4" />Enviar mensaje a {u.nombre}
              </button>
            </div>
          );
        };

        const isSubView = userPanelView !== 'main';

        return (
          <div className={`fixed z-[4800] flex items-end justify-center inset-0 lg:items-center lg:justify-end ${userPanelFromChat && activeTab === 'soporte' ? 'lg:hidden' : ''}`}
            onClick={closeUserPanel}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            {/* Panel */}
            <div
              className={`relative ${card} w-full max-w-md lg:h-full lg:max-h-none rounded-t-3xl lg:rounded-none lg:rounded-l-3xl shadow-2xl flex flex-col overflow-hidden`}
              style={{ maxHeight: '92vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className={`flex items-center gap-3 px-5 py-4 border-b ${bdr} shrink-0`}>
                {isSubView
                  ? <button onClick={() => setUserPanelView('main')}
                      className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white shrink-0">
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  : <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center shrink-0">
                      <span className="text-base font-black text-primary">{u.nombre[0]}</span>
                    </div>
                }
                <div className="flex-1 min-w-0">
                  {isSubView
                    ? <>
                        <p className="text-sm font-black text-slate-900 dark:text-white">{viewTitles[userPanelView]}</p>
                        <p className="text-xs text-slate-400">{u.nombre}</p>
                      </>
                    : <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-black text-slate-900 dark:text-white">{u.nombre}</p>
                          {u.rol === 'admin' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-500/15 text-rose-600 flex items-center gap-1">
                              <ShieldAlert className="w-2.5 h-2.5" />Admin
                            </span>
                          )}
                          <StatusBadge suspended={u.suspendido} />
                        </div>
                        <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      </>
                  }
                </div>
                {!isSubView && !userPanelFromChat && (
                  <button onClick={() => setUserPanelView('chat')} title="Enviar mensaje"
                    className="w-8 h-8 rounded-xl bg-sky-100 dark:bg-sky-500/15 flex items-center justify-center text-sky-600 hover:opacity-80 shrink-0">
                    <Mail className="w-4 h-4" />
                  </button>
                )}
                <button onClick={closeUserPanel}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">

                {/* ── SUB-VISTAS ── */}
                {userPanelView === 'tienda'      && renderTiendaView()}
                {userPanelView === 'demandas'    && renderDemandasView()}
                {userPanelView === 'productos'   && renderProductosView()}
                {userPanelView === 'reportes'    && renderReportesView()}
                {userPanelView === 'suscripcion' && renderSuscripcionView()}
                {userPanelView === 'chat'        && renderChatView()}

                {/* ── VISTA PRINCIPAL ── */}
                {userPanelView === 'main' && (<>

                  {/* Stats clickeables */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Demandas',   value: u.demandasPublicadas,         Icon: MessageSquare, color: 'text-violet-500 bg-violet-100 dark:bg-violet-500/15', view: 'demandas',    clickable: u.demandasPublicadas > 0 },
                      { label: 'Productos',  value: u.productosPublicados ?? 0,   Icon: Package,       color: 'text-blue-500 bg-blue-100 dark:bg-blue-500/15',       view: 'productos',   clickable: (u.productosPublicados ?? 0) > 0 },
                      { label: 'Reportes',   value: u.reportesRecibidos,           Icon: Flag,          color: u.reportesRecibidos > 0 ? 'text-rose-500 bg-rose-100 dark:bg-rose-500/15' : 'text-slate-400 bg-slate-100 dark:bg-white/8', view: 'reportes', clickable: u.reportesRecibidos > 0 },
                      { label: 'Tienda',     value: u.tieneTienda ? 'Ver' : '—',  Icon: Store,         color: u.tieneTienda ? 'text-emerald-500 bg-emerald-100 dark:bg-emerald-500/15' : 'text-slate-400 bg-slate-100 dark:bg-white/8', view: 'tienda', clickable: u.tieneTienda },
                    ].map((s, i) => (
                      <button key={i} disabled={!s.clickable}
                        onClick={() => s.clickable && setUserPanelView(s.view)}
                        className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl p-3 flex items-center gap-3 text-left ${s.clickable ? 'hover:bg-slate-100 dark:hover:bg-white/8 cursor-pointer' : 'cursor-default'} transition-colors`}>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                          <s.Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-base font-black text-slate-900 dark:text-white">{s.value}</p>
                          <p className="text-[10px] text-slate-400">{s.label}</p>
                        </div>
                        {s.clickable && <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />}
                      </button>
                    ))}
                  </div>

                  {/* Bio */}
                  {u.bio && (
                    <div className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl px-4 py-3`}>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Bio</p>
                      <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">{u.bio}</p>
                    </div>
                  )}

                  {/* Perfil */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Perfil</p>
                    <div className={`${isDark ? 'bg-white/4' : 'bg-slate-50'} rounded-2xl divide-y ${bdr}`}>
                      {[
                        { label: 'Rol',              value: u.rol,             Icon: ShieldCheck },
                        { label: 'Ciudad',           value: u.ciudad || '—',   Icon: MapPin },
                        { label: 'Alta',             value: u.fechaAlta,       Icon: CalendarDays },
                        { label: 'Última actividad', value: u.ultimaActividad, Icon: Clock },
                      ].map((row, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3">
                          <row.Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">{row.label}</p>
                          <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">{row.value}</p>
                        </div>
                      ))}
                      {/* Suscripción — clickeable */}
                      <button onClick={() => u.suscripcion && setUserPanelView('suscripcion')}
                        disabled={!u.suscripcion}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left ${u.suscripcion ? 'hover:bg-slate-50 dark:hover:bg-white/4' : ''} transition-colors`}>
                        <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex-1">Suscripción</p>
                        <p className="text-xs font-semibold text-slate-900 dark:text-white capitalize">
                          {u.suscripcion ? `${u.suscripcion.plan} · ${u.suscripcion.estado}` : 'Sin plan'}
                        </p>
                        {u.suscripcion && <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />}
                      </button>
                    </div>
                  </div>

                  {/* Log de actividad */}
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Historial de actividad</p>
                    <div className="space-y-2">
                      {u.activityLog.map((entry, i) => {
                        const li = logIcons[entry.tipo] || logIcons.admin;
                        return (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${li.bg}`}>
                              <li.Icon className={`w-3.5 h-3.5 ${li.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs text-slate-700 dark:text-slate-200 leading-snug">{entry.desc}</p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{entry.fecha}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Nota de privacidad */}
                  <div className={`flex items-start gap-2 p-3 rounded-xl ${isDark ? 'bg-white/4' : 'bg-slate-50'}`}>
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                      El contenido de mensajes privados no es accesible por el admin. Solo se muestran metadatos de actividad.
                    </p>
                  </div>

                </>)}
              </div>

              {/* Footer de acciones — solo en vista principal */}
              {userPanelView === 'main' && u.rol !== 'admin' && (
                <div className={`px-5 py-4 border-t ${bdr} shrink-0 flex gap-2`}>
                  {u.suspendido
                    ? <button onClick={() => { confirm(`Reactivar a "${u.nombre}"?`, () => { restoreUser(u.uid); setSelectedUser(s => s ? { ...s, suspendido: false } : s); }); }}
                        className="flex-1 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" />Activar cuenta
                      </button>
                    : <button onClick={() => { confirm(`Suspender a "${u.nombre}"?`, () => { suspendUser(u.uid); setSelectedUser(s => s ? { ...s, suspendido: true } : s); }); }}
                        className="flex-1 h-10 rounded-2xl bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 text-xs font-bold flex items-center justify-center gap-1.5">
                        <UserMinus className="w-3.5 h-3.5" />Suspender
                      </button>
                  }
                  <button onClick={() => { confirm(`Eliminar cuenta de "${u.nombre}"? Esta acción no se puede deshacer.`, () => { deleteUser(u.uid); closeUserPanel(); }); }}
                    className="flex-1 h-10 rounded-2xl bg-rose-100 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5">
                    <UserX className="w-3.5 h-3.5" />Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ── Attach detail modal ── */}
      {attachModal && (() => {
        const u = users.find(u => u.uid === attachModal.uid);
        const uTienda = u && tiendas.find(t => t.nombre && u.tieneTienda);
        const uReportes = reports.filter(r => r.autorUid === attachModal.uid || (uTienda && String(r.refId) === String(uTienda?.id)));
        const meta = ATTACH_META_MAP[attachModal.type];
        const uProductos = uTienda ? ofertas.filter(o => o.tiendaId === uTienda.id || o.tiendaNombre === uTienda.nombre) : [];

        const renderContent = () => {
          if (attachModal.type === 'reporte') {
            if (!uReportes.length) return <p className="text-sm text-slate-400 py-6 text-center">Sin reportes registrados</p>;
            return (
              <div className="space-y-2">
                {uReportes.map(r => (
                  <div key={r.id} className={`rounded-2xl p-3 border ${bdr} ${card}`}>
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">{r.motivo}</p>
                      <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${r.estado === 'pendiente' ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-600' : 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600'}`}>{r.estado}</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">{r.desc}</p>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                      <span>{r.tipo} · {r.refNombre}</span>
                      <span>·</span><span>{r.fecha}</span>
                    </div>
                    {r.adminRespuesta && (
                      <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/8 flex gap-2">
                        <Reply className="w-3 h-3 text-primary mt-0.5 shrink-0" />
                        <p className="text-xs text-slate-500 dark:text-slate-400 italic">{r.adminRespuesta}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            );
          }
          if (attachModal.type === 'actividad') {
            const log = u?.activityLog || [];
            if (!log.length) return <p className="text-sm text-slate-400 py-6 text-center">Sin actividad registrada</p>;
            const logIcons = {
              registro: { Icon: UserCheck,     color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15' },
              tienda:   { Icon: Store,         color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-500/15' },
              producto: { Icon: Package,       color: 'text-blue-500',    bg: 'bg-blue-100 dark:bg-blue-500/15' },
              demanda:  { Icon: MessageSquare, color: 'text-violet-500',  bg: 'bg-violet-100 dark:bg-violet-500/15' },
              reporte:  { Icon: Flag,          color: 'text-rose-500',    bg: 'bg-rose-100 dark:bg-rose-500/15' },
              admin:    { Icon: ShieldAlert,   color: 'text-amber-500',   bg: 'bg-amber-100 dark:bg-amber-500/15' },
            };
            return (
              <div className="space-y-1">
                {log.map((e, i) => {
                  const li = logIcons[e.tipo] || logIcons.admin;
                  return (
                    <div key={i} className="flex items-start gap-3 py-2">
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${li.bg}`}>
                        <li.Icon className={`w-3.5 h-3.5 ${li.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 dark:text-white">{e.desc}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{e.fecha}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          }
          if (attachModal.type === 'suscripcion') {
            const s = u?.suscripcion;
            if (!s) return <p className="text-sm text-slate-400 py-6 text-center">Sin suscripción activa</p>;
            return (
              <div className={`rounded-2xl border ${bdr} overflow-hidden`}>
                <div className="px-4 py-4 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">{s.plan}</p>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${s.estado === 'activa' ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600' : 'bg-amber-100 dark:bg-amber-500/15 text-amber-600'}`}>{s.estado}</span>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Activa desde</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{s.desde}</span>
                  </div>
                  {s.vence && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Vence</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{s.vence}</span>
                    </div>
                  )}
                  {s.monto && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Monto</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{s.monto}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          }
          if (attachModal.type === 'tienda') {
            if (!u?.tieneTienda || !uTienda) return <p className="text-sm text-slate-400 py-6 text-center">Sin tienda registrada</p>;
            return (
              <div className={`rounded-2xl border ${bdr} overflow-hidden`}>
                <div className="px-4 py-4 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center">
                    <Store className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-black text-slate-900 dark:text-white">{uTienda.nombre}</p>
                    <p className="text-xs text-slate-400">{uTienda.categoria}</p>
                  </div>
                </div>
                <div className="px-4 py-3 space-y-2">
                  {uTienda.direccion && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Dirección</span>
                      <span className="font-semibold text-slate-900 dark:text-white text-right max-w-[55%]">{uTienda.direccion}</span>
                    </div>
                  )}
                  {uTienda.telefono && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Teléfono</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{uTienda.telefono}</span>
                    </div>
                  )}
                  {uTienda.horario && (
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-400">Horario</span>
                      <span className="font-semibold text-slate-900 dark:text-white">{uTienda.horario}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Estado</span>
                    <span className={`font-black text-xs px-2 py-0.5 rounded-full ${uTienda.activa !== false ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600' : 'bg-slate-100 dark:bg-white/8 text-slate-400'}`}>
                      {uTienda.activa !== false ? 'Activa' : 'Inactiva'}
                    </span>
                  </div>
                </div>
              </div>
            );
          }
          if (attachModal.type === 'producto') {
            if (!uProductos.length) return <p className="text-sm text-slate-400 py-6 text-center">Sin productos publicados</p>;
            return (
              <div className="space-y-2">
                {uProductos.map(p => (
                  <div key={p.id} className={`rounded-2xl p-3 border ${bdr} ${card} flex items-center gap-3`}>
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-500/15 flex items-center justify-center shrink-0">
                      <Package className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.nombre}</p>
                      <p className="text-xs text-slate-400">{p.categoria} · ${p.precio?.toLocaleString?.() ?? p.precio}</p>
                    </div>
                    <span className={`shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full ${p.activo !== false ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600' : 'bg-slate-100 dark:bg-white/8 text-slate-400'}`}>
                      {p.activo !== false ? 'activo' : 'inactivo'}
                    </span>
                  </div>
                ))}
              </div>
            );
          }
          return null;
        };

        return (
          <div className="fixed inset-0 z-[5100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
            onClick={() => setAttachModal(null)}>
            <div className={`w-full max-w-sm ${card} rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden`}
              style={{ maxHeight: '80vh' }}
              onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className={`flex items-center gap-3 px-4 py-4 border-b ${bdr} shrink-0`}>
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${meta.bg}`}>
                  <meta.Icon className={`w-4.5 h-4.5 ${meta.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 dark:text-white">{meta.label}</p>
                  {u && <p className="text-xs text-slate-400 truncate">{u.nombre}</p>}
                </div>
                <button onClick={() => setAttachModal(null)}
                  className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {/* Content */}
              <div className="overflow-y-auto px-4 py-4 flex-1">
                {renderContent()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Confirm modal ── */}
      {confirmAction && (
        <div className="fixed inset-0 z-[5000] bg-black/60 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setConfirmAction(null)}>
          <div className={`w-full max-w-sm rounded-3xl p-6 ${card} shadow-2xl`} onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-rose-500" />
            </div>
            <p className="text-center font-black text-slate-900 dark:text-white mb-2">¿Confirmar acción?</p>
            <p className="text-center text-sm text-slate-500 dark:text-slate-400 mb-6">{confirmAction.label}</p>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => setConfirmAction(null)} className="h-11 rounded-2xl bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-200 font-bold text-sm">Cancelar</button>
              <button onClick={() => { confirmAction.onConfirm(); setConfirmAction(null); }} className="h-11 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-sm transition-colors">Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
