import React, { useState } from "react";
import "./admin.css";

// TableView - Renders chosen table
const TableView = ({ tableName, data, onUpdate, onDelete }) => {
  if (data.length === 0) {
    return <div className="no-data">No data available for this table.</div>;
  }

  // Get column names from the first object's keys
  const columns = Object.keys(data[0]);

  return (
    <table className="admin-table">
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column}>{column.replace("_", " ")}</th>
          ))}
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {data.map((record) => (
          <TableRow
            key={
              record.id ||
              record.user_id ||
              record.room_id ||
              record.booking_id ||
              record.slot_id
            }
            record={record}
            columns={columns}
            onUpdate={onUpdate}
            onDelete={onDelete}
          />
        ))}
      </tbody>
    </table>
  );
};

// TableRow - Each row editing/viewing
const TableRow = ({ record, columns, onUpdate, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedRecord, setEditedRecord] = useState({ ...record });

  // Get ID field based on table (user_id, room_id, etc.)
  const idField = Object.keys(record).find((key) => key.endsWith("_id"));
  const recordId = record[idField];

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onUpdate(recordId, editedRecord);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedRecord({ ...record });
    setIsEditing(false);
  };

  const handleChange = (e, column) => {
    setEditedRecord({
      ...editedRecord,
      [column]: e.target.value,
    });
  };

  return (
    <tr>
      {columns.map((column) => (
        <td key={column}>
          {isEditing && column !== idField ? (
            <input
              type="text"
              value={editedRecord[column] || ""}
              onChange={(e) => handleChange(e, column)}
            />
          ) : (
            record[column]
          )}
        </td>
      ))}
      <td className="action-buttons">
        {isEditing ? (
          <>
            <button className="save-button" onClick={handleSave}>
              Save
            </button>
            <button className="cancel-button" onClick={handleCancel}>
              Cancel
            </button>
          </>
        ) : (
          <>
            <button className="edit-button" onClick={handleEdit}>
              Edit
            </button>
            <button
              className="delete-button"
              onClick={() => onDelete(recordId)}
            >
              Delete
            </button>
          </>
        )}
      </td>
    </tr>
  );
};

export default TableView;
