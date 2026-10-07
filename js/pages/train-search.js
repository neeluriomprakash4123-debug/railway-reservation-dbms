/**
 * ============================================================================
 * TRAIN SEARCH PAGE LOGIC (train-search.js)
 * ============================================================================
 */

let allSchedules = [];
let selectedClasses = {};

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

    const stations = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : [];

    const options = `
      <option value="">All Stations</option>
      ${stations.map(s => `
        <option value="${s.station_id}">
          ${s.station_name} (${s.city})
        </option>
      `).join('')}
    `;

    fromSelect.innerHTML = options;
    toSelect.innerHTML = options;

  } catch (err) {
    console.error('Error loading station filters:', err);
  }
}

function initFormFromUrl() {
  const src = window.getUrlParam('source_station_id');
  const dest = window.getUrlParam('dest_station_id');
  const date = window.getUrlParam('journey_date');

  const fromSelect = document.getElementById('search_source_station');
  const toSelect = document.getElementById('search_dest_station');
  const dateInput = document.getElementById('search_journey_date');

  if (src && fromSelect) fromSelect.value = src;
  if (dest && toSelect) toSelect.value = dest;

  if (date && dateInput) {
    dateInput.value = date;
  } else if (dateInput) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    dateInput.value = tomorrow.toISOString().split('T')[0];
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

  if (!resultsContainer) {
    console.error('trains-container not found');
    return;
  }

  resultsContainer.innerHTML = '';

  if (loadingIndicator) {
    loadingIndicator.style.display = 'block';
  }

  const src = document.getElementById('search_source_station')?.value || '';
  const dest = document.getElementById('search_dest_station')?.value || '';
  const date = document.getElementById('search_journey_date')?.value || '';

  console.log('[Train Search] Searching:', {
    source_station_id: src,
    dest_station_id: dest,
    journey_date: date
  });

  try {
    const params = {};

    if (src) params.source_station_id = src;
    if (dest) params.dest_station_id = dest;
    if (date) params.journey_date = date;

    console.log('[Train Search] API params:', params);

    const res = await window.RailwayAPI.getSchedules(params);

    console.log('[Train Search] API response:', res);

    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }

    allSchedules = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : [];

    console.log('[Train Search] Schedules found:', allSchedules.length);

    if (countBadge) {
      countBadge.textContent = `${allSchedules.length} Trains Found`;
    }

    renderResults(filterSchedules());

  } catch (err) {
    console.error('[Train Search] Error:', err);

    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
    }

    resultsContainer.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">??</div>
        <h3>Failed to load trains</h3>
        <p>${err.message || 'Unable to load train schedules.'}</p>
        <button
          class="btn btn-secondary btn-sm"
          id="retry-search-btn"
          style="margin-top: 1rem;"
        >
          Retry
        </button>
      </div>
    `;

    const retryBtn = document.getElementById('retry-search-btn');

    if (retryBtn) {
      retryBtn.addEventListener('click', performSearch);
    }

    if (window.showToast) {
      window.showToast(
        err.message || 'Failed to load trains',
        'error'
      );
    }
  }
}

function filterSchedules() {
  const typeVal =
    document.getElementById('filter_train_type')?.value || '';

  if (!typeVal) {
    return allSchedules;
  }

  return allSchedules.filter(
    s => s.train_type === typeVal
  );
}

function renderResults(schedules) {
  const container = document.getElementById('trains-container');

  if (!container) {
    console.error('trains-container not found');
    return;
  }

  if (!Array.isArray(schedules) || schedules.length === 0) {
    container.innerHTML = `
      <div class="card empty-state">
        <div class="empty-state-icon">??</div>
        <h3>No Trains Found</h3>
        <p>
          No matching trains found for the selected
          stations and date.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = schedules.map(sch => {

    const classes = [
      {
        code: '3A',
        label: 'AC 3 Tier',
        multiplier: 1.0,
        seats: Math.floor((sch.total_seats || 0) * 0.4)
      },
      {
        code: '2A',
        label: 'AC 2 Tier',
        multiplier: 1.45,
        seats: Math.floor((sch.total_seats || 0) * 0.25)
      },
      {
        code: '1A',
        label: 'AC 1st Class',
        multiplier: 2.1,
        seats: Math.max(
          12,
          Math.floor((sch.total_seats || 0) * 0.08)
        )
      },
      {
        code: 'SL',
        label: 'Sleeper',
        multiplier: 0.45,
        seats: Math.floor((sch.total_seats || 0) * 0.6)
      }
    ];

    const currentClass =
      selectedClasses[sch.schedule_id] || '3A';

    const activeClass =
      classes.find(c => c.code === currentClass) || classes[0];

    const baseFare = Number(sch.base_fare || 0);

    const calculatedFare =
      Math.round(baseFare * activeClass.multiplier);

    const durationStr =
      window.calculateDuration
        ? window.calculateDuration(
            sch.departure_time,
            sch.arrival_time
          )
        : '';

    const sourceName =
      sch.source_station || 'Source';

    const destinationName =
      sch.destination_station || 'Destination';

    return `
      <div
        class="train-card"
        id="train-card-${sch.schedule_id}"
      >

        <div class="train-card-header">

          <div class="train-info-group">

            <div class="train-title-block">

              <h3>
                ${sch.train_name || 'Train'}
              </h3>

              <span class="train-number">
                ID: ${sch.train_id || '-'}
                |
                Schedule: ${sch.schedule_id || '-'}
              </span>

            </div>

          </div>

          <span class="train-type-pill">
            ${sch.train_type || 'Train'}
          </span>

        </div>

        <div class="train-schedule-grid">

          <div class="schedule-station">

            <div class="station-time">
              ${window.formatTime
                ? window.formatTime(sch.departure_time)
                : sch.departure_time}
            </div>

            <div class="station-name">
              ${sourceName}
            </div>

            <div class="station-city">
              ${sch.source_station_id || ''}
            </div>

          </div>

          <div class="schedule-duration">

            <span>
              ${durationStr}
            </span>

            <div class="duration-line"></div>

            <span>
              Journey Date:
              ${window.formatDate
                ? window.formatDate(sch.journey_date)
                : sch.journey_date}
            </span>

          </div>

          <div class="schedule-station dest">

            <div class="station-time">
              ${window.formatTime
                ? window.formatTime(sch.arrival_time)
                : sch.arrival_time}
            </div>

            <div class="station-name">
              ${destinationName}
            </div>

            <div class="station-city">
              ${sch.dest_station_id || ''}
            </div>

          </div>

        </div>

        <div>

          <label
            style="
              font-size: 0.8rem;
              font-weight: 600;
              color: #475569;
              margin-bottom: 0.35rem;
              display: block;
            "
          >
            Select Travel Class & Check Availability:
          </label>

          <div class="train-classes-container">

            ${classes.map(cls => {

              const clsFare =
                Math.round(
                  baseFare * cls.multiplier
                );

              const isSelected =
                cls.code === currentClass;

              return `
                <div
                  class="class-card-chip ${isSelected ? 'selected' : ''}"
                  onclick="selectClassForSchedule(
                    '${sch.schedule_id}',
                    '${cls.code}',
                    ${clsFare}
                  )"
                >

                  <div class="class-code">
                    ${cls.code} (${cls.label})
                  </div>

                  <div class="class-price">
                    ${window.formatCurrency
                      ? window.formatCurrency(clsFare)
                      : '?' + clsFare}
                  </div>

                  <div class="class-seats available">
                    Seats: ${cls.seats} Available
                  </div>

                </div>
              `;

            }).join('')}

          </div>

        </div>

        <div class="train-card-footer">

          <div class="fare-display-group">

            <span class="fare-label">
              Class:
              <strong>
                ${activeClass.code}
              </strong>

              |
              Total Seats:
              <strong>
                ${sch.total_seats || 0}
              </strong>
            </span>

            <div style="margin-left: 1.5rem;">

              <span class="fare-label">
                Fare:
              </span>

              <span
                class="fare-amount"
                id="fare-display-${sch.schedule_id}"
              >
                ${window.formatCurrency
                  ? window.formatCurrency(calculatedFare)
                  : '?' + calculatedFare}
              </span>

            </div>

          </div>

          <button
            class="btn btn-primary"
            onclick="proceedToBooking('${sch.schedule_id}')"
          >
            Book Now ?
          </button>

        </div>

      </div>
    `;

  }).join('');
}

window.selectClassForSchedule =
  function(scheduleId, classCode, fare) {

    selectedClasses[scheduleId] = classCode;

    const fareDisplay =
      document.getElementById(
        `fare-display-${scheduleId}`
      );

    if (fareDisplay) {
      fareDisplay.textContent =
        window.formatCurrency
          ? window.formatCurrency(fare)
          : '?' + fare;
    }

    const card =
      document.getElementById(
        `train-card-${scheduleId}`
      );

    if (card) {

      card
        .querySelectorAll('.class-card-chip')
        .forEach(chip => {

          const codeElement =
            chip.querySelector('.class-code');

          chip.classList.toggle(
            'selected',
            codeElement &&
            codeElement.textContent.includes(classCode)
          );

        });

    }
  };

window.proceedToBooking =
  function(scheduleId) {

    const chosenClass =
      selectedClasses[scheduleId] || '3A';

    window.location.href =
      `book-ticket.html?schedule_id=${encodeURIComponent(scheduleId)}&class=${encodeURIComponent(chosenClass)}`;
  };
