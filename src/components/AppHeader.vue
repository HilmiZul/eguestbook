<script setup>
// Header hanya berisi teks agar identitas aplikasi tetap bersih tanpa ikon.
</script>

<template>
  <header class="app-header">
    <h1 class="app-header__title">e-Guestbook.</h1>
  </header>
</template>

<style scoped>
.app-header {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.app-header__title {
  margin: 0;
  font-size: clamp(1.625rem, 2.6vw, 2.25rem);
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1.05;
}
</style>
