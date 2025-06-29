// admin/src/pages/Rooms/RoomManagement.jsx
import React from "react";
import { Typography, Box, Paper } from "@mui/material";
import { Hotel } from "@mui/icons-material";

const RoomManagement = () => {
  return (
    <Box>
      <Paper
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #1a237e, #3949ab)",
          color: "white",
        }}
      >
        <Box display="flex" alignItems="center" gap={3}>
          <Hotel sx={{ fontSize: 80 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Room Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Room allocation & maintenance system
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default RoomManagement;
