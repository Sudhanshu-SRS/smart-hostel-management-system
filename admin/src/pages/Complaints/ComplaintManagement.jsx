// admin/src/pages/Complaints/ComplaintManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
  Grid,
  Chip,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Tooltip,
  Badge,
  Snackbar,
  Alert,
  Checkbox,
  Fab,
  Menu,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Avatar,
  LinearProgress,
} from "@mui/material";
import {
  ReportProblem,
  FilterList,
  Add,
  Edit,
  Delete,
  Visibility,
  Assignment,
  CheckCircle,
  Cancel,
  TrendingUp,
  Schedule,
  Person,
  Chat,
  MoreVert,
  ExpandMore,
  BugReport,
  Warning,
  Info,
  Error,
  Refresh,
  Download,
  Print,
  Settings,
  Analytics,
  AssignmentInd,
  Timeline,
  Group,
} from "@mui/icons-material";
import { useSocket } from "../../context/SocketContext";
import api from "../../services/api";

const ComplaintManagement = () => {
  const { socket } = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({});
  const [overdueComplaints, setOverdueComplaints] = useState([]);
  const [slaMetrics, setSlaMetrics] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    priority: "",
    assignedTo: "",
    building: "",
    search: "",
  });

  // Dialog states
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [openCommentDialog, setOpenCommentDialog] = useState(false);
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [openBulkDialog, setOpenBulkDialog] = useState(false);

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [comment, setComment] = useState("");
  const [isInternalComment, setIsInternalComment] = useState(false);
  const [assignedTo, setAssignedTo] = useState("");
  const [bulkAction, setBulkAction] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("");
  const [bulkStatus, setBulkStatus] = useState("");

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  // Menu
  const [anchorEl, setAnchorEl] = useState(null);

  const statusColors = {
    open: "#f44336",
    in_progress: "#ff9800",
    resolved: "#4caf50",
    closed: "#9e9e9e",
    rejected: "#e91e63",
  };

  const priorityColors = {
    low: "#4caf50",
    medium: "#ff9800",
    high: "#f44336",
    urgent: "#9c27b0",
  };

  const categoryIcons = {
    maintenance: <Settings />,
    electrical: <BugReport />,
    plumbing: <Info />,
    cleaning: <Refresh />,
    security: <Warning />,
    wifi: <Analytics />,
    noise: <Error />,
    other: <ReportProblem />,
  };

  useEffect(() => {
    fetchComplaints();
    fetchUsers();
    fetchStats();
    fetchOverdueComplaints();
    fetchSlaMetrics();
  }, [filters]);

  useEffect(() => {
    if (socket) {
      socket.on("newComplaint", handleNewComplaint);
      socket.on("complaintUpdated", handleComplaintUpdate);
      socket.on("complaintAssigned", handleComplaintUpdate);
      socket.on("complaintResolved", handleComplaintUpdate);
      socket.on("complaintCommentAdded", handleCommentAdded);
      socket.on("complaintEscalated", handleComplaintUpdate);
      socket.on("complaintsBulkAssigned", handleBulkUpdate);
      socket.on("complaintsBulkUpdated", handleBulkUpdate);

      return () => {
        socket.off("newComplaint");
        socket.off("complaintUpdated");
        socket.off("complaintAssigned");
        socket.off("complaintResolved");
        socket.off("complaintCommentAdded");
        socket.off("complaintEscalated");
        socket.off("complaintsBulkAssigned");
        socket.off("complaintsBulkUpdated");
      };
    }
  }, [socket]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const params = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== "")
      );

      const response = await api.get("/complaints", { params });
      if (response.data.success) {
        setComplaints(response.data.complaints);
      }
    } catch (error) {
      showSnackbar("Error fetching complaints", "error");
      console.error("Error fetching complaints:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get("/users");
      if (response.data.success) {
        const staff = response.data.users.filter((user) =>
          ["admin", "warden"].includes(user.role)
        );
        setUsers(staff);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get("/complaints/stats/summary");
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchOverdueComplaints = async () => {
    try {
      const response = await api.get("/complaints/overdue");
      if (response.data.success) {
        setOverdueComplaints(response.data.complaints);
      }
    } catch (error) {
      console.error("Error fetching overdue complaints:", error);
    }
  };

  const fetchSlaMetrics = async () => {
    try {
      const response = await api.get("/complaints/sla-metrics");
      if (response.data.success) {
        setSlaMetrics(response.data);
      }
    } catch (error) {
      console.error("Error fetching SLA metrics:", error);
    }
  };

  const handleNewComplaint = (complaint) => {
    setComplaints((prev) => [complaint, ...prev]);
    fetchStats();
    showSnackbar(`New complaint received: ${complaint.title}`, "info");
  };

  const handleComplaintUpdate = (updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((complaint) =>
        complaint._id === updatedComplaint._id ? updatedComplaint : complaint
      )
    );
    fetchStats();
  };

  const handleCommentAdded = (data) => {
    handleComplaintUpdate(data.complaint);
    showSnackbar("New comment added", "info");
  };

  const handleBulkUpdate = () => {
    fetchComplaints();
    fetchStats();
    showSnackbar("Bulk operation completed", "success");
  };

  const handleAssignComplaint = async () => {
    try {
      const response = await api.post(
        `/complaints/${selectedComplaint._id}/assign`,
        {
          assignedTo,
        }
      );

      if (response.data.success) {
        showSnackbar("Complaint assigned successfully", "success");
        setOpenAssignDialog(false);
        setAssignedTo("");
      }
    } catch (error) {
      showSnackbar("Error assigning complaint", "error");
    }
  };

  const handleAddComment = async () => {
    try {
      const response = await api.post(
        `/complaints/${selectedComplaint._id}/comments`,
        {
          comment,
          isInternal: isInternalComment,
        }
      );

      if (response.data.success) {
        showSnackbar("Comment added successfully", "success");
        setOpenCommentDialog(false);
        setComment("");
        setIsInternalComment(false);
      }
    } catch (error) {
      showSnackbar("Error adding comment", "error");
    }
  };

  const handleResolveComplaint = async (complaintId, resolutionNotes) => {
    try {
      const response = await api.post(`/complaints/${complaintId}/resolve`, {
        resolutionNotes,
      });

      if (response.data.success) {
        showSnackbar("Complaint resolved successfully", "success");
      }
    } catch (error) {
      showSnackbar("Error resolving complaint", "error");
    }
  };

  const handleEscalateComplaint = async (complaintId, reason) => {
    try {
      const response = await api.post(`/complaints/${complaintId}/escalate`, {
        reason,
      });

      if (response.data.success) {
        showSnackbar("Complaint escalated successfully", "success");
      }
    } catch (error) {
      showSnackbar("Error escalating complaint", "error");
    }
  };

  const handleBulkOperation = async () => {
    try {
      if (selectedComplaints.length === 0) {
        showSnackbar("Please select complaints first", "warning");
        return;
      }

      let response;
      if (bulkAction === "assign") {
        response = await api.post("/complaints/bulk-assign", {
          complaintIds: selectedComplaints,
          assignedTo: bulkAssignee,
        });
      } else if (bulkAction === "status") {
        response = await api.post("/complaints/bulk-update-status", {
          complaintIds: selectedComplaints,
          status: bulkStatus,
        });
      }

      if (response.data.success) {
        showSnackbar(response.data.message, "success");
        setOpenBulkDialog(false);
        setSelectedComplaints([]);
        setBulkAction("");
        setBulkAssignee("");
        setBulkStatus("");
      }
    } catch (error) {
      showSnackbar("Error performing bulk operation", "error");
    }
  };

  const handleSelectAllComplaints = (event) => {
    if (event.target.checked) {
      const visibleComplaintIds = getFilteredComplaints()
        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
        .map((complaint) => complaint._id);
      setSelectedComplaints(visibleComplaintIds);
    } else {
      setSelectedComplaints([]);
    }
  };

  const handleSelectComplaint = (complaintId) => {
    setSelectedComplaints((prev) => {
      if (prev.includes(complaintId)) {
        return prev.filter((id) => id !== complaintId);
      } else {
        return [...prev, complaintId];
      }
    });
  };

  const getFilteredComplaints = () => {
    return complaints.filter((complaint) => {
      const matchesSearch =
        filters.search === "" ||
        complaint.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        complaint.description
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        complaint.user?.name
          .toLowerCase()
          .includes(filters.search.toLowerCase()) ||
        complaint.user?.studentId.includes(filters.search);

      const matchesStatus =
        filters.status === "" || complaint.status === filters.status;
      const matchesCategory =
        filters.category === "" || complaint.category === filters.category;
      const matchesPriority =
        filters.priority === "" || complaint.priority === filters.priority;
      const matchesAssignedTo =
        filters.assignedTo === "" ||
        complaint.assignedTo?._id === filters.assignedTo;
      const matchesBuilding =
        filters.building === "" ||
        complaint.room?.building === filters.building;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesCategory &&
        matchesPriority &&
        matchesAssignedTo &&
        matchesBuilding
      );
    });
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "open":
        return <ReportProblem />;
      case "in_progress":
        return <Schedule />;
      case "resolved":
        return <CheckCircle />;
      case "closed":
        return <CheckCircle />;
      case "rejected":
        return <Cancel />;
      default:
        return <ReportProblem />;
    }
  };

  const filteredComplaints = getFilteredComplaints();
  const paginatedComplaints = filteredComplaints.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (loading) {
    return (
      <Box sx={{ width: "100%", mt: 2 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ textAlign: "center", mt: 2 }}>
          Loading complaints...
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #1a237e, #3949ab)",
          color: "white",
          mb: 3,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={3}>
            <ReportProblem sx={{ fontSize: 60 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Complaint Management
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Issue resolution & tracking system
              </Typography>
            </Box>
          </Box>
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              startIcon={<FilterList />}
              onClick={() => setOpenFilterDialog(true)}
              sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
            >
              Filters
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchComplaints}
              sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "#f3e5f5", border: "1px solid #ce93d8" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {stats.totalComplaints || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total Complaints
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "#ffebee", border: "1px solid #ef9a9a" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="error" fontWeight="bold">
                {stats.openComplaints || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Open
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "#fff3e0", border: "1px solid #ffcc02" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                sx={{ color: "#f57c00" }}
                fontWeight="bold"
              >
                {stats.inProgressComplaints || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "#e8f5e8", border: "1px solid #a5d6a7" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {stats.resolvedComplaints || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card sx={{ bgcolor: "#fce4ec", border: "1px solid #f8bbd9" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                sx={{ color: "#c2185b" }}
                fontWeight="bold"
              >
                {stats.urgentComplaints || 0}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Urgent
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Overdue Complaints Alert */}
      {overdueComplaints.length > 0 && (
        <Card
          sx={{ mb: 3, bgcolor: "#fff3e0", borderLeft: "4px solid #ff9800" }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" gap={2}>
              <Warning color="warning" />
              <Typography variant="h6" color="warning.main">
                {overdueComplaints.length} Overdue Complaints
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mt: 1 }}>
              These complaints have exceeded their SLA targets and need
              immediate attention.
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* SLA Metrics */}
      {slaMetrics.slaMetrics && (
        <Accordion sx={{ mb: 3 }}>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Box display="flex" alignItems="center" gap={2}>
              <Timeline color="primary" />
              <Typography variant="h6">
                SLA Compliance: {slaMetrics.overallCompliance?.toFixed(1)}%
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Grid container spacing={2}>
              {Object.entries(slaMetrics.slaMetrics).map(
                ([priority, metrics]) => (
                  <Grid item xs={12} sm={6} md={3} key={priority}>
                    <Card>
                      <CardContent>
                        <Typography
                          variant="h6"
                          textTransform="capitalize"
                          color="primary"
                        >
                          {priority}
                        </Typography>
                        <Typography variant="body2">
                          Target: {metrics.slaTarget}h
                        </Typography>
                        <Typography variant="body2">
                          Compliance: {metrics.complianceRate?.toFixed(1)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={metrics.complianceRate || 0}
                          sx={{ mt: 1 }}
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                )
              )}
            </Grid>
          </AccordionDetails>
        </Accordion>
      )}

      {/* Bulk Actions */}
      {selectedComplaints.length > 0 && (
        <Paper sx={{ p: 2, mb: 3, bgcolor: "#e3f2fd" }}>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Typography variant="h6">
              {selectedComplaints.length} complaint(s) selected
            </Typography>
            <Box display="flex" gap={2}>
              <Button
                variant="contained"
                startIcon={<AssignmentInd />}
                onClick={() => setOpenBulkDialog(true)}
              >
                Bulk Actions
              </Button>
              <Button
                variant="outlined"
                onClick={() => setSelectedComplaints([])}
              >
                Clear Selection
              </Button>
            </Box>
          </Box>
        </Paper>
      )}

      {/* Complaints Table */}
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={
                      selectedComplaints.length > 0 &&
                      selectedComplaints.length < paginatedComplaints.length
                    }
                    checked={
                      paginatedComplaints.length > 0 &&
                      selectedComplaints.length === paginatedComplaints.length
                    }
                    onChange={handleSelectAllComplaints}
                  />
                </TableCell>
                <TableCell>ID</TableCell>
                <TableCell>Title</TableCell>
                <TableCell>Student</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Assigned To</TableCell>
                <TableCell>Created</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedComplaints.map((complaint) => (
                <TableRow
                  key={complaint._id}
                  sx={{
                    "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                    bgcolor: selectedComplaints.includes(complaint._id)
                      ? "rgba(25, 118, 210, 0.08)"
                      : "inherit",
                  }}
                >
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedComplaints.includes(complaint._id)}
                      onChange={() => handleSelectComplaint(complaint._id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontFamily="monospace">
                      #{complaint._id.slice(-6)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body1" fontWeight={500}>
                      {complaint.title}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" noWrap>
                      {complaint.description?.substring(0, 50)}...
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar sx={{ width: 32, height: 32 }}>
                        {complaint.user?.name?.charAt(0)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={500}>
                          {complaint.user?.name}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {complaint.user?.studentId}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={categoryIcons[complaint.category]}
                      label={complaint.category}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={complaint.priority}
                      size="small"
                      sx={{
                        bgcolor: priorityColors[complaint.priority],
                        color: "white",
                        textTransform: "capitalize",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      icon={getStatusIcon(complaint.status)}
                      label={complaint.status.replace("_", " ")}
                      size="small"
                      sx={{
                        bgcolor: statusColors[complaint.status],
                        color: "white",
                        textTransform: "capitalize",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {complaint.assignedTo ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24 }}>
                          {complaint.assignedTo.name?.charAt(0)}
                        </Avatar>
                        <Typography variant="body2">
                          {complaint.assignedTo.name}
                        </Typography>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="textSecondary">
                        Unassigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {formatDate(complaint.createdAt)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setOpenViewDialog(true);
                          }}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Assign">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setOpenAssignDialog(true);
                          }}
                        >
                          <Assignment />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Add Comment">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedComplaint(complaint);
                            setOpenCommentDialog(true);
                          }}
                        >
                          <Chat />
                        </IconButton>
                      </Tooltip>
                      <IconButton
                        size="small"
                        onClick={(event) => {
                          setAnchorEl(event.currentTarget);
                          setSelectedComplaint(complaint);
                        }}
                      >
                        <MoreVert />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredComplaints.length}
          page={page}
          onPageChange={(event, newPage) => setPage(newPage)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            handleEscalateComplaint(selectedComplaint._id, "Manual escalation");
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <TrendingUp />
          </ListItemIcon>
          <ListItemText>Escalate</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            handleResolveComplaint(selectedComplaint._id, "Resolved by admin");
            setAnchorEl(null);
          }}
        >
          <ListItemIcon>
            <CheckCircle />
          </ListItemIcon>
          <ListItemText>Mark as Resolved</ListItemText>
        </MenuItem>
      </Menu>

      {/* View Complaint Dialog */}
      <Dialog
        open={openViewDialog}
        onClose={() => setOpenViewDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Complaint Details #{selectedComplaint?._id.slice(-6)}
        </DialogTitle>
        <DialogContent>
          {selectedComplaint && (
            <Box>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Basic Information
                  </Typography>
                  <Typography>
                    <strong>Title:</strong> {selectedComplaint.title}
                  </Typography>
                  <Typography>
                    <strong>Description:</strong>{" "}
                    {selectedComplaint.description}
                  </Typography>
                  <Typography>
                    <strong>Category:</strong> {selectedComplaint.category}
                  </Typography>
                  <Typography>
                    <strong>Priority:</strong> {selectedComplaint.priority}
                  </Typography>
                  <Typography>
                    <strong>Status:</strong> {selectedComplaint.status}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="h6" gutterBottom>
                    Student Information
                  </Typography>
                  <Typography>
                    <strong>Name:</strong> {selectedComplaint.user?.name}
                  </Typography>
                  <Typography>
                    <strong>Student ID:</strong>{" "}
                    {selectedComplaint.user?.studentId}
                  </Typography>
                  <Typography>
                    <strong>Email:</strong> {selectedComplaint.user?.email}
                  </Typography>
                  <Typography>
                    <strong>Room:</strong> {selectedComplaint.room?.roomNumber}
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Comments ({selectedComplaint.comments?.length || 0})
                  </Typography>
                  {selectedComplaint.comments?.map((comment, index) => (
                    <Paper key={index} sx={{ p: 2, mb: 1 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                      >
                        <Typography variant="body2" fontWeight={500}>
                          {comment.user?.name} ({comment.user?.role})
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {formatDate(comment.timestamp)}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {comment.comment}
                      </Typography>
                      {comment.isInternal && (
                        <Chip
                          label="Internal"
                          size="small"
                          color="secondary"
                          sx={{ mt: 1 }}
                        />
                      )}
                    </Paper>
                  ))}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Assign Dialog */}
      <Dialog
        open={openAssignDialog}
        onClose={() => setOpenAssignDialog(false)}
      >
        <DialogTitle>Assign Complaint</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Assign To</InputLabel>
            <Select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              label="Assign To"
            >
              {users.map((user) => (
                <MenuItem key={user._id} value={user._id}>
                  {user.name} ({user.role})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>Cancel</Button>
          <Button onClick={handleAssignComplaint} variant="contained">
            Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog
        open={openCommentDialog}
        onClose={() => setOpenCommentDialog(false)}
      >
        <DialogTitle>Add Comment</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            sx={{ mt: 2 }}
          />
          <Box sx={{ mt: 2 }}>
            <Checkbox
              checked={isInternalComment}
              onChange={(e) => setIsInternalComment(e.target.checked)}
            />
            <Typography component="span">Internal Comment</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCommentDialog(false)}>Cancel</Button>
          <Button onClick={handleAddComment} variant="contained">
            Add Comment
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <Dialog
        open={openFilterDialog}
        onClose={() => setOpenFilterDialog(false)}
      >
        <DialogTitle>Filter Complaints</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Search"
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, status: e.target.value }))
                  }
                  label="Status"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="open">Open</MenuItem>
                  <MenuItem value="in_progress">In Progress</MenuItem>
                  <MenuItem value="resolved">Resolved</MenuItem>
                  <MenuItem value="closed">Closed</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select
                  value={filters.category}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  label="Category"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="electrical">Electrical</MenuItem>
                  <MenuItem value="plumbing">Plumbing</MenuItem>
                  <MenuItem value="cleaning">Cleaning</MenuItem>
                  <MenuItem value="security">Security</MenuItem>
                  <MenuItem value="wifi">WiFi</MenuItem>
                  <MenuItem value="noise">Noise</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={filters.priority}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  label="Priority"
                >
                  <MenuItem value="">All</MenuItem>
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Assigned To</InputLabel>
                <Select
                  value={filters.assignedTo}
                  onChange={(e) =>
                    setFilters((prev) => ({
                      ...prev,
                      assignedTo: e.target.value,
                    }))
                  }
                  label="Assigned To"
                >
                  <MenuItem value="">All</MenuItem>
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setFilters({
                status: "",
                category: "",
                priority: "",
                assignedTo: "",
                building: "",
                search: "",
              });
            }}
          >
            Clear
          </Button>
          <Button
            onClick={() => setOpenFilterDialog(false)}
            variant="contained"
          >
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Actions Dialog */}
      <Dialog open={openBulkDialog} onClose={() => setOpenBulkDialog(false)}>
        <DialogTitle>Bulk Actions</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Action</InputLabel>
            <Select
              value={bulkAction}
              onChange={(e) => setBulkAction(e.target.value)}
              label="Action"
            >
              <MenuItem value="assign">Assign to Staff</MenuItem>
              <MenuItem value="status">Update Status</MenuItem>
            </Select>
          </FormControl>

          {bulkAction === "assign" && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Assign To</InputLabel>
              <Select
                value={bulkAssignee}
                onChange={(e) => setBulkAssignee(e.target.value)}
                label="Assign To"
              >
                {users.map((user) => (
                  <MenuItem key={user._id} value={user._id}>
                    {user.name} ({user.role})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}

          {bulkAction === "status" && (
            <FormControl fullWidth sx={{ mt: 2 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                label="Status"
              >
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenBulkDialog(false)}>Cancel</Button>
          <Button onClick={handleBulkOperation} variant="contained">
            Apply to {selectedComplaints.length} complaint(s)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ComplaintManagement;
