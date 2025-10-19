import React, { useState } from "react";
import "../styles/Projects.css";

const Projects = () => {
  const [projects] = useState([
    {
      id: 1,
      title: "Portfolio Website",
      description:
        "A personal portfolio website built with React and styled-components focusing on modern design and responsive layouts.",
      technologies: ["React", "Styled-Components", "JavaScript"],
      link: "https://github.com/username/portfolio",
      studentName: "Mitun",
      enrollmentYear: 2022,
      major: "Computer Science",
      teamSize: 1,
      projectDuration: "3 months",
      completionDate: "2023-06-15",
      projectStatus: "Completed",
      supervisorFeedback:
        "Excellent design and implementation with a focus on responsiveness and performance.",
    },
    {
      id: 2,
      title: "E-commerce App",
      description:
        "A full-stack e-commerce application built with Node.js, Express, and MongoDB, featuring a dynamic frontend using React.",
      technologies: ["Node.js", "Express", "MongoDB", "React"],
      link: "https://github.com/username/ecommerce-app",
      studentName: "Selvarasi",
      enrollmentYear: 2021,
      major: "Information Technology",
      teamSize: 3,
      projectDuration: "6 months",
      completionDate: "2023-04-20",
      projectStatus: "In Progress",
      supervisorFeedback:
        "Strong backend implementation, but needs UI improvements and better error handling.",
    },
    {
      id: 3,
      title: "Chat Application",
      description:
        "A real-time chat application using Socket.IO and React, designed for scalability and seamless communication.",
      technologies: ["React", "Socket.IO", "Node.js"],
      link: "https://github.com/username/chat-app",
      studentName: "Harish",
      enrollmentYear: 2023,
      major: "Software Engineering",
      teamSize: 2,
      projectDuration: "4 months",
      completionDate: "2023-07-10",
      projectStatus: "Completed",
      supervisorFeedback:
        "Great real-time features and scalability with minor issues in UI responsiveness.",
    },
  ]);

  return (
    <div className="projects">
      <h1>Student Projects</h1>
      <div className="projects-cards">
        {projects.map((project) => (
          <div key={project.id} className="project-card">
            <h3>{project.title}</h3>
            <p className="project-description">{project.description}</p>
            <p>
              <strong>Technologies:</strong> {project.technologies.join(", ")}
            </p>
            <p>
              <strong>Student:</strong> {project.studentName} (Enrolled:{" "}
              {project.enrollmentYear}, {project.major})
            </p>
            <p>
              <strong>Team Size:</strong> {project.teamSize}
            </p>
            <p>
              <strong>Duration:</strong> {project.projectDuration}
            </p>
            <p>
              <strong>Completion Date:</strong> {project.completionDate}
            </p>
            <p>
              <strong>Status:</strong> {project.projectStatus}
            </p>
            <p>
              <strong>Supervisor Feedback:</strong> {project.supervisorFeedback}
            </p>
            <div className="button-container">
              {project.link && (
                <a
                  href={project.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="project-button"
                >
                  View Project
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Projects;
