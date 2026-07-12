const ADMIN_PASSWORD = 'admin';

function login() {
  const pass = document.getElementById('adminPass').value;
  if (pass === ADMIN_PASSWORD) {
    sessionStorage.setItem('fpsboost_admin', '1');
    showPanel();
    showToast('✓ Welcome!');
  } else {
    showToast('❌ Wrong password!');
  }
}

function logout() {
  sessionStorage.removeItem('fpsboost_admin');
  document.getElementById('adminPanel').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
  document.getElementById('adminPass').value = '';
}

function showPanel() {
  document.getElementById('loginScreen').classList.add('hidden');
  document.getElementById('adminPanel').classList.remove('hidden');
  loadAll();
}

document.addEventListener('click', (e) => {
  if (e.target.classList.contains('tab')) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.add('hidden'));
    e.target.classList.add('active');
    document.getElementById('tab-' + e.target.dataset.tab).classList.remove('hidden');
  }
});

function savePassword() {
  const val = document.getElementById('cfgPassword').value.trim();
  if (!val) return showToast('❌ Enter password');
  localStorage.setItem('fpsboost_password', val);
  showToast('✓ Saved');
}

function saveConfig() {
  const config = {
    url: document.getElementById('cfgUrl').value.trim() || 'fpsboost.zip',
    name: document.getElementById('cfgName').value.trim() || 'fpsboost.zip',
    size: document.getElementById('cfgSize').value.trim() || '18 MB',
    password: document.getElementById('cfgPassword').value.trim() || 'fpsboost'
  };
  localStorage.setItem('fpsboost_config', JSON.stringify(config));
  showToast('✓ Settings saved');
}

function testDownload() {
  const url = document.getElementById('cfgUrl').value.trim() || 'fpsboost.zip';
  window.open(url, '_blank');
}

function loadConfig() {
  const cfg = localStorage.getItem('fpsboost_config');
  if (cfg) {
    try {
      const c = JSON.parse(cfg);
      document.getElementById('cfgUrl').value = c.url || '';
      document.getElementById('cfgName').value = c.name || '';
      document.getElementById('cfgSize').value = c.size || '';
      document.getElementById('cfgPassword').value = c.password || '';
    } catch(e) {}
  }
  const pwd = localStorage.getItem('fpsboost_password');
  if (pwd && !document.getElementById('cfgPassword').value) {
    document.getElementById('cfgPassword').value = pwd;
  }
}

function getReviews() {
  const stored = localStorage.getItem('fpsboost_reviews');
  if (stored) {
    try { return JSON.parse(stored); } catch(e) { return null; }
  }
  return null;
}

function addReview() {
  const name = document.getElementById('revName').value.trim();
  const text = document.getElementById('revText').value.trim();
  const rating = parseInt(document.getElementById('revRating').value) || 5;
  const avatar = document.getElementById('revAvatar').value.trim() || '⭐';

  if (!name || !text) return showToast('❌ Fill name and text');

  let reviews = getReviews() || [];
  reviews.unshift({
    name, text, rating, avatar,
    date: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
  });

  localStorage.setItem('fpsboost_reviews', JSON.stringify(reviews));
  showToast('✓ Added');
  renderReviews();

  document.getElementById('revName').value = '';
  document.getElementById('revText').value = '';
  document.getElementById('revAvatar').value = '';
}

function deleteReview(idx) {
  let reviews = getReviews() || [];
  reviews.splice(idx, 1);
  if (reviews.length === 0) localStorage.removeItem('fpsboost_reviews');
  else localStorage.setItem('fpsboost_reviews', JSON.stringify(reviews));
  renderReviews();
  showToast('✓ Deleted');
}

function resetReviews() {
  if (confirm('Reset to default reviews?')) {
    localStorage.removeItem('fpsboost_reviews');
    renderReviews();
    showToast('✓ Reset');
  }
}

function renderReviews() {
  const reviews = getReviews();
  const list = document.getElementById('reviewList');
  if (!reviews || !reviews.length) {
    list.innerHTML = '<p style="color:var(--text-2);text-align:center;padding:30px">No custom reviews. Default will be shown.</p>';
    return;
  }
  list.innerHTML = '';
  reviews.forEach((r, i) => {
    const div = document.createElement('div');
    div.className = 'review-row';
    div.innerHTML = `
      <div style="font-size:1.5rem;width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,var(--p1),var(--p3));display:flex;align-items:center;justify-content:center;flex-shrink:0">${r.avatar || '⭐'}</div>
      <div class="review-row-info">
        <strong>${escapeHtml(r.name)}</strong>
        <small>${'★'.repeat(r.rating || 5)} — ${escapeHtml(r.text.substring(0, 70))}${r.text.length > 70 ? '...' : ''}</small>
      </div>
      <button class="btn-del" onclick="deleteReview(${i})">Delete</button>
    `;
    list.appendChild(div);
  });
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function loadStats() {
  const dl = parseInt(localStorage.getItem('fpsboost_downloads') || '0');
  const reviews = getReviews() || [];
  document.getElementById('statDownloads').textContent = dl.toLocaleString();
  document.getElementById('statReviews').textContent = reviews.length;
}

function resetStats() {
  if (confirm('Reset download counter?')) {
    localStorage.removeItem('fpsboost_downloads');
    loadStats();
    showToast('✓ Reset');
  }
}

function loadAll() {
  loadConfig();
  renderReviews();
  loadStats();
}

document.addEventListener('DOMContentLoaded', () => {
  if (sessionStorage.getItem('fpsboost_admin')) showPanel();
  document.getElementById('adminPass').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') login();
  });
});

function showToast(text) {
  const toast = document.getElementById('toast');
  document.getElementById('toastText').textContent = text;
  toast.classList.add('show');
  clearTimeout(window._toastT);
  window._toastT = setTimeout(() => toast.classList.remove('show'), 2500);
}
