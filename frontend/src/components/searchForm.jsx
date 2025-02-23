import { useState } from 'react';

function SearchForm({ onSearch }) {
  const [date, setDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [capacity, setCapacity] = useState('');

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

  const handleSubmit=(e)=>{
    e.preventDefault();
    onSearch({ date, timeSlot, capacity });
  };

  return (
    <form onSubmit={handleSubmit} className="search-form">
      <div className="form-group">
        <input
          type="date"
          placeholder='Choose date'
          value={date}
          onChange={(e)=>setDate(e.target.value)}
          required
        />
      </div>

      <div className="form-group">
        <select
          value={timeSlot}
          onChange={(e)=>setTimeSlot(e.target.value)}
          required
        >
          <option value="">Select Time Slot</option>
          {timeSlots.map(slot=>(
            <option key={slot.id} value={slot.id}>
              {slot.text}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <input
          type="number"
          placeholder="Minimum Capacity"
          value={capacity}
          onChange={(e) => setCapacity(e.target.value)}
        />
      </div>

      <button type="submit">View Available Rooms</button>
    </form>
  );
}

export default SearchForm;