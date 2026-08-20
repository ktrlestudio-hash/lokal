// validarFotoElegida — chequeo temprano al elegir un archivo de foto,
// ANTES de generar su preview o intentar subirlo. Sin esto, un formato
// que el navegador no puede decodificar (el caso real y frecuente: HEIC,
// el formato que usa la cámara de iPhone por default) generaba una
// preview visualmente rota apenas se elegía el archivo — el usuario veía
// "la foto rara" mucho antes de siquiera tocar "Publicar", sin ningún
// mensaje que explicara qué pasó.
//
// Por qué HEIC es el caso que importa: <canvas>/Image() (lo que usa
// storeFormUtils.jsx para comprimir antes de subir) no lo decodifica en
// la gran mayoría de navegadores — solo Safari lo soporta nativo. Un
// iPhone con la configuración de cámara por default genera HEIC salvo
// que el usuario haya cambiado "Formatos" a "Más compatible" en Ajustes.
//
// Devuelve null si el archivo está OK, o un mensaje en criollo listo para
// mostrar si hay que rechazarlo.
const EXTENSIONES_HEIC = /\.(heic|heif)$/i;

export function validarFotoElegida(file) {
  if (!file.type.startsWith('image/') && !EXTENSIONES_HEIC.test(file.name)) {
    return `"${file.name}" no es una imagen — elegí una foto (JPG, PNG, WEBP).`;
  }

  // Muchos navegadores/celulares reportan HEIC sin type MIME (type: ''),
  // así que la extensión del archivo es la señal más confiable acá — no
  // alcanza con mirar file.type.
  const esHeic = file.type === 'image/heic' || file.type === 'image/heif' || EXTENSIONES_HEIC.test(file.name);
  if (esHeic) {
    return `"${file.name}" está en formato HEIC (el que usa la cámara de iPhone por default) y no se puede procesar acá. En el iPhone: Ajustes → Cámara → Formatos → elegí "Más compatible", o simplemente sacale una captura de pantalla a la foto y subí esa.`;
  }

  // Techo generoso pensado para "el usuario ya tocó Elegir foto y esto es
  // obviamente un archivo equivocado" (ej. un video de 500MB con
  // extensión de imagen) — no es el límite real de subida, ese lo aplica
  // el backend sobre el archivo YA comprimido (ver upload.js). Este
  // chequeo evita que el navegador se cuelgue tratando de decodificar
  // algo absurdamente pesado antes incluso de comprimirlo.
  const CIEN_MB = 100 * 1024 * 1024;
  if (file.size > CIEN_MB) {
    return `"${file.name}" pesa ${(file.size / (1024 * 1024)).toFixed(0)}MB, demasiado para procesar. Elegí una foto más liviana.`;
  }

  return null;
}
