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

// ── Redimensionado client-side (Canvas) ───────────────────────────────────────
// Sin esto, /upload guarda el archivo TAL CUAL llega del navegador — una foto
// de cámara de celular puede pesar varios MB en resolución nativa (3000-4000px
// de lado). Consecuencias reales: (1) el <og:image> de WhatsApp/FB no
// renderiza el preview con archivos tan pesados o de proporción no estándar,
// (2) el catálogo carga la MISMA imagen full-size en la card chica que en el
// detalle, sin versión liviana. Acá generamos 3 variantes de una sola foto
// antes de subir, cada una con el tamaño que su uso real necesita — ningún
// pipeline de servidor (sharp, etc.), todo con canvas 2D nativo del browser.
function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => { resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('No se pudo leer la imagen')); };
    img.src = url;
  });
}

// Redimensiona conservando proporción hasta que el lado más largo mida
// `maxDim` (nunca agranda una imagen más chica) y recorta al centro si se
// pide un aspectRatio fijo (necesario para ogImage: WhatsApp/FB esperan un
// ratio horizontal consistente, no lo que sea que el dueño haya fotografiado).
function resizeToCanvas(img, { maxDim, aspectRatio } = {}) {
  const srcW = img.naturalWidth || img.width;
  const srcH = img.naturalHeight || img.height;

  let sx = 0, sy = 0, sw = srcW, sh = srcH;
  if (aspectRatio) {
    const srcRatio = srcW / srcH;
    if (srcRatio > aspectRatio) { sw = srcH * aspectRatio; sx = (srcW - sw) / 2; }
    else if (srcRatio < aspectRatio) { sh = srcW / aspectRatio; sy = (srcH - sh) / 2; }
  }

  const outRatio = sw / sh;
  let outW = sw, outH = sh;
  if (maxDim && Math.max(outW, outH) > maxDim) {
    if (outW >= outH) { outW = maxDim; outH = Math.round(maxDim / outRatio); }
    else { outH = maxDim; outW = Math.round(maxDim * outRatio); }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.round(outW);
  canvas.height = Math.round(outH);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
  return canvas;
}

function canvasToFile(canvas, fileName, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) return reject(new Error('No se pudo procesar la imagen'));
      resolve(new File([blob], fileName, { type: 'image/jpeg' }));
    }, 'image/jpeg', quality);
  });
}

/**
 * Genera y sube 3 variantes de una foto de oferta/producto:
 *   - full:  hasta 1600px de lado, calidad 85% — el detalle/zoom individual.
 *   - thumb: hasta 480px de lado, calidad 78% — las cards del catálogo.
 *   - og:    1200×630 (ratio fijo, recortado al centro), calidad 80% — meta
 *            og:image para WhatsApp/Facebook (tamaño y proporción que esas
 *            plataformas esperan, sin depender de qué foto haya subido el
 *            dueño).
 * Devuelve { imageUrl, thumbUrl, ogImageUrl }. Si el archivo no es una
 * imagen procesable por canvas (ej. ya viene raro), cae a subir el original
 * tal cual en los 3 campos — nunca bloquea la publicación por esto.
 */
export async function uploadOfertaImages(file) {
  try {
    const img = await loadImageFromFile(file);
    const base = (file.name || 'foto').replace(/\.[^.]+$/, '');

    const [fullFile, thumbFile, ogFile] = await Promise.all([
      canvasToFile(resizeToCanvas(img, { maxDim: 1600 }), `${base}-full.jpg`, 0.85),
      canvasToFile(resizeToCanvas(img, { maxDim: 480 }), `${base}-thumb.jpg`, 0.78),
      canvasToFile(resizeToCanvas(img, { maxDim: 1200, aspectRatio: 1200 / 630 }), `${base}-og.jpg`, 0.8),
    ]);
    URL.revokeObjectURL(img.src);

    const [imageUrl, thumbUrl, ogImageUrl] = await Promise.all([
      uploadFile(fullFile), uploadFile(thumbFile), uploadFile(ogFile),
    ]);
    return { imageUrl, thumbUrl, ogImageUrl };
  } catch {
    const url = await uploadFile(file);
    return { imageUrl: url, thumbUrl: url, ogImageUrl: url };
  }
}

