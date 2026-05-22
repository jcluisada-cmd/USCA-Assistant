# Dashboard role_pds — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construire un dashboard dédié pour le Poste de Soins infirmier (PdS) USCA — sous-app `/pds/`, 2 nouvelles tables (`cushman_scores` + `transmissions`), saisie Cushman avec rappel, intégration côté médecin (`/admin/`) et bandeau patient sur changement de chambre.

**Architecture:** Sous-app HTML mono-fichier `/pds/index.html` (pattern `/extern/`, `/etudiant/`), module Cushman partagé `shared/cushman.js`, compte Supabase partagé `pds.usca@aphp.fr` (rôle `pds`), migration v38 (rôle + 2 tables + RLS). Calcul "Cushman à refaire" client-side.

**Tech Stack:** HTML5 + Tailwind CDN + Supabase JS SDK CDN + jsPDF (existant). Pas de bundler. Mobile-first, tablette friendly. Service Worker incrémenté à `usca-v4.39`.

**Spec source:** `docs/superpowers/specs/2026-05-21-role-pds-dashboard-design.md` — lire ce document avant d'exécuter le plan. Le rendu DOM (templates HTML, classes Tailwind, contenu textuel exact) y est spécifié in extenso.

**Convention DOM** : ce projet utilise `innerHTML` pour le rendu (cf. `admin/index.html`, `extern/index.html`, etc.). On respecte cette convention. Les contenus dynamiques provenant de BDD (`contenu` de transmission, nom de profile, etc.) **doivent être échappés** via une helper `escapeHtml()` à inclure dans chaque page qui en a besoin.

---

## Phase 1 — Infrastructure data + auth

### Task 1 : Migration v38 (rôle, tables, RLS) — ✅ DÉJÀ FAIT 2026-05-22

**Files:**
- Create: `migrations/supabase-migration-v38.sql`

- [x] **Step 1 : Écrire le fichier SQL**

```sql
-- migrations/supabase-migration-v38.sql
-- Dashboard PdS : tables cushman_scores et transmissions + RLS

-- 1.1 Scores Cushman (sevrage alcoolique, CIWA-Ar FR, 7 items × 4 niveaux)
CREATE TABLE IF NOT EXISTS cushman_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  saisi_le TIMESTAMPTZ NOT NULL DEFAULT now(),
  items JSONB NOT NULL,
    -- {fc:0..3, pa:0..3, fr:0..3, tremblements:0..3,
    --  sueurs:0..3, agitation:0..3, sensoriels:0..3}
  score_total INT NOT NULL CHECK (score_total >= 0 AND score_total <= 21),
  commentaire TEXT,
  rappel_intervalle_h INT  -- NULL = pas de rappel programmé
);

CREATE INDEX IF NOT EXISTS idx_cushman_patient_time
  ON cushman_scores(patient_id, saisi_le DESC);

-- 1.2 Transmissions (médical / paramédical) partagées PdS ↔ médecin
CREATE TABLE IF NOT EXISTS transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  auteur_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL CHECK (type IN ('medical','paramedical')),
  contenu TEXT NOT NULL CHECK (length(contenu) > 0),
  cree_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_transmissions_patient_time
  ON transmissions(patient_id, cree_le DESC);

-- 2. RLS cushman_scores
ALTER TABLE cushman_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cushman_select_soignants" ON cushman_scores
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "cushman_insert_pds_ide_medecin" ON cushman_scores
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('pds','ide','medecin')
    )
  );

-- 3. RLS transmissions
ALTER TABLE transmissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "transmissions_select_soignants" ON transmissions
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "transmissions_insert_para" ON transmissions
  FOR INSERT TO authenticated WITH CHECK (
    type = 'paramedical' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('pds','ide'))
  );

CREATE POLICY "transmissions_insert_med" ON transmissions
  FOR INSERT TO authenticated WITH CHECK (
    type = 'medical' AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'medecin')
  );
```

- [x] **Step 2 : Appliquer la migration**

Appliquée via MCP `mcp__plugin_supabase_supabase__apply_migration` avec `name="v38_dashboard_pds_cushman_transmissions"` (2026-05-22).

- [x] **Step 3 : Vérifier**

Vérifié via `list_tables` : `public.cushman_scores` et `public.transmissions` présents avec RLS enabled.

