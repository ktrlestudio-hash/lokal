/**
 * TiendaStatsSheet — panel SIMPLE de estadísticas para el dueño de tienda,
 * accesible desde un chip flotante en su propia vista pública (junto al FAB
 * "+" de carga rápida). Solo lo útil a su negocio: vistas, clicks a
 * WhatsApp, veces compartida, ofertas más vistas — NADA del tracking
 * interno de LOKAL (eso lo ve el super-admin en otro panel, ver
 * [[lokal-admin-unificado-pendiente]]).
 *
 * Mismo patrón visual que el resto de sheets de tienda-publica (overlay +
 * panel deslizante, useSheetOpen/SHEET_TRANSITION_CSS).
 */
import React, { useEffect, useState } from 'react';
import { X, Eye, MessageCircle, Share2, TrendingUp } from 'lucide-react';
import { apiFetch } from '../../api.js';
import { useSheetOpen } from '../hooks/useSheetOpen.js';
import { SHEET_TRANSITION_CSS } from './sheetTransitionCss.js';
import { RADIUS, SHADOW, FONT } from '../tokens.js';

const API_BASE = '/.netlify/functions';
const F = { fontFamily: FONT.family };

// value=null → todavía cargando: el NÚMERO se reemplaza por un bloque
// skeleton del mismo tamaño/posición exacto que ocuparía el dato real, pero
// el resto del layout (ícono, contenedor, label) se renderiza siempre de
// entrada — nunca se esconde toda la card detrás de un spinner.
//
// Layout con container query: cada card mide SU PROPIO ancho disponible
// (no el del viewport) — con espacio de sobra, ícono y número quedan lado a
// lado (menos apilamiento vertical, mejor uso del ancho); si el contenedor
// se angosta (3 cards apretadas en pantalla chica), cae a columna centrada.
function StatCard({ Icon, label, value }) {
  return (
    <div className="tss-stat" style={{ flex: 1, minWidth: 100, containerType: 'inline-size', background: 'var(--tp-surface2)', borderRadius: RADIUS.lg, padding: '14px' }}>
      <div className="tss-stat-inner">
        <div className="tss-stat-icon" style={{ background: 'color-mix(in srgb, var(--tp-primary) 14%, transparent)' }}>
          <Icon size={16} style={{ color: 'var(--tp-primary)' }} />
        </div>
        <div className="tss-stat-text">
          {value === null
            ? <div className="skeleton-shimmer" style={{ width: 34, height: 24, borderRadius: 6, background: 'var(--tp-border)' }} />
            : <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--tp-text)', lineHeight: 1 }}>{value}</div>}
          <div style={{ fontSize: 11.5, color: 'var(--tp-text-muted)', fontWeight: 600, lineHeight: 1.3 }}>{label}</div>
        </div>
      </div>
    </div>
  );
}

