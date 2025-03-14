# Classroom Booking System

A web-based system for booking classrooms, featuring user authentication, an admin panel, and automated email notifications.

## Features
- User authentication (login/logout)
- Role-based access control (Admin & Normal Users)
- Classroom booking with availability checks
- Email notifications for account creation, booking confirmation, and cancellations
- Admin panel for managing rooms, bookings, and users

## Technologies Used
- **Frontend:** React, CSS,
- **Backend:** Node.js, Express, MySQL
- **Authentication:** JWT-based authentication
- **Email Notifications:** Nodemailer (with App Passwords for Gmail)

---

## 🗄️ Database Setup

Ensure you have **MySQL installed** and running on your system.
Create the database by running the provided `setup.sql` file

---

## Frontend

### Installation & Setup
```sh
# Navigate to the frontend directory
cd frontend

# Install dependencies
npm install

# Start the development server
npm run dev
```

## Backend

### Installation & Setup
```sh
# Navigate to the backend directory
cd backend

# Install dependencies
npm install

# Start the server
node server.js
```

### Email Notifications
- Uses **Nodemailer** for sending emails
- App Passwords are used for authentication
- Sends confirmation/cancellation emails automatically

---

## Environment Variables
Create a `.env` file in the `backend/` directory with the required keys as given below.


### Backend `.env`
```
PORT=5000
DB_HOST=
DB_USER=
DB_PASSWORD=
DB_NAME=
JWT_SECRET=
EMAIL_USER=
EMAIL_PASSWORD=
```

---
## 🔗 API Endpoints

### 🔑 Authentication
| Method | Endpoint                 | Description              |
|--------|--------------------------|--------------------------|
| POST   | `/api/auth/login`        | User login (email or ID) |
| POST   | `/api/auth/register`     | Register new user       |
| POST   | `/api/user/change-password` | Change user password |

### 📅 Booking Management
| Method | Endpoint                  | Description                  |
|--------|---------------------------|------------------------------|
| GET    | `/api/rooms/available`    | Fetch available rooms       |
| POST   | `/api/bookings`           | Create a new booking        |
| GET    | `/api/user/bookings`      | Get user’s bookings         |
| DELETE | `/api/bookings/:id`       | Cancel a booking            |

### 👤 User Management
| Method | Endpoint               | Description              |
|--------|------------------------|--------------------------|
| GET    | `/api/user/me`         | Get user profile        |
| PUT    | `/api/user/me`         | Update user profile     |

### 🛠️ Admin API
| Method | Endpoint               | Description                      |
|--------|------------------------|----------------------------------|
| GET    | `/api/admin/users`     | Get all users                   |
| PUT    | `/api/admin/users/:id` | Update user details             |
| DELETE | `/api/admin/users/:id` | Delete a user                   |
| GET    | `/api/admin/bookings`  | Get all bookings                |
| PUT    | `/api/admin/bookings/:id` | Update a booking             |
| DELETE | `/api/admin/bookings/:id` | Delete a booking             |
| GET    | `/api/admin/rooms`     | Get all rooms                   |
| PUT    | `/api/admin/rooms/:id` | Update room details             |
| DELETE | `/api/admin/rooms/:id` | Delete a room                   |
| GET    | `/api/admin/time_slots` | Get available time slots       |
| PUT    | `/api/admin/time_slots/:id` | Update a time slot         |
| DELETE | `/api/admin/time_slots/:id` | Delete a time slot         |

### 🔒 Security
| Middleware         | Description                                  |
|--------------------|----------------------------------------------|
| `authenticateToken` | Protects routes for logged-in users        |
| `requireAdmin`     | Restricts specific routes to admin users    |

---


