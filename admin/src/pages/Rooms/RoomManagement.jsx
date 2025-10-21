// admin/src/pages/Rooms/RoomManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Alert,
  Snackbar,
  Avatar,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Home as HomeIcon,
  People as PeopleIcon,
  Bed as BedIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Visibility as VisibilityIcon,
  Build as BuildIcon,
} from "@mui/icons-material";
import { useSocket } from "../../context/SocketContext";
import api from "../../services/api";

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [floors, setFloors] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedBuilding, setSelectedBuilding] = useState("all");
  const [buildings, setBuildings] = useState([]);

  // Dialog states
  const [openCreateRoom, setOpenCreateRoom] = useState(false);
  const [openBulkCreate, setOpenBulkCreate] = useState(false);
  const [openBedManagement, setOpenBedManagement] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);

  // Form states
  const [roomForm, setRoomForm] = useState({
    roomNumber: "",
    floor: "",
    building: "",
    capacity: 1,
    roomType: "single",
    monthlyRent: "",
    securityDeposit: "",
    amenities: [],
    description: "",
  });

  const [bulkForm, setBulkForm] = useState({
    building: "",
    floor: "",
    startRoomNumber: "",
    endRoomNumber: "",
    capacity: 1,
    roomType: "single",
    monthlyRent: "",
    securityDeposit: "",
    amenities: [],
    description: "",
  });

  const [bedManagement, setBedManagement] = useState({
    selectedBed: null,
    selectedStudent: "",
    action: "allocate",
  });

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const { socket } = useSocket();

  const amenitiesList = [
    "WiFi",
    "AC",
    "Fan",
    "Study Table",
    "Wardrobe",
    "Attached Bathroom",
    "Balcony",
    "Window",
  ];
  const roomTypes = ["single", "double", "triple", "quad"];

  useEffect(() => {
    fetchRooms();
    fetchStudents();

    // Socket listeners for real-time updates
    if (socket) {
      socket.on("roomCreated", handleRoomUpdate);
      socket.on("bulkRoomsCreated", handleBulkRoomUpdate);
      socket.on("bedAllocated", handleBedUpdate);
      socket.on("bedDeallocated", handleBedUpdate);
      socket.on("roomUpdated", handleRoomUpdate);
      socket.on("roomDeleted", handleRoomDelete);

      return () => {
        socket.off("roomCreated");
        socket.off("bulkRoomsCreated");
        socket.off("bedAllocated");
        socket.off("bedDeallocated");
        socket.off("roomUpdated");
        socket.off("roomDeleted");
      };
    }
  }, [socket]);

  const fetchRooms = async (filters = {}) => {
    try {
      setLoading(true);
      const response = await api.get("/rooms", { params: filters });
      if (response.data.success) {
        setRooms(response.data.rooms);

        // Extract unique floors and buildings
        const uniqueFloors = [
          ...new Set(response.data.rooms.map((room) => room.floor)),
        ].sort();
        const uniqueBuildings = [
          ...new Set(response.data.rooms.map((room) => room.building)),
        ].sort();

        setFloors(uniqueFloors);
        setBuildings(uniqueBuildings);
      }
    } catch (error) {
      showSnackbar("Error fetching rooms", "error");
      console.error("Error fetching rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get("/users");
      if (response.data.success) {
        // Filter only students without rooms
        const availableStudents = response.data.users.filter(
          (user) => user.role === "student" && !user.room
        );
        setStudents(availableStudents);
      }
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleRoomUpdate = () => {
    fetchRooms();
    fetchStudents();
  };

  const handleBulkRoomUpdate = (data) => {
    showSnackbar(
      `${data.count} rooms created successfully on floor ${data.floor}`,
      "success"
    );
    fetchRooms();
  };

  const handleBedUpdate = () => {
    fetchRooms();
    fetchStudents();
    setOpenBedManagement(false);
  };

  const handleRoomDelete = () => {
    fetchRooms();
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreateRoom = async () => {
    try {
      const response = await api.post("/rooms", roomForm);
      if (response.data.success) {
        showSnackbar("Room created successfully", "success");
        setOpenCreateRoom(false);
        setRoomForm({
          roomNumber: "",
          floor: "",
          building: "",
          capacity: 1,
          roomType: "single",
          monthlyRent: "",
          securityDeposit: "",
          amenities: [],
          description: "",
        });
      }
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || "Error creating room",
        "error"
      );
    }
  };

  const handleBulkCreate = async () => {
    try {
      const response = await api.post("/rooms/bulk-create", bulkForm);
      if (response.data.success) {
        showSnackbar(response.data.message, "success");
        setOpenBulkCreate(false);
        setBulkForm({
          building: "",
          floor: "",
          startRoomNumber: "",
          endRoomNumber: "",
          capacity: 1,
          roomType: "single",
          monthlyRent: "",
          securityDeposit: "",
          amenities: [],
          description: "",
        });
      }
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || "Error creating rooms",
        "error"
      );
    }
  };

  const handleBedAction = async () => {
    try {
      const endpoint =
        bedManagement.action === "allocate"
          ? `/rooms/${selectedRoom._id}/allocate-bed`
          : `/rooms/${selectedRoom._id}/deallocate-bed`;

      const payload =
        bedManagement.action === "allocate"
          ? {
              studentId: bedManagement.selectedStudent,
              bedNumber: bedManagement.selectedBed,
            }
          : { bedNumber: bedManagement.selectedBed };

      const response = await api.post(endpoint, payload);
      if (response.data.success) {
        showSnackbar(response.data.message, "success");
      }
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || "Error managing bed",
        "error"
      );
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

  const getBedStatusColor = (bed) => {
    return bed.isOccupied ? "error" : "success";
  };

  const getBedStatusText = (bed) => {
    return bed.isOccupied ? "Occupied" : "Available";
  };

  const getRoomOccupancyStats = () => {
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
    const occupancyRate =
      totalBeds > 0 ? ((occupiedBeds / totalBeds) * 100).toFixed(2) : 0;

    return {
      totalRooms: filteredRooms.length,
      totalBeds,
      occupiedBeds,
      availableBeds,
      occupancyRate,
    };
  };

  const stats = getRoomOccupancyStats();

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: "bold" }}>
        Room Management
      </Typography>

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
                  <Typography variant="h4">{stats.occupiedBeds}</Typography>
                  <Typography color="text.secondary">Occupied Beds</Typography>
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
                  {stats.occupancyRate}%
                </Typography>
                <Box sx={{ ml: 2 }}>
                  <Typography color="text.secondary">Occupancy Rate</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box sx={{ mb: 3, display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateRoom(true)}
        >
          Create Room
        </Button>
        <Button
          variant="contained"
          startIcon={<BuildIcon />}
          onClick={() => setOpenBulkCreate(true)}
        >
          Bulk Create Rooms
        </Button>
      </Box>

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
              <Button variant="outlined" onClick={() => fetchRooms()} fullWidth>
                Refresh
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Rooms Grid */}
      <Grid container spacing={3}>
        {getFilteredRooms().map((room) => (
          <Grid item xs={12} md={6} lg={4} key={room._id}>
            <Card>
              <CardContent>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mb: 2,
                  }}
                >
                  <Typography variant="h6">{room.roomNumber}</Typography>
                  <Chip
                    label={room.status}
                    color={
                      room.status === "available"
                        ? "success"
                        : room.status === "occupied"
                        ? "error"
                        : "warning"
                    }
                    size="small"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {room.building} • Floor {room.floor} • {room.roomType}
                </Typography>

                <Typography variant="body2" sx={{ mb: 2 }}>
                  Rent: ₹{room.monthlyRent}/month
                </Typography>

                {/* Bed Status */}
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Beds (
                  {room.beds
                    ? room.beds.filter((bed) => bed.isOccupied).length
                    : 0}
                  /{room.capacity}):
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  {room.beds &&
                    room.beds.map((bed) => (
                      <Tooltip
                        key={bed.bedNumber}
                        title={
                          bed.isOccupied
                            ? `Bed ${bed.bedNumber} - ${
                                bed.occupant?.name || "Occupied"
                              }`
                            : `Bed ${bed.bedNumber} - Available`
                        }
                      >
                        <Chip
                          label={bed.bedNumber}
                          size="small"
                          color={getBedStatusColor(bed)}
                          variant={bed.isOccupied ? "filled" : "outlined"}
                        />
                      </Tooltip>
                    ))}
                </Box>

                {/* Action Buttons */}
                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedRoom(room);
                        setOpenBedManagement(true);
                      }}
                    >
                      <VisibilityIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Edit Room">
                    <IconButton size="small">
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete Room">
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Room Dialog */}
      <Dialog
        open={openCreateRoom}
        onClose={() => setOpenCreateRoom(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Create New Room</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Room Number"
                value={roomForm.roomNumber}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, roomNumber: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Floor"
                type="number"
                value={roomForm.floor}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, floor: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Building"
                value={roomForm.building}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, building: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Room Type</InputLabel>
                <Select
                  value={roomForm.roomType}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, roomType: e.target.value })
                  }
                  label="Room Type"
                >
                  {roomTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={roomForm.capacity}
                onChange={(e) =>
                  setRoomForm({
                    ...roomForm,
                    capacity: parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 1, max: 4 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Rent"
                type="number"
                value={roomForm.monthlyRent}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, monthlyRent: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Security Deposit"
                type="number"
                value={roomForm.securityDeposit}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, securityDeposit: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Amenities</InputLabel>
                <Select
                  multiple
                  value={roomForm.amenities}
                  onChange={(e) =>
                    setRoomForm({ ...roomForm, amenities: e.target.value })
                  }
                  label="Amenities"
                  renderValue={(selected) => (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {amenitiesList.map((amenity) => (
                    <MenuItem key={amenity} value={amenity}>
                      {amenity}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description"
                multiline
                rows={3}
                value={roomForm.description}
                onChange={(e) =>
                  setRoomForm({ ...roomForm, description: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateRoom(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateRoom}>
            Create Room
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog
        open={openBulkCreate}
        onClose={() => setOpenBulkCreate(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Bulk Create Rooms</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Building"
                value={bulkForm.building}
                onChange={(e) =>
                  setBulkForm({ ...bulkForm, building: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Floor"
                type="number"
                value={bulkForm.floor}
                onChange={(e) =>
                  setBulkForm({ ...bulkForm, floor: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Room Number"
                type="number"
                value={bulkForm.startRoomNumber}
                onChange={(e) =>
                  setBulkForm({ ...bulkForm, startRoomNumber: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="End Room Number"
                type="number"
                value={bulkForm.endRoomNumber}
                onChange={(e) =>
                  setBulkForm({ ...bulkForm, endRoomNumber: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Room Type</InputLabel>
                <Select
                  value={bulkForm.roomType}
                  onChange={(e) =>
                    setBulkForm({ ...bulkForm, roomType: e.target.value })
                  }
                  label="Room Type"
                >
                  {roomTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Capacity"
                type="number"
                value={bulkForm.capacity}
                onChange={(e) =>
                  setBulkForm({
                    ...bulkForm,
                    capacity: parseInt(e.target.value),
                  })
                }
                inputProps={{ min: 1, max: 4 }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Monthly Rent"
                type="number"
                value={bulkForm.monthlyRent}
                onChange={(e) =>
                  setBulkForm({ ...bulkForm, monthlyRent: e.target.value })
                }
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Security Deposit"
                type="number"
                value={bulkForm.securityDeposit}
                onChange={(e) =>
                  setBulkForm({ ...bulkForm, securityDeposit: e.target.value })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkCreate(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleBulkCreate}>
            Create Rooms
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bed Management Dialog */}
      <Dialog
        open={openBedManagement}
        onClose={() => setOpenBedManagement(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Bed Management - {selectedRoom?.roomNumber}</DialogTitle>
        <DialogContent>
          {selectedRoom && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Room Details
                  </Typography>
                  <Typography>Building: {selectedRoom.building}</Typography>
                  <Typography>Floor: {selectedRoom.floor}</Typography>
                  <Typography>Type: {selectedRoom.roomType}</Typography>
                  <Typography>
                    Capacity: {selectedRoom.capacity} beds
                  </Typography>
                  <Typography>
                    Monthly Rent: ₹{selectedRoom.monthlyRent}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Occupancy Status
                  </Typography>
                  <Typography>
                    Occupied:{" "}
                    {selectedRoom.beds
                      ? selectedRoom.beds.filter((bed) => bed.isOccupied).length
                      : 0}
                    /{selectedRoom.capacity}
                  </Typography>
                  <Typography>
                    Available:{" "}
                    {selectedRoom.beds
                      ? selectedRoom.beds.filter((bed) => !bed.isOccupied)
                          .length
                      : selectedRoom.capacity}
                  </Typography>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />

              <Typography variant="h6" gutterBottom>
                Bed Details
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Bed Number</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Occupant</TableCell>
                      <TableCell>Allocation Date</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {selectedRoom.beds &&
                      selectedRoom.beds.map((bed) => (
                        <TableRow key={bed.bedNumber}>
                          <TableCell>{bed.bedNumber}</TableCell>
                          <TableCell>
                            <Chip
                              label={getBedStatusText(bed)}
                              color={getBedStatusColor(bed)}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {bed.isOccupied && bed.occupant ? (
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                                  {bed.occupant.name?.charAt(0) || "U"}
                                </Avatar>
                                <Box>
                                  <Typography variant="body2">
                                    {bed.occupant.name}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {bed.occupant.studentId}
                                  </Typography>
                                </Box>
                              </Box>
                            ) : (
                              "-"
                            )}
                          </TableCell>
                          <TableCell>
                            {bed.allocationDate
                              ? new Date(
                                  bed.allocationDate
                                ).toLocaleDateString()
                              : "-"}
                          </TableCell>
                          <TableCell>
                            {bed.isOccupied ? (
                              <Button
                                size="small"
                                color="error"
                                startIcon={<PersonRemoveIcon />}
                                onClick={() => {
                                  setBedManagement({
                                    selectedBed: bed.bedNumber,
                                    selectedStudent: "",
                                    action: "deallocate",
                                  });
                                }}
                              >
                                Deallocate
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                color="primary"
                                startIcon={<PersonAddIcon />}
                                onClick={() => {
                                  setBedManagement({
                                    selectedBed: bed.bedNumber,
                                    selectedStudent: "",
                                    action: "allocate",
                                  });
                                }}
                              >
                                Allocate
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Bed Action Form */}
              {bedManagement.selectedBed && (
                <Box sx={{ mt: 3, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
                  <Typography variant="h6" gutterBottom>
                    {bedManagement.action === "allocate"
                      ? "Allocate"
                      : "Deallocate"}{" "}
                    Bed {bedManagement.selectedBed}
                  </Typography>

                  {bedManagement.action === "allocate" && (
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel>Select Student</InputLabel>
                      <Select
                        value={bedManagement.selectedStudent}
                        onChange={(e) =>
                          setBedManagement({
                            ...bedManagement,
                            selectedStudent: e.target.value,
                          })
                        }
                        label="Select Student"
                      >
                        {students.map((student) => (
                          <MenuItem key={student._id} value={student._id}>
                            {student.name} ({student.studentId})
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}

                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Button
                      variant="contained"
                      onClick={handleBedAction}
                      disabled={
                        bedManagement.action === "allocate" &&
                        !bedManagement.selectedStudent
                      }
                    >
                      {bedManagement.action === "allocate"
                        ? "Allocate Bed"
                        : "Deallocate Bed"}
                    </Button>
                    <Button
                      onClick={() =>
                        setBedManagement({
                          selectedBed: null,
                          selectedStudent: "",
                          action: "allocate",
                        })
                      }
                    >
                      Cancel
                    </Button>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBedManagement(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default RoomManagement;
