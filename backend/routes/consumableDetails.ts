// consumableDetails.ts
import express, { Request, Response } from 'express';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
router.use(authenticateToken);

// GET /api/consumable-details - Fetch transactions for a specific consumable
router.get('/', async (req: Request, res: Response) => {
  try {
    const { consumableName, categoryFields } = req.query;
    
    if (!consumableName) {
      res.status(400).json({ message: 'Consumable name is required' });
      return;
    }

    let query: any = {
      consumableName: consumableName,
      isDeleted: { $ne: true }  // Exclude soft-deleted transactions
    };

    if (categoryFields) {
      try {
        const parsedFields = JSON.parse(categoryFields as string);
        if (parsedFields && Object.keys(parsedFields).length > 0) {
          query.categoryFields = parsedFields;
        }
      } catch (e) {
        res.status(400).json({ message: 'Invalid category fields format' });
        return;
      }
    }

    const transactions = await ConsumableTransactionModel.find(query)
      .sort({ transactionDate: -1 })
      .populate('addedBy', 'name')
      .populate('issuedBy', 'name')
      .populate('issuedTo', 'name');

    const response = transactions.map(transaction => ({
      transactionId: transaction._id,
      consumableName: transaction.consumableName,
      transactionQuantity: transaction.transactionQuantity,
      remainingQuantity: transaction.remainingQuantity,
      transactionType: transaction.transactionType,
      transactionDate: transaction.transactionDate,
      categoryFields: transaction.categoryFields,
      addedBy: transaction.addedBy,
      issuedBy: transaction.issuedBy,
      issuedTo: transaction.issuedTo,
      entryReferenceNumber: transaction.entryReferenceNumber,
      referenceNumber: transaction.referenceNumber 
    }));

    
    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

export default router;
