<script setup>
import { ref } from 'vue'
import { SHEETS_API_URL } from './config.js'
import AppHeader from './components/AppHeader.vue'
import CameraPanel from './components/CameraPanel.vue'
import KeperluanPanel from './components/KeperluanPanel.vue'
import PhotoResultPanel from './components/PhotoResultPanel.vue'
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
let successTimer = null

// Modal feedback jika pengiriman gagal.
const showErrorModal = ref(false)

function closeErrorModal() {
  showErrorModal.value = false
}

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
}

/**
 * Mengirim data tamu ke Google Sheets lewat Apps Script.
 */
async function handleSend() {
  sendError.value = ''

  if (!SHEETS_API_URL) {
    showErrorModal.value = true
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

    successTimer = window.setTimeout(() => {
      closeSuccessModal()
    }, 5000)
  } catch (caughtError) {
    console.error('[Kirim]', caughtError)
    showErrorModal.value = true
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

      <!-- Kolom kanan: hasil foto di atas, keperluan terpisah di bawah -->
      <div class="workspace__column workspace__column--right">
        <PhotoResultPanel
          v-model:result="result"
          :photo="selfiePhoto"
          :notice="notice"
          :error="error"
        />

        <div class="keperluan-column">
          <KeperluanPanel v-model="keperluan">
            <template #submit>
              <button
                type="button"
                class="button keperluan-submit-button"
                :disabled="isSending"
                @click="handleSend"
              >
                {{ isSending ? 'Mengirim...' : 'Kirim' }}
              </button>
            </template>
          </KeperluanPanel>
        </div>
      </div>
    </main>

    <!-- Modal feedback gagal -->
    <Teleport to="body">
      <div
        v-if="showErrorModal"
        class="error-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="error-modal-title"
        @click.self="closeErrorModal"
      >
        <div class="error-modal__panel">
          <h2 id="error-modal-title" class="error-modal__title">
            gagal terkirim, periksa jaringan dan kirim ulang
          </h2>
          <button
            type="button"
            class="button error-modal__button"
            @click="closeErrorModal"
          >
            Oke
          </button>
        </div>
      </div>
    </Teleport>

    <!-- Modal feedback berhasil -->
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

          <div
            class="success-modal__progress"
            role="progressbar"
            aria-label="Countdown penutupan modal"
            aria-valuemin="0"
            aria-valuemax="100"
          >
            <span class="success-modal__progress-bar"></span>
          </div>
        </div>
      </div>
    </Teleport>
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

/* Kolom kanan memakai dua baris panel yang sejajar dengan kolom kiri */
.workspace__column--right {
  grid-row: 1 / 3;
  display: grid;
  grid-template-rows: minmax(0, 1fr) minmax(0, 1fr);
  gap: 0.875rem;
  min-width: 0;
  min-height: 0;
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
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
}

/* Kolom keperluan: form keperluan di atas, tombol kirim di bawah */
.keperluan-column {
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

.keperluan-column > .keperluan-panel {
  flex: 1 1 auto;
  min-height: 0;
}

.keperluan-submit-button {
  flex: 1 1 auto;
  width: 100%;
  min-height: 2.5rem;
}

/* Tablet: rapikan jarak dan ukuran agar muat tanpa scroll */
@media (max-width: 60rem) and (min-width: 40.01rem) {
  .app-shell {
    padding: 0.75rem 1rem;
  }

  .workspace {
    gap: 0.625rem;
    margin-top: 0.5rem;
  }

  .workspace__column--left,
  .workspace__column--right {
    gap: 0.625rem;
  }

  .panel {
    padding: 0.75rem 0.875rem;
  }
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
  width: 100%;
  border-radius: inherit;
  background: var(--color-ink);
  animation: success-progress 5s linear forwards;
}

@keyframes success-progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}

/* Modal feedback gagal */
.error-modal {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 1rem;
  background: rgb(10 10 10 / 45%);
  z-index: 1000;
}

.error-modal__panel {
  width: min(24rem, 90vw);
  padding: 1.5rem;
  border: 1.5px solid #000;
  border-radius: var(--radius-xl);
  background: var(--color-surface);
  box-shadow: none !important;
  corner-shape: squircle;
  text-align: center;
}

.error-modal__title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  letter-spacing: -0.01em;
  line-height: 1.4;
}

.error-modal__button {
  margin-top: 1.25rem;
  width: 100%;
}
</style>