/**
 * Sube una foto de PERFIL o GALERÍA de tienda, redimensionada.
 *
 * Antes estas dos usaban uploadFile() directo, o sea el archivo original tal
 * cual: una foto de celular moderno son 3-8 MB y se cargan en el hero de la
 * tienda, que es lo primero que ve cualquier visitante (y ahora también la
 * card de ejemplo de la landing). Las ofertas ya se procesaban con
 * uploadOfertaImages; esto cierra el hueco que quedaba.
 *
 * No genera 3 variantes como las ofertas: la portada se ve a ancho completo
 * en una sola medida, así que alcanza con una versión bien dimensionada.
 * 1600px cubre pantallas grandes con holgura.
 *
 * Si el archivo no es procesable por canvas, cae al original — igual que
 * uploadOfertaImages, nunca bloquea el guardado por esto.
 */
export async function uploadImagenTienda(file, { maxDim = 1600, quality = 0.85 } = {}) {
  try {
    const img = await loadImageFromFile(file);
    const base = (file.name || 'foto').replace(/\.[^.]+$/, '');
    const optimizada = await canvasToFile(resizeToCanvas(img, { maxDim }), `${base}.jpg`, quality);
    URL.revokeObjectURL(img.src);
    return await uploadFile(optimizada);
  } catch {
    return await uploadFile(file);
  }
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
      {/* Input DIRECTO con ícono/borrar absolutos encima, no un <div>
          contenedor con focus-within — antes había DOS bordes visibles: el
          del div exterior (focus-within:border-brand) y, al lado, el
          borde/foco propio de otros inputs del mismo formulario, dando la
          sensación de "doble contorno" en vez de un único campo (reportado
          explícitamente). Mismo patrón EXACTO que la barra de búsqueda de
          HomeGlobal.jsx: un solo <input> con su propio borde, sin ring/
          focus-within duplicado — el :focus-visible global de index.css ya
          resalta el borde en foco para toda la app. Tokens de marca
          (rgb(var(--brand)/X)) en vez de slate/gris neutro, mismo criterio
          que el resto de inputs tintados del formulario. */}
      {loading
        ? <Loader2 className="w-4 h-4 animate-spin text-brand absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
        : <Search className="w-4 h-4 text-brand/70 absolute left-4 top-1/2 -translate-y-1/2 z-10 pointer-events-none" />
      }
      <input
        value={query}
        onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder={placeholder}
        className="w-full rounded-2xl pl-10 pr-10 py-3 text-sm font-medium border outline-none transition-colors focus:border-brand"
        style={{
          color: 'var(--text-primary)',
          background: 'rgb(var(--brand, 0 184 217) / 0.06)',
          borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
        }}
      />
      {query && (
        <button type="button" onMouseDown={clear} className="absolute right-3.5 top-1/2 -translate-y-1/2 shrink-0">
          <X className="w-3.5 h-3.5 transition-colors" style={{ color: 'var(--text-secondary, #999)' }} />
        </button>
      )}
      {visibleResults.length > 0 && (
        // z-[1100]: por encima de los panes internos de Leaflet (hasta
        // z-index:1000 los controles de zoom) — con z-20 el mapa de abajo
        // tapaba este dropdown cuando ambos coexisten en el mismo modal.
        // Fondo sólido azulado en dark (#0a1420, no --surface-solid — ese
        // token resuelve a #1f1f1f, un gris carbón NEUTRO sin componente
        // azulado, el mismo problema que ya se corrigió antes en
        // ProximamenteModal/LoginSheet) — un gris neutro puro no se tiñe lo
        // suficiente con el borde translúcido de marca encima, hace falta
        // que la base misma sea azulada. bg-[#0a1420] vía dark: en vez de
        // style condicionado por isDark: este componente no recibe esa prop
        // (se usa en varios lugares sin pasarla) y depender de la clase
        // .dark del documento es más robusto que agregar una prop nueva
        // solo para este fondo.
        <div className="absolute top-full left-0 right-0 z-[1100] mt-2 max-h-56 overflow-y-auto rounded-2xl border shadow-lg bg-white dark:bg-[#0a1420]" style={{
          borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
        }}>
          <style>{`
            .dark .lk-place-result:not(:last-child) { border-bottom: 1px solid rgb(var(--brand, 0 184 217) / 0.12); }
            .lk-place-result:not(:last-child) { border-bottom: 1px solid rgb(var(--brand, 0 184 217) / 0.1); }
          `}</style>
          {visibleResults.map((r, i) => (
            <button
              key={r.place_id || i}
              type="button"
              onMouseDown={() => select(r)}
              className="lk-place-result w-full text-left px-4 py-3 transition-colors hover:bg-brand/[0.08]"
            >
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                {r.name || r.display_name.split(',')[0]}
              </p>
              <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-secondary, #999)' }}>
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
