import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { apiError, isValidObjectId } from "@/lib/api-response";
import { requireAdmin } from "@/lib/guards";
import Category from "@/models/Category";

const schema = z.object({ name: z.string().trim().min(2).max(80), slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/) });

function validateId(id: string) {
  if (!isValidObjectId(id)) return apiError("Invalid category ID", 400);
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
    const category = await Category.findById(id).lean();
    if (!category) return apiError("Category not found", 404);
    return NextResponse.json({ category });
  } catch {
    return apiError("Unable to load category", 500);
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
    const category = await Category.findByIdAndUpdate(id, parsed.data, { new: true });
    if (!category) return apiError("Category not found", 404);
    return NextResponse.json({ category });
  } catch {
    return apiError("Unable to update category", 500);
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
    const category = await Category.findByIdAndDelete(id);
    if (!category) return apiError("Category not found", 404);
    return NextResponse.json({ success: true });
  } catch {
    return apiError("Unable to delete category", 500);
  }
}