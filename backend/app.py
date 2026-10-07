from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from datetime import datetime
import uuid

app = Flask(__name__)
CORS(app)

# ============================================================
# MYSQL DATABASE CONNECTION
# ============================================================

DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "0102",
    "database": "railway_reservation"
}


def get_db():
    return mysql.connector.connect(**DB_CONFIG)


# ============================================================
# HOME
# ============================================================

@app.route("/")
def home():
    return jsonify({
        "success": True,
        "message": "Railway Reservation API is running"
    })


# ============================================================
# STATIONS
# ============================================================

@app.route("/api/stations", methods=["GET"])
def get_stations():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT station_id, station_name, city, state
            FROM STATION
            ORDER BY station_name
        """)

        stations = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": stations
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/stations", methods=["POST"])
def add_station():
    data = request.get_json() or {}

    station_id = data.get("station_id")
    station_name = data.get("station_name")
    city = data.get("city")
    state = data.get("state")

    if not station_id or not station_name:
        return jsonify({
            "success": False,
            "error": "Station ID and station name are required"
        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO STATION
            (station_id, station_name, city, state)
            VALUES (%s, %s, %s, %s)
        """, (
            station_id,
            station_name,
            city,
            state
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Station added successfully",
            "station_id": station_id
        }), 201

    except Exception as e:
        conn.rollback()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    finally:
        cursor.close()
        conn.close()


# ============================================================
# TRAINS
# ============================================================

@app.route("/api/trains", methods=["GET"])
def get_trains():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:
        cursor.execute("""
            SELECT
                train_id,
                train_name,
                train_type,
                total_seats
            FROM TRAIN
            ORDER BY train_id
        """)

        trains = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": trains
        })

    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:
        cursor.close()
        conn.close()


