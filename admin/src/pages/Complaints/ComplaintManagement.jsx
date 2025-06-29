// admin/src/pages/Complaints/ComplaintManagement.jsx
import React from "react";
import { Typography, Box, Paper } from "@mui/material";
import { ReportProblem } from "@mui/icons-material";

const ComplaintManagement = () => {
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
          <ReportProblem sx={{ fontSize: 80 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Complaint Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Issue resolution system
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ComplaintManagement;
