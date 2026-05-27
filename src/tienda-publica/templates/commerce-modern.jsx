/**
 * Template: commerce-modern
 * Inspirado en Shopify / Tiendanube / Framer commerce themes.
 * Responsive mobile-first.
 * Hero editorial + categorías + catálogo limpio + CTA flotante.
 */
export const META = { label: 'Commerce', desc: 'Estilo Shopify/Tiendanube: hero editorial, catálogo limpio, CTA flotante.' };

import React from 'react';
import {
  ArrowRight,
  Plus,
  Minus,
  ShoppingBag,
  Star,
  MapPin,
  Clock,
} from 'lucide-react';

import { MapaSection } from '../sections/MapaSection.jsx';

import {
  buildWhatsAppUrl,
  getEstadoApertura,
  formatPrice,
} from '../utils.js';

import {
  FONT,
  RADIUS,
  SHADOW,
  TRANSITION,
} from '../tokens.js';

const F = { fontFamily: FONT.family };

const GLOBAL_CSS = `
  * {
    box-sizing: border-box;
  }

  @keyframes tp-fade-up {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .cm-container {
    width: 100%;
    max-width: 1380px;
    margin: 0 auto;
    padding-inline: 18px;
  }

  .cm-products-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }

  @media (min-width: 760px) {
    .cm-products-grid {
      grid-template-columns: repeat(3, 1fr);
      gap: 18px;
    }

    .cm-hero {
      min-height: 88vh !important;
    }

    .cm-hero-title {
      font-size: 5.5rem !important;
    }
  }

  @media (min-width: 1180px) {
    .cm-products-grid {
      grid-template-columns: repeat(4, 1fr);
    }

    .cm-container {
      padding-inline: 34px;
    }
  }
`;

