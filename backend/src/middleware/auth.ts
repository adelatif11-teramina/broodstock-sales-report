import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';
import { pool } from '../config/database';
import { ApiError } from './errorHandler';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    name: string;
  };
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  name: string;
  iat?: number;
  exp?: number;
}

/**
 * Middleware to authenticate JWT tokens
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError('Access token required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      throw new ApiError('Access token required', 401);
    }

    // Verify JWT token
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
    
    if (!decoded.userId) {
      throw new ApiError('Invalid token payload', 401);
    }

    // Fetch user from database to ensure they still exist and get latest info
    const userQuery = `
      SELECT id, name, email, role, last_login 
      FROM users 
      WHERE id = $1
    `;
    
    const result = await pool.query(userQuery, [decoded.userId]);
    
    if (result.rows.length === 0) {
      throw new ApiError('User not found', 401);
    }

    const user = result.rows[0];
    
    // Attach user info to request
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new ApiError('Invalid token', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new ApiError('Token expired', 401));
    } else {
      next(error);
    }
  }
};

/**
 * Middleware to authorize based on user roles
 */
export const authorize = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new ApiError('Authentication required', 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new ApiError('Insufficient permissions', 403));
      return;
    }

    next();
  };
};

/**
 * Optional authentication - doesn't fail if no token provided
 */
export const optionalAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      next();
      return;
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      next();
      return;
    }

    // Try to verify token, but don't fail if invalid
    try {
      const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;
      
      if (decoded.userId) {
        const userQuery = `
          SELECT id, name, email, role, last_login 
          FROM users 
          WHERE id = $1
        `;
        
        const result = await pool.query(userQuery, [decoded.userId]);
        
        if (result.rows.length > 0) {
          const user = result.rows[0];
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            name: user.name,
          };
        }
      }
    } catch (tokenError) {
      // Ignore token errors for optional auth
    }

    next();
  } catch (error) {
    next(error);
  }
};