# Fix — Authentification Supabase (complet v2)

## Résumé des problèmes à corriger

1. Safari / Firefox : connexion échoue silencieusement ou messages d'erreur génériques
2. Appareils de confiance : éviter de retaper email+mdp à chaque ouverture
3. Bouton "Supprimer un compte" admin : ne fait rien (explication ci-dessous)
4. QR code iOS : ouvre dans un WebView sans styles
5. Erreurs réseau mal distinguées des erreurs d'identifiants

---

## Explication importante — Pourquoi le bouton Supprimer ne fonctionne pas

L'app utilise la clé `anon` Supabase pour toutes ses communications. Cette clé est
intentionnellement limitée — elle est visible dans le code source de l'app, donc
si elle avait des droits de suppression, n'importe qui pourrait l'extraire et
supprimer tous les comptes.

La suppression de comptes Auth nécessite la clé `service_role` (droits complets).
Cette clé ne peut jamais être dans le code de l'app — elle doit rester sur un serveur.

Le rôle "admin" dans la table `profiles` donne accès à des écrans supplémentaires
dans l'interface, mais n'élève pas les droits Supabase — l'app reste techniquement
un client `anon` quel que soit le rôle de l'utilisateur connecté.

**Solution** : une Cloudflare Pages Function joue le rôle d'intermédiaire sécurisé.
L'app envoie la demande de suppression à la Function → la Function utilise la
`service_role` key stockée dans les variables d'environnement Cloudflare (jamais
dans le code) → Supabase supprime le compte.

Résultat pour l'admin : le bouton "Supprimer" fonctionne normalement depuis
l'app mobile, de façon transparente.

---

## 1. `shared/supabase.js` — Client avec fallback storage

```javascript
// Détection du storage disponible
// localStorage = persistant → appareils de confiance fonctionnent
// sessionStorage = fallback si Safari très restrictif ou navigation privée
//   → dans ce cas l'utilisateur devra retaper email+mdp à chaque ouverture
//   → comportement dégradé mais fonctionnel, Chrome/Safari normal non affectés
const safeStorage = (() => {
  try {
    localStorage.setItem('_usca_test', '1');
    localStorage.removeItem('_usca_test');
    return localStorage;
  } catch {
    console.warn('[USCA] localStorage inaccessible → fallback sessionStorage (Safari restrictif ou navigation privée)');
    return sessionStorage;
  }
})();

// Exposer pour que auth.js sache si les appareils de confiance sont disponibles
const hasLocalStorage = safeStorage === localStorage;

const supabase = supabaseClient.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: safeStorage,
    storageKey: 'usca-auth-v2',
    flowType: 'pkce',        // plus robuste sur Safari
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true
  }
});
```

---

## 2. `shared/auth.js` — Authentification complète

### 2A. Messages d'erreur précis

```javascript
function getAuthErrorMessage(error) {
  if (!error) return null;

  const msg = error.message?.toLowerCase() || '';
  const status = error.status;

  // Erreur réseau : Firefox tracking protection, WebView, hors-ligne
  if (
    msg.includes('fetch') ||
    msg.includes('network') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    error instanceof TypeError
  ) {
    return {
      type: 'network',
      texte: 'Impossible de contacter le serveur. Vérifiez votre connexion. ' +
             'Sur Firefox : désactivez la protection renforcée contre le pistage.'
    };
  }

  // Identifiants incorrects
  if (
    msg.includes('invalid login') ||
    msg.includes('invalid credentials') ||
    msg.includes('email not confirmed') ||
    status === 400
  ) {
    return {
      type: 'credentials',
      texte: 'Email ou mot de passe incorrect.'
    };
  }

  // Compte inexistant
  if (msg.includes('user not found') || status === 404) {
    return {
      type: 'not_found',
      texte: 'Aucun compte trouvé avec cet email.'
    };
  }

  // Trop de tentatives
  if (msg.includes('too many') || status === 429) {
    return {
      type: 'rate_limit',
      texte: 'Trop de tentatives. Attendez quelques minutes avant de réessayer.'
    };
  }

  // Erreur serveur Supabase
  if (status >= 500) {
    return {
      type: 'server',
      texte: 'Erreur serveur temporaire. Réessayez dans quelques instants.'
    };
  }

  // Fallback avec message brut pour faciliter le débogage
  return {
    type: 'unknown',
    texte: `Erreur de connexion (${error.message || 'inconnue'}). Contactez l'administrateur.`
  };
}
```

### 2B. Fonction de login principale

```javascript
async function loginStaff(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }

    // Connexion réussie → enregistrer l'appareil de confiance silencieusement
    // Uniquement si localStorage disponible (pas en navigation privée)
    if (hasLocalStorage) {
      await enregistrerAppareilConfiance(data.user.id);
    }

    return { success: true, user: data.user };

  } catch (e) {
    // TypeError = erreur réseau (fetch bloqué par le navigateur)
    return { success: false, error: getAuthErrorMessage(e) };
  }
}
```

### 2C. Auto-login via appareil de confiance

```javascript
// Appelé au chargement de l'app, avant d'afficher l'écran de login
// Si l'appareil est reconnu → connexion silencieuse, l'utilisateur arrive
// directement sur le dashboard sans rien taper
async function tentativeAutoLogin() {
  // Impossible sans localStorage (sessionStorage ne persiste pas entre sessions)
  if (!hasLocalStorage) return false;

  const token = localStorage.getItem('usca-device-token');
  if (!token) return false;

  try {
    const { data, error } = await supabase
      .from('device_tokens')
      .select('user_id, expires_at, appareil')
      .eq('token', token)
      .single();

    if (error || !data) {
      localStorage.removeItem('usca-device-token');
      return false;
    }

    // Token expiré (90 jours) → retour au login classique
    if (new Date(data.expires_at) < new Date()) {
      localStorage.removeItem('usca-device-token');
      await supabase.from('device_tokens').delete().eq('token', token);
      return false;
    }

    // Mettre à jour la date de dernière utilisation
    await supabase
      .from('device_tokens')
      .update({ derniere_utilisation: new Date().toISOString() })
      .eq('token', token);

    // Vérifier si la session Supabase est encore valide
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData?.session) {
      return { success: true, user: sessionData.session.user };
    }

    // Session expirée mais token valide → tenter un refresh
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      localStorage.removeItem('usca-device-token');
      return false;
    }

    return { success: true, user: refreshData.user };

  } catch (e) {
    return false;
  }
}
```

### 2D. Enregistrement silencieux de l'appareil de confiance

```javascript
const MAX_APPAREILS = 5;

