/**
 * UGDE-JCR Voting Platform - Frontend JavaScript
 */

function id(n) { return document.getElementById(n); }

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str).replace(/[&<>"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
}

function toast(type, message, duration = 4500) {
  const stack = id('toastStack');
  const icon = type === 'success' ? '✓' : type === 'error' ? '!' : 'i';

  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <span class="toast-msg"></span>
    <button class="toast-close" aria-label="Dismiss">&times;</button>
  `;
  el.querySelector('.toast-msg').textContent = message;

  const remove = () => {
    el.classList.add('leaving');
    setTimeout(() => el.remove(), 250);
  };
  el.querySelector('.toast-close').onclick = remove;
  const timer = setTimeout(remove, duration);
  el.addEventListener('mouseenter', () => clearTimeout(timer));

  stack.appendChild(el);
}

function switchView(v, btn) {
  document.querySelectorAll('.view-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  id(v).classList.add('active');
  if (btn) btn.classList.add('active');
  if (v === 'votingView') fetchNominees();
  if (v === 'registerView') { startRegisterAutoRefresh(); } else { stopRegisterAutoRefresh(); }
  if (v === 'adminDashboardView') { loadAdminData(); loadPayments(); loadCategoryManagement(); startAdminAutoRefresh(); } else { stopAdminAutoRefresh(); }
  if (v === 'candidateDashboardView') loadCandidateData();
}

function slugify(str) {
  return 'cat-' + str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// ===== FETCH AND GROUP CANDIDATES BY CATEGORY =====
async function fetchNominees() {
  const res = await fetch('index.php?api=get_public_contestants');
  const data = await res.json();
  if (!data.success) { toast('error', 'Could not load candidates. Refresh to try again.'); return; }

  const grid = id('contestantsGrid');
  grid.innerHTML = '';

  if (data.data.length === 0) {
    grid.innerHTML = '<p class="empty-state">No approved candidates yet. Check back soon.</p>';
    return;
  }

  // Group by category
  const groups = {};
  data.data.forEach(c => {
    const cat = c.category || 'Uncategorized';
    (groups[cat] = groups[cat] || []).push(c);
  });

  // Order follows CATEGORIES (from PHP), any leftovers appended after
  const order = CATEGORIES.filter(cat => groups[cat]);
  Object.keys(groups).forEach(k => { if (!order.includes(k)) order.push(k); });

  // ---- Populate the filter dropdown (once) ----
  const filterSelect = id('categoryFilter');
  if (filterSelect.options.length <= 1) {
    order.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      filterSelect.appendChild(opt);
    });
  }

  // ---- Build the main grid ----
  order.forEach(cat => {
    const candidates = groups[cat];
    if (!candidates || candidates.length === 0) return;

    const header = document.createElement('h2');
    header.className = 'category-header';
    header.id = slugify(cat);
    header.textContent = cat;
    grid.appendChild(header);

    const gridSub = document.createElement('div');
    gridSub.className = 'grid';
    gridSub.dataset.category = cat;

    candidates.forEach((c, i) => {
      const card = document.createElement('div');
      card.className = 'contestant-card';
      card.style.animationDelay = Math.min(i * 60, 480) + 'ms';

      const imgWrap = document.createElement('div');
      imgWrap.className = 'card-img-wrap';
      const img = document.createElement('img');
      img.src = c.image_path;
      img.alt = c.name;
      imgWrap.appendChild(img);
      const badge = document.createElement('span');
      badge.className = 'nominee-badge';
      badge.textContent = c.nominee_code;
      imgWrap.appendChild(badge);
      card.appendChild(imgWrap);

      const content = document.createElement('div');
      content.style.padding = '1.5rem';

      const nameEl = document.createElement('h3');
      nameEl.textContent = c.name;
      content.appendChild(nameEl);

      const deptEl = document.createElement('p');
      deptEl.className = 'dept-label';
      deptEl.textContent = c.dept;
      content.appendChild(deptEl);

      const btn = document.createElement('button');
      btn.className = 'btn-action';
      btn.textContent = 'Cast Vote';
      btn.dataset.candidateId = c.id;
      btn.dataset.candidateName = c.name;
      content.appendChild(btn);

      card.appendChild(content);
      gridSub.appendChild(card);
    });

    grid.appendChild(gridSub);
  });

  // ---- Filter logic ----
  const filter = id('categoryFilter');
  // Remove previous listener to avoid duplicates
  const newFilter = filter.cloneNode(true);
  filter.parentNode.replaceChild(newFilter, filter);
  newFilter.addEventListener('change', function() {
    const selected = this.value;
    const sections = document.querySelectorAll('.category-header');
    sections.forEach(header => {
      const gridContainer = header.nextElementSibling;
      if (!gridContainer || !gridContainer.classList.contains('grid')) return;
      if (selected === 'all' || header.textContent === selected) {
        header.style.display = '';
        gridContainer.style.display = '';
      } else {
        header.style.display = 'none';
        gridContainer.style.display = 'none';
      }
    });
  });
}

// Event delegation for Cast Vote buttons
id('contestantsGrid').addEventListener('click', function(e) {
  const btn = e.target.closest('.btn-action');
  if (!btn || !btn.dataset.candidateId) return;
  openVoteModal(btn.dataset.candidateId, btn.dataset.candidateName);
});

function openVoteModal(cid, name) {
  id('v_cid').value = cid;
  id('modalCName').textContent = name;
  id('voteModal').style.display = 'flex';
  id('v_status').innerText = '';
  id('v_qty').value = 1;
  id('v_total').innerText = '1.00';
}
function closeModal() { id('voteModal').style.display = 'none'; }
id('v_qty').oninput = function() {
  const q = Math.max(1, parseInt(this.value, 10) || 1);
  id('v_total').innerText = (q * 1.00).toFixed(2);
};

async function initiatePaystack() {
  const email = id('v_email').value;
  if (!email) { id('v_status').innerText = 'Please enter a valid email address.'; return; }

  const payload = {
    contestantId: id('v_cid').value,
    name: id('v_name').value,
    phone: id('v_phone').value,
    email: email,
    quantity: id('v_qty').value
  };

  const btn = id('payBtn');
  btn.innerText = "Connecting to Paystack...";
  btn.disabled = true;

  try {
    const res = await fetch('index.php?api=vote_init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success && data.authorization_url) {
      window.location.href = data.authorization_url;
    } else {
      id('v_status').innerText = data.message || 'Payment initialization failed.';
      btn.innerText = "Pay Now";
      btn.disabled = false;
    }
  } catch (e) {
    id('v_status').innerText = 'Network error, please try again.';
    btn.innerText = "Pay Now";
    btn.disabled = false;
  }
}

function checkCategoryClosed(selectedCategory) {
  const btn = id('regSubmitBtn');
  const note = id('regClosedNote');
  const isClosed = CLOSED_NOMINATION_CATEGORIES.includes(selectedCategory);
  btn.disabled = isClosed;
  note.style.display = isClosed ? 'block' : 'none';
}

async function refreshCategoryStatus() {
  try {
    const res = await fetch('index.php?api=get_category_status');
    const data = await res.json();
    if (!data.success) return;
    CLOSED_NOMINATION_CATEGORIES = data.closed;

    const select = id('regCategory');
    if (select) {
      Array.from(select.options).forEach(opt => {
        if (!opt.value) return;
        const closed = CLOSED_NOMINATION_CATEGORIES.includes(opt.value);
        opt.textContent = opt.value + (closed ? ' (Nominations Closed)' : '');
      });
      checkCategoryClosed(select.value);
    }
  } catch (e) {
    // Silent background sync
  }
}

let registerAutoRefreshTimer = null;
function startRegisterAutoRefresh() {
  stopRegisterAutoRefresh();
  registerAutoRefreshTimer = setInterval(refreshCategoryStatus, 20000);
}
function stopRegisterAutoRefresh() {
  if (registerAutoRefreshTimer) { clearInterval(registerAutoRefreshTimer); registerAutoRefreshTimer = null; }
}

// --- Admin: Manage Nominations ---
async function loadCategoryManagement() {
  const container = id('categoryStatusList');
  try {
    const res = await fetch('index.php?api=admin_get_categories');
    const data = await res.json();
    if (!data.success) { container.innerHTML = '<p style="color:var(--err);">Could not load categories.</p>'; return; }

    container.innerHTML = '';
    data.categories.forEach(item => {
      const row = document.createElement('div');
      row.className = 'category-status-row';

      const nameWrap = document.createElement('span');
      const nameText = document.createElement('span');
      nameText.className = 'cat-name';
      nameText.textContent = item.category;
      nameWrap.appendChild(nameText);

      const badge = document.createElement('span');
      badge.className = 'cat-badge ' + (item.closed ? 'closed' : 'open');
      badge.textContent = item.closed ? 'Closed' : 'Open';
      nameWrap.appendChild(badge);
      row.appendChild(nameWrap);

      const btn = document.createElement('button');
      btn.className = 'btn-action';
      btn.textContent = item.closed ? 'Reopen Nominations' : 'Close Nominations';
      btn.onclick = () => toggleCategoryStatus(item.category, btn);
      row.appendChild(btn);

      container.appendChild(row);
    });
  } catch (e) {
    container.innerHTML = '<p style="color:var(--err);">Network error loading categories.</p>';
  }
}

async function toggleCategoryStatus(category, btn) {
  btn.disabled = true;
  try {
    const res = await fetch('index.php?api=admin_toggle_category', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ category })
    });
    const data = await res.json();
    if (data.success) {
      toast('success', `${category} nominations are now ${data.closed ? 'CLOSED' : 'OPEN'}.`);
      loadCategoryManagement();
    } else {
      toast('error', data.message || 'Could not update category.');
      btn.disabled = false;
    }
  } catch (e) {
    toast('error', 'Network error, please try again.');
    btn.disabled = false;
  }
}

async function handleRegistration(e) {
  e.preventDefault();
  const btn = id('regSubmitBtn');
  const originalLabel = 'Submit Candidacy';

  btn.disabled = true;
  btn.textContent = 'Submitting...';

  try {
    const res = await fetch('index.php?api=candidate_register', { method: 'POST', body: new FormData(e.target) });
    const data = await res.json();
    toast(data.success ? 'success' : 'error', data.message);
    if (data.success) e.target.reset();
  } catch (err) {
    toast('error', 'Network error, please try again.');
  } finally {
    btn.textContent = originalLabel;
    const catNow = id('regCategory').value;
    btn.disabled = CLOSED_NOMINATION_CATEGORIES.includes(catNow);
  }
}

async function handleAdminLogin() {
  const btn = id('adminLoginBtn');
  const originalText = btn.textContent;

  btn.disabled = true;
  btn.textContent = 'Logging in...';

  try {
    const res = await fetch('index.php?api=admin_login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: id('admUser').value, password: id('admPass').value })
    });
    const data = await res.json();
    if (data.success) {
      switchView('adminDashboardView');
      toast('success', 'Signed in.');
    } else {
      toast('error', data.message || 'Invalid login.');
    }
  } catch (e) {
    toast('error', 'Network error, please try again.');
  } finally {
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

let voteChartInstance = null;
let chartFilterPopulated = false;
let cachedContestants = [];
let adminAutoRefreshTimer = null;

async function loadAdminData() {
  const res = await fetch('index.php?api=admin_get_full_data');
  const data = await res.json();
  id('statVotes').innerText = data.totalVotes;
  id('statRev').innerText = `GHS ${data.totalRevenue.toFixed(2)}`;

  const filterSel = id('chartCategoryFilter');
  if (!chartFilterPopulated && data.categories) {
    data.categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat; opt.textContent = cat;
      filterSel.appendChild(opt);
    });
    chartFilterPopulated = true;
  }

  cachedContestants = data.contestants || [];

  const tbody = id('adminTableBody');
  tbody.innerHTML = '';
  cachedContestants.forEach(c => {
    const tr = document.createElement('tr');

    const tdName = document.createElement('td');
    tdName.textContent = c.name;
    tr.appendChild(tdName);

    const tdCat = document.createElement('td');
    tdCat.textContent = c.category || '—';
    tr.appendChild(tdCat);

    const tdCode = document.createElement('td');
    tdCode.textContent = c.nominee_code;
    tr.appendChild(tdCode);

    const tdVotes = document.createElement('td');
    tdVotes.textContent = c.votes;
    tr.appendChild(tdVotes);

    const tdActions = document.createElement('td');
    tdActions.className = 'admin-actions';

    const viewBtn = document.createElement('button');
    viewBtn.className = 'btn-action';
    viewBtn.textContent = 'View';
    viewBtn.onclick = () => viewCandidate(c.id);
    tdActions.appendChild(viewBtn);

    if (c.approved == 0) {
      const approveBtn = document.createElement('button');
      approveBtn.className = 'btn-action';
      approveBtn.textContent = 'Approve';
      approveBtn.onclick = () => approve(c.id);
      tdActions.appendChild(approveBtn);
    } else {
      const liveSpan = document.createElement('span');
      liveSpan.style.color = 'var(--ok)';
      liveSpan.textContent = '✔ Live';
      tdActions.appendChild(liveSpan);
    }

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn-action';
    resetBtn.textContent = 'Reset Pass';
    resetBtn.onclick = () => resetCandidatePass(c.nominee_code);
    tdActions.appendChild(resetBtn);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-action btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.onclick = () => deleteCandidate(c.id, c.name);
    tdActions.appendChild(deleteBtn);

    tr.appendChild(tdActions);
    tbody.appendChild(tr);
  });

  applyChartFilter();
}

function applyChartFilter() {
  const filterVal = id('chartCategoryFilter').value;
  const filtered = filterVal ? cachedContestants.filter(c => c.category === filterVal) : cachedContestants;
  renderChart(filtered.map(c => c.name), filtered.map(c => c.votes));
}

function startAdminAutoRefresh() {
  stopAdminAutoRefresh();
  adminAutoRefreshTimer = setInterval(() => {
    if (document.visibilityState === 'visible') {
      loadAdminData();
      loadCategoryManagement();
    }
  }, 30000);
}
function stopAdminAutoRefresh() {
  if (adminAutoRefreshTimer) { clearInterval(adminAutoRefreshTimer); adminAutoRefreshTimer = null; }
}

function renderChart(labels, votes) {
  const ctx = document.getElementById('voteChart').getContext('2d');
  if (voteChartInstance) voteChartInstance.destroy();
  voteChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Votes',
        data: votes,
        backgroundColor: 'rgba(255,200,87,0.7)',
        borderColor: '#FFC857',
        borderWidth: 2,
        borderRadius: 6,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
      },
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#8FA0C4' } },
        x: { grid: { display: false }, ticks: { color: '#8FA0C4', maxRotation: 45, minRotation: 20 } }
      }
    }
  });
}

// --- View Candidate (Admin) ---
async function viewCandidate(candId) {
  const modal = id('candidateViewModal');
  const content = id('candidateViewContent');
  content.innerHTML = '<p style="color:var(--slate-400);">Loading...</p>';
  modal.style.display = 'flex';

  if (!candId) {
    content.innerHTML = '<p style="color:var(--err);">Invalid candidate.</p>';
    return;
  }

  try {
    const res = await fetch(`index.php?api=admin_get_candidate_details&id=${candId}`);
    if (!res.ok) {
      content.innerHTML = `<p style="color:var(--err);">Server error (${res.status}).</p>`;
      return;
    }
    const data = await res.json();
    if (!data.success || !data.candidate) {
      content.innerHTML = `<p style="color:var(--err);">${escapeHtml(data.message || 'Candidate not found.')}</p>`;
      return;
    }
    const c = data.candidate;
    const isApproved = c.approved == 1;
    content.innerHTML = `
      <div style="margin: 0.5rem 0;">
        <img src="${escapeHtml(c.image_path)}" alt="${escapeHtml(c.name)}" class="modal-image">
      </div>
      <div class="modal-detail-row"><span class="label">Name</span><span class="value">${escapeHtml(c.name)}</span></div>
      <div class="modal-detail-row"><span class="label">Code</span><span class="value">${escapeHtml(c.nominee_code)}</span></div>
      <div class="modal-detail-row"><span class="label">Category</span><span class="value">${escapeHtml(c.category || '—')}</span></div>
      <div class="modal-detail-row"><span class="label">Department</span><span class="value">${escapeHtml(c.dept)}</span></div>
      <div class="modal-detail-row"><span class="label">Bio</span><span class="value" style="white-space:pre-wrap;">${escapeHtml(c.bio || 'No bio provided.')}</span></div>
      <div class="modal-detail-row"><span class="label">Votes</span><span class="value">${escapeHtml(c.votes)}</span></div>
      <div class="modal-detail-row"><span class="label">Status</span><span class="value">${isApproved ? '✅ Approved' : '⏳ Pending'}</span></div>
      ${!isApproved ? `<button class="btn-action" onclick="approveFromView(${c.id})" style="margin-top:15px;">Approve Now</button>` : ''}
    `;
  } catch (e) {
    console.error('viewCandidate failed:', e);
    content.innerHTML = '<p style="color:var(--err);">Network error.</p>';
  }
}

async function approveFromView(candId) {
  await fetch('index.php?api=approve_candidate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: candId}) });
  toast('success', 'Candidate approved.');
  closeCandidateView();
  loadAdminData();
}

function closeCandidateView() {
  id('candidateViewModal').style.display = 'none';
}

async function approve(cid) {
  await fetch('index.php?api=approve_candidate', { method: 'POST', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({id: cid}) });
  toast('success', 'Candidate approved and now live.');
  loadAdminData();
}

async function deleteCandidate(cid, name) {
  const confirmed = confirm(`Delete "${name}"? This permanently removes their entry, votes, and photo. This cannot be undone.`);
  if (!confirmed) return;
  try {
    const res = await fetch('index.php?api=delete_candidate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: cid })
    });
    const data = await res.json();
    toast(data.success ? 'success' : 'error', data.message || (data.success ? 'Candidate removed.' : 'Delete failed.'));
    if (data.success) loadAdminData();
  } catch (e) {
    toast('error', 'Network error, please try again.');
  }
}

async function changeAdminPassword() {
  const res = await fetch('index.php?api=admin_change_password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ new_password: id('newAdminPass').value })
  });
  const data = await res.json();
  toast(data.success ? 'success' : 'error', data.message);
  if (data.success) id('newAdminPass').value = '';
}

async function resetCandidatePass(code) {
  const newPass = prompt(`Enter new password for candidate ${code}:`);
  if (!newPass || newPass.length < 4) { toast('error', 'Password must be at least 4 characters.'); return; }
  const res = await fetch('index.php?api=admin_reset_candidate_password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, new_password: newPass })
  });
  const data = await res.json();
  toast(data.success ? 'success' : 'error', data.message);
}

// --- Payment History with Search ---
let paymentsVisible = false;
let paymentSearchTimer = null;

function togglePayments() {
  const container = id('paymentHistoryContainer');
  const btn = document.querySelector('.toggle-payments');
  if (paymentsVisible) {
    container.style.display = 'none';
    btn.textContent = 'View';
    paymentsVisible = false;
  } else {
    container.style.display = 'block';
    btn.textContent = 'Hide';
    paymentsVisible = true;
    loadPayments();
  }
}

async function loadPayments(searchTerm = '') {
  const tbody = id('paymentTableBody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--slate-400);">Loading payments...</td></tr>';
  try {
    const url = searchTerm
      ? `index.php?api=admin_get_payments&search=${encodeURIComponent(searchTerm)}`
      : 'index.php?api=admin_get_payments';
    const res = await fetch(url);
    const data = await res.json();
    if (!data.success) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--err);">Failed to load payments.</td></tr>';
      return;
    }
    if (data.payments.length === 0) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--slate-400);">No payments found.</td></tr>';
      return;
    }
    tbody.innerHTML = data.payments.map(p => {
      const statusClass = p.status.toLowerCase();
      const badgeClass = statusClass === 'successful' ? 'success' : statusClass === 'pending' ? 'pending' : 'failed';
      const date = new Date(p.created_at).toLocaleString();
      return `<tr>
        <td><code style="background:rgba(255,255,255,0.05); padding:2px 6px; border-radius:4px; font-size:0.8rem;">${escapeHtml(p.reference)}</code></td>
        <td>${escapeHtml(p.voter_name)}</td>
        <td>${escapeHtml(p.voter_email)}</td>
        <td>#${escapeHtml(p.contestant_id)}</td>
        <td>${escapeHtml(p.vote_quantity)}</td>
        <td>${parseFloat(p.amount_paid).toFixed(2)}</td>
        <td><span class="status-badge ${badgeClass}">${escapeHtml(p.status)}</span></td>
        <td>${escapeHtml(date)}</td>
      </tr>`;
    }).join('');
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:var(--err);">Error loading payments.</td></tr>';
  }
}

// Debounced search for payments
document.addEventListener('DOMContentLoaded', () => {
  const searchInput = id('paymentSearch');
  if (searchInput) {
    searchInput.addEventListener('input', function() {
      clearTimeout(paymentSearchTimer);
      const term = this.value.trim();
      paymentSearchTimer = setTimeout(() => {
        loadPayments(term);
      }, 350);
    });
  }
});

// --- Candidate Portal ---
async function handleCandidateLogin() {
  const code = id('candCode').value.trim();
  const pass = id('candPass').value;
  if (!code || !pass) { toast('error', 'Please enter your code and password.'); return; }
  const res = await fetch('index.php?api=candidate_login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, password: pass })
  });
  const data = await res.json();
  if (data.success) {
    switchView('candidateDashboardView');
    loadCandidateData();
    toast('success', 'Welcome back!');
  } else {
    toast('error', data.message || 'Login failed.');
  }
}

async function loadCandidateData() {
  const res = await fetch('index.php?api=candidate_get_data');
  const data = await res.json();
  if (!data.success) {
    toast('error', data.message || 'Could not fetch your data.');
    return;
  }
  const c = data.candidate;
  id('candName').textContent = `Hello, ${c.name}`;
  id('candCodeDisplay').textContent = c.nominee_code;
  id('candDept').textContent = c.dept;
  id('candCategory').textContent = c.category || '—';
  id('candVotes').textContent = c.votes;
  const totalCat = data.totalVotesInCategory;
  id('candTotalVotes').textContent = totalCat;
  const share = totalCat > 0 ? (c.votes / totalCat * 100) : 0;
  id('candShare').textContent = share.toFixed(1) + '%';
  id('candProgressBar').style.width = Math.min(share, 100) + '%';
}

async function handleCandidateLogout() {
  await fetch('index.php?api=candidate_logout');
  toast('info', 'Logged out.');
  switchView('candidateLoginView');
}

// Status toast cleanup
const urlParams = new URLSearchParams(window.location.search);
const status = urlParams.get('status');
if (status === 'success' || status === 'failed') {
  toast(status === 'success' ? 'success' : 'error',
        status === 'success' ? 'Vote successfully recorded. Thank you for voting!' : 'Payment failed or was cancelled.');
  urlParams.delete('status');
  const newUrl = window.location.pathname + (urlParams.toString() ? '?' + urlParams.toString() : '');
  history.replaceState({}, document.title, newUrl);
}

// Back‑to‑top button logic
const backToTop = document.getElementById('backToTopBtn');
window.addEventListener('scroll', function() {
  if (window.scrollY > 300) {
    backToTop.classList.add('show');
  } else {
    backToTop.classList.remove('show');
  }
});
backToTop.addEventListener('click', function() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

// Initial load
window.onload = fetchNominees;
