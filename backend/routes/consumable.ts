import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { ConsumableModel } from '../models/consumable';
import { ConsumableCategoryModel } from '../models/consumableCategory';
import { PeopleModel } from '../models/people';
import { authenticateToken } from '../middleware/authenticateToken';
import mongoose from 'mongoose';
import { IConsumable } from '../models/consumable';
import { ConsumableTransactionModel } from '../models/consumableTransaction';

interface CommentRequest extends Request {
    body: {
        text: string;
    }
}

const router = express.Router();

router.use(authenticateToken);

const asyncHandler = (fn: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler =>
  (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// POST /api/consumable - Add a new consumable
router.post(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { 
      consumableName,
      quantity, 
      unitPrice, 
      vendor, 
      date, 
      categoryFields, 
      addedBy 
    } = req.body;

    if (!consumableName || !quantity || !unitPrice || !addedBy) {
      res.status(400).json({ message: 'Missing required fields' });
      return;
    }

    const person = await PeopleModel.findById(addedBy);
    if (!person) {
      res.status(400).json({ message: 'Invalid addedBy reference' });
      return;
    }

    const category = await ConsumableCategoryModel.findOne({
      consumableName: consumableName,
    });
    if (!category) {
      res.status(400).json({ message: 'Invalid consumable name - category not found' });
      return;
    }

    try {
      const normalizedCategoryFields = categoryFields || {};
      
      const query = {
        consumableName: consumableName,
        unitPrice: Number(unitPrice),
        categoryFields: normalizedCategoryFields
      };

      let savedConsumable = await ConsumableModel.findOneAndUpdate(
        query,
        {
          $inc: { quantity: Number(quantity) },
          $setOnInsert: { claimedQuantity: 0 }, // Initialize claimedQuantity to 0 for new consumables
          $set: {
            vendor: vendor,
            date: date || new Date(),
            addedBy: addedBy,
            updatedAt: new Date()
          }
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true
        }
      );

      const availableQuantity = savedConsumable.quantity - (savedConsumable.claimedQuantity || 0);
      const statusCode = savedConsumable.__v === 0 ? 201 : 200;

       const quantityChange = Number(quantity);
      const transactionType = savedConsumable?.__v === 0 ? 'ADD' : 'UPDATE';

      // Record the transaction
      const transaction = new ConsumableTransactionModel({
        consumableName,
        transactionQuantity: quantityChange,
        remainingQuantity: savedConsumable.quantity,
        vendor: savedConsumable.vendor,
        categoryFields: savedConsumable.categoryFields,
        transactionDate: date || new Date(),
        addedBy,
        transactionType,
      });
      await transaction.save();


     res.status(savedConsumable.__v === 0 ? 201 : 200).json({
  ...savedConsumable.toObject(),
  availableQuantity,
});

    } catch (error: unknown) {
      console.error('Error in consumable creation:', error);
      
      if (error instanceof Error) {
        res.status(500).json({ 
          message: 'Error creating consumable', 
          error: error.message 
        });
      } else {
        res.status(500).json({ 
          message: 'Error creating consumable', 
          error: 'Unknown error' 
        });
      }
    }
  })
);

// GET /api/consumable - Fetch all consumables
router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const consumables = await ConsumableModel.find()
      .populate('vendor')
      .populate('addedBy');

    const consumablesWithFields = await Promise.all(
      consumables.map(async (consumable) => {
        const category = await ConsumableCategoryModel.findOne({
          consumableName: consumable.consumableName,
        });
        
        const consumableObj = consumable.toObject();
        return {
          ...consumableObj,
          categoryDefinition: category,
          // Calculate available quantity (total - claimed)
          availableQuantity: consumableObj.quantity - (consumableObj.claimedQuantity || 0)
        };
      })
    );

    res.status(200).json(consumablesWithFields);
  })
);

// GET /api/consumable/:id - Fetch a specific consumable by ID
router.get(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const consumableId = req.params.id;

    const consumable = await ConsumableModel.findById(consumableId)
      .populate('vendor')
      .populate('addedBy');

    if (!consumable) {
      res.status(404).json({ message: 'Consumable not found' });
      return;
    }

    const category = await ConsumableCategoryModel.findOne({
      consumableName: consumable.consumableName,
    });

    const consumableObj = consumable.toObject();
    res.status(200).json({
      ...consumableObj,
      categoryDefinition: category,
      // Calculate available quantity (total - claimed)
      availableQuantity: consumableObj.quantity - (consumableObj.claimedQuantity || 0)
    });
  })
);

