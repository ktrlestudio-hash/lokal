import { describe, it, expect } from 'vitest';
import { matchearFilas } from '../_lib/importador/matcher.js';
import { construirDiff } from '../_lib/importador/diff.js';

// D1 fake — solo implementa lo que buscarMatch() de calibraciones-store.js
// necesita (prepare().bind().first()). Sin registros = nunca hay match
// confirmado previo, así que los tests ejercitan las otras 3 señales.
function dbFake(registros = []) {
  return {
    prepare() {
      return {
        bind(...args) {
          return {
            async first() {
              const [tiendaId, huellaFuente, señalTipo, señalValor] = args;
              const row = registros.find((r) =>
                r.tiendaId === tiendaId && r.huellaFuente === huellaFuente &&
                r.señalTipo === señalTipo && r.señalValor === señalValor);
              return row ? { producto_id: row.productoId } : null;
            },
          };
        },
      };
    },
  };
}

const productos = [
  { id: 'p1', nombre: 'Zapatilla Running Nike', precio: 45000, stock: 10, codigoBarra: '7791234567890' },
  { id: 'p2', nombre: 'Remera Básica Algodón', precio: 8500, stock: 5, skuProveedor: 'REM-001' },
];

describe('matchearFilas', () => {
  it('matchea por código de barra exacto (señal más fuerte)', async () => {
    const [r] = await matchearFilas(dbFake(), {
      tiendaId: 't1', huella: 'h1', productos,
      filasMapeadas: [{ nombre: 'Zapatilla diferente', codigoBarra: '7791234567890' }],
    });
    expect(r.productoId).toBe('p1');
    expect(r.señal).toBe('codigoBarra');
    expect(r.confianza).toBe('alta');
  });

  it('matchea por match confirmado previo cuando no hay código de barra en la fila', async () => {
    const db = dbFake([{ tiendaId: 't1', huellaFuente: 'h1', señalTipo: 'skuProveedor', señalValor: 'PROV-XYZ', productoId: 'p2' }]);
    const [r] = await matchearFilas(db, {
      tiendaId: 't1', huella: 'h1', productos,
      filasMapeadas: [{ nombre: 'algo', skuProveedor: 'PROV-XYZ' }],
    });
    expect(r.productoId).toBe('p2');
    expect(r.señal).toBe('confirmado_previo:skuProveedor');
  });

  it('matchea por sku exacto del producto', async () => {
    const [r] = await matchearFilas(dbFake(), {
      tiendaId: 't1', huella: 'h1', productos,
      filasMapeadas: [{ nombre: 'algo', skuProveedor: 'REM-001' }],
    });
    expect(r.productoId).toBe('p2');
    expect(r.señal).toBe('skuProveedor');
  });

  it('matchea por nombre exacto normalizado', async () => {
    const [r] = await matchearFilas(dbFake(), {
      tiendaId: 't1', huella: 'h1', productos,
      filasMapeadas: [{ nombre: 'zapatilla running nike' }],
    });
    expect(r.productoId).toBe('p1');
    expect(r.señal).toBe('nombre_exacto');
  });

  it('matchea por fuzzy cuando el nombre está cerca pero no es exacto', async () => {
    const [r] = await matchearFilas(dbFake(), {
      tiendaId: 't1', huella: 'h1', productos,
      filasMapeadas: [{ nombre: 'Zapatilla Runing Nike' }],
    });
    expect(r.productoId).toBe('p1');
    expect(r.señal).toBe('nombre_fuzzy');
    expect(r.confianza).toBe('media');
  });

  it('no matchea (alta nueva) cuando el nombre es completamente distinto', async () => {
    const [r] = await matchearFilas(dbFake(), {
      tiendaId: 't1', huella: 'h1', productos,
      filasMapeadas: [{ nombre: 'Mochila Escolar Grande' }],
    });
    expect(r.productoId).toBeNull();
    expect(r.confianza).toBe('ninguna');
  });
});

describe('construirDiff', () => {
  it('arma alta cuando no hay match', () => {
    const resultados = [{ fila: { nombre: 'Producto Nuevo', precio: '1000' }, productoId: null, señal: null, confianza: 'ninguna' }];
    const { altas } = construirDiff({ resultados, productos });
    expect(altas).toHaveLength(1);
    expect(altas[0].nombre).toBe('Producto Nuevo');
    expect(altas[0].precio).toBe(1000);
  });

  it('arma actualización solo si el precio realmente cambió', () => {
    const resultados = [{ fila: { nombre: 'x', precio: '45000' }, productoId: 'p1', señal: 'codigoBarra', confianza: 'alta' }];
    const { actualizaciones } = construirDiff({ resultados, productos });
    expect(actualizaciones).toHaveLength(0);
  });

  it('detecta cambio de precio', () => {
    const resultados = [{ fila: { nombre: 'x', precio: '50000' }, productoId: 'p1', señal: 'codigoBarra', confianza: 'alta' }];
    const { actualizaciones } = construirDiff({ resultados, productos });
    expect(actualizaciones).toHaveLength(1);
    expect(actualizaciones[0].cambios.precio).toBe(50000);
  });

  it('manda a ambiguos los matches de confianza media', () => {
    const resultados = [{ fila: { nombre: 'x' }, productoId: 'p1', señal: 'nombre_fuzzy', confianza: 'media', score: 0.85 }];
    const { ambiguos, actualizaciones } = construirDiff({ resultados, productos });
    expect(ambiguos).toHaveLength(1);
    expect(actualizaciones).toHaveLength(0);
  });

  it('detecta posibles bajas solo entre productos con señal fuerte (código/sku)', () => {
    const resultados = [{ fila: { nombre: 'x', precio: '45000' }, productoId: 'p1', señal: 'codigoBarra', confianza: 'alta' }];
    const { posiblesBajas } = construirDiff({ resultados, productos });
    expect(posiblesBajas).toHaveLength(1);
    expect(posiblesBajas[0].id).toBe('p2');
  });
});
