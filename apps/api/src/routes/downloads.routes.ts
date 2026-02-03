/**
 * Public Downloads Routes
 * File downloads with query string token authentication
 * Used for browser-based file downloads where Bearer header isn't available
 */

import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { Artifact } from '../db/models/index.js';
import { config } from '../config/index.js';
import type { AuthTokenPayload } from '@change/shared';

const router = Router();

// Upload directory - can be mapped to Railway volume
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

/**
 * GET /downloads/:id
 * Public file download with token in query string
 * 
 * Query params:
 *   - token: JWT access token (required)
 *   - download: 'true' to force download, otherwise inline display
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { token, download } = req.query;
    
    // Require token in query string
    if (!token || typeof token !== 'string') {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Token required' },
      });
    }
    
    // Verify token
    let decoded: AuthTokenPayload;
    try {
      decoded = jwt.verify(token, config.jwt.secret) as AuthTokenPayload;
    } catch (err) {
      return res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' },
      });
    }
    
    const tenantId = decoded.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'NO_TENANT', message: 'User must belong to a tenant' },
      });
    }
    
    // Find artifact
    const artifact = await Artifact.findOne({ _id: id, tenantId }).lean();
    
    if (!artifact) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'File not found' },
      });
    }
    
    if (artifact.storageType !== 'file' || !artifact.storageKey) {
      return res.status(400).json({
        success: false,
        error: { code: 'NOT_A_FILE', message: 'This document does not have an associated file' },
      });
    }
    
    const filePath = path.join(UPLOAD_DIR, artifact.storageKey);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'FILE_MISSING', message: 'File not found on disk' },
      });
    }
    
    // Set headers for download/view
    const disposition = download === 'true' ? 'attachment' : 'inline';
    res.setHeader('Content-Type', artifact.mimeType || 'application/octet-stream');
    res.setHeader('Content-Disposition', `${disposition}; filename="${artifact.name}"`);
    res.setHeader('Content-Length', artifact.fileSize || 0);
    
    // Stream file
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error) {
    next(error);
  }
});

export default router;
