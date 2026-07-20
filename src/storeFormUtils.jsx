// Utilidades compartidas del panel de tienda (StoreApp.jsx): subida de
// archivos, autocompletado de direcciones y selector de ubicación en mapa.
// Extraído de StoreRegisterFlow.jsx (borrado en el recorte a mono-tienda,
// ver CLAUDE.md) porque StoreApp.jsx sigue usando estos tres helpers.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, X, Search } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { apiFetch } from './api';

const API_BASE = '/.netlify/functions';

// ─── Utils ─────────────────────────────────────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result.split(',')[1]);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

export async function uploadFile(file) {
  const fileData    = await fileToBase64(file);
  const contentType = file.type;
  const fileName    = file.name;
  const res = await apiFetch(`${API_BASE}/upload`, {
    method: 'POST',
    authRequired: true,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fileName, fileData, contentType }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Error al subir imagen');
  return data.url;
}

// Tipos de resultado de Nominatim que SÍ son ciudades/localidades reales.
// Filtramos por `addresstype` (no `type`/`class`): Nominatim dibuja pueblos
// como category:"boundary"+type:"administrative" (es el polígono del
// límite), pero `addresstype` dice qué ES en la práctica — sin este filtro
// una búsqueda de ciudad podía devolver líneas de colectivo, calles o
// distritos rurales sin población junto a los resultados reales.
// Ref: https://nominatim.org/release-docs/latest/api/Search/
const CITY_ADDRESS_TYPES = new Set([
  'city', 'town', 'village', 'hamlet', 'municipality', 'suburb', 'city_district',
]);
// Tipos que SÍ son direcciones puntuales (calle/número/edificio) — antes
// compartía el mismo set que ciudad, así el campo Dirección también
// mostraba resultados de ciudad en su dropdown, sin distinguir qué campo
// estaba buscando.
const ADDRESS_ADDRESS_TYPES = new Set(['road', 'house', 'building']);

// Ciudad de referencia para las sugerencias al hacer foco con el campo
// vacío — evita un dropdown vacío hasta que el usuario escribe algo.
const FOCUS_HOME_QUERY = 'Bovril, Entre Ríos, Argentina';
const FOCUS_HOME_VIEWBOX = '-59.9,-31.9,-58.9,-30.9'; // ~50km alrededor de Bovril

async function buscarPlaces(query, { viewbox, bounded = '0', types = CITY_ADDRESS_TYPES } = {}) {
  const params = new URLSearchParams({
    q: query, format: 'jsonv2', limit: '8', 'accept-language': 'es',
    countrycodes: 'ar', addressdetails: '1',
  });
  if (viewbox) { params.set('viewbox', viewbox); params.set('bounded', bounded); }
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: { 'Accept-Language': 'es' } });
  const data = await res.json();
  return data.filter((r) => types.has(r.addresstype));
}

// Reverse geocoding — coordenadas → dirección legible, mismo proveedor
// (Nominatim) que el autocomplete de arriba, así GPS/mapa quedan como
// alternativas COMPLETAS a tipear: no solo mueven el pin, también rellenan
// ciudad/dirección en vez de dejarlas vacías o desincronizadas del pin.
export async function reverseGeocode(lat, lng) {
  const params = new URLSearchParams({ lat, lon: lng, format: 'jsonv2', 'accept-language': 'es', addressdetails: '1' });
  const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { headers: { 'Accept-Language': 'es' } });
  if (!res.ok) throw new Error('No pudimos resolver la dirección');
  const data = await res.json();
  const a = data.address || {};
  const ciudad = a.city || a.town || a.village || a.municipality || a.suburb || '';
  const provincia = a.state || '';
  const calle = [a.road, a.house_number].filter(Boolean).join(' ');
  return {
    ciudad: [ciudad, provincia].filter(Boolean).join(', '),
    direccion: calle || data.display_name?.split(',').slice(0, 2).join(',').trim() || '',
  };
}

