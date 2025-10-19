import React, { useEffect, useState } from "react";
import axios from "axios";
import Chart from "chart.js/auto";
import { Bar, Doughnut } from "react-chartjs-2";
import "../styles/Performance.css";

const StudentPerformance = ({ user }) => {
    const [performance, setPerformance] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerformance = async () => {
            try {
                const response = await axios.get(`http://localhost:8080/api/performance/${user.email}`);
                setPerformance(response.data);
            } catch (error) {
                console.error("Error fetching performance data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPerformance();
    }, [user]);

    const mockTestData = {
        labels: ["Aptitude", "Coding", "Communication", "Technical"],
        datasets: [
            {
                label: "Mock Test Scores",
                data: performance ? Object.values(performance.mockTestScores) : [0, 0, 0, 0],
                backgroundColor: ["#FF5733", "#1C3FAA", "#28A745", "#FFC300"],
            },
        ],
    };

    return (
        <div className="performance-container">
            <h1>📊 Student Performance Analytics</h1>

            {loading ? (
                <p>Loading data...</p>
            ) : (
                <>
                    <section className="mock-test-scores">
                        <h2>📝 Mock Test Scores</h2>
                        <Bar data={mockTestData} />
                    </section>

                    <section className="coding-progress">
                        <h2>💻 Coding Challenges Solved: {performance?.codingChallengesSolved}</h2>
                    </section>

                    <section className="interview-feedback">
                        <h2>🎤 Interview Performance Score: {performance?.interviewScores}%</h2>
                        <Doughnut data={{
                            labels: ["AI Scoring"],
                            datasets: [{ data: [performance?.interviewScores, 100 - performance?.interviewScores], backgroundColor: ["#1C3FAA", "#d3d3d3"] }]
                        }} />
                    </section>
                </>
            )}
        </div>
    );
};

export default StudentPerformance;
