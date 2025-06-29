// backend/services/emailService.js
const nodemailer = require("nodemailer");

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendWelcomeEmail(user) {
    try {
      const mailOptions = {
        from: `"SHMS - Smart Hostel Management" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: "🎉 Welcome to SHMS - Your Registration is Complete!",
        html: this.generateWelcomeEmailTemplate(user),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Welcome email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending welcome email:", error);
      return { success: false, error: error.message };
    }
  }

  generateWelcomeEmailTemplate(user) {
    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to SHMS</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 0 20px rgba(0,0,0,0.1);
            }
            .header {
                text-align: center;
                background: linear-gradient(135deg, #1976d2, #42a5f5);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                margin: -30px -30px 30px -30px;
            }
            .header h1 {
                margin: 0;
                font-size: 28px;
            }
            .welcome-badge {
                background: rgba(255,255,255,0.2);
                padding: 10px 20px;
                border-radius: 25px;
                display: inline-block;
                margin-top: 10px;
                font-size: 14px;
            }
            .user-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #1976d2;
            }
            .user-details h3 {
                margin-top: 0;
                color: #1976d2;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .detail-row:last-child {
                border-bottom: none;
            }
            .detail-label {
                font-weight: 600;
                color: #555;
            }
            .detail-value {
                color: #333;
            }
            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 15px;
                margin: 25px 0;
            }
            .feature-card {
                background: #fff;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                padding: 15px;
                text-align: center;
                transition: transform 0.2s;
            }
            .feature-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            .feature-icon {
                font-size: 24px;
                margin-bottom: 10px;
            }
            .cta-button {
                display: inline-block;
                background: linear-gradient(135deg, #1976d2, #42a5f5);
                color: white;
                padding: 15px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 20px 0;
                transition: all 0.3s;
            }
            .cta-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(25, 118, 210, 0.4);
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
                font-size: 14px;
            }
            .social-links {
                margin: 15px 0;
            }
            .social-links a {
                display: inline-block;
                margin: 0 10px;
                color: #1976d2;
                text-decoration: none;
            }
            @media (max-width: 600px) {
                body {
                    padding: 10px;
                }
                .container {
                    padding: 20px;
                }
                .header {
                    padding: 20px;
                    margin: -20px -20px 20px -20px;
                }
                .features {
                    grid-template-columns: 1fr;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Welcome to SHMS</h1>
                <div class="welcome-badge">Smart Hostel Management System</div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
                <h2>🎉 Registration Successful!</h2>
                <p style="font-size: 18px; color: #666;">
                    Hello <strong>${
                      user.name
                    }</strong>, welcome to the future of hostel management!
                </p>
            </div>

            <div class="user-details">
                <h3>📋 Your Account Details</h3>
                <div class="detail-row">
                    <span class="detail-label">👤 Full Name:</span>
                    <span class="detail-value">${user.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📧 Email:</span>
                    <span class="detail-value">${user.email}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📱 Phone:</span>
                    <span class="detail-value">${
                      user.phoneNumber || "Not provided"
                    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">🎓 Student ID:</span>
                    <span class="detail-value">${
                      user.studentId || "Not assigned"
                    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">👥 Role:</span>
                    <span class="detail-value">${
                      user.role.charAt(0).toUpperCase() + user.role.slice(1)
                    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">📅 Registration Date:</span>
                    <span class="detail-value">${new Date().toLocaleDateString(
                      "en-US",
                      {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      }
                    )}</span>
                </div>
                ${
                  user.emergencyContact?.name
                    ? `
                <div class="detail-row">
                    <span class="detail-label">🚨 Emergency Contact:</span>
                    <span class="detail-value">${user.emergencyContact.name} (${user.emergencyContact.phone})</span>
                </div>
                `
                    : ""
                }
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <h3>🚀 What's Next?</h3>
                <p>Your account is ready! Here's what you can do now:</p>
            </div>

            <div class="features">
                <div class="feature-card">
                    <div class="feature-icon">🏠</div>
                    <h4>Find Your Room</h4>
                    <p>Browse available rooms and book your perfect space</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">💰</div>
                    <h4>Manage Payments</h4>
                    <p>Easy online payments with Razorpay integration</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🛠️</div>
                    <h4>Report Issues</h4>
                    <p>Submit maintenance requests and track their progress</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">👥</div>
                    <h4>Visitor Management</h4>
                    <p>Register visitors and manage entry permissions</p>
                </div>
            </div>

            <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.CLIENT_URL}/login" class="cta-button">
                    🚀 Access Your Dashboard
                </a>
                <p style="margin-top: 15px; color: #666;">
                    Login with your registered email and password
                </p>
            </div>

            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 25px 0;">
                <h4 style="margin-top: 0; color: #1976d2;">📞 Need Help?</h4>
                <p style="margin-bottom: 0;">
                    Our support team is here to help! Contact us at:
                    <br>
                    📧 <a href="mailto:support@smarthostel.com">support@smarthostel.com</a>
                    <br>
                    📱 +91 1234567890
                    <br>
                    🕒 Available 24/7 for your assistance
                </p>
            </div>

            <div class="footer">
                <div class="social-links">
                    <a href="#">📘 Facebook</a>
                    <a href="#">🐦 Twitter</a>
                    <a href="#">📷 Instagram</a>
                    <a href="#">💼 LinkedIn</a>
                </div>
                <p>
                    © ${new Date().getFullYear()} SHMS - Smart Hostel Management System
                    <br>
                    Making hostel life smarter, one student at a time! 🎓
                </p>
                <p style="font-size: 12px; color: #999;">
                    This email was sent to ${user.email}. 
                    If you didn't register for SHMS, please ignore this email.
                </p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async sendPasswordResetEmail(user, resetToken) {
    try {
      const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

      const mailOptions = {
        from: `"SHMS - Security" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: "🔐 SHMS Password Reset Request",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #1976d2;">🔐 Password Reset</h1>
              <p>Hello ${user.name}, we received a request to reset your password.</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                Reset Your Password
              </a>
            </div>
            
            <p style="text-align: center; color: #666;">
              This link will expire in 10 minutes for security reasons.
              <br>
              If you didn't request this, please ignore this email.
            </p>
          </div>
        </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Password reset email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending password reset email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendComplaintNotificationEmail(user, complaint) {
    try {
      const mailOptions = {
        from: `"SHMS - Notifications" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: `🛠️ Complaint Status Update - ${complaint.title}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f4f4f4;">
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
            <h1 style="color: #1976d2; text-align: center;">🛠️ Complaint Update</h1>
            <p>Hello ${user.name},</p>
            <p>Your complaint "<strong>${complaint.title}</strong>" has been updated.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Status:</strong> ${complaint.status}</p>
              <p><strong>Priority:</strong> ${complaint.priority}</p>
              <p><strong>Category:</strong> ${complaint.category}</p>
            </div>
            <p style="text-align: center;">
              <a href="${process.env.CLIENT_URL}/complaints" style="display: inline-block; background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold;">
                View Details
              </a>
            </p>
          </div>
        </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(
        "✅ Complaint notification email sent successfully:",
        info.messageId
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending complaint notification email:", error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new EmailService();
