import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { MoleculePage } from './pages/MoleculePage';
import { InteractionPage } from './pages/InteractionPage';
import { AtlasPage } from './pages/AtlasPage';

export default function App() {
  return (
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
  );
}
