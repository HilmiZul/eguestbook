# Buku Tamu OCR

App ini dibuat untuk capture bagian KTP: NIK, Nama, Alamat yang dapat mengubah dari Image ke Text.

## Techstack

- JS Runtime Bun
- Framework Vue versi terbaru
- Library OCR Tesseract.js

## Struktur Folder Proyek, arsitektur dan Code

- Struktur folder disesuaikan layaknya senior profesional Vue.js
- Arsitektur disesuaikan layaknya senior profesional
- CSS harus mudah dibaca dan beri komentar
- Code harus mudah dibaca mudah dipahami
- Setiap function dan baris code yang penting harus diberikan komentar yang mudah dibaca dan dipahami

## Desain

- Minimalis hitam putih
- Latar putih
- Setiap button warna hitam
- Component berbentuk Squircle, button dan lainnya
- CSS tulis sendiri tanpa menggunakan UI Library/tanpa install Bootstrap atau UI Library lainnya
- Layout:
  - Bagian Atas tengah Judul: Buku Tamu OCR
  - Setelah Judul:
    - Sebelah kiri capture webcam yang diambil dari kamera webcam
    - Sebelah kanan Textarea
    - Tombol copy text warna hitam floating didalam Textarea
- Jenis font OpenSans
- Jangan gunakan icon/emoji

## Workflow/cara kerja

- Camera webcam aktif saat tombol mulai ditekan
- Capture dan convert Image to Text saat tombol Capture ditekan
- Recognizing dan konversi bagian NIK, Nama dan Alamat pada KTP kedalam Text
- Output text ditampilkan ke Textarea sebelah kanan dalam bentuk format JSON: NIK, Nama, Alamat

## Git

- Init Git
- File dan folder yang tidak perlu dan secret masukkan kedaftar .gitignore
- Setelah selesai semua tugas, commit ke branch main
- Setiap commit harus dalam bahasa indonesia dengan format:
  - awalan *Fix* untuk perbaikan bug
  - awalan *Feat* untuk penambahan atau perubahan fitur

## Larangan

- Jangan install UI Lib CSS Bootstrap atau Tailwind atau lainnya
- Jangan install Database
- Jangan lakukan git push tanpa konfirmasi
- Jangan lakukan commit file dan folder secret/penting atau yang tidak perlu

## Rules/Aturan

- Setiap perubahan commit tulis pada CHANGELOG.md dengan format nomor versi - tanggal dan daftar perubahan/commit dibawahnya
- CHANGELOG.md harus dalam bahasa indonesia
