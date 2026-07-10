import React, { useState, useEffect, useRef, useMemo } from 'react';
import { cacheGet, cacheSet } from './lokCache';
import { PaywallModal as PaywallModalUI, PremiumModal as PremiumModalUI, SuscripcionContent } from './store/PricingUI';
import { haptic } from './haptic';
import LazyImg from './LazyImg';
import { SkeletonProductosGrid, SkeletonProductosList, SkeletonInbox, SkeletonFeed, SkeletonPerfil, SkeletonStats } from './Skeletons';
import { MOCK_PRODUCTOS, MOCK_INBOX, MOCK_DEMANDAS, MOCK_RESPUESTAS, MOCK_HISTORIAL_PAGOS, MOCK_STATS } from './mockStoreData';
import { TiendaPublicaRenderer, TEMPLATES_META } from './tienda-publica/TiendaPublicaRenderer.jsx';
import { SECCIONES_DEFAULT } from './tienda-publica/tokens.js';
import TransferenciaModal from './store/modals/TransferenciaModal';
import {
  Store, Package, MessageSquare, Search, ArrowLeft, Globe, Home,
  Send, MapPin, CheckCircle, X, Loader2, AlertCircle,
  TrendingUp, Edit3, ChevronRight, Phone,
  RotateCcw, LogOut, Sun, Moon, AlertTriangle, ChevronDown, Camera,
  Lock, CreditCard, Zap, CalendarDays, ShieldCheck, RefreshCw,
  Plus, ToggleLeft, ToggleRight, Trash2,
  ExternalLink, Link2, Instagram, Save, Sparkles, Award, Lightbulb,
  Tag, Gift, Wrench, Copy, Menu, Info, Infinity, FlaskConical, Clock, Palette,
  PanelLeft, Archive, Paperclip, ShoppingBag, Building2,
  User, Hash, CalendarClock, MessageCircle, ChevronLeft,
  LayoutGrid, LayoutList, ArrowUpDown, SlidersHorizontal, ListFilter
} from 'lucide-react';

// ─── Precios suscripción (deben coincidir con mp-checkout.js) ─────────────────
const PRECIO_MENSUAL    = 4990;
const PRECIO_ANUAL      = 47900;
const PRECIO_ANUAL_MES  = Math.round(PRECIO_ANUAL / 12);
const PRECIO_PREMIUM    = 9990;

// ─── Helpers suscripción ──────────────────────────────────────────────────────
function suscripcionActiva(tiendaData) {
  // Tiendas sin suscripcion (creadas por invite) → tratar como activas
  if (!tiendaData?.suscripcion?.vence) return true;
  return new Date(tiendaData.suscripcion.vence) > new Date();
}
function diasRestantes(tiendaData) {
  if (!tiendaData?.suscripcion?.vence) return null;
  const diff = new Date(tiendaData.suscripcion.vence) - new Date();
  return Math.max(0, Math.ceil(diff / 86400000));
}
import { LogoBadge, LogoFull, KtrlMark } from './Brand';
import CategoryPicker from './CategoryPicker';
import { VENTAJA_CONFIG } from './utils/ventajaConfig';
import ProductoFormComp from './components/ProductoForm';
import ProductoSuccessModal from './components/ProductoSuccessModal';
import HomeScreen from './screens/HomeScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import TiendaDetailScreen from './screens/TiendaDetailScreen';
import { CATEGORIES as BASE_CATEGORIES, getCategoryPath, getAllDescendants } from './categories';
import CategoryIcon from './CategoryIcon';
import { apiFetch } from './api';
import { PlaceAutocomplete, MapPicker, uploadFile } from './StoreRegisterFlow';

const API_BASE = '/.netlify/functions';

