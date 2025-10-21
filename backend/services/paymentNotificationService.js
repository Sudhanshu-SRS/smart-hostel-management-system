// backend/services/paymentNotificationService.js
const emailService = require("./emailService");
const User = require("../models/db");
const Payment = require("../models/payment");

class PaymentNotificationService {
  // Send payment confirmation email
  async sendPaymentConfirmation(paymentId) {
    try {
      const payment = await Payment.findById(paymentId)
        .populate("user", "name email")
        .populate("room", "roomNumber building");

      if (!payment || !payment.user) {
        console.error("Payment or user not found for confirmation email");
        return;
      }

      const emailData = {
        to: payment.user.email,
        subject: "Payment Confirmation - Smart Hostel Management",
        html: this.generatePaymentConfirmationHTML(payment),
      };

      await emailService.sendEmail(emailData);
      console.log(`Payment confirmation email sent to ${payment.user.email}`);
    } catch (error) {
      console.error("Error sending payment confirmation email:", error);
    }
  }

  // Send payment reminder email
  async sendPaymentReminder(paymentId) {
    try {
      const payment = await Payment.findById(paymentId)
        .populate("user", "name email")
        .populate("room", "roomNumber building");

      if (!payment || !payment.user) {
        console.error("Payment or user not found for reminder email");
        return;
      }

      const daysOverdue = Math.floor(
        (new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24)
      );

      const emailData = {
        to: payment.user.email,
        subject: `Payment Reminder ${
          daysOverdue > 0 ? "- Overdue" : ""
        } - Smart Hostel Management`,
        html: this.generatePaymentReminderHTML(payment, daysOverdue),
      };

      await emailService.sendEmail(emailData);
      console.log(`Payment reminder email sent to ${payment.user.email}`);
    } catch (error) {
      console.error("Error sending payment reminder email:", error);
    }
  }

  // Send overdue payment alerts to admins
  async sendOverdueAlertToAdmins() {
    try {
      const overduePayments = await Payment.find({
        status: "pending",
        dueDate: { $lt: new Date() },
      })
        .populate("user", "name email studentId")
        .populate("room", "roomNumber building");

      if (overduePayments.length === 0) {
        return;
      }

      // Get admin emails
      const admins = await User.find(
        { role: "admin", isActive: true },
        "email name"
      );

      for (const admin of admins) {
        const emailData = {
          to: admin.email,
          subject: `Overdue Payments Alert - ${overduePayments.length} payments overdue`,
          html: this.generateOverdueAlertHTML(overduePayments, admin.name),
        };

        await emailService.sendEmail(emailData);
      }

      console.log(`Overdue payment alerts sent to ${admins.length} admins`);
    } catch (error) {
      console.error("Error sending overdue payment alerts:", error);
    }
  }

