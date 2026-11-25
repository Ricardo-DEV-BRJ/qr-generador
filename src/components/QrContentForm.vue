<script setup>
import {
  mdiAccountOutline,
  mdiCardAccountDetailsOutline,
  mdiEmailOutline,
  mdiEye,
  mdiEyeOff,
  mdiLink,
  mdiMapMarkerOutline,
  mdiMessageTextOutline,
  mdiOfficeBuildingOutline,
  mdiPhoneOutline,
  mdiTextBoxOutline,
  mdiWhatsapp,
  mdiTextBoxEditOutline,
  mdiWifi,
} from '@mdi/js'
import { reactive, ref, watchEffect } from 'vue'
import { buildPayload, createDefaultData } from '../utils/payload'

const type = defineModel('type', { type: String, default: 'url' })
const payload = defineModel('payload', { type: String, default: '' })

const QR_TYPES = [
  { value: 'url', label: 'Enlace', icon: mdiLink },
  { value: 'text', label: 'Texto', icon: mdiTextBoxOutline },
  { value: 'wifi', label: 'Wi‑Fi', icon: mdiWifi },
  { value: 'whatsapp', label: 'WhatsApp', icon: mdiWhatsapp },
  { value: 'email', label: 'Correo', icon: mdiEmailOutline },
  { value: 'phone', label: 'Llamada', icon: mdiPhoneOutline },
  { value: 'sms', label: 'SMS', icon: mdiMessageTextOutline },
  { value: 'vcard', label: 'Contacto', icon: mdiCardAccountDetailsOutline },
]

const WIFI_ENCRYPTION = [
  { value: 'WPA', label: 'WPA/WPA2/WPA3' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'Abierta' },
]

const data = reactive(createDefaultData())
const showPassword = ref(false)

watchEffect(() => {
  payload.value = buildPayload(type.value, data[type.value])
})

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const emailRule = v => !v || EMAIL_RE.test(v.trim()) || 'Revisa el formato del correo'
const phoneRule = v => !v || /^\+?[\d\s().-]{5,}$/.test(v.trim()) || 'Solo números, espacios y +'
</script>

