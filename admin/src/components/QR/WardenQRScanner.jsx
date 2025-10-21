import React, { useState, useRef, useEffect } from "react";
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
  Card,
  CardContent,
  Chip,
  Grid,
  TextField,
} from "@mui/material";
import { QrCodeScanner, Close, CheckCircle } from "@mui/icons-material";
import { Html5QrcodeScanner } from "html5-qrcode";
import adminAPI from "../../services/api";
import { toast } from "react-toastify";

const WardenQRScanner = ({
  open,
  onClose,
  selectedGate,
  onScanSuccess: onScanComplete,
}) => {
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [manualEntry, setManualEntry] = useState(false);
  const [studentId, setStudentId] = useState("");
  const [outingReason, setOutingReason] = useState("");
  const [expectedReturn, setExpectedReturn] = useState("");
  const html5QrCodeScannerRef = useRef(null);

  useEffect(() => {
    if (open && !manualEntry) {
      startScanning();
    }
    return () => {
      stopScanning();
    };
  }, [open, manualEntry]);

  const startScanning = () => {
    if (html5QrCodeScannerRef.current) {
      stopScanning();
    }

    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    html5QrCodeScannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      config,
      false
    );

    html5QrCodeScannerRef.current.render(
      handleQRScanSuccess,
      handleQRScanFailure
    );
    setScanning(true);
  };

  const stopScanning = () => {
    if (html5QrCodeScannerRef.current) {
      html5QrCodeScannerRef.current.clear().catch(console.error);
      html5QrCodeScannerRef.current = null;
    }
    setScanning(false);
  };

  const handleQRScanSuccess = async (decodedText) => {
    setScanning(false);
    stopScanning();

    try {
      const qrData = JSON.parse(decodedText);
      setResult(qrData);
      await processEntryExit(qrData.studentId);
    } catch (error) {
      console.error("QR scan error:", error);
      setError("Invalid QR code format");
    }
  };

  const handleQRScanFailure = (error) => {
    // Handle scan failure silently - this is called frequently
    console.debug("QR scan attempt failed:", error);
  };

  const processEntryExit = async (inputStudentId) => {
    if (!selectedGate) {
      setError("Please select a gate first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const scanData = {
        studentId: inputStudentId,
        gateId: selectedGate._id,
        outingReason: outingReason || "General",
        expectedReturnTime:
          expectedReturn ||
          new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
      };

      console.log("Processing entry/exit with data:", scanData);
      const response = await adminAPI.scanStudentQR(scanData);

      if (response.data) {
        toast.success(
          `✅ ${response.data.action.toUpperCase()} recorded for ${
            response.data.student.name
          }`,
          {
            icon: response.data.action === "exit" ? "🚪➡️" : "🚪⬅️",
            autoClose: 3000,
          }
        );

        // Close dialog after successful scan
        setTimeout(() => {
          handleClose();
          if (onScanComplete) {
            onScanComplete(response.data);
          }
        }, 2000);
      }
    } catch (error) {
      console.error("Entry/exit processing error:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Failed to process entry/exit";
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleManualSubmit = () => {
    if (!studentId.trim()) {
      setError("Please enter student ID");
      return;
    }
    processEntryExit(studentId.trim());
  };

  const resetState = () => {
    setResult(null);
    setError("");
    setStudentId("");
    setOutingReason("");
    setExpectedReturn("");
    setManualEntry(false);
  };

  const handleClose = () => {
    stopScanning();
    resetState();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <QrCodeScanner />
          Student QR Scanner
          {selectedGate && (
            <Chip
              label={`Gate: ${selectedGate.gateName}`}
              color="primary"
              size="small"
            />
          )}
        </Box>
      </DialogTitle>

      <DialogContent>
        {!selectedGate && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Please select a gate before scanning
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <Button size="small" onClick={() => setError("")} sx={{ ml: 1 }}>
              Dismiss
            </Button>
          </Alert>
        )}

        {result && (
          <Card sx={{ mb: 2, bgcolor: "success.light" }}>
            <CardContent>
              <Typography variant="h6" color="success.dark">
                <CheckCircle sx={{ mr: 1, verticalAlign: "middle" }} />
                QR Code Detected
              </Typography>
              <Typography variant="body2">
                Student ID: {result.studentId}
              </Typography>
              <Typography variant="body2">
                Name: {result.name || "Loading..."}
              </Typography>
            </CardContent>
          </Card>
        )}

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <Button
              variant={!manualEntry ? "contained" : "outlined"}
              fullWidth
              onClick={() => {
                setManualEntry(false);
                if (!scanning && open) {
                  startScanning();
                }
              }}
              startIcon={<QrCodeScanner />}
            >
              Scan QR Code
            </Button>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button
              variant={manualEntry ? "contained" : "outlined"}
              fullWidth
              onClick={() => {
                stopScanning();
                setManualEntry(true);
              }}
            >
              Manual Entry
            </Button>
          </Grid>
        </Grid>

        {manualEntry ? (
          <Box>
            <TextField
              fullWidth
              label="Student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Enter student ID (e.g., STU001)"
              sx={{ mb: 2 }}
              autoFocus
            />
            <TextField
              fullWidth
              label="Outing Reason"
              value={outingReason}
              onChange={(e) => setOutingReason(e.target.value)}
              placeholder="Enter reason for outing"
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Expected Return Time"
              type="datetime-local"
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Box>
        ) : (
          <Box>
            <Box sx={{ mb: 2 }}>
              <TextField
                fullWidth
                label="Outing Reason (Optional)"
                value={outingReason}
                onChange={(e) => setOutingReason(e.target.value)}
                placeholder="Enter reason for outing"
                sx={{ mb: 1 }}
              />
              <TextField
                fullWidth
                label="Expected Return Time (Optional)"
                type="datetime-local"
                value={expectedReturn}
                onChange={(e) => setExpectedReturn(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            {scanning && (
              <Box textAlign="center" sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Position the QR code within the camera frame
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Make sure the QR code is well-lit and clearly visible
                </Typography>
              </Box>
            )}

            <div id="qr-reader" style={{ width: "100%" }}></div>
          </Box>
        )}

        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{ mt: 2 }}
          >
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ ml: 2 }}>
              Processing entry/exit...
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} startIcon={<Close />}>
          Close
        </Button>
        {manualEntry && (
          <Button
            onClick={handleManualSubmit}
            variant="contained"
            disabled={loading || !selectedGate || !studentId.trim()}
          >
            Submit
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default WardenQRScanner;
