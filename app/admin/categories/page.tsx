"use client";
import { useEffect, useState } from "react";

type Category = {
  _id: string;
  name: string;
  slug: string;
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function fetchData() {
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data.categories);
      }
    } catch {
      setError("Failed to load categories");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  function resetForm() {
    setEditingCategory(null);
    setFormData({ name: "", slug: "" });
    setShowForm(false);
  }

  function handleEdit(category: Category) {
    setEditingCategory(category);
    setFormData({ name: category.name, slug: category.slug });
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const url = editingCategory ? `/api/admin/categories/${editingCategory._id}` : "/api/admin/categories";
      const method = editingCategory ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save category");
      resetForm();
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this category?")) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete category");
      fetchData();
    } catch {
      setError("Failed to delete category");
    }
  }

  if (loading) {
    return <div className="mx-auto max-w-5xl px-6 py-16 md:px-10">Loading...</div>;
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:px-10">
      <p className="text-xs font-bold uppercase tracking-[.25em] text-coral">Admin / Taxonomy</p>
      <h1 className="mt-3 text-6xl font-black tracking-[-.07em]">Categories<span className="text-coral">.</span></h1>
      <div className="mt-12 rounded-[2rem] bg-white p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Categories</h2>
          <button onClick={resetForm} className="rounded-full bg-ink px-5 py-3 text-sm font-bold text-white">+ Add category</button>
        </div>

        {showForm && (
          <div className="mb-8 fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md max-h-[90vh] overflow-auto rounded-[2rem] bg-white p-7">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">{editingCategory ? "Edit Category" : "Add Category"}</h2>
                <button onClick={resetForm} className="text-2xl text-ink/50 hover:text-ink">&times;</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}
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
                <div className="flex gap-3 pt-4">
                  <button type="submit" disabled={submitting} className="flex-1 rounded-full bg-ink px-6 py-3 font-bold text-white disabled:opacity-60">
                    {submitting ? "Saving…" : editingCategory ? "Update Category" : "Create Category"}
                  </button>
                  <button type="button" onClick={resetForm} className="flex-1 rounded-full border border-ink/20 px-6 py-3 font-bold text-ink hover:bg-ink/5">Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {categories.length === 0 ? (
          <p className="text-ink/60">No categories yet</p>
        ) : (
          <div className="divide-y divide-ink/10">
            {categories.map((c) => (
              <div key={c._id} className="flex items-center justify-between py-5">
                <div>
                  <p className="font-bold">{c.name}</p>
                  <p className="text-sm text-ink/50">{c.slug}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleEdit(c)} className="text-sm text-ink/60 underline hover:text-ink">Edit</button>
                  <button onClick={() => handleDelete(c._id)} className="text-sm text-red-600 underline hover:text-red-700">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}