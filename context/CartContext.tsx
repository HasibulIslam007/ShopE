"use client";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { Product } from "@/lib/products";
type CartLine = { product: Product; quantity: number };
type CartValue = { items: CartLine[]; add: (product: Product) => void; remove: (id:string) => void; update: (id:string, quantity:number) => void; clear: () => void; count:number; total:number };
const Cart = createContext<CartValue | null>(null);
export function CartProvider({children}:{children:React.ReactNode}) {
  const [items,setItems]=useState<CartLine[]>([]);
  const [hydrated,setHydrated]=useState(false);

  useEffect(()=>{
    try {
      const saved=localStorage.getItem("shope-cart");
      if (saved) {
        const parsed=JSON.parse(saved) as CartLine[];
        if (Array.isArray(parsed)) setItems(parsed.filter((item)=>item?.product?.id && item.quantity > 0));
      }
    } catch {
      localStorage.removeItem("shope-cart");
    } finally {
      setHydrated(true);
    }
  },[]);

  useEffect(()=>{ if (hydrated) localStorage.setItem("shope-cart",JSON.stringify(items)); },[hydrated,items]);
  const value=useMemo(()=>({
    items,
    add:(product:Product)=>setItems(x=>{const found=x.find(i=>i.product.id===product.id); return found?x.map(i=>i.product.id===product.id?{...i,quantity:i.quantity+1}:i):[...x,{product,quantity:1}]}),
    remove:(id:string)=>setItems(x=>x.filter(i=>i.product.id!==id)),
    update:(id:string,quantity:number)=>setItems(x=>quantity<1?x.filter(i=>i.product.id!==id):x.map(i=>i.product.id===id?{...i,quantity}:i)),
    clear:()=>setItems([]),
    count:items.reduce((a,i)=>a+i.quantity,0),
    total:items.reduce((a,i)=>a+i.quantity*i.product.price,0)
  }),[items]);
  return <Cart.Provider value={value}>{children}</Cart.Provider>;
}
export function useCart(){const value=useContext(Cart); if(!value) throw new Error("useCart must be inside CartProvider"); return value;}