- [x] **Step 4 : Commit** — inclus dans le commit final de docs (2026-05-22)

---

### Task 2 : Création du compte Supabase pds.usca

**Files:** aucun. Opération manuelle dans le dashboard Supabase Auth.

- [ ] **Step 1 : Créer l'utilisateur dans Auth**

Supabase Dashboard → Authentication → Users → Add user → Create new user :
- Email : `pds.usca@aphp.fr`
- Password : `usca_pds`
- Auto Confirm User : ☑

Noter l'UUID généré.

- [ ] **Step 2 : Insérer le profil dans SQL Editor**

```sql
INSERT INTO profiles (id, email, prenom, nom, role, is_admin)
VALUES (
  '<UUID_GENERE>',
  'pds.usca@aphp.fr',
  'Poste',
  'de Soins',
  'pds',
  false
);
```

- [ ] **Step 3 : Vérifier**

```sql
SELECT id, email, role, is_admin FROM profiles WHERE email = 'pds.usca@aphp.fr';
```

Doit retourner 1 ligne avec `role='pds'`.

---

### Task 3 : Routing login

**Files:**
- Modify: `index.html`

- [ ] **Step 1 : Localiser le bloc de routing par rôle**

Chercher la section qui gère `if (role === 'externe')` et `else if (role === 'etudiant_ide')` dans `loginStaff()` ou équivalent.

- [ ] **Step 2 : Ajouter le routing pds**

Avant le routing par défaut `/admin/`, insérer :

```javascript
else if (role === 'pds') {
  location.href = '/pds/';
}
```

- [ ] **Step 3 : Tester en navigateur**

Login `pds.usca@aphp.fr` / `usca_pds` → redirect vers `/pds/` (404 attendu, pas encore créé).

- [ ] **Step 4 : Commit**

```bash
git add index.html
git commit -m "feat(pds): routing login role='pds' → /pds/"
```

---

### Task 4 : Mise à jour `shared/auth.js`

**Files:**
- Modify: `shared/auth.js`

- [ ] **Step 1 : Identifier les listes de rôles**

Grep pour `'medecin'` dans `shared/auth.js` et ajouter `'pds'` aux listes pertinentes (validation de session staff, listes de rôles autorisés).

- [ ] **Step 2 : Commit**

```bash
git add shared/auth.js
git commit -m "feat(pds): accepter role='pds' dans shared/auth.js"
```

---

## Phase 2 — Module Cushman partagé

### Task 5 : Création `shared/cushman.js`

**Files:**
- Create: `shared/cushman.js`

API à exposer sur `window.cushman` :

| Fonction | Signature | Rôle |
|---|---|---|
| `ITEMS` | array de 7 items `{key, label, options}` | Référentiel CIWA-Ar FR (cf. spec §11 annexe B et `staff/toolbox.html:334`) |
| `saveScore(patientId, items, scoreTotal, commentaire, rappelIntervalleH)` | Promise | INSERT dans `cushman_scores` |
| `getScores(patientId, limit=7)` | Promise<Array> | SELECT trié par `saisi_le DESC` |
| `isOverdue(lastScore)` | boolean | Calcul rappel échu (cf. spec §4.3) |
| `colorFor(score)` | 'green'/'amber'/'red' | ≤3 / 4-6 / ≥7 |
| `openModal(patient, onSaved)` | void | Ouvre la modal de saisie |

**Modal openModal — comportement** (cf. spec §7.1) :

- Crée un overlay fixe `bg-black/50`, centré, max-width modal
- Affiche les 7 items, chacun avec 4 boutons radio cliquables (labels exacts du référentiel)
- `score_total` recalculé à chaque clic (somme des 7 valeurs sélectionnées)
- Le bloc « score » affiche le total coloré (vert/ambre/rouge selon `colorFor`)
- Si `total >= 7` : callout rouge « → Donner BZD SB » + zone rappel visible (input number 4 par défaut, ETA calculée)
- Si `total < 7` : zone rappel masquée
- Textarea commentaire optionnel
- Bouton Enregistrer : valide que les 7 items sont remplis, appelle `saveScore`, ferme la modal, callback `onSaved(row)`
- Bouton Annuler : ferme la modal

**Référentiel des items** (à copier verbatim depuis `staff/toolbox.html:336-342`) :

