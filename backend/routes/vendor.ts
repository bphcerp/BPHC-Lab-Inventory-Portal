import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { VendorModel } from '../models/vendor';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

// Apply authenticateToken middleware to all routes in this router
router.use(authenticateToken);

// Utility function for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/vendor - Fetch all vendors
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const vendors = await VendorModel.find();
  res.status(200).json(vendors);
}));

// POST /api/vendor - Create a new vendor
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name } = req.body;

  if (!name) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  const existingVendor = await VendorModel.findOne({ name });
  if (existingVendor) {
    res.status(400).json({ message: 'Vendor already exists' });
    return;
  }

  const newVendor = new VendorModel({ name });
  await newVendor.save();

  res.status(201).json(newVendor);
}));

export default router;
