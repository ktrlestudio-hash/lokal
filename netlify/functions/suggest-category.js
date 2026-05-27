import { handleError, handleOptions, jsonResponse, parseJsonBody } from './_lib/http.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, OPTIONS',
};

// Lista plana de categorías para mandar a la IA (solo id + name + parentId)
// Se mantiene acá para no depender del bundle del frontend
const CATEGORY_TREE = [
  { id: 'electronica', name: 'Electrónica y Tecnología', parentId: null },
  { id: 'electrodomesticos', name: 'Electrodomésticos', parentId: null },
  { id: 'computacion', name: 'Computación', parentId: null },
  { id: 'hogar', name: 'Hogar y Muebles', parentId: null },
  { id: 'construccion', name: 'Construcción y Materiales', parentId: null },
  { id: 'ferreteria', name: 'Ferretería y Herramientas', parentId: null },
  { id: 'ropa', name: 'Ropa y Accesorios', parentId: null },
  { id: 'calzado', name: 'Calzado', parentId: null },
  { id: 'deportes', name: 'Deportes y Fitness', parentId: null },
  { id: 'automotores', name: 'Automotores y Repuestos', parentId: null },
  { id: 'alimentos', name: 'Alimentos y Bebidas', parentId: null },
  { id: 'salud', name: 'Salud y Belleza', parentId: null },
  { id: 'mascotas', name: 'Mascotas', parentId: null },
  { id: 'juguetes', name: 'Juguetes y Hobbies', parentId: null },
  { id: 'libros', name: 'Libros y Revistas', parentId: null },
  { id: 'servicios', name: 'Servicios', parentId: null },
  { id: 'gastronomia', name: 'Gastronomía y Restaurantes', parentId: null },
  { id: 'agro', name: 'Agropecuaria', parentId: null },
  { id: 'educacion', name: 'Educación y Papelería', parentId: null },
  { id: 'otros', name: 'Otros', parentId: null },
  // Electrónica
  { id: 'celulares', name: 'Celulares y Smartphones', parentId: 'electronica' },
  { id: 'tablets', name: 'Tablets', parentId: 'electronica' },
  { id: 'audio', name: 'Audio y Sonido', parentId: 'electronica' },
  { id: 'tv_video', name: 'TV y Video', parentId: 'electronica' },
  { id: 'fotografia', name: 'Fotografía y Video', parentId: 'electronica' },
  { id: 'gaming', name: 'Gaming y Consolas', parentId: 'electronica' },
  { id: 'smartwatches', name: 'Smartwatches y Wearables', parentId: 'electronica' },
  { id: 'accesorios_cel', name: 'Accesorios para celulares', parentId: 'electronica' },
  { id: 'iphone', name: 'iPhone (Apple)', parentId: 'celulares' },
  { id: 'samsung_cel', name: 'Samsung', parentId: 'celulares' },
  { id: 'motorola', name: 'Motorola', parentId: 'celulares' },
  { id: 'xiaomi', name: 'Xiaomi', parentId: 'celulares' },
  { id: 'otros_cel', name: 'Otros celulares', parentId: 'celulares' },
  { id: 'auriculares', name: 'Auriculares', parentId: 'audio' },
  { id: 'parlantes', name: 'Parlantes', parentId: 'audio' },
  { id: 'eq_sonido', name: 'Equipos de sonido', parentId: 'audio' },
  { id: 'micros', name: 'Micrófonos', parentId: 'audio' },
  { id: 'televisores', name: 'Televisores', parentId: 'tv_video' },
  { id: 'proyectores', name: 'Proyectores', parentId: 'tv_video' },
  { id: 'streaming', name: 'Streaming (Chromecast, Fire TV…)', parentId: 'tv_video' },
  { id: 'consolas', name: 'Consolas', parentId: 'gaming' },
  { id: 'juegos_video', name: 'Videojuegos', parentId: 'gaming' },
  { id: 'perifericos', name: 'Periféricos gamer', parentId: 'gaming' },
  // Computación
  { id: 'notebooks', name: 'Notebooks y Laptops', parentId: 'computacion' },
  { id: 'pcs', name: 'PCs de escritorio', parentId: 'computacion' },
  { id: 'monitores', name: 'Monitores', parentId: 'computacion' },
  { id: 'componentes', name: 'Componentes (placas, RAM…)', parentId: 'computacion' },
  { id: 'impresoras', name: 'Impresoras y Scanners', parentId: 'computacion' },
  { id: 'redes', name: 'Redes y Conectividad', parentId: 'computacion' },
  { id: 'acc_pc', name: 'Accesorios PC', parentId: 'computacion' },
  // Electrodomésticos
  { id: 'cocina_electro', name: 'Cocina', parentId: 'electrodomesticos' },
  { id: 'frio', name: 'Frío (heladeras, freezer)', parentId: 'electrodomesticos' },
  { id: 'lavado', name: 'Lavado y Secado', parentId: 'electrodomesticos' },
  { id: 'climatizacion', name: 'Climatización', parentId: 'electrodomesticos' },
  { id: 'aspiradoras', name: 'Aspiradoras y Limpieza', parentId: 'electrodomesticos' },
  // Ferretería
  { id: 'herramientas', name: 'Herramientas', parentId: 'ferreteria' },
  { id: 'electricidad', name: 'Electricidad', parentId: 'ferreteria' },
  { id: 'plomeria', name: 'Plomería', parentId: 'ferreteria' },
  { id: 'pinturas', name: 'Pinturas y Revestimientos', parentId: 'ferreteria' },
  // Ropa
  { id: 'ropa_mujer', name: 'Ropa de mujer', parentId: 'ropa' },
  { id: 'ropa_hombre', name: 'Ropa de hombre', parentId: 'ropa' },
  { id: 'ropa_ninos', name: 'Ropa de niños', parentId: 'ropa' },
  { id: 'lenceria', name: 'Lencería y pijamas', parentId: 'ropa' },
  // Servicios
  { id: 'reparaciones', name: 'Reparaciones y técnicos', parentId: 'servicios' },
  { id: 'profesionales', name: 'Servicios profesionales', parentId: 'servicios' },
  { id: 'hogar_servicios', name: 'Hogar y limpieza', parentId: 'servicios' },
  { id: 'belleza', name: 'Belleza y estética', parentId: 'servicios' },
];

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return handleOptions(event, HTTP_OPTIONS);
  if (event.httpMethod !== 'POST') return jsonResponse(event, 405, { error: 'Method not allowed' });

  try {
    const body = parseJsonBody(event);
    const titulo = (body.titulo || '').trim();
    const descripcion = (body.descripcion || '').trim();
    const attributes = body.attributes || {};

    if (!titulo) return jsonResponse(event, 400, { error: 'titulo requerido' });

    const GROQ_API_KEY = process.env.GROQ_API_KEY;
    if (!GROQ_API_KEY) return jsonResponse(event, 500, { error: 'GROQ_API_KEY no configurada' });

    // Armar lista legible de categorías para el prompt
    const buildTree = (parentId = null, depth = 0) =>
      CATEGORY_TREE
        .filter(c => c.parentId === parentId)
        .map(c => `${'  '.repeat(depth)}- ${c.id}: ${c.name}` + buildTree(c.id, depth + 1))
        .join('\n');

    const treeText = buildTree(null, 0);

    const attrsText = Object.keys(attributes).length > 0
      ? `\nAtributos adicionales: ${Object.entries(attributes).map(([k,v]) => `${k}=${v}`).join(', ')}`
      : '';

    const prompt = `Sos un sistema de clasificación de productos para un marketplace local argentino.

Árbol de categorías disponibles (formato: id: nombre):
${treeText}

Producto a clasificar:
- Título: ${titulo}
- Descripción: ${descripcion}${attrsText}

Respondé ÚNICAMENTE con un objeto JSON con este formato exacto:
{
  "categoryId": "id_de_la_categoria_mas_especifica",
  "confidence": 0.95,
  "path": ["id_raiz", "id_intermedio", "id_hoja"],
  "reason": "breve explicación en español"
}

Reglas:
- Usá el id más específico posible (hoja del árbol, no raíz)
- Si no hay categoría exacta, elegí la más cercana
- confidence entre 0 y 1
- Si la confianza es menor a 0.5, usá "otros" como categoryId`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
        max_tokens: 200,
      }),
    });

    if (!groqRes.ok) {
      const err = await groqRes.text();
      return jsonResponse(event, 502, { error: 'Error Groq', detail: err });
    }

    const groqData = await groqRes.json();
    const content = groqData.choices?.[0]?.message?.content;
    if (!content) return jsonResponse(event, 502, { error: 'Respuesta vacía de Groq' });

    const result = JSON.parse(content);

    const validId = CATEGORY_TREE.find(c => c.id === result.categoryId);
    if (!validId) result.categoryId = 'otros';

    return jsonResponse(event, 200, result);
  } catch (err) {
    return handleError(event, err);
  }
};
