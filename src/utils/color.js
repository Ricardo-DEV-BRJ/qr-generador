export const HEX_RE = /^#[0-9a-f]{6}$/i

function luminance (hex) {
  const n = Number.parseInt(hex.slice(1), 16)
  const channels = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => {
    const s = c / 255
    return s <= 0.039_28 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

/** Relación de contraste WCAG entre dos colores hex (#rrggbb). */
export function contrastRatio (a, b) {
  const la = luminance(a)
  const lb = luminance(b)
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05)
}

/** true si el color de los módulos es más claro que el fondo (QR invertido). */
export function isInverted (dark, light) {
  return luminance(dark) > luminance(light)
}
