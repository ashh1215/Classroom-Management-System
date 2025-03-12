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
    <form onSubmit={handleSubmit} className="search-form" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
  <div className="form-group" style={{ position: 'relative' }}>
  <input
    type="date"
    value={date}
    onChange={(e)=>setDate(e.target.value)}
    required
    min={new Date().toISOString().split("T")[0]}
    style={{
      width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        height: '38px',
        boxSizing: 'border-box',
      zIndex: 1
    }}
    onClick={(e) => {
      e.currentTarget.showPicker && e.currentTarget.showPicker();
    }}
  />
</div>

  <div className="form-group">
    <select
      value={timeSlot}
      onChange={(e)=>setTimeSlot(e.target.value)}
      required
      style={{
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        height: '38px',
        boxSizing: 'border-box'
      }}
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
      onChange={(e)=>setCapacity(e.target.value)}
      style={{
        width: '100%',
        padding: '8px',
        borderRadius: '4px',
        border: '1px solid #ccc',
        height: '38px',
        boxSizing: 'border-box'
      }}
    />
  </div>

  <div className="form-group">
  <button 
    className='search-room-button'
    type="submit"
    style={{
      padding: '8px',
      height: '38px',
      lineHeight: '38px',
      borderRadius: '4px',
      border: 'none',
      backgroundColor: '#007bff',
      color: 'white',
      cursor: 'pointer',
      boxSizing: 'border-box',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      whiteSpace: 'nowrap'
    }}
  >
    View Available Rooms
  </button>
  </div>
</form>
  );
}

export default SearchForm;