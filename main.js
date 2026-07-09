// ===== Sacred Geometry Hero Animation =====
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H;
  let t = 0;
  let raf;
  let nodes = [];

  function rgba([r, g, b], a) { return `rgba(${r},${g},${b},${a.toFixed(3)})`; }

  const GOLD  = [212, 168,  68];
  const LGOLD = [240, 210, 120];
  const BLUE  = [ 55, 105, 175];
  const LBLUE = [110, 160, 215];

  function resize() {
    W = canvas.width  = canvas.offsetWidth;
    H = canvas.height = canvas.offsetHeight;
    buildNodes();
  }

  // ── seed positions: fill canvas in a hex grid + scatter ──────
  function buildNodes() {
    nodes = [];
    // Base unit: radius of each flower-of-life cell
    const unit = Math.min(W, H) * 0.13;

    // Hex grid spacing so cells tile gently across the canvas
    const colW = unit * 1.75;
    const rowH = unit * 1.52;
    const cols = Math.ceil(W / colW) + 2;
    const rows = Math.ceil(H / rowH) + 2;

    // Seeded pseudo-random so layout is stable between resizes
    let seed = 42;
    function rand() { seed = (seed * 16807 + 0) % 2147483647; return (seed - 1) / 2147483646; }

    for (let row = -1; row < rows; row++) {
      for (let col = -1; col < cols; col++) {
        const offsetX = row % 2 === 0 ? 0 : colW * 0.5;
        const x = col * colW + offsetX + unit * 0.4 + (rand() - 0.5) * unit * 0.5;
        const y = row * rowH               + unit * 0.4 + (rand() - 0.5) * unit * 0.5;
        const r = unit * (0.72 + rand() * 0.45);
        // Each node has a slow independent phase offset for pulsing
        const phase  = rand() * Math.PI * 2;
        const speed  = 0.18 + rand() * 0.22;  // relative animation speed
        const isGold = rand() > 0.38;          // ~62% gold, rest blue
        nodes.push({ x, y, r, phase, speed, isGold });
      }
    }
  }

  // Draw a Flower of Life (seed of life = centre + 6 surrounding circles)
  function flowerOfLife(x, y, r, col, alpha, lw) {
    const arc = (px, py) => {
      ctx.beginPath();
      ctx.arc(px, py, r, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(col, alpha);
      ctx.lineWidth = lw;
      ctx.stroke();
    };
    // Centre circle
    arc(x, y);
    // 6 petals
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      arc(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
    }
  }

  // Draw just concentric circles (for background large-scale nodes)
  function concentricRings(x, y, r, rings, col, alpha, lw) {
    for (let i = 1; i <= rings; i++) {
      ctx.beginPath();
      ctx.arc(x, y, r * i, 0, Math.PI * 2);
      ctx.strokeStyle = rgba(col, alpha * (1 - (i - 1) / rings));
      ctx.lineWidth = lw;
      ctx.stroke();
    }
  }

  // ── render loop ──────────────────────────────────────────────
  function draw() {
    t += 0.006;

    ctx.clearRect(0, 0, W, H);

    // Deep navy background
    const bg = ctx.createLinearGradient(0, 0, W * 0.4, H);
    bg.addColorStop(0,   '#111e36');
    bg.addColorStop(0.5, '#0a1628');
    bg.addColorStop(1,   '#060e1c');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    // ── Draw all flower-of-life nodes spread across canvas ──
    nodes.forEach(({ x, y, r, phase, speed, isGold }) => {
      // Each node breathes with its own phase
      const pulse = Math.sin(t * speed + phase);
      const liveR = r * (0.96 + pulse * 0.04);
      const alpha = 0.10 + pulse * 0.04 + (isGold ? 0.04 : 0);
      const col   = isGold ? GOLD : BLUE;
      const lw    = isGold ? 0.65 : 0.5;

      flowerOfLife(x, y, liveR, col, alpha, lw);
    });

    // ── Large slow background rings spanning the whole canvas ──
    // These give the "swooshy layers" feel at macro scale
    const bigCentres = [
      { fx: 0.18, fy: 0.25 },
      { fx: 0.82, fy: 0.18 },
      { fx: 0.50, fy: 0.60 },
      { fx: 0.08, fy: 0.78 },
      { fx: 0.90, fy: 0.72 },
    ];

    bigCentres.forEach(({ fx, fy }, i) => {
      const bx = fx * W;
      const by = fy * H;
      const br = Math.max(W, H) * (0.30 + i * 0.06);
      const pulse = Math.sin(t * 0.25 + i * 1.3) * 0.018;
      const col = i % 2 === 0 ? GOLD : LBLUE;
      const a = 0.055 + pulse;
      concentricRings(bx, by, br, 5, col, a, 0.55);
    });

    // ── Deep blue pulsing glow behind hero text ──
    const bluePulse = 0.13 + Math.sin(t * 0.35) * 0.07;
    const blueGlow = ctx.createRadialGradient(W * 0.38, H * 0.48, 0, W * 0.38, H * 0.48, W * 0.55);
    blueGlow.addColorStop(0,   rgba([30, 80, 180], bluePulse));
    blueGlow.addColorStop(0.45, rgba([20, 55, 140], bluePulse * 0.45));
    blueGlow.addColorStop(1,   rgba([10, 22, 60], 0));
    ctx.fillStyle = blueGlow;
    ctx.fillRect(0, 0, W, H);

    // ── Soft gold accent glow to anchor hero text ──
    const glow = ctx.createRadialGradient(W * 0.3, H * 0.5, 0, W * 0.3, H * 0.5, W * 0.45);
    glow.addColorStop(0,   rgba(GOLD, 0.05 + Math.sin(t * 0.5) * 0.02));
    glow.addColorStop(0.6, rgba(GOLD, 0.015));
    glow.addColorStop(1,   rgba(GOLD, 0));
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, W, H);

    raf = requestAnimationFrame(draw);
  }

  function init() {
    resize();
    cancelAnimationFrame(raf);
    draw();
  }

  window.addEventListener('resize', () => { cancelAnimationFrame(raf); resize(); draw(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(raf);
    else draw();
  });

  init();
})();

