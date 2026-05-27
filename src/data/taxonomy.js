// src/data/taxonomy.js
// Biblioteca semántica principal de LOKAL
// Matching híbrido: keywords locales + contexto IA

export const TAXONOMY = [
  // =========================================================
  // ELECTRONICA Y TECNOLOGIA
  // =========================================================

  {
    id: 'electronica',
    parentId: null,
    keywords: [
      'electronica', 'electrónica', 'tecnologia', 'tecnología',
      'gadget', 'gadgets', 'dispositivo', 'dispositivos',
      'equipo electronico', 'articulo tech', 'aparato', 'smart device'
    ],
    aliases: [
      'tech', 'electro', 'articulos electronicos', 'dispositivos'
    ],
    brands: [
      'Samsung', 'Xiaomi', 'Motorola', 'Sony', 'Philips', 'LG'
    ],
    related: [
      'computacion', 'gaming', 'smartwatches', 'audio'
    ],
    intent: 'product',
    typical_attributes: [
      'marca', 'modelo', 'color', 'memoria', 'estado', 'garantia'
    ]
  },

  {
    id: 'celulares',
    parentId: 'electronica',
    keywords: [
      'celular', 'celulares', 'telefono', 'telefono movil',
      'smartphone', 'movil', 'equipo', 'android',
      'telefono usado', 'telefono nuevo', 'chip', 'dual sim'
    ],
    aliases: [
      'smartphones', 'moviles', 'telefonos'
    ],
    brands: [
      'Samsung', 'Motorola', 'Xiaomi', 'Apple', 'Nokia', 'Huawei'
    ],
    related: [
      'iphone', 'samsung_cel', 'motorola', 'xiaomi', 'accesorios_cel'
    ],
    intent: 'product',
    typical_attributes: [
      'marca', 'modelo', 'almacenamiento', 'ram', 'bateria', 'estado'
    ]
  },

  {
    id: 'iphone',
    parentId: 'celulares',
    keywords: [
      'iphone', 'iphone 11', 'iphone 12', 'iphone 13',
      'iphone 14', 'iphone 15', 'iphone pro', 'iphone max',
      'celular apple', 'apple phone', 'ios', 'iphone usado'
    ],
    aliases: [
      'apple iphone', 'ios phone', 'celu apple'
    ],
    brands: [
      'Apple'
    ],
    related: [
      'celulares', 'samsung_cel', 'xiaomi'
    ],
    intent: 'product',
    typical_attributes: [
      'capacidad', 'color', 'bateria', 'estado', 'icloud', 'caja'
    ]
  },

  {
    id: 'samsung_cel',
    parentId: 'celulares',
    keywords: [
      'samsung', 'galaxy', 'samsung a14', 'samsung s24',
      'samsung usado', 'samsung nuevo', 'galaxy a', 'galaxy s',
      'samsung ultra', 'android samsung', 'telefono samsung', 'celu samsung'
    ],
    aliases: [
      'galaxy phone', 'cel samsung'
    ],
    brands: [
      'Samsung'
    ],
    related: [
      'celulares', 'motorola', 'xiaomi'
    ],
    intent: 'product',
    typical_attributes: [
      'modelo', 'ram', 'almacenamiento', 'pantalla', 'camara', 'estado'
    ]
  },

  {
    id: 'motorola',
    parentId: 'celulares',
    keywords: [
      'motorola', 'moto g', 'moto edge', 'moto e',
      'motorola usado', 'motorola nuevo', 'celu moto', 'telefono moto',
      'moto g54', 'moto g84', 'android motorola', 'motorola edge'
    ],
    aliases: [
      'moto', 'cel moto'
    ],
    brands: [
      'Motorola'
    ],
    related: [
      'celulares', 'samsung_cel', 'xiaomi'
    ],
    intent: 'product',
    typical_attributes: [
      'modelo', 'ram', 'almacenamiento', 'pantalla', 'camara', 'estado'
    ]
  },

  {
    id: 'xiaomi',
    parentId: 'celulares',
    keywords: [
      'xiaomi', 'redmi', 'poco', 'mi phone',
      'redmi note', 'xiaomi usado', 'xiaomi nuevo', 'celu xiaomi',
      'poco x', 'redmi 13', 'xiaomi 14', 'telefono xiaomi'
    ],
    aliases: [
      'mi', 'redmi phone', 'poco phone'
    ],
    brands: [
      'Xiaomi', 'Redmi', 'POCO'
    ],
    related: [
      'celulares', 'motorola', 'samsung_cel'
    ],
    intent: 'product',
    typical_attributes: [
      'modelo', 'ram', 'almacenamiento', 'pantalla', 'camara', 'estado'
    ]
  },

  {
    id: 'otros_cel',
    parentId: 'celulares',
    keywords: [
      'huawei', 'nokia', 'zte', 'alcatel',
      'oppo', 'realme', 'infinix', 'tecno',
      'google pixel', 'oneplus', 'vivo', 'sony xperia'
    ],
    aliases: [
      'otras marcas celulares', 'otros smartphones'
    ],
    brands: [
      'Huawei', 'Nokia', 'ZTE', 'Realme', 'Oppo', 'Google'
    ],
    related: [
      'celulares'
    ],
    intent: 'product',
    typical_attributes: [
      'marca', 'modelo', 'estado', 'almacenamiento', 'ram'
    ]
  },

  {
    id: 'tablets',
    parentId: 'electronica',
    keywords: [
      'tablet', 'tablets', 'ipad', 'tablet samsung',
      'tablet lenovo', 'tablet grafica', 'pantalla tactil', 'tablet android',
      'tablet usada', 'tablet nueva', 'ipad air', 'ipad pro'
    ],
    aliases: [
      'tab', 'tablet pc'
    ],
    brands: [
      'Apple', 'Samsung', 'Lenovo', 'Huawei', 'Xiaomi'
    ],
    related: [
      'celulares', 'notebooks', 'computacion'
    ],
    intent: 'product',
    typical_attributes: [
      'pantalla', 'memoria', 'ram', 'estado', 'bateria'
    ]
  },

  {
    id: 'audio',
    parentId: 'electronica',
    keywords: [
      'audio', 'sonido', 'musica', 'parlante',
      'auricular', 'equipo de musica', 'home theater', 'bluetooth',
      'woofer', 'subwoofer', 'equipo audio', 'potencia'
    ],
    aliases: [
      'sonido', 'musica', 'audio profesional'
    ],
    brands: [
      'JBL', 'Sony', 'Philips', 'Pioneer', 'Marshall'
    ],
    related: [
      'auriculares', 'parlantes', 'eq_sonido', 'micros'
    ],
    intent: 'product',
    typical_attributes: [
      'potencia', 'conexion', 'marca', 'color', 'bluetooth'
    ]
  },

  {
    id: 'auriculares',
    parentId: 'audio',
    keywords: [
      'auricular', 'auriculares', 'headset', 'headphones',
      'in ear', 'earbuds', 'airpods', 'manos libres',
      'gaming headset', 'wireless earbuds', 'cascos gamer', 'auri bluetooth'
    ],
    aliases: [
      'headphones', 'cascos', 'auris'
    ],
    brands: [
      'Sony', 'JBL', 'HyperX', 'Redragon', 'Apple', 'Samsung'
    ],
    related: [
      'audio', 'parlantes', 'perifericos'
    ],
    intent: 'product',
    typical_attributes: [
      'conexion', 'bluetooth', 'color', 'microfono', 'marca'
    ]
  },

  {
    id: 'parlantes',
    parentId: 'audio',
    keywords: [
      'parlante', 'parlantes', 'speaker', 'bafle',
      'torre sonido', 'bluetooth speaker', 'woofer', 'subwoofer',
      'jbl partybox', 'equipo portatil', 'parlante usb', 'parlante portatil'
    ],
    aliases: [
      'speakers', 'bafles', 'torres'
    ],
    brands: [
      'JBL', 'Sony', 'Philips', 'Marshall', 'LG'
    ],
    related: [
      'audio', 'eq_sonido', 'micros'
    ],
    intent: 'product',
    typical_attributes: [
      'potencia', 'bluetooth', 'bateria', 'conexion', 'marca'
    ]
  },

  {
    id: 'eq_sonido',
    parentId: 'audio',
    keywords: [
      'equipo sonido', 'home theater', 'minicomponente', 'equipo musica',
      'amplificador', 'receiver', 'mixer', 'consola audio',
      'karaoke', 'sonido profesional', 'potencia audio', 'rack sonido'
    ],
    aliases: [
      'equipo audio', 'sonido profesional'
    ],
    brands: [
      'Pioneer', 'Yamaha', 'Sony', 'Philips', 'Behringer'
    ],
    related: [
      'audio', 'parlantes', 'micros'
    ],
    intent: 'product',
    typical_attributes: [
      'potencia', 'canales', 'conexion', 'marca', 'uso'
    ]
  },

  {
    id: 'micros',
    parentId: 'audio',
    keywords: [
      'microfono', 'microfonos', 'mic', 'micro usb',
      'micro condensador', 'microfono gamer', 'microfono streaming', 'micro inalambrico',
      'micrófono', 'microfono profesional', 'boom mic', 'lavalier'
    ],
    aliases: [
      'mic', 'micro', 'microfonos audio'
    ],
    brands: [
      'HyperX', 'Blue', 'Shure', 'Redragon', 'Logitech'
    ],
    related: [
      'audio', 'streaming', 'perifericos'
    ],
    intent: 'product',
    typical_attributes: [
      'conexion', 'tipo', 'patron', 'marca', 'uso'
    ]
  },

  {
    id: 'tv_video',
    parentId: 'electronica',
    keywords: [
      'tv', 'televisor', 'smart tv', 'tele',
      'pantalla', 'android tv', 'google tv', 'led',
      'oled', 'qled', '4k', 'television'
    ],
    aliases: [
      'tele', 'smart', 'pantalla tv'
    ],
    brands: [
      'Samsung', 'LG', 'Philips', 'Hisense', 'TCL'
    ],
    related: [
      'televisores', 'streaming', 'proyectores'
    ],
    intent: 'product',
    typical_attributes: [
      'pulgadas', 'resolucion', 'smart', 'marca', 'panel'
    ]
  },

  {
    id: 'televisores',
    parentId: 'tv_video',
    keywords: [
      'televisor', 'televisores', 'smart tv', 'tv led',
      'tv 4k', 'android tv', 'google tv', 'oled',
      'qled', 'tele samsung', 'tv lg', 'tele 50 pulgadas'
    ],
    aliases: [
      'tele', 'smart tv'
    ],
    brands: [
      'Samsung', 'LG', 'TCL', 'Hisense', 'Philips'
    ],
    related: [
      'tv_video', 'streaming', 'proyectores'
    ],
    intent: 'product',
    typical_attributes: [
      'pulgadas', 'resolucion', 'smart', 'panel', 'marca'
    ]
  },

  {
    id: 'proyectores',
    parentId: 'tv_video',
    keywords: [
      'proyector', 'proyectores', 'beam', 'mini beam',
      'proyector led', 'cine en casa', 'proyector portatil', 'proyector hd',
      'cañon', 'video beam', 'proyector smart', 'pantalla proyector'
    ],
    aliases: [
      'beam', 'video beam', 'cañon'
    ],
    brands: [
      'Epson', 'ViewSonic', 'Xiaomi', 'BenQ', 'Samsung'
    ],
    related: [
      'tv_video', 'streaming', 'fotografia'
    ],
    intent: 'product',
    typical_attributes: [
      'resolucion', 'lumens', 'conexion', 'marca', 'portatil'
    ]
  },

  {
    id: 'streaming',
    parentId: 'tv_video',
    keywords: [
      'chromecast', 'fire tv', 'roku', 'tv box',
      'android box', 'streaming tv', 'google chromecast', 'stick tv',
      'mi box', 'smart stick', 'tv streaming', 'media player'
    ],
    aliases: [
      'tv stick', 'media streaming'
    ],
    brands: [
      'Google', 'Amazon', 'Xiaomi', 'Roku'
    ],
    related: [
      'tv_video', 'televisores'
    ],
    intent: 'product',
    typical_attributes: [
      'resolucion', 'sistema', 'conexion', 'almacenamiento'
    ]
  },

  {
    id: 'fotografia',
    parentId: 'electronica',
    keywords: [
      'camara', 'fotografia', 'camara reflex', 'camara profesional',
      'camara mirrorless', 'lente', 'tripode', 'flash',
      'filmadora', 'gopro', 'drone camara', 'foto video'
    ],
    aliases: [
      'foto', 'camaras', 'video'
    ],
    brands: [
      'Canon', 'Nikon', 'Sony', 'GoPro', 'DJI'
    ],
    related: [
      'streaming', 'micros', 'gaming'
    ],
    intent: 'product',
    typical_attributes: [
      'megapixeles', 'lente', 'sensor', 'marca', 'estado'
    ]
  },

  {
    id: 'gaming',
    parentId: 'electronica',
    keywords: [
      'gaming', 'gamer', 'setup gamer', 'rgb',
      'streamer', 'pc gamer', 'consola gamer', 'juegos',
      'esports', 'game', 'setup', 'gaming room'
    ],
    aliases: [
      'gamer', 'videojuegos'
    ],
    brands: [
      'Razer', 'Redragon', 'HyperX', 'Logitech', 'Corsair'
    ],
    related: [
      'consolas', 'juegos_video', 'perifericos', 'computacion'
    ],
    intent: 'product',
    typical_attributes: [
      'rgb', 'marca', 'compatibilidad', 'modelo', 'estado'
    ]
  },

  {
    id: 'consolas',
    parentId: 'gaming',
    keywords: [
      'playstation', 'xbox', 'nintendo switch', 'ps5',
      'ps4', 'xbox series', 'consola', 'gaming console',
      'switch oled', 'play 5', 'playstation usada', 'xbox usada'
    ],
    aliases: [
      'play', 'consola gamer'
    ],
    brands: [
      'Sony', 'Microsoft', 'Nintendo'
    ],
    related: [
      'gaming', 'juegos_video', 'perifericos'
    ],
    intent: 'product',
    typical_attributes: [
      'almacenamiento', 'joystick', 'version', 'estado', 'accesorios'
    ]
  },

  {
    id: 'juegos_video',
    parentId: 'gaming',
    keywords: [
      'videojuego', 'juegos ps5', 'juegos xbox', 'juegos switch',
      'fifa', 'call of duty', 'minecraft', 'gta v',
      'god of war', 'ea sports fc', 'game digital', 'juego fisico'
    ],
    aliases: [
      'games', 'juegos consola'
    ],
    brands: [
      'Sony', 'Nintendo', 'Xbox', 'EA', 'Ubisoft'
    ],
    related: [
      'gaming', 'consolas'
    ],
    intent: 'product',
    typical_attributes: [
      'plataforma', 'edicion', 'estado', 'digital', 'fisico'
    ]
  },

  {
    id: 'perifericos',
    parentId: 'gaming',
    keywords: [
      'mouse', 'teclado', 'mousepad', 'joystick',
      'headset', 'control gamer', 'silla gamer', 'pad',
      'volante gamer', 'webcam gamer', 'teclado mecanico', 'mouse gamer'
    ],
    aliases: [
      'periferico', 'peripheral', 'accesorio gamer'
    ],
    brands: [
      'Logitech', 'Razer', 'Redragon', 'HyperX', 'Corsair', 'SteelSeries'
    ],
    related: [
      'gaming', 'computacion', 'acc_pc'
    ],
    intent: 'product',
    typical_attributes: [
      'marca', 'tipo', 'conexion', 'color', 'rgb', 'compatibilidad'
    ]
  },

  // =========================================================
  // COMPUTACION
  // =========================================================

  {
    id: 'computacion',
    parentId: null,
    keywords: [
      'computacion', 'pc', 'computadora', 'informatica',
      'hardware', 'software', 'equipo pc', 'desktop',
      'laptop', 'gabinete', 'cpu', 'tecnologia pc'
    ],
    aliases: [
      'informatica', 'pc y notebooks'
    ],
    brands: [
      'Intel', 'AMD', 'HP', 'Dell', 'Lenovo', 'Asus'
    ],
    related: [
      'electronica', 'gaming', 'serv_tecnico'
    ],
    intent: 'product',
    typical_attributes: [
      'procesador', 'ram', 'almacenamiento', 'estado', 'marca'
    ]
  },

  {
    id: 'notebooks',
    parentId: 'computacion',
    keywords: [
      'notebook', 'laptop', 'ultrabook', 'netbook',
      'macbook', 'portatil', 'laptop gamer', 'notebook usada',
      'notebook nueva', 'pc portatil', 'lenovo notebook', 'hp notebook'
    ],
    aliases: [
      'laptop', 'portatil'
    ],
    brands: [
      'Lenovo', 'HP', 'Dell', 'Asus', 'Acer', 'Apple'
    ],
    related: [
      'pcs', 'tablets', 'gaming'
    ],
    intent: 'product',
    typical_attributes: [
      'procesador', 'ram', 'ssd', 'pantalla', 'bateria'
    ]
  },


  // =========================================================
  // COMPUTACIÓN (continuación)
  // =========================================================

  {
  id: 'pcs',
parentId: 'computacion',
keywords: [
'pc',
'computadora',
'cpu',
'gabinete',
'pc gamer',
'pc armada',
'torre',
'desktop',
'computadora escritorio',
'pc usada',
'pc nueva',
'all in one',
'equipo pc',
'setup pc'
],
aliases: [
'computadora escritorio',
'desktop pc',
'cpu gamer',
'torre pc'
],
brands: [
'HP',
'Dell',
'Lenovo',
'Asus',
'Bangho',
'EXO'
],
related: [
'notebooks',
'componentes',
'monitores',
'gaming'
],
intent: 'product',
typical_attributes: [
'procesador',
'ram',
'almacenamiento',
'placa video',
'estado',
'gabinete'
]
},
{
id: 'monitores',
parentId: 'computacion',
keywords: [
'monitor',
'pantalla pc',
'monitor gamer',
'led',
'monitor 24',
'monitor 27',
'full hd',
'pantalla',
'monitor curvo',
'display',
'monitor usado',
'monitor nuevo',
'ips',
'144hz'
],
aliases: [
'pantalla pc',
'display',
'monitor led',
'monitor gamer'
],
brands: [
'Samsung',
'LG',
'ViewSonic',
'AOC',
'Philips',
'Sentey'
],
related: [
'pcs',
'componentes',
'gaming',
'acc_pc'
],
intent: 'product',
typical_attributes: [
'pulgadas',
'resolucion',
'hz',
'panel',
'conexion',
'estado'
]
},
{
id: 'componentes',
parentId: 'computacion',
keywords: [
'placa video',
'ram',
'procesador',
'mother',
'fuente',
'ssd',
'disco rigido',
'gpu',
'cpu intel',
'ryzen',
'cooler',
'gabinete gamer',
'placa madre',
'hardware'
],
aliases: [
'hardware pc',
'partes pc',
'componentes pc',
'repuestos pc'
],
brands: [
'Intel',
'AMD',
'Kingston',
'Corsair',
'Gigabyte',
'Asus'
],
related: [
'pcs',
'gaming',
'acc_pc',
'monitores'
],
intent: 'product',
typical_attributes: [
'compatibilidad',
'modelo',
'capacidad',
'socket',
'marca',
'estado'
]
},
{
id: 'impresoras',
parentId: 'computacion',
keywords: [
'impresora',
'multifuncion',
'scanner',
'impresora laser',
'impresora tinta',
'cartucho',
'toner',
'fotocopiadora',
'epson',
'wifi printer',
'impresora usada',
'impresora nueva',
'scanner hp',
'impresion'
],
aliases: [
'printer',
'multifuncion',
'scanner',
'copiadora'
],
brands: [
'Epson',
'HP',
'Brother',
'Canon',
'Lexmark',
'Pantum'
],
related: [
'computacion',
'papeleria',
'acc_pc',
'pcs'
],
intent: 'product',
typical_attributes: [
'tipo',
'wifi',
'color',
'sistema tinta',
'estado',
'conexion'
]
},
{
id: 'redes',
parentId: 'computacion',
keywords: [
'router',
'wifi',
'modem',
'repetidor',
'cable red',
'switch',
'internet',
'mesh',
'tp link',
'adaptador wifi',
'placa red',
'ethernet',
'antena wifi',
'redes'
],
aliases: [
'internet',
'wifi hogar',
'networking',
'conexion red'
],
brands: [
'TP-Link',
'Mercusys',
'Tenda',
'Huawei',
'Ubiquiti',
'Mikrotik'
],
related: [
'computacion',
'acc_pc',
'pcs',
'streaming'
],
intent: 'product',
typical_attributes: [
'velocidad',
'conexion',
'puertos',
'wifi',
'alcance',
'marca'
]
},
{
id: 'acc_pc',
parentId: 'computacion',
keywords: [
'mouse',
'teclado',
'pad mouse',
'webcam',
'parlantes pc',
'hub usb',
'adaptador',
'cooler notebook',
'soporte monitor',
'usb',
'lector tarjetas',
'accesorio pc',
'mouse gamer',
'teclado mecanico'
],
aliases: [
'accesorios pc',
'perifericos pc',
'gadgets pc',
'extras pc'
],
brands: [
'Logitech',
'Redragon',
'Genius',
'HyperX',
'Trust',
'Microsoft'
],
related: [
'componentes',
'pcs',
'gaming',
'perifericos'
],
intent: 'product',
typical_attributes: [
'conexion',
'compatibilidad',
'marca',
'rgb',
'tipo',
'color'
]
},
{
// =========================================================
  // ELECTRODOMÉSTICOS
  // =========================================================

  id: 'electrodomesticos',
parentId: null,
keywords: [
'electrodomestico',
'electro',
'heladera',
'lavarropas',
'microondas',
'cafetera',
'freidora aire',
'electro hogar',
'horno electrico',
'aspiradora',
'cocina electrica',
'secarropas',
'batidora',
'licuadora'
],
aliases: [
'electro hogar',
'electros',
'aparatos hogar',
'linea blanca'
],
brands: [
'Philips',
'Liliana',
'Atma',
'Peabody',
'Drean',
'Samsung'
],
related: [
'cocina_electro',
'frio',
'lavado',
'climatizacion'
],
intent: 'product',
typical_attributes: [
'marca',
'potencia',
'capacidad',
'color',
'estado',
'consumo'
]
},
{
id: 'cocina_electro',
parentId: 'electrodomesticos',
keywords: [
'microondas',
'cafetera',
'licuadora',
'batidora',
'freidora aire',
'pava electrica',
'horno electrico',
'procesadora',
'sandwichera',
'tostadora',
'anafe electrico',
'electro cocina',
'mixer',
'jugera'
],
aliases: [
'electros cocina',
'pequenos electro',
'electro cocina',
'cocina electrica'
],
brands: [
'Philips',
'Peabody',
'Atma',
'Liliana',
'Oster',
'Smartlife'
],
related: [
'electrodomesticos',
'cocina_hogar',
'microondas',
'freidoras'
],
intent: 'product',
typical_attributes: [
'potencia',
'capacidad',
'marca',
'funciones',
'color',
'consumo'
]
},
{
id: 'frio',
parentId: 'electrodomesticos',
keywords: [
'heladera',
'freezer',
'frigobar',
'heladera exhibidora',
'con freezer',
'no frost',
'enfriador',
'congelador',
'heladera usada',
'heladera nueva',
'side by side',
'frio hogar',
'refrigeracion',
'heladera inverter'
],
aliases: [
'refrigeracion',
'freezers',
'heladeras',
'frio'
],
brands: [
'Patrick',
'Gafa',
'Samsung',
'LG',
'Whirlpool',
'Electrolux'
],
related: [
'electrodomesticos',
'lavado',
'climatizacion',
'cocina_electro'
],
intent: 'product',
typical_attributes: [
'litros',
'tipo',
'color',
'consumo',
'estado',
'marca'
]
},
{
id: 'lavado',
parentId: 'electrodomesticos',
keywords: [
'lavarropas',
'secarropas',
'lavasecarropas',
'centrifugadora',
'lavado ropa',
'lavarropas automatico',
'drean',
'lavarropas usado',
'lavarropas nuevo',
'carga frontal',
'carga superior',
'lavado hogar',
'secadora',
'lavadora'
],
aliases: [
'lavadoras',
'lavado ropa',
'lavarropas automatico',
'secadoras'
],
brands: [
'Drean',
'Whirlpool',
'Samsung',
'LG',
'Electrolux',
'Patrick'
],
related: [
'electrodomesticos',
'frio',
'aspiradoras',
'limpieza'
],
intent: 'product',
typical_attributes: [
'capacidad',
'rpm',
'tipo carga',
'consumo',
'marca',
'estado'
]
},
{
id: 'climatizacion',
parentId: 'electrodomesticos',
keywords: [
'aire acondicionado',
'caloventor',
'ventilador',
'split',
'estufa',
'panel calefactor',
'climatizador',
'frio calor',
'turbo ventilador',
'aire frio calor',
'radiador electrico',
'calefaccion',
'climatizacion hogar',
'ventilador techo'
],
aliases: [
'aire',
'calefaccion',
'ventilacion',
'frio calor'
],
brands: [
'BGH',
'Philco',
'Surrey',
'Midea',
'Samsung',
'Liliana'
],
related: [
'electrodomesticos',
'frio',
'aspiradoras',
'hogar'
],
intent: 'product',
typical_attributes: [
'frigorias',
'potencia',
'consumo',
'tipo',
'marca',
'color'
]
},
{
id: 'aspiradoras',
parentId: 'electrodomesticos',
keywords: [
'aspiradora',
'robot aspiradora',
'aspiradora escoba',
'aspiradora agua polvo',
'limpieza hogar',
'robot limpieza',
'aspiradora inalambrica',
'trapeadora',
'aspiradora usada',
'aspiradora nueva',
'roomba',
'limpia alfombra',
'aspirado',
'aspiradora industrial'
],
aliases: [
'robot limpieza',
'aspirado',
'limpiadora',
'aspiradoras hogar'
],
brands: [
'Philips',
'Liliana',
'Electrolux',
'Atma',
'Samsung',
'iRobot'
],
related: [
'electrodomesticos',
'limpieza',
'lavado',
'hogar'
],
intent: 'product',
typical_attributes: [
'potencia',
'tipo',
'bateria',
'capacidad',
'marca',
'estado'
]
},
{
// =========================================================
  // FERRETERÍA Y HERRAMIENTAS
  // =========================================================

  id: 'ferreteria',
parentId: null,
keywords: [
'ferreteria',
'herramientas',
'tornillos',
'taladro',
'pinza',
'llave francesa',
'bulones',
'herramienta mano',
'caja herramientas',
'destornillador',
'amoladora',
'insumos obra',
'ferreteria industrial',
'clavos'
],
aliases: [
'ferretera',
'herramientas hogar',
'insumos ferreteria',
'herramientas obra'
],
brands: [
'Black+Decker',
'Stanley',
'Bosch',
'Makita',
'Gamma',
'Einhell'
],
related: [
'herr_electricas',
'herr_manuales',
'construccion',
'materiales_const'
],
intent: 'product',
typical_attributes: [
'marca',
'medida',
'material',
'potencia',
'uso',
'tipo'
]
},
{
id: 'herr_electricas',
parentId: 'ferreteria',
keywords: [
'taladro',
'amoladora',
'caladora',
'atornillador',
'soldadora',
'rotomartillo',
'lijadora',
'sierra circular',
'herramienta electrica',
'martillo demoledor',
'cortadora',
'gamma',
'bosch',
'makita'
],
aliases: [
'electricas',
'herramientas electricas',
'maquinas electricas',
'power tools'
],
brands: [
'Bosch',
'Makita',
'DeWalt',
'Gamma',
'Einhell',
'Black+Decker'
],
related: [
'ferreteria',
'herr_manuales',
'soldadura',
'construccion'
],
intent: 'product',
typical_attributes: [
'potencia',
'voltaje',
'marca',
'bateria',
'uso',
'estado'
]
},
{
id: 'herr_manuales',
parentId: 'ferreteria',
keywords: [
'martillo',
'pinza',
'destornillador',
'llave inglesa',
'llave tubo',
'cinta metrica',
'serrucho',
'alicate',
'cutter',
'nivel',
'herramienta manual',
'llave francesa',
'saca clavos',
'set herramientas'
],
aliases: [
'herramientas mano',
'manuales',
'kit herramientas',
'herramientas hogar'
],
brands: [
'Stanley',
'Tramontina',
'Crossmaster',
'Bremen',
'Bahco',
'Total'
],
related: [
'ferreteria',
'herr_electricas',
'construccion',
'fijaciones'
],
intent: 'product',
typical_attributes: [
'material',
'medida',
'marca',
'tipo',
'cantidad',
'uso'
]
},
{
// =========================================================
  // CONSTRUCCIÓN Y MATERIALES
  // =========================================================

  id: 'construccion',
parentId: null,
keywords: [
'construccion',
'obra',
'cemento',
'ladrillos',
'arena',
'hierro',
'corralon',
'materiales obra',
'reforma',
'techo',
'durlock',
'ceramicos',
'bloques',
'mezcla'
],
aliases: [
'obra gruesa',
'materiales construccion',
'obra hogar',
'reformas'
],
brands: [
'Loma Negra',
'Acindar',
'Cerro Negro',
'Plavicon',
'Sinteplast',
'Weber'
],
related: [
'materiales_const',
'pintura_const',
'ferreteria',
'serv_const'
],
intent: 'both',
typical_attributes: [
'cantidad',
'medida',
'material',
'uso',
'marca',
'entrega'
]
},
{
id: 'materiales_const',
parentId: 'construccion',
keywords: [
'cemento',
'ladrillos',
'arena',
'piedra',
'cal',
'bloques',
'hierro construccion',
'perfil',
'durlock',
'yeso',
'viguetas',
'materiales obra',
'mezcla',
'chapas'
],
aliases: [
'materiales obra',
'materiales construccion',
'obra gruesa',
'insumos obra'
],
brands: [
'Loma Negra',
'Acindar',
'Durlock',
'Weber',
'Cerro Negro',
'Tersuave'
],
related: [
'construccion',
'pintura_const',
'ferreteria',
'pisos'
],
intent: 'product',
typical_attributes: [
'cantidad',
'medida',
'peso',
'material',
'marca',
'tipo'
]
},
{
id: 'pintura_const',
parentId: 'construccion',
keywords: [
'pintura',
'latex',
'esmalte sintetico',
'rodillo',
'membrana',
'revestimiento',
'enduido',
'impermeabilizante',
'satinado',
'mate',
'pintura exterior',
'pintura interior',
'pincel',
'thinner'
],
aliases: [
'pintureria',
'revestimientos',
'pinturas hogar',
'insumos pintura'
],
brands: [
'Sinteplast',
'Alba',
'Sherwin Williams',
'Plavicon',
'Tersuave',
'Petrilac'
],
related: [
'construccion',
'materiales_const',
'decoracion',
'ferreteria'
],
intent: 'product',
typical_attributes: [
'color',
'litros',
'acabado',
'uso',
'marca',
'superficie'
]
},
{
// =========================================================
  // ROPA, CALZADO Y ACCESORIOS
  // =========================================================

  id: 'ropa',
parentId: null,
keywords: [
'ropa',
'remera',
'pantalon',
'campera',
'buzo',
'jean',
'ropa usada',
'ropa nueva',
'indumentaria',
'ropa deportiva',
'ropa invierno',
'ropa verano',
'outfit',
'pilcha'
],
aliases: [
'indumentaria',
'pilcha',
'ropa vestir',
'moda'
],
brands: [
'Adidas',
'Nike',
'Topper',
'Kevingston',
'Mistral',
'Levis'
],
related: [
'ropa_hombre',
'ropa_mujer',
'calzado',
'accesorios_ropa'
],
intent: 'product',
typical_attributes: [
'talle',
'color',
'marca',
'material',
'temporada',
'estado'
]
},
{
id: 'ropa_hombre',
parentId: 'ropa',
keywords: [
'ropa hombre',
'camisa hombre',
'jean hombre',
'remera hombre',
'campera hombre',
'bermuda',
'boxer',
'ropa masculina',
'buzo hombre',
'ropa vestir hombre',
'chomba',
'traje hombre',
'ropa urbana',
'jogger hombre'
],
aliases: [
'hombre',
'moda hombre',
'ropa masculina',
'indumentaria hombre'
],
brands: [
'Kevingston',
'Levis',
'Adidas',
'Nike',
'Topper',
'Mistral'
],
related: [
'ropa',
'calzado',
'accesorios_ropa',
'ropa_mujer'
],
intent: 'product',
typical_attributes: [
'talle',
'color',
'marca',
'fit',
'material',
'estado'
]
},
{
id: 'ropa_mujer',
parentId: 'ropa',
keywords: [
'ropa mujer',
'vestido',
'top',
'calza',
'jean mujer',
'blusa',
'ropa femenina',
'campera mujer',
'ropa interior',
'bikini',
'falda',
'buzo mujer',
'remera mujer',
'outfit mujer'
],
aliases: [
'moda mujer',
'ropa femenina',
'indumentaria mujer',
'ropa dama'
],
brands: [
'47 Street',
'Zara',
'Kosiuko',
'Adidas',
'Nike',
'Ayres'
],
related: [
'ropa',
'calzado',
'accesorios_ropa',
'ropa_ninos'
],
intent: 'product',
typical_attributes: [
'talle',
'color',
'marca',
'temporada',
'material',
'estado'
]
},
{
id: 'ropa_ninos',
parentId: 'ropa',
keywords: [
'ropa niños',
'ropa bebe',
'conjunto niño',
'guardapolvo',
'remera niño',
'campera niño',
'jardin infantes',
'ropa escolar',
'ropa infantil',
'pantalon niño',
'pijama niño',
'body bebe',
'ropa nena',
'ropa varon'
],
aliases: [
'ropa infantil',
'ropa chicos',
'ropa bebe',
'indumentaria niños'
],
brands: [
'Mimo',
'Cheeky',
'Carters',
'Grisino',
'Adidas',
'Nike'
],
related: [
'ropa',
'bebes',
'calzado',
'juguetes'
],
intent: 'product',
typical_attributes: [
'edad',
'talle',
'color',
'material',
'marca',
'temporada'
]
},
{
id: 'calzado',
parentId: null,
keywords: [
'zapatillas',
'zapatos',
'botas',
'sandalias',
'ojotas',
'botines',
'calzado deportivo',
'pantuflas',
'zapatillas urbanas',
'crocs',
'calzado hombre',
'calzado mujer',
'borcegos',
'alpargatas'
],
aliases: [
'zapatos',
'zapas',
'calzado deportivo',
'footwear'
],
brands: [
'Nike',
'Adidas',
'Topper',
'Puma',
'Fila',
'Vans'
],
related: [
'ropa',
'futbol',
'running',
'accesorios_ropa'
],
intent: 'product',
typical_attributes: [
'talle',
'color',
'marca',
'material',
'tipo',
'estado'
]
},
{
id: 'accesorios_ropa',
parentId: 'ropa',
keywords: [
'gorra',
'cinturon',
'bufanda',
'mochila',
'billetera',
'lentes sol',
'reloj',
'pañuelo',
'riñonera',
'cartera',
'accesorios moda',
'sombrero',
'guantes',
'mochila urbana'
],
aliases: [
'accesorios moda',
'complementos',
'extras ropa',
'fashion accessories'
],
brands: [
'Adidas',
'Nike',
'Jansport',
'Rusty',
'47 Street',
'Topper'
],
related: [
'ropa',
'calzado',
'bolsas',
'joyeria'
],
intent: 'product',
typical_attributes: [
'color',
'material',
'marca',
'tipo',
'tamaño',
'genero'
]
},




  // =========================================================
  // INSTRUMENTOS MUSICALES
  // =========================================================

  {
    id: 'instrumentos',
    parentId: null,
    keywords: [
      'guitarra', 'bajo', 'bateria', 'teclado musical',
      'piano', 'microfono musical', 'violin', 'instrumento musical',
      'amplificador guitarra', 'pedalera', 'ukelele', 'percusion'
    ],
    aliases: [
      'instrumentos musicales', 'musica'
    ],
    brands: [
      'Fender', 'Yamaha', 'Ibanez', 'Casio', 'Roland'
    ],
    related: [
      'audio', 'micros'
    ],
    intent: 'product',
    typical_attributes: [
      'marca', 'modelo', 'tipo', 'estado', 'material'
    ]
  },

  // =========================================================
  // PAPELERÍA Y LIBRERÍA
  // =========================================================

  {
    id: 'papeleria',
    parentId: null,
    keywords: [
      'cuaderno', 'lapicera', 'resaltador', 'hojas a4',
      'carpeta', 'utiles escolares', 'papel', 'cartuchera',
      'impresion', 'fotocopia', 'marcadores', 'agenda'
    ],
    aliases: [
      'libreria', 'oficina'
    ],
    brands: [
      'Rivadavia', 'Filgo', 'Mooving', 'Maped', 'Faber Castell'
    ],
    related: [
      'libros', 'impresoras'
    ],
    intent: 'product',
    typical_attributes: [
      'cantidad', 'color', 'tamaño', 'marca'
    ]
  },

  // =========================================================
  // AGROPECUARIA
  // =========================================================

  {
    id: 'agro',
    parentId: null,
    keywords: [
      'tractor', 'fumigadora', 'semillas', 'balanceado',
      'alambrado', 'boyero', 'motosierra', 'desmalezadora',
      'herramienta rural', 'campo', 'agropecuaria', 'maquinaria agricola'
    ],
    aliases: [
      'campo', 'rural', 'agropecuario'
    ],
    brands: [
      'Stihl', 'Husqvarna', 'John Deere', 'Petri', 'Honda'
    ],
    related: [
      'ferreteria', 'jardin', 'construccion'
    ],
    intent: 'both',
    typical_attributes: [
      'marca', 'potencia', 'uso', 'estado', 'capacidad'
    ]
  },

  // =========================================================
  // BEBÉS Y PUERICULTURA
  // =========================================================

  {
    id: 'bebes',
    parentId: null,
    keywords: [
      'cochecito', 'pañales', 'mamadera', 'bebe',
      'ropa bebe', 'huevito', 'cuna', 'andador',
      'silla comer bebe', 'chupete', 'puericultura', 'moises'
    ],
    aliases: [
      'puericultura', 'bebes y niños'
    ],
    brands: [
      'Chicco', 'Graco', 'Infanti', 'Pampers', 'Huggies'
    ],
    related: [
      'ropa_ninos', 'juguetes'
    ],
    intent: 'product',
    typical_attributes: [
      'edad', 'marca', 'material', 'color', 'estado'
    ]
  },

  // =========================================================
  // PLANTAS Y JARDINERÍA
  // =========================================================

  {
    id: 'plantas',
    parentId: null,
    keywords: [
      'planta', 'maceta', 'suculenta', 'cactus',
      'tierra fertil', 'semillas', 'flor', 'planta interior',
      'planta exterior', 'vivero', 'abono', 'fertilizante'
    ],
    aliases: [
      'vivero', 'jardineria'
    ],
    brands: [
      'Terrafertil', 'Anasac'
    ],
    related: [
      'jardin', 'agro'
    ],
    intent: 'both',
    typical_attributes: [
      'tipo', 'tamaño', 'maceta', 'interior', 'exterior'
    ]
  },

  // =========================================================
  // SERVICIOS EXTENDIDOS
  // =========================================================

  {
    id: 'serv_gastronomia',
    parentId: 'servicios',
    keywords: [
      'delivery', 'viandas', 'pizza', 'hamburguesas',
      'comida casera', 'catering', 'rotiseria', 'empanadas',
      'comida por kilo', 'sandwiches', 'almuerzo', 'cena'
    ],
    aliases: [
      'gastronomia', 'comida'
    ],
    brands: [],
    related: [
      'alimentos', 'panificados'
    ],
    intent: 'service',
    typical_attributes: [
      'zona', 'horario', 'delivery', 'porciones', 'menu'
    ]
  },

  {
    id: 'serv_fotografia',
    parentId: 'servicios',
    keywords: [
      'fotografo', 'fotografia eventos', 'sesion fotos', 'cumpleaños',
      'casamiento', 'video boda', 'reels', 'filmacion',
      'drone', 'produccion audiovisual', '15 años', 'book fotos'
    ],
    aliases: [
      'foto y video', 'audiovisual'
    ],
    brands: [],
    related: [
      'fotografia'
    ],
    intent: 'service',
    typical_attributes: [
      'duracion', 'evento', 'cantidad fotos', 'edicion', 'zona'
    ]
  },

  {
    id: 'serv_diseno',
    parentId: 'servicios',
    keywords: [
      'diseño grafico', 'logos', 'branding', 'flyers',
      'community manager', 'editor video', 'identidad visual', 'posteos',
      'miniaturas youtube', 'reels', 'social media', 'diseñador'
    ],
    aliases: [
      'diseño', 'marketing digital'
    ],
    brands: [],
    related: [
      'serv_fotografia'
    ],
    intent: 'service',
    typical_attributes: [
      'entrega', 'revision', 'formato', 'estilo', 'cantidad'
    ]
  },

  // =========================================================
  // ALIMENTOS Y BEBIDAS
  // =========================================================

  {
    id: 'alimentos',
    parentId: null,
    keywords: [
      'comida', 'alimentos', 'viveres', 'despensa', 'mercaderia',
      'fiambreria', 'almacen', 'dietética', 'golosinas', 'snacks',
      'conservas', 'enlatados', 'dietético', 'natural'
    ],
    aliases: [ 'comestibles', 'viveres', 'mercaderia' ],
    brands: [ 'Arcor', 'Mastellone', 'Molinos', 'La Serenísima' ],
    related: [ 'frescos', 'bebidas', 'panificados' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'peso', 'vencimiento', 'origen', 'tipo', 'presentación' ]
  },
  {
    id: 'alimentos_secos',
    parentId: 'alimentos',
    keywords: [
      'arroz', 'fideos', 'lentejas', 'garbanzos', 'porotos',
      'harina', 'azucar', 'sal', 'aceite', 'polenta',
      'yerba', 'te', 'cafe', 'legumbres'
    ],
    aliases: [ 'despensa', 'secos', 'almacen seco' ],
    brands: [ 'Molinos', 'Gallo', 'Arcor', 'Cabrales', 'Marolio' ],
    related: [ 'alimentos', 'panificados', 'frescos' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'peso', 'tipo', 'origen', 'presentación' ]
  },
  {
    id: 'bebidas',
    parentId: 'alimentos',
    keywords: [
      'gaseosa', 'agua', 'jugo', 'cerveza', 'vino',
      'fernet', 'aperitivo', 'soda', 'energizante', 'isotónica',
      'sidra', 'whisky', 'ron', 'gin'
    ],
    aliases: [ 'tragos', 'líquidos', 'bebibles' ],
    brands: [ 'Coca-Cola', 'Quilmes', 'Manaos', 'Pritty', 'Gatorade', 'Ades' ],
    related: [ 'alimentos', 'frescos', 'panificados' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'volumen', 'tipo', 'alcohol', 'presentación', 'sabor' ]
  },
  {
    id: 'frescos',
    parentId: 'alimentos',
    keywords: [
      'verdura', 'fruta', 'carne', 'pollo', 'cerdo',
      'pescado', 'fiambre', 'queso', 'leche', 'huevos',
      'yogur', 'manteca', 'crema', 'embutido'
    ],
    aliases: [ 'perecederos', 'refrigerados', 'lacteos' ],
    brands: [ 'La Serenísima', 'Sancor', 'Vienissima', 'Paladini', 'Fargo' ],
    related: [ 'alimentos', 'alimentos_secos', 'panificados' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'peso', 'vencimiento', 'tipo', 'origen' ]
  },
  {
    id: 'panificados',
    parentId: 'alimentos',
    keywords: [
      'pan', 'facturas', 'medialunas', 'bizcochos', 'tortas',
      'galletitas', 'tostadas', 'pan lactal', 'budín', 'madalenas',
      'alfajor', 'pan de campo', 'baguette', 'pan integral'
    ],
    aliases: [ 'panaderia', 'bollería', 'horneados' ],
    brands: [ 'Fargo', 'Bimbo', 'Bagley', 'Arcor', 'La Española' ],
    related: [ 'alimentos', 'frescos', 'alimentos_secos' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'tipo', 'peso', 'ingredientes', 'vencimiento' ]
  },
  {
    id: 'limpieza',
    parentId: 'alimentos',
    keywords: [
      'detergente', 'lavandina', 'desengrasante', 'jabón en polvo',
      'suavizante', 'limpiador', 'esponja', 'trapo de piso',
      'escoba', 'trapeador', 'bolsa de basura', 'desodorante ambiente',
      'lustramuebles', 'limpiavidrios'
    ],
    aliases: [ 'productos de limpieza', 'articulos limpieza', 'insumos hogar' ],
    brands: [ 'Skip', 'Ala', 'Magistral', 'Cif', 'Ayudín', 'Fabuloso' ],
    related: [ 'alimentos', 'higiene', 'hogar' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'volumen', 'tipo', 'fragancia', 'presentación' ]
  },
  {
    id: 'higiene',
    parentId: 'alimentos',
    keywords: [
      'shampoo', 'acondicionador', 'jabón', 'pasta dental', 'cepillo de dientes',
      'desodorante', 'papel higiénico', 'toallitas', 'pañales', 'crema corporal',
      'afeitadora', 'gillette', 'tampón', 'toalla femenina'
    ],
    aliases: [ 'higiene personal', 'cuidado personal', 'tocador' ],
    brands: [ 'Dove', 'Gillette', 'Pantene', 'Huggies', 'Sedal', 'Kolynos' ],
    related: [ 'limpieza', 'salud', 'cuidado_pers' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'tipo', 'volumen', 'fragancia', 'piel' ]
  },
  // =========================================================
  // SALUD Y BELLEZA
  // =========================================================

  {
    id: 'salud',
    parentId: null,
    keywords: [
      'remedios', 'farmacia', 'vitaminas', 'suplementos', 'termómetro',
      'tensiómetro', 'nebulizador', 'glucómetro', 'mascarilla', 'barbijo',
      'alcohol en gel', 'venda', 'ortopedia', 'médico'
    ],
    aliases: [ 'farmacia', 'salud y bienestar', 'medicamentos' ],
    brands: [ 'Bayer', 'Pfizer', 'Roche', 'Britania', 'Gador' ],
    related: [ 'medicamentos', 'higiene', 'cuidado_pers' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'tipo', 'dosis', 'presentación', 'uso', 'vencimiento' ]
  },
  {
    id: 'medicamentos',
    parentId: 'salud',
    keywords: [
      'ibuprofeno', 'paracetamol', 'amoxicilina', 'omeprazol', 'loratadina',
      'antibiótico', 'antiinflamatorio', 'analgésico', 'jarabe', 'pastillas',
      'comprimidos', 'crema medicada', 'gotas', 'inyectable'
    ],
    aliases: [ 'remedios', 'fármacos', 'medicinas' ],
    brands: [ 'Bayer', 'Gador', 'Roemmers', 'Pfizer', 'Bagó' ],
    related: [ 'salud', 'higiene', 'cuidado_pers' ],
    intent: 'product',
    typical_attributes: [ 'principio activo', 'dosis', 'presentación', 'laboratorio', 'vencimiento' ]
  },
  {
    id: 'cuidado_pers',
    parentId: 'salud',
    keywords: [
      'crema facial', 'serum', 'protector solar', 'maquillaje', 'base',
      'labial', 'rimmel', 'sombras', 'perfume', 'loción',
      'mascarilla facial', 'exfoliante', 'aceite corporal', 'tónico'
    ],
    aliases: [ 'belleza', 'cosmética', 'cuidado de la piel' ],
    brands: [ 'Nivea', 'LOreal', 'Maybelline', 'Neutrogena', 'Dove', 'Revlon' ],
    related: [ 'salud', 'perfumes', 'higiene' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'tipo de piel', 'volumen', 'ingredientes', 'uso', 'fragancia' ]
  },
  {
    id: 'perfumes',
    parentId: 'salud',
    keywords: [
      'perfume', 'colonia', 'eau de toilette', 'eau de parfum', 'fragancia',
      'aroma', 'desodorante perfumado', 'body splash', 'after shave',
      'perfume importado', 'perfume original', 'mini perfume', 'set perfume'
    ],
    aliases: [ 'fragancias', 'colonias', 'aromas' ],
    brands: [ 'Chanel', 'Dior', 'Paco Rabanne', 'Carolina Herrera', 'Bvlgari', 'Cacharel' ],
    related: [ 'cuidado_pers', 'salud', 'higiene' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'volumen', 'concentración', 'género', 'familia olfativa' ]
  },
  {
    id: 'optica',
    parentId: 'salud',
    keywords: [
      'anteojos', 'lentes', 'armazón', 'lentes de contacto', 'solución lentes',
      'anteojos de sol', 'gafas', 'bifocales', 'progresivos', 'montura',
      'estuche lentes', 'limpiador lentes', 'lupas', 'miopía'
    ],
    aliases: [ 'anteojos', 'lentes oftalmológicos', 'óptica' ],
    brands: [ 'Oakley', 'Ray-Ban', 'Silhouette', 'Vogue', 'Transitions', 'Acuvue' ],
    related: [ 'salud', 'cuidado_pers' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'tipo', 'graduación', 'material', 'color', 'género' ]
  },
  // =========================================================
  // MASCOTAS
  // =========================================================

  {
    id: 'mascotas',
    parentId: null,
    keywords: [
      'mascota', 'animal', 'pet', 'veterinaria', 'alimento para mascotas',
      'collar', 'correa', 'jaula', 'acuario', 'terrario',
      'antiparasitario', 'pulgas', 'garrapatas', 'chip mascota'
    ],
    aliases: [ 'animales', 'pets', 'compañía animal' ],
    brands: [ 'Purina', 'Royal Canin', 'Pedigree', 'Whiskas', 'Bayer Animal' ],
    related: [ 'perros', 'gatos', 'otros_masc' ],
    intent: 'product',
    typical_attributes: [ 'especie', 'marca', 'tipo', 'tamaño', 'edad mascota' ]
  },
  {
    id: 'perros',
    parentId: 'mascotas',
    keywords: [
      'comida para perro', 'croquetas', 'pellet', 'snack perro', 'collar',
      'correa', 'arnés', 'cama perro', 'juguete perro', 'shampoo perro',
      'antiparasitario', 'ropa para perro', 'comedero', 'bebedero'
    ],
    aliases: [ 'caninos', 'canes', 'perritos' ],
    brands: [ 'Pedigree', 'Royal Canin', 'Dog Chow', 'Eukanuba', 'Proplan' ],
    related: [ 'mascotas', 'gatos', 'veterinaria' ],
    intent: 'product',
    typical_attributes: [ 'raza', 'tamaño', 'edad', 'marca', 'sabor', 'peso' ]
  },
  {
    id: 'gatos',
    parentId: 'mascotas',
    keywords: [
      'comida para gato', 'croquetas gato', 'arena para gatos', 'arenero',
      'rascador', 'juguete gato', 'collar gato', 'cama gato', 'shampoo gato',
      'antiparasitario gato', 'comedero gato', 'portabebés felino', 'snack gato'
    ],
    aliases: [ 'felinos', 'gatitos', 'mininos' ],
    brands: [ 'Whiskas', 'Royal Canin', 'Purina', 'Felix', 'Cat Chow' ],
    related: [ 'mascotas', 'perros', 'veterinaria' ],
    intent: 'product',
    typical_attributes: [ 'raza', 'edad', 'marca', 'sabor', 'peso', 'tipo' ]
  },
  {
    id: 'otros_masc',
    parentId: 'mascotas',
    keywords: [
      'pájaros', 'peces', 'hamster', 'conejo', 'tortuga', 'serpiente',
      'iguana', 'acuario', 'jaula pájaros', 'semillas pájaros',
      'alimento peces', 'filtro acuario', 'sustrato', 'terrario'
    ],
    aliases: [ 'animales exóticos', 'otras mascotas', 'roedores' ],
    brands: [ 'Sera', 'Tetra', 'Vitakraft', 'Versele-Laga', 'Trixie' ],
    related: [ 'mascotas', 'perros', 'gatos' ],
    intent: 'product',
    typical_attributes: [ 'especie', 'tipo', 'tamaño', 'marca', 'uso' ]
  },
  // =========================================================
  // JUGUETES Y HOBBIES
  // =========================================================

  {
    id: 'juguetes',
    parentId: null,
    keywords: [
      'juguete', 'muñeca', 'auto a escala', 'lego', 'rompecabezas',
      'juego de mesa', 'peluche', 'pelota', 'bicicleta nene', 'triciclo',
      'plastilina', 'pinturas', 'educativo', 'didáctico'
    ],
    aliases: [ 'juegos', 'diversión niños', 'toys' ],
    brands: [ 'Lego', 'Mattel', 'Hasbro', 'Duravit', 'Antex', 'Lionel' ],
    related: [ 'libros', 'deportes', 'hogar' ],
    intent: 'product',
    typical_attributes: [ 'edad recomendada', 'marca', 'tipo', 'material', 'género', 'tamaño' ]
  },
  // =========================================================
  // LIBROS Y REVISTAS
  // =========================================================

  {
    id: 'libros',
    parentId: null,
    keywords: [
      'libro', 'novela', 'revista', 'comic', 'manga', 'diccionario',
      'enciclopedia', 'libro de texto', 'libro técnico', 'cuento infantil',
      'libro usado', 'libro nuevo', 'coleccionable', 'fascículo'
    ],
    aliases: [ 'lectura', 'publicaciones', 'literatura' ],
    brands: [ 'Planeta', 'Sudamericana', 'Kapelusz', 'Siglo XXI', 'Clarín' ],
    related: [ 'juguetes', 'hogar', 'otros' ],
    intent: 'product',
    typical_attributes: [ 'autor', 'género', 'editorial', 'año', 'idioma', 'estado' ]
  },
  // =========================================================
  // DEPORTES Y FITNESS
  // =========================================================

  {
    id: 'deportes',
    parentId: null,
    keywords: [
      'deporte', 'equipamiento deportivo', 'ropa deportiva', 'zapatillas',
      'pelota', 'gimnasio', 'entrenamiento', 'fitness', 'outdoor',
      'camping', 'natación', 'ciclismo', 'fútbol', 'running'
    ],
    aliases: [ 'actividad física', 'sport', 'fitness' ],
    brands: [ 'Adidas', 'Nike', 'Puma', 'Under Armour', 'Reebok', 'Topper' ],
    related: [ 'gym', 'running', 'futbol', 'ciclismo', 'natacion' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'talle', 'deporte', 'género', 'estado', 'material' ]
  },
  {
    id: 'gym',
    parentId: 'deportes',
    keywords: [
      'pesas', 'mancuernas', 'banca', 'gimnasio',
      'entrenamiento', 'fitness', 'cinta correr', 'bicicleta fija',
      'pesa rusa', 'kettlebell', 'colchoneta', 'rack'
    ],
    aliases: [ 'fitness', 'musculacion', 'entreno' ],
    brands: [ 'Adidas', 'Nike', 'Reebok', 'BRK', 'Technogym' ],
    related: [ 'deportes', 'running', 'natacion' ],
    intent: 'product',
    typical_attributes: [ 'peso', 'marca', 'tipo', 'estado', 'material' ]
  },
  {
    id: 'ciclismo',
    parentId: 'deportes',
    keywords: [
      'bicicleta', 'rodado', 'bici de ruta', 'bici de montaña', 'bmx',
      'casco ciclismo', 'guantes ciclismo', 'cubiertas', 'caño', 'frenos',
      'cambios', 'portaequipaje', 'luz bici', 'candado'
    ],
    aliases: [ 'bici', 'ciclista', 'mountain bike' ],
    brands: [ 'Trek', 'Giant', 'Raleigh', 'Vairo', 'Olmo', 'Shimano' ],
    related: [ 'deportes', 'running', 'otros_dep' ],
    intent: 'product',
    typical_attributes: [ 'rodado', 'tipo', 'marca', 'material', 'velocidades', 'estado' ]
  },
  {
    id: 'futbol',
    parentId: 'deportes',
    keywords: [
      'pelota de fútbol', 'botines', 'canilleras', 'camiseta fútbol',
      'pantalón fútbol', 'arco', 'red arco', 'guantes arquero',
      'pelota Nro 5', 'pelota salón', 'gol', 'campo de juego', 'conjunto fútbol'
    ],
    aliases: [ 'fútbol', 'futsal', 'baby fútbol' ],
    brands: [ 'Adidas', 'Nike', 'Puma', 'Topper', 'Penalty', 'Umbro' ],
    related: [ 'deportes', 'running', 'otros_dep' ],
    intent: 'product',
    typical_attributes: [ 'talle', 'marca', 'tipo', 'categoría', 'número', 'estado' ]
  },
  {
    id: 'running',
    parentId: 'deportes',
    keywords: [
      'zapatillas running', 'ropa para correr', 'remera deportiva', 'short deportivo',
      'cintillo', 'medias deportivas', 'reloj deportivo', 'podómetro',
      'botella deportiva', 'riñonera', 'GPS running', 'malla térmica', 'trail'
    ],
    aliases: [ 'correr', 'atletismo', 'trotar' ],
    brands: [ 'Nike', 'Adidas', 'Asics', 'New Balance', 'Brooks', 'Mizuno' ],
    related: [ 'deportes', 'gym', 'natacion' ],
    intent: 'product',
    typical_attributes: [ 'talle', 'marca', 'género', 'tipo de pisada', 'superficie', 'color' ]
  },
  {
    id: 'natacion',
    parentId: 'deportes',
    keywords: [
      'malla', 'traje de baño', 'antiparras', 'gorra de natación',
      'tabla de natación', 'pull buoy', 'aletas', 'snorkel',
      'tapones oidos', 'bolso pileta', 'cronómetro acuático', 'kickboard'
    ],
    aliases: [ 'pileta', 'natatorio', 'piscina' ],
    brands: [ 'Speedo', 'Arena', 'TYR', 'Nike', 'Adidas', 'Aqua Sphere' ],
    related: [ 'deportes', 'gym', 'running' ],
    intent: 'product',
    typical_attributes: [ 'talle', 'marca', 'género', 'tipo', 'color', 'material' ]
  },
  {
    id: 'otros_dep',
    parentId: 'deportes',
    keywords: [
      'tenis', 'paddle', 'squash', 'vóleibol', 'básquet', 'hockey',
      'rugby', 'boxeo', 'artes marciales', 'yoga', 'pilates',
      'escalada', 'camping', 'pesca deportiva'
    ],
    aliases: [ 'otros deportes', 'deportes varios', 'actividades outdoor' ],
    brands: [ 'Wilson', 'Head', 'Babolat', 'Spalding', 'Molten', 'Everlast' ],
    related: [ 'deportes', 'gym', 'futbol' ],
    intent: 'product',
    typical_attributes: [ 'deporte', 'marca', 'talle', 'estado', 'material', 'tipo' ]
  },
  // =========================================================
  // AUTOMOTORES Y REPUESTOS
  // =========================================================

  {
    id: 'automotores',
    parentId: null,
    keywords: [
      'auto', 'coche', 'carro', 'sedan', 'hatchback', 'camioneta',
      'pickup', 'SUV', 'utilitario', '0km', 'usado', 'financiado',
      'permuta', 'vehículo'
    ],
    aliases: [ 'autos', 'vehículos', 'coches' ],
    brands: [ 'Ford', 'Chevrolet', 'Volkswagen', 'Toyota', 'Renault', 'Fiat' ],
    related: [ 'repuestos', 'acc_auto', 'motos' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'modelo', 'año', 'km', 'color', 'combustible', 'transmisión' ]
  },
  {
    id: 'repuestos',
    parentId: 'automotores',
    keywords: [
      'repuesto', 'autopartes', 'filtro aceite', 'filtro aire', 'pastillas de freno',
      'discos de freno', 'bujías', 'correa distribución', 'amortiguador',
      'radiador', 'batería auto', 'alternador', 'embrague', 'junta'
    ],
    aliases: [ 'autopartes', 'piezas auto', 'spare parts' ],
    brands: [ 'Bosch', 'NGK', 'Monroe', 'Brembo', 'SKF', 'Gates' ],
    related: [ 'automotores', 'acc_auto', 'lubricantes' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'compatibilidad', 'tipo', 'estado', 'número de parte' ]
  },
  {
    id: 'acc_auto',
    parentId: 'automotores',
    keywords: [
      'accesorios auto', 'tapetes', 'fundas asiento', 'alarma', 'cámara reversa',
      'GPS', 'stereo', 'parlantes auto', 'llave magnética', 'barra antirrobo',
      'paragolpes', 'spoiler', 'portaequipaje techo', 'espejo retrovisor'
    ],
    aliases: [ 'accesorios automotor', 'tunning', 'equipamiento auto' ],
    brands: [ 'Pioneer', 'Kenwood', 'Viper', 'Garmin', 'Thule', 'Bosch' ],
    related: [ 'automotores', 'repuestos', 'neumaticos' ],
    intent: 'product',
    typical_attributes: [ 'compatibilidad', 'marca', 'tipo', 'color', 'instalación' ]
  },
  {
    id: 'neumaticos',
    parentId: 'automotores',
    keywords: [
      'neumáticos', 'cubiertas', 'gomas', 'llanta', 'rodado auto',
      'cubierta 185/65', 'cubierta 195/55', 'auxilio', 'inflador',
      'alineación', 'balanceo', 'cubierta nueva', 'cubierta usada', 'cubierta moto'
    ],
    aliases: [ 'gomas', 'cubiertas', 'ruedas' ],
    brands: [ 'Bridgestone', 'Pirelli', 'Michelin', 'Fate', 'Firestone', 'Goodyear' ],
    related: [ 'automotores', 'repuestos', 'acc_auto' ],
    intent: 'product',
    typical_attributes: [ 'medida', 'marca', 'tipo', 'estado', 'indice de carga', 'estación' ]
  },
  {
    id: 'motos',
    parentId: 'automotores',
    keywords: [
      'moto', 'motocicleta', 'scooter', 'ciclomotor', 'enduro',
      'cross', 'naked', 'moto de ruta', 'moto usada', 'moto 0km',
      'casco moto', 'guantes moto', 'campera moto', 'pantalón moto'
    ],
    aliases: [ 'motocicletas', 'scooters', 'motoneta' ],
    brands: [ 'Honda', 'Yamaha', 'Bajaj', 'Zanella', 'Guerrero', 'Kawasaki' ],
    related: [ 'automotores', 'repuestos', 'neumaticos' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'modelo', 'año', 'cc', 'km', 'color', 'tipo' ]
  },
  {
    id: 'lubricantes',
    parentId: 'automotores',
    keywords: [
      'aceite motor', 'aceite 10w40', 'aceite sintético', 'aceite semisintético',
      'grasa', 'liquido de frenos', 'liquido refrigerante', 'aditivo',
      'aceite caja', 'aceite diferencial', 'spray lubricante', 'WD40', 'limpiador frenos'
    ],
    aliases: [ 'aceites', 'fluidos automotor', 'grasas' ],
    brands: [ 'Shell', 'Castrol', 'Mobil', 'YPF', 'Total', 'Gulf' ],
    related: [ 'automotores', 'repuestos', 'acc_auto' ],
    intent: 'product',
    typical_attributes: [ 'viscosidad', 'marca', 'tipo', 'litros', 'aplicación', 'norma API' ]
  },
  // =========================================================
  // SERVICIOS
  // =========================================================

  {
    id: 'servicios',
    parentId: null,
    keywords: [
      'servicio', 'reparación', 'instalación', 'mantenimiento', 'asesoramiento',
      'presupuesto', 'trabajo a domicilio', 'profesional', 'técnico', 'obrero',
      'albañil', 'plomero', 'electricista', 'gasista'
    ],
    aliases: [ 'servicios profesionales', 'trabajos', 'oficios' ],
    brands: [],
    related: [ 'serv_tecnico', 'serv_const', 'serv_limpieza' ],
    intent: 'service',
    typical_attributes: [ 'tipo de servicio', 'zona', 'disponibilidad', 'precio', 'experiencia' ]
  },
  {
    id: 'serv_tecnico',
    parentId: 'servicios',
    keywords: [
      'reparación celular', 'reparación PC', 'técnico computadora', 'service heladera',
      'reparación lavarropas', 'técnico aire acondicionado', 'reparación TV',
      'técnico electrodomésticos', 'instalación cámaras', 'cableado red',
      'soporte técnico', 'formateo', 'reparación notebook'
    ],
    aliases: [ 'técnico', 'service', 'reparaciones' ],
    brands: [],
    related: [ 'servicios', 'serv_const', 'electrodomesticos' ],
    intent: 'service',
    typical_attributes: [ 'tipo de equipo', 'zona', 'urgencia', 'garantía', 'disponibilidad' ]
  },
  {
    id: 'serv_const',
    parentId: 'servicios',
    keywords: [
      'albañilería', 'pintura', 'plomería', 'electricidad', 'gasista',
      'construcción', 'reformas', 'demolición', 'colocación pisos', 'revoque',
      'contrapiso', 'techado', 'membrana', 'herrería'
    ],
    aliases: [ 'construcción', 'refacciones', 'obras' ],
    brands: [],
    related: [ 'servicios', 'serv_limpieza', 'hogar' ],
    intent: 'service',
    typical_attributes: [ 'tipo de trabajo', 'zona', 'presupuesto', 'materiales incluidos', 'experiencia' ]
  },
  {
    id: 'serv_limpieza',
    parentId: 'servicios',
    keywords: [
      'limpieza del hogar', 'mucama', 'limpiadora', 'lavado de alfombras',
      'limpieza de tapizados', 'lavado de ropa', 'planchado', 'limpieza de vidrios',
      'desinfección', 'fumigación', 'limpieza de obras', 'limpieza comercial', 'mantenimiento edilicio'
    ],
    aliases: [ 'limpieza profesional', 'mucama', 'doméstica' ],
    brands: [],
    related: [ 'servicios', 'serv_mudanza', 'serv_const' ],
    intent: 'service',
    typical_attributes: [ 'tipo', 'frecuencia', 'zona', 'disponibilidad', 'referencias' ]
  },
  {
    id: 'serv_mudanza',
    parentId: 'servicios',
    keywords: [
      'mudanza', 'flete', 'transporte muebles', 'camión mudanza', 'traslado',
      'embalaje', 'desembalaje', 'carga y descarga', 'guardamuebles',
      'envíos', 'mensajería', 'acarreo', 'cotización mudanza'
    ],
    aliases: [ 'flete', 'traslado', 'transporte' ],
    brands: [],
    related: [ 'servicios', 'serv_limpieza', 'hogar' ],
    intent: 'service',
    typical_attributes: [ 'zona origen', 'zona destino', 'volumen', 'fecha', 'precio' ]
  },
  // =========================================================
  // HOGAR Y MUEBLES
  // =========================================================

  {
    id: 'hogar',
    parentId: null,
    keywords: [
      'mueble', 'electrodoméstico', 'heladera', 'lavarropas', 'cocina',
      'microondas', 'televisor', 'ventilador', 'calefactor', 'aire acondicionado',
      'aspiradora', 'licuadora', 'decoración', 'iluminación'
    ],
    aliases: [ 'casa', 'hogar y deco', 'living' ],
    brands: [ 'Philips', 'Samsung', 'LG', 'Whirlpool', 'Drean', 'Ariston' ],
    related: [ 'muebles', 'iluminacion', 'decoracion', 'cocina_hogar' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'tipo', 'estado', 'medidas', 'color', 'material' ]
  },
  {
    id: 'muebles',
    parentId: 'hogar',
    keywords: [
      'sillón', 'sofá', 'mesa', 'silla', 'placard', 'ropero',
      'cama', 'sommier', 'colchón', 'escritorio', 'biblioteca',
      'mueble de cocina', 'mesa de luz', 'cómoda'
    ],
    aliases: [ 'amoblamientos', 'mobiliario', 'living' ],
    brands: [ 'Deco', 'Rta Design', 'Pil', 'Tandem', 'Mussi', 'Cannon' ],
    related: [ 'hogar', 'decoracion', 'textiles' ],
    intent: 'product',
    typical_attributes: [ 'material', 'color', 'medidas', 'estado', 'estilo', 'marca' ]
  },
  {
    id: 'iluminacion',
    parentId: 'hogar',
    keywords: [
      'lámpara', 'luminaria', 'led', 'foco', 'aplique', 'araña',
      'velador', 'reflector', 'tira led', 'candileja', 'plafón',
      'farola', 'luz de emergencia', 'dimmer'
    ],
    aliases: [ 'lámparas', 'luces', 'luminarias' ],
    brands: [ 'Philips', 'Osram', 'GE', 'Ledvance', 'Interelec', 'Bellalux' ],
    related: [ 'hogar', 'decoracion', 'jardin' ],
    intent: 'product',
    typical_attributes: [ 'tipo', 'potencia', 'color de luz', 'marca', 'voltaje', 'conexión' ]
  },
  {
    id: 'decoracion',
    parentId: 'hogar',
    keywords: [
      'cuadro', 'espejo', 'alfombra', 'cortina', 'cojin', 'almohadón',
      'floreros', 'velas', 'portarretratos', 'reloj de pared',
      'figura decorativa', 'mantel', 'camino de mesa', 'estante'
    ],
    aliases: [ 'deco', 'ornamentos', 'ambientación' ],
    brands: [ 'Bianchi', 'Maisons du Monde', 'La Casa de las Telas', 'Easy', 'Sodimac' ],
    related: [ 'hogar', 'muebles', 'textiles' ],
    intent: 'product',
    typical_attributes: [ 'estilo', 'material', 'color', 'medidas', 'marca', 'estado' ]
  },
  {
    id: 'textiles',
    parentId: 'hogar',
    keywords: [
      'sábanas', 'frazada', 'acolchado', 'edredón', 'almohada',
      'toalla', 'toallón', 'mantel', 'cortina', 'cubrecama',
      'pie de cama', 'almohadón', 'repasador', 'hule'
    ],
    aliases: [ 'ropa de cama', 'blanquería', 'lencería del hogar' ],
    brands: [ 'Cannon', 'Andrés Landau', 'Isabel', 'Palermo', 'Pettit', 'Arco Iris' ],
    related: [ 'hogar', 'muebles', 'decoracion' ],
    intent: 'product',
    typical_attributes: [ 'material', 'medida', 'color', 'marca', 'hilo', 'estado' ]
  },
  {
    id: 'jardin',
    parentId: 'hogar',
    keywords: [
      'plantas', 'maceta', 'tierra', 'abono', 'herbicida', 'insecticida',
      'regadera', 'manguera', 'asador', 'parrilla', 'mesa jardín',
      'silla jardín', 'sombrilla', 'cortadora de césped'
    ],
    aliases: [ 'patio', 'terraza', 'exterior' ],
    brands: [ 'Tramontina', 'Black&Decker', 'Philco', 'Brill', 'Arbrex', 'Stocker' ],
    related: [ 'hogar', 'decoracion', 'iluminacion' ],
    intent: 'product',
    typical_attributes: [ 'tipo', 'material', 'medidas', 'marca', 'uso', 'estado' ]
  },
  {
    id: 'cocina_hogar',
    parentId: 'hogar',
    keywords: [
      'olla', 'sartén', 'cuchillo', 'tabla de cortar', 'licuadora',
      'batidora', 'procesadora', 'cafetera', 'pava eléctrica', 'tostadora',
      'heladera', 'microondas', 'horno eléctrico', 'set de cubiertos'
    ],
    aliases: [ 'utensilios de cocina', 'electrodomésticos cocina', 'menaje' ],
    brands: [ 'Tefal', 'Tramontina', 'Peabody', 'Philips', 'Oster', 'Ariston' ],
    related: [ 'hogar', 'muebles', 'textiles' ],
    intent: 'product',
    typical_attributes: [ 'material', 'marca', 'capacidad', 'tipo', 'estado', 'medidas' ]
  },
  {
    id: 'bano',
    parentId: 'hogar',
    keywords: [
      'inodoro', 'bidet', 'lavatorio', 'ducha', 'bañera', 'espejo baño',
      'toallero', 'porta papel', 'jabonera', 'cortina de baño',
      'alfombra de baño', 'vanitory', 'grifería', 'accesorios baño'
    ],
    aliases: [ 'sanitarios', 'baño completo', 'plomería baño' ],
    brands: [ 'FV', 'Ferrum', 'Piazza', 'Johnson', 'Corona', 'Roca' ],
    related: [ 'hogar', 'muebles', 'serv_const' ],
    intent: 'product',
    typical_attributes: [ 'material', 'marca', 'color', 'medidas', 'tipo', 'estado' ]
  },
  // =========================================================
  // OTROS
  // =========================================================

  {
    id: 'otros',
    parentId: null,
    keywords: [
      'varios', 'miscelaneos', 'sin categoría', 'articulo usado', 'coleccionable',
      'antigüedad', 'ropa', 'indumentaria', 'calzado', 'bijouterie',
      'accesorios', 'regalo', 'souvenirs', 'artesanías'
    ],
    aliases: [ 'varios', 'misceláneos', 'sin categoría' ],
    brands: [],
    related: [ 'hogar', 'juguetes', 'libros' ],
    intent: 'product',
    typical_attributes: [ 'tipo', 'estado', 'material', 'origen', 'precio' ]
  },


// ELECTRODOMÉSTICOS
  {
    id: 'microondas',
    parentId: 'cocina_hogar',
    keywords: [
      'microondas', 'horno microondas', 'micro', 'calienta comida',
      'microondas con grill', 'microondas digital', 'microondas mecánico',
      'plato giratorio', 'microondas 20 litros', 'microondas 30 litros',
      'microondas Samsung', 'microondas Teka', 'descongelar', 'recalentar'
    ],
    aliases: [ 'micro', 'horno micro', 'calienta comida' ],
    brands: [ 'Samsung', 'LG', 'Whirlpool', 'Philco', 'Teka', 'Peabody' ],
    related: [ 'cocina_hogar', 'hornos', 'electrodomesticos' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'litros', 'potencia', 'tipo', 'color', 'estado' ]
  },
  {
    id: 'licuadoras',
    parentId: 'cocina_hogar',
    keywords: [
      'licuadora', 'minipimer', 'mixer', 'procesadora', 'batidora',
      'licuadora de mano', 'licuadora de vaso', 'trituradora', 'smoothie',
      'batidora de pie', 'batidora de mesa', 'varillas', 'amasadora'
    ],
    aliases: [ 'mixer', 'minipimer', 'batidora' ],
    brands: [ 'Philips', 'Oster', 'Peabody', 'Black+Decker', 'KitchenAid', 'Moulinex' ],
    related: [ 'cocina_hogar', 'cafeteras', 'electrodomesticos' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'potencia', 'tipo', 'capacidad', 'velocidades', 'estado' ]
  },
  {
    id: 'cafeteras',
    parentId: 'cocina_hogar',
    keywords: [
      'cafetera', 'cafetera espresso', 'cafetera de filtro', 'cafetera italiana',
      'cafetera nespresso', 'cafetera dolce gusto', 'cápsula café', 'café en cápsulas',
      'pava eléctrica', 'termo eléctrico', 'mate eléctrico', 'cafetera de goteo'
    ],
    aliases: [ 'espresso', 'cafetera cápsulas', 'máquina de café' ],
    brands: [ 'Nespresso', 'Dolce Gusto', 'Oster', 'Philips', 'Peabody', 'Bialetti' ],
    related: [ 'cocina_hogar', 'licuadoras', 'microondas' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'tipo', 'presión', 'capacidad', 'compatibilidad cápsulas', 'estado' ]
  },
  {
    id: 'hornos',
    parentId: 'cocina_hogar',
    keywords: [
      'horno eléctrico', 'horno a gas', 'horno de piso', 'horno pizzero',
      'horno convector', 'horno con anafe', 'cocina a gas', 'anafe eléctrico',
      'anafe a gas', 'horno industrial', 'parrilla eléctrica', 'horno de empotrar'
    ],
    aliases: [ 'cocina', 'horno eléctrico', 'horno pizzero' ],
    brands: [ 'Longvie', 'Patrick', 'Domec', 'Ariston', 'Gafa', 'Orbis' ],
    related: [ 'cocina_hogar', 'microondas', 'freidoras' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'combustible', 'litros', 'potencia', 'medidas', 'estado' ]
  },
  {
    id: 'freidoras',
    parentId: 'cocina_hogar',
    keywords: [
      'freidora', 'freidora de aire', 'air fryer', 'freidora eléctrica',
      'freidora sin aceite', 'freidora industrial', 'papas fritas', 'frituras',
      'freidora 3 litros', 'freidora 5 litros', 'freidora doble canasta'
    ],
    aliases: [ 'air fryer', 'freidora aire', 'freidora eléctrica' ],
    brands: [ 'Philips', 'Oster', 'Peabody', 'Black+Decker', 'Midea', 'Liliana' ],
    related: [ 'cocina_hogar', 'hornos', 'microondas' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'capacidad', 'potencia', 'tipo', 'color', 'estado' ]
  },
  {
    id: 'planchado',
    parentId: 'cocina_hogar',
    keywords: [
      'plancha ropa', 'vaporizador', 'centro de planchado', 'plancha a vapor',
      'plancha de viaje', 'plancha inalámbrica', 'tabla de planchar',
      'cepillo de vapor', 'plancha vertical', 'plancha seca'
    ],
    aliases: [ 'plancha', 'vaporizador ropa', 'centro planchado' ],
    brands: [ 'Philips', 'Rowenta', 'Tefal', 'Black+Decker', 'Peabody', 'Electrolux' ],
    related: [ 'cocina_hogar', 'textiles', 'hogar' ],
    intent: 'product',
    typical_attributes: [ 'marca', 'potencia', 'tipo', 'suela', 'capacidad depósito', 'estado' ]
  },

  // CONSTRUCCIÓN
  {
    id: 'hierro_acero',
    parentId: 'serv_const',
    keywords: [
      'hierro', 'acero', 'varilla', 'malla soldada', 'perfil de acero',
      'caño estructural', 'ángulo', 'chapa', 'hierro redondo', 'hierro cuadrado',
      'hierro doblado', 'columna metálica', 'viga', 'metal'
    ],
    aliases: [ 'hierros', 'metalúrgica', 'acero estructural' ],
    brands: [ 'Acindar', 'Siderca', 'Ternium', 'Acerbrag', 'Gerdau' ],
    related: [ 'serv_const', 'madera', 'soldadura' ],
    intent: 'product',
    typical_attributes: [ 'tipo', 'medida', 'espesor', 'largo', 'estado', 'cantidad' ]
  },
  {
    id: 'madera',
    parentId: 'serv_const',
    keywords: [
      'madera', 'tabla', 'tirante', 'listón', 'terciado', 'fenólico',
      'MDF', 'OSB', 'madera de obra', 'machimbre', 'deck', 'parquet',
      'madera dura', 'pino', 'cedro', 'roble'
    ],
    aliases: [ 'maderera', 'maderas', 'carpintería' ],
    brands: [ 'Masisa', 'Arauco', 'Faplac', 'Duraplac', 'Kronospan' ],
    related: [ 'serv_const', 'pisos', 'hierro_acero' ],
    intent: 'product',
    typical_attributes: [ 'tipo', 'espesor', 'medidas', 'estado', 'especie', 'tratamiento' ]
  },
  {
    id: 'pisos',
    parentId: 'serv_const',
    keywords: [
      'piso', 'cerámico', 'porcelanato', 'parquet', 'vinílico', 'flotante',
      'baldosa', 'mosaico', 'revestimiento', 'azulejo', 'zócalo',
      'piso antideslizante', 'piso exterior', 'deck'
    ],
    aliases: [ 'revestimientos', 'cerámicos', 'pisos flotantes' ],
    brands: [ 'Porcelanosa', 'Alberdi', 'Johnson', 'Gres Aranda', 'Cortines' ],
    related: [ 'serv_const', 'madera', 'bano' ],
    intent: 'product',
    typical_attributes: [ 'tipo', 'medida', 'acabado', 'uso', 'marca', 'estado' ]
  },
  {
    id: 'plomeria',
    parentId: 'serv_const',
    keywords: [
      'caño', 'cañería', 'fitting', 'llave de paso', 'válvula',
      'termotanque', 'calefón', 'bomba de agua', 'sifón', 'trampa',
      'flexible', 'grifo', 'conexión agua', 'desagüe'
    ],
    aliases: [ 'plomería', 'sanitarios', 'instalación agua' ],
    brands: [ 'Tigre', 'FV', 'Orbis', 'Waterf', 'Ferrum', 'Rheem' ],
    related: [ 'serv_const', 'bano', 'electricidad' ],
    intent: 'product',
    typical_attributes: [ 'diámetro', 'material', 'tipo', 'presión', 'marca', 'estado' ]
  },
  {
    id: 'electricidad',
    parentId: 'serv_const',
    keywords: [
      'cable', 'cableado', 'tablero eléctrico', 'disyuntor', 'térmica',
      'enchufe', 'tomacorriente', 'interruptor', 'luz', 'toma de luz',
      'cable unipolar', 'cable bipolar', 'medidor', 'instalación eléctrica'
    ],
    aliases: [ 'electricidad', 'materiales eléctricos', 'instalación eléctrica' ],
    brands: [ 'Pial', 'Bticino', 'Schneider', 'Siemens', 'ABB', 'General Electric' ],
    related: [ 'serv_const', 'iluminacion', 'plomeria' ],
    intent: 'product',
    typical_attributes: [ 'sección', 'tipo', 'voltaje', 'marca', 'cantidad', 'uso' ]
  },

  // FERRETERÍA
  {
    id: 'fijaciones',
    parentId: 'serv_const',
    keywords: [
      'tornillo', 'clavo', 'tuerca', 'bulón', 'arandela', 'taco Fischer',
      'ancora', 'remache', 'gancho', 'grampas', 'tirafondo', 'espárrago',
      'tornillo autoperforante', 'barra roscada'
    ],
    aliases: [ 'ferretería', 'sujetadores', 'fijadores' ],
    brands: [ 'Fischer', 'Würth', 'Hilti', 'Bossard', 'Celo' ],
    related: [ 'serv_const', 'soldadura', 'herramientas' ],
    intent: 'product',
    typical_attributes: [ 'tipo', 'medida', 'material', 'cantidad', 'marca', 'uso' ]
  },
  {
    id: 'seguridad',
    parentId: 'serv_const',
    keywords: [
      'cerradura', 'candado', 'bisagra', 'picaporte', 'manija', 'cerrojo',
      'traba de seguridad', 'ojo mágico', 'puerta blindada', 'alarma casa',
      'cámara seguridad', 'sensor movimiento', 'caja fuerte', 'control de acceso'
    ],
    aliases: [ 'cerrajería', 'seguridad hogar', 'alarmas' ],
    brands: [ 'Puertas del Sur', 'Yale', 'Mul-T-Lock', 'Dahua', 'Hikvision', 'DSC' ],
    related: [ 'serv_const', 'fijaciones', 'hogar' ],
    intent: 'product',
    typical_attributes: [ 'tipo', 'marca', 'material', 'nivel de seguridad', 'estado', 'compatibilidad' ]
  },
  {
    id: 'soldadura',
    parentId: 'serv_const',
    keywords: [
      'soldadora', 'soldadora eléctrica', 'soldadora MIG', 'soldadora TIG',
      'electrodos', 'alambre de soldadura', 'careta de soldar', 'guantes soldador',
      'amoladora', 'esmeril', 'disco de corte', 'disco de desbaste', 'soplete'
    ],
    aliases: [ 'soldadura', 'soldador', 'equipo soldadura' ],
    brands: [ 'Lincoln Electric', 'Miller', 'ESAB', 'Gamma', 'Infra', 'Solter' ],
    related: [ 'serv_const', 'hierro_acero', 'fijaciones' ],
    intent: 'product',
    typical_attributes: [ 'tipo', 'amperaje', 'marca', 'proceso', 'estado', 'accesorios' ]
  },

  // ROPA
  {
    id: 'bolsas',
    parentId: null,
    keywords: [
      'cartera', 'bolso', 'mochila', 'riñonera', 'maletín', 'valija',
      'bolso de viaje', 'morral', 'tote bag', 'bandolera', 'clutch',
      'bolso de cuero', 'mochila escolar', 'mochila notebook'
    ],
    aliases: [ 'carteras', 'bolsos', 'marroquinería' ],
    brands: [ 'Prüne', 'Rapsodia', 'Louis Vuitton', 'Samsonite', 'Rip Curl', 'Mimo' ],
    related: [ 'joyeria', 'deportes', 'otros' ],
    intent: 'product',
    typical_attributes: [ 'material', 'marca', 'color', 'talle', 'estado', 'tipo' ]
  },
  {
    id: 'joyeria',
    parentId: null,
    keywords: [
      'anillo', 'collar', 'pulsera', 'aros', 'cadena', 'colgante',
      'reloj', 'bijouterie', 'oro', 'plata', 'acero quirúrgico',
      'joyería artesanal', 'joyas de plata', 'joyas de oro'
    ],
    aliases: [ 'bijou', 'accesorios', 'joyería' ],
    brands: [ 'Pandora', 'Swarovski', 'Fossil', 'Casio', 'Citizen', 'Seiko' ],
    related: [ 'bolsas', 'perfumes', 'otros' ],
    intent: 'product',
    typical_attributes: [ 'material', 'tipo', 'talle', 'marca', 'estado', 'color' ]
  },

  // SERVICIOS TÍPICOS
  {
    id: 'serv_belleza',
    parentId: 'servicios',
    keywords: [
      'peluquería', 'corte de cabello', 'tintura', 'mechas', 'manicuría',
      'pedicuría', 'depilación', 'cera', 'laser', 'lifting de pestañas',
      'extensiones', 'masajes', 'faciales', 'estética'
    ],
    aliases: [ 'peluquería', 'estética', 'salón de belleza' ],
    brands: [],
    related: [ 'servicios', 'cuidado_pers', 'perfumes' ],
    intent: 'service',
    typical_attributes: [ 'tipo de servicio', 'zona', 'disponibilidad', 'precio', 'domicilio' ]
  },
  {
    id: 'serv_educacion',
    parentId: 'servicios',
    keywords: [
      'clases particulares', 'apoyo escolar', 'inglés', 'portugués', 'francés',
      'clases de música', 'guitarra', 'piano', 'matemática', 'física',
      'química', 'tutorías', 'refuerzo escolar', 'clases online'
    ],
    aliases: [ 'clases', 'tutorías', 'educación' ],
    brands: [],
    related: [ 'servicios', 'libros', 'otros' ],
    intent: 'service',
    typical_attributes: [ 'materia', 'nivel', 'modalidad', 'zona', 'precio por hora', 'disponibilidad' ]
  },
  {
    id: 'serv_transporte',
    parentId: 'servicios',
    keywords: [
      'remis', 'taxi', 'chofer', 'traslado', 'viaje al aeropuerto',
      'traslado médico', 'viaje larga distancia', 'transfer', 'minivan',
      'alquiler con chofer', 'transporte escolar', 'camioneta con chofer'
    ],
    aliases: [ 'remis', 'traslado', 'transporte privado' ],
    brands: [],
    related: [ 'servicios', 'serv_mudanza', 'automotores' ],
    intent: 'service',
    typical_attributes: [ 'tipo', 'zona', 'disponibilidad', 'capacidad', 'precio', 'vehículo' ]
  },
  {
    id: 'serv_veterinaria',
    parentId: 'servicios',
    keywords: [
      'veterinario', 'veterinario a domicilio', 'baño mascotas', 'peluquería canina',
      'vacunación', 'castración', 'desparasitación', 'consulta veterinaria',
      'urgencias veterinarias', 'guardería mascotas', 'adiestramiento'
    ],
    aliases: [ 'veterinario', 'peluquería canina', 'grooming' ],
    brands: [],
    related: [ 'servicios', 'mascotas', 'perros' ],
    intent: 'service',
    typical_attributes: [ 'tipo de servicio', 'especie', 'zona', 'disponibilidad', 'precio', 'urgencia' ]
  },
  {
    id: 'serv_salud',
    parentId: 'servicios',
    keywords: [
      'enfermero', 'enfermería domicilio', 'psicólogo', 'nutricionista',
      'kinesiólogo', 'kinesiología', 'fonoaudiología', 'terapia', 'consulta médica',
      'médico a domicilio', 'cuidado domiciliario', 'flebotomía', 'extracción de sangre'
    ],
    aliases: [ 'salud domicilio', 'profesionales salud', 'terapeutas' ],
    brands: [],
    related: [ 'servicios', 'salud', 'serv_cuidados' ],
    intent: 'service',
    typical_attributes: [ 'especialidad', 'zona', 'modalidad', 'disponibilidad', 'precio por sesión', 'obra social' ]
  },
  {
    id: 'serv_eventos',
    parentId: 'servicios',
    keywords: [
      'DJ', 'animación', 'animador infantil', 'catering', 'alquiler de sonido',
      'alquiler de luces', 'inflables', 'fotógrafo', 'video', 'cobertura de eventos',
      'salón de fiestas', 'organización de eventos', 'shows', 'mago'
    ],
    aliases: [ 'eventos', 'fiestas', 'animación' ],
    brands: [],
    related: [ 'servicios', 'gastronomia', 'turismo' ],
    intent: 'service',
    typical_attributes: [ 'tipo de servicio', 'zona', 'disponibilidad', 'precio', 'duración', 'capacidad' ]
  },
  {
    id: 'serv_jardineria',
    parentId: 'servicios',
    keywords: [
      'poda', 'corte de césped', 'paisajismo', 'fumigación', 'desmalezado',
      'mantenimiento jardín', 'plantación', 'riego automático', 'compostera',
      'poda de árboles', 'limpieza de terreno', 'jardín vertical'
    ],
    aliases: [ 'jardinería', 'paisajismo', 'poda' ],
    brands: [],
    related: [ 'servicios', 'jardin', 'serv_const' ],
    intent: 'service',
    typical_attributes: [ 'tipo de trabajo', 'zona', 'frecuencia', 'precio', 'disponibilidad', 'herramientas propias' ]
  },
  {
    id: 'serv_mecanica',
    parentId: 'servicios',
    keywords: [
      'mecánico', 'mecánico a domicilio', 'auxilio mecánico', 'diagnosis',
      'escáner automotor', 'cambio de aceite', 'reparación motor', 'frenos',
      'suspensión', 'electricidad del auto', 'soldadura automotriz', 'gomería'
    ],
    aliases: [ 'mecánico', 'auxilio', 'taller móvil' ],
    brands: [],
    related: [ 'servicios', 'automotores', 'repuestos' ],
    intent: 'service',
    typical_attributes: [ 'tipo de trabajo', 'zona', 'urgencia', 'disponibilidad', 'precio', 'garantía' ]
  },

  // SERVICIOS MODERNOS/DIGITALES
  {
    id: 'serv_programacion',
    parentId: 'servicios',
    keywords: [
      'desarrollo web', 'programador', 'app', 'landing page', 'e-commerce',
      'tienda online', 'soporte IT', 'mantenimiento web', 'WordPress', 'React',
      'base de datos', 'API', 'automatización', 'software a medida'
    ],
    aliases: [ 'programación', 'desarrollo', 'IT' ],
    brands: [],
    related: [ 'servicios', 'serv_marketing', 'otros' ],
    intent: 'service',
    typical_attributes: [ 'tecnología', 'tipo de proyecto', 'modalidad', 'precio', 'plazo', 'experiencia' ]
  },
  {
    id: 'serv_marketing',
    parentId: 'servicios',
    keywords: [
      'community manager', 'redes sociales', 'SEO', 'SEM', 'publicidad digital',
      'Google Ads', 'Meta Ads', 'branding', 'diseño gráfico', 'contenido',
      'email marketing', 'estrategia digital', 'copywriting', 'identidad visual'
    ],
    aliases: [ 'marketing digital', 'community', 'publicidad online' ],
    brands: [],
    related: [ 'servicios', 'serv_programacion', 'otros' ],
    intent: 'service',
    typical_attributes: [ 'servicio', 'modalidad', 'precio mensual', 'incluye', 'experiencia', 'portfolio' ]
  },
  {
    id: 'serv_delivery',
    parentId: 'servicios',
    keywords: [
      'mandados', 'compras', 'envíos locales', 'mensajería', 'cadete',
      'delivery', 'moto cadete', 'envío mismo día', 'flete pequeño',
      'compras supermercado', 'retiro en comercio', 'envío express'
    ],
    aliases: [ 'cadete', 'mensajería', 'mandados' ],
    brands: [],
    related: [ 'servicios', 'serv_transporte', 'gastronomia' ],
    intent: 'service',
    typical_attributes: [ 'zona', 'disponibilidad', 'precio', 'vehículo', 'urgencia', 'tipo de carga' ]
  },
  {
    id: 'serv_cuidados',
    parentId: 'servicios',
    keywords: [
      'cuidado adultos mayores', 'niñera', 'acompañante terapéutico', 'cuidador domicilio',
      'acompañante gerontológico', 'cuidado paciente', 'babysitter', 'jardín maternal',
      'cuidado de personas', 'asistente geriátrico', 'enfermería asistencial'
    ],
    aliases: [ 'niñera', 'cuidador', 'acompañante' ],
    brands: [],
    related: [ 'servicios', 'serv_salud', 'mascotas' ],
    intent: 'service',
    typical_attributes: [ 'tipo de cuidado', 'zona', 'horario', 'disponibilidad', 'precio', 'experiencia' ]
  },

  // RUBROS NUEVOS (raíz)
  {
    id: 'gastronomia',
    parentId: null,
    keywords: [
      'restaurante', 'rotisería', 'delivery comida', 'viandas', 'menú del día',
      'comida casera', 'empanadas', 'pizza', 'sushi', 'parrilla',
      'catering', 'comida saludable', 'vegano', 'sin tacc'
    ],
    aliases: [ 'comida', 'restaurant', 'delivery' ],
    brands: [],
    related: [ 'serv_eventos', 'serv_delivery', 'alimentos' ],
    intent: 'service',
    typical_attributes: [ 'tipo de cocina', 'zona', 'horario', 'modalidad', 'precio', 'opciones dietarias' ]
  },
  {
    id: 'turismo',
    parentId: null,
    keywords: [
      'alojamiento', 'cabaña', 'hostel', 'hotel', 'departamento temporario',
      'alquiler vacacional', 'excursiones', 'guía de turismo', 'turismo rural',
      'paquete turístico', 'tour', 'traslado turístico', 'aventura', 'ecoturismo'
    ],
    aliases: [ 'viajes', 'vacaciones', 'hospedaje' ],
    brands: [ 'Airbnb', 'Despegar', 'Booking', 'TripAdvisor' ],
    related: [ 'serv_transporte', 'serv_eventos', 'otros' ],
    intent: 'service',
    typical_attributes: [ 'tipo', 'zona', 'capacidad', 'precio por noche', 'disponibilidad', 'servicios incluidos' ]
  },
  {
    id: 'arte',
    parentId: null,
    keywords: [
      'pintura', 'cuadro', 'escultura', 'artesanía', 'fotografía artística',
      'ilustración', 'obra de arte', 'grabado', 'serigrafía', 'cerámica',
      'arte digital', 'retrato por encargo', 'arte abstracto', 'mural'
    ],
    aliases: [ 'arte', 'artesanías', 'obras' ],
    brands: [],
    related: [ 'decoracion', 'libros', 'otros' ],
    intent: 'product',
    typical_attributes: [ 'técnica', 'medidas', 'soporte', 'año', 'artista', 'estado', 'firmado' ]
  },
];



