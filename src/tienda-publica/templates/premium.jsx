import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import {
  Search, ShoppingBag, Plus, Minus, X, MapPin,
  Clock, MessageCircle, Phone, Instagram, Globe,
  Star, Truck, RotateCcw, Shield, Home, ChevronRight,
} from 'lucide-react';
import { buildWhatsAppUrl, getEstadoApertura, formatPrice } from '../utils.js';
import { FONT } from '../tokens.js';

export const META = {
  label: 'Premium',
  desc: 'Dark premium 2026: glassmorphism, Framer Motion, hero cinemático, sidebar desktop, bottom nav.',
};

const F = { fontFamily: FONT.family };

const DAY_NAMES  = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const DAY_LABELS = { lunes:'Lunes', martes:'Martes', miercoles:'Miércoles', jueves:'Jueves', viernes:'Viernes', sabado:'Sábado', domingo:'Domingo' };
const todayKey   = DAY_NAMES[new Date().getDay()];

const norm = (p) => ({
  ...p,
  nombre: p.nombre || p.titulo || '',
  foto:   p.foto || p.fotos?.[0] || p.galeria?.[0] || null,
});

/* ─── Variantes de animación ─────────────────────────────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};
const cardVar = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
};
const slideUp = {
  hidden: { opacity: 0, y: '100%' },
  show:   { opacity: 1, y: 0,      transition: { duration: 0.38, ease: [0.22, 1, 0.36, 1] } },
  exit:   { opacity: 0, y: '100%', transition: { duration: 0.28, ease: [0.4, 0, 1, 1] } },
};

/* ─── QtySelector ────────────────────────────────────────────────────────── */
function QtySelector({ qty, onAdd, onRemove }) {
  return (
    <div className="flex items-center gap-1 rounded-full overflow-hidden h-9"
      style={{ background: 'var(--tp-primary)' }}>
      <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); onRemove(); }}
        className="w-9 h-9 flex items-center justify-center"
        style={{ color: 'var(--tp-on-primary)', border: 'none', background: 'none', cursor: 'pointer' }}>
        <Minus size={13} />
      </motion.button>
      <span className="text-[13px] font-black px-1 min-w-[20px] text-center"
        style={{ color: 'var(--tp-on-primary)' }}>
        {qty}
      </span>
      <motion.button whileTap={{ scale: 0.85 }} onClick={e => { e.stopPropagation(); onAdd(); }}
        className="w-9 h-9 flex items-center justify-center"
        style={{ color: 'var(--tp-on-primary)', border: 'none', background: 'none', cursor: 'pointer' }}>
        <Plus size={13} />
      </motion.button>
    </div>
  );
}

