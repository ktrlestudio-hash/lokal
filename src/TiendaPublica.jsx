import React, { useState, useEffect, useReducer } from 'react';
import { TiendaPublicaRenderer } from './tienda-publica/TiendaPublicaRenderer.jsx';
import {
  ArrowLeft, MapPin, Phone, Instagram, MessageCircle,
  Plus, Minus, Trash2, ShoppingBag, X, Store,
  Clock, Loader2, AlertCircle, ExternalLink, ChevronRight,
  Zap, CreditCard, Tag, Globe
} from 'lucide-react';
import { LogoFull } from './Brand';

const API_BASE = '/.netlify/functions';

function LogoLoader() {
  const cx = 40.72, cy = 40.65, r = 11.23;
  return (
    <svg viewBox="0 0 81.18 81.44" width={72} height={72} xmlns="http://www.w3.org/2000/svg">
      <style>{`
        @keyframes tp-draw { from{stroke-dashoffset:275}to{stroke-dashoffset:0} }
        @keyframes tp-dot-in { 0%{transform:scale(0);opacity:0}55%{transform:scale(1.3);opacity:1}75%{transform:scale(.88)}90%{transform:scale(1.05)}100%{transform:scale(1);opacity:1} }
        @keyframes tp-pulse { 0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.10);opacity:.7} }
        .tp-ring{fill:none;stroke:#00B8D9;stroke-width:7.66;stroke-linecap:round;stroke-dasharray:275;stroke-dashoffset:275;animation:tp-draw .85s cubic-bezier(.4,0,.2,1) .1s forwards}
        .tp-dot{fill:#00B8D9;transform-origin:${cx}px ${cy}px;animation:tp-dot-in .5s cubic-bezier(.34,1.56,.64,1) .7s both,tp-pulse 2.2s ease-in-out 1.35s infinite}
      `}</style>
      <rect className="tp-ring" x="3.83" y="3.83" width="73.52" height="73.78" rx="14.83" />
      <circle className="tp-dot" cx={cx} cy={cy} r={r} />
    </svg>
  );
}

function formatPrice(n) {
  if (n == null) return 'A consultar';
  return `$${Number(n).toLocaleString('es-AR')}`;
}

