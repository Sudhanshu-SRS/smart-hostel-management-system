// frontend/src/components/payments/PaymentHistory.jsx
import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Pagination,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Download,
  Receipt,
  FilterList,
  Search,
  CheckCircle,
  Pending,
  Error,
  Warning,
  Visibility,
} from "@mui/icons-material";
import { paymentsAPI } from "../../services/api";

const PaymentHistory = ({ userId, compact = false }) => {
  const [payments, setPayments] = useState([]);
  const [filteredPayments, setFilteredPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);

  // Filter states
  const [filters, setFilters] = useState({
    status: "all",
    paymentType: "all",
    dateRange: "all",
    searchTerm: "",
  });

  useEffect(() => {
    fetchPayments();
  }, [userId]);

  useEffect(() => {
    applyFilters();
  }, [payments, filters]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = userId ? { user: userId } : {};
      const response = await paymentsAPI.getPayments(params);
      setPayments(response.data.payments);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setError("Failed to fetch payment history");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Status filter
    if (filters.status !== "all") {
      filtered = filtered.filter(
        (payment) => payment.status === filters.status
      );
    }

    // Payment type filter
    if (filters.paymentType !== "all") {
      filtered = filtered.filter(
        (payment) => payment.paymentType === filters.paymentType
      );
    }

    // Date range filter
    if (filters.dateRange !== "all") {
      const now = new Date();
      let startDate;

      switch (filters.dateRange) {
        case "week":
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "month":
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "quarter":
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = null;
      }

      if (startDate) {
        filtered = filtered.filter(
          (payment) => new Date(payment.createdAt) >= startDate
        );
      }
    }

    // Search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (payment) =>
          payment.description?.toLowerCase().includes(searchLower) ||
          payment.transactionId?.toLowerCase().includes(searchLower) ||
          payment.paymentType.toLowerCase().includes(searchLower)
      );
    }

    setFilteredPayments(filtered);
    setPage(1); // Reset to first page when filters change
  };

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle color="success" />;
      case "pending":
        return <Pending color="warning" />;
      case "failed":
        return <Error color="error" />;
      case "refunded":
        return <Warning color="info" />;
      default:
        return <Pending />;
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
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = (dueDate, status) => {
    return status === "pending" && new Date(dueDate) < new Date();
  };

  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
    setOpenDetailsDialog(true);
  };

  const handleDownloadReceipt = (payment) => {
    // Implement receipt download logic
    console.log("Download receipt for payment:", payment._id);
  };

  // Pagination
  const paginatedPayments = filteredPayments.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const totalPages = Math.ceil(filteredPayments.length / rowsPerPage);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="200px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {!compact && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Filter Payments
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={filters.status}
                  label="Status"
                  onChange={(e) => handleFilterChange("status", e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="failed">Failed</MenuItem>
                  <MenuItem value="refunded">Refunded</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Payment Type</InputLabel>
                <Select
                  value={filters.paymentType}
                  label="Payment Type"
                  onChange={(e) =>
                    handleFilterChange("paymentType", e.target.value)
                  }
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="monthly_rent">Monthly Rent</MenuItem>
                  <MenuItem value="security_deposit">Security Deposit</MenuItem>
                  <MenuItem value="maintenance">Maintenance</MenuItem>
                  <MenuItem value="fine">Fine</MenuItem>
                  <MenuItem value="laundry">Laundry</MenuItem>
                  <MenuItem value="mess_fee">Mess Fee</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Date Range</InputLabel>
                <Select
                  value={filters.dateRange}
                  label="Date Range"
                  onChange={(e) =>
                    handleFilterChange("dateRange", e.target.value)
                  }
                >
                  <MenuItem value="all">All Time</MenuItem>
                  <MenuItem value="week">Last Week</MenuItem>
                  <MenuItem value="month">Last Month</MenuItem>
                  <MenuItem value="quarter">Last Quarter</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                placeholder="Transaction ID, description..."
                value={filters.searchTerm}
                onChange={(e) =>
                  handleFilterChange("searchTerm", e.target.value)
                }
                InputProps={{
                  endAdornment: <Search />,
                }}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      <Paper sx={{ p: 3 }}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">
            Payment History ({filteredPayments.length})
          </Typography>
          {!compact && (
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => console.log("Export payments")}
            >
              Export
            </Button>
          )}
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
              {paginatedPayments.map((payment) => (
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
                  <TableCell>
                    <Typography variant="body2">
                      {payment.description}
                    </Typography>
                    {payment.transactionId && (
                      <Typography variant="caption" color="textSecondary">
                        ID: {payment.transactionId}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight="bold">
                      {formatAmount(payment.finalAmount)}
                    </Typography>
                    {payment.lateFee > 0 && (
                      <Typography variant="caption" color="error">
                        Late Fee: {formatAmount(payment.lateFee)}
                      </Typography>
                    )}
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
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleViewDetails(payment)}
                        title="View Details"
                      >
                        <Visibility />
                      </IconButton>
                      {payment.status === "completed" && (
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadReceipt(payment)}
                          title="Download Receipt"
                        >
                          <Receipt />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
              {paginatedPayments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography color="textSecondary" sx={{ py: 3 }}>
                      No payments found
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {!compact && totalPages > 1 && (
          <Box display="flex" justifyContent="center" mt={3}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(event, newPage) => setPage(newPage)}
              color="primary"
            />
          </Box>
        )}
      </Paper>

      {/* Payment Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Payment Details</DialogTitle>
        <DialogContent>
          {selectedPayment && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Payment Information
                    </Typography>
                    <Typography variant="body2">
                      <strong>Transaction ID:</strong>{" "}
                      {selectedPayment.transactionId || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Amount:</strong>{" "}
                      {formatAmount(selectedPayment.amount)}
                    </Typography>
                    {selectedPayment.lateFee > 0 && (
                      <Typography variant="body2" color="error">
                        <strong>Late Fee:</strong>{" "}
                        {formatAmount(selectedPayment.lateFee)}
                      </Typography>
                    )}
                    {selectedPayment.discount > 0 && (
                      <Typography variant="body2" color="success.main">
                        <strong>Discount:</strong> -
                        {formatAmount(selectedPayment.discount)}
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Final Amount:</strong>{" "}
                      {formatAmount(selectedPayment.finalAmount)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Payment Method:</strong>{" "}
                      {selectedPayment.paymentMethod.toUpperCase()}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Status:</strong>{" "}
                      <Chip
                        label={selectedPayment.status.toUpperCase()}
                        color={getStatusColor(selectedPayment.status)}
                        size="small"
                      />
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Timeline
                    </Typography>
                    <Typography variant="body2">
                      <strong>Created:</strong>{" "}
                      {formatDate(selectedPayment.createdAt)}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Due Date:</strong>{" "}
                      {formatDate(selectedPayment.dueDate)}
                    </Typography>
                    {selectedPayment.paidDate && (
                      <Typography variant="body2">
                        <strong>Paid Date:</strong>{" "}
                        {formatDate(selectedPayment.paidDate)}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Description
                    </Typography>
                    <Typography variant="body2">
                      {selectedPayment.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>Close</Button>
          {selectedPayment?.status === "completed" && (
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => handleDownloadReceipt(selectedPayment)}
            >
              Download Receipt
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PaymentHistory;
