// backend/services/notificationService.js
const emailService = require("./emailService");
const twilio = require("twilio");

class NotificationService {
  constructor() {
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  // Send complaint notification to staff
  async sendComplaintNotification(complaint, type = "new") {
    try {
      await complaint.populate([
        { path: "user", select: "name email studentId phoneNumber" },
        { path: "assignedTo", select: "name email" },
        { path: "room", select: "roomNumber building floor" },
      ]);

      const notifications = [];

      switch (type) {
        case "new":
          notifications.push(
            await this.sendNewComplaintNotification(complaint)
          );
          break;
        case "assigned":
          notifications.push(
            await this.sendComplaintAssignedNotification(complaint)
          );
          break;
        case "resolved":
          notifications.push(
            await this.sendComplaintResolvedNotification(complaint)
          );
          break;
        case "escalated":
          notifications.push(
            await this.sendComplaintEscalatedNotification(complaint)
          );
          break;
        case "overdue":
          notifications.push(
            await this.sendComplaintOverdueNotification(complaint)
          );
          break;
      }

      return { success: true, notifications };
    } catch (error) {
      console.error(`Complaint ${type} notification error:`, error);
      return { success: false, error: error.message };
    }
  }

  // Send new complaint notification to wardens and admins
  async sendNewComplaintNotification(complaint) {
    try {
      const User = require("../models/db");
      const staff = await User.find({
        role: { $in: ["admin", "warden"] },
        isActive: true,
      });

      const emailPromises = staff.map((staffMember) =>
        emailService.sendEmail({
          to: staffMember.email,
          subject: `New Complaint: ${
            complaint.title
          } [${complaint.priority.toUpperCase()}]`,
          html: this.generateComplaintEmailTemplate(
            complaint,
            "new",
            staffMember
          ),
        })
      );

      await Promise.all(emailPromises);
      return { success: true, recipientCount: staff.length };
    } catch (error) {
      console.error("New complaint notification error:", error);
      return { success: false, error: error.message };
    }
  }

  // Send complaint assigned notification
  async sendComplaintAssignedNotification(complaint) {
    try {
      const emailPromises = [];

      // Notify the assigned staff member
      if (complaint.assignedTo) {
        emailPromises.push(
          emailService.sendEmail({
            to: complaint.assignedTo.email,
            subject: `Complaint Assigned: ${complaint.title}`,
            html: this.generateComplaintEmailTemplate(
              complaint,
              "assigned",
              complaint.assignedTo
            ),
          })
        );
      }

      // Notify the student
      emailPromises.push(
        emailService.sendEmail({
          to: complaint.user.email,
          subject: `Your complaint has been assigned`,
          html: this.generateComplaintEmailTemplate(
            complaint,
            "assigned_student",
            complaint.user
          ),
        })
      );

      await Promise.all(emailPromises);
      return { success: true, recipientCount: emailPromises.length };
    } catch (error) {
      console.error("Complaint assigned notification error:", error);
      return { success: false, error: error.message };
    }
  }

  // Send complaint resolved notification
  async sendComplaintResolvedNotification(complaint) {
    try {
      const email = await emailService.sendEmail({
        to: complaint.user.email,
        subject: `Your complaint has been resolved: ${complaint.title}`,
        html: this.generateComplaintEmailTemplate(
          complaint,
          "resolved",
          complaint.user
        ),
      });

      return { success: true, messageId: email.messageId };
    } catch (error) {
      console.error("Complaint resolved notification error:", error);
      return { success: false, error: error.message };
    }
  }

  // Send complaint escalated notification
  async sendComplaintEscalatedNotification(complaint) {
    try {
      const User = require("../models/db");
      const admins = await User.find({
        role: "admin",
        isActive: true,
      });

      const emailPromises = admins.map((admin) =>
        emailService.sendEmail({
          to: admin.email,
          subject: `ESCALATED: ${
            complaint.title
          } [${complaint.priority.toUpperCase()}]`,
          html: this.generateComplaintEmailTemplate(
            complaint,
            "escalated",
            admin
          ),
        })
      );

      await Promise.all(emailPromises);
      return { success: true, recipientCount: admins.length };
    } catch (error) {
      console.error("Complaint escalated notification error:", error);
      return { success: false, error: error.message };
    }
  }

  // Send overdue complaint notification
  async sendComplaintOverdueNotification(complaint) {
    try {
      const User = require("../models/db");
      const staff = await User.find({
        role: { $in: ["admin", "warden"] },
        isActive: true,
      });

      const emailPromises = staff.map((staffMember) =>
        emailService.sendEmail({
          to: staffMember.email,
          subject: `OVERDUE: ${complaint.title} - Immediate Action Required`,
          html: this.generateComplaintEmailTemplate(
            complaint,
            "overdue",
            staffMember
          ),
        })
      );

      await Promise.all(emailPromises);
      return { success: true, recipientCount: staff.length };
    } catch (error) {
      console.error("Overdue complaint notification error:", error);
      return { success: false, error: error.message };
    }
  }

  // Send report generation notification
  async sendReportNotification(reportType, recipient, reportData, downloadUrl) {
    try {
      const email = await emailService.sendEmail({
        to: recipient.email,
        subject: `Report Generated: ${reportType.toUpperCase()}`,
        html: this.generateReportEmailTemplate(
          reportType,
          recipient,
          reportData,
          downloadUrl
        ),
      });

      return { success: true, messageId: email.messageId };
    } catch (error) {
      console.error("Report notification error:", error);
      return { success: false, error: error.message };
    }
  }

  // Generate complaint email templates
  generateComplaintEmailTemplate(complaint, type, recipient) {
    const baseUrl = process.env.CLIENT_URL || "http://localhost:3000";
    const complaintUrl = `${baseUrl}/complaints/${complaint._id}`;

    const templates = {
      new: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f44336, #e53935); padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">🚨 New Complaint Submitted</h2>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <h3 style="color: #333;">Complaint Details</h3>
            <p><strong>Title:</strong> ${complaint.title}</p>
            <p><strong>Priority:</strong> <span style="color: ${this.getPriorityColor(
              complaint.priority
            )}; font-weight: bold;">${complaint.priority.toUpperCase()}</span></p>
            <p><strong>Category:</strong> ${complaint.category}</p>
            <p><strong>Student:</strong> ${complaint.user.name} (${
        complaint.user.studentId
      })</p>
            <p><strong>Room:</strong> ${complaint.room?.roomNumber || "N/A"}</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
            <p><strong>Submitted:</strong> ${new Date(
              complaint.createdAt
            ).toLocaleString()}</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${complaintUrl}" style="background: #f44336; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">View Complaint</a>
            </div>
          </div>
        </div>
      `,
      assigned: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2196f3, #1976d2); padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">📋 Complaint Assigned</h2>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <p>Hello ${recipient.name},</p>
            <p>A complaint has been assigned to you:</p>
            <h3 style="color: #333;">${complaint.title}</h3>
            <p><strong>Priority:</strong> <span style="color: ${this.getPriorityColor(
              complaint.priority
            )}; font-weight: bold;">${complaint.priority.toUpperCase()}</span></p>
            <p><strong>Student:</strong> ${complaint.user.name} (${
        complaint.user.studentId
      })</p>
            <p><strong>Description:</strong> ${complaint.description}</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${complaintUrl}" style="background: #2196f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Take Action</a>
            </div>
          </div>
        </div>
      `,
      assigned_student: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4caf50, #388e3c); padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">✅ Complaint Assigned</h2>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <p>Hello ${recipient.name},</p>
            <p>Good news! Your complaint has been assigned to our maintenance team:</p>
            <h3 style="color: #333;">${complaint.title}</h3>
            <p><strong>Assigned to:</strong> ${complaint.assignedTo?.name}</p>
            <p><strong>Status:</strong> In Progress</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${complaintUrl}" style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Track Progress</a>
            </div>
          </div>
        </div>
      `,
      resolved: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #4caf50, #388e3c); padding: 20px; text-align: center;">
            <h2 style="color: white; margin: 0;">✅ Complaint Resolved</h2>
          </div>
          <div style="padding: 20px; background: #f5f5f5;">
            <p>Hello ${recipient.name},</p>
            <p>Your complaint has been resolved:</p>
            <h3 style="color: #333;">${complaint.title}</h3>
            ${
              complaint.resolutionNotes
                ? `<p><strong>Resolution Notes:</strong> ${complaint.resolutionNotes}</p>`
                : ""
            }
            <p><strong>Resolved on:</strong> ${new Date(
              complaint.actualResolutionDate
            ).toLocaleString()}</p>
            
            <p>Please take a moment to rate the resolution quality and provide feedback.</p>
            
            <div style="text-align: center; margin: 20px 0;">
              <a href="${complaintUrl}" style="background: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Provide Feedback</a>
            </div>
          </div>
        </div>
      `,
    };

