require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

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
app.post('/api/bookings', async (req, res) => {
    try {
        const date=req.body.date;
        const roomId=req.body.roomId;
        const userId=req.body.userId;
        const timeSlot=parseInt(req.body.timeSlot);

        const query=`insert into bookings (room_id, user_id, booking_date, slot_id) values (?,?,?,'?')`;
        const [rows] = await db.query(query, [roomId,userId,date,timeSlot]);
        console.log('inserted');
        res.status(201).json({ message: 'Booking successful' });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Error creating post' });
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