- Fréquence cardiaque : < 80 / 80-100 / 101-120 / > 120
- PA systolique : < 135 / 135-160 / 161-200 / > 200
- Fréquence respiratoire : < 16 / 16-25 / 26-35 / > 35
- Tremblements : Absents / Mains en extension / Membres sup. / Généralisés
- Sueurs : Absentes / Paumes / Paumes + front / Généralisées
- Agitation : Absente / Discrète / Généralisée / Incoercible
- Troubles sensoriels : Absents / Gêne lumière/bruit / Hallucinations critiquées / Hallucinations non critiquées

**Sécurité** : tous les textes utilisateur affichés dans le DOM doivent passer par `escapeHtml()` (helper à inclure dans le module). Seul le contenu généré par le code (libellés référentiel, labels) est interpolé directement.

- [ ] **Step 1 : Écrire le module** (~250 lignes attendues)
- [ ] **Step 2 : Tester en console** : `cushman.openModal({id:'TEST_UUID', numero_chambre:'412'}, console.log)`
- [ ] **Step 3 : Commit**

```bash
git add shared/cushman.js
git commit -m "feat(pds): module shared/cushman.js (saisie interactive + insert)"
```

---

## Phase 3 — Sous-app /pds/ : Home

### Task 6 : Squelette `pds/index.html`

**Files:**
- Create: `pds/index.html`

Structure (~150 lignes HTML + scripts) — cf. spec §5 :

1. DOCTYPE, meta viewport mobile-first
2. CDN Tailwind, Supabase, jsPDF (si besoin)
3. Imports `<script src="../shared/supabase.js">` + `auth.js`, `theme.js`, `cushman.js`
4. Auth gate au load : si pas de session OU role !== 'pds' → redirect `/`
5. Topbar indigo : 🏥 Poste de Soins USCA · horloge · `[🔔 Appeler médecins USCA]` · `[🌙]`
6. Bandeau stats (4 pastilles, valeurs en JS)
7. Section « home-view » avec grid `<div id="patients-grid">`
8. Section « detail-view » initialement `hidden`
9. Sections secondaires : `<div id="transmissions-globales">`, `<div id="messages-globaux">`

- [ ] **Step 1** : créer le fichier
- [ ] **Step 2** : tester auth gate (login pds.usca → arrive sur la page ; autre rôle → redirect)
- [ ] **Step 3** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): squelette HTML /pds/index.html avec auth gate"
```

---

### Task 7 : Chargement liste patients

Helpers à ajouter dans `pds/index.html` :

- `loadPatients()` : `sb.from('patients').select(...).order('numero_chambre', { ascending: true })`. SELECT doit inclure `id, numero_chambre, sexe, ddn, date_admission, date_sortie_prevue, sortie_info, postcure_statut`.
- `jourHospit(date_admission)` : retourne « J + (diff en jours + 1) »
- `calcAge(ddn)` : retourne âge en années entières. DDN ne doit PAS être affichée (privacy) — utilisée uniquement pour calculer l'âge.

- [ ] **Step 1** : ajouter les helpers
- [ ] **Step 2** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): chargement patients + tri ordre chambres"
```

---

### Task 8 : Cartes patient — 3 états visuels

Cf. spec §5.3.

Pour chaque patient :
1. `buildStatesFor(patient)` : retourne `{lastCushman, isAway, returnInfo, notifs}`
   - `lastCushman` = `cushman.getScores(id, 1)[0]`
   - `isAway` + `returnInfo` : SELECT `permissions_sortie` où `statut='validee'` ET maintenant dans la fenêtre `[date_debut+heure_debut, date_retour+heure_retour]`
   - `notifs.permission` : `'demande'` si existe un en_attente, `'active'` si dans fenêtre, sinon `null`
   - `notifs.cushmanDue` : `cushman.isOverdue(lastCushman)`
   - `notifs.messages` : count des `contenus_partages` non lus par PdS (MVP : `cree_par IS NULL AND created_at > now() - 24h`)

