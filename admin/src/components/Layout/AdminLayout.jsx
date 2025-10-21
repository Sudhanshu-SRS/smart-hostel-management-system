// admin/src/components/Layout/AdminLayout.jsx
import React, { useState } from "react";
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  useTheme,
  useMediaQuery,
  Chip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Hotel,
  Payment,
  ReportProblem,
  Visibility,
  Analytics,
  Assessment,
  Settings,
  AdminPanelSettings,
  Logout,
  Notifications,
  AccountCircle,
  Security,
  QrCodeScanner,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

const drawerWidth = 280;

const AdminLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { adminNotifications, onlineUsers } = useSocket();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationOpen = (event) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchor(null);
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  // Admin navigation items
  const menuItems = [
    {
      text: "Dashboard",
      icon: <Dashboard />,
      path: "/dashboard",
      roles: ["admin", "warden"],
      description: "System overview & analytics",
    },
    {
      text: "User Management",
      icon: <People />,
      path: "/users",
      roles: ["admin", "warden"],
      description: "Manage students & staff",
    },
    {
      text: "Room Management",
      icon: <Hotel />,
      path: "/rooms",
      roles: ["admin", "warden"],
      description: "Room allocation & maintenance",
    },
    {
      text: "Payment Management",
      icon: <Payment />,
      path: "/payments",
      roles: ["admin", "warden"],
      description: "Financial operations",
    },
    {
      text: "Complaint Management",
      icon: <ReportProblem />,
      path: "/complaints",
      roles: ["admin", "warden"],
      description: "Issue resolution system",
    },
    {
      text: "Visitor Management",
      icon: <Visibility />,
      path: "/visitors",
      roles: ["admin", "warden"],
      description: "Access control & tracking",
    },
    {
      text: "Analytics",
      icon: <Analytics />,
      path: "/analytics",
      roles: ["admin"],
      description: "Advanced insights",
    },
    {
      text: "Reports",
      icon: <Assessment />,
      path: "/reports",
      roles: ["admin", "warden"],
      description: "Generate & export reports",
    },
    {
      text: "System Settings",
      icon: <Settings />,
      path: "/settings",
      roles: ["admin"],
      description: "Configuration & preferences",
    },
    {
      text: "Entry/Exit Management",
      icon: <QrCodeScanner />,
      path: "/entry-exit",
      roles: ["admin", "warden"],
      description: "QR scanning & gate management",
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar
        sx={{
          background: "linear-gradient(135deg, #1a237e, #3949ab)",
          color: "white",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <AdminPanelSettings sx={{ mr: 2, fontSize: 32 }} />
        <Box>
          <Typography variant="h5" noWrap component="div" fontWeight="bold">
            SHMS Admin
          </Typography>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            Control Panel
          </Typography>
        </Box>
      </Toolbar>

      <Box sx={{ p: 2, backgroundColor: "rgba(26, 35, 126, 0.1)" }}>
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Avatar
            alt={user?.name}
            src={user?.profilePicture?.url}
            sx={{ width: 40, height: 40 }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="body2" color="white" fontWeight="medium">
              {user?.name}
            </Typography>
            <Chip
              label={user?.role?.toUpperCase()}
              size="small"
              color="secondary"
              sx={{ fontSize: "0.7rem", height: 20 }}
            />
            {user?.isHardcoded && (
              <Chip
                label="HARDCODED"
                size="small"
                color="info"
                sx={{ fontSize: "0.6rem", height: 18, ml: 0.5 }}
              />
            )}
          </Box>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: user?.isHardcoded ? "info.main" : "success.main",
              animation: "pulse 2s infinite",
            }}
          />
          <Typography variant="caption" color="text.secondary">
            {user?.isHardcoded
              ? "Hardcoded Admin"
              : `${onlineUsers.length} users online`}
          </Typography>
        </Box>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1, px: 1, py: 1 }}>
        {filteredMenuItems.map((item) => (
          <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={item.description} placement="right">
              <ListItemButton
                selected={location.pathname === item.path}
                onClick={() => handleNavigation(item.path)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  "&.Mui-selected": {
                    backgroundColor: "primary.main",
                    color: "white",
                    "&:hover": {
                      backgroundColor: "primary.dark",
                    },
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                  },
                  "&:hover": {
                    backgroundColor: "rgba(26, 35, 126, 0.1)",
                    "& .MuiListItemIcon-root": {
                      color: "primary.main",
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    variant: "body2",
                    fontWeight: location.pathname === item.path ? 600 : 400,
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider />
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary" display="block">
          SHMS Admin Panel v1.0
        </Typography>
        <Typography variant="caption" color="text.secondary">
          © 2024 Smart Hostel Management
        </Typography>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            Smart Hostel Management System - Administrative Dashboard
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="System Status">
              <Chip
                icon={<Security />}
                label="SECURE"
                color="success"
                size="small"
                sx={{ color: "white" }}
              />
            </Tooltip>

            <Tooltip title="Admin Notifications">
              <IconButton color="inherit" onClick={handleNotificationOpen}>
                <Badge
                  badgeContent={
                    adminNotifications.filter((n) => !n.read).length
                  }
                  color="error"
                >
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Admin Profile">
              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0, ml: 2 }}>
                <Avatar
                  alt={user?.name}
                  src={user?.profilePicture?.url}
                  sx={{ width: 32, height: 32, border: "2px solid white" }}
                >
                  {user?.name?.charAt(0).toUpperCase()}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          sx: { mt: 1.5, minWidth: 200 },
        }}
      >
        <MenuItem onClick={() => navigate("/profile")}>
          <AccountCircle sx={{ mr: 2 }} />
          Admin Profile
        </MenuItem>
        <MenuItem onClick={() => navigate("/settings")}>
          <Settings sx={{ mr: 2 }} />
          System Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: "error.main" }}>
          <Logout sx={{ mr: 2 }} />
          Logout
        </MenuItem>
      </Menu>

      {/* Notification Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationClose}
        PaperProps={{
          sx: { mt: 1.5, maxWidth: 400, maxHeight: 500 },
        }}
      >
        {adminNotifications.length > 0 ? (
          adminNotifications.slice(0, 5).map((notification, index) => (
            <MenuItem key={index} onClick={handleNotificationClose}>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notification.message}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  display="block"
                >
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              No new admin notifications
            </Typography>
          </MenuItem>
        )}
      </Menu>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default AdminLayout;
