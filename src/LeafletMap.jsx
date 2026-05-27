import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, GeoJSON, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// CartoDB: minimalistas, sin API key
const TILES_LIGHT = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
const TILES_DARK  = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const MT_KEY      = import.meta.env.VITE_MAPTILER_KEY || '';
const TILES_SAT   = `https://api.maptiler.com/maps/hybrid-v4/{z}/{x}/{y}.jpg?key=${MT_KEY}`;
const ATTR = '© <a href="https://osm.org/copyright" tabindex="-1">OSM</a> · © <a href="https://carto.com" tabindex="-1">CARTO</a>';
const ATTR_SAT = '© <a href="https://www.maptiler.com" tabindex="-1">MapTiler</a> © <a href="https://osm.org/copyright" tabindex="-1">OSM</a>';

// ─── Pin circular con inicial ─────────────────────────────────────────────────
function dotIcon(color, letter, size) {
  const fs = Math.round(size * 0.42);
  return L.divIcon({
    className: '',
    html: `<div style="
      width:${size}px;height:${size}px;
      background:${color};
      border-radius:50%;
      border:2.5px solid #fff;
      box-shadow:0 2px 12px rgba(0,0,0,.22),0 0 0 1px rgba(0,0,0,.06);
      display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:${fs}px;font-weight:800;
      font-family:system-ui,-apple-system,sans-serif;
      letter-spacing:-0.3px;
      transition:all .15s ease;
    ">${letter}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 8)],
  });
}

// ─── Pin con foto de producto ─────────────────────────────────────────────────
function photoIcon(imgUrl, size = 48, badge = 0) {
  const badgeHtml = badge > 0 ? `<div style="
    position:absolute;top:-4px;right:-4px;
    background:#00B8D9;color:#fff;
    border-radius:10px;padding:1px 5px;
    font-size:10px;font-weight:800;
    font-family:system-ui,-apple-system,sans-serif;
    border:2px solid #fff;
    line-height:1.4;
    box-shadow:0 1px 4px rgba(0,0,0,.2);
    white-space:nowrap;
  ">${badge}</div>` : '';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
      <div style="
        width:${size}px;height:${size}px;
        border-radius:12px;
        border:3px solid #fff;
        box-shadow:0 2px 14px rgba(0,0,0,.28),0 0 0 1.5px rgba(0,184,217,.5);
        overflow:hidden;
        background:#e2e8f0;
      "><img src="${imgUrl}" style="width:100%;height:100%;object-fit:cover;display:block" /></div>
      ${badgeHtml}
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 8)],
  });
}

// ─── Pin circular con badge de ofertas ────────────────────────────────────────
function dotIconWithBadge(color, letter, size, badge = 0) {
  const fs = Math.round(size * 0.42);
  const badgeHtml = badge > 0 ? `<div style="
    position:absolute;top:-4px;right:-4px;
    background:#00B8D9;color:#fff;
    border-radius:10px;padding:1px 5px;
    font-size:10px;font-weight:800;
    font-family:system-ui,-apple-system,sans-serif;
    border:2px solid #fff;line-height:1.4;
    box-shadow:0 1px 4px rgba(0,0,0,.2);
  ">${badge}</div>` : '';
  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${size}px;height:${size}px;">
      <div style="
        width:${size}px;height:${size}px;
        background:${color};border-radius:50%;
        border:2.5px solid #fff;
        box-shadow:0 2px 12px rgba(0,0,0,.22),0 0 0 1px rgba(0,0,0,.06);
        display:flex;align-items:center;justify-content:center;
        color:#fff;font-size:${fs}px;font-weight:800;
        font-family:system-ui,-apple-system,sans-serif;
      ">${letter}</div>
      ${badgeHtml}
    </div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 8)],
  });
}

