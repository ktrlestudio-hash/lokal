/**
 * Datos de ejemplo para la preview del editor.
 * Se fusionan con los datos reales de la tienda — los datos reales tienen prioridad.
 * Solo se usan cuando un campo está vacío/undefined.
 */
export const MOCK_TIENDA = {
  nombre: 'Mi Tienda',
  tagline: 'El mejor lugar del barrio',
  descripcion: 'Somos un comercio local con años de experiencia. Ofrecemos productos de calidad con atención personalizada.',
  logo: null,
  foto: null,
  whatsapp: '3497000000',
  instagram: 'mitienda.lokal',
  telefono: '3497 000000',
  direccion: 'Calle Principal 123, Bovril',
  horarios: {
    lunes:    '09:00-18:00',
    martes:   '09:00-18:00',
    miercoles:'09:00-18:00',
    jueves:   '09:00-18:00',
    viernes:  '09:00-20:00',
    sabado:   '09:00-14:00',
    domingo:  null,
  },
};

export const MOCK_PRODUCTOS = [
  { id: 'm1', nombre: 'Producto Estrella', precio: 4500, descripcion: 'El más vendido de la temporada', foto: null, activo: true },
  { id: 'm2', nombre: 'Combo Especial',    precio: 8900, descripcion: 'Dos por el precio de uno y medio', foto: null, activo: true },
  { id: 'm3', nombre: 'Novedad',           precio: 2200, descripcion: 'Recién llegado al local',          foto: null, activo: true },
  { id: 'm4', nombre: 'Clásico de siempre',precio: 1500, descripcion: 'Nunca falla',                      foto: null, activo: true },
];

/**
 * Mezcla la tienda real con mock: los campos reales tienen prioridad.
 * Si la tienda no tiene productos, usa los mock.
 */
export function buildPreviewTienda(tienda, productos = []) {
  const merged = { ...MOCK_TIENDA };

  // Sobreescribir con datos reales si existen
  for (const key of Object.keys(MOCK_TIENDA)) {
    const v = tienda?.[key];
    if (v != null && v !== '' && !(Array.isArray(v) && v.length === 0)) {
      merged[key] = v;
    }
  }

  // Copiar campos extra de la tienda que no están en mock
  if (tienda) {
    for (const key of Object.keys(tienda)) {
      if (!(key in merged)) merged[key] = tienda[key];
    }
  }

  // Productos: usar los reales si hay, si no los mock
  const productosActivos = productos.filter(p => p.activo !== false);
  merged._productos = productosActivos.length > 0 ? productosActivos : MOCK_PRODUCTOS;
  merged._isMock = productosActivos.length === 0;

  return merged;
}
