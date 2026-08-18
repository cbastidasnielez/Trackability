# Mariapnel 🌚

Cuenta atrás para el cumpleaños de Mariapnel 🌚 — **25 de agosto**, hora de Orlando, Florida.

Fondo negro, ondas de sonido y un emblema giratorio de "distancia y tiempo" con su foto en el centro.

## Qué hay ahora

- Dos contadores en vivo (días y horas : minutos : segundos): el cumpleaños
  (25/08) y el reencuentro, que apunta al aterrizaje en Orlando del 26/12 a
  las 19:10 (`ENCUENTRO` en `index.html`)
- Emblema giratorio (círculo de flechas "Distancia y Tiempo") con la foto de Mariapnel 🌚 en el centro
- Botón **"Presiona para desbloquear sorpresas 🌚"** con la misión provisional
- Lista permanente con las fechas que ya apuntó (se pueden quitar con la ×)
- Las fechas viven en el navegador (`localStorage`) y cualquier cambio se
  envía por email vía Formspree

## Recibir las fechas por email (Formspree)

1. Crea una cuenta gratis en [formspree.io](https://formspree.io) y añade un
   formulario nuevo (**+ New Form**), con el email donde quieras recibirlas.
2. Formspree te dará un endpoint tipo `https://formspree.io/f/abcd1234`.
   Copia solo la parte final: `abcd1234`.
3. En `index.html`, busca `var FORMSPREE_ID = ''` y pega ahí el ID:
   ```js
   var FORMSPREE_ID = 'abcd1234';
   ```
4. Guarda, haz commit y push. Vercel lo despliega solo.
5. La primera vez que llegue un envío, Formspree pide confirmar el email.

Mientras `FORMSPREE_ID` esté vacío la página funciona igual, pero sin enviar nada.

Cada envío incluye **la lista completa** de fechas, así que el último correo
recibido siempre refleja la agenda actual. Si falla la conexión, la fecha se
guarda igualmente y se reintenta el envío al volver a abrir la página.
- Responsive: funciona en móvil y ordenador

## Cómo está organizada

- **Sorpresas reveladas**: siempre a la vista, sin pulsar nada. Ahora mismo
  la Sorpresa 01 (tarjeta de embarque BCN → MCO, 26 dic 2026 – 8 ene 2027,
  con la ruta animada y el lema del emblema tachado y puesto a cero).
- **Sorpresas por revelar**: detrás del botón, las 7 casillas del calendario.

## Las 7 casillas

Se abre una por día, del **18 al 24 de agosto** (los 7 días previos al
cumpleaños); las fechas salen solas de `nextBirthday()`, así que no hay que
tocarlas cada año. Antes de su día la casilla sale con candado y no se puede
pulsar. Lo que ya se abrió queda guardado en `localStorage`.

Para escribir el contenido de cada una, rellena el array `SORPRESAS` de
`index.html`. Además de `titulo` y `texto`, una casilla admite `audio` (monta un
reproductor), `criticas` (bloque de reseñas al estilo cartel de cine) y
`nota` (una línea en cursiva al final):

```js
var SORPRESAS = [
  {
    titulo: 'Tu primer regalo es una canción',
    texto: '...',
    audio: { src: '/se-vence-en-diciembre.mp3', portada: '/portada-cancion.jpg',
             titulo: 'Se Vence en Diciembre', version: 'Versión Fluida',
             artista: 'doncarlitin' },
    nota: '...'
  },
  {
    titulo: 'Lo que causas en las personas',
    texto: '...',
    criticas: [
      { autor: 'Andrea Galindo', palabras: ['Luminosa', 'Inteligente', 'Amorosa'] },
      { autor: 'Roberto Perrotta', pendiente: true }   // sale como "Reseña en camino…"
    ]
  },
  ...
];
```

Si una casilla llega a su día con el texto vacío, se abre igual y dice que la
sorpresa está en camino.

### Revisarlas antes de tiempo

Añade `?test` a la URL (`https://undiaalavez.vercel.app/?test`) y todas las
casillas quedan pulsables, sin esperar a su fecha. Es solo para comprobarlas:
sale un aviso de que estás en modo prueba y **no se guarda nada**, así que las
casillas siguen intactas. Por la URL normal la regla se cumple sin excepción.

## La puerta discreta

Un botón flotante sin etiqueta (`?`), fijo en la esquina, abre en un
pop-up, un texto largo titulado *Pensamientos de una mente divagante tratando
de organizar todo*. No se mezcla con el resto de la página: se abre encima y
se cierra con la ×, con Escape o tocando fuera.

Está disponible hasta una fecha de cierre, que se fija en `index.html`:

```js
var HISTORIA_HASTA = '2026-08-04T00:00:00-04:00';   // hora de Orlando
```

Hasta ese momento el botón se ve; a partir de ahí desaparece. Si caduca con la página abierta,
el botón desaparece y el pop-up se cierra solo. Dentro del texto hay un aviso
del tiempo que queda.

## Próximamente

Convertir las casillas en "raspaditos" de verdad, para descubrir cada sorpresa
rascando en lugar de pulsando. Stay tuned 🌚

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Se despliega en Vercel como sitio estático de Vite.
