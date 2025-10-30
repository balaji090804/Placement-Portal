// src/FacultyDashboard/FacultyDashboard.js
import React from "react";
import Sidebar from "./components/FacultySidebar";
import "./styles/FacultyDashboard.css";
import { Outlet } from "react-router-dom";
import ChatRAGWidget from "../components/ChatRAG/ChatRAGWidget.jsx";

const FacultyDashboard = ({ user }) => {
  return (
    <div className="Faculty-dashboard">
      <Sidebar />
      {/* Pass the user object in the Outlet context */}
      <Outlet context={{ user }} />
      <ChatRAGWidget />
    </div>
  );
};

export default FacultyDashboard;
