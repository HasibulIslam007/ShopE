import { auth } from "@/auth";
import { apiError } from "@/lib/api-response";

export async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) return { response: apiError("Authentication required", 401) } as const;
  return { session } as const;
}

export async function requireAdmin() {
  const result = await requireUser();
  if ("response" in result) return result;
  if (result.session.user.role !== "admin") return { response: apiError("Admin access required", 403) } as const;
  return result;
}