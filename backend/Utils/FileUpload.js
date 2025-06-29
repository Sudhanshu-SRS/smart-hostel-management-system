const multer = require('multer');
const path = require('path');

// Multer configuration
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.fieldname === 'avatar' || file.fieldname === 'profilePicture') {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile pictures'), false);
    }
  } else if (file.fieldname === 'idProof' || file.fieldname === 'document') {
    const allowedTypes = ['image/', 'application/pdf'];
    if (allowedTypes.some(type => file.mimetype.startsWith(type))) {
      cb(null, true);
    } else {
      cb(new Error('Only image and PDF files are allowed for documents'), false);
    }
  } else {
    cb(new Error('Unexpected field'), false);
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter
});

module.exports = upload;