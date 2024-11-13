import express, { Request, Response } from 'express';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { authenticateToken } from '../middleware/authenticateToken';
import { IPeople } from '../models/people';

const router = express.Router();
router.use(authenticateToken);

// GET /api/consumable/history - Fetch transaction logs for consumables
router.get('/', async (req: Request, res: Response) => {
  try {
    const transactionHistory = await ConsumableTransactionModel.find(
      { transactionQuantity: { $gt: 0 } } // Only fetch entries with positive transaction quantity
    )
    .populate('issuedBy', 'name')  // Updated from issuerId to issuedBy
    .populate('issuedTo', 'name')  // Updated from issuedToId to issuedTo
    .sort({ transactionDate: -1 });

    // Map the populated results for easier handling in the frontend
    const historyWithNames = transactionHistory.map(transaction => {
      const issuer = transaction.issuedBy as IPeople | null; // Updated from issuerId
      const issuedTo = transaction.issuedTo as IPeople | null; // Updated from issuedToId

      return {
        consumableName: transaction.consumableName,
        transactionQuantity: transaction.transactionQuantity,
        issuedToName: issuedTo?.name || 'Unknown',
        issuedByName: issuer?.name || 'Unknown',
        transactionDate: transaction.transactionDate.toISOString(),
        remainingQuantity: transaction.remainingQuantity,
      };
    });

    res.status(200).json(historyWithNames);
  } catch (error) {
    console.error('Error fetching transaction history:', error);
    res.status(500).json({ message: 'Error fetching transaction history: ' + (error as Error).message });
  }
});

export default router;
