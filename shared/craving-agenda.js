/**
 * USCA Connect — Agenda Craving
 * Composant réutilisable : fonctionne avec Supabase (module patient) ou localStorage (export)
 *
 * Usage :
 *   initCravingAgenda(containerId, { getData: async () => [...cravings] })
 *
 * Chaque craving est un objet : { horodatage, intensite, declencheur?, duree? }
 */

function initCravingAgenda(containerId, options) {
  var container = document.getElementById(containerId);
  if (!container) return;

  var getData = options.getData;
  var currentView = 'semaine';
  var currentDate = new Date();
  var allCravings = [];

  // ── Helpers ──
  function createEl(tag, cls, txt) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (txt) el.textContent = txt;
    return el;
  }

  function formatDate(d) {
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }

  function startOfWeek(d) {
    var day = d.getDay();
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff);
  }

  function daysBetween(a, b) {
    return Math.floor((b - a) / (24 * 60 * 60 * 1000));
  }

  // ── Render ──
  async function render() {
    try { allCravings = await getData(); } catch(e) { allCravings = []; }
    container.textContent = '';

    // Header : titre + navigation vues
    var header = createEl('div', 'flex items-center justify-between mb-3');
    var title = createEl('h3', 'text-base font-bold text-slate-800', 'Historique craving');
    header.appendChild(title);

    var viewBtns = createEl('div', 'flex gap-1');
    var views = [
      { id: 'semaine', label: '7j' },
      { id: 'mois', label: '30j' },
      { id: 'trimestre', label: '3m' },
      { id: 'annee', label: '1an' }
    ];
    views.forEach(function(v) {
      var btn = createEl('button', 'px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ' + (currentView === v.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'), v.label);
      btn.addEventListener('click', function() { currentView = v.id; render(); });
      viewBtns.appendChild(btn);
    });
    header.appendChild(viewBtns);
    container.appendChild(header);

    // Stats rapides
    var stats = computeStats();
    var statsRow = createEl('div', 'grid grid-cols-3 gap-2 mb-4');
    var statItems = [
      { label: 'Total', value: stats.total, color: 'text-slate-800' },
      { label: 'Moy. intensit\u00e9', value: stats.avgIntensity > 0 ? stats.avgIntensity.toFixed(1) + '/10' : '\u2014', color: 'text-amber-600' },
      { label: 'Dernier', value: stats.lastDate || '\u2014', color: 'text-slate-500' }
    ];
    statItems.forEach(function(s) {
      var card = createEl('div', 'bg-white rounded-xl border border-slate-200 p-3 text-center');
      card.appendChild(createEl('p', 'text-lg font-bold ' + s.color, String(s.value)));
      card.appendChild(createEl('p', 'text-[10px] text-slate-400 mt-0.5', s.label));
      statsRow.appendChild(card);
    });
    container.appendChild(statsRow);

    // Graphique selon la vue
    if (currentView === 'semaine') renderWeek();
    else if (currentView === 'mois') renderMonth();
    else if (currentView === 'trimestre') renderLine(90);
    else if (currentView === 'annee') renderLine(365);

    // Liste des derniers cravings
    renderRecentList();
  }

  function computeStats() {
    var total = allCravings.length;
    var avg = 0;
    if (total > 0) {
      var sum = allCravings.reduce(function(acc, c) { return acc + (c.intensite || 0); }, 0);
      avg = sum / total;
    }
    var last = total > 0 ? formatDate(new Date(allCravings[allCravings.length - 1].horodatage)) : null;
    return { total: total, avgIntensity: avg, lastDate: last };
  }

  // ── Vue Semaine : barres verticales par jour ──
  function renderWeek() {
    var week = createEl('div', 'bg-white rounded-xl border border-slate-200 p-4 mb-4');
    var start = startOfWeek(currentDate);
    var days = [];
    for (var i = 0; i < 7; i++) {
      var d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push(d);
    }

    var barsRow = createEl('div', 'flex items-end justify-between gap-1');
    barsRow.style.height = '100px';

    days.forEach(function(day) {
      var dayStr = day.toISOString().split('T')[0];
      var dayCravings = allCravings.filter(function(c) { return c.horodatage && c.horodatage.startsWith(dayStr); });
      var maxIntensity = 0;
      var count = dayCravings.length;
      dayCravings.forEach(function(c) { if ((c.intensite || 0) > maxIntensity) maxIntensity = c.intensite; });

      var col = createEl('div', 'flex flex-col items-center flex-1');
      // Barre
      var barHeight = count > 0 ? Math.max(8, maxIntensity * 10) : 0;
      var barColor = maxIntensity <= 3 ? '#fbbf24' : maxIntensity <= 6 ? '#f97316' : '#ef4444';
      var bar = createEl('div', 'w-full rounded-t-md transition-all');
      bar.style.height = barHeight + '%';
      bar.style.background = count > 0 ? barColor : '#f1f5f9';
      bar.style.minHeight = count > 0 ? '8px' : '2px';
      col.appendChild(bar);
      // Label jour
      var isToday = dayStr === new Date().toISOString().split('T')[0];
      var label = createEl('p', 'text-[10px] mt-1.5 font-semibold ' + (isToday ? 'text-indigo-600' : 'text-slate-400'), day.toLocaleDateString('fr-FR', { weekday: 'short' }).charAt(0).toUpperCase() + day.toLocaleDateString('fr-FR', { weekday: 'short' }).slice(1));
      col.appendChild(label);
      if (count > 0) {
        col.appendChild(createEl('p', 'text-[9px] text-slate-400', count + 'x'));
      }
      barsRow.appendChild(col);
    });

    week.appendChild(barsRow);

    // Navigation semaine
    var nav = createEl('div', 'flex justify-between items-center mt-3');
    var btnPrev = createEl('button', 'text-xs text-indigo-600 font-semibold', '\u2190 Sem. pr\u00e9c.');
    btnPrev.addEventListener('click', function() { currentDate.setDate(currentDate.getDate() - 7); render(); });
    var btnNext = createEl('button', 'text-xs text-indigo-600 font-semibold', 'Sem. suiv. \u2192');
    btnNext.addEventListener('click', function() { currentDate.setDate(currentDate.getDate() + 7); render(); });
    var labelWeek = createEl('span', 'text-xs text-slate-400', formatDate(days[0]) + ' \u2014 ' + formatDate(days[6]));
    nav.appendChild(btnPrev);
    nav.appendChild(labelWeek);
    nav.appendChild(btnNext);
    week.appendChild(nav);

    container.appendChild(week);
  }

  // ── Vue Mois : calendrier avec points ──
  function renderMonth() {
    var month = createEl('div', 'bg-white rounded-xl border border-slate-200 p-4 mb-4');
    var year = currentDate.getFullYear();
    var mon = currentDate.getMonth();
    var firstDay = new Date(year, mon, 1).getDay();
    var daysInMonth = new Date(year, mon + 1, 0).getDate();
    var offset = firstDay === 0 ? 6 : firstDay - 1; // Lundi = 0

    // Header mois
    var headerRow = createEl('div', 'flex justify-between items-center mb-3');
    var btnPrev = createEl('button', 'text-xs text-indigo-600 font-semibold', '\u2190');
    btnPrev.addEventListener('click', function() { currentDate.setMonth(currentDate.getMonth() - 1); render(); });
    var btnNext = createEl('button', 'text-xs text-indigo-600 font-semibold', '\u2192');
    btnNext.addEventListener('click', function() { currentDate.setMonth(currentDate.getMonth() + 1); render(); });
    var monthLabel = createEl('span', 'text-sm font-bold text-slate-700', currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
    headerRow.appendChild(btnPrev);
    headerRow.appendChild(monthLabel);
    headerRow.appendChild(btnNext);
    month.appendChild(headerRow);

    // Jours de la semaine
    var weekDays = createEl('div', 'grid grid-cols-7 gap-1 mb-1');
    ['L','M','M','J','V','S','D'].forEach(function(d) {
      weekDays.appendChild(createEl('div', 'text-[10px] text-center font-semibold text-slate-400', d));
    });
    month.appendChild(weekDays);

    // Grille des jours
    var grid = createEl('div', 'grid grid-cols-7 gap-1');
    // Offset
    for (var i = 0; i < offset; i++) {
      grid.appendChild(createEl('div', ''));
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var dayStr = year + '-' + String(mon + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      var dayCravings = allCravings.filter(function(c) { return c.horodatage && c.horodatage.startsWith(dayStr); });
      var maxInt = 0;
      dayCravings.forEach(function(c) { if ((c.intensite || 0) > maxInt) maxInt = c.intensite; });

      var cell = createEl('div', 'text-center py-1 rounded-lg text-xs');
      var isToday = dayStr === new Date().toISOString().split('T')[0];
      if (isToday) cell.style.fontWeight = '800';

      if (dayCravings.length > 0) {
        var dotColor = maxInt <= 3 ? '#fbbf24' : maxInt <= 6 ? '#f97316' : '#ef4444';
        cell.style.background = dotColor + '20';
        cell.style.color = dotColor;
        cell.style.fontWeight = '700';
      } else {
        cell.style.color = isToday ? '#4F46E5' : '#94a3b8';
      }
      cell.textContent = d;
      grid.appendChild(cell);
    }
    month.appendChild(grid);
    container.appendChild(month);
  }

  // ── Vue Trimestre/Année : courbe en ligne ──
  function renderLine(numDays) {
    var chart = createEl('div', 'bg-white rounded-xl border border-slate-200 p-4 mb-4');
    var svgWidth = 280;
    var svgHeight = 80;

    // Agréger par jour
    var dayMap = {};
    var endDate = new Date();
    var startDate = new Date();
    startDate.setDate(startDate.getDate() - numDays);

    allCravings.forEach(function(c) {
      if (!c.horodatage) return;
      var d = c.horodatage.split('T')[0];
      if (!dayMap[d]) dayMap[d] = [];
      dayMap[d].push(c.intensite || 0);
    });

    // Calculer la moyenne par jour, puis la moyenne mobile 7 jours
    var points = [];
    for (var i = 0; i <= numDays; i++) {
      var d = new Date(startDate);
      d.setDate(d.getDate() + i);
      var dStr = d.toISOString().split('T')[0];
      var vals = dayMap[dStr] || [];
      var avg = vals.length > 0 ? vals.reduce(function(a, b) { return a + b; }, 0) / vals.length : null;
      points.push({ date: dStr, avg: avg });
    }

    // Moyenne mobile 7 jours
    var smoothed = [];
    for (var i = 0; i < points.length; i++) {
      var window = points.slice(Math.max(0, i - 6), i + 1).filter(function(p) { return p.avg !== null; });
      if (window.length > 0) {
        var sum = window.reduce(function(a, p) { return a + p.avg; }, 0);
        smoothed.push(sum / window.length);
      } else {
        smoothed.push(null);
      }
    }

    // Dessiner le SVG
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 ' + svgWidth + ' ' + svgHeight);
    svg.style.width = '100%';

    // Ligne de fond
    var bgLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    bgLine.setAttribute('x1', '0'); bgLine.setAttribute('y1', String(svgHeight - 5));
    bgLine.setAttribute('x2', String(svgWidth)); bgLine.setAttribute('y2', String(svgHeight - 5));
    bgLine.setAttribute('stroke', '#e2e8f0'); bgLine.setAttribute('stroke-width', '0.5');
    svg.appendChild(bgLine);

    // Points et ligne
    var pathD = '';
    var hasPoints = false;
    for (var i = 0; i < smoothed.length; i++) {
      if (smoothed[i] === null) continue;
      hasPoints = true;
      var x = (i / numDays) * svgWidth;
      var y = (svgHeight - 10) - (smoothed[i] / 10) * (svgHeight - 15);
      if (pathD === '') pathD = 'M' + x.toFixed(1) + ',' + y.toFixed(1);
      else pathD += ' L' + x.toFixed(1) + ',' + y.toFixed(1);
    }

    if (hasPoints) {
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathD);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', '#4F46E5');
      path.setAttribute('stroke-width', '2');
      path.setAttribute('stroke-linecap', 'round');
      path.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(path);
    }

    if (!hasPoints) {
      chart.appendChild(createEl('p', 'text-sm text-slate-400 text-center py-4', 'Pas encore de donn\u00e9es'));
    } else {
      chart.appendChild(svg);
      var labels = createEl('div', 'flex justify-between mt-1');
      var startLabel = new Date(startDate);
      labels.appendChild(createEl('span', 'text-[10px] text-slate-400', formatDate(startLabel)));
      labels.appendChild(createEl('span', 'text-[10px] text-indigo-500 font-semibold', 'Tendance (moy. mobile 7j)'));
      labels.appendChild(createEl('span', 'text-[10px] text-slate-400', 'Aujourd\'hui'));
      chart.appendChild(labels);
    }

    container.appendChild(chart);
  }

  // ── Liste des derniers cravings ──
  function renderRecentList() {
    var recent = allCravings.slice(-5).reverse();
    if (recent.length === 0) {
      container.appendChild(createEl('p', 'text-sm text-slate-400 text-center', 'Aucun craving enregistr\u00e9'));
      return;
    }

    var section = createEl('div', '');
    section.appendChild(createEl('p', 'text-xs font-bold text-slate-500 uppercase mb-2', 'Derniers signalements'));

    recent.forEach(function(c) {
      var d = new Date(c.horodatage);
      var row = createEl('div', 'flex items-center gap-3 py-2 border-b border-slate-100');

      // Date/heure
      var dateCol = createEl('div', 'w-16 flex-shrink-0');
      dateCol.appendChild(createEl('p', 'text-[11px] font-semibold text-slate-600', d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })));
      dateCol.appendChild(createEl('p', 'text-[10px] text-slate-400', d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })));
      row.appendChild(dateCol);

      // Barre intensité
      var barCol = createEl('div', 'flex-1');
      var barBg = createEl('div', 'h-2.5 bg-slate-100 rounded-full overflow-hidden');
      var barFill = createEl('div', 'h-full rounded-full');
      var intensity = c.intensite || 0;
      barFill.style.width = (intensity * 10) + '%';
      barFill.style.background = intensity <= 3 ? '#fbbf24' : intensity <= 6 ? '#f97316' : '#ef4444';
      barBg.appendChild(barFill);
      barCol.appendChild(barBg);
      if (c.declencheur) {
        barCol.appendChild(createEl('p', 'text-[10px] text-slate-400 mt-0.5', c.declencheur));
      }
      row.appendChild(barCol);

      // Intensité chiffre
      row.appendChild(createEl('span', 'text-sm font-bold text-slate-700 w-10 text-right', intensity + '/10'));
      section.appendChild(row);
    });

    container.appendChild(section);
  }

  // ── Init ──
  render();

  // API publique
  return { refresh: render };
}