function buildWhatsAppUrl(tienda, items, note = '') {
  const phone = (tienda.whatsapp || tienda.telefono || '').replace(/\D/g, '');
  if (!phone) return null;
  const lines = [`¡Hola ${tienda.nombre}!`];
  if (items.length) {
    lines.push('');
    items.forEach(it => lines.push(`• ${it.qty}× ${it.nombre} → ${formatPrice(it.precio * it.qty)}`));
    const total = items.reduce((a, b) => a + b.precio * b.qty, 0);
    lines.push('', `Total estimado: ${formatPrice(total)}`);
  }
  if (note.trim()) lines.push('', `Nota: ${note.trim()}`);
  return `https://wa.me/${phone}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function isOpen(horarios) {
  if (!horarios) return false;
  const days = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
  const schedule = horarios[days[new Date().getDay()]];
  if (!schedule) return false;
  const [o, c] = schedule.split('-').map(s => { const [h,m=0] = s.split(':').map(Number); return h*60+m; });
  const now = new Date().getHours()*60 + new Date().getMinutes();
  return now >= o && now < c;
}

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const ex = state.find(i => i.id === action.item.id);
      if (ex) return state.map(i => i.id === action.item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...state, { ...action.item, qty: 1 }];
    }
    case 'SET_QTY': {
      if (action.qty <= 0) return state.filter(i => i.id !== action.id);
      return state.map(i => i.id === action.id ? { ...i, qty: action.qty } : i);
    }
    case 'REMOVE': return state.filter(i => i.id !== action.id);
    case 'CLEAR': return [];
    default: return state;
  }
}

const VENTAJA_BADGE = {
  precio:         { label: 'Mejor precio',   icon: Tag,        color: 'bg-brand/10 text-brand border-brand/20' },
  disponibilidad: { label: 'Tenelo hoy',     icon: Zap,        color: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
  financiacion:   { label: 'Financiación',   icon: CreditCard, color: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
  combo:          { label: 'Combo especial', icon: Tag,        color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
};

// ─── CartDrawer ───────────────────────────────────────────────────────────────
const CartDrawer = ({ tienda, items, dispatch }) => {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState('');
  const total = items.reduce((a, b) => a + b.precio * b.qty, 0);
  const count = items.reduce((a, b) => a + b.qty, 0);
  const waUrl = buildWhatsAppUrl(tienda, items, note);

  if (count === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 bg-brand hover:bg-brand-dark text-white px-5 py-3 rounded-2xl shadow-2xl transition-all active:scale-95 text-sm font-semibold"
        style={{ boxShadow: '0 4px 20px rgba(0,184,217,0.4)' }}
      >
        <span className="relative">
          <ShoppingBag className="w-5 h-5" />
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-white text-brand rounded-full text-[10px] font-black flex items-center justify-center">
            {count > 9 ? '9+' : count}
          </span>
        </span>
        Ver pedido
        <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">{formatPrice(total)}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            className="relative bg-white dark:bg-slate-900 w-full max-w-lg rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-white/10 shrink-0">
              <div>
                <h2 className="font-bold text-base">Tu pedido</h2>
                <p className="text-xs text-slate-400">{count} {count === 1 ? 'producto' : 'productos'}</p>
              </div>
              <button onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {items.map(it => (
                <div key={it.id} className="flex items-center gap-3 bg-slate-50 dark:bg-white/5 rounded-2xl p-3">
                  {it.foto && (
                    <img src={it.foto} alt={it.nombre} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{it.nombre}</p>
                    <p className="text-xs text-slate-400">{formatPrice(it.precio)} c/u</p>
                  </div>
                  <div className="flex items-center gap-1 border border-slate-200 dark:border-white/15 rounded-xl">
                    <button onClick={() => dispatch({ type: 'SET_QTY', id: it.id, qty: it.qty - 1 })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-l-xl transition-colors">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold">{it.qty}</span>
                    <button onClick={() => dispatch({ type: 'SET_QTY', id: it.id, qty: it.qty + 1 })} className="p-1.5 hover:bg-slate-100 dark:hover:bg-white/10 rounded-r-xl transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <span className="text-sm font-bold text-brand w-16 text-right shrink-0">{formatPrice(it.precio * it.qty)}</span>
                  <button onClick={() => dispatch({ type: 'REMOVE', id: it.id })} className="text-slate-300 hover:text-rose-400 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div>
                <label className="text-xs text-slate-400 font-medium">Nota para el comercio (opcional)</label>
                <textarea
                  value={note}
                  onChange={e => setNote(e.target.value.slice(0, 300))}
                  rows={2}
                  placeholder="Ej: sin azúcar, para llevar a las 18hs..."
                  className="mt-1 w-full resize-none border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand"
                />
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-white/10 p-4 space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Total estimado</span>
                <span className="text-xl font-black text-brand">{formatPrice(total)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => dispatch({ type: 'CLEAR' })} className="px-4 py-2.5 border border-slate-200 dark:border-white/15 rounded-2xl text-sm font-medium hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  Vaciar
                </button>
                {waUrl ? (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white rounded-2xl py-2.5 text-sm font-bold transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    Enviar por WhatsApp
                  </a>
                ) : (
                  <div className="flex-1 flex items-center justify-center gap-2 bg-slate-100 dark:bg-white/10 text-slate-400 rounded-2xl py-2.5 text-sm font-bold">
                    Sin número de WhatsApp
                  </div>
                )}
              </div>
              <p className="text-center text-[10px] text-slate-400">El pago se coordina directamente con el comercio.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Cache helpers ────────────────────────────────────────────────────────────
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { ts, data } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL) return null;
    return data;
  } catch { return null; }
}

function cacheSet(key, data) {
  try { localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data })); } catch {}
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TiendaPublica({ slug }) {
  const [tienda, setTienda] = useState(null);
  const [ofertas, setOfertas] = useState(() => cacheGet(`tp-ofertas-${slug}`) || []);
  const [loading, setLoading] = useState(true);
  const [loaderHiding, setLoaderHiding] = useState(false);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('productos');
  const [cart, dispatch] = useReducer(cartReducer, []);

  useEffect(() => {
    const cacheKey = `tp-tienda-${slug}`;
    const cachedTienda = cacheGet(cacheKey);
    const cachedOfertas = cacheGet(`tp-ofertas-${slug}`);
    const startMs = Date.now();
    const MIN_LOADER_MS = 700; // mínimo para ver la animación del logo

    const reveal = (t, os) => {
      // Carga datos inmediatamente — espera solo si el fetch fue muy rápido
      if (os) setOfertas(os);
      setTienda(t); // pre-cargar todo mientras loader aún está visible
      const wait = Math.max(0, MIN_LOADER_MS - (Date.now() - startMs));
      setTimeout(() => {
        setLoaderHiding(true);
        setTimeout(() => setLoading(false), 320);
      }, wait);
    };

    if (cachedTienda) {
      reveal(cachedTienda, cachedOfertas);
    }

    (async () => {
      try {
        const [tRes, oRes] = await Promise.all([
          fetch(`${API_BASE}/tiendas-crud?slug=${encodeURIComponent(slug)}`),
          fetch(`${API_BASE}/ofertas?slug=${encodeURIComponent(slug)}`),
        ]);
        if (!tRes.ok) throw new Error('Tienda no encontrada');
        const t = await tRes.json();
        const os = oRes.ok ? await oRes.json() : [];
        const filtradas = Array.isArray(os) ? os.filter(o => o.activa !== false) : [];
        cacheSet(cacheKey, t);
        cacheSet(`tp-ofertas-${slug}`, filtradas);
        if (!cachedTienda) reveal(t, filtradas);
        else { setTienda(t); setOfertas(filtradas); }
      } catch (err) {
        if (!cachedTienda) { setError(err.message); setLoading(false); }
      }
    })();
  }, [slug]);

  const showLoader = loading || loaderHiding;

  if (error && !tienda) return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-7 h-7 text-rose-400" />
        </div>
        <h2 className="font-bold text-xl text-white mb-2">Tienda no encontrada</h2>
        <p className="text-slate-500 text-sm mb-6">El link puede estar desactualizado o la tienda ya no está disponible.</p>
        <a href="/" className="inline-flex items-center gap-2 bg-brand text-white font-bold px-6 py-3 rounded-2xl text-sm transition-colors">
          Ver tiendas en Lokal
        </a>
      </div>
    </div>
  );

  const tiendaConOfertas = tienda
    ? { ...tienda, productos: [...(tienda.productos || []), ...ofertas.filter(o => !tienda.productos?.find(p => p.id === o.id))] }
    : null;

  return (
    <>
      {/* Loader overlay — siempre encima, se desvanece suavemente */}
      {showLoader && (
        <div style={{
          position: 'fixed', inset: 0, background: '#060d1a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999,
          opacity: loaderHiding ? 0 : 1,
          transition: 'opacity .35s ease',
          pointerEvents: loaderHiding ? 'none' : 'auto',
        }}>
          <div style={{ position: 'absolute', inset: '0 0 35% 0', background: 'radial-gradient(ellipse 75% 55% at 50% 0%, rgba(0,184,217,0.22), transparent)', pointerEvents: 'none' }} />
          <LogoLoader />
        </div>
      )}

      {/* Página — monta cuando el loader ya terminó, sin transición propia */}
      {tiendaConOfertas && (
        <TiendaPublicaRenderer tienda={tiendaConOfertas} />
      )}
    </>
  );

  // Legacy below — kept for reference during migration
  const open = isOpen(tienda.horarios);
  const cover = tienda.galeria?.[0] || null;
  const logo = tienda.foto || null;
  const waUrl = buildWhatsAppUrl(tienda, []);
  const tabs = [
    { id: 'productos', label: `Productos${ofertas.length ? ` (${ofertas.length})` : ''}` },
    { id: 'info', label: 'Info' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pb-32">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/8">
        <button
          onClick={() => window.history.length > 1 ? window.history.back() : (window.location.href = '/')}
          className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-sm font-medium transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Volver
        </button>
        <a href="/" className="opacity-70 hover:opacity-100 transition-opacity">
          <LogoFull size={20} />
        </a>
      </div>

      {/* ── Cover + logo ────────────────────────────────────────────────── */}
      <div className="relative">
        <div className="h-48 lg:h-64 w-full overflow-hidden bg-gradient-to-br from-[#0B132B] via-[#003d4d] to-brand/60">
          {cover && <img src={cover} alt="" className="w-full h-full object-cover opacity-80" />}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
        </div>

        <div className="absolute left-5 lg:left-8 -bottom-10">
          <div className="w-20 h-20 lg:w-24 lg:h-24 rounded-3xl border-4 border-slate-50 dark:border-slate-950 overflow-hidden bg-white shadow-2xl">
            {logo
              ? <img src={logo} alt={tienda.nombre} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-4xl">🏪</div>
            }
          </div>
        </div>

        <div className="absolute right-4 bottom-3">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm ${open ? 'bg-brand/90 text-white' : 'bg-black/40 text-white/60'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${open ? 'bg-white' : 'bg-white/30'}`} />
            {open ? 'Abierto' : 'Cerrado'}
          </span>
        </div>
      </div>

      {/* ── Info tienda ─────────────────────────────────────────────────── */}
      <div className="px-5 lg:px-8 pt-14 pb-5 max-w-3xl mx-auto">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{tienda.nombre}</h1>
        {tienda.rubros?.length > 0 && (
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{tienda.rubros.join(' · ')}</p>
        )}
        {tienda.tagline && (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{tienda.tagline}</p>
        )}

        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3 text-xs text-slate-500 dark:text-slate-400">
          {tienda.ciudad && (
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{tienda.ciudad}</span>
          )}
          {tienda.direccion && (
            <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 opacity-0 w-0" />{tienda.direccion}</span>
          )}
          {tienda.instagram && (
            <a href={`https://instagram.com/${tienda.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1 hover:text-pink-500 transition-colors">
              <Instagram className="w-3.5 h-3.5" />@{tienda.instagram.replace('@','')}
            </a>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {waUrl && (
            <a href={waUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold px-4 py-2.5 rounded-2xl text-sm transition-colors shadow-lg shadow-[#25D366]/25">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </a>
          )}
          {tienda.telefono && (
            <a href={`tel:${tienda.telefono.replace(/\s/g,'')}`}
              className="inline-flex items-center gap-2 border border-slate-200 dark:border-white/15 hover:bg-slate-100 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold px-4 py-2.5 rounded-2xl text-sm transition-colors">
              <Phone className="w-4 h-4" />
              {tienda.telefono}
            </a>
          )}
        </div>
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────── */}
      <div className="sticky top-[53px] z-20 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/8">
        <div className="flex max-w-3xl mx-auto px-5 lg:px-8">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-brand text-brand'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Contenido ───────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-4 lg:px-8 pt-5">

        {tab === 'productos' && (
          ofertas.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-slate-300 dark:text-slate-600" />
              </div>
              <p className="font-semibold text-slate-500 dark:text-slate-400">Sin productos por ahora</p>
              <p className="text-sm text-slate-400 dark:text-slate-600 mt-1">Esta tienda no tiene productos publicados aún.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ofertas.map(o => {
                const foto = o.fotos?.[0] || o.foto || null;
                const inCart = cart.find(i => i.id === o.id);
                const badge = o.ventaja ? VENTAJA_BADGE[o.ventaja] : null;
                const discount = o.precioOriginal && o.precio && o.precioOriginal > o.precio
                  ? Math.round((1 - o.precio / o.precioOriginal) * 100)
                  : null;

                return (
                  <article key={o.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                    <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-white/5 relative">
                      {foto
                        ? <img src={foto} alt={o.titulo} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center text-3xl">🛍️</div>
                      }
                      {discount && (
                        <span className="absolute top-2 left-2 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg">
                          -{discount}%
                        </span>
                      )}
                    </div>
                    <div className="p-3 flex flex-col flex-1 gap-2">
                      <h3 className="text-sm font-semibold leading-tight text-slate-800 dark:text-white line-clamp-2">{o.titulo}</h3>

                      {badge && (() => {
                        const Icon = badge.icon;
                        return (
                          <span className={`self-start inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-lg border ${badge.color}`}>
                            <Icon className="w-3 h-3" />{badge.label}
                          </span>
                        );
                      })()}

                      <div className="mt-auto flex items-center justify-between gap-1">
                        <div>
                          {o.precioOriginal && o.precio && o.precioOriginal > o.precio && (
                            <p className="text-[10px] text-slate-400 line-through">{formatPrice(o.precioOriginal)}</p>
                          )}
                          <span className="text-sm font-black text-slate-900 dark:text-white">{formatPrice(o.precio)}</span>
                        </div>
                        {o.precio != null && (
                          inCart ? (
                            <div className="flex items-center gap-1 border border-slate-200 dark:border-white/15 rounded-xl">
                              <button onClick={() => dispatch({ type: 'SET_QTY', id: o.id, qty: inCart.qty - 1 })} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-l-xl transition-colors">
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-5 text-center text-xs font-bold">{inCart.qty}</span>
                              <button onClick={() => dispatch({ type: 'SET_QTY', id: o.id, qty: inCart.qty + 1 })} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-r-xl transition-colors">
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => dispatch({ type: 'ADD', item: { id: o.id, nombre: o.titulo, precio: o.precio, foto } })}
                              className="flex items-center gap-0.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold px-2.5 py-1.5 rounded-xl transition-colors active:scale-95"
                            >
                              <Plus className="w-3 h-3" /> Agregar
                            </button>
                          )
                        )}
                      </div>

                      {o.financiacion && (
                        <p className="text-[10px] text-violet-500 font-semibold">{o.financiacion}</p>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )
        )}

        {tab === 'info' && (
          <div className="space-y-3 pb-8">
            {tienda.descripcion && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8 p-4">
                <h3 className="font-bold text-sm mb-2 text-slate-700 dark:text-slate-300">Sobre la tienda</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{tienda.descripcion}</p>
              </div>
            )}
            {tienda.horarios && Object.keys(tienda.horarios).length > 0 && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8 p-4">
                <h3 className="font-bold text-sm mb-3 flex items-center gap-2 text-slate-700 dark:text-slate-300">
                  <Clock className="w-4 h-4 text-slate-400" /> Horarios
                </h3>
                <div className="space-y-1.5">
                  {['lunes','martes','miercoles','jueves','viernes','sabado','domingo'].map(d => {
                    const h = tienda.horarios[d];
                    if (!h) return null;
                    const labels = { lunes:'Lunes',martes:'Martes',miercoles:'Miércoles',jueves:'Jueves',viernes:'Viernes',sabado:'Sábado',domingo:'Domingo' };
                    const today = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'][new Date().getDay()];
                    return (
                      <div key={d} className={`flex justify-between text-sm py-0.5 ${d === today ? 'font-bold text-brand' : ''}`}>
                        <span className={d === today ? 'text-brand' : 'text-slate-500 dark:text-slate-400'}>{labels[d]}</span>
                        <span className={d === today ? 'text-brand' : 'font-semibold text-slate-700 dark:text-slate-200'}>{h}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8 p-4 space-y-2">
              <h3 className="font-bold text-sm mb-3 text-slate-700 dark:text-slate-300">Contacto</h3>
              {waUrl && (
                <a href={waUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold py-2.5 rounded-2xl text-sm transition-colors">
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
              {tienda.telefono && (
                <a href={`tel:${tienda.telefono.replace(/\s/g,'')}`}
                  className="flex items-center justify-center gap-2 w-full border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-2xl text-sm transition-colors">
                  <Phone className="w-4 h-4" /> {tienda.telefono}
                </a>
              )}
              {tienda.instagram && (
                <a href={`https://instagram.com/${tienda.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-2xl text-sm transition-colors">
                  <Instagram className="w-4 h-4" /> @{tienda.instagram.replace('@','')}
                </a>
              )}
              {tienda.direccion && tienda.lat && tienda.lng && (
                <a href={`https://www.google.com/maps?q=${tienda.lat},${tienda.lng}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-2xl text-sm transition-colors">
                  <MapPin className="w-4 h-4" /> Cómo llegar
                </a>
              )}
              {tienda.website && (
                <a href={tienda.website} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full border border-slate-200 dark:border-white/15 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-700 dark:text-slate-200 font-semibold py-2.5 rounded-2xl text-sm transition-colors">
                  <Globe className="w-4 h-4" /> Sitio web
                </a>
              )}
            </div>

            {tienda.direccion && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8 p-4">
                <h3 className="font-bold text-sm mb-1 text-slate-700 dark:text-slate-300">Dirección</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{tienda.direccion}</p>
                {tienda.ciudad && <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{tienda.ciudad}</p>}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <div className="max-w-3xl mx-auto px-5 mt-10 pb-4 text-center">
        <div className="border-t border-slate-200 dark:border-white/8 pt-6 flex flex-col items-center gap-2">
          <a href="/" className="opacity-50 hover:opacity-80 transition-opacity">
            <LogoFull size={18} />
          </a>
          <p className="text-xs text-slate-400 dark:text-slate-600">
            Micropágina de {tienda.nombre} en Lokal
          </p>
        </div>
      </div>

      <CartDrawer tienda={tienda} items={cart} dispatch={dispatch} />
    </div>
  );
}
