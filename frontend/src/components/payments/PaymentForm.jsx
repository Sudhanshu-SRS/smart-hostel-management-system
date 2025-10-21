// frontend/src/components/payments/PaymentForm.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Divider,
  Grid,
} from "@mui/material";
import { AccountBalance, CreditCard, Security } from "@mui/icons-material";
import { paymentsAPI } from "../../services/api";

const PaymentForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    amount: "",
    paymentType: "",
    description: "",
    roomId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);

  const paymentTypes = [
    { value: "monthly_rent", label: "Monthly Rent" },
    { value: "security_deposit", label: "Security Deposit" },
    { value: "maintenance", label: "Maintenance Fee" },
    { value: "fine", label: "Fine" },
    { value: "laundry", label: "Laundry" },
    { value: "mess_fee", label: "Mess Fee" },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.amount || !formData.paymentType) {
      setError("Please fill in all required fields");
      return;
    }

    if (parseFloat(formData.amount) <= 0) {
      setError("Amount must be greater than 0");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Create Razorpay order
      const orderResponse = await paymentsAPI.createOrder(formData);
      const { order, payment, key } = orderResponse.data;

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        throw new Error("Failed to load Razorpay SDK");
      }

      setProcessingPayment(true);

      // Configure Razorpay options
      const options = {
        key: key,
        amount: order.amount,
        currency: order.currency,
        name: "Smart Hostel Management",
        description:
          formData.description ||
          `${formData.paymentType.replace("_", " ")} payment`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // Verify payment
            const verificationData = {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              paymentId: payment._id,
            };

            const verifyResponse = await paymentsAPI.verifyPayment(
              verificationData
            );

            if (verifyResponse.data.success) {
              onSuccess();
            } else {
              setError("Payment verification failed");
            }
          } catch (verifyError) {
            console.error("Payment verification error:", verifyError);
            setError("Payment verification failed");
          } finally {
            setProcessingPayment(false);
          }
        },
        prefill: {
          name: "Student Name", // This should come from user context
          email: "student@example.com", // This should come from user context
          contact: "9999999999", // This should come from user context
        },
        notes: {
          paymentType: formData.paymentType,
          description: formData.description,
        },
        theme: {
          color: "#1976d2",
        },
        modal: {
          ondismiss: () => {
            setProcessingPayment(false);
            setError("Payment cancelled by user");
          },
        },
      };

      // Open Razorpay checkout
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error:", error);
      setError(error.response?.data?.message || "Failed to initiate payment");
      setProcessingPayment(false);
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (amount) => {
    if (!amount) return "";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      {/* Razorpay Header */}
      <Paper
        sx={{ p: 2, mb: 3, bgcolor: "#f8f9ff", border: "1px solid #e3e6ff" }}
      >
        <Box display="flex" alignItems="center" gap={2} mb={1}>
          <Security color="primary" />
          <Typography variant="h6" color="primary">
            Payment Gateway by Razorpay
          </Typography>
        </Box>
        <Typography variant="body2" color="textSecondary">
          Accepted Payment Methods: 💳 Cards • 🏦 Net Banking • 📱 UPI • 💰
          Wallets
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {processingPayment && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <CircularProgress size={20} />
            Processing payment with Razorpay... Please do not close this window.
          </Box>
        </Alert>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <FormControl fullWidth required>
            <InputLabel>Payment Type</InputLabel>
            <Select
              name="paymentType"
              value={formData.paymentType}
              label="Payment Type"
              onChange={handleChange}
              disabled={loading || processingPayment}
            >
              {paymentTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12}>
          <TextField
            name="amount"
            label="Amount (₹)"
            type="number"
            value={formData.amount}
            onChange={handleChange}
            fullWidth
            required
            disabled={loading || processingPayment}
            inputProps={{ min: "1", step: "0.01" }}
          />
        </Grid>

        <Grid item xs={12}>
          <TextField
            name="description"
            label="Description (Optional)"
            value={formData.description}
            onChange={handleChange}
            fullWidth
            multiline
            rows={2}
            disabled={loading || processingPayment}
          />
        </Grid>

        {formData.amount && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2, bgcolor: "grey.50" }}>
              <Typography variant="subtitle1" gutterBottom>
                Payment Summary
              </Typography>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Amount:</Typography>
                <Typography>{formatAmount(formData.amount)}</Typography>
              </Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography>Processing Fee:</Typography>
                <Typography>₹0.00</Typography>
              </Box>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between">
                <Typography variant="subtitle1" fontWeight="bold">
                  Total:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold">
                  {formatAmount(formData.amount)}
                </Typography>
              </Box>
            </Paper>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper
            sx={{
              p: 2,
              bgcolor: "success.50",
              border: "1px solid",
              borderColor: "success.200",
            }}
          >
            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <Security color="success" />
              <Typography
                variant="subtitle2"
                color="success.main"
                fontWeight="bold"
              >
                🔒 Your payment is 100% secure with Razorpay
              </Typography>
            </Box>
            <Typography variant="caption" color="textSecondary">
              • 256-bit SSL encryption • PCI DSS Level 1 compliant • Trusted by
              8M+ businesses
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      <Box display="flex" gap={2} justifyContent="flex-end" mt={3}>
        <Button onClick={onCancel} disabled={loading || processingPayment}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={
            loading ||
            processingPayment ||
            !formData.amount ||
            !formData.paymentType
          }
          startIcon={loading ? <CircularProgress size={20} /> : <CreditCard />}
          sx={{
            background: "linear-gradient(45deg, #528ff0 30%, #52a9ff 90%)",
            color: "white",
            fontWeight: "bold",
            fontSize: "1.1rem",
            py: 1.5,
            px: 3,
            "&:hover": {
              background: "linear-gradient(45deg, #3f7ee0 30%, #4298ef 90%)",
            },
          }}
        >
          {loading
            ? "Creating Order..."
            : `Pay ${formatAmount(formData.amount) || "₹0"} via Razorpay`}
        </Button>
      </Box>
    </Box>
  );
};

export default PaymentForm;
