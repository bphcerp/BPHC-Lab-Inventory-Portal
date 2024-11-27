import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { ConsumableModel } from '../models/consumable';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();

router.use(authenticateToken);

// Utility function to handle async calls
const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
): RequestHandler =>
  (req, res, next) =>
    Promise.resolve(fn(req, res, next)).catch(next);

// GET /api/vendorTransactions/:vendorName - Fetch consumables for a specific vendor
router.get(
  '/:vendorName',
  asyncHandler(async (req: Request, res: Response) => {
    const { vendorName } = req.params;

    if (!vendorName) {
      return res.status(400).json({ message: 'Vendor name is required' });
    }

    try {
      // Fetch consumables associated with the vendor
      const consumables = await ConsumableModel.find()
        .populate({
          path: 'vendor', // Populate the vendor reference
          match: { name: vendorName }, // Match vendor name
          select: 'name', // Only include the vendor's name in the result
        })
        .sort({ date: -1 });

      // Filter consumables where the vendor matched
      const filteredConsumables = consumables.filter((c) => c.vendor);

      if (!filteredConsumables || filteredConsumables.length === 0) {
        return res
          .status(404)
          .json({ message: `No consumables found for vendor "${vendorName}"` });
      }

      // Prepare detailed consumables and statistics
      const detailedConsumables = filteredConsumables.map((consumable) => ({
        _id: consumable._id,
        consumableName: consumable.consumableName,
        quantity: consumable.quantity,
        date: consumable.date,
        categoryFields: consumable.categoryFields || {},
      }));

      const totalTransactions = detailedConsumables.length;
      const totalSpent = detailedConsumables.reduce((sum, c) => sum + (c.totalCost || 0), 0);
      const uniqueItems = new Set(detailedConsumables.map((c) => c.consumableName)).size;
      const mostRecentTransaction = filteredConsumables[0].date;
      const oldestTransaction = filteredConsumables[filteredConsumables.length - 1].date;

      return res.status(200).json({
        vendorName,
        stats: {
          totalTransactions,
          totalSpent,
          uniqueItems,
          mostRecentTransaction,
          oldestTransaction,
        },
        consumables: detailedConsumables,
      });
    } catch (error) {
      console.error('Error fetching vendor transactions:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  })
);

export default router;
