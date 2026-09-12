import { NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { apiError } from "@/lib/api-response";
import { requireAdmin } from "@/lib/guards";
import Category from "@/models/Category";

const schema = z.object({ name: z.string().trim().min(2).max(80), slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/) });

export async function GET() {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  try {
    await connectDB();
    return NextResponse.json({ categories: await Category.find({}).sort({ name: 1 }).lean() });
  } catch {
    return apiError("Unable to load categories", 500);
  }
}

export async function POST(request: Request) {
  const guard = await requireAdmin();
  if ("response" in guard) return guard.response;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return apiError(parsed.error.issues[0].message);
    await connectDB();
    return NextResponse.json({ category: await Category.create(parsed.data) }, { status: 201 });
  } catch {
    return apiError("Unable to create category", 500);
  }
}