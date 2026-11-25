<script setup>
import { mdiDownloadCircleOutline, mdiShieldLockOutline, mdiWeatherNight, mdiWhiteBalanceSunny } from '@mdi/js'
import { computed, onBeforeUnmount, onMounted, reactive, ref, shallowRef, watch } from 'vue'
import { useTheme } from 'vuetify'
import QrContentForm from './components/QrContentForm.vue'
import QrOptions from './components/QrOptions.vue'
import QrPreview from './components/QrPreview.vue'
import { DEFAULT_OPTIONS } from './composables/useQrCode'
import { THEME_KEY } from './plugins/vuetify'

/* ---------- Tema claro / oscuro ---------- */
const theme = useTheme()
const isDark = computed(() => theme.global.current.value.dark)

function toggleTheme () {
  const next = isDark.value ? 'light' : 'dark'
  theme.change(next)
  try {
    localStorage.setItem(THEME_KEY, next)
  } catch {}
}

/* ---------- Estado del QR ---------- */
const type = ref('url')
const payload = ref('')

const OPTIONS_KEY = 'qr:options'
function loadOptions () {
  try {
    return { ...DEFAULT_OPTIONS, ...JSON.parse(localStorage.getItem(OPTIONS_KEY) || '{}') }
  } catch {
    return { ...DEFAULT_OPTIONS }
  }
}
const options = reactive(loadOptions())
watch(options, value => {
  try {
    localStorage.setItem(OPTIONS_KEY, JSON.stringify(value))
  } catch {}
})

/* ---------- Instalar como app (PWA) ---------- */
const installEvent = shallowRef(null)
function onBeforeInstall (e) {
  e.preventDefault()
  installEvent.value = e
}
async function install () {
  const e = installEvent.value
  installEvent.value = null
  await e?.prompt()
}
onMounted(() => window.addEventListener('beforeinstallprompt', onBeforeInstall))
onBeforeUnmount(() => window.removeEventListener('beforeinstallprompt', onBeforeInstall))
</script>

<template>
  <v-app>
    <a class="skip-link" href="#contenido">Saltar al contenido</a>

    <v-app-bar flat border="b" color="surface" density="comfortable">
      <template #prepend>
        <svg class="brand-logo" viewBox="0 0 24 24" aria-hidden="true">
          <rect width="24" height="24" rx="6" fill="rgb(var(--v-theme-primary))" />
          <g fill="rgb(var(--v-theme-on-primary))">
            <path d="M5 5h5v5H5zm1.5 1.5v2h2v-2zM14 5h5v5h-5zm1.5 1.5v2h2v-2zM5 14h5v5H5zm1.5 1.5v2h2v-2z" fill-rule="evenodd" />
            <path d="M12 12h2v2h-2zm2 2h2v2h-2zm2-2h3v2h-3zm-4 4h2v3h-2zm4 1h3v2h-3z" />
          </g>
        </svg>
      </template>

      <v-app-bar-title class="brand-title">Generador QR</v-app-bar-title>

      <template #append>
        <v-btn
          v-if="installEvent"
          :prepend-icon="mdiDownloadCircleOutline"
          class="install-btn"
          variant="text"
          @click="install"
        >
          Instalar
        </v-btn>
        <v-btn
          :aria-label="isDark ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'"
          :icon="isDark ? mdiWhiteBalanceSunny : mdiWeatherNight"
          variant="text"
          @click="toggleTheme"
        />
      </template>
    </v-app-bar>

    <v-main id="contenido" tabindex="-1">
      <div class="page">
        <header class="intro">
          <h1>Crea tu código QR</h1>
          <p>Gratis, sin registro y sin límites. Todo se genera en tu dispositivo.</p>
        </header>

        <div class="layout">
          <QrContentForm v-model:payload="payload" v-model:type="type" class="area-form" />
          <QrPreview class="area-preview" :options="options" :text="payload" :type="type" />
          <QrOptions class="area-options" :options="options" />
        </div>
      </div>
    </v-main>

    <footer class="site-footer">
      <v-icon :icon="mdiShieldLockOutline" size="18" />
      <p>
        Tus datos nunca salen de tu dispositivo: no se envían a ningún servidor.
        Funciona incluso sin conexión.
      </p>
    </footer>
  </v-app>
</template>
