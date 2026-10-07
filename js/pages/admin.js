/**
 * ============================================================================
 * ADMIN DASHBOARD LOGIC (admin.js)
 * Full CRUD for Passengers, Trains, Stations, Schedules, Bookings, Payments
 * ============================================================================
 */

let activeSection = 'dashboard';
let cachedData = {
  passengers: [],
  trains: [],
  stations: [],
  schedules: [],
  bookings: [],
  payments: []
};

document.addEventListener('DOMContentLoaded', async () => {
  initAdminNavigation();
  initSearchFilters();
  await loadDashboardStats();
  await refreshAllData();
});

// ============================================================================
// ADMIN NAVIGATION (SIDEBAR TABS)
// ============================================================================
function initAdminNavigation() {
  const navLinks = document.querySelectorAll('.admin-nav-item');
  const sections = document.querySelectorAll('.admin-section');
  const mobileToggle = document.querySelector('.admin-mobile-toggle');
  const sidebar = document.querySelector('.admin-sidebar');

  navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const target = link.dataset.section;
      if (!target) return;

      navLinks.forEach(l => l.classList.remove('active'));
      link.classList.add('active');

      sections.forEach(s => s.classList.remove('active'));
      const activeEl = document.getElementById(`section-${target}`);
      if (activeEl) activeEl.classList.add('active');

      activeSection = target;

      // Close sidebar on mobile
      if (sidebar && window.innerWidth <= 992) {
        sidebar.classList.remove('open');
      }

      // Refresh corresponding data
      handleSectionChange(target);
    });
  });

  if (mobileToggle && sidebar) {
    mobileToggle.addEventListener('click', () => {
      sidebar.classList.toggle('open');
    });
  }
}

function handleSectionChange(section) {
  if (section === 'dashboard') loadDashboardStats();
  else if (section === 'passengers') renderPassengersTable(cachedData.passengers);
  else if (section === 'trains') renderTrainsTable(cachedData.trains);
  else if (section === 'stations') renderStationsTable(cachedData.stations);
  else if (section === 'schedules') renderSchedulesTable(cachedData.schedules);
  else if (section === 'bookings') renderBookingsTable(cachedData.bookings);
  else if (section === 'payments') renderPaymentsTable(cachedData.payments);
}

// ============================================================================
// DATA FETCHING & DASHBOARD STATS
// ============================================================================
async function loadDashboardStats() {
  try {
    const res = await window.RailwayAPI.getAdminDashboard();
    if (res.success && res.data) {
      const d = res.data;
      document.getElementById('stat-passengers').textContent = d.total_passengers;
      document.getElementById('stat-trains').textContent = d.total_trains;
      document.getElementById('stat-stations').textContent = d.total_stations;
      document.getElementById('stat-bookings').textContent = d.total_bookings;
      document.getElementById('stat-confirmed').textContent = d.confirmed_bookings;
      document.getElementById('stat-waiting').textContent = d.waiting_bookings;
      document.getElementById('stat-cancelled').textContent = d.cancelled_bookings;
      document.getElementById('stat-revenue').textContent = window.formatCurrency(d.total_revenue);

      // Update badge counts in sidebar
      document.getElementById('badge-passengers').textContent = d.total_passengers;
      document.getElementById('badge-trains').textContent = d.total_trains;
      document.getElementById('badge-stations').textContent = d.total_stations;
      document.getElementById('badge-bookings').textContent = d.total_bookings;
    }
  } catch (err) {
    console.error('Error loading dashboard stats:', err);
    window.showToast('Error loading stats: ' + err.message, 'error');
  }
}

async function refreshAllData() {
  try {
    const [pRes, tRes, sRes, schRes, bRes, payRes] = await Promise.all([
      window.RailwayAPI.getPassengers(),
      window.RailwayAPI.getTrains(),
      window.RailwayAPI.getStations(),
      window.RailwayAPI.getSchedules(),
      window.RailwayAPI.getBookings(),
      window.RailwayAPI.getPayments()
    ]);

    cachedData.passengers = pRes.data || [];
    cachedData.trains = tRes.data || [];
    cachedData.stations = sRes.data || [];
    cachedData.schedules = schRes.data || [];
    cachedData.bookings = bRes.data || [];
    cachedData.payments = payRes.data || [];

    // Re-render currently active section
    handleSectionChange(activeSection);
  } catch (err) {
    console.error('Error refreshing admin data:', err);
  }
}

