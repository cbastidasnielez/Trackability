# Mariapnel 🐧

Cuenta atrás para el cumpleaños de Mariapnel 🐧 — **25 de agosto**, hora de Orlando, Florida.

Temática polar sobre fondo negro: nieve cayendo en toda la página, casillas
escarchadas hasta que llega su día, un pingüino sobre el hielo en el ahorcado y
la bola del 8 convertida en bola de nieve. Más las ondas de sonido y el emblema
giratorio de "distancia y tiempo" con su foto en el centro.

## Qué hay ahora

- Dos contadores en vivo (días y horas : minutos : segundos): el cumpleaños
  (25/08) y el reencuentro, que apunta al aterrizaje en Orlando del 26/12 a
  las 19:10 (`ENCUENTRO` en `index.html`), con los sábados que quedan por
  delante — el 26/12/2026 cae precisamente en sábado, así que el último que
  cuenta es el del reencuentro
- Emblema giratorio (círculo de flechas "Distancia y Tiempo") con la foto de Mariapnel 🐧 en el centro
- Botón **"Presiona para desbloquear sorpresas 🐧"** con la misión provisional
- Botón **"Quiero entrenar 🐧"**, que lleva a `/entrenar`: su plan semanal
  con checklist (ver más abajo)
- **La carta**: el sobre que mandó desde Orlando, ya entregado en Barcelona
  (ver más abajo)
- **`/demo`** (también `/?test`): la demo del producto comercial, un juego
  con la cara de tu pareja y premios por puntos. No forma parte del regalo.
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

Se abre una por día, del **18 al 24 de agosto de 2026** (los 7 días previos al
cumpleaños). Antes de su día la casilla sale con candado y no se puede pulsar;
una vez pasada la fecha se queda abierta para siempre.

El año va **fijo** en la constante `TEMPORADA`. Antes se calculaba con
`nextBirthday()` y eso tenía un fallo: al pasar el 25 de agosto las fechas
saltaban al año siguiente y las siete casillas volvían a cerrarse.

Para escribir el contenido de cada una, rellena el array `SORPRESAS` de
`index.html`. Además de `titulo` y `texto`, una casilla admite `audio` (monta un
reproductor), `criticas` (reseñas al estilo cartel de cine), `recuerdos`
(tira de fotos con visor), `regalo` (tarjeta regalo), `juego` (el minijuego
con premio) y `nota` (una línea en cursiva al final):

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
    ],
    // tira de fotos al pie del bloque, con visor al tocarlas
    recuerdos: { pie: '...', imagenes: ['/recuerdo-1.jpg', '/recuerdo-2.jpg'] }
  },
  ...
];
```

Si una casilla llega a su día con el texto vacío, se abre igual y dice que la
sorpresa está en camino.

## El juego de la casilla 03

Un *flappy* en `<canvas>`, sin librerías: la cara de ella vuela entre columnas
y a los **10 puntos** se desbloquea un vale de masaje imprimible. La partida
**no se detiene al llegar a la meta** (`seguirTrasMeta`): el vale aparece
debajo y los puntos siguen subiendo.

```js
juego: { objetivo: 10, sprite: '/cara-juego.png', respaldo: '/mariapnel.jpeg' }
```

- **El vale se emite una sola vez.** Se guarda en `localStorage` con su fecha
  de emisión; volver a ganar no crea otro ni cambia la fecha, solo recuerda que
  ya lo tiene. Nunca aparecen dos vales a la vez.
- **Enviar por correo** abre el cliente de email con el vale en texto, por si no
  hay impresora a mano.
- **Imprimir el vale** copia solo el vale a `#printArea` y llama a
  `window.print()`. La hoja de estilos de impresión apaga el resto de la
  página y el degradado de fondo, para que salga en claro y sin gastar tinta.

## Página de visitantes

