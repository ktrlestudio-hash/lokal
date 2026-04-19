import React, { useState, useEffect, useRef } from 'react';
import {
  Camera, MapPin, Search, Store, Package, MessageSquare, Bell, User,
  ChevronRight, Clock, Navigation, X, AlertCircle, ArrowLeft, Send,
  Tag, Loader2, CheckCircle, Pause, Edit3, Trash2, RotateCcw,
  Star, ChevronDown, Filter, History, TrendingUp, Sun, Moon, LogOut, Play
} from 'lucide-react';
import CategoryPicker from './CategoryPicker';
import AttributesEditor from './AttributesEditor';
import CategoryIcon from './CategoryIcon';
import { CATEGORIES, getCategoryPath, getAllDescendants } from './categories';

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

// ─── Category Filter Bar ──────────────────────────────────────────────────────
const CategoryFilterBar = ({ filterCategory, setFilterCategory, categories = CATEGORIES, presentIds }) => {
  const scrollRef = useRef(null);
  const [canScrollRight, setCanScrollRight] = React.useState(false);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const checkScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    checkScroll();
    el.addEventListener('scroll', checkScroll);
    const ro = new ResizeObserver(checkScroll);
    ro.observe(el);
    // Wheel no-pasivo para poder hacer preventDefault y scroll horizontal
    const onWheel = (e) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY + e.deltaX;
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      el.removeEventListener('scroll', checkScroll);
      el.removeEventListener('wheel', onWheel);
      ro.disconnect();
    };
  }, []);

  // Mouse drag
  const onMouseDown = (e) => {
    isDragging.current = true;
    dragStartX.current = e.pageX - scrollRef.current.offsetLeft;
    dragScrollLeft.current = scrollRef.current.scrollLeft;
    scrollRef.current.style.cursor = 'grabbing';
  };
  const onMouseMove = (e) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const x = e.pageX - scrollRef.current.offsetLeft;
    scrollRef.current.scrollLeft = dragScrollLeft.current - (x - dragStartX.current);
  };
  const onMouseUp = () => {
    isDragging.current = false;
    if (scrollRef.current) scrollRef.current.style.cursor = '';
  };

  const scrollRight = () => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: 160, behavior: 'smooth' });
  };

  // Si se pasan presentIds, solo mostrar categorías raíz con contenido real
  const cats = categories.filter(c => c.parentId === null && (!presentIds || presentIds.has(c.id)));
  const btnClass = (active) => `shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-colors ${
    active ? 'bg-emerald-500 text-white' : 'bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/12'
  }`;

  return (
    <div className="relative w-full min-w-0 overflow-hidden flex items-center">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto scrollbar-none px-5 lg:px-8 py-3 select-none w-full min-w-0"
        style={{ cursor: 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
      >
        <button onClick={() => setFilterCategory(null)} className={btnClass(!filterCategory)}>
          Todas
        </button>
        {cats.map(cat => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(filterCategory === cat.id ? null : cat.id)}
            className={btnClass(filterCategory === cat.id)}
          >
            <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
            <span>{cat.name.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Flecha derecha */}
      {canScrollRight && (
        <button
          onClick={scrollRight}
          className="absolute right-0 flex items-center justify-center w-10 h-full bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pr-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

// ─── Photo Carousel ───────────────────────────────────────────────────────────
const PhotoCarousel = ({ photos = [], className = '' }) => {
  const [idx, setIdx] = React.useState(0);
  if (!photos.length) return null;
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  return (
    <div className={`relative bg-slate-100 dark:bg-black/30 ${className}`}>
      <img
        src={photos[idx]}
        alt=""
        className="w-full object-contain max-h-72"
        style={{ aspectRatio: '16/9' }}
      />
      {photos.length > 1 && (
        <>
          <button onClick={prev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
            <ChevronDown className="w-4 h-4 rotate-90" />
          </button>
          <button onClick={next} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors">
            <ChevronDown className="w-4 h-4 -rotate-90" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button key={i} onClick={() => setIdx(i)} className={`w-1.5 h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/50'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// ─── Photo Slot (miniatura editable) ─────────────────────────────────────────
const PhotoSlot = ({ foto, idx, onRemove, isFirst }) => (
  <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/10 group shrink-0 h-full">
    <img src={foto.preview} alt="" className="w-full h-full object-cover" />
    <button
      type="button"
      onClick={() => onRemove(idx)}
      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
    >
      <X className="w-3.5 h-3.5" />
    </button>
    {isFirst && (
      <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded-md font-medium leading-none">Principal</span>
    )}
  </div>
);

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
const UserApp = ({ firebaseUser, onLogout, isDark, toggleTheme, onRegisterStore }) => {
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

  // Home
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('recientes');
  const [filterCategory, setFilterCategory] = useState(null); // id de categoría raíz para filtrar

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

  // Categorías (base + custom del servidor)
  const [allCategories, setAllCategories] = useState(CATEGORIES);

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(custom => {
        if (custom.length > 0) {
          setAllCategories([...CATEGORIES, ...custom]);
        }
      })
      .catch(() => {});
  }, []);

  const createCategory = async (name, parentId = null) => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId }),
    });
    const cat = await res.json();
    setAllCategories(prev =>
      prev.find(c => c.id === cat.id) ? prev : [...prev, cat]
    );
    return cat;
  };

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
    { id: 1, nombre: 'TecnoStore', rubro: 'Electronica y Computacion', categoryIds: ['electronica', 'computacion'], distancia: '0.8 km', rating: 4.7, foto: '📱', horario: 'Abierto hasta 20:00', abierto: true, telefono: '3456001234' },
    { id: 2, nombre: 'Electro Total', rubro: 'Electronica', categoryIds: ['electronica'], distancia: '1.2 km', rating: 4.5, foto: '⚡', horario: 'Cierra a las 19:00', abierto: true, telefono: '3456005678' },
    { id: 3, nombre: 'Ferreteria Central', rubro: 'Ferreteria y Construccion', categoryIds: ['construccion'], distancia: '0.5 km', rating: 4.8, foto: '🔧', horario: 'Abierto ahora', abierto: true, telefono: '3456009012' },
    { id: 4, nombre: 'CompuMundo', rubro: 'Computacion', categoryIds: ['computacion'], distancia: '2.5 km', rating: 4.6, foto: '💻', horario: 'Abierto hasta 21:00', abierto: true, telefono: '3456003456' },
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

  // Dado un categoryId, devuelve el id de la categoría raíz (o null)
  const getRootCategoryId = (categoryId) => {
    if (!categoryId) return null;
    let cat = allCategories.find(c => c.id === categoryId);
    while (cat && cat.parentId !== null) {
      cat = allCategories.find(c => c.id === cat.parentId);
    }
    return cat?.id ?? null;
  };

  // Set de ids raíz presentes en demandas activas
  const demandaRootIds = new Set(
    demandasActivas.map(d => getRootCategoryId(d.categoryId)).filter(Boolean)
  );

  // Set de ids raíz presentes en ofertas
  const ofertaRootIds = new Set(
    ofertas.map(o => getRootCategoryId(o.categoryId)).filter(Boolean)
  );

  const sortedDemandas = [...demandasActivas]
    .filter(d => {
      const q = searchQuery.toLowerCase();
      const matchesSearch = !q ||
        d.titulo.toLowerCase().includes(q) ||
        (d.descripcion || '').toLowerCase().includes(q);
      const matchesCategory = !filterCategory || (() => {
        if (!d.categoryId) return false;
        const descendants = getAllDescendants(filterCategory, allCategories);
        return d.categoryId === filterCategory || descendants.includes(d.categoryId);
      })();
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => sortBy === 'respuestas' ? (b.respuestas - a.respuestas) : (new Date(b.createdAt) - new Date(a.createdAt)));

  const filteredOfertas = ofertas.filter(o => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = o.titulo.toLowerCase().includes(q) || o.descripcion.toLowerCase().includes(q);
    const matchesCategory = !filterCategory || (() => {
      if (!o.categoryId) return false;
      const descendants = getAllDescendants(filterCategory, allCategories);
      return o.categoryId === filterCategory || descendants.includes(o.categoryId);
    })();
    return matchesSearch && matchesCategory;
  });

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
  const DesktopSidebar = () => {
    const [expanded, setExpanded] = React.useState(false);

    const navItems = [
      { label: 'Mis Demandas', icon: Package, screen: 'home', tab: 'demandas' },
      { label: 'Ofertas',      icon: Tag,     screen: 'home', tab: 'ofertas'  },
      { label: 'Tiendas',      icon: Store,   screen: 'tiendas'               },
      { label: 'Historial',    icon: History, screen: 'historial'              },
    ];

    // Ancho colapsado = 64px (4rem), expandido = 224px (14rem)
    const W_COLLAPSED = 64;
    const W_EXPANDED  = 224;

    return (
      <div
        className="hidden lg:flex lg:flex-col bg-white dark:bg-[#111827] border-r border-slate-100 dark:border-white/8 h-screen sticky top-0 shrink-0 overflow-hidden"
        style={{
          width: expanded ? W_EXPANDED : W_COLLAPSED,
          transition: 'width 260ms cubic-bezier(0.4,0,0.2,1)',
        }}
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
      >
        {/* ── Logo + botón ── */}
        <div className="border-b border-slate-100 dark:border-white/8 py-4 px-3 shrink-0">
          {/* Logo */}
          <div className="flex items-center h-10 mb-4 overflow-hidden">
            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                <Store className="w-4 h-4 text-white" />
              </div>
            </div>
            <div
              className="overflow-hidden whitespace-nowrap ml-2"
              style={{
                opacity: expanded ? 1 : 0,
                transition: 'opacity 180ms ease',
                transitionDelay: expanded ? '80ms' : '0ms',
              }}
            >
              <p className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-none">Lokal</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Marketplace local</p>
            </div>
          </div>

          {/* Botón nueva demanda */}
          <button
            onClick={() => { setEditingDemanda(null); setCurrentScreen('crear'); }}
            className="w-full flex items-center bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white rounded-xl transition-colors overflow-hidden"
            style={{ height: 38 }}
          >
            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
              <Camera className="w-4 h-4" />
            </div>
            <span
              className="text-sm font-semibold whitespace-nowrap overflow-hidden"
              style={{
                opacity: expanded ? 1 : 0,
                transition: 'opacity 160ms ease',
                transitionDelay: expanded ? '90ms' : '0ms',
              }}
            >
              Nueva Demanda
            </span>
          </button>
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ label, icon: Icon, screen, tab }) => {
            const active = currentScreen === screen && (!tab || activeTab === tab);
            const badge = label === 'Historial' && demandasHistorial.length > 0 ? demandasHistorial.length : null;
            return (
              <button
                key={label}
                onClick={() => { setCurrentScreen(screen); if (tab) setActiveTab(tab); }}
                className={`w-full flex items-center rounded-xl transition-colors overflow-hidden ${
                  active
                    ? 'bg-slate-100 dark:bg-white/8 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                style={{ height: 42 }}
              >
                {/* Icono — siempre centrado en los primeros 40px */}
                <div className="w-10 h-10 shrink-0 flex items-center justify-center">
                  <Icon className="w-4.5 h-4.5" />
                </div>
                {/* Label */}
                <span
                  className="text-sm font-semibold whitespace-nowrap flex-1 text-left overflow-hidden"
                  style={{
                    opacity: expanded ? 1 : 0,
                    transition: 'opacity 160ms ease',
                    transitionDelay: expanded ? '80ms' : '0ms',
                  }}
                >
                  {label}
                </span>
                {/* Badge */}
                {badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2 shrink-0 ${active ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}
                    style={{
                      opacity: expanded ? 1 : 0,
                      transition: 'opacity 160ms ease',
                      transitionDelay: expanded ? '80ms' : '0ms',
                    }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Footer: legal links (solo cuando sidebar está expandido) ── */}
        {expanded && (
          <div className="px-3 pb-1 flex items-center gap-2 overflow-hidden">
            {[
              { label: 'Términos', path: '/terminos-y-condiciones' },
              { label: 'Privacidad', path: '/politica-de-privacidad' },
            ].map(({ label, path }) => (
              <a
                key={path}
                href={path}
                className="text-[10px] text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors whitespace-nowrap"
                onClick={e => { e.preventDefault(); window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }}
              >
                {label}
              </a>
            ))}
          </div>
        )}

        {/* ── Footer: theme toggle ── */}
        <div className="py-3 px-3 border-t border-slate-100 dark:border-white/8 shrink-0">
          <button
            onClick={toggleTheme}
            className="w-full flex items-center rounded-xl text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 transition-colors overflow-hidden"
            style={{ height: 42 }}
          >
            <div className="w-10 h-10 shrink-0 flex items-center justify-center">
              {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </div>
            <span
              className="text-sm font-semibold whitespace-nowrap"
              style={{
                opacity: expanded ? 1 : 0,
                transition: 'opacity 160ms ease',
                transitionDelay: expanded ? '80ms' : '0ms',
              }}
            >
              {isDark ? 'Modo claro' : 'Modo oscuro'}
            </span>
          </button>
        </div>
      </div>
    );
  };

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

    const totalResp = allDemandas.reduce((a, d) => a + (d.respuestas || 0), 0);
    const firstName = firebaseUser?.displayName?.split(' ')[0] || 'Usuario';

    const menuItems = [
      { label: 'Mis Demandas', icon: Package, action: () => { setCurrentScreen('home'); setActiveTab('demandas'); setShowProfileDropdown(false); } },
      { label: 'Historial', icon: History, action: () => { setCurrentScreen('historial'); setShowProfileDropdown(false); } },
      ...(onRegisterStore ? [{ label: 'Registrá tu tienda', icon: Store, action: () => { setShowProfileDropdown(false); onRegisterStore(); }, highlight: true }] : []),
    ];

    return (
      <div
        className="absolute right-0 top-full mt-2.5 w-72 bg-white dark:bg-[#181f2e] rounded-2xl z-50 animate-dropdown-in overflow-hidden border border-slate-100 dark:border-white/8"
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
      >
        {/* ── User header ── */}
        <div className="p-4 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-full overflow-hidden shrink-0 bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center ring-2 ring-slate-100 dark:ring-white/10">
              {firebaseUser?.photoURL
                ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                : <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm">{firstName[0].toUpperCase()}</span>
              }
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{firebaseUser?.displayName || 'Usuario'}</p>
              <p className="text-xs text-slate-400 truncate">{firebaseUser?.email || ''}</p>
            </div>
          </div>

          {/* Stats — estilo Pexels: número grande + label pequeño */}
          <div className="grid grid-cols-3 gap-1">
            {[
              { label: 'Activas', value: demandasActivas.length, color: 'text-emerald-500' },
              { label: 'Historial', value: demandasHistorial.length, color: 'text-slate-900 dark:text-white' },
              { label: 'Respuestas', value: totalResp, color: 'text-violet-500' },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-slate-50 dark:bg-white/5 rounded-xl py-2.5 text-center">
                <p className={`text-lg font-black leading-none ${color}`}>{value}</p>
                <p className="text-[10px] text-slate-400 mt-1 leading-none">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Separador ── */}
        <div className="h-px bg-slate-100 dark:bg-white/8 mx-1" />

        {/* ── Menu items ── */}
        <div className="p-1.5">
          {menuItems.map(({ label, icon: Icon, action, highlight }) => (
            <button key={label} onClick={action}
              className={`w-full text-left px-3 py-2.5 rounded-xl text-sm flex items-center gap-2.5 transition-colors ${
                highlight
                  ? 'text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/8 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/6 font-medium'
              }`}>
              <Icon className={`w-4 h-4 shrink-0 ${highlight ? 'text-emerald-500' : 'text-slate-400'}`} />
              <span>{label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-300 ml-auto" />
            </button>
          ))}

          {/* ── Cerrar sesión — separado abajo ── */}
          <div className="h-px bg-slate-100 dark:bg-white/8 my-1" />
          <button onClick={onLogout}
            className="w-full text-left px-3 py-2.5 rounded-xl text-sm text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/8 flex items-center gap-2.5 transition-colors">
            <LogOut className="w-4 h-4 shrink-0" />
            <span className="font-medium">Cerrar sesión</span>
          </button>
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
  const HomeScreen = () => {
    const firstName = firebaseUser?.displayName?.split(' ')[0] || null;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

    return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0a0d16] pb-28 lg:pb-8">

      {/* ── Header Mobile ────────────────────────────────────────────────── */}
      <div className="lg:hidden bg-white dark:bg-[#111827] sticky top-0 z-10 border-b border-slate-100 dark:border-white/8">
        <div className="px-5 pt-5 pb-4">
          {/* Top row */}
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 tracking-wide uppercase mb-0.5">
                {greeting}{firstName ? `, ${firstName}` : ''}
              </p>
              <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">Lokal</h1>
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={toggleTheme}
                className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
                {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5 text-slate-500" />}
              </button>
              <button onClick={() => setShowNotifications(true)}
                className="w-9 h-9 flex items-center justify-center rounded-2xl hover:bg-slate-100 dark:hover:bg-white/8 transition-colors relative">
                <Bell className="w-4.5 h-4.5 text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-[#111827]" />}
              </button>
              <button onClick={() => setShowProfile(true)}
                className="w-9 h-9 rounded-2xl overflow-hidden ring-2 ring-transparent hover:ring-emerald-400 transition-all shrink-0">
                {firebaseUser?.photoURL
                  ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-emerald-500 flex items-center justify-center font-bold text-white text-sm">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</div>
                }
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar demandas, productos..."
              className="w-full pl-10 pr-4 py-3 bg-slate-100 dark:bg-white/6 rounded-2xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all" />
          </div>

          {/* Tabs */}
          <div className="flex gap-1 bg-slate-100 dark:bg-white/6 p-1 rounded-2xl">
            {[{ id: 'demandas', label: 'Mis Demandas' }, { id: 'ofertas', label: 'Ofertas' }].map(t => (
              <button key={t.id} onClick={() => { setActiveTab(t.id); setFilterCategory(null); }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === t.id
                    ? 'bg-white dark:bg-white/12 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 dark:text-slate-400'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Header Desktop ───────────────────────────────────────────────── */}
      <div className="hidden lg:block bg-white dark:bg-[#111827] border-b border-slate-100 dark:border-white/8 sticky top-0 z-10">
        <div className="px-8 h-14 flex items-center gap-6">
          <div className="shrink-0">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">{activeTab === 'demandas' ? 'Mis Demandas' : 'Ofertas'}</h2>
          </div>

          {/* Búsqueda centrada — estilo Pexels */}
          <div className="flex items-center gap-2.5 flex-1 max-w-lg">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 pointer-events-none" />
              <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                placeholder="Buscar demandas, productos..."
                className="w-full pl-10 pr-4 py-2 bg-slate-100 dark:bg-white/6 rounded-xl text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 border border-transparent focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 transition-colors" />
            </div>
            {activeTab === 'demandas' && (
              <CustomSelect value={sortBy} onChange={setSortBy}
                options={[{ value: 'recientes', label: 'Recientes' }, { value: 'respuestas', label: 'Más respuestas' }]} />
            )}
          </div>

          <div className="flex items-center gap-2 ml-auto shrink-0">
            <button onClick={() => setShowNotifications(true)}
              className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 relative transition-colors">
              <Bell className="w-4.5 h-4.5" />
              {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
            </button>
            <div ref={profileDropdownRef} className="relative">
              <button onClick={() => setShowProfileDropdown(o => !o)}
                className={`w-9 h-9 rounded-full overflow-hidden transition-all ring-2 ${showProfileDropdown ? 'ring-emerald-500' : 'ring-transparent hover:ring-emerald-400'}`}>
                {firebaseUser?.photoURL
                  ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-emerald-500 flex items-center justify-center font-bold text-white text-sm">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</div>
                }
              </button>
              {showProfileDropdown && <ProfileDropdown />}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA banner (mobile, cuando ya hay demandas) ──────────────────── */}
      {activeTab === 'demandas' && demandasActivas.length > 0 && (
        <div className="lg:hidden px-5 pt-5 pb-1">
          <button onClick={() => { setEditingDemanda(null); setCurrentScreen('crear'); }}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl p-4 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-transform flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">¿Qué estás buscando?</p>
                <p className="text-emerald-100 text-xs">Publicá tu demanda ahora</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 opacity-70" />
          </button>
        </div>
      )}

      {/* ── Filtro categorías ────────────────────────────────────────────── */}
      {(activeTab === 'demandas' ? demandasActivas.length > 0 : ofertas.length > 0) && (
        <CategoryFilterBar
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          categories={allCategories}
          presentIds={activeTab === 'demandas' ? demandaRootIds : ofertaRootIds}
        />
      )}

      {/* ── Contenido ───────────────────────────────────────────────────── */}
      <div className="px-4 lg:px-6 py-4 max-w-3xl">

        {/* Encabezado sección */}
        {activeTab === 'demandas' && sortedDemandas.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-base text-slate-800 dark:text-slate-100">
              {filterCategory ? allCategories.find(c => c.id === filterCategory)?.name : 'Activas'}
            </h3>
            <div className="flex items-center gap-2">
              <div className="lg:hidden">
                <CustomSelect value={sortBy} onChange={setSortBy} size="sm"
                  options={[{ value: 'recientes', label: 'Recientes' }, { value: 'respuestas', label: 'Más resp.' }]} />
              </div>
              {loadingDemandas
                ? <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                : <span className="text-xs text-slate-400 font-medium">{sortedDemandas.length}</span>
              }
            </div>
          </div>
        )}

        {errorDemandas && activeTab === 'demandas' && (
          <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20 rounded-2xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <p className="text-sm text-rose-700 dark:text-rose-400 flex-1">{errorDemandas}</p>
            <button onClick={fetchDemandas} className="text-xs font-bold text-rose-600 dark:text-rose-400 underline">Reintentar</button>
          </div>
        )}

        {/* ── Grid demandas ── */}
        {activeTab === 'demandas' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {loadingDemandas
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="bg-white dark:bg-[#111827] rounded-2xl overflow-hidden animate-pulse">
                    <div className="h-40 bg-slate-200 dark:bg-white/8" />
                    <div className="p-4 space-y-2.5">
                      <div className="h-4 bg-slate-200 dark:bg-white/8 rounded-lg w-3/4" />
                      <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-lg" />
                      <div className="h-3 bg-slate-100 dark:bg-white/5 rounded-lg w-2/3" />
                    </div>
                  </div>
                ))
              : sortedDemandas.map((d, i) => {
                  const foto = d.fotos?.[0] || d.foto;
                  const catPath = getCategoryPath(d.categoryId, allCategories);
                  const catLabel = catPath.length > 0 ? catPath[catPath.length - 1].name
                    : (typeof d.categoryId === 'string' && d.categoryId ? d.categoryId : null);
                  return (
                    <div key={d.id}
                      onClick={() => { setSelectedDemanda(d); setCurrentScreen('detalle'); }}
                      className="bg-white dark:bg-[#111827] rounded-2xl p-4 flex gap-4 cursor-pointer hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/30 transition-all duration-200 active:scale-[0.99] animate-fade-up"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      {/* Foto cuadrada */}
                      <div className="w-[72px] h-[72px] rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/6 dark:to-white/10 shrink-0 overflow-hidden relative flex items-center justify-center self-start">
                        {foto
                          ? <img src={foto} alt={d.titulo} className="w-full h-full object-cover" />
                          : <Package className="w-7 h-7 text-slate-300 dark:text-white/20" />
                        }
                        {d.estado !== 'activa' && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-xl">
                            <span className="text-[9px] font-bold text-white uppercase tracking-wider">{d.estado}</span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        {/* Categoria + tiempo */}
                        <div className="flex items-center gap-2 mb-1">
                          {catLabel && (
                            <span className="text-[10px] font-bold tracking-widest uppercase text-emerald-500 dark:text-emerald-400 truncate">
                              {catLabel.split(/\s+(?:y|e|&)\s+/i)[0]}
                            </span>
                          )}
                          <span className="text-[10px] text-slate-300 dark:text-white/20">·</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{d.tiempoCreado}</span>
                        </div>

                        {/* Título */}
                        <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-1 mb-1">{d.titulo}</h3>

                        {/* Descripción */}
                        {d.descripcion && (
                          <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-1 mb-2.5">{d.descripcion}</p>
                        )}

                        {/* Footer: atributos destacados + respuestas + presupuesto */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {/* Atributos como pills pequeñas */}
                          {d.attributes && Object.entries(d.attributes).slice(0, 2).map(([k, v]) => (
                            <span key={k} className="text-[10px] bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-full font-medium">
                              {k}: {v}
                            </span>
                          ))}
                          {/* Respuestas — siempre visible */}
                          {(
                            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ml-auto ${
                              d.respuestas > 0
                                ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
                                : 'text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-white/6'
                            }`}>
                              <MessageSquare className="w-2.5 h-2.5" />{d.respuestas} {d.respuestas === 1 ? 'resp.' : 'resp.'}
                            </span>
                          )}
                          {/* Presupuesto */}
                          {d.presupuesto?.max && (
                            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/8 px-2 py-0.5 rounded-full ml-auto">
                              hasta ${Number(d.presupuesto.max).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
            }
          </div>
        )}

        {/* ── Grid ofertas ── */}
        {activeTab === 'ofertas' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredOfertas.map((o, i) => (
              <div key={o.id}
                className="bg-white dark:bg-[#111827] rounded-2xl overflow-hidden hover:shadow-md hover:shadow-black/6 dark:hover:shadow-black/30 transition-all duration-200 animate-fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="h-44 bg-gradient-to-br from-violet-50 to-purple-100 dark:from-violet-900/20 dark:to-purple-900/20 flex items-center justify-center text-5xl">
                  {o.foto}
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-snug line-clamp-2">{o.titulo}</h3>
                    {o.precio && (
                      <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 shrink-0">${o.precio.toLocaleString()}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mb-3 line-clamp-2">{o.descripcion}</p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <div className="w-5 h-5 bg-slate-100 dark:bg-white/8 rounded-full flex items-center justify-center">
                        <Store className="w-3 h-3" />
                      </div>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{o.tienda}</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{o.distancia}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openChat({ id: o.id, tienda: o.tienda, foto: tiendas.find(t => t.id === o.tiendaId)?.foto || '🏪', mensaje: `Te consultan por: ${o.titulo}. Tenemos stock disponible!` })}
                    className="w-full py-2.5 bg-slate-900 dark:bg-emerald-500 text-white rounded-xl font-semibold text-xs hover:bg-slate-700 dark:hover:bg-emerald-400 transition-colors"
                  >
                    Consultar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>

      {/* ── Empty states — fuera del max-w-3xl para centrar en todo el ancho ── */}
      {!loadingDemandas && activeTab === 'demandas' && sortedDemandas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8">
          <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-5">
            <Package className="w-12 h-12 text-emerald-400" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">
            {searchQuery ? 'Sin resultados' : 'Sin demandas aún'}
          </h3>
          <p className="text-sm text-slate-400 max-w-xs mb-8">
            {searchQuery ? 'Probá con otras palabras clave' : 'Publicá lo que necesitás y las tiendas locales te van a responder'}
          </p>
          {!searchQuery && (
            <button onClick={() => { setEditingDemanda(null); setCurrentScreen('crear'); }}
              className="px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold text-sm transition-colors shadow-lg shadow-emerald-500/25">
              Crear mi primera demanda
            </button>
          )}
        </div>
      )}

      {activeTab === 'ofertas' && filteredOfertas.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center px-8">
          <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mb-5">
            <Tag className="w-12 h-12 text-slate-300 dark:text-white/20" />
          </div>
          <h3 className="text-xl font-black text-slate-800 dark:text-white mb-2">Sin ofertas</h3>
          <p className="text-sm text-slate-400 max-w-xs">Todavía no hay ofertas disponibles en tu zona</p>
        </div>
      )}
    </div>
    );
  };

  // ─── Crear / Editar Demanda ───────────────────────────────────────────────
  const CrearDemandaScreen = () => {
    const editing = !!editingDemanda;
    const [titulo, setTitulo] = useState(editingDemanda?.titulo || '');
    const [descripcion, setDescripcion] = useState(editingDemanda?.descripcion || '');
    const [presupuestoMin, setPresupuestoMin] = useState(editingDemanda?.presupuesto?.min || '');
    const [presupuestoMax, setPresupuestoMax] = useState(editingDemanda?.presupuesto?.max || '');
    const [categoryId, setCategoryId] = useState(editingDemanda?.categoryId || null);
    const [attributes, setAttributes] = useState(editingDemanda?.attributes || {});
    // fotos: array de { file?: File, preview: string (dataURL o URL remota) }
    const initFotos = () => {
      const existing = editingDemanda?.fotos || (editingDemanda?.foto?.startsWith('http') ? [editingDemanda.foto] : []);
      return existing.map(url => ({ preview: url }));
    };
    const [fotos, setFotos] = useState(initFotos);
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef(null);

    const MAX_FOTOS = 5;

    const handleImageChange = (e) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;
      const remaining = MAX_FOTOS - fotos.length;
      const toAdd = files.slice(0, remaining);
      toAdd.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFotos(prev => prev.length < MAX_FOTOS ? [...prev, { file, preview: reader.result }] : prev);
        };
        reader.readAsDataURL(file);
      });
      e.target.value = '';
    };

    const removePhoto = (idx) => setFotos(prev => prev.filter((_, i) => i !== idx));

    const uploadFoto = async (foto) => {
      if (!foto.file) return foto.preview; // ya es URL remota
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(foto.file);
      });
      const up = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: foto.file.name, fileData: base64, contentType: foto.file.type }),
      });
      if (up.ok) return (await up.json()).url;
      return null;
    };

    const handleSubmit = async () => {
      if (!titulo.trim() || !categoryId) return;
      setSubmitting(true);
      setSubmitError(null);
      try {
        const fotosUrls = (await Promise.all(fotos.map(uploadFoto))).filter(Boolean);

        const payload = {
          titulo: titulo.trim(),
          descripcion: descripcion.trim(),
          fotos: fotosUrls,
          foto: fotosUrls[0] || null,  // backwards compat
          categoryId: categoryId || null,
          attributes: Object.keys(attributes).length > 0 ? attributes : null,
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
          {/* Fotos */}
          <div>
            <label className="block font-bold mb-3 text-sm">
              Fotos del producto
              <span className="font-normal text-slate-400 ml-1">({fotos.length}/{MAX_FOTOS})</span>
            </label>

            {/* Altura fija en el wrapper → todos los hijos h-full → altura siempre idéntica */}
            <div className="grid grid-cols-3 gap-2 h-28">
              {fotos.map((f, idx) => (
                <div key={idx} className="relative rounded-2xl overflow-hidden bg-slate-100 dark:bg-white/10 group h-full">
                  <img src={f.preview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  {idx === 0 && (
                    <span className="absolute bottom-1 left-1 text-[10px] bg-black/50 text-white px-1.5 py-0.5 rounded-md font-medium leading-none">Principal</span>
                  )}
                </div>
              ))}
              {fotos.length < MAX_FOTOS && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/20 flex flex-col items-center justify-center gap-1.5 hover:border-emerald-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-slate-400 hover:text-emerald-500
                    ${fotos.length === 0 ? 'col-span-3' : fotos.length === 1 ? 'col-span-2' : 'col-span-1'}`}
                >
                  <Camera className="w-6 h-6" />
                  <span className="text-[11px] font-medium">{fotos.length === 0 ? 'Subir fotos' : 'Agregar'}</span>
                  {fotos.length === 0 && <span className="text-xs text-slate-400 text-center px-2">Hasta {MAX_FOTOS} fotos · La primera será la principal</span>}
                </button>
              )}
            </div>

            <input ref={fileInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handleImageChange} />
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

          {/* Categoría */}
          <div>
            <label className="block font-bold mb-2 text-sm">Categoría <span className="text-rose-500">*</span></label>
            <CategoryPicker
              value={categoryId}
              onChange={id => { setCategoryId(id); setAttributes({}); }}
              onCreateCategory={createCategory}
              categories={allCategories}
              placeholder="¿En qué categoría entra lo que buscás?"
            />
          </div>

          {/* Atributos */}
          {(categoryId || Object.keys(attributes).length > 0) && (
            <div>
              <label className="block font-bold mb-2 text-sm">Detalles <span className="font-normal text-slate-400">(opcional)</span></label>
              <AttributesEditor
                categoryId={categoryId}
                value={attributes}
                onChange={setAttributes}
                categories={allCategories}
              />
            </div>
          )}

          {submitError && (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex gap-3">
              <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
              <p className="text-sm text-rose-700">{submitError}</p>
            </div>
          )}

          <button onClick={handleSubmit} disabled={!titulo.trim() || !categoryId || submitting}
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
        .then(data => setRespuestas(data))
        .catch(() => setRespuestas([]))
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
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {loadingResp ? 'Cargando...' : `${respuestas.length} ${respuestas.length === 1 ? 'respuesta' : 'respuestas'}`}
              </p>
            </div>
            {demanda?.estado === 'pausada' && (
              <span className="px-3 py-1.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-xl">PAUSADA</span>
            )}
          </div>
        </div>

        <div className="max-w-4xl mx-auto">
          {/* Header demanda */}
          <div className="bg-white border-b px-5 py-6">
            {/* Carrusel de fotos */}
            {(() => {
              const imgs = demanda?.fotos?.length ? demanda.fotos : demanda?.foto ? [demanda.foto] : [];
              if (!imgs.length) return null;
              return <PhotoCarousel photos={imgs} className="mb-5 rounded-3xl overflow-hidden" />;
            })()}
            <div className="mb-5">
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
              <h3 className="font-bold text-lg">Respuestas de tiendas</h3>
              {respuestas.length > 0 && (
                <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold">
                  {respuestas.length} {respuestas.length === 1 ? 'tienda' : 'tiendas'}
                </span>
              )}
            </div>

            {[...respuestas].sort((a, b) => {
              const order = { 'exacto-nuevo': 1, 'exacto-usado': 2, 'reacondicionado': 3, 'compatible': 4, 'similar': 5, 'imitacion': 6 };
              return (order[a.matchType] || 99) - (order[b.matchType] || 99);
            }).map(r => {
              // Campos normalizados — soporta tanto datos viejos (mock) como nuevos (reales)
              const nombreTienda = r.tiendaNombre || r.tienda || 'Tienda';
              const fotoTienda   = r.tiendaFoto   || r.foto   || null;
              const rating       = r.tiendaRating  || r.rating || null;
              const horario      = r.tiendaHorario || r.horario || null;
              const direccion    = r.tiendaDireccion ? `${r.tiendaDireccion}${r.tiendaCiudad ? ', ' + r.tiendaCiudad : ''}` : null;
              const distancia    = r.distancia || null;

              return (
              <div key={r.id} className="bg-white dark:bg-[#111827] rounded-2xl p-5 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/30 transition-all">
                {/* Header tienda */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/20 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                      {fotoTienda
                        ? <img src={fotoTienda} alt="" className="w-full h-full object-cover" />
                        : <Store className="w-5 h-5 text-violet-500" />
                      }
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white">{nombreTienda}</h4>
                      <div className="flex flex-wrap gap-2 text-xs text-slate-400 mt-0.5">
                        {distancia && <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3" />{distancia}</span>}
                        {rating && <span className="flex items-center gap-0.5"><Star className="w-3 h-3 text-amber-400 fill-amber-400" />{rating}</span>}
                        {horario && <span className="flex items-center gap-0.5 text-emerald-500 font-medium"><Clock className="w-3 h-3" />{horario}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {r.matchType && (() => {
                      const matchLabels = {
                        'exacto-nuevo':   { label: 'Exacto Nuevo',   color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                        'exacto-usado':   { label: 'Exacto Usado',   color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' },
                        'reacondicionado':{ label: 'Reacondicionado',color: 'bg-teal-500/10 text-teal-600 dark:text-teal-400' },
                        'compatible':     { label: 'Compatible',     color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
                        'similar':        { label: 'Similar',        color: 'bg-violet-500/10 text-violet-600 dark:text-violet-400' },
                        'imitacion':      { label: 'Imitación',      color: 'bg-slate-200/80 text-slate-500 dark:bg-white/8 dark:text-slate-400' },
                      };
                      const m = matchLabels[r.matchType];
                      return m ? (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${m.color}`}>{m.label}</span>
                      ) : null;
                    })()}
                    <span className="text-xs text-slate-400">{r.tiempoRespuesta || 'Reciente'}</span>
                  </div>
                </div>

                {/* Mensaje */}
                <p className="text-sm bg-slate-50 dark:bg-white/5 rounded-xl p-3.5 mb-3 leading-relaxed text-slate-700 dark:text-slate-300">{r.mensaje}</p>

                {/* Adjuntos — fotos y videos del producto */}
                {r.adjuntos?.length > 0 && (() => {
                  const [lightbox, setLightbox] = React.useState(null);
                  return (
                    <>
                      <div className={`grid gap-1.5 mb-4 ${r.adjuntos.length === 1 ? 'grid-cols-1' : r.adjuntos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
                        {r.adjuntos.map((a, ai) => (
                          <button
                            key={ai}
                            type="button"
                            onClick={() => setLightbox(ai)}
                            className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-white/8 group"
                          >
                            {a.type === 'video'
                              ? (
                                <>
                                  <video src={a.url} className="w-full h-full object-cover" muted playsInline />
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                                      <Play className="w-5 h-5 text-slate-800 ml-0.5" />
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <img src={a.url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                              )
                            }
                          </button>
                        ))}
                      </div>

                      {/* Lightbox */}
                      {lightbox !== null && (
                        <div
                          className="fixed inset-0 bg-black/90 z-[70] flex items-center justify-center p-4"
                          onClick={() => setLightbox(null)}
                        >
                          <button
                            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                            onClick={() => setLightbox(null)}
                          >
                            <X className="w-5 h-5" />
                          </button>
                          {r.adjuntos[lightbox]?.type === 'video'
                            ? <video src={r.adjuntos[lightbox].url} controls autoPlay className="max-w-full max-h-[85vh] rounded-xl" onClick={e => e.stopPropagation()} />
                            : <img src={r.adjuntos[lightbox].url} alt="" className="max-w-full max-h-[85vh] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
                          }
                          {r.adjuntos.length > 1 && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                              {r.adjuntos.map((_, ai) => (
                                <button key={ai} onClick={e => { e.stopPropagation(); setLightbox(ai); }}
                                  className={`w-2 h-2 rounded-full transition-all ${ai === lightbox ? 'bg-white w-5' : 'bg-white/40'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  );
                })()}

                {/* Precio */}
                {r.precio && (
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-100 dark:border-white/8">
                    <div>
                      <p className="text-xs text-slate-400 mb-0.5">Precio ofrecido</p>
                      <p className="text-2xl font-black text-slate-900 dark:text-white">${r.precio.toLocaleString()}</p>
                    </div>
                    {direccion && (
                      <div className="text-right">
                        <p className="text-xs text-slate-400 mb-0.5">Dirección</p>
                        <p className="text-xs font-medium text-slate-600 dark:text-slate-300 max-w-[160px] text-right leading-snug">{direccion}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Acciones */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => openChat({
                      id: r.id,
                      tienda: nombreTienda,
                      foto: fotoTienda || '🏪',
                      mensaje: `Hola! Vi tu demanda "${demanda?.titulo}". ${r.mensaje}`,
                      tiempoRespuesta: r.tiempoRespuesta,
                      chatKey: `${r.tiendaId || r.id}-${r.demandaId}`,
                    })}
                    className="py-2.5 bg-slate-900 dark:bg-emerald-500 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-slate-700 dark:hover:bg-emerald-400 transition-colors">
                    <MessageSquare className="w-4 h-4" /> Chatear
                  </button>
                  <button
                    onClick={() => window.open(`https://www.google.com/maps/search/${encodeURIComponent(direccion || nombreTienda)}`, '_blank')}
                    className="py-2.5 bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-200 rounded-xl font-semibold text-sm flex items-center justify-center gap-1.5 hover:bg-slate-200 dark:hover:bg-white/12 transition-colors">
                    <Navigation className="w-4 h-4" /> Navegar
                  </button>
                </div>
              </div>
              );
            })}

            {loadingResp && (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="bg-white dark:bg-[#111827] rounded-2xl p-5 animate-pulse">
                    <div className="flex gap-3 mb-4">
                      <div className="w-12 h-12 bg-slate-200 dark:bg-white/8 rounded-xl shrink-0" />
                      <div className="flex-1 space-y-2 pt-1">
                        <div className="h-4 bg-slate-200 dark:bg-white/8 rounded w-1/3" />
                        <div className="h-3 bg-slate-100 dark:bg-white/5 rounded w-1/4" />
                      </div>
                    </div>
                    <div className="h-16 bg-slate-100 dark:bg-white/5 rounded-xl mb-4" />
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="h-10 bg-slate-200 dark:bg-white/8 rounded-xl" />
                      <div className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {!loadingResp && respuestas.length === 0 && (
              <div className="text-center py-12 bg-white dark:bg-[#111827] rounded-2xl">
                <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-slate-300 dark:text-white/20" />
                </div>
                <p className="font-bold text-slate-700 dark:text-slate-300 mb-1">Sin respuestas aún</p>
                <p className="text-sm text-slate-400 max-w-xs mx-auto">Las tiendas locales están viendo tu demanda. Te avisaremos cuando alguien responda.</p>
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

    // Set de ids raíz presentes en tiendas
    const tiendaRootIds = new Set(
      tiendas.flatMap(t => t.categoryIds || [])
    );
    const filtered = tiendas.filter(t => {
      const q = query.toLowerCase();
      const matchesSearch = !q ||
        t.nombre.toLowerCase().includes(q) ||
        t.rubro.toLowerCase().includes(q);
      const matchesCategory = !filterCategory || (() => {
        if (!t.categoryIds?.length) return false;
        const descendants = getAllDescendants(filterCategory, allCategories);
        return t.categoryIds.some(id => id === filterCategory || descendants.includes(id));
      })();
      return matchesSearch && matchesCategory;
    });

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24">
        <div className="bg-white dark:bg-slate-900 border-b dark:border-white/10 sticky top-0 z-10">
          <div className="px-5 py-4">
            <div className="flex items-center gap-3 mb-4">
              <button onClick={() => setCurrentScreen('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl lg:hidden">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-bold">Tiendas</h1>
                <p className="text-xs text-slate-500 dark:text-slate-400">{filtered.length} locales cercanos</p>
              </div>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Buscar tiendas o rubros..."
                className="w-full pl-12 pr-4 py-3 bg-slate-100 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 rounded-2xl border border-transparent focus:outline-none focus:border-emerald-400 dark:focus:border-emerald-500 text-sm transition-colors" />
            </div>
          </div>
          <CategoryFilterBar filterCategory={filterCategory} setFilterCategory={setFilterCategory} categories={allCategories} presentIds={tiendaRootIds} />
        </div>

        <div className="max-w-4xl mx-auto px-5 py-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(t => (
            <div key={t.id} onClick={() => { setSelectedTienda(t); setCurrentScreen('tienda-detail'); }}
              className="bg-white dark:bg-[#111827] rounded-2xl p-5 hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/30 cursor-pointer transition-all">
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
  const BottomNav = () => {
    const navItems = [
      { icon: Package, label: 'Demandas', action: () => { setCurrentScreen('home'); setActiveTab('demandas'); }, active: currentScreen === 'home' && activeTab === 'demandas' },
      { icon: Tag,     label: 'Ofertas',  action: () => { setCurrentScreen('home'); setActiveTab('ofertas');  }, active: currentScreen === 'home' && activeTab === 'ofertas'  },
      { icon: Store,   label: 'Tiendas',  action: () => setCurrentScreen('tiendas'), active: currentScreen === 'tiendas' || currentScreen === 'tienda-detail' },
    ];
    return (
      <div className="lg:hidden fixed bottom-0 left-0 right-0 max-w-md mx-auto z-20">
        {/* Blur backdrop */}
        <div className="bg-white/80 dark:bg-[#111827]/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/8 px-2 pt-2 pb-safe">
          <div className="flex items-center">
            {/* Left items */}
            {navItems.slice(0, 2).map(item => (
              <button key={item.label} onClick={item.action}
                className="flex-1 flex flex-col items-center gap-1 py-1.5 transition-all">
                <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                  item.active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : ''
                }`}>
                  <item.icon className={`w-4.5 h-4.5 transition-colors ${item.active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${item.active ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {item.label}
                </span>
              </button>
            ))}

            {/* Centro — FAB crear */}
            <div className="flex flex-col items-center px-4">
              <button onClick={() => { setEditingDemanda(null); setCurrentScreen('crear'); }}
                className="-mt-7 w-14 h-14 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-2xl flex items-center justify-center shadow-xl shadow-emerald-500/40 active:scale-95 transition-transform border-[3px] border-white dark:border-[#111827]">
                <Camera className="w-6 h-6 text-white" />
              </button>
              <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1">Crear</span>
            </div>

            {/* Right item */}
            {navItems.slice(2).map(item => (
              <button key={item.label} onClick={item.action}
                className="flex-1 flex flex-col items-center gap-1 py-1.5 transition-all">
                <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                  item.active ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : ''
                }`}>
                  <item.icon className={`w-4.5 h-4.5 transition-colors ${item.active ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <span className={`text-[10px] font-semibold transition-colors ${item.active ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                  {item.label}
                </span>
              </button>
            ))}
            {/* Historial */}
            <button onClick={() => setCurrentScreen('historial')}
              className="flex-1 flex flex-col items-center gap-1 py-1.5">
              <div className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${
                currentScreen === 'historial' ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' : ''
              }`}>
                <History className={`w-4.5 h-4.5 transition-colors ${currentScreen === 'historial' ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
              </div>
              <span className={`text-[10px] font-semibold transition-colors ${currentScreen === 'historial' ? 'text-emerald-500' : 'text-slate-400 dark:text-slate-500'}`}>
                Historial
              </span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  const showBottomNav = !['crear'].includes(currentScreen);

  return (
    <div className="flex bg-[#f7f8fa] dark:bg-[#0a0d16] h-screen overflow-hidden">
      <DesktopSidebar />

      <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden bg-[#f7f8fa] dark:bg-[#0a0d16] relative">
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
