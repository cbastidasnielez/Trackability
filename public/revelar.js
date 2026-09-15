/* Los momentos grandes: la revelación de cada premio y el final.
   Se carga como script clásico y expone window.crearRevelador(cfg).

   Antes esto era un aviso pequeño y una lista debajo del lienzo: el premio
   caía fuera de donde ella estaba mirando. Ahora para el juego y ocupa toda
   la pantalla, que es lo que convierte un punto en un regalo.

   cfg: color (acento), alCerrar(), alVolverAJugar() */
(function () {
  'use strict';

  var CSS = [
    '.rev{position:fixed;inset:0;z-index:40;display:flex;align-items:center;justify-content:center;',
    'padding:24px;background:rgba(4,4,6,.82);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);',
    'opacity:0;transition:opacity .35s ease}',
    '.rev.ver{opacity:1}',
    '.rev-caja{width:100%;max-width:380px;text-align:center;transform:scale(.9) translateY(14px);',
    'transition:transform .45s cubic-bezier(.2,.9,.3,1.2)}',
    '.rev.ver .rev-caja{transform:none}',
    '.rev-eyebrow{font-size:10px;letter-spacing:.34em;text-indent:.34em;text-transform:uppercase;color:#e3c07a}',
    '.rev-lazo{font-size:54px;line-height:1;margin:18px 0 6px;display:block;animation:revLazo .9s ease}',
    '@keyframes revLazo{0%{transform:scale(.3) rotate(-25deg);opacity:0}60%{transform:scale(1.15) rotate(6deg)}100%{transform:none;opacity:1}}',
    '.rev-texto{font-family:Georgia,"Times New Roman",serif;font-size:clamp(1.5rem,7.5vw,2.1rem);',
    'line-height:1.25;color:#f5f2ea;margin-top:10px;overflow-wrap:break-word}',
    '.rev-pie{margin-top:14px;font-size:12.5px;color:rgba(245,242,234,.6)}',
    '.rev-btn{appearance:none;margin-top:26px;padding:15px 28px;border-radius:999px;border:1px solid #e3c07a;',
    'background:#e3c07a;color:#0b0b0b;font-family:inherit;font-size:11px;letter-spacing:.26em;text-indent:.26em;',
    'text-transform:uppercase;cursor:pointer}',
    '.rev-btn.ghost{background:none;color:#f5f2ea;border-color:rgba(245,242,234,.35);margin-top:10px}',
    '.rev-acciones{display:flex;flex-direction:column;align-items:stretch;gap:0}',
    '.rev-acciones a,.rev-acciones button{text-decoration:none;display:block;text-align:center}',
    '.rev-cara{width:96px;height:96px;border-radius:50%;object-fit:cover;border:2px solid rgba(227,192,122,.6);',
    'box-shadow:0 0 50px rgba(227,192,122,.25);margin:0 auto 18px;display:block;background:#111}',
    '.rev-msg{font-family:Georgia,"Times New Roman",serif;font-style:italic;font-size:clamp(1.05rem,4.6vw,1.3rem);',
    'line-height:1.6;color:#f5f2ea;min-height:3.2em;margin-top:6px}',
    '.rev-msg .cursor{opacity:.6;animation:revParpadeo 1s steps(2) infinite}',
    '@keyframes revParpadeo{0%,49%{opacity:.6}50%,100%{opacity:0}}',
    '.rev-firma{margin-top:16px;font-size:13px;color:rgba(245,242,234,.6)}',
    '@media(prefers-reduced-motion:reduce){.rev,.rev-caja,.rev-lazo{transition:none;animation:none}}'
  ].join('');

  function estilos() {
    if (document.getElementById('rev-css')) return;
    var e = document.createElement('style');
    e.id = 'rev-css';
    e.textContent = CSS;
    document.head.appendChild(e);
  }

  // ---------- confeti ----------
  function confeti(intensidad) {
    var c = document.getElementById('rev-confeti');
    if (!c) {
      c = document.createElement('canvas');
      c.id = 'rev-confeti';
      c.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:41';
      document.body.appendChild(c);
    }
    var ctx = c.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = innerWidth * dpr; c.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var colores = ['#e3c07a', '#f08fa4', '#f5f2ea', '#9ec9e6'];
    var n = Math.round(90 * (intensidad || 1));
    var piezas = [];
    for (var i = 0; i < n; i++) {
      piezas.push({
        x: innerWidth / 2 + (Math.random() - 0.5) * 140,
        y: innerHeight * 0.52,
        vx: (Math.random() - 0.5) * 560,
        vy: -320 - Math.random() * 460,
        r: 3 + Math.random() * 4,
        col: colores[i % colores.length],
        a: Math.random() * Math.PI,
        va: (Math.random() - 0.5) * 12
      });
    }
    var t0 = performance.now(), prev = t0;
    function paso(t) {
      var dt = Math.min((t - prev) / 1000, 0.04); prev = t;
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      for (var k = 0; k < piezas.length; k++) {
        var p = piezas[k];
        p.vy += 900 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.a += p.va * dt; p.vx *= 0.99;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.a);
        ctx.fillStyle = p.col; ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); ctx.restore();
      }
      if (t - t0 < 2800) requestAnimationFrame(paso);
      else ctx.clearRect(0, 0, innerWidth, innerHeight);
    }
    requestAnimationFrame(paso);
  }

  function vibrar(patron) {
    if (!navigator.vibrate) return;
    try { navigator.vibrate(patron); } catch (e) {}
  }

  window.crearRevelador = function (cfg) {
    cfg = cfg || {};
    estilos();

    var capa = null;

    function cerrar() {
      if (!capa) return;
      var c = capa;
      capa = null;
      c.classList.remove('ver');
      setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, 350);
    }

    function abrir(construir) {
      cerrar();
      capa = document.createElement('div');
      capa.className = 'rev';
      var caja = document.createElement('div');
      caja.className = 'rev-caja';
      capa.appendChild(caja);
      construir(caja);
      document.body.appendChild(capa);
      // un fotograma para que la transición se vea
      requestAnimationFrame(function () { if (capa) capa.classList.add('ver'); });
      return caja;
    }

    return {
      cerrar: cerrar,

      /** El premio número `n` de `total`, recién ganado. */
      premio: function (opciones) {
        var n = opciones.n, total = opciones.total, texto = opciones.texto;
        var ultimo = n >= total;
        confeti(ultimo ? 1.4 : 1);
        vibrar(ultimo ? [40, 60, 40, 60, 90] : [35, 55, 35]);
        abrir(function (caja) {
          var eb = document.createElement('div');
          eb.className = 'rev-eyebrow';
          eb.textContent = 'Premio ' + n + ' de ' + total;

          var lazo = document.createElement('span');
          lazo.className = 'rev-lazo';
          lazo.textContent = '🎁';

          var t = document.createElement('div');
          t.className = 'rev-texto';
          t.textContent = texto;

          var pie = document.createElement('div');
          pie.className = 'rev-pie';
          pie.textContent = ultimo
            ? 'Los tienes todos. Falta una cosa más.'
            : (opciones.pie || 'Te lo acabas de ganar.');

          var acciones = document.createElement('div');
          acciones.className = 'rev-acciones';

          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'rev-btn';
          b.textContent = ultimo ? 'Ver tu mensaje' : 'Seguir jugando';
          b.addEventListener('click', function () {
            cerrar();
            if (opciones.alSeguir) opciones.alSeguir();
          });
          acciones.appendChild(b);

          if (opciones.enlaceCobrar) {
            var a = document.createElement('a');
            a.className = 'rev-btn ghost';
            a.href = opciones.enlaceCobrar;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = 'Reclamarlo ahora';
            acciones.appendChild(a);
          }

          caja.appendChild(eb);
          caja.appendChild(lazo);
          caja.appendChild(t);
          caja.appendChild(pie);
          caja.appendChild(acciones);
          setTimeout(function () { b.focus(); }, 400);
        });
      },

      /** El final: el mensaje de quien lo regala, escrito letra a letra. */
      final: function (opciones) {
        confeti(1.6);
        vibrar([60, 80, 60, 80, 140]);
        abrir(function (caja) {
          if (opciones.cara) {
            var img = document.createElement('img');
            img.className = 'rev-cara';
            img.src = opciones.cara;
            img.alt = '';
            caja.appendChild(img);
          }

          var eb = document.createElement('div');
          eb.className = 'rev-eyebrow';
          eb.textContent = opciones.titulo || 'Te lo has ganado todo';
          caja.appendChild(eb);

          var msg = document.createElement('div');
          msg.className = 'rev-msg';
          caja.appendChild(msg);

          var firma = document.createElement('div');
          firma.className = 'rev-firma';
          firma.style.opacity = '0';
          firma.style.transition = 'opacity .6s ease';
          firma.textContent = opciones.de ? '— ' + opciones.de : '';
          caja.appendChild(firma);

          var acciones = document.createElement('div');
          acciones.className = 'rev-acciones';
          acciones.style.opacity = '0';
          acciones.style.transition = 'opacity .6s ease';
          caja.appendChild(acciones);

          if (opciones.enlaceCobrar) {
            var a = document.createElement('a');
            a.className = 'rev-btn';
            a.href = opciones.enlaceCobrar;
            a.target = '_blank';
            a.rel = 'noopener';
            a.textContent = opciones.textoCobrar || 'Reclamar mis premios';
            acciones.appendChild(a);
          }

          var b = document.createElement('button');
          b.type = 'button';
          b.className = 'rev-btn ghost';
          b.textContent = opciones.textoCerrar || 'Volver al juego';
          b.addEventListener('click', function () {
            cerrar();
            if (opciones.alCerrar) opciones.alCerrar();
          });
          acciones.appendChild(b);

          // se escribe sola: el mensaje es lo último que pasa, merece su tiempo
          var texto = opciones.mensaje || '';
          var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;
          if (reducido || texto.length > 200) {
            msg.textContent = texto;
            firma.style.opacity = '1';
            acciones.style.opacity = '1';
          } else {
            var i = 0;
            var cursor = document.createElement('span');
            cursor.className = 'cursor';
            cursor.textContent = '▌';
            msg.appendChild(cursor);
            (function escribir() {
              if (i >= texto.length) {
                cursor.remove();
                firma.style.opacity = '1';
                acciones.style.opacity = '1';
                return;
              }
              cursor.insertAdjacentText('beforebegin', texto[i++]);
              setTimeout(escribir, texto[i - 1] === '.' ? 180 : 38);
            })();
          }
        });
      }
    };
  };
})();
