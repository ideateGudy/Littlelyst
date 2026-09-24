# Littlelyst Client — Seller Experience & Marketplace

This is the Next.js 16 (App Router) frontend for **Littlelyst**, specifically tailored for Nigerian sellers. It provides an ultra-fast, WhatsApp Status–like selling flow backed by a race-condition-safe NestJS + PostgreSQL financial ledger.

---

## Key Features

1. **WhatsApp Status–Style Posting (`/dashboard/new`)**:
   - Zero unnecessary navigation or multi-step wizard delays.
   - **Direct Camera Capture**: On mobile, `<input type="file" accept="image/*" capture="environment" />` launches the phone camera directly.
   - **Client-Side Image Compression**: Utilizes `browser-image-compression` to resize and compress photos down to ~1MB before upload, preventing excessive mobile data consumption on cellular networks.
   - **Tappable Presets**: Fast pre-filled chips for price (e.g. ₦15,000, ₦50,000), categories, and status tags ("UK Used", "Brand New", "Price Negotiable").
   - **Signed Direct Cloudinary Upload**: Requests signatures from the backend (`POST /api/uploads/signature`) and streams image bytes directly to Cloudinary with real-time percentage progress indicators, sparing backend server bandwidth.

2. **Liquid Glass Aesthetic & Theme**:
   - Styled with high-tech glassmorphism, platinum light (`#e5e4e2`) and obsidian dark (`#050505`) contrast, subtle glowing borders, and backdrop-blur effects.
   - Guided by the project's workspace skills: `premium-ui-designer` and `scroll-animation`.

3. **Secure Auth & Token Lifecycle**:
   - Access tokens are strictly stored in-memory in a React state store (`lib/auth.ts`) to avoid XSS vulnerabilities present in `localStorage`.
   - Automatic silent token refresh via `POST /api/auth/refresh` on page reload using `httpOnly` cookies.
   - Lightweight `littlelyst_logged_in` marker cookie for fast edge routing via `middleware.ts`.

4. **Real-Time Derived Wallet Ledger**:
   - Displays real-time seller balance dynamically calculated via SQL `SUM` queries from the double-entry ledger backend.

---

## Directory Structure

```
client/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx             # Seller login
│   │   └── register/page.tsx          # Seller onboarding
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   ├── page.tsx               # Seller dashboard with derived wallet balance & active listings
│   │   │   └── new/
│   │   │       ├── page.tsx           # Server component shell
│   │   │       └── new-listing-form.tsx # Core WhatsApp Status–like capture & publish component
│   │   └── layout.tsx                 # Dashboard navigation & session guard
│   ├── layout.tsx                     # Root layout with AuthProvider & Liquid Glass styling
│   └── page.tsx                       # Landing page with interactive seller narrative
├── components/
│   ├── camera-capture.tsx             # Direct camera & client-side compression trigger
│   └── ui/
│       └── template-chips.tsx         # Tappable price/category chips & progress bar
├── lib/
│   ├── api-client.ts                  # Fetch client with token injection & 401 transparent refresh
│   ├── auth.ts                        # In-memory access token store
│   ├── auth-context.tsx               # React Auth context
│   └── cloudinary-upload.ts           # Direct signed Cloudinary upload with progress tracking
├── middleware.ts                      # Route protection at the edge
└── .agents/skills/                    # Premium UI and Scroll Animation skills
```

---

## Getting Started

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env.local
   ```
   Set `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3000`).

3. **Run local development server**:
   ```bash
   pnpm run dev
   ```

4. **Build for production**:
   ```bash
   pnpm run build
   ```
