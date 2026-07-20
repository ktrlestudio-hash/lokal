// ─── Árbol de categorías ──────────────────────────────────────────────────────
// Estructura plana con parentId. null = raíz.
// Las tiendas y productos referencian ids de esta lista.

export const CATEGORIES = [
  // ── Raíz ──────────────────────────────────────────────────────────────────
  { id: 'hamburguesas', name: 'Hamburguesas',                shortName: 'Burger',   icon: 'Beef',       parentId: null },
  { id: 'pizzas',       name: 'Pizzas',                      shortName: 'Pizza',    icon: 'Pizza',      parentId: null },
  { id: 'sandwiches',   name: 'Sándwiches / Lomitos',        shortName: 'Sandwich', icon: 'Sandwich',   parentId: null },
  { id: 'empanadas',    name: 'Empanadas',                   shortName: 'Empanada', icon: 'Croissant',  parentId: null },
  { id: 'tartas',       name: 'Tartas',                      shortName: 'Tarta',    icon: 'CakeSlice',  parentId: null },
  { id: 'platos',       name: 'Platos / Menú del día',       shortName: 'Platos',   icon: 'UtensilsCrossed', parentId: null },
  { id: 'papas',        name: 'Papas fritas y acompañamientos', shortName: 'Papas', icon: 'Flame',      parentId: null },
  { id: 'ensaladas',    name: 'Ensaladas',                   shortName: 'Ensalada', icon: 'Salad',      parentId: null },
  { id: 'postres',      name: 'Postres',                     shortName: 'Postre',   icon: 'IceCream',   parentId: null },
  { id: 'bebidas',      name: 'Bebidas',                     shortName: 'Bebida',   icon: 'CupSoda',    parentId: null },
  { id: 'combos',       name: 'Combos',                      shortName: 'Combo',    icon: 'Package',    parentId: null },
  { id: 'otros',        name: 'Otros',                       shortName: 'Otros',    icon: 'MoreHorizontal', parentId: null },

  // ── Hamburguesas ──────────────────────────────────────────────────────────
  { id: 'hamburguesas_clasicas', name: 'Clásicas',    parentId: 'hamburguesas' },
  { id: 'hamburguesas_dobles',   name: 'Dobles / XL',  parentId: 'hamburguesas' },
  { id: 'hamburguesas_veggie',   name: 'Veggie',       parentId: 'hamburguesas' },

  // ── Pizzas ────────────────────────────────────────────────────────────────
  { id: 'pizzas_muzzarella',  name: 'Muzzarella',   parentId: 'pizzas' },
  { id: 'pizzas_especiales',  name: 'Especiales',   parentId: 'pizzas' },
  { id: 'pizzas_individuales',name: 'Individuales', parentId: 'pizzas' },

  // ── Sándwiches / Lomitos ─────────────────────────────────────────────────
  { id: 'lomitos',           name: 'Lomitos',              parentId: 'sandwiches' },
  { id: 'sandwiches_frios',  name: 'Sándwiches fríos',     parentId: 'sandwiches' },
  { id: 'choripan_bondiola', name: 'Choripán / Bondiola',  parentId: 'sandwiches' },

  // ── Empanadas ────────────────────────────────────────────────────────────
  { id: 'empanadas_carne',      name: 'Carne',           parentId: 'empanadas' },
  { id: 'empanadas_jamonqueso', name: 'Jamón y queso',   parentId: 'empanadas' },
  { id: 'empanadas_especiales', name: 'Especiales',      parentId: 'empanadas' },

  // ── Tartas ───────────────────────────────────────────────────────────────
  { id: 'tartas_verdura', name: 'Verdura', parentId: 'tartas' },
  { id: 'tartas_pollo',   name: 'Pollo',   parentId: 'tartas' },
  { id: 'tartas_dulces',  name: 'Dulces',  parentId: 'tartas' },

  // ── Platos / Menú del día ────────────────────────────────────────────────
  { id: 'menu_del_dia', name: 'Menú del día', parentId: 'platos' },
  { id: 'milanesas',    name: 'Milanesas',     parentId: 'platos' },
  { id: 'pastas',       name: 'Pastas',        parentId: 'platos' },

  // ── Papas fritas y acompañamientos ──────────────────────────────────────
  { id: 'papas_fritas',    name: 'Papas',        parentId: 'papas' },
  { id: 'rabas',           name: 'Rabas',        parentId: 'papas' },
  { id: 'otros_fritos',    name: 'Otros fritos', parentId: 'papas' },

  // ── Ensaladas ────────────────────────────────────────────────────────────
  { id: 'ensaladas_clasicas',   name: 'Clásicas',         parentId: 'ensaladas' },
  { id: 'ensaladas_polloCarne', name: 'Con pollo/carne',  parentId: 'ensaladas' },
  { id: 'ensaladas_veganas',    name: 'Veganas',          parentId: 'ensaladas' },

  // ── Postres ──────────────────────────────────────────────────────────────
  { id: 'helados',           name: 'Helados',          parentId: 'postres' },
  { id: 'tortas',            name: 'Tortas',           parentId: 'postres' },
  { id: 'flanes_budines',    name: 'Flanes/Budines',   parentId: 'postres' },

  // ── Bebidas ──────────────────────────────────────────────────────────────
  { id: 'gaseosas',      name: 'Gaseosas',        parentId: 'bebidas' },
  { id: 'cervezas',      name: 'Cervezas',        parentId: 'bebidas' },
  { id: 'jugos_aguas',   name: 'Jugos/Aguas',     parentId: 'bebidas' },
  { id: 'sin_alcohol',   name: 'Sin alcohol',     parentId: 'bebidas' },

  // ── Combos ───────────────────────────────────────────────────────────────
  { id: 'combos_individuales', name: 'Individuales',    parentId: 'combos' },
  { id: 'combos_compartir',    name: 'Para compartir',  parentId: 'combos' },
  { id: 'combos_familiares',   name: 'Familiares',      parentId: 'combos' },

  // ── Otros ────────────────────────────────────────────────────────────────
  { id: 'otros_varios', name: 'Varios', parentId: 'otros' },
];

