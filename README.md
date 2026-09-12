# 🛍️ ShopE — Everyday, elevated.

A full-stack e-commerce web application built with **Next.js 15 (App Router)**, **React 19**, **TypeScript**, **MongoDB (Mongoose)**, **NextAuth v5** and the **SSLCommerz** payment gateway. It features a customer-facing storefront with cart and checkout, a secure user account area with order history, and a role-protected admin panel for managing products, categories and orders.

> Live repo: https://github.com/HasibulIslam007/ShopE

---

## ✨ Features

### Customer
- **Browse the collection** — product grid fetched from MongoDB with category filter tabs (All / Home / Accessories / Kitchen / …)
- **Search** — server-side text search across product **name, description and category** (case-insensitive, works without JavaScript)
- **Product detail pages** — SEO-friendly slug URLs (`/products/cloud-mug`), prerendered statically at build time (SSG)
- **Cart** — add / remove / update quantity, persisted in `localStorage` so the bag survives page reloads
- **Checkout** — shipping form → SSLCommerz hosted payment page (sandbox or live)
- **Order confirmation** — success / fail / cancel flows with server-verified payment status

### Account
- **Register / Login** — email + password with NextAuth credentials provider
- **Profile page (`/profile`)** — view account details, edit display name, change password (current password verified), quick links to cart
- **Order history** — every order with items, quantities, prices, order status and payment status badges
- **Log out** — one click, session cleared everywhere

### Admin (role: `admin`)
- **Dashboard** (`/admin`) — hub linking to all management tools
- **Products** — create / edit / delete products (name, slug, category, price, stock, image URL, featured flag)
- **Categories** — create / edit / delete taxonomy
- **Orders** — view all orders, update order status (pending → processing → shipped → delivered / cancelled)
- **Security** — admin-only UI *and* every admin API independently re-verifies the user's role against the database

---

## 🧰 Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router), React 19 | Server Components, SSG/dynamic rendering, API routes in one app |
| Language | TypeScript 5.7 | Type safety across pages, APIs and models |
| Styling | Tailwind CSS 3.4 | Utility-first styling with a custom brand palette (`cream`, `ink`, `coral`, `mint`) |
| Database | MongoDB Atlas + Mongoose 8 | Document store for users, catalog, orders |
| Auth | NextAuth v5 (beta) — credentials provider, JWT sessions, httpOnly cookies | Secure login without custom token plumbing |
| Passwords | bcryptjs (12 rounds) | Industry-standard password hashing |
| Validation | Zod | Schema validation on every API input |
| Payments | SSLCommerz (sandbox + live) | Bangladesh-friendly gateway with hosted checkout + IPN |
| Linting | ESLint (`next/core-web-vitals`) | Code quality gates |

---

## 📁 Project Structure

```
├── app/                          # Next.js App Router (pages + API routes)
│   ├── layout.tsx                # Root layout: AuthProvider → CartProvider → Header
│   ├── page.tsx                  # Home page (hero, favorites, admin card for admins)
│   ├── error.tsx                 # Page-level error boundary
│   ├── global-error.tsx          # Last-resort error boundary
│   ├── products/
│   │   ├── page.tsx              # Listing + category tabs + search (?category=&q=)
│   │   └── [id]/
│   │       ├── page.tsx          # Product detail — Server Component + SSG
│   │       └── ProductDetailClient.tsx  # "use client" cart-add UI
│   ├── cart/page.tsx             # Cart page (client, reads CartContext)
│   ├── checkout/page.tsx         # Shipping form → POST /api/payments/.../init
│   ├── order-confirmation/page.tsx  # ?status=success|fail|cancel result page
│   ├── login/page.tsx            # Sign-in form (NextAuth signIn)
│   ├── register/page.tsx         # Sign-up form → POST /api/register
│   ├── profile/                  # User account area (login required)
│   │   ├── layout.tsx            # Server guard: redirect guests to /login
│   │   └── page.tsx              # Profile edit, password change, orders, logout
│   ├── account/orders/page.tsx   # Simple order-history page
│   ├── admin/                    # ADMIN ONLY (guarded by app/admin/layout.tsx)
│   │   ├── layout.tsx            # Server guard: non-admins redirected to /
│   │   ├── page.tsx              # Dashboard hub
│   │   ├── products/page.tsx     # Product CRUD UI
│   │   ├── categories/page.tsx   # Category CRUD UI
│   │   └── orders/page.tsx       # Order status management UI
│   └── api/                      # REST API (route handlers) — full table below
├── components/
│   ├── Header.tsx                # Top nav: live login state, admin link, bag count
│   ├── ProductCard.tsx           # Product tile (client, add-to-cart)
│   ├── AdminLink.tsx             # Session-aware admin link / home card (useSession)
│   └── AuthProvider.tsx          # NextAuth SessionProvider wrapper
├── context/CartContext.tsx       # Cart state + localStorage persistence ("shope-cart")
├── lib/
│   ├── db.ts                     # Mongoose connection (cached across hot reloads)
│   ├── guards.ts                 # requireUser / requireAdmin (role re-checked in DB)
│   ├── api-response.ts           # apiError() helper + isValidObjectId()
│   ├── catalog.ts                # ensureCatalogSeeded() — seeds 6 products, 4 categories
│   ├── products.ts               # Seed data + shared `Product` type
│   ├── rate-limit.ts             # In-memory rate limiter (login/register protection)
│   └── sslcommerz.ts             # SSLCommerz init + payment-validation API calls
├── models/                       # Mongoose schemas: User, Product, Category, Order, Cart
├── types/next-auth.d.ts          # Session/JWT type augmentation (adds `role`)
├── middleware.ts                 # CSRF: blocks cross-origin API mutations
├── next.config.ts                # Security headers (CSP, X-Frame-Options, HSTS…)
├── auth.ts                       # NextAuth config (JWT 24h, rate-limited login)
└── tailwind.config.ts            # Brand palette & fonts
```

