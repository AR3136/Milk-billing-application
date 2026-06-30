# Milk Billing Management System

A production-ready, mobile-first, PWA-enabled SaaS application for commercial milk billing, deliveries collection, and operating expenses tracking.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL / Supabase project instance

### Installation
1. Clone the project directory and install dependencies:
   ```bash
   cd milk-billing-app
   npm install
   ```
2. Configure environment variables in `.env.local`:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

---

## 🎨 Technology Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS, Zustand, React Hook Form, Zod.
- **Backend & Auth**: Supabase (Auth, PostgreSQL Database, Storage).
- **Libraries**: Recharts (Analytics charts), Lucide (Icons), Sonner (Toast notifications), SheetJS (Excel uploads/exports).

---

## 📁 Architecture Overview

Implemented using a clean **Feature-Based Architecture**:
- `src/features/` — Independent modules containing components, services, hooks, and types (e.g. auth, customers, billing, payments, reports, expenses, settings, admin, ai-features).
- `src/components/` — Shared UI primitives (Buttons, Cards, Inputs) and layout panels (Sidebar, Header, BottomNav).
- `src/lib/` — Supabase clients, schema definitions, global stores, and utility helper functions.

---

## ⚙️ Deployment and Production Optimization

- **Gzip Compression**: Configured `compress: true` inside `next.config.ts`.
- **Responsive Layout**: Sidebar for desktop view, Bottom Navigation bar for mobile screens.
- **PWA Ready**: Web app manifest (`manifest.json`) and service worker configurations ready for mobile pinning.
- **SEO Ready**: Standard meta headers, viewport structures, and `robots.txt` templates configured.
- **Role-Based Guards**: Protected routes matched in `middleware.ts` restricting panel access by user role (`owner`, `admin`, `manager`, `employee`).
- **Database Schema**: Full PostgreSQL DDL script located at `src/lib/supabase/schema.sql` ready to sync.
