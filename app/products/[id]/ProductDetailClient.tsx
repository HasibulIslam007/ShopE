"use client";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { Product } from "@/lib/products";

export function ProductDetailClient({ product }: { product: Product }) {
  const { add } = useCart();
  return (
    <main className="mx-auto grid max-w-7xl gap-12 px-6 pb-24 pt-10 md:grid-cols-2 md:px-10 md:pt-16">
      <div className="relative aspect-square overflow-hidden rounded-[2.5rem]" style={{ backgroundColor: product.color }}>
        <Image src={product.image} alt={product.name} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      <div className="flex flex-col justify-center">
        <Link href="/products" className="mb-12 text-sm text-ink/55">← Back to collection</Link>
        <p className="text-xs font-bold uppercase tracking-[.2em] text-coral">{product.category}</p>
        <h1 className="mt-4 text-5xl font-black tracking-[-.07em] md:text-7xl">{product.name}</h1>
        <p className="mt-5 text-2xl">${product.price}</p>
        <p className="mt-8 max-w-md text-lg leading-8 text-ink/65">{product.description}</p>
        <button onClick={() => add(product)} className="mt-10 w-fit rounded-full bg-ink px-8 py-4 font-bold text-white hover:bg-coral">
          Add to bag <span className="ml-8">↗</span>
        </button>
        <div className="mt-12 border-t border-ink/15 pt-5 text-sm text-ink/60">
          <p>Free shipping over $100</p>
          <p className="mt-2">Thoughtfully packed and easy returns</p>
        </div>
      </div>
    </main>
  );
}
