/* ─── USCA — Toggle ☀️/🌙 pour les ressources HTML ───
   Priorité de résolution du thème (du plus prioritaire au moins) :
   1. URL param ?theme=dark|light → mode iframe synchronisé avec parent (Toolbox)
   2. localStorage('usca-res-theme') → mode standalone (ouverture directe de la fiche)
   3. 'light' par défaut

   En mode iframe, le bouton ☀️/🌙 est masqué (le toggle se fait dans le parent).
   Pas de dépendance à prefers-color-scheme.
*/
(function() {
  var STORAGE_KEY = 'usca-res-theme';
  var root = document.documentElement;

  function apply(theme) {
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
  }

  // Détection mode iframe + URL param ?theme=
  var inIframe = false;
  try { inIframe = (window.self !== window.top); } catch (e) { inIframe = true; }
  var urlTheme = null;
  try {
    var p = new URLSearchParams(window.location.search).get('theme');
    if (p === 'dark' || p === 'light') urlTheme = p;
  } catch (e) {}

  // Résolution du thème initial
  var initialTheme;
  if (urlTheme) {
    initialTheme = urlTheme;
  } else {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch (e) {}
    initialTheme = (saved === 'dark') ? 'dark' : 'light';
  }
  apply(initialTheme);

  // Injection du bouton après DOM ready (sauf en iframe — le toggle est dans le parent)
  function init() {
    if (inIframe) return; // pas de bouton en iframe : éviter la double commande
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
