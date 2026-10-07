/**
 * ============================================================================
 * MY BOOKINGS PAGE LOGIC (my-bookings.js)
 * ============================================================================
 */

let allBookingsList = [];
let activeFilter = 'ALL';

document.addEventListener('DOMContentLoaded', async () => {
  initFilterTabs();
  await loadBookings();
});

function initFilterTabs() {
  const tabs = document.querySelectorAll('.booking-filter-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('btn-primary'));
      tabs.forEach(t => t.classList.add('btn-secondary'));

      tab.classList.remove('btn-secondary');
      tab.classList.add('btn-primary');

      activeFilter = tab.dataset.filter || 'ALL';
      renderBookings();
    });
  });
}

async function loadBookings() {
  const tableBody = document.getElementById('bookings-table-body');
  const loading = document.getElementById('bookings-loading');

  if (loading) loading.style.display = 'block';

  try {
    const res = await window.RailwayAPI.getBookings();
    if (loading) loading.style.display = 'none';

    if (res.success && res.data) {
      allBookingsList = res.data;
      renderBookings();
    }
  } catch (err) {
    if (loading) loading.style.display = 'none';
    if (tableBody) {
      tableBody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: #ef4444; padding: 2rem;">Error: ${err.message}</td></tr>`;
    }
    window.showToast('Failed to load bookings: ' + err.message, 'error');
  }
}

function renderBookings() {
  const tableBody = document.getElementById('bookings-table-body');
  const countBadge = document.getElementById('booking-count-badge');
  if (!tableBody) return;

  let filtered = allBookingsList;
  if (activeFilter !== 'ALL') {
    filtered = allBookingsList.filter(b => b.status === activeFilter);
  }

  if (countBadge) {
    countBadge.textContent = `${filtered.length} Bookings`;
  }

  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem; color: #64748b;">
          <div style="font-size: 2.5rem; margin-bottom: 0.5rem;">🎫</div>
          <strong style="font-size: 1.1rem; color: #0f172a;">No bookings found</strong>
          <p style="margin-top: 0.25rem;">No reservation records match the selected filter.</p>
          <a href="trains.html" class="btn btn-primary btn-sm" style="margin-top: 1rem;">Book a Journey Now</a>
        </td>
      </tr>
    `;
    return;
  }

  tableBody.innerHTML = filtered.map(b => `
    <tr>
      <td>
        <strong style="font-family: monospace; font-size: 0.95rem; color: #1e3a8a;">${b.booking_id}</strong>
        <div style="font-size: 0.75rem; color: #64748b;">${b.booking_date}</div>
      </td>
      <td>
        <div style="font-weight: 600; color: #0f172a;">${b.passenger_name}</div>
        <div style="font-size: 0.75rem; color: #64748b;">${b.passenger_gender}, ${b.passenger_age}y</div>
      </td>
      <td>
        <div style="font-weight: 600;">${b.train_name}</div>
        <div style="font-size: 0.78rem; color: #64748b;">${b.source_city} → ${b.dest_city}</div>
      </td>
      <td>
        <div>${window.formatDate(b.journey_date)}</div>
        <div style="font-size: 0.75rem; color: #64748b;">${window.formatTime(b.departure_time)}</div>
      </td>
      <td>
        <strong>${b.coach} - ${b.seat_no}</strong>
        <div style="font-size: 0.75rem; color: #64748b;">Class: ${b.class}</div>
      </td>
      <td>
        <strong style="color: #0f172a;">${window.formatCurrency(b.total_fare)}</strong>
        <div style="font-size: 0.72rem; color: #059669;">${b.payment_mode || 'UPI'} Paid</div>
      </td>
      <td>
        <span class="badge badge-${b.status.toLowerCase()}">${b.status}</span>
      </td>
      <td>
        <div style="display: flex; gap: 0.4rem; align-items: center;">
          <a href="confirmation.html?booking_id=${b.booking_id}" class="btn btn-outline btn-sm" title="View E-Ticket">
            Ticket
          </a>
          ${b.status !== 'CANCELLED' ? `
            <a href="cancel-ticket.html?booking_id=${b.booking_id}" class="btn btn-danger btn-sm" title="Cancel Booking">
              Cancel
            </a>
          ` : `
            <span style="font-size: 0.75rem; color: #94a3b8; font-style: italic;">Refunded</span>
          `}
        </div>
      </td>
    </tr>
  `).join('');
}
