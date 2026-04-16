# USCA Connect — Plan de développement restant

Dernière mise à jour : 16 avril 2026 (fin de session)

---

## État actuel — ce qui fonctionne

### Infrastructure
- **URL** : https://usca-connect.pages.dev
- **Supabase** : pydxfoqxgvbmknzjzecn.supabase.co
- **Service Worker** : usca-v3.20
- **Identifiants staff** : prenom.nom → prenom.nom@aphp.fr (auto)
- **Rôles métier** : medecin, ide, psychologue, pharmacien, secretaire, externe, etudiant_ide
- **Admin** : champ `is_admin` boolean séparé du rôle métier
- **Icône app** : icon-512.png (phénix + poignée de main)
- **Splash screen** : splash.png au chargement
- **Affiche équipe** : affiche-equipe.html (imprimable A4 avec QR code)

### Login unifié (index.html)
- Onglets Patient / Soignant
- Patient : chambre + DDN → session persistante 30 jours
- Soignant : prenom.nom + mot de passe → Supabase Auth
- Auto-redirect si session existante
- Mode dev : triple-tap sur le logo
- Splash screen au chargement

### Module Patient — 8 cartes
- **J'ai un craving** : intensité 1-10, courbe d'insight, déclencheurs multi-sélection (depuis stratégies), durée, affichage stratégies de réponse
- **Mon journal** : agenda craving avec vues semaine/mois/3mois/1an, courbe tendance, stats
- **Programme** : timeline avec hiérarchie visuelle (groupes/événements mis en valeur, routine discret), événements et permissions du jour intégrés
- **Mes stratégies** : plan de prévention guidé (5 catégories Marlatt), section éducative courbe du craving
- **Traitements** : fiches prescrites par le soignant, 20 fiches HTML par médicament, navigation par catégorie
- **Permission** : demande de sortie avec règles (48h max, 20h retour, même jour semaine), statut en attente/validée/refusée
- **Messages** : contenus partagés par le soignant (notes, liens, consignes)
- **Ateliers** : placeholder (à développer)

### Module Admin — 3 onglets
- **Patients** : liste avec icônes craving (rouge) et permission (cyan), admission (chambre+DDN), détail patient avec :
  - Accordion journal craving (10 derniers logs)
  - Accordion fiches traitements (checklist)
  - Accordion permissions (valider/refuser/annuler, modifiable même après validation)
  - Actions : planifier événement (5 types), annoncer permission, partager contenu, date de sortie
  - Voir comme patient (ouvre le module patient en preview)
  - Supprimer séjour (avec export JSON des données)
- **Groupes** : placeholder (à développer avec le planning 2 semaines)
- **Toolbox** : iframe V1 avec dark mode complet

### Gestion des comptes (admin seulement)
- Création : identifiant + mot de passe + nom + rôle + toggle admin
- Liste : modification rôle, modification nom, toggle admin, suppression
- Son propre compte : modification rôle et nom, badge admin non modifiable

### Toolbox Soignant
- 8 cartes : Protocoles USCA, Séjour J1-J12, Scores, Interactions, Comorbidités, ELSA, Admission, Fiches Traitements
- Fiches traitements en iframe in-app
- Dark mode complet (swap palette C)
- Boutons retour cohérents sur toutes les cartes

### App exportée (HTML autonome)
- Clone du module patient avec stockage localStorage
- Signal craving + agenda + stratégies modifiables
- Fiches traitements embarquées
- PIN local optionnel
- Dark mode
- Sauvegarde : re-génération HTML complète + export/import JSON
- Dédoublication des cravings à l'import

### Dark mode
- Global sur tous les modules (CSS partagé shared/theme.css + shared/theme.js)
- Toolbox V1 : swap palette C au chargement + reload iframe au toggle

---

## Migration SQL à exécuter

### v5 (OBLIGATOIRE pour la suppression patient)
```sql
-- supabase-migration-v5.sql
ALTER TABLE alertes DROP CONSTRAINT IF EXISTS alertes_patient_id_fkey;
ALTER TABLE alertes ADD CONSTRAINT alertes_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
ALTER TABLE strategies DROP CONSTRAINT IF EXISTS strategies_patient_id_fkey;
ALTER TABLE strategies ADD CONSTRAINT strategies_patient_id_fkey
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
```

---

## Priorité 1 — Tests et corrections

### À tester
- [ ] Suppression de séjour patient (nécessite migration v5)
- [ ] Création de compte soignant (@aphp.fr)
- [ ] Planifier un événement → vérifier côté patient dans le programme
- [ ] Partager du contenu → vérifier dans carte Messages patient
- [ ] Annoncer une permission → vérifier côté patient + timeline
- [ ] Date de sortie → vérifier côté patient
- [ ] App exportée : signal craving, agenda, stratégies, sauvegarde HTML
- [ ] Dark mode admin (détail patient, modals, accordions)
- [ ] Voir comme patient depuis l'admin

