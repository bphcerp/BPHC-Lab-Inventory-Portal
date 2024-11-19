import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { VendorModel } from '../models/vendor';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

router.use(authenticateToken);

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Fetch all vendors
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const vendors = await VendorModel.find();
  res.status(200).json(vendors);
}));

// Add a new vendor
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, phone, email } = req.body;

  if (!name || !phone || !email) {
    res.status(400).json({ message: 'All fields are required' });
    return;
  }

  const existingVendor = await VendorModel.findOne({ name });
  if (existingVendor) {
    res.status(400).json({ message: 'Vendor already exists' });
    return;
  }

  const newVendor = new VendorModel({ name, phone, email });
  await newVendor.save();

  res.status(201).json(newVendor);
}));

export default router;
