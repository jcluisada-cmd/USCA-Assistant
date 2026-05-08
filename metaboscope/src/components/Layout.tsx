import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { OfflineBanner } from './OfflineBanner';
import { DisclaimerModal } from './DisclaimerModal';
import { useCart } from '../context/CartContext';

const TABS = [
  { to: '/search',       label: 'Recherche',     icon: '🔍' },
  { to: '/interactions', label: 'Interactions',  icon: '⚖️' },
  { to: '/atlas',        label: 'Atlas',         icon: '📊' },
];

export function Layout() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const cart = useCart();
  return (
    <div className="min-h-screen bg-navy-900 text-gray-100">
      <OfflineBanner />
      <main className="mx-auto max-w-3xl px-3 pt-4 pb-24 sm:pb-4">
        <Outlet />
      </main>
      <nav aria-label="Navigation principale"
           className="fixed inset-x-0 bottom-0 z-30 border-t border-navy-700 bg-navy-900/95 backdrop-blur sm:static sm:border-none sm:bg-transparent">
        <ul className="mx-auto flex max-w-3xl items-stretch sm:items-center sm:justify-center sm:gap-2 sm:py-2">
          {TABS.map(t => (
            <li key={t.to} className="flex-1 sm:flex-none">
              <NavLink to={t.to} end={t.to === '/search' ? false : true}
                       className={({ isActive }) =>
                         `flex flex-col items-center justify-center gap-0.5 px-2 py-2 text-xs font-medium focus-ring sm:flex-row sm:gap-2 sm:rounded-md sm:px-4 sm:py-2 ${
                           isActive ? 'text-teal-400 sm:bg-teal-600/20' : 'text-gray-300 hover:text-gray-100'
                         }`}>
                <span aria-hidden>{t.icon}</span>
                <span>{t.label}</span>
                {t.to === '/interactions' && cart.size > 0 && (
                  <span aria-label={`${cart.size} molécules`}
                        className="ml-1 inline-flex min-w-[1.25rem] justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-navy-900">
                    {cart.size}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <footer className="border-t border-navy-700 bg-navy-900 px-3 py-2 text-center text-xs text-gray-500 sm:py-3">
        <button type="button" onClick={() => setShowDisclaimer(true)} className="underline hover:text-gray-300 focus-ring">
          Disclaimer
        </button>
      </footer>
      {showDisclaimer && <DisclaimerModal mode="readonly" onClose={() => setShowDisclaimer(false)} />}
    </div>
  );
}
