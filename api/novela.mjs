/**
 * La novela "de Wattpad": el capítulo solo se sirve durante su ventana de
 * 48 horas. Fuera de ella responde { disponible: false } y el texto no sale
 * del servidor, así que pasada la fecha no queda ni en el código de la página.
 */

import { json, soloMetodo } from './_lib/http.mjs';
import { CAPITULO } from './_lib/novela.mjs';

// Se abre en esta fecha y hora (horario de Orlando) y se cierra sola 48 horas
// después. Para moverla, basta con cambiar DESDE.
const DESDE = '2026-10-13T16:45:00-04:00';
const DURACION = 48 * 3600 * 1000;

const inicio = new Date(DESDE).getTime();
const fin = inicio + DURACION;
const HASTA = new Date(fin).toISOString();

/** Markdown sencillo → bloques que la página pinta con textContent. */
function bloques(md) {
  const salida = [];
  let titulo = '';
  for (const trozo of md.trim().split(/\n\s*\n/)) {
    const linea = trozo.trim();
    if (!linea) continue;
    if (linea.startsWith('## ')) salida.push({ t: 'h', x: linea.slice(3) });
    else if (linea.startsWith('# ')) titulo = linea.slice(2);
    else if (/^[⸻—–-]{1,3}$/.test(linea)) salida.push({ t: 'sep' });
    else salida.push({ t: 'p', x: linea.replace(/\s*\n\s*/g, ' ') });
  }
  return { titulo, bloques: salida };
}

const capitulo = bloques(CAPITULO);

export default function handler(req, res) {
  if (!soloMetodo(req, res, 'GET')) return;

  const ahora = Date.now();
  if (ahora < inicio || ahora >= fin) return json(res, 200, { disponible: false });

  return json(res, 200, {
    disponible: true,
    hasta: HASTA,
    titulo: capitulo.titulo,
    bloques: capitulo.bloques
  });
}
