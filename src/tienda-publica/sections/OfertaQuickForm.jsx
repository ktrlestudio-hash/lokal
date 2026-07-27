/**
 * OfertaQuickForm — carga rápida de oferta DIRECTO desde la vista pública de
 * tienda (FAB "+"), sin ir al panel admin. Mismo endpoint (POST /ofertas) y
 * mismos campos que OfertaFormOverlay en StoreApp.jsx — no se duplica la
 * lógica de guardado, solo se monta en un bottom-sheet en vez del overlay de
 * página completa (acá no hay StorePageHeader ni layout de panel).
 *
 * Solo visible/montable cuando el dueño logueado ve su propia tienda
 * (ver "esDueño" en TiendaPublica.jsx / prop mismo nombre acá).
 */
import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { X, Camera, Save, CalendarClock } from 'lucide-react';
import { haptic } from '../../haptic.js';
import { useSheetOpen } from '../hooks/useSheetOpen.js';
import { SHEET_TRANSITION_CSS } from './sheetTransitionCss.js';
import { TpMiniCalendario } from '../components/TpMiniCalendario.jsx';
import { RADIUS, SHADOW, FONT } from '../tokens.js';

const F = { fontFamily: FONT.family };

export function OfertaQuickForm({ open, onClose, tienda, onCreated }) {
  const { mounted, visible } = useSheetOpen(open, 220, onClose);
  const [nombre, setNombre] = useState('');
  const [expireAt, setExpireAt] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [fotoFile, setFotoFile] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const calendarRef = useRef(null);
  const photoBoxRef = useRef(null); // contenedor que mide el espacio real disponible (flex:1)
  const [photoSize, setPhotoSize] = useState(null); // { w, h } medido, no estimado

  // Mide el espacio REAL que el flex:1 del contenedor le deja a la foto, y
  // fija width/height explícitos en px sobre ese valor — evita la ambigüedad
  // de layout de "aspectRatio + flex:1 en un contenedor flex-column", que en
  // la práctica el navegador resolvía mal (flex-basis colapsando a un
  // tamaño mínimo en vez de llenar el espacio real). Con ResizeObserver el
  // tamaño es el que el navegador YA calculó para el contenedor — no una
  // estimación a mano ni una re-derivación ambigua.
  useLayoutEffect(() => {
    const el = photoBoxRef.current;
    if (!el) return undefined;
    const RATIO = 1 / 1.414; // ancho/alto — mismo ratio que la card real del catálogo
    const medir = () => {
      const h = el.clientHeight;
      if (h <= 0) return;
      const wMax = el.clientWidth;
      let w = h * RATIO;
      let hFinal = h;
      if (w > wMax) { w = wMax; hFinal = w / RATIO; }
      setPhotoSize({ w: Math.round(w), h: Math.round(hFinal) });
    };
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    return () => ro.disconnect();
  }, [calendarOpen]);

  // Igual que en OfertaAdminSheet: si el calendario despliega tapado por el
  // borde inferior del sheet, se trae a la vista con scroll suave dentro del
  // body scrolleable — el botón "Publicar" del footer (sticky) nunca lo tapa
  // porque vive fuera de esa zona de scroll.
  //
  // Delay de 150ms (no requestAnimationFrame inmediato): el preview de foto
  // anima su propio encogimiento en .3s al abrir el calendario — si el
  // scrollIntoView arranca en el mismo frame, los dos movimientos (foto
  // achicándose + scroll del panel) chocan a la vez y la transición se
  // siente rota/brusca, aunque la curva CSS sea la misma en ambos sentidos.
  // Dejando que la foto avance un tercio de su animación antes de mover el
  // scroll, cada movimiento se percibe por separado — al cerrar no hace
  // falta este delay porque no hay scroll compitiendo, por eso ese sentido
  // ya se sentía bien.
  useEffect(() => {
    if (!calendarOpen) return;
    const t = setTimeout(() => {
      calendarRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 150);
    return () => clearTimeout(t);
  }, [calendarOpen]);

  if (!mounted) return null;

  // OJO: NO revoca fotoPreview acá — ese object URL viaja al padre como
  // previewUrl de la card pendiente (ver handleSave) y sigue en uso hasta
  // que termine de subir. El padre es quien lo revoca cuando ya no hace falta.
  const reset = () => {
    setNombre(''); setExpireAt(''); setFotoFile(null); setFotoPreview(null); setCalendarOpen(false);
  };

  const handleFoto = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
    e.target.value = '';
  };

  // El sheet ya NO espera a que termine la subida: entrega los datos al padre
  // (TiendaPublica.jsx, que sobrevive al cierre de este componente) y cierra
  // al instante. El padre inserta la oferta en la grilla en estado "pendiente"
  // y sube en segundo plano — antes este mismo botón dejaba el sheet trabado
  // con un spinner varios segundos (lo que tarde el upload de 3 variantes +
  // POST), sin poder cancelar, cerrar ni seguir usando la página.
  const handleSave = () => {
    if (!nombre.trim() || !fotoFile) return;
    haptic('success');
    onCreated?.({
      nombre: nombre.trim(),
      fotoFile,
      // La preview local (blob) se usa como imagen de la card mientras sube:
      // se ve la foto real desde el primer frame, no un placeholder gris. El
      // padre revoca este object URL cuando llega la URL definitiva.
      previewUrl: fotoPreview,
      expireAt: expireAt ? new Date(expireAt).toISOString() : null,
    });
    reset();
    onClose();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 4720, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
      <style>{SHEET_TRANSITION_CSS}</style>
      <style>{`
        .oqf-close { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
        @media (hover: hover) { .oqf-close:hover { filter: brightness(0.85); } }
        .oqf-close:active { transform: scale(0.9); transition: transform .06s ease; }
        .oqf-photo { transition: border-color .15s ease; }
        @media (hover: hover) { .oqf-photo:hover { border-color: var(--tp-primary); } }
        /* Overlay "cambiar foto" — solo relevante en desktop (hover:hover):
           con la imagen ya cargada, el borde punteado de arriba queda tapado
           detrás de la foto (objectFit:cover cubre todo el label), así que
           ese hover no se nota. Este overlay SÍ es visible encima de la
           imagen, dejando claro que el label sigue siendo clickeable para
           reemplazarla — mismo comportamiento que el drag&drop original,
           solo que ahora también señalizado en el estado "con foto". */
        .oqf-photo-overlay { opacity: 0; transition: opacity .15s ease; }
        @media (hover: hover) { .oqf-photo:hover .oqf-photo-overlay { opacity: 1; } }
        .oqf-save { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
        @media (hover: hover) { .oqf-save:not(:disabled):hover { filter: brightness(1.08); } }
        .oqf-save:active:not(:disabled) { transform: scale(0.97); transition: transform .06s ease; }
        .oqf-row { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), filter .15s ease; }
        @media (hover: hover) { .oqf-row:hover { filter: brightness(0.95); } }
        .oqf-row:active { transform: scale(0.97); transition: transform .06s ease; }
        /* Badge X flotante — más chico que un oqf-row normal, un brightness
           sutil no se nota bien sobre el fondo semi-transparente; escala
           leve en su lugar, mismo lenguaje que el resto de botones chicos
           de tienda-publica (ver TiendaStatsSheet/OfertaAdminSheet). */
        .oqf-x { transition: transform .12s cubic-bezier(0.34,1.56,0.64,1), background-color .15s ease; }
        @media (hover: hover) { .oqf-x:hover { background: rgba(0,0,0,.75); } }
        .oqf-x:active { transform: scale(0.88); transition: transform .06s ease; }
        /* Input de nombre — mismo criterio que .oqf-photo (borde a
           var(--tp-primary) en hover), consistente con el resto de campos
           interactivos del sheet. focus además de hover: una vez con foco
           el usuario ya sabe que está ahí, pero el hover previo (antes de
           tocarlo) es lo que faltaba señalizar. */
        .oqf-input { transition: border-color .15s ease; }
        @media (hover: hover) { .oqf-input:hover { border-color: var(--tp-primary); } }
        .oqf-input:focus { border-color: var(--tp-primary); }
      `}</style>
      <div onClick={onClose} className={`tp-sheet-ov ${visible ? 'in' : ''}`} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)' }} />
      {/* Alto FIJO (height, no maxHeight) — nunca cambia entre calendario
          abierto/cerrado. La foto de abajo es la que se ajusta al espacio
          real que este alto fijo deja libre (medido con ResizeObserver, ver
          photoBoxRef), así nunca sobra aire ni el contenido se desborda. */}
      <div className={`tp-sheet-panel tp-sheet-scroll ${visible ? 'in' : ''}`} style={{
        position: 'relative', background: 'var(--tp-surface)', borderRadius: `${RADIUS.xl} ${RADIUS.xl} 0 0`,
        boxShadow: SHADOW.xl, height: '88vh', display: 'flex', flexDirection: 'column', ...F,
      }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: 'var(--tp-border)', margin: '10px auto 4px', flexShrink: 0 }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px 14px', borderBottom: '1px solid var(--tp-border)', flexShrink: 0 }}>
          <h3 style={{ margin: 0, flex: 1, fontSize: 16, fontWeight: 800, color: 'var(--tp-text)' }}>Nueva oferta</h3>
          <button onClick={onClose} aria-label="Cerrar" className="no-press oqf-close" style={{
            width: 32, height: 32, border: 'none', borderRadius: RADIUS.md, background: 'var(--tp-surface2)',
            color: 'var(--tp-text-muted)', display: 'grid', placeItems: 'center', cursor: 'pointer',
          }}><X size={16} /></button>
        </div>

        {/* IMPORTANTE: overflowY:auto vive en un contenedor SEPARADO del que
            tiene flex:1 en la foto — un elemento con overflow:auto/scroll
            hace que sus hijos flex:1 calculen su tamaño CONTRA su contenido
            natural (para que el scroll tenga sentido), no contra el espacio
            real del contenedor. Con los dos roles mezclados en un mismo div,
            el flex:1 de la foto colapsaba a su tamaño mínimo en vez de
            llenar el espacio — bug real que hacía ver la foto diminuta. */}
        <div className="tp-sheet-scroll" style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>
        <div style={{ padding: '16px 18px', height: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: calendarOpen ? 10 : 16, transition: 'gap .2s ease' }}>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            {/* Label "Foto" siempre visible — es la referencia fija del
                bloque, no debe desaparecer aunque el calendario abierto
                achique la foto de abajo. */}
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--tp-text-muted)', marginBottom: 8, flexShrink: 0 }}>Foto</label>
            {/* Contenedor MEDIDOR: ocupa el 100% real del espacio que el
                flex:1 del padre le asigna (sin aspectRatio propio, así no
                compite con el flex por resolver la altura) — de ahí se
                calcula width/height exactos para la <label> centrada
                adentro, que sí mantiene el ratio 1/1.414 (MISMO que la card
                real del catálogo, ver commerce-modern.jsx sección
                "Ofertas") sin nunca sobrar ni faltar espacio. */}
            {/* Sin transition propia en la <label>: el ResizeObserver ya
                recalcula photoSize en TIEMPO REAL, en cada frame que el
                grid-template-rows del calendario avanza (ver arriba) — el
                único movimiento animado es el del calendario, la foto solo
                "sigue" el valor medido instante a instante. Ponerle su
                propia transition hacía que cada nueva medición (varias por
                segundo mientras el calendario se despliega) disparara una
                mini-transición desde el valor anterior, dando el efecto de
                "salto/rebote encimado" en vez de un único movimiento fluido
                sincronizado con el calendario. */}
            {/* alignItems: flex-start (no center) — con el ancla arriba, la
                foto crece/decrece únicamente hacia abajo desde un borde
                superior fijo, coherente con la posición del label "Foto"
                justo encima. Centrado hacía que se achicara desde LOS DOS
                bordes a la vez (arriba bajando, abajo subiendo), lo que se
                percibía como que la foto entera "se movía hacia arriba" en
                vez de simplemente encogerse en su lugar. */}
            <div ref={photoBoxRef} style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
              <label className="oqf-photo" style={{
                display: 'block',
                width: photoSize ? photoSize.w : '100%',
                height: photoSize ? photoSize.h : '100%',
                borderRadius: RADIUS.lg, border: `2px dashed var(--tp-border)`,
                background: 'var(--tp-surface2)', overflow: 'hidden', cursor: 'pointer', position: 'relative',
              }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFoto} />
                {fotoPreview
                  ? (
                    <>
                      <img src={fotoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div className="oqf-photo-overlay" style={{
                        position: 'absolute', inset: 0, background: 'rgba(0,0,0,.45)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: '#fff',
                      }}>
                        <Camera size={20} />
                        <span style={{ fontSize: 11.5, fontWeight: 700 }}>Cambiar foto</span>
                      </div>
                    </>
                  )
                  : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6, color: 'var(--tp-text-muted)' }}>
                      <Camera size={calendarOpen ? 16 : 22} />
                      {!calendarOpen && <span style={{ fontSize: 11.5, fontWeight: 700, textAlign: 'center', padding: '0 8px' }}>Elegir foto</span>}
                    </div>
                  )}
                {/* Badge X flotante — solo con foto ya elegida: deja claro
                    que se puede quitar/cambiar, sin depender de que el
                    dueño "adivine" que tocar la foto de nuevo abre el picker
                    otra vez. stopPropagation: no abrir el file picker (click
                    del <label> padre) al tocar la X. */}
                {fotoPreview && (
                  <button
                    type="button"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setFotoFile(null); setFotoPreview(null); }}
                    aria-label="Quitar foto" className="no-press oqf-x"
                    style={{
                      position: 'absolute', top: 6, right: 6, zIndex: 2,
                      width: 24, height: 24, border: 'none', borderRadius: RADIUS.full,
                      background: 'rgba(0,0,0,.55)', color: '#fff', display: 'grid', placeItems: 'center', cursor: 'pointer',
                    }}
                  ><X size={13} /></button>
                )}
              </label>
            </div>
          </div>

          <div style={{ flexShrink: 0 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--tp-text-muted)', marginBottom: 8 }}>Nombre</label>
            <input
              className="oqf-input"
              value={nombre} onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: 2x1 en aceite de girasol" maxLength={160}
              style={{ width: '100%', padding: '12px 14px', borderRadius: RADIUS.md, border: `1.5px solid var(--tp-border)`, background: 'var(--tp-surface2)', color: 'var(--tp-text)', fontSize: 14, outline: 'none', ...F }}
            />
          </div>

          <div style={{ flexShrink: 0 }}>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em', color: 'var(--tp-text-muted)', marginBottom: 8 }}>Vence (opcional)</label>
            <button type="button" onClick={() => setCalendarOpen((v) => !v)} className="no-press oqf-row" style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderRadius: RADIUS.md,
              border: `1.5px solid ${calendarOpen ? 'var(--tp-primary)' : 'var(--tp-border)'}`, background: 'var(--tp-surface2)',
              color: expireAt ? 'var(--tp-text)' : 'var(--tp-text-muted)', fontSize: 14, cursor: 'pointer', ...F,
            }}>
              <CalendarClock size={17} style={{ color: expireAt ? 'var(--tp-primary)' : 'var(--tp-text-muted)', flexShrink: 0 }} />
              <span style={{ flex: 1, textAlign: 'left' }}>
                {expireAt ? new Date(expireAt).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' }) : 'Sin fecha de vencimiento'}
              </span>
            </button>
            {/* grid-template-rows 0fr→1fr (no mount/unmount condicional):
                el calendario SIEMPRE está en el DOM, pero su fila de grid
                crece de 0 a su alto natural con transición — así el espacio
                que le "roba" a la foto aparece progresivo, no de golpe. El
                ResizeObserver de la foto (más arriba) reacciona en cada
                frame de ESTA MISMA animación (mide el tamaño real en cada
                instante), sincronizando ambos movimientos sin necesitar
                coordinarlos a mano — antes el calendario aparecía
                instantáneo y la foto corría SU PROPIA transición aparte,
                dando la sensación de dos animaciones desacopladas. */}
            <div style={{ display: 'grid', gridTemplateRows: calendarOpen ? '1fr' : '0fr', transition: 'grid-template-rows .3s cubic-bezier(0.34,1.35,0.4,1)' }}>
              <div ref={calendarRef} style={{ overflow: 'hidden', minHeight: 0 }}>
                <div style={{ marginTop: 8, padding: 10, borderRadius: RADIUS.lg, background: 'var(--tp-surface2)' }}>
                  <TpMiniCalendario valueISO={expireAt} onPick={(iso) => { setExpireAt(iso); setCalendarOpen(false); }} />
                  {expireAt && (
                    <button type="button" onClick={() => { setExpireAt(''); setCalendarOpen(false); }} className="no-press oqf-row" style={{
                      width: '100%', marginTop: 8, padding: '9px', border: 'none', borderRadius: RADIUS.md,
                      background: 'transparent', color: 'var(--tp-text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    }}>Quitar fecha de vencimiento</button>
                  )}
                </div>
              </div>
            </div>
            {!calendarOpen && (
              <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--tp-text-muted)' }}>Sin fecha, la oferta queda vigente hasta que la ocultes desde el panel.</p>
            )}
          </div>

        </div>
        </div>

        {/* Footer sticky — flexShrink:0, siempre visible dentro del maxHeight
            del panel, nunca hace falta scrollear para llegar al botón. El
            sheet cierra al toque (sin spinner ni "saving"): la subida real
            corre en segundo plano en TiendaPublica.jsx, con su propia card
            de progreso en la grilla — ver handleSave más arriba. */}
        <div style={{ padding: '12px 18px', paddingBottom: 'max(12px, env(safe-area-inset-bottom))', borderTop: '1px solid var(--tp-border)', flexShrink: 0 }}>
          <button onClick={handleSave} disabled={!nombre.trim() || !fotoFile} className="no-press oqf-save"
            style={{
              width: '100%', padding: '14px', border: 'none', borderRadius: RADIUS.lg, cursor: 'pointer',
              background: 'var(--tp-primary)', color: 'var(--tp-on-primary)', fontWeight: 800, fontSize: 15,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              opacity: (!nombre.trim() || !fotoFile) ? .5 : 1,
            }}>
            <Save size={18} />
            Publicar oferta
          </button>
        </div>
      </div>
    </div>
  );
}
