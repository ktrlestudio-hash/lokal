import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin, Phone, MessageCircle, Instagram, Globe,
  Clock, ShoppingBag, Plus, Minus, X, Search,
  Truck, RotateCcw, Shield, Star, Home, Heart,
  Tag, ChevronRight,
} from 'lucide-react';
import { buildWhatsAppUrl, getEstadoApertura, formatPrice } from '../utils.js';
import { FONT } from '../tokens.js';

export const META = {
  label: 'Market',
  desc: 'Dark premium: imagen full-bleed en cards, hero banner con CTA, sidebar en desktop.',
};

const F    = { fontFamily: FONT.family };
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const DAY_NAMES  = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const DAY_LABELS = { lunes:'Lunes', martes:'Martes', miercoles:'Miércoles', jueves:'Jueves', viernes:'Viernes', sabado:'Sábado', domingo:'Domingo' };
const todayKey   = DAY_NAMES[new Date().getDay()];

const norm = (p) => ({
  ...p,
  nombre: p.nombre || p.titulo || '',
  foto:   p.foto || p.fotos?.[0] || p.galeria?.[0] || null,
});

/* ─── GLOBAL CSS ─────────────────────────────────────────────────────────── */
const GLOBAL_CSS = `
  @keyframes mk-fade    { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
  @keyframes mk-pop     { 0%{transform:scale(1)} 40%{transform:scale(1.18)} 100%{transform:scale(1)} }
  @keyframes mk-shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }

  .mk-shimmer {
    background:linear-gradient(110deg,#1e2740 30%,#2a3555 50%,#1e2740 70%);
    background-size:200% 100%; animation:mk-shimmer 1.5s ease infinite;
  }
  .mk-shimmer-light {
    background:linear-gradient(110deg,#e2e8f0 30%,#f1f5f9 50%,#e2e8f0 70%);
    background-size:200% 100%; animation:mk-shimmer 1.5s ease infinite;
  }

  /* card */
  .mk-card { transition:transform .25s ${EASE}, box-shadow .25s ease; animation:mk-fade .35s ease both; cursor:pointer; }
  .mk-card:hover { transform:translateY(-4px) scale(1.01); box-shadow:0 20px 48px rgba(0,0,0,.45) !important; }
  .mk-card-img { transition:transform .55s ${EASE}; }
  .mk-card:hover .mk-card-img { transform:scale(1.08); }

  /* add button */
  .mk-add { transition:transform .15s ${EASE},background .1s; }
  .mk-add:active { transform:scale(0.88); }
  .mk-add.pop { animation:mk-pop .3s ${EASE}; }

  /* chips */
  .mk-chip { transition:background .15s,color .15s,transform .1s; }
  .mk-chip:active { transform:scale(0.93); }

  /* cat item sidebar */
  .mk-cat { transition:background .15s,color .15s; }
  .mk-cat:hover { background:rgba(255,255,255,.06) !important; }

  /* scrollbar hide */
  .mk-sb::-webkit-scrollbar { display:none; }
  .mk-sb { scrollbar-width:none; }

  /* ── RESPONSIVE ── */
  .mk-body   { padding:0 0 80px; }
  .mk-layout { display:block; }
  .mk-sidebar{ display:none; }
  .mk-grid   { grid-template-columns:repeat(2,1fr) !important; }
  .mk-chips  { display:flex; }
  .mk-hero   { height:220px; }
  .mk-bnav   { display:flex; }

  @media (min-width:768px) {
    .mk-body   { padding:0 0 40px; }
    .mk-layout { display:grid; grid-template-columns:240px 1fr; gap:0; align-items:start; max-width:1240px; margin:0 auto; }
    .mk-sidebar{ display:flex; flex-direction:column; gap:0; position:sticky; top:60px; height:calc(100vh - 60px); overflow-y:auto; border-right:1px solid rgba(255,255,255,.07); }
    .mk-main   { padding:20px 24px 40px; min-width:0; }
    .mk-grid   { grid-template-columns:repeat(auto-fill,minmax(180px,1fr)) !important; }
    .mk-chips  { display:none; }
    .mk-hero   { height:300px; }
    .mk-bnav   { display:none; }
    .mk-header-w { max-width:1240px; margin:0 auto; }
  }

  @media (min-width:1100px) {
    .mk-layout { grid-template-columns:260px 1fr; }
    .mk-grid   { grid-template-columns:repeat(auto-fill,minmax(200px,1fr)) !important; }
    .mk-hero   { height:360px; }
  }
`;

