import "next-auth";

declare module "next-auth" {
  interface User {
    role?: "customer" | "admin";
    tokenVersion?: number;
  }

  interface Session {
    user: {
      id: string;
      role?: "customer" | "admin";
      tokenVersion?: number;
    } & Session["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "customer" | "admin";
    tokenVersion?: number;
  }
}
