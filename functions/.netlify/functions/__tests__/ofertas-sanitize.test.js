// Regresión formal del bug real corregido el 2026-08-16: el catálogo
// (precio/stock/condición/ventaja) se descartaba silenciosamente al
// guardar un producto — sanitizeOfertaInput solo persistía los campos de
// "oferta simple" (nombre/imagen/vigencia). Antes de este archivo, el fix
// solo se había verificado con un script ad-hoc de una sola corrida.
import { describe, expect, it } from 'vitest';
import { sanitizeOfertaInput, generateSlug, esVigente } from '../_lib/ofertas-sanitize.js';

const TIENDA = { id: 'tienda_1' };

describe('sanitizeOfertaInput', () => {
  it('persiste todos los campos de producto (precio, stock, condición, badgesForzados, fotos)', () => {
    const payload = {
      tiendaNombre: 'Verduleria', // campo denormalizado del frontend, no debe romper nada
      titulo: 'Tomate x kg',
      descripcion: 'Tomate fresco',
      fotos: ['https://ejemplo.com/tomate.jpg'],
      precio: 1500,
      precioOriginal: 2000,
      badgesForzados: { agregar: ['nuevo'], ocultar: [] },
      stock: 40,
      condicion: 'nuevo',
      categoryId: 'verduras',
      contactoWhatsapp: '+5493434123456',
      attributes: { color: 'rojo' },
    };

    const result = sanitizeOfertaInput(payload, TIENDA, null);

    expect(result.precio).toBe(1500);
    expect(result.precioOriginal).toBe(2000);
    expect(result.stock).toBe(40);
    expect(result.condicion).toBe('nuevo');
    expect(result.badgesForzados).toEqual({ agregar: ['nuevo'], ocultar: [] });
    expect(result.fotos).toEqual(['https://ejemplo.com/tomate.jpg']);
    expect(result.imageUrl).toBe('https://ejemplo.com/tomate.jpg');
    expect(result.categoryId).toBe('verduras');
    expect(result.attributes).toEqual({ color: 'rojo' });
  });

  it('una oferta simple (sin campos de producto) no gana claves de producto en null', () => {
    const result = sanitizeOfertaInput(
      { nombre: '2x1 en shampoo', imageUrl: 'https://ejemplo.com/oferta.jpg', visible: true },
      TIENDA,
      null,
    );

    expect('precio' in result).toBe(false);
    expect('stock' in result).toBe(false);
    expect('condicion' in result).toBe(false);
  });

  it('filtra ids de badgesForzados que no están en el set válido (evita ids inventados desde el cliente)', () => {
    const result = sanitizeOfertaInput({ nombre: 'Test', badgesForzados: { agregar: ['nuevo', 'HACKEO_XSS'], ocultar: [] } }, TIENDA, null);
    expect(result.badgesForzados.agregar).toEqual(['nuevo']);
  });

  it('condición inválida cae a "nuevo" en vez de guardar el valor recibido', () => {
    const result = sanitizeOfertaInput({ nombre: 'Test', condicion: 'rota' }, TIENDA, null);
    expect(result.condicion).toBe('nuevo');
  });

  it('acepta tanto `nombre` (oferta) como `titulo` (producto) para el mismo campo', () => {
    const porNombre = sanitizeOfertaInput({ nombre: 'Oferta A' }, TIENDA, null);
    const porTitulo = sanitizeOfertaInput({ titulo: 'Producto B' }, TIENDA, null);
    expect(porNombre.nombre).toBe('Oferta A');
    expect(porTitulo.nombre).toBe('Producto B');
  });

  it('PATCH parcial: no reintroduce un campo de producto si el body no lo trae', () => {
    // Simula el patrón real de ofertas.js PATCH: { ...existente, ...body }
    const existente = { id: 'oferta_1', nombre: 'Tomate', precio: 1500, stock: 40 };
    const bodyPatch = { id: 'oferta_1', stock: 35 }; // solo actualiza stock
    const merged = { ...existente, ...bodyPatch };
    const result = sanitizeOfertaInput(merged, TIENDA, 'tomate');
    expect(result.stock).toBe(35);
    expect(result.precio).toBe(1500); // se mantiene porque merged ya lo traía
  });
});

describe('generateSlug', () => {
  it('normaliza acentos y espacios a un slug ascii con guiones', () => {
    expect(generateSlug('Tomate x Kg')).toBe('tomate-x-kg');
    expect(generateSlug('2x1 en Champú')).toBe('2x1-en-champu');
  });

  it('cae a "oferta" si el nombre queda vacío tras sanitizar', () => {
    expect(generateSlug('')).toBe('oferta');
    expect(generateSlug('!!!')).toBe('oferta');
  });
});

describe('esVigente', () => {
  const AHORA = new Date('2026-08-17T12:00:00Z').getTime();

  it('no vigente si visible es false', () => {
    expect(esVigente({ visible: false }, AHORA)).toBe(false);
  });

  it('vigente si no tiene publishAt/expireAt (siempre visible)', () => {
    expect(esVigente({}, AHORA)).toBe(true);
  });

  it('no vigente si expireAt ya pasó', () => {
    expect(esVigente({ expireAt: '2026-08-01T00:00:00Z' }, AHORA)).toBe(false);
  });

  it('no vigente si publishAt es futuro', () => {
    expect(esVigente({ publishAt: '2026-09-01T00:00:00Z' }, AHORA)).toBe(false);
  });
});
