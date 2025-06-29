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
  InputAdornment,
  IconButton,
  Card,
  CardContent,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Home,
} from "@mui/icons-material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, isAuthenticated, error, clearErrors } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
    clearErrors();
  }, [isAuthenticated, navigate, clearErrors]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const result = await login(formData.email, formData.password);

    if (result.success) {
      navigate("/dashboard");
    }

    setLoading(false);
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
          <Box display="flex" gap={4} alignItems="center">
            {/* Left side - Branding */}
            <Card
              sx={{
                flex: 1,
                display: { xs: "none", md: "block" },
                background: "rgba(255, 255, 255, 0.1)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
              }}
            >
              <CardContent sx={{ p: 4, textAlign: "center", color: "white" }}>
                <Home sx={{ fontSize: 80, mb: 2 }} />
                <Typography variant="h3" fontWeight="bold" mb={2}>
                  Smart Hostel Management
                </Typography>
                <Typography variant="h6" mb={3}>
                  Streamline your hostel operations with our comprehensive
                  management solution
                </Typography>
                <Box textAlign="left">
                  <Typography variant="body1" mb={1}>
                    ✓ Real-time room availability tracking
                  </Typography>
                  <Typography variant="body1" mb={1}>
                    ✓ Secure online payment system
                  </Typography>
                  <Typography variant="body1" mb={1}>
                    ✓ Digital complaint management
                  </Typography>
                  <Typography variant="body1" mb={1}>
                    ✓ Visitor registration & tracking
                  </Typography>
                  <Typography variant="body1">
                    ✓ Comprehensive dashboard analytics
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Right side - Login Form */}
            <Paper
              elevation={24}
              sx={{
                flex: 1,
                maxWidth: 450,
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
                  Welcome Back
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Sign in to access your hostel dashboard
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  autoComplete="email"
                  autoFocus
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Email color="action" />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 2 }}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  name="password"
                  label="Password"
                  type={showPassword ? "text" : "password"}
                  id="password"
                  autoComplete="current-password"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Lock color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="toggle password visibility"
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{ mb: 3 }}
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  size="large"
                  disabled={loading}
                  sx={{
                    mt: 2,
                    mb: 2,
                    py: 1.5,
                    background: "linear-gradient(135deg, #1976d2, #42a5f5)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #1565c0, #1976d2)",
                    },
                  }}
                >
                  {loading ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Sign In"
                  )}
                </Button>

                <Box textAlign="center" mt={3}>
                  <Link
                    component={RouterLink}
                    to="/register"
                    variant="body2"
                    sx={{
                      textDecoration: "none",
                      fontWeight: 500,
                      "&:hover": { textDecoration: "underline" },
                    }}
                  >
                    Don't have an account? Join SHMS today
                  </Link>
                </Box>
              </Box>
            </Paper>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Login;
