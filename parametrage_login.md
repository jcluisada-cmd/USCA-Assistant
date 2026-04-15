# Paramétrage Login — Spécification pour implémentation future

## Concept

Remplacer les 3 modules séparés (Soignant / Patient / Admin) par un **point d'entrée unique** avec un écran de paramétrage qui détecte le type d'utilisateur et redirige vers le bon module.

L'utilisateur ne se connecte **qu'une seule fois**. Sa session persiste jusqu'à déconnexion explicite ou expiration.

---

## Parcours utilisateur

### Premier lancement (pas de session)

```
┌─────────────────────────────────┐
│       USCA Connect              │
│   Pitié-Salpêtrière             │
│                                 │
│   [Se connecter]                │
│                                 │
│   Première visite ?             │
│   [Paramétrer mon accès]        │
└─────────────────────────────────┘
```

**"Paramétrer mon accès"** ouvre un formulaire adaptatif :

```
┌─────────────────────────────────┐
│  Vous êtes :                    │
│                                 │
│  ○ Patient hospitalisé          │
│  ○ Soignant / Externe           │
│  ○ Personnel permanent (admin)  │
│                                 │
│  [Continuer]                    │
└─────────────────────────────────┘
```

Selon le choix, le formulaire de login s'adapte.

---

## 3 types de login

### A. Patient hospitalisé

| Champ | Valeur |
|---|---|
| Numéro de chambre | ex: 312 |
| Date de naissance | ex: 15/06/1985 |

- **Vérification** : SELECT dans Supabase `patients` (chambre + DDN + date_sortie >= aujourd'hui)
- **Persistance** : `localStorage` — la session dure tout le séjour
- **Expiration** : automatique à `date_sortie_prevue` du patient
- **Module affiché** : Interface Patient (programme, craving, stratégies, traitements, ateliers)
- **Pas de Supabase Auth** — vérification directe en BDD

### B. Soignant / Externe (accès Toolbox sans admin)

Deux options d'accès :

**Option 1 — Identifiants génériques par profil :**

| Profil | Identifiant | Mot de passe |
|---|---|---|
| Externe | `externe` | `psl.addicto.externe` |
| Interne | `interne` | `psl.addicto.interne` |
| IDE | `ide` | `psl.addicto.ide` |

- **Vérification** : comparaison locale (les identifiants génériques sont hardcodés, hashés SHA-256)
- **Pas de Supabase Auth** — c'est juste un verrou d'accès, pas un compte nominatif
- **Persistance** : `localStorage` — reste connecté 6 mois
- **Module affiché** : Toolbox soignant (protocoles, scores, interactions, ELSA, fiches traitements)
- **Pas d'accès admin** — lecture seule de la Toolbox

**Option 2 — Sans login (mode actuel) :**
On peut garder un accès "invité" à la Toolbox sans login pendant la phase de transition, avec un bandeau "Connectez-vous pour une expérience personnalisée".

### C. Personnel permanent (admin)

| Champ | Valeur |
|---|---|
| Email | prenom.nom@aphp.fr |
| Mot de passe | personnel |

- **Vérification** : Supabase Auth (email + mot de passe → JWT)
- **Persistance** : `localStorage` — session de 1 mois. PIN lock après 1h d'inactivité.
- **Module affiché** : Toolbox + Dashboard admin (patients, alertes, groupes, prescriptions, config)
- **RBAC** : selon `profiles.role` (admin, medecin, ide) → modules visibles différents

---

## Persistance des sessions

### Où est stockée la session ?

| Donnée | Stockage | Survit au push ? |
|---|---|---|
| Type d'utilisateur (patient/soignant/admin) | `localStorage` | ✅ Oui |
| Session patient (id, prénom, chambre) | `localStorage` | ✅ Oui |
| Identifiant générique soignant | `localStorage` | ✅ Oui |
| JWT Supabase (admin) | `localStorage` (géré par Supabase SDK) | ✅ Oui |
| PIN hashé (admin) | `localStorage` | ✅ Oui |
| Thème clair/sombre | `localStorage` | ✅ Oui |

**Pourquoi ça survit au push ?** Le `localStorage` est propre au navigateur de l'utilisateur, stocké sur son appareil. Un `git push` + déploiement Cloudflare ne touche que les fichiers statiques servis par le serveur — jamais le storage local du navigateur. La seule chose qui peut invalider le cache est un changement de `CACHE_NAME` dans le Service Worker, mais ça ne touche pas le `localStorage`.

### Flux au lancement (session existante)

```
Ouverture de l'app
  → Lire localStorage('usca_session')
  → Si session existe et non expirée :
      → Charger directement le bon module (pas d'écran de login)
  → Si session expirée ou absente :
      → Afficher l'écran de login/paramétrage
```

Le temps de chargement perçu est quasi nul : l'app lit le `localStorage` (synchrone, < 1ms), puis affiche le bon écran immédiatement.

---

## Structure du localStorage

```javascript
// Clé unique pour toute la session
localStorage.setItem('usca_session', JSON.stringify({
  type: 'patient' | 'soignant' | 'admin',
  
  // Si patient :
  patient_id: 'uuid',
  prenom: 'Jean',
  chambre: '312',
  programme_id: 'uuid',
  substance: 'alcool',
  expires: '2026-04-27',  // = date_sortie_prevue
  
  // Si soignant générique :
  profil: 'externe' | 'interne' | 'ide',
  expires: '2026-10-15',  // 6 mois
  
  // Si admin :
  supabase_managed: true,  // la session JWT est gérée par Supabase
  profile_id: 'uuid',
  nom: 'Dr Luisada',
  role: 'admin',
  modules: ['dashboard', 'alertes', 'groupes', 'config', 'toolbox'],
  
  // Commun
  created_at: '2026-04-15T10:30:00Z',
  theme: 'light' | 'dark'
}));
```

---

## Sécurité des identifiants génériques

Les mots de passe génériques ne doivent pas être en clair dans le code. Solution :

```javascript
// Stockés en SHA-256 dans le code
const GENERIC_ACCOUNTS = {
  externe: 'a1b2c3...hash_sha256...',  // hash de 'psl.addicto.externe'
  interne: 'd4e5f6...hash_sha256...',  // hash de 'psl.addicto.interne'
  ide:     'g7h8i9...hash_sha256...'   // hash de 'psl.addicto.ide'
};

// Vérification
async function verifyGenericLogin(id, password) {
  const hash = await sha256(password);
  return GENERIC_ACCOUNTS[id] === hash;
}
```

Note : ce n'est pas ultra-sécurisé (le hash est dans le code client, reverse-engineerable), mais c'est suffisant pour un verrou d'accès à une Toolbox clinique sans données patient. L'objectif est d'éviter l'accès accidentel, pas de protéger des secrets.

---

## Changements architecturaux nécessaires

### Fichiers à modifier

| Fichier | Changement |
|---|---|
| `index.html` | Remplacer les 3 cartes par un écran de login unifié + détection session |
| `shared/auth.js` | Ajouter `verifyGenericLogin()`, unifier la gestion de session |
| `staff/index.html` | Supprimer le lien retour accueil (l'accueil c'est le module) |
| `patient/index.html` | Supprimer l'écran de login interne (géré par l'accueil) |
| `admin/index.html` | Supprimer l'écran de login interne (géré par l'accueil) |

