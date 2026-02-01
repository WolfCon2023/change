import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserRole, RoleHierarchy, type UserRoleType, type AuthTokenPayload } from '@change/shared';
import { config } from '../config/index.js';
import { UnauthorizedError, ForbiddenError } from './error-handler.js';
import { User, type IUser } from '../db/models/index.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenPayload;
      currentUser?: IUser;
      tenantId?: string;
    }
  }
}

/**
 * Middleware to authenticate JWT tokens
 * TRS-ARCH-002: Authentication baseline
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new UnauthorizedError('No token provided');
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
      req.user = decoded;
      req.tenantId = decoded.tenantId;
      next();
    } catch (err) {
      if (err instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      if (err instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      throw err;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Optional authentication - doesn't fail if no token
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
      req.user = decoded;
      req.tenantId = decoded.tenantId;
    } catch {
      // Ignore invalid tokens for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to load full user object from database
 */
export async function loadUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      return next();
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedError('User account is deactivated');
    }

    req.currentUser = user;
    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Role-based access control middleware
 * TRS-ARCH-002: RBAC implementation
 * 
 * @param allowedRoles - Array of roles allowed to access the route
 */
export function requireRoles(...allowedRoles: UserRoleType[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRole = req.user.role;
      
      if (!allowedRoles.includes(userRole)) {
        throw new ForbiddenError(`Access denied. Required roles: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if user has minimum role level
 * Uses role hierarchy for comparison
 */
export function requireMinRole(minRole: UserRoleType) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const userRoleLevel = RoleHierarchy[req.user.role] ?? 0;
      const minRoleLevel = RoleHierarchy[minRole] ?? 0;

      if (userRoleLevel < minRoleLevel) {
        throw new ForbiddenError(`Insufficient permissions. Minimum role required: ${minRole}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if user is a platform-level user (advisor, admin)
 */
export function requirePlatformRole(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const platformRoles: UserRoleType[] = [
      UserRole.ADVISOR,
      UserRole.PROGRAM_ADMIN,
      UserRole.SYSTEM_ADMIN,
    ];

    if (!platformRoles.includes(req.user.role)) {
      throw new ForbiddenError('Platform role required');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user is a client-level user
 */
export function requireClientRole(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    const clientRoles: UserRoleType[] = [
      UserRole.CLIENT_OWNER,
      UserRole.CLIENT_ADMIN,
      UserRole.CLIENT_CONTRIBUTOR,
    ];

    if (!clientRoles.includes(req.user.role)) {
      throw new ForbiddenError('Client role required');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check if user is a system admin
 */
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== UserRole.SYSTEM_ADMIN) {
      throw new ForbiddenError('System admin role required');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Helper to check role in code
 */
export function hasRole(user: AuthTokenPayload | undefined, ...roles: UserRoleType[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}

/**
 * Helper to check minimum role level
 */
export function hasMinRole(user: AuthTokenPayload | undefined, minRole: UserRoleType): boolean {
  if (!user) return false;
  const userRoleLevel = RoleHierarchy[user.role] ?? 0;
  const minRoleLevel = RoleHierarchy[minRole] ?? 0;
  return userRoleLevel >= minRoleLevel;
}