---


## 🚀 Getting Started

### Prerequisites
- **Node.js 18+** and npm
- A **MongoDB Atlas** cluster (free M0 tier works) — or any MongoDB URI
- An **SSLCommerz sandbox account** (free) for payment testing

### 1. Clone & install
```bash
git clone https://github.com/HasibulIslam007/ShopE.git
cd ShopE
npm install
```

### 2. Configure environment
Create `.env.local` in the project root (gitignored — never commit real secrets):

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@cluster0.xxxxx.mongodb.net/shope
AUTH_SECRET=<run: openssl rand -base64 32>
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
SSLCOMMERZ_STORE_ID=your_sandbox_store_id
SSLCOMMERZ_STORE_PASSWORD=your_sandbox_store_password
SSLCOMMERZ_IS_LIVE=false
```

> ⚠️ Include a **database name** in the URI (e.g. `…/shope`) — otherwise collections land in the default `test` database.

### 3. Run
```bash
npm run dev        # → http://localhost:3000
```
The catalog **auto-seeds** (6 demo products + 4 categories) the first time `/products` is opened, if the `products` collection is empty.

| Script | Purpose |
|---|---|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Production build (type-checks + lints too) |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint (`next/core-web-vitals`) |
| `npm run typecheck` | `tsc --noEmit` |

### 4. Make yourself an admin
1. Register a normal account at `/register`
2. Promote it in the database (Atlas → Browse Collections → `users`, or via `mongosh`):
   ```js
   db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
   ```
3. **Log out and back in** (the role is read into the session at login)
4. You'll now see the **Admin** link in the header and can open `/admin`

### 5. Test payments
Use SSLCommerz **sandbox** credentials (`SSLCOMMERZ_IS_LIVE=false`). Sandbox test cards are documented in the SSLCommerz sandbox panel. Orders stay `pending` until the gateway's success callback validates the payment (`val_id`) against SSLCommerz's validator API.

---


## 🔐 Environment Variables Reference

| Variable | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | ✅ | MongoDB connection string (Atlas: Database → Connect → Drivers). Include a DB name. |
| `AUTH_SECRET` | ✅ | Cryptographically signs session JWTs. Generate with `openssl rand -base64 32`. The app **refuses to boot in production** if missing/short. |
| `NEXTAUTH_URL` | ✅ | Base URL of the app (auth callbacks) — `http://localhost:3000` in dev. |
| `NEXT_PUBLIC_APP_URL` | ✅ | Base URL used to build SSLCommerz success/fail/cancel/IPN callback URLs. |
| `SSLCOMMERZ_STORE_ID` | For checkout | From SSLCommerz sandbox/live panel. |
| `SSLCOMMERZ_STORE_PASSWORD` | For checkout | Paired password. Never exposed to the browser. |
| `SSLCOMMERZ_IS_LIVE` | For checkout | `false` = sandbox, `true` = live gateway. |

---

## 🏗️ Architecture & Data Flow

### Authentication flow
```
/login form → POST (NextAuth credentials)
  → zod validation + rate limit (5 tries / 15 min per email+IP, then 10-min lockout)
  → bcrypt.compare(password, user.passwordHash)
  → signed JWT (role included) stored in httpOnly Secure cookie
  → session valid 24h, silently refreshed hourly while active
Every protected API re-reads the session server-side via auth() (lib/guards.ts).
Admin APIs additionally re-fetch the user's role from MongoDB on every request,
so demoting an admin takes effect immediately.
```

