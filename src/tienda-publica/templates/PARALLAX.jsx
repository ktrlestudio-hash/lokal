import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Search, ShoppingBag, X, ChevronRight, Sparkles, Star,
  Menu, Home, Grid2X2, Heart, SlidersHorizontal, Minus, Plus,
  MessageCircle, Package, ChevronLeft,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { buildWhatsAppUrl, formatPrice } from '../utils.js';
import { FONT } from '../tokens.js';

export const META = {
  label: '✦ Nebula',
  desc: 'Cinematic 2026: parallax hero, glassmorphism, ambient orbs, sidebar desktop, dark/light adaptable.',
};

const F = { fontFamily: FONT.family };

/* ── Variantes ─────────────────────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const productVar = {
  hidden: { opacity: 0, y: 24, scale: 0.96 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};
const slideUp = {
  hidden: { opacity: 0, y: '100%' },
  show:   { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 180, damping: 24 } },
  exit:   { opacity: 0, y: '100%', transition: { duration: 0.22 } },
};
const slideRight = {
  hidden: { opacity: 0, x: '100%' },
  show:   { opacity: 1, x: 0, transition: { type: 'spring', stiffness: 200, damping: 26 } },
  exit:   { opacity: 0, x: '100%', transition: { duration: 0.22 } },
};

/* ── SORT / FILTROS ────────────────────────────────────────────────────────── */
const SORT_OPTIONS = [
  { id: 'def',  label: 'Relevancia'   },
  { id: 'az',   label: 'A → Z'        },
  { id: 'asc',  label: 'Menor precio' },
  { id: 'desc', label: 'Mayor precio' },
];

function FiltersPanel({ cats, catSel, setCatSel, sort, setSort, soloConPrecio, setSoloConPrecio, isDark, txt, txtM, border, primary }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, ...F }}>
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: txtM, textTransform: 'uppercase', letterSpacing: '.06em' }}>Ordenar</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {SORT_OPTIONS.map(o => (
            <button key={o.id} onClick={() => setSort(o.id)}
              style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: sort === o.id ? primary : 'none', color: sort === o.id ? 'var(--tp-on-primary)' : txt, transition: 'background .15s' }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
      {cats.length > 0 && (
        <div>
          <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: txtM, textTransform: 'uppercase', letterSpacing: '.06em' }}>Categoría</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <button onClick={() => setCatSel(null)}
              style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: catSel === null ? primary : 'none', color: catSel === null ? 'var(--tp-on-primary)' : txt }}>
              Todas
            </button>
            {cats.map(c => (
              <button key={c} onClick={() => setCatSel(c)}
                style={{ textAlign: 'left', padding: '8px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: catSel === c ? primary : 'none', color: catSel === c ? 'var(--tp-on-primary)' : txt }}>
                {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <div>
        <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 800, color: txtM, textTransform: 'uppercase', letterSpacing: '.06em' }}>Precio</p>
        <button onClick={() => setSoloConPrecio(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, border: `1px solid ${border}`, cursor: 'pointer', fontSize: 13, fontWeight: 600, background: soloConPrecio ? primary : 'none', color: soloConPrecio ? 'var(--tp-on-primary)' : txt, width: '100%' }}>
          Solo con precio
        </button>
      </div>
    </div>
  );
}

/* ── QtySelector ───────────────────────────────────────────────────────────── */
function QtySelector({ qty, onAdd, onRemove }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 32, borderRadius: 10, border: '1px solid rgba(128,128,128,.2)', padding: '0 4px', width: 'fit-content' }}>
      <button onClick={onRemove} style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'inherit' }}>
        <Minus size={12} />
      </button>
      <span style={{ fontSize: 13, fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{qty}</span>
      <button onClick={onAdd} style={{ width: 24, height: 24, border: 'none', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6, color: 'inherit' }}>
        <Plus size={12} />
      </button>
    </div>
  );
}

