import express, { Request, Response } from 'express';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { authenticateToken } from '../middleware/authenticateToken';
import { IPeople } from '../models/people';

const router = express.Router();
router.use(authenticateToken);

// GET /api/consumable/history/add - Fetch logs for "add consumable" transactions
router.get('/add', async (req: Request, res: Response) => {
  try {
    const addHistory = await ConsumableTransactionModel.find(
      { transactionType: 'ADD' } // Fetch only "ADD" transactions
    )
      .populate('addedBy', 'name') // Fetch issuer details
      .sort({ transactionDate: -1 });

    const formattedHistory = addHistory.map(transaction => {
      const issuer = transaction.addedBy as IPeople | null;

      return {
        consumableName: transaction.consumableName,
        transactionQuantity: transaction.transactionQuantity,
        addedBy: issuer?.name || 'Unknown',
        transactionDate: transaction.transactionDate.toISOString(),
        categoryFields: transaction.categoryFields,
        remainingQuantity: transaction.remainingQuantity,
      };
    });

    res.status(200).json(formattedHistory);
  } catch (error) {
    console.error('Error fetching add consumable history:', error);
    res.status(500).json({ message: 'Error fetching add consumable history: ' + (error as Error).message });
  }
});

// GET /api/consumable/history/issue - Fetch logs for "issue consumable" transactions
router.get('/issue', async (req: Request, res: Response) => {
  try {
    const issueHistory = await ConsumableTransactionModel.find(
      { transactionType: 'ISSUE' } // Fetch only "ISSUE" transactions
    )
      .populate('issuedBy', 'name') // Fetch issuer details
      .populate('issuedTo', 'name') // Fetch receiver details
      .sort({ transactionDate: -1 });

    const formattedHistory = issueHistory.map(transaction => {
      const issuer = transaction.issuedBy as IPeople | null;
      const issuedTo = transaction.issuedTo as IPeople | null;

      return {
        referenceNumber: transaction.referenceNumber,
        consumableName: transaction.consumableName,
        transactionQuantity: transaction.transactionQuantity,
        issuedToName: issuedTo?.name || 'Unknown',
        issuedByName: issuer?.name || 'Unknown',
        categoryFields: transaction.categoryFields,
        transactionDate: transaction.transactionDate.toISOString(),
        remainingQuantity: transaction.remainingQuantity,
      };
    });

    res.status(200).json(formattedHistory);
  } catch (error) {
    console.error('Error fetching issue consumable history:', error);
    res.status(500).json({ message: 'Error fetching issue consumable history: ' + (error as Error).message });
  }
});

export default router;
