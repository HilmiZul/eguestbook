<script setup>
import { computed } from 'vue'

const props = defineProps({
  // Nilai pilihan aktif dikendalikan oleh parent lewat v-model.
  modelValue: { type: String, default: '' },
  // Mode embedded dipakai saat form digabung ke dalam panel hasil KTP.
  embedded: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

// Daftar opsi keperluan tamu. Tambahkan opsi baru cukup di array ini.
const options = [
  {
    value: 'Menjemput Siswa',
    description: 'Kunjungan untuk menjemput siswa di sekolah.',
  },
  {
    value: 'Kegiatan Workshop',
    description: 'Kunjungan untuk mengikuti atau mendampingi workshop.',
  },
]

const statusLabel = computed(() => (props.modelValue ? 'Dipilih' : 'Belum dipilih'))

/**
 * Menyimpan opsi yang dipilih ke parent agar bisa dipakai pada hasil JSON.
 *
 * @param {string} value
 */
function selectOption(value) {
  emit('update:modelValue', value)
}
</script>

<template>
  <section
    class="keperluan-panel"
    :class="{ panel: !embedded, 'keperluan-panel--embedded': embedded }"
    aria-labelledby="keperluan-panel-title"
  >
    <header class="panel__header keperluan-panel__header">
      <h2 id="keperluan-panel-title" class="panel__title">Keperluan</h2>

      <span
        v-if="!embedded"
        class="status-pill"
        :class="{ 'status-pill--active': modelValue }"
      >
        {{ statusLabel }}
      </span>
    </header>

    <!-- Radio group besar agar mudah dipilih, termasuk di layar sentuh -->
    <div class="keperluan-options" role="radiogroup" aria-labelledby="keperluan-panel-title">
      <label
        v-for="option in options"
        :key="option.value"
        class="keperluan-option"
        :class="{ 'keperluan-option--selected': modelValue === option.value }"
      >
        <input
          class="keperluan-option__input"
          type="radio"
          name="keperluan"
          :value="option.value"
          :checked="modelValue === option.value"
          @change="selectOption(option.value)"
        />

        <!-- Penanda pilihan dibuat manual agar tampil konsisten di semua browser -->
        <span class="keperluan-option__marker" aria-hidden="true"></span>

        <span class="keperluan-option__body">
          <span class="keperluan-option__title">{{ option.value }}</span>
          <span v-if="!embedded" class="keperluan-option__description">
            {{ option.description }}
          </span>
        </span>
      </label>
    </div>

    <p v-if="!embedded" class="panel__hint">Pilihan keperluan akan disertakan pada hasil JSON.</p>
  </section>
</template>

<style scoped>
.keperluan-panel {
  min-width: 0;
}

/* Versi ringkas saat digabung ke dalam panel hasil KTP */
.keperluan-panel--embedded .keperluan-panel__header {
  align-items: center;
}

.keperluan-panel--embedded .panel__title {
  font-size: 0.75rem;
}

.keperluan-panel--embedded .keperluan-options {
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.keperluan-panel--embedded .keperluan-option {
  min-height: 0;
  gap: 0.5rem;
  padding: 0.5rem 0.625rem;
  border-radius: var(--radius-md);
}

.keperluan-panel--embedded .keperluan-option__marker {
  width: 1rem;
  height: 1rem;
  margin-top: 0.0625rem;
}

.keperluan-panel--embedded .keperluan-option__title {
  font-size: 0.6875rem;
}

/* Dua kartu opsi sejajar dengan jarak yang lega */
.keperluan-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.75rem;
  margin-top: 1.125rem;
}

/* Kartu opsi besar: seluruh area kartu dapat diklik */
.keperluan-option {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-height: 7.5rem;
  padding: 1.125rem;
  border: 1.5px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  corner-shape: squircle;
  cursor: pointer;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    background var(--duration-fast) var(--easing-standard),
    color var(--duration-fast) var(--easing-standard),
    transform var(--duration-fast) var(--easing-standard);
}

.keperluan-option:hover {
  border-color: var(--color-ink);
  transform: translateY(-1px);
}

/* Fokus keyboard mengikuti seluruh kartu, bukan hanya input tersembunyi */
.keperluan-option:focus-within {
  outline: 2px solid var(--color-ink);
  outline-offset: 3px;
}

/* Opsi terpilih memakai latar hitam agar kontras dan mudah dikenali */
.keperluan-option--selected {
  border-color: var(--color-ink);
  background: var(--color-ink);
  color: var(--color-page);
}

.keperluan-option__input {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

/* Lingkaran penanda pilihan */
.keperluan-option__marker {
  position: relative;
  flex: none;
  width: 1.25rem;
  height: 1.25rem;
  margin-top: 0.125rem;
  border: 1.5px solid var(--color-muted);
  border-radius: 999px;
  background: var(--color-surface);
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    background var(--duration-fast) var(--easing-standard);
}

/* Titik di tengah lingkaran saat opsi dipilih */
.keperluan-option--selected .keperluan-option__marker {
  border-color: var(--color-page);
  background: var(--color-page);
}

.keperluan-option--selected .keperluan-option__marker::after {
  position: absolute;
  inset: 0.25rem;
  border-radius: inherit;
  background: var(--color-ink);
  content: '';
}

.keperluan-option__body {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  min-width: 0;
}

.keperluan-option__title {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.4;
}

.keperluan-option__description {
  color: var(--color-muted);
  font-size: 0.6875rem;
  line-height: 1.6;
}

.keperluan-option--selected .keperluan-option__description {
  color: rgb(255 255 255 / 72%);
}

/* Di layar sempit opsi ditumpuk agar teks tetap nyaman dibaca */
@media (max-width: 30rem) {
  .keperluan-options {
    grid-template-columns: minmax(0, 1fr);
  }

  .keperluan-option {
    min-height: 6rem;
  }
}
</style>
