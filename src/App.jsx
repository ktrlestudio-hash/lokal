import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Camera, MapPin, Search, Store, Package, MessageSquare, MessageCircle, Bell, User, Menu,
  ChevronRight, ChevronLeft, Clock, Navigation, LocateFixed, X, AlertCircle, ArrowLeft, Send,
  Tag, Loader2, Check, CheckCircle, Pause, Edit3, Trash2, RotateCcw,
  Star, ChevronDown, ChevronUp, Filter, History, TrendingUp, Sun, Moon, LogOut, Play,
  Flame, Home, Zap, Plus, ToggleLeft, ToggleRight, ImagePlus, CreditCard, Gift,
  Phone, ExternalLink, ArrowUpDown, Heart, Pin, LayoutGrid, LayoutList, ShieldCheck, Paperclip, PanelLeft, List,
  Globe, Share2, Truck
} from 'lucide-react';
import CategoryPicker from './CategoryPicker';
import AdminDashboard from './AdminDashboard';
import AttributesEditor from './AttributesEditor';
import CategoryIcon from './CategoryIcon';
import { CATEGORIES, getCategoryPath, getAllDescendants } from './categories';
import { StoreMap, TiendasMap, LocationPreviewMap } from './LeafletMap';
import { apiFetch } from './api';
import { LogoSymbol, LogoBadge, LogoFull, KtrlMark } from './Brand';
import { MOCK_TIENDAS, MOCK_OFERTAS, getMockRespuestas } from './data/mockData';
import LoginBottomSheet from './components/LoginBottomSheet';
import HomeScreen from './screens/HomeScreen';
import TiendasScreen from './screens/TiendasScreen';
import CategoriasScreen from './screens/CategoriasScreen';
import MisDemandas from './screens/MisDemandas';
import HistorialScreen from './screens/HistorialScreen';
import MisCosasScreen from './screens/MisCosasScreen';
import ChatsScreen from './screens/ChatsScreen';
import CrearDemandaScreen from './screens/CrearDemandaScreen';
import DetalleDemandaScreen from './screens/DetalleDemandaScreen';
import TiendaDetailScreen from './screens/TiendaDetailScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import TodasOfertasScreen from './screens/TodasOfertasScreen';
import MapaScreen from './screens/MapaScreen';
import VenderProductoScreen from './screens/VenderProductoScreen';
import MisProductosScreen from './screens/MisProductosScreen';
import { DAY_NAMES, isStoreOpen, getNextOpen, tiempoRelativo } from './utils/helpers';

