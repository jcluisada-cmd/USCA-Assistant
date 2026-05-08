import { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { OfflineBanner } from './OfflineBanner';
import { DisclaimerModal } from './DisclaimerModal';
import { useCart } from '../context/CartContext';

const TABS = [
  { to: '/',             label: 'Atlas',        end: true },
  { to: '/interactions', label: 'Interactions', end: true },
];

export function Layout() {
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const cart = useCart();
  return (
    <div className="min-h-screen bg-navy-900 text-gray-100">
      <OfflineBanner />

      {/* Tabs haut style navigateur — l'indicateur glisse via grid + transition */}
      <nav aria-label="Modules MetaboScope"
           className="sticky top-0 z-30 border-b border-navy-700 bg-navy-900/95 backdrop-blur">
        <ul className="mx-auto flex max-w-3xl">
          {TABS.map(t => (
            <li key={t.to} className="flex-1">
              <NavLink to={t.to} end={t.end}
                       className={({ isActive }) =>
                         `relative flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold focus-ring transition-colors ${
                           isActive ? 'text-teal-400' : 'text-gray-300 hover:text-gray-100'
                         }`}>
                {({ isActive }) => (
                  <>
                    <span>{t.label}</span>
                    {t.to === '/interactions' && cart.size > 0 && (
                      <span aria-label={`${cart.size} molécule(s) au panier`}
                            className="inline-flex min-w-[1.25rem] justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-bold text-navy-900">
                        {cart.size}
                      </span>
                    )}
                    {/* Indicateur 2px qui glisse en bas */}
                    {isActive && (
                      <span aria-hidden
                            className="absolute inset-x-2 bottom-0 h-0.5 bg-teal-400 transition-all" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main className="mx-auto max-w-3xl px-3 py-4">
        <Outlet />
      </main>

      <footer className="border-t border-navy-700 bg-navy-900 px-3 py-2 text-center text-xs text-gray-500">
        <button type="button" onClick={() => setShowDisclaimer(true)} className="underline hover:text-gray-300 focus-ring">
          Disclaimer
        </button>
      </footer>

      {showDisclaimer && <DisclaimerModal mode="readonly" onClose={() => setShowDisclaimer(false)} />}
    </div>
  );
}
