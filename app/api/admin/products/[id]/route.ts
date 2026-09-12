import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { apiError, isValidObjectId } from "@/lib/api-response";
import { requireAdmin } from "@/lib/guards";
import Product from "@/models/Product";

const schema = z.object({
  categoryId: z.string().length(24),
  name: z.string().trim().min(2).max(160),
  slug: z.string().trim().min(2).max(160).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().min(5).max(2000),
  price: z.number().nonnegative(),
  stockQty: z.number().int().nonnegative(),
  imagePath: z.string().url(),
  isFeatured: z.boolean().optional(),
});

function validateId(id: string) {
  if (!isValidObjectId(id)) return apiError("Invalid product ID", 400);
  return null;
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const { id } = await params;
  const err = validateId(id);
  if (err) return err;
  try {
    await connectDB();
    const product = await Product.findById(id).populate("categoryId", "name slug").lean();
    if (!product) return apiError("Product not found", 404);
    return NextResponse.json({ product });
  } catch {
    return apiError("Unable to load product", 500);
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const { id } = await params;
  const err = validateId(id);
  if (err) return err;
  try {
    const parsed = schema.partial().safeParse(await request.json());
    if (!parsed.success) return apiError(parsed.error.issues[0].message);
    await connectDB();
    const product = await Product.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!product) return apiError("Product not found", 404);
    return NextResponse.json({ product });
  } catch {
    return apiError("Unable to update product", 500);
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  const { id } = await params;
  const err = validateId(id);
  if (err) return err;
  try {
    await connectDB();
    const product = await Product.findByIdAndDelete(id);
    if (!product) return apiError("Product not found", 404);
    return NextResponse.json({ success: true });
  } catch {
    return apiError("Unable to delete product", 500);
  }
}