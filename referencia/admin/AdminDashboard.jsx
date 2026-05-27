import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Camera, Users, Settings, Activity,
  LogOut, DollarSign, Clock, CheckCircle2, XCircle, TrendingUp,
  X, ChevronRight, Bell, RefreshCw, ArrowUpRight, Image, Check,
  Eye, Search, ChevronLeft, Zap, BellRing, BellOff, Send, Plus, Loader,
  Link, List, AlignJustify, LayoutGrid
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { API_URL } from '../../config';
import { useOrders } from '../../hooks/useOrders';
import { useSessions } from '../../hooks/useSessions';
import { useSellers } from '../../hooks/useSellers';
import { AdminSellersPanel } from './AdminSellersPanel';
import { AdminOrderDetails } from './OrdersModal';
import ConfigModal from './ConfigModal';
import DiagnosticModal from './DiagnosticModal';

// ─────────────────────────────────────────────────────────────
// Tokens de estilo compartidos
// ─────────────────────────────────────────────────────────────
const C = {
  bg:      '#0b0b0f',
  sidebar: '#0f0f14',
  card:    '#16161d',
  border:  'rgba(255,255,255,0.07)',
  border2: 'rgba(255,255,255,0.12)',
  text1:   '#f1f1f5',
  text2:   '#8b8b9a',
  text3:   '#555566',
  blue:    '#3b82f6',
  purple:  '#8b5cf6',
  green:   '#22c55e',
  amber:   '#f59e0b',
  red:     '#ef4444',
};

// 5 ítems para bottom tabs (excluye Diagnóstico)
const NAV_ITEMS = [
  { id: 'overview',    label: 'Overview',     Icon: LayoutDashboard, section: 'PRINCIPAL' },
  { id: 'orders',      label: 'Pedidos',       Icon: ShoppingCart,   section: 'PRINCIPAL', badge: true },
  { id: 'sessions',    label: 'Sesiones',      Icon: Camera,         section: 'PRINCIPAL' },
  { id: 'sellers',     label: 'Vendedores',    Icon: Users,          section: 'GESTIÓN' },
  { id: 'config',      label: 'Config',        Icon: Settings,       section: 'GESTIÓN' },
  { id: 'diagnostics', label: 'Diagnóstico',   Icon: Activity,       section: 'SISTEMA', desktopOnly: true },
];

const BOTTOM_TABS = NAV_ITEMS.filter(n => !n.desktopOnly);

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function formatCurrency(n) {
  if (!n && n !== 0) return '$–';
  return '$' + Math.round(n).toLocaleString('es-AR');
}

