import { useState,useRef } from 'react';
import SearchForm from './components/SearchForm';
import RoomsList from './components/RoomsList';
import './App.css';

function App() {
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
    
    try {
      const response = await fetch('http://localhost:5000/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomId: selectedRoom.room_id,
          date: searchCriteria.date,
          timeSlot: searchCriteria.timeSlot,
          // userId would come from auth context in a real app
          userId: 1
        }),
      });
      const data=await response.json();
      if (response.ok) {
        alert(data.message);
        setSelectedRoom(null);
        handleSearch(searchCriteria); // Refresh available rooms
      }
      setTimeout(()=>{
        containerRef.current?.scrollIntoView({behavior: 'smooth'});
      },100); 

    } catch (error) {
      console.error('Error booking room:', error);
    }
  };

  return (
    <div ref={containerRef} className="container" >
      <h1>Classroom Booking System</h1>
      <SearchForm onSearch={handleSearch} />
      <RoomsList 
        rooms={availableRooms}
        onRoomSelect={handleRoomSelect}
        selectedRoom={selectedRoom}
        searchCriteria={searchCriteria}
        onBookRoom={handleBookRoom}
      />
    </div>
  );
}

export default App;