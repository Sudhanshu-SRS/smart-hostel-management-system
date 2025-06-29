// admin/src/pages/Visitors/VisitorManagement.jsx
import React from "react";
import { Typography, Box, Paper } from "@mui/material";
import { Visibility } from "@mui/icons-material";

const VisitorManagement = () => {
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
          <Visibility sx={{ fontSize: 80 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Visitor Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Access control & tracking
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default VisitorManagement;
