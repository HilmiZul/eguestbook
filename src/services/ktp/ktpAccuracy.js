/**
 * Library akurasi pembacaan KTP.
 *
 * Mengumpulkan fungsi normalisasi dan validasi yang dipakai parser KTP
 * agar dapat dipakai ulang oleh modul lain (misalnya deteksi atau
 * pembersihan hasil OCR tambahan) tanpa menggandakan logika.
 */
export {
  normalizeNikCharacters,
  isPlausibleNik,
  cleanName,
  cleanAddress,
  cleanInlineValue,
} from './parseKtp.js'

/**
 * Menerapkan koreksi umum OCR pada teks mentah sebelum diparse.
 * Membantu meningkatkan akurasi NIK, Nama, dan Alamat.
 *
 * @param {string} text
 * @returns {string}
 */
export function refineOcrText(text) {
  return String(text ?? '')
    // Koreksi label yang sering tertukar.
    .replace(/N\s*[1l|]\s*K/gi, 'NIK')
    .replace(/N\s*[Aa]\s*[Mm]\s*[Aa]/g, 'NAMA')
    .replace(/A\s*[Ll]\s*[Aa]\s*[Mm]\s*[Aa][Tt]/g, 'ALAMAT')
}
