import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, MapPin, Search, Store, Package, MessageSquare, Bell, User,
  ChevronRight, Clock, Navigation, X, AlertCircle, ArrowLeft, Send,
  Tag, Loader2, CheckCircle, Pause, Edit3, Trash2, RotateCcw,
  Star, ChevronDown, Filter, History, TrendingUp, Sun, Moon, LogOut
} from 'lucide-react';

const API_BASE = '/.netlify/functions';

const KtrlLogo = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 1629.2 404.35" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M838.15,41.28v74.06c0,20.45-16.58,37.03-37.03,37.03h-55.55c-10.23,0-18.52,8.29-18.52,18.52v191.9c0,20.6-16.7,37.3-37.3,37.3h-73.53c-20.6,0-37.3-16.7-37.3-37.3v-191.86c0-10.24-8.31-18.54-18.56-18.52l-55.43.15c-20.48.04-37.11-16.55-37.11-37.03V41.28c0-20.45,16.58-37.03,37.03-37.03h296.26c20.45,0,37.03,16.58,37.03,37.03Z"/>
    <path d="M1629.2,289.56v74.06c0,20.45-16.58,37.03-37.03,37.03h-222.19c-20.45,0-37.03-16.58-37.03-37.03V41.84c0-20.45,16.58-37.03,37.03-37.03h74.06c20.45,0,37.03,16.58,37.03,37.03v192.17c0,10.23,8.29,18.52,18.52,18.52h92.58c20.45,0,37.03,16.58,37.03,37.03Z"/>
    <path d="M1098.1,152.38h-56.26c-10.23,0-18.52,8.29-18.52,18.52v191.97c0,20.45-16.58,37.03-37.03,37.03h-74.08c-20.45,0-37.03-16.58-37.03-37.03V78.31c0-40.9,33.16-74.06,74.06-74.06h247.71c40.9,0,74.06,33.16,74.06,74.06v100.72c0,9.82-3.9,19.24-10.85,26.19l-52.61,52.6c-6.78,6.72-8.03,18.46-.12,26.36l52.77,52.75c23.34,23.34,6.8,63.25-26.21,63.22l-95.66-.07c-9.82,0-19.24-3.9-26.19-10.85l-40.95-40.95c-6.94-6.94-10.85-16.36-10.85-26.19v-71.94c0-9.82,3.9-19.24,10.85-26.19l39.99-39.99c11.66-11.66,3.4-31.61-13.09-31.61Z"/>
    <path d="M83.04,14.06L10.79,86.32C3.88,93.22,0,102.59,0,112.36v179.62c0,9.77,3.88,19.14,10.79,26.05l72.26,72.26c23.21,23.21,62.88,6.77,62.88-26.05V40.11c0-32.82-39.68-49.25-62.88-26.05Z"/>
    <path d="M416.11,340.58l-52.97,52.97c-14.39,14.39-37.71,14.39-52.09,0l-117.4-117.4c-6.97-6.97-10.88-16.41-10.88-26.27v-95.43c0-9.85,3.91-19.3,10.88-26.27L311.04,10.79c14.39-14.39,37.71-14.39,52.09,0l52.97,52.97c14.39,14.39,14.39,37.71,0,52.09l-73.29,73.29c-7.19,7.19-7.19,18.85,0,26.05l73.29,73.29c14.39,14.39,14.39,37.71,0,52.09Z"/>
  </svg>
);

const TIENDA_REPLIES = [
  'Si, tenemos stock. Pasa cuando quieras.',
  'Te lo separamos hasta manana si nos avisas.',
  'El precio incluye garantia de 6 meses.',
  'Tambien hacemos envio a domicilio.',
  'Que horario te queda mejor para venir?',
  'Tenemos varios modelos, cual preferis?',
];

