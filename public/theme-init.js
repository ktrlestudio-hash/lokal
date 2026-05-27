(function () {
  // Fondo del splash inmediato — evita flash blanco antes de que React monte
  document.documentElement.style.background = '#060d1a';
  if (document.body) document.body.style.background = '#060d1a';
  try {
    var saved = localStorage.getItem('lokal-theme');
    var isDark = saved ? saved === 'dark' : true;
    if (isDark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
