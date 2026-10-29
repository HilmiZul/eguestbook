<script setup>
// Header hanya berisi teks agar identitas aplikasi tetap bersih tanpa ikon.
</script>

<template>
  <header class="app-header">
    <!-- <p class="app-header__eyebrow">Pencatatan Tamu</p> -->
    <h1 class="app-header__title">e-Guestbook</h1>
    <!-- <p class="app-header__subtitle"> -->
    <!--   Capture bagian KTP dan ubah NIK, Nama, serta Alamat menjadi teks JSON. -->
    <!-- </p> -->
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.app-header__eyebrow {
  margin: 0 0 0.875rem;
  color: var(--color-muted);
  font-size: 0.625rem;
  font-weight: 600;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.app-header__title {
  margin: 0;
  font-size: clamp(2.125rem, 4vw, 3rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.08;
}

.app-header__subtitle {
  max-width: 34rem;
  margin: 0.875rem 0 0;
  color: var(--color-muted);
  font-size: 0.875rem;
  line-height: 1.7;
}
</style>
