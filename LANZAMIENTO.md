# Gánatelo · poner la tienda en marcha

Todo el producto está montado y probado. Lo que queda son **cuentas que abrir
y variables que pegar**, ninguna requiere tocar código. Una tarde larga.

El orden importa: sin los pasos 1 y 2 la página no puede cobrar, y lo avisa
sola (enseña el formulario de "te mando el enlace de pago por email" en vez
del botón de PayPal).

---

## 0. Ver qué falta en cualquier momento

Abre tu web con `?diag` al final:

```
https://tudominio/demo?diag
```

Sale un panel con una línea por cosa pendiente y el nombre exacto de cada
variable. Los visitantes no lo ven. Úsalo después de cada paso de esta guía
para comprobar que Vercel ha cogido el cambio: si sigue en rojo, es que falta
redesplegar.

## 1. PayPal · 20 minutos

1. Entra en [developer.paypal.com](https://developer.paypal.com) con tu cuenta
   de PayPal. Si es personal, sirve; para cobrar de verdad conviene pasarla a
   **cuenta de empresa** (es gratis y se hace desde el propio PayPal).
2. **Apps & Credentials → Sandbox → Create App**. Copia el *Client ID* y el
   *Secret*.
3. En Vercel: **proyecto → Settings → Environment Variables**, y añade:

   | Variable | Valor |
   |---|---|
   | `PAYPAL_CLIENT_ID` | el Client ID de Sandbox |
   | `PAYPAL_CLIENT_SECRET` | el Secret de Sandbox |
   | `PAYPAL_ENV` | `sandbox` |

4. Redespliega y prueba una compra entera con una cuenta de prueba (las crea
   PayPal solo, en **Sandbox → Accounts**). Mientras estés en sandbox, el total
   lleva una etiqueta rosa que pone *modo pruebas*: es imposible confundirse.
5. Cuando funcione: **Apps & Credentials → Live → Create App**, cambia las tres
   variables por las de Live y pon `PAYPAL_ENV=live`. Redespliega. La etiqueta
   rosa desaparece sola.

> El importe lo pone **siempre el servidor**, nunca el navegador, y al capturar
> el pago se comprueba que lo cobrado coincide con el precio. Aunque alguien
> manipule la página, no puede pagar 0,01 y llevarse el regalo.

## 2. Dónde se guardan los regalos · 5 minutos

En Vercel: **Storage → Create Database → Blob**, conéctalo al proyecto. Vercel
añade `BLOB_READ_WRITE_TOKEN` él solo. Redespliega.

Los regalos y las fotos se guardan como blobs **privados**: no hay URL pública
que adivinar, solo se leen a través de `/api/regalo`, que devuelve lo que ve
ella y nada del comprador.

Sin este paso, en producción la web no deja cobrar (te lo dice en `/api/config`:
`"almacen": "ninguno"`). En local no hace falta: usa la carpeta `.data/`.

## 3. El email con el enlace · 15 minutos, opcional pero recomendado

Sin esto el comprador ve su enlace en pantalla y punto. Si cierra la pestaña
sin copiarlo, te toca rescatarlo a mano desde el panel de pedidos.

1. Cuenta gratis en [resend.com](https://resend.com) (3.000 emails al mes).
2. Verifica un dominio (si aún no tienes, sirve el paso 5 primero).
3. Variables: `RESEND_API_KEY` y `RESEND_FROM` (por ejemplo `hola@ganatelo.app`).

Añade también `CONTACTO_EMAIL` con tu dirección: recibes un aviso por cada
venta y aparece en la página legal. Si no pones Resend, los avisos de venta
siguen llegando por Formspree, que ya estaba montado.

## 4. El panel de ventas · 2 minutos

Pon `ADMIN_TOKEN` con algo largo y aleatorio (`openssl rand -hex 24`). Después:

```
https://tudominio/api/pedidos?token=TU_TOKEN            lista de ventas e ingresos
https://tudominio/api/pedidos?token=TU_TOKEN&id=abc123  una venta concreta
https://tudominio/api/pedidos?token=TU_TOKEN&limpiar=1  borra borradores viejos
```

## 5. Dominio propio · 30 minutos

`ganatelo.app` o el que esté libre. Se compra en Namecheap o Porkbun (unos
15 €/año) y se conecta en **Vercel → Settings → Domains**.

La portada del dominio nuevo ya apunta a la página de venta: en `vercel.json`
hay una regla que manda `/` a `/demo` cuando el dominio empieza por `ganatelo`.
Si eliges otro nombre, cambia esa regla. Mientras tanto, la dirección de venta
es `/demo`, y `/comprar` también vale.

Actualiza entonces `GANATELO_URL` (con el dominio nuevo), el `<link rel=canonical>`
de `demo.html` y las URL de `public/sitemap.xml` y `public/robots.txt`.

## 6. Permiso para las caras · antes de publicar nada

- La cara que sale por defecto en la demo es un **dibujo**, no una persona
  real: `public/cara-demo.png`, generado por `dev/imagenes.mjs`. Ya no hace
  falta pedir permiso a nadie para enseñar la página.
- Para los vídeos sí necesitas una cara real con permiso: la de tu pareja si
  ella lo autoriza por escrito, o la de alguien que quiera salir.
- La foto de `cara-juego.png` sigue en el repo porque la usa la web personal.

## 7. Hacienda · una hora con un gestor

Cobrando directamente con PayPal **tú eres quien vende**, no una plataforma
intermediaria. Eso cambia lo que decía el plan original:

- **Alta censal (modelo 036/037) antes de la primera venta.** Gratis, por
  internet.
- **El IVA es tuyo.** Vendiendo servicios digitales a consumidores de la UE se
  aplica el IVA del país del comprador, y eso se declara por la **ventanilla
  única (OSS)**. Hasta 10.000 € anuales de ventas a otros países de la UE
  puedes aplicar el IVA español y ahorrarte el OSS.
- Fuera de la UE cada país tiene sus reglas; con volumen pequeño no suele haber
  obligación, pero pregúntalo.
- **Autónomos (RETA):** en cuanto las ventas sean regulares. En pluriactividad
  hay bonificaciones.

Si esto te frena, la alternativa es volver a un *Merchant of Record* (Lemon
Squeezy o Paddle): se quedan un 5 % y gestionan todos los impuestos por ti. El
código de pago está aislado en `api/_lib/paypal.mjs`, así que cambiarlo más
adelante es un archivo, no una reescritura.

*No soy asesor fiscal: esto es el mapa, no el consejo.*

---

## Las dos primeras semanas

**Semana 0 · antes de publicar.** Hazte tres regalos de verdad, con tu propio
dinero, y mándaselos a tres personas distintas: alguien que juegue bien,
alguien que juegue mal y alguien de más de 50 años. Mira **cuánto tardan en
sacar el primer premio**. Si alguien se atasca, baja los umbrales o usa la
dificultad fácil por defecto. Ese dato vale más que cualquier opinión.

**Semana 1 · diez vídeos, cero euros en anuncios.** Los cuatro guiones están en
`CONCEPTO.md`, sección 6. El más importante es el **C · reacción**: alguien
recibiendo el regalo y jugando, sin explicar nada. Publica uno o dos al día en
TikTok y Reels. No pagues por anuncios hasta que un vídeo pase del 40 % de
retención: hasta entonces estarías pagando por amplificar algo que no engancha.

**Semana 2 · mira los números, no las impresiones.** En Vercel Analytics:
cuántos llegan a `/demo`, cuántos suben una foto, cuántos pagan. El paso que
más gente pierde te dice qué arreglar:

| Dónde se caen | Qué significa | Qué tocar |
|---|---|---|
| No llegan a la demo | el vídeo no engancha | el primer segundo del vídeo |
| Llegan pero no suben foto | no entienden qué compran | el titular y el paso 1 |
| Suben foto y no pagan | dudan del precio o de la confianza | el precio, las garantías, el FAQ |
| Pagan y no comparten | el regalo no emociona | los premios sugeridos, el mensaje |

**Precio.** Empieza en 4,99 USD. Con diez ventas, cambia `GANATELO_PRECIO` a
9,99 durante una semana y compara la conversión: si vendes más de la mitad que
antes, ganas más dinero. Es una variable de entorno, se cambia en un minuto y
sin desplegar código.

**La escalera, cuando funcione.** 4,99 básico · 9,99 con más premios y una
tarjeta imprimible para entregarlo en mano · 14,99 el pack picante. La base ya
está: la dificultad y el número de premios (hasta cinco) son configurables.

## Lo que más va a mover la aguja

1. **Que el primer premio caiga en menos de un minuto.** El juego ya empieza
   fácil y se endurece solo, pero verifícalo con gente real (semana 0).
2. **El vídeo de reacción.** Es el que vende. Los otros tres son relleno hasta
   que tengas uno bueno.
3. **Que el comprador comparta su enlace.** Cada regalo lleva al pie "Hecho con
   Gánatelo · Haz uno para alguien": es tu canal gratis. Míralo en Analytics
   con el parámetro `?desde=regalo`.

## Qué falta por construir (cuando haya ventas, no antes)

- Que el comprador pueda editar sus premios él mismo con un enlace privado.
- Más de un juego: ahora solo hay uno. Un segundo juego duplica el catálogo sin
  cambiar el embudo.
- Recordatorio por email a los 11 meses: "el año que viene toca otra vez".