`/juego.html` es una página independiente con el juego y nada más: sirve para
compartirlo sin enseñar las sorpresas. No contiene ni la carta, ni la tarjeta
regalo, ni las reseñas — no están escondidas, es que no están en su código.
En Vercel responde también en `/juego`.

El juego vive en `public/flappy.js` (`window.crearFlappy`) y lo usan las dos
páginas. En la casilla 03 va con meta de 10 puntos y premio; en la de
visitantes va sin meta, jugando a batir el récord (guardado en `localStorage`).

## El candado (casilla 07)

Cuatro ruedas con cuatro fechas de su historia: **24 · 25 · 26 · 2013**. Al
abrirlo aparecen los tres días seguidos, la carta de despedida, seis fotos con
visor más un marco vacío para la de diciembre, y un raspadito con el mensaje
final. Queda abierto para siempre
(`candado-abierto` en `localStorage`).

El raspadito es un `<canvas>` con `destination-out`: se borra con el dedo y a
partir del 50% descubierto se retira solo.

```js
candado: {
  cifras: [{ valor: 24, min: 1, max: 31, inicio: 1, pista: '...' }, ...],
  animo: ['...'],                       // lo que dice al fallar
  seguidilla: { numeros: ['24','25','26'], texto: '...' },
  carta: ['...'],                       // el último párrafo sale en cursiva
  fotos: ['/nosotros-1.jpg', ...],
  marcoVacio: { fecha: '26/12', etiqueta: 'Pendiente', pie: '...' },
  rasca: { pie: 'Una cosa más', texto: '...' }
}
```

## La bola del 8 (casilla 06)

Ella elige cómo se siente entre seis emociones y la bola le devuelve un
versículo con su reflexión. Cada emoción guarda **tres respuestas** y se sortea
una al azar, evitando repetir la anterior, así que puede volver cuando quiera.
Es el único bloque en morado (`--morado`), su color.

```js
bola: {
  pregunta: '¿Cómo está tu alma hoy?',
  emociones: [
    { id: 'triste', icono: '🌧️', nombre: 'Triste', respuestas: [
      { cita: '...', ref: 'Salmo 56:8', nota: '...' }, ...
    ] }, ...
  ]
}
```

## El ahorcado de la casilla 05

Mismo juego de siempre, pero en vez del muñeco hay **un pingüino sobre un
témpano que se rompe**: seis trozos, y cuando se acaba el hielo el pingüino
cae al agua y se pierde la partida. La palabra es `VINILO`: dice el formato del regalo de cumpleaños pero no el
disco, así que el *AM* sigue siendo sorpresa hasta el día 25.

```js
ahorcado: { palabra: 'VINILO', pista: '...', vidas: 6, derrotasMax: 5,
            alGanar: '...', alAgotarse: '...' }
```

A las **5 derrotas** la casilla se cierra: desaparece el teclado y queda solo el
mensaje, para siempre. Si acierta, la palabra se queda a la vista y ya no se
vuelve a jugar. Todo en `localStorage` (`ahorcado-estado`).

## Nota sobre la tarjeta regalo

La casilla 04 lleva el código de una tarjeta regalo. Aunque se descubra al
tocarlo, **está en el código fuente de la página**: cualquiera con la URL
podría canjearlo. La web lleva `noindex` para que no aparezca en buscadores,
pero si prefieres no exponerlo, borra el campo `codigo` (y `enlace`) del
objeto `regalo` y pásaselo por privado.

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
rascando en lugar de pulsando. Stay tuned 🐧

## Maktub

Sección fija antes de la del pingüino: la palabra en árabe, su traducción y el
recuento de coincidencias de la historia — 2013, Lechería y Valera, el parque de
Orlando en 2022, el 24-25-26, el disco de ese mismo año y el 26 de diciembre en
sábado. Cierra matizando que maktub no es esperar sentado: lo escrito no ocurre
hasta que alguien da el paso.

## Por qué un pingüino

