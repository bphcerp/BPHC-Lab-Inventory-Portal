import express, { Request, Response } from 'express';
import { ConsumableModel } from '../models/consumable';
import { ConsumableCategoryModel } from '../models/consumableCategory';
import { authenticateToken } from '../middleware/authenticateToken';

const router = express.Router();
router.use(authenticateToken);

// POST /api/consumable
router.post('/', async (req: Request, res: Response) => {
  try {
    const { consumableName, quantity, unitPrice, vendor, date, consumableCategory, categoryFields} = req.body;

    const consumable = new ConsumableModel({
      consumableName,
      quantity,
      unitPrice,
      vendor,
      date,
      consumableCategory,
      categoryFields,
    });

    await consumable.save();
    res.status(201).json(consumable);
  } catch (error) {
    console.error('Error creating consumable:', error);
    res.status(400).json({ message: 'Error creating consumable: ' + (error as Error).message });
  }
});

// GET /api/consumable
router.get('/', async (req: Request, res: Response) => {
  try {
    const consumables = await ConsumableModel.find().populate('vendor consumableCategory');
    res.status(200).json(consumables);
  } catch (error) {
    console.error('Error fetching consumables:', error);
    res.status(500).json({ message: 'Error fetching consumables: ' + (error as Error).message });
  }
});

export default router;