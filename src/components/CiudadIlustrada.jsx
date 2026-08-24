// Ilustración de ciudad para el placeholder del login — SVG propio (no
// imagen raster): pesa ~2KB, escala sin perder nitidez, y sus colores
// salen de los tokens de --brand, así que acompaña solo si el acento del
// sistema cambia. Portada de MI BOVRIL MAPA COMUNITARIO/frontend/src/
// components/CiudadIlustrada.jsx (mismo skyline + calle + pines), con la
// paleta de colores de categoría reemplazada por --brand — acá no hay
// "categorías de reporte" como en ese proyecto, todo respira la identidad
// turquesa de LOKAL en vez de colores semánticos sueltos.
// Ventanas "encendidas" en dark — un puñado, no todas: da vida a la
// ilustración de noche sin que se lea como un patrón repetido/artificial.
// Coordenadas literales (no un índice sobre el .map de abajo) porque cada
// grupo de ventanas ya arma su propia grilla con distinto x/paso de y. El
// delay hace que titilen (ci-titilar-ventana) en momentos distintos, no
// todas juntas — se lee como luces reales prendiéndose/apagándose, no un
// parpadeo sincronizado.
const VENTANAS_ENCENDIDAS = new Map([
  ['139-116', '0s'], ['204-94', '1.8s'], ['253-128', '3.2s'], ['155-156', '0.9s'],
]);

