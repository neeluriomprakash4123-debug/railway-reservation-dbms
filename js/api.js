/**
 * ============================================================================
 * RAILWAY TICKET RESERVATION & JOURNEY MANAGEMENT SYSTEM
 * REST API Client & Service Layer (api.js)
 * ============================================================================
 * 
 * Architecture:
 *   Frontend (JavaScript) 
 *        ↓
 *   REST API (fetch()) 
 *        ↓
 *   Python Flask Backend 
 *        ↓
 *   MySQL Database
 * 
 * Note:
 *   - By default, USE_MOCK is set to TRUE to allow immediate interactive demo
 *     without requiring MySQL or Flask to be running.
 *   - When Flask backend is running on http://127.0.0.1:5000, toggle USE_MOCK
 *     to FALSE to direct all requests to live Flask endpoints.
 *   - Exact MySQL entities & field names are strictly respected throughout.
 */

const API_CONFIG = {
  BASE_URL: window.API_BASE_URL || 'http://127.0.0.1:5000',
  // Toggle between Mock localStorage and Live Flask Backend
  USE_MOCK: localStorage.getItem('railway_use_mock') !== 'false',
  SIMULATE_LATENCY_MS: 300 // Simulates realistic network round-trip for spinners
};

// ============================================================================
// INITIAL SEED DATABASE (Mirrors MySQL Schema)
// ============================================================================
const DEFAULT_DATABASE = {
  stations: [
    { station_id: "STN01", station_name: "New Delhi Railway Station (NDLS)", city: "New Delhi", state: "Delhi" },
    { station_id: "STN02", station_name: "Mumbai Central (MMCT)", city: "Mumbai", state: "Maharashtra" },
    { station_id: "STN03", station_name: "KSR Bengaluru City (SBC)", city: "Bengaluru", state: "Karnataka" },
    { station_id: "STN04", station_name: "MGR Chennai Central (MAS)", city: "Chennai", state: "Tamil Nadu" },
    { station_id: "STN05", station_name: "Howrah Junction (HWH)", city: "Kolkata", state: "West Bengal" },
    { station_id: "STN06", station_name: "Ahmedabad Junction (ADI)", city: "Ahmedabad", state: "Gujarat" },
    { station_id: "STN07", station_name: "Varanasi Junction (BSB)", city: "Varanasi", state: "Uttar Pradesh" },
    { station_id: "STN08", station_name: "Jaipur Junction (JP)", city: "Jaipur", state: "Rajasthan" }
  ],
  trains: [
    { train_id: "TR101", train_name: "12952 - Mumbai Tejas Rajdhani", train_type: "Rajdhani Express", total_seats: 480 },
    { train_id: "TR102", train_name: "22436 - Vande Bharat Express", train_type: "Vande Bharat Express", total_seats: 530 },
    { train_id: "TR103", train_name: "12002 - New Delhi Shatabdi", train_type: "Shatabdi Express", total_seats: 420 },
    { train_id: "TR104", train_name: "12246 - Howrah Duronto Express", train_type: "Duronto Express", total_seats: 600 },
    { train_id: "TR105", train_name: "12626 - Kerala Superfast Express", train_type: "Superfast Express", total_seats: 750 },
    { train_id: "TR106", train_name: "12958 - Swarna Jayanti Rajdhani", train_type: "Rajdhani Express", total_seats: 500 }
  ],
  schedules: [
    {
      schedule_id: "SCH101",
      train_id: "TR101",
      source_station_id: "STN01",
      dest_station_id: "STN02",
      journey_date: "2026-10-10",
      departure_time: "16:55:00",
      arrival_time: "08:35:00",
      base_fare: 1850.00
    },
    {
      schedule_id: "SCH102",
      train_id: "TR102",
      source_station_id: "STN01",
      dest_station_id: "STN07",
      journey_date: "2026-10-10",
      departure_time: "06:00:00",
      arrival_time: "14:00:00",
      base_fare: 1750.00
    },
    {
      schedule_id: "SCH103",
      train_id: "TR103",
      source_station_id: "STN01",
      dest_station_id: "STN08",
      journey_date: "2026-10-11",
      departure_time: "06:10:00",
      arrival_time: "10:40:00",
      base_fare: 950.00
    },
    {
      schedule_id: "SCH104",
      train_id: "TR104",
      source_station_id: "STN05",
      dest_station_id: "STN01",
      journey_date: "2026-10-12",
      departure_time: "17:00:00",
      arrival_time: "10:30:00",
      base_fare: 2100.00
    },
    {
      schedule_id: "SCH105",
      train_id: "TR105",
      source_station_id: "STN01",
      dest_station_id: "STN03",
      journey_date: "2026-10-14",
      departure_time: "20:10:00",
      arrival_time: "06:40:00",
      base_fare: 2350.00
    },
    {
      schedule_id: "SCH106",
      train_id: "TR101",
      source_station_id: "STN02",
      dest_station_id: "STN01",
      journey_date: "2026-10-15",
      departure_time: "17:00:00",
      arrival_time: "08:32:00",
      base_fare: 1850.00
    }
  ],
  passengers: [
    {
      passenger_id: "PSG101",
      name: "Rajesh Kumar Sharma",
      age: 35,
      gender: "Male",
      phone: "9876543210",
      email: "rajesh.sharma@example.com"
    },
    {
      passenger_id: "PSG102",
      name: "Priya V. Patel",
      age: 29,
      gender: "Female",
      phone: "9823456781",
      email: "priya.patel@example.com"
    },
    {
      passenger_id: "PSG103",
      name: "Amitabh Verma",
      age: 52,
      gender: "Male",
      phone: "9711223344",
      email: "amitabh.verma@example.com"
    }
  ],
  bookings: [
    {
      booking_id: "BK829140",
      passenger_id: "PSG101",
      schedule_id: "SCH101",
      booking_date: "2026-10-01 14:20:00",
      total_fare: 1850.00,
      status: "CONFIRMED"
    },
    {
      booking_id: "BK541920",
      passenger_id: "PSG102",
      schedule_id: "SCH102",
      booking_date: "2026-10-02 10:15:00",
      total_fare: 1750.00,
      status: "CONFIRMED"
    },
    {
      booking_id: "BK730219",
      passenger_id: "PSG103",
      schedule_id: "SCH105",
      booking_date: "2026-10-03 18:45:00",
      total_fare: 2350.00,
      status: "CANCELLED"
    }
  ],
  tickets: [
    {
      ticket_id: "TK9010",
      booking_id: "BK829140",
      schedule_id: "SCH101",
      coach: "B2",
      seat_no: "24",
      class: "3A",
      fare: 1850.00
    },
    {
      ticket_id: "TK9011",
      booking_id: "BK541920",
      schedule_id: "SCH102",
      coach: "C4",
      seat_no: "18",
      class: "CC",
      fare: 1750.00
    },
    {
      ticket_id: "TK9012",
      booking_id: "BK730219",
      schedule_id: "SCH105",
      coach: "A1",
      seat_no: "12",
      class: "2A",
      fare: 2350.00
    }
  ],
  payments: [
    {
      payment_id: "PAY6001",
      booking_id: "BK829140",
      amount: 1850.00,
      mode: "UPI",
      status: "SUCCESS"
    },
    {
      payment_id: "PAY6002",
      booking_id: "BK541920",
      amount: 1750.00,
      mode: "Credit Card",
      status: "SUCCESS"
    },
    {
      payment_id: "PAY6003",
      booking_id: "BK730219",
      amount: 2350.00,
      mode: "Net Banking",
      status: "REFUNDED"
    }
  ]
};

