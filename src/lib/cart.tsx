import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartLine = {
  id: string;
  name_ar: string;
  name_en: string;
  price: number;
  cost_price: number;
  image: string | null;
  stock: number;
  qty: number;
};

type Ctx = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  open: boolean;
  setOpen: (v: boolean) => void;
  add: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (id: string, qty: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "og-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore corrupt cart */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines]);

  const value = useMemo<Ctx>(() => {
    return {
      lines,
      open,
      setOpen,
      count: lines.reduce((s, l) => s + l.qty, 0),
      subtotal: lines.reduce((s, l) => s + l.qty * l.price, 0),
      add: (line, qty = 1) =>
        setLines((prev) => {
          const found = prev.find((l) => l.id === line.id);
          if (found) {
            return prev.map((l) =>
              l.id === line.id ? { ...l, qty: Math.min(l.qty + qty, Math.max(line.stock, 1)) } : l,
            );
          }
          return [...prev, { ...line, qty }];
        }),
      setQty: (id, qty) =>
        setLines((prev) =>
          prev
            .map((l) =>
              l.id === id ? { ...l, qty: Math.max(1, Math.min(qty, Math.max(l.stock, 1))) } : l,
            )
            .filter((l) => l.qty > 0),
        ),
      remove: (id) => setLines((prev) => prev.filter((l) => l.id !== id)),
      clear: () => setLines([]),
    };
  }, [lines, open]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
