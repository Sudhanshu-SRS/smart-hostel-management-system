// src/pages/Visitors/Visitors.jsx
import React from "react";
import { Typography, Box, Paper } from "@mui/material";

const Visitors = () => {
  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          Visitor Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Digital visitor registration and tracking - Coming Soon
        </Typography>
      </Paper>
    </Box>
  );
};

export default Visitors;
