/**
 * BASE — Template definitivo de LOKAL
 * Fusión entre detail-3 (UX) y Nebula (visual).
 * Todo bien pensado, nada de más, nada de menos.
 */
import React, { useState, useEffect, useRef, useMemo, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Search, ShoppingBag, X, ChevronLeft, ChevronRight, Plus, Minus,
  MapPin, Phone, MessageCircle, Instagram, Globe, Clock,
  Package, SlidersHorizontal, Home, Grid2X2, Heart, Star,
} from 'lucide-react';
import { buildWhatsAppUrl, getEstadoApertura, formatPrice } from '../utils.js';
import { FONT } from '../tokens.js';

const MapaSection = lazy(() =>
  import('../sections/MapaSection.jsx').then(m => ({ default: m.MapaSection }))
);

export const META = {
  label: 'Base',
  desc: 'El template definitivo de LOKAL: parallax hero, filtros avanzados, carrito, mapa, contacto, dark/light.',
};

/* ─── Constantes ─────────────────────────────────────────────────────────── */
const F = { fontFamily: FONT.family };
const EASE = 'cubic-bezier(0.22,1,0.36,1)';
const DAY_NAMES  = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const DAY_LABELS = { lunes:'Lunes', martes:'Martes', miercoles:'Miércoles', jueves:'Jueves', viernes:'Viernes', sabado:'Sábado', domingo:'Domingo' };
const todayKey   = DAY_NAMES[new Date().getDay()];

const SORT_OPTIONS = [
  { id:'def',  label:'Relevancia'   },
  { id:'az',   label:'A → Z'        },
  { id:'asc',  label:'Menor precio' },
  { id:'desc', label:'Mayor precio' },
];

/* ─── Variantes Framer ───────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity:0, y:20 },
  show:   { opacity:1, y:0, transition:{ duration:0.5, ease:[0.22,1,0.36,1] } },
};
const stagger = {
  hidden: {},
  show:   { transition:{ staggerChildren:0.06, delayChildren:0.05 } },
};
const cardVar = {
  hidden: { opacity:0, y:18, scale:0.97 },
  show:   { opacity:1, y:0,  scale:1,    transition:{ duration:0.45, ease:[0.22,1,0.36,1] } },
};
const slideUp = {
  hidden: { opacity:0, y:'100%' },
  show:   { opacity:1, y:0,      transition:{ type:'spring', stiffness:200, damping:26 } },
  exit:   { opacity:0, y:'100%', transition:{ duration:0.2 } },
};
const slideRight = {
  hidden: { opacity:0, x:'100%' },
  show:   { opacity:1, x:0,      transition:{ type:'spring', stiffness:200, damping:26 } },
  exit:   { opacity:0, x:'100%', transition:{ duration:0.2 } },
};

/* ─── Normalizar producto ────────────────────────────────────────────────── */
const norm = p => ({
  ...p,
  nombre: p.nombre || p.titulo || '',
  foto:   p.foto   || p.fotos?.[0] || p.galeria?.[0] || null,
});

/* ─── QtySelector ────────────────────────────────────────────────────────── */
function QtySelector({ qty, onAdd, onRemove, h = 34 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:2, height:h, borderRadius:10, border:'1px solid rgba(128,128,128,.18)', padding:'0 3px', background:'none' }}>
      <motion.button whileTap={{ scale:0.85 }} onClick={onRemove}
        style={{ width:h-6, height:h-6, border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:7, color:'inherit' }}>
        <Minus size={12} />
      </motion.button>
      <span style={{ fontSize:13, fontWeight:800, minWidth:20, textAlign:'center' }}>{qty}</span>
      <motion.button whileTap={{ scale:0.85 }} onClick={onAdd}
        style={{ width:h-6, height:h-6, border:'none', background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', borderRadius:7, color:'inherit' }}>
        <Plus size={12} />
      </motion.button>
    </div>
  );
}