function getAppareilLabel() {
  const ua = navigator.userAgent;
  if (/iPhone/.test(ua)) return 'iPhone';
  if (/iPad/.test(ua)) return 'iPad';
  if (/Android/.test(ua) && /Mobile/.test(ua)) return 'Android Mobile';
  if (/Android/.test(ua)) return 'Android Tablette';
  if (/Mac/.test(ua)) return 'Mac';
  if (/Windows/.test(ua)) return 'Windows';
  return 'Appareil inconnu';
}

function genererToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function enregistrerAppareilConfiance(userId) {
  try {
    // Compter les appareils existants
    const { data: existants } = await supabase
      .from('device_tokens')
      .select('id, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    // Si déjà 5 appareils → supprimer le plus ancien silencieusement
    if (existants && existants.length >= MAX_APPAREILS) {
      await supabase
        .from('device_tokens')
        .delete()
        .eq('id', existants[0].id);
    }

    const token = genererToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 90); // expire après 90 jours

    await supabase.from('device_tokens').insert({
      user_id: userId,
      token,
      appareil: getAppareilLabel(),
      expires_at: expiresAt.toISOString()
    });

    localStorage.setItem('usca-device-token', token);

  } catch (e) {
    // Échec silencieux — l'utilisateur est connecté, l'enregistrement est secondaire
    console.warn('[USCA] Enregistrement appareil de confiance échoué :', e);
  }
}
```

### 2E. Déconnexion

```javascript
async function logout() {
  const token = localStorage.getItem('usca-device-token');

  // Révoquer uniquement le token de cet appareil
  if (token) {
    await supabase.from('device_tokens').delete().eq('token', token);
    localStorage.removeItem('usca-device-token');
  }

  await supabase.auth.signOut();
}
```

---

## 3. SQL Supabase — Table `device_tokens`

À exécuter dans **Supabase → SQL Editor** :

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
CREATE INDEX idx_device_tokens_user_id ON device_tokens(user_id);

ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Chaque soignant ne voit que ses propres appareils
CREATE POLICY "device_tokens_own" ON device_tokens
  FOR ALL USING (auth.uid() = user_id);
```

---

## 4. Interface de gestion des appareils (paramètres du compte)

```javascript
async function chargerMesAppareils() {
  const tokenCourant = localStorage.getItem('usca-device-token');

  const { data } = await supabase
    .from('device_tokens')
    .select('id, token, appareil, derniere_utilisation, expires_at')
    .order('derniere_utilisation', { ascending: false });

  return data?.map(d => ({
    ...d,
    estCetAppareil: d.token === tokenCourant
  }));
}

async function supprimerAppareil(tokenId, estCetAppareil) {
  await supabase.from('device_tokens').delete().eq('id', tokenId);
  if (estCetAppareil) {
    localStorage.removeItem('usca-device-token');
    window.location.href = '/staff/';
  }
  await chargerMesAppareils();
}

async function supprimerTousLesAppareils() {
  const { data: { user } } = await supabase.auth.getUser();
  await supabase.from('device_tokens').delete().eq('user_id', user.id);
  localStorage.removeItem('usca-device-token');
  window.location.href = '/staff/';
}
```

