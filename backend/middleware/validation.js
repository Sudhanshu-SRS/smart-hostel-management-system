const { body, validationResult } = require("express-validator");

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMessages = errors.array().map((err) => ({
      field: err.param,
      message: err.msg,
      value: err.value,
    }));
    console.error("❌ Validation failed:", errorMessages);
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errorMessages,
    });
  }
  next();
};

const validateRegister = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  body("phoneNumber")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be 10 digits"),
  body("role")
    .optional()
    .isIn(["student", "warden", "admin"])
    .withMessage("Role must be student, warden, or admin"),
  handleValidationErrors,
];

const validateLogin = [
  body("email")
    .isEmail()
    .normalizeEmail()
    .withMessage("Please provide a valid email"),
  body("password").notEmpty().withMessage("Password is required"),
  handleValidationErrors,
];

const validateRoom = [
  body("roomNumber").trim().notEmpty().withMessage("Room number is required"),
  body("building").trim().notEmpty().withMessage("Building is required"),
  body("floor")
    .toInt()
    .isInt({ min: 0 })
    .withMessage("Floor must be a non-negative integer"),
  body("capacity")
    .toInt()
    .isInt({ min: 1, max: 4 })
    .withMessage("Capacity must be between 1 and 4"),
  body("monthlyRent")
    .toFloat()
    .isFloat({ min: 0 })
    .withMessage("Monthly rent must be a positive number"),
  body("securityDeposit")
    .toFloat()
    .isFloat({ min: 0 })
    .withMessage("Security deposit must be a positive number"),
  body("roomType")
    .isIn(["single", "double", "triple", "quad"])
    .withMessage("Room type must be single, double, triple, or quad"),
  handleValidationErrors,
];

const validateComplaint = [
  body("title")
    .trim()
    .isLength({ min: 5, max: 100 })
    .withMessage("Title must be between 5 and 100 characters"),
  body("description")
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage("Description must be between 10 and 1000 characters"),
  body("category")
    .isIn([
      "maintenance",
      "electrical",
      "plumbing",
      "cleaning",
      "security",
      "wifi",
      "noise",
      "other",
    ])
    .withMessage("Invalid category"),
  body("priority")
    .optional()
    .isIn(["low", "medium", "high", "urgent"])
    .withMessage("Priority must be low, medium, high, or urgent"),
  handleValidationErrors,
];

const validateVisitor = [
  body("name")
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Name must be between 2 and 50 characters"),
  body("phoneNumber")
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be 10 digits"),
  body("idType")
    .isIn(["aadhar", "passport", "driving_license", "voter_id", "pan_card"])
    .withMessage("Invalid ID type"),
  body("idNumber").trim().notEmpty().withMessage("ID number is required"),
  body("purpose")
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage("Purpose must be between 5 and 200 characters"),
  body("relationship")
    .isIn(["parent", "sibling", "friend", "relative", "other"])
    .withMessage("Invalid relationship"),
  body("expectedCheckOutTime")
    .isISO8601()
    .withMessage("Expected checkout time must be a valid date"),
  handleValidationErrors,
];

module.exports = {
  validateRegister,
  validateLogin,
  validateRoom,
  validateComplaint,
  validateVisitor,
  handleValidationErrors,
};
