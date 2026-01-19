# Sistem Informasi Kelompok Tani  
## Desa Rijang Panua

Website **Sistem Informasi Kelompok Tani Desa Rijang Panua** adalah aplikasi berbasis web yang dikembangkan untuk mendukung digitalisasi pengelolaan data kelompok pertanian di tingkat desa, meliputi **Gapoktan, Kelompok Tani, Kelompok Kebun, dan Kelompok Wanita Tani (KWT)**.

Aplikasi ini menyediakan akses **publik** untuk masyarakat dan **admin panel** untuk perangkat desa atau pengurus yang berwenang.

---

## Latar Belakang
Sebelum sistem ini dibangun, pengelolaan data kelompok pertanian di Desa Rijang Panua masih dilakukan secara manual menggunakan dokumen fisik, sehingga:
- Sulit dicari dan diperbarui
- Rentan hilang atau tidak sinkron
- Kurang transparan bagi masyarakat

Website ini dikembangkan sebagai solusi digital agar data kelompok pertanian dapat dikelola secara **terpusat, akurat, transparan, dan mudah diakses** oleh semua pihak terkait.

---

## Tujuan Sistem
- Menyediakan media informasi kelompok pertanian yang mudah diakses publik
- Mempermudah perangkat desa dalam pengelolaan data kelompok
- Mendukung transparansi dan efisiensi administrasi desa
- Mengurangi ketergantungan pada dokumen manual

---

## Jenis Pengguna
### 1. Pengguna Publik
- Tidak memerlukan login
- Dapat melihat seluruh data kelompok yang dipublikasikan

### 2. Admin
- Perangkat desa / pengurus kelompok
- Mengelola data kelompok dan anggota

### 3. Superadmin
- Memiliki seluruh hak admin
- Mengelola akun admin dan pengaturan tampilan website

---

## Fitur Utama

### Fitur Pengguna Publik
- Homepage dengan statistik:
  - Jumlah kelompok per kategori
  - Total anggota
  - Total luas lahan
- Daftar seluruh kelompok pertanian
- Pencarian kelompok berdasarkan:
  - Nama kelompok
  - Pengurus (ketua, sekretaris, bendahara)
- Filter berdasarkan kategori kelompok
- Halaman detail kelompok:
  - Informasi kelompok
  - Lokasi
  - Luas lahan
  - Daftar anggota (dengan pagination & search)

---

### Fitur Admin
- Login, logout, dan reset password
- Dashboard admin dengan statistik real-time
- Kelola data kelompok:
  - Tambah, edit, hapus kelompok
  - Export data kelompok (ZIP Excel)
  - Refresh statistik
- Kelola anggota kelompok:
  - Tambah, edit, hapus anggota
  - Export data anggota ke Excel
- Fitur khusus Gapoktan:
  - Kelola pengurus Gapoktan
  - Kelola kelompok anggota Gapoktan

---

### Fitur Superadmin
- Manajemen akun admin:
  - Tambah admin
  - Edit role (Admin / Superadmin)
  - Aktif / nonaktif akun
  - Hapus admin
- Pengaturan tampilan:
  - Mengganti background/header homepage website

---

## Akses Website
- **Publik**  
  https://kelompok-tani-rijang-panua.web.app/

- **Admin Panel**  
  https://kelompok-tani-rijang-panua.web.app/admin/

---

## Teknologi yang Digunakan
- **Frontend**: React + Vite
- **Styling**: Tailwind CSS
- **UI Table**: Material React Table (MRT)
- **Backend / Service**: Firebase
  - Firebase Authentication
  - Firebase Hosting
  - Firestore Database
  - Firebase Storage

---

## Menjalankan Proyek Secara Lokal

### 1. Clone Repository
```bash
git clone https://github.com/Entrind/Kelompok-Tani-Rijang-Panua.git
cd Kelompok-Tani-Rijang-Panua
```
### 2. Install Dependency
```bash
npm install
```
### 3. Konfigurasi Environment
Buat file .env:
```bash
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```
### 4. Jalankan Development Server
```bash
npm run dev
```
Akses di Browser:
http://localhost:5173

---

## Deployment
Website ini dideploy menggunakan Firebase Hosting.
```bash
npm run build
firebase deploy
```

---

## Dokumentasi
Dokumentasi penggunaan lengkap tersedia pada: <br>
Buku Panduan Penggunaan Website 
[Lihat PDF di GitHub]([https://github.com/Entrind/Kelompok-Tani-Rijang-Panua/blob/main/Buku_Panduan_Penggunaan_Website Sistem Informasi Kelompok Tani Desa Rijang Panua.pdf](https://github.com/Entrind/Kelompok-Tani-Rijang-Panua/blob/main/Buku%20Panduan%20Penggunaan%20Website%20Sistem%20Informasi%20Kelompok%20Tani%20Desa%20Rijang%20Panua.pdf))
