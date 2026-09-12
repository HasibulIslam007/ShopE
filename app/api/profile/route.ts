import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { requireUser } from "@/lib/guards";
import User from "@/models/User";

export async function GET() {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;
  try {
    await connectDB();
    const user = await User.findById(guard.session.user.id).select("name email role createdAt");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Unable to load profile" }, { status: 500 });
  }
}

const schema = z.object({
  name: z.string().min(2).optional(),
  currentPassword: z.string().min(1).optional(),
  newPassword: z.string().min(8).optional(),
});

export async function PATCH(request: Request) {
  const guard = await requireUser();
  if ("response" in guard) return guard.response;
  try {
    const parsed = schema.safeParse(await request.json());
    if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message || "Invalid input" }, { status: 400 });
    const { name, currentPassword, newPassword } = parsed.data;

    await connectDB();
    const user = await User.findById(guard.session.user.id).select("+passwordHash");
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    if (newPassword) {
      if (!currentPassword) return NextResponse.json({ error: "Current password is required to change password" }, { status: 400 });
      if (!(await bcrypt.compare(currentPassword, user.passwordHash))) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
      }
      user.passwordHash = await bcrypt.hash(newPassword, 12);
    }
    if (name) user.name = name.trim();

    await user.save();
    return NextResponse.json({ user: { name: user.name, email: user.email, role: user.role } });
  } catch {
    return NextResponse.json({ error: "Unable to update profile" }, { status: 500 });
  }
}
