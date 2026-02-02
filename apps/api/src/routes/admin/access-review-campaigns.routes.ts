/**
 * Access Review Campaign Routes
 * IAM Access Review Campaigns API endpoints
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import {
  IamPermission,
  AccessReviewCampaignStatus,
  SecondLevelDecision,
  RemediationStatus,
  SubjectStatus,
  CampaignDecisionType,
  PrivilegeLevel,
  AccessReviewCampaignAuditAction,
} from '@change/shared';
import {
  authenticate,
  loadIamPermissions,
  requirePermission,
  requireAnyPermission,
  validate,
} from '../../middleware/index.js';
import { AccessReviewCampaign } from '../../db/models/index.js';
import { logIamActionFromRequest } from '../../services/iam-audit.service.js';
import {
  createCampaignSchema,
  updateCampaignSchema,
  submitCampaignSchema,
  approveCampaignSchema,
  remediateCampaignSchema,
  completeCampaignSchema,
  campaignFiltersSchema,
  validateCampaignForSubmission,
} from '../../validators/access-review-campaign.validators.js';

const router = Router();

// =============================================================================
// LIST CAMPAIGNS
// =============================================================================

/**
 * GET /admin/tenants/:tenantId/access-review-campaigns
 * List access review campaigns with filters
 */
router.get(
  '/tenants/:tenantId/access-review-campaigns',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_READ),
  validate(campaignFiltersSchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const {
        page,
        limit,
        status,
        systemName,
        environment,
        reviewType,
        startDate,
        endDate,
        assignedReviewerId,
        search,
        sortBy,
        sortOrder,
      } = req.query as {
        page: number;
        limit: number;
        status?: string;
        systemName?: string;
        environment?: string;
        reviewType?: string;
        startDate?: string;
        endDate?: string;
        assignedReviewerId?: string;
        search?: string;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
      };

      // Build filter
      const filter: Record<string, unknown> = { tenantId };
      
      if (status) filter.status = status;
      if (systemName) filter.systemName = { $regex: systemName, $options: 'i' };
      if (environment) filter.environment = environment;
      if (reviewType) filter.reviewType = reviewType;
      if (assignedReviewerId) filter.assignedReviewerId = assignedReviewerId;
      
      if (startDate || endDate) {
        filter.periodEnd = {};
        if (startDate) (filter.periodEnd as Record<string, Date>).$gte = new Date(startDate);
        if (endDate) (filter.periodEnd as Record<string, Date>).$lte = new Date(endDate);
      }
      
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: 'i' } },
          { systemName: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
        ];
      }

      // Build sort
      const sortField = sortBy || 'createdAt';
      const sortDirection = sortOrder === 'asc' ? 1 : -1;
      const sort: Record<string, 1 | -1> = { [sortField]: sortDirection };

      const skip = (page - 1) * limit;

      const [campaigns, total] = await Promise.all([
        AccessReviewCampaign.find(filter)
          .select('-subjects.items') // Exclude items for list view
          .sort(sort)
          .skip(skip)
          .limit(limit)
          .lean(),
        AccessReviewCampaign.countDocuments(filter),
      ]);

      // Transform _id to id for frontend compatibility
      const transformedCampaigns = campaigns.map(campaign => ({
        ...campaign,
        id: campaign._id?.toString(),
      }));

      res.json({
        success: true,
        data: transformedCampaigns,
        meta: {
          timestamp: new Date().toISOString(),
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: page * limit < total,
            hasPrev: page > 1,
          },
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// GET CAMPAIGN DETAIL
// =============================================================================

/**
 * GET /admin/tenants/:tenantId/access-review-campaigns/:id
 * Get campaign detail with all subjects and items
 */
router.get(
  '/tenants/:tenantId/access-review-campaigns/:id',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Invalid campaign ID' },
        });
      }

      const campaign = await AccessReviewCampaign.findOne({
        _id: id,
        tenantId,
      }).lean();

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Campaign not found' },
        });
      }

      // Transform _id to id for frontend compatibility
      const transformedCampaign = {
        ...campaign,
        id: campaign._id?.toString(),
      };

      res.json({
        success: true,
        data: transformedCampaign,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// CREATE CAMPAIGN
// =============================================================================

/**
 * POST /admin/tenants/:tenantId/access-review-campaigns
 * Create a new access review campaign (draft)
 */
router.post(
  '/tenants/:tenantId/access-review-campaigns',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_WRITE),
  validate(createCampaignSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId } = req.params;
      const data = req.body;

      const campaign = await AccessReviewCampaign.create({
        ...data,
        tenantId,
        status: AccessReviewCampaignStatus.DRAFT,
        createdBy: req.user!.userId,
        createdByEmail: req.user!.email,
      });

      // Audit log
      await logIamActionFromRequest(
        req,
        AccessReviewCampaignAuditAction.CAMPAIGN_CREATED as Parameters<typeof logIamActionFromRequest>[1],
        'AccessReviewCampaign',
        campaign._id.toString(),
        `Created access review campaign: ${campaign.name}`,
        { after: { name: campaign.name, systemName: campaign.systemName, status: campaign.status } }
      );

      // Transform to include id field
      const campaignObj = campaign.toObject();
      const responseData = {
        ...campaignObj,
        id: campaign._id.toString(),
      };

      res.status(201).json({
        success: true,
        data: responseData,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// UPDATE CAMPAIGN
// =============================================================================

/**
 * PUT /admin/tenants/:tenantId/access-review-campaigns/:id
 * Update a campaign (only DRAFT or IN_REVIEW status)
 */
router.put(
  '/tenants/:tenantId/access-review-campaigns/:id',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_WRITE),
  validate(updateCampaignSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, id } = req.params;
      const data = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Invalid campaign ID' },
        });
      }

      const campaign = await AccessReviewCampaign.findOne({
        _id: id,
        tenantId,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Campaign not found' },
        });
      }

      // Only allow updates for DRAFT or IN_REVIEW campaigns
      if (campaign.status !== AccessReviewCampaignStatus.DRAFT &&
          campaign.status !== AccessReviewCampaignStatus.IN_REVIEW) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: 'Can only update campaigns in DRAFT or IN_REVIEW status' 
          },
        });
      }

      const before = {
        name: campaign.name,
        systemName: campaign.systemName,
        status: campaign.status,
      };

      // Update fields
      Object.assign(campaign, data);
      await campaign.save();

      // Audit log
      await logIamActionFromRequest(
        req,
        AccessReviewCampaignAuditAction.CAMPAIGN_UPDATED as Parameters<typeof logIamActionFromRequest>[1],
        'AccessReviewCampaign',
        campaign._id.toString(),
        `Updated access review campaign: ${campaign.name}`,
        { 
          before,
          after: { name: campaign.name, systemName: campaign.systemName, status: campaign.status }
        }
      );

      res.json({
        success: true,
        data: campaign,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// SUBMIT CAMPAIGN
// =============================================================================

/**
 * POST /admin/tenants/:tenantId/access-review-campaigns/:id/submit
 * Submit a campaign for approval (transition to SUBMITTED)
 */
router.post(
  '/tenants/:tenantId/access-review-campaigns/:id/submit',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_WRITE),
  validate(submitCampaignSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, id } = req.params;
      const { reviewerAttestation, reviewerName, reviewerEmail } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Invalid campaign ID' },
        });
      }

      const campaign = await AccessReviewCampaign.findOne({
        _id: id,
        tenantId,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Campaign not found' },
        });
      }

      // Must be in DRAFT or IN_REVIEW status
      if (campaign.status !== AccessReviewCampaignStatus.DRAFT &&
          campaign.status !== AccessReviewCampaignStatus.IN_REVIEW) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: 'Can only submit campaigns in DRAFT or IN_REVIEW status' 
          },
        });
      }

      // Validate campaign has at least one subject with items
      if (!campaign.subjects || campaign.subjects.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Campaign must have at least one subject' },
        });
      }

      // Validate all items have decisions
      const validation = validateCampaignForSubmission(campaign);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Campaign validation failed',
            details: { errors: validation.errors },
          },
        });
      }

      // Check if second-level approval is required
      const hasPrivilegedAccess = campaign.subjects.some(s =>
        s.items.some(i =>
          i.privilegeLevel === PrivilegeLevel.ADMIN ||
          i.privilegeLevel === PrivilegeLevel.SUPER_ADMIN
        )
      );

      const before = { status: campaign.status };

      // Update campaign
      campaign.status = AccessReviewCampaignStatus.SUBMITTED;
      campaign.submittedAt = new Date();
      campaign.approvals = {
        reviewerName,
        reviewerEmail,
        reviewerAttestation,
        reviewerAttestedAt: new Date(),
        secondLevelRequired: hasPrivilegedAccess,
      };

      // Mark all subjects as completed
      campaign.subjects.forEach(subject => {
        subject.status = SubjectStatus.COMPLETED;
        subject.reviewedAt = new Date();
        subject.reviewedBy = new mongoose.Types.ObjectId(req.user!.userId);
      });

      await campaign.save();

      // Audit log
      await logIamActionFromRequest(
        req,
        AccessReviewCampaignAuditAction.CAMPAIGN_SUBMITTED as Parameters<typeof logIamActionFromRequest>[1],
        'AccessReviewCampaign',
        campaign._id.toString(),
        `Submitted access review campaign: ${campaign.name}`,
        { 
          before,
          after: { status: campaign.status, submittedAt: campaign.submittedAt }
        }
      );

      res.json({
        success: true,
        data: campaign,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// APPROVE CAMPAIGN (Second-level)
// =============================================================================

/**
 * POST /admin/tenants/:tenantId/access-review-campaigns/:id/approve
 * Second-level approval for campaigns with privileged access
 */
router.post(
  '/tenants/:tenantId/access-review-campaigns/:id/approve',
  authenticate,
  loadIamPermissions,
  requireAnyPermission(IamPermission.IAM_ACCESS_REVIEW_DECIDE, IamPermission.IAM_CROSS_TENANT),
  validate(approveCampaignSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, id } = req.params;
      const { decision, notes, approverName, approverEmail } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Invalid campaign ID' },
        });
      }

      const campaign = await AccessReviewCampaign.findOne({
        _id: id,
        tenantId,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Campaign not found' },
        });
      }

      // Must be in SUBMITTED status
      if (campaign.status !== AccessReviewCampaignStatus.SUBMITTED) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: 'Can only approve campaigns in SUBMITTED status' 
          },
        });
      }

      // Must require second-level approval
      if (!campaign.approvals?.secondLevelRequired) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'NOT_REQUIRED', 
            message: 'This campaign does not require second-level approval' 
          },
        });
      }

      const before = { status: campaign.status };

      // Update approvals
      campaign.approvals.secondApproverName = approverName;
      campaign.approvals.secondApproverEmail = approverEmail;
      campaign.approvals.secondDecision = decision;
      campaign.approvals.secondDecisionNotes = notes;
      campaign.approvals.secondDecidedAt = new Date();

      if (decision === SecondLevelDecision.APPROVED) {
        campaign.approvedAt = new Date();
        
        // Check if remediation is needed (any REVOKE or MODIFY decisions)
        const needsRemediation = campaign.subjects.some(s =>
          s.items.some(i =>
            i.decision?.decisionType === CampaignDecisionType.REVOKE ||
            i.decision?.decisionType === CampaignDecisionType.MODIFY
          )
        );

        if (needsRemediation) {
          // Keep in SUBMITTED for remediation tracking
          if (campaign.workflow) {
            campaign.workflow.remediationStatus = RemediationStatus.PENDING;
          }
        } else {
          // No remediation needed, complete the campaign
          campaign.status = AccessReviewCampaignStatus.COMPLETED;
          campaign.completedAt = new Date();
        }
      } else {
        // Rejected - return to IN_REVIEW status
        campaign.status = AccessReviewCampaignStatus.IN_REVIEW;
      }

      await campaign.save();

      // Audit log
      const auditAction = decision === SecondLevelDecision.APPROVED
        ? AccessReviewCampaignAuditAction.CAMPAIGN_APPROVED
        : AccessReviewCampaignAuditAction.CAMPAIGN_REJECTED;

      await logIamActionFromRequest(
        req,
        auditAction as Parameters<typeof logIamActionFromRequest>[1],
        'AccessReviewCampaign',
        campaign._id.toString(),
        `${decision === SecondLevelDecision.APPROVED ? 'Approved' : 'Rejected'} access review campaign: ${campaign.name}`,
        { 
          before,
          after: { status: campaign.status, decision }
        }
      );

      res.json({
        success: true,
        data: campaign,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// REMEDIATE CAMPAIGN
// =============================================================================

/**
 * POST /admin/tenants/:tenantId/access-review-campaigns/:id/remediate
 * Record remediation ticket and status
 */
router.post(
  '/tenants/:tenantId/access-review-campaigns/:id/remediate',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_WRITE),
  validate(remediateCampaignSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, id } = req.params;
      const { remediationTicketId, remediationStatus, notes } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Invalid campaign ID' },
        });
      }

      const campaign = await AccessReviewCampaign.findOne({
        _id: id,
        tenantId,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Campaign not found' },
        });
      }

      // Must be in SUBMITTED status with approval
      if (campaign.status !== AccessReviewCampaignStatus.SUBMITTED ||
          campaign.approvals?.secondDecision !== SecondLevelDecision.APPROVED) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: 'Can only remediate approved campaigns in SUBMITTED status' 
          },
        });
      }

      const before = { 
        remediationStatus: campaign.workflow?.remediationStatus,
        remediationTicketId: campaign.workflow?.remediationTicketId,
      };

      // Update workflow
      if (!campaign.workflow) {
        campaign.workflow = {
          dueDate: new Date(),
        };
      }
      campaign.workflow.remediationTicketCreated = true;
      campaign.workflow.remediationTicketId = remediationTicketId;
      campaign.workflow.remediationStatus = remediationStatus;

      if (remediationStatus === RemediationStatus.COMPLETED) {
        campaign.workflow.remediationCompletedAt = new Date();
      }

      await campaign.save();

      // Audit log
      await logIamActionFromRequest(
        req,
        AccessReviewCampaignAuditAction.CAMPAIGN_REMEDIATION_STARTED as Parameters<typeof logIamActionFromRequest>[1],
        'AccessReviewCampaign',
        campaign._id.toString(),
        `Remediation ${remediationStatus} for campaign: ${campaign.name}`,
        { 
          before,
          after: { 
            remediationStatus: campaign.workflow.remediationStatus,
            remediationTicketId: campaign.workflow.remediationTicketId,
            notes,
          }
        }
      );

      res.json({
        success: true,
        data: campaign,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// COMPLETE CAMPAIGN
// =============================================================================

/**
 * POST /admin/tenants/:tenantId/access-review-campaigns/:id/complete
 * Mark campaign as completed after remediation
 */
router.post(
  '/tenants/:tenantId/access-review-campaigns/:id/complete',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_WRITE),
  validate(completeCampaignSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, id } = req.params;
      const { verifiedBy, notes } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Invalid campaign ID' },
        });
      }

      const campaign = await AccessReviewCampaign.findOne({
        _id: id,
        tenantId,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Campaign not found' },
        });
      }

      // Check status - must be SUBMITTED with completed remediation
      if (campaign.status !== AccessReviewCampaignStatus.SUBMITTED) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: 'Can only complete campaigns in SUBMITTED status' 
          },
        });
      }

      // If remediation was required, it must be completed
      if (campaign.workflow?.remediationStatus &&
          campaign.workflow.remediationStatus !== RemediationStatus.COMPLETED &&
          campaign.workflow.remediationStatus !== RemediationStatus.NOT_REQUIRED) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'REMEDIATION_INCOMPLETE', 
            message: 'Remediation must be completed before marking campaign as complete' 
          },
        });
      }

      const before = { status: campaign.status };

      // Complete the campaign
      campaign.status = AccessReviewCampaignStatus.COMPLETED;
      campaign.completedAt = new Date();
      
      if (campaign.workflow) {
        campaign.workflow.verifiedBy = new mongoose.Types.ObjectId(req.user!.userId);
        campaign.workflow.verifiedAt = new Date();
      }

      await campaign.save();

      // Audit log
      await logIamActionFromRequest(
        req,
        AccessReviewCampaignAuditAction.CAMPAIGN_COMPLETED as Parameters<typeof logIamActionFromRequest>[1],
        'AccessReviewCampaign',
        campaign._id.toString(),
        `Completed access review campaign: ${campaign.name}`,
        { 
          before,
          after: { status: campaign.status, completedAt: campaign.completedAt, verifiedBy, notes }
        }
      );

      res.json({
        success: true,
        data: campaign,
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// SMART SUGGESTIONS API
// =============================================================================

/**
 * GET /admin/tenants/:tenantId/access-review-campaigns/:id/suggestions
 * Get AI-powered review suggestions for campaign items
 */
router.get(
  '/tenants/:tenantId/access-review-campaigns/:id/suggestions',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_READ),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Invalid campaign ID' },
        });
      }

      const campaign = await AccessReviewCampaign.findOne({
        _id: id,
        tenantId,
      }).lean();

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Campaign not found' },
        });
      }

      // Generate suggestions based on item characteristics
      const suggestions: Array<{
        itemId: string;
        subjectId: string;
        suggestedDecision: string;
        confidence: 'high' | 'medium' | 'low';
        reasons: string[];
        requiresManualReview: boolean;
        riskScore: number;
      }> = [];

      campaign.subjects?.forEach((subject) => {
        subject.items?.forEach((item) => {
          const reasons: string[] = [];
          let suggestedDecision = CampaignDecisionType.APPROVE;
          let confidence: 'high' | 'medium' | 'low' = 'high';
          let requiresManualReview = false;
          let riskScore = 0;

          // Rule 1: Standard access with public data - low risk, high confidence approve
          if (item.privilegeLevel === PrivilegeLevel.STANDARD ||
              item.privilegeLevel === PrivilegeLevel.READ_ONLY) {
            reasons.push('Standard/read-only access level');
            riskScore += 10;
          }

          // Rule 2: Admin/Super Admin - high risk, requires manual review
          if (item.privilegeLevel === PrivilegeLevel.ADMIN) {
            reasons.push('Admin access requires careful review');
            requiresManualReview = true;
            confidence = 'low';
            riskScore += 60;
          }
          if (item.privilegeLevel === PrivilegeLevel.SUPER_ADMIN) {
            reasons.push('Super Admin access - highest risk level');
            requiresManualReview = true;
            confidence = 'low';
            riskScore += 90;
          }

          // Rule 3: Data classification impact
          if (item.dataClassification === 'public') {
            reasons.push('Public data classification - minimal risk');
            riskScore += 5;
          } else if (item.dataClassification === 'internal') {
            reasons.push('Internal data - standard business access');
            riskScore += 15;
            if (confidence === 'high') confidence = 'medium';
          } else if (item.dataClassification === 'confidential') {
            reasons.push('Confidential data - elevated review needed');
            riskScore += 40;
            confidence = 'medium';
          } else if (item.dataClassification === 'restricted') {
            reasons.push('Restricted data - high-sensitivity access');
            requiresManualReview = true;
            confidence = 'low';
            riskScore += 70;
          }

          // Rule 4: Employment type consideration
          if (subject.employmentType === 'contractor') {
            reasons.push('External contractor - verify access necessity');
            if (confidence === 'high') confidence = 'medium';
            riskScore += 20;
          } else if (subject.employmentType === 'vendor') {
            reasons.push('Vendor access - limited scope recommended');
            requiresManualReview = true;
            riskScore += 30;
          }

          // Rule 5: Grant method
          if (item.grantMethod === 'automatic') {
            reasons.push('Automatically granted - review for appropriateness');
            if (confidence === 'high') confidence = 'medium';
          }

          // Rule 6: Production environment
          if (item.environment === 'production') {
            reasons.push('Production environment access');
            riskScore += 15;
          }

          suggestions.push({
            itemId: item.id?.toString() || `${subject.id}-${item.roleName}`,
            subjectId: subject.id?.toString() || subject.subjectId,
            suggestedDecision,
            confidence,
            reasons,
            requiresManualReview,
            riskScore: Math.min(riskScore, 100), // Cap at 100
          });
        });
      });

      // Sort by risk score (highest first for prioritization)
      suggestions.sort((a, b) => b.riskScore - a.riskScore);

      // Summary statistics
      const summary = {
        totalItems: suggestions.length,
        highConfidence: suggestions.filter(s => s.confidence === 'high').length,
        mediumConfidence: suggestions.filter(s => s.confidence === 'medium').length,
        lowConfidence: suggestions.filter(s => s.confidence === 'low').length,
        requireManualReview: suggestions.filter(s => s.requiresManualReview).length,
        averageRiskScore: suggestions.length > 0
          ? Math.round(suggestions.reduce((sum, s) => sum + s.riskScore, 0) / suggestions.length)
          : 0,
        highRiskItems: suggestions.filter(s => s.riskScore >= 60).length,
      };

      res.json({
        success: true,
        data: {
          suggestions,
          summary,
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// BULK DECISION API
// =============================================================================

/**
 * POST /admin/tenants/:tenantId/access-review-campaigns/:id/bulk-decision
 * Apply decisions to multiple items at once
 */
router.post(
  '/tenants/:tenantId/access-review-campaigns/:id/bulk-decision',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_WRITE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, id } = req.params;
      const { 
        targetType, // 'all' | 'filtered' | 'selected'
        itemIds,    // For 'selected' type
        filter,     // For 'filtered' type
        decision,   // { decisionType, reasonCode, comments }
        skipHighRisk = true,
      } = req.body;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Invalid campaign ID' },
        });
      }

      const campaign = await AccessReviewCampaign.findOne({
        _id: id,
        tenantId,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Campaign not found' },
        });
      }

      // Only allow bulk decisions for DRAFT or IN_REVIEW campaigns
      if (campaign.status !== AccessReviewCampaignStatus.DRAFT &&
          campaign.status !== AccessReviewCampaignStatus.IN_REVIEW) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: 'Can only apply bulk decisions to campaigns in DRAFT or IN_REVIEW status' 
          },
        });
      }

      let processed = 0;
      let skipped = 0;
      const skippedItems: Array<{ itemId: string; reason: string }> = [];

      // Process each subject and item
      campaign.subjects?.forEach((subject) => {
        subject.items?.forEach((item) => {
          const itemId = item.id?.toString() || `${subject.id}-${item.roleName}`;
          
          // Check if item should be included
          let shouldInclude = false;
          
          if (targetType === 'all') {
            shouldInclude = true;
          } else if (targetType === 'selected' && itemIds?.includes(itemId)) {
            shouldInclude = true;
          } else if (targetType === 'filtered' && filter) {
            // Apply filter criteria
            let matchesFilter = true;
            if (filter.privilegeLevel && item.privilegeLevel !== filter.privilegeLevel) {
              matchesFilter = false;
            }
            if (filter.entitlementType && item.entitlementType !== filter.entitlementType) {
              matchesFilter = false;
            }
            if (filter.dataClassification && item.dataClassification !== filter.dataClassification) {
              matchesFilter = false;
            }
            shouldInclude = matchesFilter;
          }
          
          if (!shouldInclude) return;

          // Skip high-risk items if requested
          if (skipHighRisk) {
            const isHighRisk = 
              item.privilegeLevel === PrivilegeLevel.ADMIN ||
              item.privilegeLevel === PrivilegeLevel.SUPER_ADMIN ||
              item.dataClassification === 'restricted';
            
            if (isHighRisk) {
              skipped++;
              skippedItems.push({ itemId, reason: 'High-risk item requires manual review' });
              return;
            }
          }

          // Skip already-decided items
          if (item.decision?.decisionType && 
              item.decision.decisionType !== CampaignDecisionType.PENDING) {
            skipped++;
            skippedItems.push({ itemId, reason: 'Item already has a decision' });
            return;
          }

          // Apply decision
          item.decision = {
            decisionType: decision.decisionType,
            reasonCode: decision.reasonCode,
            comments: decision.comments || 'Bulk decision applied',
            decidedAt: new Date(),
            decidedBy: new mongoose.Types.ObjectId(req.user!.userId),
          };
          
          processed++;
        });
      });

      await campaign.save();

      // Audit log
      await logIamActionFromRequest(
        req,
        AccessReviewCampaignAuditAction.CAMPAIGN_UPDATED as Parameters<typeof logIamActionFromRequest>[1],
        'AccessReviewCampaign',
        campaign._id.toString(),
        `Bulk decision applied to ${processed} items in campaign: ${campaign.name}`,
        { 
          after: { 
            bulkDecision: decision.decisionType,
            itemsProcessed: processed,
            itemsSkipped: skipped,
          }
        }
      );

      res.json({
        success: true,
        data: {
          totalProcessed: processed,
          successful: processed,
          skipped,
          failed: 0,
          skippedItems: skippedItems.slice(0, 20), // Limit to first 20
        },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

// =============================================================================
// DELETE CAMPAIGN (Draft only)
// =============================================================================

/**
 * DELETE /admin/tenants/:tenantId/access-review-campaigns/:id
 * Delete a draft campaign
 */
router.delete(
  '/tenants/:tenantId/access-review-campaigns/:id',
  authenticate,
  loadIamPermissions,
  requirePermission(IamPermission.IAM_ACCESS_REVIEW_WRITE),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tenantId, id } = req.params;

      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          error: { code: 'INVALID_ID', message: 'Invalid campaign ID' },
        });
      }

      const campaign = await AccessReviewCampaign.findOne({
        _id: id,
        tenantId,
      });

      if (!campaign) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Campaign not found' },
        });
      }

      // Only allow deletion of DRAFT campaigns
      if (campaign.status !== AccessReviewCampaignStatus.DRAFT) {
        return res.status(400).json({
          success: false,
          error: { 
            code: 'INVALID_STATUS', 
            message: 'Can only delete campaigns in DRAFT status' 
          },
        });
      }

      await campaign.deleteOne();

      res.json({
        success: true,
        data: { message: 'Campaign deleted successfully' },
        meta: { timestamp: new Date().toISOString() },
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
