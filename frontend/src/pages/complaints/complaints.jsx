// src/pages/Complaints/Complaints.jsx
import React from "react";
import { Typography, Box, Paper } from "@mui/material";

const Complaints = () => {
  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Complaint Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Digital complaint management system - Coming Soon
        </Typography>
      </Paper>
    </Box>
  );
};

export default Complaints;
