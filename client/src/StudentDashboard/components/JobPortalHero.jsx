import React from "react";
import "../styles/jobportal.css";
import { NavLink } from "react-router-dom";
import Sidebar from "./Sidebar"; // Import Sidebar

const JobPortalHero = () => {
  // Sample pipelined companies (Replace with actual company logos)
  const pipelinedCompanies = [
    {
      name: "Google",
      logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg",
    },
    {
      name: "Microsoft",
      logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg",
    },
    {
      name: "Amazon",
      logo: "https://upload.wikimedia.org/wikipedia/commons/a/a9/Amazon_logo.svg",
    },
    {
      name: "Facebook",
      logo: "https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg",
    },
    {
      name: "Apple",
      logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg",
    },
    {
      name: "TCS",
      logo: "https://upload.wikimedia.org/wikipedia/commons/3/3e/Tata_Consultancy_Services_Logo.svg",
    },
    {
      name: "Infosys",
      logo: "https://upload.wikimedia.org/wikipedia/commons/5/53/Infosys_logo.svg",
    },
  ];

  return (
    <div className="jobportal-page">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <section className="jobportal">
        <div className="jobportal-container container">
          <div className="jobportal-left">
            <div className="jobportal-left-top">
              <h1>
                Find your dream <br /> Job now!
              </h1>
              <p>
                Services to help you get hired, faster: from preparing your CV,
                finding the right jobs, and more!
              </p>
            </div>

            <div className="jobportal-cards">
              <a>
                <NavLink to={"/Jobh"}>
                  <strong>Jobs</strong>
                </NavLink>
              </a>

              <a href="">
                <strong>Internships</strong>
              </a>

              <a href="">
                <strong>Hiring Challenges</strong>
              </a>
            </div>
          </div>

          <div className="jobportal-img">
            <img
              src="https://o.remove.bg/downloads/e39689a2-5be4-4767-9d88-870e7c03fb8e/woman-working-telecommuting-inside-house_23-2148503808-removebg-preview.png"
              alt="job portal hero"
              width={1000}
              height={500}
            />
            <div className="speaker">
              <img
                src="https://d8it4huxumps7.cloudfront.net/uploads/images/63d74c0f70dbe_internships_icon.png?d=80x80"
                alt="Internships"
              />
              <div>
                <span> Internships</span>
              </div>
            </div>
            <div className="building">
              <img
                src="https://d8it4huxumps7.cloudfront.net/uploads/images/63d74bc4b38e2_companies_icon.png?d=80x80"
                alt="Companies"
              />
              <div>
                <span> Companies </span>
              </div>
            </div>
            <div className="bag">
              <img
                src="https://d8it4huxumps7.cloudfront.net/uploads/images/63d74becd0c8f_job_icon.png?d=80x80"
                alt="Jobs"
              />
              <div>
                <span> Jobs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pipelined Companies Section */}
        <div className="pipelined-companies">
          <h2>Pipelined Companies in Our College</h2>
          <div className="company-list">
            {pipelinedCompanies.map((company, index) => (
              <div key={index} className="company-card">
                <img src={company.logo} alt={company.name} />
                <p>{company.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default JobPortalHero;
