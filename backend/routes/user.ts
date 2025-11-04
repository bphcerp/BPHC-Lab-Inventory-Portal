import { Router, Request, Response } from "express";
import { UserModel } from "../models/user";
import { OAuth2Client } from "google-auth-library";
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireRole } from "../middleware/authenticateToken";

dotenv.config();

const router: Router = Router();

// Get all users (admin only)
router.get('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    // Add access control check with the temporary workaround
    if (!req.user || (req.user.role !== 'admin' && req.user.role !== undefined)) {
      res.status(403).json({ message: 'Access denied. Admin privileges required.' });
      return;
    }
  

    const users = await UserModel.find().select('name email role');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error });
  }
});

// Get current user information - add debugging logs
router.get('/me', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    
    // req.user is set by the authenticateToken middleware
    if (!req.user) {
      res.status(401).json({ message: 'Not authenticated' });
      return;
    }
    
    // Build response with role
    const response = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role || 'admin' // Temporary: default to admin if role is undefined
    };
    
    res.json(response);
  } catch (error) {
    console.error('ME ENDPOINT - Error:', error);
    res.status(500).json({ message: 'Error fetching user data', error });
  }

});

// Create new user (admin only)
router.post('/', authenticateToken, requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role = 'dashboard' } = req.body;

    // Validate role
    if (role !== 'admin' && role !== 'dashboard') {
      res.status(400).json({ message: 'Invalid role. Must be "admin" or "dashboard"' });
      return;
    }

    const existingUser = await UserModel.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: 'User already exists' });
      return;
    }

    const newUser = new UserModel({ name, email, role });
    await newUser.save();

    res.status(201).json(newUser);
  } catch (error) {
    res.status(500).json({ message: 'Error creating user', error });
  }
});

// Update user role (admin only)
router.patch('/:id/role', authenticateToken, requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { role } = req.body;
    
    // Validate role
    if (role !== 'admin' && role !== 'dashboard') {
      res.status(400).json({ message: 'Invalid role. Must be "admin" or "dashboard"' });
      return;
    }
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    );
    
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user role', error });
  }
});

router.post('/logout', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  res.clearCookie('token', {
    secure: process.env.DEPLOYED_STATUS === "true",
    httpOnly: true,
    sameSite: process.env.DEPLOYED_STATUS === "true" ? "none" : "lax",
  });

  res.status(200).json({ message: 'Logged out successfully' });
});

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const credentialResponse = req.body;
  const client = new OAuth2Client();

  try {
    const ticket = await client.verifyIdToken({
      idToken: credentialResponse.credential,
      audience: process.env.OAUTH_CID
    });

    const { name, email } = ticket.getPayload() as any;

    let user = await UserModel.findOne({ email });

    if (!user) {
      res.status(401).send({message : "You are not allowed to login to this portal. Please contact LAMBDA Lab."});
      return;
    }

    if (!user.name) {
      user.name = name;
      await user.save();
    }

    // If user has no role assigned, default to 'admin' temporarily 
    if (!user.role) {
      console.log(`User ${email} has no role, defaulting to 'admin' temporarily`);
      user.role = 'admin';
      // Uncomment this if you want to save this change to DB
      // await user.save(); 
    }

    res.cookie("token", credentialResponse.credential, {
      secure: process.env.DEPLOYED_STATUS === "true",
      httpOnly: true,
      sameSite: process.env.DEPLOYED_STATUS === "true" ? "none" : "lax"
    });
    res.send({message : "Login Successful", role: user.role});
  } catch (error) {
    console.error(error);
    res.status(403).send({message : "Invalid Credentials"});
  }
});

router.post('/passlogin', async (req: Request, res: Response): Promise<void> => {
  const { email, pwd } = req.body;
  const user = await UserModel.findOne({ email }).lean();
  if (!user) {
    res.status(404).send({message: `No user found`});
    return;
  }

  // Don't send password back in the response
  const userWithoutPassword = { ...user, pwd: undefined };
  
  // Temporary fix - if no role, assign admin
  if (!userWithoutPassword.role) {
    userWithoutPassword.role = 'admin';
  }

  if (user.pwd === pwd) {
    const jwtSecretKey = process.env.JWT_SECRET_KEY!;
    const token = jwt.sign(userWithoutPassword, jwtSecretKey);
    res.cookie("token", token, {
      expires: new Date(Date.now() + 3600 * 1000),
      path: "/",
      httpOnly: true,
      secure: process.env.DEPLOYED_STATUS === "true",
      sameSite: process.env.DEPLOYED_STATUS === "true" ? "none" : "lax"
    });
    res.send({message : "Login Successful", role: userWithoutPassword.role});
  }
  else {
    res.status(401).send({message : `Wrong Credentials`});
  }
});

router.put('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, role } = req.body;
    
    // Validate role if it's being updated
    if (role && role !== 'admin' && role !== 'dashboard') {
      res.status(400).json({ message: 'Invalid role. Must be "admin" or "dashboard"' });
      return;
    }
    
    const updatedUser = await UserModel.findByIdAndUpdate(
      req.params.id,
      { name, email, role },
      { new: true }
    );
    
    if (!updatedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
});

router.delete('/:id', authenticateToken, requireRole(['admin']), async (req: Request, res: Response): Promise<void> => {
  try {
    const deletedUser = await UserModel.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error });
  }
});

export default router;
