/**
 * ============================================================================
 * HOME PAGE LOGIC (home.js)
 * ============================================================================
 */

document.addEventListener('DOMContentLoaded', async () => {
  initDateInput();
  await loadStationOptions();
  initSearchForm();
  initSwapButton();
  loadFeaturedRoutes();
});

function initDateInput() {
  const dateInput = document.getElementById('journey_date');
  if (dateInput) {
    const today = new Date().toISOString().split('T')[0];
    dateInput.min = today;
    // Default to today + 1 day
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 2);
    dateInput.value = defaultDate.toISOString().split('T')[0];
  }
}

async function loadStationOptions() {
  const fromSelect = document.getElementById('source_station_id');
  const toSelect = document.getElementById('dest_station_id');
  if (!fromSelect || !toSelect) return;

  try {
    const res = await window.RailwayAPI.getStations();
    if (res.success && res.data) {
      const optionsHtml = `
        <option value="">Select Station</option>
        ${res.data.map(s => `<option value="${s.station_id}">${s.station_name} (${s.city})</option>`).join('')}
      `;
      fromSelect.innerHTML = optionsHtml;
      toSelect.innerHTML = optionsHtml;

      // Set sensible defaults if available
      if (res.data.length >= 2) {
        fromSelect.value = res.data[0].station_id; // New Delhi
        toSelect.value = res.data[1].station_id;   // Mumbai Central
      }
    }
  } catch (err) {
    console.error('Error loading stations:', err);
    window.showToast('Failed to load stations', 'error');
  }
}

function initSwapButton() {
  const swapBtn = document.getElementById('swap-stations');
  const fromSelect = document.getElementById('source_station_id');
  const toSelect = document.getElementById('dest_station_id');

  if (swapBtn && fromSelect && toSelect) {
    swapBtn.addEventListener('click', () => {
      const temp = fromSelect.value;
      fromSelect.value = toSelect.value;
      toSelect.value = temp;
    });
  }
}

function initSearchForm() {
  const form = document.getElementById('hero-search-form');
  if (!form) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const fromVal = document.getElementById('source_station_id').value;
    const toVal = document.getElementById('dest_station_id').value;
    const dateVal = document.getElementById('journey_date').value;

    if (!fromVal || !toVal) {
      window.showToast('Please select both departure and destination stations.', 'warning');
      return;
    }

    if (fromVal === toVal) {
      window.showToast('Source and Destination stations cannot be identical.', 'warning');
      return;
    }

    if (!dateVal) {
      window.showToast('Please select a journey date.', 'warning');
      return;
    }

    // Redirect to Train Search page with query params
    const params = new URLSearchParams({
      source_station_id: fromVal,
      dest_station_id: toVal,
      journey_date: dateVal
    });

    window.location.href = `trains.html?${params.toString()}`;
  });
}

async function loadFeaturedRoutes() {
  const container = document.getElementById('featured-routes-list');
  if (!container) return;

  try {
    const res = await window.RailwayAPI.getSchedules();
    if (res.success && res.data) {
      const schedules = res.data.slice(0, 4);
      container.innerHTML = schedules.map(sch => `
        <div class="train-card" style="padding: 1.25rem;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem;">
            <span class="train-type-pill">${sch.train_type}</span>
            <span style="font-weight: 700; color: #059669;">From ${window.formatCurrency(sch.base_fare)}</span>
          </div>
          <h4 style="font-size: 1.05rem; font-weight: 700; margin-bottom: 0.5rem; color: #0f172a;">${sch.train_name}</h4>
          <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 1rem;">
            ${sch.source_name} → ${sch.dest_name}
          </p>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 0.8rem; color: #475569;">
              Dep: <strong>${window.formatTime(sch.departure_time)}</strong>
            </span>
            <a href="trains.html?source_station_id=${sch.source_station_id}&dest_station_id=${sch.dest_station_id}&journey_date=${sch.journey_date}" class="btn btn-outline btn-sm">
              View Trains →
            </a>
          </div>
        </div>
      `).join('');
    }
  } catch (err) {
    console.error('Error loading featured routes:', err);
  }
}