export function TemplateCommerceModern({
  tienda,
  secciones,
  cart,
  onAdd,
  onRemove,
  note,
  isDark,
}) {
  const s = Object.fromEntries(
    secciones.map(sec => [sec.id, sec])
  );

  const productos = (tienda.productos || [])
    .filter(p => p.activo !== false);

  const wa = buildWhatsAppUrl(tienda, cart, note);

  const { abierta, texto } =
    getEstadoApertura(tienda.horarios);

  // CSS VARS
  const bg          = 'var(--tp-bg)';
  const surf        = 'var(--tp-surface)';
  const surf2       = 'var(--tp-surface2)';
  const border      = 'var(--tp-border)';
  const txt         = 'var(--tp-text)';
  const txtM        = 'var(--tp-text-muted)';
  const primary     = 'var(--tp-primary)';
  const primarySoft = 'var(--tp-primary-soft)';
  const onPrimary   = 'var(--tp-on-primary)';

  return (
    <div
      style={{
        background: bg,
        minHeight: '100dvh',
        color: txt,
        ...F,
      }}
    >
      <style>{GLOBAL_CSS}</style>

      {/* HERO */}
      {s.hero?.activa && (
        <section
          className="cm-hero"
          style={{
            position: 'relative',
            minHeight: '78vh',
            overflow: 'hidden',
            background: '#000',
          }}
        >
          {(tienda.foto ||
            tienda.galeria?.[0] ||
            tienda.logo) && (
            <img
              src={
                tienda.foto ||
                tienda.galeria?.[0] ||
                tienda.logo
              }
              alt={tienda.nombre}
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          )}

          {/* overlay */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,.28) 52%, rgba(0,0,0,.44) 100%)',
            }}
          />

          <div
            className="cm-container"
            style={{
              position: 'relative',
              zIndex: 2,
              minHeight: '78vh',
              display: 'flex',
              alignItems: 'flex-end',
              paddingBottom: 42,
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: 820,
              }}
            >
              {/* chip */}
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: RADIUS.full,
                  background: 'rgba(255,255,255,.12)',
                  color: '#fff',
                  backdropFilter: 'blur(10px)',
                  marginBottom: 18,
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  animation:
                    'tp-fade-up .45s cubic-bezier(0.16,1,0.3,1) both',
                }}
              >
                <Star size={13} />
                {tienda.rubro || 'Store'}
              </div>

              {/* titulo */}
              <h1
                className="cm-hero-title"
                style={{
                  margin: 0,
                  color: '#fff',
                  fontSize: '3.7rem',
                  lineHeight: .9,
                  letterSpacing: '-0.07em',
                  fontWeight: 900,
                  animation:
                    'tp-fade-up .55s cubic-bezier(0.16,1,0.3,1) 80ms both',
                }}
              >
                {tienda.nombre}
              </h1>

              {/* descripcion */}
              {tienda.descripcion && (
                <p
                  style={{
                    margin: '18px 0 0',
                    color: 'rgba(255,255,255,.82)',
                    fontSize: 16,
                    lineHeight: 1.75,
                    maxWidth: 620,
                    animation:
                      'tp-fade-up .55s cubic-bezier(0.16,1,0.3,1) 160ms both',
                  }}
                >
                  {tienda.descripcion}
                </p>
              )}

              {/* meta */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 10,
                  marginTop: 24,
                  animation:
                    'tp-fade-up .55s cubic-bezier(0.16,1,0.3,1) 240ms both',
                }}
              >
                {texto && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 14px',
                      borderRadius: RADIUS.full,
                      background: abierta
                        ? 'rgba(16,185,129,.18)'
                        : 'rgba(239,68,68,.18)',
                      color: '#fff',
                      backdropFilter: 'blur(8px)',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <Clock size={13} />
                    {texto}
                  </div>
                )}

                {tienda.ciudad && (
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '9px 14px',
                      borderRadius: RADIUS.full,
                      background: 'rgba(255,255,255,.12)',
                      color: '#fff',
                      backdropFilter: 'blur(8px)',
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <MapPin size={13} />
                    {tienda.ciudad}
                  </div>
                )}
              </div>

              {/* CTA */}
              {wa && (
                <a
                  href={wa}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    marginTop: 28,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '16px 22px',
                    borderRadius: RADIUS.full,
                    background: primary,
                    color: onPrimary,
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: 15,
                    boxShadow: SHADOW.lg,
                    animation:
                      'tp-fade-up .55s cubic-bezier(0.16,1,0.3,1) 320ms both',
                  }}
                >
                  Ver catálogo
                  <ArrowRight size={18} />
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      {/* PRODUCTOS */}
      {s.productos?.activa && productos.length > 0 && (
        <section
          className="cm-container"
          style={{
            paddingTop: 38,
            paddingBottom: 70,
          }}
        >
          {/* heading */}
          <div
            style={{
              marginBottom: 28,
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 20,
            }}
          >
            <div>
              <div
                style={{
                  color: primary,
                  fontWeight: 800,
                  fontSize: 12,
                  letterSpacing: '.08em',
                  textTransform: 'uppercase',
                  marginBottom: 6,
                }}
              >
                Colección
              </div>

              <h2
                style={{
                  margin: 0,
                  color: txt,
                  fontSize: '2.5rem',
                  lineHeight: .95,
                  fontWeight: 900,
                  letterSpacing: '-0.05em',
                }}
              >
                Productos
              </h2>
            </div>

            <div
              style={{
                color: txtM,
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {productos.length} items
            </div>
          </div>

          {/* grid */}
          <div className="cm-products-grid">
            {productos.map((p, i) => {
              const img =
                p.foto ||
                p.galeria?.[0] ||
                p.fotos?.[0];

              const qty =
                cart.find(item => item.id === p.id)?.qty || 0;

              return (
                <article
                  key={p.id}
                  style={{
                    background: surf,
                    border: `1px solid ${border}`,
                    borderRadius: 28,
                    overflow: 'hidden',
                    boxShadow: SHADOW.sm,
                    transition: TRANSITION.normal,
                    animation:
                      `tp-fade-up .45s cubic-bezier(0.16,1,0.3,1) ${i * 45}ms both`,
                  }}
                >
                  {/* imagen */}
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '1 / 1.15',
                      background: surf2,
                      overflow: 'hidden',
                    }}
                  >
                    {img ? (
                      <img
                        src={img}
                        alt={p.nombre}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          display: 'block',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: txtM,
                          fontWeight: 700,
                        }}
                      >
                        Sin imagen
                      </div>
                    )}

                    {/* badge */}
                    <div
                      style={{
                        position: 'absolute',
                        top: 12,
                        left: 12,
                        padding: '7px 10px',
                        borderRadius: RADIUS.full,
                        background: 'rgba(255,255,255,.92)',
                        color: '#111',
                        fontSize: 11,
                        fontWeight: 800,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      NUEVO
                    </div>
                  </div>

                  {/* contenido */}
                  <div
                    style={{
                      padding: 18,
                    }}
                  >
                    <h3
                      style={{
                        margin: 0,
                        color: txt,
                        fontSize: 17,
                        lineHeight: 1.1,
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                      }}
                    >
                      {p.nombre}
                    </h3>

                    {p.descripcion && (
                      <p
                        style={{
                          margin: '10px 0 0',
                          color: txtM,
                          fontSize: 13,
                          lineHeight: 1.65,
                        }}
                      >
                        {p.descripcion}
                      </p>
                    )}

                    {/* footer */}
                    <div
                      style={{
                        marginTop: 18,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                      }}
                    >
                      <div>
                        <div
                          style={{
                            color: txt,
                            fontSize: 24,
                            lineHeight: 1,
                            fontWeight: 900,
                            letterSpacing: '-0.05em',
                          }}
                        >
                          {formatPrice(p.precio)}
                        </div>
                      </div>

                      {/* controls */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {qty > 0 && (
                          <>
                            <button
                              onClick={() => onRemove(p.id)}
                              style={{
                                width: 34,
                                height: 34,
                                border: 'none',
                                borderRadius: RADIUS.full,
                                background: surf2,
                                color: txt,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              <Minus size={16} />
                            </button>

                            <span
                              style={{
                                minWidth: 18,
                                textAlign: 'center',
                                fontWeight: 800,
                                color: txt,
                              }}
                            >
                              {qty}
                            </span>
                          </>
                        )}

                        <button
                          onClick={() => onAdd(p)}
                          style={{
                            width: 40,
                            height: 40,
                            border: 'none',
                            borderRadius: RADIUS.full,
                            background: primary,
                            color: onPrimary,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: SHADOW.sm,
                          }}
                        >
                          <Plus size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* MAPA */}
      {s.mapa?.activa && (
        <section
          style={{
            paddingBottom: 90,
          }}
        >
          <MapaSection
            tienda={tienda}
            isDark={isDark}
          />
        </section>
      )}

      {/* CART FLOAT */}
      {wa && cart.length > 0 && (
        <a
          href={wa}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            position: 'fixed',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 18,
            zIndex: 100,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            padding: '16px 24px',
            borderRadius: RADIUS.full,
            background: primary,
            color: onPrimary,
            textDecoration: 'none',
            fontWeight: 800,
            fontSize: 15,
            boxShadow: SHADOW.lg,
            backdropFilter: 'blur(10px)',
          }}
        >
          <ShoppingBag size={18} />
          Ver pedido ({cart.length})
        </a>
      )}
    </div>
  );
}