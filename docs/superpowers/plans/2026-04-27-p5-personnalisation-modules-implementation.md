# P5 — Personnalisation modules soignant : Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à l'admin (JC) de masquer certains éléments d'UI soignant pour un rôle donné (médecin/IDE/psy/pharmacien/secrétaire), via deux interfaces (edit mode inline + matrix Comptes), sans toucher au RLS BDD ni à la sécurité.

**Architecture:** Table `role_modules_hidden` Supabase (absence=visible) + `data-module="<id>"` sur 18 éléments HTML/JSX + `shared/module-visibility.js` qui injecte un `<style>` dynamique avec `[data-module="X"]{display:none!important}`. Edit mode admin : entrée dans modale Paramètres + bandeau sticky + bouton ⚙️ par module + popover de checkboxes par rôle. Matrix Comptes : accordion avec table 18×5. Admin (`is_admin=true`) bypass total côté client.

**Tech Stack:** HTML5/Tailwind/JS vanilla (pas de bundler), Supabase JS SDK CDN, React 18 + Babel in-browser pour la Toolbox iframe uniquement.

**Spec source :** `docs/superpowers/specs/2026-04-24-p5-personnalisation-modules-design.md`

**App version cible :** v4.07 (bump SW à la fin).

---

## Pré-requis & conventions de cette codebase

**Pas de test runner** : la codebase n'a ni Jest/Vitest ni pytest. Toutes les vérifications sont **manuelles dans le browser** (Cloudflare déploie en ~30 s après chaque push). Chaque tâche se termine par un scénario de vérification manuelle explicite (clics + état attendu).

**Convention de commit (cf. CLAUDE.md §9)** :
- Une tâche = un commit atomique (commit après chaque tâche, pas après chaque step interne).
- Format : `<verbe court> : <résumé> (vN.NN si applicable)`. Exemples des derniers commits : `Spec design P5 : ...`, `Fix RLS push_subscriptions : ... (v31)`.
- Suffixe `Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>` (déjà dans CLAUDE.md harness).

**Pas de push automatique** : JC valide chaque batch de tâches avant push (Cloudflare redéploie immédiatement). Le plan ne contient pas de step `git push`.

**Pas d'incrément SW pendant les tâches** : on cumule les modifs et on bump `CACHE_NAME` une seule fois en Tâche 11 (sinon l'utilisateur subit N rechargements forcés pour rien).

**Sécurité DOM** : pas de `.innerHTML =` dans le code JS de cette feature — toujours `createElement` + `textContent` pour les contenus dynamiques. Même si nos sources (`MODULES_CONFIG`, labels) sont hardcoded aujourd'hui, cette discipline empêche un futur ajout user-controlled de devenir un gadget XSS.

---

## Ordre des tâches & dépendances

```
T1 (migration SQL)    --+- JC applique v32 (manuel Supabase) --+
T2 (modules-config)   --|                                       |
T3 (module-visibility)--+- T4 (wire scripts/apply)              |
                                                                v
T5 (data-module admin) -> T6 (data-module toolbox) -> T7 (edit CSS)
                                                                v
                       T8 (edit mode trigger + banner) -> T9 (gear+popover)
                                                                v
                                    T10 (matrix Comptes)
                                                                v
                          T11 (SW bump + tests scénarios + doc)
```

**Point bloquant** : T1 doit produire le fichier SQL, mais c'est **JC qui doit l'exécuter manuellement** dans Supabase SQL Editor avant que T11 (tests) puisse passer. Les tâches T3-T10 peuvent être codées sans que la table existe (le fetch retourne une erreur que `module-visibility.js` swallow gracefully).

---

## Task 1 : Migration v32 — table `role_modules_hidden`

**Files:**
- Create: `migrations/supabase-migration-v32.sql`
- Modify: `SETUP_PUSH.md` (ajouter ligne v32 dans la checklist Migrations)

- [ ] **Step 1.1 : Créer le fichier de migration**

Créer `migrations/supabase-migration-v32.sql` avec ce contenu **exact** (suit la convention des migrations v23/v31) :

```sql
-- ══════════════════════════════════════════════════════════
-- Migration v32 -- P5 Personnalisation modules soignant
-- Date : 2026-04-27
--
-- Objectif : permettre à l'admin de masquer certains éléments
-- d'UI soignant par rôle métier (médecin / IDE / psy /
-- pharmacien / secrétaire). Modèle "absence = visible" : la
-- table ne stocke QUE les masquages.
--
-- 1. Table role_modules_hidden (PK composite role+module_id)
-- 2. RLS : SELECT ouverte aux authenticated (nécessaire pour
--    appliquer le filtrage côté client) ; INSERT/UPDATE/DELETE
--    réservés aux admins (is_admin=true)
--
-- À exécuter dans Supabase -> SQL Editor -> New query.
-- ══════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.role_modules_hidden (
  role       TEXT NOT NULL
             CHECK (role IN ('medecin','ide','psychologue','pharmacien','secretaire')),
  module_id  TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  PRIMARY KEY (role, module_id)
);

ALTER TABLE public.role_modules_hidden ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "rmh_read" ON public.role_modules_hidden;
CREATE POLICY "rmh_read"
  ON public.role_modules_hidden
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "rmh_write" ON public.role_modules_hidden;
CREATE POLICY "rmh_write"
  ON public.role_modules_hidden
  FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true);

-- ──────────────────────────────────────────────────────────
-- Vérification (à exécuter après le RUN)
-- ──────────────────────────────────────────────────────────
-- SELECT polname, polcmd, pg_get_expr(polqual, polrelid) AS using_expr
-- FROM pg_policy
-- WHERE polrelid = 'public.role_modules_hidden'::regclass
-- ORDER BY polname;
-- -> rmh_read (cmd r, using_expr 'true')
-- -> rmh_write (cmd *, using_expr testant is_admin)
```

- [ ] **Step 1.2 : Ajouter la ligne dans la checklist `SETUP_PUSH.md`**

Dans `SETUP_PUSH.md`, repérer la ligne v31 dans le tableau "Migrations Supabase" (autour ligne 21). Insérer la ligne v32 **juste après** v31 :

```markdown
| v32 | P5 Personnalisation modules : table `role_modules_hidden` (absence=visible) + RLS (SELECT auth, INSERT/UPDATE/DELETE admin) | ⏳ **À exécuter** |
```

- [ ] **Step 1.3 : Vérification manuelle**

Aucune. C'est un fichier SQL + une ligne markdown — la "vérification" se fera quand JC l'exécutera dans Supabase (post-merge).

- [ ] **Step 1.4 : Commit**

```bash
git add migrations/supabase-migration-v32.sql SETUP_PUSH.md
git commit -m "$(cat <<'EOF'
Migration v32 : table role_modules_hidden pour P5 personnalisation modules

PK composite (role, module_id), RLS lecture ouverte aux authenticated, écriture admin only. À exécuter dans Supabase SQL Editor avant test P5.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2 : `shared/modules-config.js` — inventaire 18 modules + 5 rôles

**Files:**
- Create: `shared/modules-config.js`

- [ ] **Step 2.1 : Créer le fichier**

Créer `shared/modules-config.js` avec l'inventaire **exact** de 18 modules (cf. spec §3, déjà filtré post-ajustements 2026-04-27) :

```js
// shared/modules-config.js
// Source de vérité de l'inventaire des modules masquables P5.
// Ajouter ici un module = il apparaît dans la matrix Comptes et l'edit mode,
// visible par défaut pour tous les rôles (absence de ligne BDD = visible).

