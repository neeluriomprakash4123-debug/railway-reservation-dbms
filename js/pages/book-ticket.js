/**
 * ============================================================================
 * BOOK TICKET PAGE LOGIC (book-ticket.js)
 * ============================================================================
 */

let currentSchedule = null;
let currentPassenger = null;
let selectedCoach = 'B2';
let selectedSeat = '24';
let selectedClass = '3A';
let currentFare = 0;

document.addEventListener('DOMContentLoaded', async () => {
  await loadPassengerList();
  await loadScheduleDetails();
  initClassSelector();
  initCoachSeatSelector();
  initBookingSubmission();
});

async function loadPassengerList() {
  const select = document.getElementById('select_passenger_id');
  if (!select) return;

  try {
    const res = await window.RailwayAPI.getPassengers();
    if (res.success && res.data) {
      select.innerHTML = `
        <option value="">-- Choose Registered Passenger --</option>
        ${res.data.map(p => `
          <option value="${p.passenger_id}">${p.name} (${p.passenger_id}) - ${p.gender}, ${p.age}y</option>
        `).join('')}
      `;

      // Check URL param or local storage
      const prefillId = window.getUrlParam('passenger_id') || localStorage.getItem('railway_last_passenger_id');
      if (prefillId && res.data.some(p => p.passenger_id === prefillId)) {
        select.value = prefillId;
        onPassengerSelected(prefillId, res.data);
      }

      select.addEventListener('change', (e) => {
        onPassengerSelected(e.target.value, res.data);
      });
    }
  } catch (err) {
    console.error('Error loading passengers:', err);
  }
}

function onPassengerSelected(passengerId, list) {
  currentPassenger = list.find(p => p.passenger_id === passengerId);
  const detailsBox = document.getElementById('passenger-preview-box');

  if (currentPassenger && detailsBox) {
    detailsBox.innerHTML = `
      <div style="background: #f1f5f9; padding: 1rem; border-radius: 8px; border-left: 4px solid #2563eb;">
        <div style="font-weight: 700; color: #0f172a; font-size: 1.05rem;">${currentPassenger.name}</div>
        <div style="font-size: 0.85rem; color: #475569; margin-top: 0.25rem;">
          Age: <strong>${currentPassenger.age}</strong> | Gender: <strong>${currentPassenger.gender}</strong>
        </div>
        <div style="font-size: 0.85rem; color: #475569;">
          Phone: <strong>${currentPassenger.phone}</strong> | Email: <strong>${currentPassenger.email}</strong>
        </div>
      </div>
    `;
  }
}

async function loadScheduleDetails() {
  const scheduleId = window.getUrlParam('schedule_id');
  const classParam = window.getUrlParam('class');
  if (classParam) selectedClass = classParam;

  try {
    let sch = null;
    if (scheduleId) {
      const res = await window.RailwayAPI.getScheduleById(scheduleId);
      sch = res.data;
    } else {
      // Pick first available schedule
      const res = await window.RailwayAPI.getSchedules();
      if (res.data && res.data.length > 0) {
        sch = res.data[0];
      }
    }

    if (!sch) {
      window.showToast('No active train schedule selected. Please choose a train first.', 'warning');
      setTimeout(() => window.location.href = 'trains.html', 1500);
      return;
    }

    currentSchedule = sch;
    renderTrainSummary(sch);
    updateFareSummary();
  } catch (err) {
    console.error('Error loading schedule:', err);
    window.showToast('Failed to load train details: ' + err.message, 'error');
  }
}

