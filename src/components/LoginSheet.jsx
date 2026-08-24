// LoginSheet — contenedor responsive (bottom-sheet en mobile, modal
// centrado en desktop) que envuelve LoginCard, el MISMO diseño de card que
// usa AdminLogin.jsx (ilustración de ciudad, logo, degradado de marca) — no
// una versión simplificada aparte. Disparado desde el avatar del header o
// "Cuenta" en la bottom-nav de HomeGlobal.
//
// La única pieza propia de este archivo es el contenedor (portal, backdrop,
// animación de entrada, responsive sheet/modal) y el glow de fondo que
// AdminLogin logra con su propio layout de página completa — acá se
// recrea contenido en el panel, ya que este componente no tiene una
// página propia alrededor.
//
// Ver memoria "lokal-links-rol-usuario-comun-login" para el diseño
// completo del flujo (whoami → tienda/usuario/nuevo).
import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import LoginCard from './LoginCard.jsx';

export default function LoginSheet({ abierto, isDark, onCerrar, onEsTienda, onEsUsuario }) {
  if (!abierto) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0"
        style={{ zIndex: 7600, background: 'rgba(0,0,0,.5)', animation: 'lk-login-sheet-fade .18s ease' }}
        onClick={onCerrar}
      />
      {/* items-end en mobile (bottom-sheet real), items-center desde sm
          (modal centrado en desktop) — mismo criterio responsive que
          PricingUI.jsx, sin traer framer-motion: la animación es CSS
          simple (mismo lenguaje que ProximamenteModal/SheetLegal). */}
      <div className="fixed inset-0 flex items-end sm:items-center justify-center p-0 sm:p-4" style={{ zIndex: 7601 }} onClick={onCerrar}>
        {/* max-h-[90dvh] + overflow-y-auto: sin esto, en una ventana baja
            (mobile landscape, notebook chica) el panel podía superar el
            alto visible y el overflow-hidden (necesario para el
            border-radius redondeado) recortaba silenciosamente la
            ilustración en vez de dejar ver el resto del contenido —
            mismo criterio que PricingUI.jsx (max-h-[90dvh] flex flex-col
            overflow-hidden en el panel exterior, scroll en el body). */}
        {/* Dos capas, igual que AdminLogin.jsx: fondo de PÁGINA (#040a14
            plano en dark) + la CARD encima con su propio degradado glass
            tintado de marca (linear-gradient + blur en dark, degradado
            sutil + borde en light). Antes acá solo estaba el fondo plano
            sin la capa de card — se leía como un gris/negro liso en vez del
            mismo glass enriquecido que tiene la card de /admin. */}
        {/* Fondo base #fff puro en light (NO var(--surface-solid) — ese
            token puede resolver a un gris off-white, que es justo el "muy
            gris" que se reportó). #040a14 en dark, igual al fondo real de
            HomeGlobal. */}
        <div
          className="lk-login-sheet-panel relative w-full sm:max-w-sm max-h-[90dvh] overflow-y-auto overflow-x-hidden"
          onClick={(e) => e.stopPropagation()}
          style={{
            borderRadius: '24px 24px 0 0',
            boxShadow: '0 -8px 40px rgba(0,0,0,.25)',
            animation: 'lk-login-sheet-up .24s cubic-bezier(0.22,1,0.36,1)',
            background: isDark ? '#040a14' : '#fff',
          }}
        >
          <style>{`
            @keyframes lk-login-sheet-fade { from { opacity: 0 } to { opacity: 1 } }
            @keyframes lk-login-sheet-up { from { opacity: 0; transform: translateY(24px) } to { opacity: 1; transform: translateY(0) } }
            @media (min-width: 640px) {
              .lk-login-sheet-panel { border-radius: 24px !important; animation-name: lk-login-sheet-pop !important; }
            }
            @keyframes lk-login-sheet-pop { from { opacity: 0; transform: scale(.95) } to { opacity: 1; transform: scale(1) } }
          `}</style>

          {/* Mismo glow EXACTO que usa el footer de HomeGlobal (radial-
              gradient de --brand al 10%, no un degradado diagonal propio)
              — antes acá había un linear-gradient inventado para este
              sheet, que no coincidía con el lenguaje real del resto de la
              app y se leía como un gris plano en vez de un tinte de marca. */}
          <div className="absolute inset-x-0 top-0 pointer-events-none" style={{
            height: '70%',
            background: isDark
              ? 'radial-gradient(ellipse 70% 55% at 50% 0%, rgb(var(--brand, 0 184 217) / 0.16), transparent)'
              : 'radial-gradient(ellipse 70% 96px at 50% 0%, rgb(var(--brand, 0 184 217) / 0.10), transparent)',
          }} />

          <div className="relative px-6 pt-7 pb-6 text-center">
            {/* Handle de sheet — solo visible en mobile (en desktop este
                panel es un modal centrado, no un sheet que "se agarra"). */}
            <div className="sm:hidden w-9 h-1 rounded-full bg-brand/20 mx-auto -mt-2 mb-4" />

            <button
              onClick={onCerrar}
              aria-label="Cerrar"
              className="absolute w-8 h-8 rounded-xl grid place-items-center bg-brand/[0.08] hover:bg-brand/[0.16] text-ink-dim transition-colors"
              style={{ top: 16, right: 16 }}
            >
              <X className="w-4 h-4" />
            </button>

            {/* mt-10: el botón de cerrar es absolute (top:16, 32px de alto)
                dentro de este mismo contenedor relative — sin este margen,
                el div de la ilustración (que arranca pegado al padding-top
                del panel) queda tapado detrás/solapado con el botón en vez
                de empezar por debajo de él. */}
            <div className="mt-10">
              {/* mostrarIlustracion={false}: probando el sheet sin la
                  ciudad — CiudadIlustrada sigue existiendo para reusarla en
                  otro contexto más adelante, acá se prueba un layout más
                  compacto sin ella. */}
              {/* Título/subtítulo neutrales — este mismo botón sirve tanto
                  para el dueño de una tienda existente como para un usuario
                  común (whoami decide el destino recién DESPUÉS del login),
                  así que no puede prometer algo específico de un solo perfil
                  (antes decía "guardá favoritos, seguir tiendas" — sonaba a
                  que el sheet era solo para usuarios). Subtítulo con el
                  mismo vocabulario que ya usa HomeGlobal ("Explorá tu
                  ciudad" / "Descubrí tiendas nuevas") en vez de repetir
                  "continuar" tres veces seguidas (botón de Google → este
                  subtítulo → el texto legal de abajo, que también dice
                  "Al continuar..."). */}
              {/* mountDelayMs=260: el panel de este sheet anima su entrada
                  con translateY (lk-login-sheet-up, 240ms) — sin esperar a
                  que termine, Google calculaba la posición/hit-area de su
                  iframe con el layout todavía en movimiento, y el sheet
                  nativo podía no detectar el toque (reportado en
                  producción). 260ms = 240ms de animación + margen. */}
              <LoginCard
                isDark={isDark}
                whoami
                onEsTienda={onEsTienda}
                onEsUsuario={(usuario) => { onEsUsuario(usuario); onCerrar(); }}
                titulo="Entrá a LOKAL"
                subtitulo="Tu ciudad, a un link de distancia."
                mostrarQueEsLokal
                mostrarIlustracion={false}
                mountDelayMs={260}
              />
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}