    return templates[type] || templates.new;
  }

  // Generate report email template
  generateReportEmailTemplate(reportType, recipient, reportData, downloadUrl) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #673ab7, #512da8); padding: 20px; text-align: center;">
          <h2 style="color: white; margin: 0;">📊 Report Generated</h2>
        </div>
        <div style="padding: 20px; background: #f5f5f5;">
          <p>Hello ${recipient.name},</p>
          <p>Your requested ${reportType} report has been generated successfully.</p>
          
          <h3 style="color: #333;">Report Summary</h3>
          <p><strong>Type:</strong> ${reportType.toUpperCase()}</p>
          <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
          <p><strong>Data Period:</strong> ${
            reportData.period || "All Time"
          }</p>
          
          ${
            downloadUrl
              ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${downloadUrl}" style="background: #673ab7; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px;">Download Report</a>
            </div>
          `
              : ""
          }
        </div>
      </div>
    `;
  }

  // Get priority color helper
  getPriorityColor(priority) {
    const colors = {
      low: "#4caf50",
      medium: "#ff9800",
      high: "#f44336",
      urgent: "#9c27b0",
    };
    return colors[priority] || "#666";
  }

  // Real-time notification helpers
  emitSocketNotification(io, event, data) {
    if (io) {
      io.emit(event, data);
    }
  }

  emitToRole(io, roles, event, data) {
    if (io && Array.isArray(roles)) {
      roles.forEach((role) => {
        io.to(role).emit(event, data);
      });
    }
  }

  emitToUser(io, userId, event, data) {
    if (io && userId) {
      io.to(`user_${userId}`).emit(event, data);
    }
  }
}

module.exports = new NotificationService();
