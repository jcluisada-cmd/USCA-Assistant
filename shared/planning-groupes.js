/**
 * USCA Connect — Planning des groupes thérapeutiques
 * Partagé entre le module patient et le module admin
 */
window.PLANNING_GROUPES = [
  { jour: 1, slug: 'psychoeducation', nom: 'Atelier Psychoéducation', type: 'atelier', debut: '14:00', fin: '15:00' },
  { jour: 2, slug: 'craving-rrd', nom: 'Craving et réduction des risques et dommages', type: 'groupe', debut: '14:30', fin: '16:00' },
  { jour: 3, slug: 'tabac-pick-klop', nom: 'Tabac Pick-Klop', type: 'groupe_jeu', debut: '11:30', fin: '12:15' },
  { jour: 3, slug: 'gestion-emotions', nom: 'Gestion des émotions', type: 'atelier', debut: '15:00', fin: '16:00' },
  { jour: 4, slug: 'therapies-complementaires', nom: 'Séances Thérapies Complémentaires', type: 'therapie', debut: null, fin: null, detail: 'Acupuncture, auriculothérapie, hypnose' },
  { jour: 5, slug: 'strategies-comportementales', nom: 'Stratégies comportementales', type: 'atelier', debut: '11:30', fin: '12:15' },
  { jour: 5, slug: 'prevention-rechute', nom: 'Prévention de la rechute', type: 'groupe', debut: '15:30', fin: '16:30' }
];

window.JOURS_SEMAINE = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
