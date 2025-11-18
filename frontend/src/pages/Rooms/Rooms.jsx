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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Divider,
  Snackbar,
} from "@mui/material";
import {
  Hotel,
  Add,
  Bed as BedIcon,
  Home as HomeIcon,
  People as PeopleIcon,
} from "@mui/icons-material";
import { roomsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";

const Rooms = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [floors, setFloors] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await roomsAPI.getRooms();
      const roomsData = response.data.rooms || [];
      setRooms(roomsData);

      // Extract unique floors and buildings
      const uniqueFloors = [
        ...new Set(roomsData.map((room) => room.floor)),
      ].sort();
      const uniqueBuildings = [
        ...new Set(roomsData.map((room) => room.building)),
      ].sort();

      setFloors(uniqueFloors);
      setBuildings(uniqueBuildings);
    } catch (error) {
      console.error("Fetch rooms error:", error);
      setError("Failed to load rooms");
    } finally {
      setLoading(false);
    }
  };

  const getFilteredRooms = () => {
    return rooms.filter((room) => {
      if (selectedFloor !== "all" && room.floor !== parseInt(selectedFloor))
        return false;
      if (selectedBuilding !== "all" && room.building !== selectedBuilding)
        return false;
      return true;
    });
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

  const getBedStatusColor = (bed) => {
    return bed.isOccupied ? "error" : "success";
  };

  const getBedStatusText = (bed) => {
    return bed.isOccupied ? "Occupied" : "Available";
  };

  const getRoomStats = () => {
    const filteredRooms = getFilteredRooms();
    const totalBeds = filteredRooms.reduce(
      (sum, room) => sum + room.capacity,
      0
    );
    const occupiedBeds = filteredRooms.reduce(
      (sum, room) =>
        sum +
        (room.beds ? room.beds.filter((bed) => bed.isOccupied).length : 0),
      0
    );
    const availableBeds = totalBeds - occupiedBeds;

    return {
      totalRooms: filteredRooms.length,
      totalBeds,
      occupiedBeds,
      availableBeds,
    };
  };

  const stats = getRoomStats();

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
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

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <HomeIcon sx={{ fontSize: 40, color: "primary.main", mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.totalRooms}</Typography>
                  <Typography color="text.secondary">Total Rooms</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <BedIcon sx={{ fontSize: 40, color: "info.main", mr: 2 }} />
                <Box>
                  <Typography variant="h4">{stats.totalBeds}</Typography>
                  <Typography color="text.secondary">Total Beds</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <PeopleIcon
                  sx={{ fontSize: 40, color: "success.main", mr: 2 }}
                />
                <Box>
                  <Typography variant="h4">{stats.availableBeds}</Typography>
                  <Typography color="text.secondary">Available Beds</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center" }}>
                <Typography variant="h4" color="warning.main">
                  {stats.occupiedBeds}
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography color="text.secondary">Occupied Beds</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Building</InputLabel>
                <Select
                  value={selectedBuilding}
                  onChange={(e) => setSelectedBuilding(e.target.value)}
                  label="Building"
                >
                  <MenuItem value="all">All Buildings</MenuItem>
                  {buildings.map((building) => (
                    <MenuItem key={building} value={building}>
                      {building}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Floor</InputLabel>
                <Select
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  label="Floor"
                >
                  <MenuItem value="all">All Floors</MenuItem>
                  {floors.map((floor) => (
                    <MenuItem key={floor} value={floor}>
                      Floor {floor}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button variant="outlined" onClick={fetchRooms} fullWidth>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

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
        {getFilteredRooms().length > 0 ? (
          getFilteredRooms().map((room) => (
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
                    {room.building} • Floor {room.floor} • {room.roomType}
                  </Typography>

                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Rent: ₹{room.monthlyRent}/month
                  </Typography>

                  {/* Bed Status for Students - Only show availability */}
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Beds Available:{" "}
                    {room.beds
                      ? room.beds.filter((bed) => !bed.isOccupied).length
                      : room.capacity - (room.occupants?.length || 0)}
                    /{room.capacity}
                  </Typography>

                  {/* Bed indicators - students only see availability */}
                  <Box
                    sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}
                  >
                    {room.beds
                      ? room.beds.map((bed) => (
                          <Tooltip
                            key={bed.bedNumber}
                            title={`Bed ${bed.bedNumber} - ${getBedStatusText(
                              bed
                            )}`}
                          >
                            <Chip
                              label={bed.bedNumber}
                              size="small"
                              color={getBedStatusColor(bed)}
                              variant={bed.isOccupied ? "filled" : "outlined"}
                            />
                          </Tooltip>
                        ))
                      : // Fallback for rooms without bed data
                        Array.from({ length: room.capacity }, (_, index) => (
                          <Chip
                            key={index + 1}
                            label={index + 1}
                            size="small"
                            color="default"
                            variant="outlined"
                          />
                        ))}
                  </Box>

                  {/* Amenities */}
                  {room.amenities && room.amenities.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Amenities:
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        {room.amenities.slice(0, 3).map((amenity) => (
                          <Chip
                            key={amenity}
                            label={amenity}
                            size="small"
                            variant="outlined"
                          />
                        ))}
                        {room.amenities.length > 3 && (
                          <Chip
                            label={`+${room.amenities.length - 3} more`}
                            size="small"
                          />
                        )}
                      </Box>
                    </Box>
                  )}

                  {/* Book Room Button - Only for students */}
                  {user?.role === "student" &&
                    room.status === "available" &&
                    room.beds &&
                    room.beds.some((bed) => !bed.isOccupied) && (
                      <Button
                        variant="contained"
                        fullWidth
                        sx={{ mt: 1 }}
                        onClick={async () => {
                          try {
                            console.log("Book room:", room._id);
                            const response = await roomsAPI.bookRoom(room._id);
                            if (response.data.success) {
                              showSnackbar(
                                "Room booked successfully!",
                                "success"
                              );
                              fetchRooms(); // Refresh room list
                            } else {
                              showSnackbar(
                                response.data.message || "Failed to book room",
                                "error"
                              );
                            }
                          } catch (error) {
                            console.error("Book room error:", error);
                            showSnackbar(
                              error.response?.data?.message ||
                                "Error booking room",
                              "error"
                            );
                          }
                        }}
                      >
                        Book Room
                      </Button>
                    )}

                  {/* Status for unavailable rooms */}
                  {(room.status !== "available" ||
                    (room.beds &&
                      !room.beds.some((bed) => !bed.isOccupied))) && (
                    <Chip
                      label={
                        room.status === "maintenance"
                          ? "Under Maintenance"
                          : "Fully Occupied"
                      }
                      color="error"
                      sx={{ mt: 1 }}
                      fullWidth
                    />
                  )}
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Rooms;
