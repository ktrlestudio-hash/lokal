import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { deriveColorPalette, resolvePagina, getSeccionesActivas } from './utils.js';
import { buildPreviewTienda } from './mockData.js';

// Auto-detecta todos los templates en ./templates/*.jsx
// Cada template exporta su componente (TemplateXxx) + META { label, desc }
const TEMPLATE_MODULES = import.meta.glob('./templates/*.jsx', { eager: true });

function buildTemplateMaps() {
  const components = {};
  const meta = {};
  for (const [path, mod] of Object.entries(TEMPLATE_MODULES)) {
    const key = path.replace('./templates/', '').replace('.jsx', '');
    const comp = Object.entries(mod).find(([k, v]) => k.startsWith('Template') && typeof v === 'function');
    if (comp) components[key] = comp[1];
    if (mod.META) meta[key] = mod.META;
  }
  return { components, meta };
}

const { components: TEMPLATES, meta: TEMPLATES_META } = buildTemplateMaps();
export { TEMPLATES_META };

export function TiendaPublicaRenderer({
  tienda, paginaOverride = null, previewMode = false, isDark: isDarkApp, onToggleTheme,
  // modo: por defecto 'standalone' — este renderer es el único punto que
  // monta el template para /t/:slug público, Root.jsx y el preview de
  // StoreApp.jsx, ninguno de esos es "logueado dentro de LOKAL". Solo el
  // wrapper que reemplaza TiendaDetailScreen pasa modo="plataforma"
  // explícito (ver src/screens/TiendaDetailScreen.jsx nuevo).
  modo = 'standalone',
  // Props de "modo plataforma" — reenviadas tal cual al Template. Cuando no
  // vienen (todos los usos actuales: /t/:slug, Root.jsx, preview de
  // StoreApp.jsx), no cambia nada del comportamiento existente.
  onVerEnMapaGlobal, tiendasSimilares, onIrATienda, onVerTodosFiltrado,
  // Clic interno en una oferta (SPA, sin re-fetch) — Root pasa navegarAOferta.
  onVerOferta,
  // Clic interno en un producto de catálogo (SPA, sin re-fetch) — Root pasa
  // navegarAProducto. Navega a /:tienda/p/:producto (página completa propia,
  // ver ProductoIndividual.jsx), reemplaza al viejo ProductDetailModal.
  onVerProducto,
  // Dueño logueado viendo su propia tienda — habilita el FAB "+" de carga
  // rápida de oferta directo en la vista pública (ver OfertaQuickForm), el
  // menú de 3 puntos por card (ver OfertaAdminSheet), y el FAB "Editar mi
  // tienda" (atajo al panel completo, antes un botón fijo bottom:16 propio
  // que quedaba tapado por el nav — ahora otro FAB apilado con los demás).
  // onOfertaReintentar/onOfertaCancelarPendiente: solo aplican a la card
  // "pendiente" que aparece al instante tras publicar (ver OfertaQuickForm +
  // TiendaPublica.jsx → subirOfertaEnCola) mientras sube en segundo plano.
  esDueño, onOfertaCreada, onOfertaActualizada, onOfertaEliminada, onIrAlPanel,
  onOfertaReintentar, onOfertaCancelarPendiente,
}) {
  const pagina = useMemo(() => resolvePagina(paginaOverride ?? tienda.pagina), [tienda, paginaOverride]);
  const secciones = useMemo(() => getSeccionesActivas(pagina.secciones), [pagina]);

  const tiendaConDatos = useMemo(() => {
    if (!previewMode) return tienda;
    const base = buildPreviewTienda(tienda, tienda?.productos || []);
    return { ...tienda, ...base, productos: base._productos };
  }, [tienda, previewMode]);

  // El modo claro/oscuro es UNO SOLO para toda la interfaz de LOKAL — no un
  // sub-modo aislado por tienda. Cuando se navega logueado desde dentro de
  // la app, Root.jsx pasa isDark/onToggleTheme (su estado real, compartido
  // por todas las pantallas, con su propia clase .dark en <html>) y este
  // renderer lo usa tal cual. Solo cuando se entra standalone por el link
  // público (/t/:slug, sin sesión) no existe ese theme del que colgarse —
  // ahí el renderer TAMBIÉN pone/saca la clase .dark en <html> (el mismo
  // mecanismo real que usa toda la app, no una variable nueva), sembrada con
  // pagina.modoOscuro. Así --surface-solid/--text-primary de index.css (que
  // solo cambian según esa clase real) se actualizan de verdad en los dos
  // casos, sin un segundo sistema de tokens paralelo.
  const standalone = isDarkApp === undefined;
  const [darkLocal, setDarkLocal] = useState(pagina.modoOscuro);
  const dark = standalone ? darkLocal : isDarkApp;
  const toggleDark = standalone ? () => setDarkLocal(d => !d) : onToggleTheme;

  // useLayoutEffect (no useEffect): aplica la clase .dark en <html> de forma
  // SÍNCRONA, antes de que el navegador pinte el frame. Con useEffect había
  // un frame intermedio donde React ya renderizó el árbol con el `dark` de
  // este componente (footer incluido, que usa la misma variable) pero el
  // DOM real de <html> todavía tenía la clase de una navegación SPA
  // anterior (sin full reload) — el resto de la página, cuyo CSS lee la
  // clase real en <html> en vez de la prop de React, pintaba con el tema
  // viejo por ese instante. Se veía "a veces" porque depende de si <html>
  // ya traía o no .dark puesta de antes; el toggle manual lo "arreglaba"
  // porque fuerza un nuevo ciclo de render+efecto ya sincronizado.
  useLayoutEffect(() => {
    if (!standalone) return undefined; // Root.jsx ya maneja su propia clase .dark
    document.documentElement.classList.toggle('dark', dark);
    return () => { if (!pagina.modoOscuro) document.documentElement.classList.remove('dark'); };
  }, [standalone, dark]);

  useLayoutEffect(() => {
    const vars = deriveColorPalette(pagina.color, dark, pagina.colorSecundario);
    const el = document.documentElement;
    Object.entries(vars).forEach(([k, v]) => el.style.setProperty(k, v));
    return () => Object.keys(vars).forEach(k => el.style.removeProperty(k));
  }, [pagina.color, pagina.colorSecundario, dark]);

  const Template = TEMPLATES[pagina.template] ?? TEMPLATES['commerce-modern'];

  // El Template ahora controla TODO el layout de scroll (hero + catálogo +
  // footer de marca juntos, dentro de un contenedor con altura fija de
  // viewport) — el footer de marca se le pasa como render-prop en vez de
  // vivir acá afuera, para que el scroll interno del template lo incluya.
  // Antes vivía como hermano de <Template>, fuera de cualquier scroll
  // acotado, y TiendaNavBar (fixed, sin ocupar espacio en el flujo) lo
  // tapaba sin que nada del documento lo empujara a la vista.
  return (
    <Template
      tienda={tiendaConDatos}
      secciones={secciones}
      isDark={dark}
      modo={modo}
      onVerEnMapaGlobal={onVerEnMapaGlobal}
      tiendasSimilares={tiendasSimilares}
      onIrATienda={onIrATienda}
      onVerTodosFiltrado={onVerTodosFiltrado}
      onVerOferta={onVerOferta}
      onVerProducto={onVerProducto}
      esDueño={esDueño}
      onOfertaCreada={onOfertaCreada}
      onOfertaActualizada={onOfertaActualizada}
      onOfertaEliminada={onOfertaEliminada}
      onIrAlPanel={onIrAlPanel}
      onOfertaReintentar={onOfertaReintentar}
      onOfertaCancelarPendiente={onOfertaCancelarPendiente}
      heroLayout={'editorial' /* TEMP: forzado para preview — revertir a: pagina.heroLayout || 'card' */}
      // Footer de marca "lokal" se muestra en ambos modos por consistencia
      // visual — en plataforma el toggle de tema comparte el mismo estado
      // global (isDark/onToggleTheme) que el resto de LOKAL, no uno aislado.
      footer={!previewMode ? { dark, toggleDark } : null}
    />
  );
}
