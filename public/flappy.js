/* Flappy compartido por la web de sorpresas, la página de visitantes, la demo
   y los regalos de Gánatelo. Se carga como script clásico y expone
   window.crearFlappy(cfg). Devuelve el contenedor; en contenedor.juego hay
   un pequeño mando: { reiniciar(), sonar(nombre), estado() }.

   cfg: sprite, respaldo, objetivo (0 = sin meta), pista,
        alGanar(ctx), alPerder(puntos), alCrecer(), alMontar(ctx),
        alPunto(puntos) (cada vez que suma), depurar,
        suave    (true: empieza fácil y se endurece poco a poco; los
                  primeros puntos salen casi solos),
        efectos  (true: marcador grande, chispas al puntuar, estrellas),
        sonido   (true: pitidos con WebAudio y botón para silenciar) */
(function () {
  'use strict';

  function pad(n) { return String(n).padStart(2, '0'); }

  // ---------- sonido: sintetizado, sin archivos ----------
  var SONIDO_KEY = 'flappy-sonido';
  var audioCtx = null;

  function leerSilencio() {
    try { return localStorage.getItem(SONIDO_KEY) === 'off'; } catch (e) { return false; }
  }
  function guardarSilencio(v) {
    try { localStorage.setItem(SONIDO_KEY, v ? 'off' : 'on'); } catch (e) {}
  }
  function contexto() {
    if (audioCtx) return audioCtx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { audioCtx = new AC(); } catch (e) { return null; }
    return audioCtx;
  }
  function nota(ctx, freq, t0, dur, tipo, vol, hasta) {
    var o = ctx.createOscillator();
    var g = ctx.createGain();
    o.type = tipo || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (hasta) o.frequency.exponentialRampToValueAtTime(hasta, t0 + dur);
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  var SONIDOS = {
    volar:    function (c, t) { nota(c, 420, t, 0.09, 'triangle', 0.05, 640); },
    punto:    function (c, t) { nota(c, 880, t, 0.08, 'sine', 0.07); nota(c, 1320, t + 0.07, 0.12, 'sine', 0.06); },
    perder:   function (c, t) { nota(c, 220, t, 0.28, 'sawtooth', 0.05, 70); },
    premio:   function (c, t) { [523, 659, 784, 1047].forEach(function (f, i) { nota(c, f, t + i * 0.09, 0.22, 'sine', 0.07); }); },
    record:   function (c, t) { [659, 784, 988].forEach(function (f, i) { nota(c, f, t + i * 0.07, 0.16, 'triangle', 0.06); }); }
  };

  window.crearFlappy = function (cfg) {
    var OBJETIVO = cfg.objetivo || 0;      // 0 = sin meta, se juega a récord
    var alGanar = cfg.alGanar || function () {};
    var alCrecer = cfg.alCrecer || function () {};
    var SUAVE = !!cfg.suave;
    var EFECTOS = !!cfg.efectos;
    var CON_SONIDO = !!cfg.sonido;
    var premiado = false;   // la meta se cobra una sola vez
    var silencio = leerSilencio();

    function sonar(nombre) {
      if (!CON_SONIDO || silencio || !SONIDOS[nombre]) return;
      var c = contexto();
      if (!c) return;
      if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
      try { SONIDOS[nombre](c, c.currentTime); } catch (e) {}
    }

    function etiquetaMarcador(p) { return p + (OBJETIVO && !premiado ? ' / ' + OBJETIVO : ''); }


    var caja = document.createElement('div');
    var envoltorio = document.createElement('div');
    envoltorio.className = 'game';

    var canvas = document.createElement('canvas');
    var barra = document.createElement('div');
    barra.className = 'game-bar';
    var marcador = document.createElement('span');
    marcador.className = 'game-score';
    var ayuda = document.createElement('span');
    ayuda.textContent = 'Toca para volar';
    barra.appendChild(marcador);
    barra.appendChild(ayuda);

    if (CON_SONIDO) {
      var mute = document.createElement('button');
      mute.type = 'button';
      mute.className = 'game-mute';
      mute.setAttribute('aria-label', 'Sonido');
      mute.style.cssText = 'background:none;border:0;color:inherit;font:inherit;cursor:pointer;padding:0 0 0 12px;letter-spacing:0';
      function pintarMute() { mute.textContent = silencio ? '🔇' : '🔊'; }
      pintarMute();
      mute.addEventListener('click', function (e) {
        e.stopPropagation();
        silencio = !silencio;
        guardarSilencio(silencio);
        pintarMute();
        if (!silencio) sonar('punto');
      });
      barra.appendChild(mute);
    }

    envoltorio.appendChild(canvas);
    envoltorio.appendChild(barra);
    caja.appendChild(envoltorio);

    var premio = document.createElement('div');
    caja.appendChild(premio);

    // --- medidas ---
    var ANCHO = 320, ALTO = 380;          // coordenadas del juego
    var ctx = canvas.getContext('2d');

    // el alto lo deduce el CSS de la proporción del lienzo; fijarlo a mano
    // deformaba el dibujo cuando aún no se conocía el ancho real
    function ajustar() {
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var w = envoltorio.clientWidth || ANCHO;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * (ALTO / ANCHO) * dpr);
      escala = (w / ANCHO) * dpr;
    }
    var escala = 1;

    // --- la cara ---
    var cara = new Image();
    var caraLista = false;
    cara.onload = function () { caraLista = true; };
    // si el recorte todavía no está subido, se usa la foto de siempre
    cara.onerror = function () {
      if (cfg.respaldo && cara.src.indexOf(cfg.respaldo) === -1) cara.src = cfg.respaldo;
    };
    cara.src = cfg.sprite;

    // --- estado ---
    var RADIO = 21, GRAVEDAD = 1500, IMPULSO = -430;
    var VEL = 132, HUECO = 136, CADA = 1.55;
    var ave, tubos, puntos, estado, desdeUltimo, ganado, finEn, chispas, estrellas, popPunto;

    // en modo suave los primeros puntos salen casi solos y a partir del 12
    // el juego es el de siempre; después de 25 aprieta un poco más
    function dificultad() {
      if (!SUAVE) return { vel: VEL, hueco: HUECO, cada: CADA };
      var p = puntos;
      var f = Math.min(1, p / 12);                 // 0 → 1 en los 12 primeros puntos
      var g = Math.max(0, Math.min(1, (p - 25) / 25)); // 0 → 1 entre 25 y 50
      return {
        vel: 108 + (VEL - 108) * f + 22 * g,
        hueco: 166 - (166 - HUECO) * f - 10 * g,
        cada: 1.75 - (1.75 - CADA) * f - 0.1 * g
      };
    }

    function sembrarEstrellas() {
      estrellas = [];
      for (var i = 0; i < 46; i++) {
        estrellas.push({ x: Math.random() * ANCHO, y: Math.random() * ALTO, r: 0.4 + Math.random() * 1.1, v: 6 + Math.random() * 18, a: 0.25 + Math.random() * 0.5 });
      }
    }

    function reiniciar() {
      ave = { y: ALTO / 2, v: 0, x: 78 };
      tubos = [];
      puntos = 0;
      desdeUltimo = CADA - 0.5;
      estado = 'espera';
      finEn = 0;
      chispas = [];
      popPunto = 0;
      if (EFECTOS && !estrellas) sembrarEstrellas();
      marcador.textContent = etiquetaMarcador(0);
    }

    function volar() {
      if (estado === 'fin' || estado === 'ganado') {
        // en modo suave, medio segundo de gracia: un toque por inercia no reinicia
        if (SUAVE && estado === 'fin' && performance.now() - finEn < 450) return;
        reiniciar();
        return;
      }
      if (estado === 'espera') estado = 'juega';
      ave.v = IMPULSO;
      sonar('volar');
    }

    function nuevoTubo() {
      var margen = 54;
      var hueco = dificultad().hueco;
      var centro = margen + hueco / 2 + Math.random() * (ALTO - hueco - margen * 2);
      tubos.push({ x: ANCHO + 34, centro: centro, hueco: hueco, contado: false });
    }

    function chocaCon(t) {
      var ancho = 52, izq = t.x, der = t.x + ancho;
      var hueco = t.hueco || HUECO;
      var arriba = t.centro - hueco / 2, abajo = t.centro + hueco / 2;
      // círculo contra los dos rectángulos del tubo
      var cx = Math.max(izq, Math.min(ave.x, der));
      if (Math.abs(cx - ave.x) > RADIO) return false;
      var cyArriba = Math.min(arriba, Math.max(0, ave.y));
      var cyAbajo = Math.max(abajo, Math.min(ALTO, ave.y));
      var dxA = ave.x - cx, dyA = ave.y - cyArriba;
      var dxB = ave.x - cx, dyB = ave.y - cyAbajo;
      return (dxA * dxA + dyA * dyA < RADIO * RADIO) ||
             (dxB * dxB + dyB * dyB < RADIO * RADIO);
    }

    function chispear(n, color) {
      if (!EFECTOS) return;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 160;
        chispas.push({ x: ave.x, y: ave.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vida: 0.5 + Math.random() * 0.4, color: color });
      }
    }

    function perder() {
      estado = 'fin';
      finEn = performance.now();
      sonar('perder');
      chispear(14, 'rgba(240,143,164,');
      if (cfg.alPerder) cfg.alPerder(puntos);
    }

    function actualizar(dt) {
      // las chispas y estrellas siguen vivas aunque la partida haya acabado
      if (EFECTOS) {
        for (var k = chispas.length - 1; k >= 0; k--) {
          var c = chispas[k];
          c.vida -= dt; c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 500 * dt;
          if (c.vida <= 0) chispas.splice(k, 1);
        }
        if (estrellas) {
          var mult = estado === 'juega' ? 1 : 0.35;
          for (var s = 0; s < estrellas.length; s++) {
            estrellas[s].x -= estrellas[s].v * mult * dt;
            if (estrellas[s].x < -2) { estrellas[s].x = ANCHO + 2; estrellas[s].y = Math.random() * ALTO; }
          }
        }
        if (popPunto > 0) popPunto -= dt;
      }

      if (estado !== 'juega') return;
      var d = dificultad();
      ave.v += GRAVEDAD * dt;
      ave.y += ave.v * dt;

      desdeUltimo += dt;
      if (desdeUltimo >= d.cada) { desdeUltimo = 0; nuevoTubo(); }

      for (var i = tubos.length - 1; i >= 0; i--) {
        var t = tubos[i];
        t.x -= d.vel * dt;
        if (!t.contado && t.x + 52 < ave.x - RADIO) {
          t.contado = true;
          puntos++;
          popPunto = 0.35;
          sonar('punto');
          chispear(6, 'rgba(227,192,122,');
          marcador.textContent = etiquetaMarcador(puntos);
          if (cfg.alPunto) cfg.alPunto(puntos);
          if (OBJETIVO && !premiado && puntos >= OBJETIVO) {
            premiado = true;
            if (cfg.seguirTrasMeta) {
              // se cobra el premio pero la partida continúa
              ganar();
            } else {
              estado = 'ganado';
              ganar();
              return;
            }
          }
        }
        if (t.x < -70) tubos.splice(i, 1);
        if (chocaCon(t)) { perder(); return; }
      }

      if (ave.y + RADIO > ALTO || ave.y - RADIO < 0) perder();
    }

    function tubo(x, y0, y1) {
      var g = ctx.createLinearGradient(x, 0, x + 52, 0);
      g.addColorStop(0, '#2a2118');
      g.addColorStop(0.5, '#4a3a24');
      g.addColorStop(1, '#2a2118');
      ctx.fillStyle = g;
      ctx.fillRect(x, y0, 52, y1 - y0);
      ctx.strokeStyle = 'rgba(227,192,122,0.55)';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y0 + 0.75, 50.5, y1 - y0 - 1.5);
    }

    function texto(t, y, tam, color, peso) {
      ctx.fillStyle = color;
      ctx.font = (peso || '300') + ' ' + tam + 'px "Helvetica Neue", Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t, ANCHO / 2, y);
    }

    function pintar() {
      ctx.setTransform(escala, 0, 0, escala, 0, 0);
      ctx.clearRect(0, 0, ANCHO, ALTO);

      // cielo
      var cielo = ctx.createLinearGradient(0, 0, 0, ALTO);
      cielo.addColorStop(0, '#0d0d12');
      cielo.addColorStop(1, '#07070a');
      ctx.fillStyle = cielo;
      ctx.fillRect(0, 0, ANCHO, ALTO);

      if (EFECTOS && estrellas) {
        for (var s = 0; s < estrellas.length; s++) {
          var e = estrellas[s];
          ctx.fillStyle = 'rgba(245,242,234,' + e.a + ')';
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
        }
      }

      for (var i = 0; i < tubos.length; i++) {
        var t = tubos[i];
        var hueco = t.hueco || HUECO;
        tubo(t.x, -2, t.centro - hueco / 2);
        tubo(t.x, t.centro + hueco / 2, ALTO + 2);
      }

      if (EFECTOS) {
        for (var k = 0; k < chispas.length; k++) {
          var c = chispas[k];
          ctx.fillStyle = c.color + Math.max(0, Math.min(1, c.vida * 1.6)) + ')';
          ctx.beginPath(); ctx.arc(c.x, c.y, 2, 0, Math.PI * 2); ctx.fill();
        }
      }

      // la cara, girando un poco según cae o sube
      ctx.save();
      ctx.translate(ave.x, ave.y);
      ctx.rotate(Math.max(-0.5, Math.min(0.9, ave.v / 700)));
      if (caraLista) {
        // el recorte ya viene con su silueta: se dibuja tal cual, algo más
        // grande que el área de choque para que perdone los roces
        var d = RADIO * 2.7;
        ctx.drawImage(cara, -d / 2, -d / 2, d, d);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, RADIO, 0, Math.PI * 2);
        ctx.fillStyle = '#e3c07a';
        ctx.fill();
      }
      ctx.restore();

      // marcador grande mientras se juega
      if (EFECTOS && estado === 'juega') {
        var tam = 34 + (popPunto > 0 ? popPunto * 30 : 0);
        texto(String(puntos), 58, tam, 'rgba(245,242,234,' + (popPunto > 0 ? 0.95 : 0.55) + ')', '200');
      }

      if (estado === 'espera') {
        texto('Toca para empezar', ALTO / 2 - 62, 15, 'rgba(245,242,234,0.85)');
        texto(cfg.pista || (OBJETIVO + ' puntos y hay premio'), ALTO / 2 - 40, 11, 'rgba(245,242,234,0.45)');
      } else if (estado === 'fin') {
        ctx.fillStyle = 'rgba(5,5,7,0.72)';
        ctx.fillRect(0, 0, ANCHO, ALTO);
        texto('Casi', ALTO / 2 - 16, 26, '#f5f2ea');
        texto(puntos + (puntos === 1 ? ' punto' : ' puntos') + ' · toca para reintentar',
              ALTO / 2 + 12, 12, 'rgba(245,242,234,0.6)');
      }
    }

    var previo = 0;
    function bucle(t) {
      if (!previo) previo = t;
      var dt = Math.min((t - previo) / 1000, 0.05);
      previo = t;
      actualizar(dt);
      pintar();
      window.__flappyRAF = requestAnimationFrame(bucle);
    }

    function ganar() {
      pintar();
      marcador.textContent = etiquetaMarcador(puntos);
      alGanar({ premio: premio, ayuda: ayuda, puntos: puntos, reiniciar: function () {
        premio.innerHTML = '';
        ayuda.textContent = 'Toca para volar';
        reiniciar();
        alCrecer();
      } });
      alCrecer();
    }

    canvas.addEventListener('pointerdown', function (e) { e.preventDefault(); volar(); });
    canvas.addEventListener('keydown', function (e) {
      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); volar(); }
    });
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', 'Juego: toca para volar');

    ajustar();
    // al montarse dentro del panel el ancho cambia, así que se remide solo
    if (window.ResizeObserver) {
      new ResizeObserver(ajustar).observe(envoltorio);
    } else {
      window.addEventListener('resize', ajustar);
    }
    reiniciar();

    // el mando para quien monta el juego
    caja.juego = {
      reiniciar: reiniciar,
      sonar: sonar,
      estado: function () { return { estado: estado, puntos: puntos }; }
    };

    // sonda para poder probar el juego desde fuera (solo en modo prueba)
    if (cfg.depurar) {
      window.__juego = {
        estado: function () { return { estado: estado, puntos: puntos, y: ave.y, tubos: tubos.length }; },
        puntuar: function (n) {
          puntos = n;
          marcador.textContent = etiquetaMarcador(puntos);
          if (cfg.alPunto) cfg.alPunto(puntos);
        },
        forzarVictoria: function () {
          puntos = OBJETIVO;
          premiado = true;
          if (!cfg.seguirTrasMeta) estado = 'ganado';
          ganar();
        },
        volar: volar
      };
    }

    // quien lo usa decide si ya había algo que mostrar bajo el juego
    if (cfg.alMontar) cfg.alMontar({ premio: premio, ayuda: ayuda });

    if (window.__flappyRAF) cancelAnimationFrame(window.__flappyRAF);
    window.__flappyRAF = requestAnimationFrame(bucle);

    return caja;
  };
})();