Al final de la página hay una sección fija que explica el motivo: los pingüinos
de Magallanes y de Adelia se emparejan de por vida, vuelven al mismo nido
temporada tras temporada y esperan a la misma pareja — no por romanticismo,
sino porque volver con quien ya te conoce ahorra el trabajo de empezar de cero.
Es la idea que sostiene toda la web, así que va escrita, no solo insinuada.

## La carta

Mariapnel 🐧 mandó una carta por USPS desde Orlando. La seguimos desde el 12
de septiembre de 2026 y llegó a Barcelona el 24. La sección **"La carta llegó
a Barcelona"** (en la portada, `<section class="carta">`) la deja como
recuerdo:

- La ruta al revés que la del vuelo, **MCO → BCN**, ya recorrida: línea
  continua y el sobre quieto sobre Barcelona.
- El sello y el número de seguimiento, `LH276353799US`, con la marca
  "Entregada · 24 sep".
- Los 12 días que estuvimos siguiéndola.

Es estática: ya no hay enlaces de rastreo, botón de copiar ni consulta a la
API de USPS. La función `api/carta.mjs` se borró; está en el historial de git
por si algún día llega otra carta.

## Quiero entrenar

`/entrenar.html` (en Vercel también `/entrenar`) es la página del plan de
entrenamiento, el *Manual de cuerpa para que Carlos te coma*. Se llega desde
el botón **"Quiero entrenar 🐧"** de la portada.

- Siete pestañas, una por día (L a D), con el día de hoy marcado y un anillo
  de progreso en cada una. Al entrar se abre el día actual.
- Cada día muestra su rutina como checklist: lunes (jalón), martes (pilates),
  miércoles (empuje), jueves (descanso activo), viernes (glúteo + tren
  superior + core, en tres bloques), sábado (Hyrox) y domingo (descanso).
- Botones **"Marcar todo el día"** y **"Reiniciar día"**, y un contador
  semanal (días hechos / 7).
- Lo marcado se guarda en el navegador por semana (`entreno-<lunes>` en
  `localStorage`). Cada lunes la lista empieza limpia; las semanas anteriores
  quedan guardadas por si algún día se quieren consultar.
- El sábado menciona la guía *Hyrox Weekends*. El enlace va en `HYROX_URL`
  dentro de `entrenar.html`: ahora está vacío, y mientras lo esté el sábado
  lo nombra sin enlazar.

El plan vive en `PLAN` dentro de `entrenar.html`. Para cambiar un ejercicio
basta con editar ahí el texto; no hay nada más que tocar.

## Gánatelo: el producto que se vende (`/demo`, `/r/<id>`, `/legal`)

Aparte del regalo personal, este repositorio contiene una tienda completa.
Se vende un regalo digital: un juego con la cara de alguien en el que cada
puntuación desbloquea un premio que elige quien lo regala. Pago único con
PayPal y entrega inmediata.

**Cómo ponerla en marcha está en [`LANZAMIENTO.md`](LANZAMIENTO.md)**: qué
cuentas abrir y qué variables pegar en Vercel. El concepto de negocio, los
guiones de vídeo y el plan de precios siguen en `CONCEPTO.md`.

### Las tres páginas

- **`/demo`** (también `/comprar`) es la página de venta. El comprador sube la
  foto, escribe hasta cinco premios y un mensaje, prueba el juego con esa cara
  y paga ahí mismo. La foto se recorta en su navegador y no sale de su móvil
  hasta que paga.
- **`/r/<id>`** es el regalo: lo que abre quien lo recibe. Portada con su
  nombre y el de quien se lo manda, el juego con su cara, los premios
  escondidos que se van descubriendo y el mensaje final cuando los tiene todos.
  Lleva `noindex` y el id son 12 caracteres aleatorios.
- **`/legal`** es la política de privacidad, las condiciones, los reembolsos y
  el formulario de contacto.

