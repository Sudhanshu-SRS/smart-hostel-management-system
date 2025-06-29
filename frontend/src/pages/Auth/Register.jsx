import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Alert,
  CircularProgress,
  Grid,
  InputAdornment,
  IconButton,
  MenuItem,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Person,
  Email,
  Phone,
  School,
  Home,
  ArrowBack,
  ArrowForward,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

const steps = ["Personal Information", "Contact Details", "Emergency Contact"];

const Register = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    // Personal Information
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    studentId: "",
    role: "student",

    // Contact Details
    phoneNumber: "",
    address: {
      street: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
    },

    // Emergency Contact
    emergencyContact: {
      name: "",
      phone: "",
      relation: "",
    },
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { register, isAuthenticated, error, clearErrors } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
    clearErrors();
  }, [isAuthenticated, navigate, clearErrors]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Personal Information
        if (!formData.name.trim()) newErrors.name = "Name is required";
        if (!formData.email.trim()) newErrors.email = "Email is required";
        if (!formData.password) newErrors.password = "Password is required";
        if (formData.password.length < 6)
          newErrors.password = "Password must be at least 6 characters";
        if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }
        if (!formData.studentId.trim())
          newErrors.studentId = "Student ID is required";
        break;

      case 1: // Contact Details
        if (!formData.phoneNumber.trim())
          newErrors.phoneNumber = "Phone number is required";
        if (!/^[0-9]{10}$/.test(formData.phoneNumber)) {
          newErrors.phoneNumber = "Phone number must be 10 digits";
        }
        if (!formData.address.city.trim())
          newErrors["address.city"] = "City is required";
        if (!formData.address.state.trim())
          newErrors["address.state"] = "State is required";
        break;

      case 2: // Emergency Contact
        if (!formData.emergencyContact.name.trim()) {
          newErrors["emergencyContact.name"] =
            "Emergency contact name is required";
        }
        if (!formData.emergencyContact.phone.trim()) {
          newErrors["emergencyContact.phone"] =
            "Emergency contact phone is required";
        }
        if (!/^[0-9]{10}$/.test(formData.emergencyContact.phone)) {
          newErrors["emergencyContact.phone"] =
            "Phone number must be 10 digits";
        }
        if (!formData.emergencyContact.relation.trim()) {
          newErrors["emergencyContact.relation"] = "Relation is required";
        }
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateStep(activeStep)) return;

    setLoading(true);

    const { confirmPassword, ...submitData } = formData;
    const result = await register(submitData);

    if (result.success) {
      navigate("/dashboard");
    }

    setLoading(false);
  };

  const renderStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="name"
                label="Full Name"
                value={formData.name}
                onChange={handleChange}
                error={!!errors.name}
                helperText={errors.name}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="email"
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={handleChange}
                error={!!errors.email}
                helperText={errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="studentId"
                label="Student ID"
                value={formData.studentId}
                onChange={handleChange}
                error={!!errors.studentId}
                helperText={errors.studentId}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <School color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="password"
                label="Password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                error={!!errors.password}
                helperText={errors.password}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="confirmPassword"
                label="Confirm Password"
                type={showConfirmPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={handleChange}
                error={!!errors.confirmPassword}
                helperText={errors.confirmPassword}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        edge="end"
                      >
                        {showConfirmPassword ? (
                          <VisibilityOff />
                        ) : (
                          <Visibility />
                        )}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="phoneNumber"
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                error={!!errors.phoneNumber}
                helperText={errors.phoneNumber}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                name="address.street"
                label="Street Address"
                value={formData.address.street}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="address.city"
                label="City"
                value={formData.address.city}
                onChange={handleChange}
                error={!!errors["address.city"]}
                helperText={errors["address.city"]}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="address.state"
                label="State"
                value={formData.address.state}
                onChange={handleChange}
                error={!!errors["address.state"]}
                helperText={errors["address.state"]}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="address.pincode"
                label="Pincode"
                value={formData.address.pincode}
                onChange={handleChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                name="address.country"
                label="Country"
                value={formData.address.country}
                onChange={handleChange}
                disabled
              />
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Emergency Contact Information
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                name="emergencyContact.name"
                label="Contact Name"
                value={formData.emergencyContact.name}
                onChange={handleChange}
                error={!!errors["emergencyContact.name"]}
                helperText={errors["emergencyContact.name"]}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="emergencyContact.phone"
                label="Contact Phone"
                value={formData.emergencyContact.phone}
                onChange={handleChange}
                error={!!errors["emergencyContact.phone"]}
                helperText={errors["emergencyContact.phone"]}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                name="emergencyContact.relation"
                label="Relation"
                select
                value={formData.emergencyContact.relation}
                onChange={handleChange}
                error={!!errors["emergencyContact.relation"]}
                helperText={errors["emergencyContact.relation"]}
              >
                <MenuItem value="parent">Parent</MenuItem>
                <MenuItem value="guardian">Guardian</MenuItem>
                <MenuItem value="sibling">Sibling</MenuItem>
                <MenuItem value="relative">Relative</MenuItem>
                <MenuItem value="friend">Friend</MenuItem>
                <MenuItem value="other">Other</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            elevation={24}
            sx={{
              padding: 4,
              borderRadius: 3,
              background: "rgba(255, 255, 255, 0.95)",
              backdropFilter: "blur(10px)",
            }}
          >
            <Box textAlign="center" mb={4}>
              <Typography
                component="h1"
                variant="h3"
                sx={{
                  fontWeight: "bold",
                  background: "linear-gradient(135deg, #1976d2, #42a5f5)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  mb: 1,
                }}
              >
                Join SHMS
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Create your Smart Hostel Management account
              </Typography>
            </Box>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit}>
              {renderStepContent(activeStep)}

              <Box
                sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}
              >
                <Button
                  disabled={activeStep === 0}
                  onClick={handleBack}
                  startIcon={<ArrowBack />}
                >
                  Back
                </Button>

                <Box sx={{ flex: "1 1 auto" }} />

                {activeStep === steps.length - 1 ? (
                  <Button
                    type="submit"
                    variant="contained"
                    disabled={loading}
                    sx={{
                      background: "linear-gradient(135deg, #1976d2, #42a5f5)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #1565c0, #1976d2)",
                      },
                    }}
                  >
                    {loading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      "Create Account"
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="contained"
                    onClick={handleNext}
                    endIcon={<ArrowForward />}
                    sx={{
                      background: "linear-gradient(135deg, #1976d2, #42a5f5)",
                      "&:hover": {
                        background: "linear-gradient(135deg, #1565c0, #1976d2)",
                      },
                    }}
                  >
                    Next
                  </Button>
                )}
              </Box>
            </Box>

            <Box textAlign="center" mt={3}>
              <Link
                component={RouterLink}
                to="/login"
                variant="body2"
                sx={{
                  textDecoration: "none",
                  fontWeight: 500,
                  "&:hover": { textDecoration: "underline" },
                }}
              >
                Already have an account? Sign in
              </Link>
            </Box>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Register;