// ===== Mega Menu =====
const megaTriggers = document.querySelectorAll('.mega-trigger');

function closeAllMega() {
  document.querySelectorAll('.has-mega.mega-open').forEach(el => {
    el.classList.remove('mega-open');
    el.querySelector('.mega-trigger').setAttribute('aria-expanded', 'false');
  });
}

megaTriggers.forEach(trigger => {
  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const parent = trigger.closest('.has-mega');
    const isOpen = parent.classList.contains('mega-open');
    closeAllMega();
    if (!isOpen) {
      parent.classList.add('mega-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
  });
});

document.addEventListener('click', closeAllMega);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllMega(); });

// ===== Mobile Nav Toggle =====
const toggle = document.querySelector('.nav-toggle');
const navLinks = document.getElementById('navLinks');

if (toggle && navLinks) {
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = navLinks.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    if (!open) closeAllMega();
  });
  document.addEventListener('click', (e) => {
    if (navLinks.classList.contains('open') &&
        !toggle.contains(e.target) && !navLinks.contains(e.target)) {
      navLinks.classList.remove('open');
      toggle.setAttribute('aria-expanded', false);
      closeAllMega();
    }
  });
}

// ===== Active nav link =====
const currentPage = location.pathname.split('/').pop() || 'index.html';
document.querySelectorAll('.nav-links a').forEach(a => {
  const href = a.getAttribute('href');
  if (href === currentPage || (currentPage === '' && href === 'index.html')) {
    a.classList.add('active');
  }
});

// ===== Scroll reveal =====
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const els = document.querySelectorAll('.cards-grid .card, .entry-grid .entry-card, .steps .step, .resource-grid .resource-card');
  if (!els.length) return;

  els.forEach(el => {
    const idx = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
    el.classList.add('reveal-init');
    el.style.transitionDelay = Math.min(idx * 70, 350) + 'ms';
  });

  const io = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      el.classList.add('reveal-in');
      io.unobserve(el);
      // Hand transitions back to the hover styles once the reveal finishes
      el.addEventListener('transitionend', function done() {
        el.classList.remove('reveal-init', 'reveal-in');
        el.style.transitionDelay = '';
        el.removeEventListener('transitionend', done);
      });
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -30px 0px' });

  els.forEach(el => io.observe(el));
})();

// ===== Contact form =====
const form = document.getElementById('contactForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    btn.textContent = 'Sending…';

    try {
      const data = new FormData(form);
      await fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(data).toString(),
      });
      form.style.display = 'none';
      const success = document.getElementById('formSuccess');
      if (success) success.style.display = 'block';
    } catch {
      btn.disabled = false;
      btn.textContent = 'Send message';
      alert('Something went wrong. Please try again or email matt@hopeandlove.ca directly.');
    }
  });
}

