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
      // 1. Find the transaction to be marked as deleted
      const transaction = await ConsumableTransactionModel.findById(_id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // 2. For single ADD transaction
      if (transaction.transactionType === 'ADD') {
        // Mark the transaction as deleted instead of physically removing it
        await ConsumableTransactionModel.findByIdAndUpdate(
          _id,
          { isDeleted: true },
          { session }
        );

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
          // Mark the transaction as deleted instead of physically removing it
          await ConsumableTransactionModel.findByIdAndUpdate(
            tx._id,
            { isDeleted: true },
            { session }
          );

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
        message: 'Transaction(s) marked as deleted successfully'
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


// Update the PUT route in consumableTransaction.ts
router.put(
  '/transaction/edit',
  async (req: Request, res: Response) => {
    const { 
      _id, 
      transactionQuantity, 
      transactionDate,
      entryReferenceNumber,
      referenceNumber,
      transactionType
    } = req.body;

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Find the transaction to be edited
      const transaction = await ConsumableTransactionModel.findById(_id);
      if (!transaction) {
        throw new Error('Transaction not found');
      }

      if (transaction.isDeleted) {
        throw new Error('Cannot edit a deleted transaction');
      }

      // Save original values for reference
      const originalQuantity = transaction.transactionQuantity;
      const quantityDifference = transactionQuantity - originalQuantity;

      // Handle reference number uniqueness checks
      if (transactionType === 'ADD' && entryReferenceNumber !== transaction.entryReferenceNumber) {
        const existingTransaction = await ConsumableTransactionModel.findOne({
          entryReferenceNumber,
          _id: { $ne: _id }
        });
        
        if (existingTransaction) {
          throw new Error('Entry reference number already exists');
        }
      }

      if (transactionType === 'ISSUE' && referenceNumber !== transaction.referenceNumber) {
        // For bulk transactions, we need to check if the reference number follows the expected pattern
        // or if it's being changed to something completely different
        const existingTransaction = await ConsumableTransactionModel.findOne({
          referenceNumber,
          _id: { $ne: _id }
        });
        
        if (existingTransaction) {
          throw new Error('Reference number already exists');
        }
      }

      // Update inventory quantities based on transaction type
      if (transactionType === 'ADD') {
        // Adjust inventory quantity for ADD transactions
        const updatedConsumable = await ConsumableModel.findByIdAndUpdate(
          transaction.consumableId,
          { $inc: { quantity: quantityDifference } },
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
      } else if (transactionType === 'ISSUE') {
        // Check if this is part of a bulk transaction
        const isBulkTransaction = transaction.transactionId.startsWith('TRX-ISS-');
        
        // If it's a bulk transaction, we need to handle it differently
        if (isBulkTransaction) {
          // Adjust claimed quantity for this specific ISSUE transaction
          const updatedConsumable = await ConsumableModel.findByIdAndUpdate(
            transaction.consumableId,
            { $inc: { claimedQuantity: quantityDifference } },
            { 
              session,
              new: true,
              runValidators: true
            }
          );

          if (!updatedConsumable) {
            throw new Error('Consumable not found');
          }

          if (updatedConsumable.claimedQuantity < 0) {
            throw new Error('Cannot reduce claimed quantity below 0');
          }

          if (updatedConsumable.claimedQuantity > updatedConsumable.quantity) {
            throw new Error('Cannot claim more than available quantity');
          }
        } else {
          // Regular single ISSUE transaction
          const updatedConsumable = await ConsumableModel.findByIdAndUpdate(
            transaction.consumableId,
            { $inc: { claimedQuantity: quantityDifference } },
            { 
              session,
              new: true,
              runValidators: true
            }
          );

          if (!updatedConsumable) {
            throw new Error('Consumable not found');
          }

          if (updatedConsumable.claimedQuantity < 0) {
            throw new Error('Cannot reduce claimed quantity below 0');
          }

          if (updatedConsumable.claimedQuantity > updatedConsumable.quantity) {
            throw new Error('Cannot claim more than available quantity');
          }
        }
      }

      // Update the transaction with new values
      const updatedTransaction = await ConsumableTransactionModel.findByIdAndUpdate(
        _id,
        { 
          transactionQuantity,
          referenceNumber: transactionType === 'ISSUE' ? referenceNumber : transaction.referenceNumber,
          entryReferenceNumber: transactionType === 'ADD' ? entryReferenceNumber : transaction.entryReferenceNumber
          // We'll update remainingQuantity after recalculating
        },
        { 
          session,
          new: true,
          runValidators: true
        }
      );

      if (!updatedTransaction) {
        throw new Error('Failed to update transaction');
      }

      // Get the current state of the consumable after our update
      const currentConsumable = await ConsumableModel.findById(transaction.consumableId).session(session);
      if (!currentConsumable) {
        throw new Error('Consumable not found');
      }

      // Find all transactions for this consumable, ordered by date
      // Including the one we just updated
      const allTransactions = await ConsumableTransactionModel.find({
        consumableId: transaction.consumableId,
        isDeleted: false
      })
      .sort({ transactionDate: 1, createdAt: 1 })
      .session(session);

      // Recalculate remaining quantities for all transactions
      let runningQuantity = 0;
      let runningClaimed = 0;

      for (const tx of allTransactions) {
        if (tx.transactionType === 'ADD') {
          runningQuantity += tx.transactionQuantity;
        } else if (tx.transactionType === 'ISSUE') {
          runningClaimed += tx.transactionQuantity;
        }

        // Calculate remaining quantity as the available quantity at this point in time
        const remainingQty = runningQuantity - runningClaimed;
        
        // Update the transaction's remainingQuantity if it's changed
        if (tx.remainingQuantity !== remainingQty) {
          await ConsumableTransactionModel.findByIdAndUpdate(
            tx._id,
            { remainingQuantity: remainingQty },
            { session }
          );
        }
      }

      // Verify that our final calculated values match the current state in the database
      // If they don't, that would indicate a problem with our transaction history
      if (runningQuantity !== currentConsumable.quantity ||
          runningClaimed !== currentConsumable.claimedQuantity) {
        throw new Error('Transaction history does not reconcile with current inventory state');
      }

      await session.commitTransaction();
      res.status(200).json({ 
        message: 'Transaction updated successfully',
        transaction: updatedTransaction
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
