import "next-auth";

declare module "next-auth" {
  interface User {
    role?: "customer" | "admin";
  }

  interface Session {
    user: {
      id: string;
      role?: "customer" | "admin";
    } & Session["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "customer" | "admin";
  }
}