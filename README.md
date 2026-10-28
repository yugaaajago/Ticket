# NOC Desk

Tiket pribadi untuk melacak trouble di banyak site. React + Vite, Supabase (login + database), deploy ke Vercel.

## 1. Supabase

1. Buat proyek di https://supabase.com (gratis).
2. Buka **SQL Editor**, tempel seluruh isi `supabase/schema.sql`, lalu **Run**.
3. Buka **Project Settings → API**, salin **Project URL** dan **anon public key**.
4. (Disarankan) Di **Authentication → Sign In / Providers → Email**, matikan *Confirm email* supaya bisa langsung masuk setelah daftar. Setelah akunmu dibuat, matikan juga *Allow new users to sign up* supaya tidak ada orang lain yang bisa mendaftar.

## 2. Jalankan lokal

```bash
cp .env.example .env     # isi URL dan anon key dari langkah 1
npm install
npm run dev
```

Buka alamat yang tampil (biasanya http://localhost:5173), klik **Daftar**, lalu masuk.

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
3. Di **Environment Variables** isi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`.
4. **Deploy**. Buka alamatnya di HP, lalu pilih *Add to Home Screen* agar muncul seperti aplikasi.

## Cara kerja singkat

- Tambah tiket cepat: judul + site saja. Detail (status, prioritas, menunggu siapa, follow-up, catatan) dibuka dengan mengetuk tiket.
- Urutan daftar: lewat jadwal follow-up → follow-up hari ini → sisanya (urgent dulu). Tiket selesai disembunyikan kecuali dicentang.
- Banner di atas menghitung tiket yang lewat jadwal dan yang jatuh tempo hari ini.
- Keamanan data memakai Row Level Security: setiap akun hanya bisa membaca dan mengubah tiketnya sendiri.

## Belum ada (rencana berikutnya)

- Notifikasi push ke HP
