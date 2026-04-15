# USCA Connect — Plan de développement restant

Dernière mise à jour : 16 avril 2026

---

## État actuel

### Ce qui fonctionne
- **Login unifié** : Patient (chambre+DDN) / Soignant (prenom.nom@aphp.fr) + mode dev (triple-tap)
- **Module Patient** : 8 cartes (Craving, Journal, Programme, Stratégies, Traitements, Permission, Messages, Ateliers placeholder)
- **Module Admin** : 3 onglets (Patients, Groupes placeholder, Toolbox), détail patient avec accordions + 5 actions
- **Circuit soignant→patient** : événements, contenus, permissions, fiches traitements, date de sortie
- **Système permissions** : demande patient + validation soignant + règles métier (48h, 20h, semaine)
- **Gestion comptes** : création, modification rôle/nom, toggle admin, suppression
- **Dark mode** : global sur tous les modules, swap palette C pour la Toolbox V1
- **App exportée** : HTML autonome avec craving log, stratégies modifiables, fiches embarquées, sauvegarde/import
- **20 fiches traitements** HTML par médicament

### Tables Supabase
`programmes`, `profiles`, `patients`, `groupes`, `alertes`, `strategies`, `prescriptions`, `permissions`, `evenements`, `contenus_partages`

### Migrations à exécuter
- **v5** (`supabase-migration-v5.sql`) : ON DELETE CASCADE sur alertes + strategies — **NÉCESSAIRE** pour que la suppression de séjour fonctionne

---

## Priorité 1 — Corrections et stabilisation

### Bugs connus à vérifier
- [ ] Tester la suppression de séjour patient (nécessite migration v5)
- [ ] Tester la création de compte soignant avec le nouveau système @aphp.fr
- [ ] Vérifier que le re-login admin fonctionne après création de compte (signUp change la session)
- [ ] Tester le bouton "Voir comme patient" depuis le détail patient admin
- [ ] Tester l'app exportée : signal craving, agenda 4 vues, stratégies modifiables, sauvegarde HTML
- [ ] Vérifier la modification de nom des comptes soignants (policy RLS UPDATE nécessaire)
- [ ] Tester les 3 onglets admin (Patients, Groupes, Toolbox iframe)
- [ ] Dark mode : vérifier cohérence dans le détail patient admin (accordions, modals)

### Améliorations UX immédiates
- [ ] Quand le patient se déconnecte, rediriger vers l'accueil unifié (pas rester sur /patient/)
- [ ] Quand le soignant se déconnecte, nettoyer `usca_session` de localStorage
- [ ] Ajouter un feedback visuel (toast/notification) quand un événement/contenu/permission est créé côté admin
- [ ] Les modals admin (événement, permission, contenu, sortie) doivent se fermer en cliquant sur le fond noir

---

## Priorité 2 — Programme patient basé sur les groupes

### Prérequis
JC doit fournir le planning type des groupes sur 2 semaines :
- Jour, heure, nom du groupe, salle, animateur
- Roulement semaine A / semaine B

### Architecture
- Les groupes sont les mêmes pour tous les patients
- Un patient qui arrive en cours de route prend le programme tel quel
- Le programme du patient = groupes du jour (depuis table `groupes`) + événements individuels (depuis table `evenements`) + horaires routine (hardcodés)
- Les horaires de routine (repas, constantes, traitements) sont fixes et discrets visuellement
- Les groupes et événements sont mis en valeur

### Tables à modifier
- `groupes` : ajouter un champ `jour_semaine` (0-6) et `semaine` ('A' ou 'B') pour le roulement
- Ou utiliser `recurrence` déjà existant dans la table

### Vues du programme
- **Aujourd'hui** (défaut) : timeline verticale avec hiérarchie visuelle
- **Semaine** : vue calendrier horizontal, 7 jours
- **2 semaines** : vue complète du roulement
- Navigation entre les jours (< jour précédent | jour suivant >)
- Afficher la date sur chaque vue

### Hiérarchie visuelle (déjà codée dans la timeline)
| Type | Style |
|---|---|
| Groupe thérapeutique | Carte colorée verte, bold, gros point |
| Entretien / RDV | Carte indigo, badge "RDV", shadow |
| Permission | Carte cyan, badge "Permission" |
| Soin quotidien | Ligne simple, petit texte gris |
| Repas | Ligne simple, très discret |

---

## Priorité 3 — Ateliers (carte patient)

### Fonctionnalités
- Liste des ateliers/groupes auxquels le patient a participé
- Contenu pushé par les animateurs de groupe (via admin ou une interface dédiée)
- Badges de participation (nombre de groupes, assiduité)
- Historique des participations

