/**
 * ============================================================================
 * TRAIN SEARCH PAGE LOGIC (train-search.js)
 * ============================================================================
 */

let allSchedules = [];
let selectedClasses = {}; // Map of schedule_id -> selected class code

document.addEventListener('DOMContentLoaded', async () => {
  await loadStationFilters();
  initFormFromUrl();
  initSearchHandler();
  await performSearch();
});

async function loadStationFilters() {
  const fromSelect = document.getElementById('search_source_station');
  const toSelect = document.getElementById('search_dest_station');
  if (!fromSelect || !toSelect) return;

  try {
    const res = await window.RailwayAPI.getStations();
    if (res.success && res.data) {
      const options = `
        <option value="">All Stations</option>
        ${res.data.map(s => `<option value="${s.station_id}">${s.station_name} (${s.city})</option>`).join('')}
      `;
      fromSelect.innerHTML = options;
      toSelect.innerHTML = options;
    }
  } catch (err) {
    console.error('Error loading station filters:', err);
  }
}

function initFormFromUrl() {
  const src = window.getUrlParam('source_station_id');
  const dest = window.getUrlParam('dest_station_id');
  const date = window.getUrlParam('journey_date');

  if (src) document.getElementById('search_source_station').value = src;
  if (dest) document.getElementById('search_dest_station').value = dest;
  if (date) {
    document.getElementById('search_journey_date').value = date;
  } else {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('search_journey_date').value = tomorrow.toISOString().split('T')[0];
  }
}

function initSearchHandler() {
  const form = document.getElementById('train-search-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      performSearch();
    });
  }

  // Train type filter dropdown change
  const typeFilter = document.getElementById('filter_train_type');
  if (typeFilter) {
    typeFilter.addEventListener('change', () => {
      renderResults(filterSchedules());
    });
  }
}

