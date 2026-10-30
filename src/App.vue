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
          >
            <template #keperluan>
              <KeperluanPanel v-model="keperluan" embedded />
            </template>
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

/* Bagian foto mendapat ruang lebih agar input NIK/Nama/Alamat tidak terpotong */
.panel--right-column > .photo-result-panel {
  flex: 2 1 0;
  display: flex;
  flex-direction: column;
}

/* Bagian hasil (keperluan + Kirim) digeser ke bawah */
.panel--right-column > .result-panel {
  flex: 1 1 0;
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
</style>
