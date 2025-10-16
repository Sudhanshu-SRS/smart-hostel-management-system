# 🏗️ Smart Hostel Management System - System Architecture

## 📋 Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Component Architecture](#component-architecture)
4. [Technology Stack](#technology-stack)
5. [Database Schema](#database-schema)
6. [API Architecture](#api-architecture)
7. [Security Architecture](#security-architecture)
8. [Deployment Architecture](#deployment-architecture)

## 📊 LIST OF FIGURES

| Figure No. | Title                                                 | Page No. |
| ---------- | ----------------------------------------------------- | -------- |
| Figure 3.1 | System Architecture of Smart Hostel Management System | 4        |
| Figure 3.2 | Workflow Diagram of SHMS                              | 4        |
| Figure 3.3 | Entity Relationship (ER) Diagram of the Database      | 5        |
| Figure 3.4 | Use Case Diagram Representing User Roles              | 5        |
| Figure 4.1 | Login Interface for Student, Warden, and Admin        | 6        |
| Figure 4.2 | Student Dashboard Interface                           | 6        |
| Figure 4.3 | Room Booking and Allocation Module                    | 7        |
| Figure 4.4 | Complaint Management Interface                        | 7        |
| Figure 4.5 | Razorpay Payment Gateway Integration                  | 7        |
| Figure 4.6 | Admin Analytics Dashboard                             | 8        |
| Figure 4.7 | Visitor Entry and Verification Page                   | 8        |
| Figure 5.1 | System Performance Graph                              | 9        |
| Figure 5.2 | User Feedback Analysis Chart                          | 9        |
| Figure 6.1 | Future AI-Driven Smart Allotment Concept Diagram      | 10       |

## 📋 LIST OF TABLES

| Table No. | Title                                                   | Page No. |
| --------- | ------------------------------------------------------- | -------- |
| Table 3.1 | Tools, Technologies, and Frameworks Used                | 4        |
| Table 3.2 | Database Collections and Their Attributes               | 5        |
| Table 4.1 | Module-Wise Implementation Summary                      | 6        |
| Table 4.2 | API Endpoints and Functional Descriptions               | 7        |
| Table 4.3 | Test Cases and Expected Results                         | 8        |
| Table 5.1 | Quantitative System Performance Metrics                 | 9        |
| Table 5.2 | User Satisfaction and Feedback Summary                  | 9        |
| Table 6.1 | Comparison Between Traditional and Smart Hostel Systems | 10       |

---

## 🔍 System Overview

The Smart Hostel Management System (SHMS) is a comprehensive multi-tier web application designed to automate and streamline hostel operations. The system follows a microservices-oriented architecture with separate frontend applications for students and administrators, a unified backend API, and specialized services for enhanced functionality.

### Key Characteristics:

- **Multi-tenant Architecture**: Supports students, wardens, and administrators
- **Real-time Communication**: WebSocket integration for live updates
- **Modular Design**: Separation of concerns with dedicated services
- **Scalable Infrastructure**: Cloud-ready with external service integrations

---

## 📊 Architecture Diagrams

### 1. High-Level System Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[Student Frontend<br/>React + Vite]
        B[Admin Panel<br/>React + Vite]
        C[Mobile Apps<br/>Future]
    end

    subgraph "Gateway Layer"
        D[Load Balancer<br/>Nginx/CloudFlare]
    end

    subgraph "Application Layer"
        E[Main Backend API<br/>Node.js + Express]
        F[Python Vision Service<br/>Flask + OpenCV]
        G[Email Service<br/>Nodemailer]
        H[Notification Service<br/>Socket.io]
    end

    subgraph "Data Layer"
        I[MongoDB Atlas<br/>Primary Database]
        J[Cloudinary<br/>Media Storage]
        K[Redis Cache<br/>Session Management]
    end

    subgraph "External Services"
        L[Razorpay<br/>Payment Gateway]
        M[SMTP Server<br/>Email Provider]
        N[QR Code Service<br/>Internal]
    end

    A --> D
    B --> D
    C --> D
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
    E --> K
    E --> L
    G --> M
    F --> I
    H --> A
    H --> B
```

### 2. Component Interaction Diagram

```mermaid
graph LR
    subgraph "Frontend Applications"
        A1[Student Portal<br/>- Registration<br/>- Room Booking<br/>- Payments<br/>- Complaints]
        A2[Admin Panel<br/>- User Management<br/>- Analytics<br/>- System Config<br/>- Reports]
    end

    subgraph "Core Backend Services"
        B1[Authentication Service<br/>- JWT Tokens<br/>- Role Management<br/>- Session Handling]
        B2[User Management<br/>- Student Profiles<br/>- Admin Accounts<br/>- Warden Management]
        B3[Room Management<br/>- Allocation Logic<br/>- Availability Tracking<br/>- Booking System]
        B4[Payment Service<br/>- Razorpay Integration<br/>- Transaction History<br/>- Fee Management]
        B5[Complaint System<br/>- Ticket Management<br/>- Status Tracking<br/>- Assignment Logic]
        B6[Visitor Management<br/>- Registration<br/>- Approval Workflow<br/>- Entry/Exit Tracking]
    end

    subgraph "Specialized Services"
        C1[Face Recognition<br/>Python + OpenCV]
        C2[QR Code Service<br/>Generation & Scanning]
        C3[Email Notifications<br/>Welcome & Updates]
        C4[Real-time Updates<br/>Socket.io Server]
    end

    A1 --> B1
    A1 --> B2
    A1 --> B3
    A1 --> B4
    A1 --> B5
    A1 --> B6

    A2 --> B1
    A2 --> B2
    A2 --> B3
    A2 --> B4
    A2 --> B5
    A2 --> B6

    B2 --> C1
    B6 --> C1
    B6 --> C2
    B1 --> C3
    B5 --> C3
    B1 --> C4
    B5 --> C4
```

### 3. Data Flow Architecture

```mermaid
sequenceDiagram
    participant S as Student Frontend
    participant A as Admin Panel
    participant API as Backend API
    participant Auth as Auth Service
    participant DB as MongoDB
    participant PS as Payment Service
    participant Email as Email Service
    participant Socket as WebSocket

    Note over S,Socket: Student Registration Flow
    S->>API: POST /api/auth/register
    API->>Auth: Validate & Hash Password
    Auth->>DB: Save User Data
    DB-->>Auth: User Created
    Auth->>Email: Send Welcome Email
    API-->>S: Registration Success

    Note over S,Socket: Room Booking Flow
    S->>API: POST /api/rooms/book
    API->>Auth: Verify JWT Token
    API->>DB: Check Room Availability
    DB-->>API: Available Rooms
    API->>DB: Create Booking
    API->>PS: Process Payment
    PS-->>API: Payment Success
    API->>Socket: Emit Booking Update
    Socket-->>A: Real-time Notification
    API-->>S: Booking Confirmed

    Note over A,Socket: Admin Operations
    A->>API: GET /api/admin/dashboard
    API->>Auth: Verify Admin Role
    API->>DB: Fetch Analytics Data
    DB-->>API: Dashboard Data
    API-->>A: Dashboard Response
```

---

## 🏛️ Component Architecture

### Frontend Architecture

#### Student Portal (`/frontend`)

```
src/
├── components/           # Reusable UI Components
│   ├── Auth/            # Authentication components
│   ├── Layout/          # Page layout components
│   ├── QRScanner/       # QR code scanning functionality
│   └── EntryExitDashboard.jsx
├── pages/               # Route-based page components
│   ├── Auth/            # Login/Register pages
│   ├── Dashboard/       # Student dashboard
│   ├── Rooms/           # Room management
│   ├── payments/        # Payment interface
│   ├── complaints/      # Complaint submission
│   └── Visitors/        # Visitor management
├── context/             # React Context for state management
│   ├── AuthContext.jsx  # Authentication state
│   └── SocketContext.jsx # WebSocket connection
├── services/            # API communication layer
│   └── api.js           # Axios HTTP client
└── utils/               # Helper functions and constants
    ├── constants.js
    └── helpers.js
```

#### Admin Panel (`/admin`)

```
src/
├── components/           # Admin-specific components
│   ├── Auth/            # Admin authentication
│   ├── Layout/          # Admin layout
│   ├── Camera/          # Face recognition
│   └── QR/              # QR code management
├── pages/               # Admin page components
│   ├── Dashboard/       # Analytics dashboard
│   ├── Users/           # User management
│   ├── Rooms/           # Room administration
│   ├── Payments/        # Payment tracking
│   ├── Complaints/      # Complaint resolution
│   ├── Visitors/        # Visitor oversight
│   ├── Analytics/       # Advanced analytics
│   └── Settings/        # System configuration
├── context/             # Admin-specific contexts
└── services/            # Admin API services
```

### Backend Architecture

#### Core API Server (`/backend`)

```
├── routes/              # API endpoint definitions
│   ├── AuthR.js         # Authentication routes
│   ├── UserR.js         # User management
│   ├── Room.js          # Room operations
│   ├── PaymentR.js      # Payment processing
│   ├── ComplaintR.js    # Complaint system
│   ├── VisitorR.js      # Visitor management
│   ├── DashboardR.js    # Dashboard data
│   ├── gateRoutes.js    # Entry/exit management
│   └── messFeedbackRoutes.js
├── models/              # Database schemas
│   ├── db.js            # Database connection
│   ├── room.js          # Room model
│   ├── payment.js       # Payment model
│   ├── complaint.js     # Complaint model
│   ├── visitors.js      # Visitor model
│   ├── EntryExit.js     # Entry/exit logs
│   ├── gate.js          # Gate management
│   └── messFeedback.js  # Feedback system
├── middleware/          # Custom middleware
│   ├── authmiddleware.js # JWT authentication
│   ├── adminMiddleware.js # Admin authorization
│   └── validation.js    # Input validation
├── services/            # Business logic services
│   ├── emailService.js  # Email notifications
│   ├── notificationService.js # Push notifications
│   └── qrCodeService.js # QR code generation
├── config/              # Configuration modules
│   ├── databaseC.js     # Database configuration
│   ├── Cloudniary.js    # Cloudinary setup
│   └── Razorpay.js      # Payment gateway config
└── Utils/
    └── FileUpload.js    # File handling utilities
```

#### Python Vision Service

```
python-vision-service/
└── app.py               # Flask application
    ├── Face Recognition # OpenCV + face_recognition
    ├── Image Processing # PIL + CV2
    ├── API Endpoints    # REST endpoints for vision tasks
    └── Integration      # Connection with main backend
```

---

## 💻 Technology Stack

### Frontend Technologies

| Component            | Technology            | Purpose                        |
| -------------------- | --------------------- | ------------------------------ |
| **Framework**        | React 18              | Component-based UI development |
| **Build Tool**       | Vite                  | Fast development and building  |
| **UI Library**       | Material-UI (MUI)     | Professional component library |
| **Styling**          | Emotion + CSS-in-JS   | Dynamic styling                |
| **State Management** | React Context + Hooks | Application state              |
| **Routing**          | React Router DOM      | Client-side navigation         |
| **HTTP Client**      | Axios                 | API communication              |
| **Real-time**        | Socket.io Client      | WebSocket connections          |
| **Animation**        | Framer Motion         | UI animations                  |
| **Forms**            | React Hook Form       | Form validation                |
| **QR Scanner**       | html5-qrcode          | QR code scanning               |

### Backend Technologies

| Component             | Technology         | Purpose                       |
| --------------------- | ------------------ | ----------------------------- |
| **Runtime**           | Node.js            | JavaScript server environment |
| **Framework**         | Express.js         | Web application framework     |
| **Database**          | MongoDB + Mongoose | NoSQL database with ODM       |
| **Authentication**    | JWT                | Token-based authentication    |
| **Password Security** | bcryptjs           | Password hashing              |
| **File Upload**       | Multer             | Multipart file handling       |
| **Image Storage**     | Cloudinary         | Cloud image storage           |
| **Email Service**     | Nodemailer         | Email sending                 |
| **Payment Gateway**   | Razorpay           | Payment processing            |
| **Real-time**         | Socket.io          | WebSocket server              |
| **Security**          | Helmet + CORS      | Security middleware           |
| **Validation**        | express-validator  | Input validation              |
| **Rate Limiting**     | express-rate-limit | API protection                |

### Specialized Services

| Service             | Technology                | Purpose            |
| ------------------- | ------------------------- | ------------------ |
| **Vision Service**  | Python + Flask            | Face recognition   |
| **Computer Vision** | OpenCV + face_recognition | Image processing   |
| **QR Generation**   | qrcode + jsQR             | QR code operations |
| **Caching**         | Redis (future)            | Session management |

---

## 🗄️ Database Schema

### MongoDB Collections

#### Users Collection

```javascript
{
  _id: ObjectId,
  studentId: String,      // Unique student identifier
  email: String,          // Email address (unique)
  password: String,       // Hashed password
  firstName: String,
  lastName: String,
  phoneNumber: String,
  dateOfBirth: Date,
  gender: String,
  course: String,
  year: Number,
  guardianName: String,
  guardianPhone: String,
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String
  },
  role: String,           // 'student', 'admin', 'warden'
  isEmailVerified: Boolean,
  profilePicture: String, // Cloudinary URL
  roomId: ObjectId,       // Reference to Room
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### Rooms Collection

```javascript
{
  _id: ObjectId,
  roomNumber: String,     // Unique room identifier
  block: String,          // Building block
  floor: Number,
  capacity: Number,       // Max occupants
  currentOccupancy: Number,
  amenities: [String],    // AC, WiFi, etc.
  rent: Number,           // Monthly rent
  securityDeposit: Number,
  isAvailable: Boolean,
  roomType: String,       // Single, Double, Triple
  occupants: [ObjectId],  // User references
  createdAt: Date,
  updatedAt: Date
}
```

#### Payments Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // Reference to User
  roomId: ObjectId,       // Reference to Room
  paymentType: String,    // 'rent', 'security', 'mess', 'fine'
  amount: Number,
  dueDate: Date,
  paidDate: Date,
  status: String,         // 'pending', 'paid', 'overdue'
  razorpayOrderId: String,
  razorpayPaymentId: String,
  transactionId: String,
  receiptNumber: String,
  description: String,
  createdAt: Date,
  updatedAt: Date
}
```

#### Complaints Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // Complainant reference
  roomId: ObjectId,       // Related room
  title: String,
  description: String,
  category: String,       // 'maintenance', 'electrical', 'plumbing'
  priority: String,       // 'low', 'medium', 'high', 'urgent'
  status: String,         // 'open', 'in-progress', 'resolved', 'closed'
  assignedTo: ObjectId,   // Warden/Admin reference
  attachments: [String],  // Cloudinary URLs
  comments: [{
    userId: ObjectId,
    message: String,
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date,
  resolvedAt: Date
}
```

#### Visitors Collection

```javascript
{
  _id: ObjectId,
  hostId: ObjectId,       // Student being visited
  visitorName: String,
  visitorPhone: String,
  visitorIdType: String,  // 'aadhar', 'license', 'passport'
  visitorIdNumber: String,
  purpose: String,
  expectedDate: Date,
  expectedTime: String,
  approvalStatus: String, // 'pending', 'approved', 'rejected'
  approvedBy: ObjectId,   // Admin/Warden reference
  entryTime: Date,
  exitTime: Date,
  qrCode: String,         // Generated QR for entry
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

#### EntryExit Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId,       // Student reference
  type: String,           // 'entry' or 'exit'
  gateId: ObjectId,       // Gate reference
  timestamp: Date,
  method: String,         // 'qr', 'face', 'manual'
  deviceId: String,       // Scanning device
  latitude: Number,
  longitude: Number,
  createdAt: Date
}
```

---

## 🔌 API Architecture

### RESTful API Endpoints

#### Authentication Routes (`/api/auth`)

```
POST   /register           # Student registration
POST   /login              # User login
POST   /logout             # User logout
POST   /forgot-password    # Password reset request
POST   /reset-password     # Password reset confirmation
GET    /verify-email       # Email verification
POST   /refresh-token      # JWT token refresh
```

#### User Management (`/api/users`)

```
GET    /profile            # Get user profile
PUT    /profile            # Update profile
POST   /upload-avatar      # Upload profile picture
GET    /                   # Get all users (Admin)
PUT    /:id                # Update user (Admin)
DELETE /:id                # Delete user (Admin)
```

#### Room Management (`/api/rooms`)

```
GET    /                   # Get available rooms
GET    /:id                # Get room details
POST   /book               # Book a room
PUT    /cancel/:id         # Cancel booking
GET    /my-room            # Get user's current room
POST   /                   # Create room (Admin)
PUT    /:id                # Update room (Admin)
DELETE /:id                # Delete room (Admin)
```

#### Payment System (`/api/payments`)

```
GET    /                   # Get payment history
POST   /create-order       # Create Razorpay order
POST   /verify             # Verify payment
GET    /pending            # Get pending payments
GET    /admin/all          # All payments (Admin)
POST   /admin/reminder     # Send payment reminder
```

#### Complaint System (`/api/complaints`)

```
GET    /                   # Get user complaints
POST   /                   # Create new complaint
PUT    /:id                # Update complaint
DELETE /:id                # Delete complaint
POST   /:id/comments       # Add comment
GET    /admin/all          # All complaints (Admin)
PUT    /admin/:id/assign   # Assign complaint
```

#### Visitor Management (`/api/visitors`)

```
GET    /                   # Get visitor requests
POST   /                   # Create visitor request
PUT    /:id                # Update request
DELETE /:id                # Cancel request
GET    /admin/pending      # Pending approvals (Admin)
PUT    /admin/:id/approve  # Approve/reject (Admin)
```

### WebSocket Events

#### Real-time Communications

```javascript
// Client Events
"join-room"; // Join user-specific room
"leave-room"; // Leave room
"new-complaint"; // New complaint notification
"payment-reminder"; // Payment due reminder
"visitor-request"; // New visitor request

// Server Events
"complaint-updated"; // Complaint status change
"payment-confirmed"; // Payment successful
"visitor-approved"; // Visitor request approved
"room-allocated"; // Room assignment
"notification"; // General notifications
```

---

## 🔒 Security Architecture

### Authentication & Authorization

#### Multi-layer Security

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Side   │    │   Server Side    │    │   Database      │
├─────────────────┤    ├──────────────────┤    ├─────────────────┤
│ • Form Validation│    │ • JWT Tokens     │    │ • Encrypted Data│
│ • Input Sanitization│ │ • Role-based Auth│    │ • Access Control│
│ • HTTPS Only    │    │ • Rate Limiting  │    │ • Data Validation│
│ • Token Storage │    │ • CORS Policy    │    │ • Audit Logs    │
│ • Auto Logout   │    │ • Helmet Security│    │ • Backup Strategy│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

#### Role-based Access Control (RBAC)

```javascript
// Role Hierarchy
const roles = {
  student: {
    permissions: [
      "view:own-profile",
      "update:own-profile",
      "view:available-rooms",
      "book:room",
      "view:own-payments",
      "create:complaint",
      "create:visitor-request",
    ],
  },
  warden: {
    inherits: ["student"],
    permissions: [
      "view:all-students",
      "assign:complaints",
      "approve:visitors",
      "view:floor-analytics",
    ],
  },
  admin: {
    inherits: ["warden"],
    permissions: [
      "manage:users",
      "manage:rooms",
      "view:all-payments",
      "manage:system-settings",
      "view:analytics",
    ],
  },
};
```

### Data Security Measures

1. **Password Security**

   - bcrypt hashing with salt rounds
   - Password strength validation
   - Secure password reset flow

2. **API Security**

   - JWT token authentication
   - Request rate limiting
   - Input validation and sanitization
   - CORS configuration

3. **File Upload Security**

   - File type validation
   - Size limitations
   - Malware scanning (Cloudinary)
   - Secure URL generation

4. **Database Security**
   - Connection encryption
   - Query parameterization
   - Access control
   - Regular backups

---

## 🚀 Deployment Architecture

### Development Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│                 │    │                 │    │                 │
│ • Vite Dev      │    │ • Nodemon       │    │ • MongoDB Local │
│ • Hot Reload    │◄──►│ • Auto Restart  │◄──►│ • Dev Data      │
│ • Port: 5173    │    │ • Port: 5000    │    │ • Port: 27017   │
│                 │    │ • Debug Mode    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Production Environment

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   CDN/Static    │    │  Application    │    │    Database     │
│                 │    │                 │    │                 │
│ • React Build   │    │ • Node.js App   │    │ • MongoDB Atlas │
│ • Nginx/Apache  │◄──►│ • PM2 Process   │◄──►│ • Cloud Cluster │
│ • SSL/HTTPS     │    │ • Load Balancer │    │ • Replica Sets  │
│ • Gzip Compress │    │ • Health Checks │    │ • Automated     │
│                 │    │                 │    │   Backups       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Cloud Architecture (Recommended)

```
                    ┌─────────────────┐
                    │   CloudFlare    │
                    │   (CDN + DNS)   │
                    └─────────┬───────┘
                              │
                    ┌─────────┴───────┐
                    │  Load Balancer  │
                    │    (AWS ALB)    │
                    └─────────┬───────┘
                              │
            ┌─────────────────┼─────────────────┐
            │                 │                 │
    ┌───────▼──────┐ ┌────────▼────────┐ ┌─────▼──────┐
    │  Frontend    │ │   Backend API   │ │  Services  │
    │   (Vercel)   │ │  (AWS EC2/ECS)  │ │ (AWS Lambda)│
    └──────────────┘ └─────────────────┘ └────────────┘
                              │
                    ┌─────────┴───────┐
                    │   Database      │
                    │ (MongoDB Atlas) │
                    └─────────────────┘
```

### Environment Configuration

```bash
# Development
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/shms_dev
JWT_SECRET=dev_secret_key
FRONTEND_URL=http://localhost:5173

# Production
NODE_ENV=production
PORT=80
MONGODB_URI=mongodb+srv://cluster.mongodb.net/shms_prod
JWT_SECRET=complex_production_secret
FRONTEND_URL=https://shms.yourdomain.com
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

---

## 📈 Performance & Monitoring

### Performance Optimization

- **Frontend**: Code splitting, lazy loading, image optimization
- **Backend**: Database indexing, caching strategies, connection pooling
- **Network**: CDN usage, compression, HTTP/2

### Monitoring & Analytics

- **Application Metrics**: Response times, error rates, throughput
- **Business Metrics**: User registrations, room occupancy, payment success
- **Infrastructure Metrics**: Server health, database performance, storage usage

### Scalability Considerations

- Horizontal scaling with load balancers
- Database sharding strategies
- Microservices migration path
- Caching layer implementation

---

_This architecture document provides a comprehensive overview of the Smart Hostel Management System's technical structure and can be used as a reference for development, deployment, and maintenance activities._
