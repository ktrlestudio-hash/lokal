(function () {
  // Fondo del splash inmediato — evita flash blanco antes de que React monte
  document.documentElement.style.background = '#060d1a';
  if (document.body) document.body.style.background = '#060d1a';
  try {
    var saved = localStorage.getItem('lokal-theme');
    var isDark = saved ? saved === 'dark' : true;
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}

  // Color real de fondo de <body> según tema guardado — antes vivía como
  // <script> INLINE en index.html (después de <body>, porque este archivo
  // corre en <head> donde document.body todavía es null). Se externalizó
  // acá para que script-src del CSP de producción pueda quedar SIN hashes
  // fijos — los hashes hacían que 'unsafe-inline' quedara sin efecto (la
  // spec de CSP lo ignora si hay al menos un hash/nonce en la directiva),
  // necesario para permitir el script inline dinámico que Google Identity
  // Services (FedCM/One Tap) inyecta durante signInWithPopup — su contenido
  // varía, ningún hash fijo puede cubrirlo de antemano.
  function setBodyBg() {
    if (!document.body) return;
    var t = localStorage.getItem('lokal-theme');
    var dark = t !== 'light';
    document.body.style.background = dark ? '#060d1a' : '#ffffff';
  }
  if (document.body) setBodyBg();
  else document.addEventListener('DOMContentLoaded', setBodyBg);

  // Barra de estado en el tema correcto desde el primer frame. La <meta> del
  // <head> está fija en el oscuro (el caso más común); si el usuario tiene
  // tema claro guardado hay que corregirla ACÁ y no esperar a que React
  // monte, o la barra arranca oscura y salta a blanca al montar. Mismos
  // valores que STATUS_BAR_DARK/LIGHT en src/Root.jsx, que la mantiene de
  // ahí en más.
  try {
    if (localStorage.getItem('lokal-theme') === 'light') {
      var meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', '#ffffff');
    }
  } catch (e) {}
})();
