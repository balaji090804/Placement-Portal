import React, { useState } from "react";
import "../styles/AdminStudents.css";

const AdminStudents = () => {
  const [students, setStudents] = useState([
    { id: 1, name: "Liam Roberts", email: "liam.roberts@example.com", department: "Computer Science", status: "Placed" },
    { id: 2, name: "Sophia Martinez", email: "sophia.martinez@example.com", department: "Information Technology", status: "Searching" },
    { id: 3, name: "James Brown", email: "james.brown@example.com", department: "Electronics", status: "Interview Scheduled" },
  ]);

  const removeStudent = (id) => {
    setStudents(students.filter((student) => student.id !== id));
  };

  const updateStatus = (id, newStatus) => {
    setStudents(students.map((student) => (student.id === id ? { ...student, status: newStatus } : student)));
  };

  return (
    <div className="admin-students">
      <h1>🎓 Student Management</h1>
      <table className="students-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <td>{student.name}</td>
              <td>{student.email}</td>
              <td>{student.department}</td>
              <td>
                <select value={student.status} onChange={(e) => updateStatus(student.id, e.target.value)}>
                  <option value="Placed">✅ Placed</option>
                  <option value="Searching">🔍 Searching</option>
                  <option value="Interview Scheduled">📅 Interview Scheduled</option>
                </select>
              </td>
              <td>
                <button className="remove-btn" onClick={() => removeStudent(student.id)}>🗑️ Remove</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminStudents;
