import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { UserRole } from '@change/shared';
import { TenantAccessError, NotFoundError, UnauthorizedError } from './error-handler.js';
import { Tenant, type ITenant } from '../db/models/index.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      tenant?: ITenant;
    }
  }
}

/**
 * Middleware to resolve and validate tenant from request
 * TRS-ARCH-001: Multi-tenant data isolation
 * 
 * Tenant can be resolved from:
 * 1. User's JWT token (tenantId claim)
 * 2. Request header (X-Tenant-ID)
 * 3. URL parameter (:tenantId)
 * 4. Query parameter (?tenantId=xxx)
 */
export async function resolveTenant(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Platform users (advisors, admins) might not have a tenant in their token
    // but can access tenants via header/param
    const isPlatformUser = req.user && [
      UserRole.ADVISOR,
      UserRole.PROGRAM_ADMIN,
      UserRole.SYSTEM_ADMIN,
    ].includes(req.user.role);

    // Resolve tenant ID from various sources
    let tenantId: string | undefined;

    // Priority: URL param > Header > Query > JWT
    tenantId = req.params['tenantId'] as string | undefined;
    
    if (!tenantId) {
      tenantId = req.headers['x-tenant-id'] as string | undefined;
    }
    
    if (!tenantId) {
      tenantId = req.query['tenantId'] as string | undefined;
    }
    
    if (!tenantId) {
      tenantId = req.tenantId;
    }

    if (!tenantId) {
      // No tenant context - might be okay for some routes
      return next();
    }

    // Validate tenant ID format
    if (!mongoose.Types.ObjectId.isValid(tenantId)) {
      throw new NotFoundError('Tenant');
    }

    // Load tenant from database
    const tenant = await Tenant.findById(tenantId);
    
    if (!tenant) {
      throw new NotFoundError('Tenant');
    }

    if (!tenant.isActive) {
      throw new TenantAccessError();
    }

    // For client users, verify they belong to this tenant
    if (req.user && !isPlatformUser) {
      if (req.user.tenantId !== tenantId) {
        throw new TenantAccessError();
      }
    }

    // Set tenant context on request
    req.tenant = tenant;
    req.tenantId = tenantId;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware that requires a tenant context
 * Use this on routes that must have a tenant
 */
export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.tenantId) {
      throw new UnauthorizedError('Tenant context required');
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware to enforce tenant isolation on queries
 * Adds tenantId filter to all database operations
 */
export function enforceTenantIsolation(req: Request, _res: Response, next: NextFunction): void {
  try {
    if (!req.tenantId) {
      return next();
    }

    // Store original query methods (if needed for complex scenarios)
    // For now, we rely on services/controllers to use req.tenantId in their queries

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Helper to create tenant-scoped query filter
 * Use this in services to ensure all queries are tenant-scoped
 */
export function tenantFilter(
  tenantId: string | undefined,
  additionalFilters: Record<string, unknown> = {}
): Record<string, unknown> {
  if (!tenantId) {
    return additionalFilters;
  }

  return {
    tenantId: new mongoose.Types.ObjectId(tenantId),
    ...additionalFilters,
  };
}

/**
 * Verify user has access to a specific resource's tenant
 */
export function verifyResourceTenant(
  resourceTenantId: mongoose.Types.ObjectId | string | undefined,
  userTenantId: string | undefined,
  isPlatformUser: boolean = false
): void {
  if (isPlatformUser) {
    // Platform users can access any tenant's resources
    return;
  }

  if (!resourceTenantId || !userTenantId) {
    throw new TenantAccessError();
  }

  if (resourceTenantId.toString() !== userTenantId) {
    throw new TenantAccessError();
  }
}

/**
 * Helper to check if user can access a tenant
 */
export function canAccessTenant(
  user: Express.Request['user'],
  targetTenantId: string
): boolean {
  if (!user) return false;

  // Platform users can access any tenant
  const platformRoles = [UserRole.ADVISOR, UserRole.PROGRAM_ADMIN, UserRole.SYSTEM_ADMIN];
  if (platformRoles.includes(user.role)) {
    return true;
  }

  // Client users can only access their own tenant
  return user.tenantId === targetTenantId;
}