2. `renderPatientCard(patient, states)` :
   - État = `away` si `isAway`, sinon `urgent` si `cushmanDue`, sinon `normal`
   - Pill chambre : indigo plein (normal), rouge plein (urgent), bleu inversé (away)
   - Header : `[chambre] J[N] · [sexe] · [âge] ans · [bouton Appeler ou heure retour]`
   - Sous header : zone notifs avec badges (ne rend que ce qui existe — pas de « rien en attente »)
   - Couleurs notifs (cf. spec §5.3) : amber pour demande, sky pour active, red pour cushmanDue, pink pour messages

3. `formatReturn({dateRetour, heureRetour})` :
   - Si même jour : « Retour 18h »
   - Sinon : « Retour 25/05 à 18h »

4. `renderAllCards()` : itère, build states, render HTML, insère dans `#patients-grid`

- [ ] **Step 1** : ajouter les fonctions
- [ ] **Step 2** : créer scénarios test en SQL (1 patient normal, 1 urgent, 1 away)
- [ ] **Step 3** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): cartes patient 3 états (normal/urgent/away) + notifs"
```

---

### Task 9 : Bandeau stats (4 compteurs)

`computeStats(allStates)` retourne `{cushmanARefaire, demandesPerm, absents, messages}`. `renderStats()` met à jour 4 pastilles dans la topbar. Classes Tailwind alert (`bg-red-50 text-red-600 border-red-300`) si compteur > 0 pour Cushman/Messages, classe absent (sky) pour Absents > 0.

- [ ] **Step 1** : ajouter fonctions
- [ ] **Step 2** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): bandeau stats (4 compteurs)"
```

---

### Task 10 : Bouton « Appeler médecins USCA »

Handler `appelerMedecins()` :
1. `SELECT id FROM profiles WHERE role='medecin'` → array d'UUID
2. Appel edge function `send-push` avec `target_profile_ids` = ce tableau, `title="Poste de Soins USCA"`, `body="Le poste de soins vous demande"`, `url="/admin/"`
3. Toast feedback

**À vérifier avant** : signature exacte de `send-push` dans `supabase/functions/send-push/index.ts`. Adapter la clé du body (peut-être `target_profile_id` ou `profile_ids`).

- [ ] **Step 1** : inspecter `send-push/index.ts` pour confirmer la signature
- [ ] **Step 2** : implémenter handler + bouton dans topbar
- [ ] **Step 3** : tester (vérifier réception sur 1 médecin de test)
- [ ] **Step 4** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): bouton Appeler médecins USCA (push tous médecins)"
```

---

### Task 11 : Bouton « Appeler patient »

Handler `appelerPatient(patientId, event)` :
1. Vérifier qu'une `push_subscriptions` existe pour ce patient (sinon toast erreur)
2. Appel `send-push` avec `target_patient_id`, `title="USCA"`, `body="Merci de vous présenter au poste de soins"`, `url="/patient/"`
3. INSERT dans `evenements` avec `type='convocation_pds'`, `profile_id=session.id`, `contenu="Convocation patient au poste de soins"`
4. Toast OK
5. `event.stopPropagation()` pour ne pas naviguer vers le détail

- [ ] **Step 1** : implémenter
- [ ] **Step 2** : tester
- [ ] **Step 3** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): bouton Appeler patient (push + log evenements)"
```

---

## Phase 4 — Page détail patient

### Task 12 : Structure page détail

Cf. spec §6.

Approche : tout dans `pds/index.html` avec `#home-view` et `#detail-view` togglés (pas de routing URL — pour la simplicité MVP).

- Topbar bleu indigo : `← Retour`, pill `Ch. 412`, `J3`, bouton `🔔 Appeler patient`
- Grid `md:grid-cols-[320px_1fr]` (colonnes 2 sur tablette, empilé sur mobile)
- Colonne gauche : `<div id="detail-identite">`, `<div id="detail-cushman">`
- Colonne droite : tabs (Messages | Transmissions | Permissions) + `<div id="detail-tab-content">`

Navigation :
- `ouvrirDetailPatient(patientId)` : masque home, affiche detail, appelle `loadDetail(patientId)`
- `loadDetail(patientId)` : SELECT patient complet, render identité + cushman + onglet Messages par défaut
- `switchTab(name, patient)` : update boutons actifs, dispatch vers `renderTabMessages/Transmissions/Permissions`
- `retourHome()` : inverse

