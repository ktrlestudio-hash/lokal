// isModuleActive es el único gate de autorización antes de que un módulo
// de negocio (ofertas.js, carrito.js) opere sobre una tienda — falla
// "cerrado" (false) a propósito si la config falta o viene mal formada.
// Cualquier regresión acá abriría o cerraría un módulo sin que el dueño lo
// haya pedido.
//
// 'catalogo' se testea contra la key REAL 'productos' (no 'catalogo') —
// SECCIONES_DEFAULT (src/tienda-publica/tokens.js) siempre usó 'productos'
// para lo que la UI llama "Catálogo"; el editor visual y la vista pública
// leen/escriben esa key. isModuleActive('catalogo') tiene un alias interno
// que mapea a 'productos' (ver MODULE_KEY_ALIAS en modules.js) — antes de
// ese alias, el switch de "Diseño de página" no tenía ningún efecto acá
// (bug real reportado en producción: Catálogo activo en el editor, pero el
// admin/Home global seguían tratándolo como inactivo).
import { describe, expect, it } from 'vitest';
import { isModuleActive } from '../_lib/modules.js';

describe('isModuleActive', () => {
  it('true cuando la sección existe y activa es true', () => {
    const tienda = { pagina: { secciones: { productos: { activa: true } } } };
    expect(isModuleActive(tienda, 'catalogo')).toBe(true);
  });

  it('false cuando la sección existe pero activa es false', () => {
    const tienda = { pagina: { secciones: { productos: { activa: false } } } };
    expect(isModuleActive(tienda, 'catalogo')).toBe(false);
  });

  it('falla cerrado (false) si la tienda no tiene pagina/secciones configurado', () => {
    expect(isModuleActive({}, 'catalogo')).toBe(false);
    expect(isModuleActive(null, 'catalogo')).toBe(false);
    expect(isModuleActive(undefined, 'catalogo')).toBe(false);
  });

  it('falla cerrado si el módulo pedido no está declarado para esa tienda', () => {
    const tienda = { pagina: { secciones: { ofertas: { activa: true } } } };
    expect(isModuleActive(tienda, 'catalogo')).toBe(false);
  });

  it('acepta el formato legado (booleano suelto) por compatibilidad con tiendas viejas', () => {
    const tienda = { pagina: { secciones: { productos: true } } };
    expect(isModuleActive(tienda, 'catalogo')).toBe(true);
  });

  it('catalogo lee la key productos, no una key "catalogo" literal', () => {
    // Regresión del bug real: una tienda con secciones.catalogo activo (la
    // key vieja, incorrecta) NO debe activar el módulo — solo productos
    // (la key real) lo hace.
    const tienda = { pagina: { secciones: { catalogo: { activa: true } } } };
    expect(isModuleActive(tienda, 'catalogo')).toBe(false);
  });

  it('ofertas sigue leyendo su propia key sin alias', () => {
    const tienda = { pagina: { secciones: { ofertas: { activa: true } } } };
    expect(isModuleActive(tienda, 'ofertas')).toBe(true);
  });
});
