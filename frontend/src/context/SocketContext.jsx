import React, { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated && user) {
      const newSocket = io("http://localhost:5000", {
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });

      newSocket.on("connect", () => {
        console.log("✅ Connected to SHMS server");
        newSocket.emit("joinRoom", `user_${user.id}`);

        // Join role-based rooms for real-time notifications
        if (user.role === "admin") {
          newSocket.emit("joinRoom", "admin");
        } else if (user.role === "warden") {
          newSocket.emit("joinRoom", "staff");
        }
      });

      // Real-time notifications based on user role (following your abstract)
      if (user.role === "student") {
        // Student-specific real-time notifications
        newSocket.on("paymentCompleted", (payment) => {
          if (payment.userId === user.id) {
            toast.success("💰 Payment completed successfully!");
          }
        });

        newSocket.on("complaintUpdated", (complaint) => {
          if (complaint.user._id === user.id) {
            toast.info(
              `📋 Your complaint "${complaint.title}" has been updated to: ${complaint.status}`
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
              `❌ Visitor ${visitor.name} was rejected: ${visitor.rejectionReason}`
            );
          }
        });

        newSocket.on("roomUpdated", (room) => {
          if (room.occupants.some((occupant) => occupant._id === user.id)) {
            toast.info("🏠 Your room information has been updated");
          }
        });
      } else {
        // Staff notifications (Admin/Warden) - following your abstract requirements
        newSocket.on("newComplaint", (complaint) => {
          toast.info(
            `🚨 New ${complaint.priority} complaint: ${complaint.title}`,
            {
              onClick: () => (window.location.href = "/complaints"),
            }
          );
        });

        newSocket.on("newVisitorRegistration", (visitor) => {
          toast.info(
            `👤 New visitor registration: ${visitor.name} (Room: ${visitor.room.roomNumber})`,
            {
              onClick: () => (window.location.href = "/visitors"),
            }
          );
        });

        newSocket.on("urgentComplaint", (complaint) => {
          toast.error(
            `🚨 URGENT COMPLAINT: ${complaint.title} - Immediate attention required!`,
            {
              onClick: () => (window.location.href = `/complaints`),
              autoClose: false,
            }
          );
        });

        newSocket.on("paymentOverdue", (payment) => {
          toast.warning(
            `⏰ Payment overdue: ${payment.user.name} - ₹${payment.amount}`,
            {
              onClick: () => (window.location.href = "/payments"),
            }
          );
        });

        newSocket.on("visitorOverstayed", (visitor) => {
          toast.warning(
            `⚠️ Visitor overstayed: ${visitor.name} at Room ${visitor.room.roomNumber}`,
            {
              onClick: () => (window.location.href = "/visitors"),
            }
          );
        });
      }

      // System-wide notifications
      newSocket.on("systemAnnouncement", (announcement) => {
        toast.info(`📢 System: ${announcement.message}`);
      });

      newSocket.on("maintenanceAlert", (alert) => {
        toast.warning(`🔧 Maintenance: ${alert.message}`);
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
    if (socket) {
      socket.emit(event, data);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        onlineUsers,
        notifications,
        emitNotification,
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
