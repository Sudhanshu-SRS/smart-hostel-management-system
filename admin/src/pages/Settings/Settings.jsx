// admin/src/pages/Settings/Settings.jsx
import React from "react";
import { Typography, Box, Paper } from "@mui/material";
import { Settings as SettingsIcon } from "@mui/icons-material";

const Settings = () => {
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
          <SettingsIcon sx={{ fontSize: 80 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              System Settings
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Configuration & preferences
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default Settings;