### Cómo funciona el cobro

1. `POST /api/pedido/crear` guarda lo que el comprador configuró como borrador
   y crea la orden en PayPal. **El importe lo pone el servidor**, nunca el
   navegador.
2. El comprador aprueba el pago en el botón de PayPal.
3. `POST /api/pedido/capturar` cobra de verdad, comprueba que el importe
   coincide con el precio, publica el regalo y borra el borrador. Es
   idempotente: capturar dos veces devuelve el mismo enlace, no cobra dos
   veces.
4. El enlace aparece en pantalla, con botón de copiar y de mandarlo por
   WhatsApp, y también por email si Resend está configurado.

Las demás funciones: `GET /api/config` (lo que la página necesita saber:
precio, client id de PayPal, si se puede cobrar), `GET /api/regalo?id=` (el
regalo, sin ningún dato del comprador) y `GET /api/pedidos` (tu panel de
ventas, protegido con `ADMIN_TOKEN`).

### Por qué no sale el botón de pago

Abre la página de venta con `?diag` al final (`/demo?diag`) y aparece un panel
que dice exactamente qué falta: las credenciales de PayPal, el store de Blob,
el email del comprador y el de contacto, con el nombre de cada variable. Los
visitantes no lo ven, solo quien pone `?diag` a mano.

**Si falta algo, la página no se rompe.** Sin PayPal configurado, o si el
script de PayPal no carga en el navegador del visitante, el checkout se
sustituye por el formulario de siempre: el pedido llega por email y el enlace
de pago se manda a mano.

### Dónde se guarda

En Vercel Blob, como blobs **privados** (no hay URL pública que adivinar):
`borradores/` lo que se configuró antes de pagar, `regalos/` lo que ve quien
recibe el enlace, y `pedidos/` los datos de la venta, que no se exponen nunca.
En local, sin token de Blob, todo va a la carpeta `.data/`.

### Los momentos grandes

`public/revelar.js` (`window.crearRevelador`) son las dos pantallas que
justifican el producto, y las comparten la demo y el regalo:

- **El premio.** Al ganarlo, el juego se **pausa** y ocupa toda la pantalla:
  "Premio 1 de 3", el texto en grande, confeti y vibración. Antes era un aviso
  pequeño y una línea en una lista debajo del lienzo, o sea, fuera de donde
  ella estaba mirando.
- **El final.** Cuando los tiene todos, el mensaje de quien se lo regala se
  **escribe letra a letra**, con su cara arriba y la firma al terminar. Es el
  cierre emocional del regalo, no un párrafo más de la página.
- **Reclamarlo.** Cada premio lleva un botón que abre WhatsApp con el texto
  ya escrito ("Acabo de desbloquear: … ¿Cuándo me lo cobras?"). No sabemos el
  teléfono de quien lo regala, así que ella elige el contacto. Convierte un
  premio escrito en una conversación de verdad.

Respeta `prefers-reduced-motion`: sin animaciones ni texto que se escribe solo.

### El juego

`public/flappy.js` lo comparten las cuatro páginas. Para el producto ganó estas
opciones, todas apagadas por defecto para no cambiar la web personal:

- `suave: true` — dificultad progresiva. Empieza con los huecos anchos y lento,
  y a los 12 puntos ya es el juego de siempre. Así el primer premio cae en
  menos de un minuto incluso para quien no ha jugado nunca. Además, medio
  segundo de gracia tras perder, para que un toque por inercia no reinicie.
- `efectos: true` — estrellas de fondo, marcador grande y chispas al puntuar.
- `sonido: true` — pitidos sintetizados con WebAudio (sin archivos) y botón
  para silenciar, que recuerda la elección.
- `objetivos: [5, 10, 15]` — pinta en el lienzo una barra con lo que falta
  para el siguiente premio. Cada punto se nota, en lugar de ser un número que
  sube.
