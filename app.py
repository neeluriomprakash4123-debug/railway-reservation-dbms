from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from datetime import date
import uuid

app = Flask(__name__)
CORS(app)

# =========================
# MYSQL CONFIGURATION
# =========================
DB_CONFIG = {
    "host": "localhost",
    "user": "root",
    "password": "0102",
    "database": "railway_reservation"
}


def get_db():
    return mysql.connector.connect(**DB_CONFIG)


# =========================
# HOME
# =========================
@app.route("/")
def home():
    return "Railway Reservation Backend is Running!"


# =========================
# STATIONS
# =========================
@app.route("/api/stations", methods=["GET"])
def get_stations():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT station_id, station_name, city, state
        FROM STATION
        ORDER BY station_name
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)


# =========================
# TRAINS
# =========================
@app.route("/api/trains", methods=["GET"])
def get_trains():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT train_id, train_name, train_type, total_seats
        FROM TRAIN
        ORDER BY train_id
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)


# =========================
# SCHEDULES / TRAIN SEARCH
# =========================
@app.route("/api/schedules", methods=["GET"])
def get_schedules():

    source = request.args.get("source")
    destination = request.args.get("destination")
    journey_date = request.args.get("journey_date")

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
            ds.station_name AS destination,
            s.journey_date,
            s.departure_time,
            s.arrival_time,
            s.base_fare
        FROM SCHEDULE s
        JOIN TRAIN t
            ON s.train_id = t.train_id
        JOIN STATION ss
            ON s.source_station_id = ss.station_id
        JOIN STATION ds
            ON s.dest_station_id = ds.station_id
        WHERE 1=1
    """

    params = []

    if source:
        query += " AND s.source_station_id = %s"
        params.append(source)

    if destination:
        query += " AND s.dest_station_id = %s"
        params.append(destination)

    if journey_date:
        query += " AND s.journey_date = %s"
        params.append(journey_date)

    query += """
        ORDER BY s.journey_date, s.departure_time
    """

    cursor.execute(query, params)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    for row in data:

        if row.get("journey_date"):
            row["journey_date"] = str(row["journey_date"])

        if row.get("departure_time"):
            row["departure_time"] = str(row["departure_time"])

        if row.get("arrival_time"):
            row["arrival_time"] = str(row["arrival_time"])

        if row.get("base_fare") is not None:
            row["base_fare"] = float(row["base_fare"])

    return jsonify(data)


# =========================
# SINGLE SCHEDULE
# =========================
@app.route("/api/schedules/<schedule_id>", methods=["GET"])
def get_schedule(schedule_id):

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            s.schedule_id,
            s.train_id,
            t.train_name,
            t.train_type,
            s.source_station_id,
            ss.station_name AS source_station,
            s.dest_station_id,
            ds.station_name AS destination,
            s.journey_date,
            s.departure_time,
            s.arrival_time,
            s.base_fare
        FROM SCHEDULE s
        JOIN TRAIN t
            ON s.train_id = t.train_id
        JOIN STATION ss
            ON s.source_station_id = ss.station_id
        JOIN STATION ds
            ON s.dest_station_id = ds.station_id
        WHERE s.schedule_id = %s
    """, (schedule_id,))

    data = cursor.fetchone()

    cursor.close()
    conn.close()

    if not data:
        return jsonify({"error": "Schedule not found"}), 404

    if data.get("journey_date"):
        data["journey_date"] = str(data["journey_date"])

    if data.get("departure_time"):
        data["departure_time"] = str(data["departure_time"])

    if data.get("arrival_time"):
        data["arrival_time"] = str(data["arrival_time"])

    if data.get("base_fare") is not None:
        data["base_fare"] = float(data["base_fare"])

    return jsonify(data)


# =========================
# PASSENGERS - GET
# =========================
@app.route("/api/passengers", methods=["GET"])
def get_passengers():

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

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    return jsonify(data)


# =========================
# PASSENGER REGISTRATION
# =========================
@app.route("/api/passengers", methods=["POST"])
def create_passenger():

    data = request.get_json() or {}

    passenger_id = data.get("passenger_id")
    name = data.get("name")
    age = data.get("age")
    gender = data.get("gender")
    phone = data.get("phone")
    email = data.get("email")

    if not all([passenger_id, name, age, gender, phone, email]):
        return jsonify({
            "error": "All passenger fields are required"
        }), 400

    gender_map = {
        "Male": "M",
        "Female": "F",
        "Other": "O",
        "M": "M",
        "F": "F",
        "O": "O"
    }

    gender = gender_map.get(gender, gender)

    try:

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            INSERT INTO PASSENGER
            (passenger_id, name, age, gender, phone, email)
            VALUES (%s, %s, %s, %s, %s, %s)
        """, (
            passenger_id,
            name,
            age,
            gender,
            phone,
            email
        ))

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Passenger registered successfully",
            "passenger_id": passenger_id
        }), 201

    except mysql.connector.Error as e:

        if 'conn' in locals():
            conn.rollback()
            conn.close()

        return jsonify({
            "error": str(e)
        }), 400


# =========================
# BOOKINGS - GET
# =========================
@app.route("/api/bookings", methods=["GET"])
def get_bookings():

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT
            b.booking_id,
            b.passenger_id,
            p.name AS passenger_name,
            b.schedule_id,
            t.train_name,
            s.journey_date,
            s.departure_time,
            ss.station_name AS source_station,
            ds.station_name AS destination,
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
        JOIN STATION ss
            ON s.source_station_id = ss.station_id
        JOIN STATION ds
            ON s.dest_station_id = ds.station_id
        ORDER BY b.booking_date DESC
    """)

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    for row in data:

        for field in ["journey_date", "booking_date"]:
            if row.get(field):
                row[field] = str(row[field])

        if row.get("departure_time"):
            row["departure_time"] = str(row["departure_time"])

        if row.get("total_fare") is not None:
            row["total_fare"] = float(row["total_fare"])

    return jsonify(data)
