// ─── Árbol de categorías ──────────────────────────────────────────────────────
// Estructura plana con parentId. null = raíz.
// Las tiendas y demandas referencian ids de esta lista.

export const CATEGORIES = [
  // ── Raíz ──────────────────────────────────────────────────────────────────
  { id: 'electronica',       name: 'Electrónica y Tecnología',  icon: 'Smartphone',   parentId: null },
  { id: 'electrodomesticos', name: 'Electrodomésticos',         icon: 'Refrigerator', parentId: null },
  { id: 'computacion',       name: 'Computación',               icon: 'Laptop',       parentId: null },
  { id: 'hogar',             name: 'Hogar y Muebles',           icon: 'Sofa',         parentId: null },
  { id: 'construccion',      name: 'Construcción y Materiales', icon: 'HardHat',      parentId: null },
  { id: 'ferreteria',        name: 'Ferretería y Herramientas', icon: 'Wrench',       parentId: null },
  { id: 'ropa',              name: 'Ropa y Accesorios',         icon: 'Shirt',        parentId: null },
  { id: 'calzado',           name: 'Calzado',                   icon: 'Footprints',   parentId: null },
  { id: 'deportes',          name: 'Deportes y Fitness',        icon: 'Dumbbell',     parentId: null },
  { id: 'automotores',       name: 'Automotores y Repuestos',   icon: 'Car',          parentId: null },
  { id: 'alimentos',         name: 'Alimentos y Bebidas',       icon: 'ShoppingCart', parentId: null },
  { id: 'salud',             name: 'Salud y Belleza',           icon: 'Heart',        parentId: null },
  { id: 'mascotas',          name: 'Mascotas',                  icon: 'PawPrint',     parentId: null },
  { id: 'juguetes',          name: 'Juguetes y Hobbies',        icon: 'Gamepad2',     parentId: null },
  { id: 'libros',            name: 'Libros y Revistas',         icon: 'BookOpen',     parentId: null },
  { id: 'servicios',         name: 'Servicios',                 icon: 'Settings2',    parentId: null },
  { id: 'otros',             name: 'Otros',                     icon: 'Package',      parentId: null },

  // ── Electrónica ───────────────────────────────────────────────────────────
  { id: 'celulares',      name: 'Celulares y Smartphones',   icon: 'Smartphone', parentId: 'electronica' },
  { id: 'tablets',        name: 'Tablets',                   icon: 'Tablet',     parentId: 'electronica' },
  { id: 'audio',          name: 'Audio y Sonido',            icon: 'Headphones', parentId: 'electronica' },
  { id: 'tv_video',       name: 'TV y Video',                icon: 'Tv',         parentId: 'electronica' },
  { id: 'fotografia',     name: 'Fotografía y Video',        icon: 'Camera',     parentId: 'electronica' },
  { id: 'gaming',         name: 'Gaming y Consolas',         icon: 'Gamepad2',   parentId: 'electronica' },
  { id: 'smartwatches',   name: 'Smartwatches y Wearables',  icon: 'Watch',      parentId: 'electronica' },
  { id: 'accesorios_cel', name: 'Accesorios para celulares', icon: 'Plug2',      parentId: 'electronica' },

  // Celulares → marcas
  { id: 'iphone',    name: 'iPhone (Apple)',  parentId: 'celulares' },
  { id: 'samsung_cel',name: 'Samsung',        parentId: 'celulares' },
  { id: 'motorola',  name: 'Motorola',        parentId: 'celulares' },
  { id: 'xiaomi',    name: 'Xiaomi',          parentId: 'celulares' },
  { id: 'otros_cel', name: 'Otros celulares', parentId: 'celulares' },

  // Audio
  { id: 'auriculares', name: 'Auriculares',          parentId: 'audio' },
  { id: 'parlantes',   name: 'Parlantes',             parentId: 'audio' },
  { id: 'eq_sonido',   name: 'Equipos de sonido',    parentId: 'audio' },
  { id: 'micros',      name: 'Micrófonos',            parentId: 'audio' },

  // TV y Video
  { id: 'televisores',  name: 'Televisores',   parentId: 'tv_video' },
  { id: 'proyectores',  name: 'Proyectores',   parentId: 'tv_video' },
  { id: 'streaming',    name: 'Streaming (Chromecast, Fire TV…)', parentId: 'tv_video' },

  // Gaming
  { id: 'consolas',      name: 'Consolas',              parentId: 'gaming' },
  { id: 'juegos_video',  name: 'Videojuegos',            parentId: 'gaming' },
  { id: 'perifericos',   name: 'Periféricos gamer',      parentId: 'gaming' },

  // ── Computación ───────────────────────────────────────────────────────────
  { id: 'notebooks',     name: 'Notebooks y Laptops',   parentId: 'computacion' },
  { id: 'pcs',           name: 'PCs de escritorio',     parentId: 'computacion' },
  { id: 'monitores',     name: 'Monitores',              parentId: 'computacion' },
  { id: 'componentes',   name: 'Componentes (placas, RAM…)', parentId: 'computacion' },
  { id: 'impresoras',    name: 'Impresoras y Scanners',  parentId: 'computacion' },
  { id: 'redes',         name: 'Redes y Conectividad',   parentId: 'computacion' },
  { id: 'acc_pc',        name: 'Accesorios PC',          parentId: 'computacion' },

  // ── Electrodomésticos ─────────────────────────────────────────────────────
  { id: 'cocina_electro',  name: 'Cocina',                parentId: 'electrodomesticos' },
  { id: 'frio',            name: 'Frío (heladeras, freezer)', parentId: 'electrodomesticos' },
  { id: 'lavado',          name: 'Lavado y Secado',       parentId: 'electrodomesticos' },
  { id: 'climatizacion',   name: 'Climatización (AA, estufas)', parentId: 'electrodomesticos' },
  { id: 'aspiradoras',     name: 'Aspiradoras y Limpieza',parentId: 'electrodomesticos' },
  { id: 'planchado',       name: 'Planchado y Costura',   parentId: 'electrodomesticos' },

  // Cocina
  { id: 'microondas',   name: 'Microondas',    parentId: 'cocina_electro' },
  { id: 'licuadoras',   name: 'Licuadoras y Procesadoras', parentId: 'cocina_electro' },
  { id: 'cafeteras',    name: 'Cafeteras',     parentId: 'cocina_electro' },
  { id: 'hornos',       name: 'Hornos eléctricos', parentId: 'cocina_electro' },
  { id: 'freidoras',    name: 'Freidoras de aire', parentId: 'cocina_electro' },

  // ── Hogar y Muebles ───────────────────────────────────────────────────────
  { id: 'muebles',       name: 'Muebles',          parentId: 'hogar' },
  { id: 'iluminacion',   name: 'Iluminación',       parentId: 'hogar' },
  { id: 'decoracion',    name: 'Decoración',        parentId: 'hogar' },
  { id: 'textiles',      name: 'Textiles del hogar',parentId: 'hogar' },
  { id: 'jardin',        name: 'Jardín y Exterior', parentId: 'hogar' },
  { id: 'cocina_hogar',  name: 'Utensilios de cocina', parentId: 'hogar' },
  { id: 'bano',          name: 'Baño y Sanitarios', parentId: 'hogar' },

  // ── Construcción ──────────────────────────────────────────────────────────
  { id: 'materiales_const', name: 'Materiales (cemento, ladrillos)', parentId: 'construccion' },
  { id: 'hierro_acero',     name: 'Hierro y Acero',                  parentId: 'construccion' },
  { id: 'madera',           name: 'Madera y Tableros',               parentId: 'construccion' },
  { id: 'pintura_const',    name: 'Pintura y Revestimientos',        parentId: 'construccion' },
  { id: 'pisos',            name: 'Pisos y Cerámicos',               parentId: 'construccion' },
  { id: 'plomeria',         name: 'Plomería y Sanitarios',           parentId: 'construccion' },
  { id: 'electricidad',     name: 'Electricidad y Cables',           parentId: 'construccion' },

  // ── Ferretería ────────────────────────────────────────────────────────────
  { id: 'herr_electricas',  name: 'Herramientas eléctricas',  parentId: 'ferreteria' },
  { id: 'herr_manuales',    name: 'Herramientas manuales',    parentId: 'ferreteria' },
  { id: 'fijaciones',       name: 'Fijaciones y Tornillos',   parentId: 'ferreteria' },
  { id: 'seguridad',        name: 'Seguridad y Cerraduras',   parentId: 'ferreteria' },
  { id: 'soldadura',        name: 'Soldadura',                parentId: 'ferreteria' },

  // ── Ropa ──────────────────────────────────────────────────────────────────
  { id: 'ropa_hombre',   name: 'Hombre',           parentId: 'ropa' },
  { id: 'ropa_mujer',    name: 'Mujer',             parentId: 'ropa' },
  { id: 'ropa_ninos',    name: 'Niños y Bebés',     parentId: 'ropa' },
  { id: 'accesorios_ropa', name: 'Accesorios',      parentId: 'ropa' },
  { id: 'bolsas',        name: 'Bolsas y Carteras', parentId: 'ropa' },
  { id: 'joyeria',       name: 'Joyería y Bisutería', parentId: 'ropa' },

  // ── Deportes ──────────────────────────────────────────────────────────────
  { id: 'gym',          name: 'Gym y Fitness',      parentId: 'deportes' },
  { id: 'ciclismo',     name: 'Ciclismo',            parentId: 'deportes' },
  { id: 'futbol',       name: 'Fútbol',              parentId: 'deportes' },
  { id: 'running',      name: 'Running',             parentId: 'deportes' },
  { id: 'natacion',     name: 'Natación',            parentId: 'deportes' },
  { id: 'otros_dep',    name: 'Otros deportes',      parentId: 'deportes' },

  // ── Automotores ───────────────────────────────────────────────────────────
  { id: 'repuestos',    name: 'Repuestos y Partes',  parentId: 'automotores' },
  { id: 'acc_auto',     name: 'Accesorios para autos', parentId: 'automotores' },
  { id: 'neumaticos',   name: 'Neumáticos y Llantas', parentId: 'automotores' },
  { id: 'motos',        name: 'Motos y Accesorios',  parentId: 'automotores' },
  { id: 'lubricantes',  name: 'Lubricantes y Fluidos', parentId: 'automotores' },

  // ── Alimentos ─────────────────────────────────────────────────────────────
  { id: 'alimentos_secos', name: 'Alimentos secos y envasados', parentId: 'alimentos' },
  { id: 'bebidas',         name: 'Bebidas',                      parentId: 'alimentos' },
  { id: 'frescos',         name: 'Frescos (lácteos, carnes)',    parentId: 'alimentos' },
  { id: 'panificados',     name: 'Panificados',                   parentId: 'alimentos' },
  { id: 'limpieza',        name: 'Limpieza del hogar',            parentId: 'alimentos' },
  { id: 'higiene',         name: 'Higiene personal',             parentId: 'alimentos' },

  // ── Salud ─────────────────────────────────────────────────────────────────
  { id: 'medicamentos',   name: 'Medicamentos y Vitaminas', parentId: 'salud' },
  { id: 'cuidado_pers',   name: 'Cuidado personal',         parentId: 'salud' },
  { id: 'perfumes',       name: 'Perfumes y Fragancias',    parentId: 'salud' },
  { id: 'optica',         name: 'Óptica',                   parentId: 'salud' },

  // ── Mascotas ──────────────────────────────────────────────────────────────
  { id: 'perros',     name: 'Perros',            parentId: 'mascotas' },
  { id: 'gatos',      name: 'Gatos',             parentId: 'mascotas' },
  { id: 'otros_masc', name: 'Otras mascotas',    parentId: 'mascotas' },

  // ── Servicios ─────────────────────────────────────────────────────────────
  { id: 'serv_tecnico',  name: 'Servicio técnico',    parentId: 'servicios' },
  { id: 'serv_const',    name: 'Construcción y reforma', parentId: 'servicios' },
  { id: 'serv_limpieza', name: 'Limpieza',             parentId: 'servicios' },
  { id: 'serv_mudanza',  name: 'Mudanzas y fletes',    parentId: 'servicios' },
];