export default function CiudadIlustrada({ className = '', style = {}, isDark = false }) {
  // Devuelve las props de la ventana (fill + animación si está encendida),
  // no solo un color — la ventana encendida necesita además la clase de
  // titileo y su propio delay, cosas que un simple string de color no
  // puede cargar.
  const propsVentana = (x, y) => {
    const delay = isDark && VENTANAS_ENCENDIDAS.get(`${x}-${y}`);
    if (delay === undefined || delay === false) return { fill: 'var(--surface-solid, #fff)' };
    return { fill: 'var(--accent-hex, #FBBF24)', className: 'ci-ventana-random', style: { animationDelay: delay } };
  };
  return (
    <svg
      viewBox="0 0 400 220"
      className={className}
      style={style}
      preserveAspectRatio="xMidYMax slice"
      role="img"
      aria-label="Ilustración de una ciudad"
    >
      <defs>
        <linearGradient id="ci-cielo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(var(--brand, 0 184 217) / 0.16)" />
          <stop offset="100%" stopColor="var(--surface-solid, #fff)" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ci-fadeSuelo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--surface-solid, #fff)" stopOpacity="0" />
          <stop offset="100%" stopColor="var(--surface-solid, #fff)" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* Animaciones — nubes flotando en light, estrellas + ventanas
          titilando en dark. prefers-reduced-motion las apaga (paran en su
          posición/estado inicial) para quien lo pidió a nivel sistema. */}
      <style>{`
        @keyframes ci-flotar { 0%,100% { transform: translateX(0); } 50% { transform: translateX(14px); } }
        @keyframes ci-titilar-estrella { 0%,100% { opacity: 0.85; } 50% { opacity: 0.25; } }
        /* fill, no opacity: con solo opacity la ventana "apagada" dejaba
           ver el celeste del edificio detrás en vez de leerse como una
           ventana real. var(--surface-solid) es el MISMO color que usa
           cualquier otra ventana del skyline (blanco en light, #1f1f1f
           gris carbón oscuro en dark — es un token de tema, no un blanco
           fijo) — antes puse un negro/rgba a mano que no calzaba con ese
           tono real. */
        @keyframes ci-titilar-ventana {
          0%,45%,100% { fill: var(--accent-hex, #FBBF24); }
          50%,95% { fill: var(--surface-solid, #1f1f1f); }
        }
        /* El pin sube y la sombra reacciona en el mismo timing (misma
           duration+delay en ambas clases) para que se lean como una sola
           levitación: cuanto más alto está el pin, más lejos del piso su
           sombra, así que se achica y se atenúa — no es una sombra fija
           debajo de un pin que se mueve solo. */
        @keyframes ci-pin-flotar { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
        @keyframes ci-sombra-flotar { 0%,100% { transform: scale(1); opacity: 0.12; } 50% { transform: scale(0.62); opacity: 0.06; } }
        .ci-nube { animation: ci-flotar 9s ease-in-out infinite; }
        .ci-estrella { animation: ci-titilar-estrella 2.6s ease-in-out infinite; }
        .ci-ventana-random { animation: ci-titilar-ventana 5s step-end infinite; }
        .ci-pin-flotar { animation: ci-pin-flotar 3.4s ease-in-out infinite; }
        .ci-sombra-flotar { animation: ci-sombra-flotar 3.4s ease-in-out infinite; transform-origin: center; }
        @media (prefers-reduced-motion: reduce) {
          .ci-nube, .ci-estrella, .ci-ventana-random, .ci-pin-flotar, .ci-sombra-flotar { animation: none; }
        }
      `}</style>

      <rect width="400" height="220" fill="url(#ci-cielo)" />

      {isDark ? (
        // Estrellas — solo unas pocas, tamaños/posiciones fijos (no random
        // en cada render: con Math.random() la ilustración "saltaría" al
        // re-renderizar el componente). Delay distinto por estrella para
        // que no titilen todas en sincro. Dos filas (y=12-24 y y=34-46):
        // una sola fila se leía escasa para todo el ancho del cielo.
        <g fill="#fff">
          {[
            [30, 24, 1.4, '0s'],   [95, 14, 1.1, '0.6s'],  [175, 22, 1.6, '1.1s'],
            [245, 12, 1.2, '1.7s'], [310, 20, 1.4, '0.3s'], [370, 16, 1.1, '2.1s'],
            [62, 40, 1.1, '2.5s'], [130, 46, 1.3, '0.9s'], [210, 36, 1.0, '1.4s'],
            [278, 44, 1.2, '0s'],  [345, 38, 1.1, '1.9s'],
          ].map(([cx, cy, r, delay]) => (
            <circle key={`${cx}-${cy}`} className="ci-estrella" cx={cx} cy={cy} r={r} style={{ animationDelay: delay }} />
          ))}
        </g>
      ) : (
        // Nubes — 4-5 óvalos superpuestos por nube, cada una con su PROPIO
        // set de lóbulos (cantidad/tamaño/offset distintos, no las 3
        // repitiendo la misma forma sobre un .map). Cada nube usa DOS <g>
        // anidados: el externo con el transform de posición fijo (sin
        // animación), el interno con la clase ci-nube — la animación CSS
        // (transform: translateX) REEMPLAZA cualquier transform que ya
        // tenga el mismo elemento por atributo SVG en vez de sumarse, así
        // que aplicarla junto con translate(x y) en el mismo <g> hacía que
        // la nube perdiera su posición base y cayera en (0,0) del viewBox
        // durante toda la animación — muy arriba-izquierda, fuera del
        // recorte visible. Separando en dos <g>, el translateX de la
        // animación queda relativo al (0,0) YA desplazado por el padre.
        <g fill="var(--surface-solid, #fff)" opacity="0.85">
          <g transform="translate(55 32)">
            <g className="ci-nube" style={{ animationDelay: '0s' }}>
              <ellipse cx="0" cy="0" rx="26" ry="13" />
              <ellipse cx="19" cy="-5" rx="16" ry="10" />
              <ellipse cx="-18" cy="4" rx="14" ry="8" />
              <ellipse cx="1" cy="-13" rx="12" ry="8" />
            </g>
          </g>
          <g transform="translate(225 22)">
            <g className="ci-nube" style={{ animationDelay: '3s' }}>
              <ellipse cx="0" cy="0" rx="18" ry="9" />
              <ellipse cx="14" cy="-3" rx="13" ry="8" />
              <ellipse cx="-13" cy="2" rx="11" ry="7" />
            </g>
          </g>
          <g transform="translate(335 36)">
            <g className="ci-nube" style={{ animationDelay: '1.5s' }}>
              <ellipse cx="0" cy="0" rx="30" ry="11" />
              <ellipse cx="21" cy="-6" rx="15" ry="9" />
              <ellipse cx="-23" cy="1" rx="17" ry="9" />
              <ellipse cx="-3" cy="-11" rx="13" ry="7" />
              <ellipse cx="9" cy="6" rx="11" ry="6" />
            </g>
          </g>
        </g>
      )}

      {/* Capa lejana — edificios apagados, sin detalle: la distancia se
          comunica bajando contraste, no achicando. */}
      <g opacity="0.25" fill="rgb(var(--brand, 0 184 217))">
        <rect x="18"  y="96"  width="34" height="92" rx="4" />
        <rect x="60"  y="74"  width="26" height="114" rx="4" />
        <rect x="96"  y="104" width="30" height="84" rx="4" />
        <rect x="288" y="88"  width="30" height="100" rx="4" />
        <rect x="326" y="108" width="28" height="80" rx="4" />
        <rect x="362" y="82"  width="24" height="106" rx="4" />
      </g>

      {/* Capa media — ya con ventanas, el detalle aparece al acercarse. */}
      <g fill="rgb(var(--brand, 0 184 217) / 0.4)">
        <rect x="130" y="88"  width="44" height="100" rx="5" />
        <rect x="182" y="66"  width="38" height="122" rx="5" />
        <rect x="228" y="100" width="42" height="88"  rx="5" />
      </g>
      {/* Sin fill en el <g>: cada ventana define el suyo (blanco por
          default, amarillo si está en VENTANAS_ENCENDIDAS y isDark) — con
          el fill en el grupo padre no había forma de que algunas ventanas
          difieran del resto. */}
      <g opacity="0.85">
        {[96, 116, 136, 156].map((y) => (
          <g key={y}>
            <rect x="139" y={y} width="8" height="8" rx="2" {...propsVentana(139, y)} />
            <rect x="155" y={y} width="8" height="8" rx="2" {...propsVentana(155, y)} />
          </g>
        ))}
        {[74, 94, 114, 134, 154].map((y) => (
          <g key={y}>
            <rect x="190" y={y} width="8" height="8" rx="2" {...propsVentana(190, y)} />
            <rect x="204" y={y} width="8" height="8" rx="2" {...propsVentana(204, y)} />
          </g>
        ))}
        {[108, 128, 148].map((y) => (
          <g key={y}>
            <rect x="237" y={y} width="8" height="8" rx="2" {...propsVentana(237, y)} />
            <rect x="253" y={y} width="8" height="8" rx="2" {...propsVentana(253, y)} />
          </g>
        ))}
      </g>

      {/* Arbolado — mismo verde semántico del sistema, no un color suelto.
          Tronco hasta y=200: en la vereda (entre el pie de los edificios
          y=188 y la línea central de la calzada y=204), pero más alto que
          el punto medio exacto — se leía corto. */}
      <g fill="var(--ok-hex, #10b981)" opacity="0.55">
        <circle cx="112" cy="176" r="13" />
        <circle cx="286" cy="172" r="15" />
        <circle cx="54"  cy="180" r="11" />
      </g>
      <g stroke="rgb(var(--brand, 0 184 217) / 0.3)" strokeWidth="2.5">
        <line x1="112" y1="176" x2="112" y2="200" />
        <line x1="286" y1="172" x2="286" y2="200" />
        <line x1="54"  y1="180" x2="54"  y2="200" />
      </g>

      {/* Calle. La línea punteada usaba var(--surface-solid) — blanco en
          light (bien visible), pero #1f1f1f (gris carbón) en dark: casi
          invisible sobre un fondo también oscuro. Blanco fijo, no el
          token de tema, para que se vea igual de bien en ambos. */}
      <rect x="0" y="188" width="400" height="32" fill="rgb(var(--brand, 0 184 217) / 0.1)" />
      <g stroke="#fff" strokeWidth="3" strokeDasharray="14 12" opacity={isDark ? 0.5 : 0.7}>
        <line x1="0" y1="204" x2="400" y2="204" />
      </g>

      {/* Pines: apoyados en la calle (y=180, misma lógica que antes — el
          path del Pin tiene su punta en cy=24 desde su propio origen, así
          que cae en y=204, la línea central de la calle). En X alineados
          al CENTRO de un edificio específico, contando los 9 rectángulos
          del skyline de izquierda a derecha: el 2do (x=60,w=26→centro 73),
          el del medio/5to de 9 (x=182,w=38→centro 201), y el anteúltimo/
          8vo de 9 (x=326,w=28→centro 340). Delay distinto por pin para
          que levitan en momentos distintos, no los 3 en sincro. */}
      <Pin x={73} y={180} delay="0s" />
      <Pin x={201} y={180} delay="0.7s" />
      <Pin x={340} y={180} delay="1.3s" />

      <rect x="0" y="196" width="400" height="24" fill="url(#ci-fadeSuelo)" />
    </svg>
  );
}

function Pin({ x, y, delay = '0s' }) {
  // Sombra y pin son DOS <g> hermanos, cada uno con su propio transform de
  // animación — no uno adentro del otro, porque la sombra no debe subir
  // con el pin, solo reaccionar (achicarse/atenuarse) mientras el pin se
  // aleja del piso. Mismo animationDelay en ambos para que la subida del
  // pin y el achique de la sombra queden sincronizados.
  return (
    <g transform={`translate(${x} ${y})`}>
      <ellipse
        className="ci-sombra-flotar"
        cx="0" cy="26" rx="9" ry="3"
        fill="rgba(0,0,0,.12)"
        style={{ animationDelay: delay }}
      />
      <g className="ci-pin-flotar" style={{ animationDelay: delay }}>
        <path
          d="M0 24C0 24 11 12.5 11 6.2A11 11 0 1 0-11 6.2C-11 12.5 0 24 0 24Z"
          fill="rgb(var(--brand, 0 184 217))"
        />
        <circle cx="0" cy="6" r="4" fill="var(--surface-solid, #fff)" />
      </g>
    </g>
  );
}
