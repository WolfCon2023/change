/**
 * Notification Service
 * Handles checking deadlines and sending reminder notifications
 */

import { BusinessProfile, User, Tenant } from '../db/models/index.js';
import { emailService, type ComplianceReminderData } from './email.service.js';
import { config } from '../config/index.js';

export interface NotificationResult {
  sent: number;
  failed: number;
  skipped: number;
  details: Array<{
    userId: string;
    email: string;
    itemTitle: string;
    success: boolean;
    reason?: string;
  }>;
}

class NotificationService {
  /**
   * Check all compliance items and send reminders for upcoming deadlines
   * Sends reminders at: 14 days, 7 days, 3 days, 1 day, and when overdue
   */
  async sendComplianceReminders(): Promise<NotificationResult> {
    const result: NotificationResult = {
      sent: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    console.log('[NotificationService] Starting compliance reminder check...');

    try {
      // Get all active business profiles with compliance items
      const profiles = await BusinessProfile.find({
        'complianceItems.0': { $exists: true }, // Has at least one compliance item
      }).lean();

      console.log(`[NotificationService] Found ${profiles.length} profiles with compliance items`);

      const now = new Date();
      const reminderDays = [14, 7, 3, 1, 0, -1, -3, -7]; // Days before (positive) or after (negative) due date

      for (const profile of profiles) {
        // Get the user associated with this profile
        const user = await User.findOne({ tenantId: profile.tenantId }).lean();
        if (!user || !user.isActive) {
          result.skipped++;
          continue;
        }

        // Check if user has email notifications enabled
        const prefs = user.notificationPreferences || {
          emailNotifications: true,
          complianceReminders: true,
        };
        
        if (!prefs.emailNotifications || !prefs.complianceReminders) {
          result.skipped++;
          continue;
        }

        // Get tenant for business name
        const tenant = await Tenant.findById(profile.tenantId).lean();
        const businessName = profile.businessName || tenant?.name || 'Your Business';

        // Check each compliance item
        for (const item of profile.complianceItems || []) {
          if (item.status === 'completed') continue;
          if (!item.dueDate) continue;

          const dueDate = new Date(item.dueDate);
          const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

          // Check if we should send a reminder for this item today
          const shouldSendReminder = this.shouldSendReminder(daysUntilDue, reminderDays, item.lastReminderSent);

          if (!shouldSendReminder) continue;

          // Prepare reminder data
          const reminderData: ComplianceReminderData = {
            recipientName: `${user.firstName} ${user.lastName}`,
            recipientEmail: user.email,
            businessName,
            itemTitle: item.title,
            itemDescription: item.description,
            dueDate,
            daysUntilDue,
            dashboardUrl: `${config.appUrl}/app/operations?view=compliance`,
          };

          // Send the reminder
          try {
            const success = await emailService.sendComplianceReminder(reminderData);

            if (success) {
              result.sent++;
              result.details.push({
                userId: user._id.toString(),
                email: user.email,
                itemTitle: item.title,
                success: true,
              });

              // Update lastReminderSent on the compliance item
              await BusinessProfile.updateOne(
                { _id: profile._id, 'complianceItems._id': item._id },
                { $set: { 'complianceItems.$.lastReminderSent': new Date() } }
              );
            } else {
              result.failed++;
              result.details.push({
                userId: user._id.toString(),
                email: user.email,
                itemTitle: item.title,
                success: false,
                reason: 'Email service returned false',
              });
            }
          } catch (error) {
            result.failed++;
            result.details.push({
              userId: user._id.toString(),
              email: user.email,
              itemTitle: item.title,
              success: false,
              reason: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }
      }
    } catch (error) {
      console.error('[NotificationService] Error during compliance reminder check:', error);
    }

    console.log(`[NotificationService] Reminder check complete. Sent: ${result.sent}, Failed: ${result.failed}, Skipped: ${result.skipped}`);
    return result;
  }

  /**
   * Determine if we should send a reminder based on days until due
   */
  private shouldSendReminder(
    daysUntilDue: number,
    reminderDays: number[],
    lastReminderSent?: Date
  ): boolean {
    // Check if this is a reminder day
    const isReminderDay = reminderDays.some(day => {
      if (day > 0) {
        // For positive days (before due), allow a range
        return daysUntilDue >= day - 1 && daysUntilDue <= day;
      } else if (day === 0) {
        // Due today
        return daysUntilDue === 0;
      } else {
        // Overdue - send weekly reminders
        return daysUntilDue <= day && daysUntilDue > day - 7;
      }
    });

    if (!isReminderDay) return false;

    // Don't send more than one reminder per day
    if (lastReminderSent) {
      const lastSent = new Date(lastReminderSent);
      const hoursSinceLastReminder = (Date.now() - lastSent.getTime()) / (1000 * 60 * 60);
      if (hoursSinceLastReminder < 20) return false; // At least 20 hours between reminders
    }

    return true;
  }

  /**
   * Send an immediate reminder for a specific compliance item
   */
  async sendImmediateReminder(
    profileId: string,
    complianceItemId: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const profile = await BusinessProfile.findById(profileId).lean();
      if (!profile) {
        return { success: false, message: 'Business profile not found' };
      }

      const item = profile.complianceItems?.find(
        (i) => i._id?.toString() === complianceItemId
      );
      if (!item) {
        return { success: false, message: 'Compliance item not found' };
      }

      const user = await User.findOne({ tenantId: profile.tenantId }).lean();
      if (!user) {
        return { success: false, message: 'User not found' };
      }

      const tenant = await Tenant.findById(profile.tenantId).lean();
      const businessName = profile.businessName || tenant?.name || 'Your Business';

      const dueDate = item.dueDate ? new Date(item.dueDate) : new Date();
      const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      const reminderData: ComplianceReminderData = {
        recipientName: `${user.firstName} ${user.lastName}`,
        recipientEmail: user.email,
        businessName,
        itemTitle: item.title,
        itemDescription: item.description,
        dueDate,
        daysUntilDue,
        dashboardUrl: `${config.appUrl}/app/operations?view=compliance`,
      };

      const success = await emailService.sendComplianceReminder(reminderData);

      if (success) {
        // Update lastReminderSent
        await BusinessProfile.updateOne(
          { _id: profileId, 'complianceItems._id': complianceItemId },
          { $set: { 'complianceItems.$.lastReminderSent': new Date() } }
        );
        return { success: true, message: 'Reminder sent successfully' };
      } else {
        return { success: false, message: 'Failed to send email' };
      }
    } catch (error) {
      console.error('[NotificationService] Error sending immediate reminder:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
