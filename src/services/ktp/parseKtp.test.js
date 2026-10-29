import { describe, expect, test } from 'bun:test'
import { countKtpFields, createEmptyKtpFields, mergeKtpFields, parseKtpText } from './parseKtp.js'

const KTP_STANDARD = `
PROVINSI JAWA BARAT
KABUPATEN BANDUNG
NIK : 3204 1234 5678 0001
Nama : BUDI SANTOSO
Tempat/Tgl Lahir : BANDUNG, 12-03-1990
Jenis Kelamin : LAKI-LAKI
Alamat : JL. MERDEKA NO. 10
RT/RW : 001/002
Kel/Desa : SUKAMAJU
Kecamatan : CIMAHI
Agama : ISLAM
Status Perkawinan : KAWIN
Pekerjaan : KARYAWAN SWASTA
Kewarganegaraan : WNI
Berlaku Hingga : SEUMUR HIDUP
`

describe('parseKtpText', () => {
  test('membaca NIK, Nama, dan Alamat dari KTP standar', () => {
    expect(parseKtpText(KTP_STANDARD)).toEqual({
      NIK: '3204123456780001',
      Nama: 'BUDI SANTOSO',
      Alamat: 'JL. MERDEKA NO. 10',
    })
  })

  test('menangani salah baca umum pada label dan NIK', () => {
    const text = `
N1K : 3204 O123 4567 8901
Narna : SITI AMINAH
Alamal : JL. MAWAR NO. 5 RT/RW 003/004
Kecamatan : CIMAHI
`

    expect(parseKtpText(text)).toEqual({
      NIK: '3204012345678901',
      Nama: 'SITI AMINAH',
      Alamat: 'JL. MAWAR NO. 5',
    })
  })

  test('mengambil alamat yang terpotong ke baris berikutnya', () => {
    const text = `
Nama : AHMAD FAUZI
Alamat
JL. KENANGA NO. 7
BLOK C
RT/RW : 005/006
Kel/Desa : SUKAJADI
`

    expect(parseKtpText(text).Alamat).toBe('JL. KENANGA NO. 7 BLOK C')
  })

  test('mengambil nama dari baris setelah label', () => {
    expect(parseKtpText('Nama\nAHMAD FAUZI\nAlamat : JL. MELATI').Nama).toBe('AHMAD FAUZI')
  })

  test('tetap menemukan NIK saat label NIK gagal terbaca', () => {
    const text = `
PROVINSI JAWA BARAT
3204 O123 4567 8901
Nama : SITI AMINAH
Alamat : JL. MAWAR NO. 5
`

    expect(parseKtpText(text).NIK).toBe('3204012345678901')
  })

  test('mengembalikan field kosong bila teks tidak relevan', () => {
    expect(parseKtpText('Tidak ada kartu di depan kamera')).toEqual(createEmptyKtpFields())
  })
})

describe('utils field KTP', () => {
  test('menghitung field yang terisi', () => {
    expect(countKtpFields({ NIK: '3204', Nama: '', Alamat: 'JL. A' })).toBe(2)
  })

  test('menggabungkan hasil OCR tanpa menimpa field yang sudah ada', () => {
    expect(
      mergeKtpFields(
        { NIK: '3204123456780001', Nama: '', Alamat: '' },
        { NIK: '9999', Nama: 'BUDI', Alamat: 'JL. MERDEKA' },
      ),
    ).toEqual({
      NIK: '3204123456780001',
      Nama: 'BUDI',
      Alamat: 'JL. MERDEKA',
    })
  })
})