### Tables nécessaires
- `participations` : patient_id, groupe_id, date, present (boolean)
- Ou réutiliser `groupes.participants` (UUID array) déjà existant

### Côté admin
- Dans l'onglet Groupes : gestion des présences (cochable par patient)
- L'animateur coche les présents après chaque groupe

---

## Priorité 4 — Agenda staff (événements d'équipe)

### Fonctionnalités
- Agenda partagé pour les soignants
- Événements d'équipe : réunions, staffs, supervisions
- Groupes thérapeutiques (depuis la table `groupes`)
- Possibilité d'ajouter des événements

### Modifications nécessaires
- `evenements.patient_id` : rendre nullable (événements d'équipe sans patient)
- Ajouter un champ `is_staff_event` boolean ou un type `'reunion'`, `'staff'`, `'supervision'`
- Nouvel écran dans l'onglet "Groupes" de l'admin (ou renommer l'onglet en "Planning")

### SQL
```sql
ALTER TABLE evenements ALTER COLUMN patient_id DROP NOT NULL;
ALTER TABLE evenements DROP CONSTRAINT IF EXISTS evenements_type_check;
ALTER TABLE evenements ADD CONSTRAINT evenements_type_check
  CHECK (type IN ('entretien', 'consultation', 'familial', 'rdv_externe', 'reunion', 'staff', 'supervision', 'autre'));
```

---

## Priorité 5 — Personnalisation staff

### Chaque soignant choisit ses modules
- `profiles.modules_autorises` = défini par l'admin (plafond par rôle)
- `profiles.modules_actifs` = choisi par le soignant (sous-ensemble)
- Page "Mes préférences" dans l'interface soignant

### Modules configurables
- Toolbox (sous-modules : Protocoles, Séjour, Scores, Interactions, Comorbidités, ELSA, Fiches traitements)
- Gestion patients
- Gestion groupes
- Planning
- Alertes

---

## Priorité 6 — App exportée v3

### Améliorations
- [ ] PIN local : tester le mécanisme de protection
- [ ] S'assurer que le fichier HTML peut être "installé" sur l'écran d'accueil mobile
- [ ] Ajouter un mini tutoriel au premier lancement ("Comment utiliser votre app")
- [ ] Possibilité de générer un HTML vierge depuis l'admin (pour des patients non hospitalisés)
- [ ] La sauvegarde HTML re-génère correctement le fichier avec les données à jour

---

## Priorité 7 — Login unifié v2

### Quand les modules sont prêts
- Fusionner `/staff/` et `/admin/` en un seul module authentifié
- L'accueil = login, pas de choix Patient/Soignant explicite (détection automatique ?)
- Ou garder les 2 onglets mais avec auto-redirect si session existante (déjà codé)
- Mode dev accessible depuis le compte admin (déjà codé via icône œil)

---

## Fichiers de référence

| Fichier | Contenu |
|---|---|
| `INSTRUCTIONS_PROJET.md` | Spec originale du projet |
| `PLAN_V2.md` | Plan d'implémentation initial (partiellement obsolète) |
| `SPEC_PATIENT_V3.md` | Spec du module patient v3 |
| `parametrage_login.md` | Spec du login unifié |
| `supabase-schema.sql` | Schéma initial |
| `supabase-migration-v2.sql` | Strategies + alertes enrichies |
| `supabase-migration-v3.sql` | Prescriptions |
| `supabase-migration-v4.sql` | Permissions + événements + contenus |
| `supabase-migration-v5.sql` | CASCADE (à exécuter) |

---

## Priorité 8 — Design et identité visuelle

### Icône de l'app
- Remplacer l'icône SVG inline actuelle (cercle + croix) par un vrai logo USCA Connect
- Créer les versions 192x192 et 512x512 pour le manifest PWA
- Mettre à jour `manifest.json` et `<link rel="apple-touch-icon">`
- JC doit valider le design du logo

### Page de chargement (splash screen)
- Actuellement pas de splash screen — l'app affiche directement le login
- Ajouter un écran de chargement avec le logo + animation pendant le load initial
- Sur iOS : configurer `apple-touch-startup-image` dans le `<head>`
- Sur Android : le splash est généré automatiquement depuis le manifest (logo + background_color)

---

## Notes pour la prochaine session

1. **Commencer par exécuter migration v5** si pas encore fait
2. **Tester le circuit complet** : créer un patient, lui prescrire des fiches, planifier un événement, partager du contenu → vérifier côté patient
3. **Le planning des groupes** est le gros chantier suivant — JC doit fournir le planning 2 semaines
4. **L'onglet Groupes** est un placeholder vide pour le moment
5. **Les identifiants staff** utilisent `@aphp.fr` comme suffixe automatique
6. **Le rôle admin** est séparé du rôle métier (champ `is_admin` boolean)
