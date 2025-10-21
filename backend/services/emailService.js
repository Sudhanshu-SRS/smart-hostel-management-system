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
}

module.exports = new EmailService();
