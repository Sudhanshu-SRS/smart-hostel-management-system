// admin/src/pages/Payments/PaymentManagement.jsx
import React from "react";
import { Typography, Box, Paper } from "@mui/material";
import { Payment } from "@mui/icons-material";

const PaymentManagement = () => {
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
          <Payment sx={{ fontSize: 80 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Payment Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Financial operations & transactions
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default PaymentManagement;
