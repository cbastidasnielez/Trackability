/* Flappy compartido por la web de sorpresas, la página de visitantes, la demo
   y los regalos de Gánatelo. Se carga como script clásico y expone
   window.crearFlappy(cfg). Devuelve el contenedor; en contenedor.juego hay
   un mando: { reiniciar(), sonar(), pausar(), reanudar(), estado() }.

   cfg básico: sprite, respaldo, objetivo (0 = sin meta), pista,
        alGanar(ctx), alPerder(puntos), alCrecer(), alMontar(ctx),
        alPunto(puntos), depurar,
        suave     (empieza fácil y se endurece; los primeros puntos salen casi solos)
        efectos   (marcador grande, chispas al puntuar, estrellas)
        sonido    (pitidos con WebAudio y boton para silenciar)
        objetivos (array de puntuaciones con premio: pinta cuánto falta)
        textoFin(puntos, faltan)

   cfg arcade (se encienden juntas con arcade:true; apagado no cambia nada):
        arcade            zonas, rachas, monedas, escudo, revivir y adornos
        record            la mejor marca, para avisar cuando está a punto de batirla
        monedasIniciales  las que ya tenía guardadas
        costoRevivir      monedas que cuesta seguir tras perder (por defecto 10)
        alMoneda(total)   cada vez que cambia el monedero
        alRecord(puntos)  cuando bate su marca
        alZona(zona, n)   al entrar en una zona nueva */
