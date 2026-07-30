# Mariapnel 🌚

Cuenta atrás para el cumpleaños de Mariapnel 🌚 — **25 de agosto**, hora de Orlando, Florida.

Fondo negro, ondas de sonido y un emblema giratorio de "distancia y tiempo" con su foto en el centro.

## Qué hay ahora

- Contador en vivo de días (y horas : minutos : segundos) hasta el 25/08
- Emblema giratorio (círculo de flechas "Distancia y Tiempo") con la foto de Mariapnel 🌚 en el centro
- Botón **"Presiona para desbloquear sorpresas 🌚"** con la misión provisional
- Formulario para apuntar fechas disponibles del 24 de diciembre al 8 de enero,
  que quedan visibles de forma permanente en la página
- Las fechas se guardan en el navegador (`localStorage`) y, si Formspree está
  configurado, se envían también por email

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

## Próximamente

Calendario estilo adviento con 7 casillas "raspadito" / cajas sorpresa, una por cada día de la semana previa al cumpleaños. Stay tuned 🌚

## Desarrollo local

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Se despliega en Vercel como sitio estático de Vite.
