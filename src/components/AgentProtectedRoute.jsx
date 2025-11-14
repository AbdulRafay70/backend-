import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const AgentProtectedRoute = ({ children }) => {
  const { isAuthenticated, userRole } = useContext(AuthContext);

  if (!isAuthenticated) {
    return <Navigate to="/agent/login" replace />;
  }

  if (userRole !== 'agent') {
    return <Navigate to="/agent/login" replace />; // Or redirect to login
  }

  return children;
};

export default AgentProtectedRoute;