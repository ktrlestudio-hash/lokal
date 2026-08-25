// Utilidades compartidas del panel de tienda (StoreApp.jsx): subida de
// archivos, autocompletado de direcciones y selector de ubicación en mapa.
// Extraído de StoreRegisterFlow.jsx (borrado en el recorte a mono-tienda,
// ver CLAUDE.md) porque StoreApp.jsx sigue usando estos tres helpers.
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Loader2, X, Search, Navigation } from 'lucide-react';
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
export function PlaceAutocomplete({ value, onChange, onSelect, placeholder, searchSuffix = '', labelParts = 2, id, activeId, onActivate, onDeactivate, mode = 'ciudad', onUbicacion, ubicacionLoading = false, ubicacionError = null }) {
  // onUbicacion (opcional): "Usar mi ubicación" vive DENTRO del panel, como
  // la primera fila antes de las sugerencias — no un botón aparte fuera del
  // componente (ahí competía por espacio junto al label, y quedaba
  // desconectado del resto de la interacción de este mismo campo). Pedido
  // explícito: mismo lugar donde ya aparecen las demás opciones para elegir,
  // en vez de un atajo visual separado.
  // mode='ciudad' (default, mismo comportamiento de siempre) filtra solo
  // localidades; mode='direccion' filtra solo calles/números/edificios —
  // antes compartían el mismo filtro y el campo Dirección también mostraba
  // resultados de ciudad en su dropdown.
  const addressTypes = mode === 'direccion' ? ADDRESS_ADDRESS_TYPES : CITY_ADDRESS_TYPES;

  // ── Rediseño trigger+panel (2026-08) ─────────────────────────────────
  // Antes este campo era "un input que muestra resultados debajo mientras
  // se escribe" — mismo patrón que un buscador. Problema real reportado:
  // en mobile, tocar el campo levanta el teclado de inmediato (el propio
  // <input> recibe el foco al abrir) y el panel de resultados, que se
  // posiciona debajo del campo, terminaba tapado por el teclado cuando el
  // campo vivía en la mitad inferior del formulario.
  //
  // CategoryPicker.jsx (selector de categoría del formulario de producto)
  // ya resuelve esto con OTRO patrón, mejor para este caso: un trigger fijo
  // (no recibe foco de teclado al tocarlo) abre un panel `absolute` con una
  // lista de sugerencias YA visible (sin que el usuario tenga que escribir
  // nada) y, adentro del panel, un input de búsqueda real con su propio
  // borde — buscar es opcional, la mayoría navega la lista. Este archivo
  // copia ESE patrón para el mismo problema.
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  // Guard de race condition: cada búsqueda incrementa este contador y solo
  // aplica su resultado si sigue siendo la más reciente al volver — sin
  // esto, si el usuario tipea rápido, una respuesta vieja que llega tarde
  // puede pisar resultados más nuevos ya en pantalla.
  const requestIdRef = useRef(0);
  const containerRef = useRef(null);
  const searchRef = useRef(null);

  // Cierre al click afuera — mismo mecanismo que CategoryPicker.jsx
  // (listener de mousedown global), más robusto que depender solo de
  // blur/timeout: no falla si el foco nunca estuvo realmente en el input
  // (ej. el usuario tocó un resultado de la lista con el mouse, sin pasar
  // por teclado).
  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  // Cierre forzado por coordinación: si hay activeId definido y este campo
  // no es el activo, se cierra aunque estuviera abierto — garantía dura,
  // no depende del timing de blur/focus (mismo criterio que antes).
  useEffect(() => {
    if (id != null && activeId != null && activeId !== id) setOpen(false);
  }, [id, activeId]);

  const buscar = (q, reqId) => {
    setLoading(true);
    buscarPlaces(q, { types: addressTypes })
      .then((r) => { if (reqId === requestIdRef.current) setResults(r); })
      .catch(() => { if (reqId === requestIdRef.current) setResults([]); })
      .finally(() => { if (reqId === requestIdRef.current) setLoading(false); });
  };

  // Abrir: sugerencias de la zona (Bovril y alrededores) YA cargadas, sin
  // que el usuario tenga que escribir nada primero — solo tiene sentido en
  // modo ciudad (en modo dirección no hay "calles sugeridas" sin tipear
  // algo). El trigger NO es un <input>, así que abrir NO levanta el
  // teclado — el usuario decide si quiere buscar tocando el campo de texto
  // de adentro del panel.
  const handleOpen = () => {
    if (open) { setOpen(false); setQuery(''); return; }
    onActivate?.(id);
    setQuery('');
    setOpen(true);
    if (mode === 'direccion') { setResults([]); return; }
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

  useEffect(() => {
    if (!open) return undefined;
    clearTimeout(timerRef.current);
    if (!query.trim()) return undefined; // campo vacío: deja las sugerencias que puso handleOpen
    const searchQ = searchSuffix ? `${query}, ${searchSuffix}` : query;
    const reqId = ++requestIdRef.current;
    timerRef.current = setTimeout(() => buscar(searchQ, reqId), 350);
    return () => clearTimeout(timerRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, searchSuffix, mode, open]);

  const select = (item) => {
    const parts = item.display_name.split(',').map(s => s.trim()).filter(Boolean);
    const label = parts.slice(0, labelParts).join(', ');
    onChange(label);
    onSelect?.({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), label, displayName: item.display_name });
    setOpen(false);
    setQuery('');
    onDeactivate?.(id);
  };

  const clear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onChange('');
    onSelect?.(null);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger — NO es un <input>: tocarlo no levanta el teclado. Mismo
          lenguaje que el trigger de CategoryPicker.jsx (borde de marca
          mientras open=true), con los tokens de marca (rgb(var(--brand)/X))
          en vez de slate/gris neutro que ya usa el resto del formulario. */}
      <div
        role="button"
        tabIndex={0}
        onClick={handleOpen}
        onKeyDown={(e) => e.key === 'Enter' && handleOpen()}
        className="w-full flex items-center gap-2 pl-4 pr-3.5 py-3 rounded-2xl border cursor-pointer select-none transition-colors"
        style={{
          background: 'rgb(var(--brand, 0 184 217) / 0.06)',
          borderColor: open ? 'rgb(var(--brand, 0 184 217))' : 'rgb(var(--brand, 0 184 217) / 0.18)',
        }}
      >
        <Search className="w-4 h-4 text-brand/70 shrink-0" />
        {value ? (
          <span className="flex-1 min-w-0 truncate text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
        ) : (
          <span className="flex-1 min-w-0 truncate text-sm" style={{ color: 'var(--text-secondary, #999)' }}>{placeholder}</span>
        )}
        {value && (
          <button type="button" onClick={clear} className="shrink-0">
            <X className="w-3.5 h-3.5 transition-colors" style={{ color: 'var(--text-secondary, #999)' }} />
          </button>
        )}
      </div>

      {open && (
        // z-[1100]: por encima de los panes internos de Leaflet (hasta
        // z-index:1000 los controles de zoom) — con z-20 el mapa de abajo
        // tapaba este panel cuando ambos coexisten en el mismo modal.
        // Fondo sólido azulado en dark (#0a1420, no --surface-solid — ese
        // token resuelve a #1f1f1f, un gris carbón NEUTRO sin componente
        // azulado, mismo fix que ya se aplicó en ProximamenteModal/
        // LoginSheet) vía dark: en vez de un style condicionado por isDark:
        // este componente no recibe esa prop (se usa en varios lugares sin
        // pasarla) y depender de la clase .dark del documento es más
        // robusto que agregar una prop nueva solo para este fondo.
        <div className="absolute top-full left-0 right-0 z-[1100] mt-2 rounded-2xl border shadow-xl overflow-hidden bg-white dark:bg-[#0a1420]" style={{
          borderColor: 'rgb(var(--brand, 0 184 217) / 0.18)',
        }}>
          {/* Input de búsqueda REAL, con su propio borde — mismo criterio
              que CategoryPicker.jsx: antes el borde vivía en el <div>
              exterior (focus-within) y el input de adentro iba sin borde
              propio, dando la sensación de doble contorno. Acá el input
              vive DENTRO del panel, ya abierto — sin autoFocus: abrir el
              panel no debe levantar el teclado, buscar es una elección del
              usuario, no el paso obligatorio para empezar. */}
          <div className="p-2 border-b" style={{ borderColor: 'rgb(var(--brand, 0 184 217) / 0.12)' }}>
            <div className="relative">
              {loading
                ? <Loader2 className="w-3.5 h-3.5 animate-spin text-brand absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                : <Search className="w-3.5 h-3.5 text-brand/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              }
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar..."
                className="w-full pl-9 pr-8 py-2 rounded-xl text-sm border outline-none transition-colors focus:border-brand"
                style={{
                  color: 'var(--text-primary)',
                  background: 'rgb(var(--brand, 0 184 217) / 0.04)',
                  borderColor: 'rgb(var(--brand, 0 184 217) / 0.14)',
                }}
              />
              {query && (
                <button type="button" onClick={() => setQuery('')} className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--text-secondary, #999)' }} />
                </button>
              )}
            </div>
          </div>

          {/* "Usar mi ubicación" — primera opción del panel, no un botón
              aparte fuera del componente. Solo sin búsqueda activa: es un
              atajo para arrancar rápido, no un resultado de "Bovril" o lo
              que sea que el usuario esté tipeando. */}
          {onUbicacion && !query && (
            <div className="p-2 border-b" style={{ borderColor: 'rgb(var(--brand, 0 184 217) / 0.12)' }}>
              <button
                type="button"
                onClick={onUbicacion}
                disabled={ubicacionLoading}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors hover:bg-brand/[0.08] disabled:opacity-60"
                style={{ color: 'rgb(var(--brand, 0 184 217))' }}
              >
                {ubicacionLoading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Navigation className="w-4 h-4 shrink-0" />}
                {ubicacionLoading ? 'Ubicando...' : 'Usar mi ubicación'}
              </button>
              {ubicacionError && (
                <p className="text-[11px] font-semibold mt-1.5 px-3 text-rose-500">
                  No pudimos acceder a tu ubicación — probá buscar tu ciudad.
                </p>
              )}
            </div>
          )}

          <div className="p-2 max-h-56 overflow-y-auto">
            {results.length === 0 && !loading && (
              <p className="text-center text-sm py-4" style={{ color: 'var(--text-secondary, #999)' }}>
                {query ? 'Sin resultados — probá con otro término' : 'Escribí para buscar'}
              </p>
            )}
            {results.map((r, i) => (
              <button
                key={r.place_id || i}
                type="button"
                onClick={() => select(r)}
                className="w-full text-left px-3 py-2.5 rounded-xl transition-colors hover:bg-brand/[0.08]"
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
