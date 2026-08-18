import { describe, it, expect } from 'vitest';
import { aplicarDiff } from '../_lib/importador/aplicar-diff.js';

const tienda = { id: 't1' };

describe('aplicarDiff', () => {
  it('da de alta productos nuevos con los campos sanitizados', () => {
    const { ofertas } = aplicarDiff({
      ofertas: [], tienda, tiendaId: 't1',
      altas: [{ nombre: 'Producto Nuevo', precio: 1000, stock: 5 }],
      actualizaciones: [], bajas: [],
    });
    expect(ofertas).toHaveLength(1);
    expect(ofertas[0].nombre).toBe('Producto Nuevo');
    expect(ofertas[0].precio).toBe(1000);
    expect(ofertas[0].tiendaId).toBe('t1');
    expect(ofertas[0].id).toMatch(/^oferta_/);
  });

  it('actualiza solo los campos indicados en cambios, sin perder los demás', () => {
    const existentes = [{ id: 'p1', tiendaId: 't1', nombre: 'Zapatilla', precio: 45000, stock: 10, slug: 'zapatilla' }];
    const { ofertas, actualizados } = aplicarDiff({
      ofertas: existentes, tienda, tiendaId: 't1',
      altas: [], actualizaciones: [{ productoId: 'p1', cambios: { precio: 50000 } }],
      bajas: [],
    });
    expect(actualizados).toBe(1);
    expect(ofertas[0].precio).toBe(50000);
    expect(ofertas[0].nombre).toBe('Zapatilla');
    expect(ofertas[0].stock).toBe(10);
  });

  it('ignora actualizaciones con productoId inexistente sin tirar error', () => {
    const { ofertas, actualizados } = aplicarDiff({
      ofertas: [{ id: 'p1', tiendaId: 't1', nombre: 'x', precio: 100, slug: 'x' }], tienda, tiendaId: 't1',
      altas: [], actualizaciones: [{ productoId: 'no-existe', cambios: { precio: 200 } }],
      bajas: [],
    });
    expect(actualizados).toBe(0);
    expect(ofertas[0].precio).toBe(100);
  });

  it('marca bajas como visible:false sin borrar el producto', () => {
    const existentes = [{ id: 'p1', tiendaId: 't1', nombre: 'x', precio: 100, visible: true, slug: 'x' }];
    const { ofertas, bajasAplicadas } = aplicarDiff({
      ofertas: existentes, tienda, tiendaId: 't1',
      altas: [], actualizaciones: [], bajas: ['p1'],
    });
    expect(bajasAplicadas).toBe(1);
    expect(ofertas).toHaveLength(1);
    expect(ofertas[0].visible).toBe(false);
  });

  it('no toca productos de otra tienda aunque el id coincida', () => {
    const existentes = [{ id: 'p1', tiendaId: 'otra-tienda', nombre: 'x', precio: 100, slug: 'x' }];
    const { ofertas, actualizados } = aplicarDiff({
      ofertas: existentes, tienda, tiendaId: 't1',
      altas: [], actualizaciones: [{ productoId: 'p1', cambios: { precio: 999 } }],
      bajas: [],
    });
    expect(actualizados).toBe(0);
    expect(ofertas[0].precio).toBe(100);
  });
});
