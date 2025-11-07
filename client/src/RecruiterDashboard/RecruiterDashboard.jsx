import React from "react";
import { Outlet } from "react-router-dom";

export default function RecruiterDashboard() {
  return (
    <div style={{ marginLeft: 0 }}>
      <Outlet />
    </div>
  );
}


