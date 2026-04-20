/* ─── USCA — Toggle ☀️/🌙 pour les ressources HTML ───
   - Lecture au chargement : localStorage('usca-res-theme') → 'light' (par défaut) ou 'dark'
   - Pas de dépendance à prefers-color-scheme (on ignore volontairement l'OS)
   - Bouton flottant injecté automatiquement en haut à droite
*/
(function() {
  var STORAGE_KEY = 'usca-res-theme';
  var root = document.documentElement;

  function apply(theme) {
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }

  // Application immédiate (avant que le body soit rendu → évite le flash)
  var saved = null;
  try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
  apply(saved === 'dark' ? 'dark' : 'light');

  // Injection du bouton après DOM ready
  function init() {
    var btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Basculer le thème');
    btn.setAttribute('title', 'Basculer le thème');
    function refreshIcon() {
      btn.textContent = root.classList.contains('dark') ? '☀️' : '🌙';
    }
    refreshIcon();
    btn.addEventListener('click', function() {
      var next = root.classList.contains('dark') ? 'light' : 'dark';
      apply(next);
      try { localStorage.setItem(STORAGE_KEY, next); } catch (e) {}
      refreshIcon();
    });
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
