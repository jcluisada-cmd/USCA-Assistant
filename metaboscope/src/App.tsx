import { useEffect, useRef } from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation, useParams } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AtlasPage } from './pages/AtlasPage';
import { InteractionPage } from './pages/InteractionPage';
import { MoleculeDetailModal } from './components/MoleculeDetailModal';
import { useCart } from './context/CartContext';
import { MOLECULES_BY_ID } from './data';

/**
 * Deep link `?cart=ID1,ID2,...` (chantier C.3 v4.26).
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

/** Redirige les vieilles URLs `/search/:id` vers `/?molecule=:id` (modal). */
function LegacyMoleculeRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/" replace />;
  return <Navigate to={`/?molecule=${encodeURIComponent(id)}`} replace />;
}

export default function App() {
  return (
    <>
      <CartDeepLinkHandler />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<AtlasPage />} />
          <Route path="/interactions" element={<InteractionPage />} />
          {/* Compat ascendante */}
          <Route path="/search" element={<Navigate to="/" replace />} />
          <Route path="/search/:id" element={<LegacyMoleculeRedirect />} />
          <Route path="/atlas" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
      {/* Le modal molécule lit ?molecule=ID dans l'URL et s'affiche par-dessus n'importe quelle route */}
      <MoleculeDetailModal />
    </>
  );
}
