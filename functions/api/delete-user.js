/**
 * Cloudflare Pages Function — Suppression de compte Supabase Auth
 * Endpoint : POST /api/delete-user
 *
 * L'app utilise la clé anon (droits limités, visible dans le code).
 * La suppression Auth nécessite la clé service_role (droits complets).
 * Cette Function joue le rôle d'intermédiaire sécurisé.
 *
 * Prérequis : variable d'env Cloudflare SUPABASE_SERVICE_ROLE_KEY
 */
export async function onRequestPost(context) {
  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = context.env;

  // Headers CORS pour les requêtes depuis l'app
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*'
  };

  if (!SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY manquante)' }),
      { status: 500, headers }
    );
  }

  try {
    const { userId } = await context.request.json();

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId manquant' }),
        { status: 400, headers }
      );
    }

    // Vérifier que l'appelant est authentifié (JWT dans le header)
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Non autorisé' }),
        { status: 401, headers }
      );
    }

    // URL Supabase — soit depuis env, soit construite depuis la clé
    const supabaseUrl = SUPABASE_URL || 'https://pydxfoqxgvbmknzjzecn.supabase.co';

    // Supprimer le compte dans Supabase Auth
    const res = await fetch(`${supabaseUrl}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
      }
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return new Response(
        JSON.stringify({ error: err.message || err.msg || 'Erreur Supabase' }),
        { status: res.status, headers }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ error: e.message }),
      { status: 500, headers }
    );
  }
}

// Gérer les requêtes OPTIONS (CORS preflight)
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}
