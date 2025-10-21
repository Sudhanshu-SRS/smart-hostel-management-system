// frontend/src/components/StudentQRCode/StudentQRCode.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Avatar,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  QrCode2,
  Refresh,
  Download,
  Share,
  Info,
  Security,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { gateAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const StudentQRCode = () => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    fetchStudentQR();
  }, []);

  const fetchStudentQR = async () => {
    try {
      setLoading(true);
      setError("");

      // Make sure user and user._id exist before making the API call
      if (!user || !user._id) {
        console.error("User not authenticated or user ID missing");
        setError("User authentication required");
        return;
      }

      const response = await gateAPI.getStudentQR(user._id);
      setQrData(response.data);
    } catch (error) {
      console.error("Fetch QR error:", error);
      setError(error.response?.data?.message || "Failed to load QR code");
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (qrData?.qrCodeImage) {
      const link = document.createElement("a");
      link.href = qrData.qrCodeImage;
      link.download = `${user.name}_SHMS_QR.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("QR Code downloaded successfully!");
    }
  };

  const shareQR = async () => {
    if (navigator.share && qrData?.qrCodeImage) {
      try {
        // Convert base64 to blob
        const response = await fetch(qrData.qrCodeImage);
        const blob = await response.blob();
        const file = new File([blob], `${user.name}_SHMS_QR.png`, {
          type: "image/png",
        });

        await navigator.share({
          title: "My SHMS QR Code",
          text: "SHMS Entry/Exit QR Code",
          files: [file],
        });
      } catch (error) {
        console.log("Share failed:", error);
        downloadQR(); // Fallback to download
      }
    } else {
      downloadQR(); // Fallback to download
    }
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" size="small" onClick={fetchStudentQR}>
            Retry
          </Button>
        }
      >
        {error}
      </Alert>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card sx={{ maxWidth: 500, mx: "auto", mt: 2 }}>
        <CardContent sx={{ textAlign: "center", p: 3 }}>
          {/* Header */}
          <Box
            display="flex"
            alignItems="center"
            justifyContent="center"
            mb={2}
          >
            <Avatar sx={{ bgcolor: "primary.main", mr: 2 }}>
              <QrCode2 />
            </Avatar>
            <Typography variant="h5" fontWeight="bold">
              My QR Code
            </Typography>
          </Box>

          {/* Current Status */}
          <Chip
            label={
              qrData?.student?.currentStatus === "in_hostel"
                ? "Currently Inside Hostel"
                : "Currently Outside Hostel"
            }
            color={
              qrData?.student?.currentStatus === "in_hostel"
                ? "success"
                : "warning"
            }
            sx={{ mb: 3, fontWeight: "bold" }}
          />

          {/* QR Code Display */}
          <Box
            sx={{
              p: 2,
              bgcolor: "white",
              borderRadius: 2,
              border: "2px solid",
              borderColor: "primary.main",
              mb: 3,
              display: "inline-block",
            }}
          >
            <img
              src={qrData?.qrCodeImage}
              alt="Student QR Code"
              style={{
                width: "250px",
                height: "250px",
                display: "block",
              }}
            />
          </Box>

          {/* Student Info */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Student Name
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {qrData?.student?.name}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Typography variant="body2" color="text.secondary">
                Student ID
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {qrData?.student?.studentId}
              </Typography>
            </Grid>
          </Grid>

          {/* Action Buttons */}
          <Box display="flex" gap={2} justifyContent="center" flexWrap="wrap">
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={downloadQR}
              size="large"
            >
              Download
            </Button>
            <Button
              variant="outlined"
              startIcon={<Share />}
              onClick={shareQR}
              size="large"
            >
              Share
            </Button>
            <Tooltip title="Refresh QR Code">
              <IconButton onClick={fetchStudentQR} color="primary" size="large">
                <Refresh />
              </IconButton>
            </Tooltip>
          </Box>

          {/* Security Notice */}
          <Alert severity="info" sx={{ mt: 3, textAlign: "left" }}>
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Security fontSize="small" />
              <Typography variant="subtitle2" fontWeight="bold">
                Security Notice
              </Typography>
            </Box>
            <Typography variant="body2">
              • This QR code is unique to you and contains encrypted data
              <br />
              • Show this to the warden when entering or leaving the hostel
              <br />
              • Do not share this QR code with others
              <br />• Report immediately if lost or compromised
            </Typography>
          </Alert>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default StudentQRCode;
