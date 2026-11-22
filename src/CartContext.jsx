import { createContext, useContext, useEffect, useMemo, useState } from "react";

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cart") || "[]"); } catch { return []; }
  });
  useEffect(() => {
    try { localStorage.setItem("cart", JSON.stringify(cart)); } catch (_) {}
  }, [cart]);

  const api = useMemo(() => ({
    cart,
    count: cart.reduce((s, l) => s + l.qty, 0),
    total: cart.reduce((s, l) => s + l.unit * l.qty, 0),
    add: (line) => setCart((c) => {
      const ex = c.find((l) => l.key === line.key);
      if (ex) return c.map((l) => (l.key === line.key ? { ...l, qty: Math.min(50, l.qty + line.qty) } : l));
      return [...c, line];
    }),
    change: (key, d) => setCart((c) => c.map((l) => (l.key === key ? { ...l, qty: Math.min(50, l.qty + d) } : l)).filter((l) => l.qty > 0)),
    remove: (key) => setCart((c) => c.filter((l) => l.key !== key)),
    clear: () => setCart([]),
  }), [cart]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}