// ============================================================================
// LOCAL STORAGE MOCK STORE CONTROLLER
// ============================================================================
class MockStore {
  static init() {
    const existing = localStorage.getItem('railway_db');
    if (!existing) {
      localStorage.setItem('railway_db', JSON.stringify(DEFAULT_DATABASE));
    }
  }

  static getDB() {
    this.init();
    try {
      return JSON.parse(localStorage.getItem('railway_db')) || DEFAULT_DATABASE;
    } catch (e) {
      return DEFAULT_DATABASE;
    }
  }

  static saveDB(data) {
    localStorage.setItem('railway_db', JSON.stringify(data));
  }

  static reset() {
    localStorage.setItem('railway_db', JSON.stringify(DEFAULT_DATABASE));
  }
}

// Ensure mock store is ready
MockStore.init();

// ============================================================================
// CENTRAL API HELPER
// ============================================================================
async function request(endpoint, options = {}) {
  // If in live mode, perform real fetch() call to Flask REST API
  if (!API_CONFIG.USE_MOCK) {
    const url = `${API_CONFIG.BASE_URL}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          ...(options.headers || {})
        }
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(
        data.error ||
        data.message ||
        `HTTP ${response.status}: Request failed`
    );
      }

      return { success: true, data };
    } catch (err) {
      console.warn(`[API] Live request to ${url} failed:`, err.message);
      throw err;
    }
  }

  // MOCK STORE HANDLER WITH NETWORK DELAY SIMULATION
  await new Promise(resolve => setTimeout(resolve, API_CONFIG.SIMULATE_LATENCY_MS));
  return handleMockRequest(endpoint, options);
}

// ============================================================================
// MOCK REST API ROUTE SIMULATOR (Mirrors Flask REST API Behavior)
// ============================================================================
function handleMockRequest(endpoint, options) {
  const method = (options.method || 'GET').toUpperCase();
  const db = MockStore.getDB();
  const body = options.body ? JSON.parse(options.body) : null;
  const [path, queryString] = endpoint.split('?');
  const query = new URLSearchParams(queryString || '');

  // Helper: Enriched Schedule with Train & Station details
  const enrichSchedule = (sch) => {
    const train = db.trains.find(t => t.train_id === sch.train_id) || {};
    const src = db.stations.find(s => s.station_id === sch.source_station_id) || {};
    const dest = db.stations.find(s => s.station_id === sch.dest_station_id) || {};
    return {
      ...sch,
      train_name: train.train_name || sch.train_id,
      train_type: train.train_type || 'Express',
      total_seats: train.total_seats || 400,
      source_name: src.station_name || sch.source_station_id,
      source_city: src.city || '',
      dest_name: dest.station_name || sch.dest_station_id,
      dest_city: dest.city || ''
    };
  };

  // Helper: Enriched Booking with Passenger, Schedule, Ticket & Payment
  const enrichBooking = (b) => {
    const passenger = db.passengers.find(p => p.passenger_id === b.passenger_id) || {};
    const schedule = db.schedules.find(s => s.schedule_id === b.schedule_id) || {};
    const enrichedSch = enrichSchedule(schedule);
    const ticket = db.tickets.find(t => t.booking_id === b.booking_id) || {};
    const payment = db.payments.find(p => p.booking_id === b.booking_id) || {};

    return {
      ...b,
      passenger_name: passenger.name || '',
      passenger_age: passenger.age || '',
      passenger_gender: passenger.gender || '',
      passenger_phone: passenger.phone || '',
      passenger_email: passenger.email || '',
      train_name: enrichedSch.train_name,
      train_type: enrichedSch.train_type,
      source_name: enrichedSch.source_name,
      dest_name: enrichedSch.dest_name,
      source_city: enrichedSch.source_city,
      dest_city: enrichedSch.dest_city,
      journey_date: enrichedSch.journey_date,
      departure_time: enrichedSch.departure_time,
      arrival_time: enrichedSch.arrival_time,
      coach: ticket.coach || 'B1',
      seat_no: ticket.seat_no || '12',
      class: ticket.class || '3A',
      ticket_id: ticket.ticket_id || '',
      payment_mode: payment.mode || 'UPI',
      payment_status: payment.status || 'SUCCESS',
      payment_id: payment.payment_id || ''
    };
  };

  // 1. GET /api/stations
  if (path === '/api/stations' && method === 'GET') {
    return { success: true, data: db.stations };
  }

  // 1.1 POST /api/stations
  if (path === '/api/stations' && method === 'POST') {
    const station_id = body.station_id || `STN${String(db.stations.length + 1).padStart(2, '0')}`;
    const newStation = { ...body, station_id };
    db.stations.push(newStation);
    MockStore.saveDB(db);
    return { success: true, data: newStation };
  }

  // 1.2 PUT /api/stations/:id
  const matchStation = path.match(/^\/api\/stations\/([a-zA-Z0-9_-]+)$/);
  if (matchStation && method === 'PUT') {
    const id = matchStation[1];
    const idx = db.stations.findIndex(s => s.station_id === id);
    if (idx === -1) throw new Error('Station not found');
    db.stations[idx] = { ...db.stations[idx], ...body, station_id: id };
    MockStore.saveDB(db);
    return { success: true, data: db.stations[idx] };
  }

  // 1.3 DELETE /api/stations/:id
  if (matchStation && method === 'DELETE') {
    const id = matchStation[1];
    db.stations = db.stations.filter(s => s.station_id !== id);
    MockStore.saveDB(db);
    return { success: true, message: 'Station deleted successfully' };
  }

  // 2. TRAINS
  // 2.1 GET /api/trains
  if (path === '/api/trains' && method === 'GET') {
    return { success: true, data: db.trains };
  }

  // 2.2 POST /api/trains
  if (path === '/api/trains' && method === 'POST') {
    const train_id = body.train_id || `TR${100 + db.trains.length + 1}`;
    const newTrain = {
      train_id,
      train_name: body.train_name,
      train_type: body.train_type,
      total_seats: parseInt(body.total_seats, 10) || 500
    };
    db.trains.push(newTrain);
    MockStore.saveDB(db);
    return { success: true, data: newTrain };
  }

  // 2.3 PUT /api/trains/:id
  const matchTrain = path.match(/^\/api\/trains\/([a-zA-Z0-9_-]+)$/);
  if (matchTrain && method === 'PUT') {
    const id = matchTrain[1];
    const idx = db.trains.findIndex(t => t.train_id === id);
    if (idx === -1) throw new Error('Train not found');
    db.trains[idx] = { ...db.trains[idx], ...body, train_id: id };
    MockStore.saveDB(db);
    return { success: true, data: db.trains[idx] };
  }

  // 2.4 DELETE /api/trains/:id
  if (matchTrain && method === 'DELETE') {
    const id = matchTrain[1];
    db.trains = db.trains.filter(t => t.train_id !== id);
    MockStore.saveDB(db);
    return { success: true, message: 'Train deleted successfully' };
  }

  // 3. SCHEDULES
  // 3.1 GET /api/schedules
  if (path === '/api/schedules' && method === 'GET') {
    let results = db.schedules.map(enrichSchedule);
    const src = query.get('source_station_id');
    const dest = query.get('dest_station_id');
    const date = query.get('journey_date');

    if (src) {
      results = results.filter(s => s.source_station_id === src || s.source_name.toLowerCase().includes(src.toLowerCase()));
    }
    if (dest) {
      results = results.filter(s => s.dest_station_id === dest || s.dest_name.toLowerCase().includes(dest.toLowerCase()));
    }
    if (date) {
      results = results.filter(s => s.journey_date === date);
    }

    return { success: true, data: results };
  }

  // 3.2 GET /api/schedules/:id
  const matchSchedule = path.match(/^\/api\/schedules\/([a-zA-Z0-9_-]+)$/);
  if (matchSchedule && method === 'GET') {
    const id = matchSchedule[1];
    const item = db.schedules.find(s => s.schedule_id === id);
    if (!item) throw new Error('Schedule not found');
    return { success: true, data: enrichSchedule(item) };
  }

  // 3.3 POST /api/schedules
  if (path === '/api/schedules' && method === 'POST') {
    const schedule_id = body.schedule_id || `SCH${100 + db.schedules.length + 1}`;
    const newSch = { ...body, schedule_id, base_fare: parseFloat(body.base_fare) };
    db.schedules.push(newSch);
    MockStore.saveDB(db);
    return { success: true, data: enrichSchedule(newSch) };
  }

  // 3.4 PUT /api/schedules/:id
  if (matchSchedule && method === 'PUT') {
    const id = matchSchedule[1];
    const idx = db.schedules.findIndex(s => s.schedule_id === id);
    if (idx === -1) throw new Error('Schedule not found');
    db.schedules[idx] = { ...db.schedules[idx], ...body, schedule_id: id };
    MockStore.saveDB(db);
    return { success: true, data: enrichSchedule(db.schedules[idx]) };
  }

  // 3.5 DELETE /api/schedules/:id
  if (matchSchedule && method === 'DELETE') {
    const id = matchSchedule[1];
    db.schedules = db.schedules.filter(s => s.schedule_id !== id);
    MockStore.saveDB(db);
    return { success: true, message: 'Schedule deleted successfully' };
  }

  // 4. PASSENGERS
  // 4.1 GET /api/passengers
  if (path === '/api/passengers' && method === 'GET') {
    return { success: true, data: db.passengers };
  }

  // 4.2 POST /api/passengers
  if (path === '/api/passengers' && method === 'POST') {
    const passenger_id = body.passenger_id || `PSG${100 + db.passengers.length + 1}`;
    const newPassenger = {
      passenger_id,
      name: body.name,
      age: parseInt(body.age, 10),
      gender: body.gender,
      phone: body.phone,
      email: body.email
    };
    db.passengers.push(newPassenger);
    MockStore.saveDB(db);
    return { success: true, data: newPassenger };
  }

  // 4.3 GET /api/passengers/:id
  const matchPassenger = path.match(/^\/api\/passengers\/([a-zA-Z0-9_-]+)$/);
  if (matchPassenger && method === 'GET') {
    const id = matchPassenger[1];
    const p = db.passengers.find(x => x.passenger_id === id);
    if (!p) throw new Error('Passenger not found');
    return { success: true, data: p };
  }

  // 4.4 PUT /api/passengers/:id
  if (matchPassenger && method === 'PUT') {
    const id = matchPassenger[1];
    const idx = db.passengers.findIndex(x => x.passenger_id === id);
    if (idx === -1) throw new Error('Passenger not found');
    db.passengers[idx] = { ...db.passengers[idx], ...body, passenger_id: id };
    MockStore.saveDB(db);
    return { success: true, data: db.passengers[idx] };
  }

  // 4.5 DELETE /api/passengers/:id
  if (matchPassenger && method === 'DELETE') {
    const id = matchPassenger[1];
    db.passengers = db.passengers.filter(x => x.passenger_id !== id);
    MockStore.saveDB(db);
    return { success: true, message: 'Passenger deleted successfully' };
  }

  // 5. BOOKINGS & TICKETS
  // 5.1 GET /api/bookings
  if (path === '/api/bookings' && method === 'GET') {
    return { success: true, data: db.bookings.map(enrichBooking) };
  }

  // 5.2 POST /api/bookings
  if (path === '/api/bookings' && method === 'POST') {
    // Generate distinct Booking ID (PNR)
    const booking_id = `BK${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const newBooking = {
      booking_id,
      passenger_id: body.passenger_id,
      schedule_id: body.schedule_id,
      booking_date: now,
      total_fare: parseFloat(body.total_fare || body.fare || 1500),
      status: 'CONFIRMED'
    };

    // Create related Ticket record
    const ticket_id = `TK${Math.floor(1000 + Math.random() * 9000)}`;
    const newTicket = {
      ticket_id,
      booking_id,
      schedule_id: body.schedule_id,
      coach: body.coach || 'B1',
      seat_no: String(body.seat_no || Math.floor(1 + Math.random() * 64)),
      class: body.class || '3A',
      fare: newBooking.total_fare
    };

    db.bookings.push(newBooking);
    db.tickets.push(newTicket);
    MockStore.saveDB(db);

    return {
      success: true,
      data: enrichBooking(newBooking),
      booking_id,
      ticket_id
    };
  }

  // 5.3 GET /api/bookings/:id
  const matchBooking = path.match(/^\/api\/bookings\/([a-zA-Z0-9_-]+)$/);
  if (matchBooking && method === 'GET') {
    const id = matchBooking[1];
    const b = db.bookings.find(x => x.booking_id.toUpperCase() === id.toUpperCase());
    if (!b) throw new Error(`Booking/PNR #${id} not found.`);
    return { success: true, data: enrichBooking(b) };
  }

  // 5.4 PUT /api/bookings/:id
  if (matchBooking && method === 'PUT') {
    const id = matchBooking[1];
    const idx = db.bookings.findIndex(x => x.booking_id === id);
    if (idx === -1) throw new Error('Booking not found');
    db.bookings[idx] = { ...db.bookings[idx], ...body, booking_id: id };
    MockStore.saveDB(db);
    return { success: true, data: enrichBooking(db.bookings[idx]) };
  }

  // 5.5 POST /api/bookings/:id/cancel
  const matchCancel = path.match(/^\/api\/bookings\/([a-zA-Z0-9_-]+)\/cancel$/);
  if (matchCancel && method === 'POST') {
    const id = matchCancel[1];
    const idx = db.bookings.findIndex(x => x.booking_id.toUpperCase() === id.toUpperCase());
    if (idx === -1) throw new Error(`Booking #${id} not found.`);

    if (db.bookings[idx].status === 'CANCELLED') {
      throw new Error(`Booking #${id} is already cancelled.`);
    }

    db.bookings[idx].status = 'CANCELLED';

    // Update payment to refunded
    const pIdx = db.payments.findIndex(p => p.booking_id === id);
    if (pIdx !== -1) {
      db.payments[pIdx].status = 'REFUNDED';
    }

    MockStore.saveDB(db);
    return {
      success: true,
      message: 'Booking cancelled successfully. Refund initiated.',
      data: enrichBooking(db.bookings[idx])
    };
  }

  // 6. PAYMENTS
  // 6.1 GET /api/payments
  if (path === '/api/payments' && method === 'GET') {
    return { success: true, data: db.payments };
  }

  // 6.2 POST /api/payments
  if (path === '/api/payments' && method === 'POST') {
    const payment_id = `PAY${Math.floor(1000 + Math.random() * 9000)}`;
    const newPayment = {
      payment_id,
      booking_id: body.booking_id,
      amount: parseFloat(body.amount),
      mode: body.mode || 'UPI',
      status: body.status || 'SUCCESS'
    };
    db.payments.push(newPayment);
    MockStore.saveDB(db);
    return { success: true, data: newPayment };
  }

  // 7. GET /api/admin/dashboard
  if (path === '/api/admin/dashboard' && method === 'GET') {
    const totalPassengers = db.passengers.length;
    const totalTrains = db.trains.length;
    const totalStations = db.stations.length;
    const totalBookings = db.bookings.length;
    const confirmedBookings = db.bookings.filter(b => b.status === 'CONFIRMED').length;
    const waitingBookings = db.bookings.filter(b => b.status === 'WAITING').length;
    const cancelledBookings = db.bookings.filter(b => b.status === 'CANCELLED').length;
    const totalRevenue = db.payments
      .filter(p => p.status === 'SUCCESS')
      .reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);

    return {
      success: true,
      data: {
        total_passengers: totalPassengers,
        total_trains: totalTrains,
        total_stations: totalStations,
        total_bookings: totalBookings,
        confirmed_bookings: confirmedBookings,
        waiting_bookings: waitingBookings,
        cancelled_bookings: cancelledBookings,
        total_revenue: totalRevenue
      }
    };
  }

  throw new Error(`Endpoint not found: [${method}] ${endpoint}`);
}

