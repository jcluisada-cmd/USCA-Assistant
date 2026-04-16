/**
 * USCA Connect — Planning des groupes thérapeutiques (semaine A + B)
 * Partagé entre le module patient et le module admin
 *
 * Roulement sur 2 semaines : A et B
 * Référence : semaine du 2026-04-13 = semaine A
 * Les groupes identiques entre A et B partagent le même slug.
 */

/**
 * Détermine si une date donnée est en semaine A ou B
 * Semaine paire (ISO) = A, semaine impaire = B
 */
window.getWeekType = function(date) {
  var d = date || new Date();
  // Calcul du numéro de semaine ISO 8601
  var tmp = new Date(d.getTime());
  tmp.setHours(0, 0, 0, 0);
  tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
  var week1 = new Date(tmp.getFullYear(), 0, 4);
  var weekNum = 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  return (weekNum % 2 === 0) ? 'A' : 'B';
};

// ── Planning semaine A ──
var PLANNING_A = [
  { jour: 1, slug: 'psychoeducation-a', nom: 'Atelier Psychoéducation', type: 'atelier', debut: '14:00', fin: '15:00' },
  { jour: 2, slug: 'craving-rrd', nom: 'Craving et réduction des risques et dommages', type: 'groupe', debut: '14:30', fin: '16:00' },
  { jour: 3, slug: 'tabac-pick-klop', nom: 'Tabac Pick-Klop', type: 'groupe_jeu', debut: '11:30', fin: '12:15' },
  { jour: 3, slug: 'gestion-emotions-a', nom: 'Gestion des émotions', type: 'atelier', debut: '15:00', fin: '16:00' },
  { jour: 4, slug: 'therapies-complementaires', nom: 'Séances Thérapies Complémentaires', type: 'therapie', debut: null, fin: null, detail: 'Acupuncture, auriculothérapie, hypnose' },
  { jour: 5, slug: 'strategies-comportementales', nom: 'Stratégies comportementales', type: 'atelier', debut: '11:30', fin: '12:15' },
  { jour: 5, slug: 'prevention-rechute', nom: 'Prévention de la rechute', type: 'groupe', debut: '15:30', fin: '16:30' }
];

// ── Planning semaine B ──
var PLANNING_B = [
  { jour: 1, slug: 'psychoeducation-b', nom: 'Psychoéducation / Stratégies cognitives', type: 'atelier', debut: '14:00', fin: '15:00' },
  { jour: 2, slug: 'craving-rrd', nom: 'Craving et réduction des risques et dommages', type: 'groupe', debut: '14:30', fin: '16:00' },
  { jour: 3, slug: 'tabac-jeu-oie', nom: 'Tabac Jeu de l\'Oie', type: 'groupe_jeu', debut: '11:30', fin: '12:15' },
  { jour: 3, slug: 'gestion-emotions-b', nom: 'Gestion des émotions \u2013 ACARA', type: 'atelier', debut: '15:00', fin: '16:00' },
  { jour: 4, slug: 'therapies-complementaires', nom: 'Séances Thérapies Complémentaires', type: 'therapie', debut: null, fin: null, detail: 'Acupuncture, auriculothérapie, hypnose' },
  { jour: 5, slug: 'relaxation-sophrologie', nom: 'Séances Relaxation Sophrologie', type: 'seances', debut: '11:30', fin: '12:15' },
  { jour: 5, slug: 'prevention-rechute', nom: 'Prévention de la rechute', type: 'groupe', debut: '15:30', fin: '16:30' }
];

/**
 * Retourne le planning de la semaine correspondant à une date
 * @param {Date} [date] — par défaut aujourd'hui
 * @returns {Array} — liste des groupes de la semaine
 */
window.getPlanningForDate = function(date) {
  return getWeekType(date) === 'A' ? PLANNING_A : PLANNING_B;
};

/**
 * Retourne les groupes d'un jour précis (0=dim, 1=lun, ..., 6=sam)
 * @param {Date} date
 * @returns {Array}
 */
window.getGroupesForDay = function(date) {
  var planning = getPlanningForDate(date);
  var dayOfWeek = date.getDay(); // 0=dim, 1=lun
  return planning.filter(function(g) { return g.jour === dayOfWeek; });
};

// Exposer les plannings bruts pour l'admin
window.PLANNING_A = PLANNING_A;
window.PLANNING_B = PLANNING_B;

window.JOURS_SEMAINE = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

// ── Réunions d'équipe récurrentes ──
var REUNIONS_A = [
  { jour: 1, slug: 'staff-psychiatrie', nom: 'Staff Psychiatrie', debut: '11:00', fin: '12:00', roles: ['medecin'], presence: true },
  { jour: 2, slug: 'reunion-equipe-mardi', nom: 'R\u00e9union d\'\u00e9quipe', debut: '11:00', fin: '12:00', roles: null },
  { jour: 4, slug: 'reunion-equipe-jeudi', nom: 'R\u00e9union d\'\u00e9quipe', debut: '10:00', fin: '11:00', roles: null }
];

var REUNIONS_B = [
  { jour: 1, slug: 'staff-psychiatrie', nom: 'Staff Psychiatrie', debut: '11:00', fin: '12:00', roles: ['medecin'], presence: true },
  { jour: 2, slug: 'reunion-equipe-mardi', nom: 'R\u00e9union d\'\u00e9quipe', debut: '10:00', fin: '11:00', roles: null },
  { jour: 4, slug: 'reunion-equipe-jeudi', nom: 'R\u00e9union d\'\u00e9quipe', debut: '10:00', fin: '11:00', roles: null }
];

window.REUNIONS_A = REUNIONS_A;
window.REUNIONS_B = REUNIONS_B;

/**
 * Retourne les réunions d'un jour, filtrées par rôle si nécessaire
 * @param {Date} date
 * @param {string} [role] — rôle du soignant (pour filtrer staff psy)
 * @returns {Array}
 */
window.getReunionsForDay = function(date, role) {
  var reunions = getWeekType(date) === 'A' ? REUNIONS_A : REUNIONS_B;
  var dayOfWeek = date.getDay();
  return reunions.filter(function(r) {
    if (r.jour !== dayOfWeek) return false;
    if (r.roles && role && r.roles.indexOf(role) === -1) return false;
    return true;
  });
};
