<script setup>
import AppHeader from './components/AppHeader.vue'
import CameraPanel from './components/CameraPanel.vue'
import ResultPanel from './components/ResultPanel.vue'
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

    <main class="workspace" aria-label="Area capture dan hasil OCR KTP">
      <CameraPanel
        :is-scanning="isScanning"
        :scan-progress="progress"
        :scan-status="statusMessage"
        @capture="handleCapture"
      />

      <ResultPanel
        :result="result"
        :is-scanning="isScanning"
        :notice="notice"
        :error="error"
      />
    </main>

    <footer class="app-footer">
      <p class="app-footer__text">
        Seluruh proses OCR berjalan di browser. Gambar KTP tidak diunggah ke server.
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

/* Dua kolom seimbang: kamera di kiri, hasil di kanan */
.workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(0, 0.95fr);
  gap: 1.25rem;
  align-items: stretch;
  margin-top: 2.25rem;
}

.workspace > * {
  min-width: 0;
  height: 100%;
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
