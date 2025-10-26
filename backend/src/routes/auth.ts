import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { pool } from '../config/database';
import { 
  hashPassword, 
  comparePassword, 
  generateTokenPair, 
  verifyRefreshToken,
  validatePassword,
  extractTokenFromHeader
} from '../utils/auth';
import { ApiError, asyncHandler } from '../middleware/errorHandler';
import { authRateLimiter } from '../middleware/rateLimiter';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Validation schemas
const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(255),
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['viewer', 'editor', 'manager', 'admin']).optional().default('viewer'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

/**
 * POST /api/v1/auth/register
 * Register a new user
 */
router.post('/register', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const validatedData = registerSchema.parse(req.body);
  
  // Validate password strength
  const passwordValidation = validatePassword(validatedData.password);
  if (!passwordValidation.isValid) {
    throw new ApiError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
  }

  // Check if user already exists
  const existingUserQuery = 'SELECT id FROM users WHERE email = $1';
  const existingUser = await pool.query(existingUserQuery, [validatedData.email]);
  
  if (existingUser.rows.length > 0) {
    throw new ApiError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await hashPassword(validatedData.password);

  // Insert new user
  const insertUserQuery = `
    INSERT INTO users (name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, name, email, role, created_at
  `;
  
  const newUser = await pool.query(insertUserQuery, [
    validatedData.name,
    validatedData.email,
    hashedPassword,
    validatedData.role,
  ]);

  const user = newUser.rows[0];

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  
  const tokens = generateTokenPair(tokenPayload);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
      },
      tokens,
    },
  });
}));

/**
 * POST /api/v1/auth/login
 * Authenticate user and return tokens
 */
router.post('/login', authRateLimiter, asyncHandler(async (req: Request, res: Response) => {
  const validatedData = loginSchema.parse(req.body);

  // Find user by email
  const userQuery = `
    SELECT id, name, email, password_hash, role, last_login
    FROM users 
    WHERE email = $1
  `;
  
  const userResult = await pool.query(userQuery, [validatedData.email]);
  
  if (userResult.rows.length === 0) {
    throw new ApiError('Invalid email or password', 401);
  }

  const user = userResult.rows[0];

  // Verify password
  const isPasswordValid = await comparePassword(validatedData.password, user.password_hash);
  
  if (!isPasswordValid) {
    throw new ApiError('Invalid email or password', 401);
  }

  // Update last login
  await pool.query(
    'UPDATE users SET last_login = NOW() WHERE id = $1',
    [user.id]
  );

  // Generate tokens
  const tokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  };
  
  const tokens = generateTokenPair(tokenPayload);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        lastLogin: user.last_login,
      },
      tokens,
    },
  });
}));

/**
 * POST /api/v1/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/refresh', asyncHandler(async (req: Request, res: Response) => {
  const validatedData = refreshTokenSchema.parse(req.body);

  try {
    // Verify refresh token
    const decoded = verifyRefreshToken(validatedData.refreshToken);

    // Fetch current user data from database
    const userQuery = `
      SELECT id, name, email, role
      FROM users 
      WHERE id = $1
    `;
    
    const userResult = await pool.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      throw new ApiError('User not found', 404);
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const tokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };
    
    const tokens = generateTokenPair(tokenPayload);

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        tokens,
      },
    });
  } catch (error) {
    throw new ApiError('Invalid refresh token', 401);
  }
}));

/**
 * POST /api/v1/auth/logout
 * Logout user (client should discard tokens)
 */
router.post('/logout', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  // In a production system, you might want to blacklist the tokens
  // For now, we'll just return success and let the client handle token removal
  
  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

/**
 * GET /api/v1/auth/me
 * Get current user profile
 */
router.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userQuery = `
    SELECT id, name, email, role, created_at, last_login
    FROM users 
    WHERE id = $1
  `;
  
  const userResult = await pool.query(userQuery, [req.user!.id]);
  
  if (userResult.rows.length === 0) {
    throw new ApiError('User not found', 404);
  }

  const user = userResult.rows[0];

  res.json({
    success: true,
    data: {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.created_at,
        lastLogin: user.last_login,
      },
    },
  });
}));

/**
 * PUT /api/v1/auth/profile
 * Update user profile
 */
router.put('/profile', authenticate, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const updateSchema = z.object({
    name: z.string().min(2).max(255).optional(),
    email: z.string().email().max(255).optional(),
  });

  const validatedData = updateSchema.parse(req.body);

  if (Object.keys(validatedData).length === 0) {
    throw new ApiError('No fields to update', 400);
  }

  // Check if email is already taken by another user
  if (validatedData.email) {
    const emailCheckQuery = 'SELECT id FROM users WHERE email = $1 AND id != $2';
    const emailCheck = await pool.query(emailCheckQuery, [validatedData.email, req.user!.id]);
    
    if (emailCheck.rows.length > 0) {
      throw new ApiError('Email already in use', 409);
    }
  }

  // Build dynamic update query
  const updateFields = Object.keys(validatedData);
  const updateValues = Object.values(validatedData);
  const setClause = updateFields.map((field, index) => `${field} = $${index + 1}`).join(', ');
  
  const updateQuery = `
    UPDATE users 
    SET ${setClause}, updated_at = NOW()
    WHERE id = $${updateFields.length + 1}
    RETURNING id, name, email, role, updated_at
  `;

  const result = await pool.query(updateQuery, [...updateValues, req.user!.id]);
  const updatedUser = result.rows[0];

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        updatedAt: updatedUser.updated_at,
      },
    },
  });
}));

export default router;