  // Send bulk payment reminders
  async sendBulkPaymentReminders() {
    try {
      const upcomingPayments = await Payment.find({
        status: "pending",
        dueDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Next 3 days
        },
      }).populate("user", "name email");

      const overduePayments = await Payment.find({
        status: "pending",
        dueDate: { $lt: new Date() },
      }).populate("user", "name email");

      // Send upcoming payment reminders
      for (const payment of upcomingPayments) {
        await this.sendPaymentReminder(payment._id);
      }

      // Send overdue payment reminders
      for (const payment of overduePayments) {
        await this.sendPaymentReminder(payment._id);
      }

      console.log(
        `Sent ${upcomingPayments.length} upcoming and ${overduePayments.length} overdue payment reminders`
      );
    } catch (error) {
      console.error("Error sending bulk payment reminders:", error);
    }
  }

  // Generate payment confirmation HTML template
  generatePaymentConfirmationHTML(payment) {
    const formatAmount = (amount) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Confirmation</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #1976d2, #42a5f5); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .payment-details { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .success-badge { background-color: #4caf50; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; font-size: 12px; font-weight: bold; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Confirmed!</h1>
            <div class="success-badge">✓ PAID</div>
          </div>
          
          <div class="content">
            <p>Dear ${payment.user.name},</p>
            <p>Your payment has been successfully processed. Here are the details:</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <div class="detail-row">
                <span><strong>Transaction ID:</strong></span>
                <span>${payment.transactionId || "N/A"}</span>
              </div>
              <div class="detail-row">
                <span><strong>Amount Paid:</strong></span>
                <span><strong>${formatAmount(
                  payment.finalAmount
                )}</strong></span>
              </div>
              <div class="detail-row">
                <span><strong>Payment Type:</strong></span>
                <span>${payment.paymentType
                  .replace("_", " ")
                  .toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span><strong>Payment Method:</strong></span>
                <span>${payment.paymentMethod.toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span><strong>Date Paid:</strong></span>
                <span>${formatDate(payment.paidDate)}</span>
              </div>
              ${
                payment.room
                  ? `
              <div class="detail-row">
                <span><strong>Room:</strong></span>
                <span>${payment.room.roomNumber} - ${payment.room.building}</span>
              </div>
              `
                  : ""
              }
              <div class="detail-row">
                <span><strong>Description:</strong></span>
                <span>${payment.description}</span>
              </div>
            </div>
            
            <p>Thank you for your payment. If you have any questions, please contact the hostel administration.</p>
          </div>
          
          <div class="footer">
            <p>Smart Hostel Management System</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate payment reminder HTML template
  generatePaymentReminderHTML(payment, daysOverdue) {
    const formatAmount = (amount) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
    };

    const formatDate = (date) => {
      return new Date(date).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    };

    const isOverdue = daysOverdue > 0;
    const urgencyColor = isOverdue ? "#f44336" : "#ff9800";
    const urgencyText = isOverdue ? "OVERDUE" : "DUE SOON";

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Reminder</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, ${urgencyColor}, #ff5722); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .payment-details { background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; }
          .detail-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
          .warning-badge { background-color: ${urgencyColor}; color: white; padding: 5px 15px; border-radius: 20px; display: inline-block; font-size: 12px; font-weight: bold; }
          .pay-button { background-color: #4caf50; color: white; padding: 15px 30px; border: none; border-radius: 5px; font-size: 16px; font-weight: bold; text-decoration: none; display: inline-block; margin: 20px 0; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Reminder</h1>
            <div class="warning-badge">${urgencyText}</div>
          </div>
          
          <div class="content">
            <p>Dear ${payment.user.name},</p>
            <p>${
              isOverdue
                ? `Your payment is overdue by ${daysOverdue} days. Please make the payment immediately to avoid any inconvenience.`
                : "This is a friendly reminder that your payment is due soon. Please make the payment before the due date."
            }</p>
            
            <div class="payment-details">
              <h3>Payment Details</h3>
              <div class="detail-row">
                <span><strong>Amount Due:</strong></span>
                <span><strong style="color: ${urgencyColor};">${formatAmount(
      payment.finalAmount
    )}</strong></span>
              </div>
              <div class="detail-row">
                <span><strong>Payment Type:</strong></span>
                <span>${payment.paymentType
                  .replace("_", " ")
                  .toUpperCase()}</span>
              </div>
              <div class="detail-row">
                <span><strong>Due Date:</strong></span>
                <span style="color: ${urgencyColor};">${formatDate(
      payment.dueDate
    )}</span>
              </div>
              ${
                payment.room
                  ? `
              <div class="detail-row">
                <span><strong>Room:</strong></span>
                <span>${payment.room.roomNumber} - ${payment.room.building}</span>
              </div>
              `
                  : ""
              }
              <div class="detail-row">
                <span><strong>Description:</strong></span>
                <span>${payment.description}</span>
              </div>
            </div>
            
            <div style="text-align: center;">
              <a href="#" class="pay-button">Pay Now</a>
            </div>
            
            <p>Please contact the hostel administration if you have any questions or concerns about this payment.</p>
            
            ${
              isOverdue
                ? `
            <div style="background-color: #ffebee; border-left: 4px solid #f44336; padding: 15px; margin: 20px 0;">
              <strong>Important:</strong> Late payment may result in additional charges or restrictions on hostel services.
            </div>
            `
                : ""
            }
          </div>
          
          <div class="footer">
            <p>Smart Hostel Management System</p>
            <p>This is an automated email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Generate overdue alert HTML for admins
  generateOverdueAlertHTML(overduePayments, adminName) {
    const formatAmount = (amount) => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
      }).format(amount);
    };

    const totalOverdueAmount = overduePayments.reduce(
      (sum, payment) => sum + payment.finalAmount,
      0
    );

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Overdue Payments Alert</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
          .container { max-width: 800px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #f44336, #ff5722); color: white; padding: 30px; text-align: center; }
          .content { padding: 30px; }
          .summary { background-color: #ffebee; border-left: 4px solid #f44336; padding: 20px; margin: 20px 0; }
          .payment-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .payment-table th, .payment-table td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          .payment-table th { background-color: #f8f9fa; font-weight: bold; }
          .overdue-days { color: #f44336; font-weight: bold; }
          .footer { background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>⚠️ Overdue Payments Alert</h1>
            <p>Administrative Notification</p>
          </div>
          
          <div class="content">
            <p>Dear ${adminName},</p>
            
            <div class="summary">
              <h3>Summary</h3>
              <p><strong>Total Overdue Payments:</strong> ${
                overduePayments.length
              }</p>
              <p><strong>Total Amount:</strong> ${formatAmount(
                totalOverdueAmount
              )}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleDateString(
                "en-IN"
              )}</p>
            </div>
            
            <h3>Overdue Payment Details</h3>
            <table class="payment-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Room</th>
                  <th>Payment Type</th>
                  <th>Amount</th>
                  <th>Due Date</th>
                  <th>Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                ${overduePayments
                  .map((payment) => {
                    const daysOverdue = Math.floor(
                      (new Date() - new Date(payment.dueDate)) /
                        (1000 * 60 * 60 * 24)
                    );
                    return `
                    <tr>
                      <td>${payment.user?.name || "N/A"}</td>
                      <td>${payment.user?.studentId || "N/A"}</td>
                      <td>${
                        payment.room
                          ? `${payment.room.roomNumber} - ${payment.room.building}`
                          : "N/A"
                      }</td>
                      <td>${payment.paymentType
                        .replace("_", " ")
                        .toUpperCase()}</td>
                      <td>${formatAmount(payment.finalAmount)}</td>
                      <td>${new Date(payment.dueDate).toLocaleDateString(
                        "en-IN"
                      )}</td>
                      <td class="overdue-days">${daysOverdue} days</td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
            
            <p>Please take appropriate action to follow up on these overdue payments. You may want to:</p>
            <ul>
              <li>Send individual payment reminders to students</li>
              <li>Contact students directly via phone or in-person</li>
              <li>Apply late fees if applicable</li>
              <li>Review payment policies and enforcement procedures</li>
            </ul>
          </div>
          
          <div class="footer">
            <p>Smart Hostel Management System - Administrative Alert</p>
            <p>This is an automated email. Generated at ${new Date().toLocaleString(
              "en-IN"
            )}</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

module.exports = new PaymentNotificationService();
