require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

// Database connection configuration
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};

// Initialize database connection
let db;

async function initializeDBConnection() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log(`Connected to MySQL database ${process.env.DB_NAME}`);
    } catch (error) {
        console.error('Error connecting to the database:', error);
        process.exit(1); // Exit if can't connect to database
    }
}

//User Login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { identifier, password } = req.body;

        // Debug log
        console.log('Login attempt:', { identifier, password });

        let query, params;
        
        // Fix the logic (it was reversed)
        if (isNaN(identifier)) {
            query = "SELECT * FROM users WHERE email = ?";
        } else {
            query = "SELECT * FROM users WHERE user_id = ?";
        }
        params = [identifier];

        // Debug log
        console.log('Query:', query, 'Params:', params);

        const [users] = await db.query(query, params);

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        
        // Debug log
        console.log('Found user:', { ...user, password: '[HIDDEN]' });

        const isMatch = await bcrypt.compare(password, user.password);
        
        // Debug log
        console.log('Password match:', isMatch);

        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.user_id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.user_id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Middleware to verify JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid token' });
      }
      req.user = decoded;
      next();
    });
  };
  
  // Middleware to check admin role
  const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };


// Route to get available rooms
app.get('/api/rooms/available', async (req, res) => {
    try {
        const date=req.query.date;
        const timeSlot=parseInt(req.query.timeSlot);
        const capacity=parseInt(req.query.capacity);

        const query=`SELECT * FROM rooms where capacity>=? and room_id not in (select room_id from bookings where booking_date=? and slot_id=?)`;
        const [rows] = await db.query(query, [capacity,date,timeSlot]);
        res.json(rows);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Error fetching customers' });
    }
});

// Route to create booking
app.post('/api/bookings', authenticateToken, async (req, res) => {
    try {
        const date = req.body.date;
        const roomId = req.body.roomId;
        const timeSlot = parseInt(req.body.timeSlot);
        
        // Use the user ID from the JWT token instead of from the request body
        const userId = req.user.id;

        const query = `INSERT INTO bookings (room_id, user_id, booking_date, slot_id) VALUES (?,?,?,?)`;
        const [rows] = await db.query(query, [roomId, userId, date, timeSlot]);
        console.log('inserted');
        res.status(201).json({ message: 'Booking successful' });
    } catch (error) {
        console.error('Error creating booking:', error);
        res.status(500).json({ error: 'Error creating booking' });
    }
});

// Route to get current user info
app.get('/api/user/me', authenticateToken, async (req, res) => {
    try {
      const [users] = await db.query(
        'SELECT user_id, name, email, department_id, role FROM users WHERE user_id = ?',
        [req.user.id]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      res.json(users[0]);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      res.status(500).json({ error: error.message });
    }
});

//User details edit
app.put('/api/user/me', authenticateToken, async (req, res) => {
    try {
        const { name, email, department_id, password } = req.body;
        const userId = req.user.id;

        // Build query dynamically based on what's being updated
        let updateFields = [];
        let queryParams = [];

        if (name) {
            updateFields.push('name = ?');
            queryParams.push(name);
        }

        if (email) {
            // Check if email is already in use by another user
            const [existingUsers] = await db.query(
                'SELECT user_id FROM users WHERE email = ? AND user_id != ?',
                [email, userId]
            );

            if (existingUsers.length > 0) {
                return res.status(400).json({ error: 'Email is already in use by another user' });
            }

            updateFields.push('email = ?');
            queryParams.push(email);
        }

        if (department_id !== undefined) {
            updateFields.push('department_id = ?');
            queryParams.push(department_id === '' ? null : department_id);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            queryParams.push(hashedPassword);
        }

        // If nothing to update
        if (updateFields.length === 0) {
            return res.status(400).json({ error: 'No fields provided for update' });
        }

        // Complete the query and add the user ID
        const query = `UPDATE users SET ${updateFields.join(', ')} WHERE user_id = ?`;
        queryParams.push(userId);

        const [result] = await db.query(query, queryParams);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating user profile:', error);
        res.status(500).json({ error: 'Error updating user profile' });
    }
});


//New User Signup
app.post('/api/auth/register', async (req, res) => {
    try {
        const { name, email, password, department_id } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            'INSERT INTO users (name, email, password, department_id, role) VALUES (?, ?, ?, ?, ?)',
            [name, email, hashedPassword, department_id || null, 'user']
        );

        // Get the newly created user
        const [newUser] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
        
        res.status(201).json({ 
            message: `Registration successful! Your User ID is: ${newUser[0].user_id}`,
            user_id: newUser[0].user_id 
        });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

//Change password
app.post('/api/user/change-password', authenticateToken, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        // Validate inputs
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        // Get user's current password
        const [users] = await db.query('SELECT password FROM users WHERE user_id = ?', [userId]);
        
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, users[0].password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        const [result] = await db.query(
            'UPDATE users SET password = ? WHERE user_id = ?',
            [hashedPassword, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ error: 'Failed to update password' });
        }

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Error changing password' });
    }
});

// Protected route for regular users to see their bookings
app.get('/api/user/bookings', authenticateToken, async (req, res) => {
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
        console.error('Error fetching user bookings:', error);
        res.status(500).json({ error: error.message });
    }
});

//Delete booking
app.delete('/api/bookings/:id', authenticateToken, async (req, res) => {
    try {
        const bookingId = req.params.id;
        const userId = req.user.id;

        // First check if booking exists and belongs to the user
        const [bookings] = await db.query(
            'SELECT * FROM bookings WHERE booking_id = ? AND user_id = ?',
            [bookingId, userId]
        );

        if (bookings.length === 0) {
            return res.status(404).json({ error: 'Booking not found or not authorized to delete' });
        }

        // Check if booking is in the future (can only delete future bookings)
        const booking = bookings[0];
        const bookingDate = new Date(booking.booking_date);
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day

        if (bookingDate < today) {
            return res.status(400).json({ error: 'Cannot delete past bookings' });
        }

        // Delete the booking
        const [result] = await db.query(
            'DELETE FROM bookings WHERE booking_id = ?',
            [bookingId]
        );

        if (result.affectedRows === 0) {
            return res.status(500).json({ error: 'Failed to delete booking' });
        }

        res.json({ message: 'Booking deleted successfully' });
    } catch (error) {
        console.error('Error deleting booking:', error);
        res.status(500).json({ error: 'Error deleting booking' });
    }
});

  // Protected route for admins only to see all users
  app.get('/api/admin/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const [users] = await db.query('SELECT user_id, name, email, department_id, role FROM users');
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  // Protected route for admins to see all bookings
  app.get('/api/admin/bookings', authenticateToken, requireAdmin, async (req, res) => {
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
  });

// Start server function
async function startServer() {
    try {
        await initializeDBConnection();
        
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error('Error starting server:', error);
    }
}

// Start the server
startServer();