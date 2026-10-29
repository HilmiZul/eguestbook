/**
 * Parser teks OCR KTP.
 *
 * Tesseract mengembalikan teks bebas, sehingga hasilnya perlu dibersihkan
 * dan dipetakan kembali ke field NIK, Nama, dan Alamat. Semua fungsi di sini
 * murni (tanpa DOM) agar mudah diuji dan dipakai ulang.
 */

// Pemetaan karakter yang sering tertukar dengan angka saat OCR NIK.
const OCR_DIGIT_SUBSTITUTIONS = {
  O: '0',
  o: '0',
  Q: '0',
  D: '0',
  d: '0',
  I: '1',
  i: '1',
  l: '1',
  '|': '1',
  Z: '2',
  z: '2',
  A: '4',
  a: '4',
  S: '5',
  s: '5',
  G: '6',
  b: '6',
  T: '7',
  B: '8',
  g: '9',
  q: '9',
}

/**
 * Pola label dibuat toleran terhadap spasi dan salah baca umum.
 * Contoh: "N I K", "N1K", "Narna", atau "Alamal" tetap dikenali.
 */
const LABEL_PATTERNS = {
  nik: /N\s*[I1l|]\s*K\b/i,
  nama: /N\s*[AO]\s*[MR]\s*N?\s*A\b/i,
  alamat: /A\s*L\s*A\s*M\s*[A4]\s*[T7l|]\b/i,
  rtRw: /R\s*T\s*[/|]\s*R\s*W\b/i,
  kelDesa: /K\s*E\s*L\s*[/|.]?\s*D\s*E\s*S\s*A\b/i,
  kecamatan: /K\s*E\s*C\s*A\s*M\s*A\s*T\s*A\s*N\b/i,
  agama: /A\s*G\s*A\s*M\s*A\b/i,
  status: /S\s*T\s*A\s*T\s*U\s*S\b/i,
  pekerjaan: /P\s*E\s*K\s*E\s*R\s*J\s*A\s*A\s*N\b/i,
  kewarganegaraan: /K\s*E\s*W\s*A\s*R\s*G\s*A\s*N\s*E\s*G\s*A\s*R\s*A\s*A\s*N\b/i,
  berlaku: /B\s*E\s*R\s*L\s*A\s*K\s*U\b/i,
  golonganDarah: /G\s*O\s*L\s*[O0]?\s*N\s*G\s*A\s*N\b/i,
  jenisKelamin: /J\s*E\s*N\s*I\s*S\s*K\s*E\s*L\s*A\s*M\s*I\s*N\b/i,
  tempatLahir: /T\s*E\s*M\s*P\s*A\s*T\b/i,
}

// Semua field selain NIK dapat menjadi batas akhir nilai Nama.
const NAMA_BOUNDARIES = [
  LABEL_PATTERNS.nik,
  LABEL_PATTERNS.tempatLahir,
  LABEL_PATTERNS.jenisKelamin,
  LABEL_PATTERNS.alamat,
  LABEL_PATTERNS.rtRw,
  LABEL_PATTERNS.kelDesa,
  LABEL_PATTERNS.kecamatan,
  LABEL_PATTERNS.agama,
  LABEL_PATTERNS.status,
  LABEL_PATTERNS.pekerjaan,
  LABEL_PATTERNS.kewarganegaraan,
  LABEL_PATTERNS.berlaku,
  LABEL_PATTERNS.golonganDarah,
]

// Alamat dihentikan ketika field berikutnya pada KTP dimulai.
const ALAMAT_BOUNDARIES = [
  LABEL_PATTERNS.rtRw,
  LABEL_PATTERNS.kelDesa,
  LABEL_PATTERNS.kecamatan,
  LABEL_PATTERNS.agama,
  LABEL_PATTERNS.status,
  LABEL_PATTERNS.pekerjaan,
  LABEL_PATTERNS.kewarganegaraan,
  LABEL_PATTERNS.berlaku,
  LABEL_PATTERNS.golonganDarah,
  LABEL_PATTERNS.jenisKelamin,
  LABEL_PATTERNS.tempatLahir,
  LABEL_PATTERNS.nik,
  LABEL_PATTERNS.nama,
]

/**
 * Membuat objek hasil dengan struktur yang selalu sama.
 *
 * @returns {{ NIK: string, Nama: string, Alamat: string }}
 */
export function createEmptyKtpFields() {
  return { NIK: '', Nama: '', Alamat: '' }
}

/**
 * Memecah teks OCR menjadi baris-baris yang sudah dirapikan.
 *
 * @param {string} text
 * @returns {string[]}
 */
function toCleanLines(text) {
  return String(text ?? '')
    .replace(/\r/g, '')
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .filter(Boolean)
}

/**
 * Membersihkan nilai setelah label: membuang titik dua di awal dan
 * merapikan spasi berlebih.
 *
 * @param {string} rawValue
 * @returns {string}
 */
