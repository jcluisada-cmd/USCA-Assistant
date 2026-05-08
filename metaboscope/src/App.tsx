import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { MoleculePage } from './pages/MoleculePage';
import { InteractionPage } from './pages/InteractionPage';
import { AtlasPage } from './pages/AtlasPage';
import { useCart } from './context/CartContext';
import { MOLECULES_BY_ID } from './data';

/**
 * Deep link `?cart=ID1,ID2,...` (chantier C.3 backend, v4.26).
 * Permet aux fiches Toolbox USCA-Connect d'ouvrir MetaboScope avec un panier
 * pré-rempli (ex. depuis fiche méthadone → ouvrir Interactions avec méthadone + co-traitement).
 * Au mount, lit le param, ajoute les IDs valides au cart, redirige vers /interactions.
 */
function CartDeepLinkHandler() {
  const { add } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    const params = new URLSearchParams(location.search);
    const cartParam = params.get('cart');
    if (!cartParam) return;
    handled.current = true;

    const ids = cartParam.split(',').map(s => s.trim()).filter(Boolean);
    let added = 0;
    for (const id of ids) {
      if (MOLECULES_BY_ID.has(id)) {
        add(id);
        added++;
      }
    }
    // Toujours rediriger vers /interactions (panier visible) et nettoyer le param
    // pour éviter une re-injection au refresh.
    if (added > 0) {
      navigate('/interactions', { replace: true });
    } else {
      params.delete('cart');
      const search = params.toString();
      navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true });
    }
  }, [add, location.pathname, location.search, navigate]);

  return null;
}

export default function App() {
  return (
    <>
      <CartDeepLinkHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/search/:id" element={<MoleculePage />} />
          <Route path="/interactions" element={<InteractionPage />} />
          <Route path="/atlas" element={<AtlasPage />} />
          <Route path="*" element={<Navigate to="/search" replace />} />
        </Route>
      </Routes>
    </>
  );
}
