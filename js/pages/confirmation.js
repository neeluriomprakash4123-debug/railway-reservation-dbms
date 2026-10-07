document.addEventListener("DOMContentLoaded", async function () {

    const bookingId = new URLSearchParams(window.location.search).get("booking_id");

    const loading = document.getElementById("ticket-loading");
    const container = document.getElementById("ticket-container");

    try {

        const response = await window.RailwayAPI.getBookingById(bookingId);

        console.log("FULL API RESPONSE:", response);

        if (!response || !response.success) {
            if (loading) {
                loading.innerHTML = "<p>Unable to load ticket details.</p>";
            }
            return;
        }

        // Handle both possible API structures
        const b = response.data?.data || response.data;

        console.log("TICKET DATA:", b);

        if (!b) {
            if (loading) {
                loading.innerHTML = "<p>Ticket data not found.</p>";
            }
            return;
        }

        // Hide loading
        if (loading) {
            loading.style.display = "none";
        }

        // Show ticket
        if (container) {
            container.style.display = "block";
            container.style.visibility = "visible";
            container.style.opacity = "1";
        }

        function put(id, value) {
            const element = document.getElementById(id);

            if (element) {
                element.textContent =
                    value !== undefined && value !== null && value !== ""
                    ? value
                    : "-";
            }
        }

        // PNR
        put("ticket-pnr", b.booking_id);

        // Payment
        put("ticket-payment-status", b.payment_status || "SUCCESS");

        // Status
        put("ticket-status-badge", b.status || "CONFIRMED");

        // Source
        put("ticket-source-name", b.source_name);
        put("ticket-source-city", b.source_city);

        // Destination
        put("ticket-dest-name", b.dest_name);
        put("ticket-dest-city", b.dest_city);

        // Journey
        put("ticket-dep-time", b.departure_time);
        put("ticket-arr-time", b.arrival_time);
        put("ticket-journey-date", b.journey_date);

        // Train
        put("ticket-train-name", b.train_name);

        put(
            "ticket-train-id",
            (b.train_id || "-") + " | " + (b.train_type || "-")
        );

        // Passenger
        put("ticket-passenger-name", b.passenger_name);

        put(
            "ticket-passenger-meta",
            (b.passenger_gender || "-") +
            " | Age " +
            (b.passenger_age || "-") +
            " | " +
            (b.passenger_phone || "-")
        );

        // Seat
        put("ticket-coach", b.coach);
        put("ticket-seat-no", b.seat_no);
        put("ticket-class", b.class);

        // Fare
        const fare = b.fare || b.total_fare || 0;

        put(
            "ticket-fare",
            "₹" + Number(fare).toFixed(2)
        );

        console.log("TICKET DISPLAYED SUCCESSFULLY");

    } catch (error) {

        console.error("TICKET ERROR:", error);

        if (loading) {
            loading.innerHTML =
                "<p>Error loading ticket: " + error.message + "</p>";
        }
    }
});