function cleanInlineValue(rawValue) {
  return rawValue
    .replace(/^[\s:;.,\-–—]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Mencari posisi label batas paling awal di dalam sebuah nilai.
 *
 * @param {string} value
 * @param {RegExp[]} boundaries
 * @returns {number} -1 jika tidak ada label batas.
 */
function findBoundaryIndex(value, boundaries) {
  let earliestIndex = -1

  for (const pattern of boundaries) {
    const match = value.match(pattern)
    if (!match) continue

    if (earliestIndex === -1 || match.index < earliestIndex) {
      earliestIndex = match.index
    }
  }

  return earliestIndex
}

/**
 * Mengambil nilai yang mengikuti label pada satu baris, lalu memotongnya
 * jika ada field lain yang ikut terbaca di baris yang sama.
 *
 * @param {string} line
 * @param {RegExp} labelPattern
 * @param {RegExp[]} boundaries
 * @returns {string}
 */
function extractLabeledValue(line, labelPattern, boundaries) {
  const labelMatch = line.match(labelPattern)
  if (!labelMatch) return ''

  const afterLabel = line.slice(labelMatch.index + labelMatch[0].length)
  const boundaryIndex = findBoundaryIndex(afterLabel, boundaries)
  const value = boundaryIndex === -1 ? afterLabel : afterLabel.slice(0, boundaryIndex)

  return cleanInlineValue(value)
}

/**
 * Memeriksa apakah sebuah baris dimulai dengan salah satu label field KTP.
 * Dipakai untuk berhenti membaca alamat yang terpotong beberapa baris.
 *
 * @param {string} line
 * @param {RegExp[]} patterns
 * @returns {boolean}
 */
function lineStartsWithAnyLabel(line, patterns) {
  return patterns.some((pattern) => {
    const match = line.match(pattern)
    return Boolean(match) && match.index <= 2
  })
}

/**
 * Mengganti huruf yang sering salah baca menjadi angka, khusus untuk NIK.
 *
 * @param {string} value
 * @returns {string}
 */
function normalizeNikCharacters(value) {
  return value.replace(/[OoQDdIil|ZzAaSsGgbTtBgq]/g, (character) => {
    return OCR_DIGIT_SUBSTITUTIONS[character] ?? character
  })
}

/**
 * Memeriksa apakah 16 digit NIK masuk akal secara struktur:
 * kode provinsi 11-94, tanggal 01-71 (perempuan ditambah 40), bulan 01-12.
 *
 * @param {string} nik
 * @returns {boolean}
 */
function isPlausibleNik(nik) {
  if (!/^\d{16}$/.test(nik)) return false

  const provinceCode = Number(nik.slice(0, 2))
  const day = Number(nik.slice(6, 8))
  const month = Number(nik.slice(8, 10))

  return provinceCode >= 11 && provinceCode <= 94 && day >= 1 && day <= 71 && month >= 1 && month <= 12
}

/**
 * Mencari satu kandidat NIK di dalam baris teks.
 *
 * @param {string} line
 * @param {boolean} allowLooseValue Izinkan kandidat tanpa label NIK.
 * @returns {string}
 */
function findNikInLine(line, allowLooseValue = false) {
  const labelMatch = line.match(LABEL_PATTERNS.nik)
  const source = labelMatch ? line.slice(labelMatch.index + labelMatch[0].length) : line
  const digits = normalizeNikCharacters(source).replace(/\D/g, '')

  if (digits.length < 16) return ''

  // Cek seluruh jendela 16 digit agar satu digit pengganggu tidak
  // membuat NIK yang sebenarnya ikut terbuang.
  for (let start = 0; start <= digits.length - 16; start += 1) {
    const candidate = digits.slice(start, start + 16)
    if (isPlausibleNik(candidate)) return candidate
  }

  // Jika strukturnya tidak lolos validasi (misalnya tanggal salah baca),
  // tetap ambil 16 digit pertama dari baris yang berlabel NIK.
  if (labelMatch || allowLooseValue) return digits.slice(0, 16)

  return ''
}

/**
 * Mengambil NIK dari baris berlabel terlebih dahulu, lalu dari seluruh teks
 * sebagai cadangan bila label gagal terbaca.
 *
 * @param {string[]} lines
 * @returns {string}
 */
function extractNik(lines) {
  const labelIndex = lines.findIndex((line) => LABEL_PATTERNS.nik.test(line))

  if (labelIndex !== -1) {
    // Nilai NIK kadang terlempar ke baris berikutnya saat OCR.
    for (let offset = 0; offset <= 1; offset += 1) {
      const line = lines[labelIndex + offset]
      if (!line) continue

      const candidate = findNikInLine(line)
      if (candidate) return candidate
    }
  }

  // Cadangan: cari baris yang memiliki 16 digit. Kandidat yang strukturnya
  // masuk akal diprioritaskan, tetapi kandidat pertama tetap dipakai bila
  // label NIK dan sebagian digit ikut salah terbaca.
  const looseCandidates = []

  for (const line of lines) {
    const digitsOnly = normalizeNikCharacters(line).replace(/\D/g, '')
    if (digitsOnly.length < 16) continue

    const candidate = findNikInLine(line, true)
    if (!candidate) continue
    if (isPlausibleNik(candidate)) return candidate

    looseCandidates.push(candidate)
  }

  return looseCandidates[0] ?? ''
}

/**
 * Membersihkan nama dari karakter yang tidak lazim pada KTP.
 *
 * @param {string} value
 * @returns {string}
 */
function cleanName(value) {
  return value
    .replace(/[^A-Za-zÀ-ÿ' .-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s.'-]+|[\s.'-]+$/g, '')
    .trim()
}

/**
 * Memastikan kandidat nama benar-benar berisi huruf, bukan deretan angka.
 *
 * @param {string} value
 * @returns {boolean}
 */
function isUsableName(value) {
  const letters = value.replace(/[^A-Za-zÀ-ÿ]/g, '')
  return value.length >= 2 && letters.length >= 2 && letters.length / value.length >= 0.6
}

/**
 * Mengambil field Nama. Bila nilai tidak ada di baris label, nilai dicari
 * pada satu atau dua baris berikutnya.
 *
 * @param {string[]} lines
 * @returns {string}
 */
function extractNama(lines) {
  const labelIndex = lines.findIndex((line) => LABEL_PATTERNS.nama.test(line))
  if (labelIndex === -1) return ''

  const inlineValue = extractLabeledValue(lines[labelIndex], LABEL_PATTERNS.nama, NAMA_BOUNDARIES)
  const inlineName = cleanName(inlineValue)
  if (isUsableName(inlineName)) return inlineName

  for (let offset = 1; offset <= 2; offset += 1) {
    const nextLine = lines[labelIndex + offset]
    if (!nextLine || lineStartsWithAnyLabel(nextLine, NAMA_BOUNDARIES)) break

    const candidate = cleanName(nextLine)
    if (isUsableName(candidate)) return candidate
  }

  return ''
}

/**
 * Merapikan alamat tanpa menghilangkan tanda baca penting seperti titik
 * pada "NO." atau garis miring pada nomor rumah.
 *
 * @param {string} value
 * @returns {string}
 */
function cleanAddress(value) {
  return value
    .replace(/\s+/g, ' ')
    .replace(/\s+([,.;])/g, '$1')
    .replace(/^[\s:;,\-–—]+/, '')
    .replace(/[\s:;,\-–—]+$/, '')
    .trim()
}

/**
 * Mengambil field Alamat, termasuk lanjutan baris selama belum bertemu
 * label field KTP berikutnya (RT/RW, Kel/Desa, Kecamatan, dan seterusnya).
 *
 * @param {string[]} lines
 * @returns {string}
 */
function extractAlamat(lines) {
  const labelIndex = lines.findIndex((line) => LABEL_PATTERNS.alamat.test(line))
  if (labelIndex === -1) return ''

  const parts = []
  const inlineValue = extractLabeledValue(lines[labelIndex], LABEL_PATTERNS.alamat, ALAMAT_BOUNDARIES)
  if (inlineValue) parts.push(inlineValue)

  // Alamat pada KTP dapat terpotong menjadi beberapa baris.
  for (let offset = 1; offset <= 3; offset += 1) {
    const nextLine = lines[labelIndex + offset]
    if (!nextLine || lineStartsWithAnyLabel(nextLine, ALAMAT_BOUNDARIES)) break

    const cleanedLine = cleanInlineValue(nextLine)
    if (cleanedLine) parts.push(cleanedLine)
  }

  return cleanAddress(parts.join(' '))
}

/**
 * Mengubah teks mentah Tesseract menjadi tiga field KTP.
 *
 * @param {string} text
 * @returns {{ NIK: string, Nama: string, Alamat: string }}
 */
export function parseKtpText(text) {
  const lines = toCleanLines(text)

  return {
    NIK: extractNik(lines),
    Nama: extractNama(lines),
    Alamat: extractAlamat(lines),
  }
}

/**
 * Menghitung jumlah field yang berhasil diisi.
 *
 * @param {{ NIK: string, Nama: string, Alamat: string }} fields
 * @returns {number}
 */
export function countKtpFields(fields) {
  return ['NIK', 'Nama', 'Alamat'].filter((key) => Boolean(fields?.[key]?.trim())).length
}

/**
 * Menggabungkan hasil OCR pertama dan kedua tanpa menimpa field yang sudah
 * berhasil terbaca.
 *
 * @param {{ NIK: string, Nama: string, Alamat: string }} primary
 * @param {{ NIK: string, Nama: string, Alamat: string }} fallback
 * @returns {{ NIK: string, Nama: string, Alamat: string }}
 */
export function mergeKtpFields(primary, fallback) {
  return {
    NIK: primary.NIK || fallback.NIK || '',
    Nama: primary.Nama || fallback.Nama || '',
    Alamat: primary.Alamat || fallback.Alamat || '',
  }
}
