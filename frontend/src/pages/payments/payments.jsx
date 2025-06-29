// src/pages/Payments/Payments.jsx
import React from "react";
import { Typography, Box, Paper } from "@mui/material";

const Payments = () => {
  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Payment Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Razorpay integration for secure payments - Coming Soon
        </Typography>
      </Paper>
    </Box>
  );
};

export default Payments;
