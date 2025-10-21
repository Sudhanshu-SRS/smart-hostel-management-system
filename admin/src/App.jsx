// admin/src/App.jsx
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import AdminLayout from "./components/Layout/AdminLayout";

// Auth Pages
import Login from "./pages/Auth/Login";

// Admin Pages
import Dashboard from "./pages/Dashboard/Dashboard";
import UserManagement from "./pages/Users/UserManagement";
import RoomManagement from "./pages/Rooms/RoomManagement";
import PaymentManagement from "./pages/Payments/PaymentManagement";
import ComplaintManagement from "./pages/Complaints/ComplaintManagement";
import VisitorManagement from "./pages/Visitors/VisitorManagement";
import Analytics from "./pages/Analytics/Analytics";
import Settings from "./pages/Settings/Settings";
import Reports from "./pages/Reports/Reports";
import EntryExitManagement from "./pages/EntryExit/EntryExitManagement";

// Enhanced admin theme
const adminTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#1a237e",
      light: "#534bae",
      dark: "#000051",
      contrastText: "#fff",
    },
    secondary: {
      main: "#ff6f00",
      light: "#ff9f00",
      dark: "#c43e00",
      contrastText: "#fff",
    },
    background: {
      default: "#0a0e27",
      paper: "#1a1d3a",
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0bec5",
    },
    success: {
      main: "#00c853",
      light: "#5efc82",
      dark: "#009624",
    },
    warning: {
      main: "#ff9800",
      light: "#ffc947",
      dark: "#c66900",
    },
    error: {
      main: "#f44336",
      light: "#ff7961",
      dark: "#ba000d",
    },
    info: {
      main: "#2196f3",
      light: "#6ec6ff",
      dark: "#0069c0",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: "1.75rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: "1.5rem",
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: "1.25rem",
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 600,
      lineHeight: 1.6,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #1a1d3a 0%, #2d3561 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "16px",
          boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
          transition: "all 0.3s ease-in-out",
          "&:hover": {
            transform: "translateY(-4px)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "12px",
          fontWeight: 600,
          padding: "10px 20px",
          transition: "all 0.3s ease",
        },
        contained: {
          background: "linear-gradient(135deg, #1a237e, #3949ab)",
          boxShadow: "0 4px 15px rgba(26, 35, 126, 0.4)",
          "&:hover": {
            background: "linear-gradient(135deg, #000051, #1a237e)",
            boxShadow: "0 6px 20px rgba(26, 35, 126, 0.6)",
            transform: "translateY(-2px)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: "12px",
            backgroundColor: "rgba(255,255,255,0.05)",
            "&:hover": {
              backgroundColor: "rgba(255,255,255,0.08)",
            },
            "&.Mui-focused": {
              backgroundColor: "rgba(255,255,255,0.1)",
            },
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          background: "linear-gradient(135deg, #1a1d3a 0%, #2d3561 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255,255,255,0.1)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #0a0e27 0%, #1a1d3a 100%)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: "linear-gradient(180deg, #0a0e27 0%, #1a1d3a 100%)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
        },
      },
    },
  },
  shape: {
    borderRadius: 12,
  },
});

function App() {
  return (
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <AuthProvider>
        <SocketProvider>
          <Router>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<Login />} />

              {/* Protected Admin Routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute roles={["admin", "warden"]}>
                    <AdminLayout>
                      <Dashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute roles={["admin", "warden"]}>
                    <AdminLayout>
                      <Dashboard />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute roles={["admin", "warden"]}>
                    <AdminLayout>
                      <UserManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/rooms"
                element={
                  <ProtectedRoute roles={["admin", "warden"]}>
                    <AdminLayout>
                      <RoomManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/payments"
                element={
                  <ProtectedRoute roles={["admin", "warden"]}>
                    <AdminLayout>
                      <PaymentManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/complaints"
                element={
                  <ProtectedRoute roles={["admin", "warden"]}>
                    <AdminLayout>
                      <ComplaintManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/visitors"
                element={
                  <ProtectedRoute roles={["admin", "warden"]}>
                    <AdminLayout>
                      <VisitorManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/analytics"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminLayout>
                      <Analytics />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/reports"
                element={
                  <ProtectedRoute roles={["admin", "warden"]}>
                    <AdminLayout>
                      <Reports />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute roles={["admin"]}>
                    <AdminLayout>
                      <Settings />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/entry-exit"
                element={
                  <ProtectedRoute roles={["admin", "warden"]}>
                    <AdminLayout>
                      <EntryExitManagement />
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* Catch all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>

            {/* Enhanced Toast notifications for admin */}
            <ToastContainer
              position="top-right"
              autoClose={5000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              rtl={false}
              pauseOnFocusLoss
              draggable
              pauseOnHover
              theme="dark"
              toastStyle={{
                background: "linear-gradient(135deg, #1a1d3a, #2d3561)",
                backdropFilter: "blur(20px)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "12px",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
            />
          </Router>
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
