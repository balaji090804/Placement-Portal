import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaUserCircle,
  FaCode,
  FaBookOpen,
  FaTasks,
  FaClipboardCheck,
  FaBriefcase,
  FaChartLine,
  FaFileAlt,
  FaCalendarCheck,
  FaBullhorn,
  FaSignOutAlt,
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

const SidebarFooter = styled.div`
  margin-top: auto;
  width: 100%;
  padding: 15px;
  border-top: 1px solid #1f2028;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
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

const Sidebar = () => {
  return (
    <SidebarContainer>
      <SidebarHeader>PLACEMENT PORTAL</SidebarHeader>
      <SidebarMenu>
        <SidebarItem to="/StudentDashboard" end>
          <FaHome />
          <span>Dashboard</span>
        </SidebarItem>
        <SidebarItem to="/StudentDashboard/Profile">
          <FaUserCircle />
          <span>Profile</span>
        </SidebarItem>
        <SidebarItem to="/StudentDashboard/Practice">
          <FaCode />
          <span>Practice</span>
        </SidebarItem>
        <SidebarItem to="/StudentDashboard/DailyCoding">
          <FaBookOpen />
          <span>Daily Coding</span>
        </SidebarItem>
        <SidebarItem to="/StudentDashboard/Todo">
          <FaTasks />
          <span>Daily Tasks</span>
        </SidebarItem>
        <SidebarItem to="/StudentDashboard/InterviewPreparation">
          <FaClipboardCheck />
          <span>Interview Prep</span>
        </SidebarItem>
        <SidebarItem to="/StudentDashboard/JobPortal">
          <FaBriefcase />
          <span>Job Portal</span>
        </SidebarItem>
        <SidebarItem to="/StudentDashboard/Performancetracker">
          <FaChartLine />
          <span>Performance Tracker</span>
        </SidebarItem>
        <SidebarItem to="/StudentDashboard/ResumeBuilder">
          <FaFileAlt />
          <span>Create Resume</span>
        </SidebarItem>
        <SidebarItem to="/StudentDashboard/SAnnouncements">
          <FaBullhorn />
          <span>Announcements</span>
        </SidebarItem>
        <SidebarItem to="/StudentDashboard/UpcomingDrive">
          <FaCalendarCheck />
          <span>Upcoming Drives</span>
        </SidebarItem>
      </SidebarMenu>

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