/* ─── QtySelector ───────────────────────────────────────────────────────── */
function QtySelector({ qty, onAdd, onRemove }) {
  const bg  = 'var(--tp-primary)';
  const clr = 'var(--tp-on-primary)';
  if (qty > 0) return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', background:bg, borderRadius:999, overflow:'hidden', height:32, width:84 }}>
      <button onClick={e=>{e.stopPropagation();onRemove();}}
        style={{ border:'none',background:'none',cursor:'pointer',color:clr,display:'flex',alignItems:'center',justifyContent:'center' }}
        onMouseDown={e=>e.currentTarget.style.background='rgba(0,0,0,.25)'} onMouseUp={e=>e.currentTarget.style.background=''} onMouseLeave={e=>e.currentTarget.style.background=''}>
        <Minus size={12}/>
      </button>
      <span style={{ display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:clr,background:'rgba(0,0,0,.18)',margin:'3px 0',borderRadius:999,...F }}>{qty}</span>
      <button onClick={e=>{e.stopPropagation();onAdd();}}
        style={{ border:'none',background:'none',cursor:'pointer',color:clr,display:'flex',alignItems:'center',justifyContent:'center' }}
        onMouseDown={e=>e.currentTarget.style.background='rgba(0,0,0,.25)'} onMouseUp={e=>e.currentTarget.style.background=''} onMouseLeave={e=>e.currentTarget.style.background=''}>
        <Plus size={12}/>
      </button>
    </div>
  );
  return null;
}

