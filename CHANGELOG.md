# USCA Connect — Changelog

> Une ligne par version. Pour le détail d'une version : voir `CLAUDE_ARCHIVE.md` §B.
> Pour la version courante en détail : voir l'en-tête de `CLAUDE.md`.

## v4.27 — 2026-05-08
Fix dark mode boîtes `.alert`/`.alert.info`/`.alert.crit` dans `shared/ressource-doc.css` — backgrounds amber/teal/red passent en translucide sombre via `--a-50`/`--t-50`/`--r-50` (correctif global : fiches EEG/ECT, ressources, fiches expert).

## v4.26 — 2026-05-08
MetaboScope chantier C : sync dark/light mode USCA (URL param + postMessage live), refonte HomePage par cas d'usage, deep link `?cart=` (préparation liens fiches Toolbox).

## v4.25 — 2026-05-08
Intégration MetaboScope (carte Interactions Toolbox) en iframe + 2 micro-fixes USCA (catch SW hors-scope, meta `mobile-web-app-capable`).

## v4.24 — 2026-05-08
Sync dark mode iframes EEG/ECT ↔ Toolbox global (URL param `?theme=`, détection iframe via `window.self !== window.top`).

## v4.23 — 2026-05-07
Fiche EEG en réanimation (6/6 — batch handbook complet). Vocabulaire ACNS 2021 (LPDs/GPDs/BIPDs).

## v4.22 — 2026-05-06
Fiche Status epilepticus (5/6). Définition ILAE 2015, critères Salzburg, conduite à tenir 4 paliers.

## v4.21 — 2026-05-05
Fiche Activité épileptiforme (4/6). 4 graphoéléments unitaires + patterns groupés généralisés.

## v4.20 — 2026-05-04
Fiche Artefacts (3/6). 3 familles biologique/mécanique/électrique, méthode systématique 3 questions.

## v4.19 — 2026-05-03
Fiche Sommeil (2/6). 5 stades + cycles 90 min, 2 figures Oxford intégrées.

## v4.18 — 2026-05-02
Fiche EEG normal (1/6 du batch handbook). Activité de fond adulte éveillé + variantes physiologiques.

## v4.17 — 2026-04-30
Fiches EEG/ECT en iframe intégré (pattern `selEegFiche`) + fix mise en page fiche ECT (1 colonne permanente).

## v4.16 — 2026-04-29
Fiche pilote EEG « Comprendre un EEG en 10 min » (`fiche_technical.html`, design system partagé `shared/ressource-doc.css`).

## v4.15 — 2026-04-29
Fixes Toolbox post-réorga : carte « Protocoles USCA » court-circuit hub, vue Traitements renommée + accordions Fiches Expert repliables.

## v4.14 — 2026-04-28
Réorga Toolbox V1 (4 grandes + 5 petites cartes) + nouvelle carte EEG/ECT (`fiche_ect.html` Pitié canonique).

## v4.13 — 2026-04-27
Rappels push 9-10 min (au lieu de 4-5) + push 10 min avant atelier aux patients hospitalisés + permissions admin triées chronologiquement + pop-up présence ateliers patient.

## v4.12 — 2026-04-26
Fix modal Paramètres scrollable + pop-up onboarding notifications + retrait notifs craving.

## v4.11 — 2026-04-26
Fix RLS DELETE permissions (migration v35, policy `permissions_delete_auth`).

## v4.10 — 2026-04-25
Notifications push V3 personnalisables (`profiles.push_preferences` JSONB) + permissions modifiables/supprimables + nouveau logo phénix.

## v4.09 — 2026-04-25
Mode paysage activé (`manifest.json: orientation any`).

## v4.08 — 2026-04-25
Fiches substances (16) poussées au patient + fixes PWA install (icon-192) + QCM externe auto-extend + toolbox accordions repliés par défaut.

## v4.07 — 2026-04-27
P5 Personnalisation modules soignant (migration v32 `role_modules_hidden`, modèle « absence = visible »).

