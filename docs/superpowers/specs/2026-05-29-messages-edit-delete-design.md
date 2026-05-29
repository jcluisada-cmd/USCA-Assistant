# Spec — Modifier / supprimer ses propres messages (conversation patient ↔ soignants)

> **Date** : 2026-05-29
> **Auteur** : Dr JC Luisada (design assisté Claude)
> **Statut** : validé — prêt pour plan d'implémentation
> **Cible version** : v4.42

---

## 1. Objectif

Permettre à chaque émetteur d'un message dans la conversation `contenus_partages` de
**modifier** et **supprimer** les messages **qu'il a lui-même écrits**, depuis les 3 interfaces
qui affichent cette conversation : patient, admin (soignant), PdS.

## 2. Contexte existant

- Table unique `contenus_partages` (migration v4) : `id, patient_id, cree_par, titre, contenu, type, created_at`.
- **Convention** : `cree_par IS NULL` = message du patient (session anonyme chambre+DDN) ; `cree_par = <uuid profil>` = message d'un soignant.
- 3 rendus de la conversation :
  - `patient/index.html` → `loadMessages()` (~ligne 961) — bulle patient à droite (`bg-purple-600`), soignant à gauche. **Session anonyme.**
  - `admin/index.html` → rendu messages (~ligne 2940-3025) — patient à gauche, soignant (moi) à droite. **Session authentifiée.**
  - `pds/index.html` → `renderTabMessages()` (~ligne 720) — patient à gauche, soignant à droite. **Session authentifiée (compte PdS partagé).**
- Helpers `shared/supabase.js` : `getContenus`, `createContenu`, `deleteContenu` existent. **`deleteContenu` n'est appelé nulle part en UI actuellement** (donc resserrer sa policy ne casse aucun usage).
- RLS actuelle `contenus_partages` :
  - `contenus_select_all` : SELECT `USING (true)`
  - `contenus_insert_all` (v21) : INSERT `WITH CHECK (true)` — patient anon autorisé
  - `contenus_delete_auth` (v4) : DELETE `USING (auth.role() = 'authenticated')` — **trop large**, à resserrer
  - **aucune policy UPDATE** → modification impossible en l'état

## 3. Décisions validées

| Décision | Choix retenu |
|---|---|
| Suppression | **Définitive (hard delete)** — pas de soft delete, pas de trace |
| Indicateur d'édition | **Afficher « (modifié) »** → nécessite colonne `modifie_le` |
| Portée soignant | **Seulement ses propres messages** (`auth.uid() = cree_par`) ; compte PdS partagé ⇒ les PdS partagent leurs messages |
| Périmètre interfaces | **Les 3** (patient, admin, PdS) |
| Interaction UI | **Icône crayon ✏️ → mini-menu** « Modifier le message » / « Supprimer le message » (rouge, avec confirmation) |

## 4. Conception

### 4.1 Base de données — migration v40

Fichier `migrations/supabase-migration-v40.sql` :

```sql
-- a) colonne pour l'indicateur "(modifié)"
ALTER TABLE contenus_partages ADD COLUMN IF NOT EXISTS modifie_le TIMESTAMPTZ;

-- b) policy UPDATE (n'existait pas) — chacun ne modifie que ses propres messages
CREATE POLICY "contenus_update_own" ON contenus_partages FOR UPDATE
  USING      ( (auth.uid() = cree_par) OR (auth.uid() IS NULL AND cree_par IS NULL) )
  WITH CHECK ( (auth.uid() = cree_par) OR (auth.uid() IS NULL AND cree_par IS NULL) );

-- c) resserrer DELETE : "authenticated" (trop large) → uniquement ses propres messages
DROP POLICY IF EXISTS "contenus_delete_auth" ON contenus_partages;
CREATE POLICY "contenus_delete_own" ON contenus_partages FOR DELETE
  USING ( (auth.uid() = cree_par) OR (auth.uid() IS NULL AND cree_par IS NULL) );
```

