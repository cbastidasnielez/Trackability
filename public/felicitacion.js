/* Mensajes con fecha para Mari, con su firma de "leído".
   Lo usan /entrenar (se abre al completar ese día) y la portada (avisa
   desde el día siguiente si aún no lo ha firmado). Todo vive aquí: el
   texto, la tarjeta, la firma con el dedo y el aviso por correo.

   window.Felicita:
     .mensaje(fecha)            el mensaje de ese día ('AAAA-MM-DD') o null
     .firma(fecha)              lo guardado al firmar, o null
     .tarjeta(fecha, variante)  la tarjeta ('entreno' o 'portada')
     .abrir(fecha, variante)    la tarjeta en grande, por encima de todo
     .pendiente(hoy)            el primer mensaje ya pasado y sin firmar
   Al firmar se lanza el evento 'felicita:firmada' en document. */
(function () {
  // el mismo formulario que las fechas de la portada: te llega un correo
  var FORMSPREE_ID = 'xzdnwwqa';
  var CLAVE = 'felicitacion-firmada-';
  var PACTO = 'He leído este mensaje, lo he entendido y lo guardaré en mi corazón.';

  var MENSAJES = {
    '2026-11-23': {
      titulo: '¡Lunes completado, Mari!\u00a0🐧',
      texto: [
        'Hoy, 23 de noviembre, lo has hecho todo. Empezar la semana así dice mucho de ti, y me encanta verlo.',
        'Ahora te toca el trabajo: que tengas un día bonito, que todo te salga fácil y que te sobren motivos para sonreír. Feliz lunes, Pinguina.'
      ],
      // en la portada, si no lo vio el día: no dice que completó el entreno
      portada: {
        titulo: 'Un mensaje que te dejé el lunes\u00a0🐧',
        texto: [
          'Lo guardé para cuando terminaras el entreno del lunes 23 de noviembre, pero no quería que te lo perdieras. Va con un deseo que sigue valiendo cualquier día: que el trabajo te trate bonito y que te sobren motivos para sonreír.'
        ]
      },
      reflexion: [
        'Todo el mundo te dirá qué es el éxito: una casa, un carro, vivir sola, ganar dinero, tener buen cuerpo. Erich Fromm, psicólogo y filósofo, vio la trampa que hay ahí: «Si yo soy lo que tengo, y si lo que tengo se pierde, ¿quién soy entonces?». Todo eso se puede tener y se puede perder. Lo que eres, no.',
        'Mucho antes, Jesús lo dijo a su manera: no acumules tesoros en la tierra, donde la polilla y el óxido los destruyen, «porque donde esté tu tesoro, allí estará también tu corazón» (Mateo 6:21). La riqueza de verdad no se guarda en una casa ni en una cuenta: se guarda en el corazón.',
        'Por eso no entrenas solo para tener un cuerpo, ni trabajas solo para tener cosas: lo haces para ser. Y ser no se termina nunca. Cada día se puede ser un poco más paciente, más valiente, más generosa, más tú; Carl Rogers lo llamaba «convertirse en persona». Ese es el éxito de verdad, y por eso vale la pena seguir mejorando: no para que el mundo te aplauda, sino para llegar a ser quien quieres ser.'
      ],
      // bajo la casilla de la firma
      eco: 'Como María, que «guardaba todas estas cosas, meditándolas en su corazón» (Lucas 2:19).',
      firma: 'Carlos'
    }
  };

  // ---------- estilos (una sola vez, sirven en las dos páginas) ----------
  var css = [
    '.fel-carta{margin-top:14px;padding:16px 16px 14px;border:1px solid rgba(227,192,122,.35);border-radius:14px;',
    'background:linear-gradient(170deg,rgba(227,192,122,.09),rgba(227,192,122,.02));text-align:left;color:#f5f2ea}',
    '.fel-carta h3{margin:0 0 8px;font-family:Georgia,"Times New Roman",serif;font-weight:normal;font-size:19px;color:#e3c07a}',
    '.fel-carta p{margin:0 0 8px;font-size:14px;line-height:1.55}',
    '.fel-reflexion{margin:12px 0 8px;padding-left:12px;border-left:2px solid rgba(227,192,122,.45);',
    'font-family:Georgia,"Times New Roman",serif;font-style:italic;color:rgba(245,242,234,.72)}',
    '.fel-reflexion p:last-child{margin-bottom:0}',
    '.fel-autor{margin:4px 0 0!important;text-align:right;font-family:Georgia,"Times New Roman",serif;color:#e3c07a}',
    '.fel-pacto{margin-top:14px;padding-top:14px;border-top:1px solid rgba(227,192,122,.25)}',
    '.fel-acepto{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.45;cursor:pointer}',
    '.fel-acepto input{flex:none;width:22px;height:22px;margin:0;accent-color:#e3c07a}',
    '.fel-eco{margin:8px 0 0 32px!important;font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:13px!important;color:rgba(245,242,234,.6)}',
    '.fel-lbl{display:block;margin:14px 0 6px;font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:rgba(245,242,234,.6)}',
    '.fel-lienzo{display:block;width:100%;height:130px;border:1px dashed rgba(227,192,122,.5);border-radius:10px;',
    'background:rgba(255,255,255,.03);touch-action:none;cursor:crosshair}',
    '.fel-botones{display:flex;gap:8px;margin-top:10px}',
    '.fel-btn{appearance:none;flex:1;min-height:46px;padding:0 14px;border-radius:999px;border:1px solid rgba(245,242,234,.25);',
    'background:transparent;color:#f5f2ea;font:inherit;font-size:12px;letter-spacing:.16em;text-transform:uppercase;cursor:pointer}',
    '.fel-btn.fuerte{border-color:#e3c07a;color:#e3c07a}',
    '.fel-btn.fuerte:not(:disabled){background:#e3c07a;color:#14110b}',
    '.fel-btn:disabled{opacity:.4;cursor:default}',
    '.fel-sello{text-align:center}',
    '.fel-sello b{display:block;font-weight:normal;font-size:13px;letter-spacing:.06em;color:#e3c07a}',
    '.fel-sello img{display:block;width:100%;max-width:320px;margin:8px auto 4px;border-bottom:1px solid rgba(227,192,122,.4)}',
    '.fel-sello small{font-size:12px;color:rgba(245,242,234,.6)}',
    '.fel-capa{position:fixed;inset:0;z-index:200;display:grid;place-items:center;padding:16px;',
    'background:rgba(0,0,0,.75);opacity:0;transition:opacity .3s ease}',
    '.fel-capa.visible{opacity:1}',
    '.fel-capa .fel-carta{width:min(460px,100%);max-height:calc(100vh - 32px);max-height:calc(100dvh - 32px);overflow-y:auto;',
    'margin:0;padding:22px 20px 18px;background:linear-gradient(170deg,rgba(227,192,122,.12),rgba(227,192,122,.03)),#0d0c0a;',
    'transform:translateY(12px);transition:transform .3s ease}',
    '.fel-capa.visible .fel-carta{transform:none}',
    '.fel-capa h3{font-size:23px}',
    '.fel-cerrar{display:block;width:100%;margin-top:10px;padding:10px;border:0;background:none;color:rgba(245,242,234,.6);',
    'font:inherit;font-size:13px;text-decoration:underline;cursor:pointer}',
    '@media (prefers-reduced-motion:reduce){.fel-capa,.fel-capa .fel-carta{transition:none}}'
  ].join('');
  var estilo = document.createElement('style');
  estilo.textContent = css;
  document.head.appendChild(estilo);

  // ---------- guardar y avisar ----------
  function leer(fecha) {
    try { return JSON.parse(localStorage.getItem(CLAVE + fecha)) || null; } catch (e) { return null; }
  }
  function escribir(fecha, v) {
    try { localStorage.setItem(CLAVE + fecha, JSON.stringify(v)); } catch (e) {}
  }

  function cuando(iso) {
    return new Date(iso).toLocaleString('es-ES', {
      timeZone: 'America/New_York', day: 'numeric', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  }

  // te llega un correo; si no hay conexión, se reintenta al volver a abrir
  function avisar(fecha) {
    var f = leer(fecha);
    if (!f || f.avisado || !FORMSPREE_ID) return;
    fetch('https://formspree.io/f/' + FORMSPREE_ID, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        _subject: 'Mari ha firmado tu mensaje del ' + fecha.split('-').reverse().join('/') + ' 🐧',
        mensaje: MENSAJES[fecha].titulo,
        acepta: PACTO,
        firmado: cuando(f.en) + ' (hora de Orlando)',
        desde: f.desde
      })
    }).then(function (r) {
      if (!r.ok) return;
      f.avisado = true;
      escribir(fecha, f);
    }).catch(function () {});
  }
  Object.keys(MENSAJES).forEach(avisar);

  // ---------- la firma con el dedo ----------
  function lienzoFirma(alCambiar) {
    var c = document.createElement('canvas');
    c.className = 'fel-lienzo';
    c.setAttribute('aria-label', 'Firma aquí con el dedo');
    var ctx = c.getContext('2d');
    var trazos = 0, pintando = false, ultimo = null;

    function ajustar() {
      var r = c.getBoundingClientRect();
      if (!r.width) return;
      var k = window.devicePixelRatio || 1;
      c.width = Math.round(r.width * k);
      c.height = Math.round(r.height * k);
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.lineWidth = 2.4;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = '#f5f2ea';
    }
    function punto(ev) {
      var r = c.getBoundingClientRect();
      return { x: ev.clientX - r.left, y: ev.clientY - r.top };
    }
    c.addEventListener('pointerdown', function (ev) {
      if (c.width !== Math.round(c.getBoundingClientRect().width * (window.devicePixelRatio || 1))) ajustar();
      ev.preventDefault();
      c.setPointerCapture && c.setPointerCapture(ev.pointerId);
      pintando = true;
      ultimo = punto(ev);
      ctx.beginPath(); ctx.arc(ultimo.x, ultimo.y, 1.1, 0, Math.PI * 2); ctx.fillStyle = '#f5f2ea'; ctx.fill();
    });
    c.addEventListener('pointermove', function (ev) {
      if (!pintando) return;
      ev.preventDefault();
      var p = punto(ev);
      ctx.beginPath(); ctx.moveTo(ultimo.x, ultimo.y); ctx.lineTo(p.x, p.y); ctx.stroke();
      ultimo = p;
    });
    function soltar() {
      if (!pintando) return;
      pintando = false;
      trazos++;
      alCambiar(trazos);
    }
    c.addEventListener('pointerup', soltar);
    c.addEventListener('pointercancel', soltar);
    c.addEventListener('pointerleave', soltar);

    return {
      el: c,
      ajustar: ajustar,
      borrar: function () { ctx.clearRect(0, 0, c.width, c.height); trazos = 0; alCambiar(0); },
      // la firma en PNG
      imagen: function () { return c.toDataURL('image/png'); }
    };
  }

  // ---------- la tarjeta ----------
  function p(clase, texto) {
    var e = document.createElement('p');
    if (clase) e.className = clase;
    e.textContent = texto;
    return e;
  }

  function sello(f) {
    var s = document.createElement('div');
    s.className = 'fel-sello';
    var b = document.createElement('b');
    b.textContent = '✓ Leído, entendido y guardado en el corazón';
    s.appendChild(b);
    if (f.img) {
      var i = document.createElement('img');
      i.src = f.img; i.alt = 'Firma de Mari';
      s.appendChild(i);
    }
    var sm = document.createElement('small');
    sm.textContent = 'Firmado por Mari · ' + cuando(f.en);
    s.appendChild(sm);
    return s;
  }

  function pacto(fecha, m, alFirmar) {
    var caja = document.createElement('div');
    caja.className = 'fel-pacto';
    var hecha = leer(fecha);
    if (hecha) { caja.appendChild(sello(hecha)); return caja; }

    var lbl = document.createElement('label');
    lbl.className = 'fel-acepto';
    var chk = document.createElement('input');
    chk.type = 'checkbox';
    var span = document.createElement('span');
    span.textContent = PACTO;
    lbl.appendChild(chk); lbl.appendChild(span);
    caja.appendChild(lbl);
    if (m.eco) caja.appendChild(p('fel-eco', m.eco));

    var t = document.createElement('span');
    t.className = 'fel-lbl';
    t.textContent = 'Tu firma';
    caja.appendChild(t);

    var firmar = document.createElement('button');
    var trazos = 0;
    var lienzo = lienzoFirma(function (n) { trazos = n; listo(); });
    function listo() { firmar.disabled = !(chk.checked && trazos > 0); }
    caja.appendChild(lienzo.el);

    var bot = document.createElement('div');
    bot.className = 'fel-botones';
    var borrar = document.createElement('button');
    borrar.type = 'button'; borrar.className = 'fel-btn'; borrar.textContent = 'Borrar';
    firmar.type = 'button'; firmar.className = 'fel-btn fuerte'; firmar.textContent = 'Firmar';
    firmar.disabled = true;
    bot.appendChild(borrar); bot.appendChild(firmar);
    caja.appendChild(bot);

    chk.addEventListener('change', listo);
    borrar.addEventListener('click', function () { lienzo.borrar(); });
    firmar.addEventListener('click', function () {
      if (firmar.disabled) return;
      var f = {
        en: new Date().toISOString(),
        img: lienzo.imagen(),
        desde: /entrenar/.test(location.pathname) ? 'entrenar' : 'portada',
        avisado: false
      };
      escribir(fecha, f);
      avisar(fecha);
      caja.innerHTML = '';
      caja.appendChild(sello(f));
      if (navigator.vibrate) navigator.vibrate([40, 30, 40]);
      document.dispatchEvent(new CustomEvent('felicita:firmada', { detail: { fecha: fecha } }));
      if (alFirmar) alFirmar();
    });

    // el lienzo mide su ancho al aparecer; si cambia de tamaño, se empieza de nuevo
    requestAnimationFrame(function () { lienzo.ajustar(); });
    var ancho = 0;
    function alRedimensionar() {
      if (!caja.isConnected || leer(fecha)) { window.removeEventListener('resize', alRedimensionar); return; }
      var w = lienzo.el.getBoundingClientRect().width;
      if (!w || w === ancho) return;
      ancho = w; lienzo.borrar(); lienzo.ajustar();
    }
    window.addEventListener('resize', alRedimensionar);
    return caja;
  }

  function tarjeta(fecha, variante, alFirmar) {
    var m = MENSAJES[fecha];
    if (!m) return null;
    var v = variante === 'portada' && m.portada ? m.portada : m;
    var c = document.createElement('div');
    c.className = 'fel-carta';
    var h = document.createElement('h3');
    h.textContent = v.titulo;
    c.appendChild(h);
    v.texto.forEach(function (t) { c.appendChild(p(null, t)); });
    if (m.reflexion) {
      var r = document.createElement('div');
      r.className = 'fel-reflexion';
      [].concat(m.reflexion).forEach(function (t) { r.appendChild(p(null, t)); });
      c.appendChild(r);
    }
    if (m.firma) c.appendChild(p('fel-autor', '— ' + m.firma));
    c.appendChild(pacto(fecha, m, alFirmar));
    return c;
  }

  function abrir(fecha, variante) {
    var m = MENSAJES[fecha];
    if (!m || document.querySelector('.fel-capa')) return;
    var capa = document.createElement('div');
    capa.className = 'fel-capa';
    capa.setAttribute('role', 'dialog');
    capa.setAttribute('aria-modal', 'true');
    capa.setAttribute('aria-label', (variante === 'portada' && m.portada ? m.portada : m).titulo);

    var cerrarBtn = document.createElement('button');
    cerrarBtn.type = 'button';
    cerrarBtn.className = 'fel-cerrar';
    var pintarCerrar = function () {
      var firmado = !!leer(fecha);
      cerrarBtn.textContent = firmado ? 'Cerrar' : 'Ahora no, luego lo firmo';
      cerrarBtn.className = firmado ? 'fel-btn fuerte' : 'fel-cerrar';
      if (firmado) cerrarBtn.style.cssText = 'display:block;width:100%;margin-top:14px';
    };
    var c = tarjeta(fecha, variante, pintarCerrar);
    pintarCerrar();
    c.appendChild(cerrarBtn);
    capa.appendChild(c);

    var bloqueo = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    function cerrar() {
      capa.classList.remove('visible');
      document.removeEventListener('keydown', alTeclear);
      document.documentElement.style.overflow = bloqueo;
      setTimeout(function () { capa.remove(); }, 300);
    }
    function alTeclear(ev) { if (ev.key === 'Escape') cerrar(); }
    cerrarBtn.addEventListener('click', cerrar);
    document.addEventListener('keydown', alTeclear);
    document.body.appendChild(capa);
    requestAnimationFrame(function () { capa.classList.add('visible'); });
    if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
  }

  // el primer mensaje cuyo día ya pasó (hoy > fecha) y sigue sin firmar
  function pendiente(hoy) {
    var fs = Object.keys(MENSAJES).sort();
    for (var i = 0; i < fs.length; i++) if (hoy > fs[i] && !leer(fs[i])) return fs[i];
    return null;
  }

  window.Felicita = {
    mensaje: function (fecha) { return MENSAJES[fecha] || null; },
    firma: leer,
    tarjeta: tarjeta,
    abrir: abrir,
    pendiente: pendiente
  };
})();
