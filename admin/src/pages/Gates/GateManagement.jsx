// admin/src/pages/Gates/GateManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Fab,
  Menu
} from '@mui/material';
import {
  QrCode,
  Add,
  Download,
  MoreVert,
  Security,
  LocationOn,
  Person,
  Visibility,
  Edit,
  Delete,
  Print
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const GateManagement = () => {
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState(null);
  const [formData, setFormData] = useState({
    gateId: '',
    gateName: '',
    location: '',
    assignedGuard: '',
    coordinates: { latitude: '', longitude: '' },
    allowedTimings: { start: '06:00', end: '22:00' }
  });
  const [guards, setGuards] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuGateId, setMenuGateId] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchGates();
    fetchGuards();
  }, []);

  const fetchGates = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllGates();
      setGates(response.data.gates || []);
    } catch (error) {
      console.error('Fetch gates error:', error);
      toast.error('Failed to load gates');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuards = async () => {
    try {
      const response = await adminAPI.getAllUsers({ role: 'warden' });
      setGuards(response.data.users || []);
    } catch (error) {
      console.error('Fetch guards error:', error);
    }
  };

  const handleCreateGate = async () => {
    try {
      const response = await adminAPI.createGate(formData);
      if (response.data.success) {
        toast.success('Gate created successfully with QR code!');
        fetchGates();
        setDialogOpen(false);
        resetForm();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create gate');
    }
  };

  const handleDownloadQR = async (gateId, format = 'png') => {
    try {// admin/src/pages/Gates/GateManagement.jsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  Fab,
  Menu
} from '@mui/material';
import {
  QrCode,
  Add,
  Download,
  MoreVert,
  Security,
  LocationOn,
  Person,
  Visibility,
  Edit,
  Delete,
  Print
} from '@mui/icons-material';
import { adminAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const GateManagement = () => {
  const [gates, setGates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedGate, setSelectedGate] = useState(null);
  const [formData, setFormData] = useState({
    gateId: '',
    gateName: '',
    location: '',
    assignedGuard: '',
    coordinates: { latitude: '', longitude: '' },
    allowedTimings: { start: '06:00', end: '22:00' }
  });
  const [guards, setGuards] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuGateId, setMenuGateId] = useState(null);

  const { user } = useAuth();

  useEffect(() => {
    fetchGates();
    fetchGuards();
  }, []);

  const fetchGates = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAllGates();
      setGates(response.data.gates || []);
    } catch (error) {
      console.error('Fetch gates error:', error);
      toast.error('Failed to load gates');
    } finally {
      setLoading(false);
    }
  };

  const fetchGuards = async () => {
    try {
      const response = await adminAPI.getAllUsers({ role: 'warden' });
      setGuards(response.data.users || []);
    } catch (error) {
      console.error('Fetch guards error:', error);
    }
  };

  const handleCreateGate = async () => {
    try {
      const response = await adminAPI.createGate(formData);
      if (response.data.success) {
        toast.success('Gate created successfully with QR code!');
        fetchGates();
        setDialogOpen(false);
        resetForm();
      }
    }catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create gate');
    }
  };

    const handleDownloadQR = async (gateId, format = 'png') => {
    try {
      const response = await adminAPI.downloadGateQR(gateId, format);
      
      // Create blob and download
      const blob = new Blob([response.data], { type: `image/${format}` });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Gate_${gateId}_QR.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('QR Code downloaded successfully!');
    } catch (error) {
      toast.error('Failed to download QR code');
    }
  };

  const resetForm = () => {
    setFormData({
      gateId: '',
      gateName: '',
      location: '',
      assignedGuard: '',
      coordinates: { latitude: '', longitude: '' },
      allowedTimings: { start: '06:00', end: '22:00' }
    });
    setSelectedGate(null);
  };

  const handleMenuClick = (event, gateId) => {
    setAnchorEl(event.currentTarget);
    setMenuGateId(gateId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuGateId(null);
  };

  return (
    <Box>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #1976d2, #42a5f5)', color: 'white' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Gate Management System
            </Typography>
            <Typography variant="h6" sx={{ opacity: 0.9 }}>
              Manage hostel gates and QR codes for entry/exit tracking
            </Typography>
          </Box>
          <Security sx={{ fontSize: 80, opacity: 0.7 }} />
        </Box>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} mb={3}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="primary">
                    {gates.length}
                  </Typography>
                  <Typography variant="h6">Total Gates</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  <Security />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="success.main">
                    {gates.filter(g => g.isActive).length}
                  </Typography>
                  <Typography variant="h6">Active Gates</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'success.main' }}>
                  <QrCode />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="between">
                <Box>
                  <Typography variant="h4" fontWeight="bold" color="warning.main">
                    {gates.filter(g => g.assignedGuard).length}
                  </Typography>
                  <Typography variant="h6">Assigned Guards</Typography>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.main' }}>
                  <Person />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Gates Table */}
      <Paper sx={{ p: 3 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
          <Typography variant="h6">All Gates</Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setDialogOpen(true)}
            sx={{ background: 'linear-gradient(135deg, #1976d2, #42a5f5)' }}
          >
            Add New Gate
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Gate Info</TableCell>
                <TableCell>QR Code</TableCell>
                <TableCell>Assigned Guard</TableCell>
                <TableCell>Timings</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gates.map((gate) => (
                <TableRow key={gate._id}>
                  <TableCell>
                    <Box>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {gate.gateName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        ID: {gate.gateId}
                      </Typography>
                      <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                        <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="caption" color="text.secondary">
                          {gate.location}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Avatar 
                        src={gate.qrCode?.imageUrl} 
                        sx={{ width: 40, height: 40 }}
                        variant="square"
                      />
                      <Button
                        size="small"
                        startIcon={<Download />}
                        onClick={() => handleDownloadQR(gate.gateId)}
                      >
                        Download
                      </Button>
                    </Box>
                  </TableCell>
                  <TableCell>
                    {gate.assignedGuard ? (
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 32, height: 32 }}>
                          {gate.assignedGuard.name[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2">
                            {gate.assignedGuard.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {gate.assignedGuard.email}
                          </Typography>
                        </Box>
                      </Box>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Not assigned
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {gate.allowedTimings?.start} - {gate.allowedTimings?.end}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={gate.isActive ? 'Active' : 'Inactive'}
                      color={gate.isActive ? 'success' : 'error'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton
                      onClick={(e) => handleMenuClick(e, gate.gateId)}
                      size="small"
                    >
                      <MoreVert />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Action Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => handleDownloadQR(menuGateId, 'png')}>
          <Download sx={{ mr: 1 }} /> Download PNG
        </MenuItem>
        <MenuItem onClick={() => handleDownloadQR(menuGateId, 'svg')}>
          <Download sx={{ mr: 1 }} /> Download SVG
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Edit sx={{ mr: 1 }} /> Edit Gate
        </MenuItem>
        <MenuItem onClick={handleMenuClose}>
          <Visibility sx={{ mr: 1 }} /> View Logs
        </MenuItem>
      </Menu>

      {/* Create Gate Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New Gate</DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Gate ID"
                value={formData.gateId}
                onChange={(e) => setFormData({ ...formData, gateId: e.target.value })}
                placeholder="e.g., GATE001"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Gate Name"
                value={formData.gateName}
                onChange={(e) => setFormData({ ...formData, gateName: e.target.value })}
                placeholder="e.g., Main Gate"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., Main Building Entrance"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                select
                label="Assigned Guard"
                value={formData.assignedGuard}
                onChange={(e) => setFormData({ ...formData, assignedGuard: e.target.value })}
              >
                {guards.map((guard) => (
                  <MenuItem key={guard._id} value={guard._id}>
                    {guard.name} - {guard.email}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Start Time"
                type="time"
                value={formData.allowedTimings.start}
                onChange={(e) => setFormData({
                  ...formData,
                  allowedTimings: { ...formData.allowedTimings, start: e.target.value }
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="End Time"
                type="time"
                value={formData.allowedTimings.end}
                onChange={(e) => setFormData({
                  ...formData,
                  allowedTimings: { ...formData.allowedTimings, end: e.target.value }
                })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Latitude (Optional)"
                type="number"
                value={formData.coordinates.latitude}
                onChange={(e) => setFormData({
                  ...formData,
                  coordinates: { ...formData.coordinates, latitude: e.target.value }
                })}
                placeholder="e.g., 28.6139"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Longitude (Optional)"
                type="number"
                value={formData.coordinates.longitude}
                onChange={(e) => setFormData({
                  ...formData,
                  coordinates: { ...formData.coordinates, longitude: e.target.value }
                })}
                placeholder="e.g., 77.2090"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateGate}
            variant="contained"
            disabled={!formData.gateId || !formData.gateName || !formData.location}
          >
            Create Gate & Generate QR
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GateManagement;