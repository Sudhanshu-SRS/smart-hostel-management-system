// src/pages/complaints/complaints.jsx
import React, { useState, useEffect } from "react";
import {
  Typography,
  Box,
  Paper,
  Card,
  CardContent,
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
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Fab,
  Rating,
  Collapse,
  Alert,
  IconButton,
  Tooltip,
  Badge,
  Avatar,
  LinearProgress,
  Snackbar,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from "@mui/material";
import {
  Add,
  ReportProblem,
  Schedule,
  CheckCircle,
  Cancel,
  Chat,
  Visibility,
  ExpandMore,
  ExpandLess,
  Phone,
  Email,
  Home,
  Person,
  Star,
  Refresh,
  Send,
  AttachFile,
  Info,
  Warning,
  Error,
  CheckCircle as Success,
} from "@mui/icons-material";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import api from "../../services/api";

const Complaints = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [openViewDialog, setOpenViewDialog] = useState(false);
  const [openFeedbackDialog, setOpenFeedbackDialog] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [expandedComplaint, setExpandedComplaint] = useState(null);

  // Form states
  const [complaintForm, setComplaintForm] = useState({
    title: "",
    description: "",
    category: "",
    priority: "medium",
    location: "",
  });
  const [comment, setComment] = useState("");
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 0,
    feedback: "",
  });

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Snackbar
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

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

  const getUpdateStatusColor = (status) => {
    const colorMap = {
      open: "#f44336",
      in_progress: "#ff9800",
      resolved: "#4caf50",
      closed: "#9e9e9e",
      rejected: "#e91e63",
      pending: "#2196f3",
      assigned: "#673ab7",
      escalated: "#ff5722",
    };
    return colorMap[status] || "#9e9e9e";
  };

  const categoryIcons = {
    maintenance: <Home />,
    electrical: <Error />,
    plumbing: <Info />,
    cleaning: <Refresh />,
    security: <Warning />,
    wifi: <Phone />,
    noise: <Error />,
    other: <ReportProblem />,
  };

  useEffect(() => {
    fetchComplaints();
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on("complaintUpdated", handleComplaintUpdate);
      socket.on("complaintResolved", handleComplaintUpdate);
      socket.on("complaintCommentAdded", handleCommentAdded);

      return () => {
        socket.off("complaintUpdated");
        socket.off("complaintResolved");
        socket.off("complaintCommentAdded");
      };
    }
  }, [socket]);

  const fetchComplaints = async () => {
    try {
      setLoading(true);
      const response = await api.get("/complaints");
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

  const handleComplaintUpdate = (updatedComplaint) => {
    setComplaints((prev) =>
      prev.map((complaint) =>
        complaint._id === updatedComplaint._id ? updatedComplaint : complaint
      )
    );

    // Show notification if it's the user's complaint
    if (updatedComplaint.user._id === user._id) {
      showSnackbar(
        `Your complaint has been ${updatedComplaint.status.replace("_", " ")}`,
        "info"
      );
    }
  };

  const handleCommentAdded = (data) => {
    if (data.complaintId === selectedComplaint?._id) {
      setSelectedComplaint(data.complaint);
    }
    handleComplaintUpdate(data.complaint);
  };

  const handleCreateComplaint = async () => {
    try {
      if (
        !complaintForm.title ||
        !complaintForm.description ||
        !complaintForm.category
      ) {
        showSnackbar("Please fill in all required fields", "warning");
        return;
      }

      const response = await api.post("/complaints", complaintForm);
      if (response.data.success) {
        showSnackbar("Complaint submitted successfully", "success");
        setOpenCreateDialog(false);
        setComplaintForm({
          title: "",
          description: "",
          category: "",
          priority: "medium",
          location: "",
        });
        fetchComplaints();
      }
    } catch (error) {
      showSnackbar("Error creating complaint", "error");
      console.error("Error creating complaint:", error);
    }
  };

  const handleAddComment = async () => {
    try {
      if (!comment.trim()) {
        showSnackbar("Please enter a comment", "warning");
        return;
      }

      const response = await api.post(
        `/complaints/${selectedComplaint._id}/comments`,
        {
          comment: comment.trim(),
        }
      );

      if (response.data.success) {
        showSnackbar("Comment added successfully", "success");
        setComment("");
      }
    } catch (error) {
      showSnackbar("Error adding comment", "error");
      console.error("Error adding comment:", error);
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      if (!feedbackForm.rating) {
        showSnackbar("Please provide a rating", "warning");
        return;
      }

      const response = await api.post(
        `/complaints/${selectedComplaint._id}/feedback`,
        feedbackForm
      );
      if (response.data.success) {
        showSnackbar("Feedback submitted successfully", "success");
        setOpenFeedbackDialog(false);
        setFeedbackForm({ rating: 0, feedback: "" });
        fetchComplaints();
      }
    } catch (error) {
      showSnackbar("Error submitting feedback", "error");
      console.error("Error submitting feedback:", error);
    }
  };

  const getFilteredComplaints = () => {
    return complaints.filter((complaint) => {
      const matchesStatus =
        statusFilter === "all" || complaint.status === statusFilter;
      const matchesCategory =
        categoryFilter === "all" || complaint.category === categoryFilter;
      return matchesStatus && matchesCategory;
    });
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

  const getComplaintSteps = (complaint) => {
    const steps = ["Submitted", "In Progress", "Resolved"];
    const activeStep =
      complaint.status === "open"
        ? 0
        : complaint.status === "in_progress"
        ? 1
        : complaint.status === "resolved" || complaint.status === "closed"
        ? 2
        : 0;

    return { steps, activeStep };
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const canProvideFeedback = (complaint) => {
    return complaint && complaint.status === "resolved" && !complaint.rating;
  };

  const canAddComment = (complaint) => {
    return complaint && ["open", "in_progress"].includes(complaint.status);
  };

  const filteredComplaints = getFilteredComplaints();

  if (loading) {
    return (
      <Box sx={{ width: "100%", mt: 2 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ textAlign: "center", mt: 2 }}>
          Loading your complaints...
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
          background: "linear-gradient(135deg, #e53935, #f44336)",
          color: "white",
          mb: 3,
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box display="flex" alignItems="center" gap={3}>
            <ReportProblem sx={{ fontSize: 60 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                My Complaints
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Submit and track your hostel issues
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "white" }}
            size="large"
          >
            New Complaint
          </Button>
        </Box>
      </Paper>

      {/* Statistics */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#fff3e0", border: "1px solid #ffcc02" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography
                variant="h4"
                sx={{ color: "#f57c00" }}
                fontWeight="bold"
              >
                {complaints.filter((c) => c.status === "open").length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Open
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#e3f2fd", border: "1px solid #90caf9" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="primary" fontWeight="bold">
                {complaints.filter((c) => c.status === "in_progress").length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                In Progress
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#e8f5e8", border: "1px solid #a5d6a7" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="success.main" fontWeight="bold">
                {complaints.filter((c) => c.status === "resolved").length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Resolved
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ bgcolor: "#f3e5f5", border: "1px solid #ce93d8" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h4" color="secondary" fontWeight="bold">
                {complaints.length}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="open">Open</MenuItem>
                <MenuItem value="in_progress">In Progress</MenuItem>
                <MenuItem value="resolved">Resolved</MenuItem>
                <MenuItem value="closed">Closed</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                label="Category"
              >
                <MenuItem value="all">All Categories</MenuItem>
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
          <Grid item xs={12} sm={4} md={3}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchComplaints}
              fullWidth
            >
              Refresh
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Complaints List */}
      {filteredComplaints.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <ReportProblem
            sx={{ fontSize: 80, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h5" color="textSecondary" gutterBottom>
            No complaints found
          </Typography>
          <Typography variant="body1" color="textSecondary" gutterBottom>
            {statusFilter === "all" && categoryFilter === "all"
              ? "You haven't submitted any complaints yet."
              : "No complaints match your current filters."}
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenCreateDialog(true)}
            sx={{ mt: 2 }}
          >
            Submit Your First Complaint
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredComplaints.map((complaint) => {
            const { steps, activeStep } = getComplaintSteps(complaint);
            const isExpanded = expandedComplaint === complaint._id;

            return (
              <Grid item xs={12} key={complaint._id}>
                <Card
                  sx={{
                    position: "relative",
                    "&:hover": { boxShadow: 3 },
                    border:
                      complaint.priority === "urgent"
                        ? "2px solid #f44336"
                        : "1px solid #e0e0e0",
                  }}
                >
                  <CardContent>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="flex-start"
                      mb={2}
                    >
                      <Box flex={1}>
                        <Box display="flex" alignItems="center" gap={2} mb={1}>
                          <Typography variant="h6" fontWeight="bold">
                            {complaint.title}
                          </Typography>
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
                          <Chip
                            label={complaint.priority}
                            size="small"
                            sx={{
                              bgcolor: priorityColors[complaint.priority],
                              color: "white",
                              textTransform: "capitalize",
                            }}
                          />
                          {complaint.priority === "urgent" && (
                            <Chip
                              icon={<Warning />}
                              label="URGENT"
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                          )}
                        </Box>
                        <Typography
                          variant="body2"
                          color="textSecondary"
                          gutterBottom
                        >
                          #{complaint._id.slice(-6)} •{" "}
                          {categoryIcons[complaint.category]}{" "}
                          {complaint.category} •{" "}
                          {formatDate(complaint.createdAt)}
                        </Typography>
                        <Typography variant="body1" sx={{ mb: 2 }}>
                          {complaint.description}
                        </Typography>

                        {/* Progress Stepper */}
                        <Box sx={{ maxWidth: 400, mb: 2 }}>
                          <Stepper activeStep={activeStep} alternativeLabel>
                            {steps.map((label, index) => (
                              <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                              </Step>
                            ))}
                          </Stepper>
                        </Box>

                        {/* Assignment Info */}
                        {complaint.assignedTo && (
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={2}
                          >
                            <Person color="primary" />
                            <Typography variant="body2">
                              Assigned to:{" "}
                              <strong>{complaint.assignedTo.name}</strong> (
                              {complaint.assignedTo.role})
                            </Typography>
                          </Box>
                        )}

                        {/* Resolution Info */}
                        {complaint.actualResolutionDate && (
                          <Alert severity="success" sx={{ mb: 2 }}>
                            <Typography variant="body2">
                              <strong>Resolved:</strong>{" "}
                              {formatDate(complaint.actualResolutionDate)}
                              {complaint.resolutionNotes && (
                                <>
                                  <br />
                                  <strong>Notes:</strong>{" "}
                                  {complaint.resolutionNotes}
                                </>
                              )}
                            </Typography>
                          </Alert>
                        )}

                        {/* Rating */}
                        {complaint.rating && (
                          <Box
                            display="flex"
                            alignItems="center"
                            gap={1}
                            mb={2}
                          >
                            <Star color="warning" />
                            <Rating
                              value={complaint.rating}
                              readOnly
                              size="small"
                            />
                            <Typography variant="body2">
                              ({complaint.rating}/5)
                            </Typography>
                            {complaint.feedback && (
                              <Typography variant="body2" sx={{ ml: 2 }}>
                                "{complaint.feedback}"
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>

                      <Box display="flex" flexDirection="column" gap={1}>
                        <Tooltip title="View Details">
                          <IconButton
                            onClick={() => {
                              setSelectedComplaint(complaint);
                              setOpenViewDialog(true);
                            }}
                          >
                            <Visibility />
                          </IconButton>
                        </Tooltip>
                        {canAddComment(complaint) && (
                          <Tooltip title="Add Comment">
                            <IconButton
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setOpenViewDialog(true);
                              }}
                            >
                              <Badge
                                badgeContent={complaint.comments?.length || 0}
                                color="primary"
                              >
                                <Chat />
                              </Badge>
                            </IconButton>
                          </Tooltip>
                        )}
                        {canProvideFeedback(complaint) && (
                          <Tooltip title="Provide Feedback">
                            <IconButton
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                setOpenFeedbackDialog(true);
                              }}
                              sx={{ color: "#ff9800" }}
                            >
                              <Star />
                            </IconButton>
                          </Tooltip>
                        )}
                        <IconButton
                          onClick={() =>
                            setExpandedComplaint(
                              isExpanded ? null : complaint._id
                            )
                          }
                        >
                          {isExpanded ? <ExpandLess /> : <ExpandMore />}
                        </IconButton>
                      </Box>
                    </Box>

                    {/* Expanded Content */}
                    <Collapse in={isExpanded}>
                      <Box
                        sx={{ mt: 2, pt: 2, borderTop: "1px solid #e0e0e0" }}
                      >
                        <Typography variant="h6" gutterBottom>
                          Comments ({complaint.comments?.length || 0})
                        </Typography>
                        <List>
                          {complaint.comments
                            ?.filter((comment) => !comment.isInternal)
                            .map((comment, index) => (
                              <React.Fragment key={index}>
                                <ListItem alignItems="flex-start">
                                  <ListItemIcon>
                                    <Avatar
                                      sx={{
                                        bgcolor:
                                          comment.user.role === "student"
                                            ? "primary.main"
                                            : "secondary.main",
                                        width: 40,
                                        height: 40,
                                      }}
                                    >
                                      {comment.user.name?.charAt(0)}
                                    </Avatar>
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={
                                      <Box
                                        display="flex"
                                        justifyContent="space-between"
                                        alignItems="center"
                                      >
                                        <Typography
                                          variant="body1"
                                          fontWeight="medium"
                                        >
                                          {comment.user.name} (
                                          {comment.user.role})
                                        </Typography>
                                        <Typography
                                          variant="caption"
                                          color="text.secondary"
                                        >
                                          {formatDate(comment.timestamp)}
                                        </Typography>
                                      </Box>
                                    }
                                    secondary={
                                      <Paper
                                        sx={{ p: 2, bgcolor: "#f5f5f5", mt: 1 }}
                                      >
                                        <Typography variant="body2">
                                          {comment.comment}
                                        </Typography>
                                      </Paper>
                                    }
                                  />
                                </ListItem>
                                {index <
                                  complaint.comments?.filter(
                                    (c) => !c.isInternal
                                  ).length -
                                    1 && <Divider />}
                              </React.Fragment>
                            ))}
                          {!complaint.comments?.filter((c) => !c.isInternal)
                            .length && (
                            <ListItem>
                              <ListItemText
                                primary="No comments yet"
                                secondary="Be the first to add a comment to this complaint."
                              />
                            </ListItem>
                          )}
                        </List>

                        {canAddComment(complaint) && (
                          <Box sx={{ mt: 2 }}>
                            <TextField
                              fullWidth
                              multiline
                              rows={3}
                              placeholder="Add a comment..."
                              value={
                                expandedComplaint === complaint._id
                                  ? comment
                                  : ""
                              }
                              onChange={(e) => {
                                if (expandedComplaint === complaint._id) {
                                  setComment(e.target.value);
                                }
                              }}
                              sx={{ mb: 1 }}
                            />
                            <Button
                              variant="contained"
                              startIcon={<Send />}
                              onClick={() => {
                                setSelectedComplaint(complaint);
                                handleAddComment();
                              }}
                              disabled={!comment.trim()}
                            >
                              Add Comment
                            </Button>
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Complaint Dialog */}
      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <ReportProblem color="error" />
            Submit New Complaint
          </Box>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Title"
                placeholder="Brief description of the issue"
                value={complaintForm.title}
                onChange={(e) =>
                  setComplaintForm((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Description"
                placeholder="Detailed description of the problem..."
                value={complaintForm.description}
                onChange={(e) =>
                  setComplaintForm((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select
                  value={complaintForm.category}
                  onChange={(e) =>
                    setComplaintForm((prev) => ({
                      ...prev,
                      category: e.target.value,
                    }))
                  }
                  label="Category"
                >
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
                  value={complaintForm.priority}
                  onChange={(e) =>
                    setComplaintForm((prev) => ({
                      ...prev,
                      priority: e.target.value,
                    }))
                  }
                  label="Priority"
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                  <MenuItem value="urgent">Urgent</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                placeholder="Specific location (e.g., Room 101, Common Area, etc.)"
                value={complaintForm.location}
                onChange={(e) =>
                  setComplaintForm((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
              />
            </Grid>
          </Grid>

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              <strong>Note:</strong> Your complaint will be reviewed and
              assigned to the appropriate staff member. You'll receive updates
              on the status and can track progress here.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateComplaint} variant="contained">
            Submit Complaint
          </Button>
        </DialogActions>
      </Dialog>

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
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    {selectedComplaint.title}
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedComplaint.description}
                  </Typography>
                  <Box display="flex" gap={1} mb={2}>
                    <Chip label={selectedComplaint.category} size="small" />
                    <Chip label={selectedComplaint.priority} size="small" />
                    <Chip
                      label={selectedComplaint.status.replace("_", " ")}
                      size="small"
                    />
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Comments
                  </Typography>
                  {selectedComplaint.comments
                    ?.filter((comment) => !comment.isInternal)
                    .map((comment, index) => (
                      <Paper key={index} sx={{ p: 2, mb: 1 }}>
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Typography variant="body2" fontWeight={500}>
                            {comment.user.name} ({comment.user.role})
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatDate(comment.timestamp)}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {comment.comment}
                        </Typography>
                      </Paper>
                    ))}

                  {canAddComment(selectedComplaint) && (
                    <Box sx={{ mt: 2 }}>
                      <TextField
                        fullWidth
                        multiline
                        rows={3}
                        placeholder="Add a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        sx={{ mb: 1 }}
                      />
                      <Button
                        variant="contained"
                        startIcon={<Send />}
                        onClick={handleAddComment}
                        disabled={!comment.trim()}
                      >
                        Add Comment
                      </Button>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenViewDialog(false)}>Close</Button>
          {canProvideFeedback(selectedComplaint) && (
            <Button
              onClick={() => {
                setOpenViewDialog(false);
                setOpenFeedbackDialog(true);
              }}
              variant="contained"
              startIcon={<Star />}
            >
              Provide Feedback
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Feedback Dialog */}
      <Dialog
        open={openFeedbackDialog}
        onClose={() => setOpenFeedbackDialog(false)}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <Star color="warning" />
            Rate Resolution Quality
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            How satisfied are you with the resolution of your complaint?
          </Typography>
          <Box sx={{ my: 2, textAlign: "center" }}>
            <Rating
              value={feedbackForm.rating}
              onChange={(event, newValue) => {
                setFeedbackForm((prev) => ({ ...prev, rating: newValue }));
              }}
              size="large"
            />
          </Box>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Additional Feedback (Optional)"
            placeholder="Share your experience or suggestions for improvement..."
            value={feedbackForm.feedback}
            onChange={(e) =>
              setFeedbackForm((prev) => ({ ...prev, feedback: e.target.value }))
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFeedbackDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitFeedback}
            variant="contained"
            disabled={!feedbackForm.rating}
          >
            Submit Feedback
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button */}
      <Fab
        color="error"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => setOpenCreateDialog(true)}
      >
        <Add />
      </Fab>

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

export default Complaints;
