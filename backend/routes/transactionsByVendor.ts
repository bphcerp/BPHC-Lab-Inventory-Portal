import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { ConsumableModel } from '../models/consumable';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
router.use(authenticateToken);

// Utility function for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.get(
  '/vendor/:vendorId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const vendorId = req.params.vendorId;
    
    // Find all consumables for this vendor with populated fields
    const transactions = await ConsumableModel.find({ vendor: vendorId })
      .sort({ date: -1 }) // Most recent first
      .populate('vendor', 'name email phone') // Populate vendor details
      .populate('addedBy', 'name') // Populate who added the consumable
      .select('consumableName quantity unitPrice totalCost date categoryFields'); // Select relevant fields
    
    if (!transactions.length) {
      res.status(404).json({ 
        message: 'No transactions found for this vendor'
      });
      return;
    }

    // Calculate some useful statistics
    const stats = {
      totalTransactions: transactions.length,
      totalSpent: transactions.reduce((sum, t) => sum + (t.quantity * t.unitPrice), 0),
      uniqueItems: new Set(transactions.map(t => t.consumableName)).size,
      mostRecentTransaction: transactions[0].date,
      oldestTransaction: transactions[transactions.length - 1].date
    };

    res.status(200).json({
      transactions,
      stats
    });
  })
);

export default router;
