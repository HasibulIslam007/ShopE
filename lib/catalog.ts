import { connectDB } from "@/lib/db";
import { products as seedProducts } from "@/lib/products";
import Category from "@/models/Category";
import Product from "@/models/Product";

export async function ensureCatalogSeeded() {
  await connectDB();
  if (await Product.exists({})) return;
  const categoryNames = [...new Set(seedProducts.map((product) => product.category))];
  const categories = new Map<string, string>();
  for (const name of categoryNames) {
    const category = await Category.findOneAndUpdate(
      { slug: name.toLowerCase().replace(/\s+/g, "-") },
      { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    categories.set(name, category.id);
  }
  await Product.insertMany(seedProducts.map((product) => ({
    categoryId: categories.get(product.category), slug: product.id, name: product.name,
    description: product.description, price: product.price, stockQty: 100,
    imagePath: product.image, isFeatured: Boolean(product.isNew),
  })));
}