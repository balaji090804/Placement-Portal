import React, { useEffect, useState } from "react";
import axios from "axios";
import Chart from "chart.js/auto";
import { Bar } from "react-chartjs-2";
import "../styles/Dashboard.css";

const PlacementDashboard = () => {
    const [placements, setPlacements] = useState([]);
    const [recruiters, setRecruiters] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const placementResponse = await axios.get("http://localhost:8080/api/placements");
                const recruiterResponse = await axios.get("http://localhost:8080/api/recruiters");
                setPlacements(placementResponse.data);
                setRecruiters(recruiterResponse.data);
            } catch (error) {
                console.error("Error fetching dashboard data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    // Preparing data for the bar chart
    const companyCounts = placements.reduce((acc, p) => {
        acc[p.company] = (acc[p.company] || 0) + 1;
        return acc;
    }, {});

    const chartData = {
        labels: Object.keys(companyCounts),
        datasets: [
            {
                label: "Number of Students Placed",
                data: Object.values(companyCounts),
                backgroundColor: "rgba(54, 162, 235, 0.6)"
            }
        ]
    };

    return (
        <div className="dashboard-container">
            <h1>📊 College Placement Dashboard</h1>

            {loading ? (
                <p>Loading data...</p>
            ) : (
                <>
                    {/* Placement Stats */}
                    <section className="placement-stats">
                        <h2>📈 Placement Statistics</h2>
                        <p>Total Students Placed: {placements.length}</p>
                        <Bar data={chartData} />
                    </section>

                    {/* Upcoming Placement Drives */}
                    <section className="upcoming-drives">
                        <h2>📅 Upcoming Placement Drives</h2>
                        {recruiters.length === 0 ? <p>No upcoming drives.</p> :
                            recruiters.map((r, index) => (
                                <div key={index} className="recruiter-card">
                                    <h3>{r.companyName}</h3>
                                    <p>Role: {r.jobTitle}</p>
                                    <p>Package: {r.packageOffered}</p>
                                    <p>Date: {new Date(r.interviewDate).toLocaleDateString()}</p>
                                </div>
                            ))}
                    </section>
                </>
            )}
        </div>
    );
};

export default PlacementDashboard;
