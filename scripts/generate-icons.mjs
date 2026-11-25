// Genera los íconos PNG de la PWA en /public sin dependencias nativas (solo pngjs).
// Uso: npm run icons
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')
mkdirSync(root, { recursive: true })

const BG = [0x43, 0x38, 0xca] // primary #4338ca
const FG = [0xff, 0xff, 0xff]

// Glifo de 14×14 módulos: tres patrones de posición + algunos módulos de datos.
// Debe coincidir con public/favicon.svg.
const GLYPH = [
  '#####..#.#####',
  '#...#.#..#...#',
  '#.#.#....#.#.#',
  '#...#.##.#...#',
  '#####.#..#####',
  '......##......',
  '#.##..#.#..#..',
  '.#..##..##.#.#',
  '......#..##...',
  '#####..#..#.##',
  '#...#.##.#....',
  '#.#.#..#.##.#.',
  '#...#.#....##.',
  '#####..##.#..#',
]
const N = GLYPH.length

/**
 * @param size      lado del PNG en px
 * @param inset     fracción del lado ocupada por el glifo
 * @param radius    radio de las esquinas del fondo (fracción del lado); 0 = cuadrado completo
 */
function render (size, { inset, radius }) {
  const png = new PNG({ width: size, height: size })
  const SS = 4 // supersampling para bordes suaves
  const glyphSize = size * inset
  const offset = (size - glyphSize) / 2
  const r = radius * size

  const insideBg = (x, y) => {
    if (r <= 0) return true
    const cx = Math.min(Math.max(x, r), size - r)
    const cy = Math.min(Math.max(y, r), size - r)
    return (x - cx) ** 2 + (y - cy) ** 2 <= r * r
  }
  const insideGlyph = (x, y) => {
    const gx = Math.floor(((x - offset) / glyphSize) * N)
    const gy = Math.floor(((y - offset) / glyphSize) * N)
    return gx >= 0 && gy >= 0 && gx < N && gy < N && GLYPH[gy][gx] === '#'
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let bg = 0
      let fg = 0
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const px = x + (sx + 0.5) / SS
          const py = y + (sy + 0.5) / SS
          if (insideBg(px, py)) {
            bg++
            if (insideGlyph(px, py)) fg++
          }
        }
      }
      const total = SS * SS
      const alpha = bg / total
      const mix = bg ? fg / bg : 0
      const i = (size * y + x) << 2
      for (let c = 0; c < 3; c++) png.data[i + c] = Math.round(BG[c] * (1 - mix) + FG[c] * mix)
      png.data[i + 3] = Math.round(alpha * 255)
    }
  }
  return PNG.sync.write(png, { colorType: 6 })
}

const icons = [
  ['pwa-192.png', 192, { inset: 0.62, radius: 0.22 }],
  ['pwa-512.png', 512, { inset: 0.62, radius: 0.22 }],
  // Maskable: fondo completo y glifo dentro de la zona segura (círculo del 80 %).
  ['maskable-512.png', 512, { inset: 0.5, radius: 0 }],
  // iOS aplica sus propias esquinas redondeadas.
  ['apple-touch-icon.png', 180, { inset: 0.6, radius: 0 }],
]

for (const [name, size, opts] of icons) {
  const buf = render(size, opts)
  writeFileSync(join(root, name), buf)
  console.log(`✓ ${name} (${size}px, ${(buf.length / 1024).toFixed(1)} KB)`)
}

// favicon.svg: mismo diseño en vectorial (agrupa módulos contiguos de cada fila).
const VIEW = 24
const inset = 0.62
const m = (VIEW * inset) / N
const o = (VIEW - VIEW * inset) / 2
const fmt = n => +n.toFixed(3)
let d = ''
GLYPH.forEach((row, y) => {
  for (const match of row.matchAll(/#+/g)) {
    d += `M${fmt(o + match.index * m)} ${fmt(o + y * m)}h${fmt(match[0].length * m)}v${fmt(m)}h-${fmt(match[0].length * m)}z`
  }
})
const hex = c => `#${c.map(v => v.toString(16).padStart(2, '0')).join('')}`
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${VIEW} ${VIEW}"><rect width="${VIEW}" height="${VIEW}" rx="${fmt(VIEW * 0.22)}" fill="${hex(BG)}"/><path fill="${hex(FG)}" d="${d}"/></svg>\n`
writeFileSync(join(root, 'favicon.svg'), svg)
console.log(`✓ favicon.svg (${(svg.length / 1024).toFixed(1)} KB)`)
