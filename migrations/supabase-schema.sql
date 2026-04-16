-- ══════════════════════════════════════════════════════════
-- USCA Connect — Schéma de base de données Supabase
-- À exécuter dans Supabase → SQL Editor → New query
-- Ordre : programmes → profiles → patients → groupes → alertes
-- ══════════════════════════════════════════════════════════

-- ──────────────────────────────────────────
-- 1. TABLE : programmes (templates journaliers)
-- ──────────────────────────────────────────
CREATE TABLE programmes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  activites JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────
-- 2. TABLE : profiles (soignants)
-- ──────────────────────────────────────────
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'medecin', 'ide', 'etudiant', 'animateur')),
  modules_actifs JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────
-- 3. TABLE : patients (hospitalisés)
-- ──────────────────────────────────────────
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero_chambre TEXT NOT NULL,
  date_naissance DATE NOT NULL,
  prenom TEXT,
  programme_id UUID REFERENCES programmes(id),
  date_admission DATE DEFAULT CURRENT_DATE,
  date_sortie_prevue DATE,
  substance_principale TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────
-- 4. TABLE : groupes (thérapeutiques)
-- ──────────────────────────────────────────
CREATE TABLE groupes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nom TEXT NOT NULL,
  type TEXT,
  horaire TIMESTAMPTZ NOT NULL,
  animateur_id UUID REFERENCES profiles(id),
  participants UUID[] DEFAULT '{}',
  recurrence TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────
-- 5. TABLE : alertes (craving, urgences, etc.)
-- ──────────────────────────────────────────
CREATE TABLE alertes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  numero_chambre TEXT,
  type TEXT NOT NULL CHECK (type IN ('craving', 'effet_indesirable', 'urgence', 'demande')),
  message TEXT,
  intensite INTEGER CHECK (intensite BETWEEN 1 AND 10),
  statut TEXT DEFAULT 'non_traitee' CHECK (statut IN ('non_traitee', 'en_cours', 'traitee')),
  traitee_par UUID REFERENCES profiles(id),
  horodatage TIMESTAMPTZ DEFAULT now()
);

-- ──────────────────────────────────────────
-- INDEX pour les requêtes fréquentes
-- ──────────────────────────────────────────
CREATE INDEX idx_alertes_statut ON alertes(statut);
CREATE INDEX idx_alertes_patient ON alertes(patient_id);
CREATE INDEX idx_alertes_horodatage ON alertes(horodatage DESC);
CREATE INDEX idx_patients_chambre ON patients(numero_chambre);
CREATE INDEX idx_patients_sortie ON patients(date_sortie_prevue);

-- ══════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ══════════════════════════════════════════════════════════

-- ── PROFILES ──
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Les soignants authentifiés peuvent lire tous les profils
CREATE POLICY "profiles_select_auth" ON profiles
  FOR SELECT USING (auth.role() = 'authenticated');

-- Chaque soignant peut modifier son propre profil
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Insertion uniquement par les soignants authentifiés (inscription)
CREATE POLICY "profiles_insert_auth" ON profiles
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ── PATIENTS ──
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Lecture publique (patients anon doivent vérifier leur chambre+DDN)
CREATE POLICY "patients_select_all" ON patients
  FOR SELECT USING (true);

-- Modification par les soignants authentifiés uniquement
CREATE POLICY "patients_insert_auth" ON patients
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "patients_update_auth" ON patients
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "patients_delete_auth" ON patients
  FOR DELETE USING (auth.role() = 'authenticated');

-- ── PROGRAMMES ──
ALTER TABLE programmes ENABLE ROW LEVEL SECURITY;

-- Lecture publique (patients voient leur programme)
CREATE POLICY "programmes_select_all" ON programmes
  FOR SELECT USING (true);

-- Modification par les soignants
CREATE POLICY "programmes_insert_auth" ON programmes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "programmes_update_auth" ON programmes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ── GROUPES ──
ALTER TABLE groupes ENABLE ROW LEVEL SECURITY;

-- Lecture publique (patients voient leur planning)
CREATE POLICY "groupes_select_all" ON groupes
  FOR SELECT USING (true);

