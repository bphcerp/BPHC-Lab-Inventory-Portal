import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { ConsumableModel } from '../models/consumable';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { PeopleModel } from '../models/people';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
router.use(authenticateToken);

// Utility function for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/consumable/claim/:id - Claim a consumable
router.post(
  '/claim/:id',
  asyncHandler(async (req: Request, res: Response) => {
    const consumableId = req.params.id;
    const { quantity, issuedBy, issuedTo } = req.body;

    // Input validation
    if (!consumableId || !quantity || !issuedBy || !issuedTo) {
      res.status(400).json({ 
        message: 'Missing required fields. Please provide consumableId, quantity, issuedBy, and issuedTo.' 
      });
      return;
    }

    if (typeof quantity !== 'number' || quantity <= 0) {
      res.status(400).json({ message: 'Invalid quantity specified.' });
      return;
    }

    // Validate issuedBy and issuedTo references
    const [issuer, recipient] = await Promise.all([
      PeopleModel.findById(issuedBy),
      PeopleModel.findById(issuedTo)
    ]);

    if (!issuer || !recipient) {
      res.status(400).json({ message: 'Invalid issuedBy or issuedTo reference.' });
      return;
    }

    // Find and validate consumable
    const consumable = await ConsumableModel.findById(consumableId);
    if (!consumable) {
      res.status(404).json({ message: 'Consumable not found' });
      return;
    }

    if (consumable.quantity < quantity) {
      res.status(400).json({ message: 'Insufficient quantity available' });
      return;
    }

    try {
      // Update consumable quantities
      const updatedConsumable = await ConsumableModel.findByIdAndUpdate(
        consumableId,
        {
          $inc: { 
            quantity: -quantity,
            claimedQuantity: quantity 
          }
        },
        { new: true }
      );

      if (!updatedConsumable) {
        res.status(404).json({ message: 'Failed to update consumable' });
        return;
      }

      // Create transaction record with all involved people
      const transaction = new ConsumableTransactionModel({
        consumableName: consumable.consumableName,
        transactionQuantity: quantity,
        remainingQuantity: updatedConsumable.quantity,
        issuedBy,
        issuedTo
      });

      await transaction.save();

      // Return success response with updated data and populated people information
      res.status(200).json({
        success: true,
        message: 'Consumable claimed successfully',
        data: {
          consumable: updatedConsumable,
          transaction: await ConsumableTransactionModel.findById(transaction._id)
            .populate('issuedBy')
            .populate('issuedTo')
        }
      });
    } catch (error) {
      console.error('Error updating consumable:', error);
      res.status(500).json({ message: 'Error updating consumable' });
    }
  })
);

export default router;
