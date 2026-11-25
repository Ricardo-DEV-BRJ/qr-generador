<script setup>
import { mdiAlertOutline, mdiBackupRestore, mdiPaletteOutline, mdiSwapHorizontal } from '@mdi/js'
import { computed } from 'vue'
import { DEFAULT_OPTIONS } from '../composables/useQrCode'
import { contrastRatio, isInverted } from '../utils/color'
import ColorField from './ColorField.vue'

const props = defineProps({
  /** Objeto reactivo compartido con App.vue (se edita en su lugar). */
  options: { type: Object, required: true },
})
const o = props.options

const ECC_LEVELS = [
  { value: 'L', hint: 'Baja (7 %): el QR más simple. Ideal para pantallas.' },
  { value: 'M', hint: 'Media (15 %): equilibrio recomendado para la mayoría de usos.' },
  { value: 'Q', hint: 'Alta (25 %): resiste mejor manchas o desgaste.' },
  { value: 'H', hint: 'Máxima (30 %): para impresiones expuestas o en exteriores.' },
]
const SIZES = [256, 512, 1024, 2048]

const eccHint = computed(() => ECC_LEVELS.find(l => l.value === o.ecc)?.hint)

const warning = computed(() => {
  if (o.transparent) {
    return 'Con fondo transparente, coloca el QR sobre una superficie clara para que se pueda escanear.'
  }
  if (isInverted(o.dark, o.light)) {
    return 'El color del código es más claro que el fondo. Muchos lectores no reconocen QR invertidos.'
  }
  if (contrastRatio(o.dark, o.light) < 4) {
    return 'El contraste es bajo y el QR podría no escanearse bien. Usa un color más oscuro para el código.'
  }
  return ''
})

function swapColors () {
  ;[o.dark, o.light] = [o.light, o.dark]
}

function reset () {
  Object.assign(o, DEFAULT_OPTIONS)
}
</script>

<template>
  <section aria-labelledby="titulo-opciones" class="panel">
    <div class="panel-head">
      <span aria-hidden="true" class="step"><v-icon :icon="mdiPaletteOutline" size="18" /></span>
      <h2 id="titulo-opciones">Personaliza</h2>
      <v-btn
        class="ms-auto-btn"
        density="comfortable"
        :prepend-icon="mdiBackupRestore"
        size="small"
        variant="text"
        @click="reset"
      >
        Restablecer
      </v-btn>
    </div>

    <div class="colors">
      <ColorField v-model="o.dark" label="Color del código" />
      <v-btn
        aria-label="Intercambiar colores"
        class="swap-btn"
        :disabled="o.transparent"
        :icon="mdiSwapHorizontal"
        variant="text"
        @click="swapColors"
      />
      <ColorField v-model="o.light" :disabled="o.transparent" label="Color de fondo" />
    </div>

    <v-switch v-model="o.transparent" label="Fondo transparente (PNG y SVG)" />

    <v-alert
      v-if="warning"
      class="options-alert"
      density="compact"
      :icon="mdiAlertOutline"
      type="warning"
      variant="tonal"
    >
      {{ warning }}
    </v-alert>

    <div class="field-group">
      <span id="lbl-ecc" class="field-label">Corrección de errores</span>
      <v-btn-toggle v-model="o.ecc" aria-labelledby="lbl-ecc" class="toggle-full">
        <v-btn v-for="l in ECC_LEVELS" :key="l.value" :aria-pressed="o.ecc === l.value" :value="l.value">{{ l.value }}</v-btn>
      </v-btn-toggle>
      <p class="field-hint">{{ eccHint }}</p>
    </div>

    <div class="field-group">
      <span id="lbl-size" class="field-label">Tamaño de descarga (PNG)</span>
      <v-btn-toggle v-model="o.size" aria-labelledby="lbl-size" class="toggle-full">
        <v-btn v-for="s in SIZES" :key="s" :aria-pressed="o.size === s" :value="s">{{ s }}</v-btn>
      </v-btn-toggle>
      <p class="field-hint">En píxeles. Usa 2048 o el formato SVG para imprimir en grande.</p>
    </div>

    <div class="field-group">
      <span id="lbl-margin" class="field-label">Margen: {{ o.margin }} {{ o.margin === 1 ? 'módulo' : 'módulos' }}</span>
      <v-slider
        v-model="o.margin"
        name="Margen del código"
        hide-details
        :max="10"
        :min="0"
        :step="1"
      />
      <p class="field-hint">Se recomiendan 4 módulos de espacio en blanco alrededor del código.</p>
    </div>
  </section>
</template>
