/**
 * Prueba de punta a punta del cobro, contra el PayPal falso y el almacén local:
 * crea un pedido, lo captura, lee el regalo y comprueba el panel de admin.
 *
 *   node dev/prueba-flujo.mjs http://localhost:5173
 */
const BASE = process.argv[2] || 'http://localhost:5173';
const cara = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

async function api(ruta, opciones) {
  const r = await fetch(BASE + ruta, { headers: { 'content-type': 'application/json' }, ...opciones });
  return { estado: r.status, datos: await r.json() };
}

function comprobar(cond, msg) { if (!cond) { console.error('FALLO:', msg); process.exit(1); } console.log('ok  ', msg); }

const cfg = await api('/api/config');
comprobar(cfg.estado === 200 && cfg.datos.listo, 'config lista para cobrar');

const malo = await api('/api/pedido/crear', { method: 'POST', body: JSON.stringify({ email: 'x', premios: [], cara: 'no' }) });
comprobar(malo.estado === 400 && malo.datos.campos.includes('email') && malo.datos.campos.includes('cara'), 'rechaza un pedido incompleto');

const pedido = { cara, premios: ['Un masaje', 'Una cena', '<b>xss</b>'], mensaje: 'Te lo has ganado', ella: 'Ana', de: 'Luis', email: 'luis@ejemplo.com', ocasion: 'Cumpleaños', dificultad: 'facil', derechoFoto: true };
const creado = await api('/api/pedido/crear', { method: 'POST', body: JSON.stringify(pedido) });
comprobar(creado.estado === 200 && creado.datos.ordenId && creado.datos.id, 'crea la orden ' + creado.datos.ordenId);

const antes = await api('/api/regalo?id=' + creado.datos.id);
comprobar(antes.estado === 404, 'el regalo no existe antes de pagar');

const cap = await api('/api/pedido/capturar', { method: 'POST', body: JSON.stringify({ ordenId: creado.datos.ordenId }) });
comprobar(cap.estado === 200 && cap.datos.enlace.endsWith('/r/' + creado.datos.id), 'captura y devuelve el enlace ' + cap.datos.enlace);

const otra = await api('/api/pedido/capturar', { method: 'POST', body: JSON.stringify({ ordenId: creado.datos.ordenId }) });
comprobar(otra.estado === 200 && otra.datos.repetido && otra.datos.enlace === cap.datos.enlace, 'capturar dos veces devuelve el mismo enlace');

const regalo = await api('/api/regalo?id=' + creado.datos.id);
comprobar(regalo.estado === 200 && regalo.datos.ella === 'Ana' && regalo.datos.premios.length === 3 && regalo.datos.premios[0].puntos === 3, 'el regalo se lee con umbrales fáciles');
comprobar(!('email' in regalo.datos), 'el regalo no expone el email del comprador');

const sinToken = await api('/api/pedidos');
comprobar(sinToken.estado === 401, 'el panel exige token');
const panel = await api('/api/pedidos', { headers: { authorization: 'Bearer prueba' } });
comprobar(panel.estado === 200 && panel.datos.pedidos.some((p) => p.id === creado.datos.id && p.email === 'luis@ejemplo.com'), 'el panel lista la venta');

console.log('\nTODO OK · regalo en', cap.datos.enlace);
