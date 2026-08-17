// Reemplaza al sistema manual VENTAJA_OPTS ("Mejor precio"/"Financiación")
// por badges derivados del estado real del producto — ver productBadges.js
// para el porqué. Estos tests fijan el contrato de calcularBadges().
import { describe, expect, it } from 'vitest';
import { calcularBadges } from '../productBadges.js';

const AHORA = new Date('2026-08-17T12:00:00Z').getTime();
const diasAtras = (n) => new Date(AHORA - n * 86400000).toISOString();
const diasAdelante = (n) => new Date(AHORA + n * 86400000).toISOString();

describe('calcularBadges', () => {
  it('sin ninguna señal, no hay badges', () => {
    expect(calcularBadges({}, AHORA)).toEqual([]);
  });

  it('"nuevo" si se publicó hace 3 días (dentro de la ventana de 7)', () => {
    expect(calcularBadges({ publishAt: diasAtras(3) }, AHORA)).toContain('nuevo');
  });

  it('sin "nuevo" si se publicó hace 10 días (fuera de la ventana)', () => {
    expect(calcularBadges({ publishAt: diasAtras(10) }, AHORA)).not.toContain('nuevo');
  });

  it('usa createdAt como fallback si no hay publishAt', () => {
    expect(calcularBadges({ createdAt: diasAtras(1) }, AHORA)).toContain('nuevo');
  });

  it('"oferta" si precioOriginal es mayor al precio actual', () => {
    expect(calcularBadges({ precio: 1000, precioOriginal: 1500 }, AHORA)).toContain('oferta');
  });

  it('sin "oferta" si precioOriginal es igual o menor al precio (no hay descuento real)', () => {
    expect(calcularBadges({ precio: 1000, precioOriginal: 1000 }, AHORA)).not.toContain('oferta');
    expect(calcularBadges({ precio: 1000, precioOriginal: 800 }, AHORA)).not.toContain('oferta');
    expect(calcularBadges({ precio: 1000 }, AHORA)).not.toContain('oferta');
  });

  it('"por_vencer" si expira dentro de los próximos 3 días', () => {
    expect(calcularBadges({ expireAt: diasAdelante(2) }, AHORA)).toContain('por_vencer');
  });

  it('sin "por_vencer" si expira en más de 3 días, o ya venció', () => {
    expect(calcularBadges({ expireAt: diasAdelante(10) }, AHORA)).not.toContain('por_vencer');
    expect(calcularBadges({ expireAt: diasAtras(1) }, AHORA)).not.toContain('por_vencer');
  });

  it('un producto puede tener varios badges a la vez', () => {
    const badges = calcularBadges({
      publishAt: diasAtras(1),
      precio: 900,
      precioOriginal: 1200,
      expireAt: diasAdelante(1),
    }, AHORA);
    expect(badges).toEqual(expect.arrayContaining(['nuevo', 'oferta', 'por_vencer']));
    expect(badges).toHaveLength(3);
  });

  it('override manual: agregar fuerza un badge que no se cumpliría solo', () => {
    const badges = calcularBadges({ badgesForzados: { agregar: ['nuevo'] } }, AHORA);
    expect(badges).toContain('nuevo');
  });

  it('override manual: ocultar suprime un badge que sí se cumpliría', () => {
    const badges = calcularBadges({
      precio: 900, precioOriginal: 1200,
      badgesForzados: { ocultar: ['oferta'] },
    }, AHORA);
    expect(badges).not.toContain('oferta');
  });

  it('override manual con un id inexistente no rompe ni agrega nada raro', () => {
    const badges = calcularBadges({ badgesForzados: { agregar: ['inventado'] } }, AHORA);
    expect(badges).toEqual([]);
  });
});
