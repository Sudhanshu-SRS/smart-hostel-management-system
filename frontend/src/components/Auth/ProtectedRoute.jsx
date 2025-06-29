import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Box, CircularProgress, Typography } from "@mui/material";

const ProtectedRoute = ({ children, roles = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        gap={2}
        sx={{
          background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
        }}
      >
        <CircularProgress size={60} thickness={4} sx={{ color: "white" }} />
        <Typography variant="h6" color="white" textAlign="center">
          Loading Smart Hostel Management System...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
