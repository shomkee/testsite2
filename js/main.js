const CONFIG = {
  downloadUrl: 'fpsboost.zip',
  fileName: 'fpsboost.zip',
  fileSize: '18 MB',
  password: 'fpsboost'
};

function handleDownload(e) {
  if (e) e.preventDefault();
  showModal();
  simulateDownload();
}

function showModal() {
  document.getElementById('downloadModal').classList.add('active');
}

function hideModal() {
  document.getElementById('downloadModal').classList.remove('active');
  document.getElementById('progressFill').style.width = '0%';
}

function simulateDownload() {
  const progress = document.getElementById('progressFill');
  const status = document.getElementById('modalStatus');
  const statuses = [
    'Connecting to server...',
    'Verifying file integrity...',
    'Preparing download...',
    'Almost ready...',
    'Starting download...'
  ];
  let p = 0;
  const interval = setInterval(() => {
    p += Math.random() * 18 + 2;
    if (p >= 100) {
      p = 100;
      progress.style.width = '100%';
      status.textContent = '✓ Download started!';
      clearInterval(interval);

      const a = document.createElement('a');
      a.href = CONFIG.downloadUrl;
      a.download = CONFIG.fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      incrementDownloads();
      setTimeout(hideModal, 2000);
    } else {
      progress.style.width = p + '%';
      const idx = Math.min(Math.floor(p / 22), statuses.length - 1);
      status.textContent = statuses[idx];
    }
  }, 280);
}

function getDownloads() {
  return parseInt(localStorage.getItem('fpsboost_downloads') || '412847');
}

function incrementDownloads() {
  const current = getDownloads() + 1;
  localStorage.setItem('fpsboost_downloads', current);
  const el = document.getElementById('downloadsHero');
  if (el) el.textContent = current.toLocaleString();
}

function updateOnline() {
  const base = 5400;
  const variance = Math.floor(Math.random() * 300);
  const el = document.getElementById('onlineHero');
  if (el) el.textContent = (base + variance).toLocaleString();
}

const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initHeader() {
  const header = document.getElementById('header');
  const float = document.getElementById('floatDownload');
  const sysbar = document.getElementById('sysbar');
  const progress = document.getElementById('scrollProgress');

  function onScroll() {
    const y = window.scrollY;
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docH > 0 ? (y / docH) * 100 : 0;

    if (header) header.classList.toggle('scrolled', y > 50);
    if (float) float.classList.toggle('show', y > 900);
    if (progress) progress.style.width = pct + '%';

    // 5) Semi-transparent bar appears after a bit of scroll and eases downward
    if (sysbar) {
      const visible = y > 420 && y < docH - 220;
      sysbar.classList.toggle('show', visible);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Smoothly track the scroll position so the bar drifts down as you scroll
  if (sysbar && !prefersReduced) {
    let current = 0;
    const range = 26; // how far the bar drifts as you move through the page
    sysbar.style.transition = 'opacity .45s ease'; // JS drives the transform
    function loop() {
      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const target = docH > 0 ? Math.min(window.scrollY / docH, 1) : 0;
      current += (target - current) * 0.08;
      sysbar.style.transform = `translate(-50%, ${(-24) + current * range + (sysbar.classList.contains('show') ? 24 : 0)}px)`;
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }
}

function initTilt() {
  document.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
    });
  });
}

function initFAQ() {
  document.querySelectorAll('.faq-q').forEach(btn => {
    btn.addEventListener('click', () => {
      const item = btn.parentElement;
      const wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
      if (!wasOpen) item.classList.add('open');
    });
  });
}

