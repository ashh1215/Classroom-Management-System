import { useState, useEffect, useRef } from "react";
import SearchForm from "./searchForm";
import RoomsList from "./roomsList";
import Navbar from "./NavBar";
import AdminNavbar from "./adminNavBar";
import "./dashboard.css";

function Dashboard() {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [searchCriteria, setSearchCriteria] = useState({
    date: "",
    timeSlot: "",
    capacity: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef(null);

  const [userInfo, setUserInfo] = useState({
    user_id: "",
    name: "",
    email: "",
    department_id: "",
    role: "",
  });
  useEffect(() => {
    fetchUserData();
  }, []);
  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem("token");

      const userResponse = await fetch("http://localhost:5000/api/user/me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = await userResponse.json();
      setUserInfo(userData);
    } catch (err) {
      console.error("Error fetching user data:", err);
      showMessage("Failed to load user data", "error");
    }
  };

  const handleSearch = async (criteria) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/api/rooms/available?date=${
          criteria.date
        }&timeSlot=${criteria.timeSlot}&capacity=${criteria.capacity || 0}`
      );
      const data = await response.json();
      setAvailableRooms(data);
      setSearchCriteria(criteria);
    } catch (error) {
      console.error("Error fetching rooms:", error);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 100);
    }
  };

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
  };

  const handleBookRoom = async () => {
    if (!selectedRoom) return;

    const token = localStorage.getItem("token");

    if (!token) {
      alert("Authentication token not found. Please log in again.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          roomId: selectedRoom.room_id,
          date: searchCriteria.date,
          timeSlot: searchCriteria.timeSlot,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Server response:", errorText);
        alert("Booking failed: " + (errorText || "Unknown error"));
        return;
      }

      const data = await response.json();
      alert(data.message);

      // Reset everything to initial state
      setSelectedRoom(null);
      setAvailableRooms([]);
      setSearchCriteria({
        date: "",
        timeSlot: "",
        capacity: "",
      });

      // Scroll to the top of the page
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("Error details:", error);
      alert("Error booking room: " + error.message);
    }

    
  };
  return (
    <>
      {userInfo && userInfo.role === "admin" ? <AdminNavbar /> : <Navbar />}
      <div ref={containerRef} className="container">
        <SearchForm onSearch={handleSearch} />
        {isLoading ? (
          <div className="loading-container">
            <p>Searching for available rooms...</p>
          </div>
        ) : (
          <RoomsList
            rooms={availableRooms}
            onRoomSelect={handleRoomSelect}
            selectedRoom={selectedRoom}
            searchCriteria={searchCriteria}
            onBookRoom={handleBookRoom}
          />
        )}
      </div>
    </>
  );
}

export default Dashboard;