@app.route("/api/trains", methods=["POST"])
def add_train():
    data = request.get_json() or {}

    train_id = data.get("train_id")
    train_name = data.get("train_name")
    train_type = data.get("train_type")
    total_seats = data.get("total_seats")

    if not train_id or not train_name or not total_seats:
        return jsonify({
            "success": False,
            "error": "Train ID, train name and total seats are required"
        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:
        cursor.execute("""
            INSERT INTO TRAIN
            (train_id, train_name, train_type, total_seats)
            VALUES (%s, %s, %s, %s)
        """, (
            train_id,
            train_name,
            train_type,
            total_seats
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Train added successfully",
            "train_id": train_id
        }), 201

    except Exception as e:
        conn.rollback()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    finally:
        cursor.close()
        conn.close()


# ============================================================
# SCHEDULES
# ============================================================

@app.route("/api/schedules", methods=["GET"])
def get_schedules():

    source = request.args.get("source")
    destination = request.args.get("destination")
    journey_date = request.args.get("date")

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:

        query = """
            SELECT
                s.schedule_id,
                s.train_id,
                t.train_name,
                t.train_type,
                s.source_station_id,
                ss.station_name AS source_station,
                s.dest_station_id,
                ds.station_name AS destination_station,
                s.journey_date,
                s.departure_time,
                s.arrival_time,
                s.base_fare,
                t.total_seats
            FROM SCHEDULE s
            JOIN TRAIN t
                ON s.train_id = t.train_id
            JOIN STATION ss
                ON s.source_station_id = ss.station_id
            JOIN STATION ds
                ON s.dest_station_id = ds.station_id
            WHERE 1 = 1
        """

        params = []

        if source:
            query += """
                AND (
                    s.source_station_id = %s
                    OR LOWER(ss.station_name) LIKE LOWER(%s)
                    OR LOWER(ss.city) LIKE LOWER(%s)
                )
            """

            params.extend([
                source,
                f"%{source}%",
                f"%{source}%"
            ])

        if destination:
            query += """
                AND (
                    s.dest_station_id = %s
                    OR LOWER(ds.station_name) LIKE LOWER(%s)
                    OR LOWER(ds.city) LIKE LOWER(%s)
                )
            """

            params.extend([
                destination,
                f"%{destination}%",
                f"%{destination}%"
            ])

        if journey_date:
            query += """
                AND s.journey_date = %s
            """

            params.append(journey_date)

        query += """
            ORDER BY s.journey_date, s.departure_time
        """

        cursor.execute(query, params)

        schedules = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": schedules
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


@app.route("/api/schedules/<schedule_id>", methods=["GET"])
def get_schedule(schedule_id):

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                s.*,
                t.train_name,
                t.train_type,
                t.total_seats,
                ss.station_name AS source_station,
                ds.station_name AS destination_station
            FROM SCHEDULE s
            JOIN TRAIN t
                ON s.train_id = t.train_id
            JOIN STATION ss
                ON s.source_station_id = ss.station_id
            JOIN STATION ds
                ON s.dest_station_id = ds.station_id
            WHERE s.schedule_id = %s
        """, (schedule_id,))

        schedule = cursor.fetchone()

        if not schedule:
            return jsonify({
                "success": False,
                "error": "Schedule not found"
            }), 404

        return jsonify({
            "success": True,
            "data": schedule
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# ============================================================
# PASSENGERS
# ============================================================

@app.route("/api/passengers", methods=["GET"])
def get_passengers():

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                passenger_id,
                name,
                age,
                gender,
                phone,
                email
            FROM PASSENGER
            ORDER BY passenger_id
        """)

        passengers = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": passengers
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


@app.route("/api/passengers/<passenger_id>", methods=["GET"])
def get_passenger(passenger_id):

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                passenger_id,
                name,
                age,
                gender,
                phone,
                email
            FROM PASSENGER
            WHERE passenger_id = %s
        """, (passenger_id,))

        passenger = cursor.fetchone()

        if not passenger:
            return jsonify({
                "success": False,
                "error": "Passenger not found"
            }), 404

        return jsonify({
            "success": True,
            "data": passenger
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


@app.route("/api/passengers", methods=["POST"])
def add_passenger():

    data = request.get_json() or {}

    print("PASSENGER REQUEST:", data)

    passenger_id = data.get("passenger_id")
    name = data.get("name")
    age = data.get("age")
    gender = data.get("gender")
    phone = data.get("phone")
    email = data.get("email")

    if not passenger_id:
        passenger_id = "P" + uuid.uuid4().hex[:8].upper()

    if not name or not age or not gender:
        return jsonify({
            "success": False,
            "error": "Name, age and gender are required"
        }), 400

    gender_map = {
        "male": "M",
        "female": "F",
        "other": "O",
        "m": "M",
        "f": "F",
        "o": "O"
    }

    gender = gender_map.get(
        str(gender).lower(),
        str(gender)[:1].upper()
    )

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            INSERT INTO PASSENGER
            (
                passenger_id,
                name,
                age,
                gender,
                phone,
                email
            )
            VALUES
            (%s, %s, %s, %s, %s, %s)
        """, (
            passenger_id,
            name,
            age,
            gender,
            phone,
            email
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Passenger registered successfully",
            "passenger_id": passenger_id
        }), 201

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        conn.close()


@app.route("/api/passengers/<passenger_id>", methods=["PUT"])
def update_passenger(passenger_id):

    data = request.get_json() or {}

    conn = get_db()
    cursor = conn.cursor()

    try:

        gender = data.get("gender", "")

        gender_map = {
            "male": "M",
            "female": "F",
            "other": "O",
            "m": "M",
            "f": "F",
            "o": "O"
        }

        gender = gender_map.get(
            str(gender).lower(),
            str(gender)[:1].upper()
        )

        cursor.execute("""
            UPDATE PASSENGER
            SET
                name = %s,
                age = %s,
                gender = %s,
                phone = %s,
                email = %s
            WHERE passenger_id = %s
        """, (
            data.get("name"),
            data.get("age"),
            gender,
            data.get("phone"),
            data.get("email"),
            passenger_id
        ))

        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "error": "Passenger not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "Passenger updated successfully"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        conn.close()


