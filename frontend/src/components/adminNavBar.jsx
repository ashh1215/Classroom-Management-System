import { useNavigate } from "react-router-dom";
import "./adminNavBar.css";
import "./Navbar.css";

function AdminNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");

    navigate("/");
  };

  return (
    <nav className="navbar">
      <h2 className="navbar-title" onClick={() => navigate("/dashboard")}>
        Classroom Booking System
      </h2>

      <div className="navbar-menu">
        <span
          className="navbar-admin"
          onClick={() => navigate("/adminControls")}
        >
          Admin Controls
        </span>
        <span className="navbar-profile" onClick={() => navigate("/profile")}>
          Profile
        </span>
        <button className="logout-button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}

export default AdminNavbar;
