import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Chip,
  Alert,
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
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  QrCodeScanner,
  ExitToApp,
  PersonPin,
  Schedule,
  TrendingUp,
  Refresh,
  Visibility,
  Download,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import WardenQRScanner from "../../components/QR/WardenQRScanner";
import adminAPI from "../../services/api";
import { formatTimeAgo } from "../../utils/adminHelpers";
import { toast } from "react-toastify";

const EntryExitManagement = () => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState(null);
  const [gates, setGates] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [gatesRes, statsRes, logsRes] = await Promise.all([
        adminAPI.getAllGates(),
        adminAPI.getGateStats(),
        adminAPI.getEntryExitLogs({ limit: 20 }),
      ]);

      setGates(gatesRes.data.gates || []);
      setStats(statsRes.data.stats || {});
      setRecentLogs(logsRes.data.logs || []);

      // Auto-select first active gate
      const activeGate = gatesRes.data.gates?.find((gate) => gate.isActive);
      if (activeGate && !selectedGate) {
        setSelectedGate(activeGate);
      }
    } catch (error) {
      console.error("Fetch data error:", error);
      setError("Failed to load data");
      toast.error("Failed to load entry/exit data");
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = () => {
    setScannerOpen(false);
    fetchData(); // Refresh data after successful scan
  };

  const getStatusColor = (actionType) => {
    return actionType === "exit" ? "warning" : "success";
  };

  const getStatusIcon = (actionType) => {
    return actionType === "exit" ? <ExitToApp /> : <PersonPin />;
  };

  const StatCard = ({ title, value, icon, color = "primary" }) => (
    <motion.div whileHover={{ scale: 1.02 }}>
      <Card sx={{ height: "100%" }}>
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
            </Box>
            <Avatar sx={{ bgcolor: `${color}.main`, width: 56, height: 56 }}>
              {icon}
            </Avatar>
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (loading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom>
          Loading Entry/Exit Management...
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
          mb: 3,
          background: "linear-gradient(135deg, #1976d2, #42a5f5)",
          color: "white",
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Entry/Exit Management
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          QR-based student tracking and monitoring system
        </Typography>
      </Paper>

      {error && (
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
      )}

      {/* Stats Cards */}
      {stats && (
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

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* QR Scanner Controls */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              QR Scanner Controls
            </Typography>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Select Gate</InputLabel>
              <Select
                value={selectedGate?._id || ""}
                onChange={(e) => {
                  const gate = gates.find((g) => g._id === e.target.value);
                  setSelectedGate(gate);
                }}
                label="Select Gate"
              >
                {gates
                  .filter((gate) => gate.isActive)
                  .map((gate) => (
                    <MenuItem key={gate._id} value={gate._id}>
                      {gate.gateName} - {gate.location}
                    </MenuItem>
                  ))}
              </Select>
            </FormControl>

            <Button
              variant="contained"
              size="large"
              fullWidth
              startIcon={<QrCodeScanner />}
              onClick={() => setScannerOpen(true)}
              disabled={!selectedGate}
              sx={{ mb: 2 }}
            >
              Start QR Scanner
            </Button>

            {selectedGate && (
              <Alert severity="info" size="small">
                Active Gate: <strong>{selectedGate.gateName}</strong>
                <br />
                Location: {selectedGate.location}
              </Alert>
            )}

            <Button
              variant="outlined"
              fullWidth
              startIcon={<Refresh />}
              onClick={fetchData}
              sx={{ mt: 2 }}
            >
              Refresh Data
            </Button>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Box
              display="flex"
              justifyContent="space-between"
              alignItems="center"
              mb={2}
            >
              <Typography variant="h6">Recent Entry/Exit Activity</Typography>
              <Button
                startIcon={<Download />}
                onClick={() => toast.info("Export feature coming soon!")}
              >
                Export
              </Button>
            </Box>

            {recentLogs.length === 0 ? (
              <Alert severity="info">No recent activity found</Alert>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Student</TableCell>
                      <TableCell>Action</TableCell>
                      <TableCell>Gate</TableCell>
                      <TableCell>Time</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {recentLogs.slice(0, 10).map((log) => (
                      <TableRow key={log._id}>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {log.student?.name || "Unknown"}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {log.student?.studentId}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={getStatusIcon(log.actionType)}
                            label={log.actionType?.toUpperCase()}
                            color={getStatusColor(log.actionType)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          {log.gate?.gateName || "Unknown Gate"}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatTimeAgo(log.createdAt)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {log.isLateReturn && (
                            <Chip label="LATE" color="error" size="small" />
                          )}
                          {log.outingReason && (
                            <Typography variant="caption" display="block">
                              Reason: {log.outingReason}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="View Details">
                            <IconButton size="small">
                              <Visibility />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* QR Scanner Dialog */}
      <WardenQRScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess} // This will be passed as onScanComplete
        selectedGate={selectedGate}
      />
    </Box>
  );
};

export default EntryExitManagement;