// ─── Atributos sugeridos por categoría ───────────────────────────────────────
// Cada atributo: { key, label, type, options? }
// type: 'text' | 'select' | 'number'

const attr = (key, label, type = 'text', options = null) => ({ key, label, type, ...(options ? { options } : {}) });

const ESTADO = attr('estado', 'Estado', 'select', ['Nuevo', 'Usado - Como nuevo', 'Usado - Buen estado', 'Usado - Acepto detalles']);
const MARCA  = attr('marca',  'Marca');
const MODELO = attr('modelo', 'Modelo');
const COLOR  = attr('color',  'Color');
const CANTIDAD = attr('cantidad', 'Cantidad', 'number');
const MATERIAL = attr('material', 'Material');
const MEDIDAS  = attr('medidas',  'Medidas (largo × ancho × alto)');

export const CATEGORY_ATTRIBUTES = {

  // ════════════════════════════════════════════════════════════════════════════
  // ELECTRÓNICA
  // ════════════════════════════════════════════════════════════════════════════
  electronica: [MARCA, MODELO, ESTADO],

  celulares: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('almacenamiento', 'Almacenamiento', 'select', ['64 GB','128 GB','256 GB','512 GB','1 TB']),
    attr('ram', 'RAM', 'select', ['4 GB','6 GB','8 GB','12 GB','16 GB']),
    attr('pantalla', 'Pantalla', 'select', ['5.5"','6"','6.1"','6.4"','6.5"','6.7"','6.9"']),
    attr('red', 'Red', 'select', ['4G LTE','5G','Dual SIM 4G','Dual SIM 5G']),
    attr('bateria', 'Batería', 'select', ['3000 mAh','4000 mAh','4500 mAh','5000 mAh','5500 mAh','6000 mAh']),
  ],
  iphone: [
    MODELO, COLOR, ESTADO,
    attr('almacenamiento', 'Almacenamiento', 'select', ['64 GB','128 GB','256 GB','512 GB','1 TB']),
    attr('generacion', 'Generación', 'select', ['iPhone 11','iPhone 12','iPhone 13','iPhone 14','iPhone 15','iPhone 16']),
    attr('red', 'Red', 'select', ['4G LTE','5G']),
  ],
  samsung_cel: [
    MODELO, COLOR, ESTADO,
    attr('almacenamiento', 'Almacenamiento', 'select', ['64 GB','128 GB','256 GB','512 GB']),
    attr('linea', 'Línea', 'select', ['Galaxy S','Galaxy A','Galaxy M','Galaxy Z Fold','Galaxy Z Flip']),
    attr('red', 'Red', 'select', ['4G','5G']),
  ],
  motorola: [
    MODELO, COLOR, ESTADO,
    attr('linea', 'Línea', 'select', ['Moto G','Moto E','Edge','Razr']),
    attr('almacenamiento', 'Almacenamiento', 'select', ['64 GB','128 GB','256 GB']),
    attr('red', 'Red', 'select', ['4G','5G']),
  ],
  xiaomi: [
    MODELO, COLOR, ESTADO,
    attr('linea', 'Línea', 'select', ['Redmi Note','Redmi','POCO','Mi','Xiaomi 13/14']),
    attr('almacenamiento', 'Almacenamiento', 'select', ['64 GB','128 GB','256 GB','512 GB']),
    attr('red', 'Red', 'select', ['4G','5G']),
  ],
  otros_cel: [MARCA, MODELO, COLOR, ESTADO, attr('red', 'Red', 'select', ['4G','5G'])],

  tablets: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('pantalla', 'Pantalla', 'select', ['7"','8"','10"','10.5"','11"','12.4"','13"']),
    attr('almacenamiento', 'Almacenamiento', 'select', ['32 GB','64 GB','128 GB','256 GB','512 GB']),
    attr('ram', 'RAM', 'select', ['2 GB','3 GB','4 GB','6 GB','8 GB','12 GB']),
    attr('conectividad', 'Conectividad', 'select', ['Solo WiFi','WiFi + 4G','WiFi + 5G']),
    attr('so', 'Sistema', 'select', ['Android','iPadOS','Windows']),
  ],

  audio: [
    MARCA, MODELO, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Auriculares','Parlante','Barra de sonido','Equipo de sonido','Micrófono','Amplificador']),
  ],
  auriculares: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['In-ear','Over-ear','On-ear','Inalámbricos true wireless']),
    attr('conexion', 'Conexión', 'select', ['Bluetooth','Cable 3.5mm','USB-C','Lightning','2 en 1']),
    attr('anc', 'Cancelación de ruido', 'select', ['Sí (ANC)','No']),
    attr('bateria', 'Autonomía', 'select', ['Hasta 5h','5-10h','10-20h','20-30h','Más de 30h']),
  ],
  parlantes: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Portátil Bluetooth','WiFi multiroom','Barra de sonido','Subwoofer','Torre']),
    attr('potencia', 'Potencia', 'select', ['5W','10W','20W','30W','50W','100W','Más de 100W']),
    attr('resistencia_agua', 'Resistencia al agua', 'select', ['IPX4','IPX5','IPX7','No']),
  ],
  eq_sonido: [
    MARCA, MODELO, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Mini componente','Micro componente','Torre','Home theater']),
    attr('potencia', 'Potencia RMS', 'select', ['50W','100W','200W','300W','500W','Más de 500W']),
    attr('canales', 'Canales', 'select', ['2.0','2.1','5.1','7.1']),
  ],
  micros: [
    MARCA, MODELO, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Condensador','Dinámico','De solapa (lavalier)','Inalámbrico']),
    attr('conexion', 'Conexión', 'select', ['USB','XLR','3.5mm','Inalámbrico']),
    attr('patron', 'Patrón polar', 'select', ['Cardioide','Omnidireccional','Bidireccional']),
  ],

  tv_video: [
    MARCA, MODELO, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Televisor','Proyector','Chromecast / Fire TV / Apple TV']),
  ],
  televisores: [
    MARCA, MODELO, ESTADO,
    attr('pulgadas', 'Pulgadas', 'select', ['32"','40"','43"','50"','55"','65"','75"','85"','98"']),
    attr('resolucion', 'Resolución', 'select', ['HD (720p)','Full HD (1080p)','4K UHD','8K']),
    attr('tipo_panel', 'Panel', 'select', ['LED','QLED','OLED','Neo QLED','Mini LED']),
    attr('smart', 'Smart TV', 'select', ['Sí','No']),
    attr('sistema', 'Sistema', 'select', ['Android TV','Google TV','Tizen (Samsung)','webOS (LG)','Roku TV']),
    attr('hz', 'Frecuencia', 'select', ['60 Hz','120 Hz','144 Hz']),
  ],
  proyectores: [
    MARCA, MODELO, ESTADO,
    attr('resolucion', 'Resolución', 'select', ['HD (720p)','Full HD (1080p)','4K UHD']),
    attr('lumens', 'Brillo (ANSI Lumens)', 'select', ['1000-2000','2000-3000','3000-5000','Más de 5000']),
    attr('tipo', 'Tipo', 'select', ['Portátil','De techo','Laser','DLP','LCD']),
    attr('smart', 'Smart', 'select', ['Sí','No']),
  ],
  streaming: [
    MARCA,
    attr('modelo', 'Modelo', 'select', ['Chromecast 4K','Fire TV Stick','Apple TV 4K','Roku Express','Mi Box','NVIDIA Shield']),
    ESTADO,
    attr('resolucion', 'Resolución', 'select', ['Full HD','4K']),
  ],

  fotografia: [
    MARCA, MODELO, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Cámara réflex (DSLR)','Cámara mirrorless','Cámara compacta','Cámara de acción','Dron','Cámara instantánea']),
    attr('megapixeles', 'Megapíxeles', 'select', ['12 MP','20 MP','24 MP','30 MP','45 MP','50 MP','Más de 50 MP']),
    attr('incluye_lente', 'Incluye lente', 'select', ['Sí','No']),
  ],

  gaming: [
    MARCA, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Consola','Videojuego','Periférico gamer','Accesorio']),
  ],
  consolas: [
    ESTADO,
    attr('marca_consola', 'Consola', 'select', ['PlayStation 5','PlayStation 4','Xbox Series X','Xbox Series S','Xbox One','Nintendo Switch','Nintendo Switch Lite','Nintendo Switch OLED']),
    attr('incluye_juegos', 'Incluye juegos', 'select', ['Sí','No']),
    attr('memoria', 'Almacenamiento', 'select', ['256 GB','512 GB','1 TB','2 TB']),
  ],
  juegos_video: [
    ESTADO,
    attr('plataforma', 'Plataforma', 'select', ['PS5','PS4','Xbox Series','Xbox One','Nintendo Switch','PC','Otro']),
    attr('genero', 'Género', 'select', ['Acción','Aventura','RPG','Deportes','Carreras','Shooter','Estrategia','Simulación','Indie','Terror']),
    attr('formato', 'Formato', 'select', ['Físico','Digital (código)']),
  ],
  perifericos: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Teclado','Mouse','Headset','Silla gamer','Monitor gamer','Joystick / Control','Mousepad']),
    attr('conexion', 'Conexión', 'select', ['USB cableado','Inalámbrico','Bluetooth']),
  ],

  smartwatches: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('compatibilidad', 'Compatibilidad', 'select', ['iOS (Apple Watch)','Android','iOS y Android']),
    attr('conectividad', 'Conectividad', 'select', ['Bluetooth','Bluetooth + WiFi','Bluetooth + WiFi + 4G']),
    attr('pantalla', 'Pantalla', 'select', ['AMOLED','LCD','OLED','MIP']),
  ],

  accesorios_cel: [
    attr('tipo', 'Tipo', 'select', ['Funda','Cargador','Cable','Vidrio templado','Auriculares','Batería portátil','Soporte','Magsafe / Carga inalámbrica']),
    MARCA, COLOR,
    attr('compatibilidad', 'Compatible con', 'select', ['iPhone','Samsung','Motorola','Xiaomi','Universal']),
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // COMPUTACIÓN
  // ════════════════════════════════════════════════════════════════════════════
  computacion: [MARCA, ESTADO, attr('tipo', 'Tipo', 'select', ['Notebook','PC escritorio','Monitor','Componente','Impresora','Accesorio'])],

  notebooks: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('procesador', 'Procesador', 'select', ['Intel Core i3','Intel Core i5','Intel Core i7','Intel Core i9','AMD Ryzen 5','AMD Ryzen 7','AMD Ryzen 9','Apple M1','Apple M2','Apple M3','Apple M4']),
    attr('ram', 'RAM', 'select', ['4 GB','8 GB','16 GB','32 GB','64 GB']),
    attr('almacenamiento', 'Almacenamiento', 'select', ['128 GB SSD','256 GB SSD','512 GB SSD','1 TB SSD','2 TB SSD','1 TB HDD']),
    attr('pantalla', 'Pantalla', 'select', ['13"','13.3"','14"','15.6"','16"','17.3"']),
    attr('so', 'Sistema operativo', 'select', ['Windows 11','Windows 10','macOS','Linux','Sin sistema']),
    attr('placa_video', 'Placa de video', 'select', ['Integrada','NVIDIA RTX 3050','NVIDIA RTX 3060','NVIDIA RTX 4060','NVIDIA RTX 4070','AMD Radeon RX']),
  ],
  pcs: [
    MARCA, ESTADO,
    attr('procesador', 'Procesador', 'select', ['Intel Core i3','Intel Core i5','Intel Core i7','Intel Core i9','AMD Ryzen 5','AMD Ryzen 7','AMD Ryzen 9']),
    attr('ram', 'RAM', 'select', ['8 GB','16 GB','32 GB','64 GB']),
    attr('almacenamiento', 'Almacenamiento', 'select', ['256 GB SSD','512 GB SSD','1 TB SSD','1 TB HDD','2 TB HDD']),
    attr('placa_video', 'Placa de video', 'select', ['Integrada','NVIDIA GTX 1650','NVIDIA RTX 3060','NVIDIA RTX 4060','NVIDIA RTX 4070','NVIDIA RTX 4080','AMD Radeon RX 6600','AMD Radeon RX 7700']),
    attr('gabinete', 'Gabinete incluido', 'select', ['Sí','No']),
  ],
  monitores: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('pulgadas', 'Pulgadas', 'select', ['21.5"','24"','27"','32"','34" (ultrawide)','38" (ultrawide)']),
    attr('resolucion', 'Resolución', 'select', ['Full HD (1080p)','2K (1440p)','4K UHD','Ultrawide 2K','Ultrawide 4K']),
    attr('hz', 'Frecuencia', 'select', ['60 Hz','75 Hz','100 Hz','120 Hz','144 Hz','165 Hz','240 Hz','360 Hz']),
    attr('panel', 'Panel', 'select', ['IPS','VA','TN','OLED','Mini LED']),
    attr('tiempo_respuesta', 'Tiempo de respuesta', 'select', ['1 ms','2 ms','4 ms','5 ms']),
  ],
  componentes: [
    MARCA, MODELO, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Procesador (CPU)','Placa de video (GPU)','RAM','SSD','HDD','Placa madre','Fuente de poder','Gabinete','Cooler','Disipador']),
  ],
  impresoras: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Inyección de tinta','Láser','Multifunción (imprime, escanea, copia)','Fotográfica','Térmica','3D']),
    attr('conectividad', 'Conectividad', 'select', ['USB','WiFi','WiFi + Ethernet','Bluetooth']),
    attr('color', 'Imprime en color', 'select', ['Sí','Solo blanco y negro']),
  ],
  redes: [
    MARCA, MODELO, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Router WiFi','Router 4G/5G','Switch','Access Point','Repetidor / Extensor','Módem','Placa de red']),
    attr('velocidad', 'Velocidad WiFi', 'select', ['WiFi 4 (N)','WiFi 5 (AC)','WiFi 6 (AX)','WiFi 6E','WiFi 7']),
  ],
  acc_pc: [
    MARCA, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Mouse','Teclado','Webcam','Auriculares / Headset','Hub USB','Mousepad','Soporte laptop','Disco externo','Pendrive']),
    attr('conexion', 'Conexión', 'select', ['USB-A','USB-C','Inalámbrico','Bluetooth']),
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // ELECTRODOMÉSTICOS
  // ════════════════════════════════════════════════════════════════════════════
  electrodomesticos: [MARCA, ESTADO, attr('tipo', 'Tipo', 'select', ['Cocina','Frío','Lavado','Climatización','Pequeño electrodoméstico'])],

  cocina_electro: [MARCA, MODELO, COLOR, ESTADO, attr('tipo', 'Tipo', 'select', ['Microondas','Licuadora','Procesadora','Cafetera','Horno eléctrico','Freidora de aire','Tostadora','Pava eléctrica'])],
  microondas:  [MARCA, MODELO, COLOR, ESTADO, attr('capacidad', 'Capacidad', 'select', ['17 L','20 L','23 L','25 L','28 L','30 L','32 L']), attr('potencia', 'Potencia', 'select', ['700W','800W','900W','1000W','1200W'])],
  licuadoras:  [MARCA, MODELO, COLOR, ESTADO, attr('potencia', 'Potencia', 'select', ['300W','500W','700W','900W','1200W']), attr('velocidades', 'Velocidades', 'select', ['2','3','5','10','Variable'])],
  cafeteras:   [MARCA, MODELO, COLOR, ESTADO, attr('tipo', 'Tipo', 'select', ['Espresso / Express','Cápsulas (Nespresso)','Cápsulas (Dolce Gusto)','Americana de filtro','Prensa francesa','Italiana (moka)','Percoladora'])],
  hornos:      [MARCA, MODELO, COLOR, ESTADO, attr('capacidad', 'Capacidad', 'select', ['20 L','30 L','42 L','50 L','60 L']), attr('tipo', 'Tipo', 'select', ['Eléctrico','Con convección','Pizzero','Tostador'])],
  freidoras:   [MARCA, MODELO, COLOR, ESTADO, attr('capacidad', 'Capacidad', 'select', ['1.5 L','2 L','3 L','4 L','5 L','6 L','8 L'])],

  frio: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Heladera con freezer','Heladera sin freezer','No frost','Freezer','Side by side']),
    attr('capacidad', 'Capacidad', 'select', ['200 L','250 L','300 L','320 L','350 L','400 L','450 L','500 L','Más de 500 L']),
  ],
  lavado: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Lavarropas automático carga frontal','Lavarropas automático carga superior','Lavarropas semiautomático','Secarropas','Lavasecas combo']),
    attr('capacidad', 'Capacidad', 'select', ['5 kg','6 kg','7 kg','8 kg','9 kg','10 kg','12 kg','15 kg']),
    attr('rpm', 'Centrifugado', 'select', ['800 RPM','1000 RPM','1200 RPM','1400 RPM','1600 RPM']),
  ],
  climatizacion: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Aire acondicionado split','AA portátil','Estufa a gas','Estufa eléctrica','Calefactor a gas','Calefactor eléctrico','Ventilador','Climatizador evaporativo']),
    attr('frigorias', 'Frigorías / BTU', 'select', ['2200 fg','2500 fg','3000 fg','3500 fg','4000 fg','5000 fg','6000 fg']),
    attr('frio_calor', 'Función', 'select', ['Solo frío','Frío y calor (bomba de calor)']),
  ],
  aspiradoras: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Aspiradora tradicional','Robot aspirador','Escoba eléctrica / Stick','Sin bolsa','Con bolsa','Aspiradora y trapeadora']),
    attr('potencia', 'Potencia', 'select', ['1000W','1200W','1400W','1600W','1800W','2000W']),
  ],
  planchado: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Plancha a vapor','Centro de planchado','Vaporizador vertical','Plancha cerámica','Plancha titanio']),
    attr('potencia', 'Potencia', 'select', ['1000W','1200W','1500W','1800W','2000W','2400W']),
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // HOGAR Y MUEBLES
  // ════════════════════════════════════════════════════════════════════════════
  hogar: [attr('tipo', 'Tipo', 'select', ['Mueble','Iluminación','Decoración','Textil','Jardín','Utensilios','Baño']), MATERIAL, COLOR],

  muebles: [
    attr('tipo', 'Tipo', 'select', ['Sofá / Sillón','Cama','Mesa de comedor','Mesa de noche','Escritorio','Silla','Placard / Ropero','Biblioteca','Rack TV','Cajonera','Estantería']),
    MATERIAL, COLOR, MEDIDAS, ESTADO,
  ],
  iluminacion: [
    attr('tipo', 'Tipo', 'select', ['Lámpara de pie','Lámpara de techo','Velador','Aplique de pared','Tira LED','Proyector LED','Foco / Dicroico','Araña']),
    MARCA,
    attr('color_luz', 'Color de luz', 'select', ['Cálida (2700K)','Neutra (4000K)','Fría (6500K)','RGB / Multicolor']),
    attr('watts', 'Potencia', 'select', ['5W','9W','12W','15W','20W','30W','50W']),
    attr('smart', 'Inteligente (Smart)', 'select', ['Sí','No']),
  ],
  decoracion: [attr('tipo', 'Tipo', 'select', ['Cuadro','Espejo','Maceta','Reloj','Figura decorativa','Alfombra','Cojín','Vela / Aromatizante']), MATERIAL, COLOR, MEDIDAS],
  textiles: [
    attr('tipo', 'Tipo', 'select', ['Sábanas','Almohadas','Acolchado / Edredón','Toallas','Cortinas','Alfombra','Cubrecama / Quilt','Funda nórdica']),
    MARCA, COLOR, MATERIAL,
    attr('talle', 'Medida / Talle', 'select', ['1 plaza','1,5 plazas','2 plazas','Queen','King','Estándar']),
  ],
  jardin: [
    attr('tipo', 'Tipo', 'select', ['Muebles de exterior','Sombrilla / Gazebo','Parrilla / BBQ','Pileta inflable','Herramientas de jardín','Macetas','Plantas','Riego automático']),
    MARCA, MATERIAL, COLOR, ESTADO,
  ],
  cocina_hogar: [
    attr('tipo', 'Tipo', 'select', ['Ollas y sartenes','Vajilla','Cubiertos','Moldes para horno','Tabla de picar','Cuchillos','Recipientes herméticos','Utensilios varios']),
    MARCA, MATERIAL, COLOR, CANTIDAD,
  ],
  bano: [
    attr('tipo', 'Tipo', 'select', ['Grifería','Ducha','Sanitario (inodoro/bidet)','Mueble de baño','Espejo','Accesorios (jabonera, toallero)']),
    MARCA, MATERIAL, COLOR, ESTADO,
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // CONSTRUCCIÓN
  // ════════════════════════════════════════════════════════════════════════════
  construccion: [attr('tipo', 'Tipo de material', 'select', ['Cemento / Hormigón','Ladrillos','Hierro / Acero','Madera','Pintura','Pisos','Plomería','Electricidad']), MARCA, CANTIDAD],

  materiales_const: [
    MARCA, CANTIDAD, MEDIDAS,
    attr('tipo', 'Tipo', 'select', ['Cemento portland','Hormigón premezclado','Ladrillo hueco','Ladrillo macizo','Bloque de cemento','Cal','Arena','Piedra','Yeso']),
  ],
  hierro_acero: [
    MARCA, CANTIDAD, MEDIDAS,
    attr('tipo', 'Tipo / Perfil', 'select', ['Hierro redondo (varilla)','Hierro ángulo','Hierro doble T','Caño estructural','Chapa','Malla de acero','Alambre']),
    attr('espesor', 'Espesor / Diámetro', 'select', ['4 mm','6 mm','8 mm','10 mm','12 mm','16 mm','20 mm']),
  ],
  madera: [
    MARCA, CANTIDAD, MEDIDAS,
    attr('tipo', 'Tipo de madera', 'select', ['Pino','Eucalipto','Roble','MDF','Melamina','Machimbre','Deck','Terciado / Plywood']),
    attr('espesor', 'Espesor', 'select', ['6 mm','9 mm','12 mm','15 mm','18 mm','25 mm','38 mm']),
  ],
  pintura_const: [
    MARCA, COLOR, CANTIDAD,
    attr('tipo', 'Tipo', 'select', ['Látex interior','Látex exterior','Esmalte sintético','Barniz','Impermeabilizante','Microcemento','Epoxi','Pintura de piso']),
    attr('litros', 'Presentación', 'select', ['1 L','4 L','10 L','20 L']),
    attr('acabado', 'Acabado', 'select', ['Mate','Satinado','Semimate','Brillante']),
  ],
  pisos: [
    MARCA, CANTIDAD, MEDIDAS, COLOR,
    attr('tipo', 'Tipo', 'select', ['Cerámico','Porcelanato','Vinílico','Parquet','Laminado','Microcemento','Cemento alisado','Adoquín']),
    attr('formato', 'Formato', 'select', ['30×30 cm','45×45 cm','60×60 cm','60×120 cm','90×90 cm']),
  ],
  plomeria: [
    MARCA, CANTIDAD, MATERIAL,
    attr('tipo', 'Tipo de pieza', 'select', ['Caño PVC','Caño de cobre','Caño multicapa','Grifería','Llave de paso','Codo','Te','Unión','Sifón','Pileta de patio']),
    attr('diametro', 'Diámetro', 'select', ['1/2"','3/4"','1"','4"','110 mm','160 mm']),
  ],
  electricidad: [
    MARCA, CANTIDAD,
    attr('tipo', 'Tipo', 'select', ['Cable unipolar','Cable bipolar','Cable de red','Disyuntor / Termomagnético','Llave térmica','Toma corriente','Interruptor','Tablero eléctrico','Canaleta','Bandeja portacables']),
    attr('tension', 'Tensión', 'select', ['12V','24V','110V','220V','380V']),
    attr('seccion', 'Sección del cable', 'select', ['1 mm²','1.5 mm²','2.5 mm²','4 mm²','6 mm²','10 mm²']),
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // FERRETERÍA
  // ════════════════════════════════════════════════════════════════════════════
  ferreteria: [attr('tipo', 'Tipo', 'select', ['Herramienta eléctrica','Herramienta manual','Fijaciones','Seguridad','Soldadura','Pintura']), MARCA, ESTADO],

  herr_electricas: [
    MARCA, MODELO, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Taladro','Rotomartillo','Amoladora','Sierra circular','Sierra caladora','Atornillador','Compresor','Lijadora','Fresadora']),
    attr('potencia', 'Potencia', 'select', ['400W','500W','700W','800W','1000W','1200W','1500W','2000W']),
    attr('voltaje', 'Alimentación', 'select', ['220V','12V a batería','18V a batería','20V a batería']),
  ],
  herr_manuales: [
    MARCA, ESTADO, MATERIAL,
    attr('tipo', 'Tipo', 'select', ['Martillo','Destornillador','Alicate','Llave inglesa','Llave de tubo','Serrucho','Nivel','Cinta métrica','Espátula','Cincel']),
  ],
  fijaciones: [
    CANTIDAD, MATERIAL,
    attr('tipo', 'Tipo', 'select', ['Tornillo autoperforante','Tornillo madera','Bulón','Tuerca','Arandela','Tarugo plástico','Tarugo metal','Clavo','Remache','Gancho']),
    attr('medida', 'Medida', 'select', ['M4','M5','M6','M8','M10','M12','3×20 mm','4×40 mm','5×50 mm','6×60 mm']),
  ],
  seguridad: [
    MARCA, MODELO, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Cerradura de embutir','Cerradura de sobreponer','Candado','Alarma perimetral','Cámara IP','Sensor de movimiento','Reja','Caja fuerte']),
  ],
  soldadura: [
    MARCA, MODELO, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Soldadora MIG/MAG','Soldadora TIG','Soldadora arco (electrodo)','Soldadora punto','Equipo oxicorte']),
    attr('amperes', 'Amperaje', 'select', ['100A','130A','160A','200A','250A','300A']),
    attr('tension', 'Tensión', 'select', ['220V monofásico','380V trifásico']),
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // ROPA Y CALZADO
  // ════════════════════════════════════════════════════════════════════════════
  ropa: [
    MARCA, COLOR, ESTADO,
    attr('tipo', 'Tipo de prenda', 'select', ['Remera / Camiseta','Camisa','Buzo','Campera','Pantalón','Jean','Short','Vestido','Pollera','Traje','Ropa deportiva']),
    attr('genero', 'Para', 'select', ['Hombre','Mujer','Unisex','Niño','Niña','Bebé']),
    attr('talle', 'Talle', 'select', ['XS','S','M','L','XL','XXL','XXXL']),
    MATERIAL,
  ],
  ropa_hombre: [MARCA, COLOR, ESTADO, attr('talle', 'Talle', 'select', ['XS','S','M','L','XL','XXL','XXXL']), MATERIAL, attr('tipo', 'Prenda', 'select', ['Remera','Camisa','Buzo','Campera','Pantalón','Jean','Short','Traje','Ropa interior'])],
  ropa_mujer:  [MARCA, COLOR, ESTADO, attr('talle', 'Talle', 'select', ['XS','S','M','L','XL','XXL']), MATERIAL, attr('tipo', 'Prenda', 'select', ['Remera','Blusa','Buzo','Campera','Pantalón','Jean','Vestido','Pollera','Traje de baño'])],
  ropa_ninos:  [MARCA, COLOR, ESTADO, attr('talle', 'Talle', 'select', ['0-3m','3-6m','6-9m','6-12m','1 año','2 años','3 años','4 años','6 años','8 años','10 años','12 años','14 años']), attr('genero', 'Para', 'select', ['Nena','Nene','Bebé','Unisex'])],
  accesorios_ropa: [MARCA, COLOR, ESTADO, attr('tipo', 'Tipo', 'select', ['Cinturón','Bufanda / Pañuelo','Gorra / Sombrero','Guantes','Lentes de sol','Cartera / Clutch','Mochila','Corbata / Moño'])],
  bolsas: [MARCA, COLOR, MATERIAL, ESTADO, attr('tipo', 'Tipo', 'select', ['Mochila','Cartera','Maletín','Bolso de viaje','Valija','Riñonera','Tote bag']), attr('capacidad', 'Capacidad', 'select', ['Pequeño (hasta 10L)','Mediano (10-20L)','Grande (20-40L)','Muy grande (más de 40L)'])],
  joyeria: [MARCA, ESTADO, attr('tipo', 'Tipo', 'select', ['Collar','Pulsera','Anillo','Aros','Cadena','Reloj']), attr('material', 'Material', 'select', ['Plata 925','Oro','Oro laminado','Acero inoxidable','Bijou','Bronce']), COLOR],

  calzado: [
    MARCA, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Zapatillas deportivas','Zapatillas casuales','Zapatos de vestir','Botas','Botines','Sandalias','Ojotas','Mocasines']),
    attr('numero', 'Número', 'select', ['35','36','37','38','39','40','41','42','43','44','45','46']),
    attr('genero', 'Para', 'select', ['Hombre','Mujer','Unisex','Niño/a']),
    MATERIAL,
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // DEPORTES
  // ════════════════════════════════════════════════════════════════════════════
  deportes: [MARCA, ESTADO, attr('tipo', 'Tipo', 'select', ['Equipamiento','Ropa deportiva','Calzado','Accesorio','Nutrición deportiva'])],

  gym: [
    MARCA, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Mancuernas','Barra olímpica','Discos de pesas','Banco de fuerza','Rack / Jaula','Cinta de correr','Bicicleta fija','Elíptica','Remo','Funcional (TRX, kettlebell)','Colchoneta']),
    attr('peso', 'Peso / Resistencia', 'select', ['1 kg','2 kg','5 kg','10 kg','15 kg','20 kg','30 kg','50 kg','Ajustable']),
  ],
  ciclismo: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Mountain bike (MTB)','Bicicleta de ruta','Bicicleta urbana','BMX','Bicicleta plegable','E-bike (eléctrica)']),
    attr('rodado', 'Rodado', 'select', ['20"','24"','26"','27.5"','29"','700c']),
    attr('velocidades', 'Velocidades', 'select', ['1','3','7','8','9','10','11','12']),
    attr('frenos', 'Frenos', 'select', ['V-brake','Disco mecánico','Disco hidráulico']),
  ],
  futbol: [MARCA, ESTADO, attr('tipo', 'Tipo', 'select', ['Pelota','Botines','Camiseta / Indumentaria','Canilleras','Arquero (guantes, ropa)','Arco','Bolso']), attr('talle', 'Talle / Número')],
  running: [MARCA, COLOR, ESTADO, attr('tipo', 'Tipo', 'select', ['Zapatillas de running','Ropa deportiva','Mochila hidratación','Reloj GPS','Accesorios']), attr('numero', 'Número', 'select', ['35','36','37','38','39','40','41','42','43','44','45'])],
  natacion: [MARCA, COLOR, ESTADO, attr('tipo', 'Tipo', 'select', ['Malla / Traje de baño','Antiparras','Gorra de natación','Aletas','Tabla','Paletas','Tubo de respiración']), attr('talle', 'Talle', 'select', ['XS','S','M','L','XL','XXL'])],
  otros_dep: [MARCA, ESTADO, attr('tipo', 'Tipo de deporte / artículo'), attr('talle', 'Talle / Número (si aplica)')],

  // ════════════════════════════════════════════════════════════════════════════
  // AUTOMOTORES
  // ════════════════════════════════════════════════════════════════════════════
  automotores: [MARCA, ESTADO, attr('tipo', 'Tipo', 'select', ['Repuesto','Accesorio','Neumático','Moto','Lubricante'])],

  repuestos: [
    MARCA, MODELO, ESTADO,
    attr('tipo', 'Tipo de repuesto', 'select', ['Motor / Tren motriz','Frenos','Suspensión','Dirección','Transmisión','Carrocería','Eléctrico / Electrónico','Filtros','Correas','Amortiguadores']),
    attr('año', 'Año del vehículo', 'select', ['Hasta 2010','2010-2015','2015-2018','2018-2021','2021-2024','2025+']),
    attr('motor', 'Motor', 'select', ['1.0','1.4','1.6','1.8','2.0','2.4','Diésel','Híbrido','Eléctrico']),
    attr('oem', 'Código OEM / Referencia'),
  ],
  acc_auto: [
    MARCA, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Fundas de asientos','Alfombras','Cargador USB / Soporte celular','Alarma','Cámara de reversa','Luz LED interior','Limpiaparabrisas','Parasol','Remolque / Barra']),
    attr('compatibilidad', 'Compatible con', 'select', ['Universal','Autos compactos','SUV / Camioneta','Sedán','Pick-up']),
  ],
  neumaticos: [
    MARCA, ESTADO,
    attr('medida', 'Medida', 'select', ['175/70 R13','185/60 R14','185/65 R15','195/55 R15','195/65 R15','205/55 R16','205/60 R16','215/65 R16','225/45 R17','225/65 R17','235/45 R18']),
    attr('tipo', 'Tipo', 'select', ['Todo tiempo','Verano','Invierno / Nieve','Off-road / 4×4']),
    attr('llanta', 'Llanta incluida', 'select', ['Sí','No']),
    CANTIDAD,
  ],
  motos: [
    MARCA, MODELO, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Moto calle','Moto enduro / cross','Scooter','Cuatriciclo','Moto de ruta']),
    attr('cilindrada', 'Cilindrada', 'select', ['50 cc','110 cc','150 cc','200 cc','250 cc','300 cc','400 cc','600 cc','1000 cc']),
    attr('año', 'Año', 'select', ['2015','2016','2017','2018','2019','2020','2021','2022','2023','2024','2025']),
  ],
  lubricantes: [
    MARCA,
    attr('tipo', 'Tipo', 'select', ['Aceite de motor','Aceite de transmisión','Líquido de frenos','Refrigerante / Anticongelante','Grasa','Limpiador de frenos','Aditivo']),
    attr('viscosidad', 'Viscosidad (aceite)', 'select', ['5W-30','5W-40','10W-40','15W-40','20W-50','Sintético 0W-20','SAE 90']),
    attr('litros', 'Presentación', 'select', ['250 ml','500 ml','1 L','4 L','5 L','20 L']),
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // ALIMENTOS Y BEBIDAS
  // ════════════════════════════════════════════════════════════════════════════
  alimentos: [MARCA, CANTIDAD, attr('tipo', 'Tipo', 'select', ['Alimento seco','Bebida','Fresco','Panificado','Limpieza','Higiene personal'])],

  alimentos_secos: [MARCA, CANTIDAD, attr('tipo', 'Tipo', 'select', ['Arroz','Fideos / Pasta','Legumbres','Harina','Aceite','Conservas / Latas','Snacks','Cereales','Azúcar / Sal','Café / Té']), attr('peso', 'Peso / Cantidad', 'select', ['250 g','500 g','1 kg','2 kg','5 kg','10 kg','Unidades'])],
  bebidas: [MARCA, CANTIDAD, attr('tipo', 'Tipo', 'select', ['Agua mineral','Gaseosa','Jugo','Agua saborizada','Cerveza','Vino','Espirituosas / Fernet','Energizante','Infusiones (yerba, té)']), attr('litros', 'Presentación', 'select', ['250 ml','330 ml','500 ml','1 L','1.5 L','2 L','2.25 L','Pack x6','Pack x12'])],
  frescos: [MARCA, CANTIDAD, attr('tipo', 'Tipo', 'select', ['Lácteos (leche, queso, yogur)','Carnes y embutidos','Frutas y verduras','Huevos','Fiambres']), attr('peso', 'Peso', 'select', ['250 g','500 g','1 kg','Precio por kg'])],
  panificados: [MARCA, CANTIDAD, attr('tipo', 'Tipo', 'select', ['Pan de molde','Facturas / Medialunas','Galletitas','Torta / Budín','Tostadas','Pan artesanal','Alfajores']), attr('peso', 'Peso', 'select', ['100 g','250 g','400 g','500 g','1 kg'])],
  limpieza: [MARCA, CANTIDAD, attr('tipo', 'Tipo', 'select', ['Lavandina','Detergente lavavajillas','Detergente ropa','Limpiapisos','Desengrasante','Quitamanchas','Suavizante','Bolsas de residuo','Trapos / Esponjas']), attr('litros', 'Presentación', 'select', ['500 ml','1 L','2 L','5 L','Pack x3','Pack x6'])],
  higiene: [MARCA, CANTIDAD, attr('tipo', 'Tipo', 'select', ['Shampoo','Acondicionador','Jabón','Crema dental','Desodorante','Papel higiénico','Afeitadoras','Pañales','Toallitas húmedas']), attr('ml_g', 'Presentación', 'select', ['50 ml','100 ml','200 ml','400 ml','1 kg','Pack x4','Pack x8','Pack x12'])],

  // ════════════════════════════════════════════════════════════════════════════
  // SALUD Y BELLEZA
  // ════════════════════════════════════════════════════════════════════════════
  salud: [MARCA, attr('tipo', 'Tipo', 'select', ['Medicamento / Vitamina','Cuidado personal','Perfume','Óptica','Equipamiento médico'])],

  medicamentos: [MARCA, CANTIDAD, attr('tipo', 'Tipo', 'select', ['Vitaminas y suplementos','Antiinflamatorio','Analgésico','Antigripal','Antiácido','Primeros auxilios','Termómetro / Tensiómetro'])],
  cuidado_pers: [MARCA, CANTIDAD, attr('tipo', 'Tipo', 'select', ['Crema hidratante','Protector solar','Maquillaje','Serum / Tratamiento facial','Crema corporal','Depiladora / Afeitadora','Cepillo de dientes eléctrico','Plancha / Rizador de cabello']), attr('tipo_piel', 'Tipo de piel', 'select', ['Normal','Seca','Grasa','Mixta','Sensible'])],
  perfumes: [MARCA, attr('nombre', 'Nombre del perfume'), attr('volumen', 'Volumen', 'select', ['30 ml','50 ml','75 ml','100 ml','125 ml','150 ml','200 ml']), attr('tipo', 'Concentración', 'select', ['Eau de Toilette (EDT)','Eau de Parfum (EDP)','Parfum / Extrait','Colonia']), attr('genero', 'Género', 'select', ['Masculino','Femenino','Unisex']), ESTADO],
  optica: [MARCA, ESTADO, attr('tipo', 'Tipo', 'select', ['Lentes de sol','Anteojos de lectura','Marco para receta','Lentes de contacto','Estuche / Accesorios']), attr('proteccion', 'Protección UV', 'select', ['UV400','Polarizado','Fotocromático'])],

  // ════════════════════════════════════════════════════════════════════════════
  // MASCOTAS
  // ════════════════════════════════════════════════════════════════════════════
  mascotas: [attr('mascota', 'Mascota', 'select', ['Perro','Gato','Ave','Pez / Acuario','Roedor','Reptil']), attr('tipo', 'Tipo de producto', 'select', ['Alimento','Accesorio','Juguete','Medicamento / Antiparasitario','Higiene','Transporte / Jaula']), MARCA],

  perros: [
    attr('tipo', 'Tipo de producto', 'select', ['Alimento seco (croquetas)','Alimento húmedo','Premio / Snack','Antiparasitario','Collar / Correa','Ropa','Cama / Casilla','Juguete','Higiene / Baño']),
    MARCA,
    attr('raza', 'Raza', 'select', ['Labrador','Golden Retriever','Bulldog','Poodle','Beagle','Pastor Alemán','Chihuahua','Dálmata','Razas pequeñas','Razas medianas','Razas grandes','Todas las razas']),
    attr('tamaño', 'Tamaño de la mascota', 'select', ['Mini (hasta 5 kg)','Pequeño (5-10 kg)','Mediano (10-25 kg)','Grande (25-45 kg)','Gigante (más de 45 kg)']),
  ],
  gatos: [
    attr('tipo', 'Tipo de producto', 'select', ['Alimento seco','Alimento húmedo','Premio','Arena sanitaria','Rascador','Cama','Juguete','Antiparasitario','Higiene']),
    MARCA,
    attr('raza', 'Raza', 'select', ['Todas las razas','Europeo común','Persa','Siamés','Maine Coon','Bengalí','Ragdoll']),
  ],
  otros_masc: [
    attr('mascota', 'Tipo de mascota', 'select', ['Ave (loro, canario, periquito)','Pez / Acuario','Hamster / Roedor','Conejo','Tortuga','Reptil']),
    attr('tipo', 'Tipo de producto', 'select', ['Alimento','Jaula / Terrario / Acuario','Accesorio','Medicamento','Higiene']),
    MARCA,
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // JUGUETES Y HOBBIES
  // ════════════════════════════════════════════════════════════════════════════
  juguetes: [
    MARCA, COLOR, ESTADO,
    attr('tipo', 'Tipo', 'select', ['Juguete de acción / Figura','Muñeca','Peluche','Juego de mesa','Puzzle / Rompecabezas','Educativo','LEGO / Bloques','Control remoto','Outdoor / Inflable','Arte y manualidades']),
    attr('edad', 'Edad recomendada', 'select', ['0-2 años','3-5 años','6-8 años','9-12 años','12+ años','Adultos']),
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // LIBROS Y REVISTAS
  // ════════════════════════════════════════════════════════════════════════════
  libros: [
    ESTADO,
    attr('tipo', 'Tipo', 'select', ['Novela / Ficción','No ficción','Manual / Técnico','Infantil / Juvenil','Cómic / Manga','Revista','Libro de texto']),
    attr('genero', 'Género', 'select', ['Ficción literaria','Ciencia ficción','Terror / Suspenso','Romance','Histórico','Autoayuda','Filosofía','Ciencia','Arte / Diseño','Economía / Negocios','Programación']),
    attr('editorial', 'Editorial'),
    attr('autor', 'Autor'),
    attr('idioma', 'Idioma', 'select', ['Español','Inglés','Portugués','Otro']),
  ],

  // ════════════════════════════════════════════════════════════════════════════
  // SERVICIOS
  // ════════════════════════════════════════════════════════════════════════════
  servicios: [attr('tipo', 'Tipo de servicio', 'select', ['Técnico / Reparación','Construcción / Reforma','Limpieza','Mudanza / Flete','Diseño / Creatividad','Educación / Clases','Salud / Bienestar','Otro']), attr('modalidad', 'Modalidad', 'select', ['A domicilio','En local / Taller','Remoto / Online','A convenir'])],

  serv_tecnico: [attr('tipo', 'Especialidad', 'select', ['Celulares / Tablets','Computadoras / Notebooks','Televisores / Electrónica','Electrodomésticos','Automotores / Mecánica','Plomería','Electricidad','Climatización / AA']), attr('modalidad', 'Modalidad', 'select', ['A domicilio','En taller','Remoto'])],
  serv_const:   [attr('tipo', 'Especialidad', 'select', ['Albañilería','Pintura','Electricidad','Plomería','Carpintería','Pisos','Yesería','Impermeabilización','Demolición','Diseño de interiores']), attr('modalidad', 'Modalidad', 'select', ['Presupuesto sin cargo','A convenir'])],
  serv_limpieza:[attr('tipo', 'Tipo', 'select', ['Limpieza hogareña','Limpieza de oficina','Post-obra','Limpieza de vidrios','Alfombras / Tapizados','Desinfección']), attr('frecuencia', 'Frecuencia', 'select', ['Por hora','Trabajo puntual','Semanal','Quincenal','Mensual'])],
  serv_mudanza: [attr('tipo', 'Tipo', 'select', ['Mudanza completa','Flete / Transporte de cosas','Solo carga y descarga','Embalaje y guardado']), attr('vehiculo', 'Vehículo', 'select', ['Camioneta','Camión chico','Camión grande','A convenir']), attr('distancia', 'Distancia', 'select', ['Barrio / Local','Misma ciudad','Interurbano','Larga distancia'])],

  // ════════════════════════════════════════════════════════════════════════════
  // DEFAULT
  // ════════════════════════════════════════════════════════════════════════════
  default: [MARCA, MODELO, COLOR, ESTADO],
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
