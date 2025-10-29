import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";
import { useState, useEffect } from "react";
import { fetchUserData as fetchUserDataApi } from "./api";
import "./app.css";
import Signup from "./components/Signup/Signup.jsx";
import Login from "./components/Login/Login.jsx";

// Admin
import AdminPlacementDashboard from "./Admindashboard/AdminPlacementDashboard.jsx";
import AdminRegistration from "./Admindashboard/pages/AdminRegistrations.jsx";
import AdminJobListings from "./Admindashboard/pages/AdminJobListings.jsx";
import AddPlacementRecord from "./Admindashboard/pages/AdminPlacementRecords.jsx";
import AdminAnnouncements from "./Admindashboard/pages/AdminAnnouncements.jsx";
import AdminFaculty from "./Admindashboard/pages/AdminFaculty.jsx";
import AdminStudentPerformance from "./Admindashboard/pages/AdminStudentPerformance.jsx";
import AdminStudents from "./Admindashboard/pages/AdminStudentPerformance.jsx";
import AdminDashboard from "./Admindashboard/pages/AdminDashboard.jsx";
import AdminPlacementCreate from "./Admindashboard/pages/AdminPlacementCreate.jsx";
import StudentPerformance from "./FacultyDashboard/pages/StudentPerformance.jsx";
import AUpcomingDrives from "./Admindashboard/pages/UpcomingDrives.jsx";
import AdminPlacementTracking from "./Admindashboard/pages/AdminPlacementTracking.jsx";

// Faculty
import FacultyDashboard from "./FacultyDashboard/FacultyDashboard.js";
import Practicepage from "./FacultyDashboard/pages/Practicepage.jsx";
import JobMonitoring from "./FacultyDashboard/pages/JobMonitoring.jsx";
import ResumeReview from "./FacultyDashboard/pages/ResumeReview.jsx";
import Announcements from "./FacultyDashboard/pages/Announcements.jsx";
import Interviews from "./FacultyDashboard/pages/Interviews.jsx";
import Dashboard from "./FacultyDashboard/pages/Dashboard.jsx";
import ClassManagement from "./FacultyDashboard/pages/ClassManagement.jsx";
import Projects from "./FacultyDashboard/pages/Projects.jsx";
import FStudentPerformance from "./FacultyDashboard/pages/StudentPerformance.jsx";
import Attendance from "./FacultyDashboard/pages/Attendance.jsx";
import FacultyPlacementUpdate from "./FacultyDashboard/pages/FacultyPlacementUpdate.jsx";
import FacultyResultsUpdate from "./FacultyDashboard/pages/FacultyResultsUpdate.jsx";
import FacultyAddAptitude from "./FacultyDashboard/pages/FacultyAddAptitude.jsx";
import FacultyAddCoding from "./FacultyDashboard/pages/FacultyAddCoding.jsx";
import FacultyAddCommunication from "./FacultyDashboard/pages/FacultyAddCommunication.jsx";
import FacultyAddDBMS from "./FacultyDashboard/pages/FacultyAddDBMS.jsx";
import FacultyAddDSA from "./FacultyDashboard/pages/FacultyAddDSA.jsx";
import FacultyAddNetworking from "./FacultyDashboard/pages/FacultyAddNetworking.jsx";
import FacultyAddOS from "./FacultyDashboard/pages/FacultyAddOS.jsx";
import FacultyAddTechnical from "./FacultyDashboard/pages/FacultyAddTechnical.jsx";

// Student
import StudentDashboard from "./StudentDashboard/App.js";
import HomeHero from "./StudentDashboard/components/HomeHero.jsx";
import JobPortal from "./StudentDashboard/pages/JobPortal.jsx";
import Practice from "./StudentDashboard/pages/Practice.jsx";
import DailyCoding from "./StudentDashboard/pages/DailyCoding";
import ResumeBuilder from "./StudentDashboard/pages/ResumeBuilder";
import InterviewPreparation from "./StudentDashboard/pages/InterviewPreparation.jsx";
import Aptitude from "./StudentDashboard/pages/AptitudeTest.jsx";
import PerformanceAnalytics from "./StudentDashboard/pages/PerformanceAnalytics.jsx";
import Todo from "./StudentDashboard/components/todo/Todo.js";
import Profile from "./StudentDashboard/pages/Profile.jsx"; // <-- The advanced Profile page
import Performancetracker from "./StudentDashboard/pages/Performancetracker.jsx";
import SAnnouncements from "./StudentDashboard/pages/StudentAnnouncements.jsx";
import UpcomingDrive from "./StudentDashboard/pages/UpcomingDrives.jsx";

