/**
 * USCA Connect — Toggle thème clair/sombre
 * Inclure après le HTML du bouton toggle.
 * Le bouton doit avoir id="btn-theme", les icônes id="icon-sun" et id="icon-moon".
 * Notifie les iframes enfants via postMessage.
 */
(function() {
  function applyTheme(dark) {
    if (dark) {
      document.documentElement.classList.add('dark');
      var sun = document.getElementById('icon-sun');
      var moon = document.getElementById('icon-moon');
      if (sun) sun.classList.remove('hidden');
      if (moon) moon.classList.add('hidden');
    } else {
      document.documentElement.classList.remove('dark');
      var sun = document.getElementById('icon-sun');
      var moon = document.getElementById('icon-moon');
      if (sun) sun.classList.add('hidden');
      if (moon) moon.classList.remove('hidden');
    }
    // Notifier les iframes enfants (même domaine)
    var iframes = document.querySelectorAll('iframe');
    iframes.forEach(function(iframe) {
      try {
        if (iframe.contentWindow) {
          iframe.contentWindow.postMessage({ type: 'usca-theme', dark: dark }, '*');
        }
      } catch(e) {}
    });
  }

  // Charger le thème sauvegardé
  if (localStorage.getItem('usca_theme') === 'dark') applyTheme(true);

  var btn = document.getElementById('btn-theme');
  if (btn) {
    btn.addEventListener('click', function() {
      var isDark = document.documentElement.classList.contains('dark');
      applyTheme(!isDark);
      localStorage.setItem('usca_theme', isDark ? 'light' : 'dark');
    });
  }
})();
