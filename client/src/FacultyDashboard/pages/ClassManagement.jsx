import React, { useEffect, useState } from "react";
import "../styles/ClassManagement.css";
import { toast } from "react-toastify";
// Correct relative path to global app styles (was ../../../app.css causing module not found)
import "../../app.css";

const ClassManagement = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadClasses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/classes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      setClasses(Array.isArray(data) ? data : []);
    } catch (e) {
      toast.error("Failed to load classes");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { loadClasses(); }, []);

  // State for the new class form
  const [newClass, setNewClass] = useState({
    courseName: "",
    department: "",
    schedule: "",
    instructor: "",
    room: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClass((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClass.courseName || !newClass.department) {
      toast.error("Course name and department are required");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newClass),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Failed (${res.status})`);
      }
      toast.success("Class created");
      setNewClass({ courseName: "", department: "", schedule: "", instructor: "", room: "" });
      loadClasses();
    } catch (err) {
      toast.error(err.message || "Failed to create class");
    }
  };

  const [studentEmail, setStudentEmail] = useState("");
  const [taskText, setTaskText] = useState("");
  const [taskPriority, setTaskPriority] = useState("Medium");
  const [taskDue, setTaskDue] = useState("");
  const [assigning, setAssigning] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [deptAssign, setDeptAssign] = useState("");
  const [branches, setBranches] = useState([]);
  const loadBranches = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/classes/branches", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const j = await res.json();
      setBranches(Array.isArray(j?.branches) ? j.branches : []);
    } catch {}
  };
  useEffect(() => { loadBranches(); }, []);

  const assignTask = async (e) => {
    e.preventDefault();
    if (!taskText.trim()) {
      toast.error("Task text required");
      return;
    }
    setAssigning(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("http://localhost:8080/api/tasks/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentEmail: studentEmail || undefined,
          classId: selectedClassId || undefined,
          department: deptAssign || undefined,
          text: taskText,
          priority: taskPriority,
          dueDate: taskDue || undefined,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.message || `Failed (${res.status})`);
      }
      toast.success("Task assigned");
      setTaskText("");
      setTaskDue("");
      setTaskPriority("Medium");
      setSelectedClassId("");
      setDeptAssign("");
    } catch (err) {
      toast.error(err.message || "Failed to assign task");
    } finally {
      setAssigning(false);
    }
  };

  // Add student to class
  const [addEmail, setAddEmail] = useState("");
  const [addClassId, setAddClassId] = useState("");
  const addStudentToClass = async (e) => {
    e.preventDefault();
    if (!addClassId || !addEmail) {
      toast.error("Select class and enter student email");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`http://localhost:8080/api/classes/${addClassId}/students`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: addEmail }),
      });
      if (!res.ok) throw new Error("Failed to add student");
      toast.success("Student added to class");
      setAddEmail("");
      loadClasses();
    } catch (err) {
      toast.error(err.message || "Failed to add student");
    }
  };

  return (
    <div className="class-management" style={{ marginLeft: 220 }}>
      <h1 style={{ marginBottom: 12 }}>Class Management</h1>
      <div className="card" style={{ padding: 16, marginBottom: 24 }}>
        <h2 className="section-title" style={{ marginBottom: 8 }}>
          Assign Daily Task
        </h2>
        <form
          onSubmit={assignTask}
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 1fr 2fr 1fr 1fr 1fr auto",
            gap: 12,
            alignItems: "center",
          }}
        >
          <input
            type="email"
            placeholder="Student email"
            value={studentEmail}
            onChange={(e) => setStudentEmail(e.target.value)}
          />
          <>
            <input
              type="text"
              placeholder="Department/Branch (e.g., CSE)"
              value={deptAssign}
              onChange={(e) => setDeptAssign(e.target.value)}
              list="branchesList"
            />
            <datalist id="branchesList">
              {branches.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </>
          <select
            value={selectedClassId}
            onChange={(e) => setSelectedClassId(e.target.value)}
          >
            <option value="">Assign to class (optional)</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.courseName} — {c.department}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Task description"
            value={taskText}
            onChange={(e) => setTaskText(e.target.value)}
          />
          <select
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <input
            type="date"
            value={taskDue}
            onChange={(e) => setTaskDue(e.target.value)}
          />
          <button className="btn btn-primary" disabled={assigning}>
            {assigning ? "Assigning..." : "Assign"}
          </button>
        </form>
        <p style={{ fontSize: 12, marginTop: 8, color: "var(--muted-color)" }}>
          The student will see this under Daily Tasks grouped by Due Today /
          Upcoming / Overdue sections.
        </p>
      </div>
      <div className="class-list">
        <h2>Existing Classes</h2>
        {loading ? (
          <p>Loading...</p>
        ) : classes.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>Course Name</th>
                <th>Department</th>
                <th>Schedule</th>
                <th>Instructor</th>
                <th>Room</th>
                <th>Students</th>
              </tr>
            </thead>
            <tbody>
              {classes.map((cls) => (
                <tr key={cls._id}>
                  <td>{cls.courseName}</td>
                  <td>{cls.department}</td>
                  <td>{cls.schedule}</td>
                  <td>{cls.instructor}</td>
                  <td>{cls.room}</td>
                  <td>{(cls.studentEmails || []).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No classes available.</p>
        )}
      </div>
      <div className="card" style={{ padding: 16, marginTop: 16 }}>
        <h2 className="section-title" style={{ marginBottom: 8 }}>Add Student to Class</h2>
        <form onSubmit={addStudentToClass} style={{ display: "grid", gridTemplateColumns: "1fr 2fr auto", gap: 12 }}>
          <select value={addClassId} onChange={(e) => setAddClassId(e.target.value)}>
            <option value="">Select class</option>
            {classes.map((c) => (
              <option key={c._id} value={c._id}>
                {c.courseName} — {c.department}
              </option>
            ))}
          </select>
          <input type="email" placeholder="Student email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} />
          <button className="btn btn-primary">Add</button>
        </form>
        <p style={{ fontSize: 12, marginTop: 6, color: "var(--muted-color)" }}>Tip: Only registered student emails will be added.</p>
      </div>
      <div
        className="add-class-form card"
        style={{ padding: 16, marginTop: 24 }}
      >
        <h2 className="section-title" style={{ marginBottom: 8 }}>
          Add New Class
        </h2>
        <form onSubmit={handleAddClass} style={{ display: "grid", gap: 12 }}>
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
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "fit-content" }}
          >
            Add Class
          </button>
        </form>
      </div>
    </div>
  );
};

export default ClassManagement;