function formatDate(iso) {
  if (!iso) return '–';
  try { return new Date(iso).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
  catch { return iso; }
}

function shortId(id) {
  if (!id) return '–';
  return id.slice(-8).toUpperCase();
}

function timeAgo(ts) {
  if (!ts) return '–';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'ahora';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─────────────────────────────────────────────────────────────
// KPI Card
// ─────────────────────────────────────────────────────────────
function KPICard({ icon: Icon, label, value, color, sub, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
        overflow: 'hidden', display: 'flex', flexDirection: 'column',
        flex: '1 1 160px', minWidth: 0,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={onClick ? e => { e.currentTarget.style.borderColor = color + '66'; e.currentTarget.style.transform = 'translateY(-2px)'; } : undefined}
      onMouseLeave={onClick ? e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; } : undefined}
    >
      {/* Top accent bar */}
      <div style={{ height: '3px', background: `linear-gradient(90deg, ${color}, ${color}44)` }} />
      <div style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{
          width: '38px', height: '38px', borderRadius: '10px',
          background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={18} style={{ color }} />
        </div>
        <div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: C.text1, lineHeight: 1.05, letterSpacing: '-0.5px' }}>{value}</div>
          <div style={{ fontSize: '12px', color: C.text2, marginTop: '5px', fontWeight: '500' }}>{label}</div>
          {sub && <div style={{ fontSize: '11px', color: C.text3, marginTop: '3px' }}>{sub}</div>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Orders Distribution Card
// ─────────────────────────────────────────────────────────────
function OrdersDistributionCard({ counts, revenue, setActiveSection }) {
  const total = (counts.pending || 0) + (counts.approved || 0) + (counts.rejected || 0);
  const segments = [
    { label: 'Aprobados', count: counts.approved || 0, color: C.green },
    { label: 'Pendientes', count: counts.pending || 0, color: C.amber },
    { label: 'Rechazados', count: counts.rejected || 0, color: C.red },
  ];
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '20px 22px', flex: '1 1 240px', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <div style={{ color: C.text1, fontWeight: '700', fontSize: '14px' }}>Estado de pedidos</div>
        <button onClick={() => setActiveSection('orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.blue, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}>
          Ver <ChevronRight size={13} />
        </button>
      </div>
      {/* Stacked progress bar */}
      <div style={{ height: '7px', borderRadius: '999px', overflow: 'hidden', display: 'flex', gap: '2px', marginBottom: '16px', background: 'rgba(255,255,255,0.06)' }}>
        {total > 0 && segments.map(s => s.count > 0 && (
          <div key={s.label} title={`${s.label}: ${s.count}`} style={{ flex: s.count, background: s.color, borderRadius: '999px', transition: 'flex 0.4s' }} />
        ))}
      </div>
      {/* Legend */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {segments.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: s.color, flexShrink: 0 }} />
            <span style={{ color: C.text2, fontSize: '12px', flex: 1 }}>{s.label}</span>
            <span style={{ color: C.text1, fontSize: '13px', fontWeight: '700' }}>{s.count}</span>
            {total > 0 && (
              <span style={{ color: C.text3, fontSize: '11px', width: '32px', textAlign: 'right' }}>
                {Math.round(s.count / total * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>
      {total > 0 && (
        <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: `1px solid ${C.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: C.text3, fontSize: '11px' }}>{total} pedidos en total</span>
          <span style={{ color: C.green, fontSize: '12px', fontWeight: '700' }}>{formatCurrency(revenue.total)}</span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sessions Mini Preview (used in overview)
// ─────────────────────────────────────────────────────────────
const SESSION_MINI_GRADIENTS = [
  'linear-gradient(135deg, #1e3a5f, #2563eb)',
  'linear-gradient(135deg, #3b1f5e, #7c3aed)',
  'linear-gradient(135deg, #1f3a2f, #059669)',
  'linear-gradient(135deg, #3d1f1f, #dc2626)',
  'linear-gradient(135deg, #3a2e1f, #d97706)',
  'linear-gradient(135deg, #1f2d3a, #0891b2)',
];

function SessionMiniCard({ session: s, index, onClick }) {
  const photoCount = s.photoCount ?? s.photos?.length ?? 0;
  const gradient = SESSION_MINI_GRADIENTS[index % SESSION_MINI_GRADIENTS.length];
  const thumbnail = s.thumbnailUrl || s.photos?.[0] || null;
  return (
    <a
      href={`/?session=${s.slug || s.id}`}
      target="_blank"
      rel="noreferrer"
      style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', borderRadius: '11px', overflow: 'hidden', border: `1px solid ${C.border}`, transition: 'border-color 0.15s, transform 0.15s', flexShrink: 0, width: '120px' }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      <div style={{ height: '68px', background: thumbnail ? '#000' : gradient, position: 'relative', overflow: 'hidden' }}>
        {thumbnail && <img src={thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />}
        {!thumbnail && <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Camera size={22} style={{ color: 'rgba(255,255,255,0.3)' }} /></div>}
        {s.isActive !== false && (
          <div style={{ position: 'absolute', top: '5px', left: '5px', background: 'rgba(34,197,94,0.9)', width: '6px', height: '6px', borderRadius: '50%' }} />
        )}
        <div style={{ position: 'absolute', bottom: '5px', right: '6px', background: 'rgba(0,0,0,0.65)', color: '#fff', fontSize: '10px', fontWeight: '600', padding: '1px 5px', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
          {photoCount}
        </div>
      </div>
      <div style={{ padding: '7px 8px', background: C.card }}>
        <div style={{ color: C.text1, fontSize: '11px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || s.slug}</div>
        <div style={{ color: C.text3, fontSize: '10px', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.slug}</div>
      </div>
    </a>
  );
}

// ─────────────────────────────────────────────────────────────
// Status chip
// ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  pending:  { label: 'Pendiente', color: C.amber, bg: 'rgba(245,158,11,0.12)',  Icon: Clock },
  approved: { label: 'Aprobado',  color: C.green, bg: 'rgba(34,197,94,0.12)',   Icon: CheckCircle2 },
  rejected: { label: 'Rechazado', color: C.red,   bg: 'rgba(239,68,68,0.12)',   Icon: XCircle },
};

function StatusChip({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.pending;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '5px',
      background: cfg.bg, color: cfg.color,
      padding: '3px 10px', borderRadius: '999px', fontSize: '11px', fontWeight: '600',
    }}>
      <cfg.Icon size={11} />
      {cfg.label}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Overview
// ─────────────────────────────────────────────────────────────
function OverviewSection({ orders, counts, revenue, sessions, sellers, approveOrder, rejectOrder, showToast, setActiveSection }) {
  const [rejectingId, setRejectingId]   = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingOrders = useMemo(() =>
    orders.filter(o => o.status === 'pending').slice().reverse().slice(0, 10),
  [orders]);

  const activityFeed = useMemo(() => {
    const events = [];
    orders.forEach(order => {
      events.push({ id: order.id + '_c', type: 'new', orderId: order.id, customer: order.customer?.name, amount: order.pricing?.total, ts: new Date(order.createdAt || 0).getTime() });
      if (order.status === 'approved') events.push({ id: order.id + '_a', type: 'approved', orderId: order.id, customer: order.customer?.name, amount: order.pricing?.total, ts: new Date(order.approvedAt || order.updatedAt || order.createdAt || 0).getTime() });
      if (order.status === 'rejected') events.push({ id: order.id + '_r', type: 'rejected', orderId: order.id, customer: order.customer?.name, ts: new Date(order.updatedAt || order.createdAt || 0).getTime() });
    });
    return events.sort((a, b) => b.ts - a.ts).slice(0, 12);
  }, [orders]);

  const FEED_CFG = {
    new:      { color: C.blue,   label: 'Nuevo pedido',  dot: C.blue },
    approved: { color: C.green,  label: 'Aprobado',      dot: C.green },
    rejected: { color: C.red,    label: 'Rechazado',     dot: C.red },
  };

  const handleApprove = async (id) => {
    const res = await approveOrder(id);
    if (res?.success === false) showToast('Error al aprobar: ' + res.error, 'error');
    else showToast('Pedido aprobado ✓', 'success');
  };

  const handleReject = async (id) => {
    if (!rejectReason.trim()) return;
    const res = await rejectOrder(id, rejectReason.trim());
    if (res?.success === false) showToast('Error al rechazar: ' + res.error, 'error');
    else { showToast('Pedido rechazado', 'info'); setRejectingId(null); setRejectReason(''); }
  };

  const activeSessions = sessions.filter(s => s.isActive !== false);
  const totalPhotos = sessions.reduce((acc, s) => acc + (s.photoCount ?? s.photos?.length ?? 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── KPI Row ── */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <KPICard
          icon={DollarSign}
          label="Ingresos aprobados"
          value={formatCurrency(revenue.total)}
          color={C.green}
          sub={counts.approved > 0 ? `${counts.approved} pedido${counts.approved !== 1 ? 's' : ''} aprobado${counts.approved !== 1 ? 's' : ''}` : undefined}
          onClick={() => setActiveSection('orders')}
        />
        <KPICard
          icon={Clock}
          label="Pendientes de revisión"
          value={counts.pending ?? 0}
          color={C.amber}
          sub={counts.pending > 0 ? 'Requieren atención' : 'Todo al día'}
          onClick={() => setActiveSection('orders')}
        />
        <KPICard
          icon={Camera}
          label="Sesiones activas"
          value={activeSessions.length}
          color={C.blue}
          sub={`${totalPhotos} foto${totalPhotos !== 1 ? 's' : ''} en total`}
          onClick={() => setActiveSection('sessions')}
        />
        <KPICard
          icon={Users}
          label="Vendedores activos"
          value={sellers.summaryStats?.activeSellers ?? 0}
          color={C.purple}
          sub={sellers.summaryStats?.totalSellers ? `de ${sellers.summaryStats.totalSellers} registrados` : undefined}
          onClick={() => setActiveSection('sellers')}
        />
      </div>

      {/* ── Second row: Distribution + Sessions mini-grid ── */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
        <OrdersDistributionCard counts={counts} revenue={revenue} setActiveSection={setActiveSection} />

        {/* Sessions mini preview */}
        <div style={{ flex: '1 1 300px', minWidth: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={14} style={{ color: C.blue }} />
              <span style={{ color: C.text1, fontWeight: '700', fontSize: '13px' }}>Sesiones</span>
              <span style={{ background: 'rgba(59,130,246,0.12)', color: C.blue, fontSize: '10px', fontWeight: '700', padding: '1px 7px', borderRadius: '999px' }}>{sessions.length}</span>
            </div>
            <div style={{ display: 'flex', gap: '7px', alignItems: 'center' }}>
              <button onClick={() => setActiveSection('sessions')} style={{ background: 'rgba(59,130,246,0.1)', border: `1px solid rgba(59,130,246,0.25)`, borderRadius: '7px', padding: '4px 9px', cursor: 'pointer', color: C.blue, fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Plus size={11} /> Nueva
              </button>
              <button onClick={() => setActiveSection('sessions')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.text3, fontSize: '11px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                Ver todas <ChevronRight size={12} />
              </button>
            </div>
          </div>
          <div style={{ padding: '14px' }}>
            {sessions.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: C.text3, fontSize: '12px' }}>Sin sesiones creadas</div>
            ) : (
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '4px' }}>
                {sessions.slice(0, 6).map((s, i) => (
                  <SessionMiniCard key={s.id || s.slug} session={s} index={i} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Third row: Pending orders + Activity feed ── */}
      <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>

        {/* Pending orders */}
        <div style={{ flex: '1 1 360px', minWidth: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: counts.pending > 0 ? C.amber : C.text3, flexShrink: 0, boxShadow: counts.pending > 0 ? `0 0 6px ${C.amber}` : 'none' }} />
              <span style={{ color: C.text1, fontWeight: '700', fontSize: '13px' }}>Pendientes</span>
              {counts.pending > 0 && (
                <span style={{ background: C.amber, color: '#000', borderRadius: '999px', fontSize: '10px', fontWeight: '800', padding: '1px 8px' }}>
                  {counts.pending}
                </span>
              )}
            </div>
            <button onClick={() => setActiveSection('orders')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.blue, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px' }}>
              Ver todos <ChevronRight size={13} />
            </button>
          </div>

          {pendingOrders.length === 0 ? (
            <div style={{ padding: '36px 20px', textAlign: 'center', color: C.text3, fontSize: '13px' }}>
              <CheckCircle2 size={28} style={{ color: 'rgba(34,197,94,0.3)', display: 'block', margin: '0 auto 10px' }} />
              Sin pedidos pendientes
            </div>
          ) : (
            <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
              {pendingOrders.map(order => (
                <div key={order.id} style={{ padding: '12px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <div>
                      <div style={{ color: C.text1, fontSize: '13px', fontWeight: '600' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '12px', color: C.text3 }}>#</span>{shortId(order.id)}
                        <span style={{ color: C.text2, fontWeight: '400', marginLeft: '7px', fontSize: '12px' }}>
                          {order?.customer?.name || '–'}
                        </span>
                      </div>
                      <div style={{ color: C.text3, fontSize: '11px', marginTop: '2px' }}>
                        {order.items?.length || 0} foto{(order.items?.length || 0) !== 1 ? 's' : ''} · {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div style={{ color: C.green, fontSize: '14px', fontWeight: '800', whiteSpace: 'nowrap' }}>
                      {formatCurrency(order.pricing?.total)}
                    </div>
                  </div>

                  {rejectingId === order.id ? (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <input
                        value={rejectReason} onChange={e => setRejectReason(e.target.value)}
                        placeholder="Motivo del rechazo..."
                        onKeyDown={e => e.key === 'Enter' && handleReject(order.id)}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border2}`, borderRadius: '7px', padding: '7px 10px', color: C.text1, fontSize: '12px', outline: 'none' }}
                      />
                      <button onClick={() => handleReject(order.id)} style={{ background: C.red, border: 'none', borderRadius: '7px', padding: '7px 12px', color: 'white', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap' }}>Rechazar</button>
                      <button onClick={() => { setRejectingId(null); setRejectReason(''); }} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: '7px', padding: '7px 10px', color: C.text2, fontSize: '12px', cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => handleApprove(order.id)} style={{ flex: 1, background: 'rgba(34,197,94,0.12)', border: `1px solid rgba(34,197,94,0.3)`, borderRadius: '7px', padding: '7px 10px', color: C.green, fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <Check size={13} /> Aprobar
                      </button>
                      <button onClick={() => setRejectingId(order.id)} style={{ flex: 1, background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: '7px', padding: '7px 10px', color: C.red, fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                        <XCircle size={13} /> Rechazar
                      </button>
                      <button onClick={() => setActiveSection('orders')} style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '7px', padding: '7px 12px', color: C.text2, fontSize: '12px', cursor: 'pointer' }}>
                        <Eye size={13} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div style={{ flex: '0 1 300px', minWidth: '240px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={14} style={{ color: C.purple }} />
            <span style={{ color: C.text1, fontWeight: '700', fontSize: '13px' }}>Actividad</span>
          </div>
          {activityFeed.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: C.text3, fontSize: '13px' }}>Sin actividad</div>
          ) : (
            <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '8px 0' }}>
              {activityFeed.map((event, idx) => {
                const cfg = FEED_CFG[event.type] || FEED_CFG.new;
                const isLast = idx === activityFeed.length - 1;
                return (
                  <div key={event.id} style={{ padding: '7px 18px', display: 'flex', alignItems: 'flex-start', gap: '11px', position: 'relative' }}>
                    {/* Timeline line */}
                    {!isLast && (
                      <div style={{ position: 'absolute', left: '22px', top: '22px', bottom: '-2px', width: '1px', background: C.border }} />
                    )}
                    {/* Dot */}
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: cfg.dot, flexShrink: 0, marginTop: '4px', border: `2px solid ${C.card}`, outline: `1px solid ${cfg.dot}44`, position: 'relative', zIndex: 1 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '12px', lineHeight: '1.4' }}>
                        <span style={{ color: cfg.color, fontWeight: '600', fontSize: '11px' }}>{cfg.label}</span>
                        {' '}
                        <span style={{ color: C.text3, fontFamily: 'monospace', fontSize: '10px' }}>#{shortId(event.orderId)}</span>
                      </div>
                      {event.customer && <div style={{ color: C.text2, fontSize: '11px', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event.customer}{event.amount != null ? ` · ${formatCurrency(event.amount)}` : ''}</div>}
                    </div>
                    <div style={{ color: C.text3, fontSize: '10px', flexShrink: 0, marginTop: '4px' }}>
                      {timeAgo(event.ts)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Orders (lista completa + panel lateral)
// ─────────────────────────────────────────────────────────────
function OrdersSection({ orders, approveOrder, rejectOrder, deleteOrder, showToast }) {
  const [selected, setSelected]         = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch]             = useState('');
  const [rejectModal, setRejectModal]   = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  const filtered = useMemo(() => {
    let list = [...orders].reverse();
    if (filterStatus !== 'all') list = list.filter(o => o.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(o =>
        o.id?.toLowerCase().includes(q) ||
        o?.customer?.name?.toLowerCase().includes(q) ||
        o?.customer?.phone?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [orders, filterStatus, search]);

  const handleUpdateStatus = async (orderId, status) => {
    if (status === 'rejected') { setRejectModal(orderId); return; }
    const res = await approveOrder(orderId);
    if (res?.success === false) showToast('Error: ' + res.error, 'error');
    else { showToast('Pedido aprobado ✓', 'success'); setSelected(null); }
  };

  const handleRejectConfirm = async () => {
    const res = await rejectOrder(rejectModal, rejectReason.trim());
    if (res?.success === false) showToast('Error: ' + res.error, 'error');
    else { showToast('Pedido rechazado', 'info'); setRejectModal(null); setRejectReason(''); setSelected(null); }
  };

  const handleDelete = async (orderId) => {
    if (!window.confirm('¿Eliminar este pedido?')) return;
    const res = await deleteOrder(orderId);
    if (res?.success === false) showToast('Error: ' + res.error, 'error');
    else { showToast('Pedido eliminado', 'info'); if (selected?.id === orderId) setSelected(null); }
  };

  const statusTabs = [
    { id: 'all',      label: 'Todos',      count: orders.length },
    { id: 'pending',  label: 'Pendientes', count: orders.filter(o => o.status === 'pending').length },
    { id: 'approved', label: 'Aprobados',  count: orders.filter(o => o.status === 'approved').length },
    { id: 'rejected', label: 'Rechazados', count: orders.filter(o => o.status === 'rejected').length },
  ];

  return (
    <div style={{ display: 'flex', gap: '20px', minHeight: 0 }}>

      {/* List panel */}
      <div style={{ flex: selected ? '0 0 320px' : '1 1 auto', minWidth: 0, display: (isMobile && selected) ? 'none' : 'flex', flexDirection: 'column', gap: '14px', transition: 'flex 0.2s' }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '160px', display: 'flex', alignItems: 'center', gap: '8px', background: C.card, border: `1px solid ${C.border}`, borderRadius: '10px', padding: '8px 14px' }}>
            <Search size={14} style={{ color: C.text3 }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar pedido..." style={{ flex: 1, background: 'none', border: 'none', outline: 'none', color: C.text1, fontSize: '13px' }} />
          </div>
          <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
            {statusTabs.map(t => (
              <button key={t.id} onClick={() => setFilterStatus(t.id)} style={{ background: filterStatus === t.id ? C.blue : C.card, border: `1px solid ${filterStatus === t.id ? C.blue : C.border}`, borderRadius: '8px', padding: '6px 11px', color: filterStatus === t.id ? 'white' : C.text2, fontSize: '12px', fontWeight: '600', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                {t.label} {t.count > 0 && <span style={{ opacity: 0.7 }}>({t.count})</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Order list */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: C.text3, fontSize: '14px' }}>Sin pedidos</div>
          ) : (
            <div style={{ maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>
              {filtered.map(order => (
                <div
                  key={order.id}
                  onClick={() => setSelected(order.id === selected?.id ? null : order)}
                  style={{ padding: '13px 18px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', transition: 'background 0.1s', background: selected?.id === order.id ? 'rgba(59,130,246,0.08)' : 'transparent' }}
                  onMouseEnter={e => { if (selected?.id !== order.id) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={e => { if (selected?.id !== order.id) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '11px' }}>
                    <div style={{ width: '34px', height: '34px', borderRadius: '8px', flexShrink: 0, background: (STATUS_CFG[order.status] || STATUS_CFG.pending).bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {React.createElement((STATUS_CFG[order.status] || STATUS_CFG.pending).Icon, { size: 15, style: { color: (STATUS_CFG[order.status] || STATUS_CFG.pending).color } })}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                        <span style={{ color: C.text1, fontSize: '13px', fontWeight: '600' }}>#{shortId(order.id)}</span>
                        <StatusChip status={order.status} />
                      </div>
                      <div style={{ color: C.text2, fontSize: '11px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order?.customer?.name || '–'} · {order.items?.length || 0} fotos · {formatDate(order.createdAt)}
                      </div>
                    </div>
                    <div style={{ color: C.green, fontSize: '13px', fontWeight: '700', flexShrink: 0 }}>{formatCurrency(order.pricing?.total)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <AnimatePresence>
        {selected && (
          <motion.div key="detail" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.18 }}
            style={{ flex: '1 1 auto', minWidth: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
          >
            <div style={{ padding: '15px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isMobile && (
                  <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px 12px', color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '13px', fontWeight: '500' }}>
                    <ChevronLeft size={15} /> Volver
                  </button>
                )}
                <span style={{ color: C.text1, fontWeight: '600', fontSize: '14px' }}>Pedido #{shortId(selected.id)}</span>
              </div>
              {!isMobile && (
                <button onClick={() => setSelected(null)} style={{ background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '6px 10px', color: C.text2, cursor: 'pointer' }}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
              <AdminOrderDetails order={selected} onUpdateStatus={handleUpdateStatus} onDeleteOrder={handleDelete} showToast={showToast} onRejectWithReason={(id) => setRejectModal(id)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reject modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}
            onClick={e => { if (e.target === e.currentTarget) { setRejectModal(null); setRejectReason(''); } }}
          >
            <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 10 }}
              style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '16px', padding: '28px', width: '360px', maxWidth: '90vw' }}
            >
              <h3 style={{ color: C.text1, fontSize: '16px', fontWeight: '700', marginBottom: '14px' }}>Motivo del rechazo</h3>
              <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Ej: Comprobante no válido..." rows={3}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border2}`, borderRadius: '10px', padding: '11px 13px', color: C.text1, fontSize: '14px', resize: 'vertical', outline: 'none', fontFamily: 'inherit' }}
              />
              <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button onClick={handleRejectConfirm} style={{ flex: 1, background: C.red, border: 'none', borderRadius: '10px', padding: '11px', color: 'white', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>Rechazar pedido</button>
                <button onClick={() => { setRejectModal(null); setRejectReason(''); }} style={{ background: 'rgba(255,255,255,0.07)', border: `1px solid ${C.border}`, borderRadius: '10px', padding: '11px 14px', color: C.text2, fontSize: '14px', cursor: 'pointer' }}>Cancelar</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Section: Sessions
// ─────────────────────────────────────────────────────────────
const SESSION_GRADIENTS = [
  'linear-gradient(135deg, #1e3a5f, #2563eb)',
  'linear-gradient(135deg, #3b1f5e, #7c3aed)',
  'linear-gradient(135deg, #1f3a2f, #059669)',
  'linear-gradient(135deg, #3d1f1f, #dc2626)',
  'linear-gradient(135deg, #3a2e1f, #d97706)',
  'linear-gradient(135deg, #1f2d3a, #0891b2)',
];

async function updateSessionLayout(slug, name, layoutMode) {
  await fetch(`${API_URL}/update-session`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slug, name, layoutMode }),
  });
}

function SessionCard({ session: s, index, showToast, onRefresh }) {
  const [copied, setCopied] = useState(false);
  const [layout, setLayout] = useState(s.layoutMode || 'grid');
  const [savingLayout, setSavingLayout] = useState(false);
  const photoCount = s.photoCount ?? s.photos?.length ?? 0;
  const gradient = SESSION_GRADIENTS[index % SESSION_GRADIENTS.length];
  const galleryUrl = `${window.location.origin}/?session=${s.slug || s.id}`;
  const thumbnail = s.thumbnailUrl || s.photos?.[0] || null;

  const copyLink = () => {
    navigator.clipboard.writeText(galleryUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const toggleLayout = async () => {
    const next = layout === 'grid' ? 'justified' : 'grid';
    setSavingLayout(true);
    try {
      await updateSessionLayout(s.slug || s.id, s.name || s.slug, next);
      setLayout(next);
      if (showToast) showToast(`Vista ${next === 'justified' ? 'dinámica' : 'cuadrícula'} guardada`, 'success');
      if (onRefresh) onRefresh();
    } catch {
      if (showToast) showToast('Error al guardar vista', 'error');
    } finally {
      setSavingLayout(false);
    }
  };

  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px',
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
      transition: 'border-color 0.15s, transform 0.15s',
      cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(59,130,246,0.4)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.transform = 'translateY(0)'; }}
    >
      {/* Preview */}
      <div style={{
        height: '130px', position: 'relative', overflow: 'hidden',
        background: thumbnail ? '#000' : gradient,
      }}>
        {thumbnail ? (
          <img src={thumbnail} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={36} style={{ color: 'rgba(255,255,255,0.3)' }} />
          </div>
        )}
        {/* Chips overlay */}
        <div style={{ position: 'absolute', top: '10px', left: '10px', display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
          {s.isActive !== false && (
            <span style={{ background: 'rgba(34,197,94,0.85)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', backdropFilter: 'blur(4px)', letterSpacing: '0.3px' }}>
              ACTIVA
            </span>
          )}
          {s.monetized === false && (
            <span style={{ background: 'rgba(107,114,128,0.85)', color: '#fff', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
              LIBRE
            </span>
          )}
          {s.password && (
            <span style={{ background: 'rgba(245,158,11,0.85)', color: '#000', fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px', backdropFilter: 'blur(4px)' }}>
              🔒 PRIVADA
            </span>
          )}
        </div>
        {/* Photo count badge */}
        <div style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '999px', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Camera size={11} /> {photoCount}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ color: C.text1, fontWeight: '700', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.name || s.slug}
        </div>
        <div style={{ color: C.text3, fontSize: '11px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {s.slug}{s.createdAt ? ` · ${formatDate(s.createdAt)}` : ''}
        </div>
      </div>

      {/* Layout mode indicator */}
      <div style={{ padding: '0 14px 8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: C.text3, fontSize: '10px', fontWeight: '600', letterSpacing: '0.5px' }}>VISTA</span>
        <button
          onClick={toggleLayout}
          disabled={savingLayout}
          title={layout === 'justified' ? 'Vista dinámica (click para cambiar a cuadrícula)' : 'Vista cuadrícula (click para cambiar a dinámica)'}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', background: layout === 'justified' ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.05)', border: `1px solid ${layout === 'justified' ? 'rgba(139,92,246,0.4)' : C.border}`, borderRadius: '6px', padding: '3px 9px', color: layout === 'justified' ? C.purple : C.text3, fontSize: '10px', fontWeight: '700', cursor: savingLayout ? 'wait' : 'pointer', transition: 'all 0.15s', letterSpacing: '0.3px' }}
        >
          {layout === 'justified' ? <AlignJustify size={11} /> : <LayoutGrid size={11} />}
          {layout === 'justified' ? 'Dinámica' : 'Cuadrícula'}
        </button>
      </div>

      {/* Actions */}
      <div style={{ padding: '0 14px 12px', display: 'flex', gap: '6px' }}>
        <a href={galleryUrl} target="_blank" rel="noreferrer"
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', background: 'rgba(59,130,246,0.12)', border: `1px solid rgba(59,130,246,0.3)`, borderRadius: '8px', padding: '7px 0', color: C.blue, fontSize: '11px', fontWeight: '600', textDecoration: 'none', transition: 'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.22)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(59,130,246,0.12)'}
        >
          <ArrowUpRight size={12} /> Ver galería
        </a>
        <button
          onClick={copyLink}
          title="Copiar link"
          style={{ width: '34px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: copied ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.05)', border: `1px solid ${copied ? 'rgba(34,197,94,0.3)' : C.border}`, borderRadius: '8px', color: copied ? C.green : C.text2, cursor: 'pointer', transition: 'all 0.15s', padding: 0 }}
        >
          {copied ? <Check size={13} /> : <Link size={13} />}
        </button>
      </div>
    </div>
  );
}

function SessionRow({ session: s }) {
  const [copied, setCopied] = useState(false);
  const photoCount = s.photoCount ?? s.photos?.length ?? 0;
  const galleryUrl = `${window.location.origin}/?session=${s.slug || s.id}`;
  const copyLink = () => {
    navigator.clipboard.writeText(galleryUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <div style={{ padding: '13px 20px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: '14px' }}>
      <div style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Camera size={17} style={{ color: C.blue }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: C.text1, fontSize: '13px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name || s.slug}</div>
        <div style={{ color: C.text3, fontSize: '11px', marginTop: '2px' }}>{s.slug} · {photoCount} fotos{s.createdAt ? ` · ${formatDate(s.createdAt)}` : ''}</div>
      </div>
      <div style={{ display: 'flex', gap: '5px', flexShrink: 0 }}>
        {s.isActive !== false && <span style={{ background: 'rgba(34,197,94,0.12)', color: C.green, fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '999px' }}>ACTIVA</span>}
        {s.password && <span style={{ background: 'rgba(245,158,11,0.1)', color: C.amber, fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '999px' }}>🔒</span>}
        {s.monetized === false && <span style={{ background: 'rgba(107,114,128,0.12)', color: C.text3, fontSize: '10px', fontWeight: '700', padding: '2px 7px', borderRadius: '999px' }}>LIBRE</span>}
      </div>
      <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
        <button onClick={copyLink} title="Copiar link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '8px', color: copied ? C.green : C.text2, cursor: 'pointer' }}>
          {copied ? <Check size={13} /> : <Link size={13} />}
        </button>
        <a href={galleryUrl} target="_blank" rel="noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(59,130,246,0.1)', border: `1px solid rgba(59,130,246,0.3)`, borderRadius: '8px', padding: '6px 11px', color: C.blue, fontSize: '11px', fontWeight: '600', textDecoration: 'none' }}
        >
          <ArrowUpRight size={12} /> Ver
        </a>
      </div>
    </div>
  );
}

function SessionsSection({ sessions, loading, showToast, onSessionCreated }) {
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newLayout, setNewLayout] = useState('grid');
  const [creating, setCreating] = useState(false);
  const [viewMode, setViewMode] = useState('grid');

  const handleCreate = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await fetch(`${API_URL}/create-session`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), monetized: true, layoutMode: newLayout }),
      });
      if (!res.ok) throw new Error('Error al crear sesión');
      const data = await res.json();
      showToast(`Sesión "${newName.trim()}" creada`, 'success');
      setNewName('');
      setShowForm(false);
      if (onSessionCreated) onSessionCreated(data);
    } catch (e) {
      showToast(e.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div style={{ color: C.text3, padding: '40px', textAlign: 'center' }}>Cargando sesiones...</div>;

  return (
    <div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
        <Camera size={16} style={{ color: C.blue }} />
        <span style={{ color: C.text1, fontWeight: '700', fontSize: '16px' }}>Sesiones</span>
        <span style={{ background: 'rgba(59,130,246,0.12)', color: C.blue, fontSize: '11px', fontWeight: '700', padding: '2px 8px', borderRadius: '999px' }}>{sessions.length}</span>
        <div style={{ flex: 1 }} />
        {/* View toggle */}
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden' }}>
          <button onClick={() => setViewMode('grid')} title="Vista grilla"
            style={{ padding: '6px 10px', border: 'none', cursor: 'pointer', background: viewMode === 'grid' ? 'rgba(59,130,246,0.2)' : 'transparent', color: viewMode === 'grid' ? C.blue : C.text3, transition: 'all 0.12s' }}>
            <LayoutDashboard size={14} />
          </button>
          <button onClick={() => setViewMode('list')} title="Vista lista"
            style={{ padding: '6px 10px', border: 'none', cursor: 'pointer', background: viewMode === 'list' ? 'rgba(59,130,246,0.2)' : 'transparent', color: viewMode === 'list' ? C.blue : C.text3, transition: 'all 0.12s' }}>
            <List size={14} />
          </button>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(59,130,246,0.12)', border: `1px solid rgba(59,130,246,0.3)`, borderRadius: '8px', padding: '7px 13px', color: C.blue, fontSize: '12px', fontWeight: '600', cursor: 'pointer' }}
        >
          <Plus size={13} /> Nueva sesión
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '12px', padding: '14px', marginBottom: '16px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleCreate(); if (e.key === 'Escape') setShowForm(false); }}
            placeholder="Nombre de la sesión (ej: Boda María & Juan)"
            style={{ flex: 1, background: 'rgba(255,255,255,0.07)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '9px 13px', color: C.text1, fontSize: '13px', outline: 'none' }}
          />
          {/* Layout selector */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '8px', overflow: 'hidden', flexShrink: 0 }}>
            <button onClick={() => setNewLayout('grid')} title="Cuadrícula"
              style={{ padding: '9px 11px', border: 'none', cursor: 'pointer', background: newLayout === 'grid' ? 'rgba(59,130,246,0.2)' : 'transparent', color: newLayout === 'grid' ? C.blue : C.text3, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
              <LayoutGrid size={13} /> Cuadrícula
            </button>
            <button onClick={() => setNewLayout('justified')} title="Dinámica"
              style={{ padding: '9px 11px', border: 'none', cursor: 'pointer', background: newLayout === 'justified' ? 'rgba(139,92,246,0.2)' : 'transparent', color: newLayout === 'justified' ? C.purple : C.text3, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '600', whiteSpace: 'nowrap' }}>
              <AlignJustify size={13} /> Dinámica
            </button>
          </div>
          <button onClick={handleCreate} disabled={!newName.trim() || creating}
            style={{ background: C.blue, border: 'none', borderRadius: '8px', padding: '9px 16px', color: 'white', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', opacity: !newName.trim() || creating ? 0.6 : 1 }}
          >
            {creating ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={13} />}
            {creating ? 'Creando...' : 'Crear'}
          </button>
          <button onClick={() => { setShowForm(false); setNewName(''); setNewLayout('grid'); }}
            style={{ background: 'none', border: 'none', color: C.text2, cursor: 'pointer', padding: '6px' }}>
            <X size={15} />
          </button>
        </div>
      )}

      {/* Empty state */}
      {sessions.length === 0 ? (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '60px', textAlign: 'center', color: C.text3, fontSize: '14px' }}>
          <Camera size={36} style={{ color: 'rgba(255,255,255,0.1)', marginBottom: '12px', display: 'block', margin: '0 auto 12px' }} />
          No hay sesiones creadas
        </div>
      ) : viewMode === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '14px' }}>
          {sessions.map((s, i) => <SessionCard key={s.id || s.slug} session={s} index={i} showToast={showToast} onRefresh={onSessionCreated} />)}
        </div>
      ) : (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
          {sessions.map(s => <SessionRow key={s.id || s.slug} session={s} />)}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Toast
// ─────────────────────────────────────────────────────────────
// Push Notifications Card
// ─────────────────────────────────────────────────────────────
const VAPID_PUBLIC_KEY = 'BNGd-drkgt6bM_F9wAG6Zcpcsc9XkaQIfTQOmcsbUxKuDfP3Kfn0_vw100CvGgy8OW6x8UX9cARcFaLRMk8HOnk';

function urlBase64ToUint8Array(b64) {
  const pad = '='.repeat((4 - b64.length % 4) % 4);
  const base64 = (b64 + pad).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)));
}

function PushNotificationsCard({ showToast }) {
  const [permission, setPermission]   = useState(() => typeof Notification !== 'undefined' ? Notification.permission : 'unsupported');
  const [subscribed, setSubscribed]   = useState(false);
  const [checking, setChecking]       = useState(true);
  const [loading, setLoading]         = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  const supported = typeof Notification !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window;

  // Check current subscription state
  useEffect(() => {
    if (!supported) { setChecking(false); return; }
    navigator.serviceWorker.register('/sw.js').catch(() => {});
    navigator.serviceWorker.ready.then(reg =>
      reg.pushManager.getSubscription()
    ).then(sub => {
      setSubscribed(!!sub);
      setChecking(false);
    }).catch(() => setChecking(false));
  }, [supported]);

  const handleSubscribe = async () => {
    if (!supported) return;
    setLoading(true);
    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') {
        showToast('Permiso denegado por el navegador', 'error');
        setLoading(false);
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
      }
      const res = await fetch(`${API_URL}/save-push-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), role: 'admin' }),
      });
      if (res.ok) {
        setSubscribed(true);
        showToast('Notificaciones activadas ✓', 'success');
      } else {
        const err = await res.json().catch(() => ({}));
        showToast('Error al activar: ' + (err.error || res.status), 'error');
      }
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      setSubscribed(false);
      showToast('Notificaciones desactivadas', 'info');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTestPush = async () => {
    setTestLoading(true);
    try {
      const res = await fetch(`${API_URL}/send-test-push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) showToast('Notificación de prueba enviada ✓', 'success');
      else showToast('Error: ' + (data.error || res.status), 'error');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      setTestLoading(false);
    }
  };

  const statusColor  = !supported ? C.text3 : permission === 'denied' ? C.red : subscribed ? C.green : C.amber;
  const statusLabel  = !supported ? 'No soportado' : checking ? 'Verificando...' : permission === 'denied' ? 'Bloqueado por el navegador' : subscribed ? 'Activo' : 'Inactivo';
  const StatusIcon   = !supported || permission === 'denied' ? BellOff : subscribed ? BellRing : Bell;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', padding: '22px 24px', marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
        <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: statusColor + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <StatusIcon size={18} style={{ color: statusColor }} />
        </div>
        <div>
          <div style={{ color: C.text1, fontWeight: '600', fontSize: '14px' }}>Notificaciones push</div>
          <div style={{ color: statusColor, fontSize: '12px', marginTop: '2px', fontWeight: '500' }}>{statusLabel}</div>
        </div>
      </div>

      <div style={{ color: C.text2, fontSize: '13px', lineHeight: '1.6', marginBottom: '18px' }}>
        Recibí una notificación en tu celular cada vez que llegue un pedido nuevo, incluso con la app cerrada.
      </div>

      {permission === 'denied' ? (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: `1px solid rgba(239,68,68,0.2)`, borderRadius: '10px', padding: '12px 14px', color: C.text2, fontSize: '12px', lineHeight: 1.6 }}>
          Las notificaciones están bloqueadas en el navegador. Para activarlas: <strong style={{ color: C.text1 }}>Configuración del sitio → Notificaciones → Permitir</strong>.
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {!subscribed ? (
            <button onClick={handleSubscribe} disabled={loading || checking || !supported} style={{
              flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              background: C.blue, border: 'none', borderRadius: '10px', padding: '11px 16px',
              color: 'white', fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              opacity: (loading || checking || !supported) ? 0.6 : 1, transition: 'opacity 0.15s',
            }}>
              <Bell size={14} /> {loading ? 'Activando...' : 'Activar notificaciones'}
            </button>
          ) : (
            <button onClick={handleUnsubscribe} disabled={loading} style={{
              display: 'flex', alignItems: 'center', gap: '7px',
              background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`,
              borderRadius: '10px', padding: '11px 16px',
              color: C.text2, fontSize: '13px', fontWeight: '500', cursor: 'pointer',
              opacity: loading ? 0.6 : 1,
            }}>
              <BellOff size={14} /> {loading ? 'Desactivando...' : 'Desactivar'}
            </button>
          )}
          {subscribed && (
            <button onClick={handleTestPush} disabled={testLoading} style={{
              flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
              background: 'rgba(139,92,246,0.12)', border: `1px solid rgba(139,92,246,0.3)`,
              borderRadius: '10px', padding: '11px 16px',
              color: C.purple, fontSize: '13px', fontWeight: '600', cursor: 'pointer',
              opacity: testLoading ? 0.6 : 1, transition: 'opacity 0.15s',
            }}>
              <Send size={14} /> {testLoading ? 'Enviando...' : 'Enviar prueba'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
function Toast({ message, type }) {
  const bg = type === 'error' ? C.red : type === 'success' ? C.green : C.blue;
  return (
    <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -14 }}
      style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 99999, background: bg, color: 'white', borderRadius: '10px', padding: '11px 18px', fontSize: '13px', fontWeight: '600', boxShadow: '0 4px 20px rgba(0,0,0,0.4)' }}
    >
      {message}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────
// Main AdminDashboard
// ─────────────────────────────────────────────────────────────
export function AdminDashboard() {
  const auth = useAuth();
  const { orders, counts, revenue, approveOrder, rejectOrder, deleteOrder, reload: reloadOrders } = useOrders();
  const { sessions, loading: sessionsLoading } = useSessions();
  const sellers = useSellers();

  const [activeSection, setActiveSection] = useState('overview');
  const [toast, setToast] = useState(null);
  // 'checking' | 'ok' | 'warning' | 'error'
  const [systemStatus, setSystemStatus] = useState('checking');

  // Health check rápido al montar (y cada 2 minutos)
  useEffect(() => {
    const check = async () => {
      try {
        const [cfgRes, sesRes] = await Promise.all([
          fetch(`${API_URL}/get-config`).catch(() => null),
          fetch(`${API_URL}/list-sessions`).catch(() => null),
        ]);
        const cfgOk = cfgRes?.ok;
        const sesOk = sesRes?.ok;
        if (cfgOk && sesOk) setSystemStatus('ok');
        else if (cfgOk || sesOk) setSystemStatus('warning');
        else setSystemStatus('error');
      } catch {
        setSystemStatus('error');
      }
    };
    check();
    const interval = setInterval(check, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Reactive mobile detection ───────────────────────────
  const [windowWidth, setWindowWidth] = useState(() => window.innerWidth);
  useEffect(() => {
    const handler = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  const isMobile = windowWidth < 768;

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Auth guard
  useEffect(() => {
    if (!auth.loading && !auth.isAdmin) window.location.href = '/';
  }, [auth.loading, auth.isAdmin]);

  const pendingBadge = counts.pending;
  const sectionLabel = NAV_ITEMS.find(n => n.id === activeSection)?.label || '';

  if (auth.loading) {
    return (
      <div style={{ height: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: C.text3 }}>Cargando...</div>
      </div>
    );
  }
  if (!auth.isAdmin) return null;

  const navSections = ['PRINCIPAL', 'GESTIÓN', 'SISTEMA'];

  return (
    <div style={{ display: 'flex', height: '100vh', background: C.bg, overflow: 'hidden', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* ── Sidebar (desktop only) */}
      <div style={{
        width: '240px', flexShrink: 0,
        background: C.sidebar, borderRight: `1px solid ${C.border}`,
        display: isMobile ? 'none' : 'flex', flexDirection: 'column',
        height: '100vh',
      }}>
        {/* Logo */}
        <div style={{ padding: '20px 20px 16px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '34px', height: '34px', borderRadius: '9px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap size={18} style={{ color: 'white' }} />
            </div>
            <div>
              <div style={{ color: C.text1, fontWeight: '700', fontSize: '15px', lineHeight: 1 }}>KTRL</div>
              <div style={{ color: C.text3, fontSize: '10px', letterSpacing: '1px', marginTop: '2px' }}>ADMIN</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 10px' }}>
          {navSections.map(section => {
            const items = NAV_ITEMS.filter(n => n.section === section);
            return (
              <div key={section} style={{ marginBottom: '18px' }}>
                <div style={{ color: C.text3, fontSize: '10px', fontWeight: '700', letterSpacing: '1.5px', padding: '4px 10px 6px' }}>{section}</div>
                {items.map(item => {
                  const isActive = activeSection === item.id;
                  return (
                    <button key={item.id} onClick={() => setActiveSection(item.id)}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 12px', borderRadius: '9px', border: 'none', cursor: 'pointer', background: isActive ? 'rgba(59,130,246,0.15)' : 'transparent', color: isActive ? C.blue : C.text2, fontSize: '13px', fontWeight: isActive ? '600' : '400', marginBottom: '2px', textAlign: 'left', position: 'relative', transition: 'all 0.12s' }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = C.text1; } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = C.text2; } }}
                    >
                      {isActive && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: '3px', height: '60%', background: C.blue, borderRadius: '0 3px 3px 0' }} />}
                      <item.Icon size={15} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {item.id === 'diagnostics' && (
                        <span title={systemStatus === 'ok' ? 'Servicios OK' : systemStatus === 'warning' ? 'Algunos servicios con problemas' : systemStatus === 'error' ? 'Servicios caídos' : 'Verificando...'} style={{
                          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                          background: systemStatus === 'ok' ? '#22c55e' : systemStatus === 'warning' ? '#f59e0b' : systemStatus === 'error' ? '#ef4444' : '#6b7280',
                          boxShadow: systemStatus === 'error' ? '0 0 6px #ef4444' : systemStatus === 'warning' ? '0 0 6px #f59e0b' : 'none',
                        }} />
                      )}
                      {item.badge && pendingBadge > 0 && (
                        <span style={{ background: C.amber, color: '#000', borderRadius: '999px', fontSize: '10px', fontWeight: '700', padding: '1px 7px', lineHeight: '16px' }}>{pendingBadge}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        {/* User + logout */}
        <div style={{ padding: '14px', borderTop: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px', padding: '6px 10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0, background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'white' }}>A</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ color: C.text1, fontSize: '12px', fontWeight: '600', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Administrador</div>
              <div style={{ color: C.text3, fontSize: '10px' }}>Admin</div>
            </div>
          </div>
          <button onClick={() => { auth.logout(); window.location.href = '/'; }}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 12px', borderRadius: '9px', border: 'none', cursor: 'pointer', background: 'rgba(239,68,68,0.08)', color: C.red, fontSize: '13px', fontWeight: '500', transition: 'background 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
          >
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </div>

      {/* ── Main content */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Top bar */}
        <div style={{ height: '60px', flexShrink: 0, borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', padding: '0 20px', gap: '12px' }}>
          {/* Mobile: logo + section label */}
          {isMobile ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={14} style={{ color: 'white' }} />
              </div>
              <span style={{ color: C.text1, fontWeight: '700', fontSize: '14px' }}>{sectionLabel || 'Dashboard'}</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
              <span style={{ color: C.text3 }}>Dashboard</span>
              {activeSection !== 'overview' && <>
                <ChevronRight size={13} style={{ color: C.text3 }} />
                <span style={{ color: C.text1, fontWeight: '600' }}>{sectionLabel}</span>
              </>}
            </div>
          )}

          <div style={{ flex: 1 }} />

          {/* Pending badge */}
          {pendingBadge > 0 && (
            <button onClick={() => setActiveSection('orders')}
              style={{ background: 'rgba(245,158,11,0.1)', border: `1px solid rgba(245,158,11,0.3)`, borderRadius: '8px', padding: '6px 11px', color: C.amber, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', fontWeight: '600' }}
            >
              <Bell size={13} /> {pendingBadge}
            </button>
          )}

          {/* System status dot — siempre visible en top bar */}
          <button
            onClick={() => setActiveSection('diagnostics')}
            title={systemStatus === 'ok' ? 'Servicios OK' : systemStatus === 'warning' ? 'Servicios con problemas — ver diagnóstico' : systemStatus === 'error' ? 'Servicios caídos — ver diagnóstico' : 'Verificando servicios...'}
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: C.text2, transition: 'all 0.12s' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.09)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
          >
            <span style={{
              width: 8, height: 8, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
              background: systemStatus === 'ok' ? '#22c55e' : systemStatus === 'warning' ? '#f59e0b' : systemStatus === 'error' ? '#ef4444' : '#6b7280',
              boxShadow: systemStatus === 'error' ? '0 0 6px #ef4444' : systemStatus === 'warning' ? '0 0 5px #f59e0b' : 'none',
            }} />
            {!isMobile && <span>{systemStatus === 'ok' ? 'Sistema OK' : systemStatus === 'warning' ? 'Advertencia' : systemStatus === 'error' ? 'Error' : 'Verificando'}</span>}
          </button>

          {/* Refresh */}
          <button onClick={reloadOrders}
            style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '7px 10px', color: C.text2, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px' }}
          >
            <RefreshCw size={13} />
            {!isMobile && <span>Actualizar</span>}
          </button>

          {/* Back */}
          <a href="/"
            style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.05)', border: `1px solid ${C.border}`, borderRadius: '8px', padding: '7px 11px', color: C.text2, fontSize: '12px', textDecoration: 'none', transition: 'all 0.12s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.09)'; e.currentTarget.style.color = C.text1; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = C.text2; }}
          >
            <ChevronLeft size={13} />
            {!isMobile && <span>Galería</span>}
          </a>
        </div>

        {/* Section content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '26px 28px', paddingBottom: isMobile ? '72px' : (isMobile ? '16px' : '26px') }}>

          {activeSection === 'overview' && (
            <OverviewSection orders={orders} counts={counts} revenue={revenue} sessions={sessions} sellers={sellers} approveOrder={approveOrder} rejectOrder={rejectOrder} showToast={showToast} setActiveSection={setActiveSection} />
          )}

          {activeSection === 'orders' && (
            <OrdersSection orders={orders} approveOrder={approveOrder} rejectOrder={rejectOrder} deleteOrder={deleteOrder} showToast={showToast} />
          )}

          {activeSection === 'sessions' && (
            <SessionsSection sessions={sessions} loading={sessionsLoading} showToast={showToast} onSessionCreated={() => window.location.reload()} />
          )}

          {activeSection === 'sellers' && (
            <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: '14px', overflow: 'hidden' }}>
              <AdminSellersPanel onClose={() => setActiveSection('overview')} sessions={sessions} embedded />
            </div>
          )}

          {activeSection === 'config' && (
            <div style={{ maxWidth: '700px' }}>
              <ConfigModal onClose={() => setActiveSection('overview')} showToast={showToast} embedded />
              <PushNotificationsCard showToast={showToast} />
            </div>
          )}

          {activeSection === 'diagnostics' && (
            <div style={{ maxWidth: '800px' }}>
              <DiagnosticModal onClose={() => setActiveSection('overview')} />
            </div>
          )}
        </div>

        {/* ── Bottom Tab Bar (mobile only) */}
        {isMobile && (
          <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            height: '58px',
            background: C.sidebar,
            borderTop: `1px solid ${C.border}`,
            display: 'flex', zIndex: 50000,
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}>
            {BOTTOM_TABS.map(item => {
              const isActive = activeSection === item.id;
              return (
                <button key={item.id} onClick={() => setActiveSection(item.id)}
                  style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px', border: 'none', background: 'none', cursor: 'pointer', color: isActive ? C.blue : C.text3, fontSize: '9px', fontWeight: isActive ? '700' : '400', letterSpacing: '0.2px', position: 'relative', paddingTop: '6px' }}
                >
                  {/* Active indicator line at top */}
                  {isActive && (
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '22px', height: '2px', background: C.blue, borderRadius: '0 0 3px 3px' }} />
                  )}
                  {/* Icon with badge */}
                  <div style={{ position: 'relative' }}>
                    <item.Icon size={22} />
                    {item.badge && pendingBadge > 0 && (
                      <div style={{ position: 'absolute', top: '-3px', right: '-5px', minWidth: '14px', height: '14px', borderRadius: '999px', background: C.amber, color: '#000', fontSize: '9px', fontWeight: '800', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 2px' }}>
                        {pendingBadge > 9 ? '9+' : pendingBadge}
                      </div>
                    )}
                    {item.id === 'diagnostics' && systemStatus !== 'checking' && (
                      <div style={{
                        position: 'absolute', top: '-3px', right: '-3px', width: 9, height: 9, borderRadius: '50%',
                        background: systemStatus === 'ok' ? '#22c55e' : systemStatus === 'warning' ? '#f59e0b' : '#ef4444',
                        border: '1.5px solid #0b0b0f',
                        boxShadow: systemStatus === 'error' ? '0 0 5px #ef4444' : 'none',
                      }} />
                    )}
                  </div>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast key="toast" message={toast.message} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}

export default AdminDashboard;