(function () {
  'use strict';

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
    perfecto: function (c, t) { [988, 1319, 1568].forEach(function (f, i) { nota(c, f, t + i * 0.05, 0.13, 'sine', 0.06); }); },
    moneda:   function (c, t) { nota(c, 1175, t, 0.07, 'square', 0.04); nota(c, 1568, t + 0.06, 0.1, 'square', 0.035); },
    escudo:   function (c, t) { nota(c, 392, t, 0.16, 'sawtooth', 0.045, 784); nota(c, 1046, t + 0.14, 0.2, 'sine', 0.05); },
    romper:   function (c, t) { nota(c, 300, t, 0.18, 'square', 0.05, 120); },
    perder:   function (c, t) { nota(c, 220, t, 0.28, 'sawtooth', 0.05, 70); },
    premio:   function (c, t) { [523, 659, 784, 1047].forEach(function (f, i) { nota(c, f, t + i * 0.09, 0.22, 'sine', 0.07); }); },
    zona:     function (c, t) { [659, 880, 1046, 1319].forEach(function (f, i) { nota(c, f, t + i * 0.07, 0.2, 'triangle', 0.05); }); },
    record:   function (c, t) { [659, 784, 988].forEach(function (f, i) { nota(c, f, t + i * 0.07, 0.16, 'triangle', 0.06); }); }
  };

  // ---------- las zonas: cambian cada 10 puntos y no se acaban ----------
  var ZONAS = [
    { nombre: 'Noche',    cielo: ['#0d0d12', '#07070a'], tubo: ['#2a2118', '#4a3a24'], borde: 'rgba(227,192,122,.55)', polvo: '245,242,234' },
    { nombre: 'Amanecer', cielo: ['#2b1421', '#0d0710'], tubo: ['#3a1f28', '#6b3a44'], borde: 'rgba(240,143,164,.6)',  polvo: '255,214,224' },
    { nombre: 'Hielo',    cielo: ['#08161e', '#04090d'], tubo: ['#123040', '#1e5871'], borde: 'rgba(158,201,230,.65)', polvo: '200,232,255' },
    { nombre: 'Selva',    cielo: ['#0a1a11', '#040b07'], tubo: ['#17301d', '#2f5c36'], borde: 'rgba(150,214,160,.6)',  polvo: '208,255,214' },
    { nombre: 'Tormenta', cielo: ['#141428', '#07070f'], tubo: ['#242042', '#3f3a66'], borde: 'rgba(170,170,255,.6)',  polvo: '210,214,255' },
    { nombre: 'Espacio',  cielo: ['#150a24', '#05030c'], tubo: ['#2a1140', '#4d2170'], borde: 'rgba(200,150,255,.6)',  polvo: '235,214,255' },
    { nombre: 'Oro',      cielo: ['#231a08', '#0b0803'], tubo: ['#3d2f10', '#7a5d1d'], borde: 'rgba(255,214,120,.7)',  polvo: '255,238,190' }
  ];
  var ZONA_CADA = 10;
  function zonaDe(p) { return ZONAS[Math.floor(p / ZONA_CADA) % ZONAS.length]; }

  window.crearFlappy = function (cfg) {
    var OBJETIVO = cfg.objetivo || 0;      // 0 = sin meta, se juega a récord
    var alGanar = cfg.alGanar || function () {};
    var alCrecer = cfg.alCrecer || function () {};
    var SUAVE = !!cfg.suave;
    var EFECTOS = !!cfg.efectos;
    var ARCADE = !!cfg.arcade;
    var CON_SONIDO = !!cfg.sonido;
    var COSTO_REVIVIR = cfg.costoRevivir || 10;
    var premiado = false;
    var silencio = leerSilencio();

    function sonar(nombre) {
      if (!CON_SONIDO || silencio || !SONIDOS[nombre]) return;
      var c = contexto();
      if (!c) return;
      if (c.state === 'suspended') { try { c.resume(); } catch (e) {} }
      try { SONIDOS[nombre](c, c.currentTime); } catch (e) {}
    }

    function etiquetaMarcador(p) { return p + (OBJETIVO && !premiado ? ' / ' + OBJETIVO : ''); }

    // ---------- el armazon ----------
    var caja = document.createElement('div');
    var envoltorio = document.createElement('div');
    envoltorio.className = 'game';
    envoltorio.style.position = 'relative';

    var canvas = document.createElement('canvas');
    var barra = document.createElement('div');
    barra.className = 'game-bar';
    var marcador = document.createElement('span');
    marcador.className = 'game-score';
    var ayuda = document.createElement('span');
    ayuda.textContent = 'Toca para volar';
    barra.appendChild(marcador);
    barra.appendChild(ayuda);

    var monederoEl = null;
    if (ARCADE) {
      monederoEl = document.createElement('span');
      monederoEl.className = 'game-monedas';
      monederoEl.style.cssText = 'color:#e3c07a;letter-spacing:0';
      barra.insertBefore(monederoEl, ayuda);
    }

    if (CON_SONIDO) {
      var mute = document.createElement('button');
      mute.type = 'button';
      mute.className = 'game-mute';
      mute.setAttribute('aria-label', 'Sonido');
      mute.style.cssText = 'background:none;border:0;color:inherit;font:inherit;cursor:pointer;padding:0 0 0 12px;letter-spacing:0';
      var pintarMute = function () { mute.textContent = silencio ? '🔇' : '🔊'; };
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

    // panel para seguir jugando pagando monedas, encima del lienzo
    var panelRevivir = null;
    if (ARCADE) {
      panelRevivir = document.createElement('div');
      panelRevivir.style.cssText = [
        'position:absolute;left:0;right:0;bottom:44px;display:none;',
        'flex-direction:column;align-items:center;gap:8px;padding:0 16px;z-index:3'
      ].join('');
      envoltorio.appendChild(panelRevivir);
    }

    // ---------- medidas ----------
    var ANCHO = 320, ALTO = 380;
    var ctx = canvas.getContext('2d');
    var escala = 1;

    function ajustar() {
      var dpr = Math.min(window.devicePixelRatio || 1, 3);
      var w = envoltorio.clientWidth || ANCHO;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(w * (ALTO / ANCHO) * dpr);
      escala = (w / ANCHO) * dpr;
    }

    // ---------- la cara ----------
    var cara = new Image();
    var caraLista = false;
    cara.onload = function () { caraLista = true; };
    cara.onerror = function () {
      if (cfg.respaldo && cara.src.indexOf(cfg.respaldo) === -1) cara.src = cfg.respaldo;
    };
    cara.src = cfg.sprite;

    // ---------- estado ----------
    var RADIO = 21, GRAVEDAD = 1500, IMPULSO = -430;
    var VEL = 132, HUECO = 136, CADA = 1.55;
    var ave, tubos, puntos, estado, desdeUltimo, finEn, chispas, estrellas, popPunto;
    var pausado = false;
    var OBJETIVOS = Array.isArray(cfg.objetivos) ? cfg.objetivos.slice().sort(function (a, b) { return a - b; }) : [];
    var muertesSeguidas = 0;

    // arcade
    var monedas = cfg.monedasIniciales || 0;
    var record = cfg.record || 0;
    var recienRecord = false;
    var racha, mejorRacha, cosas, flotantes, escudo, invulnerable, temblor, estela, zonaActual, avisoZona;

    function siguienteObjetivo() {
      for (var i = 0; i < OBJETIVOS.length; i++) if (puntos < OBJETIVOS[i]) return OBJETIVOS[i];
      return 0;
    }

    /* Si falla tres veces seguidas sin llegar al siguiente premio, el juego se
       ablanda un poco más cada vez, hasta un tope. No se nota jugando, pero
       evita que abandone: un regalo que no se puede abrir no es un regalo. */
    function alivio() {
      if (!SUAVE) return 0;
      return Math.min(1, Math.max(0, (muertesSeguidas - 2) / 4));
    }

    function dificultad() {
      if (!SUAVE) return { vel: VEL, hueco: HUECO, cada: CADA };
      var p = puntos;
      var f = Math.min(1, p / 12);
      var g = Math.max(0, Math.min(1, (p - 25) / 25));
      var a = alivio();
      return {
        vel: 108 + (VEL - 108) * f + 22 * g - 16 * a,
        hueco: 166 - (166 - HUECO) * f - 10 * g + 22 * a,
        cada: 1.75 - (1.75 - CADA) * f - 0.1 * g + 0.15 * a
      };
    }

    function pintarMonedero() {
      if (monederoEl) monederoEl.textContent = '🪙 ' + monedas;
    }

    function sumarMonedas(n) {
      monedas += n;
      pintarMonedero();
      if (cfg.alMoneda) cfg.alMoneda(monedas);
    }

    function flotar(texto, x, y, color) {
      if (!ARCADE) return;
      flotantes.push({ texto: texto, x: x, y: y, vida: 1, color: color || '#e3c07a' });
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
      racha = 0; mejorRacha = 0;
      cosas = []; flotantes = [];
      escudo = false; invulnerable = 0; temblor = 0; estela = [];
      zonaActual = ZONAS[0]; avisoZona = 0;
      recienRecord = false;
      if (EFECTOS && !estrellas) sembrarEstrellas();
      if (panelRevivir) panelRevivir.style.display = 'none';
      pintarMonedero();
      marcador.textContent = etiquetaMarcador(0);
    }

    function volar() {
      if (pausado) return;
      if (estado === 'fin' || estado === 'ganado') {
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

      if (!ARCADE) return;
      // algo que recoger: casi siempre moneda, de vez en cuando un escudo.
      // A veces va pegada al borde del hueco: arriesgar o no es decisión suya
      var r = Math.random();
      if (r < 0.62) {
        var tipo = r < 0.055 ? 'escudo' : 'moneda';
        var desvio = (Math.random() - 0.5) * (hueco * 0.62);
        cosas.push({ x: ANCHO + 60, y: centro + desvio, tipo: tipo, tomada: false, giro: Math.random() * 6 });
      }
    }

    function chocaCon(t) {
      var ancho = 52, izq = t.x, der = t.x + ancho;
      var hueco = t.hueco || HUECO;
      var arriba = t.centro - hueco / 2, abajo = t.centro + hueco / 2;
      var cx = Math.max(izq, Math.min(ave.x, der));
      if (Math.abs(cx - ave.x) > RADIO) return false;
      var cyArriba = Math.min(arriba, Math.max(0, ave.y));
      var cyAbajo = Math.max(abajo, Math.min(ALTO, ave.y));
      var dyA = ave.y - cyArriba, dyB = ave.y - cyAbajo;
      var dx = ave.x - cx;
      return (dx * dx + dyA * dyA < RADIO * RADIO) || (dx * dx + dyB * dyB < RADIO * RADIO);
    }

    function chispear(n, color) {
      if (!EFECTOS) return;
      for (var i = 0; i < n; i++) {
        var a = Math.random() * Math.PI * 2, s = 60 + Math.random() * 160;
        chispas.push({ x: ave.x, y: ave.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, vida: 0.5 + Math.random() * 0.4, color: color });
      }
    }

    function ofrecerRevivir() {
      if (!panelRevivir) return;
      panelRevivir.innerHTML = '';
      if (monedas < COSTO_REVIVIR) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.textContent = 'Seguir por ' + COSTO_REVIVIR + ' 🪙';
      b.style.cssText = [
        'appearance:none;padding:12px 22px;border-radius:999px;border:1px solid #e3c07a;',
        'background:#e3c07a;color:#0b0b0b;font-family:inherit;font-size:11px;letter-spacing:.2em;',
        'text-transform:uppercase;cursor:pointer'
      ].join('');
      b.addEventListener('click', function (e) {
        e.stopPropagation();
        revivir();
      });
      var n = document.createElement('span');
      n.textContent = 'o toca la pantalla para empezar de nuevo';
      n.style.cssText = 'font-size:9.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(245,242,234,.55)';
      panelRevivir.appendChild(b);
      panelRevivir.appendChild(n);
      panelRevivir.style.display = 'flex';
    }

    function revivir() {
      if (monedas < COSTO_REVIVIR) return;
      sumarMonedas(-COSTO_REVIVIR);
      panelRevivir.style.display = 'none';
      // se despeja lo que tenga encima y vuelve al centro, invulnerable un momento
      tubos = tubos.filter(function (t) { return t.x > ave.x + 90 || t.x + 52 < ave.x - 60; });
      cosas = cosas.filter(function (c) { return c.x > ave.x + 90; });
      ave.y = ALTO / 2; ave.v = -160;
      invulnerable = 1.6;
      estado = 'juega';
      muertesSeguidas = Math.max(0, muertesSeguidas - 1);
      sonar('escudo');
      flotar('¡Otra vez!', ave.x, ave.y - 34, '#9ec9e6');
    }

    function perder() {
      estado = 'fin';
      finEn = performance.now();
      muertesSeguidas++;
      temblor = 0.32;
      sonar('perder');
      chispear(14, 'rgba(240,143,164,');
      if (cfg.alPerder) cfg.alPerder(puntos);
      ofrecerRevivir();
    }

    function actualizar(dt) {
      if (pausado) return;

      // adornos que siguen vivos aunque la partida haya acabado
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

      if (ARCADE) {
        for (var f = flotantes.length - 1; f >= 0; f--) {
          flotantes[f].vida -= dt * 1.3;
          flotantes[f].y -= 34 * dt;
          if (flotantes[f].vida <= 0) flotantes.splice(f, 1);
        }
        if (temblor > 0) temblor -= dt;
        if (avisoZona > 0) avisoZona -= dt;
        if (invulnerable > 0) invulnerable -= dt;
      }

      if (estado !== 'juega') return;
      var d = dificultad();
      ave.v += GRAVEDAD * dt;
      ave.y += ave.v * dt;

      if (ARCADE) {
        estela.push({ x: ave.x, y: ave.y });
        if (estela.length > 9) estela.shift();
      }

      desdeUltimo += dt;
      if (desdeUltimo >= d.cada) { desdeUltimo = 0; nuevoTubo(); }

      // cosas que recoger
      if (ARCADE) {
        for (var q = cosas.length - 1; q >= 0; q--) {
          var co = cosas[q];
          co.x -= d.vel * dt;
          co.giro += dt * 3;
          if (co.x < -30) { cosas.splice(q, 1); continue; }
          var dxc = co.x - ave.x, dyc = co.y - ave.y;
          if (!co.tomada && dxc * dxc + dyc * dyc < (RADIO + 13) * (RADIO + 13)) {
            co.tomada = true;
            cosas.splice(q, 1);
            if (co.tipo === 'escudo') {
              escudo = true;
              sonar('escudo');
              flotar('Escudo', ave.x, ave.y - 30, '#9ec9e6');
            } else {
              sumarMonedas(1);
              sonar('moneda');
              chispear(4, 'rgba(227,192,122,');
            }
          }
        }
      }

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
          if (OBJETIVOS.indexOf(puntos) !== -1) muertesSeguidas = 0;

          if (ARCADE) {
            // pasar por el centro del hueco es «perfecto»: encadenarlos da monedas
            var hueco = t.hueco || HUECO;
            if (Math.abs(ave.y - t.centro) < hueco * 0.17) {
              racha++;
              if (racha > mejorRacha) mejorRacha = racha;
              sonar('perfecto');
              var gana = racha >= 3 ? 2 : 1;
              sumarMonedas(gana);
              flotar(racha >= 3 ? 'PERFECTO x' + racha : 'PERFECTO', ave.x + 8, ave.y - 30, '#f5f2ea');
            } else {
              racha = 0;
            }

            // zona nueva cada 10 puntos: el juego no se queda igual nunca
            var z = zonaDe(puntos);
            if (z !== zonaActual) {
              zonaActual = z;
              avisoZona = 2.2;
              sonar('zona');
              sumarMonedas(3);
              if (cfg.alZona) cfg.alZona(z, Math.floor(puntos / ZONA_CADA));
            }

            if (record && puntos === record + 1) {
              recienRecord = true;
              flotar('¡RÉCORD!', ave.x + 6, ave.y - 46, '#e3c07a');
              sonar('record');
              if (cfg.alRecord) cfg.alRecord(puntos);
            }
          }

          if (cfg.alPunto) cfg.alPunto(puntos);
          if (pausado) return;   // quien escucha puede haber parado para dar el premio

          if (OBJETIVO && !premiado && puntos >= OBJETIVO) {
            premiado = true;
            if (cfg.seguirTrasMeta) {
              ganar();
            } else {
              estado = 'ganado';
              ganar();
              return;
            }
          }
        }
        if (t.x < -70) tubos.splice(i, 1);
        if (chocaCon(t)) {
          if (ARCADE && invulnerable > 0) continue;
          if (ARCADE && escudo) {
            escudo = false;
            invulnerable = 1.1;
            racha = 0;
            temblor = 0.2;
            sonar('romper');
            chispear(12, 'rgba(158,201,230,');
            flotar('Escudo roto', ave.x, ave.y - 30, '#9ec9e6');
            continue;
          }
          perder();
          return;
        }
      }

      if (ave.y + RADIO > ALTO || ave.y - RADIO < 0) {
        if (!(ARCADE && invulnerable > 0)) {
          ave.y = Math.max(RADIO, Math.min(ALTO - RADIO, ave.y));
          perder();
        }
      }
    }

    // ---------- dibujo ----------
    function paleta() { return ARCADE ? zonaActual : ZONAS[0]; }

    function tubo(x, y0, y1) {
      var z = paleta();
      var g = ctx.createLinearGradient(x, 0, x + 52, 0);
      g.addColorStop(0, z.tubo[0]);
      g.addColorStop(0.5, z.tubo[1]);
      g.addColorStop(1, z.tubo[0]);
      ctx.fillStyle = g;
      ctx.fillRect(x, y0, 52, y1 - y0);
      ctx.strokeStyle = z.borde;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y0 + 0.75, 50.5, y1 - y0 - 1.5);
    }

    function texto(t, y, tam, color, peso) {
      ctx.fillStyle = color;
      ctx.font = (peso || '300') + ' ' + tam + 'px "Helvetica Neue", Helvetica, Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(t, ANCHO / 2, y);
    }

    function dibujarCosa(co) {
      ctx.save();
      ctx.translate(co.x, co.y);
      if (co.tipo === 'escudo') {
        ctx.rotate(Math.sin(co.giro) * 0.3);
        ctx.strokeStyle = '#9ec9e6';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(0, -11); ctx.lineTo(9, -6); ctx.lineTo(9, 4);
        ctx.lineTo(0, 12); ctx.lineTo(-9, 4); ctx.lineTo(-9, -6);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(158,201,230,.22)';
        ctx.fill();
      } else {
        // la moneda gira: se estrecha y se ensancha
        var ancho = Math.abs(Math.cos(co.giro)) * 9 + 1.6;
        ctx.fillStyle = '#e3c07a';
        ctx.beginPath();
        ctx.ellipse(0, 0, ancho, 9.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(120,90,30,.65)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }
      ctx.restore();
    }

    function pintar() {
      var sx = 0, sy = 0;
      if (ARCADE && temblor > 0) {
        sx = (Math.random() - 0.5) * 12 * temblor;
        sy = (Math.random() - 0.5) * 12 * temblor;
      }
      ctx.setTransform(escala, 0, 0, escala, sx * escala, sy * escala);
      ctx.clearRect(-20, -20, ANCHO + 40, ALTO + 40);

      var z = paleta();
      var cielo = ctx.createLinearGradient(0, 0, 0, ALTO);
      cielo.addColorStop(0, z.cielo[0]);
      cielo.addColorStop(1, z.cielo[1]);
      ctx.fillStyle = cielo;
      ctx.fillRect(-20, -20, ANCHO + 40, ALTO + 40);

      if (EFECTOS && estrellas) {
        for (var s = 0; s < estrellas.length; s++) {
          var e = estrellas[s];
          ctx.fillStyle = 'rgba(' + z.polvo + ',' + e.a + ')';
          ctx.beginPath(); ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2); ctx.fill();
        }
      }

      for (var i = 0; i < tubos.length; i++) {
        var t = tubos[i];
        var hueco = t.hueco || HUECO;
        tubo(t.x, -2, t.centro - hueco / 2);
        tubo(t.x, t.centro + hueco / 2, ALTO + 2);
      }

      if (ARCADE) for (var q = 0; q < cosas.length; q++) dibujarCosa(cosas[q]);

      if (EFECTOS) {
        for (var k = 0; k < chispas.length; k++) {
          var c = chispas[k];
          ctx.fillStyle = c.color + Math.max(0, Math.min(1, c.vida * 1.6)) + ')';
          ctx.beginPath(); ctx.arc(c.x, c.y, 2, 0, Math.PI * 2); ctx.fill();
        }
      }

      // la estela de la cara
      if (ARCADE && estado === 'juega') {
        for (var g2 = 0; g2 < estela.length; g2++) {
          var pt = estela[g2];
          ctx.fillStyle = 'rgba(' + z.polvo + ',' + (0.045 * (g2 / estela.length)) + ')';
          ctx.beginPath(); ctx.arc(pt.x, pt.y, RADIO * 0.9, 0, Math.PI * 2); ctx.fill();
        }
      }

      // la cara, girando un poco según cae o sube
      ctx.save();
      ctx.translate(ave.x, ave.y);
      ctx.rotate(Math.max(-0.5, Math.min(0.9, ave.v / 700)));
      var parpadeo = ARCADE && invulnerable > 0 && Math.floor(invulnerable * 12) % 2 === 0;
      if (parpadeo) ctx.globalAlpha = 0.45;
      if (caraLista) {
        var dTam = RADIO * 2.7;
        ctx.drawImage(cara, -dTam / 2, -dTam / 2, dTam, dTam);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, RADIO, 0, Math.PI * 2);
        ctx.fillStyle = '#e3c07a';
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      if (ARCADE && escudo) {
        ctx.strokeStyle = 'rgba(158,201,230,.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.arc(ave.x, ave.y, RADIO + 8 + Math.sin(performance.now() / 180) * 1.6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // textos que suben y se desvanecen
      if (ARCADE) {
        for (var fl = 0; fl < flotantes.length; fl++) {
          var ft = flotantes[fl];
          ctx.globalAlpha = Math.max(0, Math.min(1, ft.vida));
          ctx.fillStyle = ft.color;
          ctx.font = '400 13px "Helvetica Neue", Helvetica, Arial, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(ft.texto, ft.x, ft.y);
          ctx.globalAlpha = 1;
        }
      }

      if (EFECTOS && estado === 'juega') {
        var tam = 34 + (popPunto > 0 ? popPunto * 30 : 0);
        var yMarcador = OBJETIVOS.length ? 92 : 58;
        texto(String(puntos), yMarcador, tam, 'rgba(245,242,234,' + (popPunto > 0 ? 0.95 : 0.4) + ')', '200');
      }

      // cuánto falta para el siguiente premio
      if (OBJETIVOS.length && estado !== 'fin') {
        var meta = siguienteObjetivo();
        if (meta) {
          var desde = 0;
          for (var o = 0; o < OBJETIVOS.length; o++) if (OBJETIVOS[o] < meta) desde = OBJETIVOS[o];
          var avance = Math.max(0, Math.min(1, (puntos - desde) / (meta - desde)));
          var ancho = ANCHO - 48;
          ctx.fillStyle = 'rgba(245,242,234,0.14)';
          ctx.fillRect(24, 18, ancho, 3);
          ctx.fillStyle = '#e3c07a';
          ctx.fillRect(24, 18, ancho * avance, 3);
          var faltan = meta - puntos;
          texto(faltan === 1 ? '1 punto para el siguiente premio' : faltan + ' puntos para el siguiente premio',
                38, 10.5, 'rgba(245,242,234,0.5)');
        } else if (ARCADE) {
          texto('Zona ' + (Math.floor(puntos / ZONA_CADA) + 1) + ' · ' + zonaActual.nombre, 30, 10.5, 'rgba(245,242,234,0.45)');
        } else {
          texto('Los tienes todos', 30, 11, 'rgba(227,192,122,0.75)');
        }
      } else if (ARCADE && estado === 'juega') {
        texto('Zona ' + (Math.floor(puntos / ZONA_CADA) + 1) + ' · ' + zonaActual.nombre, 24, 10.5, 'rgba(245,242,234,0.4)');
      }

      // aviso grande de zona nueva
      if (ARCADE && avisoZona > 0) {
        ctx.globalAlpha = Math.min(1, avisoZona / 0.6);
        texto(zonaActual.nombre.toUpperCase(), ALTO / 2 - 96, 20, '#f5f2ea', '200');
        texto('zona ' + (Math.floor(puntos / ZONA_CADA) + 1) + ' · +3 🪙', ALTO / 2 - 76, 10.5, 'rgba(245,242,234,.6)');
        ctx.globalAlpha = 1;
      }

      // a punto de batir el récord
      if (ARCADE && estado === 'juega' && record > 4 && puntos >= record - 2 && puntos <= record) {
        texto(puntos === record ? 'un punto más y es tu récord' : 'vas a por tu récord',
              ALTO - 22, 11, 'rgba(227,192,122,.8)');
      }

      if (estado === 'espera') {
        texto('Toca para empezar', ALTO / 2 - 62, 15, 'rgba(245,242,234,0.85)');
        texto(cfg.pista || (OBJETIVO + ' puntos y hay premio'), ALTO / 2 - 40, 11, 'rgba(245,242,234,0.45)');
      } else if (estado === 'fin') {
        ctx.fillStyle = 'rgba(5,5,7,0.72)';
        ctx.fillRect(-20, -20, ANCHO + 40, ALTO + 40);
        var meta2 = siguienteObjetivo();
        var faltaban = meta2 ? meta2 - puntos : 0;
        var titulo = recienRecord ? '¡Nuevo récord!' : faltaban === 1 ? '¡A un punto!' : faltaban === 2 ? '¡A dos puntos!' : 'Casi';
        var linea = cfg.textoFin ? cfg.textoFin(puntos, faltaban) : null;
        if (!linea) {
          linea = meta2
            ? (faltaban <= 2 ? 'Otra vez y es tuyo · toca para volar' : faltaban + ' más para el premio · toca para volar')
            : puntos + (puntos === 1 ? ' punto' : ' puntos') + ' · toca para reintentar';
        }
        texto(titulo, ALTO / 2 - 40, 26, '#f5f2ea');
        texto(linea, ALTO / 2 - 12, 12, 'rgba(245,242,234,0.6)');
        if (ARCADE) {
          var resumen = 'racha máxima ' + mejorRacha + ' · monedero ' + monedas + ' 🪙';
          texto(resumen, ALTO / 2 + 10, 10.5, 'rgba(245,242,234,0.45)');
        }
        if (muertesSeguidas >= 3 && meta2) {
          texto('(te lo estoy poniendo más fácil)', ALTO / 2 + 30, 10, 'rgba(227,192,122,0.5)');
        }
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
    if (window.ResizeObserver) new ResizeObserver(ajustar).observe(envoltorio);
    else window.addEventListener('resize', ajustar);
    reiniciar();

    caja.juego = {
      reiniciar: reiniciar,
      sonar: sonar,
      pausar: function () { pausado = true; },
      reanudar: function () { pausado = false; previo = 0; },
      monedas: function () { return monedas; },
      ponerRecord: function (n) { record = n || 0; },
      estado: function () { return { estado: estado, puntos: puntos, pausado: pausado, monedas: monedas, racha: racha }; }
    };

    if (cfg.depurar) {
      window.__juego = {
        estado: caja.juego.estado,
        puntuar: function (n) {
          puntos = n;
          if (ARCADE) zonaActual = zonaDe(puntos);
          marcador.textContent = etiquetaMarcador(puntos);
          if (cfg.alPunto) cfg.alPunto(puntos);
        },
        monedar: function (n) { sumarMonedas(n); },
        forzarVictoria: function () {
          puntos = OBJETIVO;
          premiado = true;
          if (!cfg.seguirTrasMeta) estado = 'ganado';
          ganar();
        },
        volar: volar,
        perder: perder
      };
    }

    if (cfg.alMontar) cfg.alMontar({ premio: premio, ayuda: ayuda });

    if (window.__flappyRAF) cancelAnimationFrame(window.__flappyRAF);
    window.__flappyRAF = requestAnimationFrame(bucle);

    return caja;
  };
})();
