import express, { Request, Response } from 'express';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
router.use(authenticateToken);

// GET /api/transactions/person/:personId - Fetch transactions by person
router.get('/person/:personId', async (req: Request, res: Response) => {
  try {
    const personId = req.params.personId;

    // Fetch transactions associated with the person
    const transactions = await ConsumableTransactionModel.find({
      $or: [
        { addedBy: personId },
        { issuedBy: personId },
        { issuedTo: personId },
      ],
    })
      .sort({ transactionDate: -1 }) // Sort by most recent first
      .populate('addedBy', 'name')
      .populate('issuedBy', 'name')
      .populate('issuedTo', 'name');

    // Map transactions to include relevant details
    const response = transactions.map((transaction) => ({
      transactionId: transaction._id,
      consumableName: transaction.consumableName,
      transactionQuantity: transaction.transactionQuantity, // Individual contribution
      remainingQuantity: transaction.remainingQuantity, // Total after transaction
      transactionType: transaction.transactionType,
      transactionDate: transaction.transactionDate,
      categoryFields: transaction.categoryFields,
      addedBy: transaction.addedBy, // Person who added the quantity
      issuedBy: transaction.issuedBy, // Person who issued the quantity (if applicable)
      issuedTo: transaction.issuedTo, // Recipient of the issued quantity (if applicable)
    }));

    res.status(200).json(response);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

export default router;
