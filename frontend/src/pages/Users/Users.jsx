// src/pages/Users/Users.jsx
import React from "react";
import { Typography, Box, Paper } from "@mui/material";

const Users = () => {
  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          User Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          User administration panel - Coming Soon
        </Typography>
      </Paper>
    </Box>
  );
};

export default Users;
