/**
 * ============================================================================
 * PNR STATUS PAGE LOGIC (pnr-status.js)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', () => {
  const urlPnr = window.getUrlParam('pnr') || window.getUrlParam('booking_id');
  const input = document.getElementById('pnr-input');

  if (urlPnr && input) {
    input.value = urlPnr;
    searchPnr(urlPnr);
  }

  initPnrForm();
});

function initPnrForm() {
  const form = document.getElementById('pnr-search-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pnr = document.getElementById('pnr-input').value.trim();
    if (!pnr) {
      window.showToast('Please enter a PNR or Booking ID', 'warning');
      return;
    }
    searchPnr(pnr);
  });
}

async function searchPnr(pnr) {
  const resultCard = document.getElementById('pnr-result-card');
  const searchBtn = document.getElementById('pnr-search-btn');
  const loading = document.getElementById('pnr-loading');

  if (searchBtn) {
    searchBtn.disabled = true;
    searchBtn.innerHTML = '<span class="spinner"></span> Checking...';
  }

  if (loading) loading.style.display = 'block';
  if (resultCard) resultCard.style.display = 'none';

  try {
    const res = await window.RailwayAPI.getBookingById(pnr);

    if (loading) loading.style.display = 'none';
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.innerHTML = 'Check Status';
    }

    if (res.success && res.data) {
      renderPnrDetails(res.data);
      if (resultCard) resultCard.style.display = 'block';
      window.showToast('PNR details retrieved successfully!', 'success');
    }
  } catch (err) {
    if (loading) loading.style.display = 'none';
    if (searchBtn) {
      searchBtn.disabled = false;
      searchBtn.innerHTML = 'Check Status';
    }
    window.showToast(err.message, 'error');
  }
}

function renderPnrDetails(b) {
  document.getElementById('res-pnr').textContent = b.booking_id;
  document.getElementById('res-passenger').textContent = b.passenger_name;
  document.getElementById('res-passenger-meta').textContent = `${b.passenger_gender}, Age: ${b.passenger_age} | Phone: ${b.passenger_phone}`;

  document.getElementById('res-train').textContent = b.train_name;
  document.getElementById('res-route').textContent = `${b.source_name} (${b.source_city}) → ${b.dest_name} (${b.dest_city})`;
  document.getElementById('res-date').textContent = window.formatDate(b.journey_date);
  document.getElementById('res-dep').textContent = window.formatTime(b.departure_time);
  document.getElementById('res-arr').textContent = window.formatTime(b.arrival_time);

  document.getElementById('res-coach').textContent = b.coach;
  document.getElementById('res-seat').textContent = b.seat_no;
  document.getElementById('res-class').textContent = b.class;
  document.getElementById('res-fare').textContent = window.formatCurrency(b.total_fare);

  const statusBadge = document.getElementById('res-status');
  if (statusBadge) {
    statusBadge.textContent = b.status;
    statusBadge.className = `badge badge-${b.status.toLowerCase()}`;
  }

  // Update Status Timeline Steps
  const step1 = document.getElementById('timeline-step-1');
  const step2 = document.getElementById('timeline-step-2');
  const step3 = document.getElementById('timeline-step-3');

  if (b.status === 'CONFIRMED') {
    step1.className = 'pnr-step completed';
    step2.className = 'pnr-step completed';
    step3.className = 'pnr-step active';
  } else if (b.status === 'WAITING') {
    step1.className = 'pnr-step completed';
    step2.className = 'pnr-step active';
    step3.className = 'pnr-step';
  } else if (b.status === 'CANCELLED') {
    step1.className = 'pnr-step completed';
    step2.className = 'pnr-step';
    step3.className = 'pnr-step';
    step2.querySelector('.pnr-step-label').textContent = 'Cancelled';
  }

  // Links to view full ticket or cancel
  const viewTicketBtn = document.getElementById('res-view-ticket-btn');
  if (viewTicketBtn) {
    viewTicketBtn.href = `confirmation.html?booking_id=${b.booking_id}`;
  }

  const cancelBtn = document.getElementById('res-cancel-btn');
  if (cancelBtn) {
    if (b.status === 'CANCELLED') {
      cancelBtn.style.display = 'none';
    } else {
      cancelBtn.style.display = 'inline-flex';
      cancelBtn.href = `cancel-ticket.html?booking_id=${b.booking_id}`;
    }
  }
}