// ===== Cookie Consent (Google Consent Mode v2) =====
(function () {
  var KEY = 'hl_consent_v1';
  window.dataLayer = window.dataLayer || [];
  function gtag(){ window.dataLayer.push(arguments); }
  if (typeof window.gtag !== 'function') { window.gtag = gtag; }

  function read() { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } }
  function save(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) {} }
  function apply(c) {
    window.gtag('consent', 'update', {
      analytics_storage:  c.analytics ? 'granted' : 'denied',
      ad_storage:         c.marketing ? 'granted' : 'denied',
      ad_user_data:       c.marketing ? 'granted' : 'denied',
      ad_personalization: c.marketing ? 'granted' : 'denied'
    });
  }

  var saved = read();
  if (saved && typeof saved === 'object') { apply(saved); }

  var banner = null;

  function prefRow(id, name, desc, checked, disabled) {
    return '<div class="cookie-pref"><div class="cookie-pref__label">' +
      '<div class="cookie-pref__name">' + name + '</div>' +
      '<div class="cookie-pref__desc">' + desc + '</div></div>' +
      '<label class="cookie-switch"><input type="checkbox" data-cc-pref="' + id + '"' +
      (checked ? ' checked' : '') + (disabled ? ' disabled' : '') +
      ' aria-label="' + name + '"><span class="cookie-switch__track"></span></label></div>';
  }

  function build() {
    var el = document.createElement('div');
    el.className = 'cookie-consent';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Cookie consent');
    el.innerHTML =
      '<div class="cookie-consent__title">Your privacy matters</div>' +
      '<p class="cookie-consent__text">We use cookies to keep this site running and, with your consent, to measure how it is used and improve our advertising. See our <a href="privacy-policy.html">Privacy &amp; Cookie Policy</a>.</p>' +
      '<div class="cookie-consent__prefs">' +
        prefRow('necessary', 'Strictly necessary', 'Required for the site to function. Always on.', true, true) +
        prefRow('analytics', 'Analytics', 'Helps us understand how the site is used (Google Analytics).', false, false) +
        prefRow('marketing', 'Marketing', 'Measures and improves our advertising (Google Ads).', false, false) +
      '</div>' +
      '<div class="cookie-consent__actions">' +
        '<button type="button" class="cookie-btn cookie-btn--accept" data-cc="accept">Accept all</button>' +
        '<button type="button" class="cookie-btn cookie-btn--decline" data-cc="decline">Decline</button>' +
        '<button type="button" class="cookie-btn cookie-btn--manage" data-cc="manage">Manage preferences</button>' +
        '<button type="button" class="cookie-btn cookie-btn--accept cookie-btn--save" data-cc="save">Save choices</button>' +
      '</div>';
    el.addEventListener('click', onClick);
    return el;
  }

  function onClick(e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-cc]') : null;
    if (!t) return;
    var action = t.getAttribute('data-cc');
    if (action === 'accept') commit({ analytics: true, marketing: true });
    else if (action === 'decline') commit({ analytics: false, marketing: false });
    else if (action === 'manage') banner.classList.add('is-managing');
    else if (action === 'save') {
      commit({
        analytics: !!banner.querySelector('[data-cc-pref="analytics"]').checked,
        marketing: !!banner.querySelector('[data-cc-pref="marketing"]').checked
      });
    }
  }

  function reflect() {
    var s = read();
    if (!s || !banner) return;
    var a = banner.querySelector('[data-cc-pref="analytics"]');
    var m = banner.querySelector('[data-cc-pref="marketing"]');
    if (a) a.checked = !!s.analytics;
    if (m) m.checked = !!s.marketing;
  }

  function show(managing) {
    if (!banner) { banner = build(); document.body.appendChild(banner); }
    banner.removeAttribute('hidden');
    if (managing) { banner.classList.add('is-managing'); reflect(); }
    requestAnimationFrame(function () { banner.classList.add('is-visible'); });
  }

  function hide() {
    if (!banner) return;
    banner.classList.remove('is-visible', 'is-managing');
    setTimeout(function () {
      if (banner && !banner.classList.contains('is-visible')) banner.setAttribute('hidden', '');
    }, 550);
  }

  function commit(choice) {
    var c = { necessary: true, analytics: !!choice.analytics, marketing: !!choice.marketing, ts: Date.now() };
    save(c); apply(c); hide();
  }

  window.hlOpenCookieSettings = function () { show(true); };
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
    if (t) { e.preventDefault(); window.hlOpenCookieSettings(); }
  });

  if (!saved) {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function () { show(false); });
    } else { show(false); }
  }
})();