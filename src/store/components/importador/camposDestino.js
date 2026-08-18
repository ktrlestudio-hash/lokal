// camposDestino.js — vocabulario humano de los campos que el clasificador
// del backend puede sugerir (CAMPOS_DESTINO en
// functions/.netlify/functions/_lib/importador/clasificador.js). Vive acá
// separado del componente porque tanto el paso de calibración como el
// resumen final necesitan traducir el mismo id a texto.
export const CAMPOS_DESTINO_INFO = {
  nombre: { label: 'Nombre del producto', obligatorio: true },
  precio: { label: 'Precio', obligatorio: true },
  precioOriginal: { label: 'Precio anterior (para descuento)', obligatorio: false },
  stock: { label: 'Stock', obligatorio: false },
  descripcion: { label: 'Descripción', obligatorio: false },
  marca: { label: 'Marca', obligatorio: false },
  presentacion: { label: 'Presentación (kg, cc, unidad...)', obligatorio: false },
  codigoBarra: { label: 'Código de barra', obligatorio: false },
  skuProveedor: { label: 'Código / SKU del proveedor', obligatorio: false },
  ignorar: { label: 'No importar esta columna', obligatorio: false },
};

export const OPCIONES_CAMPO = Object.entries(CAMPOS_DESTINO_INFO).map(([value, info]) => ({ value, ...info }));

export function labelCampo(campo) {
  return CAMPOS_DESTINO_INFO[campo]?.label || campo;
}
