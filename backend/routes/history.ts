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
      { transactionType: 'ADD' }
    )
      .populate('addedBy', 'name')
      // Sort by both date and time in descending order
      .sort({ 
        transactionDate: -1,
        createdAt: -1  // Secondary sort by creation timestamp
      });

    const formattedHistory = addHistory.map(transaction => {
      const issuer = transaction.addedBy as IPeople | null;
    
      return {
        _id: transaction._id,
        transactionId: transaction.transactionId,
        consumableName: transaction.consumableName,
        transactionQuantity: transaction.transactionQuantity,
        addedBy: issuer?.name || 'Unknown',
        // Include both transaction date and creation timestamp
        transactionDate: transaction.transactionDate.toISOString(),
        createdAt: transaction.createdAt?.toISOString(),
        categoryFields: transaction.categoryFields,
        remainingQuantity: transaction.remainingQuantity,
        transactionType: 'ADD',
        isDeleted: transaction.isDeleted || false,
        entryReferenceNumber: transaction.entryReferenceNumber
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
      { transactionType: 'ISSUE' }
    )
      .populate('issuedBy', 'name')
      .populate('issuedTo', 'name')
      // Sort by both date and time in descending order
      .sort({ 
        transactionDate: -1,
        createdAt: -1  // Secondary sort by creation timestamp
      });

    const formattedHistory = issueHistory.map(transaction => {
      const issuer = transaction.issuedBy as IPeople | null;
      const issuedTo = transaction.issuedTo as IPeople | null;
    
      return {
        _id: transaction._id,
        transactionId: transaction.transactionId,
        referenceNumber: transaction.referenceNumber,
        consumableName: transaction.consumableName,
        transactionQuantity: transaction.transactionQuantity,
        issuedToName: issuedTo?.name || 'Unknown',
        issuedByName: issuer?.name || 'Unknown',
        categoryFields: transaction.categoryFields,
        // Include both transaction date and creation timestamp
        transactionDate: transaction.transactionDate.toISOString(),
        createdAt: transaction.createdAt?.toISOString(),
        remainingQuantity: transaction.remainingQuantity,
        transactionType: 'ISSUE',
        isDeleted: transaction.isDeleted || false
      };
    });
    res.status(200).json(formattedHistory);
  } catch (error) {
    console.error('Error fetching issue consumable history:', error);
    res.status(500).json({ message: 'Error fetching issue consumable history: ' + (error as Error).message });
  }
});

export default router;
