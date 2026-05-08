import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import { DisclaimerProvider } from './context/DisclaimerContext';
import { DisclaimerGate } from './components/DisclaimerGate';
import './index.css';

// Thème synchronisé avec l'hôte USCA-Connect via deux canaux :
//   1) URL param ?theme=light|dark au boot (sync initial — pattern v4.24 EEG/ECT)
//   2) postMessage({ type: 'usca-theme', dark: bool }) live depuis shared/theme.js (sync à chaud)
// Defaut = dark (palette navy/teal historique de MetaboScope).
function applyTheme(theme: 'light' | 'dark') {
  const html = document.documentElement;
  html.classList.remove('theme-light', 'theme-dark');
  html.classList.add(theme === 'light' ? 'theme-light' : 'theme-dark');
}

const initialTheme = new URLSearchParams(window.location.search).get('theme') === 'light' ? 'light' : 'dark';
applyTheme(initialTheme);

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'usca-theme' && typeof e.data.dark === 'boolean') {
    applyTheme(e.data.dark ? 'dark' : 'light');
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DisclaimerProvider>
      <CartProvider>
        <DisclaimerGate>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </DisclaimerGate>
      </CartProvider>
    </DisclaimerProvider>
  </React.StrictMode>
);