/* ─── ProductCard — full bleed ──────────────────────────────────────────── */
function ProductCard({ p, qty, onAdd, onRemove, isDark }) {
  const [popping, setPopping] = useState(false);
  const sinStock  = p.activo === false;
  const hasDisc   = p.precioOriginal != null && p.precioOriginal > (p.precio ?? 0);
  const descPct   = hasDisc ? Math.round((1 - p.precio / p.precioOriginal) * 100) : null;
  const isNew     = p.esNuevo || p.nuevo;
  const bdr       = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  const cardBg    = isDark ? '#111827' : '#fff';

  const handleAdd = (e) => {
    e.stopPropagation();
    onAdd(p);
    setPopping(true);
    setTimeout(() => setPopping(false), 320);
  };

  return (
    <article className="mk-card" style={{ background:cardBg, borderRadius:18, overflow:'hidden', boxShadow:'0 4px 20px rgba(0,0,0,.25)', border:`1px solid ${bdr}`, position:'relative', aspectRatio:'1/1.2', display:'flex', flexDirection:'column' }}>
      {/* imagen full bleed */}
      <div style={{ position:'relative', flex:1, overflow:'hidden', minHeight:0 }}>
        {p.foto
          ? <img className="mk-card-img" src={p.foto} alt={p.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:48, opacity:.1, background: isDark ? '#1e2740' : '#f1f5f9' }}>🛍</div>
        }
        {/* gradiente base */}
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,.3) 45%, rgba(0,0,0,.0) 100%)' }}/>

        {/* badges top-left */}
        <div style={{ position:'absolute', top:8, left:8, display:'flex', flexDirection:'column', gap:4 }}>
          {descPct && !sinStock && (
            <span style={{ background:'var(--tp-primary)', color:'var(--tp-on-primary)', fontSize:9, fontWeight:900, padding:'3px 8px', borderRadius:999, letterSpacing:'.03em', boxShadow:'0 2px 8px rgba(0,0,0,.35)', ...F }}>-{descPct}%</span>
          )}
          {isNew && !sinStock && (
            <span style={{ background:'rgba(255,255,255,.15)', backdropFilter:'blur(6px)', color:'#fff', fontSize:9, fontWeight:800, padding:'3px 8px', borderRadius:999, border:'1px solid rgba(255,255,255,.25)', ...F }}>NEW</span>
          )}
        </div>

        {/* overlay sin stock */}
        {sinStock && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)', backdropFilter:'blur(3px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ background:'rgba(239,68,68,.85)', color:'#fff', fontSize:11, fontWeight:800, padding:'5px 14px', borderRadius:999, ...F }}>Sin stock</span>
          </div>
        )}

        {/* info superpuesta abajo */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'10px 10px 8px' }}>
          <p style={{ margin:'0 0 4px', fontSize:12, fontWeight:700, color:'#fff', lineHeight:1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', textShadow:'0 1px 4px rgba(0,0,0,.6)', paddingRight: sinStock ? 0 : 36, ...F }}>{p.nombre}</p>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:5 }}>
              {p.precio != null
                ? <>
                    <span style={{ fontSize:14, fontWeight:900, color:'var(--tp-primary)', letterSpacing:'-.02em', textShadow:'0 1px 6px rgba(0,0,0,.5)', ...F }}>{formatPrice(p.precio)}</span>
                    {hasDisc && <span style={{ fontSize:10, fontWeight:500, color:'rgba(255,255,255,.55)', textDecoration:'line-through', ...F }}>{formatPrice(p.precioOriginal)}</span>}
                  </>
                : <span style={{ fontSize:11, fontWeight:700, color:'var(--tp-primary)', ...F }}>Consultar</span>
              }
            </div>
            {/* qty o botón + */}
            {!sinStock && (
              qty > 0
                ? <QtySelector qty={qty} onAdd={()=>onAdd(p)} onRemove={()=>onRemove(p.id)}/>
                : <button onClick={handleAdd} className={`mk-add${popping?' pop':''}`}
                    style={{ width:32, height:32, borderRadius:999, border:'none', background:'var(--tp-primary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tp-on-primary)', boxShadow:'0 4px 12px rgba(0,0,0,.4)', flexShrink:0 }}>
                    <Plus size={15}/>
                  </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── Hero Banner ───────────────────────────────────────────────────────── */
function HeroBanner({ tienda, abierta, textoApertura, onCatalog, isDark }) {
  const cover  = tienda.portada || tienda.banner || tienda.foto || null;
  const ciudad = tienda.ciudad?.split(',')[0]?.trim();

  return (
    <div className="mk-hero" style={{ position:'relative', overflow:'hidden', background:'#0a0d16' }}>
      {cover
        ? <img src={cover} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block', opacity:.5 }}/>
        : <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#1a2744 0%,#0d1526 100%)' }}/>
      }
      {/* capas de gradiente */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to right, rgba(0,0,0,.75) 0%, rgba(0,0,0,.2) 60%, transparent 100%)' }}/>
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,.6) 0%, transparent 50%)' }}/>

      {/* contenido */}
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'20px 20px 24px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
          {/* logo */}
          <div style={{ width:52, height:52, borderRadius:16, overflow:'hidden', flexShrink:0, background:tienda.logo?'transparent':'var(--tp-primary)', border:'2px solid rgba(255,255,255,.2)', boxShadow:'0 4px 20px rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            {tienda.logo
              ? <img src={tienda.logo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <span style={{ fontSize:18, fontWeight:900, color:'#fff', ...F }}>{tienda.nombre?.[0]?.toUpperCase()||'T'}</span>
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <h1 style={{ margin:'0 0 5px', fontSize:'clamp(1.1rem,5vw,1.9rem)', fontWeight:900, color:'#fff', lineHeight:1.1, textShadow:'0 2px 12px rgba(0,0,0,.5)', ...F }}>{tienda.nombre}</h1>
            <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
              {textoApertura && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:10, fontWeight:700, color:'#fff', background:abierta?'rgba(16,185,129,.3)':'rgba(239,68,68,.3)', backdropFilter:'blur(8px)', border:`1px solid ${abierta?'rgba(16,185,129,.5)':'rgba(239,68,68,.5)'}`, padding:'3px 9px', borderRadius:999, ...F }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:abierta?'#34d399':'#f87171', display:'inline-block' }}/>
                  {textoApertura}
                </span>
              )}
              {ciudad && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:600, color:'rgba(255,255,255,.8)', background:'rgba(255,255,255,.12)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.2)', padding:'3px 9px', borderRadius:999, ...F }}>
                  <MapPin size={9}/>{ciudad}
                </span>
              )}
              {tienda.rating && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:3, fontSize:10, fontWeight:700, color:'var(--tp-primary)', background:'rgba(0,0,0,.3)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,.15)', padding:'3px 9px', borderRadius:999, ...F }}>
                  <Star size={9} style={{ fill:'var(--tp-primary)', color:'var(--tp-primary)' }}/>{tienda.rating}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CTA */}
        <button onClick={onCatalog}
          style={{ alignSelf:'flex-start', display:'flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:12, border:'none', background:'var(--tp-primary)', color:'var(--tp-on-primary)', fontSize:13, fontWeight:800, cursor:'pointer', boxShadow:'0 4px 20px rgba(0,0,0,.4)', ...F }}>
          <ShoppingBag size={15}/> Ver catálogo
        </button>
      </div>
    </div>
  );
}

