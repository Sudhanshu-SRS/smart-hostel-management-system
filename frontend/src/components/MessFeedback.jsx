import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Rating,
  Box,
  Alert,
  CircularProgress,
  FormControlLabel,
  Switch,
  Chip,
  LinearProgress,
} from "@mui/material";
import {
  Restaurant,
  Star,
  Send,
  CheckCircle,
  Feedback,
} from "@mui/icons-material";
import { motion } from "framer-motion";
import { messFeedbackAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";

const MessFeedbackForm = () => {
  const [formData, setFormData] = useState({
    feedbackType: "daily",
    foodQuality: 5,
    serviceQuality: 5,
    cleanliness: 5,
    overallSatisfaction: 5,
    mealType: "lunch",
    suggestions: "",
    complaints: "",
    isAnonymous: false,
  });

  const [loading, setLoading] = useState(false);
  const [hasSubmittedToday, setHasSubmittedToday] = useState(false);
  const [checkingSubmission, setCheckingSubmission] = useState(true);
  const [recentFeedbacks, setRecentFeedbacks] = useState([]);

  const { user } = useAuth();

  const mealTypes = [
    { value: "breakfast", label: "Breakfast", icon: "🌅" },
    { value: "lunch", label: "Lunch", icon: "☀️" },
    { value: "dinner", label: "Dinner", icon: "🌙" },
    { value: "all", label: "All Meals", icon: "🍽️" },
  ];

  const feedbackTypes = [
    { value: "daily", label: "Daily Feedback" },
    { value: "weekly", label: "Weekly Feedback" },
    { value: "monthly", label: "Monthly Feedback" },
  ];

  useEffect(() => {
    checkDailySubmission();
    fetchRecentFeedbacks();
  }, []);

  const checkDailySubmission = async () => {
    try {
      setCheckingSubmission(true);
      const response = await messFeedbackAPI.checkDailySubmission();
      setHasSubmittedToday(response.data.hasSubmittedToday);
    } catch (error) {
      console.error("Check submission error:", error);
    } finally {
      setCheckingSubmission(false);
    }
  };

  const fetchRecentFeedbacks = async () => {
    try {
      const response = await messFeedbackAPI.getMyFeedback({ limit: 5 });
      setRecentFeedbacks(response.data.feedbacks);
    } catch (error) {
      console.error("Fetch recent feedbacks error:", error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.mealType) {
      toast.error("Please select a meal type");
      return false;
    }

    if (formData.foodQuality < 1 || formData.foodQuality > 5) {
      toast.error("Please provide a valid food quality rating");
      return false;
    }

    if (formData.suggestions && formData.suggestions.length > 500) {
      toast.error("Suggestions cannot exceed 500 characters");
      return false;
    }

    if (formData.complaints && formData.complaints.length > 500) {
      toast.error("Complaints cannot exceed 500 characters");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    // Check if trying to submit daily feedback when already submitted
    if (formData.feedbackType === "daily" && hasSubmittedToday) {
      toast.error("You have already submitted daily feedback today");
      return;
    }

    setLoading(true);

    try {
      const response = await messFeedbackAPI.submitFeedback(formData);

      toast.success("Feedback submitted successfully! 🎉", {
        icon: "📝",
      });

      // Reset form
      setFormData({
        feedbackType: "daily",
        foodQuality: 5,
        serviceQuality: 5,
        cleanliness: 5,
        overallSatisfaction: 5,
        mealType: "lunch",
        suggestions: "",
        complaints: "",
        isAnonymous: false,
      });

      // Refresh submission status and recent feedbacks
      checkDailySubmission();
      fetchRecentFeedbacks();
    } catch (error) {
      console.error("Submit feedback error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to submit feedback";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: "Very Poor",
      2: "Poor",
      3: "Average",
      4: "Good",
      5: "Excellent",
    };
    return labels[rating] || "";
  };

  const getOverallProgress = () => {
    const total =
      formData.foodQuality +
      formData.serviceQuality +
      formData.cleanliness +
      formData.overallSatisfaction;
    return (total / 20) * 100; // Maximum is 20 (5*4)
  };

  if (checkingSubmission) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Grid container spacing={3}>
        {/* Main Feedback Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" alignItems="center" mb={3}>
                <Restaurant color="primary" sx={{ mr: 2 }} />
                <Typography variant="h5" fontWeight="bold">
                  Mess Feedback
                </Typography>
              </Box>

              {/* Daily Submission Warning */}
              {formData.feedbackType === "daily" && hasSubmittedToday && (
                <Alert severity="warning" sx={{ mb: 3 }}>
                  You have already submitted daily feedback today. You can
                  submit weekly or monthly feedback instead.
                </Alert>
              )}

              <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                  {/* Feedback Type */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Feedback Type</InputLabel>
                      <Select
                        value={formData.feedbackType}
                        label="Feedback Type"
                        onChange={(e) =>
                          handleInputChange("feedbackType", e.target.value)
                        }
                      >
                        {feedbackTypes.map((type) => (
                          <MenuItem key={type.value} value={type.value}>
                            {type.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Meal Type */}
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Meal Type</InputLabel>
                      <Select
                        value={formData.mealType}
                        label="Meal Type"
                        onChange={(e) =>
                          handleInputChange("mealType", e.target.value)
                        }
                      >
                        {mealTypes.map((meal) => (
                          <MenuItem key={meal.value} value={meal.value}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <span>{meal.icon}</span>
                              {meal.label}
                            </Box>
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  {/* Overall Progress */}
                  <Grid item xs={12}>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      gutterBottom
                    >
                      Overall Rating Progress
                    </Typography>
                    <LinearProgress
                      variant="determinate"
                      value={getOverallProgress()}
                      sx={{ height: 8, borderRadius: 1, mb: 1 }}
                      color={
                        getOverallProgress() >= 80
                          ? "success"
                          : getOverallProgress() >= 60
                          ? "warning"
                          : "error"
                      }
                    />
                    <Typography variant="body2" color="text.secondary">
                      {getOverallProgress().toFixed(0)}% satisfaction
                    </Typography>
                  </Grid>

                  {/* Rating Questions */}
                  {[
                    { field: "foodQuality", label: "Food Quality", icon: "🍯" },
                    {
                      field: "serviceQuality",
                      label: "Service Quality",
                      icon: "👥",
                    },
                    { field: "cleanliness", label: "Cleanliness", icon: "🧹" },
                    {
                      field: "overallSatisfaction",
                      label: "Overall Satisfaction",
                      icon: "🎯",
                    },
                  ].map((item) => (
                    <Grid item xs={12} sm={6} key={item.field}>
                      <Typography variant="body1" gutterBottom>
                        <span style={{ marginRight: 8 }}>{item.icon}</span>
                        {item.label}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={2}>
                        <Rating
                          value={formData[item.field]}
                          onChange={(event, newValue) => {
                            handleInputChange(item.field, newValue || 1);
                          }}
                          size="large"
                          icon={<Star fontSize="inherit" />}
                          emptyIcon={<Star fontSize="inherit" />}
                        />
                        <Chip
                          label={getRatingLabel(formData[item.field])}
                          color={
                            formData[item.field] >= 4
                              ? "success"
                              : formData[item.field] >= 3
                              ? "warning"
                              : "error"
                          }
                          size="small"
                        />
                      </Box>
                    </Grid>
                  ))}

                  {/* Suggestions */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Suggestions (Optional)"
                      multiline
                      rows={3}
                      value={formData.suggestions}
                      onChange={(e) =>
                        handleInputChange("suggestions", e.target.value)
                      }
                      placeholder="Share your suggestions to improve mess services..."
                      helperText={`${formData.suggestions.length}/500 characters`}
                      inputProps={{ maxLength: 500 }}
                    />
                  </Grid>

                  {/* Complaints */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Complaints (Optional)"
                      multiline
                      rows={3}
                      value={formData.complaints}
                      onChange={(e) =>
                        handleInputChange("complaints", e.target.value)
                      }
                      placeholder="Share any complaints or issues you faced..."
                      helperText={`${formData.complaints.length}/500 characters`}
                      inputProps={{ maxLength: 500 }}
                    />
                  </Grid>

                  {/* Anonymous Option */}
                  <Grid item xs={12}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formData.isAnonymous}
                          onChange={(e) =>
                            handleInputChange("isAnonymous", e.target.checked)
                          }
                        />
                      }
                      label="Submit anonymously"
                    />
                    <Typography variant="body2" color="text.secondary">
                      Your name will not be shared with the warden if you choose
                      anonymous feedback
                    </Typography>
                  </Grid>

                  {/* Submit Button */}
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={
                        loading ||
                        (formData.feedbackType === "daily" && hasSubmittedToday)
                      }
                      startIcon={
                        loading ? <CircularProgress size={20} /> : <Send />
                      }
                      sx={{ py: 1.5 }}
                    >
                      {loading ? "Submitting..." : "Submit Feedback"}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Feedbacks Sidebar */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <Feedback sx={{ mr: 1, verticalAlign: "middle" }} />
                Recent Submissions
              </Typography>

              {recentFeedbacks.length > 0 ? (
                <Box>
                  {recentFeedbacks.map((feedback) => (
                    <Card
                      key={feedback._id}
                      variant="outlined"
                      sx={{ mb: 2, p: 2 }}
                    >
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={1}
                      >
                        <Chip
                          label={feedback.feedbackType}
                          size="small"
                          color="primary"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </Typography>
                      </Box>

                      <Typography variant="body2" gutterBottom>
                        <strong>Meal:</strong> {feedback.mealType}
                      </Typography>

                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2">Overall:</Typography>
                        <Rating
                          value={feedback.overallSatisfaction}
                          size="small"
                          readOnly
                        />
                        <Typography variant="body2">
                          ({feedback.overallSatisfaction}/5)
                        </Typography>
                      </Box>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No previous submissions found
                </Typography>
              )}

              {/* Daily Submission Status */}
              <Alert
                severity={hasSubmittedToday ? "success" : "info"}
                sx={{ mt: 2 }}
                icon={hasSubmittedToday ? <CheckCircle /> : <Feedback />}
              >
                <Typography variant="body2">
                  {hasSubmittedToday
                    ? "✅ Daily feedback submitted today"
                    : "📝 Daily feedback pending for today"}
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </motion.div>
  );
};

export default MessFeedbackForm;