### Checkout / payment flow
```
/cart → /checkout (login required)
  → POST /api/payments/sslcommerz/init
      • re-prices every item from the DB (never trusts client prices)
      • checks stock, creates Order (paymentStatus: pending, unique tranId)
      → returns SSLCommerz GatewayPageURL
  → customer pays on SSLCommerz hosted page
  → gateway redirects to /api/payments/sslcommerz/success|fail|cancel
  → complete.ts validates val_id via SSLCommerz validator API
      and matches tran_id + amount + currency against the order
  → order marked paid + processing (or failed/cancelled)
  → optional IPN webhook repeats the same validation server-to-server
```

### Cart flow
- Cart lives in React context (`context/CartContext.tsx`)
- Items are keyed by product **slug** and persisted to `localStorage` (`shope-cart`)
- Prices shown in cart come from product data at add-time; the **server re-prices at checkout** for safety

---


## 🔌 API Reference

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `*` | `/api/auth/[...nextauth]` | public | NextAuth: sign-in, sign-out, session |
| `POST` | `/api/register` | public (rate limited: 5/hour/IP) | Create account (name, email, password 8+ chars w/ letter+number) |
| `GET` | `/api/profile` | user | Own profile (name, email, role, joined) |
| `PATCH` | `/api/profile` | user | Update name; change password (requires current password, bcrypt-verified) |
| `GET` | `/api/orders` | user | Own orders, newest first |
| `GET` | `/api/catalog/products` | public | All products (triggers seeding) |
| `GET` | `/api/catalog/categories` | public | All categories |
| `GET` | `/api/admin/products` | admin | All products incl. description/stock |
| `POST` | `/api/admin/products` | admin | Create product (Zod-validated) |
| `PATCH` | `/api/admin/products/[id]` | admin | Update product |
| `DELETE` | `/api/admin/products/[id]` | admin | Delete product |
| `GET/POST` | `/api/admin/categories` | admin | List / create category |
| `PATCH/DELETE` | `/api/admin/categories/[id]` | admin | Update / delete category |
| `GET` | `/api/admin/orders` | admin | All orders (every user) |
| `PATCH` | `/api/admin/orders` | admin | Update order status (`pending→processing→shipped→delivered/cancelled`) |
| `POST` | `/api/payments/sslcommerz/init` | user | Validate cart server-side, create order, return gateway URL |
| `GET/POST` | `/api/payments/sslcommerz/success` · `fail` · `cancel` | gateway callback | Verify payment (val_id via SSLCommerz API) and update the order |
| `GET/POST` | `/api/payments/sslcommerz/ipn` | server-to-server | Instant Payment Notification — same server-side validation |

All mutations are additionally protected by `middleware.ts`, which rejects cross-origin browser requests (CSRF defense) while allowing server-to-server callbacks that carry no `Origin` header.

---

## 🗃️ Database Models

### User (`users`)
| Field | Type | Notes |
|---|---|---|
| `name` | String | required |
| `email` | String | required, unique, lowercased |
| `passwordHash` | String | bcrypt (12 rounds), `select: false` — never returned by default |
| `role` | String | enum `customer` \| `admin`, default `customer` |

### Product (`products`)
`categoryId` (ref Category) · `name` · `slug` (unique, used in URLs) · `description` · `price` (≥ 0) · `stockQty` (≥ 0) · `imagePath` (URL) · `isFeatured` · timestamps

### Category (`categories`)
`name` · `slug` (unique) · timestamps

### Order (`orders`)
| Field | Notes |
|---|---|
| `userId` | ref User — owner of the order |
| `items[]` | `{ productId, name, quantity, priceAtPurchase }` — price frozen at purchase time |
| `totalAmount` | ≥ 0, re-computed server-side from DB prices |
| `currency` | default `BDT` |
| `shippingAddress` | `{ name, email, address, city, postcode }` |
| `status` | enum `pending` `processing` `shipped` `delivered` `cancelled` |
| `paymentStatus` | enum `pending` `paid` `failed` `cancelled` |
| `tranId` | unique, sparse — SSLCommerz transaction ID |
| `valId`, `paidAt` | set after successful gateway validation |

### Cart (`carts`)
`userId` (unique) · `items[] { productId, quantity }` — reserved for server-side carts

---


## 🛡️ Security Measures