/* ─── Sidebar Desktop ───────────────────────────────────────────────────── */
function SidebarDesktop({ tienda, categorias, catSel, onSelect, isDark, abierta }) {
  const txt  = '#e2e8f0';
  const txtM = '#8899b4';
  const bdr  = 'rgba(255,255,255,.07)';
  const pri  = 'var(--tp-primary)';
  const bg   = isDark ? '#0d1526' : '#111827';

  const trustItems = [
    tienda.envio   && { icon:Truck,     label:'Envío disponible' },
    tienda.cambios && { icon:RotateCcw, label:'Aceptan cambios' },
    { icon:Shield, label:'Pago seguro' },
  ].filter(Boolean);

  return (
    <aside className="mk-sidebar" style={{ background:bg }}>
      {/* store info top */}
      <div style={{ padding:'20px 20px 16px', borderBottom:`1px solid ${bdr}` }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
          <div style={{ width:40, height:40, borderRadius:12, overflow:'hidden', flexShrink:0, background:tienda.logo?'transparent':'var(--tp-primary)', display:'flex', alignItems:'center', justifyContent:'center', border:'1px solid rgba(255,255,255,.1)' }}>
            {tienda.logo
              ? <img src={tienda.logo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <span style={{ fontSize:14, fontWeight:900, color:'#fff', ...F }}>{tienda.nombre?.[0]?.toUpperCase()||'T'}</span>
            }
          </div>
          <div>
            <p style={{ margin:0, fontSize:13, fontWeight:800, color:txt, ...F }}>{tienda.nombre}</p>
            <div style={{ display:'flex', alignItems:'center', gap:4, marginTop:2 }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:abierta?'#34d399':'#f87171', display:'inline-block' }}/>
              <span style={{ fontSize:10, fontWeight:700, color:abierta?'#34d399':'#f87171', ...F }}>{abierta?'Abierto':'Cerrado'}</span>
            </div>
          </div>
        </div>
        {tienda.descripcion && (
          <p style={{ margin:0, fontSize:11, color:txtM, lineHeight:1.6, display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden', ...F }}>{tienda.descripcion}</p>
        )}
      </div>

      {/* Categorías */}
      {categorias.length > 0 && (
        <div style={{ padding:'16px 0', borderBottom:`1px solid ${bdr}` }}>
          <p style={{ margin:'0 0 8px', padding:'0 20px', fontSize:10, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.08em', ...F }}>Categorías</p>
          {['Todos', ...categorias].map(cat => {
            const active = cat==='Todos' ? catSel===null : catSel===cat;
            return (
              <button key={cat} onClick={()=>onSelect(cat==='Todos'?null:cat)} className="mk-cat"
                style={{ display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', padding:'9px 20px', border:'none', background:active?'rgba(255,255,255,.07)':'transparent', cursor:'pointer', textAlign:'left' }}>
                <span style={{ fontSize:13, fontWeight:active?700:400, color:active?'#fff':txtM, ...F }}>{cat}</span>
                {active && <div style={{ width:5, height:5, borderRadius:'50%', background:pri }}/>}
              </button>
            );
          })}
        </div>
      )}

      {/* Horarios */}
      {tienda.horarios && (
        <div style={{ padding:'16px 0', borderBottom:`1px solid ${bdr}` }}>
          <p style={{ margin:'0 0 8px', padding:'0 20px', fontSize:10, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.08em', ...F }}>Horarios</p>
          {Object.entries(tienda.horarios).map(([key, schedule]) => {
            const isToday = key === todayKey;
            return (
              <div key={key} style={{ display:'flex', justifyContent:'space-between', padding:'6px 20px', background:isToday?'rgba(255,255,255,.05)':'transparent' }}>
                <span style={{ fontSize:11, fontWeight:isToday?700:400, color:isToday?pri:txtM, ...F }}>{DAY_LABELS[key]}</span>
                <span style={{ fontSize:11, fontWeight:600, color:isToday?pri:txt, ...F }}>{schedule||'Cerrado'}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Trust */}
      {trustItems.length > 0 && (
        <div style={{ padding:'16px 20px', borderBottom:`1px solid ${bdr}`, display:'flex', flexDirection:'column', gap:10 }}>
          {trustItems.map(({ icon:Icon, label }, i) => (
            <div key={i} style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Icon size={13} style={{ color:pri, flexShrink:0 }}/>
              <span style={{ fontSize:12, fontWeight:600, color:txtM, ...F }}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* Contacto */}
      <div style={{ padding:'16px 0' }}>
        <p style={{ margin:'0 0 8px', padding:'0 20px', fontSize:10, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.08em', ...F }}>Contacto</p>
        {[
          tienda.whatsapp  && { icon:MessageCircle, label:'WhatsApp',  href:`https://wa.me/${tienda.whatsapp.replace(/\D/g,'')}`, color:'#25d366' },
          tienda.instagram && { icon:Instagram,     label:`@${tienda.instagram.replace('@','')}`, href:`https://instagram.com/${tienda.instagram.replace('@','')}`, color:'#e1306c' },
          tienda.website   && { icon:Globe,         label:'Sitio web', href:tienda.website, color:pri },
          tienda.telefono  && { icon:Phone,         label:tienda.telefono, href:`tel:${tienda.telefono}`, color:pri },
        ].filter(Boolean).map(({ icon:Icon, label, href, color }, i) => (
          <a key={i} href={href} target="_blank" rel="noopener noreferrer"
            style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 20px', textDecoration:'none' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,.05)'}
            onMouseLeave={e=>e.currentTarget.style.background=''}>
            <Icon size={14} style={{ color, flexShrink:0 }}/>
            <span style={{ fontSize:12, fontWeight:600, color:txt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', ...F }}>{label}</span>
            <ChevronRight size={12} style={{ color:txtM, marginLeft:'auto', flexShrink:0 }}/>
          </a>
        ))}
      </div>
    </aside>
  );
}

/* ─── Horarios Modal ────────────────────────────────────────────────────── */
function HorariosModal({ tienda, isDark, onClose }) {
  const surf = isDark ? '#1e293b' : '#fff';
  const txt  = isDark ? '#f1f5f9' : '#0f172a';
  const txtM = isDark ? '#94a3b8' : '#64748b';
  const bdr  = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)';
  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.6)' }} onClick={onClose}/>
      <div style={{ position:'relative', background:surf, borderRadius:'22px 22px 0 0', padding:'16px 18px 36px', ...F }}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:bdr }}/>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <span style={{ fontSize:15, fontWeight:800, color:txt }}>Horarios</span>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:10, border:'none', background:isDark?'rgba(255,255,255,.08)':'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txt }}>
            <X size={16}/>
          </button>
        </div>
        {Object.entries(tienda.horarios||{}).map(([key, schedule]) => {
          const isToday = key === todayKey;
          return (
            <div key={key} style={{ display:'flex', justifyContent:'space-between', padding:'9px 12px', borderRadius:10, background:isToday?'var(--tp-primary-soft,rgba(0,184,217,.08))':'transparent', marginBottom:2 }}>
              <span style={{ fontSize:13, fontWeight:isToday?700:500, color:isToday?'var(--tp-primary)':txtM, ...F }}>{DAY_LABELS[key]}{isToday?' · Hoy':''}</span>
              <span style={{ fontSize:13, fontWeight:700, color:schedule?(isToday?'var(--tp-primary)':txt):txtM, ...F }}>{schedule||'Cerrado'}</span>
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}

/* ─── Cart Modal ────────────────────────────────────────────────────────── */
function CartModal({ cart, onAdd, onRemove, wa, isDark, onClose }) {
  const surf = isDark ? '#1a2030' : '#fff';
  const txt  = isDark ? '#f1f5f9' : '#0f172a';
  const txtM = isDark ? '#8899b4' : '#64748b';
  const bdr  = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)';
  const total = cart.reduce((s,i)=>s+(i.precio||0)*i.qty,0);
  const count = cart.reduce((s,i)=>s+i.qty,0);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.65)' }} onClick={onClose}/>
      <div style={{ position:'relative', background:surf, borderRadius:'22px 22px 0 0', maxHeight:'82dvh', display:'flex', flexDirection:'column', ...F }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:bdr }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 18px 12px', borderBottom:`1px solid ${bdr}` }}>
          <span style={{ fontSize:16, fontWeight:800, color:txt }}>Tu pedido ({count})</span>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:10, border:'none', background:isDark?'rgba(255,255,255,.08)':'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txt }}>
            <X size={16}/>
          </button>
        </div>
        <div style={{ overflowY:'auto', padding:'8px 16px', flex:1 }}>
          {cart.map(item => (
            <div key={item.id} style={{ display:'grid', gridTemplateColumns:'52px 1fr auto', alignItems:'center', gap:12, padding:'12px 0', borderBottom:`1px solid ${bdr}` }}>
              <div style={{ width:52, height:52, borderRadius:12, overflow:'hidden', background:isDark?'rgba(255,255,255,.06)':'#f1f5f9', flexShrink:0 }}>
                {(item.foto||item.fotos?.[0])
                  ? <img src={item.foto||item.fotos[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20 }}>📦</div>
                }
              </div>
              <div style={{ minWidth:0 }}>
                <p style={{ margin:'0 0 3px', fontSize:13, fontWeight:700, color:txt, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.nombre||item.titulo}</p>
                {item.precio != null && (
                  <p style={{ margin:0, fontSize:13, fontWeight:800, color:'var(--tp-primary)' }}>{formatPrice(item.precio*item.qty)}</p>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <button onClick={()=>onAdd(item)} style={{ width:26, height:26, borderRadius:999, border:'none', background:'var(--tp-primary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tp-on-primary)' }}><Plus size={12}/></button>
                <span style={{ fontSize:13, fontWeight:800, color:txt }}>{item.qty}</span>
                <button onClick={()=>onRemove(item.id)} style={{ width:26, height:26, borderRadius:999, border:`1px solid ${bdr}`, background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txtM }}><Minus size={12}/></button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding:'14px 18px', paddingBottom:'calc(14px + env(safe-area-inset-bottom))', borderTop:`1px solid ${bdr}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
            <span style={{ fontSize:13, color:txtM, fontWeight:600 }}>Total estimado</span>
            <span style={{ fontSize:20, fontWeight:900, color:txt }}>{formatPrice(total)}</span>
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'#25d366', color:'#fff', padding:'15px', borderRadius:16, textDecoration:'none', fontWeight:800, fontSize:15, boxShadow:'0 4px 20px rgba(37,211,102,.4)', ...F }}>
              <MessageCircle size={18}/> Confirmar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

/* ─── TEMPLATE PRINCIPAL ────────────────────────────────────────────────── */
export function TemplateMarket({ tienda, secciones, cart, onAdd, onRemove, isDark }) {
  const s  = Object.fromEntries(secciones.map(sec=>[sec.id,sec]));
  const wa = buildWhatsAppUrl(tienda, cart, '');
  const { abierta, texto: textoApertura } = getEstadoApertura(tienda.horarios);

  const [catSel,    setCatSel]    = useState(null);
  const [sortSel,   setSortSel]   = useState('default');
  const [search,    setSearch]    = useState('');
  const [cartOpen,  setCartOpen]  = useState(false);
  const [horasOpen, setHorasOpen] = useState(false);
  const [searchOpen,setSearchOpen]= useState(false);
  const catalogRef = useRef(null);

  /* paleta — siempre dark para este template, respeta isDark solo en modales */
  const bg   = '#080c18';
  const surf = '#0e1525';
  const txt  = '#e2e8f0';
  const txtM = '#8899b4';
  const bdr  = 'rgba(255,255,255,.07)';

  const productosRaw = useMemo(()=>(tienda.productos||[]).map(norm),[tienda.productos]);
  const categorias   = useMemo(()=>[...new Set(productosRaw.map(p=>p.categoria).filter(Boolean))],[productosRaw]);

  const productos = useMemo(()=>{
    const activos  = productosRaw.filter(p=>p.activo!==false);
    const sinStock = productosRaw.filter(p=>p.activo===false);
    let list = [...activos,...sinStock];
    if (catSel) list = list.filter(p=>p.categoria===catSel);
    if (search)  list = list.filter(p=>p.nombre?.toLowerCase().includes(search.toLowerCase()));
    if (sortSel==='precio-asc')  list=[...list].sort((a,b)=>(a.precio||0)-(b.precio||0));
    if (sortSel==='precio-desc') list=[...list].sort((a,b)=>(b.precio||0)-(a.precio||0));
    if (sortSel==='novedad')     list=[...list].reverse();
    return list;
  },[productosRaw,catSel,search,sortSel]);

  const cartCount = cart.reduce((s,i)=>s+i.qty,0);

  const SORTS = [
    { id:'default',    label:'Destacados' },
    { id:'precio-asc', label:'Precio ↑' },
    { id:'precio-desc',label:'Precio ↓' },
    { id:'novedad',    label:'Nuevo' },
  ];

  return (
    <div style={{ background:bg, minHeight:'100dvh', ...F, color:txt }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Hero ── */}
      <HeroBanner
        tienda={tienda} abierta={abierta} textoApertura={textoApertura} isDark
        onCatalog={()=>catalogRef.current?.scrollIntoView({ behavior:'smooth', block:'start' })}
      />

      {/* ── Header sticky ── */}
      <header style={{ position:'sticky', top:0, zIndex:100, background:surf, borderBottom:`1px solid ${bdr}`, backdropFilter:'blur(12px)' }}>
        <div className="mk-header-w" style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px' }}>
          <div style={{ flex:1, minWidth:0, display:'flex', alignItems:'center', gap:8 }}>
            {textoApertura && (
              <span style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, fontWeight:700, color:abierta?'#34d399':'#f87171', flexShrink:0, ...F }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:'currentColor', display:'inline-block', animation:abierta?'none':'none' }}/>
                {textoApertura}
              </span>
            )}
            {tienda.horarios && (
              <button onClick={()=>setHorasOpen(true)} style={{ display:'flex', alignItems:'center', gap:3, fontSize:10, fontWeight:600, color:txtM, background:'none', border:'none', cursor:'pointer', padding:0, flexShrink:0, ...F }}>
                <Clock size={10}/> Horarios
              </button>
            )}
          </div>

          <div style={{ display:'flex', alignItems:'center', gap:6, flexShrink:0 }}>
            {/* search */}
            <button onClick={()=>setSearchOpen(v=>!v)}
              style={{ display:'flex', alignItems:'center', gap:6, height:34, padding:'0 12px', borderRadius:10, border:`1px solid ${bdr}`, background:searchOpen?'var(--tp-primary)':'rgba(255,255,255,.06)', cursor:'pointer', color:searchOpen?'var(--tp-on-primary)':txt, fontSize:12, fontWeight:600, transition:'all .15s', ...F }}>
              <Search size={14}/>
              <span>Buscar</span>
            </button>
            {/* cart */}
            {wa && (
              <button onClick={()=>cartCount>0&&setCartOpen(true)}
                style={{ position:'relative', width:36, height:36, borderRadius:10, border:`1px solid ${bdr}`, background:'rgba(255,255,255,.06)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txt }}>
                <ShoppingBag size={16}/>
                {cartCount>0 && (
                  <span style={{ position:'absolute', top:-5, right:-5, background:'var(--tp-primary)', color:'var(--tp-on-primary)', borderRadius:999, minWidth:18, height:18, fontSize:9, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px', ...F }}>
                    {cartCount}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* search expandido */}
        {searchOpen && (
          <div className="mk-header-w" style={{ padding:'0 14px 10px' }}>
            <div style={{ position:'relative' }}>
              <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:txtM, pointerEvents:'none' }}/>
              <input autoFocus value={search} onChange={e=>setSearch(e.target.value)}
                placeholder={`Buscar en ${tienda.nombre}...`}
                style={{ width:'100%', height:38, borderRadius:10, border:`1px solid ${bdr}`, background:'rgba(255,255,255,.06)', padding:'0 36px 0 34px', fontSize:13, color:txt, outline:'none', boxSizing:'border-box', ...F }}/>
              {search && (
                <button onClick={()=>setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:txtM, display:'flex' }}>
                  <X size={13}/>
                </button>
              )}
            </div>
          </div>
        )}

        {/* chips categoría mobile */}
        {s.productos?.activa && categorias.length>0 && (
          <div className="mk-chips mk-sb" style={{ gap:6, overflowX:'auto', padding:'0 14px 10px' }}>
            {['Todos',...categorias].map(cat=>{
              const active = cat==='Todos'?catSel===null:catSel===cat;
              return (
                <button key={cat} onClick={()=>setCatSel(cat==='Todos'?null:cat)} className="mk-chip"
                  style={{ flexShrink:0, padding:'5px 14px', borderRadius:999, border:`1px solid ${active?'transparent':bdr}`, background:active?'var(--tp-primary)':'rgba(255,255,255,.06)', color:active?'var(--tp-on-primary)':txtM, fontSize:11, fontWeight:700, cursor:'pointer', ...F }}>
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ── Body ── */}
      <div className="mk-body">
        <div className="mk-layout">
          {/* sidebar desktop */}
          <SidebarDesktop
            tienda={tienda} categorias={categorias} catSel={catSel} onSelect={setCatSel}
            isDark abierta={abierta} textoApertura={textoApertura}
          />

          {/* main */}
          <main className="mk-main" ref={catalogRef} style={{ padding:'16px 14px 20px' }}>
            {s.productos?.activa && (
              <>
                {/* sort + contador */}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <div className="mk-sb" style={{ display:'flex', gap:6, overflowX:'auto', flex:1 }}>
                    {SORTS.map(sort=>{
                      const active=sortSel===sort.id;
                      return (
                        <button key={sort.id} onClick={()=>setSortSel(sort.id)} className="mk-chip"
                          style={{ flexShrink:0, padding:'5px 12px', borderRadius:999, border:`1px solid ${active?'transparent':bdr}`, background:active?'var(--tp-primary)':'rgba(255,255,255,.06)', color:active?'var(--tp-on-primary)':txtM, fontSize:11, fontWeight:700, cursor:'pointer', transition:'all .15s', ...F }}>
                          {sort.label}
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontSize:11, color:txtM, fontWeight:600, marginLeft:10, flexShrink:0, ...F }}>{productos.length} items</span>
                </div>

                {/* grid */}
                {productos.length===0
                  ? search
                    ? <p style={{ textAlign:'center', color:txtM, fontSize:14, padding:'60px 0' }}>Sin resultados para "{search}"</p>
                    : (
                      <div className="mk-grid" style={{ display:'grid', gap:12 }}>
                        {[1,2,3,4].map(i=>(
                          <div key={i} style={{ borderRadius:18, overflow:'hidden', aspectRatio:'1/1.2' }}>
                            <div className="mk-shimmer" style={{ width:'100%', height:'100%' }}/>
                          </div>
                        ))}
                      </div>
                    )
                  : (
                    <div className="mk-grid" style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:12 }}>
                      {productos.map(p=>{
                        const qty=cart?.find(c=>c.id===p.id)?.qty||0;
                        return <ProductCard key={p.id} p={p} qty={qty} onAdd={onAdd} onRemove={onRemove} isDark/>;
                      })}
                    </div>
                  )
                }
              </>
            )}

            {/* descripción */}
            {s.sobre?.activa && tienda.descripcion && (
              <div style={{ background:'rgba(255,255,255,.04)', borderRadius:14, padding:'14px 16px', border:`1px solid ${bdr}`, marginTop:20 }}>
                <p style={{ margin:0, fontSize:13, color:txtM, lineHeight:1.7, ...F }}>{tienda.descripcion}</p>
              </div>
            )}
          </main>
        </div>
      </div>

      {/* ── CTA flotante ── */}
      {wa && cart.length>0 && (() => {
        const total=cart.reduce((s,i)=>s+(i.precio||0)*i.qty,0);
        return (
          <button onClick={()=>setCartOpen(true)}
            style={{ position:'fixed', left:'50%', transform:'translateX(-50%)', bottom:72, zIndex:200, width:'calc(100% - 28px)', maxWidth:480, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', background:'var(--tp-primary)', color:'var(--tp-on-primary)', border:'none', borderRadius:18, cursor:'pointer', fontWeight:800, fontSize:15, ...F, boxShadow:'0 8px 40px rgba(0,0,0,.5)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <ShoppingBag size={18}/><span>Ver pedido</span>
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <span style={{ background:'rgba(0,0,0,.22)', borderRadius:8, padding:'3px 10px', fontSize:13 }}>{cartCount}</span>
              <span style={{ background:'rgba(0,0,0,.22)', borderRadius:8, padding:'3px 10px', fontSize:13 }}>{formatPrice(total)}</span>
            </div>
          </button>
        );
      })()}

      {/* ── Bottom Nav mobile ── */}
      <nav className="mk-bnav" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:150, background:surf, borderTop:`1px solid ${bdr}`, padding:'8px 0', paddingBottom:'calc(8px + env(safe-area-inset-bottom))', justifyContent:'space-around', alignItems:'center' }}>
        {[
          { icon:Home,        label:'Inicio',  action:()=>window.scrollTo({top:0,behavior:'smooth'}) },
          { icon:Search,      label:'Buscar',  action:()=>setSearchOpen(v=>!v) },
          { icon:ShoppingBag, label:'Pedido',  action:()=>cartCount>0&&setCartOpen(true), badge:cartCount },
          { icon:MessageCircle,label:'WA',     action:()=>tienda.whatsapp&&window.open(`https://wa.me/${tienda.whatsapp.replace(/\D/g,'')}`) },
        ].map(({ icon:Icon, label, action, badge }, i) => (
          <button key={i} onClick={action}
            style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:3, background:'none', border:'none', cursor:'pointer', color:txtM, position:'relative', padding:'4px 12px' }}>
            {badge>0 && (
              <span style={{ position:'absolute', top:0, right:6, background:'var(--tp-primary)', color:'var(--tp-on-primary)', borderRadius:999, minWidth:16, height:16, fontSize:8, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px', ...F }}>{badge}</span>
            )}
            <Icon size={18}/>
            <span style={{ fontSize:9, fontWeight:600, ...F }}>{label}</span>
          </button>
        ))}
      </nav>

      {cartOpen  && <CartModal cart={cart} onAdd={onAdd} onRemove={onRemove} wa={wa} isDark={isDark} onClose={()=>setCartOpen(false)}/>}
      {horasOpen && <HorariosModal tienda={tienda} isDark={isDark} onClose={()=>setHorasOpen(false)}/>}
    </div>
  );
}
