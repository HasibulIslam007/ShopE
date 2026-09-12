"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

type Product = {
  _id: string;
  name: string;
  categoryId: { _id: string; name: string; slug: string } | null;
  price: number;
  stockQty: number;
  imagePath: string;
  isFeatured: boolean;
  slug: string;
  description: string;
};

type Category = {
  _id: string;
  name: string;
  slug: string;
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    categoryId: "",
    name: "",
    slug: "",
    description: "",
    price: 0,
    stockQty: 0,
    imagePath: "",
    isFeatured: false,
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchData() {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories"),
      ]);
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(data.products);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data.categories);
      }
    } catch {
      setError("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function resetForm() {
    setEditingProduct(null);
    setFormData({
      categoryId: "",
      name: "",
      slug: "",
      description: "",
      price: 0,
      stockQty: 0,
      imagePath: "",
      isFeatured: false,
    });
    setShowForm(false);
  }

  function handleEdit(product: Product) {
    setEditingProduct(product);
    setFormData({
      categoryId: product.categoryId?._id || "",
      name: product.name,
      slug: product.slug,
      description: product.description || "",
      price: product.price,
      stockQty: product.stockQty,
      imagePath: product.imagePath,
      isFeatured: product.isFeatured,
    });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const url = editingProduct ? `/api/admin/products/${editingProduct._id}` : "/api/admin/products";
      const method = editingProduct ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save product");
      resetForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save product");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product?")) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      fetchData();
    } catch {
      setError("Failed to delete product");
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-7xl px-6 py-16 md:px-10">Loading...</div>;
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-16 md:px-10">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-coral">Admin / Catalog</p>
      <div className="flex items-end justify-between">
        <h1 className="mt-3 text-6xl font-black tracking-[-.07em]">Products<span className="text-coral">.</span></h1>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">+ Add product</button>
      </div>

      {showForm && (
        <div className="mt-8 fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-auto rounded-[2rem] bg-white p-7">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">{editingProduct ? "Edit Product" : "Add Product"}</h2>
              <button onClick={resetForm} className="text-2xl text-ink/50 hover:text-ink">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <div>
                <label className="block text-sm font-medium mb-1">Category</label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-coral"
                >
                  <option value="">Select category</option>
                  {categories.map((c) => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-coral"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Slug</label>
                <input
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-coral"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={4}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-coral"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Price</label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-coral"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Stock</label>
                  <input
                    required
                    type="number"
                    min="0"
                    value={formData.stockQty}
                    onChange={(e) => setFormData({ ...formData, stockQty: Number(e.target.value) })}
                    className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-coral"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Image URL</label>
                <input
                  required
                  type="url"
                  value={formData.imagePath}
                  onChange={(e) => setFormData({ ...formData, imagePath: e.target.value })}
                  className="w-full rounded-xl border border-ink/15 bg-white px-4 py-3 outline-coral"
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="h-4 w-4 rounded border-ink/20 text-coral focus:ring-coral"
                />
                <label htmlFor="isFeatured" className="text-sm">Featured</label>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" disabled={submitting} className="flex-1 rounded-full bg-ink px-6 py-3 font-bold text-white disabled:opacity-60">
                  {submitting ? "Saving…" : editingProduct ? "Update Product" : "Create Product"}
                </button>
                <button type="button" onClick={resetForm} className="flex-1 rounded-full border border-ink/20 px-6 py-3 font-bold text-ink hover:bg-ink/5">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="mt-12 overflow-hidden rounded-[2rem] bg-white">
        <div className="grid grid-cols-5 gap-4 border-b border-ink/10 p-5 text-xs font-bold uppercase tracking-wider text-ink/50">
          <span>Product</span>
          <span>Category</span>
          <span>Price</span>
          <span>Stock</span>
          <span>Actions</span>
        </div>
        {products.length === 0 ? (
          <div className="p-12 text-center text-ink/50">No products yet</div>
        ) : (
          products.map((p) => (
            <div key={p._id} className="grid grid-cols-5 gap-4 border-b border-ink/10 p-5 last:border-0 items-center">
              <div className="flex items-center gap-4">
                <div className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl" style={{ background: "#f6f5ef" }}>
                  <Image src={p.imagePath} alt={p.name} fill className="object-cover" sizes="80px" />
                </div>
                <span className="font-bold">{p.name}</span>
              </div>
              <span className="text-ink/60">{p.categoryId?.name || "—"}</span>
              <span>${p.price.toFixed(2)}</span>
              <span className={p.stockQty > 0 ? "text-emerald-700" : "text-red-600"}>
                {p.stockQty > 0 ? `In stock (${p.stockQty})` : "Out of stock"}
              </span>
              <div className="flex items-center gap-2">
                <button onClick={() => handleEdit(p)} className="text-sm text-ink/60 underline hover:text-ink">Edit</button>
                <button onClick={() => handleDelete(p._id)} className="text-sm text-red-600 underline hover:text-red-700">Delete</button>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}