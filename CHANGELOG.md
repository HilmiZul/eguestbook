# CHANGELOG

## v1.5.0 (31 Oktober 2026)

- Feat: mengaktifkan tombol Kirim untuk mengirim data tamu (nik, nama, alamat, keperluan, foto) ke spreadsheet
- Feat: menambahkan kolom tanggal pada data yang dikirim dan Apps Script
- Feat: Apps Script menyimpan foto selfie ke Google Drive dan mencatat tautannya
- Fix: menyinkronkan status pengiriman dengan tombol Kirim
- Fix: menambahkan credentials pada request pengiriman untuk mengatasi 401 Unauthorized
- Feat: menampilkan feedback berhasil terkirim dalam bentuk modal dengan pesan "Berhasil Tersimpan!"
- Fix: merender modal dan pesan error pengiriman melalui slot default ResultPanel
- Fix: menghapus referensi `sendStatus` yang sudah tidak ada (penyebab ReferenceError)
- Perbaikan: modal feedback berhasil terkirim tanpa tombol tutup, menggunakan progress bar countdown 5 detik
- Perbaikan 2: animasi progress bar modal feedback berhasil terkirim menggunakan keyframes
- Perubahan layout 8: layout 2x2, keperluan terpisah, opsi keperluan bertambah (Mengambil ijazah, Rapat orang tua)
- Revisi 8: tombol kirim disatukan di panel keperluan dengan ukuran penuh seperti tombol scan
- Revisi 9: input hasil disusun vertikal dan diperlebar, opsi keperluan tidak terpotong, tombol kirim digabung ke panel keperluan
- Revisi 10: tombol kirim disamakan ukurannya dengan tombol scan, opsi keperluan tanpa scroll
- Revisi 11: tombol kirim diperlebar penuh, tampilan dirapikan untuk tablet
- Revisi 12: tombol kirim di panel keperluan dilebarkan penuh (slotted styling)
- Feat: modal feedback gagal kirim dengan pesan "gagal terkirim, periksa jaringan dan kirim ulang" dan tombol "Siap"
- Perubahan layout 7: foto hasil di kiri, input nik/nama/alamat di kanan satu baris, keperluan terpisah, tinggi panel disesuaikan

## v1.4.0 (30 Oktober 2026)

- Feat: pratinjau kamera KTP memakai rasio fisik kartu KTP
- Feat: layout dua kolom: kamera KTP dan selfie di kiri, hasil foto dan hasil scan di kanan
- Feat: layout desktop dioptimalkan untuk Full HD 1920 x 1080 tanpa scroll
- Feat: pemilih kamera pada tiap panel untuk memisahkan dua webcam
- Feat: label status pada panel kamera dihapus agar tampilan lebih ringkas
- Feat: teks petunjuk yang tidak perlu dikurangi agar tampilan lebih ringkas

## v1.3.0 (30 Oktober 2026)

- Feat: kamera KTP dan kamera selfie dapat aktif bersamaan
- Feat: layout desktop dan tablet dibuat satu layar penuh tanpa scroll
- Feat: ukuran panel, tombol, dan teks dikecilkan agar semua form muat
- Feat: form Keperluan digabung ke bagian bawah panel Hasil KTP
- Feat: panel hasil dan selfie menyesuaikan tinggi layar secara otomatis

## v1.2.0 (30 Oktober 2026)

- Feat: mengubah layout menjadi dua kolom, pindai KTP di kiri dan selfie di kanan
- Feat: memindahkan panel Hasil dan opsi Keperluan ke bawah form pindai KTP
- Feat: menambahkan form Foto Selfie dengan kamera depan
- Feat: menambahkan panel Hasil Foto berisi foto selfie dan data hasil pindai KTP
- Feat: kamera KTP dan kamera selfie tidak aktif bersamaan

## v1.1.0 (30 Oktober 2026)

- Feat: menambahkan form opsi Keperluan (Menjemput Siswa dan Kegiatan Workshop)
- Feat: form opsi ditempatkan di bawah panel Hasil dengan kartu pilihan besar
- Feat: pilihan Keperluan disertakan pada hasil JSON

## v1.0.0 (29 Oktober 2026)

- Initial proyek
- Uji coba OCR menggunakan Tesseract.js
