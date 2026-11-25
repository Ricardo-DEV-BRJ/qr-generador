/**
 * Construye el texto que se codifica dentro del QR según el tipo de contenido.
 * Devuelve '' cuando todavía no hay datos suficientes para generar un QR útil.
 */

export function createDefaultData () {
  return {
    url: { url: '' },
    text: { text: '' },
    wifi: { ssid: '', password: '', encryption: 'WPA', hidden: false },
    whatsapp: { phone: '', message: '' },
    email: { to: '', subject: '', body: '' },
    phone: { phone: '' },
    sms: { phone: '', message: '' },
    vcard: { firstName: '', lastName: '', org: '', title: '', phone: '', email: '', url: '', address: '' },
  }
}

const SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i

/** Agrega https:// cuando el usuario escribe solo el dominio (ej. "midominio.com"). */
export function normalizeUrl (value) {
  const url = (value || '').trim()
  if (!url) return ''
  return SCHEME_RE.test(url) ? url : `https://${url}`
}

/** Deja solo dígitos y un "+" inicial. */
export function cleanPhone (value) {
  const trimmed = (value || '').trim()
  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return ''
  return trimmed.startsWith('+') ? `+${digits}` : digits
}

/** Escapa los caracteres especiales del formato WIFI: de ZXing. */
function escapeWifi (value) {
  return String(value).replace(/([\\;,:"])/g, '\\$1')
}

/** Escapa texto para vCard 3.0 (RFC 2426). */
function escapeVcard (value) {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/([,;])/g, '\\$1')
}

function query (params) {
  const parts = Object.entries(params)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
  return parts.length ? `?${parts.join('&')}` : ''
}

const builders = {
  url: d => normalizeUrl(d.url),

  text: d => (d.text.trim() ? d.text : ''),

  wifi: d => {
    if (!d.ssid.trim()) return ''
    const enc = d.encryption
    let out = `WIFI:T:${enc};S:${escapeWifi(d.ssid)};`
    if (enc !== 'nopass' && d.password) out += `P:${escapeWifi(d.password)};`
    if (d.hidden) out += 'H:true;'
    return `${out};`
  },

  whatsapp: d => {
    const digits = cleanPhone(d.phone).replace('+', '')
    if (!digits) return ''
    return `https://wa.me/${digits}${query({ text: d.message })}`
  },

  email: d => {
    const to = d.to.trim()
    if (!to) return ''
    return `mailto:${to}${query({ subject: d.subject, body: d.body })}`
  },

  phone: d => {
    const phone = cleanPhone(d.phone)
    return phone ? `tel:${phone}` : ''
  },

  sms: d => {
    const phone = cleanPhone(d.phone)
    if (!phone) return ''
    return d.message ? `SMSTO:${phone}:${d.message}` : `SMSTO:${phone}`
  },

  vcard: d => {
    const first = d.firstName.trim()
    const last = d.lastName.trim()
    const phone = cleanPhone(d.phone)
    const email = d.email.trim()
    if (!first && !last && !phone && !email) return ''

    const lines = [
      'BEGIN:VCARD',
      'VERSION:3.0',
      `N:${escapeVcard(last)};${escapeVcard(first)};;;`,
      `FN:${escapeVcard([first, last].filter(Boolean).join(' ') || phone || email)}`,
    ]
    if (d.org.trim()) lines.push(`ORG:${escapeVcard(d.org.trim())}`)
    if (d.title.trim()) lines.push(`TITLE:${escapeVcard(d.title.trim())}`)
    if (phone) lines.push(`TEL;TYPE=CELL:${phone}`)
    if (email) lines.push(`EMAIL:${escapeVcard(email)}`)
    if (d.url.trim()) lines.push(`URL:${escapeVcard(normalizeUrl(d.url))}`)
    if (d.address.trim()) lines.push(`ADR:;;${escapeVcard(d.address.trim())};;;;`)
    lines.push('END:VCARD')
    return lines.join('\r\n')
  },
}

export function buildPayload (type, data) {
  const build = builders[type]
  return build && data ? build(data) : ''
}
