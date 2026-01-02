# 🌱 Database Seed Data Summary

## Overview

The hostel management system has been populated with comprehensive seed data to demonstrate all features and functionalities. The data includes sample rooms, staff, students, complaints, payments, and entry-exit records.

## Seeding Scripts Created

### 1. **seedStaff.js** ✅

**Status:** Already existed, contains 6 staff members

**Staff Members Seeded:**

- ✅ Electrician (Phone: 9876543210, Password: Staff@123)
- ✅ Plumber (Phone: 9876543211, Password: Staff@123)
- ✅ Maintenance (Phone: 9876543212, Password: Staff@123)
- ✅ Cleaning (Phone: 9876543213, Password: Staff@123)
- ✅ Security (Phone: 9876543214, Password: Staff@123)
- ✅ WiFi Technician (Phone: 9876543215, Password: Staff@123)

**Run Command:**

```bash
npm run seed:staff
```

---

### 2. **seedData.js** ✅ (NEW)

**Status:** Created and tested successfully

**Data Included:**

#### Rooms (9 Total)

- **Building A - Ground Floor:**

  - A-101: Double room, 5000/month, AC, WiFi, Study Table
  - A-102: Triple room, 6000/month, AC, WiFi, Fan, Balcony
  - A-103: Double room, 5500/month, AC, Attached Bathroom

- **Building A - First Floor:**

  - A-201: Quad room, 7000/month, Premium amenities
  - A-202: Double room, 5200/month, AC, WiFi

- **Building B - Ground Floor:**

  - B-101: Triple room, 4500/month, WiFi, Fan
  - B-102: Double room, 4800/month, AC

- **Building B - First Floor:**
  - B-201: Double room, 5300/month, AC, Balcony
  - B-202: Triple room, 6200/month, Premium amenities

#### Gates (3 Total)

- ✅ Main Gate (Main Entrance)
- ✅ Back Gate (Rear Entrance)
- ✅ Side Gate (Side Entrance)

Each gate has:

- QR code data
- Warden assignment
- Working hours (6:00 AM - 10:00 PM)
- Active status

#### Sample Students (5 Total)

- SHMS001: Rahul Kumar (Delhi)
- SHMS002: Priya Singh (Mumbai)
- SHMS003: Amit Patel (Bangalore)
- SHMS004: Neha Gupta (Hyderabad)
- SHMS005: Arun Sharma (Pune)

**All students password:** Student@123

**Run Command:**

```bash
npm run seed:data
```

---

### 3. **seedAdditionalData.js** ✅ (NEW)

**Status:** Created and tested successfully

**Data Included:**

#### Complaints (4 Total)

1. **AC Not Working** (Rahul Kumar)

   - Category: Electrical
   - Priority: High
   - Status: Open
   - Comments: Staff member assigned to check

2. **Poor Food Quality** (Priya Singh)

   - Category: Cleaning
   - Priority: Medium
   - Status: In Progress
   - Assigned to staff member

3. **Water Leakage** (Amit Patel)

   - Category: Plumbing
   - Priority: High
   - Status: Open

4. **Excessive Noise** (Rahul Kumar)
   - Category: Noise
   - Priority: Low
   - Status: Resolved
   - Resolution comment from staff

#### Payments (5 Total)

1. **Rahul Kumar** - 5000 (Completed, Nov 1, 2024)
2. **Priya Singh** - 6000 (Pending, Due Nov 10, 2024)
3. **Amit Patel** - 4500 (Completed, Discount: 500)
4. **Neha Gupta** - 5200 (Completed with Late Fee: 200)
5. **Arun Sharma** - 5300 (Completed, Nov 3, 2024)

**Payment Stats:**

- Completed: 4
- Pending: 1
- Discounts Applied: Yes
- Late Fees Applied: Yes

#### Entry-Exit Records (6 Total)

1. **Rahul Kumar** - Entry on Nov 19, 8:00 AM
2. **Priya Singh** - Exit on Nov 19 (Library, Return: 7:00 PM)
3. **Amit Patel** - Entry on Nov 19, 7:00 AM
4. **Neha Gupta** - Exit on Nov 19 (Weekend outing, Return: Nov 21)
5. **Arun Sharma** - Entry on Nov 18, 8:00 AM
6. **Rahul Kumar** - Exit on Nov 18 (Hospital, Return: 5:00 PM)

**Status:** All approved

**Run Command:**

```bash
npm run seed:additional
```

---

## Complete Seeding

To seed all data at once:

```bash
npm run seed:all
```

This will run:

1. ✅ seed:staff
2. ✅ seed:data
3. ✅ seed:additional

---

## Database Summary

### Total Collections with Data:

- **Users:** 6 staff + 5 students = 11 total
- **Rooms:** 9 rooms with 23 total beds
- **Gates:** 3 gates with QR codes
- **Complaints:** 4 complaints (Open, In-Progress, Resolved)
- **Payments:** 5 payments (4 completed, 1 pending)
- **Entry-Exit Logs:** 6 records demonstrating various scenarios

### Key Features Demonstrated:

✅ Room availability management
✅ Multi-building structure with floor-wise organization
✅ Staff assignment and specialization
✅ Student ID auto-generation (SHMS001, SHMS002, etc.)
✅ Complaint tracking with status workflow
✅ Payment processing with late fees and discounts
✅ Entry-Exit management with outing reasons
✅ QR code gate management
✅ Warden assignment and approval workflow

---

## Test Login Credentials

### Admin (Hardcoded for Testing)

- Email: admin@hostel.com
- Password: Any value (hardcoded in backend)

### Staff Members

- Email: Any staff email
- Password: Staff@123

### Sample Students

- Email: Any student email (e.g., rahul.kumar@student.com)
- Password: Student@123

---

## Features Now Working

With the seeded data, the following features can be tested:

1. **Dashboard Analytics**

   - Total rooms, students, occupancy rate
   - Pending payments
   - Complaint statistics

2. **Room Management**

   - View available rooms
   - Room details with amenities
   - Bed allocation

3. **Complaint Management**

   - Create, view, update complaints
   - Assign to staff
   - Add comments and track progress

4. **Payment System**

   - View payment history
   - Pay pending dues
   - See late fees and discounts applied

5. **Entry-Exit Management**

   - Track student entry/exit
   - Manage outing approvals
   - Generate reports

6. **Staff Management**
   - View assigned staff members
   - Assign to complaints/tasks

---

## Notes

- All timestamps are set to realistic dates (October-November 2024)
- Passwords are hashed using bcryptjs
- Security deposits are set at 2x monthly rent
- Student IDs follow SHMS### format and are auto-generated
- All relationships between collections are properly maintained
- Data is idempotent - running seeds multiple times won't create duplicates

---

**Seed Date:** November 19, 2024
**Database:** MongoDB Atlas (SHMS)
**Status:** ✅ All data seeded successfully