const API_BASE = '/.netlify/functions';
const UserApp = ({
  firebaseUser, onLogout, isDark, toggleTheme,
  onRegisterStore, isAdmin, onOpenDashboard, /* hasTienda = false, */ setDemoMode, demoMode,
  featureModules, onUpgradeRole, userProfile, setRoleSim, initialScreen,
}) => {
  // featureModules: array { id, enabled } desde site-config, o null = todo habilitado
  const isModuleEnabled = React.useCallback((id) => {
    if (!featureModules) return true;
    const m = featureModules.find(m => m.id === id);
    return m ? m.enabled : true;
  }, [featureModules]);

  // ─── hasTienda DEPRECADO: ahora se deriva de userRole ────────────────────
  // const hasTienda = userRole === 'empresa'; // derivado, no prop
  // ─── Navegación ──────────────────────────────────────────────────────────
  // ─── URL ↔ navStack sync ──────────────────────────────────────────────────
  const SCREEN_TO_PATH = {
    'home': '/', 'mapa': '/mapa', 'tiendas': '/tiendas',
    'todas-ofertas': '/ofertas', 'mis-demandas': '/mis-demandas',
    'crear': '/crear', 'historial': '/historial', 'admin': '/admin',
    'vender-producto': '/vender', 'suscripcion': '/suscripcion',
    'detalle': '/demanda', 'product-detail': '/producto', 'tienda-detail': '/tienda',
    'mis-cosas': '/mis-cosas', 'chats': '/chats', 'categorias': '/categorias',
    'mis-productos': '/mis-productos',
  };
  const PATH_TO_SCREEN = Object.fromEntries(Object.entries(SCREEN_TO_PATH).map(([k,v]) => [v, k]));

  const screenFromPath = () => {
    const path = window.location.pathname;
    return PATH_TO_SCREEN[path] || PATH_TO_SCREEN[path.replace(/\/$/, '')] || 'home';
  };

  const pushUrl = (screen) => {
    const path = SCREEN_TO_PATH[screen] || `/${screen}`;
    if (window.location.pathname !== path) window.history.pushState({ screen }, '', path);
  };
  const replaceUrl = (screen) => {
    const path = SCREEN_TO_PATH[screen] || `/${screen}`;
    window.history.replaceState({ screen }, '', path);
  };

  // Siempre arranca en home, sin importar la URL actual
  // initialScreen permite sobrescribir desde el padre (ej: abrir admin desde StoreApp)
  const [navStack, setNavStack] = useState(() => {
    if (initialScreen) return [initialScreen];
    const goto = sessionStorage.getItem('lokal-goto');
    if (goto) { sessionStorage.removeItem('lokal-goto'); return [goto]; }
    return ['home'];
  });
  const currentScreen = navStack[navStack.length - 1];

  const closeOverlaysRef = useRef(null);

  const navigate        = (screen) => { closeOverlaysRef.current?.(); pushUrl(screen);    setNavStack(prev => [...prev, screen]); };
  const navigateReplace = (screen) => { closeOverlaysRef.current?.(); replaceUrl(screen); setNavStack(prev => [...prev.slice(0, -1), screen]); };
  const navigateSearch  = (q) => { setSearchResultsQuery(q); navigate('todas-ofertas'); };
  const navRoot         = (screen) => { closeOverlaysRef.current?.(); replaceUrl(screen); setNavStack([screen]); };
  const goBack          = () => {
    setNavStack(prev => {
      const next = prev.length > 1 ? prev.slice(0, -1) : ['home'];
      replaceUrl(next[next.length - 1]);
      return next;
    });
  };

  // Sincronizar URL inicial
  useEffect(() => { replaceUrl(navStack[0]); }, []);

  // ─── Selecciones ──────────────────────────────────────────────────────────
  const [selectedDemanda, setSelectedDemanda] = useState(null);
  const [selectedTienda,  setSelectedTienda]  = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [editingDemanda,  setEditingDemanda]  = useState(null);

  // ─── Modales / overlays ───────────────────────────────────────────────────
  const [showNotifications,  setShowNotifications]  = useState(false);
  const [notifClosing,       setNotifClosing]       = useState(false);
  const [notifAnchor,        setNotifAnchor]        = useState({ top: 60, right: 16 });
  const notifBtnRef = useRef(null);
  const [showProfile,        setShowProfile]        = useState(false);
  const [showProfileDropdown,setShowProfileDropdown]= useState(false);
  const [profileDropdownClosing, setProfileDropdownClosing] = useState(false);
  const [showChat,           setShowChat]           = useState(null);
  const [chatCollapsed,      setChatCollapsed]      = useState(false);
  const [showConfirm,        setShowConfirm]        = useState(null);
  const [showMobileMenu,     setShowMobileMenu]     = useState(false);
  const [mobileMenuClosing,  setMobileMenuClosing]  = useState(false);
  closeOverlaysRef.current = () => {
    setShowProfile(false);
    setShowMobileMenu(false);
    setMobileMenuClosing(false);
    setShowNotifications(false);
  };
  const [nudgeModal,         setNudgeModal]         = useState(null);
  const [createSheetOpen,    setCreateSheetOpen]    = useState(false);
  const [createSheetClosing, setCreateSheetClosing] = useState(false);
  const [sidebarExpanded,    setSidebarExpanded]    = useState(false);
  const [sidebarPinned,      setSidebarPinned]      = useState(() => localStorage.getItem('lokal-sidebar-pinned') === 'true');

  // ─── Guest mode: Login Bottom Sheet ────────────────────────────────────────
  const [loginSheet, setLoginSheet] = useState({ open: false, context: 'default' });
  const openLoginSheet = (context = 'default') => setLoginSheet({ open: true, context });
  const closeLoginSheet = () => setLoginSheet({ open: false, context: 'default' });
  const requireAuth = (action, context = 'default') => {
    if (firebaseUser) { action(); return; }
    openLoginSheet(context);
  };
  const isGuest = !firebaseUser;

  // ─── Admin ────────────────────────────────────────────────────────────────
  const [suspended, setSuspended] = useState({ stores: new Set(), users: new Set(), products: new Set() });

  const handleAdminAction = async (accion, tipo, id, motivo = '') => {
    const token = await firebaseUser?.getIdToken();
    if (!token) return;
    try {
      const res = await fetch('/.netlify/functions/admin-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ accion, tipo, id, motivo }),
      });
      if (res.ok) {
        // Refrescar datos
        if (tipo === 'store' || tipo === 'tienda') fetchTiendas();
        else if (tipo === 'product' || tipo === 'producto') fetchOfertas();
        else if (tipo === 'demand' || tipo === 'demanda') fetchDemandas();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Error: ' + (err.error || 'No se pudo realizar la acción'));
      }
    } catch (err) {
      alert('Error: ' + err.message);
    }
  };

  const handleAdminSuspend  = (type, id) => handleAdminAction('suspender', type, id);
  const handleAdminRestore  = (type, id) => handleAdminAction('activar', type, id);
  const handleAdminDelete   = (type, id) => handleAdminAction('eliminar', type, id);

  // ─── Búsqueda y filtros ───────────────────────────────────────────────────
  const [searchQuery,       setSearchQuery]       = useState('');
  const [searchResultsQuery,setSearchResultsQuery]= useState('');
  const [sortBy,            setSortBy]            = useState('recientes');
  const [filterCategory,    setFilterCategory]    = useState(null);
  const [homeActiveCat,     setHomeActiveCat]     = useState(null);
  const [ofertasStoreFilter,setOfertasStoreFilter]= useState(null);
  const [mapaFocusStore,    setMapaFocusStore]    = useState(null);
  const [mapaFocusProduct,  setMapaFocusProduct]  = useState(null);
  const [mapaAutoRoute,     setMapaAutoRoute]     = useState(false);

  // ─── Búsqueda global (desktop) ───────────────────────────────────────────
  const [gQuery,     setGQuery]     = useState('');
  const [gOpen,      setGOpen]      = useState(false);
  const [gAnchorRect,setGAnchorRect]= useState(null);

  // ─── Chat ─────────────────────────────────────────────────────────────────
  const [chatHistories,    setChatHistories]    = useState({});
  const [chatMessage,      setChatMessage]      = useState('');
  const [chatConversations,setChatConversations]= useState({});

  // ─── Notificaciones ───────────────────────────────────────────────────────
  const [notifList, setNotifList] = useState([]);

  // ─── Datos ────────────────────────────────────────────────────────────────
  const [allCategories, setAllCategories] = useState(CATEGORIES);
  const [allDemandas,   setAllDemandas]   = useState([]);
  const [loadingDemandas,setLoadingDemandas]= useState(true);
  const [errorDemandas, setErrorDemandas] = useState(null);
  const [allOfertas,    setAllOfertas]    = useState(MOCK_OFERTAS);
  const [loadingOfertas,setLoadingOfertas]= useState(true);
  const [userRole,      setUserRole]      = useState('usuario');
  const [toastMsg,      setToastMsg]      = useState(null);

  // ─── Refs ─────────────────────────────────────────────────────────────────
  const mainScrollRef      = useRef(null);
  const profileDropdownRef = useRef(null);
  const chatEndRef         = useRef(null);

  // ─── Helpers derivados ────────────────────────────────────────────────────
  const visibleOfertas     = allOfertas;
  const notifAnimClose = () => setNotifClosing(true);
  const openNotifications  = (btnEl) => {
    if (isGuest) { openLoginSheet('default'); return; }
    if (showNotifications) { notifAnimClose(); return; }
    setShowProfileDropdown(false);
    setProfileDropdownClosing(false);
    setShowProfile(false);
    const el = (btnEl instanceof Element ? btnEl : null) || notifBtnRef.current;
    if (el) {
      const r = el.getBoundingClientRect();
      setNotifAnchor({ top: r.bottom + 8, right: window.innerWidth - r.right });
    }
    setNotifClosing(false);
    setShowNotifications(true);
  };
  const profileDropdownAnimClose = () => setProfileDropdownClosing(true);
  const toggleProfileMenu = () => {
    if (showProfileDropdown) { profileDropdownAnimClose(); return; }
    setShowNotifications(false);
    setProfileDropdownClosing(false);
    setShowProfileDropdown(true);
  };
  const showToast          = (msg, type = 'info') => { setToastMsg({ msg, type }); setTimeout(() => setToastMsg(null), 3000); };

  // Cargar categorías custom + demandas + ofertas al montar
  const createCategory = async (name, parentId = null) => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId }),
    });
    const cat = await res.json();
    setAllCategories(prev => prev.find(c => c.id === cat.id) ? prev : [...prev, cat]);
    return cat;
  };

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(custom => { if (custom.length > 0) setAllCategories([...CATEGORIES, ...custom]); })
      .catch(() => {});
    fetchDemandas();
    // fetchOfertas y fetchTiendas se llaman desde el useEffect de demoMode
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (showChat) chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistories, showChat]);

  // Re-fetch cuando cambia demoMode
  useEffect(() => {
    fetchOfertas();
    fetchTiendas();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demoMode]);

  useEffect(() => {
    const handler = (e) => {
      if (!e.target.closest('[data-gsearch]') && !e.target.closest('[data-gdropdown]')) setGOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cargar notificaciones reales cuando el usuario está autenticado
  useEffect(() => {
    if (!firebaseUser) { setNotifList([]); return; }
    apiFetch(`${API_BASE}/notifications`, { authRequired: true })
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data)) setNotifList(data); })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firebaseUser?.uid]);

  // Sincronizar userRole con el perfil que viene de Root
  useEffect(() => {
    if (userProfile?.role) {
      setUserRole(userProfile.role);
    } else if (firebaseUser?.uid) {
      // Fallback: leer de localStorage
      try {
        const raw = localStorage.getItem(`lokal-user-profile:${firebaseUser.uid}`);
        const parsed = raw ? JSON.parse(raw) : null;
        if (parsed?.role) setUserRole(parsed.role);
      } catch { /* ignore */ }
    }
  }, [userProfile, firebaseUser]);

  // ─── hasTienda DEPRECADO: ahora se deriva de userRole ────────────────────
  // Tiendas existentes se detectan por userRole === 'empresa'
  // const hasTienda = userRole === 'empresa';

  // Ocultar scrollbar nativa cuando el menú mobile está abierto
  useEffect(() => {
    document.body.style.overflow = showMobileMenu ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [showMobileMenu]);

  // ─── Back button (Android / PWA) ─────────────────────────────────────────
  // Mantiene una entrada en history por cada "capa" abierta.
  // Cuando el usuario aprieta atrás, popstate la consume y cerramos la capa.
  useEffect(() => {
    const hasLayer =
      showMobileMenu || showNotifications || showProfile ||
      (showChat && !chatCollapsed) || showConfirm || createSheetOpen || !!nudgeModal ||
      navStack.length > 1;

    if (hasLayer) {
      window.history.pushState({ lokal: true }, '');
    }
  }, [
    showMobileMenu, showNotifications, showProfile,
    showChat, showConfirm, createSheetOpen, nudgeModal,
    navStack.length,
  ]);

  useEffect(() => {
    const onPop = () => {
      // Cerrar en orden de prioridad: modales primero, navegación al final
      if (showConfirm)       { setShowConfirm(null);             return; }
      if (nudgeModal)        { setNudgeModal(null);              return; }
      if (createSheetOpen)   { setCreateSheetOpen(false);        return; }
      if (showChat && !chatCollapsed) { setChatCollapsed(true);   return; }
      if (showChat && chatCollapsed) { setShowChat(null); setChatCollapsed(false); return; }
      if (showProfile)       { setShowProfile(false);            return; }
      if (showNotifications) { setShowNotifications(false);      return; }
      if (showMobileMenu)    { setShowMobileMenu(false); setMobileMenuClosing(false); return; }
      if (navStack.length > 1) { goBack(); return; }
      // Si no hay nada que cerrar dejamos que el browser maneje (sale de la PWA)
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [
    showConfirm, nudgeModal, createSheetOpen, showChat, chatCollapsed,
    showProfile, showNotifications, showMobileMenu, navStack,
  ]);

  // ─── API ──────────────────────────────────────────────────────────────────
  const fetchDemandas = async () => {
    setLoadingDemandas(true);
    setErrorDemandas(null);
    try {
      const res = await apiFetch(`${API_BASE}/demandas?mine=1`, { authRequired: true });
      if (!res.ok) throw new Error('Error al cargar');
      setAllDemandas(await res.json());
    } catch (err) {
      setErrorDemandas(err.message);
    } finally {
      setLoadingDemandas(false);
    }
  };

  const fetchOfertas = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/ofertas?activa=true`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (demoMode) {
            setAllOfertas([...MOCK_OFERTAS, ...data.filter(o => !MOCK_OFERTAS.some(m => m.id === o.id))]);
          } else {
            setAllOfertas(data); // vacío si no hay reales
          }
        }
      }
    } catch { /* silencioso */ } finally {
      setLoadingOfertas(false);
    }
  };

  const fetchTiendas = async () => {
    try {
      const res = await apiFetch(`${API_BASE}/tiendas-crud`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (demoMode) {
            setAllTiendas([...MOCK_TIENDAS, ...data.filter(t => !MOCK_TIENDAS.some(m => m.id === t.id))]);
          } else {
            setAllTiendas(data); // vacío si no hay reales
          }
        }
      }
    } catch { /* silencioso */ }
  };

  const updateDemandaEstado = async (id, estado) => {
    // Optimista
    setAllDemandas(prev => prev.map(d => d.id === id ? { ...d, estado } : d));
    if (selectedDemanda?.id === id) setSelectedDemanda(d => ({ ...d, estado }));
    try {
      await apiFetch(`${API_BASE}/demandas`, {
        method: 'PATCH',
        authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado }),
      });
    } catch { /* silencioso: ya actualizado localmente */ }
  };

  const deleteDemanda = async (id) => {
    setAllDemandas(prev => prev.filter(d => d.id !== id));
    navRoot('home');
    try {
      await apiFetch(`${API_BASE}/demandas?id=${id}`, { method: 'DELETE', authRequired: true });
    } catch { /* silencioso */ }
  };

  // ─── Chat ─────────────────────────────────────────────────────────────────
  const [chatProductPicker, setChatProductPicker] = useState(false);
  const [chatPendingAttach, setChatPendingAttach] = useState(null); // product to attach

  const openChat = (tienda, contextProduct = null) => {
    const key = `${tienda.tienda}-${tienda.id}`;
    setShowChat({ ...tienda, chatKey: key, contextProduct });
    setChatCollapsed(false);
    setChatProductPicker(false);
    setChatPendingAttach(null);
    // Register/update conversation metadata and clear unread
    const ctx = contextProduct
      ? { type: 'product', label: contextProduct.titulo, productId: contextProduct.id, imagen: contextProduct.imagenes?.[0] || contextProduct.foto || null }
      : { type: 'store', label: tienda.tienda };
    setChatConversations(prev => ({
      ...prev,
      [key]: { ...(prev[key] || {}), id: tienda.id, tienda: tienda.tienda, foto: tienda.foto, telefono: tienda.telefono, unread: 0, direction: 'sent', context: prev[key]?.context || ctx, status: prev[key]?.status === 'closed' ? 'closed' : 'read' },
    }));
  };

  const sendChatMessage = async (attachProduct = null) => {
    const hasText = chatMessage.trim();
    const attach = attachProduct || chatPendingAttach;
    if (!hasText && !attach) return;
    if (!showChat || !firebaseUser) return;
    const text = hasText || '';
    const key = showChat.chatKey;
    const optimistic = {
      id: `opt-${Date.now()}`,
      from: 'user',
      text,
      time: 'Ahora',
      ...(attach ? { attachment: { type: 'product', id: attach.id, titulo: attach.titulo, precio: attach.precio, imagen: attach.imagenes?.[0] || attach.foto || null } } : {}),
    };
    setChatHistories(prev => ({ ...prev, [key]: [...(prev[key] || []), optimistic] }));
    setChatMessage('');
    setChatPendingAttach(null);
    setChatConversations(prev => ({
      ...prev,
      [key]: { ...(prev[key] || { id: showChat.id, tienda: showChat.tienda, foto: showChat.foto, telefono: showChat.telefono }), lastMsg: attach ? `📦 ${attach.titulo}` : text, lastTime: new Date().toISOString(), unread: 0 },
    }));
    try {
      await apiFetch(`${API_BASE}/messages`, {
        method: 'POST',
        authRequired: true,
        body: JSON.stringify({ tiendaId: showChat.id, text, attachment: optimistic.attachment || null }),
      });
    } catch { /* silencioso — el poll lo corrige */ }
  };

  // ─── Notificaciones ───────────────────────────────────────────────────────
  const markNotifRead = (id) => {
    setNotifList(prev => prev.map(n => n.id === id ? { ...n, leido: true } : n));
    if (firebaseUser) {
      apiFetch(`${API_BASE}/notifications`, {
        method: 'PATCH', authRequired: true,
        body: JSON.stringify({ ids: [id] }),
      }).catch(() => {});
    }
  };

  const markAllRead = () => {
    setNotifList(prev => prev.map(n => ({ ...n, leido: true })));
    if (firebaseUser) {
      apiFetch(`${API_BASE}/notifications`, {
        method: 'PATCH', authRequired: true,
        body: JSON.stringify({ all: true }),
      }).catch(() => {});
    }
  };

  const addNotif = (mensaje, tipo = 'sistema', demandaId = null) => {
    setNotifList(prev => [{
      id: Date.now(), tipo, mensaje, tiempo: new Date().toISOString(), leido: false, demandaId,
    }, ...prev]);
  };

  const [allTiendas, setAllTiendas] = useState([]);
  const tiendas = allTiendas;
  const canPostNewProduct = userRole !== 'usuario';

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
    visibleOfertas.map(o => getRootCategoryId(o.categoryId)).filter(Boolean)
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

  const filteredOfertas = visibleOfertas.filter(o => {
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

  // ─── Mobile Nav Overlay (full-screen "Más") ──────────────────────────────
  const closeMobileMenu = () => { setMobileMenuClosing(true); };
  const onMobileMenuAnimEnd = () => {
    if (mobileMenuClosing) { setMobileMenuClosing(false); setShowMobileMenu(false); }
  };
  const menuNav = (screen) => {
    setShowMobileMenu(false);
    setMobileMenuClosing(false);
    navRoot(screen);
  };

  const MobileMenu = () => {
    const firstName = firebaseUser?.displayName?.split(' ')[0] || null;
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches';

    const menuItem = (Icon, label, onClick, badge) => (
      <button
        key={label}
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/6 active:bg-slate-100 dark:active:bg-white/8 transition-colors text-left">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0 relative">
          <Icon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
          {badge > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center">{badge > 9 ? '9+' : badge}</span>}
        </div>
        <span className="font-semibold text-[15px] text-slate-700 dark:text-slate-200">{label}</span>
        <ChevronRight className="w-4 h-4 text-slate-300 dark:text-white/20 ml-auto" />
      </button>
    );

    return (
      <div
        className={`lg:hidden fixed inset-0 z-[4000] flex flex-col bg-[#f7f8fa] dark:bg-[#0a0d16] ${mobileMenuClosing ? 'animate-overlay-out pointer-events-none' : 'animate-overlay-in'}`}
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
        onAnimationEnd={onMobileMenuAnimEnd}
      >
        {/* Header con logo completo + X */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-slate-200/60 dark:border-white/8 shrink-0">
          <LogoFull size={26} className="text-slate-900 dark:text-white" />
          <button
            onClick={closeMobileMenu}
            className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </button>
        </div>

        {/* Perfil / Guest CTA */}
        <div className="px-5 py-5 border-b border-slate-200/60 dark:border-white/8 shrink-0">
          {isGuest ? (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 flex items-center justify-center shrink-0">
                <User className="w-7 h-7 text-brand" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-black text-lg truncate">¡Hola! 👋</p>
                <p className="text-sm text-slate-400 truncate">Entrá para guardar, pedir y chatear</p>
              </div>
              <button
                onClick={() => { setShowMobileMenu(false); openLoginSheet('default'); }}
                className="shrink-0 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold px-4 py-2 rounded-xl text-sm"
              >
                Entrar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl overflow-hidden ring-2 ring-brand/30 shrink-0">
                {firebaseUser?.photoURL
                  ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-brand flex items-center justify-center font-bold text-white text-xl">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</div>
                }
              </div>
              <div className="min-w-0">
                <p className="font-black text-lg truncate">{firebaseUser?.displayName || 'Usuario'}</p>
                <p className="text-sm text-slate-400 truncate">{greeting}{firstName ? `, ${firstName}` : ''} 👋</p>
              </div>
            </div>
          )}
        </div>

        {/* Nav items — scrollable */}
        <div className="flex-1 overflow-y-auto px-3 py-3" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)' }}>
          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 pb-1 pt-2">Explorar</p>
          {menuItem(Home,       'Inicio',         () => menuNav('home'))}
          {menuItem(Flame,      'Ofertas',         () => menuNav('todas-ofertas'))}
          {menuItem(Store,      'Tiendas',         () => menuNav('tiendas'))}
          {menuItem(MapPin,     'Mapa',            () => menuNav('mapa'))}
          {menuItem(TrendingUp, 'Oportunidades',   () => menuNav('oportunidades'))}

          {!isGuest && (
            <>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 pb-1 pt-4">Mi cuenta</p>
              {menuItem(User,           'Yo / Mis cosas',  () => menuNav('mis-cosas'))}
              {menuItem(MessageSquare,  'Mensajes',        () => menuNav('chats'), Object.values(chatConversations).reduce((s, c) => s + (c.unread || 0), 0) || null)}
              {menuItem(Package,        'Mis demandas',    () => menuNav('mis-demandas'))}
              {menuItem(Tag,            'Mis productos',   () => menuNav('mis-productos'))}
              {menuItem(History,        'Historial',       () => menuNav('historial'))}
            </>
          )}

          {onOpenDashboard && (
            <>
              <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 pb-1 pt-4">Mi tienda</p>
              {menuItem(Store, 'Panel de mi tienda', () => { setShowMobileMenu(false); onOpenDashboard(); })}
            </>
          )}

          <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-4 pb-1 pt-4">Configuración</p>
          {!isGuest && menuItem(Bell, 'Notificaciones', () => { setShowMobileMenu(false); openNotifications(); }, unreadCount)}
          <button
            onClick={toggleTheme}
            className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-slate-100 dark:hover:bg-white/6 transition-colors text-left">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0">
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
            </div>
            <span className="font-semibold text-[15px] text-slate-700 dark:text-slate-200">
              {isDark ? 'Modo claro' : 'Modo oscuro'}
            </span>
          </button>
          {isAdmin && menuItem(ShieldCheck, 'Panel Admin', () => menuNav('admin'))}

          {!isGuest && (
            <div className="px-1 pt-4">
              <button
                onClick={() => { setShowMobileMenu(false); setTimeout(onLogout, 100); }}
                className="w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors text-left group">
                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/8 group-hover:bg-rose-100 dark:group-hover:bg-rose-500/15 flex items-center justify-center shrink-0 transition-colors">
                  <LogOut className="w-5 h-5 text-slate-500 group-hover:text-rose-500 transition-colors" />
                </div>
                <span className="font-semibold text-[15px] text-slate-500 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">Cerrar sesión</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Confirm Modal ────────────────────────────────────────────────────────
  const ConfirmModal = ({ title, msg, onOk, onCancel }) => (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <h3 className="font-bold text-lg mb-2">{title}</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">{msg}</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={onCancel} className="py-3 bg-slate-100 rounded-2xl font-semibold">Cancelar</button>
          <button onClick={onOk} className="py-3 bg-slate-900 dark:bg-primary text-white rounded-2xl font-semibold">Confirmar</button>
        </div>
      </div>
    </div>
  );

  // ─── Sidebar Desktop ──────────────────────────────────────────────────────
  const DesktopSidebar = () => {
    const expanded = sidebarExpanded;
    const setExpanded = setSidebarExpanded;
    const sidebarRef = React.useRef(null);
    const isHome = currentScreen === 'home';
    const [tooltip, setTooltip] = React.useState(null); // { label, y, icon: Icon }

    const navItems = [
      { label: 'Inicio',        icon: Home,         screen: 'home'          },
      { divider: true, key: 'explorar', sectionLabel: 'Explorar' },
      ...(isModuleEnabled('ofertas')       ? [{ label: 'Ofertas',       icon: Flame,         screen: 'todas-ofertas' }] : []),
      { label: 'Tiendas',       icon: Store,         screen: 'tiendas'       },
      ...(isModuleEnabled('mapa')          ? [{ label: 'Mapa',          icon: MapPin,        screen: 'mapa'          }] : []),
      ...(isModuleEnabled('oportunidades') ? [{ label: 'Oportunidades', icon: TrendingUp,    screen: 'oportunidades' }] : []),
      { divider: true, key: 'cuenta', sectionLabel: 'Mi cuenta' },
      { label: 'Yo',            icon: User,          screen: 'mis-cosas'     },
      ...(isModuleEnabled('mensajes')      ? [{ label: 'Mensajes',      icon: MessageSquare, screen: 'chats'         }] : []),
      ...(isModuleEnabled('demandas')      ? [{ label: 'Mis demandas',  icon: Package,       screen: 'mis-demandas'  }] : []),
      { label: 'Mis productos', icon: Tag,           screen: 'mis-productos' },
      { label: 'Historial',     icon: History,       screen: 'historial'     },
      ...(isAdmin ? [{ divider: true, key: 'admin-div' }, { label: 'Admin', icon: ShieldCheck, screen: 'admin' }] : []),
    ];

    // Ancho colapsado = 64px (4rem), expandido = 224px (14rem)
    const W_COLLAPSED = 64;
    const W_EXPANDED  = 224;
    const handleSidebarMouseEnter = () => {};
    const handleSidebarMouseLeave = () => {};
    const togglePin = () => {
      const next = !expanded;
      setSidebarPinned(next);
      setExpanded(next);
      localStorage.setItem('lokal-sidebar-pinned', String(next));
    };


    return (
      <>
      <div
        ref={sidebarRef}
        onMouseEnter={handleSidebarMouseEnter}
        onMouseLeave={handleSidebarMouseLeave}
        className="hidden lg:flex lg:flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-white/8 h-screen fixed top-0 left-0 z-[200] overflow-hidden"
        style={{
          width: expanded ? W_EXPANDED : W_COLLAPSED,
          transition: 'width 380ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        {/* ── Logo + botón ── */}
        <div className="border-b border-slate-100 dark:border-white/8 shrink-0">
          {/* Logo + toggle pin */}
          <div className={`flex items-center h-14 px-3 overflow-hidden gap-1 ${expanded ? '' : 'justify-center'}`}>
            {expanded && (
              <button className="ui-chip flex items-center gap-2 px-2 flex-1 text-slate-900 dark:text-white" style={{ height: 42 }}>
                <LogoFull size={18} className="text-slate-900 dark:text-white" />
              </button>
            )}
            <button
              onClick={togglePin}
              title={sidebarPinned ? 'Soltar sidebar' : 'Fijar sidebar'}
              className={`ui-chip ui-icon-btn shrink-0 transition-colors ${sidebarPinned ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8'}`}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Botón nueva demanda */}
          <div className="px-3 pb-3">
            <button
              onClick={() => { setEditingDemanda(null); navigate('crear'); }}
              className="w-full flex items-center bg-primary hover:bg-primary-hover active:bg-primary-hover text-white ui-chip transition-colors overflow-hidden"
              style={{ height: 40 }}
            >
              <div className="ui-icon-btn shrink-0">
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
        </div>

        {/* ── Nav items ── */}
        <nav className="flex-1 py-2 px-3 overflow-y-auto overflow-x-hidden">
          {navItems.map((item) => {
            if (item.divider) return (
              <div key={item.key} className="mt-2 mb-1">
                <div className="h-px bg-slate-100 dark:bg-white/6 mx-1" />
                {item.sectionLabel && (
                  <p
                    className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-wider px-2 pt-2 pb-0.5 whitespace-nowrap overflow-hidden"
                    style={{
                      opacity: expanded ? 1 : 0,
                      transition: 'opacity 140ms ease',
                      transitionDelay: expanded ? '60ms' : '0ms',
                    }}
                  >
                    {item.sectionLabel}
                  </p>
                )}
              </div>
            );

            const { label, icon: Icon, screen } = item;
            const active = currentScreen === screen;
            const badge = label === 'Mis demandas' && demandasHistorial.length > 0 ? demandasHistorial.length : null;
            return (
              <button
                key={label}
                onClick={() => { navRoot(screen); setTooltip(null); }}
                onMouseEnter={e => {
                  if (!expanded) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ label, y: rect.top + rect.height / 2, badge });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
                className={`w-full flex items-center ui-chip transition-colors overflow-hidden mb-0.5 ${
                  active
                    ? 'bg-slate-100 dark:bg-white/8 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                style={{ height: 42 }}
              >
                <div className="ui-icon-btn shrink-0">
                  <Icon className="w-4.5 h-4.5" />
                </div>
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

        {/* ── Panel de mi tienda / Registrar ── */}
        {(onOpenDashboard || onRegisterStore) && (
          <div className="px-3 pb-2 shrink-0">
            <button
              onClick={() => onOpenDashboard ? onOpenDashboard() : onRegisterStore()}
              onMouseEnter={e => {
                if (!expanded) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({ label: onOpenDashboard ? 'Panel de mi tienda' : 'Registrá tu tienda', y: rect.top + rect.height / 2, icon: Store });
                }
              }}
              onMouseLeave={() => setTooltip(null)}
              className="w-full flex items-center ui-chip text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 transition-colors overflow-hidden"
              style={{ height: 42 }}
            >
              <div className="ui-icon-btn shrink-0">
                <Store className="w-4.5 h-4.5" />
              </div>
              <span
                className="text-sm font-semibold whitespace-nowrap flex-1 text-left overflow-hidden"
                style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}
              >
                {onOpenDashboard ? 'Panel de mi tienda' : 'Registrá tu tienda'}
              </span>
            </button>
          </div>
        )}

        {/* ── Footer: legal links ── */}
        <div className="px-3 pb-1 overflow-hidden" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}>
          <div className="flex items-center justify-center gap-3">
            {[
              { label: 'Términos', path: '/terminos-y-condiciones' },
              { label: 'Privacidad', path: '/politica-de-privacidad' },
            ].map(({ label, path }) => (
              <a key={path} href={path}
                className="text-[10px] text-slate-400 dark:text-slate-600 hover:text-slate-600 dark:hover:text-slate-400 transition-colors whitespace-nowrap"
                onClick={e => { e.preventDefault(); window.history.pushState({}, '', path); window.dispatchEvent(new PopStateEvent('popstate')); }}>
                {label}
              </a>
            ))}
          </div>
        </div>

        {/* ── Footer: theme toggle ── */}
        <div className="py-3 px-3 border-t border-slate-100 dark:border-white/8 shrink-0">
          <button
            onClick={toggleTheme}
            onMouseEnter={e => {
              if (!expanded) {
                const rect = e.currentTarget.getBoundingClientRect();
                setTooltip({ label: isDark ? 'Modo claro' : 'Modo oscuro', y: rect.top + rect.height / 2 });
              }
            }}
            onMouseLeave={() => setTooltip(null)}
            className="w-full flex items-center ui-chip text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 transition-colors overflow-hidden"
            style={{ height: 40 }}
          >
            <div className="ui-icon-btn shrink-0">
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

      {/* ── Tooltip flotante (position:fixed, bypasea overflow:hidden) ── */}
      {tooltip && !expanded && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{ left: W_COLLAPSED + 8, top: tooltip.y, transform: 'translateY(-50%)' }}
        >
          <div className="relative flex items-center gap-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl animate-fade-in whitespace-nowrap">
            {/* triángulo izquierdo */}
            <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[6px] border-r-slate-900 dark:border-r-slate-700" />
            {tooltip.label}
            {tooltip.badge && (
              <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {tooltip.badge}
              </span>
            )}
          </div>
        </div>
      )}
      </>
    );
  };

  // ─── Notifications Panel (dropdown desktop / bottom-sheet mobile) ─────────
  const notifDropdownRef = useRef(null);
  useEffect(() => {
    if (!showNotifications) return;
    const handler = (e) => {
      const insidePanel = notifDropdownRef.current?.contains(e.target);
      const insideBtn   = notifBtnRef.current?.contains(e.target);
      if (!insidePanel && !insideBtn) notifAnimClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showNotifications]);

  const NotificationsPanel = ({ anchor = { top: 60, right: 16 } }) => {
    const onAnimEnd = () => { if (notifClosing) { setShowNotifications(false); setNotifClosing(false); } };

    const notifContent = (close) => (
      <>
        <div className="p-4 border-b border-slate-100 dark:border-white/8 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-bold text-base">Notificaciones</h2>
            {unreadCount > 0 && <p className="text-xs text-slate-400 mt-0.5">{unreadCount} sin leer</p>}
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-primary dark:text-primary font-semibold px-3 py-1.5 ui-chip hover:bg-primary/8 dark:hover:bg-primary/10 transition-colors">
                Marcar todas
              </button>
            )}
            <button onClick={close} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-y-auto flex-1">
          {notifList.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sin notificaciones</p>
            </div>
          ) : notifList.map(n => (
            <button key={n.id}
              onClick={() => { markNotifRead(n.id); if (n.demandaId) { const d = allDemandas.find(x => x.id === n.demandaId); if (d) { setSelectedDemanda(d); navigate('detalle'); } } close(); }}
              className={`w-full text-left p-4 border-b border-slate-100 dark:border-white/5 last:border-0 flex gap-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${!n.leido ? 'bg-primary/8 dark:bg-primary/10' : ''}`}
            >
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!n.leido ? 'bg-primary' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!n.leido ? 'font-semibold' : ''}`}>{n.mensaje}</p>
                <p className="text-xs text-slate-400 mt-0.5">{tiempoRelativo(n.tiempo)}</p>
              </div>
              {n.tipo === 'respuesta' && <MessageSquare className="w-4 h-4 text-primary shrink-0 mt-0.5" />}
              {n.tipo === 'oferta' && <Tag className="w-4 h-4 text-brand shrink-0 mt-0.5" />}
            </button>
          ))}
        </div>
      </>
    );

    return (
      <>
        {/* Mobile: bottom-sheet con backdrop */}
        <div className="lg:hidden fixed inset-0 bg-black/40 z-[3900] flex items-end" onClick={notifAnimClose}>
          <div
            className={`w-full bg-white dark:bg-slate-900 rounded-t-3xl max-h-[75vh] flex flex-col ${notifClosing ? 'animate-sheet-down' : 'animate-sheet-up'}`}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
            onClick={e => e.stopPropagation()}
            onAnimationEnd={onAnimEnd}
          >
            <div className="w-10 h-1 bg-slate-200 dark:bg-white/15 rounded-full mx-auto mt-3 mb-1 shrink-0" />
            {notifContent(notifAnimClose)}
          </div>
        </div>

        {/* Desktop: dropdown animado desde la esquina del botón */}
        <div
          ref={notifDropdownRef}
          className={`hidden lg:flex lg:flex-col fixed z-50 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8 w-80 max-h-[480px] overflow-hidden ${notifClosing ? 'animate-popup-out' : 'animate-popup-in'}`}
          style={{ top: anchor.top, right: anchor.right, boxShadow: '0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
          onAnimationEnd={onAnimEnd}
        >
          {notifContent(notifAnimClose)}
        </div>
      </>
    );
  };

  // ─── Profile Dropdown (desktop) ──────────────────────────────────────────
  useEffect(() => {
    if (!showProfileDropdown) return;
    const handler = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target))
        profileDropdownAnimClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showProfileDropdown]);

  const ProfileDropdown = () => {

    // Guest mode: mostrar invitación a login
    if (isGuest) {
      return (
        <div
          className={`absolute right-0 top-full mt-2.5 w-72 bg-white dark:bg-slate-900 rounded-2xl z-50 overflow-hidden border border-slate-100 dark:border-white/8 ${profileDropdownClosing ? 'animate-popup-out' : 'animate-popup-in'}`}
          style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
          onAnimationEnd={() => { if (profileDropdownClosing) { setShowProfileDropdown(false); setProfileDropdownClosing(false); } }}
        >
          <div className="p-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 flex items-center justify-center mx-auto mb-3">
              <User className="w-7 h-7 text-brand" />
            </div>
            <h3 className="font-black text-base mb-1">¡Hola! 👋</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Iniciá sesión para guardar, pedir y chatear.</p>
            <button
              onClick={() => { setShowProfileDropdown(false); openLoginSheet('perfil'); }}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-3 px-4 rounded-xl transition-all shadow-lg text-sm"
            >
              <svg width={16} height={16} viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              Entrar con Google
            </button>
          </div>
        </div>
      );
    }

    const totalResp = allDemandas.reduce((a, d) => a + (d.respuestas || 0), 0);
    const firstName = firebaseUser?.displayName?.split(' ')[0] || 'Usuario';

    const menuItems = [
      { label: 'Mis Demandas', icon: Package, action: () => { navRoot('mis-demandas'); setShowProfileDropdown(false); } },
      { label: 'Historial', icon: History, action: () => { navRoot('historial'); setShowProfileDropdown(false); } },
      ...(onOpenDashboard ? [{ label: 'Panel de mi tienda', icon: Store, action: () => { setShowProfileDropdown(false); onOpenDashboard(); }, highlight: true }] : onRegisterStore ? [{ label: 'Registrá tu tienda', icon: Store, action: () => { setShowProfileDropdown(false); onRegisterStore(); }, highlight: true }] : []),
    ];

    return (
      <div
        className={`absolute right-0 top-full mt-2.5 w-72 bg-white dark:bg-slate-900 rounded-2xl z-50 overflow-hidden border border-slate-100 dark:border-white/8 ${profileDropdownClosing ? 'animate-popup-out' : 'animate-popup-in'}`}
        style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.10), 0 2px 8px rgba(0,0,0,0.06)' }}
        onAnimationEnd={() => { if (profileDropdownClosing) { setShowProfileDropdown(false); setProfileDropdownClosing(false); } }}
      >
        {/* ── User header ── */}
        <div className="p-4 pb-3">
          <div className="flex items-center gap-3 mb-4">
            <div className="ui-avatar-btn bg-primary/10 dark:bg-primary/20 ring-2 ring-slate-100 dark:ring-white/10">
              {firebaseUser?.photoURL
                ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                : <span className="font-bold text-primary dark:text-primary text-sm">{firstName[0].toUpperCase()}</span>
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
              { label: 'Activas', value: demandasActivas.length, color: 'text-primary' },
              { label: 'Historial', value: demandasHistorial.length, color: 'text-slate-900 dark:text-white' },
              { label: 'Respuestas', value: totalResp, color: 'text-brand' },
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
                  ? 'text-primary dark:text-primary hover:bg-primary/8 dark:hover:bg-primary/8 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/6 font-medium'
              }`}>
              <Icon className={`w-4 h-4 shrink-0 ${highlight ? 'text-primary' : 'text-slate-400'}`} />
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
  const ProfileModal = () => {
    const [isClosing, setIsClosing] = useState(false);
    const animClose = () => setIsClosing(true);

    // Guest mode: mostrar invitación a login en vez del perfil
    if (isGuest) {
      return (
        <div className="fixed inset-0 bg-black/40 z-[3900] flex items-end justify-center lg:hidden" onClick={animClose}>
          <div
            className={`bg-white dark:bg-slate-900 rounded-t-3xl w-full ${isClosing ? 'animate-sheet-down' : 'animate-sheet-up'}`}
            style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
            onClick={e => e.stopPropagation()}
            onAnimationEnd={() => { if (isClosing) setShowProfile(false); }}
          >
            <div className="p-6 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand/20 to-brand/5 border border-brand/20 flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-brand" />
              </div>
              <h2 className="font-black text-lg mb-1.5">¡Hola! 👋</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-5">Iniciá sesión para ver tu perfil, demandas y mensajes.</p>
              <button
                onClick={() => { setShowProfile(false); openLoginSheet('perfil'); }}
                className="w-full flex items-center justify-center gap-3 bg-slate-900 dark:bg-white hover:bg-slate-800 dark:hover:bg-slate-100 text-white dark:text-slate-900 font-bold py-3.5 px-6 rounded-2xl transition-all shadow-lg"
              >
                <svg width={20} height={20} viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Entrar con Google
              </button>
              <button onClick={animClose} className="w-full mt-3 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                Seguir explorando
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
    <div className="fixed inset-0 bg-black/40 z-[3900] flex items-end justify-center lg:hidden" onClick={animClose}>
      <div
        className={`bg-white dark:bg-slate-900 rounded-t-3xl w-full ${isClosing ? 'animate-sheet-down' : 'animate-sheet-up'}`}
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5rem)' }}
        onClick={e => e.stopPropagation()}
        onAnimationEnd={() => { if (isClosing) setShowProfile(false); }}
      >
        <div className="p-5 border-b border-slate-200 dark:border-white/10">
          <div className="flex justify-between items-start mb-5">
            <h2 className="font-bold text-lg">Mi Perfil</h2>
            <button onClick={animClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden flex items-center justify-center bg-primary/10">
              {firebaseUser?.photoURL
                ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl font-bold text-primary">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</span>
              }
            </div>
            <div>
              <h3 className="font-bold text-lg">{firebaseUser?.displayName || 'Usuario'}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">{firebaseUser?.email || ''}</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Activas', value: demandasActivas.length, cls: 'bg-primary/10 text-primary' },
              { label: 'Historial', value: demandasHistorial.length, cls: 'bg-slate-100 dark:bg-white/10' },
              { label: 'Respuestas', value: allDemandas.reduce((a, d) => a + (d.respuestas || 0), 0), cls: 'bg-brand/10 text-brand' },
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
            { label: 'Mis demandas activas', action: () => { navRoot('mis-demandas'); setShowProfile(false); } },
            { label: 'Historial', action: () => { navRoot('historial'); setShowProfile(false); } },
          ].map(({ label, action }) => (
            <button key={label} onClick={action}
              className="w-full text-left px-4 py-3 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl font-semibold flex items-center justify-between transition-colors">
              {label}
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
          {(onOpenDashboard || onRegisterStore) && (
            <button onClick={() => { setShowProfile(false); (onOpenDashboard || onRegisterStore)(); }}
              className="w-full text-left px-4 py-3 hover:bg-brand/8 dark:hover:bg-brand/10 rounded-xl font-semibold text-brand flex items-center justify-between transition-colors">
              <span className="flex items-center gap-2"><Store className="w-4 h-4" />{onOpenDashboard ? 'Panel de mi tienda' : 'Registrá tu tienda'}</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          )}
          {isAdmin && (
            <button onClick={() => { setShowProfile(false); navRoot('admin'); }}
              className="w-full text-left px-4 py-3 hover:bg-primary/8 dark:hover:bg-primary/10 rounded-xl font-semibold text-primary flex items-center justify-between transition-colors">
              <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Panel Admin</span>
              <ChevronRight className="w-4 h-4 opacity-50" />
            </button>
          )}
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
  };

  // ChatModal is intentionally NOT a nested component — inlined at render site to avoid remount on every keystroke

  // ─── PageHeader compartido ────────────────────────────────────────────────
  const PageHeader = ({ title, onBack, children, searchInput, filtersSlot, hideTitle, showBell = false }) => (
    <div className="bg-white dark:bg-slate-900 sticky top-0 z-30">
      <div className="px-3 lg:px-8 h-14 flex items-center gap-2 border-b border-slate-100 dark:border-white/8">
        {onBack && (
          <button onClick={onBack} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className={`font-bold text-base shrink-0 truncate max-w-[7rem] lg:max-w-fit ${hideTitle ? 'lg:block hidden' : ''}`}>{title}</h1>
        {searchInput
          ? <div className="flex-1 min-w-0 relative">{searchInput}</div>
          : <div className="flex-1" />
        }
        {children}
        {showBell && (
          <button ref={notifBtnRef} onClick={openNotifications} className="ui-icon-btn text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 relative transition-colors shrink-0">
            <Bell className="w-4.5 h-4.5" />
            {unreadCount > 0 && <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />}
          </button>
        )}
        <button onClick={() => isGuest ? openLoginSheet('perfil') : toggleProfileMenu()} className="ui-avatar-btn ring-2 ring-transparent hover:ring-primary transition-all shrink-0 lg:hidden">
          {firebaseUser?.photoURL ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 dark:bg-white/10 flex items-center justify-center"><User className="w-4 h-4 text-slate-400" /></div>}
        </button>
        <div ref={profileDropdownRef} className="hidden lg:block relative">
          <button onClick={() => isGuest ? openLoginSheet('perfil') : toggleProfileMenu()} className={`ui-avatar-btn transition-all ring-2 ${showProfileDropdown ? 'ring-primary' : 'ring-transparent hover:ring-primary'}`}>
            {firebaseUser?.photoURL ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-slate-200 dark:bg-white/10 flex items-center justify-center"><User className="w-4 h-4 text-slate-400" /></div>}
          </button>
          {showProfileDropdown && ProfileDropdown()}
        </div>
      </div>
      {filtersSlot && (
        <div className="border-b border-slate-100 dark:border-white/8">
          {filtersSlot}
        </div>
      )}
    </div>
  );

  // ─── Home Screen (Feed) ───────────────────────────────────────────────────
  const VENTAJA_CONFIG = {
    precio:         { label: 'Mejor precio',   color: 'bg-primary',   pastel: 'bg-slate-100 dark:bg-white/8',   iconColor: 'text-primary',              Icon: Tag        },
    disponibilidad: { label: 'Tenelo hoy',     color: 'bg-amber-400', pastel: 'bg-amber-50 dark:bg-amber-500/15', iconColor: 'text-amber-500 dark:text-amber-400', Icon: Zap, stripe: true },
    financiacion:   { label: 'Financiación',   color: 'bg-slate-600', pastel: 'bg-slate-100 dark:bg-white/8',   iconColor: 'text-slate-500 dark:text-slate-400', Icon: CreditCard },
    combo:          { label: 'Combo especial', color: 'bg-amber-500', pastel: 'bg-slate-100 dark:bg-white/8',   iconColor: 'text-amber-500 dark:text-amber-400', Icon: Gift       },
  };

  // ─── Global search (usado en HomeScreen y ProductDetailScreen) ────────────
  const gResults = React.useMemo(() => {
    const q = gQuery.trim().toLowerCase();
    if (!q) return [];
    const matchStr = (s) => s?.toLowerCase().includes(q);
    const ofResults = visibleOfertas
      .filter(o => o.activa !== false && (matchStr(o.titulo) || matchStr(o.tiendaNombre)))
      .slice(0, 4).map(o => ({ _type: 'oferta', ...o }));
    const dmResults = allDemandas
      .filter(d => d.estado !== 'resuelto' && (matchStr(d.titulo) || matchStr(d.descripcion)))
      .slice(0, 3).map(d => ({ _type: 'demanda', ...d }));
    const tsResults = tiendas
      .filter(t => matchStr(t.nombre) || matchStr(t.rubro))
      .slice(0, 3).map(t => ({ _type: 'tienda', ...t }));
    return [...ofResults, ...dmResults, ...tsResults];
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gQuery]);

  const RECENT_SEARCHES_KEY = 'lokal-recent-searches';
  const getRecentSearches = () => { try { return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || '[]'); } catch { return []; } };
  const [recentSearches, setRecentSearches] = React.useState(getRecentSearches);
  const addRecentSearch = (label) => {
    if (!label?.trim()) return;
    const next = [label, ...getRecentSearches().filter(s => s !== label)].slice(0, 16);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(next));
    setRecentSearches(next);
  };
  const clearRecentSearches = () => { localStorage.removeItem(RECENT_SEARCHES_KEY); setRecentSearches([]); };

  const handleGSelect = (item) => {
    addRecentSearch(item._type === 'oferta' ? item.titulo : item._type === 'tienda' ? item.nombre : item.titulo);
    setGOpen(false);
    setGQuery('');
    if (item._type === 'oferta')  { setSelectedProduct(item); navigate('product-detail'); }
    if (item._type === 'demanda') { setSelectedDemanda(item); navigate('detalle'); }
    if (item._type === 'tienda')  { setSelectedTienda(item); navigate('tienda-detail'); }
  };
  const handleGSearchSubmit = (q) => {
    if (!q?.trim()) return;
    addRecentSearch(q.trim());
    // aplica el filtro en la home si está en home, sino navega
    setHomeActiveCat(null);
  };

  const gDropdownContent = gOpen && gAnchorRect && (
    !gQuery.trim() && recentSearches.length > 0 ? (
      <div data-gdropdown onMouseDown={e => e.preventDefault()}
        style={{ position: 'fixed', top: gAnchorRect.bottom + 8, left: gAnchorRect.left, width: gAnchorRect.width, zIndex: 9999 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-white/10 p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[11px] font-bold tracking-widest uppercase text-slate-400 flex items-center gap-1.5">
            <History className="w-3 h-3" /> Búsquedas recientes
          </p>
          <button onClick={clearRecentSearches} className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            Limpiar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {recentSearches.map((s, i) => (
            <button key={i} onMouseDown={e => { e.preventDefault(); setGQuery(s); setGQueryTick(t => t + 1); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-200 dark:hover:bg-white/12 transition-colors">
              <History className="w-3 h-3 text-slate-400 shrink-0" />
              {s}
            </button>
          ))}
        </div>
      </div>
    ) : gResults.length > 0 ? (
      <div data-gdropdown onMouseDown={e => e.preventDefault()}
        style={{ position: 'fixed', top: gAnchorRect.bottom + 8, left: gAnchorRect.left, width: gAnchorRect.width, zIndex: 9999 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl shadow-black/20 border border-slate-200 dark:border-white/10 overflow-hidden max-h-[420px] overflow-y-auto">
        {gResults.filter(r => r._type === 'oferta').length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-widest uppercase text-slate-400">Productos</p>
            {gResults.filter(r => r._type === 'oferta').map(item => {
              const vc = VENTAJA_CONFIG[item.ventaja] || {};
              return (
                <button key={item.id} onClick={() => handleGSelect(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {item.galeria?.[0] || item.fotos?.[0] ? <img src={item.galeria?.[0] || item.fotos?.[0]} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{item.titulo}</p>
                    <p className="text-xs text-slate-400 truncate">{item.tiendaNombre}</p>
                  </div>
                  <div className="shrink-0 text-right">
                    {item.precio && <p className="text-sm font-bold text-primary">${Number(item.precio).toLocaleString()}</p>}
                  </div>
                </button>
              );
            })}
          </div>
        )}
        {gResults.filter(r => r._type === 'tienda').length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-widest uppercase text-slate-400">Tiendas</p>
            {gResults.filter(r => r._type === 'tienda').map(item => (
              <button key={item.id} onClick={() => handleGSelect(item)}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left">
                <div className="w-10 h-10 rounded-xl bg-primary/10 shrink-0 flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.nombre}</p>
                  <p className="text-xs text-slate-400 truncate">{item.rubro}</p>
                </div>
                <span className={`flex items-center gap-1 text-xs font-semibold ${item.abierto ? 'text-ok' : 'text-slate-400'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${item.abierto ? 'bg-ok' : 'bg-slate-300'}`} />
                  {item.abierto ? 'Abierto' : 'Cerrado'}
                </span>
              </button>
            ))}
          </div>
        )}
        {gResults.filter(r => r._type === 'demanda').length > 0 && (
          <div>
            <p className="px-4 pt-3 pb-1 text-[10px] font-bold tracking-widest uppercase text-slate-400">Demandas</p>
            {gResults.filter(r => r._type === 'demanda').map(item => {
              const foto = item.fotos?.[0] || item.foto;
              return (
                <button key={item.id} onClick={() => handleGSelect(item)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 overflow-hidden shrink-0 flex items-center justify-center">
                    {foto ? <img src={foto} alt="" className="w-full h-full object-cover" /> : <Package className="w-5 h-5 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.titulo}</p>
                    <p className="text-xs text-slate-400">{item.tiempoCreado}</p>
                  </div>
                  <span className={`shrink-0 flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${item.respuestas > 0 ? 'text-primary bg-primary/10' : 'text-slate-400 bg-slate-100'}`}>
                    <MessageSquare className="w-2.5 h-2.5" />{item.respuestas}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <div className="h-2" />
      </div>
    ) : gQuery.trim() ? (
      <div data-gdropdown
        style={{ position: 'fixed', top: gAnchorRect.bottom + 8, left: gAnchorRect.left, width: gAnchorRect.width, zIndex: 9999 }}
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-white/10 px-4 py-6 text-center">
        <Search className="w-6 h-6 text-slate-300 mx-auto mb-2" />
        <p className="text-sm text-slate-400">Sin resultados para "<span className="font-semibold">{gQuery}</span>"</p>
      </div>
    ) : null
  );
  const gDropdown = gDropdownContent ? createPortal(gDropdownContent, document.body) : null;

  // ─── Create Sheet helpers ─────────────────────────────────────────────────
  const closeCreateSheet = () => setCreateSheetClosing(true);
  const onCreateSheetAnimEnd = () => {
    if (createSheetClosing) { setCreateSheetClosing(false); setCreateSheetOpen(false); }
  };

  const CreateSheet = () => {
    if (!createSheetOpen && !createSheetClosing) return null;
    const options = [
      // ─── Solo usuario puede crear demandas ─────────────────────────────────
      ...(userRole === 'usuario' ? [{
        icon: Package,
        color: 'bg-primary/10 text-primary',
        title: 'Publicar pedido',
        desc: 'Pedí algo y las tiendas te responden',
        action: () => { closeCreateSheet(); setEditingDemanda(null); navigate('crear'); },
      }] : []),
      // ─── Emprendimiento y empresa pueden vender productos ──────────────────
      ...(userRole !== 'usuario' ? [{
        icon: Tag,
        color: 'bg-brand/10 text-brand',
        title: 'Vender producto',
        desc: 'Publicá algo que tenés — nuevo o usado',
        action: () => {
          closeCreateSheet(); navigate('vender-producto');
        },
      }] : [{
        icon: Tag,
        color: 'bg-brand/10 text-brand',
        title: 'Vender producto',
        desc: 'Publicá algo que tenés — nuevo o usado',
        action: () => {
          closeCreateSheet(); setNudgeModal({ type: 'upgrade-rol' });
        },
      }]),
      // ─── Lógica vieja DEPRECADA ────────────────────────────────────────────
      // {
      //   icon: Package,
      //   color: 'bg-primary/10 text-primary',
      //   title: 'Publicar pedido',
      //   desc: 'Pedí algo y las tiendas te responden',
      //   action: () => { closeCreateSheet(); setEditingDemanda(null); navigate('crear'); },
      // },
      // {
      //   icon: Tag,
      //   color: 'bg-brand/10 text-brand',
      //   title: 'Vender producto',
      //   desc: 'Publicá algo que tenés — nuevo o usado',
      //   action: () => {
      //     if (userRole === 'empresa') { closeCreateSheet(); navigate('vender-producto'); }
      //     else if (userRole === 'usuario') { closeCreateSheet(); setNudgeModal({ type: 'upgrade-rol' }); }
      //     else { closeCreateSheet(); navigate('vender-producto'); }
      //   },
      // },
    ];
    return (
      <>
        <div
          className={`fixed inset-0 z-[3900] bg-black/50 ${createSheetClosing ? 'animate-backdrop-out' : 'animate-backdrop-in'}`}
          onClick={closeCreateSheet}
        />
        <div
          className={`fixed left-0 right-0 z-[4000] bg-white dark:bg-slate-900 rounded-t-3xl shadow-2xl px-5 pt-4 ${createSheetClosing ? 'animate-sheet-down' : 'animate-sheet-up'}`}
          onAnimationEnd={onCreateSheetAnimEnd}
          style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)', paddingBottom: '1.25rem' }}
        >
          <div className="w-10 h-1 bg-slate-200 dark:bg-white/15 rounded-full mx-auto mb-5" />
          <p className="font-black text-lg mb-4">¿Qué querés crear?</p>
          <div className="flex flex-col gap-3 mb-4">
            {options.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.title}
                  onClick={opt.action}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left active:scale-[0.97] ${opt.locked ? 'border-slate-100 dark:border-white/6 opacity-60' : 'border-slate-100 dark:border-white/8 hover:border-brand/30 hover:bg-brand/3'}`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${opt.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm">{opt.title}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                  </div>
                  {opt.locked && <ShieldCheck className="w-4 h-4 text-slate-300 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  const NudgeModal = () => {
    if (!nudgeModal) return null;
    const NUDGES = {
      'producto-nuevo': {
        icon: Store,
        iconColor: 'text-amber-500',
        iconBg: 'bg-amber-50 dark:bg-amber-500/10',
        title: 'Para productos nuevos',
        // ─── hasTienda DEPRECADO ─────────────────────────────────────────────
        // desc: hasTienda ? 'Publicar productos nuevos se hace desde tu panel de tienda.' : 'Vender productos nuevos es para emprendimientos y empresas. ¡El registro es gratis y te da mucho más alcance!',
        // actions: hasTienda
        //   ? [
        //       { label: 'Ir a mi panel de tienda', style: 'bg-brand hover:bg-brand-light text-white', onClick: () => { setNudgeModal(null); onOpenDashboard?.(); } },
        //       { label: 'Ahora no', style: 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400', onClick: () => setNudgeModal(null) },
        //     ]
        //   : [
        //       { label: 'Ser Emprendimiento — gratis', style: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900', onClick: () => { setNudgeModal(null); onUpgradeRole?.(); } },
        //       { label: 'Ahora no', style: 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400', onClick: () => setNudgeModal(null) },
        //     ],
        // ─── Lógica nueva: basada en userRole ────────────────────────────────
        desc: userRole === 'empresa'
          ? 'Publicar productos nuevos se hace desde tu panel de empresa.'
          : 'Vender productos nuevos es para emprendimientos y empresas. ¡El registro es gratis y te da mucho más alcance!',
        actions: userRole === 'empresa'
          ? [
              { label: 'Ir a mi panel', style: 'bg-brand hover:bg-brand-light text-white', onClick: () => { setNudgeModal(null); onOpenDashboard?.(); } },
              { label: 'Ahora no', style: 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400', onClick: () => setNudgeModal(null) },
            ]
          : [
              { label: 'Ser Emprendimiento — gratis', style: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900', onClick: () => { setNudgeModal(null); onUpgradeRole?.(); } },
              { label: 'Ahora no', style: 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400', onClick: () => setNudgeModal(null) },
            ],
      },
      'producto-usado-limite': {
        icon: Package,
        iconColor: 'text-purple-500',
        iconBg: 'bg-purple-50 dark:bg-purple-500/10',
        title: 'Llegaste al límite',
        desc: 'Podés tener hasta 3 productos de segunda mano como usuario. Subí a Emprendimiento (gratis) para publicar hasta 10.',
        actions: [
          { label: 'Subir a Emprendimiento — gratis', style: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900', onClick: () => { setNudgeModal(null); onUpgradeRole?.(); } },
          { label: 'Ahora no', style: 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400', onClick: () => setNudgeModal(null) },
        ],
      },
      'upgrade-rol': {
        icon: Zap,
        iconColor: 'text-brand',
        iconBg: 'bg-brand-muted dark:bg-brand/10',
        title: 'Subí de nivel',
        desc: 'Para vender productos necesitás ser Emprendimiento o Empresa. El cambio es gratis y te da acceso a muchas más funciones.',
        actions: [
          { label: 'Ser Emprendimiento — gratis', style: 'bg-slate-900 dark:bg-white text-white dark:text-slate-900', onClick: () => { setNudgeModal(null); onUpgradeRole?.(); } },
          { label: 'Ahora no', style: 'border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400', onClick: () => setNudgeModal(null) },
        ],
      },
    };
    const n = NUDGES[nudgeModal.type];
    if (!n) return null;
    const Icon = n.icon;
    return (
      <>
        <div className="fixed inset-0 z-[6000] bg-black/60 animate-backdrop-in" onClick={() => setNudgeModal(null)} />
        <div className="fixed inset-0 z-[6001] flex items-center justify-center p-6 pointer-events-none">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl pointer-events-auto animate-sheet-up">
            <div className={`w-14 h-14 ${n.iconBg} rounded-2xl flex items-center justify-center mb-4`}>
              <Icon size={28} className={n.iconColor} />
            </div>
            <h3 className="font-black text-lg mb-2">{n.title}</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">{n.desc}</p>
            <div className="flex flex-col gap-2">
              {n.actions.map((a) => (
                <button key={a.label} onClick={a.onClick} className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-colors ${a.style}`}>{a.label}</button>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  };

  // ─── Bottom Nav Mobile ────────────────────────────────────────────────────
  // Siempre cierra el overlay "Más" antes de navegar
  const navFromTab = (screen) => { setShowMobileMenu(false); setMobileMenuClosing(false); navRoot(screen); };

  const BottomNav = () => (
    <div className="lg:hidden fixed left-0 right-0 bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/60 dark:border-white/8 z-[4500]" style={{ bottom: 'env(safe-area-inset-bottom)' }}>
      <div className="flex items-end px-1 pt-2 pb-3 max-w-md mx-auto">
        {/* Inicio */}
        <button onClick={() => navFromTab('home')} className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${currentScreen === 'home' ? 'bg-slate-900 dark:bg-brand/15' : 'bg-slate-100 dark:bg-white/5'}`}>
            <Home className={`w-5 h-5 ${currentScreen === 'home' ? 'text-white dark:text-brand' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${currentScreen === 'home' ? 'text-brand-dark dark:text-brand' : 'text-slate-500'}`}>Inicio</span>
        </button>
        {/* Tiendas */}
        <button onClick={() => navFromTab('tiendas')} className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${currentScreen === 'tiendas' || currentScreen === 'tienda-detail' ? 'bg-slate-900 dark:bg-brand/15' : 'bg-slate-100 dark:bg-white/5'}`}>
            <Store className={`w-5 h-5 ${currentScreen === 'tiendas' || currentScreen === 'tienda-detail' ? 'text-white dark:text-brand' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${currentScreen === 'tiendas' || currentScreen === 'tienda-detail' ? 'text-brand-dark dark:text-brand' : 'text-slate-500'}`}>Tiendas</span>
        </button>
        {/* Crear — central elevado */}
        <button onClick={() => {
          if (isGuest) { openLoginSheet('crear'); return; }
          setShowMobileMenu(false); setMobileMenuClosing(false); setShowNotifications(false); setShowProfile(false); createSheetOpen ? closeCreateSheet() : setCreateSheetOpen(true);
        }} className="flex-1 flex flex-col items-center" style={{ marginTop: '-14px' }}>
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-brand"
            style={{ boxShadow: '0 4px 18px rgba(0,184,217,0.45)' }} />
          <span className="text-[10px] font-semibold mt-1 text-slate-500">Crear</span>
        </button>
        {/* Mapa */}
        {isModuleEnabled('mapa') && (
        <button onClick={() => navFromTab('mapa')} className="flex-1 flex flex-col items-center gap-1">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${currentScreen === 'mapa' ? 'bg-slate-900 dark:bg-brand/15' : 'bg-slate-100 dark:bg-white/5'}`}>
            <MapPin className={`w-5 h-5 ${currentScreen === 'mapa' ? 'text-white dark:text-brand' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${currentScreen === 'mapa' ? 'text-brand-dark dark:text-brand' : 'text-slate-500'}`}>Mapa</span>
        </button>
        )}
        {/* Más — abre overlay full-screen */}
        {(() => {
          const masActive = (showMobileMenu && !mobileMenuClosing) ||
            ['mis-cosas','mis-demandas','historial','mis-productos','vender-producto','chats'].includes(currentScreen);
          const chatUnread = Object.values(chatConversations).reduce((s, c) => s + (c.unread || 0), 0);
          return (
            <button onClick={() => { if (showMobileMenu) { setShowMobileMenu(false); setMobileMenuClosing(false); } else { setShowMobileMenu(true); } }} className="flex-1 flex flex-col items-center gap-1">
              <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${masActive ? 'bg-slate-900 dark:bg-brand/15' : 'bg-slate-100 dark:bg-white/5'}`}>
                <Menu className={`w-5 h-5 ${masActive ? 'text-white dark:text-brand' : 'text-slate-500 dark:text-slate-400'}`} />
                {chatUnread > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-brand flex items-center justify-center text-[9px] font-bold text-white">
                    {chatUnread > 9 ? '9+' : chatUnread}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-semibold ${masActive ? 'text-brand-dark dark:text-brand' : 'text-slate-500'}`}>Más</span>
            </button>
          );
        })()}
      </div>
    </div>
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  const showBottomNav = !['crear', 'admin', 'vender-producto'].includes(currentScreen);

  // Stable screen wrappers: evitan que React desmonte/remonte las screens cuando
  // UserApp re-renderiza por cambios de estado que no son navegación (ej: createSheetOpen).
  // La función interna siempre se actualiza vía ref, así que los closures son frescos.
  const _sw = React.useRef({});
  const sw = (key, Fn) => {
    if (!_sw.current[key]) {
      _sw.current[key] = function S(p) { return _sw.current[key + '$f'](p); };
    }
    _sw.current[key + '$f'] = Fn;
    return _sw.current[key];
  };
  // pageHeaderProps bundle — passed to screens that use PageHeader
  const pageHeaderProps = {
    firebaseUser,
    toggleProfileMenu: () => setShowProfile(v => !v),
    showProfileDropdown: showProfile,
    openNotifications: () => setShowNotifications(true),
    unreadCount,
  };

  const S = {
    Home:          sw('home',          HomeScreen),
    MisDemandas:   sw('mis-demandas',  () => <MisDemandas
      demandasActivas={demandasActivas} allCategories={allCategories}
      demandaRootIds={demandaRootIds} sortedDemandas={sortedDemandas}
      sortBy={sortBy} setSortBy={setSortBy}
      loadingDemandas={loadingDemandas} errorDemandas={errorDemandas} fetchDemandas={fetchDemandas}
      setSelectedDemanda={setSelectedDemanda} navigate={navigate} goBack={goBack}
      setEditingDemanda={setEditingDemanda}
      pageHeaderProps={pageHeaderProps}
    />),
    TodasOfertas:  sw('todas-ofertas', () => <TodasOfertasScreen
      searchQuery={searchResultsQuery || ''}
      visibleOfertas={visibleOfertas} tiendas={tiendas} allCategories={allCategories}
      ofertasStoreFilter={ofertasStoreFilter} setOfertasStoreFilter={setOfertasStoreFilter}
      loadingOfertas={loadingOfertas}
      goBack={goBack} navigate={navigate}
      setSelectedProduct={setSelectedProduct} setSelectedTienda={setSelectedTienda}
      setEditingDemanda={setEditingDemanda}
      pageHeaderProps={pageHeaderProps}
    />),
    Crear:         sw('crear',         () => <CrearDemandaScreen
      editingDemanda={editingDemanda} setEditingDemanda={setEditingDemanda}
      navRoot={navRoot} navigate={navigate}
      setAllDemandas={setAllDemandas}
      allCategories={allCategories}
      createCategory={createCategory}
      addNotif={addNotif}
    />),
    Detalle:       sw('detalle',       () => <DetalleDemandaScreen
      selectedDemanda={selectedDemanda} allDemandas={allDemandas}
      goBack={goBack} navigate={navigate}
      setEditingDemanda={setEditingDemanda}
      openChat={openChat}
      updateDemandaEstado={updateDemandaEstado}
      deleteDemanda={deleteDemanda}
      setShowConfirm={setShowConfirm}
    />),
    Tiendas:       sw('tiendas',       () => <TiendasScreen
      tiendas={tiendas} allCategories={allCategories} visibleOfertas={visibleOfertas}
      filterCategory={filterCategory} setFilterCategory={setFilterCategory}
      navigate={navigate} goBack={goBack} setSelectedTienda={setSelectedTienda}
      pageHeaderProps={pageHeaderProps}
    />),
    Categorias:    sw('categorias',    () => {
      const prevScreen = navStack[navStack.length - 2] || 'home';
      const fromTiendas = prevScreen === 'tiendas' || prevScreen === 'mis-demandas';
      return <CategoriasScreen
        allCategories={allCategories} visibleOfertas={visibleOfertas}
        navigate={navigate} setHomeActiveCat={setHomeActiveCat}
        setFilterCategory={fromTiendas ? setFilterCategory : undefined}
        returnScreen={fromTiendas ? prevScreen : 'home'}
      />;
    }),
    TiendaDetail:  sw('tienda-detail', () => <TiendaDetailScreen
      tienda={selectedTienda} tiendas={tiendas} visibleOfertas={visibleOfertas}
      allDemandas={allDemandas} allCategories={allCategories}
      firebaseUser={firebaseUser} unreadCount={unreadCount}
      toggleProfileMenu={() => setShowProfile(v => !v)}
      openNotifications={() => setShowNotifications(true)}
      goBack={goBack} navigate={navigate} navigateReplace={navigateReplace}
      openChat={openChat}
      setSelectedTienda={setSelectedTienda} setSelectedProduct={setSelectedProduct}
      setSelectedDemanda={setSelectedDemanda}
      setMapaFocusStore={setMapaFocusStore}
      setOfertasStoreFilter={setOfertasStoreFilter}
      mainScrollRef={mainScrollRef}
      showToast={showToast} isDark={isDark}
    />),
    Historial:     sw('historial',     () => <HistorialScreen
      demandasHistorial={demandasHistorial}
      goBack={goBack}
      updateDemandaEstado={updateDemandaEstado}
      setShowConfirm={setShowConfirm}
      deleteDemanda={deleteDemanda}
      pageHeaderProps={pageHeaderProps}
    />),
    Mapa:          sw('mapa',          () => <MapaScreen
      tiendas={tiendas} visibleOfertas={visibleOfertas}
      allDemandas={allDemandas} allCategories={allCategories}
      mapaFocusStore={mapaFocusStore} mapaFocusProduct={mapaFocusProduct} mapaAutoRoute={mapaAutoRoute}
      setMapaFocusStore={setMapaFocusStore} setMapaFocusProduct={setMapaFocusProduct} setMapaAutoRoute={setMapaAutoRoute}
      goBack={goBack} navigate={navigate}
      setSelectedProduct={setSelectedProduct} setSelectedTienda={setSelectedTienda}
      setSelectedDemanda={setSelectedDemanda}
      isDark={isDark} showToast={showToast}
    />),
    ProductDetail: sw('product-detail', () => <ProductDetailScreen
      oferta={selectedProduct} tiendas={tiendas} visibleOfertas={visibleOfertas}
      allDemandas={allDemandas}
      firebaseUser={firebaseUser} unreadCount={unreadCount}
      toggleProfileMenu={() => setShowProfile(v => !v)}
      openNotifications={() => setShowNotifications(true)}
      goBack={goBack} navigate={navigate} openChat={openChat}
      setSelectedProduct={setSelectedProduct} setSelectedTienda={setSelectedTienda}
      setSelectedDemanda={setSelectedDemanda}
      setMapaFocusStore={setMapaFocusStore}
      setMapaFocusProduct={setMapaFocusProduct}
      setMapaAutoRoute={setMapaAutoRoute}
      mainScrollRef={mainScrollRef}
    />),
    Vender:        sw('vender-producto', () => <VenderProductoScreen
      firebaseUser={firebaseUser} userRole={userRole}
      canPostNewProduct={canPostNewProduct}
      /* hasTienda={hasTienda} // DEPRECADO: usar userRole === 'empresa' */
      navRoot={navRoot} navigate={navigate} goBack={goBack}
      setNudgeModal={setNudgeModal}
      setSelectedProduct={setSelectedProduct}
      allCategories={allCategories}
      createCategory={createCategory}
    />),
    MisProductos:  sw('mis-productos', () => <MisProductosScreen
      firebaseUser={firebaseUser} userRole={userRole}
      goBack={goBack}
      setNudgeModal={setNudgeModal}
      setCreateSheetOpen={setCreateSheetOpen}
    />),
    MisCosas:      sw('mis-cosas',     () => <MisCosasScreen
      firebaseUser={firebaseUser} userRole={userRole}
      /* hasTienda={hasTienda} // DEPRECADO: usar userRole === 'empresa' */
      allDemandas={allDemandas}
      navigate={navigate} navRoot={navRoot}
      setEditingDemanda={setEditingDemanda}
      setSelectedDemanda={setSelectedDemanda}
      setNudgeModal={setNudgeModal}
    />),
    Chats:         sw('chats',         () => <ChatsScreen
      chatConversations={chatConversations}
      tiendas={tiendas}
      navRoot={navRoot}
      openChat={openChat}
      pageHeaderProps={pageHeaderProps}
    />),
  };

    return (
      <div className="bg-[#f7f8fa] dark:bg-[#0a0d16] h-[100dvh] overflow-hidden relative">
      <DesktopSidebar />

      <div
        ref={el => { mainScrollRef.current = el; if (el) { const prev = el._prevScreen; if (prev !== currentScreen) { el.scrollTop = 0; el._prevScreen = currentScreen; } } }}
        className={`h-[100dvh] overflow-x-hidden bg-[#f7f8fa] dark:bg-[#0a0d16] relative z-0 transition-[padding-left] duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${currentScreen === 'home' ? 'lg:pl-0' : sidebarExpanded ? 'lg:pl-[224px]' : 'lg:pl-16'} ${currentScreen === 'admin' ? 'overflow-hidden' : 'overflow-y-auto'}`}
        style={showBottomNav ? { paddingBottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)' } : { paddingBottom: 0 }}
        data-has-bottom-nav={showBottomNav || undefined}
      >
        {currentScreen === 'home' && <S.Home
          homeActiveCat={homeActiveCat} setHomeActiveCat={setHomeActiveCat}
          visibleOfertas={visibleOfertas} tiendas={tiendas}
          allDemandas={allDemandas} allCategories={allCategories}
          addRecentSearch={addRecentSearch} recentSearches={recentSearches}
          clearRecentSearches={clearRecentSearches}
          setSelectedProduct={setSelectedProduct} setSelectedTienda={setSelectedTienda}
          setSelectedDemanda={setSelectedDemanda}
          navigate={navigate} navigateSearch={navigateSearch}
          setEditingDemanda={setEditingDemanda}
          loadingOfertas={loadingOfertas} loadingDemandas={loadingDemandas}
          demandasActivas={demandasActivas}
          openNotifications={(btn) => openNotifications(btn)}
          unreadCount={unreadCount} isStoreOpen={isStoreOpen}
          VENTAJA_CONFIG={VENTAJA_CONFIG}
          firebaseUser={firebaseUser}
          onOpenProfile={() => { notifAnimClose(); if (showProfileDropdown) profileDropdownAnimClose(); setShowProfile(true); }}
          toggleProfileMenu={toggleProfileMenu}
          showProfileDropdown={showProfileDropdown}
          ProfileDropdown={ProfileDropdown}
          profileDropdownRef={profileDropdownRef}
        />}
        {currentScreen === 'mis-demandas' && <S.MisDemandas />}
        {currentScreen === 'todas-ofertas' && <S.TodasOfertas />}
        {currentScreen === 'crear' && <S.Crear />}
        {currentScreen === 'detalle' && selectedDemanda && <S.Detalle />}
        {currentScreen === 'tiendas' && <S.Tiendas />}
        {currentScreen === 'categorias' && <S.Categorias />}
        {currentScreen === 'tienda-detail' && selectedTienda && <S.TiendaDetail />}
        {currentScreen === 'historial' && <S.Historial />}
        {currentScreen === 'mapa' && <S.Mapa />}
        {currentScreen === 'product-detail' && selectedProduct && <S.ProductDetail />}
        {currentScreen === 'vender-producto' && <S.Vender />}
        {currentScreen === 'mis-productos' && <S.MisProductos />}
        {currentScreen === 'mis-cosas' && <S.MisCosas />}
        {currentScreen === 'chats' && <S.Chats />}
        {currentScreen === 'admin' && isAdmin && (
          <AdminDashboard
            firebaseUser={firebaseUser}
            tiendas={tiendas}
            ofertas={allOfertas}
            demandas={allDemandas}
            isDark={isDark}
            onBack={() => navRoot('home')}
            suspended={suspended}
            onSuspend={handleAdminSuspend}
            onRestore={handleAdminRestore}
            onDelete={handleAdminDelete}
            demoMode={demoMode}
            onDemoModeChange={setDemoMode}
            setRoleSim={setRoleSim}
          />
        )}

        {showBottomNav && <BottomNav />}
        {/* Ícono del botón Crear — fuera de BottomNav para que la transition sobreviva re-renders */}
        {showBottomNav && (
          <div className="lg:hidden fixed z-[4600] pointer-events-none flex items-center justify-center"
            style={{ width: 56, height: 56, left: '50%', transform: 'translateX(-50%)', bottom: 'calc(env(safe-area-inset-bottom) + 1.8rem)' }}>
            <Plus
              className="w-6 h-6 text-white"
              style={{
                transform: (createSheetOpen && !createSheetClosing) ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 180ms cubic-bezier(0.4, 0, 0.2, 1)',
              }}
            />
          </div>
        )}
        {CreateSheet()}
        <NudgeModal />
        {showMobileMenu && <MobileMenu />}
        {showNotifications && NotificationsPanel({ anchor: notifAnchor })}
        {showProfile && <ProfileModal />}
        {showChat && (() => {
          const tienda = showChat;
          const messages = chatHistories[tienda.chatKey] || [];
          const chatUnread = chatConversations[tienda.chatKey]?.unread || 0;

          /* ── Chip colapsado (estilo Messenger/Instagram) ── */
          if (chatCollapsed) return (
            <div
              className="fixed right-4 bottom-24 lg:right-8 lg:bottom-8 z-[5000] flex items-center gap-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-white/10 rounded-2xl shadow-xl px-3 py-2.5 cursor-pointer hover:shadow-2xl transition-shadow select-none"
              onClick={() => setChatCollapsed(false)}
            >
              <div className="relative shrink-0">
                <div className="w-8 h-8 rounded-xl overflow-hidden bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
                  {tienda.foto
                    ? <img src={tienda.foto} alt={tienda.tienda} className="w-full h-full object-cover" />
                    : <Store className="w-4 h-4 text-brand" />}
                </div>
                {chatUnread > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-rose-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">
                    {chatUnread > 9 ? '9+' : chatUnread}
                  </span>
                )}
              </div>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200 max-w-[110px] truncate">{tienda.tienda}</span>
              <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
              <button
                onMouseDown={e => e.stopPropagation()}
                onClick={e => { e.stopPropagation(); setShowChat(null); setChatCollapsed(false); }}
                className="ml-0.5 w-5 h-5 rounded-full flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );

          return (
            <div className="fixed inset-0 lg:inset-auto lg:right-8 lg:bottom-8 lg:w-96 lg:h-[580px] bg-white dark:bg-slate-900 z-[5000] flex flex-col lg:rounded-3xl lg:shadow-2xl lg:border-2 border-slate-200 dark:border-white/10">
              {/* Header */}
              <div className="border-b-2 border-slate-200 dark:border-white/10 p-4 lg:rounded-t-3xl shrink-0 flex items-center gap-3"
                style={{ paddingTop: 'max(1rem, env(safe-area-inset-top))' }}>
                {/* Móvil: cerrar (X) | Desktop: minimizar (chevron) */}
                <button onClick={() => setShowChat(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl lg:hidden">
                  <X className="w-5 h-5" />
                </button>
                <button onClick={() => setChatCollapsed(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl hidden lg:flex items-center justify-center" title="Minimizar">
                  <ChevronDown className="w-5 h-5" />
                </button>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand/10 dark:bg-brand/15 flex items-center justify-center shrink-0">
                  {tienda.foto
                    ? <img src={tienda.foto} alt={tienda.tienda} className="w-full h-full object-cover" />
                    : <Store className="w-5 h-5 text-brand" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold truncate">{tienda.tienda}</h3>
                  {(() => {
                    const isClosed = chatConversations[tienda.chatKey]?.status === 'closed';
                    return (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${isClosed ? 'bg-slate-300 dark:bg-slate-600' : 'bg-ok'}`} />
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          {isClosed ? 'Resuelto' : 'Responde en Lokal'}
                        </p>
                      </div>
                    );
                  })()}
                </div>
                {tienda.telefono && (
                  <a href={`https://wa.me/${tienda.telefono.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl shrink-0">
                    <Phone className="w-4 h-4 text-slate-500" />
                  </a>
                )}
                {/* Cerrar / reabrir chat */}
                {(() => {
                  const isClosed = chatConversations[tienda.chatKey]?.status === 'closed';
                  return (
                    <button
                      onClick={() => setChatConversations(prev => ({ ...prev, [tienda.chatKey]: { ...prev[tienda.chatKey], status: isClosed ? 'read' : 'closed' } }))}
                      title={isClosed ? 'Reabrir' : 'Marcar resuelto'}
                      className={`p-2 rounded-xl shrink-0 transition-colors ${isClosed ? 'bg-ok/10 hover:bg-ok/15 text-ok' : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400'}`}>
                      <CheckCircle className="w-4 h-4" />
                    </button>
                  );
                })()}
                {/* Cerrar completamente (desktop) */}
                <button onClick={() => setShowChat(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl hidden lg:flex items-center justify-center" title="Cerrar">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>
              {/* Context card — producto desde el que se abrió el chat */}
              {tienda.contextProduct && (
                <button
                  onClick={() => { setShowChat(null); setSelectedProduct(tienda.contextProduct); navigate('product-detail'); }}
                  className="mx-3 mt-3 flex items-center gap-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-3 text-left hover:bg-slate-100 dark:hover:bg-white/8 transition-colors shrink-0"
                >
                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-200 dark:bg-white/10 shrink-0">
                    {tienda.contextProduct.imagenes?.[0] || tienda.contextProduct.foto
                      ? <img src={tienda.contextProduct.imagenes?.[0] || tienda.contextProduct.foto} alt="" className="w-full h-full object-cover" />
                      : <Package className="w-6 h-6 text-slate-400 m-3" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-brand mb-0.5">Preguntando sobre</p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{tienda.contextProduct.titulo}</p>
                    {tienda.contextProduct.precio && (
                      <p className="text-xs text-slate-500">${Number(tienda.contextProduct.precio).toLocaleString()}</p>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                </button>
              )}

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-950">
                {messages.length === 0 && !tienda.contextProduct && (
                  <div className="flex flex-col items-center justify-center h-full text-center gap-2 py-8">
                    <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-700" />
                    <p className="text-sm font-semibold text-slate-500">Iniciá la conversación</p>
                    <p className="text-xs text-slate-400">Preguntale a {tienda.tienda} lo que necesitás</p>
                  </div>
                )}
                {messages.map(msg => (
                  <div key={msg.id} className={`flex flex-col ${msg.from === 'user' ? 'items-end' : 'items-start'} gap-1`}>
                    {msg.attachment?.type === 'product' && (
                      <button
                        onClick={() => { const p = allOfertas.find(o => o.id === msg.attachment.id); if (p) { setShowChat(null); setSelectedProduct(p); navigate('product-detail'); } }}
                        className={`flex items-center gap-2.5 rounded-2xl p-2.5 border max-w-[75%] text-left transition-colors ${msg.from === 'user' ? 'bg-brand/10 border-brand/25 hover:bg-brand/15' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-700 shadow-sm'}`}
                      >
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/10 shrink-0">
                          {msg.attachment.imagen
                            ? <img src={msg.attachment.imagen} alt="" className="w-full h-full object-cover" />
                            : <Package className="w-5 h-5 text-slate-400 m-2.5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs text-brand font-bold mb-0.5">Producto</p>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{msg.attachment.titulo}</p>
                          {msg.attachment.precio && <p className="text-xs text-slate-500">${Number(msg.attachment.precio).toLocaleString()}</p>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                      </button>
                    )}
                    {msg.text && (
                      <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${msg.from === 'user' ? 'bg-brand text-white' : 'bg-white dark:bg-slate-800 shadow-sm'}`}>
                        <p className="text-sm">{msg.text}</p>
                        <p className={`text-xs mt-1 ${msg.from === 'user' ? 'text-white/60' : 'text-slate-400'}`}>{msg.time}</p>
                      </div>
                    )}
                    {!msg.text && msg.attachment && (
                      <p className={`text-xs ${msg.from === 'user' ? 'text-brand/60' : 'text-slate-400'}`}>{msg.time}</p>
                    )}
                  </div>
                ))}
                <div ref={chatEndRef} />
              </div>
              {/* Barra inferior: picker + input, siempre al fondo */}
              <div className="shrink-0 lg:rounded-b-3xl overflow-hidden">
                {/* Product picker — aparece animado justo arriba del input */}
                {chatProductPicker && (() => {
                  const storeProdsList = allOfertas.filter(o => String(o.tiendaId) === String(tienda.id) && o.activa !== false).slice(0, 30);
                  return (
                    <div className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 animate-sheet-up">
                      <div className="flex items-center justify-between px-4 pt-3 pb-1.5">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Mencionar producto</p>
                        <button onClick={() => setChatProductPicker(false)}
                          className="w-6 h-6 rounded-lg flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10">
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>
                      <div className="overflow-y-auto max-h-52 px-3 pb-2 space-y-0.5">
                        {storeProdsList.length === 0 && (
                          <div className="text-center py-6">
                            <Package className="w-7 h-7 text-slate-300 mx-auto mb-1.5" />
                            <p className="text-xs text-slate-400">Sin productos publicados</p>
                          </div>
                        )}
                        {storeProdsList.map(p => (
                          <button key={p.id}
                            onClick={() => { setChatPendingAttach(p); setChatProductPicker(false); }}
                            className="w-full flex items-center gap-3 px-2 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left">
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/10 shrink-0">
                              {p.imagenes?.[0] || p.foto
                                ? <img src={p.imagenes?.[0] || p.foto} alt="" className="w-full h-full object-cover" />
                                : <Package className="w-4 h-4 text-slate-400 m-3" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{p.titulo}</p>
                              {p.precio
                                ? <p className="text-xs text-brand font-semibold">${Number(p.precio).toLocaleString()}</p>
                                : <p className="text-xs text-slate-400">Sin precio</p>}
                            </div>
                            <div className="w-5 h-5 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                              <Plus className="w-3 h-3 text-brand" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Input */}
                <div className="relative z-10 border-t-2 border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 px-3 py-3"
                  style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}>
                  <div className="flex gap-2 items-end">
                    <button onClick={() => setChatProductPicker(v => !v)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors shrink-0 mb-0.5 ${chatProductPicker ? 'bg-brand/10 text-brand' : 'bg-slate-100 dark:bg-white/8 hover:bg-slate-200 dark:hover:bg-white/12 text-slate-500'}`}>
                      <Paperclip className="w-4 h-4" />
                    </button>
                    <div className="flex-1 min-w-0 bg-slate-100 dark:bg-white/5 rounded-2xl px-3 py-2 flex flex-col gap-1.5 focus-within:ring-2 focus-within:ring-brand transition-shadow">
                      {chatPendingAttach && (
                        <div className="flex items-center gap-1.5 bg-brand/10 dark:bg-brand/15 border border-brand/20 rounded-xl px-2 py-1 self-start max-w-full">
                          <div className="w-5 h-5 rounded overflow-hidden bg-brand/20 shrink-0">
                            {chatPendingAttach.imagenes?.[0] || chatPendingAttach.foto
                              ? <img src={chatPendingAttach.imagenes?.[0] || chatPendingAttach.foto} alt="" className="w-full h-full object-cover" />
                              : <Package className="w-3 h-3 text-brand m-1" />}
                          </div>
                          <span className="text-xs font-semibold text-brand truncate max-w-[140px]">{chatPendingAttach.titulo}</span>
                          <button onClick={() => setChatPendingAttach(null)}
                            className="shrink-0 rounded-full hover:bg-brand/20 p-0.5 ml-0.5">
                            <X className="w-3 h-3 text-brand" />
                          </button>
                        </div>
                      )}
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={e => setChatMessage(e.target.value)}
                        onFocus={() => setChatProductPicker(false)}
                        onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                        placeholder={chatPendingAttach ? 'Agregá un mensaje (opcional)...' : 'Escribi tu mensaje...'}
                        className="bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none w-full py-0.5"
                      />
                    </div>
                    <button onClick={() => sendChatMessage()} disabled={!chatMessage.trim() && !chatPendingAttach}
                      className="w-10 h-10 bg-brand hover:bg-brand-dark rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors shrink-0 mb-0.5">
                      <Send className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        {showConfirm && <ConfirmModal {...showConfirm} onCancel={() => setShowConfirm(null)} />}

        {/* Login Bottom Sheet — aparece cuando un guest intenta hacer algo que requiere auth */}
        <LoginBottomSheet
          open={loginSheet.open}
          onClose={closeLoginSheet}
          context={loginSheet.context}
          onOpenLanding={() => { closeLoginSheet(); window.history.pushState({}, '', '/landing'); window.dispatchEvent(new PopStateEvent('popstate')); }}
        />
      </div>
    </div>
  );
};

export default UserApp;
