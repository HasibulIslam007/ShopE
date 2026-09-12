import { ProductCard } from "@/components/ProductCard";
import { connectDB } from "@/lib/db";
import { ensureCatalogSeeded } from "@/lib/catalog";
import Product from "@/models/Product";
import Category from "@/models/Category";

type LeanProduct = {
  _id: { toString: () => string };
  slug: string;
  name: string;
  categoryId: { name: string; slug: string } | null;
  price: number;
  imagePath: string;
  description: string;
  isFeatured: boolean;
};

type LeanCategory = {
  _id: { toString: () => string };
  name: string;
  slug: string;
};

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  const params = await searchParams;
  const selected = params.category || "All pieces";
  const query = (params.q || "").trim();

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

  const categories = (await Category.find({}).sort({ name: 1 }).lean()) as unknown as LeanCategory[];
  const categoryMap = new Map(categories.map((c) => [c.slug, c.name]));

  let products: LeanProduct[] = [];
  if (selected === "All pieces") {
    products = (await Product.find({}).populate("categoryId", "name slug").sort({ createdAt: -1 }).lean()) as unknown as LeanProduct[];
  } else {
    const category = categories.find((c) => c.slug === selected);
    if (category) {
      products = (await Product.find({ categoryId: category._id }).populate("categoryId", "name slug").sort({ createdAt: -1 }).lean()) as unknown as LeanProduct[];
    }
  }

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matcher = escaped ? new RegExp(escaped, "i") : null;
  if (matcher) {
    products = products.filter((p) => matcher.test(p.name) || matcher.test(p.description) || (p.categoryId?.name ? matcher.test(p.categoryId.name) : false));
  }

  const categoryOptions = ["All pieces", ...categories.map((c) => c.name)];

  return (
    <main className="mx-auto max-w-7xl px-6 pb-24 pt-12 md:px-10">
      <div className="mb-12 max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[.25em] text-coral">The collection</p>
        <h1 className="mt-3 text-6xl font-black tracking-[-.07em]">
          Find your<br />
          <i className="font-normal">everyday.</i>
        </h1>
        <p className="mt-5 text-ink/60">Objects with a point of view, made to live well with you.</p>
      </div>
      <form action="/products" method="get" className="mb-6 flex max-w-xl gap-2">
        {selected !== "All pieces" && <input type="hidden" name="category" value={selected} />}
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search products…"
          className="w-full rounded-full border border-ink/20 px-5 py-2.5 text-sm outline-none placeholder:text-ink/40 focus:border-ink"
        />
        <button type="submit" className="rounded-full bg-ink px-6 py-2.5 text-sm font-bold text-white hover:bg-coral">
          Search
        </button>
      </form>
      <div className="mb-10 flex flex-wrap gap-2">
        {categoryOptions.map((category) => (
          <a
            key={category}
            href={category === "All pieces" ? "/products" : `/products?category=${categories.find((c) => c.name === category)?.slug}`}
            className={`rounded-full border px-5 py-2 text-sm ${selected === category ? "border-ink bg-ink text-white" : "border-ink/20 hover:border-ink"}`}
          >
            {category}
          </a>
        ))}
      </div>
      {query && (
        <p className="mb-6 text-sm text-ink/60">
          {products.length > 0
            ? `${products.length} result${products.length === 1 ? "" : "s"} for “${query}”`
            : `No results for “${query}”. Try a different search.`}
        </p>
      )}
      <div className="grid grid-cols-2 gap-x-4 gap-y-12 md:grid-cols-3 md:gap-8">
        {products.map((p) => (
          <ProductCard
            key={p._id.toString()}
            product={{
              id: p.slug,
              name: p.name,
              category: p.categoryId?.name || "Unknown",
              price: p.price,
              color: "#f6f5ef",
              image: p.imagePath,
              description: p.description,
              isNew: p.isFeatured,
            }}
          />
        ))}
      </div>
    </main>
  );
}