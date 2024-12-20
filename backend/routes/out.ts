import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { ConsumableModel } from '../models/consumable';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { PeopleModel } from '../models/people';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
// Utility function for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Utility function to generate reference number based on transaction date
async function generateReferenceNumber(transactionDate: Date) {
  const year = transactionDate.getFullYear();
  const month = transactionDate.getMonth(); // 0-11 where 0 is January
  
  // If month is January-March (0-2), use previous year as start
  // If month is April-December (3-11), use current year as start
  const financialYearStart = month <= 2 ? year - 1 : year;
  const financialYearEnd = financialYearStart + 1;
  const financialYear = `${financialYearStart}-${financialYearEnd.toString().slice(2)}`;
  
  // Get the latest transaction count for the specified financial year
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
    const { quantity, issuedBy, issuedTo, issueDate } = req.body;

    // Input validation
    if (!consumableId || !quantity || !issuedBy || !issuedTo|| !issueDate) {
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

    const parsedDate = new Date(issueDate);
    if (isNaN(parsedDate.getTime())) {
      res.status(400).json({ message: 'Invalid issue date format.' });
      return;
    }

    try {
      // Generate reference number using the transaction date
      const referenceNumber = await generateReferenceNumber(parsedDate);

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
        transactionType: 'ISSUE',
        transactionDate: parsedDate
      });

      await transaction.save();

      // Return success response with updated data and populated people information
      res.status(200).json({
        success: true,
        message: 'Consumable issued successfully',
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
