# USCA Connect — Document de référence unique

> Dernière mise à jour : 8 mai 2026 (v4.23 — Fiche EEG en réanimation (6/6 — batch handbook complet).
> 1. **Nouvelle fiche `eeg_ect/fiche_icu_eeg.html`** (~430 lignes) : 10 sections — résumé 4 questions clés (encéphalopathie ? · NCSE ? · pronostic ? · profondeur d'anesthésie ?), encéphalopathie diffuse avec SVG (delta-theta diffus haute amplitude), patterns périodiques ACNS 2021 avec SVG LPDs (anciennement PLEDs · unilatéraux), GPDs (anciennement GPEDs · bilatéraux synchrones), BIPDs (bilatéraux indépendants · pronostic très péjoratif), burst-suppression avec SVG (anesthésie ciblée vs post-anoxie), ondes triphasiques avec SVG (encéphalopathies métaboliques hépatique/urémique), silence électrique cérébral (critère mort cérébrale), continuum ictal-interictal (zone grise + test lorazépam IV), implications ECT (effet cumulatif séances rapprochées), red flags, take home.
> 2. **Vocabulaire ACNS 2021 mis à jour** explicitement dans la fiche (LPDs/GPDs/BIPDs remplacent PLEDs/GPEDs/BIPLEDs) — référence terminologique internationale courante.
> 3. **SVG schématiques** : encéphalopathie, LPDs périodiques, burst-suppression (alternance bursts/suppression), triphasiques (3 phases). Aucune figure du manuel — concepts schématisables.
> 4. **Pattern iframe + ↗** : carte EEG en réanimation ajoutée au case `eeg_ect` (icône activité ardoise foncé `C.n[800]`). **Le bandeau "À venir" est supprimé** — toutes les 6 fiches du batch + Technical sont en place. Le case eeg_ect comprend désormais 8 cartes : 1 Pratique ECT + 7 fiches EEG handbook (Technical, Normal, Sommeil, Artefacts, Épileptiforme, Status, EEG en réanimation).
> 5. **Renommage appliqué** : ICU EEG → "EEG en réanimation" partout (carte Toolbox, titre fiche, header doc-head, sous-titre "Encéphalopathies · LPDs · GPDs · burst-suppression · triphasiques"). Slug fichier `icu_eeg` conservé pour cohérence URL/code.
> 6. **SW bump v4.22 → v4.23** : pré-cache de `fiche_icu_eeg.html`. **Batch handbook complet livré.** Reste TODO 21 : sync dark mode global ↔ iframes (à faire en v4.24).)
>
> v4.22 — Fiche Status epilepticus (5/6 du batch handbook).
> 1. **Nouvelle fiche `eeg_ect/fiche_status_epilepticus.html`** (~430 lignes) : 10 sections — résumé urgence, définition opérationnelle ILAE 2015 (t1=5 min, t2=30 min), status convulsif tonico-clonique avec SVG (recrutement → tonique → clonique → post-critique), status focal moteur et complexe, status non-convulsif (NCSE) avec SVG décharge rythmique stable, critères de Salzburg simplifiés (NCSE certain &gt; 2,5 Hz, NCSE possible avec test thérapeutique lorazépam), conduite à tenir 4 paliers (BZD 1<sup>re</sup> ligne / antiépileptique IV 2<sup>e</sup> / anesthésie générale burst-suppression 3<sup>e</sup>), implications ECT (confusion post-séance &gt; 1 h = NCSE jusqu'à preuve du contraire), red flags, take home.
> 2. **SVG schématiques** pour pattern crise tonico-clonique (4 phases distinctes en couleur rouge) et pattern NCSE (décharge rythmique stable). Aucune figure du manuel.
> 3. **Pattern iframe + ↗** : carte Status epilepticus ajoutée au case `eeg_ect` (icône thermo rouge `C.r[700]` pour signaler l'urgence). Bandeau "À venir" mis à jour : reste **EEG en réanimation** (6/6, dernière fiche du batch).
> 4. **SW bump v4.21 → v4.22** : pré-cache de `fiche_status_epilepticus.html`.)
>
> v4.21 — Fiche Activité épileptiforme (4/6 du batch handbook).
> 1. **Nouvelle fiche `eeg_ect/fiche_epileptiforme.html`** (~440 lignes) : 11 sections — résumé, définition rigoureuse (stéréotypie/paroxysme/polarité/champ), 4 graphoéléments unitaires avec SVG (pointe &lt;70 ms, sharp wave 70-200 ms, pointe-onde, polypointe-onde), patterns groupés généralisés (pointe-onde 3 Hz absence avec SVG, lente 1,5-2,5 Hz Lennox-Gastaut, hypsarythmie West), distribution spatiale, activations (HV/photostim/sommeil), signification clinique (5% pop sans épilepsie, sensibilité ~50 % en simple → ~80 % avec sommeil/privation), pièges variants bénins avec tableau de 7 lignes (renvois Normal et Sommeil), implications ECT pré/per/post-séance, red flags, take home.
> 2. **SVG schématiques en rouge `var(--r-500)`** pour les graphoéléments épileptiformes (cohérent avec Artefacts qui utilise aussi rouge pour signaler le pathologique). Aucune figure du manuel pour cette fiche — les morphologies se schématisent suffisamment bien.
> 3. **Renommage à venir — fiche 6/6 ICU EEG → "EEG en réanimation"** : décision JC pour vocabulaire hospitalier français standard. Bandeau "À venir" mis à jour en conséquence ; le slug fichier `icu_eeg` reste pour la cohérence URL/code.
> 4. **Pattern iframe + ↗** : carte Activité épileptiforme ajoutée au case `eeg_ect` (icône alerte rouge `C.r[600]`).
> 5. **SW bump v4.20 → v4.21** : pré-cache de `fiche_epileptiforme.html`.)
>
> v4.20 — Fiche Artefacts (3/6 du batch handbook).
> 1. **Nouvelle fiche `eeg_ect/fiche_artefacts.html`** (~340 lignes) : 11 sections — résumé, 3 grandes familles (biologique/mécanique/électrique), EMG (avec SVG hérissé rouge), ECG/pulse (SVG impulsions régulières), oculaires/blink (SVG déflexion frontale), sueur (SVG dérive lente), secteur 50 Hz + mauvais contact (SVG oscillation fine), tableau de poche 9 lignes, méthode systématique 3 questions (où/quand/comment), pièges péri-ECT (pré-induction, per-séance, recovery), take home. Tous les SVG en couleur rouge `var(--r-500)` pour distinguer des SVG verts `t-600` des fiches Normal/Technical (artefacts = signal parasite à reconnaître).
> 2. **Aucune figure du manuel** dans cette fiche : tous les SVG faits maison (option C — les artefacts standards se schématisent bien, pas besoin de tracés cliniques réels).
> 3. **Pattern iframe + ↗** : carte Artefacts ajoutée au case `eeg_ect` (icône alerte ambre `C.a[700]` pour distinguer visuellement). Bandeau "À venir" mis à jour (3 fiches restantes : Épileptiforme · Status · ICU EEG).
> 4. **SW bump v4.19 → v4.20** : pré-cache de `fiche_artefacts.html`.)
>
> v4.19 — Fiche Sommeil (2/6 du batch handbook).
> 1. **Nouvelle fiche `eeg_ect/fiche_sommeil.html`** (~280 lignes) : 7 sections — résumé · architecture du sommeil (5 stades + cycles 90 min) · stades détaillés (Éveil/N1/N2/N3/REM) · tableau récapitulatif EEG/EOG/EMG par stade · variants bénins (vertex sharp, POST, sawtooth, K-complexes, fuseaux) avec critères de distinction épileptiforme · implications péri/post-ECT · take home. Linke `shared/ressource-doc.css` + `.js`.
> 2. **2 figures Oxford intégrées** (option C, mix figures) : `fig_sommeil_stades.png` (800×1019, 454 KB — tracés 5 stades + spectres puissance, fig 17.2 du Oxford Handbook) et `fig_sommeil_variants.png` (800×1015, 332 KB — vertex sharp + POST + sawtooth, fig 17.4). Wrapper `.eeg-fig-wrap.compact` (max-width 520 px) pour ne pas dominer la page. Footer attribution sobre option A : "Sources : manuels d'EEG clinique et critères AASM de stadification du sommeil".
> 3. **Pattern iframe + ↗** : carte Sommeil ajoutée au case `eeg_ect` (icône stéthoscope ardoise pour distinguer visuellement de Technical et Normal). Bandeau "À venir" mis à jour (4 fiches restantes : Artefacts · Épileptiforme · Status · ICU EEG).
> 4. **SW bump v4.18 → v4.19** : pré-cache de `fiche_sommeil.html` + 2 figures sommeil.)
>
> v4.18 — Fiche EEG normal (1/6 du batch handbook).
> 1. **Nouvelle fiche `eeg_ect/fiche_normal_eeg.html`** (~370 lignes) : 10 sections — résumé · activité de fond adulte éveillé (tableau bandes + asymétrie tolérée 50 %) · réaction d'arrêt avec schéma SVG (alpha bloquée à l'OY) · variantes physiologiques (mu rhythm avec SVG en arche, lambda, BETS, wickets, 14&6, SREDA, mid-temporal RTTD) · variations par âge · activations standardisées (HV 3 min, photostim, sommeil) · checklist 10 points · frontières du normal vs anormal · implications pré/post-ECT · take home. Linke `shared/ressource-doc.css` + `.js`. Pas de figure manuel pour cette fiche (concepts schématisables en SVG).
> 2. **Pattern iframe + ↗** appliqué : carte Normal ajoutée au case `eeg_ect` de la Toolbox, bandeau "À venir" mis à jour (5 fiches restantes : Sommeil · Artefacts · Épileptiforme · Status · ICU EEG).
> 3. **TODO ajoutée — Sync dark mode global ↔ iframes fiches** : décision JC. Le toggle dark/light du Toolbox ne propage pas l'état aux iframes. Fix à appliquer en fin de batch (un seul fix couvre les 6 fiches EEG qui partagent `shared/ressource-doc`). La fiche ECT utilise `body.dark` (ancien pattern) → migration vers `html.dark` + `ressource-doc.css` au moment du fix global pour cohérence.
> 4. **SW bump v4.17 → v4.18** : pré-cache de `fiche_normal_eeg.html`.)
>
> v4.17 — Fiches EEG/ECT en iframe intégré + fix mise en page fiche ECT.
> 1. **Iframe intégré dans Toolbox** : nouveau pattern `selEegFiche` (state `useState({slug, nom})`) dans le composant App de `staff/toolbox.html`. Quand une carte EEG/ECT est cliquée, la fiche s'affiche désormais en iframe au sein de la Toolbox (`height: calc(100vh - 180px)`, comme les fiches patient existantes) au lieu d'ouvrir un nouvel onglet. Header de l'iframe : bouton ← retour + nom de la fiche tronqué + bouton ↗ pour ouvrir tout de même en nouvel onglet (utile impression A4, séance ECT). `nav()` clear `selEegFiche` au changement de vue.
> 2. **Fix mise en page fiche ECT** : `.grid-2 { grid-template-columns: 1fr; }` permanent (suppression du media query `@media (max-width:768px)`). Toutes les sections sont désormais empilées en 1 colonne quelle que soit la largeur d'écran — lisibilité optimale en iframe et sur tablette landscape (Galaxy Tab S7 FE). Schémas spécifiques (`.sismo-schema` 4 cols, `.phases` 5 cols) inchangés car ce sont des visualisations.
> 3. **Pattern unifié pour toutes les fiches EEG** : la fiche Technical et les 6 fiches du batch à venir (normal · sommeil · artefacts · épileptiforme · status · ICU) utiliseront ce pattern iframe + ↗ — décidé suite à validation JC.
> 4. **SW bump v4.16 → v4.17** (force re-fetch toolbox.html + fiche_ect.html mis à jour).)
>
> v4.16 — Fiche pilote EEG : Comprendre un EEG en 10 min.
> 1. **Nouvelle fiche `eeg_ect/fiche_technical.html`** (378 lignes) : fiche pilote du chapitre Technical du handbook EEG, rédigée en synthèse pédagogique originale (concepts du domaine commun, pas de paraphrase). Sections : résumé · 4 bandes de fréquence (avec schéma SVG α/β/θ/δ) · origine du signal · montages bipolaire vs référentiel (avec schéma SVG) · filtres et calibration · artefacts techniques · règles de lecture rapide · checklist psychiatre ECT (pré/per/post-séance, effet psychotropes) · red flags · take home. Linke `shared/ressource-doc.css` (design system partagé USCA) + `shared/ressource-doc.js` (toggle ☀️/🌙 dark mode automatique via `html.dark`).
> 2. **Pas de figures du manuel pour cette fiche pilote** (chapitre Technical conceptuel — schémas SVG originaux suffisent). Décision figures-originales-vs-SVG à trancher avec JC pour les 5 fiches suivantes (Normal · Artefacts · Épileptiforme · Status · ICU EEG) où les vrais tracés cliniques sont structurants.
> 3. **Case `eeg_ect` enrichi** dans `staff/toolbox.html` : 2 sections distinctes (uppercase headers) — "Pratique ECT" (`fiche_ect.html` Pitié) et "Fiches EEG (handbook)" (Technical actif + bandeau "À venir" pour les 5 chapitres restants).
> 4. **SW bump v4.15 → v4.16** : pré-cache de `fiche_technical.html` + `shared/ressource-doc.css` + `shared/ressource-doc.js` (jamais cachés auparavant — manquait pour mode hors-ligne complet des fiches Toolbox).
> 5. **Mode validation visuelle (Q2=A)** : fiche pilote présentée à JC pour calage du style/structure avant batch des 5 fiches restantes.)
>
> v4.15 — Fixes Toolbox post-réorga.
> 1. **Carte "Protocoles USCA par substance" → "Protocoles USCA"** (label simplifié). Court-circuit du hub `protocoles_hub` : la grande carte ouvre directement `case "substances"`, le BackBtn revient sur `home`. Bottom nav `Protocoles` pointe désormais sur `id:"substances"` (au lieu de `protocoles_hub`), `protoViews` simplifié en check direct `view==="substances"||!!selSub`. Le hub `protocoles_hub` reste défini dans le code mais devient totalement inaccessible (peut être supprimé dans un cleanup ultérieur).
> 2. **Vue Traitements — renommages + accordéons Fiches Expert** : SectionHead "Traitements" → "Fiches Traitements et Substances" (sub : "Fiches patient · fiches substances · fiches expert"). Cartes "Fiches Patient" → "Fiches Traitements Patient", "Fiches Expert" → "Fiches Traitements Expert" (Fiches Substances inchangée). `renderExpertSection` refondue : classes médicamenteuses repliées par défaut (clé `openCats["expert_"+group.cat]`, même pattern que `renderPatientSection` et `renderSubstancesSection`).
> 3. **MASTER_PROMPT_EEG_ECT.md — flexibilité longueur** : section "CAP LONGUEUR" relâchée en "LONGUEUR — viser court mais privilégier la pédagogie". Cible 400-700 lignes maintenue mais autorisation explicite de dépasser pour chapitres denses (Status, ICU EEG). Pédagogie > quota.
> 4. **SW bump v4.14 → v4.15** (force re-fetch toolbox.html mis à jour).)
>
> v4.14 — Réorga Toolbox V1 + nouvelle carte EEG/ECT.
> 1. **Réorganisation des cartes Toolbox** (`staff/toolbox.html`) : passage de 3 grandes + 3 petites + 1 carte feedback isolée à **4 grandes + 5 petites**. Grandes (ordre) : Protocoles USCA par substance / Ressources USCA / Fiches Traitements et Substances / Dossier post-cure. Petites (en 2 grilles) : ligne 1 = Scores · EEG/ECT · Interactions (MetaboScope) ; ligne 2 = ELSA · Feedback. **Ressources** sortie du sous-hub Protocoles → grande carte autonome. **ELSA** rétrogradée de grande à petite carte. **Feedback** intégrée dans la grille (suppression de la carte isolée du bas). La grande carte "Protocoles USCA par substance" pointe directement sur `case "substances"` ; le hub `protocoles_hub` reste accessible via le bottom nav (dormant mais fonctionnel).
> 2. **Nouvelle carte "EEG / ECT"** : nouveau case `eeg_ect` — hub minimal qui ouvre `eeg_ect/fiche_ect.html` (fiche pratique ECT canonique fournie par les psychiatres de la Pitié, copiée depuis `EEG_ECT_handbook/fiche_ect.html` qui reste la source de référence). Placeholder pour les fiches EEG du handbook clinique à venir (chapitres Technical / Normal / Artefacts / Epileptiforme / Status / ICU EEG — voir `EEG_ECT_handbook/MASTER_PROMPT_EEG_ECT.md`).
> 3. **Renommage "Interactions" → "Interactions (MetaboScope)"** : SectionHead du composant `InterCheck`, label dans `moreItems`, sous-titre sous la petite carte d'accueil. Le standalone MetaboScope (en cours d'amélioration JC) sera intégré ultérieurement.
> 4. **`MASTER_PROMPT_EEG_ECT.md` corrigé** : aligné sur charte USCA + dark mode, arborescence `eeg_ect/` + manifest `index.json` calqué sur `ressources_doc/`, design system partagé `shared/ressource-doc.css`, figures PNG externes dans `eeg_ect/assets/` (pas d'inline base64), sections obligatoires/optionnelles, cap longueur ~400-700 lignes/fiche, règles anti-copie renforcées, fiche ECT canonique distincte du corpus EEG.
> 5. **SW bump v4.13 → v4.14** : ajout de `./eeg_ect/fiche_ect.html` au pré-cache `LOCAL_ASSETS`.)
>
> v4.13 — Push 10 min + push patients pour ateliers + permissions triées + pop-up présence ateliers patient.
> 1. **Rappels push 9-10 min au lieu de 4-5 min** : fenêtre élargie dans `cron-reminders/index.ts` (`in9`/`in10`, `targetMin/Max = paris.minutes + 9/10`), textes "Dans 10 min" partout. pg_cron continue à tourner toutes les 60 s. JC ressentait des notifs "lentes" — la latence venait majoritairement de FCM/APNs (5-30 s) et du tick cron (jitter ±60 s), donc le fix est de pousser 5 min plus tôt.
> 2. **Push 10 min avant atelier à TOUS les patients hospitalisés abonnés aux push** : nouveau bloc `3b. Patients hospitalisés` dans le SCAN 3 de `cron-reminders`. Récupère `push_subscriptions WHERE patient_id IS NOT NULL` (distinct), filtre via `groupe_modifications.exclusions[]` du jour. Anti-doublon via migration v36 : colonne `patient_id UUID NULL` ajoutée à `push_reminders_sent_groupe` + CHECK XOR (`profile_id` XOR `patient_id`) + 2 UNIQUE partiels (un par cible). Tag PWA dédié `atelier-<slug>-<date>` distinct du tag animateur `groupe-<slug>-<date>` pour éviter qu'un push patient écrase celui d'un soignant.
> 3. **Affichage permissions admin trié chronologiquement** : `renderPatientPerms` partitionne en `future` (date_retour ≥ now) et `past` (date_retour < now), tri ascendant par `date_debut` dans chaque groupe, séparateur "Permissions passées" entre les deux. `buildPermCard(p, patientId, isPast)` reçoit un flag : si `isPast`, fond gris neutre + opacité 70 % + retrait des boutons Valider/Refuser/Annuler/Modifier (seul 🗑 reste). Le label de statut (validée/refusée/en attente) est conservé pour archive.
> 4. **Pop-up "Tes ateliers du jour" patient** : nouveau modal `modal-groupe-presence` qui s'ouvre 2.5 s après l'ouverture de l'app patient si (a) heure ≥ 8h30 locale, (b) au moins un atelier aujourd'hui via `getGroupesForDay()` avec `debut !== null`, (c) pas annulé via `groupe_modifications`, (d) patient pas dans `exclusions[]`, (e) `participations.present` non encore renseigné, (f) pas déjà fermé aujourd'hui (`localStorage.groupe_presence_dismissed_<YYYY-MM-DD>`). Liste verticale d'ateliers avec boutons Présent·e (vert) / Absent·e (gris) → `db.upsertParticipation(patient_id, slug, nom, dateISO, present, 'patient')`. Bouton "Plus tard" + croix ferment pour la journée.)
> 1. **Modal Paramètres (admin) — fix scroll** : container restructuré en `flex flex-col max-h-[90vh] overflow-hidden`, header sticky en haut (`flex-shrink-0`) avec border-b, body `overflow-y-auto flex-1` → toutes les sections accessibles + bouton ✕ toujours visible. Ajout fermeture par clic sur l'overlay sombre + touche Escape (UX desktop).
> 2. **Pop-up onboarding notifications** : nouveau modal `modal-notif-prompt` côté admin (médecin uniquement) ET côté patient. Trigger via `setTimeout(maybeShowNotifPrompt, 1500)` à la fin de `showAdminApp` / `showPatientApp`. Conditions : `Notification.permission === 'default'` + délai 7 jours via `localStorage.notif_prompt_last_asked`. Détection iOS Safari onglet (`!matchMedia('(display-mode: standalone)').matches && !navigator.standalone`) → affiche les 3 étapes d'installation PWA au lieu du bouton Activer (DOM API, pas innerHTML, pour passer le hook XSS). "Plus tard" et croix marquent le timestamp → relance 7j plus tard. "Activer" déclenche programmatiquement le bouton existant `btn-admin-push-toggle` / `btn-push-toggle`.
> 3. **Retrait notifications craving** : `alerte_craving` retiré du schéma `DEFAULT_NOTIF_PREFS`, du HTML modal Paramètres, et des helpers read/write. Fonctionnalité non utilisée en pratique. Edge Function inchangée (le filtrage se fait par clé `=== false`, donc une clé absente = pas de filtre = OK).
>
> v4.12 — Fix modal Paramètres scrollable + pop-up onboarding notifications + retrait notifs craving (voir détails dans CLAUDE_ARCHIVE).
>
> v4.11 — Fix RLS DELETE permissions.
> 1. **Migration v35** : ajout policy `permissions_delete_auth` (`USING (auth.role() = 'authenticated')`). Bug v4.10 — la table `permissions` avait INSERT/SELECT/UPDATE en RLS mais aucune policy DELETE → tout DELETE était bloqué silencieusement (0 ligne supprimée sans erreur HTTP, comportement standard Postgres).
> 2. **Helper `db.deletePermission` durci** : utilise `count: 'exact'` + throw si 0 ligne affectée → tout futur problème RLS deviendra immédiatement visible côté UI au lieu de "rien ne se passe".
>
> v4.10 — Notifications push V3 personnalisables + permissions modifiables/supprimables + nouveau logo phénix.
> 1. **Préférences notifications par compte** : migration v34 ajoute `profiles.push_preferences JSONB` (NULL = défauts système). Section "Mes notifications" dans modal Paramètres admin (visible role=medecin uniquement) — 5 checkboxes événements (`message_patient`, `permission_demande`, `alerte_craving`, `groupe_rappel`, `rdv_perso`) + 3 réglages silence perso (heure soir 16h-20h, weekend on/off, fériés on/off). L'Edge Function `send-push` lit `push_preferences` et filtre destinataires en amont par `event_type`. Les prefs perso peuvent **durcir** mais pas assouplir le silence weekend/férié (sécurité par défaut).
> 2. **Silence soignant : seuil soir 16h → 18h** dans `send-push`. Garde rôle médecin pour les push staff (`getSubscribedMedecinIds` filtre `role='medecin'`).
> 3. **Push patient — nouveaux événements** : (a) demande de permission patient → médecins abonnés (fire-and-forget, comme messages V2) ; (b) validation permission soignant → patient (push patient toujours envoyé, pas filtré par silence).
> 4. **Permissions admin — modif + suppression** : bouton ✏️ Modifier (mini-form inline 4 champs date/heure + motif, validation 48h max) disponible tous statuts. Modif sur perm `refusee` repasse en `en_attente` (clear validee_par/at). Bouton 🗑 Supprimer (`db.deletePermission`) disponible tous statuts avec confirmation. Helper `buildPermCard(p, patientId)` factorise rendu + handlers.
> 5. **UI permissions 2 jours clarifiée** : 1 jour = `Lun. 5 mai · 09:00 → 18:00` (1 ligne) ; 2 jours = `↗ Départ : Lun. 5 mai à 18:00` + `↙ Retour : Mar. 6 mai à 09:00` (2 lignes). Appliqué côté admin (`renderPermDates`) et patient (`loadPermissions`).
> 6. **Nouveau logo + splash plein écran** : `assets/icon-source.png` remplacé (phénix + poignée de main, fond blanc, 4096×4096) → `icon-192.png`/`icon-512.png` regénérés via PowerShell+System.Drawing (downscale bicubique HQ). `splash.png` remplacé par variante portrait avec mention "USCA Connect" sous le logo. `manifest.json` `background_color` passe de `#f0f4f8` à `#ffffff` (raccord splash natif Android sans cadre crème visible). `index.html` splash custom : `inset-0 flex items-center justify-center` + `width:100%;height:100%;object-fit:contain` (plein écran avec préservation du ratio, fond blanc).
>
> v4.09 — Mode paysage activé (orientation libre).
> 0. **Mode paysage** : `manifest.json` passé de `"orientation": "portrait"` à `"orientation": "any"` → la PWA suit désormais l'orientation physique de l'appareil (Android Chrome + iOS Safari ≥ 16.4 en mode standalone). Cible principale : Galaxy Tab S7 FE en paysage (1366×853, le layout Tailwind responsive s'adapte naturellement). Garde-fou ajouté dans `shared/theme.css` via media query `(orientation: landscape) and (max-height: 500px)` pour téléphones tournés sur le côté (compactage headers/footers stickys + modales 92vh + splash logo 40vh max).
>
> v4.08 — Fiches substances poussées au patient + fixes PWA install + QCM externe auto-extend + toolbox accordions repliés.
> 1. **Fiches substances (16)** : nouveau dossier `fiches-substances/`, table `substances_patient` (migration v33, RLS calquée sur `prescriptions`), `shared/substances-catalogue.js` (16 fiches × 6 catégories : Dépresseurs SNC / Stimulants / Opioïdes / Psychodysleptiques / Mésusage médicamenteux / Tabac), helpers `db.getSubstancesPatient` / `db.addSubstancePatient` / `db.removeSubstancePatient`. Côté admin : 2ème checklist "Fiches substances" (catégorisée violet) dans détail patient. Côté patient : carte Traitements → 2 sections (traitements catégorisés ambre + substances liste plate alphabétique violet). Côté toolbox : 3ème accordion "Fiches Substances" dans `TraitementsView` (FICHES_SUBSTANCES_CATS, dispatch via `selFiche.kind === "substance"` pour servir le bon path). Export HTML autonome patient embarque aussi les fiches substances prescrites. SW : 16 HTML pré-cachées.
> 2. **PWA install** : ajout `icon-192.png` (généré bicubique HQ depuis `icon-512.png`), manifest mis à jour avec 4 entrées (192/512 × `any` + `maskable`) — débloque le bouton "Installer" sur Chrome Android stricts (versions anciennes, Samsung Internet…) qui exigent les deux tailles. Notifications push fonctionnent dans tous les cas (raccourci suffit sur Android).
> 3. **QCM externe auto-extend** : sessions en cours créées avant le fix v3.98 (cap 10 questions dans `questions_json`) sont automatiquement étendues à toutes les questions de l'item lors du "Reprendre" (compare `sessionQuestions.length` vs `questions.length`, append manquantes, `UPDATE qcm_sessions SET questions_json, nb_questions`). Aucune perte des réponses déjà enregistrées.
> 4. **Toolbox** : `TraitementsView` ouvre désormais avec tous les accordions repliés (`useState(null)` au lieu de `useState("patient")`).)
> v4.07 — P5 Personnalisation modules soignant : migration v32 (`role_modules_hidden`, modèle "absence=visible"), `shared/modules-config.js` (inventaire 18 modules), `shared/module-visibility.js` (apply/toggle/fetchMap/mountEditButtons), `data-module` sur 17 anchors HTML admin + 6 cartes JSX toolbox. Edit mode admin via modale Paramètres → bandeau sticky + bouton ⚙️ par module + popover 5 checkboxes par rôle. Matrix Comptes "Modules par rôle" (accordion 18×5, même store BDD). Admin `is_admin=true` bypass total. Masquage UI uniquement — RLS sur les données patient/messages inchangées.
> v4.06 — Fixes SW : (1) pré-cache de tous les `data/item_*.json` à l'install (dérivé dynamiquement de `data/index.json`) → QCM EDN entièrement utilisable hors ligne après installation PWA ; (2) `ressources_doc/index.json` passé en stratégie network-first sans écriture cache via nouvelle liste `NO_CACHE_WRITE`, cache-buster `?t=Date.now()` retiré côté toolbox → plus de bloat cache au fil des ouvertures de RessourcesView.
> v4.05 — Reclassification fiches patient : "Benzodiazépines" → "Anxiolytiques" (+ propranolol), split "Psychotropes" en "Antidépresseurs" / "Antipsychotiques" / "Thymorégulateurs" / "Stimulants", agomélatine déplacée en "Hypnotiques/Sédatifs". Toolbox `FICHES_PATIENT_CATS` resynchronisé avec `shared/fiches-catalogue.js` (29 fiches complètes, fini la divergence curée). Classes médicamenteuses repliables/dépliables dans la vue Traitements→Fiches Patient (état local par catégorie, repliées par défaut).
> v4.04 — Fix RLS push_subscriptions : migration v31 remplace `push_subs_read_staff` (SELECT réservée authenticated) par `push_subs_read_public` (SELECT `true`). Débloque deux bugs : (1) activation notifs patient échouait avec "row violates RLS policy" — le `.upsert(...).select()` déclenche un RETURNING évalué contre la policy SELECT, refus en anon ; (2) trigger message patient→médecin : `getSubscribedMedecinIds()` retournait `[]` silencieusement côté anon, aucune notif envoyée. Endpoints/clés push non secrets — seule la clé privée VAPID permet l'envoi.
> v4.03 — Push V2 Pause vacances : migration v30 ajoute `profiles.push_pause_until DATE` ; section "Pause vacances" dans modal Paramètres admin (date picker "dernier jour d'absence" + bouton reprise immédiate) ; Edge Function `send-push` filtre les profile_ids en pause (`reason: all_on_vacation`). Reprise auto le lendemain, sub BDD préservée.
> v4.02 — Notifications Push V2 : silence soignant (push staff autorisés uniquement lundi-vendredi 8h30→16h hors jours fériés France — patients jamais bloqués) dans Edge Function `send-push` ; fix défensif anti-orphelin (vérif BDD post-save + unsubscribe automatique en cas d'échec) côté admin et patient ; garde-fou XOR : `profile_id: null` et `patient_id: null` explicites dans les helpers `savePushSubscription*`.
> v4.01 — Notifications Push V2 médecins : migration v29 (`push_subscriptions.patient_id` nullable + `profile_id` avec CHECK XOR, tables `push_last_message_staff` et `push_reminders_sent_groupe`) ; Edge Function `send-push` accepte maintenant `patient_id` | `profile_id` | `profile_ids[]` ; SW sw.js priorise `profile_id` puis fallback `patient_id` (clés IndexedDB séparées, cleanup au logout via `clear-push-identity`) ; engrenage ⚙️ dans le header admin → modal Paramètres avec toggle activation push ; message patient → push automatique à tous les médecins abonnés (fire-and-forget) ; cron-reminders étendu : +rappels consultations perso au créateur, +rappels groupes A/B aux animateurs (avec gestion annulation et nouvelle_heure via `groupe_modifications`). Planning A/B dupliqué en TS dans l'Edge Function — TODO priorité basse pour migrer en BDD.
> v4.00 — label inclusif patient "Patient·e de 53 ans" : colonne `sexe` sur `patients` (migration v28, F/M/NULL), radios dans nouveau patient, select inline dans détail patient, remplacement partout côté admin + extern ; chambre conservée dans le header patient (repère personnel) et sur l'avatar indigo.
> v3.99 — notifications Push patient (migrations v25+v26+v27, Edge Functions Supabase, VAPID, pg_cron rappels 5 min) ; page Paramètres patient ; QCM tuteur : clic sur session → voir toutes les réponses avec propositions + correction.
> v3.98 — agenda perso privé par soignant (migration v24), accordions Planning/Dashboard repliables, Toolbox Ressources "Fiches" replié, correctifs QCM externe + badges messages + DDN + adressage libre.
> v3.97 — fix animateurs fantômes : migration v23 FK groupe_animateurs → profiles(CASCADE), policy DELETE admin, alerte bloquante si suppression Auth échoue.
>
> **Pour l'historique détaillé des sessions, les specs déjà implémentées (vision patient V3, auth P9) et le détail des migrations : voir `CLAUDE_ARCHIVE.md` (à lire à la demande).**
>
> **📌 Setup infrastructure Supabase (migrations, Edge Functions, secrets) : voir `SETUP_PUSH.md`.** Au début de chaque session, si du travail a été fait sur des features nécessitant des migrations/Edge Functions, consulter la checklist d'état pour identifier ce qui reste à faire côté JC avant le chantier courant.

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
| **Service Worker** | usca-v4.23 |
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
│   └── index.html              ← Interface patient (9 cartes + post-cure)
├── admin/
│   └── index.html              ← Dashboard soignant (Patients, Toolbox, Planning, Mon élève)
├── etudiant/
│   └── index.html              ← SPA livret IFSI (élève) + mode preview soignant
├── extern/
│   └── index.html              ← Dashboard externe (chambres lecture seule + QCM EDN + signalements)
├── staff/
│   └── toolbox.html            ← V1 Toolbox React (iframe dans admin)
├── data/                       ← Base QCM EDN (lazy-loaded, non précachée en bloc)
│   ├── index.json              ← Catalogue 23 items / 477 questions
│   └── item_*.json             ← 1 fichier par item EDN (chargé à la demande)
├── postcure/                   ← Module post-cure (volets séparés)
│   ├── patient.html            ← Formulaire patient (6 étapes, standalone)
│   ├── medecin.html            ← Formulaire médecin (standalone ou lié patient)
│   ├── logo_web.txt            ← Logo USCA base64 (affichage)
│   └── logo_pdf.txt            ← Logo USCA base64 (PDF)
├── shared/
│   ├── supabase.js             ← Client Supabase + CRUD helpers
│   ├── auth.js                 ← Gestion session, login/logout
│   ├── planning-groupes.js     ← Planning semaine A+B + réunions
│   ├── postcure-structures.js  ← 14 structures post-cure (engagements, checklists)
│   ├── craving-agenda.js       ← Composant agenda craving
│   ├── fiches-catalogue.js     ← Catalogue des 29 fiches traitements
│   ├── substances-catalogue.js ← Catalogue des 16 fiches substances (6 catégories)
│   ├── livret-ifsi-contenu.js  ← Contenu pédagogique livret IFSI (14 chapitres, ~90 questions)
│   ├── qcm-engine.js           ← Moteur QCM EDN (lazy-load index/items, scoring, signalements)
│   ├── theme.css               ← Variables CSS dark mode
│   └── theme.js                ← Toggle dark mode
├── functions/
│   └── api/
│       └── delete-user.js      ← Cloudflare Function proxy suppression compte
├── fiches-traitements/
│   ├── fiches_patient/         ← 29 fiches HTML à partager au patient (Aotal, baclofène, BZD, TSO, psychotropes…)
│   └── fiches_expert/          ← 8 fiches expert PDF (antipsychotiques : amisulpride, aripiprazole, chlorpromazine, clozapine, halopéridol, olanzapine, quétiapine, rispéridone)
├── fiches-substances/          ← 16 fiches HTML d'information substances (alcool, GHB, opioïdes, stimulants, psychodysleptiques, BZD mésusage, N2O, tabac)
├── ressources_doc/             ← Ressources Toolbox — manifest-driven (index.json)
│   ├── index.json              ← Liste les ressources exposées (type, titre, meta, tag, fichier, date)
│   ├── fiches/                 ← 📑 aides-mémoire imprimables (PDF/HTML)
│   ├── articles/               ← 🧪 résumés cliniques d'articles (PDF/HTML)
│   ├── recos/                  ← 📘 recommandations HAS/SFA/NICE (HTML préféré)
│   ├── algos/                  ← 🧩 algos/arbres décisionnels (HTML interactif)
│   └── */_TYPE.txt             ← descriptifs d'upload (non exposés dans l'app)
├── migrations/                 ← Scripts SQL (v1 à v21)
├── assets/                     ← Images sources (icon-source.png, splash-source.png)
├── affiche-equipe.html         ← Affiche A4 imprimable avec QR code
├── icon-192.png, icon-512.png, splash.png ← Images servies par l'app (icônes any+maskable)
├── manifest.json               ← Manifeste PWA
└── sw.js                       ← Service Worker multi-pages
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
- `profiles` — Profils soignants (id, email, nom, role, is_admin, modules_actifs, jours_presence, checklist_items)
- `patients` — Patients hospitalisés (chambre, DDN, admission, sortie prévue, postcure_statut JSONB, sortie_info JSONB)
- `alertes` — Alertes craving/effet_indesirable/urgence/demande (patient_id, type, intensité, statut)
- `strategies` — Stratégies de prévention patient (5 catégories Marlatt)
- `evenements` — Événements (patient_id nullable : individuels + équipe). Types : entretien, consultation, familial, rdv_externe, reunion, staff, labo, supervision
- `permissions_sortie` — Demandes de permission (statut, date/heure sortie/retour, motif)
- `contenus_partages` — Messages bidirectionnels patient ↔ équipe (notes, liens, consignes). `cree_par IS NULL` = envoyé par le patient, sinon = soignant. Migration v21 : policy INSERT ouverte anon.
- `fiches_traitements_patient` — Fiches traitements prescrites (checklist)
- `substances_patient` — Fiches substances poussées au patient (migration v33, RLS calquée sur `prescriptions` : SELECT public, INSERT/DELETE authenticated). Symétrique de `prescriptions` mais sémantique distincte (un traitement ≠ une substance consommée).