@app.route("/api/passengers/<passenger_id>", methods=["DELETE"])
def delete_passenger(passenger_id):

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            DELETE FROM PASSENGER
            WHERE passenger_id = %s
        """, (passenger_id,))

        conn.commit()

        if cursor.rowcount == 0:
            return jsonify({
                "success": False,
                "error": "Passenger not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "Passenger deleted successfully"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        conn.close()


# ============================================================
# BOOKINGS - GET ALL
# ============================================================

@app.route("/api/bookings", methods=["GET"])
def get_bookings():

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                b.booking_id,
                b.passenger_id,
                p.name AS passenger_name,
                b.schedule_id,
                t.train_name,
                b.booking_date,
                b.total_fare,
                b.status
            FROM BOOKING b
            JOIN PASSENGER p
                ON b.passenger_id = p.passenger_id
            JOIN SCHEDULE s
                ON b.schedule_id = s.schedule_id
            JOIN TRAIN t
                ON s.train_id = t.train_id
            ORDER BY b.booking_date DESC
        """)

        bookings = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": bookings
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# ============================================================
# GET SINGLE BOOKING
# ============================================================

@app.route("/api/bookings/<booking_id>", methods=["GET"])
def get_booking(booking_id):

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                b.booking_id,
                b.passenger_id,
                p.name AS passenger_name,
                p.phone,
                p.email,
                b.schedule_id,
                t.train_id,
                t.train_name,
                ss.station_name AS source_station,
                ds.station_name AS destination_station,
                s.journey_date,
                s.departure_time,
                s.arrival_time,
                b.booking_date,
                b.total_fare,
                b.status,
                tk.ticket_id,
                tk.coach,
                tk.seat_no,
                tk.`class`,
                tk.fare
            FROM BOOKING b
            JOIN PASSENGER p
                ON b.passenger_id = p.passenger_id
            JOIN SCHEDULE s
                ON b.schedule_id = s.schedule_id
            JOIN TRAIN t
                ON s.train_id = t.train_id
            JOIN STATION ss
                ON s.source_station_id = ss.station_id
            JOIN STATION ds
                ON s.dest_station_id = ds.station_id
            LEFT JOIN TICKET tk
                ON b.booking_id = tk.booking_id
            WHERE b.booking_id = %s
        """, (booking_id,))

        booking = cursor.fetchone()

        if not booking:
            return jsonify({
                "success": False,
                "error": "Booking not found"
            }), 404

        return jsonify({
            "success": True,
            "data": booking
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# ============================================================
# CREATE BOOKING
# ============================================================

@app.route("/api/bookings", methods=["POST"])
def create_booking():

    data = request.get_json(silent=True) or {}

    print("========================================")
    print("BOOKING REQUEST DATA:", data)
    print("========================================")

    # --------------------------------------------------------
    # Get data from frontend
    # --------------------------------------------------------

    passenger_id = data.get("passenger_id")
    schedule_id = data.get("schedule_id")
    total_fare = data.get("total_fare")

    # booking_id is intentionally NOT required.
    # Backend generates it automatically.

    if not passenger_id:

        return jsonify({
            "success": False,
            "error": "Passenger ID is required",
            "message": "Passenger ID is required"
        }), 400

    if not schedule_id:

        return jsonify({
            "success": False,
            "error": "Schedule ID is required",
            "message": "Schedule ID is required"
        }), 400

    if total_fare is None:

        return jsonify({
            "success": False,
            "error": "Total fare is required",
            "message": "Total fare is required"
        }), 400

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # ----------------------------------------------------
        # Check passenger
        # ----------------------------------------------------

        cursor.execute("""
            SELECT passenger_id
            FROM PASSENGER
            WHERE passenger_id = %s
        """, (passenger_id,))

        passenger = cursor.fetchone()

        if not passenger:

            return jsonify({
                "success": False,
                "error": "Passenger not found"
            }), 404

        # ----------------------------------------------------
        # Check schedule
        # ----------------------------------------------------

        cursor.execute("""
            SELECT
                s.schedule_id,
                s.train_id,
                t.total_seats
            FROM SCHEDULE s
            JOIN TRAIN t
                ON s.train_id = t.train_id
            WHERE s.schedule_id = %s
        """, (schedule_id,))

        schedule = cursor.fetchone()

        if not schedule:

            return jsonify({
                "success": False,
                "error": "Schedule not found"
            }), 404

        # ----------------------------------------------------
        # Generate booking ID
        # ----------------------------------------------------

        booking_id = (
            "BK" +
            datetime.now().strftime("%y%m%d%H%M%S") +
            uuid.uuid4().hex[:4].upper()
        )

        # ----------------------------------------------------
        # Generate ticket ID
        # ----------------------------------------------------

        ticket_id = "TK" + uuid.uuid4().hex[:8].upper()

        # ----------------------------------------------------
        # Ticket details
        # ----------------------------------------------------

        coach = data.get("coach") or "B1"
        ticket_class = data.get("class") or "3A"
        requested_seat = data.get("seat_no")

        # ----------------------------------------------------
        # Seat allocation
        # ----------------------------------------------------

        if requested_seat:

            seat_no = str(requested_seat)

            cursor.execute("""
                SELECT ticket_id
                FROM TICKET
                WHERE schedule_id = %s
                AND coach = %s
                AND seat_no = %s
            """, (
                schedule_id,
                coach,
                seat_no
            ))

            existing_seat = cursor.fetchone()

            if existing_seat:

                return jsonify({
                    "success": False,
                    "error": "Selected seat is already booked"
                }), 409

        else:

            seat_no = None

            total_seats = int(schedule["total_seats"])

            for number in range(1, total_seats + 1):

                cursor.execute("""
                    SELECT ticket_id
                    FROM TICKET
                    WHERE schedule_id = %s
                    AND coach = %s
                    AND seat_no = %s
                """, (
                    schedule_id,
                    coach,
                    str(number)
                ))

                existing_seat = cursor.fetchone()

                if not existing_seat:

                    seat_no = str(number)
                    break

            if seat_no is None:

                return jsonify({
                    "success": False,
                    "error": "No seats available for this train"
                }), 409

        # ----------------------------------------------------
        # Insert booking
        # ----------------------------------------------------

        cursor.execute("""
            INSERT INTO BOOKING
            (
                booking_id,
                passenger_id,
                schedule_id,
                booking_date,
                total_fare,
                status
            )
            VALUES
            (%s, %s, %s, %s, %s, %s)
        """, (
            booking_id,
            passenger_id,
            schedule_id,
            datetime.now().date(),
            float(total_fare),
            "CONFIRMED"
        ))

        # ----------------------------------------------------
        # Insert ticket
        # ----------------------------------------------------

        cursor.execute("""
            INSERT INTO TICKET
            (
                ticket_id,
                booking_id,
                schedule_id,
                coach,
                seat_no,
                `class`,
                fare
            )
            VALUES
            (%s, %s, %s, %s, %s, %s, %s)
        """, (
            ticket_id,
            booking_id,
            schedule_id,
            coach,
            seat_no,
            ticket_class,
            float(total_fare)
        ))

        # ----------------------------------------------------
        # Commit both records
        # ----------------------------------------------------

        conn.commit()

        print("========================================")
        print("BOOKING CREATED:", booking_id)
        print("TICKET CREATED:", ticket_id)
        print("COACH:", coach)
        print("SEAT:", seat_no)
        print("========================================")

        return jsonify({

            "success": True,

            "message": "Booking created successfully",

            "booking_id": booking_id,

            "ticket_id": ticket_id,

            "data": {

                "booking_id": booking_id,

                "ticket_id": ticket_id,

                "passenger_id": passenger_id,

                "schedule_id": schedule_id,

                "total_fare": float(total_fare),

                "coach": coach,

                "seat_no": seat_no,

                "class": ticket_class,

                "status": "CONFIRMED"
            }

        }), 201

    except mysql.connector.Error as e:

        if conn:
            conn.rollback()

        print("MYSQL BOOKING ERROR:", str(e))

        return jsonify({
            "success": False,
            "error": str(e),
            "message": str(e)
        }), 400

    except Exception as e:

        if conn:
            conn.rollback()

        print("BOOKING ERROR:", str(e))

        return jsonify({
            "success": False,
            "error": str(e),
            "message": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# CANCEL BOOKING
# ============================================================

@app.route("/api/bookings/<booking_id>/cancel", methods=["PUT", "POST"])
def cancel_booking(booking_id):

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            UPDATE BOOKING
            SET status = 'CANCELLED'
            WHERE booking_id = %s
        """, (booking_id,))

        conn.commit()

        if cursor.rowcount == 0:

            return jsonify({
                "success": False,
                "error": "Booking not found"
            }), 404

        return jsonify({
            "success": True,
            "message": "Booking cancelled successfully"
        })

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        conn.close()


