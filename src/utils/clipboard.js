/**
 * Utilitas clipboard dengan fallback untuk browser lama atau
 * konteks yang tidak mendukung Clipboard API.
 */

/**
 * Menyalin teks ke clipboard.
 *
 * @param {string} text
 * @returns {Promise<void>}
 */
export async function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }

  // Fallback: gunakan textarea sementara dan perintah copy lama.
  const temporaryTextarea = document.createElement('textarea')
  temporaryTextarea.value = text
  temporaryTextarea.setAttribute('readonly', '')
  temporaryTextarea.style.position = 'fixed'
  temporaryTextarea.style.opacity = '0'
  document.body.appendChild(temporaryTextarea)

  temporaryTextarea.select()
  const copied = document.execCommand('copy')
  document.body.removeChild(temporaryTextarea)

  if (!copied) {
    throw new Error('Perintah copy tidak didukung browser.')
  }
}
