import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const SocketContext = createContext();

// 🔹 Dynamic socket URL from VITE_API_URL
const API_URL = import.meta.env.VITE_API_URL;
const SOCKET_URL = API_URL
  ? API_URL.replace(/\/api\/?$/, "")
  : "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io(SOCKET_URL, {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("✅ Connected to SHMS server");
        newSocket.emit("joinRoom", `user_${user.id}`);

        // Role-based rooms
        if (user.role === "admin") {
          newSocket.emit("joinRoom", "admin");
        } else if (user.role === "warden") {
          newSocket.emit("joinRoom", "staff");
        }
      });

      // Student notifications
      if (user.role === "student") {
        newSocket.on("paymentCompleted", (payment) => {
          if (payment.userId === user.id) {
            toast.success("💰 Payment completed successfully!");
          }
        });

        newSocket.on("complaintUpdated", (complaint) => {
          if (complaint.user._id === user.id) {
            toast.info(
              `📋 Your complaint "${complaint.title}" updated to: ${complaint.status}`
            );
          }
        });

        newSocket.on("visitorApproved", (visitor) => {
          if (visitor.visitingStudent._id === user.id) {
            toast.success(
              `✅ Visitor ${visitor.name} has been approved and checked in!`
            );
          }
        });

        newSocket.on("visitorRejected", (visitor) => {
          if (visitor.visitingStudent._id === user.id) {
            toast.error(
              `❌ Visitor ${visitor.name} rejected: ${visitor.rejectionReason}`
            );
          }
        });

        newSocket.on("roomUpdated", (room) => {
          if (room.occupants.some((o) => o._id === user.id)) {
            toast.info("🏠 Your room information has been updated");
          }
        });
      } else {
        // Admin / Warden notifications
        newSocket.on("newComplaint", (complaint) => {
          toast.info(
            `🚨 New ${complaint.priority} complaint: ${complaint.title}`,
            { onClick: () => (window.location.href = "/complaints") }
          );
        });

        newSocket.on("newVisitorRegistration", (visitor) => {
          toast.info(
            `👤 New visitor: ${visitor.name} (Room ${visitor.room.roomNumber})`,
            { onClick: () => (window.location.href = "/visitors") }
          );
        });

        newSocket.on("urgentComplaint", (complaint) => {
          toast.error(`🚨 URGENT: ${complaint.title}`, { autoClose: false });
        });

        newSocket.on("paymentOverdue", (payment) => {
          toast.warning(
            `⏰ Payment overdue: ${payment.user.name} - ₹${payment.amount}`,
            { onClick: () => (window.location.href = "/payments") }
          );
        });

        newSocket.on("visitorOverstayed", (visitor) => {
          toast.warning(
            `⚠️ Visitor overstayed: ${visitor.name} (Room ${visitor.room.roomNumber})`,
            { onClick: () => (window.location.href = "/visitors") }
          );
        });
      }

      // System-wide
      newSocket.on("systemAnnouncement", (a) => {
        toast.info(`📢 System: ${a.message}`);
      });

      newSocket.on("maintenanceAlert", (a) => {
        toast.warning(`🔧 Maintenance: ${a.message}`);
      });

      newSocket.on("disconnect", () => {
        console.log("❌ Disconnected from SHMS server");
      });

      setSocket(newSocket);

      return () => {
        newSocket.close();
      };
    }
  }, [isAuthenticated, user]);

  const emitNotification = (event, data) => {
    socket?.emit(event, data);
  };

  return (
    <SocketContext.Provider
      value={{ socket, onlineUsers, notifications, emitNotification }}
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
