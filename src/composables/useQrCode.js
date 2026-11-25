import QRCode from 'qrcode'
import { onBeforeUnmount, shallowRef, toValue, watch } from 'vue'

export const DEFAULT_OPTIONS = Object.freeze({
  dark: '#000000',
  light: '#ffffff',
  transparent: false,
  ecc: 'M',
  margin: 4,
  size: 1024,
})

/** Convierte nuestras opciones al formato que espera la librería `qrcode`. */
function renderOptions (options, width) {
  return {
    errorCorrectionLevel: options.ecc,
    margin: options.margin,
    width,
    color: {
      dark: options.dark,
      light: options.transparent ? '#ffffff00' : options.light,
    },
  }
}

function friendlyError (err) {
  const msg = String(err?.message || err)
  if (/too big|amount of data/i.test(msg)) {
    return 'El contenido es demasiado largo para un código QR. Acórtalo o baja el nivel de corrección de errores.'
  }
  return 'No se pudo generar el código QR con estos datos.'
}

/**
 * Genera la vista previa (SVG liviano) cada vez que cambian el texto o las opciones.
 * Usa un pequeño debounce para no regenerar en cada pixel al arrastrar el selector de color.
 */
export function useQrCode (text, options, delay = 120) {
  const svgUrl = shallowRef('')
  const info = shallowRef(null)
  const error = shallowRef('')
  let timer
  let ticket = 0

  async function render () {
    const value = toValue(text)
    const opts = toValue(options)
    const current = ++ticket

    if (!value) {
      svgUrl.value = ''
      info.value = null
      error.value = ''
      return
    }

    try {
      const qr = QRCode.create(value, { errorCorrectionLevel: opts.ecc })
      const svg = await QRCode.toString(value, { ...renderOptions(opts), type: 'svg' })
      if (current !== ticket) return
      svgUrl.value = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
      info.value = { version: qr.version, modules: qr.modules.size, chars: [...value].length }
      error.value = ''
    } catch (err) {
      if (current !== ticket) return
      svgUrl.value = ''
      info.value = null
      error.value = friendlyError(err)
    }
  }

  let first = true
  watch(
    () => [toValue(text), { ...toValue(options) }],
    () => {
      clearTimeout(timer)
      if (first) {
        first = false
        render()
      } else {
        timer = setTimeout(render, delay)
      }
    },
    { immediate: true },
  )

  onBeforeUnmount(() => clearTimeout(timer))

  return { svgUrl, info, error }
}

/** PNG en la resolución elegida (se dibuja en un canvas fuera de pantalla). */
export async function createPngBlob (text, options) {
  const canvas = document.createElement('canvas')
  await QRCode.toCanvas(canvas, text, renderOptions(options, options.size))
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => (blob ? resolve(blob) : reject(new Error('No se pudo crear el PNG'))), 'image/png')
  })
}

/** SVG vectorial: ideal para imprimir en cualquier tamaño. */
export async function createSvgBlob (text, options) {
  const svg = await QRCode.toString(text, { ...renderOptions(options, options.size), type: 'svg' })
  return new Blob([svg], { type: 'image/svg+xml' })
}

export function downloadBlob (blob, filename) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.append(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 2000)
}
