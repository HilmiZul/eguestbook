<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { copyTextToClipboard } from '../utils/clipboard.js'

const props = defineProps({
  result: { type: Object, required: true },
  isScanning: { type: Boolean, default: false },
  notice: { type: String, default: '' },
  error: { type: String, default: '' },
})

// Nilai textarea disimpan lokal supaya pengguna bisa mengoreksi hasil OCR.
const textValue = ref('')
const copied = ref(false)
const copyError = ref('')
let copyTimer = null

// Contoh struktur JSON yang muncul saat textarea masih kosong.
const placeholderJson = `{
  "NIK": "",
  "Nama": "",
  "Alamat": ""
}`

/**
 * Menampilkan hasil baru sebagai JSON yang rapi.
 * Hasil kosong sengaja ditampilkan sebagai textarea kosong, bukan objek kosong,
 * agar placeholder contoh tetap terlihat.
 */
watch(
  () => props.result,
  (value) => {
    const hasAnyValue = Object.values(value ?? {}).some(
      (fieldValue) => typeof fieldValue === 'string' && fieldValue.trim(),
    )

    textValue.value = hasAnyValue ? JSON.stringify(value, null, 2) : ''
    copied.value = false
    copyError.value = ''
  },
  { immediate: true, deep: true },
)

// Status tiap field membantu pengguna melihat bagian yang belum terbaca.
const fields = computed(() => [
  { label: 'NIK', found: Boolean(props.result?.NIK?.trim()) },
  { label: 'Nama', found: Boolean(props.result?.Nama?.trim()) },
  { label: 'Alamat', found: Boolean(props.result?.Alamat?.trim()) },
])

const foundCount = computed(() => fields.value.filter((field) => field.found).length)

const statusLabel = computed(() => {
  if (props.isScanning) return 'Memindai'
  if (foundCount.value === 0) return 'Belum ada'
  if (foundCount.value === 3) return 'Lengkap'
  return `${foundCount.value}/3 field`
})

const copyLabel = computed(() => (copied.value ? 'Tersalin' : 'Salin'))

/**
 * Menyalin isi textarea ke clipboard dan menampilkan konfirmasi singkat.
 */
async function handleCopy() {
  if (!textValue.value) return

  try {
    await copyTextToClipboard(textValue.value)
    copied.value = true
    copyError.value = ''

    window.clearTimeout(copyTimer)
    copyTimer = window.setTimeout(() => {
      copied.value = false
    }, 1600)
  } catch {
    copyError.value = 'Tidak dapat menyalin otomatis. Pilih teks lalu tekan Ctrl+C atau Command+C.'
  }
}

onBeforeUnmount(() => {
  window.clearTimeout(copyTimer)
})
</script>

<template>
  <section class="panel result-panel" aria-labelledby="result-panel-title">
    <header class="panel__header">
      <div>
        <h2 id="result-panel-title" class="panel__title">Hasil</h2>
        <!-- <p class="panel__subtitle">Format JSON &middot; NIK, Nama, Alamat</p> -->
      </div>

      <span class="status-pill" :class="{ 'status-pill--active': isScanning || foundCount === 3 }">
        {{ statusLabel }}
      </span>
    </header>

    <!-- Ringkasan field yang berhasil dibaca -->
    <ul class="field-list" aria-label="Status field KTP">
      <li
        v-for="field in fields"
        :key="field.label"
        class="field-chip"
        :class="{ 'field-chip--found': field.found }"
      >
        <span class="field-chip__label">{{ field.label }}</span>
        <span class="field-chip__state">{{ field.found ? 'Terbaca' : 'Kosong' }}</span>
      </li>
    </ul>

    <div class="result-panel__editor">
      <label class="visually-hidden" for="result-text">Hasil OCR KTP dalam format JSON</label>
      <textarea
        id="result-text"
        v-model="textValue"
        class="result-panel__textarea"
        :placeholder="placeholderJson"
        spellcheck="false"
        autocapitalize="off"
        autocomplete="off"
        aria-describedby="result-help"
        :disabled="!textValue"
      ></textarea>

      <!-- Tombol copy mengambang di dalam textarea -->
      <button
        type="button"
        class="button button--small result-panel__copy"
        :disabled="!textValue || isScanning"
        :aria-label="copied ? 'Teks berhasil disalin' : 'Salin teks JSON'"
        @click="handleCopy"
      >
        {{ copyLabel }}
      </button>
    </div>

    <p v-if="error" class="feedback feedback--error" role="alert">{{ error }}</p>
    <p v-else-if="notice" class="feedback" role="status">{{ notice }}</p>
    <p v-else-if="isScanning" class="panel__hint">Sedang membaca KTP...</p>
    <!-- <p v-else class="panel__hint">Hasil akan muncul di sini setelah capture.</p> -->

    <p v-if="copyError" class="feedback feedback--error" role="alert">{{ copyError }}</p>
    <p id="result-help" class="panel__hint">
      *Editable
    </p>
  </section>
</template>

<style scoped>
.result-panel {
  min-width: 0;
}

/* Deretan chip status field */
.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin: 1.125rem 0 0;
  padding: 0;
  list-style: none;
}

.field-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.375rem;
  padding: 0.375rem 0.625rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-sm);
  background: var(--color-surface);
  color: var(--color-muted);
  corner-shape: squircle;
}

.field-chip--found {
  border-color: var(--color-ink);
  color: var(--color-ink);
}

.field-chip__label {
  font-size: 0.6875rem;
  font-weight: 600;
}

.field-chip__state {
  font-size: 0.5625rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

/* Wadah textarea dan tombol copy */
.result-panel__editor {
  position: relative;
  display: flex;
  flex: 1;
  min-height: 18rem;
  margin-top: 0.75rem;
}

.result-panel__textarea {
  width: 100%;
  min-height: 18rem;
  padding: 1rem 1rem 4.25rem;
  border: 1px solid var(--color-line);
  border-radius: var(--radius-lg);
  background: var(--color-surface-muted);
  color: var(--color-ink);
  font-family: var(--font-sans);
  font-size: 0.8125rem;
  line-height: 1.75;
  corner-shape: squircle;
  resize: none;
  tab-size: 2;
  transition:
    border-color var(--duration-fast) var(--easing-standard),
    background var(--duration-fast) var(--easing-standard),
    box-shadow var(--duration-fast) var(--easing-standard);
}

.result-panel__textarea::placeholder {
  color: #a1a1a1;
}

.result-panel__textarea:focus {
  border-color: var(--color-ink);
  background: var(--color-surface);
  box-shadow: 0 0 0 3px rgb(10 10 10 / 6%);
  outline: none;
}

/* Posisi tombol copy selalu terlihat di sudut kanan bawah textarea */
.result-panel__copy {
  position: absolute;
  right: 0.875rem;
  bottom: 0.875rem;
}

@media (max-width: 30rem) {
  .result-panel__editor,
  .result-panel__textarea {
    min-height: 20rem;
  }
}
</style>
