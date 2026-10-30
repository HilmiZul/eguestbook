<script setup>
import { computed } from 'vue'
import { useCamera } from '../composables/useCamera.js'

const props = defineProps({
  // Status foto disimpan di parent agar panel hasil foto bisa menampilkannya.
  hasPhoto: { type: Boolean, default: false },
})

const emit = defineEmits(['captured'])

// Kamera depan dipakai khusus untuk selfie tamu.
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
} = useCamera({ facingMode: 'user' })

// Label status singkat di kanan judul panel.
const statusLabel = computed(() => {
  if (isStarting.value) return 'Menyiapkan'
  if (isActive.value) return 'Aktif'
  if (props.hasPhoto) return 'Tersimpan'
  return 'Nonaktif'
})

/**
 * Mengambil frame selfie, membaliknya agar sama dengan pratinjau,
 * lalu mengirim data URL ke parent.
 */
function handleCapture() {
  if (!isReady.value) return

  const frame = captureFrame()
  if (!frame) return

  const canvas = document.createElement('canvas')
  canvas.width = frame.width
  canvas.height = frame.height

  const context = canvas.getContext('2d')
  if (!context) return

  // Pratinjau selfie dicerminkan, jadi hasil foto juga dicerminkan.
  context.translate(canvas.width, 0)
  context.scale(-1, 1)
  context.drawImage(frame, 0, 0)

  emit('captured', canvas.toDataURL('image/jpeg', 0.9))
  stop()
}
</script>

<template>
  <section class="panel selfie-panel" aria-labelledby="selfie-panel-title">
    <header class="panel__header">
      <div>
        <h2 id="selfie-panel-title" class="panel__title">Foto Selfie</h2>
        <p class="panel__subtitle">Posisikan wajah di dalam bingkai</p>
      </div>
      <span class="status-pill" :class="{ 'status-pill--active': isActive || hasPhoto }">
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
        aria-label="Pratinjau kamera depan untuk foto selfie"
      ></video>

      <!-- Tampilan awal sebelum kamera selfie dinyalakan -->
      <div v-if="!isActive" class="camera-stage__empty">
        <p class="camera-stage__empty-title">
          {{ hasPhoto ? 'Foto sudah diambil' : 'Kamera belum aktif' }}
        </p>
        <p class="camera-stage__empty-text">
          {{
            hasPhoto
              ? 'Tekan Ambil Ulang Foto untuk mengganti hasil foto.'
              : 'Tekan Buka Kamera, lalu ambil foto tamu.'
          }}
        </p>
      </div>

      <!-- Bingkai panduan wajah; hanya tampil saat kamera aktif -->
      <div v-else class="camera-stage__guide" aria-hidden="true"></div>
    </div>

    <div class="camera-controls">
      <!-- Sebelum aktif: tombol buka kamera atau ambil ulang -->
      <button
        v-if="!isActive"
        type="button"
        class="button camera-controls__primary"
        :disabled="isStarting || !isSupported"
        @click="start"
      >
        {{ isStarting ? 'Menyiapkan Kamera...' : hasPhoto ? 'Ambil Ulang Foto' : 'Buka Kamera' }}
      </button>

      <!-- Setelah aktif: ambil foto sebagai aksi utama -->
      <template v-else>
        <button
          type="button"
          class="button camera-controls__primary"
          :disabled="!isReady"
          @click="handleCapture"
        >
          Ambil Foto
        </button>
        <button type="button" class="button camera-controls__secondary" @click="stop">
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
.selfie-panel {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

/* Area pratinjau selfie mengisi sisa tinggi panel */
.camera-stage {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 0.625rem;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  corner-shape: squircle;
  transition: background var(--duration-fast) var(--easing-standard);
}

.camera-stage--active {
  background: var(--color-surface-dark);
}

.camera-stage__video {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transform: scaleX(-1);
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
  padding: 1rem;
  text-align: center;
}

.camera-stage__empty-title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
}

.camera-stage__empty-text {
  max-width: 20rem;
  margin: 0;
  color: var(--color-muted);
  font-size: 0.6875rem;
  line-height: 1.5;
}

/* Bingkai oval membantu pengguna memosisikan wajah */
.camera-stage__guide {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 34%;
  aspect-ratio: 3 / 4;
  border: 1.5px dashed rgb(255 255 255 / 78%);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
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
