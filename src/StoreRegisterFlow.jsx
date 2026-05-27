import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  ArrowLeft, ArrowRight, Check, Loader2, AlertCircle,
  MapPin, CreditCard, X, Zap, Navigation, Sun, Moon, Search
} from 'lucide-react';
import { LogoFull, KtrlMark } from './Brand';
import 'leaflet/dist/leaflet.css';
import { CATEGORIES } from './categories';
import CategoryPicker from './CategoryPicker';
import { apiFetch } from './api';

const ROOT_CATEGORIES = CATEGORIES.filter(c => c.parentId === null);

const API_BASE = '/.netlify/functions';

export const PRECIO_MENSUAL = 4990;
export const PRECIO_ANUAL   = 47900;
const PRECIO_ANUAL_MES = Math.round(PRECIO_ANUAL / 12);

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

// ─── Barra de progreso ─────────────────────────────────────────────────────────
function ProgressBar({ step, total }) {
  return (
    <div className="flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={`h-1 rounded-full transition-all duration-400 ${
            i < step
              ? 'bg-brand flex-[2]'
              : i === step
              ? 'bg-brand flex-[3]'
              : 'bg-slate-200 dark:bg-white/15 flex-1'
          }`}
        />
      ))}
    </div>
  );
}

// ─── Autocomplete genérico (ciudad o dirección) — patrón del buscador del mapa ─
// labelParts: cuántas secciones del display_name usar como valor final del input
export function PlaceAutocomplete({ value, onChange, onSelect, placeholder, searchSuffix = '', labelParts = 2 }) {
  const [query, setQuery] = useState(value || '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef(null);
  // bloquea el effect de búsqueda justo después de seleccionar
  const skipSearch = useRef(false);

  useEffect(() => { setQuery(value || ''); }, [value]);

  useEffect(() => {
    clearTimeout(timerRef.current);
    if (!query.trim() || skipSearch.current) {
      skipSearch.current = false;
      setResults([]);
      return;
    }
    setLoading(true);
    const searchQ = searchSuffix ? `${query}, ${searchSuffix}` : query;
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQ)}&format=json&limit=6&accept-language=es&countrycodes=ar`,
          { headers: { 'Accept-Language': 'es' } }
        );
        const data = await res.json();
        setResults(data);
      } catch { setResults([]); } finally { setLoading(false); }
    }, 350);
    return () => clearTimeout(timerRef.current);
  }, [query, searchSuffix]);

  const select = (item) => {
    const parts = item.display_name.split(',').map(s => s.trim()).filter(Boolean);
    const label = parts.slice(0, labelParts).join(', ');
    skipSearch.current = true;
    setQuery(label);
    setResults([]);
    onChange(label);
    onSelect?.({ lat: parseFloat(item.lat), lng: parseFloat(item.lon), label, displayName: item.display_name });
  };

  const clear = () => { skipSearch.current = true; setQuery(''); onChange(''); setResults([]); };

  return (
    <div className="relative">
      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-4 py-3 focus-within:border-brand transition-colors">
        {loading
          ? <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />
          : <Search className="w-4 h-4 text-slate-400 shrink-0" />
        }
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); onChange(e.target.value); }}
          placeholder={placeholder}
          className="w-full bg-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-400 text-sm"
        />
        {query && (
          <button type="button" onMouseDown={clear} className="shrink-0">
            <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors" />
          </button>
        )}
      </div>
      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-20 mt-2 max-h-56 overflow-y-auto rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#0f172a] shadow-lg">
          {results.map((r, i) => (
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
  const center = markerPos || (lat && lng ? [lat, lng] : [-31.42, -64.19]);

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

// ══════════════════════════════════════════════════════════════════════════════
// PASOS DEL FLUJO
// ══════════════════════════════════════════════════════════════════════════════

// Paso 0 — Bienvenida
function StepBienvenida({ onNext, onCancel, firebaseUser }) {
  return (
    <div className="w-full max-w-sm text-center">
      <div className="mb-8">
        <div className="w-20 h-20 bg-brand/15 border border-brand/30 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <Zap className="w-10 h-10 text-brand" />
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-3 leading-tight">
          Registrá tu tienda<br />en Lokal
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
          En menos de 2 minutos tu negocio empieza a recibir pedidos de clientes de tu barrio.
        </p>
      </div>

      <div className="space-y-2 mb-8 text-left">
        {[
          'Solo 3 datos para empezar',
          'Recibís demandas de clientes locales',
          '1 mes de regalo al activar',
        ].map(f => (
          <div key={f} className="flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
            <div className="w-5 h-5 bg-brand/20 rounded-full flex items-center justify-center shrink-0">
              <Check className="w-3 h-3 text-brand" />
            </div>
            {f}
          </div>
        ))}
      </div>

      <button
        onClick={onNext}
        className="w-full py-4 bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand/25"
      >
        Empezar <ArrowRight className="w-4 h-4" />
      </button>
      <button onClick={onCancel} className="mt-3 w-full py-2.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 text-sm transition-colors">
        Ahora no
      </button>
    </div>
  );
}

// Paso 1 — Lo esencial: nombre + rubro
function StepEsencial({ info, updateField, onNext }) {
  const valid = info.nombre.trim().length >= 2 && info.rubros.length > 0;
  const [pickerVal, setPickerVal] = useState(null);

  const addRubro = (id) => {
    if (id && !info.rubros.includes(id)) {
      updateField('rubros', [...info.rubros, id]);
    }
    setPickerVal(null);
  };

  const removeRubro = (id) => {
    updateField('rubros', info.rubros.filter(r => r !== id));
  };

  const getRubroLabel = (id) => {
    const cat = CATEGORIES.find(c => c.id === id);
    return cat ? cat.name : id;
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-7">
        <p className="text-brand text-xs font-bold uppercase tracking-widest mb-2">Paso 1 · Lo esencial</p>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">¿Cómo se llama<br />tu negocio?</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Y qué vendés o hacés.</p>
      </div>

      <div className="space-y-5 mb-8">
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Nombre del negocio *</label>
          <input
            autoFocus
            value={info.nombre}
            onChange={e => updateField('nombre', e.target.value)}
            placeholder="Ej: Ferretería El Barrio"
            maxLength={80}
            className="w-full px-4 py-3.5 bg-slate-100 border border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand transition-colors dark:bg-white/5 dark:border-white/15 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
            ¿Qué hacés o vendés? *
          </label>

          {info.rubros.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {info.rubros.map(id => (
                <button
                  key={id}
                  type="button"
                  onClick={() => removeRubro(id)}
                  className="flex items-center gap-1.5 bg-brand/20 border border-brand/50 text-brand px-3 py-1.5 rounded-full text-xs font-bold hover:bg-brand/30 transition-colors"
                >
                  {getRubroLabel(id)} <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          )}

          <CategoryPicker
            value={pickerVal}
            onChange={addRubro}
            placeholder={info.rubros.length === 0 ? '¿En qué rubro entra tu negocio?' : 'Agregar otro rubro...'}
          />
          <p className="text-xs text-slate-400 mt-1.5">Podés agregar más de uno. Tocá un chip para quitarlo.</p>
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!valid}
        className="w-full py-4 bg-brand hover:bg-brand-dark disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-white/8 dark:disabled:text-slate-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
      >
        Continuar <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

const DEFAULT_CIUDAD = 'Bovril, Entre Ríos, Argentina';

async function detectarCiudad() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(DEFAULT_CIUDAD); return; }
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const r = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json&accept-language=es`
          );
          const d = await r.json();
          const city = d.address?.city || d.address?.town || d.address?.village || d.address?.county || '';
          const state = d.address?.state || '';
          resolve(city ? `${city}, ${state}` : DEFAULT_CIUDAD);
        } catch { resolve(DEFAULT_CIUDAD); }
      },
      () => resolve(DEFAULT_CIUDAD),
      { timeout: 5000 }
    );
  });
}

// Paso 2 — Ubicación
function StepUbicacion({ info, updateField, onNext, onBack, isDark }) {
  const [mapVisible, setMapVisible] = useState(!!(info.lat && info.lng));
  const [flyTo, setFlyTo] = useState(null);
  const [detectingCity, setDetectingCity] = useState(false);
  const valid = info.ciudad.trim().length >= 2;

  const handleCitySelect = ({ lat, lng, label }) => {
    updateField('ciudad', label);
    updateField('lat', lat);
    updateField('lng', lng);
    setFlyTo({ lat, lng });
    if (info.tieneLocal) setMapVisible(true);
  };

  const handleAddressSelect = ({ lat, lng, label }) => {
    updateField('direccion', label);
    updateField('lat', lat);
    updateField('lng', lng);
    setFlyTo({ lat, lng });
    setMapVisible(true);
  };

  const handleMapPin = ({ lat, lng }) => {
    updateField('lat', lat);
    updateField('lng', lng);
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-7">
        <p className="text-brand text-xs font-bold uppercase tracking-widest mb-2">Paso 2 · Ubicación</p>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">¿Dónde está<br />tu negocio?</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Tus clientes te van a encontrar más fácil.</p>
      </div>

      {/* Toggle local físico */}
      <button
        type="button"
        onClick={async () => {
          const next = !info.tieneLocal;
          updateField('tieneLocal', next);
          if (!next) {
            updateField('direccion', '');
            updateField('lat', null);
            updateField('lng', null);
            setMapVisible(false);
            if (!info.ciudad.trim()) {
              setDetectingCity(true);
              const ciudad = await detectarCiudad();
              updateField('ciudad', ciudad);
              setDetectingCity(false);
            }
          }
        }}
        className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 mb-5 transition-all ${
          info.tieneLocal
            ? 'border-brand bg-brand/5 dark:bg-brand/10'
            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5'
        }`}
      >
        <div className="text-left">
          <p className={`font-bold text-sm ${info.tieneLocal ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
            Tengo local físico
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            {info.tieneLocal ? 'Podés agregar dirección y marcarlo en el mapa' : 'Solo online o a domicilio'}
          </p>
        </div>
        <div className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${info.tieneLocal ? 'bg-brand' : 'bg-slate-200 dark:bg-white/15'}`}>
          <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${info.tieneLocal ? 'translate-x-5' : 'translate-x-0.5'}`} />
        </div>
      </button>

      <div className="space-y-4 mb-6">
        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">
            Ciudad *
          </label>
          {detectingCity ? (
            <div className="w-full px-4 py-3.5 bg-slate-100 border border-slate-300 rounded-2xl flex items-center gap-2 text-slate-400 text-sm dark:bg-white/5 dark:border-white/15">
              <Loader2 className="w-4 h-4 animate-spin" /> Detectando ubicación...
            </div>
          ) : (
            <PlaceAutocomplete
              value={info.ciudad}
              onChange={v => updateField('ciudad', v)}
              onSelect={handleCitySelect}
              placeholder="Ej: Córdoba, Buenos Aires..."
            />
          )}
        </div>

        {info.tieneLocal && (
          <>
            <div>
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Dirección</label>
              <PlaceAutocomplete
                value={info.direccion}
                onChange={v => updateField('direccion', v)}
                onSelect={handleAddressSelect}
                placeholder="Ej: Av. Colón 1234"
                searchSuffix={info.ciudad}
                labelParts={3}
              />
              <p className="text-xs text-slate-400 mt-1.5">Seleccioná una calle para ubicar en el mapa.</p>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pinear en el mapa</label>
                {!mapVisible && (
                  <button
                    type="button"
                    onClick={() => setMapVisible(true)}
                    className="text-xs text-brand hover:text-brand-light transition-colors flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Mostrar mapa
                  </button>
                )}
                {info.lat && <span className="text-xs text-brand font-semibold">✓ Pin guardado</span>}
              </div>
              {mapVisible && (
                <>
                  <p className="text-xs text-slate-400 mb-2">Tocá el mapa para marcar la ubicación exacta.</p>
                  <MapPicker lat={info.lat} lng={info.lng} flyTo={flyTo} onChange={handleMapPin} isDark={isDark} />
                </>
              )}
            </div>
          </>
        )}

        <div>
          <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Teléfono / WhatsApp</label>
          <input
            value={info.telefono}
            onChange={e => updateField('telefono', e.target.value)}
            placeholder="+54 9 11 1234-5678"
            type="tel"
            className="w-full px-4 py-3.5 bg-slate-100 border border-slate-300 rounded-2xl text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand transition-colors dark:bg-white/5 dark:border-white/15 dark:text-white dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!valid}
        className="w-full py-4 bg-brand hover:bg-brand-dark disabled:bg-slate-100 disabled:text-slate-400 dark:disabled:bg-white/8 dark:disabled:text-slate-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors"
      >
        Continuar <ArrowRight className="w-4 h-4" />
      </button>
      <button type="button" onClick={onNext} className="mt-2 w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm transition-colors">
        Completar después →
      </button>
    </div>
  );
}

// Paso 3 — Plan
function StepPlan({ plan, setPlan, onNext, isAdmin, acceptedTerms, setAcceptedTerms }) {
  const termsRef = React.useRef(null);
  const [shake, setShake] = React.useState(false);

  const handleNext = () => {
    if (!isAdmin && !acceptedTerms) {
      setShake(true);
      setTimeout(() => setShake(false), 600);
      termsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    onNext();
  };

  return (
    <div className="w-full max-w-sm">
      <div className="mb-7">
        <p className="text-brand text-xs font-bold uppercase tracking-widest mb-2">Paso 3 · Plan</p>
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">Elegí cómo<br />querés empezar</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Recibís 1 mes de regalo al activar.</p>
      </div>

      {isAdmin ? (
        <div className="bg-brand/10 border border-brand/30 rounded-2xl p-5 mb-6 text-center">
          <p className="text-brand font-bold text-sm">Modo administrador</p>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Vas a crear la tienda directamente sin pago.</p>
        </div>
      ) : (
        <div className="space-y-3 mb-6">
          {/* Mensual */}
          <button
            type="button"
            onClick={() => setPlan('mensual')}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all relative ${
              plan === 'mensual'
                ? 'bg-brand/5 border-brand dark:bg-white/8'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-white/3 dark:border-white/10 dark:hover:border-white/25'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Mensual</p>
                <p className="text-slate-900 dark:text-white font-black text-xl">
                  ${PRECIO_MENSUAL.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/mes</span>
                </p>
                <p className="text-brand text-xs font-semibold mt-0.5">→ 2 meses al activar</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${plan === 'mensual' ? 'bg-brand border-brand' : 'border-slate-300 dark:border-white/20'}`}>
                {plan === 'mensual' && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </button>

          {/* Anual */}
          <button
            type="button"
            onClick={() => setPlan('anual')}
            className={`w-full text-left p-5 rounded-2xl border-2 transition-all relative ${
              plan === 'anual'
                ? 'bg-brand/10 border-brand'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-white/3 dark:border-white/10 dark:hover:border-white/25'
            }`}
          >
            <div className="absolute -top-3 left-5 bg-brand text-white text-[10px] font-black px-2.5 py-1 rounded-full">AHORRÁS 20%</div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Anual</p>
                <p className="text-slate-900 dark:text-white font-black text-xl">
                  ${PRECIO_ANUAL_MES.toLocaleString()} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/mes</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500">Facturado ${PRECIO_ANUAL.toLocaleString()} · 13 meses</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${plan === 'anual' ? 'bg-brand border-brand' : 'border-slate-300 dark:border-white/20'}`}>
                {plan === 'anual' && <Check className="w-3 h-3 text-white" />}
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Términos */}
      {!isAdmin && (
        <label
          ref={termsRef}
          className={`flex items-start gap-3 mb-4 p-3 rounded-2xl cursor-pointer transition-all ${
            acceptedTerms
              ? 'bg-brand/8 border border-brand/30'
              : shake
              ? 'bg-rose-50 border border-rose-300 dark:bg-rose-500/10 dark:border-rose-500/30 animate-[shake_0.5s_ease-in-out]'
              : 'bg-slate-50 border border-slate-200 dark:bg-white/5 dark:border-white/10'
          }`}
        >
          <div className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${acceptedTerms ? 'bg-brand border-brand' : 'border-slate-300 dark:border-white/20'}`}>
            {acceptedTerms && <Check className="w-3 h-3 text-white" />}
          </div>
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={e => setAcceptedTerms(e.target.checked)}
            className="sr-only"
          />
          <span className="text-sm text-slate-600 dark:text-slate-300">
            Leí y acepto los{' '}
            <a href="/terminos-y-condiciones" className="underline text-brand" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>T&C</a>
            {', '}
            <a href="/politica-de-privacidad" className="underline text-brand" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Privacidad</a>
            {' y '}
            <a href="/condiciones-para-comercios" className="underline text-brand" target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()}>Condiciones para comercios</a>.
          </span>
        </label>
      )}

      <button
        onClick={handleNext}
        className="w-full py-4 bg-brand hover:bg-brand-dark text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-colors shadow-lg shadow-brand/25"
      >
        {isAdmin ? <><Check className="w-5 h-5" /> Crear tienda (admin)</> : <><CreditCard className="w-5 h-5" /> Ir al pago</>}
      </button>
      {!isAdmin && <p className="text-center text-slate-400 text-xs mt-2">Pago seguro con MercadoPago · Sin comisión por venta</p>}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════
export default function StoreRegisterFlow({ firebaseUser, initialPlan, isAdmin = false, isDark, toggleTheme, onTiendaCreated, onCancel }) {
  // Si viene del intent de landing, salteamos la bienvenida (ya la vieron)
  const [step, setStep] = useState(initialPlan ? 1 : 0);
  const [plan, setPlan] = useState(initialPlan || 'mensual');
  const [info, setInfo] = useState({
    nombre:     '',
    rubros:     [],
    ciudad:     '',
    direccion:  '',
    telefono:   '',
    lat:        null,
    lng:        null,
    tieneLocal: true,
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const updateField = (k, v) => setInfo(prev => ({ ...prev, [k]: v }));
  const toggleRubro = (id) =>
    setInfo(prev => ({
      ...prev,
      rubros: prev.rubros.includes(id) ? prev.rubros.filter(r => r !== id) : [...prev.rubros, id],
    }));

  const TOTAL_STEPS = 3;

  const minStep = initialPlan ? 1 : 0;
  const next = () => setStep(s => s + 1);
  const back = () => {
    if (step <= minStep) onCancel?.();
    else setStep(s => s - 1);
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        nombre:       info.nombre,
        ciudad:       info.ciudad,
        direccion:    info.tieneLocal ? info.direccion : '',
        telefono:     info.telefono,
        rubros:       info.rubros,
        lat:          info.tieneLocal ? info.lat : null,
        lng:          info.tieneLocal ? info.lng : null,
        tieneLocal:   info.tieneLocal,
        googleUid:    firebaseUser.uid,
        ownerNombre:  firebaseUser.displayName || '',
        ownerEmail:   firebaseUser.email || '',
        termsAccepted: true,
      };

      const safeJson = async (res) => {
        const text = await res.text();
        if (!text.trim()) throw new Error(`Error del servidor (${res.status}) — respuesta vacía`);
        try { return JSON.parse(text); }
        catch { throw new Error(`Error del servidor (${res.status}): ${text.slice(0, 120)}`); }
      };

      if (isAdmin) {
        const res = await apiFetch(`${API_BASE}/tiendas-crud`, {
          method: 'POST',
          authRequired: true,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, adminBypass: true }),
        });
        const data = await safeJson(res);
        if (!res.ok) throw new Error(data.error || `Error ${res.status} al crear la tienda`);
        onTiendaCreated?.(data);
        return;
      }

      const res = await apiFetch(`${API_BASE}/mp-checkout`, {
        method: 'POST',
        authRequired: true,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, tiendaInfo: payload, ...payload }),
      });
      const data = await safeJson(res);
      if (!res.ok) throw new Error(data.error || `Error ${res.status} al crear preferencia de pago`);
      window.location.href = data.initPoint || data.sandboxInitPoint;
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white dark:bg-slate-950 z-50 flex flex-col">
      {/* Header */}
      <div className="shrink-0 px-5 pt-safe pt-5 pb-4 flex items-center gap-4 border-b border-slate-100 dark:border-white/5">
        <button onClick={back} className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1">
          {step > 0 && <ProgressBar step={step - 1} total={TOTAL_STEPS} />}
        </div>
        <LogoFull size={18} />
      </div>

      {/* Contenido */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="flex flex-col items-center px-5 py-6 min-h-full">
          {step === 0 && (
            <StepBienvenida onNext={next} onCancel={onCancel} firebaseUser={firebaseUser} />
          )}
          {step === 1 && (
            <StepEsencial info={info} updateField={updateField} onNext={next} />
          )}
          {step === 2 && (
            <StepUbicacion info={info} updateField={updateField} onNext={next} onBack={back} isDark={isDark} />
          )}
          {step === 3 && (
            <>
              <StepPlan
                plan={plan}
                setPlan={setPlan}
                onNext={handleConfirm}
                isAdmin={isAdmin}
                acceptedTerms={acceptedTerms}
                setAcceptedTerms={setAcceptedTerms}
              />
              {error && (
                <div className="mt-3 w-full max-w-sm flex items-center gap-2 text-rose-600 dark:text-rose-400 text-sm bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:border-rose-500/20 rounded-xl px-4 py-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}
              {loading && (
                <div className="mt-3 flex items-center gap-2 text-brand text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isAdmin ? 'Creando tienda...' : 'Redirigiendo a MercadoPago...'}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mini-footer */}
      <div className="shrink-0 border-t border-slate-100 dark:border-white/5 px-5 py-3 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a href="/terminos-y-condiciones" target="_blank" rel="noreferrer"
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Términos
          </a>
          <a href="/politica-de-privacidad" target="_blank" rel="noreferrer"
            className="text-xs text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
            Privacidad
          </a>
        </div>
        <a href="https://www.instagram.com/katriel.martinez" target="_blank" rel="noopener"
          className="flex items-center gap-1.5 group">
          <span className="text-[10px] text-slate-400 dark:text-slate-600">Creado por</span>
          <KtrlMark className="h-2.5 opacity-40 group-hover:opacity-70 transition-opacity" />
        </a>
        {toggleTheme && (
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
            aria-label={isDark ? 'Modo claro' : 'Modo oscuro'}
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}