/* ─── FiltersPanel ───────────────────────────────────────────────────────── */
function FiltersPanel({ cats, catSel, setCatSel, sort, setSort, soloConPrecio, setSoloConPrecio, isDark, c }) {
  const txt    = isDark ? '#f1f5f9' : '#0f172a';
  const txtM   = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  const primary = 'var(--tp-primary)';
  const btn = (active) => ({
    textAlign:'left', padding:'9px 12px', borderRadius:11, border:'none',
    cursor:'pointer', fontSize:13, fontWeight:600,
    background: active ? primary : 'transparent',
    color:      active ? 'var(--tp-on-primary)' : txt,
    transition:'background .15s', width:'100%', ...F,
  });
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
      <div>
        <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.07em' }}>Ordenar</p>
        <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
          {SORT_OPTIONS.map(o => (
            <button key={o.id} onClick={() => setSort(o.id)} style={btn(sort===o.id)}>{o.label}</button>
          ))}
        </div>
      </div>
      {cats.length > 0 && (
        <div>
          <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.07em' }}>Categoría</p>
          <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
            <button onClick={() => setCatSel(null)} style={btn(catSel===null)}>Todas</button>
            {cats.map(c => (
              <button key={c} onClick={() => setCatSel(c)} style={btn(catSel===c)}>{c}</button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.07em' }}>Precio</p>
        <button onClick={() => setSoloConPrecio(v => !v)}
          style={{ ...btn(soloConPrecio), border:`1px solid ${border}` }}>
          Solo con precio
        </button>
      </div>
    </div>
  );
}

/* ─── ProductosModal ─────────────────────────────────────────────────────── */
function ProductosModal({ activos, cart, onAdd, onRemove, isDark, tienda, onClose }) {
  const [q, setQ]                         = useState('');
  const [sort, setSort]                   = useState('def');
  const [catSel, setCatSel]               = useState(null);
  const [soloConPrecio, setSoloConPrecio] = useState(false);
  const [sheetOpen, setSheetOpen]         = useState(false);
  const [isWide, setIsWide]               = useState(false);
  const rootRef = useRef(null);

  const surf   = isDark ? '#111827' : '#fff';
  const bg     = isDark ? '#070b14' : '#f8fafc';
  const txt    = isDark ? '#f1f5f9' : '#0f172a';
  const txtM   = isDark ? '#94a3b8' : '#64748b';
  const border = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)';
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
      if (sort==='az')   return (a.nombre||'').localeCompare(b.nombre||'');
      if (sort==='asc')  return (a.precio??Infinity)-(b.precio??Infinity);
      if (sort==='desc') return (b.precio??-1)-(a.precio??-1);
      return 0;
    });

  const activeFilters = (catSel?1:0)+(soloConPrecio?1:0)+(sort!=='def'?1:0);
  const cartCount = cart.reduce((a,b)=>a+b.qty,0);
  const cartTotal = cart.reduce((a,b)=>a+(b.precio||0)*b.qty,0);
  const wa = buildWhatsAppUrl(tienda, cart, '');

  const ModalCard = ({ p, i }) => {
    const qty = cart?.find(c=>c.id===p.id)?.qty||0;
    const waConsulta = buildWhatsAppUrl(tienda||{}, [], '');
    return (
      <div style={{ background:surf, borderRadius:16, overflow:'hidden', display:'flex', flexDirection:'column', animation:`base-fade-up .3s ${EASE} ${i*12}ms both` }}>
        <div style={{ aspectRatio:'1/1', background:isDark?'rgba(255,255,255,.05)':'#f1f5f9', overflow:'hidden' }}>
          {p.foto
            ? <img src={p.foto} alt={p.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Package size={26} style={{ color:isDark?'rgba(255,255,255,.15)':'#cbd5e1' }}/></div>
          }
        </div>
        <div style={{ padding:'8px 10px 10px', flex:1, display:'flex', flexDirection:'column', gap:4, ...F }}>
          <p style={{ margin:0, fontSize:12, fontWeight:700, color:txt, lineHeight:1.3 }}>{p.nombre}</p>
          {p.precio!=null
            ? <span style={{ fontSize:14, fontWeight:900, color:txt, marginTop:'auto', marginBottom:4 }}>{formatPrice(p.precio)}</span>
            : <span style={{ fontSize:11, color:txtM, fontStyle:'italic', marginTop:'auto', marginBottom:4 }}>A consultar</span>
          }
          {p.precio!=null
            ? <QtySelector qty={qty} onAdd={()=>onAdd(p)} onRemove={()=>onRemove(p.id)} h={30} />
            : waConsulta
              ? <a href={`${waConsulta}&text=${encodeURIComponent(`Hola, quería consultar por: ${p.nombre}`)}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, height:28, borderRadius:9, border:`1px solid ${border}`, background:'none', color:txt, fontSize:11, fontWeight:700, textDecoration:'none', ...F }}>
                  <MessageCircle size={11}/> Consultar
                </a>
              : null
          }
        </div>
      </div>
    );
  };

  return createPortal(
    <div ref={rootRef} style={{ position:'fixed', inset:0, zIndex:9999, background:bg, display:'flex', flexDirection:'column', ...F }}>

      {/* Header modal */}
      <div style={{ background:surf, borderBottom:`1px solid ${border}`, paddingTop:'env(safe-area-inset-top)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px' }}>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:12, border:'none', background:isDark?'rgba(255,255,255,.07)':'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txt, flexShrink:0 }}>
            <ChevronLeft size={20}/>
          </button>
          <div style={{ flex:1, position:'relative' }}>
            <svg style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:txtM, pointerEvents:'none' }} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar en el catálogo..."
              style={{ width:'100%', paddingLeft:30, paddingRight:44, height:36, borderRadius:12, border:`1px solid ${border}`, background:isDark?'rgba(255,255,255,.05)':'#f1f5f9', color:txt, fontSize:13, outline:'none', boxSizing:'border-box', ...F }}/>
            <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:11, fontWeight:700, color:txtM, background:isDark?'rgba(255,255,255,.08)':'rgba(0,0,0,.05)', borderRadius:6, padding:'2px 6px' }}>{procesados.length}</span>
          </div>
          {!isWide && (
            <button onClick={()=>setSheetOpen(true)} style={{ position:'relative', width:36, height:36, borderRadius:12, border:'none', background:activeFilters>0?primary:isDark?'rgba(255,255,255,.07)':'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:activeFilters>0?'var(--tp-on-primary)':txt, flexShrink:0 }}>
              <SlidersHorizontal size={16}/>
              {activeFilters>0 && <span style={{ position:'absolute', top:5, right:5, width:7, height:7, borderRadius:999, background:'var(--tp-on-primary)', border:`2px solid ${primary}` }}/>}
            </button>
          )}
        </div>
        {/* Sort chips mobile */}
        {!isWide && (
          <div style={{ display:'flex', gap:6, padding:'0 12px 10px', overflowX:'auto', scrollbarWidth:'none' }}>
            {SORT_OPTIONS.map(o=>(
              <button key={o.id} onClick={()=>setSort(o.id)}
                style={{ flexShrink:0, padding:'5px 13px', borderRadius:999, border:`1px solid ${sort===o.id?primary:border}`, background:sort===o.id?primary:'none', color:sort===o.id?'var(--tp-on-primary)':txtM, fontSize:12, fontWeight:600, cursor:'pointer', whiteSpace:'nowrap', ...F }}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex:1, display:'flex', overflow:'hidden' }}>
        {/* Sidebar filtros desktop */}
        {isWide && (
          <div style={{ width:220, flexShrink:0, borderRight:`1px solid ${border}`, overflowY:'auto', padding:'16px 12px', background:surf }}>
            <FiltersPanel cats={cats} catSel={catSel} setCatSel={setCatSel} sort={sort} setSort={setSort} soloConPrecio={soloConPrecio} setSoloConPrecio={setSoloConPrecio} isDark={isDark}/>
          </div>
        )}
        {/* Grid */}
        <div style={{ flex:1, overflowY:'auto', padding:10 }}>
          {procesados.length===0 ? (
            <div style={{ textAlign:'center', padding:'56px 16px' }}>
              <Package size={40} style={{ color:isDark?'rgba(255,255,255,.12)':'#cbd5e1', marginBottom:12 }}/>
              <p style={{ margin:0, fontSize:14, fontWeight:700, color:txt }}>Sin resultados</p>
              <p style={{ margin:'4px 0 0', fontSize:12, color:txtM }}>Probá con otra búsqueda o limpiá los filtros</p>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(130px,1fr))', gap:8 }}>
              {procesados.map((p,i)=><ModalCard key={p.id} p={p} i={i}/>)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet filtros mobile */}
      {sheetOpen && !isWide && createPortal(
        <div style={{ position:'fixed', inset:0, zIndex:10001, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', backdropFilter:'blur(6px)' }} onClick={()=>setSheetOpen(false)}/>
          <div style={{ position:'relative', background:surf, borderRadius:'22px 22px 0 0', maxHeight:'75dvh', display:'flex', flexDirection:'column', ...F }}>
            <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 0' }}>
              <div style={{ width:36, height:4, borderRadius:2, background:isDark?'rgba(255,255,255,.12)':'rgba(0,0,0,.1)' }}/>
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px' }}>
              <h3 style={{ margin:0, fontSize:16, fontWeight:800, color:isDark?'#f1f5f9':'#0f172a' }}>Filtros</h3>
              {activeFilters>0 && (
                <button onClick={()=>{ setSort('def'); setCatSel(null); setSoloConPrecio(false); }} style={{ fontSize:13, fontWeight:700, color:'var(--tp-primary)', background:'none', border:'none', cursor:'pointer' }}>
                  Limpiar
                </button>
              )}
            </div>
            <div style={{ flex:1, overflowY:'auto', padding:'0 18px 32px' }}>
              <FiltersPanel cats={cats} catSel={catSel} setCatSel={setCatSel} sort={sort} setSort={setSort} soloConPrecio={soloConPrecio} setSoloConPrecio={setSoloConPrecio} isDark={isDark}/>
            </div>
            <div style={{ padding:'10px 18px 28px', borderTop:`1px solid ${isDark?'rgba(255,255,255,.08)':'rgba(0,0,0,.07)'}` }}>
              <button onClick={()=>setSheetOpen(false)} style={{ width:'100%', height:46, borderRadius:14, border:'none', background:'var(--tp-primary)', color:'var(--tp-on-primary)', fontSize:15, fontWeight:800, cursor:'pointer', ...F }}>
                Ver {procesados.length} productos
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CTA carrito flotante */}
      {cartCount>0 && (
        <button onClick={onClose}
          style={{ position:'fixed', bottom:18, left:16, right:16, zIndex:10000, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderRadius:18, background:'var(--tp-primary)', color:'var(--tp-on-primary)', border:'none', cursor:'pointer', fontWeight:800, fontSize:15, boxShadow:'0 8px 40px rgba(0,0,0,.25)', ...F }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <ShoppingBag size={18}/> Ver pedido
          </div>
          <div style={{ display:'flex', gap:6 }}>
            <span style={{ background:'rgba(0,0,0,.18)', borderRadius:8, padding:'3px 10px', fontSize:13 }}>{cartCount}</span>
            <span style={{ background:'rgba(0,0,0,.18)', borderRadius:8, padding:'3px 10px', fontSize:13 }}>{formatPrice(cartTotal)}</span>
          </div>
        </button>
      )}
    </div>,
    document.body
  );
}

/* ─── CartDrawer ─────────────────────────────────────────────────────────── */
function CartDrawer({ open, onClose, cart, onAdd, onRemove, note, setNote, isDark, tienda }) {
  const total = cart.reduce((a,b)=>a+(b.precio||0)*b.qty,0);
  const wa = buildWhatsAppUrl(tienda, cart, note);
  const surf   = isDark ? '#111827' : '#fff';
  const border = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)';
  const txt    = isDark ? '#f1f5f9' : '#0f172a';
  const txtM   = isDark ? '#94a3b8' : '#64748b';
  const bg2    = isDark ? 'rgba(255,255,255,.04)' : '#f8fafc';

  if (typeof document==='undefined') return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div onClick={onClose} initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            style={{ position:'fixed', inset:0, zIndex:9000, background:'rgba(0,0,0,.5)', backdropFilter:'blur(6px)' }}/>
          <motion.div variants={slideRight} initial="hidden" animate="show" exit="exit"
            style={{ position:'fixed', right:0, top:0, zIndex:9001, width:'100%', maxWidth:460, height:'100dvh', display:'flex', flexDirection:'column', background:surf, boxShadow:'-20px 0 60px rgba(0,0,0,.2)', ...F }}>

            {/* Header */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'20px 20px 16px', borderBottom:`1px solid ${border}` }}>
              <div>
                <p style={{ margin:0, fontSize:11, textTransform:'uppercase', letterSpacing:'0.3em', opacity:.5, color:txt }}>Tu pedido</p>
                <h3 style={{ margin:'2px 0 0', fontSize:20, fontWeight:800, color:txt }}>
                  Carrito <span style={{ fontSize:14, fontWeight:600, opacity:.5 }}>({cart.reduce((a,b)=>a+b.qty,0)})</span>
                </h3>
              </div>
              <button onClick={onClose} style={{ width:38, height:38, borderRadius:12, border:'none', background:isDark?'rgba(255,255,255,.07)':'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txt }}>
                <X size={18}/>
              </button>
            </div>

            {/* Items */}
            <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
              {cart.length===0 ? (
                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'100%', color:txtM, gap:12 }}>
                  <ShoppingBag size={44} style={{ opacity:.2 }}/>
                  <p style={{ fontSize:15, fontWeight:700, margin:0, color:txt }}>Tu carrito está vacío</p>
                  <p style={{ fontSize:13, margin:0, textAlign:'center' }}>Agregá productos para comenzar tu pedido</p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {cart.map(item=>(
                    <motion.div layout key={item.id}
                      style={{ display:'flex', gap:12, background:bg2, borderRadius:16, padding:12, border:`1px solid ${border}` }}>
                      <div style={{ width:72, height:72, borderRadius:12, overflow:'hidden', flexShrink:0, background:isDark?'rgba(255,255,255,.06)':'#e2e8f0' }}>
                        {item.foto
                          ? <img src={item.foto} alt={item.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
                          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}><Package size={20} style={{ color:txtM }}/></div>
                        }
                      </div>
                      <div style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column', gap:4 }}>
                        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:8 }}>
                          <p style={{ margin:0, fontSize:13, fontWeight:700, color:txt, lineHeight:1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{item.nombre}</p>
                          <button onClick={()=>{ for(let i=0;i<item.qty;i++) onRemove(item.id); }} style={{ flexShrink:0, background:'none', border:'none', cursor:'pointer', color:txtM, opacity:.6 }}>
                            <X size={14}/>
                          </button>
                        </div>
                        <p style={{ margin:0, fontSize:14, fontWeight:900, color:txt }}>{formatPrice((item.precio||0)*item.qty)}</p>
                        <QtySelector qty={item.qty} onAdd={()=>onAdd(item)} onRemove={()=>onRemove(item.id)} h={30}/>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* Nota + CTA */}
            {cart.length>0 && (
              <div style={{ padding:'12px 16px 28px', borderTop:`1px solid ${border}` }}>
                <textarea
                  value={note||''} onChange={e=>setNote?.(e.target.value)}
                  placeholder="Aclaración para el pedido (opcional)..."
                  rows={2}
                  style={{ width:'100%', padding:'10px 12px', borderRadius:12, border:`1px solid ${border}`, background:isDark?'rgba(255,255,255,.05)':'#f8fafc', color:txt, fontSize:13, resize:'none', outline:'none', boxSizing:'border-box', marginBottom:12, ...F }}
                />
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                  <span style={{ fontSize:14, color:txtM }}>Total</span>
                  <span style={{ fontSize:22, fontWeight:900, color:txt }}>{formatPrice(total)}</span>
                </div>
                {wa ? (
                  <a href={wa} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:10, height:52, borderRadius:16, background:'#25D366', color:'#fff', textDecoration:'none', fontSize:15, fontWeight:800, boxShadow:'0 8px 30px rgba(37,211,102,.3)', ...F }}>
                    <MessageCircle size={18}/> Pedir por WhatsApp
                  </a>
                ) : (
                  <div style={{ height:52, borderRadius:16, background:'var(--tp-primary)', color:'var(--tp-on-primary)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:800 }}>
                    {formatPrice(total)}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ─── ProductCard ────────────────────────────────────────────────────────── */
function ProductCard({ p, qty, onAdd, onRemove, isDark, tienda }) {
  const surf   = isDark ? 'rgba(255,255,255,.04)' : '#fff';
  const border = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';
  const txt    = isDark ? '#f1f5f9' : '#0f172a';
  const txtM   = isDark ? '#94a3b8' : '#64748b';
  const wa = buildWhatsAppUrl(tienda||{}, [], '');
  const desc = p.precioAnterior && p.precio
    ? Math.round((1-p.precio/p.precioAnterior)*100)
    : null;

  return (
    <motion.div variants={cardVar} whileHover={{ y:-4 }}
      style={{ borderRadius:20, border:`1px solid ${border}`, background:surf, overflow:'hidden', display:'flex', flexDirection:'column', boxShadow: isDark?'0 2px 12px rgba(0,0,0,.3)':'0 2px 12px rgba(0,0,0,.06)' }}>
      {/* Imagen */}
      <div style={{ position:'relative', overflow:'hidden', aspectRatio:'1/1', flexShrink:0 }}>
        {p.foto
          ? <motion.img whileHover={{ scale:1.06 }} transition={{ duration:0.45 }}
              src={p.foto} alt={p.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
          : <div style={{ width:'100%', height:'100%', background:isDark?'rgba(255,255,255,.06)':'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Package size={32} style={{ color:isDark?'rgba(255,255,255,.15)':'#cbd5e1' }}/>
            </div>
        }
        {/* Badge descuento */}
        {desc && (
          <div style={{ position:'absolute', top:8, left:8, background:'var(--tp-primary)', color:'var(--tp-on-primary)', borderRadius:999, padding:'3px 9px', fontSize:11, fontWeight:800 }}>
            -{desc}%
          </div>
        )}
        {/* Badge sin stock */}
        {p.activo===false && (
          <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.45)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ background:'rgba(0,0,0,.7)', color:'#fff', borderRadius:8, padding:'4px 12px', fontSize:12, fontWeight:700 }}>Sin stock</span>
          </div>
        )}
      </div>
      {/* Info */}
      <div style={{ padding:'10px 12px 12px', flex:1, display:'flex', flexDirection:'column', gap:4, ...F }}>
        {p.categoria && <p style={{ margin:0, fontSize:10, fontWeight:700, color:'var(--tp-primary)', textTransform:'uppercase', letterSpacing:'0.06em', opacity:.8 }}>{p.categoria}</p>}
        <p style={{ margin:0, fontSize:13, fontWeight:700, color:txt, lineHeight:1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.nombre}</p>
        {p.descripcion && <p style={{ margin:0, fontSize:11, color:txtM, lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>{p.descripcion}</p>}
        <div style={{ marginTop:'auto', paddingTop:8, display:'flex', alignItems:'center', justifyContent:'space-between', gap:6 }}>
          <div>
            {p.precioAnterior && <p style={{ margin:0, fontSize:11, color:txtM, textDecoration:'line-through' }}>{formatPrice(p.precioAnterior)}</p>}
            {p.precio!=null
              ? <p style={{ margin:0, fontSize:15, fontWeight:900, color:txt }}>{formatPrice(p.precio)}</p>
              : <p style={{ margin:0, fontSize:12, color:txtM, fontStyle:'italic' }}>A consultar</p>
            }
          </div>
          {p.activo!==false && (
            p.precio!=null
              ? (qty===0
                  ? <motion.button whileTap={{ scale:0.88 }} onClick={()=>onAdd(p)}
                      style={{ width:36, height:36, borderRadius:11, border:'none', cursor:'pointer', background:'var(--tp-primary)', color:'var(--tp-on-primary)', fontSize:22, fontWeight:700, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:'0 4px 16px color-mix(in srgb, var(--tp-primary) 35%, transparent)' }}>
                      +
                    </motion.button>
                  : <QtySelector qty={qty} onAdd={()=>onAdd(p)} onRemove={()=>onRemove(p.id)} h={32}/>
                )
              : wa
                ? <a href={`${wa}&text=${encodeURIComponent(`Hola, quería consultar por: ${p.nombre}`)}`} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:11, fontWeight:700, color:'var(--tp-primary)', textDecoration:'none', whiteSpace:'nowrap', ...F }}>
                    Consultar →
                  </a>
                : null
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Template principal ─────────────────────────────────────────────────── */
export function TemplateBase({ tienda, secciones, cart, onAdd, onRemove, note, isDark }) {
  const sec = Object.fromEntries((secciones||[]).map(s=>[s.id,s]));
  const { abierta, texto: textoApertura } = getEstadoApertura(tienda.horarios);

  const [search, setSearch]     = useState('');
  const [activeCat, setActiveCat] = useState(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verTodos, setVerTodos] = useState(false);
  const [noteLocal, setNoteLocal] = useState(note||'');
  const [searchOpen, setSearchOpen] = useState(false);

  const heroRef    = useRef(null);
  const catalogRef = useRef(null);

  const { scrollYProgress } = useScroll({ target:heroRef, offset:['start start','end start'] });
  const imgScale   = useTransform(scrollYProgress, [0,1], [1.06,1.18]);
  const imgOpacity = useTransform(scrollYProgress, [0,0.8], [0.7, 0.2]);
  const contentY   = useTransform(scrollYProgress, [0,1], [0,60]);

  const productosRaw = useMemo(()=>(tienda.productos||[]).map(norm), [tienda.productos]);
  const activos      = useMemo(()=>productosRaw.filter(p=>p.activo!==false), [productosRaw]);
  const categorias   = useMemo(()=>[...new Set(activos.map(p=>p.categoria||p.rubro).filter(Boolean))], [activos]);

  const filtered = useMemo(()=>{
    let list = activos;
    if (activeCat) list = list.filter(p=>(p.categoria||p.rubro)===activeCat);
    if (search)    list = list.filter(p=>p.nombre?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [activos, activeCat, search]);

  const cartCount = cart.reduce((a,b)=>a+b.qty,0);
  const cartTotal = cart.reduce((a,b)=>a+(b.precio||0)*b.qty,0);
  const wa = buildWhatsAppUrl(tienda, cart, noteLocal);

  /* Colores adaptativos */
  const bg      = isDark ? '#070b14' : '#f8fafc';
  const surf    = isDark ? 'rgba(255,255,255,.04)' : '#fff';
  const border  = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)';
  const txt     = isDark ? '#f1f5f9' : '#0f172a';
  const txtM    = isDark ? '#94a3b8' : '#64748b';
  const glass   = isDark ? 'rgba(7,11,20,.75)' : 'rgba(248,250,252,.85)';

  const scrollToCatalog = () => catalogRef.current?.scrollIntoView({ behavior:'smooth', block:'start' });

  return (
    <div style={{ background:bg, color:txt, minHeight:'100vh', overflowX:'hidden', ...F }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Ambient orbs ── */}
      <div style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0, overflow:'hidden' }}>
        <div style={{ position:'absolute', top:'-15%', left:'-10%', width:500, height:500, borderRadius:'50%', background:'color-mix(in srgb, var(--tp-primary) 18%, transparent)', filter:'blur(120px)' }}/>
        <div style={{ position:'absolute', bottom:'-15%', right:'-10%', width:450, height:450, borderRadius:'50%', background:'color-mix(in srgb, var(--tp-primary) 10%, transparent)', filter:'blur(140px)' }}/>
      </div>

      {/* ── Header ── */}
      <header style={{ position:'sticky', top:0, zIndex:50, borderBottom:`1px solid ${border}`, backdropFilter:'blur(20px)', background:glass }}>
        <div style={{ maxWidth:1440, margin:'0 auto', display:'flex', alignItems:'center', gap:10, padding:'0 16px', height:60 }}>

          {/* Logo + nombre */}
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            {tienda.logo
              ? <img src={tienda.logo} style={{ width:36, height:36, borderRadius:10, objectFit:'cover', flexShrink:0 }}/>
              : <div style={{ width:36, height:36, borderRadius:10, background:'var(--tp-primary)', flexShrink:0 }}/>
            }
            <span className="hidden sm:block" style={{ fontSize:15, fontWeight:800, letterSpacing:'-0.02em', color:txt }}>{tienda.nombre}</span>
          </div>

          {/* Search — desktop siempre visible / mobile toggle */}
          <AnimatePresence initial={false}>
            {(searchOpen || true) && (
              <motion.div className="hidden sm:flex" style={{ flex:1, maxWidth:400 }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, height:38, width:'100%', borderRadius:12, border:`1px solid ${border}`, background:isDark?'rgba(255,255,255,.05)':'rgba(0,0,0,.04)', padding:'0 12px' }}>
                  <Search size={15} style={{ opacity:.45, flexShrink:0 }}/>
                  <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar productos..."
                    style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:13, color:txt, ...F }}/>
                  {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:txtM, display:'flex' }}><X size={14}/></button>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div style={{ flex:1 }}/>

          {/* Search icon mobile */}
          <button onClick={()=>setSearchOpen(v=>!v)} className="sm:hidden"
            style={{ width:38, height:38, borderRadius:11, border:`1px solid ${border}`, background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txt }}>
            <Search size={16}/>
          </button>

          {/* Cart button */}
          <motion.button whileTap={{ scale:0.93 }} onClick={()=>setCartOpen(true)}
            style={{ position:'relative', display:'flex', alignItems:'center', gap:7, height:38, borderRadius:12, border:`1px solid ${border}`, background:cartCount>0?'var(--tp-primary)':surf, color:cartCount>0?'var(--tp-on-primary)':txt, padding:'0 14px', cursor:'pointer', fontSize:13, fontWeight:700, transition:`all .2s ${EASE}`, ...F }}>
            <ShoppingBag size={16}/>
            <span className="hidden sm:inline">Carrito</span>
            {cartCount>0 && (
              <span style={{ background:'rgba(0,0,0,.2)', borderRadius:999, minWidth:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, padding:'0 5px' }}>
                {cartCount}
              </span>
            )}
          </motion.button>
        </div>

        {/* Search mobile expandido */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }} className="sm:hidden overflow-hidden"
              style={{ borderTop:`1px solid ${border}`, padding:'10px 16px 10px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, height:38, borderRadius:12, border:`1px solid ${border}`, background:isDark?'rgba(255,255,255,.05)':'rgba(0,0,0,.04)', padding:'0 12px' }}>
                <Search size={15} style={{ opacity:.45 }}/>
                <input autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar productos..."
                  style={{ flex:1, background:'none', border:'none', outline:'none', fontSize:13, color:txt, ...F }}/>
                {search && <button onClick={()=>setSearch('')} style={{ background:'none', border:'none', cursor:'pointer', color:txtM }}><X size={14}/></button>}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero parallax ── */}
      {sec.hero?.activa!==false && (
        <section ref={heroRef} style={{ position:'relative', overflow:'hidden', zIndex:1 }}>
          <motion.div style={{ scale:imgScale, opacity:imgOpacity }} className="absolute inset-0">
            <img
              src={tienda.fotoPortada||tienda.cover||'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop'}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            />
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,.3) 0%, rgba(0,0,0,.5) 60%, rgba(0,0,0,.8) 100%)' }}/>
          </motion.div>

          <motion.div style={{ y:contentY, position:'relative', minHeight:'85vh', display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:'100px 20px 48px', maxWidth:1440, margin:'0 auto' }} className="relative">
            <motion.div variants={stagger} initial="hidden" animate="show">

              {/* Badge abierto/cerrado */}
              <motion.div variants={fadeUp} style={{ display:'inline-flex', alignItems:'center', gap:7, marginBottom:18 }}>
                <span style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(255,255,255,.1)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,.15)', borderRadius:999, padding:'6px 14px', fontSize:12, fontWeight:700, color:'#fff' }}>
                  <span style={{ width:7, height:7, borderRadius:'50%', background:abierta?'#4ade80':'#f87171', display:'inline-block', flexShrink:0 }}/>
                  {textoApertura}
                </span>
              </motion.div>

              {/* Logo + nombre */}
              <motion.div variants={fadeUp} style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                {tienda.logo && (
                  <img src={tienda.logo} style={{ width:60, height:60, borderRadius:16, objectFit:'cover', border:'2px solid rgba(255,255,255,.25)', flexShrink:0 }}/>
                )}
                <div>
                  <h1 style={{ margin:0, fontSize:'clamp(2rem,6vw,4.5rem)', fontWeight:900, color:'#fff', lineHeight:0.95, letterSpacing:'-0.04em' }}>{tienda.nombre}</h1>
                  {tienda.descripcion && <p style={{ margin:'8px 0 0', fontSize:15, color:'rgba(255,255,255,.7)', maxWidth:560, lineHeight:1.5 }}>{tienda.descripcion}</p>}
                </div>
              </motion.div>

              {/* Botones de acción */}
              <motion.div variants={fadeUp} style={{ display:'flex', flexWrap:'wrap', gap:10, marginTop:24 }}>
                <motion.button whileHover={{ scale:1.03 }} whileTap={{ scale:0.96 }} onClick={scrollToCatalog}
                  style={{ display:'flex', alignItems:'center', gap:8, height:48, borderRadius:14, padding:'0 24px', background:'var(--tp-primary)', color:'var(--tp-on-primary)', border:'none', cursor:'pointer', fontSize:14, fontWeight:800, boxShadow:'0 8px 32px rgba(0,0,0,.25)', ...F }}>
                  Ver catálogo →
                </motion.button>
                {tienda.whatsapp && (
                  <a href={`https://wa.me/${tienda.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:8, height:48, borderRadius:14, padding:'0 20px', background:'rgba(37,211,102,.18)', border:'1px solid rgba(37,211,102,.35)', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:700, backdropFilter:'blur(10px)', ...F }}>
                    <MessageCircle size={16}/> WhatsApp
                  </a>
                )}
                {tienda.instagram && (
                  <a href={`https://instagram.com/${tienda.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:8, height:48, borderRadius:14, padding:'0 20px', background:'rgba(255,255,255,.1)', border:'1px solid rgba(255,255,255,.18)', color:'#fff', textDecoration:'none', fontSize:14, fontWeight:700, backdropFilter:'blur(10px)', ...F }}>
                    <Instagram size={16}/> Instagram
                  </a>
                )}
              </motion.div>
            </motion.div>
          </motion.div>
        </section>
      )}

      {/* ── Contenido ── */}
      <div style={{ position:'relative', zIndex:1, maxWidth:1440, margin:'0 auto', padding:'24px 16px 120px' }}
        className="lg:grid lg:grid-cols-[260px_1fr] lg:gap-8 lg:items-start">

        {/* Sidebar desktop */}
        <aside className="hidden lg:block" style={{ position:'sticky', top:80 }}>
          <div style={{ background:surf, borderRadius:22, border:`1px solid ${border}`, padding:18, backdropFilter:'blur(16px)' }}>

            {/* Logo + status */}
            <div style={{ display:'flex', align:'center', gap:12, marginBottom:16, paddingBottom:16, borderBottom:`1px solid ${border}` }}>
              {tienda.logo && <img src={tienda.logo} style={{ width:44, height:44, borderRadius:12, objectFit:'cover', flexShrink:0 }}/>}
              <div>
                <p style={{ margin:0, fontSize:14, fontWeight:800, color:txt, lineHeight:1.2 }}>{tienda.nombre}</p>
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:11, fontWeight:700, color:abierta?'#22c55e':'#f87171', marginTop:4 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:abierta?'#22c55e':'#f87171', display:'inline-block' }}/>
                  {textoApertura}
                </span>
              </div>
            </div>

            {/* Categorías */}
            {categorias.length>0 && (
              <div style={{ marginBottom:16 }}>
                <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.07em' }}>Categorías</p>
                <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                  <button onClick={()=>setActiveCat(null)}
                    style={{ textAlign:'left', padding:'8px 12px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:activeCat===null?'color-mix(in srgb, var(--tp-primary) 14%, transparent)':'transparent', color:activeCat===null?'var(--tp-primary)':txt, transition:`all .15s`, ...F }}>
                    Todos los productos
                  </button>
                  {categorias.map(cat=>(
                    <button key={cat} onClick={()=>setActiveCat(cat)}
                      style={{ textAlign:'left', padding:'8px 12px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:600, background:activeCat===cat?'color-mix(in srgb, var(--tp-primary) 14%, transparent)':'transparent', color:activeCat===cat?'var(--tp-primary)':txt, transition:`all .15s`, ...F }}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Contacto */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {tienda.whatsapp && (
                <a href={`https://wa.me/${tienda.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, color:txt, textDecoration:'none', padding:'7px 0' }}>
                  <MessageCircle size={15} style={{ color:'#25D366', flexShrink:0 }}/> WhatsApp
                </a>
              )}
              {tienda.instagram && (
                <a href={`https://instagram.com/${tienda.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, color:txt, textDecoration:'none', padding:'7px 0' }}>
                  <Instagram size={15} style={{ color:'#E1306C', flexShrink:0 }}/> @{tienda.instagram.replace('@','')}
                </a>
              )}
              {tienda.telefono && (
                <a href={`tel:${tienda.telefono}`}
                  style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, color:txt, textDecoration:'none', padding:'7px 0' }}>
                  <Phone size={15} style={{ color:'var(--tp-primary)', flexShrink:0 }}/> {tienda.telefono}
                </a>
              )}
              {tienda.sitioWeb && (
                <a href={tienda.sitioWeb} target="_blank" rel="noopener noreferrer"
                  style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, fontWeight:600, color:txt, textDecoration:'none', padding:'7px 0' }}>
                  <Globe size={15} style={{ color:'var(--tp-primary)', flexShrink:0 }}/> Sitio web
                </a>
              )}
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main ref={catalogRef}>

          {/* Category chips mobile */}
          {categorias.length>0 && (
            <div style={{ display:'flex', gap:8, overflowX:'auto', scrollbarWidth:'none', marginBottom:16, paddingBottom:2 }} className="lg:hidden">
              <button onClick={()=>setActiveCat(null)}
                style={{ flexShrink:0, borderRadius:999, padding:'7px 16px', fontSize:13, fontWeight:700, border:'none', cursor:'pointer', background:activeCat===null?'var(--tp-primary)':isDark?'rgba(255,255,255,.07)':'rgba(0,0,0,.06)', color:activeCat===null?'var(--tp-on-primary)':txt, ...F }}>
                Todos
              </button>
              {categorias.map(cat=>(
                <button key={cat} onClick={()=>setActiveCat(cat)}
                  style={{ flexShrink:0, borderRadius:999, padding:'7px 16px', fontSize:13, fontWeight:700, border:'none', cursor:'pointer', whiteSpace:'nowrap', background:activeCat===cat?'var(--tp-primary)':isDark?'rgba(255,255,255,.07)':'rgba(0,0,0,.06)', color:activeCat===cat?'var(--tp-on-primary)':txt, ...F }}>
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Header sección productos */}
          {sec.productos?.activa!==false && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
                <div>
                  <h2 style={{ margin:0, fontSize:20, fontWeight:800, letterSpacing:'-0.03em', color:txt }}>
                    {activeCat||'Catálogo'}
                  </h2>
                  <p style={{ margin:'2px 0 0', fontSize:13, color:txtM }}>{filtered.length} producto{filtered.length!==1?'s':''}</p>
                </div>
                {activos.length>0 && (
                  <button onClick={()=>setVerTodos(true)}
                    style={{ fontSize:13, fontWeight:700, color:'var(--tp-primary)', background:'none', border:'none', cursor:'pointer', padding:'6px 0', ...F }}>
                    Ver todos →
                  </button>
                )}
              </div>

              {/* Grid productos */}
              <motion.div variants={stagger} initial="hidden" animate="show"
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4"
                style={{ display:'grid', gap:12 }}>
                {filtered.map((p,i)=>{
                  const qty = cart?.find(c=>c.id===p.id)?.qty||0;
                  return <ProductCard key={p.id||i} p={p} qty={qty} onAdd={onAdd} onRemove={onRemove} isDark={isDark} tienda={tienda}/>;
                })}
              </motion.div>

              {filtered.length===0 && (
                <div style={{ textAlign:'center', padding:'56px 16px', color:txtM }}>
                  <Package size={40} style={{ marginBottom:12, opacity:.3 }}/>
                  <p style={{ fontSize:15, fontWeight:700, margin:0, color:txt }}>Sin productos</p>
                  <p style={{ fontSize:13, margin:'4px 0 0' }}>Probá con otra categoría o buscador</p>
                </div>
              )}
            </>
          )}

          {/* Sección Sobre nosotros */}
          {sec.sobre?.activa!==false && tienda.descripcion && (
            <div style={{ marginTop:40, background:surf, borderRadius:20, border:`1px solid ${border}`, padding:24 }}>
              <h3 style={{ margin:'0 0 10px', fontSize:17, fontWeight:800, color:txt }}>Sobre nosotros</h3>
              <p style={{ margin:0, fontSize:14, color:txtM, lineHeight:1.7 }}>{tienda.descripcion}</p>
            </div>
          )}

          {/* Sección Horarios */}
          {sec.horarios?.activa!==false && tienda.horarios && Object.keys(tienda.horarios).length>0 && (
            <div style={{ marginTop:20, background:surf, borderRadius:20, border:`1px solid ${border}`, padding:24 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
                <Clock size={16} style={{ color:'var(--tp-primary)' }}/>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:txt }}>Horarios</h3>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {Object.entries(tienda.horarios).map(([key, horario])=>{
                  const isToday = key===todayKey;
                  const label   = DAY_LABELS[key]||key;
                  const valor   = typeof horario==='object'
                    ? horario.cerrado ? 'Cerrado' : (horario.abre&&horario.cierra ? `${horario.abre} – ${horario.cierra}` : '')
                    : (horario||'Cerrado');
                  return (
                    <div key={key} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 12px', borderRadius:10, background:isToday?'color-mix(in srgb, var(--tp-primary) 10%, transparent)':'transparent' }}>
                      <span style={{ fontSize:13, fontWeight:isToday?800:500, color:isToday?'var(--tp-primary)':txt }}>
                        {label}{isToday&&<span style={{ marginLeft:6, fontSize:10, fontWeight:700, opacity:.7, textTransform:'uppercase' }}>hoy</span>}
                      </span>
                      <span style={{ fontSize:13, fontWeight:isToday?700:400, color:valor==='Cerrado'?'#f87171':isToday?txt:txtM }}>{valor}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Sección Contacto */}
          {sec.contacto?.activa!==false && (
            <div style={{ marginTop:20, background:surf, borderRadius:20, border:`1px solid ${border}`, padding:24 }}>
              <h3 style={{ margin:'0 0 14px', fontSize:17, fontWeight:800, color:txt }}>Contacto</h3>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {tienda.whatsapp && (
                  <a href={`https://wa.me/${tienda.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12, background:'rgba(37,211,102,.08)', border:'1px solid rgba(37,211,102,.2)', textDecoration:'none' }}>
                    <MessageCircle size={18} style={{ color:'#25D366', flexShrink:0 }}/>
                    <span style={{ fontSize:14, fontWeight:600, color:txt, ...F }}>{tienda.whatsapp}</span>
                  </a>
                )}
                {tienda.instagram && (
                  <a href={`https://instagram.com/${tienda.instagram.replace('@','')}`} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12, background:'rgba(225,48,108,.07)', border:'1px solid rgba(225,48,108,.15)', textDecoration:'none' }}>
                    <Instagram size={18} style={{ color:'#E1306C', flexShrink:0 }}/>
                    <span style={{ fontSize:14, fontWeight:600, color:txt, ...F }}>@{tienda.instagram.replace('@','')}</span>
                  </a>
                )}
                {tienda.telefono && (
                  <a href={`tel:${tienda.telefono}`}
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12, background:`color-mix(in srgb, var(--tp-primary) 7%, transparent)`, border:`1px solid color-mix(in srgb, var(--tp-primary) 18%, transparent)`, textDecoration:'none' }}>
                    <Phone size={18} style={{ color:'var(--tp-primary)', flexShrink:0 }}/>
                    <span style={{ fontSize:14, fontWeight:600, color:txt, ...F }}>{tienda.telefono}</span>
                  </a>
                )}
                {tienda.sitioWeb && (
                  <a href={tienda.sitioWeb} target="_blank" rel="noopener noreferrer"
                    style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:12, background:`color-mix(in srgb, var(--tp-primary) 7%, transparent)`, border:`1px solid color-mix(in srgb, var(--tp-primary) 18%, transparent)`, textDecoration:'none' }}>
                    <Globe size={18} style={{ color:'var(--tp-primary)', flexShrink:0 }}/>
                    <span style={{ fontSize:14, fontWeight:600, color:txt, ...F }}>{tienda.sitioWeb}</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Sección Mapa */}
          {sec.mapa?.activa && tienda.direccion && (
            <div style={{ marginTop:20, background:surf, borderRadius:20, border:`1px solid ${border}`, overflow:'hidden' }}>
              <div style={{ padding:'18px 20px 12px', display:'flex', alignItems:'center', gap:8 }}>
                <MapPin size={16} style={{ color:'var(--tp-primary)' }}/>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:txt }}>Ubicación</h3>
              </div>
              <Suspense fallback={<div style={{ height:220, background:isDark?'rgba(255,255,255,.04)':'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', color:txtM, fontSize:13 }}>Cargando mapa...</div>}>
                <MapaSection tienda={tienda} isDark={isDark}/>
              </Suspense>
            </div>
          )}
        </main>
      </div>

      {/* ── CTA flotante carrito ── */}
      <AnimatePresence>
        {cartCount>0 && (
          <motion.button initial={{ opacity:0, y:80 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:80 }}
            whileTap={{ scale:0.95 }} onClick={()=>setCartOpen(true)}
            className="lg:bottom-8 lg:right-8 lg:left-auto"
            style={{ position:'fixed', bottom:68, left:16, right:16, zIndex:49, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 20px', borderRadius:18, background:'var(--tp-primary)', color:'var(--tp-on-primary)', border:'none', cursor:'pointer', fontSize:15, fontWeight:800, boxShadow:'0 10px 40px rgba(0,0,0,.25)', ...F }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <ShoppingBag size={18}/> Ver pedido
            </div>
            <div style={{ display:'flex', gap:6 }}>
              <span style={{ background:'rgba(0,0,0,.18)', borderRadius:8, padding:'3px 10px', fontSize:13 }}>{cartCount}</span>
              <span style={{ background:'rgba(0,0,0,.18)', borderRadius:8, padding:'3px 10px', fontSize:13 }}>{formatPrice(cartTotal)}</span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Bottom nav mobile ── */}
      <div className="lg:hidden" style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:50, borderTop:`1px solid ${border}`, backdropFilter:'blur(20px)', background:glass }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', paddingBottom:'env(safe-area-inset-bottom)' }}>
          {[
            { icon:Home,        label:'Inicio',   action:()=>window.scrollTo({top:0,behavior:'smooth'}) },
            { icon:Grid2X2,     label:'Categorías',action:()=>setSidebarOpen(true) },
            { icon:Search,      label:'Buscar',   action:()=>{ setSearchOpen(v=>!v); window.scrollTo({top:0,behavior:'smooth'}); } },
            { icon:ShoppingBag, label:'Carrito',  action:()=>setCartOpen(true) },
          ].map((item,i)=>{
            const Icon = item.icon;
            const isCart = item.label==='Carrito';
            return (
              <motion.button whileTap={{ scale:0.85 }} key={i} onClick={item.action}
                style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:3, padding:'10px 0 12px', border:'none', background:'none', cursor:'pointer', color:txt, position:'relative' }}>
                <Icon size={20}/>
                {isCart && cartCount>0 && (
                  <span style={{ position:'absolute', top:6, right:'50%', transform:'translateX(8px)', width:16, height:16, borderRadius:'50%', background:'var(--tp-primary)', color:'var(--tp-on-primary)', fontSize:9, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center' }}>
                    {cartCount}
                  </span>
                )}
                <span style={{ fontSize:10, fontWeight:600 }}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── Sidebar mobile ── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={()=>setSidebarOpen(false)}
              style={{ position:'fixed', inset:0, zIndex:70, background:'rgba(0,0,0,.5)', backdropFilter:'blur(4px)' }}/>
            <motion.aside variants={slideUp} initial="hidden" animate="show" exit="exit"
              style={{ position:'fixed', bottom:0, left:0, right:0, zIndex:80, maxHeight:'80dvh', overflowY:'auto', borderRadius:'24px 24px 0 0', border:`1px solid ${border}`, background:isDark?'#111827':'#fff', padding:'20px 18px 32px', ...F }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
                <h3 style={{ margin:0, fontSize:17, fontWeight:800, color:txt }}>Categorías</h3>
                <button onClick={()=>setSidebarOpen(false)} style={{ width:36, height:36, borderRadius:11, border:'none', background:isDark?'rgba(255,255,255,.08)':'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txt }}>
                  <X size={16}/>
                </button>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <button onClick={()=>{ setActiveCat(null); setSidebarOpen(false); }}
                  style={{ textAlign:'left', padding:'12px 14px', borderRadius:12, border:'none', cursor:'pointer', fontSize:14, fontWeight:600, background:activeCat===null?'color-mix(in srgb, var(--tp-primary) 12%, transparent)':'transparent', color:activeCat===null?'var(--tp-primary)':txt, ...F }}>
                  Todos los productos
                </button>
                {categorias.map(cat=>(
                  <button key={cat} onClick={()=>{ setActiveCat(cat); setSidebarOpen(false); }}
                    style={{ textAlign:'left', padding:'12px 14px', borderRadius:12, border:'none', cursor:'pointer', fontSize:14, fontWeight:600, background:activeCat===cat?'color-mix(in srgb, var(--tp-primary) 12%, transparent)':'transparent', color:activeCat===cat?'var(--tp-primary)':txt, ...F }}>
                    {cat}
                  </button>
                ))}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      {verTodos && (
        <ProductosModal activos={activos} cart={cart} onAdd={onAdd} onRemove={onRemove} isDark={isDark} tienda={tienda} onClose={()=>setVerTodos(false)}/>
      )}
      <CartDrawer open={cartOpen} onClose={()=>setCartOpen(false)} cart={cart} onAdd={onAdd} onRemove={onRemove} note={noteLocal} setNote={setNoteLocal} isDark={isDark} tienda={tienda}/>
    </div>
  );
}

const GLOBAL_CSS = `
  .no-scrollbar::-webkit-scrollbar { display:none; }
  .no-scrollbar { scrollbar-width:none; }
  html { scroll-behavior:smooth; }
  ::selection { background:var(--tp-primary); color:var(--tp-on-primary); }
  @keyframes base-fade-up {
    from { opacity:0; transform:translateY(14px); }
    to   { opacity:1; transform:translateY(0); }
  }
`;
