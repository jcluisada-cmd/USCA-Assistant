/**
 * USCA Connect — Module Cushman (saisie + calcul + sauvegarde)
 * Dépend de : shared/supabase.js (window.sb)
 * Expose : window.cushman
 *
 * Référentiel CIWA-Ar FR : 7 items × 4 niveaux = score 0..21
 * Cutoff USCA : >= 7 → administration BZD SB
 */

window.cushman = (function() {

  // Référentiel identique à la Toolbox V1 (staff/toolbox.html:336-342)
  var ITEMS = [
    { key: 'fc',           label: 'Fréquence cardiaque',
      options: ['< 80', '80-100', '101-120', '> 120'] },
    { key: 'pa',           label: 'PA systolique',
      options: ['< 135', '135-160', '161-200', '> 200'] },
    { key: 'fr',           label: 'Fréquence respiratoire',
      options: ['< 16', '16-25', '26-35', '> 35'] },
    { key: 'tremblements', label: 'Tremblements',
      options: ['Absents', 'Mains en extension', 'Membres sup.', 'Généralisés'] },
    { key: 'sueurs',       label: 'Sueurs',
      options: ['Absentes', 'Paumes', 'Paumes + front', 'Généralisées'] },
    { key: 'agitation',    label: 'Agitation',
      options: ['Absente', 'Discrète', 'Généralisée', 'Incoercible'] },
    { key: 'sensoriels',   label: 'Troubles sensoriels',
      options: ['Absents', 'Gêne lumière/bruit', 'Hallucinations critiquées', 'Hallucinations non critiquées'] }
  ];

  // ──────────────────── API DATA ────────────────────

  async function saveScore(patientId, items, scoreTotal, commentaire, rappelIntervalleH) {
    var r = await sb.from('cushman_scores').insert({
      patient_id:           patientId,
      items:                items,
      score_total:          scoreTotal,
      commentaire:          commentaire || null,
      rappel_intervalle_h:  rappelIntervalleH
    }).select().single();
    if (r.error) throw r.error;
    return r.data;
  }

  async function getScores(patientId, limit) {
    limit = limit || 7;
    var r = await sb.from('cushman_scores')
      .select('*')
      .eq('patient_id', patientId)
      .order('saisi_le', { ascending: false })
      .limit(limit);
    if (r.error) throw r.error;
    return r.data || [];
  }

  // ──────────────────── HELPERS PUR ────────────────────

  function isOverdue(lastScore) {
    if (!lastScore) return false;
    if (lastScore.score_total < 7) return false;
    if (lastScore.rappel_intervalle_h == null) return false;
    var dueAt = new Date(lastScore.saisi_le).getTime() + lastScore.rappel_intervalle_h * 3600 * 1000;
    return Date.now() >= dueAt;
  }

  function colorFor(score) {
    if (score >= 7) return 'red';
    if (score >= 4) return 'amber';
    return 'green';
  }

  // ──────────────────── MODAL ────────────────────

  /**
   * Ouvre la modal de saisie d'un Cushman.
   * @param {object} patient {id, numero_chambre}
   * @param {function} onSaved callback appelé après save réussi avec la ligne insérée
   */
  function openModal(patient, onSaved) {
    var state = {};      // {fc: 0..3, pa: 0..3, ...}

    // ─── Construire le DOM sans injection de données utilisateur ───
    var overlay = document.createElement('div');
    overlay.className = 'fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4';

    var modal = document.createElement('div');
    modal.className = 'bg-white dark:bg-slate-800 rounded-t-2xl sm:rounded-xl max-w-md w-full max-h-[92vh] overflow-y-auto p-5';
    overlay.appendChild(modal);

    var title = document.createElement('h3');
    title.className = 'text-lg font-bold mb-1';
    title.textContent = 'Nouveau Cushman — Ch. ' + (patient.numero_chambre || '?');
    modal.appendChild(title);

    var help = document.createElement('p');
    help.className = 'text-xs text-slate-500 mb-3';
    help.textContent = 'Cliquer un niveau par item. Le score total se met à jour automatiquement.';
    modal.appendChild(help);

    // ─── 7 items ───
    var itemsZone = document.createElement('div');
    itemsZone.className = 'space-y-3';
    modal.appendChild(itemsZone);

    ITEMS.forEach(function(item) {
      var block = document.createElement('div');
      var lab = document.createElement('div');
      lab.className = 'text-sm font-medium mb-1';
      lab.textContent = item.label;
      block.appendChild(lab);

      var grid = document.createElement('div');
      grid.className = 'grid grid-cols-2 gap-1';
      block.appendChild(grid);

      item.options.forEach(function(optLabel, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'px-2 py-1.5 rounded border border-slate-200 dark:border-slate-600 text-xs text-left hover:bg-indigo-50 dark:hover:bg-slate-700 transition';
        btn.textContent = optLabel;
        btn.dataset.value = String(i);
        btn.addEventListener('click', function() {
          // Reset les autres boutons du même item
          Array.prototype.forEach.call(grid.querySelectorAll('button'), function(b) {
            b.classList.remove('bg-indigo-600','text-white','border-indigo-600');
            b.classList.add('border-slate-200','dark:border-slate-600');
          });
          btn.classList.add('bg-indigo-600','text-white','border-indigo-600');
          btn.classList.remove('border-slate-200','dark:border-slate-600');
          state[item.key] = i;
          updateTotal();
        });
        grid.appendChild(btn);
      });

      itemsZone.appendChild(block);
    });

    // ─── Zone score total ───
    var scoreZone = document.createElement('div');
    scoreZone.className = 'mt-4 p-3 rounded-lg bg-slate-100 dark:bg-slate-700 text-center';
    var scoreLbl = document.createElement('div');
    scoreLbl.className = 'text-xs uppercase text-slate-500 tracking-wider';
    scoreLbl.textContent = 'Score total';
    var scoreVal = document.createElement('div');
    scoreVal.className = 'text-4xl font-extrabold text-emerald-600';
    scoreVal.textContent = '0';
    var scoreAction = document.createElement('div');
    scoreAction.className = 'text-sm font-semibold mt-1 hidden';
    scoreZone.appendChild(scoreLbl);
    scoreZone.appendChild(scoreVal);
    scoreZone.appendChild(scoreAction);
    modal.appendChild(scoreZone);

    // ─── Zone rappel (visible si score >= 7) ───
    var rappelZone = document.createElement('div');
    rappelZone.className = 'hidden mt-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700';
    var rappelLab = document.createElement('label');
    rappelLab.className = 'flex items-center gap-2 text-sm font-medium';
    var rappelCheck = document.createElement('input');
    rappelCheck.type = 'checkbox';
    rappelCheck.checked = true;
    rappelLab.appendChild(rappelCheck);
    var rappelSpan = document.createElement('span');
    rappelSpan.textContent = '⏰ Me rappeler de refaire le Cushman';
    rappelLab.appendChild(rappelSpan);
    rappelZone.appendChild(rappelLab);
    var rappelRow = document.createElement('div');
    rappelRow.className = 'flex items-center gap-2 mt-2 text-sm';
    var rappelPrefix = document.createElement('span');
    rappelPrefix.textContent = 'Dans';
    var rappelInput = document.createElement('input');
    rappelInput.type = 'number';
    rappelInput.value = '4';
    rappelInput.min = '1';
    rappelInput.max = '24';
    rappelInput.className = 'w-16 px-2 py-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 rounded';
    var rappelSuffix = document.createElement('span');
    rappelSuffix.textContent = 'h';
    var rappelEta = document.createElement('span');
    rappelEta.className = 'text-xs text-slate-500';
    rappelRow.appendChild(rappelPrefix);
    rappelRow.appendChild(rappelInput);
    rappelRow.appendChild(rappelSuffix);
    rappelRow.appendChild(rappelEta);
    rappelZone.appendChild(rappelRow);
    modal.appendChild(rappelZone);

    // ─── Commentaire ───
    var commentArea = document.createElement('textarea');
    commentArea.className = 'w-full mt-3 p-2 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 rounded text-sm';
    commentArea.rows = 2;
    commentArea.placeholder = 'Commentaire libre (optionnel)';
    modal.appendChild(commentArea);

    // ─── Boutons ───
    var btnRow = document.createElement('div');
    btnRow.className = 'flex gap-2 justify-end mt-4';
    var btnCancel = document.createElement('button');
    btnCancel.type = 'button';
    btnCancel.className = 'px-4 py-2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200';
    btnCancel.textContent = 'Annuler';
    var btnSave = document.createElement('button');
    btnSave.type = 'button';
    btnSave.className = 'px-4 py-2 rounded bg-indigo-600 text-white font-semibold';
    btnSave.textContent = 'Enregistrer';
    btnRow.appendChild(btnCancel);
    btnRow.appendChild(btnSave);
    modal.appendChild(btnRow);

    document.body.appendChild(overlay);

    // ─── Logique de mise à jour ───
    function updateTotal() {
      var total = ITEMS.reduce(function(sum, it) {
        return sum + (state[it.key] || 0);
      }, 0);
      scoreVal.textContent = String(total);
      var color = colorFor(total);
      scoreVal.className = 'text-4xl font-extrabold ' + (
        color === 'red'   ? 'text-red-600' :
        color === 'amber' ? 'text-amber-600' :
                            'text-emerald-600'
      );
      if (total >= 7) {
        scoreAction.textContent = '→ Donner BZD SB';
        scoreAction.className = 'text-sm font-semibold mt-1 text-red-700 dark:text-red-300';
        rappelZone.classList.remove('hidden');
        updateRappelEta();
      } else {
        scoreAction.className = 'text-sm font-semibold mt-1 hidden';
        rappelZone.classList.add('hidden');
      }
    }

    function updateRappelEta() {
      var h = parseInt(rappelInput.value, 10) || 4;
      var eta = new Date(Date.now() + h * 3600 * 1000);
      rappelEta.textContent = '→ ≈ ' + eta.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    }
    rappelInput.addEventListener('input', updateRappelEta);

    btnCancel.addEventListener('click', function() { overlay.remove(); });

    btnSave.addEventListener('click', async function() {
      // Validation : les 7 items doivent être remplis
      var missing = ITEMS.filter(function(it) { return state[it.key] === undefined; });
      if (missing.length > 0) {
        alert('Merci de remplir les 7 items avant d\'enregistrer.');
        return;
      }
      var total = ITEMS.reduce(function(sum, it) { return sum + state[it.key]; }, 0);
      var commentaire = commentArea.value.trim();
      var rappelH = (total >= 7 && rappelCheck.checked)
        ? (parseInt(rappelInput.value, 10) || 4)
        : null;

      btnSave.disabled = true;
      btnSave.textContent = '…';
      try {
        var row = await saveScore(patient.id, state, total, commentaire, rappelH);
        overlay.remove();
        if (typeof onSaved === 'function') onSaved(row);
      } catch (e) {
        btnSave.disabled = false;
        btnSave.textContent = 'Enregistrer';
        alert('Erreur enregistrement : ' + (e.message || e));
      }
    });
  }

  return {
    ITEMS:     ITEMS,
    saveScore: saveScore,
    getScores: getScores,
    isOverdue: isOverdue,
    colorFor:  colorFor,
    openModal: openModal
  };
})();
