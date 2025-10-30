import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import ChatRAGWidget from "../components/ChatRAG/ChatRAGWidget.jsx";

const StudentDashboard = ({ user }) => {
  if (!user) return <p>Loading...</p>; // ✅ Prevent errors if user is not loaded

  return (
    <div>
      <Sidebar />
      <Outlet
        context={{ studentName: user.firstName, studentEmail: user.email }}
      />
      <ChatRAGWidget />
    </div>
  );
};

export default StudentDashboard;
