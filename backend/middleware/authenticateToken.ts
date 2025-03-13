import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { UserModel } from '../models/user';

// Extend Express Request interface to include user information
declare global {
  namespace Express {
    interface Request {
      user?: {
        _id: string;
        name: string;
        email: string;
        role: string;
      };
    }
  }
}

const client = new OAuth2Client(process.env.OAUTH_CID);

export const authenticateToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  // Retrieve token from cookies or Authorization header
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];

  if (!token) {
    res.status(401).json({ authenticated: false, message: 'No token found' });
    return;
  }

  try {
    // First try to verify as JWT token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY!) as any;
      if (decoded && decoded.email) {
        const user = await UserModel.findOne({ email: decoded.email }).lean();
        if (user) {
          req.user = {
            _id: user._id.toString(),
            name: user.name,
            email: user.email,
            role: user.role || 'admin'
          };
          next();
          return;
        }
      }
    } catch (err) {
      // If JWT verification fails, try Google token
      console.log('JWT verification failed, trying Google token');
    }

    // Verify as Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.OAUTH_CID,
    });
    
    const payload = ticket.getPayload();
    if (payload && payload.email) {
      const user = await UserModel.findOne({ email: payload.email }).lean();
      if (user) {
        req.user = {
          _id: user._id.toString(),
          name: user.name || payload.name || '',
          email: user.email,
          role: user.role || 'admin'
        };
        next();
        return;
      }
    }
    
    res.status(401).json({ authenticated: false, message: 'User not found' });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ authenticated: false, message: 'Invalid or expired token' });
  }
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    const userRole = req.user.role || 'admin'; // Apply temporary fix consistently
    
    if (!roles.includes(userRole)) {
      res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.',
        required: roles,
        current: userRole
      });
      return;
    }
    
    console.log('User authenticated:', {
      id: req.user?._id,
      email: req.user?.email,
      role: userRole
    });
    next();
  };
};
