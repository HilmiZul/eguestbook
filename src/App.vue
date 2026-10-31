<script setup>
import { nextTick, ref } from 'vue'
import { SHEETS_API_URL } from './config.js'
import AppHeader from './components/AppHeader.vue'
import CameraPanel from './components/CameraPanel.vue'
import KeperluanPanel from './components/KeperluanPanel.vue'
import PhotoResultPanel from './components/PhotoResultPanel.vue'
import ResultPanel from './components/ResultPanel.vue'
import SelfiePanel from './components/SelfiePanel.vue'
import { useKtpScan } from './composables/useKtpScan.js'

// State OCR dan fungsi pemindaian dipisahkan dari komponen tampilan.
const {
  isScanning,
  progress,
  statusMessage,
  result,
  notice,
  error,
  scan,
} = useKtpScan()

// Keperluan tamu disimpan di parent agar bisa digabungkan ke hasil JSON.
const keperluan = ref('')

// Foto selfie disimpan sebagai data URL agar bisa ditampilkan di panel hasil foto.
const selfiePhoto = ref('')

// Status pengiriman data ke spreadsheet.
const isSending = ref(false)
const sendError = ref('')

// Modal feedback setelah pengiriman berhasil.
const showSuccessModal = ref(false)
// Progres countdown modal (0-100).
const successProgress = ref(0)
let successTimer = null

/**
 * Menyimpan foto selfie terbaru ke state parent.
 *
 * @param {string} photo
 */
function handleSelfieCapture(photo) {
  selfiePhoto.value = photo
}

/**
 * Menutup modal feedback berhasil.
 */
function closeSuccessModal() {
  if (successTimer) {
    window.clearTimeout(successTimer)
    successTimer = null
  }
  showSuccessModal.value = false
  successProgress.value = 0
}

/**
 * Mengirim data tamu ke Google Sheets lewat Apps Script.
 */
async function handleSend() {
  sendError.value = ''

  if (!SHEETS_API_URL) {
    sendError.value = 'URL API belum diatur. Isi SHEETS_API_URL di src/config.js.'
    return
  }

  isSending.value = true

  try {
    const payload = {
      tanggal: new Date().toISOString(),
      nik: result.value?.NIK ?? '',
      nama: result.value?.Nama ?? '',
      alamat: result.value?.Alamat ?? '',
      keperluan: keperluan.value ?? '',
      foto: selfiePhoto.value ? selfiePhoto.value.split(',')[1] ?? '' : '',
    }

    await fetch(SHEETS_API_URL, {
      method: 'POST',
      mode: 'no-cors',
      credentials: 'include',
      redirect: 'follow',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    })

    // Tampilkan feedback berhasil dalam bentuk modal dengan countdown 5 detik.
    if (successTimer) {
      window.clearTimeout(successTimer)
      successTimer = null
    }
    showSuccessModal.value = true
    successProgress.value = 100

    // Mulai animasi progress bar setelah render.
    void nextTick(() => {
      successProgress.value = 0
    })

    successTimer = window.setTimeout(() => {
      closeSuccessModal()
    }, 5000)
  } catch (caughtError) {
    console.error('[Kirim]', caughtError)
    sendError.value = 'Gagal mengirim data. Periksa koneksi atau URL API.'
  } finally {
    isSending.value = false
  }
}

/**
 * Menerima frame dari panel kamera lalu menjalankan OCR.
 * Frame berupa canvas agar gambar tidak perlu diunggah ke mana pun.
 *
 * @param {HTMLCanvasElement} frame
 */
async function handleCapture(frame) {
  await scan(frame)
}
</script>

<template>
  <div class="app-shell">
    <AppHeader />

    <main class="workspace" aria-label="Area kamera KTP, kamera selfie, dan hasil data tamu">
      <!-- Kolom kiri: pindai KTP di atas dan foto selfie di bawah -->
      <div class="workspace__column workspace__column--left">
        <CameraPanel
          :is-scanning="isScanning"
          :scan-progress="progress"
          :scan-status="statusMessage"
          @capture="handleCapture"
        />

        <SelfiePanel
          :has-photo="Boolean(selfiePhoto)"
          @captured="handleSelfieCapture"
        />
      </div>

      <!-- Kolom kanan: satu panel penuh berisi hasil foto lalu hasil scan beserta keperluan -->
      <div class="workspace__column workspace__column--right">
        <section class="panel panel--right-column" aria-label="Hasil foto dan hasil scan">
          <PhotoResultPanel
            v-model:result="result"
            :photo="selfiePhoto"
            :keperluan="keperluan"
            :notice="notice"
          />

          <ResultPanel
            :result="result"
            :is-scanning="isScanning"
            :error="error"
            :is-sending="isSending"
            @submit="handleSend"
          >
            <template #keperluan>
              <KeperluanPanel v-model="keperluan" embedded />
            </template>

            <p v-if="sendError" class="feedback feedback--error" role="alert">{{ sendError }}</p>

            <Teleport to="body">
              <div
                v-if="showSuccessModal"
                class="success-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="success-modal-title"
                @click.self="closeSuccessModal"
              >
                <div class="success-modal__panel">
                  <h2 id="success-modal-title" class="success-modal__title">
                    Berhasil Tersimpan!
                  </h2>

                  <!-- Progress bar countdown 5 detik -->
                  <div
                    class="success-modal__progress"
                    role="progressbar"
                    aria-label="Countdown penutupan modal"
                    :aria-valuenow="successProgress"
                    aria-valuemin="0"
                    aria-valuemax="100"
                  >
                    <span
                      class="success-modal__progress-bar"
                      :style="{ width: `${successProgress}%` }"
                    ></span>
                  </div>
                </div>
              </div>
            </Teleport>
          </ResultPanel>
        </section>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Kerangka halaman: seluruh konten harus muat dalam satu layar tanpa scroll */
.app-shell {
  display: flex;
  flex-direction: column;
  width: min(100%, 96rem);
  height: 100vh;
  height: 100dvh;
  min-height: 0;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  overflow: hidden;
}

/* Dua kolom seimbang: kamera di kiri, hasil di kanan */
.workspace {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.875rem;
  align-items: stretch;
  margin-top: 0.75rem;
}

.workspace > * {
  min-width: 0;
}

/* Kolom kiri memakai dua baris panel yang sejajar dengan kolom kanan penuh */
.workspace__column--left {
  grid-row: 1 / 3;
  display: grid;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.875rem;
  min-width: 0;
  min-height: 0;
}

/* Kolom kanan adalah satu panel penuh yang membentang dua baris */
.workspace__column--right {
  grid-row: 1 / 3;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.workspace__column {
  min-width: 0;
  min-height: 0;
}

/* Panel kanan tunggal: dua bagian tanpa border sendiri, dipisah garis pembatas */
.panel--right-column {
  display: flex;
  flex-direction: column;
  flex: 1 1 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}

.panel--right-column > .panel {
  min-height: 0;
  height: auto;
  margin: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
  background: transparent;
}

/* Panel foto mengisi ruang tersedia; panel hasil mengikuti kontennya */
.panel--right-column > .photo-result-panel {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.panel--right-column > .result-panel {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
}

/* Di ponsel kolom ditumpuk; tablet dan desktop tetap satu layar tanpa scroll */
@media (max-width: 40rem) {
  .app-shell {
    height: auto;
    min-height: 100vh;
    padding: 1.5rem 1rem;
    overflow: visible;
  }

  .workspace {
    grid-template-columns: minmax(0, 1fr);
    margin-top: 1rem;
  }

  .workspace__column {
    grid-template-rows: auto auto;
  }
}

@media (max-width: 30rem) {
  .app-shell {
    padding: 1.25rem 0.75rem;
  }
}

/* Modal feedback berhasil: tengah layar, ukuran medium, border hitam */
.success-modal {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(10 10 10 / 45%);
  z-index: 1000;
}

.success-modal__panel {
  width: min(24rem, 90vw);
  padding: 1.5rem;
  border: 1.5px solid #000;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: none !important;
  corner-shape: squircle;
  text-align: center;
}

.success-modal__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

/* Progress bar countdown modal */
.success-modal__progress {
  width: 100%;
  height: 0.375rem;
  margin-top: 1.25rem;
  overflow: hidden;
  border-radius: 999px;
  background: var(--color-surface-muted);
}

.success-modal__progress-bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-ink);
  transition: width 5s linear;
}
</style>
