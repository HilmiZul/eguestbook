# Buku Tamu OCR

Aplikasi web untuk menangkap bagian KTP dari kamera webcam, lalu mengubah
NIK, Nama, dan Alamat menjadi teks JSON langsung di browser. Tersedia juga
form selfie dan ringkasan hasil foto yang memakai data dari hasil pindai KTP.

## Fitur

- Layout dua kolom satu layar: kamera KTP dan selfie di kiri, hasil foto dan
  hasil scan di kanan, tanpa scroll.
- Layout desktop dioptimalkan untuk Full HD 1920 x 1080 piksel.
- Kamera KTP dan kamera selfie dapat aktif bersamaan.
- Pemilih **Kamera** di tiap panel untuk memisahkan dua webcam.
- Pratinjau kamera KTP memakai rasio fisik kartu KTP (85,6 : 54).
- Pratinjau kamera aktif hanya setelah tombol **Buka Kamera** ditekan.
- Capture frame dan OCR memakai Tesseract.js dengan model bahasa Indonesia.
- Ekstraksi NIK, Nama, dan Alamat dengan toleransi terhadap salah baca umum.
- Form opsi **Keperluan** menyatu di bagian bawah panel Hasil.
- Form **Foto Selfie** memakai kamera depan dan menyimpan hasil foto di browser.
- Panel **Hasil Foto** menampilkan foto selfie beserta data NIK, Nama, Alamat,
  dan Keperluan dari hasil pindai KTP.
- Hasil scan (NIK, Nama, Alamat) dapat diedit langsung pada panel Hasil.
- Pilihan keperluan disertakan pada data tamu.
- Seluruh pemrosesan gambar berjalan lokal di browser.

## Teknologi

- Bun sebagai JavaScript runtime dan package manager.
- Vue 3 dengan Composition API.
- Vite untuk pengembangan dan build.
- Tesseract.js untuk OCR.
- CSS ditulis manual tanpa UI library.
- Font Open Sans dari @fontsource (disajikan lokal).

## Menjalankan

```bash
bun install
bun run dev
```

Buka `http://localhost:5173`, tekan **Buka Kamera**, lalu izinkan akses kamera.

> Kamera hanya dapat diakses melalui `localhost` atau HTTPS. Jika membuka
> aplikasi dari alamat IP jaringan lokal, gunakan HTTPS agar browser
> mengizinkan `getUserMedia`.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `bun run dev` | Menjalankan server pengembangan Vite |
| `bun run build` | Membuat build produksi di folder `dist/` |
| `bun run preview` | Melihat hasil build produksi |
| `bun test` | Menjalankan unit test parser |

## Struktur Proyek

```text
src/
├── App.vue                     # Orkestrasi halaman dan alur scan
├── main.js                     # Entry point, font, dan style global
├── assets/styles/
│   ├── tokens.css              # Variabel warna, radius, dan transisi
│   └── base.css                # Reset dan komponen bersama
├── components/
│   ├── AppHeader.vue           # Judul aplikasi
│   ├── CameraPanel.vue         # Pratinjau kamera dan kontrol capture KTP
│   ├── KeperluanPanel.vue      # Form opsi keperluan di panel hasil
│   ├── PhotoResultPanel.vue    # Foto selfie dan ringkasan data KTP
│   ├── ResultPanel.vue         # Textarea JSON, tombol salin, dan keperluan
│   └── SelfiePanel.vue         # Kamera depan dan kontrol ambil foto
├── composables/
│   ├── useCamera.js            # Izin, stream, pilihan kamera, dan capture frame
│   └── useKtpScan.js           # Orkestrasi OCR dua tahap
├── services/ktp/
│   ├── ocrClient.js            # Worker Tesseract yang dipakai ulang
│   ├── parseKtp.js             # Parser teks OCR menjadi field KTP
│   └── preprocessCapture.js    # Grayscale dan peregangan kontras
└── utils/
    └── clipboard.js            # Clipboard API dan fallback
```

## Alur Penggunaan

1. Pilih **Kamera** pada panel **Pindai KTP** di kiri atas, lalu tekan **Buka Kamera**.
2. Tekan **Pindai KTP**; hasil OCR tampil pada panel **Hasil** di kanan bawah.
3. Pilih keperluan tamu pada bagian bawah panel **Hasil**.
4. Pilih **Kamera** lain pada panel **Foto Selfie** di kiri bawah, lalu tekan **Buka Kamera**.
5. Tekan **Ambil Foto**; panel **Hasil Foto** di kanan atas menampilkan foto tamu
   beserta data KTP.

Kedua kamera dapat menyala bersamaan sehingga KTP dan selfie bisa diproses
dalam satu sesi. Bila terdapat dua webcam, pilihan **Kamera otomatis** akan
memakai perangkat yang berbeda untuk panel KTP dan selfie. Layout desktop
dioptimalkan untuk 1920 x 1080 piksel dan tetap muat tanpa scroll pada tablet
maupun layar yang lebih kecil. Pada layar ponsel yang sangat sempit, kolom
ditumpuk agar tetap dapat digunakan.

## Cara Kerja OCR

1. Frame kamera diambil ke canvas tanpa dikirim ke server.
2. Gambar diubah menjadi grayscale, kontrasnya diregangkan, dan diskalakan.
3. Tesseract.js membaca teks dengan mode `SINGLE_BLOCK`.
4. Parser mencocokkan label NIK, Nama, dan Alamat secara toleran.
5. Bila masih ada field kosong, OCR diulang pada frame asli dengan mode
   `SPARSE_TEXT`, lalu hasilnya digabung.

Model bahasa Indonesia diunduh sekali dari CDN Tesseract.js saat pemakaian
pertama, kemudian disimpan di cache browser. Karena itu koneksi internet
dibutuhkan pada proses OCR pertama.

## Batasan

- Kualitas hasil bergantung pada pencahayaan, ketajaman kamera, dan posisi KTP.
- OCR tidak memverifikasi keaslian KTP.
- Hasil dapat diedit manual untuk mengoreksi salah baca.
- Gambar KTP dan foto selfie tidak disimpan atau dikirim ke mana pun.
- Foto selfie hanya berada di memori halaman dan hilang saat halaman dimuat ulang.

## Kontribusi

Lihat `KONTRIBUSI.md`
