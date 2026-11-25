/* CRS Aircon — "Comfort, by design" v4. No dependencies, no network calls, no storage.
   Every feature is isolated so one failure cannot take down the page. */
(() => {
  'use strict';
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduceMQ = matchMedia('(prefers-reduced-motion: reduce)');
  const state = { reduce: reduceMQ.matches, paused: reduceMQ.matches, brief: '', briefKind: '', brands: new Set(), area: '' };
  const PHONE = '919840073436';
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(SVGNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };
  const safe = (name, fn) => { try { fn(); } catch (e) { console.error('[crs] ' + name + ' failed:', e); } };

  root.classList.add('js-ready');
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-loaded')));
  const yearEl = $('#year'); if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Open / closed status (Asia/Kolkata, hours as published: every day, 9 AM to 9 PM) ---------- */
  safe('status', () => {
    const nodes = $$('[data-open-status]');
    if (!nodes.length || !window.Intl) return;
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false });
    const compute = () => {
      const p = Object.fromEntries(fmt.formatToParts(new Date()).map(x => [x.type, x.value]));
      const day = p.weekday; const mins = (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10);
      const open = mins >= 540 && mins < 1260;
      let text;
      if (open) text = 'Open now · until 9 PM';
      else if (mins < 540) text = 'Opens today · 9 AM';
      else text = 'Closed · opens tomorrow 9 AM';
      return { open, text };
    };
    const paint = () => {
      const s = compute();
      nodes.forEach(n => { n.classList.toggle('is-closed', !s.open); const t = $('.status-text', n); if (t) t.textContent = s.text; });
    };
    paint(); setInterval(paint, 60000);
  });

  /* ---------- Header, progress, current section ---------- */
  safe('header', () => {
    const header = $('#site-header'); const nav = $('#navigation'); const btn = $('.menu-btn');
    const bar = $('.progress span'); const label = $('.menu-label', btn);
    let last = scrollY, ticking = false;
    const onScroll = () => {
      ticking = false;
      const y = scrollY; const max = document.documentElement.scrollHeight - innerHeight;
      header.classList.toggle('is-scrolled', y > 24);
      if (bar) bar.parentElement.style.setProperty('--p', max > 0 ? (y / max).toFixed(4) : 0);
      const menuOpen = btn.getAttribute('aria-expanded') === 'true';
      const ae = document.activeElement; const focusIn = header.contains(ae) && ae !== document.body && ae.matches(':focus-visible');
      if (!menuOpen && !focusIn) {
        if (y > last + 6 && y > 360) header.classList.add('is-hidden');
        else if (y < last - 6 || y < 200) header.classList.remove('is-hidden');
      }
      last = y;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
    header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
    const setMenu = open => {
      btn.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open); header.classList.toggle('menu-open', open); document.body.classList.toggle('menu-open', open);
      if (label) label.textContent = open ? 'Close' : 'Menu';
    };
    btn.addEventListener('click', () => setMenu(btn.getAttribute('aria-expanded') !== 'true'));
    $$('a', nav).forEach(a => a.addEventListener('click', () => setMenu(false)));
    addEventListener('keydown', e => { if (e.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') { setMenu(false); btn.focus(); } });
    matchMedia('(min-width:1021px)').addEventListener('change', e => { if (e.matches) setMenu(false); });
    // active section
    const links = $$('a[href^="#"]', nav).filter(a => !a.classList.contains('btn'));
    const map = new Map(links.map(a => [a.getAttribute('href').slice(1), a]));
    const io = new IntersectionObserver(es => es.forEach(e => {
      const a = map.get(e.target.id); if (!a) return;
      if (e.isIntersecting) { links.forEach(l => l.classList.remove('is-current')); a.classList.add('is-current'); }
    }), { rootMargin: '-45% 0px -50% 0px' });
    map.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });
  });

  /* ---------- Reveal on scroll + counters ---------- */
  safe('reveal', () => {
    const items = $$('[data-reveal]');
    const groups = new Map();
    items.forEach(el => { const p = el.parentElement; const i = groups.get(p) || 0; groups.set(p, i + 1); el.style.setProperty('--d', Math.min(i * 0.08, 0.4) + 's'); });
    if (!('IntersectionObserver' in window)) { items.forEach(i => i.classList.add('in')); return; }
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    items.forEach(i => io.observe(i));
    // counters
    const year = new Date().getFullYear();
    $$('[data-count]').forEach(el => {
      const target = el.dataset.since ? year - parseInt(el.dataset.since, 10) : parseInt(el.textContent, 10);
      el.textContent = target;
      if (state.reduce) return;
      const cio = new IntersectionObserver(es => es.forEach(e => {
        if (!e.isIntersecting) return; cio.disconnect();
        const t0 = performance.now(); const dur = 1400;
        const step = now => { const t = clamp((now - t0) / dur, 0, 1); el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3))); if (t < 1) requestAnimationFrame(step); };
        el.textContent = 0; requestAnimationFrame(step);
      }), { threshold: 0.6 });
      cio.observe(el);
    });
  });

  /* ---------- Cursor + magnetic buttons (fine pointers only) ---------- */
  safe('cursor', () => {
    if (state.reduce || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    root.classList.add('has-cursor');
    const c = $('.cursor'); let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y, rx = x, ry = y;
    addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    const loop = () => { x = lerp(x, tx, 0.35); y = lerp(y, ty, 0.35); rx = lerp(rx, tx, 0.14); ry = lerp(ry, ty, 0.14);
      c.firstElementChild.style.transform = `translate(${x}px,${y}px)`; c.lastElementChild.style.transform = `translate(${rx}px,${ry}px) scale(${c.classList.contains('hover') ? 1.6 : 1})`;
      requestAnimationFrame(loop); };
    loop();
    document.addEventListener('pointerover', e => { c.classList.toggle('hover', !!e.target.closest('a,button,summary,label,input,textarea,.panel')); });
    $$('.magnetic').forEach(m => {
      m.addEventListener('pointermove', e => { const r = m.getBoundingClientRect(); const dx = (e.clientX - (r.left + r.width / 2)) / r.width; const dy = (e.clientY - (r.top + r.height / 2)) / r.height; m.style.transform = `translate(${dx * 10}px,${dy * 8}px)`; });
      m.addEventListener('pointerleave', () => { m.style.transform = ''; });
    });
  });

  /* ---------- Hero: airflow canvas, mood dial, motion control ---------- */
  safe('hero', () => {
    const hero = $('.hero'); const cv = $('.airflow'); const img = $('.hero-bg img');
    const dial = $('.dial'); const range = $('#cool-range'); const out = $('#cool-label');
    const mbtn = $('.motion-btn');
    const ctx = cv.getContext('2d');
    const mobileMQ = matchMedia('(max-width:700px)');
    let W = 0, H = 0, dpr = 1, parts = [], cool = 0.45, visible = true, rafId = 0, last = 0, t = 0;
    const mouse = { x: -999, y: -999 };
    const moods = [[20, 'Warm afternoon'], [45, 'Taking the edge off'], [70, 'Gently cooled'], [90, 'Comfortably cool'], [101, 'Fully cooled']];
    const setCool = v => {
      cool = clamp(v / 100, 0, 1); hero.style.setProperty('--cool', cool.toFixed(3)); hero.dataset.cool = v;
      if (out) out.textContent = moods.find(m => v < m[0])[1];
    };
    if (dial && range) { dial.hidden = false; setCool(+range.value); range.addEventListener('input', () => { setCool(+range.value); if (!rafId && !state.paused) start(); else if (state.paused) frame(0, true); }); }
    const geom = () => {
      const m = mobileMQ.matches;
      const iw = m ? 900 : 1920, ih = m ? 1200 : 1080; const px = m ? 0.72 : 0.62, py = m ? 0.5 : 0.55;
      const s = Math.max(W / iw, H / ih); const dw = iw * s, dh = ih * s;
      const ox = (W - dw) * px, oy = (H - dh) * py;
      const ax = m ? 0.72 : 0.71, ay = m ? 0.207 : 0.205; const hw = (m ? 0.115 : 0.052) * dw;
      return { x: ox + ax * dw, y: oy + ay * dh, hw, scale: s };
    };
    const resize = () => {
      const r = hero.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const nz = (x, y, tt) => Math.sin(x * 0.011 + tt * 0.6) + Math.sin(y * 0.014 - tt * 0.45) + Math.sin((x + y) * 0.007 + tt * 0.3);
    const spawn = g => {
      const sp = lerp(0.7, 1.6, cool) * Math.max(0.6, g.scale * 0.9);
      parts.push({ x: g.x + (Math.random() * 2 - 1) * g.hw, y: g.y + 2, vx: (Math.random() - 0.65) * 0.5 * sp, vy: (0.6 + Math.random() * 0.7) * sp, life: 0, max: 150 + Math.random() * 170, w: 0.8 + Math.random() * 1.6, px: 0, py: 0 });
    };
    const frame = (now, once) => {
      const dt = once ? 16 : Math.min(now - last, 40); last = now; t += dt / 1000;
      const g = geom(); const cap = mobileMQ.matches ? 90 : 210;
      ctx.clearRect(0, 0, W, H); ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'round';
      const want = Math.round(lerp(0.15, 1, cool) * cap);
      let spawnN = clamp(Math.ceil(want / 70), 1, 5);
      if (!once) while (spawnN-- > 0 && parts.length < want) spawn(g);
      const r = [lerp(255, 215, cool), lerp(246, 252, cool), lerp(232, 250, cool)];
      const k = dt / 16;
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i]; p.px = p.x; p.py = p.y;
        const a = Math.PI / 2 + nz(p.x, p.y, t) * 0.34;
        p.vx += Math.cos(a) * 0.03 * k - 0.004 * k; p.vy += Math.sin(a) * 0.012 * k;
        p.vx *= 0.99; p.vy *= 0.994;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 14400) { const d = Math.sqrt(d2) || 1; const f = (1 - d / 120) * 1.4; p.vx += dx / d * f * 0.35; p.vy += dy / d * f * 0.35; }
        p.x += p.vx * k; p.y += p.vy * k; p.life += k;
        const lt = p.life / p.max; const alpha = Math.sin(clamp(lt, 0, 1) * Math.PI) * (0.1 + cool * 0.36);
        if (lt >= 1 || p.y > H + 20) { parts.splice(i, 1); continue; }
        const lw = p.w * Math.max(0.8, g.scale * 0.9); const tx = p.x - p.vx * 15, ty = p.y - p.vy * 15;
        ctx.strokeStyle = `rgba(${r[0] | 0},${r[1] | 0},${r[2] | 0},${(alpha * 0.28).toFixed(3)})`; ctx.lineWidth = lw * 3.4;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(p.x, p.y); ctx.stroke();
        ctx.strokeStyle = `rgba(${r[0] | 0},${r[1] | 0},${r[2] | 0},${Math.min(alpha * 1.5, 0.7).toFixed(3)})`; ctx.lineWidth = lw;
        ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(p.x, p.y); ctx.stroke();
      }
      if (!once && visible && !state.paused && !document.hidden) rafId = requestAnimationFrame(frame); else rafId = 0;
    };
    const start = () => { if (rafId || state.paused || !visible || document.hidden) return; last = performance.now(); rafId = requestAnimationFrame(frame); };
    const stop = () => { cancelAnimationFrame(rafId); rafId = 0; };
    resize(); new ResizeObserver(() => { resize(); if (state.paused) frame(0, true); }).observe(hero);
    hero.addEventListener('pointermove', e => { const r = hero.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; }, { passive: true });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });
    new IntersectionObserver(es => { visible = es[0].isIntersecting; visible ? start() : stop(); }).observe(hero);
    document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
    // pre-warm so the first frame already has airflow, then either run or hold a still frame
    const g0 = geom(); for (let i = 0; i < 90; i++) { spawn(g0); parts[i].life = Math.random() * 90; parts[i].y += Math.random() * 120; }
    if (state.paused) frame(0, true); else start();
    if (mbtn) {
      const apply = () => {
        root.classList.toggle('motion-paused', state.paused); mbtn.setAttribute('aria-pressed', String(state.paused));
        mbtn.lastElementChild.textContent = state.paused ? 'Play motion' : 'Pause motion';
        mbtn.firstElementChild.firstElementChild.setAttribute('href', state.paused ? '#i-play' : '#i-pause');
        if (state.paused) { stop(); frame(0, true); } else start();
      };
      if (!reduceMQ.matches) { mbtn.hidden = false; }
      mbtn.addEventListener('click', () => { state.paused = !state.paused; apply(); });
      reduceMQ.addEventListener('change', e => { state.reduce = e.matches; state.paused = e.matches; apply(); });
      apply();
    }
  });

  /* ---------- Spaces panels ---------- */
  safe('panels', () => {
    const panels = $$('.panel'); let timer = 0;
    const activate = p => panels.forEach(x => { const on = x === p; x.classList.toggle('is-active', on); const h = $('.panel-hit', x); if (h) h.setAttribute('aria-expanded', String(on)); });
    panels.forEach(p => {
      $('.panel-hit', p).addEventListener('click', () => activate(p));
      p.addEventListener('focusin', () => activate(p));
      p.addEventListener('pointerenter', e => { if (e.pointerType !== 'mouse' || !matchMedia('(min-width:861px)').matches) return; clearTimeout(timer); timer = setTimeout(() => activate(p), 140); });
      p.addEventListener('pointerleave', () => clearTimeout(timer));
    });
  });

  /* ---------- How it works: cooling-cycle explorer ---------- */
  safe('anatomy', () => {
    const steps = [
      ['Step 1 of 5 · Absorb', 'The indoor coil takes heat from your room.', 'A fan pulls warm room air across a cold coil. The refrigerant inside absorbs the heat, and the cooled air is sent back into the room.', 'Where will the indoor unit sit, and will its airflow reach the places you actually use?'],
      ['Step 2 of 5 · Compress', 'The compressor squeezes the refrigerant.', 'The refrigerant returns outdoors as a low-pressure gas. The compressor squeezes it, raising its pressure and temperature so its heat can be released into the outside air.', 'Is there room around the outdoor unit to breathe, with sturdy mounting and safe access for servicing?'],
      ['Step 3 of 5 · Release', 'The outdoor coil lets the heat go.', 'A fan blows outside air across the outdoor coil. The refrigerant gives up its heat and turns back into a liquid.', 'Is the outdoor unit clear of blocked walls and trapped hot air? Coastal air and dust are worth planning for.'],
      ['Step 4 of 5 · Reset', 'Copper pipes carry it round again.', 'The liquid travels through insulated copper pipes to the indoor unit, where an expansion device drops its pressure and temperature so it can absorb heat all over again.', 'How long is the pipe run, how is it routed, and how are the joints and insulation finished?'],
      ['Step 5 of 5 · Drain', 'Moisture has to go somewhere.', 'As the indoor coil cools humid air, water condenses on it. A drain line carries that water out of the building, and it needs a steady downward slope.', 'Where will the drain water exit, and is it kept away from walls, walkways and neighbours?']
    ];
    const svg = $('.anatomy-svg'); const tabs = $$('.step-tabs [role=tab]'); const spots = $$('.hotspot'); const body = $('#step-body');
    const play = $('.play-btn'); let cur = 0, auto = !state.reduce, timer = 0, vis = false;
    const set = (i, user) => {
      cur = (i + steps.length) % steps.length; svg.dataset.step = cur;
      tabs.forEach((t, n) => { const on = n === cur; t.setAttribute('aria-selected', on); t.tabIndex = on ? 0 : -1; });
      spots.forEach((s, n) => { if (n === cur) s.setAttribute('aria-current', 'true'); else s.removeAttribute('aria-current'); });
      const s = steps[cur]; $('#step-kicker').textContent = s[0]; $('#step-title').textContent = s[1]; $('#step-text').textContent = s[2]; $('#step-ask').textContent = s[3];
      body.setAttribute('aria-labelledby', 'st-' + cur);
      body.classList.remove('swap'); void body.offsetWidth; body.classList.add('swap');
      if (user) pause();
    };
    const tick = () => { clearTimeout(timer); if (auto && vis && !document.hidden) timer = setTimeout(() => { set(cur + 1); tick(); }, 5200); };
    const setAuto = on => {
      auto = on; play.setAttribute('aria-pressed', String(on));
      play.lastElementChild.textContent = on ? 'Pause tour' : 'Resume tour';
      play.firstElementChild.firstElementChild.setAttribute('href', on ? '#i-pause' : '#i-play');
      on ? tick() : clearTimeout(timer);
    };
    const pause = () => setAuto(false);
    tabs.forEach((t, n) => {
      t.addEventListener('click', () => set(n, true));
      t.addEventListener('keydown', e => {
        const k = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
        if (k) { e.preventDefault(); set(cur + k, true); tabs[cur].focus(); }
        else if (e.key === 'Home') { e.preventDefault(); set(0, true); tabs[0].focus(); }
        else if (e.key === 'End') { e.preventDefault(); set(steps.length - 1, true); tabs[steps.length - 1].focus(); }
      });
    });
    spots.forEach((s, n) => s.addEventListener('click', () => set(n, true)));
    play.addEventListener('click', () => setAuto(!auto));
    new IntersectionObserver(es => { vis = es[0].isIntersecting; tick(); }, { threshold: 0.35 }).observe($('.anatomy'));
    set(0); setAuto(auto);
  });

  /* ---------- Space planner ---------- */
  safe('planner', () => {
    const form = $('#planner-form'); if (!form) return;
    const TYPES = {
      bedroom: { label: 'bedroom', w: 12, l: 14, p: 2, kind: 'home' }, living: { label: 'living room', w: 16, l: 20, p: 5, kind: 'home' },
      study: { label: 'home office', w: 10, l: 12, p: 1, kind: 'home' }, retail: { label: 'shop or showroom', w: 20, l: 30, p: 8, kind: 'commercial' },
      cafe: { label: 'restaurant or café', w: 24, l: 34, p: 30, kind: 'commercial' }, office: { label: 'office floor', w: 30, l: 45, p: 20, kind: 'commercial' },
      clinic: { label: 'clinic', w: 18, l: 24, p: 8, kind: 'commercial' }, hall: { label: 'hall or large space', w: 40, l: 70, p: 60, kind: 'large' }
    };
    const SYS = {
      split: ['Split AC', '#sys-split'], window: ['Window AC', '#sys-window'], cassette: ['Cassette AC', '#sys-cassette'], ductable: ['Ductable AC', '#sys-ductable'], vrf: ['VRF / VRV', '#sys-vrf']
    };
    const rw = $('#p-width'), rl = $('#p-length'), rp = $('#p-people');
    const ow = $('#o-width'), ol = $('#o-length'), op = $('#o-people');
    const room = $('#plan-room'); const rec = $('#rec-list');
    let primary = 'split', touched = false;
    const fillRange = r => r.style.setProperty('--fill', ((r.value - r.min) / (r.max - r.min) * 100) + '%');
    const val = n => (form.querySelector(`[name=${n}]:checked`) || {}).value;
    const heatVals = () => $$('[name=heat]:checked', form).map(x => x.value);
    const read = () => { const t = val('ptype'); const w = +rw.value, l = +rl.value, p = +rp.value; return { t, w, l, p, area: w * l, sun: val('sun'), heat: heatVals(), kind: TYPES[t].kind }; };

    const recommend = m => {
      const out = []; const a = m.area;
      const push = (k, why) => out.push({ k, why });
      if (m.kind === 'home') {
        if (a <= 170 && m.p <= 3) { push('split', 'A wall-mounted unit is a familiar fit for a single room like this.'); push('window', 'A compact, budget-friendly alternative if the window opening suits.'); }
        else if (a <= 450) { push('split', 'Wall-mounted units suit larger rooms. Open or very sunny rooms may need more than one.'); push('ductable', 'Worth a look for design-led homes that want concealed units.'); }
        else { push('ductable', 'Larger homes can suit concealed, centralised cooling.'); push('split', 'Room-by-room splits remain a flexible option.'); }
      } else if (m.kind === 'commercial') {
        if (a <= 350) { push('split', 'Wall-mounted units are simple for smaller commercial rooms.'); push('cassette', 'Ceiling cassettes spread air in several directions across open rooms.'); }
        else if (a <= 1400) { push('cassette', 'Ceiling cassettes suit open shops, restaurants and offices.'); push('ductable', 'Concealed ducting keeps the ceiling clean in design-led interiors.'); push('vrf', 'Worth considering if several zones need independent control.'); }
        else { push('vrf', 'One outdoor unit can serve many indoor units across a larger floor.'); push('ductable', 'Centralised ducting suits large open areas.'); push('cassette', 'Cassettes can serve zones within a larger layout.'); }
      } else {
        push('ductable', 'Halls, auditoriums and large spaces commonly use concealed, centralised cooling.'); push('vrf', 'VRF links one outdoor unit to multiple indoor units for large buildings.');
      }
      return out;
    };
    const score = m => {
      const area = m.area < 150 ? 0 : m.area < 300 ? 1 : m.area < 600 ? 2 : m.area < 1200 ? 3 : 4;
      const ppl = m.p <= 2 ? 0 : m.p <= 6 ? 1 : m.p <= 15 ? 2 : 3;
      const sun = m.sun === 'none' ? 0 : 1; const heat = m.heat.length;
      const raw = area + ppl + sun + heat; const pct = clamp(Math.round(raw / 12 * 100), 8, 100);
      const lab = raw <= 2 ? 'Light' : raw <= 5 ? 'Moderate' : raw <= 8 ? 'High' : 'Very high';
      const why = [];
      if (area >= 2) why.push('a larger floor area'); if (ppl >= 2) why.push(m.p + ' people'); if (sun) why.push('afternoon sun on the ' + m.sun + ' wall');
      const hn = { kitchen: 'cooking nearby', equipment: 'computers or equipment', glass: 'lots of glass', roof: 'a roof directly above' };
      m.heat.forEach(h => why.push(hn[h]));
      return { pct, lab, why };
    };
    const brief = (m, recs, sc) => {
      const sunTxt = m.sun === 'none' ? '' : ` Afternoon sun on the ${m.sun} wall.`;
      const hn = { kitchen: 'cooking nearby', equipment: 'computers or equipment', glass: 'lots of glass', roof: 'roof directly above' };
      const extra = m.heat.length ? ' Also: ' + m.heat.map(h => hn[h]).join(', ') + '.' : '';
      return `A ${TYPES[m.t].label}, about ${m.w} × ${m.l} ft (≈ ${m.area.toLocaleString('en-IN')} sq ft), used by about ${m.p} ${m.p === 1 ? 'person' : 'people'}.${sunTxt}${extra} Systems I would like to discuss: ${recs.map(r => SYS[r.k][0]).join(', ')}.`;
    };

    /* plan drawing */
    const draw = m => {
      room.textContent = '';
      const s = Math.min(480 / m.w, 290 / m.l); const rW = m.w * s, rL = m.l * s; const x0 = (640 - rW) / 2, y0 = (420 - rL) / 2 + 6;
      const g = svgEl('g', {}, room);
      // sun glow
      const sunSide = m.sun;
      if (sunSide !== 'none') {
        const gl = svgEl('g', { class: 'sunwash' }, g);
        const defs = svgEl('defs', {}, gl); const id = 'sw' + sunSide;
        const lg = svgEl('linearGradient', { id, x1: sunSide === 'east' ? 1 : 0, x2: sunSide === 'west' ? 1 : sunSide === 'east' ? 0 : 0, y1: sunSide === 'south' ? 1 : 0, y2: sunSide === 'south' ? 0 : 0 }, defs);
        svgEl('stop', { offset: 0, 'stop-color': '#f4a63c', 'stop-opacity': .6 }, lg); svgEl('stop', { offset: 1, 'stop-color': '#f4a63c', 'stop-opacity': 0 }, lg);
        const depth = 0.28;
        const r = { west: [x0, y0, rW * depth, rL], east: [x0 + rW * (1 - depth), y0, rW * depth, rL], south: [x0, y0 + rL * (1 - depth), rW, rL * depth] }[sunSide];
        svgEl('rect', { x: r[0], y: r[1], width: r[2], height: r[3], fill: `url(#${id})` }, gl);
        const c = { west: [x0 - 34, y0 + rL / 2], east: [x0 + rW + 34, y0 + rL / 2], south: [x0 + rW / 2, y0 + rL + 34] }[sunSide];
        svgEl('circle', { cx: c[0], cy: Math.min(c[1], 400), r: 15, fill: '#f4a63c' }, g);
        for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; svgEl('path', { d: `M${c[0] + Math.cos(a) * 21} ${Math.min(c[1], 400) + Math.sin(a) * 21}L${c[0] + Math.cos(a) * 28} ${Math.min(c[1], 400) + Math.sin(a) * 28}`, stroke: '#f4a63c', 'stroke-width': 3, 'stroke-linecap': 'round' }, g); }
      }
      svgEl('rect', { x: x0, y: y0, width: rW, height: rL, rx: 6, fill: '#fbf8f1', stroke: '#1b2620', 'stroke-width': 6 }, g);
      // windows on sun wall (or top wall for glass) + door on bottom
      const win = (x, y, w, h, thick) => svgEl('rect', { x, y, width: w, height: h, fill: '#bfe0e6', stroke: '#1b2620', 'stroke-width': 1.5 }, g);
      if (sunSide === 'west') win(x0 - 3, y0 + rL * .3, 6, rL * .4); if (sunSide === 'east') win(x0 + rW - 3, y0 + rL * .3, 6, rL * .4); if (sunSide === 'south') win(x0 + rW * .3, y0 + rL - 3, rW * .4, 6);
      if (m.heat.includes('glass')) win(x0 + rW * .12, y0 - 3, rW * .76, 6);
      svgEl('rect', { x: x0 + rW * .08, y: y0 + rL - 4, width: 34, height: 8, fill: '#efe8d8' }, g);
      // roof marker
      if (m.heat.includes('roof')) { svgEl('rect', { x: x0 - 10, y: y0 - 10, width: rW + 20, height: rL + 20, rx: 10, fill: 'none', stroke: '#a05a2c', 'stroke-width': 2, 'stroke-dasharray': '8 6' }, g); const t = svgEl('text', { x: x0 + rW - 6, y: y0 - 16, 'text-anchor': 'end', 'font-size': 13, 'font-weight': 700, fill: '#a05a2c' }, g); t.textContent = 'Roof above'; }
      // heat props
      if (m.heat.includes('kitchen')) { const kx = x0 + 10, ky = y0 + 10; svgEl('rect', { x: kx, y: ky, width: Math.min(84, rW * .46), height: 26, rx: 5, fill: '#f0b36b' }, g); const t = svgEl('text', { x: kx + 8, y: ky + 18, 'font-size': 13, 'font-weight': 700, fill: '#5e2d12' }, g); t.textContent = 'Cooking'; }
      if (m.heat.includes('equipment')) { const ew = Math.min(98, rW * .5), ex = x0 + rW - ew - 10, ey = y0 + rL - 36; svgEl('rect', { x: ex, y: ey, width: ew, height: 26, rx: 5, fill: '#cdd7d2' }, g); const t = svgEl('text', { x: ex + 8, y: ey + 18, 'font-size': 13, 'font-weight': 700, fill: '#26332c' }, g); t.textContent = 'Equipment'; }
      // people
      let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
      const n = Math.min(m.p, 44);
      for (let i = 0; i < n; i++) { const px = x0 + 22 + rnd() * (rW - 44), py = y0 + 40 + rnd() * (rL - 80); svgEl('circle', { cx: px, cy: py, r: 6, fill: '#982b36', 'fill-opacity': .78 }, g); }
      // AC representation
      const ac = svgEl('g', {}, g);
      const kind = primary;
      const airTop = (cx, cy) => { for (let i = -1; i <= 1; i++) svgEl('path', { d: `M${cx + i * 22} ${cy + 8}c${i * 10} 22 ${i * 18} 34 ${i * 26} 56`, fill: 'none', stroke: '#2a8f84', 'stroke-width': 2.4, 'stroke-linecap': 'round', class: 'ambient', 'stroke-opacity': .85 }, ac); };
      if (kind === 'split' || kind === 'window') {
        const w = kind === 'split' ? Math.min(92, rW * .4) : 54; const cx = x0 + rW / 2;
        const top = sunSide === 'south' ? y0 : y0; svgEl('rect', { x: cx - w / 2, y: top + 4, width: w, height: 16, rx: 6, fill: '#fff', stroke: '#1b2620', 'stroke-width': 2.4 }, ac); airTop(cx, top + 18);
      } else if (kind === 'cassette') {
        const cx = x0 + rW / 2, cy = y0 + rL / 2; svgEl('rect', { x: cx - 26, y: cy - 26, width: 52, height: 52, rx: 8, fill: '#fff', stroke: '#1b2620', 'stroke-width': 2.4 }, ac); svgEl('rect', { x: cx - 14, y: cy - 14, width: 28, height: 28, rx: 4, fill: '#bfd3cd' }, ac);
        [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(d => svgEl('path', { d: `M${cx + d[0] * 34} ${cy + d[1] * 34}l${d[0] * 22} ${d[1] * 22}`, stroke: '#2a8f84', 'stroke-width': 3, 'stroke-linecap': 'round', class: 'ambient' }, ac));
      } else if (kind === 'ductable') {
        const cy = y0 + rL * .38; svgEl('rect', { x: x0 + 12, y: cy - 7, width: rW - 24, height: 14, rx: 4, fill: '#e1e6e0', stroke: '#1b2620', 'stroke-width': 2 }, ac);
        [0.2, 0.5, 0.8].forEach(f => { const cx = x0 + rW * f; svgEl('rect', { x: cx - 16, y: cy + 7, width: 32, height: 9, rx: 3, fill: '#fff', stroke: '#1b2620', 'stroke-width': 2 }, ac); svgEl('path', { d: `M${cx} ${cy + 18}v34`, stroke: '#2a8f84', 'stroke-width': 3, 'stroke-linecap': 'round', class: 'ambient' }, ac); });
      } else {
        const ox = x0 + rW + 14; svgEl('rect', { x: Math.min(ox, 580), y: y0 + rL / 2 - 24, width: 44, height: 48, rx: 6, fill: '#dfe5de', stroke: '#1b2620', 'stroke-width': 2.4 }, ac); svgEl('circle', { cx: Math.min(ox, 580) + 22, cy: y0 + rL / 2, r: 14, fill: '#fff', stroke: '#1b2620', 'stroke-width': 2 }, ac);
        [0.25, 0.75].forEach(f => svgEl('rect', { x: x0 + rW * f - 22, y: y0 + rL * .45, width: 44, height: 13, rx: 5, fill: '#fff', stroke: '#1b2620', 'stroke-width': 2.2 }, ac));
        svgEl('path', { d: `M${Math.min(ox, 580)} ${y0 + rL / 2}H${x0 + rW}`, stroke: '#b86e2c', 'stroke-width': 3, 'stroke-dasharray': '2 6', class: 'ambient' }, ac);
      }
      // dimensions
      const tw = svgEl('text', { x: x0 + rW / 2, y: Math.max(18, y0 - 22), 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: '#1b2620' }, room); tw.textContent = m.w + ' ft';
      const tl = svgEl('text', { x: x0 + rW + 16, y: y0 + rL / 2 + 5, 'font-size': 14, 'font-weight': 800, fill: '#1b2620' }, room); tl.textContent = m.l + ' ft'; if (x0 + rW + 70 > 640) tl.setAttribute('x', x0 + rW - 56);
      const ta = svgEl('text', { x: x0, y: Math.min(y0 + rL + 26, 412), 'text-anchor': 'start', 'font-size': 14, 'font-weight': 700, fill: '#5e665f' }, room); ta.textContent = '≈ ' + m.area.toLocaleString('en-IN') + ' sq ft';
      const nn = svgEl('text', { x: 610, y: 30, 'text-anchor': 'middle', 'font-size': 14, 'font-weight': 800, fill: '#5e665f' }, room); nn.textContent = 'N';
      svgEl('path', { d: 'M610 36v16m-6-8 6-8 6 8', fill: 'none', stroke: '#5e665f', 'stroke-width': 2, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, room);
    };

    const render = () => {
      const m = read(); const recs = recommend(m); primary = recs[0].k; const sc = score(m);
      ow.textContent = m.w + ' ft'; ol.textContent = m.l + ' ft'; op.textContent = m.p;
      [rw, rl, rp].forEach(fillRange);
      draw(m);
      $('#gauge-label').textContent = sc.lab; $('#gauge-fill').style.width = sc.pct + '%';
      $('#gauge-note').textContent = sc.why.length ? 'Shaped by ' + sc.why.join(', ') + '.' : 'Nothing adds unusual heat in what you have described.';
      rec.textContent = '';
      recs.forEach((r, i) => {
        const d = document.createElement('div'); d.className = 'rec-item'; d.style.animationDelay = i * 0.06 + 's';
        const n = document.createElement('span'); n.className = 'rn'; n.textContent = i + 1;
        const c = document.createElement('div'); const b = document.createElement('b'); b.textContent = SYS[r.k][0]; const s = document.createElement('span'); s.textContent = r.why; c.append(b, s);
        const a = document.createElement('a'); a.href = SYS[r.k][1]; a.textContent = 'See it'; a.setAttribute('aria-label', 'See ' + SYS[r.k][0] + ' in the range');
        d.append(n, c, a); rec.appendChild(d);
      });
      $$('.sys').forEach(c => c.classList.toggle('is-picked', touched && recs.some(r => '#' + c.id === SYS[r.k][1])));
      const text = brief(m, recs, sc); $('#brief-text').textContent = text;
      state.plannerBrief = text; state.plannerKind = m.kind;
    };
    const setType = (t, silent) => {
      const c = TYPES[t]; if (!c) return;
      const r = form.querySelector(`[name=ptype][value=${t}]`); if (r) r.checked = true;
      rw.value = c.w; rl.value = c.l; rp.value = c.p; if (!silent) render();
    };
    form.addEventListener('change', e => { touched = true; if (e.target.name === 'ptype') setType(e.target.value); else render(); });
    form.addEventListener('input', e => { if (e.target.type === 'range') { touched = true; render(); } });
    document.addEventListener('crs:space', e => { touched = true; setType(e.detail); });
    $('#planner-send').addEventListener('click', () => {
      state.brief = state.plannerBrief; state.briefKind = state.plannerKind;
      document.dispatchEvent(new CustomEvent('crs:brief'));
      location.hash = '#enquiry';
    });
    render();
  });

  /* ---------- Range gallery nav ---------- */
  safe('range', () => {
    const track = $('.range-track'); const nav = $('.range-nav'); if (!track || !nav) return;
    nav.hidden = false;
    $$('button', nav).forEach(b => b.addEventListener('click', () => {
      const card = $('.sys', track); const step = card ? card.getBoundingClientRect().width + 22 : 400;
      track.scrollBy({ left: +b.dataset.dir * step, behavior: state.reduce ? 'auto' : 'smooth' });
    }));
  });

  /* ---------- Care ring ---------- */
  safe('care', () => {
    const arcs = $('#ring-arcs'); if (!arcs) return;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const cx = 200, cy = 200, R = 140;
    const pt = (deg, r) => [cx + Math.cos((deg - 90) * Math.PI / 180) * r, cy + Math.sin((deg - 90) * Math.PI / 180) * r];
    const arc = (a0, a1, r, color, w) => { const p0 = pt(a0, r), p1 = pt(a1, r); svgEl('path', { d: `M${p0[0]} ${p0[1]}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${p1[0]} ${p1[1]}`, fill: 'none', stroke: color, 'stroke-width': w, 'stroke-linecap': 'butt' }, arcs); };
    svgEl('circle', { cx, cy, r: R, fill: 'none', stroke: 'rgba(255,255,255,.1)', 'stroke-width': 30 }, arcs);
    arc(90, 180, R, 'rgba(243,198,138,.55)', 30); arc(270, 360, R, 'rgba(127,183,166,.55)', 30);
    const pm = $('#ring-months');
    const heatLbl = svgEl('text', { x: pt(135, 104)[0], y: pt(135, 104)[1] + 4, 'text-anchor': 'middle', class: 'mlabel' }, pm); heatLbl.textContent = 'Peak heat';
    const rainLbl = svgEl('text', { x: pt(315, 104)[0], y: pt(315, 104)[1] + 4, 'text-anchor': 'middle', class: 'mlabel' }, pm); rainLbl.textContent = 'Rains';
    months.forEach((mo, i) => { const p = pt(i * 30 + 15, 184); const t = svgEl('text', { x: p[0], y: p[1] + 5, 'text-anchor': 'middle', class: 'mlabel' }, pm); t.textContent = mo; });
    const marks = $('#ring-marks'); const m1 = svgEl('g', { class: 'mark' }, marks), m2 = svgEl('g', { class: 'mark' }, marks);
    [m1, m2].forEach((g, i) => { svgEl('circle', { r: 17, fill: '#f3c68a', stroke: '#5e1822', 'stroke-width': 3 }, g); const t = svgEl('text', { y: 6, 'text-anchor': 'middle', 'font-size': 17, 'font-weight': 800, style: 'fill:#5e1822' }, g); t.textContent = i + 1; });
    const pick = $('.month-pick'); const note = $('#ring-note'); let sel = 1;
    const phase = i => i === 0 ? 'in the cooler months' : i <= 2 ? 'before the heat builds' : i <= 5 ? 'in the thick of the heat' : i <= 8 ? 'after the heat, before the rains' : 'during the rains';
    const buttons = months.map((mo, i) => { const b = document.createElement('button'); b.type = 'button'; b.textContent = mo; b.setAttribute('aria-pressed', 'false'); b.setAttribute('aria-label', 'First service in ' + mo); b.addEventListener('click', () => update(i)); pick.appendChild(b); return b; });
    const place = (g, i) => { const p = pt(i * 30 + 15, R); g.style.transform = `translate(${p[0]}px,${p[1]}px)`; g.setAttribute('transform', `translate(${p[0]} ${p[1]})`); };
    const update = i => {
      sel = i; const j = (i + 6) % 12; place(m1, i); place(m2, j);
      buttons.forEach((b, n) => b.setAttribute('aria-pressed', String(n === i)));
      note.textContent = `Visit 1 in ${months[i]}: ${phase(i)}. Visit 2 in ${months[j]}: ${phase(j)}.`;
    };
    update(1);
  });

  /* ---------- Journey: pinned horizontal story on large screens ---------- */
  safe('journey', () => {
    const j = $('.journey'); const track = $('.journey-track'); if (!j || !track) return;
    const mq = matchMedia('(min-width:1021px)');
    let pinned = false, ticking = false;
    const update = () => {
      ticking = false; if (!pinned) return;
      const r = j.getBoundingClientRect(); const total = j.offsetHeight - innerHeight;
      const p = clamp(-r.top / total, 0, 1);
      const shift = Math.max(0, track.scrollWidth - innerWidth);
      track.style.transform = `translate3d(${(-p * shift).toFixed(1)}px,0,0)`; j.style.setProperty('--p', p.toFixed(4));
    };
    const setup = () => {
      pinned = mq.matches && !state.reduce; j.classList.toggle('is-pinned', pinned);
      if (!pinned) { track.style.transform = ''; j.style.removeProperty('--p'); } else update();
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', () => { setup(); });
    mq.addEventListener('change', setup); reduceMQ.addEventListener('change', setup); setup();
  });

  /* ---------- Service areas ---------- */
  safe('areas', () => {
    // Order and angles were chosen by a small layout search so no two labels overlap at desktop size.
    const rings = [
      ['Porur', 'KK Nagar', 'Virugambakkam', 'Vadapalani', 'Saligramam'],
      ['Perambur', 'Ashok Nagar', 'Ambattur', 'Mogappair', 'T. Nagar', 'Avadi', 'Guindy', 'Anna Nagar'],
      ['Adyar', 'Velachery', 'Sholinganallur', 'Pallavaram', 'Tambaram', 'OMR', 'ECR', 'Chromepet']
    ];
    const extra = ['Madurai', 'Coimbatore', 'Trichy'];
    const all = ['Valasaravakkam', ...rings.flat(), ...extra];
    const ul = $('#area-nodes'); const dl = $('#area-list'); const q = $('#area-q'); const res = $('#area-result');
    if (!ul) return;
    const radius = [22, 32, 42]; const offs = [343.2, 127.7, 102.4];
    rings.forEach((names, r) => names.forEach((nm, i) => {
      const a = (offs[r] + i * 360 / names.length) * Math.PI / 180;
      const li = document.createElement('li'); li.style.setProperty('--x', (50 + Math.cos(a) * radius[r]).toFixed(2) + '%'); li.style.setProperty('--y', (50 + Math.sin(a) * radius[r]).toFixed(2) + '%');
      const b = document.createElement('button'); b.type = 'button'; b.textContent = nm; b.addEventListener('click', () => { q.value = nm; check(); });
      li.appendChild(b); ul.appendChild(li);
    }));
    all.forEach(nm => { const o = document.createElement('option'); o.value = nm; dl.appendChild(o); });
    const norm = s => s.toLowerCase().replace(/[^a-z]/g, '');
    const check = () => {
      const v = q.value.trim(); res.className = 'area-result'; res.textContent = '';
      $$('#area-nodes button').forEach(b => b.classList.remove('is-hit'));
      if (!v) { res.textContent = 'Start typing a locality.'; return; }
      const n = norm(v); const hit = all.find(a => norm(a) === n) || all.find(a => n.length >= 3 && norm(a).startsWith(n));
      if (hit) {
        res.classList.add('ok'); res.textContent = '';
        const b = document.createElement('b'); b.textContent = hit; res.append(b, ' is on CRS Aircon’s published service-area list. Please call to confirm availability and timing. ');
        const use = document.createElement('button'); use.type = 'button'; use.className = 'text-link'; use.textContent = 'Use this area in my enquiry'; use.addEventListener('click', () => { state.area = hit; const f = $('#enquiry-area'); if (f) f.value = hit; location.hash = '#enquiry'; });
        res.appendChild(use);
        $$('#area-nodes button').forEach(bn => { if (norm(bn.textContent) === norm(hit)) bn.classList.add('is-hit'); });
      } else {
        const a = document.createElement('a'); a.href = 'tel:+' + PHONE; a.className = 'text-link'; a.textContent = 'Call +91 98400 73436';
        res.append('“' + v + '” isn’t on our published list, but CRS also serves customers across Tamil Nadu. ', a, ' to check.');
      }
    };
    q.addEventListener('input', check);
  });

  /* ---------- Quote checklist ---------- */
  safe('quote', () => {
    const list = $('#quote-list'); if (!list) return; const score = $('#quote-score'); const boxes = $$('input', list);
    const upd = () => { const n = boxes.filter(b => b.checked).length; score.textContent = n === 0 ? 'Tick each item as you confirm it.' : n === boxes.length ? 'All six confirmed. You’re ready to compare quotes with confidence.' : `${n} of ${boxes.length} confirmed.`; };
    boxes.forEach(b => b.addEventListener('change', upd));
  });

  /* ---------- Enquiry: guided steps, preview, send-it-yourself ---------- */
  safe('enquiry', () => {
    const form = $('#enquiry-form'); const fields = $('#enquiry-fields'); const dialog = $('#enquiry-preview');
    const err = $('#form-error'); const steps = $$('.fstep', form); const count = $('#step-count'); const prog = $('#form-progress');
    const details = $('#enquiry-details'); const nameI = form.elements.namedItem('name'), phoneI = form.elements.namedItem('phone'), areaI = form.elements.namedItem('area');
    const chipsBox = $('#brand-chips'); const briefChip = $('#brief-chip'); const briefTxt = $('#brief-chip-text');
    let autoDetail = '', stepNo = 1;

    const BR = ['Daikin', 'Blue Star', 'Carrier', 'Mitsubishi', 'Voltas', 'Hitachi', 'Godrej', 'LG', 'Not sure, please suggest'];
    const chips = BR.map(nm => {
      const b = document.createElement('button'); b.type = 'button'; b.textContent = nm; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', () => toggleBrand(nm)); chipsBox.appendChild(b); return b;
    });
    const paintChips = () => chips.forEach(b => b.setAttribute('aria-pressed', String(state.brands.has(b.textContent))));
    const toggleBrand = (nm, force) => {
      const NS = BR[BR.length - 1];
      if (force === true || (force === undefined && !state.brands.has(nm))) { if (nm === NS) state.brands.clear(); else state.brands.delete(NS); state.brands.add(nm); }
      else state.brands.delete(nm);
      paintChips();
    };
    const goStep = (n, focus = true) => {
      stepNo = clamp(n, 1, steps.length);
      steps.forEach((s, i) => { s.hidden = i !== stepNo - 1; });
      count.textContent = `Step ${stepNo} of ${steps.length}`; prog.style.width = (stepNo / steps.length * 100) + '%';
      if (focus) { const q = $('.fq', steps[stepNo - 1]); if (q) { q.tabIndex = -1; q.focus({ preventScroll: true }); } }
      err.textContent = '';
    };
    const needVal = () => (form.querySelector('[name=need]:checked') || {}).value;
    const setNeed = v => { const r = $$('[name=need]', form).find(x => x.value === v); if (r) r.checked = true; };
    const setDetail = txt => { if (!details.value.trim() || details.value === autoDetail) { details.value = txt || ''; autoDetail = txt || ''; } };

    $$('.next-step', form).forEach(b => b.addEventListener('click', () => goStep(stepNo + 1)));
    $$('.prev-step', form).forEach(b => b.addEventListener('click', () => goStep(stepNo - 1)));
    $('#brief-clear').addEventListener('click', () => { state.brief = ''; paintBrief(); });
    const paintBrief = () => { briefChip.hidden = !state.brief; briefTxt.textContent = state.brief ? (state.brief.length > 110 ? state.brief.slice(0, 107) + '…' : state.brief) : ''; };
    document.addEventListener('crs:brief', () => { setNeed(state.briefKind === 'home' ? 'Home AC purchase / installation' : 'Commercial cooling / project'); paintBrief(); goStep(2, false); });

    // any element marked service-choice can preselect the enquiry
    document.addEventListener('click', e => {
      const a = e.target.closest('.service-choice'); if (!a) return;
      if (a.dataset.spaceType) document.dispatchEvent(new CustomEvent('crs:space', { detail: a.dataset.spaceType }));
      if (a.getAttribute('href') !== '#enquiry') return;
      if (a.dataset.need) setNeed(a.dataset.need);
      if (a.dataset.detail) setDetail(a.dataset.detail);
      if (a.dataset.brand) { state.brands.clear(); toggleBrand(a.dataset.brand, true); goStep(2, false); }
      else if (a.dataset.need) goStep(2, false);
    });

    form.addEventListener('submit', e => {
      e.preventDefault(); err.textContent = '';
      if (fields.disabled) return;
      const v = k => String(new FormData(form).get(k) || '').trim();
      const digits = v('phone').replace(/\D/g, '');
      if (!v('name')) { err.textContent = 'Please add your name.'; nameI.focus(); return; }
      if (digits.length < 10 || digits.length > 15 || !/^[+0-9 ()-]+$/.test(v('phone')) || /^(\d)\1+$/.test(digits)) { err.textContent = 'Please enter a valid mobile number with 10 to 15 digits.'; phoneI.focus(); return; }
      if (!v('area')) { err.textContent = 'Please add your area.'; areaI.focus(); return; }
      const src = new URLSearchParams(location.search).get('utm_content');
      const source = src && /^[a-zA-Z0-9_-]{1,80}$/.test(src) ? src : 'website_enquiry';
      const brands = Array.from(state.brands).join(', ');
      const lines = ['Hello CRS Aircon,', '', 'I would like help with: ' + needVal()];
      if (brands) lines.push('Preferred brand: ' + brands);
      if (state.brief) lines.push('My space: ' + state.brief);
      if (v('details')) lines.push('Details: ' + v('details'));
      lines.push('Name: ' + v('name'), 'Mobile: ' + v('phone'), 'Area: ' + v('area'), '', 'Please confirm the next step and availability.', 'Source: ' + source);
      const msg = lines.join('\n');
      $('#message-preview').textContent = msg;
      $('#whatsapp-draft').href = 'https://wa.me/' + PHONE + '?text=' + encodeURIComponent(msg);
      $('#email-draft').href = 'mailto:crsaircon@yahoo.co.in?subject=' + encodeURIComponent('Enquiry from the CRS Aircon website') + '&body=' + encodeURIComponent(msg);
      dialog.showModal();
    });
    const closePreview = () => { dialog.close(); const b = $('.form-submit', form); if (b) b.focus({ preventScroll: true }); };
    $$('.close-dialog, .edit-enquiry', dialog).forEach(b => b.addEventListener('click', closePreview));
    dialog.addEventListener('click', e => { if (e.target !== dialog) return; const r = dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closePreview(); });
    if (typeof dialog.showModal === 'function') {
      fields.disabled = false; $('#form-availability').hidden = true; $('#form-privacy').hidden = false;
    }
    goStep(1, false); paintBrief();
  });
})();
