<script setup>
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
  devices,
  selectedDeviceId,
  start,
  stop,
  captureFrame,
} = useCamera({ facingMode: 'environment', preferredDeviceIndex: 0 })

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
      <h2 id="camera-panel-title" class="panel__title">Pindai KTP</h2>

      <div class="panel__tools">
        <label class="camera-picker">
          <span class="visually-hidden">Pilih kamera KTP</span>
          <select
            v-model="selectedDeviceId"
            class="camera-picker__select"
            :disabled="isActive || isStarting"
          >
            <option value="">Kamera otomatis</option>
            <option
              v-for="(device, index) in devices"
              :key="device.deviceId"
              :value="device.deviceId"
            >
              {{ device.label || `Kamera ${index + 1}` }}
            </option>
          </select>
        </label>
      </div>
    </header>

    <div class="camera-stage-frame">
      <div class="camera-stage" :class="{ 'camera-stage--active': isActive }">
        <video
          ref="videoRef"
          class="camera-stage__video"
          autoplay
          muted
          playsinline
          aria-label="Pratinjau kamera untuk pindai KTP"
        ></video>

        <!-- Tampilan awal sebelum kamera dinyalakan -->
        <div v-if="!isActive" class="camera-stage__empty">
          <p class="camera-stage__empty-title">Kamera belum aktif</p>
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
        {{ isStarting ? 'Menyiapkan...' : 'Buka Kamera' }}
      </button>

      <!-- Setelah aktif: capture sebagai aksi utama, stop sebagai aksi sekunder -->
      <template v-else>
        <button
          type="button"
          class="button camera-controls__primary"
          :disabled="!isReady || isScanning"
          @click="handleCapture"
        >
          {{ isScanning ? 'Membaca...' : 'Pindai KTP' }}
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
  </section>
</template>

<style scoped>
.camera-panel {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

/* Area pratinjau mengisi sisa tinggi panel dan menjaga rasio kartu KTP */
.camera-stage-frame {
  flex: 1 1 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 0;
  margin-top: 0.625rem;
  container-type: size;
}

/* Rasio fisik KTP: 85,6 mm x 54 mm */
.camera-stage {
  position: relative;
  width: min(100%, calc(100cqh * 1.585185185));
  aspect-ratio: 85.6 / 54;
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
  object-fit: cover;
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
  padding: 1rem;
  text-align: center;
}

.camera-stage__empty-title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
}

/* Bingkai panduan mengikuti proporsi kartu KTP */
.camera-stage__guide {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 92%;
  aspect-ratio: 85.6 / 54;
  border: 1.5px dashed rgb(255 255 255 / 78%);
  border-radius: 0.75rem;
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
  flex: none;
  display: flex;
  gap: 0.5rem;
  margin-top: 0.625rem;
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
