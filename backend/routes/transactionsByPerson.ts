import express, { Request, Response } from 'express';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
router.use(authenticateToken);

router.get('/person/:personId', async (req: Request, res: Response) => {
  try {
    const personId = req.params.personId;
    const transactions = await ConsumableTransactionModel.find({
      $or: [
        { addedBy: personId },
        { issuedBy: personId },
        { issuedTo: personId }
      ]
    })
    .sort({ transactionDate: -1 }) // Most recent first
    .populate('addedBy', 'name')
    .populate('issuedBy', 'name')
    .populate('issuedTo', 'name');
    
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching transactions' });
  }
});

export default router;
