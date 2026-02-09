import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { type AuthTokenPayload, type UserRoleType, UserRole, PrimaryRole, IamAuditAction } from '@change/shared';
import { config } from '../config/index.js';
import { User, type IUser, Tenant } from '../db/models/index.js';
import { UnauthorizedError, ConflictError, NotFoundError } from '../middleware/error-handler.js';
import { AuditService } from './audit.service.js';
import { logIamAction } from './iam-audit.service.js';
import { emailService } from './email.service.js';

export interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: UserRoleType;
  tenantId?: string;
}

export interface LoginParams {
  email: string;
  password: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResult {
  user: Omit<IUser, 'passwordHash'>;
  tokens: TokenPair;
}

/**
 * Authentication Service
 * Handles user registration, login, and token management
 */
export class AuthService {
  /**
   * Generate JWT access token
   */
  static generateAccessToken(user: IUser): string {
    const payload: Omit<AuthTokenPayload, 'iat' | 'exp'> = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      tenantId: user.tenantId?.toString(),
    };

    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn,
    });
  }

  /**
   * Generate JWT refresh token
   */
  static generateRefreshToken(user: IUser): string {
    return jwt.sign(
      { userId: user._id.toString(), type: 'refresh' },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );
  }

  /**
   * Generate token pair
   */
  static generateTokens(user: IUser): TokenPair {
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    // Parse expiry time
    const expiresInMs = this.parseExpiryTime(config.jwt.expiresIn);

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(expiresInMs / 1000),
    };
  }

  /**
   * Parse expiry time string (e.g., "1d", "1h") to milliseconds
   */
  private static parseExpiryTime(expiry: string): number {
    const match = expiry.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 24 * 60 * 60 * 1000; // Default: 1 day
    }

    const value = parseInt(match[1] ?? '1', 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 24 * 60 * 60 * 1000;
    }
  }

  /**
   * Register a new user
   * If no tenantId is provided, automatically creates a tenant for the user
   */
  static async register(params: RegisterParams): Promise<AuthResult> {
    const { email, password, firstName, lastName, role, tenantId: providedTenantId } = params;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    let tenantId = providedTenantId;

    // Validate tenant if provided
    if (tenantId) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant || !tenant.isActive) {
        throw new NotFoundError('Tenant');
      }
    } else {
      // Auto-create a tenant for the new user
      const slug = this.generateTenantSlug(email);
      const tenant = new Tenant({
        name: `${firstName}'s Business`,
        slug,
        isActive: true,
        subscription: {
          plan: 'free',
          status: 'active',
          currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year trial
        },
      });
      await tenant.save();
      tenantId = tenant._id.toString();
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
      firstName,
      lastName,
      role: role ?? UserRole.CLIENT_OWNER,
      primaryRole: PrimaryRole.CUSTOMER, // Default to CUSTOMER for self-registered users
      tenantId: new mongoose.Types.ObjectId(tenantId),
      isActive: true,
      emailVerified: false,
    });

    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Log registration (without full audit context since user just registered)
    await AuditService.logSystemAction({
      action: 'user_register' as const,
      resourceType: 'User',
      resourceId: user._id.toString(),
      newState: {
        email: user.email,
        role: user.role,
        tenantId: user.tenantId?.toString(),
      },
    });

    // Send welcome email (non-blocking - don't fail registration if email fails)
    try {
      await emailService.sendWelcomeEmail({
        recipientEmail: user.email,
        recipientName: user.firstName,
        loginUrl: `${config.appUrl}/login`,
      });
      console.log(`[AuthService.register] Welcome email sent to ${user.email}`);
    } catch (emailError) {
      console.error(`[AuthService.register] Failed to send welcome email (non-blocking):`, emailError);
    }

    return {
      user: user.toPublicJSON() as Omit<IUser, 'passwordHash'>,
      tokens,
    };
  }

  /**
   * Generate a unique tenant slug from email
   */
  private static generateTenantSlug(email: string): string {
    const baseSlug = email.split('@')[0]?.replace(/[^a-z0-9]/gi, '-').toLowerCase() || 'user';
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    return `${baseSlug}-${randomSuffix}`;
  }

  /**
   * Login user
   */
  static async login(params: LoginParams, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const { email, password } = params;
    
    console.log(`[AuthService.login] Attempting login for: ${email}`);

    // Find user with password
    let user;
    try {
      user = await User.findByEmail(email);
      console.log(`[AuthService.login] User found: ${!!user}, tenantId: ${user?.tenantId}`);
    } catch (dbError) {
      console.error(`[AuthService.login] Database error finding user:`, dbError);
      throw dbError;
    }
    if (!user) {
      // Log failed login attempt (unknown user)
      await logIamAction({
        actorId: 'unknown',
        actorEmail: email,
        actorType: 'user',
        action: IamAuditAction.AUTH_LOGIN_FAILED,
        targetType: 'User',
        targetId: 'unknown',
        summary: `Failed login attempt for unknown email: ${email}`,
        ip: ipAddress,
        userAgent: userAgent?.substring(0, 500),
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      // Log failed login attempt (inactive user)
      await logIamAction({
        tenantId: user.tenantId?.toString(),
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorType: 'user',
        action: IamAuditAction.AUTH_LOGIN_FAILED,
        targetType: 'User',
        targetId: user._id.toString(),
        targetName: `${user.firstName} ${user.lastName}`,
        summary: `Failed login - account deactivated: ${user.email}`,
        ip: ipAddress,
        userAgent: userAgent?.substring(0, 500),
      });
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    console.log(`[AuthService.login] Comparing password for user ${user.email}`);
    let isPasswordValid;
    try {
      isPasswordValid = await user.comparePassword(password);
      console.log(`[AuthService.login] Password valid: ${isPasswordValid}`);
    } catch (pwError) {
      console.error(`[AuthService.login] Password comparison error:`, pwError);
      throw pwError;
    }
    if (!isPasswordValid) {
      // Log failed login attempt (wrong password)
      await logIamAction({
        tenantId: user.tenantId?.toString(),
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorType: 'user',
        action: IamAuditAction.AUTH_LOGIN_FAILED,
        targetType: 'User',
        targetId: user._id.toString(),
        targetName: `${user.firstName} ${user.lastName}`,
        summary: `Failed login - invalid password: ${user.email}`,
        ip: ipAddress,
        userAgent: userAgent?.substring(0, 500),
      });
      throw new UnauthorizedError('Invalid email or password');
    }

    // Check if user has a tenant - auto-repair if missing
    if (!user.tenantId) {
      console.warn(`[AuthService.login] User ${user.email} has no tenant - auto-creating one`);
      
      try {
        // Auto-create a tenant for the user
        const slug = this.generateTenantSlug(user.email);
        const tenant = new Tenant({
          name: `${user.firstName}'s Business`,
          slug,
          isActive: true,
          subscription: {
            plan: 'free',
            status: 'active',
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          },
        });
        await tenant.save();
        user.tenantId = tenant._id;
        console.log(`[AuthService.login] Created tenant ${tenant._id} for user ${user.email}`);
      } catch (tenantError) {
        console.error(`[AuthService.login] Failed to create tenant:`, tenantError);
        throw tenantError;
      }
    }

    // Update last login
    try {
      user.lastLoginAt = new Date();
      await user.save();
      console.log(`[AuthService.login] Updated lastLoginAt for user ${user.email}`);
    } catch (saveError) {
      console.error(`[AuthService.login] Failed to save user:`, saveError);
      throw saveError;
    }

    // Generate tokens
    console.log(`[AuthService.login] Generating tokens for user ${user.email}`);
    let tokens;
    try {
      tokens = this.generateTokens(user);
      console.log(`[AuthService.login] Tokens generated successfully`);
    } catch (tokenError) {
      console.error(`[AuthService.login] Failed to generate tokens:`, tokenError);
      throw tokenError;
    }

    // Log successful login to IAM Audit Log (visible in admin portal)
    // These are non-blocking - don't fail login if audit logging fails
    try {
      await logIamAction({
        tenantId: user.tenantId?.toString(),
        actorId: user._id.toString(),
        actorEmail: user.email,
        actorType: 'user',
        action: IamAuditAction.AUTH_LOGIN_SUCCESS,
        targetType: 'User',
        targetId: user._id.toString(),
        targetName: `${user.firstName} ${user.lastName}`,
        summary: `User logged in: ${user.email}`,
        ip: ipAddress,
        userAgent: userAgent?.substring(0, 500),
      });
    } catch (auditError) {
      console.error(`[AuthService.login] IAM audit log failed (non-blocking):`, auditError);
    }

    // Also log to general AuditLog for backward compatibility
    try {
      await AuditService.log(
        {
          tenantId: user.tenantId?.toString(),
          userId: user._id.toString(),
          userEmail: user.email,
          userRole: user.role,
          ipAddress,
          userAgent,
        },
        {
          action: 'user_login' as const,
          resourceType: 'User',
          resourceId: user._id.toString(),
        }
      );
    } catch (auditError2) {
      console.error(`[AuthService.login] General audit log failed (non-blocking):`, auditError2);
    }

    console.log(`[AuthService.login] Login successful for ${user.email}`);
    return {
      user: user.toPublicJSON() as Omit<IUser, 'passwordHash'>,
      tokens,
    };
  }

  /**
   * Refresh access token
   */
  static async refreshToken(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret) as {
        userId: string;
        type: string;
      };

      if (decoded.type !== 'refresh') {
        throw new UnauthorizedError('Invalid refresh token');
      }

      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new UnauthorizedError('User not found or inactive');
      }

      return this.generateTokens(user);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid refresh token');
      }
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId: string): Promise<IUser | null> {
    return User.findById(userId);
  }

  /**
   * Update user password
   */
  static async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) {
      throw new NotFoundError('User');
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    user.passwordHash = newPassword; // Will be hashed by pre-save hook
    await user.save();
  }

  /**
   * Verify token and return payload
   */
  static verifyToken(token: string): AuthTokenPayload {
    try {
      return jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw new UnauthorizedError('Invalid token');
    }
  }
}
