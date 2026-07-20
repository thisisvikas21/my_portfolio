/* ============================================
   VIKAS SHARMA — VISION SYSTEM PORTFOLIO v3 JS
   Boot · Scramble · Roles · Crosshair ·
   Embedding field · Scroll detections ·
   Scan progress · Sys status · Rail · Count-up
   ============================================ */

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
const GLYPHS = '01<>[]/\\#%&$@*+=?ABCDEFXYZ';

document.addEventListener('DOMContentLoaded', () => {
  runBootSequence();
  initEmbeddingField();
  initCrosshair();
  initSectionDetections();
  initCountUp();
  initRoleCycler();
  initScanProgress();
  initRail();
  initFrameCounter();
});

/* ---- Boot sequence → hero choreography ---- */
function runBootSequence() {
  const boot = document.getElementById('boot');
  const target = document.getElementById('heroTarget');
  const name = document.querySelector('.hero-name');

  const finishHero = () => {
    if (target) target.classList.add('boxed');
  };

  if (reducedMotion.matches || !boot) {
    if (boot) boot.classList.add('done');
    finishHero();
    return;
  }

  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    boot.classList.add('done');
    if (name) scramble(name, () => finishHero());
    else finishHero();
  };

  boot.addEventListener('click', start, { once: true });
  setTimeout(start, 1450);
}

/* ---- Glyph scramble ----
   Letters cycle through random glyphs, then lock in left-to-right.
   Headings keep their real text for assistive tech. */
function scramble(el, onDone) {
  const finalText = el.dataset.finalText || el.textContent;
  el.dataset.finalText = finalText;

  if (reducedMotion.matches) {
    el.textContent = finalText;
    if (onDone) onDone();
    return;
  }

  const chars = [...finalText];
  const total = 14;
  let frame = 0;
  let locked = 0;

  const timer = setInterval(() => {
    frame++;
    if (frame > total) locked++;

    el.textContent = chars
      .map((c, i) => {
        if (c === '\n' || c === ' ') return c;
        if (i < locked) return c;
        return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
      })
      .join('');

    if (locked >= chars.length) {
      clearInterval(timer);
      el.textContent = finalText;
      if (onDone) onDone();
    }
  }, 28);
}

/* Multi-line hero heading: capture the line break before scrambling,
   restore the <br> when the final text lands. */
(function preserveHeroLineBreak() {
  const name = document.querySelector('.hero-name');
  if (!name) return;
  name.dataset.finalText = name.innerText;
  const restore = new MutationObserver(() => {
    if (name.textContent === name.dataset.finalText) {
      name.innerHTML = name.dataset.finalText.replace('\n', '<br />');
      restore.disconnect();
    }
  });
  restore.observe(name, { childList: true, characterData: true, subtree: true });
})();

/* ---- Role cycler (decode transitions) ---- */
function initRoleCycler() {
  const el = document.getElementById('roleText');
  if (!el) return;

  const roles = [
    'AI Engineer',
    'Deep Learning Specialist',
    'Computer Vision Developer',
    'Edge AI & Deployment Engineer',
    'Agentic AI Builder',
  ];

  if (reducedMotion.matches) {
    el.textContent = roles[0];
    return;
  }

  let idx = 0;

  const next = () => {
    if (document.hidden) {
      setTimeout(next, 1000);
      return;
    }
    idx = (idx + 1) % roles.length;
    el.dataset.finalText = roles[idx];
    scramble(el, () => setTimeout(next, 2600));
  };

  setTimeout(next, 3200);
}

/* ---- Embedding field ----
   A slow point cloud in the hero. Points connect to close neighbours;
   points near the cursor tint yellow and link to it, like a cluster
   forming around attention. Pauses off-screen and in hidden tabs. */
function initEmbeddingField() {
  const canvas = document.getElementById('field');
  if (!canvas || reducedMotion.matches) return;

  const ctx = canvas.getContext('2d');
  const hero = canvas.parentElement;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let pts = [];
  let mouse = { x: -9999, y: -9999 };
  let running = false;
  let raf = null;

  const LINK = 110;      // px distance for point-to-point links
  const REACH = 140;     // px distance for cursor links

  function resize() {
    const rect = hero.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = rect.width;
    h = rect.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function seed() {
    const n = Math.max(24, Math.min(90, Math.round((w * h) / 16000)));
    pts = Array.from({ length: n }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.22,
      vy: (Math.random() - 0.5) * 0.22,
    }));
  }

  function step() {
    ctx.clearRect(0, 0, w, h);

    for (const p of pts) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
    }

    // point-to-point links
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const a = pts[i];
        const b = pts[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          const alpha = 0.09 * (1 - Math.sqrt(d2) / LINK);
          ctx.strokeStyle = `rgba(230, 237, 243, ${alpha.toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    // points + cursor cluster
    for (const p of pts) {
      const dx = p.x - mouse.x;
      const dy = p.y - mouse.y;
      const d2 = dx * dx + dy * dy;
      const near = d2 < REACH * REACH;

      if (near) {
        const alpha = 0.35 * (1 - Math.sqrt(d2) / REACH);
        ctx.strokeStyle = `rgba(255, 210, 63, ${alpha.toFixed(3)})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }

      ctx.fillStyle = near ? 'rgba(255, 210, 63, 0.9)' : 'rgba(230, 237, 243, 0.35)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, near ? 2 : 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    raf = requestAnimationFrame(step);
  }

  function play() {
    if (running) return;
    running = true;
    raf = requestAnimationFrame(step);
  }

  function pause() {
    running = false;
    if (raf) cancelAnimationFrame(raf);
    raf = null;
  }

  resize();
  window.addEventListener('resize', resize);

  if (finePointer.matches) {
    hero.addEventListener('pointermove', (e) => {
      const rect = hero.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      mouse.x = -9999;
      mouse.y = -9999;
    });
  }

  // Only animate while the hero is on screen and the tab is visible
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? play() : pause()));
    }, { threshold: 0.05 }).observe(hero);
  } else {
    play();
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (hero.getBoundingClientRect().bottom > 0) play();
  });

  reducedMotion.addEventListener('change', (e) => {
    if (e.matches) {
      pause();
      ctx.clearRect(0, 0, w, h);
    }
  });
}

