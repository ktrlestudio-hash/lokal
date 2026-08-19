// StorePageHeader — header compartido de todas las pantallas del admin de
// tienda (título/subtítulo, back, acciones). Primer componente de "shell"
// extraído de StoreApp.jsx en la Fase 3 del plan de profesionalización —
// ya recibía todo por props, así que no necesitó rediseño de estado, solo
// mover el archivo.
//
// Sin avatar de cuenta ni toggle de tema: eran redundantes con el acceso
// real (StoreSidebar.jsx en desktop, StoreMoreSheet.jsx — el "Más" del
// bottom-nav — en mobile, ambos ya tienen "Cerrar sesión"/modo oscuro).
// Sacarlos libera espacio para que el resto de acciones del header (Debug,
// Vaciar, Importar, Precio rápido, Nuevo) se acomode con menos
// apretujamiento — antes competían por el mismo ancho con 2 controles que
// ya estaban duplicados en otro lado.
import React from 'react';
import { ArrowLeft } from 'lucide-react';

export function StorePageHeader({
  title,
  subtitle,
  onBack,
  actionSlot = null,
  secondarySlot = null,
  hideActionsOnMobile = false,
  // leftSlot reemplaza el título/subtítulo (que ocupan el flex-1
  // izquierdo) por contenido custom — usado en "Mi tienda" para poner "Ver
  // página" ahí en vez de a la derecha: es la acción principal de esa
  // pantalla, y a la izquierda queda más protagónica/fácil de encontrar (el
  // pulgar en mobile ya arranca esa zona al abrir la app).
  leftSlot = null,
  // icon: mismo ícono que la sección tiene en la nav lateral/inferior (ver
  // STORE_NAV_ITEMS en StoreApp.jsx) — repetirlo acá da contexto visual
  // inmediato de "dónde estoy", igual que ya pasa con el avatar de tienda o
  // el botón de nav activo.
  icon: Icon = null,
}) {
  return (
    <div className="bg-surface-card sticky top-0 z-20 shrink-0">
      <div className="px-4 lg:px-8 h-14 lg:h-16 flex items-center gap-3 border-b border-slate-100 dark:border-white/8">

        {/* Back — el avatar de tienda que vivía acá en mobile se sacó: era
            redundante con el avatar de CUENTA de la derecha (misma forma,
            mismo tamaño, en el mismo header) aunque son datos distintos
            (negocio vs. persona dueña) — se leían como "la misma foto
            repetida". La foto de perfil de la tienda ya se ve grande y
            clara en el hero de "Mi tienda", no hace falta chiquita acá
            también. */}
        {onBack && (
          <button onClick={onBack} className="ui-icon-btn hover:bg-surface-card-2 dark:hover:bg-white/8 text-ink-dim shrink-0 -ml-1">
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}

        {/* Título + subtítulo (+ ícono de sección) — o leftSlot si se pasó uno */}
        <div className="flex-1 min-w-0 flex items-center gap-2.5">
          {Icon && !leftSlot && (
            <span className="w-8 h-8 rounded-xl bg-brand/10 dark:bg-brand/15 text-brand flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" strokeWidth={2.5} />
            </span>
          )}
          <div className="min-w-0 flex flex-col justify-center">
            {leftSlot || (
              <>
                {/* leading-none (line-height:1), no leading-tight (1.25) —
                    ese 0.25 extra de caja de línea vive mayormente debajo
                    del texto visible por cómo el navegador reparte el
                    "leading" según las métricas de la fuente, así que el
                    bloque entero (con justify-center del padre) se veía
                    corrido hacia arriba respecto al ícono de la izquierda. */}
                <h1 className="font-black text-[15px] lg:text-lg leading-none truncate">{title}</h1>
                {subtitle && <p className="text-[11px] text-ink-dim font-medium leading-none mt-0.5 truncate hidden lg:block">{subtitle}</p>}
              </>
            )}
          </div>
        </div>

        {/* Acciones */}
        <div className={`flex items-center gap-1 shrink-0 ${hideActionsOnMobile ? 'hidden lg:flex' : 'flex'}`}>
          {actionSlot}
        </div>
      </div>

      {secondarySlot && (
        <div className="border-b border-slate-100 dark:border-white/8">
          {secondarySlot}
        </div>
      )}
    </div>
  );
}
