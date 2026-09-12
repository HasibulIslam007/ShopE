import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import { ensureCatalogSeeded } from "@/lib/catalog";
import Product from "@/models/Product";

export async function GET() {
  if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  try {
    await ensureCatalogSeeded();
    const products = await Product.find({}).populate("categoryId", "name slug").sort({ createdAt: -1 }).lean();
    return NextResponse.json({ products });
  } catch { return NextResponse.json({ error: "Unable to load products" }, { status: 500 }); }
}