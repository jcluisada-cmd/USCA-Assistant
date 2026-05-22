# Dashboard role_pds (Poste de Soins infirmier USCA) — Design

**Date** : 2026-05-21 (révisé 2026-05-22)
**Auteur** : Dr JC Luisada (avec Claude)
**Statut** : Brainstorming finalisé — prêt pour writing-plans
**Cible** : USCA Connect v4.39+

---

## 1. Contexte et motivation

L'USCA a deux types d'IDE qui utilisent USCA Connect :

- **IDE de liaison ELSA** (`role_ide` actuel) : voient `/admin/`, suivent leurs patients en liaison, mode bureau diurne.
- **IDE du Poste de Soins (PdS)** : équipe tournante 24/7, 1 PdS en poste à la fois, en charge de **tous les patients hospitalisés** de l'unité. Aucun dashboard adapté aujourd'hui — elles utilisent `/admin/` par défaut, ce qui ne correspond pas à leur workflow.

### Douleurs PdS identifiées (entretien 2026-05-21)

- Informations éparses dans l'application
- Appels téléphoniques fréquents pour obtenir des informations qui devraient être visibles
- Difficulté à convoquer un patient (les soignants se déplacent pour aller le chercher)
- Charge mentale très élevée

### Tâches PdS quotidiennes

- Transmissions entre équipes
- Accueil des patients entrants
- **Surveillance score de Cushman** (sevrage alcoolique, échelle CIWA-Ar FR) plusieurs fois par jour par patient
- Gestion des demandes de permission
- Communication avec patients et équipe

---

## 2. Architecture (validée)

Sous-application dédiée, suit le pattern `/extern/` et `/etudiant/`.

```
USCA-Connect/
├── pds/
│   └── index.html              ← Dashboard PdS (mono-fichier HTML)
├── shared/
│   └── cushman.js              ← Saisie modale + calcul + sauvegarde
├── migrations/
│   └── supabase-migration-v38.sql  ← tables cushman_scores et transmissions + RLS
├── index.html                  ← Routing login : ajout role==='pds' → /pds/
└── sw.js                       ← bump CACHE_NAME → usca-v4.39
```

**Routing** : dans `index.html` (login soignant), ajouter
`else if (role === 'pds') location.href = '/pds/';` à côté des routings `externe` et `etudiant_ide`.

**Stack** : HTML mono-fichier + Tailwind CDN + Supabase SDK CDN. Pas de bundler. Mobile-first, tablette friendly.

**Dark mode** : toggle dans la barre du haut (utile garde de nuit).

**Module partagé `shared/cushman.js`** : saisie + calcul score réutilisables. La Toolbox V1 garde son calculateur React inline (doublon acceptable, tech debt assumée — cf. Q4 session 2026-05-22).

---

## 3. Authentification (validée)

**Compte unique partagé** par toute l'équipe PdS.

| Champ | Valeur |
|---|---|
| Login (prenom.nom) | `pds.usca` |
| Email Supabase | `pds.usca@aphp.fr` |
| Mot de passe | `usca_pds` |
| Rôle | `pds` |
| `is_admin` | `false` |

**Bémol clinique** : pas de signature nominale du Cushman. Traçabilité = timestamp uniquement. À ré-évaluer si besoin légal.

---

## 4. Modèle de données

### 4.1 Migration v38

