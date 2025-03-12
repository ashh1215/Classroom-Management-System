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
      res.status(500).json({ error: error.message });
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


// Protected route for regular users to see their bookings
app.get('/api/user/bookings', authenticateToken, async (req, res) => {
    try {
      const [bookings] = await db.query(
        `SELECT b.*, r.room_name 
         FROM bookings b 
         JOIN rooms r ON b.room_id = r.room_id 
         WHERE b.user_id = ?`, 
        [req.user.id]
      );
      res.json(bookings);
    } catch (error) {
      res.status(500).json({ error: error.message });
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