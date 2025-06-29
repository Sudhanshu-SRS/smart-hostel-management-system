// src/pages/Rooms/Rooms.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Hotel, Add } from "@mui/icons-material";
import { roomsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getRooms();
      setRooms(response.data.rooms || []);
    } catch (error) {
      console.error("Fetch rooms error:", error);
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "success";
      case "occupied":
        return "warning";
      case "maintenance":
        return "error";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: "linear-gradient(135deg, #1976d2, #42a5f5)",
          color: "white",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Room Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Real-time room availability tracking
            </Typography>
          </Box>
          <Hotel sx={{ fontSize: 80, opacity: 0.7 }} />
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {(user?.role === "admin" || user?.role === "warden") && (
        <Box display="flex" justifyContent="flex-end" mb={3}>
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{ background: "linear-gradient(135deg, #1976d2, #42a5f5)" }}
          >
            Add New Room
          </Button>
        </Box>
      )}

      <Grid container spacing={3}>
        {rooms.length > 0 ? (
          rooms.map((room) => (
            <Grid item xs={12} sm={6} md={4} key={room._id}>
              <Card>
                <CardContent>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={2}
                  >
                    <Typography variant="h5" fontWeight="bold">
                      {room.roomNumber}
                    </Typography>
                    <Chip
                      label={room.status}
                      color={getStatusColor(room.status)}
                      size="small"
                    />
                  </Box>
                  <Typography color="text.secondary" gutterBottom>
                    {room.building} - Floor {room.floor}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Type: {room.roomType}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    Capacity: {room.occupants?.length || 0}/{room.capacity}
                  </Typography>
                  <Typography variant="body2" color="primary" fontWeight="bold">
                    ₹{room.monthlyRent}/month
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <Grid item xs={12}>
            <Paper sx={{ p: 4, textAlign: "center" }}>
              <Hotel sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                No rooms available
              </Typography>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default Rooms;
