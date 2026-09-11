# TiyanzVision — Free MOD APK Games & Apps

Website download MOD APK games & premium apps Android dengan tema neon
**hitam + hijau + biru**, animasi smooth, dan data live (±9.597 APK).
Dibangun dengan **Next.js 16** — fully **Vercel-ready**.

> ⚠️ No files are hosted here — klik **Download** masuk halaman download milik
> site ini (`/download/...`) yang langsung nyambung ke file di server source
> (tanpa timer/ads source). All trademarks belong to their respective owners.

---

## ✨ Features

| Area | Details |
|---|---|
| 🏠 Homepage | Hero + big search, animated counters, icon marquee, lalu row geser: Best New Releases, Editor's Choice, New Games, Popular Games, Last Update, New Apps |
| ↔️ Snap carousel | Tiap row bisa di-swipe (HP) / panah (desktop), tepi fade, snap per kartu — grid vertikal hanya di halaman listing (tombol More) |
| 🎮 Games / 📱 Apps | Full listing + pagination (`/games/`, `/app/`) |
| 🗂️ Genres | 18 genre games + 19 kategori apps (`/games/action/`, `/app/tools/`, …) |
| 📄 Detail page | Icon, version + MOD badges, rating, App Info, description, screenshot lightbox, download box, related |
| 📥 Download page | `/download/<genre>/<slug>/<version>/` — halaman download branded (info file: name/size/arch) + tombol **langsung ke file source** (skip countdown 5 detik & ads source). Link lama style source (`/games/.../download/...`) auto-redirect ke sini. Noindex |
| 🔎 Search | Full-page results (noindex) + **live suggestions** (`/api/suggest/`) |
| ⭐ Special pages | `/best-new-releases/`, `/popular-games/`, `/updated/`, `/top-100-games/` |
| 📝 More pages | `/request/`, `/privacy-policy/`, `/dmca/`, `/contacts/`, `/offline/` |
| 📲 PWA | Installable! Manifest + service worker (cache + offline page) + tombol **Install App** (FAB + header) + panduan iOS |
| 🎞️ Animations | Scroll reveals, hover glow, top progress bar, marquee, lightbox, counters (Framer Motion + CSS) |
| ⚡ Anti-lag | `content-visibility`, lazy images, `prefers-reduced-motion`, animasi ambient off di layar kecil |
| 🔍 SEO | Judul/deskripsi keyword (apkmod, tvision, tiyanzvision), canonical tiap halaman, OG/Twitter card (gambar share = logo, halaman detail = icon APK), JSON-LD WebSite+Organization, `sitemap.xml`, `robots.txt`, favicon custom, 404 benar |

---

## 🖼️ Folder gambar (`public/`)

Semua aset disimpan **lokal** (tidak tergantung link luar — anti expired):

```
public/
  icons/
    logo-original.png   → master logo (backup)
    logo.png            → logo 1024px
    icon-192.png        → PWA + header/footer
    icon-512.png        → PWA + JSON-LD Organization
    maskable-512.png    → PWA maskable (Android adaptive icon)
    favicon-16.png / favicon-32.png
  favicon.ico  apple-touch-icon.png  og-image.png (1200×630, gambar share)
  manifest.webmanifest  sw.js (service worker)
```

Ganti logo? Cukup timpa file-file di atas dengan nama yang sama → rebuild → deploy.

---

## 🛠️ Tech Stack

- **Next.js 16** (App Router) + TypeScript + **Tailwind CSS v4**
- **Framer Motion**, **Lucide**, **Cheerio** (server-side HTML parsing)
- Data live (server-side + ISR cache): REST API sumber + parsing HTML listing/detail

---

## 🚀 Deploy ke Vercel (gratis)

1. Push ke GitHub:
   ```bash
   cd tiyanzvision
   git init && git add -A && git commit -m "TiyanzVision + SEO + PWA"
   git branch -M main
   git remote add origin https://github.com/USERNAME/REPO.git
   git push -u origin main
   ```
2. [vercel.com/new](https://vercel.com/new) → **Import** → **Deploy**. ✅
3. Env var (opsional):
   - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` = kode verifikasi Search Console
   - Domain terdeteksi **otomatis** — ganti domain/subdomain kapan pun tanpa edit file & tanpa setting env.

### Biar muncul di Google ("apkmod", "tvision", "tiyanzvision")

On-site SEO sudah lengkap. Sisanya (di luar kode):

1. Daftarkan domain ke [Google Search Console](https://search.google.com/search-console) → verifikasi (pakai env di atas) → submit sitemap `https://domain-kamu/sitemap.xml`.
2. Untuk keyword brand (**tvision / tiyanzvision**): biasanya ke-index dalam hitungan hari–minggu setelah deploy + submit sitemap.
3. Untuk keyword umum (**apkmod**): butuh waktu + backlink + konten konsisten — persaingannya berat. Tips: pakai **custom domain** (bukan vercel.app), share link ke sosmed/forum, update rutin.
4. Test share image: [OpenGraph.xyz](https://www.opengraph.xyz/) atau [validator.lens](https://validator.lenspost.xyz/) — harusnya muncul `og-image.png`.

---

## 💻 Development lokal

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

**Dev offline / ganti source:** source site bisa di-override via env `SOURCE_ORIGIN`:

```bash
node scripts/mock-source.mjs                          # fake source di http://127.0.0.1:8931
SOURCE_ORIGIN=http://127.0.0.1:8931 npm run dev      # jalankan dengan mock
```

**Opsional — file lewat domain kamu (`/api/apk`):** tombol download di halaman
`/download/...` bisa di-stream lewat server kamu (bukan link langsung ke CDN
source) dengan set `USE_APK_PROXY=1` saat **build**. Off by default: production
tetap link langsung ke CDN source (hemat bandwidth & tanpa limit durasi
function). Kalau pakai, pastikan plan kamu support durasi function yang cukup
untuk file besar.

> Catatan: prompt **Install App** (PWA) hanya muncul di production (Vercel) atau `next start` —
> di `npm run dev` Chrome tidak menawarkannya, tapi tombol iOS tetap tampil.

---

## 📁 Struktur project

```
app/
  page.tsx                    → homepage (hero + snap rows)
  games/[[...path]]/page.tsx  → listing + genre + detail games
  app/[[...path]]/page.tsx    → listing + genre + detail apps
  download/[[...path]]/page.tsx → halaman download (file info + tombol langsung ke file)
  search/  offline/  api/suggest/
  best-new-releases/ popular-games/ updated/ top-100-games/
  request/ privacy-policy/ dmca/ contacts/
  sitemap.ts  robots.ts  not-found.tsx  error.tsx
components/                   → Header, Footer, ApkCard, SectionBlock, InstallButton, DownloadPageView, …
lib/  source.ts (data)  genres.ts  types.ts  pwa.ts (install hook)
scripts/mock-source.mjs       → mock source site (dev offline)
```
