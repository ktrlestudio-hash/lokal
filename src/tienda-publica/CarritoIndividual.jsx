/**
 * CarritoIndividual — vista pública de UN pedido (/:tienda/c/:carrito).
 *
 * Reemplaza al patrón viejo de "armar un mensaje de texto y mandarlo a
 * wa.me": acá el link ES el pedido — una página con los productos, el
 * total y los datos del cliente, no un texto que el vendedor tiene que
 * leer entre líneas. El vendedor la abre (desde el link que le llega por
 * WhatsApp) y puede confirmar o cancelar el pedido ahí mismo si es el
 * dueño de la tienda; cualquier otra persona con el link ve la misma
 * página en modo solo-lectura (es lo que también ve el CLIENTE que lo
 * armó, para poder revisar qué pidió).
 *
 * Mismo pipeline de tema/color que OfertaIndividual/TiendaPublicaRenderer
 * (deriveColorPalette + clase .dark) y reusa TiendaFooter para que no haya
 * divergencia de diseño con el resto de tienda-publica.
 */
import React, { useLayoutEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, Clock, MessageCircle, Package, X } from 'lucide-react';
import { deriveColorPalette, resolvePagina, formatPrice } from './utils.js';
import { TiendaFooter } from './sections/TiendaFooter.jsx';
import { FONT, RADIUS, SHADOW } from './tokens.js';
import { LogoSymbol } from '../Brand.jsx';

const F = { fontFamily: FONT.family };

const ESTADO_INFO = {
  pendiente:  { label: 'Pendiente de confirmar', color: '#f59e0b', bg: 'rgba(245,158,11,.12)', Icon: Clock },
  confirmado: { label: 'Confirmado', color: '#16a34a', bg: 'rgba(22,163,74,.12)', Icon: Check },
  cancelado:  { label: 'Cancelado', color: '#ef4444', bg: 'rgba(239,68,68,.12)', Icon: X },
};