Affichage suggéré dans les paramètres :
```
Mes appareils de confiance (3/5)

📱 iPhone        — cet appareil — il y a 2 min    [Supprimer]
💻 Mac           — il y a 2 jours                 [Supprimer]
📱 Android       — il y a 5 jours                 [Supprimer]

[Se déconnecter de tous les appareils]
```

---

## 5. `functions/api/delete-user.js` — Suppression de compte admin

Cette Function permet au bouton "Supprimer" de l'interface admin de fonctionner
depuis l'app mobile. Elle joue le rôle d'intermédiaire sécurisé entre l'app
(clé anon, droits limités) et Supabase (clé service_role, droits complets).

```javascript
// functions/api/delete-user.js
export async function onRequestPost(context) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = context.env;

  try {
    const { userId } = await context.request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId manquant' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Vérifier que l'appelant est authentifié (JWT dans le header)
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Supprimer dans Supabase Auth avec la service_role key (côté serveur uniquement)
    const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: err.message || 'Erreur Supabase' }),
        { status: res.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
```

Côté client admin — remplacer le bouton supprimer par :

```javascript
async function supprimerCompte(userId, nomAffiche) {
  if (!confirm(`Supprimer définitivement le compte de ${nomAffiche} ?`)) return;

  const { data: { session } } = await supabase.auth.getSession();

  try {
    const res = await fetch('/api/delete-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId })
    });

    const result = await res.json();

    if (!res.ok) {
      afficherErreur(`Impossible de supprimer le compte : ${result.error}`);
      return;
    }

    afficherSucces('Compte supprimé.');
    await chargerListeUtilisateurs();

  } catch (e) {
    afficherErreur('Erreur réseau lors de la suppression.');
  }
}
```

---

## 6. Détection WebView iOS — Bannière automatique

Ajouter dans le `<head>` de toutes les pages (ou dans un fichier partagé).
Un seul QR code pour Android et iOS — la bannière s'affiche automatiquement
uniquement quand nécessaire (WebView iOS).

```javascript
function estDansWebViewiOS() {
  const ua = navigator.userAgent;
  const esiOS = /iPhone|iPad|iPod/.test(ua);
  const estSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return esiOS && !estSafari;
}

if (estDansWebViewiOS()) {
  document.body.insertAdjacentHTML('afterbegin', `
    <div style="
      background: #f0b429;
      padding: 14px 16px;
      text-align: center;
      font-size: 13px;
      font-weight: 700;
      font-family: system-ui, sans-serif;
      position: relative;
      z-index: 9999;
    ">
      📱 Pour utiliser l'app correctement :<br>
      Appui long sur le lien → <strong>Ouvrir dans Safari</strong>
    </div>
  `);
}
```

---

## 7. `sw.js` — Incrémenter la version

⚠️ OBLIGATOIRE à chaque déploiement. Sans ça, les utilisateurs gardent
l'ancienne version en cache (c'est pour cette raison que la collègue
ne pouvait pas se connecter — elle avait la V1 sans auth servie par
l'ancien Service Worker).

```javascript
const CACHE_NAME = 'usca-v1.4'; // ← incrémenter ici
```

---

## 8. Actions manuelles dans Supabase Dashboard (une seule fois)

### Désactiver la confirmation email
- **Authentication → Settings**
- Désactiver **"Enable email confirmations"**
- Sauvegarder

### Créer les comptes soignants sans déclencher d'email
- **Authentication → Users → Add user → Create new user**
- Saisir email + mot de passe
- Cocher **"Auto Confirm User"**
- Répéter pour chaque soignant

### Ajouter la variable d'environnement Cloudflare
- **Cloudflare Pages → Settings → Environment variables → Production**
- Ajouter : `SUPABASE_SERVICE_ROLE_KEY` = (valeur dans Supabase → Settings → API)
- ⚠️ Ne jamais copier cette clé dans le code source

---

## Récapitulatif des fichiers à modifier / créer

| Fichier | Action |
|---|---|
| `shared/supabase.js` | Modifier : safeStorage + flowType pkce |
| `shared/auth.js` | Modifier : loginStaff, tentativeAutoLogin, enregistrerAppareilConfiance, getAuthErrorMessage, logout |
| `functions/api/delete-user.js` | Créer : proxy suppression compte admin |
| Toutes les pages HTML | Ajouter : détection WebView iOS (script inline) |
| `sw.js` | Modifier : CACHE_NAME → usca-v1.4 |
| Supabase SQL Editor | Exécuter : CREATE TABLE device_tokens + RLS |
| Cloudflare env vars | Ajouter : SUPABASE_SERVICE_ROLE_KEY |
| Supabase Dashboard Auth Settings | Désactiver confirmation email |
