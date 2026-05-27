export const META = {
  label: 'Detail 3',
  desc: 'Liquid glass 2026: tilt cards, shimmer, pill CTA, hero cinético con letter-spacing scroll.',
};

import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin, Navigation, Phone, MessageCircle, Instagram,
  Globe, Clock, Package, ChevronLeft, ChevronRight,
  ShoppingBag, Plus, Minus, X, Search,
} from 'lucide-react';
const MapaSection = lazy(() => import('../sections/MapaSection.jsx').then(m => ({ default: m.MapaSection })));
import { buildWhatsAppUrl, getEstadoApertura, formatPrice } from '../utils.js';
import { FONT } from '../tokens.js';

const F      = { fontFamily: FONT.family };
const EASE   = 'cubic-bezier(0.22,1,0.36,1)';
const BOUNCE = 'cubic-bezier(0.34, 1.56, 0.64, 1)';

const DAY_NAMES  = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const DAY_LABELS = { lunes:'Lunes', martes:'Martes', miercoles:'Miércoles', jueves:'Jueves', viernes:'Viernes', sabado:'Sábado', domingo:'Domingo' };
const todayKey   = DAY_NAMES[new Date().getDay()];

const norm = (p) => ({
  ...p,
  nombre: p.nombre || p.titulo || '',
  foto:   p.foto || p.fotos?.[0] || p.galeria?.[0] || null,
});

const fadeIn = (delay = 0) => ({
  animation: `d3-fade-up .5s ${EASE} ${delay}ms both`,
});

