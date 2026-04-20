# Toolbox — Carte « Ressources » (spec à coder)

> Spec rédigée le 20 avril 2026 — à implémenter dans une prochaine session.
> Référencée depuis `CLAUDE.md` §7. Lire ce fichier uniquement quand on attaque le chantier.

---

## 1. OBJECTIF

Ajouter une carte **« Ressources »** dans le hub `Protocoles USCA` de la Toolbox soignant (`staff/toolbox.html`), destinée à centraliser :
- résumés d'articles scientifiques (PubMed, revues),
- fiches pratiques imprimables (système étoilé, aides-mémoire),
- recommandations officielles (HAS, SFA, NICE),
- algos / arbres décisionnels à terme.

Pas de duplication avec les 20 fiches traitements patient déjà existantes.

---

## 2. DOSSIER DES RESSOURCES

Les fichiers sont stockés dans **`ressources_doc/`** à la racine du repo. Format accepté :
- **PDF** (aujourd'hui) — fiches imprimables, articles synthétisés,
- **HTML** (long terme) — quand la ressource mérite d'être responsive / interactive (recos HAS longues, algos cliquables).

Règle de format :
| Type | Format recommandé | Raison |
|---|---|---|
| Fiche pratique imprimable (ex. `benzodiazepines_etoiles_print_A4.pdf`) | **PDF** | Format conçu pour l'affichage en salle de soin. |
| Résumé d'article (ex. `INCAS_resume_clinique.pdf`) | PDF aujourd'hui, **HTML à terme** | Un HTML permet liens internes vers la Toolbox (fiche MPH, score ASRS…). |
| Reco HAS / SFA longue | **HTML** | Ancres, recherche, dark mode, mobile-first. |
| Algo / arbre décisionnel | **HTML** interactif | Cliquable > image statique. |

Convention nommage : `ressources_doc/<thematique>_<titre-court>.<ext>` en kebab-case si besoin. Pas de caractère spécial dans le nom de fichier.

---

## 3. HIÉRARCHISATION — par TYPE de document

La carte « Ressources » ouvre une vue avec **3 accordions** :

```
📚 Ressources
├── 📑 Fiches pratiques          ← aides-mémoire quotidiens
├── 🧪 Résumés d'articles         ← evidence-based, veille
└── 📘 Recommandations            ← HAS, SFA, NICE
```

4e accordion possible plus tard : **🧩 Algos / arbres décisionnels**.

### Raison du découpage par type plutôt que par thème
- Usage clinique différent (fiche = ouvrir en vitesse, article = lire au calme, reco = référence lente).
- Scalable à 50 ressources sans réorganisation.
- Une ressource transversale (INCAS = TUS + TDAH) n'a pas besoin d'être dupliquée.

Pour retrouver vite « tout sur les BZD », on affiche un **tag thématique coloré** sur chaque ligne.

---

## 4. AFFICHAGE D'UNE LIGNE

```
┌──────────────────────────────────────────────────┐
│ 🧪  INCAS — TUS + TDAH comorbide          [TDAH] │
│     Brynte et al. · Eur Neuropsychopharm · 2026   │
└──────────────────────────────────────────────────┘
         ↓ clic → ouvre le PDF / HTML (nouvel onglet)
```

Champs :
- **icône** (📑 / 🧪 / 📘 / 🧩) — redondante avec l'accordion mais renforce le type,
- **titre** — texte court, une ligne,
- **métadonnées** — pour un article : auteur + journal + année. Pour une fiche : version ou date de mise à jour. Pour une reco : organisme + année.
- **tag thématique** — pastille colorée à droite. Liste fermée (voir §5).

### Tri
- Au sein de chaque accordion : **date décroissante** (plus récent en haut).
- Fallback alpha pour les ressources sans date.

---

## 5. TAGS THÉMATIQUES

Liste fermée (à figer lors du codage) :

| Tag | Couleur indicative |
|---|---|
| `OH` (alcool) | rouge `#EF4444` |
| `BZD` | violet `#A855F7` |
| `Opioïdes` / `TSO` | orange `#F97316` |
| `TDAH` | indigo `#4F46E5` |
| `TSPT` | bleu `#3B82F6` |
| `Humeur` (dépression, bipo) | émeraude `#10B981` |
| `Cannabis` | vert olive `#65A30D` |
| `Stimulants` (cocaïne, MDMA, etc.) | rose `#EC4899` |
| `Polyconso` | gris ardoise `#64748B` |
| `Général` (transversal) | slate `#94A3B8` |

Le tag est purement visuel, pas un filtre cliquable en v1. Filtre à prévoir quand la liste dépassera ~15 entrées.

---

## 6. OUVERTURE — format paysage géré nativement

**Règle** : ouvrir toutes les ressources en `target="_blank"`.

| Plateforme | Comportement | Verdict |
|---|---|---|
| **PC (navigateur)** | Nouvel onglet → viewer PDF intégré du navigateur, zoom molette, impression Ctrl+P. | ✅ Nickel, écran déjà en paysage. |
| **Mobile navigateur** (Safari iOS, Chrome Android) | Nouvel onglet → viewer natif → rotation auto si l'utilisateur tourne le téléphone. | ✅ Aucune contrainte de `manifest.json`. |
| **Mobile PWA installée** | Le clic sort temporairement de la PWA vers Safari/Files, le viewer natif respecte la rotation. Retour à l'app d'un swipe. | ✅ **Ne pas toucher `manifest.json`** (reste `"orientation": "portrait"`). |

### Solutions écartées (et pourquoi)
- `orientation: any` dans le manifeste → casserait les autres vues mobiles (dashboard, planning) qui sont designées portrait.
- `screen.orientation.lock('landscape')` → pas supporté sur iOS Safari.
- Iframe plein écran avec rotation CSS → UX dégradée, non cross-platform.

---

## 7. IMPLÉMENTATION — pistes techniques

### Structure dans `staff/toolbox.html`
- Nouvelle const `RESSOURCES` : tableau d'objets `{ type, titre, meta, tag, fichier, date }`.
- Nouveau composant React `RessourcesView({onBack})` — même pattern que `ELSAFichesView`.
- Dans `ProtocolesHub` : ajouter l'entrée `{l:"Ressources", desc:"Articles, fiches, recos", i:I.book, v:"ressources", c:C.t[500]}`.
- Nouvelle route `case "ressources": return <RessourcesView onBack={()=>nav("protocoles_hub")}/>;`.
- Ajouter `"ressources"` à `protoViews`.

### Exemple d'entrée
```js
const RESSOURCES = [
  {
    type: "fiche",
    titre: "Benzodiazépines — système étoilé",
    meta: "Fiche pratique USCA · 2026",
    tag: "BZD",
    fichier: "../ressources_doc/benzodiazepines_etoiles_print_A4.pdf",
    date: "2026-03-04"
  },
  {
    type: "article",
    titre: "INCAS — Prédicteurs de succès TUS + TDAH",
    meta: "Brynte et al. · Eur Neuropsychopharm · 2026",
    tag: "TDAH",
    fichier: "../ressources_doc/INCAS_resume_clinique.pdf",
    date: "2026-04-20"
  }
];
```

### Lien d'ouverture
```jsx
<a href={r.fichier} target="_blank" rel="noopener noreferrer" className="card card-tap" ...>
  ...
</a>
```

### Service Worker — à surveiller
Les PDFs dans `ressources_doc/` seront automatiquement récupérés au fil des clics. **Ne PAS les pré-cacher** via `LOCAL_ASSETS` dans `sw.js` (poids cumulé > 1 Mo rapidement). Stratégie actuelle cache-first les mettra quand même en cache à la première ouverture — acceptable.

Incrémenter `CACHE_NAME` à la livraison (usca-v3.84 → v3.85).

---

## 8. CHECKLIST DE LIVRAISON

- [ ] Créer const `RESSOURCES` + composant `RessourcesView` dans `staff/toolbox.html`.
- [ ] Ajouter la carte dans `ProtocolesHub` et la route dans `renderContent()`.
- [ ] Ajouter `"ressources"` à `protoViews`.
- [ ] Intégrer les 2 PDFs déjà présents (`benzodiazepines_etoiles_print_A4.pdf`, `INCAS_resume_clinique.pdf`).
- [ ] Tester desktop (Chrome/Firefox) : clic → nouvel onglet avec PDF.
- [ ] Tester mobile (iOS Safari + Chrome Android) : rotation auto dans le viewer natif.
- [ ] Bumper `CACHE_NAME` dans `sw.js`.
- [ ] Mettre à jour `CLAUDE.md` §6 (Toolbox Accueil) + §8 (tableau) + retrait de la todo.
- [ ] Archiver la session dans `CLAUDE_ARCHIVE.md`.
- [ ] Commit + push.

---

## 9. QUESTIONS OUVERTES (à trancher en session de code)

1. **Libellé du bouton dans le hub** : "Ressources" (court) ou "Ressources documentaires" (explicite) ?
2. **Icône React** dans `I.*` : utiliser `I.book` s'il existe, sinon ajouter une icône `bookOpen` à la librairie SVG interne de `toolbox.html`.
3. **Badge « Nouveau »** automatique sur les ressources ajoutées depuis < 30 jours ? Pratique pour signaler la veille scientifique.
4. **Accordion vide (Recommandations)** : afficher un placeholder « Bientôt… » ou masquer l'accordion tant qu'il est vide ?
