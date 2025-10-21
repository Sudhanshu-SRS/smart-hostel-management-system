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
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard,
  Hotel,
  Payment,
  ReportProblem,
  People,
  AccountCircle,
  Logout,
  Notifications,
  Settings,
  Visibility,
  Home,
  QrCodeScanner,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";

const drawerWidth = 280;

const Layout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { notifications } = useSocket();

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

  // Navigation items based on your abstract requirements
  const menuItems = [
    {
      text: "Dashboard",
      icon: <Dashboard />,
      path: "/dashboard",
      roles: ["student", "warden", "admin"],
      description: "Real-time analytics & overview",
    },
    {
      text: "Rooms",
      icon: <Hotel />,
      path: "/rooms",
      roles: ["student", "warden", "admin"],
      description: "Real-time room availability",
    },
    {
      text: "Payments",
      icon: <Payment />,
      path: "/payments",
      roles: ["student", "warden", "admin"],
      description: "Razorpay payment system",
    },
    {
      text: "Complaints",
      icon: <ReportProblem />,
      path: "/complaints",
      roles: ["student", "warden", "admin"],
      description: "Digital complaint management",
    },
    {
      text: "Visitors",
      icon: <Visibility />,
      path: "/visitors",
      roles: ["student", "warden", "admin"],
      description: "Digital visitor registration",
    },
    {
      text: "Users",
      icon: <People />,
      path: "/users",
      roles: ["warden", "admin"],
      description: "User management",
    },
    {
      text: "Entry/Exit",
      icon: <QrCodeScanner />,
      path: "/entry-exit",
      roles: ["student", "warden", "admin"],
      description: "QR-based hostel access",
    },
  ];

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(user?.role)
  );

  const drawer = (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      <Toolbar
        sx={{
          background: "linear-gradient(135deg, #1976d2, #42a5f5)",
          color: "white",
        }}
      >
        <Home sx={{ mr: 2 }} />
        <Typography variant="h5" noWrap component="div" fontWeight="bold">
          SHMS
        </Typography>
      </Toolbar>

      <Box sx={{ p: 2, backgroundColor: "#f8fafc" }}>
        <Typography variant="body2" color="text.secondary" textAlign="center">
          Smart Hostel Management
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          textAlign="center"
          display="block"
        >
          Welcome, {user?.name}
        </Typography>
      </Box>

      <Divider />

      <List sx={{ flexGrow: 1, px: 1 }}>
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
                    backgroundColor: "primary.light",
                    color: "white",
                    "& .MuiListItemIcon-root": {
                      color: "white",
                    },
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText
                  primary={item.text}
                  secondary={
                    !location.pathname.includes(item.path)
                      ? item.description
                      : null
                  }
                  secondaryTypographyProps={{
                    variant: "caption",
                    sx: { color: "inherit", opacity: 0.7 },
                  }}
                />
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}
      </List>

      <Divider />
      <Box sx={{ p: 2, textAlign: "center" }}>
        <Typography variant="caption" color="text.secondary">
          Role: {user?.role?.toUpperCase()}
        </Typography>
        {user?.room && (
          <Typography variant="caption" color="text.secondary" display="block">
            Room: {user.room.roomNumber}
          </Typography>
        )}
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
          background: "linear-gradient(135deg, #1976d2, #42a5f5)",
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
            Smart Hostel Management System
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Notifications">
              <IconButton color="inherit" onClick={handleNotificationOpen}>
                <Badge
                  badgeContent={notifications.filter((n) => !n.read).length}
                  color="error"
                >
                  <Notifications />
                </Badge>
              </IconButton>
            </Tooltip>

            <Tooltip title="Profile Menu">
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
          My Profile
        </MenuItem>
        <MenuItem onClick={() => navigate("/settings")}>
          <Settings sx={{ mr: 2 }} />
          Settings
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
          sx: { mt: 1.5, maxWidth: 350, maxHeight: 400 },
        }}
      >
        {notifications.length > 0 ? (
          notifications.slice(0, 5).map((notification, index) => (
            <MenuItem key={index} onClick={handleNotificationClose}>
              <Box>
                <Typography variant="body2" fontWeight="medium">
                  {notification.title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notification.message}
                </Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem>
            <Typography variant="body2" color="text.secondary">
              No new notifications
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
          backgroundColor: "#f8fafc",
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default Layout;
