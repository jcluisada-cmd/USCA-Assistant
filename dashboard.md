# Chantier en cours — extern/index.html v3.81

> Créé le 2026-04-19 — À reprendre avec **claude-opus-4-7** (Opus 4) en mode **max effort**

---

## État actuel

| Fichier | Statut |
|---|---|
| `sw.js` | ✅ Fait — CACHE_NAME = 'usca-v3.81' |
| `admin/index.html` | ✅ Fait — onglet Dashboard renommé, icône Toolbox clé |
| `extern/index.html` | ❌ À réécrire complètement |
| `CLAUDE.md` | ❌ À mettre à jour (v3.81 + entrée "Fait") |

---

## Sous-étapes pour extern/index.html

### ÉTAPE 1 — HTML squelette + CSS (sans JS)
Écrire la structure complète :
- `<head>` avec scripts CDN (Supabase, Tailwind, theme.js...)
- `<body style="height:100dvh;display:flex;flex-direction:column;overflow:hidden">`
- `<header>` indigo compact (safe-area)
- Bandeau tuteur `#tuteur-banner`
- `<div style="flex:1;overflow:hidden;position:relative">` avec 3 divs `.extern-tab`:
  - `#tab-dashboard` — contenu accordion (voir détail ci-dessous)
  - `#tab-toolbox` — iframe lazy `../staff/toolbox.html?embedded=true`
  - `#tab-planning` — copie exacte du HTML de `#tab-groupes` admin (lignes 656-716 + `#modal-groupe-actions`)
- `#section-patient-detail` (hidden, mêmes IDs que admin lignes 292-418)
- Tous les modals (delete, event, perm, contenu, sortie — lignes 420-599 admin)
- QCM modal (inchangé depuis l'extern actuel)
- `<nav id="bottom-nav">` Dashboard/Toolbox/Planning (mêmes icônes admin)

**Dashboard accordion HTML :**
```
[Patients accordion]
  Sous-onglets : Chambres | Sorties | Attente
  #ext-ptab-chambres → #patients-list (div)
  #ext-ptab-sorties → #sorties-list (div)
  #ext-ptab-attente → bouton + form + #attente-list (mêmes IDs que admin)

[QCM EDN accordion "Mes QCM EDN"]
  (contenu existant extern inchangé)

[2 petites cartes côte à côte]
  Carte gauche : Questions au tuteur (badge ouvert + bouton poser)
  Carte droite : Export QCM (bouton direct)

[Checklist accordion]
  (contenu existant extern inchangé)

[Questions au tuteur accordion]
  (contenu existant extern inchangé)
```

---

### ÉTAPE 2 — JS global + navigation
```javascript
// Globals
var currentProfile = null;
var loadedPatients = [], loadedAlertes = [], loadedPermissions = [], loadedAttente = [];
var selectedPatientForDetail = null, patientPrescriptions = [];
var editingAttenteId = null, admettreAttenteId = null;
var _sortiesOpen = {};
var toolboxLoaded = false;
var _previewTuteur = new URLSearchParams(location.search).get('preview') === 'tuteur';

// Helpers DOM
function createEl(tag, classes, text) { ... }  // copie admin
function createEditSvg() { ... }               // copie admin
function createTrashSvg() { ... }              // copie admin
function el(tag, attrs, children) { ... }      // garder extern QCM
function clear(node) { ... }                   // garder extern QCM

// Navigation onglets
function switchExternTab(tabId) { ... }
// Navigation sous-onglets patients
function switchPatientsTab(tab) { ... }

// Guard + init
(async function guard() { ... })();
async function initApp() { ... }
```

---

### ÉTAPE 3 — Données + rendu patients
```javascript
// Chargement données
async function loadExternData() {
  loadedPatients = await db.getPatients() || [];
  loadedAlertes = await db.getAlertesNonTraitees() || [];
  loadedPermissions = await db.getAllPermissionsEnAttente() || [];
  loadedAttente = await db.getListeAttente() || [];
  renderExternPatients();
  renderSorties();
  renderAttente();
}

// Rendu patients (copie admin renderPatients)
function renderExternPatients() { ... }

// Rendu sorties (copie admin renderSorties — identique)
// CHECKLIST_ITEMS, sortieDestLabel(), checklistAllDone(), cycleChecklistState()
function renderSorties() { ... }

// Rendu attente (copie admin renderAttente — identique)
function renderAttente() { ... }
function loadListeAttente() { ... }
```

---

### ÉTAPE 4 — Détail patient
```javascript
// showPatientDetail adapté :
async function showPatientDetail(patient) {
  document.getElementById('dashboard-main-content').classList.add('hidden');
  document.getElementById('section-patient-detail').classList.remove('hidden');
  // ... reste identique admin
}

// btn-back-patients : inverse showPatientDetail
// deletePatientData : appelle loadExternData() au lieu de loadDashboardStats()
// btn-save-admettre : appelle loadExternData()

// Copie directe depuis admin :
// renderFichesChecklist(), renderPatientPerms(), renderPostcureStatut(), savePostcureMeta()
// Tous les handlers modaux (evt-save, perm-save, contenu-save, sortie-save)
// btn-view-as-patient, btn-export-pdf-admin, btn-export-html-admin
// acc-craving, acc-fiches, acc-perms handlers
// openSortieModal()
// btn-delete-patient, btn-export-then-delete, btn-confirm-delete
```

---

### ÉTAPE 5 — Planning
```javascript
// Copie exacte depuis admin (lignes 2314-3171) :
// renderGroupesTab(), openGroupeActionModal()
// getMonday(), getViewedMonday()
// btn-prev-week, btn-next-week, btn-toggle-historique
// btn-add-event-equipe, btn-cancel-evt-eq, btn-save-evt-eq
// modal-groupe-close + backdrop clicks
// window._groupesWeekOffset = 0
```

---

### ÉTAPE 6 — QCM (garder extern inchangé)
```javascript
// Garder tel quel depuis l'extern actuel :
// cleanQ(), loadInProgress(), startFreshSession(), resumeSession()
// showQuestion(), onAnswer(), finishSession()
// loadFlags() (avec guard : if (!counter) return;)
// loadChecklist(), renderChecklist(), scheduleChecklistSave()
// loadQuestions(), renderQuestions()
// buildExportHTML()
// Tous les handlers QCM modal
// Service worker registration
```

---

### ÉTAPE 7 — CLAUDE.md + commit final
- Mettre à jour "Service Worker" : usca-v3.80 → usca-v3.81
- Ajouter entrée "Fait — Session 19/04 soir (v3.80 → v3.81)"
- `git add extern/index.html admin/index.html sw.js CLAUDE.md`
- `git commit -m "Dashboard extern : 3 onglets (Patients complets, Toolbox, Planning) + renommage admin (v3.81)"`
- Push !

---

## Recommandation pour reprendre

**Modèle : claude-opus-4-7**
**Effort : max (ou normal — opus est plus capable sur les gros fichiers)**

Raison : l'écriture d'un fichier ~2500 lignes qui copie du code de `admin/index.html` est une tâche de génération longue. Opus 4 gère mieux les contextes larges et peut écrire le fichier en une seule passe sans compacter.

**Instruction pour la prochaine session :**
> Lire ce dashboard.md + lire admin/index.html (lignes 1-750 pour HTML, 750-1250 pour JS patients/sorties/attente, 1250-1900 pour détail patient, 2300-3200 pour planning). Puis écrire extern/index.html en une seule passe Write.
