<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  // Data URL foto selfie yang diambil dari panel di atasnya.
  photo: { type: String, default: '' },
  // Data hasil pindai KTP yang otomatis ditampilkan di panel ini.
  result: { type: Object, required: true },
  keperluan: { type: String, default: '' },
  // Pesan hasil pemindaian (termasuk peringatan field yang belum terbaca).
  notice: { type: String, default: '' },
})

const emit = defineEmits(['update:result'])

const localResult = ref({ NIK: '', Nama: '', Alamat: '' })

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

const statusLabel = computed(() => (props.photo ? 'Tersimpan' : 'Belum ada'))

function emitUpdate() {
  emit('update:result', { ...localResult.value })
}
</script>

<template>
  <section class="panel photo-result-panel" aria-labelledby="photo-result-panel-title">
    <header class="panel__header">
      <h2 id="photo-result-panel-title" class="panel__title">Hasil Foto</h2>

      <span class="status-pill" :class="{ 'status-pill--active': photo }">
        {{ statusLabel }}
      </span>
    </header>

    <div class="photo-result-panel__preview">
      <img v-if="photo" :src="photo" alt="Foto tamu hasil selfie" />

      <!-- Tampilan sebelum foto selfie diambil -->
      <div v-else class="photo-result-panel__empty">
        <p class="photo-result-panel__empty-title">Belum ada foto</p>
      </div>
    </div>

    <p v-if="notice" class="photo-result-panel__notice" role="status">
      {{ notice }}
    </p>

    <!-- Data hasil scan muncul setelah foto diambil -->
    <div v-if="photo" class="photo-result-panel__fields">
      <div class="photo-result-panel__fields-left">
        <label class="photo-result-panel__field">
          <span class="photo-result-panel__label">NIK</span>
          <input
            v-model="localResult.NIK"
            class="photo-result-panel__input"
            type="text"
            inputmode="numeric"
            autocomplete="off"
            spellcheck="false"
            @input="emitUpdate"
          />
        </label>

        <label class="photo-result-panel__field">
          <span class="photo-result-panel__label">Nama</span>
          <input
            v-model="localResult.Nama"
            class="photo-result-panel__input"
            type="text"
            autocomplete="off"
            spellcheck="false"
            @input="emitUpdate"
          />
        </label>
      </div>

      <label class="photo-result-panel__field photo-result-panel__field--alamat">
        <span class="photo-result-panel__label">Alamat</span>
        <textarea
          v-model="localResult.Alamat"
          class="photo-result-panel__textarea"
          rows="3"
          autocomplete="off"
          spellcheck="false"
          @input="emitUpdate"
        ></textarea>
      </label>
    </div>

    <p v-if="keperluan" class="photo-result-panel__keperluan">
      Keperluan: {{ keperluan }}
    </p>
  </section>
</template>

<style scoped>
.photo-result-panel {
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
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
  object-fit: contain;
}

.photo-result-panel__empty {
  position: absolute;
  inset: 0;
  display: grid;
  place-content: center;
  padding: 1rem;
  text-align: center;
}

.photo-result-panel__empty-title {
  margin: 0;
  font-size: 0.8125rem;
  font-weight: 600;
}

/* Pesan hasil pemindaian dipindah ke bawah foto */
.photo-result-panel__notice {
  flex: none;
  margin: 0.5rem 0 0;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  color: var(--color-ink-soft);
  font-size: 0.6875rem;
  line-height: 1.4;
}

/* Field hasil scan: NIK dan Nama di kiri, Alamat (textarea) di kanan */
.photo-result-panel__fields {
  flex: none;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1.4fr);
  gap: 0.5rem;
  margin-top: 0.625rem;
  align-items: start;
}

.photo-result-panel__fields-left {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  min-width: 0;
}

.photo-result-panel__field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.photo-result-panel__label {
  color: var(--color-muted);
  font-size: 0.5625rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.photo-result-panel__input {
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

.photo-result-panel__input:focus {
  border-color: var(--color-ink);
  background: var(--color-surface);
  outline: none;
  box-shadow: 0 0 0 3px rgb(10 10 10 / 6%);
}

.photo-result-panel__textarea {
  width: 100%;
  min-height: 4.25rem;
  padding: 0.375rem 0.5rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-md);
  background: var(--color-surface-muted);
  color: var(--color-ink);
  font-size: 0.75rem;
  line-height: 1.4;
  resize: vertical;
  corner-shape: squircle;
}

.photo-result-panel__textarea:focus {
  border-color: var(--color-ink);
  background: var(--color-surface);
  outline: none;
  box-shadow: 0 0 0 3px rgb(10 10 10 / 6%);
}

.photo-result-panel__keperluan {
  flex: none;
  margin-top: 0.5rem;
  color: var(--color-muted);
  font-size: 0.6875rem;
  line-height: 1.4;
}

@media (max-width: 30rem) {
  .photo-result-panel__input {
    font-size: 0.6875rem;
  }
}
</style>
