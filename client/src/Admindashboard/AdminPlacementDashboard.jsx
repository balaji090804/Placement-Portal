import React, { useState } from "react";
import Sidebar from "./components/AdminSidebar";
import { Outlet } from "react-router-dom";
import ChatRAGWidget from "../components/ChatRAG/ChatRAGWidget.jsx";

const AdminPlacementDashboard = ({ user }) => {
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

export default AdminPlacementDashboard;
