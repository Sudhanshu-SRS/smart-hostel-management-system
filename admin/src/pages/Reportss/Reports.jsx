// admin/src/pages/Reports/Reports.jsx
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Snackbar,
  Alert,
  Divider,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  Assessment,
  Download,
  Print,
  FilterList,
  Refresh,
  ExpandMore,
  PieChart,
  BarChart,
  TrendingUp,
  Schedule,
  Group,
  Home,
  Payment,
  ReportProblem,
  Analytics,
  CalendarToday,
  Business,
  Visibility,
  GetApp,
} from "@mui/icons-material";
import {
  PieChart as RechartsPieChart,
  Cell,
  BarChart as RechartsBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from "recharts";
import api from "../../services/api";

const Reports = () => {
  const [reports, setReports] = useState({});
  const [loading, setLoading] = useState({
    occupancy: false,
    complaints: false,
    payments: false,
    analytics: false,
    studentActivity: false,
  });
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
    building: "",
    floor: "",
    status: "",
    category: "",
    paymentType: "",
  });
  const [openFilterDialog, setOpenFilterDialog] = useState(false);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportType, setExportType] = useState("");
  const [exportFormat, setExportFormat] = useState("json");
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info",
  });

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#8884D8",
    "#82CA9D",
  ];

  useEffect(() => {
    loadAllReports();
  }, []);

  const loadAllReports = async () => {
    await Promise.all([
      loadOccupancyReport(),
      loadComplaintsReport(),
      loadPaymentsReport(),
      loadDashboardAnalytics(),
      loadStudentActivityReport(),
    ]);
  };

  const loadOccupancyReport = async () => {
    try {
      setLoading((prev) => ({ ...prev, occupancy: true }));
      const params = {
        building: filters.building,
        floor: filters.floor,
      };
      const response = await api.get("/reports/occupancy", { params });

      if (response.data.success) {
        setReports((prev) => ({ ...prev, occupancy: response.data.report }));
      }
    } catch (error) {
      showSnackbar("Error loading occupancy report", "error");
      console.error("Error loading occupancy report:", error);
    } finally {
      setLoading((prev) => ({ ...prev, occupancy: false }));
    }
  };

  const loadComplaintsReport = async () => {
    try {
      setLoading((prev) => ({ ...prev, complaints: true }));
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        category: filters.category,
      };
      const response = await api.get("/reports/complaints", { params });

      if (response.data.success) {
        setReports((prev) => ({ ...prev, complaints: response.data.report }));
      }
    } catch (error) {
      showSnackbar("Error loading complaints report", "error");
      console.error("Error loading complaints report:", error);
    } finally {
      setLoading((prev) => ({ ...prev, complaints: false }));
    }
  };

  const loadPaymentsReport = async () => {
    try {
      setLoading((prev) => ({ ...prev, payments: true }));
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        status: filters.status,
        paymentType: filters.paymentType,
      };
      const response = await api.get("/reports/payments", { params });

      if (response.data.success) {
        setReports((prev) => ({ ...prev, payments: response.data.report }));
      }
    } catch (error) {
      showSnackbar("Error loading payments report", "error");
      console.error("Error loading payments report:", error);
    } finally {
      setLoading((prev) => ({ ...prev, payments: false }));
    }
  };

  const loadDashboardAnalytics = async () => {
    try {
      setLoading((prev) => ({ ...prev, analytics: true }));
      const response = await api.get("/reports/dashboard-analytics");

      if (response.data.success) {
        setReports((prev) => ({ ...prev, analytics: response.data.analytics }));
      }
    } catch (error) {
      showSnackbar("Error loading analytics", "error");
      console.error("Error loading analytics:", error);
    } finally {
      setLoading((prev) => ({ ...prev, analytics: false }));
    }
  };

  const loadStudentActivityReport = async () => {
    try {
      setLoading((prev) => ({ ...prev, studentActivity: true }));
      const params = {
        startDate: filters.startDate,
        endDate: filters.endDate,
        building: filters.building,
      };
      const response = await api.get("/reports/student-activity", { params });

      if (response.data.success) {
        setReports((prev) => ({
          ...prev,
          studentActivity: response.data.report,
        }));
      }
    } catch (error) {
      showSnackbar("Error loading student activity report", "error");
      console.error("Error loading student activity report:", error);
    } finally {
      setLoading((prev) => ({ ...prev, studentActivity: false }));
    }
  };

  const handleExportReport = async () => {
    try {
      const params = {
        format: exportFormat,
        ...filters,
      };

      const response = await api.get(`/reports/export/${exportType}`, {
        params,
        responseType: exportFormat === "csv" ? "blob" : "json",
      });

      if (exportFormat === "csv") {
        // Handle blob download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", `${exportType}_report.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
      } else {
        // Handle JSON download
        const dataStr = JSON.stringify(response.data, null, 2);
        const dataUri =
          "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
        const exportFileDefaultName = `${exportType}_report.json`;

        const linkElement = document.createElement("a");
        linkElement.setAttribute("href", dataUri);
        linkElement.setAttribute("download", exportFileDefaultName);
        linkElement.click();
      }

      showSnackbar("Report exported successfully", "success");
      setOpenExportDialog(false);
    } catch (error) {
      showSnackbar("Error exporting report", "error");
      console.error("Error exporting report:", error);
    }
  };

  const handlePrintReport = () => {
    window.print();
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbar({ open: true, message, severity });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  // Chart data preparation
  const getOccupancyChartData = () => {
    if (!reports.occupancy?.buildingWise) return [];

    return Object.entries(reports.occupancy.buildingWise).map(
      ([building, data]) => ({
        name: building,
        occupied: data.occupiedBeds,
        vacant: data.vacantBeds,
        occupancyRate: data.occupancyRate,
      })
    );
  };

  const getComplaintsChartData = () => {
    if (!reports.complaints?.summary?.byStatus) return [];

    return Object.entries(reports.complaints.summary.byStatus).map(
      ([status, count]) => ({
        name: status.replace("_", " ").toUpperCase(),
        value: count,
      })
    );
  };

  const getPaymentsChartData = () => {
    if (!reports.payments?.summary?.byMonth) return [];

    return Object.entries(reports.payments.summary.byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        name: new Date(month + "-01").toLocaleDateString("en-US", {
          month: "short",
          year: "numeric",
        }),
        amount: data.amount,
        count: data.count,
      }));
  };

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
            <Assessment sx={{ fontSize: 60 }} />
            <Box>
              <Typography variant="h4" fontWeight="bold">
                Reports & Analytics
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9 }}>
                Comprehensive reporting & data insights
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
              startIcon={<Download />}
              onClick={() => setOpenExportDialog(true)}
              sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
            >
              Export
            </Button>
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={handlePrintReport}
              sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
            >
              Print
            </Button>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={loadAllReports}
              sx={{ bgcolor: "rgba(255,255,255,0.2)" }}
            >
              Refresh
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* Dashboard Analytics */}
      {reports.analytics && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              <Analytics sx={{ mr: 1, verticalAlign: "middle" }} />
              Dashboard Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: "#e3f2fd", textAlign: "center" }}>
                  <CardContent>
                    <Group sx={{ fontSize: 40, color: "#1976d2" }} />
                    <Typography variant="h4" color="primary">
                      {reports.analytics.summary?.totalStudents || 0}
                    </Typography>
                    <Typography variant="body2">Total Students</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: "#f3e5f5", textAlign: "center" }}>
                  <CardContent>
                    <Home sx={{ fontSize: 40, color: "#7b1fa2" }} />
                    <Typography variant="h4" sx={{ color: "#7b1fa2" }}>
                      {reports.analytics.summary?.totalRooms || 0}
                    </Typography>
                    <Typography variant="body2">Total Rooms</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: "#e8f5e8", textAlign: "center" }}>
                  <CardContent>
                    <TrendingUp sx={{ fontSize: 40, color: "#388e3c" }} />
                    <Typography variant="h4" color="success.main">
                      {reports.analytics.summary?.occupancyRate?.toFixed(1) ||
                        0}
                      %
                    </Typography>
                    <Typography variant="body2">Occupancy Rate</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Card sx={{ bgcolor: "#fff3e0", textAlign: "center" }}>
                  <CardContent>
                    <ReportProblem sx={{ fontSize: 40, color: "#f57c00" }} />
                    <Typography variant="h4" sx={{ color: "#f57c00" }}>
                      {reports.analytics.complaints?.thisMonth || 0}
                    </Typography>
                    <Typography variant="body2">
                      Complaints This Month
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* Occupancy Report */}
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={2}>
            <Home color="primary" />
            <Typography variant="h6">Room Occupancy Report</Typography>
            {loading.occupancy && <LinearProgress sx={{ width: 100, ml: 2 }} />}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {reports.occupancy && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Summary Statistics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper
                      sx={{ p: 2, textAlign: "center", bgcolor: "#e3f2fd" }}
                    >
                      <Typography variant="h4" color="primary">
                        {reports.occupancy.summary?.totalRooms || 0}
                      </Typography>
                      <Typography variant="body2">Total Rooms</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      sx={{ p: 2, textAlign: "center", bgcolor: "#e8f5e8" }}
                    >
                      <Typography variant="h4" color="success.main">
                        {reports.occupancy.summary?.occupancyRate?.toFixed(1) ||
                          0}
                        %
                      </Typography>
                      <Typography variant="body2">Occupancy Rate</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}
                    >
                      <Typography variant="h4" sx={{ color: "#f57c00" }}>
                        {reports.occupancy.summary?.occupiedBeds || 0}
                      </Typography>
                      <Typography variant="body2">Occupied Beds</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      sx={{ p: 2, textAlign: "center", bgcolor: "#fce4ec" }}
                    >
                      <Typography variant="h4" sx={{ color: "#c2185b" }}>
                        {reports.occupancy.summary?.vacantBeds || 0}
                      </Typography>
                      <Typography variant="body2">Vacant Beds</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Building-wise Occupancy
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsBarChart data={getOccupancyChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="occupied" fill="#4caf50" name="Occupied" />
                    <Bar dataKey="vacant" fill="#f44336" name="Vacant" />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Building-wise Details
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Building</TableCell>
                        <TableCell align="right">Total Rooms</TableCell>
                        <TableCell align="right">Total Beds</TableCell>
                        <TableCell align="right">Occupied</TableCell>
                        <TableCell align="right">Vacant</TableCell>
                        <TableCell align="right">Occupancy Rate</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(reports.occupancy.buildingWise || {}).map(
                        ([building, data]) => (
                          <TableRow key={building}>
                            <TableCell>{building}</TableCell>
                            <TableCell align="right">
                              {data.totalRooms}
                            </TableCell>
                            <TableCell align="right">
                              {data.totalBeds}
                            </TableCell>
                            <TableCell align="right">
                              {data.occupiedBeds}
                            </TableCell>
                            <TableCell align="right">
                              {data.vacantBeds}
                            </TableCell>
                            <TableCell align="right">
                              <Chip
                                label={`${data.occupancyRate?.toFixed(1)}%`}
                                color={
                                  data.occupancyRate > 80
                                    ? "success"
                                    : data.occupancyRate > 60
                                    ? "warning"
                                    : "error"
                                }
                                size="small"
                              />
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Complaints Report */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={2}>
            <ReportProblem color="warning" />
            <Typography variant="h6">Complaints Analysis</Typography>
            {loading.complaints && (
              <LinearProgress sx={{ width: 100, ml: 2 }} />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {reports.complaints && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Status Distribution
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <pie
                      data={getComplaintsChartData()}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getComplaintsChartData().map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </pie>
                    <RechartsTooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Key Metrics
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Paper
                      sx={{ p: 2, textAlign: "center", bgcolor: "#e3f2fd" }}
                    >
                      <Typography variant="h4" color="primary">
                        {reports.complaints.summary?.total || 0}
                      </Typography>
                      <Typography variant="body2">Total Complaints</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      sx={{ p: 2, textAlign: "center", bgcolor: "#e8f5e8" }}
                    >
                      <Typography variant="h4" color="success.main">
                        {reports.complaints.summary?.avgResolutionTime
                          ? `${Math.round(
                              reports.complaints.summary.avgResolutionTime /
                                (1000 * 60 * 60)
                            )}h`
                          : "N/A"}
                      </Typography>
                      <Typography variant="body2">
                        Avg Resolution Time
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      sx={{ p: 2, textAlign: "center", bgcolor: "#fff3e0" }}
                    >
                      <Typography variant="h4" sx={{ color: "#f57c00" }}>
                        {reports.complaints.summary?.satisfactionRating?.toFixed(
                          1
                        ) || "N/A"}
                      </Typography>
                      <Typography variant="body2">
                        Satisfaction Rating
                      </Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={6}>
                    <Paper
                      sx={{ p: 2, textAlign: "center", bgcolor: "#fce4ec" }}
                    >
                      <Typography variant="h4" sx={{ color: "#c2185b" }}>
                        {reports.complaints.summary?.resolutionStats?.overdue ||
                          0}
                      </Typography>
                      <Typography variant="body2">Overdue</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Category Breakdown
                </Typography>
                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Category</TableCell>
                        <TableCell align="right">Count</TableCell>
                        <TableCell align="right">Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {Object.entries(
                        reports.complaints.summary?.byCategory || {}
                      ).map(([category, count]) => (
                        <TableRow key={category}>
                          <TableCell sx={{ textTransform: "capitalize" }}>
                            {category}
                          </TableCell>
                          <TableCell align="right">{count}</TableCell>
                          <TableCell align="right">
                            {reports.complaints.summary?.total
                              ? `${(
                                  (count / reports.complaints.summary.total) *
                                  100
                                ).toFixed(1)}%`
                              : "0%"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Payments Report */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={2}>
            <Payment color="success" />
            <Typography variant="h6">Payments Report</Typography>
            {loading.payments && <LinearProgress sx={{ width: 100, ml: 2 }} />}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {reports.payments && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Payment Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: "#e8f5e8" }}>
                      <Typography variant="h6" color="success.main">
                        Total Collected:{" "}
                        {formatCurrency(
                          reports.payments.summary?.collectedAmount || 0
                        )}
                      </Typography>
                      <Typography variant="body2">
                        Pending:{" "}
                        {formatCurrency(
                          reports.payments.summary?.pendingAmount || 0
                        )}
                      </Typography>
                      <Typography variant="body2">
                        Total Payments: {reports.payments.summary?.total || 0}
                      </Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Monthly Trends
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={getPaymentsChartData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <RechartsTooltip
                      formatter={(value, name) => [
                        name === "amount" ? formatCurrency(value) : value,
                        name === "amount" ? "Amount" : "Count",
                      ]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="amount"
                      stroke="#4caf50"
                      name="Amount"
                    />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="#2196f3"
                      name="Count"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </Grid>
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Student Activity Report */}
      <Accordion>
        <AccordionSummary expandIcon={<ExpandMore />}>
          <Box display="flex" alignItems="center" gap={2}>
            <Schedule color="info" />
            <Typography variant="h6">Student Activity Report</Typography>
            {loading.studentActivity && (
              <LinearProgress sx={{ width: 100, ml: 2 }} />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          {reports.studentActivity && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Activity Summary
                </Typography>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="body1">
                    <strong>Total Entries:</strong>{" "}
                    {reports.studentActivity.summary?.totalEntries || 0}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Total Exits:</strong>{" "}
                    {reports.studentActivity.summary?.totalExits || 0}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Unique Students:</strong>{" "}
                    {reports.studentActivity.summary?.uniqueStudents || 0}
                  </Typography>
                  <Typography variant="body1">
                    <strong>Late Entries:</strong>{" "}
                    {reports.studentActivity.summary?.lateEntries || 0}
                  </Typography>
                </Paper>
              </Grid>
              <Grid item xs={12} md={8}>
                <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                  Recent Activity (Last 100 records)
                </Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Student</TableCell>
                        <TableCell>Type</TableCell>
                        <TableCell>Gate</TableCell>
                        <TableCell>Time</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reports.studentActivity.records
                        ?.slice(0, 10)
                        .map((record) => (
                          <TableRow key={record._id}>
                            <TableCell>
                              <Box>
                                <Typography variant="body2" fontWeight={500}>
                                  {record.user?.name}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  color="textSecondary"
                                >
                                  {record.user?.studentId}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={record.type}
                                size="small"
                                color={
                                  record.type === "entry" ? "success" : "info"
                                }
                              />
                            </TableCell>
                            <TableCell>{record.gate?.name}</TableCell>
                            <TableCell>
                              {formatDate(record.timestamp)}
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Grid>
            </Grid>
          )}
        </AccordionDetails>
      </Accordion>

      {/* Filter Dialog */}
      <Dialog
        open={openFilterDialog}
        onClose={() => setOpenFilterDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Report Filters</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={filters.startDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, startDate: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={filters.endDate}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, endDate: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Building"
                value={filters.building}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, building: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Floor"
                type="number"
                value={filters.floor}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, floor: e.target.value }))
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
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFilterDialog(false)}>Cancel</Button>
          <Button
            onClick={() => {
              setOpenFilterDialog(false);
              loadAllReports();
            }}
            variant="contained"
          >
            Apply Filters
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Dialog */}
      <Dialog
        open={openExportDialog}
        onClose={() => setOpenExportDialog(false)}
      >
        <DialogTitle>Export Report</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Report Type</InputLabel>
            <Select
              value={exportType}
              onChange={(e) => setExportType(e.target.value)}
              label="Report Type"
            >
              <MenuItem value="occupancy">Occupancy Report</MenuItem>
              <MenuItem value="complaints">Complaints Report</MenuItem>
              <MenuItem value="payments">Payments Report</MenuItem>
            </Select>
          </FormControl>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Format</InputLabel>
            <Select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              label="Format"
            >
              <MenuItem value="json">JSON</MenuItem>
              <MenuItem value="csv">CSV</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenExportDialog(false)}>Cancel</Button>
          <Button
            onClick={handleExportReport}
            variant="contained"
            disabled={!exportType}
          >
            Export
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

export default Reports;
