# 📋 Tim 2 Kanban Board App

Sebuah aplikasi manajemen tugas interaktif berbasis Kanban Board yang dibangun menggunakan **Next.js 15 (App Router)**, **Hono**, **TypeScript**, dan **Tailwind CSS**. 

Aplikasi ini menggunakan **Hono** sebagai framework backend modern yang berjalan di dalam *Catch-all API Route* Next.js, serta menggunakan Zustand untuk pengelolaan state global dan Shadcn UI untuk komponen antarmukanya.

---

## 🚀 Layar Teknologi (Tech Stack)

* **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router)
* **Backend Framework**: [Hono](https://hono.dev/) (di dalam API Route Handlers)
* **Language**: [TypeScript](https://www.typescriptlang.org/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **UI Components**: Shadcn UI / Radix UI
* **State Management**: Zustand (`store/useKanbanStore.ts`)
* **Package Manager**: **npm**

---

## 📂 Struktur Proyek

Berikut adalah struktur file dan folder dari proyek ini:

```text
tim2kanban/
├── README.md                 # Dokumentasi utama proyek
├── AGENTS.md                 # Panduan / arahan AI agent
├── components.json           # Konfigurasi Shadcn UI
├── eslint.config.mjs         # Konfigurasi ESLint
├── next.config.ts            # Konfigurasi Next.js
├── package.json              # Dependencies dan npm scripts
├── tsconfig.json             # Konfigurasi TypeScript
└── src/
    ├── app/                  # Next.js App Router (Halaman & Layout)
    │   ├── globals.css       # Style global CSS & Tailwind import
    │   ├── layout.tsx        # Root layout aplikasi
    │   ├── page.tsx          # Halaman utama Kanban
    │   ├── api/
    │   │   └── [[...route]]/
    │   │       └── route.ts  # Hono API Backend Entrypoint
    │   └── lib/
    │       └── utils.ts      # Helper utilities (cn, clsx)
    ├── components/           # Komponen React modular
    │   ├── kanban/           # Komponen spesifik Kanban (Board, Card, Dialog)
    │   │   ├── KanbanBoard.tsx
    │   │   ├── TaskCard.tsx
    │   │   └── TaskDialog.tsx
    │   └── ui/               # Komponen UI dasar (Button, Dialog, Card, dll)
    │       ├── badge.tsx
    │       ├── button.tsx
    │       ├── card.tsx
    │       ├── dialog.tsx
    │       ├── input.tsx
    │       └── select.tsx
    ├── data/                 # Mock / Initial Data
    │   └── kanban.ts
    ├── store/                # Global State Store (Zustand)
    │   └── useKanbanStore.ts
    └── types/                # Definisi Type & Interface TypeScript
        └── kanban.ts
```

---

## ⚡ Backend API (Hono)

Backend API ditangani secara efisien oleh **Hono** melalui Next.js catch-all route di `src/app/api/[[...route]]/route.ts`.

* **Base Endpoint API**: `http://localhost:3000/api`

---

## 💻 Panduan Memulai (Getting Started)

### Prasyarat

Pastikan Anda telah menginstal:
* [Node.js](https://nodejs.org/) (versi 18.x atau lebih baru)
* **npm**

### Langkah Instalasi

1. **Clone repositori ini:**
   ```bash
   git clone https://github.com/carleswebdev/carleswebdev-tim2kanban.git
   cd tim2kanban
   ```

2. **Install dependencies menggunakan npm:**
   ```bash
   npm install
   ```

3. **Jalankan server pengembangan (Development Server):**
   ```bash
   npm run dev
   ```

4. **Buka aplikasi:**
   Buka [http://localhost:3000](http://localhost:3000) pada browser Anda.

---

## 📜 Script npm yang Tersedia

**npm** untuk menjalankan perintah-perintah berikut:

| Script | Deskripsi |
| :--- | :--- |
| `npm run dev` | Menjalankan aplikasi dalam mode pengembangan |
| `npm run build` | Membuat build produksi teroptimasi |
| `npm run start` | Menjalankan server produksi hasil build |
| `npm run lint` | Mengecek kualitas dan kebersihan kode dengan ESLint |

---
