import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaClipboardCheck,
  FaBriefcase,
  FaChartBar,
  FaFileAlt,
  FaUserCheck,
  FaUserGraduate,
  FaUserCog,
  FaSignOutAlt,
  FaBullhorn,
  FaPlus,
  FaListAlt
} from "react-icons/fa";

const SidebarContainer = styled.div`
  background: #15171c;
  width: 220px;
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 100;
  padding-top: 15px;
`;

const SidebarHeader = styled.div`
  width: 100%;
  text-align: left;
  font-size: 14px;
  font-weight: bold;
  color: white;
  padding: 15px;
  white-space: nowrap;
`;

const SidebarMenu = styled.div`
  width: 100%;
  margin-top: 10px;
`;

const SidebarItem = styled(NavLink)`
  display: flex;
  align-items: center;
  padding: 12px 15px;
  font-size: 12px;
  font-weight: 500;
  color: white;
  text-decoration: none;
  transition: 0.3s ease-in-out;
  gap: 12px;
  white-space: nowrap;

  &:hover {
    background: #1f2028;
    transform: scale(1.05);
  }

  &.active {
    background: #1c3faa;
    border-left: 4px solid #fca61f;
  }

  svg {
    font-size: 18px;
  }
`;

const SidebarFooter = styled.div`
  margin-top: auto;
  width: 100%;
  padding: 15px;
  border-top: 1px solid #1f2028;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const Sidebar = () => {
  return (
    <SidebarContainer>
      <SidebarHeader>BIT ADMIN PORTAL</SidebarHeader>
      <SidebarMenu>
        <SidebarItem to="/AdminPlacementDashboard/AdminDashboard">
          <FaHome />
          <span>Dashboard</span>
        </SidebarItem>

        {/* Job Management */}
        <SidebarItem to="/AdminPlacementDashboard/Add New Job">
          <FaBriefcase />
          <span>Job Listings</span>
        </SidebarItem>
        <SidebarItem to="/AdminPlacementDashboard/AdminRegistration">
          <FaClipboardCheck />
          <span>Job Applications</span>
        </SidebarItem>

        {/* Placement Management */}
        <SidebarItem to="/AdminPlacementDashboard/AdminPlacementCreate">
          <FaPlus />
          <span>Create Placement Drive</span>
        </SidebarItem>
        <SidebarItem to="/AdminPlacementDashboard/AddPlacementRecord">
          <FaFileAlt />
          <span>Placement Records</span>
        </SidebarItem>
        <SidebarItem to="/AdminPlacementDashboard/AdminPlacementTracking">
          <FaListAlt />
          <span>Placement Tracking</span>
        </SidebarItem>

        {/* Performance and Announcements */}
        <SidebarItem to="/AdminPlacementDashboard/AdminStudentPerformance">
          <FaChartBar />
          <span>Student Performance</span>
        </SidebarItem>
        <SidebarItem to="/AdminPlacementDashboard/AUpcomingDrives">
          <FaBullhorn />
          <span>Upcoming Drives</span>
        </SidebarItem>
      </SidebarMenu>

      {/* Footer */}
      <SidebarFooter>
        <SidebarItem to="/Login">
          <FaSignOutAlt />
          <span>Logout</span>
        </SidebarItem>
      </SidebarFooter>
    </SidebarContainer>
  );
};

export default Sidebar;
