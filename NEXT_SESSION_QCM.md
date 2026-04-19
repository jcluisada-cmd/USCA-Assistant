# USCA Connect — Session prochaine : Module QCM EDN + Dashboard Externe

> Document de briefing pour Claude Code
> Rédigé le 19 avril 2026 — mis à jour après génération complète des données

---

## 1. CONTEXTE

Les **477 questions QCM** (EDN Psychiatrie-Addictologie) sont disponibles
sous forme de **fichiers JSON individuels par item**, dans le dossier :

```
C:\Users\jclui\OneDrive\Documents\GitHub\USCA-Assistant\data\
```

### Structure actuelle du dossier data/

```
data/
├── index.json        ← Catalogue de tous les items (à charger en premier)
├── item_01.json      ← 10 questions
├── item_64.json      ← 30 questions
├── item_65.json      ← 20 questions
├── item_66a.json     ← 35 questions
├── item_66b.json     ← 15 questions
├── item_66c.json     ← 20 questions
├── item_67.json      ← 20 questions
├── item_68.json      ← 15 questions
├── item_69.json      ← 15 questions
├── item_70.json      ← 10 questions
├── item_71.json      ← 15 questions
├── item_72.json      ← 20 questions
├── item_73.json      ← 15 questions
├── item_74.json      ← 25 questions
├── item_75.json      ← 15 questions
├── item_76.json      ← 57 questions (Lot 5 fusionné 5A+5B)
├── item_77.json      ← 30 questions (Lot 5 fusionné 5A+5B)
├── item_78.json      ← 40 questions
├── item_79.json      ← 15 questions
├── item_80.json      ← 10 questions
├── item_110.json     ← 15 questions
├── item_138.json     ← 10 questions
└── item_353.json     ← 20 questions
```

**Total : 23 items — 477 questions**

### Structure de index.json

```json
{
  "version": "1.0",
  "generated": "2026-04-19",
  "total_questions": 477,
  "total_items": 23,
  "items": [
    {
      "item": "Item 76",
      "domaine": "Addiction à l'alcool",
      "fichier": "item_76.json",
      "nb_questions": 57
    }
  ]
}
```

### Structure d'une question (dans chaque item_XX.json)

```json
{
  "item": "Item 76",
  "domaine": "Addiction à l'alcool",
  "question_numero": 1,
  "question": "[Item 76] Question 1 - Facile : ...",
  "type": "qcm",
  "reponses": [
    {"lettre": "A", "texte": "...", "correct": false},
    {"lettre": "B", "texte": "...", "correct": true},
    {"lettre": "C", "texte": "...", "correct": false},
    {"lettre": "D", "texte": "...", "correct": false}
  ],
  "explication": "... (Source EDN Item 76)",
  "difficulte": 1,
  "source": "EDN Item 76"
}
```

**Règle difficulté :** 1 = Facile (Q1-2), 2 = Moyen (Q3-4), 3 = Difficile (Q5+)

---

## 2. ARCHITECTURE CIBLE — DASHBOARD PAR RÔLE

Chaque rôle a son propre dashboard. Ne jamais mélanger.

| Rôle | Dashboard | Module pédagogique |
|---|---|---|
| `etudiant_ide` | Livret IDE (inchangé, déjà son dashboard) | — |
| `externe` | `extern/index.html` (nouveau) | QCM EDN |
| `ide` | `admin/index.html` + carte "Mes élèves" | — |
| `medecin` | `admin/index.html` + carte "Mes élèves" | — |
| `admin` | `admin/index.html` + carte "Mes élèves" | Supervision des deux |

### Ce que voit l'externe sur son dashboard

1. **Chambres** — vue lecture seule des patients hospitalisés
   (même data que le dashboard soignant, mais sans actions)
2. **Mon QCM EDN** — filtre par item / difficulté / mode
3. **Mes signalements** — historique des flags envoyés au tuteur

### Ce que contient la carte "Mes élèves" (admin/medecin/ide)

```
▼ Mes élèves                     ← accordion REPLIABLE (à implémenter)

  ▼ Étudiantes IDE
    └── [Prénom] : avancement livret, compétences validées, alertes

  ▼ Externes
    └── [Prénom] : % QCM par item, signalements en attente, score global
```

**Important :** cette carte existe déjà dans admin/index.html mais
elle n'est PAS encore en accordion repliable. Il faut l'encapsuler.

---

## 3. NOUVELLES TABLES SUPABASE — MIGRATION v15

À exécuter dans `migrations/supabase-migration-v15.sql` :