### Fichiers inchangés

| Fichier | Raison |
|---|---|
| `staff/toolbox.html` | Contenu identique, juste le wrapper change |
| `shared/supabase.js` | CRUD identiques |
| `fiches-traitements/*` | Fiches identiques |
| Tables Supabase | Aucun changement de schéma |

---

## Plan d'implémentation

### Phase 1 — Login unifié (sans casser l'existant)
1. Créer le formulaire de login adaptatif dans `index.html`
2. Implémenter la détection de session au lancement
3. Router vers le bon module selon le type de session
4. Garder les modules fonctionnels tels quels

### Phase 2 — Identifiants génériques soignants
1. Générer les hashes SHA-256 des mots de passe génériques
2. Implémenter `verifyGenericLogin()` dans `auth.js`
3. Tester le flux externe → Toolbox

### Phase 3 — Expiration et nettoyage
1. Vérifier l'expiration de session au lancement
2. Nettoyer le `localStorage` à la déconnexion
3. Expiration automatique pour les patients (date de sortie)

### Phase 4 — Transition progressive
1. Ajouter un bandeau dans la Toolbox "Connectez-vous pour personnaliser"
2. Désactiver progressivement l'accès sans login
3. Communiquer les identifiants génériques à l'équipe

---

## Questions ouvertes (à décider avec JC)

1. **Accès invité** : Garder un accès Toolbox sans login en parallèle pendant la transition ?
2. **Identifiants génériques** : Les mots de passe proposés (`psl.addicto.externe`) conviennent ? Faut-il les changer régulièrement ?
3. **Tablettes partagées** : Si une tablette de service est utilisée par patients ET soignants, comment gérer le changement de profil ? (bouton "Changer d'utilisateur" ?)
4. **Notifications** : Les soignants admin reçoivent-ils des notifications même quand l'app n'est pas ouverte ? (Push notifications = Phase 8, nécessite un Service Worker enrichi)