// Use shared API helper instead of duplicating fetch logic

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      const data = await fetchUserDataApi();
      if (data) {
        setUser(data);
      }
      setLoading(false);
    };

    loadUserData();
  }, []);

  if (loading) return <p>Loading...</p>;

  return (
    <Router>
      <Routes>
        {/* Authentication Routes */}
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        {/* Always send root to login */}
        <Route path="/" element={<Navigate replace to="/login" />} />

        {/* Role-based Routing */}
        {user && (
          <>
            {user.role === "student" && (
              <Route
                path="/StudentDashboard"
                element={<StudentDashboard user={user} />}
              >
                {/* Nested Student Routes */}
                <Route path="HomeHero" element={<HomeHero />} />
                <Route
                  path="JobPortal"
                  element={
                    <JobPortal
                      studentName={user.firstName}
                      studentEmail={user.email}
                    />
                  }
                />
                <Route path="Practice" element={<Practice />} />
                <Route path="DailyCoding" element={<DailyCoding />} />
                <Route path="ResumeBuilder" element={<ResumeBuilder />} />
                <Route path="Aptitude" element={<Aptitude />} />
                <Route
                  path="InterviewPreparation"
                  element={<InterviewPreparation />}
                />
                <Route
                  path="PerformanceAnalytics"
                  element={<PerformanceAnalytics studentEmail={user.email} />}
                />
                <Route path="Todo" element={<Todo />} />
                <Route path="Profile" element={<Profile />} />
                <Route
                  path="Performancetracker"
                  element={<Performancetracker user={user} />}
                />
                <Route path="SAnnouncements" element={<SAnnouncements />} />
                <Route path="UpcomingDrive" element={<UpcomingDrive />} />
                <Route
                  path="StudentPerformance"
                  element={<StudentPerformance />}
                />
              </Route>
            )}

            {user.role === "admin" && (
              <Route
                path="/AdminPlacementDashboard"
                element={<AdminPlacementDashboard user={user} />}
              >
                {/* Nested Admin Routes */}
                <Route path="Add New Job" element={<AdminJobListings />} />
                <Route
                  path="AddPlacementRecord"
                  element={<AddPlacementRecord />}
                />
                <Route
                  path="AdminRegistration"
                  element={<AdminRegistration />}
                />
                <Route
                  path="AdminAnnouncements"
                  element={<AdminAnnouncements />}
                />
                <Route path="AdminFaculty" element={<AdminFaculty />} />
                <Route
                  path="AdminStudentPerformance"
                  element={<AdminStudentPerformance />}
                />
                <Route path="AdminStudents" element={<AdminStudents />} />
                <Route path="AdminDashboard" element={<AdminDashboard />} />
                <Route
                  path="AdminPlacementCreate"
                  element={<AdminPlacementCreate />}
                />
                <Route path="AUpcomingDrives" element={<AUpcomingDrives />} />
                <Route
                  path="AdminPlacementTracking"
                  element={<AdminPlacementTracking />}
                />
              </Route>
            )}

            {user.role === "faculty" && (
              <Route
                path="/FacultyDashboard"
                element={<FacultyDashboard user={user} />}
              >
                <Route path="Practicepage" element={<Practicepage />} />
                <Route path="Interviews" element={<Interviews />} />
                <Route path="Dashboard" element={<Dashboard />} />
                <Route path="JobMonitoring" element={<JobMonitoring />} />
                <Route path="ResumeReview" element={<ResumeReview />} />
                <Route path="Announcements" element={<Announcements />} />
                <Route
                  path="FacultyPlacementUpdate"
                  element={<FacultyPlacementUpdate />}
                />
                <Route path="ClassManagement" element={<ClassManagement />} />
                <Route path="Projects" element={<Projects />} />
                <Route
                  path="StudentPerformance"
                  element={<StudentPerformance />}
                />
                <Route path="Attendance" element={<Attendance />} />
                <Route
                  path="FacultyResultsUpdate"
                  element={<FacultyResultsUpdate />}
                />
                <Route
                  path="FacultyAddAptitude"
                  element={<FacultyAddAptitude />}
                />
                <Route path="FacultyAddCoding" element={<FacultyAddCoding />} />
                <Route
                  path="FacultyAddCommunication"
                  element={<FacultyAddCommunication />}
                />
                <Route path="FacultyAddDBMS" element={<FacultyAddDBMS />} />
                <Route path="FacultyAddDSA" element={<FacultyAddDSA />} />
                <Route
                  path="FacultyAddNetworking"
                  element={<FacultyAddNetworking />}
                />
                <Route path="FacultyAddOS" element={<FacultyAddOS />} />
                <Route
                  path="FacultyAddTechnical"
                  element={<FacultyAddTechnical />}
                />
              </Route>
            )}
          </>
        )}

        {/* Default Redirect based on user role */}
        <Route
          path="*"
          element={
            user ? (
              user.role === "admin" ? (
                <Navigate replace to="/AdminPlacementDashboard" />
              ) : user.role === "faculty" ? (
                <Navigate replace to="/FacultyDashboard" />
              ) : (
                <Navigate replace to="/StudentDashboard" />
              )
            ) : (
              <Navigate replace to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