- **Que no se rinda.** Al perder, la pantalla dice cuánto faltaba: quedarse a
  un punto duele, y decirlo en voz alta hace que lo intente otra vez. Y a
  partir de la tercera derrota seguida sin llegar al premio, el juego se
  ablanda solo hasta un tope, avisándolo. Un regalo que no se puede abrir no
  es un regalo.
- `pausar()` y `reanudar()` en `caja.juego`, para congelarlo mientras se
  enseña el premio.

### El modo arcade

`arcade: true` enciende de golpe la capa que hace que se pueda jugar para
siempre. La usan el regalo y la demo; la web personal no, así que su juego
es exactamente el de antes.

- **Zonas.** Cada 10 puntos cambia la paleta entera (cielo, columnas, polvo) y
  se anuncia el nombre: Noche, Amanecer, Hielo, Selva, Tormenta, Espacio, Oro.
  Después vuelve a empezar, así que la novedad no se acaba nunca. Entrar en una
  zona da 3 monedas.
- **Perfectos y rachas.** Pasar por el centro del hueco es un «perfecto» y da
  una moneda; encadenar tres o más da dos. Es la capa de habilidad: el mismo
  juego tiene algo que mejorar cuando ya te lo sabes.
- **Monedas y escudos.** Aparecen flotando, a veces pegados al borde del hueco,
  así que recogerlos es una decisión. El escudo aguanta un choque.
- **Seguir tras perder.** Con monedas suficientes (10 por defecto,
  `costoRevivir`) sale un botón para continuar en el sitio, con un momento de
  invulnerabilidad. Es lo que convierte «he perdido» en «una más».
- **El récord.** Con `record`, el juego avisa cuando está a dos puntos de
  batirlo y lo celebra al hacerlo.
- **Adornos.** Temblor de pantalla al chocar, estela detrás de la cara, textos
  que suben y se desvanecen.

La página del regalo guarda monedas y medallas por regalo en `localStorage`, y
tiene su propio medallero: Bronce a los 10 puntos, Plata a los 25, Oro a los 50
y Leyenda a los 100. Son las metas que quedan cuando ya tiene todos los
premios, y por eso el juego no se acaba con el regalo.

La sonda de pruebas (`window.__juego`) va con `depurar`. En la página del
regalo solo se activa sirviendo desde `localhost`: en el regalo de verdad
permitiría saltarse el juego y desbloquear los premios sin jugar.

### Probarlo entero sin PayPal

Hay un PayPal de mentira para no depender de credenciales:

```bash
node dev/paypal-falso.mjs &          # en otra terminal
npm run dev
node dev/prueba-flujo.mjs http://localhost:5173
```

Con `PAYPAL_API_BASE=http://127.0.0.1:9911` en `.env.local` (copia
`.env.example`). `dev/prueba-flujo.mjs` comprueba las diez cosas que importan:
que rechaza pedidos incompletos, que el regalo no existe antes de pagar, que
capturar dos veces no duplica nada, que el regalo no filtra el email del
comprador y que el panel exige token.

`node dev/pantallazos.mjs <base> <enlace-regalo> <carpeta>` abre las páginas en
Chromium, avisa de errores de consola y guarda capturas.
`node dev/imagenes.mjs` regenera la cara de la demo y las imágenes de
previsualización para redes.

`npm run dev` también sirve las funciones de `/api` y aplica las rutas de
`vercel.json`, así que lo que ves en local es lo que se despliega.

## Analíticas

Vercel Web Analytics, vía `@vercel/analytics`. La llamada a `inject()` vive en
`src/analytics.js` y las cuatro páginas la cargan como módulo aparte, para no tocar
sus scripts clásicos. En local no envía nada.

Hay que activarlo una vez en el panel: **proyecto → Analytics → Enable**. Sin
ese paso el script se carga pero no se registra ninguna visita.

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Se despliega en Vercel como sitio estático de Vite.