// ─── Pin de ubicación del usuario ─────────────────────────────────────────────
function userDotIcon(pinned = false) {
  if (pinned) {
    return L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:30px;height:30px">
          <div style="
            width:30px;height:30px;
            background:var(--ok-hex);
            border-radius:50%;
            border:2.5px solid #fff;
            box-shadow:0 2px 10px rgba(34,197,94,0.55);
            display:flex;align-items:center;justify-content:center;
          ">
            <svg xmlns='http://www.w3.org/2000/svg' width='13' height='13' viewBox='0 0 24 24'
              fill='none' stroke='#fff' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'>
              <line x1='12' y1='17' x2='12' y2='22'/>
              <path d='M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z'/>
            </svg>
          </div>
        </div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
  }
  return L.divIcon({
    className: '',
    html: `
      <div style="position:relative;width:22px;height:22px">
        <div class="lokal-user-pulse" style="
          position:absolute;inset:-6px;
          background:rgba(0,184,217,.18);
          border-radius:50%;
        "></div>
        <div style="
          width:22px;height:22px;
          background:var(--primary-hex);
          border-radius:50%;
          border:2.5px solid #fff;
          box-shadow:0 1px 8px rgba(var(--primary),0.55);
        "></div>
      </div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

// ─── Componente interno: vuela a coordenadas al montar ────────────────────────
// yOffset: píxeles positivos = mover pin hacia arriba (compensar bottom sheet)
function FlyTo({ center, zoom, yOffset = 0 }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    const targetZoom = zoom != null ? Math.max(map.getZoom(), zoom) : Math.max(map.getZoom(), 16);
    let dest = center;
    if (yOffset) {
      // Proyectar centro al espacio de píxeles, aplicar offset, volver a lat/lng
      const pt = map.project(center, targetZoom).add([0, yOffset]);
      dest = map.unproject(pt, targetZoom);
    }
    map.flyTo(dest, targetZoom, { duration: 0.85, easeLinearity: 0.2 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // solo al montar — key={flyTo.key} controla cuándo reflyar
  return null;
}

function DraggableLocationPin({ position, onChange }) {
  return (
    <Marker
      draggable
      position={position}
      icon={dotIcon('#00B8D9', 'U', 34)}
      eventHandlers={{
        dragend: (e) => {
          const { lat, lng } = e.target.getLatLng();
          onChange?.([lat, lng]);
        },
      }}
    />
  );
}

function ClickToMove({ onChange }) {
  useMapEvents({
    click(e) {
      onChange?.([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// ─── Mapa embebido en perfil de tienda ────────────────────────────────────────
export function StoreMap({ lat, lng, nombre, direccion, logo, dark = false }) {
  const icon = logo
    ? photoIcon(logo, 48, 0)
    : dotIconWithBadge('#00B8D9', nombre?.[0]?.toUpperCase() || 'T', 36, 0);
  return (
    <MapContainer
      key={`${lat},${lng}`}
      center={[lat, lng]}
      zoom={16}
      className="lokal-map-compact"
      style={{ width: '100%', height: '200px' }}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom={false}
      dragging={false}
      doubleClickZoom={false}
    >
      <TileLayer url={dark ? TILES_DARK : TILES_LIGHT} attribution={ATTR} />
      <Marker position={[lat, lng]} icon={icon}>
        <Tooltip direction="top" offset={[0, -28]} opacity={0.97} permanent={false}>
          <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontWeight: 700, fontSize: 12 }}>
            {nombre}{direccion ? ` · ${direccion}` : ''}
          </span>
        </Tooltip>
      </Marker>
    </MapContainer>
  );
}

// ─── Clustering interno ───────────────────────────────────────────────────────
const CLUSTER_ZOOM_THRESHOLD = 13; // zoom < esto → agrupar
const CLUSTER_PIXEL_RADIUS   = 60; // px — distancia mínima para fusionar dos pins

function clusterTiendas(tiendas, map) {
  if (!map) return tiendas.map(t => ({ type: 'single', tienda: t }));
  const zoom = map.getZoom();
  if (zoom >= CLUSTER_ZOOM_THRESHOLD) return tiendas.map(t => ({ type: 'single', tienda: t }));

  const used = new Set();
  const groups = [];

  for (let i = 0; i < tiendas.length; i++) {
    if (used.has(i)) continue;
    const a = tiendas[i];
    const pa = map.latLngToContainerPoint([a.lat, a.lng]);
    const members = [a];
    used.add(i);

    for (let j = i + 1; j < tiendas.length; j++) {
      if (used.has(j)) continue;
      const b = tiendas[j];
      const pb = map.latLngToContainerPoint([b.lat, b.lng]);
      const dx = pa.x - pb.x, dy = pa.y - pb.y;
      if (Math.sqrt(dx * dx + dy * dy) < CLUSTER_PIXEL_RADIUS) {
        members.push(b);
        used.add(j);
      }
    }

    if (members.length === 1) {
      groups.push({ type: 'single', tienda: members[0] });
    } else {
      const avgLat = members.reduce((s, t) => s + t.lat, 0) / members.length;
      const avgLng = members.reduce((s, t) => s + t.lng, 0) / members.length;
      groups.push({ type: 'cluster', tiendas: members, lat: avgLat, lng: avgLng });
    }
  }

  return groups;
}

function clusterIcon(members) {
  const MAX_CIRCLES = 4;
  const shown = members.slice(0, MAX_CIRCLES);
  const extra = members.length - MAX_CIRCLES;
  const circleSize = 38;
  const overlap = 14; // px que se solapan
  const totalW = circleSize + (shown.length - 1) * (circleSize - overlap) + (extra > 0 ? 28 : 0);
  const totalH = circleSize;

  const circles = shown.map((t, idx) => {
    const img = t.logo || t.galeria?.[0] || t.fotos?.[0];
    const left = idx * (circleSize - overlap);
    const zIndex = shown.length - idx;
    if (img) {
      return `<div style="position:absolute;left:${left}px;top:0;z-index:${zIndex};
        width:${circleSize}px;height:${circleSize}px;border-radius:50%;
        border:2.5px solid #fff;box-shadow:0 1px 8px rgba(0,0,0,.25);
        overflow:hidden;background:#e2e8f0">
        <img src="${img}" style="width:100%;height:100%;object-fit:cover;display:block"/>
      </div>`;
    }
    const letter = t.nombre?.[0]?.toUpperCase() || 'T';
    return `<div style="position:absolute;left:${left}px;top:0;z-index:${zIndex};
      width:${circleSize}px;height:${circleSize}px;border-radius:50%;
      border:2.5px solid #fff;box-shadow:0 1px 8px rgba(0,0,0,.25);
      background:var(--ok-hex);display:flex;align-items:center;justify-content:center;
      color:#fff;font-size:15px;font-weight:800;font-family:system-ui,sans-serif">
      ${letter}
    </div>`;
  }).join('');

  const counterHtml = extra > 0
    ? `<div style="position:absolute;left:${shown.length * (circleSize - overlap)}px;top:50%;
        transform:translateY(-50%);
        background:rgba(0,0,0,.65);color:#fff;border-radius:12px;
        font-size:11px;font-weight:800;font-family:system-ui,sans-serif;
        padding:3px 7px;white-space:nowrap;backdrop-filter:blur(4px)">+${extra}</div>`
    : '';

  return L.divIcon({
    className: '',
    html: `<div style="position:relative;width:${totalW}px;height:${totalH}px">${circles}${counterHtml}</div>`,
    iconSize: [totalW, totalH],
    iconAnchor: [totalW / 2, totalH / 2],
    popupAnchor: [0, -(totalH / 2 + 8)],
  });
}

// ─── Mapa completo con múltiples tiendas ──────────────────────────────────────
export function TiendasMap({ tiendas = [], selectedId, onSelect, userPos, pinnedUser = false, flyTo, route, dark = false, sat = false, mapRef, initialCenter, focusProduct = null, ofertas = [], ofertaCounts = {}, onSelectOferta }) {
  const defaultCenter = initialCenter || userPos || [-31.42, -64.19];

  return (
    <MapContainer
      ref={mapRef}
      center={defaultCenter}
      zoom={14}
      maxZoom={21}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      {sat
        ? <TileLayer url={TILES_SAT} attribution={ATTR_SAT} tileSize={512} zoomOffset={-1} maxZoom={21} />
        : <TileLayer url={dark ? TILES_DARK : TILES_LIGHT} attribution={ATTR} />
      }

      {/* Fly to coordenadas cuando cambia flyTo (key provoca remount) */}
      {flyTo && <FlyTo key={flyTo.key} center={[flyTo.lat, flyTo.lng]} zoom={flyTo.zoom ?? 16} yOffset={flyTo.yOffset ?? 0} />}

      {/* Ruta peatonal (OSRM GeoJSON) — dos capas: fondo blanco + línea emerald */}
      {route && <>
        <GeoJSON key={`${route.key}-bg`} data={route.geojson}
          style={{ color: '#fff', weight: 9, opacity: 0.55, lineCap: 'round', lineJoin: 'round' }} />
        <GeoJSON key={route.key} data={route.geojson}
          style={{ color: 'var(--ok-hex)', weight: 4, opacity: 0.95, lineCap: 'round', lineJoin: 'round' }} />
      </>}

      {/* Pin de ubicación propia */}
      {userPos && <Marker position={userPos} icon={userDotIcon(pinnedUser)} />}

      {/* Pins de tiendas — con clustering en zoom bajo */}
      <TiendasPins
        tiendas={tiendas}
        selectedId={selectedId}
        onSelect={onSelect}
        focusProduct={focusProduct}
        ofertas={ofertas}
        ofertaCounts={ofertaCounts}
        onSelectOferta={onSelectOferta}
      />
    </MapContainer>
  );
}

function TiendasPins({ tiendas, selectedId, onSelect, focusProduct, ofertas = [], ofertaCounts = {} }) {
  const map = useMap();
  const [, forceUpdate] = useState(0);
  const iconCache = React.useRef({});

  // Re-clustear solo los pins, sin tocar MapContainer
  useMapEvents({
    zoomend: () => forceUpdate(n => n + 1),
    moveend: () => forceUpdate(n => n + 1),
  });

  // ofertaCounts viene calculado en App desde visibleOfertas (sin filtro de fotos)
  // ofertasByTienda es fallback local por si no viene el prop
  const ofertasByTienda = React.useMemo(() => {
    if (Object.keys(ofertaCounts).length > 0) return ofertaCounts;
    const m = {};
    ofertas.forEach(o => { if (o.tiendaId) m[o.tiendaId] = (m[o.tiendaId] || 0) + 1; });
    return m;
  }, [ofertas, ofertaCounts]);

  const groups = clusterTiendas(
    tiendas.filter(t => t.lat && t.lng),
    map
  );

  return groups.map((group, idx) => {
    if (group.type === 'cluster') {
      const { lat, lng, tiendas: members } = group;
      return (
        <Marker
          key={`cluster-${idx}`}
          position={[lat, lng]}
          icon={clusterIcon(members)}
          eventHandlers={{
            click: () => {
              const bounds = L.latLngBounds(members.map(t => [t.lat, t.lng]));
              map.flyToBounds(bounds, { paddingTopLeft: [60, 80], paddingBottomRight: [60, 200], duration: 0.9, easeLinearity: 0.2 });
            },
          }}
        >
          <Tooltip direction="top" offset={[0, -24]} opacity={0.97}>
            <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontWeight: 700, fontSize: 12 }}>
              {members.length} tiendas
            </span>
          </Tooltip>
        </Marker>
      );
    }

    const t = group.tienda;
    const isSelected = t.id === selectedId;
    const hasFocusProduct = focusProduct && focusProduct.tiendaId === t.id;
    const productImg = hasFocusProduct && (focusProduct.galeria?.[0] || focusProduct.fotos?.[0]);
    const storeImg = t.logo || t.galeria?.[0] || t.fotos?.[0];
    const badge = isSelected ? 0 : (ofertasByTienda[t.id] || 0);

    // Cache icon by stable key to avoid setIcon flicker on every re-render
    const iconKey = `${t.id}|${isSelected}|${badge}|${productImg || storeImg || ''}`;
    if (!iconCache.current[iconKey]) {
      iconCache.current[iconKey] = productImg
        ? photoIcon(productImg, isSelected ? 52 : 44, 0)
        : storeImg
          ? photoIcon(storeImg, isSelected ? 48 : 40, badge)
          : dotIconWithBadge(isSelected ? '#00B8D9' : 'var(--ok-hex)', t.nombre?.[0]?.toUpperCase() || 'T', isSelected ? 36 : 28, badge);
    }
    const icon = iconCache.current[iconKey];

    return (
      <Marker
        key={t.id}
        position={[t.lat, t.lng]}
        icon={icon}
        eventHandlers={{ click: () => onSelect?.(t) }}
      >
        <Tooltip direction="top" offset={[0, -20]} opacity={0.97}>
          <span style={{ fontFamily: 'system-ui,-apple-system,sans-serif', fontWeight: 700, fontSize: 12 }}>
            {t.nombre}
            {hasFocusProduct && ` · $${Number(focusProduct.precio).toLocaleString()}`}
          </span>
        </Tooltip>
      </Marker>
    );
  });
}

export function LocationPreviewMap({ position, dark = false, onChange }) {
  const initialCenter = position || [-31.42, -64.19];

  return (
    <MapContainer
      center={initialCenter}
      zoom={16}
      style={{ width: '100%', height: '100%' }}
      zoomControl={false}
      attributionControl={false}
      scrollWheelZoom
    >
      <TileLayer url={dark ? TILES_DARK : TILES_LIGHT} attribution={ATTR} />
      {/* Sin FlyTo — el mapa arranca centrado y no persigue el pin */}
      <ClickToMove onChange={onChange} />
      <DraggableLocationPin position={position || initialCenter} onChange={onChange} />
    </MapContainer>
  );
}

