<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  result: { type: Object, required: true },
  isScanning: { type: Boolean, default: false },
  notice: { type: String, default: '' },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:result'])

// Nilai lokal agar input dapat diedit tanpa menunggu parent.
const localResult = ref({ NIK: '', Nama: '', Alamat: '' })

// Sinkronkan dari prop (misalnya setelah pemindaian) tanpa menimpa ketikan pengguna.
watch(
  () => props.result,
  (next) => {
    const incoming = {
      NIK: next?.NIK ?? '',
      Nama: next?.Nama ?? '',
      Alamat: next?.Alamat ?? '',
    }

    if (
      incoming.NIK !== localResult.value.NIK ||
      incoming.Nama !== localResult.value.Nama ||
      incoming.Alamat !== localResult.value.Alamat
    ) {
      localResult.value = incoming
    }
  },
  { immediate: true },
)

const foundCount = computed(() =>
  ['NIK', 'Nama', 'Alamat'].filter((field) => localResult.value[field]?.trim()).length,
)

const statusLabel = computed(() => {
  if (props.isScanning) return 'Memindai'
  if (foundCount.value === 0) return 'Belum ada'
  if (foundCount.value === 3) return 'Lengkap'
  return `${foundCount.value}/3 field`
})

/**
 * Mengirim perubahan input ke parent agar state tetap sinkron.
 */
function emitUpdate() {
  emit('update:result', { ...localResult.value })
}
</script>

<template>
  <section class="panel result-panel" aria-labelledby="result-panel-title">
    <header class="panel__header">
      <h2 id="result-panel-title" class="panel__title">Hasil</h2>

      <span class="status-pill" :class="{ 'status-pill--active': isScanning || foundCount === 3 }">
        {{ statusLabel }}
      </span>
    </header>

    <!-- Field hasil scan yang dapat diedit manual -->
    <div class="result-panel__fields">
      <label class="result-panel__field">
        <span class="result-panel__label">NIK</span>
        <input
          v-model="localResult.NIK"
          class="result-panel__input"
          type="text"
          inputmode="numeric"
          autocomplete="off"
          spellcheck="false"
          @input="emitUpdate"
        />
      </label>

      <label class="result-panel__field">
        <span class="result-panel__label">Nama</span>
        <input
          v-model="localResult.Nama"
          class="result-panel__input"
          type="text"
          autocomplete="off"
          spellcheck="false"
          @input="emitUpdate"
        />
      </label>

      <label class="result-panel__field">
        <span class="result-panel__label">Alamat</span>
        <input
          v-model="localResult.Alamat"
          class="result-panel__input"
          type="text"
          autocomplete="off"
          spellcheck="false"
          @input="emitUpdate"
        />
      </label>
    </div>

    <p v-if="error" class="feedback feedback--error" role="alert">{{ error }}</p>
    <p v-else-if="notice" class="feedback" role="status">{{ notice }}</p>

    <!-- Form keperluan digabung di bagian bawah panel hasil -->
    <div class="result-panel__keperluan">
      <slot name="keperluan" />
    </div>

    <!-- Tombol kirim (belum difungsikan) -->
    <div class="result-panel__submit">
      <button type="button" class="button">Kirim</button>
    </div>
  </section>
</template>

<style scoped>
.result-panel {
  min-width: 0;
  min-height: 0;
  height: 100%;
}

/* Deretan input hasil scan yang dapat diedit */
.result-panel__fields {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-top: 0.625rem;
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

.result-panel__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.result-panel__label {
  color: var(--color-muted);
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.result-panel__input {
  width: 100%;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-ink);
  font-size: 0.75rem;
  line-height: 1.4;
  corner-shape: squircle;
}

.result-panel__input:focus {
  border-color: var(--color-ink);
  background: var(--color-surface);
  outline: none;
  box-shadow: 0 0 0 3px rgb(10 10 10 / 6%);
}

/* Form keperluan menyatu di bagian bawah panel hasil */
.result-panel__keperluan {
  flex: none;
  margin-top: 0.625rem;
  padding-top: 0.625rem;
  border-top: 1px solid var(--color-line);
}

/* Tombol kirim ditempatkan di kanan bawah panel hasil */
.result-panel__submit {
  flex: none;
  display: flex;
  justify-content: flex-end;
  margin-top: 0.625rem;
}

@media (max-width: 30rem) {
  .result-panel__input {
    font-size: 0.6875rem;
  }
}
</style>
