// filepath: models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    unique: true,
    uppercase: true,
    trim: true
  },
  floor: {
    type: Number,
    required: [true, 'Floor is required'],
    min: [0, 'Floor cannot be negative']
  },
  building: {
    type: String,
    required: [true, 'Building is required'],
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [4, 'Capacity cannot exceed 4']
  },
  occupants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  amenities: [{
    type: String,
    enum: ['WiFi', 'AC', 'Fan', 'Study Table', 'Wardrobe', 'Attached Bathroom', 'Balcony', 'Window']
  }],
  monthlyRent: {
    type: Number,
    required: [true, 'Monthly rent is required'],
    min: [0, 'Rent cannot be negative']
  },
  securityDeposit: {
    type: Number,
    required: [true, 'Security deposit is required'],
    min: [0, 'Security deposit cannot be negative']
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'maintenance', 'reserved'],
    default: 'available'
  },
  roomType: {
    type: String,
    enum: ['single', 'double', 'triple', 'quad'],
    required: [true, 'Room type is required']
  },
  images: [{
    public_id: String,
    url: String
  }],
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  maintenanceHistory: [{
    issue: String,
    resolvedDate: Date,
    cost: Number,
    description: String
  }]
}, {
  timestamps: true
});

// Virtual for available beds
roomSchema.virtual('availableBeds').get(function() {
  return this.capacity - this.occupants.length;
});

// Virtual for occupancy rate
roomSchema.virtual('occupancyRate').get(function() {
  return (this.occupants.length / this.capacity) * 100;
});

// Index for better query performance
roomSchema.index({ roomNumber: 1 });
roomSchema.index({ floor: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ building: 1 });

// Update status based on occupancy
roomSchema.pre('save', function(next) {
  if (this.occupants.length === this.capacity && this.status === 'available') {
    this.status = 'occupied';
  } else if (this.occupants.length < this.capacity && this.status === 'occupied') {
    this.status = 'available';
  }
  next();
});

module.exports = mongoose.model('Room', roomSchema);