// =========================================================
// PENDIENTES (nodos sin keywords aún):
//
// ELECTRODOMÉSTICOS (sub-nodos cocina)
// - microondas, licuadoras, cafeteras, hornos, freidoras, planchado
//
// CONSTRUCCIÓN (sub-nodos)
// - hierro_acero, madera, pisos, plomeria, electricidad
//
// FERRETERÍA (sub-nodos)
// - fijaciones, seguridad, soldadura
//
// ROPA (sub-nodos)
// - bolsas, joyeria
//
// SERVICIOS — típicos e históricos
// - serv_belleza       (peluquería, manicuría, depilación, estética)
// - serv_educacion     (clases particulares, idiomas, música, apoyo escolar)
// - serv_transporte    (remis, taxi, chofer, traslados)
// - serv_veterinaria   (veterinario domicilio, baño mascotas, vacunación)
// - serv_salud         (enfermería, psicólogo, nutricionista, kinesiología)
// - serv_eventos       (DJ, animación, catering, alquiler sonido)
// - serv_jardineria    (poda, corte cesped, paisajismo, fumigacion)
// - serv_mecanica      (mecánico domicilio, auxilio, diagnosis)
//
// SERVICIOS — modernos/digitales
// - serv_programacion  (desarrollo web, apps, landing pages, soporte IT)
// - serv_marketing     (community manager, SEO, publicidad digital, branding)
// - serv_delivery      (mandados, compras, envíos locales, mensajería)
// - serv_cuidados      (cuidado adultos mayores, niñera, acompañante terapéutico)
//
// RUBROS NUEVOS (raíz)
// - gastronomia        (restaurantes, rotiserías, delivery, viandas — raíz propia)
// - turismo            (alojamiento, excursiones, guía de turismo, alquiler temporario)
// - arte               (pinturas, esculturas, artesanías, fotografía artística)
// =========================================================

// =========================================================
// NORMALIZADOR
// =========================================================

export function normalizeText(text = '') {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
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
