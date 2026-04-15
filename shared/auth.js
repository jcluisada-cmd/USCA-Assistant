/**
 * USCA Connect — Gestion de l'authentification
 * Dépend de : shared/supabase.js (window.sb, window.db)
 * Expose : window.auth
 */

window.auth = {

  // ════════════════ AUTH STAFF (Supabase Auth) ════════════════

  /**
   * Connexion soignant par email + mot de passe
   * Retourne le profil complet ou lance une erreur
   */
  async loginStaff(email, password) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw new Error('Email ou mot de passe incorrect');
    // Récupérer le profil dans la table profiles
    const profile = await db.getProfile(data.user.id);
    // Stocker le profil en session
    sessionStorage.setItem('staff_profile', JSON.stringify(profile));
    return profile;
  },

  /**
   * Inscription soignant (admin uniquement en Phase 4 RBAC)
   */
  async registerStaff(email, password, nom, role, isAdmin) {
    const { data, error } = await sb.auth.signUp({ email, password });
    if (error) throw new Error(error.message);
    // Créer le profil dans la table profiles
    const { error: profileError } = await sb.from('profiles').insert({
      id: data.user.id,
      email,
      nom,
      role,
      is_admin: isAdmin || false,
      modules_actifs: auth._defaultModules(role)
    });
    if (profileError) throw new Error(profileError.message);
    return data.user;
  },

  /** Modules par défaut selon le rôle */
  _defaultModules(role) {
    const map = {
      admin: ['toolbox', 'dashboard', 'alertes', 'groupes', 'config'],
      medecin: ['toolbox', 'dashboard', 'alertes', 'groupes', 'config'],
      ide: ['toolbox', 'dashboard', 'alertes', 'groupes', 'config'],
      etudiant: ['toolbox'],
      animateur: ['groupes']
    };
    return map[role] || [];
  },

  /** Déconnexion soignant */
  async logoutStaff() {
    await sb.auth.signOut();
    sessionStorage.removeItem('staff_profile');
    sessionStorage.removeItem('pin_hash');
  },

  /** Vérifie si un soignant est connecté, retourne le profil ou null */
  async getStaffSession() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    // Vérifier si le profil est en cache
    const cached = sessionStorage.getItem('staff_profile');
    if (cached) return JSON.parse(cached);
    // Sinon le récupérer
    try {
      const profile = await db.getProfile(session.user.id);
      sessionStorage.setItem('staff_profile', JSON.stringify(profile));
      return profile;
    } catch {
      return null;
    }
  },

  // ════════════════ AUTH PATIENT (chambre + DDN) ════════════════

  /** Tentatives de connexion patient — rate limiting */
  _patientAttempts: 0,
  _patientLockUntil: 0,

  /**
   * Connexion patient par chambre + date de naissance
   * Retourne les données patient ou null
   */
  async loginPatient(room, dob) {
    // Rate limiting : 3 tentatives max, puis 5 min de blocage
    if (Date.now() < auth._patientLockUntil) {
      const remaining = Math.ceil((auth._patientLockUntil - Date.now()) / 1000);
      throw new Error(`Trop de tentatives. Réessayez dans ${remaining}s`);
    }

    const patient = await db.getPatientByRoom(room.trim(), dob);
    if (!patient) {
      auth._patientAttempts++;
      if (auth._patientAttempts >= 3) {
        auth._patientLockUntil = Date.now() + 5 * 60 * 1000; // 5 min
        auth._patientAttempts = 0;
        throw new Error('Trop de tentatives. Réessayez dans 5 minutes');
      }
      throw new Error('Chambre ou date de naissance incorrecte');
    }

    // Succès — reset compteur et stocker en session persistante (30 jours)
    auth._patientAttempts = 0;
    // On ne stocke que l'ID et le prénom (pas de PII sensible)
    localStorage.setItem('patient_session', JSON.stringify({
      id: patient.id,
      prenom: patient.prenom,
      chambre: patient.numero_chambre,
      programme_id: patient.programme_id,
      substance: patient.substance_principale,
      expires: Date.now() + 30 * 24 * 60 * 60 * 1000 // 30 jours
    }));
    return patient;
  },

  /** Récupère la session patient ou null (vérifie expiration) */
  getPatientSession() {
    const cached = localStorage.getItem('patient_session');
    if (!cached) return null;
    const session = JSON.parse(cached);
    if (session.expires && Date.now() > session.expires) {
      localStorage.removeItem('patient_session');
      return null;
    }
    return session;
  },

  /** Déconnexion patient */
  logoutPatient() {
    localStorage.removeItem('patient_session');
  },

  // ════════════════ PIN LOCK (soignants) ════════════════

  /**
   * Hash un PIN via Web Crypto API (SHA-256)
   * Retourne le hash en hexadécimal
   */
  async hashPin(pin) {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  /** Enregistre un PIN hashé */
  async setPin(pin) {
    const hash = await auth.hashPin(pin);
    localStorage.setItem('usca_pin_hash', hash);
  },

  /** Vérifie un PIN */
  async verifyPin(pin) {
    const stored = localStorage.getItem('usca_pin_hash');
    if (!stored) return true; // Pas de PIN configuré
    const hash = await auth.hashPin(pin);
    return hash === stored;
  },

  /** PIN configuré ? */
  hasPin() {
    return !!localStorage.getItem('usca_pin_hash');
  },

  // ════════════════ INACTIVITÉ ════════════════

  _inactivityTimer: null,
  _onLock: null, // Callback quand le verrou s'active

  /**
   * Démarre la surveillance d'inactivité
   * @param {number} timeoutMs — délai avant verrouillage (défaut 1h)
   * @param {function} onLock — callback quand le verrou s'active
   */
  setupInactivityLock(timeoutMs = 60 * 60 * 1000, onLock) {
    auth._onLock = onLock;

    const resetTimer = () => {
      clearTimeout(auth._inactivityTimer);
      auth._inactivityTimer = setTimeout(() => {
        if (auth._onLock) auth._onLock();
      }, timeoutMs);
    };

    // Écouter les interactions utilisateur
    ['click', 'keydown', 'touchstart', 'scroll'].forEach(event => {
      document.addEventListener(event, resetTimer, { passive: true });
    });

    resetTimer();
  },

  /** Arrête la surveillance d'inactivité */
  clearInactivityLock() {
    clearTimeout(auth._inactivityTimer);
  }
};