- [ ] **Step 1** : structure HTML + navigation
- [ ] **Step 2** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): page détail patient — structure 2 colonnes + navigation"
```

---

### Task 13 : Carte Identité

Cf. spec §6.3.

`renderIdentite(patient)` :
- Champ Chambre + bouton « ✏️ Changer » (handler vers Task 18)
- Entrée : `date_admission` formatée + jour d'hospit
- Sortie prévue : `date_sortie_prevue` formatée
- Type sortie : tag coloré selon `sortie_info.destination` :
  - `rad` → bleu pâle « RAD »
  - `postcure` → vert pâle « Post-cure »
  - autre/null → gris « Autre » ou tiret
- Pas de motif/ATCD/traitements (non saisis ailleurs)
- Pas de lien « Voir dossier post-cure » (retiré)

- [ ] **Step 1** : implémenter
- [ ] **Step 2** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): carte Identité dans page détail patient"
```

---

### Task 14 : Carte Cushman (vue lecture + Nouveau)

Cf. spec §6.3.

`renderCushmanCard(patient)` :
- Récupère les 7 derniers scores
- Gros chiffre du dernier score, coloré via `cushman.colorFor`
- Si ≥7 : callout rouge « → ≥7 : Donner BZD SB »
- Sparkline 7 barres (proportionnelles au max 21), ligne seuil à 7 (`bottom: 33%`)
- Tableau 7 derniers : `Quand | Par | Score`, lignes ≥7 surlignées rouge pâle
- Bouton « + Nouveau Cushman » → `cushman.openModal(patient, () => renderCushmanCard(patient))`

- [ ] **Step 1** : implémenter
- [ ] **Step 2** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): carte Cushman (gros chiffre + sparkline + tableau + bouton Nouveau)"
```

---

### Task 15 : Onglet Messages

`renderTabMessages(patient)` :
- SELECT `contenus_partages` WHERE patient_id, ORDER created_at ASC
- Render bulles : `cree_par IS NULL` = bulle gauche slate, sinon bulle droite indigo
- Timestamp en haut de chaque bulle
- Input + bouton Envoyer en bas → INSERT `contenus_partages` avec `cree_par = session.id`
- Tous textes patient échappés via `escapeHtml`

- [ ] **Step 1** : implémenter
- [ ] **Step 2** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): onglet Messages (conversation patient/soignant)"
```

---

### Task 16 : Onglet Transmissions

Cf. spec §6.4.

`renderTabTransmissions(patient)` :
- SELECT `transmissions` WHERE patient_id, ORDER cree_le DESC, JOIN profiles pour auteur
- Pour chaque : bordure gauche colorée (violet medical / vert paramedical), tag uppercase, timestamp + nom auteur, contenu échappé
- Formulaire en bas : textarea + select (PdS forcé en paramedical, médecin en medical via la RLS, le select reflète selon role courant), bouton Publier
- Au submit : INSERT `transmissions` avec `auteur_id = session.id`

- [ ] **Step 1** : implémenter
- [ ] **Step 2** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): onglet Transmissions (2 tags + formulaire publier)"
```

---

### Task 17 : Onglet Permissions (lecture seule)

`renderTabPermissions(patient)` :
- SELECT `permissions_sortie` WHERE patient_id, ORDER date_debut DESC
- Pour chaque : badge selon statut (en_attente jaune, validee verte, refusee rouge)
- Dates + heures de début/retour
- Motif affiché uniquement si renseigné (pas obligatoire)
- Si en_attente : ligne d'info « Patient → PdS (voit) → Médecin (à valider) »
- **Pas de boutons valider/refuser** (lecture seule pour PdS)

- [ ] **Step 1** : implémenter
- [ ] **Step 2** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): onglet Permissions lecture seule"
```

---

### Task 18 : Modal Changer chambre

Cf. spec §7.4.

`ouvrirModalChangerChambre(patientId, currentRoom)` :
- Modal overlay avec input préfilé sur `currentRoom`
- Texte d'info : « Le patient ne sera pas déconnecté. »
- Boutons Annuler / Confirmer
- Au Confirmer : `sb.from('patients').update({ numero_chambre: newRoom }).eq('id', patientId)`
- Si succès : toast OK, `loadDetail(patientId)` pour refresh

