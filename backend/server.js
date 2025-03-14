require("dotenv").config();
const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  sendAccountCreationEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail,
} = require("./emailUtils");

const app = express();
app.use(cors());
app.use(express.json());

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// Initialize database connection
let db;

async function initializeDBConnection() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log(`Connected to MySQL database ${process.env.DB_NAME}`);
  } catch (error) {
    console.error("Error connecting to the database:", error);
    process.exit(1); // Exit if can't connect to database
  }
}

//User Login
app.post("/api/auth/login", async (req, res) => {
  try {
    const { identifier, password } = req.body;

    // Debug log
    console.log("Login attempt:", { identifier, password });

    let query, params;

    if (isNaN(identifier)) {
      query = "SELECT * FROM users WHERE email = ?";
    } else {
      query = "SELECT * FROM users WHERE user_id = ?";
    }
    params = [identifier];

    // Debug log
    console.log("Query:", query, "Params:", params);

    const [users] = await db.query(query, params);

    if (users.length === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = users[0];

    // Debug log
    console.log("Found user:", { ...user, password: "[HIDDEN]" });

    const isMatch = await bcrypt.compare(password, user.password);

    // Debug log
    console.log("Password match:", isMatch);

    if (!isMatch) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.user_id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ error: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
};

// Route to get available rooms
app.get("/api/rooms/available", async (req, res) => {
  try {
    const date = req.query.date;
    const timeSlot = parseInt(req.query.timeSlot);
    const capacity = parseInt(req.query.capacity);

    const query = `SELECT * FROM rooms where capacity>=? and room_id not in (select room_id from bookings where booking_date=? and slot_id=?)`;
    const [rows] = await db.query(query, [capacity, date, timeSlot]);
    res.json(rows);
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ error: "Error fetching customers" });
  }
});

// Route to create booking
app.post("/api/bookings", authenticateToken, async (req, res) => {
  try {
    const date = req.body.date;
    const roomId = req.body.roomId;
    const timeSlot = parseInt(req.body.timeSlot);

    const userId = req.user.id;

    const query = `INSERT INTO bookings (room_id, user_id, booking_date, slot_id) VALUES (?,?,?,?)`;
    const [rows] = await db.query(query, [roomId, userId, date, timeSlot]);

    const bookingId = rows.insertId;
    const [bookings] = await db.query('SELECT * FROM bookings WHERE booking_id = ?', [bookingId]);
    const [rooms] = await db.query('SELECT * FROM rooms WHERE room_id = ?', [roomId]);
    const [timeSlots] = await db.query('SELECT * FROM time_slots WHERE slot_id = ?', [timeSlot]);
    const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    
    // Send booking confirmation email
    sendBookingConfirmationEmail(
        users[0], 
        bookings[0], 
        rooms[0], 
        timeSlots[0]
    );

    console.log("inserted");
    res.status(201).json({ message: "Booking successful" });
  } catch (error) {
    console.error("Error creating booking:", error);
    res.status(500).json({ error: "Error creating booking" });
  }
});

// Route to get current user info
app.get("/api/user/me", authenticateToken, async (req, res) => {
  try {
    const [users] = await db.query(
      "SELECT user_id, name, email, department_id, role FROM users WHERE user_id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(users[0]);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: error.message });
  }
});

//User details edit
app.put("/api/user/me", authenticateToken, async (req, res) => {
  try {
    const { name, email, department_id, password } = req.body;
    const userId = req.user.id;

    let updateFields = [];
    let queryParams = [];

    if (name) {
      updateFields.push("name = ?");
      queryParams.push(name);
    }

    if (email) {
      // Check for already existing email
      const [existingUsers] = await db.query(
        "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
        [email, userId]
      );

      if (existingUsers.length > 0) {
        return res
          .status(400)
          .json({ error: "Email is already in use by another user" });
      }

      updateFields.push("email = ?");
      queryParams.push(email);
    }

    if (department_id !== undefined) {
      updateFields.push("department_id = ?");
      queryParams.push(department_id === "" ? null : department_id);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push("password = ?");
      queryParams.push(hashedPassword);
    }

    // If nothing to update
    if (updateFields.length === 0) {
      return res.status(400).json({ error: "No fields provided for update" });
    }

    // Add user ID
    const query = `UPDATE users SET ${updateFields.join(
      ", "
    )} WHERE user_id = ?`;
    queryParams.push(userId);

    const [result] = await db.query(query, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ message: "Profile updated successfully" });
  } catch (error) {
    console.error("Error updating user profile:", error);
    res.status(500).json({ error: "Error updating user profile" });
  }
});

//New User Signup
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, department_id } = req.body;

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "Invalid email format" });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      "INSERT INTO users (name, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)",
      [name, email, hashedPassword, department_id || null, "user"]
    );

    const [newUser] = await db.query(
      "SELECT * FROM users WHERE email = ?",
      [email]
    );
    console.log(newUser[0]);
    sendAccountCreationEmail(newUser[0]);
    res.status(201).json({
      message: `Registration successful! Your User ID is: ${newUser[0].user_id}`,
      user_id: newUser[0].user_id,
    });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
        error: String(error).includes('users.email') 
            ? "Account with email ID already exists" 
            : "Registration failed"
    });  }
});