### Tables groupes
- `groupe_animateurs` — Soignants désignés animateurs (groupe_slug, user_id). Migration v23 : FK → `profiles(id) ON DELETE CASCADE` (au lieu d'auth.users) + policy DELETE ouverte aux admins.
- `groupe_modifications` — Modifications par date (annulation, changement heure, exclusions, horaires_individuels JSONB)
- `groupe_rappels` — Rappels envoyés par l'animateur
- `participations` — Présences/absences aux groupes (patient ou animateur)
- `demandes_seances` — Demandes de séances thérapies complémentaires (en_attente/acceptee/refusee)

### Tables auth et réunions
- `device_tokens` — Appareils de confiance soignants (auto-login 90j)
- `presences_reunions` — Présences aux réunions staff (médecins)

### Tables gestion lits
- `liste_attente` — Patients en attente d'admission (age, ddn, addressage, date_entree_prevue, date_sortie_prevue, pre_admission, destination_prevue JSONB, commentaire). Migration v22 : ajout `pre_admission`, `destination_prevue`, `ddn`, `date_sortie_prevue`.

### Tables livret IFSI
- `etudiants_stages` — Stage de l'étudiant·e IDE (nom, IFSI, promo, dates, IDE référent·e)
- `etudiant_progression` — Progression par question (réponses, vu par tuteur)

### Tables QCM EDN externe
- `tuteur_etudiant` — Lien tuteur↔apprenant (type='externe' ou 'etudiant_ide')
- `qcm_sessions` — Une ligne par série QCM jouée (item, mode, score)
- `qcm_reponses` — Une ligne par question répondue (`question_source` stable type "Item 76 - Q12", correct, temps_ms)
- `qcm_flags` — Signalements externe → tuteur (erreur_question | demande_explication, statut ouvert/traité, `tuteur_reponse`)
- `questions_tuteur` — Questions textuelles externe → tuteur (migration v20)

> Historique détaillé de toutes les migrations v1 à v20 : voir `CLAUDE_ARCHIVE.md` section E.

---

## 6. ÉTAT ACTUEL — CE QUI FONCTIONNE

### Login unifié (index.html)
- ✅ Onglets Patient / Soignant
- ✅ Auto-redirect si session existante, login unique (pas de double login)
- ✅ Mode dev admin (triple-tap logo)
- ✅ Splash screen, bannière WebView iOS
- ✅ Date de naissance patient : auto-formatage JJ/MM/AAAA (clavier numérique)
- ✅ Messages d'erreur auth précis (réseau/identifiants/rate-limit)

### Module Patient — 9 cartes + post-cure
Ordre des cartes : Programme, Journal, Traitements, Ateliers, Stratégies, Permission, Messages, Mon avis
- ✅ **J'ai un craving** : bouton pleine largeur rouge (en haut)
- ✅ **Programme** : timeline, navigation date, routine, groupes semaine A+B colorés, badge semaine A/B, horaires individuels, boutons Présent/Absent, "Demander une séance"
- ✅ **Mon journal** : agenda craving (semaine/mois/3mois/1an), courbe tendance, stats
- ✅ **Traitements** : fiches prescrites, 29 fiches HTML, navigation par catégorie
- ✅ **Ateliers** : navigation date, Présent/Absent par groupe, demande de séance, historique, stats, animateur/lieu affichés
- ✅ **Mes stratégies** : plan prévention guidé (5 catégories Marlatt), section éducative
- ✅ **Permission** : demande sortie (48h max, 20h retour), statut en attente/validée/refusée
- ✅ **Messages** : conversation bidirectionnelle patient ↔ équipe (compose box + chat-style, patient à droite, soignant à gauche). Migration v21 (policy INSERT `contenus_partages` ouverte anon). Convention `cree_par IS NULL` = patient. Côté admin : **compose inline unifiée** dans l'accordion Messages (sélecteur type note/lien/consigne + titre + texte + envoi), le bouton "Partager du contenu" et le modal séparé ont été supprimés.
- ✅ **Mon avis** : feedback structuré sur l'application (email ou copie)
- ✅ **Faire une demande de post-cure** : lien vers formulaire patient standalone
- ✅ **Badges notification** : ronds rouges sur Messages, Traitements, Programme, Ateliers

### Module Soignant (admin) — 3 onglets
- ✅ **Dashboard** : liste patients avec badges craving/permission, admission, détail patient (journal craving, fiches traitements, permissions, événements, voir comme patient, dossier post-cure accordion, export PDF/HTML, supprimer séjour), Entrées/Sorties (sorties prévues auto, liste d'attente CRUD), sections "Mon élève" (livret IFSI) + "Mon externe" (QCM EDN)
- ✅ **Toolbox** : iframe V1 avec dark mode
- ✅ **Planning** : navigation semaine ← → avec dates et badge Semaine A/B, groupes dynamiques, réunions de la semaine (masquées si heure passée), section "Historique de la semaine" dépliable, Staff Psychiatrie filtré par jours de présence

### Gestion comptes (admin)
- ✅ Création, modification rôle/nom, toggle admin
- ✅ Jours de présence par soignant (array [1-5], filtre Staff Psy)
- ✅ Suppression complète (profil + compte Auth via Cloudflare Function)
- ✅ Désignation animateurs pour les groupes

### App exportée HTML autonome
- ✅ Signal craving + agenda + stratégies modifiables
- ✅ Fiches traitements embarquées
- ✅ PIN local SHA-256, dark mode, export/import JSON
- ✅ Tutoriel au premier lancement

### Module Post-cure (P8) — 100% local, conforme non-HDS
- ✅ **Volet patient** (`postcure/patient.html`) : 6 étapes, génération ZIP+PDF, envoi par email
- ✅ **Volet médecin** (`postcure/medecin.html`) : formulaire médical complet, uploads, pré-remplissage depuis dashboard
- ✅ **Données partagées** (`shared/postcure-structures.js`) : 14 structures post-cure
- ✅ **Dashboard** : accordion "Dossier post-cure" dans Chambre XX, structure + date, 4 checkboxes workflow
- ✅ **Dark mode** complet synchronisé
- ✅ **PDFs** : police 9pt, sections barre colorée latérale, marges 20mm, smart page breaks, footer USCA
- ✅ **Sécurité** : aucune donnée patient stockée sur serveur — seuls des flags workflow dans `patients.postcure_statut`

### Module Livret IFSI (`etudiant/index.html`)
- ✅ SPA mobile-first : 14 chapitres (~90 questions), 6 types de questions, auto-correction, feedback visuel, persistance debounced 500 ms
- ✅ Lexique 21 acronymes (ELSA, USCA, CSAPA, CAARUD, CJC, OH, AA, RDR, TSO, THC, CBD, GHB, SLAM, PTSD, CPOA, TS, CMP, TDAH, ASPDT, AAH, ALD)
- ✅ **Vue tuteur** : section "Mon élève" admin, mode lecture seule (`?stage=<id>`), bouton "Marquer comme vu"
- ✅ **Édition élève admin** : modal (nom, IFSI, promo, dates, IDE référent·e) + menu ⋯ (clôturer / réinitialiser / supprimer)
- ✅ **Aperçu Toolbox** : carte "📘 Livret IFSI" → `/etudiant/?preview=demo`
- ✅ **Export HTML imprimable** : bouton ⬇ génère HTML avec questions + réponses + explications

### Module Externe (`extern/index.html`) — 3 onglets
- ✅ **Garde session** : `role='externe'` → redirect `/extern/`
- ✅ **Onglet Dashboard** : accordion "Patients" (Chambres / Sorties / Attente avec CRUD complet), détail patient identique admin (journal craving, fiches, permissions, actions, exports PDF/HTML, voir comme patient), carte Mon QCM EDN, Checklist, Questions au tuteur, Signalements + Export
- ✅ **Onglet Toolbox** : iframe lazy-load `staff/toolbox.html?embedded=true`
- ✅ **Onglet Planning** : copie complète du planning admin, lazy-load
- ✅ **QCM EDN** : sélecteur item uniquement, mode entraînement séquentiel, correction + explication immédiate, 💬 Explication + 👎 Signalement par question, score final persisté (`qcm_sessions` + `qcm_reponses`)
- ✅ **Mode tuteur** (`?preview=tuteur`) : bandeau orange, "Voir toutes les questions" par item, masque Toolbox/Planning de la nav
- ✅ **Export app autonome** : HTML standalone 477 questions embarquées + joueur interactif
- ✅ **Checklist personnelle** : stockée dans `profiles.checklist_items` (debounce 600ms)
- ✅ **Questions au tuteur** : externe pose/modifie/supprime, tuteur répond via modal (migration v20)
- ✅ **Lazy-load data** : `index.json` au démarrage, `item_*.json` à la sélection (cache mémoire session)

### Vue tuteur dans admin
- ✅ Section "Mon externe" pour médecin/admin — stats sessions, signalements en attente, réponse aux flags, questions de l'externe avec réponse inline, bouton ↺ réinitialisation (supprime sessions/réponses/flags au changement d'externe). Tous les médecins voient l'externe.
- ✅ Accordion "Mes élèves" unifié : IFSI + QCM en sous-sections

### Auth avancée
- ✅ Client Supabase robuste (safeStorage, PKCE, autoRefresh)
- ✅ Appareils de confiance (device tokens 90j, max 5, auto-register/révocation)
- ✅ Cloudflare Function suppression compte (`functions/api/delete-user.js`)

### Toolbox Soignant V1
- ✅ **Accueil** : 3 grandes cartes (Protocoles USCA, ELSA, Dossier post-cure) + 3 petites (Traitements, Scores, Interactions) + Feedback
- ✅ **Protocoles USCA** → hub : Substances (7) + **Ressources** (4 accordions : Fiches / Articles / Recos / Algos, tags thématiques colorés, ouverture `target="_blank"`). Manifest-driven : `ressources_doc/index.json` fetch au mount, 6 ressources actuellement (BZD étoiles PDF + BZD équivalences HTML, antipsy étoiles PDF + antipsy CPZ HTML + comparatif antipsy HTML, INCAS TUS/TDAH PDF). Design system partagé `shared/ressource-doc.css` pour tous les HTMLs (responsive mobile, dark mode auto, impression).
- ✅ **Traitements** → 2 accordions : **Fiches Patient** (29 HTML, ouvertes par défaut, répartis en 5 catégories Sevrage/TSO/BZD/Psychotropes/Hypnotiques) + **Fiches Expert** (8 PDFs antipsychotiques classés G1 neuroleptiques classiques / G2 atypiques, ouverture `target="_blank"`).
- ✅ **Scores → OUTILS** : Convertisseur BZD (→ diazépam, seuil hospit >40 mg DZP-eq) + **Convertisseur CPZ** (→ chlorpromazine, 14 molécules G1/G2, alerte haute dose >1000 mg CPZ-eq/j, vigilance addicto OH/BZD/opioïdes).
- ✅ **ELSA** → hub : Liaisons en cours (ToDo list + drag-and-drop + checklist), Admission & Orientation, Fiches réflexes (5)
- ✅ Dark mode complet

---

## 7. À FAIRE

- [ ] **Notifications Push V2 — étape suivante** : étendre aux groupes thérapeutiques (rappel 5 min avant pour les patients hospitalisés) et aux séances de thérapie complémentaire. V2 médecins en cours (migration v29 + send-push + SW + UI admin + cron étendu — voir `SETUP_PUSH.md`). V1 shippée v3.99 : events planifiés + messages + permissions + rappels 5 min (events uniquement).
- [ ] **(Priorité basse) Planning A/B stocké en BDD** : aujourd'hui le planning A/B est côté client (`shared/planning-groupes.js`). La V2 Push médecins (cron-reminders) duplique une copie minimale en TS dans l'Edge Function — c'est pragmatique mais ça crée 2 sources de vérité. Migrer le planning dans une table Supabase (ex: `groupes_planning(slug, jour, heure_debut, heure_fin, semaine, actif)`) permettrait au cron de la lire directement et supprimerait la duplication. À faire quand un autre module aura besoin du planning côté serveur.
- [ ] **(Priorité basse) Silence soignant configurable par profil** : aujourd'hui la règle "silence" (semaine après 16h + weekend + fériés France) est hardcodée dans `supabase/functions/send-push/index.ts`. Permettre à chaque soignant de régler ses propres plages horaires depuis le modal Paramètres (colonne `profiles.push_quiet_hours JSONB` par exemple). Liste des jours fériés FR à maintenir chaque année tant qu'on ne calcule pas Pâques dynamiquement.
- [ ] **Formulaire pré-admission** — QR code salle d'attente (identité, couverture, substances, scores AUDIT-C/CAST, ATCD, envoi email, 5 min max)
- [ ] **Annuaire patients** — répertoire post-sortie
- [ ] UI "Mes appareils de confiance" dans paramètres du compte
- [ ] **Livret IFSI — P4** : export PDF du livret rempli à la fin du stage (jsPDF).
- [ ] **(Priorité basse) Toolbox — performances & dark mode instantané** : la Toolbox a ~500 ms de latence au chargement (transpilation Babel in-browser du JSX) et au toggle dark mode (reload de l'iframe forcé car les couleurs sont figées dans les constantes JS `C.n[]`, `C.t[]`…). Fix racine commun : introduire un bundler (Vite ou esbuild) pour pré-compiler le JSX et passer les couleurs en variables CSS (`var(--n-800)` au lieu de `C.n[800]`). Contrevient à la règle "pas de bundler" §9 — à reconsidérer quand la latence deviendra vraiment gênante.
- [ ] **Ressources Toolbox — GitHub Action pour regénérer `index.json`** : aujourd'hui le manifest est maintenu à la main (ajouter un PDF = ajouter une entrée au JSON). Ajouter une Action qui scanne `ressources_doc/fiches|articles|recos|algos/` et regénère `index.json` à chaque push, pour un "vrai" zéro-code workflow. Inférence raisonnable : type depuis le sous-dossier, nom de fichier → titre (humanisé), date = dernière modif git. Garder les overrides `tag` et `meta` dans un YAML frontmatter optionnel dans le nom/fichier si nécessaire.
- [ ] **Toolbox — Fiches Expert hors antipsychotiques** : enrichir `fiches_expert/` avec synthèses cliniques pour les autres familles (BZD, TSO/méthadone-BHD, thymorégulateurs, stimulants, antidépresseurs). Structure d'accordion déjà en place dans `TraitementsView` — il suffit d'ajouter les PDFs et les entrées dans `FICHES_EXPERT_CATS`.

---

## 8. MODULES CLINIQUES V1 (TOOLBOX)

### Accueil Toolbox (staff/toolbox.html, iframe dans admin)

| Carte | Type | Contenu |
|---|---|---|
| **Protocoles USCA** | Hub (grande carte) | → Substances (7 protocoles) + Ressources (manifest-driven, 4 accordions, tags thématiques) |
| **ELSA** | Hub (grande carte) | → Liaisons en cours (ToDo), Admission & Orientation, Fiches réflexes (5) + scores repérage |
| **Dossier post-cure** | Grande carte | → Ouvre le volet médecin (postcure/medecin.html) |
| **Traitements** | Petite carte | 2 accordions : Fiches Patient (29 HTML) + Fiches Expert (8 PDFs antipsychotiques) |
| **Scores** | Petite carte | Cushman, COWS, AUDIT, PHQ-9, GAD-7, convertisseurs BZD et CPZ |
| **Interactions** | Petite carte | 18 interactions critiques, sélection multiple |
| **Feedback** | Barre en bas | Bug, suggestion, correction → email |

### Pharmacopée
- **Sevrage/maintien** : diazépam, oxazépam, baclofène, acamprosate, naltrexone, nalméfène, topiramate, NAC, méthadone, buprénorphine, disulfirame
- **Psychotropes** : méthylphénidate, lisdexamfétamine, sertraline, venlafaxine, vortioxétine, cyamémazine, chlorpromazine, alimémazine
- **Convertisseurs** : BZD → diazépam (seuil hospitalisation >40 mg DZP-eq) · Antipsychotiques → chlorpromazine (alerte haute dose >1000 mg CPZ-eq/j, 14 molécules G1/G2)
- **Non pharmaco** : NADA, hypnose, TRV, tDCS

### Règles cliniques
- Toujours préciser **AMM / hors AMM**
- Toujours indiquer le **niveau de preuve** (A, B, C, D)
- Toujours lister les **contre-indications**

---

## 9. CONVENTIONS DE DÉVELOPPEMENT

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
4. **Faire un commit** et dire **"Push !"** quand c'est prêt
5. Push via GitHub Desktop → Cloudflare Pages redéploie (~30 sec)

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

## 10. CONTACTS & LIENS

| Quoi | Valeur |
|---|---|
| Repo GitHub | https://github.com/jcluisada-cmd/USCA-Assistant |
| Production | https://usca-connect.pages.dev |
| Email | jc.luisada@gmail.com |
| Supabase | pydxfoqxgvbmknzjzecn.supabase.co |
| Affiche équipe | affiche-equipe.html (A4, QR code) |
| **Archive historique** | `CLAUDE_ARCHIVE.md` (à lire à la demande) |