/* ---- Cursor crosshair with pixel coordinates ---- */
function initCrosshair() {
  const xhair = document.getElementById('xhair');
  const coords = document.getElementById('xhairCoords');
  if (!xhair || !coords) return;
  if (reducedMotion.matches || !finePointer.matches) return;

  const pad = (n) => String(Math.max(0, Math.round(n))).padStart(4, '0');
  let raf = null;
  let x = 0;
  let y = 0;

  document.addEventListener('pointermove', (e) => {
    x = e.clientX;
    y = e.clientY;
    xhair.classList.add('on');
    if (raf) return;
    raf = requestAnimationFrame(() => {
      xhair.style.setProperty('--cx', `${x}px`);
      xhair.style.setProperty('--cy', `${y}px`);
      coords.textContent = `x:${pad(x)} y:${pad(y)}`;
      raf = null;
    });
  }, { passive: true });

  document.addEventListener('pointerleave', () => xhair.classList.remove('on'));
}

/* ---- Scroll detections ---- */
function initSectionDetections() {
  const sections = document.querySelectorAll('.section');
  if (!sections.length) return;

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    sections.forEach((s) => s.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      const h = entry.target.querySelector('[data-scramble]');
      if (h) setTimeout(() => scramble(h), 250);
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });

  sections.forEach((s) => observer.observe(s));
}

/* ---- Scan progress + sys status ----
   The topbar reads like an instrument: how much of the page has been
   scanned, and whether the system is idle or tracking (scrolling). */
function initScanProgress() {
  const bar = document.getElementById('scanProgress');
  const pct = document.getElementById('scanPct');
  const sys = document.getElementById('sysStatus');
  if (!bar && !pct && !sys) return;

  let raf = null;
  let idleTimer = null;

  const update = () => {
    raf = null;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = max > 0 ? Math.min(1, window.scrollY / max) : 0;
    if (bar) bar.style.transform = `scaleX(${p.toFixed(4)})`;
    if (pct) pct.textContent = `scan ${String(Math.round(p * 100)).padStart(3, '0')}%`;
  };

  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(update);
    if (sys && !reducedMotion.matches) {
      sys.textContent = 'sys:tracking';
      sys.classList.add('tracking');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        sys.textContent = 'sys:idle';
        sys.classList.remove('tracking');
      }, 450);
    }
  };

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    if (!raf) raf = requestAnimationFrame(update);
  });
  update();

  if (sys && reducedMotion.matches) sys.textContent = 'sys:online';
}

/* ---- Section rail ----
   Highlights the section currently in the middle band of the screen. */
function initRail() {
  const links = document.querySelectorAll('[data-rail]');
  if (!links.length || !('IntersectionObserver' in window)) return;

  const byId = {};
  links.forEach((l) => { byId[l.dataset.rail] = l; });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const link = byId[entry.target.id];
      if (!link) return;
      if (entry.isIntersecting) {
        links.forEach((l) => l.classList.remove('active'));
        link.classList.add('active');
      }
    });
  }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

  ['about', 'stack', 'work', 'connect'].forEach((id) => {
    const s = document.getElementById(id);
    if (s) observer.observe(s);
  });
}

/* ---- Count Up ---- */
function initCountUp() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const finish = (el) => {
    el.textContent = el.getAttribute('data-count') + (el.getAttribute('data-suffix') || '');
  };

  if (reducedMotion.matches || !('IntersectionObserver' in window)) {
    counters.forEach(finish);
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.getAttribute('data-count'), 10);
      const suffix = el.getAttribute('data-suffix') || '';
      if (Number.isNaN(target)) {
        finish(el);
      } else {
        animateCount(el, 0, target, 1100, suffix);
      }
      observer.unobserve(el);
    });
  }, { threshold: 0.5 });

  counters.forEach((c) => observer.observe(c));
}

function animateCount(el, start, end, duration, suffix) {
  const startTime = performance.now();
  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    el.textContent = Math.floor(start + (end - start) * eased) + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ---- Footer frame counter ---- */
function initFrameCounter() {
  const el = document.getElementById('footFrame');
  if (!el) return;

  if (reducedMotion.matches) {
    el.textContent = 'frame_0001';
    return;
  }

  let n = 1;
  setInterval(() => {
    if (document.hidden) return;
    n = (n % 9999) + 1;
    el.textContent = `frame_${String(n).padStart(4, '0')}`;
  }, 1000);
}
