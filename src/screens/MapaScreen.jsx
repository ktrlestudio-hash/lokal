import React from 'react';
import {
  ArrowLeft, Search, X, MapPin, Loader2, Navigation, LocateFixed,
  Store, Tag, MessageSquare, ChevronRight, List, Trash2, Clock,
} from 'lucide-react';
import { TiendasMap, LocationPreviewMap } from '../LeafletMap';
import { MOCK_OFERTAS } from '../data/mockData';
import SimpleSelect from '../components/ui/SimpleSelect';
import { isStoreOpen } from '../utils/helpers';

// ── localStorage helpers ──────────────────────────────────────────────────────
const MAP_LOCATION_MODE_KEY   = 'lokal-map-location-mode';
const MAP_LAST_POSITION_KEY   = 'lokal-map-last-position';
const MAP_FIXED_POSITION_KEY  = 'lokal-map-fixed-position';
const MAP_SAVED_LOCATIONS_KEY = 'lokal-map-saved-locations';

function readStoredMapPosition() {
  try {
    const raw = localStorage.getItem(MAP_LAST_POSITION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length !== 2) return null;
    const [lat, lng] = parsed;
    if (typeof lat !== 'number' || typeof lng !== 'number') return null;
    return [lat, lng];
  } catch { return null; }
}
function readStoredMapMode() { return localStorage.getItem(MAP_LOCATION_MODE_KEY) || 'cached'; }
function readStoredFixedPosition() { try { const r = localStorage.getItem(MAP_FIXED_POSITION_KEY); return r ? JSON.parse(r) : null; } catch { return null; } }
function readStoredSavedLocations() { try { const r = localStorage.getItem(MAP_SAVED_LOCATIONS_KEY); return r ? JSON.parse(r) : []; } catch { return []; } }
function saveFixedPosition(pos) { try { localStorage.setItem(MAP_FIXED_POSITION_KEY, JSON.stringify(pos)); } catch {} }

// ── ListPanel ─────────────────────────────────────────────────────────────────
const TYPE_COLOR = { tienda: 'var(--primary-hex)', oferta: 'var(--ok-hex)', demanda: '#f59e0b' };
const TYPE_LABEL = { tienda: 'Tienda', oferta: 'Oferta', demanda: 'Demanda' };

