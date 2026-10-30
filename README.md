# Buku Tamu OCR

Aplikasi web untuk menangkap bagian KTP dari kamera webcam, lalu mengubah
NIK, Nama, dan Alamat menjadi teks JSON langsung di browser. Tersedia juga
form selfie dan ringkasan hasil foto yang memakai data dari hasil pindai KTP.

## Fitur

- Layout dua kolom: pindai KTP di kiri, selfie di kanan.
- Pratinjau kamera aktif hanya setelah tombol **Buka Kamera** ditekan.
- Capture frame dan OCR memakai Tesseract.js dengan model bahasa Indonesia.
- Ekstraksi NIK, Nama, dan Alamat dengan toleransi terhadap salah baca umum.
- Form opsi **Keperluan** besar di bawah panel hasil: Menjemput Siswa atau
  Kegiatan Workshop.
- Form **Foto Selfie** memakai kamera depan dan menyimpan hasil foto di browser.
- Panel **Hasil Foto** menampilkan foto selfie beserta data NIK, Nama, Alamat,
  dan Keperluan dari hasil pindai KTP.
- Hasil JSON dapat diedit dan disalin lewat tombol **Salin** di dalam textarea.
- Pilihan keperluan otomatis disertakan pada hasil JSON.
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
│   ├── KeperluanPanel.vue      # Form opsi keperluan tamu
│   ├── PhotoResultPanel.vue    # Foto selfie dan ringkasan data KTP
│   ├── ResultPanel.vue         # Textarea JSON dan tombol salin
│   └── SelfiePanel.vue         # Kamera depan dan kontrol ambil foto
├── composables/
│   ├── useCamera.js            # Izin, stream, arah kamera, dan capture frame
│   └── useKtpScan.js           # Orkestrasi OCR dua tahap
├── services/ktp/
│   ├── ocrClient.js            # Worker Tesseract yang dipakai ulang
│   ├── parseKtp.js             # Parser teks OCR menjadi field KTP
│   └── preprocessCapture.js    # Grayscale dan peregangan kontras
└── utils/
    └── clipboard.js            # Clipboard API dan fallback
```

## Alur Penggunaan

1. Buka kamera pada panel **Pindai KTP** di kolom kiri, lalu tekan **Pindai KTP**.
2. Periksa dan koreksi hasil OCR pada panel **Hasil** di bawahnya.
3. Pilih keperluan tamu pada panel **Keperluan**.
4. Buka kamera pada panel **Foto Selfie** di kolom kanan, lalu tekan **Ambil Foto**.
5. Panel **Hasil Foto** menampilkan foto tamu beserta data dari hasil pindai KTP.

Hanya satu kamera yang aktif dalam satu waktu. Membuka kamera di satu panel
akan menutup kamera pada panel lainnya.

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
