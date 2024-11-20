// consumableDetails.ts
import express, { Request, Response } from 'express';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
router.use(authenticateToken);

// GET /api/consumable-details/:consumableId - Fetch transactions for a specific consumable
router.get('/:consumableId', async (req: Request, res: Response) => {
  try {
    const { consumableId } = req.params;
    
    const transactions = await ConsumableTransactionModel.find({
      consumableName: consumableId
    })
    .sort({ transactionDate: -1 })
    .populate('addedBy', 'name')
    .populate('issuedBy', 'name')
    .populate('issuedTo', 'name');

    const response = transactions.map(transaction => ({
      _id: transaction._id,
      consumableName: transaction.consumableName,
      transactionQuantity: transaction.transactionQuantity,
      remainingQuantity: transaction.remainingQuantity,
      transactionType: transaction.transactionType,
      transactionDate: transaction.transactionDate,
      addedBy: transaction.addedBy,
      issuedBy: transaction.issuedBy,
      issuedTo: transaction.issuedTo,
      categoryFields: transaction.categoryFields
    }));

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching consumable transactions:', error);
    res.status(500).json({ message: 'Error fetching consumable transactions' });
  }
});

export default router;