export function CarritoIndividual({ tienda, carrito, esDueno, onCambiarEstado, isDark, toggleTheme, onVolver }) {
  const [actualizando, setActualizando] = useState(false);
  const pagina = useMemo(() => resolvePagina(tienda.pagina), [tienda]);
  const dark = isDark;

  // Mismo mecanismo que OfertaIndividual: setea los --tp-* en <html> y la
  // clase .dark, así esta vista comparte tema/color con el resto de la
  // tienda aunque se entre directo por link, sin pasar por el home.
  useLayoutEffect(() => {
    const el = document.documentElement;
    el.classList.toggle('dark', dark);
    const vars = deriveColorPalette(pagina.color, dark, pagina.colorSecundario);
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    return () => Object.keys(vars).forEach((k) => el.style.removeProperty(k));
  }, [pagina.color, pagina.colorSecundario, dark]);

  const wa = (tienda.whatsapp || '').replace(/\D/g, '');
  const estado = ESTADO_INFO[carrito.estado] || ESTADO_INFO.pendiente;

  const cambiarEstado = async (nuevoEstado) => {
    if (actualizando || carrito.estado === nuevoEstado) return;
    setActualizando(true);
    try {
      await onCambiarEstado(nuevoEstado);
    } finally {
      setActualizando(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--tp-bg)', color: 'var(--tp-text)', ...F }}>
      {/* Barra superior simple — no es la barra completa de la tienda (sin
          redes/meta/acciones): esta vista se abre casi siempre DESDE un
          link de WhatsApp, no navegando la tienda, así que solo necesita
          identidad + volver, no toda la jerarquía del hero. */}
      <header style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px', borderBottom: '1px solid var(--tp-border)' }}>
        <button onClick={onVolver} aria-label="Volver" className="no-press" style={{
          width: 36, height: 36, borderRadius: RADIUS.full, border: '1px solid var(--tp-border)',
          background: 'var(--tp-surface)', display: 'grid', placeItems: 'center', cursor: 'pointer', color: 'var(--tp-text)',
        }}>
          <ArrowLeft size={17} />
        </button>
        <div style={{ width: 32, height: 32, borderRadius: 10, overflow: 'hidden', flexShrink: 0, background: 'var(--tp-primary)', display: 'grid', placeItems: 'center' }}>
          {tienda.foto
            ? <img src={tienda.foto} alt={tienda.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <LogoSymbol size={18} color="#fff" />}
        </div>
        <span style={{ fontSize: 15, fontWeight: 800 }}>{tienda.nombre}</span>
      </header>

      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px 18px 48px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: RADIUS.lg, background: 'var(--tp-primary-soft)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
            <Package size={20} style={{ color: 'var(--tp-primary)' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 900 }}>
              {carrito.cliente?.nombre ? `Pedido de ${carrito.cliente.nombre}` : 'Pedido'}
            </h1>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, marginTop: 4,
              padding: '3px 10px', borderRadius: RADIUS.full, fontSize: 12, fontWeight: 700,
              color: estado.color, background: estado.bg,
            }}>
              <estado.Icon size={12} />
              {estado.label}
            </span>
          </div>
        </div>

        {/* Ítems — snapshot guardado al momento de armar el pedido, no una
            referencia viva al catálogo (ver carrito.js). Si el precio de un
            producto cambió después, este pedido sigue mostrando lo que el
            cliente vio y aceptó. */}
        <div style={{ background: 'var(--tp-surface)', borderRadius: RADIUS.xl, border: '1px solid var(--tp-border)', overflow: 'hidden' }}>
          {carrito.items.map((item, i) => (
            <div key={`${item.ofertaId}-${i}`} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              borderBottom: i < carrito.items.length - 1 ? '1px solid var(--tp-border)' : 'none',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: RADIUS.md, background: 'var(--tp-surface2)', overflow: 'hidden', flexShrink: 0, display: 'grid', placeItems: 'center' }}>
                {item.imageUrl
                  ? <img src={item.imageUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <Package size={16} style={{ color: 'var(--tp-text-muted)' }} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.nombre}</p>
                <p style={{ margin: '2px 0 0', fontSize: 12.5, color: 'var(--tp-text-muted)' }}>
                  {item.qty} × {item.precio != null ? formatPrice(item.precio) : '—'}
                </p>
              </div>
              <span style={{ fontSize: 14, fontWeight: 800, flexShrink: 0 }}>
                {item.precio != null ? formatPrice(item.precio * item.qty) : '—'}
              </span>
            </div>
          ))}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--tp-surface2)' }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--tp-text-muted)' }}>Total</span>
            <span style={{ fontSize: 20, fontWeight: 900 }}>{formatPrice(carrito.total)}</span>
          </div>
        </div>

        {/* Nota + datos de contacto del cliente — solo si vinieron, ninguno
            es obligatorio para armar un pedido. */}
        {(carrito.nota || carrito.cliente?.telefono) && (
          <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: RADIUS.lg, background: 'var(--tp-surface2)', fontSize: 13.5 }}>
            {carrito.cliente?.telefono && (
              <p style={{ margin: '0 0 6px', fontWeight: 700 }}>📞 {carrito.cliente.telefono}</p>
            )}
            {carrito.nota && (
              <p style={{ margin: 0, color: 'var(--tp-text-muted)' }}>{carrito.nota}</p>
            )}
          </div>
        )}

        {/* Acciones del vendedor — solo si es el dueño de la tienda. El
            cliente que armó el pedido (o cualquier otra persona con el
            link) ve exactamente lo mismo de arriba, sin estos botones: es
            modo lectura, la decisión de confirmar/cancelar es del negocio. */}
        {esDueno && carrito.estado === 'pendiente' && (
          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button
              onClick={() => cambiarEstado('cancelado')}
              disabled={actualizando}
              className="no-press"
              style={{
                flex: 1, padding: '13px', borderRadius: RADIUS.lg, border: '1.5px solid var(--tp-border)',
                background: 'var(--tp-surface)', color: 'var(--tp-text)', fontWeight: 700, fontSize: 14,
                cursor: actualizando ? 'default' : 'pointer', opacity: actualizando ? 0.6 : 1, ...F,
              }}
            >
              Cancelar
            </button>
            <button
              onClick={() => cambiarEstado('confirmado')}
              disabled={actualizando}
              className="no-press"
              style={{
                flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                padding: '13px', borderRadius: RADIUS.lg, border: 'none',
                background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', fontWeight: 800, fontSize: 14,
                cursor: actualizando ? 'default' : 'pointer', opacity: actualizando ? 0.6 : 1, ...F,
              }}
            >
              <Check size={17} />
              Confirmar pedido
            </button>
          </div>
        )}

        {wa && (
          <a
            href={`https://wa.me/54${wa}`}
            target="_blank" rel="noopener noreferrer"
            className="no-press"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              marginTop: 12, padding: '13px', borderRadius: RADIUS.lg, textDecoration: 'none',
              border: '1.5px solid var(--tp-border)', color: 'var(--tp-text)', fontWeight: 700, fontSize: 13.5,
              boxShadow: SHADOW.sm,
            }}
          >
            <MessageCircle size={16} style={{ color: '#25D366' }} />
            {esDueno ? 'Escribirle al cliente' : `Escribirle a ${tienda.nombre}`}
          </a>
        )}
      </div>

      <TiendaFooter dark={dark} toggleDark={toggleTheme} tiendaId={tienda.id} />
    </div>
  );
}
