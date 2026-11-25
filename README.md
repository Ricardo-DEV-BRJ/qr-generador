# Generador QR

Aplicación web para crear códigos QR, hecha con **Vue 3 + Vuetify 4 + Vite**. Funciona en móvil, tableta y escritorio, se puede instalar como app (PWA) y sigue funcionando sin conexión. Todo el QR se genera **en el navegador**: ningún dato se envía a un servidor.

## Funcionalidades

- **Tipos de contenido:** enlace, texto, Wi‑Fi, WhatsApp, correo, llamada, SMS y contacto (vCard).
- **Personalización:** color del código y del fondo, fondo transparente, nivel de corrección de errores (L/M/Q/H) y margen.
- **Alerta de legibilidad:** avisa si el contraste es bajo o si los colores están invertidos.
- **Exportación:** PNG (256 a 2048 px), SVG vectorial, copiar al portapapeles y compartir (en móviles).
- **Tema claro/oscuro:** sigue al sistema y se puede cambiar a mano.
- **Accesibilidad:** navegación por teclado, enlace "Saltar al contenido", etiquetas ARIA y mensajes de estado para lectores de pantalla.

## Desarrollo local

Requisitos: Node.js 20.19+ o 22+.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # genera /dist
npm run preview    # sirve /dist para revisarlo
```

## Probar con Docker en local

```bash
docker compose up --build
# o bien:
docker build -t generador-qr .
docker run -p 8080:80 generador-qr
```

Abre http://localhost:8080. Para revisar el estado del contenedor: http://localhost:8080/health

## Despliegue en Dokploy

1. Sube el proyecto a un repositorio Git (GitHub, GitLab, Gitea o Bitbucket).
2. En Dokploy: **Create Project → Create Service → Application**.
3. En **General → Provider**, conecta el repositorio y la rama.
4. En **Build Type** elige **Dockerfile** (Docker File: `Dockerfile`, Docker Context Path: `.`).
5. Pulsa **Deploy**.
6. En la pestaña **Domains**, agrega tu dominio con:
   - **Container Port:** `80`
   - **HTTPS:** activado, con certificado **Let's Encrypt**

   HTTPS es necesario para instalar la PWA, usar el modo sin conexión y copiar al portapapeles.
7. (Opcional) Activa **Auto Deploy** para publicar en cada `git push`.

El contenedor no necesita variables de entorno ni volúmenes. La imagen ya incluye un `HEALTHCHECK` contra `/health`.

## Optimizaciones de ancho de banda

| Técnica | Efecto |
| --- | --- |
| Vuetify con *tree-shaking* (`vite-plugin-vuetify`) | Solo se empaquetan los componentes que se usan. |
| Solo `vuetify/styles/core`, sin paquete de colores ni clases utilitarias | Unos 280 KB menos de CSS sin comprimir. |
| Íconos SVG de `@mdi/js` en vez de la fuente de íconos | Solo se incluyen los ~30 íconos usados, en lugar de una fuente de cientos de KB. |
| Fuentes del sistema | Cero descargas de tipografías. |
| Sin `VSelect`, `VMenu`, `VDialog` ni `VSnackbar` | Se evitan las capas de overlay; se usan botones y mensajes en línea. |
| Pre-compresión Brotli y gzip en el build + `brotli_static`/`gzip_static` en Nginx | 502 KB → **unos 124 KB** transferidos en la primera visita. |
| Código de librerías en archivos separados (`framework`, `vendor`) | Al actualizar la app solo se descarga el código propio (~8 KB). |
| Caché `immutable` de 1 año para `/assets/*` | Los archivos con hash no se vuelven a pedir. |
| Service Worker (PWA) | A partir de la segunda visita la app carga desde el dispositivo: ~0 KB de red. |
| Generación 100 % en el cliente | No hay llamadas a APIs ni a servidores externos. |

## Estructura

```
├── Dockerfile               # Build con Node → Nginx (Alpine + brotli), ~19 MB
├── nginx/
│   ├── nginx.conf           # Configuración base (logs a stdout para Dokploy)
│   ├── default.conf         # Compresión, caché, SPA y /health
│   └── security-headers.conf# CSP y cabeceras de seguridad
├── public/                  # Íconos PWA y favicon (generados con `npm run icons`)
├── scripts/generate-icons.mjs
├── src/
│   ├── App.vue              # Layout, tema e instalación de la PWA
│   ├── components/
│   │   ├── QrContentForm.vue# Tipos de contenido y formularios
│   │   ├── QrOptions.vue    # Colores, corrección, tamaño y margen
│   │   ├── QrPreview.vue    # Vista previa y exportación
│   │   └── ColorField.vue   # Campo hex + selector nativo de color
│   ├── composables/useQrCode.js  # Generación del QR (librería `qrcode`)
│   ├── utils/payload.js     # Formatos: WIFI:, mailto:, SMSTO:, vCard 3.0, wa.me…
│   ├── utils/color.js       # Contraste WCAG
│   ├── plugins/vuetify.js   # Tema, íconos, idioma y valores por defecto
│   └── styles/main.css      # Layout responsivo propio (sin Tailwind)
└── vite.config.js           # Vuetify, PWA, compresión y división de código
```

## Personalizar

- **Colores de la marca:** `src/plugins/vuetify.js` (temas `light` y `dark`) y `theme_color` en `vite.config.js`.
- **Ícono de la app:** edita el color o el dibujo en `scripts/generate-icons.mjs` y ejecuta `npm run icons`.
