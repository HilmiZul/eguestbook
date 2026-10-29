<script setup>
import { computed } from 'vue'
import { useCamera } from '../composables/useCamera.js'

const props = defineProps({
  isScanning: { type: Boolean, default: false },
  scanProgress: { type: Number, default: 0 },
  scanStatus: { type: String, default: '' },
})

const emit = defineEmits(['capture'])

// Seluruh logika kamera diisolasi di composable agar komponen ini fokus
// pada tampilan dan interaksi pengguna.
const {
  videoRef,
  isActive,
  isStarting,
  isReady,
  isSupported,
  error,
  start,
  stop,
  captureFrame,
} = useCamera()

// Label status singkat di kanan judul panel.
const statusLabel = computed(() => {
  if (isStarting.value) return 'Menyiapkan'
  if (props.isScanning) return 'Memindai'
  if (isActive.value) return 'Aktif'
  return 'Nonaktif'
})

/**
 * Mengambil frame lalu mengirimkannya ke parent untuk diproses OCR.
 */
function handleCapture() {
  if (!isReady.value || props.isScanning) return

  const frame = captureFrame()
  if (frame) emit('capture', frame)
}
</script>

<template>
  <section class="panel camera-panel" aria-labelledby="camera-panel-title">
    <header class="panel__header">
      <div>
        <h2 id="camera-panel-title" class="panel__title">Kamera KTP</h2>
        <p class="panel__subtitle">Posisikan kartu di dalam bingkai</p>
      </div>
      <span class="status-pill" :class="{ 'status-pill--active': isActive || isScanning }">
        {{ statusLabel }}
      </span>
    </header>

    <div class="camera-stage" :class="{ 'camera-stage--active': isActive }">
      <video
        ref="videoRef"
        class="camera-stage__video"
        autoplay
        muted
        playsinline
        aria-label="Pratinjau kamera untuk capture KTP"
      ></video>

      <!-- Tampilan awal sebelum kamera dinyalakan -->
      <div v-if="!isActive" class="camera-stage__empty">
        <p class="camera-stage__empty-title">Kamera belum aktif</p>
        <p class="camera-stage__empty-text">
          Tekan Mulai Kamera, lalu arahkan KTP ke kamera dengan posisi mendatar.
        </p>
      </div>

      <!-- Panduan bingkai kartu; hanya tampil saat kamera aktif -->
      <div v-else class="camera-stage__guide" aria-hidden="true"></div>

      <!-- Overlay progres saat OCR berjalan -->
      <div v-if="isScanning" class="camera-stage__scan" role="status" aria-live="polite">
        <p class="camera-stage__scan-title">{{ scanStatus || 'Membaca KTP' }}</p>
        <div
          class="camera-stage__progress"
          role="progressbar"
          aria-label="Progres pembacaan KTP"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="scanProgress"
        >
          <span class="camera-stage__progress-bar" :style="{ width: `${scanProgress}%` }"></span>
        </div>
        <p class="camera-stage__scan-meta">{{ scanProgress }}%</p>
      </div>
    </div>

    <div class="camera-controls">
      <!-- Sebelum aktif: hanya tombol mulai -->
      <button
        v-if="!isActive"
        type="button"
        class="button camera-controls__primary"
        :disabled="isStarting || !isSupported"
        @click="start"
      >
        {{ isStarting ? 'Menyiapkan Kamera...' : 'Mulai Kamera' }}
      </button>

      <!-- Setelah aktif: capture sebagai aksi utama, stop sebagai aksi sekunder -->
      <template v-else>
        <button
          type="button"
          class="button camera-controls__primary"
          :disabled="!isReady || isScanning"
          @click="handleCapture"
        >
          {{ isScanning ? 'Membaca KTP...' : 'Capture' }}
        </button>
        <button
          type="button"
          class="button camera-controls__secondary"
          :disabled="isScanning"
          @click="stop"
        >
          Hentikan
        </button>
      </template>
    </div>

    <p v-if="error" class="feedback feedback--error" role="alert">{{ error }}</p>
    <p v-else-if="!isSupported" class="feedback feedback--error" role="alert">
      Browser ini tidak mendukung akses kamera.
    </p>
    <p v-else class="panel__hint">
      Gunakan pencahayaan yang cukup dan hindari pantulan pada permukaan KTP.
    </p>
  </section>
</template>

<style scoped>
.camera-panel {
  min-width: 0;
}

/* Area pratinjau kamera dengan rasio yang nyaman untuk KTP */
.camera-stage {
  position: relative;
  aspect-ratio: 3 / 2;
  margin-top: 1.125rem;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  corner-shape: squircle;
  transition: background var(--duration-fast) var(--easing-standard);
}

.camera-stage--active {
  background: var(--color-surface-dark);
}

/* Video selalu ada di DOM agar referensi elemen stabil saat start/stop */
.camera-stage__video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 0;
  transition: opacity 240ms var(--easing-standard);
}

.camera-stage--active .camera-stage__video {
  opacity: 1;
}

/* Empty state dibuat ringan agar area kamera tidak terasa berat */
.camera-stage__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 0.25rem;
  padding: 2rem;
  text-align: center;
}

.camera-stage__empty-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
}

.camera-stage__empty-text {
  max-width: 20rem;
  margin: 0;
  color: var(--color-muted);
  font-size: 0.75rem;
  line-height: 1.6;
}

/* Bingkai panduan mengikuti proporsi kartu KTP */
.camera-stage__guide {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 82%;
  aspect-ratio: 85.6 / 54;
  border: 1.5px dashed rgb(255 255 255 / 78%);
  border-radius: 1rem;
  transform: translate(-50%, -50%);
  pointer-events: none;
}

/* Overlay gelap saat OCR sedang membaca gambar */
.camera-stage__scan {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
  background: rgb(10 10 10 / 78%);
  color: var(--color-page);
  text-align: center;
  backdrop-filter: blur(2px);
}

.camera-stage__scan-title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
}

.camera-stage__progress {
  width: min(14rem, 70%);
  height: 0.25rem;
  overflow: hidden;
  border-radius: 999px;
  background: rgb(255 255 255 / 26%);
}

.camera-stage__progress-bar {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--color-page);
  transition: width 200ms var(--easing-standard);
}

.camera-stage__scan-meta {
  margin: 0;
  color: rgb(255 255 255 / 72%);
  font-size: 0.6875rem;
  font-variant-numeric: tabular-nums;
}

/* Tombol kamera: aksi utama melebar, aksi sekunder tetap ringkas */
.camera-controls {
  display: flex;
  gap: 0.625rem;
  margin-top: 1rem;
}

.camera-controls__primary {
  flex: 1;
}

.camera-controls__secondary {
  flex: none;
}

@media (max-width: 30rem) {
  .camera-controls {
    flex-wrap: wrap;
  }

  .camera-controls__primary {
    flex-basis: 100%;
  }

  .camera-controls__secondary {
    flex: 1;
  }
}
</style>
