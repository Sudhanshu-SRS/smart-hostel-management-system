// admin/src/pages/Users/UserManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip,
  Badge,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
  Menu,
} from "@mui/material";
import {
  People,
  Add,
  Edit,
  Delete,
  MoreVert,
  Search,
  FilterList,
  Download,
  PersonAdd,
  Block,
  CheckCircle,
  Email,
  Phone,
  School,
  Home,
  Visibility,
  Person,
} from "@mui/icons-material";
import { adminAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogType, setDialogType] = useState(""); // 'view', 'edit', 'create'
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuUserId, setMenuUserId] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    students: 0,
    wardens: 0,
    admins: 0,
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchUsers();
    fetchUserStats();
  }, [page, rowsPerPage, searchTerm, roleFilter, statusFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {
        page: page + 1,
        limit: rowsPerPage,
        search: searchTerm,
        role: roleFilter,
        isActive: statusFilter,
      };

      const response = await adminAPI.getAllUsers(params);
      setUsers(response.data.users || []);
      setTotalUsers(response.data.count || 0);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Failed to fetch users");
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await adminAPI.getUserStats();
      setStats(response.data.stats || {});
    } catch (error) {
      console.error("Error fetching user stats:", error);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenDialog = (type, userData = null) => {
    setDialogType(type);
    setSelectedUser(userData);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedUser(null);
    setDialogType("");
  };

  const handleMenuOpen = (event, userId) => {
    setAnchorEl(event.currentTarget);
    setMenuUserId(userId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuUserId(null);
  };

  const handleToggleUserStatus = async (userId) => {
    try {
      await adminAPI.toggleUserStatus(userId);
      toast.success("User status updated successfully");
      fetchUsers();
      fetchUserStats();
    } catch (error) {
      toast.error("Failed to update user status");
    }
    handleMenuClose();
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await adminAPI.deleteUser(userId);
        toast.success("User deleted successfully");
        fetchUsers();
        fetchUserStats();
      } catch (error) {
        toast.error("Failed to delete user");
      }
    }
    handleMenuClose();
  };

  const getRoleColor = (role) => {
    switch (role) {
      case "admin":
        return "error";
      case "warden":
        return "warning";
      case "student":
        return "primary";
      default:
        return "default";
    }
  };

  const getStatusColor = (isActive) => {
    return isActive ? "success" : "error";
  };

  const StatCard = ({ title, value, icon, color = "primary" }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="h6">{title}</Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
            {icon}
          </Avatar>
        </Box>
      </CardContent>
    </Card>
  );

  if (loading && users.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: "linear-gradient(135deg, #1a237e, #3949ab)",
          color: "white",
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              User Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Manage students, staff, and admin accounts
            </Typography>
          </Box>
          <People sx={{ fontSize: 80, opacity: 0.7 }} />
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Users"
            value={stats.totalUsers || 0}
            icon={<People />}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Active Users"
            value={stats.activeUsers || 0}
            icon={<CheckCircle />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Students"
            value={stats.students || 0}
            icon={<School />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Wardens"
            value={stats.wardens || 0}
            icon={<Person />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Admins"
            value={stats.admins || 0}
            icon={<Person />}
            color="error"
          />
        </Grid>
      </Grid>

      {/* Controls */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={3}
        >
          <Typography variant="h6">All Users</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog("create")}
          >
            Add New User
          </Button>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Role Filter</InputLabel>
              <Select
                value={roleFilter}
                label="Role Filter"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="warden">Warden</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="">All Status</MenuItem>
                <MenuItem value="true">Active</MenuItem>
                <MenuItem value="false">Inactive</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Download />}
              onClick={() => toast.info("Export feature coming soon!")}
            >
              Export
            </Button>
          </Grid>
        </Grid>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Users Table */}
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((userData) => (
                <TableRow key={userData._id || userData.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar
                        src={userData.profilePicture?.url}
                        alt={userData.name}
                      >
                        {userData.name?.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {userData.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {userData.email}
                        </Typography>
                        {userData.studentId && (
                          <Typography
                            variant="caption"
                            display="block"
                            color="text.secondary"
                          >
                            ID: {userData.studentId}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      <Typography variant="body2">
                        📧 {userData.email}
                      </Typography>
                      <Typography variant="body2">
                        📞 {userData.phoneNumber || "N/A"}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={userData.role?.toUpperCase()}
                      color={getRoleColor(userData.role)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={userData.isActive ? "Active" : "Inactive"}
                      color={getStatusColor(userData.isActive)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {userData.room ? (
                      <Chip
                        label={`Room ${userData.room.roomNumber}`}
                        color="info"
                        size="small"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No Room
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(userData.createdAt).toLocaleDateString()}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) =>
                        handleMenuOpen(e, userData._id || userData.id)
                      }
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {users.length === 0 && !loading && (
          <Box textAlign="center" py={4}>
            <People sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No users found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {searchTerm || roleFilter || statusFilter
                ? "Try adjusting your filters"
                : "Add your first user to get started"}
            </Typography>
          </Box>
        )}

        {/* Pagination */}
        <TablePagination
          component="div"
          count={totalUsers}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            const userData = users.find((u) => (u._id || u.id) === menuUserId);
            handleOpenDialog("view", userData);
            handleMenuClose();
          }}
        >
          <Visibility sx={{ mr: 2 }} />
          View Details
        </MenuItem>
        <MenuItem
          onClick={() => {
            const userData = users.find((u) => (u._id || u.id) === menuUserId);
            handleOpenDialog("edit", userData);
            handleMenuClose();
          }}
        >
          <Edit sx={{ mr: 2 }} />
          Edit User
        </MenuItem>
        <MenuItem onClick={() => handleToggleUserStatus(menuUserId)}>
          <Block sx={{ mr: 2 }} />
          Toggle Status
        </MenuItem>
        <MenuItem
          onClick={() => handleDeleteUser(menuUserId)}
          sx={{ color: "error.main" }}
        >
          <Delete sx={{ mr: 2 }} />
          Delete User
        </MenuItem>
      </Menu>

      {/* User Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {dialogType === "view" && "User Details"}
          {dialogType === "edit" && "Edit User"}
          {dialogType === "create" && "Create New User"}
        </DialogTitle>
        <DialogContent>
          {selectedUser && dialogType === "view" && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Avatar
                    src={selectedUser.profilePicture?.url}
                    sx={{ width: 80, height: 80 }}
                  >
                    {selectedUser.name?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedUser.name}</Typography>
                    <Chip
                      label={selectedUser.role?.toUpperCase()}
                      color={getRoleColor(selectedUser.role)}
                      size="small"
                    />
                  </Box>
                </Box>
                <Typography variant="body2" gutterBottom>
                  <Email sx={{ mr: 1, fontSize: 16 }} />
                  {selectedUser.email}
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <Phone sx={{ mr: 1, fontSize: 16 }} />
                  {selectedUser.phoneNumber || "N/A"}
                </Typography>
                {selectedUser.studentId && (
                  <Typography variant="body2" gutterBottom>
                    <School sx={{ mr: 1, fontSize: 16 }} />
                    Student ID: {selectedUser.studentId}
                  </Typography>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>
                  Address
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedUser.address?.street &&
                    `${selectedUser.address.street}, `}
                  {selectedUser.address?.city &&
                    `${selectedUser.address.city}, `}
                  {selectedUser.address?.state &&
                    `${selectedUser.address.state} `}
                  {selectedUser.address?.pincode &&
                    `${selectedUser.address.pincode}`}
                  {!selectedUser.address?.city && "Address not provided"}
                </Typography>

                {selectedUser.emergencyContact && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" gutterBottom>
                      Emergency Contact
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedUser.emergencyContact.name} (
                      {selectedUser.emergencyContact.relation})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      📞 {selectedUser.emergencyContact.phone}
                    </Typography>
                  </Box>
                )}
              </Grid>
            </Grid>
          )}

          {dialogType === "create" && (
            <Alert severity="info" sx={{ mt: 1 }}>
              User creation form will be implemented here. For now, users can
              register through the frontend.
            </Alert>
          )}

          {dialogType === "edit" && (
            <Alert severity="info" sx={{ mt: 1 }}>
              User editing form will be implemented here.
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
          {dialogType !== "view" && (
            <Button variant="contained" onClick={handleCloseDialog}>
              Save Changes
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