// ─── Autocomplete genérico (ciudad o dirección) — patrón del buscador del mapa ─
// labelParts: cuántas secciones del display_name usar como valor final del input
// id/activeId/onActivate: coordinación opcional entre varias instancias en
// el mismo formulario (ej. Ciudad + Dirección) para que solo una tenga su
// dropdown abierto a la vez — sin esto, cada instancia decide su propio
// "abierto/cerrado" solo por foco/blur, y dos campos vecinos pueden mostrar
// resultados superpuestos si el timing de blur no alcanza a cerrar el
// anterior antes de que el siguiente abra el suyo. Si no se pasan estos
// props (uso standalone, ej. RegistroTienda.jsx con un solo campo), el
// componente se comporta exactamente igual que antes.
export function PlaceAutocomplete({ value, onChange, onSelect, placeholder, searchSuffix = '', labelParts = 2, id, activeId, onActivate, onDeactivate, mode = 'ciudad' }) {
  // mode='ciudad' (default, mismo comportamiento de siempre) filtra solo
  // localidades; mode='direccion' filtra solo calles/números/edificios —
  // antes compartían el mismo filtro y el campo Dirección también mostraba
  // resultados de ciudad en su dropdown.
  const addressTypes = mode === 'direccion' ? ADDRESS_ADDRESS_TYPES : CITY_ADDRESS_TYPES;
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  // bloquea el effect de búsqueda justo después de seleccionar
  const skipSearch = useRef(false);
  // Guard de race condition: cada búsqueda incrementa este contador y solo
  // aplica su resultado si sigue siendo la más reciente al volver — sin
  // esto, si el usuario tipea rápido, una respuesta vieja que llega tarde
  // puede pisar resultados más nuevos ya en pantalla.
  const requestIdRef = useRef(0);
  // El effect de búsqueda de abajo reacciona a cambios de `query` — sin
  // este guard, dispararía también en el MONTAJE inicial cuando el campo ya
  // trae un valor precargado (ej. ciudad guardada de la tienda), como si el
  // usuario acabara de tipearla: el dropdown aparecía solo con abrir el
  // sheet, sin que nadie tocara el input.
  const mounted = useRef(false);
  // Cierre forzado: si hay coordinación activa (activeId definido) y este
  // campo no es el activo, no muestra resultados aunque el state interno
  // los tenga — garantía dura, no depende del timing de blur/focus.
  const visibleResults = (id != null && activeId != null && activeId !== id) ? [] : results;

  useEffect(() => { setQuery(value || ''); }, [value]);

  // Foco con el campo vacío → sugerencias de la zona (Bovril y alrededores),
  // sin esperar a que el usuario escriba nada. Solo tiene sentido en modo
  // ciudad — en modo dirección no hay "calles sugeridas" sin que el
  // usuario tipee algo primero.
  const handleFocus = () => {
    onActivate?.(id);
    if (query.trim() || mode === 'direccion') return;
    const reqId = ++requestIdRef.current;
    setLoading(true);
    buscarPlaces(FOCUS_HOME_QUERY, { types: addressTypes })
      .then((bovril) => {
        buscarPlaces(FOCUS_HOME_QUERY.replace('Bovril, ', ''), { viewbox: FOCUS_HOME_VIEWBOX, bounded: '1', types: addressTypes })
          .then((cercanas) => {
            if (reqId !== requestIdRef.current) return;
            const vistos = new Set(bovril.map((r) => r.place_id));
            setResults([...bovril, ...cercanas.filter((r) => !vistos.has(r.place_id))]);
          })
          .catch(() => { if (reqId === requestIdRef.current) setResults(bovril); });
      })
      .catch(() => { if (reqId === requestIdRef.current) setResults([]); })
      .finally(() => { if (reqId === requestIdRef.current) setLoading(false); });
  };

  // Delay corto: onBlur dispara antes que el onMouseDown de un resultado del
  // dropdown — sin el timeout, el dropdown se colapsa antes de registrar el
  // click y "select" nunca llega a ejecutarse.
  const handleBlur = () => {
    setTimeout(() => {
      setResults([]);
      // onDeactivate recibe el id propio — el padre solo limpia el activo
      // compartido si sigue siendo este mismo campo (si el usuario ya
      // activó otro campo coordinado en el ínterin, ese onActivate más
      // reciente no debe ser pisado por este blur tardío).
      onDeactivate?.(id);
    }, 150);
  };

  useEffect(() => {
    // No dispara en el montaje inicial (ver comentario de `mounted` arriba)
    // — solo a partir de acá cuenta como "el usuario editó el campo".
    if (!mounted.current) { mounted.current = true; return; }
    clearTimeout(timerRef.current);
    if (skipSearch.current) { skipSearch.current = false; setResults([]); return; }
    if (!query.trim()) return; // campo vacío: deja las sugerencias que puso handleFocus
    setLoading(true);
    const searchQ = searchSuffix ? `${query}, ${searchSuffix}` : query;
    const reqId = ++requestIdRef.current;
    timerRef.current = setTimeout(() => {
      buscarPlaces(searchQ, { types: addressTypes })
        .then(r => { if (reqId === requestIdRef.current) setResults(r); })
        .catch(() => { if (reqId === requestIdRef.current) setResults([]); })
        .finally(() => { if (reqId === requestIdRef.current) setLoading(false); });
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query, searchSuffix, mode]);

  const select = (item) => {
    const parts = item.display_name.split(',').map(s => s.trim()).filter(Boolean);
    const label = parts.slice(0, labelParts).join(', ');
    skipSearch.current = true;
    setQuery(label);
    setResults([]);
    onChange(label);
    onSelect?.({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), label, displayName: item.display_name });
  };

  const clear = () => { skipSearch.current = true; setQuery(''); onChange(''); setResults([]); onSelect?.(null); };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 focus-within:border-brand focus-within:bg-white dark:focus-within:bg-white/8 focus-within:ring-2 focus-within:ring-brand/15 transition-all">
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />
          : <Search className="w-4 h-4 text-slate-400 shrink-0" />
        }
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          className="w-full bg-transparent focus:outline-none focus-visible:outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
        />
        {query && (
          <button type="button" onMouseDown={clear} className="shrink-0">
            <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
          </button>
        )}
      </div>
      {visibleResults.length > 0 && (
        // z-[1100]: por encima de los panes internos de Leaflet (hasta
        // z-index:1000 los controles de zoom) — con z-20 el mapa de abajo
        // tapaba este dropdown cuando ambos coexisten en el mismo modal.
        <div className="absolute top-full left-0 right-0 z-[1100] mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shadow-lg">
          {visibleResults.map((r, i) => (
            <button
              key={r.place_id || i}
              type="button"
              onMouseDown={() => select(r)}
              className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 border-b border-slate-200/70 dark:border-white/10 last:border-b-0 transition-colors"
            >
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                {r.name || r.display_name.split(',')[0]}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {r.display_name}
              </p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Mapa para pinear la ubicación — usa react-leaflet + tiles CartoDB ────────
const TILES_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILES_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILES_ATTR  = '© <a href="https://osm.org/copyright">OSM</a> · © <a href="https://carto.com">CARTO</a>';

function brandPinIcon(L) {
  return L.divIcon({
    className: '',
    html: `<div style="
      width:32px;height:32px;
      background:#00B8D9;
      border-radius:50% 50% 50% 0;
      transform:rotate(-45deg);
      border:3px solid white;
      box-shadow:0 3px 12px rgba(0,184,217,0.5),0 1px 4px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -34],
  });
}

export function MapPicker({ lat, lng, flyTo, onChange, isDark }) {
  const [MapComponents, setMapComponents] = useState(null);
  const [markerPos, setMarkerPos] = useState(lat && lng ? [lat, lng] : null);
  const LRef = useRef(null);

  useEffect(() => {
    Promise.all([import('react-leaflet'), import('leaflet')]).then(([rl, L]) => {
      LRef.current = L.default || L;
      setMapComponents(rl);
    });
  }, []);

  useEffect(() => {
    if (lat && lng) setMarkerPos([lat, lng]);
  }, [lat, lng]);

  const handleClick = useCallback((clat, clng) => {
    setMarkerPos([clat, clng]);
    onChange({ lat: clat, lng: clng });
  }, [onChange]);

  if (!MapComponents) {
    return (
      <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-white/5 flex items-center justify-center" style={{ height: 220 }}>
        <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
      </div>
    );
  }

  const { MapContainer, TileLayer, Marker, useMapEvents, useMap } = MapComponents;
  const L = LRef.current;
  // Fallback sin ubicación aún: Bovril, Entre Ríos (mismo centro de
  // referencia que FOCUS_HOME_QUERY/VIEWBOX del autocomplete) — antes caía
  // en Córdoba capital, sin relación con la zona real del negocio.
  const center = markerPos || (lat && lng ? [lat, lng] : [-31.36, -59.42]);

  function InnerClickHandler() {
    const map = useMap();
    useMapEvents({
      click: (e) => {
        handleClick(e.latlng.lat, e.latlng.lng);
        map.panTo([e.latlng.lat, e.latlng.lng], { animate: true, duration: 0.4 });
      },
    });
    return null;
  }

  function FlyController() {
    const map = useMap();
    useEffect(() => {
      if (flyTo?.lat && flyTo?.lng) {
        map.flyTo([flyTo.lat, flyTo.lng], 17, { duration: 1.2 });
      }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [flyTo?.lat, flyTo?.lng]);
    return null;
  }

  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 shadow-sm" style={{ height: 240 }}>
      <MapContainer
        center={center}
        zoom={markerPos ? 15 : 12}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer url={isDark ? TILES_DARK : TILES_LIGHT} attribution={TILES_ATTR} />
        <InnerClickHandler />
        <FlyController />
        {markerPos && L && (
          <Marker position={markerPos} icon={brandPinIcon(L)} />
        )}
      </MapContainer>
    </div>
  );
}