Sémantique des prédicats :
- `auth.uid() = cree_par` → un soignant authentifié ne touche que **ses** messages.
- `auth.uid() IS NULL AND cree_par IS NULL` → un patient anonyme ne touche que les messages **patient**.
- Un soignant ne peut donc pas modifier/supprimer un message patient, ni un message d'un autre soignant.

### 4.2 Helper partagé — `shared/supabase.js`

Ajout à côté de `deleteContenu` :

```js
async updateContenu(id, contenu) {
  const { error } = await sb.from('contenus_partages')
    .update({ contenu: contenu, modifie_le: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
},
```

`getContenus` sélectionne déjà `*` → `modifie_le` remonte automatiquement.

### 4.3 UX — icône crayon → menu (les 3 interfaces)

Sur chaque bulle écrite **par soi-même** :
- côté patient : bulles où `cree_par` est falsy ;
- côté soignant (admin & PdS) : bulles où `cree_par === session.id` (l'uuid du profil courant).

Comportement :
1. Petite icône **crayon ✏️** discrète dans la bulle (coin / en-tête).
2. Au clic → mini-menu (popover léger) avec deux entrées :
   - **« Modifier le message »** → la bulle bascule en mode édition : `textarea` pré-rempli avec le contenu + boutons **Valider** / **Annuler**. À la validation : `updateContenu(id, nouveauTexte)` puis rechargement de la liste.
   - **« Supprimer le message »** (texte **rouge**) → confirmation (« Supprimer ce message ? »). Si oui : `deleteContenu(id)` puis rechargement.
3. Une bulle dont `modifie_le` est non nul affiche **« (modifié) »** discret à côté de l'horodatage.

Contraintes :
- Mobile-first : zone tactile suffisante, menu refermable au clic extérieur.
- Réutiliser le pattern de confirmation/toast déjà présent dans chaque interface (`showToast` côté PdS ; pattern equivalent admin/patient).
- Ne pas casser le format chat existant (tri chronologique, auto-scroll bas).

### 4.4 Fichiers touchés

| Fichier | Modification |
|---|---|
| `migrations/supabase-migration-v40.sql` | **nouveau** — colonne + policies |
| `shared/supabase.js` | + `updateContenu` |
| `patient/index.html` | `loadMessages` : crayon/menu/édition/« (modifié) » sur bulles patient |
| `admin/index.html` | rendu messages (~2971) : idem sur bulles soignant (`cree_par === currentProfile.id`) |
| `pds/index.html` | `renderTabMessages` : idem sur bulles soignant (`cree_par === session.id`) |
| `sw.js` | bump `CACHE_NAME` `usca-v4.41` → `usca-v4.42` |
| `CHANGELOG.md` | ligne v4.42 |
| `CLAUDE.md` | en-tête version + SW |
| `DB_SCHEMA.md` | colonne `modifie_le` + policies v40 + ligne historique migrations |

## 5. Risques & limites

- **Auth patient faible (connu, accepté)** : au niveau RLS, un patient anonyme ne peut pas être
  distingué d'un autre — il pourrait techniquement modifier/supprimer un message patient d'un
  autre dossier. C'est le même modèle de sécurité que l'INSERT ouvert v21 (chambre+DDN, réseau
  hospitalier interne, données limitées). Cette spec **ne l'aggrave pas** ; elle le maintient.
- **Compte PdS partagé** : tous les PdS partageant le même profil, ils peuvent mutuellement
  modifier/supprimer leurs messages PdS. Comportement attendu et accepté.
- **Hard delete** : aucune récupération possible après suppression — d'où la confirmation explicite.

## 6. Critères de réussite

- [ ] Un patient peut modifier et supprimer ses propres messages depuis `patient/`.
- [ ] Un soignant peut modifier et supprimer ses propres messages depuis `admin/` et `pds/`.
- [ ] Un soignant ne voit pas le crayon sur les messages patient ni sur ceux d'un autre soignant.
- [ ] Un message modifié affiche « (modifié) ».
- [ ] La suppression demande confirmation et est définitive.
- [ ] Service Worker bumpé, aucune régression du format chat (tri, auto-scroll, badges non-lus).
