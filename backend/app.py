from flask import Flask, jsonify, request
from flask_cors import CORS
import mysql.connector
from datetime import datetime, date, time, timedelta
from decimal import Decimal
import uuid


# ============================================================
# FLASK APP
# ============================================================

app = Flask(__name__)

CORS(
    app,
    resources={
        r"/api/*": {
            "origins": "*"
        }
    },
    allow_headers=["Content-Type", "Authorization"],
    methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"]
)


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
# JSON SERIALIZATION HELPER
# ============================================================
# MySQL returns:
# DATE       -> datetime.date
# TIME       -> datetime.timedelta
# DECIMAL    -> Decimal
#
# Flask jsonify cannot directly serialize some of these.
# This function converts them into JSON-compatible values.
# ============================================================

def make_json_safe(value):

    if isinstance(value, dict):
        return {
            key: make_json_safe(val)
            for key, val in value.items()
        }

    if isinstance(value, list):
        return [
            make_json_safe(item)
            for item in value
        ]

    if isinstance(value, tuple):
        return [
            make_json_safe(item)
            for item in value
        ]

    if isinstance(value, Decimal):
        return float(value)

    if isinstance(value, datetime):
        return value.isoformat()

    if isinstance(value, date):
        return value.isoformat()

    if isinstance(value, time):
        return value.isoformat()

    if isinstance(value, timedelta):
        total_seconds = int(value.total_seconds())

        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60
        seconds = total_seconds % 60

        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    return value


def json_response(payload, status_code=200):
    return jsonify(make_json_safe(payload)), status_code


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

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                station_id,
                station_name,
                city,
                state
            FROM STATION
            ORDER BY station_name
        """)

        stations = cursor.fetchall()

        return json_response({
            "success": True,
            "data": stations
        })

    except Exception as e:

        return json_response({
            "success": False,
            "error": str(e)
        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


@app.route("/api/stations", methods=["POST"])
def add_station():

    data = request.get_json(silent=True) or {}

    station_id = data.get("station_id")
    station_name = data.get("station_name")
    city = data.get("city")
    state = data.get("state")

    if not station_id or not station_name:

        return json_response({
            "success": False,
            "error": "Station ID and station name are required"
        }, 400)

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO STATION
            (
                station_id,
                station_name,
                city,
                state
            )
            VALUES
            (%s, %s, %s, %s)
        """, (
            station_id,
            station_name,
            city,
            state
        ))

        conn.commit()

        return json_response({
            "success": True,
            "message": "Station added successfully",
            "station_id": station_id
        }, 201)

    except Exception as e:

        if conn:
            conn.rollback()

        return json_response({
            "success": False,
            "error": str(e)
        }, 400)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# TRAINS
# ============================================================

