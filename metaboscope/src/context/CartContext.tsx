import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const SOFT_LIMIT = 6;

interface CartContextValue {
  ids: Set<string>;
  add: (id: string) => void;
  remove: (id: string) => void;
  clear: () => void;
  size: number;
  /** True quand size > SOFT_LIMIT — UI doit afficher un avertissement */
  overSoftLimit: boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<Set<string>>(() => new Set());

  const add = useCallback((id: string) => {
    setIds(prev => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const remove = useCallback((id: string) => {
    setIds(prev => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const clear = useCallback(() => setIds(new Set()), []);

  return (
    <CartContext.Provider value={{ ids, add, remove, clear, size: ids.size, overSoftLimit: ids.size > SOFT_LIMIT }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart doit être utilisé dans <CartProvider>');
  return ctx;
}
