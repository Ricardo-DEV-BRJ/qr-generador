<script setup>
import { ref, watch } from 'vue'
import { HEX_RE } from '../utils/color'

const model = defineModel({ type: String, required: true })
const props = defineProps({
  label: { type: String, required: true },
  disabled: Boolean,
})

const text = ref(model.value)
watch(model, value => {
  if (value.toLowerCase() !== normalize(text.value)) text.value = value
})

function normalize (value) {
  const v = (value || '').trim().toLowerCase()
  return v.startsWith('#') ? v : `#${v}`
}

function onText (value) {
  text.value = value ?? ''
  const hex = normalize(text.value)
  if (HEX_RE.test(hex)) model.value = hex
}

function onPick (event) {
  model.value = event.target.value
  text.value = event.target.value
}

const rules = [v => HEX_RE.test(normalize(v)) || 'Usa el formato #RRGGBB']
</script>

<template>
  <v-text-field
    autocomplete="off"
    hide-details="auto"
    :disabled="props.disabled"
    :label="props.label"
    maxlength="7"
    :model-value="text"
    :rules="rules"
    spellcheck="false"
    @update:model-value="onText"
  >
    <template #prepend-inner>
      <label class="swatch" :style="{ backgroundColor: model }" @mousedown.stop>
        <input
          :aria-label="`Elegir ${props.label.toLowerCase()} con el selector`"
          :disabled="props.disabled"
          type="color"
          :value="model"
          @input="onPick"
        >
      </label>
    </template>
  </v-text-field>
</template>

<style scoped>
.swatch {
  position: relative;
  display: inline-block;
  inline-size: 28px;
  block-size: 28px;
  border-radius: 8px;
  border: 1px solid rgba(var(--v-border-color), 0.4);
  cursor: pointer;
  flex: none;
  margin-inline-end: 8px;
}
.swatch:focus-within {
  outline: 2px solid rgb(var(--v-theme-primary));
  outline-offset: 2px;
}
.swatch input {
  position: absolute;
  inset: 0;
  inline-size: 100%;
  block-size: 100%;
  opacity: 0;
  cursor: pointer;
  border: 0;
  padding: 0;
}
</style>
