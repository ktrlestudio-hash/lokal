import React, { useState, useEffect, useRef } from 'react';
import {
  Store, Package, MessageSquare, Bell, User, Search, ArrowLeft,
  Send, MapPin, Clock, Star, CheckCircle, X, Loader2, AlertCircle,
  TrendingUp, Eye, Edit3, ChevronRight, Navigation, Phone, Filter,
  RotateCcw, LogOut, Sun, Moon, AlertTriangle, ChevronDown, Camera, Play,
  Lock, CreditCard, Zap, CalendarDays, ShieldCheck, RefreshCw
} from 'lucide-react';

// ─── Precios suscripción (deben coincidir con mp-checkout.js) ─────────────────
const PRECIO_MENSUAL    = 4990;
const PRECIO_ANUAL      = 47900;
const PRECIO_ANUAL_MES  = Math.round(PRECIO_ANUAL / 12);

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
import { CATEGORIES as BASE_CATEGORIES, getCategoryPath, getAllDescendants } from './categories';
import CategoryIcon from './CategoryIcon';

const API_BASE = '/.netlify/functions';

const StorePhotoCarousel = ({ photos = [] }) => {
  const [idx, setIdx] = React.useState(0);
  if (!photos.length) return null;
  const prev = () => setIdx(i => (i - 1 + photos.length) % photos.length);
  const next = () => setIdx(i => (i + 1) % photos.length);
  return (
    <div className="relative bg-slate-100 dark:bg-black/30">
      <img src={photos[idx]} alt="" className="w-full object-contain max-h-64" style={{ aspectRatio: '16/9' }} />
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
              <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? 'bg-white w-4' : 'bg-white/50 w-1.5'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const KtrlLogo = ({ className = '' }) => (
  <svg className={className} viewBox="0 0 1629.2 404.35" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M838.15,41.28v74.06c0,20.45-16.58,37.03-37.03,37.03h-55.55c-10.23,0-18.52,8.29-18.52,18.52v191.9c0,20.6-16.7,37.3-37.3,37.3h-73.53c-20.6,0-37.3-16.7-37.3-37.3v-191.86c0-10.24-8.31-18.54-18.56-18.52l-55.43.15c-20.48.04-37.11-16.55-37.11-37.03V41.28c0-20.45,16.58-37.03,37.03-37.03h296.26c20.45,0,37.03,16.58,37.03,37.03Z"/>
    <path d="M1629.2,289.56v74.06c0,20.45-16.58,37.03-37.03,37.03h-222.19c-20.45,0-37.03-16.58-37.03-37.03V41.84c0-20.45,16.58-37.03,37.03-37.03h74.06c20.45,0,37.03,16.58,37.03,37.03v192.17c0,10.23,8.29,18.52,18.52,18.52h92.58c20.45,0,37.03,16.58,37.03,37.03Z"/>
    <path d="M1098.1,152.38h-56.26c-10.23,0-18.52,8.29-18.52,18.52v191.97c0,20.45-16.58,37.03-37.03,37.03h-74.08c-20.45,0-37.03-16.58-37.03-37.03V78.31c0-40.9,33.16-74.06,74.06-74.06h247.71c40.9,0,74.06,33.16,74.06,74.06v100.72c0,9.82-3.9,19.24-10.85,26.19l-52.61,52.6c-6.78,6.72-8.03,18.46-.12,26.36l52.77,52.75c23.34,23.34,6.8,63.25-26.21,63.22l-95.66-.07c-9.82,0-19.24-3.9-26.19-10.85l-40.95-40.95c-6.94-6.94-10.85-16.36-10.85-26.19v-71.94c0-9.82,3.9-19.24,10.85-26.19l39.99-39.99c11.66-11.66,3.4-31.61-13.09-31.61Z"/>
    <path d="M83.04,14.06L10.79,86.32C3.88,93.22,0,102.59,0,112.36v179.62c0,9.77,3.88,19.14,10.79,26.05l72.26,72.26c23.21,23.21,62.88,6.77,62.88-26.05V40.11c0-32.82-39.68-49.25-62.88-26.05Z"/>
    <path d="M416.11,340.58l-52.97,52.97c-14.39,14.39-37.71,14.39-52.09,0l-117.4-117.4c-6.97-6.97-10.88-16.41-10.88-26.27v-95.43c0-9.85,3.91-19.3,10.88-26.27L311.04,10.79c14.39-14.39,37.71-14.39,52.09,0l52.97,52.97c14.39,14.39,14.39,37.71,0,52.09l-73.29,73.29c-7.19,7.19-7.19,18.85,0,26.05l73.29,73.29c14.39,14.39,14.39,37.71,0,52.09Z"/>
  </svg>
);

export default function StoreApp({ firebaseUser, tiendaData, onLogout, onTiendaUpdate, isDark, toggleTheme }) {
  const [screen, setScreen] = useState('feed');
  const [selectedDemanda, setSelectedDemanda] = useState(null);

  // Datos
  const [demandas, setDemandas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tienda, setTienda] = useState(null);
  const [misRespuestas, setMisRespuestas] = useState([]);

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
  const [renovando, setRenovando]       = useState(false);
  const [renovError, setRenovError]     = useState(null);
  const isActiva = suscripcionActiva(tiendaData);
  const dias     = diasRestantes(tiendaData);

  // Notificaciones
  const [showProfile, setShowProfile] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    fetchTienda();
    fetchDemandas();
    fetchMisRespuestas();
    // Cargar categorías custom
    fetch(`${API_BASE}/categories`)
      .then(r => r.ok ? r.json() : [])
      .then(custom => { if (custom.length > 0) setAllCategories([...BASE_CATEGORIES, ...custom]); })
      .catch(() => {});
  }, []);

  const createCategory = async (name, parentId = null) => {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, parentId }),
    });
    const cat = await res.json();
    setAllCategories(prev => prev.find(c => c.id === cat.id) ? prev : [...prev, cat]);
    return cat;
  };

  const fetchTienda = async () => {
    try {
      const res = await fetch(`${API_BASE}/tiendas-crud?id=${tiendaData.id}`);
      if (res.ok) setTienda(await res.json());
    } catch { /* usa session data como fallback */ }
  };

  const fetchDemandas = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/demandas`);
      if (res.ok) {
        const data = await res.json();
        setDemandas(data.filter(d => d.estado === 'activa'));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMisRespuestas = async () => {
    try {
      const res = await fetch(`${API_BASE}/respuestas?tiendaId=${tiendaData.id}`);
      if (res.ok) setMisRespuestas(await res.json());
    } catch { /* silencioso */ }
  };

  const yaRespondio = (demandaId) => misRespuestas.some(r => String(r.demandaId) === String(demandaId));

  const handleRenovar = async (plan) => {
    setRenovando(true);
    setRenovError(null);
    try {
      const res = await fetch(`${API_BASE}/mp-checkout`, {
        method: 'POST',
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
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
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

      const res = await fetch(`${API_BASE}/respuestas`, {
        method: 'POST',
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
      if (!res.ok) throw new Error((await res.json()).error || 'Error al enviar');
      const nueva = await res.json();
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
      return matchSearch && matchRubro;
    });

  const tiendaInfo = tienda || {
    nombre: tiendaData?.nombre || '',
    rubros: tiendaData?.rubros || [],
    foto: tiendaData?.foto || null,
    direccion: tiendaData?.direccion || '',
    ciudad: tiendaData?.ciudad || '',
    telefono: tiendaData?.telefono || '',
  };

  // ── Match Types — jerarquía de relevancia de la oferta ────────────────────
  // priority: menor = más relevante (se usa para ordenar respuestas en App.jsx)

  // ── MatchTypeSelector — selector condicional 2 pasos ──────────────────────
  const MatchTypeSelector = ({ value, onChange }) => {
    // Paso 1: ¿Es el mismo producto?
    // Paso 2a (exacto): ¿estado?
    // Paso 2b (no exacto): ¿qué tan similar?
    const [step, setStep] = React.useState(() => {
      if (!value) return 'root';
      if (['exacto-nuevo', 'exacto-usado', 'reacondicionado'].includes(value)) return 'exacto';
      return 'similar';
    });

    const select = (v) => { onChange(v); };
    const back = () => { onChange(null); setStep('root'); };

    const btnBase = 'w-full flex items-start gap-3 p-3.5 rounded-xl border-2 text-left transition-all active:scale-[0.98]';
    const btnActive = (id) => value === id
      ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10'
      : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/4';

    if (step === 'root') return (
      <div className="space-y-2">
        <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">¿Cómo coincide tu oferta?</p>
        <button className={`${btnBase} ${btnActive('_exacto')}`} onClick={() => setStep('exacto')}>
          <span className="text-xl leading-none mt-0.5">✓</span>
          <div>
            <p className="font-bold text-sm text-slate-900 dark:text-white">Tengo exactamente lo que pide</p>
            <p className="text-xs text-slate-400 mt-0.5">El mismo producto, misma marca o especificación</p>
          </div>
        </button>
        <button className={`${btnBase} ${btnActive('_similar')}`} onClick={() => setStep('similar')}>
          <span className="text-xl leading-none mt-0.5">≈</span>
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
        {[
          { id: 'exacto-nuevo',  emoji: '📦', label: 'Nuevo · sin uso',       desc: 'Original, sellado o sin estrenar' },
          { id: 'exacto-usado',  emoji: '🔄', label: 'Usado · buen estado',   desc: 'Segunda mano, en condiciones correctas' },
          { id: 'reacondicionado', emoji: '🔧', label: 'Reacondicionado',    desc: 'Revisado, reparado o restaurado' },
        ].map(({ id, emoji, label, desc }) => (
          <button key={id} onClick={() => select(id)}
            className={`${btnBase} ${value === id ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/4'}`}>
            <span className="text-xl leading-none mt-0.5">{emoji}</span>
            <div>
              <p className={`font-bold text-sm ${value === id ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
            {value === id && <CheckCircle className="w-4 h-4 text-emerald-500 ml-auto shrink-0 mt-0.5" />}
          </button>
        ))}
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
        {[
          { id: 'compatible', emoji: '🔌', label: 'Compatible',          desc: 'Mismo uso / función, otra marca o modelo' },
          { id: 'similar',    emoji: '〜', label: 'Similar',             desc: 'Parecido, no garantizo que sea exactamente' },
          { id: 'imitacion',  emoji: '🏷️', label: 'Imitación / Genérico', desc: 'Copia, réplica o versión no original' },
        ].map(({ id, emoji, label, desc }) => (
          <button key={id} onClick={() => select(id)}
            className={`${btnBase} ${value === id ? 'border-violet-400 bg-violet-50 dark:bg-violet-500/10' : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 bg-white dark:bg-white/4'}`}>
            <span className="text-xl leading-none mt-0.5">{emoji}</span>
            <div>
              <p className={`font-bold text-sm ${value === id ? 'text-violet-700 dark:text-violet-400' : 'text-slate-900 dark:text-white'}`}>{label}</p>
              <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
            </div>
            {value === id && <CheckCircle className="w-4 h-4 text-violet-500 ml-auto shrink-0 mt-0.5" />}
          </button>
        ))}
      </div>
    );
  };

  // ── PaywallModal ──────────────────────────────────────────────────────────
  const PaywallModal = () => (
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
            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-slate-200 dark:border-white/10 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all group"
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
            className="w-full flex items-center justify-between p-4 rounded-2xl border-2 border-emerald-400 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/8 hover:bg-emerald-100 dark:hover:bg-emerald-500/15 transition-all relative"
          >
            <div className="absolute -top-2.5 left-4 bg-emerald-500 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
              AHORRÁS 20%
            </div>
            <div className="text-left">
              <p className="font-bold text-slate-900 dark:text-white">Plan Anual</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Facturado ${PRECIO_ANUAL.toLocaleString()} — 12 meses + 1 de regalo</p>
            </div>
            <div className="text-right shrink-0 ml-4">
              <p className="font-black text-lg text-emerald-600 dark:text-emerald-400">${PRECIO_ANUAL_MES.toLocaleString()}</p>
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

  // ── Sidebar ────────────────────────────────────────────────────────────────
  const Sidebar = () => (
    <div className="hidden lg:flex lg:flex-col w-64 bg-white dark:bg-slate-900 border-r-2 border-slate-100 dark:border-white/10 h-screen sticky top-0 shrink-0">
      <div className="p-5 border-b-2 border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shrink-0">
            <Store className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-slate-900 truncate">{tiendaInfo.nombre}</h1>
            <div className="flex items-center gap-2">
              <p className="text-xs text-emerald-600 font-semibold">Panel de tienda</p>
              <a href="https://www.instagram.com/katriel.martinez" target="_blank" rel="noopener"
                className="flex items-center gap-0.5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                <span className="text-[8px]">by</span>
                <KtrlLogo className="h-1.5 opacity-60 hover:opacity-90 transition-opacity" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {[
          { label: 'Demandas activas', icon: Package, id: 'feed', badge: demandasFiltradas.length },
          { label: 'Mis respuestas', icon: MessageSquare, id: 'respuestas', badge: misRespuestas.length },
          { label: 'Estadisticas', icon: TrendingUp, id: 'stats' },
          { label: 'Mi tienda', icon: Store, id: 'perfil' },
        ].map(({ label, icon: Icon, id, badge }) => (
          <button key={id} onClick={() => setScreen(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left ${screen === id ? 'bg-slate-900 dark:bg-emerald-500/15 text-white dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10'}`}>
            <Icon className="w-5 h-5 shrink-0" />
            <span className="font-semibold flex-1">{label}</span>
            {badge > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${screen === id ? 'bg-white/20' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t-2 border-slate-100 dark:border-white/10 space-y-1">
        <button onClick={toggleTheme}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
          {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
          <span className="font-semibold">{isDark ? 'Modo claro' : 'Modo oscuro'}</span>
        </button>
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
          <LogOut className="w-5 h-5" />
          <span className="font-semibold">Salir</span>
        </button>
      </div>
    </div>
  );

  // ── Bottom Nav Mobile ──────────────────────────────────────────────────────
  const BottomNav = () => (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t-2 border-slate-100 dark:border-white/10 px-4 py-3 z-20">
      <div className="flex items-center justify-around max-w-md mx-auto">
        {[
          { icon: Package, id: 'feed', label: 'Demandas' },
          { icon: MessageSquare, id: 'respuestas', label: 'Respuestas' },
          { icon: TrendingUp, id: 'stats', label: 'Stats' },
          { icon: Store, id: 'perfil', label: 'Mi tienda' },
        ].map(({ icon: Icon, id, label }) => (
          <button key={id} onClick={() => setScreen(id)} className="flex flex-col items-center gap-1">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${screen === id ? 'bg-slate-900 dark:bg-emerald-500/15' : 'bg-slate-100 dark:bg-white/5'}`}>
              <Icon className={`w-5 h-5 ${screen === id ? 'text-white dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`} />
            </div>
            <span className="text-xs font-semibold text-slate-500">{label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // ── Feed de demandas ───────────────────────────────────────────────────────
  const FeedScreen = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 lg:pb-8">
      {/* Header mobile */}
      <div className="lg:hidden bg-white dark:bg-slate-900 border-b-2 border-slate-100 dark:border-white/10 p-5 sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="font-bold text-lg">{tiendaInfo.nombre}</h1>
            <p className="text-xs text-emerald-600 font-semibold">Panel de tienda</p>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-500" />}
            </button>
            <button onClick={() => setShowProfile(true)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
              <User className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            placeholder="Buscar demandas..."
            className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
      </div>

      {/* Header desktop */}
      <div className="hidden lg:block bg-white dark:bg-slate-900 border-b-2 border-slate-100 dark:border-white/10 sticky top-0 z-10">
        <div className="px-8 py-4 flex items-center gap-6">
          <div>
            <h2 className="text-xl font-bold">Demandas activas</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">{demandasFiltradas.length} pedidos de clientes</p>
          </div>
          <div className="relative flex-1 max-w-sm ml-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar..." className="w-full pl-11 pr-4 py-3 bg-slate-100 dark:bg-white/5 dark:text-slate-200 dark:placeholder:text-slate-500 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <button onClick={fetchDemandas} className="p-3 bg-slate-100 dark:bg-white/10 rounded-xl hover:bg-slate-200 dark:hover:bg-white/15 transition-colors">
            <RotateCcw className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-5 lg:px-8 py-5">
        {/* Filtros por categoría */}
        {categoriasFeed.length > 0 && (
          <div className="flex gap-2 mb-5 overflow-x-auto pb-2 scrollbar-hide">
            <button onClick={() => setFilterRubro('todas')}
              className={`px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${filterRubro === 'todas' ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
              Todas
            </button>
            {categoriasFeed.map(cat => (
              <button key={cat.id} onClick={() => setFilterRubro(filterRubro === cat.id ? 'todas' : cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all shrink-0 ${filterRubro === cat.id ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:border-slate-300'}`}>
                <CategoryIcon name={cat.icon} className="w-3.5 h-3.5" />
                <span>{cat.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-slate-900 rounded-3xl border dark:border-white/10 p-5 animate-pulse">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-slate-200 rounded-2xl shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                    <div className="h-3 bg-slate-200 rounded" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : demandasFiltradas.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-400">
              {searchQuery ? 'Sin resultados para esa busqueda' : 'No hay demandas activas ahora'}
            </p>
            <button onClick={fetchDemandas} className="mt-4 px-5 py-2.5 bg-slate-100 rounded-xl font-semibold text-sm">
              Actualizar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {demandasFiltradas.map(d => {
              const respondida = yaRespondio(d.id);
              return (
                <div key={d.id}
                  onClick={() => { setSelectedDemanda(d); setScreen('demanda-detail'); }}
                  className={`bg-white dark:bg-slate-900 rounded-3xl border-2 p-5 cursor-pointer hover:shadow-md transition-all active:scale-[0.99] ${respondida ? 'border-emerald-100 dark:border-emerald-500/20' : 'border-slate-100 dark:border-white/10'}`}>
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden">
                      {(d.fotos?.[0] || d.foto)
                        ? <img src={d.fotos?.[0] || d.foto} alt="" className="w-full h-full object-cover" />
                        : <Package className="w-7 h-7 text-amber-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-bold truncate">{d.titulo}</h3>
                        {respondida
                          ? <span className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-xl shrink-0"><CheckCircle className="w-3 h-3" /> Respondida</span>
                          : <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl shrink-0">Nueva</span>
                        }
                      </div>
                      {d.descripcion && <p className="text-sm text-slate-500 line-clamp-2 mb-2">{d.descripcion}</p>}
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs text-slate-400">{d.tiempoCreado}</span>
                        {d.presupuesto?.max && (
                          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                            Hasta ${d.presupuesto.max.toLocaleString()}
                          </span>
                        )}
                        {(d.categorias || []).map(c => (
                          <span key={c} className="text-xs bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400 px-2 py-0.5 rounded-lg">{c}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  // ── Detalle demanda + responder ────────────────────────────────────────────
  const DemandaDetailScreen = () => {
    const respondida = yaRespondio(selectedDemanda?.id);
    const miRespuesta = misRespuestas.find(r => String(r.demandaId) === String(selectedDemanda?.id));

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 lg:pb-8">
        <div className="bg-white dark:bg-slate-900 border-b dark:border-white/10 px-5 py-4 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button onClick={() => setScreen('feed')} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">Demanda del cliente</h1>
              <p className="text-xs text-slate-500">{selectedDemanda?.tiempoCreado}</p>
            </div>
          </div>
        </div>

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
                <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl text-sm font-semibold">
                  Presupuesto: ${selectedDemanda.presupuesto.min?.toLocaleString() || '?'} - ${selectedDemanda.presupuesto.max?.toLocaleString() || '?'}
                </div>
              )}
            </div>
          </div>

          {/* Mi respuesta previa */}
          {respondida && miRespuesta && (
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-3xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-emerald-800">Tu respuesta enviada</h3>
              </div>
              {miRespuesta.matchType && (() => {
                const matchLabels = {
                  'exacto-nuevo':   '📦 Exacto Nuevo',
                  'exacto-usado':   '🔄 Exacto Usado',
                  'reacondicionado':'🔧 Reacondicionado',
                  'compatible':     '🔌 Compatible',
                  'similar':        '〜 Similar',
                  'imitacion':      '🏷️ Imitación',
                };
                const isExacto = miRespuesta.matchType.startsWith('exacto') || miRespuesta.matchType === 'reacondicionado';
                return (
                  <span className={`inline-flex text-xs font-bold px-2.5 py-1 rounded-full mb-3 ${isExacto ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'}`}>
                    {matchLabels[miRespuesta.matchType] || miRespuesta.matchType}
                  </span>
                );
              })()}
              <p className="text-sm text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 rounded-2xl p-4 mb-3 leading-relaxed">{miRespuesta.mensaje}</p>
              {miRespuesta.precio && (
                <p className="text-lg font-bold text-emerald-700">Precio ofrecido: ${miRespuesta.precio.toLocaleString()}</p>
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
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Zap className="w-4 h-4" /> Renovar suscripción
              </button>
            </div>
          )}

          {!respondida && isActiva && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5">
              <h3 className="font-bold text-lg mb-4">Responder a esta demanda</h3>

              {submitOk && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center gap-3 mb-4">
                  <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                  <p className="text-sm font-semibold text-emerald-700">Respuesta enviada correctamente</p>
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
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-white rounded-2xl focus:outline-none focus:border-emerald-400 resize-none text-sm transition-colors"
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
                        className="aspect-square rounded-xl border-2 border-dashed border-slate-200 dark:border-white/15 flex flex-col items-center justify-center gap-1 text-slate-400 hover:border-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors"
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
                      className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 dark:border-white/10 dark:bg-slate-800 dark:text-white rounded-2xl focus:outline-none focus:border-emerald-400 transition-colors"
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
                  className="w-full py-4 bg-slate-900 dark:bg-emerald-500 text-white rounded-2xl font-bold disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors">
                  {respondiendo
                    ? <><Loader2 className="w-5 h-5 animate-spin" /> {adjuntosRespuesta.length > 0 ? 'Subiendo archivos...' : 'Enviando...'}</>
                    : <><Send className="w-5 h-5" /> Enviar respuesta</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Mis respuestas ─────────────────────────────────────────────────────────
  const MisRespuestasScreen = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 lg:pb-8">
      <div className="bg-white dark:bg-slate-900 border-b dark:border-white/10 px-5 py-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-bold">Mis respuestas</h1>
            <p className="text-xs text-slate-500">{misRespuestas.length} enviadas</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-5 py-6 space-y-4">
        {misRespuestas.length === 0 ? (
          <div className="text-center py-16">
            <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-semibold text-slate-400">Todavia no respondiste ninguna demanda</p>
            <button onClick={() => setScreen('feed')} className="mt-4 px-5 py-2.5 bg-slate-900 dark:bg-emerald-500 text-white rounded-xl font-semibold text-sm hover:bg-slate-800 dark:hover:bg-emerald-400 transition-colors">
              Ver demandas
            </button>
          </div>
        ) : misRespuestas.map(r => (
          <div key={r.id} className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h3 className="font-bold">{r.demandaTitulo || 'Demanda'}</h3>
              <span className="text-xs text-slate-400 shrink-0">{r.tiempoRespuesta || 'Reciente'}</span>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/5 rounded-2xl p-4 mb-3 leading-relaxed">{r.mensaje}</p>
            {r.precio && (
              <p className="font-bold text-emerald-700">Precio ofrecido: ${r.precio.toLocaleString()}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // ── Estadisticas ───────────────────────────────────────────────────────────
  const StatsScreen = () => {
    const totalRespuestas = misRespuestas.length;
    const demandasConRespuesta = new Set(misRespuestas.map(r => r.demandaId)).size;
    const tasaRespuesta = demandas.length > 0
      ? Math.round((demandasConRespuesta / demandas.length) * 100)
      : 0;

    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 lg:pb-8">
        <div className="bg-white dark:bg-slate-900 border-b dark:border-white/10 px-5 py-4 sticky top-0 z-10">
          <h1 className="text-lg font-bold">Estadisticas</h1>
          <p className="text-xs text-slate-500">Resumen de actividad de tu tienda</p>
        </div>

        <div className="max-w-3xl mx-auto px-5 py-6 space-y-5">
          {/* Cards stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Demandas activas', value: demandas.length, icon: Package, color: 'blue' },
              { label: 'Respuestas enviadas', value: totalRespuestas, icon: MessageSquare, color: 'emerald' },
              { label: 'Tasa de respuesta', value: `${tasaRespuesta}%`, icon: TrendingUp, color: 'violet' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5">
                <div className={`w-10 h-10 bg-${color}-100 rounded-xl flex items-center justify-center mb-3`}>
                  <Icon className={`w-5 h-5 text-${color}-600`} />
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
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{r.demandaTitulo || 'Demanda'}</p>
                  <p className="text-xs text-slate-400">{r.tiempoRespuesta || 'Reciente'}</p>
                </div>
                {r.precio && <p className="text-sm font-bold text-emerald-600 shrink-0">${r.precio.toLocaleString()}</p>}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // ── Rubros editor — selector de categorías raíz de la tienda ─────────────
  const RubrosEditor = ({ tiendaInfo }) => {
    const rootCats = allCategories.filter(c => c.parentId === null);
    const [selected, setSelected] = useState(() => tiendaInfo.rubros || []);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const toggle = (id) => {
      setSelected(prev =>
        prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
      );
      setSaved(false);
    };

    const handleSave = async () => {
      setSaving(true);
      try {
        await fetch(`${API_BASE}/tiendas-crud`, {
          method: 'PATCH',
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
                    ? 'bg-emerald-500 text-white'
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
            className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-white rounded-2xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : null}
            {saving ? 'Guardando...' : 'Guardar rubros'}
          </button>
        )}
      </div>
    );
  };

  // ── Perfil tienda ──────────────────────────────────────────────────────────
  const PerfilScreen = () => (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-24 lg:pb-8">
      <div className="bg-white dark:bg-slate-900 border-b dark:border-white/10 px-5 py-4 sticky top-0 z-10">
        <h1 className="text-lg font-bold">Mi tienda</h1>
        <p className="text-xs text-slate-500">Informacion publica visible para los clientes</p>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-6 space-y-5">
        {/* Header tienda */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-6">
          <div className="flex gap-4 mb-5">
            <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center text-4xl shrink-0">
              {tiendaInfo.foto ? <img src={tiendaInfo.foto} alt="" className="w-full h-full object-cover" /> : '🏪'}
            </div>
            <div className="flex-1">
              <h2 className="font-bold text-xl mb-1">{tiendaInfo.nombre}</h2>
              {tiendaInfo.rubros?.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {tiendaInfo.rubros.map(r => {
                    const cat = allCategories.find(c => c.id === r);
                    return (
                      <span key={r} className="flex items-center gap-1 text-xs bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-lg font-semibold">
                        {cat?.icon && <CategoryIcon name={cat.icon} className="w-3 h-3" />}
                        {cat?.name || r}
                      </span>
                    );
                  })}
                </div>
              )}
              {tiendaInfo.descripcion && <p className="text-sm text-slate-500 dark:text-slate-400">{tiendaInfo.descripcion}</p>}
            </div>
          </div>
          <RubrosEditor tiendaInfo={tiendaInfo} />
          <button className="w-full mt-3 py-3 bg-slate-100 dark:bg-white/10 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 hover:bg-slate-200 dark:hover:bg-white/20 transition-colors">
            <Edit3 className="w-4 h-4" /> Editar perfil
          </button>
        </div>

        {/* Info */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5 space-y-4">
          <h3 className="font-bold">Informacion de contacto</h3>
          {[
            { icon: MapPin, label: 'Direccion', value: tiendaInfo.direccion ? `${tiendaInfo.direccion}, ${tiendaInfo.ciudad}` : 'No configurada' },
            { icon: Phone, label: 'Telefono', value: tiendaInfo.telefono || 'No configurado' },
            { icon: Clock, label: 'Horarios', value: 'Ver horarios completos' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex gap-3">
              <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-slate-500" />
              </div>
              <div>
                <p className="text-xs text-slate-400 dark:text-slate-500 font-semibold">{label}</p>
                <p className="text-sm font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Suscripción */}
        <div className={`rounded-3xl border-2 p-5 ${isActiva ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-white/10' : 'bg-rose-50 dark:bg-rose-500/8 border-rose-200 dark:border-rose-500/30'}`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <ShieldCheck className={`w-4 h-4 ${isActiva ? 'text-emerald-500' : 'text-rose-500'}`} />
              Suscripción
            </h3>
            {isActiva
              ? <span className="text-xs font-bold bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-full">Activa</span>
              : <span className="text-xs font-bold bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 px-2.5 py-1 rounded-full">Vencida</span>
            }
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
                  <span className={`font-semibold ${isActiva && dias !== null && dias <= 7 ? 'text-amber-500' : ''} ${!isActiva ? 'text-rose-500' : ''}`}>
                    {new Date(tiendaData.suscripcion.vence).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {isActiva && dias !== null && ` (${dias}d)`}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500 mb-4">Sin datos de suscripción</p>
          )}

          <button
            onClick={() => setShowPaywall(true)}
            className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${
              isActiva
                ? 'bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200'
                : 'bg-emerald-500 hover:bg-emerald-400 text-white'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            {isActiva ? 'Renovar anticipado' : 'Renovar suscripción'}
          </button>
        </div>

        {/* Cuenta */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-slate-100 dark:border-white/10 p-5">
          <h3 className="font-bold mb-4">Cuenta</h3>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl overflow-hidden flex items-center justify-center shrink-0">
              {firebaseUser?.photoURL
                ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
                : <span className="text-base font-bold text-emerald-600">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</span>
              }
            </div>
            <div>
              <p className="font-semibold">{firebaseUser?.displayName || 'Usuario'}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">{firebaseUser?.email || ''}</p>
            </div>
          </div>
          <button onClick={onLogout}
            className="w-full py-3 text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-2xl font-semibold text-sm flex items-center justify-center gap-2 transition-colors">
            <LogOut className="w-4 h-4" /> Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );

  // ── Profile quick modal (mobile) ───────────────────────────────────────────
  const ProfileModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end lg:items-center justify-center">
      <div className="bg-white dark:bg-slate-900 rounded-t-3xl lg:rounded-3xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg">Cuenta</h2>
          <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-14 h-14 bg-emerald-100 rounded-2xl overflow-hidden flex items-center justify-center shrink-0">
            {firebaseUser?.photoURL
              ? <img src={firebaseUser.photoURL} alt="" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-emerald-600">{(firebaseUser?.displayName || 'U')[0].toUpperCase()}</span>
            }
          </div>
          <div>
            <p className="font-bold">{firebaseUser?.displayName || 'Usuario'}</p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{firebaseUser?.email || ''}</p>
            <p className="text-xs text-emerald-600 font-semibold mt-0.5">Tienda: {tiendaInfo.nombre}</p>
          </div>
        </div>
        <div className="space-y-1">
          {[
            { label: 'Mi tienda', action: () => { setScreen('perfil'); setShowProfile(false); } },
            { label: 'Estadisticas', action: () => { setScreen('stats'); setShowProfile(false); } },
          ].map(({ label, action }) => (
            <button key={label} onClick={action}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl font-semibold flex items-center justify-between">
              {label} <ChevronRight className="w-4 h-4 text-slate-400" />
            </button>
          ))}
          <button onClick={onLogout}
            className="w-full text-left px-4 py-3 hover:bg-rose-50 rounded-xl font-semibold text-rose-600">
            Cerrar sesion
          </button>
        </div>
      </div>
    </div>
  );

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950">
      <Sidebar />
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

        {screen === 'feed' && <FeedScreen />}
        {screen === 'demanda-detail' && selectedDemanda && <DemandaDetailScreen />}
        {screen === 'respuestas' && <MisRespuestasScreen />}
        {screen === 'stats' && <StatsScreen />}
        {screen === 'perfil' && <PerfilScreen />}
        <BottomNav />
        {showProfile && <ProfileModal />}
        {showPaywall && <PaywallModal />}
      </div>
    </div>
  );
}
