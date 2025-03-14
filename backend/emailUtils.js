const nodemailer = require('nodemailer');
require('dotenv').config();


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Account creation email
const sendAccountCreationEmail = async (user) => {
  try {
    await transporter.sendMail({
      from: `"Classroom Booking System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Welcome to Classroom Booking System",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #4285f4;">Welcome to Classroom Booking System</h2>
          <p>Hello ${user.name},</p>
          <p>Your account has been successfully created.</p>
          <p><strong>User ID:</strong> ${user.user_id}</p>
          <p><strong>Email:</strong> ${user.email}</p>
          <p><strong>Role:</strong> ${user.role}</p>
          <p>You can now log in and start booking classrooms.</p>
          <p>Regards,<br>Classroom Booking System Team</p>
        </div>
      `
    });
    console.log(`Account creation email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending account creation email:', error);
    return false;
  }
};

// Booking Confirmation email
const sendBookingConfirmationEmail = async (user, booking, room, timeSlot) => {
  try {
    await transporter.sendMail({
      from: `"Classroom Booking System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Booking Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #4285f4;">Booking Confirmation</h2>
          <p>Hello ${user.name},</p>
          <p>Your booking has been confirmed.</p>
          <p><strong>Booking ID:</strong> ${booking.booking_id}</p>
          <p><strong>Room:</strong> ${room.room_name}</p>
          <p><strong>Date:</strong> ${new Date(booking.booking_date).toDateString()}</p>
          <p><strong>Time:</strong> ${timeSlot.start_time} - ${timeSlot.end_time}</p>
          <p>If you need to cancel this booking, please visit your profile page.</p>
          <p>Regards,<br>Classroom Booking System Team</p>
        </div>
      `
    });
    console.log(`Booking confirmation email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending booking confirmation email:', error);
    return false;
  }
};

// Booking cancellation email
const sendBookingCancellationEmail = async (user, booking, room, timeSlot) => {
  try {
    await transporter.sendMail({
      from: `"Classroom Booking System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Booking Cancellation Confirmation",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee;">
          <h2 style="color: #f44336;">Booking Cancellation</h2>
          <p>Hello ${user.name},</p>
          <p>Your booking has been cancelled successfully.</p>
          <p><strong>Booking ID:</strong> ${booking.booking_id}</p>
          <p><strong>Room:</strong> ${room.room_name}</p>
          <p><strong>Date:</strong> ${new Date(booking.booking_date).toDateString()}</p>
          <p><strong>Time:</strong> ${timeSlot.start_time} - ${timeSlot.end_time}</p>
          <p>You can make a new booking through the dashboard at any time.</p>
          <p>Regards,<br>Classroom Booking System Team</p>
        </div>
      `
    });
    console.log(`Booking cancellation email sent to ${user.email}`);
    return true;
  } catch (error) {
    console.error('Error sending booking cancellation email:', error);
    return false;
  }
};

module.exports = {
  sendAccountCreationEmail,
  sendBookingConfirmationEmail,
  sendBookingCancellationEmail
};