// ============================================================================
// EXPORTED API CLIENT SERVICE
// ============================================================================
window.RailwayAPI = {
  // Config & State
  getConfig: () => ({ ...API_CONFIG }),
  toggleMock: (useMock) => {
    API_CONFIG.USE_MOCK = useMock;
    localStorage.setItem('railway_use_mock', useMock ? 'true' : 'false');
  },
  resetMockData: () => {
    MockStore.reset();
  },

  // STATIONS
  getStations: () => request('/api/stations'),
  createStation: (data) => request('/api/stations', { method: 'POST', body: JSON.stringify(data) }),
  updateStation: (id, data) => request(`/api/stations/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteStation: (id) => request(`/api/stations/${id}`, { method: 'DELETE' }),

  // TRAINS
  getTrains: () => request('/api/trains'),
  createTrain: (data) => request('/api/trains', { method: 'POST', body: JSON.stringify(data) }),
  updateTrain: (id, data) => request(`/api/trains/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteTrain: (id) => request(`/api/trains/${id}`, { method: 'DELETE' }),

  // SCHEDULES
  getSchedules: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return request(`/api/schedules${qs ? '?' + qs : ''}`);
  },
  getScheduleById: (id) => request(`/api/schedules/${id}`),
  createSchedule: (data) => request('/api/schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id, data) => request(`/api/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: (id) => request(`/api/schedules/${id}`, { method: 'DELETE' }),

  // PASSENGERS
  getPassengers: () => request('/api/passengers'),
  getPassengerById: (id) => request(`/api/passengers/${id}`),
  createPassenger: (data) => request('/api/passengers', { method: 'POST', body: JSON.stringify(data) }),
  updatePassenger: (id, data) => request(`/api/passengers/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePassenger: (id) => request(`/api/passengers/${id}`, { method: 'DELETE' }),

  // BOOKINGS
  getBookings: () => request('/api/bookings'),
  getBookingById: (id) => request(`/api/bookings/${id}`),
  createBooking: (data) => request('/api/bookings', { method: 'POST', body: JSON.stringify(data) }),
  updateBooking: (id, data) => request(`/api/bookings/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  cancelBooking: (id) => request(`/api/bookings/${id}/cancel`, { method: 'POST' }),

  // PAYMENTS
  getPayments: () => request('/api/payments'),
  createPayment: (data) => request('/api/payments', { method: 'POST', body: JSON.stringify(data) }),

  // ADMIN
  getAdminDashboard: () => request('/api/admin/dashboard')
};