```sql
-- Lien tuteur / apprenant
CREATE TABLE tuteur_etudiant (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tuteur_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  etudiant_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('externe', 'etudiant_ide')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tuteur_id, etudiant_id)
);

-- Sessions QCM (une session = une série de questions jouées)
CREATE TABLE qcm_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  item TEXT,                    -- NULL = mode multi-items
  mode TEXT NOT NULL CHECK (mode IN ('entrainement', 'examen')),
  nb_questions INTEGER NOT NULL,
  score INTEGER NOT NULL,       -- nombre de bonnes réponses
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Réponses individuelles par question
CREATE TABLE qcm_reponses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES qcm_sessions(id) ON DELETE CASCADE NOT NULL,
  question_source TEXT NOT NULL,  -- "Item 76 - Q12" (identifiant stable)
  reponse_choisie TEXT NOT NULL,  -- "A", "B", "C" ou "D"
  correct BOOLEAN NOT NULL,
  temps_ms INTEGER,               -- temps de réponse en ms (optionnel)
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Signalements de questions (erreur ou demande d'explication)
CREATE TABLE qcm_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_source TEXT NOT NULL,  -- "Item 76 - Q12"
  type TEXT NOT NULL CHECK (type IN ('erreur_question', 'demande_explication')),
  message TEXT,
  statut TEXT NOT NULL DEFAULT 'ouvert' CHECK (statut IN ('ouvert', 'traite')),
  tuteur_reponse TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  traite_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE tuteur_etudiant ENABLE ROW LEVEL SECURITY;
ALTER TABLE qcm_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE qcm_reponses ENABLE ROW LEVEL SECURITY;
ALTER TABLE qcm_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_tutor" ON tuteur_etudiant FOR ALL USING (
  auth.uid() = tuteur_id OR auth.uid() = etudiant_id
);
CREATE POLICY "own_sessions" ON qcm_sessions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "own_reponses" ON qcm_reponses FOR ALL USING (
  session_id IN (SELECT id FROM qcm_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "own_flags" ON qcm_flags FOR ALL USING (auth.uid() = user_id);
```

---

## 4. NOUVEAUX FICHIERS À CRÉER

```
USCA-Assistant/
├── data/
│   ├── index.json               ← EXISTE (ne pas modifier)
│   └── item_*.json              ← EXISTENT (ne jamais modifier)
├── extern/
│   └── index.html               ← NOUVEAU — dashboard externe
└── shared/
    └── qcm-engine.js            ← NOUVEAU — moteur QCM partagé
```

### shared/qcm-engine.js — responsabilités

**Principe : chargement à la demande (lazy loading)**
- Charger `index.json` au démarrage (léger — catalogue seul)
- Charger `item_XX.json` uniquement quand l'item est sélectionné
- Ne jamais charger tous les items en mémoire simultanément

```javascript
// Exemple d'API attendue
await QCMEngine.loadIndex()          // charge data/index.json
await QCMEngine.loadItem('Item 76')  // charge data/item_76.json
QCMEngine.getQuestions({ item, difficulte, mode, n })
QCMEngine.saveSession(session)       // Supabase
QCMEngine.flagQuestion(question_source, type, message)
```

**Fonctions à implémenter :**
- Chargement `index.json` + `item_XX.json` à la demande
- Filtrage par item / difficulté / mode (entraînement ou examen)
- Tirage aléatoire ou séquentiel
- Scoring et stockage session dans Supabase (`qcm_sessions` + `qcm_reponses`)
- Gestion des signalements (`qcm_flags`)

**Nom du fichier item :** convertir "Item 66a" → `item_66a.json`
(règle : `"Item " + num` → `"item_" + num.toLowerCase() + ".json"`)

### extern/index.html — structure des cartes

1. **En-tête** : nom de l'externe, service, tuteur assigné
2. **Chambres** (lecture seule) : liste patients, chambre, DDN masquée,
   substance principale, date sortie prévue — PAS d'actions
3. **Mon QCM EDN** : sélecteur item (depuis index.json), difficulté, mode,
   puis lancement session
4. **Mes signalements** : liste des flags avec statut et réponse tuteur

---

## 5. MODIFICATIONS DE FICHIERS EXISTANTS

### admin/index.html

- [ ] Encapsuler la carte "Mes élèves" en accordion repliable
      (même pattern que les autres accordions du dashboard)
- [ ] Dans la sous-section "Externes" : afficher % QCM par item,
      score global, signalements en attente
- [ ] Dans la sous-section "Étudiantes IDE" : inchangé (déjà existant)

### staff/toolbox.html

- [ ] **Retirer** la carte/section "Livret IDE" (redondante)
      Le livret EST le dashboard etudiant_ide, pas une feature Toolbox

### sw.js

- [ ] Incrémenter CACHE_NAME à chaque modification
- [ ] Ajouter `data/index.json` dans les assets mis en cache (cache-first)
- [ ] Ne PAS précacher les 23 item_*.json — ils seront cachés dynamiquement
      au premier chargement par l'utilisateur (stratégie stale-while-revalidate)

---

## 6. RÈGLES ABSOLUES À RESPECTER

- ❌ Ne jamais réécrire un fichier en entier — éditions chirurgicales uniquement
- ❌ Ne jamais modifier les fichiers `data/item_*.json` ni `data/index.json`
- ❌ Ne jamais exposer les bonnes réponses côté serveur (le JSON est public,
     c'est acceptable pour un usage interne hospitalier)
- ✅ Incrémenter sw.js CACHE_NAME à chaque déploiement
- ✅ Mobile-first, Tailwind CDN, pas de bundler
- ✅ Push via GitHub Desktop → Cloudflare Pages redéploie en ~30s

---

## 7. ORDRE D'EXÉCUTION RECOMMANDÉ

1. Lire ce fichier en entier ✅
2. Vérifier que `data/index.json` est présent et liste bien 23 items / 477 questions
3. Spot-check : ouvrir `data/item_76.json` et vérifier que les accents sont corrects
4. Exécuter la migration v15 dans Supabase
5. Créer `shared/qcm-engine.js`
6. Créer `extern/index.html`
7. Modifier `admin/index.html` (accordion "Mes élèves")
8. Modifier `staff/toolbox.html` (retrait livret)
9. Incrémenter sw.js → commit → Push !
