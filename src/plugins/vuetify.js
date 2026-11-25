// Solo los estilos base de Vuetify (~20 KB). Se omiten a propósito el paquete de
// colores y las clases utilitarias (~280 KB sin comprimir) para ahorrar ancho de banda;
// el layout propio vive en src/styles/main.css.
import 'vuetify/styles/core'

import { createVuetify } from 'vuetify'
// Íconos como SVG en línea: solo se empaquetan los que se usan (sin fuente de íconos).
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg'
import { es } from 'vuetify/locale'

export const THEME_KEY = 'qr:theme'

function storedTheme () {
  try {
    const value = localStorage.getItem(THEME_KEY)
    return value === 'light' || value === 'dark' ? value : 'system'
  } catch {
    return 'system'
  }
}

export default createVuetify({
  locale: {
    locale: 'es',
    messages: { es },
  },
  icons: {
    defaultSet: 'mdi',
    aliases,
    sets: { mdi },
  },
  theme: {
    defaultTheme: storedTheme(),
    themes: {
      light: {
        dark: false,
        colors: {
          'background': '#f4f5fa',
          'surface': '#ffffff',
          'primary': '#4338ca',
          'secondary': '#475569',
          'error': '#b91c1c',
          'warning': '#b45309',
          'success': '#15803d',
          'info': '#0369a1',
        },
      },
      dark: {
        dark: true,
        colors: {
          'background': '#0f1117',
          'surface': '#181b23',
          'primary': '#a5b4fc',
          'on-primary': '#1e1b4b',
          'secondary': '#cbd5e1',
          'error': '#f87171',
          'warning': '#fbbf24',
          'success': '#4ade80',
          'info': '#38bdf8',
        },
      },
    },
  },
  defaults: {
    VTextField: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VTextarea: { variant: 'outlined', density: 'comfortable', color: 'primary' },
    VSwitch: { color: 'primary', inset: true, hideDetails: true },
    VSlider: { color: 'primary' },
    VBtnToggle: { color: 'primary', variant: 'outlined', divided: true, mandatory: true, density: 'comfortable' },
    VBtn: { rounded: 'lg' },
  },
})
