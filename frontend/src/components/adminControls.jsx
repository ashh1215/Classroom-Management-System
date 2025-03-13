import React, { useState, useEffect } from "react";
import AdminNavBar from "./adminNavBar";
import TableView from "./tableView";
import "./admin.css";

const AdminControls = () => {
  // State for managing which table is active
  const [activeTable, setActiveTable] = useState("users");

  // State for storing the data of the active table
  const [tableData, setTableData] = useState([]);

  // State for tracking if data is loading
  const [loading, setLoading] = useState(true);

  const tables = [
    { id: "users", name: "Users" },
    { id: "rooms", name: "Rooms" },
    { id: "bookings", name: "Bookings" },
    { id: "time_slots", name: "Time Slots" },
    // TO ADD: DEPARTMENT TABLES HERE IF NECESSARY
  ];

  // Fetch data for the active table
  useEffect(() => {
    fetchTableData(activeTable);
  }, [activeTable]);

  // Function to fetch data for a given table
  const fetchTableData = async (tableName) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/admin/${tableName}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }

      const data = await response.json();
      setTableData(data);
    } catch (error) {
      console.error(`Error fetching ${tableName}:`, error);
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // Function to handle table tab click
  const handleTableChange = (tableName) => {
    setActiveTable(tableName);
  };

  // Function to handle record update
  const handleUpdateRecord = async (id, updatedData) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/admin/${activeTable}/${id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update record");
      }

      // Refresh the table data
      fetchTableData(activeTable);
    } catch (error) {
      console.error(`Error updating record:`, error);
    }
  };

  // Function to handle record deletion
  const handleDeleteRecord = async (id) => {

    if (!window.confirm("Are you sure you want to delete this record?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(
        `http://localhost:5000/api/admin/${activeTable}/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete record");
      }

      // Refresh the table data
      fetchTableData(activeTable);
    } catch (error) {
      console.error(`Error deleting record:`, error);
    }
  };

  return (
    <>
      <AdminNavBar />
      <div className="admin-container">
        <h1>Admin Controls</h1>

        <div className="table-tabs">
          {tables.map((table) => (
            <button
              key={table.id}
              className={activeTable === table.id ? "tab-active" : "tab"}
              onClick={() => handleTableChange(table.id)}
            >
              {table.name}
            </button>
          ))}
        </div>

        <div className="table-container">
          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <TableView
              tableName={activeTable}
              data={tableData}
              onUpdate={handleUpdateRecord}
              onDelete={handleDeleteRecord}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default AdminControls;
