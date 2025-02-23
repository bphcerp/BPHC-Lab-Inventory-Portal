import express, { Request, Response } from 'express';
import { ConsumableTransactionModel } from '../models/consumableTransaction';
import { ConsumableModel } from '../models/consumable';
import { authenticateToken } from '../middleware/authenticateToken';
import mongoose from 'mongoose';

const router = express.Router();
router.use(authenticateToken);

router.post(
  '/transaction/delete',
  async (req: Request, res: Response) => {
    const { _id } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // 1. Find the transaction to be deleted
      const transaction = await ConsumableTransactionModel.findById(_id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // 2. For single ADD transaction
      if (transaction.transactionType === 'ADD') {
        // Delete the transaction
        await ConsumableTransactionModel.findByIdAndDelete(_id, { session });

        // Update the specific consumable quantity
        const updatedConsumable = await ConsumableModel.findByIdAndUpdate(
          transaction.consumableId,
          { $inc: { quantity: -transaction.transactionQuantity } },
          { 
            session,
            new: true,
            runValidators: true
          }
        );

        if (!updatedConsumable) {
          throw new Error('Consumable not found');
        }

        if (updatedConsumable.quantity < 0) {
          throw new Error('Cannot reduce quantity below 0');
        }

        if (updatedConsumable.quantity < updatedConsumable.claimedQuantity) {
          throw new Error('Cannot reduce quantity below claimed amount');
        }
      }
      // 3. For bulk ISSUE transactions
      else if (transaction.transactionType === 'ISSUE') {
        // Find all transactions in this bulk operation
        const transactionsToDelete = await ConsumableTransactionModel.find({
          transactionId: transaction.transactionId,
          transactionType: 'ISSUE'
        }).session(session);

        // Process each transaction
        for (const tx of transactionsToDelete) {
          // Delete the transaction
          await ConsumableTransactionModel.findByIdAndDelete(tx._id, { session });

          // Update the specific consumable's claimed quantity
          const updatedConsumable = await ConsumableModel.findByIdAndUpdate(
            tx.consumableId, // Use the specific consumableId
            { $inc: { claimedQuantity: -tx.transactionQuantity } },
            { 
              session,
              new: true,
              runValidators: true
            }
          );

          if (!updatedConsumable) {
            throw new Error(`Consumable not found: ${tx.consumableName}`);
          }

          if (updatedConsumable.claimedQuantity < 0) {
            throw new Error(`Invalid claimed quantity for ${tx.consumableName}`);
          }
        }
      }

      await session.commitTransaction();
      res.status(200).json({ 
        message: 'Transaction(s) deleted successfully'
      });
    } catch (error) {
      await session.abortTransaction();
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: 'An error occurred' });
      }
    } finally {
      session.endSession();
    }
  }
);


export default router;