# ============================================================
# PAYMENTS
# ============================================================

@app.route("/api/payments", methods=["GET"])
def get_payments():

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT
                payment_id,
                booking_id,
                amount,
                mode,
                status
            FROM PAYMENT
            ORDER BY payment_id
        """)

        payments = cursor.fetchall()

        return jsonify({
            "success": True,
            "data": payments
        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


@app.route("/api/payments", methods=["POST"])
def create_payment():

    data = request.get_json(silent=True) or {}

    booking_id = data.get("booking_id")
    amount = data.get("amount")
    mode = (
        data.get("mode")
        or data.get("payment_mode")
        or "UPI"
    )

    if not booking_id or amount is None:

        return jsonify({
            "success": False,
            "error": "Booking ID and amount are required"
        }), 400

    conn = get_db()
    cursor = conn.cursor()

    try:

        cursor.execute("""
            SELECT booking_id
            FROM BOOKING
            WHERE booking_id = %s
        """, (booking_id,))

        booking = cursor.fetchone()

        if not booking:

            return jsonify({
                "success": False,
                "error": "Booking not found"
            }), 404

        payment_id = "PAY" + uuid.uuid4().hex[:9].upper()

        cursor.execute("""
            INSERT INTO PAYMENT
            (
                payment_id,
                booking_id,
                amount,
                mode,
                status
            )
            VALUES
            (%s, %s, %s, %s, %s)
        """, (
            payment_id,
            booking_id,
            float(amount),
            mode,
            "SUCCESS"
        ))

        conn.commit()

        return jsonify({
            "success": True,
            "message": "Payment successful",
            "payment_id": payment_id,
            "booking_id": booking_id,
            "amount": float(amount),
            "status": "SUCCESS"
        }), 201

    except Exception as e:

        conn.rollback()

        return jsonify({
            "success": False,
            "error": str(e)
        }), 400

    finally:

        cursor.close()
        conn.close()


# ============================================================
# DASHBOARD
# ============================================================

@app.route("/api/dashboard", methods=["GET"])
def dashboard():

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    try:

        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM PASSENGER
        """)

        passengers = cursor.fetchone()["count"]

        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM TRAIN
        """)

        trains = cursor.fetchone()["count"]

        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM STATION
        """)

        stations = cursor.fetchone()["count"]

        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM BOOKING
        """)

        bookings = cursor.fetchone()["count"]

        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM BOOKING
            WHERE status = 'CONFIRMED'
        """)

        confirmed = cursor.fetchone()["count"]

        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM BOOKING
            WHERE status = 'CANCELLED'
        """)

        cancelled = cursor.fetchone()["count"]

        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0) AS total
            FROM PAYMENT
            WHERE status = 'SUCCESS'
        """)

        revenue = cursor.fetchone()["total"]

        return jsonify({

            "success": True,

            "data": {

                "passengers": passengers,

                "trains": trains,

                "stations": stations,

                "bookings": bookings,

                "confirmed_bookings": confirmed,

                "cancelled_bookings": cancelled,

                "revenue": float(revenue)
            }

        })

    except Exception as e:

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        cursor.close()
        conn.close()


# ============================================================
# ERROR HANDLERS
# ============================================================

@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "success": False,
        "error": "API endpoint not found"
    }), 404


@app.errorhandler(Exception)
def handle_exception(error):

    print("SERVER ERROR:", str(error))

    return jsonify({
        "success": False,
        "error": str(error)
    }), 500


# ============================================================
# RUN SERVER
# ============================================================

if __name__ == "__main__":

    print("====================================")
    print("Railway Reservation Backend")
    print("Running on http://127.0.0.1:5000")
    print("====================================")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )