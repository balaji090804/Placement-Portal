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

    // ✅ Fetch all placement records
    const fetchPlacements = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/placements");
            setPlacements(response.data);
        } catch (error) {
            console.error("❌ Error fetching placement data:", error);
            toast.error("Error fetching placement records!");
        }
    };

    // ✅ Handle Manual Placement Addition
    const handleAddPlacement = async () => {
        try {
            await axios.post("http://localhost:8080/api/placements", newPlacement);
            fetchPlacements();
            toast.success("🎉 Placement record added successfully!");
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
            console.error("❌ Error adding placement:", error);
            toast.error("Failed to add placement record!");
        }
    };

    // ✅ Handle CSV File Selection
    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            setCsvFile(file);
            setSelectedFileName(file.name);
        }
    };

    // ✅ Upload CSV Data
const handleUploadCSV = async () => {
    if (!csvFile) {
        toast.warning("Please select a CSV file!");
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

            console.log("📤 Cleaned CSV Data:", cleanedData);

            try {
                const response = await axios.post(
                    "http://localhost:8080/api/placements/bulk-upload",
                    { placements: cleanedData }
                );
                toast.success(response.data.message);
                fetchPlacements();
            } catch (error) {
                console.error("❌ Error uploading CSV data:", error.response?.data || error.message);
                toast.error(error.response?.data?.message || "CSV upload failed!");
            } finally {
                setLoading(false);
            }
        },
    });
};

    return (
        <div className="admin-placement-records">
            <div className="admin-placement-header">
                <h1>📋 Manage Placements</h1>
            </div>

            <div className="admin-placement-content">
                {/* ✅ Placement Form */}
                <div className="add-placement-record-form">
                    <h2>📄 Add Placement Record</h2>
                    <input type="text" placeholder="Student Name" value={newPlacement.studentName} onChange={(e) => setNewPlacement({ ...newPlacement, studentName: e.target.value })} />
                    <input type="email" placeholder="Student Email" value={newPlacement.studentEmail} onChange={(e) => setNewPlacement({ ...newPlacement, studentEmail: e.target.value })} />
                    <input type="text" placeholder="Branch" value={newPlacement.branch} onChange={(e) => setNewPlacement({ ...newPlacement, branch: e.target.value })} />
                    <input type="text" placeholder="Company" value={newPlacement.company} onChange={(e) => setNewPlacement({ ...newPlacement, company: e.target.value })} />
                    <input type="text" placeholder="Job Role" value={newPlacement.jobRole} onChange={(e) => setNewPlacement({ ...newPlacement, jobRole: e.target.value })} />
                    <input type="text" placeholder="Package (LPA)" value={newPlacement.package} onChange={(e) => setNewPlacement({ ...newPlacement, package: e.target.value })} />
                    <button onClick={handleAddPlacement}>➕ Add Placement</button>
                </div>

                {/* ✅ CSV Upload Section */}
                <div className="csv-upload-section">
                    <h2>📂 Upload CSV</h2>
                    <label htmlFor="csvInput" className="custom-file-upload">📁 Choose File</label>
                    <input id="csvInput" type="file" accept=".csv" onChange={handleFileUpload} />
                    <p className="selected-file">{selectedFileName}</p>
                    <button onClick={handleUploadCSV} disabled={loading}>
                        {loading ? "Uploading..." : "📤 Upload CSV"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminPlacementRecords;
