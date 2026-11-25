<script setup>
import { mdiContentCopy, mdiDownload, mdiFileImageOutline, mdiQrcode, mdiShareVariantOutline, mdiVectorSquare } from '@mdi/js'
import { computed, onBeforeUnmount, onMounted, ref, toRef } from 'vue'
import { createPngBlob, createSvgBlob, downloadBlob, useQrCode } from '../composables/useQrCode'

const props = defineProps({
  text: { type: String, default: '' },
  type: { type: String, default: 'qr' },
  options: { type: Object, required: true },
})

const { svgUrl, info, error } = useQrCode(toRef(props, 'text'), () => props.options)
const ready = computed(() => !!svgUrl.value)
const busy = ref('')

/* ---------- Capacidades del navegador ---------- */
const canCopy = ref(false)
const canShare = ref(false)
onMounted(() => {
  canCopy.value = typeof window.ClipboardItem === 'function' && !!navigator.clipboard?.write
  try {
    const probe = new File([''], 'qr.png', { type: 'image/png' })
    canShare.value = !!navigator.canShare?.({ files: [probe] })
  } catch {
    canShare.value = false
  }
})

/* ---------- Mensajes accesibles (aria-live) ---------- */
const status = ref('')
let statusTimer
function announce (message) {
  status.value = message
  clearTimeout(statusTimer)
  statusTimer = setTimeout(() => (status.value = ''), 3500)
}
onBeforeUnmount(() => clearTimeout(statusTimer))

const filename = ext => `qr-${props.type}.${ext}`

async function run (key, action) {
  if (!ready.value || busy.value) return
  busy.value = key
  try {
    await action()
  } catch (err) {
    if (err?.name !== 'AbortError') announce('No se pudo completar la acción. Inténtalo de nuevo.')
  } finally {
    busy.value = ''
  }
}

const downloadPng = () => run('png', async () => {
  downloadBlob(await createPngBlob(props.text, props.options), filename('png'))
  announce(`PNG de ${props.options.size} px descargado.`)
})

const downloadSvg = () => run('svg', async () => {
  downloadBlob(await createSvgBlob(props.text, props.options), filename('svg'))
  announce('SVG descargado.')
})

const copyImage = () => run('copy', async () => {
  // Safari exige pasar la promesa directamente dentro del gesto del usuario.
  await navigator.clipboard.write([
    new ClipboardItem({ 'image/png': createPngBlob(props.text, props.options) }),
  ])
  announce('Imagen copiada al portapapeles.')
})

const share = () => run('share', async () => {
  const blob = await createPngBlob(props.text, props.options)
  const file = new File([blob], filename('png'), { type: 'image/png' })
  await navigator.share({ files: [file], title: 'Código QR' })
})
</script>

<template>
  <section aria-labelledby="titulo-preview" class="panel preview-panel">
    <div class="panel-head">
      <span aria-hidden="true" class="step"><v-icon :icon="mdiDownload" size="18" /></span>
      <h2 id="titulo-preview">Descarga tu QR</h2>
    </div>

    <div class="qr-stage" :class="{ 'is-transparent': options.transparent }">
      <img
        v-if="ready"
        alt="Vista previa del código QR generado"
        class="qr-image"
        decoding="async"
        height="320"
        :src="svgUrl"
        width="320"
      >
      <div v-else class="qr-empty">
        <v-icon :icon="mdiQrcode" size="72" />
        <p>{{ error ? 'No se puede generar' : 'Completa el contenido y tu QR aparecerá aquí' }}</p>
      </div>
    </div>

    <p v-if="info" class="qr-meta">
      Versión {{ info.version }} · {{ info.modules }}×{{ info.modules }} módulos · {{ info.chars }} caracteres
    </p>

    <v-alert v-if="error" class="preview-alert" density="compact" type="error" variant="tonal">
      {{ error }}
    </v-alert>

    <div class="actions">
      <v-btn
        block
        color="primary"
        :disabled="!ready"
        :loading="busy === 'png'"
        :prepend-icon="mdiFileImageOutline"
        size="large"
        variant="flat"
        @click="downloadPng"
      >
        Descargar PNG
      </v-btn>
      <div class="actions-row">
        <v-btn
          :disabled="!ready"
          :loading="busy === 'svg'"
          :prepend-icon="mdiVectorSquare"
          variant="outlined"
          @click="downloadSvg"
        >
          SVG
        </v-btn>
        <v-btn
          v-if="canCopy"
          :disabled="!ready"
          :loading="busy === 'copy'"
          :prepend-icon="mdiContentCopy"
          variant="outlined"
          @click="copyImage"
        >
          Copiar
        </v-btn>
        <v-btn
          v-if="canShare"
          :disabled="!ready"
          :loading="busy === 'share'"
          :prepend-icon="mdiShareVariantOutline"
          variant="outlined"
          @click="share"
        >
          Compartir
        </v-btn>
      </div>
    </div>

    <p aria-live="polite" class="status" role="status">{{ status }}</p>
  </section>
</template>