- [ ] **Step 1** : implémenter
- [ ] **Step 2** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): modal Changer chambre"
```

---

### Task 19 : Section Transmissions globales (home)

`renderTransmissionsGlobales()` :
- SELECT 10 dernières transmissions tous patients confondus avec JOIN patients pour numero_chambre
- Render liste compacte : pill chambre + tag médical/paramédical + ts + contenu tronqué à 120 chars
- Cliquer ouvre `ouvrirDetailPatient(patient_id)`

- [ ] **Step 1** : implémenter
- [ ] **Step 2** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): section Transmissions globales sur home"
```

---

### Task 20 : Section Messages patients (home)

`renderMessagesGlobaux()` :
- SELECT messages des 7 derniers jours, dédupliquer par patient (garder le plus récent), limite 8
- Preview : chambre + auteur (Patient/Soignant) + ts + contenu tronqué
- Cliquer ouvre détail patient

- [ ] **Step 1** : implémenter
- [ ] **Step 2** : commit

```bash
git add pds/index.html
git commit -m "feat(pds): section Messages patients sur home"
```

---

## Phase 5 — Côté médecin (/admin/)

### Task 21 : Ajouter rôle 'pds' dans `/admin/`

Cf. spec §4.5.

Lignes à toucher dans `admin/index.html` (approximatives, à confirmer par grep) : 853, 1123, 3081, 3082, 3110, 3218.

Pour chaque liste de rôles trouvée : ajouter `'pds'`. Pour les labels FR : « Poste de Soins ». Pour les couleurs : émeraude foncée (`#047857`) pour distinguer de l'IDE liaison (émeraude clair).

- [ ] **Step 1** : grep + édition
- [ ] **Step 2** : commit

```bash
git add admin/index.html
git commit -m "feat(pds): admin — ajout rôle 'pds' dans filtres + labels"
```

---

### Task 22 : Encart Cushman dans fiche patient médecin

Cf. spec §8.

Dans la modal/section de fiche patient existante d'`admin/index.html` :
- Ajouter une carte Cushman :
  - Dernier score (gros chiffre coloré)
  - Timestamp
  - Mini-sparkline 7 derniers (barres verticales colorées)
  - Si ≥7 : ligne « → ≥7 : BZD SB recommandé »
  - Si aucun score : « Aucun Cushman enregistré »

- [ ] **Step 1** : ajouter markup + fonction `mdRenderCushman(patientId)`
- [ ] **Step 2** : commit

```bash
git add admin/index.html
git commit -m "feat(pds): admin — encart Cushman dans fiche patient"
```

---

### Task 23 : Mini-stream transmissions sur carte patient admin + bouton ajouter

Cf. spec §7.6.

Sur chaque carte patient du dashboard médecin :
- Mini-stream des 3 dernières transmissions du patient (tags M/P, contenu tronqué)
- Bouton « + Ajouter une transmission » → modal simple → INSERT avec `type='medical'` (médecin)

- [ ] **Step 1** : ajouter fonction + modal
- [ ] **Step 2** : commit

```bash
git add admin/index.html
git commit -m "feat(pds): admin — mini-stream transmissions + bouton ajouter"
```

---

### Task 24 : Bouton Changer chambre côté admin

Cf. spec §7.4 (PdS et médecin autorisés).

Option propre : factoriser la modal de Task 18 dans `shared/chambre-modal.js` exposant `window.chambreModal.open(patientId, currentRoom, onSaved)`. L'inclure dans `/pds/` et `/admin/`.

- [ ] **Step 1** : créer `shared/chambre-modal.js`
- [ ] **Step 2** : remplacer la fonction inline dans `/pds/index.html` par l'appel à `chambreModal.open`
- [ ] **Step 3** : ajouter le bouton « ✏️ Changer chambre » dans la fiche patient `/admin/`
- [ ] **Step 4** : commit

```bash
git add shared/chambre-modal.js admin/index.html pds/index.html
git commit -m "feat(pds): factorisation modal Changer chambre + bouton admin"
```

---

## Phase 6 — Côté patient (/patient/)

### Task 25 : Bandeau in-app changement de chambre

Cf. spec §7.5.

Dans `patient/index.html`, au load et au `visibilitychange` :
- `checkChambreSync()` : SELECT `numero_chambre` pour le patient courant, comparer à `localStorage.patient_session.chambre`
- Si différent : insérer un bandeau jaune fixed top, message exact :

