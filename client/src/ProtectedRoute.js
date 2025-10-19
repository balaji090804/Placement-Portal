import React from "react";
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ component: Component, allowedRoles }) => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token || !allowedRoles.includes(role)) {
        return <Navigate to="/login" />;
    }

    return <Component />;
};

export default ProtectedRoute;
