/**
 * USCA Connect — Client Supabase + CRUD helpers
 * Chargé après le SDK Supabase (CDN UMD) via <script>
 * Expose : window.sb (client) et window.db (helpers CRUD)
 */

// ── Configuration ──
const SUPABASE_URL = 'https://pydxfoqxgvbmknzjzecn.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB5ZHhmb3F4Z3ZibWtuemp6ZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYxMTgyNTEsImV4cCI6MjA5MTY5NDI1MX0.8Q8-wJUiOLHdf3vtMAvXMQ4JaylTGE-lm5viPWeVfZU';

// ── Init client Supabase ──
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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
  }
};
