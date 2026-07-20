/**
 * MapaSection — card clickeable que abre mapa full-screen con ruta OSRM
 */
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { MapPin, Navigation, X, Plus, Minus, Layers, LocateFixed, Loader2 } from 'lucide-react';
import { MapContainer, TileLayer, Marker, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FONT, RADIUS, SHADOW } from '../tokens.js';

const TILES_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILES_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILES_SAT   = `https://api.maptiler.com/maps/hybrid-v4/{z}/{x}/{y}.jpg?key=${import.meta.env.VITE_MAPTILER_KEY || ''}`;
const ATTR = '© <a href="https://osm.org/copyright" tabindex="-1">OSM</a> · © <a href="https://carto.com" tabindex="-1">CARTO</a>';
const ATTR_SAT = '© <a href="https://www.maptiler.com" tabindex="-1">MapTiler</a>';

// Feedback táctil + hover de los elementos interactivos del mapa. Los <a> y
// el <div role-less clickeable no reciben la regla global de index.css
// (solo cubre <button>/[role=button]); se replican a mano, mismo criterio
// que Contacto/OfertaIndividual.
const MAPA_CSS = `
  .mp-addr-link, .mp-thumb, .mp-cta, .mp-global-btn { -webkit-tap-highlight-color: transparent; transition: transform .16s ease, box-shadow .18s ease, filter .15s ease, border-color .18s ease; }
  @media (hover: hover) {
    .mp-addr-link:hover { border-color: var(--tp-primary) !important; }
    .mp-thumb:hover { box-shadow: 0 10px 32px rgba(0,0,0,.16); }
    .mp-thumb:hover .mp-thumb-zoom { transform: scale(1.06); }
    .mp-cta:hover { filter: brightness(1.08); }
    .mp-global-btn:hover { border-color: var(--tp-primary) !important; filter: brightness(0.985); }
  }
  .mp-addr-link:active { transform: scale(0.97); }
  .mp-thumb:active { transform: scale(0.99); }
  .mp-cta:active { transform: scale(0.93); }
  .mp-global-btn:active { transform: scale(0.95); }
  .mp-thumb-zoom { transition: transform .5s cubic-bezier(0.22,1,0.36,1); }`;

function storeIcon(nombre, logo, size = 44) {
  const radius = Math.round(size * 0.28);
  const label = (nombre || '').length > 18 ? nombre.slice(0, 16) + '…' : (nombre || '');
  const pinHtml = logo
    ? `<div style="width:${size}px;height:${size}px;border-radius:${radius}px;border:3px solid #fff;box-shadow:0 2px 14px rgba(0,0,0,.28),0 0 0 1.5px rgba(0,184,217,.5);overflow:hidden;background:#e5e5e5"><img src="${logo}" style="width:100%;height:100%;object-fit:cover;display:block"/></div>`
    : `<div style="width:${size}px;height:${size}px;background:#00B8D9;border-radius:${radius}px;border:2.5px solid #fff;box-shadow:0 2px 12px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;color:#fff;font-size:${Math.round(size*.42)}px;font-weight:800;font-family:system-ui,sans-serif">${nombre?.[0]?.toUpperCase()||'T'}</div>`;
  const W = size + 16;
  return L.divIcon({
    className: '',
    html: `
      <div style="display:flex;flex-direction:column;align-items:center;width:${W}px">
        <div style="
          background:rgba(15,23,42,0.82);color:#fff;
          border-radius:8px;padding:3px 8px;margin-bottom:5px;
          font-size:11px;font-weight:700;font-family:system-ui,sans-serif;
          white-space:nowrap;backdrop-filter:blur(6px);
          box-shadow:0 2px 8px rgba(0,0,0,.25);
          max-width:160px;overflow:hidden;text-overflow:ellipsis;
        ">${label}</div>
        ${pinHtml}
      </div>`,
    iconSize: [W, size + 28],
    iconAnchor: [W / 2, size + 28],
    popupAnchor: [0, -(size + 28)],
  });
}

function userDotIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:22px;height:22px">
      <div style="position:absolute;inset:-6px;background:rgba(0,184,217,.18);border-radius:50%;"></div>
      <div style="width:22px;height:22px;background:#00B8D9;border-radius:50%;border:2.5px solid #fff;box-shadow:0 1px 8px rgba(0,184,217,.55);"></div>
    </div>`,
    iconSize: [22, 22], iconAnchor: [11, 11],
  });
}

function FlyToPoint({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom ?? 16, { duration: 0.85, easeLinearity: 0.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function ZoomControls({ dark }) {
  const map = useMap();
  const btn = {
    width: 40, height: 40, borderRadius: 10,
    background: dark ? '#262626' : '#fff',
    border: `1px solid ${dark ? '#3a3a3a' : '#e5e5e5'}`,
    boxShadow: '0 2px 8px rgba(0,0,0,.15)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: dark ? '#f2f2f2' : '#18181b',
  };
  return (
    <div style={{ position: 'absolute', bottom: 16, right: 12, zIndex: 1000, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <button style={btn} onClick={() => map.zoomIn()}><Plus size={18} /></button>
      <button style={btn} onClick={() => map.zoomOut()}><Minus size={18} /></button>
    </div>
  );
}

export function MapaModal({ tienda, isDark, onClose }) {
  const { lat, lng, nombre, logo, direccion, ciudad } = tienda;
  const [sat, setSat] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const [locating, setLocating] = useState(false);
  const [route, setRoute] = useState(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeInfo, setRouteInfo] = useState(null); // { distancia, duracion }
  const mapRef = useRef(null);
  const dark = isDark && !sat;
  const routeKey = useRef(0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const locateUser = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = [coords.latitude, coords.longitude];
        setUserPos(pos);
        setLocating(false);
        mapRef.current?.flyTo(pos, Math.max(mapRef.current.getZoom(), 15), { duration: 0.85 });
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const calcRoute = async () => {
    const pos = userPos;
    if (!pos) {
      // pedir ubicación primero
      setLocating(true);
      navigator.geolocation?.getCurrentPosition(
        ({ coords }) => {
          const p = [coords.latitude, coords.longitude];
          setUserPos(p);
          setLocating(false);
          fetchRoute(p);
        },
        () => setLocating(false),
        { enableHighAccuracy: true, timeout: 8000 }
      );
      return;
    }
    fetchRoute(pos);
  };

  const fetchRoute = async (pos) => {
    setRouteLoading(true);
    try {
      const url = `https://router.project-osrm.org/route/v1/walking/${pos[1]},${pos[0]};${lng},${lat}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.routes?.[0]) {
        const leg = data.routes[0].legs?.[0] || {};
        const distM = leg.distance ?? data.routes[0].distance;
        routeKey.current += 1;
        setRoute({ key: routeKey.current, geojson: data.routes[0].geometry });
        setRouteInfo({
          distancia: distM >= 1000 ? `${(distM / 1000).toFixed(1)} km` : `${Math.round(distM)} m`,
          duracion: `${Math.ceil((leg.duration ?? data.routes[0].duration) / 60)} min`,
        });
        // Fit bounds
        if (mapRef.current && data.routes[0].geometry?.coordinates?.length) {
          const coords = data.routes[0].geometry.coordinates.map(([x, y]) => [y, x]);
          mapRef.current.fitBounds(L.latLngBounds(coords), { padding: [40, 40] });
        }
      }
    } catch { /* OSRM timeout */ }
    setRouteLoading(false);
  };

  const icon = storeIcon(nombre, logo, 48);

  const btnStyle = (active) => ({
    width: 40, height: 40, borderRadius: 10, border: 'none',
    background: active ? 'var(--tp-primary, #00B8D9)' : (isDark ? '#3a3a3a' : '#f0f0f0'),
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', color: active ? 'var(--tp-on-primary, #fff)' : (isDark ? '#f2f2f2' : '#18181b'),
    flexShrink: 0, transition: 'transform .12s cubic-bezier(0.34,1.56,0.64,1), background-color .15s ease',
  });

  // Portal a <body>: así el mapa full-screen nunca queda atrapado en el
  // stacking context / overflow del contenedor que lo monta (el .cm-scroll
  // de commerce-modern, o el scroll de OfertaIndividual) y SIEMPRE tapa el
  // TiendaNavBar — patrón inmersivo nativo, consistente venga de donde venga.
  return createPortal(
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: isDark ? '#18181b' : '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px',
        background: isDark ? '#262626' : '#fff',
        borderBottom: `1px solid ${isDark ? '#3a3a3a' : '#e5e5e5'}`,
        flexShrink: 0,
      }}>
        <button onClick={onClose} style={btnStyle(false)}><X size={18} /></button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: FONT.family, fontWeight: FONT.weight.bold, fontSize: FONT.size.base, color: isDark ? '#f2f2f2' : '#18181b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</p>
          {(direccion || ciudad) && (
            <p style={{ fontFamily: FONT.family, fontSize: FONT.size.xs, color: isDark ? '#a3a3a3' : '#6b6b6b', margin: '1px 0 0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {[direccion, ciudad].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
        <button onClick={() => setSat(s => !s)} style={btnStyle(sat)}><Layers size={16} /></button>
        <button onClick={locateUser} style={btnStyle(!!userPos)} disabled={locating}>
          {locating ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <LocateFixed size={16} />}
        </button>
      </div>

      {/* Mapa */}
      <div style={{ flex: 1, position: 'relative' }}>
        <MapContainer
          ref={mapRef}
          key={`modal-${lat},${lng}`}
          center={[lat, lng]}
          zoom={16}
          maxZoom={21}
          style={{ width: '100%', height: '100%' }}
          zoomControl={false}
          attributionControl={false}
        >
          {sat
            ? <TileLayer url={TILES_SAT} attribution={ATTR_SAT} tileSize={512} zoomOffset={-1} maxZoom={21} />
            : <TileLayer url={dark ? TILES_DARK : TILES_LIGHT} attribution={ATTR} />
          }

          {/* Ruta OSRM */}
          {route && <>
            <GeoJSON key={`${route.key}-bg`} data={route.geojson}
              style={{ color: '#fff', weight: 9, opacity: 0.55, lineCap: 'round', lineJoin: 'round' }} />
            <GeoJSON key={route.key} data={route.geojson}
              style={{ color: '#22c55e', weight: 4, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }} />
          </>}

          {/* Pin usuario */}
          {userPos && <Marker position={userPos} icon={userDotIcon()} />}

          {/* Pin tienda */}
          <Marker position={[lat, lng]} icon={icon} />

          <ZoomControls dark={isDark} />
        </MapContainer>

      </div>

      {/* Footer — card tienda + acción */}
      <div style={{ padding: '12px 16px', flexShrink: 0, background: isDark ? '#262626' : '#fff', borderTop: `1px solid ${isDark ? '#3a3a3a' : '#e5e5e5'}` }}>
        {routeInfo ? (
          /* Modo ruta activa: info en línea + cancelar */
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, background: isDark ? 'rgba(34,197,94,.15)' : '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Navigation size={20} style={{ color: '#22c55e' }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: FONT.family, fontWeight: FONT.weight.bold, fontSize: FONT.size.sm, color: isDark ? '#f2f2f2' : '#18181b' }}>
                {routeInfo.duracion} caminando
              </p>
              <p style={{ margin: '1px 0 0', fontFamily: FONT.family, fontSize: FONT.size.xs, color: isDark ? '#a3a3a3' : '#6b6b6b' }}>{routeInfo.distancia}</p>
            </div>
            <button
              onClick={() => { setRoute(null); setRouteInfo(null); }}
              style={{ width: 44, height: 44, borderRadius: 13, border: 'none', background: isDark ? '#3a3a3a' : '#f0f0f0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: isDark ? '#a3a3a3' : '#6b6b6b', flexShrink: 0 }}
            >
              <X size={16} />
            </button>
          </div>
        ) : (
          /* Modo normal: card tienda + botón */
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 44, height: 44, borderRadius: 13, flexShrink: 0, overflow: 'hidden', background: 'var(--tp-primary-soft, #e0f7fb)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {logo
                ? <img src={logo} alt={nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <span style={{ fontSize: 18, fontWeight: 800, color: 'var(--tp-primary, #00B8D9)', fontFamily: FONT.family }}>{nombre?.[0]?.toUpperCase() || 'T'}</span>
              }
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontFamily: FONT.family, fontWeight: FONT.weight.bold, fontSize: FONT.size.sm, color: isDark ? '#f2f2f2' : '#18181b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{nombre}</p>
              {(direccion || ciudad) && <p style={{ margin: '2px 0 0', fontFamily: FONT.family, fontSize: FONT.size.xs, color: isDark ? '#a3a3a3' : '#6b6b6b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{[direccion, ciudad].filter(Boolean).join(', ')}</p>}
            </div>
            <button
              onClick={calcRoute}
              disabled={routeLoading}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 44, border: 'none', cursor: routeLoading ? 'default' : 'pointer', background: 'var(--tp-primary, #00B8D9)', color: 'var(--tp-on-primary, #fff)', borderRadius: 13, fontFamily: FONT.family, fontWeight: FONT.weight.bold, fontSize: FONT.size.xs, flexShrink: 0, opacity: routeLoading ? 0.8 : 1 }}>
              {routeLoading
                ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                : <Navigation size={14} />
              }
              {routeLoading ? 'Calculando...' : 'Cómo llegar'}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

// modalAbierto/onAbrirMapa/onCerrarMapa son opcionales: si vienen (el
// template padre controla el modal para compartirlo con el chip de
// dirección del hero, ver commerce-modern.jsx), se usan tal cual — si no
// vienen, MapaSection mantiene su propio estado interno como siempre.
export function MapaSection({ tienda, isDark = false, onVerEnMapaGlobal, modalAbierto, onAbrirMapa, onCerrarMapa }) {
  const { lat, lng, nombre, logo, direccion, ciudad } = tienda;
  const [showModalLocal, setShowModalLocal] = useState(false);
  const controlado = modalAbierto !== undefined;
  const showModal = controlado ? modalAbierto : showModalLocal;
  const abrirModal = controlado ? onAbrirMapa : () => setShowModalLocal(true);
  const cerrarModal = controlado ? onCerrarMapa : () => setShowModalLocal(false);

  const navUrl = lat && lng
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/search/${encodeURIComponent([direccion, ciudad].filter(Boolean).join(', '))}`;

  if (!lat || !lng) {
    if (!direccion) return null;
    return (
      <section style={{ padding: '2rem 1.25rem' }}>
        <style>{MAPA_CSS}</style>
        <h2 style={{ fontFamily: FONT.family, fontSize: FONT.size.xl, fontWeight: FONT.weight.black, color: 'var(--tp-text)', margin: '0 0 .75rem' }}>Ubicación</h2>
        <a href={navUrl} target="_blank" rel="noopener noreferrer" className="mp-addr-link"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--tp-surface)', border: '1px solid var(--tp-border)', borderRadius: RADIUS.xl, boxShadow: SHADOW.sm }}>
          <div style={{ width: 44, height: 44, borderRadius: RADIUS.lg, background: 'var(--tp-primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={22} style={{ color: 'var(--tp-primary)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontFamily: FONT.family, fontWeight: FONT.weight.bold, fontSize: FONT.size.base, color: 'var(--tp-text)', margin: 0 }}>{direccion}</p>
            {ciudad && <p style={{ fontFamily: FONT.family, fontSize: FONT.size.sm, color: 'var(--tp-text-muted)', margin: '2px 0 0' }}>{ciudad}</p>}
          </div>
          <Navigation size={16} style={{ color: 'var(--tp-text-muted)', flexShrink: 0 }} />
        </a>
      </section>
    );
  }

  const thumbIcon = storeIcon(nombre, logo, 36);

  return (
    <section style={{ padding: '2rem 1.25rem' }}>
      <style>{MAPA_CSS}</style>
      <h2 style={{ fontFamily: FONT.family, fontSize: FONT.size.xl, fontWeight: FONT.weight.black, color: 'var(--tp-text)', margin: '0 0 .75rem' }}>Ubicación</h2>

      {(direccion || ciudad) && (
        <p style={{ fontFamily: FONT.family, fontSize: FONT.size.sm, color: 'var(--tp-text-muted)', margin: '0 0 .75rem', display: 'flex', alignItems: 'center', gap: 5 }}>
          <MapPin size={13} style={{ color: 'var(--tp-primary)', flexShrink: 0 }} />
          {[direccion, ciudad].filter(Boolean).join(', ')}
        </p>
      )}

      {/* Click-through al mapa global de LOKAL (todas las tiendas) — solo
          en modo plataforma, cuando la prop viene definida. */}
      {onVerEnMapaGlobal && (
        <button onClick={onVerEnMapaGlobal} className="no-press mp-global-btn"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12, padding: '7px 12px', borderRadius: RADIUS.md, border: '1px solid var(--tp-border)', background: 'var(--tp-surface)', color: 'var(--tp-text)', fontFamily: FONT.family, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold, cursor: 'pointer' }}>
          <MapPin size={13} style={{ color: 'var(--tp-primary)' }} />
          Ver en el mapa de LOKAL
        </button>
      )}

      {/* Thumbnail clickeable */}
      <div
        onClick={abrirModal}
        style={{ borderRadius: RADIUS.xl, overflow: 'hidden', boxShadow: SHADOW.md, border: '1px solid var(--tp-border)', cursor: 'pointer', position: 'relative' }}
      >
        <MapContainer
          key={`thumb-${lat},${lng}`}
          center={[lat, lng]}
          zoom={15}
          style={{ width: '100%', height: '180px', pointerEvents: 'none' }}
          zoomControl={false}
          attributionControl={false}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
        >
          <TileLayer url={isDark ? TILES_DARK : TILES_LIGHT} attribution={ATTR} />
          <Marker position={[lat, lng]} icon={thumbIcon} />
        </MapContainer>

        {/* Chip "Ver en mapa" — bottom left */}
        <div style={{ position: 'absolute', bottom: 10, left: 10, pointerEvents: 'none' }}>
          <div style={{
            background: 'rgba(0,0,0,0.55)', color: '#fff',
            borderRadius: 20, padding: '5px 12px 5px 5px',
            fontFamily: FONT.family, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold,
            display: 'flex', alignItems: 'center', gap: 7,
            backdropFilter: 'blur(6px)',
          }}>
            {logo
              ? <img src={logo} alt={nombre} style={{ width: 22, height: 22, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
              : <div style={{ width: 22, height: 22, borderRadius: 6, background: '#00B8D9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 10, fontWeight: 800, flexShrink: 0 }}>{nombre?.[0]?.toUpperCase() || 'T'}</div>
            }
            Ver en mapa
          </div>
        </div>

        {/* Chip "Cómo llegar" — top right */}
        <a
          href={navUrl} target="_blank" rel="noopener noreferrer"
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute', top: 10, right: 10,
            background: 'var(--tp-primary, #00B8D9)', color: '#fff',
            borderRadius: 20, padding: '5px 10px',
            fontFamily: FONT.family, fontSize: FONT.size.xs, fontWeight: FONT.weight.bold,
            display: 'flex', alignItems: 'center', gap: 5,
            textDecoration: 'none',
            boxShadow: '0 2px 8px rgba(0,0,0,.25)',
          }}
        >
          <Navigation size={12} />
          Cómo llegar
        </a>
      </div>

      {showModal && (
        <MapaModal tienda={tienda} isDark={isDark} onClose={cerrarModal} />
      )}
    </section>
  );
}
