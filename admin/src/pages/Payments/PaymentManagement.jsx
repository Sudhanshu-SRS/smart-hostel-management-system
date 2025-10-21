// admin/src/pages/Payments/PaymentManagement.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  Add,
  Refresh,
  Download,
  AttachMoney,
  Warning,
  CheckCircle,
  Error,
  Pending,
  Undo,
  Analytics,
  Receipt,
} from "@mui/icons-material";
import api from "../../services/api";

const PaymentManagement = () => {
  const [payments, setPayments] = useState([]);
  const [overduePayments, setOverduePayments] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [openManualPayment, setOpenManualPayment] = useState(false);
  const [openRefundDialog, setOpenRefundDialog] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [manualPaymentForm, setManualPaymentForm] = useState({
    userId: "",
    amount: "",
    paymentType: "",
    paymentMethod: "cash",
    description: "",
  });

  const [refundForm, setRefundForm] = useState({
    amount: "",
    reason: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [paymentsRes, overdueRes, analyticsRes] = await Promise.all([
        api.getAllPayments(),
        api.getOverduePayments(),
        api.getPaymentAnalytics(),
      ]);

      setPayments(paymentsRes.data.payments);
      setOverduePayments(overdueRes.data.payments);
      setAnalytics(analyticsRes.data.analytics);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to fetch payment data");
    } finally {
      setLoading(false);
    }
  };

  const handleManualPaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.createManualPayment(manualPaymentForm);
      setSuccess("Manual payment created successfully");
      setOpenManualPayment(false);
      setManualPaymentForm({
        userId: "",
        amount: "",
        paymentType: "",
        paymentMethod: "cash",
        description: "",
      });
      fetchData();
    } catch (error) {
      console.error("Error creating manual payment:", error);
      setError(
        error.response?.data?.message || "Failed to create manual payment"
      );
    }
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "pending":
        return "warning";
      case "failed":
        return "error";
      case "refunded":
        return "info";
      default:
        return "default";
    }
  };

  const paymentTypes = [
    { value: "monthly_rent", label: "Monthly Rent" },
    { value: "security_deposit", label: "Security Deposit" },
    { value: "maintenance", label: "Maintenance Fee" },
    { value: "fine", label: "Fine" },
    { value: "laundry", label: "Laundry" },
    { value: "mess_fee", label: "Mess Fee" },
  ];

  const paymentMethods = [
    { value: "cash", label: "Cash" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "upi", label: "UPI" },
    { value: "razorpay", label: "Razorpay" },
  ];

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Paper
        sx={{
          p: 3,
          background: "linear-gradient(135deg, #1a237e, #3949ab)",
          color: "white",
          mb: 3,
        }}
      >
        <Box display="flex" alignItems="center" gap={3}>
          <PaymentIcon sx={{ fontSize: 80 }} />
          <Box>
            <Typography variant="h4" fontWeight="bold">
              Payment Management
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Razorpay integration & financial oversight
            </Typography>
          </Box>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}

      {/* Analytics Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h5">
                    {formatAmount(analytics.totalRevenue || 0)}
                  </Typography>
                </Box>
                <AttachMoney color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Pending Payments
                  </Typography>
                  <Typography variant="h5">
                    {analytics.pendingPayments || 0}
                  </Typography>
                </Box>
                <Pending color="warning" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Overdue Payments
                  </Typography>
                  <Typography variant="h5">
                    {analytics.overduePayments || 0}
                  </Typography>
                </Box>
                <Warning color="error" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box>
                  <Typography color="textSecondary" gutterBottom>
                    Completed Payments
                  </Typography>
                  <Typography variant="h5">
                    {analytics.completedPayments || 0}
                  </Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Action Buttons */}
      <Box display="flex" gap={2} mb={3}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenManualPayment(true)}
        >
          Manual Payment
        </Button>
        <Button variant="outlined" startIcon={<Refresh />} onClick={fetchData}>
          Refresh
        </Button>
        <Button variant="outlined" startIcon={<Download />}>
          Export
        </Button>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab label="All Payments" />
          <Tab label="Overdue Payments" />
          <Tab label="Analytics" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            All Payments
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Student</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment._id}>
                    <TableCell>{formatDate(payment.createdAt)}</TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="body2" fontWeight="bold">
                          {payment.user?.name || "N/A"}
                        </Typography>
                        <Typography variant="caption" color="textSecondary">
                          {payment.user?.studentId || "N/A"}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.paymentType
                          .replace("_", " ")
                          .toUpperCase()}
                        size="small"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="bold">
                        {formatAmount(payment.finalAmount)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.paymentMethod.toUpperCase()}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={payment.status.toUpperCase()}
                        color={getStatusColor(payment.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box display="flex" gap={1}>
                        <IconButton size="small" title="Download Receipt">
                          <Receipt />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom color="error">
            Overdue Payments ({overduePayments.length})
          </Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Type</TableCell>
                  <TableCell>Due Date</TableCell>
                  <TableCell align="right">Amount</TableCell>
                  <TableCell>Days Overdue</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {overduePayments.map((payment) => {
                  const daysOverdue = Math.floor(
                    (new Date() - new Date(payment.dueDate)) /
                      (1000 * 60 * 60 * 24)
                  );
                  return (
                    <TableRow
                      key={payment._id}
                      sx={{ backgroundColor: "rgba(244, 67, 54, 0.1)" }}
                    >
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {payment.user?.name || "N/A"}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {payment.user?.studentId || "N/A"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={payment.paymentType
                            .replace("_", " ")
                            .toUpperCase()}
                          size="small"
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatDate(payment.dueDate)}</TableCell>
                      <TableCell align="right">
                        <Typography
                          variant="body2"
                          fontWeight="bold"
                          color="error"
                        >
                          {formatAmount(payment.finalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${daysOverdue} days`}
                          color="error"
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" variant="outlined" color="primary">
                          Send Reminder
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Payment Analytics
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Revenue Breakdown
                  </Typography>
                  {analytics.paymentsByType?.map((type) => (
                    <Box
                      key={type._id}
                      display="flex"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Typography>
                        {type._id.replace("_", " ").toUpperCase()}
                      </Typography>
                      <Typography fontWeight="bold">
                        {formatAmount(type.total)}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Monthly Revenue
                  </Typography>
                  {analytics.monthlyRevenue?.slice(-6).map((month) => (
                    <Box
                      key={`${month._id.year}-${month._id.month}`}
                      display="flex"
                      justifyContent="space-between"
                      mb={1}
                    >
                      <Typography>{`${month._id.month}/${month._id.year}`}</Typography>
                      <Typography fontWeight="bold">
                        {formatAmount(month.revenue)}
                      </Typography>
                    </Box>
                  ))}
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Manual Payment Dialog */}
      <Dialog
        open={openManualPayment}
        onClose={() => setOpenManualPayment(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create Manual Payment</DialogTitle>
        <DialogContent>
          <Box
            component="form"
            onSubmit={handleManualPaymentSubmit}
            sx={{ mt: 1 }}
          >
            <TextField
              fullWidth
              label="User ID"
              value={manualPaymentForm.userId}
              onChange={(e) =>
                setManualPaymentForm({
                  ...manualPaymentForm,
                  userId: e.target.value,
                })
              }
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={manualPaymentForm.amount}
              onChange={(e) =>
                setManualPaymentForm({
                  ...manualPaymentForm,
                  amount: e.target.value,
                })
              }
              margin="normal"
              required
            />
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Payment Type</InputLabel>
              <Select
                value={manualPaymentForm.paymentType}
                label="Payment Type"
                onChange={(e) =>
                  setManualPaymentForm({
                    ...manualPaymentForm,
                    paymentType: e.target.value,
                  })
                }
              >
                {paymentTypes.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" required>
              <InputLabel>Payment Method</InputLabel>
              <Select
                value={manualPaymentForm.paymentMethod}
                label="Payment Method"
                onChange={(e) =>
                  setManualPaymentForm({
                    ...manualPaymentForm,
                    paymentMethod: e.target.value,
                  })
                }
              >
                {paymentMethods.map((method) => (
                  <MenuItem key={method.value} value={method.value}>
                    {method.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="Description"
              value={manualPaymentForm.description}
              onChange={(e) =>
                setManualPaymentForm({
                  ...manualPaymentForm,
                  description: e.target.value,
                })
              }
              margin="normal"
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenManualPayment(false)}>Cancel</Button>
          <Button onClick={handleManualPaymentSubmit} variant="contained">
            Create Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentManagement;