/* ─── ProductCard ────────────────────────────────────────────────────────── */
function ProductCard({ p, qty, onAdd, onRemove }) {
  const sinStock = p.activo === false;
  const hasDisc  = p.precioOriginal != null && p.precioOriginal > (p.precio ?? 0);
  const descPct  = hasDisc ? Math.round((1 - p.precio / p.precioOriginal) * 100) : null;
  const isNew    = p.esNuevo || p.nuevo;

  return (
    <motion.article
      variants={cardVar}
      whileHover={{ y: -5, transition: { duration: 0.25 } }}
      className="relative rounded-[28px] overflow-hidden border border-white/[0.04] bg-[#0b0f18] shadow-[0_20px_50px_rgba(0,0,0,.55)] cursor-pointer group"
      style={{ aspectRatio: '1 / 1.38' }}
    >
      <div className="relative h-full overflow-hidden">
        {p.foto
          ? <motion.img
              src={p.foto} alt={p.nombre}
              className="absolute inset-0 w-full h-full object-cover brightness-[.95] contrast-110 saturate-110"
              whileHover={{ scale: 1.07 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            />
          : <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-10 bg-[#1e2740]">🛍</div>
        }

        {/* gradiente */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/45 to-transparent" />

        {/* badge descuento */}
        {descPct && !sinStock && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.2 }}
            className="absolute top-3 left-3 h-[30px] px-3 rounded-full text-[11px] font-black tracking-tight flex items-center justify-center shadow-lg"
            style={{ background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', boxShadow: '0 8px 24px rgba(0,0,0,.4)' }}>
            -{descPct}%
          </motion.div>
        )}

        {/* badge nuevo */}
        {isNew && !sinStock && (
          <div className="absolute top-3 left-3 h-[28px] px-3 rounded-full bg-white/15 backdrop-blur-xl border border-white/25 text-white text-[10px] font-black flex items-center">
            NEW
          </div>
        )}

        {/* favorito — aparece en hover */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          whileHover={{ scale: 1.1 }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full border border-white/15 bg-black/40 backdrop-blur-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          onClick={e => e.stopPropagation()}>
          <Star size={14} className="text-white" />
        </motion.button>

        {/* overlay sin stock */}
        {sinStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[3px] flex items-center justify-center">
            <span className="bg-red-500/90 text-white text-[11px] font-black px-4 py-1.5 rounded-full">Sin stock</span>
          </div>
        )}

        {/* info abajo */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {p.categoria && (
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/45 font-bold mb-1.5">{p.categoria}</div>
          )}
          <h3 className="text-[15px] lg:text-[16px] font-black tracking-[-0.03em] leading-tight text-white line-clamp-2 mb-3">
            {p.nombre}
          </h3>

          <div className="flex items-end justify-between gap-2">
            <div>
              {hasDisc && (
                <div className="text-white/35 line-through text-[12px] font-medium leading-none mb-0.5">
                  {formatPrice(p.precioOriginal)}
                </div>
              )}
              {p.precio != null
                ? <div className="text-[18px] lg:text-[20px] font-black tracking-[-0.04em] text-white leading-none">
                    {formatPrice(p.precio)}
                  </div>
                : <div className="text-[13px] font-bold leading-none" style={{ color: 'var(--tp-primary)' }}>Consultar →</div>
              }
            </div>

            {!sinStock && (
              qty > 0
                ? <QtySelector qty={qty} onAdd={() => onAdd(p)} onRemove={() => onRemove(p.id)} />
                : (
                  <motion.button
                    whileTap={{ scale: 0.88 }} whileHover={{ scale: 1.08 }}
                    onClick={e => { e.stopPropagation(); onAdd(p); }}
                    className="w-12 h-12 rounded-full font-black text-xl flex items-center justify-center shadow-[0_10px_24px_rgba(0,0,0,.4)] flex-shrink-0"
                    style={{ background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', border: 'none', cursor: 'pointer' }}>
                    +
                  </motion.button>
                )
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
}

/* ─── Hero cinemático ────────────────────────────────────────────────────── */
function Hero({ tienda, abierta, textoApertura, onScrollDown }) {
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] });
  const imgScale     = useTransform(scrollYProgress, [0, 1], [1.08, 1.18]);
  const imgOpacity   = useTransform(scrollYProgress, [0, 0.8], [0.55, 0.2]);
  const contentY     = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const ciudad = tienda.ciudad?.split(',')[0]?.trim();
  const cover  = tienda.portada || tienda.banner || tienda.foto || null;

  return (
    <section ref={heroRef} className="relative overflow-hidden h-[440px] lg:h-[560px] xl:h-[640px]">
      {/* imagen con parallax */}
      <motion.div className="absolute inset-0" style={{ scale: imgScale }}>
        {cover
          ? <motion.img src={cover} alt="" className="w-full h-full object-cover" style={{ opacity: imgOpacity }} />
          : <div className="w-full h-full" style={{ background: 'linear-gradient(135deg,#1a2744,#0d1526)' }} />
        }
      </motion.div>

      {/* gradientes cinematográficos */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/40 to-black/10" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* ambient glow orbs */}
      <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'var(--tp-primary)', opacity: 0.07, filter: 'blur(140px)' }} />
      <div className="absolute top-[20%] -right-32 w-[420px] h-[420px] rounded-full pointer-events-none"
        style={{ background: 'var(--tp-primary)', opacity: 0.05, filter: 'blur(120px)' }} />

      {/* contenido */}
      <motion.div style={{ y: contentY }} className="relative z-10 h-full flex flex-col justify-end p-6 lg:p-14 max-w-[1400px] mx-auto">
        <motion.div variants={stagger} initial="hidden" animate="show">

          {/* badge featured */}
          <motion.div variants={fadeUp}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.08] border border-white/[0.12] backdrop-blur-xl w-fit mb-5">
            <div className="w-2 h-2 rounded-full" style={{ background: 'var(--tp-primary)' }} />
            <span className="text-[11px] uppercase tracking-[0.22em] text-white/70 font-bold">
              {abierta ? 'Abierto ahora' : 'Cerrado ahora'}
            </span>
          </motion.div>

          {/* logo + nombre */}
          <motion.div variants={fadeUp} className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 lg:w-16 lg:h-16 rounded-2xl overflow-hidden flex-shrink-0 border-2 border-white/20 shadow-[0_8px_32px_rgba(0,0,0,.5)]"
              style={{ background: tienda.logo ? 'transparent' : 'var(--tp-primary)' }}>
              {tienda.logo
                ? <img src={tienda.logo} alt="" className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white" style={F}>
                    {tienda.nombre?.[0]?.toUpperCase() || 'T'}
                  </div>
              }
            </div>
            <div>
              <h1 className="text-[42px] lg:text-[68px] xl:text-[80px] leading-[0.9] font-black tracking-[-0.06em] text-white"
                style={{ textShadow: '0 4px 24px rgba(0,0,0,.5)', ...F }}>
                {tienda.nombre}
              </h1>
            </div>
          </motion.div>

          {/* descripción */}
          {tienda.descripcion && (
            <motion.p variants={fadeUp} className="text-[15px] lg:text-[17px] leading-relaxed text-white/65 max-w-[540px] mb-6" style={F}>
              {tienda.descripcion}
            </motion.p>
          )}

          {/* chips */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-2 mb-8">
            {textoApertura && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-xl border text-[11px] font-bold text-white"
                style={{ background: abierta ? 'rgba(16,185,129,.25)' : 'rgba(239,68,68,.25)', borderColor: abierta ? 'rgba(16,185,129,.4)' : 'rgba(239,68,68,.4)' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: abierta ? '#34d399' : '#f87171' }} />
                {textoApertura}
              </span>
            )}
            {ciudad && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-xl border border-white/20 text-[11px] font-semibold text-white/80">
                <MapPin size={10} />{ciudad}
              </span>
            )}
            {tienda.rating && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/30 backdrop-blur-xl border border-white/15 text-[11px] font-bold"
                style={{ color: 'var(--tp-primary)' }}>
                <Star size={10} style={{ fill: 'var(--tp-primary)' }} />{tienda.rating}
              </span>
            )}
          </motion.div>

          {/* CTAs */}
          <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
            <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
              onClick={onScrollDown}
              className="h-[50px] px-7 rounded-full font-black tracking-[-0.02em] text-[14px] shadow-[0_12px_40px_rgba(0,0,0,.4)]"
              style={{ background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', border: 'none', cursor: 'pointer', ...F }}>
              Ver catálogo
            </motion.button>
            {tienda.whatsapp && (
              <motion.a whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                href={`https://wa.me/${tienda.whatsapp.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                className="h-[50px] px-7 rounded-full border border-white/[0.15] bg-white/[0.07] backdrop-blur-xl text-white font-semibold text-[14px] flex items-center gap-2 hover:bg-white/[0.12] transition-colors"
                style={F}>
                <MessageCircle size={16} /> Contactar
              </motion.a>
            )}
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── Sidebar desktop ────────────────────────────────────────────────────── */
function Sidebar({ tienda, categorias, catSel, onSelect, abierta }) {
  const trustItems = [
    tienda.envio   && { icon: Truck,     label: 'Envío disponible' },
    tienda.cambios && { icon: RotateCcw, label: 'Aceptan cambios' },
    { icon: Shield, label: 'Pago seguro' },
  ].filter(Boolean);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="hidden lg:flex flex-col sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto"
      style={{ borderRight: '1px solid rgba(255,255,255,.06)', background: '#0b0f18' }}>

      {/* categorías */}
      {categorias.length > 0 && (
        <div className="p-5 border-b border-white/[0.05]">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[12px] uppercase tracking-[0.18em] text-white/40 font-black" style={F}>Categorías</h2>
            <div className="w-7 h-7 rounded-xl bg-white/[0.05] border border-white/[0.05] flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--tp-primary)' }} />
            </div>
          </div>
          <div className="space-y-1.5">
            {['Todos', ...categorias].map((cat, i) => {
              const active = cat === 'Todos' ? catSel === null : catSel === cat;
              return (
                <motion.button key={cat} whileHover={{ x: 3 }} whileTap={{ scale: 0.98 }}
                  onClick={() => onSelect(cat === 'Todos' ? null : cat)}
                  className={`w-full h-[48px] rounded-2xl px-4 flex items-center justify-between transition-all duration-200 border text-left ${
                    active
                      ? 'border-white/10 text-white'
                      : 'bg-white/[0.03] border-white/[0.03] text-white/55 hover:bg-white/[0.05] hover:text-white/80'
                  }`}
                  style={active ? { background: 'color-mix(in srgb, var(--tp-primary) 18%, transparent)', borderColor: 'color-mix(in srgb, var(--tp-primary) 30%, transparent)' } : {}}>
                  <span className="font-semibold tracking-[-0.02em] text-[13px]" style={F}>{cat}</span>
                  {active && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--tp-primary)' }} />}
                </motion.button>
              );
            })}
          </div>
        </div>
      )}

      {/* horarios */}
      {tienda.horarios && (
        <div className="p-5 border-b border-white/[0.05]">
          <h2 className="text-[12px] uppercase tracking-[0.18em] text-white/40 font-black mb-4" style={F}>Horarios</h2>
          {Object.entries(tienda.horarios).map(([key, schedule]) => {
            const isToday = key === todayKey;
            return (
              <div key={key} className={`flex justify-between py-1.5 px-2 rounded-lg ${isToday ? 'bg-white/[0.05]' : ''}`}>
                <span className="text-[12px] font-medium" style={{ color: isToday ? 'var(--tp-primary)' : 'rgba(255,255,255,.4)', ...F }}>
                  {DAY_LABELS[key]}{isToday ? ' · hoy' : ''}
                </span>
                <span className="text-[12px] font-semibold" style={{ color: isToday ? 'var(--tp-primary)' : 'rgba(255,255,255,.7)', ...F }}>
                  {schedule || 'Cerrado'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* trust */}
      {trustItems.length > 0 && (
        <div className="p-5 border-b border-white/[0.05] space-y-3">
          {trustItems.map(({ icon: Icon, label }, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Icon size={13} style={{ color: 'var(--tp-primary)', flexShrink: 0 }} />
              <span className="text-[12px] font-semibold text-white/50" style={F}>{label}</span>
            </div>
          ))}
        </div>
      )}

      {/* contacto */}
      <div className="p-5">
        <h2 className="text-[12px] uppercase tracking-[0.18em] text-white/40 font-black mb-3" style={F}>Contacto</h2>
        {[
          tienda.whatsapp  && { icon: MessageCircle, label: 'WhatsApp',                              href: `https://wa.me/${tienda.whatsapp.replace(/\D/g,'')}`,        color: '#25d366' },
          tienda.instagram && { icon: Instagram,     label: `@${tienda.instagram.replace('@','')}`, href: `https://instagram.com/${tienda.instagram.replace('@','')}`, color: '#e1306c' },
          tienda.website   && { icon: Globe,         label: 'Sitio web',                             href: tienda.website,                                              color: 'var(--tp-primary)' },
          tienda.telefono  && { icon: Phone,         label: tienda.telefono,                         href: `tel:${tienda.telefono}`,                                    color: 'var(--tp-primary)' },
        ].filter(Boolean).map(({ icon: Icon, label, href, color }, i) => (
          <motion.a key={i} whileHover={{ x: 3 }}
            href={href} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 py-2 px-2 rounded-xl hover:bg-white/[0.04] transition-colors"
            style={{ textDecoration: 'none' }}>
            <Icon size={14} style={{ color, flexShrink: 0 }} />
            <span className="text-[12px] font-semibold text-white/60 truncate" style={F}>{label}</span>
            <ChevronRight size={11} className="ml-auto text-white/20 flex-shrink-0" />
          </motion.a>
        ))}
      </div>
    </motion.aside>
  );
}

/* ─── Cart Modal ─────────────────────────────────────────────────────────── */
function CartModal({ cart, onAdd, onRemove, wa, isDark, onClose }) {
  const total = cart.reduce((s, i) => s + (i.precio || 0) * i.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[9999] flex flex-col justify-end"
      style={{ fontFamily: FONT.family }}>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose} />

      <motion.div variants={slideUp} initial="hidden" animate="show" exit="exit"
        className="relative rounded-t-[28px] max-h-[85dvh] flex flex-col"
        style={{ background: '#0e1525', border: '1px solid rgba(255,255,255,.08)', borderBottom: 'none' }}>

        {/* handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-9 h-1 rounded-full bg-white/20" />
        </div>

        {/* header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.07]">
          <span className="text-[16px] font-black text-white" style={F}>Tu pedido ({count})</span>
          <motion.button whileTap={{ scale: 0.9 }} onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/[0.07] border border-white/[0.07] flex items-center justify-center text-white/60"
            style={{ cursor: 'pointer' }}>
            <X size={15} />
          </motion.button>
        </div>

        {/* items */}
        <div className="overflow-y-auto flex-1 px-4 py-2">
          <AnimatePresence>
            {cart.map(item => (
              <motion.div key={item.id}
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                className="flex items-center gap-3 py-3 border-b border-white/[0.06]">
                <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/[0.05]">
                  {(item.foto || item.fotos?.[0])
                    ? <img src={item.foto || item.fotos[0]} alt="" className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center text-xl">📦</div>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white truncate" style={F}>{item.nombre || item.titulo}</p>
                  {item.precio != null && (
                    <p className="text-[13px] font-black mt-0.5" style={{ color: 'var(--tp-primary)', ...F }}>
                      {formatPrice(item.precio * item.qty)}
                    </p>
                  )}
                </div>
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => onAdd(item)}
                    className="w-7 h-7 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', border: 'none', cursor: 'pointer' }}>
                    <Plus size={12} />
                  </motion.button>
                  <span className="text-[13px] font-black text-white">{item.qty}</span>
                  <motion.button whileTap={{ scale: 0.85 }} onClick={() => onRemove(item.id)}
                    className="w-7 h-7 rounded-full flex items-center justify-center border border-white/10 bg-white/[0.04]"
                    style={{ color: 'rgba(255,255,255,.5)', cursor: 'pointer' }}>
                    <Minus size={12} />
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* footer */}
        <div className="px-5 pt-4 pb-safe" style={{ paddingBottom: 'calc(20px + env(safe-area-inset-bottom))' }}>
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-[13px] font-semibold text-white/50" style={F}>Total estimado</span>
            <span className="text-[22px] font-black text-white" style={F}>{formatPrice(total)}</span>
          </div>
          {wa && (
            <motion.a whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              href={wa} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full py-4 rounded-2xl font-black text-[15px] shadow-[0_8px_32px_rgba(37,211,102,.35)]"
              style={{ background: '#25d366', color: '#fff', textDecoration: 'none', ...F }}>
              <MessageCircle size={18} /> Confirmar por WhatsApp
            </motion.a>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

/* ─── TEMPLATE PRINCIPAL ─────────────────────────────────────────────────── */
export function TemplatePremium({ tienda, secciones, cart, onAdd, onRemove, isDark }) {
  const s  = Object.fromEntries(secciones.map(sec => [sec.id, sec]));
  const wa = buildWhatsAppUrl(tienda, cart, '');
  const { abierta, texto: textoApertura } = getEstadoApertura(tienda.horarios);

  const [catSel,     setCatSel]     = useState(null);
  const [sortSel,    setSortSel]    = useState('default');
  const [search,     setSearch]     = useState('');
  const [cartOpen,   setCartOpen]   = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const catalogRef = useRef(null);

  const productosRaw = useMemo(() => (tienda.productos || []).map(norm), [tienda.productos]);
  const categorias   = useMemo(() => [...new Set(productosRaw.map(p => p.categoria).filter(Boolean))], [productosRaw]);

  const productos = useMemo(() => {
    const activos  = productosRaw.filter(p => p.activo !== false);
    const sinStock = productosRaw.filter(p => p.activo === false);
    let list = [...activos, ...sinStock];
    if (catSel) list = list.filter(p => p.categoria === catSel);
    if (search)  list = list.filter(p => p.nombre?.toLowerCase().includes(search.toLowerCase()));
    if (sortSel === 'precio-asc')  list = [...list].sort((a, b) => (a.precio || 0) - (b.precio || 0));
    if (sortSel === 'precio-desc') list = [...list].sort((a, b) => (b.precio || 0) - (a.precio || 0));
    if (sortSel === 'novedad')     list = [...list].reverse();
    return list;
  }, [productosRaw, catSel, search, sortSel]);

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const SORTS = [
    { id: 'default',     label: 'Destacados' },
    { id: 'precio-asc',  label: 'Precio ↑' },
    { id: 'precio-desc', label: 'Precio ↓' },
    { id: 'novedad',     label: 'Nuevo' },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-white overflow-x-hidden" style={F}>

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full"
          style={{ background: 'var(--tp-primary)', opacity: 0.06, filter: 'blur(140px)' }} />
        <div className="absolute top-[30%] -right-32 w-[400px] h-[400px] rounded-full"
          style={{ background: 'var(--tp-primary)', opacity: 0.04, filter: 'blur(120px)' }} />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full bg-white/[0.02]" style={{ filter: 'blur(160px)' }} />
      </div>

      {/* ── Header ── */}
      <motion.header
        initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.05]"
        style={{ background: 'rgba(10,15,27,0.85)', backdropFilter: 'blur(24px)' }}>
        <div className="max-w-[1400px] mx-auto px-4 lg:px-8 h-[64px] flex items-center gap-3">

          {/* logo */}
          <div className="w-10 h-10 rounded-2xl overflow-hidden flex-shrink-0 border border-white/[0.1] flex items-center justify-center"
            style={{ background: tienda.logo ? 'transparent' : 'var(--tp-primary)' }}>
            {tienda.logo
              ? <img src={tienda.logo} alt="" className="w-full h-full object-cover" />
              : <span className="text-[14px] font-black text-white" style={F}>{tienda.nombre?.[0]?.toUpperCase() || 'T'}</span>
            }
          </div>

          <div className="hidden sm:flex flex-col leading-none mr-2">
            <span className="text-[14px] font-black tracking-[-0.04em]" style={F}>{tienda.nombre}</span>
            {textoApertura && (
              <span className="text-[10px] font-bold mt-0.5" style={{ color: abierta ? '#34d399' : '#f87171', ...F }}>
                ● {textoApertura}
              </span>
            )}
          </div>

          {/* search bar */}
          <div className="flex-1 relative">
            <AnimatePresence mode="wait">
              {searchOpen
                ? (
                  <motion.div key="open" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                    className="flex items-center h-[44px] rounded-full border border-white/[0.1] bg-white/[0.06] backdrop-blur-xl px-4 gap-2">
                    <Search size={15} className="text-white/40 flex-shrink-0" />
                    <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                      placeholder={`Buscar en ${tienda.nombre}...`}
                      className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/35 outline-none"
                      style={F} />
                    {search && (
                      <button onClick={() => setSearch('')} className="text-white/40 hover:text-white transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </motion.div>
                )
                : (
                  <motion.button key="closed" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    onClick={() => setSearchOpen(true)}
                    className="w-full h-[44px] rounded-full border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl flex items-center px-4 gap-3 hover:bg-white/[0.08] transition-colors">
                    <Search size={15} className="text-white/40" />
                    <span className="text-[13px] text-white/30 font-medium" style={F}>Buscar productos...</span>
                  </motion.button>
                )
              }
            </AnimatePresence>
          </div>

          {/* acciones */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {searchOpen && (
              <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                onClick={() => { setSearchOpen(false); setSearch(''); }}
                className="h-10 px-3 rounded-xl text-[13px] font-semibold text-white/50 hover:text-white transition-colors"
                style={F}>
                Cancelar
              </motion.button>
            )}
            {wa && (
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
                onClick={() => cartCount > 0 && setCartOpen(true)}
                className="relative w-11 h-11 rounded-2xl border border-white/[0.08] bg-white/[0.05] backdrop-blur-xl flex items-center justify-center">
                <ShoppingBag size={18} className="text-white" />
                <AnimatePresence>
                  {cartCount > 0 && (
                    <motion.span key="badge"
                      initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}
                      className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 rounded-full text-[10px] font-black flex items-center justify-center px-1 shadow-lg"
                      style={{ background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', ...F }}>
                      {cartCount}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            )}
          </div>
        </div>

        {/* chips categoría — solo mobile */}
        {categorias.length > 0 && (
          <div className="lg:hidden flex gap-2 overflow-x-auto px-4 pb-3 scrollbar-none" style={{ scrollbarWidth: 'none' }}>
            {['Todos', ...categorias].map(cat => {
              const active = cat === 'Todos' ? catSel === null : catSel === cat;
              return (
                <motion.button key={cat} whileTap={{ scale: 0.93 }}
                  onClick={() => setCatSel(cat === 'Todos' ? null : cat)}
                  className="flex-shrink-0 h-8 px-4 rounded-full text-[12px] font-bold transition-all duration-200 border"
                  style={{
                    background: active ? 'var(--tp-primary)' : 'rgba(255,255,255,.06)',
                    color:      active ? 'var(--tp-on-primary)' : 'rgba(255,255,255,.55)',
                    borderColor: active ? 'transparent' : 'rgba(255,255,255,.07)',
                    ...F,
                  }}>
                  {cat}
                </motion.button>
              );
            })}
          </div>
        )}
      </motion.header>

      {/* ── Hero ── */}
      <div className="pt-[64px]">
        <Hero
          tienda={tienda} abierta={abierta} textoApertura={textoApertura}
          onScrollDown={() => catalogRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
        />
      </div>

      {/* ── Main layout ── */}
      <div className="max-w-[1400px] mx-auto px-4 lg:px-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] gap-8 items-start">
          <Sidebar tienda={tienda} categorias={categorias} catSel={catSel} onSelect={setCatSel} abierta={abierta} />

          <main ref={catalogRef} className="pb-32 lg:pb-16 pt-6 lg:pt-8">
            {s.productos?.activa && (
              <>
                {/* título + sort */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="flex items-end justify-between mb-6 gap-4">
                  <div>
                    <h2 className="text-[24px] lg:text-[32px] font-black tracking-[-0.05em] leading-none text-white" style={F}>
                      {catSel || 'Productos'}
                    </h2>
                    <p className="mt-1.5 text-white/40 text-[13px]" style={F}>
                      {productos.length} {productos.length === 1 ? 'resultado' : 'resultados'}
                    </p>
                  </div>
                  <div className="hidden lg:flex items-center gap-2">
                    {SORTS.map(sort => {
                      const active = sortSel === sort.id;
                      return (
                        <motion.button key={sort.id} whileTap={{ scale: 0.94 }}
                          onClick={() => setSortSel(sort.id)}
                          className="h-9 px-4 rounded-full text-[12px] font-semibold transition-all border"
                          style={{
                            background: active ? 'var(--tp-primary)' : 'rgba(255,255,255,.05)',
                            color:      active ? 'var(--tp-on-primary)' : 'rgba(255,255,255,.5)',
                            borderColor: active ? 'transparent' : 'rgba(255,255,255,.07)',
                            cursor: 'pointer', ...F,
                          }}>
                          {sort.label}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>

                {/* sort mobile */}
                <div className="lg:hidden flex gap-2 overflow-x-auto mb-5" style={{ scrollbarWidth: 'none' }}>
                  {SORTS.map(sort => {
                    const active = sortSel === sort.id;
                    return (
                      <button key={sort.id} onClick={() => setSortSel(sort.id)}
                        className="flex-shrink-0 h-8 px-3 rounded-full text-[11px] font-semibold border transition-all"
                        style={{
                          background: active ? 'var(--tp-primary)' : 'rgba(255,255,255,.05)',
                          color:      active ? 'var(--tp-on-primary)' : 'rgba(255,255,255,.5)',
                          borderColor: active ? 'transparent' : 'rgba(255,255,255,.07)',
                          cursor: 'pointer', ...F,
                        }}>
                        {sort.label}
                      </button>
                    );
                  })}
                </div>

                {/* grid */}
                {productos.length === 0
                  ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="text-center py-24">
                      <div className="text-6xl mb-4 opacity-20">🔍</div>
                      <p className="text-white/40 text-[15px]" style={F}>
                        {search ? `Sin resultados para "${search}"` : 'Sin productos en esta categoría'}
                      </p>
                    </motion.div>
                  )
                  : (
                    <motion.div
                      variants={stagger} initial="hidden" animate="show"
                      className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-[14px] lg:gap-[18px]">
                      {productos.map(p => {
                        const qty = cart?.find(c => c.id === p.id)?.qty || 0;
                        return <ProductCard key={p.id} p={p} qty={qty} onAdd={onAdd} onRemove={onRemove} />;
                      })}
                    </motion.div>
                  )
                }
              </>
            )}

            {/* descripción */}
            {s.sobre?.activa && tienda.descripcion && (
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                className="mt-12 rounded-[24px] border border-white/[0.06] p-6"
                style={{ background: 'rgba(255,255,255,.03)' }}>
                <p className="text-[14px] text-white/50 leading-relaxed" style={F}>{tienda.descripcion}</p>
              </motion.div>
            )}
          </main>
        </div>
      </div>

      {/* ── CTA flotante carrito ── */}
      <AnimatePresence>
        {wa && cart.length > 0 && (
          <motion.button
            initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }}
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={() => setCartOpen(true)}
            className="fixed left-1/2 -translate-x-1/2 bottom-20 lg:bottom-6 z-40 w-[calc(100%-28px)] max-w-[480px] flex items-center justify-between px-5 py-4 rounded-2xl font-black text-[15px] shadow-[0_16px_48px_rgba(0,0,0,.5)]"
            style={{ background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', border: 'none', cursor: 'pointer', ...F }}>
            <div className="flex items-center gap-2.5">
              <ShoppingBag size={18} /><span>Ver pedido</span>
            </div>
            <div className="flex gap-2">
              <span className="bg-black/20 rounded-lg px-3 py-1 text-[13px]">{cartCount}</span>
              <span className="bg-black/20 rounded-lg px-3 py-1 text-[13px]">
                {formatPrice(cart.reduce((s, i) => s + (i.precio || 0) * i.qty, 0))}
              </span>
            </div>
          </motion.button>
        )}
      </AnimatePresence>

      {/* ── Bottom nav mobile ── */}
      <motion.nav
        initial={{ y: 100 }} animate={{ y: 0 }} transition={{ delay: 0.4 }}
        className="lg:hidden fixed bottom-3 left-3 right-3 z-50 rounded-[26px] border border-white/[0.06] backdrop-blur-2xl px-2 py-2 grid grid-cols-4 gap-2"
        style={{ background: 'rgba(10,15,27,0.9)' }}>
        {[
          { icon: Home,         label: 'Inicio',  action: () => window.scrollTo({ top: 0, behavior: 'smooth' }) },
          { icon: Search,       label: 'Buscar',  action: () => setSearchOpen(v => !v) },
          { icon: ShoppingBag,  label: 'Pedido',  action: () => cartCount > 0 && setCartOpen(true), badge: cartCount },
          { icon: MessageCircle,label: 'WA',      action: () => tienda.whatsapp && window.open(`https://wa.me/${tienda.whatsapp.replace(/\D/g,'')}`) },
        ].map(({ icon: Icon, label, action, badge }, i) => (
          <motion.button key={i} whileTap={{ scale: 0.9 }} onClick={action}
            className="h-[58px] rounded-2xl flex flex-col items-center justify-center text-[11px] font-semibold relative transition-all duration-300 text-white/55 hover:bg-white/[0.05]"
            style={{ border: 'none', background: 'none', cursor: 'pointer', ...F }}>
            {badge > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute top-1.5 right-4 min-w-[16px] h-4 rounded-full text-[9px] font-black flex items-center justify-center px-1"
                style={{ background: 'var(--tp-primary)', color: 'var(--tp-on-primary)' }}>
                {badge}
              </motion.span>
            )}
            <Icon size={19} />
            <span className="mt-1">{label}</span>
          </motion.button>
        ))}
      </motion.nav>

      {/* ── Modales ── */}
      <AnimatePresence>
        {cartOpen && (
          <CartModal cart={cart} onAdd={onAdd} onRemove={onRemove} wa={wa} isDark onClose={() => setCartOpen(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
