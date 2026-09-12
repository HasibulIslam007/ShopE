import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { clientIpFromHeaders, rateLimit } from "@/lib/rate-limit";
import User from "@/models/User";

// Fail fast if the signing secret is missing or a known placeholder.
// In production this throws so a weak/absent secret can never sign tokens.
const AUTH_SECRET = process.env.AUTH_SECRET;
if (process.env.NODE_ENV === "production" && (!AUTH_SECRET || AUTH_SECRET.length < 32)) {
  throw new Error("AUTH_SECRET must be set to a strong random value (32+ chars) in production");
}
if (process.env.NODE_ENV !== "production" && (!AUTH_SECRET || AUTH_SECRET.startsWith("replace-with"))) {
  console.warn("⚠️  AUTH_SECRET is missing or a placeholder — generate one with: openssl rand -base64 32");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  session: {
    strategy: "jwt",
    // Tokens expire after 24h instead of the 30-day default; the cookie
    // is silently refreshed every hour while the user is active.
    maxAge: 24 * 60 * 60,
    updateAge: 60 * 60,
  },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, request) {
        const parsed = z.object({ email: z.string().email(), password: z.string().min(1) }).safeParse(credentials);
        if (!parsed.success || !process.env.MONGODB_URI) return null;

        // Brute-force protection: max 5 attempts per email+IP per 15 min,
        // locked out for 10 minutes after that.
        const ip = clientIpFromHeaders(request?.headers);
        const limit = await rateLimit(`login:${ip}:${parsed.data.email.toLowerCase()}`, {
          max: 5,
          windowMs: 15 * 60 * 1000,
          lockMs: 10 * 60 * 1000,
        });
        if (!limit.ok) return null;

        await connectDB();
        const user = await User.findOne({ email: parsed.data.email.toLowerCase() }).select("+passwordHash tokenVersion");
        if (!user || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role, tokenVersion: user.tokenVersion ?? 0 };
      },
    }),
  ],
  pages: { signIn: "/login" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tokenVersion = user.tokenVersion;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as "customer" | "admin" | undefined;
        session.user.tokenVersion = token.tokenVersion as number | undefined;
      }
      return session;
    },
  },
});