async function performSearch() {
  const resultsContainer = document.getElementById('trains-container');
  const loadingIndicator = document.getElementById('search-loading');
  const countBadge = document.getElementById('results-count');

  if (!resultsContainer) return;

  resultsContainer.innerHTML = '';
  if (loadingIndicator) loadingIndicator.style.display = 'block';

  const src = document.getElementById('search_source_station').value;
  const dest = document.getElementById('search_dest_station').value;
  const date = document.getElementById('search_journey_date').value;

  try {
    const params = {};
    if (src) params.source_station_id = src;
    if (dest) params.dest_station_id = dest;
    if (date) params.journey_date = date;

    const res = await window.RailwayAPI.getSchedules(params);
    if (loadingIndicator) loadingIndicator.style.display = 'none';

    allSchedules = res.data || [];

    // Fallback if no exact date match: show all matching route or all available schedules
    if (allSchedules.length === 0 && (src || dest)) {
      const fallbackRes = await window.RailwayAPI.getSchedules();
      allSchedules = (fallbackRes.data || []).filter(s => {
        let match = true;
        if (src && s.source_station_id !== src) match = false;
        if (dest && s.dest_station_id !== dest) match = false;
        return match;
      });
      if (allSchedules.length > 0) {
        window.showToast('Showing all available dates for this route.', 'info');
      }
    }

    if (allSchedules.length === 0) {
      // If still nothing, offer all trains with friendly message
      const fallbackRes = await window.RailwayAPI.getSchedules();
      allSchedules = fallbackRes.data || [];
      window.showToast('No exact schedule match found. Displaying all active train schedules.', 'info');
    }

    if (countBadge) {
      countBadge.textContent = `${allSchedules.length} Trains Found`;
    }

    renderResults(filterSchedules());
  } catch (err) {
    if (loadingIndicator) loadingIndicator.style.display = 'none';
    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <h3>Failed to load trains</h3>
        <p>${err.message}</p>
        <button class="btn btn-secondary btn-sm" onclick="performSearch()" style="margin-top: 1rem;">Retry</button>
      </div>
    `;
    window.showToast(err.message, 'error');
  }
}

function filterSchedules() {
  const typeVal = document.getElementById('filter_train_type')?.value || '';
  if (!typeVal) return allSchedules;
  return allSchedules.filter(s => s.train_type === typeVal);
}

function renderResults(schedules) {
  const container = document.getElementById('trains-container');
  if (!container) return;

  if (schedules.length === 0) {
    container.innerHTML = `
      <div class="card empty-state">
        <div class="empty-state-icon">🚆</div>
        <h3>No Trains Found</h3>
        <p>No matching trains found for the selected criteria. Try changing stations or date.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = schedules.map(sch => {
    // Generate class options with realistic seat availability calculation
    const classes = [
      { code: '3A', label: 'AC 3 Tier', multiplier: 1.0, seats: Math.floor(sch.total_seats * 0.4) },
      { code: '2A', label: 'AC 2 Tier', multiplier: 1.45, seats: Math.floor(sch.total_seats * 0.25) },
      { code: '1A', label: 'AC 1st Class', multiplier: 2.1, seats: Math.max(12, Math.floor(sch.total_seats * 0.08)) },
      { code: 'SL', label: 'Sleeper', multiplier: 0.45, seats: Math.floor(sch.total_seats * 0.6) }
    ];

    const currentClass = selectedClasses[sch.schedule_id] || '3A';
    const activeClassObj = classes.find(c => c.code === currentClass) || classes[0];
    const calculatedFare = Math.round(sch.base_fare * activeClassObj.multiplier);
    const durationStr = window.calculateDuration(sch.departure_time, sch.arrival_time);

    return `
      <div class="train-card" id="train-card-${sch.schedule_id}">
        <div class="train-card-header">
          <div class="train-info-group">
            <div class="train-title-block">
              <h3>${sch.train_name}</h3>
              <span class="train-number">ID: ${sch.train_id} | Schedule: ${sch.schedule_id}</span>
            </div>
          </div>
          <span class="train-type-pill">${sch.train_type}</span>
        </div>

        <div class="train-schedule-grid">
          <div class="schedule-station">
            <div class="station-time">${window.formatTime(sch.departure_time)}</div>
            <div class="station-name">${sch.source_name}</div>
            <div class="station-city">${sch.source_city}</div>
          </div>

          <div class="schedule-duration">
            <span>${durationStr}</span>
            <div class="duration-line"></div>
            <span>Journey Date: ${window.formatDate(sch.journey_date)}</span>
          </div>

          <div class="schedule-station dest">
            <div class="station-time">${window.formatTime(sch.arrival_time)}</div>
            <div class="station-name">${sch.dest_name}</div>
            <div class="station-city">${sch.dest_city}</div>
          </div>
        </div>

        <div>
          <label style="font-size: 0.8rem; font-weight: 600; color: #475569; margin-bottom: 0.35rem; display: block;">
            Select Travel Class & Check Availability:
          </label>
          <div class="train-classes-container">
            ${classes.map(cls => {
              const clsFare = Math.round(sch.base_fare * cls.multiplier);
              const isSelected = cls.code === currentClass;
              return `
                <div class="class-card-chip ${isSelected ? 'selected' : ''}" 
                     onclick="selectClassForSchedule('${sch.schedule_id}', '${cls.code}', ${clsFare})">
                  <div class="class-code">${cls.code} (${cls.label})</div>
                  <div class="class-price">${window.formatCurrency(clsFare)}</div>
                  <div class="class-seats available">Seats: ${cls.seats} Available</div>
                </div>
              `;
            }).join('')}
          </div>
        </div>

        <div class="train-card-footer">
          <div class="fare-display-group">
            <span class="fare-label">Class: <strong>${activeClassObj.code}</strong> | Total Seats: <strong>${sch.total_seats}</strong></span>
            <div style="margin-left: 1.5rem;">
              <span class="fare-label">Fare:</span>
              <span class="fare-amount" id="fare-display-${sch.schedule_id}">${window.formatCurrency(calculatedFare)}</span>
            </div>
          </div>

          <button class="btn btn-primary" onclick="proceedToBooking('${sch.schedule_id}')">
            Book Now ➔
          </button>
        </div>
      </div>
    `;
  }).join('');
}

window.selectClassForSchedule = function(scheduleId, classCode, fare) {
  selectedClasses[scheduleId] = classCode;
  const fareDisplay = document.getElementById(`fare-display-${scheduleId}`);
  if (fareDisplay) {
    fareDisplay.textContent = window.formatCurrency(fare);
  }

  // Update chip styles
  const card = document.getElementById(`train-card-${scheduleId}`);
  if (card) {
    card.querySelectorAll('.class-card-chip').forEach(chip => {
      chip.classList.toggle('selected', chip.textContent.includes(classCode));
    });
  }
};

window.proceedToBooking = function(scheduleId) {
  const chosenClass = selectedClasses[scheduleId] || '3A';
  window.location.href = `book-ticket.html?schedule_id=${scheduleId}&class=${chosenClass}`;
};
