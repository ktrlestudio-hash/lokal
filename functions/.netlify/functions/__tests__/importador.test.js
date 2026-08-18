import { describe, it, expect } from 'vitest';
import { extraerCSV, extraerJSON, extraerTextoPlano, ExtractorError } from '../_lib/importador/extractores.js';
import { calcularHuella, similitudEncabezados } from '../_lib/importador/huella.js';
import { clasificarColumnas } from '../_lib/importador/clasificador.js';

describe('extraerCSV', () => {
  it('parsea CSV con coma', () => {
    const { headers, rows } = extraerCSV('Producto,Precio\nZapatilla,45000\nRemera,8500');
    expect(headers).toEqual(['Producto', 'Precio']);
    expect(rows).toEqual([['Zapatilla', '45000'], ['Remera', '8500']]);
  });

  it('detecta separador ; cuando el archivo lo usa', () => {
    const { headers, rows } = extraerCSV('Producto;Precio\nZapatilla;45000');
    expect(headers).toEqual(['Producto', 'Precio']);
    expect(rows).toEqual([['Zapatilla', '45000']]);
  });

  it('tira ExtractorError si solo hay encabezado sin filas', () => {
    expect(() => extraerCSV('Producto,Precio')).toThrow(ExtractorError);
  });
});

describe('extraerJSON', () => {
  it('parsea un array de objetos', () => {
    const { headers, rows } = extraerJSON(JSON.stringify([
      { producto: 'Zapatilla', precio: 45000 },
      { producto: 'Remera', precio: 8500 },
    ]));
    expect(headers).toEqual(['producto', 'precio']);
    expect(rows).toEqual([['Zapatilla', '45000'], ['Remera', '8500']]);
  });

  it('encuentra el array bajo una clave común (items/data/productos)', () => {
    const { rows } = extraerJSON(JSON.stringify({ productos: [{ producto: 'Zapatilla', precio: 45000 }] }));
    expect(rows).toEqual([['Zapatilla', '45000']]);
  });

  it('une las claves de todos los objetos aunque alguno tenga campos faltantes', () => {
    const { headers, rows } = extraerJSON(JSON.stringify([
      { producto: 'Zapatilla', precio: 45000, marca: 'Nike' },
      { producto: 'Remera', precio: 8500 },
    ]));
    expect(headers).toContain('marca');
    expect(rows[1][headers.indexOf('marca')]).toBe('');
  });

  it('tira ExtractorError con JSON inválido', () => {
    expect(() => extraerJSON('{esto no es json')).toThrow(ExtractorError);
  });
});

describe('extraerTextoPlano', () => {
  it('detecta delimitador de tab', () => {
    const { rows } = extraerTextoPlano('Zapatilla\t45000\nRemera\t8500');
    expect(rows).toEqual([['Zapatilla', '45000'], ['Remera', '8500']]);
  });

  it('genera headers genéricos cuando no hay encabezado real', () => {
    const { headers } = extraerTextoPlano('Zapatilla - 45000');
    expect(headers).toEqual(['columna_1', 'columna_2']);
  });
});

describe('calcularHuella', () => {
  it('da la misma huella sin importar el orden de las columnas', () => {
    const a = calcularHuella(['Producto', 'Precio', 'Marca']);
    const b = calcularHuella(['Marca', 'Producto', 'Precio']);
    expect(a).toBe(b);
  });

  it('da la misma huella ignorando tildes/mayúsculas', () => {
    const a = calcularHuella(['Código', 'Descripción']);
    const b = calcularHuella(['codigo', 'descripcion']);
    expect(a).toBe(b);
  });

  it('da huellas distintas para estructuras distintas', () => {
    const a = calcularHuella(['Producto', 'Precio']);
    const b = calcularHuella(['Producto', 'Precio', 'Stock']);
    expect(a).not.toBe(b);
  });
});

describe('similitudEncabezados', () => {
  it('da 1 para encabezados idénticos', () => {
    expect(similitudEncabezados(['a', 'b'], ['a', 'b'])).toBe(1);
  });

  it('da un valor intermedio cuando comparten la mayoría pero no todo', () => {
    const sim = similitudEncabezados(['producto', 'precio', 'stock'], ['producto', 'precio']);
    expect(sim).toBeGreaterThan(0.5);
    expect(sim).toBeLessThan(1);
  });
});

describe('clasificarColumnas', () => {
  it('detecta nombre/precio por sinónimo exacto de encabezado', () => {
    const { sugerencias, necesitaRevision } = clasificarColumnas({
      headers: ['Producto', 'Precio'],
      rows: [['Zapatilla', '45000'], ['Remera', '8500']],
    });
    expect(sugerencias.find((s) => s.header === 'Producto').campo).toBe('nombre');
    expect(sugerencias.find((s) => s.header === 'Precio').campo).toBe('precio');
    expect(necesitaRevision).toBe(false);
  });

  it('detecta código de barra por longitud numérica típica cuando el encabezado no está en el diccionario', () => {
    const { sugerencias } = clasificarColumnas({
      headers: ['Item', 'Identificador Externo'],
      rows: [['Zapatilla', '7791234567890'], ['Remera', '7799876543210']],
    });
    const col = sugerencias.find((s) => s.header === 'Identificador Externo');
    expect(col.campo).toBe('codigoBarra');
  });

  it('marca necesitaRevision cuando hay columnas sin clasificar', () => {
    const { necesitaRevision } = clasificarColumnas({
      headers: ['Columna Rara', 'Otra Mas'],
      rows: [['x', 'y']],
    });
    expect(necesitaRevision).toBe(true);
  });

  it('baja la confianza cuando dos columnas colisionan en el mismo campo', () => {
    const { sugerencias } = clasificarColumnas({
      headers: ['Precio', 'PVP'],
      rows: [['45000', '46000']],
    });
    const conColision = sugerencias.filter((s) => s.campo === 'precio');
    expect(conColision.length).toBe(2);
    expect(conColision.some((s) => s.colision)).toBe(true);
  });
});
