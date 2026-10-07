-- ============================================================================
-- RAILWAY TICKET RESERVATION & JOURNEY MANAGEMENT SYSTEM
-- MySQL Database Schema (schema.sql)
-- Designed for DBMS College Project
-- ============================================================================

CREATE DATABASE IF NOT EXISTS railway_reservation_db;
USE railway_reservation_db;

-- Drop child tables first if existing to preserve foreign key order
DROP TABLE IF EXISTS PAYMENT;
DROP TABLE IF EXISTS TICKET;
DROP TABLE IF EXISTS BOOKING;
DROP TABLE IF EXISTS SCHEDULE;
DROP TABLE IF EXISTS STATION;
DROP TABLE IF EXISTS TRAIN;
DROP TABLE IF EXISTS PASSENGER;

-- ----------------------------------------------------------------------------
-- 1. PASSENGER ENTITY
-- ----------------------------------------------------------------------------
CREATE TABLE PASSENGER (
    passenger_id VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    age INT NOT NULL CHECK (age > 0 AND age <= 120),
    gender ENUM('Male', 'Female', 'Other') NOT NULL,
    phone VARCHAR(15) NOT NULL,
    email VARCHAR(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 2. TRAIN ENTITY
-- ----------------------------------------------------------------------------
CREATE TABLE TRAIN (
    train_id VARCHAR(20) PRIMARY KEY,
    train_name VARCHAR(100) NOT NULL,
    train_type VARCHAR(50) NOT NULL,
    total_seats INT NOT NULL DEFAULT 500 CHECK (total_seats > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 3. STATION ENTITY
-- ----------------------------------------------------------------------------
CREATE TABLE STATION (
    station_id VARCHAR(20) PRIMARY KEY,
    station_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    state VARCHAR(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 4. SCHEDULE ENTITY
-- ----------------------------------------------------------------------------
CREATE TABLE SCHEDULE (
    schedule_id VARCHAR(20) PRIMARY KEY,
    train_id VARCHAR(20) NOT NULL,
    source_station_id VARCHAR(20) NOT NULL,
    dest_station_id VARCHAR(20) NOT NULL,
    journey_date DATE NOT NULL,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    base_fare DECIMAL(10, 2) NOT NULL CHECK (base_fare >= 0),
    CONSTRAINT fk_schedule_train FOREIGN KEY (train_id) 
        REFERENCES TRAIN(train_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_schedule_source FOREIGN KEY (source_station_id) 
        REFERENCES STATION(station_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_schedule_dest FOREIGN KEY (dest_station_id) 
        REFERENCES STATION(station_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 5. BOOKING ENTITY
-- ----------------------------------------------------------------------------
CREATE TABLE BOOKING (
    booking_id VARCHAR(20) PRIMARY KEY,
    passenger_id VARCHAR(20) NOT NULL,
    schedule_id VARCHAR(20) NOT NULL,
    booking_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    total_fare DECIMAL(10, 2) NOT NULL CHECK (total_fare >= 0),
    status ENUM('CONFIRMED', 'WAITING', 'CANCELLED') NOT NULL DEFAULT 'CONFIRMED',
    CONSTRAINT fk_booking_passenger FOREIGN KEY (passenger_id) 
        REFERENCES PASSENGER(passenger_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_booking_schedule FOREIGN KEY (schedule_id) 
        REFERENCES SCHEDULE(schedule_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 6. TICKET ENTITY
-- ----------------------------------------------------------------------------
CREATE TABLE TICKET (
    ticket_id VARCHAR(20) PRIMARY KEY,
    booking_id VARCHAR(20) NOT NULL,
    schedule_id VARCHAR(20) NOT NULL,
    coach VARCHAR(10) NOT NULL,
    seat_no VARCHAR(10) NOT NULL,
    class VARCHAR(10) NOT NULL,
    fare DECIMAL(10, 2) NOT NULL CHECK (fare >= 0),
    CONSTRAINT fk_ticket_booking FOREIGN KEY (booking_id) 
        REFERENCES BOOKING(booking_id) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_ticket_schedule FOREIGN KEY (schedule_id) 
        REFERENCES SCHEDULE(schedule_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ----------------------------------------------------------------------------
-- 7. PAYMENT ENTITY
-- ----------------------------------------------------------------------------
CREATE TABLE PAYMENT (
    payment_id VARCHAR(20) PRIMARY KEY,
    booking_id VARCHAR(20) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL CHECK (amount >= 0),
    mode ENUM('UPI', 'Credit Card', 'Debit Card', 'Net Banking', 'Cash') NOT NULL,
    status ENUM('SUCCESS', 'PENDING', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'SUCCESS',
    CONSTRAINT fk_payment_booking FOREIGN KEY (booking_id) 
        REFERENCES BOOKING(booking_id) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================================
-- INITIAL SAMPLE DATA INSERTION (Matches Frontend Mock Store)
-- ============================================================================

-- Stations
INSERT INTO STATION (station_id, station_name, city, state) VALUES
('STN01', 'New Delhi Railway Station (NDLS)', 'New Delhi', 'Delhi'),
('STN02', 'Mumbai Central (MMCT)', 'Mumbai', 'Maharashtra'),
('STN03', 'KSR Bengaluru City (SBC)', 'Bengaluru', 'Karnataka'),
('STN04', 'MGR Chennai Central (MAS)', 'Chennai', 'Tamil Nadu'),
('STN05', 'Howrah Junction (HWH)', 'Kolkata', 'West Bengal'),
('STN06', 'Ahmedabad Junction (ADI)', 'Ahmedabad', 'Gujarat'),
('STN07', 'Varanasi Junction (BSB)', 'Varanasi', 'Uttar Pradesh'),
('STN08', 'Jaipur Junction (JP)', 'Jaipur', 'Rajasthan');

-- Trains
INSERT INTO TRAIN (train_id, train_name, train_type, total_seats) VALUES
('TR101', '12952 - Mumbai Tejas Rajdhani', 'Rajdhani Express', 480),
('TR102', '22436 - Vande Bharat Express', 'Vande Bharat Express', 530),
('TR103', '12002 - New Delhi Shatabdi', 'Shatabdi Express', 420),
('TR104', '12246 - Howrah Duronto Express', 'Duronto Express', 600),
('TR105', '12626 - Kerala Superfast Express', 'Superfast Express', 750),
('TR106', '12958 - Swarna Jayanti Rajdhani', 'Rajdhani Express', 500);

-- Schedules
INSERT INTO SCHEDULE (schedule_id, train_id, source_station_id, dest_station_id, journey_date, departure_time, arrival_time, base_fare) VALUES
('SCH101', 'TR101', 'STN01', 'STN02', '2026-10-10', '16:55:00', '08:35:00', 1850.00),
('SCH102', 'TR102', 'STN01', 'STN07', '2026-10-10', '06:00:00', '14:00:00', 1750.00),
('SCH103', 'TR103', 'STN01', 'STN08', '2026-10-11', '06:10:00', '10:40:00', 950.00),
('SCH104', 'TR104', 'STN05', 'STN01', '2026-10-12', '17:00:00', '10:30:00', 2100.00),
('SCH105', 'TR105', 'STN01', 'STN03', '2026-10-14', '20:10:00', '06:40:00', 2350.00),
('SCH106', 'TR101', 'STN02', 'STN01', '2026-10-15', '17:00:00', '08:32:00', 1850.00);

-- Passengers
INSERT INTO PASSENGER (passenger_id, name, age, gender, phone, email) VALUES
('PSG101', 'Rajesh Kumar Sharma', 35, 'Male', '9876543210', 'rajesh.sharma@example.com'),
('PSG102', 'Priya V. Patel', 29, 'Female', '9823456781', 'priya.patel@example.com'),
('PSG103', 'Amitabh Verma', 52, 'Male', '9711223344', 'amitabh.verma@example.com');

-- Bookings
INSERT INTO BOOKING (booking_id, passenger_id, schedule_id, booking_date, total_fare, status) VALUES
('BK829140', 'PSG101', 'SCH101', '2026-10-01 14:20:00', 1850.00, 'CONFIRMED'),
('BK541920', 'PSG102', 'SCH102', '2026-10-02 10:15:00', 1750.00, 'CONFIRMED'),
('BK730219', 'PSG103', 'SCH105', '2026-10-03 18:45:00', 2350.00, 'CANCELLED');

-- Tickets
INSERT INTO TICKET (ticket_id, booking_id, schedule_id, coach, seat_no, class, fare) VALUES
('TK9010', 'BK829140', 'SCH101', 'B2', '24', '3A', 1850.00),
('TK9011', 'BK541920', 'SCH102', 'C4', '18', 'CC', 1750.00),
('TK9012', 'BK730219', 'SCH105', 'A1', '12', '2A', 2350.00);

-- Payments
INSERT INTO PAYMENT (payment_id, booking_id, amount, mode, status) VALUES
('PAY6001', 'BK829140', 1850.00, 'UPI', 'SUCCESS'),
('PAY6002', 'BK541920', 1750.00, 'Credit Card', 'SUCCESS'),
('PAY6003', 'BK730219', 2350.00, 'Net Banking', 'REFUNDED');
