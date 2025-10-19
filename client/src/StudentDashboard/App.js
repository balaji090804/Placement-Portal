import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";

const StudentDashboard = ({ user }) => {
  if (!user) return <p>Loading...</p>; // ✅ Prevent errors if user is not loaded

  return (
    <div>
      <Sidebar />
      <Outlet context={{ studentName: user.firstName, studentEmail: user.email }} />
    </div>
  );
};

export default StudentDashboard;
