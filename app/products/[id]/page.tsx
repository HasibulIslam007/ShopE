import { notFound } from "next/navigation";
import { connectDB } from "@/lib/db";
import { ensureCatalogSeeded } from "@/lib/catalog";
import { isValidObjectId } from "@/lib/api-response";
import Product from "@/models/Product";
import { ProductDetailClient } from "./ProductDetailClient";

type ProductWithCategory = {
  _id: { toString: () => string };
  slug: string;
  name: string;
  categoryId: { name: string; slug: string } | null;
  price: number;
  imagePath: string;
  description: string;
  isFeatured: boolean;
};

export async function generateStaticParams() {
  if (!process.env.MONGODB_URI) return [];
  await connectDB();
  await ensureCatalogSeeded();
  const products = await Product.find({}).select("slug").lean();
  return products.map((p) => ({ id: p.slug }));
}

export default async function DetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  if (!process.env.MONGODB_URI) {
    return (
      <main className="mx-auto max-w-7xl px-6 pb-24 pt-12 md:px-10">
        <div className="rounded-[2rem] bg-amber-50 p-8 text-center">
          <p className="text-amber-800">Database not configured. Please set MONGODB_URI in .env.local</p>
        </div>
      </main>
    );
  }

  await connectDB();
  await ensureCatalogSeeded();

  const product = (await Product.findOne(
    isValidObjectId(id) ? { $or: [{ slug: id }, { _id: id }] } : { slug: id },
  ).populate("categoryId", "name slug").lean()) as unknown as ProductWithCategory | null;

  if (!product) {
    notFound();
  }

  return (
    <ProductDetailClient
      product={{
        id: product.slug,
        name: product.name,
        category: product.categoryId?.name || "Unknown",
        price: product.price,
        color: "#f6f5ef",
        image: product.imagePath,
        description: product.description,
        isNew: product.isFeatured,
      }}
    />
  );
}
