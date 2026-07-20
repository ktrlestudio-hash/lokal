import { handleError, handleOptions, jsonResponse, parseJsonBody } from './_lib/http.js';

const HTTP_OPTIONS = {
  allowHeaders: 'Content-Type, Authorization',
  allowMethods: 'POST, OPTIONS',
};

// Lista plana de categorías para mandar a la IA (solo id + name + parentId)
// Se mantiene acá para no depender del bundle del frontend
// Debe reflejar src/categories.js (CATEGORIES) — comida rápida
const CATEGORY_TREE = [
  { id: 'hamburguesas', name: 'Hamburguesas', parentId: null },
  { id: 'pizzas', name: 'Pizzas', parentId: null },
  { id: 'sandwiches', name: 'Sándwiches / Lomitos', parentId: null },
  { id: 'empanadas', name: 'Empanadas', parentId: null },
  { id: 'tartas', name: 'Tartas', parentId: null },
  { id: 'platos', name: 'Platos / Menú del día', parentId: null },
  { id: 'papas', name: 'Papas fritas y acompañamientos', parentId: null },
  { id: 'ensaladas', name: 'Ensaladas', parentId: null },
  { id: 'postres', name: 'Postres', parentId: null },
  { id: 'bebidas', name: 'Bebidas', parentId: null },
  { id: 'combos', name: 'Combos', parentId: null },
  { id: 'otros', name: 'Otros', parentId: null },
  // Hamburguesas
  { id: 'hamburguesas_clasicas', name: 'Clásicas', parentId: 'hamburguesas' },
  { id: 'hamburguesas_dobles', name: 'Dobles / XL', parentId: 'hamburguesas' },
  { id: 'hamburguesas_veggie', name: 'Veggie', parentId: 'hamburguesas' },
  // Pizzas
  { id: 'pizzas_muzzarella', name: 'Muzzarella', parentId: 'pizzas' },
  { id: 'pizzas_especiales', name: 'Especiales', parentId: 'pizzas' },
  { id: 'pizzas_individuales', name: 'Individuales', parentId: 'pizzas' },
  // Sándwiches / Lomitos
  { id: 'lomitos', name: 'Lomitos', parentId: 'sandwiches' },
  { id: 'sandwiches_frios', name: 'Sándwiches fríos', parentId: 'sandwiches' },
  { id: 'choripan_bondiola', name: 'Choripán / Bondiola', parentId: 'sandwiches' },
  // Empanadas
  { id: 'empanadas_carne', name: 'Carne', parentId: 'empanadas' },
  { id: 'empanadas_jamonqueso', name: 'Jamón y queso', parentId: 'empanadas' },
  { id: 'empanadas_especiales', name: 'Especiales', parentId: 'empanadas' },
  // Tartas
  { id: 'tartas_verdura', name: 'Verdura', parentId: 'tartas' },
  { id: 'tartas_pollo', name: 'Pollo', parentId: 'tartas' },
  { id: 'tartas_dulces', name: 'Dulces', parentId: 'tartas' },
  // Platos / Menú del día
  { id: 'menu_del_dia', name: 'Menú del día', parentId: 'platos' },
  { id: 'milanesas', name: 'Milanesas', parentId: 'platos' },
  { id: 'pastas', name: 'Pastas', parentId: 'platos' },
  // Papas fritas y acompañamientos
  { id: 'papas_fritas', name: 'Papas', parentId: 'papas' },
  { id: 'rabas', name: 'Rabas', parentId: 'papas' },
  { id: 'otros_fritos', name: 'Otros fritos', parentId: 'papas' },
  // Ensaladas
  { id: 'ensaladas_clasicas', name: 'Clásicas', parentId: 'ensaladas' },
  { id: 'ensaladas_polloCarne', name: 'Con pollo/carne', parentId: 'ensaladas' },
  { id: 'ensaladas_veganas', name: 'Veganas', parentId: 'ensaladas' },
  // Postres
  { id: 'helados', name: 'Helados', parentId: 'postres' },
  { id: 'tortas', name: 'Tortas', parentId: 'postres' },
  { id: 'flanes_budines', name: 'Flanes/Budines', parentId: 'postres' },
  // Bebidas
  { id: 'gaseosas', name: 'Gaseosas', parentId: 'bebidas' },
  { id: 'cervezas', name: 'Cervezas', parentId: 'bebidas' },
  { id: 'jugos_aguas', name: 'Jugos/Aguas', parentId: 'bebidas' },
  { id: 'sin_alcohol', name: 'Sin alcohol', parentId: 'bebidas' },
  // Combos
  { id: 'combos_individuales', name: 'Individuales', parentId: 'combos' },
  { id: 'combos_compartir', name: 'Para compartir', parentId: 'combos' },
  { id: 'combos_familiares', name: 'Familiares', parentId: 'combos' },
  // Otros
  { id: 'otros_varios', name: 'Varios', parentId: 'otros' },
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

    const prompt = `Sos un sistema de clasificación de productos de menú para locales de comida rápida (rotiserías, hamburgueserías, pizzerías, sandwicherías) en Argentina.

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