> « ℹ️ Votre nouvelle chambre est **XYZ**, c'est aussi l'identifiant à utiliser si vous devez vous reconnecter à l'application. »

- Bouton ✕ pour fermer → met à jour `localStorage.patient_session.chambre`
- Si bandeau déjà présent, ne pas créer de doublon

- [ ] **Step 1** : implémenter
- [ ] **Step 2** : tester (login patient ch.412, UPDATE chambre à 415 en Supabase, refresh patient → bandeau)
- [ ] **Step 3** : commit

```bash
git add patient/index.html
git commit -m "feat(pds): bandeau in-app patient sur changement de chambre"
```

---

## Phase 7 — Finalisation

### Task 26 : Bump Service Worker

**Files:** `sw.js`

- [ ] **Step 1** : `CACHE_NAME = 'usca-v4.39'`
- [ ] **Step 2** : ajouter à `LOCAL_ASSETS` : `/pds/index.html`, `/shared/cushman.js`, `/shared/chambre-modal.js`
- [ ] **Step 3** : commit

```bash
git add sw.js
git commit -m "chore(sw): bump CACHE_NAME → usca-v4.39 + nouveaux assets /pds/"
```

---

### Task 27 : Documentation

**Files:** `DB_SCHEMA.md`, `MODULES.md`, `CLAUDE.md`, `CHANGELOG.md`

- [ ] **Step 1** : `DB_SCHEMA.md` — ajouter les 2 nouvelles tables + ligne v38 dans la table d'historique
- [ ] **Step 2** : `MODULES.md` — nouvelle section « Module Poste de Soins (`/pds/`) »
- [ ] **Step 3** : `CLAUDE.md`
  - §2 Infrastructure : ajouter `pds.usca` / `usca_pds` / email
  - §4 : ajouter rôle métier `pds`
  - §6 État actuel : sous-section « Module PdS »
  - Version courante → v4.39 ; Service Worker → `usca-v4.39`
- [ ] **Step 4** : `CHANGELOG.md` — ligne v4.39 résumant le chantier
- [ ] **Step 5** : commit

```bash
git add MODULES.md DB_SCHEMA.md CLAUDE.md CHANGELOG.md
git commit -m "docs(v4.39): documentation dashboard PdS + migration v38"
```

---

### Task 28 : Smoke test bout en bout

- [ ] **Step 1 : Parcours PdS**
  1. Login `pds.usca` → `/pds/`
  2. Bandeau stats + grille triée par chambre
  3. Cliquer carte → détail s'ouvre
  4. + Nouveau Cushman → 7 items → score live → ≥7 affiche callout + zone rappel
  5. Enregistrer → carte Cushman refresh
  6. Onglet Transmissions → publier paramédicale
  7. Onglet Permissions → lecture seule
  8. Appeler patient → toast + ligne `evenements`
  9. Retour home → Appeler médecins → toast + push reçu

- [ ] **Step 2 : Parcours médecin**
  1. Login medecin admin
  2. Encart Cushman visible sur fiche patient
  3. Mini-stream transmissions visible
  4. Publier transmission médicale
  5. Modifier chambre

- [ ] **Step 3 : Parcours patient**
  1. Login patient ch.412
  2. Côté staff : changer chambre à 415
  3. Côté patient : refresh → bandeau apparaît
  4. ✕ → bandeau disparaît + localStorage à jour
  5. Logout → re-login avec ch.415 → succès

- [ ] **Step 4 : Push final**

```bash
git push origin main
```

---

## Annexe : checklist YAGNI

À garder en tête pendant l'implémentation, pour éviter le scope creep (référence : décisions du brainstorming) :

- ❌ Pas de table dédiée aux rappels Cushman (calculé client-side)
- ❌ Pas de log auto de changement chambre en transmission
- ❌ Pas de push patient sur changement chambre (bandeau in-app à la place)
- ❌ Pas de notion « médecin référent »
- ❌ Pas de tag « Observation libre » sur les transmissions (seulement Médical / Paramédical)
- ❌ Pas de nom/prénom patient sur le dashboard PdS (anonymisation)
- ❌ Pas de substance affichée
- ❌ Pas de bouton « Voir dossier post-cure » dans Identité
- ❌ Pas de validation des permissions par le PdS
- ❌ Pas de score COWS dans ce chantier
- ❌ Pas de log d'administration de BZD
