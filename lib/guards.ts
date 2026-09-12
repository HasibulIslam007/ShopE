import { auth } from "@/auth";
import { apiError } from "@/lib/api-response";
import { connectDB } from "@/lib/db";
import User from "@/models/User";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return { response: apiError("Authentication required", 401) } as const;

  // Token-version check (session invalidation): a JWT is only valid while its
  // tokenVersion matches the user's CURRENT tokenVersion in the database.
  // Password changes bump tokenVersion, so stale sessions die immediately.
  try {
    await connectDB();
    const user = await User.findById(session.user.id).select("role tokenVersion");
    if (!user) return { response: apiError("Authentication required", 401) } as const;
    if ((user.tokenVersion ?? 0) !== (session.user.tokenVersion ?? 0)) {
      return { response: apiError("Session expired, please sign in again", 401) } as const;
    }
    // Attach the fresh role from the DB (source of truth, not the token).
    return { session, user } as const;
  } catch {
    return { response: apiError("Unable to verify session", 500) } as const;
  }
}

export async function requireAdmin() {
  const result = await requireUser();
  if ("response" in result) return result;
  // `result.user.role` was re-read from the database above, so a demoted admin
  // loses access immediately — the JWT role alone can never grant privileges.
  if (result.user.role !== "admin") return { response: apiError("Admin access required", 403) } as const;
  return result;
}
