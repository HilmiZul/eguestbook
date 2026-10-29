import { createApp } from 'vue'

// Font Open Sans disajikan lokal oleh @fontsource agar tampilan konsisten
// tanpa bergantung pada koneksi ke Google Fonts. Subset latin cukup untuk UI
// berbahasa Indonesia dan menjaga ukuran build tetap kecil.
import '@fontsource/open-sans/latin-400.css'
import '@fontsource/open-sans/latin-600.css'
import '@fontsource/open-sans/latin-700.css'

// Token dan gaya dasar dimuat sebelum komponen agar variabel CSS tersedia.
import './assets/styles/tokens.css'
import './assets/styles/base.css'

import App from './App.vue'

createApp(App).mount('#app')