// PUT /api/consumable/:id - Update a consumable
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const consumableId = req.params.id;
    const { consumableName, quantity, unitPrice, vendor, date, categoryFields } = req.body;

    const consumable = await ConsumableModel.findById(consumableId);
    if (!consumable) {
      res.status(404).json({ message: 'Consumable not found' });
      return;
    }

    if (consumableName && consumableName !== consumable.consumableName) {
      const category = await ConsumableCategoryModel.findOne({ consumableName });
      if (!category) {
        res.status(400).json({ message: 'Invalid consumable name - category not found' });
        return;
      }
    }

    // Calculate the new available quantity if quantity is being updated
    if (quantity !== undefined) {
      const newAvailableQuantity = quantity - (consumable.claimedQuantity || 0);
      if (newAvailableQuantity < 0) {
        res.status(400).json({ 
          message: 'Cannot set quantity less than claimed quantity' 
        });
        return;
      }
    }

    consumable.consumableName = consumableName || consumable.consumableName;
    consumable.quantity = quantity || consumable.quantity;
    consumable.unitPrice = unitPrice || consumable.unitPrice;
    consumable.vendor = vendor || consumable.vendor;
    consumable.date = date || consumable.date;
    consumable.categoryFields = categoryFields || consumable.categoryFields;

    const updatedConsumable = await consumable.save();
    
    // Return with calculated available quantity
    const consumableObj = updatedConsumable.toObject();
    res.status(200).json({
      ...consumableObj,
      availableQuantity: consumableObj.quantity - (consumableObj.claimedQuantity || 0)
    });
  })
);


// DELETE /api/consumable/:id - Delete a consumable
router.delete(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const consumableId = req.params.id;

    const consumable = await ConsumableModel.findById(consumableId);
    if (!consumable) {
      res.status(404).json({ message: 'Consumable not found' });
      return;
    }

    await ConsumableModel.findByIdAndDelete(consumableId);
    res.status(200).json({ message: 'Consumable deleted successfully' });
  })
);

// PUT /api/consumable/:id - Update a consumable
router.put(
  '/:id',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const consumableId = req.params.id;
    const { consumableName, quantity, unitPrice, vendor, date, categoryFields } = req.body;

    const consumable = await ConsumableModel.findById(consumableId);
    if (!consumable) {
      res.status(404).json({ message: 'Consumable not found' });
      return;
    }

    if (consumableName && consumableName !== consumable.consumableName) {
      const category = await ConsumableCategoryModel.findOne({ consumableName });
      if (!category) {
        res.status(400).json({ message: 'Invalid consumable name - category not found' });
        return;
      }
    }

    consumable.consumableName = consumableName || consumable.consumableName;
    consumable.quantity = quantity || consumable.quantity;
    consumable.unitPrice = unitPrice || consumable.unitPrice;
    consumable.vendor = vendor || consumable.vendor;
    consumable.date = date || consumable.date;
    consumable.categoryFields = categoryFields || consumable.categoryFields;

    await consumable.save();
    res.status(200).json(consumable);
  })
);

router.get(
  '/',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
    const { vendor } = req.query;

    if (!vendor) {
      res.status(400).json({ message: 'Vendor ID is required' });
      return;
    }

    const consumables = await ConsumableModel.find({ vendor }).populate('vendor addedBy');
    res.status(200).json(consumables);
  })
);

// Add these routes after your existing routes in the same file

router.post(
  '/:id/comments',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const consumableId = req.params.id;
      const { text } = req.body;

      if (!text) {
          res.status(400).json({ message: 'Text is required' });
          return;
      }

      try {
          const updatedConsumable = await ConsumableModel.findByIdAndUpdate(
              consumableId,
              {
                  $push: {
                      comments: {
                          text,
                          createdAt: new Date(),
                      },
                  },
              },
              { new: true, runValidators: true }
          );

          if (!updatedConsumable) {
              res.status(404).json({ message: 'Consumable not found' });
              return;
          }

          res.status(201).json(updatedConsumable);
      } catch (error) {
          console.error('Error adding comment:', error);
          res.status(500).json({ message: 'Error adding comment' });
      }
  })
);


// GET /api/consumable/:id/comments
router.get(
  '/:id/comments',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const consumableId = req.params.id;

      // Find the consumable by its ID and only select the comments field
      const consumable = await ConsumableModel.findById(consumableId)
          .select('comments');

      if (!consumable) {
          res.status(404).json({ message: 'Consumable not found' });
          return;
      }

      // Respond with the comments or an empty array if none exist
      res.status(200).json(consumable.comments || []);
  })
);

// DELETE /api/consumable/:id/comments/:commentId
router.delete(
  '/:id/comments/:commentId',
  asyncHandler(async (req: Request, res: Response): Promise<void> => {
      const { id, commentId } = req.params;

      const updatedConsumable = await ConsumableModel.findByIdAndUpdate(
          id,
          {
              $pull: {
                  comments: { _id: commentId }
              }
          },
          { new: true }
      );

      if (!updatedConsumable) {
          res.status(404).json({ message: 'Consumable not found' });
          return;
      }

      res.status(200).json({ message: 'Comment deleted successfully' });
  })
);

export default router;

