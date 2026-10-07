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

    // Default to today + 2 days
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

    // Handle API response:
    // { success: true, data: [...] }
    // OR directly [...]
    const stations = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : [];

    if (stations.length > 0) {
      const optionsHtml = `
        <option value="">Select Station</option>
        ${stations.map(s => `
          <option value="${s.station_id}">
            ${s.station_name} (${s.city})
          </option>
        `).join('')}
      `;

      fromSelect.innerHTML = optionsHtml;
      toSelect.innerHTML = optionsHtml;

      // Set first two stations as default
      if (stations.length >= 2) {
        fromSelect.value = stations[0].station_id;
        toSelect.value = stations[1].station_id;
      }
    } else {
      fromSelect.innerHTML = '<option value="">No stations available</option>';
      toSelect.innerHTML = '<option value="">No stations available</option>';
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
      window.showToast(
        'Please select both departure and destination stations.',
        'warning'
      );
      return;
    }

    if (fromVal === toVal) {
      window.showToast(
        'Source and Destination stations cannot be identical.',
        'warning'
      );
      return;
    }

    if (!dateVal) {
      window.showToast(
        'Please select a journey date.',
        'warning'
      );
      return;
    }

    // Redirect to Train Search page
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

    // Handle API response:
    // { success: true, data: [...] }
    // OR directly [...]
    const schedules = Array.isArray(res)
      ? res
      : Array.isArray(res?.data)
        ? res.data
        : [];

    if (schedules.length > 0) {
      const featuredSchedules = schedules.slice(0, 4);

      container.innerHTML = featuredSchedules.map(sch => `
        <div class="train-card" style="padding: 1.25rem;">

          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
          ">
            <span class="train-type-pill">
              ${sch.train_type || 'Train'}
            </span>

            <span style="
              font-weight: 700;
              color: #059669;
            ">
              From ${window.formatCurrency(sch.base_fare || 0)}
            </span>
          </div>

          <h4 style="
            font-size: 1.05rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
            color: #0f172a;
          ">
            ${sch.train_name || 'Train'}
          </h4>

          <p style="
            font-size: 0.85rem;
            color: #64748b;
            margin-bottom: 1rem;
          ">
            ${sch.source_name || 'Source'} → ${sch.dest_name || 'Destination'}
          </p>

          <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
          ">

            <span style="
              font-size: 0.8rem;
              color: #475569;
            ">
              Dep:
              <strong>
                ${window.formatTime(sch.departure_time)}
              </strong>
            </span>

            <a
              href="trains.html?source_station_id=${sch.source_station_id}&dest_station_id=${sch.dest_station_id}&journey_date=${sch.journey_date}"
              class="btn btn-outline btn-sm"
            >
              View Trains →
            </a>

          </div>
        </div>
      `).join('');

    } else {
      container.innerHTML = `
        <p style="text-align:center; color:#64748b;">
          No featured routes available.
        </p>
      `;
    }

  } catch (err) {
    console.error('Error loading featured routes:', err);

    container.innerHTML = `
      <p style="text-align:center; color:#64748b;">
        Unable to load featured routes.
      </p>
    `;
  }
}
```

Now save the file.

### Then do this

In PowerShell, **keep your Flask backend running** and run:

```powershell
cd "C:\Users\Omprakash\.gemini\antigravity\scratch\railway-reservation-system"
```

If your frontend server is already running, leave it running.

Open:

```text
http://127.0.0.1:8000/index.html
```

Then press:

**Ctrl + Shift + R**

### What should happen

You should now see your stations in the two dropdowns, such as:

* Secunderabad Jn
* Visakhapatnam Jn
* Vijayawada Jn
* Chennai Central

And the **Featured Routes** section should load your train schedules.

The two errors:

```text
res.data.map is not a function
res.data.slice is not a function
```

should be gone.
