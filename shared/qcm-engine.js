/**
 * USCA Connect — Moteur QCM EDN (lazy-load)
 * Charge data/index.json puis data/item_XX.json à la demande.
 * Expose : window.QCMEngine
 *
 * Dépend de window.sb (shared/supabase.js) pour les écritures Supabase.
 */

(function () {
  'use strict';

  const DATA_BASE = '/data/';

  // Cache mémoire : { 'Item 76': [questions], ... }
  const _itemsCache = new Map();
  let _index = null;

  // ── Helpers ──

  /** "Item 66a" → "item_66a.json" — règle stable du plan QCM */
  function itemToFilename(itemLabel) {
    const m = String(itemLabel || '').match(/Item\s+(\w+)/i);
    if (!m) throw new Error('Libellé item invalide : ' + itemLabel);
    return 'item_' + m[1].toLowerCase() + '.json';
  }

  /** "Item 76" + n° question → "Item 76 - Q12" (identifiant stable signalements) */
  function questionSourceId(itemLabel, numero) {
    return `${itemLabel} - Q${numero}`;
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // ── API publique ──

  const QCMEngine = {

    /** Charge le catalogue (index.json) — léger, à appeler une fois au démarrage */
    async loadIndex() {
      if (_index) return _index;
      const resp = await fetch(DATA_BASE + 'index.json', { cache: 'force-cache' });
      if (!resp.ok) throw new Error('Échec chargement index.json : ' + resp.status);
      _index = await resp.json();
      return _index;
    },

    /** Charge un item à la demande, met en cache mémoire */
    async loadItem(itemLabel) {
      if (_itemsCache.has(itemLabel)) return _itemsCache.get(itemLabel);
      const filename = itemToFilename(itemLabel);
      const resp = await fetch(DATA_BASE + filename, { cache: 'force-cache' });
      if (!resp.ok) throw new Error(`Échec chargement ${filename} : ${resp.status}`);
      const json = await resp.json();
      const questions = Array.isArray(json) ? json : (json.qcm || []);
      _itemsCache.set(itemLabel, questions);
      return questions;
    },

    /**
     * Récupère un lot de questions filtrées + ordonnées.
     * @param {Object} opts
     * @param {string|string[]} [opts.item]       Item ou liste d'items (sinon : tous)
     * @param {number}          [opts.difficulte] 1, 2 ou 3 (sinon : toutes)
     * @param {'entrainement'|'examen'} [opts.mode='entrainement']
     * @param {number}          [opts.n=10]       Nombre de questions
     * @returns {Promise<Array>}
     */
    async getQuestions(opts = {}) {
      const { item, difficulte, mode = 'entrainement', n = 10 } = opts;
      await this.loadIndex();

      // Détermine la liste d'items à charger
      let itemLabels;
      if (Array.isArray(item)) itemLabels = item;
      else if (item) itemLabels = [item];
      else itemLabels = _index.items.map(i => i.item);

      // Charge tous les items demandés en parallèle
      const allQuestions = (await Promise.all(itemLabels.map(l => this.loadItem(l)))).flat();

      // Filtre difficulté
      let pool = allQuestions;
      if (difficulte) pool = pool.filter(q => q.difficulte === difficulte);

      // Mode entraînement : tirage aléatoire ; examen : séquentiel
      const ordered = mode === 'examen' ? pool : shuffle(pool);
      return ordered.slice(0, n);
    },

    /** Sauvegarde une session terminée + ses réponses (atomique via 2 inserts) */
    async saveSession({ item, mode, nb_questions, score, reponses }) {
      if (!window.sb) throw new Error('Client Supabase indisponible');
      const { data: user } = await window.sb.auth.getUser();
      if (!user?.user) throw new Error('Utilisateur non authentifié');

      const { data: session, error: e1 } = await window.sb
        .from('qcm_sessions')
        .insert({
          user_id: user.user.id,
          item: item || null,
          mode,
          nb_questions,
          score
        })
        .select()
        .single();
      if (e1) throw e1;

      if (Array.isArray(reponses) && reponses.length) {
        const rows = reponses.map(r => ({
          session_id: session.id,
          question_source: r.question_source,
          reponse_choisie: r.reponse_choisie,
          correct: r.correct,
          temps_ms: r.temps_ms ?? null
        }));
        const { error: e2 } = await window.sb.from('qcm_reponses').insert(rows);
        if (e2) throw e2;
      }
      return session;
    },

    /** Signale une question (erreur ou demande d'explication au tuteur) */
    async flagQuestion(question_source, type, message) {
      if (!window.sb) throw new Error('Client Supabase indisponible');
      const { data: user } = await window.sb.auth.getUser();
      if (!user?.user) throw new Error('Utilisateur non authentifié');

      const { data, error } = await window.sb
        .from('qcm_flags')
        .insert({
          user_id: user.user.id,
          question_source,
          type,
          message: message || null
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    /** Liste les signalements de l'utilisateur courant */
    async getMyFlags() {
      if (!window.sb) throw new Error('Client Supabase indisponible');
      const { data, error } = await window.sb
        .from('qcm_flags')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    /** Statistiques : agrégation des sessions de l'utilisateur courant */
    async getMyStats() {
      if (!window.sb) throw new Error('Client Supabase indisponible');
      const { data, error } = await window.sb
        .from('qcm_sessions')
        .select('item, mode, nb_questions, score, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },

    // Exposé pour debug / tests
    _utils: { itemToFilename, questionSourceId, shuffle }
  };

  window.QCMEngine = QCMEngine;
})();
