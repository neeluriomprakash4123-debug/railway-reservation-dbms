/**
 * ============================================================================
 * PAYMENT PAGE LOGIC (payment.js)
 * ============================================================================
 */

let currentBookingId = '';
let currentAmount = 0;
let selectedPaymentMode = 'UPI';

document.addEventListener('DOMContentLoaded', async () => {
  currentBookingId = window.getUrlParam('booking_id');
  currentAmount = parseFloat(window.getUrlParam('amount')) || 0;

  if (!currentBookingId) {
    window.showToast('No booking ID specified. Redirecting to home...', 'warning');
    setTimeout(() => window.location.href = 'index.html', 1500);
    return;
  }

  await loadBookingSummary();
  initPaymentModeSelection();
  initPaymentSubmission();
});

async function loadBookingSummary() {
  const pnrDisplay = document.getElementById('display-pnr');
  const amountDisplay = document.getElementById('display-amount');
  const trainDisplay = document.getElementById('display-train');
  const passengerDisplay = document.getElementById('display-passenger');

  if (pnrDisplay) pnrDisplay.textContent = currentBookingId;

  try {
    const res = await window.RailwayAPI.getBookingById(currentBookingId);
    if (res.success && res.data) {
      const b = res.data;
      currentAmount = b.total_fare;
      if (amountDisplay) amountDisplay.textContent = window.formatCurrency(b.total_fare);
      if (trainDisplay) trainDisplay.textContent = `${b.train_name} (${b.source_city} → ${b.dest_city})`;
      if (passengerDisplay) passengerDisplay.textContent = `${b.passenger_name} (${b.coach} - Seat ${b.seat_no})`;
    }
  } catch (err) {
    console.warn('Booking lookup fallback:', err);
    if (amountDisplay) amountDisplay.textContent = window.formatCurrency(currentAmount || 1850);
  }
}

function initPaymentModeSelection() {
  const modeCards = document.querySelectorAll('.payment-mode-tab');
  const methodForms = document.querySelectorAll('.payment-subform');

  modeCards.forEach(card => {
    card.addEventListener('click', () => {
      modeCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedPaymentMode = card.dataset.mode || 'UPI';

      methodForms.forEach(form => {
        form.style.display = form.id === `form-${selectedPaymentMode}` ? 'block' : 'none';
      });
    });
  });
}

function initPaymentSubmission() {
  const form = document.getElementById('payment-form');
  const payBtn = document.getElementById('make-payment-btn');
  const statusAlert = document.getElementById('payment-status-message');

  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (payBtn) {
      payBtn.disabled = true;
      payBtn.innerHTML = '<span class="spinner"></span> Processing Secure Payment...';
    }

    if (statusAlert) {
      statusAlert.style.display = 'none';
    }

    try {
      // Simulate realistic bank gateway verification delay
      await new Promise(r => setTimeout(r, 800));

      const payload = {
        booking_id: currentBookingId,
        amount: currentAmount,
        mode: selectedPaymentMode,
        status: 'SUCCESS'
      };

      const res = await window.RailwayAPI.createPayment(payload);

      if (res.success) {
        if (statusAlert) {
          statusAlert.className = 'card';
          statusAlert.style.display = 'block';
          statusAlert.style.borderColor = '#10b981';
          statusAlert.style.backgroundColor = '#ecfdf5';
          statusAlert.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.75rem; color: #065f46;">
              <span style="font-size: 1.5rem;">✓</span>
              <div>
                <strong style="font-size: 1.05rem;">Payment Successful!</strong>
                <p style="font-size: 0.85rem; margin-top: 0.2rem;">Transaction ID: ${res.data.payment_id}. Generating your Official E-Ticket...</p>
              </div>
            </div>
          `;
        }

        window.showToast('Payment successful! Redirecting to ticket confirmation...', 'success');

        setTimeout(() => {
          window.location.href = `confirmation.html?booking_id=${currentBookingId}`;
        }, 1200);
      }
    } catch (err) {
      if (payBtn) {
        payBtn.disabled = false;
        payBtn.innerHTML = `Pay ${window.formatCurrency(currentAmount)}`;
      }

      if (statusAlert) {
        statusAlert.className = 'card';
        statusAlert.style.display = 'block';
        statusAlert.style.borderColor = '#ef4444';
        statusAlert.style.backgroundColor = '#fef2f2';
        statusAlert.innerHTML = `
          <div style="display: flex; align-items: center; gap: 0.75rem; color: #991b1b;">
            <span style="font-size: 1.5rem;">✕</span>
            <div>
              <strong style="font-size: 1.05rem;">Payment Failed</strong>
              <p style="font-size: 0.85rem; margin-top: 0.2rem;">${err.message || 'Payment was declined by payment gateway. Please retry.'}</p>
            </div>
          </div>
        `;
      }
      window.showToast('Payment processing error: ' + err.message, 'error');
    }
  });
}