// 1) Scroll-reveal animations for a smooth, progressive feel
function initReveal() {
  const els = document.querySelectorAll('.reveal');
  if (prefersReduced || !('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
  els.forEach(el => io.observe(el));
}

/* =========================================================
   3) Live moving charts (canvas). Continuous scrolling
   waveforms so the graphs feel "alive", like the mockups.
   ========================================================= */
function makeHiDPI(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const w = rect.width || canvas.clientWidth || 600;
  const h = parseInt(canvas.getAttribute('data-h') || '260', 10);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, w, h };
}

// A drifting spiky FPS series generator
function seriesValue(t, base, amp, spike, seed) {
  const n = Math.sin(t * 1.7 + seed) * 0.5 + Math.sin(t * 3.3 + seed * 2) * 0.3 + Math.sin(t * 5.1 + seed * 3) * 0.2;
  const jitter = (Math.sin(t * 13.1 + seed * 5) * 0.5 + Math.sin(t * 21.7 + seed) * 0.5) * spike;
  return base + n * amp + jitter;
}

function initFpsChart() {
  const canvas = document.getElementById('fpsChart');
  if (!canvas) return;
  let dims = makeHiDPI(canvas);

  const points = 120;
  let phase = 0;

  function line(ctx, w, h, colorTop, colorGlow, base, amp, spike, seed, fillTop) {
    const step = w / (points - 1);
    const pts = [];
    for (let i = 0; i < points; i++) {
      const t = phase + i * 0.09;
      let v = seriesValue(t, base, amp, spike, seed);
      v = Math.max(0.05, Math.min(0.95, v));
      pts.push([i * step, h - v * h]);
    }
    // area fill
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, fillTop);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.moveTo(0, h);
    pts.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    // stroke
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.lineWidth = 2;
    ctx.strokeStyle = colorTop;
    ctx.shadowColor = colorGlow;
    ctx.shadowBlur = 12;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function frame() {
    const { ctx, w, h } = dims;
    ctx.clearRect(0, 0, w, h);
    // faint baseline grid
    ctx.strokeStyle = 'rgba(239,68,68,.06)';
    ctx.lineWidth = 1;
    for (let g = 1; g < 4; g++) {
      const yy = (h / 4) * g;
      ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke();
    }
    // Before (red, lower & spikier)
    line(ctx, w, h, '#ef4444', 'rgba(239,68,68,.8)', 0.34, 0.10, 0.16, 1.0, 'rgba(239,68,68,.16)');
    // After (blue/indigo, higher & more stable)
    line(ctx, w, h, '#7c93ff', 'rgba(124,147,255,.85)', 0.66, 0.06, 0.05, 4.0, 'rgba(124,147,255,.14)');
    if (!prefersReduced) phase += 0.02;
  }

  window.addEventListener('resize', () => { dims = makeHiDPI(canvas); frame(); });
  if (prefersReduced) { frame(); return; }
  (function loop() { frame(); requestAnimationFrame(loop); })();
}

function initLatencyChart() {
  const canvas = document.getElementById('latChart');
  if (!canvas) return;
  let dims = makeHiDPI(canvas);
  const points = 90;
  let phase = 0;

  function wave(ctx, w, h, color, glow, fill, base, amp, seed) {
    const step = w / (points - 1);
    const pts = [];
    for (let i = 0; i < points; i++) {
      const t = phase + i * 0.12;
      let v = base + (Math.sin(t * 1.3 + seed) * 0.5 + Math.sin(t * 2.7 + seed * 2) * 0.3 + Math.sin(t * 4.9 + seed) * 0.2) * amp;
      v = Math.max(0.08, Math.min(0.92, v));
      pts.push([i * step, h - v * h]);
    }
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, fill);
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.moveTo(0, h);
    pts.forEach(p => ctx.lineTo(p[0], p[1]));
    ctx.lineTo(w, h); ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();
    ctx.beginPath();
    pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.lineWidth = 2.5; ctx.strokeStyle = color;
    ctx.shadowColor = glow; ctx.shadowBlur = 14; ctx.stroke(); ctx.shadowBlur = 0;
    // leading dot
    const last = pts[pts.length - 1];
    ctx.beginPath(); ctx.arc(last[0] - 1, last[1], 4, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.shadowColor = glow; ctx.shadowBlur = 16; ctx.fill(); ctx.shadowBlur = 0;
  }

  function frame() {
    const { ctx, w, h } = dims;
    ctx.clearRect(0, 0, w, h);
    // Before (red, high latency)
    wave(ctx, w, h, '#ef4444', 'rgba(239,68,68,.8)', 'rgba(239,68,68,.18)', 0.68, 0.12, 1.0);
    // After (blue, low latency)
    wave(ctx, w, h, '#7c93ff', 'rgba(124,147,255,.85)', 'rgba(124,147,255,.16)', 0.24, 0.06, 5.0);
    if (!prefersReduced) phase += 0.03;
  }
  window.addEventListener('resize', () => { dims = makeHiDPI(canvas); frame(); });
  if (prefersReduced) { frame(); return; }
  (function loop() { frame(); requestAnimationFrame(loop); })();
}

function copyPassword(btn) {
  const text = document.getElementById(btn.dataset.target).textContent;
  navigator.clipboard.writeText(text).then(() => showToast('✓ Password copied!'));
}

function showToast(text) {
  const toast = document.getElementById('toast');
  document.getElementById('toastText').textContent = text;
  toast.classList.add('show');
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(() => toast.classList.remove('show'), 2500);
}

function loadConfig() {
  const stored = localStorage.getItem('fpsboost_config');
  if (stored) {
    try {
      const cfg = JSON.parse(stored);
      if (cfg.url) CONFIG.downloadUrl = cfg.url;
      if (cfg.name) CONFIG.fileName = cfg.name;
      if (cfg.size) {
        CONFIG.fileSize = cfg.size;
        const el = document.getElementById('sizeBadge');
        if (el) el.textContent = 'v3.2 • ' + cfg.size;
      }
      if (cfg.password) {
        CONFIG.password = cfg.password;
        const el = document.getElementById('passwordDisplay');
        if (el) el.textContent = cfg.password;
      }
    } catch(e) {}
  }
}

function loadReviews() {
  const stored = localStorage.getItem('fpsboost_reviews');
  if (!stored) return;
  try {
    const reviews = JSON.parse(stored);
    const grid = document.getElementById('reviewsGrid');
    if (!grid || !reviews.length) return;
    grid.innerHTML = '';
    reviews.forEach(r => {
      const card = document.createElement('div');
      card.className = 'review-card reveal';
      card.innerHTML = `
        <div class="review-stars">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</div>
        <p class="review-text">"${escapeHtml(r.text)}"</p>
        <div class="review-author">
          <div class="review-avatar">${r.avatar || '⭐'}</div>
          <div class="review-info">
            <div class="review-name">${escapeHtml(r.name)}</div>
            <div class="review-date">${r.date || 'recent'}</div>
          </div>
        </div>`;
      grid.appendChild(card);
    });
  } catch(e) {}
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', () => {
  ['heroDownload', 'headerDownload', 'ctaDownload', 'floatDownload', 'optDownload', 'sysbarDownload', 'perfDownload'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('click', handleDownload);
  });

  document.getElementById('modalClose').addEventListener('click', hideModal);
  document.getElementById('downloadModal').addEventListener('click', (e) => {
    if (e.target.id === 'downloadModal') hideModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') hideModal();
  });

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => copyPassword(btn));
  });

  initHeader();
  initTilt();
  initFAQ();
  initReveal();
  initFpsChart();
  initLatencyChart();
  updateOnline();
  setInterval(updateOnline, 5000);

  loadConfig();
  loadReviews();
  const el = document.getElementById('downloadsHero');
  if (el) el.textContent = getDownloads().toLocaleString();

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  console.log('%c🔥 FPS BOOST loaded', 'color:#ef4444;font-size:18px;font-weight:bold');
});
