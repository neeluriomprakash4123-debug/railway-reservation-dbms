# Railway Ticket Reservation & Journey Management System

> **DBMS College Project Frontend & REST API Specification**  
> Built with HTML5, CSS3, Vanilla JavaScript, Flask REST API Architecture, and MySQL 8.0.

---

## 🚆 Project Overview

This is a complete, modern, professional frontend for a **Railway Ticket Reservation & Journey Management System** designed for a Database Management Systems (DBMS) college project.

The system strictly models real-world railway reservation lifecycles, relational constraints, foreign keys, and inventory tracking across 7 relational entities:

1. **PASSENGER**
2. **TRAIN**
3. **STATION**
4. **SCHEDULE**
5. **BOOKING**
6. **TICKET**
7. **PAYMENT**

---

## 🏛️ System Architecture

```text
┌────────────────────────────────────────────────────────┐
│             MODERN FRONTEND (HTML5 / CSS3 / ES6)       │
│  - Home, Train Search, Register, Booking, Payment,     │
│    E-Ticket Confirmation, PNR Status, Admin Dashboard  │
└──────────────────────────┬─────────────────────────────┘
                           │ fetch() REST API Calls
                           ▼
┌────────────────────────────────────────────────────────┐
│               REST API CLIENT (js/api.js)              │
│  - Centralized Service Layer                           │
│  - Out-of-the-box Mock Store (localStorage)            │
│  - One-click toggle to Live Flask Backend              │
└──────────────────────────┬─────────────────────────────┘
                           │ JSON HTTP Requests
                           ▼
┌────────────────────────────────────────────────────────┐
│             PYTHON FLASK BACKEND (backend/app.py)      │
│  - RESTful Endpoints with CORS enabled                 │
│  - Business logic, fare & refund calculations          │
└──────────────────────────┬─────────────────────────────┘
                           │ mysql.connector
                           ▼
┌────────────────────────────────────────────────────────┐
│             MYSQL DATABASE (database/schema.sql)       │
│  - Tables with Primary & Foreign Key constraints       │
└────────────────────────────────────────────────────────┘
```

---

## 📁 Project Directory Structure

```text
railway-reservation-system/
├── index.html                  # 1. HOME PAGE (Hero search, quick links, featured routes)
├── trains.html                 # 2. TRAIN SEARCH PAGE (Filters, class selection, live fare)
├── passenger-register.html     # 3. PASSENGER REGISTRATION (Validation, recent passengers)
├── book-ticket.html            # 4. BOOK TICKET PAGE (Coach seat picker, live fare summary)
├── payment.html                # 5. PAYMENT PAGE (Modes: UPI, Card, NetBanking, gateway delays)
├── confirmation.html           # 6. CONFIRMATION PAGE (Official printable e-ticket & QR)
├── pnr-status.html             # 7. PNR STATUS PAGE (Progress timeline tracker)
├── my-bookings.html            # 8. MY BOOKINGS PAGE (Reservation history, filters)
├── cancel-ticket.html          # 9. CANCEL TICKET PAGE (Refund calculator, cancellation receipt)
├── admin.html                  # 10. ADMIN DASHBOARD (8 statistics cards, full CRUD tables)
│
├── css/
│   ├── style.css               # Core railway styling, cards, tables, ticket print CSS
│   └── admin.css               # Admin layout, sidebar navigation, stats cards
│
├── js/
│   ├── api.js                  # Central REST API client & relational mock database store
│   ├── main.js                 # Shared utilities, toast alerts, modals, formatters
│   └── pages/
│       ├── home.js             # Hero search logic and station swapping
│       ├── train-search.js     # Train filtering, class selection & pricing
│       ├── passenger-register.js # Form validation & passenger registration
│       ├── book-ticket.js      # Interactive seat grid, coach & fare calculation
│       ├── payment.js          # Payment mode selector & gateway simulation
│       ├── confirmation.js     # E-ticket rendering & print support
│       ├── pnr-status.js       # PNR search & live journey step tracker
│       ├── my-bookings.js      # Booking history & ticket filter tabs
│       ├── cancel-ticket.js    # Cancellation logic & refund computation
│       └── admin.js            # Dashboard stats & full CRUD modals for all entities
│
├── database/
│   └── schema.sql              # MySQL DDL schema with primary/foreign keys & seed data
│
└── backend/
    ├── app.py                  # Complete ready-to-run Python Flask REST API
    └── requirements.txt        # Flask, flask-cors, mysql-connector-python
```

---

## 🗃️ MySQL Database Schema & Exact Field Names

| Entity | Primary Key | Attributes / Field Names |
| :--- | :--- | :--- |
| **PASSENGER** | `passenger_id` | `passenger_id`, `name`, `age`, `gender`, `phone`, `email` |
| **TRAIN** | `train_id` | `train_id`, `train_name`, `train_type`, `total_seats` |
| **STATION** | `station_id` | `station_id`, `station_name`, `city`, `state` |
| **SCHEDULE** | `schedule_id` | `schedule_id`, `train_id`, `source_station_id`, `dest_station_id`, `journey_date`, `departure_time`, `arrival_time`, `base_fare` |
| **BOOKING** | `booking_id` | `booking_id`, `passenger_id`, `schedule_id`, `booking_date`, `total_fare`, `status` |
| **TICKET** | `ticket_id` | `ticket_id`, `booking_id`, `schedule_id`, `coach`, `seat_no`, `class`, `fare` |
| **PAYMENT** | `payment_id` | `payment_id`, `booking_id`, `amount`, `mode`, `status` |