@app.route("/api/trains", methods=["GET"])
def get_trains():

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

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

        return json_response({
            "success": True,
            "data": trains
        })

    except Exception as e:

        return json_response({
            "success": False,
            "error": str(e)
        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


@app.route("/api/trains", methods=["POST"])
def add_train():

    data = request.get_json(silent=True) or {}

    train_id = data.get("train_id")
    train_name = data.get("train_name")
    train_type = data.get("train_type")
    total_seats = data.get("total_seats")

    if not train_id or not train_name or total_seats is None:

        return json_response({
            "success": False,
            "error": "Train ID, train name and total seats are required"
        }, 400)

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO TRAIN
            (
                train_id,
                train_name,
                train_type,
                total_seats
            )
            VALUES
            (%s, %s, %s, %s)
        """, (
            train_id,
            train_name,
            train_type,
            total_seats
        ))

        conn.commit()

        return json_response({
            "success": True,
            "message": "Train added successfully",
            "train_id": train_id
        }, 201)

    except Exception as e:

        if conn:
            conn.rollback()

        return json_response({
            "success": False,
            "error": str(e)
        }, 400)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# SCHEDULES
# ============================================================

@app.route("/api/schedules", methods=["GET"])
def get_schedules():

    source = request.args.get("source")
    destination = request.args.get("destination")

    # Support BOTH:
    # /api/schedules?date=2026-10-10
    # /api/schedules?journey_date=2026-10-10

    journey_date = (
        request.args.get("journey_date")
        or request.args.get("date")
    )

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

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

        # ----------------------------------------------------
        # SOURCE FILTER
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # DESTINATION FILTER
        # ----------------------------------------------------

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

        # ----------------------------------------------------
        # DATE FILTER
        # ----------------------------------------------------

        if journey_date:

            query += """
                AND s.journey_date = %s
            """

            params.append(journey_date)

        # ----------------------------------------------------
        # SORT
        # ----------------------------------------------------

        query += """
            ORDER BY
                s.journey_date,
                s.departure_time
        """

        cursor.execute(query, params)

        schedules = cursor.fetchall()

        # ----------------------------------------------------
        # IMPORTANT:
        # Convert MySQL DATE/TIME/DECIMAL values.
        # This fixes:
        # Object of type timedelta is not JSON serializable
        # ----------------------------------------------------

        schedules = make_json_safe(schedules)

        return jsonify({
            "success": True,
            "data": schedules
        })

    except Exception as e:

        print("SCHEDULE ERROR:", str(e))

        return json_response({
            "success": False,
            "error": str(e)
        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# GET SINGLE SCHEDULE
# ============================================================

@app.route("/api/schedules/<schedule_id>", methods=["GET"])
def get_schedule(schedule_id):

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                s.schedule_id,
                s.train_id,
                s.source_station_id,
                s.dest_station_id,
                s.journey_date,
                s.departure_time,
                s.arrival_time,
                s.base_fare,

                t.train_name,
                t.train_type,
                t.total_seats,

                ss.station_name AS source_station,
                ss.city AS source_city,

                ds.station_name AS destination_station,
                ds.city AS destination_city

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

            return json_response({
                "success": False,
                "error": "Schedule not found"
            }, 404)

        schedule = make_json_safe(schedule)

        return jsonify({
            "success": True,
            "data": schedule
        })

    except Exception as e:

        return json_response({
            "success": False,
            "error": str(e)
        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# PASSENGERS - GET ALL
# ============================================================

@app.route("/api/passengers", methods=["GET"])
def get_passengers():

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

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

        return json_response({
            "success": True,
            "data": passengers
        })

    except Exception as e:

        return json_response({
            "success": False,
            "error": str(e)
        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# GET SINGLE PASSENGER
# ============================================================

@app.route("/api/passengers/<passenger_id>", methods=["GET"])
def get_passenger(passenger_id):

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

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

            return json_response({
                "success": False,
                "error": "Passenger not found"
            }, 404)

        return json_response({
            "success": True,
            "data": passenger
        })

    except Exception as e:

        return json_response({
            "success": False,
            "error": str(e)
        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# ADD PASSENGER
# ============================================================

@app.route("/api/passengers", methods=["POST"])
def add_passenger():

    data = request.get_json(silent=True) or {}

    print("PASSENGER REQUEST:", data)

    passenger_id = data.get("passenger_id")
    name = data.get("name")
    age = data.get("age")
    gender = data.get("gender")
    phone = data.get("phone")
    email = data.get("email")

    if not passenger_id:
        passenger_id = "P" + uuid.uuid4().hex[:8].upper()

    if not name or age is None or not gender:

        return json_response({
            "success": False,
            "error": "Name, age and gender are required"
        }, 400)

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

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor()

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

        return json_response({
            "success": True,
            "message": "Passenger registered successfully",
            "passenger_id": passenger_id
        }, 201)

    except Exception as e:

        if conn:
            conn.rollback()

        return json_response({
            "success": False,
            "error": str(e)
        }, 400)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# UPDATE PASSENGER
# ============================================================

@app.route("/api/passengers/<passenger_id>", methods=["PUT"])
def update_passenger(passenger_id):

    data = request.get_json(silent=True) or {}

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor()

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

            return json_response({
                "success": False,
                "error": "Passenger not found"
            }, 404)

        return json_response({
            "success": True,
            "message": "Passenger updated successfully"
        })

    except Exception as e:

        if conn:
            conn.rollback()

        return json_response({
            "success": False,
            "error": str(e)
        }, 400)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# DELETE PASSENGER
# ============================================================

@app.route("/api/passengers/<passenger_id>", methods=["DELETE"])
def delete_passenger(passenger_id):

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            DELETE FROM PASSENGER
            WHERE passenger_id = %s
        """, (passenger_id,))

        conn.commit()

        if cursor.rowcount == 0:

            return json_response({
                "success": False,
                "error": "Passenger not found"
            }, 404)

        return json_response({
            "success": True,
            "message": "Passenger deleted successfully"
        })

    except Exception as e:

        if conn:
            conn.rollback()

        return json_response({
            "success": False,
            "error": str(e)
        }, 400)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# BOOKINGS - GET ALL
# ============================================================

@app.route("/api/bookings", methods=["GET"])
def get_bookings():

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

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

        return json_response({
            "success": True,
            "data": bookings
        })

    except Exception as e:

        return json_response({
            "success": False,
            "error": str(e)
        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# GET SINGLE BOOKING
# ============================================================

@app.route("/api/bookings/<booking_id>", methods=["GET"])
def get_booking(booking_id):

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

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

            return json_response({
                "success": False,
                "error": "Booking not found"
            }, 404)

        return json_response({
            "success": True,
            "data": booking
        })

    except Exception as e:

        return json_response({
            "success": False,
            "error": str(e)
        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
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

    passenger_id = data.get("passenger_id")
    schedule_id = data.get("schedule_id")
    total_fare = data.get("total_fare")

    # --------------------------------------------------------
    # VALIDATION
    # --------------------------------------------------------

    if not passenger_id:

        return json_response({
            "success": False,
            "error": "Passenger ID is required",
            "message": "Passenger ID is required"
        }, 400)

    if not schedule_id:

        return json_response({
            "success": False,
            "error": "Schedule ID is required",
            "message": "Schedule ID is required"
        }, 400)

    if total_fare is None:

        return json_response({
            "success": False,
            "error": "Total fare is required",
            "message": "Total fare is required"
        }, 400)

    try:

        total_fare = float(total_fare)

        if total_fare < 0:
            raise ValueError

    except (ValueError, TypeError):

        return json_response({
            "success": False,
            "error": "Invalid total fare"
        }, 400)

    conn = None
    cursor = None

    try:

        conn = get_db()

        # Transaction cursor
        cursor = conn.cursor(dictionary=True)

        # ----------------------------------------------------
        # CHECK PASSENGER
        # ----------------------------------------------------

        cursor.execute("""
            SELECT
                passenger_id
            FROM PASSENGER
            WHERE passenger_id = %s
        """, (passenger_id,))

        passenger = cursor.fetchone()

        if not passenger:

            return json_response({
                "success": False,
                "error": "Passenger not found"
            }, 404)

        # ----------------------------------------------------
        # CHECK SCHEDULE
        # ----------------------------------------------------

        cursor.execute("""
            SELECT
                s.schedule_id,
                s.train_id,
                s.journey_date,
                t.total_seats

            FROM SCHEDULE s

            JOIN TRAIN t
                ON s.train_id = t.train_id

            WHERE s.schedule_id = %s

        """, (schedule_id,))

        schedule = cursor.fetchone()

        if not schedule:

            return json_response({
                "success": False,
                "error": "Schedule not found"
            }, 404)

        # ----------------------------------------------------
        # GENERATE BOOKING ID
        # ----------------------------------------------------

        booking_id = (
            "BK"
            + datetime.now().strftime("%y%m%d%H%M%S")
            + uuid.uuid4().hex[:4].upper()
        )

        # ----------------------------------------------------
        # GENERATE TICKET ID
        # ----------------------------------------------------

        ticket_id = "TK" + uuid.uuid4().hex[:8].upper()

        # ----------------------------------------------------
        # TICKET DETAILS
        # ----------------------------------------------------

        coach = data.get("coach") or "B1"
        ticket_class = data.get("class") or "3A"

        requested_seat = data.get("seat_no")

        # ----------------------------------------------------
        # SEAT ALLOCATION
        # ----------------------------------------------------

        if requested_seat:

            seat_no = str(requested_seat)

            cursor.execute("""
                SELECT
                    ticket_id

                FROM TICKET

                WHERE schedule_id = %s
                AND coach = %s
                AND seat_no = %s

                FOR UPDATE

            """, (
                schedule_id,
                coach,
                seat_no
            ))

            existing_seat = cursor.fetchone()

            if existing_seat:

                return json_response({
                    "success": False,
                    "error": "Selected seat is already booked"
                }, 409)

        else:

            seat_no = None

            total_seats = int(schedule["total_seats"])

            # ------------------------------------------------
            # Find first free seat
            # ------------------------------------------------

            for number in range(1, total_seats + 1):

                cursor.execute("""
                    SELECT
                        ticket_id

                    FROM TICKET

                    WHERE schedule_id = %s
                    AND coach = %s
                    AND seat_no = %s

                    FOR UPDATE

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

                return json_response({
                    "success": False,
                    "error": "No seats available for this train"
                }, 409)

        # ----------------------------------------------------
        # INSERT BOOKING
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
            total_fare,
            "CONFIRMED"
        ))

        # ----------------------------------------------------
        # INSERT TICKET
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
            total_fare
        ))

        # ----------------------------------------------------
        # COMMIT
        # ----------------------------------------------------

        conn.commit()

        print("========================================")
        print("BOOKING CREATED:", booking_id)
        print("TICKET CREATED:", ticket_id)
        print("COACH:", coach)
        print("SEAT:", seat_no)
        print("========================================")

        return json_response({

            "success": True,

            "message": "Booking created successfully",

            "booking_id": booking_id,

            "ticket_id": ticket_id,

            "data": {

                "booking_id": booking_id,

                "ticket_id": ticket_id,

                "passenger_id": passenger_id,

                "schedule_id": schedule_id,

                "total_fare": total_fare,

                "coach": coach,

                "seat_no": seat_no,

                "class": ticket_class,

                "status": "CONFIRMED"

            }

        }, 201)

    except mysql.connector.Error as e:

        if conn:
            conn.rollback()

        print("MYSQL BOOKING ERROR:", str(e))

        return json_response({

            "success": False,

            "error": str(e),

            "message": str(e)

        }, 400)

    except Exception as e:

        if conn:
            conn.rollback()

        print("BOOKING ERROR:", str(e))

        return json_response({

            "success": False,

            "error": str(e),

            "message": str(e)

        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# CANCEL BOOKING
# ============================================================

@app.route(
    "/api/bookings/<booking_id>/cancel",
    methods=["PUT", "POST"]
)
def cancel_booking(booking_id):

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE BOOKING

            SET status = 'CANCELLED'

            WHERE booking_id = %s

        """, (booking_id,))

        conn.commit()

        if cursor.rowcount == 0:

            return json_response({
                "success": False,
                "error": "Booking not found"
            }, 404)

        return json_response({
            "success": True,
            "message": "Booking cancelled successfully"
        })

    except Exception as e:

        if conn:
            conn.rollback()

        return json_response({
            "success": False,
            "error": str(e)
        }, 400)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# PAYMENTS - GET ALL
# ============================================================

@app.route("/api/payments", methods=["GET"])
def get_payments():

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

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

        return json_response({
            "success": True,
            "data": payments
        })

    except Exception as e:

        return json_response({
            "success": False,
            "error": str(e)
        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# CREATE DEMO PAYMENT
# ============================================================

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

        return json_response({
            "success": False,
            "error": "Booking ID and amount are required"
        }, 400)

    try:

        amount = float(amount)

        if amount < 0:
            raise ValueError

    except (ValueError, TypeError):

        return json_response({
            "success": False,
            "error": "Invalid payment amount"
        }, 400)

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor()

        # ----------------------------------------------------
        # CHECK BOOKING
        # ----------------------------------------------------

        cursor.execute("""
            SELECT
                booking_id

            FROM BOOKING

            WHERE booking_id = %s

        """, (booking_id,))

        booking = cursor.fetchone()

        if not booking:

            return json_response({
                "success": False,
                "error": "Booking not found"
            }, 404)

        # ----------------------------------------------------
        # GENERATE PAYMENT ID
        # ----------------------------------------------------

        payment_id = (
            "PAY"
            + uuid.uuid4().hex[:9].upper()
        )

        # ----------------------------------------------------
        # INSERT DEMO PAYMENT
        # ----------------------------------------------------

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
            amount,
            mode,
            "SUCCESS"
        ))

        conn.commit()

        return json_response({

            "success": True,

            "message": "Payment successful",

            "payment_id": payment_id,

            "booking_id": booking_id,

            "amount": amount,

            "status": "SUCCESS"

        }, 201)

    except Exception as e:

        if conn:
            conn.rollback()

        return json_response({
            "success": False,
            "error": str(e)
        }, 400)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# DASHBOARD
# ============================================================

@app.route("/api/dashboard", methods=["GET"])
def dashboard():

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # ----------------------------------------------------
        # PASSENGERS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM PASSENGER
        """)

        passengers = cursor.fetchone()["count"]

        # ----------------------------------------------------
        # TRAINS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM TRAIN
        """)

        trains = cursor.fetchone()["count"]

        # ----------------------------------------------------
        # STATIONS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM STATION
        """)

        stations = cursor.fetchone()["count"]

        # ----------------------------------------------------
        # BOOKINGS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS count
            FROM BOOKING
        """)

        bookings = cursor.fetchone()["count"]

        # ----------------------------------------------------
        # CONFIRMED BOOKINGS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS count

            FROM BOOKING

            WHERE status = 'CONFIRMED'

        """)

        confirmed = cursor.fetchone()["count"]

        # ----------------------------------------------------
        # CANCELLED BOOKINGS
        # ----------------------------------------------------

        cursor.execute("""
            SELECT COUNT(*) AS count

            FROM BOOKING

            WHERE status = 'CANCELLED'

        """)

        cancelled = cursor.fetchone()["count"]

        # ----------------------------------------------------
        # REVENUE
        # ----------------------------------------------------

        cursor.execute("""
            SELECT
                COALESCE(SUM(amount), 0) AS total

            FROM PAYMENT

            WHERE status = 'SUCCESS'

        """)

        revenue = cursor.fetchone()["total"]

        return json_response({

            "success": True,

            "data": {

                "passengers": passengers,

                "trains": trains,

                "stations": stations,

                "bookings": bookings,

                "confirmed_bookings": confirmed,

                "cancelled_bookings": cancelled,

                "revenue": float(revenue or 0)

            }

        })

    except Exception as e:

        return json_response({
            "success": False,
            "error": str(e)
        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# ============================================================
# HEALTH CHECK
# ============================================================

@app.route("/api/health", methods=["GET"])
def health():

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("SELECT 1")

        cursor.fetchone()

        return jsonify({
            "success": True,
            "message": "Backend and MySQL are connected"
        })

    except Exception as e:

        return json_response({
            "success": False,
            "message": "Database connection failed",
            "error": str(e)
        }, 500)

    finally:

        if cursor:
            cursor.close()

        if conn:
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
    print("====================================")
    print("Database : railway_reservation")
    print("Server   : http://127.0.0.1:5000")
    print("====================================")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )