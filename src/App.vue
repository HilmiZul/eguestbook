<script setup>
import { ref } from 'vue'
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

// Referensi panel kamera dipakai untuk memastikan hanya satu kamera aktif.
const ktpCameraRef = ref(null)
const selfieCameraRef = ref(null)

/**
 * Menutup kamera selfie sebelum kamera KTP dibuka.
 */
function handleKtpCameraRequest() {
  selfieCameraRef.value?.stop()
}

/**
 * Menutup kamera KTP sebelum kamera selfie dibuka.
 */
function handleSelfieCameraRequest() {
  ktpCameraRef.value?.stop()
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

    <main class="workspace" aria-label="Area pindai KTP, selfie, dan hasil data tamu">
      <!-- Kolom kiri: pindai KTP, hasil OCR, lalu pilihan keperluan -->
      <div class="workspace__column">
        <CameraPanel
          ref="ktpCameraRef"
          :is-scanning="isScanning"
          :scan-progress="progress"
          :scan-status="statusMessage"
          @camera-request="handleKtpCameraRequest"
          @capture="handleCapture"
        />

        <ResultPanel
          :result="result"
          :is-scanning="isScanning"
          :notice="notice"
          :error="error"
          :keperluan="keperluan"
        />

        <KeperluanPanel v-model="keperluan" />
      </div>

      <!-- Kolom kanan: selfie lalu hasil foto beserta data KTP -->
      <div class="workspace__column">
        <SelfiePanel
          ref="selfieCameraRef"
          :has-photo="Boolean(selfiePhoto)"
          @camera-request="handleSelfieCameraRequest"
          @captured="handleSelfieCapture"
        />

        <PhotoResultPanel
          :photo="selfiePhoto"
          :result="result"
          :keperluan="keperluan"
        />
      </div>
    </main>

    <footer class="app-footer">
      <p class="app-footer__text">
        Seluruh proses OCR dan foto berjalan di browser. Gambar tidak diunggah ke server.
      </p>
    </footer>
  </div>
</template>

<style scoped>
/* Kerangka halaman: konten di tengah dengan ruang napas yang cukup */
.app-shell {
  display: flex;
  flex-direction: column;
  width: min(100%, 74rem);
  min-height: 100vh;
  margin: 0 auto;
  padding: 3.5rem 2rem 2rem;
}

/* Dua kolom seimbang: KTP di kiri, selfie di kanan */
.workspace {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.25rem;
  align-items: start;
  margin-top: 2.25rem;
}

.workspace > * {
  min-width: 0;
}

/* Setiap kolom menumpuk panel-panelnya dari atas ke bawah */
.workspace__column {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  min-width: 0;
}

.app-footer {
  margin-top: auto;
  padding-top: 2.5rem;
  text-align: center;
}

.app-footer__text {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.6875rem;
  letter-spacing: 0.01em;
}

/* Di tablet dan ponsel, kolom ditumpuk agar kamera dan hasil tetap lega */
@media (max-width: 56rem) {
  .app-shell {
    padding: 2.5rem 1.25rem 1.5rem;
  }

  .workspace {
    grid-template-columns: minmax(0, 1fr);
    margin-top: 1.75rem;
  }
}

@media (max-width: 30rem) {
  .app-shell {
    padding: 2rem 0.875rem 1.25rem;
  }
}
</style>
