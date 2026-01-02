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

  async sendEmail({ to, subject, html, text }) {
    try {
      const mailOptions = {
        from: `"SHMS - Smart Hostel Management" <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html,
        text,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending email:", error);
      return { success: false, error: error.message };
    }
  }

  async sendEntryExitNotification(guardianEmail, data) {
    try {
      const {
        studentName,
        studentId,
        action,
        gateName,
        timestamp,
        guardianName,
      } = data;

      const mailOptions = {
        from: `"SHMS Security Alert" <${process.env.EMAIL_FROM}>`,
        to: guardianEmail,
        subject: `🚨 ${action.toUpperCase()} Alert: ${studentName} - SHMS`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px;">
            <h1>${action === "entry" ? "🏠" : "🚪"} Hostel ${
          action.charAt(0).toUpperCase() + action.slice(1)
        } Alert</h1>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2>Dear ${guardianName || "Guardian"},</h2>
            <p>This is to inform you that <strong>${studentName}</strong> has ${
          action === "entry" ? "entered" : "exited"
        } the hostel premises.</p>
            
            <div style="background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #1976d2;">
              <p><strong>Student:</strong> ${studentName} (${studentId})</p>
              <p><strong>Action:</strong> ${action.toUpperCase()}</p>
              <p><strong>Gate:</strong> ${gateName}</p>
              <p><strong>Time:</strong> ${new Date(
                timestamp
              ).toLocaleString()}</p>
            </div>
          </div>
          
          <div style="text-align: center; color: #666; font-size: 12px;">
            <p>This is an automated security notification from SHMS.</p>
            <p>For any concerns, please contact the hostel administration.</p>
          </div>
        </div>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Entry/Exit notification sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Entry/Exit notification error:", error);
      return { success: false, error: error.message };
    }
  }

  async sendEntryExitNotification(student, actionType, logData) {
    try {
      const { outingReason, expectedReturnTime, gate, approvedBy } = logData;

      const actionText = actionType === "exit" ? "left" : "entered";
      const actionIcon = actionType === "exit" ? "🚪➡️" : "🚪⬅️";

      const subject = `${actionIcon} SHMS Alert: ${student.name} has ${actionText} the hostel`;

      const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">${actionIcon} Hostel ${actionType.toUpperCase()} Alert</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Smart Hostel Management System</p>
        </div>
        
        <div style="background: #f8f9fa; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #1976d2; margin-top: 0;">Dear Parent/Guardian,</h2>
          <p style="font-size: 16px; line-height: 1.6;">
            This is to inform you that <strong>${
              student.name
            }</strong> (Student ID: ${student.studentId}) 
            has <strong>${actionText}</strong> the hostel premises.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #1976d2; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong>📅 Date & Time:</strong><br>
                ${new Date().toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "full",
                  timeStyle: "short",
                })}
              </div>
              <div>
                <strong>🚪 Gate Location:</strong><br>
                ${gate.gateName} - ${gate.location}
              </div>
              ${
                actionType === "exit"
                  ? `
              <div>
                <strong>📝 Reason:</strong><br>
                ${outingReason}
              </div>
              <div>
                <strong>⏰ Expected Return:</strong><br>
                ${new Date(expectedReturnTime).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              `
                  : ""
              }
              <div>
                <strong>✅ Approved By:</strong><br>
                ${approvedBy.name} (${approvedBy.role})
              </div>
            </div>
          </div>
          
          ${
            actionType === "exit"
              ? `
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>⚠️ Important:</strong> You will receive another notification when ${student.name} returns to the hostel.
              If they return after the expected time, you'll receive a late return alert.
            </p>
          </div>
          `
              : ""
          }
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px; border-top: 1px solid #eee;">
          <p>This is an automated security notification from SHMS.</p>
          <p>For any queries, please contact the hostel administration at <a href="mailto:admin@shms.com">admin@shms.com</a></p>
          <p style="font-size: 12px; margin-top: 15px;">
            © ${new Date().getFullYear()} Smart Hostel Management System. All rights reserved.
          </p>
        </div>
      </div>
      `;

      // Send to parent/guardian
      if (student.parentGuardianContact?.email) {
        await this.sendEmail({
          to: student.parentGuardianContact.email,
          subject: subject,
          html: htmlContent,
        });
        console.log(
          `✅ Entry/Exit notification sent to parent: ${student.parentGuardianContact.email}`
        );
      }

      // Send to warden
      const wardenEmail = process.env.WARDEN_EMAIL || "warden@shms.com";
      await this.sendEmail({
        to: wardenEmail,
        subject: `📊 SHMS: Student ${actionType} - ${student.name}`,
        html: htmlContent,
      });
      console.log(`✅ Entry/Exit notification sent to warden: ${wardenEmail}`);

      return { success: true };
    } catch (error) {
      console.error("❌ Entry/Exit notification error:", error);
      return { success: false, error: error.message };
    }
  }

  async sendLateReturnAlert(student, logData) {
    try {
      const { expectedReturnTime, actualReturnTime, outingReason, gate } =
        logData;
      const lateByMinutes = Math.floor(
        (new Date(actualReturnTime) - new Date(expectedReturnTime)) /
          (1000 * 60)
      );

      const subject = `🚨 LATE RETURN ALERT: ${student.name} - SHMS`;

      const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #d32f2f, #f44336); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">🚨 LATE RETURN ALERT</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">Immediate Attention Required</p>
        </div>
        
        <div style="background: #ffebee; padding: 25px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #f44336;">
          <h2 style="color: #d32f2f; margin-top: 0;">Late Return Detected</h2>
          <p style="font-size: 16px; line-height: 1.6;">
            <strong>${student.name}</strong> (Student ID: ${
        student.studentId
      }) has returned 
            <strong style="color: #d32f2f;">${lateByMinutes} minutes late</strong> from their approved outing.
          </p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
              <div>
                <strong>📅 Expected Return:</strong><br>
                ${new Date(expectedReturnTime).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              <div>
                <strong>📅 Actual Return:</strong><br>
                ${new Date(actualReturnTime).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </div>
              <div>
                <strong>📝 Original Reason:</strong><br>
                ${outingReason}
              </div>
              <div>
                <strong>🚪 Return Gate:</strong><br>
                ${gate.gateName} - ${gate.location}
              </div>
            </div>
          </div>
          
          <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
            <p style="margin: 0; color: #856404;">
              <strong>📞 Action Required:</strong> Please follow up with ${
                student.name
              } regarding the late return. 
              Consider discussing time management and the importance of adhering to agreed schedules.
            </p>
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px; border-top: 1px solid #eee;">
          <p>This is an automated security alert from SHMS.</p>
          <p>For immediate assistance, please contact the hostel administration.</p>
        </div>
      </div>
      `;

      // Send to parent/guardian
      if (student.parentGuardianContact?.email) {
        await this.sendEmail({
          to: student.parentGuardianContact.email,
          subject: subject,
          html: htmlContent,
        });
      }

      // Send to warden
      const wardenEmail = process.env.WARDEN_EMAIL || "warden@shms.com";
      await this.sendEmail({
        to: wardenEmail,
        subject: subject,
        html: htmlContent,
      });

      console.log(`✅ Late return alert sent for student: ${student.name}`);
      return { success: true };
    } catch (error) {
      console.error("❌ Late return alert error:", error);
      return { success: false, error: error.message };
    }
  }

  async sendMessFeedbackToWarden(feedbackData) {
    try {
      const {
        student,
        feedbackType,
        mealType,
        foodQuality,
        serviceQuality,
        cleanliness,
        overallSatisfaction,
        suggestions,
        complaints,
        isAnonymous,
      } = feedbackData;

      const subject = `📝 Mess Feedback Submission - ${feedbackType.toUpperCase()}`;

      const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #2e7d32, #4caf50); color: white; padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
          <h1 style="margin: 0; font-size: 24px;">📝 Mess Feedback Submission</h1>
          <p style="margin: 10px 0 0 0; opacity: 0.9;">${
            feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)
          } Feedback</p>
        </div>
        
        <div style="background: #f1f8e9; padding: 25px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="color: #2e7d32; margin-top: 0;">Feedback Details</h2>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
              <div>
                <strong>👤 Student:</strong><br>
                ${
                  isAnonymous
                    ? "Anonymous Feedback"
                    : `${student.name} (${student.studentId})`
                }
              </div>
              <div>
                <strong>🍽️ Meal Type:</strong><br>
                ${mealType.charAt(0).toUpperCase() + mealType.slice(1)}
              </div>
              <div>
                <strong>📅 Date:</strong><br>
                ${new Date().toLocaleDateString("en-IN", {
                  timeZone: "Asia/Kolkata",
                  dateStyle: "full",
                })}
              </div>
              <div>
                <strong>📊 Feedback Type:</strong><br>
                ${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)}
              </div>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 20px;">
              <h3 style="color: #2e7d32; margin-top: 0;">Ratings (1-5 stars)</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div>
                  <strong>🍯 Food Quality:</strong> ${"⭐".repeat(
                    foodQuality
                  )}${"☆".repeat(5 - foodQuality)} (${foodQuality}/5)
                </div>
                <div>
                  <strong>👥 Service Quality:</strong> ${"⭐".repeat(
                    serviceQuality
                  )}${"☆".repeat(5 - serviceQuality)} (${serviceQuality}/5)
                </div>
                <div>
                  <strong>🧹 Cleanliness:</strong> ${"⭐".repeat(
                    cleanliness
                  )}${"☆".repeat(5 - cleanliness)} (${cleanliness}/5)
                </div>
                <div>
                  <strong>🎯 Overall Satisfaction:</strong> ${"⭐".repeat(
                    overallSatisfaction
                  )}${"☆".repeat(
        5 - overallSatisfaction
      )} (${overallSatisfaction}/5)
                </div>
              </div>
            </div>
            
            ${
              suggestions
                ? `
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
              <strong>💡 Suggestions:</strong><br>
              <p style="background: #f8f9fa; padding: 15px; border-radius: 6px; margin: 10px 0; font-style: italic;">
                "${suggestions}"
              </p>
            </div>
            `
                : ""
            }
            
            ${
              complaints
                ? `
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 20px;">
              <strong>⚠️ Complaints:</strong><br>
              <p style="background: #fff3cd; padding: 15px; border-radius: 6px; margin: 10px 0; font-style: italic; border-left: 4px solid #ffc107;">
                "${complaints}"
              </p>
            </div>
            `
                : ""
            }
          </div>
        </div>
        
        <div style="text-align: center; padding: 20px; color: #666; font-size: 14px; border-top: 1px solid #eee;">
          <p>This feedback has been automatically submitted through the SHMS mobile app.</p>
          <p>Please review and take appropriate action to improve mess services.</p>
        </div>
      </div>
      `;

      const wardenEmail = process.env.WARDEN_EMAIL || "warden@shms.com";
      await this.sendEmail({
        to: wardenEmail,
        subject: subject,
        html: htmlContent,
      });

      console.log(
        `✅ Mess feedback sent to warden for ${feedbackType} feedback`
      );
      return { success: true };
    } catch (error) {
      console.error("❌ Mess feedback email error:", error);
      return { success: false, error: error.message };
    }
  }

  // Complaint Acknowledgment Email
  async sendComplaintAcknowledgmentEmail(user, complaint) {
    try {
      const mailOptions = {
        from: `"SHMS - Smart Hostel Management" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: `📋 Complaint Acknowledgment - Ticket #${complaint._id
          .toString()
          .slice(-6)
          .toUpperCase()}`,
        html: this.generateComplaintAcknowledgmentTemplate(user, complaint),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Complaint acknowledgment email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending complaint acknowledgment email:", error);
      return { success: false, error: error.message };
    }
  }

  generateComplaintAcknowledgmentTemplate(user, complaint) {
    const categoryIcons = {
      maintenance: "🔧",
      electrical: "⚡",
      plumbing: "🚿",
      cleaning: "🧹",
      security: "🔒",
      wifi: "📡",
      noise: "🔊",
      other: "📝",
    };

    const priorityColors = {
      low: "#28a745",
      medium: "#ffc107",
      high: "#fd7e14",
      urgent: "#dc3545",
    };

    const icon = categoryIcons[complaint.category] || "📝";
    const color = priorityColors[complaint.priority] || "#1976d2";

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Complaint Acknowledgment</title>
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
                font-size: 24px;
            }
            .ticket-badge {
                background: rgba(255,255,255,0.2);
                padding: 10px 20px;
                border-radius: 25px;
                display: inline-block;
                margin-top: 10px;
                font-size: 12px;
                font-weight: 600;
            }
            .complaint-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid ${color};
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
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
                color: #777;
            }
            .priority-badge {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 20px;
                background-color: ${color};
                color: white;
                font-size: 12px;
                font-weight: 600;
            }
            .category-badge {
                display: inline-block;
                padding: 5px 12px;
                border-radius: 20px;
                background-color: #e3f2fd;
                color: #1976d2;
                font-size: 12px;
            }
            .status-box {
                background: #fff3cd;
                border-left: 4px solid #ffc107;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .next-steps {
                background: #e8f5e9;
                border-left: 4px solid #28a745;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .next-steps h3 {
                margin-top: 0;
                color: #28a745;
            }
            .next-steps ul {
                margin: 10px 0;
                padding-left: 20px;
            }
            .next-steps li {
                margin: 5px 0;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #999;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${icon} Complaint Received</h1>
                <div class="ticket-badge">Ticket #${complaint._id
                  .toString()
                  .slice(-6)
                  .toUpperCase()}</div>
            </div>

            <p>Dear ${user.name},</p>
            <p>Thank you for submitting your complaint. We have received your report and assigned it a unique ticket number for tracking purposes.</p>

            <div class="complaint-details">
                <h3>Complaint Details</h3>
                <div class="detail-row">
                    <span class="detail-label">Ticket Number:</span>
                    <span class="detail-value">#${complaint._id
                      .toString()
                      .slice(-6)
                      .toUpperCase()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Title:</span>
                    <span class="detail-value">${complaint.title}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Category:</span>
                    <span class="category-badge">${icon} ${
      complaint.category.charAt(0).toUpperCase() + complaint.category.slice(1)
    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Priority:</span>
                    <span class="priority-badge">${complaint.priority.toUpperCase()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="detail-value">Open</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Submitted On:</span>
                    <span class="detail-value">${new Date(
                      complaint.createdAt
                    ).toLocaleString("en-IN")}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Description:</span>
                </div>
                <div style="background: white; padding: 10px; border-radius: 5px; margin-top: 5px;">
                    <p style="margin: 0; color: #555;">${
                      complaint.description
                    }</p>
                </div>
            </div>

            <div class="status-box">
                <strong>📌 Status Update:</strong>
                <p>Your complaint has been logged in our system. Our team will review it shortly and take appropriate action. You will receive updates via email.</p>
            </div>

            <div class="next-steps">
                <h3>What Happens Next?</h3>
                <ul>
                    <li>Our team will review your complaint within 24 hours</li>
                    <li>For high priority issues, we will assign a staff member immediately</li>
                    <li>You will receive email updates on the status of your complaint</li>
                    <li>Track your complaint status anytime using your ticket number</li>
                </ul>
            </div>

            <p><strong>Need Help?</strong> If you need to provide additional information or have questions about your complaint, please reply to this email or contact the warden's office.</p>

            <div class="footer">
                <p>This is an automated email from Smart Hostel Management System (SHMS)</p>
                <p>© 2024 SHMS. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Payment Acknowledgment Email
  async sendPaymentAcknowledgmentEmail(user, payment) {
    try {
      const mailOptions = {
        from: `"SHMS - Smart Hostel Management" <${process.env.EMAIL_FROM}>`,
        to: user.email,
        subject: `💳 Payment Confirmation - Receipt #${payment._id
          .toString()
          .slice(-6)
          .toUpperCase()}`,
        html: this.generatePaymentAcknowledgmentTemplate(user, payment),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log("✅ Payment acknowledgment email sent:", info.messageId);
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending payment acknowledgment email:", error);
      return { success: false, error: error.message };
    }
  }

  generatePaymentAcknowledgmentTemplate(user, payment) {
    const paymentTypeLabels = {
      monthly_rent: "Monthly Rent",
      security_deposit: "Security Deposit",
      maintenance: "Maintenance Fee",
      fine: "Fine/Penalty",
      laundry: "Laundry Service",
      mess_fee: "Mess Fee",
    };

    const paymentTypeLabel =
      paymentTypeLabels[payment.paymentType] || payment.paymentType;
    const receiptDate = new Date(payment.paidDate || payment.createdAt);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Receipt</title>
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
                background: linear-gradient(135deg, #28a745, #20c997);
                color: white;
                padding: 30px;
                border-radius: 10px 10px 0 0;
                margin: -30px -30px 30px -30px;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .receipt-badge {
                background: rgba(255,255,255,0.2);
                padding: 10px 20px;
                border-radius: 25px;
                display: inline-block;
                margin-top: 10px;
                font-size: 12px;
                font-weight: 600;
            }
            .payment-details {
                background: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #28a745;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 10px 0;
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
                color: #777;
            }
            .amount-section {
                background: white;
                border: 2px solid #28a745;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                text-align: right;
            }
            .amount-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                font-size: 16px;
            }
            .amount-row.total {
                border-top: 2px solid #eee;
                padding-top: 12px;
                font-weight: 700;
                font-size: 18px;
                color: #28a745;
            }
            .status-badge {
                display: inline-block;
                padding: 8px 16px;
                border-radius: 20px;
                background-color: #d4edda;
                color: #155724;
                font-size: 12px;
                font-weight: 600;
            }
            .invoice-box {
                background: #e8f5e9;
                border-left: 4px solid #28a745;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .transaction-id {
                font-family: monospace;
                background: #f0f0f0;
                padding: 8px 12px;
                border-radius: 4px;
                word-break: break-all;
                font-size: 12px;
            }
            .footer {
                text-align: center;
                padding-top: 20px;
                border-top: 1px solid #eee;
                font-size: 12px;
                color: #999;
                margin-top: 30px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✅ Payment Confirmed</h1>
                <div class="receipt-badge">Receipt #${payment._id
                  .toString()
                  .slice(-6)
                  .toUpperCase()}</div>
            </div>

            <p>Dear ${user.name},</p>
            <p>Thank you for your payment. Your transaction has been processed successfully. Please find the payment details and receipt below.</p>

            <div class="invoice-box">
                <strong>Payment Status:</strong> <span class="status-badge">COMPLETED</span>
            </div>

            <div class="payment-details">
                <h3>Payment Information</h3>
                <div class="detail-row">
                    <span class="detail-label">Receipt Number:</span>
                    <span class="detail-value">#${payment._id
                      .toString()
                      .slice(-6)
                      .toUpperCase()}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Type:</span>
                    <span class="detail-value">${paymentTypeLabel}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Method:</span>
                    <span class="detail-value">${
                      payment.paymentMethod.charAt(0).toUpperCase() +
                      payment.paymentMethod.slice(1).replace("_", " ")
                    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Payment Date:</span>
                    <span class="detail-value">${receiptDate.toLocaleString(
                      "en-IN"
                    )}</span>
                </div>
                ${
                  payment.transactionId
                    ? `
                <div class="detail-row">
                    <span class="detail-label">Transaction ID:</span>
                    <span class="detail-value transaction-id">${payment.transactionId}</span>
                </div>
                `
                    : ""
                }
            </div>

            <div class="amount-section">
                <div class="amount-row">
                    <span>Base Amount:</span>
                    <span>₹${payment.amount.toFixed(2)}</span>
                </div>
                ${
                  payment.lateFee > 0
                    ? `
                <div class="amount-row">
                    <span>Late Fee:</span>
                    <span>+ ₹${payment.lateFee.toFixed(2)}</span>
                </div>
                `
                    : ""
                }
                ${
                  payment.discount > 0
                    ? `
                <div class="amount-row">
                    <span>Discount:</span>
                    <span>- ₹${payment.discount.toFixed(2)}</span>
                </div>
                `
                    : ""
                }
                <div class="amount-row total">
                    <span>Total Paid:</span>
                    <span>₹${payment.finalAmount.toFixed(2)}</span>
                </div>
            </div>

            <p><strong>📌 Keep this receipt:</strong> Please save this email for your records. You can use your receipt number to track your payment status.</p>

            <div class="footer">
                <p>This is an automated email from Smart Hostel Management System (SHMS)</p>
                <p>© 2024 SHMS. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Vacation Request Notification Emails
  async sendVacationRequestNotification(staff, vacationRequest) {
    try {
      const mailOptions = {
        from: `"SHMS - Smart Hostel Management" <${process.env.EMAIL_FROM}>`,
        to: staff.email,
        subject: `📋 New Vacation Request from ${
          vacationRequest.student?.name || "Student"
        }`,
        html: this.generateVacationRequestTemplate(staff, vacationRequest),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(
        "✅ Vacation request notification sent to",
        staff.email,
        ":",
        info.messageId
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending vacation request notification:", error);
      return { success: false, error: error.message };
    }
  }

  generateVacationRequestTemplate(staff, vacationRequest) {
    const studentName = vacationRequest.student?.name || "Student";
    const studentEmail = vacationRequest.student?.email || "N/A";
    const studentId = vacationRequest.student?.studentId || "N/A";
    const roomNumber = vacationRequest.room?.roomNumber || "N/A";
    const building = vacationRequest.room?.building || "N/A";
    const floor = vacationRequest.room?.floor || "N/A";
    const requestDate = new Date(
      vacationRequest.requestDate
    ).toLocaleDateString("en-IN");
    const ticketNumber = vacationRequest._id.toString().slice(-8).toUpperCase();

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vacation Request Notification</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #2196F3;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .header h1 {
                color: #2196F3;
                margin: 0;
                font-size: 24px;
            }
            .ticket-number {
                background-color: #E3F2FD;
                padding: 10px;
                border-radius: 4px;
                text-align: center;
                font-weight: bold;
                color: #1976D2;
                margin: 10px 0;
            }
            .section {
                margin: 20px 0;
                padding: 15px;
                background-color: #f9f9f9;
                border-left: 4px solid #2196F3;
                border-radius: 4px;
            }
            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #1976D2;
                margin-bottom: 10px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e0e0e0;
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
            .reason-box {
                background-color: #FFF3E0;
                padding: 15px;
                border-left: 4px solid #FF9800;
                border-radius: 4px;
                margin: 15px 0;
            }
            .reason-title {
                font-weight: bold;
                color: #E65100;
                margin-bottom: 8px;
            }
            .action-buttons {
                text-align: center;
                margin: 25px 0;
            }
            .btn {
                display: inline-block;
                padding: 12px 30px;
                margin: 0 10px;
                border-radius: 4px;
                text-decoration: none;
                font-weight: bold;
                font-size: 14px;
            }
            .btn-approve {
                background-color: #4CAF50;
                color: white;
            }
            .btn-review {
                background-color: #2196F3;
                color: white;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                color: #666;
                font-size: 12px;
            }
            .status-badge {
                display: inline-block;
                padding: 6px 12px;
                background-color: #FFF3E0;
                color: #E65100;
                border-radius: 20px;
                font-size: 12px;
                font-weight: bold;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 New Room Vacation Request</h1>
                <p style="margin: 5px 0; color: #666;">A student has submitted a request to vacate their room</p>
            </div>

            <div class="ticket-number">
                Ticket #${ticketNumber} | Request Date: ${requestDate}
            </div>

            <div class="section">
                <div class="section-title">👤 Student Information</div>
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${studentName}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Student ID:</span>
                    <span class="detail-value">${studentId}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${studentEmail}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">🏠 Room Details</div>
                <div class="detail-row">
                    <span class="detail-label">Room Number:</span>
                    <span class="detail-value">${roomNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Building:</span>
                    <span class="detail-value">${building}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Floor:</span>
                    <span class="detail-value">${floor}</span>
                </div>
            </div>

            <div class="reason-box">
                <div class="reason-title">📝 Reason for Vacation:</div>
                <p style="margin: 0;">${vacationRequest.reason}</p>
            </div>

            <div class="section">
                <div class="section-title">📊 Request Status</div>
                <div class="detail-row">
                    <span class="detail-label">Status:</span>
                    <span class="status-badge">PENDING APPROVAL</span>
                </div>
            </div>

            <div class="action-buttons">
                <p style="margin-bottom: 15px; font-weight: bold; color: #333;">Please review and approve/reject this request:</p>
                <a href="http://localhost:3001/admin" class="btn btn-review">📊 Review in Admin Dashboard</a>
            </div>

            <div class="footer">
                <p>This is an automated email from Smart Hostel Management System (SHMS)</p>
                <p>© 2024 SHMS. All rights reserved.</p>
                <p>Please do not reply to this email. Use the admin dashboard to respond.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Vacation Request Approval/Rejection Notification
  async sendVacationRequestApprovalNotification(
    student,
    vacationRequest,
    approvalType
  ) {
    try {
      let subject = "";
      let actionColor = "";
      let statusText = "";
      let emoji = "";

      if (approvalType === "approved") {
        subject = "✅ Room Vacation Approved";
        actionColor = "#4CAF50";
        statusText = "APPROVED";
        emoji = "✅";
      } else if (approvalType === "rejected") {
        subject = "❌ Room Vacation Rejected";
        actionColor = "#F44336";
        statusText = "REJECTED";
        emoji = "❌";
      }

      const mailOptions = {
        from: `"SHMS - Smart Hostel Management" <${process.env.EMAIL_FROM}>`,
        to: student.email,
        subject,
        html: this.generateVacationApprovalTemplate(
          student,
          vacationRequest,
          approvalType,
          actionColor,
          statusText,
          emoji
        ),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(
        "✅ Vacation request",
        approvalType,
        "notification sent to",
        student.email,
        ":",
        info.messageId
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error(
        "❌ Error sending vacation request approval notification:",
        error
      );
      return { success: false, error: error.message };
    }
  }

  generateVacationApprovalTemplate(
    student,
    vacationRequest,
    approvalType,
    actionColor,
    statusText,
    emoji
  ) {
    const roomNumber = vacationRequest.room?.roomNumber || "N/A";
    const building = vacationRequest.room?.building || "N/A";
    const floor = vacationRequest.room?.floor || "N/A";
    const ticketNumber = vacationRequest._id.toString().slice(-8).toUpperCase();
    const finalApprovalDate = vacationRequest.finalApprovalDate
      ? new Date(vacationRequest.finalApprovalDate).toLocaleDateString("en-IN")
      : "N/A";

    const adminComments = vacationRequest.adminApproval?.comments || "";
    const wardenComments = vacationRequest.wardenApproval?.comments || "";

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vacation Request ${statusText}</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid ${actionColor};
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .header h1 {
                color: ${actionColor};
                margin: 0;
                font-size: 28px;
            }
            .status-badge {
                display: inline-block;
                padding: 10px 20px;
                background-color: ${actionColor};
                color: white;
                border-radius: 20px;
                font-size: 14px;
                font-weight: bold;
                margin: 10px 0;
            }
            .ticket-number {
                background-color: #f5f5f5;
                padding: 10px;
                border-radius: 4px;
                text-align: center;
                color: #666;
                margin: 10px 0;
            }
            .section {
                margin: 20px 0;
                padding: 15px;
                background-color: #f9f9f9;
                border-left: 4px solid ${actionColor};
                border-radius: 4px;
            }
            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: ${actionColor};
                margin-bottom: 10px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e0e0e0;
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
            .comments-box {
                background-color: #E8F5E9;
                padding: 15px;
                border-left: 4px solid #4CAF50;
                border-radius: 4px;
                margin: 15px 0;
            }
            .comments-title {
                font-weight: bold;
                color: #2E7D32;
                margin-bottom: 8px;
            }
            .next-steps {
                background-color: #E3F2FD;
                padding: 15px;
                border-left: 4px solid #2196F3;
                border-radius: 4px;
                margin: 15px 0;
            }
            .next-steps-title {
                font-weight: bold;
                color: #1565C0;
                margin-bottom: 8px;
            }
            .next-steps ul {
                margin: 10px 0;
                padding-left: 20px;
            }
            .next-steps li {
                margin: 5px 0;
            }
            .action-button {
                text-align: center;
                margin: 25px 0;
            }
            .btn {
                display: inline-block;
                padding: 12px 30px;
                margin: 0 10px;
                border-radius: 4px;
                text-decoration: none;
                font-weight: bold;
                font-size: 14px;
                background-color: #2196F3;
                color: white;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                color: #666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${emoji} Room Vacation ${statusText}</h1>
            </div>

            <div class="status-badge">${statusText}</div>
            <div class="ticket-number">Ticket #${ticketNumber}</div>

            <div class="section">
                <div class="section-title">🏠 Room Vacation Details</div>
                <div class="detail-row">
                    <span class="detail-label">Room Number:</span>
                    <span class="detail-value">${roomNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Building:</span>
                    <span class="detail-value">${building}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Floor:</span>
                    <span class="detail-value">${floor}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Approval Date:</span>
                    <span class="detail-value">${finalApprovalDate}</span>
                </div>
            </div>

            ${
              approvalType === "approved"
                ? `
            <div class="next-steps">
                <div class="next-steps-title">📋 Next Steps:</div>
                <ul>
                    <li>Your room vacation request has been <strong>approved</strong></li>
                    <li>Please <strong>vacate the room</strong> on or before the approved date</li>
                    <li>Ensure the room is clean and all furniture is intact</li>
                    <li>Contact the hostel office for room checkout procedures</li>
                    <li>Your security deposit will be processed after room inspection</li>
                </ul>
            </div>
            `
                : `
            <div class="next-steps">
                <div class="next-steps-title">📋 Next Steps:</div>
                <ul>
                    <li>Your room vacation request has been <strong>rejected</strong></li>
                    <li>Please contact the hostel office to discuss this decision</li>
                    <li>You may submit a new request after addressing the concerns</li>
                    <li>Reach out to ${building} building warden for clarification</li>
                </ul>
            </div>
            `
            }

            ${
              adminComments
                ? `
            <div class="comments-box">
                <div class="comments-title">👤 Admin Comments:</div>
                <p style="margin: 0;">${adminComments}</p>
            </div>
            `
                : ""
            }

            ${
              wardenComments
                ? `
            <div class="comments-box">
                <div class="comments-title">👤 Warden Comments:</div>
                <p style="margin: 0;">${wardenComments}</p>
            </div>
            `
                : ""
            }

            <div class="footer">
                <p>This is an automated email from Smart Hostel Management System (SHMS)</p>
                <p>© 2024 SHMS. All rights reserved.</p>
                <p>If you have any questions, please contact the hostel office.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Room Booking Acknowledgment Email
  async sendRoomBookingAcknowledgmentEmail(student, room) {
    try {
      const mailOptions = {
        from: `"SHMS - Smart Hostel Management" <${process.env.EMAIL_FROM}>`,
        to: student.email,
        subject: "🏠 Room Booking Confirmation - Smart Hostel",
        html: this.generateRoomBookingTemplate(student, room),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(
        "✅ Room booking acknowledgment email sent to",
        student.email,
        ":",
        info.messageId
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending room booking email:", error);
      return { success: false, error: error.message };
    }
  }

  generateRoomBookingTemplate(student, room) {
    const bookingDate = new Date().toLocaleDateString("en-IN");
    const bookingNumber = (Math.random() * 10000000).toFixed(0);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Room Booking Confirmation</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #4CAF50;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .header h1 {
                color: #4CAF50;
                margin: 0;
                font-size: 24px;
            }
            .booking-number {
                background-color: #E8F5E9;
                padding: 12px;
                border-radius: 4px;
                text-align: center;
                font-weight: bold;
                color: #2E7D32;
                margin: 10px 0;
            }
            .section {
                margin: 20px 0;
                padding: 15px;
                background-color: #f9f9f9;
                border-left: 4px solid #4CAF50;
                border-radius: 4px;
            }
            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #2E7D32;
                margin-bottom: 10px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e0e0e0;
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
            .amenities-list {
                list-style: none;
                padding: 0;
            }
            .amenities-list li {
                padding: 5px 0;
                color: #555;
            }
            .amenities-list li:before {
                content: "✓ ";
                color: #4CAF50;
                font-weight: bold;
            }
            .welcome-box {
                background-color: #E8F5E9;
                padding: 15px;
                border-left: 4px solid #4CAF50;
                border-radius: 4px;
                margin: 15px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                color: #666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🏠 Welcome to Your New Room!</h1>
                <p style="margin: 5px 0; color: #666;">Your room booking has been confirmed</p>
            </div>

            <div class="booking-number">
                Booking #${bookingNumber} | Date: ${bookingDate}
            </div>

            <div class="welcome-box">
                <p style="margin: 0;"><strong>Welcome to SHMS!</strong> We're excited to have you in our hostel. Your room has been successfully booked and is ready for occupancy.</p>
            </div>

            <div class="section">
                <div class="section-title">👤 Student Information</div>
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${student.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Student ID:</span>
                    <span class="detail-value">${
                      student.studentId || "N/A"
                    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Email:</span>
                    <span class="detail-value">${student.email}</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">🏘️ Room Details</div>
                <div class="detail-row">
                    <span class="detail-label">Room Number:</span>
                    <span class="detail-value">${room.roomNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Building:</span>
                    <span class="detail-value">${room.building}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Floor:</span>
                    <span class="detail-value">${room.floor}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Room Type:</span>
                    <span class="detail-value">${
                      room.roomType || "Standard"
                    }</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Capacity:</span>
                    <span class="detail-value">${room.capacity} students</span>
                </div>
            </div>

            ${
              room.amenities && room.amenities.length > 0
                ? `
            <div class="section">
                <div class="section-title">✨ Room Amenities</div>
                <ul class="amenities-list">
                    ${room.amenities
                      .map((amenity) => `<li>${amenity}</li>`)
                      .join("")}
                </ul>
            </div>
            `
                : ""
            }

            <div class="footer">
                <p>This is an automated email from Smart Hostel Management System (SHMS)</p>
                <p>© 2024 SHMS. All rights reserved.</p>
                <p>For any queries, please contact the hostel office.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }

  // Room Vacation Acknowledgment Email
  async sendRoomVacationAcknowledgmentEmail(student, room) {
    try {
      const mailOptions = {
        from: `"SHMS - Smart Hostel Management" <${process.env.EMAIL_FROM}>`,
        to: student.email,
        subject: "📋 Room Vacation Request Acknowledged - Smart Hostel",
        html: this.generateRoomVacationTemplate(student, room),
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(
        "✅ Room vacation acknowledgment email sent to",
        student.email,
        ":",
        info.messageId
      );
      return { success: true, messageId: info.messageId };
    } catch (error) {
      console.error("❌ Error sending room vacation email:", error);
      return { success: false, error: error.message };
    }
  }

  generateRoomVacationTemplate(student, room) {
    const requestDate = new Date().toLocaleDateString("en-IN");
    const ticketNumber = (Math.random() * 10000000).toFixed(0);

    return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Room Vacation Acknowledgment</title>
        <style>
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f4f4f4;
            }
            .container {
                background-color: white;
                border-radius: 8px;
                padding: 30px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #FF9800;
                padding-bottom: 15px;
                margin-bottom: 20px;
            }
            .header h1 {
                color: #FF9800;
                margin: 0;
                font-size: 24px;
            }
            .ticket-number {
                background-color: #FFF3E0;
                padding: 12px;
                border-radius: 4px;
                text-align: center;
                font-weight: bold;
                color: #E65100;
                margin: 10px 0;
            }
            .section {
                margin: 20px 0;
                padding: 15px;
                background-color: #f9f9f9;
                border-left: 4px solid #FF9800;
                border-radius: 4px;
            }
            .section-title {
                font-size: 16px;
                font-weight: bold;
                color: #E65100;
                margin-bottom: 10px;
            }
            .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #e0e0e0;
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
            .info-box {
                background-color: #FFF3E0;
                padding: 15px;
                border-left: 4px solid #FF9800;
                border-radius: 4px;
                margin: 15px 0;
            }
            .info-box strong {
                color: #E65100;
            }
            .checklist {
                list-style: none;
                padding: 0;
                margin: 10px 0;
            }
            .checklist li {
                padding: 8px 0;
                border-bottom: 1px solid #e0e0e0;
            }
            .checklist li:before {
                content: "□ ";
                font-weight: bold;
                color: #FF9800;
                margin-right: 8px;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #e0e0e0;
                color: #666;
                font-size: 12px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>📋 Room Vacation Request Submitted</h1>
                <p style="margin: 5px 0; color: #666;">Your request has been received and is under review</p>
            </div>

            <div class="ticket-number">
                Ticket #${ticketNumber} | Request Date: ${requestDate}
            </div>

            <div class="info-box">
                <p style="margin: 0;"><strong>Request Status:</strong> Your room vacation request has been successfully submitted and is pending approval from the hostel administration.</p>
            </div>

            <div class="section">
                <div class="section-title">👤 Student Information</div>
                <div class="detail-row">
                    <span class="detail-label">Name:</span>
                    <span class="detail-value">${student.name}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Student ID:</span>
                    <span class="detail-value">${
                      student.studentId || "N/A"
                    }</span>
                </div>
            </div>

            <div class="section">
                <div class="section-title">🏘️ Room Information</div>
                <div class="detail-row">
                    <span class="detail-label">Room Number:</span>
                    <span class="detail-value">${room.roomNumber}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Building:</span>
                    <span class="detail-value">${room.building}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Floor:</span>
                    <span class="detail-value">${room.floor}</span>
                </div>
            </div>

            <div class="info-box">
                <strong>⏳ What happens next?</strong>
                <ul class="checklist">
                    <li>Your request will be reviewed by the hostel admin and warden</li>
                    <li>You will receive an approval/rejection email within 2-3 business days</li>
                    <li>Once approved, you must vacate the room within the specified timeframe</li>
                    <li>Room inspection will be conducted before security deposit refund</li>
                </ul>
            </div>

            <div class="footer">
                <p>This is an automated email from Smart Hostel Management System (SHMS)</p>
                <p>© 2024 SHMS. All rights reserved.</p>
                <p>For any queries, contact the hostel office immediately.</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}

module.exports = new EmailService();
