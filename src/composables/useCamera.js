/**
 * Composable kamera.
 *
 * Menangani izin, lifecycle stream, dan pengambilan frame. Komponen kamera
 * cukup memanggil start(), stop(), dan captureFrame().
 */

import { nextTick, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'

/**
 * Menerjemahkan error browser menjadi pesan yang bisa dipahami pengguna.
 *
 * @param {unknown} error
 * @returns {string}
 */
function getCameraErrorMessage(error) {
  const name = error instanceof Error ? error.name : ''

  switch (name) {
    case 'NotAllowedError':
    case 'PermissionDeniedError':
      return 'Akses kamera ditolak. Izinkan kamera pada pengaturan browser, lalu coba lagi.'
    case 'NotFoundError':
    case 'DevicesNotFoundError':
      return 'Kamera tidak ditemukan. Pastikan perangkat memiliki webcam yang terhubung.'
    case 'NotReadableError':
    case 'TrackStartError':
      return 'Kamera sedang digunakan aplikasi lain. Tutup aplikasi tersebut lalu coba lagi.'
    case 'OverconstrainedError':
      return 'Resolusi kamera yang diminta tidak didukung. Coba gunakan kamera lain.'
    case 'SecurityError':
      return 'Kamera hanya dapat diakses melalui HTTPS atau alamat localhost.'
    default:
      return 'Kamera gagal diaktifkan. Periksa izin kamera lalu muat ulang halaman.'
  }
}

/**
 * @param {{ facingMode?: 'environment' | 'user', preferredDeviceIndex?: number }} [options]
 *   `environment` untuk kamera belakang (pindai KTP), `user` untuk kamera depan
 *   (selfie). `preferredDeviceIndex` dipakai saat ada lebih dari satu webcam
 *   agar panel KTP dan selfie memilih kamera yang berbeda secara otomatis.
 * @returns {{
 *   videoRef: import('vue').Ref<HTMLVideoElement | null>,
 *   isActive: import('vue').Ref<boolean>,
 *   isStarting: import('vue').Ref<boolean>,
 *   isReady: import('vue').Ref<boolean>,
 *   isSupported: boolean,
 *   error: import('vue').Ref<string>,
 *   devices: import('vue').Ref<MediaDeviceInfo[]>,
 *   selectedDeviceId: import('vue').Ref<string>,
 *   refreshDevices: () => Promise<void>,
 *   start: () => Promise<void>,
 *   stop: () => void,
 *   captureFrame: () => HTMLCanvasElement | null,
 * }}
 */
export function useCamera(options = {}) {
  // Kamera depan dipakai untuk selfie, kamera belakang untuk pindai KTP.
  const facingMode = options.facingMode ?? 'environment'
  const preferredDeviceIndex = Number.isInteger(options.preferredDeviceIndex)
    ? options.preferredDeviceIndex
    : null
  const videoRef = ref(null)
  const stream = shallowRef(null)
  const devices = ref([])
  const selectedDeviceId = ref('')
  const isActive = ref(false)
  const isStarting = ref(false)
  const isReady = ref(false)
  const error = ref('')

  // Navigasi API dicek sekali agar template tidak perlu menyentuh navigator.
  const isSupported =
    typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia)

  // ID permintaan mencegah hasil start() yang sudah basi menimpa stop().
  let requestId = 0

  /**
   * Memuat daftar kamera yang terhubung. Label perangkat baru terisi
   * setelah pengguna memberikan izin kamera.
   */
  async function refreshDevices() {
    if (!isSupported || !navigator.mediaDevices?.enumerateDevices) return

    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices()
      devices.value = allDevices.filter(
        (device) => device.kind === 'videoinput' && device.deviceId,
      )
    } catch {
      devices.value = []
    }
  }

  /**
   * Menentukan kamera yang dipakai. Pilihan manual diutamakan, lalu kamera
   * sesuai urutan perangkat agar dua panel memakai webcam yang berbeda.
   *
   * @returns {string}
   */
  function resolveDeviceId() {
    if (selectedDeviceId.value) return selectedDeviceId.value
    if (preferredDeviceIndex === null) return ''

    return devices.value[preferredDeviceIndex]?.deviceId ?? ''
  }

  /**
   * Menunggu metadata video tersedia sebelum kamera dianggap siap.
   *
   * @param {HTMLVideoElement} video
   * @returns {Promise<void>}
   */
  function waitForVideoMetadata(video) {
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      const timeout = window.setTimeout(() => {
        cleanup()
        reject(new Error('Kamera terlalu lama merespons.'))
      }, 10000)

      function cleanup() {
        window.clearTimeout(timeout)
        video.removeEventListener('loadedmetadata', handleLoaded)
        video.removeEventListener('error', handleError)
      }

      function handleLoaded() {
        cleanup()
        resolve()
      }

      function handleError() {
        cleanup()
        reject(new Error('Video kamera gagal dimuat.'))
      }

      video.addEventListener('loadedmetadata', handleLoaded, { once: true })
      video.addEventListener('error', handleError, { once: true })
    })
  }

  /**
   * Mengaktifkan kamera setelah pengguna menekan tombol.
   */
  async function start() {
    if (isActive.value || isStarting.value) return

    if (!isSupported) {
      error.value = 'Browser ini tidak mendukung akses kamera.'
      return
    }

    const currentRequest = requestId + 1
    requestId = currentRequest
    isStarting.value = true
    error.value = ''

    try {
      // Daftar perangkat diperlukan agar dua webcam bisa dipisahkan.
      await refreshDevices()

      if (currentRequest !== requestId) return

      const deviceId = resolveDeviceId()
      const videoConstraints = {
        width: { ideal: 1920 },
        height: { ideal: 1080 },
      }

      if (deviceId) {
        // deviceId dipakai untuk webcam eksternal yang tidak punya facingMode.
        videoConstraints.deviceId = { exact: deviceId }
      } else {
        videoConstraints.facingMode = { ideal: facingMode }
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: videoConstraints,
      })

      // Bila pengguna sudah menekan stop selama izin diminta, buang stream.
      if (currentRequest !== requestId) {
        mediaStream.getTracks().forEach((track) => track.stop())
        return
      }

      stream.value = mediaStream
      isActive.value = true
      await nextTick()

      const video = videoRef.value
      if (!video) {
        throw new Error('Elemen video tidak tersedia.')
      }

      video.srcObject = mediaStream
      await video.play()
      await waitForVideoMetadata(video)

      if (currentRequest !== requestId) return

      isReady.value = true

      // Simpan kamera yang benar-benar dipakai agar pilihan di UI sesuai.
      const activeDeviceId = mediaStream.getVideoTracks()[0]?.getSettings?.().deviceId
      if (activeDeviceId) selectedDeviceId.value = activeDeviceId
      await refreshDevices()

      // Jika kamera dicabut atau stream berhenti, kembalikan UI ke kondisi awal.
      mediaStream.getVideoTracks().forEach((track) => {
        track.addEventListener(
          'ended',
          () => {
            if (currentRequest === requestId) stop()
          },
          { once: true },
        )
      })
    } catch (caughtError) {
      // Abaikan error yang muncul karena start() sudah dibatalkan oleh stop().
      if (currentRequest === requestId) {
        stop()
        error.value = getCameraErrorMessage(caughtError)
      }
    } finally {
      if (currentRequest === requestId) {
        isStarting.value = false
      }
    }
  }

  /**
   * Menghentikan semua track kamera dan membersihkan elemen video.
   */
  function stop() {
    requestId += 1

    const currentStream = stream.value
    stream.value = null
    currentStream?.getTracks().forEach((track) => track.stop())

    if (videoRef.value) {
      videoRef.value.srcObject = null
    }

    isActive.value = false
    isStarting.value = false
    isReady.value = false
  }

  /**
   * Mengambil satu frame dari video ke canvas.
   * Canvas dipakai agar gambar bisa diproses lokal tanpa upload.
   *
   * @returns {HTMLCanvasElement | null}
   */
  function captureFrame() {
    const video = videoRef.value
    if (!video || !isReady.value || !video.videoWidth || !video.videoHeight) {
      return null
    }

    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const context = canvas.getContext('2d')
    if (!context) return null

    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas
  }

  // Pastikan kamera selalu mati ketika komponen ditinggalkan.
  onBeforeUnmount(stop)
  onMounted(refreshDevices)

  return {
    videoRef,
    isActive,
    isStarting,
    isReady,
    isSupported,
    error,
    devices,
    selectedDeviceId,
    refreshDevices,
    start,
    stop,
    captureFrame,
  }
}
