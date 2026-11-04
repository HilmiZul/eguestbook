/**
 * Composable pemindaian KTP.
 *
 * Mengatur alur OCR dua tahap:
 * 1. Pass utama memakai gambar yang sudah diprapemrosesan.
 * 2. Bila ada field yang belum terbaca, pass kedua memakai frame asli
 *    dengan mode sparse text untuk menangkap teks yang terpisah-pisah.
 */

import { onBeforeUnmount, ref } from 'vue'
import { PSM } from 'tesseract.js'
import { recognizeKtp, terminateOcrWorker } from '../services/ktp/ocrClient.js'
import {
  countKtpFields,
  createEmptyKtpFields,
  mergeKtpFields,
  parseKtpText,
} from '../services/ktp/parseKtp.js'
import { preprocessCapture } from '../services/ktp/preprocessCapture.js'

// Status bawaan Tesseract diterjemahkan agar pesan di UI konsisten.
const OCR_STATUS_LABELS = {
  'loading tesseract core': 'Menyiapkan mesin OCR',
  'initializing tesseract': 'Menginisialisasi mesin OCR',
  'loading language traineddata': 'Memuat model bahasa Indonesia',
  'initializing api': 'Menyiapkan pembacaan teks',
  'recognizing text': 'Membaca teks KTP',
}

/**
 * Menyusun pesan yang ramah pengguna saat OCR gagal.
 *
 * @param {unknown} error
 * @returns {string}
 */
function getOcrErrorMessage(error) {
  const message = error instanceof Error ? error.message.toLowerCase() : ''

  if (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('load') ||
    message.includes('failed to download')
  ) {
    return 'Model OCR gagal dimuat. Periksa koneksi internet, lalu coba capture ulang.'
  }

  return 'OCR gagal dijalankan. Coba capture ulang atau muat ulang halaman.'
}

/**
 * @returns {{
 *   isScanning: import('vue').Ref<boolean>,
 *   progress: import('vue').Ref<number>,
 *   statusMessage: import('vue').Ref<string>,
 *   result: import('vue').Ref<{ NIK: string, Nama: string, Alamat: string }>,
 *   notice: import('vue').Ref<string>,
 *   error: import('vue').Ref<string>,
 *   scan: (frame: HTMLCanvasElement) => Promise<void>,
 * }}
 */
export function useKtpScan() {
  const isScanning = ref(false)
  const progress = ref(0)
  const statusMessage = ref('')
  const result = ref(createEmptyKtpFields())
  const notice = ref('')
  const error = ref('')

  /**
   * Memperbarui progres berdasarkan pesan logger Tesseract.
   *
   * @param {{ status: string, progress: number }} message
   */
  function handleProgress(message) {
    const label = OCR_STATUS_LABELS[message.status] ?? 'Memproses gambar'
    statusMessage.value = label
    progress.value = Math.round((message.progress ?? 0) * 100)
  }

  /**
   * Menjalankan satu pass OCR.
   *
   * @param {HTMLCanvasElement} image
   * @param {number} psm
   * @returns {Promise<{ text: string }>}
   */
  async function runRecognition(image, psm) {
    return recognizeKtp(image, {
      psm,
      onProgress: handleProgress,
    })
  }

  /**
   * Menyusun pesan hasil setelah proses OCR selesai.
   *
   * @param {{ NIK: string, Nama: string, Alamat: string }} fields
   * @returns {string}
   */
  function buildNotice(fields) {
    const foundCount = countKtpFields(fields)

    if (foundCount === 3) {
      return 'NIK, Nama, dan Alamat berhasil terbaca. Periksa kembali sebelum Dikirim.'
    }

    if (foundCount > 0) {
      return 'Sebagian field belum terbaca. Posisikan KTP lebih rata dan ulangi capture bila perlu. Atau Edit manual.'
    }

    return 'Tidak ada field yang terbaca. Pastikan KTP berada di dalam bingkai dan cahaya cukup.'
  }

  /**
   * Memproses satu frame kamera menjadi field KTP.
   *
   * @param {HTMLCanvasElement} frame
   */
  async function scan(frame) {
    if (!frame || isScanning.value) return

    isScanning.value = true
    progress.value = 0
    statusMessage.value = 'Menyiapkan gambar'
    notice.value = ''
    error.value = ''
    result.value = createEmptyKtpFields()

    try {
      const preparedFrame = preprocessCapture(frame)

      // Pass pertama: gambar grayscale dengan kontras yang sudah diperbaiki.
      const primaryResult = await runRecognition(preparedFrame, PSM.SINGLE_BLOCK)
      let fields = parseKtpText(primaryResult.text)

      // Pass kedua hanya dijalankan jika masih ada field yang kosong.
      if (countKtpFields(fields) < 3) {
        statusMessage.value = 'Membaca ulang dengan mode detail'
        progress.value = 0

        const fallbackResult = await runRecognition(frame, PSM.SPARSE_TEXT)
        fields = mergeKtpFields(fields, parseKtpText(fallbackResult.text))
      }

      result.value = fields
      notice.value = buildNotice(fields)
    } catch (caughtError) {
      console.error('[OCR]', caughtError)
      error.value = getOcrErrorMessage(caughtError)
    } finally {
      isScanning.value = false
      progress.value = 0
      statusMessage.value = ''
    }
  }

  // Worker Tesseract tidak boleh tertinggal saat halaman ditutup.
  onBeforeUnmount(() => {
    void terminateOcrWorker()
  })

  return {
    isScanning,
    progress,
    statusMessage,
    result,
    notice,
    error,
    scan,
  }
}
