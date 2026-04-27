# P5 — Personnalisation des modules soignant (spec design)

> **Statut** : design validé le 2026-04-24 par JC. Ajustements 2026-04-27 (3 modules retirés de l'inventaire, déclencheur edit mode déplacé dans modale Paramètres). Prêt pour implémentation.
> **Version d'app cible** : v4.07 (bump SW requis — v4.06 déjà occupé par le fix offline QCM du 25/04).
> **Migration SQL** : v32 (`role_modules_hidden`).

---

## 1. Intention

Permettre à l'admin (JC) de cacher certains éléments de l'UI soignant pour un rôle donné (médecin, IDE, psychologue, pharmacien, secrétaire) afin de nettoyer la vue de chaque profil. Motivation : hygiène UX proactive — pas de problème critique, pas d'enjeu RLS/sécurité.

**Non-objectifs** :
- Pas de personnalisation per-user (seulement per-rôle).
- Pas de gestion côté étudiant IDE / externe (déjà séparés au niveau URL, hors scope).
- Pas de refonte des dashboards — juste masquage d'éléments existants.
- Pas de contrôle d'accès BDD (les données restent lisibles via l'API — c'est du masquage UI uniquement).

---

## 2. Modèle

### 2.1 Par défaut : tout visible

Aucun preset par rôle. Un soignant qui vient d'être créé voit l'UI complète (strictement identique à l'état avant P5). L'admin décide explicitement ce qui doit être caché.

### 2.2 Granularité : par rôle, pas par user

Quand l'admin cache "Dossier post-cure" pour le pharmacien, ça cache pour TOUS les pharmaciens. Les exceptions individuelles ne sont pas supportées dans cette V1.

### 2.3 Principe "absence = visible"

La BDD ne stocke QUE les masquages. Absence de ligne `(pharmacien, patient_craving)` → visible. Présence → masqué. Conséquences :
- BDD légère (quelques dizaines de lignes max).
- Ajouter un nouveau module dans 6 mois : aucune migration, il devient automatiquement visible partout.
- La config est lisible d'un coup d'œil (seules les déviations apparaissent).

### 2.4 Admin voit tout, toujours

Un soignant avec `is_admin=true` bypass complètement le filtrage, quel que soit son rôle métier. Il voit l'UI intégrale afin de pouvoir éditer la config et constater l'état global.

---

## 3. Inventaire des modules (18 IDs)

> Note historique : la première version (2026-04-24) listait 21 modules. Trois ont été retirés le 2026-04-27 car JC a confirmé qu'ils doivent rester toujours visibles : `dashboard_nouveau_patient` (le secrétaire doit pouvoir créer un patient), `patient_voir_comme_patient` (utilitaire admin/médecin transverse), `patient_supprimer_sejour` (action critique, pas de variation par rôle).

Source de vérité : `shared/modules-config.js` (nouveau fichier).

| Strate | ID | Label | Élément HTML/JSX concerné |
|---|---|---|---|
| Onglets | `tab_toolbox` | Onglet Toolbox | `admin/index.html` bottom nav `[data-tab="toolbox"]` |
| Onglets | `tab_planning` | Onglet Planning | `admin/index.html` bottom nav `[data-tab="groupes"]` |
| Dashboard | `dashboard_entrees_sorties` | Sorties prévues + liste d'attente | `#section-entrees-sorties` |
| Dashboard | `dashboard_patients_list` | Liste chambres + détail patient | section racine patients |
| Dashboard | `dashboard_mes_eleves` | Mes élèves / Mon externe | `#section-eleves` |
| Patient | `patient_craving` | Journal craving | `#acc-craving` + content |
| Patient | `patient_fiches` | Fiches traitements | `#acc-fiches` + content |
| Patient | `patient_permissions` | Permissions | `#acc-perms` + content |
| Patient | `patient_messages` | Messages patient ↔ équipe | `#btn-action-messages` |
| Patient | `patient_evenements` | Planifier un événement | `#btn-action-event` |
| Patient | `patient_sortie` | Annoncer sortie + exports | `#btn-action-sortie` + `#sortie-exports` |
| Patient | `patient_postcure` | Dossier post-cure | accordion `#btn-action-postcure` wrapper |
| Toolbox | `toolbox_protocoles` | Protocoles USCA (hub) | carte "Protocoles USCA" JSX |
| Toolbox | `toolbox_elsa` | ELSA (hub) | carte "ELSA" JSX |
| Toolbox | `toolbox_postcure` | Dossier post-cure | carte "Dossier post-cure" JSX |
| Toolbox | `toolbox_traitements` | Fiches patient + expert | carte "Traitements" JSX |
| Toolbox | `toolbox_scores` | Scores + convertisseurs | carte "Scores" JSX |
| Toolbox | `toolbox_interactions` | Interactions | carte "Interactions" JSX |

**Shape de `shared/modules-config.js`** :
```js
window.MODULES_CONFIG = [
  { id: 'tab_toolbox', label: 'Onglet Toolbox', strate: 'Onglets' },
  { id: 'tab_planning', label: 'Onglet Planning', strate: 'Onglets' },
  // ... 18 entrées
];
window.MODULES_ROLES = ['medecin', 'ide', 'psychologue', 'pharmacien', 'secretaire'];
```

---

## 4. Architecture technique

### 4.1 Schéma BDD — migration v32

```sql
CREATE TABLE role_modules_hidden (
  role       TEXT NOT NULL
             CHECK (role IN ('medecin','ide','psychologue','pharmacien','secretaire')),
  module_id  TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  PRIMARY KEY (role, module_id)
);

ALTER TABLE role_modules_hidden ENABLE ROW LEVEL SECURITY;

CREATE POLICY "rmh_read"
  ON role_modules_hidden
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "rmh_write"
  ON role_modules_hidden
  FOR ALL
  TO authenticated
  USING ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true)
  WITH CHECK ((SELECT is_admin FROM profiles WHERE id = auth.uid()) = true);
```

**RLS** : tout user authentifié peut READ (nécessaire pour appliquer le filtrage côté client). Seul un admin peut INSERT/UPDATE/DELETE.

### 4.2 Markup HTML — `data-module`

Chaque élément gatable reçoit un attribut `data-module="<id>"` sur son conteneur racine :

```html
<!-- admin/index.html (extraits) -->
<div id="section-entrees-sorties" data-module="dashboard_entrees_sorties">...</div>
<button id="acc-craving" data-module="patient_craving">...</button>
<div id="acc-craving-content" data-module="patient_craving">...</div>  <!-- aussi sur le content -->
<button data-tab="toolbox" data-module="tab_toolbox">...</button>
```

Pour les éléments à 2 parties (bouton + contenu, ex. accordions), le `data-module` est appliqué sur LES DEUX afin que tout le bloc disparaisse d'un coup.

Pour la Toolbox JSX :
```jsx
<div data-module="toolbox_elsa" className="card">...</div>
```

### 4.3 Runtime — injection CSS

Nouveau fichier `shared/module-visibility.js` exposant `window.moduleVisibility` :

```js
window.moduleVisibility = {
  STYLE_ID: 'module-visibility-style',

  async apply(profile) {
    if (!profile || profile.is_admin) return;
    const { data, error } = await sb.from('role_modules_hidden')
      .select('module_id').eq('role', profile.role);
    if (error) { console.warn('moduleVisibility.apply failed:', error); return; }
    const hidden = (data || []).map(r => r.module_id);
    this._inject(hidden);
  },

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

  async toggleHidden(role, moduleId, shouldHide) {
    if (shouldHide) {
      await sb.from('role_modules_hidden').upsert({ role, module_id: moduleId, updated_by: (await sb.auth.getUser()).data.user.id });
    } else {
      await sb.from('role_modules_hidden').delete().eq('role', role).eq('module_id', moduleId);
    }
  },

  async fetchHiddenMap() {
    const { data } = await sb.from('role_modules_hidden').select('role, module_id');
    const map = {};
    (data || []).forEach(r => {
      if (!map[r.role]) map[r.role] = new Set();
      map[r.role].add(r.module_id);
    });
    return map;
  }
};
```

**Point d'entrée** :
- `admin/index.html` : appelle `moduleVisibility.apply(profile)` dans `showAdminApp()` juste après `currentProfile = profile`.
- `staff/toolbox.html` : petit `<script>` au démarrage qui lit `sessionStorage.staff_profile` et appelle la même méthode.

### 4.4 Admin edit mode — UI inline

**Déclencheur** : entrée "🔧 Mode édition modules" dans la modale Paramètres ⚙️ existante (visible uniquement si `is_admin`). Justification : éviter d'ajouter un bouton dédié dans le header pour une fonction admin rare ; ⚙️ est déjà l'endroit où l'admin va régler ses paramètres (push, pause vacances).

**Activation** :
1. Clic sur l'entrée → ferme la modale + `body.classList.add('module-edit')` + injection d'un bandeau indigo sticky en haut du dashboard : "✏️ Mode édition modules actif — [Terminer]" (fond `bg-indigo-50`, bordure `border-indigo-300`, bouton "Terminer" en lien indigo). Le bandeau garantit la visibilité du mode actif et un point de sortie clair sans dépendre de la modale Paramètres.
2. Le style `#module-visibility-style` passe `disabled=true` → tout redevient visible.
3. Une fonction `moduleVisibility.mountEditButtons()` parcourt tous les `[data-module]` et injecte un vrai bouton DOM `<button class="module-edit-gear">⚙️</button>` dans chacun (avant `appendChild`, on vérifie `position:relative` — sinon on l'ajoute).
4. CSS (ajouté dans `shared/theme.css`) :

```css
body.module-edit [data-module] {
  outline: 1px dashed rgba(79, 70, 229, 0.4); /* indigo dashed pour repérer */
}
body.module-edit [data-module].module-has-hides {
  outline-color: rgba(239, 68, 68, 0.6); /* rouge si au moins 1 rôle masque déjà */
}
.module-edit-gear {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 100;
  background: white;
  border: 1px solid rgba(0,0,0,0.1);
  border-radius: 6px;
  padding: 2px 6px;
  font-size: 13px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
  display: none; /* caché par défaut, affiché uniquement en edit mode */
}
body.module-edit .module-edit-gear { display: inline-block; }
```

5. Un event listener sur chaque `.module-edit-gear` (posé au mount) ouvre le popover. Utiliser un vrai `<button>` plutôt qu'un `::after` évite les hacks de détection de clic sur pseudo-élément.

Au démontage (sortie edit mode), on laisse les boutons en place — ils sont invisibles grâce au CSS — ça évite un re-parcours DOM à chaque toggle.

**Popover** : un div flottant (position absolute près du clic) contenant :
```
┌──────────────────────────────────────┐
│ Masquer « Journal craving »          │
│                                      │
│  ☐ Médecin        ☑ Pharmacien       │
│  ☐ IDE            ☐ Secrétaire       │
│  ☑ Psychologue                       │
│                                      │
│                         [Fermer]     │
└──────────────────────────────────────┘
```

Chaque changement de case → appel `moduleVisibility.toggleHidden(role, moduleId, shouldHide)` → BDD update immédiate. Feedback : case cochée reste cochée. Pas de bouton "Save".

**Visualisation des éléments actuellement cachés en edit mode** : ajouter un liseré rouge pointillé pour les `[data-module]` qui ont au moins 1 ligne en BDD :
```css
body.module-edit [data-module].has-hides {
  outline-color: rgba(239, 68, 68, 0.6);
}
```
Application : après `fetchHiddenMap()`, ajouter la classe `has-hides` aux `[data-module]` concernés.

**Sortie** : clic "Terminer" dans le bandeau (ou ré-ouverture de la modale Paramètres ⚙️ + re-clic sur l'entrée "Mode édition modules" qui agit comme toggle) → retire `body.module-edit` + supprime le bandeau, réactive le style de masquage, retire la classe `has-hides` des `[data-module]`.

### 4.5 Matrix Comptes — vue d'ensemble

Nouvelle section accordion "📋 Modules par rôle" dans la page Comptes (`admin/index.html section-comptes`).

Rendu : un tableau `<table>` avec :
- Ligne d'en-tête : 1 col module + 5 cols rôles
- Groupé par `strate` (séparateurs "── Onglets ──", "── Dashboard ──", etc.)
- Chaque cellule = `<input type="checkbox">` cochée si visible (pas de ligne BDD), décochée si masquée (ligne BDD présente)
- Change event → `moduleVisibility.toggleHidden(role, moduleId, shouldHide)`

Les deux UIs (edit mode et matrix) partagent le même store BDD ; une modification dans l'une apparaît immédiatement dans l'autre au re-fetch.

### 4.6 Toolbox iframe

Dans `staff/toolbox.html`, avant le script React :

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<script src="../shared/supabase.js"></script>
<script src="../shared/modules-config.js"></script>
<script src="../shared/module-visibility.js"></script>
<script>
(function() {
  const profile = JSON.parse(sessionStorage.getItem('staff_profile') || 'null');
  if (profile) moduleVisibility.apply(profile);
})();
</script>
```

Les cartes d'accueil React ajoutent `data-module="<id>"` sur leur wrapper. Comme la sessionStorage est partagée (même origine), aucun bridge postMessage.

---

## 5. Ordre d'implémentation

1. **Migration v32** — `migrations/supabase-migration-v32.sql` (création table + RLS)
2. **Applique v32** côté JC (checklist dans `SETUP_PUSH.md` ou checklist dédiée)
3. **Config** — `shared/modules-config.js` (inventaire des 18 modules + 5 rôles)
4. **Helpers** — `shared/module-visibility.js` (apply, toggle, fetchMap)
5. **Markup** — injecter `data-module` sur les 18 éléments :
   - `admin/index.html` (onglets + dashboard + patient détail + boutons)
   - `staff/toolbox.html` (cartes JSX d'accueil)
6. **Runtime** — appel `moduleVisibility.apply(profile)` :
   - `admin/index.html` dans `showAdminApp()`
   - `staff/toolbox.html` au chargement iframe
7. **Edit mode UI** — entrée "Mode édition modules" dans modale Paramètres + bandeau sticky "Terminer", CSS `body.module-edit`, popover par module, event listener
8. **Matrix Comptes** — nouvelle section, rendu tableau
9. **Bump SW** → `v4.07`
10. **Test manuel** : login médecin/IDE/psy/pharma/secrétaire de test, vérifier visibilité ; edit mode en admin, toggles, matrix cohérente
11. **Doc** — update CLAUDE.md header + `7. À FAIRE` (retirer P5)

---

## 6. Testing

Pas de tests auto (codebase sans test runner). Vérification manuelle :

- **Scénario 1 — default state** : création d'un compte test médecin → voit l'UI complète identique avant-après. Même chose pour les 4 autres rôles.
- **Scénario 2 — masquage via edit mode** : admin entre en ✏️, cache `patient_craving` pour pharmacien → logout → login pharmacien test → pas de "Journal craving" dans le détail patient. Relogin admin → matrix Comptes montre la case décochée pour (pharmacien, Journal craving).
- **Scénario 3 — masquage via matrix** : admin décoche `tab_toolbox` pour secrétaire dans Comptes → logout → login secrétaire → pas d'onglet Toolbox dans la bottom nav.
- **Scénario 4 — admin bypass** : admin avec rôle "pharmacien" voit TOUT (même les modules normalement cachés aux pharmaciens).
- **Scénario 5 — RLS** : un pharmacien test ne peut pas INSERT/DELETE dans `role_modules_hidden` (RLS refuse).

---

## 7. Risques & limites

- **Masquage UI ≠ sécurité BDD** : les données reste accessibles via l'API Supabase (les RLS des tables patients/messages/etc. ne changent pas). P5 est un "déclutter" visuel, pas un contrôle d'accès. Si à l'avenir il faut bloquer l'accès des données (ex: RGPD strict), il faudra ajouter des policies RLS sur chaque table concernée, indépendant de P5.
- **Toolbox latence** : l'iframe fait son propre fetch à la BDD → +1 round-trip. Mitigation : lecture très petite (~20 lignes max), au pire 200 ms sur réseau lent.
- **State de l'edit mode volatile** : si l'admin recharge l'app en edit mode, il en sort (state non persisté). C'est souhaité — pas de mode édition "oublié".
- **Pas de journalisation des changements** : `updated_by` + `updated_at` permettent de savoir QUI a masqué QUOI et QUAND, mais pas l'historique complet. Suffisant pour l'instant (un seul admin).

---

## 8. Rollback

Si P5 casse quelque chose en prod, rollback rapide :
1. Retirer le `<script src="../shared/module-visibility.js">` de `admin/index.html` et `staff/toolbox.html` → plus aucun masquage, UI pleine.
2. Optionnel : DROP TABLE `role_modules_hidden` (migration v33 si besoin de nettoyer).

Le `data-module` laissé sur les éléments HTML est inoffensif (attribut inconnu, ignoré par le browser).

---

## 9. Extensions V2 (hors scope, notés pour référence)

- **Per-user overrides** : ajouter une seconde table `user_modules_override(user_id, module_id, visible)` qui prime sur `role_modules_hidden`. UI : bouton "..." sur chaque user dans Comptes → modal individuel. *Utile si JC a des exceptions à gérer à l'avenir.*
- **Preset par substance/parcours** : au lieu de rôles, grouper par type de patient (OH vs TSO vs psy) — plus radical, sort du scope P5.
- **Journal d'audit** : table `role_modules_log(role, module_id, action, actor, at)` — historique des changements. *Utile si plusieurs admins.*
- **Intégration post-P5** : quand on ajoute un nouveau module (ex: future carte "Annuaire post-sortie"), l'ajouter à `shared/modules-config.js` + `data-module="..."` sur l'élément → il apparaît automatiquement dans la matrix Comptes et dans l'edit mode, visible par défaut pour tous.
