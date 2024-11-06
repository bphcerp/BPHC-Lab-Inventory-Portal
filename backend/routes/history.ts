import express, { Request, Response } from 'express';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
router.use(authenticateToken);

// GET /api/consumable/history - Fetch transaction logs for consumables
router.get('/history', async (req: Request, res: Response) => {
  try {
    const transactionHistory = await ConsumableTransactionModel.find({}, {
        consumableName: 1,
        transactionQuantity: 1,
        issuerName: 1,
        transactionDate: 1,
        remainingQuantity: 1,
      })
      .sort({ transactionDate: -1 });

    res.status(200).json(transactionHistory);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Error fetching transaction history: ' + (error as Error).message });
  }
});

export default router;