function renderTrainSummary(sch) {
  const container = document.getElementById('train-summary-card');
  if (!container) return;

  container.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem;">
      <div>
        <h3 style="font-size: 1.25rem; font-weight: 700; color: #0f172a;">${sch.train_name}</h3>
        <span style="font-size: 0.85rem; color: #64748b;">Schedule ID: ${sch.schedule_id} | Train ID: ${sch.train_id}</span>
      </div>
      <span class="train-type-pill">${sch.train_type}</span>
    </div>

    <div class="train-schedule-grid" style="margin-top: 1rem;">
      <div class="schedule-station">
        <div class="station-time">${window.formatTime(sch.departure_time)}</div>
        <div class="station-name">${sch.source_name}</div>
        <div class="station-city">${sch.source_city}</div>
      </div>

      <div class="schedule-duration">
        <span>${window.calculateDuration(sch.departure_time, sch.arrival_time)}</span>
        <div class="duration-line"></div>
        <span>Date: <strong>${window.formatDate(sch.journey_date)}</strong></span>
      </div>

      <div class="schedule-station dest">
        <div class="station-time">${window.formatTime(sch.arrival_time)}</div>
        <div class="station-name">${sch.dest_name}</div>
        <div class="station-city">${sch.dest_city}</div>
      </div>
    </div>
  `;
}

function initClassSelector() {
  const classSelect = document.getElementById('ticket_class');
  if (!classSelect) return;

  classSelect.value = selectedClass;
  classSelect.addEventListener('change', (e) => {
    selectedClass = e.target.value;
    updateCoachOptions();
    updateFareSummary();
  });
}

function updateCoachOptions() {
  const coachSelect = document.getElementById('ticket_coach');
  if (!coachSelect) return;

  const coachMap = {
    '1A': ['H1', 'HA1'],
    '2A': ['A1', 'A2', 'A3'],
    '3A': ['B1', 'B2', 'B3', 'B4', 'B5'],
    'SL': ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'],
    'CC': ['C1', 'C2', 'C3']
  };

  const coaches = coachMap[selectedClass] || ['B1', 'B2'];
  coachSelect.innerHTML = coaches.map(c => `<option value="${c}">${c}</option>`).join('');
  selectedCoach = coaches[0];
  coachSelect.value = selectedCoach;
  renderSeatGrid();
}

function initCoachSeatSelector() {
  const coachSelect = document.getElementById('ticket_coach');
  if (coachSelect) {
    coachSelect.addEventListener('change', (e) => {
      selectedCoach = e.target.value;
      renderSeatGrid();
    });
  }

  updateCoachOptions();
  renderSeatGrid();
}

function renderSeatGrid() {
  const grid = document.getElementById('seat-grid');
  if (!grid) return;

  let html = '';
  // Generate 24 seats in coach
  for (let i = 1; i <= 24; i++) {
    const isBooked = [3, 7, 14, 19, 21].includes(i);
    const isSelected = String(i) === String(selectedSeat);
    html += `
      <div class="seat-pill ${isBooked ? 'booked' : ''} ${isSelected ? 'selected' : ''}" 
           onclick="selectSeatNumber('${i}', ${isBooked})">
        ${i}
      </div>
    `;
  }
  grid.innerHTML = html;

  const seatInput = document.getElementById('ticket_seat_no');
  if (seatInput) seatInput.value = selectedSeat;
}

window.selectSeatNumber = function(seatNum, isBooked) {
  if (isBooked) {
    window.showToast(`Seat ${seatNum} is already reserved. Please choose another seat.`, 'warning');
    return;
  }
  selectedSeat = seatNum;
  renderSeatGrid();
};

function updateFareSummary() {
  if (!currentSchedule) return;

  const multipliers = {
    '1A': 2.1,
    '2A': 1.45,
    '3A': 1.0,
    'SL': 0.45,
    'CC': 0.8
  };

  const baseFare = currentSchedule.base_fare || 1000;
  const mult = multipliers[selectedClass] || 1.0;
  const ticketFare = Math.round(baseFare * mult);
  const reservationFee = 40;
  const gst = Math.round(ticketFare * 0.05);
  const totalFare = ticketFare + reservationFee + gst;

  currentFare = totalFare;

  document.getElementById('fare-base').textContent = window.formatCurrency(ticketFare);
  document.getElementById('fare-res-fee').textContent = window.formatCurrency(reservationFee);
  document.getElementById('fare-gst').textContent = window.formatCurrency(gst);
  document.getElementById('fare-total').textContent = window.formatCurrency(totalFare);
}

function initBookingSubmission() {
  const form = document.getElementById('book-ticket-form');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const passengerId = document.getElementById('select_passenger_id').value;
    if (!passengerId) {
      window.showToast('Please select a registered passenger or register a new one first.', 'warning');
      return;
    }

    if (!currentSchedule) {
      window.showToast('Missing train schedule information.', 'error');
      return;
    }

    const submitBtn = document.getElementById('confirm-booking-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner"></span> Creating Booking...';
    }

    try {
      const payload = {
        passenger_id: passengerId,
        schedule_id: currentSchedule.schedule_id,
        total_fare: currentFare,
        class: selectedClass,
        coach: selectedCoach,
        seat_no: selectedSeat
      };

      const res = await window.RailwayAPI.createBooking(payload);

      if (res.success && res.booking_id) {
        window.showToast(`Booking initiated! PNR: ${res.booking_id}`, 'success');
        
        // Redirect to payment page with booking_id and amount
        const payParams = new URLSearchParams({
          booking_id: res.booking_id,
          amount: currentFare
        });
        setTimeout(() => {
          window.location.href = `payment.html?${payParams.toString()}`;
        }, 600);
      }
    } catch (err) {
      window.showToast(`Booking failed: ${err.message}`, 'error');
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Confirm Booking ➔';
      }
    }
  });
}
