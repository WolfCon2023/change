import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { type AuthTokenPayload, type UserRoleType, UserRole, IamAuditAction } from '@change/shared';
import { config } from '../config/index.js';
import { User, type IUser, Tenant } from '../db/models/index.js';
import { UnauthorizedError, ConflictError, NotFoundError } from '../middleware/error-handler.js';
import { AuditService } from './audit.service.js';
import { logIamAction } from './iam-audit.service.js';

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
   */
  static async register(params: RegisterParams): Promise<AuthResult> {
    const { email, password, firstName, lastName, role, tenantId } = params;

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Validate tenant if provided
    if (tenantId) {
      const tenant = await Tenant.findById(tenantId);
      if (!tenant || !tenant.isActive) {
        throw new NotFoundError('Tenant');
      }
    }

    // Create user
    const user = new User({
      email: email.toLowerCase(),
      passwordHash: password, // Will be hashed by pre-save hook
      firstName,
      lastName,
      role: role ?? UserRole.CLIENT_OWNER,
      tenantId: tenantId ? new mongoose.Types.ObjectId(tenantId) : undefined,
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

    return {
      user: user.toPublicJSON() as Omit<IUser, 'passwordHash'>,
      tokens,
    };
  }

  /**
   * Login user
   */
  static async login(params: LoginParams, ipAddress?: string, userAgent?: string): Promise<AuthResult> {
    const { email, password } = params;

    // Find user with password
    const user = await User.findByEmail(email);
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
    const isPasswordValid = await user.comparePassword(password);
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

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate tokens
    const tokens = this.generateTokens(user);

    // Log successful login to IAM Audit Log (visible in admin portal)
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

    // Also log to general AuditLog for backward compatibility
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
