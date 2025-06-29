// admin/src/pages/Dashboard/Dashboard.jsx
import React, { useState, useEffect } from "react";
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
  Button,
  IconButton,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import {
  TrendingUp,
  TrendingDown,
  Hotel,
  Payment,
  ReportProblem,
  People,
  Visibility,
  Warning,
  CheckCircle,
  Error,
  Info,
  Refresh,
  Download,
  Schedule,
  Security,
} from "@mui/icons-material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const { user } = useAuth();
  const { systemStats, onlineUsers, requestSystemStats } = useSocket();
  const theme = useTheme();

  useEffect(() => {
    fetchDashboardData();
    requestSystemStats();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      // Simulate API call - replace with actual API
      const mockStats = {
        users: {
          totalUsers: 245,
          activeUsers: 189,
          newThisMonth: 23,
          students: 220,
          staff: 25,
        },
        rooms: {
          totalRooms: 150,
          occupiedRooms: 142,
          availableRooms: 8,
          maintenanceRooms: 3,
          occupancyRate: 94.7,
        },
        payments: {
          totalRevenue: 1250000,
          thisMonthRevenue: 185000,
          pendingPayments: 12,
          overduePayments: 3,
          completedThisMonth: 220,
        },
        complaints: {
          totalComplaints: 45,
          openComplaints: 8,
          inProgressComplaints: 12,
          resolvedComplaints: 25,
          urgentComplaints: 2,
          averageResolutionTime: 2.5,
        },
        visitors: {
          totalVisitors: 89,
          activeVisitors: 15,
          pendingApprovals: 3,
          todayVisitors: 12,
          overstayed: 1,
        },
        systemHealth: {
          uptime: 99.8,
          responseTime: 45,
          errorRate: 0.2,
          storage: 68,
        },
      };

      setStats(mockStats);

      // Mock recent activities
      const mockActivities = [
        {
          id: 1,
          type: "user",
          title: "New user registration",
          description: "John Doe registered as student",
          timestamp: new Date(Date.now() - 30000),
          status: "success",
        },
        {
          id: 2,
          type: "payment",
          title: "Payment received",
          description: "₹5,000 payment from Room 101",
          timestamp: new Date(Date.now() - 120000),
          status: "success",
        },
        {
          id: 3,
          type: "complaint",
          title: "Urgent complaint filed",
          description: "AC not working - Room 205",
          timestamp: new Date(Date.now() - 300000),
          status: "urgent",
        },
        {
          id: 4,
          type: "visitor",
          title: "Visitor overstayed",
          description: "Visitor at Room 301 exceeded time limit",
          timestamp: new Date(Date.now() - 600000),
          status: "warning",
        },
        {
          id: 5,
          type: "room",
          title: "Room maintenance completed",
          description: "Room 108 back in service",
          timestamp: new Date(Date.now() - 900000),
          status: "success",
        },
      ];

      setActivities(mockActivities);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      setError("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    requestSystemStats();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const StatCard = ({
    title,
    value,
    icon,
    color = "primary",
    subtitle,
    trend,
    trendDirection,
  }) => (
    <Card className="admin-card-hover">
      <CardContent>
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          mb={2}
        >
          <Box>
            <Typography variant="h3" fontWeight="bold" color={`${color}.main`}>
              {value}
            </Typography>
            <Typography variant="h6" color="text.primary" fontWeight="medium">
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${color}.main`,
              width: 60,
              height: 60,
              boxShadow: `0 4px 20px ${theme.palette[color].main}40`,
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box display="flex" alignItems="center">
            {trendDirection === "up" ? (
              <TrendingUp color="success" sx={{ mr: 1, fontSize: 16 }} />
            ) : (
              <TrendingDown color="error" sx={{ mr: 1, fontSize: 16 }} />
            )}
            <Typography
              variant="caption"
              color={trendDirection === "up" ? "success.main" : "error.main"}
            >
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );

  const getActivityIcon = (type) => {
    const iconMap = {
      user: <People />,
      payment: <Payment />,
      complaint: <ReportProblem />,
      visitor: <Visibility />,
      room: <Hotel />,
      system: <Security />,
    };
    return iconMap[type] || <Info />;
  };

  const getStatusColor = (status) => {
    const colorMap = {
      success: "success",
      warning: "warning",
      urgent: "error",
      info: "info",
    };
    return colorMap[status] || "default";
  };

  if (loading) {
    return (
      <Box className="admin-loading-spinner">
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Loading admin dashboard...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button onClick={fetchDashboardData} color="inherit" size="small">
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  // Chart data
  const roomData = [
    {
      name: "Occupied",
      value: stats.rooms.occupiedRooms,
      color: theme.palette.info.main,
    },
    {
      name: "Available",
      value: stats.rooms.availableRooms,
      color: theme.palette.success.main,
    },
    {
      name: "Maintenance",
      value: stats.rooms.maintenanceRooms,
      color: theme.palette.error.main,
    },
  ];

  const revenueData = [
    { month: "Jan", revenue: 120000 },
    { month: "Feb", revenue: 135000 },
    { month: "Mar", revenue: 145000 },
    { month: "Apr", revenue: 155000 },
    { month: "May", revenue: 175000 },
    { month: "Jun", revenue: 185000 },
  ];

  return (
    <Box className="admin-fade-in">
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: "linear-gradient(135deg, #1a237e, #3949ab)",
          color: "white",
        }}
      >
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography
              variant="h3"
              fontWeight="bold"
              gutterBottom
              className="gradient-text"
            >
              Admin Dashboard
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Welcome back, {user?.name}! Here's your system overview.
            </Typography>
            <Typography variant="body1" sx={{ opacity: 0.8, mt: 1 }}>
              Comprehensive control panel for Smart Hostel Management System
            </Typography>
          </Box>
          <Box display="flex" gap={2}>
            <Tooltip title="Download Report">
              <IconButton color="inherit">
                <Download />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh Data">
              <IconButton
                color="inherit"
                onClick={handleRefresh}
                disabled={refreshing}
              >
                <Refresh className={refreshing ? "spinning" : ""} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {refreshing && <LinearProgress sx={{ mt: 2 }} />}
      </Paper>

      {/* Key Metrics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Total Users"
            value={stats.users.totalUsers}
            icon={<People />}
            color="primary"
            subtitle={`${stats.users.students} students, ${stats.users.staff} staff`}
            trend="+12% this month"
            trendDirection="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Room Occupancy"
            value={`${stats.rooms.occupancyRate}%`}
            icon={<Hotel />}
            color="info"
            subtitle={`${stats.rooms.occupiedRooms}/${stats.rooms.totalRooms} occupied`}
            trend="+2.3% this week"
            trendDirection="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Monthly Revenue"
            value={`₹${(stats.payments.thisMonthRevenue / 100000).toFixed(1)}L`}
            icon={<Payment />}
            color="success"
            subtitle={`${stats.payments.completedThisMonth} payments`}
            trend="+15.8% vs last month"
            trendDirection="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Active Issues"
            value={
              stats.complaints.openComplaints +
              stats.complaints.inProgressComplaints
            }
            icon={<ReportProblem />}
            color="warning"
            subtitle={`${stats.complaints.urgentComplaints} urgent`}
            trend="-8% this week"
            trendDirection="down"
          />
        </Grid>
      </Grid>

      {/* Charts and Analytics */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Revenue Trend (Last 6 Months)
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <RechartsTooltip
                    formatter={(value) => [
                      `₹${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke={theme.palette.primary.main}
                    fill={theme.palette.primary.light}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Room Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={roomData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {roomData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* System Health and Recent Activities */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Health
              </Typography>
              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Uptime</Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color="success.main"
                  >
                    {stats.systemHealth.uptime}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.systemHealth.uptime}
                  color="success"
                />
              </Box>

              <Box mb={2}>
                <Box display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">Storage Usage</Typography>
                  <Typography
                    variant="body2"
                    fontWeight="bold"
                    color="warning.main"
                  >
                    {stats.systemHealth.storage}%
                  </Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={stats.systemHealth.storage}
                  color="warning"
                />
              </Box>

              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2">Response Time</Typography>
                <Chip
                  label={`${stats.systemHealth.responseTime}ms`}
                  color="success"
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="h6">Recent Activities</Typography>
                <Chip
                  icon={<Schedule />}
                  label="Live Updates"
                  color="primary"
                  size="small"
                />
              </Box>
              <List>
                {activities.slice(0, 5).map((activity, index) => (
                  <ListItem key={activity.id} divider={index < 4}>
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
                            {activity.timestamp.toLocaleTimeString()}
                          </Typography>
                        </Box>
                      }
                    />
                    <Chip
                      label={activity.status}
                      size="small"
                      color={getStatusColor(activity.status)}
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
