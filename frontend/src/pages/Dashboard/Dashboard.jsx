import { useState, useEffect, useRef, useCallback } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Paper,
  useTheme,
} from "@mui/material";
import {
  TrendingUp,
  Hotel,
  Payment,
  ReportProblem,
  People,
  Visibility,
  CheckCircle,
  Warning,
  Error,
  Info,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { dashboardAPI } from "../../services/api";
import {
  formatCurrency,
  formatTimeAgo,
  getStatusColor,
} from "../../utils/helpers";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { user } = useAuth();
  const theme = useTheme();

  // ✅ Moved inside component
  const hasFetched = useRef(false);

  const fetchDashboardDataSafe = useCallback(async () => {
    if (hasFetched.current || !user) return; // Prevent multiple calls
    hasFetched.current = true;

    try {
      setLoading(true);
      const [statsRes, activitiesRes, notificationsRes] = await Promise.all([
        dashboardAPI.getStats(),
        dashboardAPI.getRecentActivities(10),
        dashboardAPI.getNotifications(),
      ]);

      setStats(statsRes.data.stats);
      setActivities(activitiesRes.data.activities);
      setNotifications(notificationsRes.data.notifications);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [user]);

  // ✅ Only call safe fetch once
  useEffect(() => {
    fetchDashboardDataSafe();
  }, [fetchDashboardDataSafe]);

  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    let greeting = "Good Evening";
    if (hour < 12) greeting = "Good Morning";
    else if (hour < 17) greeting = "Good Afternoon";

    return `${greeting}, ${user?.name}!`;
  };

  const StatCard = ({
    title,
    value,
    icon,
    color = "primary",
    subtitle,
    trend,
  }) => (
    <Card
      sx={{
        height: "100%",
        background: `linear-gradient(135deg, ${theme.palette[color].main}, ${theme.palette[color].light})`,
        color: "white",
      }}
    >
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold">
              {value}
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" sx={{ opacity: 0.7 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{ bgcolor: "rgba(255,255,255,0.2)", width: 56, height: 56 }}
          >
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box display="flex" alignItems="center" mt={1}>
            <TrendingUp sx={{ mr: 1, fontSize: 16 }} />
            <Typography variant="caption">{trend}</Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const renderStudentDashboard = () => {
    if (!stats) return null;

    const paymentChartData = [
      {
        name: "Completed",
        value: stats.payments.completed,
        color: theme.palette.success.main,
      },
      {
        name: "Pending",
        value: stats.payments.pending,
        color: theme.palette.warning.main,
      },
    ];

    return (
      <>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Payments"
              value={stats.payments.total}
              icon={<Payment />}
              color="primary"
              subtitle={`₹${stats.payments.totalAmount}`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Pending Amount"
              value={formatCurrency(stats.payments.pendingAmount)}
              icon={<Warning />}
              color="warning"
              subtitle={`${stats.payments.pending} payments`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="My Complaints"
              value={stats.complaints.total}
              icon={<ReportProblem />}
              color="error"
              subtitle={`${stats.complaints.open} open`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="My Visitors"
              value={stats.visitors.total}
              icon={<Visibility />}
              color="info"
              subtitle={`${stats.visitors.active} active`}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Overview
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={paymentChartData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={4}>
            {stats.room && (
              <Card sx={{ mb: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    My Room
                  </Typography>
                  <Typography variant="h4" color="primary">
                    {stats.room.roomNumber}
                  </Typography>
                  <Typography color="text.secondary">
                    {stats.room.building} - Floor {stats.room.floor}
                  </Typography>
                  <Typography variant="body2" sx={{ mt: 1 }}>
                    Capacity: {stats.room.occupants?.length || 0}/
                    {stats.room.capacity}
                  </Typography>
                  <Typography variant="body2">
                    Type: {stats.room.roomType}
                  </Typography>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </>
    );
  };

  const renderAdminDashboard = () => {
    if (!stats) return null;

    const roomData = [
      {
        name: "Available",
        value: stats.rooms.availableRooms,
        color: theme.palette.success.main,
      },
      {
        name: "Occupied",
        value: stats.rooms.totalRooms - stats.rooms.availableRooms,
        color: theme.palette.info.main,
      },
      {
        name: "Maintenance",
        value: stats.rooms.maintenanceRooms,
        color: theme.palette.error.main,
      },
    ];

    return (
      <>
        <Grid container spacing={3} mb={3}>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Rooms"
              value={stats.rooms.totalRooms}
              icon={<Hotel />}
              color="primary"
              subtitle={`${stats.rooms.occupancyRate}% occupied`}
              trend={`${stats.rooms.availableRooms} available`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats.payments.completedAmount)}
              icon={<Payment />}
              color="success"
              subtitle={`${stats.payments.completedPayments} completed`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Total Users"
              value={stats.users.totalUsers}
              icon={<People />}
              color="info"
              subtitle={`${stats.users.students} students`}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              title="Active Complaints"
              value={
                stats.complaints.openComplaints +
                stats.complaints.inProgressComplaints
              }
              icon={<ReportProblem />}
              color="warning"
              subtitle={`${stats.complaints.urgentComplaints} urgent`}
            />
          </Grid>
        </Grid>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Room Occupancy Overview
                </Typography>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={roomData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill={theme.palette.primary.main} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  System Status
                </Typography>
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography>Pending Visitors</Typography>
                    <Chip
                      label={stats.visitors.waitingApproval}
                      color={
                        stats.visitors.waitingApproval > 0
                          ? "warning"
                          : "success"
                      }
                      size="small"
                    />
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography>Overdue Payments</Typography>
                    <Chip
                      label={stats.payments.pendingPayments}
                      color={
                        stats.payments.pendingPayments > 0 ? "error" : "success"
                      }
                      size="small"
                    />
                  </Box>
                  <Box
                    display="flex"
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <Typography>Maintenance Rooms</Typography>
                    <Chip
                      label={stats.rooms.maintenanceRooms}
                      color={
                        stats.rooms.maintenanceRooms > 0 ? "error" : "success"
                      }
                      size="small"
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </>
    );
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case "payment":
        return <Payment />;
      case "complaint":
        return <ReportProblem />;
      case "visitor":
        return <Visibility />;
      default:
        return <Info />;
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

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Welcome Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: "linear-gradient(135deg, #1976d2, #42a5f5)",
          color: "white",
        }}
      >
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {getWelcomeMessage()}
        </Typography>
        <Typography variant="h6" sx={{ opacity: 0.9 }}>
          Welcome to your Smart Hostel Management Dashboard
        </Typography>
        <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
          {user?.role === "student"
            ? "Manage your hostel life with real-time updates and digital services"
            : "Monitor and manage your hostel operations with comprehensive analytics"}
        </Typography>
      </Paper>

      {/* Role-based Dashboard Content */}
      {user?.role === "student"
        ? renderStudentDashboard()
        : renderAdminDashboard()}

      {/* Recent Activities */}
      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activities
              </Typography>
              <List>
                {activities.slice(0, 5).map((activity, index) => (
                  <ListItem key={index} divider={index < 4}>
                    <ListItemAvatar>
                      <Avatar
                        sx={{
                          bgcolor: `${getStatusColor(activity.status)}.main`,
                        }}
                      >
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            {activity.description}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTimeAgo(activity.timestamp)}
                          </Typography>
                        </Box>
                      }
                    />
                    {activity.status && (
                      <Chip
                        label={activity.status}
                        size="small"
                        color={getStatusColor(activity.status)}
                      />
                    )}
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Notifications
              </Typography>
              {notifications.length > 0 ? (
                <List dense>
                  {notifications.slice(0, 5).map((notification, index) => (
                    <ListItem key={index} divider={index < 4}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            bgcolor: `${notification.type}.main`,
                            width: 32,
                            height: 32,
                          }}
                        >
                          {notification.type === "error" ? (
                            <Error />
                          ) : notification.type === "warning" ? (
                            <Warning />
                          ) : notification.type === "success" ? (
                            <CheckCircle />
                          ) : (
                            <Info />
                          )}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={notification.title}
                        secondary={notification.message}
                        primaryTypographyProps={{ variant: "body2" }}
                        secondaryTypographyProps={{ variant: "caption" }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No new notifications
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
