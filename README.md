# Para Maricielo

Cortometraje de cumpleaños de una sola pantalla y diez escenas. La reproducción empieza al cargar la página, sin botón de inicio. Si el navegador impide el autoplay, la historia sigue y aparece un control pequeño para activar la música. La pausa interna de depuración es **P** o la barra espaciadora.

## Probar y publicar

Abre `index.html` en un navegador moderno o sirve la carpeta con cualquier servidor estático. No necesita instalación ni compilación. Sube el contenido del proyecto a Netlify o GitHub Pages.

La pista local existente continúa en `assets/audio/happy-birthday.ogg`, configurada en `music-config.js`. El reproductor intenta iniciarla al cargar, repite en bucle y usa un fundido de entrada a volumen 0.35; si el navegador la bloquea, el control visible permite activarla con un clic.

## Fotografías y licencias

- BTS, foto oficial de la Casa Blanca, dominio público — [página de Commons](https://commons.wikimedia.org/wiki/File:BTS_at_the_White_House_on_May_31,_2022.jpg).
- BTS, momento espontáneo durante una sesión fotográfica (2014), BANGTAN BLOG, CC BY 4.0 — [página de Commons](https://commons.wikimedia.org/wiki/File:Bangtan_Boys_during_a_photography_session,_May_2014_04.jpg).
- TXT, K-POPIT, CC BY 3.0 — [página de Commons](https://commons.wikimedia.org/wiki/File:Tomorrow_X_Together_at_a_Dior_event_in_2025_02.jpg).
- Beomgyu en el showcase de debut de TXT (2019), Kinocine, CC BY-SA 4.0 — [página de Commons](https://commons.wikimedia.org/wiki/File:Beomgyu1.jpg).

El código intenta copias opcionales en `assets/images/` (`bts.jpg`, `bts-funny.jpg`, `txt.jpg` y `beomgyu.jpg`) si falla la URL remota. Esos archivos locales no están incluidos porque este entorno no pudo conectarse a Wikimedia. Si la imagen remota y la copia local faltan, se ocultan la foto y su texto asociado, sin mostrar un recuadro con letras. Las flores son ilustraciones SVG animadas y no dependen de una foto remota.
