import React from "react";
import "../styles/homehero.css";
import { NavLink } from "react-router-dom";

const HomeHero = () => {
  return (
    <div>
      <div className="home-page">
        <section className="home-hero">
          <div className="home-hero-container container">
            {/* Left Section - Heading & CTA */}
            <div className="home-hero-left">
              <h1>
                🚀 Transform Your Future: <br />
                The **Ultimate Placement Journey Begins Here!**
              </h1>
              <br />
              <h2>
                <strong>Prepare | Improve | Succeed</strong>
              </h2>
              <p>
                Get **AI-driven analytics**, **real-time insights**, and **customized mock tests** to refine your skills.
                Explore **top job opportunities** and **connect with recruiters** to land your dream job.  
                <br />
                <strong>Start now & secure your future!</strong>
              </p>

              {/* Key Features */}
              <div className="hero-buttons">
                <NavLink to={"/resume"} className="btn hero-btn">
                  <img src="https://cdn-icons-png.flaticon.com/512/535/535188.png" alt="Resume" />
                  Create Resume
                </NavLink>

                <NavLink to={"/job-portal"} className="btn hero-btn">
                  <img src="https://cdn-icons-png.flaticon.com/512/2942/2942933.png" alt="Jobs" />
                  Apply for Jobs
                </NavLink>

                <NavLink to={"/interview-prep"} className="btn hero-btn">
                  <img src="https://cdn-icons-png.flaticon.com/512/3135/3135706.png" alt="Interview" />
                  Interview Preparation
                </NavLink>
              </div>
            </div>

            {/* Right Section - Image & Chatbot */}
            <div className="home-hero-right">
              <div className="home-hero-right-images">
                
              </div>

              {/* Chatbot Button */}
              <NavLink to={"/Chatapp"} className="btn chat-btn">
                <img src="https://cdn-icons-png.flaticon.com/128/566/566769.png" alt="Chatbot" />
                Chat with Career Assistant
              </NavLink>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomeHero;
