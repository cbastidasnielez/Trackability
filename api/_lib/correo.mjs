/**
 * Avisos por email.
 *
 *  - Al comprador: el enlace del regalo. Sale por Resend si existen
 *    RESEND_API_KEY y RESEND_FROM (un remitente de un dominio verificado).
 *    Sin eso no se envía nada: el comprador ve el enlace en pantalla igual.
 *  - A ti: un aviso por cada venta, por Resend (si hay CONTACTO_EMAIL) o,
 *    si no, por Formspree, que ya estaba montado.
 *
 * Nunca lanzan: un fallo de email no puede estropear una venta ya cobrada.
 */

import { MARCA, CONTACTO, FORMSPREE_ID, formatearPrecio } from './producto.mjs';

const RESEND_KEY = process.env.RESEND_API_KEY || '';
const RESEND_FROM = process.env.RESEND_FROM || '';

export function correoCompradorActivo() {
  return !!(RESEND_KEY && RESEND_FROM);
}

async function resend(mensaje) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { authorization: `Bearer ${RESEND_KEY}`, 'content-type': 'application/json' },
    body: JSON.stringify({ from: `${MARCA} <${RESEND_FROM}>`, ...mensaje })
  });
  if (!r.ok) throw new Error(`resend ${r.status}: ${await r.text()}`);
}

function escapar(t) {
  return String(t).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export async function avisarComprador({ email, ella, de, enlace }) {
  if (!correoCompradorActivo() || !email) return false;
  try {
    const asunto = `Tu regalo para ${ella} ya está listo 🎁`;
    const texto =
`Hola${de ? ' ' + de : ''},

El regalo para ${ella} ya está montado. Este es el enlace que tienes que mandarle:

${enlace}

Guárdalo: funciona para siempre y es el único que existe. Mándaselo cuando quieras: a medianoche, en la cena, escondido en una nota.

Si quieres cambiar un premio o el mensaje, responde a este correo.

${MARCA}`;
    const html =
`<div style="font-family:Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#111">
  <p style="font-size:11px;letter-spacing:.3em;text-transform:uppercase;color:#a67c2e">${escapar(MARCA)}</p>
  <h1 style="font-family:Georgia,serif;font-weight:400;font-size:24px">El regalo para ${escapar(ella)} ya está listo</h1>
  <p>Este es el enlace que tienes que mandarle:</p>
  <p style="margin:22px 0"><a href="${escapar(enlace)}" style="display:inline-block;background:#e3c07a;color:#0b0b0b;text-decoration:none;padding:14px 22px;border-radius:999px;font-size:13px;letter-spacing:.2em;text-transform:uppercase">Abrir el regalo</a></p>
  <p style="font-size:13px;color:#555;word-break:break-all">${escapar(enlace)}</p>
  <p>Guárdalo: funciona para siempre y es el único que existe. Mándaselo cuando quieras: a medianoche, en la cena, escondido en una nota.</p>
  <p style="font-size:13px;color:#555">Si quieres cambiar un premio o el mensaje, responde a este correo.</p>
</div>`;
    await resend({ to: [email], subject: asunto, text: texto, html, reply_to: CONTACTO || undefined });
    return true;
  } catch (e) {
    console.error('email comprador', e.message);
    return false;
  }
}

export async function avisarVenta(pedido) {
  const resumen = {
    _subject: `Venta ${MARCA} · ${formatearPrecio(pedido.importe, pedido.moneda)} · ${pedido.ella}`,
    id: pedido.id,
    enlace: pedido.enlace,
    comprador: pedido.email,
    de: pedido.de,
    ella: pedido.ella,
    ocasion: pedido.ocasion,
    premios: (pedido.premios || []).map((p) => `${p.puntos} pts · ${p.texto}`).join('\n'),
    mensaje: pedido.mensaje,
    importe: `${pedido.importe} ${pedido.moneda}`,
    paypal_orden: pedido.paypal?.ordenId,
    paypal_captura: pedido.paypal?.capturaId,
    pagador: pedido.paypal?.pagador?.email,
    entorno: pedido.entorno,
    fecha: pedido.pagadoEn
  };

  try {
    if (RESEND_KEY && RESEND_FROM && CONTACTO) {
      const cuerpo = Object.entries(resumen).filter(([k]) => k !== '_subject').map(([k, v]) => `${k}: ${v ?? ''}`).join('\n');
      await resend({ to: [CONTACTO], subject: resumen._subject, text: cuerpo });
      return true;
    }
    if (FORMSPREE_ID) {
      const r = await fetch(`https://formspree.io/f/${FORMSPREE_ID}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(resumen)
      });
      return r.ok;
    }
  } catch (e) {
    console.error('aviso venta', e.message);
  }
  return false;
}
