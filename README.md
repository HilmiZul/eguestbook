# Buku Tamu OCR

Aplikasi web untuk menangkap bagian KTP dari kamera webcam, lalu mengubah
NIK, Nama, dan Alamat menjadi teks JSON langsung di browser.

## Fitur

- Pratinjau kamera aktif hanya setelah tombol **Mulai Kamera** ditekan.
- Capture frame dan OCR memakai Tesseract.js dengan model bahasa Indonesia.
- Ekstraksi NIK, Nama, dan Alamat dengan toleransi terhadap salah baca umum.
- Hasil JSON dapat diedit dan disalin lewat tombol **Salin** di dalam textarea.
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

Buka `http://localhost:5173`, tekan **Mulai Kamera**, lalu izinkan akses kamera.

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
│   ├── CameraPanel.vue         # Pratinjau kamera dan kontrol capture
│   └── ResultPanel.vue         # Textarea JSON dan tombol salin
├── composables/
│   ├── useCamera.js            # Izin, stream, dan capture frame
│   └── useKtpScan.js           # Orkestrasi OCR dua tahap
├── services/ktp/
│   ├── ocrClient.js            # Worker Tesseract yang dipakai ulang
│   ├── parseKtp.js             # Parser teks OCR menjadi field KTP
│   └── preprocessCapture.js    # Grayscale dan peregangan kontras
└── utils/
    └── clipboard.js            # Clipboard API dan fallback
```

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
- Gambar dan data tidak disimpan atau dikirim ke mana pun.
