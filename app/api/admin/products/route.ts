import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api-response";
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

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  try {
    await connectDB();
    const products = await Product.find({}).populate("categoryId", "name slug").sort({ createdAt: -1 }).lean();
    return NextResponse.json({ products });
  } catch {
    return apiError("Unable to load products", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiError(parsed.error.issues[0].message);
    await connectDB();
    return NextResponse.json({ product: await Product.create(parsed.data) }, { status: 201 });
  } catch {
    return apiError("Unable to create product", 500);
  }
}