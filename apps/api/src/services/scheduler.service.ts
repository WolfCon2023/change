/**
 * Scheduler Service
 * Handles running periodic tasks like notification checks
 */

import { notificationService } from './notification.service.js';

class SchedulerService {
  private notificationInterval: NodeJS.Timeout | null = null;
  private isRunning = false;

  /**
   * Start the scheduler
   * By default, checks for notifications every hour
   */
  start(intervalHours: number = 1): void {
    if (this.isRunning) {
      console.log('[Scheduler] Already running');
      return;
    }

    const intervalMs = intervalHours * 60 * 60 * 1000;
    
    console.log(`[Scheduler] Starting notification scheduler (every ${intervalHours} hour(s))`);
    
    // Delay first check by 30 seconds to let server fully initialize
    setTimeout(() => {
      this.runNotificationCheck();
    }, 30000);
    
    // Then run periodically
    this.notificationInterval = setInterval(() => {
      this.runNotificationCheck();
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.notificationInterval) {
      clearInterval(this.notificationInterval);
      this.notificationInterval = null;
    }
    this.isRunning = false;
    console.log('[Scheduler] Stopped');
  }

  /**
   * Run the notification check
   */
  private async runNotificationCheck(): Promise<void> {
    console.log(`[Scheduler] Running notification check at ${new Date().toISOString()}`);
    
    try {
      const result = await notificationService.sendComplianceReminders();
      console.log(`[Scheduler] Notification check complete:`, {
        sent: result.sent,
        failed: result.failed,
        skipped: result.skipped,
      });
    } catch (error) {
      console.error('[Scheduler] Error during notification check:', error);
    }
  }

  /**
   * Manually trigger a notification check
   */
  async triggerNotificationCheck(): Promise<ReturnType<typeof notificationService.sendComplianceReminders>> {
    console.log('[Scheduler] Manual notification check triggered');
    return notificationService.sendComplianceReminders();
  }

  /**
   * Get scheduler status
   */
  getStatus(): { isRunning: boolean; nextCheck?: Date } {
    return {
      isRunning: this.isRunning,
    };
  }
}

// Export singleton instance
export const schedulerService = new SchedulerService();
