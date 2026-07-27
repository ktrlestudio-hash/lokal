import React from 'react';

// ── Primitivos ────────────────────────────────────────────────────────────────
// Bone ya NO anima por sí solo (antes cada hueso tenía su propio
// skeleton-shimmer con background-position propio) — con varios huesos
// chicos por card (ícono, texto, botones), cada uno recorriendo su propio
// shimmer en su propio ancho se veía fragmentado: parpadeos sueltos e
// incoherentes entre sí, no una sola onda de luz. Ahora Bone es solo el
// color base; la animación vive UNA vez por card entera (ver SkeletonCard).
function Bone({ w = '100%', h = 14, r = 8, className = '', style = {} }) {
  return (
    <div
      className={`bg-surface-card-2 dark:bg-white/8 ${className}`}
      style={{ width: w, height: h, borderRadius: r, flexShrink: 0, ...style }}
    />
  );
}

function Row({ children, gap = 8, style = {} }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap, ...style }}>{children}</div>;
}

function Col({ children, gap = 8, style = {} }) {
  return <div style={{ display: 'flex', flexDirection: 'column', gap, ...style }}>{children}</div>;
}

// Envuelve una card de skeleton completa con UN SOLO shimmer que la recorre
// entera (imagen + textos + botones juntos) — patrón estándar (LinkedIn,
// Facebook): una sola onda de luz coherente, no una animación por hueso.
function SkeletonCard({ children, className = '', style = {} }) {
  return (
    <div className={`skeleton-shimmer-card ${className}`} style={{ position: 'relative', overflow: 'hidden', ...style }}>
      {children}
    </div>
  );
}

// ── Skeleton: Grid de productos (StoreApp - ProductosScreen/OfertaCard) ───────
// Calcado EXACTO de OfertaCard (StoreApp.jsx): foto aspect-[1/1.414] (no
// cuadrada — antes era aspectRatio:1, la card real cambió a la proporción
// del catálogo público y el skeleton quedó desactualizado), 1 sola línea de
// nombre (la fecha se sacó del bloque de texto — ahora es un badge flotante
// sobre la foto, no ocupa una línea de texto propia), y la fila de 3
// ACCIONES en grid-cols-3 con la MISMA silueta que los botones reales
// (ícono cuadrado arriba + label chico abajo, 3 columnas iguales) — antes
// era "1 botón ancho + 2 cuadraditos", que ya no representa cómo se ven los
// botones reales tras el rediseño (3 columnas iguales, ícono+texto).
export function SkeletonProductosGrid({ cols = 2, count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, padding: '4px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8">
          <div className="bg-surface-card-2 dark:bg-white/8" style={{ aspectRatio: '1 / 1.414' }} />
          <div style={{ padding: 10 }}>
            <Col gap={8}>
              {/* Centrado (margin auto) — calca o.nombre real, que ahora
                  también está centrado (text-center) en OfertaCard. */}
              <Bone w="80%" h={12} style={{ marginBottom: 2, marginLeft: 'auto', marginRight: 'auto' }} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {Array.from({ length: 3 }).map((_, j) => (
                  <Bone key={j} w="100%" h={40} r={12} />
                ))}
              </div>
            </Col>
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

// ── Skeleton: Lista de productos (StoreApp - ProductosScreen vista lista) ──────
export function SkeletonProductosList({ count = 5 }) {
  return (
    <Col gap={8} style={{ padding: '4px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 flex">
          <div className="bg-surface-card-2 dark:bg-white/8" style={{ width: 96, flexShrink: 0 }} />
          <div style={{ flex: 1, padding: 12 }}>
            <Col gap={7}>
              <Bone w="70%" h={13} />
              <Bone w="40%" h={11} />
              <Row gap={6} style={{ marginTop: 4 }}>
                <Bone w="35%" h={16} />
                <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                  <Bone w={28} h={28} r={10} />
                  <Bone w={28} h={28} r={10} />
                  <Bone w={28} h={28} r={10} />
                </div>
              </Row>
            </Col>
          </div>
        </SkeletonCard>
      ))}
    </Col>
  );
}

// ── Skeleton: Mensajes / Inbox (StoreApp & App) ───────────────────────────────
// El thread real (StoreApp.jsx, visibleThreads.map) tiene 3 FILAS de texto —
// título / chip-tipo+subtítulo / último mensaje —, avatar de 48px (w-12) y
// padding py-3.5/px-4. El skeleton anterior solo reservaba 2 filas y un
// avatar de 44px: más bajo que el thread real, saltaba hacia abajo al
// cargar. Ahora las 3 filas + medidas de avatar/padding calzan exacto.
export function SkeletonInbox({ count = 6 }) {
  return (
    <Col gap={0}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} className="border-b border-slate-100 dark:border-white/8" style={{ padding: '14px 16px' }}>
          <Row gap={12} style={{ alignItems: 'flex-start' }}>
            <Bone w={48} h={48} r={16} />
            <Col gap={6} style={{ flex: 1, marginTop: 1 }}>
              <Bone w="55%" h={13} />
              <Row gap={6}>
                <Bone w="18%" h={10} r={4} />
                <Bone w="35%" h={10} />
              </Row>
              <Bone w="70%" h={11} />
            </Col>
          </Row>
        </SkeletonCard>
      ))}
    </Col>
  );
}

