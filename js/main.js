/**
 * ============================================================================
 * RAILWAY TICKET RESERVATION & JOURNEY MANAGEMENT SYSTEM
 * Global Shared Utilities & UI Handlers (main.js)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initApiModeIndicator();
  initToastContainer();
});

// ============================================================================
// TOAST NOTIFICATIONS
// ============================================================================
function initToastContainer() {
  if (!document.getElementById('toast-container')) {
    const container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }
}

function showToast(message, type = 'info', duration = 3500) {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  toast.innerHTML = `
    <span style="font-weight: bold; font-size: 1.1rem;">${iconMap[type] || 'ℹ'}</span>
    <div style="flex: 1;">${message}</div>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ============================================================================
// FORMATTERS
// ============================================================================
function formatCurrency(amount) {
  const num = parseFloat(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

function formatTime(timeStr) {
  if (!timeStr) return '--:--';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${String(formattedHours).padStart(2, '0')}:${minutes} ${ampm}`;
  }
  return timeStr;
}

// Calculate journey duration string
function calculateDuration(depTime, arrTime) {
  if (!depTime || !arrTime) return 'Approx 6h';
  const [dh, dm] = depTime.split(':').map(Number);
  const [ah, am] = arrTime.split(':').map(Number);

  let depMinutes = dh * 60 + dm;
  let arrMinutes = ah * 60 + am;

  if (arrMinutes < depMinutes) {
    arrMinutes += 24 * 60; // Next day
  }

  const diffMin = arrMinutes - depMinutes;
  const hours = Math.floor(diffMin / 60);
  const mins = diffMin % 60;
  return `${hours}h ${mins}m`;
}

// ============================================================================
// URL PARAMETER HELPER
// ============================================================================
function getUrlParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

// ============================================================================
// NAVBAR & MOBILE MENU
// ============================================================================
function initNavbar() {
  const toggleBtn = document.querySelector('.mobile-menu-toggle');
  const navLinks = document.querySelector('.nav-links');

  if (toggleBtn && navLinks) {
    toggleBtn.addEventListener('click', () => {
      navLinks.classList.toggle('open');
    });
  }

  // Highlight active link matching current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-item a').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });
}

// ============================================================================
// API MODE TOGGLE & STATUS BADGE
// ============================================================================
function initApiModeIndicator() {
  const pill = document.querySelector('.mode-pill');
  if (!pill) return;

  const updatePillText = () => {
    const isMock = window.RailwayAPI.getConfig().USE_MOCK;
    pill.innerHTML = `
      <span class="mode-dot" style="background: ${isMock ? '#10b981' : '#38bdf8'}"></span>
      Backend Mode: ${isMock ? 'Mock API (Demo Active)' : 'Live Flask (127.0.0.1:5000)'}
      <span style="font-size: 0.72rem; opacity: 0.8; text-decoration: underline; margin-left: 0.25rem;">[Toggle]</span>
    `;
  };

  updatePillText();

  pill.addEventListener('click', () => {
    const current = window.RailwayAPI.getConfig().USE_MOCK;
    const next = !current;
    window.RailwayAPI.toggleMock(next);
    updatePillText();
    showToast(
      next
        ? 'Switched to Mock API Store (localStorage)'
        : 'Switched to Live Flask REST API (http://127.0.0.1:5000)',
      'info'
    );
    // Reload if current page depends on fresh API
    setTimeout(() => window.location.reload(), 600);
  });
}

// ============================================================================
// MODAL DIALOG CONTROLLER
// ============================================================================
function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

// Global click handler to close modals via close-btn or backdrop
document.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal-overlay')) {
    e.target.classList.remove('active');
    document.body.style.overflow = '';
  }
  if (e.target.classList.contains('modal-close-btn') || e.target.closest('.modal-close-btn')) {
    const modal = e.target.closest('.modal-overlay');
    if (modal) {
      modal.classList.remove('active');
      document.body.style.overflow = '';
    }
  }
});

// ============================================================================
// STATIONS DATALIST POPULATOR
// ============================================================================
async function populateStationDatalist(datalistId) {
  try {
    const res = await window.RailwayAPI.getStations();
    const list = document.getElementById(datalistId);
    if (!list) return;

    list.innerHTML = res.data.map(stn => `
      <option value="${stn.station_name}" data-id="${stn.station_id}">
        ${stn.city}, ${stn.state} (${stn.station_id})
      </option>
    `).join('');
  } catch (err) {
    console.warn('Failed to populate stations datalist:', err);
  }
}

// Export globals to window
window.showToast = showToast;
window.formatCurrency = formatCurrency;
window.formatDate = formatDate;
window.formatTime = formatTime;
window.calculateDuration = calculateDuration;
window.getUrlParam = getUrlParam;
window.openModal = openModal;
window.closeModal = closeModal;
window.populateStationDatalist = populateStationDatalist;
