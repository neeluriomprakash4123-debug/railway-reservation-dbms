/**
 * ============================================================================
 * BOOKING CONFIRMATION & E-TICKET PAGE (confirmation.js)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  const bookingId = window.getUrlParam('booking_id');

  if (!bookingId) {
    window.showToast('No booking specified. Redirecting to bookings list...', 'warning');
    setTimeout(() => window.location.href = 'my-bookings.html', 1500);
    return;
  }

  await loadConfirmedTicket(bookingId);
  initPrintButton();
});

async function loadConfirmedTicket(bookingId) {
  const loading = document.getElementById('ticket-loading');
  const wrapper = document.getElementById('ticket-container');

  try {
    const res = await window.RailwayAPI.getBookingById(bookingId);

    if (loading) loading.style.display = 'none';

    if (res.success && res.data) {
      const b = res.data;
      renderTicket(b);
      if (wrapper) wrapper.style.display = 'block';
    } else {
      throw new Error('Ticket records not found.');
    }
  } catch (err) {
    if (loading) loading.style.display = 'none';
    if (wrapper) {
      wrapper.innerHTML = `
        <div class="card empty-state">
          <div class="empty-state-icon">⚠️</div>
          <h3>Ticket Not Found</h3>
          <p>${err.message}</p>
          <a href="index.html" class="btn btn-primary" style="margin-top: 1rem;">Return to Home</a>
        </div>
      `;
      wrapper.style.display = 'block';
    }
    window.showToast(err.message, 'error');
  }
}

function renderTicket(b) {
  // Populate all ticket fields strictly respecting MySQL entity definitions
  document.getElementById('ticket-pnr').textContent = b.booking_id;
  document.getElementById('ticket-passenger-name').textContent = b.passenger_name || 'Passenger';
  document.getElementById('ticket-passenger-meta').textContent = `${b.passenger_gender || 'N/A'}, Age: ${b.passenger_age || 'N/A'} | Phone: ${b.passenger_phone || 'N/A'}`;
  document.getElementById('ticket-train-name').textContent = b.train_name;
  document.getElementById('ticket-train-id').textContent = `Train ID: ${b.train_id || 'N/A'} | ${b.train_type || 'Superfast'}`;

  document.getElementById('ticket-source-name').textContent = b.source_name;
  document.getElementById('ticket-source-city').textContent = b.source_city;
  document.getElementById('ticket-dest-name').textContent = b.dest_name;
  document.getElementById('ticket-dest-city').textContent = b.dest_city;

  document.getElementById('ticket-dep-time').textContent = window.formatTime(b.departure_time);
  document.getElementById('ticket-arr-time').textContent = window.formatTime(b.arrival_time);
  document.getElementById('ticket-journey-date').textContent = window.formatDate(b.journey_date);

  document.getElementById('ticket-coach').textContent = b.coach;
  document.getElementById('ticket-seat-no').textContent = b.seat_no;
  document.getElementById('ticket-class').textContent = b.class;
  document.getElementById('ticket-fare').textContent = window.formatCurrency(b.total_fare);

  const statusBadge = document.getElementById('ticket-status-badge');
  if (statusBadge) {
    statusBadge.textContent = b.status;
    statusBadge.className = `badge badge-${b.status.toLowerCase()}`;
  }

  const payBadge = document.getElementById('ticket-payment-status');
  if (payBadge) {
    payBadge.textContent = b.payment_status || 'SUCCESS';
    payBadge.className = `badge badge-${(b.payment_status || 'success').toLowerCase()}`;
  }

  // QR display text
  const qrBox = document.getElementById('ticket-qr-code');
  if (qrBox) {
    qrBox.innerHTML = `
      <div style="font-size: 0.65rem; line-height: 1.2;">
        <strong>PNR</strong><br/>${b.booking_id}<br/>
        <div style="margin-top: 4px; font-size: 1.1rem; letter-spacing: -2px;">|||||||||||</div>
        <strong>VERIFIED</strong>
      </div>
    `;
  }
}

function initPrintButton() {
  const printBtn = document.getElementById('print-ticket-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}
