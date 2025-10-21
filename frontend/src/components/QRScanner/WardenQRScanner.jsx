import React, { useState, useEffect, useRef } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  IconButton,
  Card,
  CardContent,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
} from "@mui/material";
import {
  QrCodeScanner,
  Close,
  CheckCircle,
  Error,
  CameraAlt,
  PersonPin,
  ExitToApp,
  Schedule,
  LocationOn,
} from "@mui/icons-material";
import { Html5QrcodeScanner } from "html5-qrcode";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { gateAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const WardenQRScanner = ({ open, onClose, onScanSuccess, selectedGate }) => {
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [showOutingForm, setShowOutingForm] = useState(false);

  // Outing form data
  const [outingReason, setOutingReason] = useState("");
  const [expectedReturnTime, setExpectedReturnTime] = useState(new Date());
  const [reasonError, setReasonError] = useState("");

  const scannerRef = useRef(null);
  const { user } = useAuth();

  const outingReasons = [
    "Medical Emergency",
    "Doctor Appointment",
    "Family Visit",
    "Shopping",
    "Educational Purpose",
    "Job Interview",
    "Bank Work",
    "Personal Work",
    "Emergency",
    "Other",
  ];

  useEffect(() => {
    if (open && !scannerRef.current) {
      initializeScanner();
    }

    return () => {
      cleanupScanner();
    };
  }, [open]);

  const initializeScanner = () => {
    try {
      setScanning(true);
      setError(null);
      setScanResult(null);
      setScannedStudent(null);
      setShowOutingForm(false);

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        showTorchButtonIfSupported: true,
        showZoomSliderIfSupported: true,
        defaultZoomValueIfSupported: 2,
        rememberLastUsedCamera: true,
      };

      scannerRef.current = new Html5QrcodeScanner(
        "qr-scanner-container",
        config
      );

      scannerRef.current.render(
        (decodedText, decodedResult) => {
          console.log(
            "✅ Student QR Code scanned:",
            decodedText.substring(0, 50)
          );
          handleStudentQRScan(decodedText);
        },
        (errorMessage) => {
          // Handle scan failures silently - they're very frequent
          // console.log('QR Scan error (normal):', errorMessage);
        }
      );
    } catch (error) {
      console.error("❌ Scanner initialization error:", error);
      setError(
        "Failed to initialize camera. Please check permissions and try again."
      );
      setScanning(false);
    }
  };

  const cleanupScanner = () => {
    if (scannerRef.current) {
      try {
        scannerRef.current.clear();
        scannerRef.current = null;
      } catch (error) {
        console.error("Cleanup error:", error);
      }
    }
    setScanning(false);
  };

  const handleStudentQRScan = async (qrData) => {
    if (processing) return; // Prevent multiple scans

    setProcessing(true);
    cleanupScanner();

    try {
      // Parse and validate QR data
      const qrObject = JSON.parse(qrData);

      if (!qrObject || qrObject.type !== "student_entry_exit") {
        throw new Error(
          "Invalid QR code. Please scan a valid student QR code."
        );
      }

      // Extract student info from QR
      setScannedStudent({
        id: qrObject.studentId,
        name: qrObject.studentName,
        studentNumber: qrObject.studentNumber,
        qrData: qrData,
      });

      // Show outing form for exit (we'll determine action type in backend)
      setShowOutingForm(true);
    } catch (error) {
      console.error("❌ QR Processing Error:", error);
      const errorMessage =
        error.message || "Failed to process QR code. Please try again.";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const validateOutingForm = () => {
    let isValid = true;
    setReasonError("");

    if (!outingReason.trim()) {
      setReasonError("Please enter a reason for outing");
      isValid = false;
    }

    const now = new Date();
    if (expectedReturnTime <= now) {
      toast.error("Expected return time must be in the future");
      isValid = false;
    }

    const maxReturnTime = new Date();
    maxReturnTime.setDate(maxReturnTime.getDate() + 7); // Max 7 days
    if (expectedReturnTime > maxReturnTime) {
      toast.error("Expected return time cannot be more than 7 days from now");
      isValid = false;
    }

    return isValid;
  };

  const handleApproveAndRecord = async () => {
    if (!validateOutingForm()) {
      return;
    }

    setProcessing(true);

    try {
      const scanData = {
        studentQRData: scannedStudent.qrData,
        gateId: selectedGate._id,
        outingReason: outingReason.trim(),
        expectedReturnTime: expectedReturnTime.toISOString(),
        location: await getCurrentLocation(),
      };

      const response = await gateAPI.scanStudentQR(scanData);

      setScanResult({
        success: true,
        message: response.data.message,
        data: response.data.data,
      });

      toast.success(response.data.message, {
        icon: response.data.data.actionType === "exit" ? "🚪➡️" : "🚪⬅️",
      });

      if (onScanSuccess) {
        onScanSuccess(response.data);
      }

      // Reset form
      setOutingReason("");
      setExpectedReturnTime(new Date());
      setShowOutingForm(false);
    } catch (error) {
      console.error("❌ Approval Error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to record entry/exit";

      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const getCurrentLocation = () => {
    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          console.log("Location error (optional):", error);
          resolve(null); // Location is optional
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 60000,
        }
      );
    });
  };

  const handleClose = () => {
    cleanupScanner();
    setScanResult(null);
    setError(null);
    setScannedStudent(null);
    setShowOutingForm(false);
    setProcessing(false);
    setOutingReason("");
    setExpectedReturnTime(new Date());
    onClose();
  };

  const handleRetry = () => {
    setScanResult(null);
    setError(null);
    setScannedStudent(null);
    setShowOutingForm(false);
    setProcessing(false);
    initializeScanner();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 3, minHeight: "70vh" },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <QrCodeScanner color="primary" />
          <Typography variant="h6">
            Student QR Scanner - {selectedGate?.gateName}
          </Typography>
        </Box>
        <IconButton onClick={handleClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Scanner Container */}
        {scanning && !scanResult && !showOutingForm && (
          <Box textAlign="center" mb={2}>
            <Box
              id="qr-scanner-container"
              sx={{
                "& video": {
                  borderRadius: 2,
                  maxWidth: "100%",
                  height: "auto",
                },
                "& #html5-qrcode-anchor-scan-type-change": {
                  display: "none !important",
                },
              }}
            />
            <Typography variant="body2" color="text.secondary" mt={2}>
              Position the student's QR code within the frame to scan
            </Typography>
          </Box>
        )}

        {/* Processing State */}
        {processing && !showOutingForm && (
          <Box textAlign="center" py={4}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="h6" gutterBottom>
              Processing Student QR Code...
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Please wait while we verify the student information
            </Typography>
          </Box>
        )}

        {/* Scanned Student Info & Outing Form */}
        {showOutingForm && scannedStudent && (
          <Box>
            <Card sx={{ mb: 3, bgcolor: "primary.50" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom color="primary.main">
                  Student Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Name
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {scannedStudent.name}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" color="text.secondary">
                      Student ID
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {scannedStudent.studentNumber}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="body2" color="text.secondary">
                      Gate
                    </Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {selectedGate?.gateName} - {selectedGate?.location}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Typography variant="h6" gutterBottom>
              Entry/Exit Details
            </Typography>

            <Box component="form" sx={{ mt: 2 }}>
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Reason for Outing *</InputLabel>
                <Select
                  value={outingReason}
                  label="Reason for Outing *"
                  onChange={(e) => setOutingReason(e.target.value)}
                  error={!!reasonError}
                >
                  {outingReasons.map((reason) => (
                    <MenuItem key={reason} value={reason}>
                      {reason}
                    </MenuItem>
                  ))}
                </Select>
                {reasonError && (
                  <Typography variant="caption" color="error" sx={{ mt: 1 }}>
                    {reasonError}
                  </Typography>
                )}
              </FormControl>

              {outingReason === "Other" && (
                <TextField
                  fullWidth
                  label="Please specify reason"
                  value={outingReason === "Other" ? "" : outingReason}
                  onChange={(e) => setOutingReason(e.target.value)}
                  sx={{ mb: 3 }}
                  placeholder="Enter specific reason for outing"
                />
              )}

              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  label="Expected Return Time *"
                  value={expectedReturnTime}
                  onChange={(newValue) => setExpectedReturnTime(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth sx={{ mb: 3 }} />
                  )}
                  minDateTime={new Date()}
                  maxDateTime={(() => {
                    const maxDate = new Date();
                    maxDate.setDate(maxDate.getDate() + 7);
                    return maxDate;
                  })()}
                />
              </LocalizationProvider>

              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  <Schedule
                    sx={{ verticalAlign: "middle", mr: 1, fontSize: 16 }}
                  />
                  By approving this request, you confirm that the student has
                  permission to leave the hostel. An email notification will be
                  sent to the student's guardian.
                </Typography>
              </Alert>
            </Box>
          </Box>
        )}

        {/* Success Result */}
        {scanResult && scanResult.success && (
          <Card sx={{ mb: 2, bgcolor: "success.50" }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h6" color="success.main">
                    Success!
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {scanResult.message}
                  </Typography>
                </Box>
              </Box>

              {scanResult.data && (
                <Box>
                  <Divider sx={{ mb: 2 }} />
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Action
                      </Typography>
                      <Chip
                        label={scanResult.data.actionType?.toUpperCase()}
                        color={
                          scanResult.data.actionType === "exit"
                            ? "warning"
                            : "success"
                        }
                        icon={
                          scanResult.data.actionType === "exit" ? (
                            <ExitToApp />
                          ) : (
                            <PersonPin />
                          )
                        }
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Time
                      </Typography>
                      <Typography variant="body1">
                        {new Date(scanResult.data.timestamp).toLocaleString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Student
                      </Typography>
                      <Typography variant="body1">
                        {scanResult.data.student?.name}
                      </Typography>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="body2" color="text.secondary">
                        Gate
                      </Typography>
                      <Typography variant="body1">
                        {scanResult.data.gate?.name}
                      </Typography>
                    </Grid>
                    {scanResult.data.isLateReturn && (
                      <Grid item xs={12}>
                        <Alert severity="warning" size="small">
                          <Typography variant="body2">
                            ⚠️ Late return detected! Notifications sent to
                            guardian and warden.
                          </Typography>
                        </Alert>
                      </Grid>
                    )}
                  </Grid>
                </Box>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Instructions */}
        {!scanning && !scanResult && !showOutingForm && !processing && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">
              • Make sure camera permissions are enabled
              <br />
              • Ask student to show their QR code from the SHMS app
              <br />
              • Hold device steady and ensure good lighting
              <br />• Only scan valid student QR codes
            </Typography>
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {showOutingForm ? (
          <Box display="flex" gap={2} width="100%">
            <Button
              variant="outlined"
              onClick={handleRetry}
              fullWidth
              disabled={processing}
            >
              Scan Another
            </Button>
            <Button
              variant="contained"
              onClick={handleApproveAndRecord}
              fullWidth
              disabled={processing || !outingReason.trim()}
              startIcon={
                processing ? <CircularProgress size={20} /> : <CheckCircle />
              }
            >
              {processing ? "Recording..." : "Approve & Record"}
            </Button>
          </Box>
        ) : scanResult ? (
          <Box display="flex" gap={2} width="100%">
            <Button variant="outlined" onClick={handleClose} fullWidth>
              Close
            </Button>
            <Button variant="contained" onClick={handleRetry} fullWidth>
              Scan Another
            </Button>
          </Box>
        ) : (
          <Box display="flex" gap={2} width="100%">
            <Button variant="outlined" onClick={handleClose} fullWidth>
              Cancel
            </Button>
            {error && (
              <Button variant="contained" onClick={handleRetry} fullWidth>
                Retry
              </Button>
            )}
          </Box>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WardenQRScanner;
