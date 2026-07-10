import React from 'react';
import {
  Tag, MessageSquare, Plus, Store, Menu,
  Home, MapPin, Search, Bell, User,
} from 'lucide-react';
import { LogoSymbol } from './Brand';
import {
  SkeletonProductosGrid, SkeletonProductosList,
  SkeletonInbox, SkeletonFeed, SkeletonDemandas, SkeletonOfertas, SkeletonPerfil,
} from './Skeletons';

const dark   = localStorage.getItem('lokal-theme') !== 'light';
const brand  = '#00B8D9';
const bg     = dark ? '#060d1a' : '#f7f8fa';
const card   = dark ? '#0d1526' : '#ffffff';
const border = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)';
const muted  = dark ? 'rgba(255,255,255,0.32)' : '#94a3b8';
const text   = dark ? '#f1f5f9'  : '#0f172a';
const navBg  = dark ? 'rgba(13,21,38,0.92)' : 'rgba(255,255,255,0.85)';
const sh     = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';

function Bone({ w = '100%', h = 14, r = 8, style = {} }) {
  return <div style={{ width: w, height: h, borderRadius: r, background: sh, flexShrink: 0, animation: 'sk-sh 1.4s ease-in-out infinite', ...style }} />;
}

// ── Shell Tienda (StoreApp) ────────────────────────────────────────────────────
export function StoreShell() {
  const raw    = localStorage.getItem('lokal-shell');
  const shell  = raw ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : {};
  const screen = localStorage.getItem('lokal-store-screen') || 'productos';
  const nombre = shell.nombre || '';
  const foto   = shell.foto   || null;

  const NAV = [
    { id: 'productos', icon: Tag,          label: 'Productos', special: false },
    { id: 'mensajes',  icon: MessageSquare,label: 'Mensajes',  special: false },
    { id: '__crear__', icon: Plus,         label: 'Crear',     special: true  },
    { id: 'perfil',    icon: Store,        label: 'Mi tienda', special: false },
    { id: 'mas',       icon: Menu,         label: 'Más',       special: false },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`@keyframes sk-sh{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* ── Header — igual a StorePageHeader ── */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, height: 56, display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0 }}>
        {/* Avatar tienda */}
        <div style={{ width: 32, height: 32, borderRadius: 10, overflow: 'hidden', background: `${brand}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {foto
            ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Store size={16} color={brand} />}
        </div>
        {/* Título */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 900, fontSize: 15, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {nombre || <span style={{ background: sh, borderRadius: 6, display: 'inline-block', width: 100, height: 14 }} />}
          </div>
        </div>
        {/* Theme toggle placeholder */}
        <div style={{ width: 36, height: 36, borderRadius: 16, background: sh }} />
        {/* Avatar cuenta */}
        <div style={{ width: 36, height: 36, borderRadius: 16, background: sh }} />
      </div>

      {/* ── Contenido ── */}
      <div style={{ flex: 1, overflow: 'hidden', padding: 16 }}>
        <StoreContentSkeleton screen={screen} />
      </div>

      {/* ── Bottom nav — copia exacta del real ── */}
      <div style={{ background: navBg, borderTop: `1px solid ${border}`, backdropFilter: 'blur(20px)', paddingBottom: 'env(safe-area-inset-bottom)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', padding: '8px 8px 12px', maxWidth: 448, margin: '0 auto' }}>
          {NAV.map(({ id, icon: Icon, label, special }) => {
            const active = screen === id;
            if (special) return (
              <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 56, marginTop: -12 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: brand, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(0,184,217,0.4)' }}>
                  <Plus size={28} color="#fff" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: muted }}>Crear</span>
              </div>
            );
            return (
              <div key={id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, minWidth: 56 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? `${brand}1a` : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={active ? brand : muted} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: active ? brand : muted }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function StoreContentSkeleton({ screen }) {
  if (screen === 'mensajes')  return <SkeletonInbox count={6} />;
  if (screen === 'feed')      return <SkeletonFeed count={4} />;
  if (screen === 'perfil')    return <SkeletonPerfil />;
  if (screen === 'productos') return <SkeletonProductosGrid cols={2} count={6} />;
  return <SkeletonProductosGrid cols={2} count={4} />;
}

// ── Shell Cliente (App) ────────────────────────────────────────────────────────
export function ClientShell() {
  const raw    = localStorage.getItem('lokal-shell');
  const shell  = raw ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : {};
  const screen = shell.screen || 'home';

  const NAV = [
    { id: 'home',    icon: Home,    label: 'Inicio',  special: false },
    { id: 'tiendas', icon: Store,   label: 'Tiendas', special: false },
    { id: '__crear__', icon: Plus,  label: 'Crear',   special: true  },
    { id: 'mapa',    icon: MapPin,  label: 'Mapa',    special: false },
    { id: 'mas',     icon: Menu,    label: 'Más',     special: false },
  ];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: bg, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <style>{`@keyframes sk-sh{0%,100%{opacity:1}50%{opacity:.4}}`}</style>

      {/* ── Header — idéntico a HomeScreen mobile ── */}
      <div style={{ background: card, borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
        <div style={{ height: 56, display: 'flex', alignItems: 'center', padding: '0 12px', gap: 8 }}>
          {/* LogoSymbol — igual al real */}
          <div style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <LogoSymbol size={26} style={{ color: dark ? '#fff' : '#0f172a' }} />
          </div>
          {/* Search input — mismo estilo que ui-input bg-slate-100 */}
          <div style={{ flex: 1, position: 'relative' }}>
            <Search size={16} color={muted} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <div style={{
              height: 40, borderRadius: 12,
              background: dark ? 'rgba(255,255,255,0.06)' : '#f1f5f9',
              paddingLeft: 36,
              display: 'flex', alignItems: 'center',
            }}>
              <span style={{ fontSize: 14, color: muted }}>Buscar productos y tiendas...</span>
            </div>
          </div>
          {/* Bell */}
          <div style={{ width: 40, height: 40, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Bell size={18} color={muted} />
          </div>
          {/* Avatar — mismo tamaño que bell, fondo gris */}
          <div style={{ width: 40, height: 40, borderRadius: 16, background: sh, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <User size={16} color={muted} />
          </div>
        </div>
        {/* Categorías skeleton — igual a la barra debajo del header */}
        <div style={{ display: 'flex', gap: 8, padding: '4px 12px 10px', overflowX: 'hidden' }}>
          {[56, 56, 56, 56, 56].map((_, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, width: 58, flexShrink: 0 }}>
              <div style={{ width: 44, height: 44, borderRadius: 14, background: i === 0 ? brand : sh, animation: 'sk-sh 1.4s ease-in-out infinite' }} />
              <div style={{ width: 36, height: 8, borderRadius: 4, background: sh, animation: 'sk-sh 1.4s ease-in-out infinite' }} />
            </div>
          ))}
        </div>
      </div>

      {/* ── Contenido ── */}
      <div style={{ flex: 1, overflow: 'hidden', padding: '12px 16px 16px' }}>
        <ClientContentSkeleton screen={screen} />
      </div>

      {/* ── Bottom nav — copia exacta del real (backdrop-blur) ── */}
      <div style={{ background: navBg, borderTop: `1px solid ${border}`, backdropFilter: 'blur(20px) saturate(180%)', WebkitBackdropFilter: 'blur(20px) saturate(180%)', bottom: 'env(safe-area-inset-bottom)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', padding: '8px 4px 12px', maxWidth: 448, margin: '0 auto' }}>
          {NAV.map(({ id, icon: Icon, label, special }) => {
            const active = screen === id;
            if (special) return (
              <div key={id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: -14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: brand, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 18px rgba(0,184,217,0.45)' }}>
                  <Plus size={24} color="#fff" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, marginTop: 4, color: muted }}>Crear</span>
              </div>
            );
            return (
              <div key={id} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? (dark ? `${brand}22` : '#0f172a') : `${sh}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon size={20} color={active ? (dark ? brand : '#fff') : muted} strokeWidth={active ? 2.5 : 1.8} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 600, color: active ? brand : muted }}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ClientContentSkeleton({ screen }) {
  if (screen === 'todas-ofertas') return <SkeletonOfertas count={6} />;
  if (screen === 'chats')         return <SkeletonInbox count={5} />;
  return <SkeletonDemandas count={4} />;
}