```sql
-- 1. Nouveau rôle ----------------------------------------------------
-- profiles.role est TEXT → pas de changement de schéma nécessaire.

-- 2. Table cushman_scores -------------------------------------------
CREATE TABLE cushman_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL
    REFERENCES patients(id) ON DELETE CASCADE,
  saisi_le TIMESTAMPTZ NOT NULL DEFAULT now(),
  items JSONB NOT NULL,
    -- {fc:0..3, pa:0..3, fr:0..3, tremblements:0..3,
    --  sueurs:0..3, agitation:0..3, sensoriels:0..3}
    -- 7 items × 4 niveaux = total 0..21
    -- Référentiel identique à la Toolbox V1 (staff/toolbox.html:333-345)
  score_total INT NOT NULL,        -- somme = 0..21
  commentaire TEXT,
  rappel_intervalle_h INT          -- NULL si pas de rappel programmé
);

CREATE INDEX idx_cushman_patient_time
  ON cushman_scores(patient_id, saisi_le DESC);

-- 3. Table transmissions ---------------------------------------------
CREATE TABLE transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL
    REFERENCES patients(id) ON DELETE CASCADE,
  auteur_id UUID NOT NULL REFERENCES profiles(id),
    -- toujours rempli (compte pds.usca a un profile partagé,
    -- les médecins ont leur profile nominal)
  type TEXT NOT NULL CHECK (type IN ('medical','paramedical')),
  contenu TEXT NOT NULL,
  cree_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transmissions_patient_time
  ON transmissions(patient_id, cree_le DESC);

-- 4. RLS cushman_scores ----------------------------------------------
ALTER TABLE cushman_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecture_soignants" ON cushman_scores
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ecriture_pds_ide_medecin" ON cushman_scores
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('pds','ide','medecin')
    )
  );

-- 5. RLS transmissions -----------------------------------------------
ALTER TABLE transmissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lecture_soignants" ON transmissions
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "ecriture_para_pds_ide" ON transmissions
  FOR INSERT WITH CHECK (
    type = 'paramedical' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pds','ide'))
  );

CREATE POLICY "ecriture_med_medecin" ON transmissions
  FOR INSERT WITH CHECK (
    type = 'medical' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'medecin')
  );
```

### 4.2 Choix design

- **`items` en JSONB** : flexible si on ajoute COWS ou enrichit le score. Validation bornes côté client.
- **Pas de `saisi_par`** vu compte partagé. Timestamp = seule signature.
- **`rappel_intervalle_h` nullable** : NULL = pas de rappel. Valeur saisie par le staff dans la modal (par défaut 4 quand Cushman ≥7). Calcul rappel échu = client-side, pas de table dédiée.
- **`transmissions.auteur_id` toujours rempli** : le compte partagé `pds.usca` a un `profile` unique, on stocke cet ID. Pour les médecins, c'est leur profile nominal.
- **`ON DELETE CASCADE`** sur les 2 tables : cohérent avec alertes/strategies/evenements.

### 4.3 Calcul "Cushman à refaire" (client-side)

Pour chaque patient :
```js
const lastScore = patientScores[0]; // ordered DESC by saisi_le
const isOverdue = lastScore
  && lastScore.score_total >= 7
  && lastScore.rappel_intervalle_h !== null
  && (Date.now() - new Date(lastScore.saisi_le).getTime())
     > lastScore.rappel_intervalle_h * 3600 * 1000;
// Pas de "nouveau Cushman saisi depuis" — implicite car lastScore est le plus récent
```

### 4.4 Pas de changement de schéma pour la chambre

`patients.numero_chambre` est déjà une colonne mutable. Le découplage chambre / `patient.id` (UUID) existe déjà — c'est seulement l'UI de modification qui manquait. Pas de migration.

### 4.5 Modifications du code existant