-- Modification par les soignants
CREATE POLICY "groupes_insert_auth" ON groupes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "groupes_update_auth" ON groupes
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "groupes_delete_auth" ON groupes
  FOR DELETE USING (auth.role() = 'authenticated');

-- ── ALERTES ──
ALTER TABLE alertes ENABLE ROW LEVEL SECURITY;

-- Lecture par les soignants authentifiés
CREATE POLICY "alertes_select_auth" ON alertes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Insertion par tous (patients anon envoient des alertes craving)
CREATE POLICY "alertes_insert_all" ON alertes
  FOR INSERT WITH CHECK (true);

-- Mise à jour par les soignants (prise en charge, traitement)
CREATE POLICY "alertes_update_auth" ON alertes
  FOR UPDATE USING (auth.role() = 'authenticated');

-- ══════════════════════════════════════════════════════════
-- DONNÉES INITIALES
-- ══════════════════════════════════════════════════════════

-- Programme template : sevrage alcool standard
INSERT INTO programmes (nom, activites) VALUES (
  'Sevrage alcool standard',
  '[
    {"heure": "07:30", "label": "Réveil, constantes, Cushman", "type": "soin", "lieu": "Chambre"},
    {"heure": "08:00", "label": "Petit-déjeuner", "type": "repas", "lieu": "Salle commune"},
    {"heure": "09:00", "label": "Visite médicale", "type": "soin", "lieu": "Chambre"},
    {"heure": "10:00", "label": "Groupe psychoéducation", "type": "groupe", "lieu": "Salle A"},
    {"heure": "11:00", "label": "Temps libre / entretien IDE", "type": "soin", "lieu": "Unité"},
    {"heure": "12:00", "label": "Déjeuner", "type": "repas", "lieu": "Salle commune"},
    {"heure": "14:00", "label": "Activité thérapeutique (art-thérapie / TRV)", "type": "activite", "lieu": "Salle B"},
    {"heure": "15:30", "label": "Groupe prévention de la rechute", "type": "groupe", "lieu": "Salle A"},
    {"heure": "16:30", "label": "Temps libre / visites", "type": "libre", "lieu": "Unité"},
    {"heure": "18:00", "label": "Constantes, Cushman", "type": "soin", "lieu": "Chambre"},
    {"heure": "19:00", "label": "Dîner", "type": "repas", "lieu": "Salle commune"},
    {"heure": "21:00", "label": "Traitement du soir, relaxation", "type": "soin", "lieu": "Chambre"}
  ]'
);

-- Programme template : sevrage opioïdes BHD
INSERT INTO programmes (nom, activites) VALUES (
  'Sevrage opioïdes — relais BHD',
  '[
    {"heure": "07:30", "label": "Réveil, constantes, COWS", "type": "soin", "lieu": "Chambre"},
    {"heure": "08:00", "label": "Petit-déjeuner", "type": "repas", "lieu": "Salle commune"},
    {"heure": "09:00", "label": "Visite médicale — évaluation COWS", "type": "soin", "lieu": "Chambre"},
    {"heure": "10:00", "label": "Groupe psychoéducation", "type": "groupe", "lieu": "Salle A"},
    {"heure": "11:00", "label": "Entretien IDE / assistante sociale", "type": "soin", "lieu": "Bureau IDE"},
    {"heure": "12:00", "label": "Déjeuner", "type": "repas", "lieu": "Salle commune"},
    {"heure": "14:00", "label": "Acupuncture NADA / hypnose", "type": "activite", "lieu": "Salle B"},
    {"heure": "15:30", "label": "Groupe TCC addictions", "type": "groupe", "lieu": "Salle A"},
    {"heure": "16:30", "label": "Temps libre / visites", "type": "libre", "lieu": "Unité"},
    {"heure": "18:00", "label": "Constantes, COWS, ajustement TSO", "type": "soin", "lieu": "Chambre"},
    {"heure": "19:00", "label": "Dîner", "type": "repas", "lieu": "Salle commune"},
    {"heure": "21:00", "label": "Traitement du soir", "type": "soin", "lieu": "Chambre"}
  ]'
);
