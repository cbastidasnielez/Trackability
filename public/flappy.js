/* Flappy compartido por la web de sorpresas y la página de visitantes.
   Se carga como script clásico y expone window.crearFlappy(cfg).

   cfg: sprite, respaldo, objetivo (0 = sin meta), pista,
        alGanar(ctx), alPerder(puntos), alCrecer(), alMontar(ctx), depurar */
(function () {
  'use strict';

  function pad(n) { return String(n).padStart(2, '0'); }

  window.crearFlappy = function (cfg) {
    var OBJETIVO = cfg.objetivo || 0;      // 0 = sin meta, se juega a récord
    var alGanar = cfg.alGanar || function () {};
    var alCrecer = cfg.alCrecer || function () {};

    function etiquetaMarcador(p) { return p + (OBJETIVO ? ' / ' + OBJETIVO : ''); }


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
    var ave, tubos, puntos, estado, desdeUltimo, ganado;

    function reiniciar() {
      ave = { y: ALTO / 2, v: 0, x: 78 };
      tubos = [];
      puntos = 0;
      desdeUltimo = CADA - 0.5;
      estado = 'espera';
      marcador.textContent = etiquetaMarcador(0);
    }

    function volar() {
      if (estado === 'fin' || estado === 'ganado') { reiniciar(); return; }
      if (estado === 'espera') estado = 'juega';
      ave.v = IMPULSO;
    }

    function nuevoTubo() {
      var margen = 54;
      var centro = margen + HUECO / 2 + Math.random() * (ALTO - HUECO - margen * 2);
      tubos.push({ x: ANCHO + 34, centro: centro, contado: false });
    }

    function chocaCon(t) {
      var ancho = 52, izq = t.x, der = t.x + ancho;
      var arriba = t.centro - HUECO / 2, abajo = t.centro + HUECO / 2;
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

    function actualizar(dt) {
      if (estado !== 'juega') return;
      ave.v += GRAVEDAD * dt;
      ave.y += ave.v * dt;

      desdeUltimo += dt;
      if (desdeUltimo >= CADA) { desdeUltimo = 0; nuevoTubo(); }

      for (var i = tubos.length - 1; i >= 0; i--) {
        var t = tubos[i];
        t.x -= VEL * dt;
        if (!t.contado && t.x + 52 < ave.x - RADIO) {
          t.contado = true;
          puntos++;
          marcador.textContent = etiquetaMarcador(puntos);
          if (OBJETIVO && puntos >= OBJETIVO) { estado = 'ganado'; ganar(); return; }
        }
        if (t.x < -70) tubos.splice(i, 1);
        if (chocaCon(t)) {
          estado = 'fin';
          if (cfg.alPerder) cfg.alPerder(puntos);
          return;
        }
      }

      if (ave.y + RADIO > ALTO || ave.y - RADIO < 0) estado = 'fin';
      if (estado === 'fin' && cfg.alPerder) cfg.alPerder(puntos);
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

    function texto(t, y, tam, color) {
      ctx.fillStyle = color;
      ctx.font = '300 ' + tam + 'px "Helvetica Neue", Helvetica, Arial, sans-serif';
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

      for (var i = 0; i < tubos.length; i++) {
        var t = tubos[i];
        tubo(t.x, -2, t.centro - HUECO / 2);
        tubo(t.x, t.centro + HUECO / 2, ALTO + 2);
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

    // sonda para poder probar el juego desde fuera (solo en modo prueba)
    if (cfg.depurar) {
      window.__juego = {
        estado: function () { return { estado: estado, puntos: puntos, y: ave.y, tubos: tubos.length }; },
        puntuar: function (n) { puntos = n; marcador.textContent = etiquetaMarcador(puntos); },
        forzarVictoria: function () { puntos = OBJETIVO; estado = 'ganado'; ganar(); },
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
