// Datos mock para modo test — solo accesible para admins
// Se activa con el toggle "Datos de prueba" en el banner admin

const hoy = new Date();
const hace = (dias) => new Date(hoy - dias * 86400000).toISOString();
const ts = (dias, horas = 0) => new Date(hoy - dias * 86400000 - horas * 3600000).toISOString();

export const MOCK_TIENDA = {
  id: 'mock-tienda-1',
  nombre: 'La Casa del Tornillo',
  slug: 'casa-del-tornillo',
  descripcion: 'Ferretería y materiales de construcción en el centro. Más de 20 años de experiencia.',
  categoria: 'ferreteria',
  rubros: ['ferretería', 'construcción', 'herramientas'],
  localidad: 'Córdoba Capital',
  provincia: 'Córdoba',
  telefono: '351-4567890',
  instagram: '@casadeltornillo',
  horarios: {
    lunes:    { abre: '08:00', cierra: '18:00', abierto: true },
    martes:   { abre: '08:00', cierra: '18:00', abierto: true },
    miercoles:{ abre: '08:00', cierra: '18:00', abierto: true },
    jueves:   { abre: '08:00', cierra: '18:00', abierto: true },
    viernes:  { abre: '08:00', cierra: '17:00', abierto: true },
    sabado:   { abre: '09:00', cierra: '13:00', abierto: true },
    domingo:  { abre: '', cierra: '', abierto: false },
  },
  verificada: true,
  suscripcion: {
    plan: 'empresa',
    activa: true,
    vence: new Date(hoy.getTime() + 22 * 86400000).toISOString(),
    trial: false,
  },
};

export const MOCK_PRODUCTOS = [
  { id: 'p1', titulo: 'Taladro percutor 750W', precio: 38500, stock: 12, activa: true, categoria: 'herramientas', imagen: null, descripcion: 'Taladro percutor con maletín y 3 brocas HSS incluidas.', createdAt: hace(30) },
  { id: 'p2', titulo: 'Sierra circular 7¼"', precio: 54900, stock: 5, activa: true, categoria: 'herramientas', imagen: null, descripcion: 'Sierra circular 1400W con guía paralela y disco de 40 dientes.', createdAt: hace(25) },
  { id: 'p3', titulo: 'Cemento portland x 50kg', precio: 8200, stock: 80, activa: true, categoria: 'materiales', imagen: null, descripcion: 'Bolsa de 50kg. Entrega a domicilio en zona centro.', createdAt: hace(20) },
  { id: 'p4', titulo: 'Pintura látex blanco 20L', precio: 42000, stock: 15, activa: true, categoria: 'pintureria', imagen: null, descripcion: 'Interior/exterior. Alto rendimiento, secado rápido.', createdAt: hace(18) },
  { id: 'p5', titulo: 'Caja de tornillos 4x40 (100u)', precio: 1200, stock: 200, activa: true, categoria: 'fijaciones', imagen: null, descripcion: 'Tornillos para madera zincados cabeza Phillips.', createdAt: hace(15) },
  { id: 'p6', titulo: 'Amoladora angular 115mm', precio: 29900, stock: 8, activa: true, categoria: 'herramientas', imagen: null, descripcion: '720W, incluye disco de corte y llave hexagonal.', createdAt: hace(12) },
  { id: 'p7', titulo: 'Hormigonera 130L', precio: 185000, stock: 2, activa: true, categoria: 'maquinaria', imagen: null, descripcion: 'Motor 1100W, cubeta metálica, ruedas para traslado.', createdAt: hace(10) },
  { id: 'p8', titulo: 'Sellador silicona blanco 280ml', precio: 2800, stock: 60, activa: true, categoria: 'adhesivos', imagen: null, descripcion: 'Apto azulejos y sanitarios. Resistente al agua.', createdAt: hace(8) },
  { id: 'p9', titulo: 'Cerradura doble paleta', precio: 6500, stock: 25, activa: true, categoria: 'cerrajeria', imagen: null, descripcion: 'Acero inoxidable, incluye 3 llaves y herrajes.', createdAt: hace(6) },
  { id: 'p10', titulo: 'Cable unipolar 2,5mm x 100m', precio: 31000, stock: 10, activa: true, categoria: 'electricidad', imagen: null, descripcion: 'Bobina 100 metros color rojo/negro/verde.', createdAt: hace(4) },
  { id: 'p11', titulo: 'Llave inglesa 12"', precio: 5400, stock: 30, activa: false, categoria: 'herramientas', imagen: null, descripcion: 'Acero forjado, acabado cromado.', createdAt: hace(3) },
  { id: 'p12', titulo: 'Disco de corte metal 115mm x5', precio: 3200, stock: 45, activa: true, categoria: 'abrasivos', imagen: null, descripcion: 'Pack de 5 discos, compatibles con amoladora 4½".', createdAt: hace(2) },
];