const GLOBAL_CSS = `
  @keyframes d3-fade-up {
    from { opacity:0; transform:translateY(20px); }
    to   { opacity:1; transform:translateY(0); }
  }
  @keyframes d3-pulse {
    0%,100% { opacity:1; }
    50%      { opacity:.4; }
  }
  @keyframes d3-shimmer {
    0%   { background-position: -200% 0; }
    100% { background-position:  200% 0; }
  }
  .d3-card:hover .d3-card-img { transform: scale(1.05) !important; }
  .d3-card:hover { box-shadow: 0 16px 48px rgba(0,0,0,.16) !important; }
  .d3-card { transition: box-shadow .35s ${EASE} !important; }
  .d3-card-img { transition: transform .5s ${EASE} !important; }
  .d3-action:hover { filter: brightness(1.08); transform: scale(1.04); }
  .d3-action { transition: filter .2s ease, transform .25s ${EASE}; }
  .d3-shimmer {
    background: linear-gradient(110deg, rgba(255,255,255,0) 40%, rgba(255,255,255,.12) 50%, rgba(255,255,255,0) 60%);
    background-size: 200% 100%;
    animation: d3-shimmer 1.6s ease infinite;
  }
  .d3-liquid-border {
    border: 0.5px solid rgba(255,255,255,.25) !important;
    position: relative;
  }
  .d3-liquid-border::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, rgba(255,255,255,.35) 0%, rgba(255,255,255,.05) 50%, rgba(255,255,255,.25) 100%);
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    opacity: 0.6;
  }
  .d3-liquid-shine {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: linear-gradient(135deg, rgba(255,255,255,.22) 0%, transparent 40%, rgba(255,255,255,.08) 70%, transparent 100%);
    pointer-events: none;
    mix-blend-mode: overlay;
  }
  .d3-qty-btn { transition: transform .15s ${BOUNCE}, background .1s ease !important; }
  .d3-qty-btn:active { transform: scale(0.85) !important; }
  .d3-pill-cta {
    border-radius: 999px !important;
    backdrop-filter: blur(20px) saturate(1.4);
    -webkit-backdrop-filter: blur(20px) saturate(1.4);
    background: var(--tp-primary) !important;
    border: 0.5px solid rgba(255,255,255,.2) !important;
    box-shadow: 0 8px 32px rgba(0,0,0,.25), inset 0 1px 0 rgba(255,255,255,.15) !important;
  }
  .d3-hero-h1 { transition: letter-spacing .4s ${EASE}; }
  .d3-scrollbar::-webkit-scrollbar { display: none; }
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;

// ─── QtySelector ─────────────────────────────────────────────────────────────
function QtySelector({ qty, onAdd, onRemove, h = 32 }) {
  const ps = (r) => ({ border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--tp-on-primary)', padding:'0 6px', transition:'background .1s', borderRadius:r });
  const dn = (e) => { e.currentTarget.style.background='rgba(0,0,0,.22)'; e.currentTarget.style.transform='scale(0.85)'; };
  const up = (e) => { e.currentTarget.style.background=''; e.currentTarget.style.transform='scale(1)'; };
  if (qty > 0) return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', background:'var(--tp-primary)', borderRadius:10, overflow:'hidden', height:h }}>
      <button className="d3-qty-btn" style={ps('10px 0 0 10px')} onMouseDown={dn} onMouseUp={up} onMouseLeave={up} onTouchStart={dn} onTouchEnd={up} onClick={onRemove}><Minus size={13}/></button>
      <span style={{ display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'var(--tp-on-primary)',background:'rgba(0,0,0,.18)',borderRadius:6,margin:'3px 0',...F }}>{qty}</span>
      <button className="d3-qty-btn" style={ps('0 10px 10px 0')} onMouseDown={dn} onMouseUp={up} onMouseLeave={up} onTouchStart={dn} onTouchEnd={up} onClick={onAdd}><Plus size={13}/></button>
    </div>
  );
  return (
    <button onClick={onAdd} style={{ width:'100%', height:h, borderRadius:10, border:'none', background:'var(--tp-primary)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:5, color:'var(--tp-on-primary)', fontSize:12, fontWeight:700, ...F, transition:`transform .2s ${EASE}` }}
      onMouseEnter={e=>e.currentTarget.style.transform='scale(1.04)'}
      onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}
      onMouseDown={e=>e.currentTarget.style.transform='scale(0.96)'}
      onMouseUp={e=>e.currentTarget.style.transform='scale(1.04)'}>
      <Plus size={13}/> Agregar
    </button>
  );
}

// ─── Hero con logo integrado ──────────────────────────────────────────────────
function CinemaHero({ tienda }) {
  const imgs = [tienda.foto, ...(tienda.galeria||[])].filter(Boolean);
  const [idx, setIdx] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const h = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', h, { passive:true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  useEffect(() => {
    if (imgs.length <= 1) return;
    const t = setTimeout(() => setIdx(i => (i+1) % imgs.length), 5000);
    return () => clearTimeout(t);
  }, [idx, imgs.length]);

  const { abierta, texto } = getEstadoApertura(tienda.horarios);
  const parallax = scrollY * 0.38;
  const blurVal  = Math.min(scrollY * 0.02, 6);
  const scaleVal = 1 + Math.min(scrollY * 0.0003, 0.08);
  const ls       = `${Math.min(scrollY * 0.0008, 0.06)}em`;
  const ciudad   = tienda.ciudad?.split(',')[0]?.trim();

  const chip = (children, extra = {}) => (
    <span className="d3-liquid-border" style={{ display:'inline-flex', alignItems:'center', gap:5, background:'rgba(255,255,255,.10)', backdropFilter:'blur(14px)', WebkitBackdropFilter:'blur(14px)', borderRadius:999, padding:'5px 11px', fontSize:11, fontWeight:600, color:'rgba(255,255,255,.92)', ...extra }}>
      <div className="d3-liquid-shine"/>
      {children}
    </span>
  );

  return (
    <div style={{ position:'relative', height:'62vh', minHeight:320, overflow:'hidden', background:'#000' }}>
      {imgs.length > 0 ? (
        <div style={{ position:'absolute', inset:0, transform:`scale(${scaleVal}) translateY(${parallax}px)`, filter:`blur(${blurVal}px)`, transition:'transform .1s linear, filter .1s linear', willChange:'transform,filter' }}>
          {imgs.map((src,i) => (
            <img key={src} src={src} alt="" style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', display:'block', opacity:i===idx?1:0, transition:`opacity 1.2s ${EASE}` }}/>
          ))}
        </div>
      ) : (
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg, var(--tp-primary), #000)' }}/>
      )}
      {/* gradiente de profundidad */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,.88) 0%, rgba(0,0,0,.15) 50%, rgba(0,0,0,.3) 100%)' }}/>
      <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 80% 100% at 50% 50%, transparent 40%, rgba(0,0,0,.35) 100%)' }}/>

      {/* contenido inferior: logo + nombre + chips */}
      <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'0 20px 52px' }}>
        {/* fila logo + (nombre / chips) */}
        <div style={{ ...fadeIn(0), display:'flex', alignItems:'center', gap:14, marginBottom:0 }}>
          {/* logo */}
          <div className="d3-liquid-border" style={{ width:68, height:68, borderRadius:20, flexShrink:0, overflow:'hidden', background:tienda.logo?'transparent':'var(--tp-primary)', backdropFilter:'blur(18px) saturate(1.4)', WebkitBackdropFilter:'blur(18px) saturate(1.4)', boxShadow:'0 4px 24px rgba(0,0,0,.35), inset 0 1px 0 rgba(255,255,255,.18)', display:'flex', alignItems:'center', justifyContent:'center', position:'relative' }}>
            <div className="d3-liquid-shine"/>
            {tienda.logo
              ? <img src={tienda.logo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
              : <span style={{ fontSize:26, fontWeight:900, color:'#fff', ...F }}>{tienda.nombre?.[0]?.toUpperCase()||'T'}</span>
            }
          </div>
          {/* columna derecha: nombre arriba, chips abajo */}
          <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:8 }}>
            <h1 className="d3-hero-h1" style={{ margin:0, color:'#fff', fontSize:'clamp(1.4rem, 5vw, 2.6rem)', fontWeight:900, lineHeight:1, letterSpacing:ls, ...F, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {tienda.nombre}
            </h1>
            <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
              {texto && chip(
                <><span style={{ width:6, height:6, borderRadius:'50%', background:abierta?'#10b981':'#ef4444', display:'inline-block', flexShrink:0 }}/>{texto}</>,
                { background: abierta?'rgba(16,185,129,.18)':'rgba(239,68,68,.18)' }
              )}
              {ciudad && chip(<><MapPin size={10}/>{ciudad}</>)}
            </div>
          </div>
        </div>
      </div>

      {imgs.length > 1 && (
        <div style={{ position:'absolute', bottom:14, right:16, display:'flex', gap:4 }}>
          {imgs.map((_,i) => (
            <button key={i} onClick={()=>setIdx(i)} style={{ width:i===idx?18:5, height:5, borderRadius:3, background:i===idx?'#fff':'rgba(255,255,255,.38)', border:'none', cursor:'pointer', padding:0, transition:`width .35s ${EASE}` }}/>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Botones de acción ────────────────────────────────────────────────────────
function ActionButtons({ acciones, isDark }) {
  const [pressed, setPressed] = useState(null);

  const STYLES = {
    navegar:   { bg:'linear-gradient(145deg,#1e2d40,#0f172a)', icon:'rgba(255,255,255,.9)', label:'#fff', shadow:'rgba(15,23,42,.5)' },
    llamar:    { bg: isDark ? 'linear-gradient(145deg,rgba(255,255,255,.10),rgba(255,255,255,.05))' : 'linear-gradient(145deg,#f1f5f9,#e2e8f0)', icon:'var(--tp-primary)', label: isDark?'#e2e8f0':'#0f172a', shadow:'rgba(0,0,0,.12)' },
    whatsapp:  { bg:'linear-gradient(145deg,#25d366,#16a34a)', icon:'#fff', label:'#fff', shadow:'rgba(22,163,74,.4)' },
    instagram: { bg:'linear-gradient(145deg,#f43f5e,#9333ea)', icon:'#fff', label:'#fff', shadow:'rgba(147,51,234,.35)' },
  };

  const getStyle = (label) => {
    if (label === 'Navegar')   return STYLES.navegar;
    if (label === 'Llamar')    return STYLES.llamar;
    if (label === 'WhatsApp')  return STYLES.whatsapp;
    if (label === 'Instagram') return STYLES.instagram;
    return STYLES.llamar;
  };

  return (
    <div style={{ display:'flex', flexDirection:'row', gap:8, flexWrap:'wrap' }}>
      {acciones.map(({ label, icon:Icon, href }) => {
        const s = getStyle(label);
        const isPressed = pressed === label;
        return (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            onMouseDown={()=>setPressed(label)}
            onMouseUp={()=>setPressed(null)}
            onMouseLeave={()=>setPressed(null)}
            onTouchStart={()=>setPressed(label)}
            onTouchEnd={()=>setPressed(null)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 14px', borderRadius:14, background:s.bg, boxShadow:`0 1px 0 rgba(255,255,255,.12) inset, 0 3px 14px ${s.shadow}`, border:'0.5px solid rgba(255,255,255,.10)', textDecoration:'none', transform:isPressed?'scale(0.93)':'scale(1)', transition:`transform .15s ${BOUNCE}`, flex:'1 1 auto', justifyContent:'center' }}>
            <Icon size={16} style={{ color:s.icon, flexShrink:0 }}/>
            <span style={{ fontSize:13, fontWeight:700, color:s.label, ...F }}>{label}</span>
          </a>
        );
      })}
    </div>
  );
}

// ─── Product Card con tilt 3D ─────────────────────────────────────────────────
function ProductCard({ p, qty, onAdd, onRemove, isDark, tienda }) {
  const surf2 = isDark ? 'rgba(255,255,255,.06)' : '#f1f5f9';
  const txt   = isDark ? '#f1f5f9' : '#0f172a';
  const txtM  = isDark ? '#94a3b8' : '#64748b';
  const surf  = isDark ? '#1e293b' : '#fff';
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ x:0, y:0, active:false });

  const onMove = (e) => {
    if (!cardRef.current) return;
    const r = cardRef.current.getBoundingClientRect();
    setTilt({ x:(((e.clientY-r.top)/r.height)-.5)*6, y:(((e.clientX-r.left)/r.width)-.5)*-6, active:true });
  };
  const onLeave = () => setTilt({ x:0, y:0, active:false });

  return (
    <article ref={cardRef} className="d3-card" onMouseMove={onMove} onMouseLeave={onLeave}
      style={{ background:surf, borderRadius:20, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.07)', border:`1px solid ${isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)'}`, display:'flex', flexDirection:'column',
        transform:`perspective(800px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateZ(${tilt.active?8:0}px)`,
        transition: tilt.active ? 'transform .12s ease-out' : `transform .4s ${EASE}`,
      }}>
      <div style={{ position:'relative', aspectRatio:'1/1.1', background:surf2, overflow:'hidden' }}>
        <div className="d3-card-img" style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {p.foto
            ? <img src={p.foto} alt={p.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
            : <Package size={28} style={{ color:isDark?'rgba(255,255,255,.15)':'#cbd5e1' }}/>
          }
        </div>
        {p.foto && <div style={{ position:'absolute', inset:'auto 0 0 0', height:'40%', background:'linear-gradient(to top, rgba(0,0,0,.22), transparent)', pointerEvents:'none' }}/>}
        <div className="d3-liquid-border" style={{ position:'absolute', top:10, left:10, padding:'4px 9px', borderRadius:999, background:'rgba(255,255,255,.85)', backdropFilter:'blur(8px)', WebkitBackdropFilter:'blur(8px)', fontSize:10, fontWeight:800, color:'#0f172a', letterSpacing:'.04em' }}>
          <div className="d3-liquid-shine"/>NUEVO
        </div>
      </div>
      <div style={{ padding:'10px 12px 12px', display:'flex', flexDirection:'column', flex:1 }}>
        <p style={{ margin:0, fontSize:13, fontWeight:700, lineHeight:1.3, color:txt, ...F, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.nombre}</p>
        <div style={{ marginTop:'auto', paddingTop:10 }}>
          {p.precio != null
            ? <p style={{ margin:'0 0 8px', fontSize:15, fontWeight:900, color:txt, letterSpacing:'-0.03em', ...F }}>{formatPrice(p.precio)}</p>
            : <a href={buildWhatsAppUrl(tienda||{},[],`Consulta por: ${p.nombre}`)||'#'} target="_blank" rel="noopener noreferrer" style={{ display:'inline-block', marginBottom:8, fontSize:11, fontWeight:700, color:'var(--tp-primary)', textDecoration:'none' }}>Consultar →</a>
          }
          <QtySelector qty={qty} onAdd={()=>onAdd(p)} onRemove={()=>onRemove(p.id)} h={30}/>
        </div>
      </div>
    </article>
  );
}

