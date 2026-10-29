/**
 * Prapemrosesan frame kamera sebelum dikirim ke Tesseract.
 *
 * Tujuan utamanya bukan mempercantik gambar, tetapi membantu OCR:
 * - menyeragamkan warna menjadi grayscale,
 * - meregangkan kontras agar tulisan hitam lebih tegas,
 * - menyesuaikan ukuran agar teks kecil pada KTP lebih mudah dibaca.
 */

// Lebar minimum membantu Tesseract membaca teks KTP yang kecil.
const MIN_TARGET_WIDTH = 1200

// Lebar maksimum menjaga waktu proses tetap wajar di perangkat biasa.
const MAX_TARGET_WIDTH = 1800

// Persentil untuk membuang piksel ekstrem (bayangan gelap / pantulan terang).
const LOW_PERCENTILE = 0.02
const HIGH_PERCENTILE = 0.98

/**
 * Membatasi nilai agar selalu berada di rentang minimum dan maksimum.
 *
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

/**
 * Mencari nilai intensitas pada persentil tertentu dari histogram.
 *
 * @param {Uint32Array} histogram
 * @param {number} totalPixels
 * @param {number} percentile
 * @returns {number}
 */
function findHistogramPercentile(histogram, totalPixels, percentile) {
  const target = totalPixels * percentile
  let cumulative = 0

  for (let intensity = 0; intensity < histogram.length; intensity += 1) {
    cumulative += histogram[intensity]
    if (cumulative >= target) return intensity
  }

  return histogram.length - 1
}

/**
 * Mengubah frame kamera menjadi canvas grayscale dengan kontras yang lebih baik.
 *
 * @param {HTMLCanvasElement} sourceCanvas Frame asli dari kamera.
 * @returns {HTMLCanvasElement} Canvas baru yang siap dibaca Tesseract.
 */
export function preprocessCapture(sourceCanvas) {
  if (!sourceCanvas?.width || !sourceCanvas?.height) return sourceCanvas

  // Perbesar bila frame terlalu kecil, tetapi jangan melewati batas maksimum.
  const desiredScale = Math.max(1, MIN_TARGET_WIDTH / sourceCanvas.width)
  const scale = Math.min(desiredScale, MAX_TARGET_WIDTH / sourceCanvas.width)
  const targetWidth = Math.round(sourceCanvas.width * scale)
  const targetHeight = Math.round(sourceCanvas.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = targetWidth
  canvas.height = targetHeight

  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return sourceCanvas

  // Penskalaan halus membantu huruf kecil tetap memiliki tepi yang jelas.
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  context.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight)

  const imageData = context.getImageData(0, 0, targetWidth, targetHeight)
  const pixels = imageData.data
  const histogram = new Uint32Array(256)

  // Tahap 1: hitung luminance setiap piksel untuk histogram kontras.
  for (let index = 0; index < pixels.length; index += 4) {
    const luminance = Math.round(
      pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114,
    )

    histogram[luminance] += 1
  }

  const totalPixels = targetWidth * targetHeight
  const low = findHistogramPercentile(histogram, totalPixels, LOW_PERCENTILE)
  const high = findHistogramPercentile(histogram, totalPixels, HIGH_PERCENTILE)
  const range = high - low

  // Tahap 2: buat lookup table grayscale yang sudah diregangkan.
  const lookup = new Uint8Array(256)
  for (let intensity = 0; intensity < 256; intensity += 1) {
    // Jika kontras gambar sudah sangat rendah, gunakan grayscale apa adanya
    // agar hasil tidak menjadi noise yang berlebihan.
    lookup[intensity] =
      range >= 32 ? clamp(Math.round(((intensity - low) / range) * 255), 0, 255) : intensity
  }

  // Tahap 3: terapkan lookup table ke seluruh piksel.
  for (let index = 0; index < pixels.length; index += 4) {
    const luminance = Math.round(
      pixels[index] * 0.299 + pixels[index + 1] * 0.587 + pixels[index + 2] * 0.114,
    )
    const value = lookup[luminance]

    pixels[index] = value
    pixels[index + 1] = value
    pixels[index + 2] = value
  }

  context.putImageData(imageData, 0, 0)
  return canvas
}
