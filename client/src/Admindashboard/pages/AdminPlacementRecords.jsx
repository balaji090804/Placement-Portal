import React, { useState, useEffect } from "react";
import axios from "axios";
import * as Papa from "papaparse";
import "../styles/AddPlacementRecord.css";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminPlacementRecords = () => {
    const [placements, setPlacements] = useState([]);
    const [loading, setLoading] = useState(false);
    const [csvFile, setCsvFile] = useState(null);
    const [selectedFileName, setSelectedFileName] = useState("No file chosen");
    const [q, setQ] = useState("");
    const [newPlacement, setNewPlacement] = useState({
        studentName: "",
        studentEmail: "",
        branch: "",
        company: "",
        jobRole: "",
        package: "",
        status: "Pending",
    });

    useEffect(() => {
        fetchPlacements();
    }, []);

    // Fetch all placement records
    const fetchPlacements = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/placements");
            setPlacements(response.data);
        } catch (error) {
            console.error("❌ Error fetching placement data:", error);
            toast.error("Error fetching placement records");
        }
    };

    // Handle Manual Placement Addition
    const handleAddPlacement = async () => {
        try {
            await axios.post("http://localhost:8080/api/placements", newPlacement);
            fetchPlacements();
            toast.success("Placement record added successfully");
            setNewPlacement({
                studentName: "",
                studentEmail: "",
                branch: "",
                company: "",
                jobRole: "",
                package: "",
                status: "Pending",
            });
        } catch (error) {
            console.error("Error adding placement:", error);
            toast.error("Failed to add placement record");
        }
    };

    // Handle CSV File Selection
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCsvFile(file);
            setSelectedFileName(file.name);
        }
    };

    // Upload CSV Data
const handleUploadCSV = async () => {
    if (!csvFile) {
        toast.warning("Please select a CSV file");
        return;
    }

    setLoading(true);
    Papa.parse(csvFile, {
        header: true,
        skipEmptyLines: true,
        complete: async (result) => {
            let cleanedData = result.data.map((item) => ({
                studentName: item.studentName?.trim(),
                studentEmail: item.studentEmail?.trim(),
                branch: item.branch?.trim(),
                company: item.company?.trim(),
                jobRole: item.jobRole?.trim(),
                package: parseFloat(item.package),
                status: item.status?.trim().charAt(0).toUpperCase() + item.status?.trim().slice(1).toLowerCase() // Normalizes to Placed/Pending/Rejected
            }));

            console.log("Cleaned CSV Data:", cleanedData);

            try {
                const response = await axios.post(
                    "http://localhost:8080/api/placements/bulk-upload",
                    { placements: cleanedData }
                );
                toast.success(response.data.message);
                fetchPlacements();
            } catch (error) {
                console.error("Error uploading CSV data:", error.response?.data || error.message);
                toast.error(error.response?.data?.message || "CSV upload failed");
            } finally {
                setLoading(false);
            }
        },
    });
};

    return (
        <div className="admin-placement-records" style={{ marginLeft: 220, padding: 24 }}>
            <h1 className="section-title" style={{ marginBottom: 12 }}>Placement Records</h1>

            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <h2 className="section-title" style={{ marginBottom: 8 }}>Add Placement Record</h2>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0,1fr))", gap: 12 }}>
                    <input type="text" placeholder="Student Name" value={newPlacement.studentName} onChange={(e) => setNewPlacement({ ...newPlacement, studentName: e.target.value })} />
                    <input type="email" placeholder="Student Email" value={newPlacement.studentEmail} onChange={(e) => setNewPlacement({ ...newPlacement, studentEmail: e.target.value })} />
                    <input type="text" placeholder="Branch" value={newPlacement.branch} onChange={(e) => setNewPlacement({ ...newPlacement, branch: e.target.value })} />
                    <input type="text" placeholder="Company" value={newPlacement.company} onChange={(e) => setNewPlacement({ ...newPlacement, company: e.target.value })} />
                    <input type="text" placeholder="Job Role" value={newPlacement.jobRole} onChange={(e) => setNewPlacement({ ...newPlacement, jobRole: e.target.value })} />
                    <input type="text" placeholder="Package (LPA)" value={newPlacement.package} onChange={(e) => setNewPlacement({ ...newPlacement, package: e.target.value })} />
                </div>
                <div style={{ marginTop: 12 }}>
                    <button className="btn btn-primary" onClick={handleAddPlacement}>Add Placement</button>
                </div>
            </div>

            <div className="card" style={{ padding: 16, marginBottom: 16 }}>
                <h2 className="section-title" style={{ marginBottom: 8 }}>Bulk Upload (CSV)</h2>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <input id="csvInput" type="file" accept=".csv" onChange={handleFileUpload} />
                    <span className="muted">{selectedFileName}</span>
                    <button className="btn btn-outline" onClick={handleUploadCSV} disabled={loading}>
                        {loading ? "Uploading..." : "Upload CSV"}
                    </button>
                </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <h2 className="section-title" style={{ margin: 0 }}>All Placements</h2>
                    <input
                        type="text"
                        placeholder="Search name/email/company/role"
                        value={q}
                        onChange={(e) => setQ(e.target.value)}
                        style={{ maxWidth: 360 }}
                    />
                </div>
                <div className="table-wrap">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Student</th>
                                <th>Email</th>
                                <th>Branch</th>
                                <th>Company</th>
                                <th>Role</th>
                                <th>Package</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {placements
                                .filter((p) => {
                                    const s = q.trim().toLowerCase();
                                    if (!s) return true;
                                    return (
                                        (p.studentName || "").toLowerCase().includes(s) ||
                                        (p.studentEmail || "").toLowerCase().includes(s) ||
                                        (p.company || "").toLowerCase().includes(s) ||
                                        (p.jobRole || "").toLowerCase().includes(s)
                                    );
                                })
                                .map((p) => (
                                    <tr key={p._id}>
                                        <td>{p.studentName}</td>
                                        <td>{p.studentEmail}</td>
                                        <td>{p.branch}</td>
                                        <td>{p.company}</td>
                                        <td>{p.jobRole}</td>
                                        <td>{p.package}</td>
                                        <td>{p.status}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPlacementRecords;