- `admin/index.html` — ajouter `'pds'` dans les listes de rôles (filtres, labels FR « Poste de Soins », couleur émeraude foncée pour distinguer de l'IDE liaison).
- `shared/auth.js` — accepter `role==='pds'` comme rôle valide.
- `MODULES.md` et `DB_SCHEMA.md` — documenter.
- `CLAUDE.md` (table des rôles métier §4) — ajouter `pds`.

---

## 5. UX du Home Screen PdS

### 5.1 Topbar

```
┌──────────────────────────────────────────────────────────┐
│ 🏥 Poste de Soins USCA · 14:32   [🔔 Appeler médecins]🌙 │
└──────────────────────────────────────────────────────────┘
```

- Fond indigo USCA (#4F46E5)
- Horloge live (mise à jour chaque minute)
- **Bouton « 🔔 Appeler médecins USCA »** (cf. §7.2)
- Toggle dark/light mode (🌙 / ☀️)

### 5.2 Bandeau stats

4 pastilles cliquables, basées sur les notifications agrégées de tous les patients :

| Pastille | Source | Couleur |
|---|---|---|
| `N Cushman à refaire` | `cushman_scores` avec rappel échu | Rouge si > 0 |
| `N Demande permission` | `permissions.statut = 'en_attente'` | Neutre |
| `N Absents` | `permissions.statut = 'validee'` ET dans la fenêtre temporelle | Bleu |
| `N Messages` | `messages` non lus par le PdS | Rouge si > 0 |

### 5.3 Cartes patient (3 états visuels)

**Tri** : ordre numérique croissant de chambre (`ORDER BY numero_chambre ASC`).

**Anonymisation** : aucun nom ni prénom affiché. L'identifiant visible est la chambre.

**Header de carte** : `[Chambre] · J[N] · [Sexe H/F] · [Âge] ans · [Bouton 🔔 Appeler à droite, compact]`

**Sous le header** : zone de notifications, n'affiche que les badges présents (rien si vide — pas de texte « rien en attente »).

#### État 1 — Normal

- Fond `var(--bg-primary)`, bordure standard
- Chambre : pill plein indigo (#4F46E5, fond, texte blanc)
- Bouton 🔔 Appeler visible

#### État 2 — Urgent

- Fond rouge pâle (#FEF2F2), bordure rouge (#FCA5A5)
- Chambre : pill plein rouge (#DC2626)
- Conditions : Cushman dernier ≥7 avec rappel échu, OU autres signaux rouges futurs

#### État 3 — En permission

- Fond bleu pâle (#F0F9FF), bordure **pointillée discrète** (#BAE6FD)
- Chambre : **inversée** — fond blanc, bordure bleue (#0EA5E9), texte bleu, taille et police identiques aux autres
- **Bouton Appeler masqué** (patient absent)
- Remplacé par pill `🚶 Retour [heure]` :
  - Format : `Retour 18h` si même jour
  - Format : `Retour 25/05 à 18h` si jour suivant ou ultérieur

#### Notifications (badges arrondis)

| Notification | Icône | Couleur | Source |
|---|---|---|---|
| Demande de permission | 🚶 | Jaune sable (#FEF3C7 / #92400E) | `permissions.statut='en_attente'` |
| En permission | 🚶 | Bleu ciel (#DBEAFE / #075985) | `permissions.statut='validee'` dans la fenêtre |
| Cushman à refaire | 📋 | Rouge (#FECACA / #991B1B) | calcul §4.3 |
| Messages non lus | 💬 | Rose (#FCE7F3 / #9D174D) | `messages` non lus, avec compteur si >1 |

### 5.4 Sections secondaires (sous la grille de cartes)

- **Transmissions globales** : fil chronologique des 10-15 dernières transmissions tous patients confondus. Bouton « + nouvelle transmission » → modal avec choix patient + tag + texte.
- **Messages patients** : preview des conversations avec patients, badge nombre non-lus.

### 5.5 Cartes/modules explicitement retirés

- **Ateliers** : pas dans le workflow PdS.
- **Toolbox** : pas dans le scope du dashboard PdS.

---

## 6. UX Page Détail Patient (vue PdS)

Accès : tap sur une carte patient.

### 6.1 Topbar

```
┌────────────────────────────────────────────────────┐
│ ← Retour  [Ch. 412]  J3       [🔔 Appeler patient] │
└────────────────────────────────────────────────────┘
```

- Pas de nom patient (anonymisation)
- Pas de substance (non saisie dans l'app)
- Pas de médecin référent (concept retiré)
- Bouton 🔔 Appeler patient (cf. §7.3)

### 6.2 Layout 2 colonnes (tablette) / empilé (mobile vertical)

```
┌────────────────────────┬─────────────────────────────┐
│  Colonne gauche fixe   │  Colonne droite (onglets)   │
│                         │                              │
│  📋 Identité            │  [Messages] [Transmissions] │
│  📊 Cushman             │  [Permissions]              │
│  (Changer chambre)      │                              │
└────────────────────────┴─────────────────────────────┘
```

### 6.3 Colonne gauche

#### Carte Identité

```
Chambre       412     [✏️ Changer]
Entrée        19/05 (J3)
Sortie prévue 26/05 (J+7)
Type sortie   [Post-cure]    ← tag coloré
```

- **Chambre** + bouton « ✏️ Changer » (cf. §7.4)
- **Entrée** : date + jour d'hospitalisation calculé
- **Sortie prévue** : date saisie en `/admin/` (ou ailleurs où elle est gérée — à respecter le pattern existant)
- **Type sortie** : tag coloré
  - `RAD` (Retour à domicile) → bleu pâle (#E0F2FE / #0369A1)
  - `Post-cure` → vert pâle (#DCFCE7 / #15803D)
  - `Autre` → gris (#F1F5F9 / #475569)
- Pas de bouton « voir dossier post-cure » (retiré 2026-05-22)
- Pas de motif, ATCD, traitements, allergies (non saisis ailleurs dans l'app actuellement)

#### Carte Cushman

```
   [9]              ← gros chiffre rouge si ≥7, ambre 4-6, vert ≤3
   14:00 · ↑ +2

   → ≥7 : Donner BZD SB    ← callout rouge si ≥7

   [Sparkline 7 derniers scores avec ligne seuil à 7]

   Quand   Par   Score
   14:00   PdS    9    ← ligne surlignée si ≥7
   10:00   PdS    7
   ...

   [+ Nouveau Cushman]
```

- Saisie via modal `shared/cushman.js` (cf. §7.1)
- Pas de log d'administration de BZD dans l'app (décision Q2 v6)

### 6.4 Colonne droite (onglets)

#### Onglet Messages

- Conversation avec le patient (réutilise l'infrastructure messages existante)
- Compteur de messages non lus dans l'onglet

#### Onglet Transmissions

- Fil chronologique des transmissions de ce patient
- Tags : **Médical** (violet #EDE9FE / #6D28D9) et **Paramédical** (vert #D1FAE5 / #047857) — pas d'« Observation libre » (retirée 2026-05-22)
- Formulaire en bas : textarea + select [Paramédical | Médical] + bouton Publier
- PdS écrit en `paramedical`, médecin écrit en `medical` (forcé via RLS)

#### Onglet Permissions

- **Lecture seule** pour le PdS (cf. Q7) — pas de validation possible
- Affiche la chaîne : `Patient (demande) → PdS (voit) → Médecin (à valider)`
- Sections : Demandes en attente, Permissions validées (en cours / passées), Permissions refusées
- Une permission validée+terminée disparaît du dashboard PdS au lendemain
- Champ « motif » affiché uniquement s'il est renseigné par le patient (motif non obligatoire)

---

## 7. Features transverses

### 7.1 Saisie Cushman (modal `shared/cushman.js`)

```
┌─ Nouveau Cushman — Ch. 412 ─────────────────────┐
│                                                   │
│  Fréquence cardiaque  ( ) <80  (•) 80-100        │
│                       ( ) 101-120  ( ) >120      │
│                                                   │
│  PA systolique        ( ) <135  (•) 135-160      │
│                       ( ) 161-200  ( ) >200      │
│                                                   │
│  … 5 autres items (FR, Tremblements, Sueurs,      │
│      Agitation, Troubles sensoriels)              │
│                                                   │
│  ┌─ Score total : 9 ─────────────────────┐       │
│  │   → Donner BZD SB                      │       │
│  └────────────────────────────────────────┘       │
│                                                   │
│  ⏰ ☑ Me rappeler de refaire le Cushman           │
│      Dans [4] h     → ≈ 18:32                     │
│      (case cochée par défaut quand score ≥ 7)    │
│                                                   │
│  [Commentaire libre — textarea optionnel]        │
│                                                   │
│                              [Enregistrer]        │
└─────────────────────────────────────────────────┘
```

- Questionnaire **interactif** : pour chaque item, 4 boutons radio (ou pills cliquables) avec le libellé clinique (« <80 », « 80-100 », etc. — cf. référentiel Toolbox V1 ligne 334)
- Calcul du `score_total` **en live** à chaque clic — pas de bouton « calculer »
- Callout `→ Donner BZD SB` apparaît automatiquement dès que total ≥ 7
- Case rappel : visible uniquement si score ≥ 7 (cochée par défaut, intervalle modifiable)
- Si la case est cochée → INSERT avec `rappel_intervalle_h` rempli ; sinon `NULL`
- Calcul du rappel échu = client-side (cf. §4.3), pas de cron

### 7.2 Bouton « 🔔 Appeler médecins USCA »

- 1 seul bouton, en topbar Home PdS (jamais sur les cartes patient)
- Déclenche un push à tous les profils `role='medecin'` ayant une `push_subscriptions` active
- Message : « 📞 Le poste de soins vous demande »
- Réutilise l'edge function `send-push` existante
- Pas de notion de « médecin référent » (concept absent du modèle)

### 7.3 Bouton « 🔔 Appeler patient »

- Sur chaque carte Home PdS **présente** (caché si patient en permission)
- Sur la topbar de la page détail patient
- Déclenche un push patient (réutilise `send-push` + `push_subscriptions`)
- Message fixe : « Merci de vous présenter au poste de soins »
- Feedback toast PdS + log automatique dans `evenements` (type `convocation_pds` — nouveau type, à ajouter à la liste documentée dans `DB_SCHEMA.md` §evenements) pour traçabilité

### 7.4 Changement de chambre

Modal accessible depuis :
- `/pds/` détail patient (bouton ✏️ Changer dans la carte Identité)
- `/admin/` carte patient (même action, à ajouter — médecin et PdS autorisés, cf. Q1 chambre)

```
┌─ Changer la chambre ────────────────────────┐
│  Le patient ne sera pas déconnecté.         │
│  Nouvelle chambre : [415]                   │
│                                              │
│  [Annuler]          [Confirmer]             │
└──────────────────────────────────────────────┘
```

- Simple `UPDATE patients SET numero_chambre='X' WHERE id='...'`
- **Pas de log auto** en transmission (décision Q2 chambre)
- **Pas d'option push patient** — remplacée par bandeau in-app côté patient (cf. §7.5)

### 7.5 Bandeau in-app patient sur changement de chambre

Côté `/patient/index.html` :

- Au `visibilitychange` et au load, refetch `patients.numero_chambre` via Supabase (en plus du Realtime déjà actif)
- Si `localStorage.patient_session.chambre` ≠ valeur fraîche → afficher un **bandeau fermable** :

```
ℹ️ Votre nouvelle chambre est 415, c'est aussi l'identifiant
   à utiliser si vous devez vous reconnecter à l'application.   [✕]
```

- Au clic [✕], bandeau dismissed + `localStorage.patient_session.chambre` mis à jour. Pas de timeout auto (le patient doit confirmer la lecture).
- Pas de schéma supplémentaire : la divergence est détectée par comparaison localStorage ↔ BDD

### 7.6 Sync `/admin/` (transmissions visibles côté médecin)

Sur chaque carte patient du dashboard médecin (`/admin/`) :

- Mini-stream des 2-3 dernières transmissions du patient (peu importe le tag)
- Bouton « + Ajouter une transmission » → modal identique à celle du PdS, type forcé à `medical` (médecin écrit en médical)
- Encart mini-Cushman : dernier score coloré + heure + mini-graphique 7 jours + ligne d'action si ≥7 (cf. §8 pour le détail)

---

## 8. Affichage Cushman côté médecin (`/admin/`)

Fiche patient existante (`/admin/` modal détail) — ajout d'un encart :

- Dernier score Cushman (gros chiffre coloré, vert/ambre/rouge)
- Heure + tendance
- Mini-graphique 7 jours
- Si ≥7 et rappel échu → bandeau « Cushman à refaire »
- Pas de bloc « patients à surveiller » sur le dashboard global médecin (décision Q3 v6)

---

## 9. Étapes de build (esquisse pour writing-plans)

1. **Migration v38** : tables `cushman_scores` + `transmissions`, RLS, indexes
2. **Création compte Supabase** `pds.usca@aphp.fr` avec rôle `pds`
3. **Routing login** dans `index.html` (1 ligne)
4. **Sous-app `/pds/index.html`** :
   - Squelette HTML + login check + redirection
   - Topbar (horloge, bouton Appeler médecins, dark mode toggle)
   - Bandeau stats (4 compteurs)
   - Grille de cartes patient (3 états + tri ordre chambres)
   - Sections secondaires (Transmissions globales + Messages)
5. **`shared/cushman.js`** : saisie modale + calcul + insert Supabase + rappel
6. **Page détail patient** (vue PdS) — 2 colonnes / empilé
7. **Affichage Cushman côté médecin** (admin)
8. **Sync transmissions /admin/** : mini-stream sur carte patient + bouton ajouter
9. **Changement de chambre** : modal + UPDATE + bandeau in-app patient
10. **Bouton Appeler médecins USCA** : edge function call + toast
11. **Bouton Appeler patient** : edge function call + log `evenements` + toast
12. **Mises à jour `admin/index.html`** : intégrer rôle `pds` dans filtres/labels
13. **Documentation** : `MODULES.md`, `DB_SCHEMA.md`, `CLAUDE.md`, `CHANGELOG.md`
14. **Bump SW** : `sw.js` → `usca-v4.39`

---

## 10. Décisions rejetées explicitement (pour mémoire)

- **Score COWS** (sevrage opioïdes) — pas dans ce chantier
- **Logique conditionnelle Cushman selon substance** — Cushman sur toutes les cartes, jugement clinique de la PdS
- **Push notifications PdS** sur Cushman dus — rappels visuels suffisent (Q5 rappel = 2B)
- **Médecin référent par patient** — concept absent du modèle, retiré
- **Tag transmission « Observation libre »** — retiré, seulement Médical + Paramédical
- **Bouton « Appeler médecins » par patient** — un seul bouton global
- **Médecin référent / bouton appel ciblé** — non
- **Bandeau "Cushman dus"** (cadence régulière) — l'app ne sait pas qu'un Cushman est dû en cadence régulière
- **Log d'administration de BZD** dans l'app — reste hors app
- **Push patient sur changement de chambre** — remplacé par bandeau in-app
- **Log auto transmission sur changement de chambre** — silencieux
- **Nom/prénom patient** dans le dashboard PdS — anonymisation totale
- **Substance** dans le dashboard PdS — non saisie dans l'app
- **Lien « Voir dossier post-cure »** dans Identité — retiré
- **Ateliers et Toolbox** dans le scope PdS — retirés
- **Validation des permissions par le PdS** — reste médecin uniquement (Q7)

---

## 11. Glossaire des décisions Q1-Q8

| Q | Sujet | Décision finale |
|---|---|---|
| Q1 | Bloc Cushman pour patients non sevrage alcool | Sur toutes les cartes patient, peu importe substance — jugement clinique PdS |
| Q2 | Push PdS Cushman | Aucun — rappels visuels |
| Q3 | Cushman côté médecin | Encart graphique dans fiche patient `/admin/` |
| Q4 | Factorisation Cushman | `shared/cushman.js` pour `/pds/` uniquement (Toolbox V1 inchangée) |
| Q5 | Trouver/convoquer patient | Bouton « 🔔 Appeler patient » sur carte + push fixe |
| Q6 | Page détail patient | Layout 2 colonnes tablette ; Identité minimaliste (Ch+Entrée+Sortie+Type) ; Cushman avec callout « BZD SB » si ≥7 ; onglets Messages/Transmissions/Permissions |
| Q7 | Permissions PdS | Lecture seule. Validation reste médecin |
| Q8 | Modèle data transmissions | Nouvelle table `transmissions` dédiée (recommandée pour propreté schéma) |

---

## Annexes

### A. Mockups conservés

`.superpowers/brainstorm/2043-1779346429/content/` (session 2026-05-21) :
- `approaches.html` — comparatif 3 architectures
- `datamodel.html` — formulaire Cushman + migration initiale (v37 → renumérotée v38 lors de l'écriture du plan car v37 était déjà pris)
- `home-pds-v3.html` — wireframe Home validé en session 2

`.superpowers/brainstorm/1131-1779458938/content/` (session 2026-05-22 suite) :
- `detail-patient-v1.html` à `detail-patient-v9.html` — itérations page détail
- `cushman-rappel-v10.html` — modal Cushman avec rappel
- `changement-chambre.html` — modal changement chambre
- `admin-sync-q8.html` — mockup `/admin/` avec sync transmissions + comparatif Q8
- `permission-states-v2.html` — 3 états de carte (normal/urgent/en permission), version finale

### B. Référentiel Cushman

7 items × 4 niveaux (0-3) = score 0 à 21. Cutoff clinique USCA : **≥7 → administration BZD SB (si besoin)**.
Calculateur existant dans Toolbox V1 (`staff/toolbox.html` ligne 334) — sera doublonné par `shared/cushman.js` (acceptable).
