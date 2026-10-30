# NOC Desk

Tiket pribadi untuk melacak trouble di banyak site. React + Vite, Supabase (login + database), deploy ke Vercel.

## 1. Supabase

1. Buat proyek di https://supabase.com (gratis).
2. **SQL Editor** → tempel seluruh isi `supabase/schema.sql` → **Run**.
   - Kalau database sudah dibuat dari versi sebelumnya, cukup jalankan `supabase/migration_v2.sql` (aman diulang).
3. **Authentication → Sign In / Providers → Email**: matikan **Confirm email**, dan matikan **Allow new users to sign up** (user hanya dibuat oleh superadmin).
4. **Authentication → Users → Add user → Create new user**:
   - Email: `yugaachi@nocdesk.app`
   - Password: isi sendiri langsung di sini (jangan ditulis di kode atau chat)
   - Centang **Auto Confirm User**
   - Jika ada akun lama (mis. Gmail yang belum terkonfirmasi), hapus saja.
5. **SQL Editor** → jalankan isi `supabase/bootstrap_superadmin.sql` (menjadikan Yugaachi superadmin).
6. **Project Settings → API**: salin **Project URL**, **anon public key**, dan **service_role key**.

> Login memakai **username** (bukan email). Aplikasi mengubah `yugaachi` menjadi `yugaachi@nocdesk.app` di belakang layar.

## 2. Jalankan lokal

```bash
cp .env.example .env     # isi URL dan anon key
npm install
npm run dev
```

Halaman tiket bisa dites lokal. Halaman **Kelola User** memakai `api/admin-users.js` yang baru jalan di Vercel (atau lewat `npx vercel dev`).

## 3. GitHub

```bash
git init
git add .
git commit -m "NOC Desk v1"
git branch -M main
git remote add origin https://github.com/USERNAME/noc-desk.git
git push -u origin main
```

File `.env` sudah masuk `.gitignore`, jadi kunci tidak ikut ter-upload.

## 4. Vercel

1. Di https://vercel.com pilih **Add New → Project**, impor repo `noc-desk`.
2. Framework otomatis terdeteksi sebagai Vite.
3. Di **Environment Variables** isi `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, dan `SUPABASE_SERVICE_ROLE_KEY` (service_role key, **rahasia**: jangan pakai awalan `VITE_` dan jangan di-commit).
4. **Deploy**. Buka alamatnya di HP, lalu pilih *Add to Home Screen* agar muncul seperti aplikasi.

## Cara kerja singkat

- **Tambah tiket**: isi case + site lalu Tambah. Klik "Atur waktu, penanganan, prioritas" untuk mengisi tanggal/jam kejadian, siapa yang menangani (Teknisi / Tim Metro / NOC / Pelanggan + nama), prioritas, dan follow-up.
- **Tab Aktif**: urutan lewat jadwal follow-up → follow-up hari ini → sisanya (urgent dulu). Banner di atas menghitung yang terlewat.
- **Tab Riwayat**: tiket berstatus Selesai, terbaru di atas, lengkap dengan waktu pulih dan durasi. Bisa dicari dan difilter per site.
- **RFO WhatsApp**: buka tiket → isi *Penyebab* dan *Tindakan* → **Buat RFO WhatsApp** → pilih Pelanggan / Mitra / Sekolah → edit bila perlu → Salin atau Buka WhatsApp. Teks template ada di `src/rfo.js` (nama perusahaan di `COMPANY`).
- Ikon di kanan atas: Kelola user (superadmin) dan Keluar.
- Tiap user hanya melihat tiketnya sendiri (Row Level Security).

## Belum ada (rencana berikutnya)

- Notifikasi push ke HP
