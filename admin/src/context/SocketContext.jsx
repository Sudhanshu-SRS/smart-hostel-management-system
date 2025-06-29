// admin/src/context/SocketContext.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [systemStats, setSystemStats] = useState({});
  const [adminNotifications, setAdminNotifications] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user && ["admin", "warden"].includes(user.role)) {
      const newSocket = io("http://localhost:5000", {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("🔗 Admin Panel connected to SHMS server");
        newSocket.emit("joinRoom", "admin");
        newSocket.emit("joinRoom", "staff");
        newSocket.emit("joinRoom", `user_${user.id}`);
      });

      // Critical system alerts for admins
      newSocket.on("systemAlert", (alert) => {
        toast.error(`🚨 SYSTEM ALERT: ${alert.message}`, {
          autoClose: false,
          closeOnClick: false,
        });
        setAdminNotifications((prev) => [
          { id: Date.now(), type: "critical", ...alert, timestamp: new Date() },
          ...prev,
        ]);
      });

      // New registrations
      newSocket.on("newUserRegistration", (user) => {
        toast.info(`👤 New user registered: ${user.name} (${user.role})`, {
          onClick: () => (window.location.href = "/users"),
        });
      });

      // Emergency complaints
      newSocket.on("emergencyComplaint", (complaint) => {
        toast.error(
          `🆘 EMERGENCY: ${complaint.title} - Room ${
            complaint.room?.roomNumber || "N/A"
          }`,
          {
            autoClose: false,
            onClick: () => (window.location.href = `/complaints`),
          }
        );
      });

      // Payment system alerts
      newSocket.on("paymentSystemAlert", (alert) => {
        toast.warning(`💰 Payment System: ${alert.message}`, {
          onClick: () => (window.location.href = "/payments"),
        });
      });

      // Bulk operations completed
      newSocket.on("bulkOperationComplete", (operation) => {
        toast.success(
          `✅ Bulk Operation Complete: ${operation.type} - ${operation.count} items processed`
        );
      });

      // System health updates
      newSocket.on("systemHealth", (health) => {
        setSystemStats(health);
        if (health.critical) {
          toast.error(`🔴 System Health Critical: ${health.message}`);
        }
      });

      // Real-time statistics updates
      newSocket.on("statsUpdate", (stats) => {
        setSystemStats((prev) => ({ ...prev, ...stats }));
      });

      // Online users update
      newSocket.on("onlineUsersUpdate", (users) => {
        setOnlineUsers(users);
      });

      // Room status changes
      newSocket.on("roomStatusChanged", (room) => {
        toast.info(
          `🏠 Room ${room.roomNumber} status changed to: ${room.status}`
        );
      });

      // Visitor overstay alerts
      newSocket.on("visitorOverstayAlert", (visitor) => {
        toast.warning(
          `⏰ Visitor Overstay: ${visitor.name} at Room ${visitor.room.roomNumber}`,
          {
            onClick: () => (window.location.href = "/visitors"),
          }
        );
      });

      // Security alerts
      newSocket.on("securityAlert", (alert) => {
        toast.error(`🔒 Security Alert: ${alert.message}`, {
          autoClose: false,
        });
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Admin Panel disconnected from server");
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  // Admin-specific socket methods
  const broadcastSystemMessage = (message, type = "info") => {
    if (socket) {
      socket.emit("adminBroadcast", { message, type, from: user.name });
    }
  };

  const requestSystemStats = () => {
    if (socket) {
      socket.emit("requestSystemStats");
    }
  };

  const initiateMaintenanceMode = (enabled) => {
    if (socket) {
      socket.emit("maintenanceMode", { enabled, admin: user.name });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        systemStats,
        adminNotifications,
        broadcastSystemMessage,
        requestSystemStats,
        initiateMaintenanceMode,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
