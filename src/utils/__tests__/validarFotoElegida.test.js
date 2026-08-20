import { describe, it, expect } from 'vitest';
import { validarFotoElegida } from '../validarFotoElegida.js';

function fakeFile({ name = 'foto.jpg', type = 'image/jpeg', size = 1024 } = {}) {
  const blob = new Blob([new Uint8Array(size)], { type });
  return new File([blob], name, { type });
}

describe('validarFotoElegida', () => {
  it('acepta un JPEG normal', () => {
    expect(validarFotoElegida(fakeFile())).toBeNull();
  });

  it('acepta PNG/WEBP', () => {
    expect(validarFotoElegida(fakeFile({ name: 'a.png', type: 'image/png' }))).toBeNull();
    expect(validarFotoElegida(fakeFile({ name: 'a.webp', type: 'image/webp' }))).toBeNull();
  });

  it('rechaza HEIC por type MIME', () => {
    const r = validarFotoElegida(fakeFile({ name: 'IMG_1234.HEIC', type: 'image/heic' }));
    expect(r).toMatch(/HEIC/);
  });

  it('rechaza HEIC detectado solo por extensión (type MIME vacío, caso real de varios navegadores)', () => {
    const r = validarFotoElegida(fakeFile({ name: 'IMG_1234.heic', type: '' }));
    expect(r).toMatch(/HEIC/);
  });

  it('rechaza HEIF igual que HEIC', () => {
    const r = validarFotoElegida(fakeFile({ name: 'foto.heif', type: 'image/heif' }));
    expect(r).toMatch(/HEIC/);
  });

  it('rechaza un archivo que no es imagen', () => {
    const r = validarFotoElegida(fakeFile({ name: 'documento.pdf', type: 'application/pdf' }));
    expect(r).toMatch(/no es una imagen/);
  });

  it('rechaza un archivo absurdamente pesado (>100MB)', () => {
    const r = validarFotoElegida(fakeFile({ size: 101 * 1024 * 1024 }));
    expect(r).toMatch(/pesa/);
  });

  it('acepta un archivo grande pero por debajo del techo (compresión lo resuelve después)', () => {
    expect(validarFotoElegida(fakeFile({ size: 15 * 1024 * 1024 }))).toBeNull();
  });
});