// ── Skeleton: Ofertas / Marketplace (HomeScreen — "Destacados cerca tuyo") ────
// Carrusel HORIZONTAL, no grid: el contenido real que reemplaza a este
// skeleton es ProductCardVertical en fila con scroll-x (ver HomeScreen.jsx),
// no una cuadrícula 2 columnas. Antes el skeleton usaba grid — al terminar
// de cargar, la sección entera cambiaba de FORMA (de 2x2 a fila scrolleable),
// no solo de contenido, generando un salto de layout visible además del
// habitual "aparece contenido real". Mismas medidas exactas que
// ProductCardVertical (CM_VERT_W/CM_VERT_IMG/CM_VERT_BODY en
// tienda-publica/components/ProductCards.jsx) para que el alto total no
// cambie ni un px entre skeleton y card real.
// ── Skeleton: Tiendas cerca tuyo (HomeScreen) ─────────────────────────────────
// Antes esta sección no tenía NINGÚN skeleton — mientras loadingOfertas
// (mismo fetch que trae ofertas+tiendas juntos, ver StoreApp.jsx línea ~431)
// estaba en true, filteredTiendas venía vacío y la sección quedaba
// invisible sin más, apareciendo de golpe al llegar los datos. Mismo
// carrusel horizontal, misma card w-52 (208px) + p-4 (16px) que la real.
export function SkeletonTiendas({ count = 4 }) {
  return (
    <div style={{ display: 'flex', gap: 12, overflow: 'hidden', paddingLeft: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={{ width: 208, flexShrink: 0, padding: 16, borderRadius: 20 }} className="bg-surface-card">
          <Row gap={10} style={{ marginBottom: 10 }}>
            <Bone w={40} h={40} r={12} />
            <Col gap={4} style={{ flex: 1 }}>
              <Bone w="80%" h={13} />
              <Bone w="55%" h={10} />
            </Col>
          </Row>
          <Bone w="35%" h={12} style={{ marginBottom: 8 }} />
          <Row gap={8}>
            <Bone w="40%" h={11} />
            <Bone w="30%" h={11} style={{ marginLeft: 'auto' }} />
          </Row>
        </SkeletonCard>
      ))}
    </div>
  );
}

const SKEL_VERT_W = 'clamp(118px, calc((100vw - 56px) / 2.5), 148px)';
const SKEL_VERT_IMG = 152;
const SKEL_VERT_BODY = 124;
export function SkeletonOfertas({ count = 6 }) {
  return (
    <div style={{ display: 'flex', gap: 12, overflow: 'hidden', padding: '4px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} style={{
          flexShrink: 0, width: SKEL_VERT_W, height: SKEL_VERT_IMG + SKEL_VERT_BODY,
          borderRadius: 20, border: '1px solid rgba(0,0,0,.06)',
          display: 'flex', flexDirection: 'column',
        }} className="border-slate-100 dark:border-white/8">
          <div className="bg-surface-card-2 dark:bg-white/8" style={{ width: '100%', height: SKEL_VERT_IMG, flexShrink: 0 }} />
          <div style={{ padding: 10, display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
            <Bone w="85%" h={12} />
            <Bone w="55%" h={12} />
            <Row gap={6} style={{ marginTop: 'auto' }}>
              <Bone w="45%" h={16} />
              <Bone w={30} h={30} r={10} style={{ marginLeft: 'auto' }} />
            </Row>
          </div>
        </SkeletonCard>
      ))}
    </div>
  );
}

