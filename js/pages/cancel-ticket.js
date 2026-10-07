/**
 * ============================================================================
 * CANCEL TICKET PAGE LOGIC (cancel-ticket.js)
 * ============================================================================
 */

let selectedBookingForCancel = null;

document.addEventListener('DOMContentLoaded', async () => {
  await loadBookingDropdown();

  const urlId = window.getUrlParam('booking_id') || window.getUrlParam('pnr');
  if (urlId) {
    const input = document.getElementById('cancel-pnr-input');
    if (input) input.value = urlId;
    fetchBookingForCancellation(urlId);
  }

  initCancelLookupForm();
  initConfirmCancelButton();
});

async function loadBookingDropdown() {
  const select = document.getElementById('cancel-booking-select');
  if (!select) return;

  try {
    const res = await window.RailwayAPI.getBookings();
    if (res.success && res.data) {
      const activeBookings = res.data.filter(b => b.status === 'CONFIRMED');
      select.innerHTML = `
        <option value="">-- Or Select Active Booking --</option>
        ${activeBookings.map(b => `
          <option value="${b.booking_id}">
            ${b.booking_id} - ${b.passenger_name} (${b.train_name})
          </option>
        `).join('')}
      `;

      select.addEventListener('change', (e) => {
        if (e.target.value) {
          document.getElementById('cancel-pnr-input').value = e.target.value;
          fetchBookingForCancellation(e.target.value);
        }
      });
    }
  } catch (err) {
    console.error('Error loading bookings for cancellation:', err);
  }
}

function initCancelLookupForm() {
  const form = document.getElementById('cancel-lookup-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const pnr = document.getElementById('cancel-pnr-input').value.trim();
    if (!pnr) {
      window.showToast('Please enter a Booking ID or PNR', 'warning');
      return;
    }
    fetchBookingForCancellation(pnr);
  });
}

async function fetchBookingForCancellation(pnr) {
  const card = document.getElementById('cancel-details-card');
  const loading = document.getElementById('cancel-loading');

  if (loading) loading.style.display = 'block';
  if (card) card.style.display = 'none';

  try {
    const res = await window.RailwayAPI.getBookingById(pnr);
    if (loading) loading.style.display = 'none';

    if (res.success && res.data) {
      selectedBookingForCancel = res.data;
      renderCancellationDetails(res.data);
      if (card) card.style.display = 'block';
    }
  } catch (err) {
    if (loading) loading.style.display = 'none';
    window.showToast(err.message, 'error');
  }
}

function renderCancellationDetails(b) {
  document.getElementById('cancel-pnr').textContent = b.booking_id;
  document.getElementById('cancel-passenger').textContent = b.passenger_name;
  document.getElementById('cancel-train').textContent = b.train_name;
  document.getElementById('cancel-route').textContent = `${b.source_city} → ${b.dest_city}`;
  document.getElementById('cancel-date').textContent = window.formatDate(b.journey_date);
  document.getElementById('cancel-seat').textContent = `${b.coach} - Seat ${b.seat_no} (${b.class})`;

  const statusBadge = document.getElementById('cancel-status');
  if (statusBadge) {
    statusBadge.textContent = b.status;
    statusBadge.className = `badge badge-${b.status.toLowerCase()}`;
  }

  // Calculate refund policy
  const originalFare = b.total_fare;
  const cancellationFee = Math.max(120, Math.round(originalFare * 0.2));
  const refundAmount = Math.max(0, originalFare - cancellationFee);

  document.getElementById('calc-original-fare').textContent = window.formatCurrency(originalFare);
  document.getElementById('calc-cancel-fee').textContent = `- ${window.formatCurrency(cancellationFee)}`;
  document.getElementById('calc-refund-amount').textContent = window.formatCurrency(refundAmount);
  document.getElementById('calc-payment-mode').textContent = b.payment_mode || 'Original Payment Source';

  const actionArea = document.getElementById('cancel-action-area');
  const alreadyCancelledNotice = document.getElementById('already-cancelled-notice');

  if (b.status === 'CANCELLED') {
    if (actionArea) actionArea.style.display = 'none';
    if (alreadyCancelledNotice) alreadyCancelledNotice.style.display = 'block';
  } else {
    if (actionArea) actionArea.style.display = 'block';
    if (alreadyCancelledNotice) alreadyCancelledNotice.style.display = 'none';
  }
}

function initConfirmCancelButton() {
  const cancelBtn = document.getElementById('btn-confirm-cancel');
  if (!cancelBtn) return;

  cancelBtn.addEventListener('click', async () => {
    if (!selectedBookingForCancel) return;

    const confirmed = confirm(
      `Are you sure you want to CANCEL Booking ${selectedBookingForCancel.booking_id}?\n\n` +
      `This action cannot be undone. Refund will be processed back to original source.`
    );

    if (!confirmed) return;

    cancelBtn.disabled = true;
    cancelBtn.innerHTML = '<span class="spinner"></span> Processing Cancellation...';

    try {
      const res = await window.RailwayAPI.cancelBooking(selectedBookingForCancel.booking_id);

      if (res.success) {
        window.showToast('Ticket cancelled successfully! Refund initiated.', 'success');
        
        // Show success modal or receipt
        const receiptCard = document.getElementById('cancel-receipt-card');
        const detailsCard = document.getElementById('cancel-details-card');

        if (detailsCard) detailsCard.style.display = 'none';
        if (receiptCard) {
          receiptCard.style.display = 'block';
          document.getElementById('receipt-pnr').textContent = selectedBookingForCancel.booking_id;
          document.getElementById('receipt-refund').textContent = document.getElementById('calc-refund-amount').textContent;
        }
      }
    } catch (err) {
      window.showToast(`Cancellation failed: ${err.message}`, 'error');
      cancelBtn.disabled = false;
      cancelBtn.innerHTML = 'Confirm Cancellation';
    }
  });
}