// ============================================================================
// TABLE RENDERING FUNCTIONS
// ============================================================================

// 1. PASSENGERS
function renderPassengersTable(list) {
  const body = document.getElementById('table-body-passengers');
  if (!body) return;

  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="7" style="text-align: center; padding: 2rem;">No passengers found.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(p => `
    <tr>
      <td><strong style="font-family: monospace;">${p.passenger_id}</strong></td>
      <td><strong>${p.name}</strong></td>
      <td>${p.age}</td>
      <td>${p.gender}</td>
      <td>${p.phone}</td>
      <td>${p.email}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" onclick="openPassengerModal('edit', '${p.passenger_id}')" title="Edit">✎</button>
          <button class="action-btn delete" onclick="deletePassenger('${p.passenger_id}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// 2. TRAINS
function renderTrainsTable(list) {
  const body = document.getElementById('table-body-trains');
  if (!body) return;

  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">No trains found.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(t => `
    <tr>
      <td><strong style="font-family: monospace;">${t.train_id}</strong></td>
      <td><strong>${t.train_name}</strong></td>
      <td><span class="train-type-pill">${t.train_type}</span></td>
      <td><strong>${t.total_seats}</strong> seats</td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" onclick="openTrainModal('edit', '${t.train_id}')" title="Edit">✎</button>
          <button class="action-btn delete" onclick="deleteTrain('${t.train_id}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// 3. STATIONS
function renderStationsTable(list) {
  const body = document.getElementById('table-body-stations');
  if (!body) return;

  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 2rem;">No stations found.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(s => `
    <tr>
      <td><strong style="font-family: monospace;">${s.station_id}</strong></td>
      <td><strong>${s.station_name}</strong></td>
      <td>${s.city}</td>
      <td>${s.state}</td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" onclick="openStationModal('edit', '${s.station_id}')" title="Edit">✎</button>
          <button class="action-btn delete" onclick="deleteStation('${s.station_id}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// 4. SCHEDULES
function renderSchedulesTable(list) {
  const body = document.getElementById('table-body-schedules');
  if (!body) return;

  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;">No schedules found.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(s => `
    <tr>
      <td><strong style="font-family: monospace;">${s.schedule_id}</strong></td>
      <td><strong>${s.train_name || s.train_id}</strong></td>
      <td>${s.source_name || s.source_station_id}</td>
      <td>${s.dest_name || s.dest_station_id}</td>
      <td>${window.formatDate(s.journey_date)}</td>
      <td>${window.formatTime(s.departure_time)} - ${window.formatTime(s.arrival_time)}</td>
      <td><strong style="color: #059669;">${window.formatCurrency(s.base_fare)}</strong></td>
      <td>
        <div class="table-actions">
          <button class="action-btn edit" onclick="openScheduleModal('edit', '${s.schedule_id}')" title="Edit">✎</button>
          <button class="action-btn delete" onclick="deleteSchedule('${s.schedule_id}')" title="Delete">🗑</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// 5. BOOKINGS
function renderBookingsTable(list) {
  const body = document.getElementById('table-body-bookings');
  if (!body) return;

  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="8" style="text-align: center; padding: 2rem;">No bookings found.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(b => `
    <tr>
      <td><strong style="font-family: monospace; color: #1e3a8a;">${b.booking_id}</strong></td>
      <td>${b.passenger_name} <small style="color: #64748b;">(${b.passenger_id})</small></td>
      <td>${b.train_name}</td>
      <td>${window.formatDate(b.journey_date)}</td>
      <td>${b.coach}-${b.seat_no} (${b.class})</td>
      <td><strong>${window.formatCurrency(b.total_fare)}</strong></td>
      <td><span class="badge badge-${b.status.toLowerCase()}">${b.status}</span></td>
      <td>
        <div class="table-actions">
          <a href="confirmation.html?booking_id=${b.booking_id}" class="action-btn" title="View Ticket">👁</a>
          ${b.status !== 'CANCELLED' ? `
            <button class="action-btn delete" onclick="cancelBookingFromAdmin('${b.booking_id}')" title="Cancel Booking">✕</button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');
}

// 6. PAYMENTS
function renderPaymentsTable(list) {
  const body = document.getElementById('table-body-payments');
  if (!body) return;

  if (list.length === 0) {
    body.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 2rem;">No payments found.</td></tr>`;
    return;
  }

  body.innerHTML = list.map(p => `
    <tr>
      <td><strong style="font-family: monospace;">${p.payment_id}</strong></td>
      <td><strong style="font-family: monospace; color: #1e3a8a;">${p.booking_id}</strong></td>
      <td><strong>${window.formatCurrency(p.amount)}</strong></td>
      <td><span class="train-type-pill">${p.mode}</span></td>
      <td><span class="badge badge-${p.status === 'SUCCESS' ? 'success' : (p.status === 'REFUNDED' ? 'cancelled' : 'pending')}">${p.status}</span></td>
      <td><span style="font-size: 0.8rem; color: #64748b;">Verified</span></td>
    </tr>
  `).join('');
}

// ============================================================================
// CRUD MODAL HANDLERS (PASSENGERS)
// ============================================================================
window.openPassengerModal = function(mode, id = null) {
  const modal = document.getElementById('modal-passenger');
  const title = document.getElementById('modal-passenger-title');
  const form = document.getElementById('form-passenger');

  form.reset();
  form.dataset.mode = mode;

  if (mode === 'edit' && id) {
    title.textContent = 'Edit Passenger Details';
    const p = cachedData.passengers.find(x => x.passenger_id === id);
    if (p) {
      document.getElementById('input-passenger-id').value = p.passenger_id;
      document.getElementById('input-passenger-id').readOnly = true;
      document.getElementById('input-passenger-name').value = p.name;
      document.getElementById('input-passenger-age').value = p.age;
      document.getElementById('input-passenger-gender').value = p.gender;
      document.getElementById('input-passenger-phone').value = p.phone;
      document.getElementById('input-passenger-email').value = p.email;
    }
  } else {
    title.textContent = 'Add New Passenger';
    document.getElementById('input-passenger-id').readOnly = false;
    document.getElementById('input-passenger-id').value = `PSG${100 + cachedData.passengers.length + 1}`;
  }

  window.openModal('modal-passenger');
};

document.getElementById('form-passenger')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const mode = form.dataset.mode;
  const passenger_id = document.getElementById('input-passenger-id').value.trim();

  const payload = {
    passenger_id,
    name: document.getElementById('input-passenger-name').value.trim(),
    age: parseInt(document.getElementById('input-passenger-age').value, 10),
    gender: document.getElementById('input-passenger-gender').value,
    phone: document.getElementById('input-passenger-phone').value.trim(),
    email: document.getElementById('input-passenger-email').value.trim()
  };

  try {
    if (mode === 'edit') {
      await window.RailwayAPI.updatePassenger(passenger_id, payload);
      window.showToast('Passenger updated successfully!', 'success');
    } else {
      await window.RailwayAPI.createPassenger(payload);
      window.showToast('Passenger created successfully!', 'success');
    }
    window.closeModal('modal-passenger');
    await refreshAllData();
    await loadDashboardStats();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
});

window.deletePassenger = async function(id) {
  if (!confirm(`Are you sure you want to delete passenger ${id}?`)) return;
  try {
    await window.RailwayAPI.deletePassenger(id);
    window.showToast('Passenger deleted', 'success');
    await refreshAllData();
    await loadDashboardStats();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};

// ============================================================================
// CRUD MODAL HANDLERS (TRAINS)
// ============================================================================
window.openTrainModal = function(mode, id = null) {
  const title = document.getElementById('modal-train-title');
  const form = document.getElementById('form-train');

  form.reset();
  form.dataset.mode = mode;

  if (mode === 'edit' && id) {
    title.textContent = 'Edit Train';
    const t = cachedData.trains.find(x => x.train_id === id);
    if (t) {
      document.getElementById('input-train-id').value = t.train_id;
      document.getElementById('input-train-id').readOnly = true;
      document.getElementById('input-train-name').value = t.train_name;
      document.getElementById('input-train-type').value = t.train_type;
      document.getElementById('input-train-seats').value = t.total_seats;
    }
  } else {
    title.textContent = 'Add New Train';
    document.getElementById('input-train-id').readOnly = false;
    document.getElementById('input-train-id').value = `TR${100 + cachedData.trains.length + 1}`;
  }

  window.openModal('modal-train');
};

document.getElementById('form-train')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const mode = form.dataset.mode;
  const train_id = document.getElementById('input-train-id').value.trim();

  const payload = {
    train_id,
    train_name: document.getElementById('input-train-name').value.trim(),
    train_type: document.getElementById('input-train-type').value,
    total_seats: parseInt(document.getElementById('input-train-seats').value, 10)
  };

  try {
    if (mode === 'edit') {
      await window.RailwayAPI.updateTrain(train_id, payload);
      window.showToast('Train updated successfully!', 'success');
    } else {
      await window.RailwayAPI.createTrain(payload);
      window.showToast('Train created successfully!', 'success');
    }
    window.closeModal('modal-train');
    await refreshAllData();
    await loadDashboardStats();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
});

window.deleteTrain = async function(id) {
  if (!confirm(`Are you sure you want to delete Train ${id}?`)) return;
  try {
    await window.RailwayAPI.deleteTrain(id);
    window.showToast('Train deleted', 'success');
    await refreshAllData();
    await loadDashboardStats();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};

// ============================================================================
// CRUD MODAL HANDLERS (STATIONS)
// ============================================================================
window.openStationModal = function(mode, id = null) {
  const title = document.getElementById('modal-station-title');
  const form = document.getElementById('form-station');

  form.reset();
  form.dataset.mode = mode;

  if (mode === 'edit' && id) {
    title.textContent = 'Edit Station';
    const s = cachedData.stations.find(x => x.station_id === id);
    if (s) {
      document.getElementById('input-station-id').value = s.station_id;
      document.getElementById('input-station-id').readOnly = true;
      document.getElementById('input-station-name').value = s.station_name;
      document.getElementById('input-station-city').value = s.city;
      document.getElementById('input-station-state').value = s.state;
    }
  } else {
    title.textContent = 'Add New Station';
    document.getElementById('input-station-id').readOnly = false;
    document.getElementById('input-station-id').value = `STN${String(cachedData.stations.length + 1).padStart(2, '0')}`;
  }

  window.openModal('modal-station');
};

document.getElementById('form-station')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const mode = form.dataset.mode;
  const station_id = document.getElementById('input-station-id').value.trim();

  const payload = {
    station_id,
    station_name: document.getElementById('input-station-name').value.trim(),
    city: document.getElementById('input-station-city').value.trim(),
    state: document.getElementById('input-station-state').value.trim()
  };

  try {
    if (mode === 'edit') {
      await window.RailwayAPI.updateStation(station_id, payload);
      window.showToast('Station updated successfully!', 'success');
    } else {
      await window.RailwayAPI.createStation(payload);
      window.showToast('Station created successfully!', 'success');
    }
    window.closeModal('modal-station');
    await refreshAllData();
    await loadDashboardStats();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
});

window.deleteStation = async function(id) {
  if (!confirm(`Are you sure you want to delete Station ${id}?`)) return;
  try {
    await window.RailwayAPI.deleteStation(id);
    window.showToast('Station deleted', 'success');
    await refreshAllData();
    await loadDashboardStats();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};

// ============================================================================
// CRUD MODAL HANDLERS (SCHEDULES)
// ============================================================================
window.openScheduleModal = function(mode, id = null) {
  const title = document.getElementById('modal-schedule-title');
  const form = document.getElementById('form-schedule');

  // Populate train and station dropdowns inside schedule modal
  const trainSelect = document.getElementById('input-sch-train');
  const srcSelect = document.getElementById('input-sch-src');
  const destSelect = document.getElementById('input-sch-dest');

  trainSelect.innerHTML = cachedData.trains.map(t => `<option value="${t.train_id}">${t.train_name}</option>`).join('');
  const stnOpts = cachedData.stations.map(s => `<option value="${s.station_id}">${s.station_name}</option>`).join('');
  srcSelect.innerHTML = stnOpts;
  destSelect.innerHTML = stnOpts;

  form.reset();
  form.dataset.mode = mode;

  if (mode === 'edit' && id) {
    title.textContent = 'Edit Train Schedule';
    const s = cachedData.schedules.find(x => x.schedule_id === id);
    if (s) {
      document.getElementById('input-sch-id').value = s.schedule_id;
      document.getElementById('input-sch-id').readOnly = true;
      trainSelect.value = s.train_id;
      srcSelect.value = s.source_station_id;
      destSelect.value = s.dest_station_id;
      document.getElementById('input-sch-date').value = s.journey_date;
      document.getElementById('input-sch-dep').value = s.departure_time;
      document.getElementById('input-sch-arr').value = s.arrival_time;
      document.getElementById('input-sch-fare').value = s.base_fare;
    }
  } else {
    title.textContent = 'Add New Train Schedule';
    document.getElementById('input-sch-id').readOnly = false;
    document.getElementById('input-sch-id').value = `SCH${100 + cachedData.schedules.length + 1}`;
  }

  window.openModal('modal-schedule');
};

document.getElementById('form-schedule')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const form = e.target;
  const mode = form.dataset.mode;
  const schedule_id = document.getElementById('input-sch-id').value.trim();

  const payload = {
    schedule_id,
    train_id: document.getElementById('input-sch-train').value,
    source_station_id: document.getElementById('input-sch-src').value,
    dest_station_id: document.getElementById('input-sch-dest').value,
    journey_date: document.getElementById('input-sch-date').value,
    departure_time: document.getElementById('input-sch-dep').value,
    arrival_time: document.getElementById('input-sch-arr').value,
    base_fare: parseFloat(document.getElementById('input-sch-fare').value)
  };

  try {
    if (mode === 'edit') {
      await window.RailwayAPI.updateSchedule(schedule_id, payload);
      window.showToast('Schedule updated successfully!', 'success');
    } else {
      await window.RailwayAPI.createSchedule(payload);
      window.showToast('Schedule created successfully!', 'success');
    }
    window.closeModal('modal-schedule');
    await refreshAllData();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
});

window.deleteSchedule = async function(id) {
  if (!confirm(`Are you sure you want to delete Schedule ${id}?`)) return;
  try {
    await window.RailwayAPI.deleteSchedule(id);
    window.showToast('Schedule deleted', 'success');
    await refreshAllData();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};

window.cancelBookingFromAdmin = async function(bookingId) {
  if (!confirm(`Confirm cancellation of Booking ${bookingId}?`)) return;
  try {
    await window.RailwayAPI.cancelBooking(bookingId);
    window.showToast(`Booking ${bookingId} has been cancelled`, 'success');
    await refreshAllData();
    await loadDashboardStats();
  } catch (err) {
    window.showToast(err.message, 'error');
  }
};

// ============================================================================
// SEARCH AND FILTER HELPERS
// ============================================================================
function initSearchFilters() {
  const searchMappings = [
    { inputId: 'search-passengers', listKey: 'passengers', renderFn: renderPassengersTable, filterKeys: ['name', 'phone', 'email', 'passenger_id'] },
    { inputId: 'search-trains', listKey: 'trains', renderFn: renderTrainsTable, filterKeys: ['train_name', 'train_id', 'train_type'] },
    { inputId: 'search-stations', listKey: 'stations', renderFn: renderStationsTable, filterKeys: ['station_name', 'city', 'state', 'station_id'] },
    { inputId: 'search-schedules', listKey: 'schedules', renderFn: renderSchedulesTable, filterKeys: ['train_name', 'source_name', 'dest_name', 'schedule_id'] },
    { inputId: 'search-bookings', listKey: 'bookings', renderFn: renderBookingsTable, filterKeys: ['booking_id', 'passenger_name', 'train_name'] },
    { inputId: 'search-payments', listKey: 'payments', renderFn: renderPaymentsTable, filterKeys: ['payment_id', 'booking_id', 'mode', 'status'] }
  ];

  searchMappings.forEach(m => {
    const input = document.getElementById(m.inputId);
    if (input) {
      input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase().trim();
        const filtered = cachedData[m.listKey].filter(item => {
          return m.filterKeys.some(key => {
            const val = String(item[key] || '').toLowerCase();
            return val.includes(query);
          });
        });
        m.renderFn(filtered);
      });
    }
  });
}