function ListPanel({ baseTiendas, visibleOfertas, allDemandas, allCategories, listType, setListType, listCat, setListCat, listQ, setListQ, soloAbiertas, setSoloAbiertas, onClose, onSelectTienda, onSelectOferta, onSelectDemanda, bottomNavOffset, isDesktop, surf, bdr, txt, txtM, isDark, F }) {
  const catById = React.useMemo(() => Object.fromEntries((allCategories || []).map(c => [c.id, c.name || c.nombre || c.id])), [allCategories]);
  const allItems = React.useMemo(() => [
    ...baseTiendas.map(t => ({ _t: 'tienda', _id: t.id, _titulo: t.nombre, _sub: t.rubro, _img: t.logo, _cat: t.rubro, _raw: t })),
    ...visibleOfertas.filter(o => o.activa !== false).map(o => ({ _t: 'oferta', _id: o.id, _titulo: o.titulo, _sub: o.tiendaNombre, _img: o.fotos?.[0], _cat: o.categoryId ? (catById[o.categoryId] || o.categoryId) : (o.categoria || o.rubro || null), _raw: o })),
    ...allDemandas.filter(d => d.estado !== 'resuelto').map(d => ({ _t: 'demanda', _id: d.id, _titulo: d.titulo, _sub: d.categoria, _img: null, _cat: d.categoria, _raw: d })),
  ], [baseTiendas, visibleOfertas, allDemandas]);

  const TIPOS = [
    { id: 'todo', label: 'Todo', count: allItems.length },
    { id: 'tienda', label: 'Tiendas', count: allItems.filter(i => i._t === 'tienda').length },
    { id: 'oferta', label: 'Ofertas', count: allItems.filter(i => i._t === 'oferta').length },
    { id: 'demanda', label: 'Demandas', count: allItems.filter(i => i._t === 'demanda').length },
  ].filter(tp => tp.id === 'todo' || tp.count > 0);

  const cats = React.useMemo(() => {
    const counts = {};
    allItems.filter(i => listType === 'todo' || i._t === listType).forEach(i => { if (i._cat) counts[i._cat] = (counts[i._cat] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([cat, count]) => ({ cat, count }));
  }, [allItems, listType]);

  const filtered = React.useMemo(() => {
    const q = listQ.trim().toLowerCase();
    return allItems.filter(i => {
      if (listType !== 'todo' && i._t !== listType) return false;
      if (listCat && i._cat !== listCat) return false;
      if (q && !i._titulo?.toLowerCase().includes(q) && !i._sub?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allItems, listType, listCat, listQ]);

  return (
    <div style={isDesktop
      ? { position: 'absolute', bottom: bottomNavOffset, left: 16, width: 360, zIndex: 1100, background: surf, border: `1px solid ${bdr}`, borderRadius: 24, boxShadow: '0 8px 40px rgba(0,0,0,.28)', maxHeight: '70vh', display: 'flex', flexDirection: 'column' }
      : { position: 'absolute', bottom: bottomNavOffset, left: 0, right: 0, zIndex: 1100, background: surf, borderTop: `1px solid ${bdr}`, borderRadius: '24px 24px 0 0', boxShadow: '0 -8px 40px rgba(0,0,0,.22)', maxHeight: '60vh', display: 'flex', flexDirection: 'column' }
    }>
      <div style={{ padding: '12px 16px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color: txt, ...F.text }}>{filtered.length} resultado{filtered.length !== 1 ? 's' : ''}</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: txtM, display: 'flex' }}><X size={18} /></button>
      </div>
      <div style={{ padding: '0 12px 8px', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)', borderRadius: 12, padding: '7px 12px' }}>
          <Search size={13} style={{ color: txtM, flexShrink: 0 }} />
          <input value={listQ} onChange={e => setListQ(e.target.value)} placeholder="Buscar en lista..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 12, color: txt, ...F.text }} />
          {listQ && <button onMouseDown={() => setListQ('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: txtM, display: 'flex', padding: 0 }}><X size={12} /></button>}
        </div>
      </div>
      <div className="flex gap-2 px-3 pb-2.5 shrink-0 flex-wrap">
        <SimpleSelect
          value={listType}
          onChange={v => { setListType(v); setListCat(null); }}
          options={TIPOS.map(tp => ({ value: tp.id, label: `${tp.label} (${tp.count})` }))}
        />
        <SimpleSelect
          value={listCat || ''}
          onChange={v => setListCat(v || null)}
          options={[{ value: '', label: 'Todas las categorías' }, ...cats.map(({ cat, count }) => ({ value: cat, label: `${cat} (${count})` }))]}
          placeholder="Categoría"
        />
        {(listType === 'todo' || listType === 'tienda') && (
          <button
            onClick={() => setSoloAbiertas(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 11, fontWeight: 700,
              background: soloAbiertas ? 'rgba(16,185,129,.15)' : (isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)'),
              color: soloAbiertas ? 'var(--ok-hex)' : txt,
              transition: 'background .15s, color .15s',
            }}
          >
            <Clock size={11} style={{ flexShrink: 0 }} />
            Abiertas
          </button>
        )}
      </div>
      <div style={{ overflowY: 'auto', flex: 1, padding: '0 8px 12px' }}>
        {filtered.length === 0 && <div style={{ textAlign: 'center', padding: '24px 16px', color: txtM, fontSize: 13, ...F.text }}>Sin resultados</div>}
        {filtered.map(item => (
          <button key={`${item._t}-${item._id}`}
            onClick={() => { item._t === 'tienda' ? onSelectTienda(item._raw) : item._t === 'oferta' ? onSelectOferta(item._raw) : onSelectDemanda(item._raw); }}
            style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '9px 10px', borderRadius: 14, border: 'none', cursor: 'pointer', background: 'none', transition: 'background .12s' }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'none'}
          >
            {item._img
              ? <img src={item._img} style={{ width: 40, height: 40, borderRadius: 11, objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 40, height: 40, borderRadius: 11, background: TYPE_COLOR[item._t] + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {item._t === 'tienda' && <Store size={18} style={{ color: TYPE_COLOR[item._t] }} />}
                  {item._t === 'oferta' && <Tag size={18} style={{ color: TYPE_COLOR[item._t] }} />}
                  {item._t === 'demanda' && <MessageSquare size={18} style={{ color: TYPE_COLOR[item._t] }} />}
                </div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: txt, ...F.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item._titulo}</div>
              <div style={{ fontSize: 11, color: txtM, ...F.text, display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ color: TYPE_COLOR[item._t], fontWeight: 600 }}>{TYPE_LABEL[item._t]}</span>
                {item._sub && <><span>·</span><span>{item._sub}</span></>}
              </div>
            </div>
            <ChevronRight size={14} style={{ color: txtM, flexShrink: 0 }} />
          </button>
        ))}
      </div>
    </div>
  );
}

// ── MapaScreen ────────────────────────────────────────────────────────────────
export default function MapaScreen({
  tiendas,
  visibleOfertas,
  allDemandas,
  allCategories,
  mapaFocusStore,
  mapaFocusProduct,
  mapaAutoRoute,
  setMapaFocusStore,
  setMapaFocusProduct,
  setMapaAutoRoute,
  goBack,
  navigate,
  setSelectedProduct,
  setSelectedTienda,
  setSelectedDemanda,
  isDark,
  showToast: showToastProp,
}) {
  const [isDesktop, setIsDesktop] = React.useState(() => window.innerWidth >= 768);
  React.useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = (e) => setIsDesktop(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const mapRef = React.useRef(null);
  const searchRef = React.useRef(null);
  const [selected, setSelected] = React.useState(null);
  const [locationMode, setLocationMode] = React.useState(readStoredMapMode);
  const [userPos, setUserPos] = React.useState(readStoredMapPosition);
  const [fixedPos, setFixedPos] = React.useState(readStoredFixedPosition);
  const [satMode, setSatMode] = React.useState(false);
  const [manualLocationOpen, setManualLocationOpen] = React.useState(false);
  const [locationDraft, setLocationDraft] = React.useState(() => readStoredMapPosition() || [-31.42, -64.19]);
  const [locationDraftLabel, setLocationDraftLabel] = React.useState('');
  const [locationSearchQuery, setLocationSearchQuery] = React.useState('');
  const [locationSearchResults, setLocationSearchResults] = React.useState([]);
  const [locationSearchLoading, setLocationSearchLoading] = React.useState(false);
  const [mapCat, setMapCat] = React.useState(null);
  const [soloAbiertas, setSoloAbiertas] = React.useState(false);
  const [listOpen, setListOpen] = React.useState(false);
  const [listType, setListType] = React.useState('todo');
  const [listCat, setListCat] = React.useState(null);
  const [listQ, setListQ] = React.useState('');
  const [savedLocations, setSavedLocations] = React.useState(readStoredSavedLocations);

  const focusStoreRef = React.useRef(mapaFocusStore);
  const focusProductRef = React.useRef(mapaFocusProduct);
  const [flyTo, setFlyTo] = React.useState(null);
  const pendingFocusFlyRef = React.useRef(mapaFocusStore ? { lat: mapaFocusStore.lat, lng: mapaFocusStore.lng } : null);
  const [locating, setLocating] = React.useState(false);
  const [locationError, setLocationError] = React.useState('');

  const [searchQuery, setSearchQuery] = React.useState('');
  const [searchResults, setSearchResults] = React.useState([]);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchLoading, setSearchLoading] = React.useState(false);

  const [route, setRoute] = React.useState(null);
  const [routeInfo, setRouteInfo] = React.useState(null);
  const [routeLoading, setRouteLoading] = React.useState(false);

  const autoRouteRef = React.useRef(mapaAutoRoute);

  // ── Toast (local, mapa tiene su propio toast) ─────────────────────────────
  const [toast, setToast] = React.useState(null);
  const toastTimerRef = React.useRef(null);
  const showToast = React.useCallback((msg, type = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, type });
    toastTimerRef.current = setTimeout(() => setToast(null), 2800);
  }, []);
  React.useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  React.useEffect(() => {
    const focusStore = focusStoreRef.current;
    if (focusStore) {
      setSelected(focusStore);
      setMapaFocusStore(null);
      setMapaFocusProduct(null);
    }
    if (mapaAutoRoute) setMapaAutoRoute(false);
    const shouldFly = !focusStore && !userPos;
    if (locationMode === 'cached' && userPos) return;
    resolveUserPosition({ shouldFly, preferCached: false });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (!autoRouteRef.current) return;
    const focusStore = focusStoreRef.current;
    if (!focusStore?.lat || !focusStore?.lng) return;
    const tryRoute = async () => {
      const pos = userPos || await resolveUserPosition({ shouldFly: false, preferCached: true });
      if (!pos) return;
      try {
        const url = `https://router.project-osrm.org/route/v1/walking/${pos[1]},${pos[0]};${focusStore.lng},${focusStore.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes?.[0]) {
          const leg = data.routes[0].legs[0];
          setRoute({ key: Date.now(), geojson: data.routes[0].geometry });
          setRouteInfo({
            distancia: leg.distance < 1000 ? `${Math.round(leg.distance)} m` : `${(leg.distance / 1000).toFixed(1)} km`,
            duracion: `${Math.ceil(leg.duration / 60)} min`,
          });
        }
      } catch { /* silencioso */ }
    };
    setTimeout(tryRoute, 600);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const routeActiveRef = React.useRef(false);
  React.useEffect(() => { routeActiveRef.current = !!route; }, [route]);
  React.useEffect(() => {
    if (!routeActiveRef.current || !selected?.lat || !userPos) return;
    const pos = userPos;
    const fetch_ = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/walking/${pos[1]},${pos[0]};${selected.lng},${selected.lat}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data.routes?.[0]) {
          const leg = data.routes[0].legs[0];
          setRoute({ key: Date.now(), geojson: data.routes[0].geometry });
          setRouteInfo({
            distancia: leg.distance < 1000 ? `${Math.round(leg.distance)} m` : `${(leg.distance / 1000).toFixed(1)} km`,
            duracion: `${Math.ceil(leg.duration / 60)} min`,
          });
        }
      } catch { /* silencioso */ }
    };
    fetch_();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userPos]);

  React.useEffect(() => {
    localStorage.setItem(MAP_LOCATION_MODE_KEY, locationMode);
  }, [locationMode]);

  React.useEffect(() => {
    if (userPos) localStorage.setItem(MAP_LAST_POSITION_KEY, JSON.stringify(userPos));
  }, [userPos]);

  React.useEffect(() => {
    localStorage.setItem(MAP_SAVED_LOCATIONS_KEY, JSON.stringify(savedLocations));
  }, [savedLocations]);

  React.useEffect(() => {
    if (!manualLocationOpen) return;
    const base = userPos || savedLocations[0]?.coords || [-31.42, -64.19];
    const baseLabel = userPos ? 'Ubicación actual' : (savedLocations[0]?.label || 'Ubicación fija');
    setLocationDraft(base);
    setLocationDraftLabel(baseLabel);
    setLocationSearchQuery('');
    setLocationSearchResults([]);
    setLocationSearchLoading(false);
    setLocationError('');
  }, [manualLocationOpen]);

  React.useEffect(() => {
    if (!locationSearchQuery.trim()) { setLocationSearchResults([]); return; }
    setLocationSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locationSearchQuery)}&format=json&limit=6&accept-language=es&countrycodes=ar`,
          { headers: { 'Accept-Language': 'es' } }
        );
        const data = await res.json();
        setLocationSearchResults(data);
      } catch { setLocationSearchResults([]); }
      setLocationSearchLoading(false);
    }, 350);
    return () => clearTimeout(timer);
  }, [locationSearchQuery]);

  React.useEffect(() => { setRoute(null); setRouteInfo(null); }, [selected?.id]);

  const handleSelect = (t) => {
    setSelected(t);
    setListOpen(false);
    setFlyTo({ lat: t.lat, lng: t.lng, key: Date.now(), yOffset: (cardHeight / 2) + 24 });
  };

  const getCurrentPositionAsync = () => new Promise((resolve, reject) => {
    if (!navigator.geolocation) { reject(new Error('Geolocalización no disponible')); return; }
    navigator.geolocation.getCurrentPosition(
      p => resolve([p.coords.latitude, p.coords.longitude]),
      err => reject(err),
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 30000 }
    );
  });

  const resolveUserPosition = async ({ shouldFly = true, preferCached = true } = {}) => {
    if (preferCached && userPos) {
      if (shouldFly) setFlyTo({ lat: userPos[0], lng: userPos[1], key: Date.now() });
      return userPos;
    }
    if (locating) return null;
    setLocating(true);
    setLocationError('');
    try {
      const pos = await getCurrentPositionAsync();
      setUserPos(pos);
      if (shouldFly) setFlyTo({ lat: pos[0], lng: pos[1], key: Date.now() });
      return pos;
    } catch (err) {
      if (err.code === 1) setLocationError('Permiso de ubicación denegado. Habilitalo en la configuración del navegador.');
      else if (err.code === 2) setLocationError('No se pudo obtener la ubicación. Verificá tu conexión.');
      else setLocationError('No pudimos detectar tu ubicación. Intentá de nuevo.');
      return null;
    } finally { setLocating(false); }
  };

  const handleToggleLocationMode = async () => {
    const nextMode = locationMode === 'cached' ? 'realtime' : 'cached';
    setLocationMode(nextMode);
    setLocationError('');
    if (nextMode === 'cached') {
      showToast('Ubicación fija activada', 'ok');
      const pos = userPos || await resolveUserPosition({ shouldFly: true, preferCached: false });
      if (pos) setUserPos(pos);
      return;
    }
    showToast('Detectando ubicación en tiempo real…', 'info');
    await resolveUserPosition({ shouldFly: true, preferCached: false });
  };

  const applyManualLocation = async () => {
    const pos = locationDraft;
    if (!Array.isArray(pos) || pos.length !== 2) { setLocationError('Seleccioná una ubicación válida'); return; }
    setUserPos(pos);
    setFixedPos(pos);
    saveFixedPosition(pos);
    setLocationMode('cached');
    setLocationError('');
    setFlyTo({ lat: pos[0], lng: pos[1], key: Date.now() });
    setManualLocationOpen(false);
    showToast('Ubicación fija guardada', 'ok');
  };

  const applyRealtimeLocation = async () => {
    setLocationMode('realtime');
    showToast('Detectando ubicación en tiempo real…', 'info');
    const pos = await resolveUserPosition({ shouldFly: true, preferCached: false });
    if (pos) setManualLocationOpen(false);
  };

  const saveDraftLocation = () => {
    if (!Array.isArray(locationDraft) || locationDraft.length !== 2) { setLocationError('Seleccioná una ubicación válida'); return; }
    const label = locationDraftLabel.trim() || 'Ubicación guardada';
    const nextItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label,
      coords: locationDraft,
    };
    setSavedLocations(prev => [nextItem, ...prev.filter(item => item.label !== label)]);
    setUserPos(locationDraft);
    setFixedPos(locationDraft);
    saveFixedPosition(locationDraft);
    setLocationMode('cached');
    setFlyTo({ lat: locationDraft[0], lng: locationDraft[1], key: Date.now() });
    setManualLocationOpen(false);
  };

  const useSavedLocation = (item) => {
    if (!item?.coords) return;
    setLocationDraft(item.coords);
    setLocationDraftLabel(item.label);
    setUserPos(item.coords);
    setFixedPos(item.coords);
    saveFixedPosition(item.coords);
    setLocationMode('cached');
    setFlyTo({ lat: item.coords[0], lng: item.coords[1], key: Date.now() });
    setLocationError('');
  };

  const removeSavedLocation = (id) => {
    setSavedLocations(prev => prev.filter(item => item.id !== id));
  };

  const handleGetRoute = async () => {
    if (!selected?.lat) return;
    if (route) { setRoute(null); setRouteInfo(null); return; }
    const pos = userPos || await resolveUserPosition({ shouldFly: false, preferCached: false });
    if (!pos) return;
    setRouteLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/walking/${pos[1]},${pos[0]};${selected.lng},${selected.lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.[0]) {
        const leg = data.routes[0].legs[0];
        setRoute({ key: Date.now(), geojson: data.routes[0].geometry });
        setRouteInfo({
          distancia: leg.distance < 1000 ? `${Math.round(leg.distance)} m` : `${(leg.distance / 1000).toFixed(1)} km`,
          duracion: `${Math.ceil(leg.duration / 60)} min`,
        });
      }
    } catch { /* OSRM timeout */ }
    setRouteLoading(false);
  };

  const handleSearchSelect = (result) => {
    setSearchQuery(''); setSearchResults([]); setSearchOpen(false);
    if (result._type === 'tienda') {
      handleSelect(result);
    } else {
      const lat = parseFloat(result.lat); const lng = parseFloat(result.lon);
      setFlyTo({ lat, lng, key: Date.now() });
    }
  };

  const handleLocationSearchSelect = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const pretty = result.name || result.display_name?.split(',')[0] || 'Ubicación seleccionada';
    setLocationDraft([lat, lng]);
    setLocationDraftLabel(pretty);
    setLocationSearchQuery(pretty);
    setLocationSearchResults([]);
    setLocationError('');
    setFlyTo({ lat, lng, key: Date.now() });
  };

  // ── Buscar en esta zona ───────────────────────────────────────────────────
  const [zoneMoved, setZoneMoved] = React.useState(false);
  const [zoneActive, setZoneActive] = React.useState(false);
  const [zoneStores, setZoneStores] = React.useState(null);
  const [radarVisible, setRadarVisible] = React.useState(false);
  const zoneDebounceRef = React.useRef(null);
  const mapListenerRef = React.useRef(false);

  const attachMapListeners = React.useCallback((map) => {
    if (!map || mapListenerRef.current) return;
    mapListenerRef.current = true;
    const onMove = () => {
      if (zoneDebounceRef.current) clearTimeout(zoneDebounceRef.current);
      zoneDebounceRef.current = setTimeout(() => setZoneMoved(true), 700);
    };
    map.on('moveend', onMove);
    map.on('zoomend', onMove);
  }, []);

  React.useEffect(() => {
    if (mapRef.current) { attachMapListeners(mapRef.current); return; }
    const id = setTimeout(() => { if (mapRef.current) attachMapListeners(mapRef.current); }, 800);
    return () => clearTimeout(id);
  }, [attachMapListeners]);

  const latLngDist = (a, b) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);

  const handleSearchZone = () => {
    const map = mapRef.current;
    if (!map) return;
    setRadarVisible(true);
    setTimeout(() => setRadarVisible(false), 1600);
    const bounds = map.getBounds();
    const center = map.getCenter();
    const c = [center.lat, center.lng];
    const visible = tiendas
      .filter(t => t.lat && t.lng && bounds.contains([t.lat, t.lng]))
      .sort((a, b) => latLngDist([a.lat, a.lng], c) - latLngDist([b.lat, b.lng], c));
    setZoneStores(visible);
    setZoneActive(true);
    setZoneMoved(false);
    if (visible.length === 0) showToast('Sin resultados · Ampliá la zona', 'warn');
    else showToast(`${visible.length} tienda${visible.length !== 1 ? 's' : ''} en esta zona`, 'ok');
  };

  const handleClearZone = () => {
    setZoneStores(null);
    setZoneActive(false);
    setZoneMoved(false);
  };

  const baseTiendas = zoneActive && zoneStores !== null ? zoneStores : tiendas;
  const displayedTiendas = React.useMemo(() => {
    let result = mapCat ? baseTiendas.filter(t => t.rubro === mapCat) : baseTiendas;
    if (soloAbiertas) result = result.filter(t => isStoreOpen(t.horarios));
    return result;
  }, [baseTiendas, mapCat, soloAbiertas]);

  const tiendaById = React.useMemo(() => Object.fromEntries(tiendas.map(t => [t.id, t])), [tiendas]);
  const mappedOfertas = React.useMemo(() => visibleOfertas
    .filter(o => o.activa !== false && (o.fotos?.[0] || o.galeria?.[0]))
    .map(o => { const t = tiendaById[o.tiendaId]; return t ? { ...o, lat: t.lat, lng: t.lng } : null; })
    .filter(Boolean), [visibleOfertas, tiendaById]);

  const ofertaCountByTienda = React.useMemo(() => {
    const m = {};
    const tiendaIds = new Set(tiendas.map(t => t.id));
    const combined = [...MOCK_OFERTAS, ...visibleOfertas.filter(o => !MOCK_OFERTAS.some(mo => mo.id === o.id))];
    combined.filter(o => o.activa !== false && tiendaIds.has(o.tiendaId)).forEach(o => {
      m[o.tiendaId] = (m[o.tiendaId] || 0) + 1;
    });
    return m;
  }, [visibleOfertas, tiendas]);

  const ciudadesIndex = React.useMemo(() => {
    const map = {};
    const add = (ciudad, lat, lng, tipo) => {
      if (!ciudad) return;
      const key = ciudad.trim();
      if (!map[key]) map[key] = { nombre: key, lat, lng, tiendas: 0, ofertas: 0, demandas: 0 };
      if (lat && !map[key].lat) { map[key].lat = lat; map[key].lng = lng; }
      map[key][tipo]++;
    };
    tiendas.forEach(t => add(t.ciudad, t.lat, t.lng, 'tiendas'));
    visibleOfertas.forEach(o => add(o.ciudad || o.tiendaCiudad, null, null, 'ofertas'));
    allDemandas.forEach(d => add(d.ciudad, null, null, 'demandas'));
    return Object.values(map).filter(c => c.lat);
  }, [tiendas, visibleOfertas, allDemandas]);

  const localSearchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return baseTiendas.filter(t =>
      t.nombre?.toLowerCase().includes(q) || t.rubro?.toLowerCase().includes(q) || t.descripcion?.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [searchQuery, baseTiendas]);

  const ciudadSearchResults = React.useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return ciudadesIndex.filter(c => c.nombre.toLowerCase().includes(q)).slice(0, 4);
  }, [searchQuery, ciudadesIndex]);

  React.useEffect(() => {
    const q = searchQuery.trim();
    if (!q || ciudadSearchResults.length > 0 || localSearchResults.length >= 3) {
      setSearchResults([]); setSearchLoading(false); return;
    }
    setSearchLoading(true);
    const timer = setTimeout(async () => {
      try {
        const PLACE_TYPES = new Set(['city','town','village','hamlet','suburb','neighbourhood','municipality','county','state','province','quarter','city_district','road','residential','unclassified','primary','secondary','tertiary','living_street','pedestrian']);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=8&accept-language=es&countrycodes=ar`,
          { headers: { 'Accept-Language': 'es' } }
        );
        const raw = await res.json();
        const data = raw.filter(r => PLACE_TYPES.has(r.type) || r.class === 'boundary' || r.class === 'place');
        setSearchResults(data.slice(0, 3).map(r => {
          const lat = parseFloat(r.lat); const lng = parseFloat(r.lon);
          const nearby = baseTiendas.filter(t => Math.abs(t.lat - lat) < 0.15 && Math.abs(t.lng - lng) < 0.15).length;
          return { ...r, _nearbyCount: nearby };
        }));
      } catch { setSearchResults([]); }
      setSearchLoading(false);
    }, 450);
    return () => clearTimeout(timer);
  }, [searchQuery, localSearchResults.length, ciudadSearchResults.length]);

  // ── Styles ────────────────────────────────────────────────────────────────
  const surf = 'rgb(var(--surface))';
  const bdr  = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)';
  const txt  = isDark ? '#cbd5e1' : '#334155';
  const txtM = isDark ? '#64748b' : '#94a3b8';
  const F = {
    btn: { width: 40, height: 40, background: surf, color: txt, border: `1px solid ${bdr}`, borderRadius: 14, boxShadow: '0 2px 14px rgba(0,0,0,.13)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 300 },
    card: { background: surf, border: `1px solid ${bdr}`, borderRadius: 24, boxShadow: '0 8px 40px rgba(0,0,0,.18)', padding: 16 },
    search: { background: isDark ? 'rgba(15,23,42,.92)' : 'rgba(255,255,255,.95)', backdropFilter: 'blur(14px)', border: `1px solid ${bdr}`, boxShadow: '0 2px 14px rgba(0,0,0,.13)' },
    text: { fontFamily: "'Poppins','Inter',system-ui,-apple-system,sans-serif" },
  };

  const cardRef = React.useRef(null);
  const [cardHeight, setCardHeight] = React.useState(route ? 168 : 320);
  const cardHeightRef = React.useRef(route ? 168 : 320);
  React.useEffect(() => {
    if (!cardRef.current) return;
    const ro = new ResizeObserver(([e]) => {
      const h = e.contentRect.height + 16;
      setCardHeight(h);
      cardHeightRef.current = h;
      if (pendingFocusFlyRef.current) {
        const { lat, lng } = pendingFocusFlyRef.current;
        pendingFocusFlyRef.current = null;
        setFlyTo({ lat, lng, zoom: 17, key: Date.now(), yOffset: (h / 2) + 24 });
      }
    });
    ro.observe(cardRef.current);
    return () => ro.disconnect();
  }, [selected?.id]);

  const bottomNavOffset = isDesktop ? '16px' : 'calc(env(safe-area-inset-bottom) + 92px)';

  return (
    <div className="relative w-full h-[100dvh] min-h-[420px] overflow-hidden">

      {radarVisible && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 1200, pointerEvents: 'none', overflow: 'hidden' }}>
          <div className="lokal-radar-ring" />
          <div className="lokal-radar-ring" />
          <div className="lokal-radar-ring" />
        </div>
      )}

      <TiendasMap
        tiendas={displayedTiendas}
        selectedId={selected?.id}
        onSelect={handleSelect}
        userPos={userPos}
        pinnedUser={locationMode === 'cached'}
        flyTo={flyTo}
        route={route}
        dark={isDark}
        sat={satMode}
        mapRef={mapRef}
        initialCenter={focusStoreRef.current ? [focusStoreRef.current.lat, focusStoreRef.current.lng] : undefined}
        focusProduct={focusProductRef.current}
        ofertas={mappedOfertas}
        ofertaCounts={ofertaCountByTienda}
        onSelectOferta={o => { setSelectedProduct(o); navigate('product-detail'); }}
      />

      {/* Barra superior flotante */}
      <div style={{
        position: 'absolute',
        top: 'calc(env(safe-area-inset-top) + 12px)',
        left: 16,
        right: isDesktop ? 'auto' : 16,
        width: isDesktop ? 360 : undefined,
        zIndex: 1001,
        display: 'flex',
        gap: 10,
        alignItems: 'flex-start',
      }}>
        <button onClick={goBack} style={F.btn}>
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, position: 'relative' }}>
          <div style={{ ...F.search, borderRadius: 16, display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', height: 40 }}>
            {searchLoading
              ? <Loader2 size={15} style={{ color: 'var(--primary-hex)', flexShrink: 0, animation: 'spin 1s linear infinite' }} />
              : <Search size={15} style={{ color: txtM, flexShrink: 0 }} />
            }
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); }}
              onFocus={() => setSearchOpen(true)}
              onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
              placeholder="Tiendas, rubros, zonas..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, fontWeight: 500, color: txt, fontFamily: "'Poppins','Inter',system-ui,-apple-system,sans-serif" }}
            />
            {searchQuery && (
              <button onMouseDown={() => { setSearchQuery(''); setSearchResults([]); setSearchOpen(false); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: txtM, display: 'flex', padding: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {searchOpen && (localSearchResults.length > 0 || ciudadSearchResults.length > 0 || searchResults.length > 0) && (
            <div style={{
              position: 'absolute', top: 48, left: 0, right: 0,
              background: surf, border: `1px solid ${bdr}`, borderRadius: 16,
              boxShadow: '0 8px 30px rgba(0,0,0,.22)', overflow: 'hidden', maxHeight: 300, overflowY: 'auto', zIndex: 10,
            }}>
              {localSearchResults.length > 0 && (
                <>
                  <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: txtM, textTransform: 'uppercase', letterSpacing: 0.8, ...F.text }}>Tiendas</div>
                  {localSearchResults.map(t => (
                    <button key={t.id} onMouseDown={() => handleSearchSelect({ ...t, _type: 'tienda' })} style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${bdr}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      {t.logo
                        ? <img src={t.logo} style={{ width: 28, height: 28, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--primary-hex)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{t.nombre?.[0]?.toUpperCase()}</div>
                      }
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: txt, ...F.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{t.nombre}</div>
                        <div style={{ fontSize: 11, color: txtM, ...F.text }}>{t.rubro}</div>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {ciudadSearchResults.length > 0 && (
                <>
                  <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: txtM, textTransform: 'uppercase', letterSpacing: 0.8, ...F.text }}>Ciudades</div>
                  {ciudadSearchResults.map(c => (
                    <button key={c.nombre} onMouseDown={() => { setFlyTo({ lat: c.lat, lng: c.lng, key: Date.now() }); setSearchQuery(''); setSearchOpen(false); }} style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: `1px solid ${bdr}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MapPin size={14} style={{ color: 'var(--primary-hex)', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: txt, ...F.text }}>{c.nombre}</div>
                        <div style={{ fontSize: 11, color: txtM, ...F.text, display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 2 }}>
                          {c.tiendas > 0 && <span style={{ background: 'var(--primary-hex)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{c.tiendas} tienda{c.tiendas !== 1 ? 's' : ''}</span>}
                          {c.ofertas > 0 && <span style={{ background: isDark ? 'rgba(16,185,129,.2)' : 'rgba(16,185,129,.12)', color: 'var(--ok-hex)', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{c.ofertas} oferta{c.ofertas !== 1 ? 's' : ''}</span>}
                          {c.demandas > 0 && <span style={{ background: isDark ? 'rgba(245,158,11,.2)' : 'rgba(245,158,11,.12)', color: '#f59e0b', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{c.demandas} demanda{c.demandas !== 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
              {searchResults.length > 0 && (
                <>
                  <div style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: txtM, textTransform: 'uppercase', letterSpacing: 0.8, ...F.text }}>Zonas</div>
                  {searchResults.map((r, i) => (
                    <button key={i} onMouseDown={() => handleSearchSelect(r)} style={{ width: '100%', textAlign: 'left', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', borderBottom: i < searchResults.length - 1 ? `1px solid ${bdr}` : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <MapPin size={14} style={{ color: 'var(--primary-hex)', flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: txt, ...F.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.name || r.display_name?.split(',')[0]}</div>
                        <div style={{ fontSize: 11, color: txtM, ...F.text, display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>{r.display_name?.split(',').slice(1, 3).join(',').trim()}</span>
                          {r._nearbyCount > 0 && <span style={{ background: 'var(--primary-hex)', color: '#fff', borderRadius: 10, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>{r._nearbyCount} tienda{r._nearbyCount !== 1 ? 's' : ''}</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
        <button onClick={() => setManualLocationOpen(true)} title="Configurar ubicación" style={{ ...F.btn }}>
          <MapPin size={17} />
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 64px)', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1100, pointerEvents: 'none' }} className="animate-fade-up">
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 8, padding: '9px 16px', borderRadius: 20,
            background: toast.type === 'warn' ? 'rgba(245,158,11,.92)' : toast.type === 'ok' ? 'rgba(16,185,129,.92)' : (isDark ? 'rgba(30,37,54,.95)' : 'rgba(15,23,42,.88)'),
            color: '#fff', boxShadow: '0 4px 24px rgba(0,0,0,.22)', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', backdropFilter: 'blur(10px)', ...F.text,
          }}>
            {toast.type === 'ok' && <span style={{ fontSize: 14 }}>✓</span>}
            {toast.type === 'warn' && <span style={{ fontSize: 14 }}>⚠</span>}
            {toast.msg}
          </div>
        </div>
      )}

      {/* Chip Abiertas ahora — flotante en el mapa */}
      {!toast && !(zoneMoved || zoneActive) && (
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 64px)', left: 0, right: 0, display: 'flex', justifyContent: 'center', zIndex: 1050, pointerEvents: 'none' }}>
          <button
            onClick={() => setSoloAbiertas(v => !v)}
            style={{
              pointerEvents: 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 20,
              background: soloAbiertas
                ? 'rgba(16,185,129,.92)'
                : (isDark ? 'rgba(17,24,39,.92)' : 'rgba(255,255,255,.95)'),
              color: soloAbiertas ? '#fff' : (isDark ? '#e2e8f0' : '#0f172a'),
              border: soloAbiertas ? 'none' : `1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}`,
              boxShadow: '0 4px 24px rgba(0,0,0,.18)',
              fontSize: 12, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(10px)',
              fontFamily: "'Poppins','Inter',system-ui,-apple-system,sans-serif",
              transition: 'background .2s, color .2s',
            }}
          >
            <Clock size={12} />
            {soloAbiertas ? 'Abiertas ahora' : 'Ver abiertas'}
            {soloAbiertas && (
              <X size={11} style={{ marginLeft: 2, opacity: 0.8 }} />
            )}
          </button>
        </div>
      )}

      {/* Buscar en esta zona */}
      {!toast && (zoneMoved || zoneActive) && (
        <div style={{ position: 'absolute', top: 'calc(env(safe-area-inset-top) + 64px)', left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 8, zIndex: 1050 }} className="animate-fade-up">
          <button onClick={handleSearchZone} style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px', borderRadius: 20,
            background: isDark ? 'rgba(17,24,39,.96)' : 'rgba(255,255,255,.97)',
            color: isDark ? '#e2e8f0' : '#0f172a',
            border: `1px solid ${isDark ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'}`,
            boxShadow: '0 4px 24px rgba(0,0,0,.18)', fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', backdropFilter: 'blur(10px)', ...F.text,
          }}>
            <Search size={13} style={{ color: 'var(--primary-hex)' }} />
            {zoneActive && zoneMoved ? 'Actualizar zona' : zoneActive ? 'Rebuscar aquí' : 'Buscar en esta zona'}
          </button>
          {zoneActive && (
            <button onClick={handleClearZone} style={{
              display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 20,
              background: isDark ? 'rgba(17,24,39,.96)' : 'rgba(255,255,255,.97)',
              color: isDark ? '#94a3b8' : '#64748b',
              border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'}`,
              boxShadow: '0 4px 24px rgba(0,0,0,.14)', fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', backdropFilter: 'blur(10px)', ...F.text,
            }}>
              <X size={12} />
              Mostrar todas
            </button>
          )}
        </div>
      )}

      {/* Controles zoom + ubicación */}
      <div style={{
        position: 'absolute', right: 16,
        bottom: isDesktop ? `calc(${bottomNavOffset} + 16px)` : selected ? `calc(${cardHeight}px + ${bottomNavOffset} + 16px)` : `calc(${bottomNavOffset} + 16px)`,
        zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 8,
        transition: 'bottom .3s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <button onClick={() => { setSelected(null); setListOpen(v => !v); }} title="Lista" style={{ ...F.btn, background: listOpen && !selected ? 'var(--primary-hex)' : surf, color: listOpen && !selected ? '#fff' : txt }}>
          <List size={16} />
        </button>
        <button onClick={() => mapRef.current?.zoomIn()} style={F.btn}>+</button>
        <button onClick={() => mapRef.current?.zoomOut()} style={F.btn}>−</button>
        <button onClick={() => setSatMode(v => !v)} title="Satélite / Mapa" style={{ ...F.btn, background: satMode ? '#1e40af' : surf, color: satMode ? '#fff' : txt, fontSize: 9, fontWeight: 700, letterSpacing: 0.3 }}>SAT</button>
        <div style={{ height: 1, background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)', margin: '2px 0' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, background: surf, border: `1px solid ${bdr}`, borderRadius: 14, padding: 3, boxShadow: '0 2px 14px rgba(0,0,0,.13)' }}>
          <button
            onClick={() => {
              if (locationMode === 'cached') {
                if (fixedPos) setFlyTo({ lat: fixedPos[0], lng: fixedPos[1], key: Date.now() });
                return;
              }
              if (!fixedPos) { showToast('No tenés una ubicación fija guardada. Configurala primero.', 'error'); return; }
              setLocationMode('cached');
              setUserPos(fixedPos);
              setFlyTo({ lat: fixedPos[0], lng: fixedPos[1], key: Date.now() });
              showToast('Ubicación fija activada', 'ok');
            }}
            title="Centrar en ubicación fija"
            style={{ width: 34, height: 34, borderRadius: 11, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: locationMode === 'cached' ? 'var(--ok-hex)' : 'transparent', color: locationMode === 'cached' ? '#fff' : txtM, transition: 'all .15s' }}
          >
            {locating && locationMode === 'cached' ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <LocateFixed size={15} />}
          </button>
          <button
            onClick={async () => {
              setLocationMode('realtime');
              showToast('Detectando ubicación en tiempo real…', 'info');
              await resolveUserPosition({ shouldFly: true, preferCached: false });
            }}
            title="Centrar en ubicación en tiempo real"
            style={{ width: 34, height: 34, borderRadius: 11, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', background: locationMode === 'realtime' ? '#f59e0b' : 'transparent', color: locationMode === 'realtime' ? '#fff' : txtM, transition: 'all .15s' }}
          >
            {locating && locationMode === 'realtime' ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Navigation size={15} />}
          </button>
        </div>
      </div>

      {/* Panel lista */}
      {listOpen && !selected && (
        <ListPanel
          baseTiendas={baseTiendas} visibleOfertas={visibleOfertas} allDemandas={allDemandas} allCategories={allCategories}
          listType={listType} setListType={setListType}
          listCat={listCat} setListCat={setListCat}
          listQ={listQ} setListQ={setListQ}
          soloAbiertas={soloAbiertas} setSoloAbiertas={setSoloAbiertas}
          onClose={() => setListOpen(false)}
          onSelectTienda={t => { handleSelect(t); setListOpen(false); }}
          onSelectOferta={o => { setSelectedProduct(o); navigate('product-detail'); }}
          onSelectDemanda={d => { setSelectedDemanda(d); navigate('detalle'); }}
          bottomNavOffset={bottomNavOffset} isDesktop={isDesktop} surf={surf} bdr={bdr} txt={txt} txtM={txtM} isDark={isDark} F={F}
        />
      )}

      {/* Bottom sheet — tienda seleccionada */}
      {selected && (() => {
        const open = isStoreOpen(selected.horarios);
        const photos = [selected.logo, ...(selected.galeria || []), ...(selected.fotos || [])].filter(Boolean);
        const fp = focusProductRef.current?.tiendaId === selected.id ? focusProductRef.current : null;
        const navMode = !!(route || routeLoading);

        return (
          <div ref={cardRef} key={selected.id} style={{ position: 'absolute', bottom: `calc(${bottomNavOffset} + 16px)`, left: 16, right: isDesktop ? 'auto' : 16, width: isDesktop ? 360 : undefined, zIndex: 1000 }} className="animate-sheet-up">
            <div style={{ background: surf, border: `1px solid ${bdr}`, borderRadius: 24, boxShadow: '0 12px 48px rgba(0,0,0,.28)', overflow: 'hidden', position: 'relative' }}>
              <button
                onClick={() => { setSelected(null); setRoute(null); setRouteInfo(null); }}
                style={{ position: 'absolute', top: 10, right: 10, zIndex: 10, width: 28, height: 28, borderRadius: 10, background: isDark ? 'rgba(0,0,0,.55)' : 'rgba(255,255,255,.88)', backdropFilter: 'blur(6px)', border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'}`, boxShadow: '0 1px 8px rgba(0,0,0,.18)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#94a3b8' : '#64748b' }}
              >
                <X size={13} />
              </button>

              <div style={{ display: 'grid', gridTemplateRows: navMode ? '0fr' : '1fr', transition: 'grid-template-rows 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
                <div style={{ overflow: 'hidden' }}>
                  {photos.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', padding: '12px 12px 0' }}>
                      {photos.slice(0, 6).map((img, i) => (
                        <div key={i} style={{ height: 80, width: i === 0 ? 130 : 104, borderRadius: 14, overflow: 'hidden', flexShrink: 0, background: isDark ? 'rgba(255,255,255,.06)' : '#e2e8f0' }}>
                          <img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ padding: '14px 16px 0' }}>
                    {fp && (() => {
                      const img = fp.galeria?.[0] || fp.fotos?.[0];
                      return (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, padding: '8px 10px', borderRadius: 14, background: isDark ? 'rgba(16,185,129,.1)' : '#ecfdf5', border: `1px solid ${isDark ? 'rgba(16,185,129,.22)' : 'rgba(16,185,129,.28)'}` }}>
                          {img && <div style={{ width: 38, height: 38, borderRadius: 10, overflow: 'hidden', flexShrink: 0 }}><img src={img} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /></div>}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 10, fontWeight: 700, color: 'var(--ok-hex)', textTransform: 'uppercase', letterSpacing: '0.05em', ...F.text }}>Producto en esta tienda</p>
                            <p style={{ margin: '1px 0 0', fontSize: 12, fontWeight: 700, color: isDark ? '#f1f5f9' : '#0f172a', ...F.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fp.titulo}</p>
                            {fp.precio && <p style={{ margin: 0, fontSize: 12, fontWeight: 800, color: 'var(--ok-hex)', ...F.text }}>${Number(fp.precio).toLocaleString()}</p>}
                          </div>
                        </div>
                      );
                    })()}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 48, height: 48, borderRadius: 15, flexShrink: 0, overflow: 'hidden', background: isDark ? 'rgba(0,184,217,.15)' : '#e0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {selected.logo
                          ? <img src={selected.logo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                          : <span style={{ fontSize: 20, fontWeight: 800, color: isDark ? '#00B8D9' : '#009AB7', ...F.text }}>{selected.nombre[0]}</span>
                        }
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 800, fontSize: 15, color: isDark ? '#f1f5f9' : '#0f172a', ...F.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0, lineHeight: 1.25 }}>{selected.nombre}</p>
                        <p style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', ...F.text, margin: '2px 0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selected.rubro}{selected.ciudad ? ` · ${selected.ciudad}` : ''}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: open ? (isDark ? 'rgba(16,185,129,.16)' : '#dcfce7') : (isDark ? 'rgba(244,63,94,.12)' : '#ffe4e6'), color: open ? (isDark ? '#34d399' : '#15803d') : (isDark ? '#fb7185' : '#be123c'), ...F.text }}>
                            <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                            {open ? 'Abierto' : 'Cerrado'}
                          </span>
                          {selected.distancia && <span style={{ fontSize: 11, fontWeight: 600, color: isDark ? '#475569' : '#94a3b8', ...F.text }}>{selected.distancia}{selected.tiempoViaje ? ` · ${selected.tiempoViaje}` : ''}</span>}
                        </div>
                      </div>
                      {selected.rating && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', flexShrink: 0, paddingTop: 2, paddingRight: 2 }}>
                          <span style={{ fontSize: 14, fontWeight: 800, color: '#f59e0b', ...F.text, lineHeight: 1.2 }}>★ {selected.rating}</span>
                          <span style={{ fontSize: 10, color: isDark ? '#475569' : '#94a3b8', ...F.text, marginTop: 2 }}>{selected.totalReseñas} reseñas</span>
                        </div>
                      )}
                    </div>
                    {selected.descripcion && (
                      <p style={{ margin: '10px 0 0', fontSize: 12, lineHeight: 1.5, color: isDark ? '#94a3b8' : '#64748b', ...F.text, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {selected.descripcion}
                      </p>
                    )}
                    <div style={{ height: 14 }} />
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateRows: navMode ? '1fr' : '0fr', transition: 'grid-template-rows 0.35s cubic-bezier(0.4,0,0.2,1)' }}>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ padding: '16px 16px 4px', display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 14, flexShrink: 0, background: isDark ? 'rgba(0,184,217,.16)' : '#e0f7fb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {routeLoading
                        ? <Loader2 size={18} style={{ color: 'var(--ok-hex)', animation: 'spin 1s linear infinite' }} />
                        : <Navigation size={18} style={{ color: 'var(--ok-hex)' }} />
                      }
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: 11, color: isDark ? '#64748b' : '#94a3b8', ...F.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {routeLoading ? 'Calculando ruta...' : `Ruta a ${selected.nombre}`}
                      </p>
                      {routeInfo && !routeLoading && (
                        <p style={{ margin: '2px 0 0', fontSize: 20, fontWeight: 900, color: isDark ? '#f1f5f9' : '#0f172a', ...F.text, lineHeight: 1.1 }}>
                          {routeInfo.duracion}
                          <span style={{ fontSize: 13, fontWeight: 500, color: isDark ? '#64748b' : '#94a3b8', marginLeft: 8 }}>{routeInfo.distancia} · a pie</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.06)'}`, display: 'flex', gap: 8 }}>
                <button
                  onClick={handleGetRoute}
                  disabled={routeLoading}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '10px 0', background: navMode ? (isDark ? 'rgba(0,184,217,.15)' : '#e0f7fb') : (isDark ? 'rgba(255,255,255,.06)' : '#f1f5f9'), border: navMode ? '1px solid rgba(0,184,217,.3)' : `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)'}`, borderRadius: 12, cursor: 'pointer', opacity: routeLoading ? 0.7 : 1, ...F.text, transition: 'background .2s, border .2s' }}
                >
                  {(routeLoading || locating) ? <Loader2 size={14} style={{ color: 'var(--ok-hex)', animation: 'spin 1s linear infinite' }} /> : <Navigation size={14} style={{ color: navMode ? 'var(--ok-hex)' : (isDark ? '#94a3b8' : '#64748b') }} />}
                  <span style={{ fontSize: 12, fontWeight: 600, color: navMode ? 'var(--ok-hex)' : (isDark ? '#94a3b8' : '#64748b') }}>
                    {routeLoading ? 'Calculando...' : locating ? 'Detectando...' : route ? 'Ocultar ruta' : userPos ? 'Cómo llegar' : 'Activá ubicación'}
                  </span>
                </button>
                <button
                  onClick={() => { setSelectedTienda(selected); navigate('tienda-detail'); }}
                  style={{ padding: '10px 18px', background: 'var(--primary-hex)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0, ...F.text }}
                >
                  Ver tienda
                </button>
              </div>

              {locationError && !userPos && (
                <p style={{ padding: '0 16px 12px', margin: 0, fontSize: 11, color: isDark ? '#fca5a5' : '#b91c1c', ...F.text }}>
                  {locationError}
                </p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Modal configurar ubicación */}
      {manualLocationOpen && (
        <div className="fixed inset-0 z-[3100] bg-black/55 backdrop-blur-sm flex items-end lg:items-center justify-center p-4" onClick={() => setManualLocationOpen(false)}>
          <div className="w-full max-w-5xl rounded-[28px] border border-white/10 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 px-5 lg:px-6 py-4 border-b border-slate-200/70 dark:border-white/10">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400 font-semibold">Ubicación</p>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">Configurar ubicación del mapa</h3>
              </div>
              <button onClick={() => setManualLocationOpen(false)} className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-300">
                <X size={18} />
              </button>
            </div>

            <div className="grid lg:grid-cols-[1.05fr_1.1fr] overflow-y-auto">
              <div className="p-5 lg:p-6 border-b lg:border-b-0 lg:border-r border-slate-200/70 dark:border-white/10 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={async () => {
                      const pos = await resolveUserPosition({ shouldFly: false, preferCached: false });
                      if (pos) { setLocationDraft(pos); setLocationDraftLabel('Ubicación actual'); setLocationMode('realtime'); }
                    }}
                    className="rounded-2xl px-4 py-3 bg-primary text-white font-bold hover:bg-primary-hover transition-colors flex items-center gap-2"
                  >
                    <LocateFixed size={16} />
                    Activar GPS
                  </button>
                  <button
                    onClick={() => {
                      if (userPos) { setLocationDraft(userPos); setLocationDraftLabel('Ubicación actual'); setFlyTo({ lat: userPos[0], lng: userPos[1], key: Date.now() }); }
                    }}
                    className="rounded-2xl px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity flex items-center gap-2"
                  >
                    <LocateFixed size={16} />
                    Usar GPS actual
                  </button>
                </div>

                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                    Buscar ciudad o calle
                    <div className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3">
                      {locationSearchLoading ? <Loader2 size={15} className="animate-spin text-primary shrink-0" /> : <Search size={15} className="text-slate-400 shrink-0" />}
                      <input value={locationSearchQuery} onChange={(e) => setLocationSearchQuery(e.target.value)} placeholder="Ej: Bovril, Entre Ríos" className="w-full bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400" />
                    </div>
                  </label>
                  {!!locationSearchResults.length && (
                    <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shadow-sm">
                      {locationSearchResults.map((r, i) => (
                        <button key={`${r.place_id || i}-${i}`} onClick={() => handleLocationSearchSelect(r)} className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-200/70 dark:border-white/10 last:border-b-0">
                          <p className="text-sm font-semibold text-slate-900 dark:text-white">{r.name || r.display_name?.split(',')[0]}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{r.display_name}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5">
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 font-semibold">Ubicaciones guardadas</p>
                  </div>
                  <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                    {savedLocations.length ? savedLocations.map(item => (
                      <div key={item.id} className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 px-3 py-2">
                        <button onClick={() => useSavedLocation(item)} className="flex-1 text-left">
                          <p className="text-sm font-bold text-slate-900 dark:text-white">{item.label}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.coords[0].toFixed(5)}, {item.coords[1].toFixed(5)}</p>
                        </button>
                        <button onClick={() => removeSavedLocation(item.id)} className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-500 flex items-center justify-center">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )) : (
                      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-white/10 px-4 py-5 text-sm text-slate-500 dark:text-slate-400">
                        Todavía no tenés ubicaciones guardadas.
                      </div>
                    )}
                  </div>
                </div>

                <label className="text-sm font-semibold text-slate-700 dark:text-slate-200 block">
                  Nombre para guardar
                  <input value={locationDraftLabel} onChange={(e) => setLocationDraftLabel(e.target.value)} placeholder="Casa, oficina, local..." className="mt-2 w-full rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/30" />
                </label>
              </div>

              <div className="p-5 lg:p-6 space-y-4">
                <div className="rounded-[28px] overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl">
                  <div className="h-[340px] w-full">
                    <LocationPreviewMap
                      position={locationDraft}
                      dark={isDark}
                      onChange={(pos) => { setLocationDraft(pos); setLocationMode('cached'); setLocationError(''); }}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 dark:border-white/10 px-4 py-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400 font-semibold">Coordenadas</p>
                  <p className="mt-1 text-sm font-bold text-slate-900 dark:text-white">{locationDraft[0].toFixed(6)}, {locationDraft[1].toFixed(6)}</p>
                </div>

                <div className="grid sm:grid-cols-3 gap-2">
                  <button onClick={applyManualLocation} className="rounded-2xl px-4 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold hover:opacity-90 transition-opacity">Usar esta ubicación</button>
                  <button onClick={saveDraftLocation} className="rounded-2xl px-4 py-3 bg-primary text-white font-bold hover:bg-primary-hover transition-colors">Guardar en guardadas</button>
                  <button onClick={applyRealtimeLocation} className="rounded-2xl px-4 py-3 bg-amber-500 text-white font-bold hover:bg-amber-400 transition-colors">GPS en tiempo real</button>
                </div>

                <div className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 dark:border-white/10 px-4 py-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-[0.18em]">Modo actual</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">{locationMode === 'cached' ? 'Fija' : 'Tiempo real'}</p>
                  </div>
                  <div className="flex items-center rounded-2xl p-1 flex-shrink-0" style={{ background: isDark ? 'rgba(15,23,42,.92)' : 'rgba(255,255,255,.92)', border: `1px solid ${isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)'}` }}>
                    <button onClick={() => setLocationMode('cached')} className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${locationMode === 'cached' ? 'bg-primary text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      <LocateFixed size={14} />
                      Fija
                    </button>
                    <button onClick={handleToggleLocationMode} className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 ${locationMode === 'realtime' ? 'bg-amber-500 text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                      <Navigation size={14} />
                      Tiempo real
                    </button>
                  </div>
                </div>

                {locationError && <p className="text-sm font-medium text-rose-500">{locationError}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
