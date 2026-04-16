# USCA Connect — Document de référence unique

> Dernière mise à jour : 16 avril 2026 (session soir)
> Fusionne : INSTRUCTIONS_PROJET.md, PLAN_V2.md, SPEC_PATIENT_V3.md, PROJECT_PENDING.md, parametrage_login.md, fix-auth-complete.md, DEPLOY.md

---

## 1. IDENTITÉ & CONTEXTE

**USCA Connect** est la plateforme numérique de l'**USCA** (Unité de Soins Complexes en Addictologie) et de l'**ELSA** (Équipe de Liaison et de Soins en Addictologie) de l'hôpital **Pitié-Salpêtrière** (AP-HP, Paris).

Développeur principal : **Dr JC Luisada**, psychiatre addictologue à l'USCA.

| Application | Public | Fonction |
|---|---|---|
| **USCA Toolbox** (V1 — intégrée) | Soignants | Protocoles sevrage, scores, interactions, checklist séjour, fiches ELSA |
| **Unité Connect** (V2 — en production) | Soignants + Patients | Coordination : programme patient, alertes craving, groupes, permissions, stratégies, export PDF |

---

## 2. INFRASTRUCTURE

| Élément | Valeur |
|---|---|
| **Repo GitHub** | https://github.com/jcluisada-cmd/USCA-Assistant |
| **URL production** | https://usca-connect.pages.dev |
| **Hébergement** | Cloudflare Pages (auto-deploy sur `git push main`) |
| **BDD & Auth** | Supabase — pydxfoqxgvbmknzjzecn.supabase.co |
| **Service Worker** | usca-v3.39 |
| **Client Git** | GitHub Desktop |
| **Chemin local** | `C:\Users\jclui\OneDrive\Documents\GitHub\USCA-Assistant\` |
| **Mot de passe staff commun** | `usca_c15` |

### Charte graphique V2
| Rôle | Couleur | Hex |
|---|---|---|
| Primaire (actions, navigation) | Indigo | `#4F46E5` |
| Succès / validation | Émeraude | `#10B981` |
| Alerte / urgence | Rouge | `#EF4444` |
| Fond | Slate | `#F8FAFC` |

> La Toolbox V1 intégrée en iframe conserve sa palette navy/teal existante.

