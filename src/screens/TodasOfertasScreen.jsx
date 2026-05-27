import React from 'react';
import {
  Search, X, Store, Package, Tag, Filter, MessageSquare,
  ChevronLeft, ChevronRight, Star, Loader2, ArrowUpDown,
  MapPin, Check, Truck,
} from 'lucide-react';
import { LayoutGrid, LayoutList } from 'lucide-react';
import PageHeader from '../components/layout/PageHeader';
import CategoryIcon from '../CategoryIcon';
import SimpleSelect from '../components/ui/SimpleSelect';
import { VENTAJA_CONFIG } from '../utils/ventajaConfig';
import { getCategoryPath } from '../categories';
import { isStoreOpen } from '../utils/helpers';

// ── SEARCH_KEYWORD_MAP ────────────────────────────────────────────────────────
const SEARCH_KEYWORD_MAP = {
  mouse: ['computacion', 'electronica'], teclado: ['computacion', 'electronica'],
  monitor: ['computacion', 'electronica'], auricular: ['electronica'], auriculares: ['electronica'],
  parlante: ['electronica'], parlantes: ['electronica'], celular: ['electronica'],
  telefono: ['electronica'], smartphone: ['electronica'], tablet: ['computacion', 'electronica'],
  notebook: ['computacion'], laptop: ['computacion'], pc: ['computacion'],
  computadora: ['computacion'], impresora: ['computacion'], router: ['computacion', 'electronica'],
  cargador: ['electronica', 'computacion'], cable: ['electronica', 'computacion'],
  camara: ['electronica'], camara_foto: ['electronica'], tv: ['electrodomesticos', 'electronica'],
  television: ['electrodomesticos'], smart: ['electronica', 'electrodomesticos'],
  heladera: ['electrodomesticos'], lavarropas: ['electrodomesticos'],
  microondas: ['electrodomesticos'], licuadora: ['electrodomesticos'],
  cafetera: ['electrodomesticos'], plancha: ['electrodomesticos'],
  aspiradora: ['electrodomesticos'], ventilador: ['electrodomesticos'],
  aire: ['electrodomesticos'], calefactor: ['electrodomesticos'],
  remera: ['ropa'], pantalon: ['ropa'], camisa: ['ropa'], vestido: ['ropa'],
  buzo: ['ropa'], campera: ['ropa'], ropa: ['ropa'], indumentaria: ['ropa'],
  zapatilla: ['calzado', 'deportes'], zapato: ['calzado'], bota: ['calzado'],
  calzado: ['calzado'], sandalia: ['calzado'], deportes: ['deportes'],
  bicicleta: ['deportes'], pelota: ['deportes'], gimnasio: ['deportes'],
  pesa: ['deportes'], fitness: ['deportes'], yoga: ['deportes'],
  hamburguesa: ['alimentos'], pizza: ['alimentos'], empanada: ['alimentos'],
  medialunas: ['alimentos'], facturas: ['alimentos'], pan: ['alimentos'],
  cafe: ['alimentos'], bebida: ['alimentos'], cerveza: ['alimentos'],
  comida: ['alimentos'], almuerzo: ['alimentos'], cena: ['alimentos'],
  desayuno: ['alimentos'], delivery: ['alimentos'], supermercado: ['alimentos'],
  verdura: ['alimentos'], fruta: ['alimentos'], carne: ['alimentos'],
  silla: ['hogar'], mesa: ['hogar'], sofa: ['hogar'], cama: ['hogar'],
  colchon: ['hogar'], mueble: ['hogar'], lampara: ['hogar'], cortina: ['hogar'],
  pintura: ['construccion'], cemento: ['construccion'], ladrillos: ['construccion'],
  herramienta: ['ferreteria'], taladro: ['ferreteria'], tornillo: ['ferreteria'],
  llave: ['ferreteria'], caño: ['construccion', 'ferreteria'],
  medicamento: ['salud'], farmacia: ['salud'], vitamina: ['salud'],
  shampoo: ['salud'], perfume: ['salud'], maquillaje: ['salud'],
  crema: ['salud'], peluqueria: ['salud', 'servicios'], belleza: ['salud'],
  perro: ['mascotas'], gato: ['mascotas'], mascota: ['mascotas'],
  veterinario: ['mascotas', 'servicios'], alimento_mascota: ['mascotas'],
  collar: ['mascotas'], juguete_mascota: ['mascotas'],
  auto: ['automotores'], moto: ['automotores'], repuesto: ['automotores'],
  aceite: ['automotores'], neumatico: ['automotores'], llanta: ['automotores'],
  bateria: ['automotores', 'electronica'],
  plomero: ['servicios'], electricista: ['servicios'], pintor: ['servicios'],
  gasista: ['servicios'], cerrajero: ['servicios'], reparacion: ['servicios'],
  juguete: ['juguetes'], muñeca: ['juguetes'], lego: ['juguetes'],
  libro: ['libros'], revista: ['libros'], cuaderno: ['libros'],
};

