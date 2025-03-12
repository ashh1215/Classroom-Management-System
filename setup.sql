-- Time slots lookup table
CREATE TABLE time_slots (
    slot_id INT PRIMARY KEY,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL
);

-- Rooms table
CREATE TABLE rooms (
    room_id INT PRIMARY KEY AUTO_INCREMENT,
    room_name VARCHAR(10) NOT NULL,  -- Like 'A101', 'B202', etc.
    capacity INT NOT NULL,
    CONSTRAINT check_capacity CHECK (capacity > 0)
);

-- Users table (needed for bookings)
CREATE TABLE users (
    user_id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    department_id INT,
    role VARCHAR(20) NOT NULL  -- 'admin', 'user'.
);

-- Bookings table
CREATE TABLE bookings (
    booking_id INT PRIMARY KEY AUTO_INCREMENT,
    room_id INT NOT NULL,
    user_id INT NOT NULL,
    booking_date DATE NOT NULL,
    slot_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(room_id),
    FOREIGN KEY (user_id) REFERENCES users(user_id),
    FOREIGN KEY (slot_id) REFERENCES time_slots(slot_id),
    -- Prevent double booking of same room at same time
    UNIQUE KEY unique_booking (room_id, booking_date, slot_id)
);

-- Add important indexes for performance
CREATE INDEX idx_booking_date_slot ON bookings(booking_date, slot_id);
CREATE INDEX idx_room_date ON bookings(room_id, booking_date);

-- Insert standard time slots
INSERT INTO time_slots VALUES
(1, '08:00', '09:00'),
(2, '09:00', '10:00'),
(3, '10:00', '11:00'),
(4, '11:00', '12:00'),
(5, '14:00', '15:00'),
(6, '15:00', '16:00'),
(7, '16:00', '17:00'),
(8, '17:00', '18:00');

-- Insert sample rooms
INSERT INTO rooms (room_name, capacity) VALUES
-- A Block rooms
('A101', 30),
('A102', 40),
('A103', 35),
('A201', 50),
('A202', 45),
-- B Block rooms
('B101', 30),
('B102', 40),
('B103', 35),
('B201', 45),
('B202', 40),
-- C Block rooms
('C101', 60),
('C102', 55),
('C201', 50),
('C202', 45),
-- D Block rooms
('D101', 30),
('D102', 35),
('D201', 40),
('D202', 45);