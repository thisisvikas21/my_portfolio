document.addEventListener('DOMContentLoaded', () => {
  initTypedText();
  initCountUp();
});

/* ---- Typed Text ---- */
function initTypedText() {
  const el = document.getElementById('typedText');
  if (!el) return;

  const strings = [
    'AI-Driven Scientist & Engineer',
    'Deep Learning Specialist',
    'Computer Vision Developer',
    'Edge AI & Deployment Engineer',
    'Agentic AI Builder',
  ];

  let strIdx = 0;
  let charIdx = 0;
  let deleting = false;
  let pause = false;

  function tick() {
    const current = strings[strIdx];

    if (pause) {
      pause = false;
      setTimeout(tick, deleting ? 400 : 1800);
      return;
    }

    if (!deleting) {
      el.textContent = current.substring(0, charIdx + 1);
      charIdx++;
      if (charIdx === current.length) {
        deleting = true;
        pause = true;
      }
    } else {
      el.textContent = current.substring(0, charIdx - 1);
      charIdx--;
      if (charIdx === 0) {
        deleting = false;
        strIdx = (strIdx + 1) % strings.length;
        pause = true;
      }
    }

    const speed = deleting ? 30 : 60;
    setTimeout(tick, speed);
  }

  setTimeout(tick, 600);
}

/* ---- Count Up ---- */
function initCountUp() {
  const counters = document.querySelectorAll('[data-count]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-count'));
        const suffix = el.textContent.replace(/\d/g, '');
        animateCount(el, 0, target, 1200, suffix);
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(c => observer.observe(c));
}

function animateCount(el, start, end, duration, suffix) {
  const startTime = performance.now();
  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 4);
    const value = Math.floor(start + (end - start) * eased);
    el.textContent = value + suffix;
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}
