import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { cacheGet, cacheSet } from './lokCache';
import { PaywallModal as PaywallModalUI, PremiumModal as PremiumModalUI, SuscripcionContent } from './store/PricingUI';
import { haptic } from './haptic';
import LazyImg from './LazyImg';
import { SkeletonProductosGrid, SkeletonInbox } from './Skeletons';
import { MOCK_PRODUCTOS, MOCK_INBOX, MOCK_HISTORIAL_PAGOS, MOCK_STATS } from './mockStoreData';
import { TiendaPublicaRenderer, TEMPLATES_META } from './tienda-publica/TiendaPublicaRenderer.jsx';
import ImageCropModal from './ImageCropModal.jsx';
import { SECCIONES_DEFAULT } from './tienda-publica/tokens.js';
import { isModuleActive, deriveColorPalette, getEstadoApertura } from './tienda-publica/utils.js';
import { useGeolocation } from './hooks';
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
  LayoutGrid, LayoutList, ArrowUpDown, SlidersHorizontal, ListFilter, Navigation, EyeOff
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
import DatePicker from './components/DatePicker';
import HomeScreen from './screens/HomeScreen';
import ProductDetailScreen from './screens/ProductDetailScreen';
import TiendaDetailScreen from './screens/TiendaDetailScreen';
import { CATEGORIES as BASE_CATEGORIES, getCategoryPath, getAllDescendants } from './categories';
import CategoryIcon from './CategoryIcon';
import { apiFetch } from './api';
import { PlaceAutocomplete, MapPicker, uploadFile, uploadOfertaImages, reverseGeocode } from './storeFormUtils';

const API_BASE = '/.netlify/functions';