### Stack technique
- HTML5 + Tailwind CSS via CDN (`@tailwindcss/browser@4`) — mobile-first
- Supabase SDK via CDN UMD (`@supabase/supabase-js@2`) — attaché à `window.supabase`
- jsPDF via CDN — génération PDF côté client
- React 18 + Babel in-browser (Toolbox V1 uniquement, dans l'iframe)
- PWA installable (manifest.json + service worker)
- Pas de bundler, pas de npm, pas de build

### Installation PWA sur téléphone
- **Android** : Chrome → menu (⋮) → "Ajouter à l'écran d'accueil"
- **iPhone** : Safari → bouton partage (↑) → "Sur l'écran d'accueil"
- L'app s'ouvre en plein écran et fonctionne hors-ligne (données cliniques)

---

## 3. ARCHITECTURE DES FICHIERS

```
USCA-Assistant/
├── index.html                  ← Login unifié Patient / Soignant
├── patient/
│   └── index.html              ← Interface patient (8 cartes)
├── admin/
│   └── index.html              ← Dashboard soignant (Patients, Toolbox, Planning)
├── staff/
│   ├── index.html              ← Dashboard staff (redirige vers admin pour l'instant)
│   └── toolbox.html            ← V1 Toolbox extraite (iframe dans admin)
├── shared/
│   ├── supabase.js             ← Client Supabase + CRUD helpers
│   ├── auth.js                 ← Gestion session, login/logout
│   ├── planning-groupes.js     ← Planning semaine A+B + réunions (source unique patient/soignant)
│   ├── craving-agenda.js       ← Composant agenda craving (vues semaine/mois/3mois/1an)
│   ├── fiches-catalogue.js     ← Catalogue des 20 fiches traitements
│   ├── theme.css               ← Variables CSS dark mode
│   └── theme.js                ← Toggle dark mode
├── functions/
│   └── api/
│       └── delete-user.js      ← Cloudflare Function proxy suppression compte
├── fiches-traitements/
│   └── fiche_*.html            ← 20 fiches patient par médicament
├── affiche-equipe.html         ← Affiche A4 imprimable avec QR code
├── icon-512.png                ← Icône app (phénix + poignée de main)
├── splash.png                  ← Splash screen
├── manifest.json               ← Manifeste PWA
├── sw.js                       ← Service Worker multi-pages
└── supabase-migration-v*.sql   ← Scripts migrations (v1 à v11, toutes exécutées)
```

---

## 4. AUTHENTIFICATION

### Deux parcours distincts

| Parcours | Comment | Persistance |
|---|---|---|
| **Patient** | Chambre + date naissance → vérification BDD | localStorage, 30 jours |
| **Soignant** | prenom.nom + mot de passe → Supabase Auth (email @aphp.fr) | localStorage, session Supabase |

- Admin : champ `is_admin` boolean séparé du rôle métier
- Mode dev : triple-tap sur le logo
- Auto-redirect si session existante
- Splash screen au chargement

### Rôles métier
`medecin`, `ide`, `psychologue`, `pharmacien`, `secretaire`, `externe`, `etudiant_ide`

Admin UUID JC : `d3ad2d4b-d3d8-41f8-a494-b7bf55b79e87` (jc.luisada@gmail.com, role=medecin, is_admin=true)

---

## 5. BASE DE DONNÉES SUPABASE

### Tables principales
- `profiles` — Profils soignants (id, email, nom, role, is_admin, modules_actifs)
- `patients` — Patients hospitalisés (chambre, DDN, admission, sortie prévue)
- `alertes` — Alertes craving/effet_indesirable/urgence/demande (patient_id, type, intensité, statut)
- `strategies` — Stratégies de prévention patient (5 catégories Marlatt)
- `evenements` — Événements (patient_id nullable : individuels + équipe). Types : entretien, consultation, familial, rdv_externe, reunion, staff, labo, supervision
- `permissions_sortie` — Demandes de permission (statut, date/heure sortie/retour, motif)
- `messages` — Contenus partagés par le soignant (notes, liens, consignes)
- `fiches_traitements_patient` — Fiches traitements prescrites (checklist)

### Tables groupes (migrations v6-v7)
- `groupe_animateurs` — Soignants désignés animateurs (groupe_slug, user_id)
- `groupe_modifications` — Modifications par date (annulation, changement heure, exclusions, horaires_individuels JSONB)
- `groupe_rappels` — Rappels envoyés par l'animateur

### Tables participations et demandes (migrations v9-v10)
- `participations` — Présences/absences aux groupes (patient ou animateur)
- `demandes_seances` — Demandes de séances thérapies complémentaires (en_attente/acceptee/refusee)

### Tables auth et réunions (migrations v8, v11)
- `device_tokens` — Appareils de confiance soignants (auto-login 90j)
- `presences_reunions` — Présences aux réunions staff (médecins)

### Migrations exécutées
- v1 : Schéma initial (profiles, patients, alertes, programmes, groupes)
- v2 : Stratégies, permissions, messages, fiches traitements
- v3 : Evenements
- v4 : Ajustements RLS
- v5 : CASCADE sur alertes et stratégies (suppression patient)
- v6 : Tables groupes (animateurs, modifications, rappels)
- v7 : Horaires individuels (JSONB dans groupe_modifications)
- v8 : Appareils de confiance (device_tokens)
- v9 : Participations aux groupes
- v10 : Demandes de séances thérapies complémentaires
- v11 : Événements d'équipe (patient_id nullable) + présences réunions

---

## 6. ÉTAT ACTUEL — CE QUI FONCTIONNE

### Login unifié (index.html)
- ✅ Onglets Patient / Soignant
- ✅ Auto-redirect si session existante, login unique (pas de double login)
- ✅ Mode dev admin (triple-tap logo)
- ✅ Splash screen, bannière WebView iOS
- ✅ Date de naissance patient : auto-formatage JJ/MM/AAAA (clavier numérique)
- ✅ Messages d'erreur auth précis (réseau/identifiants/rate-limit)

### Module Patient — 9 cartes + feedback
- ✅ **J'ai un craving** : intensité 1-10, courbe d'insight, déclencheurs, durée, stratégies
- ✅ **Mon journal** : agenda craving (semaine/mois/3mois/1an), courbe tendance, stats
- ✅ **Programme** : timeline, navigation date, routine, groupes semaine A+B colorés, badge semaine A/B, horaires individuels, boutons Présent/Absent sur chaque groupe, bouton "Demander une séance" sur thérapies complémentaires
- ✅ **Mes stratégies** : plan prévention guidé (5 catégories Marlatt), section éducative
- ✅ **Traitements** : fiches prescrites, 20 fiches HTML, navigation par catégorie
- ✅ **Permission** : demande sortie (48h max, 20h retour), statut en attente/validée/refusée
- ✅ **Messages** : contenus partagés par le soignant
- ✅ **Ateliers** : navigation date, Présent/Absent par groupe, demande de séance (thérapies complémentaires), historique, stats, animateur/lieu affichés
- ✅ **Mon avis** : feedback structuré sur l'application (email ou copie)
- ✅ **Badges notification** : ronds rouges sur Messages, Traitements, Programme, Ateliers quand il y a du nouveau

### Module Soignant — 3 onglets
- ✅ **Patients** : liste avec badges craving/permission, admission, détail patient (journal craving avec marquage auto traité, fiches traitements, permissions valider/refuser/annuler, événements, voir comme patient, supprimer séjour, export JSON), bouton app vierge
- ✅ **Toolbox** : iframe V1 avec dark mode
- ✅ **Planning** (ex-Groupes) : planning semaine A+B avec toggle, groupes thérapeutiques + animateurs + actions, réunions d'équipe récurrentes (mardi, jeudi), Staff Psychiatrie lundi (médecins, Présent/Absent), événements ponctuels (ajout texte libre + date/heure), badge demandes séances en attente, demandes de séances thérapies complémentaires (accepter/refuser/programmer)

### Gestion comptes (admin)
- ✅ Création, modification rôle/nom, toggle admin
- ✅ Suppression complète (profil + compte Auth via Cloudflare Function)
- ✅ Désignation animateurs pour les groupes (admin peut désigner/retirer n'importe qui)

### App exportée HTML autonome
- ✅ Signal craving + agenda + stratégies modifiables
- ✅ Fiches traitements embarquées
- ✅ PIN local SHA-256, dark mode, export/import JSON
- ✅ Tutoriel au premier lancement
- ✅ Génération version vierge depuis l'admin (consultation)

### Auth avancée
- ✅ Client Supabase robuste (safeStorage, PKCE, autoRefresh)
- ✅ Appareils de confiance (device tokens 90j, max 5, auto-register/révocation)
- ✅ Cloudflare Function suppression compte (`functions/api/delete-user.js`)

### Toolbox Soignant V1
- ✅ 8 modules cliniques : Protocoles, Séjour J1-J12, Scores, Interactions, Comorbidités, ELSA, Admission, Fiches Traitements
- ✅ Dark mode complet (swap palette C)

---

## 7. BUGS CONNUS

| Bug | Sévérité | Statut |
|---|---|---|
| ~~Modals admin ne se ferment pas au clic fond noir~~ | ~~Moyenne~~ | ✅ Corrigé v3.25 |
| ~~Déconnexion patient ne redirige pas vers l'accueil~~ | ~~Basse~~ | ✅ Corrigé v3.25 |
| ~~Suppression de compte Supabase Auth impossible~~ | ~~Haute~~ | ✅ Cloudflare Function créée v3.25 |

---

## 8. PLAN DE DÉVELOPPEMENT — CE QUI RESTE

### Fait — Session 16/04 soir (v3.25 → v3.37)
- [x] **P1** — Bugs corrigés : modals fond noir, déconnexion patient, badge craving, permissions accordion, double login soignant, date naissance mobile, encodage UTF-8
- [x] **P2** — Planning semaine A+B (alternance ISO paire=A/impaire=B), type `seances` (sophrologie cyan)
- [x] **P3** — Ateliers patient (navigation date, Présent/Absent, historique) + participation animateur + demandes séances thérapies complémentaires
- [x] **P4** — Onglet Planning (ex-Groupes) : réunions d'équipe récurrentes, Staff Psychiatrie médecins, événements ponctuels texte libre
- [x] **P6** — App exportée v3 : PIN SHA-256, tutoriel premier lancement, génération version vierge
- [x] **P9** — Auth avancée : messages erreur, safeStorage/PKCE, device tokens, Cloudflare Function suppression, WebView iOS
- [x] Badges notification patient (Messages, Traitements, Programme, Ateliers)
- [x] Carte Feedback patient ("Mon avis sur l'application")
- [x] Désignation animateurs par l'admin + accès actions animateur pour l'admin
- [x] Animateur/lieu affichés dans les ateliers patient

### À faire
- [ ] **P5** — Personnalisation modules soignant (choix des cartes affichées par rôle)
- [ ] **P7** — Ménage technique : supprimer `/staff/index.html` inutile (5 min, zéro impact)
- [ ] **P8** — Post-cure (module HTML de JC) + Annuaire patients
- [ ] UI "Mes appareils de confiance" dans paramètres du compte
- [ ] Tester toutes les nouvelles features en conditions réelles
- [x] Fix bug export app vierge — v3.38 (généré directement dans l'admin, onglet Toolbox)

---

## 9. MODULES CLINIQUES V1 (TOOLBOX)

### Contenu intégré dans staff/toolbox.html (iframe)

| # | Module | Contenu |
|---|---|---|
| M1 | **Protocoles par substance** | 7 substances (alcool, opioïdes, cocaïne/crack, cannabis, BZD, NPS/cathinones, kétamine). Protocoles sevrage, traitements de fond, non pharmaco, red flags |
| M2 | **Séjour J1-J12** | Timeline 3 phases, checklist cochable par jour |
| M3 | **Comorbidités psy** | Diagnostic différentiel, TDAH+addiction, TSPT+addiction |
| M4 | **Interactions** | 18 interactions critiques, sélection multiple |
| M5 | **Admission & Orientation** | Critères USCA + 5 filières de sortie |
| M6 | **ELSA** | 5 fiches réflexes + scores repérage |
| M9 | **Scores** | Cushman, COWS, AUDIT, PHQ-9, GAD-7, convertisseur BZD |

### Pharmacopée
- **Sevrage/maintien** : diazépam, oxazépam, baclofène, acamprosate, naltrexone, nalméfène, topiramate, NAC, méthadone, buprénorphine, disulfirame
- **Psychotropes** : méthylphénidate, lisdexamfétamine, sertraline, venlafaxine, vortioxétine, cyamémazine, chlorpromazine, alimémazine
- **Non pharmaco** : NADA, hypnose, TRV, tDCS

### Règles cliniques
- Toujours préciser **AMM / hors AMM**
- Toujours indiquer le **niveau de preuve** (A, B, C, D)
- Toujours lister les **contre-indications**

---

## 10. SPEC MODULE PATIENT V3 — VISION LONG TERME

### Principe directeur
L'app patient est **tournée vers l'avenir**. Le patient la construit pendant l'hospitalisation mais elle l'accompagne **après la sortie** via l'app exportée.

### Programme du jour — architecture
- **Routine** (repas, constantes, traitements) = hardcodés, affichage discret
- **Groupes thérapeutiques** = depuis `shared/planning-groupes.js`, colorés par type, mis en valeur
- **Événements individuels** = depuis table `evenements`, très visibles
- **Vues** : aujourd'hui (timeline verticale), semaine, 2 semaines (à développer)

#### Hiérarchie visuelle des activités
| Type | Importance | Style |
|---|---|---|
| Groupe thérapeutique | **Haute** | Carte colorée, icône, titre gras |
| Entretien médical | **Haute** | Carte bordure indigo, icône stéthoscope |
| Événement exceptionnel | **Très haute** | Carte fond coloré + badge "Nouveau" |
| Soin quotidien (constantes, traitement) | Basse | Ligne simple, texte petit, grisé |
| Repas | Très basse | Ligne simple, icône petite, très discret |

### Agenda craving — vues détaillées
- **Jour** : liste des cravings avec détails
- **Semaine** : barres horizontales, 7 jours, intensité max/jour
- **Mois** : calendrier avec points colorés (vert=0, ambre=modéré, rouge=intense)
- **3 mois** : graphique en ligne, tendance
- **1 an** : graphique en ligne, vue d'ensemble
- **Courbe** : axe X=temps, Y=intensité, moyenne mobile 7 jours. Objectif : le patient VOIT la progression

### Admission patient — champs simplifiés
| Champ | Obligatoire | Note |
|---|---|---|
| Chambre | Oui | |
| Date de naissance | Oui | Pour le login patient |
| Date d'admission | Auto (aujourd'hui) | |
| Date de sortie prévue | Oui | Défaut J+12 |

Le reste (substance, programme) est géré dans le détail patient après admission.

### App exportée = clone fonctionnel
- Stockage localStorage (pas de serveur)
- Signal craving + agenda + stratégies modifiables
- Fiches traitements embarquées
- PIN local optionnel, dark mode
- Export/import JSON, re-génération HTML

### Questions ouvertes pour JC
1. ~~Planning semaine B~~ → Fait (session 16/04)
2. Entretiens individuels : heures fixes ou variables ? système de rendez-vous ?
3. App exportée : mises à jour post-sortie ? (re-télécharger vs version en ligne)
4. Données sensibles dans l'export : protection suffisante avec PIN SHA-256 ?

---

## 11. SPEC AUTH AVANCÉE (À IMPLÉMENTER — P9)

### Suppression de compte admin
L'app utilise la clé `anon` Supabase (visible dans le code source, droits limités). La suppression de comptes Auth nécessite la `service_role` key (droits complets, jamais côté client).

**Solution** : Cloudflare Pages Function `functions/api/delete-user.js` comme proxy sécurisé :
- L'app envoie la demande + JWT de l'admin
- La Function lit `env.SUPABASE_SERVICE_ROLE_KEY` (variable Cloudflare)
- La Function appelle `DELETE /auth/v1/admin/users/{userId}` sur Supabase
- Transparent pour l'admin

### Appareils de confiance (table `device_tokens`)

```sql
CREATE TABLE device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  token TEXT UNIQUE NOT NULL,
  appareil TEXT DEFAULT 'Appareil inconnu',
  derniere_utilisation TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '90 days'),
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_device_tokens_token ON device_tokens(token);
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "device_tokens_own" ON device_tokens FOR ALL USING (auth.uid() = user_id);
```

- Auto-login 90 jours, max 5 appareils par soignant
- Token 32 bytes (crypto.getRandomValues), détection appareil (iPhone/iPad/Android/Mac/Windows)
- Interface "Mes appareils de confiance" dans paramètres du compte
- Déconnexion = révoque le token de cet appareil

### Messages d'erreur auth précis
Classifier les erreurs : réseau (fetch/Firefox tracking) → identifiants (400) → compte inexistant (404) → rate-limit (429) → serveur (500+). Messages en français.

### Client Supabase robuste
- `safeStorage` : tente localStorage, fallback sessionStorage (Safari restrictif / navigation privée)
- `flowType: 'pkce'` (plus robuste sur Safari)
- `autoRefreshToken: true`

### Détection WebView iOS
Bannière automatique jaune "Ouvrir dans Safari" quand l'app est dans un WebView iOS (QR code scanné depuis l'app caméra). Détection : iOS + pas Safari natif (CriOS/FxiOS/EdgiOS).

### Identifiants génériques soignants (option future)
Accès Toolbox sans compte nominatif, avec hash SHA-256 côté client :
| Profil | Identifiant | Mot de passe | Persistance |
|---|---|---|---|
| Externe | `externe` | `psl.addicto.externe` | 6 mois |
| Interne | `interne` | `psl.addicto.interne` | 6 mois |
| IDE | `ide` | `psl.addicto.ide` | 6 mois |

Note : hash dans le code client = reverse-engineerable, mais suffisant pour un verrou d'accès accidentel. Pas de données patient.

### Structure localStorage session
```javascript
localStorage.setItem('usca_session', JSON.stringify({
  type: 'patient' | 'soignant' | 'admin',
  // Patient : patient_id, prenom, chambre, expires (= date_sortie_prevue)
  // Soignant générique : profil, expires (6 mois)
  // Admin : supabase_managed=true, profile_id, nom, role, modules
  created_at: '2026-04-15T10:30:00Z',
  theme: 'light' | 'dark'
}));
```

### Actions manuelles Supabase (une seule fois pour P9)
1. **Authentication → Settings** : désactiver "Enable email confirmations"
2. **Créer comptes** : Authentication → Users → Add user → cocher "Auto Confirm User"
3. **Cloudflare Pages → Settings → Environment variables** : ajouter `SUPABASE_SERVICE_ROLE_KEY`

### Questions ouvertes login
1. Accès invité Toolbox sans login pendant la transition ?
2. Changer les mots de passe génériques régulièrement ?
3. Tablettes partagées patients/soignants : bouton "Changer d'utilisateur" ?

---

## 12. CONVENTIONS DE DÉVELOPPEMENT

### Général
- **Langue** : français partout (UI, commentaires, données)
- **Mobile-first** : tout doit être utilisable sur smartphone
- **Pas de bundler** : HTML + CDN (Tailwind, Supabase SDK, jsPDF)
- **Pas de données patient nominatives** côté client
- Client Git : GitHub Desktop

### Modifications
1. Lire le fichier avec Read
2. Modifier chirurgicalement avec Edit (pas de réécriture complète)
3. Incrémenter `CACHE_NAME` dans `sw.js` à chaque modif
4. Push via GitHub Desktop → Cloudflare Pages redéploie (~30 sec)

### Règles absolues
- ❌ Ne jamais réécrire un fichier en entier
- ❌ Ne jamais bloquer l'accès soignant avec un login (app déjà distribuée)
- ❌ Ne jamais supprimer de fonctionnalité sans validation de JC
- ❌ Ne jamais exposer la service_role key dans le code client
- ❌ Ne jamais tenter de fetch `raw.githubusercontent.com` (bloqué par le réseau)

### Service Worker — règle critique
À **chaque modification** de fichier servi, incrémenter `CACHE_NAME` dans `sw.js`. Sans ça, les utilisateurs restent sur l'ancienne version en cache. Stratégie : cache-first pour les statiques, network-first pour les appels Supabase (`*.supabase.co`).

### Risques techniques connus
| Risque | Mitigation |
|---|---|
| iframe V1 sur iOS Safari (scroll, hauteur) | `-webkit-overflow-scrolling: touch`, hauteur explicite, `?embedded=true` |
| Reconnexion Realtime (téléphone verrouillé) | Auto-reconnexion Supabase + refresh sur `visibilitychange` |
| Auth patient faible (chambre+DDN) | Rate-limiting client (3 tentatives → 5 min), données limitées, réseau hospitalier |
| Pas de bundler = gros CDN | ~315 KB gzippé, cachés par SW après 1er chargement |

### Contenu clinique — sources de vérité (par priorité)
1. **Référentiel USCA 2.2** et addendum (documents internes)
2. **Recommandations HAS** : TSO, arrêt BZD, TDAH adulte, opioïdes, RdRD, hépatite C
3. **Guidelines SFA** (Société Française d'Alcoologie)
4. **NICE guidelines** (alcool, drogues, TDAH, tabac, gambling, TCA)
5. **Littérature PubMed**

---

## 13. CONTACTS & LIENS

| Quoi | Valeur |
|---|---|
| Repo GitHub | https://github.com/jcluisada-cmd/USCA-Assistant |
| Production | https://usca-connect.pages.dev |
| Email | jc.luisada@gmail.com |
| Supabase | pydxfoqxgvbmknzjzecn.supabase.co |
| Affiche équipe | affiche-equipe.html (A4, QR code) |
