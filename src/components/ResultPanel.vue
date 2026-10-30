<script setup>
import { computed } from 'vue'

const props = defineProps({
  result: { type: Object, required: true },
  isScanning: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const foundCount = computed(() =>
  ['NIK', 'Nama', 'Alamat'].filter((field) => props.result?.[field]?.trim()).length,
)

const statusLabel = computed(() => {
  if (props.isScanning) return 'Memindai'
  if (foundCount.value === 0) return 'Belum ada'
  if (foundCount.value === 3) return 'Lengkap'
  return `${foundCount.value}/3 field`
})
</script>

<template>
  <section class="panel result-panel">
    <header class="panel__header">
      <span class="status-pill" :class="{ 'status-pill--active': isScanning || foundCount === 3 }">
        {{ statusLabel }}
      </span>
    </header>

    <p v-if="error" class="feedback feedback--error" role="alert">{{ error }}</p>

    <!-- Opsi keperluan mengisi sisa ruang panel -->
    <div class="result-panel__keperluan">
      <slot name="keperluan" />
    </div>

    <!-- Tombol Kirim (belum difungsikan) -->
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
  display: flex;
  flex-direction: column;
}

/* Form keperluan menyatu dan mengisi sisa ruang */
.result-panel__keperluan {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  margin-top: 0.625rem;
  padding-top: 0.625rem;
  border-top: 1px solid var(--color-line);
  overflow: hidden;
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
