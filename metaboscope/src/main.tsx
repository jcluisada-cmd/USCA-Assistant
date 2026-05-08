import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { CartProvider } from './context/CartContext';
import { DisclaimerProvider } from './context/DisclaimerContext';
import { DisclaimerGate } from './components/DisclaimerGate';
import './index.css';

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