const RUBROS = ['Electronica', 'Computacion', 'Fotografia', 'Ferreteria', 'Construccion', 'Hogar', 'Ropa', 'Deportes'];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function tiempoRelativo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Hace un momento';
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h}h`;
  return `Hace ${Math.floor(h / 24)}d`;
}

// ─── Custom Select ────────────────────────────────────────────────────────────
const CustomSelect = ({ value, onChange, options, size = 'md' }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isSmall = size === 'sm';

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selected = options.find(o => o.value === value);

  // Always border-2 (transparent when closed) to avoid layout shift on open
  // transition-colors only — border-radius must change instantly, not animate
  const btnCls = [
    'flex items-center gap-2 font-semibold bg-slate-100 dark:bg-white/5',
    'border-2 transition-colors focus:outline-none',
    isSmall ? 'text-xs py-1.5 px-3' : 'text-sm py-2.5 px-4',
    open
      ? (isSmall
          ? 'rounded-t-xl rounded-b-none border-slate-200 dark:border-white/10 border-b-transparent'
          : 'rounded-t-2xl rounded-b-none border-slate-200 dark:border-white/10 border-b-transparent')
      : (isSmall
          ? 'rounded-xl border-transparent'
          : 'rounded-2xl border-transparent'),
  ].join(' ');

  return (
    <div ref={ref} className="relative inline-block">
      <button type="button" onClick={() => setOpen(o => !o)} className={btnCls}>
        {/* Ghost span sets stable width using longest option — never shifts layout */}
        <span className="relative">
          <span className="invisible select-none" aria-hidden>
            {options.reduce((a, b) => a.label.length >= b.label.length ? a : b).label}
          </span>
          <span className="absolute inset-0 flex items-center transition-opacity duration-150">
            {selected?.label}
          </span>
        </span>
        <ChevronDown className={[
          'shrink-0 text-slate-400 dark:text-slate-500 transition-transform duration-200',
          isSmall ? 'w-3 h-3' : 'w-4 h-4',
          open ? 'rotate-180' : '',
        ].join(' ')} />
      </button>
      {open && (
        <div className={[
          'absolute right-0 top-full z-50 min-w-full',
          'bg-white dark:bg-slate-900',
          'border-2 border-t-0 border-slate-200 dark:border-white/10 shadow-2xl animate-dropdown-in',
          isSmall ? 'rounded-b-xl' : 'rounded-b-2xl',
          'p-1.5 space-y-1.5',
        ].join(' ')}>
          {options.map(o => (
            <button key={o.value} type="button"
              onClick={() => { onChange(o.value); setOpen(false); }}
              className={[
                'w-full text-left px-3 font-semibold transition-colors rounded-xl',
                isSmall ? 'py-2 text-xs' : 'py-2.5 text-sm',
                o.value === value
                  ? 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 dark:text-emerald-400'
                  : 'hover:bg-slate-100 dark:hover:bg-white/10',
              ].join(' ')}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── App principal ────────────────────────────────────────────────────────────
const UserApp = ({ firebaseUser, onLogout, isDark, toggleTheme }) => {
  // Navegacion
  const [currentScreen, setCurrentScreen] = useState('home');
  const [selectedDemanda, setSelectedDemanda] = useState(null);
  const [selectedTienda, setSelectedTienda] = useState(null);
  const [activeTab, setActiveTab] = useState('demandas');

  // Modales
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showChat, setShowChat] = useState(null);
  const [showConfirm, setShowConfirm] = useState(null); // { title, msg, onOk }
  const profileDropdownRef = useRef(null);

  // Crear/Editar demanda
  const [editingDemanda, setEditingDemanda] = useState(null);
  const [selectedRubros, setSelectedRubros] = useState([]);
  const [filterWarning, setFilterWarning] = useState(false);

  // Home
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recientes');

  // Chat
  const [chatHistories, setChatHistories] = useState({});
  const [chatMessage, setChatMessage] = useState('');
  const chatEndRef = useRef(null);

  // Notificaciones (stateful)
  const [notifList, setNotifList] = useState([
    { id: 1, tipo: 'respuesta', mensaje: 'TecnoStore respondio tu demanda de Cable USB-C', tiempo: new Date(Date.now() - 5 * 60000).toISOString(), leido: false, demandaId: null },
    { id: 2, tipo: 'oferta', mensaje: 'Nueva oferta cerca: Mouse Gaming en TecnoStore', tiempo: new Date(Date.now() - 60 * 60000).toISOString(), leido: false, demandaId: null },
    { id: 3, tipo: 'sistema', mensaje: 'Tu demanda fue vista por 8 tiendas', tiempo: new Date(Date.now() - 2 * 3600000).toISOString(), leido: true, demandaId: null },
  ]);

  // Demandas
  const [allDemandas, setAllDemandas] = useState([]);
  const [loadingDemandas, setLoadingDemandas] = useState(true);
  const [errorDemandas, setErrorDemandas] = useState(null);

  useEffect(() => { fetchDemandas(); }, []);

  useEffect(() => {
    if (showChat) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, showChat]);

  // ─── API ──────────────────────────────────────────────────────────────────
  const fetchDemandas = async () => {
    setLoadingDemandas(true);
    setErrorDemandas(null);
    try {
      const res = await fetch(`${API_BASE}/demandas`);
      if (!res.ok) throw new Error('Error al cargar');
      setAllDemandas(await res.json());
    } catch (err) {
      setErrorDemandas(err.message);
    } finally {
      setLoadingDemandas(false);
    }
  };

  const updateDemandaEstado = async (id, estado) => {
    // Optimista
    setAllDemandas(prev => prev.map(d => d.id === id ? { ...d, estado } : d));
    if (selectedDemanda?.id === id) setSelectedDemanda(d => ({ ...d, estado }));
    try {
      await fetch(`${API_BASE}/demandas`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado }),
      });
    } catch { /* silencioso: ya actualizado localmente */ }
  };

  const deleteDemanda = async (id) => {
    setAllDemandas(prev => prev.filter(d => d.id !== id));
    setCurrentScreen('home');
    try {
      await fetch(`${API_BASE}/demandas?id=${id}`, { method: 'DELETE' });
    } catch { /* silencioso */ }
  };

  // ─── Chat ─────────────────────────────────────────────────────────────────
  const openChat = (tienda) => {
    const key = `${tienda.tienda}-${tienda.id}`;
    if (!chatHistories[key]) {
      setChatHistories(prev => ({
        ...prev,
        [key]: [{ id: 1, from: 'tienda', text: tienda.mensaje || `Hola! Puedo ayudarte con lo que buscas.`, time: tienda.tiempoRespuesta || 'Ahora' }],
      }));
    }
    setShowChat({ ...tienda, chatKey: key });
  };

  const sendChatMessage = () => {
    if (!chatMessage.trim() || !showChat) return;
    const key = showChat.chatKey;
    const msg = { id: Date.now(), from: 'user', text: chatMessage.trim(), time: 'Ahora' };
    setChatHistories(prev => ({ ...prev, [key]: [...(prev[key] || []), msg] }));
    setChatMessage('');
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        from: 'tienda',
        text: TIENDA_REPLIES[Math.floor(Math.random() * TIENDA_REPLIES.length)],
        time: 'Ahora',
      };
      setChatHistories(prev => ({ ...prev, [key]: [...(prev[key] || []), reply] }));
    }, 1200);
  };

  // ─── Notificaciones ───────────────────────────────────────────────────────
  const markNotifRead = (id) => setNotifList(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
  const markAllRead = () => setNotifList(prev => prev.map(n => ({ ...n, leido: true })));

  const addNotif = (mensaje, tipo = 'sistema', demandaId = null) => {
    setNotifList(prev => [{
      id: Date.now(), tipo, mensaje, tiempo: new Date().toISOString(), leido: false, demandaId,
    }, ...prev]);
  };

  // ─── Datos mock ───────────────────────────────────────────────────────────
  const tiendas = [
    { id: 1, nombre: 'TecnoStore', rubro: 'Electronica y Computacion', distancia: '0.8 km', rating: 4.7, foto: '📱', horario: 'Abierto hasta 20:00', abierto: true, telefono: '3456001234' },
    { id: 2, nombre: 'Electro Total', rubro: 'Electronica', distancia: '1.2 km', rating: 4.5, foto: '⚡', horario: 'Cierra a las 19:00', abierto: true, telefono: '3456005678' },
    { id: 3, nombre: 'Ferreteria Central', rubro: 'Ferreteria y Construccion', distancia: '0.5 km', rating: 4.8, foto: '🔧', horario: 'Abierto ahora', abierto: true, telefono: '3456009012' },
    { id: 4, nombre: 'CompuMundo', rubro: 'Computacion', distancia: '2.5 km', rating: 4.6, foto: '💻', horario: 'Abierto hasta 21:00', abierto: true, telefono: '3456003456' },
  ];

  const ofertas = [
    { id: 1, tienda: 'TecnoStore', tiendaId: 1, titulo: 'Mouse Logitech G203', descripcion: 'Gaming RGB, 8000 DPI', precio: 15900, foto: '🖱️', distancia: '0.8 km' },
    { id: 2, tienda: 'Ferreteria Central', tiendaId: 3, titulo: 'Taladro percutor 13mm', descripcion: 'Incluye 10 mechas y maletin', precio: null, foto: '🔨', distancia: '0.5 km' },
    { id: 3, tienda: 'CompuMundo', tiendaId: 4, titulo: 'Teclado mecanico', descripcion: 'Switches blue, retroiluminado RGB', precio: 28500, foto: '⌨️', distancia: '2.5 km' },
    { id: 4, tienda: 'TecnoStore', tiendaId: 1, titulo: 'Hub USB-C 7 en 1', descripcion: 'HDMI 4K, USB 3.0, SD, carga rapida', precio: 12400, foto: '🔌', distancia: '0.8 km' },
  ];

  const getMockRespuestas = (demanda) => [
    { id: 101, tienda: 'TecnoStore', distancia: '0.8 km', mensaje: `Tenemos exactamente lo que buscas! Calidad garantizada.`, precio: 8500, foto: '📱', tiempoRespuesta: 'Hace 1 hora', horario: 'Abierto hasta 20:00', rating: 4.7 },
    { id: 102, tienda: 'Electro Total', distancia: '1.2 km', mensaje: 'Tenemos varias opciones disponibles. Veni a verlas.', precio: 7200, foto: '⚡', tiempoRespuesta: 'Hace 2 horas', horario: 'Cierra a las 19:00', rating: 4.5 },
  ];

  // ─── Filtros y sort ───────────────────────────────────────────────────────
  const demandasActivas = allDemandas.filter(d => d.estado === 'activa');
  const demandasHistorial = allDemandas.filter(d => d.estado !== 'activa');

  const sortedDemandas = [...demandasActivas]
    .filter(d =>
      d.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (d.descripcion || '').toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => sortBy === 'respuestas' ? (b.respuestas - a.respuestas) : (new Date(b.createdAt) - new Date(a.createdAt)));

  const filteredOfertas = ofertas.filter(o =>
    o.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.descripcion.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unreadCount = notifList.filter(n => !n.leido).length;

  // ─── Confirm Modal ────────────────────────────────────────────────────────
  const ConfirmModal = ({ title, msg, onOk, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{msg}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="py-3 bg-slate-100 rounded-2xl font-semibold">Cancelar</button>
          <button onClick={onOk} className="py-3 bg-slate-900 dark:bg-emerald-500 text-white rounded-2xl font-semibold">Confirmar</button>
        </div>
      </div>
    </div>
  );

  // ─── Sidebar Desktop ──────────────────────────────────────────────────────
  const DesktopSidebar = () => (
    <div className="hidden lg:flex lg:flex-col w-72 bg-white dark:bg-slate-900 border-r-2 border-slate-200 dark:border-white/10 h-screen sticky top-0 shrink-0">
      <div className="p-6 border-b-2 border-slate-200 dark:border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-md">
              <Store className="w-7 h-7 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-400 rounded-full border-2 border-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Lokal</h1>
            <a href="https://www.instagram.com/katriel.martinez" target="_blank" rel="noopener"
              className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
              <span className="text-[9px]">by</span>
              <KtrlLogo className="h-2 opacity-60 hover:opacity-90 transition-opacity" />
            </a>
          </div>
        </div>
        <button
          onClick={() => { setEditingDemanda(null); setSelectedRubros([]); setCurrentScreen('crear'); }}
          className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl p-4 shadow-md hover:shadow-lg transition-all"
        >
          <div className="flex items-center justify-center gap-3">
            <Camera className="w-5 h-5" />
            <span className="font-bold">Nueva Demanda</span>
          </div>
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {[
          { label: 'Mis Demandas', icon: Package, screen: 'home', tab: 'demandas' },
          { label: 'Ofertas', icon: Tag, screen: 'home', tab: 'ofertas' },
          { label: 'Tiendas', icon: Store, screen: 'tiendas' },
          { label: 'Historial', icon: History, screen: 'historial' },
        ].map(({ label, icon: Icon, screen, tab }) => {
          const active = currentScreen === screen && (!tab || activeTab === tab);
          return (
            <button key={label} onClick={() => { setCurrentScreen(screen); if (tab) setActiveTab(tab); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active ? 'bg-slate-900 dark:bg-emerald-500/15 text-white dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
              <Icon className="w-5 h-5" />
              <span className="font-semibold">{label}</span>
              {label === 'Historial' && demandasHistorial.length > 0 && (
                <span className={`ml-auto text-xs font-bold px-2 py-0.5 rounded-full ${active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>{demandasHistorial.length}</span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t-2 border-slate-200 dark:border-white/10">
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-all">
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
          <span className="font-semibold">{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>
      </div>
    </div>
  );

  // ─── Notifications Modal ──────────────────────────────────────────────────
  const NotificationsModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="p-5 border-b border-slate-200 dark:border-white/10 flex justify-between items-center">
          <div>
            <h2 className="font-bold text-lg">Notificaciones</h2>
            {unreadCount > 0 && <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} sin leer</p>}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-emerald-600 font-semibold px-3 py-1.5 hover:bg-emerald-50 rounded-xl">
                Marcar todas
              </button>
            )}
            <button onClick={() => setShowNotifications(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto">
          {notifList.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin notificaciones</p>
            </div>
          ) : notifList.map(n => (
            <button
              key={n.id}
              onClick={() => {
                markNotifRead(n.id);
                if (n.demandaId) {
                  const d = allDemandas.find(x => x.id === n.demandaId);
                  if (d) { setSelectedDemanda(d); setCurrentScreen('detalle'); }
                }
                setShowNotifications(false);
              }}
              className={`w-full text-left p-4 border-b border-slate-100 dark:border-white/5 last:border-0 flex gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${!n.leido ? 'bg-emerald-50 dark:bg-emerald-500/10' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.leido ? 'bg-emerald-500' : 'bg-transparent'}`} />
              <div className="flex-1">
                <p className={`text-sm ${!n.leido ? 'font-semibold' : ''}`}>{n.mensaje}</p>
                <p className="text-xs text-slate-400 mt-0.5">{tiempoRelativo(n.tiempo)}</p>
              </div>
              {n.tipo === 'respuesta' && <MessageSquare className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />}
              {n.tipo === 'oferta' && <Tag className="w-4 h-4 text-violet-500 shrink-0 mt-0.5" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  // ─── Profile Dropdown (desktop) ──────────────────────────────────────────
  const ProfileDropdown = () => {
    useEffect(() => {
      const handler = (e) => { if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) setShowProfileDropdown(false); };
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }, []);

    const navItems = [
      { label: 'Mis Demandas', action: () => { setCurrentScreen('home'); setActiveTab('demandas'); setShowProfileDropdown(false); } },
      { label: 'Historial', action: () => { setCurrentScreen('historial'); setShowProfileDropdown(false); } },
    ];

    return (
      <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 z-50 animate-dropdown-in overflow-hidden">
        {/* User info */}
        <div className="p-4 border-b border-slate-200 dark:border-white/10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl overflow-hidden shrink-0 bg-emerald-100 flex items-center justify-center">
            {firebaseUser?.photoURL
              ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
              : <span className="font-bold text-emerald-600">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</span>
            }
          </div>
          <div className="min-w-0">
            <p className="font-bold truncate">{firebaseUser?.displayName || 'Usuario'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{firebaseUser?.email || ''}</p>
          </div>
        </div>
        {/* Stats row */}
        <div className="grid grid-cols-3 divide-x divide-slate-200 dark:divide-white/10 border-b border-slate-200 dark:border-white/10">
          {[
            { label: 'Activas', value: demandasActivas.length, cls: 'text-emerald-500' },
            { label: 'Historial', value: demandasHistorial.length, cls: '' },
            { label: 'Respuestas', value: allDemandas.reduce((a, d) => a + (d.respuestas || 0), 0), cls: 'text-violet-500' },
          ].map(({ label, value, cls }) => (
            <div key={label} className="py-3 text-center">
              <p className={`text-xl font-bold ${cls}`}>{value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
            </div>
          ))}
        </div>
        {/* Nav links */}
        <div className="p-2">
          {navItems.map(({ label, action }) => (
            <button key={label} onClick={action}
              className="w-full text-left px-3 py-2.5 rounded-xl font-semibold text-sm hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-between transition-colors">
              {label}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
          <div className="border-t border-slate-200 dark:border-white/10 mt-2 pt-2">
            <button onClick={onLogout}
              className="w-full text-left px-3 py-2.5 rounded-xl font-semibold text-sm text-rose-500 hover:bg-rose-500/10 flex items-center gap-2 transition-colors">
              <LogOut className="w-4 h-4" /> Cerrar sesion
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Profile Modal (mobile) ───────────────────────────────────────────────
  const ProfileModal = () => (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end justify-center lg:hidden">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl w-full max-w-md animate-fade-in">
        <div className="p-5 border-b border-slate-200 dark:border-white/10">
          <div className="flex justify-between items-start mb-5">
            <h2 className="font-bold text-lg">Mi Perfil</h2>
            <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-emerald-100">
              {firebaseUser?.photoURL
                ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-emerald-600">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</span>
              }
            </div>
            <div>
              <h3 className="font-bold text-lg">{firebaseUser?.displayName || 'Usuario'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{firebaseUser?.email || ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Activas', value: demandasActivas.length, cls: 'bg-emerald-500/10 text-emerald-500' },
              { label: 'Historial', value: demandasHistorial.length, cls: 'bg-slate-100 dark:bg-white/10' },
              { label: 'Respuestas', value: allDemandas.reduce((a, d) => a + (d.respuestas || 0), 0), cls: 'bg-violet-500/10 text-violet-500' },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`${cls} rounded-2xl p-3 text-center`}>
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="p-4 space-y-1">
          {[
            { label: 'Mis demandas activas', action: () => { setCurrentScreen('home'); setActiveTab('demandas'); setShowProfile(false); } },
            { label: 'Historial', action: () => { setCurrentScreen('historial'); setShowProfile(false); } },
          ].map(({ label, action }) => (
            <button key={label} onClick={action}
              className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl font-semibold flex items-center justify-between transition-colors">
              {label}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
          <div className="border-t border-slate-200 dark:border-white/10 pt-2 mt-2">
            <button onClick={onLogout}
              className="w-full text-left px-4 py-3 hover:bg-rose-500/10 rounded-xl font-semibold text-rose-500 flex items-center gap-2 transition-colors">
              <LogOut className="w-4 h-4" /> Cerrar sesion
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // ChatModal is intentionally NOT a nested component — inlined at render site to avoid remount on every keystroke

  // ─── Home Screen ──────────────────────────────────────────────────────────
  const HomeScreen = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-28 lg:pb-8">
      {/* Header Mobile */}
      <div className="lg:hidden bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm dark:shadow-none dark:border-b dark:border-white/10 p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-11 h-11 bg-emerald-500 rounded-2xl flex items-center justify-center">
                <Store className="w-6 h-6 text-white" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full border-2 border-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Lokal</h1>
              <a href="https://www.instagram.com/katriel.martinez" target="_blank" rel="noopener"
                className="flex items-center gap-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <span className="text-[9px]">by</span>
                <KtrlLogo className="h-2 opacity-60" />
              </a>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </button>
            <button onClick={() => setShowNotifications(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full" />}
            </button>
            <button onClick={() => setShowProfile(true)} className="w-9 h-9 rounded-xl overflow-hidden hover:ring-2 hover:ring-emerald-400 transition-all shrink-0">
              {firebaseUser?.photoURL
                ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-sm">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</div>
              }
            </button>
          </div>
        </div>
        <div className="relative mb-4">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar..." className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
        </div>
        <div className="flex gap-2 bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl">
          {['demandas', 'ofertas'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${activeTab === tab ? 'bg-white dark:bg-white/10 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>
              {tab === 'demandas' ? 'Mis Demandas' : 'Ofertas'}
            </button>
          ))}
        </div>
      </div>

      {/* Header Desktop */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 border-b-2 border-slate-200 dark:border-white/10 sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center gap-6">
          <div className="shrink-0">
            <h2 className="text-2xl font-bold">{activeTab === 'demandas' ? 'Mis Demandas' : 'Ofertas'}</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{activeTab === 'demandas' ? `${demandasActivas.length} activas` : `${ofertas.length} disponibles`}</p>
          </div>
          <div className="flex items-center gap-3 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar..." className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
            </div>
            {activeTab === 'demandas' && (
              <CustomSelect
                value={sortBy}
                onChange={setSortBy}
                options={[{ value: 'recientes', label: 'Recientes' }, { value: 'respuestas', label: 'Mas respuestas' }]}
              />
            )}
          </div>
          {/* Avatar perfil desktop */}
          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button onClick={() => setShowNotifications(true)} className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full" />}
            </button>
            {/* Dropdown trigger */}
            <div ref={profileDropdownRef} className="relative">
              <button
                onClick={() => setShowProfileDropdown(o => !o)}
                className={`flex items-center gap-2.5 pl-1 pr-3 py-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all ${showProfileDropdown ? 'bg-slate-100 dark:bg-white/10' : ''}`}
              >
                <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0">
                  {firebaseUser?.photoURL
                    ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full bg-emerald-100 flex items-center justify-center font-bold text-emerald-600 text-sm">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</div>
                  }
                </div>
                <span className="text-sm font-semibold max-w-[120px] truncate">{firebaseUser?.displayName?.split(' ')[0] || 'Perfil'}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>
              {showProfileDropdown && <ProfileDropdown />}
            </div>
          </div>
        </div>
      </div>

      {/* CTA Mobile */}
      {activeTab === 'demandas' && (
        <div className="lg:hidden px-5 pt-5 pb-4">
          <button onClick={() => { setEditingDemanda(null); setSelectedRubros([]); setCurrentScreen('crear'); }}
            className="w-full bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-5 shadow-lg active:scale-[0.98] transition-transform">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Camera className="w-7 h-7" />
                </div>
                <div className="text-left">
                  <p className="font-bold text-lg">Que estas buscando?</p>
                  <p className="text-emerald-100 text-sm">Publica tu demanda</p>
                </div>
              </div>
              <ChevronRight className="w-6 h-6" />
            </div>
          </button>
        </div>
      )}

      {/* Grid */}
      <div className="max-w-7xl mx-auto px-5 lg:px-8 py-5">
        {activeTab === 'demandas' && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-lg">Activas</h3>
            <div className="flex items-center gap-2">
              {/* Sort mobile */}
              <div className="lg:hidden">
                <CustomSelect
                  value={sortBy}
                  onChange={setSortBy}
                  size="sm"
                  options={[{ value: 'recientes', label: 'Recientes' }, { value: 'respuestas', label: 'Mas respuestas' }]}
                />
              </div>
              {loadingDemandas
                ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                : <span className="text-sm text-slate-400">{sortedDemandas.length} items</span>
              }
            </div>
          </div>
        )}

        {errorDemandas && activeTab === 'demandas' && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <p className="text-sm text-rose-700 flex-1">{errorDemandas}</p>
            <button onClick={fetchDemandas} className="text-xs font-bold text-rose-700 underline">Reintentar</button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {activeTab === 'demandas' ? (
            loadingDemandas ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-white/10 p-5 animate-pulse">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-slate-200 dark:bg-white/10 rounded-2xl shrink-0" />
                    <div className="flex-1 space-y-2 pt-1">
                      <div className="h-4 bg-slate-200 dark:bg-white/10 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 dark:bg-white/10 rounded" />
                      <div className="h-3 bg-slate-200 dark:bg-white/10 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))
            ) : sortedDemandas.map(d => (
              <div key={d.id} onClick={() => { setSelectedDemanda(d); setCurrentScreen('detalle'); }}
                className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-white/10 p-5 hover:shadow-lg cursor-pointer transition-all active:scale-[0.98] group">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                    {d.foto?.startsWith('http') ? <img src={d.foto} alt="" className="w-full h-full object-cover" /> : (d.foto || '📦')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold mb-1 truncate">{d.titulo}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{d.descripcion}</p>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="text-slate-400">{d.tiempoCreado}</span>
                      {d.respuestas > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 font-bold">
                          <MessageSquare className="w-3 h-3" />{d.respuestas}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            filteredOfertas.map(o => (
              <div key={o.id} className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-white/10 p-5 hover:shadow-lg transition-all">
                <div className="flex gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center text-3xl shrink-0">{o.foto}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2 mb-1">
                      <h3 className="font-bold truncate">{o.titulo}</h3>
                      {o.precio && <p className="font-bold text-emerald-600 shrink-0">${o.precio.toLocaleString()}</p>}
                    </div>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">{o.descripcion}</p>
                    <div className="flex gap-1.5 text-xs text-slate-400">
                      <span className="font-semibold text-slate-600">{o.tienda}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{o.distancia}</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => openChat({ id: o.id, tienda: o.tienda, foto: tiendas.find(t => t.id === o.tiendaId)?.foto || '🏪', mensaje: `Te consultan por: ${o.titulo}. Tenemos stock disponible!` })}
                  className="w-full py-2.5 bg-slate-900 dark:bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors"
                >
                  Consultar
                </button>
              </div>
            ))
          )}
        </div>

        {!loadingDemandas && activeTab === 'demandas' && sortedDemandas.length === 0 && (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <Package className="w-10 h-10 text-emerald-400" />
            </div>
            <p className="font-bold text-lg mb-1">{searchQuery ? 'Sin resultados' : 'Aun no tenes demandas'}</p>
            <p className="text-sm text-slate-400 mb-6">
              {searchQuery ? 'Proba con otras palabras' : 'Publica lo que necesitas y las tiendas te responden'}
            </p>
            {!searchQuery && (
              <button onClick={() => { setEditingDemanda(null); setCurrentScreen('crear'); }}
                className="px-6 py-3 bg-slate-900 dark:bg-emerald-500 text-white rounded-2xl font-bold">
                Crear demanda
              </button>
            )}
          </div>
        )}

        {activeTab === 'ofertas' && filteredOfertas.length === 0 && (
          <div className="text-center py-16">
            <Tag className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="font-semibold text-slate-500">Sin ofertas disponibles</p>
          </div>
        )}
      </div>
    </div>
  );

  // ─── Crear / Editar Demanda ───────────────────────────────────────────────
  const CrearDemandaScreen = () => {
    const editing = !!editingDemanda;
    const [titulo, setTitulo] = useState(editingDemanda?.titulo || '');
    const [descripcion, setDescripcion] = useState(editingDemanda?.descripcion || '');
    const [presupuestoMin, setPresupuestoMin] = useState(editingDemanda?.presupuesto?.min || '');
    const [presupuestoMax, setPresupuestoMax] = useState(editingDemanda?.presupuesto?.max || '');
    const [imageFile, setImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(editingDemanda?.foto?.startsWith('http') ? editingDemanda.foto : null);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const handleImageChange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
      if (!titulo.trim()) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        let fotoUrl = editingDemanda?.foto || '📦';

        if (imageFile) {
          const base64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result.split(',')[1]);
            reader.onerror = reject;
            reader.readAsDataURL(imageFile);
          });
          const up = await fetch(`${API_BASE}/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileName: imageFile.name, fileData: base64, contentType: imageFile.type }),
          });
          if (up.ok) fotoUrl = (await up.json()).url;
        }

        const payload = {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          foto: fotoUrl,
          categorias: selectedRubros,
          presupuesto: (presupuestoMin || presupuestoMax)
            ? { min: presupuestoMin ? Number(presupuestoMin) : null, max: presupuestoMax ? Number(presupuestoMax) : null }
            : null,
        };

        if (editing) {
          // PATCH
          setAllDemandas(prev => prev.map(d => d.id === editingDemanda.id ? { ...d, ...payload } : d));
          await fetch(`${API_BASE}/demandas`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: editingDemanda.id, ...payload }),
          });
        } else {
          // POST
          const res = await fetch(`${API_BASE}/demandas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) throw new Error('Error al publicar');
          const nueva = await res.json();
          setAllDemandas(prev => [nueva, ...prev]);
          addNotif('Tu demanda fue publicada. Las tiendas ya pueden verla.', 'sistema', nueva.id);
        }

        setSuccess(true);
        setTimeout(() => {
          setEditingDemanda(null);
          setSelectedRubros([]);
          setCurrentScreen('home');
          setSuccess(false);
        }, 1800);
      } catch (err) {
        setSubmitError(err.message);
      } finally {
        setSubmitting(false);
      }
    };

    if (success) return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
        <div className="text-center">
          <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle className="w-12 h-12 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">{editing ? 'Demanda actualizada' : 'Demanda publicada!'}</h2>
          <p className="text-slate-500">{editing ? 'Los cambios fueron guardados' : 'Las tiendas ya pueden responderte'}</p>
        </div>
      </div>
    );

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
        <div className="bg-white border-b px-5 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => { setEditingDemanda(null); setCurrentScreen('home'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">{editing ? 'Editar Demanda' : 'Nueva Demanda'}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">Completa los datos</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-5 py-6 space-y-6">
          {/* Foto */}
          <div>
            <label className="block font-bold mb-3 text-sm">Foto del producto *</label>
            <div onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 dark:border-white/20 rounded-3xl p-8 text-center bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors hover:border-emerald-400">
              {imagePreview
                ? <img src={imagePreview} alt="Preview" className="w-28 h-28 object-cover rounded-2xl mx-auto mb-3" />
                : <Camera className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
              }
              <p className="font-semibold text-sm mb-2">{imagePreview ? 'Cambiar foto' : 'Subir una foto'}</p>
              <span className="px-5 py-2 bg-slate-900 dark:bg-emerald-500 text-white rounded-xl text-sm font-semibold">Seleccionar</span>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
          </div>

          {/* Titulo */}
          <div>
            <label className="block font-bold mb-2 text-sm">Que estas buscando? *</label>
            <input type="text" value={titulo} onChange={e => setTitulo(e.target.value)}
              placeholder="Ej: Cable USB-C a HDMI 2 metros"
              className={`w-full px-4 py-4 border-2 rounded-2xl focus:outline-none transition-colors ${titulo.trim() ? 'border-emerald-400' : 'border-slate-200 focus:border-emerald-400'}`} />
          </div>

          {/* Descripcion */}
          <div>
            <label className="block font-bold mb-2 text-sm">Descripcion <span className="font-normal text-slate-400">(opcional)</span></label>
            <textarea rows={4} value={descripcion} onChange={e => setDescripcion(e.target.value)}
              placeholder="Contanos mas detalles: marca, modelo, uso, medidas..."
              className="w-full px-4 py-4 border-2 border-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-white rounded-2xl focus:outline-none focus:border-emerald-400 resize-none transition-colors" />
          </div>

          {/* Presupuesto */}
          <div>
            <label className="block font-bold mb-2 text-sm">Presupuesto <span className="font-normal text-slate-400">(opcional)</span></label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Desde $</p>
                <input type="number" value={presupuestoMin} onChange={e => setPresupuestoMin(e.target.value)}
                  placeholder="0" className="w-full px-4 py-3 border-2 border-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-white rounded-2xl focus:outline-none focus:border-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-slate-400 mb-1.5">Hasta $</p>
                <input type="number" value={presupuestoMax} onChange={e => setPresupuestoMax(e.target.value)}
                  placeholder="0" className="w-full px-4 py-3 border-2 border-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-white rounded-2xl focus:outline-none focus:border-emerald-400" />
              </div>
            </div>
          </div>

          {/* Categorias */}
          <div>
            <label className="block font-bold mb-2 text-sm">Categorias <span className="font-normal text-slate-400">(opcional)</span></label>
            <div className="flex flex-wrap gap-2">
              {RUBROS.map(r => (
                <button key={r} type="button"
                  onClick={() => {
                    const isSelected = selectedRubros.includes(r);
                    const next = isSelected ? selectedRubros.filter(x => x !== r) : [...selectedRubros, r];
                    setSelectedRubros(next);
                    setFilterWarning(next.length >= 2);
                  }}
                  className={`px-4 py-2 rounded-xl font-semibold text-sm border-2 transition-all ${selectedRubros.includes(r) ? 'bg-slate-900 dark:bg-emerald-500 text-white border-slate-900 dark:border-emerald-500' : 'bg-white dark:bg-white/5 border-slate-200 dark:border-white/20 hover:border-slate-300 dark:hover:border-white/40 dark:text-slate-300'}`}>
                  {r}
                </button>
              ))}
            </div>
            {filterWarning && (
              <div className="mt-3 bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-800 text-sm">Cuidado con filtrar demasiado</p>
                  <p className="text-amber-700 text-xs mt-0.5">Muchas categorias pueden ocultar tiendas que tienen lo que buscas.</p>
                </div>
              </div>
            )}
          </div>

          {submitError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700">{submitError}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={!titulo.trim() || submitting}
            className="w-full bg-slate-900 dark:bg-emerald-500 text-white py-4 rounded-2xl font-bold disabled:opacity-40 hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors flex items-center justify-center gap-2">
            {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Publicando...</> : (editing ? 'Guardar cambios' : 'Publicar Demanda')}
          </button>
        </div>
      </div>
    );
  };

  // ─── Detalle Demanda ──────────────────────────────────────────────────────
  const DetalleDemandaScreen = () => {
    const demanda = allDemandas.find(d => d.id === selectedDemanda?.id) || selectedDemanda;
    const [respuestas, setRespuestas] = useState([]);
    const [loadingResp, setLoadingResp] = useState(true);
    const isPaused = demanda?.estado === 'pausada';

    useEffect(() => {
      if (!demanda?.id) return;
      setLoadingResp(true);
      fetch(`${API_BASE}/respuestas?demandaId=${demanda.id}`)
        .then(r => r.ok ? r.json() : [])
        .then(data => setRespuestas(data.length > 0 ? data : getMockRespuestas(demanda)))
        .catch(() => setRespuestas(getMockRespuestas(demanda)))
        .finally(() => setLoadingResp(false));
    }, [demanda?.id]);

    const handlePausar = () => {
      setShowConfirm({
        title: isPaused ? 'Reactivar demanda' : 'Pausar demanda',
        msg: isPaused ? 'Las tiendas volverin a ver tu demanda.' : 'Las tiendas dejarán de ver tu demanda temporalmente.',
        onOk: () => {
          updateDemandaEstado(demanda.id, isPaused ? 'activa' : 'pausada');
          setShowConfirm(null);
          if (!isPaused) { setCurrentScreen('home'); }
        },
      });
    };

    const handleFinalizar = () => {
      setShowConfirm({
        title: 'Finalizar demanda',
        msg: 'Marca esta demanda como resuelta. Pasará al historial.',
        onOk: () => {
          updateDemandaEstado(demanda.id, 'finalizada');
          setShowConfirm(null);
          setCurrentScreen('home');
        },
      });
    };

    const handleEditar = () => {
      setEditingDemanda(demanda);
      setSelectedRubros(demanda.categorias || []);
      setCurrentScreen('crear');
    };

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
        <div className="bg-white border-b px-5 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentScreen('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold">Detalle de Demanda</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{respuestas.length} respuestas</p>
            </div>
            {demanda?.estado === 'pausada' && (
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-xl">PAUSADA</span>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Header demanda */}
          <div className="bg-white border-b px-5 py-6">
            <div className="flex gap-4 mb-5">
              <div className="w-20 h-20 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center text-4xl shrink-0 overflow-hidden">
                {demanda?.foto?.startsWith('http')
                  ? <img src={demanda.foto} alt="" className="w-full h-full object-cover" />
                  : (demanda?.foto || '📦')}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-lg mb-1">{demanda?.titulo}</h2>
                {demanda?.descripcion && <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{demanda.descripcion}</p>}
                {demanda?.presupuesto && (
                  <p className="text-sm font-semibold text-emerald-700 mb-2">
                    Presupuesto: ${demanda.presupuesto.min?.toLocaleString() || '0'} - ${demanda.presupuesto.max?.toLocaleString() || '?'}
                  </p>
                )}
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${demanda?.estado === 'activa' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                    {(demanda?.estado || 'activa').toUpperCase()}
                  </span>
                  <span className="text-xs text-slate-400 flex items-center">{demanda?.tiempoCreado}</span>
                  {demanda?.categorias?.map(c => (
                    <span key={c} className="px-2 py-1 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-lg text-xs">{c}</span>
                  ))}
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button onClick={handleEditar} className="py-2.5 bg-slate-100 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors">
                <Edit3 className="w-4 h-4" /> Editar
              </button>
              <button onClick={handlePausar} className="py-2.5 bg-slate-100 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors">
                {isPaused ? <><RotateCcw className="w-4 h-4" /> Reactivar</> : <><Pause className="w-4 h-4" /> Pausar</>}
              </button>
              <button onClick={handleFinalizar} className="py-2.5 bg-slate-900 dark:bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors">
                <CheckCircle className="w-4 h-4" /> Finalizar
              </button>
            </div>
          </div>

          {/* Respuestas */}
          <div className="px-5 py-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Respuestas</h3>
              <span className="px-3 py-1.5 bg-slate-900 dark:bg-white/15 text-white rounded-xl text-xs font-bold">{respuestas.length} tiendas</span>
            </div>

            {respuestas.map(r => (
              <div key={r.id} className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5 hover:border-slate-200 dark:hover:border-white/20 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3">
                    <div className="w-14 h-14 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">{r.foto}</div>
                    <div>
                      <h4 className="font-bold">{r.tienda}</h4>
                      <div className="flex gap-3 text-xs text-slate-400 mt-1">
                        <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{r.distancia}</span>
                        <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{r.rating}</span>
                      </div>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 shrink-0">{r.tiempoRespuesta}</span>
                </div>

                <p className="text-sm bg-slate-50 rounded-2xl p-4 mb-4 leading-relaxed">{r.mensaje}</p>

                <div className="flex justify-between items-end mb-4 pb-4 border-b border-slate-100 dark:border-white/5">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Precio ofrecido</p>
                    <p className="text-2xl font-bold">${r.precio.toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mb-1">Horario</p>
                    <p className="text-sm font-bold text-emerald-600 flex items-center gap-1.5">
                      <Clock className="w-4 h-4" />{r.horario}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button onClick={() => openChat(r)}
                    className="py-3 bg-slate-900 dark:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors">
                    <MessageSquare className="w-4 h-4" /> Chatear
                  </button>
                  <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(r.tienda)}`, '_blank')}
                    className="py-3 bg-slate-100 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-200 transition-colors">
                    <Navigation className="w-4 h-4" /> Navegar
                  </button>
                </div>
              </div>
            ))}

            {respuestas.length === 0 && (
              <div className="text-center py-10">
                <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="font-semibold text-slate-400">Aun sin respuestas</p>
                <p className="text-sm text-slate-300 mt-1">Las tiendas estan viendo tu demanda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ─── Historial ────────────────────────────────────────────────────────────
  const HistorialScreen = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
      <div className="bg-white border-b px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <button onClick={() => setCurrentScreen('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl lg:hidden">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-bold">Historial</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">Demandas pausadas y finalizadas</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 py-6 space-y-4">
        {demandasHistorial.length === 0 ? (
          <div className="text-center py-16">
            <History className="w-14 h-14 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-400">Sin historial todavia</p>
            <p className="text-sm text-slate-300 mt-1">Las demandas pausadas o finalizadas apareceran aqui</p>
          </div>
        ) : demandasHistorial.map(d => (
          <div key={d.id} className="bg-white rounded-3xl border-2 border-slate-100 p-5">
            <div className="flex gap-4 mb-4">
              <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-3xl shrink-0 overflow-hidden">
                {d.foto?.startsWith('http') ? <img src={d.foto} alt="" className="w-full h-full object-cover" /> : (d.foto || '📦')}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-bold truncate">{d.titulo}</h3>
                  <span className={`px-2.5 py-1 rounded-xl text-xs font-bold shrink-0 ${d.estado === 'finalizada' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                    {d.estado === 'finalizada' ? 'RESUELTA' : 'PAUSADA'}
                  </span>
                </div>
                {d.descripcion && <p className="text-sm text-slate-400 line-clamp-1">{d.descripcion}</p>}
                <p className="text-xs text-slate-400 mt-1">{d.tiempoCreado}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {d.estado === 'pausada' && (
                <button onClick={() => updateDemandaEstado(d.id, 'activa')}
                  className="py-2.5 bg-emerald-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-emerald-600 transition-colors">
                  <RotateCcw className="w-4 h-4" /> Reactivar
                </button>
              )}
              <button
                onClick={() => setShowConfirm({ title: 'Eliminar demanda', msg: 'Esta accion no se puede deshacer.', onOk: () => { deleteDemanda(d.id); setShowConfirm(null); } })}
                className={`py-2.5 bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-rose-50 hover:text-rose-600 transition-colors ${d.estado !== 'pausada' ? 'col-span-2' : ''}`}>
                <Trash2 className="w-4 h-4" /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ─── Tiendas Screen ───────────────────────────────────────────────────────
  const TiendasScreen = () => {
    const [query, setQuery] = useState('');
    const filtered = tiendas.filter(t =>
      t.nombre.toLowerCase().includes(query.toLowerCase()) ||
      t.rubro.toLowerCase().includes(query.toLowerCase())
    );

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
        <div className="bg-white border-b px-5 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setCurrentScreen('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl lg:hidden">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Tiendas</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tiendas.length} locales cercanos</p>
            </div>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" value={query} onChange={e => setQuery(e.target.value)}
              placeholder="Buscar tiendas o rubros..."
              className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-5 py-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(t => (
            <div key={t.id} onClick={() => { setSelectedTienda(t); setCurrentScreen('tienda-detail'); }}
              className="bg-white rounded-3xl border-2 border-slate-100 p-5 hover:shadow-lg cursor-pointer transition-all hover:border-slate-200">
              <div className="flex gap-3 mb-4">
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center text-2xl shrink-0">{t.foto}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold">{t.nombre}</h3>
                    <div className="flex items-center gap-0.5 shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm font-bold">{t.rating}</span>
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{t.rubro}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />{t.distancia}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-white/5">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${t.abierto ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className={`text-sm font-semibold ${t.abierto ? 'text-emerald-600' : 'text-slate-400'}`}>{t.horario}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="py-2.5 bg-slate-900 dark:bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors">Ver tienda</button>
                <button onClick={e => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/${encodeURIComponent(t.nombre)}`, '_blank'); }}
                  className="py-2.5 bg-slate-100 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-slate-200 transition-colors">
                  <Navigation className="w-4 h-4" /> Navegar
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Tienda Detail ────────────────────────────────────────────────────────
  const TiendaDetailScreen = ({ tienda }) => {
    const ofertasTienda = ofertas.filter(o => o.tiendaId === tienda.id);

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
        <div className="bg-white border-b px-5 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => { setSelectedTienda(null); setCurrentScreen('tiendas'); }} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">{tienda.nombre}</h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">{tienda.rubro}</p>
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto p-5 space-y-5">
          {/* Info principal */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-6">
            <div className="flex gap-4 mb-5">
              <div className="w-20 h-20 bg-violet-100 rounded-2xl flex items-center justify-center text-4xl shrink-0">{tienda.foto}</div>
              <div className="flex-1">
                <h2 className="font-bold text-xl mb-1">{tienda.nombre}</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{tienda.rubro}</p>
                <div className="flex gap-3 text-sm">
                  <span className="flex items-center gap-1 text-slate-500"><MapPin className="w-3.5 h-3.5" />{tienda.distancia}</span>
                  <span className="flex items-center gap-1 font-bold"><Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />{tienda.rating}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 mb-5 pb-5 border-b border-slate-100 dark:border-white/5">
              <div className={`w-2.5 h-2.5 rounded-full ${tienda.abierto ? 'bg-emerald-500' : 'bg-slate-300'}`} />
              <span className={`text-sm font-bold ${tienda.abierto ? 'text-emerald-600' : 'text-slate-400'}`}>{tienda.horario}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(tienda.nombre)}`, '_blank')}
                className="py-3 bg-slate-900 dark:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors">
                <Navigation className="w-4 h-4" /> Navegar
              </button>
              <button onClick={() => window.open(`tel:${tienda.telefono}`, '_self')}
                className="py-3 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-colors">
                Llamar
              </button>
            </div>
          </div>

          {/* Informacion */}
          <div className="bg-white rounded-3xl border-2 border-slate-100 p-5">
            <h3 className="font-bold mb-4">Informacion</h3>
            <div className="space-y-4 text-sm">
              <div className="flex gap-3">
                <MapPin className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Direccion</p>
                  <p className="text-slate-500">Av. Principal 1234, Centro</p>
                </div>
              </div>
              <div className="flex gap-3">
                <Clock className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Horarios</p>
                  <p className="text-slate-500">Lun - Vie: 9:00 - 20:00</p>
                  <p className="text-slate-500">Sab: 9:00 - 13:00</p>
                </div>
              </div>
            </div>
          </div>

          {/* Ofertas de esta tienda */}
          {ofertasTienda.length > 0 && (
            <div className="bg-white rounded-3xl border-2 border-slate-100 p-5">
              <h3 className="font-bold mb-4">Productos disponibles</h3>
              <div className="space-y-3">
                {ofertasTienda.map(o => (
                  <div key={o.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl">
                    <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-xl shrink-0">{o.foto}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{o.titulo}</p>
                      <p className="text-xs text-slate-400 truncate">{o.descripcion}</p>
                    </div>
                    {o.precio && <p className="font-bold text-emerald-600 text-sm shrink-0">${o.precio.toLocaleString()}</p>}
                  </div>
                ))}
              </div>
              <button
                onClick={() => openChat({ id: tienda.id, tienda: tienda.nombre, foto: tienda.foto, mensaje: 'Hola! En que puedo ayudarte?' })}
                className="w-full mt-4 py-3 bg-slate-900 dark:bg-emerald-500 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors">
                <MessageSquare className="w-4 h-4" /> Consultar
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Bottom Nav Mobile ────────────────────────────────────────────────────
  const BottomNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white dark:bg-slate-900 border-t-2 border-slate-100 dark:border-white/10 px-4 py-3 shadow-lg z-20">
      <div className="flex items-center justify-around">
        <button onClick={() => { setCurrentScreen('home'); setActiveTab('demandas'); }} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${currentScreen === 'home' && activeTab === 'demandas' ? 'bg-slate-900 dark:bg-emerald-500/15' : 'bg-slate-100 dark:bg-white/5'}`}>
            <Package className={`w-5 h-5 ${currentScreen === 'home' && activeTab === 'demandas' ? 'text-white dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <span className="text-xs font-semibold text-slate-500">Demandas</span>
        </button>

        <button onClick={() => { setEditingDemanda(null); setSelectedRubros([]); setCurrentScreen('crear'); }} className="flex flex-col items-center -mt-8">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-xl border-4 border-white">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <span className="text-xs font-bold text-slate-700 mt-1">Crear</span>
        </button>

        <button onClick={() => setCurrentScreen('tiendas')} className="flex flex-col items-center gap-1">
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-colors ${currentScreen === 'tiendas' || currentScreen === 'tienda-detail' ? 'bg-slate-900 dark:bg-emerald-500/15' : 'bg-slate-100 dark:bg-white/5'}`}>
            <Store className={`w-5 h-5 ${currentScreen === 'tiendas' || currentScreen === 'tienda-detail' ? 'text-white dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <span className="text-xs font-semibold text-slate-500">Tiendas</span>
        </button>
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  const showBottomNav = !['crear'].includes(currentScreen);

  return (
    <div className="flex bg-slate-100 dark:bg-slate-950 min-h-screen">
      <DesktopSidebar />

      <div className="flex-1 lg:max-w-none max-w-md mx-auto bg-white lg:bg-slate-50 shadow-2xl lg:shadow-none min-h-screen relative">
        {currentScreen === 'home' && <HomeScreen />}
        {currentScreen === 'crear' && <CrearDemandaScreen />}
        {currentScreen === 'detalle' && selectedDemanda && <DetalleDemandaScreen />}
        {currentScreen === 'tiendas' && <TiendasScreen />}
        {currentScreen === 'tienda-detail' && selectedTienda && <TiendaDetailScreen tienda={selectedTienda} />}
        {currentScreen === 'historial' && <HistorialScreen />}

        {showBottomNav && <BottomNav />}
        {showNotifications && <NotificationsModal />}
        {showProfile && <ProfileModal />}
        {showChat && (() => {
          const tienda = showChat;
          const messages = chatHistories[tienda.chatKey] || [];
          return (
            <div className="fixed inset-0 lg:inset-auto lg:right-8 lg:bottom-8 lg:w-96 lg:h-[580px] bg-white dark:bg-slate-900 z-50 flex flex-col lg:rounded-3xl lg:shadow-2xl lg:border-2 border-slate-200 dark:border-white/10">
              {/* Header */}
              <div className="border-b-2 border-slate-200 dark:border-white/10 p-4 lg:rounded-t-3xl shrink-0 flex items-center gap-3">
                <button onClick={() => setShowChat(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
                  <X className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 bg-violet-100 dark:bg-violet-500/20 rounded-xl flex items-center justify-center text-xl shrink-0">{tienda.foto}</div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{tienda.tienda}</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">En linea</p>
                  </div>
                </div>
                <button onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(tienda.tienda)}`, '_blank')}
                  className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl shrink-0">
                  <Navigation className="w-4 h-4 text-slate-500" />
                </button>
              </div>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.from === 'user' ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 shadow-sm'}`}>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${msg.from === 'user' ? 'text-emerald-200' : 'text-slate-400'}`}>{msg.time}</p>
                    </div>
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {/* Input */}
              <div className="border-t-2 border-slate-200 dark:border-white/10 p-4 lg:rounded-b-3xl shrink-0">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={e => setChatMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                    placeholder="Escribi tu mensaje..."
                    className="flex-1 px-4 py-3 bg-slate-100 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <button onClick={sendChatMessage} disabled={!chatMessage.trim()}
                    className="w-12 h-12 bg-emerald-600 hover:bg-emerald-500 rounded-2xl flex items-center justify-center disabled:opacity-40 transition-colors shrink-0">
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
        {showConfirm && <ConfirmModal {...showConfirm} onCancel={() => setShowConfirm(null)} />}
      </div>
    </div>
  );
};

export default UserApp;
