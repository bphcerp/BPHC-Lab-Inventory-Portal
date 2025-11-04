import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { ConsumableModel } from '../models/consumable';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { PeopleModel } from '../models/people';
import { authenticateToken } from '../middleware/authenticateToken';
import mongoose from 'mongoose';
import { generateTransactionId } from '../models/consumableTransaction';

const router = express.Router();
router.use(authenticateToken);

// Utility function for async error handling
const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// Updated utility function to generate base reference number with correct financial year
async function generateBaseReferenceNumber(): Promise<string> {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const isAfterApril = currentDate.getMonth() >= 3; // April is month 3 (0-based)
  const financialYear = isAfterApril 
    ? `${currentYear}-${(currentYear + 1).toString().slice(2)}`
    : `${currentYear-1}-${currentYear.toString().slice(2)}`;

const latestTransaction = await ConsumableTransactionModel
    .findOne({
      referenceNumber: {
        $regex: `LAMBDA/UTL/${financialYear}/\\d{3}[A-Z]?$`
      }
    })
    .sort({ referenceNumber: -1 });

  let nextNumber = 1;
  if (latestTransaction) {
    // Extract the number part, ignoring any letter suffix
    const match = latestTransaction.referenceNumber.match(/(\d{3})[A-Z]?$/);
    if (match) {
      nextNumber = parseInt(match[1]) + 1;
    }
  }

  return `LAMBDA/UTL/${financialYear}/${nextNumber.toString().padStart(3, '0')}`;
}

// Function to generate reference numbers for a group of items
async function generateGroupReferenceNumbers(count: number): Promise<string[]> {
  const baseRef = await generateBaseReferenceNumber();
  return Array.from({ length: count }, (_, index) => {
    const suffix = String.fromCharCode(65 + index); // A, B, C, etc.
    return `${baseRef}${suffix}`;
  });
}

// POST /api/consumable/claim/bulk - Bulk claim consumables
router.post(
  '/claim/bulk',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { items, issuedBy, issuedTo } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      res.status(400).json({ 
        success: false,
        message: 'No items provided' 
      });
      return;
    }

    if (!issuedBy || !issuedTo) {
      res.status(400).json({
        success: false,
        message: 'Both issuedBy and issuedTo are required'
      });
      return;
    }

    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const groupTransactionId = generateTransactionId('ISSUE');
        // Generate reference numbers within the transaction
        const referenceNumbers = await generateGroupReferenceNumbers(items.length);
        
        const transactionPromises = items.map(async ({ consumableId, quantity }, index) => {
          const consumable = await ConsumableModel.findById(consumableId).session(session);
          if (!consumable) {
            throw new Error(`Consumable not found: ${consumableId}`);
          }

          const availableQuantity = consumable.quantity - (consumable.claimedQuantity || 0);
          if (availableQuantity < quantity) {
            throw new Error(`Insufficient quantity for ${consumable.consumableName}. Available: ${availableQuantity}, Requested: ${quantity}`);
          }

          await ConsumableModel.findByIdAndUpdate(
            consumableId,
            { $inc: { claimedQuantity: quantity } },
            { session }
          );

          const transaction = new ConsumableTransactionModel({
            transactionId: groupTransactionId,
            referenceNumber: referenceNumbers[index],
            consumableName: consumable.consumableName,
            consumableId: consumable._id,
            transactionQuantity: quantity,
            remainingQuantity: availableQuantity - quantity,
            categoryFields: consumable.categoryFields,
            issuedBy,
            issuedTo,
            transactionType: 'ISSUE'
          });

          await transaction.save({ session });

          return {
            referenceNumber: transaction.referenceNumber,
            consumableName: transaction.consumableName,
            quantity: transaction.transactionQuantity
          };
        });

        const transactions = await Promise.all(transactionPromises);

        res.status(200).json({
          success: true,
          message: 'Consumables issued successfully',
          data: {
            groupTransactionId,
            transactions
          }
        });
      });
    } catch (error) {
      console.error('Bulk claim error:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to process claim'
      });
    } finally {
      await session.endSession();
    }
  })
);


// Keep the original single claim route for backward compatibility
router.post(
  '/claim/:id',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const consumableId = req.params.id;
    const { quantity, issuedBy, issuedTo } = req.body;

    // Redirect to bulk endpoint with single item
    const bulkRequest = {
      items: [{
        consumableId,
        quantity
      }],
      issuedBy,
      issuedTo
    };

    // Forward to bulk handler
    req.body = bulkRequest;
    router.post('/claim/bulk')(req, res, next);
    return
  })
);

export default router;
