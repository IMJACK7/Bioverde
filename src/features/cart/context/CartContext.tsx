
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import type { CartItem } from "../types/cart.types";

interface CartContextValue {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  updateQuantity: (
    id: string,
    quantity: number
  ) => void;
  totalItems: number;
  totalPrice: number;
  isReady: boolean;
}

const STORAGE_KEY = "bioverde-cart";

const CartContext = createContext<
  CartContextValue | undefined
>(undefined);

// Validar el límite local conocido de un artículo.
function getMaxQuantity(item: CartItem): number {
  if (
    item.maxStock !== undefined &&
    Number.isSafeInteger(item.maxStock) &&
    item.maxStock >= 0
  ) {
    return item.maxStock;
  }

  // Los artículos sin límite registrado no pueden
  // validarse contra inventario desde este contexto.
  return Number.MAX_SAFE_INTEGER;
}

function clampQuantity(
  item: CartItem,
  quantity: number
): number {
  return Math.max(
    0,
    Math.min(quantity, getMaxQuantity(item))
  );
}

function readStoredCart(): CartItem[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);

    if (!stored) {
      return [];
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    // Validación básica del formato almacenado.
    return parsed.filter(
      (item): item is CartItem =>
        typeof item === "object" &&
        item !== null &&
        typeof item.id === "string" &&
        typeof item.name === "string" &&
        Number.isSafeInteger(item.quantity) &&
        item.quantity > 0 &&
        typeof item.unitPrice === "number" &&
        Number.isFinite(item.unitPrice) &&
        item.unitPrice >= 0 &&
        (item.type === "PRODUCT" ||
          item.type === "PREBUILT_KIT" ||
          item.type === "CUSTOM_KIT")
    ).map((item) => ({
      ...item,
      quantity: clampQuantity(
        item,
        item.quantity
      ),
    })).filter((item) => item.quantity > 0);
  } catch {
    return [];
  }
}

export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Recuperar el carrito guardado.
  useEffect(() => {
    setItems(readStoredCart());
    setIsReady(true);
  }, []);

  // Persistir cambios después de la carga inicial.
  useEffect(() => {
    if (!isReady) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch {
      // El almacenamiento podría no estar disponible.
    }
  }, [items, isReady]);

  // Agregar productos sin superar el límite conocido.
  const addItem = (item: CartItem) => {
    if (
      !Number.isSafeInteger(item.quantity) ||
      item.quantity <= 0 ||
      !Number.isFinite(item.unitPrice) ||
      item.unitPrice < 0
    ) {
      return;
    }

    setItems((previous) => {
      const existing = previous.find(
        (current) => current.id === item.id
      );

      if (existing) {
        return previous.map((current) => {
          if (current.id !== item.id) {
            return current;
          }

          const updatedItem: CartItem = {
            ...current,
            maxStock: item.maxStock ?? current.maxStock,
          };

          const nextQuantity = clampQuantity(
            updatedItem,
            current.quantity + item.quantity
          );

          return {
            ...updatedItem,
            quantity: nextQuantity,
          };
        });
      }

      const safeQuantity = clampQuantity(
        item,
        item.quantity
      );

      if (safeQuantity === 0) {
        return previous;
      }

      return [
        ...previous,
        {
          ...item,
          quantity: safeQuantity,
        },
      ];
    });
  };

  const removeItem = (id: string) => {
    setItems((previous) =>
      previous.filter((item) => item.id !== id)
    );
  };

  // Actualizar cantidad respetando el límite conocido.
  const updateQuantity = (
    id: string,
    quantity: number
  ) => {
    if (!Number.isSafeInteger(quantity)) {
      return;
    }

    if (quantity <= 0) {
      removeItem(id);
      return;
    }

    setItems((previous) =>
      previous.map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          quantity: clampQuantity(
            item,
            quantity
          ),
        };
      }).filter((item) => item.quantity > 0)
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalItems = items.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const totalPrice = items.reduce(
    (sum, item) =>
      sum + item.unitPrice * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        clearCart,
        updateQuantity,
        totalItems,
        totalPrice,
        isReady,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart debe utilizarse dentro de CartProvider"
    );
  }

  return context;
}
