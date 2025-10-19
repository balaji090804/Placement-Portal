import React from "react";
import { BarChart, Bar, PieChart, Pie, Cell, Tooltip, XAxis, YAxis, Legend, ResponsiveContainer } from "recharts";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const AdminAnalytics = ({ data }) => {
  const driveStats = [
    { name: "Total", value: data.totalDrives },
    { name: "Upcoming", value: data.upcomingDrives },
    { name: "Completed", value: data.completedDrives },
  ];

  const studentStats = [
    { name: "Registered", value: data.registeredStudents },
    { name: "Not Registered", value: data.notRegistered },
  ];

  return (
    <div style={{ marginLeft: 230, padding: 30 }}>
      <h2>📊 Admin Analytics</h2>

      <div style={{ display: "flex", gap: "30px", flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 300 }}>
          <h4>📦 Drives Overview</h4>
          <BarChart width={300} height={200} data={driveStats}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" fill="#1c3faa" />
          </BarChart>
        </div>

        <div style={{ flex: 1, minWidth: 300 }}>
          <h4>👨‍🎓 Registration Status</h4>
          <PieChart width={300} height={200}>
            <Pie data={studentStats} dataKey="value" cx="50%" cy="50%" outerRadius={70} label>
              {studentStats.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