/* ── Modal Ver Todos ───────────────────────────────────────────────────────── */
function ProductosModal({ activos, cart, onAdd, onRemove, isDark, tienda, onClose }) {
  const [q, setQ]                           = useState('');
  const [sort, setSort]                     = useState('def');
  const [catSel, setCatSel]                 = useState(null);
  const [soloConPrecio, setSoloConPrecio]   = useState(false);
  const [sheetOpen, setSheetOpen]           = useState(false);
  const [isWide, setIsWide]                 = useState(false);
  const rootRef = useRef(null);

  const surf    = isDark ? '#0e1525' : '#fff';
  const bg      = isDark ? '#070b14' : '#f8fafc';
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

  const cats = [...new Set(activos.map(p => p.categoria).filter(Boolean))];

  const procesados = activos
    .filter(p => !q.trim() || p.nombre?.toLowerCase().includes(q.toLowerCase()) || p.descripcion?.toLowerCase().includes(q.toLowerCase()))
    .filter(p => !catSel || p.categoria === catSel)
    .filter(p => !soloConPrecio || p.precio != null)
    .sort((a, b) => {
      if (sort === 'az')   return (a.nombre || '').localeCompare(b.nombre || '');
      if (sort === 'asc')  return (a.precio ?? Infinity) - (b.precio ?? Infinity);
      if (sort === 'desc') return (b.precio ?? -1) - (a.precio ?? -1);
      return 0;
    });

  const activeFilters = (catSel ? 1 : 0) + (soloConPrecio ? 1 : 0) + (sort !== 'def' ? 1 : 0);

  const ModalCard = ({ p, i }) => {
    const qty = cart?.find(c => c.id === p.id)?.qty || 0;
    const wa  = buildWhatsAppUrl(tienda || {}, [], '');
    return (
      <div style={{ background: surf, borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column', animation: `nb-fade-up .3s cubic-bezier(0.16,1,0.3,1) ${i * 15}ms both` }}>
        <div style={{ aspectRatio: '1/1', background: isDark ? 'rgba(255,255,255,.06)' : '#f1f5f9', overflow: 'hidden' }}>
          {p.foto
            ? <img src={p.foto} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={28} style={{ color: isDark ? 'rgba(255,255,255,.15)' : '#cbd5e1' }} /></div>
          }
        </div>
        <div style={{ padding: '8px 10px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4, ...F }}>
          <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: txt, lineHeight: 1.3 }}>{p.nombre}</p>
          {p.precio != null
            ? <span style={{ fontSize: 13, fontWeight: 900, color: txt, marginTop: 'auto', marginBottom: 4 }}>{formatPrice(p.precio)}</span>
            : <span style={{ fontSize: 11, color: txtM, fontStyle: 'italic', marginTop: 'auto', marginBottom: 4 }}>A consultar</span>
          }
          {p.precio != null
            ? <QtySelector qty={qty} onAdd={() => onAdd(p)} onRemove={() => onRemove(p.id)} />
            : wa ? (
              <a href={`${wa}&text=${encodeURIComponent(`Hola, quería consultar por: ${p.nombre}`)}`} target="_blank" rel="noopener noreferrer"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 28, borderRadius: 9, border: `1px solid ${border}`, background: 'none', color: txt, fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                <MessageCircle size={11} /> Consultar
              </a>
            ) : null
          }
        </div>
      </div>
    );
  };

  const cartCount = cart.reduce((a, b) => a + b.qty, 0);
  const cartTotal = cart.reduce((a, b) => a + (b.precio || 0) * b.qty, 0);
  const wa = buildWhatsAppUrl(tienda, cart, '');

  return createPortal(
    <div ref={rootRef} style={{ position: 'fixed', inset: 0, zIndex: 9999, background: bg, display: 'flex', flexDirection: 'column', ...F }}>

      {/* Header */}
      <div style={{ background: surf, borderBottom: `1px solid ${border}`, paddingTop: 'env(safe-area-inset-top)', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <button onClick={onClose} style={{ width: 36, height: 36, borderRadius: 12, border: 'none', background: isDark ? 'rgba(255,255,255,.08)' : '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: txt, flexShrink: 0 }}>
            <ChevronLeft size={20} />
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: txtM, pointerEvents: 'none' }} width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar en el catálogo..."
              style={{ width: '100%', paddingLeft: 30, paddingRight: 42, height: 36, borderRadius: 12, border: `1px solid ${border}`, background: isDark ? 'rgba(255,255,255,.06)' : '#f1f5f9', color: txt, fontSize: 13, outline: 'none', boxSizing: 'border-box', ...F }} />
            <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: 11, fontWeight: 700, color: txtM, background: isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)', borderRadius: 6, padding: '2px 6px' }}>{procesados.length}</span>
          </div>
          {!isWide && (
            <button onClick={() => setSheetOpen(true)} style={{ position: 'relative', width: 36, height: 36, borderRadius: 12, border: 'none', background: activeFilters > 0 ? primary : isDark ? 'rgba(255,255,255,.08)' : '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: activeFilters > 0 ? 'var(--tp-on-primary)' : txt, flexShrink: 0 }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="16" y2="12"/><line x1="11" y1="18" x2="13" y2="18"/></svg>
              {activeFilters > 0 && <span style={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: 999, background: 'var(--tp-on-primary)', border: `2px solid ${primary}` }} />}
            </button>
          )}
        </div>
        {!isWide && (
          <div style={{ display: 'flex', gap: 6, padding: '0 12px 10px', overflowX: 'auto', scrollbarWidth: 'none' }}>
            {SORT_OPTIONS.map(o => (
              <button key={o.id} onClick={() => setSort(o.id)}
                style={{ flexShrink: 0, padding: '5px 12px', borderRadius: 999, border: `1px solid ${sort === o.id ? primary : border}`, background: sort === o.id ? primary : 'none', color: sort === o.id ? 'var(--tp-on-primary)' : txtM, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', ...F }}>
                {o.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {isWide && (
          <div style={{ width: 220, flexShrink: 0, borderRight: `1px solid ${border}`, overflowY: 'auto', padding: '16px 12px', background: surf }}>
            <FiltersPanel cats={cats} catSel={catSel} setCatSel={setCatSel} sort={sort} setSort={setSort} soloConPrecio={soloConPrecio} setSoloConPrecio={setSoloConPrecio} isDark={isDark} txt={txt} txtM={txtM} border={border} primary={primary} />
          </div>
        )}
        <div style={{ flex: 1, overflowY: 'auto', padding: 10 }}>
          {procesados.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 16px' }}>
              <Package size={40} style={{ color: isDark ? 'rgba(255,255,255,.15)' : '#cbd5e1', marginBottom: 12 }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: txt }}>Sin resultados</p>
              <p style={{ margin: '4px 0 0', fontSize: 12, color: txtM }}>Probá con otra búsqueda</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 8 }}>
              {procesados.map((p, i) => <ModalCard key={p.id} p={p} i={i} />)}
            </div>
          )}
        </div>
      </div>

      {/* Bottom sheet filtros mobile */}
      {sheetOpen && !isWide && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 10001, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.4)', backdropFilter: 'blur(4px)' }} onClick={() => setSheetOpen(false)} />
          <div style={{ position: 'relative', background: surf, borderRadius: '20px 20px 0 0', maxHeight: '75dvh', display: 'flex', flexDirection: 'column', ...F }}>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 0' }}>
              <div style={{ width: 36, height: 4, borderRadius: 2, background: border }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px' }}>
              <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800, color: txt }}>Filtros y orden</h3>
              {activeFilters > 0 && (
                <button onClick={() => { setSort('def'); setCatSel(null); setSoloConPrecio(false); }} style={{ fontSize: 12, fontWeight: 700, color: primary, background: 'none', border: 'none', cursor: 'pointer' }}>
                  Limpiar
                </button>
              )}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px 32px' }}>
              <FiltersPanel cats={cats} catSel={catSel} setCatSel={setCatSel} sort={sort} setSort={setSort} soloConPrecio={soloConPrecio} setSoloConPrecio={setSoloConPrecio} isDark={isDark} txt={txt} txtM={txtM} border={border} primary={primary} />
            </div>
            <div style={{ padding: '10px 16px 24px', borderTop: `1px solid ${border}` }}>
              <button onClick={() => setSheetOpen(false)} style={{ width: '100%', height: 44, borderRadius: 14, border: 'none', background: primary, color: 'var(--tp-on-primary)', fontSize: 15, fontWeight: 800, cursor: 'pointer', ...F }}>
                Ver {procesados.length} productos
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Carrito flotante */}
      {cartCount > 0 && (
        <button onClick={onClose} style={{ position: 'fixed', bottom: 18, left: 16, right: 16, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderRadius: 18, background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', border: 'none', cursor: 'pointer', fontWeight: 800, fontSize: 15, boxShadow: '0 8px 32px rgba(0,0,0,.22)', ...F }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ShoppingBag size={18} /> Ver pedido
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ background: 'rgba(0,0,0,.18)', borderRadius: 8, padding: '3px 9px', fontSize: 13 }}>{cartCount}</span>
            <span style={{ background: 'rgba(0,0,0,.18)', borderRadius: 8, padding: '3px 9px', fontSize: 13 }}>{formatPrice(cartTotal)}</span>
          </div>
        </button>
      )}
    </div>,
    document.body
  );
}

/* ── CartModal lateral ─────────────────────────────────────────────────────── */
function CartModal({ open, onClose, cart, onAdd, onRemove, isDark, tienda }) {
  const totalPrice = cart.reduce((a, b) => a + (b.precio || 0) * b.qty, 0);
  const wa = buildWhatsAppUrl(tienda, cart, '');
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-md" />
          <motion.div variants={slideRight} initial="hidden" animate="show" exit="exit"
            className={`fixed right-0 top-0 z-[100] flex h-screen w-full max-w-[480px] flex-col border-l ${isDark ? 'border-white/[0.08] bg-[#09101d]' : 'border-slate-200 bg-white'}`}
            style={F}>
            <div className={`flex items-center justify-between border-b px-6 py-5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <div>
                <p className="text-xs uppercase tracking-[0.3em] opacity-50">Shopping Cart</p>
                <h3 className="mt-1 text-xl font-bold">Tu pedido</h3>
              </div>
              <button onClick={onClose} className={`flex h-10 w-10 items-center justify-center rounded-2xl ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100'}`}>
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {cart.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-center">
                  <ShoppingBag size={44} className="mb-4 opacity-30" />
                  <h4 className="text-lg font-semibold">Carrito vacío</h4>
                  <p className="mt-2 max-w-[220px] text-sm opacity-60">Agregá productos para comenzar tu compra.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map(item => (
                    <motion.div layout key={item.id}
                      className={`flex gap-3 rounded-[20px] border p-3 ${isDark ? 'border-white/[0.08] bg-white/[0.03]' : 'border-slate-200 bg-slate-50'}`}>
                      <img src={item.foto} className="h-20 w-20 rounded-xl object-cover shrink-0" />
                      <div className="flex flex-1 flex-col min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold leading-tight truncate">{item.nombre}</p>
                          <button onClick={() => { for (let i = 0; i < item.qty; i++) onRemove(item.id); }} className="opacity-40 hover:opacity-100 shrink-0">
                            <X size={14} />
                          </button>
                        </div>
                        <p className="text-sm font-black mt-auto">{formatPrice(item.precio * item.qty)}</p>
                        <QtySelector qty={item.qty} onAdd={() => onAdd(item)} onRemove={() => onRemove(item.id)} />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            <div className={`border-t p-5 ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`}>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm opacity-60">Total</span>
                <span className="text-2xl font-black">{formatPrice(totalPrice)}</span>
              </div>
              {wa && cart.length > 0 && (
                <a href={wa} target="_blank" rel="noopener noreferrer"
                  className="flex h-13 w-full items-center justify-center gap-3 rounded-[18px] text-sm font-bold no-underline"
                  style={{ background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', height: 52, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: 18, textDecoration: 'none', fontSize: 15, fontWeight: 800 }}>
                  <MessageCircle size={18} /> Pedir por WhatsApp
                </a>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}

/* ── Template principal ────────────────────────────────────────────────────── */
export function TemplateNebula({ tienda, secciones, cart, onAdd, onRemove, note, isDark }) {
  const [search, setSearch]       = useState('');
  const [activeCat, setActiveCat] = useState('all');
  const [cartOpen, setCartOpen]   = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [verTodos, setVerTodos]   = useState(false);

  const heroRef = useRef(null);
  const catalogRef = useRef(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const heroScale   = useTransform(scrollYProgress, [0, 1], [1.05, 1.18]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.18]);
  const heroY       = useTransform(scrollYProgress, [0, 1], [0, 80]);

  const productos = tienda?.productos || [];

  const categories = useMemo(() => {
    const cats = productos.map(p => p.categoria || p.category).filter(Boolean);
    return ['all', ...new Set(cats)];
  }, [productos]);

  const filtered = useMemo(() => {
    return productos.filter(p => {
      const cat = p.categoria || p.category || 'General';
      const matchCat    = activeCat === 'all' || cat === activeCat;
      const matchSearch = !search || `${p.nombre || ''} ${p.descripcion || ''}`.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [productos, activeCat, search]);

  const activos = useMemo(() => productos.filter(p => p.activo !== false), [productos]);

  const totalItems = cart.reduce((a, b) => a + b.qty, 0);
  const totalPrice = cart.reduce((a, b) => a + (b.precio || 0) * b.qty, 0);

  const bg      = isDark ? '#070b14' : '#f8fafc';
  const surface = isDark ? 'rgba(255,255,255,.03)' : '#fff';
  const border  = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.08)';
  const txt     = isDark ? '#f1f5f9' : '#0f172a';
  const txtM    = isDark ? '#94a3b8' : '#64748b';

  const scrollToCatalog = () => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  return (
    <div className="overflow-x-hidden" style={{ background: bg, color: txt, minHeight: '100vh', ...F }}>
      <style>{GLOBAL_CSS}</style>

      {/* Ambient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute rounded-full" style={{ left: '-10%', top: '-10%', width: 520, height: 520, background: 'color-mix(in srgb, var(--tp-primary) 22%, transparent)', filter: 'blur(120px)' }} />
        <div className="absolute rounded-full" style={{ bottom: '-20%', right: '-10%', width: 520, height: 520, background: 'color-mix(in srgb, var(--tp-primary) 14%, transparent)', filter: 'blur(140px)' }} />
      </div>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, borderBottom: `1px solid ${border}`, backdropFilter: 'blur(24px)', background: isDark ? 'rgba(7,11,20,.7)' : 'rgba(248,250,252,.8)' }}>
        <div style={{ maxWidth: 1600, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: 64, gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden" style={{ width: 40, height: 40, borderRadius: 14, border: 'none', background: isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: txt }}>
              <Menu size={18} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {tienda?.logo
                ? <img src={tienda.logo} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover' }} />
                : <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--tp-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--tp-on-primary)' }}><Sparkles size={18} /></div>
              }
              <div className="hidden sm:block">
                <p style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.35em', opacity: 0.5, margin: 0 }}>Storefront</p>
                <h1 style={{ fontSize: 15, fontWeight: 700, margin: 0 }}>{tienda?.nombre || 'Nebula Store'}</h1>
              </div>
            </div>
          </div>

          {/* Search desktop */}
          <div className="hidden lg:flex" style={{ flex: 1, maxWidth: 540, padding: '0 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, width: '100%', borderRadius: 22, border: `1px solid ${border}`, background: surface, padding: '0 16px' }}>
              <Search size={16} style={{ opacity: 0.5, flexShrink: 0 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar productos..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: txt, ...F }} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <motion.button whileTap={{ scale: 0.95 }} onClick={() => setCartOpen(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 8, height: 44, borderRadius: 20, border: `1px solid ${border}`, background: surface, padding: '0 14px', cursor: 'pointer', color: txt }}>
              <ShoppingBag size={18} />
              <span className="hidden sm:block" style={{ fontSize: 14, fontWeight: 500 }}>Carrito</span>
              <span style={{ background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', borderRadius: 999, width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{totalItems}</span>
            </motion.button>
          </div>
        </div>
      </header>

      {/* Hero con parallax */}
      <section ref={heroRef} style={{ position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        <motion.div style={{ scale: heroScale, opacity: heroOpacity }} className="absolute inset-0">
          <img
            src={tienda?.fotoPortada || tienda?.cover || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1600&auto=format&fit=crop'}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,.4), rgba(0,0,0,.45), transparent)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at top, transparent, rgba(0,0,0,.8))' }} />
        </motion.div>

        <motion.div style={{ y: heroY, position: 'relative', maxWidth: 1600, margin: '0 auto', minHeight: '60vh', display: 'flex', alignItems: 'flex-end', padding: '80px 16px 48px' }} className="relative">
          <motion.div variants={stagger} initial="hidden" animate="show" style={{ maxWidth: 680 }}>
            <motion.div variants={fadeUp}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, borderRadius: 999, padding: '8px 16px', fontSize: 12, fontWeight: 600, marginBottom: 20, backdropFilter: 'blur(12px)', background: 'color-mix(in srgb, var(--tp-primary) 18%, transparent)', border: '1px solid color-mix(in srgb, var(--tp-primary) 28%, transparent)', color: 'white' }}>
              <Sparkles size={13} /> Experiencia ecommerce next-gen
            </motion.div>

            <motion.h2 variants={fadeUp} style={{ fontSize: 'clamp(2.5rem, 8vw, 6.5rem)', fontWeight: 900, lineHeight: 0.92, letterSpacing: '-0.05em', margin: '0 0 20px', color: '#fff' }}>
              {tienda?.nombre || 'Nebula'}<br />
              <span style={{ color: 'var(--tp-primary)' }}>Commerce</span>
            </motion.h2>

            {tienda?.descripcion && (
              <motion.p variants={fadeUp} style={{ fontSize: 16, lineHeight: 1.6, color: 'rgba(255,255,255,.7)', maxWidth: 560, margin: '0 0 28px' }}>
                {tienda.descripcion}
              </motion.p>
            )}

            <motion.div variants={fadeUp} style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.96 }} onClick={scrollToCatalog}
                style={{ display: 'flex', alignItems: 'center', gap: 10, height: 52, borderRadius: 26, padding: '0 28px', fontSize: 15, fontWeight: 700, background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', border: 'none', cursor: 'pointer', boxShadow: '0 10px 50px rgba(0,0,0,.25)', ...F }}>
                Explorar catálogo <ChevronRight size={18} />
              </motion.button>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* Contenido principal */}
      <div ref={catalogRef} style={{ maxWidth: 1600, margin: '0 auto', padding: '32px 16px 120px', display: 'grid', gap: 24, gridTemplateColumns: '1fr', position: 'relative', zIndex: 1 }}
        className="lg:grid-cols-[280px_1fr]">

        {/* Sidebar desktop */}
        <aside className="hidden lg:block">
          <div style={{ position: 'sticky', top: 88, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ borderRadius: 28, border: `1px solid ${border}`, background: surface, padding: 20, backdropFilter: 'blur(20px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', opacity: 0.5, margin: 0 }}>Categorías</h3>
                <SlidersHorizontal size={15} style={{ opacity: 0.4 }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {categories.map(cat => {
                  const active = activeCat === cat;
                  return (
                    <motion.button whileHover={{ x: 4 }} key={cat} onClick={() => setActiveCat(cat)}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: '10px 14px', textAlign: 'left', fontSize: 14, fontWeight: 500, cursor: 'pointer', color: active ? 'var(--tp-primary)' : txt, background: active ? 'color-mix(in srgb, var(--tp-primary) 14%, transparent)' : 'transparent', border: active ? '1px solid color-mix(in srgb, var(--tp-primary) 24%, transparent)' : '1px solid transparent', transition: 'all .15s', ...F }}>
                      <span style={{ textTransform: 'capitalize' }}>{cat === 'all' ? 'Todos' : cat}</span>
                      <ChevronRight size={14} style={{ opacity: 0.4 }} />
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Catálogo */}
        <main>
          {/* Search mobile */}
          <div className="mb-5 lg:hidden">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 44, borderRadius: 22, border: `1px solid ${border}`, background: surface, padding: '0 14px' }}>
              <Search size={16} style={{ opacity: 0.5 }} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..."
                style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: txt, ...F }} />
            </div>
          </div>

          {/* Category chips mobile */}
          <div className="lg:hidden" style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none', marginBottom: 20, paddingBottom: 2 }}>
            {categories.map(cat => {
              const active = activeCat === cat;
              return (
                <button key={cat} onClick={() => setActiveCat(cat)}
                  style={{ flexShrink: 0, borderRadius: 999, padding: '7px 16px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', background: active ? 'var(--tp-primary)' : isDark ? 'rgba(255,255,255,.07)' : '#fff', color: active ? 'var(--tp-on-primary)' : txt, ...F }}>
                  {cat === 'all' ? 'Todos' : cat}
                </button>
              );
            })}
          </div>

          {/* Header sección + Ver todos */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.03em' }}>Catálogo</h2>
              <p style={{ fontSize: 13, color: txtM, margin: '2px 0 0' }}>{filtered.length} productos</p>
            </div>
            {activos.length > 0 && (
              <button onClick={() => setVerTodos(true)}
                style={{ fontSize: 13, fontWeight: 700, color: 'var(--tp-primary)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 0', ...F }}>
                Ver todos →
              </button>
            )}
          </div>

          {/* Grid — 2 cols mobile, 3 tablet, 4 desktop */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            style={{ display: 'grid', gap: 14 }}
            className="grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4"
            /* fallback inline para mobile */
            /* Tailwind se encarga del responsive */
          >
            {filtered.map((product, idx) => {
              const qty = cart?.find(c => c.id === product.id)?.qty || 0;
              return (
                <motion.article key={product.id || idx} variants={productVar} whileHover={{ y: -6 }}
                  style={{ borderRadius: 24, border: `1px solid ${border}`, background: surface, overflow: 'hidden', cursor: 'pointer' }}>
                  <div style={{ position: 'relative', overflow: 'hidden' }}>
                    <motion.img
                      whileHover={{ scale: 1.06 }} transition={{ duration: 0.5 }}
                      src={product.foto || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=800&auto=format&fit=crop'}
                      style={{ width: '100%', aspectRatio: '4/5', objectFit: 'cover', display: 'block' }}
                    />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.1) 50%, transparent 100%)' }} />

                    {product.precioAnterior && (
                      <div style={{ position: 'absolute', top: 10, left: 10, background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', borderRadius: 999, padding: '3px 10px', fontSize: 11, fontWeight: 800 }}>
                        -{Math.round((1 - product.precio / product.precioAnterior) * 100)}%
                      </div>
                    )}

                    <div style={{ position: 'absolute', inset: '0 0 0', padding: '0 14px 14px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
                      <h3 style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 700, color: '#fff', lineHeight: 1.25 }}>{product.nombre}</h3>
                      <p style={{ margin: '0 0 8px', fontSize: 12, color: 'rgba(255,255,255,.6)' }}>{product.categoria || 'Premium'}</p>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <div>
                          {product.precioAnterior && <p style={{ margin: 0, fontSize: 11, color: 'rgba(255,255,255,.5)', textDecoration: 'line-through' }}>{formatPrice(product.precioAnterior)}</p>}
                          <p style={{ margin: 0, fontSize: 16, fontWeight: 900, color: '#fff' }}>{formatPrice(product.precio)}</p>
                        </div>
                        {qty === 0 ? (
                          <motion.button whileTap={{ scale: 0.92 }} onClick={() => onAdd(product)}
                            style={{ width: 38, height: 38, borderRadius: 12, border: 'none', cursor: 'pointer', background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', fontSize: 20, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            +
                          </motion.button>
                        ) : (
                          <QtySelector qty={qty} onAdd={() => onAdd(product)} onRemove={() => onRemove(product.id)} />
                        )}
                      </div>
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </motion.div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', color: txtM }}>
              <Package size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
              <p style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Sin productos</p>
            </div>
          )}
        </main>
      </div>

      {/* CTA flotante carrito */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.button initial={{ opacity: 0, y: 100 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 100 }} whileTap={{ scale: 0.95 }}
            onClick={() => setCartOpen(true)}
            className="lg:bottom-8"
            style={{ position: 'fixed', bottom: 72, right: 16, zIndex: 49, display: 'flex', alignItems: 'center', gap: 10, borderRadius: 24, padding: '14px 20px', background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 700, boxShadow: '0 20px 60px rgba(0,0,0,.3)', ...F }}>
            <ShoppingBag size={18} />
            <div style={{ textAlign: 'left' }}>
              <div>{totalItems} items</div>
              <div style={{ fontSize: 12, opacity: 0.85 }}>{formatPrice(totalPrice)}</div>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Bottom nav mobile */}
      <div className="lg:hidden" style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50, borderTop: `1px solid ${border}`, backdropFilter: 'blur(24px)', background: isDark ? 'rgba(7,11,20,.9)' : 'rgba(248,250,252,.92)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {[
            { icon: Home,       label: 'Home',   action: null },
            { icon: Grid2X2,    label: 'Shop',   action: () => setSidebarOpen(true) },
            { icon: Search,     label: 'Buscar', action: null },
            { icon: ShoppingBag,label: 'Carrito',action: () => setCartOpen(true) },
          ].map((item, idx) => {
            const Icon = item.icon;
            return (
              <motion.button whileTap={{ scale: 0.88 }} key={idx} onClick={item.action || undefined}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, padding: '10px 0 12px', border: 'none', background: 'none', cursor: 'pointer', color: txt }}>
                <Icon size={20} />
                <span style={{ fontSize: 10, fontWeight: 600 }}>{item.label}</span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div onClick={() => setSidebarOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'fixed', inset: 0, zIndex: 70, background: 'rgba(0,0,0,.5)', backdropFilter: 'blur(4px)' }} />
            <motion.aside variants={slideUp} initial="hidden" animate="show" exit="exit"
              style={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 80, maxHeight: '80vh', overflowY: 'auto', borderRadius: '28px 28px 0 0', border: `1px solid ${border}`, background: isDark ? '#0c1322' : '#fff', padding: 20, ...F }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <h3 style={{ fontSize: 17, fontWeight: 700, margin: 0 }}>Categorías</h3>
                <button onClick={() => setSidebarOpen(false)} style={{ width: 36, height: 36, borderRadius: 12, border: 'none', background: isDark ? 'rgba(255,255,255,.08)' : '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: txt }}>
                  <X size={16} />
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {categories.map(cat => {
                  const active = activeCat === cat;
                  return (
                    <button key={cat} onClick={() => { setActiveCat(cat); setSidebarOpen(false); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderRadius: 14, padding: '12px 16px', textAlign: 'left', fontSize: 15, fontWeight: 500, cursor: 'pointer', color: active ? 'var(--tp-primary)' : txt, background: active ? 'color-mix(in srgb, var(--tp-primary) 12%, transparent)' : 'transparent', border: active ? '1px solid color-mix(in srgb, var(--tp-primary) 22%, transparent)' : '1px solid transparent', ...F }}>
                      <span style={{ textTransform: 'capitalize' }}>{cat === 'all' ? 'Todos' : cat}</span>
                      <ChevronRight size={16} style={{ opacity: 0.4 }} />
                    </button>
                  );
                })}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Modal Ver todos */}
      {verTodos && (
        <ProductosModal activos={activos} cart={cart} onAdd={onAdd} onRemove={onRemove} isDark={isDark} tienda={tienda} onClose={() => setVerTodos(false)} />
      )}

      {/* Cart modal */}
      <CartModal open={cartOpen} onClose={() => setCartOpen(false)} cart={cart} onAdd={onAdd} onRemove={onRemove} isDark={isDark} tienda={tienda} />
    </div>
  );
}

const GLOBAL_CSS = `
.no-scrollbar::-webkit-scrollbar { display: none; }
.no-scrollbar { scrollbar-width: none; }
html { scroll-behavior: smooth; }
::selection { background: var(--tp-primary); color: var(--tp-on-primary); }
@keyframes nb-fade-up {
  from { opacity: 0; transform: translateY(16px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes nb-float {
  0%, 100% { transform: translateY(0); }
  50%       { transform: translateY(-12px); }
}
`;