const StorePhotoCarousel = ({ photos = [] }) => {
  const [idx, setIdx] = React.useState(0);
  if (!photos.length) return null;
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  return (
    <div className="relative bg-slate-100 dark:bg-black/30 select-none">
      <img src={photos[idx]} alt="" className="w-full object-contain max-h-64" style={{ aspectRatio: '16/9' }} />
      {photos.length > 1 && (
        <>
          {/* flechas con tap target generoso y no-press para evitar el salto de transform */}
          <button
            onClick={prev}
            className="no-press absolute left-0 top-0 bottom-0 w-14 flex items-center justify-start pl-2"
            aria-label="Anterior foto"
          >
            <span className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center shadow-lg">
              <ChevronDown className="w-4 h-4 rotate-90" strokeWidth={2.5} />
            </span>
          </button>
          <button
            onClick={next}
            className="no-press absolute right-0 top-0 bottom-0 w-14 flex items-center justify-end pr-2"
            aria-label="Siguiente foto"
          >
            <span className="w-9 h-9 rounded-full bg-black/50 backdrop-blur-sm text-white flex items-center justify-center shadow-lg">
              <ChevronDown className="w-4 h-4 -rotate-90" strokeWidth={2.5} />
            </span>
          </button>
          <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5">
            {photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setIdx(i)}
                className={`no-press h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default function StoreApp({ firebaseUser, tiendaData, userProfile, onLogout, onTiendaUpdate = () => {}, isDark, toggleTheme, isAdmin = false, onOpenAdmin, onBrowseAsUser }) {
  // ─── Migración tiendaData → userProfile.businessProfile ────────────────────
  // Si viene userProfile (nuevo), derivamos tiendaData de businessProfile
  // Si viene tiendaData (viejo), lo usamos directamente
  const derivedTiendaData = React.useMemo(() => {
    if (tiendaData) return tiendaData; // compatibilidad hacia atrás
    if (userProfile?.businessProfile) {
      return {
        ...userProfile.businessProfile,
        id: userProfile.uid,
        googleUid: userProfile.uid,
        ownerEmail: userProfile.email,
        ownerNombre: userProfile.displayName,
        suscripcion: userProfile.suscripcion,
      };
    }
    return null;
  }, [tiendaData, userProfile]);
  // A partir de aquí, usar derivedTiendaData en lugar de tiendaData
  // Para no cambiar todo el archivo ahora, reasignamos tiendaData
  // eslint-disable-next-line no-unused-vars
  tiendaData = derivedTiendaData;

  // ─── Detectar rol y plan desde userProfile ─────────────────────────────────
  const userRole = userProfile?.role || 'empresa';
  const userPlan = userProfile?.plan || 'basico';
  const isEmprendimiento = userRole === 'emprendimiento';
  const isEmpresa = userRole === 'empresa';
  const isPremium = isEmpresa && userPlan === 'premium';
  const isBasico = isEmpresa && userPlan === 'basico';

  // Límites según rol/plan
  const productLimit = isEmprendimiento ? 5 : (isBasico ? 20 : Infinity);
  const canRespondDemandas = isEmpresa;
  const canViewStats = isEmpresa;
  const canViewAI = isPremium;
  const galleryLimit = isEmprendimiento ? 3 : (isBasico ? 6 : 10);

  const STORE_SCREENS = ['perfil', 'feed', 'mensajes', 'productos', 'inicio', 'stats', 'suscripcion'];
  const savedScreen = localStorage.getItem('lokal-store-screen');
  const [screen, setScreen] = useState(STORE_SCREENS.includes(savedScreen) ? savedScreen : 'perfil');
  const [selectedDemanda, setSelectedDemanda] = useState(null);

  // Mock test mode (solo admins)
  const [mockMode, setMockMode] = useState(false);

  // Transición suave entre screens
  const [screenVisible, setScreenVisible] = useState(true);

  // Sidebar collapse
  const [sidebarExpanded, setSidebarExpanded] = React.useState(() => localStorage.getItem('lokal-store-sidebar-pinned') !== 'false');
  const [sidebarPinned, setSidebarPinned] = React.useState(() => localStorage.getItem('lokal-store-sidebar-pinned') !== 'false');

  // Datos
  const [demandas, setDemandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tienda, setTienda] = useState(null);
  const [misRespuestas, setMisRespuestas] = useState([]);

  // ── Inbox (mensajes directos de clientes) ─────────────────────────────────
  const [inboxConvos,      setInboxConvos]      = useState([]);
  const [inboxLoading,     setInboxLoading]      = useState(false);
  const [inboxSelectedKey, setInboxSelectedKey]  = useState(null);
  const [inboxReply,       setInboxReply]        = useState('');
  const [inboxInfoOpen,    setInboxInfoOpen]     = useState(false);
  const [editingMsg,       setEditingMsg]        = useState(null); // {id, text}
  const [swipedMsgId,      setSwipedMsgId]       = useState(null); // long-press mobile
  const [deletingMsgId,    setDeletingMsgId]     = useState(null); // animación borrado
  const [storeTyping,      setStoreTyping]       = useState(false); // "escribiendo..." simulado
  const [inboxSending,     setInboxSending]      = useState(false);
  const [attachOpen,       setAttachOpen]        = useState(false);
  const [chatAttachment,   setChatAttachment]    = useState(null); // { type, ...data }
  const [chatImagePreview, setChatImagePreview]  = useState(null); // base64 data URL
  const chatImageInputRef = useRef(null);
  const [inboxSearch,      setInboxSearch]       = useState('');
  const [inboxMobileView,  setInboxMobileView]   = useState('list'); // 'list' | 'chat'
  const [inboxTab,         setInboxTab]          = useState('chats'); // 'chats' | 'respuestas'
  const [msgFilter,        setMsgFilter]         = useState('todos'); // 'todos' | 'chats' | 'demandas' | 'laborales'
  const [closedConvos,     setClosedConvos]      = useState(new Set()); // keys cerradas
  const [showClosed,       setShowClosed]        = useState(false);

  // ── Vista inicio (marketplace read-only) ─────────────────────────────────
  const [inicioOfertas,         setInicioOfertas]         = useState([]);
  const [inicioTiendas,         setInicioTiendas]         = useState([]);
  const [inicioLoadingOfertas,  setInicioLoadingOfertas]  = useState(false);
  const [homeActiveCat,         setHomeActiveCat]         = useState(null);
  const [inicioSubScreen,       setInicioSubScreen]       = useState(null); // null | 'producto' | 'tienda'
  const [inicioSelectedProduct, setInicioSelectedProduct] = useState(null);
  const [inicioSelectedTienda,  setInicioSelectedTienda]  = useState(null);
  const [inicioSelectedDemanda, setInicioSelectedDemanda] = useState(null);
  const [recentSearches,        setRecentSearches]        = useState([]);

  // ── Chat flotante (persiste entre pantallas) ──────────────────────────────
  const [floatingChats,   setFloatingChats]   = useState([]); // [{key, collapsed, msg, sending}]
  // legacy alias usado en botones de lista/panel
  const floatingChatKey = floatingChats.find(c => !c.collapsed)?.key ?? floatingChats[0]?.key ?? null;
  const openFloatingChat  = (key) => setFloatingChats(prev => {
    if (prev.find(c => c.key === key)) return prev.map(c => c.key === key ? { ...c, collapsed: false } : c);
    const next = [{ key, collapsed: true, msg: '', sending: false }, ...prev].slice(0, 5);
    return next;
  });
  const closeFloatingChat = (key) => setFloatingChats(prev => prev.filter(c => c.key !== key));
  const toggleFloatingCollapse = (key) => setFloatingChats(prev => prev.map(c => c.key === key ? { ...c, collapsed: !c.collapsed } : c));
  const setFloatingMsg = (key, msg) => setFloatingChats(prev => prev.map(c => c.key === key ? { ...c, msg } : c));
  const setFloatingSending = (key, sending) => setFloatingChats(prev => prev.map(c => c.key === key ? { ...c, sending } : c));

  // Categorías unificadas (base + custom)
  const [allCategories, setAllCategories] = useState(BASE_CATEGORIES);

  // Filtros feed
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRubro, setFilterRubro] = useState('todas');

  // Responder
  const [respondiendo, setRespondiendo] = useState(false);
  const [msgRespuesta, setMsgRespuesta] = useState('');
  const [precioRespuesta, setPrecioRespuesta] = useState('');
  const [adjuntosRespuesta, setAdjuntosRespuesta] = useState([]); // [{ file, preview, type }]
  const [matchType, setMatchType] = useState(null);
  const [submitError, setSubmitError] = useState(null);
  const [submitOk, setSubmitOk] = useState(false);
  const adjuntosInputRef = useRef(null);

  // Suscripción / paywall
  const [showPaywall, setShowPaywall]   = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false);
  const [transferenciaPlan, setTransferenciaPlan] = useState('mensual');
  const [renovando, setRenovando]       = useState(false);
  const [renovError, setRenovError]     = useState(null);
  const [historialPagos, setHistorialPagos] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const isActiva = suscripcionActiva(tiendaData);
  const dias     = diasRestantes(tiendaData);

  // Notificaciones / unread
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createSheetClosing, setCreateSheetClosing] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const [newDemandasCount, setNewDemandasCount] = useState(0);
  const LAST_FEED_KEY = `lokal-lastfeed-${tiendaData?.id || 'store'}`;

  // Productos
  const PROD_CACHE_KEY = `productos-${tiendaData?.id || 'store'}`;
  const [misProductos, setMisProductos] = useState(() => cacheGet(PROD_CACHE_KEY) || []);
  const [loadingProductos, setLoadingProductos] = useState(false);

  // Página pública — edición inline
  const [editingPublicPage, setEditingPublicPage] = useState(false);
  const [publicPageForm, setPublicPageForm] = useState({ slug: '', tagline: '', whatsapp: '', instagram: '' });
  const [savingPublicPage, setSavingPublicPage] = useState(false);
  const [publicPageError, setPublicPageError] = useState(null);

  // Diseño de página — template, color, secciones
  const [editingPagina, setEditingPagina] = useState(false);
  const [paginaForm, setPaginaForm] = useState({ template: 'minimal', color: '#00b8d9', modoOscuro: false, secciones: {} });
  const [savingPagina, setSavingPagina] = useState(false);

  // Edición info básica
  const [editInfoModal, setEditInfoModal] = useState(false);
  const [editInfoTab, setEditInfoTab] = useState('info');
  const [editInfoScope, setEditInfoScope] = useState('general');
  const [editingNombre, setEditingNombre] = useState(false);
  const [nombreDraft, setNombreDraft] = useState('');
  const [editInfoForm, setEditInfoForm] = useState({ nombre: '', descripcion: '', telefono: '', ciudad: '', direccion: '' });
  const [savingInfo, setSavingInfo] = useState(false);
  const [saveInfoErr, setSaveInfoErr] = useState(null);
  const [mediaModal, setMediaModal] = useState(null); // 'foto' | 'portada' | 'galeria'
  const [mediaDraft, setMediaDraft] = useState([]);
  const [mediaSaving, setMediaSaving] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const mediaInputRef = useRef(null);
  const [locationModal, setLocationModal] = useState(false);
  const [horarioModal, setHorarioModal] = useState(false);
  const [horarioForm, setHorarioForm] = useState({});
  const [savingHorario, setSavingHorario] = useState(false);
  const [locationForm, setLocationForm] = useState({ ciudad: '', direccion: '', lat: null, lng: null });
  const [locationFlyTo, setLocationFlyTo] = useState(null);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // FeedScreen
  const [feedTab,    setFeedTab]    = useState('feed');
  const [feedSort,   setFeedSort]   = useState('recientes'); // 'recientes' | 'presupuesto' | 'urgentes'
  const [feedEstado, setFeedEstado] = useState('todas');     // 'todas' | 'nuevas' | 'respondidas'

  // MatchTypeSelector
  const [matchTypeStep, setMatchTypeStep] = useState('root');

  // ChatThread
  const [chatMsgs, setChatMsgs] = useState([]);
  const [chatTexto, setChatTexto] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef(null);
  const inboxBottomRef      = useRef(null);
  const inboxScrollRef      = useRef(null); // desktop
  const inboxMobileScrollRef = useRef(null); // mobile

  // StatsScreen
  const [aiLoading, setAiLoading] = useState(false);
  const [aiData, setAiData] = useState(null);
  const [aiError, setAiError] = useState(null);

  // RubrosEditor
  const [rubrosSelected, setRubrosSelected] = useState(() => tiendaData?.rubros || []);
  const [rubrosSaving, setRubrosSaving] = useState(false);
  const [rubrosSaved, setRubrosSaved] = useState(false);

  // EditInfoModal
  const [editModalRubros, setEditModalRubros] = useState([]);

  // ProductosScreen
  const [prodSearch,    setProdSearch]    = useState('');
  const [prodFilter,    setProdFilter]    = useState('todos');
  const [prodSort,      setProdSort]      = useState('recientes');
  const [prodView,      setProdView]      = useState('grid'); // 'grid' | 'lista'
  const [prodCondicion, setProdCondicion] = useState(null);  // 'nuevo' | 'usado' | null
  const [prodSinStock,  setProdSinStock]  = useState(false);
  const [prodDescuento, setProdDescuento] = useState(false);
  const [confirmDelete,         setConfirmDelete]         = useState(null);
  const [prodFilterSheet,       setProdFilterSheet]       = useState(false);
  const [prodDetail,            setProdDetail]            = useState(null);
  const [prodDetailPhotoIdx,    setProdDetailPhotoIdx]    = useState(0);
  const [prodDetailEditField,   setProdDetailEditField]   = useState(null);
  const [prodDetailDraft,       setProdDetailDraft]       = useState('');
  const [prodDetailSaving,      setProdDetailSaving]      = useState(false);
  const [prodDetailPhotoConfirm,setProdDetailPhotoConfirm]= useState(null);
  const [productoShowForm, setProductoShowForm] = useState(false);
  const [productoEditing, setProductoEditing] = useState(null);
  const [productoForm, setProductoForm] = useState({ titulo: '', descripcion: '', precio: '', precioOriginal: '', ventaja: [], financiacion: '', stock: '1', condicion: 'nuevo', categoryId: null, contactoWhatsapp: '' });
  const [productoCategoryId, setProductoCategoryId] = useState(null); // legacy alias — usar productoForm.categoryId
  const [productoAttributes, setProductoAttributes] = useState({});
  const [productoFotoFiles, setProductoFotoFiles] = useState([]);
  const [productoFotoPreviews, setProductoFotoPreviews] = useState([]);
  const [productoSaving, setProductoSaving] = useState(false);
  const [productoSaveErr, setProductoSaveErr] = useState(null);
  const [productoSuccess, setProductoSuccess] = useState(null); // producto guardado para mostrar modal
  const productoFotoInputRef = useRef(null);

  // Persiste screen en localStorage + sincroniza hash en desktop
  const navigateTo = (s) => {
    if (s === screen && !moreSheetOpen) return;
    haptic('select');

    const commit = () => {
      // Fade out contenido
      setScreenVisible(false);
      setTimeout(() => {
        // Swap de screen en el valle del fade
        setScreen(s);
        localStorage.setItem('lokal-store-screen', s);
        if (window.matchMedia('(min-width: 1024px)').matches) {
          window.history.replaceState(null, '', `#store/${s}`);
        }
        // Fade in suave
        requestAnimationFrame(() => setScreenVisible(true));
      }, 120);
    };

    if (moreSheetOpen) {
      // Cerrar sheet → esperar que su animación termine → transicionar
      setMoreSheetOpen(false);
      setTimeout(commit, 180);
    } else {
      commit();
    }
  };

  // Guardar datos mínimos del shell para recarga sin Firebase
  // Marcar tipo tienda al montar
  useEffect(() => {
    localStorage.setItem('lokal-user-type', 'store');
  }, []);

  useEffect(() => {
    if (!tiendaData) return;
    localStorage.setItem('lokal-shell', JSON.stringify({
      type: 'store',
      nombre: tiendaData.nombre || '',
      foto: tiendaData.foto || null,
    }));
  }, [tiendaData?.nombre, tiendaData?.foto]);

  useEffect(() => {
    // Popstate: botón atrás del browser en desktop
    const onPop = () => {
      const hash = window.location.hash.replace('#store/', '');
      if (STORE_SCREENS.includes(hash)) { setScreen(hash); localStorage.setItem('lokal-store-screen', hash); }
    };
    window.addEventListener('popstate', onPop);
    // Escribir hash inicial en desktop
    if (window.matchMedia('(min-width: 1024px)').matches) {
      window.history.replaceState(null, '', `#store/${screen}`);
    }
    return () => window.removeEventListener('popstate', onPop);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchTienda();
    fetchDemandas();
    fetchMisRespuestas();
    fetchMisProductos();
    apiFetch(`${API_BASE}/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(custom => { if (custom.length > 0) setAllCategories([...BASE_CATEGORIES, ...custom]); })
      .catch(() => {});
  }, []);

  // Polling — re-fetch demandas cada 60s (no en mock mode)
  useEffect(() => {
    if (mockMode) return;
    const iv = setInterval(fetchDemandas, 60000);
    return () => clearInterval(iv);
  }, [mockMode]);

  // Cargar inbox al entrar a mensajes
  useEffect(() => {
    if (screen === 'mensajes') fetchInbox();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  // Cargar datos del marketplace al entrar a inicio
  useEffect(() => {
    if (screen !== 'inicio') return;
    setInicioSubScreen(null);
    if (inicioOfertas.length > 0 && inicioTiendas.length > 0) return; // ya cargado
    setInicioLoadingOfertas(true);
    Promise.all([
      apiFetch(`${API_BASE}/ofertas`).then(r => r.ok ? r.json() : []).catch(() => []),
      apiFetch(`${API_BASE}/tiendas-crud`).then(r => r.ok ? r.json() : []).catch(() => []),
    ]).then(([ofertas, tiendas]) => {
      setInicioOfertas(Array.isArray(ofertas) ? ofertas : []);
      setInicioTiendas(Array.isArray(tiendas) ? tiendas : []);
    }).finally(() => setInicioLoadingOfertas(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen]);

  const createCategory = async (name, parentId = null) => {
    const res = await apiFetch(`${API_BASE}/categories`, {
      method: 'POST',
      authRequired: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId }),
    });
    const cat = await res.json();
    setAllCategories(prev => prev.find(c => c.id === cat.id) ? prev : [...prev, cat]);
    return cat;
  };

  const saveInfoBasica = async () => {
    if (editInfoScope === 'general' && !editInfoForm.nombre.trim()) return;
    setSavingInfo(true);
    setSaveInfoErr(null);
    try {
      const body = {
        id: tiendaData.id,
        nombre: editInfoForm.nombre.trim(),
        descripcion: editInfoForm.descripcion,
        telefono: editInfoForm.telefono,
        ciudad: editInfoForm.ciudad,
        direccion: editInfoForm.direccion,
      };
      const res = await apiFetch(`${API_BASE}/tiendas-crud`, {
        method: 'PATCH',
        authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error'); }
      const updated = await res.json();
      setTienda(updated);
      onTiendaUpdate(updated);
      setEditInfoModal(false);
    } catch (e) {
      setSaveInfoErr(e.message);
    } finally {
      setSavingInfo(false);
    }
  };

  const persistTiendaPatch = async (patch) => {
    const res = await apiFetch(`${API_BASE}/tiendas-crud`, {
      method: 'PATCH',
      authRequired: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: tienda?.id || tiendaData?.id, ...patch }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Error al guardar');
    setTienda(data);
    onTiendaUpdate(data);
    return data;
  };

  const buildMediaDraft = (section) => {
    if (section === 'foto') {
      return tiendaInfo.foto ? [{ url: tiendaInfo.foto, existing: true }] : [];
    }
    if (section === 'portada') {
      return tiendaData?.galeria?.[0] ? [{ url: tiendaData.galeria[0], existing: true }] : [];
    }
    return (tiendaData?.galeria || []).map(url => ({ url, existing: true }));
  };

  const openMediaEditor = (section) => {
    setMediaModal(section);
    setMediaDraft(buildMediaDraft(section));
    setMediaError(null);
  };

  const closeMediaEditor = () => {
    setMediaModal(null);
    setMediaDraft([]);
    setMediaError(null);
    if (mediaInputRef.current) mediaInputRef.current.value = '';
  };

  const openLocationEditor = () => {
    setLocationForm({
      ciudad: tiendaInfo.ciudad || '',
      direccion: tiendaInfo.direccion || '',
      lat: tiendaData?.lat ?? null,
      lng: tiendaData?.lng ?? null,
    });
    setLocationFlyTo(tiendaData?.lat && tiendaData?.lng ? { lat: tiendaData.lat, lng: tiendaData.lng } : null);
    setLocationError(null);
    setLocationModal(true);
  };

  const openGeneralProfileEditor = (tab = 'info') => {
    setEditInfoForm({
      nombre: tiendaInfo.nombre || '',
      descripcion: tiendaInfo.descripcion || '',
      telefono: tiendaInfo.telefono || '',
      ciudad: tiendaInfo.ciudad || '',
      direccion: tiendaInfo.direccion || '',
    });
    setSaveInfoErr(null);
    setEditInfoScope('general');
    setEditInfoTab(tab);
    setEditModalRubros(tiendaInfo.rubros || []);
    setEditInfoModal(true);
  };

  const openProfileEdit = (section) => {
    if (['foto', 'portada', 'galeria'].includes(section)) {
      openMediaEditor(section === 'portada' ? 'portada' : section);
      return;
    }
    if (section === 'telefono') {
      openGeneralProfileEditor('info');
      setEditInfoScope('telefono');
      return;
    }
    if (section === 'descripcion') {
      openGeneralProfileEditor('info');
      setEditInfoScope('descripcion');
      setEditInfoTab('info');
      return;
    }
    if (section === 'direccion' || section === 'ciudad') {
      openLocationEditor();
      return;
    }
    if (section === 'horarios') {
      setHorarioForm(tiendaInfo.horarios || {
        lunes: { abierto: false, desde: '09:00', hasta: '18:00' },
        martes: { abierto: false, desde: '09:00', hasta: '18:00' },
        miercoles: { abierto: false, desde: '09:00', hasta: '18:00' },
        jueves: { abierto: false, desde: '09:00', hasta: '18:00' },
        viernes: { abierto: false, desde: '09:00', hasta: '18:00' },
        sabado: { abierto: false, desde: '09:00', hasta: '18:00' },
        domingo: { abierto: false, desde: '09:00', hasta: '18:00' },
      });
      setHorarioModal(true);
      return;
    }
    if (['slug', 'tagline', 'instagram', 'whatsapp'].includes(section)) {
      setPublicPageForm({
        slug: tiendaInfo.slug || '',
        tagline: tiendaInfo.tagline || '',
        whatsapp: tiendaInfo.whatsapp || tiendaInfo.telefono || '',
        instagram: tiendaInfo.instagram || '',
      });
      setPublicPageError(null);
      setEditingPublicPage(true);
      setTimeout(() => document.getElementById('perfil-pagina-publica')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
      return;
    }
    openGeneralProfileEditor(section === 'rubros' ? 'rubros' : 'info');
  };

  // Sincronizar paginaForm cuando llega la tienda (carga inicial o después de guardar)
  const paginaGuardadaRef = useRef(null);
  useEffect(() => {
    if (!tienda?.pagina) return;
    // Solo sincronizar si la pagina guardada cambió (evitar loops)
    const paginaStr = JSON.stringify(tienda.pagina);
    if (paginaGuardadaRef.current === paginaStr) return;
    paginaGuardadaRef.current = paginaStr;
    setPaginaForm({
      template:   tienda.pagina.template   ?? 'minimal',
      color:      tienda.pagina.color      ?? '#00b8d9',
      modoOscuro: tienda.pagina.modoOscuro ?? false,
      secciones:  tienda.pagina.secciones  ?? {},
    });
  }, [tienda]);

  const fetchTienda = async () => {
    try {
      // Buscar por googleUid (el UID de Firebase del usuario actual)
      // El id numérico de la tienda en R2 puede no estar en el prop tiendaData
      const uid = firebaseUser?.uid;
      if (!uid) return;
      const res = await apiFetch(`${API_BASE}/tiendas-crud?googleUid=${encodeURIComponent(uid)}`, {
        authRequired: true,
      });
      if (res.ok) setTienda(await res.json());
    } catch { /* usa session data como fallback */ }
  };

  const savePublicPage = async () => {
    const storeId = tienda?.id || tiendaData?.id;
    if (!storeId) { setPublicPageError('No se encontró tu tienda. Recargá la página.'); return; }
    if (!publicPageForm.slug.trim()) { setPublicPageError('Ingresá una URL para tu página.'); return; }
    setSavingPublicPage(true);
    setPublicPageError(null);
    try {
      const body = { id: storeId, slug: publicPageForm.slug.trim() };
      if ('tagline' in publicPageForm) body.tagline = publicPageForm.tagline;
      if ('whatsapp' in publicPageForm) body.whatsapp = publicPageForm.whatsapp;
      if ('instagram' in publicPageForm) body.instagram = publicPageForm.instagram;

      const res = await apiFetch(`${API_BASE}/tiendas-crud`, {
        method: 'PATCH',
        authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al guardar');
      }
      const updated = await res.json();
      setTienda(updated);
      onTiendaUpdate(updated);
      setEditingPublicPage(false);
    } catch (e) {
      setPublicPageError(e.message);
    } finally {
      setSavingPublicPage(false);
    }
  };

  const [paginaSaved, setPaginaSaved] = useState(false);
  const [paginaError, setPaginaError] = useState(null);
  const [previewKey, setPreviewKey] = useState(0);
  const [openEditorPanel, setOpenEditorPanel] = useState('template');
  const [editorSheetOpen, setEditorSheetOpen] = useState(false);

  const savePagina = async () => {
    const storeId = tienda?.id || tiendaData?.id;
    if (!storeId) { setPaginaError('Tu tienda aún no cargó, esperá un momento.'); return; }
    setSavingPagina(true);
    setPaginaError(null);
    try {
      const body = { id: storeId, pagina: paginaForm };
      // Si hay slug en el form y es distinto al actual, guardarlo también
      const slugActual = tienda?.slug || tiendaData?.slug || '';
      if (publicPageForm.slug.trim() && publicPageForm.slug.trim() !== slugActual) {
        body.slug = publicPageForm.slug.trim();
      }
      if (publicPageForm.tagline !== undefined) body.tagline = publicPageForm.tagline;
      if (publicPageForm.whatsapp !== undefined) body.whatsapp = publicPageForm.whatsapp;
      if (publicPageForm.instagram !== undefined) body.instagram = publicPageForm.instagram;

      const res = await apiFetch(`${API_BASE}/tiendas-crud`, {
        method: 'PATCH',
        authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error al guardar'); }
      const updated = await res.json();
      setTienda(updated);
      onTiendaUpdate(updated);
      setPreviewKey(k => k + 1);
      setPaginaSaved(true);
      setEditorSheetOpen(false);
      setTimeout(() => { setPaginaSaved(false); setScreen('perfil'); }, 1500);
    } catch (e) {
      setPaginaError(e.message);
    } finally {
      setSavingPagina(false);
    }
  };

  const fetchDemandas = async () => {
    if (mockMode) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/demandas`, {
        authRequired: true,
      });
      if (res.ok) {
        const data = await res.json();
        const activas = data.filter(d => d.estado === 'activa');
        setDemandas(activas);
        const lastSeen = Number(localStorage.getItem(LAST_FEED_KEY) || 0);
        const nuevas = activas.filter(d => d.createdAt && new Date(d.createdAt).getTime() > lastSeen).length;
        setNewDemandasCount(nuevas);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMisRespuestas = async () => {
    if (mockMode) return;
    try {
      const res = await apiFetch(`${API_BASE}/respuestas?tiendaId=${tiendaData.id}`, {
        authRequired: true,
      });
      if (res.ok) setMisRespuestas(await res.json());
    } catch { /* silencioso */ }
  };

  const fetchInbox = async () => {
    if (mockMode) return;
    const storeId = tienda?.id || tiendaData?.id;
    if (!storeId) return;
    setInboxLoading(true);
    try {
      const res = await apiFetch(`${API_BASE}/messages?storeInbox=1&storeId=${storeId}`, { authRequired: true });
      if (res.ok) {
        const data = await res.json();
        setInboxConvos(data.conversations || []);
      }
    } catch { /* silencioso */ } finally {
      setInboxLoading(false);
    }
  };

  const fetchMisProductos = async () => {
    if (mockMode) return;
    setLoadingProductos(true);
    try {
      const res = await apiFetch(`${API_BASE}/ofertas?tiendaId=${tiendaData.id}`, { authRequired: true });
      if (res.ok) {
        const data = await res.json();
        cacheSet(PROD_CACHE_KEY, data, 10 * 60 * 1000);
        setMisProductos(data);
      }
    } catch { /* silencioso */ } finally {
      setLoadingProductos(false);
    }
  };

  const handleMediaFiles = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    const maxItems = mediaModal === 'foto' || mediaModal === 'portada' ? 1 : 6;
    const remaining = Math.max(0, maxItems - mediaDraft.length);
    const nextItems = files.slice(0, remaining).map(file => ({
      file,
      url: URL.createObjectURL(file),
      existing: false,
    }));
    setMediaDraft(prev => {
      if (mediaModal === 'foto' || mediaModal === 'portada') {
        prev.forEach(item => { if (!item.existing) URL.revokeObjectURL(item.url); });
        return nextItems.slice(0, 1);
      }
      return [...prev, ...nextItems];
    });
    event.target.value = '';
  };

  const removeMediaDraftItem = (index) => {
    setMediaDraft(prev => {
      const item = prev[index];
      if (item && !item.existing) URL.revokeObjectURL(item.url);
      return prev.filter((_, i) => i !== index);
    });
  };

  const saveMediaChanges = async () => {
    setMediaSaving(true);
    setMediaError(null);
    try {
      const urls = [];
      for (const item of mediaDraft) {
        urls.push(item.existing ? item.url : await uploadFile(item.file));
      }

      if (mediaModal === 'foto') {
        await persistTiendaPatch({ foto: urls[0] || null });
      } else if (mediaModal === 'portada') {
        const currentGallery = tiendaData?.galeria || [];
        const nextGallery = urls[0]
          ? [urls[0], ...currentGallery.filter((url, idx) => idx !== 0 && url !== urls[0])]
          : currentGallery.slice(1);
        await persistTiendaPatch({ galeria: nextGallery });
      } else {
        await persistTiendaPatch({ galeria: urls });
      }
      closeMediaEditor();
    } catch (error) {
      setMediaError(error.message);
    } finally {
      setMediaSaving(false);
    }
  };

  const saveLocationChanges = async () => {
    setLocationSaving(true);
    setLocationError(null);
    try {
      await persistTiendaPatch({
        ciudad: locationForm.ciudad,
        direccion: locationForm.direccion,
        lat: locationForm.lat,
        lng: locationForm.lng,
      });
      setLocationModal(false);
    } catch (error) {
      setLocationError(error.message);
    } finally {
      setLocationSaving(false);
    }
  };

  const yaRespondio = (demandaId) => misRespuestas.some(r => String(r.demandaId) === String(demandaId));

  const toggleMockMode = () => {
    if (!mockMode) {
      setMisProductos(MOCK_PRODUCTOS);
      setInboxConvos(MOCK_INBOX);
      setDemandas(MOCK_DEMANDAS);
      setMisRespuestas(MOCK_RESPUESTAS);
      setHistorialPagos(MOCK_HISTORIAL_PAGOS);
      setAiData({ insights: [
        { prioridad: 'alta', titulo: 'Actualizar precios de herramientas', descripcion: 'Los precios de taladros y amoladoras están por debajo del mercado local. Subir entre 8-12% aumentaría el margen sin afectar la conversión.' },
        { prioridad: 'media', titulo: 'Añadir fotos a 3 productos sin imagen', descripcion: 'Tornillos 4x40, Disco de corte x5 y Sellador silicona no tienen foto. Los productos con foto convierten 3x más.' },
        { prioridad: 'baja', titulo: 'Responder consulta pendiente de Ignacio Molina', descripcion: 'Hay una consulta sin responder de hace 2 horas sobre cables eléctricos. Responder rápido mejora la reputación.' },
      ]});
    } else {
      setMisProductos([]);
      setInboxConvos([]);
      setDemandas([]);
      setMisRespuestas([]);
      setHistorialPagos([]);
      setAiData(null);
    }
    setMockMode(v => !v);
  };

  const handleRenovar = async (plan) => {
    setRenovando(true);
    setRenovError(null);
    try {
      const res = await apiFetch(`${API_BASE}/mp-checkout`, {
        method: 'POST',
        authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan,
          tiendaId:    tiendaData.id,
          googleUid:   firebaseUser.uid,
          ownerNombre: firebaseUser.displayName || '',
          ownerEmail:  firebaseUser.email || '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear preferencia de pago');
      window.location.href = data.initPoint || data.sandboxInitPoint;
    } catch (err) {
      setRenovError(err.message);
      setRenovando(false);
    }
  };

  // Sube un adjunto (imagen o video) a R2 y devuelve { url, type }
  const uploadAdjunto = async (item) => {
    if (!item.file) return null;
    const type = item.type; // 'image' | 'video'
    const base64 = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result.split(',')[1]);
      reader.onerror = reject;
      reader.readAsDataURL(item.file);
    });
    const res = await apiFetch(`${API_BASE}/upload`, {
      method: 'POST',
      authRequired: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: item.file.name, fileData: base64, contentType: item.file.type }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { url: data.url, type };
  };

  const handleAdjuntosChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const MAX = 4;
    const remaining = MAX - adjuntosRespuesta.length;
    files.slice(0, remaining).forEach(file => {
      const type = file.type.startsWith('video/') ? 'video' : 'image';
      const preview = URL.createObjectURL(file);
      setAdjuntosRespuesta(prev => prev.length < MAX ? [...prev, { file, preview, type }] : prev);
    });
    e.target.value = '';
  };

  const removeAdjunto = (idx) => {
    setAdjuntosRespuesta(prev => {
      URL.revokeObjectURL(prev[idx]?.preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const handleResponder = async () => {
    if (!msgRespuesta.trim()) return;
    setRespondiendo(true);
    setSubmitError(null);
    try {
      // Subir adjuntos primero
      const adjuntosSubidos = (
        await Promise.all(adjuntosRespuesta.map(uploadAdjunto))
      ).filter(Boolean);

      const res = await apiFetch(`${API_BASE}/respuestas`, {
        method: 'POST',
        authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          demandaId: selectedDemanda.id,
          demandaTitulo: selectedDemanda.titulo,
          tiendaId: tiendaData.id,
          tiendaNombre: tiendaData.nombre || tiendaInfo.nombre,
          tiendaFoto: tiendaData.foto || tiendaInfo.foto || null,
          tiendaRating: tiendaData.rating || tiendaInfo.rating || null,
          tiendaHorario: tiendaData.horario || tiendaInfo.horario || null,
          tiendaDireccion: tiendaData.direccion || tiendaInfo.direccion || null,
          tiendaCiudad: tiendaData.ciudad || tiendaInfo.ciudad || null,
          tiendaTelefono: tiendaData.telefono || tiendaInfo.telefono || null,
          mensaje: msgRespuesta.trim(),
          precio: precioRespuesta ? Number(precioRespuesta) : null,
          adjuntos: adjuntosSubidos,
          matchType: matchType || null,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Error al enviar');
      const nueva = resData;
      setMisRespuestas(prev => [nueva, ...prev]);
      setMsgRespuesta('');
      setPrecioRespuesta('');
      setAdjuntosRespuesta([]);
      setMatchType(null);
      setSubmitOk(true);
      setTimeout(() => setSubmitOk(false), 3000);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setRespondiendo(false);
    }
  };

  // Categorías raíz presentes en las demandas actuales
  const categoriasFeed = allCategories.filter(c =>
    c.parentId === null &&
    demandas.some(d => {
      if (!d.categoryId) return false;
      const descendants = getAllDescendants(c.id, allCategories);
      return d.categoryId === c.id || descendants.includes(d.categoryId);
    })
  );

  const demandasFiltradas = demandas
    .filter(d => {
      const matchSearch = d.titulo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (d.descripcion || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchRubro = filterRubro === 'todas' || (() => {
        if (!d.categoryId) return false;
        const descendants = getAllDescendants(filterRubro, allCategories);
        return d.categoryId === filterRubro || descendants.includes(d.categoryId);
      })();
      const matchEstado = feedEstado === 'todas' ||
        (feedEstado === 'nuevas' && !yaRespondio(d.id)) ||
        (feedEstado === 'respondidas' && yaRespondio(d.id));
      return matchSearch && matchRubro && matchEstado;
    })
    .sort((a, b) => {
      if (feedSort === 'presupuesto') return (b.presupuesto?.max || 0) - (a.presupuesto?.max || 0);
      if (feedSort === 'urgentes') {
        const uA = a.urgente ? 1 : 0, uB = b.urgente ? 1 : 0;
        return uB - uA || (b.ts || 0) - (a.ts || 0);
      }
      return (b.ts || 0) - (a.ts || 0);
    });

  const tiendaInfo = tienda || {
    nombre: tiendaData?.nombre || '',
    rubros: tiendaData?.rubros || [],
    foto: tiendaData?.foto || null,
    direccion: tiendaData?.direccion || '',
    ciudad: tiendaData?.ciudad || '',
    telefono: tiendaData?.telefono || '',
    horarios: tiendaData?.horarios || null,
  };

  const estaAbiertoAhora = (horarios) => {
    if (!horarios) return null;
    const now = new Date();
    const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaKey = dias[now.getDay()];
    const dia = horarios[diaKey];
    if (!dia || !dia.abierto) return false;
    const [hDesde, mDesde] = (dia.desde || '00:00').split(':').map(Number);
    const [hHasta, mHasta] = (dia.hasta || '00:00').split(':').map(Number);
    const minNow = now.getHours() * 60 + now.getMinutes();
    const minDesde = hDesde * 60 + mDesde;
    const minHasta = hHasta * 60 + mHasta;
    if (minHasta < minDesde) {
      return minNow >= minDesde || minNow <= minHasta;
    }
    return minNow >= minDesde && minNow <= minHasta;
  };

  const renderAccountAvatar = () => {
    if (firebaseUser?.photoURL) {
      return <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />;
    }
    const initial = (firebaseUser?.displayName || firebaseUser?.email || tiendaInfo.nombre || 'T')[0]?.toUpperCase() || 'T';
    return (
      <div className="w-full h-full bg-brand flex items-center justify-center font-bold text-white text-sm">
        {initial}
      </div>
    );
  };

  const StoreHeaderActions = ({ actionSlot = null }) => (
    <>
      {actionSlot}
      <button
        onClick={toggleTheme}
        className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 text-slate-500 dark:text-slate-400 transition-colors shrink-0"
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      >
        {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
      </button>
      <button
        onClick={() => setMoreSheetOpen(true)}
        className="ui-avatar-btn ring-2 ring-transparent hover:ring-brand transition-all shrink-0"
        aria-label="Abrir cuenta"
      >
        {renderAccountAvatar()}
      </button>
    </>
  );

  const StorePageHeader = ({
    title,
    subtitle,
    onBack,
    actionSlot = null,
    secondarySlot = null,
    hideActionsOnMobile = false,
  }) => (
    <div className="bg-white dark:bg-slate-900 sticky top-0 z-20 shrink-0">
      <div className="px-4 lg:px-8 h-14 lg:h-16 flex items-center gap-3 border-b border-slate-100 dark:border-white/8">

        {/* Back o logo en mobile */}
        {onBack ? (
          <button onClick={onBack} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 text-slate-500 shrink-0 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          /* Avatar de tienda — solo mobile, desktop lo tiene el sidebar */
          <div className="lg:hidden w-8 h-8 rounded-xl overflow-hidden shrink-0 bg-brand/10 flex items-center justify-center">
            {tiendaInfo?.foto
              ? <img src={tiendaInfo.foto} alt="" className="w-full h-full object-cover" />
              : <Store className="w-4 h-4 text-brand" />}
          </div>
        )}

        {/* Título + subtítulo */}
        <div className="flex-1 min-w-0">
          <h1 className="font-black text-[15px] lg:text-lg leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-[11px] text-slate-400 font-medium leading-none mt-0.5 truncate hidden lg:block">{subtitle}</p>}
        </div>

        {/* Acciones */}
        <div className={`flex items-center gap-1 shrink-0 ${hideActionsOnMobile ? 'hidden lg:flex' : 'flex'}`}>
          {actionSlot}
          <button
            onClick={toggleTheme}
            className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 text-slate-400 transition-colors hidden lg:inline-flex"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setMoreSheetOpen(v => !v)}
            className="ui-avatar-btn ring-2 ring-transparent hover:ring-brand transition-all shrink-0"
            title="Mi cuenta"
          >
            {renderAccountAvatar()}
          </button>
        </div>
      </div>

      {secondarySlot && (
        <div className="border-b border-slate-100 dark:border-white/8">
          {secondarySlot}
        </div>
      )}
    </div>
  );

  const MATCH_TYPE_META = {
    'exacto-nuevo': {
      label: 'Exacto nuevo',
      desc: 'Original, sellado o sin estrenar',
      Icon: Package,
      tone: 'brand',
    },
    'exacto-usado': {
      label: 'Exacto usado',
      desc: 'Segunda mano, en buenas condiciones',
      Icon: RotateCcw,
      tone: 'brand',
    },
    reacondicionado: {
      label: 'Reacondicionado',
      desc: 'Revisado, reparado o restaurado',
      Icon: Wrench,
      tone: 'brand',
    },
    compatible: {
      label: 'Compatible',
      desc: 'Mismo uso o función, otra marca o modelo',
      Icon: Link2,
      tone: 'violet',
    },
    similar: {
      label: 'Similar',
      desc: 'Parecido, sin asegurar que sea exactamente igual',
      Icon: Copy,
      tone: 'violet',
    },
    imitacion: {
      label: 'Imitación o genérico',
      desc: 'Copia, réplica o versión no original',
      Icon: Tag,
      tone: 'violet',
    },
  };

  const MatchTypeBadge = ({ type, className = '' }) => {
    const meta = MATCH_TYPE_META[type];
    if (!meta) return null;
    const Icon = meta.Icon;
    const toneClass = meta.tone === 'brand'
      ? 'bg-brand/10 text-brand-dark dark:bg-brand/15 dark:text-brand'
      : 'bg-violet-100 text-violet-700 dark:bg-violet-500/10 dark:text-violet-400';
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${toneClass} ${className}`.trim()}>
        <Icon className="w-3.5 h-3.5" />
        {meta.label}
      </span>
    );
  };

  const VENTAJA_TIPS = {
    precio:         'Tu precio es menor o más conveniente que el de la competencia.',
    disponibilidad: 'El producto está en stock y disponible para entrega o retiro inmediato.',
    financiacion:   'Ofrecés cuotas, pago en efectivo diferido u otra forma de financiamiento.',
    combo:          'Incluís un pack, regalo o producto adicional junto con el producto principal.',
  };

  const closeCreateSheet = () => { setCreateSheetClosing(true); setTimeout(() => { setCreateSheetOpen(false); setCreateSheetClosing(false); }, 220); };

  const VENTAJA_OPTS = Object.entries(VENTAJA_CONFIG).map(([id, v]) => ({
    id, label: v.label, Icon: v.Icon, tip: VENTAJA_TIPS[id] ?? '',
    activeClass: `${v.color} text-white border-transparent`,
    badgeClass: `${v.pastel} ${v.iconColor}`,
    iconClass: v.iconColor,
  }));

  const AdvantageBadge = ({ value, compact = false }) => {
    const meta = VENTAJA_OPTS.find(item => item.id === value);
    if (!meta) return null;
    const Icon = meta.Icon;
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-lg font-bold ${meta.badgeClass} ${compact ? 'px-2 py-1 text-[10px]' : 'px-2.5 py-1 text-xs'}`}>
        <Icon className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
        <span>{meta.label}</span>
      </span>
    );
  };

  // ── Match Types — jerarquía de relevancia del producto ────────────────────
  // priority: menor = más relevante (se usa para ordenar respuestas en App.jsx)

  // ── MatchTypeSelector — selector condicional 2 pasos ──────────────────────
  const MatchTypeSelector = ({ value, onChange }) => {
    const step = matchTypeStep;
    const setStep = setMatchTypeStep;
    const select = (v) => { onChange(v); };
    const back = () => { onChange(null); setStep('root'); };

    const btnBase = 'w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.98]';
    const btnActive = (selected, tone = 'brand') => selected
      ? tone === 'brand'
        ? 'border-brand bg-brand/8 dark:bg-brand/10'
        : 'border-violet-400 bg-violet-50 dark:bg-violet-500/10'
      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/4';

    const renderOption = (id) => {
      const meta = MATCH_TYPE_META[id];
      const Icon = meta.Icon;
      const selected = value === id;
      const accent = meta.tone === 'brand'
        ? 'text-brand-dark dark:text-brand'
        : 'text-violet-700 dark:text-violet-400';
      const iconWrap = meta.tone === 'brand'
        ? 'bg-brand/10 text-brand'
        : 'bg-violet-100 text-violet-500 dark:bg-violet-500/10 dark:text-violet-400';

      return (
        <button key={id} onClick={() => select(id)} className={`${btnBase} ${btnActive(selected, meta.tone)}`}>
          <div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconWrap}`}>
            <Icon className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className={`font-bold text-sm ${selected ? accent : 'text-slate-900 dark:text-white'}`}>{meta.label}</p>
            <p className="text-xs text-slate-400 mt-0.5">{meta.desc}</p>
          </div>
          {selected && <CheckCircle className={`w-4 h-4 ml-auto shrink-0 mt-0.5 ${meta.tone === 'brand' ? 'text-brand' : 'text-violet-500'}`} />}
        </button>
      );
    };

    if (step === 'root') return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">¿Cómo coincide tu producto?</p>
        <button className={`${btnBase} ${btnActive(step === 'exacto', 'brand')}`} onClick={() => setStep('exacto')}>
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <CheckCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-white">Tengo exactamente lo que pide</p>
            <p className="text-xs text-slate-400 mt-0.5">El mismo producto, misma marca o especificación</p>
          </div>
        </button>
        <button className={`${btnBase} ${btnActive(step === 'similar', 'violet')}`} onClick={() => setStep('similar')}>
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-500 dark:bg-violet-500/10 dark:text-violet-400">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-white">No es exactamente, pero puede servir</p>
            <p className="text-xs text-slate-400 mt-0.5">Compatible, similar, alternativa o genérico</p>
          </div>
        </button>
      </div>
    );

    if (step === 'exacto') return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={back} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Es el mismo producto — ¿en qué estado?</p>
        </div>
        {['exacto-nuevo', 'exacto-usado', 'reacondicionado'].map(renderOption)}
      </div>
    );

    // similar
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={back} className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
            <ArrowLeft className="w-4 h-4 text-slate-500" />
          </button>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">¿Qué tipo de alternativa es?</p>
        </div>
        {['compatible', 'similar', 'imitacion'].map(renderOption)}
      </div>
    );
  };

  // ── PaywallModal ──────────────────────────────────────────────────────────
  const PaywallModal = () => (
    <PaywallModalUI
      onClose={() => setShowPaywall(false)}
      onPagar={handleRenovar}
      onTransferencia={(plan) => { setTransferenciaPlan(plan); setShowTransferenciaModal(true); setShowPaywall(false); }}
      vencioEl={tiendaData?.suscripcion?.vence ? new Date(tiendaData.suscripcion.vence).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : null}
      renovando={renovando}
      renovError={renovError}
    />
  );
  const _PaywallModalOld = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-6 text-white relative">
          <button onClick={() => setShowPaywall(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center mb-3">
            <Lock className="w-6 h-6 text-rose-400" />
          </div>
          <h2 className="font-black text-xl mb-1">Suscripción vencida</h2>
          <p className="text-slate-300 text-sm">
            {tiendaData?.suscripcion?.vence
              ? `Tu plan venció el ${new Date(tiendaData.suscripcion.vence).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}.`
              : 'Tu plan ha vencido.'}
            {' '}Renovalo para seguir respondiendo demandas.
          </p>
        </div>

        <div className="p-5 space-y-3">
          {/* Plan mensual */}
          <button
            onClick={() => handleRenovar('mensual')}
            disabled={renovando}
            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-200 dark:border-white/10 hover:border-brand dark:hover:border-brand transition-all group"
          >
            <div className="text-left">
              <p className="font-bold text-slate-900 dark:text-white">Plan Mensual</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">1 mes de acceso + 1 de regalo al renovar</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="font-black text-lg text-slate-900 dark:text-white">${PRECIO_MENSUAL.toLocaleString()}</p>
              <p className="text-xs text-slate-400">ARS / mes</p>
            </div>
          </button>

          {/* Plan anual */}
          <button
            onClick={() => handleRenovar('anual')}
            disabled={renovando}
            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-brand dark:border-brand bg-brand/8 dark:bg-brand/8 hover:bg-brand/15 dark:hover:bg-brand/15 transition-all relative"
          >
            <div className="absolute -top-2.5 left-4 bg-brand text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
              AHORRÁS 20%
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-900 dark:text-white">Plan Anual</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Facturado ${PRECIO_ANUAL.toLocaleString()} — 12 meses + 1 de regalo</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="font-black text-lg text-brand-dark dark:text-brand">${PRECIO_ANUAL_MES.toLocaleString()}</p>
              <p className="text-xs text-slate-400">ARS / mes</p>
            </div>
          </button>

          {renovando && (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo a MercadoPago...
            </div>
          )}
          {renovError && (
            <p className="text-rose-500 text-sm text-center">{renovError}</p>
          )}

          <p className="text-center text-slate-400 text-xs pt-1">
            Pago seguro con MercadoPago · Podés cancelar cuando quieras
          </p>
        </div>
      </div>
    </div>
  );

  // ── PremiumModal ──────────────────────────────────────────────────────────
  const PremiumModal = () => (
    <PremiumModalUI
      onClose={() => setShowPremiumModal(false)}
      onUpgrade={() => { setShowPremiumModal(false); handleRenovar('premium'); }}
      renovando={renovando}
    />
  );
  const _PremiumModalOld = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#111827] rounded-3xl w-full max-w-md overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 p-6 text-white relative">
          <button onClick={() => setShowPremiumModal(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" />
          </button>
          <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h2 className="font-black text-xl mb-1">Upgrade a Premium</h2>
          <p className="text-amber-100 text-sm">
            Desbloqueá todo el potencial de tu negocio en Lokal.
          </p>
        </div>

        <div className="p-5 space-y-4">
          {/* Beneficios */}
          <div className="space-y-2">
            {[
              { icon: Infinity, text: 'Productos ilimitados' },
              { icon: TrendingUp, text: 'Prioridad en búsquedas' },
              { icon: Zap, text: 'IA Insights y consejos' },
              { icon: Award, text: 'Badge premium dorada' },
              { icon: MessageSquare, text: 'Búsquedas laborales ilimitadas' },
              { icon: Phone, text: 'Soporte prioritario' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-500/15 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">{text}</span>
              </div>
            ))}
          </div>

          {/* Precio */}
          <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 text-center">
            <p className="text-3xl font-black text-slate-900 dark:text-white">${PRECIO_PREMIUM.toLocaleString()}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">ARS / mes</p>
          </div>

          {/* CTA */}
          <button
            onClick={() => {
              setShowPremiumModal(false);
              handleRenovar('premium');
            }}
            disabled={renovando}
            className="w-full py-3.5 rounded-2xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-lg shadow-amber-500/25 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 inline mr-2" />
            {renovando ? 'Procesando...' : 'Upgrade a Premium'}
          </button>

          <button
            onClick={() => setShowPremiumModal(false)}
            className="w-full py-3 rounded-2xl font-semibold text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
          >
            Ahora no
          </button>
        </div>
      </div>
    </div>
  );

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = () => {
    const expanded = sidebarExpanded;
    const W_COLLAPSED = 64;
    const W_EXPANDED = 224;
    const [tooltip, setTooltip] = React.useState(null);

    const togglePin = () => {
      const next = !expanded;
      setSidebarPinned(next);
      setSidebarExpanded(next);
      localStorage.setItem('lokal-store-sidebar-pinned', String(next));
    };

    const navItems = [
      { label: 'Inicio', icon: Home, id: 'inicio' },
      ...(isEmprendimiento
        ? [{ label: 'Demandas', icon: Package, id: 'feed' }]
        : [{ label: 'Demandas', icon: Package, id: 'feed', newBadge: newDemandasCount }]
      ),
      { label: 'Mensajes', icon: MessageSquare, id: 'mensajes' },
      { label: 'Mis productos', icon: Zap, id: 'productos', badge: misProductos.filter(o => o.activa !== false).length || null },
      ...(isEmpresa ? [{ label: 'Estadísticas', icon: TrendingUp, id: 'stats' }] : []),
      ...(isEmpresa ? [{ label: 'Suscripción', icon: CreditCard, id: 'suscripcion' }] : []),
      { label: isEmprendimiento ? 'Mi perfil' : 'Mi tienda', icon: Store, id: 'perfil' },
      { label: 'Diseño de página', icon: Palette, id: 'mi-pagina' },
    ];

    return (
      <>
      <div
        className="hidden lg:flex lg:flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-white/8 h-screen fixed top-0 left-0 z-[200] overflow-hidden"
        style={{ width: expanded ? W_EXPANDED : W_COLLAPSED, transition: 'width 380ms cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Logo + pin */}
        <div className="border-b border-slate-100 dark:border-white/8 shrink-0">
          <div className={`flex items-center h-14 px-3 overflow-hidden gap-1 ${expanded ? '' : 'justify-center'}`}>
            {expanded && (
              <div className="flex flex-col flex-1 min-w-0 px-1">
                <LogoFull size={16} className="dark:hidden" color="#0B132B" />
                <LogoFull size={16} className="hidden dark:inline-flex" light />
                <p className="text-[10px] text-brand font-semibold mt-0.5 truncate">Panel de tienda</p>
              </div>
            )}
            <button
              onClick={togglePin}
              title={sidebarPinned ? 'Soltar sidebar' : 'Fijar sidebar'}
              className={`ui-chip ui-icon-btn shrink-0 transition-colors ${sidebarPinned ? 'text-primary bg-primary/10' : 'text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/8'}`}
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Botón Crear */}
          <div className="px-3 pb-3">
            <button
              onClick={() => setCreateSheetOpen(true)}
              className="w-full flex items-center bg-primary hover:bg-primary-hover text-white ui-chip transition-colors overflow-hidden"
              style={{ height: 40 }}
            >
              <div className="ui-icon-btn shrink-0">
                <Plus className="w-4 h-4" />
              </div>
              <span
                className="text-sm font-semibold whitespace-nowrap overflow-hidden"
                style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '90ms' : '0ms' }}
              >
                Crear
              </span>
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-2 px-3 overflow-y-auto overflow-x-hidden">
          {navItems.map(({ label, icon: Icon, id, badge, newBadge }) => {
            const isActive = id === 'feed' ? (screen === 'feed' || screen === 'demanda-detail') : screen === id;
            return (
              <button
                key={id}
                onClick={() => { navigateTo(id); setTooltip(null); }}
                onMouseEnter={e => {
                  if (!expanded) {
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltip({ label, y: rect.top + rect.height / 2, badge: newBadge || badge });
                  }
                }}
                onMouseLeave={() => setTooltip(null)}
                className={`w-full flex items-center ui-chip transition-colors overflow-hidden mb-0.5 ${
                  isActive
                    ? 'bg-slate-100 dark:bg-white/8 text-slate-900 dark:text-white font-bold'
                    : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
                style={{ height: 42 }}
              >
                <div className="ui-icon-btn shrink-0 relative">
                  <Icon className="w-4.5 h-4.5" />
                  {newBadge > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-brand text-white text-[7px] font-black rounded-full flex items-center justify-center leading-none">
                      {newBadge > 9 ? '9+' : newBadge}
                    </span>
                  )}
                </div>
                <span
                  className="text-sm font-semibold whitespace-nowrap flex-1 text-left overflow-hidden"
                  style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}
                >
                  {label}
                </span>
                {badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2 shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-200 dark:bg-white/10 text-slate-500 dark:text-slate-400'}`}
                    style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 pb-2 border-t border-slate-100 dark:border-white/8 pt-2 space-y-0.5 shrink-0">
          {isAdmin && (
            <button
              onClick={() => onOpenAdmin?.()}
              onMouseEnter={e => { if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ label: 'Panel Admin', y: r.top + r.height / 2 }); } }}
              onMouseLeave={() => setTooltip(null)}
              className="w-full flex items-center ui-chip text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors overflow-hidden"
              style={{ height: 42 }}
            >
              <div className="ui-icon-btn shrink-0"><ShieldCheck className="w-4.5 h-4.5" /></div>
              <span className="text-sm font-semibold whitespace-nowrap" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}>Panel Admin</span>
            </button>
          )}
          {tiendaInfo.slug && (
            <a
              href={`/t/${tiendaInfo.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              onMouseEnter={e => { if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ label: 'Ver mi tienda', y: r.top + r.height / 2 }); } }}
              onMouseLeave={() => setTooltip(null)}
              className="w-full flex items-center ui-chip text-brand hover:bg-brand/8 dark:hover:bg-brand/10 transition-colors overflow-hidden"
              style={{ height: 42 }}
            >
              <div className="ui-icon-btn shrink-0"><Globe className="w-4.5 h-4.5" /></div>
              <span className="text-sm font-semibold whitespace-nowrap flex-1" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}>Ver mi tienda</span>
              <ExternalLink className="w-3 h-3 mr-2 opacity-50 shrink-0" style={{ opacity: expanded ? 0.5 : 0, transition: 'opacity 160ms ease' }} />
            </a>
          )}
          <button
            onClick={toggleTheme}
            onMouseEnter={e => { if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ label: isDark ? 'Modo claro' : 'Modo oscuro', y: r.top + r.height / 2 }); } }}
            onMouseLeave={() => setTooltip(null)}
            className="w-full flex items-center ui-chip text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300 transition-colors overflow-hidden"
            style={{ height: 42 }}
          >
            <div className="ui-icon-btn shrink-0">
              {isDark ? <Sun className="w-4.5 h-4.5 text-amber-400" /> : <Moon className="w-4.5 h-4.5" />}
            </div>
            <span className="text-sm font-semibold whitespace-nowrap" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}>
              {isDark ? 'Modo claro' : 'Modo oscuro'}
            </span>
          </button>
          {isAdmin && (
            <button
              onClick={toggleMockMode}
              onMouseEnter={e => { if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ label: mockMode ? 'Mock ON' : 'Mock', y: r.top + r.height / 2 }); } }}
              onMouseLeave={() => setTooltip(null)}
              className={`w-full flex items-center ui-chip transition-colors overflow-hidden ${mockMode ? 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20' : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-300'}`}
              style={{ height: 42 }}
            >
              <div className="ui-icon-btn shrink-0"><FlaskConical className="w-4.5 h-4.5" /></div>
              <span className="text-sm font-semibold whitespace-nowrap" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}>
                {mockMode ? 'Mock ON' : 'Datos mock'}
              </span>
            </button>
          )}
          <button
            onClick={onLogout}
            onMouseEnter={e => { if (!expanded) { const r = e.currentTarget.getBoundingClientRect(); setTooltip({ label: 'Salir', y: r.top + r.height / 2 }); } }}
            onMouseLeave={() => setTooltip(null)}
            className="w-full flex items-center ui-chip text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors overflow-hidden"
            style={{ height: 42 }}
          >
            <div className="ui-icon-btn shrink-0"><LogOut className="w-4.5 h-4.5" /></div>
            <span className="text-sm font-semibold whitespace-nowrap" style={{ opacity: expanded ? 1 : 0, transition: 'opacity 160ms ease', transitionDelay: expanded ? '80ms' : '0ms' }}>Salir</span>
          </button>
          <div className="pt-2 flex items-center gap-1.5 px-1" style={{ opacity: expanded ? 0.25 : 0, transition: 'opacity 160ms ease' }}>
            <span className="text-[10px] text-slate-400">por</span>
            <KtrlMark className="h-2.5 text-slate-400" />
          </div>
        </div>
      </div>

      {/* Tooltip flotante */}
      {tooltip && !expanded && (
        <div
          className="fixed z-[9999] pointer-events-none hidden lg:block"
          style={{ left: W_COLLAPSED + 8, top: tooltip.y, transform: 'translateY(-50%)' }}
        >
          <div className="relative flex items-center gap-2 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap">
            <span className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-y-[5px] border-y-transparent border-r-[6px] border-r-slate-900 dark:border-r-slate-700" />
            {tooltip.label}
            {tooltip.badge > 0 && (
              <span className="bg-white/20 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{tooltip.badge}</span>
            )}
          </div>
        </div>
      )}
      </>
    );
  };

  // ── Bottom Nav Mobile ──────────────────────────────────────────────────────
  const BottomNav = () => (screen === 'mi-pagina' || (screen === 'mensajes' && inboxMobileView === 'chat')) ? null : (
    <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-white/8 z-[4500]">
      <div className="flex items-end justify-around px-2 pt-2 pb-3 max-w-md mx-auto">
        <button onClick={() => { navigateTo('productos'); setCreateSheetOpen(false); setCreateSheetClosing(false); }} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${screen === 'productos' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-slate-100 dark:hover:bg-white/8'}`}>
            <Tag className={`w-5 h-5 ${screen === 'productos' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${screen === 'productos' ? 'text-primary' : 'text-slate-400'}`}>Productos</span>
        </button>
        <button onClick={() => { navigateTo('mensajes'); setCreateSheetOpen(false); setCreateSheetClosing(false); }} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${screen === 'mensajes' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-slate-100 dark:hover:bg-white/8'}`}>
            <MessageSquare className={`w-5 h-5 ${screen === 'mensajes' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} />
            {unreadTotal > 0 && screen !== 'mensajes' && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-brand text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-semibold ${screen === 'mensajes' ? 'text-primary' : 'text-slate-400'}`}>Mensajes</span>
        </button>
        <button onClick={() => createSheetOpen ? closeCreateSheet() : setCreateSheetOpen(true)} className="flex flex-col items-center gap-1 min-w-[56px] -mt-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${createSheetOpen ? 'bg-slate-700 dark:bg-slate-600 rotate-45' : 'bg-primary hover:bg-primary-hover'}`}>
            <Plus className="w-7 h-7 text-white" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Crear</span>
        </button>
        <button onClick={() => { navigateTo('perfil'); setCreateSheetOpen(false); setCreateSheetClosing(false); }} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${screen === 'perfil' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-slate-100 dark:hover:bg-white/8'}`}>
            <Store className={`w-5 h-5 ${screen === 'perfil' ? 'text-primary' : 'text-slate-500 dark:text-slate-400'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${screen === 'perfil' ? 'text-primary' : 'text-slate-400'}`}>{isEmprendimiento ? 'Mi perfil' : 'Mi tienda'}</span>
        </button>
        <button onClick={() => setMoreSheetOpen(v => !v)} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/8 transition-colors">
            <Menu className="w-5 h-5 text-slate-500 dark:text-slate-400" />
          </div>
          <span className="text-[10px] font-semibold text-slate-400">Más</span>
        </button>
      </div>
    </div>
  );

  const markFeedSeen = () => {
    localStorage.setItem(LAST_FEED_KEY, String(Date.now()));
    setNewDemandasCount(0);
  };


  // ── Feed de demandas + Respuestas (fusionado) ─────────────────────────────
  const FeedScreen = () => {
    useEffect(() => { markFeedSeen(); }, []);

    const nuevasCount     = demandas.filter(d => !yaRespondio(d.id)).length;
    const respondídasCount = demandas.filter(d =>  yaRespondio(d.id)).length;
    const activeFilters   = (feedEstado !== 'todas' ? 1 : 0) + (filterRubro !== 'todas' ? 1 : 0) + (feedSort !== 'recientes' ? 1 : 0);

    const SORT_OPTIONS = [
      { value: 'recientes',   label: 'Más recientes' },
      { value: 'presupuesto', label: 'Mayor presupuesto' },
      { value: 'urgentes',    label: 'Urgentes primero' },
    ];

    // ── Sidebar Filtros (desktop) ─────────────────────────────────────────
    const FilterSidebar = () => (
      <aside className="hidden lg:flex flex-col w-56 xl:w-64 shrink-0 border-r border-slate-200 dark:border-white/8 bg-white dark:bg-slate-900 overflow-y-auto">
        <div className="p-4 space-y-5">

          {/* Tab demandas / mis respuestas */}
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Vista</p>
            <div className="flex flex-col gap-1">
              {[
                { value: 'feed',       label: 'Demandas',      icon: <Package className="w-3.5 h-3.5" />, count: demandas.length },
                { value: 'respuestas', label: 'Mis respuestas', icon: <MessageSquare className="w-3.5 h-3.5" />, count: misRespuestas.length },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setFeedTab(opt.value)}
                  className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all text-left ${feedTab === opt.value ? 'bg-brand/10 text-brand dark:text-brand' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                >
                  <span className="flex items-center gap-2">{opt.icon}{opt.label}</span>
                  {opt.count > 0 && <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${feedTab === opt.value ? 'bg-brand/15 text-brand' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>{opt.count}</span>}
                </button>
              ))}
            </div>
          </div>

          {feedTab === 'feed' && (
            <>
              {/* Estado */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Estado</p>
                <div className="flex flex-col gap-0.5">
                  {[
                    { value: 'todas',       label: 'Todas',       count: demandas.length },
                    { value: 'nuevas',      label: 'Sin responder', count: nuevasCount },
                    { value: 'respondidas', label: 'Respondidas',  count: respondídasCount },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFeedEstado(opt.value)}
                      className={`flex items-center justify-between gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all text-left ${feedEstado === opt.value ? 'bg-brand/10 text-brand' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                      <span className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${opt.value === 'nuevas' ? 'bg-amber-400' : opt.value === 'respondidas' ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`} />
                        {opt.label}
                      </span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-lg ${feedEstado === opt.value ? 'bg-brand/15 text-brand' : 'bg-slate-100 dark:bg-white/10 text-slate-500'}`}>{opt.count}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ordenar */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ordenar</p>
                <div className="flex flex-col gap-0.5">
                  {SORT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFeedSort(opt.value)}
                      className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all text-left ${feedSort === opt.value ? 'bg-brand/10 text-brand' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-60" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Categorías */}
              {categoriasFeed.length > 0 && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Categoría</p>
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => setFilterRubro('todas')}
                      className={`w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all text-left ${filterRubro === 'todas' ? 'bg-brand/10 text-brand' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                    >Todas</button>
                    {categoriasFeed.map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setFilterRubro(filterRubro === cat.id ? 'todas' : cat.id)}
                        className={`flex items-center gap-2 w-full px-3 py-2 rounded-xl text-sm font-semibold transition-all text-left ${filterRubro === cat.id ? 'bg-brand/10 text-brand' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >
                        <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                        {cat.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear */}
              {activeFilters > 0 && (
                <button
                  onClick={() => { setFeedEstado('todas'); setFilterRubro('todas'); setFeedSort('recientes'); }}
                  className="w-full text-center text-xs font-bold text-slate-400 hover:text-danger transition-colors py-1"
                >
                  Limpiar filtros
                </button>
              )}
            </>
          )}
        </div>
      </aside>
    );

    // ── Card demanda ──────────────────────────────────────────────────────
    const DemandaCard = ({ d }) => {
      const respondida = yaRespondio(d.id);
      return (
        <div
          onClick={() => { setSelectedDemanda(d); setMatchTypeStep('root'); setChatMsgs([]); setChatTexto(''); setScreen('demanda-detail'); }}
          className={`bg-white dark:bg-slate-900 rounded-3xl border-2 p-5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] group ${d.urgente ? 'border-danger/20 dark:border-danger/20' : respondida ? 'border-brand/15 dark:border-brand/20' : 'border-slate-100 dark:border-white/10'}`}
        >
          <div className="flex gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl flex items-center justify-center overflow-hidden">
                {(d.fotos?.[0] || d.foto)
                  ? <img src={d.fotos?.[0] || d.foto} alt="" className="w-full h-full object-cover" />
                  : <Package className="w-7 h-7 text-amber-400" />}
              </div>
              {d.urgente && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-danger rounded-full flex items-center justify-center shadow-sm">
                  <Zap className="w-3 h-3 text-white fill-white" />
                </span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-bold leading-tight">{d.titulo}</h3>
                {respondida
                  ? <span className="flex items-center gap-1 text-xs font-bold text-brand-dark dark:text-brand bg-brand/8 px-2.5 py-1 rounded-xl shrink-0"><CheckCircle className="w-3 h-3" /> Respondida</span>
                  : d.urgente
                    ? <span className="flex items-center gap-1 text-xs font-bold text-danger bg-danger/8 px-2.5 py-1 rounded-xl shrink-0"><Zap className="w-3 h-3" /> Urgente</span>
                    : <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2.5 py-1 rounded-xl shrink-0">Nueva</span>
                }
              </div>
              {d.descripcion && <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">{d.descripcion}</p>}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400">{d.tiempoCreado}</span>
                {d.presupuesto?.max && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-brand-dark dark:text-brand bg-brand/8 px-2 py-0.5 rounded-lg">
                    <span className="text-[10px]">hasta</span> ${d.presupuesto.max.toLocaleString()}
                  </span>
                )}
                {(d.categorias || []).slice(0, 2).map(c => (
                  <span key={c} className="text-xs bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg">{c}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="flex items-center gap-1 text-xs font-bold text-brand">
              {respondida ? 'Ver respuesta' : 'Responder'} <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
        </div>
      );
    };

    // ── Card mis respuestas ───────────────────────────────────────────────
    const RespuestaCard = ({ r }) => {
      const demandaObj = demandas.find(d => String(d.id) === String(r.demandaId));
      const hasChat    = r.mensajes?.length > 0;
      const aceptada   = r.estado === 'aceptada';
      return (
        <div className={`bg-white dark:bg-slate-900 rounded-3xl border-2 p-5 transition-all ${aceptada ? 'border-ok/20' : 'border-slate-100 dark:border-white/10'}`}>
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-bold leading-tight truncate">{r.demandaTitulo || 'Demanda'}</h3>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {aceptada && (
                <span className="flex items-center gap-1 text-xs font-bold text-ok bg-ok/8 px-2.5 py-1 rounded-xl">
                  <CheckCircle className="w-3 h-3" /> Aceptada
                </span>
              )}
              <span className="text-xs text-slate-400">{r.tiempoRespuesta || 'Reciente'}</span>
            </div>
          </div>
          {r.matchType && <MatchTypeBadge type={r.matchType} className="mb-2" />}
          <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 rounded-2xl px-4 py-3 mb-3 leading-relaxed line-clamp-3">{r.mensaje}</p>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {r.precio && (
                <p className="font-bold text-brand-dark dark:text-brand text-sm">$ {r.precio.toLocaleString()}</p>
              )}
              {hasChat && (
                <span className="flex items-center gap-1 text-xs text-brand font-semibold bg-brand/8 px-2.5 py-1 rounded-xl">
                  <MessageSquare className="w-3.5 h-3.5" /> {r.mensajes.length} mensajes
                </span>
              )}
            </div>
            {demandaObj && (
              <button
                onClick={() => { setSelectedDemanda(demandaObj); setMatchTypeStep('root'); setScreen('demanda-detail'); }}
                className="flex items-center gap-1 text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300 hover:bg-brand/10 hover:text-brand transition-colors px-3 py-1.5 rounded-xl"
              >
                Ver demanda <ChevronRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      );
    };

    return (
      <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden">
        {/* Header */}
        <StorePageHeader
          title="Demandas"
          subtitle={`${demandas.length} solicitud${demandas.length !== 1 ? 'es' : ''} · ${nuevasCount} sin responder`}
          actionSlot={(
            <>
              {newDemandasCount > 0 && (
                <span className="hidden sm:flex items-center gap-1 text-xs font-bold text-warn bg-warn/10 px-2.5 py-1.5 rounded-xl">
                  <Zap className="w-3 h-3" /> {newDemandasCount} nuevas
                </span>
              )}
              <button onClick={fetchDemandas} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 text-slate-400 transition-colors" title="Actualizar">
                <RotateCcw className="w-4 h-4" />
              </button>
            </>
          )}
          secondarySlot={
            <div className="lg:hidden flex gap-1 px-4 py-2">
              {[
                { value: 'feed',       label: 'Demandas',       count: demandas.length },
                { value: 'respuestas', label: 'Mis respuestas',  count: misRespuestas.length },
              ].map(t => (
                <button
                  key={t.value}
                  onClick={() => setFeedTab(t.value)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-sm font-bold transition-all ${feedTab === t.value ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}
                >
                  {t.label}
                  {t.count > 0 && <span className={`text-[10px] font-black px-1.5 rounded-lg ${feedTab === t.value ? 'bg-white/20' : 'bg-slate-200 dark:bg-white/10'}`}>{t.count}</span>}
                </button>
              ))}
            </div>
          }
        />

        {/* Body */}
        <div className="flex-1 flex min-h-0">
          <FilterSidebar />
          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {/* Toolbar */}
            <div className="shrink-0 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/8 px-4 lg:px-5 py-3 flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-100 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
              {/* Sort (mobile) */}
              {feedTab === 'feed' && (
                <div className="lg:hidden relative group">
                  <button className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-all border ${feedSort !== 'recientes' ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 dark:border-white/10 text-slate-500'}`}>
                    <ArrowUpDown className="w-4 h-4" />
                    <span className="hidden sm:inline">{SORT_OPTIONS.find(o => o.value === feedSort)?.label}</span>
                  </button>
                  <div className="hidden group-focus-within:block absolute right-0 top-full mt-1 bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 z-30 w-48 py-1 animate-dropdown-in">
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.value}
                        onClick={() => setFeedSort(opt.value)}
                        className={`w-full text-left px-4 py-2.5 text-sm font-semibold transition-colors ${feedSort === opt.value ? 'text-brand bg-brand/5' : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                      >{opt.label}</button>
                    ))}
                  </div>
                </div>
              )}
              {/* Estado chips mobile */}
              {feedTab === 'feed' && (
                <div className="lg:hidden flex gap-1.5 overflow-x-auto scrollbar-hide">
                  {[
                    { value: 'todas', label: 'Todas' },
                    { value: 'nuevas', label: 'Sin responder' },
                    { value: 'respondidas', label: 'Respondidas' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setFeedEstado(opt.value)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${feedEstado === opt.value ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500'}`}
                    >{opt.label}</button>
                  ))}
                </div>
              )}
              <span className="ml-auto text-xs text-slate-400 font-semibold shrink-0">
                {feedTab === 'feed' ? demandasFiltradas.length : misRespuestas.length}
              </span>
            </div>

            {/* Category chips (feed tab) */}
            {feedTab === 'feed' && categoriasFeed.length > 0 && (
              <div className="shrink-0 flex gap-2 px-4 lg:px-5 py-2.5 overflow-x-auto scrollbar-hide border-b border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900">
                <button
                  onClick={() => setFilterRubro('todas')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${filterRubro === 'todas' ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'}`}
                >Todas</button>
                {categoriasFeed.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setFilterRubro(filterRubro === cat.id ? 'todas' : cat.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${filterRubro === cat.id ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-slate-200'}`}
                  >
                    <CategoryIcon name={cat.icon} className="w-3 h-3" />
                    {cat.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">
              {feedTab === 'feed' ? (
                <div className="max-w-3xl mx-auto px-4 lg:px-6 py-5 space-y-3">
                  {loading ? (
                    <SkeletonFeed count={4} />
                  ) : demandasFiltradas.length === 0 ? (
                    <div className="text-center py-16">
                      <Package className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                      <p className="font-semibold text-slate-400">{searchQuery ? 'Sin resultados para tu búsqueda' : 'No hay demandas activas'}</p>
                      {activeFilters > 0 && (
                        <button
                          onClick={() => { setFeedEstado('todas'); setFilterRubro('todas'); setFeedSort('recientes'); setSearchQuery(''); }}
                          className="mt-3 text-sm font-bold text-brand hover:underline"
                        >Limpiar filtros</button>
                      )}
                      <button onClick={fetchDemandas} className="mt-4 px-5 py-2.5 bg-slate-100 dark:bg-white/5 rounded-xl font-semibold text-sm block mx-auto">Actualizar</button>
                    </div>
                  ) : (
                    demandasFiltradas.map(d => <DemandaCard key={d.id} d={d} />)
                  )}
                </div>
              ) : (
                <div className="max-w-3xl mx-auto px-4 lg:px-6 py-5 space-y-3">
                  {misRespuestas.length === 0 ? (
                    <div className="text-center py-16">
                      <MessageSquare className="w-12 h-12 text-slate-200 dark:text-slate-700 mx-auto mb-3" />
                      <p className="font-semibold text-slate-400">Todavía no respondiste ninguna demanda</p>
                      <button onClick={() => setFeedTab('feed')} className="mt-4 px-5 py-2.5 bg-brand text-white rounded-xl font-semibold text-sm">Ver demandas activas</button>
                    </div>
                  ) : (
                    misRespuestas.map(r => <RespuestaCard key={r.id} r={r} />)
                  )}
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    );
  };

  // ── Chat thread (seguimiento post-respuesta) ──────────────────────────────
  const ChatThread = ({ respuestaId, initialMessages }) => {
    const msgs = chatMsgs.length > 0 ? chatMsgs : initialMessages;
    const setMsgs = setChatMsgs;
    const texto = chatTexto;
    const setTexto = setChatTexto;
    const sending = chatSending;
    const setSending = setChatSending;
    const bottomRef = chatBottomRef;

    useEffect(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [msgs]);

    const send = async () => {
      const t = texto.trim();
      if (!t || sending) return;
      setSending(true);
      setTexto('');
      try {
        const res = await apiFetch(`${API_BASE}/respuestas`, {
          method: 'PATCH',
          authRequired: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ respuestaId: String(respuestaId), texto: t, rol: 'tienda' }),
        });
        if (res.ok) {
          const data = await res.json();
          setMsgs(prev => [...prev, data.msg]);
        }
      } catch { /* silencioso */ } finally {
        setSending(false);
      }
    };

    return (
      <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5">
        <h3 className="font-bold mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-brand" /> Seguimiento
        </h3>

        {msgs.length === 0 && (
          <p className="text-xs text-slate-400 mb-4 text-center">Podés agregar un mensaje de seguimiento al cliente.</p>
        )}

        <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
          {msgs.map(m => (
            <div key={m.id} className={`flex ${m.rol === 'tienda' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                m.rol === 'tienda'
                  ? 'bg-brand/15 dark:bg-brand/20 text-brand-dark dark:text-brand rounded-br-sm'
                  : 'bg-slate-100 dark:bg-white/8 text-slate-700 dark:text-slate-300 rounded-bl-sm'
              }`}>
                {m.texto}
                <p className="text-[10px] opacity-50 mt-1 text-right">{m.creadoEn ? new Date(m.creadoEn).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : ''}</p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <div className="flex gap-2">
          <input
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Mensaje de seguimiento..."
            className="flex-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-2.5 text-sm outline-none focus:border-brand transition-colors"
          />
          <button
            onClick={send}
            disabled={!texto.trim() || sending}
            className="w-10 h-10 bg-brand hover:bg-brand-dark disabled:opacity-40 text-white rounded-2xl flex items-center justify-center shrink-0 transition-colors"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>
    );
  };

  // ── Detalle demanda + responder ────────────────────────────────────────────
  const DemandaDetailScreen = () => {
    const respondida = yaRespondio(selectedDemanda?.id);
    const miRespuesta = misRespuestas.find(r => String(r.demandaId) === String(selectedDemanda?.id));

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 lg:pb-8">
        <StorePageHeader title="Detalle de demanda" subtitle="Respondé para conectar con el cliente" onBack={() => setScreen('feed')} />

        <div className="max-w-2xl mx-auto p-5 space-y-5">
          {/* Info demanda */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 overflow-hidden">
            {(() => {
              const imgs = selectedDemanda?.fotos?.length ? selectedDemanda.fotos : selectedDemanda?.foto ? [selectedDemanda.foto] : [];
              return imgs.length ? <StorePhotoCarousel photos={imgs} /> : null;
            })()}
            <div className="p-6">
              <h2 className="font-bold text-xl mb-1">{selectedDemanda?.titulo}</h2>
              {selectedDemanda?.descripcion && (
                <p className="text-sm text-slate-500 mb-3 leading-relaxed">{selectedDemanda.descripcion}</p>
              )}
              {selectedDemanda?.presupuesto && (
                <div className="inline-flex items-center gap-1.5 bg-brand/8 text-brand-dark px-3 py-1.5 rounded-xl text-sm font-semibold">
                  Presupuesto: ${selectedDemanda.presupuesto.min?.toLocaleString() || '?'} - ${selectedDemanda.presupuesto.max?.toLocaleString() || '?'}
                </div>
              )}
            </div>
          </div>

          {/* Mi respuesta previa */}
          {respondida && miRespuesta && (
            <div className="bg-brand/8 border-2 border-brand/25 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-brand-dark" />
                <h3 className="font-bold text-brand-dark">Tu respuesta enviada</h3>
              </div>
              {miRespuesta.matchType && <MatchTypeBadge type={miRespuesta.matchType} className="mb-3" />}
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-2xl p-4 mb-3 leading-relaxed">{miRespuesta.mensaje}</p>
              {miRespuesta.precio && (
                <p className="text-lg font-bold text-brand-dark">Precio ofrecido: ${miRespuesta.precio.toLocaleString()}</p>
              )}
              <p className="text-xs text-slate-400 mt-2">{miRespuesta.tiempoRespuesta || 'Enviada recientemente'}</p>
            </div>
          )}

          {/* Formulario de respuesta */}
          {!respondida && !isActiva && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-rose-200 dark:border-rose-500/30 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/15 flex items-center justify-center shrink-0">
                  <Lock className="w-5 h-5 text-rose-500" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Suscripción requerida</h3>
                  <p className="text-xs text-slate-500">Tu plan venció. Renovalo para responder.</p>
                </div>
              </div>
              <button
                onClick={() => setShowPaywall(true)}
                className="w-full py-3 bg-brand hover:bg-brand-light text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Zap className="w-4 h-4" /> Renovar suscripción
              </button>
            </div>
          )}

          {!respondida && isActiva && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5">
              <h3 className="font-bold text-lg mb-4">Responder a esta demanda</h3>

              {submitOk && (
                <div className="bg-brand/8 border border-brand/25 rounded-2xl p-4 flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-brand-dark shrink-0" />
                  <p className="text-sm font-semibold text-brand-dark">Respuesta enviada correctamente</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Tipo de match */}
                <MatchTypeSelector value={matchType} onChange={setMatchType} />

                {/* Mensaje */}
                <div>
                  <label className="block font-semibold text-sm mb-2">Tu mensaje *</label>
                  <textarea
                    rows={3}
                    value={msgRespuesta}
                    onChange={e => setMsgRespuesta(e.target.value)}
                    placeholder="Contale al cliente qué tenés, el estado del producto, disponibilidad, etc."
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-white rounded-2xl focus:outline-none focus:border-brand resize-none text-sm transition-colors"
                  />
                </div>

                {/* Fotos / Videos del producto */}
                <div>
                  <label className="block font-semibold text-sm mb-2">
                    Fotos o video del producto
                    <span className="font-normal text-slate-400 ml-1">(opcional · hasta 4)</span>
                  </label>

                  <div className="grid grid-cols-4 gap-2">
                    {adjuntosRespuesta.map((a, idx) => (
                      <div key={idx} className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 dark:bg-white/8 group">
                        {a.type === 'video'
                          ? (
                            <video src={a.preview} className="w-full h-full object-cover" muted playsInline />
                          ) : (
                            <img src={a.preview} alt="" className="w-full h-full object-cover" />
                          )
                        }
                        {/* Badge tipo */}
                        {a.type === 'video' && (
                          <div className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                            VIDEO
                          </div>
                        )}
                        {/* Remove */}
                        <button
                          type="button"
                          onClick={() => removeAdjunto(idx)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}

                    {adjuntosRespuesta.length < 4 && (
                      <button
                        type="button"
                        onClick={() => adjuntosInputRef.current?.click()}
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-white/15 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-brand hover:text-brand dark:hover:text-brand transition-colors"
                      >
                        <Camera className="w-5 h-5" />
                        <span className="text-[10px] font-medium leading-none">Foto/Video</span>
                      </button>
                    )}
                  </div>

                  {/* Input oculto — acepta foto y video, con captura de cámara en móvil */}
                  <input
                    ref={adjuntosInputRef}
                    type="file"
                    accept="image/*,video/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={handleAdjuntosChange}
                  />

                  <p className="text-xs text-slate-400 mt-1.5">
                    En móvil: podés tomar foto o grabar video en el momento con la cámara
                  </p>
                </div>

                {/* Precio */}
                <div>
                  <label className="block font-semibold text-sm mb-2">Precio <span className="font-normal text-slate-400">(opcional)</span></label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">$</span>
                    <input
                      type="number"
                      value={precioRespuesta}
                      onChange={e => setPrecioRespuesta(e.target.value)}
                      placeholder="0"
                      className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-white rounded-2xl focus:outline-none focus:border-brand transition-colors"
                    />
                  </div>
                </div>

                {submitError && (
                  <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                    <p className="text-sm text-rose-700 dark:text-rose-400">{submitError}</p>
                  </div>
                )}

                <button onClick={handleResponder} disabled={!msgRespuesta.trim() || respondiendo}
                  className="w-full py-4 bg-slate-900 dark:bg-brand text-white rounded-2xl font-bold disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-brand-light transition-colors">
                  {respondiendo
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> {adjuntosRespuesta.length > 0 ? 'Subiendo archivos...' : 'Enviando...'}</>
                    : <><Send className="w-5 h-5" /> Enviar respuesta</>
                  }
                </button>
              </div>
            </div>
          )}

          {/* ── Chat de seguimiento ────────────────────────────────────── */}
          {respondida && miRespuesta && (
            <ChatThread
              respuestaId={miRespuesta.id}
              initialMessages={miRespuesta.mensajes || []}
            />
          )}
        </div>
      </div>
    );
  };

  // ── Mensajes ───────────────────────────────────────────────────────────────
  const inboxSendReply = async () => {
    const text = inboxReply.trim();
    const storeId = tienda?.id || tiendaData?.id;
    const convo = inboxConvos.find(c => c.key === inboxSelectedKey);
    if (!text && !chatAttachment) return;
    if (!storeId || !convo) return;
    // Modo edición: actualiza el mensaje localmente
    if (editingMsg) {
      setInboxConvos(prev => prev.map(c => c.key === inboxSelectedKey
        ? { ...c, messages: c.messages.map(m => (m.id || m.ts) === editingMsg.id ? { ...m, text } : m) }
        : c
      ));
      setInboxReply('');
      setEditingMsg(null);
      return;
    }
    setInboxSending(true);
    const attachment = chatAttachment;
    const imageUrl = chatImagePreview;
    const optimistic = { id: `opt-${Date.now()}`, from: String(storeId), text: text || '', ...(attachment ? { attachment } : {}), ...(imageUrl ? { imageUrl } : {}), ts: new Date().toISOString() };
    setInboxConvos(prev => prev.map(c => c.key === inboxSelectedKey
      ? { ...c, messages: [...c.messages, optimistic], lastMessage: optimistic }
      : c
    ));
    setInboxReply('');
    setChatAttachment(null);
    setChatImagePreview(null);
    setAttachOpen(false);
    try {
      await apiFetch(`${API_BASE}/messages`, {
        method: 'POST', authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storeId: String(storeId), partnerUid: convo.partnerUid, text: text || '', ...(attachment ? { attachment } : {}) }),
      });
    } catch { /* optimistic ya aplicado */ } finally {
      setInboxSending(false);
    }
  };

  // Auto-scroll al fondo del chat cuando cambia la convo o llegan/envían mensajes
  const _selectedMsgs = inboxConvos.find(c => c.key === inboxSelectedKey)?.messages;
  useEffect(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const isMobile = window.innerWidth < 1024;
        const el = isMobile ? inboxMobileScrollRef.current : inboxScrollRef.current;
        if (el) el.scrollTop = el.scrollHeight;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inboxSelectedKey, _selectedMsgs]);

  const AVATAR_COLORS = ['bg-violet-500','bg-brand','bg-emerald-500','bg-amber-500','bg-rose-500','bg-sky-500'];
  const avatarColor = (uid) => AVATAR_COLORS[(uid?.charCodeAt(0) || 0) % AVATAR_COLORS.length];
  const clientLabel = (uid) => uid ? `Cliente ···${uid.slice(-5)}` : 'Cliente';
  const fmtTime = (ts) => {
    if (!ts) return '';
    const d = new Date(ts), now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString('es', { day: 'numeric', month: 'short' });
  };

  // ── allThreads: normalización del inbox unificado (fuera de MensajesScreen para respetar Rules of Hooks) ──
  const _storeId = String(tienda?.id || tiendaData?.id || '');
  const allThreads = useMemo(() => {
    return inboxConvos.map(c => {
      const ctx = c.context; // { type:'context', origin, demandaId, demandaTitulo, productoId, productoTitulo, laboralId, laboralTitulo, cvData, ... }
      const origin = ctx?.origin || 'directa';

      // Determinar tipo visual
      const type = origin === 'demanda' ? 'demanda'
        : origin === 'producto'  ? 'producto'
        : origin === 'laboral'   ? 'laboral'
        : origin === 'cv'        ? 'cv'
        : 'chat';

      // Subtítulo contextual
      const subtitle = origin === 'demanda'  ? (ctx.demandaTitulo  || 'Demanda del marketplace')
        : origin === 'producto' ? `Producto: ${ctx.productoTitulo || ''}`.trim()
        : origin === 'laboral'  ? `Búsqueda: ${ctx.laboralTitulo  || ''}`.trim()
        : origin === 'cv'       ? `CV: ${ctx.cvData?.nombre        || 'Candidato'}`
        : 'Consulta directa';

      const lastNonCtx = [...(c.messages || [])].reverse().find(m => m.attachment?.type !== 'context' || m.text);
      const lastText = lastNonCtx?.text || c.lastMessage?.text || (c.lastMessage?.attachment ? '📎 adjunto' : '');

      return {
        key: c.key,
        type,
        partnerUid: c.partnerUid,
        title: clientLabel(c.partnerUid),
        subtitle,
        lastText,
        lastTs: c.lastMessage?.ts,
        unread: (!closedConvos.has(c.key) && c.lastMessage?.from !== _storeId) ? (c.count || 0) : 0,
        repliedByStore: c.lastMessage?.from === _storeId,
        closed: closedConvos.has(c.key),
        // campos contextuales
        demandaId:     ctx?.demandaId,
        demandaTitulo: ctx?.demandaTitulo,
        productoId:    ctx?.productoId,
        productoTitulo:ctx?.productoTitulo,
        laboralId:     ctx?.laboralId,
        laboralTitulo: ctx?.laboralTitulo,
        cvData:        ctx?.cvData,
        price:         ctx?.precio,
        matchType:     ctx?.matchType,
        raw: c,
      };
    }).sort((a, b) => new Date(b.lastTs || 0) - new Date(a.lastTs || 0));
  }, [inboxConvos, closedConvos, _storeId]);

  const unreadTotal = allThreads.filter(t => !t.closed && t.unread > 0).length;

  const MensajesScreen = () => {
    const storeId = _storeId;

    const TYPE_META = {
      chat:     { label: 'Chat',     color: 'bg-blue-500',    textColor: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-500/10',       Icon: MessageSquare },
      demanda:  { label: 'Demanda',  color: 'bg-amber-500',   textColor: 'text-amber-600 dark:text-amber-400',     bg: 'bg-amber-50 dark:bg-amber-500/10',     Icon: Package       },
      producto: { label: 'Producto', color: 'bg-violet-500',  textColor: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-500/10',   Icon: Tag           },
      laboral:  { label: 'Laboral',  color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', Icon: Zap           },
      cv:       { label: 'CV',       color: 'bg-teal-500',    textColor: 'text-teal-600 dark:text-teal-400',       bg: 'bg-teal-50 dark:bg-teal-500/10',       Icon: Award         },
      directa:  { label: 'Consulta', color: 'bg-blue-500',    textColor: 'text-blue-600 dark:text-blue-400',       bg: 'bg-blue-50 dark:bg-blue-500/10',       Icon: MessageSquare },
    };

    const FILTERS = [
      { id: 'todos',    label: 'Todos',    types: null },
      { id: 'chats',    label: 'Chats',    types: ['chat', 'directa'] },
      { id: 'contexto', label: 'Con contexto', types: ['demanda', 'producto', 'laboral', 'cv'] },
    ];

    const q = inboxSearch.toLowerCase();
    const activeFilter = FILTERS.find(f => f.id === msgFilter);
    const matchesFilter = (t) => {
      if (activeFilter?.types && !activeFilter.types.includes(t.type)) return false;
      if (q) return t.title.toLowerCase().includes(q) || t.lastText.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q);
      return true;
    };
    const visibleThreads  = allThreads.filter(t => !t.closed && matchesFilter(t));
    const archivedThreads = allThreads.filter(t =>  t.closed && matchesFilter(t));

    const toggleClose = (key) => {
      setClosedConvos(prev => {
        const next = new Set(prev);
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
      });
    };

    const selectedConvo = inboxConvos.find(c => c.key === inboxSelectedKey) || null;
    const selectedThread = allThreads.find(t => t.key === inboxSelectedKey) || null;
    const messages = selectedConvo?.messages || [];

    // ── Panel izquierdo ────────────────────────────────────────────────────
    const ThreadList = () => (
      <div className="flex flex-col h-full bg-white dark:bg-slate-900">
        {/* Header — solo visible en desktop (mobile usa StorePageHeader) */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/8 shrink-0">
          <div className="hidden lg:flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-base">Comunicaciones</h2>
              {unreadTotal > 0 && (
                <span className="bg-brand text-white text-[10px] font-black px-1.5 py-0.5 rounded-full leading-none">
                  {unreadTotal}
                </span>
              )}
            </div>
            <button onClick={fetchInbox} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 text-slate-400" title="Actualizar">
              <RotateCcw className={`w-4 h-4 ${inboxLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Toolbar: búsqueda + filtro tipo */}
          <div className="flex items-center gap-2 mt-1">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input value={inboxSearch} onChange={e => setInboxSearch(e.target.value)}
                placeholder="Buscar conversación..."
                className="w-full pl-8 pr-8 py-2 bg-slate-50 dark:bg-white/5 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand transition-all border border-transparent focus:border-brand/20" />
              {inboxSearch && <button onClick={() => setInboxSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-3 h-3" /></button>}
            </div>

            {/* Filtro tipo — dropdown igual que sort de productos */}
            <div className="relative group shrink-0">
              <button className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${msgFilter !== 'todos' ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-white/8 text-slate-500'}`}
                title="Filtrar por tipo">
                <ListFilter className="w-3.5 h-3.5" />
              </button>
              <div className="absolute right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50 min-w-[170px] hidden group-focus-within:block animate-dropdown-in">
                {FILTERS.map(f => {
                  const count = allThreads.filter(t => !t.closed && t.unread > 0 && (!f.types || f.types.includes(t.type))).length;
                  return (
                    <button key={f.id} onClick={() => setMsgFilter(f.id)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors text-left ${msgFilter === f.id ? 'bg-slate-50 dark:bg-white/5 font-bold text-brand' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                      {msgFilter === f.id && <CheckCircle className="w-3 h-3 text-brand shrink-0" />}
                      <span className={msgFilter === f.id ? '' : 'pl-4'}>{f.label}</span>
                      {count > 0 && <span className="ml-auto text-[9px] font-black bg-brand/10 text-brand px-1.5 py-0.5 rounded-full">{count}</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto flex flex-col">
          {/* Barra de progreso top cuando recarga con datos ya visibles */}
          {inboxLoading && visibleThreads.length > 0 && (
            <div className="top-progress" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
          )}
          <div className="flex-1 divide-y divide-slate-50 dark:divide-white/5">
          {inboxLoading && visibleThreads.length === 0 ? (
            <div className="px-3 pt-3"><SkeletonInbox count={6} /></div>
          ) : visibleThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-white/8 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="font-bold text-slate-500 dark:text-slate-400">
                {inboxSearch ? 'Sin resultados' : 'Sin comunicaciones'}
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {inboxSearch ? 'Probá con otro término.' : 'Los chats de clientes y respuestas a demandas aparecerán acá.'}
              </p>
            </div>
          ) : <div className="stagger-in">{visibleThreads.map((t, idx) => {
            const meta = TYPE_META[t.type] || TYPE_META.chat;
            const isSelected = t.key === inboxSelectedKey;
            const TypeIcon = meta.Icon;

            return (
              <div key={t.key}
                className={`group relative flex items-start gap-3 px-4 py-3.5 lg:px-5 lg:py-4 transition-colors cursor-pointer border-l-2 ${isSelected ? 'bg-brand/8 dark:bg-brand/12 border-brand' : t.unread > 0 ? 'border-brand/60' : 'border-transparent hover:bg-slate-50 dark:hover:bg-white/5'}`}
                onClick={() => { setInboxSelectedKey(t.key); setInboxMobileView('chat'); }}>

                {/* Avatar */}
                <div className="relative shrink-0 mt-0.5">
                  <div className={`w-12 h-12 rounded-2xl ${t.partnerUid ? avatarColor(t.partnerUid) : meta.bg} flex items-center justify-center font-bold text-sm text-white`}>
                    {t.partnerUid ? (t.partnerUid || 'C').slice(-2).toUpperCase() : <TypeIcon className="w-5 h-5 text-white" />}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${meta.color} border-2 border-white dark:border-slate-900 flex items-center justify-center shadow-sm`}>
                    <TypeIcon className="w-2.5 h-2.5 text-white" />
                  </div>
                </div>

                {/* Contenido */}
                <div className="flex-1 min-w-0">
                  {/* Fila 1: título */}
                  <p className={`text-sm leading-tight truncate mb-1 ${t.unread > 0 ? 'font-bold text-slate-900 dark:text-white' : 'font-semibold text-slate-700 dark:text-slate-200'}`}>
                    {t.title}
                  </p>

                  {/* Fila 2: chip tipo + subtítulo */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${meta.bg} ${meta.textColor}`}>{meta.label}</span>
                    {t.subtitle && <p className="text-[11px] text-slate-400 truncate">{t.subtitle}</p>}
                    {t.price > 0 && <p className="text-[11px] font-bold text-brand shrink-0">${t.price.toLocaleString('es')}</p>}
                  </div>

                  {/* Fila 3: último mensaje */}
                  <p className={`text-xs truncate ${t.unread > 0 ? 'text-slate-700 dark:text-slate-300 font-medium' : 'text-slate-400'}`}>
                    {t.repliedByStore && !t.unread ? <span className="text-slate-400">Tú: </span> : null}
                    {t.lastText || <span className="italic">Sin mensajes aún</span>}
                  </p>
                </div>

                {/* Columna derecha: hora arriba, badge/acciones abajo */}
                <div className="flex flex-col items-end shrink-0 self-stretch justify-between pt-0.5">
                  <span className="text-[11px] text-slate-400">{fmtTime(t.lastTs)}</span>
                  {t.unread > 0 && (
                    <span className="w-5 h-5 bg-brand rounded-full text-white text-[10px] font-black flex items-center justify-center">{t.unread > 9 ? '9+' : t.unread}</span>
                  )}
                  <div className="flex flex-col items-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button title="Chat flotante"
                      onClick={e => { e.stopPropagation(); if (floatingChats.find(c => c.key === t.key)) { closeFloatingChat(t.key); } else { openFloatingChat(t.key); } }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${floatingChats.find(c => c.key === t.key) ? 'bg-brand/15 text-brand' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8'}`}>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button title={t.closed ? 'Desarchivar' : 'Archivar'}
                      onClick={e => { e.stopPropagation(); toggleClose(t.key); }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${t.closed ? 'text-amber-500' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/8'}`}>
                      <Archive className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}</div>}
          </div>

          {/* ── Barra archivados estilo WhatsApp ── */}
          {archivedThreads.length > 0 && (
            <div className="shrink-0 border-t border-slate-100 dark:border-white/8">
              {/* Botón / cabecera archivados */}
              <button
                onClick={() => setShowClosed(v => !v)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0">
                  <Archive className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </div>
                <span className="flex-1 text-left text-sm font-semibold text-slate-600 dark:text-slate-300">Archivadas</span>
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 mr-1">{archivedThreads.length}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showClosed ? 'rotate-180' : ''}`} />
              </button>

              {/* Lista expandida de archivados */}
              {showClosed && (
                <div className="divide-y divide-slate-50 dark:divide-white/5 border-t border-slate-100 dark:border-white/8">
                  {archivedThreads.map(t => {
                    const meta = TYPE_META[t.type] || TYPE_META.chat;
                    const isSelected = t.key === inboxSelectedKey;
                    const TypeIcon = meta.Icon;
                    return (
                      <div key={t.key}
                        className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-brand/8 dark:bg-brand/12' : 'opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                        onClick={() => { setInboxSelectedKey(t.key); setInboxMobileView('chat'); }}>
                        <div className="relative shrink-0">
                          <div className={`w-10 h-10 rounded-xl ${t.partnerUid ? avatarColor(t.partnerUid) : meta.bg} flex items-center justify-center font-bold text-xs`}>
                            {t.partnerUid ? <span className="text-white">{t.partnerUid.slice(-2).toUpperCase()}</span> : <TypeIcon className={`w-4 h-4 ${meta.textColor}`} />}
                          </div>
                          <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ${meta.color} border-2 border-white dark:border-slate-900 flex items-center justify-center`}>
                            <TypeIcon className="w-1.5 h-1.5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-0.5">
                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 truncate">{t.title}</p>
                            <span className="text-[10px] text-slate-400 shrink-0">{fmtTime(t.lastTs)}</span>
                          </div>
                          <p className="text-xs text-slate-400 truncate">
                            {t.repliedByStore && <span className="text-slate-300">Tú: </span>}
                            {t.lastText || <span className="italic">Sin mensajes</span>}
                          </p>
                        </div>
                        <button title="Desarchivar"
                          onClick={e => { e.stopPropagation(); toggleClose(t.key); }}
                          className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 transition-all shrink-0">
                          <RotateCcw className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );

    // ── Panel derecho ──────────────────────────────────────────────────────
    const ChatPanel = ({ scrollRef } = {}) => {
      const meta = selectedThread ? (TYPE_META[selectedThread.type] || TYPE_META.chat) : null;
      const TypeIcon = meta?.Icon || MessageSquare;

      return (
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/8 shrink-0 bg-white dark:bg-slate-900">
            <button onClick={() => setInboxMobileView('list')} className="lg:hidden ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8">
              <ArrowLeft className="w-5 h-5" />
            </button>
            {selectedThread ? (
              <>
                <div className={`w-9 h-9 rounded-xl ${selectedThread.partnerUid ? avatarColor(selectedThread.partnerUid) : meta.bg} flex items-center justify-center font-bold text-sm shrink-0`}>
                  {selectedThread.partnerUid
                    ? <span className="text-white">{(selectedThread.partnerUid).slice(-2).toUpperCase()}</span>
                    : <TypeIcon className={`w-4.5 h-4.5 ${meta.textColor}`} />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm truncate">{selectedThread.title}</p>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0 ${meta.color} text-white`}>{meta.label}</span>
                    {selectedThread.closed && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-white/10 text-slate-500 shrink-0">CERRADA</span>}
                  </div>
                  <p className="text-xs text-slate-400">{selectedThread.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {selectedThread.type === 'chat' && (
                    <button title="Chat flotante"
                      onClick={() => { if (floatingChats.find(c => c.key === selectedThread.key)) { closeFloatingChat(selectedThread.key); } else { openFloatingChat(selectedThread.key); } }}
                      className={`ui-icon-btn transition-colors ${floatingChats.find(c => c.key === selectedThread.key) ? 'text-brand bg-brand/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8'}`}>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  <button title="Info del cliente" onClick={() => setInboxInfoOpen(v => !v)}
                    className={`ui-icon-btn transition-colors ${inboxInfoOpen ? 'text-brand bg-brand/10' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8'}`}>
                    <User className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <p className="font-bold text-slate-400 text-sm">Seleccioná una conversación</p>
            )}
          </div>

          {/* Cuerpo */}
          <div ref={scrollRef || null} className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950" onClick={() => setSwipedMsgId(null)}>
            {!selectedThread ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/8 flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-10 h-10 text-slate-300 dark:text-slate-600" />
                </div>
                <p className="font-bold text-slate-500 dark:text-slate-400">Seleccioná una conversación</p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Chats directos y respuestas a demandas aparecen a la izquierda.</p>
              </div>

            ) : (
              /* Chat unificado — con header de contexto si aplica */
              <div className="space-y-3">
                {/* Header de contexto (demanda, producto, laboral, cv) */}
                {selectedThread.type !== 'chat' && selectedThread.type !== 'directa' && (() => {
                  const cm = TYPE_META[selectedThread.type] || TYPE_META.chat;
                  const CIcon = cm.Icon;
                  const demandaObj = selectedThread.demandaId ? demandas.find(d => String(d.id) === String(selectedThread.demandaId)) : null;
                  return (
                    <div className={`rounded-2xl border p-3.5 flex items-start gap-3 ${cm.bg} border-current/10`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cm.bg}`}>
                        <CIcon className={`w-4 h-4 ${cm.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-wide mb-0.5 ${cm.textColor}`}>{cm.label}</p>
                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{selectedThread.subtitle}</p>
                        {selectedThread.price > 0 && (
                          <p className={`text-sm font-black mt-1 ${cm.textColor}`}>$ {selectedThread.price.toLocaleString()}</p>
                        )}
                        {selectedThread.matchType && <MatchTypeBadge type={selectedThread.matchType} className="mt-1.5" />}
                      </div>
                      {demandaObj && (
                        <button onClick={() => { setSelectedDemanda(demandaObj); setMatchTypeStep('root'); setScreen('demanda-detail'); }}
                          className="shrink-0 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-0.5 transition-colors">
                          Ver <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })()}
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <MessageSquare className="w-10 h-10 text-slate-200 dark:text-slate-700" />
                    <p className="text-sm text-slate-400">Iniciá la conversación</p>
                  </div>
                ) : messages.filter(m => m.attachment?.type !== 'context').map(msg => {
                  const isStore = msg.from === storeId;
                  return (
                    <div key={msg.id || msg.ts} className={`group/msg flex flex-col ${isStore ? 'items-end' : 'items-start'} gap-1`}>
                      {msg.attachment && isStore && (() => {
                        const att = msg.attachment;
                        const attKey = `att-${msg.id || msg.ts}`;
                        const delAtt = () => setInboxConvos(prev => prev.map(c => c.key === inboxSelectedKey
                          ? { ...c, messages: c.messages.map(m => (m.id || m.ts) === (msg.id || msg.ts) ? { ...m, attachment: undefined } : m) }
                          : c));

                        let attContent = null;
                        if (att.type === 'product' || att.type === 'producto') {
                          const fullProd = misProductos.find(p => String(p.id) === String(att.productoId));
                          const foto = att.foto || fullProd?.fotos?.[0] || fullProd?.foto || null;
                          const nombre = att.nombre || fullProd?.titulo || fullProd?.nombre || 'Producto';
                          const precio = att.precio ?? fullProd?.precio ?? null;
                          const precioOrig = fullProd?.precioOriginal ?? null;
                          const descripcion = fullProd?.descripcion || null;
                          const stock = fullProd?.stock ?? null;
                          attContent = (
                            <button onClick={() => { if (fullProd) { setProductoEditing(fullProd); setProductoShowForm(true); setScreen('productos'); } }}
                              className="w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 active:opacity-60 bg-white dark:bg-slate-800 border-slate-100 dark:border-white/10 shadow-sm">
                              <div className="aspect-square w-full bg-slate-100 dark:bg-white/8 flex items-center justify-center overflow-hidden">
                                {foto ? <img src={foto} alt={nombre} className="w-full h-full object-cover" /> : <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
                              </div>
                              <div className="px-3 py-2.5">
                                <p className="text-[10px] font-bold text-emerald-600 mb-0.5">Producto</p>
                                <p className="text-sm font-bold line-clamp-2 text-slate-800 dark:text-slate-100">{nombre}</p>
                                {descripcion && <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{descripcion}</p>}
                                <div className="flex items-center gap-2 mt-1.5">
                                  {precio != null && <span className="text-sm font-black text-brand-dark dark:text-brand">${Number(precio).toLocaleString('es')}</span>}
                                  {precioOrig && precio && Number(precioOrig) > Number(precio) && <span className="text-xs text-slate-400 line-through">${Number(precioOrig).toLocaleString('es')}</span>}
                                  {stock != null && <span className="text-[10px] text-slate-400 ml-auto">Stock: {stock}</span>}
                                </div>
                              </div>
                            </button>
                          );
                        } else if (att.type === 'ubicacion') {
                          const mapsUrl = att.lat && att.lng
                            ? `https://www.google.com/maps?q=${att.lat},${att.lng}`
                            : att.direccion ? `https://www.google.com/maps/search/${encodeURIComponent(`${att.direccion}${att.ciudad ? ` ${att.ciudad}` : ''}`)}` : null;
                          const storeFoto = tiendaInfo?.foto || null;
                          attContent = (
                            <a href={mapsUrl || '#'} target={mapsUrl ? '_blank' : undefined} rel="noopener noreferrer"
                              className="block w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 bg-white dark:bg-slate-800 border-slate-100 dark:border-white/10 shadow-sm">
                              <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 20px,#94a3b8 20px,#94a3b8 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,#94a3b8 20px,#94a3b8 21px)' }} />
                                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white/40 relative bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                  {storeFoto
                                    ? <img src={storeFoto} alt="" className="w-full h-full object-cover" />
                                    : <MapPin className="w-5 h-5 text-slate-400" />}
                                </div>
                              </div>
                              <div className="px-3 py-2.5">
                                <p className="text-[10px] text-slate-500 font-bold mb-0.5 flex items-center gap-1">Ubicación <ExternalLink className="w-2.5 h-2.5" /></p>
                                {att.nombre && <p className="text-xs font-semibold truncate">{att.nombre}</p>}
                                {att.direccion && <p className="text-[11px] text-slate-500 truncate">{att.direccion}{att.ciudad ? `, ${att.ciudad}` : ''}</p>}
                              </div>
                            </a>
                          );
                        } else if (att.type === 'tienda-info') {
                          const waNum = att.telefono ? att.telefono.replace(/\D/g, '').replace(/^0/, '54') : null;
                          const waUrl = waNum ? `https://wa.me/${waNum}` : null;
                          attContent = (
                            <a href={waUrl || '#'} target={waUrl ? '_blank' : undefined} rel="noopener noreferrer"
                              className="block w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10 transition-opacity hover:opacity-80">
                              {/* Header verde WhatsApp */}
                              <div className="bg-[#25D366] px-3 py-3 flex items-center gap-2.5">
                                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white shrink-0" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.215a.75.75 0 0 0 .928.928l5.36-1.471A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 0 1-4.953-1.352l-.355-.211-3.683 1.01 1.01-3.684-.211-.355A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                                </svg>
                                <div className="min-w-0">
                                  <p className="text-[10px] text-white/80 font-semibold">WhatsApp</p>
                                  <p className="text-sm font-bold text-white truncate">{att.nombre || 'Contactar'}</p>
                                </div>
                              </div>
                              {/* Footer */}
                              <div className="bg-white dark:bg-slate-800 px-3 py-2 flex items-center justify-between">
                                <p className="text-[11px] text-slate-500">{att.telefono || 'Ver contacto'}</p>
                                <ExternalLink className="w-3 h-3 text-[#25D366] shrink-0" />
                              </div>
                            </a>
                          );
                        } else if (att.type === 'tienda-publica') {
                          attContent = (
                            <a href={att.url} target="_blank" rel="noopener noreferrer"
                              className="block w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10 transition-opacity hover:opacity-80">
                              <div className="bg-brand px-3 py-3 flex items-center gap-2.5">
                                <Globe className="w-8 h-8 text-white shrink-0" />
                                <div className="min-w-0">
                                  <p className="text-[10px] text-white/80 font-semibold">Página pública</p>
                                  <p className="text-sm font-bold text-white truncate">{att.nombre}</p>
                                </div>
                              </div>
                              <div className="bg-white dark:bg-slate-800 px-3 py-2 flex items-center justify-between">
                                <p className="text-[11px] text-slate-500 truncate">{att.url?.replace(/^https?:\/\//, '')}</p>
                                <ExternalLink className="w-3 h-3 text-brand shrink-0" />
                              </div>
                            </a>
                          );
                        } else if (att.type === 'horarios') {
                          const rows = (() => {
                            if (!att.horarios) return [];
                            if (typeof att.horarios === 'string') return att.horarios.split('\n').filter(Boolean).map(l => ({ label: l, value: '' }));
                            if (Array.isArray(att.horarios)) return att.horarios;
                            if (typeof att.horarios === 'object') return Object.entries(att.horarios).map(([k, v]) => ({ label: k, value: v }));
                            return [];
                          })();
                          attContent = (
                            <div className="w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10">
                              <div className="bg-amber-500 px-3 py-2.5 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-white shrink-0" />
                                <div>
                                  <p className="text-[10px] text-white/80 font-semibold">Horarios</p>
                                  {att.nombre && <p className="text-xs font-bold text-white truncate">{att.nombre}</p>}
                                </div>
                              </div>
                              <div className="bg-white dark:bg-slate-800 px-3 py-2.5 flex flex-col gap-1">
                                {rows.length > 0 ? rows.map((r, i) => (
                                  <div key={i} className="flex justify-between gap-2 text-[11px]">
                                    <span className="text-slate-500 capitalize">{r.label}</span>
                                    {r.value && <span className="font-semibold text-slate-700 dark:text-slate-200 shrink-0">{r.value}</span>}
                                  </div>
                                )) : (
                                  <p className="text-[11px] text-slate-400">Sin horarios configurados</p>
                                )}
                              </div>
                            </div>
                          );
                        }

                        if (!attContent) return null;
                        return (
                          <div className="relative w-fit">
                            <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-1.5 transition-opacity duration-150
                              opacity-0 pointer-events-none group-hover/msg:opacity-100 group-hover/msg:pointer-events-auto`}>
                              <button onClick={delAtt}
                                className="w-7 h-7 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/8 text-slate-400 hover:text-rose-500 transition-colors"
                                title="Quitar adjunto">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {attContent}
                          </div>
                        );
                      })()}
                      {msg.attachment && !isStore && (() => {
                        const att = msg.attachment;
                        if (att.type === 'product' || att.type === 'producto') {
                          const fullProd = misProductos.find(p => String(p.id) === String(att.productoId));
                          const foto = att.foto || fullProd?.fotos?.[0] || fullProd?.foto || null;
                          const nombre = att.nombre || fullProd?.titulo || fullProd?.nombre || 'Producto';
                          const precio = att.precio ?? fullProd?.precio ?? null;
                          const precioOrig = fullProd?.precioOriginal ?? null;
                          const descripcion = fullProd?.descripcion || null;
                          const stock = fullProd?.stock ?? null;
                          return (
                            <button onClick={() => { if (fullProd) { setProductoEditing(fullProd); setProductoShowForm(true); setScreen('productos'); } }}
                              className="w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 active:opacity-60 bg-white dark:bg-slate-800 border-slate-100 dark:border-white/10 shadow-sm">
                              <div className="aspect-square w-full bg-slate-100 dark:bg-white/8 flex items-center justify-center overflow-hidden">
                                {foto ? <img src={foto} alt={nombre} className="w-full h-full object-cover" /> : <ShoppingBag className="w-10 h-10 text-slate-300 dark:text-slate-600" />}
                              </div>
                              <div className="px-3 py-2.5">
                                <p className="text-[10px] font-bold text-emerald-600 mb-0.5">Producto</p>
                                <p className="text-sm font-bold line-clamp-2 text-slate-800 dark:text-slate-100">{nombre}</p>
                                {descripcion && <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{descripcion}</p>}
                                <div className="flex items-center gap-2 mt-1.5">
                                  {precio != null && <span className="text-sm font-black text-brand-dark dark:text-brand">${Number(precio).toLocaleString('es')}</span>}
                                  {precioOrig && precio && Number(precioOrig) > Number(precio) && <span className="text-xs text-slate-400 line-through">${Number(precioOrig).toLocaleString('es')}</span>}
                                  {stock != null && <span className="text-[10px] text-slate-400 ml-auto">Stock: {stock}</span>}
                                </div>
                              </div>
                            </button>
                          );
                        }
                        if (att.type === 'ubicacion') {
                          const mapsUrl = att.lat && att.lng ? `https://www.google.com/maps?q=${att.lat},${att.lng}` : att.direccion ? `https://www.google.com/maps/search/${encodeURIComponent(`${att.direccion}${att.ciudad ? ` ${att.ciudad}` : ''}`)}` : null;
                          const storeFoto = tiendaInfo?.foto || null;
                          return (
                            <a href={mapsUrl || '#'} target={mapsUrl ? '_blank' : undefined} rel="noopener noreferrer"
                              className="block w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 bg-white dark:bg-slate-800 border-slate-100 dark:border-white/10 shadow-sm">
                              <div className="h-28 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 20px,#94a3b8 20px,#94a3b8 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,#94a3b8 20px,#94a3b8 21px)' }} />
                                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white/40 relative bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                                  {storeFoto ? <img src={storeFoto} alt="" className="w-full h-full object-cover" /> : <MapPin className="w-5 h-5 text-slate-400" />}
                                </div>
                              </div>
                              <div className="px-3 py-2.5">
                                <p className="text-[10px] text-slate-500 font-bold mb-0.5 flex items-center gap-1">Ubicación <ExternalLink className="w-2.5 h-2.5" /></p>
                                {att.nombre && <p className="text-xs font-semibold truncate">{att.nombre}</p>}
                                {att.direccion && <p className="text-[11px] text-slate-500 truncate">{att.direccion}{att.ciudad ? `, ${att.ciudad}` : ''}</p>}
                              </div>
                            </a>
                          );
                        }
                        if (att.type === 'tienda-info') {
                          const waNum = att.telefono ? att.telefono.replace(/\D/g, '').replace(/^0/, '54') : null;
                          const waUrl = waNum ? `https://wa.me/${waNum}` : null;
                          return (
                            <a href={waUrl || '#'} target={waUrl ? '_blank' : undefined} rel="noopener noreferrer"
                              className="block w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10 transition-opacity hover:opacity-80">
                              <div className="bg-[#25D366] px-3 py-3 flex items-center gap-2.5">
                                <svg viewBox="0 0 24 24" className="w-8 h-8 text-white shrink-0" fill="currentColor">
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                                  <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.215a.75.75 0 0 0 .928.928l5.36-1.471A11.943 11.943 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.718 9.718 0 0 1-4.953-1.352l-.355-.211-3.683 1.01 1.01-3.684-.211-.355A9.718 9.718 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
                                </svg>
                                <div className="min-w-0">
                                  <p className="text-[10px] text-white/80 font-semibold">WhatsApp</p>
                                  <p className="text-sm font-bold text-white truncate">{att.nombre || 'Contactar'}</p>
                                </div>
                              </div>
                              <div className="bg-white dark:bg-slate-800 px-3 py-2 flex items-center justify-between">
                                <p className="text-[11px] text-slate-500">{att.telefono || 'Ver contacto'}</p>
                                <ExternalLink className="w-3 h-3 text-[#25D366] shrink-0" />
                              </div>
                            </a>
                          );
                        }
                        if (att.type === 'tienda-publica') return (
                          <a href={att.url} target="_blank" rel="noopener noreferrer"
                            className="block w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10 transition-opacity hover:opacity-80">
                            <div className="bg-brand px-3 py-3 flex items-center gap-2.5">
                              <Globe className="w-8 h-8 text-white shrink-0" />
                              <div className="min-w-0">
                                <p className="text-[10px] text-white/80 font-semibold">Página pública</p>
                                <p className="text-sm font-bold text-white truncate">{att.nombre}</p>
                              </div>
                            </div>
                            <div className="bg-white dark:bg-slate-800 px-3 py-2 flex items-center justify-between">
                              <p className="text-[11px] text-slate-500 truncate">{att.url?.replace(/^https?:\/\//, '')}</p>
                              <ExternalLink className="w-3 h-3 text-brand shrink-0" />
                            </div>
                          </a>
                        );
                        if (att.type === 'horarios') {
                          const rows = (() => {
                            if (!att.horarios) return [];
                            if (typeof att.horarios === 'string') return att.horarios.split('\n').filter(Boolean).map(l => ({ label: l, value: '' }));
                            if (Array.isArray(att.horarios)) return att.horarios;
                            if (typeof att.horarios === 'object') return Object.entries(att.horarios).map(([k, v]) => ({ label: k, value: v }));
                            return [];
                          })();
                          return (
                            <div className="w-52 rounded-2xl border overflow-hidden shadow-sm border-slate-100 dark:border-white/10">
                              <div className="bg-amber-500 px-3 py-2.5 flex items-center gap-2">
                                <Clock className="w-4 h-4 text-white shrink-0" />
                                <div>
                                  <p className="text-[10px] text-white/80 font-semibold">Horarios</p>
                                  {att.nombre && <p className="text-xs font-bold text-white truncate">{att.nombre}</p>}
                                </div>
                              </div>
                              <div className="bg-white dark:bg-slate-800 px-3 py-2.5 flex flex-col gap-1">
                                {rows.length > 0 ? rows.map((r, i) => (
                                  <div key={i} className="flex justify-between gap-2 text-[11px]">
                                    <span className="text-slate-500 capitalize">{r.label}</span>
                                    {r.value && <span className="font-semibold text-slate-700 dark:text-slate-200 shrink-0">{r.value}</span>}
                                  </div>
                                )) : (
                                  <p className="text-[11px] text-slate-400">Sin horarios configurados</p>
                                )}
                              </div>
                            </div>
                          );
                        }
                        return null;
                      })()}
                      {msg.imageUrl && (
                        <div className={`relative w-fit max-w-[72%]`}>
                          <img src={msg.imageUrl} alt="" className="rounded-2xl max-w-full max-h-64 object-cover shadow-sm" />
                        </div>
                      )}
                      {msg.text && (() => {
                        const msgKey = msg.id || msg.ts;
                        const swiped = swipedMsgId === msgKey;
                        const isDeleting = deletingMsgId === msgKey;
                        const isEditing = editingMsg?.id === msgKey;

                        const doDelete = () => {
                          setDeletingMsgId(msgKey);
                          setSwipedMsgId(null);
                          setTimeout(() => {
                            setInboxConvos(prev => prev.map(c => c.key === inboxSelectedKey
                              ? { ...c, messages: c.messages.filter(m => (m.id || m.ts) !== msgKey) }
                              : c
                            ));
                            setDeletingMsgId(null);
                          }, 280);
                        };

                        let lpTimer = null;
                        const longPressHandlers = isStore ? {
                          onContextMenu: e => { e.preventDefault(); setSwipedMsgId(swiped ? null : msgKey); },
                          onTouchStart: () => { lpTimer = setTimeout(() => setSwipedMsgId(swiped ? null : msgKey), 420); },
                          onTouchEnd:   () => clearTimeout(lpTimer),
                          onTouchMove:  () => clearTimeout(lpTimer),
                        } : {};

                        return (
                          <>
                          <div className={`relative w-fit max-w-[72%] transition-all duration-[280ms] ease-out origin-right
                            ${isDeleting ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>

                            {/* Botones apilados absolute — no afectan layout de la burbuja */}
                            {isStore && (
                              <div className={`absolute right-full top-1/2 -translate-y-1/2 mr-1.5 flex flex-col gap-1 transition-opacity duration-150
                                ${swiped ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none group-hover/msg:opacity-100 group-hover/msg:pointer-events-auto'}`}>
                                <button
                                  onClick={() => { setEditingMsg({ id: msgKey, text: msg.text }); setInboxReply(msg.text); setSwipedMsgId(null); }}
                                  className="w-7 h-7 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/8 text-slate-400 hover:text-brand transition-colors"
                                  title="Editar">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={doDelete}
                                  className="w-7 h-7 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-white/8 text-slate-400 hover:text-rose-500 transition-colors"
                                  title="Borrar">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            <div {...longPressHandlers}
                              className={`rounded-2xl px-4 py-2.5 select-none
                                ${isStore ? 'bg-brand text-white' : 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-200'}
                                ${isEditing ? 'ring-2 ring-brand/50 ring-offset-1' : ''}`}>
                              <p className="text-sm">{msg.text}</p>
                            </div>
                          </div>
                          </>
                        );
                      })()}
                      <div className={`flex items-center gap-1 px-1 ${isStore ? 'justify-end' : 'justify-start'}`}>
                        <p className="text-[10px] text-slate-400">{fmtTime(msg.ts)}</p>
                        {isStore && (
                          <span className="text-[10px] text-slate-400">
                            {msg.seen ? (
                              <svg viewBox="0 0 16 11" className="w-4 h-2.5 fill-brand inline" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.071.336a1 1 0 0 1 1.415 1.415l-6.364 6.364a1 1 0 0 1-1.415 0L1.293 4.7a1 1 0 1 1 1.414-1.414l2.707 2.707L11.07.336z"/>
                                <path d="M15.071.336a1 1 0 0 1 1.415 1.415L10.122 8.115a1 1 0 0 1-1.415 0" opacity=".5"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 16 11" className="w-4 h-2.5 fill-slate-400 inline" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.071.336a1 1 0 0 1 1.415 1.415l-6.364 6.364a1 1 0 0 1-1.415 0L1.293 4.7a1 1 0 1 1 1.414-1.414l2.707 2.707L11.07.336z"/>
                              </svg>
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            {/* Indicador "escribiendo..." */}
            {storeTyping && (
              <div className="flex items-center gap-2 px-2 pt-1 pb-0">
                <div className="flex items-center gap-1 bg-white dark:bg-slate-800 rounded-2xl px-3 py-2 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:300ms]" />
                </div>
                <p className="text-[10px] text-slate-400">Escribiendo...</p>
              </div>
            )}
            <div ref={inboxBottomRef} />
          </div>

          {/* Footer input — para cualquier chat activo */}
          {selectedThread && selectedConvo && !selectedThread.closed && (() => {
            const td = tiendaInfo || tiendaData;
            const ATTACH_OPTS = [
              {
                id: 'ubicacion',
                icon: MapPin,
                label: 'Ubicación',
                desc: td?.direccion ? `${td.direccion}${td.ciudad ? `, ${td.ciudad}` : ''}` : 'Sin dirección',
                color: 'text-rose-600',
                bg: 'bg-rose-50 dark:bg-rose-900/20',
                disabled: !td?.direccion && !td?.lat,
                build: () => ({ type: 'ubicacion', nombre: td?.nombre, direccion: td?.direccion, ciudad: td?.ciudad, lat: td?.lat ?? null, lng: td?.lng ?? null }),
              },
              {
                id: 'tienda-info',
                icon: Phone,
                label: 'WhatsApp',
                desc: td?.telefono || 'Sin teléfono',
                color: 'text-[#25D366]',
                bg: 'bg-green-50 dark:bg-green-900/20',
                disabled: !td?.telefono,
                build: () => ({ type: 'tienda-info', nombre: td?.nombre, telefono: td?.telefono }),
              },
              {
                id: 'horarios',
                icon: Clock,
                label: 'Horarios',
                desc: td?.horarios ? 'Ver horarios de atención' : 'Sin horarios',
                color: 'text-amber-600',
                bg: 'bg-amber-50 dark:bg-amber-900/20',
                disabled: !td?.horarios,
                build: () => ({ type: 'horarios', nombre: td?.nombre, horarios: td?.horarios }),
              },
              {
                id: 'tienda-publica',
                icon: Globe,
                label: 'Página pública',
                desc: td?.slug ? `lokal.ar/${td.slug}` : 'Sin slug configurado',
                color: 'text-brand',
                bg: 'bg-violet-50 dark:bg-violet-900/20',
                disabled: !td?.slug,
                build: () => ({ type: 'tienda-publica', slug: td?.slug, nombre: td?.nombre, url: `https://lokal.ar/${td?.slug}` }),
              },
            ];

            // Opciones de productos (hasta 5 más recientes)
            const prodOpts = (misProductos || []).slice(0, 20).map(p => ({
              id: `prod-${p.id}`,
              icon: ShoppingBag,
              label: p.nombre || 'Producto',
              desc: p.precio ? `$${Number(p.precio).toLocaleString('es')}` : 'Sin precio',
              color: 'text-emerald-600',
              bg: 'bg-emerald-50 dark:bg-emerald-900/20',
              build: () => ({ type: 'producto', productoId: String(p.id), nombre: p.nombre, precio: p.precio, foto: p.fotos?.[0] || null }),
            }));

            const allOpts = [...ATTACH_OPTS, ...prodOpts];
            const selectedOpt = chatAttachment ? allOpts.find(o => {
              if (chatAttachment.type === 'producto') return o.id === `prod-${chatAttachment.productoId}`;
              return o.id === chatAttachment.type;
            }) : null;

            return (
              <div className="shrink-0 border-t border-slate-100 dark:border-white/8 bg-white dark:bg-slate-900" style={{ paddingBottom: 'max(0rem, env(safe-area-inset-bottom))' }}>
                {/* Panel adjuntos */}
                {attachOpen && (
                  <div className="border-b border-slate-100 dark:border-white/8 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Adjuntar</p>
                    {/* Opciones de tienda — fila única, ancho fraccionado */}
                    <div className="flex gap-1.5 mb-2">
                      {ATTACH_OPTS.map(opt => {
                        const isOn = chatAttachment?.type === opt.id;
                        return (
                          <button key={opt.id} disabled={opt.disabled}
                            onClick={() => setChatAttachment(isOn ? null : opt.build())}
                            className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-colors disabled:opacity-40 ${isOn ? `border-transparent ${opt.bg}` : 'border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/4'}`}>
                            <opt.icon className={`w-4 h-4 ${isOn ? opt.color : 'text-slate-400'}`} />
                            <p className={`text-[10px] font-bold text-center leading-tight ${isOn ? opt.color : 'text-slate-600 dark:text-slate-300'}`}>{opt.label}</p>
                          </button>
                        );
                      })}
                    </div>
                    {/* Productos */}
                    {prodOpts.length > 0 && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">Mis productos</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {prodOpts.map(opt => {
                            const isOn = chatAttachment?.type === 'producto' && String(chatAttachment.productoId) === opt.id.replace('prod-', '');
                            return (
                              <button key={opt.id}
                                onClick={() => setChatAttachment(isOn ? null : opt.build())}
                                className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-colors min-w-[80px] ${isOn ? `border-transparent ${opt.bg}` : 'border-slate-200 dark:border-white/8 bg-slate-50 dark:bg-white/4'}`}>
                                <ShoppingBag className={`w-4 h-4 ${isOn ? opt.color : 'text-slate-400'}`} />
                                <p className={`text-[10px] font-bold text-center leading-tight line-clamp-2 ${isOn ? opt.color : 'text-slate-600 dark:text-slate-300'}`}>{opt.label}</p>
                                <p className={`text-[9px] ${isOn ? 'text-emerald-500' : 'text-slate-400'}`}>{opt.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </>
                    )}
                  </div>
                )}
                {/* Adjunto seleccionado preview */}
                {chatAttachment && !attachOpen && (
                  <div className="flex items-center gap-2 px-3 pt-2">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${selectedOpt?.bg || 'bg-slate-100 dark:bg-white/8'} ${selectedOpt?.color || 'text-slate-600'}`}>
                      {selectedOpt && <selectedOpt.icon className="w-3 h-3" />}
                      <span>{selectedOpt?.label || 'Adjunto'}</span>
                    </div>
                    <button onClick={() => setChatAttachment(null)} className="text-slate-400 hover:text-slate-600 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
                {/* Banner edición estilo WhatsApp */}
                {editingMsg && (
                  <div className="flex items-center gap-2 px-3 pt-1.5 pb-0">
                    <Edit3 className="w-3.5 h-3.5 text-brand shrink-0" />
                    <p className="flex-1 text-[11px] font-semibold text-brand">Editando mensaje</p>
                    <button onClick={() => { setEditingMsg(null); setInboxReply(''); }}
                      className="w-6 h-6 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/8 text-slate-400 shrink-0 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
                {/* Preview imagen adjunta */}
                {chatImagePreview && (
                  <div className="px-3 pt-2">
                    <div className="relative w-fit">
                      <img src={chatImagePreview} alt="" className="h-20 rounded-xl object-cover shadow-sm" />
                      <button onClick={() => setChatImagePreview(null)}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-slate-800/80 text-white flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 items-end px-3 pt-2 pb-2">
                  <input ref={chatImageInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setChatImagePreview(ev.target.result); r.readAsDataURL(f); e.target.value = ''; }} />
                  <button onClick={() => chatImageInputRef.current?.click()}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${chatImagePreview ? 'bg-brand/10 text-brand' : 'bg-slate-100 dark:bg-white/8 text-slate-400 hover:text-slate-600'}`}>
                    <Camera className="w-4 h-4" />
                  </button>
                  <button onClick={() => setAttachOpen(v => !v)}
                    className={`relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${attachOpen || chatAttachment ? 'bg-brand/10 text-brand' : 'bg-slate-100 dark:bg-white/8 text-slate-400 hover:text-slate-600'}`}>
                    <Paperclip className="w-4 h-4" />
                    {chatAttachment && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand text-white text-[8px] font-bold flex items-center justify-center">1</span>
                    )}
                  </button>
                  <div className="flex-1 bg-slate-100 dark:bg-white/8 rounded-2xl px-4 py-2.5 min-h-[40px] flex items-center">
                    <textarea value={inboxReply} onChange={e => { setInboxReply(e.target.value); setStoreTyping(true); clearTimeout(window._storeTypingTimer); window._storeTypingTimer = setTimeout(() => setStoreTyping(false), 2000); }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); inboxSendReply(); setStoreTyping(false); } }}
                      placeholder="Escribí tu respuesta..."
                      rows={1}
                      className="bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none w-full resize-none" />
                  </div>
                  <button onClick={inboxSendReply} disabled={(!inboxReply.trim() && !chatAttachment) || inboxSending}
                    className="w-10 h-10 bg-brand hover:bg-brand-dark rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors shrink-0">
                    {inboxSending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                  </button>
                </div>
                {/* Barra sutil archivar */}
                <button onClick={() => toggleClose(selectedThread.key)}
                  className="w-full flex items-center justify-center gap-1.5 pt-0 pb-2 text-[11px] font-semibold text-slate-300 dark:text-slate-600 hover:text-slate-500 dark:hover:text-slate-400 transition-colors">
                  <Archive className="w-3 h-3" />
                  Archivar conversación
                </button>
              </div>
            );
          })()}
          {selectedThread?.closed && (
            <div className="shrink-0 border-t border-slate-100 dark:border-white/8 bg-white dark:bg-slate-900 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-400">
                <Archive className="w-3.5 h-3.5" />
                <p className="text-xs">Archivada</p>
              </div>
              <button onClick={() => toggleClose(selectedThread.key)} className="text-xs font-bold text-brand hover:text-brand-dark transition-colors">Desarchivar</button>
            </div>
          )}
        </div>
      );
    };

    // ── Panel de info del cliente ─────────────────────────────────────────
    const ClientInfoPanel = () => {
      if (!selectedThread) return null;
      const meta = TYPE_META[selectedThread.type] || TYPE_META.chat;
      const TypeIcon = meta.Icon;
      const msgs = selectedConvo?.messages || [];
      const msgCount = msgs.length;
      const firstMsg = msgs[0];
      const lastMsg = msgs[msgs.length - 1];
      const uid = selectedThread.partnerUid;

      return (
        <div className="w-64 xl:w-72 border-l border-slate-100 dark:border-white/8 flex flex-col bg-white dark:bg-slate-900 overflow-y-auto">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/8 shrink-0 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Info del cliente</p>
            <button onClick={() => setInboxInfoOpen(false)} className="ui-icon-btn text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {/* Avatar + nombre */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className={`w-16 h-16 rounded-2xl ${uid ? avatarColor(uid) : 'bg-slate-200'} flex items-center justify-center font-black text-xl text-white shadow-sm`}>
                {uid ? uid.slice(-2).toUpperCase() : <User className="w-7 h-7" />}
              </div>
              <div className="text-center">
                <p className="font-bold text-sm">{selectedThread.title}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${meta.color} text-white mt-1`}>
                  <TypeIcon className="w-2.5 h-2.5" />
                  {meta.label}
                </span>
              </div>
            </div>

            {/* ID del usuario */}
            {uid && (
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 px-3 py-2.5 flex items-center gap-2.5">
                <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">ID de usuario</p>
                  <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 truncate">{uid}</p>
                </div>
              </div>
            )}

            {/* Contexto del hilo */}
            {selectedThread.subtitle && (
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 px-3 py-2.5 flex items-start gap-2.5">
                <MessageCircle className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-400 font-medium">Contexto</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 line-clamp-2">{selectedThread.subtitle}</p>
                </div>
              </div>
            )}

            {/* Stats mensajes */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-center">
                <p className="text-lg font-black text-slate-800 dark:text-slate-100">{msgCount}</p>
                <p className="text-[10px] text-slate-400 font-medium">mensajes</p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 px-3 py-2.5 text-center">
                <p className="text-lg font-black text-slate-800 dark:text-slate-100">{selectedThread.unread || 0}</p>
                <p className="text-[10px] text-slate-400 font-medium">sin leer</p>
              </div>
            </div>

            {/* Fechas */}
            {(firstMsg || lastMsg) && (
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 px-3 py-2.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <p className="text-[10px] text-slate-400 font-medium">Actividad</p>
                </div>
                {firstMsg?.ts && (
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-slate-400">Primer mensaje</p>
                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{fmtTime(firstMsg.ts)}</p>
                  </div>
                )}
                {lastMsg?.ts && (
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-slate-400">Último mensaje</p>
                    <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-400">{fmtTime(lastMsg.ts)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Estado */}
            <div className={`rounded-2xl px-3 py-2.5 flex items-center gap-2 ${selectedThread.closed ? 'bg-slate-100 dark:bg-white/5' : 'bg-ok/8 dark:bg-ok/10'}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${selectedThread.closed ? 'bg-slate-400' : 'bg-ok'}`} />
              <p className={`text-xs font-bold ${selectedThread.closed ? 'text-slate-500' : 'text-ok-dark dark:text-ok'}`}>
                {selectedThread.closed ? 'Conversación cerrada' : 'Conversación activa'}
              </p>
            </div>
          </div>
        </div>
      );
    };

    // ── Bottom sheet info (mobile) ────────────────────────────────────────────
    const ClientInfoSheet = () => {
      if (!inboxInfoOpen || !selectedThread) return null;
      const meta = TYPE_META[selectedThread.type] || TYPE_META.chat;
      const TypeIcon = meta.Icon;
      const msgs = selectedConvo?.messages || [];
      const msgCount = msgs.length;
      const firstMsg = msgs[0];
      const lastMsg = msgs[msgs.length - 1];
      const uid = selectedThread.partnerUid;

      return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end lg:hidden" onClick={() => setInboxInfoOpen(false)}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto animate-fade-in"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-white/15 mx-auto mb-1" />
            <div className="flex items-center justify-between">
              <p className="font-bold">Info del cliente</p>
              <button onClick={() => setInboxInfoOpen(false)} className="ui-icon-btn text-slate-400"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl ${uid ? avatarColor(uid) : 'bg-slate-200'} flex items-center justify-center font-black text-lg text-white`}>
                {uid ? uid.slice(-2).toUpperCase() : <User className="w-6 h-6" />}
              </div>
              <div>
                <p className="font-bold">{selectedThread.title}</p>
                <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${meta.color} text-white`}>
                  <TypeIcon className="w-2.5 h-2.5" />{meta.label}
                </span>
              </div>
            </div>

            {uid && (
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 px-3 py-2.5 flex items-center gap-2.5">
                <Hash className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <div>
                  <p className="text-[10px] text-slate-400 font-medium">ID de usuario</p>
                  <p className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300">{uid}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-xl font-black text-slate-800 dark:text-slate-100">{msgCount}</p>
                <p className="text-[10px] text-slate-400 font-medium">mensajes</p>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-xl font-black text-slate-800 dark:text-slate-100">{selectedThread.unread || 0}</p>
                <p className="text-[10px] text-slate-400 font-medium">sin leer</p>
              </div>
            </div>

            {selectedThread.subtitle && (
              <div className="rounded-2xl bg-slate-50 dark:bg-white/5 px-3 py-2.5">
                <p className="text-[10px] text-slate-400 font-medium mb-1">Contexto</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">{selectedThread.subtitle}</p>
              </div>
            )}

            <div className={`rounded-2xl px-3 py-2.5 flex items-center gap-2 ${selectedThread.closed ? 'bg-slate-100 dark:bg-white/5' : 'bg-ok/8 dark:bg-ok/10'}`}>
              <div className={`w-2 h-2 rounded-full ${selectedThread.closed ? 'bg-slate-400' : 'bg-ok'}`} />
              <p className={`text-sm font-bold ${selectedThread.closed ? 'text-slate-500' : 'text-ok-dark dark:text-ok'}`}>
                {selectedThread.closed ? 'Conversación cerrada' : 'Conversación activa'}
              </p>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="h-[100dvh] flex flex-col bg-white dark:bg-slate-900">
        {/* Header mobile — desktop usa el header interno del ThreadList */}
        <div className="lg:hidden shrink-0">
          <StorePageHeader
            title="Mensajes"
            subtitle={unreadTotal > 0 ? `${unreadTotal} sin leer` : `${allThreads.length} conversación${allThreads.length !== 1 ? 'es' : ''}`}
            actionSlot={
              <button onClick={fetchInbox} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 text-slate-400" title="Actualizar">
                <RotateCcw className={`w-4 h-4 ${inboxLoading ? 'animate-spin' : ''}`} />
              </button>
            }
          />
        </div>
        <div className="hidden lg:flex flex-1 min-h-0">
          <div className="w-80 xl:w-96 border-r border-slate-100 dark:border-white/8 flex flex-col min-h-0">
            {ThreadList()}
          </div>
          <div className="flex-1 flex flex-col min-h-0">
            {ChatPanel({ scrollRef: inboxScrollRef })}
          </div>
          {inboxInfoOpen && selectedThread && ClientInfoPanel()}
        </div>
        <div className={`lg:hidden flex-1 min-h-0 flex flex-col ${inboxMobileView === 'chat' ? 'pb-0' : 'pb-20'}`}
          onTouchStart={e => { if (inboxMobileView === 'chat') window._swipeStartX = e.touches[0].clientX; }}
          onTouchEnd={e => { if (inboxMobileView === 'chat' && window._swipeStartX != null) { const dx = e.changedTouches[0].clientX - window._swipeStartX; if (dx > 60) setInboxMobileView('list'); window._swipeStartX = null; } }}>
          {inboxMobileView === 'list' ? ThreadList() : ChatPanel({ scrollRef: inboxMobileScrollRef })}
        </div>
        {ClientInfoSheet()}
      </div>
    );
  };

  // ── Inicio (vista marketplace read-only) ──────────────────────────────────
  const myStoreId = String(tienda?.id || tiendaData?.id || '');

  const inicioNavigate = (dest) => {
    if (dest === 'product-detail') setInicioSubScreen('producto');
    else if (dest === 'tienda-detail') setInicioSubScreen('tienda');
    else if (dest === 'detalle') setInicioSubScreen('demanda');
    else setInicioSubScreen(null);
  };
  const inicioGoBack = () => setInicioSubScreen(null);
  const addRecentSearch = (q) => setRecentSearches(prev => [q, ...prev.filter(r => r !== q)].slice(0, 8));

  const InicioScreen = () => {
    const storeOwnContent = inicioOfertas.filter(o => String(o.tiendaId) === myStoreId);
    const bannerMsg = storeOwnContent.length > 0
      ? `Tus ${storeOwnContent.length} publicación${storeOwnContent.length > 1 ? 'es aparecen' : ' aparece'} en el feed`
      : 'Tus publicaciones aparecerán acá cuando las crees';

    const commonProps = {
      visibleOfertas: inicioOfertas,
      tiendas: inicioTiendas,
      allDemandas: demandas,
      allCategories,
      firebaseUser,
      navigate: inicioNavigate,
      goBack: inicioGoBack,
      setSelectedProduct: setInicioSelectedProduct,
      setSelectedTienda: setInicioSelectedTienda,
      setSelectedDemanda: setInicioSelectedDemanda,
      openChat: () => {},          // noop: tienda no chatea con otras tiendas desde acá
      openNotifications: () => {},
      unreadCount: 0,
    };

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 lg:pb-8">
        {/* Banner "Vista marketplace" */}
        <div className="bg-brand/8 dark:bg-brand/12 border-b border-brand/15 px-4 py-2.5 flex items-center gap-2.5 sticky top-0 z-20">
          <div className="w-2 h-2 rounded-full bg-brand shrink-0" />
          <p className="text-xs font-semibold text-brand-dark dark:text-brand">
            Vista marketplace — {bannerMsg}
          </p>
        </div>

        {inicioSubScreen === 'producto' && inicioSelectedProduct ? (
          <ProductDetailScreen
            {...commonProps}
            oferta={inicioSelectedProduct}
            navigateReplace={inicioNavigate}
            mainScrollRef={{ current: null }}
            setMapaFocusStore={() => {}} setMapaFocusProduct={() => {}} setMapaAutoRoute={() => {}}
          />
        ) : inicioSubScreen === 'tienda' && inicioSelectedTienda ? (
          <TiendaDetailScreen
            {...commonProps}
            tienda={inicioSelectedTienda}
            navigateReplace={inicioNavigate}
          />
        ) : (
          <HomeScreen
            {...commonProps}
            homeActiveCat={homeActiveCat}
            setHomeActiveCat={setHomeActiveCat}
            loadingOfertas={inicioLoadingOfertas}
            loadingDemandas={false}
            demandasActivas={demandas.filter(d => d.estado !== 'resuelto')}
            addRecentSearch={addRecentSearch}
            recentSearches={recentSearches}
            clearRecentSearches={() => setRecentSearches([])}
            navigateSearch={() => {}}
            setEditingDemanda={() => {}}
            VENTAJA_CONFIG={{}}
          />
        )}
      </div>
    );
  };

  // ── Suscripción ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (screen !== 'suscripcion' || !tiendaData?.id) return;
    setLoadingHistorial(true);
    apiFetch(`${API_BASE}/historial-pagos?tiendaId=${tiendaData.id}`, { authRequired: true })
      .then(r => r.ok ? r.json() : { historial: [] })
      .then(data => setHistorialPagos(data.historial || []))
      .catch(() => setHistorialPagos([]))
      .finally(() => setLoadingHistorial(false));
  }, [screen, tiendaData?.id]);

  const SuscripcionScreen = () => {
    const suscripcion = tiendaData?.suscripcion;
    const planActual = userPlan;
    const vence = suscripcion?.vence ? new Date(suscripcion.vence) : null;
    const trial = suscripcion?.trial || false;
    const trialHasta = suscripcion?.trialHasta ? new Date(suscripcion.trialHasta) : null;

    const handlePagarMP = async (plan) => {
      setCheckoutLoading(true);
      try {
        const res = await apiFetch(`${API_BASE}/mp-checkout`, {
          method: 'POST',
          authRequired: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, tiendaId: tiendaData?.id }),
        });
        const data = await res.json();
        if (data.initPoint) {
          window.location.href = data.initPoint;
        } else {
          alert('Error al crear el pago');
        }
      } catch (err) {
        alert('Error: ' + err.message);
      } finally {
        setCheckoutLoading(false);
      }
    };

    return (
      <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950">
        <StorePageHeader title="Suscripción" subtitle="Gestioná tu plan y facturación" onBack={() => setScreen('perfil')} />
        <div className="flex-1 overflow-y-auto">
        <SuscripcionContent
          planActual={planActual}
          isActiva={isActiva}
          isEmpresa={isEmpresa}
          isPremium={isPremium}
          isEmprendimiento={isEmprendimiento}
          vence={vence}
          trial={trial}
          trialHasta={trialHasta}
          dias={dias}
          historialPagos={historialPagos}
          loadingHistorial={loadingHistorial}
          checkoutLoading={checkoutLoading}
          renovando={renovando}
          onPagar={handlePagarMP}
          onTransferencia={(plan) => { setTransferenciaPlan(plan); setShowTransferenciaModal(true); }}
          setShowPremiumModal={setShowPremiumModal}
        />
        </div>
      </div>
    );
    // ── Old SuscripcionScreen (reemplazada) ──
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
        <StorePageHeader title="Suscripción" subtitle="Gestioná tu plan y facturación" onBack={() => setScreen('perfil')} />

        <div className="p-4 lg:p-8 space-y-6 max-w-lg mx-auto">
          {/* Estado actual */}
          <div className={`rounded-3xl p-6 text-white relative overflow-hidden ${isActiva ? 'bg-gradient-to-br from-brand to-brand-dark' : 'bg-gradient-to-br from-rose-500 to-rose-700'}`}>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2">
                {isActiva ? <CheckCircle className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                <span className="font-bold text-sm uppercase tracking-wide">{isActiva ? 'Activa' : 'Vencida'}</span>
              </div>
              <h2 className="font-black text-2xl mb-1">
                {planActual === 'premium' ? 'Plan Premium' : 'Plan Empresa'}
              </h2>
              {vence && (
                <p className="text-white/80 text-sm">
                  Vence el {vence.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              )}
              {trial && trialHasta && (
                <p className="text-white/80 text-sm mt-1">
                  🎁 Trial activo hasta {trialHasta.toLocaleDateString('es-AR', { day: 'numeric', month: 'long' })}
                </p>
              )}
              {dias !== null && dias > 0 && dias <= 7 && (
                <p className="text-amber-200 text-sm font-semibold mt-2">
                  ⚠️ Vence en {dias} día{dias === 1 ? '' : 's'}
                </p>
              )}
            </div>
            {/* Decoración */}
            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/10 rounded-full" />
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-white/5 rounded-full" />
          </div>

          {/* Qué incluye mi plan */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8 p-5">
            <h3 className="font-bold text-slate-900 dark:text-white mb-3">Tu plan incluye</h3>
            <div className="space-y-2">
              {[
                // Emprendimiento (base)
                { text: 'Vendé hasta 5 productos', emprendimiento: true },
                { text: 'Página pública en listados', emprendimiento: true },
                { text: 'Ver demandas (sin responder)', emprendimiento: true },
                { text: '1 búsqueda laboral activa', emprendimiento: true },
                { text: 'Aparecé en el mapa', emprendimiento: true },
                // Empresa Básico (extras)
                { text: 'Vendé hasta 20 productos', basico: true },
                { text: 'Respondé demandas de clientes', basico: true },
                { text: 'Estadísticas básicas', basico: true },
                { text: 'Feed completo de demandas', basico: true },
                { text: 'Badge verificada', basico: true },
                { text: '3 búsquedas laborales', basico: true },
                // Premium (extras)
                { text: 'Productos ilimitados', premium: true },
                { text: 'IA Insights y consejos', premium: true },
                { text: 'Prioridad en búsquedas', premium: true },
                { text: 'Badge premium dorada', premium: true },
                { text: 'Estadísticas avanzadas', premium: true },
                { text: 'Búsquedas laborales ilimitadas', premium: true },
                { text: 'Soporte prioritario', premium: true },
              ]
                .filter(f => {
                  if (isPremium) return f.emprendimiento || f.basico || f.premium;
                  if (isEmpresa) return f.emprendimiento || f.basico;
                  return f.emprendimiento;
                })
                .map(({ text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/8 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                    <span className="text-sm text-slate-700 dark:text-slate-300">{text}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Historial de pagos */}
          {historialPagos.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8 p-5">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Historial de pagos</h3>
              <div className="space-y-2">
                {historialPagos.map((pago, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{pago.plan}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(pago.fecha).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {pago.monto && (
                        <p className="text-sm font-bold text-slate-900 dark:text-white">${Number(pago.monto).toLocaleString()}</p>
                      )}
                      <p className="text-[10px] text-slate-400">MP #{String(pago.paymentId).slice(-6)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {loadingHistorial && historialPagos.length === 0 && (
            <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin" /> Cargando historial...
            </div>
          )}

          {/* Upgrade / Renovar */}
          {planActual !== 'premium' && (
            <div className="bg-amber-50 dark:bg-amber-500/10 rounded-2xl border-2 border-amber-200 dark:border-amber-500/20 p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Upgrade a Premium</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Desbloqueá todo el potencial</p>
                </div>
              </div>
              <button
                onClick={() => setShowPremiumModal(true)}
                className="w-full py-3 rounded-2xl font-bold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-colors"
              >
                Ver beneficios Premium
              </button>
            </div>
          )}

          {/* Renovar suscripción */}
          {(!isActiva || (dias !== null && dias <= 7)) && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8 p-5">
              <h3 className="font-bold text-slate-900 dark:text-white mb-3">Renovar suscripción</h3>
              <div className="space-y-3">
                {/* Plan Mensual */}
                <div className="p-4 rounded-2xl border-2 border-slate-200 dark:border-white/10">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Plan Mensual</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">1 mes + 1 de regalo al activar</p>
                    </div>
                    <p className="font-black text-xl">${PRECIO_MENSUAL.toLocaleString()}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setTransferenciaPlan('mensual'); setShowTransferenciaModal(true); }}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      Transferencia
                    </button>
                    <button
                      onClick={() => handlePagarMP('mensual')}
                      disabled={checkoutLoading}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-[#009EE3] hover:bg-[#007EB5] text-white transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      MercadoPago
                    </button>
                  </div>
                </div>

                {/* Plan Anual */}
                <div className="p-4 rounded-2xl border-2 border-brand bg-brand/5 relative">
                  <div className="absolute -top-2.5 left-4 bg-brand text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                    AHORRÁS 20%
                  </div>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">Plan Anual</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">13 meses de acceso</p>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-xl text-brand">${PRECIO_ANUAL_MES.toLocaleString()}</p>
                      <p className="text-[10px] text-slate-400">ARS/mes · Total ${PRECIO_ANUAL.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => { setTransferenciaPlan('anual'); setShowTransferenciaModal(true); }}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <CreditCard className="w-4 h-4" />
                      Transferencia
                    </button>
                    <button
                      onClick={() => handlePagarMP('anual')}
                      disabled={checkoutLoading}
                      className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl font-bold text-sm bg-[#009EE3] hover:bg-[#007EB5] text-white transition-colors disabled:opacity-50"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-2h2v2zm0-4h-2V7h2v6zm4 4h-2v-2h2v2zm0-4h-2V7h2v6z"/>
                      </svg>
                      MercadoPago
                    </button>
                  </div>
                </div>
              </div>
              {checkoutLoading && (
                <div className="flex items-center justify-center gap-2 text-slate-500 text-sm py-3">
                  <Loader2 className="w-4 h-4 animate-spin" /> Preparando pago...
                </div>
              )}
            </div>
          )}

          {/* Info de pago */}
          <div className="bg-slate-100 dark:bg-white/5 rounded-2xl p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Pago seguro procesado por MercadoPago · Podés cancelar cuando quieras
            </p>
          </div>
        </div>
      </div>
    );
  };

  // ── Estadisticas ───────────────────────────────────────────────────────────
  const TEMPLATE_INFO = TEMPLATES_META;
  const PRESET_COLORS = ['#00b8d9','#6366f1','#f59e0b','#10b981','#ef4444','#8b5cf6','#ec4899','#0ea5e9'];

  // Componente separado para respetar Rules of Hooks
  const EditorPanel = ({ hasSlug, slug, previewUrl, paginaForm, setPaginaForm, publicPageForm, setPublicPageForm, savePagina, tienda, setPaginaSaved, hideUrl = false }) => {
    const toggle = (id) => setOpenEditorPanel(v => v === id ? null : id);

    const AccordionHeader = ({ id, label, summary }) => (
      <button onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/4 transition-colors">
        <div className="text-left">
          <p className="text-sm font-bold">{label}</p>
          {summary && <p className="text-xs text-slate-400 mt-0.5">{summary}</p>}
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openEditorPanel === id ? 'rotate-180' : ''}`} />
      </button>
    );

    const TemplateThumbnail = ({ id }) => {
      const sel = paginaForm.template === id;
      const c = sel ? paginaForm.color : '#94a3b8';
      if (id === 'minimal') return (
        <svg viewBox="0 0 60 80" fill="none" className="w-full h-full">
          <rect width="60" height="80" rx="4" fill={sel ? `${c}18` : '#f1f5f9'} />
          <rect x="10" y="8" width="40" height="10" rx="2" fill={c} opacity="0.8" />
          <rect x="15" y="22" width="30" height="3" rx="1.5" fill={c} opacity="0.4" />
          <rect x="6" y="30" width="48" height="16" rx="2" fill={c} opacity="0.15" />
          <rect x="6" y="50" width="22" height="12" rx="2" fill={c} opacity="0.2" />
          <rect x="32" y="50" width="22" height="12" rx="2" fill={c} opacity="0.2" />
          <rect x="6" y="66" width="48" height="8" rx="2" fill={c} opacity="0.1" />
        </svg>
      );
      if (id === 'tarjetas') return (
        <svg viewBox="0 0 60 80" fill="none" className="w-full h-full">
          <rect width="60" height="80" rx="4" fill={sel ? `${c}18` : '#f1f5f9'} />
          <rect x="4" y="4" width="52" height="20" rx="3" fill={c} opacity="0.7" />
          <rect x="4" y="28" width="25" height="22" rx="2" fill={c} opacity="0.25" />
          <rect x="31" y="28" width="25" height="22" rx="2" fill={c} opacity="0.25" />
          <rect x="4" y="53" width="25" height="22" rx="2" fill={c} opacity="0.15" />
          <rect x="31" y="53" width="25" height="22" rx="2" fill={c} opacity="0.15" />
        </svg>
      );
      if (id === 'magazine') return (
        <svg viewBox="0 0 60 80" fill="none" className="w-full h-full">
          <rect width="60" height="80" rx="4" fill={sel ? `${c}18` : '#f1f5f9'} />
          <rect width="60" height="28" rx="4" fill={c} opacity="0.75" />
          <rect x="4" y="32" width="32" height="20" rx="2" fill={c} opacity="0.2" />
          <rect x="39" y="32" width="17" height="9" rx="2" fill={c} opacity="0.2" />
          <rect x="39" y="43" width="17" height="9" rx="2" fill={c} opacity="0.15" />
          <rect x="4" y="56" width="16" height="18" rx="2" fill={c} opacity="0.2" />
          <rect x="22" y="56" width="16" height="18" rx="2" fill={c} opacity="0.2" />
          <rect x="40" y="56" width="16" height="18" rx="2" fill={c} opacity="0.2" />
        </svg>
      );
      if (id === 'detail') return (
        <svg viewBox="0 0 60 80" fill="none" className="w-full h-full">
          <rect width="60" height="80" rx="4" fill={sel ? `${c}18` : '#f1f5f9'} />
          <rect width="60" height="24" rx="4" fill={c} opacity="0.7" />
          <rect x="6" y="16" width="16" height="16" rx="4" fill={sel ? paginaForm.color : '#fff'} stroke={sel ? `${c}60` : '#e2e8f0'} strokeWidth="1.5" />
          <rect x="25" y="26" width="28" height="4" rx="2" fill={c} opacity="0.7" />
          <rect x="25" y="32" width="18" height="2.5" rx="1.25" fill={c} opacity="0.3" />
          <rect x="6" y="36" width="14" height="4" rx="2" fill={c} opacity="0.25" />
          <rect x="22" y="36" width="12" height="4" rx="2" fill={c} opacity="0.15" />
          <rect x="6" y="44" width="14" height="8" rx="2" fill="#25D366" opacity="0.8" />
          <rect x="22" y="44" width="11" height="8" rx="2" fill={c} opacity="0.2" />
          <rect x="35" y="44" width="11" height="8" rx="2" fill={c} opacity="0.2" />
          <rect x="6" y="56" width="22" height="18" rx="2" fill={c} opacity="0.2" />
          <rect x="32" y="56" width="22" height="18" rx="2" fill={c} opacity="0.2" />
        </svg>
      );
      /* market — sidebar izq + grid de cards full-bleed oscuras */
      if (id === 'market' || id === 'market-dark') return (
        <svg viewBox="0 0 60 80" fill="none" className="w-full h-full">
          <rect width="60" height="80" rx="4" fill="#0e1525" />
          {/* hero banner */}
          <rect width="60" height="22" rx="4" fill={c} opacity="0.5" />
          <rect x="4" y="6" width="20" height="3" rx="1.5" fill="#fff" opacity="0.9" />
          <rect x="4" y="11" width="14" height="2" rx="1" fill="#fff" opacity="0.4" />
          {/* sidebar */}
          <rect x="4" y="26" width="13" height="50" rx="2" fill="#fff" opacity="0.04" />
          <rect x="6" y="29" width="9" height="2.5" rx="1.25" fill={c} opacity="0.6" />
          <rect x="6" y="34" width="7" height="2" rx="1" fill="#fff" opacity="0.2" />
          <rect x="6" y="38" width="8" height="2" rx="1" fill="#fff" opacity="0.2" />
          <rect x="6" y="42" width="6" height="2" rx="1" fill="#fff" opacity="0.15" />
          {/* grid cards */}
          <rect x="20" y="26" width="18" height="23" rx="2" fill="#fff" opacity="0.07" />
          <rect x="20" y="26" width="18" height="14" rx="2" fill={c} opacity="0.3" />
          <rect x="40" y="26" width="16" height="23" rx="2" fill="#fff" opacity="0.07" />
          <rect x="40" y="26" width="16" height="14" rx="2" fill={c} opacity="0.2" />
          <rect x="20" y="52" width="18" height="23" rx="2" fill="#fff" opacity="0.07" />
          <rect x="20" y="52" width="18" height="14" rx="2" fill={c} opacity="0.2" />
          <rect x="40" y="52" width="16" height="23" rx="2" fill="#fff" opacity="0.07" />
          <rect x="40" y="52" width="16" height="14" rx="2" fill={c} opacity="0.15" />
        </svg>
      );
      /* minimal-pro — lista vertical compacta */
      if (id === 'minimal-pro') return (
        <svg viewBox="0 0 60 80" fill="none" className="w-full h-full">
          <rect width="60" height="80" rx="4" fill={sel ? `${c}18` : '#f1f5f9'} />
          {/* header compacto */}
          <rect x="4" y="4" width="52" height="10" rx="2" fill={c} opacity="0.15" />
          <rect x="8" y="7" width="16" height="4" rx="2" fill={c} opacity="0.7" />
          {/* search */}
          <rect x="4" y="17" width="52" height="6" rx="3" fill={c} opacity="0.1" />
          {/* chips */}
          <rect x="4" y="26" width="12" height="4" rx="2" fill={c} opacity="0.6" />
          <rect x="18" y="26" width="10" height="4" rx="2" fill={c} opacity="0.2" />
          <rect x="30" y="26" width="14" height="4" rx="2" fill={c} opacity="0.2" />
          {/* filas de productos */}
          {[0,1,2,3].map(i => (
            <g key={i}>
              <rect x="4" y={34+i*11} width="8" height="8" rx="1.5" fill={c} opacity="0.25" />
              <rect x="14" y={35+i*11} width="24" height="2.5" rx="1.25" fill={c} opacity="0.5" />
              <rect x="14" y={39+i*11} width="16" height="2" rx="1" fill={c} opacity="0.2" />
              <rect x="46" y={35+i*11} width="10" height="5" rx="2" fill={c} opacity="0.4" />
            </g>
          ))}
        </svg>
      );
      /* PARALLAX/Nebula — parallax hero + grid 2 cols + ambient orbs */
      if (id === 'PARALLAX') return (
        <svg viewBox="0 0 60 80" fill="none" className="w-full h-full">
          <rect width="60" height="80" rx="4" fill="#070b14" />
          <ellipse cx="8" cy="12" rx="16" ry="16" fill={c} opacity="0.15" />
          <ellipse cx="55" cy="68" rx="14" ry="14" fill={c} opacity="0.1" />
          {/* header glass */}
          <rect width="60" height="9" rx="4" fill="#fff" opacity="0.04" />
          <rect x="3" y="2.5" width="5" height="4" rx="1.5" fill={c} opacity="0.8" />
          <rect x="52" y="3" width="5" height="3" rx="1.5" fill="#fff" opacity="0.1" />
          {/* hero parallax */}
          <rect x="0" y="9" width="60" height="30" fill={c} opacity="0.18" />
          <rect x="0" y="28" width="60" height="11" rx="0" fill="url(#nbGrad)" />
          <rect x="4" y="22" width="28" height="7" rx="2" fill="#fff" opacity="0.9" />
          <rect x="4" y="31" width="16" height="2.5" rx="1.25" fill="#fff" opacity="0.45" />
          {/* grid 2 cols */}
          <rect x="4" y="43" width="24" height="16" rx="3" fill="#fff" opacity="0.06" />
          <rect x="4" y="43" width="24" height="10" rx="3" fill={c} opacity="0.28" />
          <rect x="32" y="43" width="24" height="16" rx="3" fill="#fff" opacity="0.06" />
          <rect x="32" y="43" width="24" height="10" rx="3" fill={c} opacity="0.2" />
          <rect x="4" y="62" width="24" height="14" rx="3" fill="#fff" opacity="0.05" />
          <rect x="32" y="62" width="24" height="14" rx="3" fill="#fff" opacity="0.05" />
          {/* bottom nav */}
          <rect x="0" y="74" width="60" height="6" rx="0" fill="#fff" opacity="0.04" />
          <defs>
            <linearGradient id="nbGrad" x1="0" y1="28" x2="0" y2="39" gradientUnits="userSpaceOnUse">
              <stop stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.75" />
            </linearGradient>
          </defs>
        </svg>
      );
      /* premium — dark glassmorphism con orbs de color */
      if (id === 'premium') return (
        <svg viewBox="0 0 60 80" fill="none" className="w-full h-full">
          <rect width="60" height="80" rx="4" fill="#070b14" />
          {/* orbs de ambiente */}
          <ellipse cx="10" cy="15" rx="18" ry="18" fill={c} opacity="0.12" />
          <ellipse cx="55" cy="50" rx="14" ry="14" fill={c} opacity="0.08" />
          {/* header glassmorphism */}
          <rect width="60" height="10" rx="4" fill="#fff" opacity="0.04" />
          <rect x="3" y="3" width="6" height="4" rx="1.5" fill={c} opacity="0.7" />
          <rect x="13" y="4" width="24" height="2" rx="1" fill="#fff" opacity="0.15" />
          <rect x="52" y="3" width="5" height="4" rx="1.5" fill="#fff" opacity="0.1" />
          {/* hero cinemático */}
          <rect x="3" y="13" width="54" height="26" rx="4" fill={c} opacity="0.2" />
          <rect x="3" y="13" width="54" height="26" rx="4" fill="url(#premGrad)" opacity="0.6" />
          <rect x="7" y="28" width="22" height="5" rx="2" fill="#fff" opacity="0.9" />
          <rect x="7" y="35" width="14" height="2.5" rx="1.25" fill="#fff" opacity="0.4" />
          {/* grid de cards */}
          <rect x="3" y="43" width="17" height="20" rx="3" fill="#fff" opacity="0.06" />
          <rect x="3" y="43" width="17" height="12" rx="3" fill={c} opacity="0.25" />
          <rect x="22" y="43" width="17" height="20" rx="3" fill="#fff" opacity="0.06" />
          <rect x="22" y="43" width="17" height="12" rx="3" fill={c} opacity="0.18" />
          <rect x="41" y="43" width="16" height="20" rx="3" fill="#fff" opacity="0.06" />
          <rect x="41" y="43" width="16" height="12" rx="3" fill={c} opacity="0.12" />
          {/* bottom nav */}
          <rect x="3" y="66" width="54" height="11" rx="3" fill="#fff" opacity="0.05" />
          <rect x="8" y="69" width="8" height="5" rx="1.5" fill={c} opacity="0.7" />
          <rect x="22" y="70" width="5" height="3" rx="1" fill="#fff" opacity="0.2" />
          <rect x="33" y="70" width="5" height="3" rx="1" fill="#fff" opacity="0.2" />
          <rect x="45" y="70" width="5" height="3" rx="1" fill="#fff" opacity="0.2" />
          <defs>
            <linearGradient id="premGrad" x1="3" y1="13" x2="3" y2="39" gradientUnits="userSpaceOnUse">
              <stop stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.7" />
            </linearGradient>
          </defs>
        </svg>
      );
      /* base — parallax hero + sidebar + 2-col grid, light/dark */
      if (id === 'base') return (
        <svg viewBox="0 0 60 80" fill="none" className="w-full h-full">
          <rect width="60" height="80" rx="4" fill={sel ? `${c}10` : '#f8fafc'} />
          {/* header sticky */}
          <rect width="60" height="9" rx="4" fill={sel ? `${c}15` : '#f1f5f9'} />
          <rect x="3" y="3" width="5" height="3" rx="1.5" fill={c} opacity="0.8" />
          <rect x="12" y="3.5" width="20" height="2" rx="1" fill={c} opacity="0.2" />
          <rect x="52" y="3" width="5" height="3" rx="1.5" fill={c} opacity="0.3" />
          {/* hero parallax */}
          <rect x="0" y="9" width="60" height="26" fill={c} opacity="0.22" />
          <rect x="0" y="25" width="60" height="10" fill="url(#baseGrad)" />
          <rect x="4" y="17" width="8" height="8" rx="2" fill="#fff" opacity="0.9" />
          <rect x="14" y="19" width="22" height="4" rx="2" fill="#fff" opacity="0.9" />
          <rect x="14" y="25" width="14" height="2" rx="1" fill="#fff" opacity="0.5" />
          {/* category chips */}
          <rect x="4" y="38" width="10" height="4" rx="2" fill={c} opacity="0.7" />
          <rect x="16" y="38" width="8" height="4" rx="2" fill={c} opacity="0.2" />
          <rect x="26" y="38" width="10" height="4" rx="2" fill={c} opacity="0.15" />
          {/* grid 2 cols */}
          <rect x="4" y="45" width="24" height="16" rx="2" fill={c} opacity="0.12" />
          <rect x="4" y="45" width="24" height="10" rx="2" fill={c} opacity="0.2" />
          <rect x="32" y="45" width="24" height="16" rx="2" fill={c} opacity="0.12" />
          <rect x="32" y="45" width="24" height="10" rx="2" fill={c} opacity="0.15" />
          <rect x="4" y="64" width="24" height="12" rx="2" fill={c} opacity="0.1" />
          <rect x="32" y="64" width="24" height="12" rx="2" fill={c} opacity="0.1" />
          {/* bottom nav */}
          <rect x="0" y="74" width="60" height="6" rx="0" fill={c} opacity="0.08" />
          <defs>
            <linearGradient id="baseGrad" x1="0" y1="25" x2="0" y2="35" gradientUnits="userSpaceOnUse">
              <stop stopColor="#000" stopOpacity="0" />
              <stop offset="1" stopColor="#000" stopOpacity="0.55" />
            </linearGradient>
          </defs>
        </svg>
      );
      return null;
    };

    const seccionesOrdenadas = Object.entries(SECCIONES_DEFAULT)
      .map(([key, def]) => ({
        key, def,
        activa: paginaForm.secciones?.[key]?.activa ?? def.activa,
        orden:  paginaForm.secciones?.[key]?.orden  ?? def.orden,
      }))
      .sort((a, b) => a.orden - b.orden);

    const toggleSeccion = (key, def, activa) => setPaginaForm(f => ({
      ...f,
      secciones: { ...f.secciones, [key]: { ...(f.secciones?.[key] || def), activa: !activa } }
    }));

    const moverSeccion = (key, dir) => setPaginaForm(f => {
      const secs = { ...f.secciones };
      const lista = Object.entries(SECCIONES_DEFAULT)
        .map(([k, d]) => ({ key: k, orden: secs[k]?.orden ?? d.orden }))
        .sort((a, b) => a.orden - b.orden);
      const idx = lista.findIndex(s => s.key === key);
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= lista.length) return f;
      const a = lista[idx], b = lista[swap];
      return {
        ...f,
        secciones: {
          ...secs,
          [a.key]: { ...(secs[a.key] || SECCIONES_DEFAULT[a.key]), orden: b.orden },
          [b.key]: { ...(secs[b.key] || SECCIONES_DEFAULT[b.key]), orden: a.orden },
        }
      };
    });

    return (
      <div className="w-full lg:w-80 flex-shrink-0 h-full overflow-y-auto flex flex-col divide-y divide-slate-100 dark:divide-white/8">

        {/* URL — solo en desktop */}
        {!hideUrl && !hasSlug ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">Primero elegí tu URL</p>
            <div className="flex items-center bg-white dark:bg-white/5 rounded-xl border border-amber-200 dark:border-amber-500/30 overflow-hidden focus-within:border-brand transition-colors">
              <span className="pl-3 text-xs text-slate-400 whitespace-nowrap">lokal.ar/t/</span>
              <input
                value={publicPageForm.slug}
                onChange={e => setPublicPageForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                onKeyDown={e => e.key === 'Enter' && publicPageForm.slug.trim() && savePagina()}
                placeholder="mi-tienda"
                autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false}
                className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"
              />
            </div>
            <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-1.5">Solo letras, números y guiones</p>
          </div>
        ) : !hideUrl ? (
          <div className="p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center shrink-0">
              <ExternalLink className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
            <a href={previewUrl} target="_blank" rel="noreferrer" className="flex-1 text-sm font-semibold text-brand-dark dark:text-brand hover:underline truncate">
              lokal.ar/t/{slug}
            </a>
            <button onClick={() => { const url = `${window.location.origin}/t/${slug}`; if (navigator.share) { navigator.share({ title: tienda?.nombre || '', url }); } else { navigator.clipboard.writeText(url).then(() => { setPaginaSaved(true); setTimeout(() => setPaginaSaved(false), 2000); }); } }}
              className="text-xs font-semibold bg-slate-100 dark:bg-white/8 px-2.5 py-1.5 rounded-lg shrink-0">
              Compartir
            </button>
          </div>
        ) : null}

        {/* Template */}
        <div>
          <AccordionHeader id="template" label="Plantilla" summary={TEMPLATE_INFO[paginaForm.template]?.label} />
          {openEditorPanel === 'template' && (
            <div className="pb-4 pl-4 flex gap-2 overflow-x-auto" style={{ scrollbarWidth:'none', WebkitOverflowScrolling:'touch', paddingRight:16 }}>
              {Object.entries(TEMPLATE_INFO).map(([key, info]) => {
                const sel = paginaForm.template === key;
                return (
                  <button key={key} onClick={() => setPaginaForm(f => ({ ...f, template: key }))}
                    className={`flex flex-col items-center gap-1.5 p-1.5 rounded-xl border-2 transition-all shrink-0 ${sel ? 'border-brand bg-brand/5 dark:bg-brand/10 shadow-sm' : 'border-transparent bg-slate-50 dark:bg-white/4'}`}
                    style={{ width: 72 }}>
                    <div className="w-full rounded-md overflow-hidden" style={{ aspectRatio:'3/4' }}>
                      <TemplateThumbnail id={key} />
                    </div>
                    <span className={`text-[10px] font-bold leading-none text-center w-full truncate ${sel ? 'text-brand' : 'text-slate-500'}`}>{info.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Color */}
        <div>
          <AccordionHeader id="color" label="Color de marca"
            summary={<span className="flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: '50%', background: paginaForm.color, display: 'inline-block' }} />{paginaForm.color}</span>} />
          {openEditorPanel === 'color' && (
            <div className="px-4 pb-4 space-y-3">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button key={c} onClick={() => setPaginaForm(f => ({ ...f, color: c }))}
                    style={{ width: 34, height: 34, borderRadius: 10, background: c, outline: paginaForm.color === c ? `3px solid ${c}` : 'none', outlineOffset: 2, border: '2px solid rgba(255,255,255,.25)', cursor: 'pointer', transition: 'transform .1s', transform: paginaForm.color === c ? 'scale(1.18)' : 'scale(1)' }} />
                ))}
              </div>
              <div className="flex items-center gap-3 border-t border-slate-100 dark:border-white/8 pt-3">
                <input type="color" value={paginaForm.color}
                  onChange={e => setPaginaForm(f => ({ ...f, color: e.target.value }))}
                  className="w-9 h-9 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer bg-transparent p-0.5" />
                <span className="text-sm font-mono text-slate-500 flex-1">{paginaForm.color}</span>
                <button onClick={() => setPaginaForm(f => ({ ...f, modoOscuro: !f.modoOscuro }))}
                  title={paginaForm.modoOscuro ? 'Modo oscuro activo' : 'Modo claro'}
                  className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${paginaForm.modoOscuro ? 'bg-slate-700' : 'bg-slate-200 dark:bg-white/15'}`}>
                  <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform text-[8px] flex items-center justify-center ${paginaForm.modoOscuro ? 'translate-x-5' : 'translate-x-0'}`}>
                    {paginaForm.modoOscuro ? '🌙' : '☀️'}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Secciones */}
        <div>
          <AccordionHeader id="secciones" label="Secciones"
            summary={`${seccionesOrdenadas.filter(s => s.activa).length} de ${seccionesOrdenadas.length} activas`} />
          {openEditorPanel === 'secciones' && (
            <div className="px-3 pb-4 space-y-1">
              {seccionesOrdenadas.map(({ key, def, activa }, i) => (
                <div key={key}
                  className={`flex items-center gap-2 px-2 py-2.5 rounded-xl transition-all ${activa ? 'bg-slate-50 dark:bg-white/5' : 'opacity-45'}`}>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moverSeccion(key, 'up')} disabled={i === 0}
                      className="w-5 h-4 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 text-slate-300 dark:text-slate-600 disabled:opacity-20 transition-colors text-[9px] leading-none">▲</button>
                    <button onClick={() => moverSeccion(key, 'down')} disabled={i === seccionesOrdenadas.length - 1}
                      className="w-5 h-4 rounded flex items-center justify-center hover:bg-slate-200 dark:hover:bg-white/10 text-slate-300 dark:text-slate-600 disabled:opacity-20 transition-colors text-[9px] leading-none">▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-none">{def.label}</p>
                    <p className="text-xs text-slate-400 mt-0.5 truncate">{def.desc}</p>
                  </div>
                  <button onClick={() => toggleSeccion(key, def, activa)}
                    className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${activa ? 'bg-brand' : 'bg-slate-200 dark:bg-white/15'}`}>
                    <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${activa ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-slate-400 pt-1 px-2">Guardá para aplicar los cambios</p>
            </div>
          )}
        </div>

      </div>
    );
  };

  const MiPaginaScreen = () => {
    const slug = tienda?.slug || tiendaData?.slug || publicPageForm.slug || '';
    const previewUrl = slug ? `/t/${slug}` : null;
    const hasSlug = !!slug;
    const storeId = tienda?.id || tiendaData?.id;

    return (
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 flex flex-col z-[5000] lg:relative lg:inset-auto lg:z-auto lg:min-h-screen">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/8 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setScreen('perfil')} className="w-9 h-9 rounded-xl hover:bg-slate-100 dark:hover:bg-white/8 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-base leading-none">Mi página pública</h1>
            {paginaSaved
              ? <p className="text-xs text-emerald-500 font-semibold mt-0.5">¡Guardado!</p>
              : paginaError
              ? <p className="text-xs text-rose-500 mt-0.5 truncate">{paginaError}</p>
              : <p className="text-xs text-slate-400 mt-0.5">{hasSlug ? 'Guardá para ver los cambios en la preview' : 'Primero elegí una URL'}</p>
            }
          </div>
          <button
            onClick={savePagina}
            disabled={savingPagina || !storeId || (!hasSlug && !publicPageForm.slug.trim())}
            className="flex items-center gap-1.5 bg-brand hover:bg-brand-light disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm px-4 py-2 rounded-xl transition-all"
          >
            {savingPagina ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar
          </button>
        </div>

        {/* ── MOBILE: preview arriba + bottom sheet editor ── */}
        <div className="lg:hidden flex-1 relative overflow-hidden" style={{ minHeight: 0, contain: 'strict' }}>
          {/* Preview: teléfono ocupa todo el ancho disponible */}
          <div className="absolute inset-0 flex items-start justify-center bg-slate-200 dark:bg-slate-900 overflow-hidden" style={{ paddingTop: 8, paddingLeft: 8, paddingRight: 8 }}>
            {/* frameW = 100% del área - 16px márgenes. El contenido interno = frameW - 16px borde */}
            <div style={{ width: '100%', maxWidth: 480, flexShrink: 0 }}>
              <div style={{ width: '100%', borderRadius: 32, border: '8px solid #1e293b', background: '#0f172a', boxShadow: '0 16px 48px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.06)', overflow: 'hidden' }}>
                {/* Notch */}
                <div style={{ height: 22, background: '#1e293b', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 3 }}>
                  <div style={{ width: 56, height: 8, borderRadius: 6, background: '#0f172a' }} />
                </div>
                {/* Contenido: alto fijo para que el sheet tape el resto */}
                <div style={{ height: 'calc(100dvh - 56px - 52px - 38px)', background: paginaForm.modoOscuro ? '#0a0d16' : '#f8fafc', overflowY: 'auto', overflowX: 'hidden', position: 'relative', WebkitOverflowScrolling: 'touch' }}>
                  {tienda ? (
                    <div key={previewKey} style={{ transformOrigin: 'top left', transform: 'scale(var(--phone-scale, 1))', width: 'calc(100% / var(--phone-scale, 1))' }}
                      ref={el => {
                        if (el) {
                          const parentW = el.parentElement?.clientWidth || 360;
                          const s = parentW / 390;
                          el.style.transform = `scale(${s})`;
                          el.style.width = `${100 / s}%`;
                        }
                      }}>
                      <TiendaPublicaRenderer
                        tienda={{ ...tienda, pagina: paginaForm }}
                        paginaOverride={paginaForm}
                        previewMode={true}
                      />
                    </div>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#64748b' }}>
                      <Store style={{ width: 28, height: 28, opacity: .3 }} />
                      <p style={{ fontSize: 12, fontWeight: 600 }}>Cargando...</p>
                    </div>
                  )}
                </div>
                {/* Chin */}
                <div style={{ height: 16, background: '#1e293b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: 48, height: 3, borderRadius: 3, background: 'rgba(255,255,255,.2)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom sheet — handle arriba, contenido scrolleable */}
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col transition-all duration-300 ease-out bg-white dark:bg-slate-900 shadow-2xl"
            style={{ maxHeight: editorSheetOpen ? '75%' : '52px', height: editorSheetOpen ? 'auto' : '52px', overflow: 'hidden' }}
          >
            {/* Handle / drag bar */}
            <button
              onClick={() => setEditorSheetOpen(v => !v)}
              className="w-full flex flex-col items-center justify-center gap-1 py-3 shrink-0 border-t border-slate-200 dark:border-white/10"
            >
              <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-white/20" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {editorSheetOpen ? 'Ocultar editor' : 'Editar página'}
              </p>
            </button>
            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/8">
              <EditorPanel
                hasSlug={hasSlug} slug={slug} previewUrl={previewUrl}
                paginaForm={paginaForm} setPaginaForm={setPaginaForm}
                publicPageForm={publicPageForm} setPublicPageForm={setPublicPageForm}
                savePagina={savePagina} tienda={tienda} setPaginaSaved={setPaginaSaved}
                hideUrl={true}
              />
            </div>
          </div>
        </div>

        {/* ── DESKTOP: panel izq + preview fija ── */}
        <div className="hidden lg:flex flex-1 overflow-hidden" style={{ minHeight: 0 }}>
          <EditorPanel
            hasSlug={hasSlug} slug={slug} previewUrl={previewUrl}
            paginaForm={paginaForm} setPaginaForm={setPaginaForm}
            publicPageForm={publicPageForm} setPublicPageForm={setPublicPageForm}
            savePagina={savePagina} tienda={tienda} setPaginaSaved={setPaginaSaved}
          />

          <div className="flex flex-1 items-center justify-center overflow-hidden bg-slate-100 dark:bg-slate-950/50">
            <div style={{ width: 320, flexShrink: 0 }}>
              <div style={{ width: 320, borderRadius: 42, border: '10px solid #1e293b', background: '#0f172a', boxShadow: '0 30px 80px rgba(0,0,0,.4), inset 0 0 0 1px rgba(255,255,255,.05)', overflow: 'hidden' }}>
                <div style={{ height: 28, background: '#1e293b', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 4 }}>
                  <div style={{ width: 80, height: 10, borderRadius: 8, background: '#0f172a' }} />
                </div>
                <div style={{ height: 580, background: paginaForm.modoOscuro ? '#0f172a' : '#f8fafc', position: 'relative', overflowY: 'auto' }}>
                  {tienda ? (
                    <div key={previewKey} style={{ transformOrigin: 'top left', transform: 'scale(0.55)', width: '182%', pointerEvents: 'none' }}>
                      <TiendaPublicaRenderer
                        tienda={{ ...tienda, pagina: paginaForm }}
                        paginaOverride={paginaForm}
                        previewMode={true}
                      />
                    </div>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: '#64748b' }}>
                      <Store style={{ width: 32, height: 32, opacity: .3 }} />
                      <p style={{ fontSize: 13, fontWeight: 600 }}>Cargando tienda...</p>
                    </div>
                  )}
                </div>
                <div style={{ height: 20, background: '#1e293b', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: 60, height: 4, borderRadius: 4, background: 'rgba(255,255,255,.2)' }} />
                </div>
              </div>
              <p className="text-center text-xs text-slate-400 mt-3">Preview en vivo · escala reducida</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatsScreen = () => {
    const totalRespuestas = misRespuestas.length;
    const demandasConRespuesta = new Set(misRespuestas.map(r => r.demandaId)).size;
    const tasaRespuesta = demandas.length > 0
      ? Math.round((demandasConRespuesta / demandas.length) * 100)
      : 0;

    const fetchInsights = async () => {
      setAiLoading(true);
      setAiError(null);
      try {
        const res = await apiFetch(`${API_BASE}/store-insights`, { authRequired: true });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Error al generar análisis');
        }
        setAiData(await res.json());
      } catch (e) {
        setAiError(e.message);
      } finally {
        setAiLoading(false);
      }
    };

    const prioColor = (p) => p === 'alta' ? 'text-rose-500 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
      : p === 'media' ? 'text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20'
      : 'text-slate-500 bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10';

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 lg:pb-8">
        <StorePageHeader title="Estadísticas" subtitle="Rendimiento de tu tienda" />

        <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
          {/* Cards visitas mock */}
          {mockMode && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Visitas hoy', value: MOCK_STATS.visitasHoy, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Esta semana', value: MOCK_STATS.visitasSemana, color: 'text-blue-600 dark:text-blue-400' },
                { label: 'Este mes', value: MOCK_STATS.visitasMes, color: 'text-violet-600 dark:text-violet-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8 p-4 text-center">
                  <p className={`text-2xl font-black ${color}`}>{value.toLocaleString()}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
          {mockMode && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8 p-5">
              <h3 className="font-bold text-sm mb-3">Productos más vistos</h3>
              <div className="space-y-2">
                {MOCK_STATS.productosVistos.map((p, i) => (
                  <div key={p.nombre} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold truncate">{p.nombre}</span>
                        <span className="text-xs text-slate-400 shrink-0 ml-2">{p.visitas}</span>
                      </div>
                      <div className="h-1.5 bg-slate-100 dark:bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${Math.round(p.visitas / MOCK_STATS.productosVistos[0].visitas * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cards stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                label: 'Demandas activas',
                value: demandas.length,
                icon: Package,
                iconWrapClass: 'bg-blue-100 dark:bg-blue-500/15',
                iconClass: 'text-blue-600 dark:text-blue-400',
              },
              {
                label: 'Respuestas enviadas',
                value: totalRespuestas,
                icon: MessageSquare,
                iconWrapClass: 'bg-brand/10 dark:bg-brand/15',
                iconClass: 'text-brand-dark dark:text-brand',
              },
              {
                label: 'Tasa de respuesta',
                value: `${tasaRespuesta}%`,
                icon: TrendingUp,
                iconWrapClass: 'bg-violet-100 dark:bg-violet-500/10',
                iconClass: 'text-violet-600 dark:text-violet-400',
              },
            ].map(({ label, value, icon: Icon, iconWrapClass, iconClass }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${iconWrapClass}`}>
                  <Icon className={`w-5 h-5 ${iconClass}`} />
                </div>
                <p className="text-3xl font-bold mb-1">{value}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
              </div>
            ))}
          </div>

          {/* Actividad reciente */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5">
            <h3 className="font-bold mb-4">Ultimas respuestas</h3>
            {misRespuestas.length === 0 ? (
              <p className="text-sm text-slate-400">Sin actividad todavia</p>
            ) : misRespuestas.slice(0, 5).map(r => (
              <div key={r.id} className="flex items-center gap-3 py-3 border-b dark:border-white/10 last:border-0">
                <div className="w-8 h-8 bg-brand/15 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-brand-dark" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.demandaTitulo || 'Demanda'}</p>
                  <p className="text-xs text-slate-400">{r.tiempoRespuesta || 'Reciente'}</p>
                </div>
                {r.precio && <p className="text-sm font-bold text-brand-dark shrink-0">${r.precio.toLocaleString()}</p>}
              </div>
            ))}
          </div>

          {/* ── Análisis IA ──────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand" /> Análisis IA
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Guía personalizada basada en tu actividad</p>
              </div>
              {!aiData && (
                <button
                  onClick={fetchInsights}
                  disabled={aiLoading}
                  className="flex items-center gap-1.5 px-4 py-2 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  {aiLoading ? 'Analizando...' : 'Analizar'}
                </button>
              )}
              {aiData && (
                <button onClick={() => { setAiData(null); setAiError(null); }} className="text-xs text-slate-400 hover:text-slate-600">Actualizar</button>
              )}
            </div>

            {aiError && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-400">
                {aiError}
              </div>
            )}

            {!aiData && !aiLoading && !aiError && (
              <div className="text-center py-6 text-slate-400">
                <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Presioná "Analizar" para obtener consejos personalizados sobre tu tienda</p>
              </div>
            )}

            {aiLoading && (
              <div className="flex flex-col items-center py-8 gap-3 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
                <p className="text-sm">Analizando tu tienda...</p>
              </div>
            )}

            {aiData && (
              <div className="space-y-4">
                {/* Score + resumen */}
                <div className="flex items-center gap-4 bg-slate-50 dark:bg-white/5 rounded-2xl p-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand/15 dark:bg-brand/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xl font-black text-brand-dark dark:text-brand">{aiData.insights?.score ?? '—'}</span>
                    <span className="text-[9px] text-slate-400 font-semibold">/ 10</span>
                  </div>
                  <p className="text-sm font-semibold flex-1">{aiData.insights?.resumen}</p>
                </div>

                {/* Consejos */}
                {(aiData.insights?.consejos || []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Consejos</p>
                    {aiData.insights.consejos.map((c, i) => (
                      <div key={i} className={`flex gap-3 p-3.5 rounded-2xl border ${prioColor(c.prioridad)}`}>
                        <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-sm">{c.titulo}</p>
                          <p className="text-xs mt-0.5 opacity-80">{c.detalle}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Fortalezas */}
                {(aiData.insights?.fortalezas || []).length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Puntos fuertes</p>
                    <div className="flex flex-wrap gap-2">
                      {aiData.insights.fortalezas.map((f, i) => (
                        <span key={i} className="flex items-center gap-1 text-xs bg-brand/10 dark:bg-brand/15 text-brand-dark dark:text-brand px-3 py-1.5 rounded-full font-semibold">
                          <Award className="w-3 h-3" /> {f}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ── Rubros editor — selector de categorías raíz de la tienda ─────────────
  const RubrosEditor = ({ tiendaInfo }) => {
    const rootCats = allCategories.filter(c => c.parentId === null);
    const selected = rubrosSelected;
    const setSelected = setRubrosSelected;
    const saving = rubrosSaving;
    const setSaving = setRubrosSaving;
    const saved = rubrosSaved;
    const setSaved = setRubrosSaved;

    const toggle = (id) => {
      setSelected(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
      setSaved(false);
    };

    const handleSave = async () => {
      setSaving(true);
      try {
        await apiFetch(`${API_BASE}/tiendas-crud`, {
          method: 'PATCH',
          authRequired: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: tiendaData.id, rubros: selected }),
        });
        onTiendaUpdate({ ...tiendaData, rubros: selected });
        setSaved(true);
      } finally {
        setSaving(false);
      }
    };

    const tooMany = selected.length >= 3;

    return (
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/10">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">Rubros de la tienda</p>
        <div className="flex flex-wrap gap-1.5 mb-3">
          {rootCats.map(cat => {
            const isSelected = selected.includes(cat.id);
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => toggle(cat.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                  isSelected
                    ? 'bg-brand text-white'
                    : 'bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/12'
                }`}
              >
                <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                {cat.name.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {selected.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Sin rubros — los clientes no podrán encontrar tu tienda fácilmente.</span>
          </div>
        )}

        {tooMany && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl text-xs text-amber-700 dark:text-amber-400 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <strong>Demasiados rubros.</strong> Recibirás más demandas pero menos relevantes para tu tienda.
              Si vendés de todo, considerá elegir solo <strong>"Multirubro"</strong>.
            </div>
          </div>
        )}

        {JSON.stringify(selected.sort()) !== JSON.stringify((tiendaInfo.rubros || []).slice().sort()) && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-2.5 bg-brand hover:bg-brand-light disabled:opacity-50 text-white rounded-2xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
            {saving ? 'Guardando...' : 'Guardar rubros'}
          </button>
        )}
      </div>
    );
  };

  // ── Edit Info Modal ───────────────────────────────────────────────────────
  const MediaEditorModal = () => {
    if (!mediaModal) return null;
    const isSingle = mediaModal === 'foto' || mediaModal === 'portada';
    const title = mediaModal === 'foto' ? 'Foto de perfil' : mediaModal === 'portada' ? 'Portada' : 'Galería';
    const subtitle = mediaModal === 'foto'
      ? 'Elegí la imagen principal de tu tienda.'
      : mediaModal === 'portada'
        ? 'Esta imagen aparece arriba de tu perfil público.'
        : 'Organizá las imágenes que muestran mejor tu local o productos.';
    const emptyLabel = mediaModal === 'foto' ? 'Sin foto de perfil' : mediaModal === 'portada' ? 'Sin portada' : 'Sin imágenes';
    const maxItems = isSingle ? 1 : 6;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={closeMediaEditor}>
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <div>
              <h2 className="font-bold text-base">{title}</h2>
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>
            <button onClick={closeMediaEditor} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{mediaDraft.length} / {maxItems} imágenes</p>
                <p className="text-xs text-slate-400">Podés subir nuevas o conservar las ya usadas.</p>
              </div>
              <button onClick={() => mediaInputRef.current?.click()} disabled={mediaDraft.length >= maxItems} className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-dark disabled:opacity-50 text-white text-sm font-semibold transition-colors">
                {isSingle && mediaDraft.length > 0 ? 'Cambiar' : 'Agregar'}
              </button>
              <input ref={mediaInputRef} type="file" accept="image/*" multiple={!isSingle} className="hidden" onChange={handleMediaFiles} />
            </div>
            {mediaDraft.length === 0 ? (
              <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 p-10 text-center text-slate-400">
                <Camera className="w-10 h-10 mx-auto mb-3" />
                <p className="font-semibold">{emptyLabel}</p>
              </div>
            ) : (
              <div className={`grid gap-3 ${isSingle ? 'grid-cols-1' : 'grid-cols-2 lg:grid-cols-3'}`}>
                {mediaDraft.map((item, index) => (
                  <div key={`${item.url}-${index}`} className="relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 group">
                    <img src={item.url} alt="" className={`w-full object-cover ${isSingle ? 'aspect-[16/9]' : 'aspect-square'}`} />
                    <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white text-xs font-semibold">
                      {item.existing ? 'Ya usada' : 'Nueva'}
                    </div>
                    <button onClick={() => removeMediaDraftItem(index)} className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {mediaError && <p className="text-sm text-rose-500 font-semibold">{mediaError}</p>}
          </div>
          <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0">
            <button onClick={saveMediaChanges} disabled={mediaSaving} className="w-full py-3 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors">
              {mediaSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar imágenes
            </button>
          </div>
        </div>
      </div>
    );
  };

  const LocationEditorModal = () => {
    if (!locationModal) return null;
    const currentCoords = tiendaData?.lat && tiendaData?.lng ? `${Number(tiendaData.lat).toFixed(5)}, ${Number(tiendaData.lng).toFixed(5)}` : 'Sin ubicación exacta';
    const nextCoords = locationForm.lat && locationForm.lng ? `${Number(locationForm.lat).toFixed(5)}, ${Number(locationForm.lng).toFixed(5)}` : 'Elegí un punto en el mapa';

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setLocationModal(false)}>
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <div>
              <h2 className="font-bold text-base">Ubicación de la tienda</h2>
              <p className="text-xs text-slate-400 mt-0.5">Mostrá la ubicación actual y confirmá una nueva dirección con mapa.</p>
            </div>
            <button onClick={() => setLocationModal(false)} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Ciudad</label>
                <PlaceAutocomplete value={locationForm.ciudad} onChange={(value) => setLocationForm(prev => ({ ...prev, ciudad: value }))} onSelect={({ label }) => setLocationForm(prev => ({ ...prev, ciudad: label }))} placeholder="Buscá tu ciudad" labelParts={2} />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 mb-1 block">Dirección</label>
                <PlaceAutocomplete value={locationForm.direccion} onChange={(value) => setLocationForm(prev => ({ ...prev, direccion: value }))} onSelect={({ lat, lng, label }) => { setLocationForm(prev => ({ ...prev, direccion: label, lat, lng })); setLocationFlyTo({ lat, lng }); }} placeholder="Escribí la dirección o referencia" searchSuffix={locationForm.ciudad} labelParts={3} />
              </div>
            </div>
            <div className="grid lg:grid-cols-2 gap-3">
              <div className="rounded-2xl border border-slate-200 dark:border-white/10 px-4 py-3 bg-slate-50 dark:bg-white/5">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Ubicación actual</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{currentCoords}</p>
                <p className="text-xs text-slate-500 mt-1">{[tiendaInfo.direccion, tiendaInfo.ciudad].filter(Boolean).join(', ') || 'Todavía no configurada'}</p>
              </div>
              <div className="rounded-2xl border border-brand/20 px-4 py-3 bg-brand/5 dark:bg-brand/10">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400 font-semibold">Nueva ubicación</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{nextCoords}</p>
                <p className="text-xs text-slate-500 mt-1">{[locationForm.direccion, locationForm.ciudad].filter(Boolean).join(', ') || 'Seleccioná una dirección o tocá el mapa'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-2">Mapa</p>
              <MapPicker lat={locationForm.lat} lng={locationForm.lng} flyTo={locationFlyTo} onChange={({ lat, lng }) => setLocationForm(prev => ({ ...prev, lat, lng }))} isDark={isDark} />
              <p className="text-xs text-slate-400 mt-2">Tocá el mapa para dejar un pin nuevo o buscá la dirección arriba.</p>
            </div>
            {locationError && <p className="text-sm text-rose-500 font-semibold">{locationError}</p>}
          </div>
          <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0">
            <button onClick={saveLocationChanges} disabled={locationSaving} className="w-full py-3 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors">
              {locationSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <MapPin className="w-4 h-4" />}
              Confirmar ubicación
            </button>
          </div>
        </div>
      </div>
    );
  };

  const HorarioEditorModal = () => {
    if (!horarioModal) return null;

    const diasSemana = [
      { key: 'lunes', label: 'Lunes' },
      { key: 'martes', label: 'Martes' },
      { key: 'miercoles', label: 'Miércoles' },
      { key: 'jueves', label: 'Jueves' },
      { key: 'viernes', label: 'Viernes' },
      { key: 'sabado', label: 'Sábado' },
      { key: 'domingo', label: 'Domingo' },
    ];

    const toggleDia = (dia) => {
      setHorarioForm(prev => ({
        ...prev,
        [dia]: { ...prev[dia], abierto: !prev[dia]?.abierto },
      }));
    };

    const setHora = (dia, campo, valor) => {
      setHorarioForm(prev => ({
        ...prev,
        [dia]: { ...prev[dia], [campo]: valor },
      }));
    };

    const guardarHorarios = async () => {
      setSavingHorario(true);
      try {
        await persistTiendaPatch({ horarios: horarioForm });
        setHorarioModal(false);
      } catch (e) {
        alert('Error: ' + e.message);
      } finally {
        setSavingHorario(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setHorarioModal(false)}>
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <div>
              <h2 className="font-bold text-base">Horarios de atención</h2>
              <p className="text-xs text-slate-400 mt-0.5">Marcá los días que abrís y los horarios.</p>
            </div>
            <button onClick={() => setHorarioModal(false)} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-3">
            {diasSemana.map(({ key, label }) => (
              <div key={key} className={`rounded-2xl border p-4 transition-colors ${horarioForm[key]?.abierto ? 'border-brand/30 bg-brand/5' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleDia(key)}
                      className={`w-12 h-7 rounded-full transition-colors relative ${horarioForm[key]?.abierto ? 'bg-brand' : 'bg-slate-300 dark:bg-slate-600'}`}
                    >
                      <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-transform ${horarioForm[key]?.abierto ? 'left-6' : 'left-1'}`} />
                    </button>
                    <span className="font-bold text-sm">{label}</span>
                  </div>
                  {horarioForm[key]?.abierto && (
                    <span className="text-xs font-bold text-brand">Abierto</span>
                  )}
                </div>

                {horarioForm[key]?.abierto && (
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Desde</label>
                      <input
                        type="time"
                        value={horarioForm[key]?.desde || '09:00'}
                        onChange={e => setHora(key, 'desde', e.target.value)}
                        className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Hasta</label>
                      <input
                        type="time"
                        value={horarioForm[key]?.hasta || '18:00'}
                        onChange={e => setHora(key, 'hasta', e.target.value)}
                        className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0">
            <button
              onClick={guardarHorarios}
              disabled={savingHorario}
              className="w-full py-3 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              {savingHorario ? <Loader2 className="w-4 h-4 animate-spin" /> : <Clock className="w-4 h-4" />}
              Guardar horarios
            </button>
          </div>
        </div>
      </div>
    );
  };

  const EditInfoModal = () => {
    const rootCats = allCategories.filter(c => c.parentId === null);
    const selectedRubros = editModalRubros;
    const setSelectedRubros = setEditModalRubros;
    const activeTab = editInfoTab;
    const setActiveTab = setEditInfoTab;
    const isGeneralScope = editInfoScope === 'general';
    const isPhoneScope = editInfoScope === 'telefono';
    const isDescriptionScope = editInfoScope === 'descripcion';
    const modalTitle = isPhoneScope ? 'Editar contacto' : isDescriptionScope ? 'Editar descripción' : 'Editar perfil';

    const toggleRubro = (id) => setSelectedRubros(prev =>
      prev.includes(id) ? prev.filter(r => r !== id) : prev.length < 5 ? [...prev, id] : prev
    );

    const saveRubros = async () => {
      setSavingInfo(true);
      setSaveInfoErr(null);
      try {
        const res = await apiFetch(`${API_BASE}/tiendas-crud`, {
          method: 'PATCH', authRequired: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: tiendaData.id, rubros: selectedRubros }),
        });
        if (!res.ok) { const e = await res.json(); throw new Error(e.error || 'Error'); }
        const updated = await res.json();
        setTienda(updated);
        onTiendaUpdate(updated);
        setEditInfoModal(false);
      } catch (e) { setSaveInfoErr(e.message); }
      finally { setSavingInfo(false); }
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end lg:items-center justify-center" onClick={() => setEditInfoModal(false)}>
        <div className="bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <h2 className="font-bold text-base">{modalTitle}</h2>
            <button onClick={() => setEditInfoModal(false)} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tabs */}
          {isGeneralScope && (
            <div className="flex border-b border-slate-100 dark:border-white/10 shrink-0">
              {[{ id: 'info', label: 'Info básica' }, { id: 'rubros', label: 'Rubros' }].map(t => (
                <button key={t.id} onClick={() => setActiveTab(t.id)}
                  className={`flex-1 py-3 text-sm font-semibold border-b-2 transition-colors ${activeTab === t.id ? 'border-brand text-brand' : 'border-transparent text-slate-500'}`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeTab === 'info' ? (
              <>
                {isGeneralScope && (
                  <div className="space-y-3">
                    <p className="text-xs text-slate-400">Desde acá podés ajustar la info general y abrir ediciones específicas para imágenes y ubicación.</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {[
                        { key: 'foto', label: 'Foto de perfil', meta: tiendaInfo.foto ? 'Configurada' : 'Agregar', action: () => { setEditInfoModal(false); openMediaEditor('foto'); } },
                        { key: 'portada', label: 'Portada', meta: tiendaData?.galeria?.[0] ? 'Configurada' : 'Agregar', action: () => { setEditInfoModal(false); openMediaEditor('portada'); } },
                        { key: 'galeria', label: 'Galería', meta: `${(tiendaData?.galeria || []).length} imagen${(tiendaData?.galeria || []).length === 1 ? '' : 'es'}`, action: () => { setEditInfoModal(false); openMediaEditor('galeria'); } },
                      ].map(item => (
                        <button
                          key={item.key}
                          onClick={item.action}
                          className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-3 text-left hover:border-brand/40 hover:bg-brand/5 transition-colors"
                        >
                          <p className="text-xs text-slate-400 font-medium">{item.label}</p>
                          <p className="text-sm font-bold mt-1">{item.meta}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {!isPhoneScope && !isDescriptionScope && (
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Nombre de la tienda *</label>
                    <input value={editInfoForm.nombre} onChange={e => setEditInfoForm(f => ({ ...f, nombre: e.target.value }))}
                      placeholder="Nombre de tu tienda"
                      className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand" />
                  </div>
                )}
                {!isPhoneScope && (
                  <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Descripción</label>
                  <textarea value={editInfoForm.descripcion} onChange={e => setEditInfoForm(f => ({ ...f, descripcion: e.target.value }))}
                    placeholder="Contá de qué se trata tu tienda, qué productos o servicios ofrecés..."
                    rows={3} maxLength={1500}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand resize-none" />
                </div>
                )}
                <div>
                  <label className="text-xs font-semibold text-slate-500 mb-1 block">Teléfono / WhatsApp</label>
                  <input value={editInfoForm.telefono} onChange={e => setEditInfoForm(f => ({ ...f, telefono: e.target.value }))}
                    placeholder="+5493XX XXXXXXX"
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand" />
                </div>
                {!isPhoneScope && !isDescriptionScope && (
                  <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-400 font-medium">Ubicación</p>
                        <p className="text-sm font-bold mt-1">{[tiendaInfo.direccion, tiendaInfo.ciudad].filter(Boolean).join(', ') || 'Sin configurar'}</p>
                        <p className="text-xs text-slate-400 mt-1">Usá el mapa para confirmar la dirección exacta y mover el pin.</p>
                      </div>
                      <button
                        onClick={() => {
                          setEditInfoModal(false);
                          openLocationEditor();
                        }}
                        className="shrink-0 px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 text-sm font-semibold hover:border-brand/40 transition-colors"
                      >
                        Editar mapa
                      </button>
                    </div>
                  </div>
                )}
                {saveInfoErr && <p className="text-xs text-rose-500 font-semibold">{saveInfoErr}</p>}
              </>
            ) : (
              <>
                <p className="text-xs text-slate-400">Seleccioná hasta 5 rubros que describan tu tienda.</p>
                <div className="grid grid-cols-2 gap-2">
                  {rootCats.map(cat => {
                    const sel = selectedRubros.includes(cat.id);
                    return (
                      <button key={cat.id} onClick={() => toggleRubro(cat.id)}
                        className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-left transition-all ${sel ? 'border-brand bg-brand/8 dark:bg-brand/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'}`}>
                        <CategoryIcon name={cat.icon} className={`w-4 h-4 shrink-0 ${sel ? 'text-brand' : 'text-slate-400'}`} />
                        <span className={`text-sm font-semibold ${sel ? 'text-brand-dark dark:text-brand' : 'text-slate-700 dark:text-slate-200'}`}>{cat.name}</span>
                        {sel && <CheckCircle className="w-3.5 h-3.5 text-brand ml-auto shrink-0" />}
                      </button>
                    );
                  })}
                </div>
                {saveInfoErr && <p className="text-xs text-rose-500 font-semibold">{saveInfoErr}</p>}
              </>
            )}
          </div>

          <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0">
            <button
              onClick={activeTab === 'info' ? saveInfoBasica : saveRubros}
              disabled={savingInfo || (activeTab === 'info' && !isPhoneScope && !isDescriptionScope && !editInfoForm.nombre.trim())}
              className="w-full py-3 bg-brand hover:bg-brand-dark disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              {savingInfo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Formulario producto (overlay independiente) ────────────────────────────
  const ProductoFormOverlay = () => {
    if (!productoShowForm) return null;

    const uploadFoto = async (file) => {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
      const up = await apiFetch(`${API_BASE}/upload`, { method: 'POST', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, fileData: base64, contentType: file.type }) });
      return up.ok ? (await up.json()).url : null;
    };

    const handleSave = async () => {
      if (!productoForm.titulo.trim()) return;
      setProductoSaving(true); setProductoSaveErr(null);
      try {
        const fotosNuevas = (await Promise.all(productoFotoFiles.map(uploadFoto))).filter(Boolean);
        const fotosExistentes = productoEditing ? productoFotoPreviews.filter(p => !p.startsWith('blob:')) : [];
        const fotos = [...fotosExistentes, ...fotosNuevas];
        const payload = {
          tiendaId: tiendaData.id, tiendaNombre: tiendaInfo.nombre, tiendaFoto: tiendaInfo.foto || null,
          tiendaCiudad: tiendaInfo.ciudad || '', tiendaTelefono: tiendaInfo.telefono || '',
          titulo: productoForm.titulo.trim(), descripcion: productoForm.descripcion.trim(), fotos,
          precio: productoForm.precio ? Number(productoForm.precio) : null,
          precioOriginal: productoForm.precioOriginal ? Number(productoForm.precioOriginal) : null,
          ventaja: productoForm.ventaja, financiacion: productoForm.financiacion.trim() || null,
          stock: productoForm.stock ? Number(productoForm.stock) : null,
          condicion: productoForm.condicion || 'nuevo',
          categoryId: productoForm.categoryId || null,
          contactoWhatsapp: productoForm.contactoWhatsapp?.trim() || null,
          attributes: Object.keys(productoAttributes).length > 0 ? productoAttributes : null,
        };
        let savedProduct;
        if (productoEditing) {
          const res = await apiFetch(`${API_BASE}/ofertas`, { method: 'PATCH', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: productoEditing.id, ...payload }) });
          if (!res.ok) throw new Error('Error al actualizar');
          savedProduct = await res.json();
          setMisProductos(prev => prev.map(o => o.id === savedProduct.id ? savedProduct : o));
        } else {
          const res = await apiFetch(`${API_BASE}/ofertas`, { method: 'POST', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error('Error al crear');
          savedProduct = await res.json();
          setMisProductos(prev => [savedProduct, ...prev]);
        }
        setProductoSuccess(savedProduct);
      } catch (err) { setProductoSaveErr(err.message); }
      finally { setProductoSaving(false); }
    };

    const handleEditSaved = () => {
      const p = productoSuccess;
      setProductoSuccess(null);
      setProductoEditing(p);
      setProductoForm({ titulo: p.titulo, descripcion: p.descripcion || '', precio: p.precio || '', precioOriginal: p.precioOriginal || '', ventaja: Array.isArray(p.ventaja) ? p.ventaja : p.ventaja ? [p.ventaja] : [], financiacion: p.financiacion || '', stock: p.stock ?? '1', condicion: p.condicion || 'nuevo', categoryId: p.categoryId || null, contactoWhatsapp: p.contactoWhatsapp || '' });
      setProductoFotoFiles([]); setProductoFotoPreviews(p.fotos || []);
      setProductoSaveErr(null); setProductoAttributes(p.attributes || {});
    };

    return (
      <>
        <div className="fixed inset-0 z-[5000] bg-[#f7f8fa] dark:bg-[#0a0d16] overflow-y-auto pb-24">
          <StorePageHeader
            title={productoEditing ? 'Editar producto' : 'Nuevo producto'}
            onBack={() => setProductoShowForm(false)}
          />
          <ProductoFormComp
            form={productoForm}
            setForm={setProductoForm}
            fotoPreviews={productoFotoPreviews}
            setFotoPreviews={setProductoFotoPreviews}
            fotoFiles={productoFotoFiles}
            setFotoFiles={setProductoFotoFiles}
            attributes={productoAttributes}
            setAttributes={setProductoAttributes}
            onSave={handleSave}
            saving={productoSaving}
            error={productoSaveErr}
            isEditing={!!productoEditing}
            categories={allCategories}
            onCreateCategory={createCategory}
            tiendaWhatsapp={tiendaInfo.whatsapp || tiendaInfo.telefono || null}
          />
        </div>
        {productoSuccess && (
          <ProductoSuccessModal
            product={productoSuccess}
            onEdit={handleEditSaved}
            onMisProductos={() => { setProductoSuccess(null); setProductoShowForm(false); setScreen('productos'); }}
            onClose={() => { setProductoSuccess(null); setProductoShowForm(false); }}
            onView={null}
          />
        )}
      </>
    );
  };

  // ── Perfil tienda ──────────────────────────────────────────────────────────
  // ── Productos Screen ─────────────────────────────────────────────────────────
  const ProductosScreen = () => {
    const showForm = productoShowForm;
    const setShowForm = setProductoShowForm;
    const editingProducto = productoEditing;
    const setEditingProducto = setProductoEditing;
    const form = productoForm;
    const setForm = setProductoForm;
    const fotoFiles = productoFotoFiles;
    const setFotoFiles = setProductoFotoFiles;
    const fotoPreviews = productoFotoPreviews;
    const setFotoPreviews = setProductoFotoPreviews;
    const saving = productoSaving;
    const setSaving = setProductoSaving;
    const saveErr = productoSaveErr;
    const setSaveErr = setProductoSaveErr;
    const fotoInputRef = productoFotoInputRef;

    const openNew = () => {
      const activeProducts = misProductos.filter(o => o.activa !== false).length;
      if (activeProducts >= productLimit) {
        alert(`Llegaste al límite de ${productLimit} productos. ${isEmprendimiento ? 'Upgrade a Empresa para más.' : 'Upgrade a Premium para ilimitados.'}`);
        return;
      }
      setEditingProducto(null);
      setForm({ titulo: '', descripcion: '', precio: '', precioOriginal: '', ventaja: [], financiacion: '', stock: '1', condicion: 'nuevo', categoryId: null, contactoWhatsapp: '' });
      setFotoFiles([]); setFotoPreviews([]);
      setSaveErr(null); setProductoAttributes({});
      setShowForm(true);
    };

    const openEdit = (o) => {
      setEditingProducto(o);
      setForm({ titulo: o.titulo, descripcion: o.descripcion || '', precio: o.precio || '', precioOriginal: o.precioOriginal || '', ventaja: Array.isArray(o.ventaja) ? o.ventaja : o.ventaja ? [o.ventaja] : [], financiacion: o.financiacion || '', stock: o.stock ?? '1', condicion: o.condicion || 'nuevo', categoryId: o.categoryId || null, contactoWhatsapp: o.contactoWhatsapp || '' });
      setFotoFiles([]); setFotoPreviews(o.fotos || []);
      setSaveErr(null); setProductoAttributes(o.attributes || {});
      setShowForm(true);
    };

    const handleFotos = (e) => {
      const files = Array.from(e.target.files || []).slice(0, 4 - fotoFiles.length);
      files.forEach(f => {
        setFotoFiles(prev => [...prev, f]);
        setFotoPreviews(prev => [...prev, URL.createObjectURL(f)]);
      });
      e.target.value = '';
    };

    const uploadFoto = async (file) => {
      const base64 = await new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result.split(',')[1]); r.onerror = rej; r.readAsDataURL(file); });
      const up = await apiFetch(`${API_BASE}/upload`, { method: 'POST', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fileName: file.name, fileData: base64, contentType: file.type }) });
      return up.ok ? (await up.json()).url : null;
    };

    const handleSave = async () => {
      if (!form.titulo.trim()) return;
      setSaving(true); setSaveErr(null);
      try {
        const fotosNuevas = (await Promise.all(fotoFiles.map(uploadFoto))).filter(Boolean);
        const fotosExistentes = editingProducto ? (fotoPreviews.filter(p => !p.startsWith('blob:'))) : [];
        const fotos = [...fotosExistentes, ...fotosNuevas];

        const payload = {
          tiendaId: tiendaData.id,
          tiendaNombre: tiendaInfo.nombre,
          tiendaFoto: tiendaInfo.foto || null,
          tiendaCiudad: tiendaInfo.ciudad || '',
          tiendaTelefono: tiendaInfo.telefono || '',
          titulo: form.titulo.trim(),
          descripcion: form.descripcion.trim(),
          fotos,
          precio: form.precio ? Number(form.precio) : null,
          precioOriginal: form.precioOriginal ? Number(form.precioOriginal) : null,
          ventaja: form.ventaja,
          financiacion: form.financiacion.trim() || null,
          stock: form.stock ? Number(form.stock) : null,
        };

        if (editingProducto) {
          const res = await apiFetch(`${API_BASE}/ofertas`, { method: 'PATCH', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: editingProducto.id, ...payload }) });
          if (!res.ok) throw new Error('Error al actualizar');
          const updated = await res.json();
          setMisProductos(prev => prev.map(o => o.id === updated.id ? updated : o));
        } else {
          const res = await apiFetch(`${API_BASE}/ofertas`, { method: 'POST', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
          if (!res.ok) throw new Error('Error al crear');
          const nueva = await res.json();
          setMisProductos(prev => [nueva, ...prev]);
        }
        setShowForm(false);
      } catch (err) { setSaveErr(err.message); }
      finally { setSaving(false); }
    };

    const toggleActiva = async (producto) => {
      haptic('medium');
      const updated = { ...producto, activa: !producto.activa };
      // Optimistic — actualiza UI antes del server
      setMisProductos(prev => prev.map(o => o.id === producto.id ? updated : o));
      try {
        const res = await apiFetch(`${API_BASE}/ofertas`, { method: 'PATCH', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: producto.id, activa: updated.activa }) });
        if (!res.ok) throw new Error();
        haptic('success');
      } catch {
        // Rollback si falla
        setMisProductos(prev => prev.map(o => o.id === producto.id ? producto : o));
        haptic('error');
      }
    };

    const deleteProducto = async (id) => {
      haptic('heavy');
      // Optimistic — saca de la lista inmediatamente
      const original = misProductos.find(o => o.id === id);
      setMisProductos(prev => prev.filter(o => o.id !== id));
      try {
        const res = await apiFetch(`${API_BASE}/ofertas?id=${id}`, { method: 'DELETE', authRequired: true });
        if (!res.ok) throw new Error();
      } catch {
        // Rollback
        if (original) setMisProductos(prev => [...prev, original]);
      }
    };

    if (showForm) return null;

    const activos  = misProductos.filter(o => o.activa !== false);
    const pausados = misProductos.filter(o => o.activa === false);
    const usados   = activos.length;
    const pct      = productLimit === Infinity ? 0 : Math.min(100, Math.round((usados / productLimit) * 100));
    const nearLimit = productLimit !== Infinity && usados >= productLimit * 0.9;

    const activeFilterCount = (prodFilter !== 'todos' ? 1 : 0) + (prodCondicion ? 1 : 0) + (prodSinStock ? 1 : 0) + (prodDescuento ? 1 : 0);

    const clearFilters = () => { setProdFilter('todos'); setProdCondicion(null); setProdSinStock(false); setProdDescuento(false); setProdSearch(''); };

    const filtered = misProductos
      .filter(o => {
        const q = prodSearch.toLowerCase();
        if (q && !o.titulo?.toLowerCase().includes(q) && !o.descripcion?.toLowerCase().includes(q)) return false;
        if (prodFilter === 'activos' && o.activa === false) return false;
        if (prodFilter === 'pausados' && o.activa !== false) return false;
        if (prodCondicion && o.condicion !== prodCondicion) return false;
        if (prodSinStock && Number(o.stock) !== 0) return false;
        if (prodDescuento && !(o.precioOriginal && o.precio && Number(o.precioOriginal) > Number(o.precio))) return false;
        return true;
      })
      .sort((a, b) => {
        if (prodSort === 'precio-asc')  return (a.precio || Infinity) - (b.precio || Infinity);
        if (prodSort === 'precio-desc') return (b.precio || 0) - (a.precio || 0);
        if (prodSort === 'nombre')      return (a.titulo || '').localeCompare(b.titulo || '');
        return 0; // recientes: orden del array original
      });

    const SORT_OPTS = [
      { value: 'recientes', label: 'Más recientes' },
      { value: 'nombre',    label: 'Nombre A-Z' },
      { value: 'precio-asc',  label: 'Menor precio' },
      { value: 'precio-desc', label: 'Mayor precio' },
    ];

    const chipCls = (active) => `w-full text-left flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-colors ${
      active ? 'bg-brand/10 dark:bg-brand/15 text-brand-dark dark:text-brand' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/8'
    }`;

    // Card grilla
    const GridCard = ({ o }) => {
      const vc = o.ventaja ? (Array.isArray(o.ventaja) ? VENTAJA_OPTS.find(x => x.id === o.ventaja[0]) : VENTAJA_OPTS.find(x => x.id === o.ventaja)) : null;
      const img = o.fotos?.[0];
      const sinStock = o.stock != null && Number(o.stock) === 0;
      return (
        <div onClick={() => { setProdDetail(o); setProdDetailPhotoIdx(0); setProdDetailEditField(null); }} className={`bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border transition-all group cursor-pointer ${o.activa !== false ? 'border-slate-100 dark:border-white/8 hover:shadow-md hover:shadow-black/5' : 'border-dashed border-slate-200 dark:border-white/10 opacity-50'}`}>
          {/* Foto */}
          <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/6 dark:to-white/10 relative overflow-hidden">
            {img ? <LazyImg src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-slate-300 dark:text-white/20" /></div>}
            {/* Badge ventaja */}
            {vc && <span className={`absolute top-2 left-2 ${vc.badgeClass} text-[9px] font-bold px-1.5 py-0.5 rounded-xl flex items-center gap-1 shadow`}><vc.Icon className={`w-2.5 h-2.5 ${vc.iconClass}`} />{vc.label}</span>}
            {/* Badge sin stock */}
            {sinStock && <span className="absolute top-2 right-2 bg-danger text-white text-[9px] font-bold px-1.5 py-0.5 rounded-xl shadow">Sin stock</span>}
            {/* Acciones hover — desktop only */}
            <div className="absolute inset-x-0 bottom-0 hidden lg:flex gap-1 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-t from-black/60 to-transparent">
              <button onClick={e => { e.stopPropagation(); toggleActiva(o); }}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold text-white transition-colors ${o.activa !== false ? 'bg-white/20 hover:bg-white/30' : 'bg-brand/80 hover:bg-brand'}`}>
                {o.activa !== false ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                {o.activa !== false ? 'Pausar' : 'Activar'}
              </button>
              <button onClick={e => { e.stopPropagation(); openEdit(o); }} className="flex items-center justify-center w-7 rounded-xl bg-white/20 hover:bg-white/30 text-white transition-colors">
                <Edit3 className="w-3 h-3" />
              </button>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(o.id); }} className="flex items-center justify-center w-7 rounded-xl bg-white/20 hover:bg-rose-500/80 text-white transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
          {/* Info + acciones */}
          <div className="p-2.5">
            <p className="font-bold text-[12px] leading-snug line-clamp-2 mb-1">{o.titulo}</p>
            <div className="flex items-center justify-between gap-1 mb-2">
              {o.precio != null
                ? <span className="text-sm font-black text-slate-900 dark:text-white">${Number(o.precio).toLocaleString('es')}</span>
                : <span className="text-[10px] text-slate-400 italic">Sin precio</span>}
              {o.condicion && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${o.condicion === 'nuevo' ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>{o.condicion === 'nuevo' ? 'Nuevo' : 'Usado'}</span>}
            </div>
            {/* Acciones móvil — siempre visibles */}
            <div className="lg:hidden flex gap-1">
              <button onClick={e => { e.stopPropagation(); toggleActiva(o); }}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${o.activa !== false ? 'bg-slate-100 dark:bg-white/8 text-slate-500' : 'bg-brand/10 text-brand'}`}>
                {o.activa !== false ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                {o.activa !== false ? 'Pausar' : 'Activar'}
              </button>
              <button onClick={e => { e.stopPropagation(); openEdit(o); }} className="flex items-center justify-center w-8 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/8 hover:text-brand transition-colors">
                <Edit3 className="w-3 h-3" />
              </button>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(o.id); }} className="flex items-center justify-center w-8 rounded-xl text-slate-300 hover:bg-danger/10 hover:text-danger transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      );
    };

    // Card lista
    const ListCard = ({ o }) => {
      const vc = o.ventaja ? (Array.isArray(o.ventaja) ? VENTAJA_OPTS.find(x => x.id === o.ventaja[0]) : VENTAJA_OPTS.find(x => x.id === o.ventaja)) : null;
      const img = o.fotos?.[0];
      const sinStock = o.stock != null && Number(o.stock) === 0;
      return (
        <div onClick={() => { setProdDetail(o); setProdDetailPhotoIdx(0); setProdDetailEditField(null); }} className={`bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden flex gap-0 transition-all cursor-pointer ${o.activa !== false ? 'border-slate-100 dark:border-white/8 hover:shadow-md hover:shadow-black/5' : 'border-dashed border-slate-200 dark:border-white/10 opacity-55'}`}>
          {/* Foto */}
          <div className="relative w-24 shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/6 dark:to-white/10 overflow-hidden">
            {img ? <LazyImg src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-7 h-7 text-slate-300 dark:text-white/20" /></div>}
            {vc && <span className={`absolute top-1.5 left-1.5 ${vc.badgeClass} text-[8px] font-bold px-1 py-0.5 rounded-lg flex items-center gap-0.5 shadow`}><vc.Icon className={`w-2 h-2 ${vc.iconClass}`} />{vc.label}</span>}
            {sinStock && <span className="absolute bottom-1.5 left-1.5 bg-danger text-white text-[8px] font-bold px-1 py-0.5 rounded-lg shadow">Sin stock</span>}
          </div>
          {/* Contenido */}
          <div className="flex-1 min-w-0 p-3 flex flex-col justify-between gap-1.5">
            {/* Top: título + dot estado */}
            <div className="flex items-start gap-1.5">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] leading-snug line-clamp-2">{o.titulo}</p>
                {o.descripcion && <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{o.descripcion}</p>}
              </div>
              <span className={`shrink-0 w-2 h-2 rounded-full mt-1 ${o.activa !== false ? 'bg-ok' : 'bg-slate-300 dark:bg-slate-600'}`} />
            </div>
            {/* Bottom: precio + badges + acciones */}
            <div className="flex items-center gap-1.5">
              {o.precio != null
                ? <span className="text-sm font-black text-slate-900 dark:text-white">${Number(o.precio).toLocaleString('es')}</span>
                : <span className="text-[10px] text-slate-400 italic">Sin precio</span>}
              {o.precioOriginal && o.precio && Number(o.precioOriginal) > Number(o.precio) && (
                <span className="text-[10px] text-slate-400 line-through">${Number(o.precioOriginal).toLocaleString('es')}</span>
              )}
              {o.condicion && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${o.condicion === 'nuevo' ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>{o.condicion === 'nuevo' ? 'N' : 'U'}</span>}
              {/* Acciones — empujar a la derecha */}
              <div className="ml-auto flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); toggleActiva(o); }}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${o.activa !== false ? 'bg-slate-100 dark:bg-white/8 text-slate-500 hover:bg-slate-200' : 'bg-brand/10 text-brand hover:bg-brand/20'}`}
                  title={o.activa !== false ? 'Pausar' : 'Activar'}>
                  {o.activa !== false ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                </button>
                <button onClick={e => { e.stopPropagation(); openEdit(o); }}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-400 hover:bg-brand/10 hover:text-brand transition-colors"
                  title="Editar">
                  <Edit3 className="w-3 h-3" />
                </button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(o.id); }}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-slate-300 hover:bg-danger/10 hover:text-danger transition-colors"
                  title="Eliminar">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    };

    // ── Detalle de producto (overlay) ────────────────────────────────────────
    const ProductoDetail = () => {
      if (!prodDetail) return null;
      const o = prodDetail;
      const fotos = o.fotos?.length ? o.fotos : [];
      const vc = o.ventaja ? (Array.isArray(o.ventaja) ? VENTAJA_OPTS.find(x => x.id === o.ventaja[0]) : VENTAJA_OPTS.find(x => x.id === o.ventaja)) : null;

      const saveField = async (field, value) => {
        const parsed = field === 'precio' || field === 'precioOriginal' ? (value ? Number(value) : null) : value.trim() || null;
        setProdDetailSaving(true);
        try {
          const res = await apiFetch(`${API_BASE}/ofertas`, {
            method: 'PATCH', authRequired: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: o.id, [field]: parsed }),
          });
          if (res.ok) {
            const updated = { ...o, [field]: parsed };
            setProdDetail(updated);
            setMisProductos(prev => prev.map(p => p.id === o.id ? updated : p));
          }
        } catch { /* silencioso */ }
        finally { setProdDetailSaving(false); setProdDetailEditField(null); }
      };

      const removePhoto = async (idx) => {
        const nuevasFotos = fotos.filter((_, i) => i !== idx);
        setProdDetailSaving(true);
        try {
          const res = await apiFetch(`${API_BASE}/ofertas`, {
            method: 'PATCH', authRequired: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: o.id, fotos: nuevasFotos }),
          });
          if (res.ok) {
            const updated = { ...o, fotos: nuevasFotos };
            setProdDetail(updated);
            setMisProductos(prev => prev.map(p => p.id === o.id ? updated : p));
            setProdDetailPhotoIdx(Math.min(prodDetailPhotoIdx, nuevasFotos.length - 1));
          }
        } catch { /* silencioso */ }
        finally { setProdDetailSaving(false); setProdDetailPhotoConfirm(null); }
      };

      const InlineField = ({ field, value, display, multiline = false, placeholder = '—' }) => {
        const editing = prodDetailEditField === field;
        if (editing) {
          const El = multiline ? 'textarea' : 'input';
          return (
            <div className="relative">
              <El
                autoFocus
                defaultValue={prodDetailDraft}
                onBlur={e => saveField(field, e.target.value)}
                onKeyDown={e => { if (!multiline && e.key === 'Enter') { e.preventDefault(); saveField(field, e.target.value); } if (e.key === 'Escape') { setProdDetailEditField(null); } }}
                className={`w-full bg-brand/5 dark:bg-brand/10 border border-brand/30 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand resize-none ${multiline ? 'min-h-[80px]' : ''}`}
              />
              {prodDetailSaving && <Loader2 className="absolute right-2 top-2 w-3.5 h-3.5 animate-spin text-brand" />}
            </div>
          );
        }
        return (
          <button
            onClick={() => { setProdDetailEditField(field); setProdDetailDraft(value ?? ''); }}
            className="group/field flex items-start gap-1.5 w-full text-left hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl px-3 py-2 -mx-3 transition-colors"
          >
            <span className="flex-1">{display ?? value ?? <span className="text-slate-400 italic">{placeholder}</span>}</span>
            <Edit3 className="w-3 h-3 text-slate-300 group-hover/field:text-brand shrink-0 mt-0.5 transition-colors" />
          </button>
        );
      };

      return (
        <div className="fixed inset-0 z-[6000] bg-white dark:bg-slate-900 flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="shrink-0 flex items-center gap-2 px-3 h-14 border-b border-slate-100 dark:border-white/8">
            <button onClick={() => setProdDetail(null)} className="ui-icon-btn text-slate-500 hover:bg-slate-100 dark:hover:bg-white/8 transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <p className="font-black flex-1 truncate text-sm">{o.titulo}</p>
            {prodDetailSaving && <Loader2 className="w-4 h-4 animate-spin text-brand shrink-0" />}
            <button onClick={() => { setProdDetail(null); toggleActiva(o); }}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${o.activa !== false ? 'bg-slate-100 dark:bg-white/8 text-slate-500 hover:bg-slate-200' : 'bg-brand/10 text-brand hover:bg-brand/20'}`}>
              {o.activa !== false ? 'Pausar' : 'Activar'}
            </button>
            <div className="w-px h-5 bg-slate-200 dark:bg-white/10 shrink-0" />
            <button onClick={() => { setProdDetail(null); openEdit(o); }} className="ui-icon-btn text-slate-400 hover:bg-brand/10 hover:text-brand transition-colors shrink-0" title="Editar formulario">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => { setProdDetail(null); setConfirmDelete(o.id); }} className="ui-icon-btn text-slate-300 hover:bg-danger/10 hover:text-danger transition-colors shrink-0" title="Eliminar">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Body scrolleable */}
          <div className="flex-1 overflow-y-auto">
            {/* Carrusel de fotos */}
            {fotos.length > 0 ? (
              <div className="relative bg-black select-none">
                <div className="aspect-[4/3] max-h-80 overflow-hidden flex items-center justify-center">
                  <img src={fotos[prodDetailPhotoIdx]} alt="" className="w-full h-full object-contain" />
                </div>
                {/* X eliminar foto */}
                <button
                  onClick={() => setProdDetailPhotoConfirm(prodDetailPhotoIdx)}
                  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-danger/80 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
                {/* Flechas navegación */}
                {fotos.length > 1 && (
                  <>
                    <button onClick={() => setProdDetailPhotoIdx(i => (i - 1 + fotos.length) % fotos.length)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors">
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button onClick={() => setProdDetailPhotoIdx(i => (i + 1) % fotos.length)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 flex items-center justify-center text-white transition-colors">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                    {/* Dots */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {fotos.map((_, i) => (
                        <button key={i} onClick={() => setProdDetailPhotoIdx(i)}
                          className={`w-1.5 h-1.5 rounded-full transition-all ${i === prodDetailPhotoIdx ? 'bg-white w-4' : 'bg-white/50'}`} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="aspect-[4/3] max-h-72 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <Package className="w-16 h-16 text-slate-300 dark:text-slate-600" />
              </div>
            )}

            {/* Info editable */}
            <div className="px-5 py-5 space-y-5 max-w-2xl mx-auto">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {o.activa === false && <span className="text-xs font-bold bg-slate-100 dark:bg-white/10 text-slate-500 px-3 py-1 rounded-xl">Pausado</span>}
                {o.condicion && <span className={`text-xs font-bold px-3 py-1 rounded-xl ${o.condicion === 'nuevo' ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>{o.condicion === 'nuevo' ? 'Nuevo' : 'Usado'}</span>}
                {vc && <span className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 ${vc.badgeClass}`}><vc.Icon className={`w-3 h-3 ${vc.iconClass}`} />{vc.label}</span>}
              </div>

              {/* Título */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Título</p>
                <p className="font-black text-xl leading-snug">
                  <InlineField field="titulo" value={o.titulo} />
                </p>
              </div>

              {/* Precio */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Precio</p>
                  <div className="font-black text-2xl text-brand-dark dark:text-brand">
                    <InlineField field="precio" value={String(o.precio ?? '')} display={o.precio != null ? `$${Number(o.precio).toLocaleString('es')}` : null} placeholder="Sin precio" />
                  </div>
                </div>
                {(o.precioOriginal || prodDetailEditField === 'precioOriginal') && (
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Precio original</p>
                    <div className="text-slate-400 line-through text-lg">
                      <InlineField field="precioOriginal" value={String(o.precioOriginal ?? '')} display={o.precioOriginal ? `$${Number(o.precioOriginal).toLocaleString('es')}` : null} placeholder="—" />
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Descripción</p>
                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  <InlineField field="descripcion" value={o.descripcion ?? ''} multiline placeholder="Sin descripción" />
                </div>
              </div>

              {/* Financiación */}
              {(o.financiacion || prodDetailEditField === 'financiacion') && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Financiación</p>
                  <div className="text-sm text-slate-600 dark:text-slate-300">
                    <InlineField field="financiacion" value={o.financiacion ?? ''} placeholder="—" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal confirmar eliminar foto */}
          {prodDetailPhotoConfirm !== null && (
            <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4" onClick={() => setProdDetailPhotoConfirm(null)}>
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
              <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="font-black text-lg text-center mb-1">¿Eliminar esta foto?</h3>
                <p className="text-sm text-slate-400 text-center mb-6">Esta acción no se puede deshacer.</p>
                <div className="flex gap-3">
                  <button onClick={() => setProdDetailPhotoConfirm(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300">Cancelar</button>
                  <button onClick={() => removePhoto(prodDetailPhotoConfirm)} className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors">
                    {prodDetailSaving ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Eliminar'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    };

    return (
      <>
      {ProductoDetail()}
      <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950">
        {/* Header */}
        <StorePageHeader
          title="Mis productos"
          subtitle={`${misProductos.length} publicación${misProductos.length !== 1 ? 'es' : ''} · ${activos.length} activa${activos.length !== 1 ? 's' : ''}`}
          actionSlot={(
            <>
              {loadingProductos && <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />}
              <button onClick={openNew} className="flex items-center gap-1.5 bg-brand hover:bg-brand-light text-white text-sm font-bold px-3 py-1.5 rounded-xl transition-colors shrink-0 shadow-sm shadow-brand/20">
                <Plus className="w-4 h-4" /><span className="hidden sm:inline">Nuevo</span>
              </button>
            </>
          )}
        />

        {loadingProductos && misProductos.length === 0 ? (
          <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
            <SkeletonProductosGrid cols={2} count={6} />
          </div>
        ) : misProductos.length === 0 && !loadingProductos ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4 pb-24 lg:pb-0">
            <div className="w-16 h-16 rounded-3xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
              <Package className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h3 className="font-black text-xl mb-1">Sin productos aún</h3>
              <p className="text-sm text-slate-400">Publicá tu primer producto para que los clientes te encuentren</p>
            </div>
            <button onClick={openNew} className="px-6 py-3 bg-brand hover:bg-brand-light text-white rounded-2xl font-bold transition-colors shadow-lg shadow-brand/25">
              Crear primer producto
            </button>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">

            {/* ── Sidebar izquierda (desktop) ── */}
            <div className="hidden lg:flex flex-col w-56 xl:w-64 border-r border-slate-100 dark:border-white/8 bg-white dark:bg-slate-900 shrink-0 overflow-y-auto">
              <div className="p-4 space-y-5">

                {/* Capacidad */}
                {productLimit !== Infinity && (
                  <div className={`rounded-2xl px-3 py-2.5 ${nearLimit ? 'bg-warn/8' : 'bg-slate-50 dark:bg-white/5'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${nearLimit ? 'text-warn-dark dark:text-warn' : 'text-slate-400'}`}>Capacidad</p>
                      {nearLimit && <AlertTriangle className="w-3 h-3 text-warn" />}
                    </div>
                    <p className={`text-sm font-black mb-1.5 ${nearLimit ? 'text-warn-dark dark:text-warn' : 'text-slate-700 dark:text-slate-200'}`}>{usados} / {productLimit}</p>
                    <div className="h-1.5 bg-slate-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${nearLimit ? 'bg-warn' : 'bg-brand'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                {/* Estado */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Estado</p>
                  <div className="space-y-0.5">
                    {[['todos', `Todos`, misProductos.length], ['activos', 'Activos', activos.length], ['pausados', 'Pausados', pausados.length]].map(([v, label, count]) => (
                      <button key={v} onClick={() => setProdFilter(v)} className={chipCls(prodFilter === v)}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${v === 'activos' ? 'bg-ok' : v === 'pausados' ? 'bg-slate-300 dark:bg-slate-600' : 'bg-brand'}`} />
                        {label}
                        <span className="ml-auto text-[10px] font-black text-slate-400">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condición */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Condición</p>
                  <div className="space-y-0.5">
                    {[['nuevo', 'Nuevo'], ['usado', 'Usado']].map(([v, label]) => (
                      <button key={v} onClick={() => setProdCondicion(prodCondicion === v ? null : v)} className={chipCls(prodCondicion === v)}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${v === 'nuevo' ? 'bg-ok' : 'bg-amber-400'}`} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtros rápidos */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">Filtros</p>
                  <div className="space-y-0.5">
                    <button onClick={() => setProdSinStock(v => !v)} className={chipCls(prodSinStock)}>
                      <Package className="w-3 h-3 shrink-0" /> Sin stock
                    </button>
                    <button onClick={() => setProdDescuento(v => !v)} className={chipCls(prodDescuento)}>
                      <Tag className="w-3 h-3 shrink-0" /> Con descuento
                    </button>
                  </div>
                </div>

                {/* Limpiar */}
                {activeFilterCount > 0 && (
                  <button onClick={clearFilters} className="w-full text-xs font-bold text-slate-400 hover:text-brand transition-colors py-1.5">
                    Limpiar filtros ({activeFilterCount})
                  </button>
                )}
              </div>
            </div>

            {/* ── Contenido derecho ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-white/8 shrink-0">
                {/* Búsqueda */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                  <input value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-8 pr-8 py-2 bg-slate-50 dark:bg-white/5 rounded-xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand transition-all border border-transparent focus:border-brand/20" />
                  {prodSearch && <button onClick={() => setProdSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"><X className="w-3 h-3" /></button>}
                </div>

                {/* Sort */}
                <div className="relative group shrink-0">
                  <button className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${prodSort !== 'recientes' ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-white/8 text-slate-500'}`}>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50 min-w-[160px] hidden group-focus-within:block">
                    {SORT_OPTS.map(o => (
                      <button key={o.value} onClick={() => setProdSort(o.value)}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors text-left ${prodSort === o.value ? 'bg-slate-50 dark:bg-white/5 font-bold text-brand' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                        {prodSort === o.value && <CheckCircle className="w-3 h-3 text-brand shrink-0" />}
                        <span className={prodSort === o.value ? '' : 'pl-4'}>{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtros mobile */}
                <button onClick={() => setProdFilterSheet(true)} className={`lg:hidden relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${activeFilterCount > 0 ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-white/8 text-slate-500'}`}>
                  <ListFilter className="w-3.5 h-3.5" />
                  {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-warn text-white text-[8px] font-black rounded-full flex items-center justify-center">{activeFilterCount}</span>}
                </button>

                {/* View toggle */}
                <div className="flex gap-0.5 bg-slate-100 dark:bg-white/8 rounded-xl p-0.5 shrink-0">
                  <button onClick={() => setProdView('grid')} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${prodView === 'grid' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-white' : 'text-slate-400'}`}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setProdView('lista')} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${prodView === 'lista' ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-700 dark:text-white' : 'text-slate-400'}`}>
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Contador */}
                <p className="text-xs text-slate-400 shrink-0 hidden sm:block">{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Lista / Grilla */}
              <div className="flex-1 overflow-y-auto p-4 pb-24 lg:pb-4">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center text-center gap-3 pt-12 pb-8">
                    <Search className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    <p className="text-sm font-semibold text-slate-400">Sin resultados</p>
                    {(prodSearch || activeFilterCount > 0) && (
                      <button onClick={clearFilters} className="text-xs font-bold text-brand hover:text-brand-dark transition-colors">Limpiar filtros</button>
                    )}
                  </div>
                ) : prodView === 'grid' ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {filtered.map(o => <GridCard key={o.id} o={o} />)}
                  </div>
                ) : (
                  <div className="space-y-2 max-w-2xl">
                    {filtered.map(o => <ListCard key={o.id} o={o} />)}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sheet filtros móvil */}
      {prodFilterSheet && (
        <div className="lg:hidden fixed inset-0 z-[5000] flex flex-col justify-end" onClick={() => setProdFilterSheet(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl px-4 pt-3 pb-8 shadow-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)', animation: 'sheet-up .22s ease' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-white/15 mx-auto mb-5" />
            <h3 className="font-black text-base mb-4">Filtros</h3>

            {/* Estado */}
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Estado</p>
            <div className="flex gap-2 mb-4">
              {[
                { value: 'todos',   label: 'Todos' },
                { value: 'activos', label: 'Activos' },
                { value: 'pausados',label: 'Pausados' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setProdFilter(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodFilter === opt.value ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-white/8 text-slate-500'}`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Condición */}
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Condición</p>
            <div className="flex gap-2 mb-4">
              {[
                { value: null,    label: 'Todas' },
                { value: 'nuevo', label: 'Nuevo' },
                { value: 'usado', label: 'Usado' },
              ].map(opt => (
                <button key={String(opt.value)} onClick={() => setProdCondicion(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodCondicion === opt.value ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-white/8 text-slate-500'}`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Ordenar */}
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Ordenar</p>
            <div className="flex flex-col gap-1 mb-5">
              {SORT_OPTS.map(opt => (
                <button key={opt.value} onClick={() => setProdSort(opt.value)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${prodSort === opt.value ? 'bg-brand/10 text-brand' : 'bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300'}`}>
                  {opt.label}
                  {prodSort === opt.value && <CheckCircle className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {/* Quick filters */}
            <div className="flex gap-2 mb-5">
              <button onClick={() => setProdSinStock(v => !v)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodSinStock ? 'bg-danger/10 text-danger' : 'bg-slate-100 dark:bg-white/8 text-slate-500'}`}>
                Sin stock
              </button>
              <button onClick={() => setProdDescuento(v => !v)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodDescuento ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-slate-100 dark:bg-white/8 text-slate-500'}`}>
                Con descuento
              </button>
            </div>

            <div className="flex gap-3">
              {activeFilterCount > 0 && (
                <button onClick={() => { clearFilters(); }} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-500">
                  Limpiar
                </button>
              )}
              <button onClick={() => setProdFilterSheet(false)} className="flex-1 py-3 rounded-2xl bg-brand text-white text-sm font-bold">
                Ver {filtered.length} producto{filtered.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar borrado */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div className="relative bg-white dark:bg-slate-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="font-black text-lg text-center mb-1">¿Eliminar producto?</h3>
            <p className="text-sm text-slate-400 text-center mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">Cancelar</button>
              <button onClick={() => { deleteProducto(confirmDelete); setConfirmDelete(null); }} className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors">Eliminar</button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  };

  const PerfilScreen = () => {
    const galeria = tiendaData?.galeria || [];
    const rubros = tiendaInfo.rubros || [];

    // Profile completion
    const profileItems = [
      { key: 'foto',        done: !!tiendaInfo.foto,                               label: 'Foto de perfil',       action: () => openProfileEdit('foto') },
      { key: 'descripcion', done: (tiendaInfo.descripcion || '').length >= 20,     label: 'Descripción',          action: () => openProfileEdit('descripcion') },
      { key: 'telefono',    done: !!tiendaInfo.telefono,                            label: 'Teléfono',             action: () => openProfileEdit('telefono') },
      { key: 'ciudad',      done: !!tiendaInfo.ciudad,                              label: 'Ciudad',               action: () => openProfileEdit('ciudad') },
      { key: 'direccion',   done: !!tiendaInfo.direccion,                           label: 'Dirección',            action: () => openProfileEdit('direccion') },
      { key: 'rubros',      done: rubros.length > 0,                                label: 'Rubro/s',              action: () => openProfileEdit('rubros') },
      { key: 'galeria',     done: galeria.length >= 2,                              label: 'Galería (2+ fotos)',   action: () => openProfileEdit('galeria') },
      { key: 'horarios',    done: !!(tiendaInfo.horarios && typeof tiendaInfo.horarios === 'object' ? Object.keys(tiendaInfo.horarios).length > 0 : tiendaInfo.horarios), label: 'Horarios', action: () => openProfileEdit('horarios') },
      { key: 'slug',        done: !!tiendaInfo.slug,                                label: 'URL personalizada',    action: () => openProfileEdit('slug') },
      { key: 'tagline',     done: (tiendaInfo.tagline || '').length >= 5,           label: 'Tagline',              action: () => openProfileEdit('tagline') },
      { key: 'instagram',   done: !!tiendaInfo.instagram,                           label: 'Instagram',            action: () => openProfileEdit('instagram') },
    ];
    const profileDone = profileItems.filter(i => i.done).length;
    const profilePct = Math.round((profileDone / profileItems.length) * 100);
    const r = 30; // ring radius
    const circ = 2 * Math.PI * r;
    const dash = circ * (profilePct / 100);

    return (
      <div className="h-[100dvh] flex flex-col bg-slate-50 dark:bg-slate-950">
        <StorePageHeader title={tiendaInfo?.nombre || 'Mi tienda'} subtitle={tiendaInfo?.tagline || 'Editá tu perfil público'} />
        <div className="flex-1 overflow-y-auto pb-24 lg:pb-8">

        {/* ── Hero cover + avatar ─────────────────────────────────────── */}
        <div className="relative">
          {/* Cover: galeria[0] o gradiente */}
          <div className="h-44 lg:h-56 w-full overflow-hidden" style={{ background: '#0B132B' }}>
            {galeria[0] && (
              <img src={galeria[0]} alt="" className="w-full h-full object-cover opacity-60" />
            )}
            {/* Overlay bottom fade */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
          </div>

          {/* Avatar flotante con botón de cambio */}
          <div className="absolute left-5 lg:left-8 -bottom-10 w-24 h-24 group">
            <div className="w-full h-full rounded-3xl border-4 border-slate-950 overflow-hidden bg-slate-800 shadow-2xl">
              {tiendaInfo.foto
                ? <img src={tiendaInfo.foto} alt="" className="w-full h-full object-cover" />
                : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-900 text-white">
                    <Store className="w-10 h-10" />
                  </div>
                )
              }
            </div>
            <button onClick={() => openProfileEdit('foto')}
              className="absolute bottom-0 right-0 w-7 h-7 bg-brand text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 active:opacity-100 transition-opacity">
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Botones top */}
          <div className="absolute right-4 top-4 flex items-center gap-2">
            <button onClick={() => openProfileEdit('portada')}
              className="bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-black/60 transition-colors">
              <Camera className="w-3.5 h-3.5" /> Portada
            </button>
            <button onClick={() => openGeneralProfileEditor()}
              className="bg-black/40 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5 hover:bg-black/60 transition-colors">
              <Edit3 className="w-3.5 h-3.5" /> Editar
            </button>
          </div>
        </div>

        {/* ── Nombre inline editable + rubros ─────────────────────────── */}
        <div className="px-5 lg:px-8 pt-14 pb-1 max-w-3xl mx-auto">
          {editingNombre ? (
            <input
              autoFocus
              value={nombreDraft}
              onChange={e => setNombreDraft(e.target.value)}
              onBlur={async () => {
                setEditingNombre(false);
                const trim = nombreDraft.trim();
                if (!trim || trim === tiendaInfo.nombre) return;
                try {
                  const res = await apiFetch(`${API_BASE}/tiendas-crud`, {
                    method: 'PATCH', authRequired: true,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: tiendaData.id, nombre: trim }),
                  });
                  if (res.ok) { const u = await res.json(); setTienda(u); onTiendaUpdate(u); }
                } catch { /* silencioso */ }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') e.target.blur();
                if (e.key === 'Escape') { setEditingNombre(false); setNombreDraft(tiendaInfo.nombre || ''); }
              }}
              className="text-2xl font-black bg-transparent border-b-2 border-brand outline-none w-full dark:text-white"
              maxLength={120}
            />
          ) : (
            <h1
              className="text-2xl font-black cursor-pointer hover:text-brand transition-colors inline-flex items-center gap-1.5 group"
              onClick={() => { setNombreDraft(tiendaInfo.nombre || ''); setEditingNombre(true); }}
            >
              {tiendaInfo.nombre}
              <Edit3 className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h1>
          )}
          {tiendaInfo.ciudad && (
            <button onClick={() => openProfileEdit('ciudad')}
              className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5 hover:text-brand transition-colors">
              <MapPin className="w-3.5 h-3.5" /> {tiendaInfo.ciudad}
            </button>
          )}
          {rubros.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {rubros.map(r => {
                const cat = allCategories.find(c => c.id === r);
                return (
                  <button key={r} onClick={() => openProfileEdit('rubros')}
                    className="flex items-center gap-1 text-xs bg-brand/15 dark:bg-brand/20 text-brand-dark dark:text-brand px-2.5 py-1 rounded-full font-semibold hover:bg-brand/25 transition-colors">
                    {cat?.icon && <CategoryIcon name={cat.icon} className="w-3 h-3" />}
                    {cat?.name || r}
                    <Edit3 className="w-2.5 h-2.5 opacity-60" />
                  </button>
                );
              })}
              <button onClick={() => openProfileEdit('rubros')}
                className="flex items-center gap-1 text-xs bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full font-semibold hover:bg-brand/15 hover:text-brand transition-colors">
                <Plus className="w-3 h-3" /> Rubro
              </button>
            </div>
          )}
          {!rubros.length && (
            <button onClick={() => openProfileEdit('rubros')}
              className="mt-3 flex items-center gap-1 text-xs bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2.5 py-1 rounded-full font-semibold hover:bg-brand/15 hover:text-brand transition-colors">
              <Plus className="w-3 h-3" /> Agregar rubro
            </button>
          )}
          {tiendaInfo.descripcion ? (
            <button onClick={() => openProfileEdit('descripcion')}
              className="mt-3 text-sm text-slate-600 dark:text-slate-400 leading-relaxed text-left hover:text-brand transition-colors w-full group flex items-start gap-1">
              <span className="flex-1">{tiendaInfo.descripcion}</span>
              <Edit3 className="w-3.5 h-3.5 shrink-0 opacity-0 group-hover:opacity-60 mt-0.5 transition-opacity" />
            </button>
          ) : (
            <button onClick={() => openProfileEdit('descripcion')}
              className="mt-3 text-sm text-brand font-semibold flex items-center gap-1 hover:underline">
              <Plus className="w-3.5 h-3.5" /> Agregar descripción
            </button>
          )}
        </div>

        <div className="max-w-3xl mx-auto px-5 lg:px-8 mt-6 space-y-5">

          {/* ── Completitud del perfil ──────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/8 p-5">
            <div className="flex items-center gap-4">
              {/* Ring SVG */}
              <div className="relative shrink-0 w-[76px] h-[76px]">
                <svg width="76" height="76" viewBox="0 0 76 76">
                  <circle cx="38" cy="38" r={r} fill="none" strokeWidth="7" className="stroke-slate-100 dark:stroke-white/10" />
                  <circle
                    cx="38" cy="38" r={r} fill="none" strokeWidth="7"
                    stroke="rgb(var(--brand))"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${circ - dash}`}
                    strokeDashoffset={circ / 4}
                    style={{ transition: 'stroke-dasharray 0.6s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-base font-black">{profilePct}%</span>
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm">Perfil completo</p>
                <p className="text-xs text-slate-400 mt-0.5">{profileDone} de {profileItems.length} secciones</p>
                {profilePct < 100 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {profileItems.filter(i => !i.done).slice(0, 3).map(i => (
                      <button key={i.key} onClick={i.action}
                        className="text-[10px] bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/20 px-2 py-0.5 rounded-full font-semibold hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors active:scale-95">
                        + {i.label}
                      </button>
                    ))}
                    {profileItems.filter(i => !i.done).length > 3 && (
                      <span className="text-[10px] text-slate-400">y {profileItems.filter(i => !i.done).length - 3} más</span>
                    )}
                  </div>
                )}
                {profilePct === 100 && (
                  <p className="text-xs text-brand font-semibold mt-1 flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> ¡Perfil completo!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── Stats rápidas ───────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Respuestas', value: tiendaData?.totalRespuestas ?? '—', icon: MessageSquare, color: 'text-blue-500' },
              { label: 'Suscripción', value: isActiva ? 'Activa' : 'Vencida', icon: ShieldCheck, color: isActiva ? 'text-brand' : 'text-rose-500' },
              { label: 'Plan', value: tiendaData?.suscripcion?.plan ? tiendaData.suscripcion.plan.charAt(0).toUpperCase() + tiendaData.suscripcion.plan.slice(1) : '—', icon: Zap, color: 'text-amber-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-white/8 text-center">
                <Icon className={`w-5 h-5 mx-auto mb-1.5 ${color}`} />
                <p className="font-black text-base">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* ── Galería de imágenes ─────────────────────────────────────── */}
          {galeria.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/8 p-5">
              <div className="flex items-center justify-between mb-3 gap-3">
                <h3 className="font-bold flex items-center gap-2">
                  <Camera className="w-4 h-4 text-slate-400" /> Galería
                </h3>
                <button onClick={() => openProfileEdit('galeria')}
                  className="text-xs font-semibold text-brand-dark dark:text-brand hover:underline flex items-center gap-1">
                  <Edit3 className="w-3.5 h-3.5" /> Editar
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {galeria.map((url, i) => (
                  <div key={i} className={`overflow-hidden rounded-2xl bg-slate-100 dark:bg-slate-800 ${i === 0 && galeria.length > 2 ? 'col-span-2' : ''}`}>
                    <img src={url} alt="" className="w-full object-cover aspect-video" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Contacto ────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/8 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Contacto e info</h3>
              <button onClick={() => openProfileEdit('telefono')}
                className="text-xs font-semibold text-brand-dark dark:text-brand hover:underline flex items-center gap-1">
                <Edit3 className="w-3.5 h-3.5" /> Editar
              </button>
            </div>
            <div className="space-y-2">
              {tiendaInfo.telefono ? (
                <button onClick={() => openProfileEdit('telefono')}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-brand/8 dark:hover:bg-brand/10 transition-colors group text-left">
                  <div className="w-9 h-9 bg-brand/15 dark:bg-brand/20 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-brand-dark dark:text-brand" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 font-medium">Teléfono / WhatsApp</p>
                    <p className="font-semibold text-sm">{tiendaInfo.telefono}</p>
                  </div>
                  <Edit3 className="w-3.5 h-3.5 text-slate-300 group-hover:text-brand transition-colors" />
                </button>
              ) : (
                <button onClick={() => openProfileEdit('telefono')}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-brand dark:hover:border-brand/40 transition-colors group text-left">
                  <div className="w-9 h-9 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Teléfono / WhatsApp</p>
                    <p className="text-xs text-brand font-semibold">+ Agregar teléfono</p>
                  </div>
                </button>
              )}
              {(tiendaInfo.direccion || tiendaInfo.ciudad) ? (
                <button onClick={() => openProfileEdit('direccion')}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors group text-left">
                  <div className="w-9 h-9 bg-blue-100 dark:bg-blue-500/20 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-400 font-medium">Dirección</p>
                    <p className="font-semibold text-sm">{[tiendaInfo.direccion, tiendaInfo.ciudad].filter(Boolean).join(', ')}</p>
                  </div>
                  <Edit3 className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-400 transition-colors" />
                </button>
              ) : (
                <button onClick={() => openProfileEdit('ciudad')}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-brand dark:hover:border-brand/40 transition-colors group text-left">
                  <div className="w-9 h-9 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Ubicación</p>
                    <p className="text-xs text-brand font-semibold">+ Agregar ciudad / dirección</p>
                  </div>
                </button>
              )}
              {!tiendaInfo.descripcion && (
                <button onClick={() => openProfileEdit('descripcion')}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-brand dark:hover:border-brand/40 transition-colors group text-left">
                  <div className="w-9 h-9 bg-slate-100 dark:bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                    <Edit3 className="w-4 h-4 text-slate-400" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-medium">Descripción</p>
                    <p className="text-xs text-brand font-semibold">+ Contá de qué trata tu tienda</p>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* ── Mi página pública ───────────────────────────────────────── */}
          <div id="perfil-pagina-publica" className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/8 overflow-hidden">
            {/* Cabecera */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
              <h3 className="font-bold flex items-center gap-2">
                <Palette className="w-4 h-4 text-brand" /> Mi página pública
              </h3>
              <button
                onClick={() => {
                  setPaginaForm({ template: tiendaInfo.pagina?.template || 'minimal', color: tiendaInfo.pagina?.color || '#00b8d9', modoOscuro: tiendaInfo.pagina?.modoOscuro || false });
                  setPublicPageForm({ slug: tiendaInfo.slug || '', tagline: tiendaInfo.tagline || '', whatsapp: tiendaInfo.whatsapp || tiendaInfo.telefono || '', instagram: tiendaInfo.instagram || '' });
                  setPublicPageError(null);
                  setScreen('mi-pagina');
                }}
                className="text-xs font-semibold text-brand-dark dark:text-brand hover:underline flex items-center gap-1"
              >
                <Palette className="w-3.5 h-3.5" /> Diseño
              </button>
            </div>

            {/* Estado del link */}
            {tiendaInfo.slug ? (
              <div className="flex items-center gap-2 px-5 pb-3 flex-wrap">
                <a href={`/t/${tiendaInfo.slug}`} target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-brand-dark dark:text-brand font-semibold hover:underline">
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  lokal.ar/t/{tiendaInfo.slug}
                </a>
                <button
                  onClick={() => { const url = `${window.location.origin}/t/${tiendaInfo.slug}`; if (navigator.share) { navigator.share({ title: tiendaInfo.nombre, url }); } else { navigator.clipboard.writeText(url).then(() => alert('¡Link copiado!')); } }}
                  className="flex items-center gap-1 text-xs font-semibold bg-brand/10 dark:bg-brand/15 text-brand-dark dark:text-brand px-2.5 py-1 rounded-xl hover:bg-brand/20 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> Compartir
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-400 px-5 pb-3">Sin URL pública todavía.</p>
            )}

            {/* Chips de diseño actual */}
            <div className="flex flex-wrap gap-2 px-5 pb-4 text-xs text-slate-500">
              <span className="bg-slate-100 dark:bg-white/8 px-2.5 py-1 rounded-lg font-semibold capitalize">{tiendaInfo.pagina?.template || 'minimal'}</span>
              <span className="flex items-center gap-1.5 bg-slate-100 dark:bg-white/8 px-2.5 py-1 rounded-lg">
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: tiendaInfo.pagina?.color || '#00b8d9', display: 'inline-block' }} /> Color
              </span>
              {tiendaInfo.pagina?.modoOscuro && <span className="bg-slate-100 dark:bg-white/8 px-2.5 py-1 rounded-lg">Modo oscuro</span>}
            </div>

            {/* Separador + sección URL/info editable */}
            <div className="border-t border-slate-100 dark:border-white/8 px-5 py-4">
              {!editingPublicPage ? (
                <button
                  onClick={() => { setPublicPageForm({ slug: tiendaInfo.slug || '', tagline: tiendaInfo.tagline || '', whatsapp: tiendaInfo.whatsapp || tiendaInfo.telefono || '', instagram: tiendaInfo.instagram || '' }); setPublicPageError(null); setEditingPublicPage(true); }}
                  className="w-full flex items-center justify-between text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  <span className="flex items-center gap-2"><Link2 className="w-4 h-4" /> URL, tagline y contacto</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">URL, tagline y contacto</p>
                    <button onClick={() => setEditingPublicPage(false)} className="text-xs text-slate-400 hover:text-slate-600">Cancelar</button>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">URL personalizada</label>
                    <div className="flex items-center bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                      <span className="pl-3 text-xs text-slate-400 whitespace-nowrap">lokal.ar/t/</span>
                      <input
                        value={publicPageForm.slug}
                        onChange={e => setPublicPageForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                        onKeyDown={e => e.key === 'Enter' && e.target.form?.querySelector('button[type=submit]')?.click()}
                        placeholder="mi-tienda"
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Tagline</label>
                    <input value={publicPageForm.tagline} onChange={e => setPublicPageForm(f => ({ ...f, tagline: e.target.value }))} placeholder="Tu frase o eslogan" maxLength={160} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">WhatsApp</label>
                    <input value={publicPageForm.whatsapp} onChange={e => setPublicPageForm(f => ({ ...f, whatsapp: e.target.value }))} placeholder="+5491112345678" className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 mb-1 block">Instagram</label>
                    <div className="flex items-center bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden">
                      <span className="pl-3 text-xs text-slate-400">@</span>
                      <input value={publicPageForm.instagram} onChange={e => setPublicPageForm(f => ({ ...f, instagram: e.target.value.replace('@','') }))} placeholder="mitienda" maxLength={60} className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none" />
                    </div>
                  </div>
                  {publicPageError && <p className="text-xs text-rose-500 font-semibold">{publicPageError}</p>}
                  <button onClick={savePublicPage} disabled={savingPublicPage} className="w-full py-3 bg-brand hover:bg-brand-light disabled:opacity-60 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors">
                    {savingPublicPage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Guardar
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Suscripción ─────────────────────────────────────────────── */}
          <div className={`rounded-3xl border p-5 ${isActiva ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/8' : 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/30'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2">
                <ShieldCheck className={`w-4 h-4 ${isActiva ? 'text-brand' : 'text-rose-500'}`} />
                Suscripción
              </h3>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${isActiva ? 'bg-brand/15 dark:bg-brand/15 text-brand-dark dark:text-brand' : 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400'}`}>
                {isActiva ? 'Activa' : 'Vencida'}
              </span>
            </div>

            {tiendaData?.suscripcion ? (
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Plan</span>
                  <span className="font-semibold capitalize">{tiendaData.suscripcion.plan || 'Mensual'}</span>
                </div>
                {tiendaData.suscripcion.vence && (
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">{isActiva ? 'Vence' : 'Venció'}</span>
                    <span className={`font-semibold ${!isActiva ? 'text-rose-500' : dias !== null && dias <= 7 ? 'text-amber-500' : ''}`}>
                      {new Date(tiendaData.suscripcion.vence).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      {isActiva && dias !== null && ` (${dias} días)`}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500 mb-4">Sin datos de suscripción</p>
            )}

            {/* Upgrade a Premium (solo si es plan básico) */}
            {isActiva && isBasico && (
              <button
                onClick={() => setShowPremiumModal(true)}
                className="w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors bg-amber-100 dark:bg-amber-500/15 hover:bg-amber-200 dark:hover:bg-amber-500/25 text-amber-700 dark:text-amber-400 mb-2"
              >
                <Sparkles className="w-4 h-4" />
                Upgrade a Premium
              </button>
            )}

            <button
              onClick={() => setShowPaywall(true)}
              className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
                isActiva
                  ? 'bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200'
                  : 'bg-brand hover:bg-brand-light text-white shadow-lg shadow-brand/25'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              {isActiva ? 'Renovar anticipado' : 'Renovar suscripción'}
            </button>
          </div>

          {/* ── Cuenta Google ────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-white/8 p-5">
            <h3 className="font-bold mb-4">Cuenta Google</h3>
            <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl">
              <div className="w-11 h-11 bg-brand/15 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
                {renderAccountAvatar()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{firebaseUser?.displayName || 'Usuario'}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{firebaseUser?.email || ''}</p>
              </div>
            </div>
            <button onClick={onLogout}
              className="w-full py-3 text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/15 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-rose-200 dark:border-rose-500/20">
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>

        </div>
        </div>{/* fin overflow-y-auto */}
      </div>
    );
  };

  // ── "Más" bottom sheet ─────────────────────────────────────────────────────
  const MoreSheet = () => (
    <div className="lg:hidden fixed inset-0 z-[4400] flex flex-col justify-end" onClick={() => setMoreSheetOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl px-4 pt-3 pb-4 shadow-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)', animation: 'sheet-up .22s ease' }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-white/15 mx-auto mb-4" />
        <div className="flex items-center gap-3 px-1 mb-3">
          <div className="w-11 h-11 bg-primary/10 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
            {firebaseUser?.photoURL ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-primary">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{firebaseUser?.displayName || 'Usuario'}</p>
            <p className="text-xs text-slate-400 truncate">{tiendaInfo.nombre}</p>
          </div>
        </div>
        <div className="space-y-0.5">
          {[
            { label: 'Inicio (marketplace)', icon: Home, action: () => { navigateTo('inicio'); setMoreSheetOpen(false); } },
            ...(isEmpresa ? [{ label: 'Estadísticas', icon: TrendingUp, action: () => { navigateTo('stats'); setMoreSheetOpen(false); } }] : []),
            ...(isEmpresa ? [{ label: 'Suscripción', icon: CreditCard, action: () => { navigateTo('suscripcion'); setMoreSheetOpen(false); } }] : []),
            { label: 'Demandas', icon: Package, action: () => { navigateTo('feed'); setMoreSheetOpen(false); } },
            { label: 'Diseño de página', icon: Palette, action: () => { setPaginaForm({ template: tiendaData?.pagina?.template || 'minimal', color: tiendaData?.pagina?.color || '#00b8d9', modoOscuro: tiendaData?.pagina?.modoOscuro || false }); setPublicPageForm({ slug: tiendaData?.slug || '', tagline: tiendaData?.tagline || '', whatsapp: tiendaData?.whatsapp || tiendaData?.telefono || '', instagram: tiendaData?.instagram || '' }); setPublicPageError(null); setScreen('mi-pagina'); setMoreSheetOpen(false); } },
            isAdmin ? { label: 'Panel Admin', icon: ShieldCheck, action: () => { onOpenAdmin?.(); setMoreSheetOpen(false); } } : null,
          ].filter(Boolean).map(({ label, icon: Icon, action }) => (
            <button key={label} onClick={action} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left">
              <Icon className="w-5 h-5 text-slate-400 shrink-0" />
              <span className="font-semibold text-sm">{label}</span>
            </button>
          ))}
          <div className="border-t border-slate-100 dark:border-white/8 my-2" />
          {isAdmin && (
            <button onClick={() => { toggleMockMode(); setMoreSheetOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors ${mockMode ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600' : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-500'}`}>
              <FlaskConical className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-sm">{mockMode ? 'Mock ON — desactivar' : 'Datos mock'}</span>
            </button>
          )}
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
            {isDark ? <Sun className="w-5 h-5 text-amber-400 shrink-0" /> : <Moon className="w-5 h-5 text-slate-400 shrink-0" />}
            <span className="font-semibold text-sm">{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
          </button>
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-500 transition-colors">
            <LogOut className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm">Cerrar sesión</span>
          </button>
        </div>
      </div>
    </div>
  );

  // ── "Crear" bottom sheet ───────────────────────────────────────────────────
  const CreateSheet = () => {
    if (!createSheetOpen && !createSheetClosing) return null;
    const activeProducts = misProductos.filter(o => o.activa !== false).length;
    const atProductLimit = activeProducts >= productLimit;
    const opts = [
      {
        icon: Tag,
        color: atProductLimit ? 'bg-slate-100 dark:bg-white/8 text-slate-400' : 'bg-primary/10 text-primary',
        title: 'Nuevo producto',
        desc: atProductLimit
          ? `Límite alcanzado: ${productLimit} productos (${isEmprendimiento ? 'upgrade a Empresa' : 'upgrade a Premium'})`
          : 'Publicá un producto en tu vitrina',
        locked: atProductLimit,
        action: () => {
          if (atProductLimit) return;
          closeCreateSheet();
          setProductoEditing(null);
          setProductoForm({ titulo: '', descripcion: '', precio: '', precioOriginal: '', ventaja: [], financiacion: '', stock: '1', condicion: 'nuevo', categoryId: null, contactoWhatsapp: '' });
          setProductoFotoFiles([]);
          setProductoFotoPreviews([]);
          setProductoSaveErr(null);
          setProductoAttributes({});
          setProductoShowForm(true);
        }
      },
      { icon: Package, color: 'bg-slate-100 dark:bg-white/8 text-slate-400', title: 'Búsqueda laboral', desc: 'Próximamente disponible', locked: true, action: () => {} },
    ];
    return (
      <div className="lg:hidden fixed inset-0 z-[4000] flex flex-col justify-end" onClick={closeCreateSheet}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ animation: createSheetClosing ? 'backdrop-out .22s ease forwards' : 'backdrop-in .22s ease' }} />
        <div className="relative bg-white dark:bg-slate-900 rounded-t-3xl px-4 pt-3 shadow-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)', animation: createSheetClosing ? 'sheet-down .22s ease forwards' : 'sheet-up .22s ease' }} onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 rounded-full bg-slate-200 dark:bg-white/15 mx-auto mb-4" />
          <p className="font-bold text-base px-1 mb-3">¿Qué querés crear?</p>
          <div className="space-y-2 pb-2">
            {opts.map(opt => {
              const Icon = opt.icon;
              return (
                <button key={opt.title} onClick={opt.locked ? undefined : opt.action} disabled={opt.locked}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-colors ${opt.locked ? 'border-slate-100 dark:border-white/8 opacity-50 cursor-not-allowed' : 'border-slate-100 dark:border-white/8 hover:border-primary hover:bg-primary/5'}`}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${opt.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{opt.title}</p>
                    <p className="text-xs text-slate-400">{opt.desc}</p>
                  </div>
                  {opt.locked && <span className="ml-auto text-xs bg-slate-100 dark:bg-white/10 text-slate-400 px-2 py-1 rounded-lg font-semibold">Pronto</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      {Sidebar()}
      {/* spacer so content shifts with sidebar on desktop */}
      <div className="hidden lg:block shrink-0" style={{ width: sidebarExpanded ? 224 : 64, transition: 'width 380ms cubic-bezier(0.16,1,0.3,1)' }} />
      <div className="flex-1 min-w-0">
        {/* Banner suscripción — vencida o por vencer */}
        {!isActiva && (
          <div className="bg-rose-500 text-white px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Tu suscripción venció. Podés ver las demandas pero no responderlas.</span>
            </div>
            <button
              onClick={() => setShowPaywall(true)}
              className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Renovar ahora
            </button>
          </div>
        )}
        {isActiva && dias !== null && dias <= 7 && (
          <div className="bg-amber-500 text-white px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <CalendarDays className="w-4 h-4 shrink-0" />
              <span className="font-semibold">
                {dias === 0 ? 'Tu suscripción vence hoy.' : `Tu suscripción vence en ${dias} día${dias === 1 ? '' : 's'}.`}
              </span>
            </div>
            <button
              onClick={() => setShowPaywall(true)}
              className="shrink-0 bg-white/20 hover:bg-white/30 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
            >
              Renovar
            </button>
          </div>
        )}


        <div style={{
          opacity: screenVisible ? 1 : 0,
          transition: screenVisible ? 'opacity 0.18s ease' : 'opacity 0.10s ease',
          willChange: 'opacity',
        }}>
          {screen === 'feed' && <FeedScreen />}
          {screen === 'mensajes' && MensajesScreen()}
          {screen === 'demanda-detail' && selectedDemanda && DemandaDetailScreen()}
          {screen === 'stats' && StatsScreen()}
          {screen === 'productos' && ProductosScreen()}
          {screen === 'suscripcion' && <SuscripcionScreen />}
          {screen === 'mi-pagina' && MiPaginaScreen()}
          {screen === 'perfil' && PerfilScreen()}
          {screen === 'inicio' && InicioScreen()}
        </div>
        {BottomNav()}
        {moreSheetOpen && MoreSheet()}
        {CreateSheet()}
        {ProductoFormOverlay()}
        {showPaywall && PaywallModal()}
        {showPremiumModal && PremiumModal()}
        <TransferenciaModal
          open={showTransferenciaModal}
          onClose={() => setShowTransferenciaModal(false)}
          plan={transferenciaPlan}
          monto={transferenciaPlan === 'anual' ? PRECIO_ANUAL : PRECIO_MENSUAL}
          tiendaId={tiendaData?.id}
        />
        {MediaEditorModal()}
        {LocationEditorModal()}
        {HorarioEditorModal()}
        {editInfoModal && EditInfoModal()}

        {/* ── Chat flotante (estilo Messenger — persiste entre pantallas) ── */}
        {/* ── Multi floating chat ── */}
        {floatingChats.length > 0 && (() => {
          const storeId = String(tienda?.id || tiendaData?.id || '');
          // En mobile: un solo chip agrupado que abre el más reciente no colapsado
          const totalUnread = floatingChats.reduce((acc, fc) => {
            const convo = inboxConvos.find(c => c.key === fc.key);
            return acc + (convo?.messages || []).filter(m => m.from !== storeId).length;
          }, 0);
          const mobileActive = floatingChats.find(c => !c.collapsed) || floatingChats[0];

          return (
            <>
              {/* MOBILE: chip agrupado único */}
              <div className="lg:hidden fixed right-4 bottom-24 z-[5000]">
                {mobileActive && (() => {
                  const convo = inboxConvos.find(c => c.key === mobileActive.key);
                  if (!convo) return null;
                  // En mobile abrimos pantalla completa del chat en mensajes
                  return (
                    <button
                      onClick={() => { navigateTo('mensajes'); setInboxSelectedKey(mobileActive.key); setInboxMobileView('chat'); }}
                      className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl px-2.5 py-2 hover:shadow-2xl transition-shadow"
                    >
                      {/* Avatares apilados */}
                      <div className="flex -space-x-2">
                        {floatingChats.slice(0, 3).map(fc => {
                          const cv = inboxConvos.find(c => c.key === fc.key);
                          return (
                            <div key={fc.key} className={`w-8 h-8 rounded-xl border-2 border-white dark:border-slate-900 ${avatarColor(cv?.partnerUid)} flex items-center justify-center text-white font-bold text-[10px]`}>
                              {(cv?.partnerUid || 'C').slice(-2).toUpperCase()}
                            </div>
                          );
                        })}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate max-w-[90px]">{clientLabel(convo.partnerUid)}</p>
                        {floatingChats.length > 1 && <p className="text-[10px] text-slate-400">+{floatingChats.length - 1} más</p>}
                      </div>
                      {totalUnread > 0 && (
                        <span className="w-5 h-5 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {totalUnread > 9 ? '9+' : totalUnread}
                        </span>
                      )}
                      <div onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setFloatingChats([]); }}
                        className="w-6 h-6 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 shrink-0 transition-colors cursor-pointer">
                        <X className="w-3 h-3" />
                      </div>
                    </button>
                  );
                })()}
              </div>

              {/* DESKTOP: paneles flotantes en fila desde la derecha */}
              <div className="hidden lg:flex fixed right-8 bottom-8 z-[5000] flex-row-reverse items-end gap-3 pointer-events-none">
                {floatingChats.map((fc) => {
                  const convo = inboxConvos.find(c => c.key === fc.key);
                  if (!convo) return null;
                  const msgs = convo.messages || [];
                  const unread = msgs.filter(m => m.from !== storeId).length;
                  // Compacto si hay 3+ chats abiertos
                  const compact = floatingChats.filter(c => !c.collapsed).length >= 3;

                  const sendFloating = async () => {
                    const text = fc.msg.trim();
                    if (!text || !storeId) return;
                    setFloatingSending(fc.key, true);
                    const optimistic = { id: `opt-${Date.now()}`, from: storeId, text, ts: new Date().toISOString() };
                    setInboxConvos(prev => prev.map(c => c.key === fc.key ? { ...c, messages: [...c.messages, optimistic], lastMessage: optimistic } : c));
                    setFloatingMsg(fc.key, '');
                    try {
                      await apiFetch(`${API_BASE}/messages`, { method: 'POST', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storeId, partnerUid: convo.partnerUid, text }) });
                    } catch { } finally { setFloatingSending(fc.key, false); }
                  };

                  /* Colapsado */
                  if (fc.collapsed) return (
                    <div key={fc.key} className="pointer-events-auto flex items-center gap-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl px-2.5 py-2 cursor-pointer hover:shadow-2xl transition-shadow select-none"
                      onClick={() => toggleFloatingCollapse(fc.key)}>
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-xl ${avatarColor(convo.partnerUid)} flex items-center justify-center text-white font-bold text-xs`}>
                          {(convo.partnerUid || 'C').slice(-2).toUpperCase()}
                        </div>
                        {unread > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-rose-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">{unread > 9 ? '9+' : unread}</span>}
                      </div>
                      {!compact && <span className="font-bold text-sm text-slate-800 dark:text-slate-200 max-w-[100px] truncate">{clientLabel(convo.partnerUid)}</span>}
                      <ChevronDown className="w-4 h-4 text-slate-400 rotate-180 shrink-0" />
                      <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); closeFloatingChat(fc.key); }}
                        className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 text-slate-400 shrink-0 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );

                  /* Expandido */
                  return (
                    <div key={fc.key} className="pointer-events-auto w-80 h-[520px] bg-white dark:bg-slate-900 flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-white/8 shrink-0">
                        <button onClick={() => toggleFloatingCollapse(fc.key)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors" title="Minimizar">
                          <ChevronDown className="w-4 h-4 text-slate-400" />
                        </button>
                        <div className={`w-8 h-8 rounded-xl ${avatarColor(convo.partnerUid)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                          {(convo.partnerUid || 'C').slice(-2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{clientLabel(convo.partnerUid)}</p>
                          <p className="text-[10px] text-slate-400">{msgs.length} mensaje{msgs.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button onClick={() => { navigateTo('mensajes'); setInboxSelectedKey(fc.key); setInboxMobileView('chat'); closeFloatingChat(fc.key); }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors" title="Abrir en mensajes">
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                        <button onClick={() => closeFloatingChat(fc.key)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-slate-100 dark:hover:bg-white/10 transition-colors" title="Cerrar">
                          <X className="w-3.5 h-3.5 text-slate-400" />
                        </button>
                      </div>

                      {/* Mensajes */}
                      <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50 dark:bg-slate-950">
                        {msgs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                            <MessageSquare className="w-8 h-8 text-slate-200 dark:text-slate-700" />
                            <p className="text-xs text-slate-400">Iniciá la conversación</p>
                          </div>
                        ) : msgs.map(msg => {
                          const isStore = msg.from === storeId;
                          return (
                            <div key={msg.id || msg.ts} className={`flex flex-col ${isStore ? 'items-end' : 'items-start'} gap-0.5`}>
                              {msg.text && (
                                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${isStore ? 'bg-brand text-white' : 'bg-white dark:bg-slate-800 shadow-sm text-slate-800 dark:text-slate-200'}`}>
                                  <p className="text-sm">{msg.text}</p>
                                  <p className={`text-[10px] mt-0.5 ${isStore ? 'text-white/60' : 'text-slate-400'}`}>{fmtTime(msg.ts)}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Input */}
                      <div className="shrink-0 border-t border-slate-100 dark:border-white/8 bg-white dark:bg-slate-900 px-3 py-2.5">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1 bg-slate-100 dark:bg-white/8 rounded-2xl px-3 py-2 flex items-center">
                            <textarea value={fc.msg} onChange={e => setFloatingMsg(fc.key, e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFloating(); } }}
                              placeholder="Responder..." rows={1}
                              className="bg-transparent text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none w-full resize-none" />
                          </div>
                          <button onClick={sendFloating} disabled={!fc.msg.trim() || fc.sending}
                            className="w-9 h-9 bg-brand hover:bg-brand-dark rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors shrink-0">
                            {fc.sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

      </div>
    </div>
  );
}