const CLIENTES = [
  { uid: 'u-mock-1', nombre: 'Rodrigo Fernández', avatar: null },
  { uid: 'u-mock-2', nombre: 'Valeria Torres', avatar: null },
  { uid: 'u-mock-3', nombre: 'Ignacio Molina', avatar: null },
  { uid: 'u-mock-4', nombre: 'Sofía Gutiérrez', avatar: null },
  { uid: 'u-mock-5', nombre: 'Matías Herrera', avatar: null },
  { uid: 'u-mock-6', nombre: 'Laura Pérez', avatar: null },
];

export const MOCK_INBOX = [
  {
    key: 'conv-1',
    partnerUid: 'u-mock-1',
    partnerName: 'Rodrigo Fernández',
    messages: [
      { from: 'u-mock-1', text: 'Hola! Tienen el taladro percutor 750W en stock?', ts: ts(2, 4) },
      { from: 'store', text: 'Sí, tenemos 12 unidades disponibles. ¿Te interesa pasar por el local o hacemos envío?', ts: ts(2, 3) },
      { from: 'u-mock-1', text: 'Envío a B° General Paz, cuánto sale?', ts: ts(2, 2) },
      { from: 'store', text: 'El envío a esa zona es $1.500. Coordinamos para mañana o pasado?', ts: ts(2, 1) },
      { from: 'u-mock-1', text: 'Perfecto para mañana. Pago efectivo está bien?', ts: ts(2, 0.5) },
    ],
    lastMessage: { from: 'u-mock-1', text: 'Perfecto para mañana. Pago efectivo está bien?', ts: ts(2, 0.5) },
    count: 1,
  },
  {
    key: 'conv-2',
    partnerUid: 'u-mock-2',
    partnerName: 'Valeria Torres',
    messages: [
      { from: 'u-mock-2', text: 'Buenos días, consulta por la hormigonera 130L. Hacen financiación?', ts: ts(1, 6) },
      { from: 'store', text: 'Buen día Valeria! En este momento no tenemos financiación propia pero aceptamos Mercado Pago en cuotas.', ts: ts(1, 5) },
      { from: 'u-mock-2', text: 'Ah re bien. Y para llevar necesito camioneta?', ts: ts(1, 4) },
      { from: 'store', text: 'Sí, pesa 58kg y mide 90cm de alto. ¿Tenés cómo trasladarlo o necesitás flete?', ts: ts(1, 3) },
      { from: 'u-mock-2', text: 'Tengo camioneta, paso mañana entonces. Gracias!', ts: ts(1, 2) },
      { from: 'store', text: 'Perfecto! Te esperamos de lunes a viernes 8 a 18hs. Cualquier cosa avisá.', ts: ts(1, 1) },
    ],
    lastMessage: { from: 'store', text: 'Perfecto! Te esperamos de lunes a viernes 8 a 18hs. Cualquier cosa avisá.', ts: ts(1, 1) },
    count: 0,
  },
  {
    key: 'conv-3',
    partnerUid: 'u-mock-3',
    partnerName: 'Ignacio Molina',
    messages: [
      { from: 'u-mock-3', text: 'Tienen cables eléctricos? Necesito 2,5mm y 4mm', ts: ts(0, 5) },
      { from: 'store', text: 'Sí! Tenemos 2,5mm en bobina de 100m a $31.000. El de 4mm hay que verificar stock, te confirmo.', ts: ts(0, 4) },
      { from: 'u-mock-3', text: 'Y el de 6mm también necesito para tablero', ts: ts(0, 2) },
    ],
    lastMessage: { from: 'u-mock-3', text: 'Y el de 6mm también necesito para tablero', ts: ts(0, 2) },
    count: 2,
  },
  {
    key: 'conv-4',
    partnerUid: 'u-mock-4',
    partnerName: 'Sofía Gutiérrez',
    messages: [
      { from: 'u-mock-4', text: 'Hola! La pintura látex que tienen es lavable?', ts: ts(3, 2) },
      { from: 'store', text: 'Sí, es látex acrílico lavable, interior y exterior. Excelente cobertura.', ts: ts(3, 1) },
      { from: 'u-mock-4', text: 'Tiene colores o solo blanco?', ts: ts(3, 0.5) },
      { from: 'store', text: 'Tenemos blanco en stock, el resto de colores los hacemos a pedido con máquina tintométrica. ¿Qué color necesitás?', ts: ts(3, 0.3) },
      { from: 'u-mock-4', text: 'Un beige suave, tipo arena. Cuánto tarda?', ts: ts(2, 8) },
      { from: 'store', text: '24hs hábiles. ¿Cuántos litros necesitás?', ts: ts(2, 7) },
    ],
    lastMessage: { from: 'store', text: '24hs hábiles. ¿Cuántos litros necesitás?', ts: ts(2, 7) },
    count: 0,
  },
  {
    key: 'conv-5',
    partnerUid: 'u-mock-5',
    partnerName: 'Matías Herrera',
    messages: [
      { from: 'u-mock-5', text: 'Buen día, el taladro tiene garantía?', ts: ts(5, 3) },
      { from: 'store', text: 'Sí, 12 meses de garantía de fábrica. Tenemos servicio técnico propio también.', ts: ts(5, 2) },
      { from: 'u-mock-5', text: 'Ok gracias, paso esta semana.', ts: ts(5, 1) },
    ],
    lastMessage: { from: 'u-mock-5', text: 'Ok gracias, paso esta semana.', ts: ts(5, 1) },
    count: 0,
  },
  {
    key: 'conv-6',
    partnerUid: 'u-mock-6',
    partnerName: 'Laura Pérez',
    messages: [
      { from: 'u-mock-6', text: 'Me interesa la sierra circular pero antes quiero saber si puedo probarla', ts: ts(7, 4) },
      { from: 'store', text: 'Claro que sí, podés venir al local y la probamos en el área de demo. Traé el material que necesitás cortar si querés.', ts: ts(7, 3) },
      { from: 'u-mock-6', text: 'Genial! Voy el sábado. Abren hasta qué hora?', ts: ts(7, 2) },
      { from: 'store', text: 'El sábado abrimos 9 a 13hs. Te esperamos!', ts: ts(7, 1) },
      { from: 'u-mock-6', text: 'Perfecto, muchas gracias!', ts: ts(6, 20) },
    ],
    lastMessage: { from: 'u-mock-6', text: 'Perfecto, muchas gracias!', ts: ts(6, 20) },
    count: 0,
  },
];

// Datos para StatsScreen
export const MOCK_STATS = {
  visitasHoy: 47,
  visitasSemana: 312,
  visitasMes: 1248,
  clicsContacto: 89,
  productosVistos: [
    { nombre: 'Taladro percutor 750W', visitas: 134 },
    { nombre: 'Sierra circular 7¼"', visitas: 98 },
    { nombre: 'Hormigonera 130L', visitas: 76 },
    { nombre: 'Pintura látex blanco 20L', visitas: 61 },
    { nombre: 'Amoladora angular 115mm', visitas: 55 },
  ],
  chartSemana: [
    { dia: 'Lun', visitas: 38 },
    { dia: 'Mar', visitas: 52 },
    { dia: 'Mié', visitas: 44 },
    { dia: 'Jue', visitas: 67 },
    { dia: 'Vie', visitas: 71 },
    { dia: 'Sáb', visitas: 40 },
    { dia: 'Dom', visitas: 0 },
  ],
};

// Historial de pagos mock
export const MOCK_HISTORIAL_PAGOS = [
  { plan: 'empresa', fecha: hace(365), monto: 47900, paymentId: '18392841' },
  { plan: 'empresa', fecha: hace(730), monto: 39900, paymentId: '11204738' },
];
