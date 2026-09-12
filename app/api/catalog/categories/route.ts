import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";

export async function GET() {
  if (!process.env.MONGODB_URI) return NextResponse.json({ error: "Database is not configured" }, { status: 503 });
  try { await connectDB(); return NextResponse.json({ categories: await Category.find({}).sort({ name: 1 }).lean() }); }
  catch { return NextResponse.json({ error: "Unable to load categories" }, { status: 500 }); }
}