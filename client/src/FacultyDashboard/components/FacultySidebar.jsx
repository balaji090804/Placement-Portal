import React from "react";
import styled from "styled-components";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaPlusSquare,
  FaSuitcase,
  FaChartBar,
  FaFileAlt,
  FaBullhorn,
  FaChalkboardTeacher,
  FaUserEdit,
  FaClipboardCheck,
  FaUsers,
  FaTasks,
  FaUserCheck,
  FaGraduationCap,
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
  border-top: 1px solid #1f2028;
  padding: 15px;
`;

const Sidebar = () => {
  return (
    <SidebarContainer>
      <SidebarHeader>FACULTY PORTAL</SidebarHeader>
      <SidebarMenu>
        <SidebarItem to="/FacultyDashboard/Dashboard">
          <FaHome />
          <span>Dashboard</span>
        </SidebarItem>

        <SidebarItem to="/FacultyDashboard/Practicepage">
          <FaPlusSquare />
          <span>Add Test Questions</span>
        </SidebarItem>

        <SidebarItem to="/FacultyDashboard/Interviews">
          <FaSuitcase />
          <span>Interviews</span>
        </SidebarItem>

        <SidebarItem to="/FacultyDashboard/JobMonitoring">
          <FaChartBar />
          <span>Job Monitoring</span>
        </SidebarItem>

        <SidebarItem to="/FacultyDashboard/ResumeReview">
          <FaFileAlt />
          <span>Resume Review</span>
        </SidebarItem>

        <SidebarItem to="/FacultyDashboard/Announcements">
          <FaBullhorn />
          <span>Announcements</span>
        </SidebarItem>

        <SidebarItem to="/FacultyDashboard/FacultyPlacementUpdate">
          <FaUserEdit />
          <span>Placement Update</span>
        </SidebarItem>

        <SidebarItem to="/FacultyDashboard/FacultyResultsUpdate">
          <FaClipboardCheck />
          <span>Results Upload</span>
        </SidebarItem>

        <SidebarItem to="/FacultyDashboard/ClassManagement">
          <FaChalkboardTeacher />
          <span>Class Management</span>
        </SidebarItem>

        <SidebarItem to="/FacultyDashboard/Projects">
          <FaTasks />
          <span>Project Assignments</span>
        </SidebarItem>

        <SidebarItem to="/FacultyDashboard/Attendance">
          <FaUserCheck />
          <span>Attendance</span>
        </SidebarItem>

        <SidebarItem to="/FacultyDashboard/StudentPerformance">
          <FaGraduationCap />
          <span>Student Performance</span>
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