// ─── Scroll productos ─────────────────────────────────────────────────────────
function ProductosScroll({ productos, cart, onAdd, onRemove, isDark, tienda }) {
  const activos = (productos||[]).filter(p=>p.activo!==false).map(norm);
  const scrollRef = useRef(null);
  const [verTodas, setVerTodas] = useState(false);
  const [edges, setEdges] = useState({ left:false, right:true });
  const surf = isDark?'#1e293b':'#fff';
  const txt  = isDark?'#f1f5f9':'#0f172a';
  const txtM = isDark?'#94a3b8':'#64748b';

  const check = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setEdges({ left:el.scrollLeft>8, right:el.scrollLeft<el.scrollWidth-el.clientWidth-8 });
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    check();
    el.addEventListener('scroll', check, { passive:true });
    return () => el.removeEventListener('scroll', check);
  }, [check]);

  return (
    <div style={{ background:surf, borderRadius:20, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
      <div style={{ padding:'16px 16px 0', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:txt, ...F }}>Productos</h3>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {activos.length > 0 && <span style={{ fontSize:12, color:txtM, fontWeight:600 }}>{activos.length} items</span>}
          {[{dir:-1,e:edges.left},{dir:1,e:edges.right}].map(({dir,e}) => (
            <button key={dir} onClick={()=>scrollRef.current?.scrollBy({left:dir*200,behavior:'smooth'})} style={{ width:30, height:30, borderRadius:999, border:`1px solid ${isDark?'rgba(255,255,255,.1)':'rgba(0,0,0,.08)'}`, background:e?'var(--tp-primary)':(isDark?'rgba(255,255,255,.05)':'#f8fafc'), color:e?'var(--tp-on-primary)':txtM, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:`all .25s ${EASE}` }}>
              {dir===-1?<ChevronLeft size={14}/>:<ChevronRight size={14}/>}
            </button>
          ))}
        </div>
      </div>
      {activos.length === 0 ? (
        <div style={{ display:'flex', gap:12, padding:16 }}>
          {[1,2,3].map(i => (
            <div key={i} style={{ width:176, flexShrink:0, borderRadius:20, overflow:'hidden' }}>
              <div className="d3-shimmer" style={{ height:176, background:isDark?'rgba(255,255,255,.06)':'#e2e8f0' }}/>
              <div style={{ padding:'10px 12px 14px' }}>
                <div className="d3-shimmer" style={{ height:12, borderRadius:6, background:isDark?'rgba(255,255,255,.06)':'#e2e8f0', marginBottom:8 }}/>
                <div className="d3-shimmer" style={{ height:10, borderRadius:6, background:isDark?'rgba(255,255,255,.04)':'#f1f5f9', width:'60%' }}/>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div ref={scrollRef} style={{ display:'flex', gap:12, padding:'14px 16px 16px', overflowX:'auto', scrollSnapType:'x mandatory', scrollbarWidth:'none', msOverflowStyle:'none', alignItems:'stretch' }}>
          {activos.map((p,i) => {
            const qty = cart?.find(c=>c.id===p.id)?.qty||0;
            return (
              <div key={p.id} style={{ width:176, flexShrink:0, scrollSnapAlign:'start', ...fadeIn(i*40) }}>
                <ProductCard p={p} qty={qty} onAdd={onAdd} onRemove={onRemove} isDark={isDark} tienda={tienda}/>
              </div>
            );
          })}
        </div>
      )}
      {activos.length > 0 && (
        <button onClick={()=>setVerTodas(true)} style={{ width:'100%', padding:'13px 16px', border:'none', borderTop:`1px solid ${isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)'}`, background:'none', cursor:'pointer', fontSize:13, fontWeight:700, color:'var(--tp-primary)', ...F, display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'background .15s' }}
          onMouseEnter={e=>e.currentTarget.style.background=isDark?'rgba(255,255,255,.04)':'rgba(0,0,0,.02)'}
          onMouseLeave={e=>e.currentTarget.style.background='none'}>
          Ver todas ({activos.length}) →
        </button>
      )}
      {verTodas && <ProductosModal activos={activos} cart={cart} onAdd={onAdd} onRemove={onRemove} isDark={isDark} tienda={tienda} onClose={()=>setVerTodas(false)}/>}
    </div>
  );
}

// ─── Modal ver todas (versión avanzada) ──────────────────────────────────────
const SORT_OPTIONS = [
  { id:'def',  label:'Relevancia'  },
  { id:'az',   label:'A → Z'       },
  { id:'asc',  label:'Menor precio'},
  { id:'desc', label:'Mayor precio'},
];

function FiltersPanel({ cats, catSel, setCatSel, sort, setSort, soloConPrecio, setSoloConPrecio, isDark, txt, txtM, border, primary }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.06em' }}>Ordenar</p>
        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {SORT_OPTIONS.map(o => (
            <button key={o.id} onClick={() => setSort(o.id)}
              style={{ textAlign:'left', padding:'8px 12px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background: sort===o.id ? primary : 'none', color: sort===o.id ? 'var(--tp-on-primary)' : txt, transition:'background .15s', ...F }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {cats.length > 0 && (
        <div>
          <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.06em' }}>Categoría</p>
          <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
            <button onClick={() => setCatSel(null)}
              style={{ textAlign:'left', padding:'8px 12px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background: catSel===null ? primary : 'none', color: catSel===null ? 'var(--tp-on-primary)' : txt, ...F }}>
              Todas
            </button>
            {cats.map(c => (
              <button key={c} onClick={() => setCatSel(c)}
                style={{ textAlign:'left', padding:'8px 12px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background: catSel===c ? primary : 'none', color: catSel===c ? 'var(--tp-on-primary)' : txt, ...F }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.06em' }}>Precio</p>
        <button onClick={() => setSoloConPrecio(v => !v)}
          style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 12px', borderRadius:10, border:`1px solid ${border}`, cursor:'pointer', fontSize:13, fontWeight:600, background: soloConPrecio ? primary : 'none', color: soloConPrecio ? 'var(--tp-on-primary)' : txt, width:'100%', ...F }}>
          Solo con precio
        </button>
      </div>
    </div>
  );
}

function ProductosModal({ activos, cart, onAdd, onRemove, isDark, tienda, onClose }) {
  const [q, setQ]                       = useState('');
  const [sort, setSort]                 = useState('def');
  const [catSel, setCatSel]             = useState(null);
  const [soloConPrecio, setSoloConPrecio] = useState(false);
  const [sheetOpen, setSheetOpen]       = useState(false);
  const [isWide, setIsWide]             = useState(false);
  const rootRef = useRef(null);

  const surf    = isDark ? '#1e293b' : '#fff';
  const bg      = isDark ? '#0a0d16' : '#f7f8fa';
  const txt     = isDark ? '#f1f5f9' : '#0f172a';
  const txtM    = isDark ? '#94a3b8' : '#64748b';
  const border  = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)';
  const primary = 'var(--tp-primary)';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  useEffect(() => {
    if (!rootRef.current) return;
    const ro = new ResizeObserver(([e]) => setIsWide(e.contentRect.width >= 700));
    ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  const cats = [...new Set(activos.map(p => p.categoria || p.rubro).filter(Boolean))];

  const procesados = activos
    .filter(p => !q.trim() || p.nombre?.toLowerCase().includes(q.toLowerCase()) || p.descripcion?.toLowerCase().includes(q.toLowerCase()))
    .filter(p => !catSel || (p.categoria || p.rubro) === catSel)
    .filter(p => !soloConPrecio || p.precio != null)
    .sort((a, b) => {
      if (sort === 'az')   return (a.nombre||'').localeCompare(b.nombre||'');
      if (sort === 'asc')  return (a.precio ?? Infinity) - (b.precio ?? Infinity);
      if (sort === 'desc') return (b.precio ?? -1) - (a.precio ?? -1);
      return 0;
    });

  const activeFilters = (catSel ? 1 : 0) + (soloConPrecio ? 1 : 0) + (sort !== 'def' ? 1 : 0);

  const ModalProductCard = ({ p, i }) => {
    const qty = cart?.find(item => item.id === p.id)?.qty || 0;
    const wa  = buildWhatsAppUrl(tienda || {}, [], '');
    return (
      <div style={{ background:surf, borderRadius:16, overflow:'hidden', animation:`tp-fade-up .3s cubic-bezier(0.16,1,0.3,1) ${i*15}ms forwards`, display:'flex', flexDirection:'column' }}>
        <div style={{ aspectRatio:'1/1', background:isDark?'rgba(255,255,255,.06)':'linear-gradient(135deg,#f1f5f9,#e2e8f0)', overflow:'hidden' }}>
          {p.foto
            ? <img src={p.foto} alt={p.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Package size={28} style={{ color:isDark?'rgba(255,255,255,.15)':'#cbd5e1' }} /></div>
          }
        </div>
        <div style={{ padding:'7px 8px 9px', flex:1, display:'flex', flexDirection:'column', gap:4 }}>
          <p style={{ margin:0, fontSize:11, fontWeight:700, color:txt, lineHeight:1.3, ...F }}>{p.nombre}</p>
          {p.precio != null
            ? <span style={{ fontSize:13, fontWeight:900, color:txt, marginTop:'auto', marginBottom:4, ...F }}>{formatPrice(p.precio)}</span>
            : <span style={{ fontSize:10, color:txtM, fontStyle:'italic', marginTop:'auto', marginBottom:4, ...F }}>A consultar</span>
          }
          {p.precio != null
            ? <QtySelector qty={qty} onAdd={() => onAdd(p)} onRemove={() => onRemove(p.id)} h={28} />
            : wa
              ? <a href={`${wa}&text=${encodeURIComponent(`Hola, quería consultar por: ${p.nombre}`)}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, height:28, borderRadius:9, border:`1px solid ${isDark?'rgba(255,255,255,.12)':'rgba(0,0,0,.1)'}`, background:'none', color:txt, fontSize:11, fontWeight:700, textDecoration:'none', ...F }}>
                  <MessageCircle size={11} /> Consultar
                </a>
              : null
          }
        </div>
      </div>
    );
  };

  return createPortal(
    <div ref={rootRef} style={{ position:'fixed', inset:0, zIndex:9999, background:bg, display:'flex', flexDirection:'column', ...F }}>

      {/* Header */}
      <div style={{ background:surf, borderBottom:`1px solid ${border}`, paddingTop:'env(safe-area-inset-top)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px' }}>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:12, border:'none', background:isDark?'rgba(255,255,255,.08)':'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txt, flexShrink:0 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex:1, position:'relative' }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:txtM, pointerEvents:'none' }} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar en el catálogo..."
              style={{ width:'100%', paddingLeft:30, paddingRight:42, height:36, borderRadius:12, border:`1px solid ${border}`, background:isDark?'rgba(255,255,255,.06)':'#f1f5f9', color:txt, fontSize:13, outline:'none', boxSizing:'border-box', ...F }} />
            <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, fontWeight:700, color:txtM, background:isDark?'rgba(255,255,255,.08)':'rgba(0,0,0,.06)', borderRadius:6, padding:'2px 6px' }}>{procesados.length}</span>
          </div>
          {!isWide && (
            <button onClick={() => setSheetOpen(true)} style={{ position:'relative', width:36, height:36, borderRadius:12, border:'none', background:activeFilters>0 ? primary : isDark?'rgba(255,255,255,.08)':'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color: activeFilters>0 ? 'var(--tp-on-primary)' : txt, flexShrink:0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              {activeFilters > 0 && <span style={{ position:'absolute', top:4, right:4, width:8, height:8, borderRadius:999, background:'var(--tp-on-primary)', border:`2px solid ${primary}` }} />}
            </button>
          )}
        </div>
        {!isWide && (
          <div style={{ display:'flex', gap:6, padding:'0 12px 10px', overflowX:'auto', scrollbarWidth:'none' }}>
            {SORT_OPTIONS.map(o => (
              <button key={o.id} onClick={() => setSort(o.id)}
                style={{ flexShrink:0, padding:'5px 12px', borderRadius:999, border:`1px solid ${sort===o.id ? primary : border}`, background: sort===o.id ? primary : 'none', color: sort===o.id ? 'var(--tp-on-primary)' : txtM, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', ...F }}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {isWide && (
          <div style={{ width:220, flexShrink:0, borderRight:`1px solid ${border}`, overflowY:'auto', padding:'16px 12px', background:surf }}>
            <FiltersPanel cats={cats} catSel={catSel} setCatSel={setCatSel} sort={sort} setSort={setSort} soloConPrecio={soloConPrecio} setSoloConPrecio={setSoloConPrecio} isDark={isDark} txt={txt} txtM={txtM} surf={surf} border={border} primary={primary} />
          </div>
        )}
        <div style={{ flex:1, overflowY:'auto', padding:10 }}>
          {procesados.length === 0 ? (
            <div style={{ textAlign:'center', padding:'48px 16px' }}>
              <Package size={40} style={{ color:isDark?'rgba(255,255,255,.15)':'#cbd5e1', marginBottom:12 }} />
              <p style={{ margin:0, fontSize:14, fontWeight:700, color:txt }}>Sin resultados</p>
              <p style={{ margin:'4px 0 0', fontSize:12, color:txtM }}>Probá con otra búsqueda</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
              {procesados.map((p, i) => <ModalProductCard key={p.id} p={p} i={i} />)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet filtros — mobile */}
      {sheetOpen && !isWide && createPortal(
        <div style={{ position:'fixed', inset:0, zIndex:10001, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.4)', backdropFilter:'blur(4px)' }} onClick={() => setSheetOpen(false)} />
          <div style={{ position:'relative', background:surf, borderRadius:'20px 20px 0 0', maxHeight:'75dvh', display:'flex', flexDirection:'column', ...F }}>
            <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
              <div style={{ width:36, height:4, borderRadius:2, background:border }} />
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 16px' }}>
              <h3 style={{ margin:0, fontSize:15, fontWeight:800, color:txt }}>Filtros y orden</h3>
              {activeFilters > 0 && (
                <button onClick={() => { setSort('def'); setCatSel(null); setSoloConPrecio(false); }} style={{ fontSize:12, fontWeight:700, color:primary, background:'none', border:'none', cursor:'pointer' }}>
                  Limpiar
                </button>
              )}
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'0 16px 32px' }}>
              <FiltersPanel cats={cats} catSel={catSel} setCatSel={setCatSel} sort={sort} setSort={setSort} soloConPrecio={soloConPrecio} setSoloConPrecio={setSoloConPrecio} isDark={isDark} txt={txt} txtM={txtM} surf={surf} border={border} primary={primary} />
            </div>
            <div style={{ padding:'10px 16px 24px', borderTop:`1px solid ${border}` }}>
              <button onClick={() => setSheetOpen(false)} style={{ width:'100%', height:44, borderRadius:14, border:'none', background:primary, color:'var(--tp-on-primary)', fontSize:15, fontWeight:800, cursor:'pointer', ...F }}>
                Ver {procesados.length} productos
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Flotante carrito */}
      {cart && cart.length > 0 && (() => {
        const count = cart.reduce((a, b) => a + b.qty, 0);
        const total = cart.reduce((a, b) => a + (b.precio || 0) * b.qty, 0);
        return (
          <button onClick={onClose} style={{ position:'fixed', bottom:18, left:16, right:16, zIndex:10000, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderRadius:18, background:'var(--tp-primary)', color:'var(--tp-on-primary)', border:'none', cursor:'pointer', fontWeight:800, fontSize:15, boxShadow:'0 8px 32px rgba(0,0,0,.22)', backdropFilter:'blur(10px)', ...F }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <ShoppingBag size={18} />
              Ver pedido
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ background:'rgba(0,0,0,.18)', borderRadius:8, padding:'3px 9px', fontSize:13, fontWeight:800 }}>{count}</span>
              <span style={{ background:'rgba(0,0,0,.18)', borderRadius:8, padding:'3px 9px', fontSize:13, fontWeight:800 }}>{formatPrice(total)}</span>
            </div>
          </button>
        );
      })()}
    </div>,
    document.body
  );
}

// ─── Cart Modal ───────────────────────────────────────────────────────────────
function CartModal({ cart, onAdd, onRemove, note, setNote, wa, isDark, onClose }) {
  const surf  = isDark?'#1e293b':'#fff';
  const txt   = isDark?'#f1f5f9':'#0f172a';
  const txtM  = isDark?'#94a3b8':'#64748b';
  const bdr   = isDark?'rgba(255,255,255,.08)':'rgba(0,0,0,.07)';
  const total = cart.reduce((s,i)=>s+(i.precio||0)*i.qty,0);

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.48)', backdropFilter:'blur(6px)' }} onClick={onClose}/>
      <div style={{ position:'relative', background:surf, borderRadius:'24px 24px 0 0', maxHeight:'82dvh', display:'flex', flexDirection:'column', ...F }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:bdr }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 18px 10px' }}>
          <span style={{ fontSize:16, fontWeight:800, color:txt }}>Tu pedido</span>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:10, border:'none', background:isDark?'rgba(255,255,255,.07)':'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txt }}><X size={16}/></button>
        </div>
        <div style={{ overflowY:'auto', padding:'0 16px', display:'flex', flexDirection:'column' }}>
          {cart.map(item => {
            const nombre = item.nombre||item.titulo||null;
            const foto   = item.foto||item.fotos?.[0]||item.galeria?.[0]||null;
            return (
              <div key={item.id} style={{ display:'grid', gridTemplateColumns:'48px 1fr auto 96px', alignItems:'center', gap:10, padding:'10px 0', borderBottom:`1px solid ${bdr}` }}>
                <div style={{ width:48, height:48, borderRadius:12, overflow:'hidden', background:isDark?'rgba(255,255,255,.06)':'#f1f5f9', border:`1px solid ${bdr}` }}>
                  {foto?<img src={foto} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>:<div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Package size={18} style={{ color:txtM }}/></div>}
                </div>
                <div style={{ minWidth:0 }}>
                  {nombre?<p style={{ margin:0, fontSize:13, fontWeight:700, color:txt, lineHeight:1.3, wordBreak:'break-word' }}>{nombre}</p>:<div className="d3-shimmer" style={{ height:12, borderRadius:6, background:isDark?'rgba(255,255,255,.08)':'#e2e8f0' }}/>}
                </div>
                <div style={{ textAlign:'right' }}>
                  {item.precio!=null&&<><p style={{ margin:0, fontSize:10, color:txtM, fontWeight:600 }}>c/u</p><p style={{ margin:'2px 0 0', fontSize:13, fontWeight:800, color:'var(--tp-primary)' }}>{formatPrice(item.precio*item.qty)}</p></>}
                </div>
                <div style={{ width:96 }}>
                  <QtySelector qty={item.qty} onAdd={()=>onAdd(item)} onRemove={()=>onRemove(item.id)} h={32}/>
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ padding:'12px 16px' }}>
          <textarea value={note} onChange={e=>setNote(e.target.value)} placeholder="Nota para el pedido (opcional)" rows={1}
            style={{ width:'100%', borderRadius:12, border:`1px solid ${bdr}`, background:isDark?'rgba(255,255,255,.05)':'#f8fafc', padding:'10px 12px', fontSize:13, color:txt, resize:'none', outline:'none', boxSizing:'border-box', textAlign:'center', ...F }}/>
        </div>
        <div style={{ padding:'0 16px 20px', paddingBottom:'calc(20px + env(safe-area-inset-bottom))' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
            <span style={{ fontSize:13, color:txtM, fontWeight:600 }}>Total estimado</span>
            <span style={{ fontSize:18, fontWeight:900, color:txt }}>{formatPrice(total)}</span>
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="d3-pill-cta" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, color:'var(--tp-on-primary)', padding:'15px 20px', textDecoration:'none', fontWeight:800, fontSize:15, ...F }}>
              <MessageCircle size={18}/> Pedir por WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Horarios ─────────────────────────────────────────────────────────────────
function HorariosCard({ tienda, isDark }) {
  const surf = isDark?'#1e293b':'#fff';
  const txt  = isDark?'#f1f5f9':'#0f172a';
  const txtM = isDark?'#94a3b8':'#64748b';
  if (!tienda.horarios) return null;
  return (
    <div style={{ background:surf, borderRadius:20, padding:'16px 18px', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
        <Clock size={15} style={{ color:'var(--tp-primary)' }}/>
        <p style={{ margin:0, fontSize:14, fontWeight:800, color:txt, ...F }}>Horarios</p>
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {Object.entries(tienda.horarios).map(([key, schedule]) => {
          const isToday = key === todayKey;
          return (
            <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'6px 10px', borderRadius:10, background:isToday?'var(--tp-primary-soft, rgba(0,184,217,.08))':'none' }}>
              <span style={{ fontSize:12, fontWeight:isToday?800:500, color:isToday?'var(--tp-primary)':txtM, ...F }}>{DAY_LABELS[key]}{isToday?' · Hoy':''}</span>
              <span style={{ fontSize:12, fontWeight:700, color:schedule?(isToday?'var(--tp-primary)':txt):txtM, ...F }}>{schedule||'Cerrado'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Contacto ─────────────────────────────────────────────────────────────────
function InfoRows({ tienda, isDark }) {
  const surf = isDark?'#1e293b':'#fff';
  const txt  = isDark?'#f1f5f9':'#0f172a';
  const txtM = isDark?'#94a3b8':'#64748b';
  const rows = [
    tienda.telefono  && { icon:Phone,        label:tienda.telefono, href:`tel:${tienda.telefono}` },
    tienda.whatsapp  && { icon:MessageCircle, label:'WhatsApp',      href:`https://wa.me/${tienda.whatsapp.replace(/\D/g,'')}` },
    tienda.instagram && { icon:Instagram,    label:`@${tienda.instagram.replace('@','')}`, href:`https://instagram.com/${tienda.instagram.replace('@','')}` },
    tienda.website   && { icon:Globe,        label:tienda.website,  href:tienda.website },
    tienda.direccion && { icon:MapPin,       label:tienda.direccion, href:null },
  ].filter(Boolean);
  if (!rows.length) return null;
  return (
    <div style={{ background:surf, borderRadius:20, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
      {rows.map(({icon:Icon,label,href},i) => (
        <div key={i} onClick={href?()=>window.open(href,'_blank'):undefined}
          style={{ display:'flex', alignItems:'center', gap:12, padding:'13px 18px', cursor:href?'pointer':'default', borderBottom:i<rows.length-1?`1px solid ${isDark?'rgba(255,255,255,.05)':'rgba(0,0,0,.04)'}`:'' }}
          onMouseEnter={e=>{if(href)e.currentTarget.style.background=isDark?'rgba(255,255,255,.04)':'#fafafa';}}
          onMouseLeave={e=>{e.currentTarget.style.background='';}}>
          <div style={{ width:34, height:34, borderRadius:12, background:'var(--tp-primary-soft, rgba(0,184,217,.08))', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <Icon size={15} style={{ color:'var(--tp-primary)' }}/>
          </div>
          <span style={{ fontSize:13, fontWeight:600, color:txt, ...F, flex:1, minWidth:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Galería ─────────────────────────────────────────────────────────────────
function GaleriaScroll({ fotos, isDark }) {
  const surf = isDark?'#1e293b':'#fff';
  if (!fotos?.length) return null;
  return (
    <div style={{ background:surf, borderRadius:20, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
      <div style={{ padding:'14px 16px 10px' }}>
        <h3 style={{ margin:0, fontSize:14, fontWeight:800, color:isDark?'#f1f5f9':'#0f172a' }}>Galería</h3>
      </div>
      <div style={{ display:'flex', gap:8, padding:'0 16px 16px', overflowX:'auto', scrollbarWidth:'none' }}>
        {fotos.map((src,i) => (
          <div key={i} style={{ width:100, height:100, flexShrink:0, borderRadius:14, overflow:'hidden', background:isDark?'rgba(255,255,255,.06)':'#f1f5f9' }}>
            <img src={src} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', transition:`transform .4s ${EASE}` }}
              onMouseEnter={e=>e.currentTarget.style.transform='scale(1.08)'}
              onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}/>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TEMPLATE PRINCIPAL ───────────────────────────────────────────────────────
export function TemplateDetail3({ tienda, secciones, cart, onAdd, onRemove, note, isDark }) {
  const s  = Object.fromEntries(secciones.map(sec => [sec.id, sec]));
  const wa = buildWhatsAppUrl(tienda, cart, '');
  const { abierta, texto: textoApertura } = getEstadoApertura(tienda.horarios);

  const [cartOpen, setCartOpen] = useState(false);
  const [noteLocal, setNoteLocal] = useState(note || '');

  const rootRef = useRef(null);
  const [isWide, setIsWide] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 900);
  useEffect(() => {
    if (!rootRef.current) return;
    const ro = new ResizeObserver(([e]) => setIsWide(e.contentRect.width >= 900));
    ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  const bg   = isDark?'#0a0d16':'#f7f8fa';
  const surf = isDark?'#1e293b':'#fff';
  const txt  = isDark?'#f1f5f9':'#0f172a';
  const txtM = isDark?'#94a3b8':'#64748b';

  const acciones = [
    tienda.direccion && { label:'Navegar',   icon:Navigation,   href:`https://www.google.com/maps/search/${encodeURIComponent([tienda.direccion,tienda.ciudad].filter(Boolean).join(', '))}` },
    tienda.telefono  && { label:'Llamar',    icon:Phone,        href:`tel:${tienda.telefono}` },
    wa               && { label:'WhatsApp',  icon:MessageCircle,href:wa },
    tienda.instagram && { label:'Instagram', icon:Instagram,    href:`https://instagram.com/${tienda.instagram.replace('@','')}` },
  ].filter(Boolean);

  const sections = [
    { key:'galeria',   activa:s.galeria?.activa,   el:<GaleriaScroll fotos={tienda.galeria} isDark={isDark}/> },
    { key:'productos', activa:s.productos?.activa, el:<ProductosScroll productos={tienda.productos} cart={cart} onAdd={onAdd} onRemove={onRemove} isDark={isDark} tienda={tienda}/> },
    { key:'mapa',      activa:s.mapa?.activa,      el:<div style={{ margin:isWide?0:'0 -16px' }}><Suspense fallback={null}><MapaSection tienda={tienda} isDark={isDark}/></Suspense></div> },
    { key:'contacto',  activa:s.contacto?.activa,  el:<InfoRows tienda={tienda} isDark={isDark}/> },
    { key:'horarios',  activa:s.horarios?.activa,  el:<HorariosCard tienda={tienda} isDark={isDark}/> },
  ].filter(sec => sec.activa);

  const sidebar = (
    <div style={{ display:'flex', flexDirection:'column', gap:12, ...(isWide?{position:'absolute',top:0,left:0,minWidth:360,maxWidth:360}:{}) }}>
      {acciones.length > 0 && (
        <div style={{ background:surf, borderRadius:24, padding:'14px', boxShadow:'0 4px 24px rgba(0,0,0,.08)', ...fadeIn(0) }}>
          <ActionButtons acciones={acciones} isDark={isDark}/>
          {tienda.descripcion && (
            <p style={{ margin:'12px 2px 0', fontSize:13, color:txtM, lineHeight:1.65, ...F }}>{tienda.descripcion}</p>
          )}
        </div>
      )}
    </div>
  );

  const main = (
    <div style={{ display:'flex', flexDirection:'column', gap:12, ...(isWide?{marginLeft:380}:{}) }}>
      {sections.map((sec,i) => (
        <div key={sec.key} style={fadeIn(80+i*60)}>{sec.el}</div>
      ))}
    </div>
  );

  const wrap = { position:'relative', zIndex:10, marginTop:-32, paddingBottom:80 };

  return (
    <div ref={rootRef} style={{ background:bg, minHeight:'100dvh', ...F }}>
      <style>{GLOBAL_CSS}</style>

      {s.hero?.activa && <CinemaHero tienda={tienda}/>}

      {isWide ? (
        <div style={{ ...wrap, maxWidth:1100, marginLeft:'auto', marginRight:'auto', paddingLeft:24, paddingRight:24 }}>
          {sidebar}{main}
        </div>
      ) : (
        <div style={{ ...wrap, maxWidth:640, marginLeft:'auto', marginRight:'auto', paddingLeft:16, paddingRight:16 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {sidebar}{main}
          </div>
        </div>
      )}

      {wa && cart.length > 0 && (() => {
        const count = cart.reduce((s,i)=>s+i.qty,0);
        const total = cart.reduce((s,i)=>s+(i.precio||0)*i.qty,0);
        return (
          <button onClick={()=>setCartOpen(true)} className="d3-pill-cta"
            style={{ position:'fixed', left:'50%', transform:'translateX(-50%)', width:isWide?'auto':'calc(100% - 32px)', minWidth:isWide?360:undefined, bottom:20, zIndex:200, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', color:'var(--tp-on-primary)', border:'none', cursor:'pointer', fontWeight:800, fontSize:15, ...F, transition:`transform .3s ${EASE}` }}
            onMouseEnter={e=>{e.currentTarget.style.transform='translateX(-50%) scale(1.03)';}}
            onMouseLeave={e=>{e.currentTarget.style.transform='translateX(-50%) scale(1)';}}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}><ShoppingBag size={18}/>Ver pedido</div>
            <div style={{ display:'flex', gap:6 }}>
              <span style={{ background:'rgba(0,0,0,.18)', borderRadius:8, padding:'3px 9px', fontSize:13 }}>{count}</span>
              <span style={{ background:'rgba(0,0,0,.18)', borderRadius:8, padding:'3px 10px', fontSize:13 }}>{formatPrice(total)}</span>
            </div>
          </button>
        );
      })()}

      {cartOpen && <CartModal cart={cart} onAdd={onAdd} onRemove={onRemove} note={noteLocal} setNote={setNoteLocal} wa={wa} isDark={isDark} onClose={()=>setCartOpen(false)}/>}
    </div>
  );
}
