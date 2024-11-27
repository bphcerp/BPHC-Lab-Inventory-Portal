import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { VendorModel } from '../models/vendor';
import { ConsumableModel } from '../models/consumable';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

router.use(authenticateToken);

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/vendorTransactions/:id/consumables - Fetch consumables by vendor ID
router.get('/:id/consumables', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const vendorId = req.params.id;

  if (!vendorId) {
    res.status(400).json({ message: 'Vendor ID is required' });
    return;
  }

  // Fetch vendor by ID
  const vendor = await VendorModel.findById(vendorId);
  if (!vendor) {
    res.status(404).json({ message: 'Vendor not found' });
    return;
  }

  // Fetch consumables associated with the vendor
  const consumables = await ConsumableModel.find({ vendor: vendor._id }).sort({ date: -1 });

  if (!consumables || consumables.length === 0) {
    res.status(404).json({ message: 'No consumables found for this vendor' });
    return;
  }

  // Calculate statistics
  const totalConsumables = consumables.length;
  const totalQuantity = consumables.reduce((sum, consumable) => sum + consumable.quantity, 0);
  const totalCost = consumables.reduce((sum, consumable) => sum + (consumable.unitPrice * consumable.quantity), 0);
  const mostRecentDate = consumables[0].date;
  const oldestDate = consumables[consumables.length - 1].date;

  // Respond with vendor data and consumables
  res.status(200).json({
    vendorName: vendor.name,
    stats: {
      totalConsumables,
      totalQuantity,
      totalCost,
      mostRecentDate,
      oldestDate,
    },
    consumables,
  });
}));

export default router;