### Bugs potentiels identifiés
- Le re-login admin après création de compte (signUp change la session Supabase)
- Les modals admin ne se ferment pas en cliquant sur le fond noir
- La déconnexion patient ne redirige pas vers l'accueil unifié

---

## Priorité 2 — Programme patient basé sur les groupes

### Prérequis
JC doit fournir le planning type des groupes sur 2 semaines :
- Jour, heure, nom du groupe, salle, animateur
- Roulement semaine A / semaine B

### Architecture
- Programme = groupes du jour (table `groupes` avec récurrence) + événements individuels (table `evenements`) + horaires routine (hardcodés, discrets)
- Table `groupes` : ajouter `jour_semaine` (0-6) et `semaine` ('A'/'B')
- Vues : aujourd'hui (défaut), semaine, 2 semaines
- Navigation entre les jours
- Date affichée sur chaque vue

---

## Priorité 3 — Ateliers (carte patient)

- Liste des groupes auxquels le patient a participé
- Contenu pushé par les animateurs
- Badges de participation
- Table `participations` : patient_id, groupe_id, date, present
- Côté admin : gestion des présences dans l'onglet Groupes

---

## Priorité 4 — Agenda staff (événements d'équipe)

- Agenda partagé pour les soignants
- Événements d'équipe sans patient_id (réunions, staffs, supervisions)
- Modifications SQL :
```sql
ALTER TABLE evenements ALTER COLUMN patient_id DROP NOT NULL;
ALTER TABLE evenements DROP CONSTRAINT IF EXISTS evenements_type_check;
ALTER TABLE evenements ADD CONSTRAINT evenements_type_check
  CHECK (type IN ('entretien', 'consultation', 'familial', 'rdv_externe', 'reunion', 'staff', 'supervision', 'autre'));
```
- Renommer l'onglet "Groupes" en "Planning" dans l'admin

---

## Priorité 5 — Personnalisation staff

- `profiles.modules_autorises` = plafond par rôle (admin)
- `profiles.modules_actifs` = choisi par le soignant
- Page "Mes préférences"

---

## Priorité 6 — App exportée v3

- [ ] Tester le PIN local
- [ ] Mini tutoriel au premier lancement
- [ ] Génération HTML vierge depuis l'admin (patients non hospitalisés)
- [ ] Vérifier la sauvegarde HTML (re-génération avec données à jour)

---

## Priorité 7 — Login unifié v2

- Fusionner /staff/ et /admin/ en un seul module
- Auto-détection du type d'utilisateur
- Mode dev via compte admin (déjà codé)

---

## Priorité 8 — Module demandes de post-cure + Annuaire patients

### Demandes de post-cure (rôle médecin)
- JC a un module HTML existant à intégrer
- Fonctionnalité réservée aux profils avec rôle `medecin`
- Intégration dans le module admin ou en carte dédiée

### Annuaire patients
- Liste/répertoire des patients pour consultation rapide
- À définir : contenu, filtres, accès

---

## Priorité 9 — Design et identité visuelle

- Logo et icône : ✅ intégrés (icon-512.png, splash.png)
- Pour changer l'icône sur les téléphones déjà installés → nécessite désinstall/réinstall
- Affiche équipe : ✅ (affiche-equipe.html)

---

## Fichiers de référence

| Fichier | Contenu |
|---|---|
| `PROJECT_PENDING.md` | Ce fichier — plan de développement |
| `SPEC_PATIENT_V3.md` | Spec du module patient v3 |
| `parametrage_login.md` | Spec du login unifié |
| `supabase-migration-v5.sql` | CASCADE (exécutée) |
| `supabase-migration-v6.sql` | Groupes : animateurs + modifications + rappels (à exécuter) |
| `shared/planning-groupes.js` | Planning semaine A partagé patient/admin |
| `affiche-equipe.html` | Affiche A4 imprimable pour l'équipe |

---

## Notes pour la prochaine session

1. **Exécuter migration v6** dans Supabase (tables groupe_animateurs, groupe_modifications, groupe_rappels)
2. **Tester l'onglet Groupes** dans l'admin : désignation animateur, modifier heure, annuler, exclure, rappel
3. **Tester le programme patient** : vérifier que les groupes + repas s'affichent correctement sur la timeline
4. **JC doit fournir** le planning semaine B pour compléter le roulement
5. **Bugs à corriger** : re-login admin après signUp, modals fond noir, déconnexion patient
6. **Chantier futur** : module post-cure (HTML existant de JC) + annuaire patients
7. **Mot de passe commun** des soignants : `usca_c15`
8. **URL de production** : https://usca-connect.pages.dev
