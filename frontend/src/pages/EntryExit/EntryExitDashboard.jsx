// frontend/src/pages/EntryExit/EntryExitDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Badge,
  useTheme,
} from "@mui/material";
import {
  QrCodeScanner,
  History,
  TrendingUp,
  Schedule,
  LocationOn,
  ExitToApp,
  Refresh,
  PersonPin,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import QRScanner from "../../components/QRScanner/QRScanner";
import { gateAPI, entryExitAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { formatTimeAgo } from "../../utils/helpers";

const EntryExitDashboard = () => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [myHistory, setMyHistory] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState(null);

  const { user } = useAuth();
  const { notifications } = useSocket();
  const theme = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [historyRes, statsRes] = await Promise.all([
        entryExitAPI.getMyHistory({ limit: 10 }),
        entryExitAPI.getStats(),
      ]);

      setMyHistory(historyRes.data.records || []);
      setStats(statsRes.data.stats || {});

      // Determine current status
      if (historyRes.data.records.length > 0) {
        const lastRecord = historyRes.data.records[0];
        setCurrentStatus(lastRecord.actionType);
      }
    } catch (error) {
      console.error("Fetch data error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleScanSuccess = (scanData) => {
    // Refresh data after successful scan
    fetchData();
    setScannerOpen(false);

    // Update current status
    setCurrentStatus(scanData.actionType);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "entry":
        return "success";
      case "exit":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    return status === "entry" ? <PersonPin /> : <ExitToApp />;
  };

  const StatCard = ({ title, value, subtitle, icon, color = "primary" }) => (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" color={`${color}.main`}>
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
  );

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <div>Loading...</div>
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
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Entry/Exit Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              QR-based gate access system
            </Typography>
            {currentStatus && (
              <Chip
                label={`Currently: ${
                  currentStatus === "entry" ? "Inside Hostel" : "Outside Hostel"
                }`}
                color={currentStatus === "entry" ? "success" : "warning"}
                sx={{ mt: 1, color: "white", fontWeight: "bold" }}
              />
            )}
          </Box>
          <QrCodeScanner sx={{ fontSize: 80, opacity: 0.7 }} />
        </Box>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Entries"
            value={stats?.todayEntries || 0}
            icon={<PersonPin />}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Today's Exits"
            value={stats?.todayExits || 0}
            icon={<ExitToApp />}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Records"
            value={stats?.totalRecords || 0}
            icon={<History />}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Gates"
            value={stats?.activeGates || 0}
            icon={<LocationOn />}
            color="primary"
          />
        </Grid>
      </Grid>

      {/* Main Actions */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activity
            </Typography>

            {myHistory.length > 0 ? (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Action</TableCell>
                      <TableCell>Gate</TableCell>
                      <TableCell>Time</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {myHistory.slice(0, 5).map((record) => (
                      <TableRow key={record._id}>
                        <TableCell>
                          <Box display="flex" alignItems="center" gap={1}>
                            {getStatusIcon(record.actionType)}
                            <Chip
                              label={record.actionType.toUpperCase()}
                              color={getStatusColor(record.actionType)}
                              size="small"
                            />
                          </Box>
                        </TableCell>
                        <TableCell>{record.gate?.gateName}</TableCell>
                        <TableCell>{formatTimeAgo(record.timestamp)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No activity records found. Start by scanning a QR code!
              </Typography>
            )}

            <Box mt={2}>
              <Button
                variant="outlined"
                onClick={() => setHistoryOpen(true)}
                startIcon={<History />}
              >
                View Full History
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3, textAlign: "center" }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>

            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button
                variant="contained"
                size="large"
                fullWidth
                startIcon={<QrCodeScanner />}
                onClick={() => setScannerOpen(true)}
                sx={{
                  mb: 2,
                  py: 2,
                  background: "linear-gradient(135deg, #1976d2, #42a5f5)",
                }}
              >
                Scan QR Code
              </Button>
            </motion.div>

            <Button
              variant="outlined"
              fullWidth
              startIcon={<Refresh />}
              onClick={fetchData}
              sx={{ mb: 1 }}
            >
              Refresh Data
            </Button>

            <Typography variant="body2" color="text.secondary" mt={2}>
              Scan the QR code at the gate to record your entry or exit
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Floating Action Button */}
      <Fab
        color="primary"
        aria-label="scan"
        sx={{ position: "fixed", bottom: 24, right: 24 }}
        onClick={() => setScannerOpen(true)}
      >
        <QrCodeScanner />
      </Fab>

      {/* QR Scanner Dialog */}
      <QRScanner
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      {/* History Dialog */}
      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Complete Entry/Exit History</DialogTitle>
        <DialogContent>
          <List>
            {myHistory.map((record) => (
              <ListItem key={record._id}>
                <ListItemAvatar>
                  <Avatar
                    sx={{
                      bgcolor: getStatusColor(record.actionType) + ".main",
                    }}
                  >
                    {getStatusIcon(record.actionType)}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={`${record.actionType.toUpperCase()} - ${
                    record.gate?.gateName
                  }`}
                  secondary={`${new Date(
                    record.timestamp
                  ).toLocaleString()} • ${record.gate?.location}`}
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default EntryExitDashboard;
