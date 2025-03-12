import { useState,useRef } from 'react';
import SearchForm from './SearchForm';
import RoomsList from './RoomsList';
import Navbar from './NavBar';
import './dashboard.css';

function Dashboard() {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchCriteria, setSearchCriteria] = useState({
    date: '',
    timeSlot: '',
    capacity: ''
  });

  const containerRef=useRef(null);

  const handleSearch = async (criteria) => {
    try {
      const response = await fetch(`http://localhost:5000/api/rooms/available?date=${criteria.date}&timeSlot=${criteria.timeSlot}&capacity=${criteria.capacity || 0}`);
      const data = await response.json();
      setAvailableRooms(data);
      setSearchCriteria(criteria);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  };

  const handleBookRoom = async () => {
    if (!selectedRoom) return;
    
    const token = localStorage.getItem('token');
    
    if (!token) {
      alert('Authentication token not found. Please log in again.');
      return;
    }
    
    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          roomId: selectedRoom.room_id,
          date: searchCriteria.date,
          timeSlot: searchCriteria.timeSlot
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server response:', errorText);
        alert('Booking failed: ' + (errorText || 'Unknown error'));
        return;
      }
      
      const data = await response.json();
      alert(data.message);
      
      // Reset everything to initial state
      setSelectedRoom(null);
      setAvailableRooms([]);
      setSearchCriteria({
        date: '',
        timeSlot: '',
        capacity: ''
      });
      
      // Scroll to the top of the page
      window.scrollTo({ top: 0, behavior: 'smooth' });
      
      // If you want to reset the form fields directly, you might need to use refs
      // or implement a resetForm function in your SearchForm component
      
    } catch (error) {
      console.error('Error details:', error);
      alert('Error booking room: ' + error.message);
    }
  };
  return (
    <>
    <Navbar></Navbar>
    <div ref={containerRef} className="container" >
      <SearchForm onSearch={handleSearch} />
      <RoomsList 
        rooms={availableRooms}
        onRoomSelect={handleRoomSelect}
        selectedRoom={selectedRoom}
        searchCriteria={searchCriteria}
        onBookRoom={handleBookRoom}
      />
    </div>
    </>
  );
}

export default Dashboard;