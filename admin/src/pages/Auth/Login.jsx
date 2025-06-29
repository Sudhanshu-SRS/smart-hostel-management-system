// admin/src/pages/Auth/Login.jsx
import React, { useState, useEffect } from "react";
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
  Card,
  CardContent,
  Grid,
  Chip,
  Divider,
} from "@mui/material";
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  AdminPanelSettings,
  Security,
  Speed,
  Analytics,
  Settings,
  VpnKey,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import {
  ADMIN_CREDENTIALS,
  WARDEN_CREDENTIALS,
} from "../../config/adminConfig";

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

  const fillCredentials = (credentials) => {
    setFormData({
      email: credentials.email,
      password: credentials.password,
    });
  };

  const adminFeatures = [
    {
      icon: <Speed />,
      title: "Real-time Monitoring",
      desc: "Live system dashboard",
    },
    {
      icon: <Analytics />,
      title: "Advanced Analytics",
      desc: "Comprehensive reports",
    },
    {
      icon: <Security />,
      title: "Security Management",
      desc: "Access control & logs",
    },
    {
      icon: <Settings />,
      title: "System Configuration",
      desc: "Full system control",
    },
  ];

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0a0e27 0%, #1a1d3a 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 2,
      }}
    >
      <Container component="main" maxWidth="lg">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Grid container spacing={4} alignItems="center">
            {/* Left side - Admin Features */}
            <Grid item xs={12} md={7}>
              <Box sx={{ color: "white", mb: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <AdminPanelSettings
                    sx={{ fontSize: 60, mr: 2, color: "primary.main" }}
                  />
                  <Box>
                    <Typography variant="h2" fontWeight="bold">
                      SHMS Admin Panel
                    </Typography>
                    <Typography variant="h5" sx={{ opacity: 0.8 }}>
                      Smart Hostel Management System
                    </Typography>
                  </Box>
                </Box>

                <Typography variant="h6" sx={{ mb: 4, opacity: 0.9 }}>
                  Comprehensive administrative control for your hostel
                  management system
                </Typography>

                <Grid container spacing={3} sx={{ mb: 4 }}>
                  {adminFeatures.map((feature, index) => (
                    <Grid item xs={12} sm={6} key={index}>
                      <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                      >
                        <Card
                          sx={{
                            background: "rgba(255,255,255,0.05)",
                            backdropFilter: "blur(10px)",
                            border: "1px solid rgba(255,255,255,0.1)",
                          }}
                        >
                          <CardContent>
                            <Box display="flex" alignItems="center" mb={1}>
                              {React.cloneElement(feature.icon, {
                                sx: { color: "primary.main", mr: 2 },
                              })}
                              <Typography variant="h6" color="white">
                                {feature.title}
                              </Typography>
                            </Box>
                            <Typography
                              variant="body2"
                              sx={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              {feature.desc}
                            </Typography>
                          </CardContent>
                        </Card>
                      </motion.div>
                    </Grid>
                  ))}
                </Grid>

                {/* Hardcoded Credentials Section */}
                <Card
                  sx={{
                    background: "rgba(26, 35, 126, 0.3)",
                    backdropFilter: "blur(10px)",
                    border: "1px solid rgba(255,255,255,0.2)",
                  }}
                >
                  <CardContent>
                    <Box display="flex" alignItems="center" mb={2}>
                      <VpnKey sx={{ color: "primary.main", mr: 2 }} />
                      <Typography variant="h6" color="white">
                        Quick Access Credentials
                      </Typography>
                    </Box>
                    <Divider
                      sx={{ mb: 2, borderColor: "rgba(255,255,255,0.1)" }}
                    />

                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={6}>
                        <Card
                          sx={{
                            background: "rgba(255,255,255,0.05)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              background: "rgba(255,255,255,0.1)",
                              transform: "translateY(-2px)",
                            },
                          }}
                          onClick={() => fillCredentials(ADMIN_CREDENTIALS)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Chip
                              label="ADMIN"
                              color="error"
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Typography
                              variant="body2"
                              color="white"
                              fontWeight="bold"
                            >
                              {ADMIN_CREDENTIALS.email}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              Click to auto-fill
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>

                      <Grid item xs={12} sm={6}>
                        <Card
                          sx={{
                            background: "rgba(255,255,255,0.05)",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            "&:hover": {
                              background: "rgba(255,255,255,0.1)",
                              transform: "translateY(-2px)",
                            },
                          }}
                          onClick={() => fillCredentials(WARDEN_CREDENTIALS)}
                        >
                          <CardContent sx={{ p: 2 }}>
                            <Chip
                              label="WARDEN"
                              color="warning"
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <Typography
                              variant="body2"
                              color="white"
                              fontWeight="bold"
                            >
                              {WARDEN_CREDENTIALS.email}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: "rgba(255,255,255,0.7)" }}
                            >
                              Click to auto-fill
                            </Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            </Grid>

            {/* Right side - Login Form */}
            <Grid item xs={12} md={5}>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Paper
                  elevation={24}
                  sx={{
                    padding: 4,
                    borderRadius: 3,
                    background: "rgba(26, 29, 58, 0.95)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  <Box textAlign="center" mb={4}>
                    <AdminPanelSettings
                      sx={{ fontSize: 60, color: "primary.main", mb: 2 }}
                    />
                    <Typography
                      component="h1"
                      variant="h4"
                      sx={{
                        fontWeight: "bold",
                        color: "white",
                        mb: 1,
                      }}
                    >
                      Admin Access
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ color: "rgba(255,255,255,0.7)" }}
                    >
                      Sign in to access the administrative dashboard
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
                      label="Admin Email"
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
                              {showPassword ? (
                                <VisibilityOff />
                              ) : (
                                <Visibility />
                              )}
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
                        fontSize: "1.1rem",
                        fontWeight: "bold",
                      }}
                    >
                      {loading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        "Access Admin Panel"
                      )}
                    </Button>

                    <Box textAlign="center" mt={3}>
                      <Typography
                        variant="caption"
                        sx={{ color: "rgba(255,255,255,0.5)" }}
                      >
                        Authorized personnel only. All access is logged and
                        monitored.
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </motion.div>
            </Grid>
          </Grid>
        </motion.div>
      </Container>
    </Box>
  );
};

export default Login;