# =========================
# SINGLE BOOKING + TICKET
# =========================
@app.route("/api/bookings/<booking_id>", methods=["GET"])
def get_booking_by_id(booking_id):

    conn = None
    cursor = None

    try:

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        cursor.execute("""
            SELECT
                b.booking_id,
                b.passenger_id,
                b.schedule_id,
                b.booking_date,
                b.total_fare,
                b.status,

                p.name AS passenger_name,
                p.age AS passenger_age,
                p.gender AS passenger_gender,
                p.phone AS passenger_phone,
                p.email AS passenger_email,

                s.journey_date,
                s.departure_time,
                s.arrival_time,
                s.base_fare,

                tr.train_id,
                tr.train_name,
                tr.train_type,

                src.station_name AS source_name,
                src.city AS source_city,

                dst.station_name AS dest_name,
                dst.city AS dest_city,

                t.ticket_id,
                t.coach,
                t.seat_no,
                t.class,
                t.fare,

                pay.status AS payment_status

            FROM BOOKING b

            LEFT JOIN PASSENGER p
                ON b.passenger_id = p.passenger_id

            LEFT JOIN SCHEDULE s
                ON b.schedule_id = s.schedule_id

            LEFT JOIN TRAIN tr
                ON s.train_id = tr.train_id

            LEFT JOIN STATION src
                ON s.source_station_id = src.station_id

            LEFT JOIN STATION dst
                ON s.dest_station_id = dst.station_id

            LEFT JOIN TICKET t
                ON b.booking_id = t.booking_id

            LEFT JOIN PAYMENT pay
                ON b.booking_id = pay.booking_id

            WHERE b.booking_id = %s
        """, (booking_id,))

        booking = cursor.fetchone()

        if not booking:
            return jsonify({
                "success": False,
                "error": "Booking not found"
            }), 404

        # Convert MySQL date/time/decimal values
        if booking.get("journey_date"):
            booking["journey_date"] = str(booking["journey_date"])

        if booking.get("booking_date"):
            booking["booking_date"] = str(booking["booking_date"])

        if booking.get("departure_time"):
            booking["departure_time"] = str(booking["departure_time"])

        if booking.get("arrival_time"):
            booking["arrival_time"] = str(booking["arrival_time"])

        if booking.get("base_fare") is not None:
            booking["base_fare"] = float(booking["base_fare"])

        if booking.get("total_fare") is not None:
            booking["total_fare"] = float(booking["total_fare"])

        if booking.get("fare") is not None:
            booking["fare"] = float(booking["fare"])

        return jsonify({
            "success": True,
            "data": booking
        }), 200

    except mysql.connector.Error as e:

        print("GET BOOKING MYSQL ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    except Exception as e:

        print("GET BOOKING ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# =========================
# CREATE BOOKING
# =========================
@app.route("/api/bookings", methods=["POST"])
def create_booking():

    conn = None
    cursor = None

    try:

        data = request.get_json() or {}

        print("BOOKING REQUEST DATA:", data)

        passenger_id = data.get("passenger_id")
        schedule_id = data.get("schedule_id")
        total_fare = data.get("total_fare")

        requested_class = data.get("class", "3A")
        requested_coach = data.get("coach")
        requested_seat = data.get("seat_no")

        # booking_id is generated automatically by backend
        if not passenger_id or not schedule_id or total_fare is None:
            return jsonify({
                "success": False,
                "error": "passenger_id, schedule_id and total_fare are required"
            }), 400

        # Generate IDs within VARCHAR(10)
        booking_id = "BK" + uuid.uuid4().hex[:8].upper()
        ticket_id = "TK" + uuid.uuid4().hex[:8].upper()

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # =========================
        # CHECK PASSENGER
        # =========================
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

        # =========================
        # CHECK SCHEDULE
        # =========================
        cursor.execute("""
            SELECT
                s.schedule_id,
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

        # =========================
        # SEAT ALLOCATION
        # =========================

        if requested_coach and requested_seat:

            cursor.execute("""
                SELECT ticket_id
                FROM TICKET
                WHERE schedule_id = %s
                AND coach = %s
                AND seat_no = %s
            """, (
                schedule_id,
                requested_coach,
                str(requested_seat)
            ))

            existing_seat = cursor.fetchone()

            if existing_seat:
                return jsonify({
                    "success": False,
                    "error": "Selected seat is already booked"
                }), 400

            coach = requested_coach
            seat_no = str(requested_seat)

        else:

            coach = "B1"
            seat_no = None

            for seat in range(1, schedule["total_seats"] + 1):

                cursor.execute("""
                    SELECT ticket_id
                    FROM TICKET
                    WHERE schedule_id = %s
                    AND coach = %s
                    AND seat_no = %s
                """, (
                    schedule_id,
                    coach,
                    str(seat)
                ))

                if not cursor.fetchone():
                    seat_no = str(seat)
                    break

            if seat_no is None:
                return jsonify({
                    "success": False,
                    "error": "No seats available"
                }), 400

        # =========================
        # INSERT BOOKING
        # =========================
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
            date.today(),
            float(total_fare),
            "CONFIRMED"
        ))

        # =========================
        # INSERT TICKET
        # =========================
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
            requested_class,
            float(total_fare)
        ))

        conn.commit()

        print("BOOKING CREATED:", booking_id)
        print("TICKET CREATED:", ticket_id)

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
                "status": "CONFIRMED",
                "coach": coach,
                "seat_no": seat_no,
                "class": requested_class
            }
        }), 201

    except mysql.connector.Error as e:

        if conn:
            conn.rollback()

        print("MYSQL BOOKING ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    except Exception as e:

        if conn:
            conn.rollback()

        print("BOOKING ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()


# =========================
# CANCEL BOOKING
# =========================
@app.route("/api/bookings/<booking_id>/cancel", methods=["PUT"])
def cancel_booking(booking_id):

    try:

        conn = get_db()
        cursor = conn.cursor()

        cursor.execute("""
            UPDATE BOOKING
            SET status = 'CANCELLED'
            WHERE booking_id = %s
        """, (booking_id,))

        if cursor.rowcount == 0:

            cursor.close()
            conn.close()

            return jsonify({
                "error": "Booking not found"
            }), 404

        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({
            "message": "Booking cancelled successfully"
        })

    except mysql.connector.Error as e:

        if 'conn' in locals():
            conn.rollback()
            conn.close()

        return jsonify({
            "error": str(e)
        }), 400


# =========================
# PAYMENTS - GET
# =========================
@app.route("/api/payments", methods=["GET"])
def get_payments():

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

    data = cursor.fetchall()

    cursor.close()
    conn.close()

    for row in data:

        if row.get("amount") is not None:
            row["amount"] = float(row["amount"])

    return jsonify(data)


# =========================
# CREATE PAYMENT
# =========================
@app.route("/api/payments", methods=["POST"])
def create_payment():

    conn = None
    cursor = None

    try:

        data = request.get_json() or {}

        booking_id = data.get("booking_id")
        amount = data.get("amount")
        mode = data.get("mode")
        status = data.get("status", "SUCCESS")

        if not booking_id or amount is None or not mode:
            return jsonify({
                "success": False,
                "error": "booking_id, amount and mode are required"
            }), 400

        conn = get_db()
        cursor = conn.cursor(dictionary=True)

        # =========================
        # CHECK BOOKING
        # =========================
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

        # =========================
        # GENERATE PAYMENT ID
        # =========================
        payment_id = "PY" + uuid.uuid4().hex[:8].upper()

        # =========================
        # INSERT PAYMENT
        # =========================
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
            status
        ))

        conn.commit()

        print("PAYMENT CREATED:", payment_id)

        return jsonify({
            "success": True,
            "message": "Payment recorded successfully",
            "payment_id": payment_id,
            "booking_id": booking_id,
            "amount": float(amount),
            "status": status
        }), 201

    except mysql.connector.Error as e:

        if conn:
            conn.rollback()

        print("MYSQL PAYMENT ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    except Exception as e:

        if conn:
            conn.rollback()

        print("PAYMENT ERROR:", e)

        return jsonify({
            "success": False,
            "error": str(e)
        }), 500

    finally:

        if cursor:
            cursor.close()

        if conn:
            conn.close()

# =========================
# DASHBOARD
# =========================
@app.route("/api/dashboard", methods=["GET"])
def dashboard():

    conn = get_db()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("SELECT COUNT(*) AS count FROM PASSENGER")
    passengers = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) AS count FROM TRAIN")
    trains = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) AS count FROM BOOKING")
    bookings = cursor.fetchone()["count"]

    cursor.execute("SELECT COUNT(*) AS count FROM PAYMENT")
    payments = cursor.fetchone()["count"]

    cursor.close()
    conn.close()

    return jsonify({
        "passengers": passengers,
        "trains": trains,
        "bookings": bookings,
        "payments": payments
    })


# =========================
# ERROR HANDLER
# =========================
@app.errorhandler(404)
def not_found(error):

    return jsonify({
        "error": "API endpoint not found"
    }), 404


# =========================
# RUN SERVER
# =========================
if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=int(__import__("os").environ.get("PORT", 5000)),
        debug=True
    )
