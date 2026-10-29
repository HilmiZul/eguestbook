/**
 * Klien Tesseract.js.
 *
 * Worker dibuat satu kali lalu dipakai ulang agar model OCR tidak perlu
 * diunduh dan diinisialisasi pada setiap capture. Model bahasa Indonesia
 * diambil dari CDN Tesseract.js dan disimpan di cache browser setelahnya.
 */

import { createWorker, OEM, PSM } from 'tesseract.js'

const OCR_LANGUAGE = 'ind'

// Satu promise worker dipakai bersama oleh seluruh proses pemindaian.
let workerPromise = null

// Callback progres aktif; diganti setiap kali recognize dipanggil.
let progressHandler = () => {}

/**
 * Membuat worker Tesseract beserta parameter awal yang cocok untuk KTP.
 *
 * @returns {Promise<import('tesseract.js').Worker>}
 */
async function initializeWorker() {
  const worker = await createWorker(OCR_LANGUAGE, OEM.LSTM_ONLY, {
    logger: (message) => progressHandler(message),
    errorHandler: (error) => {
      // Error internal tetap dicatat agar mudah ditelusuri saat pengembangan.
      console.error('[Tesseract]', error)
    },
  })

  try {
    await worker.setParameters({
      // KTP memiliki blok teks yang rapat; SINGLE_BLOCK Cocok untuk pass pertama.
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: '1',
      user_defined_dpi: '300',
    })
  } catch (error) {
    // Jangan tinggalkan worker menggantung jika konfigurasi gagal.
    await worker.terminate()
    throw error
  }

  return worker
}

/**
 * Mengambil worker yang sudah ada atau membuatnya bila belum tersedia.
 *
 * @returns {Promise<import('tesseract.js').Worker>}
 */
function getWorker() {
  if (!workerPromise) {
    workerPromise = initializeWorker().catch((error) => {
      // Reset agar percobaan berikutnya bisa membuat worker baru.
      workerPromise = null
      throw error
    })
  }

  return workerPromise
}

/**
 * Menjalankan OCR pada satu gambar.
 *
 * @param {HTMLCanvasElement} image
 * @param {object} options
 * @param {number} [options.psm] Page segmentation mode Tesseract.
 * @param {(message: { status: string, progress: number }) => void} [options.onProgress]
 * @returns {Promise<import('tesseract.js').RecognizeResult>}
 */
export async function recognizeKtp(image, { psm = PSM.SINGLE_BLOCK, onProgress } = {}) {
  progressHandler = onProgress ?? (() => {})

  const worker = await getWorker()

  // PSM diubah per pemanggilan agar pass kedua bisa memakai mode berbeda.
  await worker.setParameters({
    tessedit_pageseg_mode: psm,
    preserve_interword_spaces: '1',
    user_defined_dpi: '300',
  })

  const result = await worker.recognize(image)
  return result.data
}

/**
 * Menghentikan worker saat aplikasi tidak lagi digunakan.
 * Dipanggil dari composable agar tidak ada worker yang tertinggal.
 *
 * @returns {Promise<void>}
 */
export async function terminateOcrWorker() {
  const currentWorker = workerPromise
  workerPromise = null

  if (!currentWorker) return

  try {
    const worker = await currentWorker
    await worker.terminate()
  } catch {
    // Worker mungkin sudah berhenti; tidak ada tindakan tambahan yang perlu dilakukan.
  }
}