<template>
  <section aria-labelledby="titulo-contenido" class="panel">
    <div class="panel-head">
      <span aria-hidden="true" class="step"><v-icon :icon="mdiTextBoxEditOutline" size="18" /></span>
      <h2 id="titulo-contenido">¿Qué quieres compartir?</h2>
    </div>

    <v-chip-group
      v-model="type"
      aria-label="Tipo de contenido del QR"
      role="radiogroup"
      class="type-chips"
      color="primary"
      column
      mandatory
    >
      <v-chip
        v-for="t in QR_TYPES"
        :key="t.value"
        :aria-checked="type === t.value"
        :prepend-icon="t.icon"
        role="radio"
        :value="t.value"
        variant="outlined"
      >
        {{ t.label }}
      </v-chip>
    </v-chip-group>

    <div class="fields">
      <!-- Enlace -->
      <template v-if="type === 'url'">
        <v-text-field
          v-model="data.url.url"
          autocomplete="url"
          clearable
          hint="Si no escribes https:// lo agregamos por ti"
          inputmode="url"
          label="Dirección web"
          placeholder="https://tusitio.com"
          :prepend-inner-icon="mdiLink"
          spellcheck="false"
          type="url"
        />
      </template>

      <!-- Texto libre -->
      <template v-else-if="type === 'text'">
        <v-textarea
          v-model="data.text.text"
          auto-grow
          clearable
          counter
          label="Texto"
          placeholder="Escribe cualquier mensaje…"
          rows="3"
        />
      </template>

      <!-- Wi-Fi -->
      <template v-else-if="type === 'wifi'">
        <v-text-field
          v-model="data.wifi.ssid"
          autocomplete="off"
          label="Nombre de la red (SSID)"
          :prepend-inner-icon="mdiWifi"
          spellcheck="false"
        />
        <div class="field-group">
          <span id="lbl-seguridad" class="field-label">Seguridad</span>
          <v-btn-toggle v-model="data.wifi.encryption" aria-labelledby="lbl-seguridad" class="toggle-full">
            <v-btn v-for="e in WIFI_ENCRYPTION" :key="e.value" :aria-pressed="data.wifi.encryption === e.value" :value="e.value">{{ e.label }}</v-btn>
          </v-btn-toggle>
        </div>
        <v-text-field
          v-if="data.wifi.encryption !== 'nopass'"
          v-model="data.wifi.password"
          :append-inner-icon="showPassword ? mdiEyeOff : mdiEye"
          autocomplete="off"
          label="Contraseña"
          spellcheck="false"
          :type="showPassword ? 'text' : 'password'"
          @click:append-inner="showPassword = !showPassword"
        />
        <v-switch v-model="data.wifi.hidden" label="Es una red oculta" />
      </template>

      <!-- WhatsApp -->
      <template v-else-if="type === 'whatsapp'">
        <v-text-field
          v-model="data.whatsapp.phone"
          autocomplete="tel"
          hint="Incluye el código de país, ej. +58 412 1234567"
          inputmode="tel"
          label="Número de WhatsApp"
          persistent-hint
          :prepend-inner-icon="mdiWhatsapp"
          :rules="[phoneRule]"
          type="tel"
        />
        <v-textarea
          v-model="data.whatsapp.message"
          auto-grow
          label="Mensaje predefinido (opcional)"
          rows="2"
        />
      </template>

      <!-- Correo -->
      <template v-else-if="type === 'email'">
        <v-text-field
          v-model="data.email.to"
          autocomplete="email"
          inputmode="email"
          label="Correo del destinatario"
          :prepend-inner-icon="mdiEmailOutline"
          :rules="[emailRule]"
          spellcheck="false"
          type="email"
        />
        <v-text-field v-model="data.email.subject" label="Asunto (opcional)" />
        <v-textarea v-model="data.email.body" auto-grow label="Mensaje (opcional)" rows="2" />
      </template>

      <!-- Llamada -->
      <template v-else-if="type === 'phone'">
        <v-text-field
          v-model="data.phone.phone"
          autocomplete="tel"
          hint="Incluye el código de país para que funcione desde cualquier lugar"
          inputmode="tel"
          label="Número de teléfono"
          persistent-hint
          :prepend-inner-icon="mdiPhoneOutline"
          :rules="[phoneRule]"
          type="tel"
        />
      </template>

      <!-- SMS -->
      <template v-else-if="type === 'sms'">
        <v-text-field
          v-model="data.sms.phone"
          autocomplete="tel"
          inputmode="tel"
          label="Número de teléfono"
          :prepend-inner-icon="mdiPhoneOutline"
          :rules="[phoneRule]"
          type="tel"
        />
        <v-textarea v-model="data.sms.message" auto-grow label="Mensaje (opcional)" rows="2" />
      </template>

      <!-- Contacto (vCard) -->
      <template v-else-if="type === 'vcard'">
        <div class="grid-2">
          <v-text-field
            v-model="data.vcard.firstName"
            autocomplete="given-name"
            label="Nombre"
            :prepend-inner-icon="mdiAccountOutline"
          />
          <v-text-field v-model="data.vcard.lastName" autocomplete="family-name" label="Apellido" />
          <v-text-field
            v-model="data.vcard.phone"
            autocomplete="tel"
            inputmode="tel"
            label="Teléfono"
            :prepend-inner-icon="mdiPhoneOutline"
            :rules="[phoneRule]"
            type="tel"
          />
          <v-text-field
            v-model="data.vcard.email"
            autocomplete="email"
            inputmode="email"
            label="Correo"
            :prepend-inner-icon="mdiEmailOutline"
            :rules="[emailRule]"
            spellcheck="false"
            type="email"
          />
          <v-text-field
            v-model="data.vcard.org"
            autocomplete="organization"
            label="Empresa (opcional)"
            :prepend-inner-icon="mdiOfficeBuildingOutline"
          />
          <v-text-field v-model="data.vcard.title" autocomplete="organization-title" label="Cargo (opcional)" />
        </div>
        <v-text-field
          v-model="data.vcard.url"
          autocomplete="url"
          inputmode="url"
          label="Sitio web (opcional)"
          :prepend-inner-icon="mdiLink"
          spellcheck="false"
          type="url"
        />
        <v-text-field
          v-model="data.vcard.address"
          autocomplete="street-address"
          label="Dirección (opcional)"
          :prepend-inner-icon="mdiMapMarkerOutline"
        />
      </template>
    </div>
  </section>
</template>