const StorePhotoCarousel = ({ photos = [] }) => {
  const [idx, setIdx] = React.useState(0);
  if (!photos.length) return null;
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  return (
    <div className="relative bg-surface-card-2 dark:bg-black/30 select-none">
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
  const galleryLimit = isEmprendimiento ? 3 : (isBasico ? 6 : 10);

  const STORE_SCREENS = ['perfil', 'mensajes', 'productos', 'inicio', 'stats', 'suscripcion'];
  // Key por tienda (no global al navegador): sin el id, la última pantalla
  // visitada por UNA cuenta se filtraba a la sesión de cualquier otra
  // cuenta que abriera el panel en el mismo navegador (ej. probando varias
  // cuentas de Google en dev) — cada tienda recuerda la suya, aisladas.
  const storeScreenKey = tiendaData?.id ? `lokal-store-screen-${tiendaData.id}` : null;
  const savedScreen = storeScreenKey ? localStorage.getItem(storeScreenKey) : null;
  const [screen, setScreen] = useState(STORE_SCREENS.includes(savedScreen) ? savedScreen : 'perfil');

  // Mock test mode (solo admins)
  const [mockMode, setMockMode] = useState(false);

  // Transición suave entre screens
  const [screenVisible, setScreenVisible] = useState(true);

  // Sidebar collapse
  const [sidebarExpanded, setSidebarExpanded] = React.useState(() => localStorage.getItem('lokal-store-sidebar-pinned') !== 'false');
  const [sidebarPinned, setSidebarPinned] = React.useState(() => localStorage.getItem('lokal-store-sidebar-pinned') !== 'false');

  // Datos
  const [tienda, setTienda] = useState(null);

  // ── Inbox (mensajes directos de clientes) ─────────────────────────────────
  const [inboxConvos,      setInboxConvos]      = useState([]);
  const [inboxLoading,     setInboxLoading]      = useState(false);
  const [inboxSelectedKey, setInboxSelectedKey]  = useState(null);
  const [inboxReply,       setInboxReply]        = useState('');
  const [inboxInfoOpen,    setInboxInfoOpen]     = useState(false);
  const [editingMsg,       setEditingMsg]        = useState(null); // {id, text}
  const [swipedMsgId,      setSwipedMsgId]       = useState(null); // long-press mobile
  const [deletingMsgId,    setDeletingMsgId]     = useState(null); // animación borrado
  const [confirmDeleteMsg, setConfirmDeleteMsg]  = useState(null); // {key} pendiente de confirmar
  const [storeTyping,      setStoreTyping]       = useState(false); // "escribiendo..." simulado
  const [inboxSending,     setInboxSending]      = useState(false);
  const [attachOpen,       setAttachOpen]        = useState(false);
  const [chatAttachment,   setChatAttachment]    = useState(null); // { type, ...data }
  const [chatImagePreview, setChatImagePreview]  = useState(null); // base64 data URL
  const chatImageInputRef = useRef(null);
  const [inboxSearch,      setInboxSearch]       = useState('');
  const [inboxMobileView,  setInboxMobileView]   = useState('list'); // 'list' | 'chat'
  const [inboxTab,         setInboxTab]          = useState('chats'); // 'chats' | 'respuestas'
  const [msgFilter,        setMsgFilter]         = useState('todos'); // 'todos' | 'chats' | 'laborales'
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

  // Suscripción / paywall
  const [showPaywall, setShowPaywall]   = useState(false);
  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [showTransferenciaModal, setShowTransferenciaModal] = useState(false);
  const [transferenciaPlan, setTransferenciaPlan] = useState('mensual');
  const [renovando, setRenovando]       = useState(false);
  const [renovError, setRenovError]     = useState(null);
  const [historialPagos, setHistorialPagos] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(null); // string del plan en curso ('mensual'/'anual'), null = ninguno — así el spinner solo prende en el botón que realmente está en vuelo
  const [checkoutError, setCheckoutError] = useState(null);
  const isActiva = suscripcionActiva(tiendaData);
  const dias     = diasRestantes(tiendaData);

  // Notificaciones / unread
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const [createSheetClosing, setCreateSheetClosing] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

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
  const [paginaForm, setPaginaForm] = useState({ template: 'commerce-modern', color: '#e4002b', colorSecundario: null, modoOscuro: false, secciones: {} });
  const [savingPagina, setSavingPagina] = useState(false);

  // Editor enfocado de campos (descripción, contacto) — reemplaza el viejo
  // EditInfoModal (formulario largo "editar todo de una", retirado). Cada
  // apertura define qué campos muestra vía `fieldEditor.fields`. Guardado
  // optimista: cierra al instante, persiste en segundo plano.
  const [fieldEditor, setFieldEditor] = useState(null); // { title, fields:[{key,label,type,placeholder,prefix,maxLength,rows}], values }
  const [editingNombre, setEditingNombre] = useState(false);
  const [nombreDraft, setNombreDraft] = useState('');
  // Índice del carrusel del hero de "Mi tienda" (PerfilScreen) — vive acá,
  // NO dentro de PerfilScreen: esa función se invoca condicionalmente como
  // PerfilScreen() (no <PerfilScreen/>) según screen==='perfil', así que un
  // hook declarado ahí adentro entra/sale del conteo de hooks de StoreApp
  // según la pantalla activa y rompe las reglas de hooks (mismo criterio ya
  // documentado para editingNombre/nombreDraft arriba).
  const [heroPhotoIdx, setHeroPhotoIdx] = useState(0);
  // Estado de la sección "Completá tu tienda" — vive acá por el mismo
  // motivo que heroPhotoIdx: PerfilScreen se invoca como función plana, no
  // como componente. Desplegada por defecto: al abrir "Mi tienda" ya se ven
  // los hasta 5 pendientes, sin necesidad de tocar el header para
  // descubrirlos. "Ver más" (si hay más de 5) expande el resto; "Ver menos"
  // vuelve al recorte de 5 sin volver a colapsar la sección entera.
  const [profileChecklistCollapsed, setProfileChecklistCollapsed] = useState(false);
  const [profileChecklistExpanded, setProfileChecklistExpanded] = useState(false);
  const [mediaModal, setMediaModal] = useState(null); // 'foto' | 'galeria'
  const [mediaDraft, setMediaDraft] = useState([]);
  const [mediaSaving, setMediaSaving] = useState(false);
  const [mediaError, setMediaError] = useState(null);
  const mediaInputRef = useRef(null);
  // Cola de archivos elegidos pendientes de encuadrar (react-easy-crop) antes
  // de sumarse al draft — uno por vez: al confirmar/cancelar el crop de uno
  // pasa al siguiente. dragOver: resalta el dropzone mientras se arrastra un
  // archivo encima (drag&drop real, antes el cuadro dashed era solo visual).
  const [cropQueue, setCropQueue] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [locationModal, setLocationModal] = useState(false);
  const [horarioModal, setHorarioModal] = useState(false);
  const [horarioForm, setHorarioForm] = useState({});
  const [savingHorario, setSavingHorario] = useState(false);
  const [locationForm, setLocationForm] = useState({ ciudad: '', direccion: '', lat: null, lng: null });
  const [locationFlyTo, setLocationFlyTo] = useState(null);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState(null);
  // Cuál de los dos PlaceAutocomplete (ciudad/dirección) del sheet de
  // Ubicación tiene su dropdown abierto — coordinación explícita para que
  // nunca estén los dos desplegados a la vez ni se solapen.
  const [activeLocationField, setActiveLocationField] = useState(null);
  // A nivel StoreApp (no dentro de LocationEditorModal, que hace
  // `if (!locationModal) return null;` antes de llegar acá) — un hook
  // después de ese early-return entraría y saldría del conteo de hooks
  // según el modal esté abierto o no, mismo problema que tuvimos con
  // PerfilScreen ("Rendered fewer hooks than expected").
  const geo = useGeolocation();
  // Cuando el GPS resuelve una posición, mueve el pin y dispara reverse
  // geocoding para completar ciudad/dirección — mismo criterio que tocar
  // el mapa (applyGeocode dentro de LocationEditorModal), así "usar mi
  // ubicación" es una alternativa completa a tipear, no solo mueve el pin.
  useEffect(() => {
    if (!geo.location || !locationModal) return;
    const { lat, lng } = geo.location;
    setLocationForm(prev => ({ ...prev, lat, lng }));
    setLocationFlyTo({ lat, lng });
    reverseGeocode(lat, lng)
      .then(({ ciudad, direccion }) => setLocationForm(prev => ({ ...prev, lat, lng, ciudad: ciudad || prev.ciudad, direccion: direccion || prev.direccion })))
      .catch(() => {});
  }, [geo.location, locationModal]);


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

  // Ofertas — módulo simple (isModuleActive(tienda, 'ofertas')): foto +
  // nombre + vigencia, nada más. Contrato real del backend
  // (netlify/functions/ofertas.js → sanitizeOfertaInput): nombre, imageUrl,
  // thumbUrl, publishAt, expireAt, visible. Comparte misProductos/
  // loadingProductos con el módulo 'catalogo' (mismo endpoint /ofertas).
  const [ofertaShowForm, setOfertaShowForm] = useState(false);
  const [ofertaEditing, setOfertaEditing] = useState(null);
  const [ofertaForm, setOfertaForm] = useState({ nombre: '', expireAt: '', visible: true });
  const [ofertaFotoFile, setOfertaFotoFile] = useState(null);
  const [ofertaFotoPreview, setOfertaFotoPreview] = useState(null);
  // Al EDITAR: marca que el dueño quitó explícitamente la foto ya guardada
  // (ofertaEditing.imageUrl) con la X — sin esto no había forma de "vaciar"
  // el picker en modo edición, solo de reemplazarla subiendo otra encima.
  const [ofertaFotoRemoved, setOfertaFotoRemoved] = useState(false);
  // true entre "elegí un archivo" y "el navegador ya decodificó/pintó esa
  // imagen" — createObjectURL es instantáneo, pero el <img> tarda un poco en
  // decodificar+pintar fotos pesadas de cámara sin comprimir todavía (recién
  // se comprimen al subir de verdad). Sin este spinner, esos segundos se
  // sentían como "elegí la foto pero no pasó nada", incertidumbre real.
  const [ofertaFotoLoading, setOfertaFotoLoading] = useState(false);
  // true recién DESPUÉS del primer intento de guardar con algo faltante —
  // así el formulario no "grita" en rojo apenas se abre, solo cuando el
  // dueño de verdad intentó guardar sin completar todo.
  const [ofertaIntentoGuardar, setOfertaIntentoGuardar] = useState(false);
  const [ofertaConfirmDelete, setOfertaConfirmDelete] = useState(null);

  // ─── Cola de publicación/edición de oferta EN SEGUNDO PLANO ───────────────
  // Mismo patrón que ya usa la carga rápida desde la tienda pública
  // (TiendaPublica.jsx → subirOfertaEnCola): "Publicar"/"Guardar" ya NO
  // bloquea el formulario con spinner hasta que la red responde — cierra al
  // instante, la card aparece/actualiza en la grilla con estado "pendiente"
  // (foto real vía blob URL) mientras sube de verdad atrás, y si falla queda
  // en rojo con "Reintentar" sin perder los datos cargados.
  // Map en vez de leer el array reactivo (misProductos) dentro de la
  // corrutina: subirOfertaEnColaAdmin se dispara en el MISMO tick síncrono
  // que el setMisProductos que agrega el ítem pendiente — el estado de React
  // todavía no se re-renderizó, así que cualquier ref sincronizado por
  // useEffect(() => ref.current = misProductos, [misProductos]) llega tarde
  // (corre recién después de ese primer render). El resultado real de ese
  // bug: item siempre undefined en el primer intento → "if (!item) return"
  // cortaba la función en silencio ANTES de tocar _status, dejando la card
  // en 'uploading' para siempre (el spinner que nunca se iba). El Map se
  // escribe de forma síncrona antes de disparar la subida, sin ese desfasaje.
  const ofertaPendientesRef = useRef(new Map()); // _localId -> datos del ítem
  const ofertaAbortRefs = useRef({}); // _localId -> AbortController

  const subirOfertaEnColaAdmin = useCallback((localId) => {
    const item = ofertaPendientesRef.current.get(localId);
    if (!item) return; // se descartó/canceló antes de arrancar
    setMisProductos(prev => prev.map(o => (o._localId === localId ? { ...o, _status: 'uploading', _error: null } : o)));
    const controller = new AbortController();
    ofertaAbortRefs.current[localId] = controller;

    (async () => {
      try {
        let imageUrl = item._existingImageUrl || null;
        let thumbUrl = item._existingThumbUrl || null;
        let ogImageUrl = item._existingOgImageUrl || null;
        if (item._fotoFile) {
          const uploaded = await uploadOfertaImages(item._fotoFile);
          if (controller.signal.aborted) return;
          imageUrl = uploaded.imageUrl; thumbUrl = uploaded.thumbUrl; ogImageUrl = uploaded.ogImageUrl;
        }
        if (!imageUrl) throw new Error('Subí una foto para la oferta');
        const payload = {
          nombre: item.nombre,
          imageUrl, thumbUrl: thumbUrl || imageUrl, ogImageUrl: ogImageUrl || thumbUrl || imageUrl,
          expireAt: item.expireAt,
          visible: item.visible !== false,
        };
        if (controller.signal.aborted) return;
        const res = item._editingId
          ? await apiFetch(`${API_BASE}/ofertas`, { method: 'PATCH', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: item._editingId, ...payload }), signal: controller.signal })
          : await apiFetch(`${API_BASE}/ofertas`, { method: 'POST', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tiendaId: tiendaData.id, ...payload }), signal: controller.signal });
        if (controller.signal.aborted) return;
        if (!res.ok) throw new Error(item._editingId ? 'No se pudo actualizar la oferta' : 'No se pudo publicar la oferta');
        const guardada = await res.json();
        if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
        setMisProductos(prev => prev.map(o => (o._localId === localId ? guardada : o)));
        ofertaPendientesRef.current.delete(localId);
      } catch (e) {
        if (controller.signal.aborted) return; // cancelado a mano: no es un error real
        setMisProductos(prev => prev.map(o => (o._localId === localId ? { ...o, _status: 'error', _error: e.message } : o)));
      } finally {
        delete ofertaAbortRefs.current[localId];
      }
    })();
  }, [tiendaData?.id]);

  const handleOfertaGuardadaOptimista = useCallback((datos) => {
    const localId = `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const item = {
      _localId: localId, _fotoFile: datos.fotoFile, _editingId: datos.editingId || null,
      _existingImageUrl: datos.existingImageUrl || null,
      _existingThumbUrl: datos.existingThumbUrl || null,
      _existingOgImageUrl: datos.existingOgImageUrl || null,
      nombre: datos.nombre,
      previewUrl: datos.previewUrl,
      expireAt: datos.expireAt,
      visible: datos.visible !== false,
    };
    ofertaPendientesRef.current.set(localId, item);
    const pendiente = {
      ...item, _status: 'uploading', _error: null,
      id: datos.editingId || localId, // key estable: si es edición, conserva el id real
      thumbUrl: datos.previewUrl || datos.existingThumbUrl,
      imageUrl: datos.previewUrl || datos.existingImageUrl,
    };
    setMisProductos(prev => datos.editingId
      ? prev.map(o => (o.id === datos.editingId ? pendiente : o))
      : [pendiente, ...prev]);
    subirOfertaEnColaAdmin(localId);
  }, [subirOfertaEnColaAdmin]);

  const handleReintentarOfertaAdmin = useCallback((localId) => {
    subirOfertaEnColaAdmin(localId);
  }, [subirOfertaEnColaAdmin]);

  // Cancela una subida en curso — mismo criterio que WhatsApp: tocar la X
  // sobre el spinner aborta el request real (AbortController) y descarta la
  // card pendiente de la grilla. Si era una EDICIÓN, no se pierde nada real
  // (el servidor nunca llegó a recibir el cambio); si era una oferta nueva,
  // simplemente no se crea.
  const handleCancelarOfertaAdmin = useCallback((localId) => {
    ofertaAbortRefs.current[localId]?.abort();
    delete ofertaAbortRefs.current[localId];
    const item = ofertaPendientesRef.current.get(localId);
    ofertaPendientesRef.current.delete(localId);
    if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
    setMisProductos(prev => prev.filter(o => o._localId !== localId));
  }, []);

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
        if (storeScreenKey) localStorage.setItem(storeScreenKey, s);
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
      if (STORE_SCREENS.includes(hash)) { setScreen(hash); if (storeScreenKey) localStorage.setItem(storeScreenKey, hash); }
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
    fetchMisProductos();
    apiFetch(`${API_BASE}/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(custom => { if (custom.length > 0) setAllCategories([...BASE_CATEGORIES, ...custom]); })
      .catch(() => {});
  }, []);

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
    setCropQueue([]);
    setDragOver(false);
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
    // Sin este reset, si una apertura previa dejó "ciudad" como campo
    // activo (ej. se cerró el modal justo tras hacer foco ahí, sin blur),
    // la próxima apertura arrancaba con ese dropdown ya considerado
    // "abierto" por la coordinación, aunque el usuario no tocó nada.
    setActiveLocationField(null);
    setLocationModal(true);
  };

  // Guardado optimista de fieldEditor: cierra el sheet AL INSTANTE (no
  // espera la red), refleja el cambio en la UI de inmediato, y persiste en
  // segundo plano — mismo patrón que ya usa la carga rápida de oferta desde
  // la tienda pública. Antes (EditInfoModal) el sheet quedaba trabado con
  // spinner hasta que el PATCH volvía.
  const saveFieldEditor = async (values) => {
    const patch = fieldEditor.fields.reduce((acc, f) => ({ ...acc, [f.key]: values[f.key] }), {});
    setFieldEditor(null);
    try {
      await persistTiendaPatch(patch);
    } catch {
      // Si falla, el dato queda en el estado previo (tiendaData no se tocó
      // hasta que persistTiendaPatch resuelve) — el dueño puede reabrir el
      // sheet y reintentar; no hace falta un rollback visual complejo acá
      // porque no hubo optimismo sobre la propia tienda, solo sobre el sheet.
    }
  };

  // Abre el sheet enfocado de "Descripción" (1 campo) — reemplaza el scope
  // 'descripcion' del viejo EditInfoModal (formulario largo retirado: ver
  // auditoría UX, hallazgo A1/B5).
  const openDescripcionEditor = () => {
    setFieldEditor({
      title: 'Descripción',
      fields: [{ key: 'descripcion', label: 'Descripción', type: 'textarea', rows: 4, maxLength: 1500, placeholder: 'Contá de qué se trata tu tienda, qué productos o servicios ofrecés...' }],
      values: { descripcion: tiendaInfo.descripcion || '' },
    });
  };

  // Abre el sheet enfocado de "Contacto" (teléfono/whatsapp/IG/tagline) —
  // reemplaza el scope 'contacto' del viejo EditInfoModal. Puede abrirse
  // completo (desde "Contacto e info") o con un solo campo resaltado si el
  // acceso vino de un campo puntual (ej. tocar la fila de "Instagram").
  const openContactoEditor = (focusField = null) => {
    setFieldEditor({
      title: 'Contacto',
      focusField,
      fields: [
        { key: 'telefono',  label: 'Teléfono / WhatsApp', type: 'text', placeholder: '+5493XX XXXXXXX' },
        { key: 'whatsapp',  label: 'WhatsApp (si es distinto al teléfono)', type: 'text', placeholder: '+5493XX XXXXXXX' },
        { key: 'instagram', label: 'Instagram', type: 'text', prefix: '@', placeholder: 'mitienda', maxLength: 60 },
        { key: 'tagline',   label: 'Tagline', type: 'text', placeholder: 'Tu frase o eslogan', maxLength: 160 },
      ],
      values: {
        telefono: tiendaInfo.telefono || '',
        whatsapp: tiendaInfo.whatsapp || '',
        instagram: tiendaInfo.instagram || '',
        tagline: tiendaInfo.tagline || '',
      },
    });
  };

  const openProfileEdit = (section) => {
    // 'portada' fue siempre un alias de 'galeria' (galeria[0] es la foto de
    // portada del hero público, que rota TODA la galería como carrusel de
    // fondo) — antes tenía su propio modal limitado a 1 sola foto, sin
    // relación con cuántas admite el hero real. Unificado: un solo editor.
    if (['foto', 'portada', 'galeria'].includes(section)) {
      openMediaEditor(section === 'portada' ? 'galeria' : section);
      return;
    }
    // Teléfono/WhatsApp/Instagram/Tagline: son todos "cómo te encuentran y
    // te presentás" — un solo sheet enfocado, resaltando el campo puntual
    // que se tocó (si vino de un ítem específico, no del acceso general).
    if (['telefono', 'whatsapp', 'instagram', 'tagline'].includes(section)) {
      openContactoEditor(section);
      return;
    }
    if (section === 'descripcion') {
      openDescripcionEditor();
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
    // slug: es URL/diseño, se queda en la sección de diseño de página.
    if (section === 'slug') {
      setPublicPageForm({
        slug: tiendaInfo.slug || '',
        tagline: tiendaInfo.tagline || '',
        whatsapp: tiendaInfo.whatsapp || tiendaInfo.telefono || '',
        instagram: tiendaInfo.instagram || '',
      });
      setPublicPageError(null);
      setEditingPublicPage(true);
      return;
    }
    // 'rubros' no tiene editor visible hoy: se ocultó del perfil (solo se
    // usa al CREAR la tienda para el preset de módulos, no aplica después —
    // ver auditoría UX hallazgo A3). El dato se sigue guardando en backend;
    // si se reactiva la edición post-creación, acá es donde enganchar su
    // propio sheet enfocado.
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
      template:        tienda.pagina.template        ?? 'commerce-modern',
      color:           tienda.pagina.color           ?? '#e4002b',
      colorSecundario: tienda.pagina.colorSecundario  ?? null,
      modoOscuro:      tienda.pagina.modoOscuro       ?? false,
      secciones:       tienda.pagina.secciones        ?? {},
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
      // all=1: el dueño ve también vencidas/ocultas en su panel (para poder
      // reactivarlas); el listado público (GET ?slug=...) sigue filtrando
      // solo vigentes del lado del backend.
      const res = await apiFetch(`${API_BASE}/ofertas?tiendaId=${tiendaData.id}&all=1`, { authRequired: true });
      if (res.ok) {
        const data = await res.json();
        cacheSet(PROD_CACHE_KEY, data, 10 * 60 * 1000);
        setMisProductos(data);
      }
    } catch { /* silencioso */ } finally {
      setLoadingProductos(false);
    }
  };

  // Archivos elegidos (por input o drag&drop) NO se suman directo al draft:
  // primero pasan uno por uno por el cropper (ver cropQueue/CropModal más
  // abajo) para que el dueño pueda encuadrar/hacer zoom antes de subir —
  // antes se usaba la foto tal cual salía de la cámara, sin recorte posible.
  const queueMediaFiles = (fileList) => {
    const files = Array.from(fileList || []).filter(f => f.type?.startsWith('image/'));
    if (!files.length) return;
    const isSingle = mediaModal === 'foto';
    const remaining = isSingle ? 1 : Math.max(0, 6 - mediaDraft.length - cropQueue.length);
    setCropQueue(prev => [...prev, ...files.slice(0, remaining)]);
  };

  const handleMediaFiles = (event) => {
    queueMediaFiles(event.target.files);
    event.target.value = '';
  };

  const handleMediaDrop = (event) => {
    event.preventDefault();
    setDragOver(false);
    queueMediaFiles(event.dataTransfer.files);
  };

  // Confirmado el encuadre de un archivo: se suma al draft como "nuevo" y se
  // avanza al siguiente de la cola (si el dueño arrastró varias fotos juntas).
  const handleCropConfirm = (croppedFile) => {
    const url = URL.createObjectURL(croppedFile);
    setMediaDraft(prev => {
      const nextItem = { file: croppedFile, url, existing: false };
      if (mediaModal === 'foto') {
        prev.forEach(item => { if (!item.existing) URL.revokeObjectURL(item.url); });
        return [nextItem];
      }
      return [...prev, nextItem];
    });
    setCropQueue(prev => prev.slice(1));
  };

  const handleCropSkip = () => setCropQueue(prev => prev.slice(1));

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

  const toggleMockMode = () => {
    if (!mockMode) {
      setMisProductos(MOCK_PRODUCTOS);
      setInboxConvos(MOCK_INBOX);
      setHistorialPagos(MOCK_HISTORIAL_PAGOS);
      setAiData({ insights: [
        { prioridad: 'alta', titulo: 'Actualizar precios de herramientas', descripcion: 'Los precios de taladros y amoladoras están por debajo del mercado local. Subir entre 8-12% aumentaría el margen sin afectar la conversión.' },
        { prioridad: 'media', titulo: 'Añadir fotos a 3 productos sin imagen', descripcion: 'Tornillos 4x40, Disco de corte x5 y Sellador silicona no tienen foto. Los productos con foto convierten 3x más.' },
        { prioridad: 'baja', titulo: 'Responder consulta pendiente de Ignacio Molina', descripcion: 'Hay una consulta sin responder de hace 2 horas sobre cables eléctricos. Responder rápido mejora la reputación.' },
      ]});
    } else {
      setMisProductos([]);
      setInboxConvos([]);
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

  const tiendaInfo = tienda || {
    nombre: tiendaData?.nombre || '',
    rubros: tiendaData?.rubros || [],
    foto: tiendaData?.foto || null,
    direccion: tiendaData?.direccion || '',
    ciudad: tiendaData?.ciudad || '',
    telefono: tiendaData?.telefono || '',
    horarios: tiendaData?.horarios || null,
  };

  // Inyecta las mismas vars --tp-* que usa la tienda pública real (mismo
  // mecanismo que TiendaPublicaRenderer/OfertaIndividual: deriveColorPalette
  // a partir del color de marca elegido en Diseño) — así el hero de Mi
  // Tienda usa el color real, no un bordó fijo sin relación con la marca.
  // Vive a nivel StoreApp (no dentro de PerfilScreen) porque PerfilScreen
  // se invoca como función plana condicionalmente (`screen === 'perfil' &&
  // PerfilScreen()`, no como <PerfilScreen/>) — un hook ahí adentro entra y
  // sale del conteo de hooks de StoreApp según la pantalla activa, lo que
  // rompe las reglas de hooks ("Rendered fewer hooks than expected").
  useLayoutEffect(() => {
    if (screen !== 'perfil') return undefined;
    const el = document.documentElement;
    const vars = deriveColorPalette(tiendaInfo?.pagina?.color || '#e4002b', isDark, tiendaInfo?.pagina?.colorSecundario);
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    return () => Object.keys(vars).forEach((k) => el.style.removeProperty(k));
  }, [screen, tiendaInfo?.pagina?.color, tiendaInfo?.pagina?.colorSecundario, isDark]);

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
        className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim transition-colors shrink-0"
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
    // leftSlot reemplaza el título/subtítulo (que ocupan el flex-1
    // izquierdo) por contenido custom — usado en "Mi tienda" para poner
    // "Ver página" ahí en vez de a la derecha: es la acción principal de
    // esa pantalla, y a la izquierda queda más protagónica/fácil de
    // encontrar (el pulgar en mobile ya arranca esa zona al abrir la app).
    leftSlot = null,
    // icon: mismo ícono que la sección tiene en la nav lateral/inferior
    // (ver STORE_NAV_ITEMS más arriba) — repetirlo acá da contexto visual
    // inmediato de "dónde estoy", igual que ya pasa con el avatar de tienda
    // o el botón de nav activo.
    icon: Icon = null,
  }) => (
    <div className="bg-surface-card sticky top-0 z-20 shrink-0">
      <div className="px-4 lg:px-8 h-14 lg:h-16 flex items-center gap-3 border-b border-slate-100 dark:border-white/8">

        {/* Back — el avatar de tienda que vivía acá en mobile se sacó: era
            redundante con el avatar de CUENTA de la derecha (misma forma,
            mismo tamaño, en el mismo header) aunque son datos distintos
            (negocio vs. persona dueña) — se leían como "la misma foto
            repetida". La foto de perfil de la tienda ya se ve grande y
            clara en el hero de "Mi tienda", no hace falta chiquita acá
            también. */}
        {onBack && (
          <button onClick={onBack} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim shrink-0 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Título + subtítulo (+ ícono de sección) — o leftSlot si se pasó uno */}
        <div className="flex-1 min-w-0 flex items-center gap-2.5">
          {Icon && !leftSlot && (
            <span className="w-8 h-8 rounded-xl bg-brand/10 dark:bg-brand/15 text-brand flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" strokeWidth={2.5} />
            </span>
          )}
          <div className="min-w-0 flex flex-col justify-center">
            {leftSlot || (
              <>
                {/* leading-none (line-height:1), no leading-tight (1.25) —
                    ese 0.25 extra de caja de línea vive mayormente debajo
                    del texto visible por cómo el navegador reparte el
                    "leading" según las métricas de la fuente, así que el
                    bloque entero (con justify-center del padre) se veía
                    corrido hacia arriba respecto al ícono de la izquierda. */}
                <h1 className="font-black text-[15px] lg:text-lg leading-none truncate">{title}</h1>
                {subtitle && <p className="text-[11px] text-ink-dim font-medium leading-none mt-0.5 truncate hidden lg:block">{subtitle}</p>}
              </>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className={`flex items-center gap-1 shrink-0 ${hideActionsOnMobile ? 'hidden lg:flex' : 'flex'}`}>
          {actionSlot}
          {/* Mismo diseño/comportamiento que el toggle de tema del footer de
              tienda pública (TiendaFooter.jsx: .tp-footer-theme) — antes
              usaba ui-icon-btn, que trae un scale(1.05) en :hover pensado
              para botones de ícono puro; sobre este botón se notaba como un
              salto de ~1px del ícono. El del footer no tiene ningún
              transform en hover, solo cambia fondo/color al primario (regla
              .sa-theme-toggle:hover vive en styles/components.css). */}
          <button
            onClick={toggleTheme}
            className="sa-theme-toggle hidden lg:inline-flex"
            title={isDark ? 'Modo claro' : 'Modo oscuro'}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 40, height: 40, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'transparent', color: 'var(--text-secondary)',
              transition: 'background-color .15s ease, color .15s ease',
            }}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
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
  // ── PremiumModal ──────────────────────────────────────────────────────────
  const PremiumModal = () => (
    <PremiumModalUI
      onClose={() => setShowPremiumModal(false)}
      onUpgrade={(metodo) => { setShowPremiumModal(false); if (metodo === 'transferencia') { setTransferenciaPlan('premium'); setShowTransferenciaModal(true); } else { handleRenovar('premium'); } }}
      renovando={renovando}
    />
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
      // "Inicio" (feed marketplace multi-tienda) se sacó: no aplica a la
      // gestión de un mono-negocio.
      ...(isModuleActive(tiendaData, 'mensajes') ? [{ label: 'Mensajes', icon: MessageSquare, id: 'mensajes' }] : []),
      { label: isModuleActive(tiendaData, 'catalogo') ? 'Mis productos' : 'Ofertas', icon: Zap, id: 'productos', badge: misProductos.filter(o => o.activa !== false && o.visible !== false).length || null },
      // Estadísticas y Suscripción: transversales a todo plan/rubro (la
      // suscripción es 1 mes gratis + monto por rubro que fija el admin
      // general). Antes gateadas con isEmpresa, lo que las ocultaba a las
      // tiendas Emprendimiento — que es justo el caso más común.
      { label: 'Estadísticas', icon: TrendingUp, id: 'stats' },
      { label: 'Suscripción', icon: CreditCard, id: 'suscripcion' },
      { label: isEmprendimiento ? 'Mi perfil' : 'Mi tienda', icon: Store, id: 'perfil' },
      { label: 'Diseño de página', icon: Palette, id: 'mi-pagina' },
    ];

    return (
      <>
      <div
        className="hidden lg:flex lg:flex-col bg-surface-card border-r border-slate-100 dark:border-white/8 h-screen fixed top-0 left-0 z-[200] overflow-hidden"
        style={{ width: expanded ? W_EXPANDED : W_COLLAPSED, transition: 'width 380ms cubic-bezier(0.16,1,0.3,1)' }}
      >
        {/* Logo + pin */}
        <div className="border-b border-slate-100 dark:border-white/8 shrink-0">
          <div className={`flex items-center h-14 px-3 overflow-hidden gap-1 ${expanded ? '' : 'justify-center'}`}>
            {expanded && (
              <div className="flex flex-col flex-1 min-w-0 px-1">
                <LogoFull size={16} className="dark:hidden" color="#2A0509" />
                <LogoFull size={16} className="hidden dark:inline-flex" light />
                <p className="text-[10px] text-brand font-semibold mt-0.5 truncate">Panel de tienda</p>
              </div>
            )}
            <button
              onClick={togglePin}
              title={sidebarPinned ? 'Soltar sidebar' : 'Fijar sidebar'}
              className={`ui-chip ui-icon-btn shrink-0 transition-colors ${sidebarPinned ? 'text-primary bg-primary/10' : 'text-ink-dim hover:text-ink dark:hover:text-white hover:bg-surface-card-2 dark:hover:bg-white/8'}`}
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
        <nav className="flex-1 py-2 px-3 overflow-y-auto no-scrollbar overflow-x-hidden">
          {navItems.map(({ label, icon: Icon, id, badge, newBadge }) => {
            const isActive = screen === id;
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
                    ? 'bg-surface-card-2 dark:bg-white/8 text-ink font-bold'
                    : 'text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 hover:text-ink dark:hover:text-ink-dim'
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
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full mr-2 shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-surface-card-2 dark:bg-white/10 text-ink-dim'}`}
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
              href={`/${tiendaInfo.slug}`}
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
            className="w-full flex items-center ui-chip text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 hover:text-ink dark:hover:text-ink-dim transition-colors overflow-hidden"
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
              className={`w-full flex items-center ui-chip transition-colors overflow-hidden ${mockMode ? 'text-violet-600 bg-violet-50 dark:bg-violet-500/10 hover:bg-violet-100 dark:hover:bg-violet-500/20' : 'text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 hover:text-ink dark:hover:text-ink-dim'}`}
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
            <span className="text-[10px] text-ink-dim">por</span>
            <KtrlMark className="h-2.5 text-ink-dim" />
          </div>
        </div>
      </div>

      {/* Tooltip flotante */}
      {tooltip && !expanded && (
        <div
          className="fixed z-[9999] pointer-events-none hidden lg:block"
          style={{ left: W_COLLAPSED + 8, top: tooltip.y, transform: 'translateY(-50%)' }}
        >
          <div className="relative flex items-center gap-2 bg-ink dark:bg-surface-card-2 text-white text-xs font-bold px-3 py-2 rounded-xl shadow-xl whitespace-nowrap">
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
    <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }} className="lg:hidden fixed bottom-0 left-0 right-0 bg-surface-card border-t border-slate-100 dark:border-white/8 z-[4500]">
      <div className="flex items-end justify-around px-2 pt-2 pb-3 max-w-md mx-auto">
        <button onClick={() => { navigateTo('productos'); setCreateSheetOpen(false); setCreateSheetClosing(false); }} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${screen === 'productos' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
            <Tag className={`w-5 h-5 ${screen === 'productos' ? 'text-primary' : 'text-ink-dim'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${screen === 'productos' ? 'text-primary' : 'text-ink-dim'}`}>{isModuleActive(tiendaData, 'catalogo') ? 'Productos' : 'Ofertas'}</span>
        </button>
        {/* Segundo slot: Mensajes si el módulo está activo (rubro tienda);
            si no (rubro ofertas tipo Bovril), Estadísticas — así el nav
            mantiene 5 items balanceados alrededor del FAB central en ambos
            casos, sin quedar descentrado. */}
        {isModuleActive(tiendaData, 'mensajes') ? (
        <button onClick={() => { navigateTo('mensajes'); setCreateSheetOpen(false); setCreateSheetClosing(false); }} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${screen === 'mensajes' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
            <MessageSquare className={`w-5 h-5 ${screen === 'mensajes' ? 'text-primary' : 'text-ink-dim'}`} />
            {unreadTotal > 0 && screen !== 'mensajes' && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 bg-brand text-white text-[9px] font-black rounded-full flex items-center justify-center leading-none">
                {unreadTotal > 99 ? '99+' : unreadTotal}
              </span>
            )}
          </div>
          <span className={`text-[10px] font-semibold ${screen === 'mensajes' ? 'text-primary' : 'text-ink-dim'}`}>Mensajes</span>
        </button>
        ) : (
        <button onClick={() => { navigateTo('stats'); setCreateSheetOpen(false); setCreateSheetClosing(false); }} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${screen === 'stats' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
            <TrendingUp className={`w-5 h-5 ${screen === 'stats' ? 'text-primary' : 'text-ink-dim'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${screen === 'stats' ? 'text-primary' : 'text-ink-dim'}`}>Estadísticas</span>
        </button>
        )}
        <button onClick={() => createSheetOpen ? closeCreateSheet() : setCreateSheetOpen(true)} className="flex flex-col items-center gap-1 min-w-[56px] -mt-3">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-all ${createSheetOpen ? 'bg-ink-dim rotate-45' : 'bg-primary hover:bg-primary-hover'}`}>
            <Plus className="w-7 h-7 text-white" />
          </div>
          <span className="text-[10px] font-semibold text-ink-dim">Crear</span>
        </button>
        <button onClick={() => { navigateTo('perfil'); setCreateSheetOpen(false); setCreateSheetClosing(false); }} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${screen === 'perfil' ? 'bg-primary/10 dark:bg-primary/15' : 'hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
            <Store className={`w-5 h-5 ${screen === 'perfil' ? 'text-primary' : 'text-ink-dim'}`} />
          </div>
          <span className={`text-[10px] font-semibold ${screen === 'perfil' ? 'text-primary' : 'text-ink-dim'}`}>{isEmprendimiento ? 'Mi perfil' : 'Mi tienda'}</span>
        </button>
        <button onClick={() => setMoreSheetOpen(v => !v)} className="flex flex-col items-center gap-1 min-w-[56px]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/8 transition-colors">
            <Menu className="w-5 h-5 text-ink-dim" />
          </div>
          <span className="text-[10px] font-semibold text-ink-dim">Más</span>
        </button>
      </div>
    </div>
  );


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

  const AVATAR_COLORS = ['bg-violet-500','bg-brand','bg-emerald-500','bg-amber-500','bg-rose-500','bg-fuchsia-500'];
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
      const ctx = c.context; // { type:'context', origin, productoId, productoTitulo, laboralId, laboralTitulo, cvData, ... }
      const origin = ctx?.origin || 'directa';

      // Determinar tipo visual
      const type = origin === 'producto'  ? 'producto'
        : origin === 'laboral'   ? 'laboral'
        : origin === 'cv'        ? 'cv'
        : 'chat';

      // Subtítulo contextual
      const subtitle = origin === 'producto' ? `Producto: ${ctx.productoTitulo || ''}`.trim()
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
      chat:     { label: 'Chat',     color: 'bg-info',        textColor: 'text-info dark:text-info',               bg: 'bg-info-muted dark:bg-info/10',        Icon: MessageSquare },
      producto: { label: 'Producto', color: 'bg-violet-500',  textColor: 'text-violet-600 dark:text-violet-400',   bg: 'bg-violet-50 dark:bg-violet-500/10',   Icon: Tag           },
      laboral:  { label: 'Laboral',  color: 'bg-emerald-500', textColor: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10', Icon: Zap           },
      cv:       { label: 'CV',       color: 'bg-warn',        textColor: 'text-warn dark:text-warn',               bg: 'bg-warn-muted dark:bg-warn/10',        Icon: Award         },
      directa:  { label: 'Consulta', color: 'bg-info',        textColor: 'text-info dark:text-info',               bg: 'bg-info-muted dark:bg-info/10',        Icon: MessageSquare },
    };

    const FILTERS = [
      { id: 'todos',    label: 'Todos',    types: null },
      { id: 'chats',    label: 'Chats',    types: ['chat', 'directa'] },
      { id: 'contexto', label: 'Con contexto', types: ['producto', 'laboral', 'cv'] },
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
      <div className="flex flex-col h-full bg-surface-card">
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
            <button onClick={fetchInbox} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim" title="Actualizar">
              <RotateCcw className={`w-4 h-4 ${inboxLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Toolbar: búsqueda + filtro tipo */}
          <div className="flex items-center gap-2 mt-1">
            {/* Búsqueda */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-dim" />
              <input value={inboxSearch} onChange={e => setInboxSearch(e.target.value)}
                placeholder="Buscar conversación..."
                className="w-full pl-8 pr-8 py-2 bg-surface-card-2 dark:bg-white/5 rounded-xl text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-brand transition-all border border-transparent focus:border-brand/20" />
              {inboxSearch && <button onClick={() => setInboxSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-dim hover:text-ink-dim"><X className="w-3 h-3" /></button>}
            </div>

            {/* Filtro tipo — dropdown igual que sort de productos */}
            <div className="relative group shrink-0">
              <button className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${msgFilter !== 'todos' ? 'bg-brand text-white' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}
                title="Filtrar por tipo">
                <ListFilter className="w-3.5 h-3.5" />
              </button>
              <div className="absolute right-0 top-full mt-1.5 bg-surface-card rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50 min-w-[170px] hidden group-focus-within:block animate-dropdown-in">
                {FILTERS.map(f => {
                  const count = allThreads.filter(t => !t.closed && t.unread > 0 && (!f.types || f.types.includes(t.type))).length;
                  return (
                    <button key={f.id} onClick={() => setMsgFilter(f.id)}
                      className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors text-left ${msgFilter === f.id ? 'bg-surface-card-2 dark:bg-white/5 font-bold text-brand' : 'text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5'}`}>
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
        <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
          {/* Barra de progreso top cuando recarga con datos ya visibles */}
          {inboxLoading && visibleThreads.length > 0 && (
            <div className="top-progress" style={{ position: 'absolute', top: 0, left: 0, right: 0 }} />
          )}
          <div className="flex-1 divide-y divide-slate-50 dark:divide-white/5">
          {inboxLoading && visibleThreads.length === 0 ? (
            <div className="px-3 pt-3"><SkeletonInbox count={6} /></div>
          ) : visibleThreads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-surface-card-2 dark:bg-white/8 flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-ink-dim dark:text-ink-dim" />
              </div>
              <p className="font-bold text-ink-dim">
                {inboxSearch ? 'Sin resultados' : 'Sin comunicaciones'}
              </p>
              <p className="text-xs text-ink-dim leading-relaxed">
                {inboxSearch ? 'Probá con otro término.' : 'Los chats con tus clientes aparecerán acá.'}
              </p>
            </div>
          ) : <div className="stagger-in">{visibleThreads.map((t, idx) => {
            const meta = TYPE_META[t.type] || TYPE_META.chat;
            const isSelected = t.key === inboxSelectedKey;
            const TypeIcon = meta.Icon;

            return (
              <div key={t.key}
                className={`group relative flex items-start gap-3 px-4 py-3.5 lg:px-5 lg:py-4 transition-colors cursor-pointer border-l-2 ${isSelected ? 'bg-brand/8 dark:bg-brand/12 border-brand' : t.unread > 0 ? 'border-brand/60' : 'border-transparent hover:bg-surface-card-2 dark:hover:bg-white/5'}`}
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
                  <p className={`text-sm leading-tight truncate mb-1 ${t.unread > 0 ? 'font-bold text-ink' : 'font-semibold text-ink dark:text-ink-dim'}`}>
                    {t.title}
                  </p>

                  {/* Fila 2: chip tipo + subtítulo */}
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-md ${meta.bg} ${meta.textColor}`}>{meta.label}</span>
                    {t.subtitle && <p className="text-[11px] text-ink-dim truncate">{t.subtitle}</p>}
                    {t.price > 0 && <p className="text-[11px] font-bold text-brand shrink-0">${t.price.toLocaleString('es')}</p>}
                  </div>

                  {/* Fila 3: último mensaje */}
                  <p className={`text-xs truncate ${t.unread > 0 ? 'text-ink dark:text-ink-dim font-medium' : 'text-ink-dim'}`}>
                    {t.repliedByStore && !t.unread ? <span className="text-ink-dim">Tú: </span> : null}
                    {t.lastText || <span className="italic">Sin mensajes aún</span>}
                  </p>
                </div>

                {/* Columna derecha: hora arriba, badge/acciones abajo */}
                <div className="flex flex-col items-end shrink-0 self-stretch justify-between pt-0.5">
                  <span className="text-[11px] text-ink-dim">{fmtTime(t.lastTs)}</span>
                  {t.unread > 0 && (
                    <span className="w-5 h-5 bg-brand rounded-full text-white text-[10px] font-black flex items-center justify-center">{t.unread > 9 ? '9+' : t.unread}</span>
                  )}
                  <div className="flex flex-col items-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button title="Chat flotante"
                      onClick={e => { e.stopPropagation(); if (floatingChats.find(c => c.key === t.key)) { closeFloatingChat(t.key); } else { openFloatingChat(t.key); } }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${floatingChats.find(c => c.key === t.key) ? 'bg-brand/15 text-brand' : 'text-ink-dim hover:text-ink dark:hover:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                    <button title={t.closed ? 'Desarchivar' : 'Archivar'}
                      onClick={e => { e.stopPropagation(); toggleClose(t.key); }}
                      className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${t.closed ? 'text-amber-500' : 'text-ink-dim hover:text-ink dark:hover:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
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
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-surface-card-2 dark:bg-white/8 flex items-center justify-center shrink-0">
                  <Archive className="w-4 h-4 text-ink-dim" />
                </div>
                <span className="flex-1 text-left text-sm font-semibold text-ink-dim dark:text-ink-dim">Archivadas</span>
                <span className="text-xs font-bold text-ink-dim mr-1">{archivedThreads.length}</span>
                <ChevronDown className={`w-4 h-4 text-ink-dim transition-transform duration-200 ${showClosed ? 'rotate-180' : ''}`} />
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
                        className={`group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isSelected ? 'bg-brand/8 dark:bg-brand/12' : 'opacity-60 hover:opacity-100 hover:bg-surface-card-2 dark:hover:bg-white/5'}`}
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
                            <p className="text-sm font-semibold text-ink-dim truncate">{t.title}</p>
                            <span className="text-[10px] text-ink-dim shrink-0">{fmtTime(t.lastTs)}</span>
                          </div>
                          <p className="text-xs text-ink-dim truncate">
                            {t.repliedByStore && <span className="text-ink-dim">Tú: </span>}
                            {t.lastText || <span className="italic">Sin mensajes</span>}
                          </p>
                        </div>
                        <button title="Desarchivar"
                          onClick={e => { e.stopPropagation(); toggleClose(t.key); }}
                          className="w-6 h-6 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/10 text-ink-dim transition-all shrink-0">
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
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-100 dark:border-white/8 shrink-0 bg-surface-card">
            <button onClick={() => setInboxMobileView('list')} className="lg:hidden ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8">
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
                    {selectedThread.closed && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-surface-card-2 dark:bg-white/10 text-ink-dim shrink-0">CERRADA</span>}
                  </div>
                  <p className="text-xs text-ink-dim">{selectedThread.subtitle}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {selectedThread.type === 'chat' && (
                    <button title="Chat flotante"
                      onClick={() => { if (floatingChats.find(c => c.key === selectedThread.key)) { closeFloatingChat(selectedThread.key); } else { openFloatingChat(selectedThread.key); } }}
                      className={`ui-icon-btn transition-colors ${floatingChats.find(c => c.key === selectedThread.key) ? 'text-brand bg-brand/10' : 'text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
                      <ExternalLink className="w-4 h-4" />
                    </button>
                  )}
                  <button title="Info del cliente" onClick={() => setInboxInfoOpen(v => !v)}
                    className={`ui-icon-btn transition-colors ${inboxInfoOpen ? 'text-brand bg-brand/10' : 'text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'}`}>
                    <User className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <p className="font-bold text-ink-dim text-sm">Seleccioná una conversación</p>
            )}
          </div>

          {/* Cuerpo */}
          <div ref={scrollRef || null} className="flex-1 overflow-y-auto no-scrollbar p-4 bg-surface-card-2 dark:bg-surface-card-2" onClick={() => setSwipedMsgId(null)}>
            {!selectedThread ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-4">
                <div className="w-20 h-20 rounded-3xl bg-surface-card border border-slate-100 dark:border-white/8 flex items-center justify-center shadow-sm">
                  <MessageSquare className="w-10 h-10 text-ink-dim dark:text-ink-dim" />
                </div>
                <p className="font-bold text-ink-dim">Seleccioná una conversación</p>
                <p className="text-xs text-ink-dim">Los chats directos con clientes aparecen a la izquierda.</p>
              </div>

            ) : (
              /* Chat unificado — con header de contexto si aplica */
              <div className="space-y-3">
                {/* Header de contexto (producto, laboral, cv) */}
                {selectedThread.type !== 'chat' && selectedThread.type !== 'directa' && (() => {
                  const cm = TYPE_META[selectedThread.type] || TYPE_META.chat;
                  const CIcon = cm.Icon;
                  return (
                    <div className={`rounded-2xl border p-3.5 flex items-start gap-3 ${cm.bg} border-current/10`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${cm.bg}`}>
                        <CIcon className={`w-4 h-4 ${cm.textColor}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-[10px] font-black uppercase tracking-wide mb-0.5 ${cm.textColor}`}>{cm.label}</p>
                        <p className="text-sm font-semibold text-ink dark:text-ink-dim truncate">{selectedThread.subtitle}</p>
                        {selectedThread.price > 0 && (
                          <p className={`text-sm font-black mt-1 ${cm.textColor}`}>$ {selectedThread.price.toLocaleString()}</p>
                        )}
                      </div>
                    </div>
                  );
                })()}
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                    <MessageSquare className="w-10 h-10 text-ink-dim dark:text-ink" />
                    <p className="text-sm text-ink-dim">Iniciá la conversación</p>
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
                          const foto = att.foto || fullProd?.fotos?.[0] || fullProd?.foto || fullProd?.imageUrl || null;
                          const nombre = att.nombre || fullProd?.titulo || fullProd?.nombre || 'Producto';
                          const precio = att.precio ?? fullProd?.precio ?? null;
                          const precioOrig = fullProd?.precioOriginal ?? null;
                          const descripcion = fullProd?.descripcion || null;
                          const stock = fullProd?.stock ?? null;
                          attContent = (
                            <button onClick={() => { if (fullProd) { setProductoEditing(fullProd); setProductoShowForm(true); setScreen('productos'); } }}
                              className="w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 active:opacity-60 bg-surface-card border-slate-100 dark:border-white/10 shadow-sm">
                              <div className="aspect-square w-full bg-surface-card-2 dark:bg-white/8 flex items-center justify-center overflow-hidden">
                                {foto ? <img src={foto} alt={nombre} loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <ShoppingBag className="w-10 h-10 text-ink-dim dark:text-ink-dim" />}
                              </div>
                              <div className="px-3 py-2.5">
                                <p className="text-[10px] font-bold text-emerald-600 mb-0.5">Producto</p>
                                <p className="text-sm font-bold line-clamp-2 text-ink dark:text-ink-dim">{nombre}</p>
                                {descripcion && <p className="text-[11px] text-ink-dim line-clamp-1 mt-0.5">{descripcion}</p>}
                                <div className="flex items-center gap-2 mt-1.5">
                                  {precio != null && <span className="text-sm font-black text-brand-dark dark:text-brand">${Number(precio).toLocaleString('es')}</span>}
                                  {precioOrig && precio && Number(precioOrig) > Number(precio) && <span className="text-xs text-ink-dim line-through">${Number(precioOrig).toLocaleString('es')}</span>}
                                  {stock != null && <span className="text-[10px] text-ink-dim ml-auto">Stock: {stock}</span>}
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
                              className="block w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 bg-surface-card border-slate-100 dark:border-white/10 shadow-sm">
                              <div className="h-28 bg-gradient-to-br from-surface-card-2 to-surface-card-2 dark:from-surface-card-2 dark:to-surface-card-2 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 20px,#a3a3a3 20px,#a3a3a3 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,#a3a3a3 20px,#a3a3a3 21px)' }} />
                                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white/40 relative bg-surface-card-2 dark:bg-surface-card-2 flex items-center justify-center">
                                  {storeFoto
                                    ? <img src={storeFoto} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                                    : <MapPin className="w-5 h-5 text-ink-dim" />}
                                </div>
                              </div>
                              <div className="px-3 py-2.5">
                                <p className="text-[10px] text-ink-dim font-bold mb-0.5 flex items-center gap-1">Ubicación <ExternalLink className="w-2.5 h-2.5" /></p>
                                {att.nombre && <p className="text-xs font-semibold truncate">{att.nombre}</p>}
                                {att.direccion && <p className="text-[11px] text-ink-dim truncate">{att.direccion}{att.ciudad ? `, ${att.ciudad}` : ''}</p>}
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
                              <div className="bg-surface-card px-3 py-2 flex items-center justify-between">
                                <p className="text-[11px] text-ink-dim">{att.telefono || 'Ver contacto'}</p>
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
                              <div className="bg-surface-card px-3 py-2 flex items-center justify-between">
                                <p className="text-[11px] text-ink-dim truncate">{att.url?.replace(/^https?:\/\//, '')}</p>
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
                              <div className="bg-surface-card px-3 py-2.5 flex flex-col gap-1">
                                {rows.length > 0 ? rows.map((r, i) => (
                                  <div key={i} className="flex justify-between gap-2 text-[11px]">
                                    <span className="text-ink-dim capitalize">{r.label}</span>
                                    {r.value && <span className="font-semibold text-ink dark:text-ink-dim shrink-0">{r.value}</span>}
                                  </div>
                                )) : (
                                  <p className="text-[11px] text-ink-dim">Sin horarios configurados</p>
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
                                className="w-7 h-7 rounded-xl flex items-center justify-center bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:text-rose-500 transition-colors"
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
                          const foto = att.foto || fullProd?.fotos?.[0] || fullProd?.foto || fullProd?.imageUrl || null;
                          const nombre = att.nombre || fullProd?.titulo || fullProd?.nombre || 'Producto';
                          const precio = att.precio ?? fullProd?.precio ?? null;
                          const precioOrig = fullProd?.precioOriginal ?? null;
                          const descripcion = fullProd?.descripcion || null;
                          const stock = fullProd?.stock ?? null;
                          return (
                            <button onClick={() => { if (fullProd) { setProductoEditing(fullProd); setProductoShowForm(true); setScreen('productos'); } }}
                              className="w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 active:opacity-60 bg-surface-card border-slate-100 dark:border-white/10 shadow-sm">
                              <div className="aspect-square w-full bg-surface-card-2 dark:bg-white/8 flex items-center justify-center overflow-hidden">
                                {foto ? <img src={foto} alt={nombre} loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <ShoppingBag className="w-10 h-10 text-ink-dim dark:text-ink-dim" />}
                              </div>
                              <div className="px-3 py-2.5">
                                <p className="text-[10px] font-bold text-emerald-600 mb-0.5">Producto</p>
                                <p className="text-sm font-bold line-clamp-2 text-ink dark:text-ink-dim">{nombre}</p>
                                {descripcion && <p className="text-[11px] text-ink-dim line-clamp-1 mt-0.5">{descripcion}</p>}
                                <div className="flex items-center gap-2 mt-1.5">
                                  {precio != null && <span className="text-sm font-black text-brand-dark dark:text-brand">${Number(precio).toLocaleString('es')}</span>}
                                  {precioOrig && precio && Number(precioOrig) > Number(precio) && <span className="text-xs text-ink-dim line-through">${Number(precioOrig).toLocaleString('es')}</span>}
                                  {stock != null && <span className="text-[10px] text-ink-dim ml-auto">Stock: {stock}</span>}
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
                              className="block w-52 rounded-2xl border overflow-hidden text-left transition-opacity hover:opacity-80 bg-surface-card border-slate-100 dark:border-white/10 shadow-sm">
                              <div className="h-28 bg-gradient-to-br from-surface-card-2 to-surface-card-2 dark:from-surface-card-2 dark:to-surface-card-2 flex items-center justify-center relative overflow-hidden">
                                <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 20px,#a3a3a3 20px,#a3a3a3 21px),repeating-linear-gradient(90deg,transparent,transparent 20px,#a3a3a3 20px,#a3a3a3 21px)' }} />
                                <div className="w-12 h-12 rounded-2xl overflow-hidden shadow-xl ring-4 ring-white/40 relative bg-surface-card-2 dark:bg-surface-card-2 flex items-center justify-center">
                                  {storeFoto ? <img src={storeFoto} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" /> : <MapPin className="w-5 h-5 text-ink-dim" />}
                                </div>
                              </div>
                              <div className="px-3 py-2.5">
                                <p className="text-[10px] text-ink-dim font-bold mb-0.5 flex items-center gap-1">Ubicación <ExternalLink className="w-2.5 h-2.5" /></p>
                                {att.nombre && <p className="text-xs font-semibold truncate">{att.nombre}</p>}
                                {att.direccion && <p className="text-[11px] text-ink-dim truncate">{att.direccion}{att.ciudad ? `, ${att.ciudad}` : ''}</p>}
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
                              <div className="bg-surface-card px-3 py-2 flex items-center justify-between">
                                <p className="text-[11px] text-ink-dim">{att.telefono || 'Ver contacto'}</p>
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
                            <div className="bg-surface-card px-3 py-2 flex items-center justify-between">
                              <p className="text-[11px] text-ink-dim truncate">{att.url?.replace(/^https?:\/\//, '')}</p>
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
                              <div className="bg-surface-card px-3 py-2.5 flex flex-col gap-1">
                                {rows.length > 0 ? rows.map((r, i) => (
                                  <div key={i} className="flex justify-between gap-2 text-[11px]">
                                    <span className="text-ink-dim capitalize">{r.label}</span>
                                    {r.value && <span className="font-semibold text-ink dark:text-ink-dim shrink-0">{r.value}</span>}
                                  </div>
                                )) : (
                                  <p className="text-[11px] text-ink-dim">Sin horarios configurados</p>
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
                                  className="w-7 h-7 rounded-xl flex items-center justify-center bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:text-brand transition-colors"
                                  title="Editar">
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button onClick={() => { setConfirmDeleteMsg({ key: msgKey, doDelete }); setSwipedMsgId(null); }}
                                  className="w-7 h-7 rounded-xl flex items-center justify-center bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:text-rose-500 transition-colors"
                                  aria-label="Borrar mensaje" title="Borrar">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}

                            <div {...longPressHandlers}
                              className={`rounded-2xl px-4 py-2.5 select-none
                                ${isStore ? 'bg-brand text-white' : 'bg-surface-card shadow-sm text-ink dark:text-ink-dim'}
                                ${isEditing ? 'ring-2 ring-brand/50 ring-offset-1' : ''}`}>
                              <p className="text-sm">{msg.text}</p>
                            </div>
                          </div>
                          </>
                        );
                      })()}
                      <div className={`flex items-center gap-1 px-1 ${isStore ? 'justify-end' : 'justify-start'}`}>
                        <p className="text-[10px] text-ink-dim">{fmtTime(msg.ts)}</p>
                        {isStore && (
                          <span className="text-[10px] text-ink-dim">
                            {msg.seen ? (
                              <svg viewBox="0 0 16 11" className="w-4 h-2.5 fill-brand inline" xmlns="http://www.w3.org/2000/svg">
                                <path d="M11.071.336a1 1 0 0 1 1.415 1.415l-6.364 6.364a1 1 0 0 1-1.415 0L1.293 4.7a1 1 0 1 1 1.414-1.414l2.707 2.707L11.07.336z"/>
                                <path d="M15.071.336a1 1 0 0 1 1.415 1.415L10.122 8.115a1 1 0 0 1-1.415 0" opacity=".5"/>
                              </svg>
                            ) : (
                              <svg viewBox="0 0 16 11" className="w-4 h-2.5 fill-ink-dim inline" xmlns="http://www.w3.org/2000/svg">
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
                <div className="flex items-center gap-1 bg-surface-card rounded-2xl px-3 py-2 shadow-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-dim animate-bounce [animation-delay:0ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-dim animate-bounce [animation-delay:150ms]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-ink-dim animate-bounce [animation-delay:300ms]" />
                </div>
                <p className="text-[10px] text-ink-dim">Escribiendo...</p>
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
                desc: td?.slug ? `${window.location.host}/${td.slug}` : 'Sin slug configurado',
                color: 'text-brand',
                bg: 'bg-violet-50 dark:bg-violet-900/20',
                disabled: !td?.slug,
                build: () => ({ type: 'tienda-publica', slug: td?.slug, nombre: td?.nombre, url: `${window.location.origin}/${td?.slug}` }),
              },
            ];

            // Opciones de productos/ofertas (hasta 20 más recientes) — tolera
            // ambos modelos de datos: catálogo (titulo/precio/fotos[]) y
            // ofertas (nombre/imageUrl), según qué módulo tenga activo la tienda.
            const prodOpts = (misProductos || []).slice(0, 20).map(p => ({
              id: `prod-${p.id}`,
              icon: ShoppingBag,
              label: p.titulo || p.nombre || 'Producto',
              desc: p.precio ? `$${Number(p.precio).toLocaleString('es')}` : 'Sin precio',
              color: 'text-emerald-600',
              bg: 'bg-emerald-50 dark:bg-emerald-900/20',
              build: () => ({ type: 'producto', productoId: String(p.id), nombre: p.titulo || p.nombre, precio: p.precio, foto: p.fotos?.[0] || p.imageUrl || null }),
            }));

            const allOpts = [...ATTACH_OPTS, ...prodOpts];
            const selectedOpt = chatAttachment ? allOpts.find(o => {
              if (chatAttachment.type === 'producto') return o.id === `prod-${chatAttachment.productoId}`;
              return o.id === chatAttachment.type;
            }) : null;

            return (
              <div className="shrink-0 border-t border-slate-100 dark:border-white/8 bg-surface-card" style={{ paddingBottom: 'max(0rem, env(safe-area-inset-bottom))' }}>
                {/* Panel adjuntos */}
                {attachOpen && (
                  <div className="border-b border-slate-100 dark:border-white/8 px-3 py-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-2">Adjuntar</p>
                    {/* Opciones de tienda — fila única, ancho fraccionado */}
                    <div className="flex gap-1.5 mb-2">
                      {ATTACH_OPTS.map(opt => {
                        const isOn = chatAttachment?.type === opt.id;
                        return (
                          <button key={opt.id} disabled={opt.disabled}
                            onClick={() => setChatAttachment(isOn ? null : opt.build())}
                            className={`flex-1 flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl border transition-colors disabled:opacity-40 ${isOn ? `border-transparent ${opt.bg}` : 'border-slate-200 dark:border-white/8 bg-surface-card-2 dark:bg-white/4'}`}>
                            <opt.icon className={`w-4 h-4 ${isOn ? opt.color : 'text-ink-dim'}`} />
                            <p className={`text-[10px] font-bold text-center leading-tight ${isOn ? opt.color : 'text-ink-dim dark:text-ink-dim'}`}>{opt.label}</p>
                          </button>
                        );
                      })}
                    </div>
                    {/* Productos */}
                    {prodOpts.length > 0 && (
                      <>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-ink-dim mb-1.5">Mis productos</p>
                        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {prodOpts.map(opt => {
                            const isOn = chatAttachment?.type === 'producto' && String(chatAttachment.productoId) === opt.id.replace('prod-', '');
                            return (
                              <button key={opt.id}
                                onClick={() => setChatAttachment(isOn ? null : opt.build())}
                                className={`shrink-0 flex flex-col items-center gap-1 px-3 py-2 rounded-xl border transition-colors min-w-[80px] ${isOn ? `border-transparent ${opt.bg}` : 'border-slate-200 dark:border-white/8 bg-surface-card-2 dark:bg-white/4'}`}>
                                <ShoppingBag className={`w-4 h-4 ${isOn ? opt.color : 'text-ink-dim'}`} />
                                <p className={`text-[10px] font-bold text-center leading-tight line-clamp-2 ${isOn ? opt.color : 'text-ink-dim dark:text-ink-dim'}`}>{opt.label}</p>
                                <p className={`text-[9px] ${isOn ? 'text-emerald-500' : 'text-ink-dim'}`}>{opt.desc}</p>
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
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${selectedOpt?.bg || 'bg-surface-card-2 dark:bg-white/8'} ${selectedOpt?.color || 'text-ink-dim'}`}>
                      {selectedOpt && <selectedOpt.icon className="w-3 h-3" />}
                      <span>{selectedOpt?.label || 'Adjunto'}</span>
                    </div>
                    <button onClick={() => setChatAttachment(null)} className="text-ink-dim hover:text-ink-dim transition-colors">
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
                      className="w-6 h-6 rounded-xl flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim shrink-0 transition-colors">
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
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-ink/80 text-white flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 items-end px-3 pt-2 pb-2">
                  <input ref={chatImageInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setChatImagePreview(ev.target.result); r.readAsDataURL(f); e.target.value = ''; }} />
                  <button onClick={() => chatImageInputRef.current?.click()}
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${chatImagePreview ? 'bg-brand/10 text-brand' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:text-ink-dim'}`}>
                    <Camera className="w-4 h-4" />
                  </button>
                  <button onClick={() => setAttachOpen(v => !v)}
                    className={`relative w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${attachOpen || chatAttachment ? 'bg-brand/10 text-brand' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:text-ink-dim'}`}>
                    <Paperclip className="w-4 h-4" />
                    {chatAttachment && (
                      <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-brand text-white text-[8px] font-bold flex items-center justify-center">1</span>
                    )}
                  </button>
                  <div className="flex-1 bg-surface-card-2 dark:bg-white/8 rounded-2xl px-4 py-2.5 min-h-[40px] flex items-center">
                    <textarea value={inboxReply} onChange={e => { setInboxReply(e.target.value); setStoreTyping(true); clearTimeout(window._storeTypingTimer); window._storeTypingTimer = setTimeout(() => setStoreTyping(false), 2000); }}
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); inboxSendReply(); setStoreTyping(false); } }}
                      placeholder="Escribí tu respuesta..."
                      rows={1}
                      className="bg-transparent text-sm text-ink dark:text-ink-dim placeholder:text-ink-dim focus:outline-none w-full resize-none" />
                  </div>
                  <button onClick={inboxSendReply} disabled={(!inboxReply.trim() && !chatAttachment) || inboxSending}
                    className="w-10 h-10 bg-brand hover:bg-brand-dark rounded-xl flex items-center justify-center disabled:opacity-40 transition-colors shrink-0">
                    {inboxSending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
                  </button>
                </div>
                {/* Barra sutil archivar */}
                <button onClick={() => toggleClose(selectedThread.key)}
                  className="w-full flex items-center justify-center gap-1.5 pt-0 pb-2 text-[11px] font-semibold text-ink-dim dark:text-ink-dim hover:text-ink-dim dark:hover:text-ink-dim transition-colors">
                  <Archive className="w-3 h-3" />
                  Archivar conversación
                </button>
              </div>
            );
          })()}
          {selectedThread?.closed && (
            <div className="shrink-0 border-t border-slate-100 dark:border-white/8 bg-surface-card px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-ink-dim">
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
        <div className="w-64 xl:w-72 border-l border-slate-100 dark:border-white/8 flex flex-col bg-surface-card overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-slate-100 dark:border-white/8 shrink-0 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-dim">Info del cliente</p>
            <button onClick={() => setInboxInfoOpen(false)} className="ui-icon-btn text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-4">
            {/* Avatar + nombre */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <div className={`w-16 h-16 rounded-2xl ${uid ? avatarColor(uid) : 'bg-surface-card-2'} flex items-center justify-center font-black text-xl text-white shadow-sm`}>
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
              <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 flex items-center gap-2.5">
                <Hash className="w-3.5 h-3.5 text-ink-dim shrink-0" />
                <div className="min-w-0">
                  <p className="text-[10px] text-ink-dim font-medium">ID de usuario</p>
                  <p className="text-xs font-mono font-semibold text-ink dark:text-ink-dim truncate">{uid}</p>
                </div>
              </div>
            )}

            {/* Contexto del hilo */}
            {selectedThread.subtitle && (
              <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 flex items-start gap-2.5">
                <MessageCircle className="w-3.5 h-3.5 text-ink-dim shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <p className="text-[10px] text-ink-dim font-medium">Contexto</p>
                  <p className="text-xs font-semibold text-ink dark:text-ink-dim line-clamp-2">{selectedThread.subtitle}</p>
                </div>
              </div>
            )}

            {/* Stats mensajes */}
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 text-center">
                <p className="text-lg font-black text-ink dark:text-ink-dim">{msgCount}</p>
                <p className="text-[10px] text-ink-dim font-medium">mensajes</p>
              </div>
              <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 text-center">
                <p className="text-lg font-black text-ink dark:text-ink-dim">{selectedThread.unread || 0}</p>
                <p className="text-[10px] text-ink-dim font-medium">sin leer</p>
              </div>
            </div>

            {/* Fechas */}
            {(firstMsg || lastMsg) && (
              <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
                  <CalendarClock className="w-3.5 h-3.5 text-ink-dim shrink-0" />
                  <p className="text-[10px] text-ink-dim font-medium">Actividad</p>
                </div>
                {firstMsg?.ts && (
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-ink-dim">Primer mensaje</p>
                    <p className="text-[10px] font-semibold text-ink-dim">{fmtTime(firstMsg.ts)}</p>
                  </div>
                )}
                {lastMsg?.ts && (
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-ink-dim">Último mensaje</p>
                    <p className="text-[10px] font-semibold text-ink-dim">{fmtTime(lastMsg.ts)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Estado */}
            <div className={`rounded-2xl px-3 py-2.5 flex items-center gap-2 ${selectedThread.closed ? 'bg-surface-card-2 dark:bg-white/5' : 'bg-ok/8 dark:bg-ok/10'}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${selectedThread.closed ? 'bg-ink-dim' : 'bg-ok'}`} />
              <p className={`text-xs font-bold ${selectedThread.closed ? 'text-ink-dim' : 'text-ok-dark dark:text-ok'}`}>
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
          <div className="relative bg-surface-card rounded-t-3xl p-5 flex flex-col gap-4 max-h-[80vh] overflow-y-auto no-scrollbar animate-fade-in"
            onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-surface-card-2 dark:bg-white/15 mx-auto mb-1" />
            <div className="flex items-center justify-between">
              <p className="font-bold">Info del cliente</p>
              <button onClick={() => setInboxInfoOpen(false)} className="ui-icon-btn text-ink-dim"><X className="w-4 h-4" /></button>
            </div>

            <div className="flex items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl ${uid ? avatarColor(uid) : 'bg-surface-card-2'} flex items-center justify-center font-black text-lg text-white`}>
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
              <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5 flex items-center gap-2.5">
                <Hash className="w-3.5 h-3.5 text-ink-dim shrink-0" />
                <div>
                  <p className="text-[10px] text-ink-dim font-medium">ID de usuario</p>
                  <p className="text-xs font-mono font-semibold text-ink dark:text-ink-dim">{uid}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-xl font-black text-ink dark:text-ink-dim">{msgCount}</p>
                <p className="text-[10px] text-ink-dim font-medium">mensajes</p>
              </div>
              <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-3 text-center">
                <p className="text-xl font-black text-ink dark:text-ink-dim">{selectedThread.unread || 0}</p>
                <p className="text-[10px] text-ink-dim font-medium">sin leer</p>
              </div>
            </div>

            {selectedThread.subtitle && (
              <div className="rounded-2xl bg-surface-card-2 dark:bg-white/5 px-3 py-2.5">
                <p className="text-[10px] text-ink-dim font-medium mb-1">Contexto</p>
                <p className="text-sm font-semibold text-ink dark:text-ink-dim">{selectedThread.subtitle}</p>
              </div>
            )}

            <div className={`rounded-2xl px-3 py-2.5 flex items-center gap-2 ${selectedThread.closed ? 'bg-surface-card-2 dark:bg-white/5' : 'bg-ok/8 dark:bg-ok/10'}`}>
              <div className={`w-2 h-2 rounded-full ${selectedThread.closed ? 'bg-ink-dim' : 'bg-ok'}`} />
              <p className={`text-sm font-bold ${selectedThread.closed ? 'text-ink-dim' : 'text-ok-dark dark:text-ok'}`}>
                {selectedThread.closed ? 'Conversación cerrada' : 'Conversación activa'}
              </p>
            </div>
          </div>
        </div>
      );
    };

    return (
      <div className="h-[100dvh] flex flex-col bg-surface-card">
        {/* Header mobile — desktop usa el header interno del ThreadList */}
        <div className="lg:hidden shrink-0">
          <StorePageHeader
            title="Mensajes"
            subtitle={unreadTotal > 0 ? `${unreadTotal} sin leer` : `${allThreads.length} conversación${allThreads.length !== 1 ? 'es' : ''}`}
            actionSlot={
              <button onClick={fetchInbox} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim" title="Actualizar">
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

        {/* Modal confirmar borrado de mensaje — mismo patrón que
            productos/ofertas, único punto donde faltaba (antes borraba
            directo con un solo tap). */}
        {confirmDeleteMsg && (
          <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4" onClick={() => setConfirmDeleteMsg(null)}>
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
            <div className="relative bg-surface-card rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-6 h-6 text-rose-500" />
              </div>
              <h3 className="font-black text-lg text-center mb-1">¿Borrar mensaje?</h3>
              <p className="text-sm text-ink-dim text-center mb-6">Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDeleteMsg(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors">Cancelar</button>
                <button onClick={() => { confirmDeleteMsg.doDelete(); setConfirmDeleteMsg(null); }} className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors">Borrar</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // ── Inicio (vista marketplace read-only) ──────────────────────────────────
  const myStoreId = String(tienda?.id || tiendaData?.id || '');

  const inicioNavigate = (dest) => {
    if (dest === 'product-detail') setInicioSubScreen('producto');
    else if (dest === 'tienda-detail') setInicioSubScreen('tienda');
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
      allCategories,
      firebaseUser,
      navigate: inicioNavigate,
      goBack: inicioGoBack,
      setSelectedProduct: setInicioSelectedProduct,
      setSelectedTienda: setInicioSelectedTienda,
      openChat: () => {},          // noop: tienda no chatea con otras tiendas desde acá
      openNotifications: () => {},
      unreadCount: 0,
    };

    return (
      <div className="min-h-screen sa-page-bg pb-24 lg:pb-8">
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
            addRecentSearch={addRecentSearch}
            recentSearches={recentSearches}
            clearRecentSearches={() => setRecentSearches([])}
            navigateSearch={() => {}}
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
      setCheckoutLoading(plan);
      setCheckoutError(null);
      try {
        const res = await apiFetch(`${API_BASE}/mp-checkout`, {
          method: 'POST',
          authRequired: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan, tiendaId: tiendaData?.id }),
        });
        const data = await res.json();
        if (!res.ok || !data.initPoint) throw new Error(data.error || 'No pudimos iniciar el pago. Probá de nuevo.');
        window.location.href = data.initPoint;
      } catch (err) {
        setCheckoutError(err.message);
        setCheckoutLoading(null);
      }
    };

    return (
      <div className="h-[100dvh] flex flex-col sa-page-bg">
        <StorePageHeader title="Suscripción" subtitle="Gestioná tu plan y facturación" onBack={() => setScreen('perfil')} />
        <div className="flex-1 overflow-y-auto no-scrollbar">
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
          checkoutError={checkoutError}
          renovando={renovando}
          onPagar={handlePagarMP}
          onTransferencia={(plan) => { setTransferenciaPlan(plan); setShowTransferenciaModal(true); }}
          setShowPremiumModal={setShowPremiumModal}
        />
        </div>
      </div>
    );
  };

  // ── Estadisticas ───────────────────────────────────────────────────────────
  const TEMPLATE_INFO = TEMPLATES_META;
  const PRESET_COLORS = ['#e4002b','#f97316','#6366f1','#f59e0b','#10b981','#8b5cf6','#ec4899','#14b8a6'];

  // Componente separado para respetar Rules of Hooks
  const EditorPanel = ({ hasSlug, slug, previewUrl, paginaForm, setPaginaForm, publicPageForm, setPublicPageForm, savePagina, tienda, setPaginaSaved, hideUrl = false }) => {
    const toggle = (id) => setOpenEditorPanel(v => v === id ? null : id);

    const AccordionHeader = ({ id, label, summary }) => (
      <button onClick={() => toggle(id)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-card-2 dark:hover:bg-white/4 transition-colors">
        <div className="text-left">
          <p className="text-sm font-bold">{label}</p>
          {summary && <p className="text-xs text-ink-dim mt-0.5">{summary}</p>}
        </div>
        <ChevronDown className={`w-4 h-4 text-ink-dim transition-transform duration-200 ${openEditorPanel === id ? 'rotate-180' : ''}`} />
      </button>
    );

    const TemplateThumbnail = ({ id }) => {
      const sel = paginaForm.template === id;
      const c = sel ? paginaForm.color : '#a3a3a3';
      if (id === 'commerce-modern') return (
        <svg viewBox="0 0 60 80" fill="none" className="w-full h-full">
          <rect width="60" height="80" rx="4" fill={sel ? `${c}18` : '#f0f0f0'} />
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
          <rect width="60" height="80" rx="4" fill={sel ? `${c}18` : '#f0f0f0'} />
          <rect x="4" y="4" width="52" height="20" rx="3" fill={c} opacity="0.7" />
          <rect x="4" y="28" width="25" height="22" rx="2" fill={c} opacity="0.25" />
          <rect x="31" y="28" width="25" height="22" rx="2" fill={c} opacity="0.25" />
          <rect x="4" y="53" width="25" height="22" rx="2" fill={c} opacity="0.15" />
          <rect x="31" y="53" width="25" height="22" rx="2" fill={c} opacity="0.15" />
        </svg>
      );
      if (id === 'magazine') return (
        <svg viewBox="0 0 60 80" fill="none" className="w-full h-full">
          <rect width="60" height="80" rx="4" fill={sel ? `${c}18` : '#f0f0f0'} />
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
          <rect width="60" height="80" rx="4" fill={sel ? `${c}18` : '#f0f0f0'} />
          <rect width="60" height="24" rx="4" fill={c} opacity="0.7" />
          <rect x="6" y="16" width="16" height="16" rx="4" fill={sel ? paginaForm.color : '#fff'} stroke={sel ? `${c}60` : '#e5e5e5'} strokeWidth="1.5" />
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
          <rect width="60" height="80" rx="4" fill={sel ? `${c}18` : '#f0f0f0'} />
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
          <rect width="60" height="80" rx="4" fill="#080808" />
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
          <rect width="60" height="80" rx="4" fill="#080808" />
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
          <rect width="60" height="80" rx="4" fill={sel ? `${c}10` : '#f5f5f5'} />
          {/* header sticky */}
          <rect width="60" height="9" rx="4" fill={sel ? `${c}15` : '#f0f0f0'} />
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
      <div className="w-full lg:w-80 flex-shrink-0 h-full overflow-y-auto no-scrollbar flex flex-col divide-y divide-slate-100 dark:divide-white/8">

        {/* URL — solo en desktop */}
        {!hideUrl && !hasSlug ? (
          <div className="p-4 bg-amber-50 dark:bg-amber-500/10">
            <p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-2">Primero elegí tu URL</p>
            <div className="flex items-stretch gap-1.5 p-1.5 rounded-2xl border-2 border-amber-200 dark:border-amber-500/30 focus-within:border-brand transition-colors bg-white dark:bg-white/5">
              <span className="flex items-center gap-1.5 pl-3 pr-3 py-2.5 rounded-xl bg-brand/10 dark:bg-brand/15 text-brand text-xs font-bold whitespace-nowrap" style={{ fontFamily: "'Menlo','Monaco','Courier New',monospace" }}>
                <Link2 className="w-3 h-3 shrink-0" />
                {window.location.host}/
              </span>
              <input
                value={publicPageForm.slug}
                onChange={e => setPublicPageForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                onKeyDown={e => e.key === 'Enter' && publicPageForm.slug.trim() && savePagina()}
                placeholder="mi-tienda"
                autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false}
                className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none"
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
              {window.location.host}/{slug}
            </a>
            <button onClick={() => { const url = `${window.location.origin}/${slug}`; if (navigator.share) { navigator.share({ title: tienda?.nombre || '', url }); } else { navigator.clipboard.writeText(url).then(() => { setPaginaSaved(true); setTimeout(() => setPaginaSaved(false), 2000); }); } }}
              className="text-xs font-semibold bg-surface-card-2 dark:bg-white/8 px-2.5 py-1.5 rounded-lg shrink-0">
              Compartir
            </button>
          </div>
        ) : null}

        {/* Selector de plantilla sacado: hoy existe un solo template real
            (commerce-modern.jsx) — mostrar un selector de "elegí entre 1
            opción" no aporta nada. Si se suman templates de verdad, este
            accordion vuelve (usa TEMPLATE_INFO/TemplateThumbnail, ya
            preparados para eso). */}

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
                <span className="text-sm font-mono text-ink-dim flex-1">{paginaForm.color}</span>
                <button onClick={() => setPaginaForm(f => ({ ...f, modoOscuro: !f.modoOscuro }))}
                  title={paginaForm.modoOscuro ? 'Modo oscuro activo' : 'Modo claro'}
                  className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${paginaForm.modoOscuro ? 'bg-ink-dim' : 'bg-surface-card-2 dark:bg-white/15'}`}>
                  <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform text-[8px] flex items-center justify-center ${paginaForm.modoOscuro ? 'translate-x-5' : 'translate-x-0'}`}>
                    {paginaForm.modoOscuro ? '🌙' : '☀️'}
                  </span>
                </button>
              </div>

              {/* Color secundario — opcional, default amarillo LOKAL (#FFC530) si no se personaliza */}
              <div className="border-t border-slate-100 dark:border-white/8 pt-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-ink-dim">Color secundario (opcional)</span>
                  <button
                    onClick={() => setPaginaForm(f => ({ ...f, colorSecundario: f.colorSecundario ? null : '#FFC530' }))}
                    className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors ${paginaForm.colorSecundario ? 'bg-brand' : 'bg-surface-card-2 dark:bg-white/15'}`}>
                    <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${paginaForm.colorSecundario ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
                {paginaForm.colorSecundario ? (
                  <div className="flex items-center gap-3">
                    <input type="color" value={paginaForm.colorSecundario}
                      onChange={e => setPaginaForm(f => ({ ...f, colorSecundario: e.target.value }))}
                      className="w-9 h-9 rounded-lg border border-slate-200 dark:border-white/10 cursor-pointer bg-transparent p-0.5" />
                    <span className="text-sm font-mono text-ink-dim flex-1">{paginaForm.colorSecundario}</span>
                  </div>
                ) : (
                  <p className="text-xs text-ink-dim">Sin personalizar: usa el amarillo de LOKAL (#FFC530).</p>
                )}
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
                  className={`flex items-center gap-2 px-2 py-2.5 rounded-xl transition-all ${activa ? 'bg-surface-card-2 dark:bg-white/5' : 'opacity-45'}`}>
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button onClick={() => moverSeccion(key, 'up')} disabled={i === 0}
                      className="w-5 h-4 rounded flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/10 text-ink-dim dark:text-ink-dim disabled:opacity-20 transition-colors text-[9px] leading-none">▲</button>
                    <button onClick={() => moverSeccion(key, 'down')} disabled={i === seccionesOrdenadas.length - 1}
                      className="w-5 h-4 rounded flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/10 text-ink-dim dark:text-ink-dim disabled:opacity-20 transition-colors text-[9px] leading-none">▼</button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-none">{def.label}</p>
                    <p className="text-xs text-ink-dim mt-0.5 truncate">{def.desc}</p>
                  </div>
                  <button onClick={() => toggleSeccion(key, def, activa)}
                    className={`w-10 h-5 rounded-full flex items-center px-0.5 transition-colors shrink-0 ${activa ? 'bg-brand' : 'bg-surface-card-2 dark:bg-white/15'}`}>
                    <span className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${activa ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>
              ))}
              <p className="text-xs text-ink-dim pt-1 px-2">Guardá para aplicar los cambios</p>
            </div>
          )}
        </div>

      </div>
    );
  };

  const MiPaginaScreen = () => {
    const slug = tienda?.slug || tiendaData?.slug || publicPageForm.slug || '';
    const previewUrl = slug ? `/${slug}` : null;
    const hasSlug = !!slug;
    const storeId = tienda?.id || tiendaData?.id;

    return (
      <div className="fixed inset-0 sa-page-bg flex flex-col z-[5000] lg:relative lg:inset-auto lg:z-auto lg:min-h-screen">
        {/* Header */}
        <div className="bg-surface-card border-b border-slate-100 dark:border-white/8 px-4 py-3 flex items-center gap-3 shrink-0">
          <button onClick={() => setScreen('perfil')} className="w-9 h-9 rounded-xl hover:bg-surface-card-2 dark:hover:bg-white/8 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="font-bold text-base leading-none">Diseño de mi página</h1>
            {paginaSaved
              ? <p className="text-xs text-emerald-500 font-semibold mt-0.5">¡Guardado!</p>
              : paginaError
              ? <p className="text-xs text-rose-500 mt-0.5 truncate">{paginaError}</p>
              : <p className="text-xs text-ink-dim mt-0.5">{hasSlug ? 'Guardá para ver los cambios en la preview' : 'Primero elegí una URL'}</p>
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
          <div className="absolute inset-0 flex items-start justify-center bg-surface-card-2 dark:bg-surface-card-2 overflow-hidden" style={{ paddingTop: 8, paddingLeft: 8, paddingRight: 8 }}>
            {/* frameW = 100% del área - 16px márgenes. El contenido interno = frameW - 16px borde */}
            <div style={{ width: '100%', maxWidth: 480, flexShrink: 0 }}>
              <div style={{ width: '100%', borderRadius: 32, border: '8px solid #262626', background: '#18181b', boxShadow: '0 16px 48px rgba(0,0,0,.5), inset 0 0 0 1px rgba(255,255,255,.06)', overflow: 'hidden' }}>
                {/* Notch */}
                <div style={{ height: 22, background: '#262626', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 3 }}>
                  <div style={{ width: 56, height: 8, borderRadius: 6, background: '#18181b' }} />
                </div>
                {/* Contenido: alto fijo para que el sheet tape el resto */}
                <div style={{ height: 'calc(100dvh - 56px - 52px - 38px)', background: paginaForm.modoOscuro ? '#080808' : '#f5f5f5', overflowY: 'auto', overflowX: 'hidden', position: 'relative', WebkitOverflowScrolling: 'touch' }}>
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
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: '#6b6b6b' }}>
                      <Store style={{ width: 28, height: 28, opacity: .3 }} />
                      <p style={{ fontSize: 12, fontWeight: 600 }}>Cargando...</p>
                    </div>
                  )}
                </div>
                {/* Chin */}
                <div style={{ height: 16, background: '#262626', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: 48, height: 3, borderRadius: 3, background: 'rgba(255,255,255,.2)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bottom sheet — handle arriba, contenido scrolleable */}
          <div
            className="absolute bottom-0 left-0 right-0 flex flex-col transition-all duration-300 ease-out bg-surface-card shadow-2xl"
            style={{ maxHeight: editorSheetOpen ? '75%' : '52px', height: editorSheetOpen ? 'auto' : '52px', overflow: 'hidden' }}
          >
            {/* Handle / drag bar */}
            <button
              onClick={() => setEditorSheetOpen(v => !v)}
              className="w-full flex flex-col items-center justify-center gap-1 py-3 shrink-0 border-t border-slate-200 dark:border-white/10"
            >
              <div className="w-10 h-1 rounded-full bg-ink-dim/40 dark:bg-white/20" />
              <p className="text-xs font-bold text-ink-dim">
                {editorSheetOpen ? 'Ocultar editor' : 'Editar página'}
              </p>
            </button>
            {/* Contenido scrolleable */}
            <div className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100 dark:divide-white/8">
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

          <div className="flex flex-1 items-center justify-center overflow-hidden bg-surface-card-2 dark:bg-surface-card-2/50">
            <div style={{ width: 320, flexShrink: 0 }}>
              <div style={{ width: 320, borderRadius: 42, border: '10px solid #262626', background: '#18181b', boxShadow: '0 30px 80px rgba(0,0,0,.4), inset 0 0 0 1px rgba(255,255,255,.05)', overflow: 'hidden' }}>
                <div style={{ height: 28, background: '#262626', display: 'flex', justifyContent: 'center', alignItems: 'flex-end', paddingBottom: 4 }}>
                  <div style={{ width: 80, height: 10, borderRadius: 8, background: '#18181b' }} />
                </div>
                <div style={{ height: 580, background: paginaForm.modoOscuro ? '#18181b' : '#f5f5f5', position: 'relative', overflowY: 'auto' }}>
                  {tienda ? (
                    <div key={previewKey} style={{ transformOrigin: 'top left', transform: 'scale(0.55)', width: '182%', pointerEvents: 'none' }}>
                      <TiendaPublicaRenderer
                        tienda={{ ...tienda, pagina: paginaForm }}
                        paginaOverride={paginaForm}
                        previewMode={true}
                      />
                    </div>
                  ) : (
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 10, color: '#6b6b6b' }}>
                      <Store style={{ width: 32, height: 32, opacity: .3 }} />
                      <p style={{ fontSize: 13, fontWeight: 600 }}>Cargando tienda...</p>
                    </div>
                  )}
                </div>
                <div style={{ height: 20, background: '#262626', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <div style={{ width: 60, height: 4, borderRadius: 4, background: 'rgba(255,255,255,.2)' }} />
                </div>
              </div>
              <p className="text-center text-xs text-ink-dim mt-3">Preview en vivo · escala reducida</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const StatsScreen = () => {
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
      : 'text-ink-dim bg-surface-card-2 dark:bg-white/5 border-slate-200 dark:border-white/10';

    return (
      <div className="min-h-screen sa-page-bg pb-24 lg:pb-8">
        <StorePageHeader title="Estadísticas" subtitle="Rendimiento de tu tienda" icon={TrendingUp} />

        <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
          {/* Cards visitas mock */}
          {mockMode && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Visitas hoy', value: MOCK_STATS.visitasHoy, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Esta semana', value: MOCK_STATS.visitasSemana, color: 'text-brand' },
                { label: 'Este mes', value: MOCK_STATS.visitasMes, color: 'text-violet-600 dark:text-violet-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 p-4 text-center">
                  <p className={`text-2xl font-black ${color}`}>{value.toLocaleString()}</p>
                  <p className="text-xs text-ink-dim mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          )}
          {mockMode && (
            <div className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 p-5">
              <h3 className="font-bold text-sm mb-3">Productos más vistos</h3>
              <div className="space-y-2">
                {MOCK_STATS.productosVistos.map((p, i) => (
                  <div key={p.nombre} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-ink-dim w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold truncate">{p.nombre}</span>
                        <span className="text-xs text-ink-dim shrink-0 ml-2">{p.visitas}</span>
                      </div>
                      <div className="h-1.5 bg-surface-card-2 dark:bg-white/8 rounded-full overflow-hidden">
                        <div className="h-full bg-brand rounded-full" style={{ width: `${Math.round(p.visitas / MOCK_STATS.productosVistos[0].visitas * 100)}%` }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Análisis IA ──────────────────────────────────────────────── */}
          <div className="bg-surface-card rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-brand" /> Análisis IA
                </h3>
                <p className="text-xs text-ink-dim mt-0.5">Guía personalizada basada en tu actividad</p>
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
                <button onClick={() => { setAiData(null); setAiError(null); }} className="text-xs text-ink-dim hover:text-ink-dim">Actualizar</button>
              )}
            </div>

            {aiError && (
              <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-2xl p-4 text-sm text-rose-700 dark:text-rose-400">
                {aiError}
              </div>
            )}

            {!aiData && !aiLoading && !aiError && (
              <div className="text-center py-6 text-ink-dim">
                <Lightbulb className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Presioná "Analizar" para obtener consejos personalizados sobre tu tienda</p>
              </div>
            )}

            {aiLoading && (
              <div className="flex flex-col items-center py-8 gap-3 text-ink-dim">
                <Loader2 className="w-8 h-8 animate-spin text-brand" />
                <p className="text-sm">Analizando tu tienda...</p>
              </div>
            )}

            {aiData && (
              <div className="space-y-4">
                {/* Score + resumen */}
                <div className="flex items-center gap-4 bg-surface-card-2 dark:bg-white/5 rounded-2xl p-4">
                  <div className="w-14 h-14 rounded-2xl bg-brand/15 dark:bg-brand/20 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xl font-black text-brand-dark dark:text-brand">{aiData.insights?.score ?? '—'}</span>
                    <span className="text-[9px] text-ink-dim font-semibold">/ 10</span>
                  </div>
                  <p className="text-sm font-semibold flex-1">{aiData.insights?.resumen}</p>
                </div>

                {/* Consejos */}
                {(aiData.insights?.consejos || []).length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-ink-dim uppercase tracking-wider">Consejos</p>
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
                    <p className="text-xs font-bold text-ink-dim uppercase tracking-wider mb-2">Puntos fuertes</p>
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
        <p className="text-xs font-semibold text-ink-dim mb-2">Rubros de la tienda</p>
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
                    : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/12'
                }`}
              >
                <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                {cat.name.split(' ')[0]}
              </button>
            );
          })}
        </div>

        {selected.length === 0 && (
          <div className="flex items-center gap-2 text-xs text-ink-dim mb-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Sin rubros — los clientes no podrán encontrar tu tienda fácilmente.</span>
          </div>
        )}

        {tooMany && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-2xl text-xs text-amber-700 dark:text-amber-400 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
            <div>
              <strong>Demasiados rubros.</strong> Elegir menos categorías ayuda a que tu tienda aparezca más relevante para los clientes correctos.
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
    const isSingle = mediaModal === 'foto';
    const title = isSingle ? 'Foto de perfil' : 'Portada';
    const subtitle = isSingle
      ? 'Elegí la imagen principal de tu tienda.'
      : 'La primera foto es la que ven al entrar; si subís más de una, se van alternando de fondo.';
    const emptyLabel = isSingle ? 'Sin foto de perfil' : 'Sin imágenes';
    const maxItems = isSingle ? 1 : 6;
    const atLimit = mediaDraft.length + cropQueue.length >= maxItems;

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[6000] flex items-end lg:items-center justify-center" onClick={closeMediaEditor}>
        <div className={`bg-surface-card rounded-t-3xl lg:rounded-3xl w-full ${isSingle ? 'max-w-md' : 'max-w-3xl'} max-h-[90vh] flex flex-col shadow-2xl`} onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <div>
              <h2 className="font-bold text-base">{title}</h2>
              <p className="text-xs text-ink-dim mt-0.5">{subtitle}</p>
            </div>
            <button onClick={closeMediaEditor} className="w-8 h-8 shrink-0 rounded-xl hover:bg-surface-card-2 dark:hover:bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
            <input ref={mediaInputRef} type="file" accept="image/*" multiple={!isSingle} className="hidden" onChange={handleMediaFiles} />

            {/* Contador — solo tiene sentido cuando hay más de 1 posible
                (portada, hasta 6 fotos). En foto de perfil siempre es "1 de
                1": un contador ahí no informa nada, antes se mostraba igual. */}
            {!isSingle && (
              <div className="text-center rounded-2xl border border-slate-200 dark:border-white/10 bg-surface-card-2 dark:bg-white/5 px-4 py-3">
                <p className="text-sm font-semibold">{mediaDraft.length} / {maxItems} imágenes</p>
                <p className="text-xs text-ink-dim mt-0.5">Podés subir nuevas o conservar las ya usadas</p>
              </div>
            )}

            {/* Dropzone real — click en cualquier punto abre el selector de
                archivos, y arrastrar una foto encima la encola (antes era
                puramente decorativo: ni clickeable ni reaccionaba al drag).
                En foto de perfil (isSingle) desaparece apenas hay una foto
                en el draft — antes quedaba visible debajo del preview,
                invitando a "cambiar" cuando en realidad hay que borrar
                primero (con el tacho) para volver a elegir. */}
            {(!isSingle || mediaDraft.length === 0) && (
              <div
                onClick={() => !atLimit && mediaInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); if (!atLimit) setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleMediaDrop}
                className={`rounded-3xl border-2 border-dashed p-8 text-center transition-colors ${atLimit ? 'opacity-50 cursor-not-allowed border-slate-200 dark:border-white/10 text-ink-dim' : 'cursor-pointer text-ink-dim'} ${dragOver && !atLimit ? 'border-brand bg-brand/5 text-brand' : 'border-slate-200 dark:border-white/10'}`}
              >
                <Camera className="w-8 h-8 mx-auto mb-2" />
                <p className="font-semibold text-sm">{emptyLabel}</p>
                <p className="text-xs mt-1">Arrastrá una imagen acá o tocá para elegir</p>
              </div>
            )}

            {mediaDraft.length > 0 && (
              isSingle ? (
                // Foto de perfil: un solo preview cuadrado grande, centrado
                // — reemplaza al dropzone (no conviven los dos a la vez).
                <div className="flex justify-center">
                  {mediaDraft.map((item, index) => (
                    <div key={`${item.url}-${index}`} className="relative w-48 h-48 overflow-hidden bg-surface-card-2 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] group">
                      <img src={item.url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      {/* En mobile no hay hover — el tacho queda siempre
                          visible (semi-transparente); en desktop se revela
                          recién al pasar el mouse. */}
                      <button onClick={() => removeMediaDraftItem(index)} className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/60 text-white flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                // Portada: apiladas UNA ARRIBA DE OTRA, con el aspect-ratio
                // REAL que usa el hero público (16/9) — antes era un grid de
                // cuadrados, que no dejaba ver cómo iba a verse encuadrada
                // cada foto en el banner real.
                <div className="space-y-3">
                  {mediaDraft.map((item, index) => (
                    <div key={`${item.url}-${index}`} className="relative overflow-hidden bg-surface-card-2 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl group">
                      <img src={item.url} alt="" loading="lazy" decoding="async" className="w-full aspect-[16/9] object-cover" />
                      {index === 0 && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white text-[10px] font-bold uppercase tracking-wide">Portada</div>
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/70 to-transparent text-white text-xs font-semibold">
                        {item.existing ? 'Ya usada' : 'Nueva'}
                      </div>
                      <button onClick={() => removeMediaDraftItem(index)} className="absolute top-2 right-2 w-8 h-8 rounded-xl bg-black/60 text-white flex items-center justify-center opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )
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
        {cropQueue[0] && (
          <ImageCropModal
            file={cropQueue[0]}
            shape={isSingle ? 'rounded' : 'rect'}
            aspect={isSingle ? 1 : 16 / 9}
            maxSize={isSingle ? 600 : 1600}
            onConfirm={handleCropConfirm}
            onClose={handleCropSkip}
          />
        )}
      </div>
    );
  };

  const LocationEditorModal = () => {
    if (!locationModal) return null;

    // GPS y click-en-mapa son alternativas COMPLETAS a tipear: además de
    // mover el pin, resuelven ciudad/dirección vía reverse geocoding
    // (mismo proveedor — Nominatim — que ya usa el buscador de arriba), así
    // no dejan esos campos vacíos o desincronizados del pin.
    const applyGeocode = async (lat, lng) => {
      setLocationForm(prev => ({ ...prev, lat, lng }));
      setLocationFlyTo({ lat, lng });
      try {
        const { ciudad, direccion } = await reverseGeocode(lat, lng);
        setLocationForm(prev => ({ ...prev, lat, lng, ciudad: ciudad || prev.ciudad, direccion: direccion || prev.direccion }));
      } catch { /* el pin ya quedó puesto; ciudad/dirección se pueden tipear a mano */ }
    };

    const useMyLocation = () => {
      geo.requestLocation();
    };

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[6000] flex items-end lg:items-center justify-center" onClick={() => setLocationModal(false)}>
        <div className="bg-surface-card rounded-t-3xl lg:rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <div>
              <h2 className="font-bold text-base">Ubicación de la tienda</h2>
              <p className="text-xs text-ink-dim mt-0.5">Usá tu ubicación, tocá el mapa o escribí la dirección.</p>
            </div>
            <button onClick={() => setLocationModal(false)} className="w-8 h-8 rounded-xl hover:bg-surface-card-2 dark:hover:bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
            {/* Acciones de ubicación — misma fila, GPS y mapa como
                alternativas reales a tipear (antes eran dos cajas de
                coordenadas crudas sin acción, solo texto). */}
            <div className="flex items-center gap-2">
              <button
                onClick={useMyLocation}
                disabled={geo.loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 bg-surface-card-2 dark:bg-white/5 hover:bg-brand/10 hover:border-brand/40 hover:text-brand text-sm font-bold text-ink dark:text-ink-dim transition-colors disabled:opacity-60"
              >
                {geo.loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                {geo.loading ? 'Ubicando...' : 'Usar mi ubicación'}
              </button>
              <span className="text-xs text-ink-dim shrink-0 hidden sm:block">o tocá el mapa</span>
            </div>
            {geo.error && <p className="text-xs text-rose-500 font-semibold">No pudimos acceder a tu ubicación — probá tocar el mapa o escribir la dirección.</p>}

            <div className="grid lg:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-ink-dim mb-1 block">Ciudad</label>
                <PlaceAutocomplete
                  id="ciudad" activeId={activeLocationField}
                  onActivate={setActiveLocationField}
                  onDeactivate={(fieldId) => setActiveLocationField(cur => (cur === fieldId ? null : cur))}
                  value={locationForm.ciudad} onChange={(value) => setLocationForm(prev => ({ ...prev, ciudad: value }))} onSelect={({ label }) => setLocationForm(prev => ({ ...prev, ciudad: label }))} placeholder="Buscá tu ciudad" labelParts={2}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ink-dim mb-1 block">Dirección</label>
                <PlaceAutocomplete
                  id="direccion" activeId={activeLocationField} mode="direccion"
                  onActivate={setActiveLocationField}
                  onDeactivate={(fieldId) => setActiveLocationField(cur => (cur === fieldId ? null : cur))}
                  value={locationForm.direccion} onChange={(value) => setLocationForm(prev => ({ ...prev, direccion: value }))} onSelect={({ lat, lng, label }) => applyGeocode(lat, lng).then(() => setLocationForm(prev => ({ ...prev, direccion: label })))} placeholder="Escribí la dirección o referencia" searchSuffix={locationForm.ciudad} labelParts={3}
                />
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-ink-dim mb-2">Mapa</p>
              <MapPicker lat={locationForm.lat} lng={locationForm.lng} flyTo={locationFlyTo} onChange={({ lat, lng }) => applyGeocode(lat, lng)} isDark={isDark} />
              <p className="text-xs text-ink-dim mt-2">{[locationForm.direccion, locationForm.ciudad].filter(Boolean).join(', ') || 'Tocá el mapa, usá tu ubicación o buscá la dirección arriba.'}</p>
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
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[6000] flex items-end lg:items-center justify-center" onClick={() => setHorarioModal(false)}>
        <div className="bg-surface-card rounded-t-3xl lg:rounded-3xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <div>
              <h2 className="font-bold text-base">Horarios de atención</h2>
              <p className="text-xs text-ink-dim mt-0.5">Marcá los días que abrís y los horarios.</p>
            </div>
            <button onClick={() => setHorarioModal(false)} className="w-8 h-8 rounded-xl hover:bg-surface-card-2 dark:hover:bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-3">
            {diasSemana.map(({ key, label }) => (
              <div key={key} className={`rounded-2xl border p-4 transition-colors ${horarioForm[key]?.abierto ? 'border-brand/30 bg-brand/5' : 'border-slate-200 dark:border-white/10 bg-surface-card-2 dark:bg-white/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleDia(key)}
                      className={`w-12 h-7 rounded-full transition-colors relative ${horarioForm[key]?.abierto ? 'bg-brand' : 'bg-ink-dim dark:bg-ink-dim'}`}
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
                      <label className="text-[10px] font-bold text-ink-dim uppercase">Desde</label>
                      <input
                        type="time"
                        value={horarioForm[key]?.desde || '09:00'}
                        onChange={e => setHora(key, 'desde', e.target.value)}
                        className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-surface-card text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] font-bold text-ink-dim uppercase">Hasta</label>
                      <input
                        type="time"
                        value={horarioForm[key]?.hasta || '18:00'}
                        onChange={e => setHora(key, 'hasta', e.target.value)}
                        className="w-full mt-1 p-2 rounded-xl border border-slate-200 dark:border-white/10 bg-surface-card text-sm"
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

  // ── FieldEditorSheet — reemplaza EditInfoModal (el viejo formulario largo
  // "editar todo de una", ver auditoría UX hallazgos A1/B5). Es un sheet
  // ENFOCADO y genérico: recibe qué campos mostrar (fieldEditor.fields) y
  // guarda con optimistic UI (cierra al instante, ver saveFieldEditor
  // arriba) — a diferencia del viejo modal que bloqueaba con spinner hasta
  // que el PATCH volvía (hallazgo A2). Cada campo (descripción, contacto)
  // sigue teniendo UN solo lugar real de edición; este componente solo
  // cambia CÓMO se ve ese lugar, no agrega una ruta nueva.
  const FieldEditorSheet = () => {
    if (!fieldEditor) return null;
    const [localValues, setLocalValues] = useState(fieldEditor.values);
    const setField = (key, value) => setLocalValues(v => ({ ...v, [key]: value }));

    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[6000] flex items-end lg:items-center justify-center" onClick={() => setFieldEditor(null)}>
        <div className="bg-surface-card rounded-t-3xl lg:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <h2 className="font-bold text-base">{fieldEditor.title}</h2>
            <button onClick={() => setFieldEditor(null)} className="w-8 h-8 shrink-0 rounded-xl hover:bg-surface-card-2 dark:hover:bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-4">
            {fieldEditor.fields.map(f => (
              <div key={f.key}>
                <label className="text-xs font-semibold text-ink-dim mb-1 block">{f.label}</label>
                {f.type === 'textarea' ? (
                  <textarea
                    value={localValues[f.key]} onChange={e => setField(f.key, e.target.value)}
                    placeholder={f.placeholder} rows={f.rows || 3} maxLength={f.maxLength}
                    autoFocus={fieldEditor.focusField === f.key}
                    className="w-full bg-surface-card-2 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand resize-none" />
                ) : f.prefix ? (
                  <div className="flex items-center bg-surface-card-2 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 overflow-hidden focus-within:border-brand transition-colors">
                    <span className="pl-3 text-xs text-ink-dim">{f.prefix}</span>
                    <input
                      value={localValues[f.key]} onChange={e => setField(f.key, e.target.value.replace(f.prefix, ''))}
                      placeholder={f.placeholder} maxLength={f.maxLength}
                      autoFocus={fieldEditor.focusField === f.key}
                      className="flex-1 bg-transparent px-2 py-2.5 text-sm outline-none" />
                  </div>
                ) : (
                  <input
                    value={localValues[f.key]} onChange={e => setField(f.key, e.target.value)}
                    placeholder={f.placeholder} maxLength={f.maxLength}
                    autoFocus={fieldEditor.focusField === f.key}
                    className="w-full bg-surface-card-2 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand" />
                )}
              </div>
            ))}
          </div>
          <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0">
            <button
              onClick={() => saveFieldEditor(localValues)}
              className="w-full py-3 bg-brand hover:bg-brand-dark text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors"
            >
              <Save className="w-4 h-4" />
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── PublicUrlSheet — editor de la URL pública (slug), disparado por el
  // botón "Editar URL" de la fila de acciones rápidas bajo el hero. Antes
  // se expandía inline dentro de la card "Diseño de mi página"; ahora es un
  // sheet propio, mismo patrón visual que FieldEditorSheet. */}
  const PublicUrlSheet = () => {
    if (!editingPublicPage) return null;
    const close = () => { setEditingPublicPage(false); setPublicPageError(null); };
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[6000] flex items-end lg:items-center justify-center" onClick={close}>
        <div className="bg-surface-card rounded-t-3xl lg:rounded-3xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
            <h2 className="font-bold text-base">URL pública</h2>
            <button onClick={close} className="w-8 h-8 shrink-0 rounded-xl hover:bg-surface-card-2 dark:hover:bg-white/10 flex items-center justify-center">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar p-5 space-y-3">
            <div>
              <label className="text-xs font-semibold text-ink-dim mb-1.5 block">Tu URL en LOKAL</label>
              {/* Rediseño con más carácter que un simple "dos cajas
                  pegadas": el dominio vive en un chip propio con ícono e
                  identidad de marca (fondo brand/10, texto brand), separado
                  del campo por un pequeño gap real (no un borde interno) —
                  se lee como "prefijo fijo" + "lo que vos elegís", en vez
                  de un input partido a la mitad. Tipografía monoespaciada
                  en ambos lados: comunica "esto es código/URL", no texto
                  común, y alinea visualmente el slash con el slug. */}
              <div className={`flex items-stretch gap-1.5 p-1.5 rounded-2xl border-2 transition-colors ${publicPageError ? 'border-rose-400 dark:border-rose-500/60' : 'border-slate-200 dark:border-white/10 focus-within:border-brand'}`}>
                <span className="flex items-center gap-1.5 pl-3 pr-3 py-2.5 rounded-xl bg-brand/10 dark:bg-brand/15 text-brand text-sm font-semibold whitespace-nowrap">
                  <Link2 className="w-3 h-3 shrink-0" />
                  {window.location.host}/
                </span>
                <input
                  value={publicPageForm.slug}
                  onChange={e => setPublicPageForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  onKeyDown={e => e.key === 'Enter' && savePublicPage()}
                  placeholder="mi-tienda"
                  autoFocus autoCapitalize="none" autoCorrect="off" spellCheck={false}
                  className="flex-1 min-w-0 bg-transparent px-3 py-2.5 text-sm outline-none"
                />
              </div>
              {publicPageError && <p className="text-xs text-rose-500 font-semibold mt-1.5">{publicPageError}</p>}
            </div>
          </div>
          <div className="px-5 pb-5 pt-3 border-t border-slate-100 dark:border-white/10 shrink-0">
            <button onClick={savePublicPage} disabled={savingPublicPage} className="w-full py-3 rounded-2xl bg-brand hover:bg-brand-dark disabled:opacity-60 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
              {savingPublicPage ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar cambios
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Formulario producto — módulo "catalogo" (overlay independiente) ────────
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
        <div className="fixed inset-0 z-[5000] bg-[#f5f5f5] dark:bg-[#080808] overflow-y-auto no-scrollbar pb-24">
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

  // ── Módulo "ofertas" (isModuleActive(tienda, 'ofertas')) ───────────────────
  // Simple a propósito: foto + nombre + vigencia. Contrato real del backend
  // (ofertas.js → sanitizeOfertaInput): nombre, imageUrl, thumbUrl,
  // publishAt, expireAt, visible — nada de precio/stock/categoría (eso es
  // el módulo 'catalogo', más abajo). Comparte misProductos/
  // fetchMisProductos con catalogo (mismo endpoint GET /ofertas).
  const OfertaFormOverlay = () => {
    if (!ofertaShowForm) return null;

    const handleFoto = (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setOfertaFotoLoading(true);
      setOfertaFotoFile(file);
      setOfertaFotoRemoved(false);
      setOfertaFotoPreview(URL.createObjectURL(file));
      e.target.value = '';
    };

    const handleQuitarFoto = (e) => {
      e.preventDefault(); e.stopPropagation();
      if (ofertaFotoPreview) URL.revokeObjectURL(ofertaFotoPreview);
      setOfertaFotoFile(null);
      setOfertaFotoPreview(null);
      setOfertaFotoRemoved(true);
      setOfertaFotoLoading(false);
    };

    // Optimista: ya NO espera la red. Junta lo cargado, entrega a la cola de
    // fondo (handleOfertaGuardadaOptimista, arriba) y cierra el formulario
    // al instante — la subida real (compresión de imagen + POST/PATCH) sigue
    // corriendo atrás, con su propia card de progreso en la grilla. Antes
    // este botón dejaba toda la pantalla trabada con spinner varios segundos.
    // ofertaFotoRemoved: si el dueño quitó con la X la foto ya guardada
    // (modo edición) y no eligió una nueva, no hay imagen válida para
    // guardar — igual que "Nueva oferta" sin ninguna foto todavía.
    const hayFotoValida = ofertaFotoFile || (ofertaEditing?.imageUrl && !ofertaFotoRemoved);
    const hayNombre = !!ofertaForm.nombre.trim();
    // Qué falta, para resaltar el campo puntual (no solo un texto rojo
    // genérico). El botón queda SIEMPRE clickeable (no disabled): tocarlo
    // con algo faltante no guarda, pero SÍ marca ofertaIntentoGuardar — recién
    // ahí se resalta el borde del campo que falta y se ve el mensaje. Antes
    // de ese primer intento el formulario no "grita" en rojo apenas se abre.
    const faltante = !hayFotoValida ? 'foto' : !hayNombre ? 'nombre' : null;

    const handleSave = () => {
      if (faltante) { setOfertaIntentoGuardar(true); return; }
      handleOfertaGuardadaOptimista({
        nombre: ofertaForm.nombre.trim(),
        fotoFile: ofertaFotoFile,
        previewUrl: ofertaFotoPreview,
        editingId: ofertaEditing?.id || null,
        existingImageUrl: ofertaFotoRemoved ? null : (ofertaEditing?.imageUrl || null),
        existingThumbUrl: ofertaFotoRemoved ? null : (ofertaEditing?.thumbUrl || null),
        existingOgImageUrl: ofertaFotoRemoved ? null : (ofertaEditing?.ogImageUrl || null),
        expireAt: ofertaForm.expireAt ? new Date(ofertaForm.expireAt).toISOString() : null,
        visible: ofertaForm.visible,
      });
      setOfertaShowForm(false);
    };

    return (
      <div className="fixed inset-0 z-[5000] bg-[#f5f5f5] dark:bg-[#080808] overflow-y-auto no-scrollbar pb-24">
        <StorePageHeader
          title={ofertaEditing ? 'Editar oferta' : 'Nueva oferta'}
          onBack={() => setOfertaShowForm(false)}
        />
        <div className="max-w-md mx-auto p-4 lg:p-8 space-y-5">
          {/* Foto */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">Foto</label>
            {/* aspect-[1/1.414] — MISMA proporción que la card real (lista
              de ofertas del admin y la vista pública, ambas ya ajustadas):
              antes era 1:1 acá, así la vista previa al cargar/editar no
              coincidía con cómo se ve encuadrada la foto en ningún otro
              lado de la app. */}
            <label className={`block aspect-[1/1.414] rounded-2xl border-2 border-dashed bg-surface-card-2 dark:bg-white/5 overflow-hidden cursor-pointer relative hover:border-brand transition-colors ${ofertaIntentoGuardar && faltante === 'foto' ? 'border-rose-400 dark:border-rose-500/60' : 'border-slate-200 dark:border-white/10'}`}>
              <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
              {hayFotoValida ? (
                <>
                  <img
                    src={ofertaFotoPreview || ofertaEditing.imageUrl} alt=""
                    className="w-full h-full object-cover"
                    onLoad={() => setOfertaFotoLoading(false)}
                  />
                  {/* Spinner mientras el navegador decodifica/pinta la foto
                      recién elegida — createObjectURL es instantáneo, pero
                      fotos pesadas de cámara tardan un poco en aparecer, y
                      sin este feedback esos segundos se sentían como que
                      "elegir foto" no había hecho nada. */}
                  {ofertaFotoLoading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    </div>
                  )}
                  {/* X para quitar — mismo patrón que OfertaQuickForm (carga
                      rápida desde la tienda pública): círculo flotante en la
                      esquina, solo visible con foto ya elegida. */}
                  <button
                    type="button"
                    onClick={handleQuitarFoto}
                    aria-label="Quitar foto"
                    className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-ink-dim">
                  <Camera className="w-8 h-8" />
                  <span className="text-sm font-semibold">Elegir foto</span>
                </div>
              )}
            </label>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">Nombre</label>
            <input
              value={ofertaForm.nombre}
              onChange={e => setOfertaForm(f => ({ ...f, nombre: e.target.value }))}
              placeholder="Ej: 2x1 en aceite de girasol"
              maxLength={160}
              className={`w-full px-4 py-3 rounded-2xl text-sm border outline-none bg-surface-card-2 dark:bg-white/5 focus:border-brand transition-colors ${ofertaIntentoGuardar && faltante === 'nombre' ? 'border-rose-400 dark:border-rose-500/60' : 'border-slate-200 dark:border-white/10'}`}
            />
          </div>

          {/* Vencimiento — fecha única, mínimo hoy (no se caduca en el pasado) */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-ink-dim mb-2">Vence (opcional)</label>
            <DatePicker
              value={ofertaForm.expireAt}
              onChange={(iso) => setOfertaForm(f => ({ ...f, expireAt: iso }))}
              placeholder="Sin fecha límite"
              minISO={new Date().toISOString().slice(0, 10)}
            />
            {/* visibility:hidden (no display:none / render condicional): el
                espacio queda RESERVADO siempre, así elegir/quitar la fecha
                no empuja el resto del formulario hacia abajo/arriba —
                ningún salto de layout al aparecer/desaparecer el texto. */}
            <p className="text-xs text-ink-dim mt-1.5" style={{ visibility: ofertaForm.expireAt ? 'hidden' : 'visible' }}>
              Sin fecha, la oferta queda vigente hasta que la ocultes.
            </p>
          </div>

          {/* El toggle visible/oculto va en la card de la oferta ya creada
              (pausar/reactivar), no acá: una oferta nueva nace visible. */}

          {/* Mensaje centrado, solo tras un intento de guardar con algo
              faltante — resalta CUÁL de los dos campos falta (arriba,
              directo en el borde) en vez de un texto rojo genérico sin
              contexto de dónde mirar. */}
          {ofertaIntentoGuardar && faltante && (
            <p className="text-sm text-rose-500 font-semibold text-center">
              {faltante === 'foto' ? 'Subí una foto para publicar la oferta' : 'Escribí un nombre para la oferta'}
            </p>
          )}

          <button
            onClick={handleSave}
            className="w-full py-3.5 bg-brand hover:bg-brand-dark text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 transition-colors"
          >
            <Save className="w-4 h-4" />
            {ofertaEditing ? 'Guardar cambios' : 'Publicar oferta'}
          </button>
        </div>
      </div>
    );
  };

  const OfertasScreen = () => {
    const openNew = () => {
      setOfertaEditing(null);
      setOfertaForm({ nombre: '', expireAt: '', visible: true });
      setOfertaFotoFile(null); setOfertaFotoPreview(null);
      setOfertaIntentoGuardar(false);
      setOfertaShowForm(true);
    };

    const openEdit = (o) => {
      setOfertaEditing(o);
      setOfertaForm({
        nombre: o.nombre || '',
        expireAt: o.expireAt ? new Date(o.expireAt).toISOString().slice(0, 10) : '',
        visible: o.visible !== false,
      });
      setOfertaFotoFile(null); setOfertaFotoPreview(null);
      // Sin este reset, ofertaFotoRemoved/ofertaFotoLoading quedaban con el
      // valor de una apertura ANTERIOR del formulario (ej. si la vez pasada
      // se quitó la foto con la X, ofertaFotoRemoved seguía en true acá) —
      // eso hacía que hayFotoValida diera false y la vista previa mostrara
      // el placeholder "Elegir foto" en vez de la foto real ya guardada.
      setOfertaFotoRemoved(false);
      setOfertaFotoLoading(false);
      setOfertaIntentoGuardar(false);
      setOfertaShowForm(true);
    };

    const toggleVisible = async (o) => {
      haptic('medium');
      const updated = { ...o, visible: !o.visible };
      setMisProductos(prev => prev.map(x => x.id === o.id ? updated : x));
      try {
        const res = await apiFetch(`${API_BASE}/ofertas`, { method: 'PATCH', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: o.id, visible: updated.visible }) });
        if (!res.ok) throw new Error();
        haptic('success');
      } catch {
        setMisProductos(prev => prev.map(x => x.id === o.id ? o : x));
        haptic('error');
      }
    };

    const deleteOferta = async (id) => {
      haptic('heavy');
      const original = misProductos.find(o => o.id === id);
      setMisProductos(prev => prev.filter(o => o.id !== id));
      try {
        const res = await apiFetch(`${API_BASE}/ofertas?id=${id}`, { method: 'DELETE', authRequired: true });
        if (!res.ok) throw new Error();
      } catch {
        if (original) setMisProductos(prev => [...prev, original]);
      }
    };

    if (ofertaShowForm) return null;

    const vencida = (o) => o.expireAt && new Date(o.expireAt).getTime() < Date.now();

    const OfertaCard = ({ o }) => {
      const estaVencida = vencida(o);
      const inactiva = o.visible === false || estaVencida;
      // Card en subida optimista: mismo criterio que la carga rápida desde
      // la tienda pública — foto real (blob) + spinner mientras sube, o
      // borde rojo + "Reintentar" si falló. Sin _status, es una oferta
      // normal ya persistida (comportamiento de siempre).
      const pending = o._status === 'uploading';
      const failed = o._status === 'error';
      return (
        <div className={`bg-surface-card rounded-2xl overflow-hidden border transition-all ${failed ? 'border-danger/50' : inactiva ? 'border-dashed border-slate-200 dark:border-white/10 opacity-55' : 'border-slate-100 dark:border-white/8 hover:shadow-md hover:shadow-black/5'}`}>
          {/* aspect-[1/1.414] — MISMA proporción que la card de oferta en
              la vista pública real (commerce-modern.jsx, sección Ofertas:
              aspectRatio '1/1.414'), antes era 1:1 cuadrado acá — la
              preview del admin no reflejaba cómo se ve la foto encuadrada
              en la tienda real. */}
          <div className="aspect-[1/1.414] bg-surface-card-2 dark:bg-white/6 relative overflow-hidden">
            {o.imageUrl ? <LazyImg src={o.thumbUrl || o.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-ink-dim dark:text-white/20" /></div>}
            {/* Estado (Vencida/Oculta) a la izquierda, fecha a la derecha —
                antes ambos vivían en el mismo top-2 right-2, se hubieran
                superpuesto si coexistían. */}
            {estaVencida && (
              <span
                className="absolute top-2 left-2 flex items-center gap-1 text-white text-[11px] font-bold leading-none tracking-wide px-2.5 py-[5px] rounded-full"
                style={{ background: 'rgba(220,38,38,.85)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.15)' }}
              >
                <AlertTriangle className="w-3 h-3" strokeWidth={2.5} />
                Vencida
              </span>
            )}
            {!estaVencida && o.visible === false && (
              <span
                className="absolute top-2 left-2 flex items-center gap-1 text-white text-[11px] font-bold leading-none tracking-wide px-2.5 py-[5px] rounded-full"
                style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.1)' }}
              >
                <EyeOff className="w-3 h-3" strokeWidth={2.5} />
                Oculta
              </span>
            )}
            {/* Badge flotante en vez de línea de texto abajo: antes la fecha
                era una <p> condicional dentro del bloque de texto, así que
                una card con fecha medía más alto que la de al lado sin
                fecha — mismo grid, distinta altura, los botones de acción
                quedaban desalineados entre columnas. Como badge sobre la
                foto, el bloque de texto de abajo (nombre + botones) siempre
                tiene la MISMA estructura fija, sin nada condicional que le
                cambie el alto. */}
            {o.expireAt && (
              <span
                className="absolute top-2 right-2 flex items-center gap-1 text-white text-[11px] font-bold leading-none tracking-wide px-2.5 py-[5px] rounded-full"
                style={{ background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', boxShadow: '0 2px 8px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.1)' }}
              >
                <CalendarClock className="w-3 h-3" strokeWidth={2.5} />
                {new Date(o.expireAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
              </span>
            )}
            {/* Spinner grande con X cancelable en el centro — mismo patrón
                que subir una foto por WhatsApp: el círculo de progreso ES el
                botón de cancelar, no un ícono puramente decorativo. Antes
                era un Loader2 chico sin acción; ahora aborta el request real
                (AbortController) y descarta la card. */}
            {pending && (
              <button
                onClick={() => handleCancelarOfertaAdmin(o._localId)}
                aria-label="Cancelar subida"
                className="absolute inset-0 bg-black/45 flex items-center justify-center"
              >
                <span className="relative w-12 h-12 flex items-center justify-center">
                  <Loader2 className="absolute inset-0 w-12 h-12 text-white/90 animate-spin" strokeWidth={2.5} />
                  <X className="w-5 h-5 text-white" strokeWidth={2.5} />
                </span>
              </button>
            )}
            {failed && (
              <div className="absolute inset-0 bg-danger/80 flex flex-col items-center justify-center gap-1 text-white text-center px-2">
                <AlertTriangle className="w-6 h-6" />
                <span className="text-[10px] font-bold">No se pudo subir</span>
              </div>
            )}
          </div>
          <div className="p-2.5">
            <p className="font-bold text-[12px] leading-snug line-clamp-2 mb-1.5 text-center">{o.nombre}</p>
            {failed ? (
              // Solo Reintentar/Eliminar mientras está en error — Ocultar/
              // Editar no aplican todavía porque no hay id real de servidor.
              <div className="grid grid-cols-2 gap-1.5">
                <button onClick={() => handleReintentarOfertaAdmin(o._localId)}
                  className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-brand/10 text-[10px] font-bold text-brand hover:bg-brand/20 transition-colors">
                  <RotateCcw className="w-4 h-4" />
                  Reintentar
                </button>
                <button onClick={() => setMisProductos(prev => prev.filter(x => x._localId !== o._localId))}
                  className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-surface-card-2 dark:bg-white/8 text-[10px] font-bold text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors">
                  <Trash2 className="w-4 h-4" />
                  Descartar
                </button>
              </div>
            ) : (
              // 3 columnas iguales (no "1 ancho + 2 chicos de solo ícono") —
              // antes Editar/Eliminar eran cuadraditos de w-8 con ícono de
              // 3px, muy chicos para tocar cómodo en mobile. Ahora las 3
              // acciones tienen el mismo peso visual y área de toque.
              // Deshabilitadas mientras pending: todavía no hay id real.
              <div className="grid grid-cols-3 gap-1.5">
                <button onClick={() => toggleVisible(o)} disabled={pending}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px] font-bold transition-colors disabled:opacity-50 ${o.visible !== false ? 'bg-surface-card-2 dark:bg-white/8 text-ink-dim' : 'bg-brand/10 text-brand'}`}>
                  {o.visible !== false ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                  {o.visible !== false ? 'Ocultar' : 'Mostrar'}
                </button>
                <button onClick={() => openEdit(o)} disabled={pending}
                  className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-surface-card-2 dark:bg-white/8 text-[10px] font-bold text-ink-dim hover:bg-brand/10 hover:text-brand transition-colors disabled:opacity-50">
                  <Edit3 className="w-4 h-4" />
                  Editar
                </button>
                <button onClick={() => setOfertaConfirmDelete(o.id)} disabled={pending}
                  className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl bg-surface-card-2 dark:bg-white/8 text-[10px] font-bold text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors disabled:opacity-50">
                  <Trash2 className="w-4 h-4" />
                  Eliminar
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };

    return (
      <>
      <div className="h-[100dvh] flex flex-col sa-page-bg">
        <StorePageHeader
          title="Ofertas"
          subtitle={`${misProductos.length} publicación${misProductos.length !== 1 ? 'es' : ''}`}
          icon={Tag}
          actionSlot={(
            <>
              {loadingProductos && <Loader2 className="w-4 h-4 animate-spin text-ink-dim shrink-0" />}
              {/* Solo desktop: en móvil el FAB del bottom-nav ya crea */}
              <button onClick={openNew} className="hidden lg:flex items-center gap-1.5 bg-brand hover:bg-brand-light text-white text-sm font-bold px-3 py-1.5 rounded-xl transition-colors shrink-0 shadow-sm shadow-brand/20">
                <Plus className="w-4 h-4" /><span className="hidden sm:inline">Nueva</span>
              </button>
            </>
          )}
        />

        {loadingProductos && misProductos.length === 0 ? (
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 lg:pb-4">
            <SkeletonProductosGrid cols={2} count={6} />
          </div>
        ) : misProductos.length === 0 && !loadingProductos ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4 pb-24 lg:pb-0">
            <div className="w-16 h-16 rounded-3xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
              <Package className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h3 className="font-black text-xl mb-1">Sin ofertas aún</h3>
              <p className="text-sm text-ink-dim">Publicá tu primera oferta para que los clientes la vean</p>
            </div>
            <button onClick={openNew} className="px-6 py-3 bg-brand hover:bg-brand-light text-white rounded-2xl font-bold transition-colors shadow-lg shadow-brand/25">
              Crear primera oferta
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto no-scrollbar p-4">
            {/* Barra de resumen — contexto de gestión, no repite lo que ya
                muestra la pantalla de Estadísticas. */}
            <div className="flex items-center gap-4 px-1 pb-4 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-ink-dim">
                <span className="w-2 h-2 rounded-full bg-ok shrink-0" />
                {misProductos.filter(o => o.visible !== false && !vencida(o)).length} activas
              </span>
              {misProductos.some(o => vencida(o)) && (
                <span className="flex items-center gap-1.5 font-semibold text-ink-dim">
                  <span className="w-2 h-2 rounded-full bg-danger shrink-0" />
                  {misProductos.filter(o => vencida(o)).length} vencidas
                </span>
              )}
              {misProductos.some(o => o.visible === false && !vencida(o)) && (
                <span className="flex items-center gap-1.5 font-semibold text-ink-dim">
                  <span className="w-2 h-2 rounded-full bg-ink-dim shrink-0" />
                  {misProductos.filter(o => o.visible === false && !vencida(o)).length} ocultas
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {misProductos.map(o => <OfertaCard key={o.id} o={o} />)}
            </div>
            {/* Espaciador = SOLO la altura del nav (78px), sin sumar nada
                extra: el propio p-4 de este contenedor ya aporta 16px de
                padding-bottom real después de la última fila — el mismo
                aire que hay a los costados. Ese padding + el espaciador
                exacto del nav dan el mismo margen visible que el lateral,
                sin duplicar ningún aire. Sumarle algo más acá (como antes,
                +16 o +18px) desalineaba de nuevo el resultado. */}
            <div style={{ height: 84 }} className="lg:hidden" aria-hidden="true" />
          </div>
        )}
      </div>

      {ofertaConfirmDelete && (
        <div className="fixed inset-0 z-[6000] bg-black/50 flex items-center justify-center p-4" onClick={() => setOfertaConfirmDelete(null)}>
          <div className="bg-surface-card rounded-3xl p-6 max-w-xs w-full" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-danger/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="font-black text-lg text-center mb-1">¿Eliminar esta oferta?</h3>
            <p className="text-sm text-ink-dim text-center mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setOfertaConfirmDelete(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim dark:text-ink-dim">Cancelar</button>
              <button onClick={() => { deleteOferta(ofertaConfirmDelete); setOfertaConfirmDelete(null); }} className="flex-1 py-2.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-bold transition-colors">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      </>
    );
  };

  // ── Perfil tienda ──────────────────────────────────────────────────────────
  // ── Módulo "catalogo" (isModuleActive(tienda, 'catalogo')) ─────────────────
  // Producto de e-commerce completo: precio, stock, condición, categoría,
  // financiación, atributos. Para tiendas mono-oferta (módulo 'ofertas'),
  // ver OfertasScreen más abajo — mismo patrón que MODULES.catalogo vs
  // MODULES.ofertas en netlify/functions/_lib/modules.js.
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
      active ? 'bg-brand/10 dark:bg-brand/15 text-brand-dark dark:text-brand' : 'text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8'
    }`;

    // Card grilla
    const GridCard = ({ o }) => {
      const vc = o.ventaja ? (Array.isArray(o.ventaja) ? VENTAJA_OPTS.find(x => x.id === o.ventaja[0]) : VENTAJA_OPTS.find(x => x.id === o.ventaja)) : null;
      const img = o.fotos?.[0];
      const sinStock = o.stock != null && Number(o.stock) === 0;
      return (
        <div onClick={() => { setProdDetail(o); setProdDetailPhotoIdx(0); setProdDetailEditField(null); }} className={`bg-surface-card rounded-2xl overflow-hidden border transition-all group cursor-pointer ${o.activa !== false ? 'border-slate-100 dark:border-white/8 hover:shadow-md hover:shadow-black/5' : 'border-dashed border-slate-200 dark:border-white/10 opacity-50'}`}>
          {/* Foto */}
          <div className="aspect-square bg-gradient-to-br from-surface-card-2 to-surface-card-2 dark:from-white/6 dark:to-white/10 relative overflow-hidden">
            {img ? <LazyImg src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-ink-dim dark:text-white/20" /></div>}
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
                ? <span className="text-sm font-black text-ink">${Number(o.precio).toLocaleString('es')}</span>
                : <span className="text-[10px] text-ink-dim italic">Sin precio</span>}
              {o.condicion && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${o.condicion === 'nuevo' ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>{o.condicion === 'nuevo' ? 'Nuevo' : 'Usado'}</span>}
            </div>
            {/* Acciones móvil — siempre visibles */}
            <div className="lg:hidden flex gap-1">
              <button onClick={e => { e.stopPropagation(); toggleActiva(o); }}
                className={`flex-1 flex items-center justify-center gap-1 py-1.5 rounded-xl text-[10px] font-bold transition-colors ${o.activa !== false ? 'bg-surface-card-2 dark:bg-white/8 text-ink-dim' : 'bg-brand/10 text-brand'}`}>
                {o.activa !== false ? <ToggleRight className="w-3 h-3" /> : <ToggleLeft className="w-3 h-3" />}
                {o.activa !== false ? 'Pausar' : 'Activar'}
              </button>
              <button onClick={e => { e.stopPropagation(); openEdit(o); }} className="flex items-center justify-center w-8 rounded-xl text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 hover:text-brand transition-colors">
                <Edit3 className="w-3 h-3" />
              </button>
              <button onClick={e => { e.stopPropagation(); setConfirmDelete(o.id); }} className="flex items-center justify-center w-8 rounded-xl text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors">
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
        <div onClick={() => { setProdDetail(o); setProdDetailPhotoIdx(0); setProdDetailEditField(null); }} className={`bg-surface-card rounded-2xl border overflow-hidden flex gap-0 transition-all cursor-pointer ${o.activa !== false ? 'border-slate-100 dark:border-white/8 hover:shadow-md hover:shadow-black/5' : 'border-dashed border-slate-200 dark:border-white/10 opacity-55'}`}>
          {/* Foto */}
          <div className="relative w-24 shrink-0 bg-gradient-to-br from-surface-card-2 to-surface-card-2 dark:from-white/6 dark:to-white/10 overflow-hidden">
            {img ? <LazyImg src={img} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="w-7 h-7 text-ink-dim dark:text-white/20" /></div>}
            {vc && <span className={`absolute top-1.5 left-1.5 ${vc.badgeClass} text-[8px] font-bold px-1 py-0.5 rounded-lg flex items-center gap-0.5 shadow`}><vc.Icon className={`w-2 h-2 ${vc.iconClass}`} />{vc.label}</span>}
            {sinStock && <span className="absolute bottom-1.5 left-1.5 bg-danger text-white text-[8px] font-bold px-1 py-0.5 rounded-lg shadow">Sin stock</span>}
          </div>
          {/* Contenido */}
          <div className="flex-1 min-w-0 p-3 flex flex-col justify-between gap-1.5">
            {/* Top: título + dot estado */}
            <div className="flex items-start gap-1.5">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-[13px] leading-snug line-clamp-2">{o.titulo}</p>
                {o.descripcion && <p className="text-[11px] text-ink-dim line-clamp-1 mt-0.5">{o.descripcion}</p>}
              </div>
              <span className={`shrink-0 w-2 h-2 rounded-full mt-1 ${o.activa !== false ? 'bg-ok' : 'bg-ink-dim dark:bg-ink-dim'}`} />
            </div>
            {/* Bottom: precio + badges + acciones */}
            <div className="flex items-center gap-1.5">
              {o.precio != null
                ? <span className="text-sm font-black text-ink">${Number(o.precio).toLocaleString('es')}</span>
                : <span className="text-[10px] text-ink-dim italic">Sin precio</span>}
              {o.precioOriginal && o.precio && Number(o.precioOriginal) > Number(o.precio) && (
                <span className="text-[10px] text-ink-dim line-through">${Number(o.precioOriginal).toLocaleString('es')}</span>
              )}
              {o.condicion && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-lg ${o.condicion === 'nuevo' ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>{o.condicion === 'nuevo' ? 'N' : 'U'}</span>}
              {/* Acciones — empujar a la derecha */}
              <div className="ml-auto flex items-center gap-1">
                <button onClick={e => { e.stopPropagation(); toggleActiva(o); }}
                  className={`w-7 h-7 rounded-xl flex items-center justify-center transition-colors ${o.activa !== false ? 'bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:bg-surface-card-2' : 'bg-brand/10 text-brand hover:bg-brand/20'}`}
                  title={o.activa !== false ? 'Pausar' : 'Activar'}>
                  {o.activa !== false ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                </button>
                <button onClick={e => { e.stopPropagation(); openEdit(o); }}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-ink-dim hover:bg-brand/10 hover:text-brand transition-colors"
                  title="Editar">
                  <Edit3 className="w-3 h-3" />
                </button>
                <button onClick={e => { e.stopPropagation(); setConfirmDelete(o.id); }}
                  className="w-7 h-7 rounded-xl flex items-center justify-center text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors"
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
            className="group/field flex items-start gap-1.5 w-full text-left hover:bg-surface-card-2 dark:hover:bg-white/5 rounded-xl px-3 py-2 -mx-3 transition-colors"
          >
            <span className="flex-1">{display ?? value ?? <span className="text-ink-dim italic">{placeholder}</span>}</span>
            <Edit3 className="w-3 h-3 text-ink-dim group-hover/field:text-brand shrink-0 mt-0.5 transition-colors" />
          </button>
        );
      };

      return (
        <div className="fixed inset-0 z-[6000] bg-surface-card flex flex-col overflow-hidden animate-fade-in">
          {/* Header */}
          <div className="shrink-0 flex items-center gap-2 px-3 h-14 border-b border-slate-100 dark:border-white/8">
            <button onClick={() => setProdDetail(null)} className="ui-icon-btn text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/8 transition-colors shrink-0">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <p className="font-black flex-1 truncate text-sm">{o.titulo}</p>
            {prodDetailSaving && <Loader2 className="w-4 h-4 animate-spin text-brand shrink-0" />}
            <button onClick={() => { setProdDetail(null); toggleActiva(o); }}
              className={`shrink-0 text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${o.activa !== false ? 'bg-surface-card-2 dark:bg-white/8 text-ink-dim hover:bg-surface-card-2' : 'bg-brand/10 text-brand hover:bg-brand/20'}`}>
              {o.activa !== false ? 'Pausar' : 'Activar'}
            </button>
            <div className="w-px h-5 bg-surface-card-2 dark:bg-white/10 shrink-0" />
            <button onClick={() => { setProdDetail(null); openEdit(o); }} className="ui-icon-btn text-ink-dim hover:bg-brand/10 hover:text-brand transition-colors shrink-0" title="Editar formulario">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => { setProdDetail(null); setConfirmDelete(o.id); }} className="ui-icon-btn text-ink-dim hover:bg-danger/10 hover:text-danger transition-colors shrink-0" title="Eliminar">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Body scrolleable */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
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
              <div className="aspect-[4/3] max-h-72 bg-surface-card-2 dark:bg-surface-card-2 flex items-center justify-center">
                <Package className="w-16 h-16 text-ink-dim dark:text-ink-dim" />
              </div>
            )}

            {/* Info editable */}
            <div className="px-5 py-5 space-y-5 max-w-2xl mx-auto">
              {/* Badges */}
              <div className="flex flex-wrap gap-2">
                {o.activa === false && <span className="text-xs font-bold bg-surface-card-2 dark:bg-white/10 text-ink-dim px-3 py-1 rounded-xl">Pausado</span>}
                {o.condicion && <span className={`text-xs font-bold px-3 py-1 rounded-xl ${o.condicion === 'nuevo' ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-amber-50 dark:bg-amber-500/10 text-amber-600'}`}>{o.condicion === 'nuevo' ? 'Nuevo' : 'Usado'}</span>}
                {vc && <span className={`text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-1 ${vc.badgeClass}`}><vc.Icon className={`w-3 h-3 ${vc.iconClass}`} />{vc.label}</span>}
              </div>

              {/* Título */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-1">Título</p>
                <p className="font-black text-xl leading-snug">
                  <InlineField field="titulo" value={o.titulo} />
                </p>
              </div>

              {/* Precio */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-1">Precio</p>
                  <div className="font-black text-2xl text-brand-dark dark:text-brand">
                    <InlineField field="precio" value={String(o.precio ?? '')} display={o.precio != null ? `$${Number(o.precio).toLocaleString('es')}` : null} placeholder="Sin precio" />
                  </div>
                </div>
                {(o.precioOriginal || prodDetailEditField === 'precioOriginal') && (
                  <div className="flex-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-1">Precio original</p>
                    <div className="text-ink-dim line-through text-lg">
                      <InlineField field="precioOriginal" value={String(o.precioOriginal ?? '')} display={o.precioOriginal ? `$${Number(o.precioOriginal).toLocaleString('es')}` : null} placeholder="—" />
                    </div>
                  </div>
                )}
              </div>

              {/* Descripción */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-1">Descripción</p>
                <div className="text-sm text-ink-dim dark:text-ink-dim leading-relaxed">
                  <InlineField field="descripcion" value={o.descripcion ?? ''} multiline placeholder="Sin descripción" />
                </div>
              </div>

              {/* Financiación */}
              {(o.financiacion || prodDetailEditField === 'financiacion') && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-1">Financiación</p>
                  <div className="text-sm text-ink-dim dark:text-ink-dim">
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
              <div className="relative bg-surface-card rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
                <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                  <Trash2 className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="font-black text-lg text-center mb-1">¿Eliminar esta foto?</h3>
                <p className="text-sm text-ink-dim text-center mb-6">Esta acción no se puede deshacer.</p>
                <div className="flex gap-3">
                  <button onClick={() => setProdDetailPhotoConfirm(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim dark:text-ink-dim">Cancelar</button>
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
      <div className="h-[100dvh] flex flex-col sa-page-bg">
        {/* Header */}
        <StorePageHeader
          title="Mis productos"
          subtitle={`${misProductos.length} publicación${misProductos.length !== 1 ? 'es' : ''} · ${activos.length} activa${activos.length !== 1 ? 's' : ''}`}
          actionSlot={(
            <>
              {loadingProductos && <Loader2 className="w-4 h-4 animate-spin text-ink-dim shrink-0" />}
              {/* Solo desktop: en móvil el FAB del bottom-nav ya crea */}
              <button onClick={openNew} className="hidden lg:flex items-center gap-1.5 bg-brand hover:bg-brand-light text-white text-sm font-bold px-3 py-1.5 rounded-xl transition-colors shrink-0 shadow-sm shadow-brand/20">
                <Plus className="w-4 h-4" /><span className="hidden sm:inline">Nuevo</span>
              </button>
            </>
          )}
        />

        {loadingProductos && misProductos.length === 0 ? (
          <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 lg:pb-4">
            <SkeletonProductosGrid cols={2} count={6} />
          </div>
        ) : misProductos.length === 0 && !loadingProductos ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-4 pb-24 lg:pb-0">
            <div className="w-16 h-16 rounded-3xl bg-brand/10 dark:bg-brand/15 flex items-center justify-center">
              <Package className="w-8 h-8 text-brand" />
            </div>
            <div>
              <h3 className="font-black text-xl mb-1">Sin productos aún</h3>
              <p className="text-sm text-ink-dim">Publicá tu primer producto para que los clientes te encuentren</p>
            </div>
            <button onClick={openNew} className="px-6 py-3 bg-brand hover:bg-brand-light text-white rounded-2xl font-bold transition-colors shadow-lg shadow-brand/25">
              Crear primer producto
            </button>
          </div>
        ) : (
          <div className="flex flex-1 min-h-0">

            {/* ── Sidebar izquierda (desktop) ── */}
            <div className="hidden lg:flex flex-col w-56 xl:w-64 border-r border-slate-100 dark:border-white/8 bg-surface-card shrink-0 overflow-y-auto no-scrollbar">
              <div className="p-4 space-y-5">

                {/* Capacidad */}
                {productLimit !== Infinity && (
                  <div className={`rounded-2xl px-3 py-2.5 ${nearLimit ? 'bg-warn/8' : 'bg-surface-card-2 dark:bg-white/5'}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <p className={`text-[10px] font-bold uppercase tracking-wider ${nearLimit ? 'text-warn-dark dark:text-warn' : 'text-ink-dim'}`}>Capacidad</p>
                      {nearLimit && <AlertTriangle className="w-3 h-3 text-warn" />}
                    </div>
                    <p className={`text-sm font-black mb-1.5 ${nearLimit ? 'text-warn-dark dark:text-warn' : 'text-ink dark:text-ink-dim'}`}>{usados} / {productLimit}</p>
                    <div className="h-1.5 bg-surface-card-2 dark:bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${nearLimit ? 'bg-warn' : 'bg-brand'}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                )}

                {/* Estado */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-dim mb-2">Estado</p>
                  <div className="space-y-0.5">
                    {[['todos', `Todos`, misProductos.length], ['activos', 'Activos', activos.length], ['pausados', 'Pausados', pausados.length]].map(([v, label, count]) => (
                      <button key={v} onClick={() => setProdFilter(v)} className={chipCls(prodFilter === v)}>
                        <span className={`w-2 h-2 rounded-full shrink-0 ${v === 'activos' ? 'bg-ok' : v === 'pausados' ? 'bg-ink-dim dark:bg-ink-dim' : 'bg-brand'}`} />
                        {label}
                        <span className="ml-auto text-[10px] font-black text-ink-dim">{count}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Condición */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-dim mb-2">Condición</p>
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
                  <p className="text-[10px] font-bold uppercase tracking-wider text-ink-dim mb-2">Filtros</p>
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
                  <button onClick={clearFilters} className="w-full text-xs font-bold text-ink-dim hover:text-brand transition-colors py-1.5">
                    Limpiar filtros ({activeFilterCount})
                  </button>
                )}
              </div>
            </div>

            {/* ── Contenido derecho ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

              {/* Toolbar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-surface-card border-b border-slate-100 dark:border-white/8 shrink-0">
                {/* Búsqueda */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-dim" />
                  <input value={prodSearch} onChange={e => setProdSearch(e.target.value)}
                    placeholder="Buscar..."
                    className="w-full pl-8 pr-8 py-2 bg-surface-card-2 dark:bg-white/5 rounded-xl text-sm placeholder:text-ink-dim focus:outline-none focus:ring-2 focus:ring-brand transition-all border border-transparent focus:border-brand/20" />
                  {prodSearch && <button onClick={() => setProdSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-dim"><X className="w-3 h-3" /></button>}
                </div>

                {/* Sort */}
                <div className="relative group shrink-0">
                  <button className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${prodSort !== 'recientes' ? 'bg-brand text-white' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
                    <ArrowUpDown className="w-3.5 h-3.5" />
                  </button>
                  <div className="absolute right-0 top-full mt-1.5 bg-surface-card rounded-2xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden z-50 min-w-[160px] hidden group-focus-within:block">
                    {SORT_OPTS.map(o => (
                      <button key={o.value} onClick={() => setProdSort(o.value)}
                        className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs transition-colors text-left ${prodSort === o.value ? 'bg-surface-card-2 dark:bg-white/5 font-bold text-brand' : 'text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5'}`}>
                        {prodSort === o.value && <CheckCircle className="w-3 h-3 text-brand shrink-0" />}
                        <span className={prodSort === o.value ? '' : 'pl-4'}>{o.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filtros mobile */}
                <button onClick={() => setProdFilterSheet(true)} className={`lg:hidden relative w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${activeFilterCount > 0 ? 'bg-brand text-white' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
                  <ListFilter className="w-3.5 h-3.5" />
                  {activeFilterCount > 0 && <span className="absolute -top-1 -right-1 min-w-[14px] h-3.5 px-0.5 bg-warn text-white text-[8px] font-black rounded-full flex items-center justify-center">{activeFilterCount}</span>}
                </button>

                {/* View toggle */}
                <div className="flex gap-0.5 bg-surface-card-2 dark:bg-white/8 rounded-xl p-0.5 shrink-0">
                  <button onClick={() => setProdView('grid')} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${prodView === 'grid' ? 'bg-white dark:bg-surface-card-2 shadow-sm text-ink dark:text-white' : 'text-ink-dim'}`}>
                    <LayoutGrid className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setProdView('lista')} className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${prodView === 'lista' ? 'bg-white dark:bg-surface-card-2 shadow-sm text-ink dark:text-white' : 'text-ink-dim'}`}>
                    <LayoutList className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Contador */}
                <p className="text-xs text-ink-dim shrink-0 hidden sm:block">{filtered.length} producto{filtered.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Lista / Grilla */}
              <div className="flex-1 overflow-y-auto no-scrollbar p-4 pb-24 lg:pb-4">
                {filtered.length === 0 ? (
                  <div className="flex flex-col items-center text-center gap-3 pt-12 pb-8">
                    <Search className="w-8 h-8 text-ink-dim dark:text-ink-dim" />
                    <p className="text-sm font-semibold text-ink-dim">Sin resultados</p>
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
          <div className="relative bg-surface-card rounded-t-3xl px-4 pt-3 pb-8 shadow-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 2rem)', animation: 'sheet-up .22s ease' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full bg-surface-card-2 dark:bg-white/15 mx-auto mb-5" />
            <h3 className="font-black text-base mb-4">Filtros</h3>

            {/* Estado */}
            <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-2">Estado</p>
            <div className="flex gap-2 mb-4">
              {[
                { value: 'todos',   label: 'Todos' },
                { value: 'activos', label: 'Activos' },
                { value: 'pausados',label: 'Pausados' },
              ].map(opt => (
                <button key={opt.value} onClick={() => setProdFilter(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodFilter === opt.value ? 'bg-brand text-white' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Condición */}
            <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-2">Condición</p>
            <div className="flex gap-2 mb-4">
              {[
                { value: null,    label: 'Todas' },
                { value: 'nuevo', label: 'Nuevo' },
                { value: 'usado', label: 'Usado' },
              ].map(opt => (
                <button key={String(opt.value)} onClick={() => setProdCondicion(opt.value)}
                  className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodCondicion === opt.value ? 'bg-brand text-white' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Ordenar */}
            <p className="text-[10px] font-black uppercase tracking-widest text-ink-dim mb-2">Ordenar</p>
            <div className="flex flex-col gap-1 mb-5">
              {SORT_OPTS.map(opt => (
                <button key={opt.value} onClick={() => setProdSort(opt.value)}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${prodSort === opt.value ? 'bg-brand/10 text-brand' : 'bg-surface-card-2 dark:bg-white/5 text-ink-dim dark:text-ink-dim'}`}>
                  {opt.label}
                  {prodSort === opt.value && <CheckCircle className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {/* Quick filters */}
            <div className="flex gap-2 mb-5">
              <button onClick={() => setProdSinStock(v => !v)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodSinStock ? 'bg-danger/10 text-danger' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
                Sin stock
              </button>
              <button onClick={() => setProdDescuento(v => !v)}
                className={`flex-1 py-2 rounded-xl text-sm font-bold transition-all ${prodDescuento ? 'bg-ok/10 text-ok-dark dark:text-ok' : 'bg-surface-card-2 dark:bg-white/8 text-ink-dim'}`}>
                Con descuento
              </button>
            </div>

            <div className="flex gap-3">
              {activeFilterCount > 0 && (
                <button onClick={() => { clearFilters(); }} className="flex-1 py-3 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim">
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
          <div className="relative bg-surface-card rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="font-black text-lg text-center mb-1">¿Eliminar producto?</h3>
            <p className="text-sm text-ink-dim text-center mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 py-2.5 rounded-2xl border border-slate-200 dark:border-white/10 text-sm font-bold text-ink-dim dark:text-ink-dim hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors">Cancelar</button>
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
    // Carrusel del hero — mismo patrón que el hero público real (fotosHero
    // en commerce-modern.jsx): índice de foto activa + navegación LINEAL
    // (flechas desaparecen en los extremos, no loop circular). El estado
    // (heroPhotoIdx) vive arriba, a nivel de StoreApp — ver comentario ahí.
    const heroFotos = galeria.length > 0 ? galeria : [];
    const heroMultiFoto = heroFotos.length > 1;
    const heroPhotoIdxClamped = Math.min(heroPhotoIdx, Math.max(0, heroFotos.length - 1));

    // Profile completion — este array es la ÚNICA fuente de verdad: tanto
    // el anillo de % como las filas visuales de "Contacto e info" (más
    // abajo) se generan desde acá. Antes eran dos cosas separadas: el
    // anillo contaba 12 ítems pero solo 4 aparecían como filas, así que el
    // % nunca coincidía con lo que el dueño podía ver/completar desde ahí
    // (auditoría UX, hallazgo A5). Cada ítem es un ACCESO DIRECTO al editor
    // real de esa cosa — la lista no tiene inputs propios, solo invita e
    // indica estado (ver auditoría, hallazgo B5: "invitador", no editor).
    //
    // 4 categorías, en el orden en que un dueño nuevo las necesita:
    //  1) Perfil básico — identidad de la tienda.
    //  2) Configuración — setup de la página pública.
    //  3) Contenido — lo que de verdad hace que la tienda sirva de algo.
    //  4) Personalización — opcional, estético.
    const usaCatalogoPerfil = isModuleActive(tiendaData, 'catalogo');
    const profileItems = [
      // — Perfil básico —
      { key: 'foto',        group: 'perfil', icon: User,     done: !!tiendaInfo.foto,                           label: 'Foto de perfil', action: () => openProfileEdit('foto') },
      { key: 'galeria',     group: 'perfil', icon: Camera,   done: galeria.length >= 1,                         label: 'Portada',        action: () => openProfileEdit('galeria') },
      { key: 'descripcion', group: 'perfil', icon: Edit3,    done: (tiendaInfo.descripcion || '').length >= 20, label: 'Descripción',    action: () => openProfileEdit('descripcion') },
      { key: 'telefono',    group: 'perfil', icon: Phone,    done: !!tiendaInfo.telefono,                       label: 'Teléfono / WhatsApp', action: () => openProfileEdit('telefono') },
      { key: 'instagram',   group: 'perfil', icon: Instagram,done: !!tiendaInfo.instagram,                      label: 'Instagram',      action: () => openProfileEdit('instagram') },
      // Ciudad+dirección fusionados en un solo paso "Ubicación": se
      // completan juntos desde el mismo mapa (LocationEditorModal), contarlos
      // separados infla el checklist con dos pasos que en la práctica son uno.
      { key: 'ubicacion',   group: 'perfil', icon: MapPin,   done: !!(tiendaInfo.direccion || tiendaInfo.ciudad), label: 'Ubicación', action: () => openProfileEdit('direccion') },
      { key: 'tagline',     group: 'perfil', icon: Sparkles, done: (tiendaInfo.tagline || '').length >= 5,      label: 'Tagline',        action: () => openProfileEdit('tagline') },
      // — Configuración —
      { key: 'slug',        group: 'config', icon: Link2,    done: !!tiendaInfo.slug,                           label: 'URL personalizada', action: () => openProfileEdit('slug') },
      { key: 'horarios',    group: 'config', icon: Clock,    done: !!(tiendaInfo.horarios && typeof tiendaInfo.horarios === 'object' ? Object.keys(tiendaInfo.horarios).length > 0 : tiendaInfo.horarios), label: 'Horarios', action: () => openProfileEdit('horarios') },
      // — Contenido — el paso que de verdad hace que la tienda sirva de
      // algo; antes existía SOLO en el cálculo del %, invisible como fila.
      usaCatalogoPerfil
        ? { key: 'primer-producto', group: 'contenido', icon: Package, done: misProductos.length > 0, label: 'Primer producto', action: () => navigateTo('productos') }
        : { key: 'primera-oferta',  group: 'contenido', icon: Tag,     done: misProductos.length > 0, label: 'Primera oferta',  action: () => navigateTo('productos') },
      // — Personalización — opcional, estético. Antes vivía enterrada en un
      // acordeón de "Editar diseño" poco descubierto (hallazgo B4).
      { key: 'color', group: 'custom', icon: Palette, done: !!(tiendaInfo.pagina?.color && tiendaInfo.pagina.color !== '#e4002b'), label: 'Color de marca', action: () => navigateTo('mi-pagina') },
    ];
    const profileDone = profileItems.filter(i => i.done).length;
    const profilePct = Math.round((profileDone / profileItems.length) * 100);
    const r = 30; // ring radius
    const circ = 2 * Math.PI * r;
    const dash = circ * (profilePct / 100);

    // Texto a mostrar en la fila cuando el paso YA está completo — cada
    // campo tiene su propio formato (no todos son "mostrar el valor tal
    // cual": ubicación combina 2 campos, portada cuenta fotos, etc.). Los
    // pasos sin texto propio (ej. "Primera oferta") devuelven null y la fila
    // solo muestra el label + ícono en color de marca, sin segunda línea.
    const rowValue = (key) => {
      switch (key) {
        case 'telefono':   return tiendaInfo.telefono;
        case 'instagram':  return `@${tiendaInfo.instagram}`;
        case 'ubicacion':  return [tiendaInfo.direccion, tiendaInfo.ciudad].filter(Boolean).join(', ');
        case 'tagline':    return tiendaInfo.tagline;
        case 'slug':       return `${window.location.host}/${tiendaInfo.slug}`;
        case 'galeria':    return `${galeria.length} imagen${galeria.length === 1 ? '' : 'es'}`;
        case 'color':      return tiendaInfo.pagina?.color || null;
        default:           return null;
      }
    };

    const { abierta: heroAbierta } = getEstadoApertura(tiendaInfo.horarios);

    return (
      <div className="h-[100dvh] flex flex-col sa-page-bg">
        {/* Sin title: el nombre de la tienda ya se lee grande en el hero de
            abajo — repetirlo acá era ruido. "Ver página" va en leftSlot
            (izquierda, no derecha): es la acción principal de esta pantalla,
            mismo botón sólido que antes vivía en la card "Diseño de mi
            página" (bg-brand, más protagónico que un ícono chico). */}
        <StorePageHeader
          title=""
          leftSlot={tiendaInfo.slug && (
            <a href={`/${tiendaInfo.slug}`} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-brand hover:bg-brand-light text-white text-sm font-bold px-3 py-1.5 rounded-xl transition-colors shadow-sm shadow-brand/20">
              <Globe className="w-4 h-4" /><span>Ver página</span>
            </a>
          )}
        />
        <div className="flex-1 overflow-y-auto lg:pb-8 no-scrollbar">

        {/* ── Hero — clon LITERAL del hero REALMENTE en uso hoy en la vista
            pública: 'editorial' (HeroEditorial en commerce-modern.jsx,
            líneas ~1266-1430), no 'card' — TiendaPublicaRenderer.jsx tiene
            heroLayout forzado a 'editorial' (comentario "TEMP: forzado para
            preview" en la línea que arma <Template>), así que es lo que el
            dueño ve HOY en su propia tienda. Mismas clases/valores que
            .cm-hero-ed-*: foto banner de ACENTO (150px, no 240 — acá la
            info manda, no la foto), SIN card flotante separada — el logo
            (84px, radius 20) va en una fila (align-items:flex-end,
            marginTop:-40) directo contra el fondo de página, con el nombre
            en columna a su DERECHA (no centrado ni debajo). */}
        {/* Fondo del hero: MISMO azul-negro fijo que usa login (#040a14,
            AdminLogin.jsx línea 58: isDark ? '#040a14' : surface-solid) —
            pero SOLO acá, como color local del hero, NO tocando --surface-
            dim/--surface-solid globales (esa vía se probó y rompió bordes/
            cards/nav en toda la app: esos tokens alimentan --tp-bg/--tp-
            surface de la vista pública Y todo bg-surface-card/-2 del resto
            del admin, así que un valor "casi tan oscuro como el fondo"
            colapsó el contraste que muchos otros componentes daban por
            garantizado). En light sigue el token normal (var(--surface-
            solid)) — el enriquecido es un tratamiento de dark, como en
            login. El degradado de la foto funde hacia ESE MISMO color
            (heroBg), logrando la ilusión de desvanecimiento del banner
            contra el fondo real que lo rodea. */}
        <style>{`
          .sa-hero-ed-row { position: relative; z-index: 2; display: flex; align-items: flex-end; gap: 14px; padding: 0 18px; margin-top: -40px; }
          .sa-hero-ed-logo { width: 84px; height: 84px; border-radius: 20px; flex-shrink: 0; overflow: hidden;
            border: 4px solid rgb(var(--surface-solid-2-rgb)); box-shadow: 0 4px 10px rgba(0,0,0,.15); display: grid; place-items: center; }
          .dark .sa-hero-ed-logo { border-color: rgba(255,255,255,.10); box-shadow: 0 4px 14px rgba(0,0,0,.35), 0 0 0 1px rgba(255,255,255,.08); }
          .sa-hero-ed-name { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.02em;
            white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
          /* Flechas del carrusel — clon literal de .cm-hero-arrow (hero público real) */
          .sa-hero-arrow { background: rgba(255,255,255,.9); color: #18181b; border: 1px solid rgba(0,0,0,.08);
            transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
          .dark .sa-hero-arrow { background: rgba(82,82,82,.65); color: #fff; border: 1px solid rgba(255,255,255,.12); }
          @media (hover: hover) { .sa-hero-arrow:hover { filter: brightness(0.85); } }
          .sa-hero-arrow:active { transform: scale(0.93); transition: transform .06s ease; }
        `}</style>
        {/* Fondo del hero: MISMO valor que sa-page-bg (surface-dim en light,
            #040a14 en dark) — antes usaba --surface-solid (blanco de card)
            en light, un tono DISTINTO del fondo real de página, así el
            degradado de la foto (que funde hacia este color) no calzaba
            con lo que lo rodea. */}
        <header className="sa-hero-ed" style={{ position: 'relative', background: isDark ? '#040a14' : 'rgb(var(--surface-dim, 245 245 245))' }}>
          <div className="sa-hero-ed-photo" style={{ position: 'relative', overflow: 'hidden', height: 150, background: isDark ? '#040a14' : 'rgb(var(--surface-dim, 245 245 245))' }}>
            {heroFotos.length > 0
              ? heroFotos.map((src, i) => (
                  <img key={src} src={src} alt=""
                    style={{
                      position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block',
                      opacity: i === heroPhotoIdxClamped ? 1 : 0, transition: 'opacity .4s ease', pointerEvents: i === heroPhotoIdxClamped ? 'auto' : 'none',
                      WebkitMaskImage: 'linear-gradient(to top, transparent 0%, rgba(0,0,0,.2) 40px, #000 110px)',
                      maskImage: 'linear-gradient(to top, transparent 0%, rgba(0,0,0,.2) 40px, #000 110px)',
                    }} />
                ))
              : <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgb(var(--brand)), rgb(var(--surface-solid-2-rgb)))' }} />}
            {/* Oscurecido superior — legibilidad de flechas/dots sobre
                cualquier foto clara (mismo criterio que .cm-hero-ed-photo::before) */}
            <div style={{ position: 'absolute', inset: '0 0 auto 0', height: 64, zIndex: 1, background: 'linear-gradient(to bottom, rgba(0,0,0,.3), transparent)', pointerEvents: 'none' }} />
            {/* Flechas + dots — dots ARRIBA centrado (no abajo): ahí abajo
                pisa el logo de perfil (margin-top:-40px en la fila de
                abajo), y competían por el mismo espacio visual. */}
            {heroMultiFoto && (
              <>
                {heroPhotoIdxClamped > 0 && (
                  <button className="sa-hero-arrow" onClick={() => setHeroPhotoIdx(i => i - 1)} aria-label="Foto anterior"
                    style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }}>
                    <ChevronLeft size={18} />
                  </button>
                )}
                {heroPhotoIdxClamped < heroFotos.length - 1 && (
                  <button className="sa-hero-arrow" onClick={() => setHeroPhotoIdx(i => i + 1)} aria-label="Foto siguiente"
                    style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', zIndex: 2, width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }}>
                    <ChevronRight size={18} />
                  </button>
                )}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 z-[3] flex gap-1.5">
                  {heroFotos.map((_, i) => (
                    <button key={i} onClick={() => setHeroPhotoIdx(i)} aria-label={`Foto ${i + 1}`}
                      className="h-[5px] rounded-full transition-all" style={{ width: i === heroPhotoIdxClamped ? 16 : 5, background: i === heroPhotoIdxClamped ? '#fff' : 'rgba(255,255,255,.5)' }} />
                  ))}
                </div>
              </>
            )}
            {/* Cambiar portada — botón SIEMPRE visible (no hover): en
                mobile/táctil el hover no es confiable (no hay mouse que
                "entre" al elemento, y algunos navegadores lo disparan mal),
                así que en vez de depender de :hover para revelarlo, queda
                fijo en la esquina superior derecha — mismo lenguaje que las
                flechas del carrusel (sa-hero-arrow). */}
            <button className="sa-hero-arrow" onClick={() => openProfileEdit('portada')} aria-label="Cambiar portada"
              style={{ position: 'absolute', right: 10, top: 10, zIndex: 2, width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 2px rgba(0,0,0,.06)' }}>
              <Camera size={16} />
            </button>
          </div>

          {/* Fila logo (izquierda) + nombre (derecha) — SIN card flotante,
              directo contra el fondo de página, igual que HeroEditorial real. */}
          <div className="sa-hero-ed-row">
            {/* Wrapper SIN overflow — el badge tiene que sobresalir del
                cuadrado del logo, pero .sa-hero-ed-logo tiene overflow:
                hidden (necesario para recortar la foto/ícono adentro). Sin
                este wrapper aparte, el propio overflow:hidden del logo
                recortaba el badge que sobresalía por encima del borde. */}
            <div className="relative shrink-0" style={{ width: 84, height: 84 }}>
              <div className="sa-hero-ed-logo" style={{ width: '100%', height: '100%', background: tiendaInfo.foto ? 'rgb(var(--brand) / .15)' : 'rgb(var(--brand))' }}>
                {tiendaInfo.foto
                  ? <img src={tiendaInfo.foto} alt="" className="w-full h-full object-cover" />
                  : <User size={40} color="#fff" />}
              </div>
              {/* Badge de lápiz SIEMPRE visible (no overlay por hover): en
                  mobile/táctil el hover no es confiable — mismo criterio
                  que el botón de portada de arriba. */}
              <button onClick={() => openProfileEdit('foto')} aria-label="Cambiar foto de perfil"
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-brand text-white flex items-center justify-center shadow-md border-2"
                style={{ borderColor: isDark ? '#040a14' : 'var(--surface-solid, #fff)' }}>
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2 flex-wrap">
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
                    className="sa-hero-ed-name bg-transparent border-b-2 border-brand outline-none max-w-[220px]"
                    maxLength={120}
                  />
                ) : (
                  <h1
                    className="sa-hero-ed-name cursor-pointer hover:opacity-70 transition-opacity inline-flex items-center gap-1"
                    onClick={() => { setNombreDraft(tiendaInfo.nombre || ''); setEditingNombre(true); }}
                  >
                    {tiendaInfo.nombre}
                    {/* Lápiz siempre visible (no hover): en mobile no hay
                        forma de "pasar el mouse" para descubrirlo. */}
                    <Edit3 className="w-3.5 h-3.5 opacity-60 shrink-0" />
                  </h1>
                )}
              </div>
              {/* Descripción — reemplaza el botón "Descripción" que vivía
                  en la fila separada bajo el hero. Con texto: se muestra
                  clickeable (mismo lugar donde se lee en la vista pública).
                  Sin texto: placeholder tipo "+ agregar", mismo lenguaje
                  punteado que el resto del checklist. */}
              {tiendaInfo.descripcion ? (
                <p onClick={openDescripcionEditor}
                  className="text-xs text-ink-dim mt-1 cursor-pointer hover:text-brand transition-colors line-clamp-2">
                  {tiendaInfo.descripcion}
                </p>
              ) : (
                <button onClick={openDescripcionEditor}
                  className="text-xs text-brand font-semibold mt-1 hover:underline">
                  + Agregar descripción
                </button>
              )}
              {(tiendaInfo.horarios && Object.keys(tiendaInfo.horarios).length > 0) && (
                <div className="mt-1.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold" style={heroAbierta ? { background: 'color-mix(in srgb, #22C55E 14%, transparent)', color: '#22C55E' } : { background: 'color-mix(in srgb, #ef4444 14%, transparent)', color: '#ef4444' }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: heroAbierta ? '#22C55E' : '#ef4444' }} />
                    {heroAbierta ? 'Abierto' : 'Cerrado'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ── Acciones rápidas — reemplaza la vieja fila de Ver página /
            Portada / Descripción (esas se integraron donde corresponde
            visualmente: "Ver página" en el header, "Portada" como hover
            sobre la foto, "Descripción" bajo el título del hero). Este
            hueco ahora tiene lo que SÍ quedaba suelto sin atajo rápido:
            editar diseño y editar URL — antes solo vivían más abajo del
            todo, en la card "Diseño de mi página". */}
        <div className="max-w-3xl mx-auto px-5 lg:px-8 pt-5 grid grid-cols-2 gap-2">
          <button
            onClick={() => {
              setPaginaForm({ template: tiendaInfo.pagina?.template || 'commerce-modern', color: tiendaInfo.pagina?.color || '#e4002b', modoOscuro: tiendaInfo.pagina?.modoOscuro || false });
              setPublicPageForm({ slug: tiendaInfo.slug || '', tagline: tiendaInfo.tagline || '', whatsapp: tiendaInfo.whatsapp || tiendaInfo.telefono || '', instagram: tiendaInfo.instagram || '' });
              setPublicPageError(null);
              setScreen('mi-pagina');
            }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface-card dark:bg-white/8 text-xs font-bold hover:bg-brand/10 hover:text-brand transition-colors">
            <Palette className="w-3.5 h-3.5" /> Editar diseño
          </button>
          <button
            onClick={() => {
              setPublicPageForm(f => ({ ...f, slug: tiendaInfo.slug || '' }));
              setPublicPageError(null);
              setEditingPublicPage(true);
            }}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-surface-card dark:bg-white/8 text-xs font-bold hover:bg-brand/10 hover:text-brand transition-colors">
            <Link2 className="w-3.5 h-3.5" /> Editar URL
          </button>
        </div>

        {/* El chip de "Rubro" se sacó de acá — ver auditoría UX hallazgo A3:
            solo se usa al CREAR la tienda para el preset inicial de módulos
            (Catálogo vs. Ofertas, ver netlify/functions/_lib/modules.js);
            cambiarlo después no mueve nada, y las categorías disponibles
            están cableadas a comida rápida (no aplican a una tienda de
            ofertas). Ocupaba una franja entera sugiriendo una importancia
            que no tiene. El dato tienda.rubros se sigue guardando. */}

        <div className="max-w-3xl mx-auto px-5 lg:px-8 mt-5 space-y-5">

          {/* ── Suscripción — resumen, detalle completo en su propia pantalla.
              El conteo de ofertas activas se sacó de acá: es redundante con
              Estadísticas y tiene más sentido como barra de resumen dentro
              de OfertasScreen (contexto de gestión), no en el perfil general. */}
          <button onClick={() => navigateTo('suscripcion')} className="w-full flex items-center gap-3 bg-surface-card rounded-2xl p-4 border border-slate-100 dark:border-white/8 hover:border-brand/30 transition-colors text-left">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isActiva ? 'bg-brand/10 text-brand' : 'bg-rose-500/10 text-rose-500'}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm">
                Plan {tiendaData?.suscripcion?.plan ? tiendaData.suscripcion.plan.charAt(0).toUpperCase() + tiendaData.suscripcion.plan.slice(1) : '—'}
              </p>
              <p className={`text-xs font-semibold ${isActiva ? (dias !== null && dias <= 7 ? 'text-amber-500' : 'text-brand') : 'text-rose-500'}`}>
                {isActiva && dias !== null && dias <= 7
                  ? `Vence en ${dias} día${dias === 1 ? '' : 's'}`
                  : isActiva
                    ? 'Activa'
                    : 'Vencida'}
                {tiendaData?.suscripcion?.vence && (dias === null || dias > 7 || !isActiva) && (
                  <span className="text-ink-dim font-medium"> · {isActiva ? 'vence' : 'venció'} {new Date(tiendaData.suscripcion.vence).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</span>
                )}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-ink-dim shrink-0" />
          </button>

          {/* La card con el listado de fotos de portada se sacó de acá — el
              dueño ya puede ver y editar sus fotos de portada desde el
              checklist de completitud de perfil (item "Portada", ver
              profileItems arriba) que abre el mismo sheet (MediaEditorModal,
              mediaModal='galeria'). Mostrar el mismo listado dos veces en la
              misma pantalla era redundante. */}

          {/* ── Centro de completitud — generado ÍNTEGRAMENTE desde
              profileItems (mismo array que calcula el anillo, arriba). Antes
              esta lista estaba escrita a mano con solo 4 de los 12 pasos
              (teléfono/IG/ubicación/tagline): el % nunca coincidía con lo
              que el dueño podía ver acá (hallazgo A5). Ahora son la MISMA
              fuente: el anillo y las filas nunca se desincronizan, y las
              4 categorías (perfil/config/contenido/personalización) hacen
              de índice de TODO lo que hay para hacer en la tienda, no solo
              de datos de contacto.
              Cada fila es un ACCESO DIRECTO al editor real de esa cosa — no
              hay inputs acá (ver hallazgo B5: esto es un "invitador", no un
              editor). El valor mostrado cuando está completo sale de
              rowValue(), un mapeo puntual por key (cada campo tiene su
              propio formato de texto). */}
          <div className="bg-surface-card rounded-3xl border border-slate-100 dark:border-white/8 overflow-hidden">
            {/* El padding vive EN el botón (no en el div contenedor de
                afuera) — así el área clickeable cubre toda la tarjeta,
                borde a borde. Antes el p-5 estaba en el div de afuera: tocar
                cerca del borde caía fuera del <button>, y solo el centro
                (donde sí estaba el botón) respondía al toggle. */}
            <button
              onClick={() => setProfileChecklistCollapsed(c => !c)}
              className="w-full flex items-center gap-4 text-left p-5"
              aria-expanded={!profileChecklistCollapsed}
            >
              {/* Ring SVG — pointer-events:none: es puramente decorativo,
                  no debe poder "robar" el click del botón que lo envuelve. */}
              <div className="relative shrink-0 w-[56px] h-[56px]" style={{ pointerEvents: 'none' }}>
                <svg width="56" height="56" viewBox="0 0 76 76">
                  <circle cx="38" cy="38" r={r} fill="none" strokeWidth="7" className="stroke-surface-card-2 dark:stroke-white/10" />
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
                  <span className="text-xs font-black">{profilePct}%</span>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold">Completá tu tienda</h3>
                <p className="text-xs text-ink-dim mt-0.5">
                  {profilePct === 100 ? '¡Todo listo!' : `${profileDone} de ${profileItems.length} pasos completos`}
                </p>
              </div>
              <ChevronDown className={`w-4 h-4 text-ink-dim shrink-0 transition-transform ${profileChecklistCollapsed ? '' : 'rotate-180'}`} style={{ pointerEvents: 'none' }} />
            </button>
            {/* Grid-rows 0fr↔1fr animado — a diferencia de max-height con un
                valor fijo, esta técnica anima a la altura REAL del contenido
                (que cambia según cuántos pasos falten/Ver más), sin saltos
                ni recortes. El contenido siempre está montado (necesario
                para poder animar), solo cambia el alto disponible. */}
            <div
              style={{
                display: 'grid',
                gridTemplateRows: profileChecklistCollapsed ? '0fr' : '1fr',
                transition: 'grid-template-rows .25s ease',
              }}
            >
              <div style={{ overflow: 'hidden', minHeight: 0 }}>
                <div className="px-5 pb-5">
                {(() => {
              // Solo los PENDIENTES ocupan lugar acá — un paso ya hecho
              // cumplió su función de invitar, no necesita seguir listado
              // (antes se mostraban todos, completos o no, forzando el alto
              // de toda la pantalla sin aportar nada nuevo una vez hecho).
              // UNA sola lista aplanada (no un "Ver más" por categoría): el
              // label de grupo se muestra solo cuando cambia respecto al
              // ítem anterior, como separador dentro del mismo recorte.
              const groupLabels = { perfil: 'Perfil', config: 'Configuración', contenido: 'Contenido', custom: 'Personalización' };
              const pending = profileItems.filter(i => !i.done);
              if (!pending.length) {
                return <p className="text-xs text-ink-dim mt-4">Ya completaste todos los pasos de tu perfil.</p>;
              }
              const visible = profileChecklistExpanded ? pending : pending.slice(0, 5);
              const hiddenCount = pending.length - visible.length;
              let lastGroup = null;
              return (
                <div className="mt-4">
                  <div className="space-y-2">
                    {visible.map(item => {
                      const Icon = item.icon;
                      const showLabel = item.group !== lastGroup;
                      lastGroup = item.group;
                      return (
                        <React.Fragment key={item.key}>
                          {showLabel && (
                            <p className="text-[11px] font-black text-ink-dim uppercase tracking-widest pt-1 first:pt-0">{groupLabels[item.group]}</p>
                          )}
                          <button onClick={item.action}
                            className="w-full flex items-center gap-3 p-3 rounded-2xl border-2 border-dashed border-slate-200 dark:border-white/10 hover:border-brand dark:hover:border-brand/40 transition-colors group text-left">
                            <div className="w-9 h-9 bg-surface-card-2 dark:bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4 text-ink-dim" />
                            </div>
                            <div>
                              <p className="text-xs text-ink-dim font-medium">{item.label}</p>
                              <p className="text-xs text-brand font-semibold">+ Agregar</p>
                            </div>
                          </button>
                        </React.Fragment>
                      );
                    })}
                  </div>
                  {hiddenCount > 0 && (
                    <button onClick={() => setProfileChecklistExpanded(true)}
                      className="w-full text-center text-xs font-semibold text-brand py-2 mt-2 hover:underline">
                      Ver {hiddenCount} más
                    </button>
                  )}
                  {profileChecklistExpanded && pending.length > 5 && (
                    <button onClick={() => setProfileChecklistExpanded(false)}
                      className="w-full text-center text-xs font-semibold text-ink-dim py-2 mt-2 hover:underline">
                      Ver menos
                    </button>
                  )}
                </div>
              );
                })()}
                </div>
              </div>
            </div>
          </div>

          {/* Card "URL pública" eliminada — quedaba redundante con el botón
              "Editar URL" de la fila de acciones rápidas de arriba, que ya
              cubre mostrar/editar el slug. Esta card no aportaba una
              función propia salvo "Compartir" (navigator.share/copiar
              link), que no tiene reemplazo directo hoy en otro lugar de
              esta pantalla — "Ver página" del header solo ABRE la URL. */}

          {/* Suscripción: la card resumen de arriba (junto a Estadísticas)
              ya muestra estado+plan y navega a la pantalla completa, donde
              viven los botones reales de upgrade/pago por plan — esta card
              grande duplicaba exactamente lo mismo, se sacó. */}

          {/* ── Cuenta Google ────────────────────────────────────────────── */}
          <div className="bg-surface-card rounded-3xl border border-slate-100 dark:border-white/8 p-5">
            <h3 className="font-bold mb-4">Cuenta Google</h3>
            <div className="flex items-center gap-3 mb-4 p-3 bg-surface-card-2 dark:bg-white/5 rounded-2xl">
              <div className="w-11 h-11 bg-brand/15 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
                {renderAccountAvatar()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{firebaseUser?.displayName || 'Usuario'}</p>
                <p className="text-xs text-ink-dim truncate">{firebaseUser?.email || ''}</p>
              </div>
            </div>
            <button onClick={onLogout}
              className="w-full py-3 text-rose-600 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-100 dark:hover:bg-rose-500/15 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors border border-rose-200 dark:border-rose-500/20">
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          </div>

          {/* Mismo ajuste que en Ofertas: espaciador SOLO de la altura del
              nav (84px), no un pb-24 mezclado con el aire estético — el
              padding real de esta pantalla ya viene de cada bloque interno
              (px-5 lg:px-8, space-y-5), así que este bloque cubre nav sin
              sumar aire extra encima de eso. */}
          <div style={{ height: 84 }} className="lg:hidden" aria-hidden="true" />
        </div>
        </div>{/* fin overflow-y-auto */}
      </div>
    );
  };

  // ── "Más" bottom sheet ─────────────────────────────────────────────────────
  const MoreSheet = () => (
    <div className="lg:hidden fixed inset-0 z-[4400] flex flex-col justify-end" onClick={() => setMoreSheetOpen(false)}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className="relative bg-surface-card rounded-t-3xl px-4 pt-3 pb-4 shadow-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 5.5rem)', animation: 'sheet-up .22s ease' }} onClick={e => e.stopPropagation()}>
        <div className="w-10 h-1 rounded-full bg-surface-card-2 dark:bg-white/15 mx-auto mb-4" />
        <div className="flex items-center gap-3 px-1 mb-3">
          <div className="w-11 h-11 bg-primary/10 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
            {firebaseUser?.photoURL ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" /> : <span className="text-lg font-bold text-primary">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</span>}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm truncate">{firebaseUser?.displayName || 'Usuario'}</p>
            <p className="text-xs text-ink-dim truncate">{tiendaInfo.nombre}</p>
          </div>
        </div>
        <div className="space-y-0.5">
          {[
            // "Inicio (marketplace)" se sacó: es el feed multi-tienda del
            // sitio público, no aplica a la gestión de un mono-negocio.
            // Estadísticas y Suscripción ya no van gateadas por isEmpresa
            // (ver navItems del sidebar) — visibles para todo plan/rubro.
            { label: 'Estadísticas', icon: TrendingUp, action: () => { navigateTo('stats'); setMoreSheetOpen(false); } },
            { label: 'Suscripción', icon: CreditCard, action: () => { navigateTo('suscripcion'); setMoreSheetOpen(false); } },
            { label: 'Diseño de página', icon: Palette, action: () => { setPaginaForm({ template: tiendaData?.pagina?.template || 'commerce-modern', color: tiendaData?.pagina?.color || '#e4002b', modoOscuro: tiendaData?.pagina?.modoOscuro || false }); setPublicPageForm({ slug: tiendaData?.slug || '', tagline: tiendaData?.tagline || '', whatsapp: tiendaData?.whatsapp || tiendaData?.telefono || '', instagram: tiendaData?.instagram || '' }); setPublicPageError(null); setScreen('mi-pagina'); setMoreSheetOpen(false); } },
            isAdmin ? { label: 'Panel Admin', icon: ShieldCheck, action: () => { onOpenAdmin?.(); setMoreSheetOpen(false); } } : null,
          ].filter(Boolean).map(({ label, icon: Icon, action }) => (
            <button key={label} onClick={action} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors text-left">
              <Icon className="w-5 h-5 text-ink-dim shrink-0" />
              <span className="font-semibold text-sm">{label}</span>
            </button>
          ))}
          <div className="border-t border-slate-100 dark:border-white/8 my-2" />
          {isAdmin && (
            <button onClick={() => { toggleMockMode(); setMoreSheetOpen(false); }} className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-colors ${mockMode ? 'bg-violet-50 dark:bg-violet-500/10 text-violet-600' : 'hover:bg-surface-card-2 dark:hover:bg-white/5 text-ink-dim'}`}>
              <FlaskConical className="w-5 h-5 shrink-0" />
              <span className="font-semibold text-sm">{mockMode ? 'Mock ON — desactivar' : 'Datos mock'}</span>
            </button>
          )}
          <button onClick={toggleTheme} className="w-full flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors">
            {isDark ? <Sun className="w-5 h-5 text-amber-400 shrink-0" /> : <Moon className="w-5 h-5 text-ink-dim shrink-0" />}
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
    const activeProducts = misProductos.filter(o => o.activa !== false && o.visible !== false).length;
    const atProductLimit = activeProducts >= productLimit;
    const usaCatalogo = isModuleActive(tiendaData, 'catalogo');
    const opts = [
      {
        icon: Tag,
        color: atProductLimit ? 'bg-surface-card-2 dark:bg-white/8 text-ink-dim' : 'bg-primary/10 text-primary',
        title: usaCatalogo ? 'Nuevo producto' : 'Nueva oferta',
        desc: atProductLimit
          ? `Límite alcanzado: ${productLimit} ${usaCatalogo ? 'productos' : 'ofertas'} (${isEmprendimiento ? 'upgrade a Empresa' : 'upgrade a Premium'})`
          : usaCatalogo ? 'Publicá un producto en tu vitrina' : 'Publicá una oferta con foto',
        locked: atProductLimit,
        action: () => {
          if (atProductLimit) return;
          closeCreateSheet();
          if (usaCatalogo) {
            setProductoEditing(null);
            setProductoForm({ titulo: '', descripcion: '', precio: '', precioOriginal: '', ventaja: [], financiacion: '', stock: '1', condicion: 'nuevo', categoryId: null, contactoWhatsapp: '' });
            setProductoFotoFiles([]);
            setProductoFotoPreviews([]);
            setProductoSaveErr(null);
            setProductoAttributes({});
            setProductoShowForm(true);
          } else {
            setOfertaEditing(null);
            setOfertaForm({ nombre: '', expireAt: '', visible: true });
            setOfertaFotoFile(null);
            setOfertaFotoPreview(null);
                  setOfertaShowForm(true);
          }
        }
      },
      { icon: Package, color: 'bg-surface-card-2 dark:bg-white/8 text-ink-dim', title: 'Búsqueda laboral', desc: 'Próximamente disponible', locked: true, action: () => {} },
    ];
    return (
      <div className="lg:hidden fixed inset-0 z-[4000] flex flex-col justify-end" onClick={closeCreateSheet}>
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" style={{ animation: createSheetClosing ? 'backdrop-out .22s ease forwards' : 'backdrop-in .22s ease' }} />
        <div className="relative bg-surface-card rounded-t-3xl px-4 pt-3 shadow-2xl" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 6rem)', animation: createSheetClosing ? 'sheet-down .22s ease forwards' : 'sheet-up .22s ease' }} onClick={e => e.stopPropagation()}>
          <div className="w-10 h-1 rounded-full bg-surface-card-2 dark:bg-white/15 mx-auto mb-4" />
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
                    <p className="text-xs text-ink-dim">{opt.desc}</p>
                  </div>
                  {opt.locked && <span className="ml-auto text-xs bg-surface-card-2 dark:bg-white/10 text-ink-dim px-2 py-1 rounded-lg font-semibold">Pronto</span>}
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
    <>
      {/* Paleta de dark del panel de tienda: azul-negro enriquecido
          (#040a14, mismo tono que login/splash — AdminLogin.jsx/
          LokalLoader.jsx), scopeada DENTRO de .sa-root vía overrides CSS —
          NO tocando --surface-solid/--surface-solid-2 globales (esas
          variables también alimentan la vista pública de tienda vía
          --tp-surface, y bajarles el contraste ahí rompió bordes/cards/nav
          la primera vez que se probó). El scope .sa-root (clase en el
          wrapper raíz de StoreApp) garantiza que esto NUNCA se filtre a
          tienda pública, aunque ambas corran bajo la misma clase .dark.
            - .sa-page-bg: fondo de PÁGINA de cada screen (antes gris).
            - bg-surface-card/-2: quedan overrideadas a un azul-negro casi
              neutro (derivado de blanco 7%/12% sobre #040a14, NO gris puro
              desconectado) — así toda card/input arma con el fondo en vez
              de flotar como un gris ajeno encima. */}
      <style>{`
        /* Fondo de página en LIGHT: --surface-dim (#f5f5f5), la MISMA
           jerarquía de 3 niveles que ya usa la vista pública de tienda
           (--tp-bg/--tp-surface/--tp-surface2 → --surface-dim/-solid/-2):
           fondo de página ligeramente gris, card blanca por encima
           (bg-surface-card, #fff), superficie secundaria/chip un escalón
           más (bg-surface-card-2, #f0f0f0). Antes el fondo de página usaba
           --surface-solid-2 directo — el MISMO valor que bg-surface-card-2,
           así que cualquier botón/chip con ese fondo (ej. "Editar diseño"/
           "Editar URL" bajo el hero) se fundía invisible contra la página. */
        .sa-page-bg { background: rgb(var(--surface-dim, 245 245 245)); }
        .dark .sa-root.sa-page-bg,
        .dark .sa-root .sa-page-bg { background: #040a14; }
        .dark .sa-root .bg-surface-card   { background-color: #161b24 !important; }
        .dark .sa-root .bg-surface-card-2 { background-color: #222730 !important; }
      `}</style>
    <div className="flex min-h-screen sa-root sa-page-bg">
      {Sidebar()}
      {/* spacer so content shifts with sidebar on desktop */}
      <div className="hidden lg:block shrink-0" style={{ width: sidebarExpanded ? 224 : 64, transition: 'width 380ms cubic-bezier(0.16,1,0.3,1)' }} />
      <div className="flex-1 min-w-0">
        {/* Banner suscripción — vencida o por vencer */}
        {!isActiva && (
          <div className="bg-rose-500 text-white px-4 py-2.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Lock className="w-4 h-4 shrink-0" />
              <span className="font-semibold">Tu suscripción venció. Renoválo para seguir recibiendo pedidos.</span>
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
          {screen === 'mensajes' && isModuleActive(tiendaData, 'mensajes') && MensajesScreen()}
          {screen === 'stats' && StatsScreen()}
          {screen === 'productos' && (isModuleActive(tiendaData, 'catalogo') ? ProductosScreen() : OfertasScreen())}
          {screen === 'suscripcion' && SuscripcionScreen()}
          {screen === 'mi-pagina' && MiPaginaScreen()}
          {screen === 'perfil' && PerfilScreen()}
          {screen === 'inicio' && InicioScreen()}
        </div>
        {BottomNav()}
        {moreSheetOpen && MoreSheet()}
        {CreateSheet()}
        {ProductoFormOverlay()}
        {OfertaFormOverlay()}
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
        {FieldEditorSheet()}
        {PublicUrlSheet()}

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
                      className="flex items-center gap-2 bg-surface-card border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl px-2.5 py-2 hover:shadow-2xl transition-shadow"
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
                        <p className="text-xs font-bold text-ink dark:text-ink-dim truncate max-w-[90px]">{clientLabel(convo.partnerUid)}</p>
                        {floatingChats.length > 1 && <p className="text-[10px] text-ink-dim">+{floatingChats.length - 1} más</p>}
                      </div>
                      {totalUnread > 0 && (
                        <span className="w-5 h-5 bg-rose-500 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                          {totalUnread > 9 ? '9+' : totalUnread}
                        </span>
                      )}
                      <div onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); setFloatingChats([]); }}
                        className="w-6 h-6 rounded-xl flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/10 text-ink-dim shrink-0 transition-colors cursor-pointer">
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
                    <div key={fc.key} className="pointer-events-auto flex items-center gap-2 bg-surface-card border border-slate-200 dark:border-white/10 rounded-2xl shadow-xl px-2.5 py-2 cursor-pointer hover:shadow-2xl transition-shadow select-none"
                      onClick={() => toggleFloatingCollapse(fc.key)}>
                      <div className="relative shrink-0">
                        <div className={`w-9 h-9 rounded-xl ${avatarColor(convo.partnerUid)} flex items-center justify-center text-white font-bold text-xs`}>
                          {(convo.partnerUid || 'C').slice(-2).toUpperCase()}
                        </div>
                        {unread > 0 && <span className="absolute -top-1 -right-1 min-w-4 h-4 bg-rose-500 rounded-full text-white text-[9px] font-bold flex items-center justify-center px-0.5">{unread > 9 ? '9+' : unread}</span>}
                      </div>
                      {!compact && <span className="font-bold text-sm text-ink dark:text-ink-dim max-w-[100px] truncate">{clientLabel(convo.partnerUid)}</span>}
                      <ChevronDown className="w-4 h-4 text-ink-dim rotate-180 shrink-0" />
                      <button onMouseDown={e => e.stopPropagation()} onClick={e => { e.stopPropagation(); closeFloatingChat(fc.key); }}
                        className="w-7 h-7 rounded-xl flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/10 text-ink-dim shrink-0 transition-colors">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );

                  /* Expandido */
                  return (
                    <div key={fc.key} className="pointer-events-auto w-80 h-[520px] bg-surface-card flex flex-col rounded-3xl shadow-2xl border border-slate-200 dark:border-white/10 overflow-hidden">
                      {/* Header */}
                      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-slate-100 dark:border-white/8 shrink-0">
                        <button onClick={() => toggleFloatingCollapse(fc.key)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/10 transition-colors" title="Minimizar">
                          <ChevronDown className="w-4 h-4 text-ink-dim" />
                        </button>
                        <div className={`w-8 h-8 rounded-xl ${avatarColor(convo.partnerUid)} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                          {(convo.partnerUid || 'C').slice(-2).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm truncate">{clientLabel(convo.partnerUid)}</p>
                          <p className="text-[10px] text-ink-dim">{msgs.length} mensaje{msgs.length !== 1 ? 's' : ''}</p>
                        </div>
                        <button onClick={() => { navigateTo('mensajes'); setInboxSelectedKey(fc.key); setInboxMobileView('chat'); closeFloatingChat(fc.key); }}
                          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/10 transition-colors" title="Abrir en mensajes">
                          <ExternalLink className="w-3.5 h-3.5 text-ink-dim" />
                        </button>
                        <button onClick={() => closeFloatingChat(fc.key)}
                          className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-surface-card-2 dark:hover:bg-white/10 transition-colors" title="Cerrar">
                          <X className="w-3.5 h-3.5 text-ink-dim" />
                        </button>
                      </div>

                      {/* Mensajes */}
                      <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-2 bg-surface-card-2 dark:bg-surface-card-2">
                        {msgs.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                            <MessageSquare className="w-8 h-8 text-ink-dim dark:text-ink" />
                            <p className="text-xs text-ink-dim">Iniciá la conversación</p>
                          </div>
                        ) : msgs.map(msg => {
                          const isStore = msg.from === storeId;
                          return (
                            <div key={msg.id || msg.ts} className={`flex flex-col ${isStore ? 'items-end' : 'items-start'} gap-0.5`}>
                              {msg.text && (
                                <div className={`max-w-[80%] rounded-2xl px-3 py-2 ${isStore ? 'bg-brand text-white' : 'bg-surface-card shadow-sm text-ink dark:text-ink-dim'}`}>
                                  <p className="text-sm">{msg.text}</p>
                                  <p className={`text-[10px] mt-0.5 ${isStore ? 'text-white/60' : 'text-ink-dim'}`}>{fmtTime(msg.ts)}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Input */}
                      <div className="shrink-0 border-t border-slate-100 dark:border-white/8 bg-surface-card px-3 py-2.5">
                        <div className="flex gap-2 items-end">
                          <div className="flex-1 bg-surface-card-2 dark:bg-white/8 rounded-2xl px-3 py-2 flex items-center">
                            <textarea value={fc.msg} onChange={e => setFloatingMsg(fc.key, e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendFloating(); } }}
                              placeholder="Responder..." rows={1}
                              className="bg-transparent text-sm text-ink dark:text-ink-dim placeholder:text-ink-dim focus:outline-none w-full resize-none" />
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
    </>
  );
}
