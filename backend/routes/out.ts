import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { ConsumableModel } from '../models/consumable';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { PeopleModel } from '../models/people';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
// Utility function for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Utility function to generate reference number
async function generateReferenceNumber() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const nextYear = currentDate.getMonth() >= 3 ? currentYear + 1 : currentYear;
  const financialYear = `${currentYear}-${nextYear.toString().slice(2)}`;
  
  // Get the latest transaction count for the current financial year
  const latestTransaction = await ConsumableTransactionModel
    .findOne({
      referenceNumber: new RegExp(`LAMBDA/UTL/${financialYear}/`)
    })
    .sort({ referenceNumber: -1 });

  let nextNumber = 1;
  if (latestTransaction) {
    const lastNumber = parseInt(latestTransaction.referenceNumber.split('/').pop() || '0');
    nextNumber = lastNumber + 1;
  }

  return `LAMBDA/UTL/${financialYear}/${nextNumber.toString().padStart(3, '0')}`;
}

router.use(authenticateToken);


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

    if (quantity > consumable.quantity - consumable.claimedQuantity) {
      res.status(400).json({ message: 'Not enough available quantity.' });
      return;
    }

    try {
      // Generate reference number
      const referenceNumber = await generateReferenceNumber();

      // Update consumable quantities
      const updatedConsumable = await ConsumableModel.findByIdAndUpdate(
        consumableId,
        {
          $inc: { 
            //quantity: -quantity,
            claimedQuantity: +quantity 
          }
        },
        { new: true }
      );

      if (!updatedConsumable) {
        res.status(404).json({ message: 'Failed to update consumable' });
        return;
      }

      // Create transaction record with reference number
      const transaction = new ConsumableTransactionModel({
        consumableName: consumable.consumableName,
        transactionQuantity: quantity,
        remainingQuantity: consumable.quantity - updatedConsumable.claimedQuantity,
        categoryFields: consumable.categoryFields,
        referenceNumber,
        issuedBy,
        issuedTo,
        transactionType: 'ISSUE'
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
