# Spécification Module Patient V3

## Principes directeurs

L'application patient doit être **tournée vers l'avenir**, pas vers le séjour. Le patient la construit pendant l'hospitalisation mais elle l'accompagne **après la sortie**. L'export n'est pas un résumé statique — c'est une **application autonome fonctionnelle**.

---

## 1. App exportée = clone fonctionnel du module patient

L'app exportée doit ressembler au maximum au module patient principal. Elle contient :
- Toutes les données de l'hospitalisation (historique craving, stratégies construites, fiches traitements)
- Un système de **log craving fonctionnel** (stockage en localStorage du fichier HTML)
- La possibilité de **modifier/ajouter des stratégies** (stockage en localStorage)
- Les fiches traitements embarquées
- Un **agenda craving** avec vues semaine/mois/3 mois/1 an
- La courbe d'évolution du craving
- Pas de connexion internet requise

### Ce qui change vs le module principal
| Fonctionnalité | Module principal | App exportée |
|---|---|---|
| Stockage craving | Supabase | localStorage |
| Stockage stratégies | Supabase | localStorage |
| Fiches traitements | Chargées depuis le serveur | Embarquées dans le HTML |
| Programme du jour | Depuis Supabase | Non pertinent (hors hospit) |
| Alertes craving → staff | Envoyées à l'équipe | Non (autonome) |
| Connexion internet | Requise | Non requise |

---

## 2. Log craving enrichi + agenda

### Signal de craving
Identique au module principal :
- Intensité 1-10
- Courbe d'insight (où suis-je sur la courbe ?)
- Facteurs déclenchants (multi-sélection depuis les stratégies + génériques)
- Durée
- Affichage des stratégies de réponse (actions + contacts)

### Vues de l'historique
- **Jour** : liste des cravings du jour avec détails
- **Semaine** : barres horizontales, 7 jours, intensité max par jour
- **Mois** : calendrier avec points colorés (vert = pas de craving, ambre = modéré, rouge = intense)
- **3 mois** : graphique en ligne, tendance
- **1 an** : graphique en ligne, vue d'ensemble

### Courbe d'évolution
- Axe X = temps, axe Y = intensité
- Ligne de tendance (moyenne mobile sur 7 jours)
- Objectif : que le patient VOIE la progression (l'intensité et la fréquence diminuent avec le temps)

---

## 3. Programme du jour — refonte

### Problèmes identifiés
- Les programmes sont trop rigides (1 programme template par patient)
- Pas adaptatif si polysubstances
- Pas modifiable
- Pas de vue sur plusieurs jours
- Les activités "routine" (repas, traitements) prennent trop de place visuellement

### Solution proposée

#### A. Programme basé sur les groupes réels de l'unité

Les groupes sont **les mêmes pour tout le monde**, sur un roulement de **2 semaines**. La source de vérité devrait être la **table `groupes`** (déjà existante), pas les `programmes` templates.

**Proposition** : Supprimer les `programmes` templates ou les garder uniquement comme base. Le programme du patient est calculé automatiquement :
- Activités de routine (repas, constantes, traitements) = **fixes, affichées en discret**
- Groupes thérapeutiques du jour = **mis en valeur** (depuis la table `groupes`, filtrés par jour de la semaine)
- Entretiens/rendez-vous = **exceptionnels, très visibles** (à créer via l'admin)

#### B. Vue multi-jours
- **Aujourd'hui** (défaut) : timeline verticale actuelle
- **Semaine** : vue calendrier horizontal, 7 jours, avec les groupes
- **2 semaines** : vue calendrier, montre le roulement complet

#### C. Hiérarchie visuelle des activités

| Type | Importance visuelle | Style |
|---|---|---|
| Groupe thérapeutique | **Haute** | Carte colorée, icône, titre en gras |
| Entretien médical | **Haute** | Carte avec bordure indigo, icône stéthoscope |
| Événement exceptionnel | **Très haute** | Carte avec fond coloré + badge "Nouveau" |
| Soin quotidien (constantes, traitement) | Basse | Ligne simple, texte petit, grisé |
| Repas | Très basse | Ligne simple, icône petite, très discret |

---

## 4. Admission patient — simplifications

### Supprimer le champ "substance principale"
- Pas pertinent au moment de l'admission dans l'app
- La substance est dans le dossier médical, pas dans l'app patient
- Si nécessaire, ajouter ultérieurement via l'admin

### Supprimer le champ "programme template"
- Le programme est calculé automatiquement depuis les groupes de la semaine
- Pas besoin de l'assigner manuellement

### Formulaire admission simplifié
| Champ | Obligatoire | Note |
|---|---|---|
| Chambre | Oui | |
| Date de naissance | Oui | Pour le login patient |
| Date d'admission | Auto (aujourd'hui) | |
| Date de sortie prévue | Oui | Défaut J+12 |

Le reste (substance, programme) est géré par le médecin dans le détail patient après admission.

---

## 5. Questions ouvertes pour JC

### Q1 : Roulement des groupes sur 2 semaines
Est-ce que tu peux me fournir le planning type des groupes sur 2 semaines ? (jour, heure, nom du groupe, animateur). Je pourrai les insérer dans la table `groupes` avec une récurrence.

### Q2 : Activités de routine
Les horaires de routine (constantes, repas, traitements) sont-ils les mêmes pour tous les patients et tous les jours ? Si oui, je les hardcode en discret. Si non, on les configure dans l'admin.

### Q3 : Entretiens/rendez-vous individuels
Comment sont planifiés les entretiens médicaux et IDE ? Sont-ils à heures fixes ou variables ? Faut-il un système de rendez-vous dans l'admin ?

### Q4 : App exportée — fréquence de mise à jour
Après la sortie, le patient utilise le fichier HTML autonome. Si on veut qu'il bénéficie de mises à jour (nouvelles fonctionnalités, corrections), il faudrait soit :
- Lui faire re-télécharger le fichier (pas pratique)
- Héberger une version "post-sortie" en ligne (nécessite un login léger)
Quelle approche préfères-tu ?

### Q5 : Données sensibles dans l'export
Le fichier HTML exporté contient l'historique craving (intensité, déclencheurs, dates). Si le patient perd son téléphone, ces données sont accessibles. Est-ce acceptable ou faut-il un mécanisme de protection (PIN local, chiffrement) ?

---

## Plan d'implémentation proposé

### Étape 1 — Simplifier l'admission (rapide)
- Retirer substance + programme du formulaire admin
- Garder chambre + DDN + date sortie

### Étape 2 — Refondre le programme du jour
- Programme basé sur les groupes (table `groupes` avec récurrence)
- Hiérarchie visuelle (routine discret, groupes mis en valeur)
- Vues jour/semaine/2 semaines

### Étape 3 — Agenda craving
- Vues jour/semaine/mois/3 mois/1 an
- Courbe d'évolution avec tendance
- Fonctionne avec Supabase (principal) ET localStorage (export)

### Étape 4 — App exportée fonctionnelle
- Clone du module patient avec stockage localStorage
- Embarque les données d'hospitalisation
- Craving log fonctionnel + modification stratégies
- Fiches traitements embarquées

### Étape 5 — Vue multi-jours du programme
- Calendrier semaine et 2 semaines
- Navigation entre les jours
