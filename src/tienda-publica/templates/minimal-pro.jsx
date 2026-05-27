import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  MapPin, Phone, MessageCircle, Instagram, Globe,
  Search, X, Plus, Minus, ShoppingBag, Clock,
  ChevronRight, Star, Shield, CheckCircle,
} from 'lucide-react';
import { buildWhatsAppUrl, getEstadoApertura, formatPrice } from '../utils.js';
import { FONT } from '../tokens.js';

export const META = {
  label: 'Minimal Pro',
  desc: 'Lista vertical compacta, sin hero. Ideal para servicios, profesionales y catálogos chicos.',
};

const F    = { fontFamily: FONT.family };
const EASE = 'cubic-bezier(0.22,1,0.36,1)';

const GLOBAL_CSS = `
  @keyframes mp-fade { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  @keyframes mp-shimmer { 0% { background-position:-200% 0; } 100% { background-position:200% 0; } }
  .mp-shimmer {
    background: linear-gradient(110deg,#e2e8f0 30%,#f1f5f9 50%,#e2e8f0 70%);
    background-size: 200% 100%;
    animation: mp-shimmer 1.4s ease infinite;
  }
  .mp-shimmer-dark {
    background: linear-gradient(110deg,rgba(255,255,255,.05) 30%,rgba(255,255,255,.10) 50%,rgba(255,255,255,.05) 70%);
    background-size: 200% 100%;
    animation: mp-shimmer 1.4s ease infinite;
  }
  .mp-row { transition: background .15s ease; animation: mp-fade .3s ease both; }
  .mp-row:hover { background: var(--mp-row-hover) !important; }
  .mp-chip { transition: background .15s ease, color .15s ease, transform .1s ease; }
  .mp-chip:active { transform: scale(0.94); }
  .mp-add-btn { transition: transform .15s ${EASE}, background .1s ease; }
  .mp-add-btn:active { transform: scale(0.92); }
  .mp-scrollbar::-webkit-scrollbar { display: none; }
  .mp-scrollbar { scrollbar-width: none; }
`;

const norm = (p) => ({
  ...p,
  nombre: p.nombre || p.titulo || '',
  foto:   p.foto || p.fotos?.[0] || p.galeria?.[0] || null,
});

// ─── QtySelector ──────────────────────────────────────────────────────────────
function QtySelector({ qty, onAdd, onRemove, isDark }) {
  const bg  = 'var(--tp-primary)';
  const clr = 'var(--tp-on-primary)';
  if (qty > 0) return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', background:bg, borderRadius:8, overflow:'hidden', height:32, width:88 }}>
      <button onClick={onRemove} style={{ border:'none', background:'none', cursor:'pointer', color:clr, display:'flex', alignItems:'center', justifyContent:'center' }}
        onMouseDown={e=>e.currentTarget.style.background='rgba(0,0,0,.2)'} onMouseUp={e=>e.currentTarget.style.background=''} onMouseLeave={e=>e.currentTarget.style.background=''}>
        <Minus size={12}/>
      </button>
      <span style={{ display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:800, color:clr, background:'rgba(0,0,0,.15)', margin:'3px 0', borderRadius:4, ...F }}>{qty}</span>
      <button onClick={onAdd} style={{ border:'none', background:'none', cursor:'pointer', color:clr, display:'flex', alignItems:'center', justifyContent:'center' }}
        onMouseDown={e=>e.currentTarget.style.background='rgba(0,0,0,.2)'} onMouseUp={e=>e.currentTarget.style.background=''} onMouseLeave={e=>e.currentTarget.style.background=''}>
        <Plus size={12}/>
      </button>
    </div>
  );
  return (
    <button onClick={onAdd} className="mp-add-btn"
      style={{ height:32, width:32, borderRadius:8, border:'none', background:bg, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:clr, flexShrink:0 }}>
      <Plus size={14}/>
    </button>
  );
}