window.MODULES_CONFIG = [
  // Onglets (bottom nav admin)
  { id: 'tab_toolbox',                label: 'Onglet Toolbox',                  strate: 'Onglets'   },
  { id: 'tab_planning',               label: 'Onglet Planning',                 strate: 'Onglets'   },

  // Dashboard (vue Patients)
  { id: 'dashboard_entrees_sorties',  label: 'Sorties prévues + liste attente', strate: 'Dashboard' },
  { id: 'dashboard_patients_list',    label: 'Liste chambres + détail patient', strate: 'Dashboard' },
  { id: 'dashboard_mes_eleves',       label: 'Mes élèves / Mon externe',        strate: 'Dashboard' },

  // Détail patient (boutons et accordions)
  { id: 'patient_craving',            label: 'Journal craving',                 strate: 'Patient'   },
  { id: 'patient_fiches',             label: 'Fiches traitements',              strate: 'Patient'   },
  { id: 'patient_permissions',        label: 'Permissions',                     strate: 'Patient'   },
  { id: 'patient_messages',           label: 'Messages patient/équipe',         strate: 'Patient'   },
  { id: 'patient_evenements',         label: 'Planifier un événement',          strate: 'Patient'   },
  { id: 'patient_sortie',             label: 'Annoncer sortie + exports',       strate: 'Patient'   },
  { id: 'patient_postcure',           label: 'Dossier post-cure',               strate: 'Patient'   },

  // Toolbox (cartes d'accueil JSX)
  { id: 'toolbox_protocoles',         label: 'Protocoles USCA (hub)',           strate: 'Toolbox'   },
  { id: 'toolbox_elsa',               label: 'ELSA (hub)',                      strate: 'Toolbox'   },
  { id: 'toolbox_postcure',           label: 'Dossier post-cure',               strate: 'Toolbox'   },
  { id: 'toolbox_traitements',        label: 'Fiches patient + expert',         strate: 'Toolbox'   },
  { id: 'toolbox_scores',             label: 'Scores + convertisseurs',         strate: 'Toolbox'   },
  { id: 'toolbox_interactions',       label: 'Interactions',                    strate: 'Toolbox'   },
];

window.MODULES_ROLES = ['medecin', 'ide', 'psychologue', 'pharmacien', 'secretaire'];

// Labels FR pour l'UI (utilisés dans popover edit mode + matrix Comptes)
window.MODULES_ROLE_LABELS = {
  medecin:     'Médecin',
  ide:         'IDE',
  psychologue: 'Psychologue',
  pharmacien:  'Pharmacien',
  secretaire:  'Secrétaire',
};
```

- [ ] **Step 2.2 : Vérification manuelle**

Compter les entrées : doit être **exactement 18**. Répartition : 2 Onglets + 3 Dashboard + 7 Patient + 6 Toolbox = 18.

- [ ] **Step 2.3 : Commit**

```bash
git add shared/modules-config.js
git commit -m "$(cat <<'EOF'
P5 : shared/modules-config.js -- inventaire 18 modules + 5 rôles

Source de vérité pour la personnalisation P5 (matrix Comptes + edit mode admin). Strates : Onglets (2), Dashboard (3), Patient (7), Toolbox (6).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3 : `shared/module-visibility.js` — helpers runtime

**Files:**
- Create: `shared/module-visibility.js`

- [ ] **Step 3.1 : Créer le fichier**

Créer `shared/module-visibility.js`. Le code suit la spec §4.3 mais ajoute un try/catch sur `toggleHidden` (pour que l'UI puisse afficher un message si v32 n'est pas encore appliquée), un helper `mountEditButtons`, et un helper `getModuleEl`.

**Hypothèse importante** : `window.sb` est le client Supabase déjà initialisé par `shared/supabase.js`. Vérifier en grepant `window.sb` ou `const sb` dans `shared/supabase.js` avant de coder. Si l'export se nomme différemment, adapter (les commits précédents utilisent `sb`).

```js
// shared/module-visibility.js
// Runtime de filtrage UI par rôle (P5).
// Dépendances chargées AVANT ce fichier :
//   - shared/supabase.js (expose window.sb ou équivalent)
//   - shared/modules-config.js (window.MODULES_CONFIG, MODULES_ROLES, MODULES_ROLE_LABELS)

window.moduleVisibility = {
  STYLE_ID: 'module-visibility-style',
  EDIT_GEAR_CLASS: 'module-edit-gear',
  BANNER_ID: 'module-edit-banner',

  // -- 1. Application du filtrage au chargement -------------
  // Lit la BDD et injecte le <style> qui cache les modules
  // masqués pour le rôle du soignant connecté. Bypass si admin.
  async apply(profile) {
    if (!profile) return;
    if (profile.is_admin) return; // admin voit tout
    try {
      const { data, error } = await window.sb
        .from('role_modules_hidden')
        .select('module_id')
        .eq('role', profile.role);
      if (error) {
        console.warn('[moduleVisibility] apply failed:', error.message);
        return;
      }
      const hidden = (data || []).map(r => r.module_id);
      this._inject(hidden);
    } catch (e) {
      console.warn('[moduleVisibility] apply threw:', e);
    }
  },

  // Injecte/met à jour le <style> de masquage. Vide = pas de masquage.
  _inject(hiddenIds) {
    let style = document.getElementById(this.STYLE_ID);
    if (!style) {
      style = document.createElement('style');
      style.id = this.STYLE_ID;
      document.head.appendChild(style);
    }
    style.textContent = hiddenIds.length
      ? hiddenIds.map(id => `[data-module="${id}"]{display:none!important}`).join('')
      : '';
  },

  // Active/désactive le <style> sans le supprimer (utilisé par edit mode).
  setEnabled(enabled) {
    const style = document.getElementById(this.STYLE_ID);
    if (style) style.disabled = !enabled;
  },

  // -- 2. Mutation BDD -------------------------------------
  async toggleHidden(role, moduleId, shouldHide) {
    try {
      if (shouldHide) {
        const { data: { user } } = await window.sb.auth.getUser();
        const { error } = await window.sb
          .from('role_modules_hidden')
          .upsert({ role, module_id: moduleId, updated_by: user?.id || null });
        if (error) throw error;
      } else {
        const { error } = await window.sb
          .from('role_modules_hidden')
          .delete()
          .eq('role', role)
          .eq('module_id', moduleId);
        if (error) throw error;
      }
      return { ok: true };
    } catch (e) {
      console.error('[moduleVisibility] toggleHidden failed:', e);
      return { ok: false, error: e.message || String(e) };
    }
  },

  // -- 3. Lecture pour UI admin (matrix + popover) ---------
  // Retourne { medecin: Set('patient_craving'), pharmacien: Set(...) , ... }
  async fetchHiddenMap() {
    try {
      const { data, error } = await window.sb
        .from('role_modules_hidden')
        .select('role, module_id');
      if (error) throw error;
      const map = {};
      window.MODULES_ROLES.forEach(r => { map[r] = new Set(); });
      (data || []).forEach(r => { map[r.role]?.add(r.module_id); });
      return map;
    } catch (e) {
      console.error('[moduleVisibility] fetchHiddenMap failed:', e);
      const empty = {};
      window.MODULES_ROLES.forEach(r => { empty[r] = new Set(); });
      return empty;
    }
  },

  // -- 4. Helper : trouver le 1er élément DOM d'un module --
  getModuleEl(moduleId) {
    return document.querySelector(`[data-module="${moduleId}"]`);
  },

  // -- 5. Edit mode : mount des boutons par module ---------
  // Idempotent -- appelable plusieurs fois sans dupliquer.
  async mountEditButtons(onGearClick) {
    const seen = new Set();
    document.querySelectorAll('[data-module]').forEach(el => {
      const moduleId = el.getAttribute('data-module');
      if (seen.has(moduleId)) return; // un seul bouton par moduleId (le premier anchor)
      seen.add(moduleId);
      if (el.querySelector(`:scope > .${this.EDIT_GEAR_CLASS}`)) return; // déjà monté
      const computed = window.getComputedStyle(el);
      if (computed.position === 'static') el.style.position = 'relative';
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = this.EDIT_GEAR_CLASS;
      btn.setAttribute('data-module-gear', moduleId);
      btn.textContent = '⚙️'; // gear emoji via codepoints (pas d'innerHTML)
      btn.title = `Configurer la visibilité du module ${moduleId}`;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        e.preventDefault();
        onGearClick(moduleId, el);
      });
      el.appendChild(btn);
    });
    // Marque les modules ayant ≥ 1 ligne en BDD (pour le liseré rouge)
    const map = await this.fetchHiddenMap();
    const hasHides = new Set();
    Object.values(map).forEach(set => set.forEach(id => hasHides.add(id)));
    document.querySelectorAll('[data-module]').forEach(el => {
      const id = el.getAttribute('data-module');
      el.classList.toggle('has-hides', hasHides.has(id));
    });
    return map;
  },
};
```