## v4.06 — 2026-04-25
Fixes SW : pré-cache de tous les `data/item_*.json` à l'install + `ressources_doc/index.json` en stratégie network-first.

## v4.05 — 2026-04-24
Reclassification fiches patient (Anxiolytiques + split Psychotropes en 4 sous-classes).

## v4.04 — 2026-04-24
Fix RLS `push_subscriptions` (migration v31, SELECT public au lieu d'authenticated).

## v4.03 — 2026-04-24
Push V2 Pause vacances (`profiles.push_pause_until`, migration v30).

## v4.02 — 2026-04-23
Notifications Push V2 : silence soignant (lun-ven 8h30→16h hors fériés) + fix défensif anti-orphelin + garde-fou XOR.

## v4.01 — 2026-04-23
Notifications Push V2 médecins (migration v29, Edge Function `send-push` étendue, modal Paramètres avec toggle activation push, cron-reminders étendu).

## v4.00 — 2026-04-22
Label inclusif patient « Patient·e de 53 ans » (migration v28 `patients.sexe`, F/M/NULL).

## v3.99 — 2026-04-22
Notifications Push patient (migrations v25-v27, Edge Functions Supabase, VAPID, pg_cron rappels 5 min) + page Paramètres patient + QCM tuteur : voir toutes les réponses.

## v3.98 — 2026-04-21
Agenda perso privé par soignant (migration v24) + accordions Planning/Dashboard repliables + Toolbox Ressources « Fiches » replié + correctifs QCM externe / badges messages / DDN / adressage libre.

## v3.97 — 2026-04-21
Fix animateurs fantômes : migration v23 FK `groupe_animateurs → profiles(CASCADE)` + policy DELETE admin + alerte bloquante si suppression Auth échoue.

## v3.86 — 2026-04-20
Messages bidirectionnels patient ↔ équipe (migration v21, convention `cree_par IS NULL` = patient, chat-style).

## v3.85 — 2026-04-20
Carte « Ressources » dans Toolbox (3 accordions Fiches/Articles/Recos, tags thématiques colorés).

## v3.84 — 2026-04-20
Nettoyage Toolbox : suppression « Checklist Séjour J1-J12 » et « Comorbidités psy ».

## v3.83 — 2026-04-20
Bouton ↺ réinitialisation externe + extraction historique CLAUDE.md → CLAUDE_ARCHIVE.md.

## v3.82 — 2026-04-19/20
Refonte extern en 3 onglets (Dashboard / Toolbox / Planning).

## v3.75 — 2026-04-19
Mon externe section admin + accordion Mes élèves unifié + QCM simplifié (sélection item séquentiel).

## v3.71 — 2026-04-19
Module QCM EDN externe (4 tables migration v17 locale, lazy-load 477 questions, dashboard externe).

## v3.70 — 2026-04-17 (nuit)
Fix programme patient (timeline) + Dashboard sorties enrichi (migration v15 `sortie_info`) + Module Livret IFSI P1 complète (migration v16, 14 chapitres, vue tuteur).

## v3.64 — 2026-04-17 (soir)
Fix critique accolade orpheline `admin/index.html` + fix closure Staff Psy + fix post-cure patient + fix DB `updatePostcureStatut`.

## v3.53 — 2026-04-17 (nuit)
Réorga Toolbox 3 grandes + 3 petites + Protocoles USCA hub + ELSA hub + Liaisons drag-and-drop + Entrées/Sorties + Planning dynamique + Exports PDF/HTML + Post-cure P8 (séparation patient/médecin, 100% local non-HDS).

## v3.37 — 2026-04-16 (soir)
P1-P9 batch : modals, déconnexion, Planning A+B, Ateliers patient, App exportée v3, Auth avancée P9 (device tokens, Cloudflare Function, WebView iOS).

## v3.25 et avant
Voir `CLAUDE_ARCHIVE.md` §A bugs historiques. Versions antérieures non listées individuellement.