function inferCategoriesFromQuery(q) {
  if (!q) return [];
  const words = q.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/\s+/);
  const cats = new Set();
  words.forEach(w => { (SEARCH_KEYWORD_MAP[w] || []).forEach(c => cats.add(c)); });
  return [...cats];
}

function getTiendasSimilares(tiendas, referenceTiendas, excludeIds = new Set()) {
  return tiendas.filter(t => {
    if (excludeIds.has(t.id)) return false;
    return referenceTiendas.some(ref =>
      (t.categoryIds || []).some(cid => (ref.categoryIds || []).includes(cid)) ||
      (ref.rubro && t.rubro?.toLowerCase() === ref.rubro?.toLowerCase())
    );
  });
}

// ── RelatedStoresCarousel ──────────────────────────────────────────────────────
function RelatedStoresCarousel({ stores, label, onSelect }) {
  const scrollRef = React.useRef(null);
  const [canLeft, setCanLeft] = React.useState(false);
  const [canRight, setCanRight] = React.useState(false);
  const check = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8);
  };
  React.useEffect(() => { check(); }, [stores]);
  const scroll = (d) => scrollRef.current?.scrollBy({ left: d * 280, behavior: 'smooth' });
  return (
    <div className="col-span-full py-3">
      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2.5">{label}</p>
      <div className="relative">
        {canLeft  && <div className="absolute left-0 top-0 bottom-0 w-10 bg-gradient-to-r from-[#f7f8fa] dark:from-[#0a0d16] to-transparent z-10 pointer-events-none" />}
        {canRight && <div className="absolute right-0 top-0 bottom-0 w-10 bg-gradient-to-l from-[#f7f8fa] dark:from-[#0a0d16] to-transparent z-10 pointer-events-none" />}
        {canLeft  && <button onClick={() => scroll(-1)} className="absolute left-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 flex items-center justify-center"><ChevronLeft className="w-4 h-4 text-slate-600 dark:text-slate-300" /></button>}
        {canRight && <button onClick={() => scroll(1)}  className="absolute right-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white dark:bg-slate-800 shadow-md border border-slate-200 dark:border-white/10 flex items-center justify-center"><ChevronRight className="w-4 h-4 text-slate-600 dark:text-slate-300" /></button>}
        <div ref={scrollRef} onScroll={check} className="flex gap-2.5 overflow-x-auto no-scrollbar pb-1 lg:grid lg:grid-cols-6 lg:overflow-x-visible">
          {stores.map(t => {
            const open = isStoreOpen(t.horarios);
            return (
              <div key={t.id} onClick={() => onSelect(t)}
                className="flex-shrink-0 w-40 lg:w-auto bg-white dark:bg-slate-900 rounded-2xl p-3 cursor-pointer hover:shadow-md transition-all active:scale-[0.97] border border-slate-100 dark:border-white/6">
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0 overflow-hidden">
                    {t.logo ? <img src={t.logo} alt="" className="w-full h-full object-cover" /> : <span className="text-sm font-black text-primary">{t.nombre?.[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="font-bold text-xs leading-snug line-clamp-2">{t.nombre}</p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">{t.rubro}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${open ? 'bg-ok' : 'bg-slate-300'}`} />
                    <span className={`text-[10px] font-medium ${open ? 'text-ok' : 'text-slate-400'}`}>{open ? 'Abierto' : 'Cerrado'}</span>
                  </div>
                  {t.rating && <span className="flex items-center gap-0.5 text-[10px] font-bold text-amber-500"><Star className="w-2.5 h-2.5 fill-amber-400 stroke-none" />{t.rating}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── TodasOfertasScreen ────────────────────────────────────────────────────────
export default function TodasOfertasScreen({
  searchQuery: initialQuery = '',
  visibleOfertas,
  tiendas,
  allCategories,
  ofertasStoreFilter,
  setOfertasStoreFilter,
  loadingOfertas,
  goBack,
  navigate,
  setSelectedProduct,
  setSelectedTienda,
  setEditingDemanda,
  pageHeaderProps,
}) {
  const [ofertaSearch, setOfertaSearch] = React.useState(initialQuery);
  const [filtroVentaja, setFiltroVentaja] = React.useState(null);
  const [filtroCategoria, setFiltroCategoria] = React.useState(null);
  const [viewMode, setViewMode] = React.useState(() => localStorage.getItem('lokal-view-ofertas') || 'grid');
  const toggleView = () => setViewMode(m => { const n = m === 'list' ? 'grid' : 'list'; localStorage.setItem('lokal-view-ofertas', n); return n; });
  const [storeCtx] = React.useState(() => ofertasStoreFilter);

  const [qAbierto,   setQAbierto]   = React.useState(false);
  const [qEnvio,     setQEnvio]     = React.useState(false);
  const [qDescuento, setQDescuento] = React.useState(false);
  const [qStock,     setQStock]     = React.useState(false);

  const [precioMin, setPrecioMin] = React.useState('');
  const [precioMax, setPrecioMax] = React.useState('');
  const [precioMinInput, setPrecioMinInput] = React.useState('');
  const [precioMaxInput, setPrecioMaxInput] = React.useState('');
  const parseMiles = (val) => String(val).replace(/\./g, '').replace(/,/g, '');
  const handlePrecioChange = (val, setSrc) => {
    const raw = parseMiles(val);
    const formatted = raw ? Number(raw).toLocaleString('es-AR') : '';
    setSrc(formatted);
  };
  const applyPrecio = () => { setPrecioMin(parseMiles(precioMinInput)); setPrecioMax(parseMiles(precioMaxInput)); };
  const clearPrecio = () => { setPrecioMin(''); setPrecioMax(''); setPrecioMinInput(''); setPrecioMaxInput(''); };

  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [filtersClosing, setFiltersClosing] = React.useState(false);
  const closeFilters = () => { setFiltersClosing(true); setTimeout(() => { setFiltersClosing(false); setFiltersOpen(false); }, 280); };

  const [sortBy, setSortBy] = React.useState('relevancia');
  const SORT_OPTIONS = [
    { value: 'relevancia',  label: 'Relevancia' },
    { value: 'precio-asc',  label: 'Menor precio' },
    { value: 'precio-desc', label: 'Mayor precio' },
  ];

  const [filtrosAtributos, setFiltrosAtributos] = React.useState({});

  const ofertasActivas = React.useMemo(() => {
    return visibleOfertas.filter(o => {
      if (o.activa === false) return false;
      if (storeCtx && o.tiendaId !== storeCtx.id) return false;
      const q = ofertaSearch.toLowerCase();
      if (q && !o.titulo.toLowerCase().includes(q) && !o.tiendaNombre?.toLowerCase().includes(q) && !o.descripcion?.toLowerCase().includes(q)) return false;
      if (filtroVentaja && o.ventaja !== filtroVentaja) return false;
      if (filtroCategoria) {
        const path = getCategoryPath(o.categoryId, allCategories);
        if (o.categoryId !== filtroCategoria && !path.some(c => c.id === filtroCategoria)) return false;
      }
      if (qAbierto)   { const t = tiendas.find(t => t.id === o.tiendaId); if (!t || !isStoreOpen(t.horarios)) return false; }
      if (qEnvio)     { if (o.ventaja !== 'disponibilidad' && !o.envio) return false; }
      if (qDescuento) { if (!o.precioOriginal || !o.precio || Number(o.precioOriginal) <= Number(o.precio)) return false; }
      if (qStock)     { if (!o.stock || Number(o.stock) <= 0) return false; }
      for (const [key, vals] of Object.entries(filtrosAtributos)) {
        if (!vals || vals.length === 0) continue;
        if (!o.attributes || !vals.includes(String(o.attributes[key]))) return false;
      }
      const pMin = precioMin !== '' ? Number(precioMin) : null;
      const pMax = precioMax !== '' ? Number(precioMax) : null;
      if (pMin !== null && (o.precio == null || Number(o.precio) < pMin)) return false;
      if (pMax !== null && (o.precio == null || Number(o.precio) > pMax)) return false;
      return true;
    }).sort((a, b) => {
      if (sortBy === 'precio-asc')  return (a.precio || Infinity) - (b.precio || Infinity);
      if (sortBy === 'precio-desc') return (b.precio || 0) - (a.precio || 0);
      return 0;
    });
  }, [visibleOfertas, storeCtx, ofertaSearch, filtroVentaja, filtroCategoria, qAbierto, qEnvio, qDescuento, qStock, filtrosAtributos, precioMin, precioMax, sortBy]);

  const activeAttrCount = Object.values(filtrosAtributos).filter(v => v && v.length > 0).length;
  const activeFilterCount = [filtroVentaja, filtroCategoria, qAbierto, qEnvio, qDescuento, qStock, precioMin !== '' || precioMax !== ''].filter(Boolean).length + activeAttrCount;

  const tiendasRelacionadas = React.useMemo(() => {
    const q = ofertaSearch.trim().toLowerCase();
    const seen = new Set();
    const add = (arr) => arr.filter(t => { if (seen.has(t.id)) return false; seen.add(t.id); return true; });
    const directIds = new Set(ofertasActivas.map(o => o.tiendaId));
    const byProducts = add(tiendas.filter(t => directIds.has(t.id)));
    const bySimilar = add(getTiendasSimilares(tiendas, byProducts, directIds));
    const inferredCats = inferCategoriesFromQuery(q);
    const byInferred = inferredCats.length > 0 ? add(tiendas.filter(t =>
      (t.categoryIds || []).some(cid => inferredCats.includes(cid)) ||
      inferredCats.some(cat => t.rubro?.toLowerCase().includes(cat))
    )) : [];
    const byProfile = q ? add(tiendas.filter(t =>
      t.nombre?.toLowerCase().includes(q) || t.rubro?.toLowerCase().includes(q) ||
      t.descripcion?.toLowerCase().includes(q) || (t.tags || []).some(tag => tag.toLowerCase().includes(q))
    )) : [];
    return [...byProducts, ...bySimilar, ...byInferred, ...byProfile].slice(0, 12);
  }, [ofertasActivas, ofertaSearch, tiendas]);

  const precioRangoBase = React.useMemo(() => {
    const precios = ofertasActivas.map(o => Number(o.precio)).filter(p => p > 0);
    if (precios.length === 0) return null;
    return { min: Math.min(...precios), max: Math.max(...precios) };
  }, [ofertasActivas]);

  const atributosDisponibles = React.useMemo(() => {
    const map = {};
    const SKIP_KEYS = new Set(['modelo', 'estado']);
    ofertasActivas.forEach(o => {
      if (!o.attributes) return;
      Object.entries(o.attributes).forEach(([k, v]) => {
        if (SKIP_KEYS.has(k) || !v) return;
        if (!map[k]) map[k] = { key: k, label: k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g, ' '), values: new Set() };
        map[k].values.add(String(v));
      });
    });
    return Object.values(map).filter(a => a.values.size >= 2).map(a => ({ ...a, values: [...a.values].sort() }));
  }, [ofertasActivas]);

  const productosInteresantes = React.useMemo(() => {
    if (!ofertaSearch.trim() && !filtroCategoria) return [];
    const activaIds = new Set(ofertasActivas.map(o => o.id));
    const tiendaIds = new Set(tiendasRelacionadas.map(t => t.id));
    return visibleOfertas.filter(o =>
      o.activa !== false && !activaIds.has(o.id) && tiendaIds.has(o.tiendaId)
    ).slice(0, 12);
  }, [ofertasActivas, tiendasRelacionadas, visibleOfertas, ofertaSearch, filtroCategoria]);

  const SortIconBtn = ({ className = '' }) => {
    const [open, setOpen] = React.useState(false);
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (!open) return;
      const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', h);
      return () => document.removeEventListener('mousedown', h);
    }, [open]);
    return (
      <div ref={ref} className={`relative ${className}`}>
        <button onClick={() => setOpen(v => !v)}
          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${sortBy !== 'relevancia' ? 'bg-slate-900 dark:bg-brand text-white' : 'bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400'}`}>
          <ArrowUpDown className="w-4 h-4" />
        </button>
        {open && (
          <div className="absolute right-0 top-full mt-1.5 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-white/10 overflow-hidden z-50 min-w-[160px]">
            {SORT_OPTIONS.map(o => (
              <button key={o.value} onClick={() => { setSortBy(o.value); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm transition-colors text-left ${sortBy === o.value ? 'bg-slate-50 dark:bg-white/5 font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5'}`}>
                {sortBy === o.value && <Check className="w-3.5 h-3.5 text-primary shrink-0" />}
                <span className={sortBy === o.value ? '' : 'pl-5'}>{o.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const chipClass = (active) => `shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
    active ? 'bg-slate-900 dark:bg-brand text-white shadow-sm' : 'bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/12'
  }`;

  const FiltersPanel = ({ onClose, hideSort }) => {
    const activeChips = [
      ...(filtroCategoria ? [{ key: 'cat', label: (() => { const c = allCategories.find(c => c.id === filtroCategoria); return c?.shortName || c?.name || filtroCategoria; })(), onRemove: () => setFiltroCategoria(null) }] : []),
      ...(filtroVentaja   ? [{ key: 'vtj', label: VENTAJA_CONFIG[filtroVentaja]?.label || filtroVentaja, onRemove: () => setFiltroVentaja(null) }] : []),
      ...(qAbierto        ? [{ key: 'abi', label: 'Abierto ahora', onRemove: () => setQAbierto(false) }] : []),
      ...(qEnvio          ? [{ key: 'env', label: 'Con envío',     onRemove: () => setQEnvio(false)   }] : []),
      ...(qDescuento      ? [{ key: 'des', label: 'Con descuento', onRemove: () => setQDescuento(false) }] : []),
      ...(qStock          ? [{ key: 'stk', label: 'Con stock',     onRemove: () => setQStock(false)    }] : []),
      ...((precioMin !== '' || precioMax !== '') ? [{ key: 'prc', label: `$${precioMin ? Number(precioMin).toLocaleString('es-AR') : '0'} — $${precioMax ? Number(precioMax).toLocaleString('es-AR') : '∞'}`, onRemove: clearPrecio }] : []),
      ...Object.entries(filtrosAtributos).filter(([,v]) => v && v.length > 0).flatMap(([k, vals]) =>
        vals.map(v => ({
          key: `attr_${k}_${v}`,
          label: `${k.charAt(0).toUpperCase() + k.slice(1).replace(/_/g,' ')}: ${v}`,
          onRemove: () => setFiltrosAtributos(f => ({ ...f, [k]: (f[k] || []).filter(x => x !== v) }))
        }))
      ),
    ];
    return (
      <div className="flex flex-col gap-5">
        {activeChips.length > 0 && (
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Filtros aplicados</p>
            <div className="flex flex-wrap gap-1.5">
              {activeChips.map(chip => (
                <button key={chip.key} onClick={() => { chip.onRemove(); }}
                  className="flex items-center gap-1.5 pl-3 pr-2 py-1.5 rounded-full text-xs font-semibold bg-slate-900 dark:bg-brand text-white transition-all hover:opacity-80">
                  {chip.label}
                  <X className="w-3 h-3 opacity-70 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Filtros rápidos</p>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setQAbierto(v => !v)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${qAbierto ? 'bg-ok text-white shadow-sm' : 'bg-ok/10 text-slate-700 dark:text-slate-200 hover:bg-ok/20'}`}>
              <span className={`w-2 h-2 rounded-full shrink-0 ${qAbierto ? 'bg-white' : 'bg-ok'}`} />
              Abierto ahora
            </button>
            <button onClick={() => setQEnvio(v => !v)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${qEnvio ? 'bg-brand text-white shadow-sm' : 'bg-brand/10 text-slate-700 dark:text-slate-200 hover:bg-brand/20'}`}>
              <Truck className="w-3.5 h-3.5 shrink-0" />
              Con envío
            </button>
            <button onClick={() => setQDescuento(v => !v)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${qDescuento ? 'bg-rose-500 text-white shadow-sm' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-500/20'}`}>
              <Tag className="w-3.5 h-3.5 shrink-0" />
              Con descuento
            </button>
            <button onClick={() => setQStock(v => !v)}
              className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${qStock ? 'bg-emerald-600 text-white shadow-sm' : 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20'}`}>
              <Package className="w-3.5 h-3.5 shrink-0" />
              Con stock
            </button>
            {Object.entries(VENTAJA_CONFIG).map(([key, v]) => (
              <button key={key} onClick={() => { setFiltroVentaja(filtroVentaja === key ? null : key); onClose?.(); }}
                className={`shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${filtroVentaja === key ? `${v.color} text-white shadow-sm` : `${v.pastel} hover:opacity-80`}`}>
                <v.Icon className={`w-3.5 h-3.5 shrink-0 ${filtroVentaja === key ? '' : v.iconColor || ''}`} />{v.label}
              </button>
            ))}
          </div>
        </div>
        {atributosDisponibles.map(attr => (
          <div key={attr.key}>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">{attr.label}</p>
            <div className="flex flex-wrap gap-1.5">
              {attr.values.map(val => {
                const active = (filtrosAtributos[attr.key] || []).includes(val);
                return (
                  <button key={val} onClick={() => setFiltrosAtributos(f => {
                    const prev = f[attr.key] || [];
                    return { ...f, [attr.key]: active ? prev.filter(x => x !== val) : [...prev, val] };
                  })}
                    className={`shrink-0 flex items-center px-3 py-1.5 rounded-full text-xs font-medium transition-all ${active ? 'bg-slate-900 dark:bg-brand text-white shadow-sm' : 'bg-slate-100 dark:bg-white/8 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-white/12'}`}>
                    {val}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
        {precioRangoBase && (
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Precio</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">$</span>
                <input type="text" inputMode="numeric" value={precioMinInput}
                  onChange={e => handlePrecioChange(e.target.value, setPrecioMinInput)}
                  onKeyDown={e => e.key === 'Enter' && applyPrecio()}
                  placeholder={precioRangoBase.min.toLocaleString('es-AR')}
                  className="w-full pl-5 pr-2 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <span className="text-slate-300 dark:text-slate-600 text-xs shrink-0">—</span>
              <div className="flex-1 relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none">$</span>
                <input type="text" inputMode="numeric" value={precioMaxInput}
                  onChange={e => handlePrecioChange(e.target.value, setPrecioMaxInput)}
                  onKeyDown={e => e.key === 'Enter' && applyPrecio()}
                  placeholder={precioRangoBase.max.toLocaleString('es-AR')}
                  className="w-full pl-5 pr-2 py-2 text-sm rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-slate-200 placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
              </div>
              <button onClick={applyPrecio} className="shrink-0 px-3 py-2 rounded-xl bg-slate-900 dark:bg-brand text-white text-xs font-bold transition-all hover:opacity-80">OK</button>
            </div>
          </div>
        )}
        <div>
          <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Categoría</p>
          <div className="flex flex-wrap gap-2">
            {allCategories.filter(c => !c.parentId).map(c => (
              <button key={c.id} onClick={() => { setFiltroCategoria(filtroCategoria === c.id ? null : c.id); onClose?.(); }}
                className={chipClass(filtroCategoria === c.id)}>
                <CategoryIcon name={c.icon} className="w-3.5 h-3.5" />
                {c.shortName || c.name}
              </button>
            ))}
          </div>
        </div>
        {!hideSort && (
          <div>
            <p className="text-xs font-bold tracking-widest uppercase text-slate-400 mb-2">Ordenar por</p>
            <SimpleSelect value={sortBy} onChange={(v) => { setSortBy(v); onClose?.(); }} options={SORT_OPTIONS} compact />
          </div>
        )}
        {activeFilterCount > 0 && (
          <button onClick={() => { setFiltroCategoria(null); setFiltroVentaja(null); setSortBy('relevancia'); setQAbierto(false); setQEnvio(false); setQDescuento(false); setQStock(false); setFiltrosAtributos({}); clearPrecio(); onClose?.(); }}
            className="mt-1 text-sm font-semibold text-rose-500 hover:text-rose-600 text-left">
            Limpiar todos los filtros
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f8fa] dark:bg-[#0a0d16] pb-28 lg:pb-0">
      <PageHeader
        {...pageHeaderProps}
        title="Explorar productos"
        hideTitle
        onBack={() => { setOfertasStoreFilter(null); goBack(); }}
        searchValue={ofertaSearch}
        searchInput={<>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input type="text" value={ofertaSearch} onChange={e => setOfertaSearch(e.target.value)}
            placeholder="Buscar productos o tiendas..."
            className="ui-input w-full pl-9 pr-3 bg-slate-100 dark:bg-white/6 text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary transition-all" />
        </>}
        filtersSlot={storeCtx ? (
          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 dark:bg-primary/10 border-b border-primary/10">
            <Store className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-xs text-slate-500 dark:text-slate-400">Productos de</span>
            <span className="text-xs font-bold text-primary flex-1 truncate">{storeCtx.nombre}</span>
            <button onClick={() => setOfertasStoreFilter(null)} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold shrink-0 flex items-center gap-1">Ver todas <X className="w-3 h-3" /></button>
          </div>
        ) : null}
      >
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={toggleView} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 transition-colors text-slate-500 dark:text-slate-400">
            {viewMode === 'list' ? <LayoutGrid className="w-4 h-4" /> : <LayoutList className="w-4 h-4" />}
          </button>
          {loadingOfertas && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
        </div>
      </PageHeader>

      <div className="lg:flex lg:items-start lg:gap-4 lg:px-4 lg:min-h-[calc(100vh-3.5rem)]">
        <aside className="hidden lg:flex lg:flex-col w-72 shrink-0 sticky top-14 h-[calc(100vh-3.5rem)] py-4">
          <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/8">
            <div className="flex items-center justify-between p-4 pb-3">
              <p className="font-bold text-sm">Filtros</p>
              {activeFilterCount > 0 && <span className="text-xs font-bold text-white bg-primary rounded-full w-5 h-5 flex items-center justify-center">{activeFilterCount}</span>}
            </div>
            <div className="px-4 pb-4">
              <FiltersPanel hideSort />
            </div>
          </div>
        </aside>

        <div className="flex-1 min-w-0 px-4 lg:px-0 py-4 flex flex-col min-h-[calc(100vh-7rem)]">
          <div className="flex items-center justify-between mb-3 lg:mb-4 gap-2">
            <p className="text-xs text-slate-400 font-medium shrink-0">
              {ofertasActivas.length} {ofertasActivas.length === 1 ? 'resultado' : 'resultados'}
            </p>
            <div className="flex items-center gap-1.5 min-w-0">
              {filtroCategoria && (() => {
                const catActiva = allCategories.find(c => c.id === filtroCategoria);
                return catActiva ? (
                  <button onClick={() => setFiltroCategoria(null)}
                    className="lg:hidden flex items-center gap-1 h-8 pl-2 pr-2.5 rounded-xl bg-slate-900 dark:bg-brand text-white text-xs font-semibold shrink-0 transition-all max-w-[140px]">
                    <CategoryIcon name={catActiva.icon} className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">{catActiva.shortName || catActiva.name}</span>
                    <X className="w-3 h-3 shrink-0 opacity-60 ml-0.5" />
                  </button>
                ) : null;
              })()}
              <button onClick={() => setFiltersOpen(true)}
                className={`lg:hidden relative w-8 h-8 rounded-xl flex items-center justify-center transition-all shrink-0 ${activeFilterCount > 0 ? 'bg-slate-900 dark:bg-brand text-white' : 'bg-slate-100 dark:bg-white/8 text-slate-500 dark:text-slate-400'}`}>
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-brand rounded-full" />}
              </button>
              <SortIconBtn className="lg:hidden" />
              <div className="hidden lg:block w-36">
                <SimpleSelect value={sortBy} onChange={setSortBy} options={SORT_OPTIONS} compact />
              </div>
            </div>
          </div>

          {ofertasActivas.length === 0 ? (
            <div className="py-8 flex flex-col gap-6 flex-1">
              <div className="text-center">
                {(() => {
                  const catActiva = filtroCategoria ? allCategories.find(c => c.id === filtroCategoria) : null;
                  return (
                    <div className="w-14 h-14 bg-slate-100 dark:bg-white/6 rounded-2xl flex items-center justify-center mb-3 mx-auto">
                      {catActiva
                        ? <CategoryIcon name={catActiva.icon} className="w-7 h-7 text-slate-300 dark:text-white/20" />
                        : <Tag className="w-7 h-7 text-slate-300 dark:text-white/20" />
                      }
                    </div>
                  );
                })()}
                <h3 className="font-black text-base mb-1">
                  {ofertaSearch ? 'Sin resultados exactos' : filtroCategoria ? 'Sin publicaciones aquí' : 'Todavía no hay productos'}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {filtroCategoria
                    ? 'No hay publicaciones en esta categoría'
                    : ofertaSearch
                      ? `No encontramos "${ofertaSearch}" en el catálogo`
                      : 'Sé el primero en publicar o publicá una demanda'}
                </p>
                {activeFilterCount > 0 && (
                  <button onClick={() => { setFiltroCategoria(null); setFiltroVentaja(null); setSortBy('relevancia'); setQAbierto(false); setQEnvio(false); setQDescuento(false); setQStock(false); setFiltrosAtributos({}); clearPrecio(); }}
                    className="mt-3 px-4 py-1.5 bg-primary/10 text-primary rounded-xl text-sm font-bold hover:bg-primary/20 transition-colors">
                    Limpiar filtros
                  </button>
                )}
              </div>

              <div className="flex justify-center">
                <button
                  onClick={() => { setEditingDemanda({ titulo: ofertaSearch || '' }); navigate('crear'); }}
                  className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98] text-left max-w-sm w-full">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <MessageSquare className="w-4 h-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white">Publicar una demanda</p>
                    <p className="text-[11px] text-slate-400 leading-snug">Las tiendas locales te van a responder si lo tienen</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
                </button>
              </div>

              {tiendasRelacionadas.length >= 1 && (
                <RelatedStoresCarousel
                  stores={tiendasRelacionadas}
                  label="Tiendas que podrían tener lo que buscás"
                  onSelect={t => { setSelectedTienda(t); navigate('tienda-detail'); }}
                />
              )}

              {(() => {
                const tiendaIds = new Set(tiendasRelacionadas.map(t => t.id));
                const sugeridos = tiendaIds.size > 0
                  ? visibleOfertas.filter(o => o.activa !== false && tiendaIds.has(o.tiendaId)).slice(0, 12)
                  : visibleOfertas.filter(o => o.activa !== false).slice(0, 12);
                if (!sugeridos.length) return null;
                return (
                  <div className="mt-auto">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                      {tiendaIds.size > 0 ? 'Productos de estas tiendas' : 'Explorá estos productos'}
                    </p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                      {sugeridos.map((o) => {
                        const vc = VENTAJA_CONFIG[o.ventaja] || {};
                        const img = o.galeria?.[0] || o.fotos?.[0];
                        return (
                          <div key={o.id} onClick={() => { setSelectedProduct(o); navigate('product-detail'); }}
                            className="flex-shrink-0 w-[30vw] lg:w-40 bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-lg transition-all cursor-pointer active:scale-[0.98]">
                            <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/6 dark:to-white/10 relative overflow-hidden">
                              {img ? <img src={img} alt="" className="w-full h-full object-cover" />
                                : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-slate-300 dark:text-white/20" /></div>}
                              {vc.label && vc.Icon && (
                                <span className={`absolute top-1.5 left-1.5 ${vc.pastel} text-slate-700 dark:text-slate-200 text-[8px] font-bold px-1.5 py-0.5 rounded-lg flex items-center gap-0.5 shadow`}>
                                  <vc.Icon className={`w-2 h-2 shrink-0 ${vc.iconColor || ''}`} />{vc.label}
                                </span>
                              )}
                            </div>
                            <div className="p-2.5">
                              <p className="font-bold text-[11px] leading-snug line-clamp-2 mb-0.5">{o.titulo}</p>
                              {o.precio ? <p className="text-xs font-black">${Number(o.precio).toLocaleString()}</p>
                                : <p className="text-[10px] text-slate-400 italic">Consultá</p>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          ) : (<>
            <div className={viewMode === 'grid' ? 'grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 lg:gap-3' : 'grid grid-cols-1 sm:grid-cols-2 gap-3'}>
              {ofertasActivas.map((o, i) => {
                const vc = VENTAJA_CONFIG[o.ventaja] || {};
                const img = o.galeria?.[0] || o.fotos?.[0];

                if (viewMode === 'grid') return (
                  <div key={o.id}
                    onClick={() => { setSelectedProduct(o); navigate('product-detail'); }}
                    className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/35 transition-all animate-fade-up cursor-pointer active:scale-[0.98] select-none"
                    style={{ animationDelay: `${i * 20}ms` }}>
                    <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/6 dark:to-white/10 relative overflow-hidden">
                      {img ? <img src={img} alt="" className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-slate-300 dark:text-white/20" /></div>}
                      {vc.label && vc.Icon && (
                        <span className={`absolute top-2 left-2 ${vc.pastel} text-slate-700 dark:text-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded-xl flex items-center gap-1 shadow`}>
                          <vc.Icon className={`w-2.5 h-2.5 shrink-0 ${vc.iconColor || ''}`} />{vc.label}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="font-bold text-[13px] leading-snug line-clamp-2 mb-0.5">{o.titulo}</p>
                      <p className="text-[11px] text-slate-400 truncate mb-1.5">{o.tiendaNombre}</p>
                      {o.precio ? <p className="text-base font-black text-slate-900 dark:text-white">${Number(o.precio).toLocaleString()}</p>
                        : <p className="text-[11px] text-slate-400 italic">Consultá precio</p>}
                    </div>
                  </div>
                );

                return (
                  <div key={o.id}
                    onClick={() => { setSelectedProduct(o); navigate('product-detail'); }}
                    className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-md hover:shadow-black/5 dark:hover:shadow-black/30 transition-all animate-fade-up cursor-pointer active:scale-[0.99] select-none"
                    style={{ animationDelay: `${i * 25}ms` }}>
                    <div className="flex">
                      <div className="w-24 shrink-0 bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/6 dark:to-white/10 relative overflow-hidden">
                        {img ? <img src={img} alt="" className="w-full h-full object-cover" />
                          : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-slate-300 dark:text-white/20" /></div>}
                        {vc.label && vc.Icon && (
                          <span className={`absolute top-2 left-2 ${vc.pastel} text-slate-700 dark:text-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded-xl flex items-center gap-1`}>
                            <vc.Icon className={`w-2.5 h-2.5 shrink-0 ${vc.iconColor || ''}`} />{vc.label}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 p-3">
                        <p className="font-bold text-[13px] leading-snug line-clamp-2 mb-0.5">{o.titulo}</p>
                        <p className="text-[11px] text-slate-400 truncate mb-1.5">{o.tiendaNombre}</p>
                        {o.tiendaCiudad && <div className="flex items-center gap-0.5 mb-1.5 text-[11px] text-slate-400"><MapPin className="w-2.5 h-2.5" />{o.tiendaCiudad}</div>}
                        {o.precio ? <p className="text-base font-black text-slate-900 dark:text-white">${Number(o.precio).toLocaleString()}</p>
                          : <p className="text-[11px] text-slate-400 italic">Consultá precio</p>}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {tiendasRelacionadas.length >= 1 && (
              <RelatedStoresCarousel
                stores={tiendasRelacionadas}
                label={filtroCategoria ? 'Tiendas en esta categoría' : ofertaSearch ? 'Tiendas con resultados' : 'Tiendas destacadas'}
                onSelect={t => { setSelectedTienda(t); navigate('tienda-detail'); }}
              />
            )}

            {productosInteresantes.length > 0 && (
              <div className="mt-2">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">También te puede interesar</p>
                <div className="grid grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 lg:gap-3">
                  {productosInteresantes.map((o, i) => {
                    const vc = VENTAJA_CONFIG[o.ventaja] || {};
                    const img = o.galeria?.[0] || o.fotos?.[0];
                    return (
                      <div key={o.id} onClick={() => { setSelectedProduct(o); navigate('product-detail'); }}
                        className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden hover:shadow-lg hover:shadow-black/8 dark:hover:shadow-black/35 transition-all animate-fade-up cursor-pointer active:scale-[0.98] select-none"
                        style={{ animationDelay: `${i * 20}ms` }}>
                        <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/6 dark:to-white/10 relative overflow-hidden">
                          {img ? <img src={img} alt="" className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><Package className="w-10 h-10 text-slate-300 dark:text-white/20" /></div>}
                          {vc.label && vc.Icon && (
                            <span className={`absolute top-2 left-2 ${vc.pastel} text-slate-700 dark:text-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded-xl flex items-center gap-1 shadow`}>
                              <vc.Icon className={`w-2.5 h-2.5 shrink-0 ${vc.iconColor || ''}`} />{vc.label}
                            </span>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-bold text-[13px] leading-snug line-clamp-2 mb-0.5">{o.titulo}</p>
                          <p className="text-[11px] text-slate-400 truncate mb-1.5">{o.tiendaNombre}</p>
                          {o.precio ? <p className="text-base font-black text-slate-900 dark:text-white">${Number(o.precio).toLocaleString()}</p>
                            : <p className="text-[11px] text-slate-400 italic">Consultá precio</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-6 mb-2 flex justify-center">
              <button onClick={() => { setEditingDemanda({ titulo: ofertaSearch || '' }); navigate('crear'); }}
                className="flex items-center gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98] text-left max-w-sm w-full">
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-slate-900 dark:text-white">¿No encontraste lo que buscabas?</p>
                  <p className="text-[11px] text-slate-400 leading-snug">Publicá una demanda y las tiendas te responden</p>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 shrink-0" />
              </button>
            </div>
          </>)}
        </div>
      </div>

      {(filtersOpen || filtersClosing) && (
        <div className="lg:hidden fixed inset-0 z-[3800]" onClick={closeFilters}>
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <div onClick={e => e.stopPropagation()}
            className={`absolute left-0 right-0 bg-white dark:bg-slate-900 rounded-t-3xl flex flex-col ${filtersClosing ? 'animate-slide-down' : 'animate-slide-up'}`}
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 4.5rem)', maxHeight: '80dvh' }}>
            <div className="px-5 pt-4 pb-3 shrink-0">
              <div className="w-10 h-1 bg-slate-200 dark:bg-white/15 rounded-full mx-auto mb-4" />
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base">Filtros</h3>
                <button onClick={closeFilters} className="ui-icon-btn hover:bg-slate-100 dark:hover:bg-white/8 text-slate-500"><X className="w-4 h-4" /></button>
              </div>
            </div>
            <div className="overflow-y-auto flex-1 px-5 pb-6">
              <FiltersPanel onClose={closeFilters} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
