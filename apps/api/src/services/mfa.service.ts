/**
 * MFA Service
 * Handles Two-Factor Authentication using TOTP (Time-based One-Time Password)
 * Compatible with Google Authenticator, Authy, and other TOTP apps
 */

import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { User, IUser } from '../db/models/user.model.js';

// Configure TOTP settings
authenticator.options = {
  digits: 6,
  step: 30, // 30-second time step
  window: 1, // Allow 1 step before/after for clock drift
};

export interface MfaSetupResult {
  secret: string;
  qrCodeUrl: string;
  manualEntryKey: string;
  backupCodes: string[];
}

export interface MfaVerifyResult {
  success: boolean;
  message: string;
}

class MfaService {
  private readonly APP_NAME = 'CHANGE Platform';

  /**
   * Generate a new MFA secret for a user
   */
  generateSecret(): string {
    return authenticator.generateSecret(20); // 20 bytes = 160 bits
  }

  /**
   * Generate QR code data URL for authenticator app
   */
  async generateQRCode(email: string, secret: string): Promise<string> {
    const otpauthUrl = authenticator.keyuri(email, this.APP_NAME, secret);
    return QRCode.toDataURL(otpauthUrl);
  }

  /**
   * Format secret for manual entry (groups of 4 characters)
   */
  formatSecretForManualEntry(secret: string): string {
    return secret.match(/.{1,4}/g)?.join(' ') || secret;
  }

  /**
   * Generate backup codes for recovery
   */
  generateBackupCodes(count: number = 8): string[] {
    const codes: string[] = [];
    for (let i = 0; i < count; i++) {
      // Generate 8-character alphanumeric code
      const code = Math.random().toString(36).substring(2, 6).toUpperCase() +
                   '-' +
                   Math.random().toString(36).substring(2, 6).toUpperCase();
      codes.push(code);
    }
    return codes;
  }

  /**
   * Verify a TOTP code
   */
  verifyToken(secret: string, token: string): boolean {
    try {
      return authenticator.verify({ token, secret });
    } catch {
      return false;
    }
  }

  /**
   * Initialize MFA setup for a user
   * Returns the secret and QR code but doesn't enable MFA yet
   */
  async initiateMfaSetup(userId: string): Promise<MfaSetupResult> {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Generate new secret
    const secret = this.generateSecret();

    // Generate QR code
    const qrCodeUrl = await this.generateQRCode(user.email, secret);

    // Format for manual entry
    const manualEntryKey = this.formatSecretForManualEntry(secret);

    // Generate backup codes
    const backupCodes = this.generateBackupCodes();

    // Store the secret temporarily (not enabled yet)
    // We'll store it but keep mfaEnabled = false until verified
    user.mfaSecret = secret;
    await user.save();

    return {
      secret,
      qrCodeUrl,
      manualEntryKey,
      backupCodes,
    };
  }

  /**
   * Complete MFA setup by verifying the first code
   */
  async completeMfaSetup(userId: string, token: string): Promise<MfaVerifyResult> {
    const user = await User.findById(userId).select('+mfaSecret');
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!user.mfaSecret) {
      return { success: false, message: 'MFA setup not initiated' };
    }

    // Verify the token
    const isValid = this.verifyToken(user.mfaSecret, token);
    if (!isValid) {
      return { success: false, message: 'Invalid verification code' };
    }

    // Enable MFA
    user.mfaEnabled = true;
    await user.save();

    return { success: true, message: 'MFA enabled successfully' };
  }

  /**
   * Verify MFA code during login
   */
  async verifyMfaLogin(userId: string, token: string): Promise<MfaVerifyResult> {
    const user = await User.findById(userId).select('+mfaSecret');
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    if (!user.mfaEnabled || !user.mfaSecret) {
      return { success: false, message: 'MFA is not enabled for this user' };
    }

    const isValid = this.verifyToken(user.mfaSecret, token);
    if (!isValid) {
      return { success: false, message: 'Invalid verification code' };
    }

    return { success: true, message: 'MFA verification successful' };
  }

  /**
   * Disable MFA for a user
   */
  async disableMfa(userId: string, password: string): Promise<MfaVerifyResult> {
    const user = await User.findById(userId).select('+passwordHash +mfaSecret');
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Verify password before disabling MFA
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return { success: false, message: 'Invalid password' };
    }

    // Disable MFA
    user.mfaEnabled = false;
    user.mfaSecret = undefined;
    await user.save();

    return { success: true, message: 'MFA disabled successfully' };
  }

  /**
   * Check if user has MFA enabled
   */
  async hasMfaEnabled(userId: string): Promise<boolean> {
    const user = await User.findById(userId);
    return user?.mfaEnabled || false;
  }

  /**
   * Check if MFA is required for user (enforced by admin)
   */
  async isMfaRequired(userId: string): Promise<boolean> {
    const user = await User.findById(userId);
    return user?.mfaEnforced || false;
  }

  /**
   * Get MFA status for a user
   */
  async getMfaStatus(userId: string): Promise<{
    enabled: boolean;
    enforced: boolean;
  }> {
    const user = await User.findById(userId);
    return {
      enabled: user?.mfaEnabled || false,
      enforced: user?.mfaEnforced || false,
    };
  }
}

export const mfaService = new MfaService();
