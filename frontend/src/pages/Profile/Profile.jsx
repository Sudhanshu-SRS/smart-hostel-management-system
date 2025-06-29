// src/pages/Profile/Profile.jsx
import React from "react";
import { Typography, Box, Paper } from "@mui/material";

const Profile = () => {
  return (
    <Box>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h4" gutterBottom>
          My Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Profile management - Coming Soon
        </Typography>
      </Paper>
    </Box>
  );
};

export default Profile;
