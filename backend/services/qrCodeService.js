// backend/services/qrCodeService.js
const QRCode = require("qrcode");
const crypto = require("crypto");

class QRCodeService {
  constructor() {
    this.secretKey = process.env.QR_SECRET_KEY || "shms_qr_secret_2024";
  }

  // Generate unique QR code for student
  async generateStudentQR(studentId, studentData) {
    try {
      const timestamp = Date.now();
      const qrData = {
        type: "student_entry_exit",
        studentId: studentId,
        studentName: studentData.name,
        studentNumber: studentData.studentId,
        timestamp: timestamp,
        hostelId: "SHMS_001",
      };

      // Create signature to prevent tampering
      const signature = this.createSignature(JSON.stringify(qrData));
      qrData.signature = signature;

      // Generate QR code as Data URL
      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 300,
        margin: 2,
        color: {
          dark: "#1976d2",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      });

      return {
        qrData: JSON.stringify(qrData),
        qrCodeDataURL,
        qrObject: qrData,
      };
    } catch (error) {
      throw new Error(`Student QR generation failed: ${error.message}`);
    }
  }

  // Generate QR code for gate
  async generateGateQR(gateId, gateData) {
    try {
      const timestamp = Date.now();
      const qrData = {
        type: "gate_scanner",
        gateId: gateId,
        gateName: gateData.gateName,
        location: gateData.location,
        timestamp: timestamp,
      };

      const signature = this.createSignature(JSON.stringify(qrData));
      qrData.signature = signature;

      const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
        width: 400,
        margin: 2,
        color: {
          dark: "#2e7d32",
          light: "#FFFFFF",
        },
        errorCorrectionLevel: "H",
      });

      return {
        qrData: JSON.stringify(qrData),
        qrCodeDataURL,
        qrObject: qrData,
      };
    } catch (error) {
      throw new Error(`Gate QR generation failed: ${error.message}`);
    }
  }

  // Verify QR code authenticity
  verifyQRCode(qrString) {
    try {
      const qrData = JSON.parse(qrString);
      const { signature, ...dataWithoutSignature } = qrData;

      const expectedSignature = this.createSignature(
        JSON.stringify(dataWithoutSignature)
      );

      if (signature !== expectedSignature) {
        throw new Error("Invalid QR code signature");
      }

      // Check if QR is not too old (24 hours for student QR, 1 year for gate QR)
      const maxAge =
        qrData.type === "student_entry_exit"
          ? 24 * 60 * 60 * 1000 // 24 hours for student QR
          : 365 * 24 * 60 * 60 * 1000; // 1 year for gate QR

      if (Date.now() - qrData.timestamp > maxAge) {
        throw new Error("QR code has expired");
      }

      return qrData;
    } catch (error) {
      throw new Error(`QR verification failed: ${error.message}`);
    }
  }

  // Create signature for QR data
  createSignature(data) {
    return crypto
      .createHmac("sha256", this.secretKey)
      .update(data)
      .digest("hex");
  }
}

module.exports = new QRCodeService();