- [ ] **Step 3.2 : Vérification manuelle (statique, sans browser)**

Relire le fichier et confirmer :
- Pas de `import` (script tag, pas de module ES6).
- `window.moduleVisibility` exposé.
- Toutes les méthodes (apply, _inject, setEnabled, toggleHidden, fetchHiddenMap, getModuleEl, mountEditButtons) sont définies.
- Aucun appel direct à `sb` -- partout `window.sb` (résilient si l'ordre de chargement varie).
- Aucun `.innerHTML =` (utilise `textContent` pour le bouton ⚙️).

- [ ] **Step 3.3 : Commit**

```bash
git add shared/module-visibility.js
git commit -m "$(cat <<'EOF'
P5 : shared/module-visibility.js -- runtime de filtrage UI par rôle

window.moduleVisibility expose : apply(profile), toggleHidden(role,id,bool), fetchHiddenMap(), mountEditButtons(cb), setEnabled(bool). Injection CSS dynamique [data-module]{display:none!important}, error handling avec console.warn (gracieux si table v32 pas encore appliquée).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4 : Wire scripts + apply() dans `admin/index.html` et `staff/toolbox.html`

**Files:**
- Modify: `admin/index.html` (head ou bottom : ajouter 2 `<script src>`, JS : appeler `moduleVisibility.apply()` dans `showAdminApp()`)
- Modify: `staff/toolbox.html` (avant le script React : ajouter scripts + IIFE qui appelle apply)

**Note** : T4 ajoute juste l'infrastructure de chargement. Avant les `data-module` (T5/T6) il n'y a rien à filtrer, donc T4 est inerte — c'est OK, ça permet de dérisquer le câblage indépendamment.

- [ ] **Step 4.1 : Trouver l'emplacement des scripts dans `admin/index.html`**

```bash
grep -n "shared/supabase.js\|shared/auth.js" admin/index.html
```

Insérer **juste après** la ligne `<script src="../shared/supabase.js"></script>` (et `auth.js` s'il y est) :

```html
    <script src="../shared/modules-config.js"></script>
    <script src="../shared/module-visibility.js"></script>
```

- [ ] **Step 4.2 : Câbler `apply(profile)` dans `showAdminApp(profile)`**

À la ligne **1006** : `function showAdminApp(profile) {` puis ligne 1007 : `currentProfile = profile;`. Insérer **juste après** la ligne 1007 :

```js
  // P5 -- applique le filtrage des modules selon le rôle (no-op pour admin)
  if (window.moduleVisibility) window.moduleVisibility.apply(profile);
```

(Le guard `if (window.moduleVisibility)` rend le code résilient si le script échoue à charger — l'app continue de fonctionner.)

- [ ] **Step 4.3 : Wire scripts + apply dans `staff/toolbox.html`**

Repérer les `<script>` existants en haut :
```bash
grep -n "@supabase/supabase-js\|shared/supabase.js" staff/toolbox.html
```

Ajouter les 2 nouveaux scripts (modules-config.js, module-visibility.js) **juste après** la dernière dépendance partagée déjà chargée (probablement `shared/supabase.js`). Si `shared/supabase.js` n'est pas encore chargé dans la toolbox, l'ajouter **avant** les 2 nouveaux. Bloc à insérer :

```html
<script src="../shared/supabase.js"></script>
<script src="../shared/modules-config.js"></script>
<script src="../shared/module-visibility.js"></script>
<script>
(function() {
  try {
    const profile = JSON.parse(sessionStorage.getItem('staff_profile') || 'null');
    if (profile && window.moduleVisibility) {
      window.moduleVisibility.apply(profile);
    }
  } catch (e) { console.warn('[toolbox] moduleVisibility init failed:', e); }
})();
</script>
```

⚠️ **Vérifier** : si `shared/supabase.js` est déjà présent (probable, vu que la toolbox utilise déjà Supabase pour Ressources/RLS), retirer la ligne en double dans le bloc ci-dessus.

- [ ] **Step 4.4 : Vérification manuelle (browser)**

1. Login admin → ouvrir DevTools console.
2. Taper `window.moduleVisibility` → doit retourner l'objet (pas `undefined`).
3. Taper `await window.moduleVisibility.fetchHiddenMap()` → si v32 pas appliquée, doit logger un warning et retourner un map avec 5 clés (chacune un Set vide). Si v32 appliquée, retourne `{ medecin: Set(0), ide: Set(0), ... }`.
4. Cliquer onglet Toolbox → idem dans la console iframe.

- [ ] **Step 4.5 : Commit**

```bash
git add admin/index.html staff/toolbox.html
git commit -m "$(cat <<'EOF'
P5 : wire shared/modules-config.js + module-visibility.js dans admin et toolbox

admin/index.html : 2 nouveaux <script> + appel moduleVisibility.apply(profile) dans showAdminApp() après set de currentProfile. staff/toolbox.html : mêmes scripts + IIFE de bootstrap qui lit sessionStorage.staff_profile. T4 inerte tant que les data-module ne sont pas posés (T5/T6).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5 : `data-module` injection sur `admin/index.html` (12 modules ≈ 14 anchors)

**Files:**
- Modify: `admin/index.html` (12 endroits, certains avec 2 anchors)

- [ ] **Step 5.1 : Onglets bottom nav (2 modules)**

Lignes 912 et 916 — ajouter `data-module` :

Ligne 912 — Avant :
```html
<button data-tab="toolbox" class="admin-tab flex flex-col items-center py-1.5 px-3 rounded-xl transition-colors text-slate-400">
```
Après :
```html
<button data-tab="toolbox" data-module="tab_toolbox" class="admin-tab flex flex-col items-center py-1.5 px-3 rounded-xl transition-colors text-slate-400">
```

Ligne 916 — Avant :
```html
<button data-tab="groupes" class="admin-tab flex flex-col items-center py-1.5 px-3 rounded-xl transition-colors text-slate-400">
```
Après :
```html
<button data-tab="groupes" data-module="tab_planning" class="admin-tab flex flex-col items-center py-1.5 px-3 rounded-xl transition-colors text-slate-400">
```

- [ ] **Step 5.2 : Dashboard (3 modules)**

Ligne **145** : `<div id="section-entrees-sorties" class="mb-4">` → ajouter `data-module="dashboard_entrees_sorties"`.

Ligne **275** : `<div id="section-eleves" class="mb-4 hidden">` → ajouter `data-module="dashboard_mes_eleves"`.

Pour `dashboard_patients_list` : trouver le **conteneur racine** de la liste de chambres + détail patient.

```bash
grep -n 'id="section-patients"\|<section.*patients\|patients-list' admin/index.html
```

Si trouvé un id type `section-patients`, ajouter `data-module="dashboard_patients_list"` sur le div racine. Sinon : identifier le `<section>` ou `<div>` qui englobe la liste et le détail (typiquement le wrapper de la vue "Patients" qui contient à la fois `#section-entrees-sorties` et la liste). Si aucun wrapper unique n'existe naturellement, **créer un wrapper** `<div data-module="dashboard_patients_list">` qui englobe les deux sections.

⚠️ **Décision à prendre par l'implémenteur en lisant le DOM** : option (a) wrapper englobant — propre mais structurel, ou (b) `data-module="dashboard_patients_list"` sur PLUSIEURS anchors (chaque sous-div) — moins propre. **Recommandation : (a)**. Lire les 50 lignes autour de la ligne 145 pour identifier la structure existante.

- [ ] **Step 5.3 : Détail patient -- 7 modules (accordions + boutons d'action)**

Pour chaque accordion (3 modules à 2 anchors chacun) :

**`patient_craving`** -- ligne 383 (bouton accordion). Lire `admin/index.html` lignes 380-400 pour identifier la fin du bouton et le `<div>` de contenu qui suit. Ajouter `data-module="patient_craving"` sur :
- la balise `<button id="acc-craving" ...>` (ligne 383)
- le `<div>` de contenu qui suit (le wrapper du graphe + stats craving)

**`patient_fiches`** -- ligne 398 (bouton). Idem : ajouter `data-module="patient_fiches"` sur le bouton + le `<div>` de contenu qui suit (la liste des fiches prescrites).

**`patient_permissions`** -- ligne 412 (bouton). Idem : `data-module="patient_permissions"` sur le bouton + le `<div>` de contenu.

Pour les boutons d'action simples (1 anchor chacun) :

**`patient_messages`** -- ligne 434 : `<button id="btn-action-messages" ...>` → ajouter `data-module="patient_messages"`.

**`patient_evenements`** -- ligne 441 : `<button id="btn-action-event" ...>` → ajouter `data-module="patient_evenements"`.

**`patient_sortie`** -- ligne 447 : `<button id="btn-action-sortie" ...>` → ajouter `data-module="patient_sortie"`. Et ligne 474 : `<div id="sortie-exports" ...>` → ajouter `data-module="patient_sortie"` (deuxième anchor pour cacher aussi les exports).

**`patient_postcure`** -- ligne 456 : `<button id="btn-action-postcure" ...>`. Le spec dit "accordion `#btn-action-postcure` wrapper". Ajouter `data-module="patient_postcure"` sur :
- le bouton (ligne 456)
- le wrapper du contenu de l'accordion (lire les lignes 456-490 pour identifier — typiquement un `<div>` collapsible juste après le bouton)

- [ ] **Step 5.4 : Vérification manuelle (browser, sans v32 appliquée)**

Charger le dashboard admin. Tous les modules doivent rester visibles (admin = bypass). Pas de régression visuelle.

DevTools → console : `document.querySelectorAll('[data-module]').length` doit retourner **au moins 14** (12 modules dont 4 à 2 anchors). Si 0 : edits pas pris en compte (cache SW probable — Ctrl+Shift+R pour forcer).

DevTools → Elements → Ctrl+F → `data-module="patient_craving"` : doit matcher 2 éléments.

- [ ] **Step 5.5 : Commit**

```bash
git add admin/index.html
git commit -m "$(cat <<'EOF'
P5 : data-module injection sur admin/index.html (12 modules / ~14 anchors)

Onglets bottom nav (tab_toolbox, tab_planning), dashboard (entrees_sorties, patients_list, mes_eleves), détail patient (craving, fiches, permissions, messages, evenements, sortie, postcure). Accordions à 2 anchors (bouton + content) pour disparition complète. Inerte sans v32 appliquée + sans data-module sur Toolbox.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6 : `data-module` injection sur `staff/toolbox.html` (6 cartes JSX)

**Files:**
- Modify: `staff/toolbox.html` (lignes ~1430 et ~1446 — les 2 arrays de cartes d'accueil)

- [ ] **Step 6.1 : Cartes "grandes" (Protocoles USCA, ELSA, Dossier post-cure)**

Lignes **1430-1442**, l'array de 3 objets pour les grandes cartes. Ajouter un champ `dm` (data-module) à chaque objet, puis utiliser `data-module={item.dm}` dans le `<div>` du map.

Avant (lignes 1430-1434) :
```jsx
{[{l:"Protocoles USCA",desc:"Protocoles par substance",i:I.pill,v:"protocoles_hub",c:C.t[600],bg:`linear-gradient(135deg, ${C.t[50]}, ${C.bg})`},
  {l:"ELSA",desc:"Liaisons, admission, fiches réflexes",i:I.steth,v:"elsa_hub",c:C.n[700],bg:`linear-gradient(135deg, ${C.n[50]}, ${C.bg})`},
  {l:"Dossier post-cure",desc:"Post-cure -- volet médical, envoi patient",i:I.clipboard,v:"postcure_medecin",c:C.a[600],bg:`linear-gradient(135deg, ${C.a[50]}, ${C.bg})`}
].map(item=>
  <div key={item.v} className="card card-tap" style={{padding:16,marginBottom:10,display:"flex",alignItems:"center",gap:14,background:item.bg}} onClick={()=>{
```

Après :
```jsx
{[{l:"Protocoles USCA",desc:"Protocoles par substance",i:I.pill,v:"protocoles_hub",dm:"toolbox_protocoles",c:C.t[600],bg:`linear-gradient(135deg, ${C.t[50]}, ${C.bg})`},
  {l:"ELSA",desc:"Liaisons, admission, fiches réflexes",i:I.steth,v:"elsa_hub",dm:"toolbox_elsa",c:C.n[700],bg:`linear-gradient(135deg, ${C.n[50]}, ${C.bg})`},
  {l:"Dossier post-cure",desc:"Post-cure -- volet médical, envoi patient",i:I.clipboard,v:"postcure_medecin",dm:"toolbox_postcure",c:C.a[600],bg:`linear-gradient(135deg, ${C.a[50]}, ${C.bg})`}
].map(item=>
  <div key={item.v} data-module={item.dm} className="card card-tap" style={{padding:16,marginBottom:10,display:"flex",alignItems:"center",gap:14,background:item.bg}} onClick={()=>{
```

(2 changements : ajouter `dm:"toolbox_*"` à chaque objet de l'array, et ajouter `data-module={item.dm}` dans le `<div>` du map. ⚠️ Garde la phrase "Post-cure -- volet médical" exactement comme dans le code existant — j'ai utilisé `--` ici à cause de l'encodage du markdown.)

- [ ] **Step 6.2 : Cartes "secondaires" (Traitements, Scores, Interactions)**

Ligne **1446-1450** -- même technique :

Avant :
```jsx
{[{l:"Traitements",i:I.heart,v:"fiches_traitements",c:C.a[700]},{l:"Scores",i:I.calc,v:"scores",c:C.n[600]},{l:"Interactions",i:I.alert,v:"interactions",c:C.r[500]}].map(item=>
  <div key={item.v} className="card card-tap" style={{padding:12,textAlign:"center"}} onClick={()=>nav(item.v)}>
```

Après :
```jsx
{[{l:"Traitements",i:I.heart,v:"fiches_traitements",dm:"toolbox_traitements",c:C.a[700]},{l:"Scores",i:I.calc,v:"scores",dm:"toolbox_scores",c:C.n[600]},{l:"Interactions",i:I.alert,v:"interactions",dm:"toolbox_interactions",c:C.r[500]}].map(item=>
  <div key={item.v} data-module={item.dm} className="card card-tap" style={{padding:12,textAlign:"center"}} onClick={()=>nav(item.v)}>
```

- [ ] **Step 6.3 : Vérification manuelle**

Recharger l'app, ouvrir Toolbox (iframe). Tous les 6 cartes doivent toujours s'afficher (admin bypass). DevTools → console iframe → `document.querySelectorAll('[data-module]').length` → **6** exactement.

Cliquer chaque carte → navigation OK (pas de régression sur les onClick handlers).

- [ ] **Step 6.4 : Commit**

```bash
git add staff/toolbox.html
git commit -m "$(cat <<'EOF'
P5 : data-module injection sur staff/toolbox.html (6 cartes d'accueil)

Champ dm ajouté à chaque objet des 2 arrays de cartes (grandes + secondaires), data-module={item.dm} dans les <div> du map. 6 IDs : toolbox_{protocoles, elsa, postcure, traitements, scores, interactions}.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7 : CSS edit mode dans `shared/theme.css`

**Files:**
- Modify: `shared/theme.css` (append à la fin)

- [ ] **Step 7.1 : Ajouter le bloc CSS edit mode**

Ouvrir `shared/theme.css` et ajouter à la fin du fichier le bloc suivant :

```css
/* ═══════════════════════════════════════════════════════
   P5 -- Edit mode des modules (admin only)
   Activé via body.module-edit (toggle depuis modale Paramètres).
   ═══════════════════════════════════════════════════════ */

body.module-edit [data-module] {
  outline: 1px dashed rgba(79, 70, 229, 0.4); /* indigo #4F46E5 */
  outline-offset: 2px;
}

body.module-edit [data-module].has-hides {
  outline-color: rgba(239, 68, 68, 0.6); /* rouge si >= 1 rôle masque déjà */
}

.module-edit-gear {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 100;
  background: white;
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
  display: none; /* caché par défaut, affiché uniquement en edit mode */
  line-height: 1;
}
body.module-edit .module-edit-gear { display: inline-block; }

/* Bandeau sticky en haut quand edit mode actif */
#module-edit-banner {
  position: sticky;
  top: 0;
  z-index: 90;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px 14px;
  background: #EEF2FF; /* indigo-50 */
  border-bottom: 1px solid #C7D2FE; /* indigo-200 */
  color: #3730A3; /* indigo-800 */
  font-size: 13px;
  font-weight: 600;
}
#module-edit-banner button {
  background: white;
  border: 1px solid #C7D2FE;
  color: #4F46E5;
  padding: 4px 10px;
  border-radius: 6px;
  font-weight: 700;
  font-size: 12px;
  cursor: pointer;
}

/* Popover de sélection rôle (T9) */
.module-popover {
  position: absolute;
  z-index: 200;
  background: white;
  border: 1px solid #E2E8F0; /* slate-200 */
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  padding: 12px 14px;
  min-width: 220px;
}
.module-popover h4 {
  font-size: 13px;
  font-weight: 700;
  color: #0F172A;
  margin: 0 0 8px;
}
.module-popover label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #334155;
  padding: 4px 0;
  cursor: pointer;
}
.module-popover label input[type="checkbox"] { margin: 0; }
.module-popover .close-btn {
  margin-top: 10px;
  width: 100%;
  background: #F1F5F9;
  border: none;
  padding: 6px 10px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  color: #475569;
}
```

- [ ] **Step 7.2 : Vérification manuelle (browser, hors edit mode)**

Recharger admin. Aucun changement visuel — `body.module-edit` n'est pas actif, donc aucune règle ne s'applique. DevTools → Sources → vérifier que `theme.css` contient bien le nouveau bloc. Aucune erreur CSS dans la console.

- [ ] **Step 7.3 : Commit**

```bash
git add shared/theme.css
git commit -m "$(cat <<'EOF'
P5 : CSS edit mode + popover dans shared/theme.css

body.module-edit [data-module] : outline indigo dashed (rouge si has-hides). .module-edit-gear : bouton position absolute coin haut-droit (caché hors edit mode). #module-edit-banner : bandeau sticky indigo. .module-popover : carte flottante pour le popover de checkboxes par rôle.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 8 : Edit mode trigger -- entrée dans modale Paramètres + bandeau sticky

**Files:**
- Modify: `admin/index.html` (modale Paramètres : ajouter une nouvelle section "Mode édition modules" après "Pause vacances")
- Modify: `admin/index.html` (JS : event handlers pour activer/désactiver le mode + render bandeau)

- [ ] **Step 8.1 : Ajouter la section dans la modale Paramètres**

Repérer dans `admin/index.html` la modale Paramètres (commence ligne 524). La structure actuelle a 2 sections (Notifications push, Pause vacances). Ajouter une **3e section** **avant** le `</div>` de fermeture du `<div class="space-y-4">` (ligne ~560), visible uniquement si admin :

```html
              <!-- P5 -- Mode édition modules (admin only) -->
              <div id="settings-section-modules-edit" class="pt-4 border-t border-slate-200 dark:border-slate-700 hidden">
                <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Personnalisation</h4>
                <p class="text-sm text-slate-600 dark:text-slate-300 mb-2">Activer le mode édition pour cliquer sur les modules à masquer pour chaque rôle (médecin, IDE, psy, pharmacien, secrétaire). Vue d'ensemble disponible aussi dans Comptes &rarr; Modules par rôle.</p>
                <button id="btn-toggle-module-edit" class="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl text-sm hover:bg-indigo-700 transition-colors active:scale-[0.98]">
                  Activer le mode édition modules
                </button>
              </div>
```

⚠️ **Visibilité conditionnelle admin** : la section est `hidden` par défaut. Trouver le handler du clic sur `#btn-params` :

```bash
grep -n 'btn-params' admin/index.html
```

Dans ce handler (qui ouvre la modale), ajouter après l'ouverture :

```js
const isAdmin = currentProfile?.is_admin === true;
document.getElementById('settings-section-modules-edit').classList.toggle('hidden', !isAdmin);
```

- [ ] **Step 8.2 : Wire le toggle de l'edit mode (vanilla JS, pas d'innerHTML)**

Ajouter dans le JS principal d'`admin/index.html` (à la fin du gros script, ou juste après le handler de `btn-params`) :

```js
// -- P5 -- Edit mode toggle ---------------------------------
function isModuleEditActive() {
  return document.body.classList.contains('module-edit');
}

async function enterModuleEditMode() {
  document.body.classList.add('module-edit');
  if (window.moduleVisibility) window.moduleVisibility.setEnabled(false);
  renderModuleEditBanner();
  if (window.moduleVisibility) {
    await window.moduleVisibility.mountEditButtons(openModulePopover);
  }
  document.getElementById('modal-params').classList.add('hidden');
  const btn = document.getElementById('btn-toggle-module-edit');
  if (btn) btn.textContent = 'Désactiver le mode édition modules';
}

function exitModuleEditMode() {
  document.body.classList.remove('module-edit');
  if (window.moduleVisibility) window.moduleVisibility.setEnabled(true);
  document.getElementById('module-edit-banner')?.remove();
  document.querySelectorAll('[data-module].has-hides').forEach(el => el.classList.remove('has-hides'));
  closeModulePopover();
  const btn = document.getElementById('btn-toggle-module-edit');
  if (btn) btn.textContent = 'Activer le mode édition modules';
}

function renderModuleEditBanner() {
  if (document.getElementById('module-edit-banner')) return;
  const banner = document.createElement('div');
  banner.id = 'module-edit-banner';
  const span = document.createElement('span');
  span.textContent = "Mode édition modules actif -- clique sur l'icône d'engrenage d'un module pour configurer sa visibilité par rôle.";
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.id = 'btn-exit-module-edit';
  btn.textContent = 'Terminer';
  btn.addEventListener('click', exitModuleEditMode);
  banner.appendChild(span);
  banner.appendChild(btn);
  document.body.insertBefore(banner, document.body.firstChild);
}

// Câblage du bouton dans la modale Paramètres
document.getElementById('btn-toggle-module-edit')?.addEventListener('click', () => {
  if (isModuleEditActive()) exitModuleEditMode();
  else enterModuleEditMode();
});

// Stubs T9 (remplacés par l'implémentation réelle du popover)
function openModulePopover(moduleId, anchorEl) { console.log('TODO T9: popover', moduleId); }
function closeModulePopover() {}
```

- [ ] **Step 8.3 : Vérification manuelle**

1. Login admin → ouvrir ⚙️ Paramètres → la section "Personnalisation" doit apparaître en bas (uniquement parce que `is_admin=true`).
2. Cliquer "Activer le mode édition modules" → la modale se ferme + un bandeau indigo apparaît en haut + tous les modules ont un outline indigo dashed + des boutons ⚙️ apparaissent en haut-droit de chaque module.
3. Cliquer ⚙️ d'un module → console log "TODO T9: popover <id>" (stub).
4. Cliquer "Terminer" dans le bandeau → bandeau disparaît, outlines disparaissent, boutons ⚙️ deviennent invisibles (mais restent dans le DOM, c'est voulu).
5. Re-cliquer ⚙️ Paramètres → le label du bouton est revenu à "Activer le mode édition modules".

⚠️ **Test login non-admin** : login en tant que médecin/IDE de test → ouvrir ⚙️ Paramètres → la section "Personnalisation" doit être **absente** (hidden).

- [ ] **Step 8.4 : Commit**

```bash
git add admin/index.html
git commit -m "$(cat <<'EOF'
P5 : edit mode trigger dans modale Paramètres + bandeau sticky

Section "Personnalisation" ajoutée à la modale Paramètres (admin only). Toggle activate/exit via body.module-edit. Bandeau sticky indigo "Mode édition actif -- Terminer" injecté en haut du body via createElement (no innerHTML). mountEditButtons() pose les engrenages par module (popover stub T9). setEnabled(false) désactive le filtrage le temps de l'édition.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 9 : Popover de sélection rôle (par module)

**Files:**
- Modify: `admin/index.html` (remplacer les stubs `openModulePopover` / `closeModulePopover` posés en T8)

- [ ] **Step 9.1 : Implémenter le popover (createElement, no innerHTML)**

Remplacer les 2 stubs T8 par cette implémentation :

```js
let _modulePopoverEl = null;

async function openModulePopover(moduleId, anchorEl) {
  closeModulePopover();
  const map = await window.moduleVisibility.fetchHiddenMap();
  const config = (window.MODULES_CONFIG || []).find(m => m.id === moduleId);
  const label = config?.label || moduleId;

  const pop = document.createElement('div');
  pop.className = 'module-popover';

  const h = document.createElement('h4');
  h.textContent = `Masquer "${label}" pour :`;
  pop.appendChild(h);

  (window.MODULES_ROLES || []).forEach(role => {
    const roleLabel = (window.MODULES_ROLE_LABELS || {})[role] || role;
    const lab = document.createElement('label');
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.dataset.role = role;
    cb.checked = !!map[role]?.has(moduleId);
    cb.addEventListener('change', async () => {
      const shouldHide = cb.checked;
      cb.disabled = true;
      const res = await window.moduleVisibility.toggleHidden(role, moduleId, shouldHide);
      cb.disabled = false;
      if (!res.ok) {
        cb.checked = !shouldHide;
        alert('Erreur lors de la sauvegarde : ' + (res.error || 'inconnue') + '\n\nVérifie que la migration v32 est bien appliquée dans Supabase.');
        return;
      }
      const newMap = await window.moduleVisibility.fetchHiddenMap();
      const hasAnyHide = window.MODULES_ROLES.some(r => newMap[r]?.has(moduleId));
      document.querySelectorAll(`[data-module="${moduleId}"]`).forEach(el => {
        el.classList.toggle('has-hides', hasAnyHide);
      });
    });
    lab.appendChild(cb);
    lab.appendChild(document.createTextNode(' ' + roleLabel));
    pop.appendChild(lab);
  });

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'close-btn';
  closeBtn.textContent = 'Fermer';
  closeBtn.addEventListener('click', closeModulePopover);
  pop.appendChild(closeBtn);

  // Position : aligné au coin haut-droit de l'anchor
  const rect = anchorEl.getBoundingClientRect();
  pop.style.top  = (window.scrollY + rect.bottom + 6) + 'px';
  pop.style.left = (window.scrollX + Math.max(8, rect.right - 220)) + 'px';
  document.body.appendChild(pop);
  _modulePopoverEl = pop;

  setTimeout(() => {
    document.addEventListener('click', _outsidePopoverHandler, { once: true });
  }, 0);
}

function _outsidePopoverHandler(e) {
  if (!_modulePopoverEl) return;
  if (_modulePopoverEl.contains(e.target)) {
    setTimeout(() => document.addEventListener('click', _outsidePopoverHandler, { once: true }), 0);
    return;
  }
  if (e.target.classList?.contains('module-edit-gear')) return;
  closeModulePopover();
}

function closeModulePopover() {
  if (_modulePopoverEl) {
    _modulePopoverEl.remove();
    _modulePopoverEl = null;
  }
}
```

- [ ] **Step 9.2 : Vérification manuelle (v32 doit être appliquée)**

⚠️ Si v32 pas encore appliquée, demander à JC d'exécuter `migrations/supabase-migration-v32.sql` dans Supabase SQL Editor maintenant.

1. Login admin → ⚙️ Paramètres → "Activer le mode édition modules".
2. Cliquer ⚙️ du module "Journal craving" (`patient_craving`) → popover apparaît avec 5 checkboxes (Médecin/IDE/Psy/Pharmacien/Secrétaire), toutes décochées.
3. Cocher "Pharmacien" → BDD update (vérifier dans Supabase Studio → Table Editor → `role_modules_hidden` : 1 ligne `(pharmacien, patient_craving)`).
4. Le module `patient_craving` doit avoir un outline **rouge** (classe `has-hides`).
5. Cliquer ailleurs sur la page → popover se ferme.
6. Re-cliquer ⚙️ "Journal craving" → popover réouvert, "Pharmacien" toujours coché.
7. Décocher "Pharmacien" → ligne supprimée en BDD, outline redevient indigo.
8. Cliquer "Terminer" dans le bandeau → sortie d'edit mode.

- [ ] **Step 9.3 : Commit**

```bash
git add admin/index.html
git commit -m "$(cat <<'EOF'
P5 : popover de sélection rôle (edit mode admin)

Clic engrenage d'un module ouvre un popover construit en createElement (no innerHTML, défense XSS) avec 5 checkboxes (1 par rôle métier). État initial lu depuis fetchHiddenMap(). Change event -> toggleHidden() avec rollback visuel et alert si erreur (typiquement migration v32 non appliquée). Click outside ferme. Has-hides class mise à jour live sur tous les anchors du module.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 10 : Matrix Comptes -- accordion "Modules par rôle"

**Files:**
- Modify: `admin/index.html` (section `#section-comptes`, ligne 731 — ajouter un accordion en bas)

- [ ] **Step 10.1 : Lire la structure actuelle de section-comptes**

```bash
grep -n "section-comptes" admin/index.html
```

Voir ligne 731 et lire les ~100 lignes suivantes pour comprendre la structure et identifier le pattern visuel utilisé pour les sous-sections.

- [ ] **Step 10.2 : Ajouter le HTML de l'accordion matrix**

À la fin de `#section-comptes` (juste avant le `</section>` de fermeture), ajouter :

```html
            <!-- P5 -- Matrix Modules par rôle (admin only) -->
            <div id="comptes-matrix-modules" class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 mt-4 hidden">
              <button id="btn-comptes-matrix-toggle" class="w-full p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-left">
                <span class="text-sm font-bold text-slate-800 dark:text-slate-100">Modules par rôle</span>
                <svg id="comptes-matrix-chev" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="transition-transform"><polyline points="6 9 12 15 18 9"/></svg>
              </button>
              <div id="comptes-matrix-content" class="hidden p-4 border-t border-slate-200 dark:border-slate-700">
                <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Coche = visible. Décoche = masqué pour ce rôle. Admins (toi inclus) bypass total.</p>
                <div id="comptes-matrix-table-wrap" class="overflow-x-auto"></div>
              </div>
            </div>
```

- [ ] **Step 10.3 : Implémenter le renderer JS (createElement, no innerHTML)**

Ajouter dans le bloc JS principal d'`admin/index.html` :

```js
// -- P5 -- Matrix Modules par rôle (Comptes) ---------------
async function renderModulesMatrix() {
  const wrap = document.getElementById('comptes-matrix-table-wrap');
  if (!wrap) return;
  // Loading state via createElement, pas de .innerHTML
  wrap.replaceChildren();
  const loading = document.createElement('p');
  loading.className = 'text-xs text-slate-400';
  loading.textContent = 'Chargement…';
  wrap.appendChild(loading);

  const map = await window.moduleVisibility.fetchHiddenMap();
  const roles = window.MODULES_ROLES || [];
  const roleLabels = window.MODULES_ROLE_LABELS || {};
  const config = window.MODULES_CONFIG || [];

  // Groupe par strate
  const strates = {};
  config.forEach(m => {
    if (!strates[m.strate]) strates[m.strate] = [];
    strates[m.strate].push(m);
  });

  const table = document.createElement('table');
  table.className = 'w-full text-sm';

  // -- Head --
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.className = 'text-xs text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700';
  const thMod = document.createElement('th');
  thMod.className = 'text-left py-2 pr-3 font-semibold';
  thMod.textContent = 'Module';
  headRow.appendChild(thMod);
  roles.forEach(r => {
    const th = document.createElement('th');
    th.className = 'text-center py-2 px-2 font-semibold';
    th.textContent = roleLabels[r] || r;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  // -- Body --
  const tbody = document.createElement('tbody');
  Object.keys(strates).forEach(strate => {
    // Séparateur de strate
    const sepRow = document.createElement('tr');
    const sepCell = document.createElement('td');
    sepCell.colSpan = roles.length + 1;
    sepCell.className = 'pt-3 pb-1 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider';
    sepCell.textContent = `-- ${strate} --`;
    sepRow.appendChild(sepCell);
    tbody.appendChild(sepRow);

    strates[strate].forEach(m => {
      const row = document.createElement('tr');
      row.className = 'border-b border-slate-100 dark:border-slate-800';

      const labCell = document.createElement('td');
      labCell.className = 'py-2 pr-3 text-slate-700 dark:text-slate-200';
      labCell.textContent = m.label;
      row.appendChild(labCell);

      roles.forEach(r => {
        const td = document.createElement('td');
        td.className = 'text-center py-2 px-2';
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.dataset.role = r;
        cb.dataset.moduleId = m.id;
        cb.checked = !map[r]?.has(m.id); // checked = visible
        cb.className = 'cursor-pointer';
        cb.addEventListener('change', async () => {
          const shouldHide = !cb.checked;
          cb.disabled = true;
          const res = await window.moduleVisibility.toggleHidden(r, m.id, shouldHide);
          cb.disabled = false;
          if (!res.ok) {
            cb.checked = !cb.checked;
            alert('Erreur : ' + (res.error || 'inconnue') + '\nVérifier migration v32 dans Supabase.');
          }
        });
        td.appendChild(cb);
        row.appendChild(td);
      });
      tbody.appendChild(row);
    });
  });
  table.appendChild(tbody);

  wrap.replaceChildren(table);
}

// Visibilité admin only + accordion toggle
function initModulesMatrix() {
  const isAdmin = currentProfile?.is_admin === true;
  const wrap = document.getElementById('comptes-matrix-modules');
  if (wrap) wrap.classList.toggle('hidden', !isAdmin);

  document.getElementById('btn-comptes-matrix-toggle')?.addEventListener('click', () => {
    const content = document.getElementById('comptes-matrix-content');
    const chev = document.getElementById('comptes-matrix-chev');
    const isOpen = !content.classList.contains('hidden');
    content.classList.toggle('hidden');
    if (chev) chev.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    if (!isOpen) renderModulesMatrix();
  });
}
```

- [ ] **Step 10.4 : Câbler `initModulesMatrix()` au chargement de l'admin**

Ajouter à la fin de `showAdminApp(profile)` (après l'appel `moduleVisibility.apply` posé en T4 step 4.2) :

```js
  initModulesMatrix();
```

- [ ] **Step 10.5 : Vérification manuelle**

1. Login admin → naviguer vers la page Comptes.
2. Scroller jusqu'en bas → l'accordion "Modules par rôle" doit apparaître (admin only).
3. Cliquer le bouton → la table s'affiche avec 18 lignes (groupées en 4 strates) × 5 colonnes (rôles). Toutes les cases cochées par défaut (= visible).
4. Décocher (médecin × tab_planning) → BDD update (vérifier `role_modules_hidden`).
5. Re-cliquer le bouton (ferme), re-cliquer (réouvre) → la case (médecin × tab_planning) reste décochée.
6. **Test cohérence cross-UI** : passer en edit mode (⚙️ Paramètres → activer), cliquer ⚙️ "Onglet Planning" → la checkbox "Médecin" du popover doit être **cochée** (= masqué pour médecin). Décocher → fermer popover → revenir à Comptes → matrix doit montrer (médecin × tab_planning) **cochée** (visible).
7. Login non-admin → page Comptes → l'accordion ne doit **pas** apparaître.

- [ ] **Step 10.6 : Commit**

```bash
git add admin/index.html
git commit -m "$(cat <<'EOF'
P5 : matrix Comptes -- accordion "Modules par rôle"

Section accordion en bas de section-comptes (admin only). Table 18x5 (modules x rôles) construite en createElement (no innerHTML, défense XSS), groupée par strate, checkbox cochée = visible. Change event -> toggleHidden() avec rollback. Re-fetch BDD à chaque ouverture de l'accordion. Cohérence cross-UI avec edit mode (même store BDD).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 11 : Bump SW v4.07 + tests scénarios + doc

**Files:**
- Modify: `sw.js` (ligne 1 : `CACHE_NAME = 'usca-v4.06'` -> `'usca-v4.07'`)
- Modify: `CLAUDE.md` (header : ajouter ligne v4.07 ; §2 : SW `usca-v4.07` ; §7 : retirer P5 de "À FAIRE")
- Modify: `SETUP_PUSH.md` (cocher v32 si JC l'a appliquée)

- [ ] **Step 11.1 : JC applique migration v32 (si pas déjà fait)**

⚠️ **Action manuelle JC requise avant les tests** : exécuter `migrations/supabase-migration-v32.sql` dans Supabase → SQL Editor → New query → RUN. Vérifier le résultat avec la requête de vérification en bas du fichier (les 2 policies `rmh_read` et `rmh_write` doivent apparaître).

- [ ] **Step 11.2 : Bump SW**

Modifier `sw.js` ligne 1 :

Avant :
```js
const CACHE_NAME = 'usca-v4.06';
```
Après :
```js
const CACHE_NAME = 'usca-v4.07';
```

- [ ] **Step 11.3 : Exécuter les 5 scénarios de test manuel (cf. spec §6)**

⚠️ **Pré-requis** : créer 5 comptes de test dans Comptes (1 par rôle : medecin/ide/psy/pharma/secretaire) si pas déjà faits — utiliser `usca_c15` comme mot de passe staff commun. JC peut sauter ce step si les comptes existent déjà.

**Scénario 1 -- default state** (admin) :
- Login admin → ouvrir matrix Comptes → tout coché (visible).
- Logout → login `medecin.test` → vue identique à avant P5.
- Idem pour ide.test, psy.test, pharma.test, secretaire.test.
- ✅ **Attendu** : 5 rôles voient l'UI complète. Aucune régression.

**Scénario 2 -- masquage via edit mode** :
- Login admin → ⚙️ Paramètres → activer edit mode → cliquer ⚙️ "Journal craving" → cocher Pharmacien → fermer popover → cliquer "Terminer".
- Logout → login `pharma.test` → ouvrir un patient → l'accordion "Journal craving" doit être **absent**.
- Re-login admin → page Comptes → matrix → vérifier (pharmacien × patient_craving) **décochée**.
- ✅ **Attendu** : edit mode et matrix synchronisés.

**Scénario 3 -- masquage via matrix** :
- Login admin → page Comptes → matrix → décocher (secrétaire × tab_toolbox).
- Logout → login `secretaire.test` → la bottom nav ne doit pas afficher l'onglet Toolbox.
- ✅ **Attendu** : masquage actif.

**Scénario 4 -- admin bypass** :
- Modifier le profil de l'admin temporairement : `update profiles set role='pharmacien' where id='<admin uuid>'` dans Supabase. (Ou créer un compte admin alternatif avec role=pharmacien.)
- Login → admin doit voir TOUT, y compris "Journal craving" qui est pourtant masqué pour pharmacien.
- ✅ **Attendu** : `is_admin=true` bypass total.
- ⚠️ Restaurer le rôle de l'admin à 'medecin' après le test.

**Scénario 5 -- RLS** :
- Login `pharma.test` → DevTools console → tenter :
```js
await window.sb.from('role_modules_hidden').insert({ role: 'pharmacien', module_id: 'tab_toolbox' });
```
- ✅ **Attendu** : erreur "new row violates row-level security policy" (la RLS rmh_write réserve à `is_admin=true`).
- Tenter `delete()` aussi → même erreur.

**Si un scénario échoue** : ne pas commiter le bump SW. Diagnostiquer et fixer dans une nouvelle tâche.

- [ ] **Step 11.4 : Restaurer l'état "propre" (cleanup post-test)**

Si les scénarios 2/3 ont laissé des lignes dans `role_modules_hidden`, décider avec JC :
- Soit on garde (si JC avait l'intention de masquer ces modules pour de bon)
- Soit on supprime depuis la matrix Comptes (re-cocher les cases)

- [ ] **Step 11.5 : Update CLAUDE.md**

**Header** : ajouter en haut une ligne v4.07 selon la convention des versions précédentes :

Avant :
```markdown
> Dernière mise à jour : 25 avril 2026 (v4.06 -- Fixes SW : ...)
> v4.05 -- Reclassification fiches patient ...
```

Après :
```markdown
> Dernière mise à jour : 27 avril 2026 (v4.07 -- P5 Personnalisation modules soignant : table `role_modules_hidden` (migration v32, modèle "absence=visible"), `data-module` sur 18 éléments admin+toolbox, `shared/module-visibility.js` (apply/toggle/fetchMap/mountEditButtons), edit mode admin via modale Paramètres + bandeau sticky + popover par module, matrix Comptes "Modules par rôle" 18x5. Admin `is_admin=true` bypass total côté client. Masquage UI uniquement -- pas de RLS sur les données patient/messages.)
> v4.06 -- Fixes SW : ... (← ligne existante laissée intacte)
```

**Section §2 INFRASTRUCTURE** : ligne `**Service Worker** | usca-v4.06` -> `usca-v4.07`.

**Section §7 À FAIRE** : retirer la ligne `**🎯 Prochain chantier : P5 -- Personnalisation modules soignant** ...` (la première puce).

- [ ] **Step 11.6 : Update SETUP_PUSH.md**

Si JC a appliqué v32 (Step 11.1), passer la ligne v32 de `⏳ **À exécuter**` à `✅` dans la checklist Migrations.

- [ ] **Step 11.7 : Commit final**

```bash
git add sw.js CLAUDE.md SETUP_PUSH.md
git commit -m "$(cat <<'EOF'
P5 ship : bump SW v4.07 + doc CLAUDE.md + checklist v32 cochée

CACHE_NAME usca-v4.06 -> usca-v4.07. CLAUDE.md header v4.07 entry + §2 SW + §7 retire P5 de la TODO. SETUP_PUSH.md : v32 cochée (appliquée par JC en Supabase). 5 scénarios de test manuels passés (default state / masquage edit mode / masquage matrix / admin bypass / RLS pharma refus).

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 11.8 : Push (avec confirmation JC)**

À ce stade, demander à JC : "Tous les scénarios passent. Je push ? (Cloudflare déploie en ~30 s, et Service Worker v4.07 force un cache refresh chez tous les utilisateurs au prochain chargement.)"

Si OK :
```bash
git push origin main
```

---

## Self-review checklist

**Spec coverage** :
- §2.1 par défaut tout visible -> géré par "absence = visible" de la migration v32 (T1) + l'apply() qui n'injecte rien si la table est vide ✓
- §2.2 granularité par rôle -> schéma de la table avec PK `(role, module_id)` (T1) ✓
- §2.3 absence = visible -> conséquence directe du schéma + de l'apply() (T1, T3) ✓
- §2.4 admin bypass -> `if (profile.is_admin) return;` dans apply() (T3) ✓
- §3 inventaire 18 modules -> modules-config.js (T2) + data-module sur 14+6 anchors (T5, T6) ✓
- §4.1 schéma BDD + RLS -> migration v32 (T1) ✓
- §4.2 markup data-module -> T5 (admin) + T6 (toolbox) ✓
- §4.3 runtime injection CSS -> module-visibility.js (T3) ✓
- §4.4 edit mode trigger Paramètres + bandeau + gear + popover -> T8 + T9 ✓
- §4.5 matrix Comptes -> T10 ✓
- §4.6 toolbox iframe -> wire dans T4 step 4.3 ✓
- §6 testing 5 scénarios -> T11 step 11.3 ✓
- §7 risques (masquage UI != sécurité) -> noté dans CLAUDE.md update T11 ✓
- §8 rollback -> trivial (retirer scripts dans T4 step), pas besoin de tâche ✓

**Placeholder scan** : aucun `TBD/TODO/implement later`. 1 stub volontaire en T8 step 8.2 (avec note explicite "remplacé en T9").

**Type consistency check** :
- `MODULES_CONFIG` shape `{id, label, strate}` -- utilisé tel quel dans T9 (`config.label`) et T10 (`m.label`, `m.strate`, `m.id`) ✓
- `MODULES_ROLES` array -- utilisé tel quel dans T9 (popover) et T10 (matrix) ✓
- `MODULES_ROLE_LABELS` map -- utilisé dans T9 et T10 ✓
- `fetchHiddenMap()` retourne `{role: Set<moduleId>}` -- consommé via `map[role]?.has(moduleId)` dans T9 et T10 ✓
- `toggleHidden()` retourne `{ok: bool, error?: string}` -- consommé via `res.ok` et `res.error` dans T9 et T10 ✓
- `BANNER_ID` constante T3 cohérente avec `id="module-edit-banner"` du CSS T7 et JS T8 ✓

**Sécurité (no innerHTML)** : tous les blocs JS utilisent `createElement` + `textContent`. Le HTML statique dans `admin/index.html` (modale, accordion shell) reste en HTML écrit normalement -- ce n'est pas du JS innerHTML.

---

## Notes pour l'implémenteur

- **Ordre important** : T1 → T2 → T3 → T4 (infra inerte) → T5/T6 (data-module) → T7 (CSS) → T8 (trigger UI) → T9 (popover) → T10 (matrix) → T11 (ship).
- **JC peut appliquer v32 dès la fin de T1** (recommandé). Sinon, il faut le faire avant T9 step 9.2 (1er test du toggleHidden).
- **Pas de bump SW intermédiaire** : seul le commit T11 bump le cache.
- **Push uniquement à la fin** (après confirmation JC). Pendant T1-T10 on cumule en local.
- **Pas de bundler** : tous les scripts sont chargés via `<script src>`. L'ordre de chargement compte : modules-config.js DOIT précéder module-visibility.js (qui le consume).
