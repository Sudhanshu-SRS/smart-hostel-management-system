// backend/services/paymentScheduler.js
const cron = require("node-cron");
const paymentNotificationService = require("./paymentNotificationService");
const Payment = require("../models/payment");

class PaymentScheduler {
  init() {
    // Send daily payment reminders at 9:00 AM
    cron.schedule("0 9 * * *", async () => {
      console.log("🔔 Running daily payment reminder job...");
      try {
        await paymentNotificationService.sendBulkPaymentReminders();
        console.log("✅ Daily payment reminders sent successfully");
      } catch (error) {
        console.error("❌ Error sending daily payment reminders:", error);
      }
    });

    // Send overdue alerts to admins every Monday at 10:00 AM
    cron.schedule("0 10 * * 1", async () => {
      console.log("⚠️ Running weekly overdue payment alert job...");
      try {
        await paymentNotificationService.sendOverdueAlertToAdmins();
        console.log("✅ Weekly overdue alerts sent to admins");
      } catch (error) {
        console.error("❌ Error sending overdue alerts:", error);
      }
    });

    // Generate late fees for overdue payments every day at midnight
    cron.schedule("0 0 * * *", async () => {
      console.log("💰 Running late fee generation job...");
      try {
        await this.generateLateFees();
        console.log("✅ Late fees generated successfully");
      } catch (error) {
        console.error("❌ Error generating late fees:", error);
      }
    });

    console.log("📅 Payment scheduler initialized with the following jobs:");
    console.log("  - Daily payment reminders: 9:00 AM");
    console.log("  - Weekly overdue alerts: Monday 10:00 AM");
    console.log("  - Late fee generation: Daily 12:00 AM");
  }

  async generateLateFees() {
    try {
      const overduePayments = await Payment.find({
        status: "pending",
        dueDate: { $lt: new Date() },
        lateFee: 0, // Only apply late fee once
      });

      for (const payment of overduePayments) {
        const daysOverdue = Math.floor(
          (new Date() - new Date(payment.dueDate)) / (1000 * 60 * 60 * 24)
        );

        // Calculate late fee based on days overdue
        let lateFee = 0;
        if (daysOverdue >= 1 && daysOverdue <= 7) {
          lateFee = 50; // ₹50 for 1-7 days
        } else if (daysOverdue >= 8 && daysOverdue <= 15) {
          lateFee = 100; // ₹100 for 8-15 days
        } else if (daysOverdue >= 16 && daysOverdue <= 30) {
          lateFee = 200; // ₹200 for 16-30 days
        } else if (daysOverdue > 30) {
          lateFee = 500; // ₹500 for more than 30 days
        }

        if (lateFee > 0) {
          payment.lateFee = lateFee;
          payment.description = `${payment.description} - Late fee applied: ₹${lateFee}`;
          await payment.save();

          console.log(
            `Late fee of ₹${lateFee} applied to payment ${payment._id} (${daysOverdue} days overdue)`
          );
        }
      }

      console.log(
        `Processed ${overduePayments.length} overdue payments for late fees`
      );
    } catch (error) {
      console.error("Error generating late fees:", error);
      throw error;
    }
  }

  // Manual function to send payment reminders (can be called via API)
  async sendManualReminders() {
    try {
      await paymentNotificationService.sendBulkPaymentReminders();
      return { success: true, message: "Payment reminders sent successfully" };
    } catch (error) {
      console.error("Error sending manual payment reminders:", error);
      return {
        success: false,
        message: "Failed to send payment reminders",
        error: error.message,
      };
    }
  }

  // Manual function to send overdue alerts
  async sendManualOverdueAlerts() {
    try {
      await paymentNotificationService.sendOverdueAlertToAdmins();
      return { success: true, message: "Overdue alerts sent to admins" };
    } catch (error) {
      console.error("Error sending manual overdue alerts:", error);
      return {
        success: false,
        message: "Failed to send overdue alerts",
        error: error.message,
      };
    }
  }
}

module.exports = new PaymentScheduler();
