// Chiebuka Wellington: portfolio scripts.
(() => {
  'use strict';
  const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---------------------------------------------------------------------------
  // Shared: columns of falling digits with a bright head, a fading tail and flicker.
  // opaque = true paints a solid background each frame; false leaves it transparent.
  // ---------------------------------------------------------------------------
  function createRain(canvas, { scale = 1, opaque = true } = {}) {
    const ctx = canvas.getContext('2d');
    const size = 16;
    const digit = () => String((Math.random() * 10) | 0);
    let width = 0, height = 0, rows = 0, cols = [], running = true, last = 0;

    function makeColumn() {
      return { head: -Math.random() * rows, speed: (0.25 + Math.random() * 0.7) * scale, len: 8 + Math.random() * 28,
               chars: Array.from({ length: rows }, digit) };
    }
    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth; height = window.innerHeight;
      canvas.width = width * dpr; canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      rows = Math.ceil(height / size) + 1;
      cols = Array.from({ length: Math.floor(width / size) + 1 }, makeColumn);
    }
    function frame(t) {
      if (!running) return;
      if (t - last >= 1000 / 30) {
        last = t;
        if (opaque) { ctx.fillStyle = '#00080a'; ctx.fillRect(0, 0, width, height); }
        else ctx.clearRect(0, 0, width, height);
        ctx.font = '600 ' + (size - 2) + 'px ui-monospace, Menlo, Consolas, monospace';
        ctx.textBaseline = 'top';
        for (let i = 0; i < cols.length; i++) {
          const c = cols[i];
          c.head += c.speed;
          if (c.head - c.len > rows) Object.assign(c, makeColumn(), { head: -Math.random() * 12 });
          const first = Math.max(0, Math.floor(c.head - c.len));
          const lastRow = Math.min(rows - 1, Math.floor(c.head));
          for (let r = first; r <= lastRow; r++) {
            const d = c.head - r;
            if (Math.random() < 0.03) c.chars[r] = digit();
            if (d < 1.2) { ctx.shadowColor = '#17e05c'; ctx.shadowBlur = 10; ctx.fillStyle = '#eafff1'; }
            else { ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(23, 224, 92, ' + Math.max(0.08, 1 - d / c.len).toFixed(2) + ')'; }
            ctx.fillText(c.chars[r], i * size, r * size);
          }
        }
        ctx.shadowBlur = 0;
      }
      requestAnimationFrame(frame);
    }
    resize();
    window.addEventListener('resize', resize);
    requestAnimationFrame(frame);
    return { stop() { running = false; window.removeEventListener('resize', resize); } };
  }

  const toBinary = (text) => Array.from(text).map((ch) => ch.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');

  // ---------------------------------------------------------------------------
  // Comment pins on the drawing. Click them in order 1, 2, 3, 4 to review the work.
  // ---------------------------------------------------------------------------
  const wraps = Array.from(document.querySelectorAll('.pin-wrap'));
  let clickOrder = [];

  function setOpen(wrap, open) {
    wrap.querySelector('.pin').setAttribute('aria-expanded', String(open));
    wrap.querySelector('.pin-note').hidden = !open;
  }
  function closeAll(except) {
    wraps.forEach((w) => { if (w !== except) setOpen(w, false); });
  }
  function trackOrder(pin) {
    const n = Number(pin.textContent);
    if (!Number.isFinite(n) || n > 4) return;
    clickOrder = clickOrder.concat(n).slice(-4);
    if (clickOrder.join() === '1,2,3,4') revealApproval();
  }
  function revealApproval() {
    const egg = document.querySelector('.egg-pin');
    if (!egg || !egg.hidden) return;
    egg.hidden = false;
    setTimeout(() => { closeAll(egg); setOpen(egg, true); }, 700);
  }

  wraps.forEach((wrap) => {
    const pin = wrap.querySelector('.pin');
    pin.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = pin.getAttribute('aria-expanded') !== 'true';
      closeAll(wrap);
      setOpen(wrap, willOpen);
      trackOrder(pin);
    });
    wrap.querySelectorAll('.pin-note a').forEach((a) => a.addEventListener('click', () => setOpen(wrap, false)));
  });
  document.addEventListener('click', (event) => { if (!event.target.closest('.pin-wrap')) closeAll(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      const open = wraps.find((w) => w.querySelector('.pin').getAttribute('aria-expanded') === 'true');
      closeAll();
      if (open) open.querySelector('.pin').focus();
    }
  });

  // ---------------------------------------------------------------------------
  // Nav: underline the link for the section on screen.
  // ---------------------------------------------------------------------------
  const links = Array.from(document.querySelectorAll('.bar nav a[href^="#"]'));
  const byId = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
  if ('IntersectionObserver' in window) {
    const seen = new Map();
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((e) => seen.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0));
      let best = null;
      byId.forEach((_, id) => { if ((seen.get(id) || 0) > (best ? seen.get(best) : 0)) best = id; });
      links.forEach((a) => a.removeAttribute('aria-current'));
      if (best) byId.get(best).setAttribute('aria-current', 'true');
    }, { rootMargin: '-20% 0px -45% 0px', threshold: [0, 0.1, 0.3, 0.6, 1] });
    byId.forEach((_, id) => { const el = document.getElementById(id); if (el) observer.observe(el); });
  }

  // Skill icons come from skillicons.dev. If one cannot load, show a lettered tile instead.
  document.querySelectorAll('img.ico').forEach((img) => {
    img.addEventListener('error', () => {
      const tile = document.createElement('span');
      tile.className = 'ico mono';
      tile.setAttribute('aria-hidden', 'true');
      tile.textContent = img.dataset.fallback || '';
      img.replaceWith(tile);
    });
  });

  // ---------------------------------------------------------------------------
  // Intro: falling digits, then a message that arrives as binary and decodes into text.
  // Skippable. Plays every time the page opens, never with reduced motion.
  // ---------------------------------------------------------------------------
  (() => {
    const root = document.documentElement;
    const intro = document.getElementById('intro');
    if (!root.classList.contains('intro') || !intro) return;

    const MESSAGE_1 = 'Hello. My name is Chiebuka Wellington.';
    const MESSAGE_2 = 'There is only one rule. Develop great things.';
    // Easter egg: the binary that streams in at the start is not the greeting. Decode it to read this.
    const EASTER_EGG = "you're such a nerd. respect.";

    // Timing (milliseconds). Bigger numbers = slower. Change these to tune the intro.
    const T = {
      start: 500,        // pause before the binary starts
      byte: 45,          // time per byte of binary
      afterBinary: 500,  // pause once the binary is complete
      line1: 55,         // typing speed for the greeting
      between: 500,      // pause between the two lines
      line2: 65,         // typing speed for the rule
      hold: 1300,        // how long the finished message stays before fading
      rain: 0.6,         // falling speed of the digits (1 = original)
    };

    const page = [document.querySelector('.bar'), document.querySelector('main'), document.querySelector('.foot')].filter(Boolean);
    page.forEach((el) => { el.inert = true; });

    const rain = createRain(document.getElementById('rain'), { scale: T.rain, opaque: true });

    const timers = [];
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));

    function type(el, text, speed, onDone, scramble) {
      el.classList.add('typing');
      let i = 0;
      const next = () => {
        i++;
        if (i < text.length) later(step, speed * 0.6);
        else { el.classList.remove('typing'); if (onDone) onDone(); }
      };
      const step = () => {
        const shown = text.slice(0, i + 1);
        if (scramble && text[i] !== ' ') {
          el.textContent = text.slice(0, i) + (Math.random() < 0.5 ? '0' : '1'); // each letter flashes as a 0 or 1
          later(() => { el.textContent = shown; next(); }, speed * 0.5);
        } else { el.textContent = shown; next(); }
      };
      step();
    }

    const bits = document.getElementById('intro-bits');
    const line1 = document.getElementById('intro-line1');
    const line2 = document.getElementById('intro-line2');
    const bytes = toBinary(EASTER_EGG).split(' ');

    function streamBinary(i) {
      bits.classList.add('typing');
      bits.textContent = bytes.slice(0, i + 1).join(' ');
      if (i + 1 < bytes.length) { later(() => streamBinary(i + 1), T.byte); return; }
      bits.classList.remove('typing');
      later(() => {
        bits.classList.add('dim');
        type(line1, MESSAGE_1, T.line1, () => later(() => type(line2, MESSAGE_2, T.line2, () => later(finish, T.hold)), T.between), true);
      }, T.afterBinary);
    }
    later(() => streamBinary(0), T.start);

    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      timers.forEach(clearTimeout);
      intro.classList.add('done');
      setTimeout(() => {
        rain.stop();
        root.classList.remove('intro');
        page.forEach((el) => { el.inert = false; });
      }, 650);
    }
    document.getElementById('intro-skip').addEventListener('click', finish);
    intro.addEventListener('click', finish);
    window.addEventListener('keydown', (e) => {
      if (!finished && (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ')) finish();
    });
    document.getElementById('intro-skip').focus();
  })();

  // ---------------------------------------------------------------------------
  // Easter eggs
  // ---------------------------------------------------------------------------

  // 1. Console note for anyone who opens the developer tools.
  console.log('%cHello, curious one.', 'font: 700 18px ui-monospace, Menlo, monospace; color: #17e05c; background: #00080a; padding: 6px 12px;');
  console.log("Reading the console? Let's talk: cdwellington@mun.ca");
  console.log('There are a few more things hidden around this page.');

  // 2. Tab title joke.
  const realTitle = document.title;
  document.addEventListener('visibilitychange', () => {
    document.title = document.hidden ? "Come back, I'm still compiling" : realTitle;
  });

  // 3. Double-click the name to see it in binary, and again to bring it back.
  const nameEl = document.getElementById('name');
  if (nameEl) {
    const realName = nameEl.textContent.trim();
    let asBinary = false;
    nameEl.setAttribute('aria-label', realName);
    nameEl.addEventListener('dblclick', () => {
      asBinary = !asBinary;
      nameEl.classList.toggle('as-binary', asBinary);
      nameEl.textContent = asBinary ? toBinary(realName) : realName;
      if (window.getSelection) window.getSelection().removeAllRanges();
    });
  }

  // 4. Konami code (up up down down left right left right b a) brings the rain back over the page.
  const KONAMI = ['arrowup', 'arrowup', 'arrowdown', 'arrowdown', 'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a'];
  let typed = [];
  let rainOn = false;
  function konamiRain() {
    if (rainOn || reduceMotion) return;
    rainOn = true;
    const layer = document.createElement('div');
    layer.className = 'egg-rain';
    layer.setAttribute('aria-hidden', 'true');
    layer.innerHTML = '<canvas></canvas><p>Konami code accepted. Nice.</p>';
    document.body.appendChild(layer);
    const rain = createRain(layer.querySelector('canvas'), { scale: 1, opaque: false });
    let done = false;
    const end = () => {
      if (done) return;
      done = true;
      layer.classList.add('out');
      setTimeout(() => { rain.stop(); layer.remove(); rainOn = false; }, 650);
    };
    layer.addEventListener('click', end);
    window.addEventListener('keydown', function onKey(e) { if (e.key === 'Escape') { end(); window.removeEventListener('keydown', onKey); } });
    setTimeout(end, 7000);
  }
  window.addEventListener('keydown', (e) => {
    typed = typed.concat(e.key.toLowerCase()).slice(-KONAMI.length);
    if (typed.join() === KONAMI.join()) { typed = []; konamiRain(); }
  });
})();
