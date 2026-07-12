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

function initHeader() {
  const header = document.getElementById('header');
  const float = document.getElementById('floatDownload');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) header.classList.add('scrolled');
    else header.classList.remove('scrolled');
    if (window.scrollY > 600) float.classList.add('show');
    else float.classList.remove('show');
  });
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
      card.className = 'review-card';
      card.innerHTML = `
        <div class="review-stars">${'★'.repeat(r.rating || 5)}${'☆'.repeat(5 - (r.rating || 5))}</div>
        <p class="review-text">"${escapeHtml(r.text)}"</p>
        <div class="review-author">
          <div class="review-avatar">${r.avatar || '⭐'}</div>
          <div class="review-info">
            <div class="review-name">${escapeHtml(r.name)}</div>
            <div class="review-date">${r.date || 'recent'}</div>
          </div>
        </div>
      `;
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
  ['heroDownload', 'headerDownload', 'ctaDownload', 'floatDownload'].forEach(id => {
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
