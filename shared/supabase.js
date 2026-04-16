/**
 * USCA Connect — Client Supabase + CRUD helpers
 * Chargé après le SDK Supabase (CDN UMD) via <script>
 * Expose : window.sb (client) et window.db (helpers CRUD)
 */

// ── Configuration ──
const SUPABASE_URL = 'https://pydxfoqxgvbmknzjzecn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZHhmb3F4Z3ZibWtuemp6ZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTgyNTEsImV4cCI6MjA5MTY5NDI1MX0.8Q8-wJUiOLHdf3vtMAvXMQ4JaylTGE-lm5viPWeVfZU';

// ── Storage robuste (fallback sessionStorage si Safari restrictif / navigation privée) ──
const safeStorage = (() => {
  try {
    localStorage.setItem('_usca_test', '1');
    localStorage.removeItem('_usca_test');
    return localStorage;
  } catch {
    console.warn('[USCA] localStorage inaccessible — fallback sessionStorage');
    return sessionStorage;
  }
})();
const hasLocalStorage = safeStorage === localStorage;
window._uscaHasLocalStorage = hasLocalStorage;

// ── Init client Supabase ──
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: safeStorage,
    storageKey: 'usca-auth-v2',
    flowType: 'pkce',
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true
  }
});
window.sb = sb;

