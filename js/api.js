/**
 * Railway Reservation System
 * API Client
 *
 * Frontend
 *    ↓
 * ngrok
 *    ↓
 * Flask Backend
 *    ↓
 * MySQL Database
 */

const API_CONFIG = {
    BASE_URL: "https://obsession-steed-vanish.ngrok-free.dev",
    USE_MOCK: false
};


/* ============================================================
   COMMON REQUEST FUNCTION
   ============================================================ */

async function request(endpoint, options = {}) {

    const url = `${API_CONFIG.BASE_URL}${endpoint}`;

    const config = {
        ...options,
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
            ...(options.headers || {})
        }
    };

    try {

        const response = await fetch(url, config);

        let data = {};

        try {
            data = await response.json();
        } catch (error) {
            data = {};
        }

        if (!response.ok) {

            const message =
                data.error ||
                data.message ||
                `Request failed with status ${response.status}`;

            throw new Error(message);
        }

        return {
            success: true,
            data: data
        };

    } catch (error) {

        console.error(
            `[Railway API] ${endpoint}`,
            error
        );

        throw error;
    }
}


/* ============================================================
   STATIONS
   ============================================================ */

async function getStations() {
    return request("/api/stations");
}

async function createStation(data) {
    return request("/api/stations", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

async function updateStation(id, data) {
    return request(`/api/stations/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

async function deleteStation(id) {
    return request(`/api/stations/${id}`, {
        method: "DELETE"
    });
}


/* ============================================================
   TRAINS
   ============================================================ */

async function getTrains() {
    return request("/api/trains");
}

async function createTrain(data) {
    return request("/api/trains", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

async function updateTrain(id, data) {
    return request(`/api/trains/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

async function deleteTrain(id) {
    return request(`/api/trains/${id}`, {
        method: "DELETE"
    });
}


/* ============================================================
   SCHEDULES
   ============================================================ */

async function getSchedules(params = {}) {

    const query = new URLSearchParams();

    Object.keys(params).forEach(key => {

        if (
            params[key] !== undefined &&
            params[key] !== null &&
            params[key] !== ""
        ) {
            query.append(key, params[key]);
        }

    });

    const queryString = query.toString();

    const endpoint =
        queryString
            ? `/api/schedules?${queryString}`
            : "/api/schedules";

    return request(endpoint);
}

async function getScheduleById(id) {
    return request(`/api/schedules/${id}`);
}

async function createSchedule(data) {
    return request("/api/schedules", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

async function updateSchedule(id, data) {
    return request(`/api/schedules/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

async function deleteSchedule(id) {
    return request(`/api/schedules/${id}`, {
        method: "DELETE"
    });
}


/* ============================================================
   PASSENGERS
   ============================================================ */

async function getPassengers() {
    return request("/api/passengers");
}

async function getPassengerById(id) {
    return request(`/api/passengers/${id}`);
}

async function createPassenger(data) {
    return request("/api/passengers", {
        method: "POST",
        body: JSON.stringify(data)
    });
}

async function updatePassenger(id, data) {
    return request(`/api/passengers/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}

async function deletePassenger(id) {
    return request(`/api/passengers/${id}`, {
        method: "DELETE"
    });
}


/* ============================================================
   BOOKINGS
   ============================================================ */

async function getBookings() {
    return request("/api/bookings");
}

async function getBookingById(id) {
    return request(`/api/bookings/${id}`);
}


/*
 * CREATE BOOKING
 *
 * The Flask backend returns booking information.
 * We flatten the response so code such as:
 *
 * response.booking_id
 *
 * also works.
 */

async function createBooking(data) {

    const response = await request(
        "/api/bookings",
        {
            method: "POST",
            body: JSON.stringify(data)
        }
    );

    /*
     * Flask response can contain:
     *
     * {
     *   success: true,
     *   data: {...},
     *   booking_id: "...",
     *   ticket_id: "..."
     * }
     */

    if (response && response.data) {

        return {
            ...response,
            ...response.data
        };
    }

    return response;
}


async function updateBooking(id, data) {

    return request(`/api/bookings/${id}`, {
        method: "PUT",
        body: JSON.stringify(data)
    });
}


async function cancelBooking(id) {

    return request(
        `/api/bookings/${id}/cancel`,
        {
            method: "POST"
        }
    );
}


/* ============================================================
   PAYMENTS
   ============================================================ */

async function getPayments() {
    return request("/api/payments");
}

async function createPayment(data) {

    return request(
        "/api/payments",
        {
            method: "POST",
            body: JSON.stringify(data)
        }
    );
}


/* ============================================================
   ADMIN DASHBOARD
   ============================================================ */

async function getAdminDashboard() {

    return request(
        "/api/admin/dashboard"
    );
}


/* ============================================================
   API CONNECTION TEST
   ============================================================ */

async function testConnection() {

    try {

        const response =
            await fetch(
                `${API_CONFIG.BASE_URL}/api/trains`
            );

        if (!response.ok) {
            throw new Error(
                `HTTP ${response.status}`
            );
        }

        return true;

    } catch (error) {

        console.error(
            "Backend connection failed:",
            error
        );

        return false;
    }
}


/* ============================================================
   GLOBAL RAILWAY API OBJECT
   ============================================================ */

window.RailwayAPI = {

    /* Configuration */

    getConfig: function () {
        return {
            ...API_CONFIG
        };
    },

    toggleMock: function (useMock) {

        /*
         * Mock mode is disabled for this project.
         * This function is kept so existing pages
         * do not break if they call it.
         */

        API_CONFIG.USE_MOCK = Boolean(useMock);
    },

    testConnection: testConnection,


    /* Stations */

    getStations: getStations,
    createStation: createStation,
    updateStation: updateStation,
    deleteStation: deleteStation,


    /* Trains */

    getTrains: getTrains,
    createTrain: createTrain,
    updateTrain: updateTrain,
    deleteTrain: deleteTrain,


    /* Schedules */

    getSchedules: getSchedules,
    getScheduleById: getScheduleById,
    createSchedule: createSchedule,
    updateSchedule: updateSchedule,
    deleteSchedule: deleteSchedule,


    /* Passengers */

    getPassengers: getPassengers,
    getPassengerById: getPassengerById,
    createPassenger: createPassenger,
    updatePassenger: updatePassenger,
    deletePassenger: deletePassenger,


    /* Bookings */

    getBookings: getBookings,
    getBookingById: getBookingById,
    createBooking: createBooking,
    updateBooking: updateBooking,
    cancelBooking: cancelBooking,


    /* Payments */

    getPayments: getPayments,
    createPayment: createPayment,


    /* Admin */

    getAdminDashboard: getAdminDashboard

};


/* ============================================================
   OPTIONAL CONNECTION CHECK
   ============================================================ */

console.log(
    "Railway API loaded successfully."
);

console.log(
    "Backend:",
    API_CONFIG.BASE_URL
);

console.log(
    "Mock mode:",
    API_CONFIG.USE_MOCK
);