// ─── ProductRow ───────────────────────────────────────────────────────────────
function ProductRow({ p, qty, onAdd, onRemove, isDark, bdr, isLast }) {
  const txt  = isDark ? '#f1f5f9' : '#0f172a';
  const txtM = isDark ? '#94a3b8' : '#64748b';
  const sinStock = p.activo === false;
  const hasDiscount = p.precioOriginal != null && p.precioOriginal > (p.precio ?? 0);
  const descPct = hasDiscount ? Math.round((1 - p.precio / p.precioOriginal) * 100) : null;

  return (
    <div className="mp-row" style={{
      display:'grid', gridTemplateColumns:'60px 1fr auto', alignItems:'center', gap:12,
      padding:'12px 16px', borderBottom: isLast ? 'none' : `1px solid ${bdr}`,
      opacity: sinStock ? .5 : 1,
      '--mp-row-hover': isDark ? 'rgba(255,255,255,.03)' : 'rgba(0,0,0,.02)',
    }}>
      {/* imagen */}
      <div style={{ width:60, height:60, borderRadius:12, overflow:'hidden', flexShrink:0, background:isDark?'rgba(255,255,255,.06)':'#f1f5f9', position:'relative' }}>
        {p.foto
          ? <img src={p.foto} alt={p.nombre} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, opacity:.2 }}>📦</div>
        }
        {descPct && !sinStock && (
          <span style={{ position:'absolute', top:3, left:3, background:'#ef4444', color:'#fff', fontSize:8, fontWeight:800, padding:'1px 4px', borderRadius:4, lineHeight:1.4, ...F }}>
            -{descPct}%
          </span>
        )}
      </div>

      {/* info */}
      <div style={{ minWidth:0 }}>
        <p style={{ margin:0, fontSize:13, fontWeight:700, color:txt, lineHeight:1.3, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', ...F }}>{p.nombre}</p>
        {p.descripcion && (
          <p style={{ margin:'3px 0 0', fontSize:11, color:txtM, lineHeight:1.4, overflow:'hidden', display:'-webkit-box', WebkitLineClamp:1, WebkitBoxOrient:'vertical', ...F }}>{p.descripcion}</p>
        )}
        <div style={{ display:'flex', alignItems:'baseline', gap:5, marginTop:4 }}>
          {p.precio != null
            ? <>
                <span style={{ fontSize:14, fontWeight:900, color:txt, letterSpacing:'-.02em', ...F }}>{formatPrice(p.precio)}</span>
                {hasDiscount && <span style={{ fontSize:11, fontWeight:500, color:txtM, textDecoration:'line-through', ...F }}>{formatPrice(p.precioOriginal)}</span>}
              </>
            : <span style={{ fontSize:11, fontWeight:600, color:'var(--tp-primary)', ...F }}>Consultar →</span>
          }
          {sinStock && <span style={{ fontSize:10, fontWeight:700, color:'#ef4444', ...F }}>· Sin stock</span>}
        </div>
      </div>

      {/* qty */}
      {!sinStock && p.precio != null && (
        <QtySelector qty={qty} onAdd={()=>onAdd(p)} onRemove={()=>onRemove(p.id)} isDark={isDark}/>
      )}
      {(sinStock || p.precio == null) && <div/>}
    </div>
  );
}