//Change password
app.post("/api/user/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate inputs
    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    // Get user's current password
    const [users] = await db.query(
      "SELECT password FROM users WHERE user_id = ?",
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    const [result] = await db.query(
      "UPDATE users SET password = ? WHERE user_id = ?",
      [hashedPassword, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: "Failed to update password" });
    }

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ error: "Error changing password" });
  }
});

// Regular users to see bookings
app.get("/api/user/bookings", authenticateToken, async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.booking_id, b.room_id, r.room_name, b.booking_date as date, 
                    ts.start_time, ts.end_time, 
                    CASE 
                        WHEN b.booking_date > CURDATE() THEN 'upcoming'
                        WHEN b.booking_date = CURDATE() THEN 'today'
                        ELSE 'past'
                    END as status
            FROM bookings b 
            JOIN rooms r ON b.room_id = r.room_id
            JOIN time_slots ts ON b.slot_id = ts.slot_id 
            WHERE b.user_id = ? 
            ORDER BY b.booking_date DESC, ts.start_time ASC`,
      [req.user.id]
    );
    res.json(bookings);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    res.status(500).json({ error: error.message });
  }
});

//Delete booking
app.delete("/api/bookings/:id", authenticateToken, async (req, res) => {
  try {
    const bookingId = req.params.id;
    const userId = req.user.id;

    // First check if booking exists and belongs to the user
    const [bookings] = await db.query(
      "SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?",
      [bookingId, userId]
    );

    if (bookings.length === 0) {
      return res
        .status(404)
        .json({ error: "Booking not found or not authorized to delete" });
    }

    // Check if booking is in the future (can only delete future bookings)
    const booking = bookings[0];

    const [rooms] = await db.query('SELECT * FROM rooms WHERE room_id = ?', [booking.room_id]);
    const [timeSlots] = await db.query('SELECT * FROM time_slots WHERE slot_id = ?', [booking.slot_id]);
    const [users] = await db.query('SELECT * FROM users WHERE user_id = ?', [userId]);
    const bookingDate = new Date(booking.booking_date);

    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day

    if (bookingDate < today) {
      return res.status(400).json({ error: "Cannot delete past bookings" });
    }

    // Delete the booking
    const [result] = await db.query(
      "DELETE FROM bookings WHERE booking_id = ?",
      [bookingId]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ error: "Failed to delete booking" });
    }

    sendBookingCancellationEmail(
        users[0], 
        booking, 
        rooms[0], 
        timeSlots[0]
    );

    res.json({ message: "Booking deleted successfully" });
  } catch (error) {
    console.error("Error deleting booking:", error);
    res.status(500).json({ error: "Error deleting booking" });
  }
});

// Protected route for admins only to see all users
app.get(
  "/api/admin/users",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [users] = await db.query(
        "SELECT user_id, name, email, department_id, role FROM users"
      );
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Protected route for admins to see all bookings
app.get(
  "/api/admin/bookings",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [bookings] = await db.query(
        `SELECT b.*, r.room_name, u.name as user_name
         FROM bookings b 
         JOIN rooms r ON b.room_id = r.room_id
         JOIN users u ON b.user_id = u.user_id`
      );
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Start server function
async function startServer() {
  try {
    await initializeDBConnection();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Error starting server:", error);
  }
}

// Protected route for admins to see all rooms
app.get(
  "/api/admin/rooms",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [rooms] = await db.query("SELECT * FROM rooms");
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Protected route for admins to see all time slots
app.get(
  "/api/admin/time_slots",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const [timeSlots] = await db.query("SELECT * FROM time_slots");
      res.json(timeSlots);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Update user (admin only)
app.put(
  "/api/admin/users/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = req.params.id;
      const { name, email, department_id, role, password } = req.body;

      let updateFields = [];
      let queryParams = [];

      if (name) {
        updateFields.push("name = ?");
        queryParams.push(name);
      }

      if (email) {
        const [existingUsers] = await db.query(
          "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
          [email, userId]
        );

        if (existingUsers.length > 0) {
          return res
            .status(400)
            .json({ error: "Email is already in use by another user" });
        }

        updateFields.push("email = ?");
        queryParams.push(email);
      }

      if (department_id !== undefined) {
        updateFields.push("department_id = ?");
        queryParams.push(department_id === "" ? null : department_id);
      }

      if (role) {
        updateFields.push("role = ?");
        queryParams.push(role);
      }

      if (password) {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push("password = ?");
        queryParams.push(hashedPassword);
      }

      // If nothing to update
      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No fields provided for update" });
      }

      // Add user ID
      const query = `UPDATE users SET ${updateFields.join(
        ", "
      )} WHERE user_id = ?`;
      queryParams.push(userId);

      const [result] = await db.query(query, queryParams);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Error updating user" });
    }
  }
);

// Delete user (admin only)
app.delete(
  "/api/admin/users/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const userId = req.params.id;

      // Check if user exists
      const [users] = await db.query("SELECT * FROM users WHERE user_id = ?", [
        userId,
      ]);

      if (users.length === 0) {
        return res.status(404).json({ error: "User not found" });
      }

      // Check if the user has any bookings, cannot delete if bookings exist in future
      const [bookings] = await db.query(
        "SELECT * FROM bookings WHERE user_id = ? AND booking_date >= CURDATE()",
        [userId]
      );

      if (bookings.length > 0) {
        return res.status(400).json({
          error:
            "Cannot delete user with existing bookings. Delete the bookings first.",
        });
      }

      // Delete the user
      const [result] = await db.query("DELETE FROM users WHERE user_id = ?", [
        userId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(500).json({ error: "Failed to delete user" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Error deleting user" });
    }
  }
);

// Update room (admin only)
app.put(
  "/api/admin/rooms/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const roomId = req.params.id;
      const { room_name, capacity, location } = req.body;

      let updateFields = [];
      let queryParams = [];

      if (room_name) {
        updateFields.push("room_name = ?");
        queryParams.push(room_name);
      }

      if (capacity) {
        updateFields.push("capacity = ?");
        queryParams.push(capacity);
      }

      if (location) {
        updateFields.push("location = ?");
        queryParams.push(location);
      }

      // If nothing to update
      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No fields provided for update" });
      }

      // Add room ID
      const query = `UPDATE rooms SET ${updateFields.join(
        ", "
      )} WHERE room_id = ?`;
      queryParams.push(roomId);

      const [result] = await db.query(query, queryParams);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Room not found" });
      }

      res.json({ message: "Room updated successfully" });
    } catch (error) {
      console.error("Error updating room:", error);
      res.status(500).json({ error: "Error updating room" });
    }
  }
);

// Delete room (admin only)
app.delete(
  "/api/admin/rooms/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const roomId = req.params.id;

      // Check if room exists
      const [rooms] = await db.query("SELECT * FROM rooms WHERE room_id = ?", [
        roomId,
      ]);

      if (rooms.length === 0) {
        return res.status(404).json({ error: "Room not found" });
      }

      // Check if the room has any bookings
      const [bookings] = await db.query(
        "SELECT * FROM bookings WHERE room_id = ?",
        [roomId]
      );

      if (bookings.length > 0) {
        return res.status(400).json({
          error:
            "Cannot delete room with existing bookings. Delete the bookings first.",
        });
      }

      // Delete room
      const [result] = await db.query("DELETE FROM rooms WHERE room_id = ?", [
        roomId,
      ]);

      if (result.affectedRows === 0) {
        return res.status(500).json({ error: "Failed to delete room" });
      }

      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      console.error("Error deleting room:", error);
      res.status(500).json({ error: "Error deleting room" });
    }
  }
);

// Update booking (admin only)
app.put(
  "/api/admin/bookings/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const bookingId = req.params.id;
      const { room_id, user_id, booking_date, slot_id } = req.body;

      let updateFields = [];
      let queryParams = [];

      if (room_id) {
        updateFields.push("room_id = ?");
        queryParams.push(room_id);
      }

      if (user_id) {
        updateFields.push("user_id = ?");
        queryParams.push(user_id);
      }

      if (booking_date) {
        updateFields.push("booking_date = ?");
        queryParams.push(booking_date);
      }

      if (slot_id) {
        updateFields.push("slot_id = ?");
        queryParams.push(slot_id);
      }

      // If nothing to update
      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No fields provided for update" });
      }

      // Add booking ID
      const query = `UPDATE bookings SET ${updateFields.join(
        ", "
      )} WHERE booking_id = ?`;
      queryParams.push(bookingId);

      const [result] = await db.query(query, queryParams);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      res.json({ message: "Booking updated successfully" });
    } catch (error) {
      console.error("Error updating booking:", error);
      res.status(500).json({ error: "Error updating booking" });
    }
  }
);

// Delete booking (admin only)
app.delete(
  "/api/admin/bookings/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const bookingId = req.params.id;

      // Check if booking exists
      const [bookings] = await db.query(
        "SELECT * FROM bookings WHERE booking_id = ?",
        [bookingId]
      );

      if (bookings.length === 0) {
        return res.status(404).json({ error: "Booking not found" });
      }

      // Delete the booking
      const [result] = await db.query(
        "DELETE FROM bookings WHERE booking_id = ?",
        [bookingId]
      );

      if (result.affectedRows === 0) {
        return res.status(500).json({ error: "Failed to delete booking" });
      }

      res.json({ message: "Booking deleted successfully" });
    } catch (error) {
      console.error("Error deleting booking:", error);
      res.status(500).json({ error: "Error deleting booking" });
    }
  }
);

// Update time slot (admin only)
app.put(
  "/api/admin/time_slots/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const slotId = req.params.id;
      const { start_time, end_time } = req.body;

      let updateFields = [];
      let queryParams = [];

      if (start_time) {
        updateFields.push("start_time = ?");
        queryParams.push(start_time);
      }

      if (end_time) {
        updateFields.push("end_time = ?");
        queryParams.push(end_time);
      }

      // If nothing to update
      if (updateFields.length === 0) {
        return res.status(400).json({ error: "No fields provided for update" });
      }

      // Add slot id
      const query = `UPDATE time_slots SET ${updateFields.join(
        ", "
      )} WHERE slot_id = ?`;
      queryParams.push(slotId);

      const [result] = await db.query(query, queryParams);

      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Time slot not found" });
      }

      res.json({ message: "Time slot updated successfully" });
    } catch (error) {
      console.error("Error updating time slot:", error);
      res.status(500).json({ error: "Error updating time slot" });
    }
  }
);

// Delete time slot (admin only)
app.delete(
  "/api/admin/time_slots/:id",
  authenticateToken,
  requireAdmin,
  async (req, res) => {
    try {
      const slotId = req.params.id;

      // Check if time slot exists
      const [slots] = await db.query(
        "SELECT * FROM time_slots WHERE slot_id = ?",
        [slotId]
      );

      if (slots.length === 0) {
        return res.status(404).json({ error: "Time slot not found" });
      }

      // Check if the time slot has any bookings
      const [bookings] = await db.query(
        "SELECT * FROM bookings WHERE slot_id = ?",
        [slotId]
      );

      if (bookings.length > 0) {
        return res.status(400).json({
          error:
            "Cannot delete time slot with existing bookings. Delete the bookings first.",
        });
      }

      // Delete the time slot
      const [result] = await db.query(
        "DELETE FROM time_slots WHERE slot_id = ?",
        [slotId]
      );

      if (result.affectedRows === 0) {
        return res.status(500).json({ error: "Failed to delete time slot" });
      }

      res.json({ message: "Time slot deleted successfully" });
    } catch (error) {
      console.error("Error deleting time slot:", error);
      res.status(500).json({ error: "Error deleting time slot" });
    }
  }
);

// Start the server
startServer();
