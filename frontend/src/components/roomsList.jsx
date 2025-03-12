import { useEffect,useRef } from "react";
import './roomsList.css';

function RoomsList({ rooms, onRoomSelect, selectedRoom, searchCriteria, onBookRoom }) {
  if (!rooms.length) return <p>No rooms found.</p>;

  const timeSlots = [
    { id: 1, text: '8:00 AM - 9:00 AM' },
    { id: 2, text: '9:00 AM - 10:00 AM' },
    { id: 3, text: '10:00 AM - 11:00 AM' },
    { id: 4, text: '11:00 AM - 12:00 PM' },
    { id: 5, text: '2:00 PM - 3:00 PM' },
    { id: 6, text: '3:00 PM - 4:00 PM' },
    { id: 7, text: '4:00 PM - 5:00 PM' },
    { id: 8, text: '5:00 PM - 6:00 PM' },
  ];

  const bookingDetailsRef=useRef(null);
  useEffect(()=>{
    if(selectedRoom){
      setTimeout(()=>{
        bookingDetailsRef.current?.scrollIntoView({behavior:'smooth',block:'start'});
      },100);
    }
  },[selectedRoom]);

  return (
    <div className="rooms-container">
      <div className="rooms-list">
        <h2 className="available-label">Available Rooms</h2>
        {rooms.map(room => (
          <div key={room.room_id} className="room-item">
            <div className="room-info">
              <span>Room: {room.room_name}</span>
              <span>Capacity: {room.capacity}</span>
            </div>
            <input
              type="checkbox"
              checked={selectedRoom?.room_id === room.room_id}
              onChange={() => onRoomSelect(room)}
            />
          </div>
        ))}
      </div>

      {selectedRoom && (
        <div ref={bookingDetailsRef} className="booking-details">
          <h3>Booking Details</h3>
          <p>Room: {selectedRoom.room_name}</p>
          <p>Date: {searchCriteria.date}</p>
          <p>Time: {timeSlots.find(slot=>slot.id===Number(searchCriteria.timeSlot))?.text}</p>
          <button onClick={onBookRoom}>Book Room</button>
        </div>
      )}
    </div>
  );
}

export default RoomsList;