// ─── CartModal ────────────────────────────────────────────────────────────────
function CartModal({ cart, onAdd, onRemove, wa, isDark, onClose }) {
  const surf = isDark ? '#1e293b' : '#fff';
  const txt  = isDark ? '#f1f5f9' : '#0f172a';
  const txtM = isDark ? '#94a3b8' : '#64748b';
  const bdr  = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)';
  const total = cart.reduce((s, i) => s + (i.precio || 0) * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  React.useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  return createPortal(
    <div style={{ position:'fixed', inset:0, zIndex:9999, display:'flex', flexDirection:'column', justifyContent:'flex-end' }}>
      <div style={{ position:'absolute', inset:0, background:'rgba(0,0,0,.5)' }} onClick={onClose}/>
      <div style={{ position:'relative', background:surf, borderRadius:'20px 20px 0 0', maxHeight:'80dvh', display:'flex', flexDirection:'column', ...F }}>
        <div style={{ display:'flex', justifyContent:'center', padding:'12px 0 4px' }}>
          <div style={{ width:36, height:4, borderRadius:2, background:bdr }}/>
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 18px 12px' }}>
          <span style={{ fontSize:16, fontWeight:800, color:txt }}>Pedido ({count})</span>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:10, border:'none', background:isDark?'rgba(255,255,255,.08)':'#f1f5f9', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txt }}>
            <X size={16}/>
          </button>
        </div>
        <div style={{ overflowY:'auto', flex:1 }}>
          {cart.map((item, i) => (
            <div key={item.id} style={{ display:'grid', gridTemplateColumns:'40px 1fr auto 88px', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:`1px solid ${bdr}` }}>
              <div style={{ width:40, height:40, borderRadius:8, overflow:'hidden', background:isDark?'rgba(255,255,255,.06)':'#f1f5f9', flexShrink:0 }}>
                {(item.foto||item.fotos?.[0])
                  ? <img src={item.foto||item.fotos[0]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>📦</div>
                }
              </div>
              <p style={{ margin:0, fontSize:12, fontWeight:600, color:txt, lineHeight:1.3 }}>{item.nombre||item.titulo}</p>
              {item.precio != null
                ? <p style={{ margin:0, fontSize:13, fontWeight:800, color:'var(--tp-primary)', textAlign:'right' }}>{formatPrice(item.precio*item.qty)}</p>
                : <span/>
              }
              <QtySelector qty={item.qty} onAdd={()=>onAdd(item)} onRemove={()=>onRemove(item.id)} isDark={isDark}/>
            </div>
          ))}
        </div>
        <div style={{ padding:'14px 16px', paddingBottom:'calc(14px + env(safe-area-inset-bottom))', borderTop:`1px solid ${bdr}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
            <span style={{ fontSize:13, color:txtM, fontWeight:600 }}>Total estimado</span>
            <span style={{ fontSize:18, fontWeight:900, color:txt }}>{formatPrice(total)}</span>
          </div>
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer"
              style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, background:'var(--tp-primary)', color:'var(--tp-on-primary)', padding:'14px', borderRadius:14, textDecoration:'none', fontWeight:800, fontSize:15, ...F }}>
              <MessageCircle size={18}/> Pedir por WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── TEMPLATE PRINCIPAL ───────────────────────────────────────────────────────
export function TemplateMinimalPro({ tienda, secciones, cart, onAdd, onRemove, isDark }) {
  const s  = Object.fromEntries(secciones.map(sec => [sec.id, sec]));
  const wa = buildWhatsAppUrl(tienda, cart, '');
  const { abierta, texto: textoApertura } = getEstadoApertura(tienda.horarios);

  const [search,   setSearch]   = useState('');
  const [catSel,   setCatSel]   = useState(null);
  const [cartOpen, setCartOpen] = useState(false);

  const bg    = isDark ? '#0a0d16'  : '#f8fafc';
  const surf  = isDark ? '#1e293b'  : '#fff';
  const surf2 = isDark ? '#162032'  : '#f1f5f9';
  const txt   = isDark ? '#f1f5f9'  : '#0f172a';
  const txtM  = isDark ? '#94a3b8'  : '#64748b';
  const bdr   = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.07)';

  const productosRaw = useMemo(() =>
    (tienda.productos || []).map(norm),
  [tienda.productos]);

  const categorias = useMemo(() =>
    [...new Set(productosRaw.map(p => p.categoria).filter(Boolean))],
  [productosRaw]);

  const productos = useMemo(() => {
    const activos  = productosRaw.filter(p => p.activo !== false);
    const sinStock = productosRaw.filter(p => p.activo === false);
    let list = [...activos, ...sinStock];
    if (catSel) list = list.filter(p => p.categoria === catSel);
    if (search) list = list.filter(p => p.nombre?.toLowerCase().includes(search.toLowerCase()));
    return list;
  }, [productosRaw, catSel, search]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const ciudad    = tienda.ciudad?.split(',')[0]?.trim();

  return (
    <div style={{ background:bg, minHeight:'100dvh', ...F }}>
      <style>{GLOBAL_CSS}</style>

      {/* ── Header ── */}
      <header style={{ position:'sticky', top:0, zIndex:100, background:surf, borderBottom:`1px solid ${bdr}` }}>
        {/* fila 1: identidad + carrito */}
        <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px' }}>
          <div style={{ width:36, height:36, borderRadius:10, overflow:'hidden', flexShrink:0, background:tienda.logo?'transparent':'var(--tp-primary)', display:'flex', alignItems:'center', justifyContent:'center', border:`1px solid ${bdr}` }}>
            {tienda.logo
              ? <img src={tienda.logo} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : <span style={{ fontSize:14, fontWeight:900, color:'#fff', ...F }}>{tienda.nombre?.[0]?.toUpperCase()||'T'}</span>
            }
          </div>
          <div style={{ flex:1, minWidth:0 }}>
            <p style={{ margin:0, fontSize:14, fontWeight:800, color:txt, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', ...F }}>{tienda.nombre}</p>
            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
              {textoApertura && (
                <span style={{ fontSize:10, fontWeight:700, color:abierta?'#10b981':'#ef4444', display:'flex', alignItems:'center', gap:3, ...F }}>
                  <span style={{ width:5, height:5, borderRadius:'50%', background:'currentColor', display:'inline-block' }}/>
                  {textoApertura}
                </span>
              )}
              {ciudad && (
                <span style={{ fontSize:10, fontWeight:500, color:txtM, display:'flex', alignItems:'center', gap:2, ...F }}>
                  <MapPin size={9}/>{ciudad}
                </span>
              )}
            </div>
          </div>
          {wa && (
            <button onClick={() => cartCount > 0 && setCartOpen(true)}
              style={{ position:'relative', width:36, height:36, borderRadius:10, border:`1px solid ${bdr}`, background:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', color:txt }}>
              <ShoppingBag size={16}/>
              {cartCount > 0 && (
                <span style={{ position:'absolute', top:-4, right:-4, background:'var(--tp-primary)', color:'var(--tp-on-primary)', borderRadius:999, width:16, height:16, fontSize:9, fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', ...F }}>
                  {cartCount}
                </span>
              )}
            </button>
          )}
        </div>

        {/* fila 2: search */}
        <div style={{ padding:'0 16px 10px' }}>
          <div style={{ position:'relative' }}>
            <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:txtM, pointerEvents:'none' }}/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto o servicio..."
              style={{ width:'100%', height:36, borderRadius:10, border:`1px solid ${bdr}`, background:isDark?'rgba(255,255,255,.05)':'#f8fafc', padding:'0 32px 0 32px', fontSize:13, color:txt, outline:'none', boxSizing:'border-box', ...F }}/>
            {search && (
              <button onClick={() => setSearch('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:txtM, display:'flex' }}>
                <X size={13}/>
              </button>
            )}
          </div>
        </div>

        {/* fila 3: chips de categoría */}
        {categorias.length > 0 && (
          <div className="mp-scrollbar" style={{ display:'flex', gap:6, overflowX:'auto', padding:'0 16px 10px' }}>
            {['Todos', ...categorias].map(cat => {
              const active = cat === 'Todos' ? catSel === null : catSel === cat;
              return (
                <button key={cat} onClick={() => setCatSel(cat === 'Todos' ? null : cat)} className="mp-chip"
                  style={{ flexShrink:0, padding:'5px 12px', borderRadius:999, border:`1px solid ${active?'transparent':bdr}`, background:active?'var(--tp-primary)':(isDark?'rgba(255,255,255,.06)':'#f1f5f9'), color:active?'var(--tp-on-primary)':txtM, fontSize:11, fontWeight:700, cursor:'pointer', ...F }}>
                  {cat}
                </button>
              );
            })}
          </div>
        )}
      </header>

      {/* ── Sobre la tienda (mini) ── */}
      {s.sobre?.activa && (tienda.descripcion || tienda.slogan) && (
        <div style={{ padding:'14px 16px 0' }}>
          <div style={{ background:surf, borderRadius:14, padding:'14px 16px', border:`1px solid ${bdr}` }}>
            {tienda.slogan && <p style={{ margin:'0 0 4px', fontSize:13, fontWeight:700, color:txt, ...F }}>{tienda.slogan}</p>}
            {tienda.descripcion && <p style={{ margin:0, fontSize:12, color:txtM, lineHeight:1.7, ...F }}>{tienda.descripcion}</p>}
          </div>
        </div>
      )}

      {/* ── Lista de productos ── */}
      {s.productos?.activa && (
        <div style={{ padding:'14px 16px 0' }}>
          {productos.length === 0 ? (
            search
              ? <p style={{ textAlign:'center', color:txtM, fontSize:14, padding:'40px 0' }}>Sin resultados para "{search}"</p>
              : (
                <div style={{ background:surf, borderRadius:16, overflow:'hidden', border:`1px solid ${bdr}` }}>
                  {[1,2,3,4].map((_, i, arr) => (
                    <div key={i} style={{ display:'grid', gridTemplateColumns:'60px 1fr', gap:12, padding:'12px 16px', borderBottom:i<arr.length-1?`1px solid ${bdr}`:'none' }}>
                      <div className={isDark?'mp-shimmer-dark':'mp-shimmer'} style={{ width:60, height:60, borderRadius:12 }}/>
                      <div>
                        <div className={isDark?'mp-shimmer-dark':'mp-shimmer'} style={{ height:10, borderRadius:6, marginBottom:8 }}/>
                        <div className={isDark?'mp-shimmer-dark':'mp-shimmer'} style={{ height:10, borderRadius:6, width:'55%' }}/>
                      </div>
                    </div>
                  ))}
                </div>
              )
          ) : (
            <div>
              {/* agrupar por categoría si hay más de 1 categoría y no hay filtro ni search */}
              {categorias.length > 1 && !catSel && !search
                ? categorias.map(cat => {
                    const items = productos.filter(p => p.categoria === cat);
                    if (!items.length) return null;
                    return (
                      <div key={cat} style={{ marginBottom:16 }}>
                        <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.06em', ...F }}>{cat}</p>
                        <div style={{ background:surf, borderRadius:16, overflow:'hidden', border:`1px solid ${bdr}` }}>
                          {items.map((p, i) => {
                            const qty = cart?.find(c => c.id === p.id)?.qty || 0;
                            return <ProductRow key={p.id} p={p} qty={qty} onAdd={onAdd} onRemove={onRemove} isDark={isDark} bdr={bdr} isLast={i===items.length-1}/>;
                          })}
                        </div>
                      </div>
                    );
                  })
                : (
                  <div style={{ background:surf, borderRadius:16, overflow:'hidden', border:`1px solid ${bdr}`, marginBottom:16 }}>
                    {productos.map((p, i) => {
                      const qty = cart?.find(c => c.id === p.id)?.qty || 0;
                      return <ProductRow key={p.id} p={p} qty={qty} onAdd={onAdd} onRemove={onRemove} isDark={isDark} bdr={bdr} isLast={i===productos.length-1}/>;
                    })}
                  </div>
                )
              }
              {/* sin categoría al final */}
              {categorias.length > 1 && !catSel && !search && (() => {
                const sinCat = productos.filter(p => !p.categoria);
                if (!sinCat.length) return null;
                return (
                  <div style={{ marginBottom:16 }}>
                    <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.06em', ...F }}>Otros</p>
                    <div style={{ background:surf, borderRadius:16, overflow:'hidden', border:`1px solid ${bdr}` }}>
                      {sinCat.map((p, i) => {
                        const qty = cart?.find(c => c.id === p.id)?.qty || 0;
                        return <ProductRow key={p.id} p={p} qty={qty} onAdd={onAdd} onRemove={onRemove} isDark={isDark} bdr={bdr} isLast={i===sinCat.length-1}/>;
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      {/* ── Contacto ── */}
      {s.contacto?.activa && (
        <div style={{ padding:'0 16px 14px' }}>
          <p style={{ margin:'0 0 8px', fontSize:11, fontWeight:800, color:txtM, textTransform:'uppercase', letterSpacing:'.06em', ...F }}>Contacto</p>
          <div style={{ background:surf, borderRadius:16, overflow:'hidden', border:`1px solid ${bdr}` }}>
            {[
              tienda.whatsapp  && { icon:MessageCircle, label:'WhatsApp',                              href:`https://wa.me/${tienda.whatsapp.replace(/\D/g,'')}`,      color:'#25d366' },
              tienda.telefono  && { icon:Phone,         label:tienda.telefono,                          href:`tel:${tienda.telefono}`,                                  color:'var(--tp-primary)' },
              tienda.instagram && { icon:Instagram,     label:`@${tienda.instagram.replace('@','')}`,   href:`https://instagram.com/${tienda.instagram.replace('@','')}`, color:'#e1306c' },
              tienda.website   && { icon:Globe,         label:tienda.website,                           href:tienda.website,                                            color:'var(--tp-primary)' },
              tienda.direccion && { icon:MapPin,        label:tienda.direccion,                         href:null,                                                      color:txtM },
            ].filter(Boolean).map(({ icon:Icon, label, href, color }, i, arr) => (
              <a key={i} href={href||undefined} target={href?'_blank':undefined} rel="noopener noreferrer"
                style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderBottom:i<arr.length-1?`1px solid ${bdr}`:'none', textDecoration:'none', cursor:href?'pointer':'default' }}>
                <div style={{ width:32, height:32, borderRadius:10, background:isDark?'rgba(255,255,255,.06)':'#f1f5f9', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <Icon size={14} style={{ color }}/>
                </div>
                <span style={{ fontSize:13, fontWeight:600, color:txt, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', ...F }}>{label}</span>
                {href && <ChevronRight size={14} style={{ color:txtM, flexShrink:0 }}/>}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* ── Footer ── */}
      <footer style={{ padding:'16px 16px calc(80px + env(safe-area-inset-bottom))', borderTop:`1px solid ${bdr}` }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:14 }}>
          {/* trust badges */}
          <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
            {[
              { icon:Shield,      label:'Pago seguro' },
              { icon:CheckCircle, label:'Negocio verificado' },
              tienda.rating && { icon:Star, label:`${tienda.rating} estrellas` },
            ].filter(Boolean).map(({ icon:Icon, label }, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                <Icon size={12} style={{ color:'var(--tp-primary)', flexShrink:0 }}/>
                <span style={{ fontSize:11, color:txtM, fontWeight:600, ...F }}>{label}</span>
              </div>
            ))}
          </div>
          {/* horarios resumen */}
          {s.horarios?.activa && tienda.horarios && (
            <div>
              <p style={{ margin:'0 0 6px', fontSize:11, fontWeight:700, color:txt, ...F }}>Horarios</p>
              {Object.entries(tienda.horarios).slice(0, 3).map(([k, v]) => (
                <div key={k} style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <span style={{ fontSize:10, color:txtM, textTransform:'capitalize', ...F }}>{k}</span>
                  <span style={{ fontSize:10, fontWeight:600, color:txt, ...F }}>{v||'Cerrado'}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p style={{ margin:0, textAlign:'center', fontSize:10, color:txtM, ...F }}>Powered by LOKAL</p>
      </footer>

      {/* ── CTA flotante ── */}
      {wa && cart.length > 0 && (() => {
        const total = cart.reduce((s, i) => s + (i.precio||0)*i.qty, 0);
        return (
          <button onClick={() => setCartOpen(true)}
            style={{ position:'fixed', left:'50%', transform:'translateX(-50%)', bottom:20, zIndex:200, width:'calc(100% - 32px)', maxWidth:480, display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', background:'var(--tp-primary)', color:'var(--tp-on-primary)', border:'none', borderRadius:14, cursor:'pointer', fontWeight:800, fontSize:14, ...F, boxShadow:'0 8px 32px rgba(0,0,0,.25)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <ShoppingBag size={16}/>
              <span>Ver pedido</span>
            </div>
            <div style={{ display:'flex', gap:5 }}>
              <span style={{ background:'rgba(0,0,0,.18)', borderRadius:8, padding:'3px 9px', fontSize:12 }}>{cartCount}</span>
              <span style={{ background:'rgba(0,0,0,.18)', borderRadius:8, padding:'3px 9px', fontSize:12 }}>{formatPrice(total)}</span>
            </div>
          </button>
        );
      })()}

      {cartOpen && <CartModal cart={cart} onAdd={onAdd} onRemove={onRemove} wa={wa} isDark={isDark} onClose={() => setCartOpen(false)}/>}
    </div>
  );
}