| Layer | Implementation |
|---|---|
| Password storage | bcrypt, 12 salt rounds; hashes never selected by default (`select: false`) |
| Password policy | Min 8 chars incl. letter + number (Zod-enforced at registration) |
| Brute-force protection | Login: 5 attempts / 15 min per email+IP → 10-minute lockout (`lib/rate-limit.ts`); registration: 5 / hour / IP |
| Session tokens | JWT signed with `AUTH_SECRET`, **httpOnly + SameSite=Lax + Secure (prod)** cookie, 24 h expiry with hourly rolling refresh |
| Secret hygiene | App refuses to start in production with a missing/short secret; secrets only in gitignored `.env.local` |
| Admin authorization | `requireAdmin()` checks the session **and re-reads the role from MongoDB** on every admin request (no stale-token escalation) |
| Page guards | `/admin/*` server layout redirects non-admins to `/`; `/profile` redirects guests to `/login` |
| IDOR protection | Orders/profile always scoped to `session.user.id`; payment callbacks validated against the gateway API + amount/currency/tran_id match |
| CSRF | `middleware.ts` rejects cross-origin API mutations via `Origin` check |
| Input validation | Every API body/query parsed with Zod; search regex escaped (no ReDoS/injection) |
| NoSQL injection | No raw objects into queries — Mongoose typed schemas + Zod strings |
| Error handling | Generic client-facing messages; stack traces never leak |
| Security headers | CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS (prod) — `next.config.ts` |
| Payment secrets | SSLCommerz credentials server-side only; gateway page loaded in iframe via CSP `frame-src` |

---

## 🗺️ Route Map

| URL | Access | Description |
|---|---|---|
| `/` | public | Home: hero, featured products (admin sees "Add product" card) |
| `/products` | public | Shop: search + category tabs |
| `/products/[slug]` | public | Product detail (SSG) |
| `/cart` | public | Cart (stored in browser) |
| `/checkout` | login required | Shipping + pay with SSLCommerz |
| `/order-confirmation` | public | Payment result page |
| `/login`, `/register` | public | Auth forms |
| `/profile` | login required | Account, edit profile, password change, order history, logout |
| `/account/orders` | login required | Order history (simple view) |
| `/admin`, `/admin/products`, `/admin/categories`, `/admin/orders` | **admin only** | Management panel (server-redirected) |

---

## 🚢 Deployment (Vercel + MongoDB Atlas)

1. Push the repo to GitHub (done — `main`)
2. Import the project in **Vercel** → framework auto-detected (Next.js)
3. Add all env vars from the table above in **Vercel → Settings → Environment Variables** (use the **live** SSLCommerz credentials + `SSLCOMMERZ_IS_LIVE=true` when going live)
4. Set `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to the production URL and update the SSLCommerz panel's callback/IPN URLs to match
5. In MongoDB Atlas **Network Access**, allow Vercel's IPs (`0.0.0.0/0` for simplicity, or per-region IPs)
6. `npm run build` runs automatically on deploy; run `npm run typecheck` locally before pushing

---

## 🧯 Troubleshooting

| Symptom | Cause & fix |
|---|---|
| `Cannot find module './331.js'` from webpack-runtime | Stale `.next` build. Stop the server → `rm -rf .next` → rebuild. Never keep a server running across a rebuild. |
| `Error: Attempted to call useCart() from the server` | A client hook was called in a Server Component. Client components must live in a file with `"use client"` (see `app/products/[id]/ProductDetailClient.tsx`). |
| `next lint` hangs asking to configure ESLint | Missing config — this repo ships `.eslintrc.json` extending `next/core-web-vitals`. |
| Product page 404 but build works | Product links use slugs; if a DB product has no `slug`, it can't resolve. Re-seed or fix the document. |
| "This page could not be found" on `/admin` | You're not an admin — promote your user (see Getting Started step 4) and re-login. |
| "Payment service is not configured" at checkout | `SSLCOMMERZ_STORE_ID` / `SSLCOMMERZ_STORE_PASSWORD` are missing or still placeholders in `.env.local`. |
| Port 3000 already in use | `kill -9 <PID>` the old Next process, or `pkill -9 -f "next dev"`, then `npm run dev`. |
| Data missing in Atlas UI | Check the **database name** in the sidebar (`test` if the URI has none). Collections appear lazily after first use. |

---

## 📜 Changelog

- **`75a53f1`** — Initial commit (static storefront scaffolding)
- **`afb476b`** — Git hygiene: ignore local secrets and build files
- **`39a15ad`** — Admin panel (products/categories/orders CRUD), user profile section (edit, password change, order history, logout), NextAuth integration, SSLCommerz payments replacing Stripe, cart persistence, search, error boundaries, security hardening

---

Made with ☕ by **Hasibul Islam** — shop smart. ✌️

