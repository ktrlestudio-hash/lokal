import React from 'react';

// ── Primitivos ────────────────────────────────────────────────────────────────
function Bone({ w = '100%', h = 14, r = 8, className = '', style = {} }) {
  return (
    <div
      className={`skeleton-shimmer bg-surface-card-2 dark:bg-white/8 ${className}`}
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

// ── Skeleton: Grid de productos (StoreApp - ProductosScreen) ──────────────────
export function SkeletonProductosGrid({ cols = 2, count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10, padding: '4px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-card rounded-2xl overflow-hidden border border-slate-100 dark:border-white/8">
          <div className="skeleton-shimmer bg-surface-card-2 dark:bg-white/8" style={{ aspectRatio: '1' }} />
          <div style={{ padding: 10 }}>
            <Col gap={6}>
              <Bone w="75%" h={12} />
              <Bone w="45%" h={14} />
              <Row gap={6} style={{ marginTop: 4 }}>
                <Bone w="60%" h={28} r={10} />
                <Bone w={28} h={28} r={10} />
                <Bone w={28} h={28} r={10} />
              </Row>
            </Col>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton: Lista de productos (StoreApp - ProductosScreen vista lista) ──────
export function SkeletonProductosList({ count = 5 }) {
  return (
    <Col gap={8} style={{ padding: '4px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 overflow-hidden flex">
          <div className="skeleton-shimmer bg-surface-card-2 dark:bg-white/8" style={{ width: 96, flexShrink: 0 }} />
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
        </div>
      ))}
    </Col>
  );
}

// ── Skeleton: Mensajes / Inbox (StoreApp & App) ───────────────────────────────
export function SkeletonInbox({ count = 6 }) {
  return (
    <Col gap={0}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-b border-slate-100 dark:border-white/8" style={{ padding: '14px 16px' }}>
          <Row gap={12}>
            <Bone w={44} h={44} r={22} />
            <Col gap={7} style={{ flex: 1 }}>
              <Row gap={8}>
                <Bone w="45%" h={13} />
                <Bone w="20%" h={10} style={{ marginLeft: 'auto' }} />
              </Row>
              <Bone w="75%" h={11} />
            </Col>
          </Row>
        </div>
      ))}
    </Col>
  );
}

// ── Skeleton: Feed (StoreApp - FeedScreen) ────────────────────────────────────
export function SkeletonFeed({ count = 4 }) {
  return (
    <Col gap={12} style={{ padding: '4px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 p-4">
          <Col gap={10}>
            <Row gap={10}>
              <Bone w={40} h={40} r={20} />
              <Col gap={5} style={{ flex: 1 }}>
                <Bone w="50%" h={13} />
                <Bone w="30%" h={10} />
              </Col>
              <Bone w={60} h={24} r={12} />
            </Row>
            <Bone w="90%" h={13} />
            <Bone w="65%" h={13} />
            <Row gap={8} style={{ marginTop: 4 }}>
              <Bone w={70} h={28} r={12} />
              <Bone w={90} h={28} r={12} />
              <Bone w={60} h={28} r={12} style={{ marginLeft: 'auto' }} />
            </Row>
          </Col>
        </div>
      ))}
    </Col>
  );
}

// ── Skeleton: Ofertas / Marketplace (App) ─────────────────────────────────────
export function SkeletonOfertas({ count = 6 }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, padding: '4px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-surface-card rounded-2xl overflow-hidden border border-slate-100 dark:border-white/8">
          <div className="skeleton-shimmer bg-surface-card-2 dark:bg-white/8" style={{ aspectRatio: '1' }} />
          <div style={{ padding: 10 }}>
            <Col gap={7}>
              <Bone w="80%" h={12} />
              <Bone w="50%" h={14} />
              <Bone w="65%" h={11} />
            </Col>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Skeleton: Perfil tienda (StoreApp - PerfilScreen) ─────────────────────────
export function SkeletonPerfil() {
  return (
    <Col gap={0}>
      {/* Portada */}
      <div className="skeleton-shimmer bg-surface-card-2 dark:bg-white/8" style={{ height: 140 }} />
      {/* Avatar + info */}
      <div style={{ padding: '0 16px' }}>
        <div style={{ marginTop: -32, marginBottom: 16 }}>
          <Bone w={72} h={72} r={36} />
        </div>
        <Col gap={8} style={{ marginBottom: 24 }}>
          <Bone w="50%" h={18} />
          <Bone w="70%" h={12} />
          <Bone w="40%" h={12} />
        </Col>
        {/* Stats row */}
        <Row gap={12} style={{ marginBottom: 24 }}>
          {[1,2,3].map(i => (
            <div key={i} className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 p-3" style={{ flex: 1 }}>
              <Col gap={6} style={{ alignItems: 'center' }}>
                <Bone w="60%" h={20} />
                <Bone w="80%" h={10} />
              </Col>
            </div>
          ))}
        </Row>
        {/* Campos editables */}
        <Col gap={12}>
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 p-4">
              <Col gap={7}>
                <Bone w="30%" h={10} />
                <Bone w="70%" h={14} />
              </Col>
            </div>
          ))}
        </Col>
      </div>
    </Col>
  );
}

// ── Skeleton: Stats (StoreApp - StatsScreen) ──────────────────────────────────
export function SkeletonStats() {
  return (
    <Col gap={12} style={{ padding: '4px 0' }}>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
        {[1,2,3,4].map(i => (
          <div key={i} className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 p-4">
            <Col gap={8}>
              <Bone w="50%" h={10} />
              <Bone w="70%" h={24} />
              <Bone w="40%" h={10} />
            </Col>
          </div>
        ))}
      </div>
      {/* Chart placeholder */}
      <div className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 p-4">
        <Col gap={12}>
          <Bone w="40%" h={14} />
          <div className="skeleton-shimmer bg-surface-card-2 dark:bg-white/8" style={{ height: 120, borderRadius: 8 }} />
        </Col>
      </div>
      {/* List */}
      <div className="bg-surface-card rounded-2xl border border-slate-100 dark:border-white/8 p-4">
        <Col gap={10}>
          <Bone w="35%" h={14} />
          {[1,2,3].map(i => (
            <Row key={i} gap={10}>
              <Bone w={36} h={36} r={10} />
              <Col gap={5} style={{ flex: 1 }}>
                <Bone w="60%" h={12} />
                <Bone w="35%" h={10} />
              </Col>
              <Bone w={50} h={14} />
            </Row>
          ))}
        </Col>
      </div>
    </Col>
  );
}
