import { Router, Request, Response } from 'express';
import { pool } from '../config/database';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import bcrypt from 'bcrypt';
import { config } from '../config/env';

const router = Router();

// Get user settings
router.get('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    
    const result = await pool.query(
      'SELECT id, name, email, role, created_at, updated_at, last_login FROM users WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
      return;
    }
    
    const user = result.rows[0];
    
    res.json({
      success: true,
      data: {
        profile: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          timezone: 'UTC', // Default for now
          language: 'en', // Default for now
          createdAt: user.created_at,
          updatedAt: user.updated_at,
          lastLogin: user.last_login
        }
      }
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch user profile' }
    });
  }
});

// Update user profile
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, email, timezone, language } = req.body;
    
    // Validate required fields
    if (!name || !email) {
      res.status(400).json({
        success: false,
        error: { message: 'Name and email are required' }
      });
      return;
    }
    
    // Check if email is already taken by another user
    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1 AND id != $2',
      [email, userId]
    );
    
    if (emailCheck.rows.length > 0) {
      res.status(400).json({
        success: false,
        error: { message: 'Email is already taken' }
      });
      return;
    }
    
    // Update user profile
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING id, name, email, role, updated_at',
      [name, email, userId]
    );
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        profile: result.rows[0]
      }
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update user profile' }
    });
  }
});

// Change password
router.put('/password', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validate required fields
    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({
        success: false,
        error: { message: 'All password fields are required' }
      });
      return;
    }
    
    // Check if new passwords match
    if (newPassword !== confirmPassword) {
      res.status(400).json({
        success: false,
        error: { message: 'New passwords do not match' }
      });
      return;
    }
    
    // Validate password strength
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: { message: 'Password must be at least 6 characters long' }
      });
      return;
    }
    
    // Get current user data
    const userResult = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      res.status(404).json({
        success: false,
        error: { message: 'User not found' }
      });
      return;
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValidPassword) {
      res.status(400).json({
        success: false,
        error: { message: 'Current password is incorrect' }
      });
      return;
    }
    
    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, config.bcryptRounds);
    
    // Update password
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, userId]
    );
    
    res.json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to change password' }
    });
  }
});

// Get notification preferences (placeholder - stored in user preferences table)
router.get('/notifications', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // For now, return default settings
    // In a real app, you'd store these in a user_preferences table
    res.json({
      success: true,
      data: {
        notifications: {
          emailNotifications: true,
          orderAlerts: true,
          systemUpdates: false,
          marketingEmails: false
        }
      }
    });
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch notification settings' }
    });
  }
});

// Update notification preferences
router.put('/notifications', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { emailNotifications, orderAlerts, systemUpdates, marketingEmails } = req.body;
    
    // For now, just return success
    // In a real app, you'd store these in a user_preferences table
    res.json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        notifications: {
          emailNotifications,
          orderAlerts,
          systemUpdates,
          marketingEmails
        }
      }
    });
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update notification settings' }
    });
  }
});

// Get system preferences
router.get('/system', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user has admin role
    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { message: 'Access denied. Admin role required.' }
      });
      return;
    }
    
    // Return default system settings
    res.json({
      success: true,
      data: {
        system: {
          dataRetention: '2years',
          backupFrequency: 'daily',
          apiAccess: true
        }
      }
    });
  } catch (error) {
    console.error('Error fetching system settings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch system settings' }
    });
  }
});

// Update system preferences
router.put('/system', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // Check if user has admin role
    if (req.user!.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { message: 'Access denied. Admin role required.' }
      });
      return;
    }
    
    const { dataRetention, backupFrequency, apiAccess } = req.body;
    
    // For now, just return success
    // In a real app, you'd store these in a system_settings table
    res.json({
      success: true,
      message: 'System settings updated successfully',
      data: {
        system: {
          dataRetention,
          backupFrequency,
          apiAccess
        }
      }
    });
  } catch (error) {
    console.error('Error updating system settings:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update system settings' }
    });
  }
});

export default router;