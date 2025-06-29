// admin/src/pages/Analytics/Analytics.jsx
import React from "react";
import { Typography, Box, Paper } from "@mui/material";
import { Analytics as AnalyticsIcon } from "@mui/icons-material";

const Analytics = () => {
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
          <AnalyticsIcon sx={{ fontSize: 80 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Advanced Analytics
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Data insights & reporting
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Analytics;
