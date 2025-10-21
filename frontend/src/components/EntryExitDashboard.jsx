import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Fab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  useTheme,
  Alert,
  LinearProgress,
} from "@mui/material";
import {
  QrCode2,
  QrCodeScanner,
  History,
  TrendingUp,
  ExitToApp,
  PersonPin,
  Schedule,
  Refresh,
  Restaurant,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import StudentQRCode from "../../components/QR/StudentQRCode";
import WardenQRScanner from "../../components/QR/WardenQRScanner";
import MessFeedbackForm from "../../components/Feedback/MessFeedbackForm";
import { gateAPI, entryExitAPI, messFeedbackAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { formatTimeAgo } from "../../utils/helpers";
import { toast } from "react-toastify";

// Add better initial state and error handling
const EntryExitDashboard = () => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrDisplayOpen, setQrDisplayOpen] = useState(false);
  const [messFeedbackOpen, setMessFeedbackOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState(null);
  const [gates, setGates] = useState([]); // Initialize as empty array
  const [recentLogs, setRecentLogs] = useState([]); // Initialize as empty array
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSubmittedFeedbackToday, setHasSubmittedFeedbackToday] =
    useState(false);
  const [qrData, setQrData] = useState(null);
  const [error, setError] = useState("");

  const { user } = useAuth();
  const { socket } = useSocket();
  const theme = useTheme();

  // Check if user is warden/admin
  const isWarden = user?.role === "warden" || user?.role === "admin";

  useEffect(() => {
    // Only fetch data when user is loaded and not loading
    if (user && typeof user === "object" && user.id) {
      fetchData();
      checkFeedbackSubmission();
    }
  }, [user]); // Remove the user.loading dependency

  useEffect(() => {
    // Listen for real-time updates
    if (socket) {
      socket.on("entryExitRecorded", handleRealTimeUpdate);
      socket.on("messFeedbackSubmitted", handleFeedbackUpdate);

      return () => {
        socket.off("entryExitRecorded");
        socket.off("messFeedbackSubmitted");
      };
    }
  }, [socket]);

  // Update the fetchData function to handle user authentication better
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Wait for user to be loaded
      if (!user) {
        console.log("Waiting for user authentication...");
        return;
      }

      // Check if user object has the necessary properties
      const userId = user._id || user.id;
      if (!userId) {
        throw new Error("User ID not found");
      }

      console.log("Fetching data for user:", userId, "Role:", user.role);

      // Fetch data based on user role
      const promises = [];

      // For students, get their QR code
      if (user.role === "student") {
        promises.push(
          gateAPI.getStudentQR(userId).catch((error) => {
            console.error("QR fetch failed:", error);
            return { data: null }; // Return null data instead of throwing
          })
        );
      }

      // Get stats (students get limited stats, wardens get full stats)
      promises.push(
        gateAPI.getGateStats().catch((error) => {
          console.error("Stats fetch failed:", error);
          return { data: { stats: null } }; // Return default structure
        })
      );

      // Get gates for wardens/admins
      if (isWarden) {
        promises.push(
          gateAPI.getGates().catch((error) => {
            console.error("Gates fetch failed:", error);
            return { data: { gates: [] } }; // Return empty array
          })
        );
      }

      // Get recent logs
      promises.push(
        gateAPI.getEntryExitLogs({ limit: 10 }).catch((error) => {
          console.error("Logs fetch failed:", error);
          return { data: { logs: [] } }; // Return empty array
        })
      );

      const results = await Promise.all(promises);
      console.log("API results:", results);

      let resultIndex = 0;

      // Handle QR result for students
      if (user.role === "student") {
        const qrResult = results[resultIndex++];
        if (qrResult && qrResult.data) {
          setQrData(qrResult.data);
        }
      }

      // Handle stats result
      const statsResult = results[resultIndex++];
      if (statsResult && statsResult.data && statsResult.data.stats) {
        setStats(statsResult.data.stats);
      }

      // Handle gates result for wardens
      if (isWarden) {
        const gatesResult = results[resultIndex++];
        if (gatesResult && gatesResult.data) {
          setGates(
            Array.isArray(gatesResult.data.gates) ? gatesResult.data.gates : []
          );
        }
      }

      // Handle logs result
      const logsResult = results[resultIndex++];
      if (logsResult && logsResult.data) {
        setRecentLogs(
          Array.isArray(logsResult.data.logs) ? logsResult.data.logs : []
        );
      }
    } catch (error) {
      console.error("Fetch data error:", error);
      setError(error.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const checkFeedbackSubmission = async () => {
    try {
      const response = await messFeedbackAPI.checkDailySubmission();
      setHasSubmittedFeedbackToday(response.data.hasSubmittedToday);
    } catch (error) {
      console.error("Check feedback submission error:", error);
    }
  };

  const handleRealTimeUpdate = (data) => {
    console.log("Real-time entry/exit update:", data);
    toast.info(`${data.student.name} ${data.action} recorded`, {
      icon: data.action === "exit" ? "🚪➡️" : "🚪⬅️",
    });

    // Refresh data
    fetchData();
  };

  const handleFeedbackUpdate = (data) => {
    console.log("Real-time feedback update:", data);
    toast.success("New mess feedback submitted!", { icon: "📝" });
    checkFeedbackSubmission();
  };

  const handleScanSuccess = (scanData) => {
    console.log("Scan success:", scanData);
    setScannerOpen(false);
    fetchData(); // Refresh data
  };

  const getStatusColor = (actionType) => {
    return actionType === "exit" ? "warning" : "success";
  };

  const getStatusIcon = (actionType) => {
    return actionType === "exit" ? <ExitToApp /> : <PersonPin />;
  };

  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    color = "primary",
    onClick,
  }) => (
    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
      <Card
        sx={{
          cursor: onClick ? "pointer" : "default",
          height: "100%",
          "&:hover": onClick ? { boxShadow: theme.shadows[8] } : {},
        }}
        onClick={onClick}
      >
        <CardContent>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="space-between"
          >
            <Box>
              <Typography
                variant="h4"
                fontWeight="bold"
                color={`${color}.main`}
              >
                {value}
              </Typography>
              <Typography variant="h6">{title}</Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary">
                  {subtitle}
                </Typography>
              )}
            </Box>
            <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Update the loading condition to be more robust
  if (loading || !user) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Loading Dashboard...
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  // Add error display before the main component return
  if (error) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
          <Button
            variant="outlined"
            size="small"
            onClick={fetchData}
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      </Box>
    );
  }

  // Update the renderRecentLogs function to be more defensive
  const renderRecentLogs = () => {
    // Ensure recentLogs is always an array
    const logs = Array.isArray(recentLogs) ? recentLogs : [];

    if (logs.length === 0) {
      return (
        <Alert severity="info">
          {isWarden
            ? "No recent activity found"
            : "No entry/exit records found. Use your QR code for gate access!"}
        </Alert>
      );
    }

    return (
      <List>
        {logs.slice(0, 8).map((log, index) => (
          <ListItem key={log._id || `log-${index}`} divider>
            <ListItemAvatar>
              <Avatar
                sx={{
                  bgcolor: getStatusColor(log.actionType) + ".main",
                }}
              >
                {getStatusIcon(log.actionType)}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="body1">
                    {isWarden ? log.student?.name || "Unknown" : "You"}{" "}
                    {log.actionType === "exit" ? "left" : "entered"}
                  </Typography>
                  <Chip
                    label={log.actionType?.toUpperCase() || "UNKNOWN"}
                    color={getStatusColor(log.actionType)}
                    size="small"
                  />
                  {log.isLateReturn && (
                    <Chip label="LATE" color="error" size="small" />
                  )}
                </Box>
              }
              secondary={
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    {log.gate?.gateName || "Unknown Gate"} •{" "}
                    {formatTimeAgo(log.createdAt)}
                  </Typography>
                  {log.outingReason && (
                    <Typography variant="body2" color="text.secondary">
                      Reason: {log.outingReason}
                    </Typography>
                  )}
                </Box>
              }
            />
          </ListItem>
        ))}
      </List>
    );
  };

  return (
    <Box>
      {/* Header */}
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
              {isWarden ? "Entry/Exit Management" : "My Hostel Access"}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {isWarden
                ? "QR-based student tracking system"
                : "QR code and mess feedback"}
            </Typography>
            {user?.currentStatus && (
              <Chip
                label={`Status: ${
                  user.currentStatus === "in_hostel"
                    ? "In Hostel"
                    : "Out of Hostel"
                }`}
                color={
                  user.currentStatus === "in_hostel" ? "success" : "warning"
                }
                sx={{ mt: 1, color: "white", fontWeight: "bold" }}
              />
            )}
          </Box>
          <QrCode2 sx={{ fontSize: 80, opacity: 0.7 }} />
        </Box>
      </Paper>

      {/* Stats Cards */}
      {isWarden && stats && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Today's Exits"
              value={stats.today?.exits || 0}
              icon={<ExitToApp />}
              color="warning"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Today's Entries"
              value={stats.today?.entries || 0}
              icon={<PersonPin />}
              color="success"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Currently Out"
              value={stats.current?.studentsOut || 0}
              icon={<Schedule />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Late Returns"
              value={stats.today?.lateReturns || 0}
              icon={<TrendingUp />}
              color="error"
            />
          </Grid>
        </Grid>
      )}

      {/* Student Dashboard */}
      {!isWarden && (
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="My QR Code"
              value="View"
              subtitle="Show to warden for entry/exit"
              icon={<QrCode2 />}
              color="primary"
              onClick={() => setQrDisplayOpen(true)}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Recent Activity"
              value={Array.isArray(recentLogs) ? recentLogs.length : 0}
              subtitle="Your entry/exit logs"
              icon={<History />}
              color="info"
            />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <StatCard
              title="Mess Feedback"
              value={hasSubmittedFeedbackToday ? "Done" : "Pending"}
              subtitle="Daily feedback status"
              icon={<Restaurant />}
              color={hasSubmittedFeedbackToday ? "success" : "warning"}
              onClick={() => setMessFeedbackOpen(true)}
            />
          </Grid>
        </Grid>
      )}

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Recent Activity */}
        <Grid item xs={12} md={isWarden ? 8 : 12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {isWarden ? "Recent Entry/Exit Activity" : "My Recent Activity"}
            </Typography>

            {renderRecentLogs()}

            <Box mt={2} display="flex" gap={2}>
              <Button
                variant="outlined"
                onClick={fetchData}
                startIcon={<Refresh />}
              >
                Refresh
              </Button>
              {!isWarden && (
                <Button
                  variant="contained"
                  startIcon={<QrCode2 />}
                  onClick={() => setQrDisplayOpen(true)}
                >
                  Show My QR
                </Button>
              )}
            </Box>
          </Paper>
        </Grid>

        {/* Warden Controls */}
        {isWarden && (
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Scanner Controls
              </Typography>

              <Box mb={3}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Select Active Gate
                </Typography>
                <List>
                  {gates.map((gate) => (
                    <ListItem
                      key={gate._id}
                      button
                      selected={selectedGate?._id === gate._id}
                      onClick={() => setSelectedGate(gate)}
                      sx={{ borderRadius: 1, mb: 1 }}
                    >
                      <ListItemText
                        primary={gate.gateName}
                        secondary={gate.location}
                      />
                    </ListItem>
                  ))}
                </List>
              </Box>

              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<QrCodeScanner />}
                onClick={() => setScannerOpen(true)}
                disabled={!selectedGate}
                sx={{ mb: 2 }}
              >
                Scan Student QR
              </Button>

              {selectedGate && (
                <Alert severity="info" size="small">
                  Active Gate: <strong>{selectedGate.gateName}</strong>
                  <br />
                  Location: {selectedGate.location}
                </Alert>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Floating Action Buttons for Students */}
      {!isWarden && (
        <Box sx={{ position: "fixed", bottom: 24, right: 24 }}>
          <Fab
            color="primary"
            sx={{ mr: 1, mb: 1 }}
            onClick={() => setQrDisplayOpen(true)}
          >
            <QrCode2 />
          </Fab>
          {!hasSubmittedFeedbackToday && (
            <Fab color="secondary" onClick={() => setMessFeedbackOpen(true)}>
              <Restaurant />
            </Fab>
          )}
        </Box>
      )}

      {/* Dialogs */}

      {/* Student QR Code Dialog */}
      <Dialog
        open={qrDisplayOpen}
        onClose={() => setQrDisplayOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>My QR Code</DialogTitle>
        <DialogContent>
          <StudentQRCode />
        </DialogContent>
      </Dialog>

      {/* Warden QR Scanner Dialog */}
      {isWarden && (
        <WardenQRScanner
          open={scannerOpen}
          onClose={() => setScannerOpen(false)}
          onScanSuccess={handleScanSuccess}
          selectedGate={selectedGate}
        />
      )}

      {/* Mess Feedback Dialog */}
      <Dialog
        open={messFeedbackOpen}
        onClose={() => setMessFeedbackOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Mess Feedback</DialogTitle>
        <DialogContent>
          <MessFeedbackForm />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EntryExitDashboard;
