import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { VendorModel } from '../models/vendor';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

router.use(authenticateToken);

const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Fetch all vendors
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const vendors = await VendorModel.find();
    res.status(200).json(vendors);
  })
);

// Add a new vendor
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
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
  })
);


router.put(
  '/:vendorId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { vendorId } = req.params;
    const { name, phone, email } = req.body;

    if (!name || !phone || !email) {
      res.status(400).json({ message: 'All fields are required for updating' });
      return;
    }

    const vendor = await VendorModel.findOne({ vendorId });
    if (!vendor) {
      res.status(404).json({ message: `Vendor with ID "${vendorId}" not found` });
      return;
    }

    // Update vendor details
    vendor.name = name;
    vendor.phone = phone;
    vendor.email = email;
    await vendor.save();

    res.status(200).json(vendor);
  })
);


// Delete a vendor by name
router.delete(
  '/:vendorName',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { vendorName } = req.params;

    if (!vendorName) {
      res.status(400).json({ message: 'Vendor name is required' });
      return;
    }

    const vendor = await VendorModel.findOne({ name: vendorName });
    if (!vendor) {
      res.status(404).json({ message: `Vendor "${vendorName}" not found` });
      return;
    }

    await VendorModel.deleteOne({ name: vendorName });
    res.status(200).json({ message: `Vendor "${vendorName}" deleted successfully` });
  })
);

export default router;
