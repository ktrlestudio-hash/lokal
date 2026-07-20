// src/data/taxonomy.js
// Biblioteca semántica de LOKAL — comida rápida
// Matching híbrido: keywords locales + contexto IA
// Los ids deben coincidir con src/categories.js (CATEGORIES)

export const TAXONOMY = [
  // =========================================================
  // HAMBURGUESAS
  // =========================================================
  {
    id: 'hamburguesas',
    parentId: null,
    keywords: ['hamburguesa', 'hamburguesas', 'burger', 'burgers', 'hamburgueseria'],
    aliases: ['burger', 'hamburguesas caseras'],
    brands: [],
    related: ['hamburguesas_clasicas', 'hamburguesas_dobles', 'hamburguesas_veggie', 'combos'],
    intent: 'product',
    typical_attributes: ['tamaño', 'guarnicion', 'precio'],
  },
  {
    id: 'hamburguesas_clasicas',
    parentId: 'hamburguesas',
    keywords: ['hamburguesa clasica', 'hamburguesa simple', 'cheeseburger', 'hamburguesa completa'],
    aliases: ['clasica', 'simple'],
    brands: [],
    related: ['hamburguesas'],
    intent: 'product',
    typical_attributes: ['con queso', 'con panceta'],
  },
  {
    id: 'hamburguesas_dobles',
    parentId: 'hamburguesas',
    keywords: ['hamburguesa doble', 'doble carne', 'triple', 'xl', 'hamburguesa grande'],
    aliases: ['doble', 'xl'],
    brands: [],
    related: ['hamburguesas'],
    intent: 'product',
    typical_attributes: ['cantidad de carne'],
  },
  {
    id: 'hamburguesas_veggie',
    parentId: 'hamburguesas',
    keywords: ['hamburguesa veggie', 'hamburguesa vegetariana', 'hamburguesa vegana', 'burger vegetal'],
    aliases: ['veggie', 'vegetariana', 'vegana'],
    brands: [],
    related: ['hamburguesas', 'ensaladas_veganas'],
    intent: 'product',
    typical_attributes: ['sin carne'],
  },

  // =========================================================
  // PIZZAS
  // =========================================================
  {
    id: 'pizzas',
    parentId: null,
    keywords: ['pizza', 'pizzas', 'pizzeria', 'pizza al molde', 'pizza a la piedra'],
    aliases: ['pizza'],
    brands: [],
    related: ['pizzas_muzzarella', 'pizzas_especiales', 'pizzas_individuales', 'combos'],
    intent: 'product',
    typical_attributes: ['tamaño', 'masa'],
  },
  {
    id: 'pizzas_muzzarella',
    parentId: 'pizzas',
    keywords: ['muzzarella', 'mozzarella', 'pizza muzza', 'pizza de queso'],
    aliases: ['muzza'],
    brands: [],
    related: ['pizzas'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'pizzas_especiales',
    parentId: 'pizzas',
    keywords: ['pizza especial', 'pizza napolitana', 'pizza fugazzeta', 'pizza jamon y morrones', 'pizza cuatro quesos', 'pizza calabresa'],
    aliases: ['especial', 'napolitana', 'fugazzeta'],
    brands: [],
    related: ['pizzas'],
    intent: 'product',
    typical_attributes: ['ingredientes'],
  },
  {
    id: 'pizzas_individuales',
    parentId: 'pizzas',
    keywords: ['pizza individual', 'pizzeta', 'pizza chica', 'pizza personal'],
    aliases: ['individual', 'pizzeta'],
    brands: [],
    related: ['pizzas'],
    intent: 'product',
    typical_attributes: [],
  },

  // =========================================================
  // SÁNDWICHES / LOMITOS
  // =========================================================
  {
    id: 'sandwiches',
    parentId: null,
    keywords: ['sandwich', 'sandwiches', 'sanguche', 'lomito', 'sandwicheria'],
    aliases: ['sanguche', 'sandwich'],
    brands: [],
    related: ['lomitos', 'sandwiches_frios', 'choripan_bondiola'],
    intent: 'product',
    typical_attributes: ['pan', 'relleno'],
  },
  {
    id: 'lomitos',
    parentId: 'sandwiches',
    keywords: ['lomito', 'lomitos', 'lomito completo', 'lomito arabe'],
    aliases: ['lomito'],
    brands: [],
    related: ['sandwiches'],
    intent: 'product',
    typical_attributes: ['completo'],
  },
  {
    id: 'sandwiches_frios',
    parentId: 'sandwiches',
    keywords: ['sandwich frio', 'sandwich de miga', 'sandwich triple', 'sandwich club', 'tostado'],
    aliases: ['miga', 'triple', 'club'],
    brands: [],
    related: ['sandwiches'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'choripan_bondiola',
    parentId: 'sandwiches',
    keywords: ['choripan', 'choripán', 'bondiola', 'chori', 'pancho', 'sandwich de bondiola', 'sandwich de chorizo'],
    aliases: ['chori', 'pancho'],
    brands: [],
    related: ['sandwiches'],
    intent: 'product',
    typical_attributes: [],
  },

  // =========================================================
  // EMPANADAS
  // =========================================================
  {
    id: 'empanadas',
    parentId: null,
    keywords: ['empanada', 'empanadas', 'empanaderia', 'docena de empanadas'],
    aliases: ['empanada'],
    brands: [],
    related: ['empanadas_carne', 'empanadas_jamonqueso', 'empanadas_especiales'],
    intent: 'product',
    typical_attributes: ['tipo de masa', 'cantidad'],
  },
  {
    id: 'empanadas_carne',
    parentId: 'empanadas',
    keywords: ['empanada de carne', 'empanada criolla', 'empanada de carne cortada a cuchillo'],
    aliases: ['carne'],
    brands: [],
    related: ['empanadas'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'empanadas_jamonqueso',
    parentId: 'empanadas',
    keywords: ['empanada de jamon y queso', 'empanada jamon queso'],
    aliases: ['jamon y queso'],
    brands: [],
    related: ['empanadas'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'empanadas_especiales',
    parentId: 'empanadas',
    keywords: ['empanada de pollo', 'empanada arabe', 'empanada caprese', 'empanada de verdura', 'empanada especial', 'empanada de humita'],
    aliases: ['especial'],
    brands: [],
    related: ['empanadas'],
    intent: 'product',
    typical_attributes: [],
  },

  // =========================================================
  // TARTAS
  // =========================================================
  {
    id: 'tartas',
    parentId: null,
    keywords: ['tarta', 'tartas', 'tarta casera', 'porcion de tarta'],
    aliases: ['tarta'],
    brands: [],
    related: ['tartas_verdura', 'tartas_pollo', 'tartas_dulces'],
    intent: 'product',
    typical_attributes: ['relleno'],
  },
  {
    id: 'tartas_verdura',
    parentId: 'tartas',
    keywords: ['tarta de verdura', 'tarta de acelga', 'tarta de espinaca', 'tarta de zapallito'],
    aliases: ['verdura'],
    brands: [],
    related: ['tartas'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'tartas_pollo',
    parentId: 'tartas',
    keywords: ['tarta de pollo', 'tarta de jamon y queso', 'tarta de atun'],
    aliases: ['pollo'],
    brands: [],
    related: ['tartas'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'tartas_dulces',
    parentId: 'tartas',
    keywords: ['tarta dulce', 'tarta de manzana', 'tarta de ricota', 'tarta de frutilla'],
    aliases: ['dulce'],
    brands: [],
    related: ['tartas', 'postres'],
    intent: 'product',
    typical_attributes: [],
  },

  // =========================================================
  // PLATOS / MENÚ DEL DÍA
  // =========================================================
  {
    id: 'platos',
    parentId: null,
    keywords: ['plato', 'platos', 'menu del dia', 'vianda', 'comida casera', 'plato del dia'],
    aliases: ['menu', 'vianda'],
    brands: [],
    related: ['menu_del_dia', 'milanesas', 'pastas'],
    intent: 'product',
    typical_attributes: ['guarnicion'],
  },
  {
    id: 'menu_del_dia',
    parentId: 'platos',
    keywords: ['menu del dia', 'menu ejecutivo', 'vianda del dia', 'plato del dia'],
    aliases: ['menu del dia'],
    brands: [],
    related: ['platos'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'milanesas',
    parentId: 'platos',
    keywords: ['milanesa', 'milanesas', 'milanesa napolitana', 'milanesa con papas', 'suprema'],
    aliases: ['mila', 'milanga'],
    brands: [],
    related: ['platos', 'papas_fritas'],
    intent: 'product',
    typical_attributes: ['con guarnicion'],
  },
  {
    id: 'pastas',
    parentId: 'platos',
    keywords: ['pasta', 'pastas', 'fideos', 'ñoquis', 'ravioles', 'tallarines', 'sorrentinos'],
    aliases: ['fideos', 'ñoquis'],
    brands: [],
    related: ['platos'],
    intent: 'product',
    typical_attributes: ['salsa'],
  },

  // =========================================================
  // PAPAS FRITAS Y ACOMPAÑAMIENTOS
  // =========================================================
  {
    id: 'papas',
    parentId: null,
    keywords: ['papas fritas', 'acompañamiento', 'guarnicion', 'fritos'],
    aliases: ['papas', 'acompañamientos'],
    brands: [],
    related: ['papas_fritas', 'rabas', 'otros_fritos'],
    intent: 'product',
    typical_attributes: ['porcion'],
  },
  {
    id: 'papas_fritas',
    parentId: 'papas',
    keywords: ['papas fritas', 'papas', 'papas con cheddar', 'papas con cheddar y panceta', 'batatas fritas'],
    aliases: ['papas'],
    brands: [],
    related: ['papas'],
    intent: 'product',
    typical_attributes: ['porcion'],
  },
  {
    id: 'rabas',
    parentId: 'papas',
    keywords: ['rabas', 'calamares fritos', 'anillos de calamar'],
    aliases: ['rabas'],
    brands: [],
    related: ['papas'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'otros_fritos',
    parentId: 'papas',
    keywords: ['nuggets', 'aros de cebolla', 'palitos de mozzarella', 'bastones de mozzarella', 'buñuelos', 'chizitos'],
    aliases: ['nuggets', 'aros de cebolla', 'palitos de muzzarella'],
    brands: [],
    related: ['papas'],
    intent: 'product',
    typical_attributes: [],
  },

  // =========================================================
  // ENSALADAS
  // =========================================================
  {
    id: 'ensaladas',
    parentId: null,
    keywords: ['ensalada', 'ensaladas', 'ensalada fresca'],
    aliases: ['ensalada'],
    brands: [],
    related: ['ensaladas_clasicas', 'ensaladas_polloCarne', 'ensaladas_veganas'],
    intent: 'product',
    typical_attributes: ['aderezo'],
  },
  {
    id: 'ensaladas_clasicas',
    parentId: 'ensaladas',
    keywords: ['ensalada mixta', 'ensalada de tomate y lechuga', 'ensalada clasica', 'ensalada rusa'],
    aliases: ['clasica', 'mixta'],
    brands: [],
    related: ['ensaladas'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'ensaladas_polloCarne',
    parentId: 'ensaladas',
    keywords: ['ensalada con pollo', 'ensalada cesar', 'ensalada con carne', 'ensalada con atun'],
    aliases: ['cesar', 'con pollo'],
    brands: [],
    related: ['ensaladas'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'ensaladas_veganas',
    parentId: 'ensaladas',
    keywords: ['ensalada vegana', 'ensalada vegetariana', 'ensalada de quinoa', 'ensalada sin animales'],
    aliases: ['vegana', 'vegetariana'],
    brands: [],
    related: ['ensaladas', 'hamburguesas_veggie'],
    intent: 'product',
    typical_attributes: [],
  },

  // =========================================================
  // POSTRES
  // =========================================================
  {
    id: 'postres',
    parentId: null,
    keywords: ['postre', 'postres', 'dulce'],
    aliases: ['postre', 'dulce'],
    brands: [],
    related: ['helados', 'tortas', 'flanes_budines'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'helados',
    parentId: 'postres',
    keywords: ['helado', 'helados', 'copa de helado', 'helado artesanal'],
    aliases: ['helado'],
    brands: [],
    related: ['postres'],
    intent: 'product',
    typical_attributes: ['sabor'],
  },
  {
    id: 'tortas',
    parentId: 'postres',
    keywords: ['torta', 'tortas', 'porcion de torta', 'brownie', 'cheesecake'],
    aliases: ['torta', 'brownie'],
    brands: [],
    related: ['postres'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'flanes_budines',
    parentId: 'postres',
    keywords: ['flan', 'flanes', 'budin', 'budines', 'flan casero', 'budin de pan'],
    aliases: ['flan', 'budin'],
    brands: [],
    related: ['postres'],
    intent: 'product',
    typical_attributes: [],
  },

  // =========================================================
  // BEBIDAS
  // =========================================================
  {
    id: 'bebidas',
    parentId: null,
    keywords: ['bebida', 'bebidas', 'para tomar', 'refresco'],
    aliases: ['bebida'],
    brands: [],
    related: ['gaseosas', 'cervezas', 'jugos_aguas', 'sin_alcohol'],
    intent: 'product',
    typical_attributes: ['tamaño'],
  },
  {
    id: 'gaseosas',
    parentId: 'bebidas',
    keywords: ['gaseosa', 'gaseosas', 'coca cola', 'sprite', 'fanta', 'pepsi', 'coca'],
    aliases: ['coca', 'gaseosa'],
    brands: ['Coca-Cola', 'Pepsi', 'Sprite', 'Fanta'],
    related: ['bebidas'],
    intent: 'product',
    typical_attributes: ['tamaño'],
  },
  {
    id: 'cervezas',
    parentId: 'bebidas',
    keywords: ['cerveza', 'cervezas', 'birra', 'cerveza artesanal', 'cerveza tirada'],
    aliases: ['birra'],
    brands: ['Quilmes', 'Stella Artois', 'Brahma'],
    related: ['bebidas'],
    intent: 'product',
    typical_attributes: ['tamaño'],
  },
  {
    id: 'jugos_aguas',
    parentId: 'bebidas',
    keywords: ['jugo', 'jugos', 'agua', 'agua saborizada', 'agua mineral', 'limonada', 'jugo natural'],
    aliases: ['jugo', 'agua'],
    brands: [],
    related: ['bebidas'],
    intent: 'product',
    typical_attributes: ['tamaño'],
  },
  {
    id: 'sin_alcohol',
    parentId: 'bebidas',
    keywords: ['sin alcohol', 'bebida sin alcohol', 'cerveza sin alcohol', 'mocktail'],
    aliases: ['sin alcohol'],
    brands: [],
    related: ['bebidas'],
    intent: 'product',
    typical_attributes: [],
  },

  // =========================================================
  // COMBOS
  // =========================================================
  {
    id: 'combos',
    parentId: null,
    keywords: ['combo', 'combos', 'menu combo', 'promo'],
    aliases: ['combo', 'promo'],
    brands: [],
    related: ['combos_individuales', 'combos_compartir', 'combos_familiares'],
    intent: 'product',
    typical_attributes: ['incluye'],
  },
  {
    id: 'combos_individuales',
    parentId: 'combos',
    keywords: ['combo individual', 'combo personal', 'combo 1 persona'],
    aliases: ['individual'],
    brands: [],
    related: ['combos'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'combos_compartir',
    parentId: 'combos',
    keywords: ['combo para compartir', 'combo 2 personas', 'combo para dos'],
    aliases: ['para compartir'],
    brands: [],
    related: ['combos'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'combos_familiares',
    parentId: 'combos',
    keywords: ['combo familiar', 'combo grande', 'combo para 4', 'combo fiesta'],
    aliases: ['familiar'],
    brands: [],
    related: ['combos'],
    intent: 'product',
    typical_attributes: [],
  },

  // =========================================================
  // OTROS
  // =========================================================
  {
    id: 'otros',
    parentId: null,
    keywords: ['otro', 'otros', 'varios'],
    aliases: ['varios'],
    brands: [],
    related: ['otros_varios'],
    intent: 'product',
    typical_attributes: [],
  },
  {
    id: 'otros_varios',
    parentId: 'otros',
    keywords: ['otro', 'otros', 'varios', 'adicional'],
    aliases: ['varios'],
    brands: [],
    related: ['otros'],
    intent: 'product',
    typical_attributes: [],
  },
];

// =========================================================
// NORMALIZADOR
// =========================================================

export function normalizeText(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// =========================================================
// MATCHING LOCAL
// =========================================================

export function matchCategoryLocal(text) {
  if (!text || typeof text !== 'string') return null;

  const normalized = normalizeText(text);
  const words = normalized.split(/\s+/);

  let bestMatch = null;

  for (const category of TAXONOMY) {
    const searchPool = [
      ...(category.keywords || []),
      ...(category.aliases || []),
      ...(category.brands || [])
    ].map(normalizeText);

    let matches = 0;

    for (const term of searchPool) {
      if (!term) continue;

      const termWords = term.split(' ');

      const found = termWords.every(word =>
        words.includes(word)
      ) || normalized.includes(term);

      if (found) {
        matches += 1;
      }
    }

    const confidence = matches / Math.max(searchPool.length, 1);

    if (!bestMatch || confidence > bestMatch.confidence) {
      bestMatch = {
        categoryId: category.id,
        confidence: Number(confidence.toFixed(2)),
        matches
      };
    }
  }

  if (!bestMatch || bestMatch.confidence < 0.15) {
    return null;
  }

  return {
    categoryId: bestMatch.categoryId,
    confidence: bestMatch.confidence
  };
}

// =========================================================
// HELPERS
// =========================================================

export function getCategoryById(id) {
  return TAXONOMY.find(cat => cat.id === id) || null;
}

export function getChildrenCategories(parentId) {
  return TAXONOMY.filter(cat => cat.parentId === parentId);
}

export function searchCategories(query) {
  const normalized = normalizeText(query);

  return TAXONOMY.filter(category => {
    const pool = [
      category.id,
      ...(category.keywords || []),
      ...(category.aliases || []),
      ...(category.brands || [])
    ];

    return pool.some(item =>
      normalizeText(item).includes(normalized)
    );
  });
}

export default TAXONOMY;