export function TiendaStatsSheet({ open, onClose, tienda }) {
  const { mounted, visible } = useSheetOpen(open, 220, onClose);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!open || !tienda?.id) return;
    setData(null);
    setError(null);
    const ofertaIds = (tienda.ofertas || []).map((o) => o.id).slice(0, 100).join(',');
    apiFetch(`${API_BASE}/analytics?vista=mi-tienda&tiendaId=${encodeURIComponent(tienda.id)}&ofertaIds=${encodeURIComponent(ofertaIds)}&dias=7`, { authRequired: true })
      .then(async (res) => {
        if (!res.ok) throw new Error('No se pudieron cargar las estadísticas');
        setData(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [open, tienda?.id, tienda?.ofertas]);

  if (!mounted) return null;

  const ofertasPorId = Object.fromEntries((tienda.ofertas || []).map((o) => [String(o.id), o]));
  const loading = !data && !error;
  // A diferencia de las 3 StatCard (siempre están, aunque en 0), esta
  // sección es enteramente dinámica: recién sabemos si tiene sentido
  // mostrarla cuando llega `data` y hay top ofertas reales. Mostrar un
  // skeleton de algo que quizás ni exista sería mentir sobre contenido que
  // no sabemos si va a aparecer — mejor quedarse oculta hasta confirmar.
  const topOfertas = data?.topOfertas || [];

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4720, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <style>{SHEET_TRANSITION_CSS}</style>
      <style>{`
        .tss-close { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
        @media (hover: hover) { .tss-close:hover { filter: brightness(0.85); } }
        .tss-close:active { transform: scale(0.9); transition: transform .06s ease; }

        .tss-stat-inner { display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
        .tss-stat-icon { width: 30px; height: 30px; border-radius: ${RADIUS.sm}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .tss-stat-text { display: flex; flex-direction: column; gap: 3px; }
        /* Con ancho de sobra en la card, ícono y número van lado a lado en
           vez de apilados — menos verticalización, mejor uso del ancho. */
        @container (min-width: 140px) {
          .tss-stat-inner { flex-direction: row; align-items: center; }
        }
        /* Card angosta (poco espacio, ej. 3 juntas en pantalla chica): todo
           centrado verticalmente, como pidió el usuario. */
        @container (max-width: 139.98px) {
          .tss-stat-inner { align-items: center; text-align: center; }
          .tss-stat-text { align-items: center; }
        }
      `}</style>
      <div onClick={onClose} className={`tp-sheet-ov ${visible ? 'in' : ''}`} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      <div className={`tp-sheet-panel ${visible ? 'in' : ''}`} style={{
        position: 'relative', background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
        boxShadow: SHADOW.xl, maxHeight: '80vh', overflowY: 'auto', ...F,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--tp-border)', margin: '10px auto 4px' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 14px', borderBottom: '1px solid var(--tp-border)' }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 800, color: 'var(--tp-text)' }}>Tu tienda esta semana</h3>
          <button onClick={onClose} aria-label="Cerrar" className="no-press tss-close" style={{
            width: 32, height: 32, border: 'none', borderRadius: RADIUS.md, background: 'var(--tp-surface2)',
            color: 'var(--tp-text-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}><X size={16} /></button>
        </div>

        <div style={{ padding: '16px 18px 28px' }}>
          {error && <p style={{ margin: 0, fontSize: 13, color: '#EF4444' }}>{error}</p>}

          {!error && (
            <>
              {/* Estructura fija desde el primer render — los números en sí
                  son lo único que espera datos (skeleton dentro de cada
                  StatCard), nunca se oculta el layout completo. */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <StatCard Icon={Eye} label="Vistas" value={loading ? null : data.vistas} />
                <StatCard Icon={MessageCircle} label="Clicks WhatsApp" value={loading ? null : data.clicksWhatsapp} />
                <StatCard Icon={Share2} label="Compartida" value={loading ? null : data.compartidos} />
              </div>

              {topOfertas.length > 0 && (
                <div style={{ marginTop: 20 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                    <TrendingUp size={15} style={{ color: 'var(--tp-primary)' }} />
                    <h4 style={{ margin: 0, fontSize: 13, fontWeight: 800, color: 'var(--tp-text)' }}>Ofertas más vistas</h4>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {topOfertas.map((o) => {
                      const oferta = ofertasPorId[o.productoId];
                      return (
                        <div key={o.productoId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--tp-surface2)', borderRadius: RADIUS.md }}>
                          {oferta?.thumbUrl && (
                            <img src={oferta.thumbUrl} alt="" style={{ width: 36, height: 36, borderRadius: RADIUS.sm, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ margin: 0, fontSize: 12.5, fontWeight: 700, color: 'var(--tp-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {oferta?.nombre || 'Oferta eliminada'}
                            </p>
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tp-text-muted)', flexShrink: 0 }}>{o.vistas} vistas</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Mismo <p> con el texto real siempre presente: durante
                  loading se ve como skeleton (texto transparente + fondo
                  shimmer), con datos se oculta si vistas>0. Al ser el mismo
                  texto en ambos casos, el wrap a N líneas del navegador es
                  idéntico — sin adivinar cuántas líneas ocupa, cero salto de
                  alto entre loading y el estado final "sin datos". */}
              <p style={{
                margin: '16px 0 0', fontSize: 12.5, lineHeight: 1.3, textAlign: 'center',
                color: loading ? 'transparent' : 'var(--tp-text-muted)',
                background: loading ? 'var(--tp-border)' : 'transparent',
                borderRadius: loading ? 4 : 0,
                display: (!loading && data && data.vistas !== 0) ? 'none' : 'block',
              }} className={loading ? 'skeleton-shimmer' : ''}>
                Todavía no hay visitas esta semana. Compartí tu tienda para empezar a ver estadísticas.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
