// frontend/src/pages/payments/PaymentDashboard.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  Chip,
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Alert,
  CircularProgress,
  Divider,
  IconButton,
} from "@mui/material";
import {
  Payment as PaymentIcon,
  AccountBalance,
  History,
  Receipt,
  Download,
  Refresh,
  Warning,
  CheckCircle,
  Error,
  Pending,
  Security,
} from "@mui/icons-material";
import { paymentsAPI } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import PaymentForm from "../../components/payments/PaymentForm";
import PaymentHistory from "../../components/payments/PaymentHistory";

const PaymentDashboard = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [filter]);

  const fetchPayments = async () => {
    try {
      setRefreshing(true);
      const params = filter !== "all" ? { status: filter } : {};
      const response = await paymentsAPI.getPayments(params);
      setPayments(response.data.payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Failed to fetch payments");
    } finally {
      setRefreshing(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Use different endpoints based on user role
      const response =
        user?.role === "student"
          ? await paymentsAPI.getMyPaymentStats()
          : await paymentsAPI.getPaymentStats();
      setStats(response.data.stats);
    } catch (error) {
      console.error("Error fetching payment stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setOpenPaymentDialog(false);
    fetchPayments();
    fetchStats();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle color="success" />;
      case "pending":
        return <Pending color="warning" />;
      case "failed":
        return <Error color="error" />;
      default:
        return <PaymentIcon />;
    }
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
    });
  };

  const isOverdue = (dueDate, status) => {
    return status === "pending" && new Date(dueDate) < new Date();
  };

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
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" gutterBottom>
          Payment Dashboard
        </Typography>
        <Box display="flex" gap={1}>
          <IconButton onClick={fetchPayments} disabled={refreshing}>
            <Refresh />
          </IconButton>
          <Button
            variant="contained"
            size="large"
            startIcon={<PaymentIcon />}
            onClick={() => setOpenPaymentDialog(true)}
            sx={{
              background: "linear-gradient(45deg, #528ff0 30%, #52a9ff 90%)",
              color: "white",
              fontWeight: "bold",
              "&:hover": {
                background: "linear-gradient(45deg, #3f7ee0 30%, #4298ef 90%)",
              },
            }}
          >
            Pay with Razorpay
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Razorpay Info Card */}
      <Card sx={{ mb: 3, border: "2px solid #528ff0", borderRadius: 2 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2}>
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                background: "linear-gradient(45deg, #528ff0 30%, #52a9ff 90%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Security sx={{ color: "white", fontSize: 30 }} />
            </Box>
            <Box flexGrow={1}>
              <Typography variant="h6" color="primary" gutterBottom>
                🔒 Secure Payments with Razorpay
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Pay your hostel fees securely using UPI, Net Banking,
                Credit/Debit Cards, and Wallets. All transactions are encrypted
                and PCI DSS compliant.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => setOpenPaymentDialog(true)}
              sx={{ minWidth: 120 }}
            >
              Pay Now
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Statistics Cards */}
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
                    Total Paid
                  </Typography>
                  <Typography variant="h5">
                    {formatAmount(stats.totalPaid || 0)}
                  </Typography>
                </Box>
                <CheckCircle color="success" sx={{ fontSize: 40 }} />
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
                    Pending Amount
                  </Typography>
                  <Typography variant="h5">
                    {formatAmount(stats.totalPending || 0)}
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
                    Overdue
                  </Typography>
                  <Typography variant="h5">
                    {stats.overdueCount || 0}
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
                    Total Payments
                  </Typography>
                  <Typography variant="h5">
                    {stats.totalPayments || 0}
                  </Typography>
                </Box>
                <Receipt sx={{ fontSize: 40 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Filter and Payment Table */}
      <Paper sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Payment History</Typography>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={filter}
              label="Status"
              onChange={(e) => setFilter(e.target.value)}
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="completed">Completed</MenuItem>
              <MenuItem value="failed">Failed</MenuItem>
              <MenuItem value="refunded">Refunded</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {payments.map((payment) => (
                <TableRow
                  key={payment._id}
                  sx={{
                    backgroundColor: isOverdue(payment.dueDate, payment.status)
                      ? "rgba(244, 67, 54, 0.1)"
                      : "inherit",
                  }}
                >
                  <TableCell>{formatDate(payment.createdAt)}</TableCell>
                  <TableCell>
                    <Chip
                      label={payment.paymentType
                        .replace("_", " ")
                        .toUpperCase()}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{payment.description}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatAmount(payment.finalAmount)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {formatDate(payment.dueDate)}
                      {isOverdue(payment.dueDate, payment.status) && (
                        <Warning color="error" fontSize="small" />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {getStatusIcon(payment.status)}
                      <Chip
                        label={payment.status.toUpperCase()}
                        color={getStatusColor(payment.status)}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" title="Download Receipt">
                      <Download />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {payments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary">
                      No payments found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Payment Dialog */}
      <Dialog
        open={openPaymentDialog}
        onClose={() => setOpenPaymentDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <PaymentIcon />
            <Typography variant="h6">Make Payment with Razorpay</Typography>
          </Box>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Secure payments powered by Razorpay - India's most trusted payment
            gateway
          </Typography>
        </DialogTitle>
        <DialogContent>
          <PaymentForm
            onSuccess={handlePaymentSuccess}
            onCancel={() => setOpenPaymentDialog(false)}
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default PaymentDashboard;
