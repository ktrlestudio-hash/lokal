import React, { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { PaywallModal as PaywallModalUI, PremiumModal as PremiumModalUI, SuscripcionContent } from './store/PricingUI';
import { haptic } from './haptic';
import { MOCK_PRODUCTOS, MOCK_INBOX, MOCK_HISTORIAL_PAGOS, MOCK_STATS } from './mockStoreData';
import { TiendaPublicaRenderer, TEMPLATES_META } from './tienda-publica/TiendaPublicaRenderer.jsx';
import ImageCropModal from './ImageCropModal.jsx';
import { SECCIONES_DEFAULT } from './tienda-publica/tokens.js';
import { isModuleActive, deriveColorPalette } from './tienda-publica/utils.js';
import { useGeolocation } from './hooks';
import TransferenciaModal from './store/modals/TransferenciaModal';
import { useProductosOfertas } from './store/hooks/useProductosOfertas';
import { useInbox } from './store/hooks/useInbox';
import { useTiendaPatch } from './store/hooks/useTiendaPatch';
import { useCapaUI } from './store/navegacion/useCapaUI.js';
import { useImportador } from './store/components/importador/useImportador.js';
import { ImportadorPrecios } from './store/components/importador/ImportadorPrecios.jsx';
import { ImportadorFlotante } from './store/components/importador/ImportadorFlotante.jsx';
import { StorePageHeader as StorePageHeaderBase } from './store/components/StorePageHeader.jsx';
import { StoreSidebar as StoreSidebarBase } from './store/components/StoreSidebar.jsx';
import { StoreBottomNav as StoreBottomNavBase } from './store/components/StoreBottomNav.jsx';
import { StoreMoreSheet as StoreMoreSheetBase } from './store/components/StoreMoreSheet.jsx';
import { StoreCreateSheet as StoreCreateSheetBase } from './store/components/StoreCreateSheet.jsx';
import { OfertasScreen as OfertasScreenBase } from './store/screens/OfertasScreen.jsx';
import { ProductosScreen as ProductosScreenBase } from './store/screens/ProductosScreen.jsx';
import { StatsScreen as StatsScreenBase } from './store/screens/StatsScreen.jsx';
import { PerfilScreen as PerfilScreenBase } from './store/screens/PerfilScreen.jsx';
import { MensajesScreen as MensajesScreenBase } from './store/screens/MensajesScreen.jsx';
import {
  Store, Package, MessageSquare, ArrowLeft, Home,
  Send, MapPin, CheckCircle, X, Loader2, AlertCircle,
  Sun, Moon, AlertTriangle, ChevronDown, Camera,
  Lock, Zap, CalendarDays, RefreshCw,
  Trash2,
  ExternalLink, Link2, Save,
  Gift, Wrench, Copy, Info, Clock,
  Building2,
  Navigation
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
import { LogoBadge } from './Brand';
import CategoryPicker from './CategoryPicker';
import { VENTAJA_CONFIG } from './utils/ventajaConfig';
import { calcularBadges, BADGE_CONFIG } from './utils/productBadges';
import ProductoFormComp from './components/ProductoForm';
import ProductoSuccessModal from './components/ProductoSuccessModal';
import DatePicker from './components/DatePicker';
import { CATEGORIES as BASE_CATEGORIES, getCategoryPath, getAllDescendants } from './categories';
import CategoryIcon from './CategoryIcon';
import { apiFetch } from './api';
import { PlaceAutocomplete, MapPicker, uploadImagenTienda, uploadOfertaImages, reverseGeocode } from './storeFormUtils';

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

  // Antes la pantalla "productos" del nav renderizaba SOLO Ofertas o SOLO
  // Catálogo según isModuleActive('catalogo') — una tienda con los dos
  // módulos activos no tenía forma de administrar el que perdía ese
  // if/else. Con ambosModulosActivos, OfertasScreen/ProductosScreen se
  // filtran entre sí por tipo (ver el shadowing de misProductos dentro de
  // cada una) y el selector de abajo deja elegir cuál ver.
  const ambosModulosActivos = isModuleActive(tiendaData, 'ofertas') && isModuleActive(tiendaData, 'catalogo');

  const STORE_SCREENS = ['perfil', 'mensajes', 'productos', 'stats', 'suscripcion'];
  // Key por tienda (no global al navegador): sin el id, la última pantalla
  // visitada por UNA cuenta se filtraba a la sesión de cualquier otra
  // cuenta que abriera el panel en el mismo navegador (ej. probando varias
  // cuentas de Google en dev) — cada tienda recuerda la suya, aisladas.
  const storeScreenKey = tiendaData?.id ? `lokal-store-screen-${tiendaData.id}` : null;
  const savedScreen = storeScreenKey ? localStorage.getItem(storeScreenKey) : null;
  const [screen, setScreen] = useState(STORE_SCREENS.includes(savedScreen) ? savedScreen : 'perfil');

  // Sub-selector DENTRO de la pantalla "productos", solo relevante cuando
  // la tienda tiene los módulos 'ofertas' Y 'catalogo' activos a la vez —
  // antes de esto, la pantalla renderizaba SOLO Ofertas o SOLO Catálogo
  // según isModuleActive('catalogo'), así que una tienda con ambos módulos
  // no tenía forma de administrar el que perdía el if/else (ver
  // plan de profesionalización, Fase 2). 'ofertas' por default: es la
  // vista más simple, coherente con que LOKAL LINKS nace mono-rubro
  // 'ofertas' y el catálogo es el módulo que se agrega encima.
  const [subScreenProductos, setSubScreenProductos] = useState('ofertas');

  // Mock test mode (solo admins)
  const [mockMode, setMockMode] = useState(false);

  // Transición suave entre screens
  const [screenVisible, setScreenVisible] = useState(true);

  // Sidebar collapse
  const [sidebarExpanded, setSidebarExpanded] = React.useState(() => localStorage.getItem('lokal-store-sidebar-pinned') !== 'false');
  const [sidebarPinned, setSidebarPinned] = React.useState(() => localStorage.getItem('lokal-store-sidebar-pinned') !== 'false');

  // Datos
  const [tienda, setTienda] = useState(null);
  const tiendaPatch = useTiendaPatch({ tiendaId: tienda?.id || tiendaData?.id, setTienda, onTiendaUpdate });

  // ── Inbox (mensajes directos de clientes) ─────────────────────────────────
  // Estado + fetch en useInbox (Fase 3, mismo criterio que
  // useProductosOfertas) — las mutaciones puntuales de una conversación
  // siguen abajo, entrelazadas con estado de UI del formulario de chat.
  const inbox = useInbox();
  const inboxConvos = inbox.convos;
  const setInboxConvos = inbox.setConvos;
  const inboxLoading = inbox.loading;
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

  // Productos — estado + fetch + mutaciones CRUD viven en useProductosOfertas
  // (Fase 3 del plan: primer estado realmente compartido extraído a hook,
  // se usa en 30+ lugares de este componente, no solo las 2 screens de
  // productos). misProductosSinFiltrar (no "misProductos" a secas): el
  // nombre corto queda reservado para la versión filtrada por tipo que
  // declaran OfertasScreen/ProductosScreen dentro de sí mismas (shadowing
  // local) — ver el comentario ahí. Todo lo demás en este componente (badge
  // del nav, búsqueda de ítems en Mensajes, menciones) sigue leyendo la
  // lista COMPLETA acá, sin filtrar, que es lo que necesitan.
  const productosOfertas = useProductosOfertas(tiendaData?.id);
  const misProductosSinFiltrar = productosOfertas.items;
  const setMisProductos = productosOfertas.setItems;
  const loadingProductos = productosOfertas.loading;
  const fetchMisProductos = productosOfertas.fetchAll;

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
  const [quickPriceOpen, setQuickPriceOpen] = useState(false); // edición rápida en cadena (precio rápido)
  // importadorVisible: si el wizard fullscreen está en pantalla. Separado
  // del estado del hook (useImportador, más abajo) a propósito: minimizar
  // solo cambia esto a false, el trabajo real (fetch en curso, progreso)
  // sigue vivo en el hook sin importar si el wizard se ve o no — así
  // sobrevive a que el usuario navegue a otra pantalla del admin.
  const [importadorVisible, setImportadorVisible] = useState(false);
  const importador = useImportador(tienda?.id || tiendaData?.id, { onAplicado: () => fetchMisProductos?.() });
  const abrirImportador = () => setImportadorVisible(true);
  const minimizarImportador = () => setImportadorVisible(false);
  const cerrarImportadorDeVerdad = () => { importador.reiniciar(); setImportadorVisible(false); };
  // El chip flotante aparece cuando hay algo real en curso Y el wizard no
  // está a la vista — nunca cuando está en 'subir' sin nada elegido
  // todavía (nada que "seguir en segundo plano" ahí).
  const importadorFlotanteVisible = !importadorVisible && (importador.hayTrabajoEnCurso || importador.paso === 'resultado');
  const [productoShowForm, setProductoShowForm] = useState(false);
  const [productoEditing, setProductoEditing] = useState(null);
  const [productoForm, setProductoForm] = useState({ titulo: '', descripcion: '', precio: '', precioOriginal: '', badgesForzados: null, financiacion: '', stock: '1', condicion: 'nuevo', categoryId: null, contactoWhatsapp: '' });
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

  // ── Capas de UI ↔ historial del navegador ────────────────────────────────
  // Cada sheet/modal/overlay abierto es UNA entrada de historial: el atrás
  // nativo cierra la capa de arriba (LIFO) en vez de salir de la app. Un
  // único dueño de la pila evita que varios listeners de popstate compitan
  // por el mismo evento — ver src/store/navegacion/uiStack.js.
  // Cuando no queda ninguna capa abierta, el atrás hace lo nativo (salir),
  // que es el comportamiento esperado y no se pelea.
  useCapaUI({ abierto: moreSheetOpen, onCerrar: () => setMoreSheetOpen(false) });
  // Arrow que difiere la resolución: closeCreateSheet se declara más abajo
  // (const en TDZ acá), pero para cuando esta callback se ejecute ya existe.
  useCapaUI({ abierto: createSheetOpen, onCerrar: () => closeCreateSheet() });
  useCapaUI({ abierto: productoShowForm, onCerrar: () => setProductoShowForm(false) });
  useCapaUI({ abierto: ofertaShowForm, onCerrar: () => setOfertaShowForm(false) });
  useCapaUI({ abierto: quickPriceOpen, onCerrar: () => setQuickPriceOpen(false) });
  useCapaUI({ abierto: showPaywall, onCerrar: () => setShowPaywall(false) });
  useCapaUI({ abierto: showPremiumModal, onCerrar: () => setShowPremiumModal(false) });
  useCapaUI({ abierto: showTransferenciaModal, onCerrar: () => setShowTransferenciaModal(false) });
  useCapaUI({ abierto: !!fieldEditor, onCerrar: () => setFieldEditor(null) });
  useCapaUI({ abierto: locationModal, onCerrar: () => setLocationModal(false) });
  useCapaUI({ abierto: horarioModal, onCerrar: () => setHorarioModal(false) });

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
  // setMisProductos = productosOfertas.setItems (useState real dentro del
  // hook) — identidad estable entre renders, igual que cualquier setState
  // directo; el linter ya no lo reconoce como tal por venir indirecto.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // setMisProductos estable, ver comentario en subirOfertaEnColaAdmin arriba.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
  // setMisProductos estable, ver comentario en subirOfertaEnColaAdmin arriba.
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const persistTiendaPatch = tiendaPatch;

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

  const fetchInbox = () => {
    if (mockMode) return;
    inbox.fetchInbox(tienda?.id || tiendaData?.id);
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
      // uploadImagenTienda, no uploadFile: redimensiona antes de subir. Estas
      // fotos se muestran en el hero de la tienda —lo primero que ve un
      // visitante— y venían subiéndose tal cual salen del celular, o sea
      // varios MB por imagen. La de perfil se recorta cuadrada y se ve chica,
      // así que no necesita más de 640px.
      const urls = [];
      for (const item of mediaDraft) {
        if (item.existing) { urls.push(item.url); continue; }
        urls.push(await uploadImagenTienda(item.file,
          mediaModal === 'foto' ? { maxDim: 640 } : { maxDim: 1600 }));
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

  // StorePageHeader vive en src/store/components/StorePageHeader.jsx (Fase 3:
  // primer componente de "shell" extraído — ya recibía todo por props salvo
  // isDark/toggleTheme/el toggle de MoreSheet/el avatar, que quedaron
  // implícitos por closure). Este wrapper inyecta esas 4 dependencias del
  // componente raíz para no tener que tocar los 8 call sites existentes.
  const StorePageHeader = (props) => (
    <StorePageHeaderBase {...props}
      isDark={isDark} toggleTheme={toggleTheme}
      onOpenAccount={() => setMoreSheetOpen(v => !v)}
      renderAccountAvatar={renderAccountAvatar}
    />
  );

  const closeCreateSheet = () => { setCreateSheetClosing(true); setTimeout(() => { setCreateSheetOpen(false); setCreateSheetClosing(false); }, 220); };

  // Un solo badge visible en las cards chicas de la grilla/lista (mismo
  // criterio que el sistema viejo VENTAJA_OPTS/AdvantageBadge, que ya no
  // se usa en ningún lado — ver productBadges.js para el reemplazo
  // completo). "Oferta" gana sobre "Nuevo"/"Últimos días" cuando hay más
  // de uno: es la señal con más impacto en la decisión de compra.
  const ORDEN_PRIORIDAD_BADGE = ['oferta', 'nuevo', 'por_vencer'];
  const primerBadge = (o) => {
    const activos = calcularBadges(o);
    const id = ORDEN_PRIORIDAD_BADGE.find((b) => activos.includes(b)) || activos[0];
    if (!id) return null;
    const cfg = BADGE_CONFIG[id];
    return { id, label: cfg.label, Icon: cfg.Icon, badgeClass: `${cfg.pastel} ${cfg.iconColor}`, iconClass: cfg.iconColor };
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

  // Sidebar vive en src/store/components/StoreSidebar.jsx (Fase 3, mismo
  // criterio que StorePageHeader) — wrapper inyecta el estado/props que
  // antes leía por closure.
  const Sidebar = () => (
    <StoreSidebarBase
      expanded={sidebarExpanded} sidebarPinned={sidebarPinned}
      setSidebarPinned={setSidebarPinned} setSidebarExpanded={setSidebarExpanded}
      tiendaData={tiendaData} tiendaInfo={tiendaInfo}
      misProductosSinFiltrar={misProductosSinFiltrar} isEmprendimiento={isEmprendimiento}
      screen={screen} navigateTo={navigateTo} setCreateSheetOpen={setCreateSheetOpen}
      isAdmin={isAdmin} onOpenAdmin={onOpenAdmin} onLogout={onLogout}
      isDark={isDark} toggleTheme={toggleTheme} mockMode={mockMode} toggleMockMode={toggleMockMode}
    />
  );

  // ── Bottom Nav Mobile ──────────────────────────────────────────────────────
  // BottomNav vive en src/store/components/StoreBottomNav.jsx (Fase 3,
  // mismo criterio que StorePageHeader/StoreSidebar).
  const BottomNav = () => (
    <StoreBottomNavBase
      screen={screen} inboxMobileView={inboxMobileView} tiendaData={tiendaData}
      unreadTotal={unreadTotal} isEmprendimiento={isEmprendimiento}
      navigateTo={navigateTo} setCreateSheetOpen={setCreateSheetOpen} setCreateSheetClosing={setCreateSheetClosing}
      createSheetOpen={createSheetOpen} closeCreateSheet={closeCreateSheet} setMoreSheetOpen={setMoreSheetOpen}
    />
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

  // MensajesScreen vive en src/store/screens/MensajesScreen.jsx (Fase 3,
  // quinta y última pantalla grande).
  const MensajesScreen = () => (
    <MensajesScreenBase
      storeId={_storeId} allThreads={allThreads} inboxConvos={inboxConvos} setInboxConvos={setInboxConvos}
      inboxSearch={inboxSearch} setInboxSearch={setInboxSearch} msgFilter={msgFilter} setMsgFilter={setMsgFilter}
      setClosedConvos={setClosedConvos} showClosed={showClosed} setShowClosed={setShowClosed}
      inboxSelectedKey={inboxSelectedKey} setInboxSelectedKey={setInboxSelectedKey}
      inboxMobileView={inboxMobileView} setInboxMobileView={setInboxMobileView}
      unreadTotal={unreadTotal} fetchInbox={fetchInbox} inboxLoading={inboxLoading}
      floatingChats={floatingChats} openFloatingChat={openFloatingChat} closeFloatingChat={closeFloatingChat}
      avatarColor={avatarColor} fmtTime={fmtTime}
      misProductosSinFiltrar={misProductosSinFiltrar} setProductoEditing={setProductoEditing}
      setProductoShowForm={setProductoShowForm} setScreen={setScreen}
      tiendaInfo={tiendaInfo} tiendaData={tiendaData}
      swipedMsgId={swipedMsgId} setSwipedMsgId={setSwipedMsgId}
      deletingMsgId={deletingMsgId} setDeletingMsgId={setDeletingMsgId}
      editingMsg={editingMsg} setEditingMsg={setEditingMsg}
      confirmDeleteMsg={confirmDeleteMsg} setConfirmDeleteMsg={setConfirmDeleteMsg}
      storeTyping={storeTyping} setStoreTyping={setStoreTyping} inboxBottomRef={inboxBottomRef}
      attachOpen={attachOpen} setAttachOpen={setAttachOpen}
      chatAttachment={chatAttachment} setChatAttachment={setChatAttachment}
      chatImagePreview={chatImagePreview} setChatImagePreview={setChatImagePreview} chatImageInputRef={chatImageInputRef}
      inboxReply={inboxReply} setInboxReply={setInboxReply} inboxSending={inboxSending} inboxSendReply={inboxSendReply}
      inboxInfoOpen={inboxInfoOpen} setInboxInfoOpen={setInboxInfoOpen}
      inboxScrollRef={inboxScrollRef} inboxMobileScrollRef={inboxMobileScrollRef}
      isDark={isDark} toggleTheme={toggleTheme}
      onOpenAccount={() => setMoreSheetOpen(v => !v)} renderAccountAvatar={renderAccountAvatar}
    />
  );


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
        <div className="flex-1 overflow-y-auto no-scrollbar pb-[calc(var(--store-bottom-nav-h)_+_1rem)] lg:pb-0">
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

  // StatsScreen vive en src/store/screens/StatsScreen.jsx (Fase 3, tercera
  // de las 5 pantallas grandes).
  const StatsScreen = () => (
    <StatsScreenBase
      mockMode={mockMode} MOCK_STATS={MOCK_STATS}
      aiLoading={aiLoading} setAiLoading={setAiLoading} aiError={aiError} setAiError={setAiError}
      aiData={aiData} setAiData={setAiData}
      apiFetch={apiFetch} API_BASE={API_BASE}
      isDark={isDark} toggleTheme={toggleTheme}
      onOpenAccount={() => setMoreSheetOpen(v => !v)} renderAccountAvatar={renderAccountAvatar}
    />
  );

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
              Si vendés de todo, considerá elegir solo <strong>&quot;Multirubro&quot;</strong>.
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
    // useState ANTES del early return: fieldEditor pasa de null a un
    // objeto y viceversa en cada apertura/cierre — con el guard arriba del
    // hook (como estaba antes), este hook simplemente no se llamaba en los
    // renders donde fieldEditor es null, lo que viola las reglas de hooks
    // (detectado por eslint react-hooks/rules-of-hooks). El valor inicial
    // cae a {} cuando no hay editor abierto, sin efecto real porque el
    // return null de abajo igual no renderiza nada que lo use.
    const [localValues, setLocalValues] = useState(fieldEditor?.values ?? {});
    if (!fieldEditor) return null;
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
          badgesForzados: productoForm.badgesForzados, financiacion: productoForm.financiacion.trim() || null,
          stock: productoForm.stock ? Number(productoForm.stock) : null,
          condicion: productoForm.condicion || 'nuevo',
          categoryId: productoForm.categoryId || null,
          contactoWhatsapp: productoForm.contactoWhatsapp?.trim() || null,
          attributes: Object.keys(productoAttributes).length > 0 ? productoAttributes : null,
        };
        let savedProduct;
        if (productoEditing) {
          const res = await apiFetch(`${API_BASE}/productos`, { method: 'PATCH', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: productoEditing.id, ...payload }) });
          if (!res.ok) throw new Error('Error al actualizar');
          savedProduct = await res.json();
          setMisProductos(prev => prev.map(o => o.id === savedProduct.id ? savedProduct : o));
        } else {
          const res = await apiFetch(`${API_BASE}/productos`, { method: 'POST', authRequired: true, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
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
      setProductoForm({ titulo: p.titulo, descripcion: p.descripcion || '', precio: p.precio || '', precioOriginal: p.precioOriginal || '', badgesForzados: p.badgesForzados || null, financiacion: p.financiacion || '', stock: p.stock ?? '1', condicion: p.condicion || 'nuevo', categoryId: p.categoryId || null, contactoWhatsapp: p.contactoWhatsapp || '' });
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

  // OfertasScreen vive en src/store/screens/OfertasScreen.jsx (Fase 3,
  // primera de las 5 pantallas grandes).
  const OfertasScreen = () => (
    <OfertasScreenBase
      ambosModulosActivos={ambosModulosActivos} subScreenProductos={subScreenProductos} setSubScreenProductos={setSubScreenProductos}
      misProductosSinFiltrar={misProductosSinFiltrar}
      setMisProductos={setMisProductos} loadingProductos={loadingProductos}
      tiendaId={tiendaData?.id}
      ofertaShowForm={ofertaShowForm} setOfertaEditing={setOfertaEditing} setOfertaForm={setOfertaForm}
      setOfertaFotoFile={setOfertaFotoFile} setOfertaFotoPreview={setOfertaFotoPreview}
      setOfertaIntentoGuardar={setOfertaIntentoGuardar} setOfertaFotoRemoved={setOfertaFotoRemoved}
      setOfertaFotoLoading={setOfertaFotoLoading} setOfertaShowForm={setOfertaShowForm}
      ofertaConfirmDelete={ofertaConfirmDelete} setOfertaConfirmDelete={setOfertaConfirmDelete}
      handleCancelarOfertaAdmin={handleCancelarOfertaAdmin} handleReintentarOfertaAdmin={handleReintentarOfertaAdmin}
      apiFetch={apiFetch} API_BASE={API_BASE} haptic={haptic}
      isDark={isDark} toggleTheme={toggleTheme}
      onOpenAccount={() => setMoreSheetOpen(v => !v)} renderAccountAvatar={renderAccountAvatar}
    />
  );

  // ── Perfil tienda ──────────────────────────────────────────────────────────
  // ── Módulo "catalogo" (isModuleActive(tienda, 'catalogo')) ─────────────────
  // Producto de e-commerce completo: precio, stock, condición, categoría,
  // financiación, atributos. Para tiendas mono-oferta (módulo 'ofertas'),
  // ver OfertasScreen más abajo — mismo patrón que MODULES.catalogo vs
  // MODULES.ofertas en netlify/functions/_lib/modules.js.
  // ProductosScreen vive en src/store/screens/ProductosScreen.jsx (Fase 3,
  // segunda de las 5 pantallas grandes).
  const ProductosScreen = () => (
    <ProductosScreenBase
      onAbrirImportador={abrirImportador}
      ambosModulosActivos={ambosModulosActivos} subScreenProductos={subScreenProductos} setSubScreenProductos={setSubScreenProductos}
      misProductosSinFiltrar={misProductosSinFiltrar}
      setMisProductos={setMisProductos} loadingProductos={loadingProductos}
      productoShowForm={productoShowForm} setProductoShowForm={setProductoShowForm}
      productoEditing={productoEditing} setProductoEditing={setProductoEditing}
      productoForm={productoForm} setProductoForm={setProductoForm}
      productoFotoFiles={productoFotoFiles} setProductoFotoFiles={setProductoFotoFiles}
      productoFotoPreviews={productoFotoPreviews} setProductoFotoPreviews={setProductoFotoPreviews}
      productoSaving={productoSaving} setProductoSaving={setProductoSaving}
      productoSaveErr={productoSaveErr} setProductoSaveErr={setProductoSaveErr}
      setProductoAttributes={setProductoAttributes}
      productLimit={productLimit} isEmprendimiento={isEmprendimiento}
      quickPriceOpen={quickPriceOpen} setQuickPriceOpen={setQuickPriceOpen} QuickPriceEditor={QuickPriceEditor}
      prodFilter={prodFilter} setProdFilter={setProdFilter} prodCondicion={prodCondicion} setProdCondicion={setProdCondicion}
      prodSinStock={prodSinStock} setProdSinStock={setProdSinStock} prodDescuento={prodDescuento} setProdDescuento={setProdDescuento}
      prodSearch={prodSearch} setProdSearch={setProdSearch} prodSort={prodSort} setProdSort={setProdSort}
      prodView={prodView} setProdView={setProdView}
      prodFilterSheet={prodFilterSheet} setProdFilterSheet={setProdFilterSheet}
      confirmDelete={confirmDelete} setConfirmDelete={setConfirmDelete}
      prodDetail={prodDetail} setProdDetail={setProdDetail}
      prodDetailPhotoIdx={prodDetailPhotoIdx} setProdDetailPhotoIdx={setProdDetailPhotoIdx}
      prodDetailEditField={prodDetailEditField} setProdDetailEditField={setProdDetailEditField}
      prodDetailDraft={prodDetailDraft} setProdDetailDraft={setProdDetailDraft}
      prodDetailSaving={prodDetailSaving} setProdDetailSaving={setProdDetailSaving}
      prodDetailPhotoConfirm={prodDetailPhotoConfirm} setProdDetailPhotoConfirm={setProdDetailPhotoConfirm}
      primerBadge={primerBadge} apiFetch={apiFetch} API_BASE={API_BASE} haptic={haptic}
      isDark={isDark} toggleTheme={toggleTheme}
      onOpenAccount={() => setMoreSheetOpen(v => !v)} renderAccountAvatar={renderAccountAvatar}
    />
  );

  // PerfilScreen vive en src/store/screens/PerfilScreen.jsx (Fase 3, cuarta
  // de las 5 pantallas grandes).
  const PerfilScreen = () => (
    <PerfilScreenBase
      tiendaData={tiendaData} tiendaInfo={tiendaInfo} misProductosSinFiltrar={misProductosSinFiltrar}
      heroPhotoIdx={heroPhotoIdx} setHeroPhotoIdx={setHeroPhotoIdx}
      openProfileEdit={openProfileEdit} openDescripcionEditor={openDescripcionEditor} navigateTo={navigateTo}
      isDark={isDark} firebaseUser={firebaseUser} onLogout={onLogout} renderAccountAvatar={renderAccountAvatar}
      editingNombre={editingNombre} setEditingNombre={setEditingNombre}
      nombreDraft={nombreDraft} setNombreDraft={setNombreDraft}
      setTienda={setTienda} onTiendaUpdate={onTiendaUpdate}
      setPaginaForm={setPaginaForm} setPublicPageForm={setPublicPageForm}
      setPublicPageError={setPublicPageError} setScreen={setScreen} setEditingPublicPage={setEditingPublicPage}
      isActiva={isActiva} dias={dias}
      profileChecklistCollapsed={profileChecklistCollapsed} setProfileChecklistCollapsed={setProfileChecklistCollapsed}
      profileChecklistExpanded={profileChecklistExpanded} setProfileChecklistExpanded={setProfileChecklistExpanded}
      apiFetch={apiFetch} API_BASE={API_BASE}
    />
  );

  // ── "Más" bottom sheet ─────────────────────────────────────────────────────
  // MoreSheet vive en src/store/components/StoreMoreSheet.jsx (Fase 3).
  const MoreSheet = () => (
    <StoreMoreSheetBase
      onClose={() => setMoreSheetOpen(false)}
      firebaseUser={firebaseUser} tiendaInfo={tiendaInfo} tiendaData={tiendaData}
      navigateTo={navigateTo} setPaginaForm={setPaginaForm} setPublicPageForm={setPublicPageForm}
      setPublicPageError={setPublicPageError} setScreen={setScreen}
      isAdmin={isAdmin} onOpenAdmin={onOpenAdmin} mockMode={mockMode} toggleMockMode={toggleMockMode}
      isDark={isDark} toggleTheme={toggleTheme} onLogout={onLogout}
    />
  );

  // CreateSheet vive en src/store/components/StoreCreateSheet.jsx (Fase 3).
  const CreateSheet = () => (
    <StoreCreateSheetBase
      createSheetOpen={createSheetOpen} createSheetClosing={createSheetClosing} closeCreateSheet={closeCreateSheet}
      misProductosSinFiltrar={misProductosSinFiltrar} productLimit={productLimit}
      tiendaData={tiendaData} isEmprendimiento={isEmprendimiento}
      setProductoEditing={setProductoEditing} setProductoForm={setProductoForm}
      setProductoFotoFiles={setProductoFotoFiles} setProductoFotoPreviews={setProductoFotoPreviews}
      setProductoSaveErr={setProductoSaveErr} setProductoAttributes={setProductoAttributes}
      setProductoShowForm={setProductoShowForm}
      setOfertaEditing={setOfertaEditing} setOfertaForm={setOfertaForm}
      setOfertaFotoFile={setOfertaFotoFile} setOfertaFotoPreview={setOfertaFotoPreview}
      setOfertaShowForm={setOfertaShowForm}
    />
  );

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
        {/* Banner suscripción — vencida o por vencer. Compacto: título corto
            + detalle mucho más chico al lado (no un párrafo largo en una
            sola línea de texto, que forzaba más altura). */}
        {!isActiva && (
          <div className="bg-rose-500 text-white px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span className="text-sm font-bold shrink-0">Suscripción vencida</span>
              <span className="text-xs text-white/80 truncate hidden sm:inline">· Tu página no está publicada</span>
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
          <div className="bg-amber-500 text-white px-4 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <CalendarDays className="w-3.5 h-3.5 shrink-0" />
              <span className="text-sm font-bold shrink-0">
                {dias === 0 ? 'Vence hoy' : `Vence en ${dias} día${dias === 1 ? '' : 's'}`}
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


        {/* Sin willChange: 'opacity' acá — crea su propio stacking context,
            así que cualquier z-index alto DENTRO de este div (el importador
            de precios, z-[6000]) queda atrapado compitiendo solo contra
            hermanos internos, sin poder ganarle a BottomNav (z-[4500]),
            que vive AFUERA de este div como hermano posterior. Resultado
            real: el footer con el botón "Continuar"/"Aplicar cambios" del
            importador quedaba tapado por la bottom-nav pese a tener z-index
            mayor en el papel. will-change es solo una pista de rendimiento
            para el navegador — sacarla no cambia la animación de opacity,
            solo evita este efecto colateral de aislar el stacking. */}
        <div style={{
          opacity: screenVisible ? 1 : 0,
          transition: screenVisible ? 'opacity 0.18s ease' : 'opacity 0.10s ease',
        }}>
          {screen === 'mensajes' && isModuleActive(tiendaData, 'mensajes') && MensajesScreen()}
          {screen === 'stats' && StatsScreen()}
          {screen === 'productos' && (
            ambosModulosActivos ? (
              // Selector Ofertas/Catálogo — SOLO aparece con los 2 módulos
              // activos a la vez (ver ambosModulosActivos arriba). Vive
              // DENTRO del header de cada screen (leftSlot, reemplaza el
              // título) en vez de como una barra aparte encima: así no le
              // resta altura al h-[100dvh] interno de la screen (antes
              // generaba scroll extra en la zona vacía, la suma de tabs +
              // 100dvh excedía el viewport real).
              subScreenProductos === 'catalogo' ? ProductosScreen() : OfertasScreen()
            ) : (
              isModuleActive(tiendaData, 'catalogo') ? ProductosScreen() : OfertasScreen()
            )
          )}
          {screen === 'suscripcion' && SuscripcionScreen()}
          {screen === 'mi-pagina' && MiPaginaScreen()}
          {screen === 'perfil' && PerfilScreen()}
        </div>
        {BottomNav()}
        {/* Importador de precios — montado acá (no dentro de ProductosScreen)
            para que sobreviva a que el usuario navegue a otra pantalla:
            importadorVisible solo controla si el wizard se VE, el trabajo
            real vive en el hook useImportador de más arriba. */}
        {importadorVisible && (
          <ImportadorPrecios
            sidebarExpanded={sidebarExpanded}
            onMinimizar={minimizarImportador}
            onCerrarDeVerdad={cerrarImportadorDeVerdad}
            {...importador}
          />
        )}
        <ImportadorFlotante
          visible={importadorFlotanteVisible}
          paso={importador.paso}
          cargando={importador.cargando}
          error={importador.error}
          archivoInfo={importador.archivoInfo}
          onReabrir={() => setImportadorVisible(true)}
          onDescartar={cerrarImportadorDeVerdad}
        />
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

// ── QuickPriceEditor — edición rápida en cadena: un producto a la vez,
// precio en foco grande, editar+Enter o Siguiente para saltear sin tocar
// nada. Pensado para cargar precios de varios productos seguidos sin volver
// a la grilla entre uno y otro (pedido explícito de la Fase 2 del plan).
// Reusa el mismo endpoint/patrón PATCH-de-un-campo que ProductoDetail.
function QuickPriceEditor({ productos, onClose, onSaved }) {
  const [idx, setIdx] = useState(0);
  const [precio, setPrecio] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const total = productos.length;
  const actual = productos[idx];
  const esUltimo = idx >= total - 1;

  // Solo re-sincroniza al cambiar de producto (idx) — depender de
  // actual.precio resetearía el input mientras el usuario está escribiendo.
  useEffect(() => {
    setPrecio(actual?.precio != null ? String(actual.precio) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, actual?.id]);

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [idx]);

  if (!actual) return null;

  const avanzar = () => {
    if (esUltimo) { onClose(); return; }
    setIdx(i => i + 1);
  };

  const guardarYAvanzar = async () => {
    const nuevo = precio.trim() === '' ? null : Number(precio);
    if (nuevo === (actual.precio ?? null)) { avanzar(); return; }
    setSaving(true);
    try {
      const res = await apiFetch(`${API_BASE}/productos`, {
        method: 'PATCH', authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: actual.id, precio: nuevo }),
      });
      if (res.ok) onSaved(actual.id, { precio: nuevo });
      haptic('success');
    } catch { /* silencioso — el producto sigue con su precio anterior */ }
    finally { setSaving(false); avanzar(); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[6500] flex items-end lg:items-center justify-center" onClick={onClose}>
      <div className="bg-surface-card rounded-t-3xl lg:rounded-3xl w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10">
          <div>
            <h2 className="font-bold text-base flex items-center gap-1.5"><Zap className="w-4 h-4 text-brand" />Precio rápido</h2>
            <p className="text-xs text-ink-dim mt-0.5">{idx + 1} de {total}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 shrink-0 rounded-xl hover:bg-surface-card-2 dark:hover:bg-white/10 flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-5 pt-2">
          <div className="h-1 bg-surface-card-2 dark:bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-brand rounded-full transition-all" style={{ width: `${((idx + 1) / total) * 100}%` }} />
          </div>
        </div>

        <div className="px-5 py-6 flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl overflow-hidden bg-surface-card-2 dark:bg-white/8 shrink-0">
            {actual.fotos?.[0]
              ? <img src={actual.fotos[0]} alt="" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center"><Package className="w-6 h-6 text-ink-dim" /></div>}
          </div>
          <p className="font-bold text-sm text-center leading-snug">{actual.titulo}</p>

          <div className="w-full flex items-center bg-surface-card-2 dark:bg-white/5 rounded-2xl border-2 border-brand/30 focus-within:border-brand transition-colors px-4">
            <span className="text-2xl font-black text-ink-dim">$</span>
            <input
              ref={inputRef}
              type="text" inputMode="numeric"
              value={precio}
              onChange={e => setPrecio(e.target.value.replace(/[^\d]/g, ''))}
              onKeyDown={e => { if (e.key === 'Enter') guardarYAvanzar(); }}
              placeholder="0"
              className="flex-1 bg-transparent px-2 py-4 text-3xl font-black text-center outline-none"
            />
          </div>
        </div>

        <div className="px-5 pb-5 pt-1 flex gap-2">
          <button onClick={avanzar} disabled={saving}
            className="flex-1 py-3 rounded-2xl border-2 border-slate-200 dark:border-white/10 text-ink-dim dark:text-ink-dim font-bold text-sm hover:bg-surface-card-2 dark:hover:bg-white/5 transition-colors disabled:opacity-50">
            Saltear
          </button>
          <button onClick={guardarYAvanzar} disabled={saving}
            className="flex-1 py-3 rounded-2xl bg-brand hover:bg-brand-light text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : (esUltimo ? 'Guardar y terminar' : 'Guardar y siguiente')}
          </button>
        </div>
      </div>
    </div>
  );
}
