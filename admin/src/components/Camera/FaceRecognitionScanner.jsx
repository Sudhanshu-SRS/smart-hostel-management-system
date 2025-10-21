// admin/src/components/Camera/FaceRecognitionScanner.jsx
import React, { useState, useRef, useEffect, useCallback } from "react";
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
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Grid,
  Paper,
} from "@mui/material";
import {
  CameraAlt,
  Stop,
  Close,
  Face,
  CheckCircle,
  Error,
  Refresh,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import adminAPI from "../../services/api";

const FaceRecognitionScanner = ({
  open,
  onClose,
  selectedGate,
  onScanSuccess,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [recognizedStudents, setRecognizedStudents] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [stream, setStream] = useState(null);
  const [facesInFrame, setFacesInFrame] = useState([]);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsScanning(false);
  }, [stream]);

  // Start camera
  const startCamera = async () => {
    try {
      setError("");

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setIsScanning(true);

        // Start face recognition
        startFaceRecognition();
      }
    } catch (err) {
      setError(
        "Failed to access camera. Please ensure camera permissions are granted."
      );
      console.error("Camera access error:", err);
    }
  };

  // Stop camera
  const stopCamera = () => {
    cleanup();
    setFacesInFrame([]);
    setRecognizedStudents([]);
  };

  // Capture frame and send for recognition
  const captureAndRecognize = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    // Convert to base64
    const imageData = canvas.toDataURL("image/jpeg", 0.8);

    try {
      const response = await fetch(
        "http://localhost:5001/api/vision/recognize",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: imageData }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setFacesInFrame(result.students);
      }
    } catch (error) {
      console.error("Recognition error:", error);
    }
  };

  // Start continuous face recognition
  const startFaceRecognition = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    intervalRef.current = setInterval(captureAndRecognize, 1000); // Every second
  };

  // Process attendance for recognized students
  const processAttendance = async () => {
    if (facesInFrame.length === 0) {
      toast.warning("No students detected in frame");
      return;
    }

    if (!selectedGate) {
      toast.error("Please select a gate first");
      return;
    }

    setIsProcessing(true);

    try {
      const canvas = canvasRef.current;
      const imageData = canvas.toDataURL("image/jpeg", 0.8);

      const response = await fetch(
        "http://localhost:5001/api/vision/process-attendance",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            image: imageData,
            gateId: selectedGate._id,
            wardenId: "current_warden_id", // Get from auth context
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        setRecognizedStudents(result.processedStudents);

        // Show success message
        const successCount = result.processedStudents.filter(
          (s) => s.success
        ).length;
        toast.success(
          `Successfully processed attendance for ${successCount} student(s)`
        );

        // Clear faces in frame
        setFacesInFrame([]);

        if (onScanSuccess) {
          onScanSuccess(result);
        }
      } else {
        toast.error(result.message || "Failed to process attendance");
      }
    } catch (error) {
      console.error("Attendance processing error:", error);
      toast.error("Failed to process attendance");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle dialog close
  const handleClose = () => {
    stopCamera();
    onClose();
  };

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: { height: "90vh" },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" gap={1}>
          <Face />
          Face Recognition Attendance
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={3}>
          {/* Camera Feed */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Camera Feed
              </Typography>

              <Box position="relative" sx={{ mb: 2 }}>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  style={{
                    width: "100%",
                    maxHeight: "400px",
                    backgroundColor: "#000",
                    borderRadius: "8px",
                  }}
                />
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {/* Face detection overlay */}
                {facesInFrame.map((face, index) => (
                  <Box
                    key={index}
                    position="absolute"
                    sx={{
                      top: `${(face.boundingBox.top / 720) * 100}%`,
                      left: `${(face.boundingBox.left / 1280) * 100}%`,
                      width: `${
                        ((face.boundingBox.right - face.boundingBox.left) /
                          1280) *
                        100
                      }%`,
                      height: `${
                        ((face.boundingBox.bottom - face.boundingBox.top) /
                          720) *
                        100
                      }%`,
                      border: "2px solid #4caf50",
                      borderRadius: "4px",
                      backgroundColor: "rgba(76, 175, 80, 0.1)",
                    }}
                  >
                    <Typography
                      variant="caption"
                      sx={{
                        position: "absolute",
                        top: -24,
                        left: 0,
                        backgroundColor: "#4caf50",
                        color: "white",
                        px: 1,
                        borderRadius: "4px",
                        fontSize: "12px",
                      }}
                    >
                      {face.name} ({Math.round(face.confidence * 100)}%)
                    </Typography>
                  </Box>
                ))}
              </Box>

              <Box display="flex" gap={2} justifyContent="center">
                {!isScanning ? (
                  <Button
                    variant="contained"
                    onClick={startCamera}
                    startIcon={<CameraAlt />}
                    size="large"
                  >
                    Start Camera
                  </Button>
                ) : (
                  <Button
                    variant="outlined"
                    onClick={stopCamera}
                    startIcon={<Stop />}
                    color="error"
                  >
                    Stop Camera
                  </Button>
                )}

                <Button
                  variant="contained"
                  onClick={processAttendance}
                  disabled={
                    !isScanning || facesInFrame.length === 0 || isProcessing
                  }
                  startIcon={
                    isProcessing ? (
                      <CircularProgress size={20} />
                    ) : (
                      <CheckCircle />
                    )
                  }
                  color="success"
                >
                  Process Attendance ({facesInFrame.length})
                </Button>
              </Box>
            </Paper>
          </Grid>

          {/* Recognition Results */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: "100%" }}>
              <Typography variant="h6" gutterBottom>
                Recognition Results
              </Typography>

              {/* Currently detected faces */}
              {facesInFrame.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Detected Students:
                  </Typography>
                  <List dense>
                    {facesInFrame.map((face, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar sx={{ bgcolor: "primary.main" }}>
                            <Face />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={face.name}
                          secondary={`ID: ${face.studentId} | ${Math.round(
                            face.confidence * 100
                          )}% confidence`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {/* Processed results */}
              {recognizedStudents.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Processed Attendance:
                  </Typography>
                  <List dense>
                    {recognizedStudents.map((result, index) => (
                      <ListItem key={index}>
                        <ListItemAvatar>
                          <Avatar
                            sx={{
                              bgcolor: result.success
                                ? "success.main"
                                : "error.main",
                            }}
                          >
                            {result.success ? <CheckCircle /> : <Error />}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={result.student.name}
                          secondary={
                            result.success
                              ? `${result.action?.toUpperCase()} recorded`
                              : result.error
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {facesInFrame.length === 0 && recognizedStudents.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  textAlign="center"
                >
                  {isScanning
                    ? "Looking for faces..."
                    : "Start camera to begin recognition"}
                </Typography>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} startIcon={<Close />}>
          Close
        </Button>
        <Button
          onClick={() => {
            setRecognizedStudents([]);
            setFacesInFrame([]);
          }}
          startIcon={<Refresh />}
        >
          Clear Results
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FaceRecognitionScanner;