// ── CRUD Helpers ──
window.db = {

  // ════════════════ PROFILES ════════════════

  /** Récupère le profil d'un soignant par son user ID (auth) */
  async getProfile(userId) {
    const { data, error } = await sb.from('profiles').select('*').eq('id', userId).single();
    if (error) throw error;
    return data;
  },

  /** Met à jour un profil soignant */
  async updateProfile(id, updates) {
    const { data, error } = await sb.from('profiles').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  /** Liste tous les profils (admin) */
  async getAllProfiles() {
    const { data, error } = await sb.from('profiles').select('*').order('nom');
    if (error) throw error;
    return data;
  },

  // ════════════════ PATIENTS ════════════════

  /** Vérifie un patient par chambre + date de naissance (login patient) */
  async getPatientByRoom(room, dob) {
    const { data, error } = await sb
      .from('patients')
      .select('id, prenom, programme_id, numero_chambre, substance_principale, date_admission, date_sortie_prevue')
      .eq('numero_chambre', room)
      .eq('date_naissance', dob)
      .single();
    if (error) return null; // Pas trouvé = login échoué
    return data;
  },

  /** Liste tous les patients (staff) */
  async getPatients() {
    const { data, error } = await sb
      .from('patients')
      .select('*')
      .order('numero_chambre');
    if (error) throw error;
    return data;
  },

  /** Crée un patient */
  async createPatient(patient) {
    const { data, error } = await sb.from('patients').insert(patient).select().single();
    if (error) throw error;
    return data;
  },

  /** Met à jour un patient */
  async updatePatient(id, updates) {
    const { data, error } = await sb.from('patients').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ════════════════ ALERTES ════════════════

  /** Crée une alerte (craving, effet indésirable, etc.) */
  async createAlerte(alerte) {
    const { data, error } = await sb.from('alertes').insert(alerte).select().single();
    if (error) throw error;
    return data;
  },

  /** Alertes non traitées (staff dashboard) */
  async getAlertesNonTraitees() {
    const { data, error } = await sb
      .from('alertes')
      .select('*')
      .in('statut', ['non_traitee', 'en_cours'])
      .order('horodatage', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Historique des alertes avec limite */
  async getAlertesHistorique(limit = 50) {
    const { data, error } = await sb
      .from('alertes')
      .select('*')
      .order('horodatage', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  /** Met à jour le statut d'une alerte */
  async updateAlerteStatut(id, statut, traitee_par = null) {
    const updates = { statut };
    if (traitee_par) updates.traitee_par = traitee_par;
    const { data, error } = await sb.from('alertes').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ════════════════ GROUPES ════════════════

  /** Liste des groupes du jour */
  async getGroupesDuJour() {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await sb
      .from('groupes')
      .select('*')
      .gte('horaire', today + 'T00:00:00')
      .lte('horaire', today + 'T23:59:59')
      .order('horaire');
    if (error) throw error;
    return data;
  },

  /** Tous les groupes */
  async getGroupes() {
    const { data, error } = await sb.from('groupes').select('*').order('horaire');
    if (error) throw error;
    return data;
  },

  /** Crée un groupe */
  async createGroupe(groupe) {
    const { data, error } = await sb.from('groupes').insert(groupe).select().single();
    if (error) throw error;
    return data;
  },

  /** Met à jour un groupe */
  async updateGroupe(id, updates) {
    const { data, error } = await sb.from('groupes').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  /** Met à jour la liste des participants (présence) */
  async updatePresence(id, participants) {
    const { data, error } = await sb.from('groupes').update({ participants }).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ════════════════ PROGRAMMES ════════════════

  /** Liste des programmes templates */
  async getProgrammes() {
    const { data, error } = await sb.from('programmes').select('*').order('nom');
    if (error) throw error;
    return data;
  },

  /** Programme par ID */
  async getProgrammeById(id) {
    const { data, error } = await sb.from('programmes').select('*').eq('id', id).single();
    if (error) throw error;
    return data;
  },

  /** Crée un programme template */
  async createProgramme(programme) {
    const { data, error } = await sb.from('programmes').insert(programme).select().single();
    if (error) throw error;
    return data;
  },

  // ════════════════ STRATÉGIES (patient) ════════════════

  /** Récupère les stratégies d'un patient */
  async getStrategies(patientId) {
    const { data, error } = await sb.from('strategies').select('*').eq('patient_id', patientId).order('created_at');
    if (error) throw error;
    return data;
  },

  /** Crée une stratégie */
  async createStrategie(strategie) {
    const { data, error } = await sb.from('strategies').insert(strategie).select().single();
    if (error) throw error;
    return data;
  },

  /** Supprime une stratégie */
  async deleteStrategie(id) {
    const { error } = await sb.from('strategies').delete().eq('id', id);
    if (error) throw error;
  },

  // ════════════════ HISTORIQUE CRAVING ════════════════

  /** Historique des alertes craving d'un patient (pour le PDF et les stats) */
  async getCravingHistory(patientId) {
    const { data, error } = await sb
      .from('alertes')
      .select('*')
      .eq('patient_id', patientId)
      .eq('type', 'craving')
      .order('horodatage', { ascending: true });
    if (error) throw error;
    return data;
  },

  // ════════════════ PRESCRIPTIONS (fiches traitements) ════════════════

  /** Récupère les prescriptions d'un patient */
  async getPrescriptions(patientId) {
    const { data, error } = await sb.from('prescriptions').select('*').eq('patient_id', patientId).order('created_at');
    if (error) throw error;
    return data;
  },

  /** Ajoute une fiche prescrite à un patient */
  async addPrescription(patientId, ficheSlug, prescritPar) {
    const { data, error } = await sb.from('prescriptions').insert({
      patient_id: patientId,
      fiche_slug: ficheSlug,
      prescrit_par: prescritPar
    }).select().single();
    if (error) throw error;
    return data;
  },

  /** Retire une fiche prescrite */
  async removePrescription(patientId, ficheSlug) {
    const { error } = await sb.from('prescriptions').delete().eq('patient_id', patientId).eq('fiche_slug', ficheSlug);
    if (error) throw error;
  },

  // ════════════════ ÉVÉNEMENTS (RDV, entretiens, consultations) ════════════════

  async getEvenements(patientId) {
    const { data, error } = await sb.from('evenements').select('*').eq('patient_id', patientId).order('date_heure', { ascending: true });
    if (error) throw error;
    return data;
  },

  async createEvenement(evt) {
    const { data, error } = await sb.from('evenements').insert(evt).select().single();
    if (error) throw error;
    return data;
  },

  async deleteEvenement(id) {
    const { error } = await sb.from('evenements').delete().eq('id', id);
    if (error) throw error;
  },

  // ════════════════ PERMISSIONS ════════════════

  async getPermissions(patientId) {
    const { data, error } = await sb.from('permissions').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createPermission(perm) {
    const { data, error } = await sb.from('permissions').insert(perm).select().single();
    if (error) throw error;
    return data;
  },

  async getAllPermissionsEnAttente() {
    const { data, error } = await sb.from('permissions').select('*').eq('statut', 'en_attente').order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async updatePermission(id, updates) {
    const { data, error } = await sb.from('permissions').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ════════════════ CONTENUS PARTAGÉS ════════════════

  async getContenus(patientId) {
    const { data, error } = await sb.from('contenus_partages').select('*').eq('patient_id', patientId).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async createContenu(contenu) {
    const { data, error } = await sb.from('contenus_partages').insert(contenu).select().single();
    if (error) throw error;
    return data;
  },

  async deleteContenu(id) {
    const { error } = await sb.from('contenus_partages').delete().eq('id', id);
    if (error) throw error;
  },

  // ════════════════ DATE DE SORTIE ════════════════

  async updatePatientSortie(patientId, dateSortie) {
    const { data, error } = await sb.from('patients').update({ date_sortie_prevue: dateSortie }).eq('id', patientId).select().single();
    if (error) throw error;
    return data;
  },

  // ════════════════ ANIMATEURS DE GROUPES ════════════════

  /** Liste tous les animateurs de groupes */
  async getGroupeAnimateurs() {
    const { data, error } = await sb.from('groupe_animateurs').select('*').order('created_at');
    if (error) throw error;
    return data;
  },

  /** Se désigner animateur d'un groupe */
  async addGroupeAnimateur(groupeSlug, userId, nomAffiche) {
    const { data, error } = await sb.from('groupe_animateurs').insert({
      groupe_slug: groupeSlug,
      user_id: userId,
      nom_affiche: nomAffiche
    }).select().single();
    if (error) throw error;
    return data;
  },

  /** Se retirer comme animateur d'un groupe */
  async removeGroupeAnimateur(groupeSlug, userId) {
    const { error } = await sb.from('groupe_animateurs').delete().eq('groupe_slug', groupeSlug).eq('user_id', userId);
    if (error) throw error;
  },

  // ════════════════ MODIFICATIONS DE GROUPES ════════════════

  /** Récupère les modifications pour une date donnée */
  async getGroupeModifications(dateStr) {
    const { data, error } = await sb.from('groupe_modifications').select('*').eq('date_effet', dateStr);
    if (error) throw error;
    return data;
  },

  /** Crée ou met à jour une modification de groupe (upsert sur slug+date) */
  async upsertGroupeModification(mod) {
    const { data, error } = await sb.from('groupe_modifications')
      .upsert(mod, { onConflict: 'groupe_slug,date_effet' })
      .select().single();
    if (error) throw error;
    return data;
  },

  /** Supprime une modification (retour à l'horaire normal) */
  async deleteGroupeModification(groupeSlug, dateStr) {
    const { error } = await sb.from('groupe_modifications').delete().eq('groupe_slug', groupeSlug).eq('date_effet', dateStr);
    if (error) throw error;
  },

  // ════════════════ RAPPELS DE GROUPE ════════════════

  /** Envoyer un rappel pour un groupe */
  async sendGroupeRappel(groupeSlug, dateStr, message, envoyePar) {
    const { data, error } = await sb.from('groupe_rappels').insert({
      groupe_slug: groupeSlug, date_effet: dateStr, message: message, envoye_par: envoyePar
    }).select().single();
    if (error) throw error;
    return data;
  },

  /** Récupère les rappels du jour pour un patient */
  async getGroupeRappels(dateStr) {
    const { data, error } = await sb.from('groupe_rappels').select('*').eq('date_effet', dateStr).order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  // ════════════════ PARTICIPATIONS AUX GROUPES ════════════════

  /** Upsert une participation (patient ou animateur) */
  async upsertParticipation(patientId, groupeSlug, groupeNom, dateStr, present, cochePar) {
    const { data, error } = await sb.from('participations')
      .upsert({ patient_id: patientId, groupe_slug: groupeSlug, groupe_nom: groupeNom, date_groupe: dateStr, present: present, coche_par: cochePar },
        { onConflict: 'patient_id,groupe_slug,date_groupe' })
      .select().single();
    if (error) throw error;
    return data;
  },

  /** Participations d'un patient (historique) */
  async getParticipationsPatient(patientId) {
    const { data, error } = await sb.from('participations').select('*').eq('patient_id', patientId).order('date_groupe', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Participations pour un groupe à une date (animateur) */
  async getParticipationsGroupe(groupeSlug, dateStr) {
    const { data, error } = await sb.from('participations').select('*').eq('groupe_slug', groupeSlug).eq('date_groupe', dateStr);
    if (error) throw error;
    return data;
  },

  // ════════════════ DEMANDES DE SÉANCES ════════════════

  /** Créer ou mettre à jour une demande de séance (patient) */
  async upsertDemandeSeance(patientId, dateStr, groupeSlug) {
    const { data, error } = await sb.from('demandes_seances')
      .upsert({ patient_id: patientId, date_demande: dateStr, groupe_slug: groupeSlug || 'therapies-complementaires', statut: 'en_attente' },
        { onConflict: 'patient_id,date_demande,groupe_slug' })
      .select().single();
    if (error) throw error;
    return data;
  },

  /** Demandes d'un patient */
  async getDemandesPatient(patientId) {
    const { data, error } = await sb.from('demandes_seances').select('*').eq('patient_id', patientId).order('date_demande', { ascending: false });
    if (error) throw error;
    return data;
  },

  /** Demandes pour une date (animateur) */
  async getDemandesParDate(dateStr) {
    const { data, error } = await sb.from('demandes_seances').select('*').eq('date_demande', dateStr);
    if (error) throw error;
    return data;
  },

  /** Toutes les demandes en attente (animateur) */
  async getDemandesEnAttente() {
    const { data, error } = await sb.from('demandes_seances').select('*').eq('statut', 'en_attente').order('date_demande');
    if (error) throw error;
    return data;
  },

  /** Valider/refuser une demande (animateur) — avec ou sans horaire */
  async updateDemandeSeance(id, updates) {
    const { data, error } = await sb.from('demandes_seances').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  // ════════════════ ÉVÉNEMENTS D'ÉQUIPE ════════════════

  /** Créer un événement d'équipe (sans patient_id) */
  async createEvenementEquipe(evt) {
    const { data, error } = await sb.from('evenements').insert(evt).select().single();
    if (error) throw error;
    return data;
  },

  /** Événements d'équipe pour une date (patient_id IS NULL) */
  async getEvenementsEquipe(dateStr) {
    const { data, error } = await sb.from('evenements').select('*').is('patient_id', null).gte('date_heure', dateStr + 'T00:00:00').lte('date_heure', dateStr + 'T23:59:59').order('date_heure');
    if (error) throw error;
    return data;
  },

  /** Supprimer un événement d'équipe */
  async deleteEvenementEquipe(id) {
    const { error } = await sb.from('evenements').delete().eq('id', id);
    if (error) throw error;
  },

  // ════════════════ PRÉSENCES RÉUNIONS STAFF ════════════════

  /** Upsert présence à une réunion */
  async upsertPresenceReunion(reunionSlug, dateStr, userId, present) {
    const { data, error } = await sb.from('presences_reunions')
      .upsert({ reunion_slug: reunionSlug, date_reunion: dateStr, user_id: userId, present: present },
        { onConflict: 'reunion_slug,date_reunion,user_id' })
      .select().single();
    if (error) throw error;
    return data;
  },

  /** Présences pour une réunion à une date */
  async getPresencesReunion(reunionSlug, dateStr) {
    const { data, error } = await sb.from('presences_reunions').select('*').eq('reunion_slug', reunionSlug).eq('date_reunion', dateStr);
    if (error) throw error;
    return data;
  },

  // ── Liste d'attente ──

  /** Récupère la liste d'attente triée par date d'entrée prévue */
  async getListeAttente() {
    const { data, error } = await sb.from('liste_attente').select('*').order('date_entree_prevue', { ascending: true, nullsFirst: false });
    if (error) throw error;
    return data;
  },

  /** Ajoute un patient à la liste d'attente */
  async addListeAttente(item) {
    const { data, error } = await sb.from('liste_attente').insert(item).select().single();
    if (error) throw error;
    return data;
  },

  /** Met à jour un patient de la liste d'attente */
  async updateListeAttente(id, updates) {
    updates.updated_at = new Date().toISOString();
    const { data, error } = await sb.from('liste_attente').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },

  /** Supprime un patient de la liste d'attente */
  async deleteListeAttente(id) {
    const { error } = await sb.from('liste_attente').delete().eq('id', id);
    if (error) throw error;
  }
};
