<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Data URL foto selfie yang diambil dari panel di atasnya.
  photo: { type: String, default: '' },
  // Data hasil pindai KTP yang otomatis ditampilkan di panel ini.
  result: { type: Object, required: true },
  keperluan: { type: String, default: '' },
})

// Ringkasan data tamu diambil langsung dari hasil pindai KTP.
const dataFields = computed(() => [
  { label: 'NIK', value: props.result?.NIK || 'Belum terbaca' },
  { label: 'Nama', value: props.result?.Nama || 'Belum terbaca' },
  { label: 'Alamat', value: props.result?.Alamat || 'Belum terbaca' },
  { label: 'Keperluan', value: props.keperluan || 'Belum dipilih' },
])

const statusLabel = computed(() => (props.photo ? 'Tersimpan' : 'Belum ada'))
</script>

<template>
  <section class="panel photo-result-panel" aria-labelledby="photo-result-panel-title">
    <header class="panel__header">
      <div>
        <h2 id="photo-result-panel-title" class="panel__title">Hasil Foto</h2>
        <p class="panel__subtitle">Foto tamu dan data hasil pindai KTP</p>
      </div>

      <span class="status-pill" :class="{ 'status-pill--active': photo }">
        {{ statusLabel }}
      </span>
    </header>

    <div class="photo-result-panel__preview">
      <img v-if="photo" :src="photo" alt="Foto tamu hasil selfie" />

      <!-- Tampilan sebelum foto selfie diambil -->
      <div v-else class="photo-result-panel__empty">
        <p class="photo-result-panel__empty-title">Belum ada foto</p>
        <p class="photo-result-panel__empty-text">
          Ambil foto pada panel Foto Selfie di atas.
        </p>
      </div>
    </div>

    <!-- Data di bawah foto diambil dari hasil pindai KTP -->
    <dl class="photo-result-panel__data" aria-label="Data tamu dari hasil pindai KTP">
      <div v-for="field in dataFields" :key="field.label" class="photo-result-panel__row">
        <dt class="photo-result-panel__label">{{ field.label }}</dt>
        <dd class="photo-result-panel__value">{{ field.value }}</dd>
      </div>
    </dl>

    <p class="panel__hint">Data diambil otomatis dari hasil pindai KTP.</p>
  </section>
</template>

<style scoped>
.photo-result-panel {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

/* Bingkai foto mengisi sisa tinggi panel */
.photo-result-panel__preview {
  position: relative;
  flex: 1 1 auto;
  min-height: 0;
  margin-top: 0.625rem;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  corner-shape: squircle;
}

.photo-result-panel__preview img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-result-panel__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  gap: 0.25rem;
  padding: 1rem;
  text-align: center;
}

.photo-result-panel__empty-title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
}

.photo-result-panel__empty-text {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.6875rem;
  line-height: 1.5;
}

/* Daftar data tamu dengan garis pemisah tipis antar baris */
.photo-result-panel__data {
  flex: none;
  margin: 0.5rem 0 0;
  padding: 0;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  corner-shape: squircle;
  overflow: hidden;
}

.photo-result-panel__row {
  display: grid;
  grid-template-columns: 4.5rem minmax(0, 1fr);
  gap: 0.5rem;
  padding: 0.3125rem 0.5rem;
  border-bottom: 1px solid var(--color-line);
}

.photo-result-panel__row:last-child {
  border-bottom: 0;
}

.photo-result-panel__label {
  margin: 0;
  color: var(--color-muted);
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.photo-result-panel__value {
  min-width: 0;
  margin: 0;
  font-size: 0.6875rem;
  line-height: 1.35;
  overflow-wrap: anywhere;
}
</style>
