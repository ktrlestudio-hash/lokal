// isModuleActive es el único gate de autorización antes de que un módulo
// de negocio (ofertas.js, carrito.js) opere sobre una tienda — falla
// "cerrado" (false) a propósito si la config falta o viene mal formada.
// Cualquier regresión acá abriría o cerraría un módulo sin que el dueño lo
// haya pedido.
import { describe, expect, it } from 'vitest';
import { isModuleActive } from '../_lib/modules.js';

describe('isModuleActive', () => {
  it('true cuando la sección existe y activa es true', () => {
    const tienda = { pagina: { secciones: { catalogo: { activa: true } } } };
    expect(isModuleActive(tienda, 'catalogo')).toBe(true);
  });

  it('false cuando la sección existe pero activa es false', () => {
    const tienda = { pagina: { secciones: { catalogo: { activa: false } } } };
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
    const tienda = { pagina: { secciones: { catalogo: true } } };
    expect(isModuleActive(tienda, 'catalogo')).toBe(true);
  });
});
