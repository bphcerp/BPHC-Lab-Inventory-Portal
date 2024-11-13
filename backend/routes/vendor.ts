import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { VendorModel } from '../models/vendor';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

router.use(authenticateToken);

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const vendors = await VendorModel.find();
  res.status(200).json(vendors);
}));

router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, comment } = req.body;

  if (!name) {
    res.status(400).json({ message: 'Name is required' });
    return;
  }

  const existingVendor = await VendorModel.findOne({ name });
  if (existingVendor) {
    res.status(400).json({ message: 'Vendor already exists' });
    return;
  }

  const newVendor = new VendorModel({ name, comment });
  await newVendor.save();

  res.status(201).json(newVendor);
}));

export default router;
