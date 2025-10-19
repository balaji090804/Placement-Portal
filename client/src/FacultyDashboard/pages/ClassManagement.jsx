import React, { useState } from "react";
import "../styles/ClassManagement.css";

const ClassManagement = () => {
  // Sample class data (manually entered)
  const [classes, setClasses] = useState([
    {
      id: 1,
      courseName: "Data Structures",
      department: "Computer Science",
      schedule: "Mon, Wed, Fri 10:00 AM - 11:00 AM",
      instructor: "Dr. John Doe",
      room: "Room 101"
    },
    {
      id: 2,
      courseName: "Algorithms",
      department: "Computer Science",
      schedule: "Tue, Thu 2:00 PM - 3:30 PM",
      instructor: "Dr. Jane Doe",
      room: "Room 102"
    },
    {
      id: 3,
      courseName: "Operating Systems",
      department: "Information Technology",
      schedule: "Mon, Wed 1:00 PM - 2:30 PM",
      instructor: "Dr. Mark Smith",
      room: "Room 201"
    }
  ]);

  // State for the new class form
  const [newClass, setNewClass] = useState({
    courseName: "",
    department: "",
    schedule: "",
    instructor: "",
    room: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClass((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAddClass = (e) => {
    e.preventDefault();
    if (
      newClass.courseName &&
      newClass.department &&
      newClass.schedule &&
      newClass.instructor &&
      newClass.room
    ) {
      const newId = classes.length ? classes[classes.length - 1].id + 1 : 1;
      setClasses([...classes, { id: newId, ...newClass }]);
      setNewClass({
        courseName: "",
        department: "",
        schedule: "",
        instructor: "",
        room: ""
      });
    }
  };

  return (
    <div className="class-management">
      <h1>Class Management</h1>
      <div className="class-list">
        <h2>Existing Classes</h2>
        {classes.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Department</th>
                <th>Schedule</th>
                <th>Instructor</th>
                <th>Room</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls.id}>
                  <td>{cls.courseName}</td>
                  <td>{cls.department}</td>
                  <td>{cls.schedule}</td>
                  <td>{cls.instructor}</td>
                  <td>{cls.room}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No classes available.</p>
        )}
      </div>
      <div className="add-class-form">
        <h2>Add New Class</h2>
        <form onSubmit={handleAddClass}>
          <div className="form-group">
            <label>Course Name:</label>
            <input
              type="text"
              name="courseName"
              value={newClass.courseName}
              onChange={handleInputChange}
              placeholder="Enter course name"
            />
          </div>
          <div className="form-group">
            <label>Department:</label>
            <input
              type="text"
              name="department"
              value={newClass.department}
              onChange={handleInputChange}
              placeholder="Enter department"
            />
          </div>
          <div className="form-group">
            <label>Schedule:</label>
            <input
              type="text"
              name="schedule"
              value={newClass.schedule}
              onChange={handleInputChange}
              placeholder="Enter schedule"
            />
          </div>
          <div className="form-group">
            <label>Instructor:</label>
            <input
              type="text"
              name="instructor"
              value={newClass.instructor}
              onChange={handleInputChange}
              placeholder="Enter instructor name"
            />
          </div>
          <div className="form-group">
            <label>Room:</label>
            <input
              type="text"
              name="room"
              value={newClass.room}
              onChange={handleInputChange}
              placeholder="Enter room number"
            />
          </div>
          <button type="submit">Add Class</button>
        </form>
      </div>
    </div>
  );
};

export default ClassManagement;