---

## 🚀 How to Run the Frontend

### Option 1: Direct Browser Opening (No Server Needed!)
Because `js/api.js` includes an intelligent relational Mock Database layer persisted in `localStorage`:
1. Double-click or open `index.html` directly in Google Chrome, Microsoft Edge, Firefox, or Safari.
2. The entire reservation journey works immediately out-of-the-box!
3. You can search trains, register passengers, book tickets, select coaches & seats, simulate payments, print e-tickets, check PNR status, cancel tickets, and manage all database records in the Admin Dashboard!

### Option 2: Using Python HTTP Server
```bash
cd "C:\Users\Omprakash\.gemini\antigravity\scratch\railway-reservation-system"
python -m http.server 8000
```
Open your browser at `http://localhost:8000`.

---

## 🔌 Connecting to the Python Flask Backend

When you are ready to test against your Python Flask backend:

### 1. Set Up MySQL Database
Run the provided SQL script in MySQL Workbench or terminal:
```bash
mysql -u root -p < database/schema.sql
```

### 2. Configure & Run Flask Backend
```bash
cd backend
pip install -r requirements.txt
# Update MySQL password in app.py if necessary
python app.py
```
The Flask backend runs at `http://127.0.0.1:5000`.

### 3. Switch Frontend to Live Flask API
Click the **"Backend Mode"** pill in the top notice bar on any page to switch from **Mock API** to **Live Flask (127.0.0.1:5000)**, or run:
```javascript
RailwayAPI.toggleMock(false); // Live Flask REST API
RailwayAPI.toggleMock(true);  // Local Mock Store
```

---

## 📋 Implemented Pages & Features

1. **Home Page (`index.html`)**:
   - Railway reservation header and transit hero section.
   - Live station dropdowns, station swap button, date picker.
   - Quick links for PNR Status, My Bookings, Register Passenger, Cancel Ticket.
   - Popular express routes overview.

2. **Train Search Page (`trains.html`)**:
   - Filter by source station, destination, date, and train type.
   - Train result cards with departure/arrival times, duration line, and available seats.
   - Interactive class selection (1A, 2A, 3A, SL, CC) with live fare computation.
   - Direct "Book Now" routing.

3. **Passenger Registration Page (`passenger-register.html`)**:
   - Form for `passenger_id`, `name`, `age`, `gender`, `phone`, `email`.
   - Real-time input validation (10-digit mobile regex, email regex, age limits).
   - List of recently registered passengers with quick booking action.

4. **Book Ticket Page (`book-ticket.html`)**:
   - Pre-fills selected train and journey schedule.
   - Select registered passenger with live profile preview.
   - Interactive Coach & Seat grid matrix with visual seat status (Available, Selected, Booked).
   - Dynamic fare calculation (Base Fare + Class Multiplier + Reservation Surcharge + GST).

5. **Payment Page (`payment.html`)**:
   - Displays Booking ID / PNR and total payable fare.
   - Select payment mode (UPI, Credit Card, Debit Card, Net Banking).
   - Animated payment gateway processing simulation.
   - Error and success alert messaging.

6. **Booking Confirmation Page (`confirmation.html`)**:
   - Official Electronic Reservation Slip (ERS) / E-Ticket.
   - Verified PNR, passenger details, route, coach, seat, class, and fare.
   - Digital QR code / verification barcode simulation.
   - Dedicated print stylesheet (`@media print`) for clean printing and PDF saving.

7. **PNR Status Page (`pnr-status.html`)**:
   - PNR input with sample demo buttons.
   - Live status progress tracker (Booking Done ➔ Seat Confirmed ➔ Chart Prepared).
   - Direct link to reprint ticket or cancel booking.

8. **My Bookings Page (`my-bookings.html`)**:
   - Responsive table and cards with PNR, Passenger, Train, Journey Date, Seat, Fare, and Status.
   - Filter tabs: All Bookings, Confirmed, Cancelled.
   - Actions to View Ticket or Cancel Ticket.

9. **Cancel Ticket Page (`cancel-ticket.html`)**:
   - Lookup booking by PNR or dropdown selector.
   - Automated refund calculator deducting cancellation penalty.
   - Confirmation dialog before updating database status to `CANCELLED`.
   - Generates cancellation receipt with net refund amount.

10. **Admin Dashboard (`admin.html`)**:
    - Responsive sidebar navigation.
    - 8 Dashboard Metrics: Total Passengers, Total Trains, Total Stations, Total Bookings, Confirmed, Waiting, Cancelled, Total Revenue.
    - Full CRUD management panels for:
      - Manage Passengers (View, Add, Edit, Delete)
      - Manage Trains (View, Add, Edit, Delete)
      - Manage Stations (View, Add, Edit, Delete)
      - Manage Schedules (View, Add, Edit, Delete)
      - Manage Bookings (View, Cancel)
      - Manage Payments (View, Filter, Verification)
    - Search input filtering on all tables.
    - Modal forms with field validation matching exact MySQL table schemas.
