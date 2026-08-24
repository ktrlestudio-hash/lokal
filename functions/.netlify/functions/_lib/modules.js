// _lib/modules.js — Registro de módulos de LOKAL LINKS.
//
// LOKAL LINKS es la PLANTILLA BASE modular: cada funcionalidad de negocio
// (galería de ofertas, catálogo con carrito, alquileres, viajes...) es un
// "módulo" independiente que se activa o no por tienda.
//
// IMPORTANTE: esto NO es un sistema paralelo — usa el MISMO mecanismo que
// ya existe para las secciones del editor visual "Mi página"
// (src/tienda-publica/tokens.js → SECCIONES_DEFAULT, resuelto por
// resolvePagina()/getSeccionesActivas() en src/tienda-publica/utils.js):
// cada entrada de `tienda.pagina.secciones` es `{activa, orden, label, desc}`,
// no un booleano suelto. Un módulo de negocio (ofertas, catálogo) se declara
// como una sección más — el dueño la activa/reordena desde el mismo panel
// donde ya activa/reordena horarios, galería, sobre nosotros, etc.
//
// Un rubro (`tienda.rubros[]`) sugiere qué módulos activar por default al
// crear la tienda, pero el dueño puede combinar cualquier módulo con
// cualquier rubro — el rubro no es una jaula, es solo un preset inicial.
//
// Para agregar un módulo nuevo (ej. "alquileres"):
//   1. Sumarlo a MODULES con label/desc/orden (mismo formato que
//      SECCIONES_DEFAULT en src/tienda-publica/tokens.js — de hecho, si el
//      módulo tiene UI, hay que sumarlo TAMBIÉN ahí para que el editor
//      visual lo liste; este archivo es la versión del lado backend).
//   2. Sumar qué rubros lo activan por default en RUBRO_DEFAULTS.
//   3. Escribir su backend (netlify/functions/<modulo>.js, <modulo>-ssr.js
//      si necesita OG dinámico) siguiendo el patrón de ofertas.js/oferta-ssr.js.
//   4. Escribir su UI en src/tienda-publica/templates/*.jsx, leyendo
//      isModuleActive(tienda, '<modulo>') antes de renderizar — igual que
//      ya hace commerce-modern.jsx con `s.productos?.activa`.
// El núcleo (hero, footer, nav, auth, mapa, horarios) no necesita cambios
// para que un módulo nuevo funcione.

export const MODULES = {
  ofertas: {
    label: 'Ofertas',
    desc: 'Galería de imágenes con enlace individual y Open Graph dinámico para compartir.',
    orden: 8, // después de SECCIONES_DEFAULT (hero..mapa, orden 1-7)
  },
  // key REAL 'productos' (no 'catalogo'): así se llama tanto en
  // SECCIONES_DEFAULT (src/tienda-publica/tokens.js) como en el editor
  // visual y la vista pública. Antes esta key era 'catalogo', un nombre
  // que nadie más en el proyecto usaba — el editor de "Diseño de página"
  // escribía en secciones.productos, y este archivo (junto con
  // isModuleActive) leía secciones.catalogo: dos keys distintas para el
  // mismo módulo, nunca sincronizadas. El switch de Catálogo no tenía
  // ningún efecto real en el admin/Home global (bug encontrado en
  // producción 2026-08-24). Unificado a un solo nombre en todo el
  // proyecto — moduleId sigue llamándose 'catalogo' en las llamadas a
  // isModuleActive(tienda, 'catalogo') por legibilidad ("el módulo
  // catálogo"), pero la KEY donde vive el dato es 'productos'.
  productos: {
    label: 'Catálogo',
    desc: 'Productos con precio, stock y carrito de compra.',
    orden: 2, // coincide con la sección "productos" de SECCIONES_DEFAULT
  },
  mensajes: {
    label: 'Mensajes',
    desc: 'Chat directo con clientes desde la tienda.',
    orden: 11,
  },
  // Módulos futuros (sin implementar, solo declarados para que el editor
  // pueda previsualizar el roadmap y para que los defaults por rubro no
  // rompan si se activan antes de tener backend propio):
  // alquileres: { label: 'Alquileres', desc: '...', orden: 9 },
  // viajes:     { label: 'Viajes',     desc: '...', orden: 10 },
};

// Qué módulos se pre-activan según el/los rubro(s) de la tienda. Es un
// default de UX al crear la tienda, no una restricción — se guarda en
// tienda.pagina.secciones y desde ahí el dueño lo puede cambiar libremente.
const RUBRO_DEFAULTS = {
  // 'ofertas' (galería tipo LOKAL LINKS): solo ofertas, sin chat — es una
  // vidriera para compartir, no un canal de atención directa.
  ofertas: ['ofertas'],
  // Rubros tipo tienda/emprendimiento: catálogo. El módulo 'mensajes' (chat
  // directo con clientes) queda declarado en MODULES para reutilizarlo en
  // otro rubro más adelante, pero su backend (netlify/functions/messages.js)
  // fue retirado en el recorte de LOKAL LINKS — no se pre-activa hasta que
  // vuelva a tener función propia detrás.
  comida: ['productos'],
  restaurante: ['productos'],
  almacen: ['productos'],
};

// Devuelve el objeto `secciones` inicial para una tienda nueva, en el MISMO
// formato que resolvePagina() espera ({activa, orden, label, desc} por
// sección) — se mergea con SECCIONES_DEFAULT del frontend al leer, así que
// acá solo hace falta declarar los módulos de negocio que se activan.
export function defaultSecciones(rubros = []) {
  const activos = new Set();
  for (const rubro of rubros) {
    (RUBRO_DEFAULTS[rubro] || []).forEach((m) => activos.add(m));
  }

  const secciones = {};
  for (const [id, def] of Object.entries(MODULES)) {
    secciones[id] = { activa: activos.has(id), orden: def.orden, label: def.label, desc: def.desc };
  }
  return secciones;
}

// 'catalogo' sigue aceptándose como alias de 'productos' EN LA LLAMADA
// (isModuleActive(tienda, 'catalogo')) por legibilidad — pero ambos leen
// la MISMA key real ('productos') en tienda.pagina.secciones. No hay dos
// keys de datos distintas, solo dos formas válidas de nombrar el módulo
// al llamar a esta función.
const MODULE_KEY_ALIAS = { catalogo: 'productos' };

// ¿Tiene la tienda el módulo `moduleId` activo? Falla "cerrado" (false) si
// la tienda no tiene pagina/secciones todavía, para que un módulo nunca
// opere sobre una tienda sin configurar explícitamente. Acepta tanto el
// formato nuevo ({activa: bool}) como un booleano suelto legado, por si
// alguna tienda vieja quedó con el formato anterior de este archivo.
export function isModuleActive(tienda, moduleId) {
  const key = MODULE_KEY_ALIAS[moduleId] || moduleId;
  const seccion = tienda?.pagina?.secciones?.[key];
  if (seccion && typeof seccion === 'object') return !!seccion.activa;
  return !!seccion;
}
