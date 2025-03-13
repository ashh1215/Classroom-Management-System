import React, { useState, useEffect } from 'react';
import Navbar from './NavBar';
import AdminNavbar from './adminNavBar';
import './Profile.css';

const Profile = () => {
  const [userInfo, setUserInfo] = useState({
    user_id: '',
    name: '',
    email: '',
    department_id: '',
    role: ''
  });
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const userResponse = await fetch('http://localhost:5000/api/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const userData = await userResponse.json();
      setUserInfo(userData);
      
      const bookingsResponse = await fetch('http://localhost:5000/api/user/bookings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const bookingsData = await bookingsResponse.json();
      setBookings(bookingsData);
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setLoading(false);
      showMessage('Failed to load user data', 'error');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserInfo({
      ...userInfo,
      [name]: value
    });
  };

  const handlePasswordInputChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
  };

  const toggleEdit = async () => {
    if (isEditing) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/user/me', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: userInfo.name,
            email: userInfo.email,
            department_id: userInfo.department_id
          })
        });
        
        if (!response.ok) {
          throw new Error('Failed to update profile');
        }
        
        // Refresh user data
        await fetchUserData();
        showMessage('Profile updated successfully', 'success');
        
      } catch (err) {
        console.error('Error updating profile:', err);
        showMessage('Failed to update profile', 'error');
      }
    }
    
    // Toggle editing state
    setIsEditing(!isEditing);
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete booking');
      }
      
      // Refresh bookings data
      await fetchUserData();
      showMessage('Booking cancelled successfully', 'success');
    } catch (err) {
      console.error('Error deleting booking:', err);
      showMessage(err.message || 'Failed to cancel booking', 'error');
    }
  };

  const openPasswordModal = () => {
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      showMessage('New passwords do not match', 'error');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }
      
      closePasswordModal();
      showMessage('Password changed successfully', 'success');
    } catch (err) {
      console.error('Error changing password:', err);
      showMessage(err.message || 'Failed to change password', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Format time for display
  const formatTime = (timeString) => {
    if (!timeString) return '';
    return timeString.substring(0, 5);
  };

  if (loading) {
    return (
      <>
        {userInfo.role === 'admin' ? <AdminNavbar /> : <Navbar />}
        <div className="profile-page">
          <div className="loading">Loading...</div>
        </div>
      </>
    );
  }

  return (
    <>
      {userInfo.role === 'admin' ? <AdminNavbar /> : <Navbar />}
      <div className="profile-page">
        {message.text && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
        
        <div className="profile-header">
          <h1>User Profile</h1>
          {!isEditing && (
            <button 
              className="change-password-button" 
              onClick={openPasswordModal}
              style={{display: 'block'}}
            >
              Change Password
            </button>
          )}
        </div>
        
        <div className="user-details-container">
          <div className="user-details">
            <div className="detail-box">
              <label>Name</label>
              <input 
                type="text" 
                name="name" 
                value={userInfo.name || ''} 
                onChange={handleInputChange} 
                disabled={!isEditing} 
              />
            </div>
            
            <div className="detail-box">
              <label>Email</label>
              <input 
                type="email" 
                name="email" 
                value={userInfo.email || ''} 
                onChange={handleInputChange} 
                disabled={!isEditing} 
              />
            </div>
            
            <div className="detail-box">
              <label>Department ID</label>
              <input 
                type="text" 
                name="department_id" 
                value={userInfo.department_id || ''} 
                onChange={handleInputChange} 
                disabled={!isEditing} 
              />
            </div>
            
            <div className="detail-box">
              <label>Role</label>
              <input 
                type="text" 
                name="role" 
                value={userInfo.role || ''} 
                disabled={true} // Role is always disabled
              />
            </div>
            
          </div>
          <div className="buttons-container">
                <button 
                className={isEditing ? "save-button" : "edit-button"} 
                onClick={toggleEdit}
                >
                {isEditing ? 'Save' : 'Edit'}
                </button>
                
                {!isEditing && (
                <button 
                    className="change-password-button" 
                    onClick={openPasswordModal}
                >
                    Change Password
                </button>
                )}
            </div>
        </div>
        
        <div className="bookings-section">
          <h2>Booking History</h2>
          
          {bookings.length === 0 ? (
            <p className="no-bookings">No booking history found.</p>
          ) : (
            <table className="bookings-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Room</th>
                  <th>Date</th>
                  <th>Time Slot</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((booking) => (
                  <tr key={booking.booking_id}>
                    <td>{booking.booking_id}</td>
                    <td>{booking.room_name}</td>
                    <td>{formatDate(booking.date)}</td>
                    <td>{formatTime(booking.start_time)} - {formatTime(booking.end_time)}</td>
                    <td className={`status-${booking.status}`}>
                      {booking.status}
                    </td>
                    <td>
                      {booking.status === 'upcoming' && (
                        <button 
                          className="delete-button" 
                          onClick={() => handleDeleteBooking(booking.booking_id)}
                        >
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        
        {showPasswordModal && (
          <div className="modal-backdrop">
            <div className="modal">
              <div className="modal-header">
                <h3>Change Password</h3>
                <button className="close-button" onClick={closePasswordModal}>×</button>
              </div>
              <form onSubmit={handleChangePassword}>
                <div className="form-group">
                  <label>Current Password</label>
                  <input 
                    type="password" 
                    name="currentPassword" 
                    value={passwordData.currentPassword} 
                    onChange={handlePasswordInputChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>New Password</label>
                  <input 
                    type="password" 
                    name="newPassword" 
                    value={passwordData.newPassword} 
                    onChange={handlePasswordInputChange} 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label>Confirm New Password</label>
                  <input 
                    type="password" 
                    name="confirmPassword" 
                    value={passwordData.confirmPassword} 
                    onChange={handlePasswordInputChange} 
                    required 
                  />
                </div>
                <div className="modal-buttons">
                  <button type="submit" className="save-button">Change Password</button>
                  <button type="button" className="cancel-button" onClick={closePasswordModal}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Profile;