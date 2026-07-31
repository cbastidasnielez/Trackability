# Mariapnel 🌚

Cuenta atrás para el cumpleaños de Mariapnel 🌚 — **25 de agosto**, hora de Orlando, Florida.

Fondo negro, ondas de sonido y un emblema giratorio de "distancia y tiempo" con su foto en el centro.

## Qué hay ahora

- Contador en vivo de días (y horas : minutos : segundos) hasta el 25/08
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
`index.html`:

```js
var SORPRESAS = [
  { titulo: 'Casilla 01', texto: 'Lo que quieras contarle aquí 🌚' },
  ...
];
```

Si una casilla llega a su día con el texto vacío, se abre igual y dice que la
sorpresa está en camino.

## Próximamente

Convertir las casillas en "raspaditos" de verdad, para descubrir cada sorpresa
rascando en lugar de pulsando. Stay tuned 🌚

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Se despliega en Vercel como sitio estático de Vite.
