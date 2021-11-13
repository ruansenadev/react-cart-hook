import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // const storagedCart = Buscar dados do localStorage

    // if (storagedCart) {
    //   return JSON.parse(storagedCart);
    // }

    return [];
  });

  const addProduct = async (productId: number) => {
    let product: Product, productIndex: number;
    try {
      [product] = (await api.get("products", { params: { id: productId } }))?.data;
      productIndex = cart.findIndex(p => p.id === product.id);
      if (productIndex === -1) {
        product.amount = 1;
        setCart([...cart, product]);
      } else {
        updateProductAmount({ productId: cart[productIndex].id, amount: cart[productIndex].amount + 1 })
      }
    } catch {
      toast.error("O produto não se encontra mais disponível");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const productIndex = cart.findIndex(p => p.id === productId);
      if (productIndex > -1) {
        setCart(cart.slice(0, productIndex).concat(cart.slice(productIndex + 1)));
      } else {
        throw new Error("Este produto não se encontra mais no carrinho");
      }
    } catch(e) {
      if (e instanceof Error) {
        toast.error(e.message);
      }
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    let stock: Stock;
    try {
      if (amount >= 1) {
        [stock] = (await api.get("stock", { params: { id: productId } }))?.data;
        if (stock.amount >= amount) {
          setCart(cart.map(p => {
            if (p.id === productId) { p.amount = amount; }
            return p;
          }));
        } else {
          throw new Error("Não há mais itens em estoque para este produto");
        }
      } else {
        throw new Error("Erro ao atualizar a quantidade");
      }
    } catch (e) {
      if (e instanceof Error) {
        toast.error(e.message);
      }
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
