// admin/src/components/Auth/ProtectedRoute.jsx
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  Box,
  CircularProgress,
  Typography,
  Card,
  CardContent,
} from "@mui/material";
import { Security, AdminPanelSettings } from "@mui/icons-material";

const ProtectedRoute = ({ children, roles = ["admin", "warden"] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{
          background: "linear-gradient(135deg, #0a0e27 0%, #1a1d3a 100%)",
        }}
      >
        <Card sx={{ p: 4, textAlign: "center", minWidth: 400 }}>
          <CardContent>
            <AdminPanelSettings
              sx={{ fontSize: 80, color: "primary.main", mb: 2 }}
            />
            <CircularProgress size={60} thickness={4} sx={{ mb: 3 }} />
            <Typography variant="h5" gutterBottom color="primary">
              SHMS Admin Panel
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Initializing secure admin environment...
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (roles.length > 0 && !roles.includes(user?.role)) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        sx={{
          background: "linear-gradient(135deg, #0a0e27 0%, #1a1d3a 100%)",
        }}
      >
        <Card sx={{ p: 4, textAlign: "center", minWidth: 400 }}>
          <CardContent>
            <Security sx={{ fontSize: 80, color: "error.main", mb: 2 }} />
            <Typography variant="h4" color="error.main" gutterBottom>
              Access Denied
            </Typography>
            <Typography variant="body1" color="text.secondary" mb={3}>
              You don't have sufficient privileges to access the admin panel.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Required role: {roles.join(" or ")}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Your role: {user?.role}
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return children;
};

export default ProtectedRoute;