// ─── Atributos sugeridos por categoría ───────────────────────────────────────
// Cada atributo: { key, label, type, options? }
// type: 'text' | 'select' | 'number'

const attr = (key, label, type = 'text', options = null) => ({ key, label, type, ...(options ? { options } : {}) });

const TAMAÑO    = attr('tamaño', 'Tamaño', 'select', ['Individual', 'Mediano', 'Grande', 'Familiar']);
const PORCION    = attr('porcion', 'Porción', 'select', ['1 persona', '2 personas', '3-4 personas', '5+ personas']);
const UNIDADES   = attr('unidades', 'Unidades', 'select', ['Docena', 'Media docena', 'Unidad']);
const APTO_CELIACO = attr('apto_celiaco', 'Apto celíaco', 'select', ['Sí', 'No']);
const APTO_VEGANO  = attr('apto_vegano', 'Apto vegano', 'select', ['Sí', 'No']);
const PICANTE    = attr('picante', 'Picante', 'select', ['No picante', 'Suave', 'Picante', 'Muy picante']);

export const CATEGORY_ATTRIBUTES = {

  // ════════════════════════════════════════════════════════════════════════════
  // HAMBURGUESAS
  // ════════════════════════════════════════════════════════════════════════════
  hamburguesas: [
    TAMAÑO, APTO_CELIACO,
    attr('carne', 'Tipo de carne', 'select', ['Vacuna', 'Pollo', 'Cerdo', 'Veggie/Vegetal']),
    attr('pan', 'Pan', 'select', ['Clásico', 'Brioche', 'Integral', 'Sin TACC']),
  ],
  hamburguesas_clasicas: [
    APTO_CELIACO,
    attr('carne', 'Tipo de carne', 'select', ['Vacuna', 'Pollo', 'Cerdo']),
    attr('pan', 'Pan', 'select', ['Clásico', 'Brioche', 'Integral', 'Sin TACC']),
  ],
  hamburguesas_dobles: [
    APTO_CELIACO,
    attr('medallones', 'Medallones', 'select', ['Doble', 'Triple', 'XL']),
    attr('pan', 'Pan', 'select', ['Clásico', 'Brioche', 'Integral']),
  ],
  hamburguesas_veggie: [APTO_CELIACO, APTO_VEGANO, attr('base', 'Base', 'select', ['Lenteja', 'Garbanzo', 'Soja/Proteína vegetal', 'Vegetales varios'])],

  // ════════════════════════════════════════════════════════════════════════════
  // PIZZAS
  // ════════════════════════════════════════════════════════════════════════════
  pizzas: [TAMAÑO, APTO_CELIACO, attr('masa', 'Masa', 'select', ['Tradicional', 'Media masa', 'Fina', 'Al molde'])],
  pizzas_muzzarella: [TAMAÑO, APTO_CELIACO, attr('masa', 'Masa', 'select', ['Tradicional', 'Media masa', 'Fina', 'Al molde'])],
  pizzas_especiales: [TAMAÑO, APTO_CELIACO, attr('sabor', 'Sabor', 'select', ['Napolitana', 'Fugazzeta', 'Cuatro quesos', 'Jamón y morrón', 'Calabresa', 'Rúcula y jamón crudo', 'Otra'])],
  pizzas_individuales: [APTO_CELIACO, attr('masa', 'Masa', 'select', ['Tradicional', 'Fina'])],

  // ════════════════════════════════════════════════════════════════════════════
  // SÁNDWICHES / LOMITOS
  // ════════════════════════════════════════════════════════════════════════════
  sandwiches: [PORCION, APTO_CELIACO, attr('pan', 'Pan', 'select', ['Baguette', 'Miga', 'Árabe', 'Integral', 'Sin TACC'])],
  lomitos: [APTO_CELIACO, attr('guarnicion', 'Guarnición incluida', 'select', ['Sí', 'No']), attr('extra', 'Con extra', 'select', ['Huevo', 'Queso', 'Jamón', 'Panceta', 'Sin extras'])],
  sandwiches_frios: [APTO_CELIACO, attr('pan', 'Pan', 'select', ['Miga', 'Baguette', 'Integral'])],
  choripan_bondiola: [attr('tipo', 'Tipo', 'select', ['Choripán', 'Bondiola', 'Vacío', 'Morcilla'])],

  // ════════════════════════════════════════════════════════════════════════════
  // EMPANADAS
  // ════════════════════════════════════════════════════════════════════════════
  empanadas: [UNIDADES, attr('coccion', 'Cocción', 'select', ['Horno', 'Fritas'])],
  empanadas_carne: [UNIDADES, attr('coccion', 'Cocción', 'select', ['Horno', 'Fritas']), PICANTE],
  empanadas_jamonqueso: [UNIDADES, attr('coccion', 'Cocción', 'select', ['Horno', 'Fritas'])],
  empanadas_especiales: [UNIDADES, attr('sabor', 'Sabor', 'select', ['Humita', 'Caprese', 'Verdura', 'Pollo', 'Cuatro quesos', 'Otra'])],

  // ════════════════════════════════════════════════════════════════════════════
  // TARTAS
  // ════════════════════════════════════════════════════════════════════════════
  tartas: [PORCION, APTO_CELIACO, APTO_VEGANO],
  tartas_verdura: [PORCION, APTO_CELIACO, APTO_VEGANO, attr('relleno', 'Relleno', 'select', ['Acelga', 'Espinaca', 'Zapallito', 'Choclo', 'Cebolla y morrón'])],
  tartas_pollo:   [PORCION, APTO_CELIACO],
  tartas_dulces:  [PORCION, APTO_CELIACO, attr('relleno', 'Relleno', 'select', ['Manzana', 'Membrillo', 'Batata', 'Frutilla', 'Otra'])],

  // ════════════════════════════════════════════════════════════════════════════
  // PLATOS / MENÚ DEL DÍA
  // ════════════════════════════════════════════════════════════════════════════
  platos: [PORCION, APTO_CELIACO],
  menu_del_dia: [PORCION, attr('incluye', 'Incluye', 'select', ['Plato principal', 'Plato + postre', 'Plato + bebida', 'Completo'])],
  milanesas: [PORCION, APTO_CELIACO, attr('carne', 'Tipo de carne', 'select', ['Vacuna', 'Pollo', 'Soja']), attr('guarnicion', 'Guarnición', 'select', ['Papas fritas', 'Puré', 'Ensalada', 'Sin guarnición'])],
  pastas: [PORCION, attr('tipo', 'Tipo', 'select', ['Fideos', 'Ñoquis', 'Ravioles', 'Canelones', 'Sorrentinos', 'Otra']), attr('salsa', 'Salsa', 'select', ['Tuco', 'Crema', 'Manteca y salvia', 'Pesto', 'A elección'])],

  // ════════════════════════════════════════════════════════════════════════════
  // PAPAS FRITAS Y ACOMPAÑAMIENTOS
  // ════════════════════════════════════════════════════════════════════════════
  papas: [TAMAÑO, APTO_VEGANO],
  papas_fritas: [TAMAÑO, attr('con_extra', 'Con extra', 'select', ['Cheddar', 'Panceta', 'Muzzarella gratinada', 'Sin extras'])],
  rabas: [TAMAÑO],
  otros_fritos: [attr('tipo', 'Tipo', 'select', ['Nuggets', 'Aros de cebolla', 'Palitos de muzzarella', 'Bastones de mozzarella', 'Otro'])],

  // ════════════════════════════════════════════════════════════════════════════
  // ENSALADAS
  // ════════════════════════════════════════════════════════════════════════════
  ensaladas: [TAMAÑO, APTO_VEGANO],
  ensaladas_clasicas: [TAMAÑO],
  ensaladas_polloCarne: [TAMAÑO, attr('proteina', 'Proteína', 'select', ['Pollo', 'Carne', 'Atún', 'Huevo'])],
  ensaladas_veganas: [TAMAÑO, APTO_VEGANO],

  // ════════════════════════════════════════════════════════════════════════════
  // POSTRES
  // ════════════════════════════════════════════════════════════════════════════
  postres: [APTO_CELIACO],
  helados: [attr('formato', 'Formato', 'select', ['Cucurucho', 'Vasito', 'Pote 1/4 kg', 'Pote 1/2 kg', 'Pote 1 kg']), attr('sabor', 'Sabor')],
  tortas: [PORCION, APTO_CELIACO, attr('sabor', 'Sabor')],
  flanes_budines: [PORCION, attr('tipo', 'Tipo', 'select', ['Flan', 'Budín de pan', 'Budín de chocolate', 'Otro'])],

  // ════════════════════════════════════════════════════════════════════════════
  // BEBIDAS
  // ════════════════════════════════════════════════════════════════════════════
  bebidas: [attr('litros', 'Presentación', 'select', ['Lata', '500 ml', '1 L', '1.5 L', '2 L', '2.25 L'])],
  gaseosas: [attr('marca', 'Marca'), attr('litros', 'Presentación', 'select', ['Lata', '500 ml', '1.5 L', '2.25 L'])],
  cervezas: [attr('marca', 'Marca'), attr('litros', 'Presentación', 'select', ['Lata 355 ml', 'Botella 500 ml', 'Botella 1 L', 'Porrón'])],
  jugos_aguas: [attr('tipo', 'Tipo', 'select', ['Agua sin gas', 'Agua con gas', 'Jugo natural', 'Jugo en caja']), attr('litros', 'Presentación', 'select', ['500 ml', '1 L', '1.5 L'])],
  sin_alcohol: [attr('tipo', 'Tipo', 'select', ['Gaseosa', 'Agua', 'Jugo', 'Cerveza sin alcohol'])],

  // ════════════════════════════════════════════════════════════════════════════
  // COMBOS
  // ════════════════════════════════════════════════════════════════════════════
  combos: [PORCION, attr('incluye', 'Incluye', 'text')],
  combos_individuales: [attr('incluye', 'Incluye', 'text')],
  combos_compartir: [PORCION, attr('incluye', 'Incluye', 'text')],
  combos_familiares: [PORCION, attr('incluye', 'Incluye', 'text')],

  // ════════════════════════════════════════════════════════════════════════════
  // OTROS
  // ════════════════════════════════════════════════════════════════════════════
  otros: [attr('tipo', 'Tipo', 'text')],
  otros_varios: [attr('tipo', 'Tipo', 'text')],

  // ════════════════════════════════════════════════════════════════════════════
  // DEFAULT
  // ════════════════════════════════════════════════════════════════════════════
  default: [TAMAÑO, APTO_CELIACO],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Devuelve los hijos directos de un parentId (null = raíz) */
export function getChildren(parentId = null, cats = CATEGORIES) {
  return cats.filter(c => c.parentId === parentId);
}

/** Devuelve la ruta completa [root, ..., category] dado un id */
export function getCategoryPath(id, cats = CATEGORIES) {
  const path = [];
  let current = cats.find(c => c.id === id);
  while (current) {
    path.unshift(current);
    current = cats.find(c => c.id === current.parentId);
  }
  return path;
}

/** Devuelve atributos sugeridos para una categoría (hereda de padres) */
export function getSuggestedAttributes(categoryId, cats = CATEGORIES) {
  if (!categoryId) return CATEGORY_ATTRIBUTES.default;
  const path = getCategoryPath(categoryId, cats).map(c => c.id).reverse();
  for (const id of path) {
    if (CATEGORY_ATTRIBUTES[id]) return CATEGORY_ATTRIBUTES[id];
  }
  return CATEGORY_ATTRIBUTES.default;
}

/** Busca categorías por texto */
export function searchCategories(query, cats = CATEGORIES) {
  if (!query.trim()) return [];
  const q = query.toLowerCase();
  return cats.filter(c => c.name.toLowerCase().includes(q)).slice(0, 12);
}

/** Verifica si una categoría tiene hijos */
export function hasChildren(id, cats = CATEGORIES) {
  return cats.some(c => c.parentId === id);
}

/** Devuelve todos los descendientes de un id (incluyendo él mismo) */
export function getAllDescendants(id, cats = CATEGORIES) {
  const result = [id];
  const children = cats.filter(c => c.parentId === id);
  for (const child of children) {
    result.push(...getAllDescendants(child.id, cats));
  }
  return result;
}
